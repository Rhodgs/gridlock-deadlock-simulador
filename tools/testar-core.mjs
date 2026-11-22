// Testes do backend. Rode com: npm test
// Sem biblioteca: usa só node:assert. Cada teste imprime ✓ ou aborta com a falha.
import assert from 'node:assert/strict';
import { criarSimulacao, CENARIOS } from '../packages/core/src/index.js';
import { validarEstado, ESTRATEGIAS, MODOS } from '../packages/contrato/index.js';
import { gerarCenariosAleatorios } from './cenarios-aleatorios.mjs';

let total = 0;
function teste(nome, fn) {
  fn();
  total += 1;
  console.log('✓', nome);
}

/** Roda até acabar, validando todos os estados. Em estratégia 'nenhuma' resolve o deadlock à mão. */
function rodar(config, { maxResolver = 5 } = {}) {
  const sim = criarSimulacao(config);
  const estados = [sim.estado()];
  let resolvidos = 0;
  for (let i = 0; i < 400; i++) {
    for (const erro of validarEstado(estados.at(-1))) assert.fail(`estado inválido (rodada ${estados.at(-1).rodada}): ${erro}`);
    if (sim.finalizado()) {
      if (sim.podeResolver() && resolvidos < maxResolver) {
        resolvidos += 1;
        estados.push(sim.resolver());
        continue;
      }
      break;
    }
    estados.push(sim.passo());
  }
  for (const erro of validarEstado(estados.at(-1))) assert.fail(`estado final inválido: ${erro}`);
  return { sim, estados, final: estados.at(-1), resolvidos };
}

const classico = CENARIOS.find((c) => c.id === 'deadlock-classico');

teste('clássico + nenhuma: deadlock na rodada 1 com ciclo A → D → B → C', () => {
  const sim = criarSimulacao(classico);
  assert.equal(sim.estado().rodada, 0);
  const e = sim.passo();
  assert.equal(e.rodada, 1);
  assert.deepEqual(e.deadlock, { detectado: true, ciclo: ['A', 'D', 'B', 'C'] });
  assert.deepEqual(e.condicoes, { exclusaoMutua: true, posseEspera: true, naoPreempcao: true, esperaCircular: true });
  assert.equal(e.resultado.tipo, 'deadlock');
  assert.ok(sim.finalizado() && sim.podeResolver());
  assert.equal(sim.passo().rodada, 1, 'passo() depois do deadlock não avança');
});

teste('clássico + nenhuma + resolver(): recupera, vítima C, todos concluem', () => {
  const { final, resolvidos } = rodar(classico);
  assert.equal(resolvidos, 1);
  assert.equal(final.resultado.tipo, 'recuperado');
  assert.match(final.resultado.mensagem, /Carro C recuou/);
  assert.equal(final.metricas.concluidos, 4);
});

teste('clássico + recuperacao: resolve sozinha, sem chamar resolver()', () => {
  const { final, resolvidos } = rodar({ ...classico, estrategia: 'recuperacao' });
  assert.equal(resolvidos, 0);
  assert.equal(final.resultado.tipo, 'recuperado');
});

for (const estrategia of ['prevencao', 'evitacao']) {
  teste(`clássico + ${estrategia}: termina sem nenhum deadlock`, () => {
    const { estados, final } = rodar({ ...classico, estrategia });
    assert.ok(estados.every((e) => !e.deadlock.detectado));
    assert.equal(final.resultado.tipo, 'sem-deadlock');
    assert.equal(final.metricas.concluidos, 4);
  });
}

teste('prevenção nunca mostra a condição "posse e espera"', () => {
  const { estados } = rodar({ ...classico, estrategia: 'prevencao' });
  assert.ok(estados.every((e) => !e.condicoes.posseEspera));
});

teste('quase-deadlock: há espera, mas termina sem deadlock', () => {
  const c = CENARIOS.find((x) => x.id === 'quase-deadlock');
  const { estados, final } = rodar(c);
  assert.ok(estados.some((e) => e.metricas.bloqueados > 0));
  assert.ok(estados.every((e) => !e.deadlock.detectado));
  assert.equal(final.resultado.tipo, 'sem-deadlock');
});

teste('modo normal (chegadas escalonadas) evita o deadlock do clássico', () => {
  const { estados, final } = rodar({ ...classico, modo: 'normal' });
  assert.ok(estados.every((e) => !e.deadlock.detectado));
  assert.equal(final.resultado.tipo, 'sem-deadlock');
});

teste('sem-deadlock: ninguém espera', () => {
  const { final } = rodar(CENARIOS.find((x) => x.id === 'sem-deadlock'));
  assert.equal(final.metricas.tempoMedioEspera, 0);
});

teste('voltar() restaura exatamente os estados anteriores', () => {
  const sim = criarSimulacao({ ...classico, estrategia: 'evitacao' });
  const vistos = [sim.estado()];
  for (let i = 0; i < 4; i++) vistos.push(sim.passo());
  for (let i = 3; i >= 0; i--) assert.deepEqual(sim.voltar(), vistos[i]);
  assert.equal(sim.podeVoltar(), false);
  assert.deepEqual(sim.passo(), vistos[1], 'refazer o passo dá o mesmo resultado');
  sim.reiniciar();
  assert.deepEqual(sim.estado(), vistos[0]);
});

teste('resolver() também pode ser desfeito com voltar()', () => {
  const sim = criarSimulacao(classico);
  const antes = sim.passo();
  sim.resolver();
  assert.deepEqual(sim.voltar(), antes);
  assert.ok(sim.podeResolver());
});

teste('o estado devolvido é uma cópia (alterar não quebra o motor)', () => {
  const sim = criarSimulacao(classico);
  const e = sim.estado();
  e.carros[0].segura.push(4);
  e.eventos.length = 0;
  assert.deepEqual(sim.estado().carros[0].segura, []);
  assert.ok(sim.estado().eventos.length > 0);
});

teste('configurações inválidas lançam erro claro', () => {
  assert.throws(() => criarSimulacao({ carros: [] }), /1 a 4 carros/);
  assert.throws(() => criarSimulacao({ carros: [{ id: 'A', rota: [1, 3] }] }), /não são vizinhos/);
  assert.throws(() => criarSimulacao({ carros: [{ id: 'A', rota: [1, 2, 1] }] }), /repetir/);
  assert.throws(() => criarSimulacao({ carros: [{ id: 'A', rota: [1] }, { id: 'A', rota: [2] }] }), /repetido/);
  assert.throws(() => criarSimulacao({ carros: [{ id: 'A', rota: [1] }], modo: 'x' }), /Modo inválido/);
  assert.throws(() => criarSimulacao({ carros: [{ id: 'A', rota: [5] }] }), /1 a 4/);
});

teste('cenário personalizado idêntico ao clássico gera o mesmo deadlock', () => {
  const personalizado = {
    carros: [
      { id: 'A', rota: [1, 2] },
      { id: 'D', rota: [2, 3] },
      { id: 'B', rota: [3, 4] },
      { id: 'C', rota: [4, 1] },
    ],
    modo: 'com-bloqueio',
    estrategia: 'nenhuma',
  };
  const estado = criarSimulacao(personalizado).passo();
  assert.equal(estado.rodada, 1);
  assert.deepEqual(estado.deadlock.ciclo, ['A', 'D', 'B', 'C']);
});

teste('personalizado rejeita quadrantes diagonais pela configuração do core', () => {
  assert.throws(
    () => criarSimulacao({ carros: [{ id: 'A', rota: [1, 3] }], modo: 'com-bloqueio', estrategia: 'nenhuma' }),
    /não são vizinhos/,
  );
});

teste('personalizado rejeita dois carros no mesmo quadrante inicial', () => {
  assert.throws(
    () => criarSimulacao({
      carros: [
        { id: 'A', rota: [1, 2] },
        { id: 'B', rota: [1, 4] },
      ],
      modo: 'com-bloqueio',
      estrategia: 'nenhuma',
    }),
    /Os carros A e B começam no mesmo quadrante \(Q1\)\./,
  );
});

teste('personalizado rejeita quadrante repetido pela configuração do core', () => {
  assert.throws(
    () => criarSimulacao({ carros: [{ id: 'A', rota: [1, 2, 1] }], modo: 'com-bloqueio', estrategia: 'nenhuma' }),
    /não pode repetir quadrantes/,
  );
});

teste('600 cenários aleatórios: estados sempre válidos e estratégias nunca travam', () => {
  const cenarios = gerarCenariosAleatorios({ semente: 2026, quantidade: 600 });
  let deadlocksSemEstrategia = 0;
  for (const base of cenarios) {
    for (const estrategia of ESTRATEGIAS) {
      const cfg = { ...base, estrategia };
      let r;
      try {
        r = rodar(cfg, { maxResolver: 10 });
      } catch (erro) {
        throw new Error(`falhou em ${JSON.stringify(cfg)}: ${erro.message}`);
      }
      const concluiu = r.final.metricas.concluidos === r.final.metricas.total;
      assert.ok(concluiu, `não concluiu: ${JSON.stringify(cfg)}`);
      if (estrategia === 'prevencao' || estrategia === 'evitacao') {
        assert.ok(r.estados.every((e) => !e.deadlock.detectado), `${estrategia} deixou deadlock: ${JSON.stringify(cfg)}`);
      }
      if (estrategia === 'nenhuma' && r.resolvidos > 0) deadlocksSemEstrategia += 1;
    }
  }
  assert.ok(deadlocksSemEstrategia > 0, 'o sorteio deveria produzir ao menos um deadlock sem estratégia');
  console.log(`   (${deadlocksSemEstrategia} cenários tiveram deadlock sem estratégia)`);
});

console.log(`\n${total} testes passaram.`);
