package com.example.backend.service;

import com.example.backend.model.BlocoContrato;
import com.example.backend.model.ModeloContrato;
import com.example.backend.model.TestemunhaContrato;
import com.example.backend.repository.ContratoRepository;
import com.example.backend.repository.ModeloContratoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Modelos de contrato com versões. Fluxo: criar nova versão (cópia da vigente, como
 * rascunho) → editar → publicar. Publicar arquiva a versão anterior; versão publicada
 * nunca muda. Contratos novos usam a vigente; os antigos ficam na versão deles.
 */
@Service
public class ModeloContratoService {

    private static final Logger log = LoggerFactory.getLogger(ModeloContratoService.class);

    public static final List<String> TIPOS = List.of("NORMAL", "VIP");

    // Mesma lista de frontend/src/utils/modeloContrato.js (VARIAVEIS)
    public static final Set<String> VARIAVEIS = Set.of(
            "ESCOLA_RAZAO_SOCIAL", "ESCOLA_CNPJ", "ESCOLA_ENDERECO", "ESCOLA_CIDADE", "ESCOLA_COMARCA",
            "VALOR_HORA_AULA", "CLAUSULA_FINANCEIRA");

    private static final Set<String> SECOES = Set.of(
            BlocoContrato.ABERTURA, BlocoContrato.ANTES_VALORES, BlocoContrato.DEPOIS_VALORES);
    private static final Set<String> TIPOS_BLOCO = Set.of(BlocoContrato.CLAUSULA, BlocoContrato.PARAGRAFO);
    private static final Pattern VARIAVEL = Pattern.compile("\\{([A-Z_]+)\\}");

    @Autowired
    private ModeloContratoRepository modeloRepo;

    @Autowired
    private ContratoRepository contratoRepo;

    // --- Versão 1 e contratos antigos ----------------------------------------

    /**
     * Na primeira vez cria a versão 1 de cada tipo com o texto original; em toda
     * subida liga à versão vigente os contratos que ainda não têm modelo.
     */
    @Transactional
    public void garantirModelosIniciais() {
        for (String tipo : TIPOS) {
            if (modeloRepo.contarPorTipo(tipo) == 0) {
                ModeloContrato v1 = ModeloContratoPadrao.criar(tipo);
                v1.setVersao(1);
                v1.setStatus(ModeloContrato.VIGENTE);
                v1.setDescricaoAlteracao("Texto original dos contratos da escola");
                v1.setCriadoEm(LocalDateTime.now());
                v1.setCriadoPor("sistema");
                v1.setPublicadoEm(LocalDateTime.now());
                v1.setPublicadoPor("sistema");
                modeloRepo.save(v1);
                log.info("Modelo de contrato {} criado (versão 1)", tipo);
            }
        }

        // Contratos feitos antes dos modelos existirem ficam na versão vigente de agora,
        // que na primeira subida é a 1 (o mesmo texto com que foram impressos)
        for (String tipo : TIPOS) {
            Optional<ModeloContrato> vigente = vigente(tipo);
            if (vigente.isEmpty()) continue;
            int ligados = contratoRepo.ligarAoModeloSemModelo(vigente.get().getIdModeloContrato(), tipo);
            if ("NORMAL".equals(tipo)) {
                ligados += contratoRepo.ligarAoModeloSemTipo(vigente.get().getIdModeloContrato());
            }
            if (ligados > 0) log.info("{} contrato(s) {} ligados ao modelo vigente", ligados, tipo);
        }
    }

    // --- Consulta ------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ModeloContrato> listar() {
        List<ModeloContrato> modelos = modeloRepo.listarTodos();
        modelos.forEach(m -> m.setContratosVinculados(contratoRepo.contarPorModelo(m.getIdModeloContrato())));
        return modelos;
    }

    @Transactional(readOnly = true)
    public ModeloContrato buscar(Long id) {
        return modeloRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Modelo de contrato não encontrado."));
    }

    @Transactional(readOnly = true)
    public Optional<ModeloContrato> vigente(String tipo) {
        return modeloRepo.findByTipoEStatus(normalizarTipo(tipo), ModeloContrato.VIGENTE).stream().findFirst();
    }

    /** Id da versão que um contrato novo deste tipo deve usar. */
    public Long idVigente(String tipo) {
        return vigente(tipo).map(ModeloContrato::getIdModeloContrato).orElse(null);
    }

    // --- Edição --------------------------------------------------------------

    /** Copia uma versão (normalmente a vigente) para um rascunho novo. */
    @Transactional
    public ModeloContrato novaVersao(Long idBase) {
        ModeloContrato base = buscar(idBase);
        String tipo = base.getTipoContrato();

        modeloRepo.findByTipoEStatus(tipo, ModeloContrato.RASCUNHO).stream().findFirst().ifPresent(r -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Já existe a versão " + r.getVersao() + " em edição para o contrato " + tipo
                            + ". Continue nela ou descarte-a antes de começar outra.");
        });

        ModeloContrato nova = new ModeloContrato();
        nova.setTipoContrato(tipo);
        nova.setVersao(modeloRepo.maiorVersao(tipo) + 1);
        nova.setStatus(ModeloContrato.RASCUNHO);
        nova.setCriadoEm(LocalDateTime.now());
        nova.setCriadoPor(usuarioLogado());
        copiarTexto(base, nova);
        return modeloRepo.save(nova);
    }

    @Transactional
    public ModeloContrato salvarRascunho(Long id, ModeloContrato dados) {
        ModeloContrato rascunho = buscar(id);
        exigirRascunho(rascunho);
        if (dados == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o texto do modelo.");
        }
        copiarTexto(dados, rascunho);
        rascunho.setDescricaoAlteracao(limpar(dados.getDescricaoAlteracao()));
        validarEstrutura(rascunho);
        return modeloRepo.save(rascunho);
    }

    /** Publica o rascunho: ele passa a valer para contratos novos e o anterior é arquivado. */
    @Transactional
    public ModeloContrato publicar(Long id) {
        ModeloContrato rascunho = buscar(id);
        exigirRascunho(rascunho);
        validarEstrutura(rascunho);
        validarParaPublicar(rascunho);

        for (ModeloContrato anterior : modeloRepo.findByTipoEStatus(rascunho.getTipoContrato(), ModeloContrato.VIGENTE)) {
            anterior.setStatus(ModeloContrato.ARQUIVADO);
            modeloRepo.save(anterior);
        }

        rascunho.setStatus(ModeloContrato.VIGENTE);
        rascunho.setPublicadoEm(LocalDateTime.now());
        rascunho.setPublicadoPor(usuarioLogado());
        log.info("Modelo de contrato {} versão {} publicado por {}",
                rascunho.getTipoContrato(), rascunho.getVersao(), rascunho.getPublicadoPor());
        return modeloRepo.save(rascunho);
    }

    @Transactional
    public void descartar(Long id) {
        ModeloContrato rascunho = buscar(id);
        exigirRascunho(rascunho);
        modeloRepo.delete(rascunho);
    }

    // --- Regras --------------------------------------------------------------

    private void exigirRascunho(ModeloContrato modelo) {
        if (!ModeloContrato.RASCUNHO.equals(modelo.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A versão " + modelo.getVersao() + " já foi publicada e não pode ser alterada. "
                            + "Crie uma nova versão para mudar o texto.");
        }
    }

    /** Copia todo o texto editável; tipo, versão, status e datas ficam de fora. */
    private void copiarTexto(ModeloContrato origem, ModeloContrato destino) {
        destino.setTitulo(limpar(origem.getTitulo()));
        destino.setSubtitulo(limpar(origem.getSubtitulo()));
        destino.setEscolaRazaoSocial(limpar(origem.getEscolaRazaoSocial()));
        destino.setEscolaCnpj(limpar(origem.getEscolaCnpj()));
        destino.setEscolaEndereco(limpar(origem.getEscolaEndereco()));
        destino.setEscolaCidade(limpar(origem.getEscolaCidade()));
        destino.setEscolaComarca(limpar(origem.getEscolaComarca()));
        destino.setPreambulo(limpar(origem.getPreambulo()));
        destino.setRotuloAssinaturaContratante(limpar(origem.getRotuloAssinaturaContratante()));
        destino.setRotuloAssinaturaContratada(limpar(origem.getRotuloAssinaturaContratada()));

        // Listas novas: o rascunho não pode dividir objetos com a versão de origem
        List<BlocoContrato> blocos = new ArrayList<>();
        if (origem.getBlocos() != null) {
            for (BlocoContrato b : origem.getBlocos()) {
                if (b == null) continue;
                blocos.add(new BlocoContrato(b.getSecao(), b.getTipo(), b.getTexto() == null ? "" : b.getTexto().trim()));
            }
        }
        List<TestemunhaContrato> testemunhas = new ArrayList<>();
        if (origem.getTestemunhas() != null) {
            for (TestemunhaContrato t : origem.getTestemunhas()) {
                if (t == null || (limpar(t.getNome()) == null && limpar(t.getDocumento()) == null)) continue;
                testemunhas.add(new TestemunhaContrato(limpar(t.getNome()), limpar(t.getDocumento())));
            }
        }
        destino.getBlocos().clear();
        destino.getBlocos().addAll(blocos);
        destino.getTestemunhas().clear();
        destino.getTestemunhas().addAll(testemunhas);
    }

    /** Vale também para rascunho: seção e tipo conhecidos e nenhuma variável inventada. */
    private void validarEstrutura(ModeloContrato m) {
        for (BlocoContrato b : m.getBlocos()) {
            if (!SECOES.contains(b.getSecao())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seção de cláusula inválida: " + b.getSecao());
            }
            if (!TIPOS_BLOCO.contains(b.getTipo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de bloco inválido: " + b.getTipo());
            }
        }

        Set<String> desconhecidas = new LinkedHashSet<>();
        List<String> textos = new ArrayList<>(List.of(
                nulo(m.getTitulo()), nulo(m.getSubtitulo()), nulo(m.getPreambulo()),
                nulo(m.getRotuloAssinaturaContratante()), nulo(m.getRotuloAssinaturaContratada())));
        m.getBlocos().forEach(b -> textos.add(nulo(b.getTexto())));
        for (String texto : textos) {
            Matcher v = VARIAVEL.matcher(texto);
            while (v.find()) {
                if (!VARIAVEIS.contains(v.group(1))) desconhecidas.add("{" + v.group(1) + "}");
            }
        }
        if (!desconhecidas.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Variável que o sistema não conhece: " + String.join(", ", desconhecidas)
                            + ". Use os botões de variáveis do editor.");
        }
    }

    /** Só na publicação: o que vai para o papel precisa estar completo. */
    private void validarParaPublicar(ModeloContrato m) {
        exigir(m.getTitulo(), "o título");
        exigir(m.getEscolaRazaoSocial(), "a razão social da escola");
        exigir(m.getEscolaCnpj(), "o CNPJ da escola");
        exigir(m.getEscolaCidade(), "a cidade (vai na linha da data)");
        exigir(m.getPreambulo(), "o preâmbulo");

        if (m.getBlocos().stream().noneMatch(b -> BlocoContrato.CLAUSULA.equals(b.getTipo()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O contrato precisa ter pelo menos uma cláusula.");
        }
        for (int i = 0; i < m.getBlocos().size(); i++) {
            if (limpar(m.getBlocos().get(i).getTexto()) == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Existe uma cláusula ou parágrafo sem texto (item " + (i + 1) + "). Preencha ou remova antes de publicar.");
            }
        }
        for (TestemunhaContrato t : m.getTestemunhas()) {
            if (limpar(t.getNome()) == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Toda testemunha precisa de nome.");
            }
        }
    }

    private void exigir(String valor, String campo) {
        if (limpar(valor) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preencha " + campo + " antes de publicar.");
        }
    }

    private String normalizarTipo(String tipo) {
        return tipo == null || tipo.isBlank() ? "NORMAL" : tipo.trim().toUpperCase();
    }

    private String usuarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getName() != null ? auth.getName() : "sistema";
    }

    private static String nulo(String texto) {
        return texto == null ? "" : texto;
    }

    private static String limpar(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
