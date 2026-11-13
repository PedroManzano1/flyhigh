// Anos escolares na ordem em que o aluno avança. Todo 1º de janeiro o backend
// (AnoEscolarService) passa cada aluno para o item seguinte: o 9º Fundamental vai
// para o 1º Médio e o 3º Médio para "Concluído / Não estudante". Ensino Superior e
// Concluído não mudam. A mesma lista está em AnoEscolarService.ANOS_ESCOLARES.
export const ANOS_ESCOLARES = [
  "1º Ano Fundamental", "2º Ano Fundamental", "3º Ano Fundamental", "4º Ano Fundamental", "5º Ano Fundamental",
  "6º Ano Fundamental", "7º Ano Fundamental", "8º Ano Fundamental", "9º Ano Fundamental",
  "1º Ano Médio", "2º Ano Médio", "3º Ano Médio",
  "Ensino Superior", "Concluído / Não estudante"
];
