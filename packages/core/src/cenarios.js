// Cenários prontos. Cada um é só uma configuração para criarSimulacao().
export const CENARIOS = [
  {
    id: 'deadlock-classico',
    nome: 'Deadlock clássico',
    descricao: 'Quatro carros chegam juntos, cada um ocupa um quadrante e espera o próximo: ciclo fechado.',
    modo: 'com-bloqueio',
    estrategia: 'nenhuma',
    carros: [
      { id: 'A', rota: [1, 2] },
      { id: 'D', rota: [2, 3] },
      { id: 'B', rota: [3, 4] },
      { id: 'C', rota: [4, 1] },
    ],
  },
  {
    id: 'quase-deadlock',
    nome: 'Quase-deadlock',
    descricao: 'Três carros em cadeia. Há espera, mas a cadeia não fecha: o último sai e tudo destrava.',
    modo: 'com-bloqueio',
    estrategia: 'nenhuma',
    carros: [
      { id: 'A', rota: [1, 2] },
      { id: 'C', rota: [2, 3] },
      { id: 'B', rota: [3, 4] },
    ],
  },
  {
    id: 'sem-deadlock',
    nome: 'Sem deadlock',
    descricao: 'Dois carros usam quadrantes diferentes: ninguém disputa recurso.',
    modo: 'normal',
    estrategia: 'nenhuma',
    carros: [
      { id: 'A', rota: [1, 2] },
      { id: 'B', rota: [3, 4] },
    ],
  },
];
