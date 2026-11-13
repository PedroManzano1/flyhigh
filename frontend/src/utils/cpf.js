// CPF: máscara, comparação só por números e validação dos dígitos verificadores.
// A mesma validação está em UsuarioService.cpfValido no backend.

export function somenteNumeros(texto) {
  return String(texto || '').replace(/\D/g, '');
}

// "52998224725" -> "529.982.247-25", aceitando o número ainda pela metade
export function formatarCpf(texto) {
  const n = somenteNumeros(texto).slice(0, 11);
  return n
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function cpfValido(texto) {
  const cpf = somenteNumeros(texto);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let posicao = 9; posicao <= 10; posicao++) {
    let soma = 0;
    for (let i = 0; i < posicao; i++) soma += Number(cpf[i]) * (posicao + 1 - i);
    if ((soma * 10) % 11 % 10 !== Number(cpf[posicao])) return false;
  }
  return true;
}

export function mesmoCpf(a, b) {
  const x = somenteNumeros(a);
  return x.length === 11 && x === somenteNumeros(b);
}
