// Telas do simulado: início, instruções, prova (um bloco por vez) e resultado.
let equiv = { ex: "enem", nota: "", nivel: "HL" };
let s, tick, chosen = PROVAS[0].id;
const app = document.getElementById("app");
// manutenção: texto da volta (ex.: "hoje às 18:00") mostra o aviso no lugar do simulado; null libera o site.
// ?preview na URL ignora o aviso, para testar a versão publicada antes de liberar.
const MANUTENCAO = null;
const CREDIT = `<footer class="credit"><span>Criado por <a href="https://www.linkedin.com/in/luiz-cazelatto/" target="_blank" rel="noopener">Luiz Cazelatto</a>, de um aluno para futuros alunos <br> versão ${VERSAO}</span></footer>`;

// histórico: no db privado de cada pessoa (data/users/<id>); sem db (arquivo local, sem login), fica no navegador
const hist = { list: [], ready: false, where: "" };
let histCol = null;
const localHist = () => { try { return JSON.parse(localStorage.getItem("historico") || "[]"); } catch { return []; } };
const saveLocal = () => { try { localStorage.setItem("historico", JSON.stringify(hist.list.slice(0, 200))); } catch {} };
(async () => {
  try {
    const [db, user] = await Promise.all([window.claude?.use?.("db"), window.claude?.use?.("user")]);
    const uid = await user?.id?.();
    if (db && uid) {
      histCol = db.collection("data/users/" + uid);
      const snap = await histCol.orderBy("at", "desc").limit(200).get();
      hist.list = snap.docs.map(d => d.data());
      hist.where = "Salvo na sua conta, visível só para você.";
    } else throw 0;
  } catch { histCol = null; hist.list = localHist(); hist.where = "Salvo só neste navegador."; }
  hist.ready = true;
  if (document.querySelector(".home")) intro(); else renderHistory();
})();
async function saveAttempt(rec) {
  hist.list.unshift(rec); histPage = 0;
  if (histCol) { try { await histCol.add(rec); return; } catch { histCol = null; hist.where = "Salvo só neste navegador."; } }
  saveLocal();
}
// 5 tentativas por página; a página fica guardada ao abrir uma correção e voltar
const HIST_PAGE = 4;
let histPage = 0;
function renderHistory() {
  const el = document.getElementById("hist"), pager = document.getElementById("pager"); if (!el) return;
  pager.innerHTML = "";
  if (!hist.ready) { el.innerHTML = `<p class="note">Carregando suas tentativas…</p>`; return; }
  if (!hist.list.length) { el.innerHTML = `<p class="note">Nenhuma tentativa ainda. Sua nota aparece aqui quando você terminar uma prova.</p>`; return; }
  const best = {}; hist.list.forEach(r => { if (!r.eliminated) best[r.prova] = Math.max(best[r.prova] ?? 0, r.score); });
  const fmt = n => n.toFixed(1).replace(".", ",");
  // tentativas antigas (sem res) ou com questão que saiu do banco não abrem a correção
  const canView = r => r.res?.every(b => b.qs.every(id => byId[id]));
  const pages = Math.ceil(hist.list.length / HIST_PAGE), start = (histPage = Math.min(histPage, pages - 1)) * HIST_PAGE;
  // data-l: rótulo que aparece só no celular, onde cada tentativa vira um cartão sem cabeçalho
  el.innerHTML = `<div class="scroll"><table class="hist tent">
    <thead><tr><th>Data</th><th>Prova</th><th class="num">Nota</th><th class="num">Acertos</th><th class="num">Tempo</th><th class="num">Saídas</th><th></th></tr></thead>
    <tbody>${hist.list.slice(start, start + HIST_PAGE).map((r, i) => `<tr>
      <td>${fmtDate(r.at)}</td>
      <td>${r.prova}</td><td class="num n">${r.eliminated ? `<span class="bad">Eliminado</span>` : fmt(r.score) + (r.score === best[r.prova] ? " ★" : "")}</td>
      <td class="num" data-l="acertos">${r.hits}/${r.of ?? 20}</td><td class="num">${r.minutes} min</td><td class="num" data-l="${r.trocas === 1 ? "saída" : "saídas"}">${r.trocas ?? "–"}</td>
      <td class="num">${canView(r) ? `<button class="ver" data-ver="${start + i}">Ver</button>` : ""}${histCol ? "" : `<button class="del" data-del="${start + i}" aria-label="Apagar tentativa de ${fmtDate(r.at)}" title="Apagar tentativa">✕</button>`}</td></tr>`).join("")}</tbody></table></div>
    <p class="note">★ melhor nota em cada prova. ${hist.where}</p>`;
  if (pages > 1) pager.innerHTML = `<button data-pg="-1" aria-label="Tentativas mais recentes" ${histPage ? "" : "disabled"}>‹</button>
    <span>${histPage + 1} de ${pages}</span>
    <button data-pg="1" aria-label="Tentativas mais antigas" ${histPage < pages - 1 ? "" : "disabled"}>›</button>`;
  pager.querySelectorAll("[data-pg]").forEach(b => b.onclick = () => { histPage += +b.dataset.pg; renderHistory(); });
  el.querySelectorAll("[data-ver]").forEach(b => b.onclick = () => showResult(hist.list[+b.dataset.ver]));
  // apagar: o primeiro clique pede confirmação; a tela inicial é redesenhada porque "Meus erros" depende do histórico
  // ponytail: só no histórico do navegador; no db da conta (histCol) os registros não guardam o id para apagar
  el.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
    if (!b.classList.contains("armed")) {
      b.classList.add("armed"); b.textContent = "Apagar?";
      return setTimeout(() => { b.classList.remove("armed"); b.textContent = "✕"; }, 4000);
    }
    hist.list.splice(+b.dataset.del, 1); saveLocal(); intro();
  });
}
const fmtDate = at => new Date(at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// tema: claro por padrão; a escolha fica salva só neste navegador
const root = document.documentElement;
try { if (localStorage.getItem("tema") === "dark") root.dataset.theme = "dark"; } catch {}
const themeBtn = () => `<button class="theme" data-toggle-theme>${root.dataset.theme === "dark" ? "Tema claro" : "Tema escuro"}</button>`;
app.addEventListener("click", e => {
  const b = e.target.closest("[data-toggle-theme]"); if (!b) return;
  const dark = root.dataset.theme !== "dark";
  if (dark) root.dataset.theme = "dark"; else delete root.dataset.theme;
  try { localStorage.setItem("tema", dark ? "dark" : "light"); } catch {}
  app.querySelectorAll("[data-toggle-theme]").forEach(x => x.outerHTML = themeBtn());
});

const nome = p => prova(p).sizes ? p : "Prova " + p;
function intro() {
  clearInterval(tick);
  const revisar = errosPorQuestao(hist.list);
  app.innerHTML = `<div class="wrap stack home">
    <div class="top"><div class="eyebrow">Simulado não oficial · questões dos cadernos de prova do Inteli</div><div class="top-actions">${starWrap()}${fbBtn()}${themeBtn()}</div></div>
    <h1>Simulado Eixo Prova</h1>
    <div class="cols"><div class="sheet">
      <h2>Escolha a prova</h2>
      <div class="provas">${PROVAS.map(p => `<button class="prova" data-p="${p.id}" aria-pressed="${p.id === chosen}"><b>${p.id}</b><span>${p.desc}</span></button>`).join("")}</div>
      <h2>Outros formatos</h2>
      <div class="provas">${FORMATOS.map(f => {
        const n = f.erros && BANK.filter(q => paraRevisar(revisar, q)).length, off = f.erros && !n;
        return `<button class="prova" data-p="${f.id}" aria-pressed="${f.id === chosen}" ${off ? "disabled" : ""}><b>${f.id}</b><span>${!f.erros ? f.desc : off ? "Faça uma prova primeiro: seus erros aparecem aqui" : `${n} ${n > 1 ? "questões" : "questão"} para revisar, bloco a bloco · ${f.min} min`}</span></button>`;
      }).join("")}</div>
      <ul class="rules">
        <li>24 questões de matemática e lógica em 4 blocos: 8, 6, 6 e 4.</li>
        <li><b>Em cada bloco, descarte exatamente 1 questão e responda todas as outras.</b> Você responde 20 no total. A plataforma não avisa nem impede: sem descarte, 1 questão que você acertou é desconsiderada; descartes a mais e questões em branco contam como erro.</li>
        <li>Sair da tela da prova (trocar de aba ou janela, atualizar a página) fica registrado. Na prova online isso pode reduzir seu tempo ou desclassificar.</li>
        <li>Nas provas adaptativas, acertar mais da metade de um bloco leva a uma trilha mais difícil. As questões do bloco 1, as mais fáceis, valem mais, e o peso cai a cada bloco; dentro do mesmo bloco, a trilha mais difícil vale mais. O bloco 1 sorteia uma das duas versões aplicadas.</li>
        <li>120 minutos. Nas provas adaptativas, bloco enviado não volta; nas provas 2022.1, 2022.2 e 2023.1, que não têm trilha, dá para voltar a qualquer bloco até finalizar. Ao zerar o tempo, a prova é encerrada com o que estiver marcado.</li>
        <li>Só calculadora básica. Nada de científica ou celular.</li>
      </ul>
      <p class="note">As trilhas seguem a ordem dos cadernos oficiais. Os pesos de pontuação são estimados, então use a nota como referência.</p>
      <div><button class="primary" id="go">Começar ${prova(chosen).sizes ? chosen.toLowerCase() : "prova " + chosen}</button></div>
    </div>
    <div class="side"><div class="sheet"><div class="hist-head"><h2>Suas tentativas</h2><div class="pager" id="pager"></div></div><div id="hist"></div></div>
    <div class="sheet" id="equiv"></div></div></div>
    ${CREDIT}</div>`;
  renderHistory(); renderEquiv();
  app.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { chosen = b.dataset.p; intro(); });
  document.getElementById("go").onclick = instructions;
}

// edital 5.1.5: a plataforma registra cada saída da tela da prova (trocar de aba ou janela, atualizar a página)
let away = false;
function leave() {
  if (!s || s.done || away || !document.getElementById("slide")) return;
  away = true; s.trocas++; saveProgress(); showTrocas();
}
document.addEventListener("visibilitychange", () => { if (document.hidden) leave(); else away = false; });
window.addEventListener("blur", leave);
window.addEventListener("focus", () => { away = false; });
function showTrocas() {
  const el = document.getElementById("trocas"); if (!el) return;
  el.textContent = s.trocas ? `${s.trocas} ${s.trocas > 1 ? "saídas" : "saída"} da tela` : "";
}

// andamento salvo no navegador: atualizar a página retoma a prova (e conta como saída da tela)
function saveProgress() {
  if (free()) Object.assign(s.blocks[s.b], { qs: s.qs, ans: s.ans, disc: s.disc, cur: s.cur });
  const blocks = s.blocks?.map(x => ({ ...x, qs: ids(x.qs) }));
  try { localStorage.setItem("andamento", JSON.stringify({ ...s, blocks, qs: ids(s.qs), res: s.res.map(r => ({ ...r, qs: ids(r.qs) })) })); } catch {}
}
function loadProgress() {
  try {
    const d = JSON.parse(localStorage.getItem("andamento") || "null"); if (!d || d.done) return null;
    d.qs = d.qs.map(id => byId[id]); d.res = d.res.map(r => ({ ...r, qs: r.qs.map(id => byId[id]) }));
    if (d.blocks) { d.blocks.forEach(x => x.qs = x.qs.map(id => byId[id])); d.qs = d.blocks[d.b].qs; }
    return d.qs.every(Boolean) && d.res.every(r => r.qs.every(Boolean)) && (d.blocks || []).every(x => x.qs.every(Boolean)) ? d : null;
  } catch { return null; }
}
const clearProgress = () => { try { localStorage.removeItem("andamento"); } catch {} };

function renderEquiv() {
  const box = document.getElementById("equiv"), e = EXAMES[equiv.ex];
  box.innerHTML = `
    <h2>Sua nota vale quantos acertos?</h2>
    <div class="seg" role="group" aria-label="Exame">${Object.entries(EXAMES).map(([k, x]) => `<button data-ex="${k}" aria-pressed="${k === equiv.ex}">${x.nome}</button>`).join("")}</div>
    ${e.ib ? `
    <p class="note">Pelo edital 2027, a nota de ${e.campo} do IB ${e.anos} pode substituir o Eixo Prova a partir de 6 no Standard ou 5 no Higher.</p>
    <div class="ib-in">
      <label class="enem-in" for="nivel-equiv">Nível
        <select id="nivel-equiv">${Object.entries(e.ib).map(([k, n]) => `<option value="${k}" ${k === equiv.nivel ? "selected" : ""}>${n.nome} (${k})</option>`).join("")}</select>
      </label>
      <label class="enem-in" for="nota-equiv">Nota
        <select id="nota-equiv"><option value="">Escolha</option>${[7, 6, 5, 4, 3, 2, 1].map(n => `<option ${String(n) === String(equiv.nota) ? "selected" : ""}>${n}</option>`).join("")}</select>
      </label>
    </div>` : `
    <p class="note">Pelo edital 2027, a nota de ${e.campo} do ${e.nome} ${e.anos} pode substituir o Eixo Prova a partir de ${e.min} pontos.</p>
    <label class="enem-in" for="nota-equiv">Nota em ${e.campo}
      <input id="nota-equiv" type="number" inputmode="decimal" min="0" max="${e.max}" step="${e.dec ? 0.1 : 1}" placeholder="Ex.: ${e.ex}" value="${equiv.nota}">
    </label>`}
    <div id="equiv-out" aria-live="polite"></div>
    <div class="scroll"><table class="hist">${e.ib ? `
      <thead><tr><th>Nível</th><th class="num">Nota IB</th><th class="num">Acertos equivalentes</th></tr></thead>
      <tbody>${Object.entries(e.ib).flatMap(([k, n]) => Object.entries(n.notas).map(([nota, a]) => `<tr data-k="${k}${nota}"><td>${n.nome}</td><td class="num">${nota}</td><td class="num">${a}</td></tr>`)).join("")}</tbody>` : `
      <thead><tr><th>Nota ${e.nome}</th><th class="num">Acertos equivalentes</th></tr></thead>
      <tbody>${[10, 11, 12, 13, 14, 15].map(a => `<tr data-k="${a}"><td>${faixa(e, a)}</td><td class="num">${a}</td></tr>`).join("")}</tbody>`}
    </table></div>`;
  box.querySelectorAll("[data-ex]").forEach(b => b.onclick = () => { equiv = { ...equiv, ex: b.dataset.ex, nota: "" }; renderEquiv(); });
  document.getElementById("nota-equiv").oninput = ev => { equiv.nota = ev.target.value; renderEquivOut(); };
  const nv = document.getElementById("nivel-equiv"); if (nv) nv.onchange = ev => { equiv.nivel = ev.target.value; renderEquivOut(); };
  renderEquivOut();
}
function renderEquivOut() {
  const e = EXAMES[equiv.ex], out = document.getElementById("equiv-out"), nota = parseFloat(String(equiv.nota).replace(",", "."));
  const a = !Number.isFinite(nota) ? undefined : e.ib ? ibAcertos(equiv.nivel, nota) : acertosEquiv(e, nota);
  const key = e.ib ? equiv.nivel + nota : String(a);
  document.querySelectorAll("#equiv tr[data-k]").forEach(tr => tr.classList.toggle("hit", a != null && tr.dataset.k === key));
  if (a === undefined) { out.innerHTML = ""; return; }
  const best = Math.max(0, ...hist.list.filter(r => !prova(r.prova)?.sizes).map(r => r.hits || 0));
  out.innerHTML = a === null
    ? `<p class="elim">${e.ib ? `Nota ${nota} no ${e.ib[equiv.nivel].nome} não é aceita (mínimo ${equiv.nivel === "SL" ? 6 : 5})` : `Abaixo de ${e.min}`}: o ${e.nome} não substitui o Eixo Prova, então você precisa fazer a prova.</p>`
    : `<div class="score"><span class="big">${a}</span><span class="kv">acertos equivalentes na prova do Inteli, de 20</span></div>
       <p class="note">Os 10 acertos são só a régua de equivalência do edital, não a nota de corte: o corte muda a cada ano conforme os candidatos, e já houve aprovação com 8 acertos. Se você fizer a prova e também enviar o ${e.nome}, vale a maior nota.${best ? ` Seu melhor no simulado até agora: ${best} acertos.` : ""}</p>`;
}

function instructions() {
  const f = prova(chosen), adapt = f.adapt, sz = sizes(chosen), total = sz.reduce((a, n) => a + n, 0);
  app.innerHTML = `<div class="wrap stack">
    <div class="top"><div class="eyebrow">${nome(chosen)} · ${f.erros ? "suas questões para revisar" : f.desc}</div>${themeBtn()}</div>
    <h1>Antes de começar</h1>
    <div class="sheet">
      <ul class="rules">
        <li><b>${f.min ?? 120} minutos</b> para ${total} questões em 4 blocos (${sz.slice(0, 3).join(", ")} e ${sz[3]}). O cronômetro começa assim que você clicar em "Começar agora".</li>
        <li>Em cada bloco, <b>descarte exatamente 1 questão</b> e responda as outras. Sem descarte, 1 questão que você acertou é desconsiderada; descartes a mais e questões em branco contam como erro. A plataforma não avisa.</li>
        <li>Use <b>Voltar</b> e <b>Avançar</b> no rodapé (ou as setas do teclado) para passar as questões. As bolinhas no topo mostram o que está respondido (verde), descartado (laranja) e em branco.</li>
        ${f.sizes ? `<li>Questões de várias provas, cada uma no bloco em que caiu na prova original. A prova de origem aparece no topo de cada questão.</li>` : ""}
        <li>${adapt ? "<b>Bloco enviado não volta.</b> O desempenho em cada bloco define a dificuldade do próximo." : "Esta prova não tem trilha: dá para ir e voltar entre os blocos até finalizar."}</li>
        <li>Sair da tela da prova (trocar de aba ou janela, atualizar a página) fica registrado.</li>
        <li>Só calculadora básica. Nada de científica ou celular.</li>
      </ul>
      <p class="elim"><b>Depois de começar, não dá para voltar a esta tela.</b> A prova continua mesmo se você fechar ou atualizar a página. Se quiser sair antes do fim, use <b>Encerrar prova</b> na barra do topo: a prova é finalizada e corrigida com o que você já respondeu.</p>
      <div class="nav"><button id="back">← Escolher outra prova</button><button class="primary" id="begin">Começar agora</button></div>
    </div></div>`;
  document.getElementById("back").onclick = intro;
  document.getElementById("begin").onclick = start;
  window.scrollTo(0, 0);
}

// encerrar antes do fim: confirma com um segundo clique (o visualizador não mostra confirm())
let endArmed = 0;
function endNow(btn) {
  if (!endArmed) {
    btn.textContent = "Confirmar encerramento"; btn.classList.add("armed");
    endArmed = setTimeout(() => { endArmed = 0; btn.innerHTML = 'Encerrar<span class="lg"> prova</span>'; btn.classList.remove("armed"); }, 4000);
    return;
  }
  clearTimeout(endArmed); endArmed = 0;
  if (free()) closeAll(); else closeBlock();
  finish(false, true);
}

function start() {
  const f = prova(chosen), dur = (f.min ?? 120) * 60e3;
  s = { p: chosen, b: 0, lvs: [], ups: 0, res: [], trocas: 0, dur, end: Date.now() + dur };
  const blocos = f.sizes ? montarProva(f, hist.list) : !f.adapt && [0, 1, 2, 3].map(b => pool(s.p, b, 0));
  if (blocos) s.blocks = blocos.map(qs => ({ qs, ans: {}, disc: [], cur: 0 }));
  evento("inicio/" + s.p, "Começou: " + nome(s.p));
  tick = setInterval(clock, 1000);
  openBlock(); window.scrollTo(0, 0);
}
// sem trilha não há motivo para trancar blocos (só nas provas clássicas)
const free = () => !!s.blocks;
function switchBlock(b) {
  Object.assign(s.blocks[s.b], { qs: s.qs, ans: s.ans, disc: s.disc, cur: s.cur });
  s.b = b; Object.assign(s, s.blocks[b]);
  renderBlock(); window.scrollTo(0, 0);
}

function openBlock() {
  if (free()) { s.lvs = [0, 0, 0, 0]; Object.assign(s, s.blocks[s.b]); return renderBlock(); }
  const adapt = prova(s.p).adapt, n = nLevels(s.p, s.b);
  const lv = !adapt ? 0 : s.b === 0 ? Math.floor(Math.random() * n) : Math.min(s.ups, n - 1);
  s.lvs.push(lv);
  Object.assign(s, { qs: adapt ? shuffle(pool(s.p, s.b, lv)) : pool(s.p, s.b, lv), ans: {}, disc: [], cur: 0 });
  renderBlock();
}

function clock() {
  const left = Math.max(0, s.end - Date.now()), el = document.getElementById("timer");
  if (el) {
    el.textContent = `${String(Math.floor(left / 6e4)).padStart(2, "0")}:${String(Math.floor(left / 1e3) % 60).padStart(2, "0")}`;
    el.classList.toggle("low", left < 10 * 6e4);
  }
  if (!left) timeUp();
}

const trackName = (p, b, lv) => b === 0 ? (nLevels(p, 0) > 1 ? `versão ${lv + 1}` : "") : nLevels(p, b) > 1 ? `nível ${lv + 1} de ${nLevels(p, b)}` : "";

// recorte da questão com as letras posicionadas sobre cada alternativa
// conteúdo dos cadernos 2024.1/2025.1 fica entre 11,4% e 88,6% da largura (medido em todas as questões);
// o corte deixa ~3% à esquerda para as letras A–E, que ficam antes de cada alternativa
const ZOOM = { l: 0.08, w: 0.815 };
function page(q, cls = () => "", clickable = false) {
  const z = prova(q.prova).adapt, px = x => z ? (x - ZOOM.l) / ZOOM.w : x;
  return `<div class="page${z ? " zoom" : ""}"${z ? ` style="--zl:${ZOOM.l};--zw:${ZOOM.w}"` : ""}><img src="img/${q.id}.png" alt="Questão ${q.id}" loading="lazy" width="882" height="${Math.round(882 / q.ar)}">
    ${q.lettered ? "" : q.opts.map(([x, y], j) => `<${clickable ? "button" : "span"} class="badge ${cls(j)}" ${clickable ? `data-o="${j}"` : ""} style="left:${px(x) * 100}%;top:${y * 100}%" aria-hidden="true">${L[j]}</${clickable ? "button" : "span"}>`).join("")}</div>`;
}

// uma questão por vez (carrossel); a barra do topo e o rodapé ficam fixos
function renderBlock() {
  app.innerHTML = `
    <div class="bar"><div class="in">
      <div class="blocks">${[0, 1, 2, 3].map(b => free()
        ? `<button class="blk ${b === s.b ? "now" : ""}" data-blk="${b}" aria-pressed="${b === s.b}">Bloco ${b + 1}</button>`
        : `<div class="blk ${b < s.b ? "done" : b === s.b ? "now" : ""}">Bloco ${b + 1}</div>`).join("")}</div>
      <div class="dots" id="dots" aria-label="Situação das questões do bloco"></div>
      <span class="trocas" id="trocas" role="status"></span>
      <div class="timer" id="timer" aria-label="Tempo restante">120:00</div><button class="theme end" id="end">Encerrar<span class="lg"> prova</span></button>${themeBtn()}
    </div></div>
    <div class="wrap exam">
      ${lido("dicaGirar") ? "" : `<p class="dica-girar">Gire o celular para ler a questão maior, ou toque nela para ampliar.<button data-dica aria-label="Fechar dica">✕</button></p>`}
      <div class="qs" id="slide"></div>
    </div>
    <div class="foot"><div class="in">
      <div class="nav">
        <button id="prev" aria-label="Voltar">←<span class="lg"> Voltar</span></button>
        <button id="disc" class="disc"></button>
        <button id="next" aria-label="Avançar"><span class="lg">Avançar </span>→</button>
      </div>
      <button class="primary" id="send"></button>
    </div></div>`;
  document.getElementById("prev").onclick = () => go(s.cur - 1);
  document.getElementById("next").onclick = () => go(s.cur + 1);
  document.getElementById("disc").onclick = () => { const i = s.cur; s.disc = s.disc.includes(i) ? s.disc.filter(k => k !== i) : [...s.disc, i]; renderSlide(); };
  document.getElementById("send").onclick = send;
  app.querySelector("[data-dica]")?.addEventListener("click", e => { lembrar("dicaGirar", "1"); e.currentTarget.parentElement.remove(); fit(); });
  document.getElementById("end").onclick = e => endNow(e.currentTarget);
  app.querySelectorAll("[data-blk]").forEach(x => x.onclick = () => switchBlock(+x.dataset.blk));
  renderSlide(); clock(); showTrocas();
}
function go(i) { if (i < 0 || i >= s.qs.length) return; s.cur = i; renderSlide(); window.scrollTo(0, 0); }
// formatos: mostra se a questão é inédita ou quantas vezes você já errou (pelo histórico, sem contar a prova atual)
const marca = st => !st ? `<span class="chip new">Inédita</span>` : st.erros ? `<span class="chip bad">Errou ${st.erros}×</span>` : `<span class="chip ok">Já acertou</span>`;
function renderSlide() {
  const i = s.cur, q = s.qs[i], off = s.disc.includes(i), n = offset(s.b) + i + 1;
  document.getElementById("slide").innerHTML = `
    <section class="q ${off ? "off" : ""}">
      <div class="qh"><span class="qh-l"><span class="qn">Questão ${n} · ${i + 1} de ${s.qs.length}</span>${prova(s.p).sizes ? marca(errosPorQuestao(hist.list)[q.id]) : ""}</span><span class="qn">Prova ${q.prova} · bloco ${s.b + 1}${trackName(s.p, s.b, s.lvs[s.b]) ? " · " + trackName(s.p, s.b, s.lvs[s.b]) : ""}</span></div>
      ${page(q, j => s.ans[i] === j ? "on" : "", !off)}
      <div class="answers" role="group" aria-label="Resposta da questão ${n}">
        ${L.split("").map((l, j) => `<button class="opt" data-o="${j}" aria-pressed="${s.ans[i] === j}" ${off ? "disabled" : ""}>${l}</button>`).join("")}
      </div>
    </section>`;
  document.getElementById("slide").querySelectorAll("[data-o]").forEach(btn => btn.onclick = () => {
    s.ans[i] = s.ans[i] === +btn.dataset.o ? undefined : +btn.dataset.o; renderSlide();
  });
  const d = document.getElementById("disc");
  d.textContent = off ? "Desfazer descarte" : "Descartar";
  d.classList.toggle("on", off);
  document.getElementById("prev").disabled = i === 0;
  document.getElementById("next").disabled = i === s.qs.length - 1;
  status(); saveProgress(); fit();
}
// a questão inteira cabe na altura da tela: limita a largura do recorte pela altura disponível
// texto dos recortes: ~11 pt × 1,6 = 17,6 px numa imagem de 882 px; nunca mostrar menor que MIN_FONT (questões longas rolam)
const MIN_FONT = 14, TXT = 17.6, IMG_W = 882;
function fit() {
  const pg = document.querySelector("#slide .page"); if (!pg) return;
  const q = s.qs[s.cur], ar = prova(q.prova).adapt ? q.ar * ZOOM.w : q.ar;
  const h = sel => document.querySelector(sel)?.offsetHeight || 0;
  const avail = innerHeight - h(".bar") - h(".foot") - h("#slide .qh") - h("#slide .answers") - 24;
  const minW = MIN_FONT / TXT * IMG_W * (prova(q.prova).adapt ? ZOOM.w : 1);
  pg.style.maxWidth = Math.max(minW, Math.floor(avail * ar)) + "px";
}
window.addEventListener("resize", fit);

// setas do teclado navegam entre as questões
document.addEventListener("keydown", e => {
  if (!s?.qs || !document.getElementById("slide") || document.querySelector("dialog[open]") || e.target.closest?.("input,textarea")) return;
  if (e.key === "ArrowLeft") go(s.cur - 1);
  if (e.key === "ArrowRight") go(s.cur + 1);
});


const offset = b => sizes(s.p).slice(0, b).reduce((a, n) => a + n, 0);
// tocar numa questão (ou resolução) que aparece pequena demais abre ela em tela cheia, com zoom e arrastando com o dedo
document.addEventListener("click", e => {
  const pg = e.target.closest?.(".page");
  if (!pg || pg.closest("dialog") || e.target.closest("button") || pg.querySelector("img").offsetWidth >= IMG_W * MIN_FONT / TXT) return;
  ampliar(pg);
});
function ampliar(pg) {
  evento("ampliou", "Ampliou uma questão no celular");
  const d = document.createElement("dialog");
  d.className = "viewer";
  d.setAttribute("aria-label", "Questão ampliada");
  d.innerHTML = `<div class="viewer-in">${pg.outerHTML}</div>
    <div class="viewer-bar"><button data-z="0.8" aria-label="Diminuir">−</button><button data-z="1.25" aria-label="Aumentar">+</button><button data-x>Fechar</button></div>`;
  const big = d.querySelector(".page");
  let w = Math.max(innerWidth, IMG_W * 15 / TXT * (pg.classList.contains("zoom") ? ZOOM.w : 1)); // começa com a letra em ~15 px
  const set = () => { big.style.width = big.style.maxWidth = w + "px"; };
  d.querySelectorAll("[data-z]").forEach(b => b.onclick = () => { w = Math.min(2600, Math.max(innerWidth, w * b.dataset.z)); set(); });
  const done = () => { d.close(); d.remove(); };
  d.querySelector("[data-x]").onclick = done;
  d.addEventListener("cancel", e => { e.preventDefault(); done(); });
  document.body.appendChild(d); set(); d.showModal();
}
function status() {
  const n = s.qs.length;
  const offset0 = offset(s.b), dots = document.getElementById("dots");
  dots.innerHTML = s.qs.map((_, i) => {
    const st = s.disc.includes(i) ? ["off", "descartada"] : s.ans[i] !== undefined ? ["ans", "respondida"] : ["", "em branco"];
    return `<button class="dot ${st[0]} ${i === s.cur ? "cur" : ""}" data-go="${i}" title="Questão ${offset0 + i + 1}: ${st[1]}" aria-label="Questão ${offset0 + i + 1}, ${st[1]}">${offset0 + i + 1}</button>`;
  }).join("");
  dots.querySelectorAll("[data-go]").forEach(d => d.onclick = () => go(+d.dataset.go));
  document.getElementById("send").textContent = s.b < 3 ? (free() ? "Próximo bloco →" : `Enviar bloco ${s.b + 1}`) : "Finalizar prova";
}

function closeAll() {
  Object.assign(s.blocks[s.b], { qs: s.qs, ans: s.ans, disc: s.disc, cur: s.cur });
  s.blocks.forEach((blk, b) => { s.b = b; Object.assign(s, blk); closeBlock(); });
}
function send() {
  if (free()) { if (s.b < 3) return switchBlock(s.b + 1); closeAll(); return finish(); }
  closeBlock();
  if (s.b < 3) { s.b++; openBlock(); window.scrollTo(0, 0); } else finish();
}

function closeBlock() {
  const lv = s.lvs[s.b], r = grade(s.qs, s.ans, s.disc);
  s.res.push({ b: s.b, lv, ...r, pts: r.c * points(s.p, s.b, lv), qs: s.qs, ans: s.ans, disc: s.disc });
  if (r.up) s.ups++;
}

function timeUp() {
  if (free()) closeAll(); else closeBlock();
  finish(true);
}

// mensagem pelo número de acertos, que é o que o edital usa como referência (10, e já passaram com 8)
const VEREDITOS = [
  [15, "Futuro Inteler! 🚀", "Desempenho excelente, bem acima da referência do edital. Tente as outras provas para confirmar."],
  [10, "Mandou bem! 🎉", "Acima dos 10 acertos de referência do edital. Continue treinando para manter o ritmo no dia."],
  [8, "Na briga! 🔥", "Já houve aprovação com 8 acertos. Revise o que errou e você ganha folga."],
  [5, "Tá chegando lá 📈", "Perto da faixa de referência (8 a 10 acertos). As resoluções abaixo mostram onde focar."],
  [0, "Podemos melhorar 💪", "Todo mundo começa de algum lugar. Revise as resoluções abaixo, uma por uma, e tente de novo."],
];
function finish(timeout, early = false) {
  clearInterval(tick); s.done = true; clearProgress();
  const total = Math.min(100, s.res.reduce((a, r) => a + r.pts, 0)), hits = s.res.reduce((a, r) => a + r.c, 0);
  const used = Math.round(((s.dur ?? DURATION) - Math.max(0, s.end - Date.now())) / 6e4);
  // res guarda questões, respostas e descartes de cada bloco para rever a correção depois, pelo histórico
  const rec = { at: Date.now(), prova: s.p, score: +total.toFixed(1), hits, minutes: used, timeout: !!timeout, early, trocas: s.trocas, levels: s.lvs,
    res: s.res.map(({ b, lv, c, n, excl, penalty, qs, ans, disc }) => ({ b, lv, c, n, excl, penalty, qs: ids(qs), ans, disc })) };
  rec.of = s.res.reduce((a, r) => a + r.n, 0);
  saveAttempt(rec);
  evento("fim/" + s.p, `${timeout ? "Tempo esgotado" : early ? "Encerrou antes" : "Terminou"}: ${nome(s.p)}`);
  showResult(rec, false);
}
// correção de uma tentativa: a que acabou de terminar ou uma do histórico (past)
function showResult(rec, past = true) {
  const p = rec.prova, hits = rec.hits, res = rec.res.map(r => ({ ...r, qs: r.qs.map(id => byId[id]) }));
  let num = 0;
  app.innerHTML = `<div class="wrap stack">
    <div class="top"><div class="eyebrow">${nome(p)} · ${past ? fmtDate(rec.at) + " · " : ""}${rec.timeout ? "tempo esgotado" : rec.early ? "encerrada antes do fim" : "finalizada"} · ${rec.minutes} min usados</div><div class="top-actions">${starWrap()}${fbBtn()}${themeBtn()}</div></div>
    <div class="sheet">
      <div class="score"><span class="big">${rec.score.toFixed(1).replace(".", ",")}</span><span class="kv">de 100 pontos</span></div>
      ${(([, t, m]) => `<p class="verdict"><b>${t}</b>${m}</p>`)(VEREDITOS.find(([n]) => hits * 20 / (rec.of ?? 20) >= n))}
      ${rec.trocas ? `<p class="elim">Você saiu da tela da prova ${rec.trocas} ${rec.trocas > 1 ? "vezes" : "vez"}. Na prova online isso fica registrado e pode reduzir seu tempo ou, nos casos mais graves, desclassificar.</p>` : ""}
      ${res.some(r => r.penalty) ? `<p class="note">Sem descarte em ${res.filter(r => r.penalty).map(r => "bloco " + (r.b + 1)).join(", ")}: 1 acerto foi desconsiderado em cada um, como manda o edital.</p>` : ""}
      <div class="score">
        <span class="kv">Acertos <b>${hits}/${rec.of ?? 20}</b></span>
        ${res.map(r => `<span class="kv">Bloco ${r.b + 1} <b>${r.c}/${r.n}</b>${trackName(p, r.b, r.lv) ? " · " + trackName(p, r.b, r.lv) : ""}</span>`).join("")}
        <span class="kv">Saídas da tela <b>${rec.trocas ?? 0}</b></span>
      </div>
      <p class="note">Não existe nota de corte fixa: o corte muda a cada ano conforme os candidatos (são chamados para a próxima etapa pelo menos 3 vezes o número de vagas). Os 10 acertos que aparecem no edital são só uma referência de equivalência, e já houve aprovação com 8 acertos.</p>
      <div><button class="primary" id="again">${past ? "← Voltar" : "Ver histórico e fazer outra prova"}</button></div>
    </div>
    ${res.map(r => `<h2>Bloco ${r.b + 1} ${trackName(p, r.b, r.lv) ? `<span class="trk">${trackName(p, r.b, r.lv)}</span>` : ""}</h2>
      ${r.qs.map((q, i) => {
        num++;
        const off = i === r.excl, extra = !off && r.disc.includes(i), got = extra ? undefined : r.ans[i], ok = got === q.ans;
        const chip = off ? `<span class="chip off">${r.penalty ? "Desconsiderada (sem descarte)" : "Descartada"}</span>`
          : extra ? `<span class="chip bad">Descarte a mais · conta como erro</span>`
          : ok ? `<span class="chip ok">Acertou</span>` : `<span class="chip bad">${got === undefined ? "Em branco" : "Errou"}</span>`;
        return `<section class="q">
          <div class="qh"><span class="qn">Questão ${num}${prova(p).sizes ? " · prova " + q.prova : ""}</span>${chip}</div>
          ${page(q, j => j === q.ans ? "right" : j === got && !off ? "wrong" : "")}
          <div class="res">
            <span>${off ? "" : `Sua resposta: <b>${got === undefined ? "em branco" : L[got]}</b> · `}Correta: <b>${L[q.ans]}</b></span>
            ${q.sol ? `<details><summary>Ver resolução</summary><div class="page"><img src="img/${q.id}s.png" alt="Resolução" loading="lazy"></div></details>` : ""}
            <button class="fb-link" data-fb="Prova ${q.prova} · questão ${num} (${q.id})">Achou um erro nesta questão?</button>
          </div>
        </section>`;
      }).join("")}`).join("")}
  </div>`;
  document.getElementById("again").onclick = intro;
  window.scrollTo(0, 0);
}

// manutenção ligada (e sem ?preview na URL): só o aviso; histórico e prova em andamento ficam salvos para quando liberar
if (MANUTENCAO && !new URLSearchParams(location.search).has("preview")) maintenance();
else {
  const saved = loadProgress();
  if (saved) {
    s = saved; s.trocas = (s.trocas || 0) + 1; // atualizar a página conta como saída da tela
    if (Date.now() >= s.end) timeUp(); else { tick = setInterval(clock, 1000); renderBlock(); }
  } else { intro(); welcome(); }
}
function maintenance() {
  app.innerHTML = `<div class="wrap stack">
    <div class="top"><div class="eyebrow">Simulado não oficial · questões dos cadernos de prova do Inteli</div>${themeBtn()}</div>
    <h1>Em manutenção 🛠</h1>
    <div class="sheet">
      <p class="verdict"><b>Estamos atualizando o simulado.</b>Volta ${MANUTENCAO}.</p>
      <p class="note">Seu histórico e uma prova em andamento continuam salvos neste navegador.</p>
    </div>
    ${CREDIT}</div>`;
}
