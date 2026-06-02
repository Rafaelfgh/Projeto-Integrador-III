import React, { useState, useRef, useMemo } from 'react';
import {
  Menu,
  X,
  Search,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  Play,
  Camera,
  AlertCircle,
  Building2,
  User,
  ShieldCheck,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';

import { useAuth } from '../contexts/AuthContext';
import { criarNotificacao } from '../services/notificationService';

import './Dashboard.css';
import './MinhasSolicitacoes.css';

// ======================================================
// SETORES
// ======================================================

const SETOR_CATEGORIAS = {
  limpeza: ['limpeza'],

  manutencao: [
    'manutencao',
    'hidraulica',
    'eletrica',
    'infraestrutura',
  ],

  seguranca: [
    'seguranca',
    'portaria',
  ],
};

// ======================================================
// METADADOS
// ======================================================

const CATEGORIA_META = {
  limpeza: {
    label: 'Limpeza',
    icon: '🧹',
    class: 'ms-icon-green',
  },

  manutencao: {
    label: 'Manutenção',
    icon: '🔧',
    class: 'ms-icon-orange',
  },

  seguranca: {
    label: 'Segurança',
    icon: '🛡️',
    class: 'ms-icon-red',
  },

  portaria: {
    label: 'Portaria',
    icon: '🏠',
    class: 'ms-icon-green',
  },

  hidraulica: {
    label: 'Hidráulica',
    icon: '💧',
    class: 'ms-icon-blue',
  },

  eletrica: {
    label: 'Elétrica',
    icon: '⚡',
    class: 'ms-icon-yellow',
  },

  infraestrutura: {
    label: 'Infraestrutura',
    icon: '🏗️',
    class: 'ms-icon-purple',
  },
};

const STATUS_META = {
  aberta: {
    label: 'Aberta',
    class: 'ms-status-red',
  },

  em_analise: {
    label: 'Em Análise',
    class: 'ms-status-yellow',
  },

  aguardando_validacao: {
    label: 'Validação',
    class: 'ms-status-blue',
  },

  resolvida: {
    label: 'Resolvida',
    class: 'ms-status-green',
  },
};

const FILTROS = [
  { key: 'todas', label: 'Todos' },
  { key: 'aberta', label: 'Abertas' },
  { key: 'em_analise', label: 'Em análise' },
  { key: 'aguardando_validacao', label: 'Validação' },
  { key: 'resolvida', label: 'Resolvidas' },
];

// ======================================================
// MOCK
// ======================================================

const MOCK_OCORRENCIAS = [
  {
    id: 101,
    titulo: 'Limpeza da garagem do subsolo',
    descricao:
      'Necessário limpar o piso e retirar resíduos da área comum.',

    categoria: 'limpeza',

    status: 'aberta',

    created_at: '2026-05-25',

    bloco: 'Subsolo',
    apartamento: 'Garagem',

    morador_nome: 'Síndico Roberto',

    evidencias: [],
  },

  {
    id: 102,

    titulo: 'Troca de lâmpadas do corredor',

    descricao:
      'Lâmpadas queimadas no corredor do bloco C.',

    categoria: 'eletrica',

    status: 'em_analise',

    created_at: '2026-05-25',

    bloco: 'Bloco C',
    apartamento: '2º andar',

    morador_nome: 'João Silva',

    evidencias: [],
  },

  {
    id: 103,

    titulo: 'Verificação das câmeras',

    descricao:
      'Câmeras da entrada principal offline.',

    categoria: 'seguranca',

    status: 'aberta',

    created_at: '2026-05-24',

    bloco: 'Portaria',
    apartamento: 'Entrada Principal',

    morador_nome: 'Síndico Roberto',

    evidencias: [],
  },

  {
    id: 104,

    titulo: 'Vazamento no banheiro',

    descricao:
      'Infiltração no teto do apartamento 304.',

    categoria: 'hidraulica',

    status: 'aguardando_validacao',

    created_at: '2026-05-24',

    bloco: 'Bloco B',
    apartamento: '304',

    morador_nome: 'Ana Costa',

    evidencias: [],
  },
];

// ======================================================
// CARD
// ======================================================

const OcorrenciaCard = ({
  ocorrencia,
  onAbrir,
}) => {
  const categoria =
    CATEGORIA_META[ocorrencia.categoria];

  const status =
    STATUS_META[ocorrencia.status];

  const protocolo = `TRF-${String(
    ocorrencia.id
  ).padStart(3, '0')}`;

  return (
    <div className="ms-premium-card">
      {/* HEADER */}
      <div className="ms-card-header">
        <span
          className={`ms-status ${status.class}`}
        >
          {status.label}
        </span>

        <div
          className={`ms-card-icon-wrap ${categoria.class}`}
        >
          <span style={{ fontSize: 18 }}>
            {categoria.icon}
          </span>
        </div>
      </div>

      {/* BODY */}
      <div className="ms-card-body">
        <span className="ms-protocol-tag">
          {protocolo}
        </span>

        <h4 className="ms-card-title">
          {ocorrencia.titulo}
        </h4>
      </div>

      <div className="ms-card-divider"></div>

      {/* FOOTER */}
      <div className="ms-card-footer">
        <div className="ms-card-date">
          <CalendarDays size={14} />

          {new Date(
            ocorrencia.created_at
          ).toLocaleDateString('pt-BR')}
        </div>

        <button
          className="ms-card-action"
          onClick={() => onAbrir(ocorrencia)}
        >
          Acompanhar
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ======================================================
// DRAWER
// ======================================================

const OcorrenciaDrawer = ({
  ocorrencia,
  onFechar,
  onAtualizar,
  currentUserName,
}) => {
  const fileRef = useRef();

  const [observacao, setObservacao] =
    useState('');

  const [evidencias, setEvidencias] =
    useState(
      ocorrencia.evidencias || []
    );

  const categoria =
    CATEGORIA_META[ocorrencia.categoria];

  const podeFinalizar =
    evidencias.length > 0;

  const adicionarArquivos = (files) => {
    const novos = Array.from(files).map(
      (file) => ({
        id:
          Date.now() + Math.random(),

        nome: file.name,

        url: URL.createObjectURL(file),
      })
    );

    setEvidencias((prev) => [
      ...prev,
      ...novos,
    ]);
  };

  const iniciar = () => {
    onAtualizar(ocorrencia.id, {
      status: 'em_analise',
    });

    onFechar();
  };

  const finalizar = async () => {
    if (!podeFinalizar) return;

    onAtualizar(ocorrencia.id, {
      status:
        'aguardando_validacao',

      evidencias,

      observacao_finalizacao:
        observacao,
    });

    await criarNotificacao({
      destinatario_id:
        'sindico-id',

      tipo: 'TAREFA_FINALIZADA',

      titulo: 'Tarefa finalizada',

      descricao: `${currentUserName} finalizou "${ocorrencia.titulo}"`,
    });

    onFechar();
  };

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={onFechar}
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'rgba(15,23,42,.55)',
          zIndex: 200,
        }}
      />

      {/* DRAWER */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 520,
          height: '100%',
          background: '#fff',
          zIndex: 201,
          overflowY: 'auto',
          borderLeft:
            '1px solid #e2e8f0',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: 24,
            borderBottom:
              '1px solid #f1f5f9',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 14,
              }}
            >
              <div
                className={`ms-card-icon-wrap ${categoria.class}`}
              >
                <span
                  style={{
                    fontSize: 18,
                  }}
                >
                  {categoria.icon}
                </span>
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    color: '#0f172a',
                  }}
                >
                  {ocorrencia.titulo}
                </h2>

                <p
                  style={{
                    marginTop: 6,
                    color: '#64748b',
                    fontSize: 13,
                  }}
                >
                  {categoria.label}
                </p>
              </div>
            </div>

            <button
              onClick={onFechar}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: '#f8fafc',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: 24 }}>
          {/* SOLICITANTE */}
          <div
            style={{
              background: '#f8fafc',
              border:
                '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <h4
              style={{
                fontSize: 12,
                color: '#94a3b8',
                marginBottom: 12,
              }}
            >
              SOLICITANTE
            </h4>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    'center',
                }}
              >
                <User
                  size={20}
                  color="#2563eb"
                />
              </div>

              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    color: '#0f172a',
                  }}
                >
                  {
                    ocorrencia.morador_nome
                  }
                </h3>

                <p
                  style={{
                    margin: '4px 0 0',
                    color: '#64748b',
                    fontSize: 13,
                  }}
                >
                  Morador solicitante
                </p>
              </div>
            </div>
          </div>

          {/* INFORMAÇÕES */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1fr 1fr',
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                background: '#fff',
                border:
                  '1px solid #e2e8f0',
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#64748b',
                  marginBottom: 8,
                }}
              >
                <Building2 size={16} />
                <span
                  style={{
                    fontSize: 13,
                  }}
                >
                  Local
                </span>
              </div>

              <strong
                style={{
                  color: '#0f172a',
                }}
              >
                {ocorrencia.bloco}
              </strong>

              <p
                style={{
                  marginTop: 4,
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                {ocorrencia.apartamento}
              </p>
            </div>

            <div
              style={{
                background: '#fff',
                border:
                  '1px solid #e2e8f0',
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#64748b',
                  marginBottom: 8,
                }}
              >
                <ShieldCheck size={16} />
                <span
                  style={{
                    fontSize: 13,
                  }}
                >
                  Status
                </span>
              </div>

              <span
                className={`ms-status ${STATUS_META[ocorrencia.status].class}`}
              >
                {
                  STATUS_META[
                    ocorrencia.status
                  ].label
                }
              </span>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <h4
            style={{
              fontSize: 12,
              color: '#94a3b8',
              marginBottom: 10,
            }}
          >
            DESCRIÇÃO
          </h4>

          <div
            style={{
              background: '#f8fafc',
              padding: 18,
              borderRadius: 14,
              color: '#334155',
              lineHeight: 1.7,
              fontSize: 14,
            }}
          >
            {ocorrencia.descricao}
          </div>

          {/* EVIDÊNCIAS */}
          <h4
            style={{
              fontSize: 12,
              color: '#94a3b8',
              marginTop: 24,
              marginBottom: 10,
            }}
          >
            EVIDÊNCIAS
          </h4>

          <div
            onClick={() =>
              fileRef.current?.click()
            }
            style={{
              border:
                '1.5px dashed #cbd5e1',
              borderRadius: 16,
              padding: 28,
              textAlign: 'center',
              cursor: 'pointer',
              background: '#fafafa',
            }}
          >
            <Camera
              size={24}
              color="#94a3b8"
            />

            <p
              style={{
                marginTop: 10,
                marginBottom: 4,
                color: '#334155',
                fontWeight: 600,
              }}
            >
              Clique para adicionar fotos
            </p>

            <span
              style={{
                fontSize: 12,
                color: '#94a3b8',
              }}
            >
              JPG ou PNG
            </span>
          </div>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) =>
              adicionarArquivos(
                e.target.files
              )
            }
          />

          {/* OBSERVAÇÃO */}
          <h4
            style={{
              fontSize: 12,
              color: '#94a3b8',
              marginTop: 24,
              marginBottom: 10,
            }}
          >
            OBSERVAÇÃO
          </h4>

          <textarea
            value={observacao}
            onChange={(e) =>
              setObservacao(
                e.target.value
              )
            }
            placeholder="Descreva o que foi realizado..."
            style={{
              width: '100%',
              minHeight: 110,
              borderRadius: 16,
              border:
                '1px solid #e2e8f0',
              padding: 16,
              resize: 'none',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />

          {/* AÇÕES */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 24,
            }}
          >
            {ocorrencia.status ===
              'aberta' && (
              <button
                onClick={iniciar}
                style={{
                  height: 46,
                  border: 'none',
                  borderRadius: 14,
                  padding:
                    '0 18px',
                  background:
                    '#16a34a',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: 8,
                }}
              >
                <Play size={16} />
                Iniciar Atendimento
              </button>
            )}

            {ocorrencia.status ===
              'em_analise' && (
              <button
                onClick={finalizar}
                disabled={
                  !podeFinalizar
                }
                style={{
                  height: 46,
                  border: 'none',
                  borderRadius: 14,
                  padding:
                    '0 18px',
                  background:
                    podeFinalizar
                      ? '#16a34a'
                      : '#94a3b8',
                  color: '#fff',
                  fontWeight: 600,
                  cursor:
                    podeFinalizar
                      ? 'pointer'
                      : 'not-allowed',
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: 8,
                }}
              >
                <CheckCircle2
                  size={16}
                />
                Finalizar
              </button>
            )}
          </div>

          {!podeFinalizar &&
            ocorrencia.status ===
              'em_analise' && (
              <p
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: 6,
                  color: '#d97706',
                  fontSize: 12,
                  marginTop: 12,
                }}
              >
                <AlertCircle
                  size={14}
                />
                Adicione pelo menos
                uma foto
              </p>
            )}
        </div>
      </div>
    </>
  );
};

// ======================================================
// PAGE
// ======================================================

const PainelFuncionario = () => {
  const navigate = useNavigate();

  const { currentUser } =
    useAuth();

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [busca, setBusca] =
    useState('');

  const [filtro, setFiltro] =
    useState('todas');

  const [
    ocorrencias,
    setOcorrencias,
  ] = useState(
    MOCK_OCORRENCIAS
  );

  const [
    selecionada,
    setSelecionada,
  ] = useState(null);

  // ======================================================
  // SETOR DO FUNCIONÁRIO
  // ======================================================

  const setorUsuario =
    currentUser?.setor ||
    'manutencao';

  const categoriasPermitidas =
    SETOR_CATEGORIAS[
      setorUsuario
    ] || [];

  // ======================================================
  // FILTRO
  // ======================================================

  const ocorrenciasFiltradas =
    useMemo(() => {
      return ocorrencias

        .filter((o) =>
          categoriasPermitidas.includes(
            o.categoria
          )
        )

        .filter((o) =>
          filtro === 'todas'
            ? true
            : o.status === filtro
        )

        .filter((o) =>
          o.titulo
            .toLowerCase()
            .includes(
              busca.toLowerCase()
            )
        );
    }, [
      ocorrencias,
      filtro,
      busca,
      categoriasPermitidas,
    ]);

  // ======================================================
  // UPDATE
  // ======================================================

  const atualizar = (
    id,
    changes
  ) => {
    setOcorrencias((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              ...changes,
            }
          : o
      )
    );
  };

  return (
    <div className="dashboard-layout">
      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={
          setSidebarOpen
        }
      />

      {/* MAIN */}
      <main className="main-content">
        {/* HEADER */}
        <header
          className="main-header"
          style={{
            borderBottom: 'none',
          }}
        >
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              <Menu size={20} />
            </button>

            <div className="header-breadcrumbs">
              <h2 className="header-title">
                Minhas Tarefas
              </h2>

              <p className="header-date">
                Serviços do setor de{' '}
                {setorUsuario}
              </p>
            </div>
          </div>

          <div className="header-right">
            <NotificationMenu />

            <div 
              className="user-profile-dropdown" 
              onClick={() => navigate('/perfil')} 
              style={{ 
                display:'flex', 
                alignItems:'center', 
                gap:'0.75rem', 
                borderLeft:'1px solid #e2e8f0', 
                paddingLeft:'1rem',
                cursor: 'pointer' 
              }}
            >
              <div style={{
                width:36, height:36, borderRadius:'50%',
                background:'var(--role-primary-color)', color:'white',
                display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
              }}>
                {currentUser?.name?.charAt(0) || 'F'}
              </div>
            </div>
          </div>
        </header>

        <ContextBanner />

        {/* CONTENT */}
        <div
          className="dashboard-content-scroll"
          style={{
            backgroundColor:
              '#f8fafc',
          }}
        >
          <div className="ms-container">
            {/* SEARCH */}
            <div className="ms-header-actions">
              <div className="ms-search-wrapper">
                <Search
                  size={18}
                  className="ms-search-icon"
                />

                <input
                  type="text"
                  className="ms-search-input"
                  placeholder="Pesquisar tarefa..."
                  value={busca}
                  onChange={(e) =>
                    setBusca(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            {/* FILTROS */}
            <div className="ms-filters">
              {FILTROS.map((item) => (
                <button
                  key={item.key}
                  className={`ms-filter-pill ${
                    filtro === item.key
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setFiltro(
                      item.key
                    )
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* GRID */}
            {ocorrenciasFiltradas.length >
            0 ? (
              <div className="ms-cards-grid">
                {ocorrenciasFiltradas.map(
                  (
                    ocorrencia
                  ) => (
                    <OcorrenciaCard
                      key={
                        ocorrencia.id
                      }
                      ocorrencia={
                        ocorrencia
                      }
                      onAbrir={
                        setSelecionada
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div className="ms-empty">
                <CheckCircle2
                  size={48}
                  className="ms-empty-icon"
                />

                <h4 className="ms-empty-title">
                  Nenhuma tarefa
                  encontrada
                </h4>

                <p className="ms-empty-desc">
                  Não existem
                  tarefas para o
                  seu setor no
                  momento ✨
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* DRAWER */}
      {selecionada && (
        <OcorrenciaDrawer
          ocorrencia={
            selecionada
          }
          onFechar={() =>
            setSelecionada(
              null
            )
          }
          onAtualizar={atualizar}
          currentUserName={
            currentUser?.name ||
            'Funcionário'
          }
        />
      )}
    </div>
  );
};

export default PainelFuncionario;