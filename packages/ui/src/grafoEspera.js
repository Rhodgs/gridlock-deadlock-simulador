import { svg, el } from './dom.js';
import { paletaDoCarro } from './cores.js';
import { criarJanela } from './janela.js';

const R_NO = 16;
const CINZA = '#6b7280';
const VERMELHO = '#dc2626';

function marcador(id, cor) {
  return svg(
    'marker',
    { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' },
    svg('path', { d: 'M0 0 L10 5 L0 10 z', fill: cor }),
  );
}

/** Grafo de espera: cada seta "X → Y" significa "X espera um quadrante que Y segura". */
export function criarGrafoEspera(estado) {
  const n = estado.carros.length;
  const pos = new Map(
    estado.carros.map((c, i) => {
      const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
      return [c.id, { x: 90 + 56 * Math.cos(ang), y: 90 + 56 * Math.sin(ang), carro: c }];
    }),
  );

  const ciclo = estado.deadlock?.ciclo ?? [];
  const arestaNoCiclo = (a, b) => ciclo.some((id, i) => id === a && ciclo[(i + 1) % ciclo.length] === b);

  const arestas = [];
  for (const c of estado.carros) {
    if (c.espera === null) continue;
    const dono = estado.quadrantes[c.espera - 1]?.ocupadoPor;
    if (!dono || dono === c.id) continue;
    const a = pos.get(c.id);
    const b = pos.get(dono);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const ux = dx / d;
    const uy = dy / d;
    const ini = { x: a.x + ux * R_NO, y: a.y + uy * R_NO };
    const fim = { x: b.x - ux * (R_NO + 3), y: b.y - uy * (R_NO + 3) };
    const ctrl = { x: (ini.x + fim.x) / 2 - uy * 14, y: (ini.y + fim.y) / 2 + ux * 14 }; // curva evita sobrepor ida e volta
    const vermelha = arestaNoCiclo(c.id, dono);
    arestas.push(
      svg('path', {
        class: `aresta${vermelha ? ' ciclo' : ''}`,
        d: `M${ini.x} ${ini.y} Q${ctrl.x} ${ctrl.y} ${fim.x} ${fim.y}`,
        fill: 'none',
        stroke: vermelha ? VERMELHO : CINZA,
        'stroke-width': vermelha ? 3.5 : 2.5,
        'marker-end': `url(#${vermelha ? 'grafo-seta-r' : 'grafo-seta-n'})`,
      }),
    );
  }

  const nos = [...pos.entries()].map(([id, { x, y, carro }]) => {
    const p = paletaDoCarro(id, carro.cor);
    return svg(
      'g',
      { class: 'no' },
      svg('circle', { cx: x, cy: y, r: R_NO, fill: p.fill, stroke: p.borda, 'stroke-width': 2.5 }),
      svg('text', { x, y: y + 5, 'text-anchor': 'middle', fill: '#fff', stroke: p.borda, 'stroke-width': 3, class: 'no-letra' }, id),
    );
  });

  const desenho = svg(
    'svg',
    { class: 'grafo', viewBox: '0 0 180 180', role: 'img', 'aria-label': 'Grafo de espera entre os carros' },
    svg('defs', null, marcador('grafo-seta-n', CINZA), marcador('grafo-seta-r', VERMELHO)),
    ...arestas,
    ...nos,
  );

  const legenda = estado.deadlock?.detectado
    ? el('p', { class: 'grafo-legenda alerta' }, `Ciclo: ${[...ciclo, ciclo[0]].join(' → ')}`)
    : el('p', { class: 'grafo-legenda' }, arestas.length ? 'Há espera, mas sem ciclo.' : 'Ninguém espera ninguém.');

  return criarJanela('Grafo de espera', [desenho, legenda], { classe: 'janela-grafo', recolhivel: true });
}
