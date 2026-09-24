💍 Convite de Casamento — Vitória & Sonya
Site de convite de casamento com lista de presentes, confirmação de presença (RSVP) e pagamento via Mercado Pago (Pix, cartão e boleto).

Construído com Next.js 16, Motion para animações, Supabase como banco e storage, Mercado Pago para pagamentos e Resend para e-mails.

✨ Funcionalidades
Para os convidados
Convite animado com hero em paralaxe, contagem regressiva ao vivo e linha do tempo da história do casal

Confirmação de presença com formulário animado, validação e opção de acompanhantes

Lista de presentes com fotos, descrições, valores e reserva via Mercado Pago

Pagamento integrado via Checkout Pro (Pix, cartão em até 12x ou boleto)

Página de retorno com verificação de status em tempo real

Totalmente responsivo, do celular ao desktop

Para os noivos (painel admin)
Autenticação por senha com cookie assinado (HMAC-SHA256)

Dashboard de confirmações com busca, filtros, estatísticas e exportação para CSV

Gerenciamento da lista de presentes com upload de imagens direto para o bucket do Supabase

Reservas em tempo real com status de pagamento (pendente, aprovado, rejeitado)

Notificação por e-mail a cada confirmação de presença e a cada presente pago

🛠️ Stack
Camada	Tecnologia
Framework	Next.js 16 (App Router) + React 19
Linguagem	TypeScript
Estilização	Tailwind CSS v4
Animações	Motion (framer-motion)
Banco de dados	Supabase (PostgreSQL)
Storage	Supabase Storage
Pagamentos	Mercado Pago (Checkout Pro)
E-mails	Resend
Validação	Zod
Testes	Vitest + Testing Library
Runtime de testes	Node.js (via npx vitest)
📋 Pré-requisitos
Node.js 20+ (para rodar os testes)

Bun 1.1+ (recomendado para dev e build)

Conta no Supabase

Conta no Mercado Pago com aplicação criada

Conta no Resend (opcional, mas recomendado)

ngrok ou Hookdeck CLI para testar webhooks localmente

🚀 Instalação
bash
# Clone o repositório
git clone https://github.com/Noskine/casamento_VitoriaeSonya.git
cd casamento_VitoriaeSonya

# Instale as dependências
bun install

# Configure as variáveis de ambiente (veja abaixo)
cp .env.example .env.local
🔐 Variáveis de ambiente
Crie um arquivo .env.local na raiz com as variáveis abaixo. Nunca comite este arquivo — ele já está no .gitignore.

bash
# ═══════════════════════════════════════════════════════════
# Supabase
# ═══════════════════════════════════════════════════════════
# Supabase → Project Settings → API
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# ═══════════════════════════════════════════════════════════
# Painel Admin
# ═══════════════════════════════════════════════════════════
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

# ═══════════════════════════════════════════════════════════
# Mercado Pago
# ═══════════════════════════════════════════════════════════
# Painel MP → Suas integrações → Credenciais de produção
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
MERCADOPAGO_PUBLIC_KEY="APP_USR-..."
MERCADOPAGO_WEBHOOK_SECRET="..."

# ═══════════════════════════════════════════════════════════
# Site
# ═══════════════════════════════════════════════════════════
# URL pública (usada em back_urls e notification_url do MP)
# Em dev: URL do ngrok. Em prod: domínio da Vercel.
NEXT_PUBLIC_SITE_URL="https://seu-site.vercel.app"

# ═══════════════════════════════════════════════════════════
# Resend (opcional)
# ═══════════════════════════════════════════════════════════
RESEND_API_KEY="re_..."
RSVP_NOTIFY_FROM="Casamento <rsvp@seudominio.com>"
RSVP_NOTIFY_TO="noivos@email.com,convidado@email.com"

# ═══════════════════════════════════════════════════════════
# Prazo do RSVP
# ═══════════════════════════════════════════════════════════
# Definido em lib/rsvp.ts (não usa env por padrão)
Onde encontrar cada valor
Variável	Onde pegar
SUPABASE_URL	Supabase → Settings → API → Project URL
SUPABASE_SERVICE_ROLE_KEY	Supabase → Settings → API → service_role (revelar)
MERCADOPAGO_ACCESS_TOKEN	MP Developers → Credenciais
MERCADOPAGO_WEBHOOK_SECRET	MP Developers → Webhooks → Configurar notificações
RESEND_API_KEY	Resend → API Keys
🗄️ Configuração do banco
1. Rodar o schema no Supabase
Abra o SQL Editor do Supabase e execute:

sql
-- ═══════════════════════════════════════════════════════════
-- Tabela de confirmações de presença
-- ═══════════════════════════════════════════════════════════
create extension if not exists "pgcrypto";

create table if not exists public.rsvps (
  id           uuid primary key default gen_random_uuid(),
  name         varchar(120) not null,
  email        varchar(200) not null,
  phone        varchar(30),
  attending    varchar(3)  not null,
  guests       integer      not null default 0,
  guest_names  text,
  diet         text,
  message      text,
  ip_hash      varchar(64),
  user_agent   varchar(300),
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz  not null default now(),
  constraint rsvps_attending_check check (attending in ('yes', 'no')),
  constraint rsvps_guests_range    check (guests between 0 and 6),
  constraint rsvps_email_unique    unique (email)
);

create index if not exists rsvps_attending_idx  on public.rsvps (attending);
create index if not exists rsvps_created_at_idx on public.rsvps (created_at desc);

-- ═══════════════════════════════════════════════════════════
-- Tabela de presentes
-- ═══════════════════════════════════════════════════════════
create table if not exists public.gifts (
  id            uuid primary key default gen_random_uuid(),
  name          varchar(120) not null,
  description   text,
  image_url     text,
  price_cents   integer not null default 0,
  quota_cents   integer not null default 0,
  external_link text,
  position      integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists gifts_position_idx on public.gifts(position);
create index if not exists gifts_active_idx   on public.gifts(active);

-- ═══════════════════════════════════════════════════════════
-- Tabela de reservas de presentes
-- ═══════════════════════════════════════════════════════════
create table if not exists public.gift_reservations (
  id              uuid primary key default gen_random_uuid(),
  gift_id         uuid not null references public.gifts(id) on delete cascade,
  name            varchar(120) not null,
  email           varchar(200) not null,
  message         text,
  status          varchar(20) not null default 'reserved',
  payment_id      varchar(64),
  payment_status  varchar(20),
  payment_method  varchar(30),
  amount_cents    integer,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  constraint gift_reservations_status_check
    check (status in ('reserved', 'paid', 'cancelled'))
);

create index if not exists gift_reservations_gift_id_idx
  on public.gift_reservations(gift_id);
create index if not exists gift_reservations_payment_id_idx
  on public.gift_reservations(payment_id);

-- ═══════════════════════════════════════════════════════════
-- Trigger para manter updated_at
-- ═══════════════════════════════════════════════════════════
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists rsvps_touch on public.rsvps;
create trigger rsvps_touch
  before update on public.rsvps
  for each row execute function public.touch_updated_at();

drop trigger if exists gifts_touch on public.gifts;
create trigger gifts_touch
  before update on public.gifts
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════════════════════════════════════
-- Segurança (RLS)
-- ═══════════════════════════════════════════════════════════
alter table public.rsvps              enable row level security;
alter table public.gifts              enable row level security;
alter table public.gift_reservations  enable row level security;
2. Criar o bucket de imagens
Supabase → Storage → New bucket

Nome: gifts

Marque Public bucket

Vá em Policies e adicione:

sql
create policy "Gift images são públicas"
on storage.objects for select
to public
using (bucket_id = 'gifts');
3. (Opcional) Cron job para expirar reservas
Se você quer que reservas não pagas sejam liberadas em 30 minutos:

sql
create extension if not exists pg_cron;

create or replace function public.expire_stale_reservations()
returns void language plpgsql as $$
begin
  delete from public.gift_reservations
  where status = 'reserved'
    and payment_status = 'pending'
    and created_at < now() - interval '30 minutes';
end;
$$;

select cron.schedule(
  'expire-gift-reservations',
  '* * * * *',
  'select public.expire_stale_reservations();'
);
🏃 Rodando localmente
bash
# Modo desenvolvimento
bun run dev
Acesse http://localhost:3000.

Para testar webhooks do Mercado Pago
O Mercado Pago não aceita localhost como URL de notificação. Você precisa de um túnel:

bash
# Em um terminal separado
ngrok http 3000
Copie a URL gerada (ex: https://abc123.ngrok-free.dev) e ajuste no .env.local:

bash
NEXT_PUBLIC_SITE_URL="https://abc123.ngrok-free.dev"
Reinicie o bun run dev. No painel do Mercado Pago, atualize a URL do webhook para:

text
https://abc123.ngrok-free.dev/api/webhooks/mercadopago
💡 Alternativa: o Hookdeck CLI oferece URLs permanentes e gratuitas, o que evita ter que reconfigurar o webhook a cada reinicialização.

🧪 Testes
bash
# Rodar uma vez
npx vitest run

# Modo watch
npx vitest

# Com cobertura
npx vitest run --coverage
⚠️ Use npx vitest, não bun test. O Bun tem incompatibilidades conhecidas com jsdom e as APIs de coverage do Node. O npx resolve para o Node.js do sistema.

Cobertura atual:

Arquivo	Testes
lib/rsvp.test.ts	Lógica de prazo
lib/rsvp-schema.test.ts	Validação do RSVP
lib/gift-schema.test.ts	Validação de presentes + formatação BRL
app/api/rsvp/route.test.ts	Rotas POST/GET do RSVP
app/api/gifts/[id]/reserve/route.test.ts	Rota de reserva
components/gifts/GiftCard.test.tsx	Renderização do card
📁 Estrutura do projeto
text
.
├── app/
│   ├── admin/                    # Painel protegido
│   │   ├── login/                # Tela de login
│   │   ├── presentes/            # Gerenciamento de presentes
│   │   ├── actions.ts            # Server actions (login/logout)
│   │   ├── DashboardClient.tsx   # UI do dashboard
│   │   └── page.tsx
│   ├── api/
│   │   ├── rsvp/                 # POST (criar) e GET (listar)
│   │   ├── gifts/
│   │   │   ├── [id]/
│   │   │   │   ├── reserve/      # Reserva + preferência MP
│   │   │   │   └── route.ts      # DELETE/PATCH do admin
│   │   │   └── route.ts          # GET (listar) e POST (criar)
│   │   ├── reservations/
│   │   │   └── [id]/
│   │   │       ├── status/       # Polling do status
│   │   │       └── sync/         # Sincronização manual
│   │   ├── upload/               # Upload de imagens
│   │   └── webhooks/
│   │       └── mercadopago/      # Recebe notificações do MP
│   ├── presentes/
│   │   ├── obrigado/             # Página de retorno pós-pagamento
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx                  # Home (convite)
│   └── globals.css
├── components/
│   ├── admin/
│   │   └── ImageUploader.tsx
│   ├── gifts/
│   │   ├── GiftsSection.tsx      # Server component da home
│   │   ├── GiftsGrid.tsx         # Client com modal
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
│   ├── email.ts                  # Resend
│   ├── gift-schema.ts            # Zod + formatBRL
│   ├── gift-store.ts             # CRUD de presentes
│   ├── mercadopago.ts            # SDK do MP
│   ├── rate-limit.ts             # 5 req/min por IP
│   ├── rsvp-schema.ts            # Zod
│   ├── rsvp-store.ts             # CRUD de RSVPs
│   ├── rsvp.ts                   # Lógica de prazo
│   └── supabase.ts               # Client singleton
├── test/
│   └── setup.ts
├── vitest.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
🔑 Acessando o painel admin
Acesse /admin/login

Digite a senha definida em ADMIN_PASSWORD

Você é redirecionado para /admin

A sessão dura 7 dias e é armazenada num cookie HTTP-only assinado com ADMIN_SESSION_SECRET. Ninguém consegue forjar sem saber a chave.

Cadastrando um presente
Vá em /admin/presentes

Clique em + Novo presente

Arraste ou clique para enviar a foto (vai direto para o bucket)

Preencha nome, descrição, valor e (opcionalmente) link externo

Clique em Publicar presente

O presente aparece na home imediatamente.

💳 Fluxo de pagamento
text
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
    │  (polling de 3 em 3 segundos no status real)
    │
    ▼
MP envia POST para /api/webhooks/mercadopago
    ├─ valida assinatura HMAC
    ├─ consulta status real no MP
    ├─ atualiza reserva (approved → status: paid)
    └─ envia e-mail para os noivos
⚠️ Testando pagamentos
Cartão: use as credenciais de teste com uma conta de comprador de teste

Número: 5031 4332 1540 6351

CVV: 123

Nome do titular: APRO (força status aprovado)

CPF: gere um válido em geradordecpf.org

Pix: só funciona em produção com uma chave Pix ativa cadastrada na conta do vendedor. Não é possível testar em sandbox — limitação oficial do Mercado Pago.

🚢 Deploy na Vercel
1. Configure as variáveis na Vercel
Settings → Environment Variables. Adicione todas as variáveis do .env.local, marcando Production, Preview e Development.

2. Atualize o webhook do Mercado Pago
No painel do MP, troque a URL do webhook para o domínio de produção:

text
https://seu-site.vercel.app/api/webhooks/mercadopago
3. Ajuste NEXT_PUBLIC_SITE_URL
bash
NEXT_PUBLIC_SITE_URL="https://seu-site.vercel.app"
4. Faça o deploy
bash
git push
💡 Variáveis de ambiente só entram em vigor em builds novos. Depois de adicionar ou alterar qualquer variável na Vercel, force um novo deploy.

🔒 Segurança
Boas práticas implementadas
Service Role Key nunca sai do servidor — todas as chamadas ao Supabase acontecem em Server Components ou API Routes

Cookie de sessão assinado com HMAC-SHA256, HTTP-only, SameSite=Lax

Senha e chave de sessão separadas — mesmo que a senha vaze, o cookie não pode ser forjado

Validação com Zod em todas as rotas de API

Rate limit de 5 req/min por IP nas rotas públicas

IP hasheado com salt antes de salvar (LGPD)

Webhook do MP validado por assinatura HMAC

RLS habilitado no Supabase, bloqueando acesso anônimo

⚠️ Nunca comite
.env.local

Credenciais do Mercado Pago

SUPABASE_SERVICE_ROLE_KEY

ADMIN_SESSION_SECRET

ADMIN_PASSWORD

Se alguma dessas vazar, rotacione imediatamente:

Supabase → Settings → API → Roll na service_role

MP Developers → Credenciais → Renovar Access Token

Vercel → Environment Variables → atualizar

Novo deploy

🐛 Problemas comuns
Sintoma	Causa	Solução
authentication failed no ngrok	Authtoken expirado	ngrok config add-authtoken SEU_TOKEN
ERR_NGROK_8012	App não está na porta 3000	Confirme bun run dev rodando + curl localhost:3000
Build falha com erro de TypeScript	Tipos desatualizados	Rode bunx tsc --noEmit localmente antes do push
Coverage APIs are not supported	Rodou bun test	Use npx vitest run
Pix não aparece no checkout	Sandbox não suporta Pix	Use credenciais de produção com chave Pix ativa
Webhook não chega	URL não configurada ou túnel fechado	Confira painel do MP → Webhooks → Histórico
Login do admin retorna 401	Nomes de variável inconsistentes	Confirme ADMIN_PASSWORD e ADMIN_SESSION_SECRET na Vercel
Imagem não carrega após upload	Bucket não é público	Supabase → Storage → gifts → Tornar público
📝 Comandos úteis
bash
# Desenvolvimento
bun run dev                 # Inicia o servidor

# Build e produção
bun run build               # Build de produção
bun run start               # Roda o build localmente

# Tipagem
bunx tsc --noEmit           # Valida TypeScript sem emitir arquivos

# Testes
npx vitest run              # Roda uma vez
npx vitest                  # Modo watch
npx vitest run --coverage   # Com cobertura

# Lint
bun run lint                # ESLint

# Utilitários
openssl rand -hex 32        # Gera string aleatória segura
ngrok http 3000             # Expõe localhost para webhooks
📄 Licença
Este projeto é de uso pessoal. Sinta-se à vontade para usar como referência, mas por favor não copie o convite ou a identidade visual — cada casamento merece algo único. 🤍

💌 Contato
Vitória & Sonya

Hashtag: #VitoriaESonyaParaSempre

Feito com muito carinho para o nosso grande dia. 💛

Esta resposta é gerada por AI, apenas para referência.