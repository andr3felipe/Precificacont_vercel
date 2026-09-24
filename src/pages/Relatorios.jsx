import React, { useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Target,
  CalendarDays,
  RefreshCcw,
  ArrowUpRight,
  GitBranch,
  PackagePlus,
  Sparkles,
  Eye,
  X,
  Handshake,
  CircleDollarSign,
  Clock3,
  CheckCircle2,
  XCircle,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import SelectPrecificaCont from "../components/SelectPrecificaCont";

const SIM_KEY = "precificacont_simulacoes";
const CRM_KEY = "precificacont_crm_oportunidades";
const PROPOSTA_KEYS = ["precificacont_propostas", "precificacont_proposals"];
const REP_KEYS = [
  "precificacont_reprecificacao",
  "precificacont_reprecificacoes",
  "precificacont_reprecificacao_base",
];

const ESCRITORIO_ATIVO_KEY = "precificacont_escritorio_ativo";

function getEscritorioAtivoId() {
  return localStorage.getItem(ESCRITORIO_ATIVO_KEY) || "";
}

function scopedStorageKey(baseKey) {
  const escritorioId = getEscritorioAtivoId();
  return escritorioId ? `${baseKey}:${escritorioId}` : baseKey;
}

const money = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const num = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).trim();
  if (s.includes(",")) {
    const n = Number(s.replace(/R\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(s.replace(/R\$/g, "").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const dateOf = (item) => {
  const raw = item.created_date || item.createdAt || item.data || item.date;
  const d = raw ? new Date(raw) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const nameOf = (x) => x.client_nome || x.cliente || x.nome || x.razaoSocial || "Sem identificação";
const currentOf = (x) => num(x.honorario_atual ?? x.honorarioAtual ?? x.valor_atual ?? x.valorAtual);
const recommendedOf = (x) => num(x.valor_tabela ?? x.valor_recomendado ?? x.valorRecomendado ?? x.indice ?? x.referencia);
const negotiatedOf = (x) => num(x.valor_negociado ?? x.valorNegociado ?? recommendedOf(x));
const regimeOf = (x) => x.regime || "Não informado";
const activityOf = (x) => x.atividade || "Não informada";

const tipoOf = (x) =>
  x.tipo_simulacao === "detalhada" || x.tipo === "detalhada"
    ? "Detalhada"
    : x.tipo_simulacao === "rapida" || x.tipo === "rapida"
    ? "Rápida"
    : x.origem === "Reprecificação"
    ? "Reprecificação"
    : "Simulação";

const filiaisOf = (x) => {
  if (Array.isArray(x.filiais_detalhadas)) return x.filiais_detalhadas;
  if (Array.isArray(x.filiaisDetalhadas)) return x.filiaisDetalhadas;
  if (Array.isArray(x.estrutura?.filiais)) return x.estrutura.filiais;
  return [];
};

const quantidadeFiliaisOf = (x) =>
  Number(
    x.filiais ??
      x.quantidade_filiais ??
      filiaisOf(x).length ??
      0
  );

const servicosOf = (x) =>
  Array.isArray(x.servicos_adicionais)
    ? x.servicos_adicionais
    : Array.isArray(x.servicosAdicionais)
    ? x.servicosAdicionais
    : [];

const servicosMensaisOf = (x) => {
  if (x.valor_servicos_mensais != null) {
    return num(x.valor_servicos_mensais);
  }

  return servicosOf(x)
    .filter((s) => s.recorrencia === "mensal")
    .reduce(
      (total, s) =>
        total + num(s.valor_unitario) * num(s.quantidade || 1),
      0
    );
};

const servicosPontuaisOf = (x) => {
  if (x.valor_servicos_pontuais != null) {
    return num(x.valor_servicos_pontuais);
  }

  return servicosOf(x)
    .filter((s) => s.recorrencia !== "mensal")
    .reduce(
      (total, s) =>
        total + num(s.valor_unitario) * num(s.quantidade || 1),
      0
    );
};

const valorFiliaisOf = (x) =>
  num(x.valor_filiais ?? x.valorFiliais ?? x.valor_filiais_total);

const totalMensalOf = (x) => {
  if (x.valor_total_mensal != null) return num(x.valor_total_mensal);

  const referencia = recommendedOf(x);
  const servicos = servicosMensaisOf(x);
  return referencia + servicos;
};

const loadArray = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(scopedStorageKey(key)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};


const CRM_ETAPAS = [
  { id: "novo_lead", nome: "Novo lead" },
  { id: "qualificado", nome: "Qualificado" },
  { id: "simulacao", nome: "Simulação" },
  { id: "proposta_enviada", nome: "Proposta enviada" },
  { id: "negociacao", nome: "Negociação" },
  { id: "ganho", nome: "Ganho" },
  { id: "perdido", nome: "Perdido" },
];

const etapaCRMNome = (id) =>
  CRM_ETAPAS.find((etapa) => etapa.id === id)?.nome || id || "Não informada";

const crmDateOf = (item) => {
  const raw =
    item.createdAt ||
    item.created_date ||
    item.updatedAt ||
    item.etapaAlteradaEm;
  const d = raw ? new Date(raw) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const inPeriod = (date, periodo) => {
  if (periodo === "todos") return true;
  if (!date) return false;
  const now = new Date();
  const diff = (now - date) / 86400000;
  if (periodo === "30") return diff <= 30;
  if (periodo === "90") return diff <= 90;
  if (periodo === "365") return diff <= 365;
  return true;
};

const atividadesCRM = (item) =>
  Array.isArray(item.atividades) ? item.atividades : [];

const atividadePendenteCRM = (item) =>
  atividadesCRM(item)
    .filter((a) => a.status !== "concluida" && a.data)
    .sort((a, b) =>
      `${a.data}T${a.hora || "23:59"}`.localeCompare(
        `${b.data}T${b.hora || "23:59"}`
      )
    )[0] || null;

const followupVencidoCRM = (item) => {
  const atividade = atividadePendenteCRM(item);
  if (atividade) {
    return (
      new Date(`${atividade.data}T${atividade.hora || "23:59"}`).getTime() <
      Date.now()
    );
  }
  if (!item.dataFollowup) return false;
  return new Date(`${item.dataFollowup}T23:59:59`).getTime() < Date.now();
};

const Stat = ({ icon: Icon, label, value, detail, tone = "blue", onClick }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  const content = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-900 mt-2">{value}</div>
        {detail && <div className="text-xs text-slate-400 mt-2">{detail}</div>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        <Icon size={20} />
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        title={`Abrir ${label}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      {content}
    </div>
  );
};

export default function Relatorios({
  setPagina,
  permissoesRelatorios = {
    pode_visualizar: false,
    pode_criar: false,
    pode_editar: false,
    pode_excluir: false,
  },
  permissoesCRM = {
    pode_visualizar: false,
    pode_criar: false,
  },
}) {
  const [periodo, setPeriodo] = useState("todos");
  const [regime, setRegime] = useState("todos");
  const [atividade, setAtividade] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [refresh, setRefresh] = useState(0);
  const [detalhes, setDetalhes] = useState(null);

  const permissoesModulo = {
    carregando: false,
    pode_visualizar: Boolean(permissoesRelatorios?.pode_visualizar),
    pode_criar: Boolean(permissoesRelatorios?.pode_criar),
    pode_editar: Boolean(permissoesRelatorios?.pode_editar),
    pode_excluir: Boolean(permissoesRelatorios?.pode_excluir),
  };

  const navegarPara = (pagina, contexto = {}) => {
    try {
      localStorage.setItem(
        "precificacont_navegacao_contexto",
        JSON.stringify({
          origem: "relatorios",
          pagina,
          ...contexto,
          criadoEm: new Date().toISOString(),
        })
      );
    } catch {
      // A navegação continua mesmo se o storage estiver indisponível.
    }

    if (typeof setPagina === "function") {
      setPagina(pagina);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("precificacont-navegar", {
        detail: { pagina, contexto },
      })
    );
  };

  const abrirCRM = (filtro = {}) => {
    if (!permissoesCRM.pode_visualizar) return;
    navegarPara("crm", { filtro });
  };
  const abrirPropostas = (filtro = {}) => navegarPara("propostas", { filtro });

  const raw = useMemo(() => {
    const simulacoes = loadArray(SIM_KEY).map((x) => ({ ...x, origem: "Simulação" }));
    let reps = [];
    for (const key of REP_KEYS) {
      const found = loadArray(key);
      if (found.length) {
        reps = found;
        break;
      }
    }
    reps = reps.map((x) => ({ ...x, origem: "Reprecificação" }));

    const crm = loadArray(CRM_KEY);

    let propostas = [];
    for (const key of PROPOSTA_KEYS) {
      const found = loadArray(key);
      if (found.length) {
        propostas = found;
        break;
      }
    }

    return {
      simulacoes,
      reps,
      crm,
      propostas,
      all: [...simulacoes, ...reps],
    };
  }, [refresh]);

  const regimes = useMemo(
    () => [...new Set(raw.all.map(regimeOf).filter(Boolean))].sort(),
    [raw]
  );
  const atividades = useMemo(
    () => [...new Set(raw.all.map(activityOf).filter(Boolean))].sort(),
    [raw]
  );

  const tipos = useMemo(
    () => [...new Set(raw.all.map(tipoOf).filter(Boolean))],
    [raw]
  );

  const filtered = useMemo(() => {
    const now = new Date();
    return raw.all.filter((x) => {
      if (regime !== "todos" && regimeOf(x) !== regime) return false;
      if (atividade !== "todos" && activityOf(x) !== atividade) return false;
      if (tipo !== "todos" && tipoOf(x) !== tipo) return false;
      if (periodo === "todos") return true;
      const d = dateOf(x);
      if (!d) return false;
      const diff = (now - d) / 86400000;
      if (periodo === "30") return diff <= 30;
      if (periodo === "90") return diff <= 90;
      if (periodo === "365") return diff <= 365;
      return true;
    });
  }, [raw, periodo, regime, atividade, tipo]);

  const metrics = useMemo(() => {
    const total = filtered.length;
    const atuais = filtered.map(currentOf);
    const recomendados = filtered.map(recommendedOf);
    const negociados = filtered.map(negotiatedOf);
    const somaAtual = atuais.reduce((a, b) => a + b, 0);
    const somaRec = recomendados.reduce((a, b) => a + b, 0);
    const somaNeg = negociados.reduce((a, b) => a + b, 0);
    const comAtual = filtered.filter((x) => currentOf(x) > 0);
    const oportunidade = comAtual.reduce(
      (acc, x) => acc + Math.max(0, recommendedOf(x) - currentOf(x)),
      0
    );
    const defasados = comAtual.filter((x) => recommendedOf(x) > currentOf(x)).length;
    const acima = comAtual.filter((x) => currentOf(x) > recommendedOf(x) * 1.05).length;
    const adequado = Math.max(0, comAtual.length - defasados - acima);
    const totalFiliais = filtered.reduce(
      (sum, x) => sum + quantidadeFiliaisOf(x),
      0
    );
    const valorFiliais = filtered.reduce(
      (sum, x) => sum + valorFiliaisOf(x),
      0
    );
    const servicosMensais = filtered.reduce(
      (sum, x) => sum + servicosMensaisOf(x),
      0
    );
    const servicosPontuais = filtered.reduce(
      (sum, x) => sum + servicosPontuaisOf(x),
      0
    );
    const rapidas = filtered.filter((x) => tipoOf(x) === "Rápida").length;
    const detalhadas = filtered.filter((x) => tipoOf(x) === "Detalhada").length;

    return {
      total,
      somaAtual,
      somaRec,
      somaNeg,
      oportunidade,
      anual: oportunidade * 12,
      defasados,
      acima,
      adequado,
      ticket: total ? somaRec / total : 0,
      comAtual: comAtual.length,
      totalFiliais,
      valorFiliais,
      servicosMensais,
      servicosPontuais,
      rapidas,
      detalhadas,
    };
  }, [filtered]);

  const regimeData = useMemo(() => {
    const map = {};
    filtered.forEach((x) => {
      const k = regimeOf(x);
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const compareData = useMemo(() => {
    const groups = {};
    filtered.forEach((x) => {
      const k = activityOf(x);
      if (!groups[k]) groups[k] = { name: k, atual: 0, recomendado: 0 };
      groups[k].atual += currentOf(x);
      groups[k].recomendado += recommendedOf(x);
    });
    return Object.values(groups);
  }, [filtered]);

  const opportunities = useMemo(
    () =>
      filtered
        .map((x) => ({
          ...x,
          atualCalc: currentOf(x),
          recomendadoCalc: recommendedOf(x),
          gap: Math.max(0, recommendedOf(x) - currentOf(x)),
        }))
        .filter((x) => x.atualCalc > 0 && x.gap > 0)
        .sort((a, b) => b.gap - a.gap),
    [filtered]
  );


  const crmFiltered = useMemo(
    () => raw.crm.filter((item) => inPeriod(crmDateOf(item), periodo)),
    [raw.crm, periodo]
  );

  const crmMetrics = useMemo(() => {
    const abertas = crmFiltered.filter(
      (item) => !["ganho", "perdido"].includes(item.etapa)
    );
    const ganhos = crmFiltered.filter((item) => item.etapa === "ganho");
    const perdidos = crmFiltered.filter((item) => item.etapa === "perdido");
    const encerradas = ganhos.length + perdidos.length;
    const pipeline = abertas.reduce(
      (sum, item) => sum + num(item.valorMensal),
      0
    );
    const mrrGanho = ganhos.reduce(
      (sum, item) => sum + num(item.valorMensal),
      0
    );
    const conversao = encerradas ? (ganhos.length / encerradas) * 100 : 0;
    const ticketGanho = ganhos.length ? mrrGanho / ganhos.length : 0;
    const followupsVencidos = abertas.filter(followupVencidoCRM).length;

    const funil = CRM_ETAPAS.map((etapa) => {
      const itens = crmFiltered.filter((item) => item.etapa === etapa.id);
      return {
        name: etapa.nome,
        quantidade: itens.length,
        valor: itens.reduce((sum, item) => sum + num(item.valorMensal), 0),
      };
    });

    const origensMap = {};
    crmFiltered.forEach((item) => {
      const origem = item.origem?.trim() || "Não informada";
      origensMap[origem] = (origensMap[origem] || 0) + 1;
    });
    const origens = Object.entries(origensMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const perdasMap = {};
    perdidos.forEach((item) => {
      const motivo = item.motivoPerda?.trim() || "Não informado";
      perdasMap[motivo] = (perdasMap[motivo] || 0) + 1;
    });
    const perdas = Object.entries(perdasMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      total: crmFiltered.length,
      abertas,
      ganhos,
      perdidos,
      pipeline,
      mrrGanho,
      conversao,
      ticketGanho,
      followupsVencidos,
      funil,
      origens,
      perdas,
    };
  }, [crmFiltered]);

  const propostasMetrics = useMemo(() => {
    const propostas = raw.propostas.filter((item) =>
      inPeriod(dateOf(item), periodo)
    );
    const aceitas = propostas.filter(
      (item) =>
        String(item.status || "").toLowerCase() === "aceita" ||
        String(item.status || "").toLowerCase() === "aceito"
    );
    const valorAceito = aceitas.reduce(
      (sum, item) =>
        sum +
        num(
          item.valorMensal ??
            item.valor_mensal ??
            item.dados?.valorMensal ??
            item.dados?.valor_total_mensal
        ),
      0
    );
    return {
      total: propostas.length,
      aceitas: aceitas.length,
      valorAceito,
    };
  }, [raw.propostas, periodo]);

  const exportRows = filtered.map((x) => {
    const atual = currentOf(x);
    const rec = recommendedOf(x);
    return {
      Origem: x.origem,
      Cliente: nameOf(x),
      CNPJ: x.cnpj || "",
      Regime: regimeOf(x),
      Atividade: activityOf(x),
      Faturamento: num(x.faturamento),
      Colaboradores: num(x.colaboradores),
      "Honorário atual": atual,
      "Referência PrecificaCont": rec,
      "Valor negociado": negotiatedOf(x),
      "Total mensal": totalMensalOf(x),
      "Serviços mensais": servicosMensaisOf(x),
      "Serviços pontuais": servicosPontuaisOf(x),
      Filiais: quantidadeFiliaisOf(x),
      "Valor filiais": valorFiliaisOf(x),
      Tipo: tipoOf(x),
      "Oportunidade mensal": atual > 0 ? Math.max(0, rec - atual) : 0,
      Status: x.status || "",
      Data: dateOf(x)?.toLocaleDateString("pt-BR") || "",
    };
  });

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const resumo = [
      ["PRECIFICACONT — RELATÓRIO EXECUTIVO"],
      [],
      ["Indicador", "Valor"],
      ["Registros analisados", metrics.total],
      ["Referência total mensal", metrics.somaRec],
      ["Ticket médio recomendado", metrics.ticket],
      ["Clientes abaixo da referência", metrics.defasados],
      ["Oportunidade mensal", metrics.oportunidade],
      ["Oportunidade anual", metrics.anual],
      ["Filiais analisadas", metrics.totalFiliais],
      ["Valor atribuído às filiais", metrics.valorFiliais],
      ["Serviços adicionais mensais", metrics.servicosMensais],
      ["Serviços adicionais pontuais", metrics.servicosPontuais],
      ["Simulações rápidas", metrics.rapidas],
      ["Simulações detalhadas", metrics.detalhadas],
      [],
      ["Filtros"],
      ["Período", periodo === "todos" ? "Todo o período" : `Últimos ${periodo} dias`],
      ["Regime", regime],
      ["Atividade", atividade],
      ["Tipo", tipo],
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
    wsResumo["!cols"] = [{ wch: 34 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Executivo");

    const wsDados = XLSX.utils.json_to_sheet(exportRows);
    wsDados["!cols"] = [
      { wch: 16 }, { wch: 32 }, { wch: 20 }, { wch: 20 }, { wch: 22 },
      { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 24 }, { wch: 18 },
      { wch: 22 }, { wch: 18 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDados, "Dados");

    const opp = opportunities.map((x) => ({
      Cliente: nameOf(x),
      "Honorário atual": x.atualCalc,
      "Referência PrecificaCont": x.recomendadoCalc,
      "Potencial mensal": x.gap,
      "Potencial anual": x.gap * 12,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(opp), "Oportunidades");

    const crmRows = crmFiltered.map((item) => ({
      Cliente: item.cliente || "",
      Documento: item.documento || "",
      Etapa: etapaCRMNome(item.etapa),
      Origem: item.origem || "",
      "Valor mensal": num(item.valorMensal),
      Contato: item.contato || "",
      Email: item.email || "",
      Telefone: item.telefone || "",
      "Próxima atividade":
        atividadePendenteCRM(item)?.titulo || item.proximaAtividade || "",
      "Data follow-up":
        atividadePendenteCRM(item)?.data || item.dataFollowup || "",
      "Follow-up vencido": followupVencidoCRM(item) ? "Sim" : "Não",
      "Motivo perda": item.motivoPerda || "",
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(crmRows),
      "CRM Comercial"
    );

    const resumoComercial = [
      ["PRECIFICACONT — BI COMERCIAL"],
      [],
      ["Indicador", "Valor"],
      ["Oportunidades CRM", crmMetrics.total],
      ["Oportunidades abertas", crmMetrics.abertas.length],
      ["Pipeline mensal", crmMetrics.pipeline],
      ["Oportunidades ganhas", crmMetrics.ganhos.length],
      ["MRR ganho", crmMetrics.mrrGanho],
      ["Conversão", crmMetrics.conversao / 100],
      ["Ticket médio ganho", crmMetrics.ticketGanho],
      ["Follow-ups vencidos", crmMetrics.followupsVencidos],
      ["Propostas", propostasMetrics.total],
      ["Propostas aceitas", propostasMetrics.aceitas],
      ["Valor mensal aceito", propostasMetrics.valorAceito],
    ];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(resumoComercial),
      "BI Comercial"
    );

    XLSX.writeFile(wb, `PrecificaCont_Relatorio_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PrecificaCont", 14, 16);
    doc.setFontSize(12);
    doc.text("Relatório Executivo de Precificação", 14, 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 31);

    autoTable(doc, {
      startY: 38,
      head: [["Indicador", "Resultado"]],
      body: [
        ["Registros analisados", String(metrics.total)],
        ["Referência mensal analisada", money(metrics.somaRec)],
        ["Ticket médio recomendado", money(metrics.ticket)],
        ["Clientes abaixo da referência", String(metrics.defasados)],
        ["Potencial adicional mensal", money(metrics.oportunidade)],
        ["Potencial adicional anual", money(metrics.anual)],
      ],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [["BI Comercial", "Resultado"]],
      body: [
        ["Oportunidades abertas", String(crmMetrics.abertas.length)],
        ["Pipeline mensal", money(crmMetrics.pipeline)],
        ["Oportunidades ganhas", String(crmMetrics.ganhos.length)],
        ["MRR ganho", money(crmMetrics.mrrGanho)],
        ["Conversão", `${crmMetrics.conversao.toFixed(1)}%`],
        ["Ticket médio ganho", money(crmMetrics.ticketGanho)],
        ["Follow-ups vencidos", String(crmMetrics.followupsVencidos)],
        ["Propostas aceitas", `${propostasMetrics.aceitas} de ${propostasMetrics.total}`],
      ],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Cliente", "Regime", "Atividade", "Atual", "Recomendado", "Potencial/mês"]],
      body: opportunities.slice(0, 30).map((x) => [
        nameOf(x),
        regimeOf(x),
        activityOf(x),
        money(x.atualCalc),
        money(x.recomendadoCalc),
        money(x.gap),
      ]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
    });

    doc.save(`PrecificaCont_Relatorio_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"];

  const RELATORIOS_DARK_CSS = `
    html.dark .relatorios-page {
      background:
        radial-gradient(circle at 88% 0%, rgba(37,99,235,.12), transparent 28rem),
        radial-gradient(circle at 10% 92%, rgba(14,165,233,.06), transparent 30rem),
        #07101f !important;
      color: #e5edf8;
    }

    html.dark .relatorios-page .bg-white {
      background-color: #0c1a2f !important;
    }
    html.dark .relatorios-page .bg-slate-50,
    html.dark .relatorios-page .bg-slate-50\/60 {
      background-color: #10213a !important;
    }
    html.dark .relatorios-page .bg-slate-100 {
      background-color: #13233a !important;
    }
    html.dark .relatorios-page .bg-slate-950 {
      background-color: #050c18 !important;
    }

    html.dark .relatorios-page .border-slate-100,
    html.dark .relatorios-page .border-slate-200,
    html.dark .relatorios-page .border-slate-300 {
      border-color: rgba(96,165,250,.17) !important;
    }

    html.dark .relatorios-page .text-slate-950,
    html.dark .relatorios-page .text-slate-900,
    html.dark .relatorios-page .text-slate-800 {
      color: #f8fafc !important;
    }
    html.dark .relatorios-page .text-slate-700,
    html.dark .relatorios-page .text-slate-600 {
      color: #cbd5e1 !important;
    }
    html.dark .relatorios-page .text-slate-500 {
      color: #9fb0c7 !important;
    }
    html.dark .relatorios-page .text-slate-400 {
      color: #71839c !important;
    }
    html.dark .relatorios-page .text-slate-300 {
      color: #64748b !important;
    }

    html.dark .relatorios-page .text-blue-700,
    html.dark .relatorios-page .text-blue-800 {
      color: #60a5fa !important;
    }
    html.dark .relatorios-page .text-emerald-700,
    html.dark .relatorios-page .text-emerald-800 {
      color: #34d399 !important;
    }
    html.dark .relatorios-page .text-violet-700 {
      color: #a78bfa !important;
    }
    html.dark .relatorios-page .text-amber-700 {
      color: #fbbf24 !important;
    }
    html.dark .relatorios-page .text-rose-700 {
      color: #fb7185 !important;
    }

    html.dark .relatorios-page .bg-blue-50 {
      background-color: rgba(37,99,235,.15) !important;
    }
    html.dark .relatorios-page .bg-emerald-50,
    html.dark .relatorios-page .bg-emerald-100 {
      background-color: rgba(16,185,129,.14) !important;
    }
    html.dark .relatorios-page .bg-amber-50 {
      background-color: rgba(245,158,11,.14) !important;
    }
    html.dark .relatorios-page .bg-violet-50 {
      background-color: rgba(139,92,246,.15) !important;
    }
    html.dark .relatorios-page .bg-rose-50,
    html.dark .relatorios-page .bg-rose-50\/60 {
      background-color: rgba(244,63,94,.13) !important;
    }

    html.dark .relatorios-page .border-blue-100,
    html.dark .relatorios-page .border-blue-200 {
      border-color: rgba(96,165,250,.22) !important;
    }
    html.dark .relatorios-page .border-emerald-100,
    html.dark .relatorios-page .border-emerald-200 {
      border-color: rgba(52,211,153,.20) !important;
    }

    html.dark .relatorios-page select,
    html.dark .relatorios-page input,
    html.dark .relatorios-page textarea {
      background-color: #09172a !important;
      border-color: rgba(96,165,250,.22) !important;
      color: #f8fafc !important;
      color-scheme: dark;
    }
    html.dark .relatorios-page select option {
      background: #09172a;
      color: #f8fafc;
    }

    html.dark .relatorios-page table thead {
      background-color: #10213a !important;
      color: #9fb0c7 !important;
    }
    html.dark .relatorios-page table tbody {
      background-color: #0c1a2f;
    }
    html.dark .relatorios-page table tbody tr {
      border-color: rgba(96,165,250,.10) !important;
    }
    html.dark .relatorios-page table tbody tr:hover {
      background-color: #102440 !important;
    }

    html.dark .relatorios-page .hover\:bg-slate-50:hover,
    html.dark .relatorios-page .hover\:bg-slate-800:hover {
      background-color: #18304f !important;
    }
    html.dark .relatorios-page .hover\:bg-emerald-100:hover {
      background-color: rgba(16,185,129,.20) !important;
    }

    html.dark .relatorios-page .shadow-sm,
    html.dark .relatorios-page .shadow-lg,
    html.dark .relatorios-page .shadow-2xl {
      box-shadow: 0 18px 45px rgba(0,0,0,.20) !important;
    }

    html.dark .relatorios-page .fixed.inset-0.bg-slate-950\/50 {
      background-color: rgba(2,6,23,.78) !important;
    }

    html.dark .relatorios-page .recharts-cartesian-grid line {
      stroke: rgba(148,163,184,.16);
    }
    html.dark .relatorios-page .recharts-cartesian-axis-tick-value,
    html.dark .relatorios-page .recharts-pie-label-text {
      fill: #9fb0c7;
    }
    html.dark .relatorios-page .recharts-default-tooltip {
      background: #0b1729 !important;
      border: 1px solid rgba(96,165,250,.22) !important;
      border-radius: 12px !important;
      color: #f8fafc !important;
    }
    html.dark .relatorios-page .recharts-tooltip-label,
    html.dark .relatorios-page .recharts-tooltip-item {
      color: #e5edf8 !important;
    }

    /* CORREÇÃO DE CONTRASTE — blocos que permaneciam claros no Dark */
    html.dark .relatorios-page [class~="bg-slate-50"],
    html.dark .relatorios-page [class*="bg-slate-50/"],
    html.dark .relatorios-page [class~="bg-white/5"] {
      background-color: #10213a !important;
      color: #e5edf8 !important;
    }

    html.dark .relatorios-page [class*="bg-rose-50/"] {
      background-color: rgba(244,63,94,.13) !important;
    }

    html.dark .relatorios-page [class~="bg-emerald-50"] {
      background-color: rgba(16,185,129,.14) !important;
    }

    html.dark .relatorios-page [class~="bg-blue-50"] {
      background-color: rgba(37,99,235,.15) !important;
    }

    html.dark .relatorios-page [class*="text-slate-900"],
    html.dark .relatorios-page [class*="text-slate-800"] {
      color: #f8fafc !important;
    }

    html.dark .relatorios-page [class*="text-slate-700"],
    html.dark .relatorios-page [class*="text-slate-600"] {
      color: #cbd5e1 !important;
    }

    html.dark .relatorios-page [class*="text-slate-500"] {
      color: #9fb0c7 !important;
    }

    html.dark .relatorios-page [class*="text-slate-400"] {
      color: #8294ad !important;
    }

    html.dark .relatorios-page [class*="border-slate-"] {
      border-color: rgba(96,165,250,.17) !important;
    }

    html.dark .relatorios-page [class*="divide-slate-"] > :not([hidden]) ~ :not([hidden]) {
      border-color: rgba(96,165,250,.10) !important;
    }

    /* Cards específicos de Propostas */
    html.dark .relatorios-page [class*="bg-emerald-50"] .text-emerald-700,
    html.dark .relatorios-page [class*="bg-emerald-50"] .text-emerald-800 {
      color: #34d399 !important;
    }

    html.dark .relatorios-page [class*="bg-blue-50"] .text-blue-700,
    html.dark .relatorios-page [class*="bg-blue-50"] .text-blue-800 {
      color: #60a5fa !important;
    }

    /* Tooltips dos gráficos */
    html.dark .relatorios-page .recharts-tooltip-wrapper .recharts-default-tooltip {
      background-color: #09172a !important;
      border-color: rgba(96,165,250,.22) !important;
    }
  `;

  if (!permissoesModulo.carregando && !permissoesModulo.pode_visualizar) {
    return (
      <div className="min-h-full bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Relatórios</h2>
          <p className="mt-2 text-sm text-slate-600">
            Seu perfil não possui permissão para visualizar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relatorios-page min-h-screen bg-slate-50">
      <style>{RELATORIOS_DARK_CSS}</style>
      <div className="max-w-[1500px] mx-auto px-4 md:px-6 py-7">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 mb-7">
          <div>
            <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold">
              <BarChart3 size={17} />
              Business Intelligence
            </div>
            <h1 className="text-3xl font-bold text-slate-950 mt-1">Relatórios</h1>
            <p className="text-slate-500 mt-1">
              Inteligência comercial, precificação e oportunidades da carteira.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRefresh((x) => x + 1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw size={16} /> Atualizar
            </button>
            {permissoesModulo.pode_criar ? (
              <>
                <button
                  onClick={exportExcel}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  <FileSpreadsheet size={17} /> Exportar Excel
                </button>
                <button
                  onClick={exportPDF}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <FileText size={17} /> Gerar PDF
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={17} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Filtros do relatório</span>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <SelectPrecificaCont
              value={periodo}
              onChange={setPeriodo}
              options={[
                { value: "todos", label: "Período" },
                { value: "30", label: "Últimos 30 dias" },
                { value: "90", label: "Últimos 90 dias" },
                { value: "365", label: "Últimos 12 meses" },
              ]}
              placeholder=""
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
            />
            <SelectPrecificaCont
              value={regime}
              onChange={setRegime}
              options={[
                { value: "todos", label: "Regime" },
                ...regimes.map((x) => ({ value: x, label: x })),
              ]}
              placeholder=""
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
            />
            <SelectPrecificaCont
              value={atividade}
              onChange={setAtividade}
              options={[
                { value: "todos", label: "Atividade" },
                ...atividades.map((x) => ({ value: x, label: x })),
              ]}
              placeholder=""
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
            />
            <SelectPrecificaCont
              value={tipo}
              onChange={setTipo}
              options={[
                { value: "todos", label: "Tipo" },
                { value: "Rápida", label: "Simulação Rápida" },
                { value: "Detalhada", label: "Simulação Detalhada" },
                { value: "Reprecificação", label: "Reprecificação" },
              ]}
              placeholder=""
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <Stat icon={Target} label="Registros analisados" value={metrics.total.toLocaleString("pt-BR")} detail="Simulações + reprecificação" />
          <Stat icon={Wallet} label="Ticket médio recomendado" value={money(metrics.ticket)} detail="Referência PrecificaCont" tone="violet" />
          <Stat icon={TrendingUp} label="Potencial mensal" value={money(metrics.oportunidade)} detail={`${metrics.defasados} abaixo da referência`} tone="emerald" />
          <Stat icon={ArrowUpRight} label="Potencial anual" value={money(metrics.anual)} detail="Projeção de 12 meses" tone="amber" />
          <Stat icon={GitBranch} label="Filiais analisadas" value={metrics.totalFiliais.toLocaleString("pt-BR")} detail={money(metrics.valorFiliais)} tone="violet" />
          <Stat icon={PackagePlus} label="Serviços adicionais" value={money(metrics.servicosMensais)} detail={`${money(metrics.servicosPontuais)} pontuais`} tone="blue" />
        </div>

        <div className="mt-5 rounded-2xl bg-slate-950 text-white p-6 shadow-lg">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] font-semibold text-blue-300">Radar de oportunidade</div>
              <div className="text-3xl md:text-4xl font-bold mt-2">{money(metrics.oportunidade)}<span className="text-base font-normal text-slate-400"> / mês</span></div>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                Soma da diferença positiva entre honorários atuais informados e a referência recomendada pelo PrecificaCont.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xl font-bold text-amber-300">{metrics.defasados}</div>
                <div className="text-xs text-slate-400 mt-1">Abaixo</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xl font-bold text-emerald-300">{metrics.adequado}</div>
                <div className="text-xs text-slate-400 mt-1">Na faixa</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xl font-bold text-blue-300">{metrics.acima}</div>
                <div className="text-xs text-slate-400 mt-1">Acima</div>
              </div>
            </div>
          </div>
        </div>


        <div className="mt-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold">
                <Handshake size={17} />
                CRM Comercial
              </div>
              <h2 className="text-xl font-bold text-slate-950 mt-1">
                Performance comercial
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Dados do CRM integrados ao BI geral do PrecificaCont.
              </p>
            </div>

            {permissoesCRM.pode_visualizar && permissoesCRM.pode_criar ? (
              <button
                type="button"
                onClick={() => abrirCRM({ acao: "nova_oportunidade" })}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                <PackagePlus size={16} />
                Nova oportunidade
              </button>
            ) : null}
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-4">
            <Stat
              icon={Handshake}
              label="Oportunidades abertas"
              value={crmMetrics.abertas.length.toLocaleString("pt-BR")}
              detail={`${crmMetrics.total} no período`}
              onClick={() => abrirCRM({ status: "abertas" })}
            />
            <Stat
              icon={CircleDollarSign}
              label="Pipeline mensal"
              value={money(crmMetrics.pipeline)}
              detail="Oportunidades em aberto"
              tone="violet"
              onClick={() => abrirCRM({ status: "abertas" })}
            />
            <Stat
              icon={CheckCircle2}
              label="MRR ganho"
              value={money(crmMetrics.mrrGanho)}
              detail={`${crmMetrics.ganhos.length} oportunidade(s)`}
              tone="emerald"
              onClick={() => abrirCRM({ etapa: "ganho" })}
            />
            <Stat
              icon={Target}
              label="Conversão"
              value={`${crmMetrics.conversao.toFixed(1)}%`}
              detail="Ganhos sobre encerradas"
              tone="emerald"
              onClick={() => abrirCRM({ status: "encerradas" })}
            />
            <Stat
              icon={Wallet}
              label="Ticket médio ganho"
              value={money(crmMetrics.ticketGanho)}
              detail="Receita mensal"
              tone="amber"
              onClick={() => abrirCRM({ etapa: "ganho" })}
            />
            <Stat
              icon={Clock3}
              label="Follow-ups vencidos"
              value={crmMetrics.followupsVencidos.toLocaleString("pt-BR")}
              detail="Exigem atenção comercial"
              tone="amber"
              onClick={() => abrirCRM({ followup: "vencido" })}
            />
          </div>

          <div className="grid xl:grid-cols-[1.35fr_.65fr] gap-5 mt-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900">Funil comercial</h3>
              <p className="text-xs text-slate-500 mt-1">
                Distribuição atual das oportunidades por etapa.
              </p>
              <div className="h-[300px] mt-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crmMetrics.funil}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "valor" ? money(value) : value
                      }
                    />
                    <Bar
                      dataKey="quantidade"
                      name="Oportunidades"
                      fill="#2563eb"
                      radius={[5, 5, 0, 0]}
                      cursor="pointer"
                      onClick={(data) => {
                        const etapa = CRM_ETAPAS.find(
                          (item) => item.nome === data?.name
                        );
                        if (etapa) abrirCRM({ etapa: etapa.id });
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900">Propostas</h3>
              <p className="text-xs text-slate-500 mt-1">
                Indicadores de propostas no período.
              </p>
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => abrirPropostas({ status: "todas" })}
                  className="w-full text-left rounded-xl bg-slate-50 border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition"
                >
                  <div className="text-xs text-slate-500">Propostas geradas</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {propostasMetrics.total}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => abrirPropostas({ status: "aceita" })}
                  className="w-full text-left rounded-xl bg-emerald-50 border border-emerald-100 p-4 hover:border-emerald-300 hover:shadow-sm transition"
                >
                  <div className="text-xs text-emerald-700">Propostas aceitas</div>
                  <div className="text-2xl font-bold text-emerald-800 mt-1">
                    {propostasMetrics.aceitas}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => abrirPropostas({ status: "aceita" })}
                  className="w-full text-left rounded-xl bg-blue-50 border border-blue-100 p-4 hover:border-blue-300 hover:shadow-sm transition"
                >
                  <div className="text-xs text-blue-700">Valor mensal aceito</div>
                  <div className="text-xl font-bold text-blue-800 mt-1">
                    {money(propostasMetrics.valorAceito)}
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-5 mt-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-violet-600" />
                <h3 className="font-bold text-slate-900">Origem das oportunidades</h3>
              </div>
              <div className="mt-4 space-y-3">
                {crmMetrics.origens.length ? (
                  crmMetrics.origens.slice(0, 8).map((item) => (
                    <div
                      key={item.name}
                      role="button"
                      tabIndex={0}
                      onClick={() => abrirCRM({ origem: item.name })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") abrirCRM({ origem: item.name });
                      }}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {item.name}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {item.value}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 py-8 text-center">
                    Nenhuma origem registrada.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <XCircle size={18} className="text-rose-600" />
                <h3 className="font-bold text-slate-900">Motivos de perda</h3>
              </div>
              <div className="mt-4 space-y-3">
                {crmMetrics.perdas.length ? (
                  crmMetrics.perdas.slice(0, 8).map((item) => (
                    <div
                      key={item.name}
                      role="button"
                      tabIndex={0}
                      onClick={() => abrirCRM({ motivoPerda: item.name, etapa: "perdido" })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") abrirCRM({ motivoPerda: item.name, etapa: "perdido" });
                      }}
                      className="flex items-center justify-between rounded-xl bg-rose-50/60 px-4 py-3 cursor-pointer hover:bg-rose-50"
                    >
                      <span className="text-sm text-slate-700">{item.name}</span>
                      <span className="text-sm font-bold text-rose-700">
                        {item.value}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 py-8 text-center">
                    Nenhuma perda registrada.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mt-5 overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">
                Negociações do CRM
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Visão consolidada das oportunidades comerciais. Clique em uma negociação para abrir no CRM.
                A lista possui rolagem própria para não alongar a página.
              </p>
            </div>
            {crmFiltered.length ? (
              <div className="max-h-[430px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 shadow-sm">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold">Cliente</th>
                      <th className="text-left px-5 py-3 font-semibold">Etapa</th>
                      <th className="text-left px-5 py-3 font-semibold">Origem</th>
                      <th className="text-right px-5 py-3 font-semibold">Mensal</th>
                      <th className="text-left px-5 py-3 font-semibold">Próxima atividade</th>
                      <th className="text-center px-5 py-3 font-semibold">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {crmFiltered.map((item) => {
                      const proxima = atividadePendenteCRM(item);
                      const vencido = followupVencidoCRM(item);
                      return (
                        <tr
                          key={item.id}
                          onClick={() => abrirCRM({ oportunidadeId: item.id })}
                          className="hover:bg-slate-50 cursor-pointer"
                          title="Abrir oportunidade no CRM"
                        >
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            {item.cliente || "Sem identificação"}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {etapaCRMNome(item.etapa)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">
                            {item.origem || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold">
                            {money(item.valorMensal)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">
                            {proxima?.titulo || item.proximaAtividade || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {vencido ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                                Follow-up vencido
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                Em dia
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-slate-400">
                Nenhuma oportunidade do CRM encontrada para o período.
              </div>
            )}
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-5 mt-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Atual x Referência PrecificaCont</h2>
            <p className="text-xs text-slate-500 mt-1">Comparativo agregado por atividade</p>
            <div className="h-[310px] mt-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Bar dataKey="atual" name="Honorário atual" fill="#94a3b8" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="recomendado" name="Referência" fill="#2563eb" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Distribuição por regime</h2>
            <p className="text-xs text-slate-500 mt-1">Perfil tributário da base analisada</p>
            <div className="h-[310px] mt-5">
              {regimeData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={regimeData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105} paddingAngle={3} label>
                      {regimeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">Sem dados para o filtro selecionado.</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mt-5 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900">Maiores oportunidades de reprecificação</h2>
              <p className="text-xs text-slate-500 mt-1">Ordenadas pelo potencial adicional mensal.</p>
            </div>
            <TrendingDown size={20} className="text-amber-600" />
          </div>

          {opportunities.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left font-semibold px-5 py-3">Cliente</th>
                    <th className="text-left font-semibold px-5 py-3">Regime</th>
                    <th className="text-left font-semibold px-5 py-3">Tipo</th>
                    <th className="text-center font-semibold px-5 py-3">Filiais</th>
                    <th className="text-right font-semibold px-5 py-3">Atual</th>
                    <th className="text-right font-semibold px-5 py-3">Referência</th>
                    <th className="text-right font-semibold px-5 py-3">Potencial/mês</th>
                    <th className="text-right font-semibold px-5 py-3">Potencial/ano</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opportunities.slice(0, 15).map((x, i) => (
                    <tr
                      key={`${nameOf(x)}-${i}`}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setDetalhes(x)}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900">{nameOf(x)}</td>
                      <td className="px-5 py-3.5 text-slate-500">{regimeOf(x)}</td>
                      <td className="px-5 py-3.5 text-slate-500">{tipoOf(x)}</td>
                      <td className="px-5 py-3.5 text-center">{quantidadeFiliaisOf(x)}</td>
                      <td className="px-5 py-3.5 text-right">{money(x.atualCalc)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold">{money(x.recomendadoCalc)}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-emerald-700">{money(x.gap)}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600">{money(x.gap * 12)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users size={30} className="mx-auto text-slate-300" />
              <div className="font-semibold text-slate-700 mt-3">Nenhuma oportunidade identificada</div>
              <p className="text-sm text-slate-400 mt-1">
                Informe o honorário atual nas análises para comparar com a referência PrecificaCont.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 text-xs text-slate-400 flex items-center gap-2">
          <Download size={14} />
          As exportações respeitam os filtros aplicados nesta tela.
        </div>

        {detalhes && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm p-4 flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">
                      {nameOf(detalhes)}
                    </h2>
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                      {tipoOf(detalhes)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {regimeOf(detalhes)} • {activityOf(detalhes)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDetalhes(null)}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Stat icon={Wallet} label="Honorário atual" value={money(currentOf(detalhes))} />
                  <Stat icon={Target} label="Referência" value={money(recommendedOf(detalhes))} tone="violet" />
                  <Stat icon={PackagePlus} label="Serviços mensais" value={money(servicosMensaisOf(detalhes))} tone="emerald" />
                  <Stat icon={GitBranch} label="Filiais" value={String(quantidadeFiliaisOf(detalhes))} tone="amber" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-900 mb-4">Perfil</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4"><span className="text-slate-500">CNPJ</span><span>{detalhes.cnpj || "—"}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Faturamento</span><span>{money(detalhes.faturamento)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Colaboradores</span><span>{num(detalhes.colaboradores)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Documentos</span><span>{num(detalhes.total_documentos || detalhes.totalDocumentos)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Origem</span><span>{detalhes.origem || "—"}</span></div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-900 mb-4">Composição</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Total mensal</span><strong>{money(totalMensalOf(detalhes))}</strong></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Serviços pontuais</span><span>{money(servicosPontuaisOf(detalhes))}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Valor das filiais</span><span>{money(valorFiliaisOf(detalhes))}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Oportunidade</span><strong className="text-emerald-700">{money(Math.max(0, recommendedOf(detalhes) - currentOf(detalhes)))}</strong></div>
                    </div>
                  </div>
                </div>

                {servicosOf(detalhes).length > 0 && (
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Serviços adicionais ({servicosOf(detalhes).length})
                    </h3>
                    <div className="divide-y divide-slate-100">
                      {servicosOf(detalhes).map((s, i) => (
                        <div key={`${s.id || s.nome}-${i}`} className="py-3 flex justify-between gap-4 text-sm">
                          <div>
                            <div className="font-medium text-slate-800">{s.nome || "Serviço"}</div>
                            <div className="text-xs text-slate-400">
                              {s.recorrencia === "mensal" ? "Mensal" : "Pontual"} • {num(s.quantidade || 1)} un.
                            </div>
                          </div>
                          <div className="font-semibold">{money(num(s.valor_unitario) * num(s.quantidade || 1))}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filiaisOf(detalhes).length > 0 && (
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Filiais ({filiaisOf(detalhes).length})
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {filiaisOf(detalhes).map((f, i) => (
                        <div key={f.id || i} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                          <div className="font-semibold text-slate-900">Filial {i + 1}</div>
                          <div className="text-sm text-slate-500 mt-2 space-y-1">
                            <div>{f.regime || "Regime não informado"}</div>
                            <div>{f.atividade || "Atividade não informada"}</div>
                            <div>Faturamento: {money(f.faturamento)}</div>
                            <div>{f.centralizada !== false ? "Centralizada" : "Descentralizada"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
