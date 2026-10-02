import { supabase } from '../backend/supabaseClient';

// Para onde leva o clique numa notificação (endereço da tela, já pedindo para abrir o item).
// As telas leem estes parâmetros: ?ocorrencia= (Gerenciar, para gestão, e tarefa do funcionário),
// ?ocorrenciaId= / ?reclamacaoId= (Minhas Solicitações), ?reclamacao= (painel do síndico),
// ?aviso=, ?recado= e ?condominio= (painel do Dev).

const INICIO = {
  DEV: '/painel-dev', MASTER: '/painel-master', SINDICO: '/painel',
  FUNCIONARIO: '/painel-funcionario', MORADOR: '/dashboard',
};

// Avisos que falam com o autor da ocorrência (ele acompanha em Minhas Solicitações)
const DO_AUTOR = new Set(['OCORRENCIA_RECEBIDA', 'STATUS_OCORRENCIA', 'NOVO_COMENTARIO', 'PRONUNCIAMENTO_SINDICO']);

// Tela da gestão onde a ocorrência faz sentido
const PAGINA_GESTAO = {
  ANALISE_SOLICITADA: '/ocorrencias-analise',
  ANDAMENTO_PROLONGADO: '/andamento-prolongado',
  TAREFA_FINALIZADA: '/ocorrencias-concluidas',
  NOVA_MENSAGEM: '/ocorrencias-pessoais', // conversa só existe nas pessoais
};

export const destinoDaNotificacao = async (notificacao, papel) => {
  const { tipo, referencia_tipo: refTipo, referencia_id: id } = notificacao;
  const gestao = papel === 'SINDICO' || papel === 'MASTER';

  switch (refTipo) {
    case 'ocorrencia': {
      if (!id) return null;
      if (papel === 'FUNCIONARIO') return `/painel-funcionario?ocorrencia=${id}`;
      if (!gestao || DO_AUTOR.has(tipo)) return `/solicitacoes?ocorrenciaId=${id}`;
      let pagina = PAGINA_GESTAO[tipo];
      if (!pagina) {
        const { data } = await supabase.from('Ocorrencias').select('privacidade').eq('id', id).maybeSingle();
        pagina = data?.privacidade === 'pessoal' ? '/ocorrencias-pessoais' : '/feed';
      }
      return `${pagina}?ocorrencia=${id}`;
    }
    case 'reclamacao':
      if (!id) return null;
      return gestao && tipo === 'NOVA_RECLAMACAO' ? `/painel?reclamacao=${id}` : `/solicitacoes?reclamacaoId=${id}`;
    case 'aviso':
      return id ? `/avisos?aviso=${id}` : '/avisos';
    case 'recado':
      return id ? `/recados?recado=${id}` : '/recados';
    case 'condominio':
      if (papel === 'DEV') return id ? `/painel-dev?condominio=${id}` : '/painel-dev';
      return '/painel-master';
    case 'perfil':
      return tipo === 'TROCAR_SENHA' ? '/primeiro-acesso' : '/perfil';
    case 'sindico':
      return tipo === 'SINDICO_PROMOVIDO' ? '/painel' : '/dashboard';
    case 'morador':
    case 'funcionario':
      if (tipo === 'NOVO_CADASTRO') return '/painel-master?tab=usuarios&sub=pendentes';
      if (tipo === 'CADASTRO_BLOQUEADO') return null; // a própria tela de bloqueio já aparece
      return INICIO[papel] || '/dashboard';
    default:
      return null;
  }
};
