import { evitacao } from './evitacao.js';
import { nenhuma } from './nenhuma.js';
import { prevencao } from './prevencao.js';
import { recuperacao } from './recuperacao.js';

const REGISTRO = { nenhuma, recuperacao, prevencao, evitacao };

export function obterEstrategia(nome) {
  const estrategia = REGISTRO[nome];
  if (!estrategia) throw new Error(`Estratégia ainda não implementada: "${nome}"`);
  return estrategia;
}
