import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Calculator,
  Building2,
  CalendarDays,
  Users,
  FileText,
  TrendingUp,
  Trash2,
  History,
  Filter,
  Eye,
  X,
  Sparkles,
  GitBranch,
  PackagePlus,
  ReceiptText,
} from "lucide-react";
import { supabase } from "../supabase";
import SelectPrecificaCont from "../components/SelectPrecificaCont";

const STORAGE_KEY = "precificacont_simulacoes";

const ESCRITORIO_ATIVO_KEY = "precificacont_escritorio_ativo";

function getEscritorioAtivoId() {
  return localStorage.getItem(ESCRITORIO_ATIVO_KEY) || "";
}

function scopedStorageKey(baseKey) {
  const escritorioId = getEscritorioAtivoId();
  return escritorioId ? `${baseKey}:${escritorioId}` : baseKey;
}


const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const number = (value) =>
  Number(value || 0).toLocaleString("pt-BR");

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDocumentoProposta = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const STATUS = {
  rascunho: {
    label: "Rascunho",
    className:
      "bg-slate-100 text-slate-600 border-slate-200",
  },

  calculado: {
    label: "Calculado",
    className:
      "bg-blue-50 text-blue-700 border-blue-200",
  },

  aguardando_aprovacao: {
    label: "Aguardando aprovação",
    className:
      "bg-amber-50 text-amber-700 border-amber-200",
  },

  aprovado: {
    label: "Aprovado",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
  },

  proposta_gerada: {
    label: "Proposta gerada",
    className:
      "bg-violet-50 text-violet-700 border-violet-200",
  },

  fechado: {
    label: "Fechado",
    className:
      "bg-green-50 text-green-700 border-green-200",
  },

  perdido: {
    label: "Perdido",
    className:
      "bg-rose-50 text-rose-700 border-rose-200",
  },
};

function StatusBadge({ status }) {
  const info =
    STATUS[status] || STATUS.calculado;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${info.className}`}
    >
      {info.label}
    </span>
  );
}

function TipoBadge({ tipo }) {
  const detalhada = tipo === "detalhada";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        detalhada
          ? "bg-violet-50 text-violet-700 border-violet-200"
          : "bg-blue-50 text-blue-700 border-blue-200"
      }`}
    >
      {detalhada ? <GitBranch size={12} /> : <Sparkles size={12} />}
      {detalhada ? "Detalhada" : "Rápida"}
    </span>
  );
}

const getTipoSimulacao = (item) =>
  item.tipo_simulacao === "detalhada" ? "detalhada" : "rapida";

const getFiliais = (item) => {
  if (Array.isArray(item.filiais_detalhadas)) return item.filiais_detalhadas;
  if (Array.isArray(item?.estrutura?.filiais)) return item.estrutura.filiais;
  return [];
};

const getServicos = (item) =>
  Array.isArray(item.servicos_adicionais) ? item.servicos_adicionais : [];

const getMensalServicos = (item) => {
  if (item.valor_servicos_mensais != null) {
    return Number(item.valor_servicos_mensais || 0);
  }

  return getServicos(item)
    .filter((servico) => servico.recorrencia === "mensal")
    .reduce(
      (total, servico) =>
        total +
        Number(servico.valor_unitario || 0) *
          Number(servico.quantidade || 1),
      0
    );
};

const getPontualServicos = (item) => {
  if (item.valor_servicos_pontuais != null) {
    return Number(item.valor_servicos_pontuais || 0);
  }

  return getServicos(item)
    .filter((servico) => servico.recorrencia !== "mensal")
    .reduce(
      (total, servico) =>
        total +
        Number(servico.valor_unitario || 0) *
          Number(servico.quantidade || 1),
      0
    );
};

const getIndice = (item) =>
  Number(
    item.valor_negociado ||
      item.valor_tabela ||
      item.indice_precificacont ||
      0
  );

const getTotalMensal = (item) => {
  if (item.valor_total_mensal != null) {
    return Number(item.valor_total_mensal || 0);
  }

  return getIndice(item) + getMensalServicos(item);
};


const SIMULACOES_DARK_CSS = `
  html.dark .precificacont-simulacoes {
    background:
      radial-gradient(circle at 18% 0%, rgba(37, 99, 235, 0.10), transparent 30%),
      radial-gradient(circle at 88% 10%, rgba(20, 184, 166, 0.05), transparent 24%),
      #07101f !important;
    color: #e5edf8;
  }

  html.dark .precificacont-simulacoes [class*="bg-white"],
  html.dark .precificacont-simulacoes [class*="from-white"],
  html.dark .precificacont-simulacoes [class*="via-white"],
  html.dark .precificacont-simulacoes [class*="to-white"],
  html.dark .precificacont-simulacoes [class*="bg-slate-50"],
  html.dark .precificacont-simulacoes [class*="from-slate-50"],
  html.dark .precificacont-simulacoes [class*="via-slate-50"],
  html.dark .precificacont-simulacoes [class*="to-slate-50"] {
    background-color: #0c1a2f !important;
    --tw-gradient-from: #0d1c31 var(--tw-gradient-from-position) !important;
    --tw-gradient-to: #09172a var(--tw-gradient-to-position) !important;
    --tw-gradient-stops: var(--tw-gradient-from), #0b192c var(--tw-gradient-via-position), var(--tw-gradient-to) !important;
  }

  html.dark .precificacont-simulacoes [class*="border-slate"],
  html.dark .precificacont-simulacoes [class*="border-blue-100"] {
    border-color: rgba(96, 165, 250, 0.18) !important;
  }

  html.dark .precificacont-simulacoes .text-slate-950,
  html.dark .precificacont-simulacoes .text-slate-900,
  html.dark .precificacont-simulacoes .text-slate-800,
  html.dark .precificacont-simulacoes .text-slate-700 {
    color: #f8fafc !important;
  }

  html.dark .precificacont-simulacoes .text-slate-600 {
    color: #d2dceb !important;
  }

  html.dark .precificacont-simulacoes .text-slate-500,
  html.dark .precificacont-simulacoes .text-slate-400 {
    color: #9fb0c7 !important;
  }

  html.dark .precificacont-simulacoes .text-blue-600,
  html.dark .precificacont-simulacoes .text-blue-700 {
    color: #45a9ff !important;
  }

  html.dark .precificacont-simulacoes .text-violet-700 {
    color: #c4b5fd !important;
  }

  html.dark .precificacont-simulacoes .text-emerald-700,
  html.dark .precificacont-simulacoes .text-green-700 {
    color: #34d399 !important;
  }

  html.dark .precificacont-simulacoes .text-amber-700 {
    color: #fbbf24 !important;
  }

  html.dark .precificacont-simulacoes .text-rose-600,
  html.dark .precificacont-simulacoes .text-rose-700 {
    color: #fb7185 !important;
  }

  html.dark .precificacont-simulacoes input,
  html.dark .precificacont-simulacoes select,
  html.dark .precificacont-simulacoes textarea {
    background-color: #09172a !important;
    border-color: rgba(96, 165, 250, 0.22) !important;
    color: #f8fafc !important;
    caret-color: #60a5fa;
  }

  html.dark .precificacont-simulacoes input::placeholder,
  html.dark .precificacont-simulacoes textarea::placeholder {
    color: #64748b !important;
  }

  html.dark .precificacont-simulacoes select option {
    background: #09172a;
    color: #f8fafc;
  }

  html.dark .precificacont-simulacoes [class*="bg-blue-50"] {
    background-color: rgba(37, 99, 235, 0.17) !important;
  }

  html.dark .precificacont-simulacoes [class*="bg-violet-50"] {
    background-color: rgba(139, 92, 246, 0.16) !important;
  }

  html.dark .precificacont-simulacoes [class*="bg-emerald-50"],
  html.dark .precificacont-simulacoes [class*="bg-green-50"] {
    background-color: rgba(16, 185, 129, 0.15) !important;
  }

  html.dark .precificacont-simulacoes [class*="bg-amber-50"] {
    background-color: rgba(245, 158, 11, 0.15) !important;
  }

  html.dark .precificacont-simulacoes [class*="bg-rose-50"] {
    background-color: rgba(244, 63, 94, 0.14) !important;
  }

  html.dark .precificacont-simulacoes table,
  html.dark .precificacont-simulacoes thead,
  html.dark .precificacont-simulacoes tbody,
  html.dark .precificacont-simulacoes tr,
  html.dark .precificacont-simulacoes td,
  html.dark .precificacont-simulacoes th {
    border-color: rgba(96, 165, 250, 0.14) !important;
  }

  html.dark .precificacont-simulacoes thead,
  html.dark .precificacont-simulacoes thead tr,
  html.dark .precificacont-simulacoes thead th {
    background: #10213a !important;
    color: #8fb7ea !important;
  }

  html.dark .precificacont-simulacoes tbody tr,
  html.dark .precificacont-simulacoes tbody td {
    background: #0c1a2f !important;
  }

  html.dark .precificacont-simulacoes tbody tr:hover,
  html.dark .precificacont-simulacoes tbody tr:hover td {
    background: #102440 !important;
  }

  html.dark .precificacont-simulacoes [class*="divide-slate"] > :not([hidden]) ~ :not([hidden]) {
    border-color: rgba(96, 165, 250, 0.12) !important;
  }

  html.dark .precificacont-simulacoes [class*="shadow"] {
    box-shadow: 0 14px 38px rgba(0, 0, 0, 0.18) !important;
  }

  /* Modal de detalhes */
  html.dark .precificacont-simulacoes .fixed.inset-0 > .bg-white,
  html.dark .precificacont-simulacoes .fixed.inset-0 [class*="bg-white"] {
    background-color: #0c1a2f !important;
  }

  html.dark .precificacont-simulacoes .sticky.bg-white {
    background-color: #0c1a2f !important;
    border-color: rgba(96, 165, 250, 0.18) !important;
  }

  html.dark .precificacont-simulacoes .hover\:bg-slate-50:hover,
  html.dark .precificacont-simulacoes .hover\:bg-slate-100:hover {
    background-color: #102440 !important;
  }
`;


const SIMULACOES_TABLE = "simulacoes";

function isUuidSimulacao(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function novoUuidSimulacao() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : null;
}

function simulacaoParaBanco(item, escritorioId) {
  return {
    id: item.id,
    escritorio_id: escritorioId,
    cliente: item.cliente || "",
    client_nome: item.client_nome || "",
    cnpj: item.cnpj || "",
    regime: item.regime || "",
    atividade: item.atividade || "",
    faturamento: Number(item.faturamento || 0),
    colaboradores: Number(item.colaboradores || 0),
    total_documentos: Number(item.total_documentos || 0),
    tipo_simulacao: getTipoSimulacao(item),
    status: item.status || "calculado",
    indice_precificacont: Number(item.indice_precificacont || 0),
    valor_tabela: Number(item.valor_tabela || 0),
    valor_negociado: Number(item.valor_negociado || 0),
    valor_contabil_fiscal: Number(item.valor_contabil_fiscal || 0),
    valor_dp: Number(item.valor_dp || 0),
    valor_colaborador: Number(item.valor_colaborador || 0),
    valor_filiais: Number(item.valor_filiais || 0),
    valor_servicos_mensais: Number(getMensalServicos(item) || 0),
    valor_servicos_pontuais: Number(getPontualServicos(item) || 0),
    valor_total_mensal: Number(getTotalMensal(item) || 0),
    filiais_detalhadas: getFiliais(item),
    servicos_adicionais: getServicos(item),
    engine_version: item.engine_version || "",
    dados: item,
    created_date: item.created_date || new Date().toISOString(),
    updated_date: item.updated_date || new Date().toISOString(),
  };
}

function simulacaoDoBanco(row) {
  const dados =
    row.dados && typeof row.dados === "object" && !Array.isArray(row.dados)
      ? row.dados
      : {};

  return {
    ...dados,
    id: row.id,
    cliente: row.cliente || dados.cliente || "",
    client_nome: row.client_nome || dados.client_nome || "",
    cnpj: row.cnpj || dados.cnpj || "",
    regime: row.regime || dados.regime || "",
    atividade: row.atividade || dados.atividade || "",
    faturamento: Number(row.faturamento ?? dados.faturamento ?? 0),
    colaboradores: Number(row.colaboradores ?? dados.colaboradores ?? 0),
    total_documentos: Number(row.total_documentos ?? dados.total_documentos ?? 0),
    tipo_simulacao: row.tipo_simulacao || dados.tipo_simulacao || "rapida",
    status: row.status || dados.status || "calculado",
    indice_precificacont: Number(
      row.indice_precificacont ?? dados.indice_precificacont ?? 0
    ),
    valor_tabela: Number(row.valor_tabela ?? dados.valor_tabela ?? 0),
    valor_negociado: Number(row.valor_negociado ?? dados.valor_negociado ?? 0),
    valor_contabil_fiscal: Number(
      row.valor_contabil_fiscal ?? dados.valor_contabil_fiscal ?? 0
    ),
    valor_dp: Number(row.valor_dp ?? dados.valor_dp ?? 0),
    valor_colaborador: Number(
      row.valor_colaborador ?? dados.valor_colaborador ?? 0
    ),
    valor_filiais: Number(row.valor_filiais ?? dados.valor_filiais ?? 0),
    valor_servicos_mensais: Number(
      row.valor_servicos_mensais ?? dados.valor_servicos_mensais ?? 0
    ),
    valor_servicos_pontuais: Number(
      row.valor_servicos_pontuais ?? dados.valor_servicos_pontuais ?? 0
    ),
    valor_total_mensal: Number(
      row.valor_total_mensal ?? dados.valor_total_mensal ?? 0
    ),
    filiais_detalhadas: Array.isArray(row.filiais_detalhadas)
      ? row.filiais_detalhadas
      : getFiliais(dados),
    servicos_adicionais: Array.isArray(row.servicos_adicionais)
      ? row.servicos_adicionais
      : getServicos(dados),
    engine_version: row.engine_version || dados.engine_version || "",
    created_date: row.created_date || dados.created_date || null,
    updated_date: row.updated_date || dados.updated_date || null,
  };
}

export default function Simulacoes({ setPagina }) {
  const escritorioAtivoId = getEscritorioAtivoId();
  const storageKey = scopedStorageKey(STORAGE_KEY);

  const [simulacoes, setSimulacoes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const simulacoesRef = useRef(simulacoes);
  const syncQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    simulacoesRef.current = simulacoes;
  }, [simulacoes]);

  useEffect(() => {
    let ativo = true;

    const carregarSimulacoes = async () => {
      let cache = [];

      try {
        cache = JSON.parse(localStorage.getItem(storageKey) || "[]");
        if (!Array.isArray(cache)) cache = [];
      } catch {
        cache = [];
      }

      // Corrige IDs antigos apenas na primeira migração. O conteúdo da simulação é preservado.
      const cacheNormalizado = cache.map((item) => ({
        ...item,
        id: isUuidSimulacao(item.id) ? item.id : novoUuidSimulacao(),
        updated_date:
          item.updated_date || item.created_date || new Date().toISOString(),
      })).filter((item) => item.id);

      if (ativo && cacheNormalizado.length) {
        simulacoesRef.current = cacheNormalizado;
        setSimulacoes(cacheNormalizado);
      }

      localStorage.setItem(storageKey, JSON.stringify(cacheNormalizado));

      try {
        const { data, error } = await supabase
          .from(SIMULACOES_TABLE)
          .select("*")
          .eq("escritorio_id", escritorioAtivoId)
          .order("created_date", { ascending: false });

        if (error) throw error;
        if (!ativo) return;

        const banco = Array.isArray(data) ? data.map(simulacaoDoBanco) : [];
        // Supabase é a fonte persistente deste escritório; localStorage é apenas cache rápido.
        simulacoesRef.current = banco;
        setSimulacoes(banco);
        localStorage.setItem(storageKey, JSON.stringify(banco));
      } catch (error) {
        console.error("Simulações: falha ao sincronizar com Supabase.", error);
        // Sem rede, a tela continua funcionando com o cache local.
      }
    };

    carregarSimulacoes();

    return () => {
      ativo = false;
    };
  }, [escritorioAtivoId, storageKey]);

  const enfileirarSync = (operacao) => {
    syncQueueRef.current = syncQueueRef.current
      .then(operacao)
      .catch((error) => {
        console.error("Simulações: erro ao sincronizar com Supabase.", error);
      });

    return syncQueueRef.current;
  };

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [selecionada, setSelecionada] = useState(null);
  const [simulacaoParaProposta, setSimulacaoParaProposta] = useState(null);
  const [proposalMode, setProposalMode] = useState("completa");
  const [proposalInclude, setProposalInclude] = useState({
    matriz: true,
    filiais: false,
    servicos: false,
  });
  const [clienteProposta, setClienteProposta] = useState("");
  const [documentoProposta, setDocumentoProposta] = useState("");
  const [cnpjLookupStatus, setCnpjLookupStatus] = useState("idle");
  const cnpjLookupSeqRef = useRef(0);
  const [modoSelecionarParaProposta] = useState(
    () => localStorage.getItem("precificacont_fluxo_proposta") === "selecionar_simulacao"
  );

  useEffect(() => {
    if (!simulacaoParaProposta) {
      setCnpjLookupStatus("idle");
      return undefined;
    }

    const cnpj = String(documentoProposta || "").replace(/\D/g, "");

    // CPF continua permitido na proposta, mas a consulta automática é exclusiva para CNPJ.
    if (cnpj.length !== 14) {
      setCnpjLookupStatus("idle");
      return undefined;
    }

    const seq = ++cnpjLookupSeqRef.current;
    setCnpjLookupStatus("loading");

    const timer = window.setTimeout(async () => {
      const obterNomeEmpresa = async () => {
        try {
          const response = await fetch(`https://api.opencnpj.org/${cnpj}`);

          if (response.ok) {
            const data = await response.json();
            const nome = String(
              data?.razao_social ||
                data?.nome_fantasia ||
                data?.razaoSocial ||
                data?.nomeFantasia ||
                ""
            ).trim();

            if (nome) return nome;
          }
        } catch {
          // Se o OpenCNPJ estiver indisponível, tenta a BrasilAPI abaixo.
        }

        try {
          const response = await fetch(
            `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`
          );

          if (response.ok) {
            const data = await response.json();
            const nome = String(
              data?.razao_social ||
                data?.nome_fantasia ||
                data?.razaoSocial ||
                data?.nomeFantasia ||
                ""
            ).trim();

            if (nome) return nome;
          }
        } catch {
          // O status de erro é tratado após as duas tentativas.
        }

        return "";
      };

      const nomeEmpresa = await obterNomeEmpresa();

      if (seq !== cnpjLookupSeqRef.current) return;

      if (nomeEmpresa) {
        setClienteProposta(nomeEmpresa);
        setCnpjLookupStatus("found");
        return;
      }

      setCnpjLookupStatus("not_found");
    }, 450);

    return () => {
      window.clearTimeout(timer);
      cnpjLookupSeqRef.current += 1;
    };
  }, [documentoProposta, simulacaoParaProposta]);

  const abrirGeradorProposta = (item) => {
    if (!item) return;

    const filiais = getFiliais(item);
    const servicos = getServicos(item);

    setSimulacaoParaProposta(item);
    setClienteProposta(String(item.client_nome || item.cliente || "").trim());
    setDocumentoProposta(
      formatDocumentoProposta(String(item.cnpj || item.documento || "").trim())
    );
    setProposalMode("completa");
    setProposalInclude({
      matriz: true,
      filiais: filiais.length > 0,
      servicos: servicos.length > 0,
    });
  };

  const selecionarModoProposta = (mode) => {
    if (!simulacaoParaProposta) return;

    const temFiliais = getFiliais(simulacaoParaProposta).length > 0;
    const temServicos = getServicos(simulacaoParaProposta).length > 0;

    setProposalMode(mode);

    if (mode === "servicos") {
      setProposalInclude({
        matriz: false,
        filiais: false,
        servicos: temServicos,
      });
      return;
    }

    if (mode === "completa") {
      setProposalInclude({
        matriz: true,
        filiais: temFiliais,
        servicos: temServicos,
      });
      return;
    }

    setProposalInclude((current) => ({
      matriz: current.matriz,
      filiais: temFiliais ? current.filiais : false,
      servicos: temServicos ? current.servicos : false,
    }));
  };

  const confirmarGeracaoProposta = () => {
    const item = simulacaoParaProposta;
    if (!item) return;

    const cliente = String(clienteProposta || "").trim();
    const documento = String(documentoProposta || "").trim();
    const digitosDocumento = documento.replace(/\D/g, "");

    if (!cliente || !digitosDocumento) {
      window.alert(
        "Para gerar a proposta, informe obrigatoriamente a Empresa / cliente e o CNPJ/CPF."
      );
      return;
    }

    if (![11, 14].includes(digitosDocumento.length)) {
      window.alert("Informe um CPF ou CNPJ completo antes de gerar a proposta.");
      return;
    }

    const filiais = getFiliais(item);
    const servicos = getServicos(item);

    if (
      !proposalInclude.matriz &&
      !proposalInclude.filiais &&
      !proposalInclude.servicos
    ) {
      window.alert("Selecione pelo menos um item para gerar a proposta.");
      return;
    }

    const matrizMensal = proposalInclude.matriz ? getIndice(item) : 0;
    const filiaisMensal = proposalInclude.filiais
      ? Number(item.valor_filiais || 0)
      : 0;
    const servicosMensais = proposalInclude.servicos ? getMensalServicos(item) : 0;
    const servicosPontuais = proposalInclude.servicos ? getPontualServicos(item) : 0;
    const mensalidadeTotal = matrizMensal + filiaisMensal + servicosMensais;

    const itensSelecionados = [];

    if (proposalInclude.matriz) {
      itensSelecionados.push({
        tipo: "honorario_matriz",
        descricao: "Honorários contábeis — Matriz",
        recorrencia: "mensal",
        valor: matrizMensal,
      });
    }

    if (proposalInclude.filiais) {
      filiais.forEach((filial, index) => {
        itensSelecionados.push({
          tipo: "filial",
          descricao: filial.nome || `Filial ${index + 1}`,
          recorrencia: "mensal",
          valor: Number(filial.valor || filial.valor_mensal || 0),
          dados: filial,
        });
      });
    }

    if (proposalInclude.servicos) {
      servicos.forEach((servico) => {
        itensSelecionados.push({
          tipo: "servico_adicional",
          descricao: servico.nome || "Serviço adicional",
          recorrencia:
            servico.recorrencia === "mensal" ? "mensal" : "pontual",
          valor:
            Number(servico.valor_unitario || 0) *
            Number(servico.quantidade || 1),
          dados: servico,
        });
      });
    }

    const rascunho = {
      ...item,
      id: `SIM-PROP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      numero_proposta: "",
      status: "rascunho",
      origem: "simulacao",
      origem_simulacao: true,
      simulacao_id: item.id,
      tipo_proposta:
        proposalMode === "servicos"
          ? "servicos_adicionais"
          : proposalMode === "personalizada"
          ? "personalizada"
          : "completa",
      itens_proposta: itensSelecionados,
      incluir: {
        matriz: Boolean(proposalInclude.matriz),
        filiais: Boolean(proposalInclude.filiais),
        servicos: Boolean(proposalInclude.servicos),
      },
      cliente,
      client_nome: cliente,
      cnpj: documento,
      documento,
      cpf_cnpj: documento,
      cpfCnpj: documento,
      valor_mensal: mensalidadeTotal,
      mensalidade: mensalidadeTotal,
      valores: {
        honorario_matriz: matrizMensal,
        filiais: filiaisMensal,
        servicos_recorrentes: servicosMensais,
        servicos_pontuais: servicosPontuais,
        mensalidade_total: mensalidadeTotal,
        primeiro_mes: mensalidadeTotal + servicosPontuais,
      },
      dados: {
        ...item,
        cliente,
        cnpj: documento,
        simulacao_id: item.id,
        origem: "simulacao",
      },
    };

    localStorage.setItem(
      "precificacont_nova_proposta_crm",
      JSON.stringify(rascunho)
    );
    localStorage.removeItem("precificacont_fluxo_proposta");
    setSimulacoes((atuais) =>
      atuais.map((simulacao) =>
        simulacao.id === item.id
          ? { ...simulacao, status: "proposta_gerada" }
          : simulacao
      )
    );

    setSimulacaoParaProposta(null);

    if (typeof setPagina === "function") {
      setPagina("propostas");
      return;
    }

    window.alert("Abra o módulo Propostas para concluir a proposta.");
  };

  const gerarPropostaDaSimulacao = (item) => {
    abrirGeradorProposta(item);
  };

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const normalizarStatus = (item) => {
      const original = String(item?.status || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/[\\s-]+/g, "_");

      const aliases = {
        calculada: "calculado",
        calculado: "calculado",
        aguardando: "aguardando_aprovacao",
        aguardando_aprovacao: "aguardando_aprovacao",
        pendente_aprovacao: "aguardando_aprovacao",
        aprovado: "aprovado",
        aprovada: "aprovado",
        proposta: "proposta_gerada",
        proposta_gerada: "proposta_gerada",
        proposta_criada: "proposta_gerada",
        fechado: "fechado",
        fechada: "fechado",
        ganho: "fechado",
        ganha: "fechado",
        perdido: "perdido",
        perdida: "perdido",
      };

      return aliases[original] || original || "calculado";
    };

    return simulacoes.filter((item) => {
      const cliente = String(item.client_nome || item.cliente || "").toLowerCase();
      const cnpj = String(item.cnpj || "").toLowerCase();
      const regime = String(item.regime || "").toLowerCase();
      const atividade = String(item.atividade || "").toLowerCase();

      const atendeBusca =
        !termo ||
        cliente.includes(termo) ||
        cnpj.includes(termo) ||
        regime.includes(termo) ||
        atividade.includes(termo);

      const atendeStatus =
        filtroStatus === "todos" ||
        normalizarStatus(item) === filtroStatus;

      const atendeTipo =
        filtroTipo === "todos" ||
        getTipoSimulacao(item) === filtroTipo;

      return atendeBusca && atendeStatus && atendeTipo;
    });
  }, [simulacoes, busca, filtroStatus, filtroTipo]);

  const indicadores = useMemo(() => {
    const total = simulacoes.length;

    const valorTotal = simulacoes.reduce(
      (acc, item) =>
        acc +
        Number(
          item.valor_negociado ||
            item.valor_tabela ||
            0
        ),
      0
    );

    const media =
      total > 0 ? valorTotal / total : 0;

    const comDP = simulacoes.filter(
      (item) =>
        Number(item.colaboradores || 0) > 0
    ).length;

    return {
      total,
      media,
      valorTotal,
      comDP,
    };
  }, [simulacoes]);

  const excluir = (id) => {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta simulação?"
    );

    if (!confirmar) return;

    const atualizadas = simulacoesRef.current.filter(
      (item) => item.id !== id
    );

    // Remove imediatamente da interface e do cache.
    simulacoesRef.current = atualizadas;
    setSimulacoes(atualizadas);
    localStorage.setItem(storageKey, JSON.stringify(atualizadas));

    // Supabase é atualizado em segundo plano sem recarregar o histórico inteiro.
    if (isUuidSimulacao(id)) {
      enfileirarSync(async () => {
        const { error } = await supabase
          .from(SIMULACOES_TABLE)
          .delete()
          .eq("id", id)
          .eq("escritorio_id", escritorioAtivoId);

        if (error) throw error;
      });
    }
  };

  return (
    <div className="precificacont-simulacoes min-h-screen bg-slate-50">
      <style>{SIMULACOES_DARK_CSS}</style>
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-7">
        {/* CABEÇALHO */}

        <div className="mb-7">
          <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
            <History size={16} />
            Histórico de precificações
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Simulações
          </h1>

          <p className="text-slate-500 mt-1">
            Consulte e acompanhe as precificações
            realizadas no PrecificaCont.
          </p>
        </div>

        {modoSelecionarParaProposta && (
          <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <FileText size={20} className="mt-0.5 text-blue-700 shrink-0" />
              <div>
                <div className="font-bold text-blue-900">
                  Selecione uma simulação para gerar a proposta
                </div>
                <div className="mt-1 text-sm text-blue-700">
                  Escolha abaixo a precificação que será usada como base da nova proposta comercial.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INDICADORES */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Card
            icon={Calculator}
            label="Simulações realizadas"
            value={number(indicadores.total)}
          />

          <Card
            icon={TrendingUp}
            label="Valor médio recomendado"
            value={money(indicadores.media)}
          />

          <Card
            icon={FileText}
            label="Volume precificado"
            value={money(indicadores.valorTotal)}
          />

          <Card
            icon={Users}
            label="Simulações com DP"
            value={number(indicadores.comDP)}
          />
        </div>

        {/* PESQUISA */}

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={busca}
                onChange={(e) =>
                  setBusca(e.target.value)
                }
                placeholder="Buscar por cliente, CNPJ, regime ou atividade..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <SelectPrecificaCont
                value={filtroStatus}
                onChange={setFiltroStatus}
                options={[
                  { value: "todos", label: "Todos os status" },
                  { value: "calculado", label: "Calculado" },
                  { value: "aguardando_aprovacao", label: "Aguardando aprovação" },
                  { value: "aprovado", label: "Aprovado" },
                  { value: "proposta_gerada", label: "Proposta gerada" },
                  { value: "fechado", label: "Fechado" },
                  { value: "perdido", label: "Perdido" },
                ]}
                placeholder=""
                className="w-full min-w-[190px] pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700"
              />
            </div>

            <div className="relative">
              <GitBranch
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <SelectPrecificaCont
                value={filtroTipo}
                onChange={setFiltroTipo}
                options={[
                  { value: "todos", label: "Todos os tipos" },
                  { value: "rapida", label: "Simulação rápida" },
                  { value: "detalhada", label: "Simulação detalhada" },
                ]}
                placeholder=""
                className="w-full min-w-[190px] pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* LISTA */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {filtradas.length === 0 ? (
            <div className="py-20 px-6 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
                <Calculator
                  size={24}
                  className="text-slate-400"
                />
              </div>

              <h2 className="font-semibold text-slate-800 mt-4">
                Nenhuma simulação encontrada
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                As novas precificações aparecerão
                automaticamente aqui.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP */}

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <Th className="w-[15%]">Cliente</Th>
                      <Th className="w-[10%]">Tipo</Th>
                      <Th className="w-[10%]">Perfil</Th>
                      <Th className="w-[11%]">DP</Th>
                      <Th className="w-[12%]">Referência</Th>
                      <Th className="w-[10%]">Status</Th>
                      <Th className="w-[11%]">Data</Th>
                      <Th className="w-[21%]" align="right">
                        Ações
                      </Th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtradas.map((item) => {
                      const cliente =
                        item.client_nome ||
                        item.cliente ||
                        "Simulação sem cliente";

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition"
                        >
                          <Td>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                <Building2
                                  size={17}
                                  className="text-blue-700"
                                />
                              </div>

                              <div>
                                <div className="font-medium text-slate-900">
                                  {cliente}
                                </div>

                                <div className="text-xs text-slate-400 mt-0.5">
                                  {item.cnpj ||
                                    "CNPJ não informado"}
                                </div>
                              </div>
                            </div>
                          </Td>

                          <Td>
                            <div className="space-y-2">
                              <TipoBadge tipo={getTipoSimulacao(item)} />
                              {getFiliais(item).length > 0 && (
                                <div className="text-xs text-slate-400">
                                  {getFiliais(item).length}{" "}
                                  {getFiliais(item).length === 1 ? "filial" : "filiais"}
                                </div>
                              )}
                            </div>
                          </Td>

                          <Td>
                            <div className="text-sm text-slate-700">
                              {item.regime || "—"}
                            </div>

                            <div className="text-xs text-slate-400 mt-0.5">
                              {item.atividade || "—"}
                            </div>
                          </Td>

                          <Td>
                            <div className="text-sm font-medium text-slate-700">
                              {number(
                                item.colaboradores
                              )}{" "}
                              colaboradores
                            </div>

                            <div className="text-xs text-slate-400 mt-0.5">
                              {item.valor_colaborador
                                ? `${money(
                                    item.valor_colaborador
                                  )} cada`
                                : "Sem DP"}
                            </div>
                          </Td>

                          <Td>
                            <div className="font-semibold text-slate-900">
                              {money(getTotalMensal(item))}
                            </div>

                            <div className="text-xs text-slate-400 mt-0.5">
                              Índice: {money(getIndice(item))}
                            </div>

                            {getMensalServicos(item) > 0 && (
                              <div className="text-xs text-blue-600 mt-0.5">
                                Serviços mensais: {money(getMensalServicos(item))}
                              </div>
                            )}
                          </Td>

                          <Td>
                            <StatusBadge
                              status={
                                item.status ||
                                "calculado"
                              }
                            />
                          </Td>

                          <Td>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <CalendarDays
                                size={14}
                                className="text-slate-400"
                              />

                              {formatDate(
                                item.created_date
                              )}
                            </div>
                          </Td>

                          <Td align="right">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap w-full">
                              <button
                                type="button"
                                onClick={() => gerarPropostaDaSimulacao(item)}
                                title="Gerar proposta com esta simulação"
                                className="inline-flex items-center justify-center gap-1.5 h-9 whitespace-nowrap rounded-lg bg-blue-600 px-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                              >
                                <FileText size={15} className="shrink-0" />
                                <span>Gerar proposta</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelecionada(item)}
                                title="Ver detalhes"
                                className="inline-flex items-center justify-center w-8 h-9 shrink-0 rounded-lg border border-slate-200 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition"
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => excluir(item.id)}
                                title="Excluir simulação"
                                className="inline-flex items-center justify-center w-8 h-9 shrink-0 rounded-lg border border-rose-200 bg-white text-rose-500 hover:bg-rose-50 transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}

              <div className="lg:hidden divide-y divide-slate-100">
                {filtradas.map((item) => {
                  const cliente =
                    item.client_nome ||
                    item.cliente ||
                    "Simulação sem cliente";

                  return (
                    <div
                      key={item.id}
                      className="p-5"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {cliente}
                          </div>

                          <div className="text-xs text-slate-400 mt-1">
                            {item.regime || "—"} •{" "}
                            {item.atividade || "—"}
                          </div>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <TipoBadge tipo={getTipoSimulacao(item)} />
                            {getFiliais(item).length > 0 && (
                              <span className="text-xs text-slate-400">
                                {getFiliais(item).length}{" "}
                                {getFiliais(item).length === 1 ? "filial" : "filiais"}
                              </span>
                            )}
                          </div>
                        </div>

                        <StatusBadge
                          status={
                            item.status ||
                            "calculado"
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-xs text-slate-400">
                            Referência
                          </div>

                          <div className="font-semibold text-slate-900 mt-1">
                            {money(getTotalMensal(item))}
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-xs text-slate-400">
                            Colaboradores
                          </div>

                          <div className="font-semibold text-slate-900 mt-1">
                            {number(
                              item.colaboradores
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <div className="text-xs text-slate-400">
                          {formatDate(
                            item.created_date
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => gerarPropostaDaSimulacao(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            title="Gerar proposta com esta simulação"
                          >
                            <FileText size={15} />
                            Gerar proposta
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelecionada(item)}
                            className="text-slate-400 hover:text-blue-600"
                            title="Ver detalhes"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              excluir(item.id)
                            }
                            className="text-slate-400 hover:text-rose-600"
                            title="Excluir simulação"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="text-xs text-slate-400 mt-3">
          Exibindo {filtradas.length} de{" "}
          {simulacoes.length} simulações.
        </div>
      </div>

      {simulacaoParaProposta && (() => {
        const filiaisProposta = getFiliais(simulacaoParaProposta);
        const servicosProposta = getServicos(simulacaoParaProposta);
        const matrizMensal = proposalInclude.matriz
          ? getIndice(simulacaoParaProposta)
          : 0;
        const filiaisMensal = proposalInclude.filiais
          ? Number(simulacaoParaProposta.valor_filiais || 0)
          : 0;
        const servicosMensais = proposalInclude.servicos
          ? getMensalServicos(simulacaoParaProposta)
          : 0;
        const servicosPontuais = proposalInclude.servicos
          ? getPontualServicos(simulacaoParaProposta)
          : 0;
        const mensal = matrizMensal + filiaisMensal + servicosMensais;

        return (
          <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center">
            <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl text-slate-900">
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Gerar proposta</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Escolha exatamente o que será apresentado ao cliente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSimulacaoParaProposta(null)}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="mt-0.5 h-5 w-5 rounded-full border border-amber-600 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                      i
                    </div>
                    <div>
                      <div className="font-semibold text-amber-900">
                        Dados obrigatórios para gerar a proposta
                      </div>
                      <div className="text-xs text-amber-700 mt-1">
                        A simulação pode ser feita sem identificação, mas a proposta exige Empresa / cliente e CNPJ/CPF.
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">
                        CNPJ/CPF *
                      </label>
                      <input
                        value={documentoProposta}
                        onChange={(e) =>
                          setDocumentoProposta(
                            formatDocumentoProposta(e.target.value)
                          )
                        }
                        placeholder="00.000.000/0000-00 ou 000.000.000-00"
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
                      />
                      {String(documentoProposta || "").replace(/\D/g, "").length === 14 && (
                        <div
                          className={`mt-1.5 text-xs ${
                            cnpjLookupStatus === "found"
                              ? "text-emerald-600"
                              : cnpjLookupStatus === "not_found"
                              ? "text-amber-700"
                              : "text-slate-500"
                          }`}
                        >
                          {cnpjLookupStatus === "loading"
                            ? "Buscando empresa pelo CNPJ..."
                            : cnpjLookupStatus === "found"
                            ? "Empresa localizada e preenchida automaticamente."
                            : cnpjLookupStatus === "not_found"
                            ? "CNPJ não localizado automaticamente. Você pode informar a empresa manualmente."
                            : ""}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">
                        Empresa / cliente *
                      </label>
                      <input
                        value={clienteProposta}
                        onChange={(e) => setClienteProposta(e.target.value)}
                        placeholder="Empresa / cliente"
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    {
                      id: "servicos",
                      title: "Serviços adicionais",
                      text: "Somente os serviços selecionados.",
                    },
                    {
                      id: "personalizada",
                      title: "Personalizada",
                      text: "Escolha matriz, filiais e serviços.",
                    },
                    {
                      id: "completa",
                      title: "Completa",
                      text: "Matriz + filiais + serviços.",
                    },
                  ].map((modo) => (
                    <button
                      key={modo.id}
                      type="button"
                      onClick={() => selecionarModoProposta(modo.id)}
                      className={`text-left rounded-2xl border p-4 transition ${
                        proposalMode === modo.id
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold">{modo.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {modo.text}
                      </div>
                    </button>
                  ))}
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Itens da proposta</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {[
                      {
                        id: "matriz",
                        title: "Honorários da matriz",
                        value: money(getIndice(simulacaoParaProposta)),
                        disabled: false,
                      },
                      {
                        id: "filiais",
                        title: "Filiais",
                        value: `${filiaisProposta.length} filial(is) • ${money(
                          simulacaoParaProposta.valor_filiais || 0
                        )}`,
                        disabled: filiaisProposta.length === 0,
                      },
                      {
                        id: "servicos",
                        title: "Serviços adicionais",
                        value: `${servicosProposta.length} serviço(s)`,
                        disabled: servicosProposta.length === 0,
                      },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className={`rounded-2xl border p-4 transition ${
                          item.disabled
                            ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                            : proposalInclude[item.id]
                            ? "border-blue-200 bg-blue-50/50 cursor-pointer"
                            : "border-slate-200 bg-slate-50 opacity-70 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            disabled={item.disabled}
                            checked={Boolean(proposalInclude[item.id])}
                            onChange={(e) =>
                              setProposalInclude((current) => ({
                                ...current,
                                [item.id]: e.target.checked,
                              }))
                            }
                          />
                          <div>
                            <div className="font-semibold">{item.title}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {item.value}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 rounded-2xl bg-slate-950 px-5 py-4 text-white">
                  <div>
                    <div className="text-xs text-slate-400">Mensal</div>
                    <div className="font-bold mt-1">{money(mensal)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Pontual</div>
                    <div className="font-bold mt-1">{money(servicosPontuais)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Primeiro mês</div>
                    <div className="font-bold mt-1">
                      {money(mensal + servicosPontuais)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulacaoParaProposta(null)}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmarGeracaoProposta}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
                  >
                    Gerar proposta
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {selecionada && (
        <DetalhesSimulacao
          item={selecionada}
          onClose={() => setSelecionada(null)}
        />
      )}
    </div>
  );
}

function DetalhesSimulacao({ item, onClose }) {
  const cliente =
    item.client_nome ||
    item.cliente ||
    "Simulação sem cliente";

  const filiais = getFiliais(item);
  const servicos = getServicos(item);
  const mensalServicos = getMensalServicos(item);
  const pontualServicos = getPontualServicos(item);
  const indice = getIndice(item);
  const totalMensal = getTotalMensal(item);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">
                {cliente}
              </h2>
              <TipoBadge tipo={getTipoSimulacao(item)} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {item.regime || "Regime não informado"} •{" "}
              {item.atividade || "Atividade não informada"} •{" "}
              {formatDate(item.created_date)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <DetailCard
              label="Índice PrecificaCont"
              value={money(indice)}
              icon={Calculator}
            />
            <DetailCard
              label="Serviços mensais"
              value={money(mensalServicos)}
              icon={PackagePlus}
            />
            <DetailCard
              label="Total mensal"
              value={money(totalMensal)}
              icon={TrendingUp}
            />
            <DetailCard
              label="Serviços pontuais"
              value={money(pontualServicos)}
              icon={ReceiptText}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <DetailSection title="Perfil analisado">
              <DetailRow label="CNPJ" value={item.cnpj || "—"} />
              <DetailRow label="Regime" value={item.regime || "—"} />
              <DetailRow label="Atividade" value={item.atividade || "—"} />
              <DetailRow
                label="Faturamento"
                value={money(item.faturamento)}
              />
              <DetailRow
                label="Colaboradores"
                value={number(item.colaboradores)}
              />
              <DetailRow
                label="Documentos"
                value={`${number(item.total_documentos)} / mês`}
              />
            </DetailSection>

            <DetailSection title="Composição da referência">
              <DetailRow
                label="Contábil / Fiscal"
                value={money(item.valor_contabil_fiscal)}
              />
              <DetailRow
                label="Departamento Pessoal"
                value={money(item.valor_dp)}
              />
              <DetailRow
                label="Filiais"
                value={money(item.valor_filiais)}
              />
              <DetailRow
                label="Valor por colaborador"
                value={money(item.valor_colaborador)}
              />
              <DetailRow
                label="Status"
                value={STATUS[item.status]?.label || "Calculado"}
              />
              <DetailRow
                label="Motor"
                value={item.engine_version || "—"}
              />
            </DetailSection>
          </div>

          {filiais.length > 0 && (
            <DetailSection title={`Filiais (${filiais.length})`}>
              <div className="grid md:grid-cols-2 gap-3">
                {filiais.map((filial, index) => (
                  <div
                    key={filial.id || index}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="font-semibold text-slate-900">
                      Filial {index + 1}
                    </div>
                    <div className="text-sm text-slate-500 mt-2 space-y-1">
                      <div>{filial.regime || "Regime não informado"}</div>
                      <div>{filial.atividade || "Atividade não informada"}</div>
                      <div>Faturamento: {money(filial.faturamento)}</div>
                      <div>
                        {filial.centralizada !== false
                          ? "Contabilidade centralizada"
                          : "Contabilidade descentralizada"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {servicos.length > 0 && (
            <DetailSection title={`Serviços adicionais (${servicos.length})`}>
              <div className="divide-y divide-slate-100">
                {servicos.map((servico, index) => (
                  <div
                    key={`${servico.id || servico.nome}-${index}`}
                    className="py-3 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {servico.nome || "Serviço"}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {servico.recorrencia === "mensal"
                          ? "Mensal"
                          : "Pontual"}{" "}
                        • {number(servico.quantidade || 1)} un.
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {money(
                        Number(servico.valor_unitario || 0) *
                          Number(servico.quantidade || 1)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <Icon size={16} className="text-blue-700" />
      </div>
      <div className="font-bold text-slate-900 mt-2">{value}</div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}

function Card({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500">
            {label}
          </div>

          <div className="text-xl font-bold text-slate-900 mt-2">
            {value}
          </div>
        </div>

        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Icon
            size={19}
            className="text-blue-700"
          />
        </div>
      </div>
    </div>
  );
}

function Th({ children, align = "left", className = "" }) {
  return (
    <th
      className={`px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right"
          ? "text-right"
          : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}) {
  return (
    <td
      className={`px-3 py-4 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </td>
  );
}