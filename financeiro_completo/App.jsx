-- ============================================================
-- SUBCATEGORIAS para o ERP
-- Cole no SQL Editor do Supabase e clique em Run
-- ============================================================

create table if not exists subcategorias (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references empresas(id) on delete cascade not null,
  categoria_id uuid references categorias(id) on delete cascade not null,
  nome text not null,
  cor text default '#6366f1',
  created_at timestamptz default now()
);

alter table subcategorias enable row level security;

drop policy if exists "p_subcategorias" on subcategorias;
create policy "p_subcategorias" on subcategorias
  for all using (empresa_id = minha_empresa_id());

-- Adiciona subcategoria_id nos lançamentos (se não existir)
alter table lancamentos
  add column if not exists subcategoria_id uuid references subcategorias(id) on delete set null;

-- ============================================================
-- FIM
-- ============================================================
