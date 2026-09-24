import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import {
  LayoutDashboard,
  Calculator,
  History,
  Users,
  RefreshCcw,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  FileText,
  BriefcaseBusiness,
} from "lucide-react";

const MENU = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    enabled: true,
    tone: "blue",
  },

  {
    type: "section",
    label: "PRECIFICAÇÃO",
  },

  {
    id: "nova",
    label: "Nova Simulação",
    icon: Calculator,
    enabled: true,
    tone: "cyan",
  },

  {
    id: "simulacoes",
    label: "Simulações",
    icon: History,
    enabled: true,
    tone: "blue",
  },

  {
    id: "reprecificacao",
    label: "Reprecificação",
    icon: RefreshCcw,
    enabled: true,
    tone: "emerald",
  },

  {
    type: "section",
    label: "GESTÃO",
  },

  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
    enabled: true,
    tone: "violet",
  },

  {
    id: "servicos",
    label: "Serviços Adicionais",
    icon: PackagePlus,
    enabled: true,
    tone: "amber",
  },

  {
    id: "relatorios",
    label: "Relatórios",
    icon: BarChart3,
    enabled: true,
    tone: "sky",
  },

  {
    type: "section",
    label: "PROPOSTAS",
  },

  {
    id: "propostas",
    label: "Propostas",
    icon: FileText,
    enabled: true,
    tone: "indigo",
  },

  {
    type: "section",
    label: "CRM COMERCIAL",
  },

  {
    id: "crm",
    label: "CRM Comercial",
    icon: BriefcaseBusiness,
    enabled: true,
    tone: "teal",
  },
];

const TONES = {
  blue: {
    normal:
      "bg-blue-500/10 text-blue-300 border-blue-400/10 group-hover:bg-blue-500/15 group-hover:text-blue-200",
    active:
      "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-300/20 shadow-[0_8px_22px_rgba(37,99,235,0.32)]",
  },

  cyan: {
    normal:
      "bg-cyan-500/10 text-cyan-300 border-cyan-400/10 group-hover:bg-cyan-500/15 group-hover:text-cyan-200",
    active:
      "bg-gradient-to-br from-cyan-400 to-blue-600 text-white border-cyan-300/20 shadow-[0_8px_22px_rgba(6,182,212,0.28)]",
  },

  emerald: {
    normal:
      "bg-emerald-500/10 text-emerald-300 border-emerald-400/10 group-hover:bg-emerald-500/15 group-hover:text-emerald-200",
    active:
      "bg-gradient-to-br from-emerald-400 to-teal-600 text-white border-emerald-300/20 shadow-[0_8px_22px_rgba(16,185,129,0.28)]",
  },

  violet: {
    normal:
      "bg-violet-500/10 text-violet-300 border-violet-400/10 group-hover:bg-violet-500/15 group-hover:text-violet-200",
    active:
      "bg-gradient-to-br from-violet-400 to-violet-600 text-white border-violet-300/20 shadow-[0_8px_22px_rgba(139,92,246,0.28)]",
  },

  amber: {
    normal:
      "bg-amber-500/10 text-amber-300 border-amber-400/10 group-hover:bg-amber-500/15 group-hover:text-amber-200",
    active:
      "bg-gradient-to-br from-amber-400 to-orange-500 text-white border-amber-300/20 shadow-[0_8px_22px_rgba(245,158,11,0.25)]",
  },

  sky: {
    normal:
      "bg-sky-500/10 text-sky-300 border-sky-400/10 group-hover:bg-sky-500/15 group-hover:text-sky-200",
    active:
      "bg-gradient-to-br from-sky-400 to-blue-600 text-white border-sky-300/20 shadow-[0_8px_22px_rgba(14,165,233,0.28)]",
  },

  indigo: {
    normal:
      "bg-indigo-500/10 text-indigo-300 border-indigo-400/10 group-hover:bg-indigo-500/15 group-hover:text-indigo-200",
    active:
      "bg-gradient-to-br from-indigo-400 to-blue-600 text-white border-indigo-300/20 shadow-[0_8px_22px_rgba(99,102,241,0.28)]",
  },

  teal: {
    normal:
      "bg-teal-500/10 text-teal-300 border-teal-400/10 group-hover:bg-teal-500/15 group-hover:text-teal-200",
    active:
      "bg-gradient-to-br from-teal-400 to-cyan-600 text-white border-teal-300/20 shadow-[0_8px_22px_rgba(20,184,166,0.28)]",
  },
};

export default function Sidebar({
  pagina,
  setPagina,
  collapsed,
  setCollapsed,
  modulosPermitidos = null,
  carregandoModulos = false,
}) {
  const CACHE_USUARIO_KEY = "precificacont_usuario_sidebar";

  function lerUsuarioCache(userId = "") {
    try {
      const salvo = localStorage.getItem(CACHE_USUARIO_KEY);
      if (!salvo) return null;

      const parsed = JSON.parse(salvo);
      if (!parsed || typeof parsed !== "object") return null;

      // Nunca reutiliza nome/perfil de outra sessão.
      if (!userId || parsed.userId !== userId) return null;

      return {
        nome: parsed.nome || "Usuário",
        perfil: parsed.perfil || "usuario",
        fotoUrl: parsed.fotoUrl || "",
        userId: parsed.userId,
      };
    } catch {
      return null;
    }
  }

  const [usuarioAtual, setUsuarioAtual] = useState({
    nome: "Usuário",
    perfil: "usuario",
    fotoUrl: "",
    userId: "",
  });

  useEffect(() => {
    let ativo = true;

    async function carregarUsuarioAtual() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;
        if (!user || !ativo) return;

        const cacheDaSessao = lerUsuarioCache(user.id);
        if (cacheDaSessao && ativo) {
          setUsuarioAtual(cacheDaSessao);
        } else if (ativo) {
          setUsuarioAtual({
            nome:
              user.user_metadata?.nome?.trim() ||
              user.email?.split("@")[0] ||
              "Usuário",
            perfil: "usuario",
            fotoUrl: user.user_metadata?.avatar_url || "",
            userId: user.id,
          });
        }

        const { data: vinculo } = await supabase
          .from("usuarios_escritorios")
          .select("nome, perfil")
          .eq("user_id", user.id)
          .eq("ativo", true)
          .limit(1)
          .maybeSingle();

        if (!ativo) return;

        const proximoUsuario = {
          nome:
            vinculo?.nome?.trim() ||
            user.user_metadata?.nome?.trim() ||
            user.email?.split("@")[0] ||
            "Usuário",
          perfil: vinculo?.perfil || "usuario",
          fotoUrl: user.user_metadata?.avatar_url || "",
          userId: user.id,
        };

        setUsuarioAtual(proximoUsuario);

        try {
          localStorage.setItem(
            CACHE_USUARIO_KEY,
            JSON.stringify(proximoUsuario)
          );
        } catch {
          // Cache é apenas uma otimização visual.
        }
      } catch (error) {
        console.error("Erro ao carregar usuário da sidebar:", error);
      }
    }

    carregarUsuarioAtual();

    function atualizarPerfilSidebar() {
      carregarUsuarioAtual();
    }

    window.addEventListener(
      "precificacont-perfil-atualizado",
      atualizarPerfilSidebar
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        try {
          localStorage.removeItem(CACHE_USUARIO_KEY);
        } catch {
          // Sem ação necessária.
        }

        setUsuarioAtual({
          nome: "Usuário",
          perfil: "usuario",
          fotoUrl: "",
          userId: "",
        });
        return;
      }

      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Limpa qualquer identidade visual anterior antes de carregar a sessão atual.
        try {
          localStorage.removeItem(CACHE_USUARIO_KEY);
        } catch {
          // Sem ação necessária.
        }
        carregarUsuarioAtual();
      }
    });

    return () => {
      ativo = false;
      subscription?.unsubscribe();
      window.removeEventListener(
        "precificacont-perfil-atualizado",
        atualizarPerfilSidebar
      );
    };
  }, []);

  const nomeUsuario = usuarioAtual.nome;
  const fotoUsuario = usuarioAtual.fotoUrl;
  const inicialUsuario = nomeUsuario.trim().charAt(0).toUpperCase() || "U";

  const perfilUsuario =
    {
      admin: "Administrador",
      gestor: "Gestor",
      comercial: "Comercial",
      usuario: "Usuário",
    }[usuarioAtual.perfil] || "Usuário";


  const MODULO_POR_MENU = {
    nova: "nova_simulacao",
    simulacoes: "historico_simulacoes",
    reprecificacao: "reprecificacao",
    clientes: "clientes",
    servicos: "servicos_adicionais",
    relatorios: "relatorios",
    propostas: "propostas",
    crm: "crm",
  };

  const temModulo = (idMenu) => {
    const codigoModulo = MODULO_POR_MENU[idMenu];

    if (!codigoModulo) return true;
    if (modulosPermitidos === null) return true;

    return modulosPermitidos.includes(codigoModulo);
  };

  const itemLiberado = (item) => {
    if (!item || item.type === "section") return false;

    // O acesso aos módulos é definido pela matriz de permissões do perfil.
    // Não existe mais uma segunda lista fixa por tipo de usuário.
    return item.id === "dashboard" || temModulo(item.id);
  };

  const menuVisivel = MENU.filter((item, index, lista) => {
    if (item.type !== "section") {
      return itemLiberado(item);
    }

    const inicioSecao = index + 1;
    let fimSecao = lista.length;

    for (let i = inicioSecao; i < lista.length; i += 1) {
      if (lista[i].type === "section") {
        fimSecao = i;
        break;
      }
    }

    return lista
      .slice(inicioSecao, fimSecao)
      .some((proximo) => itemLiberado(proximo));
  });

  const menuFinal = carregandoModulos
    ? menuVisivel.filter((item) => item.type === "section" || item.id === "dashboard")
    : menuVisivel;

  const podeVerConfiguracoes =
    usuarioAtual.perfil === "admin" || usuarioAtual.perfil === "gestor";

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col overflow-visible border-r border-white/[0.07] bg-[#050B1D] text-white shadow-[18px_0_60px_rgba(2,6,23,0.08)] transition-all duration-300 ${
        collapsed ? "w-[82px]" : "w-[260px]"
      }`}
    >
      {/* DETALHES DE FUNDO */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-blue-600/[0.08] blur-3xl" />
        <div className="absolute -right-24 top-[38%] h-48 w-48 rounded-full bg-cyan-400/[0.04] blur-3xl" />
      </div>

      {/* MARCA */}
      <div
        className={`relative flex h-[86px] shrink-0 items-center border-b border-white/[0.07] ${
          collapsed ? "justify-center px-3" : "px-4"
        }`}
      >
        {/* SÍMBOLO OFICIAL PRECIFICACONT */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          <img
            src="/precificacont-simbolo.png"
            alt="PrecificaCont"
            className="h-10 w-10 object-contain transition-all duration-300"
          />
        </div>

        {/* NOME DA MARCA */}
        {!collapsed && (
          <div className="ml-3 min-w-0 overflow-hidden">
            <div className="whitespace-nowrap text-[17px] font-bold tracking-[-0.035em] text-white">
              Precifica
              <span className="text-blue-400">Cont</span>
            </div>

            <div className="mt-0.5 whitespace-nowrap text-[10px] font-medium tracking-[0.02em] text-slate-500">
              Inteligência em honorários
            </div>
          </div>
        )}
      </div>

      {/* MENU */}
      <nav className="relative flex-1 overflow-y-auto px-3 pb-5 pt-4">
        <div className="space-y-1">
          {menuFinal.map((item, index) => {
            if (item.type === "section") {
              if (collapsed) {
                return (
                  <div
                    key={`${item.label}-${index}`}
                    className="mx-2 my-4 border-t border-white/[0.07]"
                  />
                );
              }

              return (
                <div
                  key={`${item.label}-${index}`}
                  className="px-3 pb-2 pt-5 text-[9px] font-bold tracking-[0.22em] text-slate-600"
                >
                  {item.label}
                </div>
              );
            }

            const Icon = item.icon;
            const active = pagina === item.id;
            const tone = TONES[item.tone] || TONES.blue;

            return (
              <button
                key={item.id}
                type="button"
                disabled={!item.enabled}
                onClick={() => {
                  if (item.enabled) {
                    setPagina(item.id);
                  }
                }}
                title={collapsed ? item.label : undefined}
                className={`group relative flex w-full items-center rounded-[15px] border transition-all duration-200 ${
                  collapsed
                    ? "justify-center px-2 py-2.5"
                    : "gap-3 px-2.5 py-2"
                } ${
                  active
                    ? "border-white/[0.09] bg-white/[0.075] text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                    : item.enabled
                    ? "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.045] hover:text-white"
                    : "cursor-not-allowed border-transparent text-slate-700"
                }`}
              >
                {/* MARCADOR ATIVO */}
                {active && (
                  <span className="absolute -left-[13px] top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-300 via-blue-400 to-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                )}

                {/* CONTAINER DO ÍCONE */}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border transition-all duration-200 ${
                    active ? tone.active : tone.normal
                  }`}
                >
                  <Icon size={18} strokeWidth={1.9} />
                </span>

                {!collapsed && (
                  <>
                    <span
                      className={`whitespace-nowrap text-[13px] transition-colors ${
                        active
                          ? "font-semibold text-white"
                          : "font-medium text-slate-400 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </span>

                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]" />
                    )}

                    {!item.enabled && (
                      <span className="ml-auto rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] text-slate-600">
                        Em breve
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* USUÁRIO / CONFIGURAÇÕES */}
      <div className="relative shrink-0 border-t border-white/[0.07] bg-[#050A19]/80 p-3 backdrop-blur-xl">
        {!collapsed && (
          <button
            type="button"
            onClick={() => setPagina("minha-conta")}
            title="Minha conta"
            className="mb-2 w-full rounded-[16px] border border-white/[0.07] bg-white/[0.04] p-2.5 text-left transition hover:border-white/[0.12] hover:bg-white/[0.065]"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-visible rounded-[13px] border border-blue-300/20 bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-[0_8px_22px_rgba(37,99,235,0.22)]">
                {fotoUsuario ? (
                  <img
                    src={fotoUsuario}
                    alt={nomeUsuario || "Foto do usuário"}
                    className="h-full w-full rounded-[12px] object-cover"
                  />
                ) : (
                  inicialUsuario
                )}

                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0B1124] bg-emerald-400" />
              </div>

              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-slate-100">
                  {nomeUsuario}
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="h-1 w-1 rounded-full bg-blue-400" />
                  {perfilUsuario} • PrecificaCont
                </div>
              </div>
            </div>
          </button>
        )}

        {podeVerConfiguracoes && (
          <>
        <button
          type="button"
          onClick={() => setPagina("configuracoes")}
          title={collapsed ? "Configurações" : undefined}
          className={`group relative flex w-full items-center rounded-[15px] border transition-all duration-200 ${
            collapsed
              ? "justify-center px-2 py-2.5"
              : "gap-3 px-2.5 py-2"
          } ${
            pagina === "configuracoes"
              ? "border-white/[0.09] bg-white/[0.075] text-white"
              : "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.045] hover:text-white"
          }`}
        >
          {pagina === "configuracoes" && (
            <span className="absolute -left-[13px] top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-300 to-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
          )}

          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border transition-all ${
              pagina === "configuracoes"
                ? "border-blue-300/20 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_8px_22px_rgba(37,99,235,0.28)]"
                : "border-slate-700/70 bg-slate-800/60 text-slate-400 group-hover:border-slate-600 group-hover:text-white"
            }`}
          >
            <Settings size={18} strokeWidth={1.9} />
          </span>

          {!collapsed && (
            <span
              className={`text-[13px] ${
                pagina === "configuracoes"
                  ? "font-semibold text-white"
                  : "font-medium"
              }`}
            >
              Configurações
            </span>
          )}
        </button>
          </>
        )}
      </div>

      {/* RECOLHER MENU */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-[13px] top-[102px] z-50 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.14)] transition-all hover:scale-105 hover:text-blue-600"
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? (
          <ChevronRight size={14} strokeWidth={2.2} />
        ) : (
          <ChevronLeft size={14} strokeWidth={2.2} />
        )}
      </button>
    </aside>
  );
}