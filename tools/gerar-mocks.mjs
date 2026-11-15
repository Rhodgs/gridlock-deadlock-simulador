// Gera os estados de exemplo em mocks/*.json.
// Rode com: npm run mocks
// Cada cenário descreve só o essencial de cada rodada; o resto (quadrantes, condições,
// métricas, eventos acumulados) é calculado aqui para não haver inconsistência.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pasta = join(dirname(fileURLToPath(import.meta.url)), '..', 'mocks');
mkdirSync(pasta, { recursive: true });

const carro = (id, estado, rota, segura = [], espera = null) => ({ id, estado, rota, segura, espera });
const ev = (tipo, texto) => ({ tipo, texto });

/** Transforma descrições compactas em estados completos do contrato. */
function gerar(defs, ctx) {
  return defs.map((d) => {
    ctx.rodada += 1;
    ctx.eventos = [...ctx.eventos, ...(d.novos ?? []).map((e) => ({ rodada: ctx.rodada, ...e }))];
    for (const c of d.carros) {
      if (c.estado === 'bloqueado') ctx.espera[c.id] = (ctx.espera[c.id] ?? 0) + 1;
    }
    const quadrantes = [1, 2, 3, 4].map((id) => ({
      id,
      ocupadoPor: d.carros.find((c) => c.segura.includes(id))?.id ?? null,
    }));
    const bloqueados = d.carros.filter((c) => c.estado === 'bloqueado');
    const deadlock = d.ciclo ? { detectado: true, ciclo: d.ciclo } : { detectado: false, ciclo: [] };
    const soma = Object.values(ctx.espera).reduce((a, b) => a + b, 0);
    return {
      rodada: ctx.rodada,
      quadrantes,
      carros: d.carros,
      deadlock,
      condicoes: {
        exclusaoMutua: quadrantes.some((q) => q.ocupadoPor !== null),
        posseEspera: bloqueados.some((c) => c.segura.length > 0),
        naoPreempcao: bloqueados.length > 0,
        esperaCircular: deadlock.detectado,
      },
      eventos: ctx.eventos,
      resultado: d.resultado ?? null,
      metricas: {
        rodada: ctx.rodada,
        concluidos: d.carros.filter((c) => c.estado === 'concluido').length,
        total: d.carros.length,
        bloqueados: bloqueados.length,
        tempoMedioEspera: Math.round((soma / d.carros.length) * 10) / 10,
      },
    };
  });
}

function salvar(arquivo, mock) {
  writeFileSync(join(pasta, arquivo), JSON.stringify(mock, null, 2) + '\n');
  console.log('gerado', arquivo);
}

const SEM_DEADLOCK = { tipo: 'sem-deadlock', mensagem: 'Simulação concluída sem deadlock' };

// ------------------------------------------------------------------ clássico
{
  const ctx = { rodada: -1, eventos: [], espera: {} };
  const passos = gerar(
    [
      {
        novos: [ev('info', 'Simulação iniciada: 4 carros aguardando para entrar no cruzamento')],
        carros: [
          carro('A', 'aguardando', [1, 2]),
          carro('D', 'aguardando', [2, 3]),
          carro('B', 'aguardando', [3, 4]),
          carro('C', 'aguardando', [4, 1]),
        ],
      },
      {
        novos: [ev('avanco', 'Carro A ocupou Q1'), ev('avanco', 'Carro D ocupou Q2')],
        carros: [
          carro('A', 'movimento', [1, 2], [1]),
          carro('D', 'movimento', [2, 3], [2]),
          carro('B', 'aguardando', [3, 4]),
          carro('C', 'aguardando', [4, 1]),
        ],
      },
      {
        novos: [ev('avanco', 'Carro B ocupou Q3'), ev('avanco', 'Carro C ocupou Q4')],
        carros: [
          carro('A', 'movimento', [1, 2], [1]),
          carro('D', 'movimento', [2, 3], [2]),
          carro('B', 'movimento', [3, 4], [3]),
          carro('C', 'movimento', [4, 1], [4]),
        ],
      },
      {
        novos: [
          ev('bloqueio', 'Carro A pediu Q2 (ocupado por D): bloqueado'),
          ev('bloqueio', 'Carro D pediu Q3 (ocupado por B): bloqueado'),
          ev('bloqueio', 'Carro B pediu Q4 (ocupado por C): bloqueado'),
          ev('bloqueio', 'Carro C pediu Q1 (ocupado por A): bloqueado'),
          ev('deadlock', 'Ciclo detectado: A → D → B → C → A'),
        ],
        ciclo: ['A', 'D', 'B', 'C'],
        resultado: { tipo: 'deadlock', mensagem: 'Deadlock identificado: ciclo de espera detectado' },
        carros: [
          carro('A', 'bloqueado', [1, 2], [1], 2),
          carro('D', 'bloqueado', [2, 3], [2], 3),
          carro('B', 'bloqueado', [3, 4], [3], 4),
          carro('C', 'bloqueado', [4, 1], [4], 1),
        ],
      },
    ],
    ctx,
  );
  const recuperacao = gerar(
    [
      {
        novos: [ev('recuperacao', 'Carro C escolhido como vítima: recuou e liberou Q4')],
        carros: [
          carro('A', 'bloqueado', [1, 2], [1], 2),
          carro('D', 'bloqueado', [2, 3], [2], 3),
          carro('B', 'movimento', [3, 4], [3], 4),
          carro('C', 'aguardando', [4, 1]),
        ],
      },
      {
        novos: [ev('avanco', 'Carro B ocupou Q4 e liberou Q3')],
        carros: [
          carro('A', 'bloqueado', [1, 2], [1], 2),
          carro('D', 'movimento', [2, 3], [2], 3),
          carro('B', 'movimento', [3, 4], [4]),
          carro('C', 'aguardando', [4, 1]),
        ],
      },
      {
        novos: [ev('avanco', 'Carro B concluiu'), ev('avanco', 'Carro D ocupou Q3 e liberou Q2')],
        carros: [
          carro('A', 'movimento', [1, 2], [1], 2),
          carro('D', 'movimento', [2, 3], [3]),
          carro('B', 'concluido', [3, 4]),
          carro('C', 'aguardando', [4, 1]),
        ],
      },
      {
        novos: [ev('avanco', 'Carro D concluiu'), ev('avanco', 'Carro A ocupou Q2 e liberou Q1')],
        carros: [
          carro('A', 'movimento', [1, 2], [2]),
          carro('D', 'concluido', [2, 3]),
          carro('B', 'concluido', [3, 4]),
          carro('C', 'aguardando', [4, 1], [], 4),
        ],
      },
      {
        novos: [ev('avanco', 'Carro A concluiu'), ev('avanco', 'Carro C voltou e ocupou Q4')],
        carros: [
          carro('A', 'concluido', [1, 2]),
          carro('D', 'concluido', [2, 3]),
          carro('B', 'concluido', [3, 4]),
          carro('C', 'movimento', [4, 1], [4], 1),
        ],
      },
      {
        novos: [ev('avanco', 'Carro C ocupou Q1 e liberou Q4')],
        carros: [
          carro('A', 'concluido', [1, 2]),
          carro('D', 'concluido', [2, 3]),
          carro('B', 'concluido', [3, 4]),
          carro('C', 'movimento', [4, 1], [1]),
        ],
      },
      {
        novos: [ev('avanco', 'Carro C concluiu')],
        resultado: { tipo: 'recuperado', mensagem: 'Deadlock resolvido por recuperação: Carro C recuou' },
        carros: [
          carro('A', 'concluido', [1, 2]),
          carro('D', 'concluido', [2, 3]),
          carro('B', 'concluido', [3, 4]),
          carro('C', 'concluido', [4, 1]),
        ],
      },
    ],
    ctx,
  );
  salvar('deadlock-classico.json', {
    id: 'deadlock-classico',
    nome: 'Deadlock clássico',
    descricao: 'Quatro carros, cada um ocupando um quadrante e esperando o próximo: ciclo fechado.',
    configuracao: { modo: 'com-bloqueio', estrategia: 'nenhuma' },
    passos,
    recuperacao,
  });
}

// ------------------------------------------------------------- quase-deadlock
{
  const ctx = { rodada: -1, eventos: [], espera: {} };
  const passos = gerar(
    [
      {
        novos: [ev('info', 'Simulação iniciada: 3 carros aguardando para entrar no cruzamento')],
        carros: [carro('A', 'aguardando', [1, 2]), carro('C', 'aguardando', [2, 3]), carro('B', 'aguardando', [3, 4])],
      },
      {
        novos: [ev('avanco', 'Carro A ocupou Q1'), ev('avanco', 'Carro C ocupou Q2'), ev('avanco', 'Carro B ocupou Q3')],
        carros: [carro('A', 'movimento', [1, 2], [1]), carro('C', 'movimento', [2, 3], [2]), carro('B', 'movimento', [3, 4], [3])],
      },
      {
        novos: [
          ev('bloqueio', 'Carro A pediu Q2 (ocupado por C): bloqueado'),
          ev('bloqueio', 'Carro C pediu Q3 (ocupado por B): bloqueado'),
          ev('espera', 'Carro B pediu Q4 (livre)'),
        ],
        carros: [carro('A', 'bloqueado', [1, 2], [1], 2), carro('C', 'bloqueado', [2, 3], [2], 3), carro('B', 'movimento', [3, 4], [3], 4)],
      },
      {
        novos: [ev('avanco', 'Carro B ocupou Q4 e liberou Q3'), ev('espera', 'Carro C pediu Q3 (livre)')],
        carros: [carro('A', 'bloqueado', [1, 2], [1], 2), carro('C', 'movimento', [2, 3], [2], 3), carro('B', 'movimento', [3, 4], [4])],
      },
      {
        novos: [
          ev('avanco', 'Carro B concluiu'),
          ev('avanco', 'Carro C ocupou Q3 e liberou Q2'),
          ev('espera', 'Carro A pediu Q2 (livre)'),
        ],
        carros: [carro('A', 'movimento', [1, 2], [1], 2), carro('C', 'movimento', [2, 3], [3]), carro('B', 'concluido', [3, 4])],
      },
      {
        novos: [ev('avanco', 'Carro C concluiu'), ev('avanco', 'Carro A ocupou Q2 e liberou Q1')],
        carros: [carro('A', 'movimento', [1, 2], [2]), carro('C', 'concluido', [2, 3]), carro('B', 'concluido', [3, 4])],
      },
      {
        novos: [ev('avanco', 'Carro A concluiu')],
        resultado: SEM_DEADLOCK,
        carros: [carro('A', 'concluido', [1, 2]), carro('C', 'concluido', [2, 3]), carro('B', 'concluido', [3, 4])],
      },
    ],
    ctx,
  );
  salvar('quase-deadlock.json', {
    id: 'quase-deadlock',
    nome: 'Quase-deadlock',
    descricao: 'Três carros em cadeia. Há espera, mas a cadeia não fecha: o último carro sai e tudo destrava.',
    configuracao: { modo: 'com-bloqueio', estrategia: 'nenhuma' },
    passos,
  });
}

// --------------------------------------------------------------- sem deadlock
{
  const ctx = { rodada: -1, eventos: [], espera: {} };
  const passos = gerar(
    [
      {
        novos: [ev('info', 'Simulação iniciada: 2 carros aguardando para entrar no cruzamento')],
        carros: [carro('A', 'aguardando', [1, 2]), carro('B', 'aguardando', [3, 4])],
      },
      {
        novos: [ev('avanco', 'Carro A ocupou Q1'), ev('avanco', 'Carro B ocupou Q3'), ev('espera', 'Carro A pediu Q2 (livre)'), ev('espera', 'Carro B pediu Q4 (livre)')],
        carros: [carro('A', 'movimento', [1, 2], [1], 2), carro('B', 'movimento', [3, 4], [3], 4)],
      },
      {
        novos: [ev('avanco', 'Carro A ocupou Q2 e liberou Q1'), ev('avanco', 'Carro B ocupou Q4 e liberou Q3')],
        carros: [carro('A', 'movimento', [1, 2], [2]), carro('B', 'movimento', [3, 4], [4])],
      },
      {
        novos: [ev('avanco', 'Carro A concluiu'), ev('avanco', 'Carro B concluiu')],
        resultado: SEM_DEADLOCK,
        carros: [carro('A', 'concluido', [1, 2]), carro('B', 'concluido', [3, 4])],
      },
    ],
    ctx,
  );
  salvar('sem-deadlock.json', {
    id: 'sem-deadlock',
    nome: 'Sem deadlock',
    descricao: 'Dois carros usam quadrantes diferentes: ninguém disputa recurso, ninguém espera.',
    configuracao: { modo: 'normal', estrategia: 'nenhuma' },
    passos,
  });
}
