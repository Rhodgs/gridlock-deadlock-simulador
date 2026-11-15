import { svg } from './dom.js';
import { CENTRO, posicaoDoCarro } from './geometria.js';

const VERDE = '#16a34a';
const VERMELHO = '#dc2626';

function marcador(id, cor) {
  return svg(
    'marker',
    { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' },
    svg('path', { d: 'M0 0 L10 5 L0 10 z', fill: cor }),
  );
}

export function criarDefsSetas() {
  return svg('defs', null, marcador('seta-verde', VERDE), marcador('seta-vermelha', VERMELHO));
}

/**
 * Uma seta tracejada do carro até o quadrante que ele pediu.
 * Verde = quadrante livre (carro vai avançar). Vermelha = ocupado (carro espera).
 * Quando o carro faz parte do ciclo de deadlock, a seta ganha a classe "ciclo" (anima).
 */
export function criarSetas(estado) {
  const noCiclo = new Set(estado.deadlock?.ciclo ?? []);
  const grupo = svg('g', { class: 'setas' });

  for (const carro of estado.carros) {
    if (carro.espera === null || carro.estado === 'concluido') continue;
    const dono = estado.quadrantes[carro.espera - 1]?.ocupadoPor ?? null;
    const ocupado = dono !== null && dono !== carro.id;

    const origem = posicaoDoCarro(carro);
    const destino = CENTRO[carro.espera];
    const dx = destino.x - origem.x;
    const dy = destino.y - origem.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 70) continue;
    const ux = dx / dist;
    const uy = dy / dist;
    const folga = 34; // fica no vão entre as carrocerias

    grupo.append(
      svg('line', {
        class: `seta ${ocupado ? 'bloqueada' : 'livre'}${noCiclo.has(carro.id) ? ' ciclo' : ''}`,
        x1: origem.x + ux * folga,
        y1: origem.y + uy * folga,
        x2: destino.x - ux * folga,
        y2: destino.y - uy * folga,
        stroke: ocupado ? VERMELHO : VERDE,
        'stroke-width': 4,
        'stroke-dasharray': '7 5',
        'stroke-linecap': 'round',
        'marker-end': `url(#${ocupado ? 'seta-vermelha' : 'seta-verde'})`,
      }),
    );
  }
  return grupo;
}
