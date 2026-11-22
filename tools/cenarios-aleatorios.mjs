// Gera cenários aleatórios válidos compartilhados pelos testes e pelo relatório.
import { MODOS } from '../packages/contrato/index.js';

export function aleatorio(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gerarCenariosAleatorios({ semente = 2026, quantidade = 600 } = {}) {
  const rand = aleatorio(semente);
  const cenarios = [];

  for (let i = 0; i < quantidade; i++) {
    const n = 2 + Math.floor(rand() * 3);
    const carros = [];
    const inicios = new Set();

    for (let j = 0; j < n; j++) {
      let inicio = 1 + Math.floor(rand() * 4);
      while (inicios.has(inicio)) inicio = 1 + Math.floor(rand() * 4);
      inicios.add(inicio);

      const sentido = rand() < 0.5 ? 1 : 3;
      const tamanho = 2 + Math.floor(rand() * 3);
      const rota = Array.from({ length: tamanho }, (_, k) => ((inicio - 1 + sentido * k) % 4) + 1);
      carros.push({ id: 'ABCD'[j], rota });
    }

    cenarios.push({
      carros,
      modo: MODOS[Math.floor(rand() * 2)],
    });
  }

  return cenarios;
}
