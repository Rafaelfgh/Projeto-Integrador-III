# Habitare — respostas prontas do Play Console (teste fechado)

Tudo o que o Play Console pede para liberar o **teste fechado** do app `br.com.habitare.app`,
na ordem em que aparece em **Painel → "Configurar o app"**. Copiar e colar.

> Dados pessoais (e-mail de contato, senha da conta de teste do revisor) **não ficam aqui**, porque o
> repositório é público. Eles estão no guia de passagem que fica só no computador.

---

## 1. Política de privacidade

**URL:** `https://github.com/Rafaelfgh/Projeto-Integrador-III/blob/teste/melhorias/Projeto/PRIVACIDADE.md`

(Depois que a `teste/melhorias` for para a `main`, dá para trocar `teste/melhorias` por `main` na URL.)

## 2. Acesso ao app (revisor do Google)

- Opção: **"Todas ou algumas funcionalidades estão restritas"** → **Adicionar instruções**.
- Nome da instrução: `Conta de morador de teste`
- Nome de usuário / senha: *(conta de teste criada só para o revisor — ver guia de passagem)*
- Outras informações:

```
Toque em "Entrar", informe o e-mail e a senha acima e toque em "Entrar" (não use o botão do Google).
A conta é de um morador já aprovado no condomínio de demonstração. Nela é possível abrir ocorrências,
ver o mural, fazer reservas de áreas comuns e ver avisos. Contas de síndico e administrador (Master)
são criadas pelos próprios condomínios e não são necessárias para a revisão.
```

## 3. Anúncios

**Não**, o app não contém anúncios.

## 4. Classificação do conteúdo (questionário IARC)

- E-mail de contato: o mesmo da ficha da loja.
- Categoria: **"Todos os outros tipos de app"** (ou "Utilitários, produtividade, comunicação ou outros").
- Violência: **Não** · Sexualidade: **Não** · Linguagem imprópria: **Não** · Substâncias controladas: **Não**
- Jogos de azar / apostas: **Não** · Material sobre crimes: **Não**
- **Interação entre usuários:** **Sim** (moradores, síndico e funcionários trocam comentários e recados
  dentro do condomínio; o conteúdo passa por filtro de palavrões).
- Compartilha a localização do usuário: **Não**
- Compras digitais: **Não**
- Acesso irrestrito à internet / navegador: **Não**

Resultado esperado: classificação **Livre / 3+** (com o aviso "Usuários interagem").

## 5. Público-alvo e conteúdo

- Faixa etária: **18 anos ou mais** (só essa).
- O app pode atrair crianças sem querer? **Não**.

## 6. Apps de notícias: **Não**. 7. Apps de COVID-19: **Não**. 8. Apps governamentais: **Não**.

## 9. Recursos financeiros: **O app não oferece recursos financeiros**.

## 10. Saúde: **Não** se aplica.

## 11. ID de publicidade

**Não**, o app não usa o ID de publicidade.

## 12. Segurança dos dados (Data safety)

**Visão geral**
- O app coleta ou compartilha algum dos tipos de dados exigidos? **Sim**
- Todos os dados coletados são criptografados em trânsito? **Sim**
- Os usuários podem pedir a exclusão dos dados? **Sim**
  - No app: **Perfil → Segurança → Excluir minha conta**
  - URL para exclusão (pedida na seção "Exclusão de conta"):
    `https://github.com/Rafaelfgh/Projeto-Integrador-III/blob/teste/melhorias/Projeto/PRIVACIDADE.md#6-como-excluir-sua-conta-e-seus-dados`
- Login: o app permite criar conta? **Sim** (nome de usuário e senha, e login com Google).

**Tipos de dados** (todos: **coletados**, **não compartilhados**, **não processados de forma temporária**,
finalidade **Funcionalidade do app** + **Gerenciamento da conta** quando indicado):

| Categoria → tipo | Obrigatório? | Finalidades |
|---|---|---|
| Informações pessoais → **Nome** | Obrigatório | Funcionalidade do app, Gerenciamento da conta |
| Informações pessoais → **Endereço de e-mail** | Obrigatório | Funcionalidade do app, Gerenciamento da conta |
| Informações pessoais → **Número de telefone** | Obrigatório | Funcionalidade do app, Gerenciamento da conta |
| Informações pessoais → **Endereço** (bloco e apartamento) | Obrigatório | Funcionalidade do app |
| Informações pessoais → **Outras informações** (CPF/CNPJ) | Obrigatório | Gerenciamento da conta |
| Fotos e vídeos → **Fotos** (fotos das ocorrências) | Opcional | Funcionalidade do app |
| Mensagens → **Outras mensagens no app** (comentários e recados) | Opcional | Funcionalidade do app |
| Atividade no app → **Outros conteúdos gerados pelo usuário** (ocorrências, reclamações, reservas) | Opcional | Funcionalidade do app |

Não marcar: localização, informações financeiras, saúde, contatos, agenda, arquivos, áudio,
navegação na web, informações do app e desempenho, identificadores do dispositivo.

## 13. Ficha principal da loja (pt-BR)

- **Nome do app** (até 30): `Habitare`
- **Descrição curta** (até 80):

```
Portal do condomínio: ocorrências, reservas, avisos e recados num só lugar.
```

- **Descrição completa** (até 4000):

```
O Habitare conecta moradores, síndico, funcionários e administração do condomínio num só lugar.

PARA MORADORES
• Abra ocorrências (manutenção, limpeza, segurança…) com fotos e acompanhe cada etapa até a conclusão.
• Veja o mural de ocorrências do condomínio e o andamento de cada uma.
• Registre reclamações direto para o síndico e receba a resposta no app.
• Reserve áreas comuns (salão de festas, churrasqueira…) vendo os horários livres no calendário.
• Receba avisos e eventos do condomínio e notificações do que é seu.

PARA O SÍNDICO
• Painel com o que precisa de atenção: ocorrências abertas e paradas há mais de 2 dias.
• Encaminhe ocorrências para a equipe, dê pronunciamentos e responda reclamações.
• Dashboard com evolução semanal, mapa de calor e ranking dos funcionários.
• Publique avisos e eventos e converse com a equipe pelos recados.

PARA FUNCIONÁRIOS
• Lista das tarefas atribuídas, com atualização de andamento e fotos.

PARA A ADMINISTRAÇÃO (MASTER)
• Aprove cadastros de moradores, cadastre funcionários, blocos e áreas comuns.

Entre com e-mail e senha ou com a sua conta Google.

Projeto Integrador desenvolvido por estudantes do CEUB.
```

- **Ícone** (512×512): `play-assets/icone-loja-512.png`
- **Gráfico de recursos** (1024×500): `play-assets/grafico-destaque-1024x500.png`
- **Capturas de tela do telefone** (mín. 2, máx. 8): tiradas **do app rodando no emulador/celular** (`adb exec-out screencap -p > tela.png`).
  Regra do Play: o lado maior não pode passar de 2× o menor; use um aparelho virtual 1080×1920 (ex.: Pixel 2) ou recorte.
- **Categoria:** App → **Casa e decoração** (alternativa: Estilo de vida)
- **Tags:** gestão de condomínio / imóveis (o que o Play sugerir de parecido)
- **E-mail de contato:** *(ver guia de passagem)*

## 14. Teste fechado

1. **Testar e lançar → Teste fechado → Alpha** (faixa padrão) → **Gerenciar faixa**.
2. **Países/regiões:** Brasil.
3. **Testadores:** marcar a lista **"Testadores - Habitare"** (a mesma do teste interno).
   **URL ou e-mail de feedback:** o e-mail de contato.
4. **Criar nova versão** → enviar `app-release.aab` (versionCode **2**, versão **2.0.0**).
   - Nome da versão: `2.0.0 (2)`
   - Notas da versão:

```
<pt-BR>
Primeira versão de teste do Habitare para Android: login com e-mail ou Google, ocorrências com fotos,
mural, reclamações, reservas de áreas comuns, avisos, recados e notificações.
</pt-BR>
```

5. **Avançar → Salvar → Enviar para revisão** (em "Visão geral da publicação" → **Enviar alterações para revisão**).
6. Revisão do Google: de algumas horas a alguns dias. Depois de aprovada, copiar o **link de participação**
   (aba Testadores) e mandar aos testadores.

## 15. Notas da versão ("Novidades") — formato

Sempre: **um título curto** e depois as novidades **em tópicos** (até 500 caracteres por idioma).

```
<pt-BR>
Habitare 2.0.2 — fotos na hora
• Tire a foto com a câmera direto na nova ocorrência
• Botão "Galeria" para escolher fotos e vídeos do celular
• Ajustes visuais na tela de Reservas
</pt-BR>
```
