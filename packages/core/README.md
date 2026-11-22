# packages/core — backend da simulação

Lógica da simulação: motor de rodadas, detecção de deadlock e estratégias.
**Nada neste pacote mexe em tela** e ele **não importa `packages/ui`**.
A saída é sempre o estado do [`CONTRATO.md`](../../CONTRATO.md).

## Arquivos

| Arquivo | O que faz |
|---|---|
| `src/index.js` | `criarSimulacao()` (API pública) e `CENARIOS` |
| `src/config.js` | valida e normaliza a configuração |
| `src/motor.js` | rodadas: planeja (quem pede o quê), executa e monta o estado |
| `src/deteccao.js` | grafo de espera e busca do ciclo |
| `src/recuperacao.js` | escolhe a vítima e aplica a recuperação |
| `src/seguranca.js` | teste de estado seguro (usado pela evitação) |
| `src/estrategias/` | uma pasta-registro: `nenhuma`, `prevencao`, `evitacao`, `recuperacao` |
| `src/cenarios.js` | cenários prontos |

## Como uma rodada funciona

1. O estado mostra o **plano**: cada carro pede o próximo quadrante; seta verde = será atendido,
   vermelha = fica parado (`motivo`: `ocupado` ou `negado`).
2. Os pedidos são avaliados sobre a "foto" do início da rodada, **em ordem de prioridade**
   (ordem da lista de carros). Um quadrante liberado agora só vale na rodada seguinte.
3. `passo()` executa o plano e planeja a rodada seguinte. Se há ciclo no grafo de espera,
   o deadlock é detectado.

## Modos

- `com-bloqueio`: todos os carros chegam na rodada 0 (pior caso).
- `normal`: um carro chega por rodada, na ordem da lista (ou use `chegada` em cada carro).

## Criar uma estratégia nova

Crie `src/estrategias/minha.js` exportando um objeto com os campos de `nenhuma.js`
(`reservaRota`, `autoRecuperar`, `quadrantesDeEntrada`, `vetar`, `mensagemVeto`) e registre em
`src/estrategias/index.js`. Rode `npm test`.

## Testes

`npm test` confere cenários fixos e 600 cenários sorteados: todo estado precisa passar no
`validarEstado()`, prevenção e evitação nunca podem deixar deadlock e todos os carros têm de concluir.
