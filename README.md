# Simulado Eixo Prova

Simulado **não oficial** do Eixo Prova do processo seletivo de graduação do [Inteli](https://www.inteli.edu.br), montado com as questões dos cadernos de prova de 2022.1 a 2025.1 e com as regras do [edital 2027](https://web.inteli.edu.br/hubfs/Gradua%C3%A7%C3%A3o/2027_Edital_Processo_Seletivo_Gradua%C3%A7%C3%A3o_Inteli.pdf).

Não tem relação com o Inteli. A pontuação é uma estimativa: o edital diz quem pesa mais, mas não publica os valores.

## Como usar

Abra `docs/index.html` no navegador. É uma página estática, sem servidor nem instalação. O histórico de tentativas fica salvo no próprio navegador.

Para publicar no GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / `docs`**.

### Manutenção

Para subir mudanças na `main` sem liberar o site ainda, ligue o aviso de manutenção no topo de `docs/js/app.js`:

~~~js
const MANUTENCAO = "hoje às 18:00"; // texto da volta; null libera o site
~~~

Com ele ligado, o site mostra só o aviso. Para testar a versão publicada antes de liberar, abra a URL com `?preview` no fim. Para liberar, troque a linha para `null` e faça o commit (dá pelo editor do próprio GitHub); o site atualiza em cerca de 1 minuto.

### Aviso de novidades

Quem já visitou o site vê, uma vez, um aviso com as novidades da versão. Para uma nova atualização, suba `VERSAO` em `docs/js/dialogos.js` (o rodapé usa o mesmo número) e troque a lista em `novidades()`. Quem chega pela primeira vez vê só as boas-vindas.

## O que tem

- **186 questões reais** de 5 provas, recortadas dos PDFs como imagem para fórmulas e figuras ficarem iguais ao original.
- **Provas 2024.1 e 2025.1 adaptativas**: 4 blocos (8, 6, 6 e 4 questões); acertar mais da metade de um bloco leva a uma trilha mais difícil. Os níveis de cada bloco seguem a ordem dos cadernos oficiais.
- **Provas 2022.1, 2022.2 e 2023.1** com as 24 questões fixas da época; nelas dá para voltar entre os blocos.
- **Outros formatos**: *Meia prova* (12 questões sorteadas de todas as provas, 4/3/3/2, 60 min) e *Meus erros* (24 questões com as que você mais errou em cada bloco, completando com inéditas). Mesmas regras, sem trilha; cada questão vale o mesmo.
- **Regras do edital**: descarte de 1 questão por bloco (sem descarte, 1 acerto é desconsiderado), 120 minutos, contagem de saídas da tela, prova retomada se a página for atualizada.
- **Assuntos**: cada questão tem um assunto do edital (14, em `docs/js/assuntos.js`). O resultado mostra os assuntos em que você errou, e a tela inicial, os que você mais erra no histórico.
- **Resultado e revisão** no formato de folha corrigida: desempenho por bloco, questões recolhíveis com o assunto de cada uma, gabarito e, quando o caderno traz, a resolução oficial (2022.2, 2024.1 e 2025.1).
- **Assuntos para revisar**, em ordem de prioridade com os erros e acertos de cada um, e **Onde você mais erra** na tela inicial, com atalho para o Meus erros.
- **Materiais de revisão da Wave 2026**: os assuntos contemplados pelas aulas têm links para os PDFs completos correspondentes. Os links aparecem localmente (arquivo ou `localhost`), pois os PDFs ficam fora do GitHub por enquanto. O catálogo associa os assuntos às aulas, sem direcionamento para páginas específicas.
- **Histórico de notas** em cartões (cada tentativa reabre a correção completa, salva no navegador) e **calculadora de equivalência** do ENEM, SAT, ACT e IB (edital, item 8.3).

## Estrutura

~~~text
docs/                    site (é o que vai para o ar)
  index.html              página: só a estrutura e a ordem dos scripts
  css/style.css           estilos (tema claro/escuro, prova, resultado, diálogos)
  js/banco.js             banco de questões, gerado pelo build (não edite à mão)
  js/assuntos.js          assunto de cada questão (marcado à mão; questão nova no banco precisa entrar aqui)
  js/regras.js            provas, pontuação, correção e equivalência ENEM/SAT/ACT/IB
  js/materiais.js         associa os assuntos às aulas da Wave e aos PDFs completos
  js/estrela.js           botão de estrela do GitHub e mascote
  js/dialogos.js          boas-vindas e feedback
  js/app.js               telas: início, instruções, prova e resultado
  material/               PDFs de autoestudo da Wave (fora do git por enquanto)
  img/                    recortes: <id>.png (questão) e <id>s.png (resolução), gerados pelo build
gerador/
  gerar-banco.mjs         lê os PDFs, recorta as questões e gera docs/img e docs/js/banco.js
  checar-material.mjs     confere PDFs cadastrados, caminhos e assuntos (npm run material)
provas/                   PDFs originais (fora do git, ver .gitignore)
~~~

## Como regerar o site

Precisa de [Node.js](https://nodejs.org) 18 ou mais novo.

1. Coloque os PDFs em `provas/` com estes nomes: `2022.1.pdf` (traz 2022.1, 2022.2 e 2023 juntos), `2022.2.pdf` (2022.2 com resoluções), `2024.1.pdf` e `Gabarito-Final-Prova-PS-2025.1-3.pdf`.
2. Rode:

~~~bash
npm install
~~~

~~~bash
npm run build
~~~

Para mudar só a página (estilo, regras, textos), edite os arquivos de `docs/` direto: não precisa de build. O build só é necessário quando os PDFs ou os ajustes do banco mudam.

Os scripts são comuns (não módulos ES) para a página abrir direto do arquivo, sem servidor. Eles compartilham variáveis globais, então a ordem em `index.html` importa: `banco.js` → `regras.js` → `estrela.js` → `dialogos.js` → `app.js`.

### Como o banco é montado

- **Recorte**: cada questão vira um PNG do trecho do PDF entre o início do enunciado e a última alternativa. A posição de cada alternativa é guardada para desenhar as letras A–E por cima.
- **Gabarito**: 2022 e 2023 trazem "ALTERNATIVA CORRETA" no PDF. Em 2024.1 a resposta vem do "Gabarito:" do caderno. Em 2025.1 vem das resoluções, conferida com o destaque amarelo que o caderno põe na alternativa certa (o destaque é apagado das imagens).
- **Ajustes manuais** em `gerar-banco.mjs`: o `layout` de páginas de cada prova adaptativa (qual questão é de qual bloco e nível), as posições das alternativas que o recorte automático não acha (`OVERRIDE`) e os gabaritos de 2024.1 e 2025.1 (`ANS`). Um caderno novo precisa desses três ajustes.

## Material de revisão (Wave 2026)

Os PDFs de autoestudo da Wave ficam em `docs/material/` e **não vão para o GitHub por enquanto**, pois ainda não foi confirmada a autorização para publicá-los. Os links aparecem apenas ao abrir o site localmente (arquivo ou `localhost`); no site publicado ficam ocultos para evitar links quebrados.

O catálogo está em `docs/js/materiais.js` e associa os assuntos de `docs/js/assuntos.js` às aulas correspondentes. Cada link abre o **PDF completo da aula**, sem direcionamento para uma página específica.

### Como adicionar ou atualizar materiais

1. Coloque os PDFs em `docs/material/`.
2. Registre cada arquivo em `FICHAS`, com um identificador, nome e caminho relativo dentro de `docs/`.
3. Em `MATERIAL`, associe os assuntos aos PDFs correspondentes. Os nomes dos assuntos devem ser idênticos aos de `assuntos.js`. Cada associação contém o identificador da aula (`f`) e uma descrição do conteúdo (`t`).
4. Rode `npm run material` para conferir se os PDFs existem, se os caminhos estão corretos e se os assuntos cadastrados são válidos. O comando também avisa sobre PDFs presentes na pasta que não estejam registrados no catálogo.

Para disponibilizar os PDFs no site publicado, confirme primeiro a autorização para publicação. Depois, será necessário rever a regra de exclusão no `.gitignore`, incluir os arquivos no Git e ajustar `MATERIAL_PUBLICO` para `true` em `docs/js/materiais.js`.

## Observações

- As fichas são material da comunidade Wave; os créditos são dos autores.
- Em 2024.1, o 4º nível do bloco 4 tem só 2 questões no caderno e ficou de fora.
- Erros encontrados nos cadernos oficiais (as respostas não mudam): na resolução da questão de índice de ações de 2025.1 (bloco 3, nível 1) aparece x = ±√2 onde o certo é x = ±2; no enunciado do robô na cratera de 2025.1 (bloco 3, nível 2) está x = −2 + 5t, quando o certo é x = −2 + Vₓt.
- As questões, resoluções e PDFs são do Inteli. Este projeto só os reorganiza para estudo.