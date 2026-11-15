import { el } from './dom.js';

/** Painel com barra de título (como janela de sistema operacional antigo). */
export function criarJanela(titulo, conteudo, { classe = '' } = {}) {
  return el(
    'section',
    { class: `janela ${classe}`.trim() },
    el(
      'header',
      { class: 'janela-titulo' },
      el('h2', null, titulo),
      el('span', { class: 'janela-botoes', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
    ),
    el('div', { class: 'janela-corpo' }, conteudo),
  );
}
