// Envia ao celular (Firebase Cloud Messaging) a notificação que acabou de entrar em "notificacoes".
// Chamada pelo gatilho trg_notificacoes_push só com o id. Não confia no corpo: busca a notificação
// no banco e marca push_enviado_em (cada uma sai uma vez só e só se tiver menos de 10 minutos).
// Segredo necessário (painel do Supabase → Edge Functions → Secrets): FIREBASE_SERVICE_ACCOUNT
// = o JSON inteiro da conta de serviço do Firebase.
import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

type ContaServico = { project_id: string; client_email: string; private_key: string };
let conta: ContaServico | null = null;
let acesso: { token: string; expira: number } | null = null;

const b64url = (dados: ArrayBuffer | string) => {
  const bytes = typeof dados === 'string' ? new TextEncoder().encode(dados) : new Uint8Array(dados);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Token OAuth do Google a partir da conta de serviço (JWT assinado RS256), guardado até expirar
const tokenGoogle = async (): Promise<string> => {
  if (acesso && acesso.expira > Date.now() + 60_000) return acesso.token;
  conta ??= JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? 'null');
  if (!conta?.private_key) throw new Error('FIREBASE_SERVICE_ACCOUNT não configurado');
  const agora = Math.floor(Date.now() / 1000);
  const corpo = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify({
    iss: conta.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token', iat: agora, exp: agora + 3600,
  }))}`;
  const pem = conta.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const chave = await crypto.subtle.importKey(
    'pkcs8', Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const assinatura = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(corpo));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${corpo}.${b64url(assinatura)}`,
    }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`OAuth Google: ${d.error_description || d.error}`);
  acesso = { token: d.access_token, expira: Date.now() + d.expires_in * 1000 };
  return acesso.token;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ erro: 'método' }, 405);
  const { notificacao_id } = await req.json().catch(() => ({}));
  if (typeof notificacao_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(notificacao_id)) return json({ erro: 'id' }, 400);

  // "Reserva" a notificação: se outra chamada já mandou, ou se é antiga, não faz nada
  const dezMin = new Date(Date.now() - 10 * 60_000).toISOString();
  const { data: n, error } = await admin.from('notificacoes')
    .update({ push_enviado_em: new Date().toISOString() })
    .eq('id', notificacao_id).is('push_enviado_em', null).gte('criado_em', dezMin)
    .select('id, destinatario_id, tipo, titulo, descricao, referencia_tipo, referencia_id, prioridade')
    .maybeSingle();
  if (error) return json({ erro: error.message }, 500);
  if (!n) return json({ enviado: 0 });

  const { data: aparelhos } = await admin.from('dispositivos_push').select('token').eq('usuario_id', n.destinatario_id);
  if (!aparelhos?.length) return json({ enviado: 0 });

  const token = await tokenGoogle();
  let enviados = 0;
  for (const { token: alvo } of aparelhos) {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${conta!.project_id}/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token: alvo,
          notification: { title: n.titulo, body: n.descricao || '' },
          // Lido pelo app ao tocar na notificação para abrir a tela certa
          data: {
            notificacao_id: n.id, tipo: n.tipo ?? '', referencia_tipo: n.referencia_tipo ?? '', referencia_id: n.referencia_id ?? '',
          },
          android: {
            // HIGH: o Android entrega na hora (com NORMAL ele segura até o celular "acordar")
            priority: 'HIGH',
            notification: { channel_id: 'habitare', icon: 'ic_notificacao', color: '#F47920' },
          },
        },
      }),
    });
    if (r.ok) { enviados++; continue; }
    const falha = await r.json().catch(() => ({}));
    const codigo = falha?.error?.details?.find?.((d: { errorCode?: string }) => d.errorCode)?.errorCode;
    // Aparelho desinstalou o app ou trocou de token: tira da lista
    if (r.status === 404 || codigo === 'UNREGISTERED') {
      await admin.from('dispositivos_push').delete().eq('token', alvo);
    } else {
      console.error('FCM', r.status, JSON.stringify(falha));
    }
  }
  return json({ enviado: enviados });
});
