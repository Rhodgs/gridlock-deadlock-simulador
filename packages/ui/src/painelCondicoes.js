import { el } from './dom.js';
import { criarJanela } from './janela.js';

const ITENS = [
  ['exclusaoMutua', 'Exclusão mútua', 'Um quadrante só comporta um carro'],
  ['posseEspera', 'Posse e espera', 'Segura um quadrante e pede outro'],
  ['naoPreempcao', 'Não preempção', 'Ninguém toma o quadrante à força'],
  ['esperaCircular', 'Espera circular', 'Os pedidos formam um ciclo fechado'],
];

/** As quatro condições de Coffman "acendem" conforme aparecem no estado. */
export function criarPainelCondicoes(condicoes) {
  const todas = ITENS.every(([k]) => condicoes[k]);
  const lista = el(
    'ul',
    { class: 'condicoes' },
    ...ITENS.map(([chave, nome, explicacao]) =>
      el(
        'li',
        {
          class: `condicao${condicoes[chave] ? ' ativa' : ''}`,
          title: `${nome}: ${explicacao} — ${condicoes[chave] ? 'presente' : 'ausente'}`,
        },
        el('span', { class: 'condicao-marca', 'aria-hidden': 'true' }, condicoes[chave] ? '✔' : '○'),
        el('span', null, el('strong', null, nome), el('small', null, explicacao)),
        el('span', { class: 'sr-only' }, condicoes[chave] ? 'presente' : 'ausente'),
      ),
    ),
  );
  return criarJanela('4 condições do deadlock', [
    lista,
    todas ? el('p', { class: 'condicoes-aviso' }, 'As quatro juntas: deadlock!') : null,
  ], { classe: 'janela-condicoes', recolhivel: true });
}
