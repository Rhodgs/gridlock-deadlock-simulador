// Backend da simulação. Ainda NÃO implementado: este arquivo só fixa a assinatura.
// Contrato completo em CONTRATO.md. Valide sua saída com validarEstado().

// import { validarEstado } from '../../contrato/index.js';
// import { construirGrafoEspera, encontrarCiclo } from './deteccao.js';

/**
 * @param {{ carros: {id: string, rota: number[]}[],
 *           modo: 'normal' | 'com-bloqueio',
 *           estrategia: 'nenhuma' | 'prevencao' | 'evitacao' | 'recuperacao' }} config
 */
export function criarSimulacao(config) {
  void config;
  return {
    /** Estado atual no formato do contrato. */
    estado() { throw new Error('TODO: estado'); },
    /** Avança uma rodada e devolve o novo estado. */
    passo() { throw new Error('TODO: passo'); },
    /** Volta à rodada 0 com a mesma configuração. */
    reiniciar() { throw new Error('TODO: reiniciar'); },
    /** Aplica a recuperação quando há deadlock e devolve o estado. */
    resolver() { throw new Error('TODO: resolver'); },
  };
}
