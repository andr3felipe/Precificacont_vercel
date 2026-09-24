import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { calculatePricing } from "../lib/pricingEngine";
import { supabase } from "../supabase";
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  X,
  Calculator,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  CircleDollarSign,
  Upload,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";

const filialVazia = {
  id: "",
  nome: "",
  cnpj: "",
  uf: "",
  regime: "Simples Nacional",
  atividade: "Serviços",
  faturamento_medio: "",
  colaboradores: "",
  notas_saida: "",
  notas_entrada: "",
  outros_documentos: "",
  modelo_cobranca: "centralizada",
  percentual_cobranca: 50,
  valor_referencia: 0,
};

function normalizarFilial(filial, index = 0) {
  const modelo = texto(
    filial?.modelo_cobranca || filial?.modelo || filial?.cobranca
  ).toLowerCase();

  const centralizada =
    modelo === "centralizada" ||
    modelo === "50" ||
    Number(filial?.percentual_cobranca) === 50;

  return {
    ...filialVazia,
    ...filial,
    id: filial?.id || `filial-${Date.now()}-${index}`,
    nome: filial?.nome || filial?.razao_social || `Filial ${index + 1}`,
    regime: normalizarRegime(filial?.regime || "Simples Nacional"),
    atividade: normalizarAtividade(filial?.atividade || "Serviços"),
    faturamento_medio: numeroBR(filial?.faturamento_medio),
    colaboradores: numeroBR(filial?.colaboradores),
    notas_saida: numeroBR(filial?.notas_saida),
    notas_entrada: numeroBR(filial?.notas_entrada),
    outros_documentos: numeroBR(filial?.outros_documentos),
    modelo_cobranca: centralizada ? "centralizada" : "descentralizada",
    percentual_cobranca: centralizada ? 50 : 100,
    valor_referencia: numeroBR(filial?.valor_referencia),
  };
}

function calcularValorReferenciaFilial(cliente, filial) {
  const formMotor = {
    regime: filial.regime || cliente.regime,
    atividade: filial.atividade || cliente.atividade,
    faturamento: numeroBR(filial.faturamento_medio),
    uf: filial.uf || cliente.uf || "",
    colaboradores: numeroBR(filial.colaboradores),
    valorColaboradorManual: 0,
    notasSaida: numeroBR(filial.notas_saida),
    notasEntrada: numeroBR(filial.notas_entrada),
    outrosDocumentos: numeroBR(filial.outros_documentos),
    filiais: 0,
    contasBancarias: 0,
    movimentacaoBancaria: "normal",
    vendeOutrosEstados: false,
    estadosVenda: "",
    compraOutrosEstados: false,
    estadosCompra: "",
    vendeExterior: false,
    paisesVenda: "",
    documentosExportacao: 0,
    compraExterior: false,
    paisesCompra: "",
    documentosImportacao: 0,
    retencoes: false,
    substituicaoTributaria: false,
    multiplasAtividades: false,
    folhaComplexa: false,
    admissoesDemissoes: false,
    parcelamentos: false,
    obrigacoesEspecificas: false,
    beneficiosFiscais: false,
  };

  const resultado = calculatePricing(formMotor);
  const base = Number(resultado?.indice || 0);
  const percentual = Number(filial.percentual_cobranca) === 50 ? 0.5 : 1;
  return Math.round(base * percentual);
}

const clienteVazio = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  situacao_cadastral: "",
  data_abertura: "",
  natureza_juridica: "",
  porte: "",
  cnae_principal: "",
  cnae_principal_descricao: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  municipio: "",
  endereco_uf: "",
  telefone_cadastral: "",
  email_cadastral: "",
  fonte_dados_cnpj: "",
  cnpj_consultado_em: "",
  responsavel: "",
  telefone: "",
  email: "",
  regime: "Simples Nacional",
  atividade: "Serviços",
  faturamento_medio: "",
  colaboradores: "",
  filiais: "0",
  filiais_detalhadas: [],
  honorario_atual: "",
  honorario_recomendado: "",
  uf: "",
  notas_saida: "",
  notas_entrada: "",
  outros_documentos: "",
  contas_bancarias: "",
  movimentacao_bancaria: "normal",
  vende_outros_estados: false,
  estados_venda: "",
  compra_outros_estados: false,
  estados_compra: "",
  vende_exterior: false,
  paises_venda: "",
  documentos_exportacao: "",
  compra_exterior: false,
  paises_compra: "",
  documentos_importacao: "",
  retencoes: false,
  substituicao_tributaria: false,
  multiplas_atividades: false,
  folha_complexa: false,
  admissoes_demissoes: false,
  parcelamentos: false,
  obrigacoes_especificas: false,
  beneficios_fiscais: false,
  status_reprecificacao: "Pendente",
};

const STATUS = {
  PENDENTE: "Pendente",
  ANALISADO: "Analisado",
  NEGOCIACAO: "Em negociação",
  REAJUSTADO: "Reajustado",
};

function formatBRL(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function moedaBRInput(valor) {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  if (!digitos) return "";
  return (Number(digitos) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function valorMoedaBR(valor) {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  return digitos ? Number(digitos) / 100 : "";
}

function somenteDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function mascaraCpfCnpj(valor) {
  const d = somenteDigitos(valor).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function mascaraTelefoneBR(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function calcularPercentual(atual, recomendado) {
  const valorAtual = Number(atual || 0);
  const valorRecomendado = Number(recomendado || 0);

  if (!valorAtual) return 0;

  return ((valorRecomendado - valorAtual) / valorAtual) * 100;
}

function texto(valor) {
  return String(valor ?? "").trim();
}

function numeroBR(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  const s = texto(valor);
  if (!s) return 0;
  if (s.includes(",")) {
    const n = Number(s.replace(/R\$/gi, "").replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(s.replace(/R\$/gi, "").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function simNao(valor) {
  const s = texto(valor).toLowerCase();
  return ["sim", "s", "yes", "true", "1", "x"].includes(s);
}

function normalizarRegime(valor) {
  const s = texto(valor).toLowerCase();
  if (s === "mei") return "MEI";
  if (s.includes("simples")) return "Simples Nacional";
  if (s.includes("presumido")) return "Lucro Presumido";
  if (s.includes("real")) return "Lucro Real";
  return texto(valor);
}

function normalizarAtividade(valor) {
  const s = texto(valor).toLowerCase();
  if (s.includes("mista") || (s.includes("serv") && s.includes("com"))) return "Serviços + Comércio";
  if (s.includes("ind")) return "Indústria";
  if (s.includes("com")) return "Comércio";
  if (s.includes("serv")) return "Serviços";
  return texto(valor);
}

function calcularRecomendado(cliente) {
  const formMotor = {
    regime: cliente.regime,
    atividade: cliente.atividade,
    faturamento: numeroBR(cliente.faturamento_medio),
    uf: cliente.uf || "",
    colaboradores: numeroBR(cliente.colaboradores),
    valorColaboradorManual: numeroBR(cliente.valor_colaborador_manual),
    notasSaida: numeroBR(cliente.notas_saida),
    notasEntrada: numeroBR(cliente.notas_entrada),
    outrosDocumentos: numeroBR(cliente.outros_documentos),
    filiais: numeroBR(cliente.filiais),
    contasBancarias: numeroBR(cliente.contas_bancarias),
    movimentacaoBancaria: cliente.movimentacao_bancaria || "normal",
    vendeOutrosEstados: !!cliente.vende_outros_estados,
    estadosVenda: cliente.estados_venda || "",
    compraOutrosEstados: !!cliente.compra_outros_estados,
    estadosCompra: cliente.estados_compra || "",
    vendeExterior: !!cliente.vende_exterior,
    paisesVenda: cliente.paises_venda || "",
    documentosExportacao: numeroBR(cliente.documentos_exportacao),
    compraExterior: !!cliente.compra_exterior,
    paisesCompra: cliente.paises_compra || "",
    documentosImportacao: numeroBR(cliente.documentos_importacao),
    retencoes: !!cliente.retencoes,
    substituicaoTributaria: !!cliente.substituicao_tributaria,
    multiplasAtividades: !!cliente.multiplas_atividades,
    folhaComplexa: !!cliente.folha_complexa,
    admissoesDemissoes: !!cliente.admissoes_demissoes,
    parcelamentos: !!cliente.parcelamentos,
    obrigacoesEspecificas: !!cliente.obrigacoes_especificas,
    beneficiosFiscais: !!cliente.beneficios_fiscais,
  };

  const resultado = calculatePricing(formMotor);
  if (resultado?.dp?.precisaValorManual) return 0;
  return Math.round(resultado?.indice || 0);
}

const COLUNAS_MODELO = [
  "Razão Social *",
  "CNPJ *",
  "Regime Tributário *",
  "Atividade Principal *",
  "UF *",
  "Faturamento Médio Mensal *",
  "Honorário Atual *",
  "Colaboradores *",
  "Documentos Saída/mês *",
  "Documentos Entrada/mês *",
  "Nome Fantasia",
  "Responsável",
  "Telefone",
  "E-mail",
  "Filiais",
  "Filiais Detalhadas (JSON)",
  "Outros Documentos/mês",
  "Contas Bancárias",
  "Movimentação Bancária",
  "Vende Outros Estados?",
  "Estados Venda",
  "Compra Outros Estados?",
  "Estados Compra",
  "Vende Exterior?",
  "Países Venda",
  "Operações Exportação/mês",
  "Compra Exterior?",
  "Países Compra",
  "Operações Importação/mês",
  "Retenções?",
  "Substituição Tributária?",
  "Múltiplas Atividades?",
  "Folha Complexa?",
  "Alta Admissões/Demissões?",
  "Parcelamentos?",
  "Obrigações Específicas?",
  "Benefícios Fiscais?",
];

function valorLinha(row, nomes) {
  for (const nome of nomes) {
    if (row[nome] !== undefined && row[nome] !== null && texto(row[nome]) !== "") return row[nome];
  }
  return "";
}

function linhaParaCliente(row, index) {
  let filiaisDetalhadas = [];
  const filiaisJson = texto(
    valorLinha(row, ["Filiais Detalhadas (JSON)", "Filiais Detalhadas", "Filiais JSON"])
  );

  if (filiaisJson) {
    try {
      const parsed = JSON.parse(filiaisJson);
      if (Array.isArray(parsed)) {
        filiaisDetalhadas = parsed.map((filial, filialIndex) =>
          normalizarFilial(filial, filialIndex)
        );
      }
    } catch {
      filiaisDetalhadas = [];
    }
  }

  const quantidadeFiliaisInformada = numeroBR(valorLinha(row, ["Filiais"]));

  const cliente = {
    id: novoUuidCliente(),
    razao_social: texto(valorLinha(row, ["Razão Social *", "Razão Social", "Razao Social"])),
    nome_fantasia: texto(valorLinha(row, ["Nome Fantasia"])),
    cnpj: texto(valorLinha(row, ["CNPJ *", "CNPJ"])),
    responsavel: texto(valorLinha(row, ["Responsável", "Responsavel"])),
    telefone: texto(valorLinha(row, ["Telefone"])),
    email: texto(valorLinha(row, ["E-mail", "Email"])),
    regime: normalizarRegime(valorLinha(row, ["Regime Tributário *", "Regime Tributário", "Regime"])),
    atividade: normalizarAtividade(valorLinha(row, ["Atividade Principal *", "Atividade Principal", "Atividade"])),
    uf: texto(valorLinha(row, ["UF *", "UF"])).toUpperCase(),
    faturamento_medio: numeroBR(valorLinha(row, ["Faturamento Médio Mensal *", "Faturamento Médio Mensal", "Faturamento"])),
    honorario_atual: numeroBR(valorLinha(row, ["Honorário Atual *", "Honorário Atual", "Honorario Atual"])),
    colaboradores: numeroBR(valorLinha(row, ["Colaboradores *", "Colaboradores"])),
    notas_saida: numeroBR(valorLinha(row, ["Documentos Saída/mês *", "Documentos Saída/mês", "Documentos Saida/mes"])),
    notas_entrada: numeroBR(valorLinha(row, ["Documentos Entrada/mês *", "Documentos Entrada/mês", "Documentos Entrada/mes"])),
    filiais:
      quantidadeFiliaisInformada ||
      filiaisDetalhadas.length ||
      0,
    filiais_detalhadas: filiaisDetalhadas,
    outros_documentos: numeroBR(valorLinha(row, ["Outros Documentos/mês"])),
    contas_bancarias: numeroBR(valorLinha(row, ["Contas Bancárias"])),
    movimentacao_bancaria: texto(valorLinha(row, ["Movimentação Bancária"])) || "normal",
    vende_outros_estados: simNao(valorLinha(row, ["Vende Outros Estados?"])),
    estados_venda: texto(valorLinha(row, ["Estados Venda"])),
    compra_outros_estados: simNao(valorLinha(row, ["Compra Outros Estados?"])),
    estados_compra: texto(valorLinha(row, ["Estados Compra"])),
    vende_exterior: simNao(valorLinha(row, ["Vende Exterior?"])),
    paises_venda: texto(valorLinha(row, ["Países Venda"])),
    documentos_exportacao: numeroBR(valorLinha(row, ["Operações Exportação/mês"])),
    compra_exterior: simNao(valorLinha(row, ["Compra Exterior?"])),
    paises_compra: texto(valorLinha(row, ["Países Compra"])),
    documentos_importacao: numeroBR(valorLinha(row, ["Operações Importação/mês"])),
    retencoes: simNao(valorLinha(row, ["Retenções?"])),
    substituicao_tributaria: simNao(valorLinha(row, ["Substituição Tributária?"])),
    multiplas_atividades: simNao(valorLinha(row, ["Múltiplas Atividades?"])),
    folha_complexa: simNao(valorLinha(row, ["Folha Complexa?"])),
    admissoes_demissoes: simNao(valorLinha(row, ["Alta Admissões/Demissões?"])),
    parcelamentos: simNao(valorLinha(row, ["Parcelamentos?"])),
    obrigacoes_especificas: simNao(valorLinha(row, ["Obrigações Específicas?"])),
    beneficios_fiscais: simNao(valorLinha(row, ["Benefícios Fiscais?"])),
    honorario_recomendado: 0,
    status_reprecificacao: STATUS.PENDENTE,
    created_date: new Date().toISOString(),
  };

  const faltantes = [];
  if (!cliente.razao_social) faltantes.push("Razão Social");
  if (!cliente.cnpj) faltantes.push("CNPJ");
  if (!cliente.regime) faltantes.push("Regime");
  if (!cliente.atividade) faltantes.push("Atividade");
  if (!cliente.uf) faltantes.push("UF");
  if (!(cliente.faturamento_medio > 0)) faltantes.push("Faturamento");
  if (!(cliente.honorario_atual > 0)) faltantes.push("Honorário Atual");
  if (valorLinha(row, ["Colaboradores *", "Colaboradores"]) === "") faltantes.push("Colaboradores");
  if (valorLinha(row, ["Documentos Saída/mês *", "Documentos Saída/mês", "Documentos Saida/mes"]) === "") faltantes.push("Docs. Saída");
  if (valorLinha(row, ["Documentos Entrada/mês *", "Documentos Entrada/mês", "Documentos Entrada/mes"]) === "") faltantes.push("Docs. Entrada");

  return { cliente, faltantes };
}


const CLIENTES_STORAGE_KEY = "precificacont_clientes";
const CLIENTES_TABLE = "clientes";

function isUuidCliente(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function novoUuidCliente() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function clienteParaBanco(cliente, escritorioId) {
  return {
    id: cliente.id,
    escritorio_id: escritorioId,
    razao_social: cliente.razao_social || "",
    nome_fantasia: cliente.nome_fantasia || "",
    cnpj: somenteDigitos(cliente.cnpj),
    situacao_cadastral: cliente.situacao_cadastral || "",
    data_abertura: cliente.data_abertura || "",
    natureza_juridica: cliente.natureza_juridica || "",
    porte: cliente.porte || "",
    cnae_principal: cliente.cnae_principal || "",
    cnae_principal_descricao: cliente.cnae_principal_descricao || "",
    cep: somenteDigitos(cliente.cep),
    logradouro: cliente.logradouro || "",
    numero: cliente.numero || "",
    complemento: cliente.complemento || "",
    bairro: cliente.bairro || "",
    municipio: cliente.municipio || "",
    endereco_uf: cliente.endereco_uf || cliente.uf || "",
    telefone_cadastral: cliente.telefone_cadastral || "",
    email_cadastral: cliente.email_cadastral || "",
    fonte_dados_cnpj: cliente.fonte_dados_cnpj || "",
    cnpj_consultado_em: cliente.cnpj_consultado_em || null,
    responsavel: cliente.responsavel || "",
    telefone: somenteDigitos(cliente.telefone),
    email: cliente.email || "",
    regime: cliente.regime || "Simples Nacional",
    atividade: cliente.atividade || "Serviços",
    uf: cliente.uf || "",
    faturamento_medio: Number(cliente.faturamento_medio || 0),
    colaboradores: Number(cliente.colaboradores || 0),
    filiais: Number(cliente.filiais || 0),
    filiais_detalhadas: Array.isArray(cliente.filiais_detalhadas)
      ? cliente.filiais_detalhadas
      : [],
    honorario_atual: Number(cliente.honorario_atual || 0),
    honorario_recomendado: Number(cliente.honorario_recomendado || 0),
    notas_saida: Number(cliente.notas_saida || 0),
    notas_entrada: Number(cliente.notas_entrada || 0),
    outros_documentos: Number(cliente.outros_documentos || 0),
    contas_bancarias: Number(cliente.contas_bancarias || 0),
    movimentacao_bancaria: cliente.movimentacao_bancaria || "normal",
    vende_outros_estados: !!cliente.vende_outros_estados,
    estados_venda: cliente.estados_venda || "",
    compra_outros_estados: !!cliente.compra_outros_estados,
    estados_compra: cliente.estados_compra || "",
    vende_exterior: !!cliente.vende_exterior,
    paises_venda: cliente.paises_venda || "",
    documentos_exportacao: Number(cliente.documentos_exportacao || 0),
    compra_exterior: !!cliente.compra_exterior,
    paises_compra: cliente.paises_compra || "",
    documentos_importacao: Number(cliente.documentos_importacao || 0),
    retencoes: !!cliente.retencoes,
    substituicao_tributaria: !!cliente.substituicao_tributaria,
    multiplas_atividades: !!cliente.multiplas_atividades,
    folha_complexa: !!cliente.folha_complexa,
    admissoes_demissoes: !!cliente.admissoes_demissoes,
    parcelamentos: !!cliente.parcelamentos,
    obrigacoes_especificas: !!cliente.obrigacoes_especificas,
    beneficios_fiscais: !!cliente.beneficios_fiscais,
    valor_colaborador_manual: Number(cliente.valor_colaborador_manual || 0),
    status_reprecificacao: cliente.status_reprecificacao || STATUS.PENDENTE,
    created_date: cliente.created_date || new Date().toISOString(),
    updated_date: cliente.updated_date || new Date().toISOString(),
  };
}

function clienteDoBanco(row) {
  const filiaisDetalhadas = Array.isArray(row.filiais_detalhadas)
    ? row.filiais_detalhadas.map((filial, index) =>
        normalizarFilial(filial, index)
      )
    : [];

  return {
    ...row,
    id: row.id,
    cnpj: row.cnpj || "",
    telefone: row.telefone || "",
    faturamento_medio: Number(row.faturamento_medio || 0),
    colaboradores: Number(row.colaboradores || 0),
    filiais: Number(row.filiais || 0) || filiaisDetalhadas.length,
    filiais_detalhadas: filiaisDetalhadas,
    honorario_atual: Number(row.honorario_atual || 0),
    honorario_recomendado: Number(row.honorario_recomendado || 0),
    notas_saida: Number(row.notas_saida || 0),
    notas_entrada: Number(row.notas_entrada || 0),
    outros_documentos: Number(row.outros_documentos || 0),
    contas_bancarias: Number(row.contas_bancarias || 0),
    documentos_exportacao: Number(row.documentos_exportacao || 0),
    documentos_importacao: Number(row.documentos_importacao || 0),
    valor_colaborador_manual: Number(row.valor_colaborador_manual || 0),
  };
}

export default function Clientes() {
  const escritorioAtivoId =
    localStorage.getItem("precificacont_escritorio_ativo") || "";
  const clientesStorageKey = escritorioAtivoId
    ? `${CLIENTES_STORAGE_KEY}:${escritorioAtivoId}`
    : CLIENTES_STORAGE_KEY;

  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(clienteVazio);
  const [filialAtual, setFilialAtual] = useState(filialVazia);
  const [editandoFilial, setEditandoFilial] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [importModal, setImportModal] = useState(false);
  const [importacao, setImportacao] = useState([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [clienteEditandoId, setClienteEditandoId] = useState(null);
  const [fichaCliente, setFichaCliente] = useState(null);
  const [abaFicha, setAbaFicha] = useState("resumo");
  const [honorarioAtualTela, setHonorarioAtualTela] = useState("");
  const [faturamentoMedioTela, setFaturamentoMedioTela] = useState("");
  const [etapaCadastro, setEtapaCadastro] = useState(1);
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);
  const [mensagemCnpj, setMensagemCnpj] = useState("");

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
        if (!userId || !escritorioAtivoId) {
          if (ativo) setPermissoesModulo((p) => ({ ...p, carregando: false }));
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
          if (ativo) setPermissoesModulo((p) => ({ ...p, carregando: false }));
          return;
        }

        const { data: modulo, error: moduloError } = await supabase
          .from("modulos_saas")
          .select("id")
          .eq("codigo", "clientes")
          .eq("ativo", true)
          .maybeSingle();

        if (moduloError) throw moduloError;
        if (!modulo?.id) throw new Error('Módulo "clientes" não encontrado.');

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
        console.error("Clientes: erro ao carregar permissões.", error);
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
  }, [escritorioAtivoId]);

  const negarAcao = (mensagem) => alert(mensagem);

  useEffect(() => {
    let ativo = true;

    const normalizarListaLocal = (lista) =>
      (Array.isArray(lista) ? lista : []).map((cliente) => {
        const filiaisDetalhadas = Array.isArray(cliente.filiais_detalhadas)
          ? cliente.filiais_detalhadas.map((filial, index) =>
              normalizarFilial(filial, index)
            )
          : [];

        return {
          ...cliente,
          id: isUuidCliente(cliente.id) ? cliente.id : novoUuidCliente(),
          cnpj: somenteDigitos(cliente.cnpj),
          telefone: somenteDigitos(cliente.telefone),
          filiais_detalhadas: filiaisDetalhadas,
          filiais:
            Number(cliente.filiais || 0) || filiaisDetalhadas.length || 0,
          created_date: cliente.created_date || new Date().toISOString(),
          updated_date: cliente.updated_date || new Date().toISOString(),
        };
      });

    const carregar = async () => {
      let cache = [];

      try {
        cache = normalizarListaLocal(
          JSON.parse(localStorage.getItem(clientesStorageKey) || "[]")
        );
      } catch {
        cache = [];
      }

      // Abre instantaneamente pelo cache.
      if (ativo && cache.length) setClientes(cache);
      localStorage.setItem(clientesStorageKey, JSON.stringify(cache));

      try {
        if (!escritorioAtivoId) {
          setClientes([]);
          return;
        }

        const { data, error } = await supabase
          .from(CLIENTES_TABLE)
          .select("*")
          .eq("escritorio_id", escritorioAtivoId)
          .order("updated_date", { ascending: false });

        if (error) throw error;
        if (!ativo) return;

        const banco = Array.isArray(data) ? data.map(clienteDoBanco) : [];

        // Supabase é a fonte principal de cada escritório.

        setClientes(banco);
        localStorage.setItem(clientesStorageKey, JSON.stringify(banco));
      } catch (error) {
        console.error("Clientes: falha ao sincronizar com Supabase.", error);
        // Sem internet, o cadastro continua abrindo pelo cache.
      }
    };

    carregar();

    return () => {
      ativo = false;
    };
  }, [escritorioAtivoId, clientesStorageKey]);

  const salvarNoNavegador = (lista) => {
    localStorage.setItem(clientesStorageKey, JSON.stringify(lista));
  };

  const sincronizarClientesAlterados = async (anterior, proximo) => {
    const anteriorMap = new Map(
      (anterior || []).map((cliente) => [String(cliente.id), cliente])
    );

    const alterados = (proximo || []).filter((cliente) => {
      const antigo = anteriorMap.get(String(cliente.id));
      return !antigo || JSON.stringify(antigo) !== JSON.stringify(cliente);
    });

    if (!alterados.length) return;

    try {
      if (!escritorioAtivoId) {
        throw new Error("Nenhum escritório ativo selecionado.");
      }

      const { error } = await supabase
        .from(CLIENTES_TABLE)
        .upsert(
          alterados.map((cliente) =>
            clienteParaBanco(cliente, escritorioAtivoId)
          )
        );

      if (error) throw error;
    } catch (error) {
      console.error("Clientes: erro ao salvar no Supabase.", error);
    }
  };

  const chaveDocumento = (valor) =>
    String(valor || "").replace(/\D/g, "");

  const carregarRelacionamentosCliente = (cliente) => {
    const cnpj = chaveDocumento(cliente?.cnpj);
    const id = String(cliente?.id ?? "");

    const lerLista = (chave) => {
      try {
        const valor = JSON.parse(localStorage.getItem(chave) || "[]");
        return Array.isArray(valor) ? valor : [];
      } catch {
        return [];
      }
    };

    const pertenceAoCliente = (item) => {
      const documentos = [
        item?.cnpj,
        item?.documento,
        item?.cliente_cnpj,
        item?.cnpj_cliente,
        item?.dados?.cnpj,
        item?.dados?.documento,
        item?.pricing_snapshot?.cnpj,
      ].map(chaveDocumento).filter(Boolean);

      const ids = [
        item?.clienteId,
        item?.cliente_id,
        item?.client_id,
        item?.dados?.clienteId,
      ].filter((valor) => valor !== undefined && valor !== null).map(String);

      return (cnpj && documentos.includes(cnpj)) || (id && ids.includes(id));
    };

    const simulacoes = lerLista("precificacont_simulacoes").filter(pertenceAoCliente);
    const reprecificacoes = lerLista("precificacont_reprecificacao").filter(pertenceAoCliente);
    const crm = lerLista("precificacont_crm_oportunidades").filter(pertenceAoCliente);

    let propostas = [];
    try {
      const chavePropostas = Object.keys(localStorage).find((chave) =>
        chave.toLowerCase().includes("propostas")
      );
      if (chavePropostas) propostas = lerLista(chavePropostas).filter(pertenceAoCliente);
    } catch {}

    return { simulacoes, propostas, reprecificacoes, crm };
  };

  const abrirFichaCliente = (cliente) => {
    if (!cliente) return;
    setFichaCliente({
      cliente,
      relacionamentos: carregarRelacionamentosCliente(cliente),
    });
    setAbaFicha("resumo");
  };

  const abrirRegistroRelacionado = (tipo, item, cliente) => {
    const destinos = {
      simulacoes: "simulacoes",
      propostas: "propostas",
      reprecificacao: "reprecificacao",
      crm: "crm",
    };
    const chaves = {
      simulacoes: "precificacont_abrir_simulacao",
      propostas: "precificacont_abrir_proposta",
      reprecificacao: "precificacont_abrir_reprecificacao",
      crm: "precificacont_abrir_oportunidade_crm",
    };

    if (!destinos[tipo]) return;

    const payload = {
      id: item?.id ?? null,
      numero: item?.numero_proposta || item?.numero || "",
      cnpj: cliente?.cnpj || item?.cnpj || item?.documento || "",
      cliente: cliente?.razao_social || "",
    };

    try {
      localStorage.setItem(chaves[tipo], JSON.stringify(payload));
    } catch {}

    setFichaCliente(null);
    window.dispatchEvent(
      new CustomEvent("precificacont:navegar", {
        detail: { pagina: destinos[tipo], payload },
      })
    );
  };

  const abrirClienteExistente = (cliente) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para editar clientes.");
      return;
    }
    if (!cliente) return;

    const filiaisDetalhadas = Array.isArray(cliente.filiais_detalhadas)
      ? cliente.filiais_detalhadas.map((filial, index) =>
          normalizarFilial(filial, index)
        )
      : [];

    setForm({
      ...clienteVazio,
      ...cliente,
      faturamento_medio: cliente.faturamento_medio ?? "",
      colaboradores: cliente.colaboradores ?? "",
      honorario_atual: cliente.honorario_atual ?? "",
      honorario_recomendado: cliente.honorario_recomendado ?? "",
      filiais: filiaisDetalhadas.length,
      filiais_detalhadas: filiaisDetalhadas,
    });
    setClienteEditandoId(cliente.id);
    setHonorarioAtualTela(
      Number(cliente.honorario_atual || 0) > 0 ? formatBRL(cliente.honorario_atual) : ""
    );
    setFaturamentoMedioTela(
      Number(cliente.faturamento_medio || 0) > 0 ? formatBRL(cliente.faturamento_medio) : ""
    );
    setFilialAtual(filialVazia);
    setEditandoFilial(false);
    setEtapaCadastro(1);
    setMensagemCnpj("");
    setModalAberto(true);
  };

  useEffect(() => {
    try {
      const pedido = JSON.parse(
        localStorage.getItem("precificacont_abrir_cliente") || "null"
      );

      if (!pedido) return;

      const cnpjPedido = String(pedido.cnpj || "").replace(/\D/g, "");
      const encontrado = clientes.find((cliente) => {
        if (pedido.id != null && String(cliente.id) === String(pedido.id)) {
          return true;
        }

        const cnpjCliente = String(cliente.cnpj || "").replace(/\D/g, "");
        return cnpjPedido && cnpjCliente === cnpjPedido;
      });

      if (encontrado) {
        abrirClienteExistente(encontrado);
        localStorage.removeItem("precificacont_abrir_cliente");
      }
    } catch {
      localStorage.removeItem("precificacont_abrir_cliente");
    }
  }, [clientes]);

  const cadastrarCliente = (e) => {
    e.preventDefault();

    if (clienteEditandoId && !permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para editar clientes.");
      return;
    }
    if (!clienteEditandoId && !permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para cadastrar clientes.");
      return;
    }

    if (!form.razao_social.trim()) {
      alert("Informe a razão social.");
      return;
    }

    if (!somenteDigitos(form.cnpj)) {
      alert("Informe o CNPJ ou CPF.");
      return;
    }

    const documento = somenteDigitos(form.cnpj);
    if (documento.length !== 11 && documento.length !== 14) {
      alert("Informe um CPF com 11 dígitos ou um CNPJ com 14 dígitos.");
      return;
    }

    const filiaisDetalhadas = (form.filiais_detalhadas || []).map(
      (filial, index) =>
        normalizarFilial(
          {
            ...filial,
            valor_referencia: calcularValorReferenciaFilial(form, filial),
          },
          index
        )
    );

    const dadosBaseCliente = {
      ...form,
      faturamento_medio: Number(form.faturamento_medio) || 0,
      colaboradores: Number(form.colaboradores) || 0,
      filiais: filiaisDetalhadas.length,
      filiais_detalhadas: filiaisDetalhadas,
      honorario_atual: Number(form.honorario_atual) || 0,
    };

    // O recomendado nunca é digitado manualmente:
    // usa exatamente o mesmo motor já utilizado na reprecificação.
    const honorarioRecomendadoAutomatico = calcularRecomendado(dadosBaseCliente);

    const dadosCliente = {
      ...dadosBaseCliente,
      honorario_recomendado: honorarioRecomendadoAutomatico,
      status_reprecificacao:
        honorarioRecomendadoAutomatico > 0
          ? STATUS.ANALISADO
          : STATUS.PENDENTE,
      updated_date: new Date().toISOString(),
    };

    const clientesAntes = clientes;

    const novaLista = clienteEditandoId
      ? clientes.map((cliente) =>
          String(cliente.id) === String(clienteEditandoId)
            ? {
                ...cliente,
                ...dadosCliente,
                id: cliente.id,
                created_date: cliente.created_date || new Date().toISOString(),
              }
            : cliente
        )
      : [
          {
            ...dadosCliente,
            id: novoUuidCliente(),
            created_date: new Date().toISOString(),
          },
          ...clientes,
        ];

    setClientes(novaLista);
    salvarNoNavegador(novaLista);
    sincronizarClientesAlterados(clientesAntes, novaLista);

    setForm(clienteVazio);
    setClienteEditandoId(null);
    setFilialAtual(filialVazia);
    setEditandoFilial(false);
    setModalAberto(false);
  };

  const alterarFilialAtual = (campo, valor) => {
    setFilialAtual((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const adicionarFilial = () => {
    if (!texto(filialAtual.nome)) {
      alert("Informe o nome ou identificação da filial.");
      return;
    }

    const filialNormalizada = normalizarFilial(
      {
        ...filialAtual,
        valor_referencia: calcularValorReferenciaFilial(form, filialAtual),
      },
      form.filiais_detalhadas.length
    );

    const filiais = editandoFilial
      ? form.filiais_detalhadas.map((filial) =>
          filial.id === filialAtual.id ? filialNormalizada : filial
        )
      : [...form.filiais_detalhadas, filialNormalizada];

    setForm((anterior) => ({
      ...anterior,
      filiais_detalhadas: filiais,
      filiais: filiais.length,
    }));

    setFilialAtual(filialVazia);
    setEditandoFilial(false);
  };

  const editarFilial = (filial) => {
    setFilialAtual(normalizarFilial(filial));
    setEditandoFilial(true);
  };

  const removerFilial = (id) => {
    const filiais = form.filiais_detalhadas.filter(
      (filial) => filial.id !== id
    );

    setForm((anterior) => ({
      ...anterior,
      filiais_detalhadas: filiais,
      filiais: filiais.length,
    }));

    if (filialAtual.id === id) {
      setFilialAtual(filialVazia);
      setEditandoFilial(false);
    }
  };

  const cancelarEdicaoFilial = () => {
    setFilialAtual(filialVazia);
    setEditandoFilial(false);
  };

  const alterarCampo = (campo, valor) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const consultarCnpjOpenCnpj = async () => {
    const cnpj = somenteDigitos(form.cnpj);
    if (cnpj.length !== 14) {
      setMensagemCnpj("Informe um CNPJ com 14 dígitos para consultar.");
      return;
    }

    setConsultandoCnpj(true);
    setMensagemCnpj("");

    try {
      const resposta = await fetch(`https://api.opencnpj.org/${cnpj}`);
      if (!resposta.ok) throw new Error("CNPJ não encontrado.");
      const dados = await resposta.json();

      const estabelecimento = dados.estabelecimento || dados;
      const cidade =
        estabelecimento.cidade?.nome ||
        estabelecimento.municipio?.nome ||
        estabelecimento.municipio ||
        dados.municipio ||
        "";
      const uf =
        estabelecimento.estado?.sigla ||
        estabelecimento.uf ||
        dados.uf ||
        "";
      const atividadePrincipal =
        estabelecimento.atividade_principal ||
        dados.atividade_principal ||
        {};
      const cnae =
        atividadePrincipal.id ||
        atividadePrincipal.codigo ||
        dados.cnae_fiscal ||
        "";
      const cnaeDescricao =
        atividadePrincipal.descricao ||
        dados.cnae_fiscal_descricao ||
        "";
      const telefoneApi =
        estabelecimento.telefone1 ||
        estabelecimento.telefone ||
        dados.telefone ||
        "";
      const emailApi =
        estabelecimento.email ||
        dados.email ||
        "";

      setForm((anterior) => ({
        ...anterior,
        cnpj,
        razao_social:
          dados.razao_social ||
          dados.nome_empresarial ||
          anterior.razao_social,
        nome_fantasia:
          estabelecimento.nome_fantasia ||
          dados.nome_fantasia ||
          anterior.nome_fantasia,
        situacao_cadastral:
          estabelecimento.situacao_cadastral ||
          dados.situacao_cadastral ||
          "",
        data_abertura:
          estabelecimento.data_inicio_atividade ||
          dados.data_inicio_atividade ||
          dados.data_abertura ||
          "",
        natureza_juridica:
          dados.natureza_juridica?.descricao ||
          dados.natureza_juridica ||
          "",
        porte:
          dados.porte?.descricao ||
          dados.porte ||
          "",
        cnae_principal: String(cnae || ""),
        cnae_principal_descricao: cnaeDescricao || "",
        cep: somenteDigitos(estabelecimento.cep || dados.cep || ""),
        logradouro:
          estabelecimento.logradouro ||
          dados.logradouro ||
          "",
        numero:
          estabelecimento.numero ||
          dados.numero ||
          "",
        complemento:
          estabelecimento.complemento ||
          dados.complemento ||
          "",
        bairro:
          estabelecimento.bairro ||
          dados.bairro ||
          "",
        municipio: cidade,
        endereco_uf: String(uf || "").toUpperCase(),
        uf: String(uf || anterior.uf || "").toUpperCase(),
        telefone_cadastral: telefoneApi,
        email_cadastral: emailApi,
        telefone: anterior.telefone || somenteDigitos(telefoneApi).slice(0, 11),
        email: anterior.email || emailApi,
        fonte_dados_cnpj: "OpenCNPJ",
        cnpj_consultado_em: new Date().toISOString(),
      }));

      setMensagemCnpj("Dados do CNPJ preenchidos automaticamente.");
    } catch (erro) {
      console.error("OpenCNPJ:", erro);
      setMensagemCnpj("Não foi possível consultar este CNPJ. Você pode preencher os dados manualmente.");
    } finally {
      setConsultandoCnpj(false);
    }
  };

  const clientesFiltrados = useMemo(() => {
    const texto = busca.toLowerCase().trim();

    return clientes.filter((cliente) => {
      const correspondeBusca =
        !texto ||
        (cliente.razao_social || "")
          .toLowerCase()
          .includes(texto) ||
        (cliente.nome_fantasia || "")
          .toLowerCase()
          .includes(texto) ||
        (cliente.cnpj || "")
          .toLowerCase()
          .includes(texto);

      const correspondeStatus =
        statusFiltro === "Todos" ||
        (cliente.status_reprecificacao || "Pendente") ===
          statusFiltro;

      return correspondeBusca && correspondeStatus;
    });
  }, [clientes, busca, statusFiltro]);

  const metricas = useMemo(() => {
    const analisados = clientes.filter(
      (cliente) =>
        Number(cliente.honorario_atual || 0) > 0 &&
        Number(cliente.honorario_recomendado || 0) > 0
    );

    const honorarioAtual = clientes.reduce(
      (total, cliente) =>
        total + Number(cliente.honorario_atual || 0),
      0
    );

    const honorarioRecomendado = clientes.reduce(
      (total, cliente) =>
        total + Number(cliente.honorario_recomendado || 0),
      0
    );

    const potencial = honorarioRecomendado - honorarioAtual;

    const percentual =
      honorarioAtual > 0
        ? (potencial / honorarioAtual) * 100
        : 0;

    const emNegociacao = clientes.filter(
      (cliente) =>
        cliente.status_reprecificacao === STATUS.NEGOCIACAO
    ).length;

    const reajustados = clientes.filter(
      (cliente) =>
        cliente.status_reprecificacao === STATUS.REAJUSTADO
    ).length;

    const totalFiliais = clientes.reduce(
      (total, cliente) =>
        total +
        (Array.isArray(cliente.filiais_detalhadas)
          ? cliente.filiais_detalhadas.length
          : Number(cliente.filiais || 0)),
      0
    );

    const valorFiliais = clientes.reduce(
      (total, cliente) =>
        total +
        (cliente.filiais_detalhadas || []).reduce(
          (soma, filial) => soma + Number(filial.valor_referencia || 0),
          0
        ),
      0
    );

    return {
      total: clientes.length,
      totalFiliais,
      valorFiliais,
      analisados: analisados.length,
      honorarioAtual,
      honorarioRecomendado,
      potencial,
      percentual,
      emNegociacao,
      reajustados,
    };
  }, [clientes]);

  const alternarSelecionado = (id) => {
    setSelecionados((anterior) =>
      anterior.includes(id)
        ? anterior.filter((item) => item !== id)
        : [...anterior, id]
    );
  };

  const selecionarTodos = () => {
    if (
      selecionados.length === clientesFiltrados.length &&
      clientesFiltrados.length > 0
    ) {
      setSelecionados([]);
      return;
    }

    setSelecionados(clientesFiltrados.map((cliente) => cliente.id));
  };

  const recalcularCliente = (id) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para alterar clientes.");
      return;
    }

    const clientesAntes = clientes;
    const novaLista = clientes.map((cliente) => {
      if (cliente.id !== id) return cliente;

      const recomendado = calcularRecomendado(cliente);

      return {
        ...cliente,
        honorario_recomendado: recomendado,
        status_reprecificacao:
          recomendado > 0
            ? STATUS.ANALISADO
            : STATUS.PENDENTE,
        updated_date: new Date().toISOString(),
      };
    });

    setClientes(novaLista);
    salvarNoNavegador(novaLista);
    sincronizarClientesAlterados(clientesAntes, novaLista);
  };

  const marcarComoNegociacao = (id) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para alterar clientes.");
      return;
    }

    const clientesAntes = clientes;
    const novaLista = clientes.map((cliente) =>
      cliente.id === id
        ? {
            ...cliente,
            status_reprecificacao: STATUS.NEGOCIACAO,
          }
        : cliente
    );

    setClientes(novaLista);
    salvarNoNavegador(novaLista);
    sincronizarClientesAlterados(clientesAntes, novaLista);
  };

  const marcarComoReajustado = (id) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para alterar clientes.");
      return;
    }

    const clientesAntes = clientes;
    const novaLista = clientes.map((cliente) =>
      cliente.id === id
        ? {
            ...cliente,
            status_reprecificacao: STATUS.REAJUSTADO,
          }
        : cliente
    );

    setClientes(novaLista);
    salvarNoNavegador(novaLista);
    sincronizarClientesAlterados(clientesAntes, novaLista);
  };

  const recalcularSelecionados = () => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para alterar clientes.");
      return;
    }

    if (selecionados.length === 0) {
      alert("Selecione pelo menos um cliente.");
      return;
    }

    const clientesAntes = clientes;

    const novaLista = clientes.map((cliente) => {
      if (!selecionados.includes(cliente.id)) {
        return cliente;
      }

      const recomendado = calcularRecomendado(cliente);

      return {
        ...cliente,
        honorario_recomendado: recomendado,
        status_reprecificacao:
          recomendado > 0
            ? STATUS.ANALISADO
            : STATUS.PENDENTE,
        updated_date: new Date().toISOString(),
      };
    });

    setClientes(novaLista);
    salvarNoNavegador(novaLista);
    sincronizarClientesAlterados(clientesAntes, novaLista);
    setSelecionados([]);
  };

  const baixarModelo = () => {
    const exemplo = {};
    COLUNAS_MODELO.forEach((col) => (exemplo[col] = ""));
    exemplo["Razão Social *"] = "Empresa Exemplo Ltda";
    exemplo["CNPJ *"] = "00.000.000/0001-00";
    exemplo["Regime Tributário *"] = "Simples Nacional";
    exemplo["Atividade Principal *"] = "Serviços";
    exemplo["UF *"] = "SP";
    exemplo["Faturamento Médio Mensal *"] = 30000;
    exemplo["Honorário Atual *"] = 700;
    exemplo["Colaboradores *"] = 8;
    exemplo["Documentos Saída/mês *"] = 20;
    exemplo["Documentos Entrada/mês *"] = 10;
    exemplo["Filiais"] = 0;
    exemplo["Filiais Detalhadas (JSON)"] = "";
    exemplo["Movimentação Bancária"] = "normal";

    const instrucoes = [
      ["PRECIFICACONT — MODELO DE IMPORTAÇÃO DE CARTEIRA"],
      ["Preencha uma linha por cliente. Não altere os títulos das colunas."],
      ["Campos com * são obrigatórios para reprecificação automática."],
      ["Regime: MEI | Simples Nacional | Lucro Presumido | Lucro Real"],
      ["Atividade: Serviços | Comércio | Indústria | Serviços + Comércio"],
      ["Campos Sim/Não: use SIM ou NÃO."],
      ["Valores monetários: informe somente o valor, ex.: 30000 ou 30000,00."],
      ["Colaboradores e documentos podem ser 0, mas não podem ficar em branco."],
      ["Filiais Detalhadas (JSON): opcional. Use uma lista JSON com nome, CNPJ, UF, regime, atividade, faturamento_medio, colaboradores, notas_saida, notas_entrada e modelo_cobranca."],
      ["modelo_cobranca: centralizada = 50% da referência da filial; descentralizada = 100%."],
      ["A quantidade de filiais será sincronizada com a quantidade de filiais detalhadas quando o JSON for informado."],
      ["Acima de 100 colaboradores, o valor de DP deverá ser tratado conforme a regra do escritório."],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([exemplo], { header: COLUNAS_MODELO });
    ws["!cols"] = COLUNAS_MODELO.map((c) => ({ wch: Math.max(16, Math.min(30, c.length + 3)) }));
    XLSX.utils.book_append_sheet(wb, ws, "Carteira");
    const wi = XLSX.utils.aoa_to_sheet(instrucoes);
    wi["!cols"] = [{ wch: 90 }];
    XLSX.utils.book_append_sheet(wb, wi, "Instruções");
    XLSX.writeFile(wb, "Modelo_Importacao_PrecificaCont.xlsx");
  };

  const lerArquivo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (!rows.length) {
        alert("A planilha não possui clientes para importar.");
        return;
      }

      const processados = rows.map((row, i) => {
        const item = linhaParaCliente(row, i);
        const cnpjLimpo = item.cliente.cnpj.replace(/\D/g, "");
        const duplicado = cnpjLimpo && clientes.some(
          (c) => String(c.cnpj || "").replace(/\D/g, "") === cnpjLimpo
        );
        return { ...item, duplicado };
      });

      setNomeArquivo(file.name);
      setImportacao(processados);
      setImportModal(true);
    } catch (e) {
      console.error(e);
      alert("Não foi possível ler a planilha. Use o modelo do PrecificaCont.");
    }
  };

  const confirmarImportacao = () => {
    if (!permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para importar/cadastrar clientes.");
      return;
    }
    const validos = importacao.filter((x) => x.faltantes.length === 0 && !x.duplicado);
    if (!validos.length) {
      alert("Não há clientes válidos para importar.");
      return;
    }

    const novos = validos.map(({ cliente }) => ({
      ...cliente,
      id: isUuidCliente(cliente.id) ? cliente.id : novoUuidCliente(),
      cnpj: somenteDigitos(cliente.cnpj),
      telefone: somenteDigitos(cliente.telefone),
    }));
    const clientesAntes = clientes;
    const novaLista = [...novos, ...clientes];
    setClientes(novaLista);
    salvarNoNavegador(novaLista);
    sincronizarClientesAlterados(clientesAntes, novaLista);
    setImportModal(false);
    setImportacao([]);
    setNomeArquivo("");
    alert(`${novos.length} cliente(s) importado(s) com sucesso.`);
  };

  const qtdValidos = importacao.filter((x) => x.faltantes.length === 0 && !x.duplicado).length;
  const qtdIncompletos = importacao.filter((x) => x.faltantes.length > 0).length;
  const qtdDuplicados = importacao.filter((x) => x.duplicado).length;

  if (!permissoesModulo.carregando && !permissoesModulo.pode_visualizar) {
    return (
      <div className="min-h-full bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Clientes / Carteira</h2>
          <p className="mt-2 text-sm text-slate-600">Seu perfil não possui permissão para visualizar este módulo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clientes-page">
      <style>{`
        .clientes-page{min-height:100vh;background:#f8fafc;color:#0f172a;padding:28px 24px}
        .clientes-container{max-width:1480px;margin:0 auto}
        .clientes-header{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}
        .eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;color:#2563eb;margin:0 0 5px}
        .clientes-header h1{font-size:30px;line-height:1.1;font-weight:800;margin:0}
        .subtitulo{color:#64748b;margin:7px 0 0;font-size:14px}
        .btn-primary,.btn-secondary,.btn-close,.cliente-acoes button,.filtro-status{border:0;cursor:pointer;font:inherit}
        .btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#2563eb;color:white;padding:11px 16px;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
        .btn-primary:hover{background:#1d4ed8}
        .metricas-clientes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
        .metrica-card{background:white;border:1px solid #e2e8f0;border-radius:16px;padding:18px;display:flex;gap:13px;align-items:center;box-shadow:0 1px 2px rgba(15,23,42,.04)}
        .metrica-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none}
        .metrica-icon.azul{background:#eff6ff;color:#2563eb}.metrica-icon.verde{background:#ecfdf5;color:#059669}.metrica-icon.roxo{background:#f5f3ff;color:#7c3aed}.metrica-icon.laranja{background:#fff7ed;color:#ea580c}
        .metrica-card span{display:block;color:#64748b;font-size:12px}.metrica-card strong{display:block;font-size:21px;margin-top:2px}.metrica-card small{display:block;color:#94a3b8;font-size:11px;margin-top:2px}.valor-positivo{color:#059669!important}
        .ferramentas-clientes{background:white;border:1px solid #e2e8f0;border-radius:16px;padding:14px;display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:16px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
        .search-box{display:flex;align-items:center;gap:9px;min-width:330px;flex:1;color:#94a3b8;border:1px solid #cbd5e1;border-radius:11px;padding:0 12px;background:white}
        .search-box input{width:100%;border:0;outline:0;padding:10px 0;font-size:14px;color:#0f172a;background:transparent}
        .filtros-status{display:flex;gap:6px;flex-wrap:wrap}
        .filtro-status{padding:8px 11px;border-radius:10px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:600}
        .filtro-status:hover{background:#f1f5f9}.filtro-status.ativo{background:#eff6ff;color:#2563eb}
        .acao-lote{display:flex;justify-content:space-between;align-items:center;background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:12px 15px;margin-bottom:14px;color:#1e40af;font-size:14px}
        .empty-state{background:white;border:1px solid #e2e8f0;border-radius:18px;padding:70px 24px;text-align:center;color:#94a3b8;box-shadow:0 1px 2px rgba(15,23,42,.04)}
        .empty-state svg{margin:0 auto;color:#cbd5e1}.empty-state h2{color:#334155;font-size:18px;margin:14px 0 5px}.empty-state p{margin:0 0 18px;font-size:14px}
        .clientes-section{background:white;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04)}
        .tabela-header{display:flex;justify-content:space-between;align-items:center;padding:13px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:12px}
        .checkbox-container{display:flex;align-items:center;gap:8px}.clientes-lista{display:flex;flex-direction:column}
        .cliente-row{display:grid;grid-template-columns:28px minmax(220px,1.55fr) minmax(120px,.75fr) minmax(125px,.8fr) minmax(105px,.7fr) minmax(120px,.8fr) minmax(115px,.7fr) minmax(80px,.55fr) minmax(120px,.8fr) 78px;gap:12px;align-items:center;padding:15px 16px;border-bottom:1px solid #f1f5f9}
        .cliente-row:last-child{border-bottom:0}.cliente-row:hover{background:#f8fafc}.cliente-row-selecionado{background:#eff6ff!important}
        .cliente-identificacao{display:flex;align-items:center;gap:11px;min-width:0}.empresa-icon{width:38px;height:38px;border-radius:11px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;flex:none}
        .cliente-identificacao h3{font-size:14px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cliente-identificacao p{font-size:12px;color:#64748b;margin:2px 0}.cliente-identificacao small{font-size:10px;color:#94a3b8}
        .cliente-dado span{display:block;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.04em}.cliente-dado strong{display:block;color:#334155;font-size:13px;margin-top:3px}.cliente-dado.destaque strong{color:#2563eb}.cliente-dado small{font-size:10px;margin-top:2px;display:block}.percentual-alta{color:#059669}.percentual-baixa{color:#dc2626}
        .status-pill{display:inline-flex;padding:6px 9px;border-radius:999px;font-size:10px;font-weight:700;background:#f1f5f9;color:#475569;white-space:nowrap}.status-analisado{background:#eff6ff;color:#1d4ed8}.status-em-negociação{background:#fff7ed;color:#c2410c}.status-reajustado{background:#ecfdf5;color:#047857}
        .cliente-acoes{display:flex;gap:5px;justify-content:flex-end}.cliente-acoes button{width:32px;height:32px;border-radius:9px;background:#f8fafc;color:#64748b;display:flex;align-items:center;justify-content:center}.cliente-acoes button:hover{background:#eff6ff;color:#2563eb}
        .modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:100}
        .modal{width:min(820px,100%);max-height:90vh;overflow:auto;background:white;border-radius:20px;box-shadow:0 25px 70px rgba(15,23,42,.25)}
        .modal-header{display:flex;justify-content:space-between;gap:15px;padding:22px 24px;border-bottom:1px solid #e2e8f0}.modal-header h2{font-size:21px;margin:0}.modal-header p{font-size:13px;color:#64748b;margin:5px 0 0}
        .btn-close{width:36px;height:36px;border-radius:10px;background:#f8fafc;color:#64748b;display:flex;align-items:center;justify-content:center}.btn-close:hover{background:#f1f5f9}
        .form-grid{padding:22px 24px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.form-field label{display:block;font-size:12px;font-weight:700;color:#475569;margin-bottom:6px}.form-field input,.form-field select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:11px;padding:10px 12px;font-size:14px;color:#0f172a;background:white;outline:none}.form-field input:focus,.form-field select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px #dbeafe}
        .modal-footer{display:flex;justify-content:flex-end;gap:9px;padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc}.btn-secondary{padding:10px 15px;border-radius:11px;background:white;border:1px solid #cbd5e1;color:#475569;font-weight:700;font-size:14px}
        .cadastro-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:16px 24px 0}
        .cadastro-step{border:1px solid #e2e8f0;background:#f8fafc;border-radius:12px;padding:10px 12px;font-size:12px;font-weight:700;color:#64748b;text-align:left}
        .cadastro-step.ativo{border-color:#93c5fd;background:#eff6ff;color:#2563eb}
        .cadastro-step span{display:inline-flex;width:22px;height:22px;border-radius:999px;align-items:center;justify-content:center;background:white;margin-right:7px}
        .cnpj-consulta{grid-column:1/-1;display:flex;gap:10px;align-items:flex-end}
        .cnpj-consulta .form-field{flex:1}
        .cnpj-msg{grid-column:1/-1;margin:-5px 0 0;font-size:12px;color:#047857}
        .secao-titulo{grid-column:1/-1;margin:2px 0 -3px;font-size:13px;font-weight:800;color:#0f172a}
        @media(max-width:760px){.cadastro-steps{grid-template-columns:repeat(2,1fr)}.form-grid{grid-template-columns:1fr}.cnpj-consulta{flex-direction:column;align-items:stretch}}


        .header-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
        .btn-import{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#0f172a;color:white;padding:11px 16px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer}
        .btn-import:hover{background:#1e293b}
        .btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px}
        .import-modal{width:min(1180px,96vw)}
        .import-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:18px 24px 0}
        .import-kpi{display:flex;align-items:center;gap:10px;border-radius:13px;padding:13px;border:1px solid #e2e8f0}
        .import-kpi strong{display:block;font-size:19px}.import-kpi span{font-size:11px;color:#64748b}
        .import-kpi.ok{background:#ecfdf5;color:#047857}.import-kpi.warn{background:#fffbeb;color:#b45309}.import-kpi.dup{background:#fff1f2;color:#be123c}
        .import-info{margin:14px 24px;padding:12px 14px;border-radius:12px;background:#eff6ff;color:#1e40af;font-size:12px;line-height:1.55}
        .import-table-wrap{margin:0 24px 18px;border:1px solid #e2e8f0;border-radius:13px;overflow:auto;max-height:390px}
        .import-table{width:100%;border-collapse:collapse;font-size:12px;min-width:900px}
        .import-table th{position:sticky;top:0;background:#f8fafc;color:#64748b;text-align:left;padding:10px 12px;border-bottom:1px solid #e2e8f0}
        .import-table td{padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569}.import-table tr:last-child td{border-bottom:0}
        .badge{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:800}.badge.ok{background:#dcfce7;color:#166534}.badge.warn{background:#fef3c7;color:#92400e}.badge.dup{background:#ffe4e6;color:#9f1239}
        .pendencias{max-width:260px}.btn-primary:disabled{opacity:.45;cursor:not-allowed}
        .filiais-section{grid-column:1/-1;border:1px solid #dbeafe;background:#f8fbff;border-radius:16px;padding:16px}
        .filiais-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
        .filiais-header h3{margin:0;font-size:14px;color:#0f172a}.filiais-header p{margin:4px 0 0;font-size:11px;color:#64748b}
        .filial-editor{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:14px;background:white;border:1px solid #e2e8f0;border-radius:14px}
        .filial-list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
        .filial-item{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e2e8f0;border-radius:12px;padding:11px 12px;background:white}
        .filial-item strong{font-size:13px}.filial-item small{display:block;color:#64748b;margin-top:3px}
        .filial-item-actions{display:flex;gap:6px;align-items:center}.filial-item-actions button{border:0;background:#f8fafc;color:#64748b;border-radius:8px;width:30px;height:30px;cursor:pointer}
        .filial-total{margin-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#475569}
        .filial-total strong{font-size:15px;color:#2563eb}
        .filiais-badge{display:inline-flex;align-items:center;gap:5px;background:#eff6ff;color:#1d4ed8;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:700}
        .ficha-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(3px);display:flex;justify-content:flex-end;z-index:110}
        .ficha-cliente{width:min(760px,96vw);height:100vh;background:#fff;box-shadow:-20px 0 60px rgba(15,23,42,.18);overflow:auto}
        .ficha-topo{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid #e2e8f0;padding:22px 24px}
        .ficha-topo-linha{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
        .ficha-topo h2{margin:0;font-size:22px;color:#0f172a}.ficha-topo p{margin:5px 0 0;color:#64748b;font-size:13px}
        .ficha-abas{display:flex;gap:6px;flex-wrap:wrap;margin-top:18px}.ficha-aba{border:0;cursor:pointer;padding:8px 11px;border-radius:9px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700}.ficha-aba.ativa{background:#eff6ff;color:#2563eb}
        .ficha-conteudo{padding:22px 24px}.ficha-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .ficha-card{border:1px solid #e2e8f0;border-radius:14px;padding:15px;background:#fff}.ficha-card span{display:block;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em}.ficha-card strong{display:block;color:#0f172a;font-size:14px;margin-top:5px}
        .ficha-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:18px}.ficha-kpi{border:1px solid #e2e8f0;border-radius:13px;padding:13px;background:#f8fafc}.ficha-kpi span{font-size:10px;color:#64748b}.ficha-kpi strong{display:block;font-size:20px;color:#0f172a;margin-top:3px}
        .ficha-lista{display:flex;flex-direction:column;gap:9px}.ficha-item{border:1px solid #e2e8f0;border-radius:13px;padding:13px;background:#fff;font:inherit}.ficha-item:hover{border-color:#93c5fd;background:#f8fbff}.ficha-item strong{font-size:13px;color:#0f172a}.ficha-item p{margin:4px 0 0;font-size:11px;color:#64748b}
        .ficha-vazio{border:1px dashed #cbd5e1;border-radius:14px;padding:30px;text-align:center;color:#94a3b8;font-size:13px}
        .ficha-acoes{display:flex;gap:8px;margin-top:16px}
        html.dark .clientes-page .ficha-cliente,html.dark .clientes-page .ficha-topo,html.dark .clientes-page .ficha-card,html.dark .clientes-page .ficha-item{background:#0c1a2f;border-color:rgba(96,165,250,.18)}
        html.dark .clientes-page .ficha-topo h2,html.dark .clientes-page .ficha-card strong,html.dark .clientes-page .ficha-item strong{color:#f8fafc}
        html.dark .clientes-page .ficha-topo p,html.dark .clientes-page .ficha-card span,html.dark .clientes-page .ficha-item p{color:#9fb0c7}
        html.dark .clientes-page .ficha-kpi{background:#10213a;border-color:rgba(96,165,250,.16)}html.dark .clientes-page .ficha-kpi strong{color:#f8fafc}
        html.dark .clientes-page .ficha-aba{background:#13233a;color:#aebdd0}html.dark .clientes-page .ficha-aba.ativa{background:rgba(37,99,235,.18);color:#93c5fd}
        @media(max-width:760px){.ficha-grid,.ficha-kpis{grid-template-columns:1fr 1fr}.ficha-cliente{width:100vw}}


        /* DARK MODE — somente área principal da tela Clientes */
        html.dark .clientes-page{background:#07101f;color:#e5edf8}
        html.dark .clientes-page .clientes-header h1{color:#f8fafc}
        html.dark .clientes-page .subtitulo{color:#9fb0c7}
        html.dark .clientes-page .eyebrow{color:#60a5fa}

        html.dark .clientes-page .metrica-card,
        html.dark .clientes-page .ferramentas-clientes,
        html.dark .clientes-page .clientes-section,
        html.dark .clientes-page .empty-state,
        html.dark .clientes-page .modal,
        html.dark .clientes-page .filial-editor,
        html.dark .clientes-page .filial-item{
          background:#0c1a2f;
          border-color:rgba(96,165,250,.18);
          box-shadow:0 14px 38px rgba(0,0,0,.18)
        }

        html.dark .clientes-page .metrica-card span,
        html.dark .clientes-page .metrica-card small,
        html.dark .clientes-page .subtitulo,
        html.dark .clientes-page .tabela-header,
        html.dark .clientes-page .cliente-identificacao p,
        html.dark .clientes-page .cliente-identificacao small,
        html.dark .clientes-page .cliente-dado span,
        html.dark .clientes-page .filiais-header p,
        html.dark .clientes-page .filial-item small,
        html.dark .clientes-page .import-kpi span{
          color:#9fb0c7
        }

        html.dark .clientes-page .metrica-card strong,
        html.dark .clientes-page .cliente-identificacao h3,
        html.dark .clientes-page .cliente-dado strong,
        html.dark .clientes-page .empty-state h2,
        html.dark .clientes-page .modal-header h2,
        html.dark .clientes-page .filiais-header h3,
        html.dark .clientes-page .filial-item strong{
          color:#f8fafc
        }

        html.dark .clientes-page .search-box,
        html.dark .clientes-page .form-field input,
        html.dark .clientes-page .form-field select{
          background:#09172a;
          border-color:rgba(96,165,250,.22);
          color:#f8fafc
        }

        html.dark .clientes-page .search-box input{
          color:#f8fafc
        }

        html.dark .clientes-page .search-box input::placeholder,
        html.dark .clientes-page .form-field input::placeholder{
          color:#64748b
        }

        html.dark .clientes-page .form-field select option{
          background:#09172a;
          color:#f8fafc
        }

        html.dark .clientes-page .form-field label{color:#cbd5e1}
        html.dark .clientes-page .form-field input:focus,
        html.dark .clientes-page .form-field select:focus{
          border-color:#60a5fa;
          box-shadow:0 0 0 3px rgba(59,130,246,.18)
        }

        html.dark .clientes-page .tabela-header,
        html.dark .clientes-page .modal-footer{
          background:#10213a;
          border-color:rgba(96,165,250,.16)
        }

        html.dark .clientes-page .cliente-row{
          border-color:rgba(96,165,250,.10)
        }
        html.dark .clientes-page .cliente-row:hover{background:#102440}
        html.dark .clientes-page .cliente-row-selecionado{background:rgba(37,99,235,.16)!important}

        html.dark .clientes-page .empresa-icon,
        html.dark .clientes-page .filtro-status.ativo,
        html.dark .clientes-page .filiais-badge{
          background:rgba(37,99,235,.17);
          color:#60a5fa
        }

        html.dark .clientes-page .filtro-status{
          background:#13233a;
          color:#aebdd0
        }
        html.dark .clientes-page .filtro-status:hover{background:#18304f}
        html.dark .clientes-page .cliente-dado.destaque strong,
        html.dark .clientes-page .filial-total strong{color:#60a5fa}

        html.dark .clientes-page .status-pill{
          background:#13233a;
          color:#cbd5e1
        }
        html.dark .clientes-page .status-analisado{
          background:rgba(37,99,235,.18);
          color:#93c5fd
        }
        html.dark .clientes-page .status-em-negociação{
          background:rgba(245,158,11,.16);
          color:#fbbf24
        }
        html.dark .clientes-page .status-reajustado{
          background:rgba(16,185,129,.16);
          color:#34d399
        }

        html.dark .clientes-page .cliente-acoes button,
        html.dark .clientes-page .btn-close,
        html.dark .clientes-page .filial-item-actions button{
          background:#13233a;
          color:#9fb0c7
        }
        html.dark .clientes-page .cliente-acoes button:hover,
        html.dark .clientes-page .btn-close:hover,
        html.dark .clientes-page .filial-item-actions button:hover{
          background:#18304f;
          color:#60a5fa
        }

        html.dark .clientes-page .btn-secondary{
          background:#10213a;
          border-color:rgba(96,165,250,.22);
          color:#dbeafe
        }
        html.dark .clientes-page .btn-secondary:hover{background:#18304f}

        html.dark .clientes-page .acao-lote,
        html.dark .clientes-page .import-info{
          background:rgba(37,99,235,.15);
          border-color:rgba(96,165,250,.22);
          color:#bfdbfe
        }

        html.dark .clientes-page .empty-state{color:#8294ad}
        html.dark .clientes-page .empty-state svg{color:#52657f}

        html.dark .clientes-page .modal-overlay{
          background:rgba(2,6,23,.76)
        }
        html.dark .clientes-page .modal-header{
          border-color:rgba(96,165,250,.16)
        }
        html.dark .clientes-page .modal-header p{color:#9fb0c7}

        html.dark .clientes-page .filiais-section{
          background:#09172a;
          border-color:rgba(96,165,250,.22)
        }
        html.dark .clientes-page .filial-total{color:#b8c6d9}

        html.dark .clientes-page .import-kpi{
          border-color:rgba(96,165,250,.16)
        }
        html.dark .clientes-page .import-kpi.ok{
          background:rgba(16,185,129,.14);
          color:#34d399
        }
        html.dark .clientes-page .import-kpi.warn{
          background:rgba(245,158,11,.14);
          color:#fbbf24
        }
        html.dark .clientes-page .import-kpi.dup{
          background:rgba(244,63,94,.14);
          color:#fb7185
        }

        html.dark .clientes-page .import-table-wrap{
          border-color:rgba(96,165,250,.16)
        }
        html.dark .clientes-page .import-table th{
          background:#10213a;
          color:#9fb0c7;
          border-color:rgba(96,165,250,.14)
        }
        html.dark .clientes-page .import-table td{
          background:#0c1a2f;
          color:#cbd5e1;
          border-color:rgba(96,165,250,.10)
        }

        html.dark .clientes-page .badge.ok{
          background:rgba(16,185,129,.16);
          color:#6ee7b7
        }
        html.dark .clientes-page .badge.warn{
          background:rgba(245,158,11,.16);
          color:#fcd34d
        }
        html.dark .clientes-page .badge.dup{
          background:rgba(244,63,94,.16);
          color:#fda4af
        }

        html.dark .clientes-page input[type="checkbox"]{
          accent-color:#2563eb
        }

        @media(max-width:1180px){.metricas-clientes{grid-template-columns:repeat(2,1fr)}.cliente-row{grid-template-columns:28px 1.6fr .8fr .8fr .8fr 70px}.cliente-row .cliente-dado:nth-of-type(4),.cliente-row .cliente-dado:nth-of-type(5),.cliente-status{display:none}}
        @media(max-width:760px){.filial-editor{grid-template-columns:1fr}.header-actions{width:100%}.header-actions>*{flex:1}.import-summary{grid-template-columns:1fr}.clientes-page{padding:20px 14px}.clientes-header{align-items:stretch;flex-direction:column}.metricas-clientes{grid-template-columns:1fr}.ferramentas-clientes{align-items:stretch;flex-direction:column}.search-box{min-width:0}.form-grid{grid-template-columns:1fr}.cliente-row{grid-template-columns:28px 1fr 70px}.cliente-row .cliente-dado,.cliente-status{display:none}}
      `}</style>
      <div className="clientes-container">
        <header className="clientes-header">
          <div>
            <p className="eyebrow">PRECIFICACONT</p>

            <h1>Clientes</h1>

            <p className="subtitulo">
              Gestão da carteira e reprecificação dos honorários.
            </p>
          </div>

          <div className="header-actions">
            <button className="btn-secondary" onClick={baixarModelo}>
              <Download size={17} />
              Baixar modelo Excel
            </button>

            {permissoesModulo.pode_criar ? (
              <>
            <label className="btn-import">
              <Upload size={17} />
              Importar carteira
              <input
                type="text"
                accept=".xlsx,.xls,.csv"
                onChange={lerArquivo}
                style={{ display: "none" }}
              />
            </label>

            <button
              className="btn-primary"
              onClick={() => {
                  setForm(clienteVazio);
                  setHonorarioAtualTela("");
                  setFaturamentoMedioTela("");
                  setClienteEditandoId(null);
                  setFilialAtual(filialVazia);
                  setEditandoFilial(false);
                  setEtapaCadastro(1);
                  setMensagemCnpj("");
                  setModalAberto(true);
                }}
            >
              <Plus size={18} />
              Novo cliente
            </button>
              </>
            ) : null}
          </div>
        </header>

        <section className="metricas-clientes">
          <div className="metrica-card">
            <div className="metrica-icon azul">
              <Users size={20} />
            </div>

            <div>
              <span>Clientes</span>
              <strong>{metricas.total}</strong>
            </div>
          </div>

          <div className="metrica-card">
            <div className="metrica-icon verde">
              <Calculator size={20} />
            </div>

            <div>
              <span>Analisados</span>
              <strong>{metricas.analisados}</strong>
            </div>
          </div>

          <div className="metrica-card">
            <div className="metrica-icon roxo">
              <CircleDollarSign size={20} />
            </div>

            <div>
              <span>Honorários atuais</span>
              <strong>{formatBRL(metricas.honorarioAtual)}</strong>
            </div>
          </div>

          <div className="metrica-card">
            <div className="metrica-icon laranja">
              <TrendingUp size={20} />
            </div>

            <div>
              <span>Potencial de reajuste</span>

              <strong
                className={
                  metricas.potencial > 0
                    ? "valor-positivo"
                    : ""
                }
              >
                {formatBRL(metricas.potencial)}
              </strong>

              <small>
                {metricas.percentual.toFixed(1)}% da carteira
              </small>
            </div>
          </div>

          <div className="metrica-card">
            <div className="metrica-icon azul">
              <Building2 size={20} />
            </div>
            <div>
              <span>Filiais</span>
              <strong>{metricas.totalFiliais}</strong>
              <small>Referência: {formatBRL(metricas.valorFiliais)}</small>
            </div>
          </div>
        </section>

        <div className="ferramentas-clientes">
          <div className="search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
              value={busca}
              onChange={(e) => setFilialAtual((atual) => ({ ...atual, cnpj: somenteDigitos(e.target.value).slice(0, 14) }))}
            />
          </div>

          <div className="filtros-status">
            {[
              "Todos",
              STATUS.PENDENTE,
              STATUS.ANALISADO,
              STATUS.NEGOCIACAO,
              STATUS.REAJUSTADO,
            ].map((status) => (
              <button
                key={status}
                className={
                  statusFiltro === status
                    ? "filtro-status ativo"
                    : "filtro-status"
                }
                onClick={() => setStatusFiltro(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {permissoesModulo.pode_editar && selecionados.length > 0 && (
          <div className="acao-lote">
            <div>
              <strong>{selecionados.length}</strong>{" "}
              cliente(s) selecionado(s)
            </div>

            <button
              className="btn-primary"
              onClick={recalcularSelecionados}
            >
              <RefreshCw size={17} />
              Recalcular selecionados
            </button>
          </div>
        )}

        {clientesFiltrados.length === 0 ? (
          <div className="empty-state">
            <Users size={52} />

            <h2>
              {clientes.length === 0
                ? "Nenhum cliente cadastrado"
                : "Nenhum cliente encontrado"}
            </h2>

            <p>
              {clientes.length === 0
                ? "Cadastre seu primeiro cliente para começar."
                : "Tente realizar outra busca ou alterar o filtro."}
            </p>

            {clientes.length === 0 && (
              <button
                className="btn-primary"
                onClick={() => {
                  if (!permissoesModulo.pode_criar) {
                    negarAcao("Seu perfil não possui permissão para cadastrar clientes.");
                    return;
                  }
                  setForm(clienteVazio);
                  setClienteEditandoId(null);
                  setFilialAtual(filialVazia);
                  setEditandoFilial(false);
                  setEtapaCadastro(1);
                  setMensagemCnpj("");
                  setModalAberto(true);
                }}
              >
                <Plus size={18} />
                Cadastrar primeiro cliente
              </button>
            )}
          </div>
        ) : (
          <div className="clientes-section">
            <div className="tabela-header">
              <label className="checkbox-container">
                <input
                  type="text"
                  checked={
                    clientesFiltrados.length > 0 &&
                    selecionados.length ===
                      clientesFiltrados.length
                  }
                  onChange={selecionarTodos}
                />

                <span>
                  Selecionar todos
                </span>
              </label>

              <span>
                {clientesFiltrados.length} cliente(s)
              </span>
            </div>

            <div className="clientes-lista">
              {clientesFiltrados.map((cliente) => {
                const atual = Number(
                  cliente.honorario_atual || 0
                );

                const recomendado = Number(
                  cliente.honorario_recomendado || 0
                );

                const diferenca = recomendado - atual;

                const percentual =
                  calcularPercentual(
                    atual,
                    recomendado
                  );

                const selecionado =
                  selecionados.includes(cliente.id);

                const status =
                  cliente.status_reprecificacao ||
                  STATUS.PENDENTE;

                return (
                  <article
                    className={`cliente-row ${
                      selecionado
                        ? "cliente-row-selecionado"
                        : ""
                    }`}
                    key={cliente.id}
                    onClick={() => abrirFichaCliente(cliente)}
                    role="button"
                    tabIndex={0}
                    title="Abrir cadastro do cliente"
                    style={{ cursor: "pointer" }}
                  >
                    <div className="cliente-checkbox">
                      <input
                        type="text"
                        checked={selecionado}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() =>
                          alternarSelecionado(cliente.id)
                        }
                      />
                    </div>

                    <div className="cliente-identificacao">
                      <div className="empresa-icon">
                        <Building2 size={21} />
                      </div>

                      <div>
                        <h3>
                          {cliente.razao_social}
                        </h3>

                        <p>
                          {cliente.nome_fantasia ||
                            "Sem nome fantasia"}
                        </p>

                        <small>
                          {cliente.cnpj ||
                            "CNPJ não informado"}
                        </small>
                      </div>
                    </div>

                    <div className="cliente-dado">
                      <span>Regime</span>
                      <strong>{cliente.regime}</strong>
                    </div>

                    <div className="cliente-dado">
                      <span>Faturamento</span>
                      <strong>
                        {formatBRL(
                          cliente.faturamento_medio
                        )}
                      </strong>
                    </div>

                    <div className="cliente-dado">
                      <span>Atual</span>
                      <strong>
                        {formatBRL(atual)}
                      </strong>
                    </div>

                    <div className="cliente-dado destaque">
                      <span>Recomendado</span>
                      <strong>
                        {formatBRL(recomendado)}
                      </strong>

                      {percentual !== 0 && (
                        <small
                          className={
                            percentual > 0
                              ? "percentual-alta"
                              : "percentual-baixa"
                          }
                        >
                          {percentual > 0
                            ? "+"
                            : ""}
                          {percentual.toFixed(1)}%
                        </small>
                      )}
                    </div>

                    <div className="cliente-dado">
                      <span>Potencial</span>

                      <strong
                        className={
                          diferenca > 0
                            ? "valor-positivo"
                            : ""
                        }
                      >
                        {formatBRL(diferenca)}
                      </strong>
                    </div>

                    <div className="cliente-dado">
                      <span>Filiais</span>
                      <strong>
                        {Array.isArray(cliente.filiais_detalhadas)
                          ? cliente.filiais_detalhadas.length
                          : Number(cliente.filiais || 0)}
                      </strong>
                    </div>

                    <div className="cliente-status">
                      <span
                        className={`status-pill status-${status
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="cliente-acoes" onClick={(e) => e.stopPropagation()}>
                      {permissoesModulo.pode_editar ? (
                        <>
                      <button
                        title="Recalcular"
                        onClick={() =>
                          recalcularCliente(
                            cliente.id
                          )
                        }
                      >
                        <RefreshCw size={16} />
                      </button>

                      {status === STATUS.ANALISADO && (
                        <button
                          title="Enviar para negociação"
                          onClick={() =>
                            marcarComoNegociacao(
                              cliente.id
                            )
                          }
                        >
                          <ChevronRight size={17} />
                        </button>
                      )}

                      {status === STATUS.NEGOCIACAO && (
                        <button
                          title="Marcar como reajustado"
                          onClick={() =>
                            marcarComoReajustado(
                              cliente.id
                            )
                          }
                        >
                          <CheckCircle2 size={17} />
                        </button>
                      )}
                        </>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {importModal && (
        <div className="modal-overlay">
          <div className="modal import-modal">
            <div className="modal-header">
              <div>
                <h2>Importar carteira de clientes</h2>
                <p>{nomeArquivo} • revise os dados antes de confirmar.</p>
              </div>
              <button className="btn-close" onClick={() => setImportModal(false)}>
                <X size={22} />
              </button>
            </div>

            <div className="import-summary">
              <div className="import-kpi ok"><CheckCircle2 size={18}/><div><strong>{qtdValidos}</strong><span>Prontos</span></div></div>
              <div className="import-kpi warn"><AlertTriangle size={18}/><div><strong>{qtdIncompletos}</strong><span>Incompletos</span></div></div>
              <div className="import-kpi dup"><FileSpreadsheet size={18}/><div><strong>{qtdDuplicados}</strong><span>Duplicados</span></div></div>
            </div>

            <div className="import-info">
              <strong>Obrigatórios:</strong> Razão Social, CNPJ, Regime Tributário, Atividade Principal, UF,
              Faturamento Médio Mensal, Honorário Atual, Colaboradores, Documentos de Saída e Documentos de Entrada.
            </div>

            <div className="import-table-wrap">
              <table className="import-table">
                <thead>
                  <tr>
                    <th>Status</th><th>Cliente</th><th>CNPJ</th><th>Regime</th>
                    <th>Faturamento</th><th>Honorário atual</th><th>Filiais</th><th>Pendências</th>
                  </tr>
                </thead>
                <tbody>
                  {importacao.map((item, i) => (
                    <tr key={i}>
                      <td>
                        {item.duplicado ? <span className="badge dup">Duplicado</span> :
                         item.faltantes.length ? <span className="badge warn">Incompleto</span> :
                         <span className="badge ok">Pronto</span>}
                      </td>
                      <td><strong>{item.cliente.razao_social || "—"}</strong></td>
                      <td>{item.cliente.cnpj || "—"}</td>
                      <td>{item.cliente.regime || "—"}</td>
                      <td>{formatBRL(item.cliente.faturamento_medio)}</td>
                      <td>{formatBRL(item.cliente.honorario_atual)}</td>
                      <td>{item.cliente.filiais_detalhadas?.length || item.cliente.filiais || 0}</td>
                      <td className="pendencias">
                        {item.duplicado ? "CNPJ já cadastrado" :
                         item.faltantes.length ? item.faltantes.join(", ") : "Tudo certo"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setImportModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={confirmarImportacao} disabled={!qtdValidos}>
                <Upload size={17}/> Importar {qtdValidos} cliente(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {fichaCliente && (() => {
        const cliente = fichaCliente.cliente;
        const rel = fichaCliente.relacionamentos || {
          simulacoes: [],
          propostas: [],
          reprecificacoes: [],
          crm: [],
        };

        const abas = [
          ["resumo", "Resumo"],
          ["simulacoes", `Simulações (${rel.simulacoes.length})`],
          ["propostas", `Propostas (${rel.propostas.length})`],
          ["reprecificacao", `Reprecificação (${rel.reprecificacoes.length})`],
          ["crm", `CRM (${rel.crm.length})`],
        ];

        const listaAtual =
          abaFicha === "simulacoes" ? rel.simulacoes :
          abaFicha === "propostas" ? rel.propostas :
          abaFicha === "reprecificacao" ? rel.reprecificacoes :
          abaFicha === "crm" ? rel.crm : [];

        return (
          <div className="ficha-overlay" onClick={() => setFichaCliente(null)}>
            <aside className="ficha-cliente" onClick={(e) => e.stopPropagation()}>
              <div className="ficha-topo">
                <div className="ficha-topo-linha">
                  <div>
                    <p className="eyebrow">FICHA DO CLIENTE</p>
                    <h2>{cliente.razao_social || "Cliente"}</h2>
                    <p>
                      {cliente.nome_fantasia || "Sem nome fantasia"}
                      {cliente.cnpj ? ` • ${mascaraCpfCnpj(cliente.cnpj)}` : ""}
                    </p>
                  </div>
                  <button type="text" className="btn-close" onClick={() => setFichaCliente(null)}>
                    <X size={18} />
                  </button>
                </div>

                <div className="ficha-abas">
                  {abas.map(([id, label]) => (
                    <button
                      key={id}
                      type="text"
                      className={`ficha-aba ${abaFicha === id ? "ativa" : ""}`}
                      onClick={() => setAbaFicha(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ficha-conteudo">
                {abaFicha === "resumo" ? (
                  <>
                    <div className="ficha-kpis">
                      <div className="ficha-kpi"><span>Simulações</span><strong>{rel.simulacoes.length}</strong></div>
                      <div className="ficha-kpi"><span>Propostas</span><strong>{rel.propostas.length}</strong></div>
                      <div className="ficha-kpi"><span>Reprecificações</span><strong>{rel.reprecificacoes.length}</strong></div>
                      <div className="ficha-kpi"><span>CRM</span><strong>{rel.crm.length}</strong></div>
                    </div>

                    <div className="ficha-grid">
                      <div className="ficha-card"><span>Regime tributário</span><strong>{cliente.regime || "—"}</strong></div>
                      <div className="ficha-card"><span>Atividade</span><strong>{cliente.atividade || "—"}</strong></div>
                      <div className="ficha-card"><span>Faturamento médio</span><strong>{formatBRL(cliente.faturamento_medio)}</strong></div>
                      <div className="ficha-card"><span>Honorário atual</span><strong>{formatBRL(cliente.honorario_atual)}</strong></div>
                      <div className="ficha-card"><span>Índice PrecificaCont</span><strong>{formatBRL(cliente.honorario_recomendado)}</strong></div>
                      <div className="ficha-card"><span>Colaboradores</span><strong>{Number(cliente.colaboradores || 0)}</strong></div>
                      <div className="ficha-card"><span>Responsável</span><strong>{cliente.responsavel || "—"}</strong></div>
                      <div className="ficha-card"><span>Contato</span><strong>{cliente.telefone ? mascaraTelefoneBR(cliente.telefone) : cliente.email || "—"}</strong></div>
                    </div>

                    {permissoesModulo.pode_editar ? (
                    <div className="ficha-acoes">
                      <button
                        type="text"
                        className="btn-primary"
                        onClick={() => {
                          setFichaCliente(null);
                          abrirClienteExistente(cliente);
                        }}
                      >
                        Editar cadastro
                      </button>
                      <button
                        type="text"
                        className="btn-secondary"
                        onClick={() => {
                          recalcularCliente(cliente.id);
                          const recomendado = calcularRecomendado(cliente);
                          setFichaCliente((atual) =>
                            atual ? {
                              ...atual,
                              cliente: { ...atual.cliente, honorario_recomendado: recomendado },
                            } : atual
                          );
                        }}
                      >
                        <RefreshCw size={16} />
                        Recalcular
                      </button>
                    </div>
                    ) : null}
                  </>
                ) : listaAtual.length ? (
                  <div className="ficha-lista">
                    {listaAtual.map((item, index) => (
                      <button
                        type="text"
                        className="ficha-item"
                        key={item.id || index}
                        onClick={() => abrirRegistroRelacionado(abaFicha, item, cliente)}
                        style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
                        title="Abrir registro"
                      >
                        <strong>
                          {item.numero_proposta || item.numero || item.titulo || item.etapa || item.status || `Registro ${index + 1}`}
                        </strong>
                        <p>
                          {item.created_date || item.created_at || item.data || item.updated_date || "Registro relacionado ao cliente"}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="ficha-vazio">
                    Nenhum registro relacionado encontrado nesta área.
                  </div>
                )}
              </div>
            </aside>
          </div>
        );
      })()}

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>{clienteEditandoId ? "Editar cliente" : "Novo cliente"}</h2>
                <p>
                  {etapaCadastro === 1 && "Identificação e consulta cadastral."}
                  {etapaCadastro === 2 && "Endereço cadastral do cliente."}
                  {etapaCadastro === 3 && "Responsável e dados de contato."}
                  {etapaCadastro === 4 && "Dados para precificação e reprecificação."}
                </p>
              </div>
              <button className="btn-close" onClick={() => setModalAberto(false)}>
                <X size={22} />
              </button>
            </div>

            <div className="cadastro-steps">
              {[
                [1, "Identificação"],
                [2, "Endereço"],
                [3, "Contato"],
                [4, "Precificação"],
              ].map(([numero, titulo]) => (
                <button
                  type="button"
                  key={numero}
                  className={`cadastro-step ${etapaCadastro === numero ? "ativo" : ""}`}
                  onClick={() => setEtapaCadastro(numero)}
                >
                  <span>{numero}</span>{titulo}
                </button>
              ))}
            </div>

            <form onSubmit={cadastrarCliente}>
              <div className="form-grid">
                {etapaCadastro === 1 && (
                  <>
                    <div className="cnpj-consulta">
                      <Campo
                        label="CNPJ / CPF *"
                        value={mascaraCpfCnpj(form.cnpj)}
                        inputMode="numeric"
                        onChange={(v) => {
                          alterarCampo("cnpj", somenteDigitos(v).slice(0, 14));
                          setMensagemCnpj("");
                        }}
                      />
                      {somenteDigitos(form.cnpj).length === 14 && (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={consultarCnpjOpenCnpj}
                          disabled={consultandoCnpj}
                        >
                          <Search size={16} />
                          {consultandoCnpj ? "Consultando..." : "Buscar CNPJ"}
                        </button>
                      )}
                    </div>
                    {mensagemCnpj && <div className="cnpj-msg">{mensagemCnpj}</div>}

                    <Campo label="Razão social *" value={form.razao_social}
                      onChange={(v) => alterarCampo("razao_social", v)} />
                    <Campo label="Nome fantasia" value={form.nome_fantasia}
                      onChange={(v) => alterarCampo("nome_fantasia", v)} />
                    <Campo label="Situação cadastral" value={form.situacao_cadastral}
                      onChange={(v) => alterarCampo("situacao_cadastral", v)} />
                    <Campo label="Data de abertura" value={form.data_abertura}
                      onChange={(v) => alterarCampo("data_abertura", v)} />
                    <Campo label="Natureza jurídica" value={form.natureza_juridica}
                      onChange={(v) => alterarCampo("natureza_juridica", v)} />
                    <Campo label="Porte" value={form.porte}
                      onChange={(v) => alterarCampo("porte", v)} />
                    <Campo label="CNAE principal" value={form.cnae_principal}
                      onChange={(v) => alterarCampo("cnae_principal", v)} />
                    <Campo label="Descrição do CNAE" value={form.cnae_principal_descricao}
                      onChange={(v) => alterarCampo("cnae_principal_descricao", v)} />
                  </>
                )}

                {etapaCadastro === 2 && (
                  <>
                    <Campo label="CEP" value={form.cep}
                      onChange={(v) => alterarCampo("cep", somenteDigitos(v).slice(0, 8))} />
                    <Campo label="Logradouro" value={form.logradouro}
                      onChange={(v) => alterarCampo("logradouro", v)} />
                    <Campo label="Número" value={form.numero}
                      onChange={(v) => alterarCampo("numero", v)} />
                    <Campo label="Complemento" value={form.complemento}
                      onChange={(v) => alterarCampo("complemento", v)} />
                    <Campo label="Bairro" value={form.bairro}
                      onChange={(v) => alterarCampo("bairro", v)} />
                    <Campo label="Cidade" value={form.municipio}
                      onChange={(v) => alterarCampo("municipio", v)} />
                    <Campo label="UF" value={form.endereco_uf || form.uf}
                      onChange={(v) => {
                        alterarCampo("endereco_uf", v.toUpperCase().slice(0,2));
                        alterarCampo("uf", v.toUpperCase().slice(0,2));
                      }} />
                  </>
                )}

                {etapaCadastro === 3 && (
                  <>
                    <Campo label="Responsável" value={form.responsavel}
                      onChange={(v) => alterarCampo("responsavel", v)} />
                    <Campo label="Telefone / WhatsApp" value={mascaraTelefoneBR(form.telefone)}
                      inputMode="numeric"
                      onChange={(v) => alterarCampo("telefone", somenteDigitos(v).slice(0,11))} />
                    <Campo label="E-mail" value={form.email}
                      onChange={(v) => alterarCampo("email", v)} />
                    <Campo label="Telefone cadastral" value={form.telefone_cadastral}
                      onChange={(v) => alterarCampo("telefone_cadastral", v)} />
                    <Campo label="E-mail cadastral" value={form.email_cadastral}
                      onChange={(v) => alterarCampo("email_cadastral", v)} />
                  </>
                )}

                {etapaCadastro === 4 && (
                  <>
                    <div className="form-field">
                      <label>Regime tributário</label>
                      <select value={form.regime} onChange={(e) => alterarCampo("regime", e.target.value)}>
                        <option>MEI</option><option>Simples Nacional</option>
                        <option>Lucro Presumido</option><option>Lucro Real</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Atividade</label>
                      <select value={form.atividade} onChange={(e) => alterarCampo("atividade", e.target.value)}>
                        <option>Serviços</option><option>Comércio</option>
                        <option>Indústria</option><option>Serviços + Comércio</option>
                      </select>
                    </div>
                    <Campo label="Faturamento médio mensal" inputMode="numeric"
                      value={faturamentoMedioTela}
                      onChange={(v) => {
                        setFaturamentoMedioTela(moedaBRInput(v));
                        alterarCampo("faturamento_medio", valorMoedaBR(v));
                      }} />
                    <Campo label="Colaboradores" value={form.colaboradores}
                      onChange={(v) => alterarCampo("colaboradores", v)} />
                    <Campo label="Docs. saída/mês" value={form.notas_saida}
                      onChange={(v) => alterarCampo("notas_saida", v)} />
                    <Campo label="Docs. entrada/mês" value={form.notas_entrada}
                      onChange={(v) => alterarCampo("notas_entrada", v)} />
                    <Campo label="Outros documentos/mês" value={form.outros_documentos}
                      onChange={(v) => alterarCampo("outros_documentos", v)} />
                    <Campo label="Contas bancárias" value={form.contas_bancarias}
                      onChange={(v) => alterarCampo("contas_bancarias", v)} />
                    <Campo label="Honorário atual" inputMode="numeric"
                      value={honorarioAtualTela}
                      onChange={(v) => {
                        setHonorarioAtualTela(moedaBRInput(v));
                        alterarCampo("honorario_atual", valorMoedaBR(v));
                      }} />
                    <Campo
                      label="Honorário recomendado"
                      value={formatBRL(calcularRecomendado({
                        ...form,
                        faturamento_medio: Number(form.faturamento_medio) || 0,
                        colaboradores: Number(form.colaboradores) || 0,
                        filiais: (form.filiais_detalhadas || []).length,
                        filiais_detalhadas: form.filiais_detalhadas || [],
                        honorario_atual: Number(form.honorario_atual) || 0,
                      }))}
                      readOnly
                    />

                    <div className="filiais-section">
                      <div className="filiais-header">
                        <div><h3>Filiais individualizadas</h3>
                          <p>Centralizada = 50% da referência; descentralizada = 100%.</p></div>
                        <span className="filiais-badge">{form.filiais_detalhadas.length} filial(is)</span>
                      </div>
                      <div className="filial-editor">
                        <Campo label="Nome / identificação da filial" value={filialAtual.nome}
                          onChange={(v) => alterarFilialAtual("nome", v)} />
                        <Campo label="CNPJ da filial" value={mascaraCpfCnpj(filialAtual.cnpj)}
                          onChange={(v) => alterarFilialAtual("cnpj", v)} />
                        <Campo label="UF" value={filialAtual.uf}
                          onChange={(v) => alterarFilialAtual("uf", v.toUpperCase())} />
                        <div className="form-field"><label>Regime tributário</label>
                          <select value={filialAtual.regime} onChange={(e) => alterarFilialAtual("regime", e.target.value)}>
                            <option>MEI</option><option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option>
                          </select></div>
                        <div className="form-field"><label>Atividade</label>
                          <select value={filialAtual.atividade} onChange={(e) => alterarFilialAtual("atividade", e.target.value)}>
                            <option>Serviços</option><option>Comércio</option><option>Indústria</option><option>Serviços + Comércio</option>
                          </select></div>
                        <Campo label="Faturamento médio mensal" type="number" value={filialAtual.faturamento_medio}
                          onChange={(v) => alterarFilialAtual("faturamento_medio", v)} />
                        <Campo label="Colaboradores" type="number" value={filialAtual.colaboradores}
                          onChange={(v) => alterarFilialAtual("colaboradores", v)} />
                        <Campo label="Docs. saída/mês" type="number" value={filialAtual.notas_saida}
                          onChange={(v) => alterarFilialAtual("notas_saida", v)} />
                        <Campo label="Docs. entrada/mês" type="number" value={filialAtual.notas_entrada}
                          onChange={(v) => alterarFilialAtual("notas_entrada", v)} />
                        <div className="form-field"><label>Modelo de cobrança</label>
                          <select value={filialAtual.modelo_cobranca} onChange={(e) => {
                            const modelo=e.target.value;
                            setFilialAtual(a=>({...a,modelo_cobranca:modelo,percentual_cobranca:modelo==="centralizada"?50:100}));
                          }}>
                            <option value="centralizada">Centralizada — 50%</option>
                            <option value="descentralizada">Descentralizada — 100%</option>
                          </select></div>
                        <div className="form-field"><label>Valor de referência</label>
                          <input value={formatBRL(calcularValorReferenciaFilial(form, filialAtual))} readOnly /></div>
                        <div style={{gridColumn:"1/-1",display:"flex",gap:8,justifyContent:"flex-end"}}>
                          {editandoFilial && <button type="button" className="btn-secondary" onClick={cancelarEdicaoFilial}>Cancelar edição</button>}
                          <button type="button" className="btn-primary" onClick={adicionarFilial}>
                            <Plus size={16}/>{editandoFilial?"Atualizar filial":"Adicionar filial"}
                          </button>
                        </div>
                      </div>
                      {form.filiais_detalhadas.length>0 && (
                        <div className="filial-list">
                          {form.filiais_detalhadas.map((filial,index)=>(
                            <div className="filial-item" key={filial.id||index}>
                              <div><strong>{filial.nome||`Filial ${index+1}`}</strong>
                                <small>{filial.uf||"UF não informada"} • {filial.regime} • {filial.atividade}</small></div>
                              <div className="filial-item-actions">
                                <span className="filiais-badge">{formatBRL(filial.valor_referencia||0)}</span>
                                <button type="button" onClick={()=>editarFilial(filial)}><RefreshCw size={14}/></button>
                                <button type="button" onClick={()=>removerFilial(filial.id)}><X size={14}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer" style={{justifyContent:"space-between"}}>
                <div>
                  {etapaCadastro > 1 && (
                    <button type="button" className="btn-secondary" onClick={() => setEtapaCadastro((n) => n - 1)}>
                      Voltar
                    </button>
                  )}
                </div>
                <div style={{display:"flex",gap:9}}>
                  <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
                  {etapaCadastro < 4 ? (
                    <button type="button" className="btn-primary" onClick={() => setEtapaCadastro((n) => n + 1)}>
                      Continuar <ChevronRight size={16}/>
                    </button>
                  ) : (
                    <button type="submit" className="btn-primary">
                      {clienteEditandoId ? "Salvar alterações" : "Cadastrar cliente"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({
  label,
  value,
  onChange = () => {},
  type = "text",
  inputMode,
  readOnly = false,
}) {
  return (
    <div className="form-field">
      <label>{label}</label>

      <input
        type={type}
        inputMode={inputMode}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}