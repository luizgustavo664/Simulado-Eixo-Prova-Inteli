// Material de revisão da Wave 2026.
// Os PDFs originais do Classroom ficam em docs/material/.
// Cada assunto abre o PDF completo da aula correspondente.

const MATERIAL_PUBLICO = false;

const materialOn = () => MATERIAL_PUBLICO || (
  typeof location !== "undefined" &&
  (
    location.protocol === "file:" ||
    ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
  )
);

const FICHAS = {
  f1: {
    nome: "Aula 1",
    arq: "material/Eixo Prova 2026 - Autoestudos - Aula 1.pdf"
  },
  f2: {
    nome: "Aula 2",
    arq: "material/Autoestudos - Aula 2_ Modelagem com Funções - Autoestudos_Aula2_Modelagem_com_Funcoes.pdf"
  },
  f3: {
    nome: "Aula 3",
    arq: "material/Aula 3 - Autoestudo - Análise Combinatória e Probabilidade - Aula3_Autoestudo_Combinatoria_Probabilidade.pdf"
  },
  f4: {
    nome: "Aula 4",
    arq: "material/Aula 4 — Autoestudo — Eixo Prova Wave 2026 - Aula4_Autoestudo_corrigido.pdf"
  },
  f5: {
    nome: "Aula 5",
    arq: "material/Autoestudos da Aula 5 — Wave 2026 - Aula5_Autoestudos_Wave2026.pdf"
  }
};

// Associa os assuntos de assuntos.js às aulas da Wave.
// Não há mapeamento de páginas: cada link abre o PDF inteiro.
const MATERIAL = {
  // L1 — Aritmética, proporção e lógica
  "Aritmética": [
    { f: "f1", t: "Regra de três, percentuais, juros e séries temporais" }
  ],
  "Conjuntos": [
    { f: "f1", t: "Diagramas de Venn e inclusão-exclusão" }
  ],
  "Raciocínio lógico": [
    { f: "f1", t: "Lógica proposicional e dedução" }
  ],

  // L2 — Modelagem com funções
  "Funções": [
    { f: "f2", t: "Funções afim, quadrática e exponencial; modelagem" }
  ],
  "Sequências": [
    { f: "f2", t: "Progressões aritméticas e geométricas" }
  ],

  // L3 — Análise combinatória e probabilidade
  "Combinatória": [
    { f: "f3", t: "Análise combinatória" }
  ],
  "Probabilidade": [
    { f: "f3", t: "Probabilidade" }
  ],
  "Estatística": [
    { f: "f3", t: "Média, mediana e moda" }
  ],

  // L4 — Geometria e trigonometria
  "Geometria plana": [
    { f: "f4", t: "Geometria plana" }
  ],
  "Geometria espacial": [
    { f: "f4", t: "Geometria espacial" }
  ],
  "Trigonometria": [
    { f: "f4", t: "Trigonometria" }
  ],

  // L5 — Matrizes, determinantes e sistemas
  "Matrizes e sistemas": [
    { f: "f5", t: "Matrizes, determinantes, sistemas lineares e bases numéricas" }
  ]
};

// Links de material complementar que se aplicam a todos os assuntos.
// Os materiais antigos de fórmulas e estratégia não fazem parte do novo catálogo.
const GERAL = [];

const hrefFicha = m => encodeURI(FICHAS[m.f].arq);

const abrirFicha = (m, texto) =>
  `<a class="ficha" href="${hrefFicha(m)}" target="_blank" rel="noopener" title="${m.t}">${texto} ↗</a>`;

const linkFicha = a => materialOn()
  ? (MATERIAL[a] || []).map(m => abrirFicha(m, FICHAS[m.f].nome)).join("")
  : "";

const linkGeral = () => materialOn() && GERAL.length
  ? `<p class="note">Material geral:${GERAL.map(m => abrirFicha(m, m.rotulo)).join("")}</p>`
  : "";

// Confere as associações durante a execução no navegador.
for (const [a, ms] of Object.entries(MATERIAL)) {
  console.assert(ASSUNTOS[a], "Assunto sem questões em assuntos.js", a);
  for (const m of ms) {
    console.assert(FICHAS[m.f] && m.t, "Material inválido", a, m);
  }
}