// Monta a pasta public/ a partir de src/ + site.config.json.
//   npm run build      → versão de revisão (noindex, aceita domínio vazio)
//   npm run producao   → versão publicável (exige domínio; libera indexação)
import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const saida = path.join(raiz, 'public');
const producao = process.argv.includes('--producao');
const cfg = JSON.parse(await readFile(path.join(raiz, 'site.config.json'), 'utf8'));
const txt = (v) => String(v ?? '').trim();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

if (producao && !txt(cfg.dominio)) {
  console.error('\n✖ Build de produção bloqueado. Preencha "dominio" em site.config.json\n');
  process.exit(1);
}
const dominio = (txt(cfg.dominio) || 'https://www.dominio-a-definir.com.br').replace(/\/+$/, '');
if (!/^https:\/\//.test(dominio)) { console.error('✖ "dominio" precisa começar com https://'); process.exit(1); }

const whats = txt(cfg.whatsapp).replace(/\D/g, '');
const mensagem = txt(cfg.mensagemWhatsapp);
// "whatsappLink": false mostra o número como texto, sem nenhum botão ou link para o WhatsApp
const linkWhats = Boolean(whats) && cfg.whatsappLink !== false;
const urlWhats = `https://wa.me/${whats}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`;
const formatarFone = (n) => {
  const m = n.match(/^55(\d{2})(9?\d{4})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : `+${n}`;
};

const dados = {
  dominio,
  canonical: `${dominio}/`,
  razaoSocial: txt(cfg.razaoSocial),
  cnpj: txt(cfg.cnpj),
  telefone: txt(cfg.telefone),
  whatsapp: whats,
  whatsapp_href: linkWhats ? urlWhats : '',
  whatsapp_exibir: whats ? formatarFone(whats) : '',
  cta_href: linkWhats ? urlWhats : '#contato',
  endereco: txt(cfg.endereco),
  horarios: txt(cfg.horarios),
  horariosFeriados: txt(cfg.horariosFeriados),
  desenvolvedorUrl: txt(cfg.desenvolvedorUrl),
  ano: cfg.ano || new Date().getFullYear(),
  robots: producao
    ? '<meta name="robots" content="index, follow, max-image-preview:large">'
    : '<meta name="robots" content="noindex, nofollow">',
};

dados.jsonld = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${dominio}/#site`, url: `${dominio}/`, name: 'ForteFit Academia', inLanguage: 'pt-BR' },
    {
      '@type': 'ExerciseGym',
      '@id': `${dominio}/#academia`,
      name: 'ForteFit Academia',
      description: 'Academia com musculação, cardio, alongamento e orientação de professores, para quem está começando, voltando ou já treina.',
      url: `${dominio}/`,
      image: `${dominio}/img/og-image.jpg`,
      logo: `${dominio}/img/logo.png`,
      ...(dados.telefone ? { telephone: dados.telefone } : {}),
      ...(dados.endereco ? { address: { '@type': 'PostalAddress', streetAddress: dados.endereco, addressCountry: 'BR' } } : {}),
    },
  ],
}).replace(/</g, '\\u003c');

// ---------- macro de imagem responsiva ----------
function imagem(args) {
  const [nome, alt = '', sizes = '100vw', classe = '', carga = 'lazy', pos = ''] = args.split('|').map((s) => s.trim());
  const ws = nome === 'hero-treino' ? [800, 1200, 1536] : [480, 800, 1200];
  const set = (ext) => ws.map((x) => `img/${nome}-${x}.${ext} ${x}w`).join(', ');
  const eager = carga === 'eager';
  return `<picture>
              <source type="image/avif" srcset="${set('avif')}" sizes="${esc(sizes)}">
              <source type="image/webp" srcset="${set('webp')}" sizes="${esc(sizes)}">
              <img src="img/${nome}-${ws[1]}.webp" width="1536" height="1024" alt="${esc(alt)}"${classe ? ` class="${classe}"` : ''} loading="${eager ? 'eager' : 'lazy'}" decoding="${eager ? 'sync' : 'async'}"${eager ? ' fetchpriority="high"' : ''}${pos ? ` style="object-position:${esc(pos)}"` : ''}>
            </picture>`;
}

// ---------- template ----------
function renderizar(html) {
  html = html.replace(/\[\[img ([^\]]+)\]\]/g, (_, a) => imagem(a));
  const cond = /\{\{#if (\w+)\}\}((?:(?!\{\{#if)[\s\S])*?)(?:\{\{else\}\}((?:(?!\{\{#if)[\s\S])*?))?\{\{\/if\}\}/;
  let anterior;
  do { anterior = html; html = html.replace(cond, (_, k, a, b = '') => (dados[k] ? a : b)); } while (html !== anterior);
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/\{\{\{(\w+)\}\}\}/g, (_, k) => dados[k] ?? '');
  html = html.replace(/\{\{(\w+)\}\}/g, (_, k) => esc(dados[k] ?? ''));
  return html;
}

await rm(saida, { recursive: true, force: true });
await mkdir(saida, { recursive: true });
for (const item of ['css', 'js', 'fonts', 'img', 'site.webmanifest']) await cp(path.join(src, item), path.join(saida, item), { recursive: true });
for (const pagina of ['index.html', 'privacidade.html', '404.html']) {
  await writeFile(path.join(saida, pagina), renderizar(await readFile(path.join(src, pagina), 'utf8')));
}

const hoje = new Date().toISOString().slice(0, 10);
await writeFile(path.join(saida, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${dominio}/</loc><lastmod>${hoje}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
</urlset>
`);
await writeFile(path.join(saida, 'robots.txt'),
  producao ? `User-agent: *\nAllow: /\n\nSitemap: ${dominio}/sitemap.xml\n` : `# Versão de revisão: não indexar\nUser-agent: *\nDisallow: /\n`);
await writeFile(path.join(saida, '_headers'),
`/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/img/*
  Cache-Control: public, max-age=31536000, immutable
/css/*
  Cache-Control: public, max-age=86400
/js/*
  Cache-Control: public, max-age=86400
`);

const total = async (dir) => {
  let n = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    n += e.isDirectory() ? await total(p) : (await readFile(p)).length;
  }
  return n;
};
console.log(`\n✔ ${producao ? 'Build de PRODUÇÃO' : 'Build de REVISÃO (noindex)'} em public/  (${(await total(saida) / 1024 / 1024).toFixed(1)} MB)`);
if (!txt(cfg.dominio)) console.log('⚠ Domínio vazio: canonical, sitemap e og:image usam um endereço provisório.');
