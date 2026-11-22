// Comparação reproduzível das estratégias usando somente a API pública do core.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarSimulacao, CENARIOS } from '../packages/core/src/index.js';
import { MODOS } from '../packages/contrato/index.js';
import { gerarCenariosAleatorios } from './cenarios-aleatorios.mjs';

const ESTRATEGIAS = ['nenhuma', 'recuperacao', 'prevencao', 'evitacao'];
const SEMENTE = 2026;
const N_ALEATORIOS = 600;
const LIMITE_RODADAS = 100;
const pastaProjeto = join(dirname(fileURLToPath(import.meta.url)), '..');
const pastaDocs = join(pastaProjeto, 'docs');

function executar(config, { resolverNenhuma = false, descricao = 'cenário' } = {}) {
  let sim;
  try {
    sim = criarSimulacao(config);
  } catch (erro) {
    throw new Error(`Erro em ${descricao}: ${erro.message}`);
  }

  let houveDeadlock = false;
  let rodadaDeadlock = null;

  for (let i = 0; i < LIMITE_RODADAS; i++) {
    if (sim.finalizado()) break;
    const estado = sim.passo();
    if (estado.deadlock.detectado && !houveDeadlock) {
      houveDeadlock = true;
      rodadaDeadlock = estado.rodada;
    }
    if (resolverNenhuma && sim.podeResolver()) sim.resolver();
  }

  const final = sim.estado();
  if (final.deadlock.detectado && !houveDeadlock) {
    houveDeadlock = true;
    rodadaDeadlock = final.rodada;
  }

  return {
    deadlock: houveDeadlock ? 'sim' : 'não',
    rodadaDeadlock: rodadaDeadlock ?? '-',
    terminou: final.metricas.concluidos === final.metricas.total ? 'sim' : 'não',
    rodadas: final.rodada,
    tempoMedioEspera: final.metricas.tempoMedioEspera,
    concluidos: `${final.metricas.concluidos}/${final.metricas.total}`,
    pedidosBloqueados: final.eventos.filter((evento) => evento.tipo === 'bloqueio').length,
    recuperacoes: final.eventos.filter((evento) => evento.tipo === 'recuperacao').length,
  };
}

function media(valores) {
  if (!valores.length) return '-';
  return (valores.reduce((total, valor) => total + valor, 0) / valores.length).toFixed(2);
}

function porc(valor, total) {
  return `${((valor / total) * 100).toFixed(1)}%`;
}

function csvLinha(valores) {
  return valores.map((valor) => {
    const texto = String(valor);
    return /[",;\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
  }).join(',');
}

function tabelaMarkdown(titulo, linhas) {
  if (!linhas.length) return `## ${titulo}\n\nSem dados.\n`;
  const cabecalho = Object.keys(linhas[0]);
  const esc = (valor) => String(valor).replaceAll('|', '\\|');
  return [
    `## ${titulo}`,
    '',
    `| ${cabecalho.join(' | ')} |`,
    `| ${cabecalho.map(() => '---').join(' | ')} |`,
    ...linhas.map((linha) => `| ${cabecalho.map((chave) => esc(linha[chave])).join(' | ')} |`),
    '',
  ].join('\n');
}

function principal() {
  const fixas = [];
  for (const cenario of CENARIOS) {
    for (const modo of MODOS) {
      for (const estrategia of ESTRATEGIAS) {
        const descricao = `${cenario.nome}, modo ${modo}, estratégia ${estrategia}`;
        const resultado = executar(
          { carros: cenario.carros, modo, estrategia },
          { descricao },
        );
        fixas.push({
          cenário: cenario.nome,
          modo,
          estratégia: estrategia,
          deadlock: resultado.deadlock,
          rodadaDeadlock: resultado.rodadaDeadlock,
          terminou: resultado.terminou,
          rodadas: resultado.rodadas,
          tempoMedioEspera: resultado.tempoMedioEspera,
          concluidos: resultado.concluidos,
          'pedidos bloqueados': resultado.pedidosBloqueados,
        });

        if (estrategia === 'nenhuma') {
          const resolvido = executar(
            { carros: cenario.carros, modo, estrategia },
            { resolverNenhuma: true, descricao: `${descricao} + resolver()` },
          );
          fixas.push({
            cenário: cenario.nome,
            modo,
            estratégia: 'nenhuma + resolver',
            deadlock: resolvido.deadlock,
            rodadaDeadlock: resolvido.rodadaDeadlock,
            terminou: resolvido.terminou,
            rodadas: resolvido.rodadas,
            tempoMedioEspera: resolvido.tempoMedioEspera,
            concluidos: resolvido.concluidos,
            'pedidos bloqueados': resolvido.pedidosBloqueados,
          });
        }
      }
    }
  }

  const aleatorias = gerarCenariosAleatorios({
    semente: SEMENTE,
    quantidade: N_ALEATORIOS,
  });
  const resumoAleatorio = [];
  let travaNenhuma = 0;

  for (const estrategia of ESTRATEGIAS) {
    const resultados = aleatorias.map((config, i) => executar(
      { carros: config.carros, modo: config.modo, estrategia },
      { descricao: `cenário aleatório ${i + 1} (${JSON.stringify(config)})` },
    ));
    const terminaram = resultados.filter((resultado) => resultado.terminou === 'sim');
    const comDeadlock = resultados.filter((resultado) => resultado.deadlock === 'sim').length;
    if (estrategia === 'nenhuma') travaNenhuma = comDeadlock;

    resumoAleatorio.push({
      estratégia: estrategia,
      deadlockPercentual: porc(comDeadlock, N_ALEATORIOS),
      terminouPercentual: porc(terminaram.length, N_ALEATORIOS),
      'cenários que terminaram (n)': `${terminaram.length}`,
      mediaRodadas: media(terminaram.map((resultado) => resultado.rodadas)),
      mediaTempoMedioEspera: media(terminaram.map((resultado) => resultado.tempoMedioEspera)),
      'vezes que recuperação foi acionada': estrategia === 'recuperacao'
        ? resultados.reduce((total, resultado) => total + resultado.recuperacoes, 0)
        : '-',
    });
  }

  console.table(fixas);
  console.table(resumoAleatorio);
  console.log(`Nenhuma estratégia: ${travaNenhuma} de ${N_ALEATORIOS} cenários aleatórios travam em deadlock.`);

  mkdirSync(pastaDocs, { recursive: true });
  const data = new Date().toISOString().slice(0, 10);
  const md = [
    '# Comparação das estratégias',
    '',
    `Data: ${data}  `,
    `Semente: ${SEMENTE}  `,
    `Cenários aleatórios: ${N_ALEATORIOS}`,
    '',
    tabelaMarkdown('Cenários fixos', fixas),
    tabelaMarkdown('Cenários aleatórios', resumoAleatorio),
    `Nenhuma estratégia: ${travaNenhuma} de ${N_ALEATORIOS} cenários aleatórios travam em deadlock.`,
    '',
  ].join('\n');
  writeFileSync(join(pastaDocs, 'comparacao-estrategias.md'), md);

  const cabecalhoFixas = [
    'cenario', 'modo', 'estrategia', 'deadlock', 'rodadaDeadlock', 'terminou',
    'rodadas', 'tempoMedioEspera', 'concluidos', 'pedidosBloqueados',
  ];
  const linhasCsv = [csvLinha(cabecalhoFixas)];
  for (const linha of fixas) {
    linhasCsv.push(csvLinha([
      linha.cenário,
      linha.modo,
      linha.estratégia,
      linha.deadlock,
      linha.rodadaDeadlock,
      linha.terminou,
      linha.rodadas,
      linha.tempoMedioEspera,
      linha.concluidos,
      linha['pedidos bloqueados'],
    ]));
  }
  linhasCsv.push('');
  linhasCsv.push(csvLinha([
    'estrategia', 'deadlockPercentual', 'terminouPercentual',
    'cenariosTerminados', 'mediaRodadas', 'mediaTempoMedioEspera',
    'vezesRecuperacaoAcionada',
  ]));
  for (const linha of resumoAleatorio) {
    linhasCsv.push(csvLinha([
      linha.estratégia,
      linha.deadlockPercentual,
      linha.terminouPercentual,
      linha['cenários que terminaram (n)'],
      linha.mediaRodadas,
      linha.mediaTempoMedioEspera,
      linha['vezes que recuperação foi acionada'],
    ]));
  }
  writeFileSync(join(pastaDocs, 'comparacao-estrategias.csv'), `${linhasCsv.join('\n')}\n`);
}

try {
  principal();
} catch (erro) {
  console.error(`Erro ao comparar estratégias: ${erro.message}`);
  process.exitCode = 1;
}
