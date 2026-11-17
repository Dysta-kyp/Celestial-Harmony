-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Membuat tabel profil anggota yang terhubung ke akun Supabase Auth.

create table if not exists public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Anggota',
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;

-- Jangan izinkan pengunjung yang belum login membaca/mengubah profil.
revoke all on table public.members from anon;
grant select, update on table public.members to authenticated;

drop policy if exists "Members can read their own profile" on public.members;
create policy "Members can read their own profile"
on public.members
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Members can update their own profile" on public.members;
create policy "Members can update their own profile"
on public.members
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Buat profil otomatis saat akun Auth baru terdaftar.
create or replace function public.create_member_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.members (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      'Anggota'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_member on auth.users;
create trigger on_auth_user_created_member
after insert on auth.users
for each row execute procedure public.create_member_profile();
