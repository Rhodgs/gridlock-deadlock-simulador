import { svg } from './dom.js';
import { paletaDoCarro, ROTULO_ESTADO } from './cores.js';
import { CENTRO, VIEW, VIEW_HEIGHT, posicaoDoCarro } from './geometria.js';
import { criarCarro } from './carro.js';
import { criarDefsSetas, criarSetas } from './setas.js';

function descricaoDoCarro(c) {
  const partes = [`Carro ${c.id}: ${ROTULO_ESTADO[c.estado]}`];
  if (c.segura.length) partes.push(`segura ${c.segura.map((q) => 'Q' + q).join(', ')}`);
  if (c.espera !== null) partes.push(`pede Q${c.espera}`);
  return partes.join(' · ');
}

/** Desenha o cruzamento inteiro a partir de um estado do contrato. */
export function criarCruzamento(estado) {
  const noCiclo = new Set(estado.deadlock?.ciclo ?? []);
  const carros = new Map(estado.carros.map((c) => [c.id, c]));

  const quadrantes = estado.quadrantes.map((q) => {
    const dono = q.ocupadoPor ? carros.get(q.ocupadoPor) : null;
    const emDeadlock = dono && noCiclo.has(dono.id);
    const { x, y } = CENTRO[q.id];
    const atributosRect = { x: x - 50, y: y - 50, width: 100, height: 100 };
    if (dono) {
      const p = paletaDoCarro(dono.id, dono.cor);
      atributosRect.fill = p.fill;
      atributosRect['fill-opacity'] = 0.3;
    }
    return svg(
      'g',
      { class: `quadrante ${dono ? 'ocupado' : 'livre'}${emDeadlock ? ' deadlock' : ''}`, 'data-quadrante': q.id },
      svg('title', null, dono ? `Q${q.id} ocupado pelo carro ${dono.id}` : `Q${q.id} livre`),
      svg('rect', atributosRect),
      svg('text', { class: 'rotulo-q', x: x - 42, y: y - 32 }, `Q${q.id}`),
    );
  });

  const carrosSvg = estado.carros.map((c) => {
    const pos = posicaoDoCarro(c);
    return criarCarro({ id: c.id, cor: c.cor, estado: c.estado, descricao: descricaoDoCarro(c), ...pos });
  });

  return svg(
    'svg',
    {
      class: 'cruzamento',
      viewBox: `0 0 ${VIEW} ${VIEW_HEIGHT}`,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': `Cruzamento na rodada ${estado.rodada}`,
    },
    criarDefsSetas(),
    svg('rect', { class: 'grama', x: 0, y: 0, width: VIEW, height: VIEW_HEIGHT }),
    svg('rect', { class: 'asfalto', x: 500, y: 0, width: 200, height: VIEW_HEIGHT }),
    svg('rect', { class: 'asfalto', x: 0, y: 250, width: VIEW, height: 200 }),
    svg('path', { class: 'faixa', d: 'M600 0 V250 M600 450 V700 M0 350 H500 M700 350 H1200' }),
    svg('g', { class: 'quadrantes' }, ...quadrantes),
    criarSetas(estado),
    svg('g', { class: 'carros' }, ...carrosSvg),
  );
}
