import React, { useState } from 'react';
import { Plus, Building, X, Loader2, Check } from 'lucide-react';
import { letrasENumeros } from '../utils/mascaras';
import { apartamentoDe, resumoBloco } from '../utils/unidades';
import './EditorBlocos.css';

// Editor de blocos do condomínio (cadastro do condomínio e aba "Blocos" do master).
// Cada bloco: nome (letra ou nome da torre), nº de andares e apartamentos por andar.
// Numeração: andar + 2 dígitos (1201 = 12º andar, apto 01).
//  - onSalvar(bloco) e onRemover(bloco) podem devolver uma mensagem de erro (ou null);
//  - removivel(bloco) diz se o "x" aparece (ex.: só blocos sem moradores);
//  - detalhe(bloco) mostra um texto extra na linha (ex.: "3 moradores").

const VAZIO = { nome: '', andares: '', aptos: '' };

export default function EditorBlocos({ blocos, onSalvar, onRemover, removivel = () => true, detalhe, desativado = false }) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState(null);

  const andares = Number(form.andares);
  const aptos = Number(form.aptos);
  const numerosOk = andares >= 1 && andares <= 99 && aptos >= 1 && aptos <= 99;

  const salvar = async () => {
    const nome = form.nome.trim().replace(/\s+/g, ' ');
    const problema =
      !nome ? 'Informe o nome do bloco (uma letra ou o nome da torre).' :
      blocos.some(b => b.nome.toLowerCase() === nome.toLowerCase()) ? 'Já existe um bloco com esse nome.' :
      !(andares >= 1 && andares <= 99) ? 'A quantidade de andares vai de 1 a 99.' :
      !(aptos >= 1 && aptos <= 99) ? 'Os apartamentos por andar vão de 1 a 99.' :
      null;
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    setSalvando(true);
    const falha = await onSalvar({ nome, andares, aptos_por_andar: aptos });
    setSalvando(false);
    if (falha) {
      setErro(falha);
      return;
    }
    setForm(VAZIO);
    setAberto(false);
  };

  // Enter dentro do painel salva o bloco (e não envia o formulário em volta)
  const enterSalva = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      salvar();
    }
  };

  const remover = async (b) => {
    setErro(null);
    setRemovendo(b.nome);
    const falha = await onRemover(b);
    setRemovendo(null);
    if (falha) setErro(falha);
  };

  return (
    <div className="eb">
      {blocos.length > 0 && (
        <ul className="eb-lista">
          {blocos.map(b => (
            <li key={b.nome} className="eb-bloco">
              <span className="eb-bloco-icone"><Building size={16} /></span>
              <span className="eb-bloco-texto">
                <strong>{b.nome}</strong>
                <small>{resumoBloco(b)}{detalhe ? ` · ${detalhe(b)}` : ''}</small>
              </span>
              {onRemover && removivel(b) && (
                <button type="button" className="eb-remover" title={`Remover ${b.nome}`} onClick={() => remover(b)} disabled={desativado || removendo === b.nome}>
                  {removendo === b.nome ? <Loader2 size={15} className="eb-girando" /> : <X size={15} />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {aberto ? (
        <div className="eb-painel">
          <div className="eb-campos">
            <label className="eb-campo eb-campo-nome">
              <span>Nome do bloco</span>
              <input
                type="text"
                value={form.nome}
                maxLength={40}
                placeholder="Ex.: A ou Torre Norte"
                onChange={(e) => setForm({ ...form, nome: e.nativeEvent?.isComposing ? e.target.value : letrasENumeros(e.target.value) })}
                onCompositionEnd={(e) => setForm({ ...form, nome: letrasENumeros(e.target.value) })}
                disabled={desativado || salvando}
                onKeyDown={enterSalva}
              />
            </label>
            <label className="eb-campo">
              <span>Andares</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={form.andares}
                placeholder="Ex.: 20"
                onChange={(e) => setForm({ ...form, andares: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                disabled={desativado || salvando}
                onKeyDown={enterSalva}
              />
            </label>
            <label className="eb-campo">
              <span>Apartamentos por andar</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={form.aptos}
                placeholder="Ex.: 4"
                onChange={(e) => setForm({ ...form, aptos: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                disabled={desativado || salvando}
                onKeyDown={enterSalva}
              />
            </label>
          </div>

          <p className="eb-previa">
            {numerosOk
              ? <>Apartamentos de <strong>{apartamentoDe(1, 1)}</strong> a <strong>{apartamentoDe(andares, aptos)}</strong> ({andares * aptos} no total). Ex.: o {apartamentoDe(Math.min(andares, 12), 1)} é o {Math.min(andares, 12)}º andar, apartamento 01.</>
              : 'A numeração segue andar + 2 dígitos: o 1201 é o 12º andar, apartamento 01.'}
          </p>

          <div className="eb-botoes">
            <button type="button" className="eb-btn eb-btn-sec" onClick={() => { setAberto(false); setErro(null); setForm(VAZIO); }} disabled={salvando}>
              Cancelar
            </button>
            <button type="button" className="eb-btn eb-btn-pri" onClick={salvar} disabled={desativado || salvando}>
              {salvando ? <><Loader2 size={15} className="eb-girando" /> Salvando...</> : <><Check size={15} /> Salvar bloco</>}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="eb-adicionar" onClick={() => { setAberto(true); setErro(null); }} disabled={desativado}>
          <Plus size={16} /> Adicionar bloco
        </button>
      )}

      {erro && <p className="eb-erro" role="alert">{erro}</p>}
    </div>
  );
}
