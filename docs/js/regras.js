// Regras da prova: provas disponíveis, pontuação, correção de cada bloco e equivalência ENEM/SAT/ACT/IB. Sem DOM.
const PROVAS = [
  { id: "2025.1", adapt: true, desc: "Adaptativa · prova de 27/10/2024" },
  { id: "2024.1", adapt: true, desc: "Adaptativa · prova de 22/10/2023" },
  { id: "2023.1", adapt: false, desc: "24 questões fixas" },
  { id: "2022.2", adapt: false, desc: "24 questões fixas · com resolução" },
  { id: "2022.1", adapt: false, desc: "24 questões fixas" },
];
const SIZES = [8, 6, 6, 4], DURATION = 120 * 60e3, L = "ABCDE";
// Pontos por questão no nível mais alto de cada bloco: o bloco 1 (o mais fácil) vale mais e o peso cai a cada bloco;
// cada nível abaixo vale 15% menos. Máximo = 7×6 + 5×5 + 5×4,2 + 3×4 = 100.
// ponytail: valores estimados, o edital não publica os reais. Provas clássicas usam a regra da época: 5 pontos por questão.
const BASE = [6, 5, 4.2, 4];

const pool = (p, b, lv) => BANK.filter(q => q.prova === p && q.b === b && q.lv === lv);
const nLevels = (p, b) => new Set(BANK.filter(q => q.prova === p && q.b === b).map(q => q.lv)).size;
const prova = id => PROVAS.find(p => p.id === id);
function points(p, b, lv) {
  if (!prova(p).adapt) return 5;
  return b === 0 ? BASE[0] : +(BASE[b] * (1 - 0.15 * (nLevels(p, b) - 1 - lv))).toFixed(2);
}
// edital 5.1.1: a questão descartada fica fora da correção; sem descarte, 1 questão respondida corretamente é
// desconsiderada (penalidade). Descartes a mais e questões em branco contam como erro. A plataforma não impede nada.
function grade(qs, ans, disc) {
  let excl = disc.length ? disc[0] : qs.findIndex((q, i) => ans[i] === q.ans);
  const penalty = !disc.length && excl >= 0;
  if (excl < 0) excl = qs.length - 1;
  let c = 0, n = 0;
  qs.forEach((q, i) => { if (i === excl) return; n++; if (!disc.includes(i) && ans[i] === q.ans) c++; });
  return { c, n, up: c * 2 > n, excl, penalty }; // acertar mais que a metade sobe de trilha
}
// confere o banco: cada nível de cada bloco tem o tamanho certo, e a pontuação máxima é 100
for (const p of PROVAS) for (let b = 0; b < 4; b++) for (let lv = 0; lv < nLevels(p.id, b); lv++)
  console.assert(pool(p.id, b, lv).length === SIZES[b], "tamanho do bloco", p.id, b, lv);
for (const p of PROVAS) console.assert(Math.round(SIZES.reduce((a, n, b) => a + (n - 1) * points(p.id, b, b ? nLevels(p.id, b) - 1 : 0), 0)) === 100, "máximo 100", p.id);
const Q3 = [{ans:0},{ans:1},{ans:2}];
console.assert(grade(Q3, {0:0,1:1}, [2]).up && !grade(Q3, {0:0}, [2]).up, "roteamento");
console.assert(grade(Q3, {0:0,1:1,2:2}, []).c === 2 && grade(Q3, {0:0,1:1,2:2}, []).penalty, "sem descarte perde 1 acerto");
console.assert(grade(Q3, {0:0,1:1,2:2}, [2,1]).c === 1, "descarte a mais conta como erro");

// edital 2027, itens 8.3.1 a 8.3.3: notas que substituem o Eixo Prova e a equivalência em acertos (10 a 15)
const EXAMES = {
  enem: { nome: "ENEM", campo: "Matemática e suas Tecnologias", anos: "2024 ou 2025", min: 770, passo: 32, max: 962, dec: true, ex: "812,4" },
  sat: { nome: "SAT", campo: "SAT Math", anos: "2025 ou 2026", min: 690, passo: 18, max: 800, ex: "730" },
  act: { nome: "ACT", campo: "ACT Math", anos: "2025 ou 2026", min: 31, passo: 1, max: 36, ex: "33" },
  ib: { nome: "IB", campo: "Math (Analysis and Approaches ou Applications and Interpretations)", anos: "2025 ou 2026",
        ib: { SL: { nome: "Standard", notas: { 6: 10, 7: 12 } }, HL: { nome: "Higher", notas: { 5: 10, 6: 12, 7: 14 } } } },
};
const ibAcertos = (nivel, nota) => EXAMES.ib.ib[nivel].notas[nota] ?? null;
console.assert(ibAcertos("SL", 5) === null && ibAcertos("SL", 6) === 10 && ibAcertos("SL", 7) === 12
  && ibAcertos("HL", 4) === null && ibAcertos("HL", 5) === 10 && ibAcertos("HL", 6) === 12 && ibAcertos("HL", 7) === 14, "equivalência IB");
const acertosEquiv = (e, nota) => nota < e.min ? null : Math.min(15, 10 + Math.floor((nota - e.min) / e.passo));
const faixa = (e, a) => {
  const de = e.min + (a - 10) * e.passo, ate = a < 15 ? de + e.passo - (e.dec ? 0.1 : 1) : e.max;
  return de === ate ? String(de) : `${de} a ${String(+ate.toFixed(1)).replace(".", ",")}`;
};
{ const { enem, sat, act } = EXAMES, t = acertosEquiv;
  console.assert(t(enem, 769.9) === null && t(enem, 770) === 10 && t(enem, 801.9) === 10 && t(enem, 802) === 11 && t(enem, 930) === 15
    && t(sat, 680) === null && t(sat, 690) === 10 && t(sat, 707) === 10 && t(sat, 708) === 11 && t(sat, 780) === 15 && t(sat, 800) === 15
    && t(act, 30) === null && t(act, 31) === 10 && t(act, 34) === 13 && t(act, 36) === 15, "equivalências"); }

const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
