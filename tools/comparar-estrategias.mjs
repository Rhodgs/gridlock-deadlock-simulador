// Comparação reproduzível das estratégias usando somente a API pública do core.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarSimulacao, CENARIOS } from '../packages/core/src/index.js';
import { MODOS } from '../packages/contrato/index.js';

const ESTRATEGIAS = ['nenhuma', 'recuperacao', 'prevencao', 'evitacao'];
const SEmente = 2026;
const N_ALEATORIOS = 300;
const LIMITE_RODADAS = 100;
const pastaProjeto = join(dirname(fileURLToPath(import.meta.url)), '..');
const pastaDocs = join(pastaProjeto, 'docs');

function aleatorio(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function configAleatoria(rand) {
  const n = 1 + Math.floor(rand() * 4);
  const carros = [];
  for (let i = 0; i < n; i++) {
    const inicio = 1 + Math.floor(rand() * 4);
    const sentido = rand() < 0.5 ? 1 : 3;
    const tamanho = 1 + Math.floor(rand() * 4);
    const rota = Array.from({ length: tamanho }, (_, k) => ((inicio - 1 + sentido * k) % 4) + 1);
    carros.push({ id: 'ABCD'[i], rota });
  }
  return { carros, modo: MODOS[Math.floor(rand() * 2)] };
}

function executar(config, resolverNenhuma = false) {
  const sim = criarSimulacao(config);
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
  const vetos = final.eventos.filter((evento) => evento.tipo === 'bloqueio').length;
  return {
    deadlock: houveDeadlock ? 'sim' : 'não',
    rodadaDeadlock: rodadaDeadlock ?? '-',
    terminou: final.metricas.concluidos === final.metricas.total ? 'sim' : 'não',
    rodadas: final.rodada,
    tempoMedioEspera: final.metricas.tempoMedioEspera,
    concluidos: `${final.metricas.concluidos}/${final.metricas.total}`,
    vetos,
  };
}

function media(valores) {
  return (valores.reduce((total, valor) => total + valor, 0) / valores.length).toFixed(2);
}

function porc(percentual) {
  return `${percentual.toFixed(1)}%`;
}

function csvLinha(values) {
  return values.map((valor) => {
    const texto = String(valor);
    return /[",;\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
  }).join(',');
}

function tabelaMarkdown(titulo, linhas) {
  if (!linhas.length) return `## ${titulo}\n\nSem dados.\n`;
  const cabecalho = Object.keys(linhas[0]);
  const escapes = (valor) => String(valor).replaceAll('|', '\\|');
  return [
    `## ${titulo}`,
    '',
    `| ${cabecalho.join(' | ')} |`,
    `| ${cabecalho.map(() => '---').join(' | ')} |`,
    ...linhas.map((linha) => `| ${cabecalho.map((chave) => escapes(linha[chave])).join(' | ')} |`),
    '',
  ].join('\n');
}

function principal() {
  const fixas = [];
  for (const cenario of CENARIOS) {
    for (const modo of MODOS) {
      for (const estrategia of ESTRATEGIAS) {
        const resultado = executar({ carros: cenario.carros, modo, estrategia });
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
          vetos: resultado.vetos,
        });

        if (estrategia === 'nenhuma') {
          const resolvido = executar({ carros: cenario.carros, modo, estrategia }, true);
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
            vetos: resolvido.vetos,
          });
        }
      }
    }
  }

  const rand = aleatorio(SEmente);
  const aleatorias = [];
  for (let i = 0; i < N_ALEATORIOS; i++) {
    const base = configAleatoria(rand);
    aleatorias.push({ id: i + 1, ...base });
  }

  const resumoAleatorio = [];
  let travaNENHUMA = 0;
  for (const estrategia of ESTRATEGIAS) {
    const resultados = aleatorias.map((config) => executar({
      carros: config.carros,
      modo: config.modo,
      estrategia,
    }));
    const comDeadlock = resultados.filter((resultado) => resultado.deadlock === 'sim').length;
    const terminaram = resultados.filter((resultado) => resultado.terminou === 'sim').length;
    if (estrategia === 'nenhuma') {
      travaNENHUMA = comDeadlock;
    }
    resumoAleatorio.push({
      estratégia: estrategia,
      deadlockPercentual: porc((comDeadlock / N_ALEATORIOS) * 100),
      terminouPercentual: porc((terminaram / N_ALEATORIOS) * 100),
      mediaRodadas: media(resultados.map((resultado) => resultado.rodadas)),
      mediaTempoMedioEspera: media(resultados.map((resultado) => resultado.tempoMedioEspera)),
    });
  }

  console.table(fixas);
  console.table(resumoAleatorio);
  console.log(`Nenhuma estratégia: ${travaNENHUMA} de ${N_ALEATORIOS} cenários aleatórios travam em deadlock.`);

  mkdirSync(pastaDocs, { recursive: true });
  const data = new Date().toISOString().slice(0, 10);
  const md = [
    '# Comparação das estratégias',
    '',
    `Data: ${data}  `,
    `Semente: ${SEmente}  `,
    `Cenários aleatórios: ${N_ALEATORIOS}`,
    '',
    tabelaMarkdown('Cenários fixos', fixas),
    tabelaMarkdown('Cenários aleatórios', resumoAleatorio),
    `Nenhuma estratégia: ${travaNENHUMA} de ${N_ALEATORIOS} cenários aleatórios travam em deadlock.`,
    '',
  ].join('\n');
  writeFileSync(join(pastaDocs, 'comparacao-estrategias.md'), md);

  const cabecalhoCsv = ['cenario', 'modo', 'estrategia', 'deadlock', 'rodadaDeadlock', 'terminou', 'rodadas', 'tempoMedioEspera', 'concluidos', 'vetos'];
  const linhasCsv = [csvLinha(cabecalhoCsv)];
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
      linha.vetos,
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
