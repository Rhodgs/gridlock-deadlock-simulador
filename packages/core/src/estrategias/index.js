import { nenhuma } from './nenhuma.js';

const REGISTRO = { nenhuma };

export function obterEstrategia(nome) {
  const estrategia = REGISTRO[nome];
  if (!estrategia) throw new Error(`Estratégia ainda não implementada: "${nome}"`);
  return estrategia;
}
