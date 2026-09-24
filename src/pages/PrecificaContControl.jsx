import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  ExternalLink,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  Loader2,
  LogOut,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Trash2,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "../supabase";

const moeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const valorBRLInput = (valor) => {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  if (!digitos) return "";
  return (Number(digitos) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const numeroBRLInput = (valor) => {
  if (typeof valor === "number") return valor;
  const texto = String(valor ?? "").trim();
  if (!texto) return 0;
  if (/^\d+(\.\d+)?$/.test(texto)) return Number(texto);
  return Number(texto.replace(/\./g, "").replace(",", ".")) || 0;
};

const formatarCNPJ = (valor) => {
  const limpo = String(valor ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 14);
  if (!/^\d{0,14}$/.test(limpo)) return limpo;
  return limpo
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const somenteDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");

const validarCPF = (valor) => {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calcular = (tamanho) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i += 1) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcular(9) === Number(cpf[9]) && calcular(10) === Number(cpf[10]);
};

const formatarCPF = (valor) => {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const normalizarDocumento = (valor, tipo) =>
  tipo === "cpf" ? somenteDigitos(valor) : String(valor ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const formatarDocumento = (valor, tipo) => tipo === "cpf" ? formatarCPF(valor) : formatarCNPJ(valor);

const formatarTelefone = (ddd, numero) => {
  const d = String(ddd || "").replace(/\D/g, "");
  const n = String(numero || "").replace(/\D/g, "");
  if (!d && !n) return "";
  return [d ? `(${d})` : "", n].filter(Boolean).join(" ");
};

const separarTelefoneCadastro = (valor) => {
  let digitos = somenteDigitos(valor);
  if (digitos.length > 11 && digitos.startsWith("55")) digitos = digitos.slice(2);
  return {
    ddd: digitos.slice(0, 2),
    numero: digitos.slice(2, 11),
  };
};

const formatarNumeroTelefone = (valor) => {
  const digitos = somenteDigitos(valor).slice(0, 9);
  if (digitos.length <= 4) return digitos;
  if (digitos.length <= 8) {
    return digitos.replace(/^(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digitos.replace(/^(\d{5})(\d{1,4})$/, "$1-$2");
};

const montarTelefoneCadastro = (ddd, numero) => {
  const d = somenteDigitos(ddd).slice(0, 2);
  const n = somenteDigitos(numero).slice(0, 9);
  if (!d && !n) return "";
  if (!d) return formatarNumeroTelefone(n);
  if (!n) return `(${d})`;
  return `(${d}) ${formatarNumeroTelefone(n)}`;
};

const dataBR = (valor) => {
  if (!valor) return "—";
  const texto = String(valor).slice(0, 10);
  const data = new Date(`${texto}T12:00:00`);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
};

const hojeISO = () => new Date().toISOString().slice(0, 10);

const statusClasses = {
  ativo: "bg-emerald-50 text-emerald-700",
  teste: "bg-blue-50 text-blue-700",
  inativo: "bg-slate-100 text-slate-600",
  suspenso: "bg-amber-50 text-amber-700",
  inadimplente: "bg-rose-50 text-rose-700",
  cancelado: "bg-rose-50 text-rose-700",
};

const saudeClasses = {
  saudavel: "bg-emerald-50 text-emerald-700",
  atencao: "bg-amber-50 text-amber-700",
  risco: "bg-rose-50 text-rose-700",
  sem_dados: "bg-slate-100 text-slate-500",
};

const MENU = [
  { id: "dashboard", label: "Dashboard", Icone: LayoutDashboard },
  { id: "clientes", label: "Clientes", Icone: Building2 },
  { id: "bi", label: "BI & Relatórios", Icone: BarChart3 },
  { id: "financeiro", label: "Financeiro", Icone: WalletCards },
  { id: "equipe", label: "Equipe PrecificaCont", Icone: Users },
  { id: "configuracoes", label: "Configurações", Icone: Settings },
];

function CardKPI({ titulo, valor, detalhe, Icone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {titulo}
        </p>
        {Icone ? <Icone size={17} className="text-blue-600" /> : null}
      </div>
      <p className="mt-3 text-2xl font-black text-slate-950">{valor}</p>
      {detalhe ? <p className="mt-1 text-xs text-slate-400">{detalhe}</p> : null}
    </div>
  );
}

function Badge({ children, tipo = "inativo" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
        statusClasses[tipo] || saudeClasses[tipo] || statusClasses.inativo
      }`}
    >
      {children}
    </span>
  );
}

function exportarXLSX(nomeArquivo, nomeAba, linhas, larguras = []) {
  if (!linhas?.length) return false;
  const ws = XLSX.utils.json_to_sheet(linhas);
  if (larguras.length) ws["!cols"] = larguras.map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nomeAba.slice(0, 31));
  XLSX.writeFile(wb, `${nomeArquivo}-${hojeISO()}.xlsx`);
  return true;
}

export default function PrecificaContControl({ sessao }) {
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [perfilPlataforma, setPerfilPlataforma] = useState(null);
  const [pagina, setPagina] = useState("dashboard");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [saindo, setSaindo] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [escritorioSelecionado, setEscritorioSelecionado] = useState(null);
  const [editandoEscritorio, setEditandoEscritorio] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);
  const [modalCobranca, setModalCobranca] = useState(false);
  const [modalEquipe, setModalEquipe] = useState(false);

  const [escritorios, setEscritorios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosPlataforma, setUsuariosPlataforma] = useState([]);
  const [carteiras, setCarteiras] = useState([]);
  const [cobrancas, setCobrancas] = useState([]);
  const [saude, setSaude] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [acessos, setAcessos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [planosSaas, setPlanosSaas] = useState([]);
  const [modulosSaas, setModulosSaas] = useState([]);
  const [planoModulos, setPlanoModulos] = useState([]);
  const [escritorioModulos, setEscritorioModulos] = useState([]);

  useEffect(() => {
    let ativo = true;
    const verificar = async () => {
      try {
        const { data, error } = await supabase
          .from("usuarios_plataforma")
          .select("*")
          .eq("user_id", sessao.user.id)
          .eq("ativo", true)
          .maybeSingle();

        if (error) throw error;
        if (!ativo) return;
        setPerfilPlataforma(data || null);
        setAutorizado(Boolean(data));
      } catch (e) {
        console.error(e);
        if (ativo) {
          setErro("Não foi possível validar seu acesso ao PrecificaCont Control.");
          setAutorizado(false);
        }
      } finally {
        if (ativo) setVerificando(false);
      }
    };
    verificar();
    return () => {
      ativo = false;
    };
  }, [sessao.user.id]);

  const carregarTudo = async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultados = await Promise.all([
        supabase
          .from("escritorios")
          .select(
            "id,nome,nome_fantasia,tipo_documento,documento,cnpj,razao_social,situacao_cadastral,data_abertura,natureza_juridica,porte,cnae_principal,cnae_principal_descricao,cep,logradouro,numero,complemento,bairro,municipio,uf,telefone_cadastral,email_cadastral,whatsapp_responsavel,cnpj_consultado_em,fonte_dados_cnpj,plano,plano_saas_id,valor_plano_contratado,preco_tabela_contratacao,plano_contratado_em,valor_mensal,status_assinatura,data_inicio_assinatura,data_proxima_cobranca,data_fim_teste,ultimo_pagamento_em,ultimo_acesso_em,origem_cliente,limite_usuarios,responsavel_comercial_id,responsavel_cs_id,responsavel_nome,email_responsavel,telefone_responsavel,observacoes_control,cancelado_em,motivo_cancelamento,deleted_at"
          )
          .order("nome", { ascending: true }),
        supabase
          .from("usuarios_escritorios")
          .select("id,user_id,escritorio_id,nome,email,cargo,perfil,ativo"),
        supabase.from("usuarios_plataforma").select("*").order("nome"),
        supabase.from("carteiras_clientes").select("*"),
        supabase.from("cobrancas_saas").select("*").order("vencimento", { ascending: false }),
        supabase.from("saude_clientes").select("*"),
        supabase.from("eventos_uso").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("logs_control").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("acessos_administrativos").select("*").order("iniciado_em", { ascending: false }).limit(100),
        supabase.from("historico_assinaturas").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("planos_saas").select("*").order("ordem", { ascending: true }),
        supabase.from("modulos_saas").select("*").order("ordem", { ascending: true }),
        supabase.from("plano_modulos").select("*"),
        supabase.from("escritorio_modulos").select("*"),
      ]);

      const erroEncontrado = resultados.find((r) => r.error)?.error;
      if (erroEncontrado) throw erroEncontrado;

      setEscritorios((resultados[0].data || []).filter((item) => !item.deleted_at));
      setUsuarios(resultados[1].data || []);
      setUsuariosPlataforma(resultados[2].data || []);
      setCarteiras(resultados[3].data || []);
      setCobrancas(resultados[4].data || []);
      setSaude(resultados[5].data || []);
      setEventos(resultados[6].data || []);
      setLogs(resultados[7].data || []);
      setAcessos(resultados[8].data || []);
      setHistorico(resultados[9].data || []);
      setPlanosSaas(resultados[10].data || []);
      setModulosSaas(resultados[11].data || []);
      setPlanoModulos(resultados[12].data || []);
      setEscritorioModulos(resultados[13].data || []);
    } catch (e) {
      console.error("Erro Control 2.0:", e);
      setErro(e?.message || "Não foi possível carregar os dados do Control.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!verificando && autorizado) carregarTudo();
    if (!verificando && !autorizado) setCarregando(false);
  }, [verificando, autorizado]);

  const resumo = useMemo(() => {
    const porStatus = (status) =>
      escritorios.filter((e) => e.status_assinatura === status).length;
    const ativos = porStatus("ativo");
    const testes = porStatus("teste");
    const inativos =
      porStatus("inativo") +
      porStatus("suspenso") +
      porStatus("inadimplente") +
      porStatus("cancelado");
    const mrr = escritorios
      .filter((e) => e.status_assinatura === "ativo")
      .reduce((t, e) => t + Number(e.valor_mensal || 0), 0);
    const usuariosAtivos = usuarios.filter((u) => u.ativo !== false).length;
    const pagos = cobrancas
      .filter((c) => c.status === "pago")
      .reduce((t, c) => t + Number(c.valor_pago || c.valor || 0), 0);
    const vencidos = cobrancas
      .filter((c) => c.status === "vencido")
      .reduce((t, c) => t + Number(c.valor || 0), 0);
    const pendentes = cobrancas
      .filter((c) => c.status === "pendente")
      .reduce((t, c) => t + Number(c.valor || 0), 0);
    const totalCobrancas = cobrancas.reduce((t, c) => t + Number(c.valor || 0), 0);
    const emAberto = pendentes + vencidos;
    const inadimplencia = totalCobrancas ? (vencidos / totalCobrancas) * 100 : 0;

    return {
      ativos,
      testes,
      inativos,
      mrr,
      arr: mrr * 12,
      usuariosAtivos,
      ticket: ativos ? mrr / ativos : 0,
      pagos,
      vencidos,
      pendentes,
      totalCobrancas,
      emAberto,
      inadimplencia,
    };
  }, [escritorios, usuarios, cobrancas]);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return escritorios.filter((e) => {
      const nome = `${e.nome || ""} ${e.nome_fantasia || ""}`.toLowerCase();
      const bateBusca = !termo || nome.includes(termo) || e.id.includes(termo);
      const bateStatus =
        filtroStatus === "todos" || e.status_assinatura === filtroStatus;
      return bateBusca && bateStatus;
    });
  }, [escritorios, busca, filtroStatus]);

  const saudePorEscritorio = (id) =>
    saude.find((item) => item.escritorio_id === id) || null;

  const usuariosDoEscritorio = (id) =>
    usuarios.filter((u) => u.escritorio_id === id);

  const cobrancasDoEscritorio = (id) =>
    cobrancas.filter((c) => c.escritorio_id === id);

  const eventosDoEscritorio = (id) =>
    eventos.filter((e) => e.escritorio_id === id);

  const nomeEscritorio = (id) => {
    const e = escritorios.find((item) => item.id === id);
    return e?.nome_fantasia || e?.nome || "Escritório";
  };

  const editarClienteDireto = (escritorio) => {
    const completo = escritorios.find((item) => item.id === escritorio.id) || escritorio;
    setEscritorioSelecionado(completo);
    setEditandoEscritorio(true);
  };

  const registrarLog = async (acao, descricao, escritorioId = null, metadata = {}) => {
    if (!perfilPlataforma?.id) return;
    await supabase.from("logs_control").insert({
      usuario_plataforma_id: perfilPlataforma.id,
      escritorio_id: escritorioId,
      acao,
      descricao,
      metadata,
    });
  };

  const salvarEscritorio = async (dados) => {
    if (!escritorioSelecionado) return;
    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      const anterior = escritorioSelecionado;
      const planoSelecionado = planosSaas.find((p) => p.id === dados.plano_saas_id) || null;
      const valorContratado = numeroBRLInput(dados.valor_mensal);
      const precoTabela = planoSelecionado
        ? Number(planoSelecionado.preco_mensal || 0)
        : numeroBRLInput(dados.preco_tabela_contratacao);

      const payload = {
        nome: dados.nome_fantasia?.trim() || dados.razao_social?.trim() || anterior.nome,
        nome_fantasia: dados.nome_fantasia?.trim() || dados.razao_social?.trim() || anterior.nome_fantasia,
        tipo_documento: dados.tipo_documento || (dados.cnpj ? "cnpj" : null),
        documento: normalizarDocumento(dados.documento || dados.cnpj, dados.tipo_documento || "cnpj") || null,
        cnpj: (dados.tipo_documento || "cnpj") === "cnpj"
          ? (dados.cnpj?.trim() || formatarCNPJ(dados.documento) || null)
          : null,
        razao_social: dados.razao_social?.trim() || null,
        situacao_cadastral: dados.situacao_cadastral || null,
        data_abertura: dados.data_abertura || null,
        natureza_juridica: dados.natureza_juridica || null,
        porte: dados.porte || null,
        cnae_principal: dados.cnae_principal || null,
        cnae_principal_descricao: dados.cnae_principal_descricao || null,
        cep: dados.cep || null,
        logradouro: dados.logradouro || null,
        numero: dados.numero || null,
        complemento: dados.complemento || null,
        bairro: dados.bairro || null,
        municipio: dados.municipio || null,
        uf: dados.uf || null,
        telefone_cadastral: dados.telefone_cadastral || null,
        email_cadastral: dados.email_cadastral || null,
        responsavel_nome: dados.responsavel_nome || null,
        email_responsavel: dados.email_responsavel || null,
        telefone_responsavel: dados.telefone_responsavel || null,
        whatsapp_responsavel: dados.whatsapp_responsavel || null,
        observacoes_control: dados.observacoes_control || null,
        plano: planoSelecionado?.codigo || dados.plano || null,
        plano_saas_id: dados.plano_saas_id || null,
        valor_plano_contratado: valorContratado,
        preco_tabela_contratacao: precoTabela,
        plano_contratado_em:
          dados.plano_saas_id && dados.plano_saas_id !== anterior.plano_saas_id
            ? new Date().toISOString()
            : anterior.plano_contratado_em || null,
        valor_mensal: valorContratado,
        status_assinatura: dados.status_assinatura || "teste",
        data_inicio_assinatura: dados.data_inicio_assinatura || null,
        data_proxima_cobranca: dados.data_proxima_cobranca || null,
        data_fim_teste: dados.data_fim_teste || null,
        origem_cliente: dados.origem_cliente || null,
        limite_usuarios: dados.limite_usuarios ? Number(dados.limite_usuarios) : null,
      };

      const { data, error } = await supabase
        .from("escritorios")
        .update(payload)
        .eq("id", anterior.id)
        .select()
        .single();

      if (error) throw error;

      const idsAvulsos = Array.isArray(dados.modulos_avulsos) ? dados.modulos_avulsos : [];
      const atuais = escritorioModulos.filter((x) => x.escritorio_id === anterior.id);

      for (const modulo of modulosSaas) {
        const atual = atuais.find((x) => x.modulo_id === modulo.id);
        const deveAtivar = idsAvulsos.includes(modulo.id);

        if (deveAtivar) {
          const { error: erroModulo } = await supabase
            .from("escritorio_modulos")
            .upsert(
              {
                escritorio_id: anterior.id,
                modulo_id: modulo.id,
                ativo: true,
                valor_contratado: atual?.valor_contratado ?? Number(modulo.preco_avulso || 0),
                contratado_em: atual?.contratado_em || new Date().toISOString(),
                cancelado_em: null,
              },
              { onConflict: "escritorio_id,modulo_id" }
            );
          if (erroModulo) throw erroModulo;
        } else if (atual?.ativo) {
          const { error: erroModulo } = await supabase
            .from("escritorio_modulos")
            .update({ ativo: false, cancelado_em: new Date().toISOString() })
            .eq("id", atual.id);
          if (erroModulo) throw erroModulo;
        }
      }

      const mudouPlano = anterior.plano_saas_id !== data.plano_saas_id;
      const mudouAssinatura =
        mudouPlano ||
        Number(anterior.valor_mensal || 0) !== Number(data.valor_mensal || 0) ||
        anterior.status_assinatura !== data.status_assinatura;

      if (mudouAssinatura) {
        await supabase.from("historico_assinaturas").insert({
          escritorio_id: anterior.id,
          plano_anterior: anterior.plano,
          plano_novo: data.plano,
          valor_anterior: Number(anterior.valor_mensal || 0),
          valor_novo: Number(data.valor_mensal || 0),
          status_anterior: anterior.status_assinatura,
          status_novo: data.status_assinatura,
          alterado_por: sessao.user.id,
          motivo: "Alteração pelo PrecificaCont Control",
        });
      }

      if (mudouPlano && data.plano_saas_id) {
        const { error: erroHistoricoPlano } = await supabase
          .from("historico_planos_clientes")
          .insert({
            escritorio_id: anterior.id,
            plano_saas_id: data.plano_saas_id,
            preco_tabela: precoTabela,
            valor_contratado: valorContratado,
            motivo: "Alteração de plano pelo PrecificaCont Control",
            alterado_por: sessao.user.id,
          });
        if (erroHistoricoPlano) console.error("Histórico de plano:", erroHistoricoPlano);
      }

      await registrarLog(
        "escritorio_atualizado",
        `Dados administrativos de ${data.nome_fantasia || data.nome} atualizados.`,
        data.id,
        payload
      );

      setEscritorios((lista) =>
        lista.map((item) => (item.id === data.id ? { ...item, ...data } : item))
      );
      setEscritorioSelecionado((atual) => ({ ...atual, ...data }));
      setEditandoEscritorio(false);
      setModalCliente(false);
      setSucesso("Cliente e assinatura atualizados.");
      await carregarTudo();
    } catch (e) {
      setErro(e?.message || "Não foi possível salvar o escritório.");
    } finally {
      setSalvando(false);
    }
  };

  const criarCliente = async (form) => {
    setSalvando(true);
    setErro("");
    try {
      const nomeBase = form.nome_fantasia?.trim() || form.razao_social?.trim() || form.nome?.trim();
      const payload = {
        nome: nomeBase,
        nome_fantasia: form.nome_fantasia?.trim() || nomeBase,
        tipo_documento: form.tipo_documento,
        documento: normalizarDocumento(form.documento, form.tipo_documento),
        cnpj: form.tipo_documento === "cnpj" ? (form.cnpj?.trim() || formatarCNPJ(form.documento)) : null,
        razao_social: form.razao_social?.trim() || null,
        situacao_cadastral: form.situacao_cadastral || null,
        data_abertura: form.data_abertura || null,
        natureza_juridica: form.natureza_juridica || null,
        porte: form.porte || null,
        cnae_principal: form.cnae_principal || null,
        cnae_principal_descricao: form.cnae_principal_descricao || null,
        cep: form.cep || null,
        logradouro: form.logradouro || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        municipio: form.municipio || null,
        uf: form.uf || null,
        telefone_cadastral: form.telefone_cadastral || null,
        email_cadastral: form.email_cadastral || null,
        responsavel_nome: form.responsavel_nome || null,
        email_responsavel: form.email_responsavel || null,
        telefone_responsavel: form.telefone_responsavel || null,
        whatsapp_responsavel: form.whatsapp_responsavel || null,
        plano: form.plano || "essencial",
        plano_saas_id: form.plano_saas_id || null,
        valor_plano_contratado: numeroBRLInput(form.valor_mensal),
        preco_tabela_contratacao: numeroBRLInput(form.preco_tabela_contratacao || form.valor_mensal),
        plano_contratado_em: form.plano_saas_id ? new Date().toISOString() : null,
        valor_mensal: numeroBRLInput(form.valor_mensal),
        status_assinatura: form.status_assinatura || "teste",
        data_inicio_assinatura: form.data_inicio_assinatura || new Date().toISOString(),
        data_fim_teste: form.data_fim_teste || null,
        data_proxima_cobranca: form.data_proxima_cobranca || null,
        origem_cliente: form.origem_cliente || "Cadastro manual - Control",
        responsavel_comercial_id: form.responsavel_comercial_id || null,
        responsavel_cs_id: form.responsavel_pre_vendas_id || null,
        observacoes_control: form.observacoes_control || null,
        cnpj_consultado_em: form.cnpj_consultado_em || null,
        fonte_dados_cnpj: form.fonte_dados_cnpj || null,
      };
      if (!payload.documento) throw new Error("Informe o CPF ou CNPJ do cliente.");
      if (payload.tipo_documento === "cpf" && !validarCPF(payload.documento)) throw new Error("CPF inválido. Confira os 11 dígitos e os dígitos verificadores.");
      if (payload.tipo_documento === "cnpj" && payload.documento.length !== 14) throw new Error("CNPJ inválido. Informe 14 caracteres.");
      if (!payload.razao_social) throw new Error(payload.tipo_documento === "cpf" ? "Informe o nome completo do cliente." : "Informe ou consulte a razão social.");
      if (!payload.nome) throw new Error("Informe o nome do escritório.");
      if (!form.responsavel_comercial_id) throw new Error("Selecione o vendedor responsável.");

      const { data, error } = await supabase
        .from("escritorios")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      const responsabilidades = [
        form.responsavel_comercial_id
          ? {
              escritorio_id: data.id,
              usuario_plataforma_id: form.responsavel_comercial_id,
              tipo_responsabilidade: "comercial",
              principal: true,
            }
          : null,
        form.responsavel_pre_vendas_id
          ? {
              escritorio_id: data.id,
              usuario_plataforma_id: form.responsavel_pre_vendas_id,
              tipo_responsabilidade: "pre_vendas",
              principal: false,
            }
          : null,
      ].filter(Boolean);

      if (responsabilidades.length) {
        const { error: erroCarteira } = await supabase
          .from("carteiras_clientes")
          .insert(responsabilidades);
        if (erroCarteira) throw erroCarteira;
      }

      await registrarLog(
        "cliente_criado",
        `Cliente ${data.nome_fantasia || data.nome} cadastrado no Control.`,
        data.id
      );
      setModalCliente(false);
      setSucesso("Cliente cadastrado.");
      await carregarTudo();
    } catch (e) {
      setErro(e?.message || "Não foi possível cadastrar o cliente.");
    } finally {
      setSalvando(false);
    }
  };

  const alterarStatusCliente = async (escritorio, novoStatus) => {
    setErro("");
    try {
      const anterior = escritorio.status_assinatura || null;
      const extras =
        novoStatus === "cancelado"
          ? { cancelado_em: new Date().toISOString() }
          : novoStatus === "ativo"
          ? { cancelado_em: null, motivo_cancelamento: null }
          : {};

      const { data, error } = await supabase
        .from("escritorios")
        .update({ status_assinatura: novoStatus, ...extras })
        .eq("id", escritorio.id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from("historico_status_clientes").insert({
        escritorio_id: escritorio.id,
        status_anterior: anterior,
        status_novo: novoStatus,
        alterado_por: sessao.user.id,
        motivo: "Alteração pelo PrecificaCont Control",
      });

      await registrarLog(
        "status_cliente_alterado",
        `${escritorio.nome_fantasia || escritorio.nome}: ${anterior || "sem status"} → ${novoStatus}.`,
        escritorio.id
      );

      setEscritorios((lista) =>
        lista.map((item) => (item.id === data.id ? { ...item, ...data } : item))
      );
      if (escritorioSelecionado?.id === data.id) {
        setEscritorioSelecionado((atual) => ({ ...atual, ...data }));
      }
      setSucesso(`Cliente alterado para ${novoStatus}.`);
    } catch (e) {
      setErro(e?.message || "Não foi possível alterar o status.");
    }
  };

  const excluirCliente = async (escritorio) => {
    const nome = escritorio.nome_fantasia || escritorio.nome;
    if (!window.confirm(`Excluir ${nome} da base do Control?\\n\\nA exclusão será administrativa e preservará os dados operacionais.`)) return;

    setErro("");
    try {
      const { error } = await supabase
        .from("escritorios")
        .update({
          deleted_at: new Date().toISOString(),
          status_assinatura: "cancelado",
          cancelado_em: new Date().toISOString(),
        })
        .eq("id", escritorio.id);
      if (error) throw error;

      await registrarLog(
        "cliente_excluido_control",
        `${nome} removido da base ativa do Control.`,
        escritorio.id
      );
      setEscritorioSelecionado(null);
      setSucesso("Cliente removido da base ativa.");
      await carregarTudo();
    } catch (e) {
      setErro(e?.message || "Não foi possível excluir o cliente.");
    }
  };

  const criarUsuarioCliente = async (escritorio, form) => {
    setSalvando(true);
    setErro("");
    setSucesso("");
    try {
      if (!escritorio?.id) throw new Error("Empresa não informada.");
      const nome = form.nome?.trim();
      const email = form.email?.trim().toLowerCase();
      const senha = form.senha || "";

      if (!nome) throw new Error("Informe o nome do usuário.");
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Informe um e-mail válido.");
      }
      if (senha.length < 8) throw new Error("A senha deve possuir pelo menos 8 caracteres.");

      const { data, error } = await supabase.functions.invoke("gerenciar-usuario-cliente", {
        body: {
          escritorio_id: escritorio.id,
          nome,
          email,
          senha,
          cargo: form.cargo?.trim() || null,
          perfil: form.perfil || "comercial",
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Não foi possível criar o usuário.");

      await registrarLog(
        "usuario_cliente_criado",
        `Usuário ${nome} criado para ${escritorio.nome_fantasia || escritorio.nome}.`,
        escritorio.id,
        { email, perfil: form.perfil || "comercial" }
      );

      setSucesso(`Usuário ${nome} criado com sucesso.`);
      await carregarTudo();
      return true;
    } catch (e) {
      console.error("Erro ao criar usuário do cliente:", e);
      setErro(e?.message || "Não foi possível criar o usuário do cliente.");
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const atualizarUsuarioCliente = async (usuario, form) => {
    setSalvando(true);
    setErro("");
    setSucesso("");
    try {
      if (!usuario?.id) throw new Error("Usuário não informado.");
      const nome = form.nome?.trim();
      const email = form.email?.trim().toLowerCase();
      if (!nome) throw new Error("Informe o nome do usuário.");
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail válido.");

      const { error } = await supabase.from("usuarios_escritorios").update({
        nome,
        email,
        cargo: form.cargo?.trim() || null,
        perfil: form.perfil || "comercial",
        ativo: form.ativo !== false,
      }).eq("id", usuario.id);
      if (error) throw error;

      await registrarLog("usuario_cliente_atualizado", `Usuário ${nome} atualizado.`, usuario.escritorio_id, {
        usuario_escritorio_id: usuario.id,
        user_id: usuario.user_id || null,
        email,
        perfil: form.perfil || "comercial",
        ativo: form.ativo !== false,
      });
      setSucesso(`Usuário ${nome} atualizado com sucesso.`);
      await carregarTudo();
      return true;
    } catch (e) {
      console.error("Erro ao atualizar usuário do cliente:", e);
      setErro(e?.message || "Não foi possível atualizar o usuário do cliente.");
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const atualizarAcessoUsuarioCliente = async (usuario, form) => {
    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      if (!usuario?.id || !usuario?.escritorio_id) {
        throw new Error("Usuário ou empresa não informados.");
      }

      const email = form.email?.trim().toLowerCase();
      const novaSenha = form.nova_senha || "";
      const confirmarSenha = form.confirmar_senha || "";

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Informe um e-mail de login válido.");
      }

      if (novaSenha && novaSenha.length < 8) {
        throw new Error("A nova senha deve possuir pelo menos 8 caracteres.");
      }

      if (novaSenha !== confirmarSenha) {
        throw new Error("A confirmação da nova senha não confere.");
      }

      const { data, error } = await supabase.functions.invoke(
        "gerenciar-usuario-cliente",
        {
          body: {
            operacao: "atualizar_acesso",
            usuario_escritorio_id: usuario.id,
            escritorio_id: usuario.escritorio_id,
            email,
            nova_senha: novaSenha || undefined,
          },
        }
      );

      if (error) throw error;
      if (data?.success === false) {
        throw new Error(data?.error || "Não foi possível atualizar login e senha.");
      }

      await registrarLog(
        "acesso_usuario_cliente_atualizado",
        `Acesso de ${usuario.nome || email} atualizado.`,
        usuario.escritorio_id,
        {
          usuario_escritorio_id: usuario.id,
          user_id: usuario.user_id || null,
          email,
          senha_redefinida: Boolean(novaSenha),
        }
      );

      setSucesso(data?.message || "Login e senha atualizados com sucesso.");
      await carregarTudo();
      return true;
    } catch (e) {
      console.error("Erro ao atualizar acesso do usuário do cliente:", e);
      setErro(e?.message || "Não foi possível atualizar login e senha.");
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const excluirUsuarioCliente = async (usuario) => {
    if (!podeGerenciarEquipe) {
      setErro("Seu perfil não possui permissão para excluir usuários.");
      return false;
    }

    if (!usuario?.id || !usuario?.escritorio_id) {
      setErro("Usuário ou empresa não informados.");
      return false;
    }

    const nome = usuario.nome || usuario.email || "este usuário";
    const confirmou = window.confirm(
      `Excluir ${nome} desta empresa?\n\nO vínculo com a empresa será removido. Se este login não estiver vinculado a nenhuma outra empresa, o acesso também deverá ser removido do Authentication.`
    );
    if (!confirmou) return false;

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "gerenciar-usuario-cliente",
        {
          body: {
            operacao: "excluir_usuario",
            usuario_escritorio_id: usuario.id,
            escritorio_id: usuario.escritorio_id,
            user_id: usuario.user_id || null,
          },
        }
      );

      if (error) throw error;
      if (data?.success === false) {
        throw new Error(data?.error || "Não foi possível excluir o usuário.");
      }

      await registrarLog(
        "usuario_cliente_excluido",
        `Usuário ${nome} excluído da empresa.`,
        usuario.escritorio_id,
        {
          usuario_escritorio_id: usuario.id,
          user_id: usuario.user_id || null,
          email: usuario.email || null,
        }
      );

      setSucesso(data?.message || `Usuário ${nome} excluído com sucesso.`);
      await carregarTudo();
      return true;
    } catch (e) {
      console.error("Erro ao excluir usuário do cliente:", e);
      setErro(e?.message || "Não foi possível excluir o usuário do cliente.");
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const criarCobranca = async (form) => {
    setSalvando(true);
    setErro("");
    try {
      if (!form.escritorio_id) throw new Error("Selecione o cliente.");
      if (!form.valor) throw new Error("Informe o valor.");

      const { error } = await supabase.from("cobrancas_saas").insert({
        escritorio_id: form.escritorio_id,
        competencia: form.competencia || null,
        descricao: form.descricao || "Mensalidade PrecificaCont",
        categoria: form.categoria || "mensalidade",
        valor: Number(form.valor || 0),
        vencimento: form.vencimento || null,
        status: form.status || "pendente",
        data_emissao: form.data_emissao || hojeISO(),
        observacoes: form.observacoes || null,
      });
      if (error) throw error;

      await registrarLog(
        "cobranca_criada",
        `Cobrança de ${moeda(form.valor)} criada para ${nomeEscritorio(form.escritorio_id)}.`,
        form.escritorio_id
      );
      setModalCobranca(false);
      setSucesso("Cobrança cadastrada.");
      await carregarTudo();
    } catch (e) {
      setErro(e?.message || "Não foi possível cadastrar a cobrança.");
    } finally {
      setSalvando(false);
    }
  };

  const alterarStatusCobranca = async (cobranca, status) => {
    setErro("");
    try {
      const payload = {
        status,
        pago_em: status === "pago" ? new Date().toISOString() : null,
        valor_pago: status === "pago" ? Number(cobranca.valor || 0) : null,
      };
      const { error } = await supabase
        .from("cobrancas_saas")
        .update(payload)
        .eq("id", cobranca.id);
      if (error) throw error;

      await registrarLog(
        "cobranca_atualizada",
        `Cobrança de ${nomeEscritorio(cobranca.escritorio_id)} alterada para ${status}.`,
        cobranca.escritorio_id
      );
      setSucesso("Cobrança atualizada.");
      await carregarTudo();
    } catch (e) {
      setErro(e?.message || "Não foi possível atualizar a cobrança.");
    }
  };

  const cadastrarEquipe = async (form) => {
    setSalvando(true);
    setErro("");
    setSucesso("");
    try {
      const nome = form.nome?.trim();
      const email = form.email?.trim()?.toLowerCase();

      if (!nome) throw new Error("Informe o nome do colaborador.");
      if (!email) throw new Error("Informe o e-mail do colaborador.");

      const payload = {
        nome,
        email,
        cargo: form.cargo?.trim() || null,
        perfil: form.perfil || "comercial",
        ativo: true,
        pode_ver_todos_clientes: Boolean(form.pode_ver_todos_clientes),
        pode_ver_financeiro: Boolean(form.pode_ver_financeiro),
        pode_acessar_cliente: Boolean(form.pode_acessar_cliente),
        pode_gerenciar_equipe: Boolean(form.pode_gerenciar_equipe),
      };

      const existente = usuariosPlataforma.find(
        (u) => String(u.email || "").toLowerCase() === email
      );

      let resultado;
      if (existente) {
        resultado = await supabase
          .from("usuarios_plataforma")
          .update(payload)
          .eq("id", existente.id)
          .select()
          .single();
      } else {
        resultado = await supabase
          .from("usuarios_plataforma")
          .insert(payload)
          .select()
          .single();
      }

      if (resultado.error) throw resultado.error;
      if (!resultado.data?.id) throw new Error("O colaborador não foi confirmado pelo banco.");

      await registrarLog(
        existente ? "usuario_plataforma_atualizado" : "usuario_plataforma_cadastrado",
        `${nome} salvo na Equipe PrecificaCont.`,
        null,
        { perfil: payload.perfil, email: payload.email }
      );

      setModalEquipe(false);
      setSucesso(`${nome} salvo. As permissões podem ser ajustadas em Equipe PrecificaCont → Abrir usuário.`);
      await carregarTudo();
    } catch (e) {
      console.error("Erro ao salvar colaborador:", e);
      setErro(
        e?.message
          ? `Não foi possível salvar o colaborador: ${e.message}`
          : "Não foi possível salvar o colaborador."
      );
    } finally {
      setSalvando(false);
    }
  };

  const salvarPermissoesEquipe = async (usuario, alteracoes) => {
    setSalvando(true);
    setErro("");
    try {
      const payload = {
        nome: alteracoes.nome?.trim() || null,
        email: alteracoes.email?.trim().toLowerCase() || null,
        perfil: alteracoes.perfil,
        cargo: alteracoes.cargo || null,
        pode_ver_todos_clientes: Boolean(alteracoes.pode_ver_todos_clientes),
        pode_ver_financeiro: Boolean(alteracoes.pode_ver_financeiro),
        pode_acessar_cliente: Boolean(alteracoes.pode_acessar_cliente),
        pode_gerenciar_equipe: Boolean(alteracoes.pode_gerenciar_equipe),
      };
      if (!payload.nome) throw new Error("Informe o nome do colaborador.");
      if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        throw new Error("Informe um e-mail válido.");
      }

      const { data: atualizado, error } = await supabase
        .from("usuarios_plataforma")
        .update(payload)
        .eq("id", usuario.id)
        .select("id,nome,email");
      if (error) throw error;
      if (!atualizado?.length) throw new Error("As alterações não foram gravadas. Atualize a página e tente novamente.");

      await registrarLog(
        "permissoes_equipe_atualizadas",
        `Permissões de ${usuario.nome || usuario.email} atualizadas.`,
        null,
        { usuario_plataforma_id: usuario.id, ...payload }
      );
      setSucesso(`Dados e permissões de ${payload.nome || payload.email} salvos.`);
      await carregarTudo();
    } catch (e) {
      setErro(e?.message || "Não foi possível salvar as permissões.");
    } finally {
      setSalvando(false);
    }
  };

  const definirSenhaColaborador = async (usuario, novaSenha) => {
    setSalvando(true);
    setErro("");
    setSucesso("");
    try {
      if (perfilPlataforma?.perfil !== "owner") {
        throw new Error("Somente o Owner pode definir ou redefinir senhas.");
      }
      if (!usuario?.id) throw new Error("Colaborador não informado.");
      if (!usuario?.user_id) {
        throw new Error("Este colaborador ainda não possui login vinculado no Authentication.");
      }
      if (!novaSenha || novaSenha.length < 8) {
        throw new Error("A senha deve possuir pelo menos 8 caracteres.");
      }

      const { data, error } = await supabase.functions.invoke("gerenciar-acesso-usuario", {
        body: {
          usuario_plataforma_id: usuario.id,
          nova_senha: novaSenha,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Não foi possível definir a senha.");

      await registrarLog(
        "senha_colaborador_redefinida",
        `Senha de acesso de ${usuario.nome || usuario.email} redefinida pelo Owner.`,
        null,
        { usuario_plataforma_id: usuario.id }
      );

      setSucesso(`Senha de acesso de ${usuario.nome || usuario.email} definida com sucesso.`);
      return true;
    } catch (e) {
      console.error("Erro ao definir senha do colaborador:", e);
      setErro(e?.message || "Não foi possível definir a senha do colaborador.");
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const removerClienteDaCarteira = async (usuario, escritorioId) => {
    setSalvando(true);
    setErro("");
    setSucesso("");
    try {
      const { data, error } = await supabase
        .from("carteiras_clientes")
        .delete()
        .eq("usuario_plataforma_id", usuario.id)
        .eq("escritorio_id", escritorioId)
        .eq("tipo_responsabilidade", "comercial")
        .select("id");

      if (error) throw error;
      if (!data?.length) throw new Error("O vínculo não foi removido. Atualize a página e tente novamente.");

      setSucesso(`Cliente removido da carteira de ${usuario.nome || usuario.email}.`);
      await carregarTudo();
    } catch (e) {
      setErro(e?.message || "Não foi possível remover o cliente da carteira.");
    } finally {
      setSalvando(false);
    }
  };

  const salvarCarteiraColaborador = async (usuario, escritorioIds) => {
    setSalvando(true);
    setErro("");
    setSucesso("");
    try {
      const atuais = carteiras.filter(
        (c) => c.usuario_plataforma_id === usuario.id && c.tipo_responsabilidade === "comercial"
      );
      const desejados = new Set(escritorioIds || []);

      for (const vinculo of atuais) {
        if (!desejados.has(vinculo.escritorio_id)) {
          const { error } = await supabase.from("carteiras_clientes").delete().eq("id", vinculo.id);
          if (error) throw error;
        }
      }

      for (const escritorioId of desejados) {
        const jaExiste = atuais.some((c) => c.escritorio_id === escritorioId);
        if (!jaExiste) {
          const { error } = await supabase.from("carteiras_clientes").insert({
            escritorio_id: escritorioId,
            usuario_plataforma_id: usuario.id,
            tipo_responsabilidade: "comercial",
            principal: true,
          });
          if (error) throw error;
        }
      }

      await registrarLog(
        "carteira_colaborador_atualizada",
        `Carteira de ${usuario.nome || usuario.email} atualizada.`,
        null,
        { usuario_plataforma_id: usuario.id, escritorios: Array.from(desejados) }
      );
      setSucesso(`Carteira de ${usuario.nome || usuario.email} atualizada.`);
      await carregarTudo();
    } catch (e) {
      setErro(e?.message || "Não foi possível atualizar a carteira.");
    } finally {
      setSalvando(false);
    }
  };

  const alternarEquipe = async (usuario) => {
    try {
      const { error } = await supabase
        .from("usuarios_plataforma")
        .update({ ativo: usuario.ativo === false })
        .eq("id", usuario.id);
      if (error) throw error;
      setSucesso(usuario.ativo === false ? "Colaborador ativado." : "Colaborador inativado.");
      await carregarTudo();
    } catch (e) {
      setErro(e?.message || "Não foi possível atualizar o colaborador.");
    }
  };

  const salvarPlanoSaas = async (plano, alteracoes) => {
    setSalvando(true); setErro("");
    try {
      const payload = {
        nome: alteracoes.nome ?? plano.nome,
        descricao: alteracoes.descricao ?? plano.descricao,
        preco_mensal: Number(alteracoes.preco_mensal ?? plano.preco_mensal ?? 0),
        preco_anual: alteracoes.preco_anual === "" ? null : Number(alteracoes.preco_anual ?? plano.preco_anual ?? 0),
        ativo: alteracoes.ativo ?? plano.ativo,
        destaque: alteracoes.destaque ?? plano.destaque,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("planos_saas").update(payload).eq("id", plano.id);
      if (error) throw error;
      await registrarLog("plano_saas_atualizado", `Plano ${payload.nome} atualizado no Control.`, null, payload);
      setSucesso(`Plano ${payload.nome} atualizado.`);
      await carregarTudo();
    } catch (e) { setErro(e?.message || "Não foi possível atualizar o plano."); }
    finally { setSalvando(false); }
  };

  const alternarModuloPlano = async (plano, modulo, incluido) => {
    setErro("");
    try {
      if (incluido) {
        const { error } = await supabase.from("plano_modulos").upsert({ plano_id: plano.id, modulo_id: modulo.id, incluido: true }, { onConflict: "plano_id,modulo_id" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("plano_modulos").delete().eq("plano_id", plano.id).eq("modulo_id", modulo.id);
        if (error) throw error;
      }
      setPlanoModulos(lista => incluido
        ? [...lista.filter(x => !(x.plano_id === plano.id && x.modulo_id === modulo.id)), { plano_id: plano.id, modulo_id: modulo.id, incluido: true }]
        : lista.filter(x => !(x.plano_id === plano.id && x.modulo_id === modulo.id)));
    } catch (e) { setErro(e?.message || "Não foi possível alterar o módulo do plano."); }
  };

  const salvarModuloSaas = async (modulo, alteracoes) => {
    setSalvando(true); setErro("");
    try {
      const payload = {
        nome: alteracoes.nome ?? modulo.nome,
        descricao: alteracoes.descricao ?? modulo.descricao,
        preco_avulso: Number(alteracoes.preco_avulso ?? modulo.preco_avulso ?? 0),
        permite_avulso: alteracoes.permite_avulso ?? modulo.permite_avulso,
        ativo: alteracoes.ativo ?? modulo.ativo,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("modulos_saas").update(payload).eq("id", modulo.id);
      if (error) throw error;
      setSucesso(`Módulo ${payload.nome} atualizado.`);
      await carregarTudo();
    } catch (e) { setErro(e?.message || "Não foi possível atualizar o módulo."); }
    finally { setSalvando(false); }
  };

  const exportarCSV = (nome, linhas) => {
    if (!linhas?.length) {
      setErro("Não há dados para exportar.");
      return;
    }
    const cabecalhos = Object.keys(linhas[0]);
    const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const csv = [
      cabecalhos.map(esc).join(";"),
      ...linhas.map((linha) => cabecalhos.map((h) => esc(linha[h])).join(";")),
    ].join("\\n");
    const blob = new Blob(["\\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nome}-${hojeISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const acessarAmbiente = async (escritorio) => {
    setErro("");
    try {
      if (!perfilPlataforma?.pode_acessar_cliente && perfilPlataforma?.perfil !== "owner") {
        throw new Error("Seu perfil não possui permissão para acesso administrativo.");
      }

      const motivo = window.prompt(
        `Motivo do acesso administrativo em ${
          escritorio.nome_fantasia || escritorio.nome
        }:`,
        "Suporte administrativo"
      );
      if (motivo === null) return;

      const { data: acesso, error } = await supabase
        .from("acessos_administrativos")
        .insert({
          usuario_plataforma_id: perfilPlataforma.id,
          escritorio_id: escritorio.id,
          motivo: motivo || "Acesso administrativo",
          ativo: true,
        })
        .select()
        .single();
      if (error) throw error;

      await registrarLog(
        "acesso_administrativo_iniciado",
        `Acesso administrativo iniciado em ${
          escritorio.nome_fantasia || escritorio.nome
        }.`,
        escritorio.id,
        { acesso_id: acesso.id, motivo }
      );

      localStorage.setItem("precificacont_escritorio_ativo", escritorio.id);
      localStorage.setItem(
        "precificacont_acesso_control",
        JSON.stringify({
          acesso_id: acesso.id,
          escritorio_id: escritorio.id,
          escritorio_nome: escritorio.nome_fantasia || escritorio.nome,
          iniciado_em: new Date().toISOString(),
        })
      );

      window.open("/", "_blank", "noopener,noreferrer");
    } catch (e) {
      setErro(
        e?.message ||
          "Não foi possível iniciar o acesso administrativo ao escritório."
      );
    }
  };

  const sair = async () => {
    if (saindo) return;
    setSaindo(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      setSaindo(false);
    }
  };

  if (verificando) {
    return (
      <div className="min-h-screen bg-[#07101f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-blue-400" size={34} />
          <p className="mt-3 text-sm font-medium text-slate-400">
            Validando acesso ao Control...
          </p>
        </div>
      </div>
    );
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-[#07101f] flex items-center justify-center p-5">
        <div className="w-full max-w-[500px] rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <ShieldCheck className="mx-auto text-rose-400" size={38} />
          <h1 className="mt-5 text-2xl font-black text-white">
            Acesso não autorizado
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Este ambiente é exclusivo da administração da plataforma PrecificaCont.
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900"
          >
            Ir para o PrecificaCont
          </button>
        </div>
      </div>
    );
  }

  const ehOwner = perfilPlataforma?.perfil === "owner";
  const podeGerenciarEquipe = ehOwner || Boolean(perfilPlataforma?.pode_gerenciar_equipe);
  const podeVerFinanceiro = ehOwner || Boolean(perfilPlataforma?.pode_ver_financeiro);
  const podeVerTodosClientes = ehOwner || Boolean(perfilPlataforma?.pode_ver_todos_clientes);
  const idsMinhaCarteira = new Set(
    carteiras
      .filter((c) => c.usuario_plataforma_id === perfilPlataforma?.id)
      .map((c) => c.escritorio_id)
  );
  const escritoriosPermitidos = podeVerTodosClientes
    ? escritorios
    : escritorios.filter((e) => idsMinhaCarteira.has(e.id));
  const clientesFiltradosPermitidos = clientesFiltrados.filter((e) =>
    escritoriosPermitidos.some((p) => p.id === e.id)
  );
  const cobrancasPermitidas = cobrancas.filter((c) =>
    escritoriosPermitidos.some((e) => e.id === c.escritorio_id)
  );
  const menuVisivel = MENU.filter((item) => {
    if (item.id === "configuracoes") return ehOwner;
    if (item.id === "equipe") return podeGerenciarEquipe;
    if (item.id === "financeiro") return podeVerFinanceiro;
    return true;
  });

  const tituloPagina = MENU.find((item) => item.id === pagina)?.label || "Control";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        .input-control { width:100%; height:42px; border:1px solid #e2e8f0; border-radius:12px; padding:0 12px; background:white; font-size:14px; outline:none; }
        .input-control:focus { border-color:#60a5fa; box-shadow:0 0 0 3px rgba(96,165,250,.12); }
      `}</style>
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#07101f]">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-5 px-5 py-4 lg:px-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 items-center rounded-xl">
              <img
                src="/precificacont-logo-dark-cortado.png"
                alt="PrecificaCont"
                className="h-10 w-auto max-w-[190px] object-contain"
              />
            </div>
            <div className="hidden h-8 w-px bg-slate-700 sm:block" />
            <div className="hidden sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-400">
                Administração SaaS
              </p>
              <h1 className="text-base font-black text-white">Control</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={carregarTudo}
              className="hidden h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-xs font-bold text-slate-300 hover:bg-slate-800 sm:inline-flex"
            >
              <RefreshCw size={14} />
              Atualizar
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-white">
                {perfilPlataforma?.nome || sessao.user.email}
              </p>
              <p className="text-xs capitalize text-slate-400">
                {perfilPlataforma?.perfil || "plataforma"}
              </p>
            </div>
            <button
              type="button"
              onClick={sair}
              disabled={saindo}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-60"
            >
              {saindo ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1700px]">
        <aside className="sticky top-[77px] hidden h-[calc(100vh-77px)] w-[245px] shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
          <div className="mb-4 px-3 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Administração SaaS
            </p>
          </div>
          <nav className="space-y-1">
            {menuVisivel.map(({ id, label, Icone }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPagina(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                  pagina === id
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icone size={18} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-7 lg:px-8 lg:py-9">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                <Gauge size={13} />
                PrecificaCont Control
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {tituloPagina}
              </h2>
            </div>

            <div className="flex gap-2 overflow-x-auto lg:hidden">
              {menuVisivel.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setPagina(id)}
                  className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold ${
                    pagina === id
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {erro ? (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              <span>{erro}</span>
              <button onClick={() => setErro("")}><X size={16} /></button>
            </div>
          ) : null}

          {sucesso ? (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <span>{sucesso}</span>
              <button onClick={() => setSucesso("")}><X size={16} /></button>
            </div>
          ) : null}

          {carregando ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
              <Loader2 className="animate-spin text-blue-600" size={30} />
            </div>
          ) : (
            <>
              {pagina === "dashboard" ? (
                <Dashboard
                  escritorios={escritoriosPermitidos}
                  resumo={resumo}
                  saude={saude}
                  usuarios={usuarios}
                  abrirCliente={setEscritorioSelecionado}
                />
              ) : null}

              {pagina === "clientes" ? (
                <Clientes
                  clientes={clientesFiltradosPermitidos}
                  busca={busca}
                  setBusca={setBusca}
                  filtroStatus={filtroStatus}
                  setFiltroStatus={setFiltroStatus}
                  usuarios={usuarios}
                  saude={saude}
                  planos={planosSaas}
                  abrirCliente={(escritorio) => {
                    setEscritorioSelecionado(escritorio);
                    setEditandoEscritorio(false);
                    setPagina("cliente_detalhe");
                  }}
                  editarCliente={(escritorio) => {
                    const completo = escritorios.find((item) => item.id === escritorio.id) || escritorio;
                    setEscritorioSelecionado(completo);
                    setEditandoEscritorio(true);
                    setPagina("cliente_detalhe");
                  }}
                  novoCliente={() => setModalCliente(true)}
                  alterarStatus={alterarStatusCliente}
                  excluirCliente={podeGerenciarEquipe ? excluirCliente : null}
                  podeExcluirCliente={podeGerenciarEquipe}
                  exportarCSV={exportarCSV}
                />
              ) : null}

              {pagina === "cliente_detalhe" && escritorioSelecionado ? (
                <FichaEscritorio
                  escritorio={escritorioSelecionado}
                  usuarios={usuariosDoEscritorio(escritorioSelecionado.id)}
                  cobrancas={cobrancasDoEscritorio(escritorioSelecionado.id)}
                  eventos={eventosDoEscritorio(escritorioSelecionado.id)}
                  saude={saudePorEscritorio(escritorioSelecionado.id)}
                  fechar={() => {
                    setEscritorioSelecionado(null);
                    setEditandoEscritorio(false);
                    setPagina("clientes");
                  }}
                  editando={editandoEscritorio}
                  setEditando={setEditandoEscritorio}
                  salvar={salvarEscritorio}
                  salvando={salvando}
                  acessar={() => acessarAmbiente(escritorioSelecionado)}
                  alterarStatus={(status) => alterarStatusCliente(escritorioSelecionado, status)}
                  excluir={() => excluirCliente(escritorioSelecionado)}
                  planos={planosSaas}
                  modulos={modulosSaas}
                  planoModulos={planoModulos}
                  modulosCliente={escritorioModulos.filter(
                    (item) => item.escritorio_id === escritorioSelecionado.id && item.ativo
                  )}
                  criarUsuario={criarUsuarioCliente}
                  atualizarUsuario={atualizarUsuarioCliente}
                  atualizarAcessoUsuario={atualizarAcessoUsuarioCliente}
                  excluirUsuario={excluirUsuarioCliente}
                  podeExcluirUsuario={podeGerenciarEquipe}
                  podeExcluir={podeGerenciarEquipe}
                  embutido
                />
              ) : null}

              {pagina === "bi" ? (
                <BI
                  escritorios={escritoriosPermitidos}
                  saude={saude}
                  eventos={eventos}
                  usuarios={usuarios}
                  cobrancas={cobrancasPermitidas}
                  resumo={resumo}
                  abrirCliente={(e) => {
                    setEscritorioSelecionado(e);
                    setEditandoEscritorio(false);
                    setPagina("cliente_detalhe");
                  }}
                  planos={planosSaas}
                />
              ) : null}

              {pagina === "financeiro" ? (
                <Financeiro
                  resumo={resumo}
                  cobrancas={cobrancasPermitidas}
                  escritorios={escritoriosPermitidos}
                  novaCobranca={() => setModalCobranca(true)}
                  alterarStatus={alterarStatusCobranca}
                  exportarCSV={exportarCSV}
                />
              ) : null}

              {pagina === "equipe" ? (
                <Equipe
                  equipe={usuariosPlataforma}
                  carteiras={carteiras}
                  escritorios={escritorios}
                  usuarioAtual={perfilPlataforma}
                  novoColaborador={() => setModalEquipe(true)}
                  alternarEquipe={alternarEquipe}
                  salvarPermissoesEquipe={salvarPermissoesEquipe}
                  definirSenhaColaborador={definirSenhaColaborador}
                  salvarCarteiraColaborador={salvarCarteiraColaborador}
                  removerClienteDaCarteira={removerClienteDaCarteira}
                  salvando={salvando}
                />
              ) : null}

              {pagina === "configuracoes" && ehOwner ? (
                <Configuracoes
                  perfil={perfilPlataforma}
                  logs={logs}
                  acessos={acessos}
                  historico={historico}
                  nomeEscritorio={nomeEscritorio}
                  planos={planosSaas}
                  modulos={modulosSaas}
                  planoModulos={planoModulos}
                  salvarPlano={salvarPlanoSaas}
                  alternarModulo={alternarModuloPlano}
                  salvarModulo={salvarModuloSaas}
                  equipe={usuariosPlataforma}
                  carteiras={carteiras}
                  salvarPermissoesEquipe={salvarPermissoesEquipe}
                  salvando={salvando}
                />
              ) : null}
            </>
          )}
        </main>
      </div>

      {modalCliente ? (
        <ModalCliente
          fechar={() => setModalCliente(false)}
          salvar={criarCliente}
          salvando={salvando}
          planos={planosSaas}
          modulos={modulosSaas}
          planoModulos={planoModulos}
          equipe={usuariosPlataforma}
          usuarioAtual={perfilPlataforma}
        />
      ) : null}

      {modalCobranca ? (
        <ModalCobranca
          fechar={() => setModalCobranca(false)}
          salvar={criarCobranca}
          salvando={salvando}
          escritorios={escritorios}
        />
      ) : null}

      {modalEquipe ? (
        <ModalEquipe
          fechar={() => setModalEquipe(false)}
          salvar={cadastrarEquipe}
          salvando={salvando}
        />
      ) : null}
    </div>
  );
}

function Dashboard({ escritorios, resumo, saude, usuarios, abrirCliente }) {
  const emRisco = saude.filter((s) => s.classificacao === "risco").length;
  const semUso = escritorios.filter((e) => {
    if (!e.ultimo_acesso_em) return true;
    return Date.now() - new Date(e.ultimo_acesso_em).getTime() > 7 * 86400000;
  }).length;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <CardKPI titulo="Escritórios" valor={escritorios.length} Icone={Building2} />
        <CardKPI titulo="Ativos" valor={resumo.ativos} Icone={ShieldCheck} />
        <CardKPI titulo="Em teste" valor={resumo.testes} Icone={Gauge} />
        <CardKPI titulo="Inativos / risco" valor={resumo.inativos} Icone={TrendingDown} />
        <CardKPI titulo="MRR" valor={moeda(resumo.mrr)} Icone={CircleDollarSign} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardKPI titulo="ARR projetado" valor={moeda(resumo.arr)} Icone={TrendingUp} />
        <CardKPI titulo="Ticket médio" valor={moeda(resumo.ticket)} Icone={DollarSign} />
        <CardKPI titulo="Usuários ativos" valor={resumo.usuariosAtivos} Icone={Users} />
        <CardKPI titulo="Sem uso há +7 dias" valor={semUso} detalhe={`${emRisco} classificados em risco`} Icone={Activity} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-lg font-black">Clientes SaaS</h3>
            <p className="mt-1 text-sm text-slate-500">
              Visão rápida da base contratante.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {escritorios.slice(0, 8).map((e) => (
              <button
                key={e.id}
                onClick={() => abrirCliente(e)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50"
              >
                <div>
                  <p className="font-bold">{e.nome_fantasia || e.nome}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {usuarios.filter((u) => u.escritorio_id === e.id && u.ativo !== false).length} usuários • {e.plano || "Sem plano"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tipo={e.status_assinatura}>{e.status_assinatura || "—"}</Badge>
                  <ChevronRight size={17} className="text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black">Radar da operação</h3>
          <p className="mt-1 text-sm text-slate-500">Pontos que pedem atenção.</p>
          <div className="mt-5 space-y-3">
            <RadarItem label="Clientes em teste" valor={resumo.testes} tipo="blue" />
            <RadarItem label="Clientes inativos / suspensos" valor={resumo.inativos} />
            <RadarItem label="Clientes em risco de uso" valor={emRisco} />
            <RadarItem label="Sem acesso recente" valor={semUso} />
            <RadarItem label="Valores vencidos" valor={moeda(resumo.vencidos)} />
          </div>
        </div>
      </div>
    </>
  );
}

function RadarItem({ label, valor }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span className="font-black text-slate-950">{valor}</span>
    </div>
  );
}

function Clientes({
  clientes,
  busca,
  setBusca,
  filtroStatus,
  setFiltroStatus,
  usuarios,
  saude,
  planos = [],
  abrirCliente,
  editarCliente,
  novoCliente,
  alterarStatus,
  excluirCliente,
  podeExcluirCliente = false,
  exportarCSV,
}) {
  const gerarRelatorioClientes = () => {
    const linhas = clientes.map((e) => {
      const planoSelecionado = planos.find((p) => p.id === e.plano_saas_id);
      const usuariosEmpresa = usuarios.filter((u) => u.escritorio_id === e.id);

      return {
        Empresa: e.nome_fantasia || e.nome || "",
        "CNPJ / CPF": formatarDocumento(
          e.documento || e.cnpj || "",
          e.tipo_documento || "cnpj"
        ),
        Plano: planoSelecionado?.nome || e.plano || "Sem plano",
        Mensalidade: Number(e.valor_mensal || 0),
        Status: e.status_assinatura || "",
        "Qtd. usuários": usuariosEmpresa.length,
        Usuários: usuariosEmpresa.map((u) => u.nome || "Usuário").join(", "),
        Perfis: usuariosEmpresa
          .map((u) => `${u.nome || "Usuário"}: ${u.perfil || u.cargo || "Sem perfil"}`)
          .join(" | "),
      };
    });

    if (!linhas.length) {
      setErro("Não há clientes para gerar o relatório.");
      return;
    }

    const planilha = XLSX.utils.json_to_sheet(linhas);
    planilha["!cols"] = [
      { wch: 32 },
      { wch: 20 },
      { wch: 18 },
      { wch: 15 },
      { wch: 14 },
      { wch: 14 },
      { wch: 38 },
      { wch: 48 },
    ];

    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, "Clientes");
    XLSX.writeFile(
      livro,
      `relatorio-clientes-precificacont-${hojeISO()}.xlsx`
    );
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <h3 className="text-lg font-black">Clientes da plataforma</h3>
          <p className="mt-1 text-sm text-slate-500">
            Gestão completa dos escritórios contratantes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={gerarRelatorioClientes}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <FileBarChart size={15} />
            Gerar relatório
          </button>
          <button onClick={novoCliente} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">
            + Novo cliente
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente..." className="h-10 rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-400" />
        </div>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold">
          <option value="todos">Todos os status</option>
          {["teste","ativo","inativo","suspenso","inadimplente","cancelado"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
            <tr>
              <th className="px-6 py-3">Escritório</th><th className="px-6 py-3">Plano</th>
              <th className="px-6 py-3">Mensalidade</th><th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Saúde</th><th className="px-6 py-3">Usuários</th>
              <th className="px-6 py-3">Último acesso</th><th className="px-6 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clientes.map((e) => {
              const health = saude.find((s) => s.escritorio_id === e.id);
              const qtd = usuarios.filter((u) => u.escritorio_id === e.id && u.ativo !== false).length;
              return (
                <tr
                  key={e.id}
                  onClick={() => abrirCliente(e)}
                  className="cursor-pointer text-sm hover:bg-blue-50/40"
                  title="Abrir empresa"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold">{e.nome_fantasia || e.nome}</p><p className="mt-1 text-xs text-slate-400">{e.id}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    {planos.find((p) => p.id === e.plano_saas_id)?.nome ||
                      planos.find(
                        (p) =>
                          String(p.codigo || "").toLowerCase() === String(e.plano || "").toLowerCase() ||
                          String(p.nome || "").toLowerCase() === String(e.plano || "").toLowerCase()
                      )?.nome ||
                      e.plano ||
                      "—"}
                  </td>
                  <td className="px-6 py-4 font-bold">{moeda(e.valor_mensal)}</td>
                  <td className="px-6 py-4"><Badge tipo={e.status_assinatura}>{e.status_assinatura || "—"}</Badge></td>
                  <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${saudeClasses[health?.classificacao || "sem_dados"]}`}>{health ? `${health.classificacao.replace("_"," ")} • ${health.score}` : "Sem dados"}</span></td>
                  <td className="px-6 py-4 font-bold">{qtd}</td>
                  <td className="px-6 py-4 text-slate-500">{dataBR(e.ultimo_acesso_em || health?.ultimo_acesso_em)}</td>
                  <td className="px-6 py-4" onClick={(evento) => evento.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => abrirCliente(e)}
                        className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white"
                      >
                        Abrir empresa
                      </button>
                      
                      <select value={e.status_assinatura || "teste"} onChange={(ev) => alterarStatus(e, ev.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold">
                        {["teste","ativo","inativo","suspenso","inadimplente","cancelado"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {podeExcluirCliente ? (
                        <button onClick={() => excluirCliente(e)} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600">Excluir</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BI({ escritorios, saude, eventos, usuarios, cobrancas, resumo, abrirCliente, planos = [] }) {
  const [mostrarPersonalizado, setMostrarPersonalizado] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState("clientes");
  const [statusRelatorio, setStatusRelatorio] = useState("todos");

  const ranking = escritorios
    .map((e) => ({ ...e, health: saude.find((x) => x.escritorio_id === e.id) }))
    .sort((a, b) => Number(b.health?.score || 0) - Number(a.health?.score || 0));

  const totalBase = Math.max(escritorios.length, 1);
  const saudaveis = saude.filter((x) => x.classificacao === "saudavel").length;
  const atencao = saude.filter((x) => x.classificacao === "atencao").length;
  const risco = saude.filter((x) => x.classificacao === "risco").length;
  const semDados = Math.max(escritorios.length - saudaveis - atencao - risco, 0);

  const baseStatus = [
    { label: "Ativos", valor: resumo.ativos },
    { label: "Em teste", valor: resumo.testes },
    { label: "Inativos", valor: resumo.inativos },
  ];

  const uso = [
    { label: "Eventos capturados", valor: eventos.length },
    { label: "Usuários ativos", valor: resumo.usuariosAtivos },
    { label: "Cobranças", valor: cobrancas.length },
    { label: "Clientes com Health Score", valor: saude.length },
  ];
  const maxUso = Math.max(...uso.map((x) => x.valor), 1);

  const linhasClientes = () =>
    ranking
      .filter((e) => statusRelatorio === "todos" || e.status_assinatura === statusRelatorio)
      .map((e) => ({
        Cliente: e.nome_fantasia || e.nome || "",
        Plano: planos.find((p) => p.id === e.plano_saas_id)?.nome || e.plano || "Sem plano",
        Status: e.status_assinatura || "",
        Mensalidade: Number(e.valor_mensal || 0),
        "Health Score": e.health?.score ?? 0,
        Saúde: e.health?.classificacao || "sem_dados",
        "Acessos 7d": e.health?.acessos_7d ?? 0,
        "Acessos 30d": e.health?.acessos_30d ?? 0,
        "Simulações 30d": e.health?.simulacoes_30d ?? 0,
        "Propostas 30d": e.health?.propostas_30d ?? 0,
        "Usuários ativos": usuarios.filter((u) => u.escritorio_id === e.id && u.ativo !== false).length,
        "Último acesso": e.health?.ultimo_acesso_em || e.ultimo_acesso_em || "",
      }));

  const linhasFinanceiro = () =>
    cobrancas
      .filter((c) => statusRelatorio === "todos" || c.status === statusRelatorio)
      .map((c) => {
        const e = escritorios.find((x) => x.id === c.escritorio_id);
        return {
          Empresa: e?.nome_fantasia || e?.nome || "—",
          Descrição: c.descricao || "Mensalidade PrecificaCont",
          Competência: c.competencia || "",
          Vencimento: c.vencimento || "",
          Valor: Number(c.valor || 0),
          Status: c.status || "",
          "Pago em": c.pago_em || "",
          "Valor pago": Number(c.valor_pago || 0),
        };
      });

  const linhasUsuarios = () =>
    usuarios.map((u) => {
      const e = escritorios.find((x) => x.id === u.escritorio_id);
      return {
        Usuário: u.nome || "",
        Empresa: e?.nome_fantasia || e?.nome || "",
        Perfil: u.perfil || "",
        Cargo: u.cargo || "",
        Status: u.ativo === false ? "Inativo" : "Ativo",
      };
    });

  const linhasIndicadores = () => [
    { Indicador: "Base total", Valor: escritorios.length },
    { Indicador: "Clientes ativos", Valor: resumo.ativos },
    { Indicador: "Clientes em teste", Valor: resumo.testes },
    { Indicador: "Clientes inativos", Valor: resumo.inativos },
    { Indicador: "MRR", Valor: resumo.mrr },
    { Indicador: "ARR", Valor: resumo.arr },
    { Indicador: "Ticket médio", Valor: resumo.ticket },
    { Indicador: "Recebido", Valor: resumo.pagos },
    { Indicador: "Pendente", Valor: resumo.pendentes },
    { Indicador: "Atrasado", Valor: resumo.vencidos },
    { Indicador: "Usuários ativos", Valor: resumo.usuariosAtivos },
    { Indicador: "Eventos de uso", Valor: eventos.length },
    { Indicador: "Saudáveis", Valor: saudaveis },
    { Indicador: "Em atenção", Valor: atencao },
    { Indicador: "Em risco", Valor: risco },
  ];

  const gerarPersonalizado = () => {
    if (tipoRelatorio === "clientes") {
      exportarXLSX("bi-clientes-personalizado", "Clientes", linhasClientes(), [30,18,16,15,14,16,12,12,15,15,15,20]);
      return;
    }
    if (tipoRelatorio === "financeiro") {
      exportarXLSX("bi-financeiro-personalizado", "Financeiro", linhasFinanceiro(), [30,30,14,14,15,15,18,15]);
      return;
    }
    if (tipoRelatorio === "usuarios") {
      exportarXLSX("bi-usuarios-personalizado", "Usuários", linhasUsuarios(), [28,30,20,20,14]);
      return;
    }
    exportarXLSX("bi-indicadores-personalizado", "Indicadores", linhasIndicadores(), [30,20]);
  };

  const gerarRelatorioCompleto = () => {
    const wb = XLSX.utils.book_new();

    const adicionar = (nome, linhas, larguras) => {
      const ws = XLSX.utils.json_to_sheet(linhas);
      ws["!cols"] = larguras.map((wch) => ({ wch }));
      XLSX.utils.book_append_sheet(wb, ws, nome);
    };

    adicionar("Resumo executivo", linhasIndicadores(), [30,20]);
    adicionar("Clientes e uso", linhasClientes(), [30,18,16,15,14,16,12,12,15,15,15,20]);
    adicionar("Financeiro", linhasFinanceiro(), [30,30,14,14,15,15,18,15]);
    adicionar("Usuários", linhasUsuarios(), [28,30,20,20,14]);

    XLSX.writeFile(wb, `bi-completo-precificacont-${hojeISO()}.xlsx`);
  };

  const statusOptions =
    tipoRelatorio === "financeiro"
      ? [["todos","Todos"],["pago","Pago"],["pendente","Pendente"],["vencido","Atrasado"],["cancelado","Cancelado"]]
      : [["todos","Todos"],["ativo","Ativo"],["trial","Teste"],["suspenso","Suspenso"],["cancelado","Cancelado"]];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Visão executiva da operação, receita, saúde e utilização da plataforma.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMostrarPersonalizado((v) => !v)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm"
          >
            Relatório personalizado
          </button>
          <button
            onClick={gerarRelatorioCompleto}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white"
          >
            Gerar relatório completo
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <CardKPI titulo="Base total" valor={escritorios.length} Icone={Building2} />
        <CardKPI titulo="MRR" valor={moeda(resumo.mrr)} Icone={CircleDollarSign} />
        <CardKPI titulo="ARR" valor={moeda(resumo.arr)} Icone={TrendingUp} />
        <CardKPI titulo="Ticket médio" valor={moeda(resumo.ticket)} Icone={CreditCard} />
        <CardKPI titulo="Em risco" valor={risco} Icone={TrendingDown} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-black">Distribuição da base</h3>
            <p className="mt-1 text-sm text-slate-500">Situação atual dos clientes do PrecificaCont.</p>
          </div>
          <div className="mt-6 space-y-5">
            {baseStatus.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">{item.label}</span>
                  <span className="font-black text-slate-900">{item.valor}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${Math.max((item.valor / totalBase) * 100, item.valor ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-black">Saúde da carteira</h3>
            <p className="mt-1 text-sm text-slate-500">Distribuição dos clientes pelo Health Score.</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Saudáveis</p><p className="mt-2 text-3xl font-black">{saudaveis}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Atenção</p><p className="mt-2 text-3xl font-black">{atencao}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Em risco</p><p className="mt-2 text-3xl font-black">{risco}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sem dados</p><p className="mt-2 text-3xl font-black">{semDados}</p></div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black">Utilização da plataforma</h3>
          <p className="mt-1 text-sm text-slate-500">Volume registrado nos principais indicadores de uso.</p>
          <div className="mt-6 space-y-5">
            {uso.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">{item.label}</span>
                  <span className="font-black">{item.valor}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-800" style={{ width: `${Math.max((item.valor / maxUso) * 100, item.valor ? 5 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black">Resumo financeiro</h3>
          <p className="mt-1 text-sm text-slate-500">Receita recorrente e situação das cobranças.</p>
          <div className="mt-5 space-y-3">
            <RadarItem label="MRR atual" valor={moeda(resumo.mrr)} />
            <RadarItem label="ARR projetado" valor={moeda(resumo.arr)} />
            <RadarItem label="Recebido" valor={moeda(resumo.pagos)} />
            <RadarItem label="Pendente" valor={moeda(resumo.pendentes)} />
            <RadarItem label="Atrasado" valor={moeda(resumo.vencidos)} />
            <RadarItem label="Inadimplência" valor={`${resumo.inadimplencia.toFixed(1)}%`} />
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-black">BI de clientes e utilização</h3>
          <p className="mt-1 text-sm text-slate-500">Saúde, adoção e atividade por escritório.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
              <tr>
                <th className="px-6 py-3">Cliente</th><th className="px-6 py-3">Score</th><th className="px-6 py-3">Saúde</th>
                <th className="px-6 py-3">Acessos 30d</th><th className="px-6 py-3">Simulações</th><th className="px-6 py-3">Propostas</th>
                <th className="px-6 py-3">Usuários</th><th className="px-6 py-3">Último acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranking.map((e) => (
                <tr key={e.id} onClick={() => abrirCliente(e)} className="cursor-pointer text-sm hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold">{e.nome_fantasia || e.nome}</td>
                  <td className="px-6 py-4 font-black">{e.health?.score ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${saudeClasses[e.health?.classificacao || "sem_dados"]}`}>
                      {(e.health?.classificacao || "sem_dados").replace("_"," ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">{e.health?.acessos_30d ?? 0}</td>
                  <td className="px-6 py-4">{e.health?.simulacoes_30d ?? 0}</td>
                  <td className="px-6 py-4">{e.health?.propostas_30d ?? 0}</td>
                  <td className="px-6 py-4">{usuarios.filter((u) => u.escritorio_id === e.id && u.ativo !== false).length}</td>
                  <td className="px-6 py-4">{dataBR(e.health?.ultimo_acesso_em || e.ultimo_acesso_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarPersonalizado ? (
        <div className="mt-6 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">Criar relatório personalizado</h3>
              <p className="mt-1 text-sm text-slate-500">Escolha a área e os filtros. O BI acima permanece completo.</p>
            </div>
            <button onClick={() => setMostrarPersonalizado(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">Fechar</button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="text-xs font-bold text-slate-600">Quero analisar
              <select value={tipoRelatorio} onChange={(e) => { setTipoRelatorio(e.target.value); setStatusRelatorio("todos"); }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                <option value="clientes">Clientes + utilização</option>
                <option value="financeiro">Financeiro / cobranças</option>
                <option value="usuarios">Usuários</option>
                <option value="indicadores">Indicadores executivos</option>
              </select>
            </label>
            {(tipoRelatorio === "clientes" || tipoRelatorio === "financeiro") ? (
              <label className="text-xs font-bold text-slate-600">Status
                <select value={statusRelatorio} onChange={(e) => setStatusRelatorio(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                  {statusOptions.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            ) : <div />}
            <div className="flex items-end">
              <button onClick={gerarPersonalizado} className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">Gerar Excel personalizado</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Financeiro({ resumo, cobrancas, escritorios, novaCobranca, alterarStatus }) {
  const [abaFinanceiro, setAbaFinanceiro] = useState("visao");

  const nomeCliente = (id) => {
    const e = escritorios.find((x) => x.id === id);
    return e?.nome_fantasia || e?.nome || "—";
  };

  const cobrancasOrdenadas = [...cobrancas].sort((a, b) =>
    String(b.vencimento || "").localeCompare(String(a.vencimento || ""))
  );
  const inadimplentes = cobrancasOrdenadas.filter((c) => c.status === "vencido");

  const gerarRelatorioFinanceiro = () => {
    const linhas = cobrancasOrdenadas.map((c) => ({
      Empresa: nomeCliente(c.escritorio_id),
      Descrição: c.descricao || "Mensalidade PrecificaCont",
      Competência: c.competencia || "",
      Vencimento: c.vencimento || "",
      Valor: Number(c.valor || 0),
      Status: c.status || "",
      "Pago em": c.pago_em || "",
      "Valor pago": Number(c.valor_pago || 0),
    }));

    if (!linhas.length) return;

    const ws = XLSX.utils.json_to_sheet(linhas);
    ws["!cols"] = [
      { wch: 30 }, { wch: 30 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
    XLSX.writeFile(wb, `financeiro-precificacont-${hojeISO()}.xlsx`);
  };

  const abas = [
    ["visao", "Visão geral"],
    ["cobrancas", "Cobranças"],
    ["inadimplencia", "Inadimplência"],
    ["relatorios", "Relatórios"],
  ];

  const tabela = (lista) => lista.length ? (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1050px] text-left">
        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
          <tr>
            <th className="px-6 py-3">Empresa</th>
            <th className="px-6 py-3">Descrição</th>
            <th className="px-6 py-3">Vencimento</th>
            <th className="px-6 py-3">Valor</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Pagamento</th>
            <th className="px-6 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lista.map((c) => (
            <tr key={c.id} className="text-sm">
              <td className="px-6 py-4 font-bold">{nomeCliente(c.escritorio_id)}</td>
              <td className="px-6 py-4">{c.descricao || "Mensalidade PrecificaCont"}</td>
              <td className="px-6 py-4">{dataBR(c.vencimento)}</td>
              <td className="px-6 py-4 font-black">{moeda(c.valor)}</td>
              <td className="px-6 py-4"><Badge tipo={c.status}>{c.status}</Badge></td>
              <td className="px-6 py-4 text-xs text-slate-500">
                {c.status === "pago" ? dataBR(c.pago_em) : "—"}
              </td>
              <td className="px-6 py-4">
                <select
                  value={c.status}
                  onChange={(ev) => alterarStatus(c, ev.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="vencido">Atrasado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="estornado">Estornado</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Vazio titulo="Nenhuma cobrança registrada" texto="Quando houver cobranças, elas aparecerão aqui." />
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            Estrutura financeira do SaaS preparada para futura integração com gateway.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={gerarRelatorioFinanceiro}
            disabled={!cobrancas.length}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Gerar relatório Excel
          </button>
          <button onClick={novaCobranca} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">
            + Nova cobrança
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {abas.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setAbaFinanceiro(id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${
              abaFinanceiro === id
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {abaFinanceiro === "visao" ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardKPI titulo="MRR atual" valor={moeda(resumo.mrr)} Icone={CircleDollarSign} />
            <CardKPI titulo="Recebido" valor={moeda(resumo.pagos)} Icone={CreditCard} />
            <CardKPI titulo="Pendente" valor={moeda(resumo.pendentes)} Icone={WalletCards} />
            <CardKPI titulo="Atrasado" valor={moeda(resumo.vencidos)} Icone={TrendingDown} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardKPI titulo="Em aberto" valor={moeda(resumo.emAberto)} Icone={DollarSign} />
            <CardKPI titulo="Ticket médio" valor={moeda(resumo.ticket)} Icone={TrendingUp} />
            <CardKPI titulo="Clientes ativos" valor={resumo.ativos} Icone={Building2} />
            <CardKPI titulo="Inadimplência" valor={`${resumo.inadimplencia.toFixed(1)}%`} Icone={CircleDollarSign} />
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h3 className="text-lg font-black">Últimas cobranças</h3>
              <p className="mt-1 text-sm text-slate-500">Visão rápida das cobranças mais recentes.</p>
            </div>
            {tabela(cobrancasOrdenadas.slice(0, 8))}
          </div>
        </>
      ) : null}

      {abaFinanceiro === "cobrancas" ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-lg font-black">Cobranças</h3>
            <p className="mt-1 text-sm text-slate-500">Controle manual enquanto o gateway não estiver integrado.</p>
          </div>
          {tabela(cobrancasOrdenadas)}
        </div>
      ) : null}

      {abaFinanceiro === "inadimplencia" ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-lg font-black">Inadimplência</h3>
            <p className="mt-1 text-sm text-slate-500">
              {inadimplentes.length} cobrança(s) em atraso • {moeda(resumo.vencidos)} em aberto.
            </p>
          </div>
          {inadimplentes.length
            ? tabela(inadimplentes)
            : <Vazio titulo="Nenhuma cobrança atrasada" texto="Não há inadimplência registrada no momento." />}
        </div>
      ) : null}

      {abaFinanceiro === "relatorios" ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black">Relatório financeiro</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Exporte as cobranças registradas com empresa, competência, vencimento, valor, status e pagamento.
          </p>
          <button
            onClick={gerarRelatorioFinanceiro}
            disabled={!cobrancas.length}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Gerar Excel financeiro
          </button>
          {!cobrancas.length ? (
            <p className="mt-3 text-xs text-slate-400">Nenhuma cobrança registrada para exportar.</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function Equipe({ equipe, carteiras, escritorios, usuarioAtual, novoColaborador, alternarEquipe, salvarPermissoesEquipe, definirSenhaColaborador, salvarCarteiraColaborador, removerClienteDaCarteira, salvando }) {
  const [abertoId, setAbertoId] = useState(null);
  const editaveis = equipe.filter((u) => u.perfil !== "owner");
  const aberto = editaveis.find((u) => u.id === abertoId) || null;
  const podeGerenciar = usuarioAtual?.perfil === "owner" || Boolean(usuarioAtual?.pode_gerenciar_equipe);

  if (aberto) {
    return (
      <FichaColaborador
        usuario={aberto}
        carteiras={carteiras}
        escritorios={escritorios}
        salvar={salvarPermissoesEquipe}
        definirSenha={definirSenhaColaborador}
        podeGerenciarCredenciais={usuarioAtual?.perfil === "owner"}
        salvarCarteira={salvarCarteiraColaborador}
        removerCliente={removerClienteDaCarteira}
        alternarEquipe={alternarEquipe}
        salvando={salvando}
        fechar={() => setAbertoId(null)}
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Gerencie colaboradores, carteira e permissões operacionais.</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">O Owner é protegido e não aparece como usuário editável.</p>
        </div>
        {podeGerenciar ? <button onClick={novoColaborador} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">+ Novo colaborador</button> : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CardKPI titulo="Colaboradores" valor={editaveis.filter(u => u.ativo !== false).length} Icone={Users} />
        <CardKPI titulo="Carteiras atribuídas" valor={carteiras.length} Icone={Building2} />
        <CardKPI titulo="Clientes sem carteira" valor={Math.max(0, escritorios.length - new Set(carteiras.map(c => c.escritorio_id)).size)} Icone={UserRound} />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-black">Equipe PrecificaCont</h3>
          <p className="mt-1 text-sm text-slate-500">Abra um colaborador para consultar e alterar o acesso dele.</p>
        </div>
        {editaveis.length ? <div className="divide-y divide-slate-100">{editaveis.map(u => {
          const qtd = carteiras.filter(c => c.usuario_plataforma_id === u.id).length;
          return <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div>
              <p className="font-bold">{u.nome || u.email || "Usuário"}</p>
              <p className="mt-1 text-xs text-slate-400">{u.cargo || "Sem cargo"} • <span className="capitalize">{String(u.perfil || "").replaceAll("_"," ")}</span> • {qtd} clientes</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tipo={u.ativo !== false ? "ativo" : "inativo"}>{u.ativo !== false ? "Ativo" : "Inativo"}</Badge>
              {podeGerenciar ? <button onClick={() => setAbertoId(u.id)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Abrir usuário</button> : null}
            </div>
          </div>;
        })}</div> : <Vazio titulo="Nenhum colaborador" texto="Cadastre o primeiro colaborador da equipe." />}
      </div>
    </>
  );
}

function FichaColaborador({ usuario, carteiras, escritorios, salvar, definirSenha, podeGerenciarCredenciais, salvarCarteira, removerCliente, alternarEquipe, salvando, fechar }) {
  const [f, setF] = useState({
    nome: usuario.nome || "",
    email: usuario.email || "",
    perfil: usuario.perfil || "comercial",
    cargo: usuario.cargo || "",
    pode_ver_todos_clientes: Boolean(usuario.pode_ver_todos_clientes),
    pode_ver_financeiro: Boolean(usuario.pode_ver_financeiro),
    pode_acessar_cliente: Boolean(usuario.pode_acessar_cliente),
    pode_gerenciar_equipe: Boolean(usuario.pode_gerenciar_equipe),
  });
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const vinculos = carteiras.filter(c => c.usuario_plataforma_id === usuario.id && c.tipo_responsabilidade === "comercial");
  const clientes = vinculos.map(v => escritorios.find(e => e.id === v.escritorio_id)).filter(Boolean);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [editandoCarteira, setEditandoCarteira] = useState(false);
  const [clientesSelecionados, setClientesSelecionados] = useState(() => vinculos.map(v => v.escritorio_id));
  const alternarCliente = (id) => setClientesSelecionados(lista =>
    lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id]
  );

  return <div>
    <button onClick={fechar} className="inline-flex items-center gap-2 text-sm font-black text-slate-600"><ArrowLeft size={16}/> Voltar para equipe</button>

    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">Colaborador</p>
          <h3 className="mt-2 text-2xl font-black">{f.nome || usuario.nome || usuario.email}</h3>
          <p className="mt-1 text-sm text-slate-500">Dados, carteira e permissões do colaborador.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tipo={usuario.ativo !== false ? "ativo" : "inativo"}>{usuario.ativo !== false ? "Ativo" : "Inativo"}</Badge>
          <button onClick={()=>alternarEquipe(usuario)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black">{usuario.ativo !== false ? "Inativar" : "Ativar"}</button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo label="Nome *"><input className="input-control" value={f.nome} onChange={e=>set("nome",e.target.value)} /></Campo>
        <Campo label="E-mail *"><input className="input-control" type="email" value={f.email} onChange={e=>set("email",e.target.value)} /></Campo>
        <Campo label="Perfil">
          <select className="input-control" value={f.perfil} onChange={e=>set("perfil",e.target.value)}>
            <option value="admin">Administrador</option>
            <option value="gestor">Gestor</option>
            <option value="comercial">Comercial</option>
            <option value="customer_success">Customer Success</option>
            <option value="suporte">Suporte</option>
            <option value="financeiro">Financeiro</option>
            <option value="leitura">Somente leitura</option>
            <option value="operador">Operador</option>
          </select>
        </Campo>
        <Campo label="Cargo"><input className="input-control" value={f.cargo} onChange={e=>set("cargo",e.target.value)} /></Campo>
      </div>

      {podeGerenciarCredenciais ? (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-900">Acesso ao sistema</p>
              <p className="mt-1 text-xs text-slate-500">Defina ou redefina a senha de acesso deste colaborador.</p>
            </div>
            <Badge tipo={usuario.user_id ? "ativo" : "inativo"}>{usuario.user_id ? "Login vinculado" : "Login não vinculado"}</Badge>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo label="Login">
              <input className="input-control bg-slate-50" value={f.email || ""} readOnly />
            </Campo>
            <Campo label="Status do acesso">
              <input className="input-control bg-slate-50" value={usuario.user_id ? (usuario.ativo !== false ? "Ativo" : "Inativo") : "Aguardando vínculo no Authentication"} readOnly />
            </Campo>
            <Campo label="Nova senha temporária">
              <input
                className="input-control"
                type={mostrarSenha ? "text" : "password"}
                value={novaSenha}
                onChange={(e)=>setNovaSenha(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
              />
            </Campo>
            <Campo label="Confirmar nova senha">
              <input
                className="input-control"
                type={mostrarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e)=>setConfirmarSenha(e.target.value)}
                placeholder="Digite novamente"
                autoComplete="new-password"
              />
            </Campo>
          </div>

          <label className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input type="checkbox" checked={mostrarSenha} onChange={(e)=>setMostrarSenha(e.target.checked)} />
            Mostrar senha enquanto digito
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={salvando || !usuario.user_id}
              onClick={async()=>{
                if (novaSenha.length < 8) { window.alert("A senha deve possuir pelo menos 8 caracteres."); return; }
                if (novaSenha !== confirmarSenha) { window.alert("As senhas não conferem."); return; }
                const confirmar = window.confirm(`Definir uma nova senha de acesso para ${usuario.nome || usuario.email}?`);
                if (!confirmar) return;
                const ok = await definirSenha(usuario,novaSenha);
                if (ok) { setNovaSenha(""); setConfirmarSenha(""); setMostrarSenha(false); }
              }}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Definir/Redefinir senha"}
            </button>
            {!usuario.user_id ? <p className="text-xs font-semibold text-amber-700">Vincule primeiro este colaborador ao Supabase Authentication.</p> : null}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-slate-400">A senha é enviada somente para a função segura do Supabase e não é salva na tabela de colaboradores.</p>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-black">Escopo da carteira</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={`rounded-xl border p-4 ${!f.pode_ver_todos_clientes?'border-blue-300 bg-blue-50':'border-slate-200'}`}>
            <input type="radio" checked={!f.pode_ver_todos_clientes} onChange={()=>set("pode_ver_todos_clientes",false)} />
            <span className="ml-2 text-sm font-black">Minha carteira</span>
            <p className="mt-1 pl-5 text-xs text-slate-500">Vê somente clientes atribuídos a este colaborador.</p>
          </label>
          <label className={`rounded-xl border p-4 ${f.pode_ver_todos_clientes?'border-blue-300 bg-blue-50':'border-slate-200'}`}>
            <input type="radio" checked={f.pode_ver_todos_clientes} onChange={()=>set("pode_ver_todos_clientes",true)} />
            <span className="ml-2 text-sm font-black">Toda a carteira</span>
            <p className="mt-1 pl-5 text-xs text-slate-500">Vê todos os clientes do Control.</p>
          </label>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-black">Permissões de acesso</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[["pode_ver_financeiro","Acessar financeiro"],["pode_acessar_cliente","Acessar ambiente do cliente"],["pode_gerenciar_equipe","Gerenciar equipe"]].map(([k,l])=>
            <label key={k} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold">
              <input type="checkbox" checked={Boolean(f[k])} onChange={e=>set(k,e.target.checked)} />{l}
            </label>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-400">Configurações estruturais são exclusivas do Owner e não são concedidas por esta tela.</p>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-black">Clientes da carteira</p><p className="mt-1 text-xs text-slate-500">{clientes.length} cliente(s) atribuído(s).</p></div>
          <button onClick={()=>setEditandoCarteira(v=>!v)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
            {editandoCarteira ? "Fechar seleção" : "+ Atribuir clientes"}
          </button>
        </div>
        {editandoCarteira ? (
          <div className="mt-4">
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {escritorios.length ? escritorios.map(c=>(
                <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                  <input type="checkbox" checked={clientesSelecionados.includes(c.id)} onChange={()=>alternarCliente(c.id)} />
                  <span className="text-sm font-semibold">{c.nome_fantasia || c.nome}</span>
                </label>
              )) : <p className="p-2 text-xs text-slate-400">Nenhum cliente cadastrado.</p>}
            </div>
            <button onClick={async()=>{await salvarCarteira(usuario,clientesSelecionados);setEditandoCarteira(false);}} disabled={salvando}
              className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60">
              {salvando ? "Salvando..." : "Salvar carteira"}
            </button>
          </div>
        ) : clientes.length ? (
          <div className="mt-3 space-y-2">
            {clientes.map(c=>(
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="text-xs font-bold text-slate-700">{c.nome_fantasia || c.nome}</span>
                <button
                  onClick={async()=>{
                    const confirmar = window.confirm(`Remover ${c.nome_fantasia || c.nome} da carteira de ${usuario.nome || usuario.email}?`);
                    if (!confirmar) return;
                    await removerCliente(usuario,c.id);
                    setClientesSelecionados(lista=>lista.filter(id=>id!==c.id));
                  }}
                  disabled={salvando}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-black text-rose-600 disabled:opacity-60"
                >
                  Remover da carteira
                </button>
              </div>
            ))}
          </div>
        ) : <p className="mt-3 text-xs text-slate-400">Nenhum cliente atribuído ainda.</p>}
      </div>

      <button onClick={()=>salvar(usuario,f)} disabled={salvando} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
        {salvando ? "Salvando..." : "Salvar alterações"}
      </button>
    </div>
  </div>;
}

function Configuracoes({ perfil, logs, acessos, historico, nomeEscritorio, planos, modulos, planoModulos, salvarPlano, alternarModulo, salvarModulo, equipe = [], carteiras = [], salvarPermissoesEquipe, salvando }) {
  const [aba, setAba] = useState("planos");
  return (
    <>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {[['planos','Planos & Módulos'],['auditoria','Auditoria']].map(([id,label]) => <button key={id} onClick={()=>setAba(id)} className={`rounded-xl px-4 py-2.5 text-xs font-black ${aba===id?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-50'}`}>{label}</button>)}
      </div>

      {aba === "planos" ? <div className="mt-6 space-y-6">
        <div><h3 className="text-xl font-black">Planos comerciais</h3><p className="mt-1 text-sm text-slate-500">Defina preço e módulos liberados. Alterar a tabela não reajusta automaticamente contratos antigos.</p></div>
        <div className="grid gap-5 xl:grid-cols-3">
          {planos.map(plano => <PlanoEditor key={plano.id} plano={plano} modulos={modulos} vinculos={planoModulos} salvarPlano={salvarPlano} alternarModulo={alternarModulo} salvando={salvando} />)}
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5"><h3 className="text-lg font-black">Catálogo de módulos</h3><p className="mt-1 text-sm text-slate-500">Preço avulso e disponibilidade comercial de cada módulo.</p></div>
          <div className="divide-y divide-slate-100">{modulos.map(m => <ModuloEditor key={m.id} modulo={m} salvar={salvarModulo} salvando={salvando} />)}</div>
        </div>
      </div> : null}

      {aba === "auditoria" ? <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5"><h3 className="text-lg font-black">Auditoria do Control</h3><p className="mt-1 text-sm text-slate-500">Alterações administrativas e acessos aos ambientes dos clientes.</p></div>
        {logs.length ? <div className="divide-y divide-slate-100">{logs.slice(0,30).map(log => <div key={log.id} className="px-6 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold">{log.acao.replaceAll("_"," ")}</p><span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString("pt-BR")}</span></div><p className="mt-1 text-xs text-slate-500">{log.descricao || "—"}</p>{log.escritorio_id ? <p className="mt-1 text-[11px] font-semibold text-blue-600">{nomeEscritorio(log.escritorio_id)}</p>:null}</div>)}</div> : <Vazio titulo="Auditoria pronta" texto="As próximas ações administrativas serão registradas aqui." />}
      </div> : null}
    </>
  );
}

function PermissoesEquipe({ equipe, carteiras, salvar, salvando }) {
  const [selecionadoId, setSelecionadoId] = useState(equipe[0]?.id || "");
  const selecionado = equipe.find((u) => u.id === selecionadoId) || equipe[0] || null;
  const [f, setF] = useState(null);

  useEffect(() => {
    if (!selecionado) {
      setF(null);
      return;
    }
    setF({
      perfil: selecionado.perfil || "comercial",
      cargo: selecionado.cargo || "",
      pode_ver_todos_clientes: Boolean(selecionado.pode_ver_todos_clientes || selecionado.perfil === "owner"),
      pode_ver_financeiro: Boolean(selecionado.pode_ver_financeiro || selecionado.perfil === "owner"),
      pode_acessar_cliente: Boolean(selecionado.pode_acessar_cliente || selecionado.perfil === "owner"),
      pode_gerenciar_equipe: Boolean(selecionado.pode_gerenciar_equipe || selecionado.perfil === "owner"),
    });
  }, [selecionadoId, selecionado?.id, selecionado?.perfil, selecionado?.cargo,
      selecionado?.pode_ver_todos_clientes, selecionado?.pode_ver_financeiro,
      selecionado?.pode_acessar_cliente, selecionado?.pode_gerenciar_equipe]);

  if (!selecionado || !f) {
    return <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <Vazio titulo="Nenhum colaborador cadastrado" texto="Cadastre primeiro um colaborador em Equipe PrecificaCont." />
    </div>;
  }

  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const qtdCarteira=carteiras.filter(c=>c.usuario_plataforma_id===selecionado.id).length;
  const owner=selecionado.perfil==="owner";

  return <div className="mt-6 grid gap-5 xl:grid-cols-[330px_1fr]">
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="px-2 text-lg font-black">Equipe e permissões</h3>
      <p className="px-2 mt-1 text-xs text-slate-500">Selecione quem deseja configurar.</p>
      <div className="mt-4 space-y-2">
        {equipe.map(u=><button key={u.id} onClick={()=>setSelecionadoId(u.id)}
          className={`w-full rounded-2xl border p-3 text-left ${selecionado.id===u.id?'border-blue-300 bg-blue-50':'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black">{u.nome || u.email || "Usuário"}</p>
            <Badge tipo={u.ativo!==false?"ativo":"inativo"}>{u.ativo!==false?"Ativo":"Inativo"}</Badge>
          </div>
          <p className="mt-1 text-xs capitalize text-slate-500">{u.perfil || "sem perfil"} • {u.cargo || "sem cargo"}</p>
        </button>)}
      </div>
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">{selecionado.nome || selecionado.email}</h3>
          <p className="mt-1 text-sm text-slate-500">{selecionado.email || "Sem e-mail"} • {qtdCarteira} cliente(s) atribuído(s)</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase text-slate-500">
          {owner ? "Owner" : f.perfil}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo label="Perfil">
          <select className="input-control" value={f.perfil} disabled={owner} onChange={e=>set("perfil",e.target.value)}>
            <option value="admin">Administrador</option>
            <option value="gestor">Gestor</option>
            <option value="comercial">Comercial</option>
            <option value="customer_success">Customer Success</option>
            <option value="suporte">Suporte</option>
            <option value="financeiro">Financeiro</option>
            <option value="leitura">Somente leitura</option>
            {owner ? <option value="owner">Owner</option> : null}
          </select>
        </Campo>
        <Campo label="Cargo">
          <input className="input-control" value={f.cargo} disabled={owner} onChange={e=>set("cargo",e.target.value)} />
        </Campo>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-black">Escopo da carteira</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={`rounded-xl border p-4 ${!f.pode_ver_todos_clientes?'border-blue-300 bg-blue-50':'border-slate-200'}`}>
            <input type="radio" name="escopo" checked={!f.pode_ver_todos_clientes} disabled={owner}
              onChange={()=>set("pode_ver_todos_clientes",false)} />
            <span className="ml-2 text-sm font-black">Minha carteira</span>
            <p className="mt-1 pl-5 text-xs text-slate-500">Vê somente clientes atribuídos a este colaborador.</p>
          </label>
          <label className={`rounded-xl border p-4 ${f.pode_ver_todos_clientes?'border-blue-300 bg-blue-50':'border-slate-200'}`}>
            <input type="radio" name="escopo" checked={f.pode_ver_todos_clientes} disabled={owner}
              onChange={()=>set("pode_ver_todos_clientes",true)} />
            <span className="ml-2 text-sm font-black">Toda a carteira</span>
            <p className="mt-1 pl-5 text-xs text-slate-500">Vê todos os clientes cadastrados no Control.</p>
          </label>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-black">Permissões manuais</p>
        <p className="mt-1 text-xs text-slate-500">Ajuste individualmente o que este colaborador pode acessar.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[["pode_ver_financeiro","Acessar financeiro"],["pode_acessar_cliente","Acessar ambiente do cliente"],["pode_gerenciar_equipe","Gerenciar equipe"]].map(([k,l])=>
            <label key={k} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold">
              <input type="checkbox" checked={Boolean(f[k])} disabled={owner} onChange={e=>set(k,e.target.checked)} />{l}
            </label>
          )}
        </div>
      </div>

      {!owner ? <button onClick={()=>salvar(selecionado,f)} disabled={salvando}
        className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
        {salvando?"Salvando...":"Salvar permissões"}
      </button> : <p className="mt-5 text-xs font-semibold text-slate-500">O Owner mantém acesso total ao Control.</p>}
    </div>
  </div>;
}

function PlanoEditor({ plano, modulos, vinculos, salvarPlano, alternarModulo, salvando }) {
  const [f,setF]=useState({nome:plano.nome,descricao:plano.descricao||"",preco_mensal:String(plano.preco_mensal??0),preco_anual:plano.preco_anual??"",ativo:plano.ativo!==false,destaque:Boolean(plano.destaque)});
  useEffect(()=>setF({nome:plano.nome,descricao:plano.descricao||"",preco_mensal:String(plano.preco_mensal??0),preco_anual:plano.preco_anual??"",ativo:plano.ativo!==false,destaque:Boolean(plano.destaque)}),[plano]);
  const tem = id => vinculos.some(v=>v.plano_id===plano.id && v.modulo_id===id && v.incluido!==false);
  return <div className={`rounded-3xl border bg-white p-5 shadow-sm ${plano.destaque?'border-blue-300 ring-2 ring-blue-50':'border-slate-200'}`}>
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-blue-600">{plano.codigo}</p><input className="mt-1 w-full text-xl font-black outline-none" value={f.nome} onChange={e=>setF(x=>({...x,nome:e.target.value}))}/></div><label className="flex items-center gap-2 text-xs font-bold text-slate-500"><input type="checkbox" checked={f.ativo} onChange={e=>setF(x=>({...x,ativo:e.target.checked}))}/> Ativo</label></div>
    <textarea className="mt-3 min-h-16 w-full rounded-xl border border-slate-200 p-3 text-xs" value={f.descricao} onChange={e=>setF(x=>({...x,descricao:e.target.value}))}/>
    <div className="mt-4 grid grid-cols-2 gap-3"><Campo label="Mensal"><input type="number" step="0.01" className="input-control" value={f.preco_mensal} onChange={e=>setF(x=>({...x,preco_mensal:e.target.value}))}/></Campo><Campo label="Anual"><input type="number" step="0.01" className="input-control" value={f.preco_anual} onChange={e=>setF(x=>({...x,preco_anual:e.target.value}))} placeholder="Opcional"/></Campo></div>
    <p className="mt-5 text-[10px] font-black uppercase tracking-[.12em] text-slate-400">Módulos incluídos</p>
    <div className="mt-2 space-y-2">{modulos.filter(m=>m.ativo!==false).map(m=><label key={m.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold"><span>{m.nome}</span><input type="checkbox" checked={tem(m.id)} onChange={e=>alternarModulo(plano,m,e.target.checked)}/></label>)}</div>
    <label className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500"><input type="checkbox" checked={f.destaque} onChange={e=>setF(x=>({...x,destaque:e.target.checked}))}/> Destacar comercialmente</label>
    <button onClick={()=>salvarPlano(plano,f)} disabled={salvando} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white disabled:opacity-60">Salvar plano</button>
  </div>;
}

function ModuloEditor({ modulo, salvar, salvando }) {
  const [f,setF]=useState({nome:modulo.nome,descricao:modulo.descricao||"",preco_avulso:String(modulo.preco_avulso??0),permite_avulso:modulo.permite_avulso!==false,ativo:modulo.ativo!==false});
  useEffect(()=>setF({nome:modulo.nome,descricao:modulo.descricao||"",preco_avulso:String(modulo.preco_avulso??0),permite_avulso:modulo.permite_avulso!==false,ativo:modulo.ativo!==false}),[modulo]);
  return <div className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_180px_150px_110px] lg:items-end"><div><p className="text-sm font-black">{f.nome}</p><p className="mt-1 text-xs text-slate-400">{f.descricao}</p></div><Campo label="Preço avulso"><input type="number" step="0.01" className="input-control" value={f.preco_avulso} onChange={e=>setF(x=>({...x,preco_avulso:e.target.value}))}/></Campo><div className="flex h-10 items-center gap-4 text-xs font-bold"><label><input type="checkbox" checked={f.permite_avulso} onChange={e=>setF(x=>({...x,permite_avulso:e.target.checked}))}/> Avulso</label><label><input type="checkbox" checked={f.ativo} onChange={e=>setF(x=>({...x,ativo:e.target.checked}))}/> Ativo</label></div><button onClick={()=>salvar(modulo,f)} disabled={salvando} className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-black">Salvar</button></div>;
}

function FichaEscritorio({
  escritorio,
  usuarios,
  cobrancas,
  eventos,
  saude,
  fechar,
  editando,
  setEditando,
  salvar,
  salvando,
  acessar,
  alterarStatus,
  excluir,
  planos = [],
  modulos = [],
  planoModulos = [],
  modulosCliente = [],
  criarUsuario,
  atualizarUsuario,
  atualizarAcessoUsuario,
  excluirUsuario,
  podeExcluirUsuario = false,
  podeExcluir = false,
  embutido = false,
}) {
  const [form, setForm] = useState({ ...escritorio });
  const [abaFicha, setAbaFicha] = useState("visao");
  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);
  const [formNovoUsuario, setFormNovoUsuario] = useState({
    nome: "",
    email: "",
    cargo: "",
    perfil: "comercial",
    senha: "",
    confirmarSenha: "",
  });
  const [mostrarSenhaUsuario, setMostrarSenhaUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formEditarUsuario, setFormEditarUsuario] = useState({
    nome: "",
    email: "",
    cargo: "",
    perfil: "comercial",
    ativo: true,
    nova_senha: "",
    confirmar_senha: "",
  });
  const [mostrarNovaSenhaUsuario, setMostrarNovaSenhaUsuario] = useState(false);

  useEffect(() => {
    setForm({
      ...escritorio,
      documento: formatarDocumento(
        escritorio.documento || escritorio.cnpj || "",
        escritorio.tipo_documento || "cnpj"
      ),
      valor_mensal: Number(escritorio.valor_mensal || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      preco_tabela_contratacao: Number(escritorio.preco_tabela_contratacao || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      modulos_avulsos: modulosCliente.map((item) => item.modulo_id),
    });
    setAbaFicha((abaAtual) => {
      if (editando) return "dados";
      return abaAtual === "usuarios" ? "usuarios" : "visao";
    });
    setModalNovoUsuario(false);
    setUsuarioEditando(null);
  }, [escritorio, editando]);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const planoAtual = planos.find((p) => p.id === escritorio.plano_saas_id);
  const nomePlanoAtual = planoAtual?.nome || escritorio.plano || "Sem plano";
  const idsModulosPlano = new Set(
    planoModulos
      .filter((item) => item.plano_id === form.plano_saas_id && item.ativo !== false)
      .map((item) => item.modulo_id)
  );
  const modulosAvulsosDisponiveis = modulos.filter(
    (item) => item.ativo !== false && !idsModulosPlano.has(item.id)
  );

  return (
    <div className={embutido ? "w-full" : "fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px]"}>
      {!embutido ? <button type="button" onClick={fechar} className="absolute inset-0 cursor-default" /> : null}
      <section className={embutido ? "w-full" : "relative z-10 h-full w-full max-w-[780px] overflow-y-auto border-l border-slate-200 bg-slate-50 shadow-2xl"}>
        <div className={`${embutido ? "rounded-3xl border border-slate-200" : "sticky top-0 z-20 border-b border-slate-200"} bg-white/95 px-7 py-5 backdrop-blur`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={fechar} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600">
              <ArrowLeft size={15} /> Voltar
            </button>
            <div className="flex gap-2">
              <button
                onClick={acessar}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#07101f] px-4 text-xs font-bold text-white"
              >
                <ExternalLink size={15} /> Acessar ambiente
              </button>
              <button onClick={() => alterarStatus(escritorio.status_assinatura === "ativo" ? "inativo" : "ativo")} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700">
                {escritorio.status_assinatura === "ativo" ? "Inativar" : "Ativar"}
              </button>
              <button
                onClick={() => {
                  setEditando(true);
                  setAbaFicha("dados");
                }}
                className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white"
              >
                Editar dados
              </button>
              {podeExcluir ? (
                <button onClick={excluir} className="h-10 rounded-xl bg-rose-50 px-4 text-xs font-bold text-rose-600">
                  Excluir
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-7">
          <div className="rounded-3xl bg-[#07101f] p-6 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-400">Empresa contratante</p>
            <h2 className="mt-2 text-2xl font-black">{escritorio.nome_fantasia || escritorio.nome}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tipo={escritorio.status_assinatura}>{escritorio.status_assinatura || "—"}</Badge>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold capitalize">{nomePlanoAtual}</span>
              {saude ? <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold">Health {saude.score}/100</span> : null}
            </div>
          </div>



          <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {[
              ["visao", "Visão geral"],
              ["dados", "Dados cadastrais"],
              ["usuarios", `Usuários (${usuarios.length})`],
              ["assinatura", "Plano e assinatura"],
              ["financeiro", "Financeiro"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setAbaFicha(id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  abaFicha === id
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {abaFicha === "visao" ? (
            <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Mini label="Mensalidade" valor={moeda(escritorio.valor_mensal)} />
            <Mini label="Usuários ativos" valor={usuarios.filter((u) => u.ativo !== false).length} />
            <Mini label="Acessos 30d" valor={saude?.acessos_30d ?? 0} />
            <Mini label="Simulações 30d" valor={saude?.simulacoes_30d ?? 0} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Bloco titulo="Dados empresariais">
              <Linha label={escritorio.tipo_documento === "cpf" ? "CPF" : "CNPJ"} valor={formatarDocumento(escritorio.documento || escritorio.cnpj || "", escritorio.tipo_documento || "cnpj") || "—"} />
              <Linha label="Razão social" valor={escritorio.razao_social || "—"} />
              <Linha label="Nome fantasia" valor={escritorio.nome_fantasia || "—"} />
              <Linha label="Situação cadastral" valor={escritorio.situacao_cadastral || "—"} />
              <Linha label="CNAE principal" valor={[escritorio.cnae_principal, escritorio.cnae_principal_descricao].filter(Boolean).join(" • ") || "—"} />
              <Linha label="Natureza jurídica" valor={escritorio.natureza_juridica || "—"} />
              <Linha label="Porte" valor={escritorio.porte || "—"} />
              <Linha label="Endereço" valor={[escritorio.logradouro, escritorio.numero, escritorio.complemento, escritorio.bairro, escritorio.municipio, escritorio.uf, escritorio.cep].filter(Boolean).join(", ") || "—"} />
              <Linha label="Telefone cadastral" valor={escritorio.telefone_cadastral || "—"} />
              <Linha label="E-mail cadastral" valor={escritorio.email_cadastral || "—"} />
            </Bloco>
            <Bloco titulo="Contato PrecificaCont">
              <Linha label="Responsável" valor={escritorio.responsavel_nome || "—"} />
              <Linha label="E-mail" valor={escritorio.email_responsavel || "—"} />
              <Linha label="Telefone" valor={escritorio.telefone_responsavel || "—"} />
              <Linha label="WhatsApp" valor={escritorio.whatsapp_responsavel || "—"} />
              <Linha label="Origem" valor={escritorio.origem_cliente || "—"} />
              <Linha label="Fonte cadastral" valor={escritorio.fonte_dados_cnpj || "Manual"} />
              <Linha label="CNPJ consultado em" valor={dataBR(escritorio.cnpj_consultado_em)} />
            </Bloco>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Bloco titulo="Assinatura">
              <Linha label="Plano" valor={nomePlanoAtual} />
              <Linha label="Status" valor={escritorio.status_assinatura || "—"} />
              <Linha label="Início" valor={dataBR(escritorio.data_inicio_assinatura)} />
              <Linha label="Fim do teste" valor={dataBR(escritorio.data_fim_teste)} />
              <Linha label="Próxima cobrança" valor={dataBR(escritorio.data_proxima_cobranca)} />
              <Linha label="Último pagamento" valor={dataBR(escritorio.ultimo_pagamento_em)} />
            </Bloco>
            <Bloco titulo="Utilização">
              <Linha label="Health Score" valor={saude ? `${saude.score}/100` : "Sem dados"} />
              <Linha label="Classificação" valor={(saude?.classificacao || "sem dados").replace("_", " ")} />
              <Linha label="Último acesso" valor={dataBR(saude?.ultimo_acesso_em || escritorio.ultimo_acesso_em)} />
              <Linha label="Acessos 7 dias" valor={saude?.acessos_7d ?? 0} />
              <Linha label="Propostas 30 dias" valor={saude?.propostas_30d ?? 0} />
              <Linha label="Eventos carregados" valor={eventos.length} />
            </Bloco>
          </div>

            </>
          ) : null}

          {abaFicha === "dados" ? (
            <form
              className="mt-5 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                await salvar(form);
              }}
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="font-black">Identificação</h3>
                  <p className="mt-1 text-sm text-slate-500">Dados cadastrais da empresa contratante.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Campo label="Tipo de documento">
                    <select className="input-control" value={form.tipo_documento || "cnpj"} onChange={(e) => set("tipo_documento", e.target.value)}>
                      <option value="cnpj">CNPJ</option>
                      <option value="cpf">CPF</option>
                    </select>
                  </Campo>
                  <Campo label={form.tipo_documento === "cpf" ? "CPF" : "CNPJ"}>
                    <input className="input-control" value={form.documento || ""} onChange={(e) => set("documento", formatarDocumento(e.target.value, form.tipo_documento || "cnpj"))} />
                  </Campo>
                  <Campo label={form.tipo_documento === "cpf" ? "Nome completo" : "Razão social"}>
                    <input className="input-control" value={form.razao_social || ""} onChange={(e) => set("razao_social", e.target.value)} />
                  </Campo>
                  <Campo label="Nome fantasia">
                    <input className="input-control" value={form.nome_fantasia || ""} onChange={(e) => set("nome_fantasia", e.target.value)} />
                  </Campo>
                  <Campo label="Situação cadastral">
                    <input className="input-control" value={form.situacao_cadastral || ""} onChange={(e) => set("situacao_cadastral", e.target.value)} />
                  </Campo>
                  <Campo label="Data de abertura">
                    <input type="date" className="input-control" value={String(form.data_abertura || "").slice(0, 10)} onChange={(e) => set("data_abertura", e.target.value)} />
                  </Campo>
                  <Campo label="Natureza jurídica">
                    <input className="input-control" value={form.natureza_juridica || ""} onChange={(e) => set("natureza_juridica", e.target.value)} />
                  </Campo>
                  <Campo label="Porte">
                    <input className="input-control" value={form.porte || ""} onChange={(e) => set("porte", e.target.value)} />
                  </Campo>
                  <Campo label="CNAE principal">
                    <input className="input-control" value={form.cnae_principal || ""} onChange={(e) => set("cnae_principal", e.target.value)} />
                  </Campo>
                  <Campo label="Descrição do CNAE">
                    <input className="input-control" value={form.cnae_principal_descricao || ""} onChange={(e) => set("cnae_principal_descricao", e.target.value)} />
                  </Campo>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="font-black">Endereço</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Campo label="CEP"><input className="input-control" value={form.cep || ""} onChange={(e) => set("cep", e.target.value)} /></Campo>
                  <Campo label="Logradouro"><input className="input-control" value={form.logradouro || ""} onChange={(e) => set("logradouro", e.target.value)} /></Campo>
                  <Campo label="Número"><input className="input-control" value={form.numero || ""} onChange={(e) => set("numero", e.target.value)} /></Campo>
                  <Campo label="Complemento"><input className="input-control" value={form.complemento || ""} onChange={(e) => set("complemento", e.target.value)} /></Campo>
                  <Campo label="Bairro"><input className="input-control" value={form.bairro || ""} onChange={(e) => set("bairro", e.target.value)} /></Campo>
                  <Campo label="Município"><input className="input-control" value={form.municipio || ""} onChange={(e) => set("municipio", e.target.value)} /></Campo>
                  <Campo label="UF"><input className="input-control" maxLength={2} value={form.uf || ""} onChange={(e) => set("uf", e.target.value.toUpperCase())} /></Campo>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="font-black">Contato</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Campo label="Telefone cadastral"><input className="input-control" value={form.telefone_cadastral || ""} onChange={(e) => set("telefone_cadastral", e.target.value)} /></Campo>
                  <Campo label="E-mail cadastral"><input type="email" className="input-control" value={form.email_cadastral || ""} onChange={(e) => set("email_cadastral", e.target.value)} /></Campo>
                  <Campo label="Responsável"><input className="input-control" value={form.responsavel_nome || ""} onChange={(e) => set("responsavel_nome", e.target.value)} /></Campo>
                  <Campo label="E-mail do responsável"><input type="email" className="input-control" value={form.email_responsavel || ""} onChange={(e) => set("email_responsavel", e.target.value)} /></Campo>
                  <Campo label="Telefone do responsável"><input className="input-control" value={form.telefone_responsavel || ""} onChange={(e) => set("telefone_responsavel", e.target.value)} /></Campo>
                  <Campo label="WhatsApp"><input className="input-control" value={form.whatsapp_responsavel || ""} onChange={(e) => set("whatsapp_responsavel", e.target.value)} /></Campo>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="font-black">Plano e assinatura</h3>
                  <p className="mt-1 text-sm text-slate-500">Edite o plano, valor contratado, status e ciclo da assinatura sem sair da ficha.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Campo label="Plano">
                    <select
                      className="input-control"
                      value={form.plano_saas_id || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        const plano = planos.find((p) => p.id === id);
                        setForm((f) => ({
                          ...f,
                          plano_saas_id: id,
                          plano: plano?.codigo || f.plano,
                          preco_tabela_contratacao: Number(plano?.preco_mensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                          valor_mensal: Number(plano?.preco_mensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                          modulos_avulsos: [],
                        }));
                      }}
                    >
                      <option value="">Sem plano</option>
                      {planos.filter((p) => p.ativo !== false).map((p) => (
                        <option key={p.id} value={p.id}>{p.nome} — {moeda(p.preco_mensal)}</option>
                      ))}
                    </select>
                  </Campo>
                  <Campo label="Preço de tabela">
                    <input className="input-control" value={form.preco_tabela_contratacao || ""} onChange={(e) => set("preco_tabela_contratacao", valorBRLInput(e.target.value))} />
                  </Campo>
                  <Campo label="Valor contratado">
                    <input className="input-control" value={form.valor_mensal || ""} onChange={(e) => set("valor_mensal", valorBRLInput(e.target.value))} />
                  </Campo>
                  <Campo label="Status">
                    <select className="input-control" value={form.status_assinatura || "teste"} onChange={(e) => set("status_assinatura", e.target.value)}>
                      {["teste", "ativo", "inativo", "suspenso", "inadimplente", "cancelado"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Campo>
                  <Campo label="Origem"><input className="input-control" value={form.origem_cliente || ""} onChange={(e) => set("origem_cliente", e.target.value)} /></Campo>
                  <Campo label="Início da assinatura"><input type="date" className="input-control" value={String(form.data_inicio_assinatura || "").slice(0, 10)} onChange={(e) => set("data_inicio_assinatura", e.target.value)} /></Campo>
                  <Campo label="Fim do teste"><input type="date" className="input-control" value={String(form.data_fim_teste || "").slice(0, 10)} onChange={(e) => set("data_fim_teste", e.target.value)} /></Campo>
                  <Campo label="Próxima cobrança"><input type="date" className="input-control" value={String(form.data_proxima_cobranca || "").slice(0, 10)} onChange={(e) => set("data_proxima_cobranca", e.target.value)} /></Campo>
                  <Campo label="Limite de usuários"><input type="number" min="0" className="input-control" value={form.limite_usuarios ?? ""} onChange={(e) => set("limite_usuarios", e.target.value)} /></Campo>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black text-slate-800">Módulos avulsos</p>
                  <p className="mt-1 text-xs text-slate-500">Módulos já incluídos no plano não aparecem aqui.</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {modulosAvulsosDisponiveis.length ? modulosAvulsosDisponiveis.map((m) => {
                      const marcado = (form.modulos_avulsos || []).includes(m.id);
                      return (
                        <label key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={(e) => {
                              setForm((f) => ({
                                ...f,
                                modulos_avulsos: e.target.checked
                                  ? [...new Set([...(f.modulos_avulsos || []), m.id])]
                                  : (f.modulos_avulsos || []).filter((id) => id !== m.id),
                              }));
                            }}
                          />
                          <span className="flex-1">{m.nome}</span>
                          <span className="text-slate-400">{moeda(m.preco_avulso)}</span>
                        </label>
                      );
                    }) : <p className="text-xs text-slate-400">Todos os módulos disponíveis já estão incluídos neste plano.</p>}
                  </div>
                </div>

                <Campo label="Observações">
                  <textarea className="mt-4 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" value={form.observacoes_control || ""} onChange={(e) => set("observacoes_control", e.target.value)} />
                </Campo>
              </div>

              <div className="sticky bottom-4 flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      ...escritorio,
                      documento: formatarDocumento(escritorio.documento || escritorio.cnpj || "", escritorio.tipo_documento || "cnpj"),
                      valor_mensal: Number(escritorio.valor_mensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                      preco_tabela_contratacao: Number(escritorio.preco_tabela_contratacao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                      modulos_avulsos: modulosCliente.map((item) => item.modulo_id),
                    });
                    setEditando(false);
                    setAbaFicha("visao");
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-black text-slate-600"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white disabled:opacity-60">
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Salvar alterações
                </button>
              </div>
            </form>
          ) : null}

          {abaFicha === "usuarios" ? (
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="font-black">Usuários da empresa</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Usuários vinculados a esta empresa. Plano pertence à empresa; perfil e permissões pertencem ao usuário.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormNovoUsuario({ nome: "", email: "", cargo: "", perfil: "comercial", senha: "", confirmarSenha: "" });
                  setMostrarSenhaUsuario(false);
                  setModalNovoUsuario(true);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700"
              >
                + Novo usuário
              </button>
            </div>
            {usuarios.length ? usuarios.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{u.nome || "Usuário"}</p>
                  <p className="mt-1 text-xs text-slate-400">{u.cargo || "Sem cargo"} • {u.perfil || "Sem perfil"}</p>
                  <p className="mt-1 text-xs text-slate-500">{u.email || "E-mail não informado"}</p>
                  <p className="mt-1 truncate text-[11px] text-slate-300">{u.user_id || "Usuário sem vínculo de autenticação"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tipo={u.ativo !== false ? "ativo" : "inativo"}>{u.ativo !== false ? "Ativo" : "Inativo"}</Badge>
                  <button
                    type="button"
                    onClick={() => {
                      setUsuarioEditando(u);
                      setFormEditarUsuario({
                        nome: u.nome || "",
                        email: u.email || "",
                        cargo: u.cargo || "",
                        perfil: u.perfil || "comercial",
                        ativo: u.ativo !== false,
                        nova_senha: "",
                        confirmar_senha: "",
                      });
                    }}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                  >
                    <Pencil size={13} /> Editar usuário
                  </button>
                  <button
                    type="button"
                    onClick={acessar}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    title="Abre o ambiente desta empresa."
                  >
                    <ExternalLink size={13} /> Acessar empresa
                  </button>
                </div>
              </div>
            )) : <Vazio titulo="Nenhum usuário" texto="Não há usuários vinculados a este escritório." />}
          </div>
          ) : null}

          {abaFicha === "assinatura" ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Bloco titulo="Plano contratado">
                <Linha label="Plano" valor={nomePlanoAtual} />
                <Linha label="Status" valor={escritorio.status_assinatura || "—"} />
                <Linha label="Mensalidade" valor={moeda(escritorio.valor_mensal)} />
                <Linha label="Limite de usuários" valor={escritorio.limite_usuarios ?? "—"} />
              </Bloco>
              <Bloco titulo="Ciclo da assinatura">
                <Linha label="Início" valor={dataBR(escritorio.data_inicio_assinatura)} />
                <Linha label="Fim do teste" valor={dataBR(escritorio.data_fim_teste)} />
                <Linha label="Próxima cobrança" valor={dataBR(escritorio.data_proxima_cobranca)} />
                <Linha label="Último pagamento" valor={dataBR(escritorio.ultimo_pagamento_em)} />
              </Bloco>
            </div>
          ) : null}

          {abaFicha === "financeiro" ? (
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h3 className="font-black">Financeiro do cliente</h3>
            </div>
            {cobrancas.length ? cobrancas.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 last:border-0">
                <div>
                  <p className="text-sm font-bold">{c.descricao || "Mensalidade"}</p>
                  <p className="mt-1 text-xs text-slate-400">Vencimento {dataBR(c.vencimento)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{moeda(c.valor)}</p>
                  <Badge tipo={c.status}>{c.status}</Badge>
                </div>
              </div>
            )) : <Vazio titulo="Sem cobranças" texto="Nenhuma cobrança registrada para este cliente." />}
          </div>
          ) : null}
        </div>
      </section>

      {usuarioEditando ? (
        <ModalBase
          titulo="Editar usuário do cliente"
          subtitulo={`Gerencie os dados e o acesso de ${usuarioEditando.nome || "Usuário"}.`}
          fechar={() => setUsuarioEditando(null)}
        >
          <form onSubmit={async (e) => {
            e.preventDefault();

            if (
              formEditarUsuario.nova_senha &&
              formEditarUsuario.nova_senha !== formEditarUsuario.confirmar_senha
            ) {
              window.alert("A confirmação da nova senha não confere.");
              return;
            }

            const dadosOk = await atualizarUsuario(usuarioEditando, formEditarUsuario);
            if (!dadosOk) return;

            const emailMudou =
              String(formEditarUsuario.email || "").trim().toLowerCase() !==
              String(usuarioEditando.email || "").trim().toLowerCase();

            const precisaAtualizarAcesso =
              emailMudou || Boolean(formEditarUsuario.nova_senha);

            if (precisaAtualizarAcesso) {
              const acessoOk = await atualizarAcessoUsuario(
                usuarioEditando,
                formEditarUsuario
              );
              if (!acessoOk) return;
            }

            setUsuarioEditando(null);
          }} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nome *"><input className="input-control" value={formEditarUsuario.nome} onChange={(e)=>setFormEditarUsuario(f=>({...f,nome:e.target.value}))}/></Campo>
              <Campo label="E-mail *"><input type="email" className="input-control" value={formEditarUsuario.email} onChange={(e)=>setFormEditarUsuario(f=>({...f,email:e.target.value}))}/></Campo>
              <Campo label="Cargo"><input className="input-control" value={formEditarUsuario.cargo} onChange={(e)=>setFormEditarUsuario(f=>({...f,cargo:e.target.value}))} placeholder="Ex.: Comercial"/></Campo>
              <Campo label="Perfil *">
                <select className="input-control" value={formEditarUsuario.perfil} onChange={(e)=>setFormEditarUsuario(f=>({...f,perfil:e.target.value}))}>
                  <option value="comercial">Comercial</option>
                  <option value="admin">Administrador</option>
                </select>
              </Campo>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="mb-4">
                <p className="text-sm font-black text-slate-800">Login e senha</p>
                <p className="mt-1 text-xs text-slate-500">
                  O e-mail acima é o login do usuário. Preencha a nova senha somente quando quiser redefini-la.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Nova senha">
                  <div className="relative">
                    <input
                      type={mostrarNovaSenhaUsuario ? "text" : "password"}
                      className="input-control pr-11"
                      value={formEditarUsuario.nova_senha}
                      onChange={(e) =>
                        setFormEditarUsuario((f) => ({
                          ...f,
                          nova_senha: e.target.value,
                        }))
                      }
                      placeholder="Mínimo de 8 caracteres"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarNovaSenhaUsuario((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      aria-label={mostrarNovaSenhaUsuario ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {mostrarNovaSenhaUsuario ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Campo>

                <Campo label="Confirmar nova senha">
                  <input
                    type={mostrarNovaSenhaUsuario ? "text" : "password"}
                    className="input-control"
                    value={formEditarUsuario.confirmar_senha}
                    onChange={(e) =>
                      setFormEditarUsuario((f) => ({
                        ...f,
                        confirmar_senha: e.target.value,
                      }))
                    }
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                  />
                </Campo>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-800">Status do usuário</p>
                  <p className="mt-1 text-xs text-slate-500">Controle se este usuário permanece ativo nesta empresa.</p>
                </div>
                <button type="button" onClick={()=>setFormEditarUsuario(f=>({...f,ativo:!f.ativo}))}
                  className={`rounded-xl px-4 py-2 text-xs font-black ${formEditarUsuario.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {formEditarUsuario.ativo ? "Ativo" : "Inativo"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs sm:grid-cols-2">
              <div><p className="font-bold text-slate-400">ID DO VÍNCULO</p><p className="mt-1 break-all font-semibold text-slate-700">{usuarioEditando.id || "—"}</p></div>
              <div><p className="font-bold text-slate-400">ID DE AUTENTICAÇÃO</p><p className="mt-1 break-all font-semibold text-slate-700">{usuarioEditando.user_id || "Sem vínculo"}</p></div>
              <div><p className="font-bold text-slate-400">EMPRESA</p><p className="mt-1 font-semibold text-slate-700">{escritorio.nome_fantasia || escritorio.nome}</p></div>
              <div><p className="font-bold text-slate-400">PLANO DA EMPRESA</p><p className="mt-1 font-semibold text-slate-700">{nomePlanoAtual}</p></div>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4 text-xs leading-5 text-blue-800">
              O plano pertence à empresa e não é alterado nesta tela. O e-mail de login e a senha são atualizados com segurança no Supabase Authentication; a senha nunca é armazenada nesta ficha.
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {podeExcluirUsuario ? (
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={async () => {
                      const ok = await excluirUsuario(usuarioEditando);
                      if (ok) setUsuarioEditando(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                    Excluir usuário
                  </button>
                ) : null}
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={()=>setUsuarioEditando(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600">Cancelar</button>
                <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white disabled:opacity-60">
                  {salvando ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Salvar usuário
                </button>
              </div>
            </div>
          </form>
        </ModalBase>
      ) : null}

      {modalNovoUsuario ? (
        <ModalBase
          titulo="Novo usuário do cliente"
          subtitulo={`Crie o acesso de um usuário para ${escritorio.nome_fantasia || escritorio.nome}.`}
          fechar={() => setModalNovoUsuario(false)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (formNovoUsuario.senha !== formNovoUsuario.confirmarSenha) {
                window.alert("As senhas não conferem.");
                return;
              }
              const ok = await criarUsuario(escritorio, formNovoUsuario);
              if (ok) setModalNovoUsuario(false);
            }}
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nome *">
                <input className="input-control" value={formNovoUsuario.nome} onChange={(e) => setFormNovoUsuario((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome do usuário" />
              </Campo>
              <Campo label="E-mail *">
                <input type="email" className="input-control" value={formNovoUsuario.email} onChange={(e) => setFormNovoUsuario((f) => ({ ...f, email: e.target.value }))} placeholder="usuario@empresa.com.br" />
              </Campo>
              <Campo label="Cargo">
                <input className="input-control" value={formNovoUsuario.cargo} onChange={(e) => setFormNovoUsuario((f) => ({ ...f, cargo: e.target.value }))} placeholder="Ex.: Comercial" />
              </Campo>
              <Campo label="Perfil *">
                <select className="input-control" value={formNovoUsuario.perfil} onChange={(e) => setFormNovoUsuario((f) => ({ ...f, perfil: e.target.value }))}>
                  <option value="comercial">Comercial</option>
                  <option value="admin">Administrador</option>
                </select>
              </Campo>
              <Campo label="Senha temporária *">
                <input type={mostrarSenhaUsuario ? "text" : "password"} className="input-control" value={formNovoUsuario.senha} onChange={(e) => setFormNovoUsuario((f) => ({ ...f, senha: e.target.value }))} placeholder="Mínimo 8 caracteres" />
              </Campo>
              <Campo label="Confirmar senha *">
                <input type={mostrarSenhaUsuario ? "text" : "password"} className="input-control" value={formNovoUsuario.confirmarSenha} onChange={(e) => setFormNovoUsuario((f) => ({ ...f, confirmarSenha: e.target.value }))} placeholder="Repita a senha" />
              </Campo>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <input type="checkbox" checked={mostrarSenhaUsuario} onChange={(e) => setMostrarSenhaUsuario(e.target.checked)} />
              Mostrar senha
            </label>

            <div className="rounded-2xl bg-blue-50 p-4 text-xs leading-5 text-blue-800">
              O login será criado no Supabase Authentication e vinculado automaticamente a esta empresa. A senha não será armazenada na tabela do cliente.
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => setModalNovoUsuario(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600">Cancelar</button>
              <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white disabled:opacity-60">
                {salvando ? <Loader2 size={14} className="animate-spin" /> : null}
                Criar usuário
              </button>
            </div>
          </form>
        </ModalBase>
      ) : null}

      <style>{`
        .input-control {
          width: 100%;
          height: 42px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 12px;
          background: white;
          font-size: 14px;
          outline: none;
        }
        .input-control:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96,165,250,.12);
        }
      `}</style>
    </div>
  );
}

function ModalBase({ titulo, subtitulo, fechar, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <button className="absolute inset-0" onClick={fechar} />
      <div className="relative z-10 max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div><h3 className="text-xl font-black">{titulo}</h3><p className="mt-1 text-sm text-slate-500">{subtitulo}</p></div>
          <button onClick={fechar} className="rounded-xl bg-slate-100 p-2"><X size={17} /></button>
        </div>
        <div className="max-h-[calc(92vh-92px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function ModalCliente({
  fechar,
  salvar,
  salvando,
  planos = [],
  modulos = [],
  planoModulos = [],
  modulosCliente = [],
  equipe = [],
  usuarioAtual = null,
  cliente = null,
}) {
  const editando = Boolean(cliente?.id);
  const [consultando, setConsultando] = useState(false);
  const [erroCnpj, setErroCnpj] = useState("");
  const [secao, setSecao] = useState("identificacao");

  const montarInicial = () => {
    if (!cliente) {
      return {
        tipo_documento:"cnpj", documento:"", cnpj:"", razao_social:"", nome_fantasia:"",
        situacao_cadastral:"", data_abertura:"", natureza_juridica:"", porte:"",
        cnae_principal:"", cnae_principal_descricao:"", cep:"", logradouro:"", numero:"",
        complemento:"", bairro:"", municipio:"", uf:"", telefone_cadastral:"",
        email_cadastral:"", responsavel_nome:"", email_responsavel:"", telefone_responsavel:"",
        whatsapp_responsavel:"", plano:"essencial", plano_saas_id:"",
        preco_tabela_contratacao:"", valor_mensal:"", status_assinatura:"teste",
        origem_cliente:"", data_inicio_assinatura:"", data_fim_teste:"",
        data_proxima_cobranca:"", limite_usuarios:"", observacoes_control:"",
        cnpj_consultado_em:null, fonte_dados_cnpj:null, modulos_avulsos:[],
        responsavel_comercial_id: usuarioAtual?.id || "",
        responsavel_pre_vendas_id: ""
      };
    }

    const planoPorId = planos.find((p) => p.id === cliente.plano_saas_id);
    const codigoLegado = String(cliente.plano || "").trim().toLowerCase();
    const planoPorCodigo = planos.find(
      (p) =>
        String(p.codigo || "").trim().toLowerCase() === codigoLegado ||
        String(p.nome || "").trim().toLowerCase() === codigoLegado
    );
    const planoResolvido = planoPorId || planoPorCodigo || null;

    const valorAtual = Number(
      cliente.valor_plano_contratado ?? cliente.valor_mensal ?? planoResolvido?.preco_mensal ?? 0
    );
    const tabelaAtual = Number(
      cliente.preco_tabela_contratacao ?? planoResolvido?.preco_mensal ?? 0
    );

    const tipoDocumento =
      cliente.tipo_documento ||
      (cliente.cnpj ? "cnpj" : cliente.documento ? (normalizarDocumento(cliente.documento, "cnpj").length === 14 ? "cnpj" : "cpf") : "cnpj");

    return {
      ...cliente,
      tipo_documento: tipoDocumento,
      documento: formatarDocumento(
        cliente.documento || cliente.cnpj || "",
        tipoDocumento
      ),
      cnpj: cliente.cnpj || "",
      razao_social:
        cliente.razao_social ||
        cliente.nome_fantasia ||
        cliente.nome ||
        "",
      nome_fantasia:
        cliente.nome_fantasia ||
        cliente.nome ||
        cliente.razao_social ||
        "",
      plano_saas_id: planoResolvido?.id || cliente.plano_saas_id || "",
      plano: planoResolvido?.codigo || cliente.plano || "",
      valor_mensal: valorAtual.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      preco_tabela_contratacao: tabelaAtual.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      data_inicio_assinatura: String(cliente.data_inicio_assinatura || "").slice(0,10),
      data_fim_teste: String(cliente.data_fim_teste || "").slice(0,10),
      data_proxima_cobranca: String(cliente.data_proxima_cobranca || "").slice(0,10),
      modulos_avulsos: modulosCliente.map((x) => x.modulo_id),
    };
  };

  const [f, setF] = useState(montarInicial);
  const s = (k,v) => setF(x => ({...x,[k]:v}));
  const telefoneCadastroNumeroRef = useRef(null);
  const telefoneResponsavelNumeroRef = useRef(null);
  const whatsappResponsavelNumeroRef = useRef(null);

  const telefoneCadastroPartes = separarTelefoneCadastro(f.telefone_cadastral);
  const alterarDddCadastro = (valor) => {
    s(
      "telefone_cadastral",
      montarTelefoneCadastro(valor, telefoneCadastroPartes.numero)
    );
  };
  const alterarNumeroCadastro = (valor) => {
    s(
      "telefone_cadastral",
      montarTelefoneCadastro(telefoneCadastroPartes.ddd, valor)
    );
  };

  const telefoneResponsavelPartes = separarTelefoneCadastro(f.telefone_responsavel);
  const whatsappResponsavelPartes = separarTelefoneCadastro(f.whatsapp_responsavel);

  const alterarDddTelefoneResponsavel = (valor) => {
    const ddd = somenteDigitos(valor).slice(0, 2);
    s("telefone_responsavel", montarTelefoneCadastro(ddd, telefoneResponsavelPartes.numero));
    if (ddd.length === 2) requestAnimationFrame(() => telefoneResponsavelNumeroRef.current?.focus());
  };
  const alterarNumeroTelefoneResponsavel = (valor) => {
    s("telefone_responsavel", montarTelefoneCadastro(telefoneResponsavelPartes.ddd, valor));
  };
  const alterarDddWhatsappResponsavel = (valor) => {
    const ddd = somenteDigitos(valor).slice(0, 2);
    s("whatsapp_responsavel", montarTelefoneCadastro(ddd, whatsappResponsavelPartes.numero));
    if (ddd.length === 2) requestAnimationFrame(() => whatsappResponsavelNumeroRef.current?.focus());
  };
  const alterarNumeroWhatsappResponsavel = (valor) => {
    s("whatsapp_responsavel", montarTelefoneCadastro(whatsappResponsavelPartes.ddd, valor));
  };

  const selecionarPlano = (id) => {
    const p = planos.find(x => x.id === id);
    setF(x => ({
      ...x,
      plano_saas_id:id,
      plano:p?.codigo || "",
      preco_tabela_contratacao:p
        ? Number(p.preco_mensal || 0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})
        : "",
      valor_mensal:p
        ? Number(p.preco_mensal || 0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})
        : x.valor_mensal,
    }));
  };

  const consultarCnpj = async () => {
    if (f.tipo_documento !== "cnpj") return;
    const cnpj = normalizarDocumento(f.documento,"cnpj");
    if(cnpj.length!==14){setErroCnpj("Informe um CNPJ com 14 caracteres.");return;}
    setConsultando(true); setErroCnpj("");
    try {
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      const response=await fetch(`https://api.opencnpj.org/${encodeURIComponent(cnpj)}`,{
        headers:{Accept:"application/json"}, signal:controller.signal
      });
      clearTimeout(timer);
      if(response.status===404) throw new Error("CNPJ não encontrado na base OpenCNPJ.");
      if(response.status===429) throw new Error("Muitas consultas agora. Aguarde alguns segundos e tente novamente.");
      if(!response.ok) throw new Error("OpenCNPJ indisponível no momento. Você pode preencher os dados manualmente.");
      const d=await response.json();
      const telefone=Array.isArray(d.telefones)&&d.telefones.length
        ? formatarTelefone(d.telefones[0]?.ddd,d.telefones[0]?.numero) : "";
      setF(x=>({...x,
        documento:formatarCNPJ(d.cnpj||cnpj), cnpj:formatarCNPJ(d.cnpj||cnpj),
        razao_social:d.razao_social||x.razao_social,
        nome_fantasia:d.nome_fantasia||d.razao_social||x.nome_fantasia,
        situacao_cadastral:d.situacao_cadastral||x.situacao_cadastral,
        data_abertura:d.data_inicio_atividade||x.data_abertura,
        natureza_juridica:d.natureza_juridica||x.natureza_juridica,
        porte:d.porte_empresa||d.porte||x.porte,
        cnae_principal:String(d.cnae_principal||x.cnae_principal||""),
        cnae_principal_descricao:d.cnae_principal_descricao||d.descricao_cnae_principal||x.cnae_principal_descricao,
        cep:d.cep||x.cep, logradouro:d.logradouro||x.logradouro, numero:d.numero||x.numero,
        complemento:d.complemento||x.complemento, bairro:d.bairro||x.bairro,
        municipio:d.municipio||x.municipio, uf:d.uf||x.uf,
        telefone_cadastral:telefone||x.telefone_cadastral,
        email_cadastral:d.email||x.email_cadastral,
        cnpj_consultado_em:new Date().toISOString(), fonte_dados_cnpj:"OpenCNPJ"
      }));
    } catch(e) {
      setErroCnpj(e?.name==="AbortError"
        ? "A consulta demorou demais. Tente novamente ou preencha manualmente."
        : e.message);
    } finally { setConsultando(false); }
  };

  const abas=[
    ["identificacao","1. Identificação"],
    ["endereco","2. Endereço"],
    ["contato","3. Contato"],
    ["assinatura","4. Assinatura"]
  ];

  const idsDoPlano = new Set(
    planoModulos
      .filter(x => x.plano_id === f.plano_saas_id && x.incluido)
      .map(x => x.modulo_id)
  );

  const modulosAvulsosDisponiveis = modulos.filter(
    m => m.ativo !== false && m.permite_avulso !== false && !idsDoPlano.has(m.id)
  );

  const alternarAvulso = (id) => {
    setF(x => ({
      ...x,
      modulos_avulsos: x.modulos_avulsos.includes(id)
        ? x.modulos_avulsos.filter(item => item !== id)
        : [...x.modulos_avulsos, id]
    }));
  };

  return (
    <ModalBase
      titulo={editando ? "Editar cliente SaaS" : "Novo cliente SaaS"}
      subtitulo={editando
        ? "Atualize cadastro, contato e assinatura no mesmo padrão do cadastro."
        : "Cadastro organizado em etapas. CPF manual ou CNPJ com preenchimento pela OpenCNPJ."}
      fechar={fechar}
    >
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {abas.map(([id,label])=>(
          <button key={id} onClick={()=>setSecao(id)}
            className={`rounded-xl px-3 py-2.5 text-xs font-black ${secao===id?'bg-blue-600 text-white':'bg-slate-100 text-slate-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {secao==="identificacao" ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[.12em] text-blue-700">Documento do cliente</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[140px_1fr_auto]">
              <select className="input-control" value={f.tipo_documento} onChange={e=>{
                const tipo=e.target.value; setErroCnpj("");
                setF(x=>({...x,tipo_documento:tipo,documento:"",cnpj:"",cnpj_consultado_em:null,fonte_dados_cnpj:null}));
              }}>
                <option value="cnpj">CNPJ</option><option value="cpf">CPF</option>
              </select>
              <input className="input-control" value={f.documento||""}
                onChange={e=>s("documento",formatarDocumento(e.target.value,f.tipo_documento))}
                placeholder={f.tipo_documento==="cpf"?"000.000.000-00":"00.000.000/0000-00"} />
              {f.tipo_documento==="cnpj" ? (
                <button onClick={consultarCnpj} disabled={consultando}
                  className="rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-60">
                  {consultando?"Consultando...":"Consultar CNPJ"}
                </button>
              ) : null}
            </div>
            {f.tipo_documento==="cpf"&&f.documento ? (
              <p className={`mt-2 text-xs font-semibold ${validarCPF(f.documento)?'text-emerald-700':'text-rose-600'}`}>
                {validarCPF(f.documento)?'CPF válido.':'CPF inválido ou incompleto.'}
              </p>
            ):null}
            {erroCnpj?<p className="mt-2 text-xs font-semibold text-rose-600">{erroCnpj}</p>:null}
            {f.fonte_dados_cnpj?<p className="mt-2 text-xs font-semibold text-emerald-700">Dados consultados pela OpenCNPJ. Revise antes de salvar.</p>:null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label={f.tipo_documento==="cpf"?"Nome completo *":"Razão social *"}>
              <input className="input-control" value={f.razao_social||""} onChange={e=>s("razao_social",e.target.value)}/>
            </Campo>
            <Campo label="Nome de exibição / escritório *">
              <input className="input-control" value={f.nome_fantasia||""} onChange={e=>s("nome_fantasia",e.target.value)}/>
            </Campo>
            {f.tipo_documento==="cnpj" ? <>
              <Campo label="Situação cadastral"><input className="input-control bg-slate-50" value={f.situacao_cadastral||""} onChange={e=>s("situacao_cadastral",e.target.value)}/></Campo>
              <Campo label="Data de abertura"><input className="input-control" type="date" value={String(f.data_abertura||"").slice(0,10)} onChange={e=>s("data_abertura",e.target.value)}/></Campo>
              <Campo label="Natureza jurídica"><input className="input-control" value={f.natureza_juridica||""} onChange={e=>s("natureza_juridica",e.target.value)}/></Campo>
              <Campo label="Porte"><input className="input-control" value={f.porte||""} onChange={e=>s("porte",e.target.value)}/></Campo>
              <Campo label="CNAE principal"><input className="input-control" value={f.cnae_principal||""} onChange={e=>s("cnae_principal",e.target.value)}/></Campo>
              <Campo label="Descrição CNAE"><input className="input-control" value={f.cnae_principal_descricao||""} onChange={e=>s("cnae_principal_descricao",e.target.value)}/></Campo>
            </> : null}
          </div>
        </div>
      ) : null}

      {secao==="endereco" ? (
        <div>
          <div className="mb-4"><h4 className="font-black">Endereço cadastral</h4><p className="text-sm text-slate-500">Revise os dados ou informe manualmente.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="CEP"><input className="input-control" value={f.cep||""} onChange={e=>s("cep",e.target.value)}/></Campo>
            <Campo label="Logradouro"><input className="input-control" value={f.logradouro||""} onChange={e=>s("logradouro",e.target.value)}/></Campo>
            <Campo label="Número"><input className="input-control" value={f.numero||""} onChange={e=>s("numero",e.target.value)}/></Campo>
            <Campo label="Complemento"><input className="input-control" value={f.complemento||""} onChange={e=>s("complemento",e.target.value)}/></Campo>
            <Campo label="Bairro"><input className="input-control" value={f.bairro||""} onChange={e=>s("bairro",e.target.value)}/></Campo>
            <Campo label="Município"><input className="input-control" value={f.municipio||""} onChange={e=>s("municipio",e.target.value)}/></Campo>
            <Campo label="UF"><input className="input-control" maxLength={2} value={f.uf||""} onChange={e=>s("uf",e.target.value.toUpperCase())}/></Campo>
            {!editando ? (
              <Campo label="Telefone cadastral">
                <div className="grid grid-cols-[92px_1fr] gap-2">
                  <input
                    className="input-control text-center"
                    inputMode="numeric"
                    maxLength={2}
                    value={telefoneCadastroPartes.ddd}
                    onChange={e=>{
                      alterarDddCadastro(e.target.value);
                      if (somenteDigitos(e.target.value).slice(0,2).length === 2) {
                        requestAnimationFrame(() => telefoneCadastroNumeroRef.current?.focus());
                      }
                    }}
                    placeholder="DDD"
                    aria-label="DDD do telefone cadastral"
                  />
                  <input
                    ref={telefoneCadastroNumeroRef}
                    className="input-control"
                    inputMode="numeric"
                    value={formatarNumeroTelefone(telefoneCadastroPartes.numero)}
                    onChange={e=>alterarNumeroCadastro(e.target.value)}
                    placeholder="99999-9999"
                    aria-label="Número do telefone cadastral"
                  />
                </div>
              </Campo>
            ) : (
              <Campo label="Telefone cadastral">
                <input
                  className="input-control"
                  value={f.telefone_cadastral||""}
                  onChange={e=>s("telefone_cadastral",e.target.value)}
                />
              </Campo>
            )}
            <Campo label="E-mail cadastral"><input className="input-control" value={f.email_cadastral||""} onChange={e=>s("email_cadastral",e.target.value)}/></Campo>
          </div>
        </div>
      ) : null}

      {secao==="contato" ? (
        <div>
          <div className="mb-4"><h4 className="font-black">Contato principal</h4><p className="text-sm text-slate-500">Pessoa responsável pela conta PrecificaCont.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Responsável"><input className="input-control" value={f.responsavel_nome||""} onChange={e=>s("responsavel_nome",e.target.value)}/></Campo>
            <Campo label="E-mail"><input className="input-control" type="email" value={f.email_responsavel||""} onChange={e=>s("email_responsavel",e.target.value)}/></Campo>
            <Campo label="Telefone">
              <div className="grid grid-cols-[92px_1fr] gap-2">
                <input className="input-control text-center" inputMode="numeric" maxLength={2}
                  value={telefoneResponsavelPartes.ddd}
                  onChange={e=>alterarDddTelefoneResponsavel(e.target.value)}
                  placeholder="DDD" aria-label="DDD do telefone"/>
                <input ref={telefoneResponsavelNumeroRef} className="input-control" inputMode="numeric"
                  value={formatarNumeroTelefone(telefoneResponsavelPartes.numero)}
                  onChange={e=>alterarNumeroTelefoneResponsavel(e.target.value)}
                  placeholder="99999-9999" aria-label="Número do telefone"/>
              </div>
            </Campo>
            <Campo label="WhatsApp">
              <div className="grid grid-cols-[92px_1fr] gap-2">
                <input className="input-control text-center" inputMode="numeric" maxLength={2}
                  value={whatsappResponsavelPartes.ddd}
                  onChange={e=>alterarDddWhatsappResponsavel(e.target.value)}
                  placeholder="DDD" aria-label="DDD do WhatsApp"/>
                <input ref={whatsappResponsavelNumeroRef} className="input-control" inputMode="numeric"
                  value={formatarNumeroTelefone(whatsappResponsavelPartes.numero)}
                  onChange={e=>alterarNumeroWhatsappResponsavel(e.target.value)}
                  placeholder="99999-9999" aria-label="Número do WhatsApp"/>
              </div>
            </Campo>
          </div>
        </div>
      ) : null}

      {secao==="assinatura" ? (
        <div>
          <div className="mb-4">
            <h4 className="font-black">Assinatura PrecificaCont</h4>
            <p className="text-sm text-slate-500">O preço do plano vem da tabela, mas o valor contratado pode ser negociado por cliente.</p>
          </div>

          {!editando ? (
            <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <h5 className="text-sm font-black text-slate-900">Responsáveis pelo cliente</h5>
              <p className="mt-1 text-xs text-slate-500">No cadastro manual, o vendedor é obrigatório. Cadastros automáticos do site poderão entrar sem vendedor.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Campo label="Vendedor responsável *">
                  <select className="input-control" value={f.responsavel_comercial_id||""} onChange={e=>s("responsavel_comercial_id",e.target.value)}>
                    <option value="">Selecione...</option>
                    {equipe.filter(u=>u.ativo!==false && u.perfil!=="owner").map(u=><option key={u.id} value={u.id}>{u.nome || u.email} — {u.cargo || String(u.perfil||"").replaceAll("_"," ")}</option>)}
                    {usuarioAtual ? <option value={usuarioAtual.id}>Eu mesmo — {usuarioAtual.nome || usuarioAtual.email}</option> : null}
                  </select>
                </Campo>
                <Campo label="Pré-vendas / SDR">
                  <select className="input-control" value={f.responsavel_pre_vendas_id||""} onChange={e=>s("responsavel_pre_vendas_id",e.target.value)}>
                    <option value="">Sem pré-vendas</option>
                    {equipe.filter(u=>u.ativo!==false && u.perfil!=="owner" && (
                      String(u.cargo||"").toLowerCase().includes("sdr") ||
                      String(u.cargo||"").toLowerCase().includes("pré") ||
                      String(u.cargo||"").toLowerCase().includes("pre-vendas") ||
                      String(u.perfil||"")==="comercial"
                    )).map(u=><option key={u.id} value={u.id}>{u.nome || u.email} — {u.cargo || "Comercial"}</option>)}
                  </select>
                </Campo>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Plano">
              <select className="input-control" value={f.plano_saas_id||""} onChange={e=>selecionarPlano(e.target.value)}>
                <option value="">Selecione...</option>
                {planos.filter(p=>p.ativo!==false).map(p=><option key={p.id} value={p.id}>{p.nome} — {moeda(p.preco_mensal)}</option>)}
              </select>
            </Campo>
            <Campo label="Preço de tabela">
              <input className="input-control bg-slate-50" readOnly value={f.preco_tabela_contratacao||""} placeholder="0,00"/>
            </Campo>
            <Campo label="Valor contratado">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
                <input className="input-control" style={{paddingLeft:42}} inputMode="numeric"
                  value={f.valor_mensal||""} onChange={e=>s("valor_mensal",valorBRLInput(e.target.value))} placeholder="0,00"/>
              </div>
            </Campo>
            <Campo label="Status">
              <select className="input-control" value={f.status_assinatura||"teste"} onChange={e=>s("status_assinatura",e.target.value)}>
                <option value="teste">Teste</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option>
                <option value="suspenso">Suspenso</option><option value="inadimplente">Inadimplente</option><option value="cancelado">Cancelado</option>
              </select>
            </Campo>
            <Campo label="Origem"><input className="input-control" value={f.origem_cliente||""} onChange={e=>s("origem_cliente",e.target.value)} placeholder="Ex.: Tráfego pago"/></Campo>
            <Campo label="Início da assinatura"><input className="input-control" type="date" value={f.data_inicio_assinatura||""} onChange={e=>s("data_inicio_assinatura",e.target.value)}/></Campo>
            <Campo label="Fim do teste"><input className="input-control" type="date" value={f.data_fim_teste||""} onChange={e=>s("data_fim_teste",e.target.value)}/></Campo>
            <Campo label="Próxima cobrança"><input className="input-control" type="date" value={f.data_proxima_cobranca||""} onChange={e=>s("data_proxima_cobranca",e.target.value)}/></Campo>
            <Campo label="Limite de usuários"><input className="input-control" type="number" min="1" value={f.limite_usuarios||""} onChange={e=>s("limite_usuarios",e.target.value)}/></Campo>
          </div>

          {editando ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <h5 className="text-sm font-black text-slate-900">Módulos avulsos</h5>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Libere recursos adicionais sem trocar o plano. Módulos já incluídos no plano não aparecem aqui.
                </p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {modulosAvulsosDisponiveis.length ? modulosAvulsosDisponiveis.map(m=>(
                  <label key={m.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{m.nome}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{moeda(m.preco_avulso || 0)}/mês</p>
                    </div>
                    <input type="checkbox" checked={f.modulos_avulsos.includes(m.id)} onChange={()=>alternarAvulso(m.id)}/>
                  </label>
                )) : <p className="text-xs text-slate-500">Todos os módulos disponíveis já estão incluídos neste plano.</p>}
              </div>
            </div>
          ) : null}

          <Campo label="Observações">
            <textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm"
              value={f.observacoes_control||""} onChange={e=>s("observacoes_control",e.target.value)}/>
          </Campo>
        </div>
      ) : null}

      <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
        <button onClick={fechar} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold">Cancelar</button>
        <div className="flex gap-2">
          {secao!=="identificacao" ? (
            <button onClick={()=>setSecao(abas[Math.max(0,abas.findIndex(a=>a[0]===secao)-1)][0])}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold">Voltar</button>
          ):null}
          {secao!=="assinatura" ? (
            <button onClick={()=>setSecao(abas[Math.min(abas.length-1,abas.findIndex(a=>a[0]===secao)+1)][0])}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Continuar</button>
          ) : (
            <button onClick={()=>salvar(f)} disabled={salvando||consultando||(f.tipo_documento==="cpf"&&!validarCPF(f.documento))}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white disabled:opacity-60">
              {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar cliente"}
            </button>
          )}
        </div>
      </div>
    </ModalBase>
  );
}

function ModalCobranca({ fechar, salvar, salvando, escritorios }) {
  const [f, setF] = useState({ escritorio_id:"", descricao:"Mensalidade PrecificaCont", categoria:"mensalidade", valor:"", vencimento:"", competencia:"", status:"pendente", data_emissao:hojeISO(), observacoes:"" });
  const s=(k,v)=>setF(x=>({...x,[k]:v}));
  return <ModalBase titulo="Nova cobrança" subtitulo="Registre uma cobrança financeira do SaaS." fechar={fechar}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo label="Cliente *"><select className="input-control" value={f.escritorio_id} onChange={e=>s("escritorio_id",e.target.value)}><option value="">Selecione...</option>{escritorios.map(e=><option key={e.id} value={e.id}>{e.nome_fantasia || e.nome}</option>)}</select></Campo>
      <Campo label="Valor *"><input className="input-control" type="number" step="0.01" value={f.valor} onChange={e=>s("valor",e.target.value)} /></Campo>
      <Campo label="Descrição"><input className="input-control" value={f.descricao} onChange={e=>s("descricao",e.target.value)} /></Campo>
      <Campo label="Categoria"><input className="input-control" value={f.categoria} onChange={e=>s("categoria",e.target.value)} /></Campo>
      <Campo label="Competência"><input className="input-control" type="date" value={f.competencia} onChange={e=>s("competencia",e.target.value)} /></Campo>
      <Campo label="Vencimento"><input className="input-control" type="date" value={f.vencimento} onChange={e=>s("vencimento",e.target.value)} /></Campo>
      <Campo label="Status"><select className="input-control" value={f.status} onChange={e=>s("status",e.target.value)}><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="vencido">Vencido</option></select></Campo>
    </div>
    <button onClick={()=>salvar(f)} disabled={salvando} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{salvando ? "Salvando..." : "Cadastrar cobrança"}</button>
  </ModalBase>;
}

function ModalEquipe({ fechar, salvar, salvando }) {
  const perfis = {
    admin:{label:"Administrador",permissoes:{pode_ver_todos_clientes:true,pode_ver_financeiro:true,pode_acessar_cliente:true,pode_gerenciar_equipe:true}},
    gestor:{label:"Gestor",permissoes:{pode_ver_todos_clientes:true,pode_ver_financeiro:false,pode_acessar_cliente:true,pode_gerenciar_equipe:false}},
    comercial:{label:"Comercial",permissoes:{pode_ver_todos_clientes:false,pode_ver_financeiro:false,pode_acessar_cliente:true,pode_gerenciar_equipe:false}},
    customer_success:{label:"Customer Success",permissoes:{pode_ver_todos_clientes:false,pode_ver_financeiro:false,pode_acessar_cliente:true,pode_gerenciar_equipe:false}},
    suporte:{label:"Suporte",permissoes:{pode_ver_todos_clientes:false,pode_ver_financeiro:false,pode_acessar_cliente:true,pode_gerenciar_equipe:false}},
    financeiro:{label:"Financeiro",permissoes:{pode_ver_todos_clientes:false,pode_ver_financeiro:true,pode_acessar_cliente:false,pode_gerenciar_equipe:false}},
    leitura:{label:"Somente leitura",permissoes:{pode_ver_todos_clientes:false,pode_ver_financeiro:false,pode_acessar_cliente:false,pode_gerenciar_equipe:false}},
  };
  const [f,setF]=useState({nome:"",email:"",cargo:"",perfil:"comercial",...perfis.comercial.permissoes});
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const aplicar=(perfil)=>setF(x=>({...x,perfil,...perfis[perfil].permissoes}));

  return <ModalBase titulo="Novo colaborador" subtitulo="Cadastre a pessoa e defina o acesso inicial. Depois você pode alterar tudo em Configurações → Permissões." fechar={fechar}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo label="Nome *"><input className="input-control" value={f.nome} onChange={e=>set("nome",e.target.value)} /></Campo>
      <Campo label="E-mail *"><input className="input-control" type="email" value={f.email} onChange={e=>set("email",e.target.value)} /></Campo>
      <Campo label="Cargo"><input className="input-control" placeholder="Ex.: Executiva comercial" value={f.cargo} onChange={e=>set("cargo",e.target.value)} /></Campo>
      <Campo label="Perfil de acesso">
        <select className="input-control" value={f.perfil} onChange={e=>aplicar(e.target.value)}>
          {Object.entries(perfis).map(([id,p])=><option key={id} value={id}>{p.label}</option>)}
        </select>
      </Campo>
    </div>

    <div className="mt-5 rounded-2xl border border-slate-200 p-4">
      <p className="text-sm font-black">Escopo inicial da carteira</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className={`rounded-xl border p-4 ${!f.pode_ver_todos_clientes?'border-blue-300 bg-blue-50':'border-slate-200'}`}>
          <input type="radio" name="novo-escopo" checked={!f.pode_ver_todos_clientes} onChange={()=>set("pode_ver_todos_clientes",false)} />
          <span className="ml-2 text-sm font-black">Minha carteira</span>
          <p className="mt-1 pl-5 text-xs text-slate-500">Somente clientes atribuídos ao colaborador.</p>
        </label>
        <label className={`rounded-xl border p-4 ${f.pode_ver_todos_clientes?'border-blue-300 bg-blue-50':'border-slate-200'}`}>
          <input type="radio" name="novo-escopo" checked={f.pode_ver_todos_clientes} onChange={()=>set("pode_ver_todos_clientes",true)} />
          <span className="ml-2 text-sm font-black">Toda a carteira</span>
          <p className="mt-1 pl-5 text-xs text-slate-500">Acesso a todos os clientes do Control.</p>
        </label>
      </div>
    </div>

    <div className="mt-4 rounded-2xl border border-slate-200 p-4">
      <p className="text-sm font-black">Permissões iniciais</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[["pode_ver_financeiro","Acessar financeiro"],["pode_acessar_cliente","Acessar ambiente do cliente"],["pode_gerenciar_equipe","Gerenciar equipe"]].map(([k,l])=>
          <label key={k} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold">
            <input type="checkbox" checked={Boolean(f[k])} onChange={e=>set(k,e.target.checked)} />{l}
          </label>
        )}
      </div>
    </div>

    <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
      Este cadastro cria o colaborador e suas permissões no Control. A ativação do login será vinculada ao e-mail na etapa de autenticação, sem você precisar informar UUID.
    </div>

    <button onClick={()=>salvar(f)} disabled={salvando} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
      {salvando?"Salvando...":"Salvar colaborador"}
    </button>
  </ModalBase>;
}

function Campo({ label, children }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Mini({ label, valor }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black">{valor}</p>
    </div>
  );
}

function Bloco({ titulo, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-black">{titulo}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Linha({ label, valor }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold capitalize">{valor}</span>
    </div>
  );
}

function Vazio({ titulo, texto }) {
  return (
    <div className="px-6 py-10 text-center">
      <BarChart3 className="mx-auto text-slate-300" size={30} />
      <p className="mt-3 text-sm font-bold text-slate-700">{titulo}</p>
      <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-slate-400">{texto}</p>
    </div>
  );
}
