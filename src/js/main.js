// Menu do celular, sombra do topo e destaque da seção atual. O site funciona sem este arquivo.
(() => {
  const raiz = document.documentElement;
  raiz.classList.remove('no-js');
  raiz.classList.add('js');

  const topo = document.getElementById('topo');
  const botao = document.querySelector('.menu-btn');
  const menu = document.getElementById('menu');
  const desktop = window.matchMedia('(min-width: 900px)');

  const definirMenu = (aberto) => {
    botao.setAttribute('aria-expanded', String(aberto));
    botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('menu--aberto', aberto);
  };

  botao.addEventListener('click', () => definirMenu(botao.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) definirMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true') {
      definirMenu(false);
      botao.focus();
    }
  });
  desktop.addEventListener('change', () => definirMenu(false));

  const aoRolar = () => {
    topo.classList.toggle('topo--rolou', window.scrollY > 8);
  };
  aoRolar();
  window.addEventListener('scroll', aoRolar, { passive: true });

  if ('IntersectionObserver' in window) {
    const links = [...menu.querySelectorAll('a[href^="#"]:not(.btn)')];
    const porId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const observador = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.removeAttribute('aria-current'));
        porId.get(e.target.id)?.setAttribute('aria-current', 'true');
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    porId.forEach((_, id) => { const s = document.getElementById(id); if (s) observador.observe(s); });
  }

  // Barra fixa "Agendar visita" no celular: aparece depois da abertura e some na seção de contato.
  const barra = document.getElementById('barra-cta');
  const inicio = document.getElementById('inicio');
  const contato = document.getElementById('contato');
  if (barra && inicio && contato && 'IntersectionObserver' in window) {
    barra.hidden = false;
    document.body.classList.add('com-barra');
    const visivel = { inicio: true, contato: false };
    const atualizar = () => barra.classList.toggle('barra-cta--visivel', !visivel.inicio && !visivel.contato);
    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) visivel[e.target.id] = e.isIntersecting;
      atualizar();
    });
    obs.observe(inicio);
    obs.observe(contato);
  }

  // Abas do ForteFit App: trocam a tela exibida no celular.
  const abas = [...document.querySelectorAll('.app__aba')];
  if (abas.length) {
    const telas = abas.map((a) => document.getElementById(a.getAttribute('aria-controls')));
    const menuApp = [...document.querySelectorAll('.ios__tabs span')];
    const abrir = (i, foco) => {
      abas.forEach((a, k) => {
        const ativa = k === i;
        a.setAttribute('aria-selected', String(ativa));
        a.tabIndex = ativa ? 0 : -1;
        telas[k].hidden = !ativa;
      });
      menuApp.forEach((m, k) => m.classList.toggle('on', k === i));
      if (foco) abas[i].focus();
    };
    abas.forEach((a, i) => {
      a.addEventListener('click', () => abrir(i));
      a.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); abrir((i + 1) % abas.length, true); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); abrir((i - 1 + abas.length) % abas.length, true); }
      });
    });
  }

  // Entrada das partes de cada seção: título, texto e imagem aparecem em sequência, uma vez.
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !semMovimento) {
    const alvos = '.secao__cab > *, .duas-colunas__texto > *, .app__texto > *, .foto, .servico-card, .plano, .passo, .perfil, .funcoes-grid li, .mosaico__item, .visita, .faq__item, .chamada, .app__celular, .postura blockquote, .promo';
    // Só esconde o que está prestes a entrar na tela (de 1 a 2,5 telas abaixo).
    // O resto da página fica visível: saltos por âncora, impressão e capturas inteiras não perdem conteúdo.
    const candidatos = new Set();
    const marcados = new Set();
    let ultimo = window.scrollY;
    let salto = false;
    const mostrar = (el) => { if (salto) el.classList.add('sem-transicao'); el.classList.add('visivel'); marcados.delete(el); revelar.unobserve(el); };
    const revelar = new IntersectionObserver((entradas) => {
      for (const e of entradas) if (e.isIntersecting) mostrar(e.target);
    }, { rootMargin: '0px 0px 8% 0px', threshold: 0 });
    const atualizar = () => {
      const vh = window.innerHeight;
      salto = Math.abs(window.scrollY - ultimo) > vh * 1.2; // pulo por âncora ou rolagem muito rápida: mostra sem animar
      ultimo = window.scrollY;
      candidatos.forEach((el) => {
        const topo = el.getBoundingClientRect().top;
        if (topo > vh && topo < vh * 2.5) {
          el.classList.add('revelar');
          candidatos.delete(el);
          marcados.add(el);
          revelar.observe(el);
        }
      });
      marcados.forEach((el) => { if (el.getBoundingClientRect().top < vh * 1.05) mostrar(el); });
    };
    document.querySelectorAll('main > section:not(.hero)').forEach((secao) => {
      const grupos = new Map();
      secao.querySelectorAll(alvos).forEach((el) => {
        const pai = el.parentElement;
        const n = grupos.get(pai) || 0;
        grupos.set(pai, n + 1);
        el.style.setProperty('--atraso', `${Math.min(n, 5) * 70}ms`);
        candidatos.add(el);
      });
    });
    window.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);
    atualizar();
  }

  // Seletor de horário: mostra qual plano cobre o dia e a hora escolhidos.
  const caixa = document.getElementById('horario');
  if (caixa) {
    const planos = [
      { nome: 'Dia', slug: 'dia', preco: 79.9, cobre: (d, h) => d === 'util' && h >= 6 && h < 16 },
      { nome: 'Livre', slug: 'livre', preco: 109.9, cobre: (d, h) => (d === 'util' && h >= 6 && h < 22) || (d === 'sab' && h >= 8 && h < 14) },
      { nome: 'Forte', slug: 'forte', preco: 129.9, cobre: () => true },
    ];
    const textoDia = { util: 'em dias úteis', sab: 'no sábado', dom: 'aos domingos e feriados' };
    const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const lista = (nomes) => (nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes[0]);
    const slider = caixa.querySelector('#hora');
    const saida = caixa.querySelector('#hora-saida');
    const resp = caixa.querySelector('#horario-resposta');
    const ver = caixa.querySelector('.horario__ver');
    const grade = caixa.querySelector('.horario__grade');
    const botoesDia = [...caixa.querySelectorAll('.horario__dias button')];
    let dia = 'util';

    // monta a grade: uma linha por plano, uma coluna por hora
    grade.innerHTML = planos.map((p) => `<div class="hg-linha"><span class="hg-nome">${p.nome}</span>${Array.from({ length: 24 }, (_, h) => `<i class="hg-cel" data-p="${p.slug}" data-h="${h}"></i>`).join('')}</div>`).join('')
      + '<div class="hg-horas"><span>0h</span><span>6h</span><span>12h</span><span>18h</span></div>';
    const celulas = [...grade.querySelectorAll('.hg-cel')];

    const atualizar = () => {
      const h = Number(slider.value);
      saida.textContent = `${h}h`;
      celulas.forEach((c) => {
        const p = planos.find((x) => x.slug === c.dataset.p);
        const ch = Number(c.dataset.h);
        c.classList.toggle('on', p.cobre(dia, ch));
        c.classList.toggle('agora', ch === h);
      });
      const ok = planos.filter((p) => p.cobre(dia, h));
      const barato = ok[0];
      if (ok.length === 1) {
        resp.textContent = `Às ${h}h ${textoDia[dia]}, só o plano Forte cobre esse horário: acesso 24 horas por ${reais.format(barato.preco)} por mês.`;
      } else {
        resp.textContent = `Às ${h}h ${textoDia[dia]}, ${ok.length === 3 ? 'os três planos servem' : `servem os planos ${lista(ok.map((p) => p.nome))}`}. O mais barato é o ${barato.nome}, por ${reais.format(barato.preco)} ao mês.`;
      }
      ver.textContent = `Ver o plano ${barato.nome}`;
      ver.setAttribute('href', `#plano-${barato.slug}`);
    };

    const marcarDia = (i, foco) => {
      botoesDia.forEach((b, k) => { b.setAttribute('aria-checked', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
      dia = botoesDia[i].dataset.dia;
      if (foco) botoesDia[i].focus();
      atualizar();
    };
    botoesDia.forEach((b, i) => {
      b.addEventListener('click', () => marcarDia(i));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); marcarDia((i + 1) % botoesDia.length, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); marcarDia((i - 1 + botoesDia.length) % botoesDia.length, true); }
      });
    });
    caixa.querySelectorAll('.horario__rapido button').forEach((b) => b.addEventListener('click', () => { slider.value = b.dataset.h; atualizar(); }));
    slider.addEventListener('input', atualizar);
    atualizar();
  }

  // Status ao vivo no banner: com base na hora de São Paulo, diz se a unidade está aberta e o que cobre agora.
  const agora = document.getElementById('agora');
  if (agora) {
    const f = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: false });
    const montar = () => {
      const partes = Object.fromEntries(f.formatToParts(new Date()).map((p) => [p.type, p.value]));
      const h = Number(partes.hour) % 24;
      const m = partes.minute;
      const dia = partes.weekday.replace('.', '').toLowerCase();
      const util = ['seg', 'ter', 'qua', 'qui', 'sex'].includes(dia);
      const sab = dia === 'sáb' || dia === 'sab';
      const livre = (util && h >= 6 && h < 22) || (sab && h >= 8 && h < 14);
      const fim = util ? '22h' : '14h';
      agora.classList.toggle('fechada', !livre);
      agora.querySelector('span').textContent = livre
        ? `Agora são ${h}h${m}. Unidade aberta até ${fim}.`
        : `Agora são ${h}h${m}. Só o plano Forte treina neste horário.`;
      agora.classList.add('pronto');
    };
    montar();
    setInterval(montar, 60000);
  }

  // "Escolher plano": leva ao bloco de visita e lembra qual plano foi escolhido.
  const linhaPlano = document.getElementById('visita-plano');
  if (linhaPlano) {
    document.querySelectorAll('[data-plano]').forEach((a) => a.addEventListener('click', () => {
      linhaPlano.hidden = false;
      linhaPlano.innerHTML = `Plano ${a.dataset.plano} escolhido: ${a.dataset.preco} por mês. Converse com a recepção na visita.`;
    }));
  }
})();
