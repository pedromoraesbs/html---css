# Dois i Manutenção — Gestão de Equipamentos em Manutenção

Sistema web **interno** em **Next.js 16** (App Router + TypeScript) para controlar a entrada e a saída de equipamentos eletrônicos (computadores, notebooks, impressoras, monitores, nobreaks etc.) numa assistência técnica, com login da equipe e conversa entre o técnico que faz a visita e o técnico que faz o conserto.

## Perfis de acesso

| Perfil | O que faz no sistema |
|---|---|
| **Técnico de campo** | Faz a visita técnica, registra a entrada do equipamento retirado no cliente, leva o orçamento ao cliente e registra se ele aprovou ou recusou, e registra a devolução. |
| **Técnico de bancada** | Assume as OS, faz o diagnóstico e o orçamento, atualiza o andamento do conserto (diagnóstico → aguardando aprovação → peça → reparo → pronto / sem conserto). Só mexe nas OS que são dele. |
| **Administrador** | Tudo o que os outros fazem + cadastra usuários, troca os responsáveis de uma OS e exclui OS. |

O cliente **não** acessa o sistema.

### Fluxo de uma OS

1. **Campo** visita o cliente, retira o equipamento e registra a **entrada** (pode escolher o técnico de bancada e deixar um recado).
2. **Bancada** assume a OS (se ninguém foi escolhido), faz o **diagnóstico** e o **orçamento** e muda para *Aguardando aprovação*.
3. **Campo** fala com o cliente e clica em **Cliente aprovou** (vai para *Em reparo*) ou **Cliente recusou** (vai para *Sem conserto*).
4. **Bancada** conserta e toca em **✅ Pronto** (no topo da OS ou direto no cartão “Meus consertos” do painel). O sistema marca *Pronto p/ retirada* e manda automaticamente uma mensagem na conversa avisando o técnico de campo. O botão pede um segundo toque para confirmar e só aparece para o técnico responsável (ou o administrador) enquanto o conserto está em andamento.
5. **Campo** devolve o equipamento e registra a **devolução** (quem recebeu, valor, pagamento, garantia).

Em todas as etapas os dois conversam pela **Conversa da equipe** dentro da OS. Mensagens novas aparecem no painel e com 💬 na lista de ordens; a página da OS se atualiza sozinha a cada 20 segundos.

## Funcionalidades

- **Login** com usuário e senha (senhas com hash *scrypt*, sessão em cookie *httpOnly* de 7 dias).
- **Painel por perfil**: a “fila” de cada pessoa (ex.: campo vê “Levar orçamento ao cliente” e “Prontos para devolver”; bancada vê “Meus consertos” e “Sem técnico de bancada”), mensagens não lidas e a visão geral da oficina.
- **Ordens de serviço** com busca e filtros (minhas / todas, status, tipo, sem técnico de bancada).
- **Histórico** de cada OS com quem fez cada alteração.
- **RAT (Relatório de Atendimento Técnico)** para entregar ao cliente: gerado já preenchido a partir da OS, no modelo da empresa (folha A5), com campos de assinatura para a retirada e para a entrega. Botão **🖨 RAT para o cliente** na OS → **Imprimir** (ou “Salvar como PDF” para mandar por e-mail/WhatsApp).
- **Funciona no celular, tablet e computador**: no celular e no tablet em pé o menu vira o botão ☰, a lista de ordens vira cartões e os formulários ficam em uma coluna. O RAT se ajusta à largura da tela (a impressão continua em A5). Na mesma rede, abra pelo celular usando o IP do computador, ex.: `http://192.168.0.10:3000` — o `npm run dev`/`npm start` mostra o endereço em *Network*.
- **Usuários** (admin): cadastrar, mudar perfil, desativar e redefinir senha. **Minha conta**: trocar a própria senha.

## Número do chamado (automático)

Toda entrada recebe um número de chamado gerado pelo sistema, no formato **SIGLA-ANO-SEQUÊNCIA**. A sigla mostra o tipo do equipamento e cada tipo tem a sua própria numeração, que recomeça a cada ano:

| Equipamento | Sigla | Exemplo |
|---|---|---|
| Computador (desktop) | `DSK` | `DSK-2026-0001` |
| Notebook | `NTB` | `NTB-2026-0015` |
| Impressora | `IMP` | `IMP-2026-0003` |
| Monitor | `MON` | `MON-2026-0007` |
| Tablet | `TAB` | `TAB-2026-0001` |
| Celular | `CEL` | `CEL-2026-0002` |
| Nobreak | `NBK` | `NBK-2026-0004` |
| Servidor | `SRV` | `SRV-2026-0001` |
| Periférico | `PER` | `PER-2026-0009` |
| Outro | `OUT` | `OUT-2026-0001` |

O número aparece na OS, na lista de ordens, no RAT e no histórico, e dá para buscar por ele. Ordens antigas sem número recebem um automaticamente (pela data de entrada) na primeira vez que o sistema abre. As siglas ficam em `lib/constantes.ts` (`SIGLA_TIPO`).

## RAT — o que sai em cada campo

| Campo do RAT | De onde vem |
|---|---|
| Nome do técnico | Técnico de campo da OS |
| Chamado | Gerado automaticamente na entrada (ex.: `NTB-2026-0015`) |
| Empresa parceira, Horário início/fim | Seção **Atendimento** da entrada (ou **Dados do atendimento (RAT)** na OS) |
| Data do atendimento | Data da entrada da OS |
| Dados do cliente | Cliente, responsável, cargo, telefone e e-mail |
| Retirado p/ laboratório · Substituição ou reparo · Upgrade | Caixas de **Tipo de serviço** |
| Notebook / Desktop / Impressora / Monitor / Outros | Tipo do equipamento |
| Dados de retirada | Marca + modelo, patrimônio, nº de série, etiqueta do cliente |
| Dados de entrega | Preenchidos na devolução (já vêm iguais aos da retirada; mude se houve substituição) |
| Backup | “Backup realizado” e nome do perfil de usuário |
| Acessórios | Campo acessórios (separe por vírgula) |
| Sintoma do problema | Defeito relatado |
| Relatório técnico – fechamento | Diagnóstico da bancada + resultado |
| Garantia | Dias de garantia informados na devolução |
| Data (assinaturas) | Data da devolução |

Nome da empresa, nome do sistema (“Dois i Manutenção”) e garantia padrão ficam em `lib/empresa.ts`; o logo é o arquivo `public/logo-empresa.png`.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end + back-end | Next.js 16 (App Router, Server Components, Server Actions) |
| Linguagem | TypeScript |
| Banco de dados | SQLite embutido no Node.js (`node:sqlite`) — nenhum driver para instalar ou compilar. Arquivo `data/tecmanutencao.db`, criado automaticamente |
| Estilo | CSS puro (`app/globals.css`) |

## Como rodar (Ubuntu / Linux)

Pré-requisito: **Node.js 22.13 ou superior** (testado no **Node 24**). Confira com `node -v`.

```bash
unzip tecmanutencao.zip
cd tecmanutencao
npm install          # instala as dependências
npm run seed         # (opcional) cria o banco com 8 ordens de exemplo — APAGA os dados existentes
npm run dev          # modo desenvolvimento → abra http://localhost:3000
```

Para produção:

```bash
npm run build
npm start
```

### Primeiro login

- **Com os dados de exemplo** (`npm run seed`):

  | Usuário | Senha | Perfil |
  |---|---|---|
  | `admin` | `admin123` | Administrador |
  | `ana` / `bruno` | `senha123` | Técnico de campo |
  | `carlos` / `rafael` | `senha123` | Técnico de bancada |

  Troque essas senhas antes de usar de verdade.

- **Sem dados de exemplo**: na primeira vez que abrir o sistema aparece a tela **Primeiro acesso** para criar o administrador. Depois ele cadastra a equipe em **Usuários**.

- **Já usava a versão anterior?** O banco é atualizado automaticamente (as ordens existentes são mantidas) e aparece a tela de primeiro acesso para criar o administrador.

> Se o sistema for acessado por HTTPS, defina a variável `COOKIE_SECURE=true` ao rodar (`COOKIE_SECURE=true npm start`).

### Problemas comuns

| Sintoma | Solução |
|---|---|
| `No such built-in module: node:sqlite` ou `node -v` mostra versão antiga | Instale o Node 24 com o nvm: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh \| bash`, feche e abra o terminal, depois `nvm install 24 && nvm use 24`. Apague `node_modules` e rode `npm install` de novo. |
| `Port 3000 is in use` | Rode em outra porta: `npm run dev -- -p 3001` |
| `EACCES: permission denied` | Não use `sudo` no `npm install`. Se já usou, corrija com `sudo chown -R $USER:$USER .` dentro da pasta do projeto. |
| Página em branco / erro depois de atualizar o projeto | Apague o cache e rode de novo: `rm -rf .next && npm run dev` |
| Aviso `ExperimentalWarning: SQLite is an experimental feature` | É só um aviso do Node, pode ignorar. |

## Estrutura

```
app/
  layout.tsx                      Cabeçalho e navegação
  page.tsx                        Painel
  actions.ts                      Server Actions (criar, andamento, diagnóstico, saída, excluir)
  ordens/page.tsx                 Lista de ordens com filtros
  ordens/nova/page.tsx            Registro de entrada
  ordens/[id]/page.tsx            Detalhe da OS
  ordens/[id]/rat/                RAT (Relatório de Atendimento Técnico) para impressão
components/                       Componentes de UI e formulários (client components)
proxy.ts                          Manda quem não está logado para /login
lib/
  db.ts                           Conexão SQLite e criação das tabelas
  ordens.ts                       Consultas e regras de negócio
  constantes.ts                   Status, tipos de equipamento, formas de pagamento
  format.ts                       Formatação de datas e valores (pt-BR)
scripts/seed.mjs                  Dados de exemplo
```

## Banco de dados

- `usuarios` — equipe, com perfil (`admin`, `campo`, `bancada`) e senha em hash.
- `sessoes` — logins ativos (só o hash do token fica no banco).
- `ordens` — uma linha por OS (o `id` é o número da OS), com `campo_id` e `bancada_id` apontando para os técnicos responsáveis.
- `historico` — cada mudança de status, com data, anotação e autor.
- `mensagens` — conversa da equipe em cada OS.
- `leituras` — até quando cada usuário leu cada OS (para contar mensagens não lidas).

Para fazer backup, basta copiar o arquivo `data/tecmanutencao.db` com o servidor parado.

## Observações

- Esqueceu a senha do único administrador? Rode `npm run seed` só se puder apagar os dados; caso contrário, peça para outro administrador redefinir em **Usuários**.
- O SQLite funciona muito bem para uma loja/rede local. Para hospedar em serviços *serverless* (como a Vercel), troque o banco por um servidor (PostgreSQL/MySQL), pois lá o disco não é persistente.
