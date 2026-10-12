-- Run once in your Supabase project's SQL Editor. Safe to run again.
-- Each account sees only its own rows. Browser clients cannot bypass the
-- version check by writing directly to the table.
create table if not exists public.recipes (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id text not null check (length(recipe_id) between 1 and 150),
  data jsonb,
  version bigint not null default 1 check (version > 0),
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id),
  check ((deleted and data is null) or
    (not deleted and data is not null and jsonb_typeof(data) = 'object'
      and data->>'id' = recipe_id and octet_length(data::text) <= 100000))
);
alter table public.recipes enable row level security;
revoke all on public.recipes from public, anon, authenticated;
grant select on public.recipes to authenticated;
drop policy if exists "Read own recipes" on public.recipes;
create policy "Read own recipes" on public.recipes for select to authenticated using ((select auth.uid()) = user_id);

-- Acknowledgements make retrying a lost response safe.
create table if not exists public.recipe_mutations (
  user_id uuid not null references auth.users(id) on delete cascade,
  mutation_id uuid not null,
  response jsonb not null,
  primary key (user_id, mutation_id)
);
alter table public.recipe_mutations enable row level security;
revoke all on public.recipe_mutations from public, anon, authenticated;

create or replace function public.save_recipe(
  p_recipe_id text,
  p_data jsonb,
  p_expected_version bigint,
  p_mutation_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_row public.recipes%rowtype;
  v_response jsonb;
begin
  if v_user is null then raise exception 'Sign in to save recipes'; end if;
  if p_recipe_id is null or length(p_recipe_id) not between 1 and 150 or p_expected_version is null or p_expected_version < 0 or p_mutation_id is null then
    raise exception 'Invalid recipe request';
  end if;
  if p_data is not null and (jsonb_typeof(p_data) is distinct from 'object' or p_data->>'id' is distinct from p_recipe_id or octet_length(p_data::text) > 100000) then
    raise exception 'Invalid recipe data';
  end if;
  -- Serialize requests for this account so duplicate mutations are atomic.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 0));
  select response into v_response from public.recipe_mutations where user_id = v_user and mutation_id = p_mutation_id;
  if found then return v_response; end if;

  select * into v_row from public.recipes where user_id = v_user and recipe_id = p_recipe_id for update;
  if found then
    if v_row.version <> p_expected_version then
      return jsonb_build_object('status', 'conflict', 'row', to_jsonb(v_row) - 'user_id');
    end if;
    update public.recipes set data = p_data, deleted = (p_data is null), version = version + 1, updated_at = now()
      where user_id = v_user and recipe_id = p_recipe_id returning * into v_row;
  else
    if p_expected_version <> 0 then raise exception 'Recipe version no longer available'; end if;
    insert into public.recipes (user_id, recipe_id, data, deleted)
      values (v_user, p_recipe_id, p_data, p_data is null) returning * into v_row;
  end if;
  v_response := jsonb_build_object('status', 'applied', 'row', to_jsonb(v_row) - 'user_id');
  insert into public.recipe_mutations (user_id, mutation_id, response) values (v_user, p_mutation_id, v_response);
  return v_response;
end;
$$;
revoke all on function public.save_recipe(text, jsonb, bigint, uuid) from public, anon;
grant execute on function public.save_recipe(text, jsonb, bigint, uuid) to authenticated;
