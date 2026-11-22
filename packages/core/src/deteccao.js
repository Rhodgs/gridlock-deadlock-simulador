// Detecção de deadlock por grafo de espera.
//
// Aresta  X → Y  quando o carro X espera um quadrante que o carro Y segura.
// Como cada carro espera no máximo um quadrante, cada nó tem no máximo uma aresta de saída:
// a busca em profundidade vira "seguir a cadeia" até repetir um nó (ciclo) ou acabar (sem ciclo).

/**
 * @param {{id: string, espera: number|null}[]} carros
 * @param {{id: number, ocupadoPor: string|null}[]} quadrantes
 * @returns {Map<string, string>} carro → carro de quem ele espera
 */
export function construirGrafoEspera(carros, quadrantes) {
  const dono = new Map(quadrantes.map((q) => [q.id, q.ocupadoPor]));
  const grafo = new Map();
  for (const c of carros) {
    if (c.espera === null || c.espera === undefined) continue;
    const d = dono.get(c.espera);
    if (d && d !== c.id) grafo.set(c.id, d);
  }
  return grafo;
}

/**
 * Devolve o primeiro ciclo encontrado, na ordem das esperas (CONTRATO.md, regra 4),
 * começando pelo carro que vem primeiro em `ordem`. Sem ciclo, devolve [].
 * @param {Map<string, string>} grafo
 * @param {string[]} ordem ids dos carros, do mais prioritário ao menos
 */
export function encontrarCiclo(grafo, ordem = [...grafo.keys()]) {
  const resolvidos = new Set(); // nós já explorados sem achar ciclo novo
  for (const inicio of ordem) {
    if (resolvidos.has(inicio)) continue;
    const caminho = [];
    const posicao = new Map();
    let atual = inicio;
    while (atual !== undefined && !resolvidos.has(atual)) {
      if (posicao.has(atual)) {
        const ciclo = caminho.slice(posicao.get(atual));
        const primeiro = ciclo.reduce((m, id) => (ordem.indexOf(id) < ordem.indexOf(m) ? id : m), ciclo[0]);
        const i = ciclo.indexOf(primeiro);
        return [...ciclo.slice(i), ...ciclo.slice(0, i)];
      }
      posicao.set(atual, caminho.length);
      caminho.push(atual);
      atual = grafo.get(atual);
    }
    for (const id of caminho) resolvidos.add(id);
  }
  return [];
}
