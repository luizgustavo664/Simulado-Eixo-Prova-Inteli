# Simulado Eixo Prova

Simulado **não oficial** do Eixo Prova do processo seletivo de graduação do [Inteli](https://www.inteli.edu.br), montado com as questões dos cadernos de prova de 2022.1 a 2025.1 e com as regras do [edital 2027](https://web.inteli.edu.br/hubfs/Gradua%C3%A7%C3%A3o/2027_Edital_Processo_Seletivo_Gradua%C3%A7%C3%A3o_Inteli.pdf).

Não tem relação com o Inteli. A pontuação é uma estimativa: o edital diz quem pesa mais, mas não publica os valores.

## Como usar

Abra `docs/index.html` no navegador. É uma página estática, sem servidor nem instalação. O histórico de tentativas fica salvo no próprio navegador.

Para publicar no GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / `docs`**.

## O que tem

- **186 questões reais** de 5 provas, recortadas dos PDFs como imagem para fórmulas e figuras ficarem iguais ao original.
- **Provas 2024.1 e 2025.1 adaptativas**: 4 blocos (8, 6, 6 e 4 questões); acertar mais da metade de um bloco leva a uma trilha mais difícil. Os níveis de cada bloco seguem a ordem dos cadernos oficiais.
- **Provas 2022.1, 2022.2 e 2023.1** com as 24 questões fixas da época; nelas dá para voltar entre os blocos.
- **Regras do edital**: descarte de 1 questão por bloco (sem descarte, 1 acerto é desconsiderado), 120 minutos, contagem de saídas da tela, prova retomada se a página for atualizada.
- **Resultado e revisão** com gabarito e, quando o caderno traz, a resolução oficial (2022.2, 2024.1 e 2025.1).
- **Histórico de notas** e **calculadora de equivalência** do ENEM, SAT, ACT e IB (edital, item 8.3).

## Estrutura

```
docs/                    site pronto (é o que vai para o ar)
  index.html             página com o banco de questões embutido
  img/                   recortes: <id>.png (questão) e <id>s.png (resolução)
gerador/
  gerar-banco.mjs        lê os PDFs, recorta as questões e monta docs/
  simulado.tpl.html      modelo da página (HTML, CSS e JS do simulado)
provas/                  PDFs originais (fora do git, ver .gitignore)
```

## Como regerar o site

Precisa de [Node.js](https://nodejs.org) 18 ou mais novo.

1. Coloque os PDFs em `provas/` com estes nomes: `2022.1.pdf` (traz 2022.1, 2022.2 e 2023 juntos), `2022.2.pdf` (2022.2 com resoluções), `2024.1.pdf` e `Gabarito-Final-Prova-PS-2025.1-3.pdf`.
2. Rode:

```bash
npm install
```

```bash
npm run build
```

Para mudar só a página (estilo, regras, textos), edite `gerador/simulado.tpl.html` e rode o build de novo.

### Como o banco é montado

- **Recorte**: cada questão vira um PNG do trecho do PDF entre o início do enunciado e a última alternativa. A posição de cada alternativa é guardada para desenhar as letras A–E por cima.
- **Gabarito**: 2022 e 2023 trazem "ALTERNATIVA CORRETA" no PDF. Em 2024.1 a resposta vem do "Gabarito:" do caderno. Em 2025.1 vem das resoluções, conferida com o destaque amarelo que o caderno põe na alternativa certa (o destaque é apagado das imagens).
- **Ajustes manuais** em `gerar-banco.mjs`: o `layout` de páginas de cada prova adaptativa (qual questão é de qual bloco e nível), as posições das alternativas que o recorte automático não acha (`OVERRIDE`) e os gabaritos de 2024.1 e 2025.1 (`ANS`). Um caderno novo precisa desses três ajustes.

## Observações

- Em 2024.1, o 4º nível do bloco 4 tem só 2 questões no caderno e ficou de fora.
- Erros encontrados nos cadernos oficiais (as respostas não mudam): na resolução da questão de índice de ações de 2025.1 (bloco 3, nível 1) aparece x = ±√2 onde o certo é x = ±2; no enunciado do robô na cratera de 2025.1 (bloco 3, nível 2) está x = −2 + 5t, quando o certo é x = −2 + Vₓt.
- As questões, resoluções e PDFs são do Inteli. Este projeto só os reorganiza para estudo.
