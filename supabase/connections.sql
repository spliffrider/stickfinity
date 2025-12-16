-- Connections Table
create table public.connections (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  from_note_id uuid references public.notes(id) on delete cascade not null,
  to_note_id uuid references public.notes(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.connections enable row level security;

-- Realtime
alter publication supabase_realtime add table public.connections;

-- Policies

-- 1. Viewable if board is accessible
create policy "Connections viewable if board accessible." on public.connections for select using (
    exists (
      select 1 from public.boards
      where id = connections.board_id and (
        is_public = true or
        owner_id = auth.uid() or
        exists (
          select 1 from public.board_members
          where board_id = connections.board_id and user_id = auth.uid()
        )
      )
    )
  );

-- 2. Create if member
create policy "Create connection if member." on public.connections for insert with check (
    exists (
      select 1 from public.boards
      where id = connections.board_id and (
        owner_id = auth.uid() or
        exists (
           select 1 from public.board_members
           where board_id = connections.board_id and user_id = auth.uid() and role in ('owner', 'editor')
        )
      )
    ) OR 
     exists ( -- All authenticated users can create on public boards (demo)
      select 1 from public.boards
      where id = connections.board_id and is_public = true
    )
  );

-- 3. Delete if member (simplification: anyone who can edit can delete connections)
create policy "Delete connection if member." on public.connections for delete using (
    exists (
      select 1 from public.boards
      where id = connections.board_id and (
        owner_id = auth.uid() or
        exists (
           select 1 from public.board_members
           where board_id = connections.board_id and user_id = auth.uid() and role in ('owner', 'editor')
        )
      )
    ) OR 
     exists (
      select 1 from public.boards
      where id = connections.board_id and is_public = true
    )
  );
