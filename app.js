(() => {
  const $ = (id) => document.getElementById(id);
  const d = [$('d0'), $('d1')];
  let num = '';
  let travado = false; // durante tela de branco/fim

  // ---------- som (WebAudio sintetizado, sem arquivo) ----------
  let ctx = null;
  window.__som = { bipes: 0, confirmacoes: 0 };
  function audio() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
    return ctx;
  }
  function tom(freq, ini, dur, vol = 0.12) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'square'; o.frequency.value = freq;
    const t = a.currentTime + ini;
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(0, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
    window.__som.osciladores = (window.__som.osciladores || 0) + 1; window.__som.estado = a.state;
  }
  function bipe() { tom(1100, 0, 0.07); window.__som.bipes++; }
  function tiriri() { // o "tiriririri": bipes agudos alternados bem rápidos
    for (let i = 0; i < 9; i++) tom(i % 2 ? 1250 : 1600, i * 0.075, 0.06);
    tom(1600, 9 * 0.075, 0.35);
    window.__som.confirmacoes++;
  }

  // ---------- tela ----------
  function mostrar(qual) {
    ['telaVoto', 'telaBranco', 'telaFim'].forEach((t) => ($(t).hidden = t !== qual));
  }
  function render() {
    d.forEach((el, i) => { el.textContent = num[i] || ''; el.classList.toggle('ativo', i === num.length); });
    const completo = num.length === 2;
    $('candidato').hidden = !(completo && num === '13');
    $('avisoNulo').hidden = !(completo && num !== '13');
    $('instrucoes').hidden = !completo;
  }
  function reiniciar() { num = ''; travado = false; $('efeitos').replaceChildren(); mostrar('telaVoto'); render(); }

  function digitar(c) {
    if (travado || num.length >= 2) return;
    num += c; bipe(); render();
  }
  function corrige() { if (!travado) { bipe(); num = ''; render(); } }

  const piadasBranco = [
    'Branco igual a folha de quem não estudou pra prova. 📄',
    'Ficou em branco? Até o papel ficou constrangido. 😶',
    'Branco nem na camisa de réveillon resolve. Bora de novo!',
    'A urna piscou: "sério isso?" 👀',
  ];
  function branco() {
    if (travado) return;
    bipe(); travado = true;
    $('piadaBranco').textContent = sortear(piadasBranco) + ' Treina de novo.';
    mostrar('telaBranco');
    setTimeout(reiniciar, 2800);
  }

  const frases = [
    'Ensaio aprovado. Dia 25 é pra valer!',
    'Dedo aquecido, coração tranquilo. 💪',
    'Treino é treino, jogo é jogo. Dia 25 tem jogo!',
    'Mão firme no 1, no 3 e no CONFIRMA. Decorado!',
    'Esse "tiriririri" é o som mais bonito do Brasil.',
    'Pode votar quantas vezes quiser aqui. Lá, uma só e bem dada.',
    'Ansiedade boa detectada. Respira e vai.',
  ];
  function sortear(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function contar() {
    let n = 1;
    try { n = (parseInt(localStorage.getItem('urna13.votos'), 10) || 0) + 1; localStorage.setItem('urna13.votos', String(n)); } catch (e) {}
    return n;
  }

  function confirma() {
    if (travado) return;
    if (num.length < 2) { bipe(); return; }
    if (num !== '13') { // nulo: humor gentil e volta
      bipe(); travado = true;
      $('avisoNulo').querySelector('p:last-child').textContent = 'Treina de novo! O número é 1, depois 3. 😉';
      setTimeout(() => { $('avisoNulo').querySelector('p:last-child').textContent = '...tem certeza? 😅 Treina de novo'; reiniciar(); }, 2200);
      return;
    }
    travado = true;
    tiriri();
    try { navigator.vibrate && navigator.vibrate([60, 40, 60, 40, 200]); } catch (e) {}
    const n = contar();
    $('frase').textContent = sortear(frases);
    $('contador').textContent = `Você já votou 13 ${n} ${n === 1 ? 'vez' : 'vezes'} de brincadeira.`;
    $('copiado').hidden = true;
    mostrar('telaFim');
    efeito();
  }

  // ---------- efeitos ----------
  const fx = $('efeitos');
  function limparDepois(el, ms) { setTimeout(() => el.remove(), ms); }
  const efeitos = {
    confete() {
      const cores = ['#c62828', '#e53935', '#ffffff', '#ffd43b', '#b71c1c'];
      for (let i = 0; i < 90; i++) {
        const c = document.createElement('i');
        c.className = 'conf';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.background = sortear(cores);
        c.style.animationDuration = 1.8 + Math.random() * 1.8 + 's';
        c.style.animationDelay = Math.random() * 0.6 + 's';
        fx.appendChild(c); limparDepois(c, 4200);
      }
    },
    estrelas() {
      for (let i = 0; i < 40; i++) {
        const s = document.createElement('i');
        s.className = 'estrela'; s.textContent = '★';
        s.style.left = Math.random() * 100 + 'vw';
        s.style.color = Math.random() < 0.5 ? '#c62828' : '#ffd43b';
        s.style.animationDuration = 2 + Math.random() * 2 + 's';
        s.style.animationDelay = Math.random() * 0.8 + 's';
        fx.appendChild(s); limparDepois(s, 4800);
      }
    },
    fogos() {
      for (let k = 0; k < 5; k++) {
        const cx = 15 + Math.random() * 70, cy = 15 + Math.random() * 45;
        const cor = sortear(['#c62828', '#ffd43b', '#ffffff', '#ff6b6b']);
        for (let i = 0; i < 26; i++) {
          const p = document.createElement('i');
          const ang = (i / 26) * Math.PI * 2, r = 70 + Math.random() * 50;
          p.className = 'faisca';
          p.style.left = cx + 'vw'; p.style.top = cy + 'vh'; p.style.background = cor;
          p.style.setProperty('--x', Math.cos(ang) * r + 'px');
          p.style.setProperty('--y', Math.sin(ang) * r + 'px');
          p.style.animationDelay = k * 0.35 + 's';
          fx.appendChild(p); limparDepois(p, 3500);
        }
      }
    },
    fazol() {
      const t = document.createElement('div');
      t.className = 'fazol'; t.textContent = 'FAZ O L';
      fx.appendChild(t); limparDepois(t, 2500);
    },
  };
  let ultimo = '';
  function efeito() {
    const nomes = Object.keys(efeitos).filter((n) => n !== ultimo); // nunca repete o anterior
    ultimo = sortear(nomes);
    window.__som.ultimoEfeito = ultimo;
    efeitos[ultimo]();
  }

  // ---------- compartilhar ----------
  async function compartilhar() {
    const texto = 'Treinei meu 13 na urna de mentirinha 😄 Dia 25/10 é pra valer! (brincadeira, não é votação)';
    const url = location.href.split('#')[0];
    try {
      if (navigator.share) { await navigator.share({ text: texto, url }); return; }
      await navigator.clipboard.writeText(texto + ' ' + url);
      $('copiado').hidden = false;
    } catch (e) { /* usuário cancelou ou sem permissão: nada a fazer */ }
  }

  // ---------- ligações ----------
  document.querySelectorAll('.tecla').forEach((b) => b.addEventListener('click', () => digitar(b.dataset.d)));
  $('btBranco').addEventListener('click', branco);
  $('btCorrige').addEventListener('click', corrige);
  $('btConfirma').addEventListener('click', confirma);
  $('denovo').addEventListener('click', reiniciar);
  $('compartilhar').addEventListener('click', compartilhar);
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('button') && (e.key === 'Enter' || e.key === ' ')) return; // botão focado: deixa o clique nativo
    if (/^[0-9]$/.test(e.key)) digitar(e.key);
    else if (e.key === 'Backspace') { e.preventDefault(); corrige(); }
    else if (e.key === 'Enter') confirma();
  });

  render();
})();
