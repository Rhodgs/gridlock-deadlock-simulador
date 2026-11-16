// layout.js — divisores arrastáveis entre os painéis.
// Arraste para redimensionar, duplo clique para voltar ao tamanho padrão,
// setas do teclado (com o divisor focado) para ajustar de 20 em 20 px.
// Os tamanhos ficam salvos no navegador (localStorage).

const CHAVE = 'gridlock:layout:v1';
const raiz = document.documentElement;

const LIMITES = {
    '--col-esq': { min: 200, max: 480, padrao: 260 },
    '--col-dir': { min: 240, max: 560, padrao: 340 },
    '--rodape-h': { min: 120, max: 520, padrao: 240 },
};

function lerSalvo() {
    try { return JSON.parse(localStorage.getItem(CHAVE)) ?? {}; } catch { return {}; }
}
function salvar(nome, valor) {
    try {
        const atual = lerSalvo();
        atual[nome] = valor;
        localStorage.setItem(CHAVE, JSON.stringify(atual));
    } catch { /* sem localStorage: só não persiste */ }
}

function limitar(nome, valor) {
    const { min, max } = LIMITES[nome];
    // nunca deixa o rodapé/colunas comerem a janela inteira
    const teto = nome === '--rodape-h'
        ? Math.min(max, window.innerHeight - 220)
        : Math.min(max, window.innerWidth - 480);
    return Math.round(Math.max(min, Math.min(teto, valor)));
}

function aplicar(nome, valor) {
    const v = limitar(nome, valor);
    raiz.style.setProperty(nome, `${v}px`);
    return v;
}

function criarDivisor({ eixo, variavel, sentido, rotulo }) {
    const el = document.createElement('div');
    el.className = `divisor divisor-${eixo}`;
    el.setAttribute('role', 'separator');
    el.setAttribute('aria-orientation', eixo === 'v' ? 'vertical' : 'horizontal');
    el.setAttribute('aria-label', rotulo);
    el.tabIndex = 0;

    let inicio = 0;
    let valorInicial = 0;

    const posicao = (e) => (eixo === 'v' ? e.clientX : e.clientY);

    el.addEventListener('pointerdown', (e) => {
        el.setPointerCapture(e.pointerId);
        inicio = posicao(e);
        valorInicial = parseFloat(getComputedStyle(raiz).getPropertyValue(variavel)) || LIMITES[variavel].padrao;
        el.classList.add('arrastando');
        document.body.classList.add(`arrastando-${eixo}`);
    });

    el.addEventListener('pointermove', (e) => {
        if (!el.hasPointerCapture(e.pointerId)) return;
        aplicar(variavel, valorInicial + sentido * (posicao(e) - inicio));
    });

    const soltar = (e) => {
        if (!el.hasPointerCapture(e.pointerId)) return;
        el.releasePointerCapture(e.pointerId);
        el.classList.remove('arrastando');
        document.body.classList.remove(`arrastando-${eixo}`);
        salvar(variavel, parseFloat(getComputedStyle(raiz).getPropertyValue(variavel)));
    };
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);

    el.addEventListener('dblclick', () => {
        const v = aplicar(variavel, LIMITES[variavel].padrao);
        salvar(variavel, v);
    });

    el.addEventListener('keydown', (e) => {
        const mais = eixo === 'v' ? 'ArrowRight' : 'ArrowDown';
        const menos = eixo === 'v' ? 'ArrowLeft' : 'ArrowUp';
        if (e.key !== mais && e.key !== menos) return;
        e.preventDefault();
        e.stopPropagation();
        const atual = parseFloat(getComputedStyle(raiz).getPropertyValue(variavel)) || LIMITES[variavel].padrao;
        const passo = (e.key === mais ? 20 : -20) * sentido;
        salvar(variavel, aplicar(variavel, atual + passo));
    });

    return el;
}

function iniciar() {
    const layout = document.querySelector('.layout');
    const config = document.getElementById('config');
    const palco = document.querySelector('.palco');
    const lateral = document.getElementById('lateral');
    const rodape = document.querySelector('.rodape');
    if (!layout || !config || !palco || !lateral || !rodape) return;

    // esquerda | palco: arrastar para a direita aumenta a coluna da esquerda
    config.after(criarDivisor({ eixo: 'v', variavel: '--col-esq', sentido: 1, rotulo: 'Redimensionar painel de configuração' }));
    // palco | direita: arrastar para a esquerda aumenta a coluna da direita
    palco.after(criarDivisor({ eixo: 'v', variavel: '--col-dir', sentido: -1, rotulo: 'Redimensionar painel de estado' }));
    // miolo / rodapé: arrastar para cima aumenta o rodapé
    layout.after(criarDivisor({ eixo: 'h', variavel: '--rodape-h', sentido: -1, rotulo: 'Redimensionar log de eventos' }));

    const salvo = lerSalvo();
    for (const nome of Object.keys(LIMITES)) {
        if (typeof salvo[nome] === 'number') aplicar(nome, salvo[nome]);
    }

    window.addEventListener('resize', () => {
        for (const nome of Object.keys(LIMITES)) {
            const atual = parseFloat(getComputedStyle(raiz).getPropertyValue(nome));
            if (atual) aplicar(nome, atual);
        }
    });
}

iniciar();