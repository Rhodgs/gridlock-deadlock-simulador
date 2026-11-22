# Comparação das estratégias

Data: 2026-11-22  
Semente: 2026  
Cenários aleatórios: 300

## Cenários fixos

| cenário | modo | estratégia | deadlock | rodadaDeadlock | terminou | rodadas | tempoMedioEspera | concluidos | vetos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deadlock clássico | normal | nenhuma | não | - | sim | 8 | 1 | 4/4 | 4 |
| Deadlock clássico | normal | nenhuma + resolver | não | - | sim | 8 | 1 | 4/4 | 4 |
| Deadlock clássico | normal | recuperacao | não | - | sim | 8 | 1 | 4/4 | 4 |
| Deadlock clássico | normal | prevencao | não | - | sim | 8 | 1.3 | 4/4 | 3 |
| Deadlock clássico | normal | evitacao | não | - | sim | 8 | 1 | 4/4 | 4 |
| Deadlock clássico | com-bloqueio | nenhuma | sim | 1 | não | 1 | 1 | 0/4 | 4 |
| Deadlock clássico | com-bloqueio | nenhuma + resolver | sim | 1 | sim | 7 | 1.8 | 4/4 | 4 |
| Deadlock clássico | com-bloqueio | recuperacao | sim | 1 | sim | 7 | 1.8 | 4/4 | 4 |
| Deadlock clássico | com-bloqueio | prevencao | não | - | sim | 6 | 1.5 | 4/4 | 4 |
| Deadlock clássico | com-bloqueio | evitacao | não | - | sim | 6 | 1.5 | 4/4 | 5 |
| Quase-deadlock | normal | nenhuma | não | - | sim | 6 | 0.7 | 3/3 | 2 |
| Quase-deadlock | normal | nenhuma + resolver | não | - | sim | 6 | 0.7 | 3/3 | 2 |
| Quase-deadlock | normal | recuperacao | não | - | sim | 6 | 0.7 | 3/3 | 2 |
| Quase-deadlock | normal | prevencao | não | - | sim | 7 | 1 | 3/3 | 2 |
| Quase-deadlock | normal | evitacao | não | - | sim | 6 | 0.7 | 3/3 | 2 |
| Quase-deadlock | com-bloqueio | nenhuma | não | - | sim | 5 | 1 | 3/3 | 2 |
| Quase-deadlock | com-bloqueio | nenhuma + resolver | não | - | sim | 5 | 1 | 3/3 | 2 |
| Quase-deadlock | com-bloqueio | recuperacao | não | - | sim | 5 | 1 | 3/3 | 2 |
| Quase-deadlock | com-bloqueio | prevencao | não | - | sim | 6 | 1 | 3/3 | 2 |
| Quase-deadlock | com-bloqueio | evitacao | não | - | sim | 5 | 1 | 3/3 | 2 |
| Sem deadlock | normal | nenhuma | não | - | sim | 4 | 0 | 2/2 | 0 |
| Sem deadlock | normal | nenhuma + resolver | não | - | sim | 4 | 0 | 2/2 | 0 |
| Sem deadlock | normal | recuperacao | não | - | sim | 4 | 0 | 2/2 | 0 |
| Sem deadlock | normal | prevencao | não | - | sim | 4 | 0 | 2/2 | 0 |
| Sem deadlock | normal | evitacao | não | - | sim | 4 | 0 | 2/2 | 0 |
| Sem deadlock | com-bloqueio | nenhuma | não | - | sim | 3 | 0 | 2/2 | 0 |
| Sem deadlock | com-bloqueio | nenhuma + resolver | não | - | sim | 3 | 0 | 2/2 | 0 |
| Sem deadlock | com-bloqueio | recuperacao | não | - | sim | 3 | 0 | 2/2 | 0 |
| Sem deadlock | com-bloqueio | prevencao | não | - | sim | 3 | 0 | 2/2 | 0 |
| Sem deadlock | com-bloqueio | evitacao | não | - | sim | 3 | 0 | 2/2 | 0 |

## Cenários aleatórios

| estratégia | deadlockPercentual | terminouPercentual | mediaRodadas | mediaTempoMedioEspera |
| --- | --- | --- | --- | --- |
| nenhuma | 16.0% | 84.0% | 5.30 | 0.76 |
| recuperacao | 16.0% | 100.0% | 6.67 | 0.88 |
| prevencao | 0.0% | 100.0% | 7.80 | 1.55 |
| evitacao | 0.0% | 100.0% | 6.55 | 0.92 |

Nenhuma estratégia: 48 de 300 cenários aleatórios travam em deadlock.
