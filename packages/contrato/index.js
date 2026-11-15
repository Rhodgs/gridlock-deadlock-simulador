// Constantes e validador do contrato (veja CONTRATO.md).
// Usado pelos scripts de teste e, se quiserem, pelo backend para checar a própria saída.

export const ESTADOS_CARRO = ['aguardando', 'movimento', 'bloqueado', 'concluido'];
export const TIPOS_EVENTO = ['info', 'avanco', 'espera', 'bloqueio', 'deadlock', 'recuperacao'];
export const TIPOS_RESULTADO = ['sem-deadlock', 'deadlock', 'recuperado'];
export const CONDICOES = ['exclusaoMutua', 'posseEspera', 'naoPreempcao', 'esperaCircular'];
export const MODOS = ['normal', 'com-bloqueio'];
export const ESTRATEGIAS = ['nenhuma', 'prevencao', 'evitacao', 'recuperacao'];

const ehQuadrante = (q) => Number.isInteger(q) && q >= 1 && q <= 4;

/** Devolve uma lista de erros em português. Lista vazia = estado válido. */
export function validarEstado(e) {
  if (!e || typeof e !== 'object') return ['o estado deve ser um objeto'];
  const erros = [];
  const err = (m) => erros.push(m);

  if (!Number.isInteger(e.rodada) || e.rodada < 0) err('rodada deve ser um inteiro >= 0');

  // quadrantes
  if (!Array.isArray(e.quadrantes) || e.quadrantes.length !== 4) {
    err('quadrantes deve ter exatamente 4 itens (Q1..Q4)');
  } else {
    e.quadrantes.forEach((q, i) => {
      if (q.id !== i + 1) err(`quadrantes[${i}].id deve ser ${i + 1}`);
      if (q.ocupadoPor !== null && typeof q.ocupadoPor !== 'string') {
        err(`quadrantes[${i}].ocupadoPor deve ser string ou null`);
      }
    });
  }

  // carros
  if (!Array.isArray(e.carros) || e.carros.length === 0) {
    err('carros deve ser uma lista não vazia');
    return erros;
  }
  const ids = new Set();
  for (const c of e.carros) {
    if (typeof c.id !== 'string' || !c.id) err('todo carro precisa de id (string)');
    if (ids.has(c.id)) err(`id de carro repetido: ${c.id}`);
    ids.add(c.id);
    if (!ESTADOS_CARRO.includes(c.estado)) err(`carro ${c.id}: estado inválido "${c.estado}"`);
    if (!Array.isArray(c.rota) || c.rota.length === 0 || !c.rota.every(ehQuadrante)) {
      err(`carro ${c.id}: rota deve ser uma lista de quadrantes 1..4`);
    }
    if (!Array.isArray(c.segura) || !c.segura.every(ehQuadrante)) {
      err(`carro ${c.id}: segura deve ser uma lista de quadrantes 1..4`);
    }
    if (c.espera !== null && !ehQuadrante(c.espera)) err(`carro ${c.id}: espera deve ser 1..4 ou null`);
    if (c.estado === 'concluido' && c.segura?.length) err(`carro ${c.id}: concluído não pode segurar quadrantes`);
  }

  // consistência quadrantes <-> carros
  if (Array.isArray(e.quadrantes) && e.quadrantes.length === 4) {
    for (const c of e.carros) {
      for (const q of c.segura ?? []) {
        if (e.quadrantes[q - 1]?.ocupadoPor !== c.id) {
          err(`carro ${c.id} segura Q${q}, mas o quadrante não está ocupado por ele`);
        }
      }
    }
    for (const q of e.quadrantes) {
      if (q.ocupadoPor !== null) {
        const dono = e.carros.find((c) => c.id === q.ocupadoPor);
        if (!dono) err(`Q${q.id} ocupado por carro inexistente: ${q.ocupadoPor}`);
        else if (!dono.segura.includes(q.id)) err(`Q${q.id} diz ser de ${dono.id}, mas ele não o segura`);
      }
    }
    for (const c of e.carros) {
      if (c.estado === 'bloqueado') {
        const dono = e.quadrantes[c.espera - 1]?.ocupadoPor;
        if (c.espera === null || !dono || dono === c.id) {
          err(`carro ${c.id} está bloqueado, mas não espera um quadrante ocupado por outro carro`);
        }
      }
    }
  }

  // deadlock
  if (!e.deadlock || typeof e.deadlock.detectado !== 'boolean' || !Array.isArray(e.deadlock.ciclo)) {
    err('deadlock deve ser { detectado: boolean, ciclo: [] }');
  } else if (e.deadlock.detectado) {
    const ciclo = e.deadlock.ciclo;
    if (ciclo.length < 2) err('deadlock detectado exige ciclo com pelo menos 2 carros');
    ciclo.forEach((id, i) => {
      const carro = e.carros.find((c) => c.id === id);
      const prox = ciclo[(i + 1) % ciclo.length];
      if (!carro) return err(`ciclo cita carro inexistente: ${id}`);
      const dono = e.quadrantes?.[carro.espera - 1]?.ocupadoPor;
      if (dono !== prox) err(`ciclo inconsistente: ${id} deveria esperar ${prox}, mas espera ${dono ?? 'ninguém'}`);
    });
  } else if (e.deadlock.ciclo.length) {
    err('sem deadlock detectado, ciclo deve ser []');
  }

  // condições
  for (const k of CONDICOES) {
    if (typeof e.condicoes?.[k] !== 'boolean') err(`condicoes.${k} deve ser boolean`);
  }

  // eventos
  if (!Array.isArray(e.eventos)) err('eventos deve ser uma lista');
  else {
    e.eventos.forEach((ev, i) => {
      if (!Number.isInteger(ev.rodada)) err(`eventos[${i}].rodada inválida`);
      if (!TIPOS_EVENTO.includes(ev.tipo)) err(`eventos[${i}].tipo inválido: "${ev.tipo}"`);
      if (typeof ev.texto !== 'string' || !ev.texto) err(`eventos[${i}].texto vazio`);
    });
  }

  // resultado
  if (e.resultado !== null) {
    if (!TIPOS_RESULTADO.includes(e.resultado?.tipo)) err('resultado.tipo inválido');
    if (typeof e.resultado?.mensagem !== 'string') err('resultado.mensagem deve ser string');
  }

  // métricas
  const m = e.metricas;
  for (const k of ['rodada', 'concluidos', 'total', 'bloqueados', 'tempoMedioEspera']) {
    if (typeof m?.[k] !== 'number') err(`metricas.${k} deve ser número`);
  }
  return erros;
}
