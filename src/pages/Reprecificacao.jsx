import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCcw,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Users,
  X,
  Save,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Upload,
  Database,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  calculateRepricing,
  numberValue,
  ENGINE_VERSION,
} from "../lib/pricingEngine";
import { supabase } from "../supabase";
import SelectPrecificaCont from "../components/SelectPrecificaCont";

const STORAGE_KEY = "precificacont_reprecificacao";
const CLIENTES_STORAGE_KEY = "precificacont_clientes";
const REFORMA_REPRECIFICACAO_KEY = "precificacont_reforma_reprecificacao";

const INITIAL_FORM = {
  clienteId: null,
  cliente: "",
  cnpj: "",
  regime: "",
  atividade: "",
  faturamento: "",
  uf: "",
  colaboradores: "",
  valorColaboradorManual: "",
  notasSaida: "",
  notasEntrada: "",
  outrosDocumentos: "",
  filiais: "",
  filiaisDetalhadas: [],
  movimentacaoBancaria: "normal",
  contasBancarias: "",
  vendeOutrosEstados: false,
  estadosVenda: "",
  compraOutrosEstados: false,
  estadosCompra: "",
  vendeExterior: false,
  paisesVenda: "",
  documentosExportacao: "",
  compraExterior: false,
  paisesCompra: "",
  documentosImportacao: "",
  retencoes: false,
  substituicaoTributaria: false,
  multiplasAtividades: false,
  folhaComplexa: false,
  admissoesDemissoes: false,
  parcelamentos: false,
  obrigacoesEspecificas: false,
  beneficiosFiscais: false,
  honorarioAtual: "",
};

const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const integer = (value) => Number(value || 0).toLocaleString("pt-BR");

const formatCurrencyInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) return "";

  return (Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    {hint && <span className="block text-xs text-slate-400 mt-0.5">{hint}</span>}
    <div className="mt-2">{children}</div>
  </label>
);

const MetricCard = ({ icon: Icon, label, value, helper }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
        {helper && <div className="text-xs text-slate-400 mt-1">{helper}</div>}
      </div>
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const SituationBadge = ({ situation }) => {
  const styles = {
    "Abaixo da referência": "bg-amber-50 text-amber-700 border-amber-200",
    "Dentro da referência": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Acima da referência": "bg-blue-50 text-blue-700 border-blue-200",
    "Sem honorário atual": "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${
        styles[situation] || styles["Sem honorário atual"]
      }`}
    >
      {situation}
    </span>
  );
};


const REPRECIFICACAO_DARK_CSS = `
  html.dark .precificacont-reprecificacao {
    background:
      radial-gradient(circle at 18% 0%, rgba(37,99,235,.10), transparent 30%),
      #07101f !important;
    color: #e5edf8;
  }

  html.dark .precificacont-reprecificacao [class*="bg-white"],
  html.dark .precificacont-reprecificacao [class*="from-white"],
  html.dark .precificacont-reprecificacao [class*="via-white"],
  html.dark .precificacont-reprecificacao [class*="to-white"],
  html.dark .precificacont-reprecificacao [class*="bg-slate-50"] {
    background-color: #0c1a2f !important;
  }

  html.dark .precificacont-reprecificacao [class*="border-slate"] {
    border-color: rgba(96,165,250,.18) !important;
  }

  html.dark .precificacont-reprecificacao .text-slate-950,
  html.dark .precificacont-reprecificacao .text-slate-900,
  html.dark .precificacont-reprecificacao .text-slate-800,
  html.dark .precificacont-reprecificacao .text-slate-700 {
    color: #f8fafc !important;
  }

  html.dark .precificacont-reprecificacao .text-slate-600 {
    color: #d2dceb !important;
  }

  html.dark .precificacont-reprecificacao .text-slate-500,
  html.dark .precificacont-reprecificacao .text-slate-400 {
    color: #9fb0c7 !important;
  }

  html.dark .precificacont-reprecificacao .text-blue-500,
  html.dark .precificacont-reprecificacao .text-blue-600,
  html.dark .precificacont-reprecificacao .text-blue-700,
  html.dark .precificacont-reprecificacao .text-blue-800 {
    color: #60a5fa !important;
  }

  html.dark .precificacont-reprecificacao .text-amber-600,
  html.dark .precificacont-reprecificacao .text-amber-700 {
    color: #fbbf24 !important;
  }

  html.dark .precificacont-reprecificacao .text-emerald-600,
  html.dark .precificacont-reprecificacao .text-emerald-700 {
    color: #34d399 !important;
  }

  html.dark .precificacont-reprecificacao input:not([type="file"]),
  html.dark .precificacont-reprecificacao select,
  html.dark .precificacont-reprecificacao textarea {
    background-color: #09172a !important;
    border-color: rgba(96,165,250,.22) !important;
    color: #f8fafc !important;
    caret-color: #60a5fa;
  }

  html.dark .precificacont-reprecificacao input::placeholder,
  html.dark .precificacont-reprecificacao textarea::placeholder {
    color: #64748b !important;
  }

  html.dark .precificacont-reprecificacao select option {
    background: #09172a;
    color: #f8fafc;
  }

  html.dark .precificacont-reprecificacao [class*="bg-blue-50"] {
    background-color: rgba(37,99,235,.17) !important;
    border-color: rgba(96,165,250,.22) !important;
  }

  html.dark .precificacont-reprecificacao [class*="bg-emerald-50"],
  html.dark .precificacont-reprecificacao [class*="bg-green-50"] {
    background-color: rgba(16,185,129,.15) !important;
  }

  html.dark .precificacont-reprecificacao [class*="bg-amber-50"] {
    background-color: rgba(245,158,11,.15) !important;
  }

  html.dark .precificacont-reprecificacao [class*="bg-rose-50"] {
    background-color: rgba(244,63,94,.14) !important;
  }

  html.dark .precificacont-reprecificacao [class*="bg-slate-100"] {
    background-color: #13233a !important;
  }

  html.dark .precificacont-reprecificacao table,
  html.dark .precificacont-reprecificacao thead,
  html.dark .precificacont-reprecificacao tbody,
  html.dark .precificacont-reprecificacao tr,
  html.dark .precificacont-reprecificacao td,
  html.dark .precificacont-reprecificacao th {
    border-color: rgba(96,165,250,.14) !important;
  }

  html.dark .precificacont-reprecificacao thead,
  html.dark .precificacont-reprecificacao thead tr,
  html.dark .precificacont-reprecificacao thead th {
    background: #10213a !important;
    color: #8fb7ea !important;
  }

  html.dark .precificacont-reprecificacao tbody tr,
  html.dark .precificacont-reprecificacao tbody td {
    background: #0c1a2f !important;
  }

  html.dark .precificacont-reprecificacao tbody tr:hover,
  html.dark .precificacont-reprecificacao tbody tr:hover td {
    background: #102440 !important;
  }

  html.dark .precificacont-reprecificacao [class*="divide-slate"] > :not([hidden]) ~ :not([hidden]) {
    border-color: rgba(96,165,250,.12) !important;
  }

  html.dark .precificacont-reprecificacao [class*="border-dashed"] {
    border-color: rgba(96,165,250,.28) !important;
  }

  html.dark .precificacont-reprecificacao [class*="shadow"] {
    box-shadow: 0 14px 38px rgba(0,0,0,.20) !important;
  }

  html.dark .precificacont-reprecificacao .hover\\:bg-slate-50:hover,
  html.dark .precificacont-reprecificacao .hover\\:bg-slate-100:hover {
    background-color: #102440 !important;
  }

  html.dark .precificacont-reprecificacao .fixed.inset-0 > [class*="bg-white"] {
    background-color: #0c1a2f !important;
  }
`;


const REPRECIFICACAO_TABLE = "reprecificacoes";

function isUuidReprecificacao(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function novoUuidReprecificacao() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : null;
}

function reprecificacaoParaBanco(item) {
  return {
    id: item.id,
    cliente: item.cliente || "",
    cnpj: item.cnpj || "",
    regime: item.regime || "",
    atividade: item.atividade || "",
    faturamento: Number(item.faturamento || 0),
    uf: item.uf || "",
    colaboradores: Number(item.colaboradores || 0),
    honorario_atual: Number(item.honorarioAtual || 0),
    recomendado: Number(item.recomendado || 0),
    competitivo: Number(item.competitivo || 0),
    superior: Number(item.superior || 0),
    diferenca_mensal: Number(item.diferencaMensal || 0),
    diferenca_anual: Number(item.diferencaAnual || 0),
    diferenca_percentual: Number(item.diferencaPercentual || 0),
    situacao: item.situacao || "",
    valor_dp: Number(item.valorDP || 0),
    valor_colaborador: Number(item.valorColaborador || 0),
    contabil_fiscal: Number(item.contabilFiscal || 0),
    filiais: Number(item.filiais || 0),
    filiais_detalhadas: Array.isArray(item.filiais_detalhadas)
      ? item.filiais_detalhadas
      : [],
    valor_filiais: Number(item.valorFiliais || 0),
    engine_version: item.engine_version || "",
    pricing_snapshot:
      item.pricing_snapshot && typeof item.pricing_snapshot === "object"
        ? item.pricing_snapshot
        : {},
    dados: item,
    created_date: item.created_date || new Date().toISOString(),
    updated_date: item.updated_date || new Date().toISOString(),
  };
}

function reprecificacaoDoBanco(row) {
  const dados =
    row.dados && typeof row.dados === "object" && !Array.isArray(row.dados)
      ? row.dados
      : {};

  return {
    ...dados,
    id: row.id,
    cliente: row.cliente || dados.cliente || "",
    cnpj: row.cnpj || dados.cnpj || "",
    regime: row.regime || dados.regime || "",
    atividade: row.atividade || dados.atividade || "",
    faturamento: Number(row.faturamento ?? dados.faturamento ?? 0),
    uf: row.uf || dados.uf || "",
    colaboradores: Number(row.colaboradores ?? dados.colaboradores ?? 0),
    honorarioAtual: Number(
      row.honorario_atual ?? dados.honorarioAtual ?? 0
    ),
    recomendado: Number(row.recomendado ?? dados.recomendado ?? 0),
    competitivo: Number(row.competitivo ?? dados.competitivo ?? 0),
    superior: Number(row.superior ?? dados.superior ?? 0),
    diferencaMensal: Number(
      row.diferenca_mensal ?? dados.diferencaMensal ?? 0
    ),
    diferencaAnual: Number(
      row.diferenca_anual ?? dados.diferencaAnual ?? 0
    ),
    diferencaPercentual: Number(
      row.diferenca_percentual ?? dados.diferencaPercentual ?? 0
    ),
    situacao: row.situacao || dados.situacao || "",
    valorDP: Number(row.valor_dp ?? dados.valorDP ?? 0),
    valorColaborador: Number(
      row.valor_colaborador ?? dados.valorColaborador ?? 0
    ),
    contabilFiscal: Number(
      row.contabil_fiscal ?? dados.contabilFiscal ?? 0
    ),
    filiais: Number(row.filiais ?? dados.filiais ?? 0),
    filiais_detalhadas: Array.isArray(row.filiais_detalhadas)
      ? row.filiais_detalhadas
      : Array.isArray(dados.filiais_detalhadas)
      ? dados.filiais_detalhadas
      : [],
    valorFiliais: Number(row.valor_filiais ?? dados.valorFiliais ?? 0),
    engine_version: row.engine_version || dados.engine_version || "",
    pricing_snapshot:
      row.pricing_snapshot && typeof row.pricing_snapshot === "object"
        ? row.pricing_snapshot
        : dados.pricing_snapshot || {},
    created_date: row.created_date || dados.created_date || null,
    updated_date: row.updated_date || dados.updated_date || null,
  };
}

export default function Reprecificacao({ setPagina }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const itemsRef = useRef(items);
  const syncQueueRef = useRef(Promise.resolve());
  const [carregamentoInicialConcluido, setCarregamentoInicialConcluido] = useState(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    let ativo = true;

    const carregarReprecificacoes = async () => {
      let cache = [];

      try {
        cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (!Array.isArray(cache)) cache = [];
      } catch {
        cache = [];
      }

      const cacheNormalizado = cache
        .map((item) => ({
          ...item,
          id: isUuidReprecificacao(item.id)
            ? item.id
            : novoUuidReprecificacao(),
          updated_date:
            item.updated_date || item.created_date || new Date().toISOString(),
        }))
        .filter((item) => item.id);

      if (ativo && cacheNormalizado.length) {
        itemsRef.current = cacheNormalizado;
        setItems(cacheNormalizado);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheNormalizado));

      try {
        const { data, error } = await supabase
          .from(REPRECIFICACAO_TABLE)
          .select("*")
          .order("created_date", { ascending: false });

        if (error) throw error;
        if (!ativo) return;

        const banco = Array.isArray(data)
          ? data.map(reprecificacaoDoBanco)
          : [];

        // Primeira migração: preserva toda a base local e envia em um único lote.
        if (!banco.length && cacheNormalizado.length) {
          const { error: migrationError } = await supabase
            .from(REPRECIFICACAO_TABLE)
            .upsert(cacheNormalizado.map(reprecificacaoParaBanco), {
              onConflict: "id",
            });

          if (migrationError) throw migrationError;

          itemsRef.current = cacheNormalizado;
          setItems(cacheNormalizado);
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(cacheNormalizado)
          );
          if (ativo) setCarregamentoInicialConcluido(true);
          return;
        }

        // Depois da migração, Supabase é persistente; localStorage fica como cache rápido.
        itemsRef.current = banco;
        setItems(banco);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(banco));
      } catch (error) {
        console.error(
          "Reprecificação: falha ao sincronizar com Supabase.",
          error
        );
      }

      if (ativo) setCarregamentoInicialConcluido(true);
    };

    carregarReprecificacoes();

    return () => {
      ativo = false;
    };
  }, []);

  const enfileirarSync = (operacao) => {
    syncQueueRef.current = syncQueueRef.current
      .then(operacao)
      .catch((error) => {
        console.error(
          "Reprecificação: erro ao salvar no Supabase.",
          error
        );
      });

    return syncQueueRef.current;
  };


  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [detalheItem, setDetalheItem] = useState(null);
  const [gestaoReajuste, setGestaoReajuste] = useState({
    status: "Pendente",
    novoHonorario: "",
    dataReajuste: "",
  });
  const autoMotorCheckRef = useRef(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState("carteira");
  const [importRows, setImportRows] = useState([]);
  const [importSelecionados, setImportSelecionados] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [origemReforma, setOrigemReforma] = useState(null);

  const [permissoesModulo, setPermissoesModulo] = useState({
    carregando: true,
    pode_visualizar: false,
    pode_criar: false,
    pode_editar: false,
    pode_excluir: false,
  });

  useEffect(() => {
    let ativo = true;

    async function carregarPermissoesModulo() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const userId = authData?.user?.id;
        if (!userId) {
          if (ativo) setPermissoesModulo((p) => ({ ...p, carregando: false }));
          return;
        }

        const { data: vinculo, error: vinculoError } = await supabase
          .from("usuarios_escritorios")
          .select("perfil, perfil_acesso_id, escritorio_id")
          .eq("user_id", userId)
          .eq("ativo", true)
          .limit(1)
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
          if (ativo) setPermissoesModulo((p) => ({ ...p, carregando: false }));
          return;
        }

        const { data: modulo, error: moduloError } = await supabase
          .from("modulos_saas")
          .select("id")
          .eq("codigo", "reprecificacao")
          .eq("ativo", true)
          .maybeSingle();

        if (moduloError) throw moduloError;
        if (!modulo?.id) throw new Error('Módulo "reprecificacao" não encontrado.');

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
        console.error("Reprecificação: erro ao carregar permissões.", error);
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
    }

    carregarPermissoesModulo();
    return () => { ativo = false; };
  }, []);

  const negarAcao = (mensagem) => alert(mensagem);

  const set = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const adicionarFilial = () => {
    setForm((current) => ({
      ...current,
      filiaisDetalhadas: [
        ...(Array.isArray(current.filiaisDetalhadas)
          ? current.filiaisDetalhadas
          : []),
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          regime: current.regime || "",
          atividade: current.atividade || "",
          faturamento: "",
          centralizada: true,
        },
      ],
    }));
  };

  const atualizarFilial = (id, campo, valor) => {
    setForm((current) => ({
      ...current,
      filiaisDetalhadas: (
        Array.isArray(current.filiaisDetalhadas)
          ? current.filiaisDetalhadas
          : []
      ).map((filial) =>
        filial.id === id
          ? { ...filial, [campo]: valor }
          : filial
      ),
    }));
  };

  const removerFilial = (id) => {
    setForm((current) => ({
      ...current,
      filiaisDetalhadas: (
        Array.isArray(current.filiaisDetalhadas)
          ? current.filiaisDetalhadas
          : []
      ).filter((filial) => filial.id !== id),
    }));
  };

  const persist = (next) => {
    const anterior = itemsRef.current;
    itemsRef.current = next;

    // Interface e cache atualizam imediatamente, sem esperar a rede.
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    const anteriorMap = new Map(
      anterior.map((item) => [String(item.id), item])
    );
    const proximoMap = new Map(
      next.map((item) => [String(item.id), item])
    );

    const removidos = anterior
      .filter((item) => !proximoMap.has(String(item.id)))
      .map((item) => item.id)
      .filter(isUuidReprecificacao);

    const alterados = next.filter((item) => {
      const antigo = anteriorMap.get(String(item.id));
      return !antigo || JSON.stringify(antigo) !== JSON.stringify(item);
    });

    // Somente registros modificados são sincronizados.
    enfileirarSync(async () => {
      if (removidos.length) {
        const { error } = await supabase
          .from(REPRECIFICACAO_TABLE)
          .delete()
          .in("id", removidos);

        if (error) throw error;
      }

      if (alterados.length) {
        const normalizados = alterados
          .map((item) => ({
            ...item,
            id: isUuidReprecificacao(item.id)
              ? item.id
              : novoUuidReprecificacao(),
            updated_date: new Date().toISOString(),
          }))
          .filter((item) => item.id);

        const { error } = await supabase
          .from(REPRECIFICACAO_TABLE)
          .upsert(normalizados.map(reprecificacaoParaBanco), {
            onConflict: "id",
          });

        if (error) throw error;
      }
    });
  };

  const preview = useMemo(() => calculateRepricing(form), [form]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !term ||
        String(item.cliente || "").toLowerCase().includes(term) ||
        String(item.cnpj || "").toLowerCase().includes(term) ||
        String(item.regime || "").toLowerCase().includes(term);

      const matchesFilter =
        filter === "todos" ||
        (filter === "abaixo" && item.situacao === "Abaixo da referência") ||
        (filter === "dentro" && item.situacao === "Dentro da referência") ||
        (filter === "acima" && item.situacao === "Acima da referência");

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  const metrics = useMemo(() => {
    const clientes = items.length;
    const abaixo = items.filter((item) => item.situacao === "Abaixo da referência");
    const receitaAtual = items.reduce(
      (sum, item) => sum + numberValue(item.honorarioAtual),
      0
    );
    const referenciaTotal = items.reduce(
      (sum, item) => sum + numberValue(item.recomendado),
      0
    );
    const oportunidadeMensal = abaixo.reduce(
      (sum, item) => sum + Math.max(0, numberValue(item.diferencaMensal)),
      0
    );

    const percentualDefasados =
      clientes > 0 ? Math.round((abaixo.length / clientes) * 1000) / 10 : 0;

    const gapCarteira = Math.max(0, referenciaTotal - receitaAtual);

    return {
      clientes,
      abaixo: abaixo.length,
      receitaAtual,
      referenciaTotal,
      oportunidadeMensal,
      oportunidadeAnual: oportunidadeMensal * 12,
      percentualDefasados,
      gapCarteira,
    };
  }, [items]);

  const prioridadeOportunidade = (item) => {
    const atual = Math.max(0, numberValue(item.honorarioAtual));
    const gap = Math.max(0, numberValue(item.diferencaMensal));
    const percentual = Math.max(0, numberValue(item.diferencaPercentual));

    if (atual <= 0) {
      return {
        label: "Informar honorário",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
    }

    if (gap <= 0) {
      return {
        label: "Sem oportunidade",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
    }

    if (gap >= 1000 || percentual >= 50) {
      return {
        label: "Alta prioridade",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    }

    if (gap >= 400 || percentual >= 25) {
      return {
        label: "Média prioridade",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }

    return {
      label: "Oportunidade",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    };
  };

  const oportunidadeOrdenada = useMemo(
    () =>
      [...filtered]
        .filter((item) => numberValue(item.honorarioAtual) > 0 && numberValue(item.diferencaMensal) > 0)
        .sort(
          (a, b) =>
            numberValue(b.diferencaMensal) - numberValue(a.diferencaMensal)
        ),
    [filtered]
  );

  const normalizarClienteParaReprecificacao = (cliente) => ({
    clienteId:
      cliente.clienteId ||
      cliente.cliente_id ||
      cliente.id ||
      null,
    cliente:
      cliente.cliente ||
      cliente.client_nome ||
      cliente.nome ||
      cliente.razao_social ||
      "",
    cnpj: cliente.cnpj || "",
    regime: cliente.regime || cliente.regime_tributario || "",
    atividade: cliente.atividade || cliente.atividade_principal || "",
    faturamento: cliente.faturamento || cliente.faturamento_medio || "",
    uf: cliente.uf || "",
    colaboradores: cliente.colaboradores || cliente.funcionarios || 0,
    valorColaboradorManual:
      cliente.valorColaboradorManual ||
      cliente.valor_colaborador_manual ||
      "",
    notasSaida: cliente.notasSaida || cliente.notas_saida || 0,
    notasEntrada: cliente.notasEntrada || cliente.notas_entrada || 0,
    outrosDocumentos:
      cliente.outrosDocumentos || cliente.outros_documentos || 0,
    filiaisDetalhadas:
      cliente.filiaisDetalhadas ||
      cliente.filiais_detalhadas ||
      [],
    movimentacaoBancaria:
      cliente.movimentacaoBancaria ||
      cliente.movimentacao_bancaria ||
      "normal",
    contasBancarias:
      cliente.contasBancarias || cliente.contas_bancarias || 0,
    vendeOutrosEstados:
      cliente.vendeOutrosEstados ||
      cliente.vende_outros_estados ||
      false,
    estadosVenda:
      cliente.estadosVenda || cliente.estados_venda || "",
    compraOutrosEstados:
      cliente.compraOutrosEstados ||
      cliente.compra_outros_estados ||
      false,
    estadosCompra:
      cliente.estadosCompra || cliente.estados_compra || "",
    vendeExterior:
      cliente.vendeExterior || cliente.vende_exterior || false,
    paisesVenda:
      cliente.paisesVenda || cliente.paises_venda || "",
    documentosExportacao:
      cliente.documentosExportacao ||
      cliente.documentos_exportacao ||
      0,
    compraExterior:
      cliente.compraExterior || cliente.compra_exterior || false,
    paisesCompra:
      cliente.paisesCompra || cliente.paises_compra || "",
    documentosImportacao:
      cliente.documentosImportacao ||
      cliente.documentos_importacao ||
      0,
    retencoes: Boolean(cliente.retencoes),
    substituicaoTributaria: Boolean(
      cliente.substituicaoTributaria ||
        cliente.substituicao_tributaria
    ),
    multiplasAtividades: Boolean(
      cliente.multiplasAtividades ||
        cliente.multiplas_atividades
    ),
    folhaComplexa: Boolean(
      cliente.folhaComplexa || cliente.folha_complexa
    ),
    admissoesDemissoes: Boolean(
      cliente.admissoesDemissoes ||
        cliente.admissoes_demissoes
    ),
    parcelamentos: Boolean(cliente.parcelamentos),
    obrigacoesEspecificas: Boolean(
      cliente.obrigacoesEspecificas ||
        cliente.obrigacoes_especificas
    ),
    beneficiosFiscais: Boolean(
      cliente.beneficiosFiscais ||
        cliente.beneficios_fiscais
    ),
    honorarioAtual:
      cliente.honorarioAtual ||
      cliente.honorario_atual ||
      cliente.honorario ||
      cliente.valor_honorario ||
      "",
  });

  useEffect(() => {
    if (!carregamentoInicialConcluido) return;

    let contexto = null;

    try {
      const raw = localStorage.getItem(REFORMA_REPRECIFICACAO_KEY);
      if (raw) contexto = JSON.parse(raw);
    } catch {
      contexto = null;
    }

    if (!contexto?.cliente) return;

    const nomeCliente = String(contexto.cliente || "").trim();
    const clienteIdContexto = String(
      contexto.clienteId || contexto.cliente_id || ""
    ).trim();
    const cnpjContexto = String(contexto.cnpj || "").replace(/\D/g, "");

    if (!nomeCliente && !clienteIdContexto && !cnpjContexto) return;

    const normalizarTexto = (value) =>
      String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    const mesmoId = (item) => {
      if (!clienteIdContexto) return false;

      const ids = [
        item?.clienteId,
        item?.cliente_id,
        item?.pricing_snapshot?.clienteId,
        item?.pricing_snapshot?.cliente_id,
      ]
        .filter(Boolean)
        .map((value) => String(value).trim());

      return ids.includes(clienteIdContexto);
    };

    const mesmoCnpj = (item) => {
      if (!cnpjContexto) return false;
      return String(item?.cnpj || "").replace(/\D/g, "") === cnpjContexto;
    };

    const mesmoNome = (item) =>
      Boolean(nomeCliente) &&
      normalizarTexto(item?.cliente) === normalizarTexto(nomeCliente);

    // Prioridade de identificação: ID real da carteira -> CNPJ -> nome.
    const clienteJaReprecificado =
      itemsRef.current.find(mesmoId) ||
      itemsRef.current.find(mesmoCnpj) ||
      itemsRef.current.find(mesmoNome);

    setOrigemReforma(contexto);
    setFilter("todos");

    if (clienteJaReprecificado) {
      setSearch(
        clienteJaReprecificado.cnpj ||
          clienteJaReprecificado.cliente ||
          nomeCliente
      );
      setDetalheItem(clienteJaReprecificado);
      setGestaoReajuste({
        status: clienteJaReprecificado.status_reajuste || "Pendente",
        novoHonorario:
          Number(clienteJaReprecificado.novo_honorario || 0) > 0
            ? Number(clienteJaReprecificado.novo_honorario)
                .toFixed(2)
                .replace(".", ",")
            : "",
        dataReajuste: clienteJaReprecificado.data_reajuste || "",
      });

      localStorage.removeItem(REFORMA_REPRECIFICACAO_KEY);
      return;
    }

    try {
      const clientes = JSON.parse(
        localStorage.getItem(CLIENTES_STORAGE_KEY) || "[]"
      );

      const carteira = Array.isArray(clientes) ? clientes : [];

      const clienteCarteira =
        carteira.find(
          (item) =>
            clienteIdContexto &&
            String(item?.id || item?.clienteId || item?.cliente_id || "").trim() ===
              clienteIdContexto
        ) ||
        carteira.find(
          (item) =>
            cnpjContexto &&
            String(item?.cnpj || "").replace(/\D/g, "") === cnpjContexto
        ) ||
        carteira.find((item) =>
          mesmoNome({
            cliente:
              item?.cliente ||
              item?.client_nome ||
              item?.nome ||
              item?.razao_social ||
              item?.nome_fantasia ||
              "",
          })
        );

      if (clienteCarteira) {
        setForm(normalizarClienteParaReprecificacao(clienteCarteira));
        setModalOpen(true);
        localStorage.removeItem(REFORMA_REPRECIFICACAO_KEY);
        return;
      }
    } catch {
      // Se a carteira local não estiver disponível, abre com o contexto recebido.
    }

    setForm((current) => ({
      ...current,
      clienteId: contexto.clienteId || contexto.cliente_id || null,
      cliente: nomeCliente,
      cnpj: contexto.cnpj || current.cnpj,
      regime: contexto.regime || current.regime,
      atividade: contexto.atividade || current.atividade,
    }));
    setModalOpen(true);
    localStorage.removeItem(REFORMA_REPRECIFICACAO_KEY);
  }, [carregamentoInicialConcluido]);

  const criarRegistroImportado = (dados) => {
    const result = calculateRepricing(dados);

    if (!result.success) {
      return {
        success: false,
        error:
          result.error ||
          "Dados insuficientes para calcular a reprecificação.",
      };
    }

    return {
      success: true,
      record: {
        id: novoUuidReprecificacao(),
        created_date: new Date().toISOString(),
        engine_version: ENGINE_VERSION,
        clienteId: dados.clienteId || null,
        cliente: String(dados.cliente || "").trim(),
        cnpj: dados.cnpj || "",
        regime: dados.regime || "",
        atividade: dados.atividade || "",
        faturamento: numberValue(dados.faturamento),
        uf: dados.uf || "",
        colaboradores: numberValue(dados.colaboradores),
        honorarioAtual: result.honorarioAtual,
        recomendado: Math.round(result.recomendado),
        competitivo: Math.round(result.competitivo),
        superior: Math.round(result.superior),
        diferencaMensal: Math.round(result.diferencaMensal),
        diferencaAnual: Math.round(result.diferencaAnual),
        diferencaPercentual: result.diferencaPercentual,
        situacao: result.situacao,
        valorDP: Math.round(result.dp.total),
        valorColaborador: result.dp.valorUnitario,
        contabilFiscal: Math.round(result.contabilFiscal),
        filiais: Array.isArray(dados.filiaisDetalhadas)
          ? dados.filiaisDetalhadas.length
          : 0,
        filiais_detalhadas: Array.isArray(dados.filiaisDetalhadas)
          ? dados.filiaisDetalhadas
          : [],
        valorFiliais: Math.round(result.branchTotal || 0),
        pricing_snapshot: {
          ...dados,
          resultado: result,
        },
      },
    };
  };

  const abrirDetalheReprecificacao = (item) => {
    if (!item) return;
    setDetalheItem(item);
    setGestaoReajuste({
      status: item.status_reajuste || "Pendente",
      novoHonorario:
        Number(item.novo_honorario || 0) > 0
          ? Number(item.novo_honorario).toFixed(2).replace(".", ",")
          : "",
      dataReajuste: item.data_reajuste || "",
    });
  };

  const fecharDetalheReprecificacao = () => {
    setDetalheItem(null);
    setGestaoReajuste({ status: "Pendente", novoHonorario: "", dataReajuste: "" });
  };

  const salvarGestaoReajuste = () => {
    if (!detalheItem) return;
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para atualizar a gestão do reajuste.");
      return;
    }

    const status = gestaoReajuste.status || "Pendente";
    const novoHonorario = numberValue(gestaoReajuste.novoHonorario);
    const atual = numberValue(detalheItem.honorarioAtual);

    if (status === "Reajustado" && novoHonorario <= 0) {
      alert("Informe o novo honorário para concluir o reajuste.");
      return;
    }

    if (status === "Reajustado" && !gestaoReajuste.dataReajuste) {
      alert("Informe a data do reajuste.");
      return;
    }

    const receitaRecuperada =
      status === "Reajustado" ? Math.max(0, novoHonorario - atual) : 0;
    const agora = new Date().toISOString();

    const next = itemsRef.current.map((item) =>
      item.id === detalheItem.id
        ? {
            ...item,
            status_reajuste: status,
            novo_honorario: status === "Reajustado" ? novoHonorario : 0,
            data_reajuste: status === "Reajustado" ? gestaoReajuste.dataReajuste : "",
            receita_recuperada: receitaRecuperada,
            updated_date: agora,
          }
        : item
    );

    persist(next);
    const atualizado = next.find((item) => item.id === detalheItem.id);
    setDetalheItem(atualizado || null);
    alert("Gestão do reajuste atualizada com sucesso.");
  };

  const carregarCarteira = () => {
    if (!permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para criar/importar reprecificações.");
      return;
    }

    try {
      const clientes = JSON.parse(
        localStorage.getItem(CLIENTES_STORAGE_KEY) || "[]"
      );

      const rows = (Array.isArray(clientes) ? clientes : []).map(
        normalizarClienteParaReprecificacao
      );

      setImportMode("carteira");
      setImportRows(rows);
      setImportSelecionados(rows.map((_, index) => index));
      setImportOpen(true);
    } catch {
      alert("Não foi possível carregar a carteira de clientes.");
    }
  };

  const lerPlanilha = (event) => {
    if (!permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para criar/importar reprecificações.");
      return;
    }

    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
          raw: false,
        });

        const get = (row, names) => {
          const keys = Object.keys(row);
          const normalize = (value) =>
            String(value || "")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");

          for (const name of names) {
            const target = normalize(name);
            const key = keys.find((item) => normalize(item) === target);
            if (key) return row[key];
          }

          return "";
        };

        const rows = data.map((row) =>
          normalizarClienteParaReprecificacao({
            cliente: get(row, [
              "Cliente",
              "Empresa",
              "Nome",
              "Razão Social",
              "Razao Social",
            ]),
            cnpj: get(row, ["CNPJ"]),
            regime: get(row, [
              "Regime",
              "Regime Tributário",
              "Regime Tributario",
            ]),
            atividade: get(row, [
              "Atividade",
              "Atividade Principal",
            ]),
            faturamento: get(row, [
              "Faturamento",
              "Faturamento Médio Mensal",
              "Faturamento Medio Mensal",
            ]),
            honorarioAtual: get(row, [
              "Honorário Atual",
              "Honorario Atual",
              "Honorário",
              "Honorario",
            ]),
            colaboradores: get(row, [
              "Colaboradores",
              "Funcionários",
              "Funcionarios",
            ]),
            notasSaida: get(row, [
              "Documentos Saída",
              "Documentos Saida",
              "Notas Saída",
              "Notas Saida",
            ]),
            notasEntrada: get(row, [
              "Documentos Entrada",
              "Notas Entrada",
            ]),
            uf: get(row, ["UF", "Estado"]),
          })
        );

        setImportMode("excel");
        setImportRows(rows);
        setImportSelecionados(rows.map((_, index) => index));
        setImportOpen(true);
      } catch (error) {
        console.error(error);
        alert("Não foi possível ler a planilha.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const baixarModelo = () => {
    const modelo = [
      {
        Cliente: "Empresa Exemplo Ltda.",
        CNPJ: "00.000.000/0001-00",
        "Regime Tributário": "Simples Nacional",
        "Atividade Principal": "Serviços",
        "Faturamento Médio Mensal": 30000,
        "Honorário Atual": 700,
        Colaboradores: 5,
        "Documentos Saída": 30,
        "Documentos Entrada": 20,
        UF: "SP",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(modelo);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reprecificacao");
    XLSX.writeFile(
      workbook,
      "modelo-importacao-reprecificacao-precificacont.xlsx"
    );
  };

  const importarSelecionados = () => {
    if (!permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para criar/importar reprecificações.");
      return;
    }

    const validos = importRows
      .map((dados, index) => ({
        dados,
        index,
        resultado: criarRegistroImportado(dados),
      }))
      .filter(
        ({ index, resultado }) =>
          importSelecionados.includes(index) && resultado.success
      );

    if (validos.length === 0) {
      alert(
        "Nenhum cliente pôde ser reprecificado. Verifique nome, regime, atividade, faturamento e honorário atual."
      );
      return;
    }

    const existentes = new Set(
      items
        .map((item) => String(item.cnpj || "").replace(/\D/g, ""))
        .filter(Boolean)
    );

    const novos = validos
      .filter(({ dados }) => {
        const cnpj = String(dados.cnpj || "").replace(/\D/g, "");
        return !cnpj || !existentes.has(cnpj);
      })
      .map(({ resultado }) => resultado.record);

    if (novos.length === 0) {
      alert(
        "Os clientes válidos da importação já existem na reprecificação."
      );
      return;
    }

    persist([...novos, ...itemsRef.current]);
    setImportOpen(false);
    setImportRows([]);
    setImportSelecionados([]);
  };

  const atualizarCarteiraComMotorAtual = async ({ silencioso = false } = {}) => {
    if (!permissoesModulo.pode_editar || !itemsRef.current.length) return;

    const desatualizados = itemsRef.current.filter(
      (item) => String(item.engine_version || "") !== String(ENGINE_VERSION)
    );

    if (!desatualizados.length) return;

    try {
      let atualizados = 0;
      let ignorados = 0;
      const agora = new Date().toISOString();

      const next = itemsRef.current.map((item) => {
        if (String(item.engine_version || "") === String(ENGINE_VERSION)) {
          return item;
        }

        const snapshot =
          item.pricing_snapshot && typeof item.pricing_snapshot === "object"
            ? item.pricing_snapshot
            : {};

        const { resultado: _resultadoAnterior, ...snapshotSemResultado } = snapshot;

        const dadosBase = {
          ...INITIAL_FORM,
          ...snapshotSemResultado,
          cliente: snapshotSemResultado.cliente || item.cliente || "",
          cnpj: snapshotSemResultado.cnpj || item.cnpj || "",
          regime: snapshotSemResultado.regime || item.regime || "",
          atividade: snapshotSemResultado.atividade || item.atividade || "",
          faturamento: snapshotSemResultado.faturamento ?? item.faturamento ?? "",
          uf: snapshotSemResultado.uf || item.uf || "",
          colaboradores: snapshotSemResultado.colaboradores ?? item.colaboradores ?? 0,
          honorarioAtual: snapshotSemResultado.honorarioAtual ?? item.honorarioAtual ?? "",
          filiaisDetalhadas: Array.isArray(snapshotSemResultado.filiaisDetalhadas)
            ? snapshotSemResultado.filiaisDetalhadas
            : Array.isArray(item.filiais_detalhadas)
            ? item.filiais_detalhadas
            : [],
        };

        const result = calculateRepricing(dadosBase);

        if (!result?.success) {
          ignorados += 1;
          return item;
        }

        const historicoAnterior = Array.isArray(item.historico_motores)
          ? item.historico_motores
          : [];

        const registroHistorico = {
          engine_version: item.engine_version || "não informado",
          substituido_em: agora,
          honorarioAtual: Number(item.honorarioAtual || 0),
          recomendado: Number(item.recomendado || 0),
          competitivo: Number(item.competitivo || 0),
          superior: Number(item.superior || 0),
          diferencaMensal: Number(item.diferencaMensal || 0),
          diferencaAnual: Number(item.diferencaAnual || 0),
          diferencaPercentual: Number(item.diferencaPercentual || 0),
          situacao: item.situacao || "",
          pricing_snapshot: item.pricing_snapshot || {},
        };

        atualizados += 1;

        return {
          ...item,
          updated_date: agora,
          engine_version: ENGINE_VERSION,
          honorarioAtual: result.honorarioAtual,
          recomendado: Math.round(result.recomendado),
          competitivo: Math.round(result.competitivo),
          superior: Math.round(result.superior),
          diferencaMensal: Math.round(result.diferencaMensal),
          diferencaAnual: Math.round(result.diferencaAnual),
          diferencaPercentual: result.diferencaPercentual,
          situacao: result.situacao,
          valorDP: Math.round(result.dp?.total || 0),
          valorColaborador: result.dp?.valorUnitario || 0,
          contabilFiscal: Math.round(result.contabilFiscal || 0),
          filiais: Array.isArray(dadosBase.filiaisDetalhadas)
            ? dadosBase.filiaisDetalhadas.length
            : 0,
          filiais_detalhadas: Array.isArray(dadosBase.filiaisDetalhadas)
            ? dadosBase.filiaisDetalhadas
            : [],
          valorFiliais: Math.round(result.branchTotal || 0),
          pricing_snapshot: {
            ...dadosBase,
            resultado: result,
          },
          historico_motores: [...historicoAnterior, registroHistorico],
        };
      });

      if (atualizados > 0) persist(next);

      if (!silencioso && atualizados > 0) {
        alert(
          `${atualizados} cliente(s) atualizado(s) para o motor ${ENGINE_VERSION}.` +
            (ignorados ? `\n${ignorados} cliente(s) não foram recalculados por dados insuficientes.` : "")
        );
      }
    } catch (error) {
      console.error("Reprecificação: falha ao atualizar carteira automaticamente.", error);
      if (!silencioso) alert("Não foi possível atualizar a carteira com o motor atual.");
    }
  };

  useEffect(() => {
    if (permissoesModulo.carregando || !permissoesModulo.pode_editar) return;
    if (!items.length || autoMotorCheckRef.current) return;

    autoMotorCheckRef.current = true;
    atualizarCarteiraComMotorAtual({ silencioso: true });
  }, [permissoesModulo.carregando, permissoesModulo.pode_editar, items.length]);

  const openNew = () => {
    if (!permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para criar/importar reprecificações.");
      return;
    }

    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(INITIAL_FORM);
  };

  const saveClient = () => {
    if (!permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para criar/importar reprecificações.");
      return;
    }

    if (!form.cliente.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }

    if (!form.regime || !form.atividade || numberValue(form.faturamento) <= 0) {
      alert("Preencha regime tributário, atividade e faturamento.");
      return;
    }

    if (numberValue(form.honorarioAtual) <= 0) {
      alert("Informe o honorário atual do cliente para realizar a reprecificação.");
      return;
    }

    const result = calculateRepricing(form);

    if (!result.success) {
      alert(result.error || "Não foi possível calcular a reprecificação.");
      return;
    }

    const record = {
      id: novoUuidReprecificacao(),
      created_date: new Date().toISOString(),
      engine_version: ENGINE_VERSION,
      clienteId: form.clienteId || null,
      cliente: form.cliente.trim(),
      cnpj: form.cnpj,
      regime: form.regime,
      atividade: form.atividade,
      faturamento: numberValue(form.faturamento),
      uf: form.uf,
      colaboradores: numberValue(form.colaboradores),
      honorarioAtual: result.honorarioAtual,
      recomendado: Math.round(result.recomendado),
      competitivo: Math.round(result.competitivo),
      superior: Math.round(result.superior),
      diferencaMensal: Math.round(result.diferencaMensal),
      diferencaAnual: Math.round(result.diferencaAnual),
      diferencaPercentual: result.diferencaPercentual,
      situacao: result.situacao,
      valorDP: Math.round(result.dp.total),
      valorColaborador: result.dp.valorUnitario,
      contabilFiscal: Math.round(result.contabilFiscal),
      filiais: Array.isArray(form.filiaisDetalhadas)
        ? form.filiaisDetalhadas.length
        : 0,
      filiais_detalhadas: Array.isArray(form.filiaisDetalhadas)
        ? form.filiaisDetalhadas
        : [],
      valorFiliais: Math.round(result.branchTotal || 0),
      pricing_snapshot: {
        ...form,
        resultado: result,
      },
    };

    persist([record, ...itemsRef.current]);
    closeModal();
  };

  const removeClient = (id) => {
    if (!permissoesModulo.pode_excluir) {
      negarAcao("Seu perfil não possui permissão para excluir reprecificações.");
      return;
    }
    if (!window.confirm("Deseja excluir este cliente da análise de reprecificação?")) {
      return;
    }

    persist(itemsRef.current.filter((item) => item.id !== id));
  };

  if (!permissoesModulo.carregando && !permissoesModulo.pode_visualizar) {
    return (
      <div className="min-h-full bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Reprecificação</h2>
          <p className="mt-2 text-sm text-slate-600">
            Seu perfil não possui permissão para visualizar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="precificacont-reprecificacao min-h-screen bg-slate-50">
      <style>{REPRECIFICACAO_DARK_CSS}</style>
      <div className="max-w-[1500px] mx-auto px-4 md:px-6 py-7">
        {origemReforma ? (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                Origem: Reforma Tributária
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {origemReforma.cliente}
                {origemReforma.oportunidade
                  ? ` • ${origemReforma.oportunidade}`
                  : ""}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                A Reforma apenas trouxe o contexto para análise. Nenhum honorário foi alterado automaticamente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOrigemReforma(null)}
              className="self-start rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 sm:self-auto"
            >
              Ocultar aviso
            </button>
          </div>
        ) : null}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
              <RefreshCcw size={16} />
              Inteligência de carteira
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Reprecificação da Base
            </h1>
            <p className="text-slate-500 mt-1">
              Compare os honorários atuais com a referência PrecificaCont e identifique oportunidades de receita.
            </p>
          </div>

          {permissoesModulo.pode_criar ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={carregarCarteira}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Database size={17} />
              Importar da carteira
            </button>

            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
              <Upload size={17} />
              Importar Excel
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={lerPlanilha}
              />
            </label>

            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Plus size={18} />
              Adicionar cliente
            </button>
          </div>
          ) : null}
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          <MetricCard
            icon={Users}
            label="Clientes analisados"
            value={integer(metrics.clientes)}
            helper="Carteira reprecificada"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Abaixo da referência"
            value={integer(metrics.abaixo)}
            helper="Clientes com oportunidade"
          />
          <MetricCard
            icon={CircleDollarSign}
            label="Honorários atuais"
            value={money(metrics.receitaAtual)}
            helper="Receita mensal analisada"
          />
          <MetricCard
            icon={TrendingUp}
            label="Potencial mensal"
            value={money(metrics.oportunidadeMensal)}
            helper="Somente clientes defasados"
          />
          <MetricCard
            icon={BarChart3}
            label="Potencial anual"
            value={money(metrics.oportunidadeAnual)}
            helper="Projeção em 12 meses"
          />
        </div>

        <div className="bg-slate-950 text-white rounded-2xl p-5 md:p-6 mb-6 shadow-lg">
          <div className="grid md:grid-cols-5 gap-5">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Receita atual analisada
              </div>
              <div className="text-2xl font-bold mt-1">{money(metrics.receitaAtual)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Referência PrecificaCont
              </div>
              <div className="text-2xl font-bold mt-1 text-blue-300">
                {money(metrics.referenciaTotal)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Receita recuperável
              </div>
              <div className="text-2xl font-bold mt-1 text-emerald-300">
                {money(metrics.oportunidadeMensal)}/mês
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Gap da carteira
              </div>
              <div className="text-2xl font-bold mt-1 text-amber-300">
                {money(metrics.gapCarteira)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Atual × referência
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Carteira defasada
              </div>
              <div className="text-2xl font-bold mt-1 text-rose-300">
                {metrics.percentualDefasados}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {metrics.abaixo} de {metrics.clientes} clientes
              </div>
            </div>
          </div>
        </div>

        {oportunidadeOrdenada.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
              <div>
                <div className="text-sm font-semibold text-blue-700">
                  Oportunidade comercial
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Clientes com maior potencial de reprecificação
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Priorização pelo gap mensal entre honorário atual e Índice PrecificaCont.
                </p>
              </div>
              <div className="text-sm text-slate-500">
                Potencial total:{" "}
                <strong className="text-emerald-600">
                  {money(metrics.oportunidadeMensal)}/mês
                </strong>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {oportunidadeOrdenada.slice(0, 6).map((item, index) => {
                const prioridade = prioridadeOportunidade(item);

                return (
                  <div
                    key={`oportunidade-${item.id}`}
                    onClick={() => abrirDetalheReprecificacao(item)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 cursor-pointer transition hover:border-blue-300 hover:shadow-sm"
                    title="Ver detalhamento da reprecificação"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-400">
                          #{index + 1} oportunidade
                        </div>
                        <div className="font-semibold text-slate-900 mt-1 truncate">
                          {item.cliente}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.regime} • {item.atividade}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${prioridade.className}`}
                      >
                        {prioridade.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <div className="text-xs text-slate-400">Honorário atual</div>
                        <div className="text-sm font-semibold text-slate-700 mt-1">
                          {money(item.honorarioAtual)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Índice PrecificaCont</div>
                        <div className="text-sm font-semibold text-blue-700 mt-1">
                          {money(item.recomendado)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-end justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-400">Gap mensal</div>
                        <div className="text-lg font-bold text-emerald-600 mt-0.5">
                          +{money(item.diferencaMensal)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Gap percentual</div>
                        <div className="font-semibold text-amber-600 mt-0.5">
                          +{item.diferencaPercentual}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-slate-200 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente, CNPJ ou regime..."
                className={`${inputClass} pl-10`}
              />
            </div>

            <SelectPrecificaCont
              value={filter}
              onChange={setFilter}
              options={[
                { value: "todos", label: "Situação" },
                { value: "abaixo", label: "Abaixo da referência" },
                { value: "dentro", label: "Dentro da referência" },
                { value: "acima", label: "Acima da referência" },
              ]}
              placeholder=""
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                <RefreshCcw size={25} />
              </div>
              <h3 className="font-semibold text-slate-900 mt-4">
                {items.length === 0
                  ? "Nenhum cliente reprecificado"
                  : "Nenhum resultado encontrado"}
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                {items.length === 0
                  ? "Adicione o primeiro cliente da carteira para comparar o honorário atual com a referência PrecificaCont."
                  : "Altere a busca ou o filtro para visualizar outros clientes."}
              </p>
              {items.length === 0 && (
                <button
                  type="button"
                  onClick={openNew}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus size={17} />
                  Adicionar primeiro cliente
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-5 py-3">Perfil</th>
                      <th className="px-5 py-3 text-right">Atual</th>
                      <th className="px-5 py-3 text-right">Referência</th>
                      <th className="px-5 py-3 text-right">Diferença</th>
                      <th className="px-5 py-3">Situação</th>
                      <th className="px-5 py-3">Prioridade</th>
                      <th className="px-5 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => abrirDetalheReprecificacao(item)}
                        className="hover:bg-slate-50/70 cursor-pointer"
                        title="Ver detalhamento da reprecificação"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900">{item.cliente}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {item.cnpj || "CNPJ não informado"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-slate-700">{item.regime}</div>
                          <div className="text-xs text-slate-400">{item.atividade}</div>
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-slate-700">
                          {money(item.honorarioAtual)}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-blue-700">
                          {money(item.recomendado)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div
                            className={`font-semibold ${
                              item.diferencaMensal > 0
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {item.diferencaMensal > 0 ? "+" : ""}
                            {money(item.diferencaMensal)}
                          </div>
                          <div className="text-xs text-slate-400">
                            {item.diferencaPercentual > 0 ? "+" : ""}
                            {item.diferencaPercentual}%
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <SituationBadge situation={item.situacao} />
                        </td>

                        <td className="px-5 py-4">
                          {(() => {
                            const prioridade = prioridadeOportunidade(item);
                            return (
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${prioridade.className}`}
                              >
                                {prioridade.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-4 text-right">
                      {permissoesModulo.pode_excluir ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeClient(item.id); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Excluir"
                          >
                            <Trash2 size={17} />
                          </button>                      ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden divide-y divide-slate-100">
                {filtered.map((item) => (
                  <div key={item.id} onClick={() => abrirDetalheReprecificacao(item)} className="p-5 cursor-pointer">
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="font-semibold text-slate-900">{item.cliente}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {item.regime} • {item.atividade}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeClient(item.id); }}
                        className="p-2 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-400">Honorário atual</div>
                        <div className="font-semibold mt-1">{money(item.honorarioAtual)}</div>
                      </div>
                      <div className="rounded-xl bg-blue-50 p-3">
                        <div className="text-xs text-blue-500">Referência</div>
                        <div className="font-semibold text-blue-700 mt-1">
                          {money(item.recomendado)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <SituationBadge situation={item.situacao} />
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Diferença mensal</div>
                        <div className="font-semibold text-slate-800">
                          {money(item.diferencaMensal)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {detalheItem && (() => {
        const resultado =
          detalheItem?.pricing_snapshot?.resultado &&
          typeof detalheItem.pricing_snapshot.resultado === "object"
            ? detalheItem.pricing_snapshot.resultado
            : {};

        const base = Number(resultado.base || 0);
        const regional = Number(
          resultado.regionalAdjustment ?? resultado.regional?.valor ?? 0
        );
        const documentos = Number(resultado.documentAdjustment || 0);
        const filiais = Number(
          resultado.branchTotal ?? detalheItem.valorFiliais ?? 0
        );
        const dp = Number(
          resultado.dp?.total ?? detalheItem.valorDP ?? 0
        );
        const contabilFiscal = Number(
          resultado.contabilFiscal ?? detalheItem.contabilFiscal ?? 0
        );
        const operacionalDireto = Number(resultado.ajusteOperacional || 0);
        const operacionalCalculado = Math.max(
          0,
          contabilFiscal - filiais - base - regional - documentos
        );
        const operacional = operacionalDireto || operacionalCalculado;
        const referencia = Number(detalheItem.recomendado || 0);
        const atual = Number(detalheItem.honorarioAtual || 0);
        const gapMensal = Number(detalheItem.diferencaMensal || 0);
        const gapAnual = Number(detalheItem.diferencaAnual || gapMensal * 12);
        const possuiComposicao =
          base > 0 || regional !== 0 || documentos > 0 || operacional > 0 || filiais > 0 || dp > 0;

        return (
          <div
            className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) fecharDetalheReprecificacao();
            }}
          >
            <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200">
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 md:px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Detalhamento da reprecificação
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {detalheItem.cliente}
                  </h2>
                  <div className="text-sm text-slate-500 mt-1">
                    {detalheItem.regime || "Regime não informado"} • {detalheItem.atividade || "Atividade não informada"}
                    {detalheItem.cnpj ? ` • ${detalheItem.cnpj}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fecharDetalheReprecificacao}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  title="Fechar"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 md:p-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Honorário atual</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">{money(atual)}</div>
                  </div>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="text-xs text-blue-600">Referência PrecificaCont</div>
                    <div className="text-xl font-bold text-blue-700 mt-1">{money(referencia)}</div>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-xs text-emerald-700">Gap mensal</div>
                    <div className="text-xl font-bold text-emerald-700 mt-1">
                      {gapMensal > 0 ? "+" : ""}{money(gapMensal)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-xs text-amber-700">Impacto anual</div>
                    <div className="text-xl font-bold text-amber-700 mt-1">
                      {gapAnual > 0 ? "+" : ""}{money(gapAnual)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-950 text-white p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-blue-300">
                        Como chegamos a esta referência
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        Composição registrada no cálculo deste cliente.
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Motor</div>
                      <div className="text-sm font-semibold text-white">
                        {detalheItem.engine_version || ENGINE_VERSION}
                      </div>
                    </div>
                  </div>

                  {possuiComposicao ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">Base por regime, porte e atividade</span>
                        <strong>{money(base)}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">Inteligência regional{detalheItem.uf ? ` (${detalheItem.uf})` : ""}</span>
                        <strong>{regional >= 0 ? "+ " : "- "}{money(Math.abs(regional))}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">Volume documental</span>
                        <strong>+ {money(documentos)}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">Complexidade operacional</span>
                        <strong>+ {money(operacional)}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">Filiais</span>
                        <strong>+ {money(filiais)}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">Departamento Pessoal</span>
                        <strong>+ {money(dp)}</strong>
                      </div>
                      <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-4">
                        <span className="font-semibold">Referência recomendada</span>
                        <strong className="text-blue-300 text-lg">{money(referencia)}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      Este registro foi calculado antes do detalhamento de composição ficar disponível.
                      A referência permanece preservada em {money(referencia)}.
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-blue-600 font-semibold">Gestão do reajuste</div>
                      <div className="text-sm text-slate-500 mt-1">Transforme a oportunidade identificada em receita efetivamente recuperada.</div>
                    </div>
                    {detalheItem.status_reajuste && (
                      <span className="inline-flex self-start px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold">
                        {detalheItem.status_reajuste}
                      </span>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <Field label="Etapa">
                      <SelectPrecificaCont
                        value={gestaoReajuste.status}
                        onChange={(value) =>
                          setGestaoReajuste((current) => ({ ...current, status: value }))
                        }
                        options={[
                          { value: "Pendente", label: "Pendente" },
                          { value: "Em negociação", label: "Em negociação" },
                          { value: "Reajustado", label: "Reajustado" },
                        ]}
                      />
                    </Field>

                    <Field label="Novo honorário">
                      <input
                        className={inputClass}
                        value={gestaoReajuste.novoHonorario}
                        onChange={(e) =>
                          setGestaoReajuste((current) => ({
                            ...current,
                            novoHonorario: formatCurrencyInput(e.target.value),
                          }))
                        }
                        placeholder="0,00"
                        disabled={gestaoReajuste.status !== "Reajustado"}
                      />
                    </Field>

                    <Field label="Data do reajuste">
                      <input
                        type="date"
                        className={inputClass}
                        value={gestaoReajuste.dataReajuste}
                        onChange={(e) =>
                          setGestaoReajuste((current) => ({
                            ...current,
                            dataReajuste: e.target.value,
                          }))
                        }
                        disabled={gestaoReajuste.status !== "Reajustado"}
                      />
                    </Field>
                  </div>

                  {gestaoReajuste.status === "Reajustado" && numberValue(gestaoReajuste.novoHonorario) > 0 && (
                    <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-sm text-emerald-700">Receita mensal recuperada</span>
                      <strong className="text-emerald-700">
                        {money(Math.max(0, numberValue(gestaoReajuste.novoHonorario) - atual))}/mês
                      </strong>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={salvarGestaoReajuste}
                      disabled={!permissoesModulo.pode_editar}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={17} />
                      Salvar andamento
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-xs uppercase tracking-wider text-slate-400">Perfil analisado</div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Faturamento</span><strong className="text-slate-800">{money(detalheItem.faturamento)}</strong></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Colaboradores</span><strong className="text-slate-800">{integer(detalheItem.colaboradores)}</strong></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Filiais</span><strong className="text-slate-800">{integer(detalheItem.filiais)}</strong></div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-xs uppercase tracking-wider text-slate-400">Situação</div>
                    <div className="mt-3"><SituationBadge situation={detalheItem.situacao} /></div>
                    <div className="text-sm text-slate-500 mt-3">
                      Diferença percentual: <strong className="text-slate-800">
                        {Number(detalheItem.diferencaPercentual || 0) > 0 ? "+" : ""}
                        {detalheItem.diferencaPercentual || 0}%
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {importOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="px-5 md:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {importMode === "carteira"
                    ? "Importar da carteira"
                    : "Importar reprecificação em lote"}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {importMode === "carteira"
                    ? "Use os clientes já cadastrados no PrecificaCont para analisar a carteira."
                    : "Revise os clientes encontrados na planilha antes de processar a reprecificação."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setImportOpen(false);
                  setImportRows([]);
                  setImportSelecionados([]);
                }}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto">
              {importMode === "excel" && (
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={baixarModelo}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FileSpreadsheet size={16} />
                    Baixar modelo
                  </button>
                </div>
              )}

              {importRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 px-5 text-center">
                  <Database size={26} className="text-slate-400 mx-auto" />
                  <div className="font-semibold text-slate-800 mt-3">
                    Nenhum cliente encontrado
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {importMode === "carteira"
                      ? "Cadastre ou importe clientes na página Clientes antes de usar esta opção."
                      : "A planilha não possui linhas para importar."}
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-3 w-10">
                            <input
                              type="checkbox"
                              checked={
                                importRows.length > 0 &&
                                importSelecionados.length === importRows.length
                              }
                              onChange={() =>
                                setImportSelecionados((atual) =>
                                  atual.length === importRows.length
                                    ? []
                                    : importRows.map((_, index) => index)
                                )
                              }
                              aria-label="Selecionar todos"
                            />
                          </th>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Perfil</th>
                          <th className="px-4 py-3 text-right">Atual</th>
                          <th className="px-4 py-3 text-right">Referência</th>
                          <th className="px-4 py-3">Validação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importRows.map((row, index) => {
                          const resultado =
                            criarRegistroImportado(row);
                          const calculado = resultado.success
                            ? resultado.record
                            : null;

                          return (
                            <tr key={`${row.cnpj}-${index}`}>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={importSelecionados.includes(index)}
                                  onChange={() =>
                                    setImportSelecionados((atual) =>
                                      atual.includes(index)
                                        ? atual.filter((item) => item !== index)
                                        : [...atual, index]
                                    )
                                  }
                                  aria-label={`Selecionar ${row.cliente || "cliente"}`}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-slate-900">
                                  {row.cliente || "Cliente sem nome"}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {row.cnpj || "CNPJ não informado"}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-slate-700">
                                  {row.regime || "—"}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {row.atividade || "—"}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium">
                                {money(row.honorarioAtual)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-blue-700">
                                {calculado
                                  ? money(calculado.recomendado)
                                  : "—"}
                              </td>
                              <td className="px-4 py-3">
                                {resultado.success ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                    <CheckCircle2 size={13} />
                                    Pronto
                                  </span>
                                ) : (
                                  <span
                                    title={resultado.error}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                                  >
                                    <AlertTriangle size={13} />
                                    Incompleto
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 md:px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-slate-500">
                {importSelecionados.length} de {importRows.length} cliente(s) selecionado(s). Apenas registros válidos serão processados.
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImportOpen(false);
                    setImportRows([]);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={importarSelecionados}
                  disabled={importRows.length === 0 || importSelecionados.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCcw size={17} />
                  Importar selecionados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="px-5 md:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Adicionar à reprecificação</h2>
                <p className="text-sm text-slate-500">
                  Informe os principais dados do cliente e o honorário atual.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Empresa / cliente">
                  <input
                    className={inputClass}
                    value={form.cliente}
                    onChange={(e) => set("cliente", e.target.value)}
                    placeholder="Ex.: Empresa ABC Ltda."
                  />
                </Field>

                <Field label="CNPJ">
                  <input
                    className={inputClass}
                    value={form.cnpj}
                    onChange={(e) => set("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </Field>

                <Field label="Regime tributário">
                  <SelectPrecificaCont
                    value={form.regime}
                    onChange={(value) => set("regime", value)}
                    options={[
                      { value: "", label: "Selecione" },
                      { value: "MEI", label: "MEI" },
                      { value: "Simples Nacional", label: "Simples Nacional" },
                      { value: "Lucro Presumido", label: "Lucro Presumido" },
                      { value: "Lucro Real", label: "Lucro Real" },
                      { value: "Outro / Especial", label: "Outro / Especial" },
                    ]}
                    placeholder=""
                    className={inputClass}
                  />
                </Field>

                <Field label="Atividade principal">
                  <SelectPrecificaCont
                    value={form.atividade}
                    onChange={(value) => set("atividade", value)}
                    options={[
                      { value: "", label: "Selecione" },
                      { value: "Serviços", label: "Serviços" },
                      { value: "Comércio", label: "Comércio" },
                      { value: "Indústria", label: "Indústria" },
                      { value: "Serviços + Comércio", label: "Serviços + Comércio" },
                    ]}
                    placeholder=""
                    className={inputClass}
                  />
                </Field>

                <Field label="Faturamento médio mensal">
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inputClass}
                    value={form.faturamento}
                    onChange={(e) =>
                      set("faturamento", formatCurrencyInput(e.target.value))
                    }
                    placeholder="Ex.: 30.000,00"
                  />
                </Field>

                <Field label="Honorário atual">
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inputClass}
                    value={form.honorarioAtual}
                    onChange={(e) =>
                      set("honorarioAtual", formatCurrencyInput(e.target.value))
                    }
                    placeholder="Ex.: 700,00"
                  />
                </Field>

                <Field label="Quantidade de colaboradores" hint="Informe 0 se não houver funcionários.">
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.colaboradores}
                    onChange={(e) => set("colaboradores", e.target.value)}
                    placeholder="Ex.: 5"
                  />
                </Field>

                {numberValue(form.colaboradores) > 100 ? (
                  <Field
                    label="Valor por colaborador — DP"
                    hint="Acima de 100 colaboradores, defina o valor unitário."
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      className={inputClass}
                      value={form.valorColaboradorManual}
                      onChange={(e) =>
                        set(
                          "valorColaboradorManual",
                          formatCurrencyInput(e.target.value)
                        )
                      }
                      placeholder="Ex.: 55,00"
                    />
                  </Field>
                ) : (
                  <Field label="UF">
                    <SelectPrecificaCont
                      value={form.uf}
                      onChange={(value) => set("uf", value)}
                      options={[
                        { value: "", label: "Selecione" },
                        { value: "AC", label: "AC" },
                        { value: "AL", label: "AL" },
                        { value: "AP", label: "AP" },
                        { value: "AM", label: "AM" },
                        { value: "BA", label: "BA" },
                        { value: "CE", label: "CE" },
                        { value: "DF", label: "DF" },
                        { value: "ES", label: "ES" },
                        { value: "GO", label: "GO" },
                        { value: "MA", label: "MA" },
                        { value: "MT", label: "MT" },
                        { value: "MS", label: "MS" },
                        { value: "MG", label: "MG" },
                        { value: "PA", label: "PA" },
                        { value: "PB", label: "PB" },
                        { value: "PR", label: "PR" },
                        { value: "PE", label: "PE" },
                        { value: "PI", label: "PI" },
                        { value: "RJ", label: "RJ" },
                        { value: "RN", label: "RN" },
                        { value: "RS", label: "RS" },
                        { value: "RO", label: "RO" },
                        { value: "RR", label: "RR" },
                        { value: "SC", label: "SC" },
                        { value: "SP", label: "SP" },
                        { value: "SE", label: "SE" },
                        { value: "TO", label: "TO" },
                      ]}
                      placeholder=""
                      className={inputClass}
                    />
                  </Field>
                )}

                <Field label="Documentos fiscais de saída">
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.notasSaida}
                    onChange={(e) => set("notasSaida", e.target.value)}
                    placeholder="Ex.: 30"
                  />
                </Field>

                <Field label="Documentos fiscais de entrada">
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.notasEntrada}
                    onChange={(e) => set("notasEntrada", e.target.value)}
                    placeholder="Ex.: 20"
                  />
                </Field>

                <Field label="Contas bancárias">
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.contasBancarias}
                    onChange={(e) => set("contasBancarias", e.target.value)}
                    placeholder="Ex.: 2"
                  />
                </Field>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">
                      Filiais
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Cada filial é calculada individualmente por regime, atividade e faturamento.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={adicionarFilial}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Plus size={16} />
                    Adicionar filial
                  </button>
                </div>

                {(!Array.isArray(form.filiaisDetalhadas) ||
                  form.filiaisDetalhadas.length === 0) ? (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500">
                    Nenhuma filial informada.
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {form.filiaisDetalhadas.map((filial, index) => {
                      const detalheFilial = preview?.branches?.detalhes?.find(
                        (detalhe) => detalhe.index === index
                      );

                      return (
                        <div
                          key={filial.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                              <div className="font-semibold text-slate-900">
                                Filial {index + 1}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {filial.centralizada !== false
                                  ? "Centralizada • 50% da referência própria"
                                  : "Descentralizada • 100% da referência própria"}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removerFilial(filial.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Remover filial"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <Field label="Regime tributário">
                              <SelectPrecificaCont
                                value={filial.regime}
                                onChange={(value) => atualizarFilial(filial.id, "regime", value)}
                                options={[
                                  { value: "", label: "Selecione" },
                                  { value: "MEI", label: "MEI" },
                                  { value: "Simples Nacional", label: "Simples Nacional" },
                                  { value: "Lucro Presumido", label: "Lucro Presumido" },
                                  { value: "Lucro Real", label: "Lucro Real" },
                                  { value: "Outro / Especial", label: "Outro / Especial" },
                                ]}
                                placeholder=""
                                className={inputClass}
                              />
                            </Field>

                            <Field label="Atividade principal">
                              <SelectPrecificaCont
                                value={filial.atividade}
                                onChange={(value) => atualizarFilial(filial.id, "atividade", value)}
                                options={[
                                  { value: "", label: "Selecione" },
                                  { value: "Serviços", label: "Serviços" },
                                  { value: "Comércio", label: "Comércio" },
                                  { value: "Indústria", label: "Indústria" },
                                  { value: "Serviços + Comércio", label: "Serviços + Comércio" },
                                ]}
                                placeholder=""
                                className={inputClass}
                              />
                            </Field>

                            <Field label="Faturamento médio mensal">
                              <input
                                type="text"
                                inputMode="numeric"
                                className={inputClass}
                                value={filial.faturamento}
                                onChange={(e) =>
                                  atualizarFilial(
                                    filial.id,
                                    "faturamento",
                                    formatCurrencyInput(e.target.value)
                                  )
                                }
                                placeholder="Ex.: 30.000,00"
                              />
                            </Field>

                            <Field label="Modelo operacional">
                              <SelectPrecificaCont
                                value={filial.centralizada !== false ? "centralizada" : "descentralizada"}
                                onChange={(value) =>
                                  atualizarFilial(
                                    filial.id,
                                    "centralizada",
                                    value === "centralizada"
                                  )
                                }
                                options={[
                                  { value: "centralizada", label: "Centralizada — 50%" },
                                  { value: "descentralizada", label: "Descentralizada — 100%" },
                                ]}
                                placeholder=""
                                className={inputClass}
                              />
                            </Field>
                          </div>

                          {detalheFilial && (
                            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-center justify-between gap-3">
                              <span className="text-sm text-blue-700">
                                Referência desta filial
                              </span>
                              <span className="font-bold text-blue-800">
                                {money(detalheFilial.valor)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {Number(preview?.branchTotal || 0) > 0 && (
                      <div className="rounded-xl bg-blue-600 text-white px-4 py-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">
                          Total das filiais
                        </span>
                        <span className="font-bold">
                          {money(preview.branchTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {form.regime && form.atividade && numberValue(form.faturamento) > 0 && (
                <div className="mt-6 rounded-2xl bg-slate-950 text-white p-5">
                  {preview.success ? (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-blue-300">
                            Referência PrecificaCont
                          </div>
                          <div className="text-3xl font-bold mt-1">
                            {money(preview.recomendado)}
                          </div>
                        </div>
                        <CheckCircle2 className="text-emerald-300" size={22} />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
                        <div className="rounded-xl bg-white/5 p-3">
                          <div className="text-xs text-slate-400">Atual</div>
                          <div className="font-semibold mt-1">
                            {money(form.honorarioAtual)}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/5 p-3">
                          <div className="text-xs text-slate-400">Diferença/mês</div>
                          <div className="font-semibold mt-1">
                            {money(preview.diferencaMensal)}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/5 p-3">
                          <div className="text-xs text-slate-400">Impacto anual</div>
                          <div className="font-semibold mt-1">
                            {money(preview.diferencaAnual)}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/5 p-3">
                          <div className="text-xs text-slate-400">DP</div>
                          <div className="font-semibold mt-1">
                            {money(preview.dp.total)}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/5 p-3">
                          <div className="text-xs text-slate-400">Filiais</div>
                          <div className="font-semibold mt-1">
                            {money(preview.branchTotal || 0)}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-3 text-amber-200">
                      <AlertTriangle size={20} className="shrink-0" />
                      <div className="text-sm">{preview.error}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 md:px-6 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveClient}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                <Save size={17} />
                Salvar reprecificação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
