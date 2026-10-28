import React from 'react';

// Bloco → Andar → Apartamento, só escolhendo (nada digitado): o andar libera depois do
// bloco e o apartamento depois do andar; no fim sempre sai um apartamento que existe.
// valor = { bloco: 'Torre Norte', andar: 12, apto: 1 }  →  apartamento "1201".
// Devolve os 3 campos soltos (quem usa decide o layout) e aceita as classes de cada tela:
// classes = { grupo, rotulo, caixa, select }; icones = { bloco, andar, apto } (opcional).
// Valor inicial: VAZIO_UNIDADE (utils/unidades.js).
// Como filtro: obrigatorio={false} e vazios={{ bloco: 'Todos os blocos', ... }} (vazio = todos).

export default function SeletorUnidade({
  blocos, valor, onChange, classes = {}, icones = {}, desativado = false, carregando = false, idBase = 'unidade',
  rotulos = { bloco: 'Bloco', andar: 'Andar', apto: 'Apartamento' },
  vazios = { bloco: 'Selecione o bloco', andar: 'Selecione o andar', apto: 'Selecione' },
  obrigatorio = true,
}) {
  const bloco = blocos.find(b => b.nome === valor.bloco);
  const andares = bloco ? Array.from({ length: bloco.andares }, (_, i) => i + 1) : [];
  const aptos = bloco && valor.andar ? Array.from({ length: bloco.aptos_por_andar }, (_, i) => i + 1) : [];

  const campo = (chave, conteudo) => {
    const Icone = icones[chave];
    const select = (
      <>
        {conteudo}
        {Icone && <Icone className="input-icon" />}
      </>
    );
    return (
      <div className={classes.grupo}>
        <label className={classes.rotulo} htmlFor={`${idBase}-${chave}`}>{rotulos[chave]}</label>
        {classes.caixa ? <div className={classes.caixa}>{select}</div> : select}
      </div>
    );
  };

  return (
    <>
      {campo('bloco', (
        <select
          id={`${idBase}-bloco`}
          className={classes.select}
          value={valor.bloco}
          onChange={(e) => onChange({ bloco: e.target.value, andar: '', apto: '' })}
          disabled={desativado || carregando || blocos.length === 0}
          required={obrigatorio}
        >
          <option value="">{carregando ? 'Carregando blocos…' : !desativado && blocos.length ? vazios.bloco : ''}</option>
          {blocos.map(b => <option key={b.id ?? b.nome} value={b.nome}>{b.nome}</option>)}
        </select>
      ))}
      {campo('andar', (
        <select
          id={`${idBase}-andar`}
          className={classes.select}
          value={valor.andar}
          onChange={(e) => onChange({ ...valor, andar: Number(e.target.value) || '', apto: '' })}
          disabled={desativado || !bloco}
          required={obrigatorio}
        >
          <option value="">{bloco ? vazios.andar : ''}</option>
          {andares.map(a => <option key={a} value={a}>{a}º andar</option>)}
        </select>
      ))}
      {campo('apto', (
        <select
          id={`${idBase}-apto`}
          className={classes.select}
          value={valor.apto}
          onChange={(e) => onChange({ ...valor, apto: Number(e.target.value) || '' })}
          disabled={desativado || !valor.andar}
          required={obrigatorio}
        >
          <option value="">{valor.andar ? vazios.apto : ''}</option>
          {aptos.map(p => <option key={p} value={p}>{String(p).padStart(2, '0')}</option>)}
        </select>
      ))}
    </>
  );
}
