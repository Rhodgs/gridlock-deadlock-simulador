// Página principal: junta a interface (packages/ui) com uma fonte de estados.
// Hoje a fonte são os MOCKS (mocks/*.json). Quando o backend estiver pronto, troque
// `carregarCenario` por chamadas a criarSimulacao() de packages/core (veja CONTRATO.md).

import {
  criarBanner, criarBarraControle, criarCruzamento, criarGrafoEspera, criarLegenda,
  criarLog, criarPainelCondicoes, criarPainelConfiguracao, criarPainelEstado,
} from '../packages/ui/src/index.js';

const CENARIOS = [
  { id: 'deadlock-classico', nome: 'Deadlock clássico', arquivo: '../mocks/deadlock-classico.json' },
  { id: 'quase-deadlock', nome: 'Quase-deadlock', arquivo: '../mocks/quase-deadlock.json' },
  { id: 'sem-deadlock', nome: 'Sem deadlock', arquivo: '../mocks/sem-deadlock.json' },
];
const INTERVALO_BASE_MS = 1300;

const $ = (id) => document.getElementById(id);
const app = { cenarioId: CENARIOS[0].id, mock: null, sequencia: [], indice: 0, rodando: false, timer: null, velocidade: 1, modo: 'normal', estrategia: 'nenhuma' };

const barra = criarBarraControle({
  onAlternar: () => (app.rodando ? pausar() : iniciar()),
  onPasso: () => avancar(),
  onVoltar: () => voltar(),
  onReiniciar: () => reiniciar(),
  onVelocidade: (v) => { app.velocidade = v; if (app.rodando) { pararTimer(); ligarTimer(); } },
  onResolver: () => resolver(),
  onExportar: () => exportarLog(),
});
$('barra').append(barra.elemento);

// ------------------------------------------------------------------ controle
const atual = () => app.sequencia[app.indice];
const naoTerminou = () => app.indice < app.sequencia.length - 1;

function ligarTimer() { app.timer = setInterval(avancar, INTERVALO_BASE_MS / app.velocidade); }
function pararTimer() { clearInterval(app.timer); app.timer = null; }

function iniciar() { if (!naoTerminou()) return; app.rodando = true; ligarTimer(); renderizar(); }
function pausar() { app.rodando = false; pararTimer(); renderizar(); }

function avancar() {
  if (naoTerminou()) app.indice += 1;
  if (!naoTerminou()) { app.rodando = false; pararTimer(); }
  renderizar();
}
function voltar() { if (app.indice > 0) { app.indice -= 1; renderizar(); } }
function reiniciar() { pararTimer(); app.rodando = false; app.indice = 0; app.sequencia = [...app.mock.passos]; renderizar(); }

function resolver() {
  if (!app.mock.recuperacao) return;
  app.sequencia = [...app.mock.passos.slice(0, app.indice + 1), ...app.mock.recuperacao];
  iniciar();
}

function exportarLog() {
  const linhas = atual().eventos.map((e) => `R${e.rodada} [${e.tipo}] ${e.texto}`);
  const url = URL.createObjectURL(new Blob([linhas.join('\n') + '\n'], { type: 'text/plain' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'gridlock-log.txt' });
  a.click();
  URL.revokeObjectURL(url);
}

async function carregarCenario(id) {
  pararTimer();
  app.rodando = false;
  const cenario = CENARIOS.find((c) => c.id === id);
  try {
    const resposta = await fetch(cenario.arquivo);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    app.mock = await resposta.json();
  } catch (erro) {
    $('palco').replaceChildren(Object.assign(document.createElement('p'), {
      className: 'erro',
      textContent: `Não foi possível carregar ${cenario.arquivo} (${erro.message}). Abra o projeto por um servidor (Live Server, "npm start"), não direto pelo arquivo.`,
    }));
    return;
  }
  app.cenarioId = id;
  app.sequencia = [...app.mock.passos];
  app.indice = 0;
  app.modo = app.mock.configuracao?.modo ?? 'normal';
  app.estrategia = app.mock.configuracao?.estrategia ?? 'nenhuma';
  renderizar();
}

// ------------------------------------------------------------------ desenho
function renderizar() {
  const estado = atual();
  const temRecuperacao = Boolean(app.mock.recuperacao);

  $('config').replaceChildren(criarPainelConfiguracao({
    cenarios: CENARIOS, cenarioAtual: app.cenarioId, modo: app.modo, estrategia: app.estrategia,
    travado: app.rodando || app.indice > 0,
    onCenario: carregarCenario,
    onModo: (v) => { app.modo = v; },
    onEstrategia: (v) => { app.estrategia = v; },
  }));
  $('palco').replaceChildren(criarCruzamento(estado), criarLegenda());
  $('lateral').replaceChildren(criarPainelEstado(estado), criarGrafoEspera(estado), criarPainelCondicoes(estado.condicoes));
  $('banner').replaceChildren(criarBanner(estado));
  $('log').replaceChildren(criarLog(estado.eventos));

  barra.atualizar({
    rodando: app.rodando,
    podeAvancar: naoTerminou(),
    podeVoltar: app.indice > 0,
    podeResolver: estado.deadlock.detectado && temRecuperacao,
  });
  atualizarIndicador(estado);
}

function atualizarIndicador(estado) {
  let tipo = 'parado';
  let texto = 'Parado';
  if (estado.deadlock.detectado) { tipo = 'deadlock'; texto = 'Deadlock'; }
  else if (estado.resultado) { tipo = 'ok'; texto = 'Concluído'; }
  else if (app.rodando) { tipo = 'rodando'; texto = 'Rodando'; }
  else if (app.indice > 0) { texto = 'Pausado'; }
  const indicador = $('indicador');
  indicador.dataset.estado = tipo;
  indicador.querySelector('b').textContent = texto;
}

// ------------------------------------------------------------------ atalhos e extras
$('animacoes').addEventListener('change', (e) => document.body.classList.toggle('sem-animacao', !e.target.checked));
document.addEventListener('keydown', (e) => {
  if (['SELECT', 'INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'Space') { e.preventDefault(); app.rodando ? pausar() : iniciar(); }
  else if (e.key === 'ArrowRight' && !app.rodando) avancar();
  else if (e.key === 'ArrowLeft' && !app.rodando) voltar();
  else if (e.key === 'r' || e.key === 'R') reiniciar();
});

carregarCenario(app.cenarioId);
