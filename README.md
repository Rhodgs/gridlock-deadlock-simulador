# Gridlock — simulador visual de deadlock

> Simulador didático de **deadlock** com a analogia de um **cruzamento de trânsito**.
> Trabalho prático de Sistemas Operacionais — UFAM / ICET (Itacoatiara), Grupo 8.

Carros são **processos**, quadrantes do cruzamento são **recursos**. Quando cada carro
ocupa um quadrante e espera o próximo, formando um ciclo, ninguém anda: **deadlock**.

## Integrantes

Ian Gabriel Gomes Ramos da Silva · Matheus Nascimento Barbosa Feitosa ·
Rhuan Lucas Cunha Rodrigues · Vinicius Peixoto de Souza

## Como o projeto é organizado

O projeto é um **monorepo** em JavaScript puro (sem build, sem dependências).
A interface e o backend conversam **somente** por um formato de dados combinado:
o *estado da simulação*, descrito em [`CONTRATO.md`](CONTRATO.md).

```
gridlock-deadlock-simulador/
├── CONTRATO.md          ← formato do estado (acordo entre interface e backend)
├── packages/
│   ├── contrato/        ← constantes e validador do estado
│   ├── ui/              ← componentes visuais reutilizáveis (só desenham)
│   └── core/            ← backend: motor, detecção, estratégias
├── app/                 ← página que junta ui + core
├── mocks/               ← estados de exemplo em JSON (referência do contrato)
├── tools/               ← scripts (testes do core, gerar e validar mocks)
└── docs/                ← prints, relatório, slides
```

Regra de ouro: **`ui` nunca importa `core`** e **`core` nunca mexe em tela**.

## Como rodar

Os módulos ES precisam de um servidor local (não funciona abrindo o arquivo direto).

**VS Code (mais fácil):** instale a extensão *Live Server*, abra `app/index.html`
e clique em **Go Live**.

**Terminal:**

```bash
npm start            # serve a pasta na porta 5173 → abra http://localhost:5173
# ou
python3 -m http.server 5173
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm start` | serve o projeto localmente |
| `npm test` | testes do backend (cenários fixos + 600 sorteados) |
| `npm run mocks` | regenera os JSON de `mocks/` |
| `npm run validar` | valida os mocks contra o contrato |

## Estratégias

| Estratégia | O que faz | Condição de deadlock atacada |
|---|---|---|
| nenhuma | deixa o deadlock acontecer | — |
| prevenção | só entra se toda a rota estiver livre e reserva tudo de uma vez | posse e espera |
| evitação | só atende o pedido se o estado resultante for seguro | (evita chegar ao ciclo) |
| recuperação | detecta o ciclo e faz um carro (vítima) recuar | (corrige depois) |

## Status

- [x] Contrato do estado
- [x] Mocks (referência do contrato)
- [x] Interface (cruzamento, painéis, controles, log)
- [x] Backend: motor de rodadas, detecção por grafo de espera, voltar
- [x] Estratégias: prevenção, evitação e recuperação
- [x] Integração `app` ↔ `core` e testes automáticos
- [ ] Cenário personalizado (formulário)
- [ ] Animação dos carros, semáforos, modo comparação
- [ ] Avaliação com métricas por estratégia e relatório da 2ª etapa

Veja [`CONTRIBUINDO.md`](CONTRIBUINDO.md) para branches, commits e divisão de tarefas.

## Licença

MIT — veja [`LICENSE`](LICENSE).
