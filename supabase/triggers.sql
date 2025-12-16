-- Trigger to automatically create a public user profile when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id, 
    new.email, 
    coalesce(
      split_part(new.email, '@', 1), 
      'Guest-' || substring(new.id::text from 1 for 8)
    ), 
    null
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
