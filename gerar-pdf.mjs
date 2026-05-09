/**
 * gerar-pdf.mjs
 * Converte apresentacao-cliente.html → Scolfaro-Automobili-Apresentacao.pdf
 *
 * Uso: node gerar-pdf.mjs
 *
 * Requer: puppeteer instalado (npm install -g puppeteer  OU  npx puppeteer)
 * Instala automaticamente se não encontrado no node_modules local.
 */

import { createRequire } from 'module';
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

// ─── Resolve puppeteer (local ou global) ─────────────────────────────────────
async function carregarPuppeteer() {
  // Tenta importar local
  try {
    const req  = createRequire(import.meta.url);
    const pkg  = req.resolve('puppeteer');
    const mod  = await import(pkg.replace(/[/\\]lib[/\\].*$/, '/lib/esm/puppeteer/node.js').replace(/\\/g, '/'));
    return mod.default ?? mod;
  } catch { /* não instalado localmente */ }

  // Tenta importar de node_modules global
  try {
    const mod = await import('puppeteer');
    return mod.default ?? mod;
  } catch { /* não encontrado */ }

  return null;
}

async function main() {
  console.log('⏳  Carregando Puppeteer...');
  let puppeteer = await carregarPuppeteer();

  if (!puppeteer) {
    console.log('📦  Puppeteer não encontrado. Instalando localmente...');
    const { execSync } = await import('child_process');
    execSync('npm install puppeteer --save-dev', { stdio: 'inherit', cwd: __dirname });
    puppeteer = (await import('./node_modules/puppeteer/lib/esm/puppeteer/node.js')).default;
  }

  console.log('🚀  Iniciando Chrome headless...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',  // melhora qualidade de fontes no PDF
    ],
  });

  const page = await browser.newPage();

  // Carrega o HTML via protocolo file:// — garante acesso a recursos locais
  const fileUrl = `file:///${htmlFile.replace(/\\/g, '/')}`;
  console.log('📄  Carregando HTML:', fileUrl);

  await page.goto(fileUrl, {
    waitUntil: 'networkidle0',  // aguarda Google Fonts e todos os recursos
    timeout: 60_000,
  });

  // Aguarda carregamento das fontes do Google Fonts
  await page.evaluate(() => document.fonts.ready);

  // Pequena espera extra para garantir renderização de gradients e SVGs
  await new Promise(r => setTimeout(r, 800));

  console.log('🖨️  Gerando PDF (A4, fundo escuro, alta qualidade)...');

  await page.pdf({
    path: pdfFile,
    format: 'A4',
    printBackground: true,       // preserva fundos escuros, gradients, cores
    preferCSSPageSize: false,    // usa o formato A4 desta configuração
    displayHeaderFooter: false,  // sem header/footer do browser
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    // Escala 1 = tamanho exato. Reduz se o conteúdo estiver cortando.
    scale: 0.95,
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
