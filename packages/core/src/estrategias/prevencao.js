import { nenhuma } from './nenhuma.js';

// Prevenção: elimina a condição "posse e espera".
// O carro só entra se TODOS os quadrantes da rota estiverem livres, e reserva a rota inteira
// de uma vez. Quem não consegue fica de fora segurando nada, então nunca entra em ciclo.
export const prevencao = {
  ...nenhuma,
  nome: 'prevencao',
  reservaRota: true,
  quadrantesDeEntrada: (carro) => [...carro.rota],
};
