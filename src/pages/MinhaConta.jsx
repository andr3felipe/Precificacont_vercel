import React, { useEffect, useRef, useState } from "react";
import { UserRound, Mail, LockKeyhole, Save, ShieldCheck, BriefcaseBusiness, Loader2, CheckCircle2, AlertTriangle, Camera, Trash2, ZoomIn, ZoomOut, X, Move } from "lucide-react";
import { supabase } from "../supabase";

const PERFIS = { admin: "Administrador", gestor: "Gestor", comercial: "Comercial", usuario: "Usuário" };


const MINHA_CONTA_THEME_CSS = `
  .precificacont-minha-conta {
    background-color: #f8fafc !important;
    color: #0f172a;
  }

  [data-theme="dark"] .precificacont-minha-conta {
    background:
      radial-gradient(circle at 88% 0%, rgba(37,99,235,.11), transparent 28rem),
      #07101f !important;
    color: #e5edf8;
  }

  [data-theme="dark"] .precificacont-minha-conta .bg-white {
    background-color: #0c1a2f !important;
  }

  [data-theme="dark"] .precificacont-minha-conta .bg-slate-50 {
    background-color: #10213a !important;
  }

  [data-theme="dark"] .precificacont-minha-conta .border-slate-200,
  [data-theme="dark"] .precificacont-minha-conta .border-slate-700 {
    border-color: rgba(96,165,250,.18) !important;
  }

  [data-theme="dark"] .precificacont-minha-conta .text-slate-900,
  [data-theme="dark"] .precificacont-minha-conta .text-slate-700 {
    color: #f8fafc !important;
  }

  [data-theme="dark"] .precificacont-minha-conta .text-slate-500 {
    color: #9fb0c7 !important;
  }

  [data-theme="dark"] .precificacont-minha-conta input {
    background-color: #09172a !important;
    border-color: rgba(96,165,250,.22) !important;
    color: #f8fafc !important;
    color-scheme: dark;
  }

  [data-theme="dark"] .precificacont-minha-conta input::placeholder {
    color: #64748b !important;
  }
`;

export default function MinhaConta() {
  const [carregando, setCarregando] = useState(true);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [userId, setUserId] = useState("");
  const [vinculoId, setVinculoId] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [emailOriginal, setEmailOriginal] = useState("");
  const [cargo, setCargo] = useState("");
  const [perfil, setPerfil] = useState("usuario");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [editorFotoAberto, setEditorFotoAberto] = useState(false);
  const [fotoOriginalUrl, setFotoOriginalUrl] = useState("");
  const [arquivoFoto, setArquivoFoto] = useState(null);
  const [zoomFoto, setZoomFoto] = useState(1);
  const [posicaoFoto, setPosicaoFoto] = useState({ x: 0, y: 0 });
  const arrasteFotoRef = useRef(null);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("Usuário autenticado não encontrado.");

        const { data: vinculo, error: vinculoError } = await supabase
          .from("usuarios_escritorios")
          .select("id,nome,cargo,perfil,ativo")
          .eq("user_id", user.id).eq("ativo", true).limit(1).maybeSingle();
        if (vinculoError) throw vinculoError;
        if (!ativo) return;

        setUserId(user.id);
        setVinculoId(vinculo?.id || "");
        setNome(vinculo?.nome || user.user_metadata?.nome || user.email?.split("@")[0] || "");
        setEmail(user.email || "");
        setEmailOriginal(user.email || "");
        setCargo(vinculo?.cargo || "");
        setPerfil(vinculo?.perfil || "usuario");
        setFotoUrl(user.user_metadata?.avatar_url || "");
      } catch (e) {
        if (ativo) setErro(e?.message || "Não foi possível carregar sua conta.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, []);

  async function salvarDados() {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro("Informe seu nome.");
      return;
    }
    setSalvandoDados(true); setErro(""); setMensagem("");
    try {
      if (vinculoId) {
        const { error } = await supabase.from("usuarios_escritorios")
          .update({ nome: nomeLimpo, updated_at: new Date().toISOString() })
          .eq("id", vinculoId).eq("user_id", userId);
        if (error) throw error;
      }

      const alteracoes = { data: { nome: nomeLimpo } };
      if (emailLimpo !== emailOriginal.toLowerCase()) alteracoes.email = emailLimpo;
      const { data, error } = await supabase.auth.updateUser(alteracoes);
      if (error) throw error;

      if (emailLimpo !== emailOriginal.toLowerCase()) {
        setMensagem("Dados salvos. A alteração do e-mail pode exigir confirmação no novo endereço.");
        setEmail(data?.user?.email || emailLimpo);
      } else {
        setMensagem("Seus dados foram atualizados com sucesso.");
      }

      window.dispatchEvent(new Event("precificacont-perfil-atualizado"));
    } catch (e) {
      setErro(e?.message || "Não foi possível atualizar seus dados.");
    } finally { setSalvandoDados(false); }
  }

  function fecharEditorFoto() {
    if (fotoOriginalUrl) URL.revokeObjectURL(fotoOriginalUrl);
    setEditorFotoAberto(false);
    setFotoOriginalUrl("");
    setArquivoFoto(null);
    setZoomFoto(1);
    setPosicaoFoto({ x: 0, y: 0 });
    arrasteFotoRef.current = null;
  }

  function alterarFoto(event) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";

    if (!arquivo || !userId) return;

    if (!arquivo.type.startsWith("image/")) {
      setErro("Selecione uma imagem válida.");
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      setErro("A foto deve ter no máximo 5 MB.");
      return;
    }

    setErro("");
    setMensagem("");
    if (fotoOriginalUrl) URL.revokeObjectURL(fotoOriginalUrl);
    setArquivoFoto(arquivo);
    setFotoOriginalUrl(URL.createObjectURL(arquivo));
    setZoomFoto(1);
    setPosicaoFoto({ x: 0, y: 0 });
    setEditorFotoAberto(true);
  }

  function iniciarArrasteFoto(event) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    arrasteFotoRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      origemX: posicaoFoto.x,
      origemY: posicaoFoto.y,
    };
  }

  function moverFoto(event) {
    const inicio = arrasteFotoRef.current;
    if (!inicio || inicio.pointerId !== event.pointerId) return;
    setPosicaoFoto({
      x: inicio.origemX + (event.clientX - inicio.x),
      y: inicio.origemY + (event.clientY - inicio.y),
    });
  }

  function finalizarArrasteFoto(event) {
    if (arrasteFotoRef.current?.pointerId === event.pointerId) {
      arrasteFotoRef.current = null;
    }
  }

  async function gerarFotoRecortada() {
    if (!arquivoFoto || !fotoOriginalUrl) throw new Error("Selecione uma foto.");

    const imagem = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível processar a imagem."));
      img.src = fotoOriginalUrl;
    });

    const viewport = 360;
    const saida = 720;
    const escalaBase = Math.max(viewport / imagem.naturalWidth, viewport / imagem.naturalHeight);
    const escalaFinal = escalaBase * zoomFoto;
    const tamanhoFonte = viewport / escalaFinal;
    let origemX = (imagem.naturalWidth - tamanhoFonte) / 2 - posicaoFoto.x / escalaFinal;
    let origemY = (imagem.naturalHeight - tamanhoFonte) / 2 - posicaoFoto.y / escalaFinal;

    origemX = Math.max(0, Math.min(origemX, imagem.naturalWidth - tamanhoFonte));
    origemY = Math.max(0, Math.min(origemY, imagem.naturalHeight - tamanhoFonte));

    const canvas = document.createElement("canvas");
    canvas.width = saida;
    canvas.height = saida;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imagem, origemX, origemY, tamanhoFonte, tamanhoFonte, 0, 0, saida, saida);

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Não foi possível gerar a foto.")),
        "image/jpeg",
        0.9
      );
    });
  }

  async function salvarFotoAjustada() {
    if (!arquivoFoto || !userId) return;

    setEnviandoFoto(true);
    setErro("");
    setMensagem("");

    try {
      const blob = await gerarFotoRecortada();
      const caminho = `${userId}/avatar-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(caminho, blob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(caminho);

      const novaFotoUrl = publicData?.publicUrl || "";
      if (!novaFotoUrl) throw new Error("Não foi possível obter a URL da foto.");

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { avatar_url: novaFotoUrl },
      });

      if (metadataError) throw metadataError;

      setFotoUrl(novaFotoUrl);
      setMensagem("Foto atualizada com sucesso.");
      window.dispatchEvent(new Event("precificacont-perfil-atualizado"));
      fecharEditorFoto();
    } catch (e) {
      setErro(e?.message || "Não foi possível atualizar sua foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function removerFoto() {
    if (!fotoUrl) return;

    setEnviandoFoto(true);
    setErro("");
    setMensagem("");

    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null },
      });

      if (error) throw error;

      setFotoUrl("");
      setMensagem("Foto removida com sucesso.");
      window.dispatchEvent(new Event("precificacont-perfil-atualizado"));
    } catch (e) {
      setErro(e?.message || "Não foi possível remover sua foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function alterarSenha() {
    setErro(""); setMensagem("");
    if (novaSenha.length < 8) { setErro("A nova senha deve ter pelo menos 8 caracteres."); return; }
    if (novaSenha !== confirmarSenha) { setErro("A confirmação da senha não confere."); return; }
    setSalvandoSenha(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setNovaSenha(""); setConfirmarSenha("");
      setMensagem("Senha alterada com sucesso.");
    } catch (e) {
      setErro(e?.message || "Não foi possível alterar sua senha.");
    } finally { setSalvandoSenha(false); }
  }

  if (carregando) return (
    <div className="precificacont-minha-conta min-h-screen bg-slate-50 p-8">
      <style>{MINHA_CONTA_THEME_CSS}</style>
      <div className="mx-auto flex max-w-5xl justify-center py-24"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
    </div>
  );

  const campo = "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

  return (
    <div className="precificacont-minha-conta min-h-screen bg-slate-50 p-8 text-slate-900">
      <style>{MINHA_CONTA_THEME_CSS}</style>
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600"><UserRound size={17}/> CONTA DO USUÁRIO</div>
          <h1 className="text-3xl font-bold">Minha conta</h1>
          <p className="mt-2 text-slate-500">Gerencie seus dados pessoais e sua senha de acesso.</p>
        </div>

        {erro && <div className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle size={19}/>{erro}</div>}
        {mensagem && <div className="mb-5 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 size={19}/>{mensagem}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Dados da conta</h2>

            <div className="mt-6 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-2xl font-bold text-blue-600">
                {fotoUrl ? (
                  <img src={fotoUrl} alt={nome || "Foto do usuário"} className="h-full w-full object-cover" />
                ) : (
                  (nome.trim().charAt(0).toUpperCase() || "U")
                )}
              </div>

              <div>
                <div className="text-sm font-bold">Foto do perfil</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  JPG, PNG ou WEBP. Tamanho máximo de 5 MB.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 ${enviandoFoto ? "pointer-events-none opacity-60" : ""}`}>
                    {enviandoFoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    {enviandoFoto ? "Enviando..." : "Alterar foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={alterarFoto}
                      disabled={enviandoFoto}
                    />
                  </label>

                  {fotoUrl && (
                    <button
                      type="button"
                      onClick={removerFoto}
                      disabled={enviandoFoto}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      <Trash2 size={16} />
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div><label className="mb-2 block text-sm font-semibold">Nome</label><input className={campo} value={nome} onChange={e=>setNome(e.target.value)}/></div>
              <div>
                <label className="mb-2 block text-sm font-semibold">E-mail</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input type="email" className={`${campo} cursor-not-allowed bg-slate-50 pl-11 text-slate-500`} value={email} readOnly disabled />
                </div>
                <p className="mt-2 text-xs text-slate-500">O e-mail da conta não é alterado por esta tela.</p>
              </div>
              <button onClick={salvarDados} disabled={salvandoDados} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{salvandoDados?<Loader2 size={17} className="animate-spin"/>:<Save size={17}/>} {salvandoDados?"Salvando...":"Salvar meus dados"}</button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Acesso ao escritório</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500"><ShieldCheck size={15}/> Perfil</div><p className="mt-2 font-bold">{PERFIS[perfil] || "Usuário"}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500"><BriefcaseBusiness size={15}/> Cargo</div><p className="mt-2 font-bold">{cargo || "Não informado"}</p></div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Perfil e cargo são definidos pelo administrador.</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><LockKeyhole size={20}/></div><div><h2 className="font-bold">Alterar senha</h2><p className="mt-1 text-sm text-slate-500">Defina uma nova senha para sua conta.</p></div></div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div><label className="mb-2 block text-sm font-semibold">Nova senha</label><input type="password" className={campo} value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} placeholder="Mínimo de 8 caracteres"/></div>
            <div><label className="mb-2 block text-sm font-semibold">Confirmar nova senha</label><input type="password" className={campo} value={confirmarSenha} onChange={e=>setConfirmarSenha(e.target.value)} placeholder="Repita a nova senha"/></div>
          </div>
          <button onClick={alterarSenha} disabled={salvandoSenha} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold hover:bg-slate-50">{salvandoSenha?<Loader2 size={17} className="animate-spin"/>:<LockKeyhole size={17}/>} {salvandoSenha?"Alterando...":"Alterar minha senha"}</button>
        </div>

        {editorFotoAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold">Ajustar foto do perfil</h2>
                  <p className="mt-1 text-sm text-slate-500">Arraste para posicionar e use o zoom para enquadrar.</p>
                </div>
                <button type="button" onClick={fecharEditorFoto} disabled={enviandoFoto} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="mx-auto flex max-w-[400px] justify-center rounded-2xl bg-slate-950 p-5">
                  <div
                    className="relative h-[360px] w-[360px] max-w-full cursor-grab touch-none overflow-hidden rounded-full border-4 border-white/90 bg-slate-900 active:cursor-grabbing"
                    onPointerDown={iniciarArrasteFoto}
                    onPointerMove={moverFoto}
                    onPointerUp={finalizarArrasteFoto}
                    onPointerCancel={finalizarArrasteFoto}
                  >
                    {fotoOriginalUrl && (
                      <img
                        src={fotoOriginalUrl}
                        alt="Prévia da foto"
                        draggable="false"
                        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                        style={{
                          transform: `translate(${posicaoFoto.x}px, ${posicaoFoto.y}px) scale(${zoomFoto})`,
                          transformOrigin: "center center",
                        }}
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <Move size={28} className="text-white/70 drop-shadow" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <ZoomOut size={20} className="shrink-0 text-slate-500" />
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoomFoto}
                    onChange={(e) => setZoomFoto(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer accent-blue-600"
                  />
                  <ZoomIn size={20} className="shrink-0 text-slate-500" />
                </div>
                <div className="mt-2 text-center text-xs font-medium text-slate-500">Zoom {Math.round(zoomFoto * 100)}%</div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={fecharEditorFoto} disabled={enviandoFoto} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Cancelar
                  </button>
                  <button type="button" onClick={salvarFotoAjustada} disabled={enviandoFoto} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                    {enviandoFoto ? <Loader2 size={17} className="animate-spin" /> : <Camera size={17} />}
                    {enviandoFoto ? "Salvando..." : "Salvar foto"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
