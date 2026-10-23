---
name: Habitare
description: Gestão de condomínio na língua das placas do prédio — local, pictograma e faixa de status em cada pedido.
colors:
  hab-laranja: "#f47920"
  hab-laranja-hover: "#ff8a33"
  hab-laranja-borda: "#e06a12"
  hab-laranja-texto: "#c2410c"
  hab-laranja-claro: "#fff1e6"
  hab-tinta: "#121417"
  hab-aluminio: "#edeef0"
  hab-placa: "#ffffff"
  hab-linha: "#d6d8dc"
  hab-linha-forte: "#b9bdc4"
  hab-texto-2: "#464c56"
  hab-texto-3: "#6b7079"
  menu-texto: "#a3a9b3"
  placeholder: "#8a9099"
  st-aberta: "#dc2626"
  st-analise: "#1d4ed8"
  st-andamento: "#f59e0b"
  st-resolvida: "#047857"
  st-aberta-texto: "#b91c1c"
  st-aberta-fundo: "#fee2e2"
  st-aberta-borda: "#fecaca"
  st-analise-fundo: "#dbeafe"
  st-analise-borda: "#bfdbfe"
  st-andamento-texto: "#92400e"
  st-andamento-fundo: "#fef3c7"
  st-andamento-borda: "#fde68a"
  st-resolvida-fundo: "#d1fae5"
  st-resolvida-borda: "#a7f3d0"
typography:
  display-status:
    fontFamily: "Poppins, 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "'tnum'"
  display-numeral:
    fontFamily: "Poppins, 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.03em"
    fontFeature: "'tnum'"
  display-login:
    fontFamily: "Poppins, 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 700
  headline:
    fontFamily: "Poppins, 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    letterSpacing: "-0.015em"
  title-local:
    fontFamily: "Poppins, 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Poppins, 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  body-meta:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 400
  label-placa:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "0.64rem"
    fontWeight: 700
    letterSpacing: "0.12em"
  label-faixa:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "0.74rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  label-nav:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 500
  label-nav-inferior:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "0.66rem"
    fontWeight: 600
  label-chip:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 600
  button:
    fontFamily: "Poppins, 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 600
  input:
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    fontSize: "max(16px, 0.95rem)"
    fontWeight: 400
rounded:
  hab-raio-p: "8px"
  picto: "10px"
  hab-raio: "12px"
  janela: "14px"
  cartao-login: "16px"
  folha: "18px"
  pilula: "999px"
spacing:
  placa-x: "0.95rem"
  placa-y: "0.85rem"
  grade: "0.85rem"
  painel: "0.75rem"
  gutter-celular: "1rem"
  topo-desktop-x: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.hab-laranja}"
    textColor: "{colors.hab-tinta}"
    typography: "{typography.button}"
    rounded: "{rounded.hab-raio-p}"
    padding: "0.5rem 1.1rem"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.hab-laranja-hover}"
    textColor: "{colors.hab-tinta}"
  button-secondary:
    backgroundColor: "{colors.hab-placa}"
    textColor: "{colors.hab-tinta}"
    typography: "{typography.button}"
    rounded: "{rounded.hab-raio-p}"
    padding: "0.5rem 1.1rem"
    height: "40px"
  input:
    backgroundColor: "{colors.hab-placa}"
    textColor: "{colors.hab-tinta}"
    typography: "{typography.input}"
    rounded: "{rounded.hab-raio-p}"
  placa:
    backgroundColor: "{colors.hab-placa}"
    textColor: "{colors.hab-tinta}"
    rounded: "{rounded.hab-raio}"
    padding: "0.85rem 0.95rem"
  placa-picto:
    backgroundColor: "{colors.hab-tinta}"
    textColor: "{colors.hab-placa}"
    rounded: "{rounded.picto}"
    size: "44px"
  faixa-aberta:
    backgroundColor: "{colors.st-aberta}"
    textColor: "{colors.hab-placa}"
    typography: "{typography.label-faixa}"
    padding: "0.55rem 0.95rem"
  faixa-analise:
    backgroundColor: "{colors.st-analise}"
    textColor: "{colors.hab-placa}"
    typography: "{typography.label-faixa}"
    padding: "0.55rem 0.95rem"
  faixa-andamento:
    backgroundColor: "{colors.st-andamento}"
    textColor: "{colors.hab-tinta}"
    typography: "{typography.label-faixa}"
    padding: "0.55rem 0.95rem"
  faixa-resolvida:
    backgroundColor: "{colors.st-resolvida}"
    textColor: "{colors.hab-placa}"
    typography: "{typography.label-faixa}"
    padding: "0.55rem 0.95rem"
  faixa-neutra:
    backgroundColor: "{colors.hab-tinta}"
    textColor: "{colors.hab-placa}"
    typography: "{typography.label-faixa}"
    padding: "0.55rem 0.95rem"
  selo-aberta:
    backgroundColor: "{colors.st-aberta-fundo}"
    textColor: "{colors.st-aberta-texto}"
    rounded: "{rounded.pilula}"
  selo-analise:
    backgroundColor: "{colors.st-analise-fundo}"
    textColor: "{colors.st-analise}"
    rounded: "{rounded.pilula}"
  selo-andamento:
    backgroundColor: "{colors.st-andamento-fundo}"
    textColor: "{colors.st-andamento-texto}"
    rounded: "{rounded.pilula}"
  selo-resolvida:
    backgroundColor: "{colors.st-resolvida-fundo}"
    textColor: "{colors.st-resolvida}"
    rounded: "{rounded.pilula}"
  chip-filtro:
    backgroundColor: "{colors.hab-placa}"
    textColor: "{colors.hab-texto-2}"
    typography: "{typography.label-chip}"
    rounded: "{rounded.pilula}"
    padding: "0.4rem 0.9rem"
  chip-filtro-ativo:
    backgroundColor: "{colors.hab-tinta}"
    textColor: "{colors.hab-placa}"
  aba-ativa:
    backgroundColor: "{colors.hab-tinta}"
    textColor: "{colors.hab-placa}"
    rounded: "{rounded.hab-raio-p}"
    padding: "0.5rem 0.9rem"
  menu-lateral:
    backgroundColor: "{colors.hab-tinta}"
    textColor: "{colors.menu-texto}"
  nav-item-ativo:
    backgroundColor: "{colors.hab-laranja}"
    textColor: "{colors.hab-tinta}"
    typography: "{typography.label-nav}"
    rounded: "{rounded.hab-raio-p}"
    padding: "0.6rem 0.7rem"
  nav-inferior:
    backgroundColor: "{colors.hab-placa}"
    textColor: "{colors.hab-texto-3}"
    typography: "{typography.label-nav-inferior}"
  nav-inferior-ativo:
    textColor: "{colors.hab-tinta}"
  nav-inferior-acao:
    backgroundColor: "{colors.hab-laranja}"
    textColor: "{colors.hab-tinta}"
    rounded: "9px"
    width: "44px"
    height: "30px"
---

# Design System: Habitare

## Overview

**Creative North Star: "Sinalização Predial"**

O Habitare fala a língua das placas do próprio prédio. Cada pedido é identificado do jeito que o prédio identifica seus lugares: uma placa branca com o rótulo "Local" e o lugar por extenso em letra grossa, um pictograma do serviço num quadro preto e, no pé, a faixa de status como a faixa colorida de uma placa. Quem abre a tela reconhece num relance onde é o problema, de que serviço é e em que etapa está; depois age com o controle que fica sempre no mesmo lugar.

O material é de prédio: fundo de alumínio anodizado com um pontilhado discreto e parado, placas brancas recortadas por filetes de 1px, preto de placa na moldura (menu, topo do celular, pictogramas, numerais) e um único laranja — o da marca — para a marca, a ação principal e o que "precisa de você". As cores de status são fixas e conversam com a faixa, nunca com o perfil. Telas internas são simples, densas o bastante para triagem e rápidas; o login pode ter mais presença (painel preto pontilhado com a logo acesa), mas é o mesmo mundo.

O celular de 390px é o app (o Android é este mesmo React via Capacitor): barra de navegação inferior, áreas seguras do entalhe e da barra de gestos, alvos de toque de 40px ou mais e campos com 16px. O movimento é calmo e barato: só opacity e transform. A interface recusa o padrão da categoria — cartões brancos idênticos com pílulas pastel e uma cor de destaque por perfil.

**Key Characteristics:**
- Placa da ocorrência: rótulo "Local" + local por extenso, pictograma em quadro preto, título, descrição e faixa de status no pé.
- Um laranja só (#f47920) para todos os perfis; texto laranja sobre branco usa #c2410c.
- Status com cor fixa: Aberta vermelho, Em Análise azul, Em Andamento âmbar, Concluída verde.
- Filetes de 1px separam; sem sombras como separador, sem faixas coloridas laterais.
- Moldura preta (menu lateral no computador, topo preto no celular) sobre fundo de alumínio pontilhado.
- Poppins para títulos, placas e números; Plus Jakarta Sans para leitura e campos.
- Movimento só com opacity/transform, sempre respeitando prefers-reduced-motion.

## Colors

Paleta de sinalização: alumínio, branco e preto de placa como estrutura, um laranja de marca e quatro cores de status que nunca mudam de sentido.

### Primary
- **Laranja Habitare** (#f47920): a única cor de marca, igual para todos os perfis. Preenche o botão principal, o item ativo do menu lateral, a ação "Nova" da barra inferior, o avatar do menu, o anel de foco e o indicador do item ativo da barra inferior. Sobre ele o texto é sempre o preto de placa (#121417), nunca branco.
- **Laranja Aceso** (#ff8a33): o mesmo botão sob o cursor. Só no hover de preenchimentos laranja.
- **Filete do Laranja** (#e06a12): a borda de 1px dos botões laranja, para o preenchimento não "vazar" no alumínio.
- **Laranja de Letreiro** (#c2410c): laranja para texto e ícone sobre branco (contraste 5,2:1): links de ação ("Atender", "Acompanhar", "Ver mais"), "Marcar como lida", cursor de texto. Também é o `--role-primary-color` herdado por telas antigas.
- **Véu Laranja** (#fff1e6): fundo de notificação não lida, pronunciamento do síndico já escrito, banner de "visualizando como" do Master e avatar do perfil.

### Neutral
- **Preto de Placa** (#121417): menu lateral, topo do celular, quadros dos pictogramas, numerais e títulos, aba/pílula ativa, texto principal. É também a cor do tema do navegador (`theme-color`).
- **Alumínio Anodizado** (#edeef0): fundo de todas as telas internas, com pontilhado de 1px em rgba(18,20,23,.09) a cada 20px, parado (rola junto com o conteúdo).
- **Placa Branca** (#ffffff): toda superfície de conteúdo — placas, campos, botões secundários, barra inferior, janelas.
- **Filete** (#d6d8dc): a linha de 1px que separa tudo: borda de placas, campos, abas, topo do computador, divisões internas da placa.
- **Filete Forte** (#b9bdc4): borda de placa clicável sob o cursor, alça da folha no celular, barras de rolagem, contorno tracejado do pronunciamento vazio.
- **Grafite** (#464c56): texto de apoio (descrição da placa, abas inativas, pílulas inativas).
- **Cinza de Legenda** (#6b7079): rótulos da placa ("LOCAL"), metadados (data, protocolo), itens inativos da barra inferior.
- **Prata do Menu** (#a3a9b3): texto secundário sobre o preto (papel do usuário no menu, nome do condomínio no topo do celular).
- **Cinza de Espera** (#8a9099): placeholder dos campos e ícones inativos do menu.

### Status (cores fixas, iguais em todas as telas)
- **Faixa** (sólida, no pé da placa e nas placas de status do painel): Aberta (#dc2626, texto branco), Em Análise (#1d4ed8, texto branco), Em Andamento (#f59e0b, texto preto de placa), Concluída (#047857, texto branco). Uma faixa neutra em preto de placa existe para placas sem status.
- **Selo** (pílula clara, em listas e tabelas): Aberta (texto #b91c1c sobre #fee2e2, borda #fecaca), Em Análise (#1d4ed8 sobre #dbeafe, borda #bfdbfe), Em Andamento (#92400e sobre #fef3c7, borda #fde68a), Concluída (#047857 sobre #d1fae5, borda #a7f3d0).
- O vermelho da faixa Aberta (#dc2626) é também o da bolinha de contagem (notificações, menu e barra inferior).

### Named Rules
**A Regra da Cor Única.** O laranja Habitare é a única cor de destaque, para todo perfil. O perfil aparece como rótulo discreto, nunca como cor. Não existe roxo do Master, azul do síndico nem verde do funcionário.

**A Regra do Laranja Legível.** Laranja preenche com letra preta; laranja escrito sobre branco é sempre #c2410c. Nunca texto branco sobre #f47920, nunca texto #f47920 sobre branco.

**A Regra dos Status Fixos.** Vermelho, azul, âmbar e verde pertencem aos quatro status e a mais nada. Nenhum botão, ícone ou destaque usa essas cores fora do sentido de status (o vermelho também marca contagens pendentes).

## Typography

**Display Font:** Poppins (pesos 500, 600 e 700 carregados) com fallback Plus Jakarta Sans, system-ui
**Body Font:** Plus Jakarta Sans (400–700) com fallback Inter, system-ui
**Label/Mono Font:** Plus Jakarta Sans em caixa alta espaçada para rótulos de placa e faixa

**Character:** Poppins é a letra do letreiro — geométrica, grossa, de leitura à distância — e fica com títulos, locais, números e botões. Plus Jakarta Sans é a letra do formulário e da leitura corrida, mais calma e aberta. A combinação foi aprovada pelo dono.

### Hierarchy
- **Display – placa de status** (800, 2.6rem, 1): o número grande das placas por status no painel (Visão Geral, Síndico, Master). Numerais tabulares.
- **Display – numeral** (800, 2rem, 1.02): números puros em placas — total de usuários do Master, apartamento denunciado na reclamação. Numerais tabulares. Não é usado para locais de ocorrência.
- **Display – login** (700, 2.6rem): "Bem-vindo." no login, com o ponto final em laranja.
- **Headline** (700, 1.3rem, -0.015em): título da tela no topo; 1.08rem em branco no topo preto do celular.
- **Title – local** (800, 1.15rem, 1.25, -0.01em): o local da ocorrência escrito por extenso sob o rótulo "Local", até 2 linhas. Todo local usa esse mesmo tamanho, curto ou longo.
- **Title** (600, 1.02rem, 1.3, balanceado): título da ocorrência na placa; 1 linha nas listas de tarefas e solicitações, 2 linhas no mural.
- **Body** (400, 0.875rem, 1.5): descrição na placa (2 linhas nas listas, 3 no mural, com "Ver mais").
- **Body – meta** (400, 0.78rem): data, autor, atribuição, em Cinza de Legenda.
- **Label – placa** (700, 0.64rem, 0.12em, CAIXA ALTA): o rótulo "LOCAL" sobre o local.
- **Label – faixa** (700, 0.74rem, 0.06em, CAIXA ALTA): nome do status e protocolo na faixa; protocolo em numerais tabulares.
- **Label – navegação** (500, 0.86rem; ativo 600): itens do menu lateral. Barra inferior: 600, 0.66rem.
- **Button** (Poppins 600, ~0.85rem): todos os botões, primários e secundários.
- **Input** (400, max(16px, 0.95rem)): todos os campos e selects.

### Named Rules
**A Regra do Letreiro.** Poppins para o que se lê de longe (títulos, locais, números, botões); Plus Jakarta Sans para o que se lê de perto (texto corrido, metadados, campos). Não inverter.

**A Regra dos Números Alinhados.** Contagens, protocolos, datas do topo e bolinhas usam numerais tabulares (`font-variant-numeric: tabular-nums`), para os números não dançarem quando mudam.

**A Regra dos 16px.** Campo de formulário nunca abaixo de 16px: no celular o navegador dá zoom ao tocar num campo menor.

## Layout

**Computador (≥1024px):** menu lateral preto fixo à esquerda; à direita, topo de 4.25rem em alumínio com filete inferior (título da tela, data, sino, avatar) e a área de conteúdo rolável em alumínio pontilhado, com 2rem de margem lateral no topo. O mural tem largura máxima de 1180px.

**Celular e app (≤1023px):** o menu lateral vira gaveta (abre por "Menu" na barra inferior, com véu rgba(18,20,23,.55)). O topo vira a faixa preta da placa (3.75rem + `env(safe-area-inset-top)`): título em branco, nome do condomínio abaixo em Prata do Menu, só o sino à direita. A barra de navegação inferior fixa (branca, filete superior, `env(safe-area-inset-bottom)`) leva os 3–4 destinos mais usados do perfil + "Menu"; para o morador, "Nova" ocorrência fica no centro como placa laranja, ao alcance do polegar. O conteúdo tem gutter de 1rem e reserva calc(5.5rem + safe-area) no fim para não ficar sob a barra.

**Grades de placas:** 1 coluna no celular; 2 colunas a partir de 760px (listas) ou 1100px (mural); 3 colunas a partir de 1360px onde a grade pede. Espaço entre placas 0.85rem. Placas de status no painel: 2 colunas, 4 a partir de 900px, espaço 0.75rem. No mural, as placas de uma linha têm a mesma altura e as ações ficam alinhadas no pé.

**Ritmo:** padding interno da placa 0.85rem × 0.95rem; controles de filtro compactos (busca, data, abas) no topo da lista para as placas subirem na tela. No celular (≤640px), o filtro por data vira um botão "Data" que abre Dia · Mês · Ano numa linha; abas e pílulas nunca quebram linha — rolam de lado.

### Named Rules
**A Regra do Polegar.** No celular a ação principal e a navegação ficam embaixo, dentro da área segura; nada essencial depende de hover. Alvos de toque têm pelo menos 40px.

## Elevation & Depth

O sistema é plano. A profundidade vem do contraste de material — placa branca sobre alumínio, moldura preta ao redor — e dos filetes de 1px, não de sombras. Placas, botões, campos e cartões têm `box-shadow: none`. Sombra só existe no que flutua acima da tela: janelas (modais) e o menu de notificações. O foco usa um anel laranja, não uma sombra de profundidade.

### Shadow Vocabulary
- **Janela** (`box-shadow: 0 24px 48px -16px rgba(18, 20, 23, 0.35)`): modais e folhas que sobem.
- **Menu suspenso** (`box-shadow: 0 18px 40px -18px rgba(18, 20, 23, 0.35)`): menu de notificações.
- **Anel de foco de campo** (`box-shadow: 0 0 0 3px rgba(244, 121, 32, 0.35)`, com borda em preto de placa): campo em foco. Demais elementos: `outline: 2px solid #f47920; outline-offset: 2px` em `:focus-visible`.

### Named Rules
**A Regra do Filete.** Separar é trabalho do filete de 1px (#d6d8dc). Nada de sombra suave como divisória e nada de faixa colorida na lateral de cartões.

**A Regra do Que Flutua.** Só janela e menu suspenso projetam sombra. Se o elemento está no fluxo da página, ele é plano.

## Shapes

Cantos de placa: levemente arredondados (12px) nas placas e cartões, 8px em botões, campos, itens de menu e abas internas, 10px nos quadros de pictograma e no trilho das abas. Janelas 14px; no celular viram folha com cantos superiores de 18px e alça de 40×4px. Pílulas (selos, filtros, origem da tarefa) são totalmente arredondadas. A placa recorta o conteúdo (`overflow: hidden`), de modo que a faixa de status ocupa a largura toda no pé, com os cantos inferiores da placa. Bordas são sempre de 1px; tracejado só no pronunciamento vazio.

## Components

### Buttons
Firmes e sem enfeite: preenchimento chapado, filete, nenhuma sombra.
- **Shape:** cantos de 8px (login: 10px).
- **Primary:** fundo laranja #f47920, texto preto de placa, filete #e06a12, Poppins 600. Nas placas, altura mínima de 40px e padding 0.5rem × 1–1.1rem.
- **Hover / Focus:** hover clareia para #ff8a33 sem mover; pressionado encolhe para `scale(0.97)`; foco com contorno laranja de 2px. Desabilitado: opacidade 0.55.
- **Secondary:** placa branca, texto preto de placa, filete #d6d8dc; no hover o filete escurece para o preto de placa.

### Chips
- **Style:** pílulas de filtro brancas com filete, texto Grafite, Plus Jakarta 600 0.82rem; selos de status em tons claros (ver Colors).
- **State:** ativa = preto de placa com texto branco; hover escurece filete e texto. Etiquetas de origem nas tarefas: "Atribuída pelo síndico" em laranja com texto preto, "Sua especialidade · disponível" em cinza claro (#eef0f2), "Pessoal" em preto.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** placa branca sobre alumínio.
- **Shadow Strategy:** nenhuma (ver Elevation & Depth).
- **Border:** filete de 1px #d6d8dc; placa clicável escurece o filete para #b9bdc4 no hover e encolhe para `scale(0.985)` ao pressionar.
- **Internal Padding:** 0.85rem × 0.95rem.

### Inputs / Fields
- **Style:** placa branca, filete #d6d8dc, cantos de 8px, Plus Jakarta Sans no mínimo 16px; placeholder #8a9099.
- **Focus:** borda passa para o preto de placa e surge o anel laranja de 3px a 35%.
- **Error / Disabled:** sem tratamento unificado no sistema ainda (cada tela resolve o seu).

### Navigation
- **Menu lateral (computador):** fundo preto de placa, títulos de grupo em caixa alta pequena (#7d838d), itens em Plus Jakarta 500 0.86rem com ícone em #8a9099. Hover: véu branco a 6% e texto branco. Ativo: **placa laranja com letras pretas** (fundo #f47920, texto e ícone #121417, 600); a bolinha de contagem do item ativo vira preta. Rodapé com avatar laranja, nome em branco e papel em Prata do Menu.
- **Topo:** computador em alumínio com filete; celular em preto de placa (ver Layout).
- **Barra inferior (celular/app):** branca com filete superior; ícones de 22px; rótulo 0.66rem; inativo #6b7079, ativo preto de placa com um traço laranja de 3px no topo do item; bolinha vermelha de contagem; pressionar encolhe para `scale(0.94)`. A ação "Nova" do morador é um quadro laranja de 44×30px com o "+" preto.
- **Abas segmentadas** (Em aberto / Concluídas): trilho branco com filete, cantos de 10px, padding 3px; aba ativa em preto de placa com texto branco e contagem tabular.

### Placa da Ocorrência (componente-assinatura)
A unidade de tudo: mural, minhas solicitações, tarefas do funcionário, gestão e concluídas usam a mesma placa.
- **Cabeça:** à esquerda, o rótulo "LOCAL" (label-placa, Cinza de Legenda) e, abaixo, o local exatamente como foi escrito, em Poppins 800 1.15rem, até 2 linhas. Ocorrência pessoal mostra a unidade ("Bloco A · Apto 802"); sem local informado, "Área comum". O local não é interpretado nem convertido em número. À direita, o pictograma.
- **Pictograma:** quadro preto de 44px com cantos de 10px e ícone lucide-react branco de 20px, traço 2, um por categoria (hidráulica = gotas, elétrica = raio, manutenção = chave, limpeza = borrifador, jardinagem = broto, segurança = escudo, áreas comuns = prédio, estrutural = capacete, garagem = vaga, barulho = alto-falante, reclamação = martelo; desconhecida = interrogação). Em listas compactas, 34px com cantos de 8px.
- **Corpo:** título (title), descrição (body) e linha de metadados com ícones de 14px.
- **Ações:** separadas por filete superior, alinhadas no pé da placa; link de ação em #c2410c com seta que anda 2px no hover.
- **Faixa de status:** largura total no pé, status à esquerda e protocolo (OCO-ano-0000) à direita, label-faixa em caixa alta. Quando o status muda, o texto entra subindo como uma placa trocada (320ms).
- **Pronunciamento do síndico** (no mural): caixa de 8px em Véu Laranja com filete #f5c9a5 quando escrito; quando vazio, só a linha "PRONUNCIAMENTO · nenhum ainda".

### Placa de Status (painéis)
Placa branca com o número do status em display-status, uma linha de contexto ("no condomínio", "de N ocorrências") e a faixa sólida do status no pé; 4 placas lado a lado no computador, 2×2 no celular. Onde é clicável, leva à lista daquele status.

### Janelas (modais)
Usar sempre o componente `Janela`. Computador: centralizada, cantos de 14px, sombra de janela, topo e rodapé separados por filete (rodapé em #f7f7f8). Celular (≤640px): vira folha que sobe da base (320ms), largura total, cantos superiores de 18px, alça, botões do rodapé com 44px de altura e área segura inferior.

### Motion
Uma curva só, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint). Placas entram uma vez, ao abrir a tela: sobem 8px e aparecem em 300ms, em cascata de 40ms (até 160ms). Blocos da área de conteúdo entram do mesmo jeito em 350ms, cascata de 60ms. Pressionar encolhe (0.97–0.985; barra inferior 0.94). Hover e troca de estado mudam só cor/borda em 160–180ms. Janela entra em 260ms (sobe 10px e cresce de 0.985); menu lateral desliza em 320ms. Com `prefers-reduced-motion: reduce`, entradas, faixa e janelas não animam e as transições das placas e da navegação são desligadas.

### Named Rules
**A Regra da Placa Completa.** Toda ocorrência, em qualquer tela, aparece como placa: rótulo "Local" + local por extenso, pictograma em quadro preto, e faixa de status no pé. Não criar cartão de ocorrência sem faixa.

**A Regra do Movimento Barato.** Movimento só com opacity e transform. Nunca animar filter, blur ou backdrop-filter (travou o Chrome do dono em produção).

## Do's and Don'ts

### Do:
- **Do** usar o laranja #f47920 como única cor de destaque, com texto #121417 por cima, para todos os perfis.
- **Do** escrever laranja sobre branco em #c2410c.
- **Do** mostrar cada ocorrência como placa: "LOCAL" + local por extenso (Poppins 800, 1.15rem, até 2 linhas), pictograma lucide em quadro preto de 44px e faixa de status no pé.
- **Do** usar as cores fixas de status: faixa sólida (#dc2626, #1d4ed8, #f59e0b com texto preto, #047857) e selo claro nas listas.
- **Do** separar com filete de 1px #d6d8dc sobre placa branca e fundo de alumínio #edeef0.
- **Do** desenhar primeiro para 390px: barra inferior, áreas seguras (`env(safe-area-inset-*)`), alvos de toque de 40px ou mais, campos com 16px.
- **Do** animar só opacity/transform com `cubic-bezier(0.22, 1, 0.36, 1)` e desligar com `prefers-reduced-motion`.
- **Do** usar numerais tabulares em contagens, protocolos e bolinhas.

### Don't:
- **Don't** dar cor própria a perfil (Master, Síndico, Funcionário, Morador); o perfil é um rótulo discreto.
- **Don't** usar vermelho, azul, âmbar ou verde fora do sentido de status.
- **Don't** usar emoji ou caracteres (✓ ✕ ★ ↑) como ícone; só a família lucide-react, traço único.
- **Don't** colocar faixa colorida na lateral de cartões, nem sombra suave como separador.
- **Don't** pôr sombra em elemento que está no fluxo da página; sombra é só de janela e menu suspenso.
- **Don't** animar filter, blur ou backdrop-filter, nem depender de hover para mostrar uma ação.
- **Don't** interpretar o local escrito pelo morador (converter em "Andar 05", "Apto"); ele aparece exatamente como foi escrito.
- **Don't** criar campo com fonte menor que 16px.
