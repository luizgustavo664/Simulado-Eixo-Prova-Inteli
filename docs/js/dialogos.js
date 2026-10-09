// Diálogos: boas-vindas (só na primeira visita) e feedback enviado para o Google Forms.
const fbBtn = () => `<button class="theme" data-fb="">Feedback</button>`;

function welcome() {
  try { if (localStorage.getItem("boasVindas")) return; } catch {}
  const d = document.createElement("dialog");
  d.className = "welcome";
  d.setAttribute("aria-labelledby", "welcome-title");
  d.innerHTML = `
    <h2 id="welcome-title">Bem-vindo ao Simulado Eixo Prova 👋</h2>
    <p>Um simulador da prova de matemática e lógica do Inteli, com <b>questões reais</b> (2022.1 a 2025.1) e as regras do <b>edital 2027</b>.</p>
    <ul class="rules">
      <li><b>5 provas</b>, 2 delas <b>adaptativas</b> como a real</li>
      <li>Correção na hora, com gabarito e <b>resolução oficial</b></li>
      <li><b>Histórico</b> de notas e calculadora ENEM, SAT, ACT e IB</li>
      <li>Achou um erro ou tem uma ideia? Botão <b>Feedback</b> no topo, sem login</li>
    </ul>
    <p class="note">Faça como no dia: 2 horas, lugar tranquilo e só calculadora básica.</p>
    <p class="by">Criado por <a href="https://www.linkedin.com/in/luiz-cazelatto/" target="_blank" rel="noopener">Luiz Cazelatto</a>, de um aluno para futuros alunos. Se ajudar, deixa uma ⭐ no GitHub!</p>
    <button class="primary" id="welcome-ok" autofocus>Bora treinar!</button>`;
  // fecha pelo botão, clicando fora do cartão ou com Esc; a escolha fica salva para não aparecer de novo
  const done = () => { try { localStorage.setItem("boasVindas", "1"); } catch {} if (d.open) d.close(); d.remove(); };
  d.querySelector("#welcome-ok").onclick = done;
  d.addEventListener("click", e => { if (e.target === d) done(); });
  d.addEventListener("cancel", e => { e.preventDefault(); done(); });
  document.body.appendChild(d);
  d.showModal();
}

const FB_TIPOS = ["Sugestão", "Melhoria", "Erro em questão", "Bug"];
// Google Forms "Feedback · Simulado Eixo Prova": ids dos campos tirados do próprio formulário
const FB_FORM = { url: "https://docs.google.com/forms/d/e/1FAIpQLSeJvJi4_ECfUJO4B19YuZF9QtolHLzCV3ULQyutOfljrLfV9w", tipo: "entry.448938689", msg: "entry.1285465240", questao: "entry.274878571", disp: "entry.1436630446" };
document.addEventListener("click", e => { const b = e.target.closest?.("[data-fb]"); if (b) feedback(b.dataset.fb); });
function feedback(ctx) {
  const d = document.createElement("dialog");
  d.className = "welcome";
  d.setAttribute("aria-labelledby", "fb-title");
  d.innerHTML = `
    <h2 id="fb-title">${ctx ? "Reportar erro" : "Mande seu feedback"}</h2>
    <p>${ctx ? `<b>${ctx}</b>. Gabarito errado, imagem cortada, enunciado confuso: conte o que viu.` : "Sugestões, melhorias, erros ou bugs: tudo ajuda a deixar o simulado melhor."}</p>
    <form style="display:grid;gap:10px">
      <fieldset class="fb-tipos" aria-label="Tipo">${FB_TIPOS.map(t => `<label><input type="radio" name="tipo" value="${t}" ${t === (ctx ? "Erro em questão" : "Sugestão") ? "checked" : ""}>${t}</label>`).join("")}</fieldset>
      <textarea name="msg" required maxlength="2000" aria-label="Mensagem" placeholder="Escreva aqui"></textarea>
      <p class="by">Anônimo: não precisa de login. Vai junto só a questão (se houver), o tamanho da tela e o navegador, para ajudar a achar bugs.</p>
      <div class="fb-acts"><button type="button" data-close>Cancelar</button><button class="primary">Enviar</button></div>
    </form>`;
  const form = d.querySelector("form"), done = () => { if (d.open) d.close(); d.remove(); };
  form.onsubmit = async e => {
    e.preventDefault();
    const msg = form.msg.value.trim();
    if (!msg) return form.msg.focus();
    const data = new URLSearchParams({ [FB_FORM.tipo]: form.tipo.value, [FB_FORM.msg]: msg, [FB_FORM.questao]: ctx, [FB_FORM.disp]: `${innerWidth}×${innerHeight} · ${navigator.userAgent}` });
    form.querySelector(".primary").disabled = true;
    try {
      // no-cors: o Google não deixa ler a resposta, mas grava; só uma falha de rede cai no catch
      await fetch(`${FB_FORM.url}/formResponse`, { method: "POST", mode: "no-cors", body: data });
      d.innerHTML = `<h2 id="fb-title">Valeu pelo feedback! 💜</h2><p>Recebido. Cada sugestão ajuda os próximos futuros Intelers.</p><button class="primary" data-close>Fechar</button>`;
    } catch {
      // sem conexão com o Google: abre o formulário já preenchido para enviar por lá
      window.open(`${FB_FORM.url}/viewform?usp=pp_url&${data}`, "_blank", "noopener");
      done(); return;
    }
    d.querySelector("[data-close]").onclick = done;
  };
  d.querySelector("[data-close]").onclick = done;
  d.addEventListener("click", e => { if (e.target === d) done(); });
  d.addEventListener("cancel", e => { e.preventDefault(); done(); });
  document.body.appendChild(d);
  d.showModal();
  form.msg.focus();
}
