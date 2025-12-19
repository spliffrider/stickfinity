-- Fix RLS policies to allow ANONYMOUS users to view PUBLIC boards
-- Run this in your Supabase SQL Editor

-- ============================================
-- BOARDS: Allow anonymous users to see public boards
-- ============================================

-- Drop existing select policies that might be too restrictive
DROP POLICY IF EXISTS "Public boards are viewable by everyone." ON public.boards;

-- Create new policy that explicitly allows anonymous access to public boards
CREATE POLICY "Anyone can view public boards." ON public.boards FOR SELECT USING (
    is_public = true
);

-- Keep the private board policy for authenticated users
DROP POLICY IF EXISTS "Private boards viewable by members." ON public.boards;
CREATE POLICY "Private boards viewable by members." ON public.boards FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.board_members
        WHERE board_id = boards.id AND user_id = auth.uid()
    )
);

-- ============================================
-- NOTES: Allow anonymous users to view notes on public boards
-- ============================================

-- Drop existing select policy
DROP POLICY IF EXISTS "Notes viewable if board accessible." ON public.notes;

-- Create new policy that allows anonymous access to notes on public boards
CREATE POLICY "Notes viewable if board accessible." ON public.notes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = notes.board_id AND is_public = true
    )
    OR EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = notes.board_id AND owner_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.board_members
        WHERE board_id = notes.board_id AND user_id = auth.uid()
    )
);

-- ============================================
-- CONNECTIONS: Allow anonymous users to view connections on public boards
-- ============================================

-- Drop existing select policy if any
DROP POLICY IF EXISTS "Connections viewable if board accessible." ON public.connections;

-- Create policy for anonymous access
CREATE POLICY "Connections viewable if board accessible." ON public.connections FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = connections.board_id AND is_public = true
    )
    OR EXISTS (
        SELECT 1 FROM public.boards
        WHERE id = connections.board_id AND owner_id = auth.uid()
    )
);
