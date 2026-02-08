-- ============================================
-- VENUZ - STORAGE & UPLOAD CONFIGURATION
-- Fecha: 8 Feb 2026
-- ============================================

-- 1. Crear el Bucket de Almacenamiento (si no existe)
-- Nota: Esto normalmente se hace desde el Dashboard, pero intentaremos crearlo vía SQL si la extensión pg_net está activa.
-- Si falla, hay que hacerlo manual: Storage > New Bucket > 'content-media' (Public)

insert into storage.buckets (id, name, public)
values ('content-media', 'content-media', true)
on conflict (id) do nothing;

-- 2. Políticas de Seguridad (RLS) para Storage

-- Permitir acceso público de LECTURA a todos
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'content-media' );

-- Permitir SUBIDA a usuarios autenticados (y anónimos por ahora para facilitar pruebas)
create policy "Upload Access"
  on storage.objects for insert
  with check ( bucket_id = 'content-media' );

-- Permitir ACTUALIZAR sus propios archivos
create policy "Update Access"
  on storage.objects for update
  using ( bucket_id = 'content-media' );

-- 3. Crear Perfil de Usuario (Tabla users_public)
-- Para extender la tabla auth.users que es privada
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  role text default 'user', -- user, creator, admin
  updated_at timestamptz,
  primary key (id)
);

-- Habilitar RLS en profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Trigger para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Vincular trigger a auth.users (si no existe ya)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Actualizar tabla Content para soportar uploads de usuarios
alter table content 
add column if not exists user_id uuid references auth.users(id), -- Dueño del contenido
add column if not exists status text default 'active', -- active, pending, rejected
add column if not exists file_path text; -- Referencia al storage

-- Index para buscar contenido por usuario
create index if not exists idx_content_user on content(user_id);
create index if not exists idx_content_status on content(status);
