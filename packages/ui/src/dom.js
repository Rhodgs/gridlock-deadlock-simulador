// Helpers mínimos para criar elementos HTML e SVG sem biblioteca.
const SVG_NS = 'http://www.w3.org/2000/svg';

function aplicar(elemento, atributos) {
  for (const [chave, valor] of Object.entries(atributos ?? {})) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (chave.startsWith('on') && typeof valor === 'function') {
      elemento.addEventListener(chave.slice(2).toLowerCase(), valor);
    } else {
      elemento.setAttribute(chave, valor === true ? '' : String(valor));
    }
  }
}

function anexar(elemento, filhos) {
  for (const filho of filhos.flat()) {
    if (filho === null || filho === undefined || filho === false) continue;
    elemento.append(filho.nodeType ? filho : document.createTextNode(String(filho)));
  }
}

/** el('div', { class: 'x' }, 'texto', outroElemento) */
export function el(tag, atributos, ...filhos) {
  const e = document.createElement(tag);
  aplicar(e, atributos);
  anexar(e, filhos);
  return e;
}

/** svg('rect', { x: 0, y: 0, width: 10, height: 10 }) */
export function svg(tag, atributos, ...filhos) {
  const e = document.createElementNS(SVG_NS, tag);
  aplicar(e, atributos);
  anexar(e, filhos);
  return e;
}
