# DATABASE.md — Confessio

> Especificação do banco de dados do MVP do sistema de fila para confissões.
>
> Stack: **Supabase + PostgreSQL + Supabase Auth (somente Admin) + Supabase Realtime**
>
> Este documento deve ser lido em conjunto com o `PRD.md`.

---

## 1. Objetivo do banco

O banco deve suportar uma fila de confissões com:

- fiel **sem login**;
- fila única por sessão;
- múltiplos confessionários/sacerdotes;
- chamadas concorrentes sem duplicidade;
- acompanhamento em tempo real;
- painel público para TV;
- painel operacional do sacerdote;
- painel administrativo;
- nenhuma informação sobre o conteúdo da confissão;
- nenhuma identificação pessoal obrigatória do fiel.

O sistema administra somente o **fluxo de atendimento**.

Ele nunca deve armazenar:

- nome do penitente;
- CPF;
- e-mail;
- pecados;
- motivo da confissão;
- anotações do sacerdote;
- conteúdo da conversa;
- histórico espiritual individual.

Telefone é **opcional**. Só existe para aviso de chamada no WhatsApp. Fica em `ticket_contacts`, nunca em `tickets`, Realtime, telão ou RPC pública. A mesa do padre continua ligada só por `tickets.station_id`.

---

# 2. Decisões arquiteturais

## 2.1 Fiel anônimo

O fiel não utiliza Supabase Auth.

Ao entrar na fila é criado um ticket contendo:

```text
public_code       C-024
anonymous_token   UUID privado
```

`public_code` pode ser exibido publicamente.

`anonymous_token` funciona como credencial privada daquele ticket e deve ficar armazenado apenas no navegador do fiel.

Exemplo:

```json
{
  "sessionId": "uuid-da-sessao",
  "anonymousToken": "uuid-privado",
  "publicCode": "C-024"
}
```

Nunca confiar no `publicCode` armazenado no cliente para autorizar uma operação.

---

## 2.2 Uma única fila

O fiel não escolhe o sacerdote.

Todos os tickets entram na mesma fila da sessão:

```text
C-001
C-002
C-003
C-004
...
```

Cada confessionário disponível chama o próximo ticket elegível.

---

## 2.3 Concorrência resolvida no PostgreSQL

A escolha da próxima senha **não deve acontecer no frontend**.

Não fazer:

```text
SELECT primeiro ticket
↓
frontend
↓
UPDATE ticket
```

A operação deve ser feita pela RPC:

```text
call_next_ticket()
```

usando:

```sql
FOR UPDATE SKIP LOCKED
```

Assim, se dois sacerdotes chamarem simultaneamente:

```text
Padre A → C-024
Padre B → C-025
```

e nunca:

```text
Padre A → C-024
Padre B → C-024
```

---

## 2.4 Realtime sem expor tickets privados

A tabela `tickets` contém `anonymous_token`.

Por isso ela **não deve ter SELECT anônimo**.

O MVP utilizará **Supabase Realtime Broadcast** como mecanismo de invalidação:

```text
Banco mudou
    ↓
Broadcast "queue_changed"
    ↓
Cliente recebe evento
    ↓
Cliente chama novamente a RPC apropriada
    ↓
Estado atualizado
```

O Broadcast não envia o ticket completo.

Payload público:

```json
{
  "entity": "ticket",
  "action": "UPDATE",
  "session_id": "..."
}
```

Não enviar:

```text
anonymous_token
access_token
phone_e164
```

`ticket_contacts` fica fora da publication do Realtime.

---

# 3. Diagrama de domínio

```text
auth.users
    │
    │ 1:N
    ▼
church_admins
    │
    ▼
churches
    │
    │ 1:N
    ▼
confession_sessions
    │
    ├───────────────┐
    │               │
    │ 1:N           │ 1:N
    ▼               ▼
stations          tickets
    │               │
    └───────────────┘
          station_id
                    │
                    │ 1:0..1
                    ▼
              ticket_contacts
```

---

# 4. Entidades

## churches

Representa uma paróquia/igreja.

A partir do MVP-01, `churches.is_active` indica se a paróquia continua operando. Desativar não apaga sessões nem tickets. Exclusão física (CASCADE) fica fora deste ciclo.

Não desativar paróquia com sessão `OPEN` ou `ENTRY_CLOSED`.

Paróquia inativa não aceita sessão nova (`DRAFT`/`OPEN`/`ENTRY_CLOSED`) nem ticket `WAITING`. O estado público (`get_public_session_state`) responde `SESSION_NOT_FOUND`. A secretaria ainda entra em `/admin` para ver o histórico.

## church_admins

Relaciona usuários do Supabase Auth com uma igreja.

O Auth existe apenas para administração.

## confession_sessions

Representa uma sessão de confissões.

Exemplo:

```text
Confissões — Domingo 18h
14/09/2026
18:00–20:00
```

## stations

Representa um confessionário/ponto de atendimento.

Exemplo:

```text
Confessionário 01
Pe. Victor
```

## tickets

Representa uma posição anônima na fila.

Exemplo:

```text
C-024
```

---

# 5. Enums

## session_status

```text
DRAFT
OPEN
ENTRY_CLOSED
FINISHED
CANCELLED
```

## station_status

```text
OFFLINE
AVAILABLE
CALLING
BUSY
PAUSED
```

## ticket_status

```text
WAITING
CALLED
IN_SERVICE
COMPLETED
NO_SHOW
CANCELLED
```

## admin_role

```text
OWNER
ADMIN
```

---

# 6. Estados e transições

## Sessão

```text
DRAFT
  ↓
OPEN
  ↓
ENTRY_CLOSED
  ↓
FINISHED
```

`ends_at` é o horário de fim do agendamento, não o fim do atendimento. Quando a sessão está `OPEN` e `ends_at <= now()`, o PostgreSQL persiste `ENTRY_CLOSED` (`private.close_entry_if_ended`), chamado em `create_ticket`, `admin_issue_paper_tickets`, `get_public_session_state`, `get_station_state` e `admin_get_session_state`. Novos tickets recebem `SESSION_NOT_OPEN`. Quem já está `WAITING` / `CALLED` / `IN_SERVICE` continua até ser atendido, desistir ou o admin finalizar a sessão. Sem `ends_at`, só o admin encerra a entrada. A sessão não vira `FINISHED` sozinha.

Cancelamento excepcional:

```text
DRAFT / OPEN / ENTRY_CLOSED
          ↓
      CANCELLED
```

---

## Confessionário

```text
OFFLINE
   ↓
AVAILABLE
   ↓
CALLING
   ↓
BUSY
   ↓
AVAILABLE
```

Pausa:

```text
AVAILABLE
   ↓
PAUSED
   ↓
AVAILABLE
```

---

## Ticket

```text
WAITING
   ↓
CALLED
   ↓
IN_SERVICE
   ↓
COMPLETED
```

Fluxos alternativos:

```text
WAITING → CANCELLED

CALLED → NO_SHOW
```

---

# 7. Migration inicial

Arquivo sugerido:

```text
supabase/migrations/202609140001_initial_confession_queue.sql
```

A migration abaixo é a base do MVP.

```sql
-- =========================================================
-- EXTENSIONS
-- =========================================================

create extension if not exists pgcrypto;


-- =========================================================
-- PRIVATE SCHEMA
-- =========================================================

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;


-- =========================================================
-- ENUMS
-- =========================================================

create type public.session_status as enum (
  'DRAFT',
  'OPEN',
  'ENTRY_CLOSED',
  'FINISHED',
  'CANCELLED'
);

create type public.station_status as enum (
  'OFFLINE',
  'AVAILABLE',
  'CALLING',
  'BUSY',
  'PAUSED'
);

create type public.ticket_status as enum (
  'WAITING',
  'CALLED',
  'IN_SERVICE',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED'
);

create type public.admin_role as enum (
  'OWNER',
  'ADMIN'
);


-- =========================================================
-- CHURCHES
-- =========================================================

create table public.churches (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,

  logo_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint churches_name_not_blank
    check (char_length(trim(name)) > 0),

  constraint churches_slug_not_blank
    check (char_length(trim(slug)) > 0)
);


-- =========================================================
-- CHURCH ADMINS
-- =========================================================

create table public.church_admins (
  id uuid primary key default gen_random_uuid(),

  church_id uuid not null
    references public.churches(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  role public.admin_role not null default 'ADMIN',

  created_at timestamptz not null default now(),

  constraint church_admins_unique_membership
    unique (church_id, user_id)
);


-- =========================================================
-- CONFESSION SESSIONS
-- =========================================================

create table public.confession_sessions (
  id uuid primary key default gen_random_uuid(),

  church_id uuid not null
    references public.churches(id)
    on delete cascade,

  name text not null,

  slug text not null unique,

  status public.session_status not null default 'DRAFT',

  ticket_prefix text not null default 'C',

  -- contador atômico da sessão
  last_ticket_number integer not null default 0,

  -- fallback utilizado para estimativa de espera
  default_service_minutes smallint not null default 8,

  starts_at timestamptz,
  ends_at timestamptz,

  entry_opened_at timestamptz,
  entry_closed_at timestamptz,
  finished_at timestamptz,

  show_waiting_queue_on_tv boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint confession_sessions_name_not_blank
    check (char_length(trim(name)) > 0),

  constraint confession_sessions_slug_not_blank
    check (char_length(trim(slug)) > 0),

  constraint confession_sessions_prefix_valid
    check (
      char_length(ticket_prefix) between 1 and 5
      and ticket_prefix ~ '^[A-Za-z0-9]+$'
    ),

  constraint confession_sessions_last_ticket_nonnegative
    check (last_ticket_number >= 0),

  constraint confession_sessions_default_minutes_valid
    check (default_service_minutes between 1 and 120),

  constraint confession_sessions_dates_valid
    check (
      starts_at is null
      or ends_at is null
      or starts_at < ends_at
    )
);


-- =========================================================
-- STATIONS / CONFESSIONÁRIOS
-- =========================================================

create table public.stations (
  id uuid primary key default gen_random_uuid(),

  session_id uuid not null
    references public.confession_sessions(id)
    on delete cascade,

  name text not null,

  -- Nome exibido publicamente. Não é necessário existir
  -- uma conta de usuário para cada sacerdote no MVP.
  priest_name text,

  status public.station_status not null default 'OFFLINE',

  -- Credencial operacional do painel do sacerdote.
  -- Não deve aparecer em payloads públicos/realtime.
  access_token uuid not null default gen_random_uuid(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint stations_name_not_blank
    check (char_length(trim(name)) > 0),

  constraint stations_unique_name_per_session
    unique (session_id, name),

  constraint stations_unique_access_token
    unique (access_token)
);


-- =========================================================
-- TICKETS
-- =========================================================

create table public.tickets (
  id uuid primary key default gen_random_uuid(),

  session_id uuid not null
    references public.confession_sessions(id)
    on delete cascade,

  public_number integer not null,

  public_code text not null,

  status public.ticket_status not null default 'WAITING',

  -- Credencial privada do fiel.
  anonymous_token uuid not null default gen_random_uuid(),

  station_id uuid
    references public.stations(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  called_at timestamptz,
  last_recalled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  cancelled_at timestamptz,
  no_show_at timestamptz,

  recall_count integer not null default 0,

  constraint tickets_public_number_positive
    check (public_number > 0),

  constraint tickets_recall_count_nonnegative
    check (recall_count >= 0),

  constraint tickets_unique_number_per_session
    unique (session_id, public_number),

  constraint tickets_unique_code_per_session
    unique (session_id, public_code),

  constraint tickets_unique_anonymous_token
    unique (anonymous_token)
);


-- =========================================================
-- TICKET CONTACTS
-- Contato privado para WhatsApp. Não entra no Realtime.
-- =========================================================

create table public.ticket_contacts (
  ticket_id uuid primary key
    references public.tickets(id)
    on delete cascade,

  -- E.164, ex.: +5511999999999
  phone_e164 text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ticket_contacts_phone_e164_format
    check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);


-- =========================================================
-- INDEXES
-- =========================================================

create index tickets_session_status_number_idx
  on public.tickets(session_id, status, public_number);

create index tickets_session_created_idx
  on public.tickets(session_id, created_at);

create index tickets_station_status_idx
  on public.tickets(station_id, status)
  where station_id is not null;

create index stations_session_status_idx
  on public.stations(session_id, status);

create index confession_sessions_church_status_idx
  on public.confession_sessions(church_id, status);

create index church_admins_user_idx
  on public.church_admins(user_id);

-- Uma estação só pode possuir UM ticket ativo.
create unique index tickets_one_active_per_station_idx
  on public.tickets(station_id)
  where
    station_id is not null
    and status in ('CALLED', 'IN_SERVICE');


-- =========================================================
-- UPDATED_AT
-- =========================================================

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger churches_set_updated_at
before update on public.churches
for each row execute function private.set_updated_at();

create trigger confession_sessions_set_updated_at
before update on public.confession_sessions
for each row execute function private.set_updated_at();

create trigger stations_set_updated_at
before update on public.stations
for each row execute function private.set_updated_at();

create trigger tickets_set_updated_at
before update on public.tickets
for each row execute function private.set_updated_at();


-- =========================================================
-- ADMIN HELPER
-- =========================================================

create or replace function private.is_church_admin(
  p_church_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.church_admins ca
    where ca.church_id = p_church_id
      and ca.user_id = (select auth.uid())
  );
$$;


-- =========================================================
-- RLS
-- =========================================================

alter table public.churches enable row level security;
alter table public.church_admins enable row level security;
alter table public.confession_sessions enable row level security;
alter table public.stations enable row level security;
alter table public.tickets enable row level security;


-- =========================================================
-- GRANTS
-- =========================================================

-- O visitante anônimo NÃO acessa diretamente as tabelas.
revoke all on public.churches from anon;
revoke all on public.church_admins from anon;
revoke all on public.confession_sessions from anon;
revoke all on public.stations from anon;
revoke all on public.tickets from anon;

-- Tickets também não ficam diretamente acessíveis ao
-- authenticated. O Admin consulta tickets por RPC sanitizada.
revoke all on public.tickets from authenticated;

-- Administração das entidades não sensíveis.
grant select on public.churches to authenticated;
grant select on public.church_admins to authenticated;

grant select, insert, update, delete
  on public.confession_sessions
  to authenticated;

grant select, insert, update, delete
  on public.stations
  to authenticated;


-- =========================================================
-- RLS: CHURCHES
-- =========================================================

create policy "admins can view own churches"
on public.churches
for select
to authenticated
using (
  private.is_church_admin(id)
);


-- =========================================================
-- RLS: CHURCH ADMINS
-- =========================================================

create policy "admins can view own memberships"
on public.church_admins
for select
to authenticated
using (
  user_id = (select auth.uid())
);


-- =========================================================
-- RLS: SESSIONS
-- =========================================================

create policy "admins can view sessions"
on public.confession_sessions
for select
to authenticated
using (
  private.is_church_admin(church_id)
);

create policy "admins can create sessions"
on public.confession_sessions
for insert
to authenticated
with check (
  private.is_church_admin(church_id)
);

create policy "admins can update sessions"
on public.confession_sessions
for update
to authenticated
using (
  private.is_church_admin(church_id)
)
with check (
  private.is_church_admin(church_id)
);

create policy "admins can delete draft sessions"
on public.confession_sessions
for delete
to authenticated
using (
  status = 'DRAFT'
  and private.is_church_admin(church_id)
);


-- =========================================================
-- RLS: STATIONS
-- =========================================================

create policy "admins can view stations"
on public.stations
for select
to authenticated
using (
  exists (
    select 1
    from public.confession_sessions cs
    where cs.id = stations.session_id
      and private.is_church_admin(cs.church_id)
  )
);

create policy "admins can create stations"
on public.stations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.confession_sessions cs
    where cs.id = stations.session_id
      and private.is_church_admin(cs.church_id)
  )
);

create policy "admins can update stations"
on public.stations
for update
to authenticated
using (
  exists (
    select 1
    from public.confession_sessions cs
    where cs.id = stations.session_id
      and private.is_church_admin(cs.church_id)
  )
)
with check (
  exists (
    select 1
    from public.confession_sessions cs
    where cs.id = stations.session_id
      and private.is_church_admin(cs.church_id)
  )
);

create policy "admins can delete stations"
on public.stations
for delete
to authenticated
using (
  exists (
    select 1
    from public.confession_sessions cs
    where cs.id = stations.session_id
      and cs.status = 'DRAFT'
      and private.is_church_admin(cs.church_id)
  )
);


-- =========================================================
-- CREATE TICKET
-- =========================================================

create or replace function public.create_ticket(
  p_session_id uuid,
  p_phone_e164 text default null
)
returns table (
  ticket_id uuid,
  public_code text,
  anonymous_token uuid,
  ticket_status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefix text;
  v_number integer;
  v_ticket_id uuid := gen_random_uuid();
  v_token uuid := gen_random_uuid();
  v_created_at timestamptz := now();
begin
  -- UPDATE da sessão funciona como contador atômico.
  update public.confession_sessions
  set last_ticket_number = last_ticket_number + 1
  where id = p_session_id
    and status = 'OPEN'
  returning ticket_prefix, last_ticket_number
  into v_prefix, v_number;

  if not found then
    raise exception 'SESSION_NOT_OPEN'
      using errcode = 'P0001';
  end if;

  insert into public.tickets (
    id,
    session_id,
    public_number,
    public_code,
    anonymous_token,
    status,
    created_at
  )
  values (
    v_ticket_id,
    p_session_id,
    v_number,
    upper(v_prefix) || '-' || lpad(v_number::text, 3, '0'),
    v_token,
    'WAITING',
    v_created_at
  );

  return query
  select
    v_ticket_id,
    upper(v_prefix) || '-' || lpad(v_number::text, 3, '0'),
    v_token,
    'WAITING'::text,
    v_created_at;
end;
$$;


-- =========================================================
-- GET MY TICKET
-- =========================================================

create or replace function public.get_my_ticket(
  p_anonymous_token uuid
)
returns table (
  ticket_id uuid,
  session_id uuid,
  session_name text,
  session_status text,
  public_code text,
  ticket_status text,
  people_ahead bigint,
  station_id uuid,
  station_name text,
  estimated_wait_minutes integer,
  called_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.tickets%rowtype;
  v_session public.confession_sessions%rowtype;
  v_people_ahead bigint;
  v_active_stations integer;
  v_average_minutes numeric;
  v_estimated integer;
begin
  select *
  into v_ticket
  from public.tickets
  where anonymous_token = p_anonymous_token;

  if not found then
    raise exception 'TICKET_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  select *
  into v_session
  from public.confession_sessions
  where id = v_ticket.session_id;

  select count(*)
  into v_people_ahead
  from public.tickets t
  where t.session_id = v_ticket.session_id
    and t.status = 'WAITING'
    and t.public_number < v_ticket.public_number;

  select count(*)
  into v_active_stations
  from public.stations s
  where s.session_id = v_ticket.session_id
    and s.status in ('AVAILABLE', 'CALLING', 'BUSY');

  select coalesce(
    avg(
      extract(epoch from (t.finished_at - t.started_at)) / 60.0
    ),
    v_session.default_service_minutes::numeric
  )
  into v_average_minutes
  from public.tickets t
  where t.session_id = v_ticket.session_id
    and t.status = 'COMPLETED'
    and t.started_at is not null
    and t.finished_at is not null
    and t.finished_at > t.started_at;

  if v_ticket.status = 'WAITING'
     and v_active_stations > 0 then
    v_estimated :=
      ceil(
        v_people_ahead::numeric /
        v_active_stations::numeric
      )::integer
      * ceil(v_average_minutes)::integer;
  else
    v_estimated := null;
  end if;

  return query
  select
    v_ticket.id,
    v_ticket.session_id,
    v_session.name,
    v_session.status::text,
    v_ticket.public_code,
    v_ticket.status::text,
    v_people_ahead,
    v_ticket.station_id,
    s.name,
    v_estimated,
    v_ticket.called_at,
    v_ticket.started_at,
    v_ticket.finished_at
  from (select 1) dummy
  left join public.stations s
    on s.id = v_ticket.station_id;
end;
$$;


-- =========================================================
-- CANCEL TICKET
-- =========================================================

create or replace function public.cancel_ticket(
  p_anonymous_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tickets
  set
    status = 'CANCELLED',
    cancelled_at = now()
  where anonymous_token = p_anonymous_token
    and status = 'WAITING';

  if not found then
    return false;
  end if;

  return true;
end;
$$;


-- =========================================================
-- CALL NEXT TICKET
-- =========================================================

create or replace function public.call_next_ticket(
  p_station_id uuid,
  p_access_token uuid
)
returns table (
  ticket_id uuid,
  public_code text,
  called_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_station_status public.station_status;
  v_session_status public.session_status;
  v_ticket_id uuid;
  v_public_code text;
  v_called_at timestamptz := now();
begin
  -- Bloqueia a estação enquanto valida/opera.
  select
    s.session_id,
    s.status,
    cs.status
  into
    v_session_id,
    v_station_status,
    v_session_status
  from public.stations s
  join public.confession_sessions cs
    on cs.id = s.session_id
  where s.id = p_station_id
    and s.access_token = p_access_token
  for update of s;

  if not found then
    raise exception 'INVALID_STATION_ACCESS'
      using errcode = 'P0001';
  end if;

  if v_station_status <> 'AVAILABLE' then
    raise exception 'STATION_NOT_AVAILABLE'
      using errcode = 'P0001';
  end if;

  if v_session_status not in ('OPEN', 'ENTRY_CLOSED') then
    raise exception 'SESSION_NOT_ACTIVE'
      using errcode = 'P0001';
  end if;

  -- Esta é a parte crítica de concorrência.
  select
    t.id,
    t.public_code
  into
    v_ticket_id,
    v_public_code
  from public.tickets t
  where t.session_id = v_session_id
    and t.status = 'WAITING'
  order by t.public_number asc
  for update skip locked
  limit 1;

  if not found then
    raise exception 'QUEUE_EMPTY'
      using errcode = 'P0001';
  end if;

  update public.tickets
  set
    status = 'CALLED',
    station_id = p_station_id,
    called_at = v_called_at
  where id = v_ticket_id;

  update public.stations
  set status = 'CALLING'
  where id = p_station_id;

  return query
  select
    v_ticket_id,
    v_public_code,
    v_called_at;
end;
$$;


-- =========================================================
-- RECALL CURRENT TICKET
-- =========================================================

create or replace function public.recall_current_ticket(
  p_station_id uuid,
  p_access_token uuid
)
returns table (
  ticket_id uuid,
  public_code text,
  recall_count integer,
  recalled_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket_id uuid;
  v_public_code text;
  v_recall_count integer;
  v_now timestamptz := now();
begin
  perform 1
  from public.stations s
  where s.id = p_station_id
    and s.access_token = p_access_token
    and s.status = 'CALLING';

  if not found then
    raise exception 'INVALID_STATION_STATE'
      using errcode = 'P0001';
  end if;

  update public.tickets
  set
    recall_count = recall_count + 1,
    last_recalled_at = v_now
  where station_id = p_station_id
    and status = 'CALLED'
  returning
    id,
    public_code,
    tickets.recall_count
  into
    v_ticket_id,
    v_public_code,
    v_recall_count;

  if not found then
    raise exception 'NO_CALLED_TICKET'
      using errcode = 'P0001';
  end if;

  return query
  select
    v_ticket_id,
    v_public_code,
    v_recall_count,
    v_now;
end;
$$;


-- =========================================================
-- START SERVICE
-- =========================================================

create or replace function public.start_service(
  p_station_id uuid,
  p_access_token uuid
)
returns table (
  ticket_id uuid,
  public_code text,
  started_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket_id uuid;
  v_public_code text;
  v_started_at timestamptz := now();
begin
  perform 1
  from public.stations s
  where s.id = p_station_id
    and s.access_token = p_access_token
    and s.status = 'CALLING'
  for update;

  if not found then
    raise exception 'INVALID_STATION_STATE'
      using errcode = 'P0001';
  end if;

  update public.tickets
  set
    status = 'IN_SERVICE',
    started_at = v_started_at
  where station_id = p_station_id
    and status = 'CALLED'
  returning id, public_code
  into v_ticket_id, v_public_code;

  if not found then
    raise exception 'NO_CALLED_TICKET'
      using errcode = 'P0001';
  end if;

  update public.stations
  set status = 'BUSY'
  where id = p_station_id;

  return query
  select
    v_ticket_id,
    v_public_code,
    v_started_at;
end;
$$;


-- =========================================================
-- FINISH SERVICE
-- =========================================================

create or replace function public.finish_service(
  p_station_id uuid,
  p_access_token uuid
)
returns table (
  ticket_id uuid,
  public_code text,
  finished_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket_id uuid;
  v_public_code text;
  v_finished_at timestamptz := now();
begin
  perform 1
  from public.stations s
  where s.id = p_station_id
    and s.access_token = p_access_token
    and s.status = 'BUSY'
  for update;

  if not found then
    raise exception 'INVALID_STATION_STATE'
      using errcode = 'P0001';
  end if;

  update public.tickets
  set
    status = 'COMPLETED',
    finished_at = v_finished_at
  where station_id = p_station_id
    and status = 'IN_SERVICE'
  returning id, public_code
  into v_ticket_id, v_public_code;

  if not found then
    raise exception 'NO_ACTIVE_TICKET'
      using errcode = 'P0001';
  end if;

  update public.stations
  set status = 'AVAILABLE'
  where id = p_station_id;

  return query
  select
    v_ticket_id,
    v_public_code,
    v_finished_at;
end;
$$;


-- =========================================================
-- NO SHOW
-- =========================================================

create or replace function public.mark_no_show(
  p_station_id uuid,
  p_access_token uuid
)
returns table (
  ticket_id uuid,
  public_code text,
  no_show_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket_id uuid;
  v_public_code text;
  v_no_show_at timestamptz := now();
begin
  perform 1
  from public.stations s
  where s.id = p_station_id
    and s.access_token = p_access_token
    and s.status = 'CALLING'
  for update;

  if not found then
    raise exception 'INVALID_STATION_STATE'
      using errcode = 'P0001';
  end if;

  update public.tickets
  set
    status = 'NO_SHOW',
    no_show_at = v_no_show_at
  where station_id = p_station_id
    and status = 'CALLED'
  returning id, public_code
  into v_ticket_id, v_public_code;

  if not found then
    raise exception 'NO_CALLED_TICKET'
      using errcode = 'P0001';
  end if;

  update public.stations
  set status = 'AVAILABLE'
  where id = p_station_id;

  return query
  select
    v_ticket_id,
    v_public_code,
    v_no_show_at;
end;
$$;


-- =========================================================
-- PAUSE STATION
-- =========================================================

create or replace function public.pause_station(
  p_station_id uuid,
  p_access_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.stations
  set status = 'PAUSED'
  where id = p_station_id
    and access_token = p_access_token
    and status = 'AVAILABLE';

  if not found then
    raise exception 'STATION_CANNOT_BE_PAUSED'
      using errcode = 'P0001';
  end if;

  return true;
end;
$$;


-- =========================================================
-- RESUME / ACTIVATE STATION
-- =========================================================

create or replace function public.resume_station(
  p_station_id uuid,
  p_access_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.stations s
  set status = 'AVAILABLE'
  from public.confession_sessions cs
  where s.id = p_station_id
    and s.access_token = p_access_token
    and s.session_id = cs.id
    and s.status in ('PAUSED', 'OFFLINE')
    and cs.status in ('OPEN', 'ENTRY_CLOSED');

  if not found then
    raise exception 'STATION_CANNOT_BE_RESUMED'
      using errcode = 'P0001';
  end if;

  return true;
end;
$$;


-- =========================================================
-- GO OFFLINE
-- =========================================================

create or replace function public.set_station_offline(
  p_station_id uuid,
  p_access_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.stations
  set status = 'OFFLINE'
  where id = p_station_id
    and access_token = p_access_token
    and status in ('AVAILABLE', 'PAUSED');

  if not found then
    raise exception 'STATION_CANNOT_GO_OFFLINE'
      using errcode = 'P0001';
  end if;

  return true;
end;
$$;


-- =========================================================
-- PRIEST STATION STATE
-- =========================================================

create or replace function public.get_station_state(
  p_station_id uuid,
  p_access_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_station public.stations%rowtype;
  v_session public.confession_sessions%rowtype;
  v_waiting_count bigint;
  v_current_ticket jsonb;
begin
  select *
  into v_station
  from public.stations
  where id = p_station_id
    and access_token = p_access_token;

  if not found then
    raise exception 'INVALID_STATION_ACCESS'
      using errcode = 'P0001';
  end if;

  select *
  into v_session
  from public.confession_sessions
  where id = v_station.session_id;

  select count(*)
  into v_waiting_count
  from public.tickets
  where session_id = v_station.session_id
    and status = 'WAITING';

  select jsonb_build_object(
    'id', t.id,
    'public_code', t.public_code,
    'status', t.status,
    'called_at', t.called_at,
    'last_recalled_at', t.last_recalled_at,
    'started_at', t.started_at,
    'recall_count', t.recall_count
  )
  into v_current_ticket
  from public.tickets t
  where t.station_id = v_station.id
    and t.status in ('CALLED', 'IN_SERVICE')
  limit 1;

  return jsonb_build_object(
    'session', jsonb_build_object(
      'id', v_session.id,
      'name', v_session.name,
      'status', v_session.status
    ),
    'station', jsonb_build_object(
      'id', v_station.id,
      'name', v_station.name,
      'priest_name', v_station.priest_name,
      'status', v_station.status
    ),
    'waiting_count', v_waiting_count,
    'current_ticket', v_current_ticket
  );
end;
$$;


-- =========================================================
-- PUBLIC SESSION STATE
-- TV + tela inicial do fiel
-- =========================================================

create or replace function public.get_public_session_state(
  p_session_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.confession_sessions%rowtype;
  v_church public.churches%rowtype;
  v_waiting_count bigint;
  v_stations jsonb;
  v_waiting_codes jsonb;
  v_latest_call jsonb;
begin
  select *
  into v_session
  from public.confession_sessions
  where slug = p_session_slug
    and status <> 'DRAFT';

  if not found then
    raise exception 'SESSION_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  select *
  into v_church
  from public.churches
  where id = v_session.church_id;

  select count(*)
  into v_waiting_count
  from public.tickets
  where session_id = v_session.id
    and status = 'WAITING';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'priest_name', s.priest_name,
        'status', s.status,
        'current_ticket', (
          select jsonb_build_object(
            'public_code', t.public_code,
            'status', t.status,
            'called_at', t.called_at,
            'started_at', t.started_at
          )
          from public.tickets t
          where t.station_id = s.id
            and t.status in ('CALLED', 'IN_SERVICE')
          limit 1
        )
      )
      order by s.name
    ),
    '[]'::jsonb
  )
  into v_stations
  from public.stations s
  where s.session_id = v_session.id;

  if v_session.show_waiting_queue_on_tv then
    select coalesce(
      jsonb_agg(x.public_code order by x.public_number),
      '[]'::jsonb
    )
    into v_waiting_codes
    from (
      select public_code, public_number
      from public.tickets
      where session_id = v_session.id
        and status = 'WAITING'
      order by public_number
      limit 10
    ) x;
  else
    v_waiting_codes := '[]'::jsonb;
  end if;

  select jsonb_build_object(
    'public_code', t.public_code,
    'station_id', s.id,
    'station_name', s.name,
    'called_at', t.called_at,
    'last_recalled_at', t.last_recalled_at
  )
  into v_latest_call
  from public.tickets t
  join public.stations s
    on s.id = t.station_id
  where t.session_id = v_session.id
    and t.status = 'CALLED'
  order by coalesce(t.last_recalled_at, t.called_at) desc
  limit 1;

  return jsonb_build_object(
    'church', jsonb_build_object(
      'id', v_church.id,
      'name', v_church.name,
      'slug', v_church.slug,
      'logo_url', v_church.logo_url
    ),
    'session', jsonb_build_object(
      'id', v_session.id,
      'name', v_session.name,
      'slug', v_session.slug,
      'status', v_session.status,
      'starts_at', v_session.starts_at,
      'ends_at', v_session.ends_at,
      'show_waiting_queue_on_tv',
        v_session.show_waiting_queue_on_tv
    ),
    'waiting_count', v_waiting_count,
    'waiting_codes', v_waiting_codes,
    'stations', v_stations,
    'latest_call', v_latest_call
  );
end;
$$;


-- =========================================================
-- ADMIN SESSION STATE
-- =========================================================

create or replace function public.admin_get_session_state(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.confession_sessions%rowtype;
  v_is_admin boolean;
  v_stations jsonb;
  v_tickets jsonb;
  v_total bigint;
  v_waiting bigint;
  v_called bigint;
  v_in_service bigint;
  v_completed bigint;
  v_no_show bigint;
  v_cancelled bigint;
  v_avg_service numeric;
begin
  select *
  into v_session
  from public.confession_sessions
  where id = p_session_id;

  if not found then
    raise exception 'SESSION_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  select private.is_church_admin(v_session.church_id)
  into v_is_admin;

  if not coalesce(v_is_admin, false) then
    raise exception 'FORBIDDEN'
      using errcode = '42501';
  end if;

  select
    count(*),
    count(*) filter (where status = 'WAITING'),
    count(*) filter (where status = 'CALLED'),
    count(*) filter (where status = 'IN_SERVICE'),
    count(*) filter (where status = 'COMPLETED'),
    count(*) filter (where status = 'NO_SHOW'),
    count(*) filter (where status = 'CANCELLED'),
    avg(
      extract(epoch from (finished_at - started_at)) / 60.0
    ) filter (
      where status = 'COMPLETED'
        and started_at is not null
        and finished_at is not null
        and finished_at > started_at
    )
  into
    v_total,
    v_waiting,
    v_called,
    v_in_service,
    v_completed,
    v_no_show,
    v_cancelled,
    v_avg_service
  from public.tickets
  where session_id = p_session_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'priest_name', s.priest_name,
        'status', s.status
      )
      order by s.name
    ),
    '[]'::jsonb
  )
  into v_stations
  from public.stations s
  where s.session_id = p_session_id;

  -- anonymous_token propositalmente NÃO é retornado.
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'public_number', t.public_number,
        'public_code', t.public_code,
        'status', t.status,
        'station_id', t.station_id,
        'created_at', t.created_at,
        'called_at', t.called_at,
        'started_at', t.started_at,
        'finished_at', t.finished_at,
        'no_show_at', t.no_show_at,
        'cancelled_at', t.cancelled_at,
        'recall_count', t.recall_count
      )
      order by t.public_number
    ),
    '[]'::jsonb
  )
  into v_tickets
  from public.tickets t
  where t.session_id = p_session_id;

  return jsonb_build_object(
    'session', jsonb_build_object(
      'id', v_session.id,
      'name', v_session.name,
      'slug', v_session.slug,
      'status', v_session.status,
      'starts_at', v_session.starts_at,
      'ends_at', v_session.ends_at
    ),
    'metrics', jsonb_build_object(
      'total', v_total,
      'waiting', v_waiting,
      'called', v_called,
      'in_service', v_in_service,
      'completed', v_completed,
      'no_show', v_no_show,
      'cancelled', v_cancelled,
      'average_service_minutes',
        case
          when v_avg_service is null then null
          else round(v_avg_service, 1)
        end
    ),
    'stations', v_stations,
    'tickets', v_tickets
  );
end;
$$;


-- =========================================================
-- ADMIN SESSION LIFECYCLE
-- =========================================================

create or replace function public.admin_open_session(
  p_session_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_church_id uuid;
begin
  select church_id
  into v_church_id
  from public.confession_sessions
  where id = p_session_id
    and status = 'DRAFT'
  for update;

  if not found then
    raise exception 'SESSION_NOT_DRAFT'
      using errcode = 'P0001';
  end if;

  if not private.is_church_admin(v_church_id) then
    raise exception 'FORBIDDEN'
      using errcode = '42501';
  end if;

  update public.confession_sessions
  set
    status = 'OPEN',
    entry_opened_at = now()
  where id = p_session_id;

  return true;
end;
$$;


create or replace function public.admin_close_session_entry(
  p_session_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_church_id uuid;
begin
  select church_id
  into v_church_id
  from public.confession_sessions
  where id = p_session_id
    and status = 'OPEN'
  for update;

  if not found then
    raise exception 'SESSION_NOT_OPEN'
      using errcode = 'P0001';
  end if;

  if not private.is_church_admin(v_church_id) then
    raise exception 'FORBIDDEN'
      using errcode = '42501';
  end if;

  update public.confession_sessions
  set
    status = 'ENTRY_CLOSED',
    entry_closed_at = now()
  where id = p_session_id;

  return true;
end;
$$;


create or replace function public.admin_finish_session(
  p_session_id uuid,
  p_force boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_church_id uuid;
  v_active_tickets bigint;
begin
  select church_id
  into v_church_id
  from public.confession_sessions
  where id = p_session_id
    and status in ('OPEN', 'ENTRY_CLOSED')
  for update;

  if not found then
    raise exception 'SESSION_NOT_ACTIVE'
      using errcode = 'P0001';
  end if;

  if not private.is_church_admin(v_church_id) then
    raise exception 'FORBIDDEN'
      using errcode = '42501';
  end if;

  select count(*)
  into v_active_tickets
  from public.tickets
  where session_id = p_session_id
    and status in ('WAITING', 'CALLED', 'IN_SERVICE');

  if v_active_tickets > 0 and not p_force then
    raise exception 'SESSION_HAS_ACTIVE_TICKETS'
      using errcode = 'P0001';
  end if;

  if p_force then
    update public.tickets
    set
      status = 'CANCELLED',
      cancelled_at = now()
    where session_id = p_session_id
      and status = 'WAITING';

    -- Não finaliza silenciosamente uma confissão em andamento.
    if exists (
      select 1
      from public.tickets
      where session_id = p_session_id
        and status in ('CALLED', 'IN_SERVICE')
    ) then
      raise exception 'SESSION_HAS_ACTIVE_SERVICE'
        using errcode = 'P0001';
    end if;
  end if;

  update public.stations
  set status = 'OFFLINE'
  where session_id = p_session_id
    and status in ('AVAILABLE', 'PAUSED');

  update public.confession_sessions
  set
    status = 'FINISHED',
    finished_at = now(),
    entry_closed_at = coalesce(entry_closed_at, now())
  where id = p_session_id;

  return true;
end;
$$;


-- =========================================================
-- REALTIME BROADCAST
-- =========================================================

-- Broadcast propositalmente pequeno.
-- O cliente recebe apenas uma invalidação e refaz sua RPC.
-- anonymous_token e access_token NUNCA entram no payload.

create or replace function private.broadcast_ticket_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
begin
  if tg_op = 'DELETE' then
    v_session_id := old.session_id;
  else
    v_session_id := new.session_id;
  end if;

  perform realtime.send(
    jsonb_build_object(
      'entity', 'ticket',
      'action', tg_op,
      'session_id', v_session_id
    ),
    'queue_changed',
    'session:' || v_session_id::text,
    false
  );

  return coalesce(new, old);
end;
$$;


create or replace function private.broadcast_station_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
begin
  if tg_op = 'DELETE' then
    v_session_id := old.session_id;
  else
    v_session_id := new.session_id;
  end if;

  perform realtime.send(
    jsonb_build_object(
      'entity', 'station',
      'action', tg_op,
      'session_id', v_session_id
    ),
    'queue_changed',
    'session:' || v_session_id::text,
    false
  );

  return coalesce(new, old);
end;
$$;


create or replace function private.broadcast_session_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
begin
  if tg_op = 'DELETE' then
    v_session_id := old.id;
  else
    v_session_id := new.id;
  end if;

  perform realtime.send(
    jsonb_build_object(
      'entity', 'session',
      'action', tg_op,
      'session_id', v_session_id
    ),
    'queue_changed',
    'session:' || v_session_id::text,
    false
  );

  return coalesce(new, old);
end;
$$;


create trigger tickets_broadcast_change
after insert or update or delete
on public.tickets
for each row
execute function private.broadcast_ticket_change();

create trigger stations_broadcast_change
after insert or update or delete
on public.stations
for each row
execute function private.broadcast_station_change();

create trigger sessions_broadcast_change
after update
on public.confession_sessions
for each row
execute function private.broadcast_session_change();


-- =========================================================
-- FUNCTION PERMISSIONS
-- =========================================================

revoke execute on function public.create_ticket(uuid)
  from public;

revoke execute on function public.get_my_ticket(uuid)
  from public;

revoke execute on function public.cancel_ticket(uuid)
  from public;

revoke execute on function public.call_next_ticket(uuid, uuid)
  from public;

revoke execute on function public.recall_current_ticket(uuid, uuid)
  from public;

revoke execute on function public.start_service(uuid, uuid)
  from public;

revoke execute on function public.finish_service(uuid, uuid)
  from public;

revoke execute on function public.mark_no_show(uuid, uuid)
  from public;

revoke execute on function public.pause_station(uuid, uuid)
  from public;

revoke execute on function public.resume_station(uuid, uuid)
  from public;

revoke execute on function public.set_station_offline(uuid, uuid)
  from public;

revoke execute on function public.get_station_state(uuid, uuid)
  from public;

revoke execute on function public.get_public_session_state(text)
  from public;

revoke execute on function public.admin_get_session_state(uuid)
  from public;

revoke execute on function public.admin_open_session(uuid)
  from public;

revoke execute on function public.admin_close_session_entry(uuid)
  from public;

revoke execute on function public.admin_finish_session(uuid, boolean)
  from public;


-- Fiel / TV / Padre usam a role anon através das RPCs.
grant execute on function public.create_ticket(uuid)
  to anon, authenticated;

grant execute on function public.get_my_ticket(uuid)
  to anon, authenticated;

grant execute on function public.cancel_ticket(uuid)
  to anon, authenticated;

grant execute on function public.get_public_session_state(text)
  to anon, authenticated;

grant execute on function public.call_next_ticket(uuid, uuid)
  to anon, authenticated;

grant execute on function public.recall_current_ticket(uuid, uuid)
  to anon, authenticated;

grant execute on function public.start_service(uuid, uuid)
  to anon, authenticated;

grant execute on function public.finish_service(uuid, uuid)
  to anon, authenticated;

grant execute on function public.mark_no_show(uuid, uuid)
  to anon, authenticated;

grant execute on function public.pause_station(uuid, uuid)
  to anon, authenticated;

grant execute on function public.resume_station(uuid, uuid)
  to anon, authenticated;

grant execute on function public.set_station_offline(uuid, uuid)
  to anon, authenticated;

grant execute on function public.get_station_state(uuid, uuid)
  to anon, authenticated;


-- Somente Admin autenticado.
grant execute on function public.admin_get_session_state(uuid)
  to authenticated;

grant execute on function public.admin_open_session(uuid)
  to authenticated;

grant execute on function public.admin_close_session_entry(uuid)
  to authenticated;

grant execute on function public.admin_finish_session(uuid, boolean)
  to authenticated;
```

---

# 8. Bootstrap inicial

Após aplicar a migration, criar a primeira igreja.

Exemplo no Supabase SQL Editor:

```sql
insert into public.churches (
  name,
  slug
)
values (
  'Paróquia Nossa Senhora de Fátima',
  'nossa-senhora-de-fatima'
)
returning id;
```

Criar o usuário Admin utilizando Supabase Auth.

Depois pegar:

```text
church_id
auth.users.id
```

e relacionar:

```sql
insert into public.church_admins (
  church_id,
  user_id,
  role
)
values (
  'CHURCH_UUID',
  'AUTH_USER_UUID',
  'OWNER'
);
```

A partir desse momento o Admin autenticado poderá administrar a igreja.

---

# 9. Criar uma sessão

O frontend Admin pode inserir em:

```text
confession_sessions
```

Exemplo:

```sql
insert into public.confession_sessions (
  church_id,
  name,
  slug,
  ticket_prefix,
  starts_at,
  ends_at
)
values (
  'CHURCH_UUID',
  'Confissões — Domingo 18h',
  'confissoes-2026-09-14-18h',
  'C',
  '2026-09-14T18:00:00-03:00',
  '2026-09-14T20:00:00-03:00'
);
```

Ela começa como:

```text
DRAFT
```

---

# 10. Criar confessionários

```sql
insert into public.stations (
  session_id,
  name,
  priest_name
)
values
(
  'SESSION_UUID',
  'Confessionário 01',
  'Pe. Victor'
),
(
  'SESSION_UUID',
  'Confessionário 02',
  'Pe. João'
),
(
  'SESSION_UUID',
  'Confessionário 03',
  'Pe. Marcos'
);
```

Cada estação recebe automaticamente:

```text
access_token
```

O Admin pode gerar o link operacional:

```text
/padre/{stationId}?token={accessToken}
```

IMPORTANTE:

Esse link funciona como credencial.

Não deve aparecer:

- no telão;
- em logs públicos;
- em QR Codes do fiel;
- em Broadcasts.

---

# 11. Abrir a fila

Usar:

```ts
supabase.rpc("admin_open_session", {
  p_session_id: sessionId,
});
```

Estado:

```text
DRAFT → OPEN
```

Depois disso `create_ticket()` passa a aceitar entradas.

Assim que `ends_at` chega, a entrada fecha sozinha (`OPEN` → `ENTRY_CLOSED`). O admin ainda pode encerrar a entrada antes do horário. Finalizar a sessão continua sendo ação manual.

---

# 12. Entrada do fiel

```ts
const { data, error } = await supabase.rpc("create_ticket", {
  p_session_id: sessionId,
  p_phone_e164: phoneE164, // opcional; null se o fiel não quiser WhatsApp
});
```

`p_phone_e164` é opcional. Se informado, o banco normaliza para E.164 e grava só em `ticket_contacts`. O retorno de `create_ticket` **não** inclui o telefone.

Retorno:

```json
{
  "ticket_id": "...",
  "public_code": "C-024",
  "anonymous_token": "...",
  "ticket_status": "WAITING",
  "created_at": "..."
}
```

Salvar no navegador:

```ts
localStorage.setItem(
  "confession_ticket",
  JSON.stringify({
    sessionId,
    anonymousToken: data.anonymous_token,
    publicCode: data.public_code,
  })
);
```

`anonymousToken` nunca deve aparecer na URL.

Evitar:

```text
/minha-senha?token=UUID
```

Preferir recuperar do localStorage.

---

# 13. Recuperar ticket do fiel

```ts
const { data, error } = await supabase.rpc("get_my_ticket", {
  p_anonymous_token: anonymousToken,
});
```

Retorno conceitual:

```json
{
  "public_code": "C-024",
  "ticket_status": "WAITING",
  "people_ahead": 3,
  "estimated_wait_minutes": 8,
  "station_name": null
}
```

Após chamada:

```json
{
  "public_code": "C-024",
  "ticket_status": "CALLED",
  "people_ahead": 0,
  "estimated_wait_minutes": null,
  "station_name": "Confessionário 02"
}
```

---

# 14. Cancelar entrada

Somente ticket em:

```text
WAITING
```

pode ser cancelado pelo próprio fiel.

```ts
await supabase.rpc("cancel_ticket", {
  p_anonymous_token: anonymousToken,
});
```

---

# 15. Fluxo do sacerdote

## Ativar confessionário

```ts
await supabase.rpc("resume_station", {
  p_station_id: stationId,
  p_access_token: accessToken,
});
```

---

## Carregar estado

```ts
await supabase.rpc("get_station_state", {
  p_station_id: stationId,
  p_access_token: accessToken,
});
```

---

## Chamar próximo

```ts
await supabase.rpc("call_next_ticket", {
  p_station_id: stationId,
  p_access_token: accessToken,
});
```

---

## Chamar novamente

```ts
await supabase.rpc("recall_current_ticket", {
  p_station_id: stationId,
  p_access_token: accessToken,
});
```

---

## Iniciar atendimento

```ts
await supabase.rpc("start_service", {
  p_station_id: stationId,
  p_access_token: accessToken,
});
```

---

## Finalizar

```ts
await supabase.rpc("finish_service", {
  p_station_id: stationId,
  p_access_token: accessToken,
});
```

---

## Não compareceu

```ts
await supabase.rpc("mark_no_show", {
  p_station_id: stationId,
  p_access_token: accessToken,
});
```

---

## Pausar

```ts
await supabase.rpc("pause_station", {
  p_station_id: stationId,
  p_access_token: accessToken,
});
```

---

# 16. Estado público da TV

```ts
const { data } = await supabase.rpc(
  "get_public_session_state",
  {
    p_session_slug: sessionSlug,
  }
);
```

O retorno contém apenas informações públicas.

Exemplo:

```json
{
  "church": {
    "name": "Paróquia Nossa Senhora de Fátima"
  },
  "session": {
    "id": "...",
    "name": "Confissões — Domingo 18h",
    "status": "OPEN"
  },
  "waiting_count": 8,
  "waiting_codes": [],
  "stations": [
    {
      "name": "Confessionário 01",
      "priest_name": "Pe. Victor",
      "status": "BUSY",
      "current_ticket": {
        "public_code": "C-021",
        "status": "IN_SERVICE"
      }
    },
    {
      "name": "Confessionário 02",
      "priest_name": "Pe. João",
      "status": "CALLING",
      "current_ticket": {
        "public_code": "C-024",
        "status": "CALLED"
      }
    }
  ],
  "latest_call": {
    "public_code": "C-024",
    "station_name": "Confessionário 02"
  }
}
```

Nenhum `anonymous_token` aparece.

---

# 17. Realtime

O sistema utilizará um canal público por sessão:

```text
session:{sessionId}
```

Exemplo:

```text
session:25fe5b9c-...
```

O evento será:

```text
queue_changed
```

Payload:

```json
{
  "entity": "ticket",
  "action": "UPDATE",
  "session_id": "..."
}
```

## Estratégia do cliente

Não tentar reconstruir o estado inteiro usando somente o payload.

Usar:

```text
Broadcast recebido
      ↓
debounce ~100–250ms
      ↓
refetch da RPC
```

### Fiel

```text
queue_changed
↓
get_my_ticket()
```

### Padre

```text
queue_changed
↓
get_station_state()
```

### TV

```text
queue_changed
↓
get_public_session_state()
```

### Admin

```text
queue_changed
↓
admin_get_session_state()
```

Isso evita:

- divergência de estado;
- lógica duplicada;
- exposição de colunas privadas;
- bugs por eventos perdidos.

---

# 18. Exemplo de subscription no frontend

Conceitualmente:

```ts
const channel = supabase
  .channel(`session:${sessionId}`)
  .on(
    "broadcast",
    {
      event: "queue_changed",
    },
    () => {
      refetch();
    }
  )
  .subscribe();

return () => {
  supabase.removeChannel(channel);
};
```

Adicionar debounce para múltiplas mudanças geradas pela mesma ação.

Exemplo:

```text
ticket UPDATE
station UPDATE
```

podem ocorrer praticamente juntas.

---

# 19. Realtime e reconexão

Broadcast não substitui o banco como fonte da verdade.

Ao reconectar:

```text
WebSocket reconectou
       ↓
executar RPC novamente
       ↓
sincronizar estado
```

Nunca assumir que todos os eventos chegaram ao cliente.

---

# 20. Posição na fila

A posição não é salva no ticket.

Ela é calculada.

Exemplo:

```text
C-021 WAITING
C-022 WAITING
C-023 WAITING
C-024 WAITING ← EU
```

Resultado:

```text
people_ahead = 3
```

Tickets:

```text
COMPLETED
NO_SHOW
CANCELLED
IN_SERVICE
CALLED
```

não entram na contagem de pessoas aguardando à frente.

---

# 21. Estimativa de espera

Primeiro calcular média real:

```text
finished_at - started_at
```

para tickets `COMPLETED` da sessão.

Se não houver histórico suficiente:

```text
default_service_minutes = 8
```

Exemplo:

```text
6 pessoas à frente
3 confessionários ativos
média = 8 min
```

Aproximação:

```text
ceil(6 / 3) × 8 = 16 min
```

Mostrar sempre como:

```text
Tempo estimado
~16 minutos
```

Nunca tratar como horário garantido.

---

# 22. Integridade importante

## Um único ticket ativo por estação

Garantido por:

```sql
create unique index tickets_one_active_per_station_idx
```

para:

```text
CALLED
IN_SERVICE
```

---

## Uma senha nunca se repete na mesma sessão

Garantido por:

```text
unique(session_id, public_number)
unique(session_id, public_code)
```

---

## Token anônimo nunca se repete

Garantido por:

```text
unique(anonymous_token)
```

---

## access_token nunca se repete

Garantido por:

```text
unique(access_token)
```

---

# 23. Segurança

## Nunca consultar `tickets` diretamente no frontend público

Errado:

```ts
supabase
  .from("tickets")
  .select("*");
```

Correto:

```ts
supabase.rpc("get_my_ticket", ...);
```

---

## Nunca fazer update de ticket no frontend

Errado:

```ts
supabase
  .from("tickets")
  .update({
    status: "COMPLETED",
  });
```

Correto:

```ts
supabase.rpc("finish_service", ...);
```

---

## Service Role

`SUPABASE_SERVICE_ROLE_KEY`:

- somente server-side;
- nunca usar em Client Components;
- nunca prefixar com `NEXT_PUBLIC_`;
- nunca salvar no navegador.

---

# 24. Admin Auth

O fiel não possui login.

O sacerdote também não precisa possuir conta no MVP.

Somente:

```text
/admin
```

utilizará Supabase Auth.

Sugestão inicial:

```text
e-mail + senha
```

Admin é autorizado através de:

```text
church_admins
```

---

# 24.1 Admin Global (multi-paróquia)

A partir do ciclo MVP-01, o sistema passa a suportar várias paróquias. Existem dois níveis de autorização, sempre validados no banco:

```text
church_admins   → admin local, escopo de uma única paróquia
global_admins   → admin da plataforma, escopo de todas as paróquias
```

`global_admins`:

```text
user_id     uuid  (referencia auth.users, PK)
role        text  ('owner' | 'operator' | 'viewer')
is_active   boolean
```

Hierarquia de papéis (`is_global_admin(p_required_role)`):

```text
owner     → tudo que operator e viewer podem
operator  → cadastrar paróquia, vincular admin local, ver métricas
viewer    → apenas leitura (lista de paróquias e métricas)
```

RPCs (todas exigem usuário autenticado vinculado em `global_admins`):

```text
is_global_admin(p_required_role text default null)
global_list_churches()
global_list_audit_log(p_limit integer default 50)
global_list_church_admins(p_church_id uuid)
global_list_church_sessions(p_church_id uuid)
global_create_church(p_name text, p_slug text, p_logo_url text default null)
global_update_church(p_church_id uuid, p_name text, p_slug text, p_logo_url text default null)
global_set_church_active(p_church_id uuid, p_is_active boolean)
global_get_dashboard_metrics(p_from timestamptz default now() - 30d, p_to timestamptz default now())
global_assign_church_admin(p_church_id uuid, p_user_id uuid)
```

Bootstrap do primeiro admin global (executar no SQL Editor do Supabase, uma única vez):

```sql
insert into public.global_admins (user_id, role)
values ('AUTH_USER_UUID', 'owner');
```

Regras permanentes:

- `global_admins` nunca autoriza operações dentro de uma paróquia (fila, sessão, ticket). Isso continua sendo exclusivo de `church_admins`.
- Vincular um admin local (`global_assign_church_admin`) exige que o `user_id` já exista em `auth.users` — criado via convite/painel do Supabase Auth. O MVP não cria usuários por conta própria nesta RPC.
- Toda métrica exposta ao admin global é agregada; nunca lista tickets, conteúdo de sessão ou qualquer dado de um fiel específico.

## Auditoria de ações da plataforma

Ações administrativas críticas de nível global são registradas em `platform_audit_log` (ator, ação, tipo/alvo, metadata agregada, timestamp). Hoje cobre:

```text
church.create
church.update
church.activate
church.deactivate
church_admin.assign
```

Regras:

- Nunca registrar dado de fiel, conteúdo de confissão ou token privado nessa tabela.
- Somente leitura por `global_admins` com papel `viewer`, `operator` ou `owner`, via RPC `global_list_audit_log` (e-mail do ator incluso; sem dado de fiel). A RLS da tabela continua exigindo `operator` no SELECT direto.
- Toda nova ação administrativa crítica (ex.: remover admin, suspender paróquia) deve chamar `private.log_platform_action(...)` ao ser implementada.

## Hardening de Auth (produção)

Como o app não tem cadastro público, o signup por e-mail deve ficar **desligado** tanto localmente (`[auth] enable_signup = false` em `supabase/config.toml`) quanto no projeto hospedado:

```text
Dashboard do Supabase → Authentication → Providers → Email
→ desligar "Allow new users to sign up"
→ manter o provider Email ligado (senão o login da secretaria quebra)
```

Localmente, `[auth.email] enable_signup` precisa permanecer `true`. Se for `false`, o CLI desliga `GOTRUE_EXTERNAL_EMAIL_ENABLED` e o `signInWithPassword` passa a falhar com `email_provider_disabled`.

Contas de admin (local ou global) só existem por convite/criação manual no Supabase Auth, seguidas do vínculo via `global_assign_church_admin` ou do bootstrap de `global_admins` (seção acima).

---

# 25. Erros das RPCs

As funções utilizam códigos de domínio como mensagens de exceção.

Frontend deve tratar:

```text
SESSION_NOT_OPEN
TICKET_NOT_FOUND
INVALID_STATION_ACCESS
STATION_NOT_AVAILABLE
SESSION_NOT_ACTIVE
QUEUE_EMPTY
INVALID_STATION_STATE
NO_CALLED_TICKET
NO_ACTIVE_TICKET
STATION_CANNOT_BE_PAUSED
STATION_CANNOT_BE_RESUMED
STATION_CANNOT_GO_OFFLINE
SESSION_NOT_FOUND
FORBIDDEN
SESSION_NOT_DRAFT
SESSION_HAS_ACTIVE_TICKETS
SESSION_HAS_ACTIVE_SERVICE
CHURCH_NOT_FOUND
CHURCH_HAS_ACTIVE_SESSION
CHURCH_INACTIVE
```

Criar um mapper no frontend.

Exemplo:

```ts
const databaseErrorMessages = {
  QUEUE_EMPTY: "Não há ninguém aguardando na fila.",
  STATION_NOT_AVAILABLE:
    "Este confessionário não está disponível.",
  SESSION_NOT_OPEN:
    "A fila não está aberta no momento.",
};
```

Não mostrar exception SQL bruta para o usuário.

---

# 26. Regras que NÃO devem ficar somente no frontend

Obrigatoriamente no banco:

- gerar número da senha;
- validar se sessão aceita entrada;
- chamar próximo ticket;
- concorrência entre sacerdotes;
- iniciar atendimento;
- finalizar atendimento;
- no-show;
- validar token do confessionário;
- validar token anônimo do ticket;
- autorização administrativa crítica.

Frontend pode controlar UX, mas não autoridade.

---

# 27. Testes obrigatórios

Regressão executável (seed local): `npm run test:db` → `supabase/tests/mvp_01_regression.sql`.

Smoke manual de duas estações ao mesmo tempo: `supabase/tests/queue_concurrency.sql`.

## Teste 1 — concorrência

Fila:

```text
C-001
C-002
C-003
```

Executar simultaneamente:

```text
call_next_ticket(stationA)
call_next_ticket(stationB)
```

Esperado:

```text
stationA = C-001
stationB = C-002
```

Ordem entre A e B pode inverter.

Nunca ambas recebem a mesma senha.

---

## Teste 2 — estação ocupada

Station:

```text
BUSY
```

Tentar:

```text
call_next_ticket()
```

Esperado:

```text
STATION_NOT_AVAILABLE
```

---

## Teste 3 — fila vazia

Nenhum `WAITING`.

Esperado:

```text
QUEUE_EMPTY
```

---

## Teste 4 — fila fechada para entrada

Session:

```text
ENTRY_CLOSED
```

ou `OPEN` com `ends_at` já no passado (o banco persiste `ENTRY_CLOSED`).

`create_ticket()` sem token existente:

```text
SESSION_NOT_OPEN
```

Quem já tem senha ainda recupera o ticket. Um sacerdote ainda pode:

```text
call_next_ticket()
```

---

## Teste 5 — ticket privado

Com anon key:

```text
SELECT * FROM tickets
```

deve falhar/não retornar dados.

---

## Teste 6 — token errado

```text
get_my_ticket(token_invalido)
```

Esperado:

```text
TICKET_NOT_FOUND
```

---

## Teste 7 — painel do sacerdote

Token errado:

```text
get_station_state(...)
```

Esperado:

```text
INVALID_STATION_ACCESS
```

---

## Teste 8 — no-show

```text
WAITING
→ CALLED
→ NO_SHOW
```

Station volta para:

```text
AVAILABLE
```

---

## Teste 9 — cancelamento

Fiel em:

```text
WAITING
```

pode cancelar.

Fiel em:

```text
CALLED
```

não pode cancelar pelo MVP.

---

## Teste 10 — finalizar sessão

Existem tickets:

```text
CALLED
IN_SERVICE
```

`admin_finish_session()` deve recusar.

Mesmo com `p_force = true`, uma confissão já chamada/em atendimento não deve ser silenciosamente encerrada.

---

# 28. Supabase CLI

Depois de configurar o projeto:

```bash
supabase init
```

Linkar projeto:

```bash
supabase link --project-ref SEU_PROJECT_REF
```

Aplicar migrations:

```bash
supabase db push
```

Gerar tipos:

```bash
supabase gen types typescript \
  --linked \
  > src/types/database.ts
```

---

# 29. Estrutura sugerida

```text
supabase/
├── migrations/
│   └── 202609140001_initial_confession_queue.sql
│
├── tests/
│   ├── rls.sql
│   ├── queue_concurrency.sql
│   └── ticket_lifecycle.sql
│
└── config.toml
```

---

# 30. Types no projeto

Nunca escrever manualmente tipos equivalentes às tabelas se os tipos do Supabase já puderem ser gerados.

Utilizar:

```text
src/types/database.ts
```

Exemplo:

```ts
import type { Database } from "@/types/database";

type TicketStatus =
  Database["public"]["Enums"]["ticket_status"];
```

---

# 31. Hooks esperados

O banco foi desenhado para suportar:

```text
useSession()
useTicket()
useStation()
usePublicQueue()
useSessionRealtime()
```

Cada hook de Realtime deve:

```text
1. buscar estado inicial por RPC
2. conectar no Broadcast
3. refazer RPC quando queue_changed chegar
4. refazer RPC após reconnect
```

---

# 32. Regras de privacidade permanentes

Mesmo em futuras versões, não adicionar às tabelas:

```text
sin
sins
confession_notes
penance
confession_reason
spiritual_notes
priest_notes_about_person
```

Não criar:

```text
user_confession_history
```

Não correlacionar:

```text
auth.users
↔
tickets do fiel
```

O fiel permanece anônimo.

---

# 33. O que pode ser armazenado para métricas

Permitido:

```text
quantidade de tickets
tempo médio de espera
tempo médio de atendimento
quantidade de no-show
quantidade de cancelamentos
horários de maior demanda
quantidade de confessionários ativos
```

Sempre de forma operacional/agregada.

---

# 34. Futuras melhorias de banco

Não implementar no MVP, mas arquitetura pode evoluir para:

## V2

```text
notification_subscriptions
session_settings
audit_events
```

## V3

```text
dioceses
parish_branding
station_groups
```

## V4

Multi-tenant SaaS completo.

---

# 35. Rate limiting

Como o fiel não possui login, uma pessoa tecnicamente pode tentar chamar `create_ticket()` repetidamente por automação.

No MVP:

- impedir duplicação acidental via localStorage;
- monitorar abuso.

Antes de disponibilizar como SaaS público, adicionar rate limiting em:

```text
create_ticket
```

por camada server-side / Edge / mecanismo apropriado.

Não utilizar IP como identidade permanente do fiel.

---

# 36. Limpeza e retenção

Tickets são anônimos, mas ainda representam atividade de uma sessão religiosa.

Recomendação:

- manter dados operacionais apenas pelo período necessário para métricas;
- posteriormente agregar métricas;
- permitir política de retenção;
- apagar tickets antigos quando não forem mais necessários.

Uma versão futura pode criar job:

```text
sessão encerrada
+ período de retenção
↓
agregar métricas
↓
remover tickets individuais
```

---

# 37. Fonte da verdade

A fonte da verdade é sempre:

```text
PostgreSQL
```

Não:

```text
localStorage
Realtime payload
estado React
TV
```

Essas camadas apenas representam o estado mantido pelo banco.

---

# 38. Instrução para o Cursor

Ao implementar:

1. criar a migration real a partir deste documento;
2. executar localmente;
3. gerar os tipos do Supabase;
4. criar testes de RLS;
5. testar `create_ticket()`;
6. testar concorrência de `call_next_ticket()`;
7. testar lifecycle completo;
8. somente depois integrar as telas.

Não construir lógica alternativa no frontend para substituir as RPCs.

---

# 39. Checklist antes da UI

```text
[ ] Migration executa sem erro
[ ] RLS está habilitado
[ ] anon não consegue SELECT tickets
[ ] create_ticket funciona
[ ] public_code é sequencial
[ ] get_my_ticket funciona apenas por token
[ ] cancel_ticket funciona
[ ] call_next_ticket é concorrente/atômico
[ ] recall funciona
[ ] start_service funciona
[ ] finish_service funciona
[ ] mark_no_show funciona
[ ] pause/resume funciona
[ ] get_station_state não expõe access_token
[ ] get_public_session_state não expõe anonymous_token
[ ] ticket_contacts não tem SELECT anônimo
[ ] create_ticket aceita telefone opcional sem devolvê-lo
[ ] Admin consegue abrir/fechar sessão
[ ] Broadcast funciona
[ ] Reconnect executa refetch
[ ] Tipos TypeScript foram gerados
```

---

# 40. Resultado final esperado

```text
                    PostgreSQL / Supabase
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
        FIEL             PADRE             ADMIN
     anonymous_token   access_token     Supabase Auth
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                    RPCs do domínio
                           │
                           ▼
                     estado da fila
                           │
                           ▼
                  Realtime Broadcast
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
        FIEL              TV              PADRE
```

A arquitetura deve garantir três coisas acima de qualquer outra consideração:

1. **nenhuma informação sobre a confissão é armazenada;**
2. **nenhum fiel precisa criar conta ou se identificar;**
3. **a mesma senha nunca é chamada por dois sacerdotes simultaneamente.**

---

# 41. Referências técnicas

Documentação oficial do Supabase:

- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Realtime / Database Changes: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- Realtime Broadcast: https://supabase.com/docs/guides/realtime/broadcast
- Securing the Data API: https://supabase.com/docs/guides/api/securing-your-api

Para este MVP, o Broadcast foi escolhido no lugar de expor `tickets` via Postgres Changes porque permite manter os payloads públicos sanitizados e usar as RPCs como fonte de verdade.
