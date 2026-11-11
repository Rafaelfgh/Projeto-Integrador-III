import React, { useState } from 'react';
import { Plus, X, Loader2, Check, Clock, Sun } from 'lucide-react';
import { DIAS_SEMANA, resumoDependencia } from '../utils/dependencias';
import './EditorBlocos.css';

// Editor de dependências (cadastro do condomínio e aba "Dependências" do master), no
// mesmo formato do editor de blocos. Cada dependência: nome, tipo de agendamento
// (dia inteiro ou faixas de horário que o master define) e dias da semana em que funciona.
//  - onSalvar(dep) e onRemover(dep) podem devolver uma mensagem de erro (ou null);
//  - detalhe(dep) mostra um texto extra na linha (ex.: "2 reservas futuras").

const VAZIO = { nome: '', tipo: 'dia', dias: [0, 1, 2, 3, 4, 5, 6], horarios: [], novoInicio: '', novoFim: '' };
const paraMin = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };

export default function EditorDependencias({ dependencias, onSalvar, onRemover, detalhe, desativado = false }) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState(null);

  const alternarDia = (n) => setForm(f => ({ ...f, dias: f.dias.includes(n) ? f.dias.filter(d => d !== n) : [...f.dias, n] }));

  const adicionarHorario = () => {
    const { novoInicio: ini, novoFim: fim } = form;
    const problema =
      !ini || !fim ? 'Informe o início e o fim do horário.' :
      paraMin(ini) >= paraMin(fim) ? 'O início precisa ser antes do fim.' :
      form.horarios.some(h => paraMin(ini) < paraMin(h.fim) && paraMin(fim) > paraMin(h.inicio)) ? 'Esse horário se sobrepõe a outro já adicionado.' :
      null;
    if (problema) { setErro(problema); return; }
    setErro(null);
    setForm(f => ({
      ...f,
      horarios: [...f.horarios, { inicio: ini, fim }].sort((a, b) => paraMin(a.inicio) - paraMin(b.inicio)),
      novoInicio: '', novoFim: '',
    }));
  };

  const salvar = async () => {
    const nome = form.nome.trim().replace(/\s+/g, ' ');
    const problema =
      !nome ? 'Informe o nome da dependência (ex.: Salão de festas).' :
      dependencias.some(d => d.nome.toLowerCase() === nome.toLowerCase()) ? 'Já existe uma dependência com esse nome.' :
      form.dias.length === 0 ? 'Escolha pelo menos um dia da semana em que ela funciona.' :
      form.tipo === 'horario' && form.horarios.length === 0 ? 'Adicione pelo menos um horário para reservar.' :
      null;
    if (problema) { setErro(problema); return; }
    setErro(null);
    setSalvando(true);
    const falha = await onSalvar({
      nome, tipo: form.tipo, dias_semana: [...form.dias].sort(), horarios: form.tipo === 'horario' ? form.horarios : [],
    });
    setSalvando(false);
    if (falha) { setErro(falha); return; }
    setForm(VAZIO);
    setAberto(false);
  };

  const remover = async (d) => {
    setErro(null);
    setRemovendo(d.nome);
    const falha = await onRemover(d);
    setRemovendo(null);
    if (falha) setErro(falha);
  };

  const bloqueado = desativado || salvando;

  return (
    <div className="eb">
      {dependencias.length > 0 && (
        <ul className="eb-lista">
          {dependencias.map(d => (
            <li key={d.id ?? d.nome} className="eb-bloco">
              <span className="eb-bloco-icone">{d.tipo === 'dia' ? <Sun size={16} /> : <Clock size={16} />}</span>
              <span className="eb-bloco-texto">
                <strong>{d.nome}</strong>
                <small>{resumoDependencia(d)}{detalhe ? ` · ${detalhe(d)}` : ''}</small>
                {d.tipo === 'horario' && d.horarios.length > 0 && (
                  <small className="ed-horarios">{d.horarios.map(h => `${h.inicio}–${h.fim}`).join(' · ')}</small>
                )}
              </span>
              {onRemover && (
                <button type="button" className="eb-remover" title={`Remover ${d.nome}`} onClick={() => remover(d)} disabled={desativado || removendo === d.nome}>
                  {removendo === d.nome ? <Loader2 size={15} className="eb-girando" /> : <X size={15} />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {aberto ? (
        <div className="eb-painel">
          <label className="eb-campo eb-campo-nome">
            <span>Nome da dependência</span>
            <input
              type="text"
              value={form.nome}
              maxLength={60}
              placeholder="Ex.: Salão de festas, Churrasqueira"
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              disabled={bloqueado}
            />
          </label>

          <div className="ed-grupo">
            <span className="ed-rotulo">Como é reservada</span>
            <div className="ed-tipos" role="radiogroup" aria-label="Tipo de agendamento">
              {[{ v: 'dia', r: 'Dia inteiro', t: 'Uma reserva por dia' }, { v: 'horario', r: 'Por horário', t: 'Você define os horários do dia' }].map(({ v, r, t }) => (
                <button key={v} type="button" role="radio" aria-checked={form.tipo === v} className={form.tipo === v ? 'ativo' : ''} onClick={() => setForm({ ...form, tipo: v })} disabled={bloqueado}>
                  {v === 'dia' ? <Sun size={16} /> : <Clock size={16} />} <span><strong>{r}</strong><small>{t}</small></span>
                </button>
              ))}
            </div>
          </div>

          <div className="ed-grupo">
            <span className="ed-rotulo">Dias da semana em que funciona</span>
            <div className="ed-dias">
              {DIAS_SEMANA.map(d => (
                <button key={d.n} type="button" aria-pressed={form.dias.includes(d.n)} className={form.dias.includes(d.n) ? 'ativo' : ''} onClick={() => alternarDia(d.n)} disabled={bloqueado} title={d.longo}>
                  {d.curto}
                </button>
              ))}
            </div>
            <small className="ed-ajuda">Desmarque os dias em que ela fica fechada (ex.: dia de limpeza).</small>
          </div>

          {form.tipo === 'horario' && (
            <div className="ed-grupo">
              <span className="ed-rotulo">Horários que podem ser reservados (iguais em todos os dias)</span>
              {form.horarios.length > 0 && (
                <ul className="ed-lista-horarios">
                  {form.horarios.map(h => (
                    <li key={h.inicio}>
                      <Clock size={14} /> {h.inicio} às {h.fim}
                      <button type="button" className="eb-remover" title="Remover horário" onClick={() => setForm(f => ({ ...f, horarios: f.horarios.filter(x => x.inicio !== h.inicio) }))} disabled={bloqueado}>
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="ed-novo-horario">
                <label className="eb-campo"><span>Início</span>
                  <input type="time" value={form.novoInicio} onChange={(e) => setForm({ ...form, novoInicio: e.target.value })} disabled={bloqueado} />
                </label>
                <label className="eb-campo"><span>Fim</span>
                  <input type="time" value={form.novoFim} onChange={(e) => setForm({ ...form, novoFim: e.target.value })} disabled={bloqueado} />
                </label>
                <button type="button" className="eb-btn eb-btn-sec" onClick={adicionarHorario} disabled={bloqueado}>
                  <Plus size={15} /> Adicionar horário
                </button>
              </div>
            </div>
          )}

          <div className="eb-botoes">
            <button type="button" className="eb-btn eb-btn-sec btn-cancelar" onClick={() => { setAberto(false); setErro(null); setForm(VAZIO); }} disabled={salvando}>
              Cancelar
            </button>
            <button type="button" className="eb-btn eb-btn-pri" onClick={salvar} disabled={bloqueado}>
              {salvando ? <><Loader2 size={15} className="eb-girando" /> Salvando...</> : <><Check size={15} /> Salvar dependência</>}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="eb-adicionar" onClick={() => { setAberto(true); setErro(null); }} disabled={desativado}>
          <Plus size={16} /> Adicionar dependência
        </button>
      )}

      {erro && <p className="eb-erro" role="alert">{erro}</p>}
    </div>
  );
}
