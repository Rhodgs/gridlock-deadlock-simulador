// Recuperação: depois de detectar o deadlock, um carro recua e libera o que segura.
import { evento, planejar } from './motor.js';

const Q = (q) => `Q${q}`;

/**
 * Vítima = carro do ciclo que menos segura (perde menos trabalho).
 * Empate: o de menor prioridade (o último da lista de carros).
 */
export function escolherVitima(interno) {
  const candidatos = interno.carros.filter((c) => interno.ciclo.includes(c.id));
  return candidatos.reduce((melhor, c) => {
    const menos = c.segura.length < melhor.segura.length;
    const empate = c.segura.length === melhor.segura.length;
    return menos || (empate && interno.carros.indexOf(c) > interno.carros.indexOf(melhor)) ? c : melhor;
  });
}

/**
 * Gasta uma rodada só com a recuperação: a vítima recua, libera os quadrantes e volta
 * a tentar entrar 2 rodadas depois (para não recriar o mesmo impasse na hora).
 */
export function aplicarRecuperacao(interno) {
  if (!interno.ciclo.length) return;
  const vitima = escolherVitima(interno);
  const liberados = [...vitima.segura];
  interno.rodada += 1;
  vitima.segura = [];
  vitima.idx = -1;
  vitima.chegada = interno.rodada + 2;
  interno.vitimas.push(vitima.id);
  evento(interno, 'recuperacao', `Carro ${vitima.id} escolhido como vítima: recuou e liberou ${liberados.map(Q).join(', ')}`);
  planejar(interno);
}
