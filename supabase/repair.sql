-- Run this script to fix the "Missing User Profile" error
-- It restores your public profile by copying data from the Auth system

insert into public.users (id, email, display_name)
select 
  id, 
  email, 
  split_part(email, '@', 1) -- Use part before @ as name
from auth.users
where id not in (select id from public.users);

-- Also ensuring triggers are active for future users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (new.id, new.email, split_part(new.email, '@', 1), null);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
