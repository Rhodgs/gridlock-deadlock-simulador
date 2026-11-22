// Teste de estado seguro (estilo algoritmo do banqueiro, com recursos de instância única).
//
// Cada carro "reivindica" os quadrantes que ainda faltam na sua rota. O estado é SEGURO se existe
// uma ordem em que todos conseguem terminar: um carro termina quando todos os quadrantes de que
// precisa estão livres (ou foram liberados por quem terminou antes); ao terminar, devolve tudo.

const necessidades = (v) => {
  const seguro = new Set(v.segura);
  return v.rota.slice(v.idx + 1).filter((q) => !seguro.has(q));
};

/** @param {{segura:number[], rota:number[], idx:number, concluido:boolean}[]} visoes */
export function estadoSeguro(visoes) {
  const disponiveis = new Set([1, 2, 3, 4].filter((q) => !visoes.some((v) => v.segura.includes(q))));
  const restantes = visoes.filter((v) => !v.concluido);
  while (restantes.length) {
    const i = restantes.findIndex((v) => necessidades(v).every((q) => disponiveis.has(q)));
    if (i < 0) return false; // ninguém consegue terminar: estado inseguro
    const [v] = restantes.splice(i, 1);
    for (const q of [...v.segura, ...necessidades(v)]) disponiveis.add(q);
  }
  return true;
}
