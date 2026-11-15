// Paleta dos carros e rótulos compartilhados entre os componentes.

export const PALETAS = {
  A: { fill: '#2563eb', borda: '#1e3a8a', vidro: '#bfdbfe' }, // azul
  B: { fill: '#dc2626', borda: '#7f1d1d', vidro: '#fecaca' }, // vermelho
  C: { fill: '#eab308', borda: '#854d0e', vidro: '#fef9c3' }, // amarelo
  D: { fill: '#16a34a', borda: '#14532d', vidro: '#bbf7d0' }, // verde
};

const RESERVA = [
  { fill: '#7c3aed', borda: '#4c1d95', vidro: '#ddd6fe' },
  { fill: '#0891b2', borda: '#164e63', vidro: '#cffafe' },
];

/** Cor própria do carro (campo `cor` do contrato) ou paleta padrão pela letra. */
export function paletaDoCarro(id, cor) {
  if (cor) return { fill: cor, borda: '#14213d', vidro: '#e5e7eb' };
  return PALETAS[id] ?? RESERVA[id.charCodeAt(0) % RESERVA.length];
}

export const ROTULO_ESTADO = {
  aguardando: 'Aguardando',
  movimento: 'Em movimento',
  bloqueado: 'Bloqueado',
  concluido: 'Concluído',
};

export const nomeQuadrante = (q) => `Q${q}`;
