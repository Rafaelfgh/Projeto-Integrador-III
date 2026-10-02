import { supabase } from '../backend/supabaseClient';

// Converte o retorno da RPC meu_perfil() no formato usado pelas telas
const perfilParaUsuario = (perfil) => ({
  id: perfil.id,
  name: perfil.nome || 'Usuário',
  email: perfil.email || '',
  role: perfil.papel,
  status: perfil.status || 'ATIVO',
  condominio_id: perfil.condominio_id,
  condominio_nome: perfil.condominio_nome || '',
  unidade: perfil.bloco && perfil.apartamento
    ? `Bloco ${perfil.bloco}, Apt ${perfil.apartamento}`
    : (perfil.condominio_nome || 'Sem unidade'),
  bloco: perfil.bloco || '',
  apartamento: perfil.apartamento || '',
  phone: perfil.telefone || '',
  cpf: perfil.cpf || '',
  especialidades: perfil.especialidades || [],
  precisaTrocarSenha: !!perfil.precisa_trocar_senha,
  foto: perfil.foto || null, // funcionário: caminho da foto na pasta privada "funcionarios"
  motivoRecusa: perfil.motivo_recusa || '',
});

// Busca papel, condomínio e status do usuário logado direto no banco
export const carregarPerfil = async () => {
  const { data, error } = await supabase.rpc('meu_perfil');
  if (error) throw error;
  return data ? perfilParaUsuario(data) : null;
};
