// Confere o material de revisão (docs/js/materiais.js): PDFs existem e seguem o padrão de nome, as páginas existem
// e os assuntos batem com docs/js/assuntos.js. Uso: npm run material
import fs from "fs"; import vm from "vm";

const DOCS = new URL("../docs/", import.meta.url), ler = f => fs.readFileSync(new URL(f, DOCS), "utf8");
const ctx = vm.createContext({ console: { assert() {} } }); // as conferências do navegador ficam por conta deste script
vm.runInContext(ler("js/assuntos.js") + "\n" + ler("js/materiais.js") + "\nthis.out = { ASSUNTOS, FICHAS, MATERIAL, GERAL };", ctx);
const { ASSUNTOS, FICHAS, MATERIAL, GERAL } = ctx.out;

let erros = 0;
const erro = m => { console.error("✗ " + m); erros++; }, aviso = m => console.warn("! " + m);
let mupdf = null; try { mupdf = await import("mupdf"); } catch {}
if (!mupdf) aviso("mupdf não instalado (npm install): o número de páginas dos PDFs não foi conferido");

const paginas = {};
for (const [id, f] of Object.entries(FICHAS)) {
  const num = id.match(/^f(\d+)$/)?.[1];
  if (!num) { erro(`id de ficha inválido: ${id} (use f<n>)`); continue; }
  if (f.nome !== `Ficha ${num}`) erro(`${id}: o nome deveria ser "Ficha ${num}" (está "${f.nome}")`);
  if (!new RegExp(`^material/ficha-${num}-[a-z0-9-]+\\.pdf$`).test(f.arq)) erro(`${id}: nome fora do padrão (${f.arq}); use material/ficha-${num}-<temas-com-hifen>.pdf`);
  const url = new URL(f.arq, DOCS);
  if (!fs.existsSync(url)) { erro(`${id}: arquivo não encontrado (docs/${f.arq})`); continue; }
  if (mupdf) paginas[id] = mupdf.Document.openDocument(fs.readFileSync(url), "application/pdf").countPages();
}

const confere = (onde, m) => {
  if (!FICHAS[m.f]) return erro(`${onde}: a ficha "${m.f}" não está em FICHAS`);
  if (!Number.isInteger(m.p) || m.p < 1) return erro(`${onde}: página inválida (${m.p})`);
  if (paginas[m.f] && m.p > paginas[m.f]) erro(`${onde}: página ${m.p}, mas ${m.f} tem só ${paginas[m.f]}`);
  if (!m.t) erro(`${onde}: falta "t" (o que a página cobre)`);
};
for (const [a, ms] of Object.entries(MATERIAL)) {
  if (!ASSUNTOS[a]) erro(`"${a}" não existe em assuntos.js (confira a grafia)`);
  ms.forEach(m => confere(a, m));
}
GERAL.forEach((m, i) => { confere(`GERAL[${i}]`, m); if (!m.rotulo) erro(`GERAL[${i}]: falta "rotulo"`); });

const pasta = new URL("material/", DOCS), usados = new Set(Object.values(FICHAS).map(f => f.arq.replace("material/", "")));
if (fs.existsSync(pasta)) for (const n of fs.readdirSync(pasta).filter(n => n.endsWith(".pdf")))
  if (!usados.has(n)) aviso(`docs/material/${n} não está registrado em FICHAS`);

const sem = Object.keys(ASSUNTOS).filter(a => !MATERIAL[a]);
if (sem.length) console.log(`Assuntos sem ficha (${sem.length}): ${sem.join(", ")}`);
console.log(erros ? `${erros} erro(s)` : `Material ok: ${Object.keys(FICHAS).length} fichas, ${Object.keys(MATERIAL).length} de ${Object.keys(ASSUNTOS).length} assuntos com link`);
process.exit(erros ? 1 : 0);
