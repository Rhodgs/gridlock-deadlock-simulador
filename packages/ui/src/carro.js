import { svg } from './dom.js';
import { paletaDoCarro, ROTULO_ESTADO } from './cores.js';

const GRAUS = { N: 0, L: 90, S: 180, O: 270 };
const RODAS = [
  [-22, -24],
  [17, -24],
  [-22, 12],
  [17, 12],
];

/**
 * Carro visto de cima, centrado em (0, 0) e apontando para cima antes da rotação.
 * A letra e o selo de estado NÃO giram junto com a carroceria (sempre legíveis).
 *
 * @param {object} p
 * @param {string} p.id         letra do carro
 * @param {string} [p.cor]      cor própria (hex); senão usa a paleta padrão
 * @param {string} p.estado     aguardando | movimento | bloqueado | concluido
 * @param {number} p.x
 * @param {number} p.y
 * @param {'N'|'L'|'S'|'O'} p.direcao  para onde o carro aponta
 * @param {string} [p.descricao]       texto do tooltip
 */
export function criarCarro({ id, cor, estado = 'movimento', x = 0, y = 0, direcao = 'N', descricao }) {
  const p = paletaDoCarro(id, cor);
  const direcaoGraus = GRAUS[direcao] ?? 0;
  const contraRotacao = -direcaoGraus;

  const corpo = svg(
    'g',
    { class: 'carro-corpo' },
    ...RODAS.map(([rx, ry]) => svg('rect', { x: rx, y: ry, width: 5, height: 12, rx: 1.5, fill: '#14213d' })),
    svg('rect', { class: 'carro-chassi', x: -18, y: -32, width: 36, height: 64, rx: 10, fill: p.fill, stroke: p.borda, 'stroke-width': 2.5 }),
    svg('rect', { x: -13, y: -21, width: 26, height: 11, rx: 3, fill: p.vidro }),
    svg('rect', { x: -13, y: 12, width: 26, height: 9, rx: 3, fill: p.vidro }),
  );

  const letra = svg(
    'text',
    { class: 'carro-letra', x: 0, y: 7, 'text-anchor': 'middle', fill: '#fff', stroke: p.borda, 'stroke-width': 3.5, transform: `rotate(${contraRotacao})` },
    id,
  );

  const selo = criarSelo(estado, contraRotacao);
  const sombra = svg('ellipse', { class: 'carro-sombra', cx: 0, cy: 8, rx: 24, ry: 34, fill: '#14213d', opacity: 0.22 });
  const luzesFreio = svg(
    'g',
    { class: 'luzes-freio' },
    svg('rect', { x: -14, y: 27, width: 8, height: 5, rx: 2 }),
    svg('rect', { x: 6, y: 27, width: 8, height: 5, rx: 2 }),
  );

  return svg(
    'g',
    { class: `carro estado-${estado}`, transform: `translate(${x} ${y}) rotate(${direcaoGraus})`, 'data-carro': id },
    svg('title', null, descricao ?? `Carro ${id}: ${ROTULO_ESTADO[estado] ?? estado}`),
    svg('g', { class: 'carro-anim', transform: 'scale(1.15)' }, sombra, corpo, luzesFreio, letra, selo),
  );
}

function criarSelo(estado, contraRotacao = 0) {
  if (estado === 'bloqueado') {
    return svg(
      'g',
      { class: 'selo selo-bloqueado', transform: `translate(20 -26) rotate(${contraRotacao})` },
      svg('circle', { r: 10, fill: '#f97316', stroke: '#fff', 'stroke-width': 2 }),
      svg('rect', { x: -4.5, y: -5, width: 3, height: 10, fill: '#fff' }),
      svg('rect', { x: 1.5, y: -5, width: 3, height: 10, fill: '#fff' }),
    );
  }
  if (estado === 'concluido') {
    return svg(
      'g',
      { class: 'selo selo-concluido', transform: `translate(20 -26) rotate(${contraRotacao})` },
      svg('circle', { r: 10, fill: '#16a34a', stroke: '#fff', 'stroke-width': 2 }),
      svg('path', { d: 'M-4.5 0.5 L-1.5 3.5 L4.5 -3', fill: 'none', stroke: '#fff', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    );
  }
  return null;
}
