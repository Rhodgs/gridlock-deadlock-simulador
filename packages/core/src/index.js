// Backend da simulação: devolve estados no formato do CONTRATO.md.
// Este pacote não importa nada de packages/ui e nunca mexe em tela.

import { normalizarConfig } from './config.js';
import { avancar, criarInterno, LIMITE_RODADAS, paraEstado, todosConcluidos } from './motor.js';
import { obterEstrategia } from './estrategias/index.js';
import { aplicarRecuperacao } from './recuperacao.js';

export { CENARIOS } from './cenarios.js';

/**
 * @param {{ carros: {id: string, rota: number[], chegada?: number, cor?: string}[],
 *           modo?: 'normal' | 'com-bloqueio',
 *           estrategia?: 'nenhuma' | 'prevencao' | 'evitacao' | 'recuperacao' }} config
 */
export function criarSimulacao(config) {
  const cfg = normalizarConfig(config);
  let interno = criarInterno(cfg);
  let pilha = []; // cópias anteriores, para voltar()

  const empilhar = () => pilha.push(structuredClone(interno));
  const estado = () => paraEstado(interno);

  const estrategia = obterEstrategia(cfg.estrategia);

  // Com recuperação automática o deadlock não encerra a simulação: o próximo passo resolve.
  function finalizado() {
    if (todosConcluidos(interno) || interno.rodada >= LIMITE_RODADAS) return true;
    return interno.ciclo.length > 0 && !estrategia.autoRecuperar;
  }

  return {
    estado,
    passo() {
      if (finalizado()) return estado();
      empilhar();
      if (estrategia.autoRecuperar && interno.ciclo.length) aplicarRecuperacao(interno);
      else avancar(interno);
      return estado();
    },
    /** Recuperação manual: vale em qualquer estratégia, quando há deadlock. */
    resolver() {
      if (!interno.ciclo.length) return estado();
      empilhar();
      aplicarRecuperacao(interno);
      return estado();
    },
    voltar() {
      if (pilha.length) interno = pilha.pop();
      return estado();
    },
    reiniciar() {
      interno = criarInterno(cfg);
      pilha = [];
      return estado();
    },
    finalizado,
    podeVoltar: () => pilha.length > 0,
    podeResolver: () => interno.ciclo.length > 0,
  };
}
