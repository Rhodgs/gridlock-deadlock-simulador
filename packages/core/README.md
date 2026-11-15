# packages/core — backend da simulação

Aqui mora a lógica: motor de rodadas, detecção de deadlock e estratégias.
**Nada neste pacote mexe em tela** e ele **não importa `packages/ui`**.

O que entregar: `criarSimulacao(config)` devolvendo `{ estado, passo, reiniciar, resolver }`,
sempre no formato do [`CONTRATO.md`](../../CONTRATO.md).

## Checklist

- [ ] Modelo: quadrantes, carros com **rota** (lista de quadrantes), rodadas
- [ ] Avaliar todos os pedidos no **início** da rodada e só então aplicar os movimentos
      (o resultado não pode depender da ordem em que os carros são percorridos)
- [ ] Detecção por grafo de espera + DFS (`src/deteccao.js`)
- [ ] Preencher `condicoes`, `eventos` (acumulado), `resultado` e `metricas`
- [ ] Estratégia **prevenção** (reservar a rota inteira ou ordenar os quadrantes)
- [ ] Estratégia **evitação** (só entrar se existir sequência segura)
- [ ] Estratégia **recuperação** (escolher vítima, recuar, liberar quadrante) → `resolver()`
- [ ] Testes: cenários dos `mocks/` devem produzir os mesmos estados

## Dica

`validarEstado(estado)` (em `packages/contrato`) devolve a lista de inconsistências.
Compare a saída do seu motor com os mocks e com esse validador a cada rodada.
