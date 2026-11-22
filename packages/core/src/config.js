import { ESTRATEGIAS, MODOS } from '../../contrato/index.js';

// Quadrantes vizinhos: Q1-Q2, Q2-Q3, Q3-Q4, Q4-Q1 (Q1-Q3 e Q2-Q4 são diagonais).
const vizinhos = (a, b) => (a - b + 4) % 4 === 1 || (b - a + 4) % 4 === 1;

/** Confere a configuração e preenche os padrões. Lança Error em português se algo estiver errado. */
export function normalizarConfig(config = {}) {
  const modo = config.modo ?? 'normal';
  const estrategia = config.estrategia ?? 'nenhuma';
  if (!MODOS.includes(modo)) throw new Error(`Modo inválido: "${modo}" (use ${MODOS.join(' ou ')})`);
  if (!ESTRATEGIAS.includes(estrategia)) throw new Error(`Estratégia inválida: "${estrategia}"`);

  const lista = config.carros;
  if (!Array.isArray(lista) || lista.length < 1 || lista.length > 4) throw new Error('Informe de 1 a 4 carros');

  const ids = new Set();
  const ocupacaoInicial = new Map();
  const carros = lista.map((c, i) => {
    if (typeof c.id !== 'string' || !c.id) throw new Error(`Carro ${i + 1}: id obrigatório (uma letra)`);
    if (ids.has(c.id)) throw new Error(`Carro ${c.id}: id repetido`);
    ids.add(c.id);
    const rota = c.rota;
    if (!Array.isArray(rota) || rota.length < 1 || !rota.every((q) => Number.isInteger(q) && q >= 1 && q <= 4)) {
      throw new Error(`Carro ${c.id}: a rota deve ser uma lista de quadrantes de 1 a 4`);
    }
    if (new Set(rota).size !== rota.length) throw new Error(`Carro ${c.id}: a rota não pode repetir quadrantes`);
    for (let k = 1; k < rota.length; k++) {
      if (!vizinhos(rota[k - 1], rota[k])) throw new Error(`Carro ${c.id}: Q${rota[k - 1]} e Q${rota[k]} não são vizinhos`);
    }
    const inicial = rota[0];
    const outro = ocupacaoInicial.get(inicial);
    if (outro) throw new Error(`Os carros ${outro} e ${c.id} começam no mesmo quadrante (Q${inicial}).`);
    ocupacaoInicial.set(inicial, c.id);
    // normal: um carro chega por rodada; com-bloqueio: todos chegam juntos
    const chegada = c.chegada ?? (modo === 'normal' ? i : 0);
    if (!Number.isInteger(chegada) || chegada < 0) throw new Error(`Carro ${c.id}: chegada deve ser um inteiro >= 0`);
    return { id: c.id, cor: c.cor, rota: [...rota], chegada };
  });

  return { modo, estrategia, carros };
}
