import { el } from './dom.js';

/**
 * Barra de controle. Devolve { elemento, atualizar }.
 * Ordem dos botões: Iniciar/Pausar · Passo · Voltar · Reiniciar · Velocidade ... Resolver · Exportar.
 * Callbacks aceitos: onAlternar, onPasso, onVoltar, onReiniciar, onVelocidade, onResolver, onExportar.
 */
export function criarBarraControle(handlers = {}) {
  const botao = (rotulo, titulo, chamada, classe = '') =>
    el('button', { type: 'button', class: `btn ${classe}`.trim(), title: titulo, onclick: () => handlers[chamada]?.() }, rotulo);

  const alternar = botao('▶ Iniciar', 'Iniciar ou pausar (Espaço)', 'onAlternar', 'primario');
  const passo = botao('⏭ Passo', 'Avançar uma rodada (→)', 'onPasso');
  const voltar = botao('⏮ Voltar', 'Voltar uma rodada (←)', 'onVoltar');
  const reiniciar = botao('↺ Reiniciar', 'Voltar ao início (R)', 'onReiniciar');
  const resolver = botao('Resolver deadlock', 'Aplicar a recuperação', 'onResolver', 'perigo');
  const exportar = botao('Exportar log', 'Baixar o log em .txt', 'onExportar');
  resolver.hidden = true;

  const velocidade = el(
    'select',
    { 'aria-label': 'Velocidade da simulação', onchange: (e) => handlers.onVelocidade?.(Number(e.target.value)) },
    ...[0.5, 1, 2, 4].map((v) => el('option', { value: v, selected: v === 1 }, `${v}x`)),
  );

  const elemento = el(
    'div',
    { class: 'barra-controle', role: 'toolbar', 'aria-label': 'Controles da simulação' },
    alternar,
    passo,
    voltar,
    reiniciar,
    el('label', { class: 'velocidade' }, 'Velocidade', velocidade),
    el('span', { class: 'espaco' }),
    resolver,
    exportar,
  );

  function atualizar({ rodando = false, podeAvancar = true, podeVoltar = false, podeResolver = false } = {}) {
    alternar.textContent = rodando ? '⏸ Pausar' : '▶ Iniciar';
    alternar.disabled = !rodando && !podeAvancar;
    passo.disabled = rodando || !podeAvancar;
    voltar.disabled = rodando || !podeVoltar;
    resolver.hidden = !podeResolver;
  }

  return { elemento, atualizar };
}
