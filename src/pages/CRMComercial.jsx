import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Users,
  DollarSign,
  CalendarClock,
  Trophy,
  MoreHorizontal,
  X,
  Building2,
  FileText,
  Phone,
  Mail,
  Calendar,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  GripVertical,
  MessageSquareText,
  Clock3,
  UserRound,
  ExternalLink,
  BarChart3,
  ListTodo,
  PhoneCall,
  MessageCircle,
  Video,
  Check,
  Download,
  ArrowLeft,
  TrendingUp,
  Target,
  AlertTriangle,
  Mic,
  MicOff,
  RotateCcw,
  Copy,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../supabase";

const STORAGE_KEY = "precificacont_crm_oportunidades";
const MENSAGEM_PROPOSTA_KEY = "precificacont_mensagem_proposta";

const ESCRITORIO_ATIVO_KEY = "precificacont_escritorio_ativo";

function getEscritorioAtivoId() {
  return localStorage.getItem(ESCRITORIO_ATIVO_KEY) || "";
}

function scopedStorageKey(baseKey) {
  const escritorioId = getEscritorioAtivoId();
  return escritorioId ? `${baseKey}:${escritorioId}` : baseKey;
}


const ETAPAS = [
  { id: "novo_lead", nome: "Novo lead" },
  { id: "qualificado", nome: "Qualificado" },
  { id: "simulacao", nome: "Simulação" },
  { id: "proposta_enviada", nome: "Proposta enviada" },
  { id: "negociacao", nome: "Negociação" },
  { id: "ganho", nome: "Ganho" },
  { id: "perdido", nome: "Perdido" },
];

const TIPOS_ATIVIDADE = [
  { id: "followup", nome: "Follow-up" },
  { id: "ligacao", nome: "Ligação" },
  { id: "whatsapp", nome: "WhatsApp" },
  { id: "email", nome: "E-mail" },
  { id: "reuniao", nome: "Reunião" },
  { id: "tarefa", nome: "Tarefa" },
];

const emptyAtividade = {
  tipo: "followup",
  titulo: "",
  data: "",
  hora: "",
  observacao: "",
};

function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function etapaNome(id) {
  return ETAPAS.find((etapa) => etapa.id === id)?.nome || id || "—";
}

function proximaAtividadeDaLista(atividades = []) {
  return [...atividades]
    .filter((atividade) => atividade.status !== "concluida" && atividade.data)
    .sort((a, b) => {
      const da = new Date(`${a.data}T${a.hora || "23:59"}`).getTime();
      const db = new Date(`${b.data}T${b.hora || "23:59"}`).getTime();
      return da - db;
    })[0] || null;
}

function registrarHistorico(item, evento) {
  const historico = Array.isArray(item.historico) ? item.historico : [];
  return [
    {
      id: uid(),
      criadoEm: new Date().toISOString(),
      ...evento,
    },
    ...historico,
  ];
}

const emptyForm = {
  cliente: "",
  documento: "",
  contato: "",
  email: "",
  telefone: "",
  valorMensal: "",
  etapa: "novo_lead",
  origem: "",
  proximaAtividade: "",
  dataFollowup: "",
  proposta: "",
  observacoes: "",
};

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function currencyInput(value) {
  if (value === "" || value === null || value === undefined) return "";

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) return "";

  return numeric.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function currencyToNumber(value) {
  if (typeof value === "number") return value;

  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return 0;

  return Number(digits) / 100;
}

function handleCurrencyTyping(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  return currencyInput(Number(digits) / 100);
}


function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatDocumento(value) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function isValidCPF(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i += 1) soma += Number(cpf[i]) * (10 - i);
  let digito = (soma * 10) % 11;
  if (digito === 10) digito = 0;
  if (digito !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i += 1) soma += Number(cpf[i]) * (11 - i);
  digito = (soma * 10) % 11;
  if (digito === 10) digito = 0;

  return digito === Number(cpf[10]);
}

function isValidCNPJ(value) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calcular = (base, pesos) => {
    const soma = base
      .split("")
      .reduce((total, numero, index) => total + Number(numero) * pesos[index], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calcular(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(cnpj[12])) return false;

  const d2 = calcular(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === Number(cnpj[13]);
}

function documentStatus(value) {
  const digits = onlyDigits(value);

  if (!digits.length) return { state: "empty", label: "" };
  if (digits.length < 11) return { state: "incomplete", label: "Documento incompleto" };
  if (digits.length > 11 && digits.length < 14) {
    return { state: "incomplete", label: "CNPJ incompleto" };
  }
  if (digits.length === 11) {
    return isValidCPF(digits)
      ? { state: "valid", label: "CPF válido" }
      : { state: "invalid", label: "CPF inválido" };
  }
  if (digits.length === 14) {
    return isValidCNPJ(digits)
      ? { state: "valid", label: "CNPJ válido" }
      : { state: "invalid", label: "CNPJ inválido" };
  }
  return { state: "invalid", label: "Documento inválido" };
}

function daysInStage(oportunidade) {
  const raw = oportunidade.etapaAlteradaEm || oportunidade.updatedAt || oportunidade.createdAt;
  if (!raw) return 0;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function formatDate(value) {
  if (!value) return "Sem follow-up";

  const [ano, mes, dia] = String(value).split("-");

  if (!ano || !mes || !dia) return value;

  return `${dia}/${mes}/${ano}`;
}

function readStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(scopedStorageKey(STORAGE_KEY)) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveStorage(data) {
  localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(data));
}

function normalizeSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function readPropostasStorage() {
  const escritorioId = getEscritorioAtivoId();

  // Compatibilidade com as chaves já usadas pelo sistema.
  // O módulo Propostas usa "_" no cache por escritório.
  const chaves = [
    escritorioId ? `precificacont_propostas_${escritorioId}` : "",
    escritorioId ? `precificacont_propostas:${escritorioId}` : "",
    "precificacont_propostas",
    escritorioId ? `propostas_${escritorioId}` : "",
    escritorioId ? `propostas:${escritorioId}` : "",
    "propostas",
  ].filter(Boolean);

  for (const chave of chaves) {
    try {
      const data = JSON.parse(localStorage.getItem(chave) || "[]");
      if (Array.isArray(data) && data.length) return data;
    } catch {
      // Ignora uma chave inválida e tenta a próxima.
    }
  }

  return [];
}

function numeroDaProposta(proposta) {
  return (
    proposta?.numero_proposta ||
    proposta?.numeroProposta ||
    proposta?.numero ||
    proposta?.id ||
    ""
  );
}

function tokenDaProposta(proposta) {
  return proposta?.token_publico || proposta?.tokenPublico || proposta?.token || "";
}

function clienteDaProposta(proposta) {
  return proposta?.cliente || proposta?.client_nome || proposta?.cliente_nome || "";
}

function documentoDaProposta(proposta) {
  return proposta?.cnpj || proposta?.documento || proposta?.cpf_cnpj || "";
}

function CRMCard({
  oportunidade,
  onOpen,
  onDragStart,
}) {
  const dias = daysInStage(oportunidade);
  const doc = formatDocumento(oportunidade.documento);
  const atrasado =
    oportunidade.dataFollowup &&
    new Date(`${oportunidade.dataFollowup}T23:59:59`).getTime() < Date.now();

  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, oportunidade)}
      onClick={() => onOpen(oportunidade)}
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer active:cursor-grabbing"
      title="Clique para abrir a oportunidade ou arraste para mudar de etapa"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
          {(oportunidade.cliente || "C").trim().slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">
                {oportunidade.cliente || "Cliente sem nome"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {doc || "CNPJ/CPF não informado"}
              </p>
            </div>

            <div className="flex items-center text-slate-300 opacity-70 group-hover:opacity-100">
              <GripVertical size={16} />
              <MoreHorizontal size={17} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
            Mensalidade
          </p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">
            {money(oportunidade.valorMensal)}
          </p>
        </div>

        <span className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
          {dias === 0 ? "Hoje na etapa" : `${dias}d na etapa`}
        </span>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-start gap-2">
          <CalendarClock
            size={14}
            className={atrasado ? "text-rose-500 mt-0.5 shrink-0" : "text-slate-400 mt-0.5 shrink-0"}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-600 truncate">
              {oportunidade.proximaAtividade || "Sem próxima atividade"}
            </p>
            <p className={atrasado ? "text-[11px] text-rose-500 mt-0.5 font-medium" : "text-[11px] text-slate-400 mt-0.5"}>
              {formatDate(oportunidade.dataFollowup)}
              {atrasado ? " • vencido" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-slate-400 truncate">
          {oportunidade.origem || "Origem não informada"}
        </span>
        {oportunidade.proposta ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">
            <FileText size={11} />
            Proposta
          </span>
        ) : null}
      </div>
    </div>
  );
}



const CRM_DARK_CSS = `
.dark .crm-comercial { background:#07111f !important; color:#e5edf7; }
.dark .crm-comercial .bg-white { background-color:#0c1a2f !important; }
.dark .crm-comercial .bg-slate-50 { background-color:#101f34 !important; }
.dark .crm-comercial .bg-slate-100 { background-color:#17263a !important; }
.dark .crm-comercial .border-slate-100,
.dark .crm-comercial .border-slate-200,
.dark .crm-comercial .border-slate-300 { border-color:#263a55 !important; }
.dark .crm-comercial .text-slate-900,
.dark .crm-comercial .text-slate-800,
.dark .crm-comercial .text-slate-700 { color:#f1f5f9 !important; }
.dark .crm-comercial .text-slate-600,
.dark .crm-comercial .text-slate-500 { color:#cbd5e1 !important; }
.dark .crm-comercial .text-slate-400,
.dark .crm-comercial .text-slate-300 { color:#94a3b8 !important; }
.dark .crm-comercial input,
.dark .crm-comercial textarea,
.dark .crm-comercial select {
  background-color:#0b1729 !important;
  border-color:#30445f !important;
  color:#f8fafc !important;
}
.dark .crm-comercial input::placeholder,
.dark .crm-comercial textarea::placeholder { color:#718096 !important; }
.dark .crm-comercial input:disabled,
.dark .crm-comercial textarea:disabled,
.dark .crm-comercial select:disabled {
  background-color:#111d2e !important;
  color:#94a3b8 !important;
}
.dark .crm-comercial .bg-blue-50 { background-color:rgba(37,99,235,.16) !important; }
.dark .crm-comercial .bg-violet-50 { background-color:rgba(124,58,237,.16) !important; }
.dark .crm-comercial .bg-emerald-50 { background-color:rgba(5,150,105,.16) !important; }
.dark .crm-comercial .bg-rose-50 { background-color:rgba(225,29,72,.16) !important; }
.dark .crm-comercial .bg-amber-50 { background-color:rgba(217,119,6,.16) !important; }
`;

const CRM_TABLE = "crm_oportunidades";

function crmToDb(item, escritorioId) {
  return {
    id: item.id,
    escritorio_id: escritorioId,
    cliente: item.cliente || "",
    documento: item.documento || "",
    contato: item.contato || "",
    email: item.email || "",
    telefone: item.telefone || "",
    valor_mensal: Number(item.valorMensal || 0),
    etapa: item.etapa || "novo_lead",
    origem: item.origem || "",
    proxima_atividade: item.proximaAtividade || "",
    data_followup: item.dataFollowup || null,
    proposta: item.proposta || "",
    observacoes: item.observacoes || "",
    motivo_perda: item.motivoPerda || "",
    atividades: Array.isArray(item.atividades) ? item.atividades : [],
    historico: Array.isArray(item.historico) ? item.historico : [],
    etapa_alterada_em: item.etapaAlteradaEm || null,
    ganho_em: item.ganhoEm || null,
    perdido_em: item.perdidoEm || null,
    reaberta_em: item.reabertaEm || null,
    created_at: item.createdAt || new Date().toISOString(),
    updated_at: item.updatedAt || new Date().toISOString(),
  };
}

function crmFromDb(row) {
  return {
    id: row.id,
    cliente: row.cliente || "",
    documento: row.documento || "",
    contato: row.contato || "",
    email: row.email || "",
    telefone: row.telefone || "",
    valorMensal: Number(row.valor_mensal || 0),
    etapa: row.etapa || "novo_lead",
    origem: row.origem || "",
    proximaAtividade: row.proxima_atividade || "",
    dataFollowup: row.data_followup || "",
    proposta: row.proposta || "",
    observacoes: row.observacoes || "",
    motivoPerda: row.motivo_perda || "",
    atividades: Array.isArray(row.atividades) ? row.atividades : [],
    historico: Array.isArray(row.historico) ? row.historico : [],
    etapaAlteradaEm: row.etapa_alterada_em || null,
    ganhoEm: row.ganho_em || null,
    perdidoEm: row.perdido_em || null,
    reabertaEm: row.reaberta_em || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

export default function CRMComercial({ setPagina }) {
  const escritorioAtivoId = getEscritorioAtivoId();
  const [oportunidades, setOportunidades] = useState(() => readStorage());
  const oportunidadesRef = useRef(oportunidades);
  const syncQueueRef = useRef(Promise.resolve());
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [draggingId, setDraggingId] = useState(null);
  const [abaModal, setAbaModal] = useState("geral");
  const [visao, setVisao] = useState("kanban");
  const [atividadeForm, setAtividadeForm] = useState(emptyAtividade);
  const [periodoRelatorio, setPeriodoRelatorio] = useState("todos");
  const [gravandoCampo, setGravandoCampo] = useState(null);
  const [reconhecimentoVoz, setReconhecimentoVoz] = useState(null);
  const [compartilhando, setCompartilhando] = useState(null);
  const [mensagemCompartilhamento, setMensagemCompartilhamento] = useState("");
  const [propostasRevision, setPropostasRevision] = useState(0);
  const [permissoesModulo, setPermissoesModulo] = useState({
    carregando: true,
    pode_visualizar: false,
    pode_criar: false,
    pode_editar: false,
    pode_excluir: false,
  });

  useEffect(() => {
    let ativo = true;

    const carregarPermissoesModulo = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const userId = authData?.user?.id;
        if (!userId || !escritorioAtivoId) {
          if (ativo) {
            setPermissoesModulo({
              carregando: false,
              pode_visualizar: false,
              pode_criar: false,
              pode_editar: false,
              pode_excluir: false,
            });
          }
          return;
        }

        const { data: vinculo, error: vinculoError } = await supabase
          .from("usuarios_escritorios")
          .select("perfil, perfil_acesso_id")
          .eq("user_id", userId)
          .eq("escritorio_id", escritorioAtivoId)
          .eq("ativo", true)
          .maybeSingle();

        if (vinculoError) throw vinculoError;

        if (String(vinculo?.perfil || "").toLowerCase() === "admin") {
          if (ativo) {
            setPermissoesModulo({
              carregando: false,
              pode_visualizar: true,
              pode_criar: true,
              pode_editar: true,
              pode_excluir: true,
            });
          }
          return;
        }

        if (!vinculo?.perfil_acesso_id) {
          if (ativo) {
            setPermissoesModulo({
              carregando: false,
              pode_visualizar: false,
              pode_criar: false,
              pode_editar: false,
              pode_excluir: false,
            });
          }
          return;
        }

        const { data: modulo, error: moduloError } = await supabase
          .from("modulos_saas")
          .select("id")
          .eq("codigo", "crm")
          .eq("ativo", true)
          .maybeSingle();

        if (moduloError) throw moduloError;
        if (!modulo?.id) throw new Error('Módulo "crm" não encontrado.');

        const { data: permissao, error: permissaoError } = await supabase
          .from("perfil_modulos")
          .select("pode_visualizar, pode_criar, pode_editar, pode_excluir")
          .eq("perfil_acesso_id", vinculo.perfil_acesso_id)
          .eq("modulo_id", modulo.id)
          .maybeSingle();

        if (permissaoError) throw permissaoError;

        if (ativo) {
          setPermissoesModulo({
            carregando: false,
            pode_visualizar: Boolean(permissao?.pode_visualizar),
            pode_criar: Boolean(permissao?.pode_criar),
            pode_editar: Boolean(permissao?.pode_editar),
            pode_excluir: Boolean(permissao?.pode_excluir),
          });
        }
      } catch (error) {
        console.error("CRM: erro ao carregar permissões do perfil.", error);
        if (ativo) {
          setPermissoesModulo({
            carregando: false,
            pode_visualizar: false,
            pode_criar: false,
            pode_editar: false,
            pode_excluir: false,
          });
        }
      }
    };

    carregarPermissoesModulo();

    return () => {
      ativo = false;
    };
  }, [escritorioAtivoId]);

  const negarAcao = (mensagem) => {
    alert(mensagem);
  };

  const [propostasDisponiveis, setPropostasDisponiveis] = useState([]);

  useEffect(() => {
    if (!modalOpen) {
      setPropostasDisponiveis([]);
      return undefined;
    }

    let cancelado = false;
    const timer = window.setTimeout(() => {
      if (!cancelado) setPropostasDisponiveis(readPropostasStorage());
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [modalOpen, propostasRevision]);

  const propostaVinculada = useMemo(() => {
    if (!form.proposta) return null;
    const referencia = String(form.proposta).trim();
    return (
      propostasDisponiveis.find(
        (proposta) => String(numeroDaProposta(proposta)).trim() === referencia
      ) || null
    );
  }, [form.proposta, propostasDisponiveis]);

  useEffect(() => {
    oportunidadesRef.current = oportunidades;
  }, [oportunidades]);

  useEffect(() => {
    let ativo = true;

    const carregarCRM = async () => {
      const cacheLocal = readStorage();

      // Corrige IDs antigos que não eram UUID antes de enviar ao Supabase.
      const cacheNormalizado = cacheLocal.map((item) => {
        if (isUuid(item.id)) return item;
        return {
          ...item,
          id: uid(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        };
      });

      if (
        cacheNormalizado.some(
          (item, index) => item.id !== cacheLocal[index]?.id
        )
      ) {
        saveStorage(cacheNormalizado);
        if (ativo) setOportunidades(cacheNormalizado);
      }

      try {
        const { data, error } = await supabase
          .from(CRM_TABLE)
          .select("*")
          .eq("escritorio_id", escritorioAtivoId)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        if (!ativo) return;

        const banco = Array.isArray(data) ? data.map(crmFromDb) : [];
        // Banco é a fonte principal deste escritório. Cache continua para abertura instantânea.
        oportunidadesRef.current = banco;
        setOportunidades(banco);
        saveStorage(banco);
      } catch (error) {
        console.error("CRM: falha ao sincronizar com Supabase.", error);
        // O CRM continua funcional com o cache local se a rede estiver indisponível.
      }
    };

    carregarCRM();

    return () => {
      ativo = false;
    };
  }, [escritorioAtivoId]);

  const enfileirarSync = (operacao) => {
    syncQueueRef.current = syncQueueRef.current
      .then(operacao)
      .catch((error) => {
        console.error("CRM: erro ao salvar no Supabase.", error);
      });

    return syncQueueRef.current;
  };

  const persist = (next) => {
    const anterior = oportunidadesRef.current;
    oportunidadesRef.current = next;

    // UI e cache são atualizados imediatamente: nenhuma espera de rede para redesenhar o CRM.
    setOportunidades(next);
    saveStorage(next);

    const anteriorMap = new Map(anterior.map((item) => [String(item.id), item]));
    const nextMap = new Map(next.map((item) => [String(item.id), item]));

    const removidos = anterior
      .filter((item) => !nextMap.has(String(item.id)))
      .map((item) => item.id)
      .filter(isUuid);

    const alterados = next.filter((item) => {
      const velho = anteriorMap.get(String(item.id));
      if (!velho) return true;
      return JSON.stringify(velho) !== JSON.stringify(item);
    });

    // Apenas registros realmente alterados são enviados. Não recarrega a carteira inteira.
    enfileirarSync(async () => {
      if (removidos.length) {
        const { error } = await supabase
          .from(CRM_TABLE)
          .delete()
          .in("id", removidos)
          .eq("escritorio_id", escritorioAtivoId);
        if (error) throw error;
      }

      if (alterados.length) {
        const registros = alterados.map((item) => {
          const normalizado = isUuid(item.id) ? item : { ...item, id: uid() };
          return crmToDb(normalizado, escritorioAtivoId);
        });

        const { error } = await supabase
          .from(CRM_TABLE)
          .upsert(registros, { onConflict: "id" });

        if (error) throw error;
      }
    });
  };

  const oportunidadesFiltradas = useMemo(() => {
    const termo = normalizeSearch(busca.trim());

    if (!termo) return oportunidades;

    return oportunidades.filter((item) => {
      const texto = normalizeSearch(
        [
          item.cliente,
          item.documento,
          item.contato,
          item.email,
          item.telefone,
          item.proposta,
          item.origem,
        ].join(" ")
      );

      return texto.includes(termo);
    });
  }, [oportunidades, busca]);

  const indicadores = useMemo(() => {
    const abertas = oportunidades.filter(
      (item) => !["ganho", "perdido"].includes(item.etapa)
    );

    const ganhos = oportunidades.filter((item) => item.etapa === "ganho");

    const pipeline = abertas.reduce(
      (total, item) => total + Number(item.valorMensal || 0),
      0
    );

    const mensalGanho = ganhos.reduce(
      (total, item) => total + Number(item.valorMensal || 0),
      0
    );

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const followups = abertas.filter((item) => {
      if (!item.dataFollowup) return false;

      const data = new Date(`${item.dataFollowup}T00:00:00`);

      return data <= hoje;
    }).length;

    return {
      abertas: abertas.length,
      pipeline,
      followups,
      ganhos: ganhos.length,
      mensalGanho,
    };
  }, [oportunidades]);

  const abrirNova = () => {
    if (!permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para criar oportunidades.");
      return;
    }
    setEditandoId(null);
    setForm(emptyForm);
    setAbaModal("geral");
    setAtividadeForm(emptyAtividade);
    setModalOpen(true);
  };

  const abrirEdicao = (oportunidade) => {
    setEditandoId(oportunidade.id);

    setForm({
      cliente: oportunidade.cliente || "",
      documento: formatDocumento(oportunidade.documento || ""),
      contato: oportunidade.contato || "",
      email: oportunidade.email || "",
      telefone: oportunidade.telefone || "",
      valorMensal: currencyInput(oportunidade.valorMensal),
      etapa: oportunidade.etapa || "novo_lead",
      origem: oportunidade.origem || "",
      proximaAtividade: oportunidade.proximaAtividade || "",
      dataFollowup: oportunidade.dataFollowup || "",
      proposta: oportunidade.proposta || "",
      observacoes: oportunidade.observacoes || "",
    });

    setAbaModal("geral");
    setAtividadeForm(emptyAtividade);
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setEditandoId(null);
    setForm(emptyForm);
  };

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const salvarOportunidade = (event) => {
    event.preventDefault();

    if (editandoId && !permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para editar oportunidades.");
      return;
    }

    if (!editandoId && !permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para criar oportunidades.");
      return;
    }

    if (!form.cliente.trim()) {
      alert("Informe o nome da empresa/cliente.");
      return;
    }

    if (form.documento) {
      const statusDocumento = documentStatus(form.documento);
      if (statusDocumento.state !== "valid") {
        alert(statusDocumento.label || "Informe um CPF ou CNPJ válido.");
        return;
      }
    }

    if (editandoId) {
      const next = oportunidades.map((item) =>
        item.id === editandoId
          ? {
              ...item,
              ...form,
              valorMensal: currencyToNumber(form.valorMensal),
              documento: formatDocumento(form.documento),
              cliente: form.cliente.trim(),
              atividades: Array.isArray(item.atividades) ? item.atividades : [],
              historico: registrarHistorico(item, {
                tipo: "edicao",
                titulo: "Oportunidade atualizada",
                descricao: "Dados comerciais da oportunidade foram atualizados.",
              }),
              updatedAt: new Date().toISOString(),
            }
          : item
      );

      persist(next);
      fecharModal();
      return;
    }

    const nova = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      ...form,
      valorMensal: currencyToNumber(form.valorMensal),
      documento: formatDocumento(form.documento),
      cliente: form.cliente.trim(),
      atividades: [],
      historico: [
        {
          id: uid(),
          criadoEm: new Date().toISOString(),
          tipo: "criacao",
          titulo: "Oportunidade criada",
          descricao: `Oportunidade criada na etapa ${etapaNome(form.etapa)}.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    persist([nova, ...oportunidades]);
    fecharModal();
  };

  const excluirOportunidade = () => {
    if (!permissoesModulo.pode_excluir) {
      negarAcao("Seu perfil não possui permissão para excluir oportunidades.");
      return;
    }
    if (!editandoId) return;

    const oportunidade = oportunidades.find(
      (item) => item.id === editandoId
    );

    const confirmar = window.confirm(
      `Excluir a oportunidade de ${
        oportunidade?.cliente || "este cliente"
      }?`
    );

    if (!confirmar) return;

    persist(oportunidades.filter((item) => item.id !== editandoId));
    fecharModal();
  };

  const moverParaEtapa = (oportunidadeId, novaEtapa) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para alterar oportunidades.");
      return;
    }
    const next = oportunidades.map((item) => {
      if (item.id !== oportunidadeId || item.etapa === novaEtapa) return item;

      const etapaAnterior = item.etapa;

      return {
        ...item,
        etapa: novaEtapa,
        etapaAlteradaEm: new Date().toISOString(),
        historico: registrarHistorico(item, {
          tipo: "etapa",
          titulo: "Etapa alterada",
          descricao: `${etapaNome(etapaAnterior)} → ${etapaNome(novaEtapa)}`,
        }),
        updatedAt: new Date().toISOString(),
      };
    });

    persist(next);
  };

  const iniciarArraste = (event, oportunidade) => {
    if (!permissoesModulo.pode_editar) {
      event.preventDefault();
      return;
    }
    setDraggingId(oportunidade.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", oportunidade.id);
  };

  const soltarNaEtapa = (event, etapaId) => {
    event.preventDefault();

    const oportunidadeId =
      event.dataTransfer.getData("text/plain") || draggingId;

    if (!oportunidadeId) return;

    moverParaEtapa(oportunidadeId, etapaId);
    setDraggingId(null);
  };

  const linkPublicoDaProposta = (proposta) => {
    const token = tokenDaProposta(proposta);
    if (!token) return "";
    return `${window.location.origin}/proposta/${token}`;
  };

  const abrirPropostaPublica = (proposta) => {
    const link = linkPublicoDaProposta(proposta);
    if (!link) {
      alert("Esta proposta ainda não possui link público. Abra o módulo de Propostas e publique/copiei o link primeiro.");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  };


  const abrirPropostaInterna = (proposta) => {
    const referencia = String(
      numeroDaProposta(proposta) || proposta?.id || ""
    ).trim();

    if (!referencia) {
      alert("Não foi possível identificar a proposta vinculada.");
      return;
    }

    localStorage.setItem("precificacont_abrir_proposta", referencia);
    fecharModal();

    if (typeof setPagina === "function") {
      setPagina("propostas");
      return;
    }

    alert("Abra o módulo Propostas para visualizar a proposta.");
  };

  const proximoNumeroPropostaCRM = (lista) => {
    const ano = new Date().getFullYear();
    let maior = 0;

    (Array.isArray(lista) ? lista : []).forEach((item) => {
      const numero = String(numeroDaProposta(item) || "");
      const match = numero.match(/^PROP-(\d{4})-(\d{4,})$/);

      if (match && Number(match[1]) === ano) {
        maior = Math.max(maior, Number(match[2] || 0));
      }
    });

    return `PROP-${ano}-${String(maior + 1).padStart(4, "0")}`;
  };

  const consultarCNPJCRM = async (valor) => {
    const cnpj = onlyDigits(valor);

    if (cnpj.length !== 14 || !isValidCNPJ(cnpj)) return;

    try {
      let dados = null;

      // Mantém a mesma regra de consulta já utilizada na Nova Simulação:
      // OpenCNPJ como fonte principal e BrasilAPI como fallback.
      try {
        const respostaOpenCnpj = await fetch(
          `https://api.opencnpj.org/${cnpj}`
        );

        if (respostaOpenCnpj.ok) {
          dados = await respostaOpenCnpj.json();
        }
      } catch (errorOpenCnpj) {
        console.warn(
          "CRM: OpenCNPJ indisponível para esta consulta.",
          errorOpenCnpj
        );
      }

      if (!dados) {
        const respostaBrasilApi = await fetch(
          `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`
        );

        if (!respostaBrasilApi.ok) {
          throw new Error("CNPJ não encontrado nas fontes de consulta.");
        }

        dados = await respostaBrasilApi.json();
      }

      const estabelecimento = dados?.estabelecimento || dados || {};

      const razaoSocial = String(
        dados?.razao_social ||
        dados?.nome_empresarial ||
        dados?.razaoSocial ||
        estabelecimento?.razao_social ||
        estabelecimento?.nome_fantasia ||
        estabelecimento?.nomeFantasia ||
        dados?.nome_fantasia ||
        ""
      ).trim();

      if (razaoSocial) {
        setField("cliente", razaoSocial);
      }
    } catch (error) {
      console.error(
        "CRM: consulta de CNPJ indisponível. O preenchimento manual continua liberado.",
        error
      );
    }
  };

  const gerarPropostaDoCRM = async (oportunidade) => {
    if (!oportunidade) return;

    const cliente = String(form.cliente || oportunidade.cliente || "").trim();
    const documento = String(
      form.documento || oportunidade.documento || ""
    ).trim();
    const email = String(form.email || oportunidade.email || "").trim();
    const telefone = String(
      form.telefone || oportunidade.telefone || ""
    ).trim();

    let simulacaoVinculada = null;

    // A proposta do CRM deve nascer da memória de cálculo real.
    // Procura a simulação mais recente vinculada a esta oportunidade.
    try {
      const { data: simulacoesBanco, error: erroSimulacoes } = await supabase
        .from("simulacoes")
        .select("*")
        .order("updated_date", { ascending: false })
        .limit(200);

      if (erroSimulacoes) throw erroSimulacoes;

      simulacaoVinculada =
        (Array.isArray(simulacoesBanco) ? simulacoesBanco : []).find((row) => {
          const dados = row?.dados || {};
          const crmId =
            dados?.crm_oportunidade_id ||
            dados?.oportunidade_id ||
            row?.crm_oportunidade_id ||
            row?.oportunidade_id ||
            "";
          return String(crmId) === String(oportunidade.id);
        }) || null;
    } catch (error) {
      console.warn(
        "CRM: não foi possível consultar a simulação vinculada no Supabase.",
        error
      );
    }

    // Compatibilidade/cache: tenta também a memória local do escritório.
    if (!simulacaoVinculada) {
      try {
        const chavesSimulacoes = [
          escritorioAtivoId ? `precificacont_simulacoes_${escritorioAtivoId}` : "",
          escritorioAtivoId ? `precificacont_simulacoes:${escritorioAtivoId}` : "",
          "precificacont_simulacoes",
        ].filter(Boolean);

        for (const chave of chavesSimulacoes) {
          const lista = JSON.parse(localStorage.getItem(chave) || "[]");
          const encontrada = (Array.isArray(lista) ? lista : []).find((item) => {
            const crmId =
              item?.crm_oportunidade_id ||
              item?.oportunidade_id ||
              item?.dados?.crm_oportunidade_id ||
              item?.dados?.oportunidade_id ||
              "";
            return String(crmId) === String(oportunidade.id);
          });

          if (encontrada) {
            simulacaoVinculada = encontrada;
            break;
          }
        }
      } catch (error) {
        console.warn("CRM: cache de simulações indisponível.", error);
      }
    }

    const memoria =
      simulacaoVinculada?.dados &&
      typeof simulacaoVinculada.dados === "object"
        ? simulacaoVinculada.dados
        : simulacaoVinculada;

    const valorCalculado = Number(
      memoria?.mensalidade_total ??
      simulacaoVinculada?.valor_total_mensal ??
      memoria?.valor_total_mensal ??
      0
    );

    const temSimulacaoCalculada =
      Boolean(simulacaoVinculada) && valorCalculado > 0;

    const rascunhoCRM = {
      id: `CRM-DRAFT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      numero_proposta: "",
      status: "rascunho",
      origem: "crm",
      origem_crm: true,
      crm_oportunidade_id: oportunidade.id,
      oportunidade_id: oportunidade.id,
      simulacao_id: simulacaoVinculada?.id || memoria?.id || null,

      cliente:
        cliente ||
        memoria?.cliente ||
        memoria?.client_nome ||
        "",
      client_nome:
        cliente ||
        memoria?.client_nome ||
        memoria?.cliente ||
        "",
      cnpj:
        documento ||
        memoria?.cnpj ||
        "",
      documento:
        documento ||
        memoria?.cnpj ||
        "",
      contato: form.contato || oportunidade.contato || "",
      email_cliente: email,
      email,
      telefone,
      whatsapp: telefone,

      // O valor da proposta vem exclusivamente da simulação calculada.
      valor_mensal: valorCalculado,
      mensalidade: valorCalculado,

      valores: {
        honorario_matriz: Number(
          memoria?.valor_matriz ??
          memoria?.indice_precificacont ??
          memoria?.valor_contabil_fiscal ??
          simulacaoVinculada?.indice_precificacont ??
          0
        ),
        filiais: Number(
          memoria?.valor_filiais ??
          simulacaoVinculada?.valor_filiais ??
          0
        ),
        servicos_recorrentes: Number(
          memoria?.adicionais_recorrentes ??
          simulacaoVinculada?.valor_servicos_mensais ??
          0
        ),
        servicos_pontuais: Number(
          memoria?.adicionais_pontuais ??
          simulacaoVinculada?.valor_servicos_pontuais ??
          0
        ),
        mensalidade_total: valorCalculado,
        primeiro_mes: Number(
          memoria?.proposta_primeiro_mes ??
          memoria?.primeiro_mes ??
          (
            valorCalculado +
            Number(
              memoria?.adicionais_pontuais ??
              simulacaoVinculada?.valor_servicos_pontuais ??
              0
            )
          )
        ),
      },

      // Leva a memória completa para a Nova Simulação/Proposta.
      dados: {
        ...(memoria && typeof memoria === "object" ? memoria : {}),
        cliente:
          cliente ||
          memoria?.cliente ||
          memoria?.client_nome ||
          "",
        cnpj:
          documento ||
          memoria?.cnpj ||
          "",
        contato: form.contato || oportunidade.contato || "",
        email,
        telefone,
        origem: form.origem || oportunidade.origem || "",
        observacoes: form.observacoes || oportunidade.observacoes || "",
        crm_oportunidade_id: oportunidade.id,
        oportunidade_id: oportunidade.id,
      },

      configuracao: {
        titulo: "Proposta Comercial de Serviços Contábeis",
        subtitulo: "",
        mensagem: "Apresentamos uma proposta personalizada para sua empresa.",
        condicoes:
          "Valores e condições conforme os itens apresentados nesta proposta.",
        observacoes: form.observacoes || oportunidade.observacoes || "",
        formaPagamento: "A combinar",
        validadeDias: 7,
      },
    };

    localStorage.setItem(
      "precificacont_nova_proposta_crm",
      JSON.stringify(rascunhoCRM)
    );

    fecharModal();

    const clienteFinal = String(
      rascunhoCRM.cliente || rascunhoCRM.client_nome || ""
    ).trim();
    const documentoFinal = String(
      rascunhoCRM.cnpj || rascunhoCRM.documento || ""
    ).trim();

    const clienteNaoIdentificado =
      !clienteFinal ||
      clienteFinal.toLowerCase() === "cliente sem nome" ||
      clienteFinal.toLowerCase() === "simulação sem cliente";
    const documentoNaoInformado = !documentoFinal;

    if (typeof setPagina === "function") {
      // Sem memória de cálculo válida: primeiro precifica.
      if (!temSimulacaoCalculada) {
        localStorage.setItem(
          "precificacont_fluxo_crm_nova_simulacao",
          "precificar"
        );
        setPagina("nova");
        return;
      }

      // Há cálculo real, mas faltam dados cadastrais:
      // mantém a memória e abre somente o modal para completar identificação.
      if (clienteNaoIdentificado || documentoNaoInformado) {
        localStorage.setItem(
          "precificacont_fluxo_crm_nova_simulacao",
          "completar_dados_proposta"
        );
        setPagina("nova");
        return;
      }

      // Há simulação calculada e identificação completa.
      localStorage.setItem(
        "precificacont_fluxo_crm_nova_simulacao",
        "gerar_com_simulacao"
      );
      setPagina("nova");
      return;
    }

    alert(
      !temSimulacaoCalculada
        ? "Abra Nova Simulação para precificar esta oportunidade antes de gerar a proposta."
        : "Abra Nova Simulação para concluir a geração da proposta."
    );
  };

  const corpoMensagemPadrao = () =>
    `Preparamos sua proposta comercial de serviços contábeis.

Você pode visualizar e analisar a proposta através do link abaixo.

Ficamos à disposição para qualquer dúvida.`;

  const carregarMensagemPadrao = () => {
    try {
      return localStorage.getItem(MENSAGEM_PROPOSTA_KEY) || corpoMensagemPadrao();
    } catch {
      return corpoMensagemPadrao();
    }
  };

  const montarMensagemCompartilhamento = (oportunidade, proposta, link) => {
    const nome =
      oportunidade?.cliente ||
      clienteDaProposta(proposta) ||
      "cliente";

    const corpo =
      mensagemCompartilhamento.trim() || carregarMensagemPadrao();

    return `Olá, ${nome}!

${corpo}

${link}`;
  };

  const abrirCompartilhamentoCRM = (oportunidade) => {
    const referencia = String(
      oportunidade?.proposta || form.proposta || ""
    ).trim();

    const proposta = propostasDisponiveis.find(
      (item) => String(numeroDaProposta(item)).trim() === referencia
    );

    if (!proposta) {
      alert("Vincule uma proposta existente a esta oportunidade antes de compartilhar.");
      return;
    }

    const link = linkPublicoDaProposta(proposta);

    if (!link) {
      alert(
        "A proposta vinculada ainda não possui link público. Abra o módulo de Propostas e gere/publique o link primeiro."
      );
      return;
    }

    setMensagemCompartilhamento(carregarMensagemPadrao());
    setCompartilhando({
      oportunidade: { ...oportunidade, proposta: referencia },
      proposta,
      link,
    });
  };

  const fecharCompartilhamentoCRM = () => {
    setCompartilhando(null);
    setMensagemCompartilhamento("");
  };

  const marcarComoPropostaEnviada = (oportunidade) => {
    if (!oportunidade || oportunidade.etapa === "proposta_enviada") return;

    moverParaEtapa(oportunidade.id, "proposta_enviada");
    setForm((current) => ({ ...current, etapa: "proposta_enviada" }));
  };

  const enviarCompartilhamentoWhatsApp = () => {
    if (!compartilhando) return;

    const { oportunidade, proposta, link } = compartilhando;
    const mensagem = montarMensagemCompartilhamento(
      oportunidade,
      proposta,
      link
    );

    const telefone = onlyDigits(
      oportunidade.telefone ||
        proposta.telefone ||
        proposta.whatsapp ||
        ""
    );

    const destino = telefone
      ? `https://wa.me/55${telefone.replace(/^55/, "")}?text=${encodeURIComponent(
          mensagem
        )}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

    window.open(destino, "_blank", "noopener,noreferrer");
    marcarComoPropostaEnviada(oportunidade);
  };

  const enviarCompartilhamentoEmail = () => {
    if (!compartilhando) return;

    const { oportunidade, proposta, link } = compartilhando;
    const nome =
      oportunidade.cliente ||
      clienteDaProposta(proposta) ||
      "cliente";
    const mensagem = montarMensagemCompartilhamento(
      oportunidade,
      proposta,
      link
    );
    const email =
      oportunidade.email ||
      proposta.email_cliente ||
      proposta.email ||
      "";

    const assunto = encodeURIComponent(`Proposta comercial - ${nome}`);

    window.location.href = `mailto:${encodeURIComponent(
      email
    )}?subject=${assunto}&body=${encodeURIComponent(mensagem)}`;

    marcarComoPropostaEnviada(oportunidade);
  };

  const copiarMensagemCRM = async () => {
    if (!compartilhando) return;

    const mensagem = montarMensagemCompartilhamento(
      compartilhando.oportunidade,
      compartilhando.proposta,
      compartilhando.link
    );

    try {
      await navigator.clipboard.writeText(mensagem);
      alert("Mensagem copiada.");
    } catch {
      alert("Não foi possível copiar a mensagem automaticamente.");
    }
  };

  const salvarMensagemPadraoCRM = () => {
    const mensagem = mensagemCompartilhamento.trim();

    if (!mensagem) {
      alert("Digite uma mensagem antes de salvar como padrão.");
      return;
    }

    try {
      localStorage.setItem(MENSAGEM_PROPOSTA_KEY, mensagem);
      alert("Mensagem padrão salva para as próximas propostas.");
    } catch {
      alert("Não foi possível salvar a mensagem padrão.");
    }
  };

  const enviarProposta = (oportunidade) => {
    abrirCompartilhamentoCRM(oportunidade);
  };

  const ganharOportunidade = (oportunidade) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para alterar oportunidades.");
      return;
    }
    const confirmar = window.confirm(
      `Confirmar ${oportunidade.cliente} como oportunidade ganha?`
    );

    if (!confirmar) return;

    const next = oportunidades.map((item) =>
      item.id === oportunidade.id
        ? {
            ...item,
            etapa: "ganho",
            ganhoEm: new Date().toISOString(),
            motivoPerda: "",
            historico: registrarHistorico(item, {
              tipo: "ganho",
              titulo: "Oportunidade ganha",
              descricao: `Fechamento confirmado em ${money(item.valorMensal)}/mês.`,
            }),
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    persist(next);
  };

  const perderOportunidade = (oportunidade) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para alterar oportunidades.");
      return;
    }
    const motivo = window.prompt(
      `Informe o motivo da perda de ${oportunidade.cliente}:`
    );

    if (motivo === null) return;

    if (!motivo.trim()) {
      alert("Informe o motivo da perda para continuar.");
      return;
    }

    const next = oportunidades.map((item) =>
      item.id === oportunidade.id
        ? {
            ...item,
            etapa: "perdido",
            perdidoEm: new Date().toISOString(),
            motivoPerda: motivo.trim(),
            historico: registrarHistorico(item, {
              tipo: "perda",
              titulo: "Oportunidade perdida",
              descricao: motivo.trim(),
            }),
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    persist(next);
  };



  const iniciarDitado = (campo) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "O reconhecimento de voz não está disponível neste navegador. Tente usar Google Chrome ou Microsoft Edge. A digitação continua disponível normalmente."
      );
      return;
    }

    if (reconhecimentoVoz && gravandoCampo) {
      reconhecimentoVoz.stop();
      setReconhecimentoVoz(null);
      setGravandoCampo(null);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    let textoFinalSessao = "";

    recognition.onstart = () => {
      setGravandoCampo(campo);
      setReconhecimentoVoz(recognition);
    };

    recognition.onresult = (event) => {
      let parcial = "";
      let novoFinal = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const trecho = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          novoFinal += trecho;
        } else {
          parcial += trecho;
        }
      }

      if (novoFinal) {
        textoFinalSessao += `${novoFinal.trim()} `;
      }

      const textoCapturado = `${textoFinalSessao}${parcial}`.trim();

      if (campo === "observacoes") {
        setForm((current) => {
          const base = current.observacoes || "";
          const marcador = current.__vozBaseObservacoes ?? base;
          return {
            ...current,
            __vozBaseObservacoes: marcador,
            observacoes: `${marcador}${marcador && textoCapturado ? " " : ""}${textoCapturado}`.trim(),
          };
        });
      }

      if (campo === "atividade") {
        setAtividadeForm((current) => {
          const base = current.observacao || "";
          const marcador = current.__vozBaseAtividade ?? base;
          return {
            ...current,
            __vozBaseAtividade: marcador,
            observacao: `${marcador}${marcador && textoCapturado ? " " : ""}${textoCapturado}`.trim(),
          };
        });
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        alert("Não foi possível usar o microfone. Verifique a permissão do navegador e tente novamente.");
      }
      setGravandoCampo(null);
      setReconhecimentoVoz(null);
    };

    recognition.onend = () => {
      setGravandoCampo(null);
      setReconhecimentoVoz(null);
      setForm((current) => {
        const { __vozBaseObservacoes, ...rest } = current;
        return rest;
      });
      setAtividadeForm((current) => {
        const { __vozBaseAtividade, ...rest } = current;
        return rest;
      });
    };

    try {
      recognition.start();
    } catch {
      setGravandoCampo(null);
      setReconhecimentoVoz(null);
    }
  };

  const pararDitado = () => {
    if (reconhecimentoVoz) reconhecimentoVoz.stop();
    setGravandoCampo(null);
    setReconhecimentoVoz(null);
  };

  const reabrirOportunidade = (oportunidade) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para alterar oportunidades.");
      return;
    }
    if (!["ganho", "perdido"].includes(oportunidade.etapa)) return;

    const etapaAnterior = oportunidade.etapa;
    const confirmar = window.confirm(
      `Reabrir ${oportunidade.cliente} e devolver a oportunidade para Negociação?`
    );

    if (!confirmar) return;

    const next = oportunidades.map((item) =>
      item.id === oportunidade.id
        ? {
            ...item,
            etapa: "negociacao",
            etapaAlteradaEm: new Date().toISOString(),
            reabertaEm: new Date().toISOString(),
            historico: registrarHistorico(item, {
              tipo: "reabertura",
              titulo: "Oportunidade reaberta",
              descricao: `${etapaNome(etapaAnterior)} → Negociação. O histórico anterior foi preservado.`,
            }),
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    persist(next);
    setForm((current) => ({ ...current, etapa: "negociacao" }));
  };

  const oportunidadeAtual = oportunidades.find((item) => item.id === editandoId) || null;
  const atividadesAtuais = Array.isArray(oportunidadeAtual?.atividades)
    ? oportunidadeAtual.atividades
    : [];
  const historicoAtual = Array.isArray(oportunidadeAtual?.historico)
    ? oportunidadeAtual.historico
    : [];

  const adicionarAtividade = () => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para editar atividades desta oportunidade.");
      return;
    }

    if (!editandoId) {
      alert("Salve a oportunidade antes de cadastrar atividades.");
      return;
    }

    if (!atividadeForm.titulo.trim()) {
      alert("Informe o título da atividade.");
      return;
    }

    if (!atividadeForm.data) {
      alert("Informe a data da atividade.");
      return;
    }

    const novaAtividade = {
      id: uid(),
      tipo: atividadeForm.tipo,
      titulo: atividadeForm.titulo.trim(),
      data: atividadeForm.data,
      hora: atividadeForm.hora,
      observacao: atividadeForm.observacao.trim(),
      status: "pendente",
      criadoEm: new Date().toISOString(),
      concluidoEm: null,
    };

    const next = oportunidades.map((item) => {
      if (item.id !== editandoId) return item;

      const atividades = [...(Array.isArray(item.atividades) ? item.atividades : []), novaAtividade];
      const proxima = proximaAtividadeDaLista(atividades);

      return {
        ...item,
        atividades,
        proximaAtividade: proxima?.titulo || "",
        dataFollowup: proxima?.data || "",
        historico: registrarHistorico(item, {
          tipo: "atividade",
          titulo: "Atividade criada",
          descricao: `${TIPOS_ATIVIDADE.find((tipo) => tipo.id === novaAtividade.tipo)?.nome || "Atividade"}: ${novaAtividade.titulo}`,
        }),
        updatedAt: new Date().toISOString(),
      };
    });

    persist(next);
    setForm((current) => {
      const atualizado = next.find((item) => item.id === editandoId);
      return {
        ...current,
        proximaAtividade: atualizado?.proximaAtividade || "",
        dataFollowup: atualizado?.dataFollowup || "",
      };
    });
    setAtividadeForm(emptyAtividade);
  };

  const concluirAtividade = (atividadeId) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para editar atividades desta oportunidade.");
      return;
    }

    const next = oportunidades.map((item) => {
      if (item.id !== editandoId) return item;

      const atividade = (item.atividades || []).find((a) => a.id === atividadeId);
      const atividades = (item.atividades || []).map((a) =>
        a.id === atividadeId
          ? { ...a, status: "concluida", concluidoEm: new Date().toISOString() }
          : a
      );
      const proxima = proximaAtividadeDaLista(atividades);

      return {
        ...item,
        atividades,
        proximaAtividade: proxima?.titulo || "",
        dataFollowup: proxima?.data || "",
        historico: registrarHistorico(item, {
          tipo: "atividade_concluida",
          titulo: "Atividade concluída",
          descricao: atividade?.titulo || "Atividade concluída",
        }),
        updatedAt: new Date().toISOString(),
      };
    });

    persist(next);
    const atualizado = next.find((item) => item.id === editandoId);
    setForm((current) => ({
      ...current,
      proximaAtividade: atualizado?.proximaAtividade || "",
      dataFollowup: atualizado?.dataFollowup || "",
    }));
  };

  const excluirAtividade = (atividadeId) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para editar atividades desta oportunidade.");
      return;
    }

    const next = oportunidades.map((item) => {
      if (item.id !== editandoId) return item;
      const removida = (item.atividades || []).find((a) => a.id === atividadeId);
      const atividades = (item.atividades || []).filter((a) => a.id !== atividadeId);
      const proxima = proximaAtividadeDaLista(atividades);

      return {
        ...item,
        atividades,
        proximaAtividade: proxima?.titulo || "",
        dataFollowup: proxima?.data || "",
        historico: registrarHistorico(item, {
          tipo: "atividade_excluida",
          titulo: "Atividade removida",
          descricao: removida?.titulo || "Atividade removida",
        }),
        updatedAt: new Date().toISOString(),
      };
    });

    persist(next);
  };

  const dadosRelatorio = useMemo(() => {
    if (visao !== "relatorios") {
      return {
        base: [], ganhos: [], perdidos: [], abertas: [],
        conversao: 0, mensalGanho: 0, pipeline: 0, ticket: 0,
        porEtapa: [], origens: [], perdas: [],
      };
    }

    const agora = new Date();
    const inicio = new Date();
    if (periodoRelatorio === "30") inicio.setDate(agora.getDate() - 30);
    if (periodoRelatorio === "90") inicio.setDate(agora.getDate() - 90);
    if (periodoRelatorio === "ano") inicio.setMonth(0, 1);

    const base = oportunidades.filter((item) => {
      if (periodoRelatorio === "todos") return true;
      const data = new Date(item.createdAt || item.updatedAt || 0);
      return data >= inicio && data <= agora;
    });

    const ganhos = base.filter((item) => item.etapa === "ganho");
    const perdidos = base.filter((item) => item.etapa === "perdido");
    const abertas = base.filter((item) => !["ganho", "perdido"].includes(item.etapa));
    const encerradas = ganhos.length + perdidos.length;
    const conversao = encerradas ? (ganhos.length / encerradas) * 100 : 0;
    const mensalGanho = ganhos.reduce((soma, item) => soma + Number(item.valorMensal || 0), 0);
    const pipeline = abertas.reduce((soma, item) => soma + Number(item.valorMensal || 0), 0);
    const ticket = ganhos.length ? mensalGanho / ganhos.length : 0;

    const porEtapa = ETAPAS.map((etapa) => {
      const itens = base.filter((item) => item.etapa === etapa.id);
      return {
        ...etapa,
        quantidade: itens.length,
        valor: itens.reduce((soma, item) => soma + Number(item.valorMensal || 0), 0),
      };
    });

    const origens = Object.entries(
      base.reduce((acc, item) => {
        const origem = item.origem?.trim() || "Não informada";
        acc[origem] = (acc[origem] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]);

    const perdas = Object.entries(
      perdidos.reduce((acc, item) => {
        const motivo = item.motivoPerda?.trim() || "Não informado";
        acc[motivo] = (acc[motivo] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]);

    return { base, ganhos, perdidos, abertas, conversao, mensalGanho, pipeline, ticket, porEtapa, origens, perdas };
  }, [oportunidades, periodoRelatorio, visao]);

  const exportarExcelCRM = async () => {
    const linhas = dadosRelatorio.base.map((item) => ({
      Cliente: item.cliente || "",
      "CPF/CNPJ": formatDocumento(item.documento),
      Etapa: etapaNome(item.etapa),
      Origem: item.origem || "",
      "Valor mensal": Number(item.valorMensal || 0),
      Contato: item.contato || "",
      Email: item.email || "",
      Telefone: item.telefone || "",
      "Próxima atividade": item.proximaAtividade || "",
      "Data follow-up": item.dataFollowup || "",
      "Motivo perda": item.motivoPerda || "",
    }));

    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(linhas);
    XLSX.utils.book_append_sheet(workbook, worksheet, "CRM");
    XLSX.writeFile(workbook, `relatorio-crm-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportarPdfCRM = async () => {
    const [{ default: jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const autoTable =
      autoTableModule.default || autoTableModule.autoTable || autoTableModule;

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Relatório Comercial - PrecificaCont", 14, 16);
    doc.setFontSize(9);
    doc.text(
      `Pipeline: ${money(dadosRelatorio.pipeline)} | Mensal ganho: ${money(dadosRelatorio.mensalGanho)} | Conversão: ${dadosRelatorio.conversao.toFixed(1)}%`,
      14,
      23
    );

    autoTable(doc, {
      startY: 29,
      head: [["Cliente", "Etapa", "Origem", "Mensal", "Próxima atividade", "Follow-up"]],
      body: dadosRelatorio.base.map((item) => [
        item.cliente || "",
        etapaNome(item.etapa),
        item.origem || "",
        money(item.valorMensal),
        item.proximaAtividade || "",
        formatDate(item.dataFollowup),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save(`relatorio-crm-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!permissoesModulo.carregando && !permissoesModulo.pode_visualizar) {
    return (
      <div className="min-h-full bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">CRM Comercial</h2>
          <p className="mt-2 text-sm text-slate-600">
            Seu perfil não possui permissão para visualizar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-comercial min-h-screen bg-slate-50 p-7">
      <style>{CRM_DARK_CSS}</style>
      <div className="max-w-[1800px] mx-auto">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
          <div>
            <p className="text-xs font-bold tracking-wide text-blue-600 uppercase">
              Comercial
            </p>

            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              CRM Comercial
            </h1>

            <p className="text-slate-500 mt-2">
              Pipeline, oportunidades, follow-ups e acompanhamento das
              negociações.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVisao(visao === "relatorios" ? "kanban" : "relatorios")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold shadow-sm transition ${
                visao === "relatorios"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {visao === "relatorios" ? <ArrowLeft size={18} /> : <BarChart3 size={18} />}
              {visao === "relatorios" ? "Voltar ao Kanban" : "Relatórios"}
            </button>

            {permissoesModulo.pode_criar ? (
              <button
                type="button"
                onClick={abrirNova}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                <Plus size={18} />
                Nova oportunidade
              </button>
            ) : null}
          </div>
        </div>


        {visao === "kanban" ? (
          <>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-7">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Oportunidades abertas</p>
              <Users size={19} className="text-blue-600" />
            </div>

            <p className="text-2xl font-bold text-slate-900 mt-3">
              {indicadores.abertas}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Negociações em andamento
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Pipeline mensal</p>
              <DollarSign size={19} className="text-blue-600" />
            </div>

            <p className="text-2xl font-bold text-slate-900 mt-3">
              {money(indicadores.pipeline)}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Receita mensal potencial
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Follow-ups vencidos</p>
              <CalendarClock size={19} className="text-amber-500" />
            </div>

            <p className="text-2xl font-bold text-slate-900 mt-3">
              {indicadores.followups}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Atividades para atenção
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Mensal ganho</p>
              <Trophy size={19} className="text-emerald-600" />
            </div>

            <p className="text-2xl font-bold text-slate-900 mt-3">
              {money(indicadores.mensalGanho)}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              {indicadores.ganhos} oportunidade(s) ganha(s)
            </p>
          </div>
        </div>

        <div className="mt-5 bg-white border border-slate-200 rounded-2xl p-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar cliente, CNPJ/CPF, contato, proposta ou origem..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto pb-5">
          <div className="flex gap-4 min-w-max items-start">
            {ETAPAS.map((etapa) => {
              const cards = oportunidadesFiltradas.filter(
                (item) => item.etapa === etapa.id
              );

              const total = cards.reduce(
                (acc, item) => acc + Number(item.valorMensal || 0),
                0
              );

              return (
                <div
                  key={etapa.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => soltarNaEtapa(event, etapa.id)}
                  className={`w-[290px] shrink-0 rounded-2xl bg-slate-100 border transition-colors ${
                    draggingId
                      ? "border-blue-200"
                      : "border-slate-200"
                  }`}
                >
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                            etapa.id === "ganho"
                              ? "bg-emerald-500"
                              : etapa.id === "perdido"
                              ? "bg-rose-500"
                              : etapa.id === "proposta_enviada"
                              ? "bg-violet-500"
                              : etapa.id === "negociacao"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        />

                        <p className="font-semibold text-slate-800 truncate">
                          {etapa.nome}
                        </p>
                      </div>

                      <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        {cards.length}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2">
                      {money(total)} / mês
                    </p>
                  </div>

                  <div
                    className="p-3 space-y-3 min-h-[180px] max-h-[calc(100vh-390px)] overflow-y-auto overscroll-contain"
                    style={{ scrollbarGutter: "stable" }}
                  >
                    {cards.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                        <p className="text-xs text-slate-400">
                          Nenhuma oportunidade
                        </p>
                      </div>
                    ) : (
                      cards.map((oportunidade) => (
                        <CRMCard
                          key={oportunidade.id}
                          oportunidade={oportunidade}
                          onOpen={abrirEdicao}
                          onDragStart={iniciarArraste}
                        />
                      ))
                    )}

                    {permissoesModulo.pode_criar ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoId(null);
                          setForm({
                            ...emptyForm,
                            etapa: etapa.id,
                          });
                          setModalOpen(true);
                        }}
                        className="w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-500 hover:bg-white hover:text-blue-600"
                      >
                        + Adicionar oportunidade
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

          </>
        ) : (
          <div className="mt-7 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Relatório Comercial</h2>
                <p className="text-sm text-slate-500 mt-1">Visão operacional do pipeline e dos resultados do CRM.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={periodoRelatorio}
                  onChange={(event) => setPeriodoRelatorio(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600"
                >
                  <option value="todos">Todo o período</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                  <option value="ano">Ano atual</option>
                </select>
                <button type="button" onClick={exportarExcelCRM} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Download size={16} /> Excel
                </button>
                <button type="button" onClick={exportarPdfCRM} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Download size={16} /> PDF
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {[
                ["Pipeline", money(dadosRelatorio.pipeline), `${dadosRelatorio.abertas.length} abertas`, TrendingUp, "text-blue-600"],
                ["Mensal ganho", money(dadosRelatorio.mensalGanho), `${dadosRelatorio.ganhos.length} ganhas`, Trophy, "text-emerald-600"],
                ["Conversão", `${dadosRelatorio.conversao.toFixed(1)}%`, "ganhos sobre encerradas", Target, "text-violet-600"],
                ["Ticket médio", money(dadosRelatorio.ticket), "oportunidades ganhas", DollarSign, "text-amber-600"],
                ["Perdidas", dadosRelatorio.perdidos.length, "oportunidades perdidas", AlertTriangle, "text-rose-600"],
              ].map(([titulo, valor, legenda, Icone, cor]) => (
                <div key={titulo} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{titulo}</p>
                    <Icone size={18} className={cor} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-3">{valor}</p>
                  <p className="text-xs text-slate-400 mt-1">{legenda}</p>
                </div>
              ))}
            </div>

            <div className="grid xl:grid-cols-2 gap-5">
              <section className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="font-bold text-slate-900">Funil por etapa</h3>
                <p className="text-xs text-slate-400 mt-1">Quantidade e valor mensal em cada estágio.</p>
                <div className="mt-5 space-y-4">
                  {dadosRelatorio.porEtapa.map((etapa) => {
                    const max = Math.max(1, ...dadosRelatorio.porEtapa.map((item) => item.quantidade));
                    return (
                      <div key={etapa.id}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-semibold text-slate-700">{etapa.nome}</span>
                          <span className="text-slate-500">{etapa.quantidade} • {money(etapa.valor)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${(etapa.quantidade / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="font-bold text-slate-900">Origem das oportunidades</h3>
                <p className="text-xs text-slate-400 mt-1">Canais que estão alimentando o pipeline.</p>
                <div className="mt-5 space-y-3">
                  {dadosRelatorio.origens.length ? dadosRelatorio.origens.slice(0, 8).map(([origem, quantidade]) => (
                    <div key={origem} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <span className="text-sm font-semibold text-slate-700">{origem}</span>
                      <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">{quantidade}</span>
                    </div>
                  )) : <p className="text-sm text-slate-400">Nenhuma origem registrada.</p>}
                </div>
              </section>
            </div>

            <div className="grid xl:grid-cols-[.75fr_1.25fr] gap-5">
              <section className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="font-bold text-slate-900">Motivos de perda</h3>
                <div className="mt-4 space-y-3">
                  {dadosRelatorio.perdas.length ? dadosRelatorio.perdas.map(([motivo, quantidade]) => (
                    <div key={motivo} className="flex items-start justify-between gap-3 rounded-xl bg-rose-50/60 px-4 py-3">
                      <span className="text-sm text-slate-700">{motivo}</span>
                      <span className="text-xs font-bold text-rose-600">{quantidade}</span>
                    </div>
                  )) : <p className="text-sm text-slate-400">Nenhuma perda registrada no período.</p>}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900">Negociações detalhadas</h3>
                  <p className="text-xs text-slate-400 mt-1">{dadosRelatorio.base.length} oportunidade(s) no período.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="text-left px-5 py-3 font-semibold">Cliente</th>
                        <th className="text-left px-5 py-3 font-semibold">Etapa</th>
                        <th className="text-left px-5 py-3 font-semibold">Origem</th>
                        <th className="text-right px-5 py-3 font-semibold">Mensal</th>
                        <th className="text-left px-5 py-3 font-semibold">Próxima ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosRelatorio.base.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="px-5 py-3 font-semibold text-slate-800">{item.cliente}</td>
                          <td className="px-5 py-3 text-slate-600">{etapaNome(item.etapa)}</td>
                          <td className="px-5 py-3 text-slate-500">{item.origem || "—"}</td>
                          <td className="px-5 py-3 text-right font-semibold text-slate-700">{money(item.valorMensal)}</td>
                          <td className="px-5 py-3 text-slate-500">{item.proximaAtividade || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[94vh] overflow-hidden bg-white rounded-3xl shadow-2xl border border-white/70">
            <form onSubmit={salvarOportunidade} className="flex flex-col max-h-[94vh]">
              <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-7 py-6 text-white">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                      <Building2 size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
                        Oportunidade comercial
                      </p>
                      <h2 className="text-2xl font-bold mt-1 truncate">
                        {form.cliente || (editandoId ? "Oportunidade" : "Nova oportunidade")}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-300">
                        <span>{formatDocumento(form.documento) || "Documento não informado"}</span>
                        {editandoId ? <span>•</span> : null}
                        {editandoId ? <span>{money(currencyToNumber(form.valorMensal))}/mês</span> : null}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={fecharModal}
                    className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-white shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-1">
                  {ETAPAS.filter((etapa) => !["perdido"].includes(etapa.id)).map((etapa, index) => {
                    const atual = ETAPAS.findIndex((item) => item.id === form.etapa);
                    const indice = ETAPAS.findIndex((item) => item.id === etapa.id);
                    const ativo = form.etapa === etapa.id;
                    const passou = atual > indice && form.etapa !== "perdido";

                    return (
                      <button
                        key={etapa.id}
                        type="button"
                        onClick={() => setField("etapa", etapa.id)}
                        className={`whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-semibold transition ${
                          ativo
                            ? "bg-blue-600 text-white"
                            : passou
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="mr-1.5 opacity-70">{index + 1}</span>
                        {etapa.nome}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-b border-slate-200 px-7 bg-white">
                <div className="flex gap-6 overflow-x-auto">
                  {[
                    ["geral", "Visão geral"],
                    ["atividades", "Atividades"],
                    ["historico", "Histórico"],
                    ["proposta", "Proposta"],
                  ].map(([id, nome]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAbaModal(id)}
                      className={`py-4 text-sm font-semibold border-b-2 whitespace-nowrap ${
                        abaModal === id
                          ? "border-blue-600 text-blue-700"
                          : "border-transparent text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {nome}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto flex-1 bg-slate-50 dark:bg-[#07111f]">
                {abaModal === "geral" ? (
                  <div className="p-7 grid lg:grid-cols-[1.35fr_.65fr] gap-6">
                    <div className="space-y-5">
                      <section className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-5">
                          <Building2 size={17} className="text-blue-600" />
                          <h3 className="font-bold text-slate-900">Dados da oportunidade</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-600">CPF / CNPJ</label>
                            <input
                              inputMode="numeric"
                              value={form.documento}
                              onChange={(event) => setField("documento", formatDocumento(event.target.value))}
                              onBlur={(event) => consultarCNPJCRM(event.target.value)}
                              placeholder="000.000.000-00 ou 00.000.000/0000-00"
                              className={`mt-1.5 w-full rounded-xl border px-3.5 py-3 text-sm outline-none focus:ring-2 ${
                                documentStatus(form.documento).state === "invalid"
                                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                                  : documentStatus(form.documento).state === "valid"
                                  ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                                  : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                              }`}
                            />
                            {form.documento ? (
                              <p className={`mt-1.5 text-[11px] font-medium ${
                                documentStatus(form.documento).state === "valid"
                                  ? "text-emerald-600"
                                  : documentStatus(form.documento).state === "invalid"
                                  ? "text-rose-600"
                                  : "text-amber-600"
                              }`}>
                                {documentStatus(form.documento).state === "valid" ? "✓ " : ""}
                                {documentStatus(form.documento).label}
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600">Empresa / cliente *</label>
                            <input
                              value={form.cliente}
                              onChange={(event) => setField("cliente", event.target.value)}
                              placeholder="Preenchido automaticamente pelo CNPJ"
                              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600">Contato</label>
                            <input
                              value={form.contato}
                              onChange={(event) => setField("contato", event.target.value)}
                              placeholder="Nome do contato"
                              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600">Valor mensal</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={form.valorMensal}
                              onChange={(event) => setField("valorMensal", handleCurrencyTyping(event.target.value))}
                              placeholder="R$ 0,00"
                              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600">E-mail</label>
                            <div className="relative mt-1.5">
                              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="email"
                                value={form.email}
                                onChange={(event) => setField("email", event.target.value)}
                                placeholder="cliente@empresa.com.br"
                                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600">Telefone / WhatsApp</label>
                            <div className="relative mt-1.5">
                              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                value={form.telefone}
                                onChange={(event) => setField("telefone", event.target.value)}
                                placeholder="(11) 99999-9999"
                                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600">Origem</label>
                            <input
                              value={form.origem}
                              onChange={(event) => setField("origem", event.target.value)}
                              placeholder="Ex.: Tráfego pago, indicação..."
                              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600">Etapa atual</label>
                            <select
                              value={form.etapa}
                              onChange={(event) => setField("etapa", event.target.value)}
                              disabled={!permissoesModulo.pode_editar}
                              className={`mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                                !permissoesModulo.pode_editar ? "cursor-not-allowed bg-slate-50 text-slate-500" : ""
                              }`}
                            >
                              {ETAPAS.map((etapa) => (
                                <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </section>

                      <section className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <MessageSquareText size={17} className="text-blue-600" />
                          <h3 className="font-bold text-slate-900">Observações comerciais</h3>
                        </div>
                        <div className="relative">
                          <textarea
                            rows={6}
                            value={form.observacoes}
                            onChange={(event) => setField("observacoes", event.target.value)}
                            placeholder="Registre contexto, necessidades do cliente, objeções, acordos e informações importantes da negociação..."
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-3 pr-14 text-sm outline-none resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            type="button"
                            onClick={() => gravandoCampo === "observacoes" ? pararDitado() : iniciarDitado("observacoes")}
                            title={gravandoCampo === "observacoes" ? "Parar ditado" : "Ditar observação"}
                            className={`absolute right-3 top-3 h-9 w-9 rounded-xl flex items-center justify-center transition ${
                              gravandoCampo === "observacoes"
                                ? "bg-rose-600 text-white animate-pulse"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            }`}
                          >
                            {gravandoCampo === "observacoes" ? <MicOff size={17} /> : <Mic size={17} />}
                          </button>
                        </div>
                        <p className={`mt-2 text-[11px] ${gravandoCampo === "observacoes" ? "font-semibold text-rose-600" : "text-slate-400"}`}>
                          {gravandoCampo === "observacoes"
                            ? "Ouvindo... fale normalmente. Clique novamente no microfone para parar."
                            : "Você pode digitar ou usar o microfone para transformar sua fala em texto."}
                        </p>
                      </section>
                    </div>

                    <div className="space-y-5">
                      <section className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <CalendarClock size={17} className="text-blue-600" />
                          <h3 className="font-bold text-slate-900">Próxima ação</h3>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                          <p className="text-sm font-bold text-slate-800">{form.proximaAtividade || "Nenhuma atividade pendente"}</p>
                          <p className="text-xs text-slate-500 mt-1">{form.dataFollowup ? formatDate(form.dataFollowup) : "Cadastre uma atividade na aba Atividades."}</p>
                        </div>
                        <button type="button" onClick={() => setAbaModal("atividades")} className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700">
                          Gerenciar atividades →
                        </button>
                      </section>

                      <section className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText size={17} className="text-violet-600" />
                          <h3 className="font-bold text-slate-900">Proposta</h3>
                        </div>
                        <select
                          value={form.proposta}
                          onChange={(event) => setField("proposta", event.target.value)}
                          disabled={!permissoesModulo.pode_editar}
                          className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                            !permissoesModulo.pode_editar ? "cursor-not-allowed bg-slate-50 text-slate-500" : ""
                          }`}
                        >
                          <option value="">Nenhuma proposta vinculada</option>
                          {propostasDisponiveis.map((proposta) => {
                            const numero = numeroDaProposta(proposta);
                            return (
                              <option key={String(numero)} value={String(numero)}>
                                {numero} • {clienteDaProposta(proposta) || "Cliente sem nome"}
                              </option>
                            );
                          })}
                        </select>

                        {propostaVinculada ? (
                          <div className="mt-3 grid gap-2">
                            <button
                              type="button"
                              onClick={() => abrirPropostaInterna(propostaVinculada)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 dark:text-white"
                            >
                              <ExternalLink size={16} /> Abrir proposta
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const oportunidade = oportunidades.find(
                                  (item) => item.id === editandoId
                                );
                                if (oportunidade) {
                                  abrirCompartilhamentoCRM({
                                    ...oportunidade,
                                    proposta: form.proposta,
                                  });
                                }
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
                            >
                              <Send size={16} /> Compartilhar proposta
                            </button>
                          </div>
                        ) : editandoId && permissoesModulo.pode_editar ? (
                          <button
                            type="button"
                            onClick={() => {
                              const oportunidade = oportunidades.find(
                                (item) => item.id === editandoId
                              );
                              if (oportunidade) gerarPropostaDoCRM(oportunidade);
                            }}
                            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
                          >
                            <FileText size={16} /> Gerar proposta
                          </button>
                        ) : null}

                        <p className="mt-2 text-[11px] text-slate-400">
                          {propostaVinculada
                            ? "Abra a proposta completa ou compartilhe com o cliente."
                            : "Selecione uma proposta existente ou gere uma nova a partir desta oportunidade."}
                        </p>
                      </section>

                      {editandoId && permissoesModulo.pode_editar ? (
                        <section className="bg-slate-950 rounded-2xl p-5 text-white">
                          <p className="text-[11px] uppercase tracking-wide font-bold text-slate-400">Ações comerciais</p>
                          <div className="grid gap-2 mt-4">
                            {["ganho", "perdido"].includes(form.etapa) ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const oportunidade = oportunidades.find((item) => item.id === editandoId);
                                  if (oportunidade) reabrirOportunidade(oportunidade);
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400"
                              >
                                <RotateCcw size={16} /> Reabrir oportunidade
                              </button>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const oportunidade = oportunidades.find((item) => item.id === editandoId);
                                    if (oportunidade) {
                                      ganharOportunidade(oportunidade);
                                      fecharModal();
                                    }
                                  }}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold hover:bg-emerald-500"
                                >
                                  <CheckCircle2 size={16} /> Ganhar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const oportunidade = oportunidades.find((item) => item.id === editandoId);
                                    if (oportunidade) {
                                      perderOportunidade(oportunidade);
                                      fecharModal();
                                    }
                                  }}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-3 text-sm font-semibold hover:bg-rose-500"
                                >
                                  <XCircle size={16} /> Perder
                                </button>
                              </div>
                            )}
                          </div>
                        </section>
                      ) : null}
                    </div>
                  </div>
                ) : abaModal === "atividades" ? (
                  <div className="p-7 grid lg:grid-cols-[.78fr_1.22fr] gap-6">
                    <section className="bg-white border border-slate-200 rounded-2xl p-5 h-fit">
                      <div className="flex items-center gap-2">
                        <Plus size={17} className="text-blue-600" />
                        <h3 className="font-bold text-slate-900">Nova atividade</h3>
                      </div>
                      {!editandoId ? (
                        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
                          Salve a oportunidade primeiro para registrar atividades.
                        </div>
                      ) : (
                        <div className="mt-5 space-y-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-600">Tipo</label>
                            <select
                              value={atividadeForm.tipo}
                              onChange={(event) => setAtividadeForm((current) => ({ ...current, tipo: event.target.value }))}
                              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            >
                              {TIPOS_ATIVIDADE.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600">Atividade *</label>
                            <input
                              value={atividadeForm.titulo}
                              onChange={(event) => setAtividadeForm((current) => ({ ...current, titulo: event.target.value }))}
                              placeholder="Ex.: Retornar proposta"
                              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-slate-600">Data *</label>
                              <input type="date" value={atividadeForm.data} onChange={(event) => setAtividadeForm((current) => ({ ...current, data: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm dark:[color-scheme:dark]" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-600">Hora</label>
                              <input type="time" value={atividadeForm.hora} onChange={(event) => setAtividadeForm((current) => ({ ...current, hora: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm dark:[color-scheme:dark]" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600">Observação</label>
                            <div className="relative mt-1.5">
                              <textarea
                                rows={4}
                                value={atividadeForm.observacao}
                                onChange={(event) => setAtividadeForm((current) => ({ ...current, observacao: event.target.value }))}
                                placeholder="Contexto da atividade..."
                                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 pr-14 text-sm resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              />
                              <button
                                type="button"
                                onClick={() => gravandoCampo === "atividade" ? pararDitado() : iniciarDitado("atividade")}
                                title={gravandoCampo === "atividade" ? "Parar ditado" : "Ditar observação da atividade"}
                                className={`absolute right-3 top-3 h-9 w-9 rounded-xl flex items-center justify-center transition ${
                                  gravandoCampo === "atividade"
                                    ? "bg-rose-600 text-white animate-pulse"
                                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                }`}
                              >
                                {gravandoCampo === "atividade" ? <MicOff size={17} /> : <Mic size={17} />}
                              </button>
                            </div>
                            <p className={`mt-1.5 text-[11px] ${gravandoCampo === "atividade" ? "font-semibold text-rose-600" : "text-slate-400"}`}>
                              {gravandoCampo === "atividade" ? "Ouvindo..." : "Digite ou use o microfone."}
                            </p>
                          </div>
                          <button type="button" onClick={adicionarAtividade} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                            <Plus size={16} /> Adicionar atividade
                          </button>
                        </div>
                      )}
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">Agenda comercial</h3>
                          <p className="text-xs text-slate-400 mt-1">Pendências e atividades concluídas desta oportunidade.</p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {atividadesAtuais.filter((a) => a.status !== "concluida").length} pendente(s)
                        </span>
                      </div>

                      <div className="mt-5 space-y-3">
                        {atividadesAtuais.length ? [...atividadesAtuais].sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`)).map((atividade) => {
                          const concluida = atividade.status === "concluida";
                          const vencida = !concluida && atividade.data && new Date(`${atividade.data}T${atividade.hora || "23:59"}`).getTime() < Date.now();
                          return (
                            <div key={atividade.id} className={`rounded-2xl border p-4 ${concluida ? "border-slate-200 bg-slate-50" : vencida ? "border-rose-200 bg-rose-50/50" : "border-blue-100 bg-blue-50/40"}`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-wide font-bold text-blue-600">{TIPOS_ATIVIDADE.find((tipo) => tipo.id === atividade.tipo)?.nome || "Atividade"}</span>
                                    {vencida ? <span className="text-[10px] font-bold text-rose-600">VENCIDA</span> : null}
                                    {concluida ? <span className="text-[10px] font-bold text-emerald-600">CONCLUÍDA</span> : null}
                                  </div>
                                  <p className={`font-bold mt-1 ${concluida ? "text-slate-400 line-through" : "text-slate-900"}`}>{atividade.titulo}</p>
                                  <p className="text-xs text-slate-500 mt-1">{formatDate(atividade.data)}{atividade.hora ? ` às ${atividade.hora}` : ""}</p>
                                  {atividade.observacao ? <p className="text-sm text-slate-600 mt-3">{atividade.observacao}</p> : null}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {permissoesModulo.pode_editar && !concluida ? (
                                    <button type="button" onClick={() => concluirAtividade(atividade.id)} title="Concluir atividade" className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center">
                                      <Check size={16} />
                                    </button>
                                  ) : null}
                                  {permissoesModulo.pode_editar ? (
                                    <button type="button" onClick={() => excluirAtividade(atividade.id)} title="Excluir atividade" className="h-9 w-9 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center">
                                      <Trash2 size={15} />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="rounded-xl bg-slate-50 border border-dashed border-slate-300 p-8 text-center">
                            <ListTodo size={24} className="mx-auto text-slate-300" />
                            <p className="text-sm font-semibold text-slate-500 mt-3">Nenhuma atividade registrada</p>
                            <p className="text-xs text-slate-400 mt-1">Cadastre o próximo contato comercial ao lado.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                ) : abaModal === "historico" ? (
                  <div className="p-7">
                    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3">
                        <Clock3 className="text-blue-600" size={20} />
                        <div>
                          <h3 className="font-bold text-slate-900">Histórico da oportunidade</h3>
                          <p className="text-sm text-slate-500 mt-1">Linha do tempo automática da negociação.</p>
                        </div>
                      </div>

                      <div className="mt-6">
                        {historicoAtual.length ? (
                          <div className="relative border-l border-slate-200 ml-3 space-y-6">
                            {historicoAtual.map((evento) => (
                              <div key={evento.id} className="relative pl-7">
                                <span className="absolute -left-[6px] top-1.5 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                                <p className="text-sm font-bold text-slate-800">{evento.titulo}</p>
                                <p className="text-sm text-slate-500 mt-1">{evento.descricao}</p>
                                <p className="text-[11px] text-slate-400 mt-1.5">{formatDateTime(evento.criadoEm)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl bg-slate-50 border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
                            O histórico começará a ser registrado nas próximas ações desta oportunidade.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-7">
                    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3">
                        <FileText className="text-violet-600" size={20} />
                        <div>
                          <h3 className="font-bold text-slate-900">Proposta comercial</h3>
                          <p className="text-sm text-slate-500 mt-1">A proposta vinculada ficará disponível aqui com status, visualizações, aceite e acesso rápido.</p>
                        </div>
                      </div>
                      {propostaVinculada ? (
                        <div className="mt-5 space-y-4">
                          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs text-violet-500 dark:text-white font-semibold">PROPOSTA VINCULADA</p>
                                <p className="font-bold text-violet-900 dark:text-white mt-1">{numeroDaProposta(propostaVinculada)}</p>
                                <p className="text-xs text-violet-700 dark:text-white mt-1">{clienteDaProposta(propostaVinculada) || form.cliente}</p>
                              </div>
                              <FileText size={20} className="text-violet-500 dark:text-white" />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => abrirPropostaPublica(propostaVinculada)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <ExternalLink size={16} /> Abrir link
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const oportunidade = oportunidades.find((item) => item.id === editandoId);
                                if (oportunidade) abrirCompartilhamentoCRM({ ...oportunidade, proposta: form.proposta });
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
                            >
                              <MessageCircle size={16} /> WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const oportunidade = oportunidades.find((item) => item.id === editandoId);
                                if (oportunidade) abrirCompartilhamentoCRM({ ...oportunidade, proposta: form.proposta });
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
                            >
                              <Mail size={16} /> E-mail
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-xl bg-slate-50 border border-dashed border-slate-300 p-6 text-center">
                          <p className="text-sm font-semibold text-slate-600">Nenhuma proposta vinculada.</p>
                          <p className="text-xs text-slate-400 mt-1">Vincule uma proposta na Visão geral para liberar o link e os canais de compartilhamento.</p>
                          <button
                            type="button"
                            onClick={() => setAbaModal("geral")}
                            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            Vincular proposta
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border-t border-slate-200 px-7 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  {editandoId && permissoesModulo.pode_excluir ? (
                    <button
                      type="button"
                      onClick={excluirOportunidade}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={16} /> Excluir oportunidade
                    </button>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  {((editandoId && permissoesModulo.pode_editar) ||
                    (!editandoId && permissoesModulo.pode_criar)) ? (
                    <button
                      type="submit"
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                    >
                      {editandoId ? "Salvar alterações" : "Criar oportunidade"}
                    </button>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {compartilhando ? (
        <div className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <Send size={18} className="text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Compartilhar proposta
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Escolha o canal para enviar o link público ao cliente.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharCompartilhamentoCRM}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center"
                aria-label="Fechar compartilhamento"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5">
              <label className="text-xs font-semibold text-slate-500">
                Link público
              </label>

              <div className="mt-2 flex items-center gap-2">
                <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-600 break-all">
                  {compartilhando.link}
                </div>

                <button
                  type="button"
                  onClick={() => abrirPropostaPublica(compartilhando.proposta)}
                  title="Abrir link público"
                  className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-center"
                >
                  <ExternalLink size={16} />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={enviarCompartilhamentoWhatsApp}
                  className="group rounded-xl border border-emerald-500 bg-emerald-500 px-4 py-3.5 text-left text-white shadow-sm hover:bg-emerald-600 hover:border-emerald-600 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 flex items-center justify-center text-white">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-10 w-10"
                        aria-hidden="true"
                      >
                        <path
                          fill="currentColor"
                          d="M16.75 13.96c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.13.16 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28ZM12.04 21.5h-.01a9.47 9.47 0 0 1-4.83-1.32l-.35-.21-3.59.94.96-3.5-.23-.36A9.42 9.42 0 0 1 2.54 12c0-5.22 4.25-9.47 9.48-9.47a9.4 9.4 0 0 1 6.7 2.78A9.4 9.4 0 0 1 21.5 12c0 5.23-4.25 9.48-9.46 9.5Zm8.06-17.07A11.33 11.33 0 0 0 12.02 1.1C5.75 1.1.65 6.2.65 12.47c0 2 .52 3.95 1.51 5.66L.55 24l6.01-1.58a11.35 11.35 0 0 0 5.46 1.39h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.9-3.3-8.01Z"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-white">
                        Enviar por WhatsApp
                      </div>
                      <div className="text-xs text-emerald-50 mt-0.5">
                        Abrir com a mensagem pronta
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={enviarCompartilhamentoEmail}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-left hover:bg-blue-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                      <Mail size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-blue-900">
                        Enviar por e-mail
                      </div>
                      <div className="text-xs text-blue-700 mt-0.5">
                        Abrir seu aplicativo de e-mail
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-200">
                  <div className="text-xs font-bold text-slate-700">
                    Mensagem sugerida
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Edite o texto para este envio ou salve como padrão.
                  </div>
                </div>

                <div className="p-3.5">
                  <div className="rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-700">
                    Olá, {compartilhando.oportunidade.cliente || clienteDaProposta(compartilhando.proposta) || "cliente"}!
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      automático
                    </span>
                  </div>

                  <textarea
                    rows={5}
                    value={mensagemCompartilhamento}
                    onChange={(event) =>
                      setMensagemCompartilhamento(event.target.value)
                    }
                    className="mt-2.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-5 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="Edite o texto que acompanhará a proposta..."
                  />

                  <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Link automático
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        protegido
                      </span>
                    </div>
                    <div className="mt-1 break-all text-xs text-blue-700">
                      {compartilhando.link}
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-600">
                        Salvar como padrão
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Será usada nas próximas propostas.
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={salvarMensagemPadraoCRM}
                        className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Salvar
                      </button>

                      <button
                        type="button"
                        onClick={copiarMensagemCRM}
                        title="Copiar mensagem completa"
                        aria-label="Copiar mensagem completa"
                        className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-center"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <CheckCircle2 size={13} />
                Nome e link são automáticos e não podem ser alterados.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}