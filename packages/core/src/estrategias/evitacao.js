import { nenhuma } from './nenhuma.js';
import { estadoSeguro } from '../seguranca.js';

// Evitação: antes de atender um pedido, testa se o estado resultante continua seguro.
// Se não continuar, o pedido é negado (mesmo com o quadrante livre) e o carro espera.
export const evitacao = {
  ...nenhuma,
  nome: 'evitacao',
  vetar(tentativa, carro, hipotese) {
    const visoes = [...tentativa.entries()].map(([id, v]) => (id === carro.id ? hipotese : v));
    return !estadoSeguro(visoes);
  },
  mensagemVeto: 'a evitação negou: o estado ficaria inseguro',
};
