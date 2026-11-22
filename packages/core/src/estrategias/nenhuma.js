// Sem tratamento: o carro pede um quadrante de cada vez, o deadlock pode acontecer.
export const nenhuma = {
  nome: 'nenhuma',
  reservaRota: false, // true = o carro segura a rota inteira ao entrar (prevenção)
  autoRecuperar: false, // true = o motor resolve o deadlock sozinho (recuperação)
  quadrantesDeEntrada: (carro) => [carro.rota[0]],
  vetar: null, // (tentativa, carro, hipotese) => boolean  (evitação)
  mensagemVeto: null,
};
