import { supabase } from '../backend/supabaseClient';

/**
 * Cria uma nova notificação no banco de dados
 * @param {Object} params - Parâmetros da notificação
 * @param {string} params.destinatario_id - ID do usuário que vai receber
 * @param {string} params.condominio_id - ID do condomínio (opcional)
 * @param {string} params.tipo - Categoria da notificação (ex: 'NOVA_OCORRENCIA')
 * @param {string} params.titulo - Título da notificação
 * @param {string} params.descricao - Texto detalhado da notificação
 * @param {string} params.referencia_tipo - Tipo de entidade relacionada (ex: 'ocorrencia', 'tarefa')
 * @param {string} params.referencia_id - ID da entidade relacionada
 * @param {string} params.remetente_id - ID do usuário que gerou a ação
 * @param {string} params.remetente_nome - Nome do usuário que gerou a ação
 * @returns {Promise<Object>} Resultado da inserção
 */
export const criarNotificacao = async ({
  destinatario_id,
  condominio_id = null,
  tipo,
  titulo,
  descricao = null,
  referencia_tipo = null,
  referencia_id = null,
  remetente_id = null,
  remetente_nome = null
}) => {
  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .insert([{
        destinatario_id,
        condominio_id,
        tipo,
        titulo,
        descricao,
        referencia_tipo,
        referencia_id,
        remetente_id,
        remetente_nome
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Falha no serviço de notificação:', error);
    return null;
  }
};
