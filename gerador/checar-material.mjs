
import fs from "node:fs";
import vm from "node:vm";

const DOCS = new URL("../docs/", import.meta.url);
const ler = arquivo =>
  fs.readFileSync(new URL(arquivo, DOCS), "utf8");

const ctx = vm.createContext({
  console: { assert() {} }
});

vm.runInContext(
  ler("js/assuntos.js") +
  "\n" +
  ler("js/materiais.js") +
  "\nthis.out = { ASSUNTOS, FICHAS, MATERIAL, GERAL };",
  ctx
);

const { ASSUNTOS, FICHAS, MATERIAL, GERAL } = ctx.out;

let erros = 0;
const erro = mensagem => {
  console.error("✗ " + mensagem);
  erros++;
};

const aviso = mensagem => console.warn("! " + mensagem);

const ids = new Set();

for (const [id, ficha] of Object.entries(FICHAS)) {
  if (!/^f\d+$/.test(id)) {
    erro(`ID inválido: ${id}`);
    continue;
  }

  if (ids.has(id)) {
    erro(`ID duplicado: ${id}`);
  }
  ids.add(id);

  if (!ficha.nome || !ficha.arq) {
    erro(`${id}: falta nome ou caminho do arquivo`);
    continue;
  }

  if (!ficha.arq.startsWith("material/") ||
      !ficha.arq.endsWith(".pdf")) {
    erro(`${id}: caminho inválido (${ficha.arq})`);
    continue;
  }

  const arquivo = new URL(ficha.arq, DOCS);

  if (!fs.existsSync(arquivo)) {
    erro(`${id}: PDF não encontrado (docs/${ficha.arq})`);
  }
}

const confere = (onde, material) => {
  if (!FICHAS[material.f]) {
    erro(`${onde}: aula "${material.f}" não existe em FICHAS`);
    return;
  }

  if (!material.t || !material.t.trim()) {
    erro(`${onde}: falta descrição do conteúdo (t)`);
  }
};

for (const [assunto, materiais] of Object.entries(MATERIAL)) {
  if (!ASSUNTOS[assunto]) {
    erro(`"${assunto}" não existe em assuntos.js`);
  }

  if (!Array.isArray(materiais)) {
    erro(`"${assunto}": os materiais precisam estar em uma lista`);
    continue;
  }

  materiais.forEach(material => confere(assunto, material));
}

GERAL.forEach((material, i) => {
  confere(`GERAL[${i}]`, material);

  if (!material.rotulo) {
    erro(`GERAL[${i}]: falta rótulo`);
  }
});

const pasta = new URL("material/", DOCS);
const usados = new Set(
  Object.values(FICHAS).map(ficha => ficha.arq.slice("material/".length))
);

if (fs.existsSync(pasta)) {
  for (const nome of fs.readdirSync(pasta).filter(n => n.endsWith(".pdf"))) {
    if (!usados.has(nome)) {
      aviso(`docs/material/${nome} não está registrado em FICHAS`);
    }
  }
} else {
  erro("A pasta docs/material/ não existe");
}

const sem = Object.keys(ASSUNTOS).filter(assunto => !MATERIAL[assunto]);

if (sem.length) {
  console.log(`Assuntos sem material associado (${sem.length}): ${sem.join(", ")}`);
}

console.log(
  erros
    ? `${erros} erro(s) encontrado(s)`
    : `Material ok: ${Object.keys(FICHAS).length} PDFs, ` +
      `${Object.keys(MATERIAL).length} assuntos com link, ` +
      `${sem.length} assuntos sem material`
);

process.exit(erros ? 1 : 0);
