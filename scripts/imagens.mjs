// Gera as versões otimizadas (AVIF/WebP), copia os logos em SVG, cria favicons e a imagem de compartilhamento.
// Os originais ficam intactos em ../01_Kit_Logos e ../04_Banco_de_Imagens. Uso: npm run imagens
import sharp from 'sharp';
import { mkdir, copyFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const material = path.resolve(raiz, '..');
const kit = path.join(material, '01_Kit_Logos');
const fotos = path.join(material, '04_Banco_de_Imagens');
const saida = path.join(raiz, 'src', 'img');
await mkdir(saida, { recursive: true });

// ---------- fotos ----------
const W = [480, 800, 1200];
const lista = {
  'fachada': ['Fachada ForteFit ao anoitecer.png', W],
  'hero-treino': ['Treino guiado na ForteFit.png', [800, 1200, 1536]],
  'pesos': ['Sala de pesos da ForteFit.png', W],
  'piso': ['Piso de força da fortefit.png', W],
  'cardio': ['Sala de cardio da ForteFit.png', W],
  'caminhada': ['Caminhada tranquila nas esteiras.png', W],
  'alongamento': ['Alongamento tranquilo na academia.png', W],
  'treino-guiado': ['Treino guiado na ForteFit.png', W],
  'pausa': ['Pausa entre séries na ForteFit.png', W],
  'equipe': ['Equipe ForteFit na recepção da academia.png', W],
  'recepcao-pratica': ['Recepção prática da academia ForteFit.png', W],
  'recepcao-acolhedora': ['Recepção acolhedora na academia de bairro.png', W],
};
for (const [nome, [arq, ws]] of Object.entries(lista)) {
  const buf = await sharp(path.join(fotos, arq)).png().toBuffer();
  for (const w of ws) {
    const r = () => sharp(buf).resize({ width: w, withoutEnlargement: true });
    await r().webp({ quality: 74, effort: 5 }).toFile(path.join(saida, `${nome}-${w}.webp`));
    await r().avif({ quality: 56, effort: 4 }).toFile(path.join(saida, `${nome}-${w}.avif`));
  }
  console.log('ok', nome);
}

// ---------- logos (SVG vetorial do kit) ----------
const svg = path.join(kit, 'SVG');
await copyFile(path.join(svg, 'fortefit_com_academia_negativa.svg'), path.join(saida, 'logo-negativa.svg'));
await copyFile(path.join(svg, 'fortefit_com_academia_principal.svg'), path.join(saida, 'logo-principal.svg'));
await copyFile(path.join(svg, 'fortefit_sem_academia_negativa.svg'), path.join(saida, 'logo-negativa-curta.svg'));
await copyFile(path.join(svg, 'fortefit_sem_academia_principal.svg'), path.join(saida, 'logo-principal-curta.svg'));
await copyFile(path.join(svg, 'fortefit_sem_academia_laranja.svg'), path.join(saida, 'logo-laranja-curta.svg'));
await sharp(path.join(svg, 'fortefit_com_academia_negativa.svg'), { density: 200 }).resize({ width: 900 }).png().toFile(path.join(saida, 'logo.png'));

// ---------- favicons ----------
const perfil = path.join(kit, 'Perfil');
for (const [nome, t] of [['favicon-32', 32], ['favicon-192', 192], ['favicon-512', 512]]) {
  await sharp(path.join(perfil, 'fortefit_favicon.png')).resize(t, t).png().toFile(path.join(saida, `${nome}.png`));
}
await sharp(path.join(perfil, 'fortefit_perfil_negativa.png')).resize(180, 180).png().toFile(path.join(saida, 'apple-touch-icon.png'));
await copyFile(path.join(perfil, 'fortefit_favicon.svg'), path.join(saida, 'favicon.svg'));

// ---------- imagem de compartilhamento 1200×630 ----------
const L = 1200, A = 630;
const logoOg = await sharp(path.join(svg, 'fortefit_com_academia_negativa.svg'), { density: 200 }).resize({ width: 500 }).png().toBuffer();
const mLogo = await sharp(logoOg).metadata();
const foto = await sharp(path.join(fotos, 'Fachada ForteFit ao anoitecer.png')).resize(620, A, { fit: 'cover', position: 'centre' }).png().toBuffer();
const fundo = Buffer.from(`<svg width="${L}" height="${A}" xmlns="http://www.w3.org/2000/svg"><rect width="${L}" height="${A}" fill="#151515"/>
  <rect x="${L - 640}" y="0" width="20" height="${A}" fill="#FF5A1F"/>
  <text x="70" y="${A - 70}" font-family="Arial, sans-serif" font-weight="700" font-size="34" fill="#ffffff">Sua força evolui aqui.</text></svg>`);
await sharp(fundo).composite([
  { input: foto, left: L - 620, top: 0 },
  { input: logoOg, left: 70, top: Math.round((A - mLogo.height) / 2) - 40 },
]).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(saida, 'og-image.jpg'));
console.log('ok logos, favicons, og-image');
