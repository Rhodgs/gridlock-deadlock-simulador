import { el } from './dom.js';

/** Painel com barra de título (como janela de sistema operacional antigo). */
export function criarJanela(titulo, conteudo, { classe = '', recolhivel = false, aberto = true } = {}) {
  const corpo = el('div', { class: 'janela-corpo' }, conteudo);

  if (recolhivel) {
    const chave = `gridlock:painel:${classe || titulo}`;
    let estadoSalvo = aberto;
    try {
      const salvo = localStorage.getItem(chave);
      if (salvo !== null) estadoSalvo = salvo === 'aberto';
    } catch { /* sem localStorage: mantém o estado padrão */ }

    const detalhes = el(
      'details',
      {
        class: `janela ${classe}`.trim(),
        open: estadoSalvo,
        ontoggle: (evento) => {
          try {
            localStorage.setItem(chave, evento.currentTarget.open ? 'aberto' : 'fechado');
          } catch { /* sem localStorage: só não persiste */ }
        },
      },
      el(
        'summary',
        { class: 'janela-titulo' },
        el('h2', null, titulo),
        el('span', { class: 'janela-botoes', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
      ),
      corpo,
    );
    return detalhes;
  }

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
