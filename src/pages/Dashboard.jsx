import React, { useEffect, useMemo, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Gauge,
  Lightbulb,
  Percent,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* =========================================================
   PRECIFICACONT — DASHBOARD EXECUTIVO
   Mantém os dados atuais do navegador e amplia a leitura
   estratégica usando Simulações, Clientes, Propostas e CRM.
========================================================= */

const STORAGE = {
  simulacoes: "precificacont_simulacoes",
  clientes: "precificacont_clientes",
  propostas: "precificacont_propostas",
  crm: "precificacont_crm_oportunidades",
};

const ESCRITORIO_ATIVO_KEY = "precificacont_escritorio_ativo";

function getEscritorioAtivoId() {
  return localStorage.getItem(ESCRITORIO_ATIVO_KEY) || "";
}

function scopedStorageKey(baseKey) {
  const escritorioId = getEscritorioAtivoId();
  return escritorioId ? `${baseKey}:${escritorioId}` : baseKey;
}

const BLUE = "#087CFA";
const NAVY = "#0B1F4B";
const TEAL = "#12B8A6";
const EMERALD = "#10B981";
const AMBER = "#F59E0B";
const ROSE = "#F43F5E";
const SLATE = "#94A3B8";

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(scopedStorageKey(key)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function numberValue(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const text = String(value ?? "").trim();
  if (!text) return 0;

  if (text.includes(",")) {
    const parsed = Number(
      text
        .replace(/R\$/gi, "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
    );
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(text.replace(/R\$/gi, "").replace(/\s/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return numberValue(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function compactMoney(value) {
  const n = numberValue(value);

  if (Math.abs(n) >= 1_000_000) {
    return `R$ ${(n / 1_000_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mi`;
  }

  if (Math.abs(n) >= 1_000) {
    return `R$ ${(n / 1_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mil`;
  }

  return money(n);
}

function integer(value) {
  return numberValue(value).toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });
}

function percent(value) {
  return `${numberValue(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateBR(value) {
  const date = safeDate(value);
  return date ? date.toLocaleDateString("pt-BR") : "—";
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date) {
  return date
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getSimulationValue(item) {
  return numberValue(
    item.valor_negociado ||
      item.valor_tabela ||
      item.resultado?.recommended ||
      item.resultado?.indice ||
      item.pricing_snapshot?.resultado?.indice ||
      0
  );
}

function getSimulationReference(item) {
  return numberValue(
    item.valor_tabela ||
      item.resultado?.indice ||
      item.pricing_snapshot?.resultado?.indice ||
      item.valor_negociado ||
      0
  );
}

function getProposalMonthlyValue(item) {
  return numberValue(
    item.valores?.mensalidade_total ||
      item.valores?.total_mensal ||
      item.valor_mensal ||
      item.valor_negociado ||
      item.valor ||
      0
  );
}

function getProposalStatus(item) {
  return String(item.status || item.aceite?.status || "").toLowerCase();
}

function getClientCurrentFee(item) {
  return numberValue(
    item.honorario_atual ||
      item.honorarioAtual ||
      item.valor_atual ||
      item.mensalidade_atual ||
      0
  );
}

function getClientReference(item) {
  return numberValue(
    item.honorario_recomendado ||
      item.honorarioRecomendado ||
      item.recomendado ||
      item.indice ||
      0
  );
}

function getCreatedAt(item) {
  return (
    item.created_date ||
    item.created_at ||
    item.criado_em ||
    item.data_criacao ||
    item.atualizado_em ||
    null
  );
}

function getClientName(item) {
  return (
    item.client_nome ||
    item.cliente ||
    item.razao_social ||
    item.nome_fantasia ||
    "Cliente não identificado"
  );
}

function isSameMonth(dateValue, reference) {
  const date = safeDate(dateValue);
  if (!date) return false;

  return (
    date.getMonth() === reference.getMonth() &&
    date.getFullYear() === reference.getFullYear()
  );
}

function previousMonth(reference) {
  return new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
}

function deltaPercent(current, previous) {
  const atual = numberValue(current);
  const anterior = numberValue(previous);

  if (!anterior) return null;
  return ((atual - anterior) / anterior) * 100;
}

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="mb-2 text-xs font-semibold text-slate-500">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-6 text-xs"
          >
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <strong className="text-slate-900">{money(item.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  eyebrow,
  label,
  value,
  helper,
  delta,
  accent = "blue",
  strong = false,
  onClick,
}) {
  const tones = {
    blue: {
      icon: "bg-blue-50 text-blue-700 ring-blue-100",
      glow: "from-blue-500/10 to-transparent",
      line: "bg-blue-500",
    },
    teal: {
      icon: "bg-teal-50 text-teal-700 ring-teal-100",
      glow: "from-teal-500/10 to-transparent",
      line: "bg-teal-500",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      glow: "from-emerald-500/10 to-transparent",
      line: "bg-emerald-500",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700 ring-amber-100",
      glow: "from-amber-500/10 to-transparent",
      line: "bg-amber-500",
    },
    violet: {
      icon: "bg-violet-50 text-violet-700 ring-violet-100",
      glow: "from-violet-500/10 to-transparent",
      line: "bg-violet-500",
    },
  };

  const tone = tones[accent] || tones.blue;
  const positive = delta !== null && delta !== undefined && delta >= 0;

  return (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group relative overflow-hidden rounded-[22px] border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        onClick ? "cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-100" : ""
      } ${
        strong
          ? "border-slate-800 bg-slate-950 text-white shadow-xl"
          : "border-slate-200/80 bg-white shadow-sm"
      }`}
    >
      {!strong && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${tone.glow}`}
        />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p
              className={`mb-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                strong ? "text-blue-600" : "text-slate-500"
              }`}
            >
              {eyebrow}
            </p>
          )}

          <p
            className={`text-sm font-medium ${
              strong ? "text-slate-600" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 truncate text-[27px] font-bold tracking-[-0.04em] ${
              strong ? "text-white" : "text-slate-950"
            }`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${
            strong
              ? "bg-white/10 text-blue-600 ring-white/10"
              : tone.icon
          }`}
        >
          <Icon size={20} strokeWidth={2.2} />
        </div>
      </div>

      <div className="relative mt-4 flex min-h-[20px] items-center justify-between gap-2">
        <p
          className={`truncate text-xs ${
            strong ? "text-slate-500" : "text-slate-500"
          }`}
        >
          {helper}
        </p>

        {delta !== null && delta !== undefined && Number.isFinite(delta) && (
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
              positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {positive ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}
            {Math.abs(delta).toLocaleString("pt-BR", {
              maximumFractionDigits: 1,
            })}
            %
          </span>
        )}
      </div>

      {!strong && (
        <div
          className={`absolute bottom-0 left-0 h-[3px] w-0 ${tone.line} transition-all duration-300 group-hover:w-full`}
        />
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, eyebrow, title, description, right }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Icon size={19} />
          </div>
        )}

        <div>
          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-0.5 text-base font-bold tracking-tight text-slate-950">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {right}
    </div>
  );
}

function InsightRow({
  icon: Icon,
  title,
  description,
  tone = "blue",
  onClick,
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition ${
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
          : ""
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          tones[tone] || tones.blue
        }`}
      >
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}


const DASHBOARD_DARK_CSS = `
  html.dark .precificacont-dashboard {
    background:
      radial-gradient(circle at 18% 0%, rgba(37, 99, 235, 0.13), transparent 32%),
      radial-gradient(circle at 88% 10%, rgba(6, 182, 212, 0.08), transparent 26%),
      linear-gradient(135deg, #061225 0%, #07172c 52%, #061426 100%) !important;
    color: #e5edf8;
  }

  html.dark .precificacont-dashboard > div > section:first-of-type {
    background:
      radial-gradient(circle at 20% 0%, rgba(37, 99, 235, 0.15), transparent 34%),
      linear-gradient(135deg, #0a1c35 0%, #08172b 55%, #071426 100%) !important;
    border-color: rgba(59, 130, 246, 0.28) !important;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22) !important;
  }

  html.dark .precificacont-dashboard > div > section:first-of-type > div.absolute.inset-0 {
    background: transparent !important;
  }

  html.dark .precificacont-dashboard .bg-white,
  html.dark .precificacont-dashboard .bg-white\/95 {
    background-color: #0c1a2f !important;
  }

  html.dark .precificacont-dashboard .bg-slate-50,
  html.dark .precificacont-dashboard .bg-slate-50\/70,
  html.dark .precificacont-dashboard .bg-slate-50\/80 {
    background-color: #0a172a !important;
  }

  html.dark .precificacont-dashboard .bg-slate-100 {
    background-color: #15253d !important;
  }

  html.dark .precificacont-dashboard .border-slate-100,
  html.dark .precificacont-dashboard .border-slate-200,
  html.dark .precificacont-dashboard .border-slate-200\/70,
  html.dark .precificacont-dashboard .border-slate-200\/80,
  html.dark .precificacont-dashboard .border-slate-50 {
    border-color: rgba(96, 165, 250, 0.18) !important;
  }

  html.dark .precificacont-dashboard .text-slate-950,
  html.dark .precificacont-dashboard .text-slate-900,
  html.dark .precificacont-dashboard .text-slate-800,
  html.dark .precificacont-dashboard .text-slate-700 {
    color: #f8fafc !important;
  }

  html.dark .precificacont-dashboard .text-slate-600 {
    color: #d5deeb !important;
  }

  html.dark .precificacont-dashboard .text-slate-500 {
    color: #9fb0c7 !important;
  }

  html.dark .precificacont-dashboard .text-blue-600,
  html.dark .precificacont-dashboard .text-blue-700 {
    color: #38a5ff !important;
  }

  html.dark .precificacont-dashboard .text-teal-300,
  html.dark .precificacont-dashboard .text-teal-600,
  html.dark .precificacont-dashboard .text-teal-700 {
    color: #2dd4bf !important;
  }

  html.dark .precificacont-dashboard .text-emerald-300,
  html.dark .precificacont-dashboard .text-emerald-600,
  html.dark .precificacont-dashboard .text-emerald-700 {
    color: #34d399 !important;
  }

  html.dark .precificacont-dashboard .bg-blue-50 {
    background-color: rgba(37, 99, 235, 0.16) !important;
  }

  html.dark .precificacont-dashboard .bg-teal-50 {
    background-color: rgba(20, 184, 166, 0.14) !important;
  }

  html.dark .precificacont-dashboard .bg-emerald-50 {
    background-color: rgba(16, 185, 129, 0.14) !important;
  }

  html.dark .precificacont-dashboard .bg-violet-50 {
    background-color: rgba(139, 92, 246, 0.15) !important;
  }

  html.dark .precificacont-dashboard .bg-amber-50 {
    background-color: rgba(245, 158, 11, 0.15) !important;
  }

  html.dark .precificacont-dashboard .border-blue-100 {
    border-color: rgba(59, 130, 246, 0.32) !important;
  }

  html.dark .precificacont-dashboard .shadow-sm {
    box-shadow: 0 14px 38px rgba(0, 0, 0, 0.18) !important;
  }

  html.dark .precificacont-dashboard tr.hover\:bg-blue-50\/30:hover,
  html.dark .precificacont-dashboard .hover\:bg-slate-50:hover {
    background-color: rgba(30, 58, 92, 0.58) !important;
  }

  html.dark .precificacont-dashboard .recharts-cartesian-grid line {
    stroke: rgba(148, 163, 184, 0.16) !important;
  }

  html.dark .precificacont-dashboard .recharts-text {
    fill: #9fb0c7 !important;
  }

  html.dark .precificacont-dashboard .dashboard-brand-light {
    display: none !important;
  }

  html:not(.dark) .precificacont-dashboard .dashboard-brand-dark {
    display: none !important;
  }

  html.dark .precificacont-dashboard .dashboard-brand-dark {
    display: block !important;
    width: 300px !important;
    height: 70px !important;
    object-fit: contain !important;
    object-position: left center !important;
  }

  html.dark .precificacont-dashboard [role="button"]:hover {
    border-color: rgba(59, 130, 246, 0.38) !important;
  }


  /* DARK MODE — neutraliza fundos claros/gradientes do layout Light */
  html.dark .precificacont-dashboard .bg-gradient-to-br,
  html.dark .precificacont-dashboard .bg-gradient-to-r,
  html.dark .precificacont-dashboard .bg-gradient-to-b {
    --tw-gradient-from: #0d1c31 var(--tw-gradient-from-position) !important;
    --tw-gradient-to: rgba(13, 28, 49, 0) var(--tw-gradient-to-position) !important;
    --tw-gradient-stops: var(--tw-gradient-from), #0b192c var(--tw-gradient-via-position), #09172a var(--tw-gradient-to-position) !important;
  }

  /* Cards KPI — base escura consistente */
  html.dark .precificacont-dashboard .grid > .rounded-3xl,
  html.dark .precificacont-dashboard .grid > [role="button"],
  html.dark .precificacont-dashboard .rounded-3xl.bg-gradient-to-br {
    background-color: #0d1c31 !important;
    border-color: rgba(96, 165, 250, 0.18) !important;
  }

  /* Cards menores do hero */
  html.dark .precificacont-dashboard .bg-slate-950,
  html.dark .precificacont-dashboard .bg-slate-900 {
    background-color: #08172b !important;
  }

  /* Nunca deixar texto branco sobre card que ainda receba fundo claro */
  html.dark .precificacont-dashboard .grid .text-white {
    color: #f8fafc !important;
  }

  /* Pills do hero */
  html.dark .precificacont-dashboard .rounded-full.bg-white,
  html.dark .precificacont-dashboard .rounded-full.bg-white\/95 {
    background-color: #0b1a2e !important;
    border-color: rgba(96, 165, 250, 0.22) !important;
    color: #dbeafe !important;
  }

  /* Logo: mantém proporção e usa o PNG dark recortado */
  html.dark .precificacont-dashboard .dashboard-brand-dark {
    width: 300px !important;
    height: 70px !important;
    max-width: 300px !important;
    object-fit: contain !important;
    object-position: left center !important;
  }

  /* Corrige cartões de aderência/conversão que estavam cinza */
  html.dark .precificacont-dashboard .bg-white\/80,
  html.dark .precificacont-dashboard .bg-white\/90 {
    background-color: #0b1a2e !important;
  }

  /* COBERTURA GLOBAL DO DASHBOARD DARK
     Corrige também os blocos inferiores sem precisar tratar card por card. */
  html.dark .precificacont-dashboard [class*="bg-white"],
  html.dark .precificacont-dashboard [class*="from-white"],
  html.dark .precificacont-dashboard [class*="via-white"],
  html.dark .precificacont-dashboard [class*="to-white"],
  html.dark .precificacont-dashboard [class*="from-slate-50"],
  html.dark .precificacont-dashboard [class*="via-slate-50"],
  html.dark .precificacont-dashboard [class*="to-slate-50"] {
    background-color: #0c1a2f !important;
    --tw-gradient-from: #0d1c31 var(--tw-gradient-from-position) !important;
    --tw-gradient-to: #09172a var(--tw-gradient-to-position) !important;
    --tw-gradient-stops: var(--tw-gradient-from), #0b192c var(--tw-gradient-via-position), var(--tw-gradient-to) !important;
  }

  html.dark .precificacont-dashboard [class*="border-slate"],
  html.dark .precificacont-dashboard [class*="border-blue-100"] {
    border-color: rgba(96, 165, 250, 0.18) !important;
  }

  html.dark .precificacont-dashboard table,
  html.dark .precificacont-dashboard thead,
  html.dark .precificacont-dashboard tbody,
  html.dark .precificacont-dashboard tr {
    border-color: rgba(96, 165, 250, 0.14) !important;
  }

  html.dark .precificacont-dashboard thead {
    background: #0a172a !important;
  }

  html.dark .precificacont-dashboard tbody tr {
    background: #0c1a2f !important;
  }

  html.dark .precificacont-dashboard tbody tr:hover {
    background: #102440 !important;
  }

  html.dark .precificacont-dashboard table .text-slate-900,
  html.dark .precificacont-dashboard table .text-slate-800,
  html.dark .precificacont-dashboard table .text-slate-700 {
    color: #f1f5f9 !important;
  }

  html.dark .precificacont-dashboard table .text-slate-600,
  html.dark .precificacont-dashboard table .text-slate-500,
  html.dark .precificacont-dashboard table .text-slate-400 {
    color: #9fb0c7 !important;
  }

  /* Área de atividade e demais listas inferiores */
  html.dark .precificacont-dashboard [class*="divide-slate"] > :not([hidden]) ~ :not([hidden]) {
    border-color: rgba(96, 165, 250, 0.12) !important;
  }

  /* Mantém badges/pills funcionais legíveis */
  html.dark .precificacont-dashboard [class*="bg-blue-50"] {
    background-color: rgba(37, 99, 235, 0.18) !important;
  }

  html.dark .precificacont-dashboard [class*="bg-emerald-50"] {
    background-color: rgba(16, 185, 129, 0.16) !important;
  }

  html.dark .precificacont-dashboard [class*="bg-violet-50"] {
    background-color: rgba(139, 92, 246, 0.17) !important;
  }

  html.dark .precificacont-dashboard [class*="bg-amber-50"] {
    background-color: rgba(245, 158, 11, 0.16) !important;
  }


  /* CONTRASTE FINAL — cabeçalhos de tabela e linhas/listas inferiores */
  html.dark .precificacont-dashboard thead,
  html.dark .precificacont-dashboard thead tr,
  html.dark .precificacont-dashboard thead th {
    background: #10213a !important;
    color: #8fb7ea !important;
    border-color: rgba(96, 165, 250, 0.20) !important;
  }

  html.dark .precificacont-dashboard thead th {
    font-weight: 700 !important;
    opacity: 1 !important;
  }

  html.dark .precificacont-dashboard tbody,
  html.dark .precificacont-dashboard tbody tr,
  html.dark .precificacont-dashboard tbody td {
    background-color: #0d1c31 !important;
    border-color: rgba(96, 165, 250, 0.14) !important;
  }

  html.dark .precificacont-dashboard tbody tr:nth-child(even),
  html.dark .precificacont-dashboard tbody tr:nth-child(even) td {
    background-color: #102441 !important;
  }

  html.dark .precificacont-dashboard tbody tr:hover,
  html.dark .precificacont-dashboard tbody tr:hover td {
    background-color: #153158 !important;
  }

  html.dark .precificacont-dashboard tbody td,
  html.dark .precificacont-dashboard tbody td span,
  html.dark .precificacont-dashboard tbody td div {
    opacity: 1;
  }

  html.dark .precificacont-dashboard tbody .text-slate-950,
  html.dark .precificacont-dashboard tbody .text-slate-900,
  html.dark .precificacont-dashboard tbody .text-slate-800,
  html.dark .precificacont-dashboard tbody .text-slate-700 {
    color: #f8fafc !important;
  }

  html.dark .precificacont-dashboard tbody .text-slate-600,
  html.dark .precificacont-dashboard tbody .text-slate-500,
  html.dark .precificacont-dashboard tbody .text-slate-400 {
    color: #a9bdd6 !important;
  }

  /* Cards de atividade: separação e leitura mais nítidas */
  html.dark .precificacont-dashboard [class*="bg-blue-50"] {
    background-color: #122d54 !important;
    border-color: rgba(59, 130, 246, 0.24) !important;
  }

  html.dark .precificacont-dashboard [class*="bg-blue-50"] .text-slate-900,
  html.dark .precificacont-dashboard [class*="bg-blue-50"] .text-slate-800,
  html.dark .precificacont-dashboard [class*="bg-blue-50"] .text-slate-700 {
    color: #ffffff !important;
  }

  html.dark .precificacont-dashboard [class*="bg-blue-50"] .text-slate-500,
  html.dark .precificacont-dashboard [class*="bg-blue-50"] .text-slate-400 {
    color: #b6c8de !important;
  }

  /* Números/valores principais não podem ficar apagados */
  html.dark .precificacont-dashboard .font-bold,
  html.dark .precificacont-dashboard .font-extrabold {
    opacity: 1 !important;
  }

`;

export default function Dashboard({ setPagina }) {
  const navegar = (pagina) => {
    if (typeof setPagina === "function") {
      setPagina(pagina);
    }
  };

  const [data, setData] = useState({
    simulacoes: [],
    clientes: [],
    propostas: [],
    crm: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      setData({
        simulacoes: readArray(STORAGE.simulacoes),
        clientes: readArray(STORAGE.clientes),
        propostas: readArray(STORAGE.propostas),
        crm: readArray(STORAGE.crm),
      });
      setLoading(false);
    };

    load();

    const onStorage = () => load();
    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const dashboard = useMemo(() => {
    const now = new Date();
    const prev = previousMonth(now);

    const simulacoes = [...data.simulacoes].sort((a, b) => {
      const da = safeDate(getCreatedAt(a))?.getTime() || 0;
      const db = safeDate(getCreatedAt(b))?.getTime() || 0;
      return db - da;
    });

    const proposals = [...data.propostas];
    const clientes = [...data.clientes];
    const crm = [...data.crm];

    const simsMonth = simulacoes.filter((item) =>
      isSameMonth(getCreatedAt(item), now)
    );
    const simsPrev = simulacoes.filter((item) =>
      isSameMonth(getCreatedAt(item), prev)
    );

    const avgReference =
      simulacoes.length > 0
        ? simulacoes.reduce(
            (sum, item) => sum + getSimulationReference(item),
            0
          ) / simulacoes.length
        : 0;

    const simsWithNegotiated = simulacoes.filter(
      (item) => numberValue(item.valor_negociado) > 0
    );

    const avgNegotiated =
      simsWithNegotiated.length > 0
        ? simsWithNegotiated.reduce(
            (sum, item) => sum + numberValue(item.valor_negociado),
            0
          ) / simsWithNegotiated.length
        : 0;

    const discountItems = simulacoes.filter(
      (item) => numberValue(item.desconto_percentual) > 0
    );

    const avgDiscount =
      discountItems.length > 0
        ? discountItems.reduce(
            (sum, item) => sum + numberValue(item.desconto_percentual),
            0
          ) / discountItems.length
        : 0;

    const gapAverage =
      avgReference > 0 && avgNegotiated > 0
        ? ((avgNegotiated - avgReference) / avgReference) * 100
        : 0;

    const proposalStatusesAccepted = [
      "aceita",
      "aceito",
      "aprovada",
      "aprovado",
      "fechado",
      "ganho",
    ];

    const proposalStatusesOpen = [
      "rascunho",
      "enviada",
      "enviado",
      "publicada",
      "pendente",
      "visualizada",
    ];

    const acceptedProposals = proposals.filter((item) =>
      proposalStatusesAccepted.includes(getProposalStatus(item))
    );

    const openProposals = proposals.filter((item) =>
      proposalStatusesOpen.includes(getProposalStatus(item))
    );

    const proposalMRR = acceptedProposals.reduce(
      (sum, item) => sum + getProposalMonthlyValue(item),
      0
    );

    const proposalPipeline = openProposals.reduce(
      (sum, item) => sum + getProposalMonthlyValue(item),
      0
    );

    const conversion =
      proposals.length > 0
        ? (acceptedProposals.length / proposals.length) * 100
        : 0;

    const openCRM = crm.filter(
      (item) => !["ganho", "perdido"].includes(String(item.etapa || ""))
    );

    const wonCRM = crm.filter(
      (item) => String(item.etapa || "") === "ganho"
    );

    const crmPipeline = openCRM.reduce(
      (sum, item) => sum + numberValue(item.valorMensal),
      0
    );

    const crmWon = wonCRM.reduce(
      (sum, item) => sum + numberValue(item.valorMensal),
      0
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueFollowups = openCRM.filter((item) => {
      if (!item.dataFollowup) return false;
      const date = safeDate(`${item.dataFollowup}T00:00:00`);
      return date && date <= today;
    }).length;

    const clientsBelow = clientes.filter((item) => {
      const current = getClientCurrentFee(item);
      const reference = getClientReference(item);
      return current > 0 && reference > current;
    });

    const repricingMonthly = clientsBelow.reduce((sum, item) => {
      return (
        sum +
        Math.max(0, getClientReference(item) - getClientCurrentFee(item))
      );
    }, 0);

    const currentPortfolio = clientes.reduce(
      (sum, item) => sum + getClientCurrentFee(item),
      0
    );

    const targetPortfolio = clientes.reduce((sum, item) => {
      const current = getClientCurrentFee(item);
      const reference = getClientReference(item);
      return sum + Math.max(current, reference);
    }, 0);

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = monthKey(date);

      const monthSims = simulacoes.filter((item) => {
        const created = safeDate(getCreatedAt(item));
        return created && monthKey(created) === key;
      });

      const monthProposals = proposals.filter((item) => {
        const created = safeDate(getCreatedAt(item));
        return created && monthKey(created) === key;
      });

      return {
        key,
        mes: monthLabel(date),
        Referência: monthSims.reduce(
          (sum, item) => sum + getSimulationReference(item),
          0
        ),
        Negociado: monthSims.reduce(
          (sum, item) => sum + getSimulationValue(item),
          0
        ),
        Propostas: monthProposals.reduce(
          (sum, item) => sum + getProposalMonthlyValue(item),
          0
        ),
        quantidade: monthSims.length,
      };
    });

    const lastSims = simulacoes.slice(0, 7);

    const activity = [
      ...simulacoes.slice(0, 5).map((item) => ({
        id: `sim-${item.id || Math.random()}`,
        type: "simulacao",
        title: getClientName(item),
        subtitle: "Precificação realizada",
        value: getSimulationValue(item),
        date: getCreatedAt(item),
        status: item.status || "calculado",
      })),
      ...proposals.slice(0, 5).map((item) => ({
        id: `prop-${item.id || item.numero_proposta || Math.random()}`,
        type: "proposta",
        title: getClientName(item),
        subtitle: item.numero_proposta
          ? `Proposta ${item.numero_proposta}`
          : "Proposta comercial",
        value: getProposalMonthlyValue(item),
        date: getCreatedAt(item),
        status: item.status || item.aceite?.status || "rascunho",
      })),
    ]
      .sort((a, b) => {
        const da = safeDate(a.date)?.getTime() || 0;
        const db = safeDate(b.date)?.getTime() || 0;
        return db - da;
      })
      .slice(0, 8);

    const topOpportunities = clientes
      .map((item) => {
        const current = getClientCurrentFee(item);
        const reference = getClientReference(item);
        return {
          id: item.id,
          cliente: getClientName(item),
          atual: current,
          referencia: reference,
          oportunidade: Math.max(0, reference - current),
        };
      })
      .filter((item) => item.oportunidade > 0)
      .sort((a, b) => b.oportunidade - a.oportunidade)
      .slice(0, 5);

    return {
      now,
      simulacoes,
      proposals,
      clientes,
      crm,
      simsMonth: simsMonth.length,
      simsPrev: simsPrev.length,
      simsDelta: deltaPercent(simsMonth.length, simsPrev.length),
      avgReference,
      avgNegotiated,
      avgDiscount,
      gapAverage,
      proposalsCount: proposals.length,
      acceptedProposals: acceptedProposals.length,
      openProposals: openProposals.length,
      proposalMRR,
      proposalPipeline,
      conversion,
      crmPipeline,
      crmWon,
      openCRM: openCRM.length,
      overdueFollowups,
      clientsBelow: clientsBelow.length,
      repricingMonthly,
      repricingAnnual: repricingMonthly * 12,
      currentPortfolio,
      targetPortfolio,
      months,
      lastSims,
      activity,
      topOpportunities,
    };
  }, [data]);

  const healthScore = useMemo(() => {
    let score = 55;

    if (dashboard.simulacoes.length >= 5) score += 8;
    if (dashboard.proposalsCount >= 1) score += 7;
    if (dashboard.conversion >= 25) score += 10;
    if (dashboard.overdueFollowups === 0) score += 8;
    if (dashboard.avgDiscount <= 10) score += 6;
    if (dashboard.clientsBelow === 0 && dashboard.clientes.length > 0) score += 6;

    return Math.min(100, score);
  }, [dashboard]);

  const insights = useMemo(() => {
    const items = [];

    if (dashboard.repricingMonthly > 0) {
      items.push({
        icon: TrendingUp,
        tone: "emerald",
        title: `${money(dashboard.repricingMonthly)}/mês em potencial de reprecificação`,
        description: `${integer(
          dashboard.clientsBelow
        )} cliente(s) estão abaixo da referência cadastrada. Em 12 meses, o potencial identificado chega a ${money(
          dashboard.repricingAnnual
        )}.`,
        pagina: "reprecificacao",
      });
    }

    if (dashboard.avgDiscount > 0) {
      items.push({
        icon: Percent,
        tone: dashboard.avgDiscount > 10 ? "amber" : "blue",
        title: `Desconto médio aplicado: ${percent(dashboard.avgDiscount)}`,
        description:
          dashboard.avgDiscount > 10
            ? "O desconto médio está acima de 10%. Vale revisar a disciplina comercial antes de ampliar concessões."
            : "O nível médio de desconto está dentro de uma faixa comercial controlada.",
        pagina: "propostas",
      });
    }

    if (dashboard.overdueFollowups > 0) {
      items.push({
        icon: Clock3,
        tone: "amber",
        title: `${integer(dashboard.overdueFollowups)} follow-up(s) exigem atenção`,
        description:
          "Existem oportunidades abertas com atividade prevista para hoje ou em atraso no CRM.",
        pagina: "crm",
      });
    }

    if (dashboard.proposalPipeline > 0 || dashboard.crmPipeline > 0) {
      items.push({
        icon: Target,
        tone: "violet",
        title: `${money(
          Math.max(dashboard.proposalPipeline, dashboard.crmPipeline)
        )} em pipeline mensal`,
        description:
          "Este é o volume comercial aberto identificado nos dados atuais do sistema.",
        pagina: "crm",
      });
    }

    if (items.length === 0) {
      items.push({
        icon: Sparkles,
        tone: "blue",
        title: "Seu painel estratégico está pronto para ganhar inteligência",
        description:
          "À medida que simulações, propostas, clientes e oportunidades forem registradas, os insights serão preenchidos automaticamente.",
        pagina: "nova",
      });
    }

    return items.slice(0, 4);
  }, [dashboard]);

  return (
    <div className="precificacont-dashboard min-h-screen bg-[#F8FAFD]">
      <style>{DASHBOARD_DARK_CSS}</style>
      <div className="mx-auto max-w-[1560px] px-4 py-5 md:px-7 md:py-7 xl:px-9">
        {/* =====================================================
            HERO / IDENTIDADE
        ====================================================== */}
        <section className="relative mb-7 overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-130px] left-[35%] h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(248,250,252,0.2),rgba(239,246,255,0.65),rgba(240,253,250,0.45))]" />

          <div className="relative grid gap-7 p-6 md:p-8 xl:grid-cols-[1.35fr_0.65fr] xl:items-center">
            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-[70px] w-[300px] items-center">
                  <img
                    src="/precificacont-logo-premium.png"
                    alt="PrecificaCont"
                    className="dashboard-brand-light h-[70px] w-[300px] object-contain object-center"
                  />
<img
                    src="/precificacont-logo-dark-cortado.png"
                    alt="PrecificaCont"
                    className="dashboard-brand-dark h-[70px] w-[300px] object-contain object-center"
                  />
                </div>

                <div className="hidden h-10 w-px bg-slate-200 sm:block" />

                <div className="hidden sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                    Precificação estratégica
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Honorários contábeis com inteligência
                  </p>
                </div>
              </div>

              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  <Activity size={14} />
                  Visão estratégica da carteira
                </div>

                <h1 className="max-w-3xl text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 md:text-[42px]">
                  Quanto sua carteira{" "}
                  <span className="text-blue-600">deveria faturar?</span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 md:text-[15px]">
                  O painel cruza honorário atual, Índice PrecificaCont,
                  reprecificação e negociação para mostrar onde o escritório
                  está deixando receita na mesa, e onde existe espaço para
                  crescer com critério.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <ShieldCheck size={14} className="text-teal-300" />
                  Índice PrecificaCont
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <Gauge size={14} className="text-blue-600" />
                  Honorário atual × referência
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <RefreshCcw size={14} className="text-emerald-300" />
                  Receita não capturada
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => navegar("reprecificacao")}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navegar("reprecificacao");
                  }
                }}
                className="col-span-2 cursor-pointer rounded-[24px] border border-[#132C63] bg-[#071A3D] p-5 shadow-[0_18px_45px_rgba(7,26,61,0.18)] transition hover:-translate-y-0.5 hover:border-blue-500/50 hover:shadow-[0_22px_55px_rgba(7,26,61,0.24)] focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                      Potencial identificado
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-white">
                      {money(dashboard.repricingMonthly)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      oportunidade mensal de reprecificação
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/10">
                    <TrendingUp size={21} />
                  </div>
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-400"
                    style={{
                      width: `${Math.min(
                        100,
                        dashboard.currentPortfolio > 0
                          ? (dashboard.repricingMonthly /
                              dashboard.currentPortfolio) *
                              100
                          : 0
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Carteira atual</span>
                  <span>{money(dashboard.currentPortfolio)}/mês</span>
                </div>
              </div>

              <div
                onClick={() => navegar("relatorios")}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-[20px] border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Aderência à política
                </p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-2xl font-bold text-slate-950">
                    {healthScore}
                  </span>
                  <span className="mb-1 text-xs text-slate-500">/100</span>
                </div>
              </div>

              <div
                onClick={() => navegar("crm")}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-[20px] border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Conversão
                </p>
                <div className="mt-2 text-2xl font-bold text-slate-950">
                  {percent(dashboard.conversion)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            KPIs PRINCIPAIS
        ====================================================== */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Calculator}
            eyebrow="PRECIFICAÇÃO"
            label="Simulações no mês"
            value={integer(dashboard.simsMonth)}
            helper={`${integer(dashboard.simulacoes.length)} no histórico`}
            delta={dashboard.simsDelta}
            accent="blue"
            onClick={() => navegar("simulacoes")}
          />

          <MetricCard
            icon={Wallet}
            eyebrow="REFERÊNCIA"
            label="Honorário médio sugerido"
            value={money(dashboard.avgReference)}
            helper="Média do Índice / valor de referência"
            accent="teal"
            onClick={() => navegar("simulacoes")}
          />

          <MetricCard
            icon={FileText}
            eyebrow="COMERCIAL"
            label="Propostas geradas"
            value={integer(dashboard.proposalsCount)}
            helper={`${integer(
              dashboard.acceptedProposals
            )} aceita(s) • ${integer(dashboard.openProposals)} aberta(s)`}
            accent="violet"
            onClick={() => navegar("propostas")}
          />

          <MetricCard
            icon={TrendingUp}
            eyebrow="CARTEIRA"
            label="Potencial de reprecificação"
            value={compactMoney(dashboard.repricingMonthly)}
            helper={`${integer(dashboard.clientsBelow)} cliente(s) abaixo da referência`}
            accent="emerald"
            strong
            onClick={() => navegar("reprecificacao")}
          />
        </div>

        {/* =====================================================
            FAIXA EXECUTIVA
        ====================================================== */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={CircleDollarSign}
            label="Oportunidades em negociação"
            value={compactMoney(
              Math.max(dashboard.crmPipeline, dashboard.proposalPipeline)
            )}
            helper={`${integer(dashboard.openCRM)} oportunidade(s) aberta(s)`}
            accent="blue"
            onClick={() => navegar("crm")}
          />

          <MetricCard
            icon={CheckCircle2}
            label="Honorários conquistados"
            value={compactMoney(
              Math.max(dashboard.crmWon, dashboard.proposalMRR)
            )}
            helper="Mensalidade registrada em negócios ganhos"
            accent="emerald"
            onClick={() => navegar("crm")}
          />

          <MetricCard
            icon={Percent}
            label="Desconto médio"
            value={percent(dashboard.avgDiscount)}
            helper={
              dashboard.avgDiscount > 10
                ? "Acima da referência comercial de 10%"
                : "Concessões comerciais monitoradas"
            }
            accent="amber"
            onClick={() => navegar("propostas")}
          />

          <MetricCard
            icon={Users}
            label="Base sob gestão"
            value={integer(dashboard.clientes.length)}
            helper={`${money(dashboard.currentPortfolio)}/mês em honorários atuais`}
            accent="violet"
            onClick={() => navegar("clientes")}
          />
        </div>

        {/* =====================================================
            GRÁFICO + INTELIGÊNCIA
        ====================================================== */}
        <div className="mb-6 grid gap-6 xl:grid-cols-[1.55fr_0.75fr]">
          <section
            onClick={() => navegar("relatorios")}
            className="cursor-pointer overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <SectionTitle
              icon={BarChart3}
              eyebrow="TENDÊNCIA"
              title="Evolução da precificação"
              description="Comparativo dos últimos 6 meses entre referência, valor negociado e propostas."
              right={
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Referência
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    Negociado
                  </span>
                </div>
              }
            />

            <div className="h-[330px] p-4 md:p-6">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Carregando indicadores…
                </div>
              ) : dashboard.simulacoes.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <BarChart3 size={22} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Ainda não há histórico suficiente
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                    As próximas simulações formarão automaticamente sua curva
                    de precificação.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dashboard.months}
                    margin={{ top: 10, right: 6, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="refFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BLUE} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="negFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={TEAL} stopOpacity={0.16} />
                        <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#EEF2F7"
                    />

                    <XAxis
                      dataKey="mes"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      dy={8}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      tickFormatter={(value) =>
                        value >= 1000 ? `${Math.round(value / 1000)}k` : value
                      }
                    />

                    <Tooltip content={<DashboardTooltip />} />

                    <Area
                      type="monotone"
                      dataKey="Referência"
                      name="Referência"
                      stroke={BLUE}
                      strokeWidth={2.5}
                      fill="url(#refFill)"
                      activeDot={{ r: 5 }}
                    />

                    <Area
                      type="monotone"
                      dataKey="Negociado"
                      name="Negociado"
                      stroke={TEAL}
                      strokeWidth={2.5}
                      fill="url(#negFill)"
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
            <SectionTitle
              icon={Lightbulb}
              eyebrow="RADAR PRECIFICACONT"
              title="Onde agir agora"
              description="Sinais extraídos dos dados atuais do sistema."
            />

            <div className="space-y-3 p-5">
              {insights.map((item, index) => (
                <InsightRow
                  key={`${item.title}-${index}`}
                  {...item}
                  onClick={() => navegar(item.pagina)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* =====================================================
            REPRECIFICAÇÃO + PIPELINE
        ====================================================== */}
        <div className="mb-6 grid gap-6 xl:grid-cols-2">
          <section
            onClick={() => navegar("reprecificacao")}
            className="cursor-pointer overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <SectionTitle
              icon={RefreshCcw}
              eyebrow="CARTEIRA"
              title="Oportunidades de reprecificação"
              description="Clientes com maior diferença entre honorário atual e referência cadastrada."
              right={
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    Potencial anual
                  </p>
                  <p className="text-sm font-bold text-emerald-800">
                    {money(dashboard.repricingAnnual)}
                  </p>
                </div>
              }
            />

            <div className="p-5">
              {dashboard.topOpportunities.length === 0 ? (
                <div className="flex min-h-[235px] flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={22} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Nenhuma oportunidade calculada
                  </p>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    Cadastre honorário atual e referência dos clientes para
                    visualizar o potencial de recuperação de receita.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dashboard.topOpportunities.map((item, index) => (
                    <div
                      key={item.id || `${item.cliente}-${index}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-slate-100 px-4 py-3.5 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500">
                            {index + 1}
                          </span>
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.cliente}
                          </p>
                        </div>
                        <div className="ml-9 mt-1 flex flex-wrap gap-x-3 text-[11px] text-slate-500">
                          <span>Atual {money(item.atual)}</span>
                          <span>Referência {money(item.referencia)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-700">
                          + {money(item.oportunidade)}
                        </p>
                        <p className="text-[10px] text-slate-500">por mês</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section
            onClick={() => navegar("crm")}
            className="cursor-pointer overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <SectionTitle
              icon={BriefcaseBusiness}
              eyebrow="COMERCIAL"
              title="Negociação de honorários"
              description="Volume mensal das oportunidades comerciais abertas."
            />

            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-950 p-4 text-white sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                  Pipeline aberto
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight">
                  {money(dashboard.crmPipeline)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {integer(dashboard.openCRM)} oportunidade(s)
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Ganho
                </p>
                <p className="mt-2 text-xl font-bold text-emerald-900">
                  {compactMoney(dashboard.crmWon)}
                </p>
                <p className="mt-1 text-xs text-emerald-700/60">MRR registrado</p>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-500">Conversão</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {percent(dashboard.conversion)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-500">Follow-ups</p>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      dashboard.overdueFollowups > 0
                        ? "text-amber-600"
                        : "text-slate-900"
                    }`}
                  >
                    {integer(dashboard.overdueFollowups)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-500">Gap médio</p>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      dashboard.gapAverage < 0
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {dashboard.gapAverage > 0 ? "+" : ""}
                    {percent(dashboard.gapAverage)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* =====================================================
            ÚLTIMAS SIMULAÇÕES + ATIVIDADE
        ====================================================== */}
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section
            onClick={() => navegar("simulacoes")}
            className="cursor-pointer overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <SectionTitle
              icon={Calculator}
              eyebrow="PRECIFICAÇÃO"
              title="Últimas simulações"
              description="Acompanhamento das precificações mais recentes."
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-5 py-3.5 text-left">Cliente</th>
                    <th className="px-3 py-3.5 text-right">Faturamento</th>
                    <th className="px-3 py-3.5 text-right">Referência</th>
                    <th className="px-3 py-3.5 text-right">Negociado</th>
                    <th className="px-3 py-3.5 text-left">Status</th>
                    <th className="px-5 py-3.5 text-right">Data</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.lastSims.map((item, index) => (
                    <tr
                      key={item.id || index}
                      className="border-b border-slate-50 transition hover:bg-blue-50/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 text-blue-700">
                            <Building2 size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-semibold text-slate-800">
                              {getClientName(item)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {item.regime || "Regime não informado"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-right text-slate-500">
                        {money(item.faturamento)}
                      </td>

                      <td className="px-3 py-4 text-right font-medium text-slate-700">
                        {money(getSimulationReference(item))}
                      </td>

                      <td className="px-3 py-4 text-right font-bold text-slate-950">
                        {money(getSimulationValue(item))}
                      </td>

                      <td className="px-3 py-4">
                        <StatusBadge status={item.status || "calculado"} />
                      </td>

                      <td className="px-5 py-4 text-right text-xs text-slate-500">
                        {dateBR(getCreatedAt(item))}
                      </td>
                    </tr>
                  ))}

                  {!loading && dashboard.lastSims.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-14 text-center text-sm text-slate-500"
                      >
                        Nenhuma simulação registrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
            <SectionTitle
              icon={Activity}
              eyebrow="ATIVIDADE"
              title="Pulso da operação"
              description="Simulações e propostas mais recentes."
            />

            <div className="p-5">
              {dashboard.activity.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <Clock3 size={21} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Nenhuma movimentação ainda
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    As atividades do PrecificaCont aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {dashboard.activity.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      onClick={() =>
                        navegar(item.type === "proposta" ? "propostas" : "simulacoes")
                      }
                      role="button"
                      tabIndex={0}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-blue-50/60"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          item.type === "proposta"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {item.type === "proposta" ? (
                          <FileText size={16} />
                        ) : (
                          <Calculator size={16} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {item.subtitle} • {dateBR(item.date)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800">
                          {money(item.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* =====================================================
            RODAPÉ DE INTELIGÊNCIA
        ====================================================== */}
        <div className="mt-6 flex flex-col gap-3 rounded-[22px] border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-teal-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Inteligência PrecificaCont
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Indicadores calculados exclusivamente a partir dos dados
                registrados no seu ambiente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Painel atualizado
          </div>
        </div>
      </div>
    </div>
  );
}
