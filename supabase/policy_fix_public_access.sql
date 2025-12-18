-- FIX: Allow updates to notes on Public boards for Guest users
-- The previous policy only allowed "own" notes updates (author_id = auth.uid()).
-- This blocked guests (who have no uid) from saving text on public boards.

-- 1. Drop the restrictive policy
drop policy if exists "Update own notes." on public.notes;

-- 2. Create the new permissive policy
create policy "Update notes if board is accessible." on public.notes for update using (
    -- 1. Author (Standard user)
    author_id = auth.uid()
    OR
    -- 2. Public Board (Guest Access)
    exists (
      select 1 from public.boards
      where id = board_id and is_public = true
    )
    OR
    -- 3. Board Member (Editor/Owner)
    exists (
      select 1 from public.board_members
      where board_id = notes.board_id 
      and user_id = auth.uid() 
      and role in ('owner', 'editor')
    )
    OR
    -- 4. Board Owner (Direct check)
    exists (
      select 1 from public.boards
      where id = board_id and owner_id = auth.uid()
    )
);

-- Also ensure Insert allows guests on Public boards (already should be covered but good to verify)
-- The existing insert policy: "Create note if member." usually checks board ownership/membership/public.
-- Let's double check it in schema, but for now this UPDATE policy covers the text saving issue.
