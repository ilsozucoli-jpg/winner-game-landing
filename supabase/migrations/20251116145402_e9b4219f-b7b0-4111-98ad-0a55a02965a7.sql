-- Create enum for roles
create type public.app_role as enum ('admin', 'user');

-- Create user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    created_at timestamp with time zone default now(),
    unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS policies for user_roles
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Only admins can insert roles"
on public.user_roles
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Only admins can update roles"
on public.user_roles
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete roles"
on public.user_roles
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Create sponsors table
create table public.sponsors (
    id uuid primary key default gen_random_uuid(),
    logo_url text not null,
    prize_description text not null,
    phone text not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS on sponsors
alter table public.sponsors enable row level security;

-- RLS policies for sponsors
create policy "Anyone can view sponsors"
on public.sponsors
for select
to authenticated
using (true);

create policy "Only admins can insert sponsors"
on public.sponsors
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Only admins can update sponsors"
on public.sponsors
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete sponsors"
on public.sponsors
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text,
    phone text,
    email text,
    created_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- RLS policies for profiles
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create storage bucket for sponsor logos
insert into storage.buckets (id, name, public)
values ('sponsor-logos', 'sponsor-logos', true);

-- RLS policies for storage
create policy "Anyone can view sponsor logos"
on storage.objects
for select
using (bucket_id = 'sponsor-logos');

create policy "Admins can upload sponsor logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sponsor-logos' AND
  public.has_role(auth.uid(), 'admin')
);

create policy "Admins can update sponsor logos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'sponsor-logos' AND
  public.has_role(auth.uid(), 'admin')
);

create policy "Admins can delete sponsor logos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'sponsor-logos' AND
  public.has_role(auth.uid(), 'admin')
);