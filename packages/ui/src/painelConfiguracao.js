import { el } from './dom.js';
import { criarJanela } from './janela.js';
import { MODOS, ESTRATEGIAS } from '../../contrato/index.js';

const ROTULOS_MODOS = {
  normal: 'Normal (um carro chega por rodada)',
  'com-bloqueio': 'Com bloqueio (todos chegam juntos)',
};
const ROTULOS_ESTRATEGIAS = {
  nenhuma: 'Nenhuma',
  prevencao: 'Prevenção',
  evitacao: 'Evitação',
  recuperacao: 'Detecção + recuperação',
};

const OPCOES_MODOS = MODOS.map((valor) => [valor, ROTULOS_MODOS[valor]]);
const OPCOES_ESTRATEGIAS = ESTRATEGIAS.map((valor) => [valor, ROTULOS_ESTRATEGIAS[valor]]);

function seletor(rotulo, opcoes, atual, travado, onChange) {
  return el(
    'label',
    { class: 'campo' },
    rotulo,
    el(
      'select',
      { disabled: travado, onchange: (e) => onChange?.(e.target.value) },
      ...opcoes.map(([valor, texto]) => el('option', { value: valor, selected: valor === atual }, texto)),
    ),
  );
}

/**
 * Painel da esquerda. Trava (fica cinza) quando a simulação já começou.
 * @param {{cenarios:{id:string,nome:string}[], cenarioAtual:string, descricao?:string, modo:string, estrategia:string,
 *          travado:boolean, onCenario:Function, onModo:Function, onEstrategia:Function}} p
 */
export function criarPainelConfiguracao({ cenarios, cenarioAtual, descricao, modo, estrategia, travado, onCenario, onModo, onEstrategia }) {
  const botoes = el(
    'div',
    { class: 'cenarios', role: 'group', 'aria-label': 'Cenários prontos' },
    ...cenarios.map((c) =>
      el(
        'button',
        {
          type: 'button',
          class: `btn cenario${c.id === cenarioAtual ? ' ativo' : ''}`,
          'aria-pressed': c.id === cenarioAtual,
          disabled: travado && c.id !== cenarioAtual,
          onclick: () => onCenario?.(c.id),
        },
        c.nome,
      ),
    ),
    el('button', { type: 'button', class: 'btn cenario', disabled: true, title: 'Em breve' }, 'Personalizado (em breve)'),
  );

  return criarJanela(
    'Configuração',
    [
      botoes,
      seletor('Modo', OPCOES_MODOS, modo, travado, onModo),
      seletor('Estratégia', OPCOES_ESTRATEGIAS, estrategia, travado, onEstrategia),
      descricao ? el('p', { class: 'nota' }, descricao) : null,
      el('p', { class: 'nota' }, travado ? 'Reinicie para mudar a configuração.' : 'Mudar o modo ou a estratégia reinicia a simulação.'),
    ],
    { classe: 'janela-config' },
  );
}
