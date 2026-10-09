// Gera o site em docs/: recorta cada questão dos PDFs em provas/ (enunciado+alternativas e resolução) em PNG
// e escreve o banco de questões em docs/js/banco.js. A página (index.html, css/, js/) é editada direto em docs/.
// Uso: npm run build
import * as mupdf from "mupdf"; import fs from "fs"; import { fileURLToPath } from "url";
const ROOT = new URL("../", import.meta.url), DIR = new URL("provas/", ROOT);
const OUT = fileURLToPath(new URL("docs", ROOT));
fs.rmSync(OUT + "/img", { recursive: true, force: true }); fs.mkdirSync(OUT + "/img", { recursive: true });
const S = 2.4, X0 = 22, X1 = 573; // escala e faixa horizontal recortada (pt)
const docs = {};
function open(f) {
  if (docs[f]) return docs[f];
  const doc = mupdf.Document.openDocument(fs.readFileSync(new URL(f, DIR)), "application/pdf"), pages = [];
  for (let p = 0; p < doc.countPages(); p++) {
    const page = doc.loadPage(p), els = [];
    const st = JSON.parse(page.toStructuredText("preserve-images").asJSON());
    for (const b of st.blocks) {
      if (b.type === "image") els.push({ y0: b.bbox.y, y1: b.bbox.y + b.bbox.h, x: b.bbox.x, w: b.bbox.w, t: "", img: 1 });
      else for (const l of b.lines || []) if (l.text.trim()) els.push({ y0: l.bbox.y, y1: l.bbox.y + l.bbox.h, x: l.bbox.x, t: l.text.trim() });
    }
    els.sort((a, b) => a.y0 - b.y0);
    pages.push({ page, els });
  }
  return (docs[f] = pages);
}
// linhas visuais: agrupa elementos que se sobrepõem verticalmente
function rows(els) {
  const r = [];
  for (const e of els) {
    const last = r[r.length - 1];
    if (last && e.y0 < last.y1 - 2) { last.y1 = Math.max(last.y1, e.y1); last.x = Math.min(last.x, e.x); last.t += " " + e.t; last.img ||= e.img; }
    else r.push({ ...e });
  }
  return r;
}
const content = (pg, from = 0, to = 1e9) => pg.els.filter(e => e.y0 >= from - 1 && e.y1 <= to + 1 && !/^Página|Processo de Admissão 20/.test(e.t) && !(e.img && e.w > 400 && e.y0 < 60) && e.y1 < 790);

// segs: [{f,p,y0,y1}] -> um PNG empilhado
function stitch(segs) {
  const pad = 6, hs = segs.map(s => Math.ceil((s.y1 - s.y0 + 2 * pad) * S)), W = Math.ceil((X1 - X0) * S);
  const pix = new mupdf.Pixmap(mupdf.ColorSpace.DeviceRGB, [0, 0, W, hs.reduce((a, b) => a + b, 0)], false);
  pix.clear(255);
  const dev = new mupdf.DrawDevice(mupdf.Matrix.identity, pix);
  let off = 0; const offs = [];
  segs.forEach((s, i) => {
    offs.push(off);
    const m = mupdf.Matrix.concat(mupdf.Matrix.concat(mupdf.Matrix.translate(-X0, -(s.y0 - pad)), mupdf.Matrix.scale(S, S)), mupdf.Matrix.translate(0, off));
    const path = new mupdf.Path(); path.rect(0, off, W, off + hs[i]);
    dev.clipPath(path, false, mupdf.Matrix.identity);
    open(s.f)[s.p].page.run(dev, m);
    // apaga figuras da resolução que invadem a faixa do enunciado
    for (const [x0, y0, x1, y1] of s.masks || []) { const r = new mupdf.Path(); r.rect(x0, y0, x1, y1); dev.fillPath(r, false, m, mupdf.ColorSpace.DeviceRGB, [1, 1, 1], 1); }
    dev.popClip();
    off += hs[i];
  });
  dev.close();
  return { pix, h: off, w: W, offs, pad };
}
// marca-texto amarelo (o caderno 2025.1 destaca a alternativa certa): detecta e neutraliza a partir da 1ª alternativa
function unhighlight(pix, from) {
  const W = pix.getWidth(), H = pix.getHeight(), px = pix.getPixels(), yel = [];
  for (let y = Math.max(0, Math.floor(from)); y < H; y++) {
    let n = 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3, r = px[i], g = px[i + 1], b = px[i + 2];
      if (r > 40 && g > 40 && r - b > 25 && g - b > 25 && Math.abs(r - g) < 60) { if (r - b > 90) n++; px[i + 2] = px[i] = px[i + 1] = Math.min(r, g); }
    }
    if (n > 15) yel.push(y);
  }
  return yel;
}
const bank = [];
// alternativas que o recorte automático não acha (opções em grade, matrizes, texto em várias linhas): [x, y] em pt
const OVERRIDE = {
  "20241-b3n0-2": { p: 31, opts: [[85, 493], [217, 493], [357, 491], [85, 622], [218, 622]] },
  "20241-b3n1-2": { p: 40, opts: [[85, 405], [85, 450], [85, 494], [85, 539], [85, 583]] },
  "20251-b2n1-5": { p: 27, opts: [[85, 298], [85, 348], [85, 384], [85, 421], [85, 457]] },
  "20251-b3n1-1": { p: 35, opts: [[85, 440], [85, 483], [85, 526], [85, 568], [85, 611]], end: 649 },
  "20251-b4n1-4": { p: 61, opts: [[85, 370], [85, 412], [85, 467], [85, 523], [85, 563]] },
  "20251-b4n3-4": { p: 75, opts: [[85, 334], [85, 363], [85, 421], [85, 465], [85, 523]] },
};
// gabaritos das provas adaptativas (2024.1 pelo "Gabarito:" do caderno; 2025.1 pelas resoluções, conferido com o destaque)
const g = (o) => Object.fromEntries(Object.entries(o).flatMap(([k, v]) => [...v].map((c, i) => [`${k}-${i + 1}`, "ABCDE".indexOf(c)])));
const ANS = {
  "2024.1": g({ b1n0: "BADAECED", b1n1: "CACCACAC", b2n0: "DBBBEB", b2n1: "BCBDCE", b3n0: "DEDAAB", b3n1: "ACADEA", b4n0: "CAEA", b4n1: "CBBA", b4n2: "ABDA" }),
  "2025.1": g({ b1n0: "CBCADBCD", b1n1: "DCDCBADE", b2n0: "BDDCBA", b2n1: "CBABBA", b3n0: "BBBABA", b3n1: "ACBDCA", b3n2: "CCCEAE", b4n0: "CBCA", b4n1: "ADAE", b4n2: "AABA", b4n3: "AEEE" }),
};
function emit(q) {
  const ov = OVERRIDE[q.id];
  if (ov) { q.opts = ov.opts.map(([x, y]) => ({ f: q.exam[0].f, p: ov.p, x, y0: y })); if (ov.end) q.exam.at(-1).y1 = ov.end; }
  const ex = stitch(q.exam);
  // posição de cada alternativa em fração da altura da imagem
  const seg = (o) => { const i = q.exam.findIndex(s => s.f === o.f && s.p === o.p); return ex.offs[i] + (o.y0 - q.exam[i].y0 + ex.pad) * S; };
  const opts = q.opts.map(o => [+((o.x - X0) * S / ex.w).toFixed(4), +(seg(o) / ex.h).toFixed(4)]);
  // alternativa destacada: a última cuja linha começa acima do centro do destaque
  ex.yel = unhighlight(ex.pix, Math.min(...opts.map(o => o[1])) * ex.h - 8);
  fs.writeFileSync(`${OUT}/img/${q.id}.png`, ex.pix.asPNG());
  const yc = ex.yel.length ? (ex.yel[0] + ex.yel[ex.yel.length - 1]) / 2 / ex.h : null;
  const hl = yc === null ? null : opts.reduce((k, o, i) => o[1] <= yc + 0.005 ? i : k, -1);
  if (q.sol?.length) fs.writeFileSync(`${OUT}/img/${q.id}s.png`, stitch(q.sol).pix.asPNG());
  const ans = q.ans ?? ANS[q.prova]?.[q.id.split("-").slice(1).join("-")];
  if (ans === undefined || ans < 0) console.error("SEM GABARITO", q.id);
  if (hl !== null && hl !== ans) console.error("DESTAQUE DIVERGE", q.id, "ABCDE"[hl], "ABCDE"[ans]);
  const lettered = q.optText.every(t => /^[A-Ea-e](\)|\s|$)/.test(t));
  bank.push({ id: q.id, prova: q.prova, b: q.b, lv: q.lv, ar: +(ex.w / ex.h).toFixed(4), opts, ans, lettered, sol: !!q.sol?.length, gab: q.gab, optText: q.optText, solText: q.solText });
}

// ---------- provas clássicas (2022.1, 2022.2, 2023.1): 24 questões, sem trilhas ----------
const blockOf = n => n <= 8 ? 0 : n <= 14 ? 1 : n <= 20 ? 2 : 3;
function classic(f, prova, p0, p1, solNext) {
  const pages = open(f);
  for (let p = p0; p <= p1; p++) {
    const pg = pages[p], st = pg.els.find(e => /^QUESTÃO \d+ \|/.test(e.t));
    if (!st) continue;
    const n = +st.t.match(/\d+/)[0];
    // a questão pode continuar nas páginas seguintes até um marcador (rascunho/resolução) ou a próxima questão
    const MARK = /^(RASCUNHO|RESOLUÇÃO|RESULTADO|ALTERNATIVA CORRETA)/, exam = [], r = [];
    for (let q = p, from = st.y0; q < pages.length; q++, from = 0) {
      const mark = pages[q].els.find(e => e.y0 > from && MARK.test(e.t));
      const to = mark ? mark.y0 - 2 : 1e9;
      // fontes de fórmula têm bbox exagerada: filtra e posiciona pelo centro da linha
      const els = content(pages[q], 0, 1e9).filter(e => (e.y0 + e.y1) / 2 >= from - 1 && (e.y0 + e.y1) / 2 <= to);
      if (els.length) exam.push({ f, p: q, y0: from || Math.min(...els.map(e => e.y0)), y1: Math.min(to, Math.max(...els.map(e => e.y1))) });
      r.push(...els.filter(e => e.t).map(e => ({ ...e, p: q, y0: (e.y0 + e.y1) / 2 - 8 })).sort((a, b) => a.y0 - b.y0));
      const nx = pages[q + 1]?.els.find(e => e.t && e.y0 < 120 && !/^Página/.test(e.t));
      if (mark || !nx || /^QUESTÃO|^RESOLUÇÃO/.test(nx.t)) break;
    }
    // alternativas: busca de trás pra frente E, D, C, B, A
    const opts = []; let k = r.length;
    for (const L of "EDCBA") { do k--; while (k >= 0 && !new RegExp(`^${L}(\\s|$)`).test(r[k].t)); if (k < 0) break; opts.unshift(r[k]); }
    // gabarito: próxima "ALTERNATIVA CORRETA" a partir desta página
    let ans = null, solPage = null;
    for (let q = p; q <= Math.min(p + 2, pages.length - 1) && ans === null; q++) {
      const a = pages[q].els.find(e => /ALTERNATIVA CORRETA: *[A-E]/.test(e.t) && (q > p || e.y0 > st.y0));
      if (a) { ans = "ABCDE".indexOf(a.t.match(/CORRETA: *([A-E])/)[1]); solPage = q; }
    }
    let sol = null;
    if (solNext && solPage > p) {
      const sp = pages[solPage], top = sp.els.find(e => /^RESOLUÇÃO/.test(e.t));
      const se = content(sp, top.y0);
      sol = [{ f, p: solPage, y0: top.y0, y1: Math.max(...se.map(e => e.y1)) }];
    }
    if (opts.length !== 5 || ans === null) console.error("WARN", prova, n, "opts", opts.length, "ans", ans);
    emit({ id: `${prova.replace(".", "")}-${String(n).padStart(2, "0")}`, prova, b: blockOf(n), lv: 0,
      exam, opts: opts.map(o => ({ f, p: o.p, y0: o.y0, x: o.x })), ans, sol, optText: opts.map(o => o.t.slice(0, 60)) });
  }
}
classic("2022.1.pdf", "2022.1", 1, 24, false);
classic("2022.2.pdf", "2022.2", 1, 50, true);
classic("2022.1.pdf", "2023.1", 61, 85, false);

// ---------- provas adaptativas (2024.1, 2025.1): blocos/níveis pela ordem do caderno ----------
function adaptive(f, prova, layout, top, skip = []) {
  const pages = open(f);
  const all = [...layout.flat(2), ...skip].sort((a, b) => a - b);
  layout.forEach((levels, b) => levels.forEach((ps, lv) => ps.forEach((p0, i) => {
    const next = all.find(x => x > p0) ?? pages.length;
    const exam = [], sol = [], optRows = []; let inSol = false, solText = "";
    for (let p = p0; p < next; p++) {
      const pg = pages[p], els = content(pg, top);
      const m = inSol ? null : els.find(e => /^-{10}|^Gabarito|^Solução/.test(e.t));
      if (!inSol) {
        const ee = els.filter(e => !m || e.y1 <= m.y0 + 1);
        const masks = m ? els.filter(e => e.img && e.y0 < m.y0 && e.y1 > m.y0 + 1).map(e => [e.x - 2, e.y0 - 2, e.x + e.w + 2, e.y1]) : [];
        if (ee.length) { exam.push({ f, p, y0: Math.min(...ee.map(e => e.y0)), y1: Math.max(...ee.map(e => e.y1)), masks }); optRows.push(...rows(ee).map(r => ({ ...r, f, p }))); }
      }
      if (m || inSol) {
        const se = els.filter(e => inSol || e.y0 >= m.y0).filter(e => !/^-{10}/.test(e.t));
        if (se.length) sol.push({ f, p, y0: Math.min(...se.map(e => e.y0)), y1: Math.max(...se.map(e => e.y1)) });
        solText += se.map(e => e.t).join("\n") + "\n";
        inSol = true;
      }
    }
    const opts = optRows.slice(-5);
    // o recorte termina na última alternativa: figuras da resolução às vezes começam acima da palavra "Solução"
    const lastOpt = opts[4], lastSeg = exam[exam.length - 1];
    if (lastOpt && lastSeg.p === lastOpt.p) lastSeg.y1 = Math.min(lastSeg.y1, lastOpt.y1 + 2);
    const g = solText.match(/Gabarito:\s*(.*)/);
    emit({ id: `${prova.replace(".", "")}-b${b + 1}n${lv}-${i + 1}`, prova, b, lv, exam, sol,
      opts: opts.map(o => ({ f: o.f, p: o.p, y0: o.y0, x: o.x })), ans: null, gab: g?.[1]?.trim(), optText: opts.map(o => o.t.slice(0, 60)), solText: solText.slice(0, 1500) });
  })));
}
// layout[bloco][nível] = páginas onde cada questão começa. No bloco 1 os "níveis" são as duas versões da prova (sorteadas).
adaptive("2024.1.pdf", "2024.1", [
  [[2,3,4,5,6,7,8,9],[10,11,12,13,14,15,16,17]],
  [[18,19,20,21,22,23],[24,25,26,27,28,29]],
  [[30,31,33,34,35,37],[38,40,41,42,43,44]],
  [[45,46,48,49],[50,51,53,54],[55,56,58,60]],
], 62, [62, 63]); // 62-63: 4º nível do bloco 4 incompleto no caderno (só 2 questões), fica de fora
adaptive("Gabarito-Final-Prova-PS-2025.1-3.pdf", "2025.1", [
  [[1,2,3,4,5,6,7,8],[9,10,11,12,13,14,15,16]],
  [[17,18,19,20,21,22],[23,24,25,26,27,28]],
  [[29,30,31,32,33,34],[35,37,39,40,41,42],[43,45,47,48,49,51]],
  [[52,53,54,55],[56,58,60,61],[63,65,67,68],[69,71,73,75]],
], 60);
const data = bank.map(({ id, prova, b, lv, ar, opts, ans, lettered, sol }) => ({ id, prova, b, lv, ar, opts, ans, lettered, sol }));
fs.writeFileSync(OUT + "/js/banco.js", `// Gerado por npm run build (gerador/gerar-banco.mjs), não edite à mão.
// Cada questão é um recorte (img/<id>.png) com a posição [x, y] de cada alternativa.
const BANK = ${JSON.stringify(data)};
`);
console.log(bank.length, "questões ->", OUT);
