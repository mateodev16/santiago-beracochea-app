import pg from 'pg'
import { config } from './config.js'
import { ApiError } from './utils/errors.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: config.databasePoolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

pool.on('error', (error) => {
  console.error('[db] error en el pool de PostgreSQL:', error.message)
})

export const query = (text, params) => pool.query(text, params)

export const rows = async (text, params) => (await pool.query(text, params)).rows

export const one = async (text, params) => (await pool.query(text, params)).rows[0] ?? null

export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

const SCHEMA = `
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  phone text,
  city text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  slug text not null unique,
  name text not null,
  brand text not null,
  category text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  unit text not null default '',
  image text not null default '',
  badge text,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references users (id) on delete restrict,
  user_name text not null,
  user_email text not null,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  shipping numeric(12, 2) not null default 0 check (shipping >= 0),
  total numeric(12, 2) not null check (total >= 0),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'confirmado', 'entregado')),
  address text,
  notes text,
  payment_method text,
  date text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id bigserial primary key,
  order_id uuid not null references orders (id) on delete cascade,
  product_id text references products (id) on delete set null,
  slug text,
  name text not null,
  brand text,
  image text,
  price numeric(12, 2) not null check (price >= 0),
  qty integer not null check (qty > 0)
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  mime text not null,
  size integer not null,
  data bytea not null,
  created_at timestamptz not null default now()
);

create index if not exists users_email_idx on users (email);
create index if not exists products_category_idx on products (category);
create index if not exists products_active_idx on products (active);
create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists order_items_order_id_idx on order_items (order_id);
create index if not exists order_items_product_id_idx on order_items (product_id);
create index if not exists orders_user_status_idx on orders (user_id, status);
`

export async function initSchema() {
  await query(SCHEMA)
}

export async function assertDatabaseReady() {
  try {
    await query('select 1')
  } catch (error) {
    throw ApiError.internal(
      `No se pudo conectar a PostgreSQL (${config.databaseName}). Revisá DATABASE_URL en tu .env. Detalle: ${error.message}`,
    )
  }
  await initSchema()
}

export const closePool = () => pool.end()

export const uniqueViolation = (error) => error?.code === '23505'
