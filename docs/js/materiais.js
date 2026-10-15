// Material de revisão da comunidade Wave (PDFs em docs/material/), ligado aos assuntos de assuntos.js.
//
// PADRÃO para adicionar material (depois, confira com: npm run material):
//   1. PDF em docs/material/ com o nome ficha-<n>-<temas-com-hifen>.pdf (ex.: ficha-6-estatistica.pdf)
//   2. Registre em FICHAS com o id f<n> (mesmo número do arquivo) e o nome "Ficha <n>"
//   3. Em MATERIAL, para cada assunto, indique a página onde a teoria começa: { f, p, t, wave? }
//      - o assunto tem de estar escrito igual ao de assuntos.js
//      - t: o que a página cobre (aparece ao passar o mouse); wave: aula e seção da Wave, se a ficha indicar
//   4. Ficha que não é de um assunto (fórmulas, estratégia) vai em GERAL, com um rótulo curto
// Assunto sem entrada em MATERIAL fica sem link. A ficha abre direto na página (#page=N).
//
// PUBLICAÇÃO: enquanto os PDFs estiverem fora do GitHub (ver .gitignore), os links só aparecem ao abrir o site no
// seu computador (arquivo local ou localhost); no site publicado ficam escondidos, para não dar erro 404.
// Para liberar: apague a linha de docs/material do .gitignore, suba os PDFs e troque MATERIAL_PUBLICO para true.
const MATERIAL_PUBLICO = false;
const materialOn = () => MATERIAL_PUBLICO || (typeof location !== "undefined"
  && (location.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)));

const FICHAS = {
  f1: { nome: "Ficha 1", arq: "material/ficha-1-porcentagem-papg-geometria.pdf" },
  f2: { nome: "Ficha 2", arq: "material/ficha-2-algebra-funcoes-conjuntos.pdf" },
  f3: { nome: "Ficha 3", arq: "material/ficha-3-probabilidade-combinatoria-analitica.pdf" },
  f4: { nome: "Ficha 4", arq: "material/ficha-4-revisao-simulado-correcao.pdf" },
  f5: { nome: "Ficha 5", arq: "material/ficha-5-revisao-leve-estrategia.pdf" },
};
const MATERIAL = {
  "Aritmética": [{ f: "f1", p: 1, t: "Porcentagem, variação e erro" }],
  "Álgebra": [{ f: "f2", p: 1, t: "Equações e sistemas" }],
  "Conjuntos": [{ f: "f2", p: 3, t: "Conjuntos, Venn e inclusão-exclusão" }],
  "Funções": [{ f: "f2", p: 2, t: "Função afim e quadrática", wave: "Aula 2, seções 1 e 2" }],
  "Sequências": [{ f: "f1", p: 2, t: "PA e PG", wave: "Aula 2, seção 4" }],
  "Matrizes e sistemas": [{ f: "f2", p: 1, t: "Equações e sistemas (a ficha não cobre matrizes)", wave: "Aula 5, seção 3 (Sistemas lineares)" }],
  "Combinatória": [{ f: "f3", p: 2, t: "Combinatória", wave: "Aula 3, seção 1" }],
  "Probabilidade": [{ f: "f3", p: 1, t: "Probabilidade", wave: "Aula 3, seção 2" }],
  "Geometria plana": [{ f: "f1", p: 3, t: "Pitágoras, áreas, setor e semelhança", wave: "Aula 4" }],
  "Geometria analítica e vetores": [{ f: "f3", p: 3, t: "Distância, reta e área do triângulo", wave: "Aula 5, seção 2 (Determinantes)" }],
  "Raciocínio lógico": [{ f: "f2", p: 3, t: "Lógica: contrapositiva e negação" }],
  // sem ficha ainda: Estatística, Geometria espacial e Trigonometria (nenhum dos PDFs trata deles)
};
const GERAL = [
  { f: "f4", p: 1, rotulo: "Folha de fórmulas", t: "Fórmulas de cada assunto e autoavaliação" },
  { f: "f5", p: 1, rotulo: "Estratégia de prova", t: "Fórmulas de última hora e estratégia de prova" },
];

const hrefFicha = m => `${FICHAS[m.f].arq}#page=${m.p}`;
const abrirFicha = (m, texto) => `<a class="ficha" href="${hrefFicha(m)}" target="_blank" rel="noopener" title="${m.t}${m.wave ? ` · Wave: ${m.wave}` : ""}">${texto} ↗</a>`;
// link(s) de um assunto para a ficha, em HTML; vazio se não houver material ou se ainda não for público
const linkFicha = a => materialOn() ? (MATERIAL[a] || []).map(m => abrirFicha(m, FICHAS[m.f].nome)).join("") : "";
// fichas que valem para qualquer assunto (fórmulas, estratégia), em HTML; vazio se ainda não for público
const linkGeral = () => materialOn() ? `<p class="note">Material geral:${GERAL.map(m => abrirFicha(m, m.rotulo)).join("")}</p>` : "";

// confere o mapa: todo assunto existe em assuntos.js e toda ficha citada está registrada
for (const [a, ms] of Object.entries(MATERIAL)) {
  console.assert(ASSUNTOS[a], "assunto sem questões em assuntos.js", a);
  for (const m of ms) console.assert(FICHAS[m.f] && m.p >= 1, "ficha inválida", a, m);
}
for (const m of GERAL) console.assert(FICHAS[m.f] && m.p >= 1 && m.rotulo, "ficha geral inválida", m);
