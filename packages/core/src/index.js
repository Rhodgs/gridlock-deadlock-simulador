// Backend da simulação: devolve estados no formato do CONTRATO.md.
// Este pacote não importa nada de packages/ui e nunca mexe em tela.

import { normalizarConfig } from './config.js';
import { avancar, criarInterno, LIMITE_RODADAS, paraEstado, todosConcluidos } from './motor.js';

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

  function finalizado() {
    return todosConcluidos(interno) || interno.ciclo.length > 0 || interno.rodada >= LIMITE_RODADAS;
  }

  return {
    estado,
    passo() {
      if (finalizado()) return estado();
      empilhar();
      avancar(interno);
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
  };
}
