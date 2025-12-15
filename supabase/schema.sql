-- !!! WARNING: THIS SCRIPT WILL RESET YOUR PUBLIC TABLES !!!
-- We need to do this because the existing 'users' table has the wrong ID type (bigint instead of uuid).

-- 1. Drop existing tables to clear the "bigint" error
drop table if exists public.comments cascade;
drop table if exists public.notes cascade;
drop table if exists public.board_members cascade;
drop table if exists public.boards cascade;
drop table if exists public.users cascade;

-- 2. Create tables with correct UUID types
create extension if not exists "uuid-ossp";

-- Users table (Must match auth.users uuid)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Boards table
create table public.boards (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  owner_id uuid references public.users(id) not null,
  is_public boolean default false,
  password_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Board Members table
create table public.board_members (
  board_id uuid references public.boards(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('owner', 'editor', 'viewer')) default 'viewer',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (board_id, user_id)
);

-- Sticky Notes table
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  author_id uuid references public.users(id) on delete set null,
  content jsonb default '{}'::jsonb,
  color text default 'yellow',
  x double precision not null default 0,
  y double precision not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Comments table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  note_id uuid references public.notes(id) on delete cascade not null,
  author_id uuid references public.users(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Security
alter table public.users enable row level security;
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.notes enable row level security;
alter table public.comments enable row level security;

-- 4. Policies

-- Users
create policy "Public profiles are viewable by everyone." on public.users for select using (true);
create policy "Users can insert their own profile." on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.users for update using (auth.uid() = id);

-- Boards
create policy "Public boards are viewable by everyone." on public.boards for select using (is_public = true);

create policy "Private boards viewable by members." on public.boards for select using (
    exists (
      select 1 from public.board_members
      where board_id = boards.id and user_id = auth.uid()
    )
    or owner_id = auth.uid()
  );

create policy "Owner can update board." on public.boards for update using (owner_id = auth.uid());
create policy "Owner can delete board." on public.boards for delete using (owner_id = auth.uid());
create policy "Authenticated users can create boards" on public.boards for insert with check (auth.role() = 'authenticated');

-- Notes
create policy "Notes viewable if board accessible." on public.notes for select using (
    exists (
      select 1 from public.boards
      where id = notes.board_id and (
        is_public = true or
        owner_id = auth.uid() or
        exists (
          select 1 from public.board_members
          where board_id = notes.board_id and user_id = auth.uid()
        )
      )
    )
  );

create policy "Create note if member." on public.notes for insert with check (
    exists (
      select 1 from public.boards
      where id = notes.board_id and (
        owner_id = auth.uid() or
        exists (
           select 1 from public.board_members
           where board_id = notes.board_id and user_id = auth.uid() and role in ('owner', 'editor')
        )
      )
    ) OR 
     exists ( -- All authenticated users can create notes on public boards for now (demo purposes)
      select 1 from public.boards
      where id = notes.board_id and is_public = true
    )
  );

create policy "Update own notes." on public.notes for update using (author_id = auth.uid());
create policy "Delete own notes." on public.notes for delete using (author_id = auth.uid());

-- 5. Realtime
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notes') then
    alter publication supabase_realtime add table public.notes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'comments') then
    alter publication supabase_realtime add table public.comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'board_members') then
    alter publication supabase_realtime add table public.board_members;
  end if;
end;
$$;
