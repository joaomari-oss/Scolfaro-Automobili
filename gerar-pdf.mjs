/**
 * gerar-pdf.mjs
 * Converte apresentacao-cliente.html → Scolfaro-Automobili-Apresentacao.pdf
 *
 * Uso: node gerar-pdf.mjs
 *
 * Estratégia de renderização:
 *  1. Carrega a página com viewport 1400px (screen CSS → layout desktopótimo)
 *  2. Aguarda Google Fonts + todos os recursos
 *  3. Chama page.pdf() — Chrome automaticamente aplica @media print CSS
 *     e pagina o conteúdo em A4 (794px por 1123px a 96dpi)
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const htmlFile = path.join(__dirname, 'apresentacao-cliente.html');
const pdfFile  = path.join(__dirname, 'Scolfaro-Automobili-Apresentacao.pdf');

if (!fs.existsSync(htmlFile)) {
  console.error('❌  Arquivo não encontrado:', htmlFile);
  process.exit(1);
}

async function main() {
  console.log('⏳  Carregando Puppeteer...');

  let puppeteer;
  try {
    const mod = await import('puppeteer');
    puppeteer = mod.default ?? mod;
  } catch {
    console.error('❌  Puppeteer não encontrado. Rode: npm install puppeteer --save-dev');
    process.exit(1);
  }

  console.log('🚀  Iniciando Chrome headless...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',       // melhor renderização de fontes no PDF
      '--enable-font-antialiasing',
    ],
  });

  const page = await browser.newPage();

  // ── Viewport largo: garante que o CSS screen carrega corretamente ─────────
  // (Quando page.pdf() roda, Chrome muda para @media print automaticamente)
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });

  const fileUrl = `file:///${htmlFile.replace(/\\/g, '/')}`;
  console.log('📄  Carregando HTML:', fileUrl);

  await page.goto(fileUrl, {
    waitUntil: 'networkidle0',   // aguarda Google Fonts + todos os assets
    timeout: 60_000,
  });

  // Aguarda as fontes estarem prontas (Google Fonts pode demorar)
  await page.evaluate(() => document.fonts.ready);

  // Aguarda animações CSS terminarem e DOM estabilizar
  await new Promise(r => setTimeout(r, 1200));

  // Injeta CSS extra para garantir que o @media print seja aplicado corretamente
  // (Puppeteer aplica print automaticamente, mas isso reforça a troca de media)
  await page.emulateMediaType('print');

  // Aguarda o reflow do print CSS
  await new Promise(r => setTimeout(r, 600));

  console.log('🖨️  Gerando PDF (A4, fundo escuro, alta qualidade)...');

  await page.pdf({
    path: pdfFile,
    format: 'A4',
    printBackground: true,         // preserva fundos escuros, gradients e cores
    preferCSSPageSize: false,      // usa A4 deste script, não o CSS @page
    displayHeaderFooter: false,    // sem header/footer automático do browser
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    scale: 1.0,                    // escala 1:1 — o @media print cuida do layout
  });

  await browser.close();

  const stats = fs.statSync(pdfFile);
  const kb    = (stats.size / 1024).toFixed(0);
  console.log(`✅  PDF gerado com sucesso!`);
  console.log(`📁  ${pdfFile}`);
  console.log(`📏  Tamanho: ${kb} KB`);
}

main().catch(err => {
  console.error('❌  Erro ao gerar PDF:', err.message);
  process.exit(1);
});
