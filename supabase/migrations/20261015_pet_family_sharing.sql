-- Compartir mascota entre papá y mamá (co-propietarios) mediante código de invitación.
-- Ejecutar en Supabase → SQL Editor (o `supabase db push`).

create table if not exists petid.pet_invites (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references petid.pets(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz default now()
);
alter table petid.pet_invites enable row level security;
drop policy if exists petid_pet_invites_own on petid.pet_invites;
create policy petid_pet_invites_own on petid.pet_invites for select using (created_by = auth.uid());

-- evitar duplicados de dueño por mascota
create unique index if not exists pet_owners_pet_user_uniq on petid.pet_owners (pet_id, user_id);

-- Crear invitación (solo un dueño actual de la mascota)
create or replace function public.create_pet_invite(p_pet_id uuid)
returns text language plpgsql security definer set search_path = petid, public as $$
declare v_code text;
begin
  if not exists (select 1 from petid.pet_owners where pet_id = p_pet_id and user_id = auth.uid()) then
    raise exception 'No eres dueño de esta mascota';
  end if;
  select code into v_code from petid.pet_invites
   where pet_id = p_pet_id and created_by = auth.uid() and accepted_at is null and expires_at > now()
   order by created_at desc limit 1;
  if v_code is not null then return v_code; end if;
  v_code := upper(substr(replace(replace(encode(gen_random_bytes(6), 'base64'), '/', 'A'), '+', 'B'), 1, 8));
  v_code := regexp_replace(v_code, '[^A-Z0-9]', 'X', 'g');
  insert into petid.pet_invites (pet_id, code, created_by) values (p_pet_id, v_code, auth.uid());
  return v_code;
end $$;

-- Ver a qué mascota corresponde un código (pantalla de aceptación)
create or replace function public.peek_pet_invite(p_code text)
returns table (pet_id uuid, pet_name text, photo_url text, species text, inviter_name text, inviter_sex text, valid boolean)
language sql security definer set search_path = petid, public as $$
  select p.id, p.name, p.photo_url, p.species::text, u.full_name, u.sex::text,
         (i.accepted_at is null and i.expires_at > now()) as valid
  from petid.pet_invites i
  join petid.pets p on p.id = i.pet_id
  join petid.users u on u.id = i.created_by
  where i.code = upper(trim(p_code))
  limit 1;
$$;

-- Aceptar invitación: agrega al usuario actual como co-dueño
create or replace function public.accept_pet_invite(p_code text)
returns uuid language plpgsql security definer set search_path = petid, public as $$
declare v_inv petid.pet_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  select * into v_inv from petid.pet_invites where code = upper(trim(p_code));
  if v_inv.id is null then raise exception 'Código no válido'; end if;
  if v_inv.accepted_at is not null then raise exception 'Esta invitación ya fue usada'; end if;
  if v_inv.expires_at <= now() then raise exception 'Esta invitación expiró'; end if;
  if v_inv.created_by = auth.uid() then raise exception 'No puedes aceptar tu propia invitación'; end if;
  insert into petid.pet_owners (pet_id, user_id, is_primary) values (v_inv.pet_id, auth.uid(), false)
  on conflict (pet_id, user_id) do nothing;
  update petid.pet_invites set accepted_by = auth.uid(), accepted_at = now() where id = v_inv.id;
  return v_inv.pet_id;
end $$;

-- Familia de la mascota (solo visible para sus dueños)
create or replace function public.pet_family(p_pet_id uuid)
returns table (user_id uuid, full_name text, avatar_url text, sex text, is_primary boolean)
language sql security definer set search_path = petid, public as $$
  select o.user_id, u.full_name, u.avatar_url, u.sex::text, o.is_primary
  from petid.pet_owners o join petid.users u on u.id = o.user_id
  where o.pet_id = p_pet_id
    and exists (select 1 from petid.pet_owners x where x.pet_id = p_pet_id and x.user_id = auth.uid())
  order by o.is_primary desc, o.created_at;
$$;

-- Quitar a un co-dueño (solo el dueño principal, nunca a sí mismo)
create or replace function public.remove_pet_owner(p_pet_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = petid, public as $$
begin
  if not exists (select 1 from petid.pet_owners where pet_id = p_pet_id and user_id = auth.uid() and is_primary) then
    raise exception 'Solo el dueño principal puede quitar miembros';
  end if;
  if p_user_id = auth.uid() then raise exception 'No puedes quitarte a ti mismo'; end if;
  delete from petid.pet_owners where pet_id = p_pet_id and user_id = p_user_id and is_primary = false;
end $$;

grant execute on function public.create_pet_invite(uuid), public.accept_pet_invite(text), public.pet_family(uuid), public.remove_pet_owner(uuid, uuid) to authenticated;
grant execute on function public.peek_pet_invite(text) to authenticated, anon;
