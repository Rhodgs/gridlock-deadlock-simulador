// TODO (backend): detecção de deadlock por grafo de espera.
//
// Ideia: aresta  X → Y  quando o carro X espera um quadrante que o carro Y segura.
// Há deadlock se o grafo tem ciclo. Use busca em profundidade (DFS) com 3 cores
// (branco/cinza/preto) e devolva o ciclo na ORDEM em que ele aparece (veja CONTRATO.md, regra 3).

/** @returns {Map<string, string>} carro → carro de quem ele espera */
export function construirGrafoEspera(/* carros, quadrantes */) {
  throw new Error('TODO: construirGrafoEspera');
}

/** @returns {string[]} ciclo ordenado (ex.: ['A','D','B','C']) ou [] se não houver */
export function encontrarCiclo(/* grafo */) {
  throw new Error('TODO: encontrarCiclo');
}
