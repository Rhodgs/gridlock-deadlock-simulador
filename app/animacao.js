// animacao.js — o carro DIRIGE de uma posição até a outra, fazendo a curva no caminho.
//
// Como funciona (em ordem de prioridade):
//   - destino atrás do carro (ré, "Voltar", recuperação): anda de ré, sem meia-volta;
//   - destino à frente e a curva vem depois: anda e vai virando ao chegar;
//   - destino já na direção final: vira primeiro e depois sai andando;
//   - caso geral: curva suave, com a frente acompanhando a tangente;
//   - só mudou a orientação: gira no lugar pelo caminho mais curto (máx. 180°).
//
// API (igual à anterior):
//   animarCarros(raiz, duracaoMs)  -> chamar depois do replaceChildren em renderizar()
//   limparPoses()                  -> chamar ao trocar de cenário e em reiniciar()
// Só o checkbox "Animações" (classe `sem-animacao` no body) desliga a animação.

// Para onde o nariz do desenho aponta com rotate(0):
// 0 = cima, 90 = direita, 180 = baixo, 270 = esquerda.
const NARIZ_GRAUS = 0;

const poseAnterior = new Map(); // id -> { x, y, r }
let geracao = 0; // cancela animações antigas quando começa uma nova
let avisou = false;

export function limparPoses() {
  poseAnterior.clear();
  geracao += 1;
}

const RAD = Math.PI / 180;
const diferenca = (de, para) => ((((para - de) % 360) + 540) % 360) - 180; // (-180, 180]
const suave = (t) => t * t * (3 - 2 * t);
const arred = (n) => Math.round(n * 1000) / 1000;
const escrever = (g, x, y, r) => {
  g.setAttribute('transform', `translate(${arred(x)} ${arred(y)}) rotate(${arred(r)})`);
  g.querySelector('.carro-letra')?.setAttribute('transform', `rotate(${arred(-r)})`);
  g.querySelector('.selo')?.setAttribute(
    'transform',
    `translate(20 -26) rotate(${arred(-r)})`,
  );
};

// vetor unitário para onde o carro aponta, dado o ângulo r do atributo
const frente = (r) => {
  const a = (r + NARIZ_GRAUS) * RAD;
  return { x: Math.sin(a), y: -Math.cos(a) };
};

function lerPose(g) {
  const m = /translate\(\s*([-\d.e]+)[\s,]+([-\d.e]+)\s*\)\s*rotate\(\s*([-\d.e]+)/i.exec(
    g.getAttribute('transform') || ''
  );
  return m ? { x: +m[1], y: +m[2], r: +m[3] } : null;
}

const limitar = (t) => Math.max(0, Math.min(1, t));

// Cria a função pose(t) para t em [0,1] (tempo linear; o easing é feito aqui dentro).
// A rotação nunca passa do giro total (sem overshoot e sem voltas de 360°).
function criarTrajeto(velha, nova) {
  const dx = nova.x - velha.x;
  const dy = nova.y - velha.y;
  const dist = Math.hypot(dx, dy);
  const giro = diferenca(velha.r, nova.r);
  const rot = (h) => velha.r + giro * h;

  // só girou, sem sair do lugar
  if (dist < 1) {
    return (t) => ({ x: nova.x, y: nova.y, r: rot(suave(t)) });
  }

  const f0 = frente(velha.r);
  const f1 = frente(nova.r);
  const cos0 = (dx * f0.x + dy * f0.y) / dist; // 1 = destino à frente do carro
  const cos1 = (dx * f1.x + dy * f1.y) / dist; // 1 = destino na direção da pose final
  const linha = (s) => ({ x: velha.x + dx * s, y: velha.y + dy * s });

  // 1) destino ATRÁS do carro: anda de ré em linha reta, sem dar meia-volta
  if (cos0 < -0.25) {
    return (t) => ({ ...linha(suave(t)), r: rot(suave(t)) });
  }

  // 2) destino à frente e a curva vem depois: anda e vai virando ao chegar
  if (cos0 > 0.85) {
    return (t) => ({ ...linha(suave(t)), r: rot(suave(limitar((t - 0.3) / 0.7))) });
  }

  // 3) destino já na direção final: vira primeiro e depois sai andando
  if (cos1 > 0.85) {
    return (t) => ({
      ...linha(suave(limitar((t - 0.25) / 0.75))),
      r: rot(suave(limitar(t / 0.5))),
    });
  }

  // 4) caso geral: curva suave (Bézier), a frente acompanha a tangente
  const k = dist * 0.35;
  const p0 = { x: velha.x, y: velha.y };
  const p1 = { x: velha.x + f0.x * k, y: velha.y + f0.y * k };
  const p2 = { x: nova.x - f1.x * k, y: nova.y - f1.y * k };
  const p3 = { x: nova.x, y: nova.y };

  let anterior = velha.r;
  return (tl) => {
    const t = suave(tl);
    const u = 1 - t;
    const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
    const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
    const tx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const ty = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    if (Math.hypot(tx, ty) > 1e-6) {
      const alvo = Math.atan2(tx, -ty) / RAD - NARIZ_GRAUS;
      anterior += diferenca(anterior, alvo);
    }
    // mantém a rotação entre a inicial e a final (sem overshoot)
    const min = Math.min(velha.r, velha.r + giro);
    const max = Math.max(velha.r, velha.r + giro);
    return { x, y, r: Math.max(min, Math.min(max, anterior)) };
  };
}

export function animarCarros(raiz, duracaoMs = 900) {
  const escopo = raiz && raiz.querySelectorAll ? raiz : document;
  const desligado = document.body.classList.contains('sem-animacao');
  const minha = ++geracao;
  const ativos = [];

  escopo.querySelectorAll('[data-carro]').forEach((g) => {
    const id = g.dataset.carro;
    const nova = lerPose(g);
    if (!nova) {
      if (!avisou) {
        console.warn('animacao.js: transform do carro fora do formato "translate(x y) rotate(r)".');
        avisou = true;
      }
      return;
    }
    const velha = poseAnterior.get(id);
    poseAnterior.set(id, nova);
    if (!velha || desligado) return;
    if (velha.x === nova.x && velha.y === nova.y && velha.r === nova.r) return;

    const pose = criarTrajeto(velha, nova);
    const p0 = pose(0);
    escrever(g, p0.x, p0.y, p0.r); // começa na posição antiga, sem piscar no destino
    ativos.push({ g, pose, nova });
  });

  if (!ativos.length) return;

  const duracao = Math.max(150, duracaoMs);
  let inicio = null;

  const quadro = (agora) => {
    if (minha !== geracao) return; // veio uma rodada nova: abandona
    if (inicio === null) inicio = agora;
    const t = Math.min(1, (agora - inicio) / duracao);

    for (const a of ativos) {
      if (!a.g.isConnected) continue;
      if (t >= 1) {
        escrever(a.g, a.nova.x, a.nova.y, a.nova.r); // pose exata ao final
      } else {
        const p = a.pose(t);
        escrever(a.g, p.x, p.y, p.r);
      }
    }
    if (t < 1) requestAnimationFrame(quadro);
  };

  requestAnimationFrame(quadro);
}