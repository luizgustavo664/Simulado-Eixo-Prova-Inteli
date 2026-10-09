// Botão "Deixe uma estrela no GitHub" com mascote e comemoração no clique.
const REPO = "luizgustavo664/Simulado-Eixo-Prova-Inteli";
let stars = null;
const starred = () => { try { return localStorage.getItem("estrelou") === "1"; } catch { return false; } };
// mascote original: estrelinha com rosto, dança em loop depois do clique
const MASCOT = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2.5l5.3 11 12 1.6-8.8 8.3 2.2 11.9L20 29.6 9.3 35.3l2.2-11.9-8.8-8.3 12-1.6z" fill="#f5b301" stroke="#c98a00" stroke-width="1.6" stroke-linejoin="round"/><circle cx="16" cy="19" r="1.9" fill="#2e2640"/><circle cx="24" cy="19" r="1.9" fill="#2e2640"/><path d="M16 23.5q4 3.6 8 0" fill="none" stroke="#2e2640" stroke-width="1.6" stroke-linecap="round"/><circle cx="13" cy="22.5" r="1.4" fill="#ff8a7a" opacity=".8"/><circle cx="27" cy="22.5" r="1.4" fill="#ff8a7a" opacity=".8"/></svg>`;
const starBtn = () => starred()
  ? `<a class="star done" href="https://github.com/${REPO}" target="_blank" rel="noopener"><span class="mascot">${MASCOT}<i aria-hidden="true">♪</i></span> Valeu pela estrela!<span class="count" data-stars>${stars ?? ""}</span></a>`
  : `<a class="star" href="https://github.com/${REPO}" target="_blank" rel="noopener"><span aria-hidden="true">★</span> Deixe uma estrela no GitHub<span class="count" data-stars>${stars ?? ""}</span></a>`;
const starWrap = () => `<span class="star-wrap">${starBtn()}<small class="plea">${starred() ? "valeu, futuro Inteler! 🥳" : "por favor 😭😭"}</small></span>`;
// contagem de estrelas pela API pública do GitHub; se falhar (sem rede, limite, visualizador bloqueia), o botão fica sem número
// clique na estrela: comemoração na página (o GitHub abre em outra aba normalmente)
let celebrateOnReturn = false;
document.addEventListener("click", e => {
  const a = e.target.closest?.("a.star"); if (!a) return;
  try { localStorage.setItem("estrelou", "1"); } catch {}
  celebrateOnReturn = true;
  setTimeout(() => { if (celebrateOnReturn && !document.hidden) welcomeBack(); }, 1500);
});
document.addEventListener("visibilitychange", () => { if (!document.hidden && celebrateOnReturn) setTimeout(welcomeBack, 300); });
function welcomeBack() {
  celebrateOnReturn = false;
  document.querySelectorAll(".star-wrap").forEach(w => w.outerHTML = starWrap());
  const a = document.querySelector("a.star"); if (a) celebrate(a);
}
function celebrate(a) {
  a.classList.remove("pop"); void a.offsetWidth; a.classList.add("pop");
  const r = a.querySelector("span").getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 12; i++) {
    const sp = document.createElement("span"), ang = (i / 12) * 2 * Math.PI, d = 45 + Math.random() * 35;
    sp.className = "spark"; sp.textContent = "★";
    Object.assign(sp.style, { left: cx - 7 + "px", top: cy - 8 + "px" });
    sp.style.setProperty("--dx", Math.cos(ang) * d + "px"); sp.style.setProperty("--dy", Math.sin(ang) * d + "px");
    document.body.appendChild(sp); setTimeout(() => sp.remove(), 900);
  }
}

fetch(`https://api.github.com/repos/${REPO}`).then(r => r.ok ? r.json() : null).then(d => {
  if (!(d?.stargazers_count > 0)) return; // com 0 estrelas o botão fica sem número
  stars = d.stargazers_count;
  document.querySelectorAll("[data-stars]").forEach(el => el.textContent = stars);
}).catch(() => {});
