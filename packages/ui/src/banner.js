import { el } from './dom.js';

/** Faixa de resultado: verde (sem deadlock), vermelha (deadlock) ou azul (recuperado). */
export function criarBanner(estado) {
  const r = estado.resultado;
  if (!r) {
    return el(
      'div',
      { class: 'banner banner-andamento', role: 'status' },
      estado.rodada === 0 ? 'Pronto. Use ▶ Iniciar ou ⏭ Passo.' : `Rodada ${estado.rodada}: simulação em andamento…`,
    );
  }
  const ciclo = estado.deadlock?.ciclo ?? [];
  return el(
    'div',
    { class: `banner banner-${r.tipo}`, role: 'status' },
    el('strong', null, r.mensagem),
    r.tipo === 'deadlock' && ciclo.length ? el('span', null, `Ciclo: ${[...ciclo, ciclo[0]].join(' → ')}`) : null,
  );
}
