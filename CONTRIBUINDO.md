# Como contribuir

## Fluxo de trabalho

1. `git pull` na `main` antes de começar.
2. Crie uma branch: `git switch -c feature/core-deteccao`
3. Faça commits pequenos e com mensagem clara.
4. Abra um **Pull Request** para a `main` e peça revisão de outra pessoa.
5. A `main` deve estar **sempre funcionando** (`npm run validar` passando e o app abrindo).

## Nomes de branch

`feature/ui-...` · `feature/core-...` · `fix/...` · `docs/...`

## Mensagens de commit

Formato: `tipo(escopo): resumo no imperativo`

| Tipo | Quando usar |
|---|---|
| `feat` | funcionalidade nova |
| `fix` | correção de bug |
| `docs` | documentação |
| `style` | visual/CSS sem mudar comportamento |
| `test` | testes e validações |
| `refactor` | reorganização sem mudar comportamento |
| `chore` | configuração, ferramentas |

Escopos: `ui`, `core`, `app`, `contrato`, `mocks`.

## Quem mexe em quê

| Área | Pastas | Responsável |
|---|---|---|
| Interface | `packages/ui`, `app` | _a definir_ |
| Motor e detecção | `packages/core` (`src/`) | _a definir_ |
| Estratégias (prevenção, evitação, recuperação) | `packages/core` | _a definir_ |
| Testes, métricas e relatório | `tools`, `docs` | _a definir_ |

Quem mexe em `ui/` não mexe em `core/` (e vice-versa): quase não há conflito de merge.

## Mudou o contrato?

Avise o grupo **antes**. No mesmo PR, atualize `CONTRATO.md`, `packages/contrato`,
`tools/gerar-mocks.mjs` (e rode `npm run mocks && npm run validar`).
