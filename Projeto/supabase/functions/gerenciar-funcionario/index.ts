// Cria e remove contas de funcionário com a API admin do Supabase e grava a foto.
// Cadastrar e trocar foto: Master ou síndico do condomínio. Remover: só o Master.
// A chave secreta fica no servidor; o funcionário não consegue alterar a própria foto.
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

const FOTO_MAX_BYTES = 400 * 1024; // a tela já reduz para 300x400

// Foto chega em base64 (JPEG reduzido no navegador); confere tamanho e assinatura do JPEG
const lerFoto = (base64: unknown): Uint8Array | string => {
  if (typeof base64 !== 'string' || !base64) return 'Foto inválida.';
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(base64.replace(/^data:image\/jpeg;base64,/, '')), (c) => c.charCodeAt(0));
  } catch {
    return 'Foto inválida.';
  }
  if (bytes.length > FOTO_MAX_BYTES) return 'A foto é grande demais.';
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return 'A foto precisa ser JPEG.';
  return bytes;
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

  // Master de condomínio aprovado, ou síndico ativo de condomínio aprovado
  let condominioId: number | null = null;
  let ehMaster = false;
  const { data: comoMaster } = await admin
    .from('Condominios').select('id').eq('master_id', chamador.id).eq('status', 'ATIVO').maybeSingle();
  if (comoMaster) {
    condominioId = comoMaster.id;
    ehMaster = true;
  } else {
    const { data: gestao } = await admin
      .from('Gestao_Sindicos').select('condominio_id')
      .eq('morador_id', chamador.id).eq('ativo', true).limit(1).maybeSingle();
    if (gestao) {
      const [{ data: morador }, { data: condo }] = await Promise.all([
        admin.from('Moradores').select('id').eq('id', chamador.id).eq('status', 'ATIVO').maybeSingle(),
        admin.from('Condominios').select('id').eq('id', gestao.condominio_id).eq('status', 'ATIVO').maybeSingle(),
      ]);
      if (morador && condo) condominioId = gestao.condominio_id;
    }
  }
  if (!condominioId) return json({ error: 'Apenas o master ou o síndico do condomínio podem gerenciar funcionários.' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corpo da requisição inválido.' }, 400);
  }

  // Grava/troca a foto em funcionarios/<condominio>/<funcionario>.jpg
  const salvarFoto = async (funcionarioId: string, bytes: Uint8Array) => {
    const caminho = `${condominioId}/${funcionarioId}.jpg`;
    const { error: erroUpload } = await admin.storage.from('funcionarios')
      .upload(caminho, bytes, { contentType: 'image/jpeg', upsert: true });
    if (erroUpload) return erroUpload.message;
    const { error: erroFoto } = await admin.from('Funcionarios').update({ foto: caminho }).eq('id', funcionarioId);
    return erroFoto?.message ?? null;
  };

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

    let foto: Uint8Array | null = null;
    if (body.foto) {
      const lida = lerFoto(body.foto);
      if (typeof lida === 'string') return json({ error: lida }, 400);
      foto = lida;
    }

    const { data: criado, error: erroAuth } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });
    if (erroAuth || !criado?.user) return json({ error: traduzErro(erroAuth?.message ?? 'Erro ao criar a conta.') }, 400);
    const id = criado.user.id;

    // Senha definida pela gestão é provisória: o funcionário é avisado para trocar
    const { error: erroFunc } = await admin.from('Funcionarios').insert({
      id, nome, condominio_id: condominioId, status: 'ATIVO', precisa_trocar_senha: true,
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

    // A foto é opcional: se falhar, o funcionário fica cadastrado e a tela avisa
    let aviso: string | null = null;
    let caminhoFoto: string | null = null;
    if (foto) {
      const erroFoto = await salvarFoto(id, foto);
      if (erroFoto) aviso = 'Funcionário cadastrado, mas a foto não foi salva.';
      else caminhoFoto = `${condominioId}/${id}.jpg`;
    }

    return json({ id, nome, email, especialidades, condominio_id: condominioId, foto: caminhoFoto, aviso });
  }

  if (body.acao === 'foto') {
    const id = String(body.funcionario_id ?? '');
    const { data: funcionario } = await admin
      .from('Funcionarios').select('id').eq('id', id).eq('condominio_id', condominioId).maybeSingle();
    if (!funcionario) return json({ error: 'Funcionário não encontrado neste condomínio.' }, 404);
    const lida = lerFoto(body.foto);
    if (typeof lida === 'string') return json({ error: lida }, 400);
    const erroFoto = await salvarFoto(id, lida);
    if (erroFoto) return json({ error: erroFoto }, 400);
    return json({ ok: true, foto: `${condominioId}/${id}.jpg` });
  }

  if (body.acao === 'remover') {
    if (!ehMaster) return json({ error: 'Apenas o master pode remover funcionários.' }, 403);
    const id = String(body.funcionario_id ?? '');
    const { data: funcionario } = await admin
      .from('Funcionarios').select('id, foto').eq('id', id).eq('condominio_id', condominioId).maybeSingle();
    if (!funcionario) return json({ error: 'Funcionário não encontrado neste condomínio.' }, 404);

    // Apagar a conta remove o funcionário e as especialidades (cascata); as ocorrências
    // guardam o nome de quem colocou em andamento e de quem concluiu.
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return json({ error: error.message }, 400);
    if (funcionario.foto) await admin.storage.from('funcionarios').remove([funcionario.foto]);
    return json({ ok: true });
  }

  return json({ error: 'Ação inválida.' }, 400);
});
