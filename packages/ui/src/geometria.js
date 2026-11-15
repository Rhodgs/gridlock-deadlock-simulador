// Coordenadas do cruzamento (viewBox 600 x 600). Quadrantes: Q1 sup. esq., Q2 sup. dir.,
// Q3 inf. dir., Q4 inf. esq. (sentido horário, igual ao CONTRATO.md).

export const VIEW = 600;

export const CENTRO = {
  1: { x: 250, y: 250 },
  2: { x: 350, y: 250 },
  3: { x: 350, y: 350 },
  4: { x: 250, y: 350 },
};

// Onde o carro espera antes de entrar no quadrante e para onde ele vai ao sair.
export const ENTRADA = {
  1: { x: 250, y: 95, direcao: 'S' },
  2: { x: 505, y: 250, direcao: 'O' },
  3: { x: 350, y: 505, direcao: 'N' },
  4: { x: 95, y: 350, direcao: 'L' },
};
export const SAIDA = {
  1: { x: 95, y: 250, direcao: 'O' },
  2: { x: 350, y: 95, direcao: 'N' },
  3: { x: 505, y: 350, direcao: 'L' },
  4: { x: 250, y: 505, direcao: 'S' },
};

export function direcaoEntre(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'L' : 'O';
  return dy >= 0 ? 'S' : 'N';
}

/** Quadrante que o carro quer agora (pedido explícito ou próximo da rota). */
export function alvoDoCarro(carro) {
  if (carro.espera !== null && carro.espera !== undefined) return carro.espera;
  if (carro.estado === 'concluido') return null;
  const atual = carro.segura.at(-1);
  if (atual === undefined) return carro.rota[0] ?? null;
  const i = carro.rota.indexOf(atual);
  return i >= 0 ? (carro.rota[i + 1] ?? null) : null;
}

/** Posição e direção do carro no desenho, deduzidas só do estado. */
export function posicaoDoCarro(carro) {
  if (carro.estado === 'concluido') {
    const s = SAIDA[carro.rota.at(-1)];
    return { x: s.x, y: s.y, direcao: s.direcao };
  }
  const atual = carro.segura.at(-1);
  if (atual === undefined) {
    const e = ENTRADA[carro.rota[0]];
    return { x: e.x, y: e.y, direcao: e.direcao };
  }
  const alvo = alvoDoCarro(carro);
  const direcao = alvo ? direcaoEntre(CENTRO[atual], CENTRO[alvo]) : SAIDA[atual].direcao;
  return { ...CENTRO[atual], direcao };
}
