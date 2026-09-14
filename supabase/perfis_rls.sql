-- ============================================================
-- MANANCIAL JIU JITSU
-- PERFIS DE ACESSO + RLS COMPLEMENTAR
-- Execute uma vez no SQL Editor do Supabase.
-- ============================================================

-- 1) Função auxiliar para verificar o perfil do usuário autenticado.
create or replace function public.tem_perfil(perfis text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios
    where user_id = auth.uid()
      and ativo = true
      and perfil = any(perfis)
  );
$$;

grant execute on function public.tem_perfil(text[]) to authenticated;

-- 2) O usuário autenticado pode visualizar o próprio cadastro.
drop policy if exists usuario_visualiza_proprio on public.usuarios;

create policy usuario_visualiza_proprio
on public.usuarios
for select
to authenticated
using (
  user_id = auth.uid()
);



-- ============================================================
-- PROTEÇÃO: NÃO DEIXAR O SISTEMA SEM ADMINISTRADOR
-- ============================================================

create or replace function public.proteger_ultimo_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_outros_admins integer;
begin
  if
    old.perfil = 'admin'
    and old.ativo = true
    and (
      tg_op = 'DELETE'
      or new.perfil <> 'admin'
      or new.ativo = false
    )
  then
    select count(*)
    into v_outros_admins
    from public.usuarios
    where perfil = 'admin'
      and ativo = true
      and id <> old.id;

    if v_outros_admins = 0 then
      raise exception
        'Não é possível remover ou inativar o último administrador ativo.';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_ultimo_admin
on public.usuarios;

create trigger trg_proteger_ultimo_admin
before update or delete
on public.usuarios
for each row
execute function public.proteger_ultimo_admin();

-- ============================================================
-- ALUNOS
-- Professor/Instrutor/Recepção: leitura
-- Recepção: cadastro e edição
-- ============================================================

drop policy if exists acesso_alunos_leitura_perfis on public.alunos;
create policy acesso_alunos_leitura_perfis
on public.alunos
for select
to authenticated
using (
  public.tem_perfil(
    array['professor','instrutor','recepcao']
  )
);

drop policy if exists acesso_alunos_inserir_recepcao on public.alunos;
create policy acesso_alunos_inserir_recepcao
on public.alunos
for insert
to authenticated
with check (
  public.tem_perfil(array['recepcao'])
);

drop policy if exists acesso_alunos_editar_recepcao on public.alunos;
create policy acesso_alunos_editar_recepcao
on public.alunos
for update
to authenticated
using (
  public.tem_perfil(array['recepcao'])
)
with check (
  public.tem_perfil(array['recepcao'])
);

-- ============================================================
-- RESPONSÁVEIS
-- ============================================================

drop policy if exists acesso_responsaveis_leitura_perfis on public.responsaveis;
create policy acesso_responsaveis_leitura_perfis
on public.responsaveis
for select
to authenticated
using (
  public.tem_perfil(
    array['professor','instrutor','recepcao']
  )
);

drop policy if exists acesso_responsaveis_gravar_recepcao on public.responsaveis;
create policy acesso_responsaveis_gravar_recepcao
on public.responsaveis
for all
to authenticated
using (
  public.tem_perfil(array['recepcao'])
)
with check (
  public.tem_perfil(array['recepcao'])
);

-- ============================================================
-- PROFESSORES
-- ============================================================

drop policy if exists acesso_professores_leitura_perfis on public.professores;
create policy acesso_professores_leitura_perfis
on public.professores
for select
to authenticated
using (
  public.tem_perfil(
    array['professor','instrutor','recepcao']
  )
);

-- ============================================================
-- TURMAS / HORÁRIOS / ALUNOS DA TURMA
-- Professor: pode gerenciar
-- Instrutor/Recepção: leitura
-- ============================================================

drop policy if exists acesso_turmas_leitura_perfis on public.turmas;
create policy acesso_turmas_leitura_perfis
on public.turmas
for select
to authenticated
using (
  public.tem_perfil(
    array['professor','instrutor','recepcao']
  )
);

drop policy if exists acesso_turmas_gravar_professor on public.turmas;
create policy acesso_turmas_gravar_professor
on public.turmas
for all
to authenticated
using (
  public.tem_perfil(array['professor'])
)
with check (
  public.tem_perfil(array['professor'])
);

drop policy if exists acesso_horarios_leitura_perfis on public.turma_horarios;
create policy acesso_horarios_leitura_perfis
on public.turma_horarios
for select
to authenticated
using (
  public.tem_perfil(
    array['professor','instrutor','recepcao']
  )
);

drop policy if exists acesso_horarios_gravar_professor on public.turma_horarios;
create policy acesso_horarios_gravar_professor
on public.turma_horarios
for all
to authenticated
using (
  public.tem_perfil(array['professor'])
)
with check (
  public.tem_perfil(array['professor'])
);

drop policy if exists acesso_turma_alunos_leitura_perfis on public.turma_alunos;
create policy acesso_turma_alunos_leitura_perfis
on public.turma_alunos
for select
to authenticated
using (
  public.tem_perfil(
    array['professor','instrutor','recepcao']
  )
);

drop policy if exists acesso_turma_alunos_gravar_professor on public.turma_alunos;
create policy acesso_turma_alunos_gravar_professor
on public.turma_alunos
for all
to authenticated
using (
  public.tem_perfil(array['professor'])
)
with check (
  public.tem_perfil(array['professor'])
);

-- ============================================================
-- PRESENÇAS
-- Professor e Instrutor podem registrar/editar.
-- ============================================================

drop policy if exists acesso_presencas_leitura_perfis on public.presencas;
create policy acesso_presencas_leitura_perfis
on public.presencas
for select
to authenticated
using (
  public.tem_perfil(
    array['professor','instrutor']
  )
);

drop policy if exists acesso_presencas_gravar_perfis on public.presencas;
create policy acesso_presencas_gravar_perfis
on public.presencas
for all
to authenticated
using (
  public.tem_perfil(
    array['professor','instrutor']
  )
)
with check (
  public.tem_perfil(
    array['professor','instrutor']
  )
);

-- ============================================================
-- GRADUAÇÕES
-- Professor pode consultar.
-- O registro continua via RPC registrar_graduacao.
-- ============================================================

drop policy if exists acesso_graduacoes_leitura_professor on public.graduacoes;
create policy acesso_graduacoes_leitura_professor
on public.graduacoes
for select
to authenticated
using (
  public.tem_perfil(array['professor'])
);

-- Atualiza a RPC de graduação para permitir admin ou professor.
create or replace function public.registrar_graduacao(
  p_aluno_id uuid,
  p_nova_faixa text,
  p_novo_grau integer,
  p_data_graduacao date,
  p_professor_id uuid default null,
  p_observacoes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_faixa_anterior text;
  v_grau_anterior integer;
  v_graduacao_id uuid;
begin
  if not (
    public.is_admin()
    or public.tem_perfil(array['professor'])
  ) then
    raise exception 'Acesso negado.';
  end if;

  if p_aluno_id is null then
    raise exception 'Aluno não informado.';
  end if;

  if p_nova_faixa is null or btrim(p_nova_faixa) = '' then
    raise exception 'Nova faixa não informada.';
  end if;

  if p_novo_grau is null or p_novo_grau < 0 or p_novo_grau > 10 then
    raise exception 'O grau deve estar entre 0 e 10.';
  end if;

  if p_data_graduacao is null then
    raise exception 'Data da graduação não informada.';
  end if;

  select
    faixa,
    coalesce(grau, 0)
  into
    v_faixa_anterior,
    v_grau_anterior
  from public.alunos
  where id = p_aluno_id
  for update;

  if not found then
    raise exception 'Aluno não encontrado.';
  end if;

  if
    coalesce(v_faixa_anterior, '') = btrim(p_nova_faixa)
    and v_grau_anterior = p_novo_grau
  then
    raise exception 'A nova graduação é igual à graduação atual.';
  end if;

  if p_professor_id is not null and not exists (
    select 1
    from public.professores
    where id = p_professor_id
      and ativo = true
  ) then
    raise exception 'Professor responsável inválido ou inativo.';
  end if;

  insert into public.graduacoes (
    aluno_id,
    faixa_anterior,
    grau_anterior,
    nova_faixa,
    novo_grau,
    data_graduacao,
    professor_id,
    observacoes
  )
  values (
    p_aluno_id,
    v_faixa_anterior,
    v_grau_anterior,
    btrim(p_nova_faixa),
    p_novo_grau,
    p_data_graduacao,
    p_professor_id,
    nullif(btrim(coalesce(p_observacoes, '')), '')
  )
  returning id into v_graduacao_id;

  update public.alunos
  set
    faixa = btrim(p_nova_faixa),
    grau = p_novo_grau
  where id = p_aluno_id;

  return v_graduacao_id;
end;
$$;

-- ============================================================
-- FINANCEIRO
-- Recepção pode consultar e operar.
-- ============================================================

drop policy if exists acesso_planos_recepcao on public.planos;
create policy acesso_planos_recepcao
on public.planos
for all
to authenticated
using (
  public.tem_perfil(array['recepcao'])
)
with check (
  public.tem_perfil(array['recepcao'])
);

drop policy if exists acesso_matriculas_recepcao on public.matriculas;
create policy acesso_matriculas_recepcao
on public.matriculas
for all
to authenticated
using (
  public.tem_perfil(array['recepcao'])
)
with check (
  public.tem_perfil(array['recepcao'])
);

drop policy if exists acesso_mensalidades_recepcao on public.mensalidades;
create policy acesso_mensalidades_recepcao
on public.mensalidades
for all
to authenticated
using (
  public.tem_perfil(array['recepcao'])
)
with check (
  public.tem_perfil(array['recepcao'])
);

drop policy if exists acesso_pagamentos_recepcao on public.pagamentos;
create policy acesso_pagamentos_recepcao
on public.pagamentos
for all
to authenticated
using (
  public.tem_perfil(array['recepcao'])
)
with check (
  public.tem_perfil(array['recepcao'])
);

-- ============================================================
-- OBSERVAÇÃO
-- As políticas de ADMIN já existentes continuam valendo.
-- PostgreSQL RLS combina políticas permissivas com OR.
-- ============================================================
