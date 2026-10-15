import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  FileSearch,
  Gauge,
  Landmark,
  Network,
  PackageSearch,
  Radar,
  ReceiptText,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  WalletCards,
} from "lucide-react";

/**
 * REFORMA TRIBUTÁRIA — PRECIFICACONT
 *
 * Módulo visual da Reforma Tributária.
 * - Não consulta Supabase.
 * - Não altera pricingEngine.
 * - Mantém CRM, Propostas, Clientes e Configurações isolados nesta fase.
 * - Integra somente a navegação contextual para Reprecificação, sem alterar honorários automaticamente.
 * - Todos os números abaixo são demonstrativos para validação de UX/produto.
 */

const DEMO = {
  clientesAnalisados: 184,
  creditosPotenciais: 428350,
  valoresSobAnalise: 71840,
  conformidade: 91.8,
  altoImpacto: 27,
  fornecedoresRecorrentes: 13,
  oportunidades: 16400,
};

const NAV_ITEMS = [
  { id: "visao-geral", label: "Visão Geral", icon: BarChart3 },
  { id: "radar", label: "Radar da Carteira", icon: Radar },
  { id: "validador", label: "Validador IBS/CBS", icon: FileCheck2 },
  { id: "creditos", label: "Radar de Créditos", icon: CircleDollarSign },
  { id: "fornecedores", label: "Fornecedores", icon: Network },
  { id: "casos", label: "Casos de Crédito", icon: FileSearch },
  { id: "digital-twin", label: "Digital Twin", icon: Boxes },
  { id: "simuladores", label: "Simuladores", icon: Calculator },
  { id: "playbooks", label: "Playbooks", icon: ReceiptText },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
];

const money = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

const moneyInput = (value) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const parseCurrencyDigits = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return 0;

  const cents = Number(digits);
  return Number.isFinite(cents) ? cents / 100 : 0;
};

function CurrencyInput({ value, onChange, tone = "violet" }) {
  const focusTone =
    tone === "blue"
      ? "focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50"
      : "focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-50";

  return (
    <div className={`mt-1.5 flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 ${focusTone}`}>
      <span className="mr-2 text-xs font-black text-slate-400">R$</span>
      <input
        type="text"
        inputMode="numeric"
        value={moneyInput(value)}
        onFocus={(event) => {
          requestAnimationFrame(() => event.target.select());
        }}
        onChange={(event) => {
          onChange(parseCurrencyDigits(event.target.value));
        }}
        className="h-full w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
      />
    </div>
  );
}

function Badge({ children, tone = "blue" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        tones[tone] || tones.blue
      }`}
    >
      {children}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            tones[tone] || tones.blue
          }`}
        >
          <Icon size={19} />
        </div>
      </div>

      {helper ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  badge,
  badgeTone = "blue",
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
          <Icon size={18} />
        </div>

        {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
      </div>

      <h3 className="mt-5 text-sm font-black text-slate-900">{title}</h3>

      <p className="mt-2 min-h-[42px] text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-2 text-xs font-black text-blue-600">
        Abrir módulo
        <ArrowRight
          size={15}
          className="transition group-hover:translate-x-1"
        />
      </div>
    </button>
  );
}

function Progress({ value, tone = "blue" }) {
  const width = Math.max(0, Math.min(100, value));

  const tones = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${tones[tone] || tones.blue}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

const REFORMA_DIAGNOSTICOS_KEY = "precificacont_reforma_diagnosticos_v1";
const REFORMA_DIAGNOSTICO_VERSAO = "2026.09.28";

const normalizarCnpjReforma = (value) => String(value || "").replace(/\D/g, "");

const chaveClienteReforma = (cliente) =>
  String(
    cliente?.clienteId ||
      cliente?.id ||
      normalizarCnpjReforma(cliente?.cnpj) ||
      cliente?.empresa ||
      "",
  );

const carregarDiagnosticosReforma = () => {
  try {
    const bruto = localStorage.getItem(REFORMA_DIAGNOSTICOS_KEY);
    const dados = bruto ? JSON.parse(bruto) : {};
    return dados && typeof dados === "object" && !Array.isArray(dados) ? dados : {};
  } catch {
    return {};
  }
};

const salvarDiagnosticosReforma = (diagnosticos) => {
  localStorage.setItem(REFORMA_DIAGNOSTICOS_KEY, JSON.stringify(diagnosticos));
};

const calcularDiagnosticoReforma = (respostas) => {
  const fatores = [];
  let pontos = 0;

  const adicionar = (condicao, peso, titulo, detalhe) => {
    if (!condicao) return;
    pontos += peso;
    fatores.push({ peso, titulo, detalhe });
  };

  adicionar(
    respostas.simplesDecisao === "pendente",
    30,
    "Decisão IBS/CBS 2027 pendente",
    "Cliente do Simples ainda requer avaliação da forma de recolhimento de IBS/CBS para o primeiro semestre de 2027.",
  );

  adicionar(
    respostas.adequacaoDocumental === "nao",
    20,
    "Adequação documental pendente",
    "O escritório informou que a adequação dos documentos/processos fiscais ainda não foi concluída.",
  );

  adicionar(
    respostas.operacaoInterestadual === "sim",
    10,
    "Operações interestaduais",
    "Há operações com outros estados que merecem diagnóstico específico no contexto da Reforma.",
  );

  adicionar(
    respostas.operacaoExterior === "sim",
    10,
    "Operações com exterior",
    "Há importação ou exportação e o tratamento deve ser analisado conforme operação e vigência.",
  );

  adicionar(
    respostas.volumeDocumental === "alto",
    10,
    "Alto volume documental",
    "O volume aumenta a prioridade operacional de revisão e monitoramento.",
  );

  adicionar(
    respostas.cadeiaFornecedores === "relevante",
    10,
    "Cadeia de fornecedores relevante",
    "A cadeia foi marcada para análise de impactos e oportunidades relacionadas a créditos.",
  );

  adicionar(
    respostas.creditos === "analisar",
    10,
    "Créditos a analisar",
    "Existem indícios ou necessidade de revisão, sem confirmação automática de crédito.",
  );

  const irt = Math.min(100, pontos);
  const impacto = irt >= 70 ? "Alto" : irt >= 40 ? "Médio" : "Baixo";

  return {
    irt,
    impacto,
    fatores,
    oportunidade:
      irt >= 70
        ? "Diagnóstico Reforma prioritário"
        : irt >= 40
          ? "Diagnóstico Reforma"
          : "Monitoramento",
  };
};

const carregarClientesCarteira = () => {
  try {
    const bruto = localStorage.getItem("precificacont_clientes");
    const lista = bruto ? JSON.parse(bruto) : [];

    if (!Array.isArray(lista)) return [];

    return lista
      .filter((cliente) => cliente && (cliente.razao_social || cliente.nome_fantasia))
      .map((cliente, index) => ({
        id: cliente.id ?? `carteira-${index}`,
        clienteId: cliente.id ?? null,
        empresa:
          cliente.razao_social ||
          cliente.nome_fantasia ||
          `Cliente ${index + 1}`,
        nomeFantasia: cliente.nome_fantasia || "",
        cnpj: cliente.cnpj || "",
        regime: cliente.regime || "Não informado",
        segmento: cliente.atividade || "Não informado",
        irt: null,
        impacto: "Não analisado",
        creditos: 0,
        ocorrencias: 0,
        oportunidade: "Aguardando diagnóstico",
        statusReforma: "Aguardando diagnóstico",
      }))
      .map((cliente) => {
        const diagnosticos = carregarDiagnosticosReforma();
        const diagnostico = diagnosticos[chaveClienteReforma(cliente)];

        if (!diagnostico) return cliente;

        return {
          ...cliente,
          irt: diagnostico.irt,
          impacto: diagnostico.impacto,
          ocorrencias: Array.isArray(diagnostico.fatores)
            ? diagnostico.fatores.length
            : 0,
          oportunidade: diagnostico.oportunidade || "Diagnóstico Reforma",
          statusReforma: "Diagnóstico realizado",
          diagnostico,
        };
      });
  } catch (error) {
    console.error("Erro ao carregar carteira na Reforma Tributária:", error);
    return [];
  }
};

/* =========================================================
   RADAR DA CARTEIRA — DADOS EXCLUSIVAMENTE DEMONSTRATIVOS
========================================================= */

const RADAR_CLIENTES_DEMO = [
  {
    id: 1,
    empresa: "Alfa Comércio Ltda.",
    regime: "Lucro Presumido",
    segmento: "Comércio",
    irt: 88,
    impacto: "Alto",
    creditos: 28640,
    ocorrencias: 7,
    oportunidade: "Reprecificação",
  },
  {
    id: 2,
    empresa: "Beta Serviços Empresariais",
    regime: "Simples Nacional",
    segmento: "Serviços",
    irt: 76,
    impacto: "Alto",
    creditos: 12400,
    ocorrencias: 4,
    oportunidade: "Diagnóstico Reforma",
  },
  {
    id: 3,
    empresa: "Gama Indústria S.A.",
    regime: "Lucro Real",
    segmento: "Indústria",
    irt: 69,
    impacto: "Médio",
    creditos: 58300,
    ocorrencias: 3,
    oportunidade: "Análise de créditos",
  },
  {
    id: 4,
    empresa: "Delta Distribuidora Ltda.",
    regime: "Lucro Presumido",
    segmento: "Distribuição",
    irt: 61,
    impacto: "Médio",
    creditos: 18750,
    ocorrencias: 2,
    oportunidade: "Revisão cadastral",
  },
  {
    id: 5,
    empresa: "Ômega Tecnologia Ltda.",
    regime: "Simples Nacional",
    segmento: "Tecnologia",
    irt: 42,
    impacto: "Baixo",
    creditos: 4200,
    ocorrencias: 1,
    oportunidade: "Monitoramento",
  },
];

function RadarCarteiraPage({ onBack, clientesCarteira = [] }) {
  const [busca, setBusca] = useState("");
  const baseReal = clientesCarteira.length > 0;
  const clientesRadar = useMemo(() => {
    if (!baseReal) return RADAR_CLIENTES_DEMO;

    return clientesCarteira.map((cliente) => {
      const diagnostico = diagnosticosLocais[chaveClienteReforma(cliente)];
      if (!diagnostico) return cliente;

      return {
        ...cliente,
        irt: diagnostico.irt,
        impacto: diagnostico.impacto,
        ocorrencias: Array.isArray(diagnostico.fatores)
          ? diagnostico.fatores.length
          : 0,
        oportunidade: diagnostico.oportunidade || "Diagnóstico Reforma",
        statusReforma: "Diagnóstico realizado",
        diagnostico,
      };
    });
  }, [baseReal, clientesCarteira, diagnosticosLocais]);
  const [filtroImpacto, setFiltroImpacto] = useState("Todos");
  const [clienteDiagnostico, setClienteDiagnostico] = useState(null);
  const [respostasDiagnostico, setRespostasDiagnostico] = useState({
    simplesDecisao: "na",
    adequacaoDocumental: "nao_informado",
    operacaoInterestadual: "nao_informado",
    operacaoExterior: "nao_informado",
    volumeDocumental: "nao_informado",
    cadeiaFornecedores: "nao_informado",
    creditos: "nao_informado",
  });
  const [diagnosticosLocais, setDiagnosticosLocais] = useState(() =>
    carregarDiagnosticosReforma(),
  );

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return clientesRadar.filter((cliente) => {
      const correspondeBusca =
        !termo ||
        cliente.empresa.toLowerCase().includes(termo) ||
        cliente.regime.toLowerCase().includes(termo) ||
        cliente.segmento.toLowerCase().includes(termo);

      const correspondeImpacto =
        filtroImpacto === "Todos" || cliente.impacto === filtroImpacto;

      return correspondeBusca && correspondeImpacto;
    });
  }, [busca, filtroImpacto, clientesRadar]);

  const impactoTone = (impacto) => {
    if (impacto === "Alto") return "rose";
    if (impacto === "Médio") return "amber";
    return "emerald";
  };

  const irtTone = (irt) => {
    if (irt >= 75) return "rose";
    if (irt >= 55) return "amber";
    return "emerald";
  };

  const abrirDiagnostico = (cliente) => {
    if (!baseReal) return;

    const salvo = diagnosticosLocais[chaveClienteReforma(cliente)];
    setClienteDiagnostico(cliente);
    setRespostasDiagnostico(
      salvo?.respostas || {
        simplesDecisao:
          String(cliente.regime || "").toLowerCase().includes("simples")
            ? "pendente"
            : "na",
        adequacaoDocumental: "nao_informado",
        operacaoInterestadual: "nao_informado",
        operacaoExterior: "nao_informado",
        volumeDocumental: "nao_informado",
        cadeiaFornecedores: "nao_informado",
        creditos: "nao_informado",
      },
    );
  };

  const salvarDiagnostico = () => {
    if (!clienteDiagnostico) return;

    const resultado = calcularDiagnosticoReforma(respostasDiagnostico);
    const chave = chaveClienteReforma(clienteDiagnostico);
    const agora = new Date().toISOString();

    const registro = {
      ...resultado,
      respostas: respostasDiagnostico,
      clienteId: clienteDiagnostico.clienteId || null,
      cnpj: clienteDiagnostico.cnpj || "",
      cliente: clienteDiagnostico.empresa || "",
      versao: REFORMA_DIAGNOSTICO_VERSAO,
      analisadoEm: agora,
      metodologia:
        "Índice de atenção operacional. Não confirma crédito, irregularidade, obrigação ou escolha tributária.",
    };

    const proximos = { ...diagnosticosLocais, [chave]: registro };
    salvarDiagnosticosReforma(proximos);
    setDiagnosticosLocais(proximos);
    setClienteDiagnostico(null);
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
      >
        <ChevronRight size={16} className="rotate-180" />
        Visão Geral
      </button>

      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#071329] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
              <Radar size={14} />
              Radar da Carteira
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
              Priorize onde a Reforma exige atenção
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Visão demonstrativa da carteira para organizar impacto,
              ocorrências, créditos potenciais e oportunidades comerciais sem
              executar qualquer conclusão fiscal real.
            </p>
          </div>

          <Badge tone={baseReal ? "blue" : "emerald"}>{baseReal ? "Carteira real • análise pendente" : "Dados demonstrativos"}</Badge>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Building2}
          label="Carteira monitorada"
          value={baseReal ? clientesRadar.length : DEMO.clientesAnalisados}
          helper={
            baseReal
              ? "Clientes reais conectados ao Radar da Reforma."
              : "Empresas consideradas no ambiente demonstrativo."
          }
          tone="blue"
        />

        <MetricCard
          icon={AlertTriangle}
          label="Alto impacto"
          value={
            baseReal
              ? clientesRadar.filter((cliente) => cliente.impacto === "Alto").length
              : DEMO.altoImpacto
          }
          helper="Empresas priorizadas para revisão no Radar."
          tone="rose"
        />

        <MetricCard
          icon={CircleDollarSign}
          label="Créditos potenciais"
          value={
            baseReal
              ? money(
                  clientesRadar.reduce(
                    (total, cliente) => total + Number(cliente.creditos || 0),
                    0,
                  ),
                )
              : money(DEMO.creditosPotenciais)
          }
          helper={
            baseReal
              ? "Somente valores efetivamente identificados; diagnóstico não inventa créditos."
              : "Potencial demonstrativo ainda sujeito a validação."
          }
          tone="emerald"
        />

        <MetricCard
          icon={TrendingUp}
          label="Oportunidades"
          value={money(clientesCarteira.length ? 0 : DEMO.oportunidades)}
          helper="Valor demonstrativo de serviços identificados."
          tone="violet"
        />
      </section>

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                Mapa de prioridade
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-900">
                Empresas monitoradas
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Pesquise por empresa, regime ou segmento e filtre pelo impacto.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar empresa..."
                className="h-10 min-w-[230px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />

              <select
                value={filtroImpacto}
                onChange={(event) => setFiltroImpacto(event.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-blue-400"
              >
                <option value="Todos">Todos os impactos</option>
                <option value="Alto">Alto</option>
                <option value="Médio">Médio</option>
                <option value="Baixo">Baixo</option>
                {baseReal ? <option value="Não analisado">Não analisado</option> : null}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Empresa
                </th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Regime
                </th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  IRT
                </th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Impacto
                </th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Créditos potenciais
                </th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Ocorrências
                </th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Oportunidade
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Ação
                </th>
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {cliente.empresa}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {cliente.segmento}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-xs font-bold text-slate-600">
                    {cliente.regime}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex min-w-[110px] items-center gap-3">
                      <span className="w-7 text-xs font-black text-slate-900">
                        {cliente.irt == null ? "—" : cliente.irt}
                      </span>
                      <div className="flex-1">
                        <Progress
                          value={cliente.irt ?? 0}
                          tone={irtTone(cliente.irt)}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <Badge tone={impactoTone(cliente.impacto)}>
                      {cliente.impacto}
                    </Badge>
                  </td>

                  <td className="px-5 py-4 text-xs font-black text-emerald-700">
                    {money(cliente.creditos)}
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-black text-slate-700">
                      {cliente.ocorrencias}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs font-bold text-slate-600">
                    {cliente.oportunidade}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      disabled={!baseReal}
                      onClick={() => abrirDiagnostico(cliente)}
                      title={
                        baseReal
                          ? "Abrir diagnóstico da Reforma para este cliente."
                          : "Disponível quando a carteira real estiver conectada."
                      }
                      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-[11px] font-black transition ${
                        baseReal
                          ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {cliente.statusReforma === "Diagnóstico realizado"
                        ? "Revisar"
                        : "Analisar"}
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}

              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm font-semibold text-slate-400"
                  >
                    Nenhuma empresa encontrada com os filtros informados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Gauge size={20} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">
                IRT
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-900">
                Índice Reforma Tributária
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                O IRT foi desenhado como um índice explicável para ajudar a
                priorizar clientes. Na versão real, cada ponto deverá demonstrar
                exatamente quais fatores aumentaram ou reduziram o índice.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Documental", "Campos, documentos e consistência"],
              ["Crédito", "Potencial e situações sob análise"],
              ["Financeiro", "Possível impacto em caixa e margem"],
              ["Operacional", "Volume, cadeia e complexidade"],
            ].map(([titulo, descricao]) => (
              <div key={titulo} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-900">{titulo}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {descricao}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-6">
          <div className="flex items-center gap-2 text-blue-700">
            <ShieldCheck size={18} />
            <p className="text-xs font-black uppercase tracking-[0.15em]">
              Regra desta fase
            </p>
          </div>

          <h3 className="mt-3 text-lg font-black text-slate-900">
            Nenhuma decisão fiscal automática
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            O Radar organiza prioridade. Ele não confirma crédito,
            irregularidade, perda financeira ou obrigação tributária. Essas
            conclusões dependerão do futuro motor fiscal, evidências e regras
            versionadas.
          </p>
        </div>
      </section>

      {clienteDiagnostico ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[26px] bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Diagnóstico Reforma Tributária
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">
                    {clienteDiagnostico.empresa}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {clienteDiagnostico.regime} • {clienteDiagnostico.segmento}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setClienteDiagnostico(null)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-50"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              {String(clienteDiagnostico.regime || "")
                .toLowerCase()
                .includes("simples") ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black text-amber-900">
                    Simples Nacional • decisão IBS/CBS 2027
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-amber-800">
                    Para 2027 existe janela de opção relacionada à forma de
                    recolhimento de IBS/CBS. O PrecificaCont apenas registra se a
                    análise foi realizada; não escolhe o regime pelo cliente.
                  </p>
                  <select
                    value={respostasDiagnostico.simplesDecisao}
                    onChange={(e) =>
                      setRespostasDiagnostico((atual) => ({
                        ...atual,
                        simplesDecisao: e.target.value,
                      }))
                    }
                    className="mt-3 h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-xs font-bold text-slate-700"
                  >
                    <option value="pendente">Decisão ainda pendente</option>
                    <option value="avaliada">Análise realizada pelo escritório</option>
                  </select>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["adequacaoDocumental", "Adequação documental/processos", [
                    ["nao_informado", "Não informado"],
                    ["nao", "Ainda não concluída"],
                    ["sim", "Concluída / revisada"],
                  ]],
                  ["operacaoInterestadual", "Opera com outros estados?", [
                    ["nao_informado", "Não informado"],
                    ["sim", "Sim"],
                    ["nao", "Não"],
                  ]],
                  ["operacaoExterior", "Opera com outros países?", [
                    ["nao_informado", "Não informado"],
                    ["sim", "Sim"],
                    ["nao", "Não"],
                  ]],
                  ["volumeDocumental", "Volume documental", [
                    ["nao_informado", "Não informado"],
                    ["baixo", "Baixo / normal"],
                    ["alto", "Alto"],
                  ]],
                  ["cadeiaFornecedores", "Cadeia de fornecedores", [
                    ["nao_informado", "Não informado"],
                    ["normal", "Sem prioridade identificada"],
                    ["relevante", "Relevante para análise"],
                  ]],
                  ["creditos", "Créditos IBS/CBS", [
                    ["nao_informado", "Não analisado"],
                    ["sem_indicio", "Sem indício registrado"],
                    ["analisar", "Requer análise"],
                  ]],
                ].map(([campo, titulo, opcoes]) => (
                  <label key={campo} className="block rounded-2xl border border-slate-200 p-4">
                    <span className="text-xs font-black text-slate-700">{titulo}</span>
                    <select
                      value={respostasDiagnostico[campo]}
                      onChange={(e) =>
                        setRespostasDiagnostico((atual) => ({
                          ...atual,
                          [campo]: e.target.value,
                        }))
                      }
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
                    >
                      {opcoes.map(([valor, label]) => (
                        <option key={valor} value={valor}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black text-blue-900">
                  O que o IRT representa
                </p>
                <p className="mt-1 text-[11px] leading-5 text-blue-700">
                  Prioridade de atenção para o escritório. O índice não confirma
                  irregularidade, crédito, obrigação fiscal, economia tributária ou
                  qual regime deve ser escolhido.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClienteDiagnostico(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvarDiagnostico}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700"
                >
                  Calcular e salvar IRT
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* =========================================================
   VALIDADOR IBS/CBS — CAMADA VISUAL / REGRAS DE REFERÊNCIA
========================================================= */

const VALIDADOR_REFERENCIAS_2026 = [
  {
    marco: "03/08/2026",
    titulo: "Primeiro grupo do cronograma DF-e",
    detalhe:
      "Início da obrigatoriedade para documentos/operações definidos no cronograma RFB/CGIBS, incluindo CT-e e outros itens do primeiro grupo.",
  },
  {
    marco: "01/10/2026",
    titulo: "NFS-e de serviços em geral",
    detalhe:
      "Marco do cronograma para NFS-e de serviços em geral sujeitos ao ISS, ressalvadas especificidades e regras próprias.",
  },
  {
    marco: "15/11/2026",
    titulo: "DeRE — 2ª fase",
    detalhe:
      "Marco previsto para eventos periódicos mensais da Declaração de Regimes Específicos.",
  },
  {
    marco: "01/12/2026",
    titulo: "Novo grupo de documentos/operações",
    detalhe:
      "Marco adicional do cronograma oficial para documentos e operações específicos.",
  },
  {
    marco: "01/01/2027",
    titulo: "Simples Nacional e outros marcos",
    detalhe:
      "Documentos fiscais dos contribuintes do Simples Nacional entram no marco indicado no cronograma oficial.",
  },
];

const RESULTADOS_VALIDADOR_DEMO = {
  pre: {
    status: "Requer atenção",
    tone: "amber",
    titulo: "Operação preparada para revisão antes da emissão",
    regra:
      "A validação deve considerar documento, operação, regime e data-base antes de aplicar a regra vigente.",
    evidencia:
      "Exemplo demonstrativo: operação de serviço com emissão prevista para outubro/2026.",
    problema:
      "O enquadramento e os campos IBS/CBS ainda precisam ser confrontados com a regra aplicável ao documento e à data da operação.",
    consequencia:
      "Uma configuração inadequada pode exigir correção ou revisão documental, conforme a regra efetivamente aplicável.",
    acao:
      "Confirmar tipo de documento, regime, natureza da operação e vigência antes da emissão.",
    fonte:
      "Receita Federal / CGIBS — cronograma oficial dos documentos fiscais eletrônicos",
    vigencia: "Conforme documento e operação",
    versao: "Base regulatória consultada em 25/09/2026",
  },

  emitido: {
    status: "Informação ausente / revisar",
    tone: "rose",
    titulo: "Documento emitido exige leitura pela vigência correta",
    regra:
      "Ausência de informação não deve ser tratada automaticamente como documento rejeitado ou inválido; a consequência depende da regra vigente e do ambiente de autorização.",
    evidencia:
      "Exemplo demonstrativo: XML autorizado com informação IBS/CBS que exige revisão.",
    problema:
      "Há campo ou tratamento que precisa ser confrontado com a obrigação aplicável na data do documento.",
    consequencia:
      "Pode existir desconformidade ou necessidade de regularização mesmo quando o documento foi autorizado.",
    acao:
      "Revisar a regra aplicável, evidência do XML e orientação oficial vigente antes de concluir o caso.",
    fonte: "Receita Federal / CGIBS — orientações e cronograma RTC",
    vigencia: "Data do documento",
    versao: "Base regulatória consultada em 25/09/2026",
  },

  lote: {
    status: "Triagem concluída",
    tone: "blue",
    titulo: "Carteira organizada por prioridade de revisão",
    regra:
      "Cada documento deve ser validado pela combinação de tipo, operação, regime e vigência; o lote apenas organiza a triagem.",
    evidencia:
      "Exemplo demonstrativo: 184 empresas / múltiplos documentos e períodos.",
    problema:
      "27 empresas foram classificadas no exemplo como prioridade elevada para revisão.",
    consequencia:
      "A priorização ajuda o escritório a direcionar análise, mas não representa autuação, crédito confirmado ou conclusão fiscal.",
    acao:
      "Abrir os casos prioritários e executar validação individual com evidência e regra versionada.",
    fonte:
      "Motor demonstrativo PrecificaCont + referências oficiais RFB/CGIBS",
    vigencia: "Individual por documento",
    versao: "Base regulatória consultada em 25/09/2026",
  },
};

function ValidadorIBSCBSPage({ onBack }) {
  const [modo, setModo] = useState("pre");
  const [dataBase, setDataBase] = useState("2026-09-25");
  const [documento, setDocumento] = useState("NFS-e");
  const [regime, setRegime] = useState("Lucro Presumido");
  const [analisado, setAnalisado] = useState(false);
  const [arquivoDocumento, setArquivoDocumento] = useState("");
  const [arquivoLote, setArquivoLote] = useState("");

  const resultado = RESULTADOS_VALIDADOR_DEMO[modo];

  const modos = [
    {
      id: "pre",
      label: "Pré-emissão",
      icon: FileCheck2,
      helper: "Validar a operação antes de emitir",
    },
    {
      id: "emitido",
      label: "Documento emitido",
      icon: FileSearch,
      helper: "Importar e revisar XML já emitido",
    },
    {
      id: "lote",
      label: "Carteira em lote",
      icon: Building2,
      helper: "Múltiplos XMLs, ZIP ou futura integração",
    },
  ];

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
      >
        <ChevronRight size={16} className="rotate-180" />
        Visão Geral
      </button>

      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#071329] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              <FileCheck2 size={14} />
              Validador IBS/CBS
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
              Validação explicável e versionada por vigência
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Pré-emissão, documento emitido e carteira em lote. A leitura
              sempre parte da data-base, do documento, do regime e da operação
              — sem transformar autorização do documento em conclusão de
              conformidade.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="emerald">Base 25/09/2026</Badge>

            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-slate-300">
              Visual demonstrativo
            </span>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 lg:grid-cols-3">
        {modos.map((item) => {
          const Icon = item.icon;
          const active = modo === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setModo(item.id);
                setAnalisado(false);
              }}
              className={`rounded-[20px] border p-4 text-left transition ${
                active
                  ? "border-blue-300 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon size={19} />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-900">
                    {item.label}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {item.helper}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
            Entrada da validação
          </p>

          <h3 className="mt-1 text-lg font-black text-slate-900">
            Contexto da análise
          </h3>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-black text-slate-600">
                Data-base da validação
              </span>

              <input
                type="date"
                value={dataBase}
                onChange={(e) => setDataBase(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black text-slate-600">
                Documento
              </span>

              <select
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
              >
                <option>NFS-e</option>
                <option>NF-e</option>
                <option>NFC-e</option>
                <option>CT-e</option>
                <option>NFCom</option>
                <option>DeRE</option>
                <option>Duimp</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black text-slate-600">Regime</span>

              <select
                value={regime}
                onChange={(e) => setRegime(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
              >
                <option>Simples Nacional</option>
                <option>Lucro Presumido</option>
                <option>Lucro Real</option>
                <option>Outro / regime específico</option>
              </select>
            </label>

            {modo === "pre" && (
              <>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-black text-blue-900">
                    Aqui ainda não existe nota fiscal.
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-blue-700">
                    Informe os dados da operação abaixo. O PrecificaCont usará
                    esse contexto para a validação antes da emissão. Uma
                    validação diretamente dentro do ERP/emissor dependerá de
                    integração futura.
                  </p>
                </div>

                <label className="block">
                  <span className="text-xs font-black text-slate-600">
                    Natureza da operação
                  </span>

                  <select className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none">
                    <option>Prestação de serviço</option>
                    <option>Venda de mercadoria</option>
                    <option>Compra / entrada</option>
                    <option>Transporte</option>
                    <option>Importação</option>
                    <option>Outra</option>
                  </select>
                </label>
              </>
            )}

            {modo === "emitido" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black text-slate-900">
                    1. Importe o documento fiscal
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Para documento já emitido, o XML será a principal entrada
                    estruturada da validação.
                  </p>
                </div>

                <label className="block cursor-pointer rounded-2xl border border-dashed border-blue-300 bg-blue-50/40 p-5 text-center transition hover:bg-blue-50">
                  <FileSearch className="mx-auto text-blue-600" size={26} />

                  <p className="mt-2 text-xs font-black text-slate-800">
                    Importar documento fiscal
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Arraste o XML aqui ou clique para selecionar
                  </p>

                  <p className="mt-2 text-[10px] font-bold text-slate-400">
                    NF-e • NFS-e • CT-e • outros XMLs suportados futuramente
                  </p>

                  <input
                    type="file"
                    accept=".xml,text/xml,application/xml"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setArquivoDocumento(file?.name || "");
                      setAnalisado(false);
                    }}
                  />
                </label>

                {arquivoDocumento ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={16}
                        className="text-emerald-600"
                      />

                      <div>
                        <p className="text-[11px] font-black text-emerald-900">
                          Arquivo selecionado
                        </p>

                        <p className="mt-0.5 break-all text-[11px] text-emerald-700">
                          {arquivoDocumento}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2 text-[10px] leading-4 text-emerald-700">
                      Nesta fase visual o arquivo não é processado. A leitura
                      real do XML será conectada ao motor fiscal posteriormente.
                    </p>
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled
                  title="Disponível quando uma integração fiscal/documental estiver conectada."
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-400"
                >
                  <RefreshCcw size={15} />
                  Buscar da integração — em breve
                </button>
              </div>
            )}

            {modo === "lote" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black text-slate-900">
                    1. Envie vários documentos ou use uma integração
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    O objetivo deste modo é analisar a carteira sem obrigar o
                    escritório a importar nota por nota.
                  </p>
                </div>

                <label className="block cursor-pointer rounded-2xl border border-dashed border-blue-300 bg-blue-50/40 p-5 text-center transition hover:bg-blue-50">
                  <Building2 className="mx-auto text-blue-600" size={26} />

                  <p className="mt-2 text-xs font-black text-slate-800">
                    Importar lote de documentos
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Selecione múltiplos XMLs ou um arquivo ZIP
                  </p>

                  <p className="mt-2 text-[10px] font-bold text-slate-400">
                    Alternativa inicial à integração automática
                  </p>

                  <input
                    type="file"
                    multiple
                    accept=".xml,.zip,text/xml,application/xml,application/zip"
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);

                      setArquivoLote(
                        files.length === 1
                          ? files[0].name
                          : files.length > 1
                            ? `${files.length} arquivos selecionados`
                            : "",
                      );

                      setAnalisado(false);
                    }}
                  />
                </label>

                {arquivoLote ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={16}
                        className="text-emerald-600"
                      />

                      <p className="text-[11px] font-black text-emerald-900">
                        {arquivoLote}
                      </p>
                    </div>

                    <p className="mt-2 text-[10px] leading-4 text-emerald-700">
                      Nesta fase visual os arquivos não são processados. O
                      processamento em lote será conectado posteriormente.
                    </p>
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled
                  title="Disponível quando uma integração fiscal/documental estiver conectada."
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-400"
                >
                  <RefreshCcw size={15} />
                  Buscar carteira da integração — em breve
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setAnalisado(true)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-blue-700"
            >
              <FileCheck2 size={17} />

              {modo === "pre"
                ? "Validar operação demonstrativa"
                : modo === "emitido"
                  ? "Executar validação IBS/CBS"
                  : "Executar triagem da carteira"}
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                Resultado explicável
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-900">
                Regra → evidência → impacto → ação
              </h3>
            </div>

            {analisado ? (
              <Badge tone={resultado.tone}>{resultado.status}</Badge>
            ) : (
              <Badge tone="slate">Aguardando análise</Badge>
            )}
          </div>

          {!analisado ? (
            <div className="mt-6 rounded-[22px] border border-dashed border-blue-200 bg-blue-50/40 p-8 text-center">
              <ShieldCheck className="mx-auto text-blue-600" size={28} />

              <h4 className="mt-3 text-sm font-black text-slate-900">
                Nenhuma conclusão automática
              </h4>

              <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-500">
                Preencha o contexto e execute a demonstração. O resultado
                mostrará como o futuro motor deve justificar cada alerta e
                preservar a regra vigente na data analisada.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-300">
                  {resultado.status}
                </p>

                <p className="mt-1 text-base font-black">{resultado.titulo}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-300">
                  <span className="rounded-lg bg-white/10 px-2 py-1">
                    {documento}
                  </span>

                  <span className="rounded-lg bg-white/10 px-2 py-1">
                    {regime}
                  </span>

                  <span className="rounded-lg bg-white/10 px-2 py-1">
                    Data-base: {dataBase.split("-").reverse().join("/")}
                  </span>
                </div>
              </div>

              {[
                ["Regra aplicável", resultado.regra, "blue"],
                ["Evidência", resultado.evidencia, "slate"],
                [
                  "Problema / ponto de atenção",
                  resultado.problema,
                  "amber",
                ],
                ["Possível consequência", resultado.consequencia, "rose"],
                ["Ação recomendada", resultado.acao, "emerald"],
              ].map(([titulo, texto, tone]) => (
                <div
                  key={titulo}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        tone === "blue"
                          ? "bg-blue-500"
                          : tone === "amber"
                            ? "bg-amber-500"
                            : tone === "rose"
                              ? "bg-rose-500"
                              : tone === "emerald"
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                      }`}
                    />

                    <div>
                      <p className="text-xs font-black text-slate-900">
                        {titulo}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {texto}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[9px] font-black uppercase text-slate-400">
                    Vigência
                  </p>

                  <p className="mt-1 text-[11px] font-bold text-slate-700">
                    {resultado.vigencia}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[9px] font-black uppercase text-slate-400">
                    Fonte
                  </p>

                  <p className="mt-1 text-[11px] font-bold text-slate-700">
                    {resultado.fonte}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[9px] font-black uppercase text-slate-400">
                    Versão
                  </p>

                  <p className="mt-1 text-[11px] font-bold text-slate-700">
                    {resultado.versao}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
              Cronograma de referência
            </p>

            <h3 className="mt-1 text-lg font-black text-slate-900">
              Marcos considerados no desenho do motor
            </h3>
          </div>

          <Badge tone="emerald">RFB / CGIBS</Badge>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {VALIDADOR_REFERENCIAS_2026.map((item) => (
            <div
              key={item.marco}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <p className="text-sm font-black text-blue-600">{item.marco}</p>

              <p className="mt-2 text-xs font-black text-slate-900">
                {item.titulo}
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {item.detalhe}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-amber-600"
          />

          <p className="text-xs leading-5 text-amber-900">
            <strong>Importante:</strong> publicação de leiaute, início da
            obrigatoriedade, autorização do documento e conformidade tributária
            são eventos diferentes. O motor real deverá guardar fonte, versão e
            vigência de cada regra.
          </p>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   RADAR DE CRÉDITOS — DADOS EXCLUSIVAMENTE DEMONSTRATIVOS
========================================================= */

const RADAR_CREDITOS_DEMO = [
  {
    id: 1,
    cliente: "Alfa Comércio Ltda.",
    periodo: "08/2026",
    origem: "Aquisição de mercadorias",
    documento: "NF-e 18452",
    valor: 28640,
    evidencia: "XML disponível",
    fundamento: "Regra depende da operação, regime e vigência",
    status: "Crédito potencial",
    prioridade: "Alta",
  },
  {
    id: 2,
    cliente: "Gama Indústria S.A.",
    periodo: "08/2026",
    origem: "Insumos da operação",
    documento: "NF-e 77831",
    valor: 58300,
    evidencia: "XML + fornecedor",
    fundamento: "Requer confronto documental e regra vigente",
    status: "Sob análise",
    prioridade: "Alta",
  },
  {
    id: 3,
    cliente: "Delta Distribuidora Ltda.",
    periodo: "09/2026",
    origem: "Entradas da cadeia",
    documento: "NF-e 33019",
    valor: 18750,
    evidencia: "XML identificado",
    fundamento: "Tratamento sujeito à natureza da operação",
    status: "Requer revisão",
    prioridade: "Média",
  },
  {
    id: 4,
    cliente: "Beta Serviços Empresariais",
    periodo: "09/2026",
    origem: "Aquisição vinculada à atividade",
    documento: "NFS-e 9021",
    valor: 12400,
    evidencia: "Documento + cadastro",
    fundamento: "Regime e período precisam ser considerados",
    status: "Crédito potencial",
    prioridade: "Média",
  },
  {
    id: 5,
    cliente: "Ômega Tecnologia Ltda.",
    periodo: "09/2026",
    origem: "Serviços contratados",
    documento: "NFS-e 4418",
    valor: 4200,
    evidencia: "Evidência revisada",
    fundamento: "Demonstração sem conclusão tributária automática",
    status: "Confirmado",
    prioridade: "Baixa",
  },
];

function RadarCreditosPage({ onBack }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("Todos");
  const [prioridade, setPrioridade] = useState("Todas");

  const creditosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return RADAR_CREDITOS_DEMO.filter((item) => {
      const buscaOk =
        !termo ||
        item.cliente.toLowerCase().includes(termo) ||
        item.origem.toLowerCase().includes(termo) ||
        item.documento.toLowerCase().includes(termo);

      const statusOk = status === "Todos" || item.status === status;

      const prioridadeOk =
        prioridade === "Todas" || item.prioridade === prioridade;

      return buscaOk && statusOk && prioridadeOk;
    });
  }, [busca, status, prioridade]);

  const totais = useMemo(() => {
    const soma = (nome) =>
      RADAR_CREDITOS_DEMO.filter((item) => item.status === nome).reduce(
        (acc, item) => acc + item.valor,
        0,
      );

    return {
      potencial: soma("Crédito potencial"),
      analise: soma("Sob análise"),
      revisao: soma("Requer revisão"),
      confirmado: soma("Confirmado"),
    };
  }, []);

  const statusTone = (nome) => {
    if (nome === "Confirmado") return "emerald";
    if (nome === "Sob análise") return "blue";
    if (nome === "Requer revisão") return "amber";
    return "violet";
  };

  const prioridadeTone = (nome) => {
    if (nome === "Alta") return "rose";
    if (nome === "Média") return "amber";
    return "emerald";
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
      >
        <ChevronRight size={16} className="rotate-180" />
        Visão Geral
      </button>

      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#071329] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
              <CircleDollarSign size={14} />
              Radar de Créditos
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
              Do indício ao crédito confirmado
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Organize valores identificados nos documentos sem transformar uma
              detecção em conclusão fiscal. Cada ocorrência mantém origem,
              evidência, fundamento, status e prioridade.
            </p>
          </div>

          <Badge tone="emerald">Dados demonstrativos</Badge>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CircleDollarSign}
          label="Crédito potencial"
          value={money(totais.potencial)}
          helper="Indícios encontrados que ainda exigem validação."
          tone="violet"
        />

        <MetricCard
          icon={FileSearch}
          label="Sob análise"
          value={money(totais.analise)}
          helper="Valores em confronto documental e regulatório."
          tone="blue"
        />

        <MetricCard
          icon={TriangleAlert}
          label="Requer revisão"
          value={money(totais.revisao)}
          helper="Ocorrências com ponto de atenção antes de concluir."
          tone="amber"
        />

        <MetricCard
          icon={BadgeCheck}
          label="Confirmado"
          value={money(totais.confirmado)}
          helper="Exemplo visual: somente após evidência e confirmação."
          tone="emerald"
        />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
            Fluxo de qualificação
          </p>

          <h3 className="mt-1 text-lg font-black text-slate-900">
            O valor evolui conforme a evidência
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["1", "Crédito potencial", "Valor identificado pelo Radar."],
              ["2", "Sob análise", "Documento e regra em conferência."],
              ["3", "Requer revisão", "Há ponto que impede conclusão."],
              ["4", "Confirmado", "Somente após evidência suficiente."],
            ].map(([numero, titulo, texto]) => (
              <div key={titulo} className="rounded-2xl bg-slate-50 p-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-[11px] font-black text-white">
                  {numero}
                </span>

                <p className="mt-3 text-xs font-black text-slate-900">
                  {titulo}
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {texto}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-6">
          <div className="flex items-center gap-2 text-blue-700">
            <ShieldCheck size={18} />

            <p className="text-xs font-black uppercase tracking-[0.15em]">
              Regra do Radar
            </p>
          </div>

          <h3 className="mt-3 text-lg font-black text-slate-900">
            Encontrar não significa confirmar
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            O Radar aponta situações para análise. A confirmação dependerá da
            operação, regime, período, documento, evidência e regra vigente.
            Nesta fase nenhum cálculo fiscal real está sendo executado.
          </p>
        </div>
      </section>

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                Ocorrências de crédito
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-900">
                Mapa documental
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Valores abaixo são demonstrativos e não representam crédito
                tributário efetivamente apurado.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente, origem ou documento..."
                className="h-10 min-w-[270px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-blue-400"
              >
                <option>Todos</option>
                <option>Crédito potencial</option>
                <option>Sob análise</option>
                <option>Requer revisão</option>
                <option>Confirmado</option>
              </select>

              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-blue-400"
              >
                <option>Todas</option>
                <option>Alta</option>
                <option>Média</option>
                <option>Baixa</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {[
                  "Cliente / período",
                  "Origem",
                  "Documento",
                  "Valor potencial",
                  "Evidência",
                  "Regra / fundamento",
                  "Status",
                  "Prioridade",
                  "Ação",
                ].map((titulo) => (
                  <th
                    key={titulo}
                    className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400"
                  >
                    {titulo}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {creditosFiltrados.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                >
                  <td className="px-4 py-4">
                    <p className="text-xs font-black text-slate-900">
                      {item.cliente}
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                      {item.periodo}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-xs font-bold text-slate-600">
                    {item.origem}
                  </td>

                  <td className="px-4 py-4 text-xs font-black text-slate-700">
                    {item.documento}
                  </td>

                  <td className="px-4 py-4 text-xs font-black text-emerald-700">
                    {money(item.valor)}
                  </td>

                  <td className="px-4 py-4 text-xs font-semibold text-slate-600">
                    {item.evidencia}
                  </td>

                  <td className="max-w-[250px] px-4 py-4 text-[11px] leading-5 text-slate-500">
                    {item.fundamento}
                  </td>

                  <td className="px-4 py-4">
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </td>

                  <td className="px-4 py-4">
                    <Badge tone={prioridadeTone(item.prioridade)}>
                      {item.prioridade}
                    </Badge>
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      disabled
                      title="Abertura de Caso de Crédito será conectada em etapa posterior."
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-400"
                    >
                      Abrir caso
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}

              {creditosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-sm font-semibold text-slate-400"
                  >
                    Nenhuma ocorrência encontrada com os filtros informados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileCheck2 size={20} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                Evidência
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-900">
                Rastreabilidade antes da conclusão
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Cada ocorrência deverá guardar documento, período, origem, regra
                versionada, fonte oficial e evidências utilizadas na análise.
                Assim o escritório consegue explicar por que o valor foi
                classificado daquela forma.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-violet-100 bg-violet-50 p-6">
          <div className="flex items-center gap-2 text-violet-700">
            <FileSearch size={18} />

            <p className="text-xs font-black uppercase tracking-[0.15em]">
              Próxima conexão
            </p>
          </div>

          <h3 className="mt-3 text-lg font-black text-slate-900">
            Radar → Casos de Crédito
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Quando uma ocorrência precisar de acompanhamento, o usuário poderá
            abrir um Caso de Crédito com toda a evidência já carregada. O botão
            está propositalmente desabilitado nesta fase visual.
          </p>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   FORNECEDORES / CADEIA — ICC
   DADOS EXCLUSIVAMENTE DEMONSTRATIVOS
========================================================= */

const FORNECEDORES_DEMO = [
  {
    id: 1,
    fornecedor: "Distribuidora Nacional de Insumos Ltda.",
    cnpj: "12.345.678/0001-90",
    cliente: "Gama Indústria S.A.",
    documentos: 86,
    valorMovimentado: 418500,
    creditosAssociados: 58300,
    ocorrencias: 7,
    icc: 48,
    atencao: "Alta",
    evidencia: "XMLs + cadastro",
  },
  {
    id: 2,
    fornecedor: "Comercial Sudeste Ltda.",
    cnpj: "23.456.789/0001-10",
    cliente: "Alfa Comércio Ltda.",
    documentos: 64,
    valorMovimentado: 286900,
    creditosAssociados: 28640,
    ocorrencias: 5,
    icc: 61,
    atencao: "Alta",
    evidencia: "XMLs disponíveis",
  },
  {
    id: 3,
    fornecedor: "Serviços Corporativos Brasil Ltda.",
    cnpj: "34.567.890/0001-21",
    cliente: "Beta Serviços Empresariais",
    documentos: 42,
    valorMovimentado: 164800,
    creditosAssociados: 12400,
    ocorrencias: 3,
    icc: 72,
    atencao: "Média",
    evidencia: "NFS-e + cadastro",
  },
  {
    id: 4,
    fornecedor: "Logística Integrada Paulista Ltda.",
    cnpj: "45.678.901/0001-32",
    cliente: "Delta Distribuidora Ltda.",
    documentos: 37,
    valorMovimentado: 132600,
    creditosAssociados: 18750,
    ocorrencias: 2,
    icc: 81,
    atencao: "Média",
    evidencia: "CT-e + XML",
  },
  {
    id: 5,
    fornecedor: "Cloud Tecnologia e Serviços S.A.",
    cnpj: "56.789.012/0001-43",
    cliente: "Ômega Tecnologia Ltda.",
    documentos: 28,
    valorMovimentado: 89400,
    creditosAssociados: 4200,
    ocorrencias: 1,
    icc: 93,
    atencao: "Baixa",
    evidencia: "Documentos revisados",
  },
  {
    id: 6,
    fornecedor: "Atacado Brasil Central Ltda.",
    cnpj: "67.890.123/0001-54",
    cliente: "Alfa Comércio Ltda.",
    documentos: 53,
    valorMovimentado: 238000,
    creditosAssociados: 21400,
    ocorrencias: 4,
    icc: 67,
    atencao: "Média",
    evidencia: "XML + recorrência",
  },
];

function FornecedoresPage({ onBack }) {
  const [busca, setBusca] = useState("");
  const [atencao, setAtencao] = useState("Todas");

  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return FORNECEDORES_DEMO.filter((item) => {
      const buscaOk =
        !termo ||
        item.fornecedor.toLowerCase().includes(termo) ||
        item.cnpj.toLowerCase().includes(termo) ||
        item.cliente.toLowerCase().includes(termo);

      const atencaoOk = atencao === "Todas" || item.atencao === atencao;

      return buscaOk && atencaoOk;
    });
  }, [busca, atencao]);

  const totais = useMemo(() => {
    return FORNECEDORES_DEMO.reduce(
      (acc, item) => {
        acc.documentos += item.documentos;
        acc.movimentado += item.valorMovimentado;
        acc.creditos += item.creditosAssociados;
        acc.ocorrencias += item.ocorrencias;
        return acc;
      },
      {
        documentos: 0,
        movimentado: 0,
        creditos: 0,
        ocorrencias: 0,
      },
    );
  }, []);

  const iccMedio = useMemo(() => {
    if (!FORNECEDORES_DEMO.length) return 0;

    return Math.round(
      FORNECEDORES_DEMO.reduce((acc, item) => acc + item.icc, 0) /
        FORNECEDORES_DEMO.length,
    );
  }, []);

  const iccTone = (icc) => {
    if (icc < 60) return "rose";
    if (icc < 80) return "amber";
    return "emerald";
  };

  const atencaoTone = (nivel) => {
    if (nivel === "Alta") return "rose";
    if (nivel === "Média") return "amber";
    return "emerald";
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
      >
        <ChevronRight size={16} className="rotate-180" />
        Visão Geral
      </button>

      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#071329] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
              <Network size={14} />
              Fornecedores / Cadeia
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
              Entenda onde a cadeia exige mais atenção
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Relacione fornecedores, documentos, valores, ocorrências e
              créditos associados para priorizar revisões sem transformar o ICC
              em uma conclusão fiscal automática.
            </p>
          </div>

          <Badge tone="emerald">Dados demonstrativos</Badge>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Network}
          label="Fornecedores analisados"
          value={FORNECEDORES_DEMO.length}
          helper="Fornecedores presentes nesta demonstração da cadeia."
          tone="blue"
        />

        <MetricCard
          icon={Gauge}
          label="ICC médio"
          value={`${iccMedio}/100`}
          helper="Indicador demonstrativo de priorização da cadeia."
          tone="amber"
        />

        <MetricCard
          icon={CircleDollarSign}
          label="Créditos associados"
          value={money(totais.creditos)}
          helper="Valores potenciais relacionados aos fornecedores."
          tone="emerald"
        />

        <MetricCard
          icon={TriangleAlert}
          label="Ocorrências"
          value={totais.ocorrencias}
          helper="Pontos demonstrativos que exigem análise."
          tone="rose"
        />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Gauge size={20} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">
                ICC
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-900">
                Índice de Conformidade da Cadeia
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                O ICC é uma camada explicável de priorização. Na versão real,
                sua composição deverá mostrar quais fatores documentais,
                cadastrais, de recorrência e de crédito elevaram ou reduziram o
                índice de cada fornecedor.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Documental", "Presença e consistência dos documentos"],
              ["Cadastral", "Dados necessários para análise da operação"],
              ["Recorrência", "Volume e repetição das ocorrências"],
              ["Crédito", "Valores potenciais associados à cadeia"],
            ].map(([titulo, texto]) => (
              <div key={titulo} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-900">{titulo}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {texto}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-6">
          <div className="flex items-center gap-2 text-blue-700">
            <ShieldCheck size={18} />

            <p className="text-xs font-black uppercase tracking-[0.15em]">
              Limite do indicador
            </p>
          </div>

          <h3 className="mt-3 text-lg font-black text-slate-900">
            ICC não é selo de regularidade fiscal
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Um ICC menor apenas indica que aquele fornecedor merece maior
            atenção dentro dos critérios analisados. Ele não significa, por si
            só, irregularidade fiscal, documento inválido ou perda de crédito.
          </p>
        </div>
      </section>

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">
                Mapa da cadeia
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-900">
                Fornecedores monitorados
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Visualize recorrência, movimentação, créditos associados,
                ocorrências e ICC por fornecedor.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar fornecedor, CNPJ ou cliente..."
                className="h-10 min-w-[290px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />

              <select
                value={atencao}
                onChange={(event) => setAtencao(event.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-blue-400"
              >
                <option>Todas</option>
                <option>Alta</option>
                <option>Média</option>
                <option>Baixa</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1350px] w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {[
                  "Fornecedor / CNPJ",
                  "Cliente relacionado",
                  "Documentos",
                  "Valor movimentado",
                  "Créditos associados",
                  "Ocorrências",
                  "ICC",
                  "Atenção",
                  "Evidência",
                  "Ação",
                ].map((titulo) => (
                  <th
                    key={titulo}
                    className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400"
                  >
                    {titulo}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {fornecedoresFiltrados.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                >
                  <td className="px-4 py-4">
                    <p className="text-xs font-black text-slate-900">
                      {item.fornecedor}
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                      {item.cnpj}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-xs font-bold text-slate-600">
                    {item.cliente}
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-black text-slate-700">
                      {item.documentos}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-xs font-black text-slate-700">
                    {money(item.valorMovimentado)}
                  </td>

                  <td className="px-4 py-4 text-xs font-black text-emerald-700">
                    {money(item.creditosAssociados)}
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-rose-50 px-2 text-xs font-black text-rose-700">
                      {item.ocorrencias}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="min-w-[120px]">
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="text-xs font-black text-slate-900">
                          {item.icc}/100
                        </span>
                      </div>

                      <Progress value={item.icc} tone={iccTone(item.icc)} />
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <Badge tone={atencaoTone(item.atencao)}>
                      {item.atencao}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-xs font-semibold text-slate-600">
                    {item.evidencia}
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      disabled
                      title="Detalhamento do fornecedor será conectado ao motor documental posteriormente."
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-400"
                    >
                      Analisar
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}

              {fornecedoresFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-5 py-10 text-center text-sm font-semibold text-slate-400"
                  >
                    Nenhum fornecedor encontrado com os filtros informados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600">
            <PackageSearch size={18} />

            <p className="text-xs font-black uppercase tracking-[0.15em]">
              Documentos
            </p>
          </div>

          <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-900">
            {totais.documentos}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Volume documental demonstrativo relacionado aos fornecedores
            analisados.
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-violet-600">
            <WalletCards size={18} />

            <p className="text-xs font-black uppercase tracking-[0.15em]">
              Movimentação
            </p>
          </div>

          <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-900">
            {money(totais.movimentado)}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Valor demonstrativo das operações relacionadas à cadeia
            monitorada.
          </p>
        </div>

        <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-6">
          <div className="flex items-center gap-2 text-emerald-700">
            <Network size={18} />

            <p className="text-xs font-black uppercase tracking-[0.15em]">
              Rastreabilidade
            </p>
          </div>

          <h3 className="mt-3 text-lg font-black text-slate-900">
            Fornecedor → Documento → Ocorrência → Crédito
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            A futura conexão manterá o caminho completo da evidência. Assim um
            valor encontrado no Radar de Créditos poderá ser rastreado até o
            documento e o fornecedor de origem.
          </p>
        </div>
      </section>

      <section className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-amber-600"
          />

          <div>
            <p className="text-xs font-black text-amber-900">
              Leitura correta do ICC
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">
              Os valores, documentos, ocorrências e índices desta tela são
              exclusivamente demonstrativos. O ICC organiza prioridade de
              análise e não deve ser interpretado como certificação de
              conformidade, irregularidade fiscal ou confirmação de crédito.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   CASOS DE CRÉDITO — ACOMPANHAMENTO E EVIDÊNCIAS
   DADOS EXCLUSIVAMENTE DEMONSTRATIVOS
========================================================= */

const CASOS_CREDITO_DEMO = [
  {
    id: "CC-2026-001",
    cliente: "Alfa Comércio Ltda.",
    documento: "NF-e 18452",
    periodo: "08/2026",
    origem: "Aquisição de mercadorias",
    valor: 28640,
    status: "Em análise",
    prioridade: "Alta",
    evidencia: "XML disponível",
    evidencias: 3,
    responsavel: "Fiscal / Consultivo",
    atualizado: "25/09/2026",
    proximaAcao: "Confrontar documento com a regra aplicável à operação.",
  },
  {
    id: "CC-2026-002",
    cliente: "Gama Indústria S.A.",
    documento: "NF-e 77831",
    periodo: "08/2026",
    origem: "Insumos da operação",
    valor: 58300,
    status: "Confirmado",
    prioridade: "Alta",
    evidencia: "XML + fornecedor",
    evidencias: 5,
    responsavel: "Fiscal",
    atualizado: "24/09/2026",
    proximaAcao: "Preparar documentação para a etapa de regularização.",
  },
  {
    id: "CC-2026-003",
    cliente: "Delta Distribuidora Ltda.",
    documento: "NF-e 33019",
    periodo: "09/2026",
    origem: "Entradas da cadeia",
    valor: 18750,
    status: "Em regularização",
    prioridade: "Média",
    evidencia: "XML + cadeia",
    evidencias: 4,
    responsavel: "Fiscal / Cliente",
    atualizado: "23/09/2026",
    proximaAcao: "Acompanhar pendências documentais do caso.",
  },
  {
    id: "CC-2026-004",
    cliente: "Beta Serviços Empresariais",
    documento: "NFS-e 9021",
    periodo: "09/2026",
    origem: "Aquisição vinculada à atividade",
    valor: 12400,
    status: "Regularizado",
    prioridade: "Média",
    evidencia: "Documento + cadastro",
    evidencias: 6,
    responsavel: "Consultivo",
    atualizado: "22/09/2026",
    proximaAcao: "Caso concluído no fluxo demonstrativo.",
  },
  {
    id: "CC-2026-005",
    cliente: "Ômega Tecnologia Ltda.",
    documento: "NFS-e 4418",
    periodo: "09/2026",
    origem: "Serviços contratados",
    valor: 4200,
    status: "Descartado",
    prioridade: "Baixa",
    evidencia: "Evidência revisada",
    evidencias: 2,
    responsavel: "Fiscal",
    atualizado: "20/09/2026",
    proximaAcao: "Manter histórico e justificativa do descarte.",
  },
];

function CasosCreditoPage({ onBack }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("Todos");
  const [prioridade, setPrioridade] = useState("Todas");
  const [casoSelecionado, setCasoSelecionado] = useState(null);

  const casosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return CASOS_CREDITO_DEMO.filter((item) => {
      const buscaOk =
        !termo ||
        item.id.toLowerCase().includes(termo) ||
        item.cliente.toLowerCase().includes(termo) ||
        item.documento.toLowerCase().includes(termo) ||
        item.origem.toLowerCase().includes(termo);
      const statusOk = status === "Todos" || item.status === status;
      const prioridadeOk = prioridade === "Todas" || item.prioridade === prioridade;
      return buscaOk && statusOk && prioridadeOk;
    });
  }, [busca, status, prioridade]);

  const totais = useMemo(() => {
    const abertos = CASOS_CREDITO_DEMO.filter((item) =>
      ["Em análise", "Confirmado", "Em regularização"].includes(item.status),
    );
    return {
      total: CASOS_CREDITO_DEMO.length,
      abertos: abertos.length,
      potencialAberto: abertos.reduce((acc, item) => acc + item.valor, 0),
      evidencias: CASOS_CREDITO_DEMO.reduce((acc, item) => acc + item.evidencias, 0),
    };
  }, []);

  const statusTone = (nome) => {
    if (nome === "Regularizado") return "emerald";
    if (nome === "Confirmado") return "blue";
    if (nome === "Em regularização") return "violet";
    if (nome === "Descartado") return "slate";
    return "amber";
  };

  const prioridadeTone = (nome) => {
    if (nome === "Alta") return "rose";
    if (nome === "Média") return "amber";
    return "emerald";
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
      >
        <ChevronRight size={16} className="rotate-180" />
        Visão Geral
      </button>

      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#071329] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
              <FileSearch size={14} />
              Casos de Crédito
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
              Do indício ao encerramento, com rastreabilidade
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Centralize ocorrência, documento, evidências, valor potencial, prioridade e andamento sem transformar acompanhamento em conclusão fiscal automática.
            </p>
          </div>
          <Badge tone="emerald">Dados demonstrativos</Badge>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FileSearch} label="Casos" value={totais.total} helper="Casos presentes no ambiente demonstrativo." tone="violet" />
        <MetricCard icon={Activity} label="Em andamento" value={totais.abertos} helper="Em análise, confirmados ou em regularização." tone="blue" />
        <MetricCard icon={CircleDollarSign} label="Potencial em aberto" value={money(totais.potencialAberto)} helper="Valor demonstrativo ainda acompanhado no fluxo." tone="emerald" />
        <MetricCard icon={FileCheck2} label="Evidências vinculadas" value={totais.evidencias} helper="Itens demonstrativos associados aos casos." tone="amber" />
      </section>

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Fluxo do caso</p>
        <h3 className="mt-1 text-lg font-black text-slate-900">Acompanhamento sem perder o histórico</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {["Em análise", "Confirmado", "Em regularização", "Regularizado", "Descartado"].map((etapa, index) => (
            <div key={etapa} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-[11px] font-black text-white">{index + 1}</span>
              <p className="mt-3 text-xs font-black text-slate-900">{etapa}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {etapa === "Em análise" && "Documento, operação e evidências em revisão."}
                {etapa === "Confirmado" && "Caso demonstrativo com evidência suficiente para avançar."}
                {etapa === "Em regularização" && "Acompanhamento das providências relacionadas ao caso."}
                {etapa === "Regularizado" && "Fluxo demonstrativo concluído com histórico preservado."}
                {etapa === "Descartado" && "Hipótese encerrada com justificativa registrada."}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Central de acompanhamento</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Casos registrados</h3>
              <p className="mt-1 text-xs text-slate-500">Filtre a demonstração por cliente, documento, status ou prioridade.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar caso, cliente ou documento..." className="h-10 min-w-[260px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-blue-400">
                <option>Todos</option><option>Em análise</option><option>Confirmado</option><option>Em regularização</option><option>Regularizado</option><option>Descartado</option>
              </select>
              <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-blue-400">
                <option>Todas</option><option>Alta</option><option>Média</option><option>Baixa</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {["Caso", "Cliente", "Documento / período", "Valor potencial", "Evidências", "Status", "Prioridade", "Atualização", "Ação"].map((titulo) => (
                  <th key={titulo} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{titulo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {casosFiltrados.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                  <td className="px-4 py-4"><p className="text-xs font-black text-slate-900">{item.id}</p><p className="mt-1 text-[10px] text-slate-400">{item.origem}</p></td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-600">{item.cliente}</td>
                  <td className="px-4 py-4"><p className="text-xs font-black text-slate-700">{item.documento}</p><p className="mt-1 text-[10px] text-slate-400">{item.periodo}</p></td>
                  <td className="px-4 py-4 text-xs font-black text-emerald-700">{money(item.valor)}</td>
                  <td className="px-4 py-4"><p className="text-xs font-bold text-slate-700">{item.evidencias} itens</p><p className="mt-1 text-[10px] text-slate-400">{item.evidencia}</p></td>
                  <td className="px-4 py-4"><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                  <td className="px-4 py-4"><Badge tone={prioridadeTone(item.prioridade)}>{item.prioridade}</Badge></td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-500">{item.atualizado}</td>
                  <td className="px-4 py-4"><button type="button" onClick={() => setCasoSelecionado(item)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-black text-blue-700 transition hover:bg-blue-100">Ver caso<ChevronRight size={13} /></button></td>
                </tr>
              ))}
              {casosFiltrados.length === 0 ? <tr><td colSpan={9} className="px-5 py-10 text-center text-sm font-semibold text-slate-400">Nenhum caso encontrado com os filtros informados.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      {casoSelecionado ? (
        <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Detalhe do caso</p><h3 className="mt-1 text-lg font-black text-slate-900">{casoSelecionado.id} · {casoSelecionado.cliente}</h3></div>
              <button type="button" onClick={() => setCasoSelecionado(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-black text-slate-500">Fechar detalhe</button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Documento", casoSelecionado.documento],
                ["Período", casoSelecionado.periodo],
                ["Origem", casoSelecionado.origem],
                ["Valor potencial", money(casoSelecionado.valor)],
                ["Responsável", casoSelecionado.responsavel],
                ["Última atualização", casoSelecionado.atualizado],
              ].map(([titulo, valor]) => <div key={titulo} className="rounded-2xl bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{titulo}</p><p className="mt-1 text-xs font-black text-slate-800">{valor}</p></div>)}
            </div>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-black text-blue-900">Próxima ação</p><p className="mt-1 text-xs leading-5 text-blue-800">{casoSelecionado.proximaAcao}</p></div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700"><FileCheck2 size={18} /><p className="text-xs font-black uppercase tracking-[0.15em]">Evidências</p></div>
            <h3 className="mt-3 text-lg font-black text-slate-900">Rastreabilidade do caso</h3>
            <div className="mt-4 space-y-3">
              {[`Documento de origem: ${casoSelecionado.documento}`, `Evidência principal: ${casoSelecionado.evidencia}`, `Período analisado: ${casoSelecionado.periodo}`, `Origem identificada: ${casoSelecionado.origem}`].map((texto, index) => (
                <div key={texto} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"><span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[10px] font-black text-emerald-700">{index + 1}</span><p className="text-[11px] font-semibold leading-5 text-slate-600">{texto}</p></div>
              ))}
            </div>
            <button type="button" disabled title="Upload e persistência de evidências serão conectados em etapa posterior." className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-400"><FileCheck2 size={15} />Adicionar evidência — em breve</button>
          </div>
        </section>
      ) : null}

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-violet-100 bg-violet-50 p-6">
          <div className="flex items-center gap-2 text-violet-700"><Network size={18} /><p className="text-xs font-black uppercase tracking-[0.15em]">Rastreabilidade</p></div>
          <h3 className="mt-3 text-lg font-black text-slate-900">Radar → Fornecedor → Documento → Caso</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">A arquitetura visual preserva a origem do caso para que a futura camada real consiga demonstrar de onde veio cada ocorrência e quais evidências sustentaram seu andamento.</p>
        </div>
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2 text-amber-700"><AlertTriangle size={18} /><p className="text-xs font-black uppercase tracking-[0.15em]">Limite desta fase</p></div>
          <h3 className="mt-3 text-lg font-black text-slate-900">Acompanhamento não é conclusão tributária</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Todos os casos, valores, evidências e status desta tela são demonstrativos. Nenhum status confirma, por si só, direito a crédito, irregularidade, recuperação ou obrigação fiscal.</p>
        </div>
      </section>
    </div>
  );
}


/* =========================================================
   DIGITAL TWIN — CENÁRIOS EXCLUSIVAMENTE DEMONSTRATIVOS
========================================================= */

const DIGITAL_TWIN_CENARIOS_DEMO = [
  { id: "atual", nome: "Cenário atual", receita: 850000, compras: 410000, debitos: 76500, creditos: 32800, caixa: 806300, margem: 24.8 },
  { id: "transicao", nome: "Transição simulada", receita: 850000, compras: 410000, debitos: 89200, creditos: 41700, caixa: 802500, margem: 23.9 },
  { id: "otimizado", nome: "Cenário revisado", receita: 850000, compras: 410000, debitos: 89200, creditos: 49300, caixa: 810100, margem: 24.7 },
];

function DigitalTwinPage({ onBack }) {
  const [cenarioId, setCenarioId] = useState("transicao");
  const [receita, setReceita] = useState(850000);
  const [compras, setCompras] = useState(410000);
  const [margemAtual, setMargemAtual] = useState(24.8);

  const cenario = DIGITAL_TWIN_CENARIOS_DEMO.find((item) => item.id === cenarioId) || DIGITAL_TWIN_CENARIOS_DEMO[1];
  const base = DIGITAL_TWIN_CENARIOS_DEMO[0];
  const fator = receita > 0 ? receita / base.receita : 1;
  const debitos = Math.round(cenario.debitos * fator);
  const creditos = Math.round(cenario.creditos * fator);
  const saldoTributario = Math.max(0, debitos - creditos);
  const saldoBase = Math.max(0, base.debitos * fator - base.creditos * fator);
  const impactoCaixa = Math.round(saldoBase - saldoTributario);
  const margemProjetada = Math.max(0, margemAtual + (impactoCaixa / Math.max(receita, 1)) * 100);
  const precoEquilibrio = receita > 0 ? Math.round(receita * (1 + Math.max(0, margemAtual - margemProjetada) / 100)) : 0;

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600">
        <ChevronRight size={16} className="rotate-180" />
        Visão Geral
      </button>

      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#071329] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
              <Boxes size={14} /> Digital Twin Tributário
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Simule o impacto antes que ele chegue ao caixa</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Espelho financeiro demonstrativo para comparar receita, compras, débitos, créditos, caixa e margem em diferentes cenários da transição.
            </p>
          </div>
          <Badge tone="violet">Simulação demonstrativa</Badge>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CircleDollarSign} label="Receita simulada" value={money(receita)} helper="Base mensal informada para o cenário." tone="blue" />
        <MetricCard icon={WalletCards} label="Saldo tributário simulado" value={money(saldoTributario)} helper="Débitos menos créditos no cenário selecionado." tone="amber" />
        <MetricCard icon={TrendingUp} label="Impacto estimado no caixa" value={`${impactoCaixa >= 0 ? "+" : "-"}${money(Math.abs(impactoCaixa))}`} helper="Diferença demonstrativa contra o cenário atual." tone={impactoCaixa >= 0 ? "emerald" : "rose"} />
        <MetricCard icon={Gauge} label="Margem projetada" value={`${margemProjetada.toFixed(1)}%`} helper={`Margem de referência informada: ${margemAtual.toFixed(1)}%.`} tone="violet" />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Premissas</p>
          <h3 className="mt-1 text-lg font-black text-slate-900">Monte o cenário</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">Os campos abaixo alteram apenas esta demonstração visual.</p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-black text-slate-600">Cenário</span>
              <select value={cenarioId} onChange={(e) => setCenarioId(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400">
                {DIGITAL_TWIN_CENARIOS_DEMO.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-600">Receita mensal</span>
              <CurrencyInput value={receita} onChange={setReceita} tone="violet" />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-600">Compras / aquisições</span>
              <CurrencyInput value={compras} onChange={setCompras} tone="violet" />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-600">Margem atual (%)</span>
              <input type="number" min="0" max="100" step="0.1" value={margemAtual} onChange={(e) => setMargemAtual(Number(e.target.value) || 0)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400" />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <p className="text-xs font-black text-violet-900">Premissas sempre visíveis</p>
            <p className="mt-1 text-[11px] leading-5 text-violet-700">No motor real, cada cenário deverá registrar período, regime, operação, regra, fonte, versão e vigência utilizadas.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Comparativo financeiro</p>
                <h3 className="mt-1 text-lg font-black text-slate-900">Atual × cenário selecionado</h3>
              </div>
              <Badge tone="blue">{cenario.nome}</Badge>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left">
                <thead><tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Indicador</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Cenário atual</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Simulado</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Leitura</th>
                </tr></thead>
                <tbody>
                  {[
                    ["Receita", money(receita), money(receita), "Base mantida"],
                    ["Compras / aquisições", money(compras), money(compras), "Premissa informada"],
                    ["Débitos", money(Math.round(base.debitos * fator)), money(debitos), "Simulação"],
                    ["Créditos", money(Math.round(base.creditos * fator)), money(creditos), "Simulação"],
                    ["Saldo tributário", money(Math.round(saldoBase)), money(saldoTributario), "Impacto no caixa"],
                    ["Margem", `${margemAtual.toFixed(1)}%`, `${margemProjetada.toFixed(1)}%`, "Impacto estimado"],
                  ].map(([indicador, atual, simulado, leitura]) => (
                    <tr key={indicador} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-4 text-xs font-black text-slate-900">{indicador}</td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-600">{atual}</td>
                      <td className="px-4 py-4 text-xs font-black text-slate-900">{simulado}</td>
                      <td className="px-4 py-4"><Badge tone="slate">{leitura}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-6">
              <div className="flex items-center gap-2 text-emerald-700"><Scale size={18} /><p className="text-xs font-black uppercase tracking-[0.15em]">Preço de equilíbrio</p></div>
              <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-900">{money(precoEquilibrio)}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">Referência demonstrativa de faturamento necessário para preservar a margem informada diante do impacto simulado.</p>
            </div>

            <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-center gap-2 text-blue-700"><ArrowRight size={18} /><p className="text-xs font-black uppercase tracking-[0.15em]">Conexão futura</p></div>
              <p className="mt-3 text-sm font-black text-slate-900">Digital Twin → Reprecificação → Proposta</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">O resultado poderá alimentar a decisão comercial, mas nunca alterará honorários automaticamente.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-xs font-black text-amber-900">Simulação, não conclusão tributária</p>
            <p className="mt-1 text-xs leading-5 text-amber-800">Os números desta tela são exclusivamente demonstrativos e não representam alíquotas, créditos, débitos ou carga tributária oficial. O motor real será conectado somente a regras oficiais versionadas e vigentes.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   SIMULADORES — MARGEM, PREÇO E CAIXA / DADOS DEMONSTRATIVOS
========================================================= */

function SimuladoresPage({ onBack }) {
  const [aba, setAba] = useState("margem");
  const [precoAtual, setPrecoAtual] = useState(100000);
  const [custoOperacional, setCustoOperacional] = useState(62000);
  const [impactoEstimado, setImpactoEstimado] = useState(8500);
  const [recebimentos, setRecebimentos] = useState(180000);
  const [segregacaoEstimada, setSegregacaoEstimada] = useState(16200);
  const [creditosCaixa, setCreditosCaixa] = useState(6400);

  const margemAtualValor = precoAtual - custoOperacional;
  const margemAtualPct = precoAtual > 0 ? (margemAtualValor / precoAtual) * 100 : 0;
  const margemProjetadaValor = precoAtual - custoOperacional - impactoEstimado;
  const margemProjetadaPct = precoAtual > 0 ? (margemProjetadaValor / precoAtual) * 100 : 0;
  const precoEquilibrio = margemAtualPct < 100
    ? (custoOperacional + impactoEstimado) / (1 - margemAtualPct / 100)
    : precoAtual;
  const necessidadeReajuste = Math.max(0, precoEquilibrio - precoAtual);
  const caixaLiquidoAtual = recebimentos;
  const caixaLiquidoSimulado = recebimentos - segregacaoEstimada + creditosCaixa;
  const impactoCaixa = caixaLiquidoSimulado - caixaLiquidoAtual;


  return (
    <div>
      <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600">
        <ChevronRight size={16} className="rotate-180" />
        Visão Geral
      </button>

      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#071329] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
              <Calculator size={14} /> Simuladores
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Transforme impacto em decisão financeira</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Simule margem, preço de equilíbrio e efeito de caixa sem alterar honorários, propostas ou qualquer dado real do cliente.
            </p>
          </div>
          <Badge tone="emerald">Dados demonstrativos</Badge>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setAba("margem")} className={`rounded-[20px] border p-5 text-left transition ${aba === "margem" ? "border-violet-300 bg-violet-50 shadow-sm" : "border-slate-200 bg-white hover:border-violet-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${aba === "margem" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}><TrendingUp size={19} /></div>
            <div><p className="text-sm font-black text-slate-900">Margem & Preço</p><p className="mt-0.5 text-[11px] text-slate-500">Quanto o preço precisaria mudar para preservar a margem.</p></div>
          </div>
        </button>
        <button type="button" onClick={() => setAba("caixa")} className={`rounded-[20px] border p-5 text-left transition ${aba === "caixa" ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${aba === "caixa" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}><WalletCards size={19} /></div>
            <div><p className="text-sm font-black text-slate-900">Caixa / Split Payment</p><p className="mt-0.5 text-[11px] text-slate-500">Visualize cenários financeiros de segregação e créditos.</p></div>
          </div>
        </button>
      </section>

      {aba === "margem" ? (
        <>
          <section className="mt-5 grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Premissas do cenário</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Margem & Preço</h3>
              <div className="mt-5 space-y-4">
                {[
                  ["Preço / receita atual", precoAtual, setPrecoAtual],
                  ["Custo operacional", custoOperacional, setCustoOperacional],
                  ["Impacto estimado da Reforma", impactoEstimado, setImpactoEstimado],
                ].map(([label, value, setter]) => (
                  <label key={label} className="block">
                    <span className="text-xs font-black text-slate-600">{label}</span>
                    <CurrencyInput value={value} onChange={setter} tone="violet" />
                  </label>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black text-amber-900">Premissa manual nesta fase</p>
                <p className="mt-1 text-[11px] leading-5 text-amber-800">O impacto é informado pelo usuário para testar a experiência. Nenhuma alíquota IBS/CBS é presumida por esta tela.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Gauge} label="Margem atual" value={`${margemAtualPct.toFixed(1)}%`} helper={money(margemAtualValor)} tone="blue" />
                <MetricCard icon={TriangleAlert} label="Margem projetada" value={`${margemProjetadaPct.toFixed(1)}%`} helper={money(margemProjetadaValor)} tone="amber" />
                <MetricCard icon={CircleDollarSign} label="Preço de equilíbrio" value={money(precoEquilibrio)} helper="Para preservar a margem atual no cenário." tone="emerald" />
                <MetricCard icon={TrendingUp} label="Reajuste indicativo" value={money(necessidadeReajuste)} helper="Diferença matemática do cenário, não recomendação automática." tone="violet" />
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Comparativo</p><h3 className="mt-1 text-lg font-black text-slate-900">Atual × Cenário simulado</h3></div><Badge tone="violet">Simulação</Badge></div>
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead><tr className="border-b border-slate-100 bg-slate-50"><th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Indicador</th><th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Atual</th><th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Simulado</th><th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Variação</th></tr></thead>
                    <tbody>
                      <tr className="border-b border-slate-100"><td className="px-4 py-4 text-xs font-black text-slate-900">Preço / receita</td><td className="px-4 py-4 text-xs font-bold text-slate-600">{money(precoAtual)}</td><td className="px-4 py-4 text-xs font-black text-emerald-700">{money(precoEquilibrio)}</td><td className="px-4 py-4 text-xs font-black text-violet-700">+{money(necessidadeReajuste)}</td></tr>
                      <tr><td className="px-4 py-4 text-xs font-black text-slate-900">Margem</td><td className="px-4 py-4 text-xs font-bold text-slate-600">{margemAtualPct.toFixed(1)}%</td><td className="px-4 py-4 text-xs font-black text-amber-700">{margemProjetadaPct.toFixed(1)}%</td><td className="px-4 py-4 text-xs font-black text-rose-700">{(margemProjetadaPct - margemAtualPct).toFixed(1)} p.p.</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[24px] border border-blue-100 bg-blue-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black text-blue-900">Conexão futura com a Precificação</p><p className="mt-1 text-xs leading-5 text-blue-700">Após validação do cenário: Digital Twin → Simulador → Reprecificação → Serviço adicional / Proposta. Nenhum honorário será alterado automaticamente.</p></div><button type="button" disabled className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-xs font-black text-blue-300">Enviar para Reprecificação <ArrowRight size={14} /></button></div>
          </section>
        </>
      ) : (
        <>
          <section className="mt-5 grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Cenário financeiro</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Caixa / Split Payment</h3>
              <div className="mt-5 space-y-4">
                {[
                  ["Recebimentos do período", recebimentos, setRecebimentos],
                  ["Segregação estimada", segregacaoEstimada, setSegregacaoEstimada],
                  ["Créditos considerados", creditosCaixa, setCreditosCaixa],
                ].map(([label, value, setter]) => (
                  <label key={label} className="block"><span className="text-xs font-black text-slate-600">{label}</span><CurrencyInput value={value} onChange={setter} tone="blue" /></label>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-black text-amber-900">Cenário, não cálculo fiscal</p><p className="mt-1 text-[11px] leading-5 text-amber-800">Os valores de segregação e créditos são premissas manuais. O motor real deverá aplicar regras vigentes, documentos e integrações antes de qualquer conclusão.</p></div>
            </div>

            <div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={WalletCards} label="Caixa atual" value={money(caixaLiquidoAtual)} helper="Recebimento bruto do cenário." tone="blue" />
                <MetricCard icon={Scale} label="Segregação" value={money(segregacaoEstimada)} helper="Premissa informada manualmente." tone="amber" />
                <MetricCard icon={CircleDollarSign} label="Créditos" value={money(creditosCaixa)} helper="Premissa considerada na simulação." tone="emerald" />
                <MetricCard icon={Activity} label="Impacto no caixa" value={money(impactoCaixa)} helper="Diferença do cenário simulado." tone={impactoCaixa < 0 ? "rose" : "emerald"} />
              </div>
              <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Leitura financeira</p><h3 className="mt-1 text-lg font-black text-slate-900">Fluxo demonstrativo do recebimento</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase text-slate-400">1. Recebimento</p><p className="mt-2 text-lg font-black text-slate-900">{money(recebimentos)}</p></div>
                  <div className="rounded-2xl bg-amber-50 p-4"><p className="text-[10px] font-black uppercase text-amber-600">2. Segregação</p><p className="mt-2 text-lg font-black text-slate-900">-{money(segregacaoEstimada)}</p></div>
                  <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-[10px] font-black uppercase text-emerald-600">3. Caixa simulado</p><p className="mt-2 text-lg font-black text-slate-900">{money(caixaLiquidoSimulado)}</p></div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-600" /><div><p className="text-xs font-black text-slate-900">Regra desta fase</p><p className="mt-1 text-xs leading-5 text-slate-500">Os simuladores são ferramentas de análise de cenário. Não confirmam tributo devido, crédito aproveitável, regra de split payment nem preço que o cliente deva praticar. A camada fiscal real será versionada e conectada posteriormente.</p></div></div>
      </section>
    </div>
  );
}


/* =========================================================
   PLAYBOOKS — GUIAS DE ANÁLISE / DADOS DEMONSTRATIVOS
========================================================= */

const PLAYBOOKS_DEMO = [
  { id: 1, categoria: "Documentos fiscais", titulo: "Campos IBS/CBS ausentes ou incompletos", prioridade: "Alta", situacao: "Documento eletrônico apresenta ausência ou inconsistência aparente em informações relacionadas a IBS/CBS.", checagens: ["Identificar o tipo de documento e a data da operação", "Confirmar o cronograma aplicável ao documento", "Confrontar a evidência com a regra de validação vigente"], documentos: "XML / documento fiscal + evidência da autorização", acao: "Classificar a ocorrência pela vigência correta antes de solicitar correção ou concluir desconformidade.", fundamento: "Cronograma DF-e e orientações RFB/CGIBS", referencia: "Base oficial revisada em 25/09/2026" },
  { id: 2, categoria: "Créditos", titulo: "Crédito potencial identificado no Radar", prioridade: "Alta", situacao: "O Radar encontrou valor potencial associado a documento de entrada ou aquisição.", checagens: ["Rastrear documento e fornecedor de origem", "Confirmar operação, regime e período", "Reunir evidências antes de alterar o status do caso"], documentos: "Documento fiscal + cadastro + memória de análise", acao: "Abrir Caso de Crédito e manter o valor como potencial até validação suficiente.", fundamento: "Fluxo interno de rastreabilidade e legislação aplicável à operação", referencia: "Playbook demonstrativo — regra fiscal será versionada" },
  { id: 3, categoria: "Cadeia", titulo: "Fornecedor com recorrência de ocorrências", prioridade: "Média", situacao: "Fornecedor concentra documentos, valores ou ocorrências que justificam revisão prioritária.", checagens: ["Analisar recorrência documental", "Relacionar ocorrências aos documentos", "Verificar créditos associados sem presumir irregularidade"], documentos: "XMLs / documentos + cadastro do fornecedor", acao: "Priorizar revisão da cadeia e vincular evidências aos casos relacionados.", fundamento: "ICC como indicador interno de prioridade", referencia: "ICC não representa certificação fiscal" },
  { id: 4, categoria: "Simples Nacional", titulo: "Revisão de enquadramento para 2027", prioridade: "Alta", situacao: "Cliente do Simples exige acompanhamento das regras e opções aplicáveis ao IBS/CBS para o período seguinte.", checagens: ["Confirmar regime atual e período analisado", "Consultar orientação oficial vigente antes da decisão", "Registrar premissas e decisão do contribuinte/escritório"], documentos: "Cadastro tributário + simulações + evidência da orientação utilizada", acao: "Executar análise comparativa e registrar a decisão humana; o PrecificaCont não escolhe o regime pelo usuário.", fundamento: "Regulamentação do Simples Nacional adaptada à RTC", referencia: "Base oficial 2026 — revisar vigência antes do uso" },
  { id: 5, categoria: "Margem e caixa", titulo: "Impacto econômico relevante no Digital Twin", prioridade: "Média", situacao: "Cenário demonstrativo indica possível pressão sobre caixa, margem ou preço.", checagens: ["Revisar premissas financeiras", "Separar impacto fiscal validado de hipótese de cenário", "Comparar margem atual e projetada"], documentos: "Premissas do Digital Twin + documentos de suporte", acao: "Levar o cenário para análise consultiva e, quando aprovado, avaliar reprecificação ou serviço adicional.", fundamento: "Simulação econômica do PrecificaCont", referencia: "Não substitui apuração tributária" },
];

function PlaybooksPage({ onBack }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [aberto, setAberto] = useState(1);
  const categorias = ["Todas", ...new Set(PLAYBOOKS_DEMO.map((item) => item.categoria))];
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return PLAYBOOKS_DEMO.filter((item) => {
      const buscaOk = !termo || item.titulo.toLowerCase().includes(termo) || item.situacao.toLowerCase().includes(termo) || item.categoria.toLowerCase().includes(termo);
      return buscaOk && (categoria === "Todas" || item.categoria === categoria);
    });
  }, [busca, categoria]);
  const prioridadeTone = (valor) => valor === "Alta" ? "rose" : valor === "Média" ? "amber" : "emerald";

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"><ChevronRight size={16} className="rotate-180" />Visão Geral</button>
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#071329] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300"><ReceiptText size={14} />Playbooks</div><h2 className="mt-4 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Da ocorrência à análise orientada</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Guias versionáveis para organizar situação, checagens, documentos, ação e fundamento — sem substituir julgamento profissional ou transformar orientação em conclusão fiscal automática.</p></div><Badge tone="emerald">Base revisada 25/09/2026</Badge></div>
      </section>
      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={ReceiptText} label="Playbooks" value={PLAYBOOKS_DEMO.length} helper="Guias demonstrativos disponíveis." tone="violet" /><MetricCard icon={AlertTriangle} label="Prioridade alta" value={PLAYBOOKS_DEMO.filter((x) => x.prioridade === "Alta").length} helper="Situações priorizadas para revisão." tone="rose" /><MetricCard icon={FileCheck2} label="Rastreabilidade" value="100%" helper="Situação → evidência → ação → fundamento." tone="blue" /><MetricCard icon={ShieldCheck} label="Decisão automática" value="Não" helper="A conclusão permanece humana e documentada." tone="emerald" /></section>
      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Biblioteca operacional</p><h3 className="mt-1 text-lg font-black text-slate-900">Encontre o playbook da situação</h3></div><div className="flex flex-col gap-2 sm:flex-row"><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar situação..." className="h-10 min-w-[230px] rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400" /><select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none">{categorias.map((item) => <option key={item}>{item}</option>)}</select></div></div></section>
      <section className="mt-4 space-y-3">{filtrados.map((item) => { const ativo = aberto === item.id; return <div key={item.id} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"><button type="button" onClick={() => setAberto(ativo ? null : item.id)} className="flex w-full items-center justify-between gap-4 p-5 text-left"><div><div className="flex flex-wrap items-center gap-2"><Badge tone="violet">{item.categoria}</Badge><Badge tone={prioridadeTone(item.prioridade)}>{item.prioridade}</Badge></div><h3 className="mt-2 text-sm font-black text-slate-900">{item.titulo}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{item.situacao}</p></div><ChevronRight size={18} className={`shrink-0 text-slate-400 transition ${ativo ? "rotate-90" : ""}`} /></button>{ativo ? <div className="border-t border-slate-100 p-5"><div className="grid gap-4 xl:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">Checagens</p><div className="mt-3 space-y-2">{item.checagens.map((texto, index) => <div key={texto} className="flex items-start gap-2"><span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white text-[9px] font-black text-slate-600">{index + 1}</span><p className="text-xs leading-5 text-slate-600">{texto}</p></div>)}</div></div><div className="space-y-3"><div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-black uppercase text-slate-400">Documentos / evidências</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-700">{item.documentos}</p></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-[10px] font-black uppercase text-emerald-700">Ação recomendada</p><p className="mt-1 text-xs leading-5 text-emerald-900">{item.acao}</p></div></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Fundamento</p><p className="mt-1 text-[11px] font-bold text-slate-700">{item.fundamento}</p></div><div className="rounded-xl border border-slate-200 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Referência / versão</p><p className="mt-1 text-[11px] font-bold text-slate-700">{item.referencia}</p></div></div></div> : null}</div>; })}</section>
      <section className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"><div className="rounded-[24px] border border-blue-100 bg-blue-50 p-6"><div className="flex items-center gap-2 text-blue-700"><ShieldCheck size={18} /><p className="text-xs font-black uppercase tracking-[0.15em]">Regra dos Playbooks</p></div><h3 className="mt-3 text-lg font-black text-slate-900">Orientar sem automatizar a decisão</h3><p className="mt-2 text-sm leading-6 text-slate-600">Cada playbook deve carregar vigência, versão e fonte. Mudança normativa cria nova versão; não apaga o histórico usado em análises anteriores.</p></div><div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6"><div className="flex items-center gap-2 text-amber-700"><AlertTriangle size={18} /><p className="text-xs font-black uppercase tracking-[0.15em]">2026 exige contexto</p></div><p className="mt-3 text-sm leading-6 text-amber-900">Obrigatoriedade, leiaute, autorização e conformidade são eventos diferentes. O playbook real sempre deverá consultar a regra vigente para documento, operação, contribuinte e data analisada.</p></div></section>
    </div>
  );
}


/* =========================================================
   RELATÓRIOS + DASHBOARD EXECUTIVO — DADOS DEMONSTRATIVOS
========================================================= */

function RelatoriosPage({ onBack, onEnviarReprecificacao, clientesCarteira = [] }) {
  const [clienteSelecionado, setClienteSelecionado] = useState("Todos");
  const [visao, setVisao] = useState("executiva");
  const baseReal = clientesCarteira.length > 0;
  const radarBase = baseReal ? clientesCarteira : RADAR_CLIENTES_DEMO;
  const creditosBase = baseReal ? [] : RADAR_CREDITOS_DEMO;
  const fornecedoresBase = baseReal ? [] : FORNECEDORES_DEMO;
  const casosBase = baseReal ? [] : CASOS_CREDITO_DEMO;

  const clientes = useMemo(
    () => ["Todos", ...radarBase.map((item) => item.empresa)],
    [radarBase],
  );

  const radarFiltrado = useMemo(
    () =>
      clienteSelecionado === "Todos"
        ? radarBase
        : radarBase.filter(
            (item) => item.empresa === clienteSelecionado,
          ),
    [clienteSelecionado, radarBase],
  );

  const creditosFiltrados = useMemo(
    () =>
      clienteSelecionado === "Todos"
        ? creditosBase
        : creditosBase.filter(
            (item) => item.cliente === clienteSelecionado,
          ),
    [clienteSelecionado, creditosBase],
  );

  const fornecedoresFiltrados = useMemo(
    () =>
      clienteSelecionado === "Todos"
        ? fornecedoresBase
        : fornecedoresBase.filter(
            (item) => item.cliente === clienteSelecionado,
          ),
    [clienteSelecionado, fornecedoresBase],
  );

  const casosFiltrados = useMemo(
    () =>
      clienteSelecionado === "Todos"
        ? casosBase
        : casosBase.filter(
            (item) => item.cliente === clienteSelecionado,
          ),
    [clienteSelecionado, casosBase],
  );

  const resumo = useMemo(() => {
    const creditos = creditosFiltrados.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0,
    );

    const casosAtivos = casosFiltrados.filter(
      (item) => !["Regularizado", "Descartado"].includes(item.status),
    );

    const valorCasosAtivos = casosAtivos.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0,
    );

    const fornecedoresAtencao = fornecedoresFiltrados.filter(
      (item) => item.atencao === "Alta",
    );

    const ocorrencias = fornecedoresFiltrados.reduce(
      (acc, item) => acc + Number(item.ocorrencias || 0),
      0,
    );

    const iccMedio = fornecedoresFiltrados.length
      ? Math.round(
          fornecedoresFiltrados.reduce(
            (acc, item) => acc + Number(item.icc || 0),
            0,
          ) / fornecedoresFiltrados.length,
        )
      : 0;

    const irtMedio = radarFiltrado.length
      ? Math.round(
          radarFiltrado.reduce(
            (acc, item) => acc + Number(item.irt || 0),
            0,
          ) / radarFiltrado.length,
        )
      : 0;

    return {
      creditos,
      casosAtivos: casosAtivos.length,
      valorCasosAtivos,
      fornecedoresAtencao: fornecedoresAtencao.length,
      ocorrencias,
      iccMedio,
      irtMedio,
      altoImpacto: radarFiltrado.filter((item) => item.impacto === "Alto")
        .length,
    };
  }, [
    radarFiltrado,
    creditosFiltrados,
    fornecedoresFiltrados,
    casosFiltrados,
  ]);

  const impactoTone = (impacto) => {
    if (impacto === "Alto") return "rose";
    if (impacto === "Médio") return "amber";
    return "emerald";
  };

  const statusTone = (status) => {
    if (status === "Regularizado" || status === "Confirmado") return "emerald";
    if (status === "Em análise") return "blue";
    if (status === "Em regularização") return "amber";
    if (status === "Descartado") return "slate";
    return "violet";
  };

  const clienteAtual =
    clienteSelecionado === "Todos"
      ? null
      : radarBase.find(
          (item) => item.empresa === clienteSelecionado,
        );

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
      >
        <ChevronRight size={16} className="rotate-180" />
        Visão Geral
      </button>

      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#071329] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
              <BarChart3 size={14} />
              Relatórios + Dashboard Executivo
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
              Da carteira ao cliente, em uma visão consolidada
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Consolide impacto, créditos, casos, fornecedores e oportunidades
              da Reforma. Alterne entre a visão executiva da carteira e o
              relatório individual de cada cliente.
            </p>
          </div>

          <Badge tone="emerald">Dados demonstrativos</Badge>
        </div>
      </section>

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
              Escopo do relatório
            </p>

            <h3 className="mt-1 text-lg font-black text-slate-900">
              Escolha a leitura
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              A visão executiva consolida a carteira. Ao selecionar um cliente,
              o relatório passa a reunir somente os indicadores relacionados a
              ele.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setVisao("executiva")}
                className={`rounded-lg px-3 py-2 text-xs font-black transition ${
                  visao === "executiva"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Executivo
              </button>

              <button
                type="button"
                onClick={() => setVisao("cliente")}
                className={`rounded-lg px-3 py-2 text-xs font-black transition ${
                  visao === "cliente"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Por cliente
              </button>
            </div>

            <select
              value={clienteSelecionado}
              onChange={(event) => {
                setClienteSelecionado(event.target.value);
                if (event.target.value !== "Todos") setVisao("cliente");
              }}
              className="h-11 min-w-[260px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400"
            >
              {clientes.map((cliente) => (
                <option key={cliente} value={cliente}>
                  {cliente === "Todos" ? "Toda a carteira" : cliente}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled
              title="Exportação será conectada quando os relatórios usarem dados reais."
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-black text-slate-400"
            >
              <ReceiptText size={15} />
              Exportar PDF — em breve
            </button>
          </div>
        </div>
      </section>

      {visao === "cliente" && clienteSelecionado === "Todos" ? (
        <section className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-amber-600"
            />
            <div>
              <p className="text-sm font-black text-amber-950">
                Selecione um cliente
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-900">
                A visão por cliente reúne IRT, impacto, créditos, casos,
                fornecedores e oportunidade relacionados à empresa escolhida.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Gauge}
              label={clienteAtual ? "IRT do cliente" : "IRT médio"}
              value={clienteAtual ? clienteAtual.irt : resumo.irtMedio}
              helper={
                clienteAtual
                  ? "Índice demonstrativo de prioridade do cliente."
                  : "Média demonstrativa dos clientes exibidos."
              }
              tone="violet"
            />

            <MetricCard
              icon={CircleDollarSign}
              label="Créditos mapeados"
              value={money(resumo.creditos)}
              helper="Soma dos valores demonstrativos em todos os estágios."
              tone="emerald"
            />

            <MetricCard
              icon={FileSearch}
              label="Casos ativos"
              value={resumo.casosAtivos}
              helper={`${money(resumo.valorCasosAtivos)} associados aos casos ainda em andamento.`}
              tone="blue"
            />

            <MetricCard
              icon={Network}
              label="Fornecedores atenção alta"
              value={resumo.fornecedoresAtencao}
              helper={`${resumo.ocorrencias} ocorrências na cadeia exibida.`}
              tone="amber"
            />
          </section>

          {clienteAtual ? (
            <section className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                      Relatório individual
                    </p>
                    <h3 className="mt-1 text-xl font-black text-slate-900">
                      {clienteAtual.empresa}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {clienteAtual.regime} • {clienteAtual.segmento}
                    </p>
                  </div>
                  <Badge tone={impactoTone(clienteAtual.impacto)}>
                    Impacto {clienteAtual.impacto}
                  </Badge>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[9px] font-black uppercase text-slate-400">
                      IRT
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {clienteAtual.irt}
                    </p>
                    <Progress
                      value={clienteAtual.irt}
                      tone={
                        clienteAtual.irt >= 75
                          ? "rose"
                          : clienteAtual.irt >= 55
                            ? "amber"
                            : "emerald"
                      }
                    />
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-[9px] font-black uppercase text-emerald-700">
                      Crédito no Radar
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-900">
                      {money(
                        creditosFiltrados.reduce(
                          (acc, item) => acc + Number(item.valor || 0),
                          0,
                        ),
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-[9px] font-black uppercase text-blue-700">
                      Ocorrências
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {clienteAtual.ocorrencias}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-violet-50 p-4">
                    <p className="text-[9px] font-black uppercase text-violet-700">
                      Oportunidade
                    </p>
                    <p className="mt-2 text-xs font-black leading-5 text-slate-900">
                      {clienteAtual.oportunidade}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">
                      Cadeia relacionada
                    </p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">
                      Fornecedores do cliente
                    </h3>
                  </div>
                  <Badge tone="amber">ICC médio {resumo.iccMedio}</Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {fornecedoresFiltrados.length ? (
                    fornecedoresFiltrados.map((fornecedor) => (
                      <div
                        key={fornecedor.id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black text-slate-900">
                              {fornecedor.fornecedor}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {fornecedor.documentos} documentos •{" "}
                              {fornecedor.ocorrencias} ocorrências
                            </p>
                          </div>
                          <Badge
                            tone={
                              fornecedor.atencao === "Alta"
                                ? "rose"
                                : fornecedor.atencao === "Média"
                                  ? "amber"
                                  : "emerald"
                            }
                          >
                            ICC {fornecedor.icc}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                      Nenhum fornecedor demonstrativo relacionado.
                    </p>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                      Priorização executiva
                    </p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">
                      Clientes que pedem atenção
                    </h3>
                  </div>
                  <Badge tone="rose">{resumo.altoImpacto} alto impacto</Badge>
                </div>

                <div className="mt-5 space-y-3">
                  {[...radarFiltrado]
                    .sort((a, b) => b.irt - a.irt)
                    .map((cliente) => (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => {
                          setClienteSelecionado(cliente.empresa);
                          setVisao("cliente");
                        }}
                        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-slate-900">
                            {cliente.empresa}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {cliente.regime} • {cliente.oportunidade}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <Badge tone={impactoTone(cliente.impacto)}>
                            {cliente.impacto}
                          </Badge>
                          <span className="text-sm font-black text-slate-900">
                            IRT {cliente.irt}
                          </span>
                          <ChevronRight size={15} className="text-slate-400" />
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                  Funil dos créditos
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-900">
                  Valores por estágio
                </h3>

                <div className="mt-5 space-y-3">
                  {[
                    "Crédito potencial",
                    "Sob análise",
                    "Requer revisão",
                    "Confirmado",
                  ].map((nome) => {
                    const valor = creditosBase.filter(
                      (item) => item.status === nome,
                    ).reduce((acc, item) => acc + Number(item.valor || 0), 0);

                    return (
                      <div
                        key={nome}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-slate-600">
                            {nome}
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {money(valor)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                    Casos de Crédito
                  </p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    Andamento dos casos
                  </h3>
                </div>
                <Badge tone="violet">{casosFiltrados.length} casos</Badge>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                        Caso
                      </th>
                      <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                        Atualização
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {casosFiltrados.map((caso) => (
                      <tr
                        key={caso.id}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-4 py-3 text-xs font-black text-slate-900">
                          {caso.id}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                          {caso.cliente}
                        </td>
                        <td className="px-4 py-3 text-xs font-black text-emerald-700">
                          {money(caso.valor)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(caso.status)}>
                            {caso.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-semibold text-slate-500">
                          {caso.atualizado}
                        </td>
                      </tr>
                    ))}

                    {!casosFiltrados.length ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-xs font-semibold text-slate-400"
                        >
                          Nenhum caso demonstrativo relacionado.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-6">
                <div className="flex items-center gap-2 text-emerald-700">
                  <TrendingUp size={18} />
                  <p className="text-xs font-black uppercase tracking-[0.15em]">
                    Oportunidade comercial
                  </p>
                </div>

                <h3 className="mt-3 text-lg font-black text-slate-900">
                  Transformar análise em ação
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  O relatório deve deixar visível onde existe necessidade de
                  diagnóstico, revisão, reprecificação ou serviço adicional.
                  Nesta fase, nenhuma ação é enviada automaticamente para outros
                  módulos.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!clienteAtual}
                    title={
                      clienteAtual
                        ? "Abrir este cliente na Reprecificação."
                        : "Selecione um cliente no relatório antes de enviar para Reprecificação."
                    }
                    onClick={() =>
                      clienteAtual &&
                      onEnviarReprecificacao?.({
                        cliente: clienteAtual.empresa,
                        clienteId: clienteAtual.clienteId ?? clienteAtual.id ?? null,
                        cnpj: clienteAtual.cnpj || "",
                        regime: clienteAtual.regime,
                        atividade: clienteAtual.segmento,
                        oportunidade: clienteAtual.oportunidade,
                        impacto: clienteAtual.impacto,
                        irt: clienteAtual.irt,
                        origem: "Reforma Tributária — Relatórios",
                      })
                    }
                    className={`rounded-xl border px-3 py-2 text-[11px] font-black transition ${
                      clienteAtual
                        ? "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
                        : "cursor-not-allowed border-emerald-200 bg-white text-emerald-700 opacity-40"
                    }`}
                  >
                    Enviar para Reprecificação
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11px] font-black text-emerald-700 opacity-60"
                  >
                    Adicionar serviço
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11px] font-black text-emerald-700 opacity-60"
                  >
                    Gerar proposta
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-6">
                <div className="flex items-center gap-2 text-blue-700">
                  <ShieldCheck size={18} />
                  <p className="text-xs font-black uppercase tracking-[0.15em]">
                    Separação obrigatória
                  </p>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  O relatório final deverá distinguir claramente dado
                  demonstrativo, estimativa, ocorrência em análise e conclusão
                  validada. Crédito potencial, IRT e ICC não representam, por
                  si só, conclusão tributária.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Estrutura do relatório
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-900">
                  O que será levado ao PDF quando conectado
                </h3>
                <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
                  O objetivo é gerar um relatório executivo para o escritório e,
                  quando desejado, uma versão adequada para apresentação ao
                  cliente.
                </p>
              </div>
              <Badge tone="blue">Exportação futura</Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [
                  "1. Resumo executivo",
                  "Impacto, IRT, créditos, casos e principais prioridades.",
                ],
                [
                  "2. Evidências",
                  "Documentos, ocorrências, fornecedores e rastreabilidade.",
                ],
                [
                  "3. Cenários",
                  "Digital Twin, margem, preço e caixa quando houver simulação.",
                ],
                [
                  "4. Próximas ações",
                  "Revisão, serviço, reprecificação ou proposta mediante decisão.",
                ],
              ].map(([titulo, texto]) => (
                <div key={titulo} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black text-slate-900">{titulo}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    {texto}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-slate-600">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <p>
          <strong className="text-slate-700">Versão visual:</strong> este
          dashboard consolida exclusivamente os dados demonstrativos já
          existentes no módulo. Não consulta Supabase, não altera o
          pricingEngine e não executa integração com Reprecificação, Serviços,
          Propostas ou CRM.
        </p>
      </section>
    </div>
  );
}

function PlaceholderPage({ item, onBack }) {
  const Icon = item?.icon || Landmark;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
      >
        <ChevronRight size={16} className="rotate-180" />
        Visão Geral
      </button>

      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon size={22} />
        </div>

        <div className="mt-5">
          <Badge tone="blue">Estrutura visual</Badge>
        </div>

        <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-900">
          {item?.label || "Módulo"}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Este módulo já faz parte da arquitetura da Reforma Tributária, mas o
          motor e as regras reais serão implementados separadamente para não
          misturar a validação visual com a lógica fiscal.
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-black text-slate-700">Próxima etapa</p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Implementar a experiência desta área mantendo os dados
            demonstrativos e sem alterar nenhum módulo existente do
            PrecificaCont.
          </p>
        </div>
      </section>
    </div>
  );
}

function MenuReforma({ secao, setSecao }) {
  return (
    <section className="mb-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex min-w-max gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = secao === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSecao(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-black transition ${
                active
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function ReformaTributaria({ setPagina }) {
  const [secao, setSecao] = useState("visao-geral");
  const [clientesCarteira, setClientesCarteira] = useState(() => carregarClientesCarteira());

  useEffect(() => {
    const atualizarCarteira = () => setClientesCarteira(carregarClientesCarteira());

    window.addEventListener("storage", atualizarCarteira);
    window.addEventListener("precificacont:clientes-atualizados", atualizarCarteira);

    return () => {
      window.removeEventListener("storage", atualizarCarteira);
      window.removeEventListener("precificacont:clientes-atualizados", atualizarCarteira);
    };
  }, []);

  const enviarParaReprecificacao = (contexto = {}) => {
    try {
      localStorage.setItem(
        "precificacont_reforma_reprecificacao",
        JSON.stringify({
          ...contexto,
          origem: contexto.origem || "Reforma Tributária",
          criadoEm: new Date().toISOString(),
        }),
      );
    } catch {
      // A navegação continua funcionando mesmo se o cache local estiver indisponível.
    }

    if (typeof setPagina === "function") {
      setPagina("reprecificacao");
    }
  };

  const itemAtual = useMemo(
    () => NAV_ITEMS.find((item) => item.id === secao),
    [secao],
  );

  if (secao === "validador") {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <MenuReforma secao={secao} setSecao={setSecao} />
          <ValidadorIBSCBSPage onBack={() => setSecao("visao-geral")} />
        </div>
      </div>
    );
  }

  if (secao === "radar") {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <MenuReforma secao={secao} setSecao={setSecao} />
          <RadarCarteiraPage
            onBack={() => setSecao("visao-geral")}
            clientesCarteira={clientesCarteira}
          />
        </div>
      </div>
    );
  }

  if (secao === "creditos") {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <MenuReforma secao={secao} setSecao={setSecao} />
          <RadarCreditosPage onBack={() => setSecao("visao-geral")} />
        </div>
      </div>
    );
  }

  if (secao === "fornecedores") {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <MenuReforma secao={secao} setSecao={setSecao} />
          <FornecedoresPage onBack={() => setSecao("visao-geral")} />
        </div>
      </div>
    );
  }

  if (secao === "casos") {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <MenuReforma secao={secao} setSecao={setSecao} />
          <CasosCreditoPage onBack={() => setSecao("visao-geral")} />
        </div>
      </div>
    );
  }

  if (secao === "digital-twin") {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <MenuReforma secao={secao} setSecao={setSecao} />
          <DigitalTwinPage onBack={() => setSecao("visao-geral")} />
        </div>
      </div>
    );
  }

  if (secao === "simuladores") {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <MenuReforma secao={secao} setSecao={setSecao} />
          <SimuladoresPage onBack={() => setSecao("visao-geral")} />
        </div>
      </div>
    );
  }


  if (secao === "playbooks") {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <MenuReforma secao={secao} setSecao={setSecao} />
          <PlaybooksPage onBack={() => setSecao("visao-geral")} />
        </div>
      </div>
    );
  }


  if (secao === "relatorios") {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <MenuReforma secao={secao} setSecao={setSecao} />
          <RelatoriosPage
            onBack={() => setSecao("visao-geral")}
            onEnviarReprecificacao={enviarParaReprecificacao}
            clientesCarteira={clientesCarteira}
          />
        </div>
      </div>
    );
  }


  if (secao !== "visao-geral" && itemAtual) {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <MenuReforma secao={secao} setSecao={setSecao} />
          <PlaceholderPage
            item={itemAtual}
            onBack={() => setSecao("visao-geral")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <section className="relative overflow-hidden rounded-[30px] border border-slate-800 bg-[#071329] px-6 py-7 text-white shadow-sm sm:px-8 lg:px-10 lg:py-9">
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                  <Landmark size={14} />
                  Inteligência Fiscal
                </div>

                <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                  Reforma Tributária
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                  Do documento à margem: organize impactos, riscos, créditos
                  potenciais e oportunidades antes que apareçam no caixa do
                  cliente.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge tone={clientesCarteira.length ? "blue" : "emerald"}>{clientesCarteira.length ? "Carteira real conectada" : "Ambiente demonstrativo"}</Badge>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-slate-300">
                  <ShieldCheck size={13} />
                  Sem alteração no motor atual
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5">
          <MenuReforma secao={secao} setSecao={setSecao} />
        </div>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Sparkles size={20} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Segunda camada de inteligência
                </p>

                <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-900">
                  Precificação + Reforma
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  O PrecificaCont continua calculando quanto o escritório
                  deveria cobrar. Esta nova camada identifica onde a Reforma
                  pode criar impacto financeiro, risco, necessidade de revisão e
                  novos serviços consultivos.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600">
              <BadgeCheck size={18} />

              <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                Limite do produto
              </p>
            </div>

            <p className="mt-3 text-sm font-black leading-6 text-slate-900">
              PrecificaCont encontra, calcula, simula e monetiza o impacto.
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              A plataforma não será transformada em um sistema operacional
              fiscal genérico. Execuções fiscais, transmissões e autorizações
              dependerão de integrações e regras específicas.
            </p>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Building2}
            label="Clientes analisados"
            value={clientesCarteira.length || DEMO.clientesAnalisados}
            helper={clientesCarteira.length ? "Clientes cadastrados na carteira do PrecificaCont." : "Carteira considerada nesta demonstração."}
            tone="blue"
          />

          <MetricCard
            icon={CircleDollarSign}
            label="Créditos potenciais"
            value={money(clientesCarteira.length ? 0 : DEMO.creditosPotenciais)}
            helper={clientesCarteira.length ? "Aguardando análise fiscal da carteira real." : "Potencial sujeito a validação documental e fiscal."}
            tone="emerald"
          />

          <MetricCard
            icon={TriangleAlert}
            label="Valores sob análise"
            value={money(clientesCarteira.length ? 0 : DEMO.valoresSobAnalise)}
            helper={clientesCarteira.length ? "Nenhuma análise iniciada para a carteira real." : "Situações que exigem revisão antes de qualquer conclusão."}
            tone="amber"
          />

          <MetricCard
            icon={ShieldCheck}
            label="Conformidade documental"
            value={clientesCarteira.length ? "Aguardando" : `${DEMO.conformidade}%`}
            helper={clientesCarteira.length ? "Conformidade ainda não calculada para a carteira real." : "Índice demonstrativo de consistência documental."}
            tone="violet"
          />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Radar size={18} />

                  <p className="text-[10px] font-black uppercase tracking-[0.17em]">
                    Radar da Carteira
                  </p>
                </div>

                <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-900">
                  Onde agir primeiro
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Organize a carteira por possível impacto da Reforma,
                  ocorrências, créditos potenciais e oportunidades de serviço.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSecao("radar")}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700"
              >
                Abrir Radar
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-rose-50 p-4">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle size={16} />

                  <span className="text-[10px] font-black uppercase tracking-[0.12em]">
                    Alto impacto
                  </span>
                </div>

                <p className="mt-2 text-2xl font-black text-slate-900">
                  {DEMO.altoImpacto}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  Clientes priorizados
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <Network size={16} />

                  <span className="text-[10px] font-black uppercase tracking-[0.12em]">
                    Fornecedores
                  </span>
                </div>

                <p className="mt-2 text-2xl font-black text-slate-900">
                  {clientesCarteira.length ? 0 : DEMO.fornecedoresRecorrentes}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  Recorrentes sob atenção
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <TrendingUp size={16} />

                  <span className="text-[10px] font-black uppercase tracking-[0.12em]">
                    Oportunidades
                  </span>
                </div>

                <p className="mt-2 text-2xl font-black text-slate-900">
                  {money(DEMO.oportunidades)}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  Serviços identificados
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <Activity
                  size={18}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <div>
                  <p className="text-xs font-black text-slate-900">
                    Fluxo previsto
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Reforma analisa → identifica impacto ou oportunidade →
                    usuário decide se envia para Reprecificação, adiciona
                    serviço ou gera proposta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">
                  IRT
                </p>

                <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-900">
                  Índice Reforma Tributária
                </h2>
              </div>

              <Badge tone="violet">Explicável</Badge>
            </div>

            <div className="mt-6 flex items-end gap-2">
              <span className="text-5xl font-black tracking-[-0.06em] text-slate-950">
                82
              </span>

              <span className="pb-1 text-sm font-bold text-slate-400">
                /100
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Exemplo de cliente com prioridade elevada para análise. O índice
              real deverá mostrar exatamente os fatores que compõem a nota.
            </p>

            <div className="mt-6 space-y-4">
              {[
                { label: "Documental", value: 21, max: 25 },
                { label: "Crédito", value: 18, max: 25 },
                { label: "Financeiro", value: 20, max: 25 },
                { label: "Operacional", value: 23, max: 25 },
              ].map(({ label, value, max }) => (
                <div key={label}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-bold text-slate-600">{label}</span>

                    <span className="font-black text-slate-900">
                      {value}/{max}
                    </span>
                  </div>

                  <Progress value={(value / max) * 100} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
              Central de inteligência
            </p>

            <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-900">
              Ferramentas da Reforma
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ActionCard
              icon={FileCheck2}
              title="Validador IBS/CBS"
              description="Estrutura para validação pré-emissão e pós-emissão, com regra, ocorrência, consequência e ação."
              badge="Pré + Pós"
              badgeTone="blue"
              onClick={() => setSecao("validador")}
            />

            <ActionCard
              icon={CircleDollarSign}
              title="Radar de Créditos"
              description="Mapeamento de créditos potenciais e situações que exigem análise, sem antecipar conclusão fiscal."
              badge="Créditos"
              badgeTone="emerald"
              onClick={() => setSecao("creditos")}
            />

            <ActionCard
              icon={Network}
              title="Cadeia / Fornecedores"
              description="Visão da recorrência documental e dos valores associados a cada fornecedor da cadeia."
              badge="ICC"
              badgeTone="amber"
              onClick={() => setSecao("fornecedores")}
            />

            <ActionCard
              icon={FileSearch}
              title="Casos de Crédito"
              description="Central para reunir ocorrência, documentos, evidências, potencial financeiro e andamento."
              badge="Casos"
              badgeTone="violet"
              onClick={() => setSecao("casos")}
            />

            <ActionCard
              icon={Boxes}
              title="Digital Twin Tributário"
              description="Base visual para cenários de receita, compras, débitos, créditos, caixa, margem e transição."
              badge="Cenários"
              badgeTone="blue"
              onClick={() => setSecao("digital-twin")}
            />

            <ActionCard
              icon={TrendingUp}
              title="Margem & Preço"
              description="Simule impacto econômico e, futuramente, o preço necessário para preservar a margem desejada."
              badge="PrecificaCont"
              badgeTone="emerald"
              onClick={() => setSecao("simuladores")}
            />

            <ActionCard
              icon={WalletCards}
              title="Caixa / Split Payment"
              description="Estrutura para cenários financeiros considerando segregação, recebimento e efeitos de caixa."
              badge="Financeiro"
              badgeTone="amber"
              onClick={() => setSecao("simuladores")}
            />

            <ActionCard
              icon={ReceiptText}
              title="Playbooks"
              description="Situação, checagens, documentos, ação recomendada e fundamento para apoiar a análise do escritório."
              badge="Orientação"
              badgeTone="violet"
              onClick={() => setSecao("playbooks")}
            />

            <ActionCard
              icon={BarChart3}
              title="Relatórios + Dashboard"
              description="Consolide carteira, créditos, casos, fornecedores, IRT, ICC e oportunidades em visão executiva ou por cliente."
              badge="Executivo"
              badgeTone="blue"
              onClick={() => setSecao("relatorios")}
            />
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                Conexão com o PrecificaCont
              </p>

              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-900">
                Inteligência fiscal vira oportunidade comercial
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Quando uma análise identificar impacto relevante, o escritório
                poderá transformar essa informação em reprecificação, serviço
                adicional ou proposta consultiva — sempre mediante decisão do
                usuário.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-400"
              >
                Enviar para Reprecificação
              </button>

              <button
                type="button"
                disabled
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-400"
              >
                Adicionar serviço
              </button>

              <button
                type="button"
                disabled
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-400"
              >
                Gerar proposta
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              {
                icon: FileCheck2,
                title: "1. Analisar",
                text: "Documento, operação e dados do cliente.",
              },
              {
                icon: Radar,
                title: "2. Priorizar",
                text: "Impacto, risco e oportunidade.",
              },
              {
                icon: Scale,
                title: "3. Simular",
                text: "Caixa, margem, preço e cenários.",
              },
              {
                icon: TrendingUp,
                title: "4. Monetizar",
                text: "Serviço, reprecificação ou proposta.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-4">
                <Icon size={18} className="text-blue-600" />

                <p className="mt-3 text-xs font-black text-slate-900">
                  {title}
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-slate-600">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <p>
            <strong className="text-slate-700">Versão visual:</strong> os
            números, índices, casos e valores desta tela são exclusivamente
            demonstrativos. Nenhuma conclusão tributária ou cálculo fiscal está
            sendo executado. O motor real será construído separadamente e com
            regras versionadas.
          </p>
        </section>
      </div>
    </div>
  );
}