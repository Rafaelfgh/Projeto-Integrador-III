# Habitare — Portal do Morador (web)

Sistema de gestão de condomínio: ocorrências com protocolo e status, reclamações (só o síndico vê),
mural de avisos e eventos, recados da gestão para a equipe e painéis para síndico, Master e funcionários.

Feito com **React 19 + Vite** no frontend e **Supabase** (Postgres, Auth, Storage, Realtime) no backend.

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
cd Projeto/frontend
npm install
cp .env.example .env.local   # depois preencha a URL e a chave pública do Supabase
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:5173).
Se a porta 5173 estiver ocupada, o Vite usa a próxima livre (5174, 5175...).

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o site em modo de desenvolvimento |
| `npm run build` | Gera a versão final em `dist/` |
| `npm run lint` | Verifica o código com o ESLint |

## Estrutura

- `Projeto/frontend/src/pages` — uma tela por arquivo (com o CSS dela ao lado)
- `Projeto/frontend/src/components` — peças reutilizadas (janelas, placas, menu…)
- `Projeto/frontend/src/styles/habitare.css` — identidade visual (cores, botões, cartões)
- `Projeto/supabase/migrations` — mudanças do banco, em ordem de data
- `Projeto/supabase/functions` — Edge Function de gestão de funcionários

## Perfis

Dev (equipe Habitare) · Master (responsável pelo condomínio) · Síndico · Morador · Funcionário.
Cada perfil vê um menu próprio; as permissões são garantidas no banco (RLS), não só na tela.
