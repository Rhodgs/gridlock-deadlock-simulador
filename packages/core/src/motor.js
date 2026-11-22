// Motor de rodadas. Não conhece tela, só o formato do CONTRATO.md.
//
// Uma rodada funciona assim:
//   1. O estado mostra onde cada carro está e o PLANO da rodada: quem pediu o quê, quem será
//      atendido (seta verde) e quem ficará parado (seta vermelha).
//   2. avancar() executa o plano: os carros atendidos andam, os que estavam no último
//      quadrante saem, e o motor planeja a rodada seguinte.
//
// O plano é feito sobre uma "foto" do início da rodada, em ordem de prioridade (ordem da lista
// de carros). Por isso o resultado não depende de quem é percorrido primeiro e um quadrante
// liberado agora só pode ser usado na rodada seguinte.

import { construirGrafoEspera, encontrarCiclo } from './deteccao.js';
import { obterEstrategia } from './estrategias/index.js';

export const LIMITE_RODADAS = 200;

const Q = (q) => `Q${q}`;
const lista = (qs) => qs.map(Q).join(', ');

export function evento(interno, tipo, texto) {
  interno.eventos.push({ rodada: interno.rodada, tipo, texto });
}

/** Cria o estado interno (dados simples, clonável) na rodada 0. */
export function criarInterno(config) {
  const interno = {
    config,
    rodada: 0,
    carros: config.carros.map((c) => ({
      id: c.id,
      cor: c.cor,
      rota: [...c.rota],
      chegada: c.chegada,
      idx: -1, // posição na rota (-1 = ainda não entrou)
      segura: [],
      concluido: false,
      // plano da rodada
      estado: 'aguardando',
      espera: null,
      motivo: null,
      razao: null,
      concede: false,
      avanca: false,
      sai: false,
      chave: '',
    })),
    eventos: [],
    esperaTotal: 0,
    vitimas: [],
    ciclo: [],
  };
  const n = config.carros.length;
  evento(interno, 'info', `Simulação iniciada: ${n} ${n === 1 ? 'carro' : 'carros'} (modo ${config.modo}, estratégia ${config.estrategia})`);
  planejar(interno);
  return interno;
}

export function ocupacao(interno) {
  const mapa = new Map();
  for (const c of interno.carros) for (const q of c.segura) mapa.set(q, c);
  return mapa;
}

export function quadrantesDoInterno(interno) {
  const ocup = ocupacao(interno);
  return [1, 2, 3, 4].map((id) => ({ id, ocupadoPor: ocup.get(id)?.id ?? null }));
}

export function todosConcluidos(interno) {
  return interno.carros.every((c) => c.concluido);
}

/** Calcula o plano da rodada atual, detecta deadlock e atualiza as métricas. */
export function planejar(interno) {
  const est = obterEstrategia(interno.config.estrategia);
  const ocup = ocupacao(interno);
  const reivindicados = new Map(); // quadrante → carro que foi atendido nesta rodada
  // visão "como ficará" usada pela evitação para testar se um pedido deixa o estado seguro
  const tentativa = new Map(
    interno.carros.map((c) => [c.id, { segura: [...c.segura], rota: c.rota, idx: c.idx, concluido: c.concluido }]),
  );

  for (const c of interno.carros) {
    const antes = c.chave;
    c.espera = null;
    c.motivo = null;
    c.razao = null;
    c.concede = false;
    c.avanca = false;
    c.sai = false;
    let alvos = [];
    let entrando = false;

    if (c.concluido) {
      c.estado = 'concluido';
    } else if (c.chegada > interno.rodada) {
      c.estado = 'aguardando'; // ainda não chegou ao cruzamento
    } else if (c.idx >= 0 && c.segura.length > 1) {
      // rota reservada (prevenção): segue para o próximo quadrante que já é dele
      c.avanca = true;
      c.estado = 'movimento';
      Object.assign(tentativa.get(c.id), { segura: c.segura.slice(1), idx: c.idx + 1 });
    } else if (c.idx >= 0 && c.idx === c.rota.length - 1) {
      c.sai = true; // está no último quadrante: sai do cruzamento
      c.estado = 'movimento';
      Object.assign(tentativa.get(c.id), { segura: [], concluido: true });
    } else {
      entrando = c.idx < 0;
      alvos = entrando ? est.quadrantesDeEntrada(c) : [c.rota[c.idx + 1]];
      const ocupado = alvos.find((q) => ocup.has(q) && ocup.get(q) !== c);
      const conflito = alvos.find((q) => reivindicados.has(q));
      const hipotese = entrando
        ? { segura: est.reservaRota ? [...c.rota] : [c.rota[0]], rota: c.rota, idx: 0, concluido: false }
        : { segura: [alvos[0]], rota: c.rota, idx: c.idx + 1, concluido: false };

      if (ocupado !== undefined) {
        c.espera = ocupado;
        c.estado = 'bloqueado';
        c.motivo = 'ocupado';
      } else if (conflito !== undefined) {
        c.espera = conflito;
        c.estado = 'bloqueado';
        c.motivo = 'negado';
        c.razao = `prioridade:${reivindicados.get(conflito).id}`;
      } else if (est.vetar?.(tentativa, c, hipotese)) {
        c.espera = alvos[0];
        c.estado = 'bloqueado';
        c.motivo = 'negado';
        c.razao = 'veto';
      } else {
        c.espera = alvos[0];
        c.concede = true;
        c.estado = entrando ? 'aguardando' : 'movimento';
        for (const q of alvos) reivindicados.set(q, c);
        tentativa.set(c.id, hipotese);
      }
    }

    c.chave = [c.estado, c.espera, c.motivo, c.razao].join(':');
    if (c.chave !== antes) registrarPedido(interno, c, alvos, entrando, ocup, est);
  }

  interno.ciclo = encontrarCiclo(
    construirGrafoEspera(interno.carros, quadrantesDoInterno(interno)),
    interno.carros.map((c) => c.id),
  );
  if (interno.ciclo.length) {
    evento(interno, 'deadlock', `Ciclo detectado: ${[...interno.ciclo, interno.ciclo[0]].join(' → ')}`);
  }
  interno.esperaTotal += interno.carros.filter((c) => c.estado === 'bloqueado').length;
}

function registrarPedido(interno, c, alvos, entrando, ocup, est) {
  const pedido = alvos.length > 1 ? `a rota ${lista(alvos)}` : Q(c.espera);
  if (c.estado === 'bloqueado') {
    if (c.motivo === 'ocupado') {
      const detalhe = alvos.length > 1 ? `${Q(c.espera)} ocupado` : 'ocupado';
      evento(interno, 'bloqueio', `Carro ${c.id} pediu ${pedido} (${detalhe} por ${ocup.get(c.espera).id}): bloqueado`);
    } else if (c.razao?.startsWith('prioridade:')) {
      evento(interno, 'bloqueio', `Carro ${c.id} pediu ${pedido} (livre), mas o carro ${c.razao.split(':')[1]} tem prioridade`);
    } else {
      evento(interno, 'bloqueio', `Carro ${c.id} pediu ${pedido} (livre), mas ${est.mensagemVeto}`);
    }
  } else if (c.concede && !entrando) {
    evento(interno, 'espera', `Carro ${c.id} pediu ${Q(c.espera)} (livre)`);
  }
}

/** Executa o plano da rodada e planeja a próxima. */
export function avancar(interno) {
  const est = obterEstrategia(interno.config.estrategia);
  interno.rodada += 1;
  for (const c of interno.carros) {
    if (c.sai) {
      c.segura = [];
      c.concluido = true;
      evento(interno, 'avanco', `Carro ${c.id} concluiu`);
    } else if (c.avanca) {
      const de = c.segura[0];
      c.segura = c.segura.slice(1);
      c.idx += 1;
      evento(interno, 'avanco', `Carro ${c.id} ocupou ${Q(c.segura[0])} e liberou ${Q(de)}`);
    } else if (c.concede && c.idx < 0) {
      c.idx = 0;
      c.segura = est.reservaRota ? [...c.rota] : [c.rota[0]];
      evento(
        interno,
        'avanco',
        est.reservaRota && c.rota.length > 1
          ? `Carro ${c.id} reservou a rota ${lista(c.rota)} e ocupou ${Q(c.rota[0])}`
          : `Carro ${c.id} ocupou ${Q(c.rota[0])}`,
      );
    } else if (c.concede) {
      const de = c.segura[0];
      c.idx += 1;
      c.segura = [c.rota[c.idx]];
      evento(interno, 'avanco', `Carro ${c.id} ocupou ${Q(c.segura[0])} e liberou ${Q(de)}`);
    }
  }
  planejar(interno);
}

const arredondar = (n) => Math.round(n * 10) / 10;

/** Converte o estado interno no formato do CONTRATO.md (cópia: o chamador não altera o motor). */
export function paraEstado(interno) {
  const quadrantes = quadrantesDoInterno(interno);
  const carros = interno.carros.map((c) => {
    const o = { id: c.id };
    if (c.cor) o.cor = c.cor;
    o.estado = c.estado;
    if (c.estado === 'bloqueado') o.motivo = c.motivo;
    o.rota = [...c.rota];
    o.segura = [...c.segura];
    o.espera = c.espera;
    return o;
  });
  const bloqueadosPorOcupacao = carros.filter((c) => c.estado === 'bloqueado' && c.motivo === 'ocupado');
  const concluidos = carros.filter((c) => c.estado === 'concluido').length;
  const ciclo = [...interno.ciclo];

  let resultado = null;
  if (ciclo.length) {
    resultado = { tipo: 'deadlock', mensagem: 'Deadlock identificado: ciclo de espera detectado' };
  } else if (todosConcluidos(interno)) {
    const vitimas = [...new Set(interno.vitimas)];
    resultado = vitimas.length
      ? {
          tipo: 'recuperado',
          mensagem: `Deadlock resolvido por recuperação: ${vitimas.length === 1 ? 'Carro' : 'Carros'} ${vitimas.join(', ')} recuou`,
        }
      : { tipo: 'sem-deadlock', mensagem: 'Simulação concluída sem deadlock' };
  }

  return {
    rodada: interno.rodada,
    quadrantes,
    carros,
    deadlock: { detectado: ciclo.length > 0, ciclo },
    condicoes: {
      exclusaoMutua: quadrantes.some((q) => q.ocupadoPor !== null),
      posseEspera: bloqueadosPorOcupacao.some((c) => c.segura.length > 0),
      naoPreempcao: bloqueadosPorOcupacao.length > 0,
      esperaCircular: ciclo.length > 0,
    },
    eventos: interno.eventos.map((e) => ({ ...e })),
    resultado,
    metricas: {
      rodada: interno.rodada,
      concluidos,
      total: carros.length,
      bloqueados: carros.filter((c) => c.estado === 'bloqueado').length,
      tempoMedioEspera: arredondar(interno.esperaTotal / carros.length),
    },
  };
}
