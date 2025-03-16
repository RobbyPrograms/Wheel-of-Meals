-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create a trigger function to create user profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, username)
  values (new.id, new.email, 'user_' || substr(new.id::text, 1, 8));
  return new;
end;
$$ language plpgsql security definer;

-- Create profiles table
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  email text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 30),
  constraint username_format check (username ~* '^[a-zA-Z0-9_]+$')
);

-- Set up Row Level Security (RLS)
alter table public.user_profiles enable row level security;

-- Create policies
create policy "Users can view any profile"
  on public.user_profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Create trigger for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create friends table
create table if not exists public.friends (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  friend_id uuid references auth.users(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, friend_id),
  constraint no_self_friendship check (user_id != friend_id)
);

-- Set up RLS for friends table
alter table public.friends enable row level security;

-- Create policies for friends table
create policy "Users can view their own friend connections"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can send friend requests"
  on public.friends for insert
  using (auth.uid() = user_id);

create policy "Users can accept/reject friend requests"
  on public.friends for update
  using (auth.uid() = friend_id)
  with check (status in ('accepted', 'rejected'));

create policy "Users can delete their own friend connections"
  on public.friends for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Function to get all friends for a user with usernames
create or replace function get_friends(p_user_id uuid)
returns table (
  friend_id uuid,
  username text,
  email text,
  display_name text,
  avatar_url text,
  status text
)
language sql
security definer
as $$
  select 
    case 
      when f.user_id = p_user_id then f.friend_id
      else f.user_id
    end as friend_id,
    p.username,
    p.email,
    p.display_name,
    p.avatar_url,
    f.status
  from friends f
  join public.user_profiles p on (
    case 
      when f.user_id = p_user_id then f.friend_id
      else f.user_id
    end = p.id
  )
  where 
    (f.user_id = p_user_id or f.friend_id = p_user_id)
    and f.status = 'accepted';
$$;

-- Function to search users by username or email
create or replace function search_users(search_query text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
language sql
security definer
as $$
  select 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url
  from public.user_profiles p
  where 
    p.username ilike '%' || search_query || '%'
    or p.display_name ilike '%' || search_query || '%'
  limit 10;
$$; 