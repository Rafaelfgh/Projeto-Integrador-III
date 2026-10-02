-- Remove a coluna "setor" dos funcionários (30/09/2026).
-- Não é usada: as especialidades (funcionario_especialidades) substituíram o setor.
alter table public."Funcionarios" drop column if exists setor;
