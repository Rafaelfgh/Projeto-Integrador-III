// Cria e remove contas de funcionário com a API admin do Supabase.
// Só o Master do condomínio pode chamar. A chave secreta fica no servidor.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const traduzErro = (msg: string) => {
  if (/already been registered|already registered|already exists/i.test(msg)) return 'Este e-mail já está cadastrado.';
  if (/password/i.test(msg)) return 'Senha inválida (mínimo de 6 caracteres).';
  if (/email/i.test(msg)) return 'E-mail inválido.';
  return msg;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Quem está chamando?
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return json({ error: 'Sessão inválida. Faça login novamente.' }, 401);
  const chamador = userData.user;

  const { data: condominio } = await admin
    .from('Condominios').select('id').eq('master_id', chamador.id).eq('status', 'ATIVO').maybeSingle();
  if (!condominio) return json({ error: 'Apenas o Master de um condomínio aprovado pode gerenciar funcionários.' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corpo da requisição inválido.' }, 400);
  }

  if (body.acao === 'criar') {
    const nome = String(body.nome ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const senha = String(body.senha ?? '');
    const especialidades = Array.isArray(body.especialidades)
      ? [...new Set(body.especialidades.map(String))]
      : [];

    if (!nome || !email || senha.length < 6) {
      return json({ error: 'Informe nome, e-mail e uma senha com pelo menos 6 caracteres.' }, 400);
    }

    const { data: criado, error: erroAuth } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });
    if (erroAuth || !criado?.user) return json({ error: traduzErro(erroAuth?.message ?? 'Erro ao criar a conta.') }, 400);
    const id = criado.user.id;

    // Senha definida pelo Master é provisória: o funcionário é avisado para trocar
    const { error: erroFunc } = await admin.from('Funcionarios').insert({
      id, nome, condominio_id: condominio.id, status: 'ATIVO', precisa_trocar_senha: true,
    });
    if (erroFunc) {
      await admin.auth.admin.deleteUser(id);
      return json({ error: erroFunc.message }, 400);
    }

    if (especialidades.length > 0) {
      const { error: erroEsp } = await admin.from('funcionario_especialidades')
        .insert(especialidades.map((categoria) => ({ funcionario_id: id, categoria })));
      if (erroEsp) {
        await admin.auth.admin.deleteUser(id); // apaga também a linha em Funcionarios (cascata)
        return json({ error: erroEsp.message }, 400);
      }
    }

    return json({ id, nome, email, especialidades, condominio_id: condominio.id });
  }

  if (body.acao === 'remover') {
    const id = String(body.funcionario_id ?? '');
    const { data: funcionario } = await admin
      .from('Funcionarios').select('id').eq('id', id).eq('condominio_id', condominio.id).maybeSingle();
    if (!funcionario) return json({ error: 'Funcionário não encontrado neste condomínio.' }, 404);

    // Apagar a conta remove o funcionário e as especialidades (cascata);
    // as ocorrências dele ficam sem responsável e o histórico guarda o nome.
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: 'Ação inválida.' }, 400);
});
