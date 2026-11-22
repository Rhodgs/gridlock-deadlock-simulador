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

const VIZINHOS = {
  1: [2, 4],
  2: [1, 3],
  3: [2, 4],
  4: [1, 3],
};

function criarDialogPersonalizado({ personalizadoSalvo, onAplicarPersonalizado }) {
  const dialog = el('dialog', { class: 'dialogo-personalizado' });
  const form = el('form', { method: 'dialog', class: 'form-personalizado' });
  dialog.append(form);

  form.append(el('h3', null, 'Cenário personalizado'));
  const erros = el('p', { class: 'erros-personalizado', role: 'alert' });
  form.append(erros);

  const quantidade = el(
    'label',
    { class: 'campo campo-quantidade' },
    'Quantidade de carros',
    el(
      'select',
      { id: 'qtd-personalizado' },
      ...[2, 3, 4].map((valor) => el('option', { value: valor }, String(valor))),
    ),
  );
  form.append(quantidade);
  const carros = el('div', { class: 'rotas-personalizado' });
  form.append(carros);

  const acoes = el('div', { class: 'acoes-personalizado' });
  form.append(acoes);

  function opcao(valor, texto) {
    return el('option', { value: valor }, texto);
  }

  function seletorQuadrante(rotulo, anteriores, obrigatorio, atual) {
    const anterior = anteriores.at(-1);
    const opcoes = obrigatorio
      ? VIZINHOS[anterior] ?? [1, 2, 3, 4]
      : [null, ...(VIZINHOS[anterior] ?? [])];
    const campo = el('label', { class: 'campo campo-rota' }, rotulo);
    const select = el(
      'select',
      { 'aria-label': rotulo },
      ...opcoes.map((quadrante) =>
        quadrante === null
          ? opcao('', '—')
          : opcao(String(quadrante), `Q${quadrante}`),
      ),
    );
    if (atual !== undefined && atual !== null) select.value = String(atual);
    campo.append(select);
    return campo;
  }

  function renderizarRotas(modelo) {
    const quantidadeSelect = form.querySelector('#qtd-personalizado');
    const qtd = Number(quantidadeSelect.value);
    const ids = ['A', 'B', 'C', 'D'];
    const ordemIds = modelo?.ordemIds ?? ids;
    carros.replaceChildren();

    for (let i = 0; i < qtd; i++) {
      const id = ordemIds[i] ?? ids[i];
      const rota = modelo?.carros?.find((carro) => carro.id === id)?.rota ?? [];
      const fieldset = el('fieldset', { class: 'rota-carro', 'data-carro-id': id });
      fieldset.append(el('legend', null, `Carro ${id}`));

      const primeiro = el('select', { 'aria-label': `Carro ${id} - 1º quadrante` });
      for (const q of [1, 2, 3, 4]) primeiro.append(opcao(String(q), `Q${q}`));
      if (rota[0]) primeiro.value = String(rota[0]);
      const primeiroCampo = el('label', { class: 'campo campo-rota' }, '1º quadrante');
      primeiroCampo.append(primeiro);

      const segundo = el('select', { 'aria-label': `Carro ${id} - 2º quadrante` });
      const segundoCampo = el('label', { class: 'campo campo-rota' }, '2º');

      const terceiro = el('select', { 'aria-label': `Carro ${id} - 3º quadrante (opcional)` });
      const terceiroCampo = el('label', { class: 'campo campo-rota' }, '3º');

      const quarto = el('select', { 'aria-label': `Carro ${id} - 4º quadrante (opcional)` });
      const quartoCampo = el('label', { class: 'campo campo-rota' }, '4º');

      function atualizarPrimeiro() {
        atualizarOpcoes(segundo, VIZINHOS[Number(primeiro.value)], rota[1]);
        atualizarSegundo();
      }
      function atualizarSegundo() {
        const q2 = Number(segundo.value);
        atualizarOpcoes(terceiro, q2 ? VIZINHOS[q2] : [], rota[2], false);
        atualizarTerceiro();
      }
      function atualizarTerceiro() {
        const q3 = Number(terceiro.value);
        if (q3) {
          quarto.disabled = false;
          atualizarOpcoes(quarto, VIZINHOS[q3], rota[3], false);
        } else {
          quarto.disabled = true;
          quarto.replaceChildren(opcao('', '—'));
        }
      }

      primeiro.addEventListener('change', atualizarPrimeiro);
      segundo.addEventListener('change', atualizarSegundo);
      terceiro.addEventListener('change', atualizarTerceiro);
      segundoCampo.append(segundo);
      terceiroCampo.append(terceiro);
      quartoCampo.append(quarto);
      fieldset.append(primeiroCampo, segundoCampo, terceiroCampo, quartoCampo);
      carros.append(fieldset);
      atualizarPrimeiro();
    }

    function atualizarOpcoes(select, opcoes, atual, obrigatorio = true) {
      select.disabled = false;
      select.replaceChildren();
      if (!obrigatorio) select.append(opcao('', '—'));
      for (const q of opcoes ?? []) select.append(opcao(String(q), `Q${q}`));
      if (atual !== undefined && [...select.options].some((option) => option.value === String(atual))) {
        select.value = String(atual);
      } else if (!obrigatorio) {
        select.value = '';
      }
    }
  }

  const modeloClassico = {
    ordemIds: ['A', 'D', 'B', 'C'],
    carros: [
      { id: 'A', rota: [1, 2] },
      { id: 'D', rota: [2, 3] },
      { id: 'B', rota: [3, 4] },
      { id: 'C', rota: [4, 1] },
    ],
  };
  const modeloInicial = personalizadoSalvo?.carros?.length
    ? personalizadoSalvo
    : modeloClassico;

  const quantidadeSelect = form.querySelector('#qtd-personalizado');
  quantidadeSelect.value = String(Math.max(2, Math.min(4, modeloInicial.carros.length)));
  quantidadeSelect.addEventListener('change', () => renderizarRotas({
    carros: [...carrosModelFromDom()],
  }));

  function carrosModelFromDom() {
    return [...carros.querySelectorAll('fieldset')].map((fieldset, i) => {
      const selects = [...fieldset.querySelectorAll('select')];
      return {
        id: fieldset.dataset.carroId,
        rota: selects
          .map((select) => Number(select.value))
          .filter((q) => Number.isInteger(q) && q >= 1 && q <= 4),
      };
    });
  }

  function coletar() {
    const result = carrosModelFromDom();
    const cenario = {
      id: 'personalizado',
      nome: 'Personalizado',
      descricao: 'Cenário personalizado.',
      carros: result,
    };
    const aplicacao = onAplicarPersonalizado?.(cenario);
    if (aplicacao?.erro) {
      erros.textContent = aplicacao.erro;
      return;
    }
    erros.textContent = '';
    dialog.close();
  }

  const aplicar = el('button', { type: 'button', class: 'btn primario' }, 'Aplicar');
  aplicar.addEventListener('click', coletar);
  const cancelar = el('button', { type: 'button', class: 'btn' }, 'Cancelar');
  cancelar.addEventListener('click', () => dialog.close());
  const modelo = el('button', { type: 'button', class: 'btn' }, 'Usar clássico como modelo');
  modelo.addEventListener('click', () => {
    erros.textContent = '';
    quantidadeSelect.value = '4';
    renderizarRotas(modeloClassico);
  });
  acoes.append(modelo, cancelar, aplicar);

  renderizarRotas(modeloInicial);

  dialog.abrir = () => {
    erros.textContent = '';
    const salvo = personalizedLoaded?.();
    const atual = salvo?.carros?.length ? salvo : modeloInicial;
    quantidadeSelect.value = String(Math.max(2, Math.min(4, atual.carros.length)));
    renderizarRotas(atual);
    if (!dialog.open) dialog.showModal();
    quantidadeSelect.focus();
  };

  let personalizedLoaded = null;
  personalizedLoaded = () => personalizadoSalvo;

  dialog.addEventListener('cancel', (evento) => {
    evento.preventDefault();
    dialog.close();
  });
  return dialog;
}

/**
 * Painel da esquerda. Trava (fica cinza) quando a simulação já começou.
 * @param {{cenarios:{id:string,nome:string}[], cenarioAtual:string, descricao?:string, modo:string, estrategia:string,
 *          travado:boolean, onCenario:Function, onModo:Function, onEstrategia:Function}} p
 */
export function criarPainelConfiguracao({
  cenarios,
  cenarioAtual,
  descricao,
  modo,
  estrategia,
  travado,
  onCenario,
  onModo,
  onEstrategia,
  personalizadoSalvo,
  onAplicarPersonalizado,
}) {
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
    el(
      'button',
      {
        type: 'button',
        class: `btn cenario${cenarioAtual === 'personalizado' ? ' ativo' : ''}`,
        'aria-pressed': cenarioAtual === 'personalizado',
        disabled: travado,
        onclick: abrirPersonalizado,
      },
      'Personalizado',
    ),
  );

  const janela = criarJanela(
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

  const dialog = criarDialogPersonalizado({
    personalizadoSalvo,
    onAplicarPersonalizado,
  });
  janela.append(dialog);
  function abrirPersonalizado() {
    if (travado) return;
    dialog.abrir();
  }
  return janela;
}
