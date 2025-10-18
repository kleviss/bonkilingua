-- Create tables for Bonkilingua app

-- Enable RLS (Row Level Security)
alter default privileges revoke execute on functions from public;

-- Create profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  bonk_points integer default 0,
  total_corrections integer default 0,
  languages_learned text[] default '{}',
  streak_days integer default 0,
  level integer default 1,
  daily_challenge boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chat_sessions table
create table chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  corrected_text text not null,
  input_text text not null,
  language text not null,
  model text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create saved_lessons table
create table saved_lessons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS) policies
-- Profiles: users can only read/write their own profile
alter table profiles enable row level security;

create policy "Users can view own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

-- Chat sessions: users can only read/write their own chat sessions
alter table chat_sessions enable row level security;

create policy "Users can view own chat sessions" 
  on chat_sessions for select 
  using (auth.uid() = user_id);

create policy "Users can create own chat sessions" 
  on chat_sessions for insert 
  with check (auth.uid() = user_id);

-- Saved lessons: users can only read/write their own lessons
alter table saved_lessons enable row level security;

create policy "Users can view own saved lessons" 
  on saved_lessons for select 
  using (auth.uid() = user_id);

create policy "Users can create own saved lessons" 
  on saved_lessons for insert 
  with check (auth.uid() = user_id);

create policy "Users can delete own saved lessons" 
  on saved_lessons for delete 
  using (auth.uid() = user_id);

-- Create function to handle new user creation
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
