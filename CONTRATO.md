# Contrato do estado da simulação

Este é o **único acordo** entre a interface (`packages/ui`) e o backend (`packages/core`).
O backend produz um *estado* a cada rodada; a interface só desenha o que recebe.

> Mudou o formato? Avise o grupo **antes**, atualize este arquivo, `packages/contrato`
> e os mocks no mesmo pull request.

## Quadrantes

Os quatro quadrantes do cruzamento são numerados **em sentido horário, a partir do
superior esquerdo**:

```
   ┌────┬────┐
   │ Q1 │ Q2 │
   ├────┼────┤
   │ Q4 │ Q3 │
   └────┴────┘
```

Assim o ciclo clássico é `Q1 → Q2 → Q3 → Q4 → Q1`.

## Estado

```jsonc
{
  "rodada": 3,
  "quadrantes": [                       // sempre 4, na ordem Q1..Q4
    { "id": 1, "ocupadoPor": "A" },     // null quando livre
    { "id": 2, "ocupadoPor": "D" },
    { "id": 3, "ocupadoPor": "B" },
    { "id": 4, "ocupadoPor": "C" }
  ],
  "carros": [
    {
      "id": "A",                        // letra exibida no carro
      "cor": "#2563eb",                 // opcional; a UI tem paleta padrão
      "estado": "bloqueado",            // aguardando | movimento | bloqueado | concluido
      "motivo": "ocupado",              // só quando bloqueado: ocupado | negado
      "rota": [1, 2],                   // quadrantes que o carro precisa percorrer, em ordem
      "segura": [1],                    // quadrantes que ele ocupa (o 1º é onde o carro está)
      "espera": 2                       // quadrante que pediu nesta rodada (ou null)
    }
  ],
  "deadlock": { "detectado": true, "ciclo": ["A", "D", "B", "C"] },
  "condicoes": {
    "exclusaoMutua": true,
    "posseEspera": true,
    "naoPreempcao": true,
    "esperaCircular": true
  },
  "eventos": [                          // ACUMULADO desde a rodada 0
    { "rodada": 3, "tipo": "bloqueio", "texto": "Carro A pediu Q2 (ocupado por D)" }
  ],
  "resultado": {                        // null enquanto a simulação não terminou
    "tipo": "deadlock",                 // sem-deadlock | deadlock | recuperado
    "mensagem": "Deadlock identificado: ciclo de espera detectado"
  },
  "metricas": {
    "rodada": 3,
    "concluidos": 0,
    "total": 4,
    "bloqueados": 4,
    "tempoMedioEspera": 0.8             // rodadas bloqueadas, em média por carro
  }
}
```

## Regras de consistência

1. `quadrantes[i].ocupadoPor === X` ⇔ o carro `X` tem `i + 1` em `segura`.
2. `espera` guarda o quadrante **pedido** na rodada, livre ou não. A seta verde significa
   "o pedido será concedido na próxima rodada"; a vermelha, "o carro continua parado".
   Um carro `bloqueado` tem um `motivo`:
   - `ocupado`: o quadrante pedido está ocupado por **outro** carro (é o que forma ciclo);
   - `negado`: o quadrante está livre, mas o pedido não foi concedido (outro carro de maior
     prioridade pediu o mesmo quadrante, ou a estratégia de evitação vetou).
3. `segura` pode ter mais de um quadrante só quando a estratégia **prevenção** reserva a rota
   inteira: o **primeiro** é onde o carro está agora e os demais são reservas à frente.
4. `deadlock.ciclo` é ordenado: cada carro espera um quadrante **do próximo** da lista,
   e o último espera o primeiro. Se `detectado` é `false`, `ciclo` é `[]`.
5. `eventos` é cumulativo; cada item traz a rodada em que aconteceu.
6. `condicoes` descreve o que **se observa naquele estado** (as quatro condições de Coffman).
   Quando as quatro são `true`, existe deadlock.
7. `resultado` só deixa de ser `null` na rodada final.

## Tipos de evento

`info` · `avanco` · `espera` · `bloqueio` · `deadlock` · `recuperacao`

## API do backend (`packages/core`)

```js
import { criarSimulacao, CENARIOS } from '../packages/core/src/index.js';

const sim = criarSimulacao({
  carros: [{ id: 'A', rota: [1, 2] }, { id: 'D', rota: [2, 3] }],   // chegada?: número da rodada
  modo: 'com-bloqueio',        // normal (um carro chega por rodada) | com-bloqueio (todos chegam juntos)
  estrategia: 'nenhuma',       // nenhuma | prevencao | evitacao | recuperacao
});

sim.estado();        // estado atual (formato acima)
sim.passo();         // avança uma rodada e devolve o novo estado
sim.voltar();        // desfaz a última rodada (ou ação de resolver)
sim.reiniciar();     // volta à rodada 0
sim.resolver();      // aplica a recuperação (quando há deadlock)
sim.finalizado();    // true se terminou, ou se parou em deadlock sem recuperação automática
sim.podeVoltar();
sim.podeResolver();  // true quando há deadlock detectado
```

`rota` deve ter quadrantes distintos e vizinhos entre si (Q1–Q3 e Q2–Q4 são diagonais, não valem).
Desempate quando dois carros pedem o mesmo quadrante livre: vence quem vem primeiro em `carros`.

A interface nunca chama nada além disso.
