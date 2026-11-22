import { el } from './dom.js';
import { paletaDoCarro, ROTULO_ESTADO } from './cores.js';
import { criarJanela } from './janela.js';

const listaQ = (qs) => (qs.length ? qs.map((q) => 'Q' + q).join(', ') : '—');

function chip(id, cor) {
  const p = paletaDoCarro(id, cor);
  return el('span', { class: 'chip', style: `background:${p.fill};border-color:${p.borda}` }, id);
}

/** Tabelas de carros e quadrantes, mais as métricas da rodada. */
export function criarPainelEstado(estado) {
  const m = estado.metricas;

  const metricas = el(
    'dl',
    { class: 'metricas' },
    ...[
      ['Rodada', m.rodada],
      ['Concluídos', `${m.concluidos}/${m.total}`],
      ['Bloqueados', m.bloqueados],
      ['Espera média', `${m.tempoMedioEspera} rodadas`],
    ].map(([rotulo, valor]) => el('div', { class: 'metrica' }, el('dt', null, rotulo), el('dd', null, valor))),
  );

  const carros = el(
    'table',
    { class: 'tabela' },
    el('thead', null, el('tr', null, ...['Carro', 'Estado', 'Segura', 'Espera'].map((t) => el('th', { scope: 'col' }, t)))),
    el(
      'tbody',
      null,
      ...estado.carros.map((c) =>
        el(
          'tr',
          { class: c.estado === 'bloqueado' ? 'linha-bloqueada' : '' },
          el('td', null, chip(c.id, c.cor)),
          el('td', null, ROTULO_ESTADO[c.estado] + (c.motivo === 'negado' ? ' (negado)' : '')),
          el('td', null, listaQ(c.segura)),
          el('td', null, c.espera === null ? '—' : 'Q' + c.espera),
        ),
      ),
    ),
  );

  const quadrantes = el(
    'table',
    { class: 'tabela' },
    el('thead', null, el('tr', null, el('th', { scope: 'col' }, 'Quadrante'), el('th', { scope: 'col' }, 'Ocupado por'))),
    el(
      'tbody',
      null,
      ...estado.quadrantes.map((q) => {
        const dono = estado.carros.find((c) => c.id === q.ocupadoPor);
        return el('tr', null, el('td', null, 'Q' + q.id), el('td', null, dono ? chip(dono.id, dono.cor) : 'livre'));
      }),
    ),
  );

  return criarJanela('Estado', [metricas, carros, quadrantes], { classe: 'janela-estado' });
}
