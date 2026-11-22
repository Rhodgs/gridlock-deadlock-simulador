// Página principal: junta a interface (packages/ui) com o backend (packages/core).
// O backend devolve estados no formato do CONTRATO.md e a interface só desenha.

import { CENARIOS, criarSimulacao } from '../packages/core/src/index.js';
import {
  criarBanner, criarBarraControle, criarCruzamento, criarGrafoEspera, criarLegenda,
  criarLog, criarPainelCondicoes, criarPainelConfiguracao, criarPainelEstado,
} from '../packages/ui/src/index.js';
import { animarCarros, limparPoses } from './animacao.js';

const INTERVALO_BASE_MS = 1300;

const $ = (id) => document.getElementById(id);
const app = { cenario: CENARIOS[0], sim: null, rodando: false, timer: null, velocidade: 1, modo: 'normal', estrategia: 'nenhuma' };

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
function ligarTimer() { app.timer = setInterval(avancar, INTERVALO_BASE_MS / app.velocidade); }
function pararTimer() { clearInterval(app.timer); app.timer = null; }

function iniciar() {
  if (app.sim.finalizado()) return;
  app.rodando = true;
  ligarTimer();
  renderizar();
}
function pausar() { app.rodando = false; pararTimer(); renderizar(); }

function avancar() {
  app.sim.passo();
  if (app.sim.finalizado()) { app.rodando = false; pararTimer(); }
  renderizar();
}
function voltar() { app.sim.voltar(); renderizar(); }
function reiniciar() {
  pararTimer();
  app.rodando = false;
  limparPoses();
  app.sim.reiniciar();
  renderizar();
}

function resolver() {
  app.sim.resolver();
  iniciar();
}

/** Cria uma simulação nova com o cenário, o modo e a estratégia escolhidos. */
function novaSimulacao() {
  pararTimer();
  app.rodando = false;
  limparPoses();
  app.sim = criarSimulacao({ carros: app.cenario.carros, modo: app.modo, estrategia: app.estrategia });
  renderizar();
}

function escolherCenario(id) {
  app.cenario = CENARIOS.find((c) => c.id === id);
  app.modo = app.cenario.modo;
  app.estrategia = app.cenario.estrategia;
  novaSimulacao();
}

function exportarLog() {
  const linhas = app.sim.estado().eventos.map((e) => `R${e.rodada} [${e.tipo}] ${e.texto}`);
  const url = URL.createObjectURL(new Blob([linhas.join('\n') + '\n'], { type: 'text/plain' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'gridlock-log.txt' });
  a.click();
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------------ desenho
function renderizar() {
  const estado = app.sim.estado();

  $('config').replaceChildren(criarPainelConfiguracao({
    cenarios: CENARIOS, cenarioAtual: app.cenario.id, descricao: app.cenario.descricao,
    modo: app.modo, estrategia: app.estrategia,
    travado: app.rodando || app.sim.podeVoltar(),
    onCenario: escolherCenario,
    onModo: (v) => { app.modo = v; novaSimulacao(); },
    onEstrategia: (v) => { app.estrategia = v; novaSimulacao(); },
  }));
  $('palco').replaceChildren(criarCruzamento(estado), criarLegenda());
  animarCarros($('palco'), (INTERVALO_BASE_MS / app.velocidade) * 0.7);
  $('lateral').replaceChildren(criarPainelEstado(estado), criarGrafoEspera(estado), criarPainelCondicoes(estado.condicoes));
  $('banner').replaceChildren(criarBanner(estado));
  $('log').replaceChildren(criarLog(estado.eventos));

  barra.atualizar({
    rodando: app.rodando,
    podeAvancar: !app.sim.finalizado(),
    podeVoltar: app.sim.podeVoltar(),
    podeResolver: app.sim.podeResolver(),
  });
  atualizarIndicador(estado);
}

function atualizarIndicador(estado) {
  let tipo = 'parado';
  let texto = 'Parado';
  if (estado.deadlock.detectado) { tipo = 'deadlock'; texto = 'Deadlock'; }
  else if (estado.resultado) { tipo = 'ok'; texto = 'Concluído'; }
  else if (app.rodando) { tipo = 'rodando'; texto = 'Rodando'; }
  else if (app.sim.podeVoltar()) { texto = 'Pausado'; }
  const indicador = $('indicador');
  indicador.dataset.estado = tipo;
  indicador.querySelector('b').textContent = texto;
}

// ------------------------------------------------------------------ atalhos e extras
$('animacoes').addEventListener('change', (e) => document.body.classList.toggle('sem-animacao', !e.target.checked));
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey) return;
  if (e.code === 'Space') { e.preventDefault(); app.rodando ? pausar() : iniciar(); }
  else if (e.key === 'ArrowRight' && !app.rodando && !app.sim.finalizado()) avancar();
  else if (e.key === 'ArrowLeft' && !app.rodando) voltar();
  else if (e.key === 'r' || e.key === 'R') reiniciar();
});

escolherCenario(app.cenario.id);
