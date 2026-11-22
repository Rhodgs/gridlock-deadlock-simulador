// Coordenadas do cruzamento (viewBox 1200 x 560). Quadrantes: Q1 sup. esq., Q2 sup. dir.,
// Q3 inf. dir., Q4 inf. esq. (sentido horário, igual ao CONTRATO.md).

export const VIEW = 1200;
export const VIEW_HEIGHT = 560;
export const VIEW_Y = 70;
export const QUADRANTE_LADO = 100;
export const CRUZAMENTO_LADO = QUADRANTE_LADO * 2;
export const RUA_LARGURA = CRUZAMENTO_LADO;
export const DESLOCAMENTO_PISTA = QUADRANTE_LADO / 2;

export const CENTRO = {
  1: { x: 550, y: 300 },
  2: { x: 650, y: 300 },
  3: { x: 650, y: 400 },
  4: { x: 550, y: 400 },
};

// Onde o carro espera antes de entrar no quadrante e para onde ele vai ao sair.
export const ENTRADA = {
  1: { x: 550, y: 170, direcao: 'S' },
  2: { x: 790, y: 300, direcao: 'O' },
  3: { x: 650, y: 530, direcao: 'N' },
  4: { x: 410, y: 400, direcao: 'L' },
};
export const SAIDA = {
  1: { x: 110, y: 300, direcao: 'O' },
  2: { x: 650, y: 110, direcao: 'N' },
  3: { x: 1090, y: 400, direcao: 'L' },
  4: { x: 550, y: 590, direcao: 'S' },
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
  const atual = carro.segura[0];
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
  const atual = carro.segura[0]; // o primeiro quadrante é onde o carro está (os demais são reservas)
  if (atual === undefined) {
    const e = ENTRADA[carro.rota[0]];
    return { x: e.x, y: e.y, direcao: e.direcao };
  }
  const alvo = alvoDoCarro(carro);
  const direcao = alvo ? direcaoEntre(CENTRO[atual], CENTRO[alvo]) : SAIDA[atual].direcao;
  return { ...CENTRO[atual], direcao };
}
