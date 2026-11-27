"use client";

import { useActionState, useState } from "react";
import { acaoCriarOrdem, type Resultado } from "@/app/actions";
import { PRIORIDADES, TIPOS, siglaDoTipo } from "@/lib/constantes";

type Opcao = { id: number; nome: string };

export default function FormNovaOrdem({ campos, bancadas }: { campos: Opcao[] | null; bancadas: Opcao[] }) {
  const [estado, acao, enviando] = useActionState<Resultado, FormData>(acaoCriarOrdem, {});

  const v = (k: string) => estado.valores?.[k];
  const [tipo, setTipo] = useState(v("tipo") ?? "");
  const ano = new Date().getFullYear();
  // checkbox: depois de um erro mantém o que foi marcado; senão usa o padrão
  const chk = (k: string, padrao: boolean) => (estado.valores ? estado.valores[k] === "on" : padrao);

  return (
    <form action={acao} key={estado.erro ? JSON.stringify(estado.valores) : "novo"} className="card" autoComplete="off">
      <div className="sec">
        <h2>Atendimento</h2>
        <div className="fg">
          <div className="f">
            <label>Nº do chamado</label>
            <div className="chamado-auto" title="Gerado automaticamente ao registrar a entrada">
              {tipo ? <>{siglaDoTipo(tipo)}-{ano}-<span>····</span></> : <span>escolha o tipo do equipamento</span>}
              <small>automático</small>
            </div>
          </div>
          <div className="f"><label>Empresa parceira</label><input name="empresaParceira" defaultValue={v("empresaParceira")} placeholder="Se o atendimento veio de um parceiro" /></div>
          <div className="f"><label>Horário de início</label><input name="horaInicio" type="time" defaultValue={v("horaInicio")} /></div>
          <div className="f"><label>Horário de fim</label><input name="horaFim" type="time" defaultValue={v("horaFim")} /></div>
          <div className="f full">
            <label>Tipo de serviço</label>
            <div className="checks">
              <label><input type="checkbox" name="servicoLab" defaultChecked={chk("servicoLab", true)} /> Retirado para laboratório</label>
              <label><input type="checkbox" name="servicoReparo" defaultChecked={chk("servicoReparo", true)} /> Substituição ou reparo</label>
              <label><input type="checkbox" name="servicoUpgrade" defaultChecked={chk("servicoUpgrade", false)} /> Upgrade (SSD, memória)</label>
            </div>
          </div>
        </div>
      </div>

      <div className="sec">
        <h2>Cliente</h2>
        <div className="fg">
          <div className="f"><label className="req">Nome / Empresa</label><input name="clienteNome" defaultValue={v("clienteNome")} required /></div>
          <div className="f"><label className="req">Telefone / WhatsApp</label><input name="clienteTel" defaultValue={v("clienteTel")} required /></div>
          <div className="f"><label>E-mail</label><input name="clienteEmail" defaultValue={v("clienteEmail")} type="email" /></div>
          <div className="f"><label>CPF / CNPJ</label><input name="clienteDoc" defaultValue={v("clienteDoc")} /></div>
          <div className="f"><label>Nome do responsável</label><input name="clienteResponsavel" defaultValue={v("clienteResponsavel")} /></div>
          <div className="f"><label>Cargo do responsável</label><input name="clienteCargo" defaultValue={v("clienteCargo")} /></div>
          <div className="f full"><label>Endereço / local da visita técnica</label><input name="endereco" defaultValue={v("endereco")} placeholder="Rua, número, bairro, cidade" /></div>
        </div>
      </div>

      <div className="sec">
        <h2>Equipamento</h2>
        <div className="fg">
          <div className="f">
            <label className="req">Tipo</label>
            <select name="tipo" required defaultValue={v("tipo") ?? ""} onChange={(e) => setTipo(e.target.value)}>
              <option value="" disabled>Selecione…</option>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="f"><label className="req">Marca</label><input name="marca" defaultValue={v("marca")} required /></div>
          <div className="f"><label>Modelo</label><input name="modelo" defaultValue={v("modelo")} /></div>
          <div className="f"><label>Nº de série</label><input name="serie" defaultValue={v("serie")} /></div>
          <div className="f"><label>Nº de patrimônio</label><input name="patrimonio" defaultValue={v("patrimonio")} /></div>
          <div className="f"><label>Nº etiqueta e série do cliente</label><input name="etiquetaCliente" defaultValue={v("etiquetaCliente")} /></div>
          <div className="f full"><label>Acessórios entregues</label><input name="acessorios" defaultValue={v("acessorios")} placeholder="Ex.: carregador, cabo de força, mouse, cartucho…" /></div>
          <div className="f full"><label>Estado físico na entrada</label><input name="estado" defaultValue={v("estado")} placeholder="Ex.: riscos na tampa, tela sem trincas…" /></div>
          <div className="f">
            <label>Backup</label>
            <div className="checks"><label><input type="checkbox" name="backupFeito" defaultChecked={chk("backupFeito", false)} /> Backup realizado</label></div>
          </div>
          <div className="f"><label>Nome do perfil de usuário</label><input name="backupPerfil" defaultValue={v("backupPerfil")} /></div>
          <div className="f full"><label className="req">Defeito relatado pelo cliente</label><textarea name="defeito" defaultValue={v("defeito")} required /></div>
        </div>
      </div>

      <div className="sec">
        <h2>Atendimento e equipe</h2>
        <div className="fg">
          <div className="f">
            <label>Prioridade</label>
            <select name="prioridade" defaultValue={v("prioridade") ?? "normal"}>
              {PRIORIDADES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          {campos && (
            <div className="f">
              <label>Técnico de campo</label>
              <select name="campoId" defaultValue={v("campoId") ?? ""}>
                <option value="">— ninguém —</option>
                {campos.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
          )}
          <div className="f">
            <label>Técnico de bancada</label>
            <select name="bancadaId" defaultValue={v("bancadaId") ?? ""}>
              <option value="">— deixar para a bancada assumir —</option>
              {bancadas.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
          <div className="f"><label>Previsão de entrega</label><input name="previsao" defaultValue={v("previsao")} type="date" /></div>
          <div className="f"><label>Senha / Observações de acesso</label><input name="obs" defaultValue={v("obs")} placeholder="Opcional" /></div>
          <div className="f full">
            <label>Recado para a bancada (opcional)</label>
            <textarea name="recado" defaultValue={v("recado")} placeholder="Ex.: Cliente disse que o problema começou depois de uma queda de energia. Tem urgência." />
          </div>
        </div>
      </div>

      {estado.erro && <div className="msg erro">{estado.erro}</div>}

      <div className="actions" style={{ marginTop: 12 }}>
        <button type="reset" className="btn ghost">Limpar</button>
        <button type="submit" className="btn" disabled={enviando}>
          {enviando ? "Registrando…" : "Registrar entrada"}
        </button>
      </div>
    </form>
  );
}
