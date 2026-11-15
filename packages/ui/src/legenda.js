import { el } from './dom.js';

const ITENS = [
  ['livre', 'Quadrante livre'],
  ['ocupado', 'Quadrante ocupado (cor do carro)'],
  ['seta-livre', 'Pedido a um quadrante livre'],
  ['seta-ocupada', 'Pedido a um quadrante ocupado'],
  ['bloqueado', 'Carro bloqueado'],
  ['deadlock', 'Quadrante em deadlock'],
];

export function criarLegenda() {
  return el(
    'ul',
    { class: 'legenda', 'aria-label': 'Legenda' },
    ...ITENS.map(([classe, texto]) => el('li', null, el('i', { class: `amostra amostra-${classe}`, 'aria-hidden': 'true' }), texto)),
  );
}
