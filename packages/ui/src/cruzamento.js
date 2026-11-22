import { svg } from './dom.js';
import { paletaDoCarro, ROTULO_ESTADO } from './cores.js';
import {
  CENTRO, VIEW, VIEW_HEIGHT, VIEW_Y, QUADRANTE_LADO,
  CRUZAMENTO_LADO, RUA_LARGURA, posicaoDoCarro,
} from './geometria.js';
import { criarCarro } from './carro.js';
import { criarDefsSetas, criarSetas } from './setas.js';

function descricaoDoCarro(c) {
  const partes = [`Carro ${c.id}: ${ROTULO_ESTADO[c.estado]}`];
  if (c.segura.length) partes.push(`segura ${c.segura.map((q) => 'Q' + q).join(', ')}`);
  if (c.espera !== null) partes.push(`pede Q${c.espera}${c.motivo === 'negado' ? ' (negado)' : ''}`);
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
    const atributosRect = {
      x: x - QUADRANTE_LADO / 2,
      y: y - QUADRANTE_LADO / 2,
      width: QUADRANTE_LADO,
      height: QUADRANTE_LADO,
    };
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
        svg('text', {
          class: 'rotulo-q',
          x: q.id === 1 || q.id === 4 ? x + QUADRANTE_LADO * 0.28 : x - QUADRANTE_LADO * 0.28,
          y: q.id === 1 || q.id === 2 ? y + QUADRANTE_LADO * 0.28 : y - QUADRANTE_LADO * 0.20,
          'text-anchor': 'middle',
        }, `Q${q.id}`),
    );
  });

  const carrosSvg = estado.carros.map((c) => {
    const pos = posicaoDoCarro(c);
    return criarCarro({ id: c.id, cor: c.cor, estado: c.estado, descricao: descricaoDoCarro(c), ...pos });
  });

  const fundo = svg(
    'g',
    { class: 'cenario-estatico' },
    svg('rect', { class: 'grama grama-base', x: -2000, y: -1000, width: 5200, height: 2700 }),
    svg('rect', { class: 'grama-tonalidade', x: -2000, y: -1000, width: 2600, height: 2700 }),
    svg('rect', { class: 'grama-tonalidade grama-direita', x: 600, y: -1000, width: 2600, height: 2700 }),
    svg('rect', { class: 'asfalto rua-vertical', x: 500, y: -1000, width: 200, height: 2700 }),
    svg('rect', { class: 'asfalto rua-horizontal', x: -2000, y: 250, width: 5200, height: 200 }),
  );

  const detalhesRua = svg(
    'g',
    { class: 'detalhes-estaticos' },
    svg('line', { class: 'meio-fio', x1: -2000, y1: 250, x2: 3200, y2: 250 }),
    svg('line', { class: 'meio-fio', x1: -2000, y1: 450, x2: 3200, y2: 450 }),
    svg('line', { class: 'meio-fio', x1: 500, y1: -1000, x2: 500, y2: 1700 }),
    svg('line', { class: 'meio-fio', x1: 700, y1: -1000, x2: 700, y2: 1700 }),
    svg('path', { class: 'linha-central', d: 'M600 -1000 V250 M600 450 V1700 M-2000 350 H500 M700 350 H3200' }),
    svg('g', { class: 'faixa-pedestres' },
      ...Array.from({ length: 6 }, (_, i) => svg('rect', { x: 510 + i * 30, y: 225, width: 14, height: 25 })),
      ...Array.from({ length: 6 }, (_, i) => svg('rect', { x: 510 + i * 30, y: 450, width: 14, height: 25 })),
      ...Array.from({ length: 6 }, (_, i) => svg('rect', { x: 475, y: 258 + i * 30, width: 25, height: 14 })),
      ...Array.from({ length: 6 }, (_, i) => svg('rect', { x: 700, y: 258 + i * 30, width: 25, height: 14 })),
    ),
    svg('line', { class: 'linha-retencao', x1: 500, y1: 220, x2: 700, y2: 220 }),
    svg('line', { class: 'linha-retencao', x1: 500, y1: 480, x2: 700, y2: 480 }),
    svg('line', { class: 'linha-retencao', x1: 470, y1: 250, x2: 470, y2: 450 }),
    svg('line', { class: 'linha-retencao', x1: 730, y1: 250, x2: 730, y2: 450 }),
  );

  const arborizacao = svg(
    'g',
    { class: 'arvores' },
    svg('g', { class: 'arbusto', transform: 'translate(240 140)' },
      svg('circle', { r: 18 }), svg('circle', { cx: 18, cy: 5, r: 12 }), svg('circle', { cx: -15, cy: 8, r: 10 })),
    svg('g', { class: 'arbusto', transform: 'translate(960 140)' },
      svg('circle', { r: 18 }), svg('circle', { cx: 18, cy: 5, r: 12 }), svg('circle', { cx: -15, cy: 8, r: 10 })),
    svg('g', { class: 'arbusto', transform: 'translate(250 560)' },
      svg('circle', { r: 18 }), svg('circle', { cx: 18, cy: 5, r: 12 }), svg('circle', { cx: -15, cy: 8, r: 10 })),
    svg('g', { class: 'arbusto', transform: 'translate(950 560)' },
      svg('circle', { r: 18 }), svg('circle', { cx: 18, cy: 5, r: 12 }), svg('circle', { cx: -15, cy: 8, r: 10 })),
    svg('g', { class: 'arbusto', transform: 'translate(110 220)' },
      svg('circle', { r: 14 }), svg('circle', { cx: 13, cy: 4, r: 9 })),
    svg('g', { class: 'arbusto', transform: 'translate(1090 480)' },
      svg('circle', { r: 14 }), svg('circle', { cx: 13, cy: 4, r: 9 })),
  );

  return svg(
    'svg',
    {
      class: 'cruzamento',
      viewBox: `0 ${VIEW_Y} ${VIEW} ${VIEW_HEIGHT}`,
      preserveAspectRatio: 'xMidYMid meet',
      overflow: 'hidden',
      role: 'img',
      'aria-label': `Cruzamento na rodada ${estado.rodada}`,
    },
    criarDefsSetas(),
    fundo,
    detalhesRua,
    arborizacao,
    svg('g', { class: 'quadrantes' }, ...quadrantes),
    svg(
      'g',
      { class: 'cruzamento-contorno' },
      svg('rect', { x: 500, y: 250, width: CRUZAMENTO_LADO, height: CRUZAMENTO_LADO, rx: 12 }),
      svg('line', { x1: 600, y1: 250, x2: 600, y2: 450 }),
      svg('line', { x1: 500, y1: 350, x2: 700, y2: 350 }),
    ),
    criarSetas(estado),
    svg('g', { class: 'carros' }, ...carrosSvg),
  );
}
