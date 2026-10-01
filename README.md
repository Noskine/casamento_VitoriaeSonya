# 💍 Convite de Casamento — Vitória & Sonya

Site de convite de casamento com lista de presentes, confirmação de presença (RSVP) e pagamento via Mercado Pago (Pix, cartão e boleto).

Construído com Next.js 16, Drizzle ORM sobre Supabase PostgreSQL, Vercel Blob para imagens e Mercado Pago para pagamentos.

## ✨ Funcionalidades

### Para os convidados

- Convite animado com hero em paralaxe, contagem regressiva ao vivo e linha do tempo da história do casal.
- Confirmação de presença com formulário animado, validação e opção de acompanhantes.
- Lista de presentes com fotos, descrições, valores e reserva via Mercado Pago.
- Pagamento integrado via Checkout Pro (Pix, cartão em até 12x ou boleto).
- Página de retorno com verificação de status em tempo real.
- Totalmente responsivo, do celular ao desktop.

### Para os noivos (painel admin)

- Autenticação por senha com cookie assinado (HMAC-SHA256).
- Dashboard de confirmações com busca, filtros, estatísticas e exportação para CSV.
- Gerenciamento da lista de presentes com upload de imagens para Vercel Blob.
- Reservas em tempo real com status de pagamento (pendente, aprovado, rejeitado).

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS v4 |
| Animações | Motion (framer-motion) |
| Banco de dados | Supabase PostgreSQL via Drizzle ORM |
| Storage | Vercel Blob |
| Pagamentos | Mercado Pago (Checkout Pro) |
| Validação | Zod |
| Testes | Vitest + Testing Library |
| Runtime de testes | Node.js (via `npx vitest`) |

## 📋 Pré-requisitos

- Node.js 20+ (para rodar os testes)
- Bun 1.1+ (recomendado para dev e build)
- Conta no Supabase
- Conta Vercel com um Blob Store
- Conta no Mercado Pago com aplicação criada
- ngrok ou Hookdeck CLI para testar webhooks localmente

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/Noskine/casamento_VitoriaeSonya.git
cd casamento_VitoriaeSonya
```

### 2. Instale as dependências

```bash
bun install
```

### 3. Configure as variáveis de ambiente

## 🔐 Variáveis de ambiente

Crie `.env.local` a partir de `.env.example`. Nunca comite esse arquivo; ele está no `.gitignore`.

### Banco e imagens

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

### Painel Admin

```env
# Senha do login do painel
ADMIN_PASSWORD="senha-super-secreta"

# Chave para assinar o cookie de sessão (NÃO use a mesma string da senha)
# Gere com: openssl rand -hex 32
ADMIN_SESSION_SECRET="..."

# Salt para hashear IPs (LGPD)
# Gere com: openssl rand -hex 16
IP_SALT="..."

# Chave do GET /api/rsvp (opcional, se você ainda usa essa rota)
RSVP_ADMIN_SECRET="..."
```

### Mercado Pago

```env
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
MERCADOPAGO_PUBLIC_KEY="APP_USR-..."
MERCADOPAGO_WEBHOOK_SECRET="..."
```

### Site

```env
# URL pública (usada em back_urls e notification_url do MP)
# Em dev: URL do ngrok. Em prod: domínio da Vercel.
NEXT_PUBLIC_SITE_URL="https://seu-site.vercel.app"
```

### Prazo do RSVP

Definido em `lib/rsvp.ts` (não usa env por padrão).

## 📍 Onde encontrar cada valor

| Variável | Onde pegar |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Connect → Transaction Pooler |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob → token de leitura/gravação |
| `MERCADOPAGO_ACCESS_TOKEN` | MP Developers → Credenciais |
| `MERCADOPAGO_WEBHOOK_SECRET` | MP Developers → Webhooks → Configurar notificações |

## 🗄️ Configuração do banco

### 1. Configurar a conexão e aplicar migrações

Configure `DATABASE_URL` no `.env.local` e no ambiente de deploy. Use a URI do Transaction Pooler do Supabase, substituindo o placeholder pela senha do banco.

Rode as migrações versionadas:

```bash
bun run db:migrate
```

O schema fonte está em `lib/db/schema.ts`; migrações ficam em `drizzle/`. Faça backup e confira a estrutura remota antes de aplicar migrações em produção. Para mudanças futuras no schema, rode `bun run db:generate` e revise o SQL antes de `bun run db:migrate`.

O SQL abaixo documenta o schema-base e serve para comparação. Use as migrações Drizzle como etapa de instalação.

```sql
-- ============================================================
-- Tabela de confirmações de presença
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  email varchar(200) not null,
  phone varchar(30),
  attending varchar(3) not null,
  guests integer not null default 0,
  guest_names text,
  diet text,
  message text,
  ip_hash varchar(64),
  user_agent varchar(300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rsvps_attending_check check (attending in ('yes', 'no')),
  constraint rsvps_guests_range check (guests between 0 and 6),
  constraint rsvps_email_unique unique (email)
);

create index if not exists rsvps_attending_idx
  on public.rsvps (attending);

create index if not exists rsvps_created_at_idx
  on public.rsvps (created_at desc);

-- ============================================================
-- Tabela de presentes
-- ============================================================

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  description text,
  image_url text,
  price_cents integer not null default 0,
  quota_cents integer not null default 0,
  external_link text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gifts_position_idx
  on public.gifts(position);

create index if not exists gifts_active_idx
  on public.gifts(active);

-- ============================================================
-- Tabela de reservas de presentes
-- ============================================================

create table if not exists public.gift_reservations (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete cascade,
  name varchar(120) not null,
  email varchar(200) not null,
  message text,
  status varchar(20) not null default 'reserved',
  payment_id varchar(64),
  payment_status varchar(20),
  payment_method varchar(30),
  amount_cents integer,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint gift_reservations_status_check
    check (status in ('reserved', 'paid', 'cancelled'))
);

create index if not exists gift_reservations_gift_id_idx
  on public.gift_reservations(gift_id);

create index if not exists gift_reservations_payment_id_idx
  on public.gift_reservations(payment_id);

-- ============================================================
-- Trigger para manter updated_at
-- ============================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists rsvps_touch on public.rsvps;

create trigger rsvps_touch
before update on public.rsvps
for each row execute function public.touch_updated_at();

drop trigger if exists gifts_touch on public.gifts;

create trigger gifts_touch
before update on public.gifts
for each row execute function public.touch_updated_at();

-- ============================================================
-- Segurança (RLS)
-- ============================================================

alter table public.rsvps enable row level security;
alter table public.gifts enable row level security;
alter table public.gift_reservations enable row level security;
```

### 2. Configurar Vercel Blob

Crie um store em **Vercel → Storage → Blob** e configure `BLOB_READ_WRITE_TOKEN` localmente e no ambiente de deploy.

Para transferir imagens públicas que ainda estão no bucket Supabase `gifts`, mantenha esse bucket acessível durante a cópia e rode primeiro a simulação:

```bash
bun run storage:migrate
```

Depois de conferir o resultado, aplique a transferência e atualização das URLs no banco:

```bash
bun run storage:migrate -- --apply
```

Links externos são ignorados. Faça backup antes de aplicar e mantenha o bucket antigo até validar as imagens no site.

### 3. (Opcional) Cron job para expirar reservas

Se você quer que reservas não pagas sejam liberadas em 30 minutos:

```sql
create extension if not exists pg_cron;

create or replace function public.expire_stale_reservations()
returns void
language plpgsql
as $$
);
│   ├── db/                       # Conexão e schema Drizzle
```

## 🏃 Rodando localmente
│   ├── orphan-store.ts           # Pagamentos órfãos e reembolsos

### Modo desenvolvimento

│   └── rate-limit.ts             # 5 req/min por IP
```

Acesse:

`http://localhost:3000`

### Para testar webhooks do Mercado Pago

O Mercado Pago não aceita `localhost` como URL de notificação. Você precisa de um túnel:

```bash
ngrok http 3000
```

Copie a URL gerada, por exemplo:

```text
https://abc123.ngrok-free.dev
```

Ajuste no `.env.local`:

```env
NEXT_PUBLIC_SITE_URL="https://abc123.ngrok-free.dev"
```

Reinicie:

```bash
bun run dev
```

No painel do Mercado Pago, atualize a URL do webhook para:

```text
https://abc123.ngrok-free.dev/api/webhooks/mercadopago
```

> 💡 **Alternativa:** o Hookdeck CLI oferece URLs permanentes e gratuitas, o que evita ter que reconfigurar o webhook a cada reinicialização.

## 🧪 Testes

### Rodar uma vez

```bash
npx vitest run
```

### Modo watch

```bash
npx vitest
```

### Com cobertura

```bash
npx vitest run --coverage
```

> ⚠️ Use `npx vitest`, não `bun test`. O Bun tem incompatibilidades conhecidas com jsdom e as APIs de coverage do Node. O `npx` resolve para o Node.js do sistema.

### Cobertura atual

| Arquivo | Testes |
|---|---|
| `lib/rsvp.test.ts` | Lógica de prazo |
| `lib/rsvp-schema.test.ts` | Validação do RSVP |
| `lib/gift-schema.test.ts` | Validação de presentes + formatação BRL |
| `app/api/rsvp/route.test.ts` | Rotas POST/GET do RSVP |
| `app/api/gifts/[id]/reserve/route.test.ts` | Rota de reserva |
| `components/gifts/GiftCard.test.tsx` | Renderização do card |

## 📁 Estrutura do projeto

```text
.
├── app/
│   ├── admin/                         # Painel protegido
│   │   ├── login/                     # Tela de login
│   │   ├── presentes/                 # Gerenciamento de presentes
│   │   ├── actions.ts                 # Server actions (login/logout)
│   │   ├── DashboardClient.tsx        # UI do dashboard
│   │   └── page.tsx
│   ├── api/
│   │   ├── rsvp/                      # POST (criar) e GET (listar)
│   │   ├── gifts/
│   │   │   ├── [id]/
│   │   │   │   ├── reserve/           # Reserva + preferência MP
│   │   │   │   └── route.ts           # DELETE/PATCH do admin
│   │   │   └── route.ts               # GET (listar) e POST (criar)
│   │   ├── reservations/
│   │   │   └── [id]/
│   │   │       ├── status/             # Polling do status
│   │   │       └── sync/               # Sincronização manual
│   │   ├── upload/                     # Upload de imagens
│   │   └── webhooks/
│   │       └── mercadopago/            # Recebe notificações do MP
│   ├── presentes/
│   │   ├── obrigado/                   # Página de retorno pós-pagamento
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx                        # Home (convite)
│   └── globals.css
├── components/
│   ├── admin/
│   │   └── ImageUploader.tsx
│   ├── gifts/
│   │   ├── GiftsSection.tsx            # Server component da home
│   │   ├── GiftsGrid.tsx               # Client com modal
│   │   ├── GiftCard.tsx
│   │   ├── ReserveModal.tsx
│   │   └── GiftsSkeleton.tsx
│   ├── Countdown.tsx
│   ├── Details.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── Ornament.tsx
│   ├── Petals.tsx
│   ├── Reveal.tsx
│   ├── Rsvp.tsx
│   ├── ScrollProgress.tsx
│   └── Story.tsx
├── lib/
│   ├── admin-auth.ts             # Cookie assinado com HMAC
│   ├── db/                       # Conexão e schema Drizzle
│   ├── gift-schema.ts            # Zod + formatBRL
│   ├── gift-store.ts             # CRUD de presentes
│   ├── mercadopago.ts            # SDK do MP
│   ├── orphan-store.ts           # Pagamentos órfãos e reembolsos
│   ├── rate-limit.ts             # 5 req/min por IP
│   ├── rsvp-schema.ts            # Zod
│   ├── rsvp-store.ts             # CRUD de RSVPs
│   └── rsvp.ts                   # Lógica de prazo
├── test/
│   └── setup.ts
├── vitest.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

## 🔑 Acessando o painel admin

Acesse:

```text
/admin/login
```

Digite a senha definida em `ADMIN_PASSWORD`.

Você será redirecionado para:

```text
/admin
```

A sessão dura 7 dias e é armazenada num cookie HTTP-only assinado com `ADMIN_SESSION_SECRET`. Ninguém consegue forjar sem saber a chave.

## 🎁 Cadastrando um presente

Vá em:

```text
/admin/presentes
```

1. Clique em **+ Novo presente**.
2. Arraste ou clique para enviar a foto (vai direto para o bucket).
3. Preencha nome, descrição, valor e, opcionalmente, link externo.
4. Clique em **Publicar presente**.

O presente aparece na home imediatamente.

## 💳 Fluxo de pagamento

```text
Convidado clica em "Presentear"
        │
        ▼
POST /api/gifts/[id]/reserve
        ├─ cria reserva (payment_status: pending)
        ├─ cria preferência no MP (external_reference = reserva.id)
        └─ retorna init_point
        │
        ▼
Redirect para Checkout Pro do Mercado Pago
        │
        ▼
Convidado paga (Pix, cartão ou boleto)
        │
        ▼
MP redireciona para /presentes/obrigado
        │
        └─ polling de 3 em 3 segundos no status real
        │
        ▼
MP envia POST para /api/webhooks/mercadopago
        ├─ valida assinatura HMAC
        ├─ consulta status real no MP
        ├─ atualiza reserva (approved → status: paid)
        └─ envia e-mail para os noivos
```

## ⚠️ Testando pagamentos

### Cartão

Use as credenciais de teste com uma conta de comprador de teste.

```text
Número: 5031 4332 1540 6351
CVV: 123
Nome do titular: APRO
```

`APRO` força o status aprovado.

Para o CPF, gere um válido em `geradordecpf.org`.

### Pix

O Pix só funciona em produção com uma chave Pix ativa cadastrada na conta do vendedor.

Não é possível testar em sandbox — limitação oficial do Mercado Pago.

## 🚢 Deploy na Vercel

### 1. Configure as variáveis

Na Vercel:

**Settings → Environment Variables**

Adicione todas as variáveis do `.env.local`, marcando:

- Production
- Preview
- Development

### 2. Atualize o webhook do Mercado Pago

No painel do MP, troque a URL do webhook para o domínio de produção:

```text
https://seu-site.vercel.app/api/webhooks/mercadopago
```

### 3. Ajuste `NEXT_PUBLIC_SITE_URL`

```env
NEXT_PUBLIC_SITE_URL="https://seu-site.vercel.app"
```

### 4. Faça o deploy

```bash
git push
```

> 💡 Variáveis de ambiente só entram em vigor em builds novos. Depois de adicionar ou alterar qualquer variável na Vercel, force um novo deploy.

## 🔒 Segurança

### Boas práticas implementadas

- `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN` são usados somente no servidor; consultas ficam nos stores e Route Handlers.
- Cookie de sessão assinado com HMAC-SHA256, HTTP-only, SameSite=Lax.
- Senha e chave de sessão separadas — mesmo que a senha vaze, o cookie não pode ser forjado.
- Validação com Zod em todas as rotas de API.
- Rate limit de 5 req/min por IP nas rotas públicas.
- IP hasheado com salt antes de salvar (LGPD).
- Webhook do MP validado por assinatura HMAC.
- RLS habilitado no PostgreSQL; autenticação e validação das rotas protegem operações administrativas.

### ⚠️ Nunca comite `.env.local`

Nunca versione credenciais reais, especialmente:

```text
DATABASE_URL
BLOB_READ_WRITE_TOKEN
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_SECRET
ADMIN_SESSION_SECRET
ADMIN_PASSWORD
```

Se alguma dessas vazar, rotacione imediatamente:

1. **Supabase → Settings → Database:** redefina a senha do banco.
2. **MP Developers → Credenciais/Webhooks:** renove o Access Token e o segredo do webhook.
3. **Vercel → Storage → Blob:** gere outro token de leitura/gravação.
4. Atualize as variáveis no deploy e faça um novo build.

## 🐛 Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| `authentication failed` no ngrok | Authtoken expirado | `ngrok config add-authtoken SEU_TOKEN` |
| `ERR_NGROK_8012` | App não está na porta 3000 | Confirme `bun run dev` rodando + `curl localhost:3000` |
| Build falha com erro de TypeScript | Tipos desatualizados | Rode `bunx tsc --noEmit` localmente antes do push |
| `Coverage APIs are not supported` | Rodou `bun test` | Use `npx vitest run` |
| Pix não aparece no checkout | Sandbox não suporta Pix | Use credenciais de produção com chave Pix ativa |
| Webhook não chega | URL não configurada ou túnel fechado | Confira painel do MP → Webhooks → Histórico |
| Login do admin retorna 401 | Nomes de variável inconsistentes | Confirme `ADMIN_PASSWORD` e `ADMIN_SESSION_SECRET` na Vercel |
| Imagem não carrega após upload | Bucket não é público | Supabase → Storage → `gifts` → Tornar público |

## 📝 Comandos úteis

### Desenvolvimento

```bash
bun run dev
```

### Build e produção

```bash
bun run build
bun run start
```

### Tipagem

```bash
bunx tsc --noEmit
```

### Testes

```bash
npx vitest run
npx vitest
npx vitest run --coverage
```

### Lint

```bash
bun run lint
```

### Utilitários

```bash
# Gera string aleatória segura
openssl rand -hex 32

# Expõe localhost para webhooks
ngrok http 3000
```

## 📄 Licença

Este projeto é de uso pessoal.

Sinta-se à vontade para usar como referência, mas por favor não copie o convite ou a identidade visual — cada casamento merece algo único. 🤍

## 💌 Contato

**Vitória & Sonya**

**Hashtag:** `#VitoriaESonyaParaSempre`

Feito com muito carinho para o nosso grande dia. 💛

---

> Esta resposta é gerada por AI, apenas para referência.
