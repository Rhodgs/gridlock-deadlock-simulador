import { el } from './dom.js';
import { criarJanela } from './janela.js';

const ICONES = { info: 'i', avanco: '→', espera: '…', bloqueio: '■', deadlock: '!', recuperacao: '↺' };

/** Lista de eventos (já acumulados pelo backend). Rola sozinha até o último. */
export function criarLog(eventos) {
  const lista = el(
    'ol',
    { class: 'log', 'aria-label': 'Eventos da simulação' },
    ...eventos.map((e) =>
      el(
        'li',
        { class: `evento tipo-${e.tipo}` },
        el('span', { class: 'evento-icone', 'aria-hidden': 'true' }, ICONES[e.tipo] ?? '•'),
        el('span', { class: 'evento-rodada' }, `R${e.rodada}`),
        el('span', null, e.texto),
      ),
    ),
  );
  requestAnimationFrame(() => {
    lista.scrollTop = lista.scrollHeight;
  });
  return criarJanela('Log de eventos', lista, { classe: 'janela-log' });
}
