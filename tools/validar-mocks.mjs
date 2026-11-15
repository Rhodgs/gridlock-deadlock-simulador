// Valida todos os mocks contra o contrato. Rode com: npm run validar
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarEstado } from '../packages/contrato/index.js';

const pasta = join(dirname(fileURLToPath(import.meta.url)), '..', 'mocks');
let total = 0;
let falhas = 0;

for (const arquivo of readdirSync(pasta).filter((f) => f.endsWith('.json'))) {
  const mock = JSON.parse(readFileSync(join(pasta, arquivo), 'utf8'));
  const sequencias = { passos: mock.passos ?? [], recuperacao: mock.recuperacao ?? [] };
  for (const [nome, lista] of Object.entries(sequencias)) {
    lista.forEach((estado, i) => {
      total += 1;
      const erros = validarEstado(estado);
      if (erros.length) {
        falhas += 1;
        console.error(`✗ ${arquivo} → ${nome}[${i}]`);
        erros.forEach((e) => console.error(`    - ${e}`));
      }
    });
  }
}

if (falhas) {
  console.error(`\n${falhas} de ${total} estados inválidos.`);
  process.exit(1);
}
console.log(`✓ ${total} estados válidos.`);
