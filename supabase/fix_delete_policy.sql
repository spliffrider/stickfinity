-- Fix delete policy to allow board owners and editors to delete notes
-- Run this in your Supabase SQL Editor

-- First drop the restrictive policy
DROP POLICY IF EXISTS "Delete own notes." ON public.notes;

-- Create a more permissive delete policy
CREATE POLICY "Delete notes if authorized." ON public.notes FOR DELETE USING (
    -- 1. Author can delete their own notes
    author_id = auth.uid()
    OR
    -- 2. Board owner can delete any note on their board
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = notes.board_id AND owner_id = auth.uid()
    )
    OR
    -- 3. Board editors can delete notes
    EXISTS (
        SELECT 1 FROM public.board_members
        WHERE board_id = notes.board_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'editor')
    )
    OR
    -- 4. Public boards - anyone can delete (for now, make more restrictive later)
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = notes.board_id AND is_public = true
    )
);
