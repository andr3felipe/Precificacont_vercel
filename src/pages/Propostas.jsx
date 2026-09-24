import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  Plus,
  Eye,
  Pencil,
  Send,
  CheckCircle2,
  XCircle,
  Clock3,
  Copy,
  Printer,
  X,
  Save,
  Palette,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Building2,
  BriefcaseBusiness,
  ListChecks,
  CircleDollarSign,
  ShieldCheck,
  UserCheck,
  PackagePlus,
  FileCheck2,
  MessageCircle,
  Mail,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { supabase } from "../supabase";
import SelectPrecificaCont from "../components/SelectPrecificaCont";

const STORAGE_KEY = "precificacont_propostas";

const getEscritorioAtivoId = () => {
  try {
    return String(localStorage.getItem("precificacont_escritorio_ativo") || "").trim();
  } catch {
    return "";
  }
};

const storageKeyPropostas = (escritorioId) =>
  escritorioId ? `${STORAGE_KEY}_${escritorioId}` : STORAGE_KEY;
const CRM_KEY = "precificacont_crm_oportunidades";
const MENSAGEM_PROPOSTA_KEY = "precificacont_mensagem_proposta";
const SERVICOS_KEY = "precificacont_servicos";
const REGRAS_COMERCIAIS_KEY = "precificacont_regras_comerciais";
const TEMPLATE_PROPOSTA_KEY = "precificacont_template_proposta";
const FRENTES_NEGOCIO_KEY = "precificacont_frentes_negocio";
const MINUTA_CONTRATO_KEY = "precificacont_minuta_contrato";

const storageKeyTemplateProposta = (escritorioId = getEscritorioAtivoId()) =>
  escritorioId ? `${TEMPLATE_PROPOSTA_KEY}:${escritorioId}` : TEMPLATE_PROPOSTA_KEY;

const carregarTemplatePropostaLocal = () => {
  try {
    const escritorioId = getEscritorioAtivoId();
    const chaveEscopada = storageKeyTemplateProposta(escritorioId);
    const escopado = JSON.parse(localStorage.getItem(chaveEscopada) || "{}");

    if (escopado && Object.keys(escopado).length) return escopado;

    // Compatibilidade temporária com instalações antigas.
    const legado = JSON.parse(localStorage.getItem(TEMPLATE_PROPOSTA_KEY) || "{}");
    return legado && typeof legado === "object" ? legado : {};
  } catch {
    return {};
  }
};

const carregarFrentesNegocioLocal = () => {
  try {
    const escritorioId = getEscritorioAtivoId();
    const chaveEscopada = escritorioId
      ? `${FRENTES_NEGOCIO_KEY}:${escritorioId}`
      : FRENTES_NEGOCIO_KEY;

    const escopado = JSON.parse(localStorage.getItem(chaveEscopada) || "[]");
    if (Array.isArray(escopado) && escopado.length) return escopado;

    // Compatibilidade temporária com instalações antigas.
    const legado = JSON.parse(localStorage.getItem(FRENTES_NEGOCIO_KEY) || "[]");
    return Array.isArray(legado) ? legado : [];
  } catch {
    return [];
  }
};

const carregarMinutaContratoLocal = () => {
  try {
    const escritorioId = getEscritorioAtivoId();
    const chaveEscopada = escritorioId
      ? `${MINUTA_CONTRATO_KEY}:${escritorioId}`
      : MINUTA_CONTRATO_KEY;
    const escopado = JSON.parse(localStorage.getItem(chaveEscopada) || "{}");

    if (escopado && typeof escopado === "object" && Object.keys(escopado).length) {
      return escopado;
    }

    const legado = JSON.parse(localStorage.getItem(MINUTA_CONTRATO_KEY) || "{}");
    return legado && typeof legado === "object" ? legado : {};
  } catch {
    return {};
  }
};

const COVER_RECOMMENDED_WIDTH = 2480;
const COVER_RECOMMENDED_HEIGHT = 3508;
const COVER_RATIO = 210 / 297;
const COVER_RATIO_TOLERANCE = 0.035;

const proposalNumber = (sequence, year = new Date().getFullYear()) =>
  `PROP-${year}-${String(sequence).padStart(4, "0")}`;

const ensureProposalNumbers = (list) => {
  const used = new Set();
  let maxSequence = 0;

  list.forEach((item) => {
    const number = String(item?.numero_proposta || "");
    const match = number.match(/^PROP-(\d{4})-(\d{4,})$/);

    if (match) {
      used.add(number);
      maxSequence = Math.max(maxSequence, Number(match[2] || 0));
    }
  });

  return list.map((item) => {
    if (item.numero_proposta) return item;

    let next = maxSequence + 1;
    let number = proposalNumber(next);

    while (used.has(number)) {
      next += 1;
      number = proposalNumber(next);
    }

    maxSequence = next;
    used.add(number);

    return {
      ...item,
      numero_proposta: number,
    };
  });
};

const money = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const dateBR = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("pt-BR");
};

const dateTimeBR = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      });
};

const textoServicosContratados = (proposal) => {
  const itens = Array.isArray(proposal?.itens_proposta)
    ? proposal.itens_proposta
    : collectItems(proposal || {});

  if (!itens.length) return "Serviços conforme escopo apresentado na proposta.";

  return itens
    .map((item) => {
      const descricao = item.descricao || item.nome || "Serviço";
      const recorrencia = item.recorrencia === "pontual" ? "pontual" : "mensal";
      return `${descricao} — ${money(item.valor || item.total || 0)} (${recorrencia})`;
    })
    .join("\n");
};

const preencherVariaveisMinuta = (conteudo, proposal) => {
  const texto = String(conteudo || "");
  if (!texto) return "";

  const honorarios = Number(
    proposal?.valores?.honorario_matriz ||
      proposal?.valores?.honorario_contabil_fiscal ||
      0
  );

  const variaveis = {
    "{{numero_proposta}}": proposal?.numero_proposta || "—",
    "{{cliente_razao_social}}": proposal?.cliente || "—",
    "{{cliente_cnpj}}": proposal?.cnpj || "—",
    "{{frente_negocio}}":
      proposal?.frente_negocio?.nome ||
      proposal?.frente_negocio_nome ||
      proposal?.frente_negocio ||
      "—",
    "{{valor_honorarios}}": money(honorarios),
    "{{valor_mensal_total}}": money(proposal?.valores?.mensalidade_total || 0),
    "{{valor_primeiro_mes}}": money(proposal?.valores?.primeiro_mes || 0),
    "{{servicos_contratados}}": textoServicosContratados(proposal),
    "{{forma_pagamento}}": proposal?.configuracao?.formaPagamento || "A combinar",
    "{{representante_nome}}":
      proposal?.nome_aceite ||
      proposal?.dados_aceite?.nome ||
      proposal?.dados?.dados_aceite?.nome ||
      "[preenchido no aceite]",
    "{{representante_cpf}}":
      proposal?.representante_cpf ||
      proposal?.dados_aceite?.cpf ||
      proposal?.dados?.dados_aceite?.cpf ||
      "[preenchido no aceite]",
    "{{representante_cargo}}":
      proposal?.representante_cargo ||
      proposal?.dados_aceite?.cargo ||
      proposal?.dados?.dados_aceite?.cargo ||
      "[preenchido no aceite]",
    "{{representante_email}}":
      proposal?.email_aceite ||
      proposal?.dados_aceite?.email ||
      proposal?.dados?.dados_aceite?.email ||
      "[preenchido no aceite]",
    "{{representante_telefone}}":
      proposal?.representante_telefone ||
      proposal?.dados_aceite?.telefone ||
      proposal?.dados?.dados_aceite?.telefone ||
      "[preenchido no aceite]",
    "{{data_aceite}}": proposal?.aceita_em
      ? dateTimeBR(proposal.aceita_em)
      : "[registrada no aceite]",
  };

  return Object.entries(variaveis).reduce(
    (resultado, [variavel, valor]) => resultado.split(variavel).join(String(valor)),
    texto
  );
};

const statusConfig = {
  rascunho: {
    label: "Rascunho",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Pencil,
  },
  enviada: {
    label: "Enviada",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Send,
  },
  visualizada: {
    label: "Visualizada",
    className: "bg-violet-50 text-violet-700 border-violet-200",
    icon: Eye,
  },
  aceita: {
    label: "Aceita",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  recusada: {
    label: "Recusada",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  expirada: {
    label: "Expirada",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },
};

const defaultSections = () => [
  {
    id: "apresentacao",
    titulo: "Apresentação do escritório",
    subtitulo: "Quem somos",
    texto:
      "Apresente aqui o escritório, sua experiência, posicionamento, diferenciais e a forma como trabalha com seus clientes.",
    itens: [],
    ativo: true,
  },
  {
    id: "escopo",
    titulo: "Escopo de serviços",
    subtitulo: "O que está contemplado",
    texto:
      "Confira abaixo os serviços contemplados nesta proposta e suas respectivas condições.",
    itens: [],
    ativo: true,
  },
  {
    id: "investimento",
    titulo: "Investimento",
    subtitulo: "Composição comercial",
    texto:
      "A composição abaixo foi gerada a partir da precificação realizada no PrecificaCont.",
    itens: [],
    ativo: true,
  },
  {
    id: "condicoes",
    titulo: "Condições comerciais",
    subtitulo: "Condições e pagamento",
    texto:
      "As condições comerciais abaixo podem ser personalizadas antes do envio.",
    itens: [],
    ativo: true,
  },
  {
    id: "proximos_passos",
    titulo: "Próximos passos",
    subtitulo: "Como avançamos",
    texto:
      "Após o aceite desta proposta, o escritório poderá entrar em contato para formalização e início dos serviços.",
    itens: [],
    ativo: true,
  },
];

const normalizeItem = (item, fallbackIndex = 0) => {
  if (!item) return null;

  const descricao =
    item.descricao ||
    item.nome ||
    item.name ||
    item.titulo ||
    item.servico ||
    item.label ||
    `Serviço ${fallbackIndex + 1}`;

  const valor = Number(
    item.valor ??
      item.total ??
      item.valor_final ??
      item.preco ??
      item.price ??
      item.valor_mensal ??
      item.mensalidade ??
      0
  );

  const recorrenciaRaw = String(
    item.recorrencia || item.periodicidade || item.tipo || ""
  ).toLowerCase();

  const recorrencia =
    recorrenciaRaw.includes("pont") ||
    recorrenciaRaw.includes("avul") ||
    recorrenciaRaw.includes("únic") ||
    recorrenciaRaw.includes("unico")
      ? "pontual"
      : "mensal";

  const tipoItem = String(item.tipo || "").toLowerCase();

  const categoriaAutomatica =
    tipoItem === "departamento_pessoal"
      ? "Departamento Pessoal"
      : tipoItem === "filial"
      ? "Honorários — Filial"
      : tipoItem === "honorario_matriz"
      ? "Honorários — Matriz"
      : item.servico_adicional ||
        item.tipo_servico === "adicional" ||
        tipoItem === "servico_adicional"
      ? "Serviço adicional"
      : recorrencia === "mensal"
      ? "Honorários"
      : "Serviço";

  return {
    ...item,
    descricao,
    valor,
    total: Number(item.total ?? valor),
    quantidade: Number(item.quantidade || 1),
    valor_unitario: Number(item.valor_unitario ?? item.valorUnitario ?? 0),
    recorrencia,
    categoria: item.categoria || categoriaAutomatica,
    observacao: item.observacao || item.descricao_detalhada || "",
  };
};

const collectItems = (proposal) => {
  const sources = [
    proposal.itens_proposta,
    proposal.itens,
    proposal.servicos,
    proposal.servicos_adicionais,
    proposal.servicosSelecionados,
    proposal.servicos_selecionados,
    proposal.composicao,
    proposal.composicao_comercial,
  ];

  const result = [];

  sources.forEach((source) => {
    if (Array.isArray(source)) {
      source.forEach((item) => {
        const normalized = normalizeItem(item, result.length);
        if (normalized) result.push(normalized);
      });
    }
  });

  const unique = [];
  const seen = new Set();

  result.forEach((item) => {
    const key = `${item.descricao}|${item.valor}|${item.recorrencia}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  });

  return unique;
};

const normalize = (proposal) => {
  const itens = collectItems(proposal);

  const baseConfig = proposal.configuracao || {};
  const sections =
    Array.isArray(baseConfig.secoes) && baseConfig.secoes.length
      ? baseConfig.secoes
      : defaultSections();

  const condicaoComercialSimulacao = proposal.condicao_comercial || {};
  const descontoSimulacaoPercentual = Number(
    condicaoComercialSimulacao.desconto_percentual ??
      proposal.valores?.desconto_comercial_percentual ??
      0
  );
  const descontoSimulacaoValor = Number(
    condicaoComercialSimulacao.desconto_valor ??
      proposal.valores?.desconto_comercial_valor ??
      0
  );
  const mensalidadeBrutaSimulacao = Number(
    condicaoComercialSimulacao.mensalidade_bruta ??
      proposal.valores?.mensalidade_bruta ??
      proposal.valores?.valor_original_mensal ??
      0
  );

  const valores = {
    honorario_matriz: Number(
      proposal.valores?.honorario_matriz ??
        proposal.honorario_matriz ??
        0
    ),
    honorario_contabil_fiscal: Number(
      proposal.valores?.honorario_contabil_fiscal ??
        proposal.pricing_snapshot?.resultado?.contabil_fiscal ??
        proposal.matriz?.valor_contabil_fiscal ??
        0
    ),
    departamento_pessoal: Number(
      proposal.valores?.departamento_pessoal ??
        proposal.composicao_detalhada?.departamento_pessoal?.total ??
        proposal.pricing_snapshot?.departamento_pessoal?.total ??
        proposal.pricing_snapshot?.resultado?.dp ??
        proposal.matriz?.departamento_pessoal?.total ??
        0
    ),
    filiais: Number(
      proposal.valores?.filiais ??
        proposal.valorFiliais ??
        proposal.valor_filiais ??
        0
    ),
    servicos_recorrentes: Number(
      proposal.valores?.servicos_recorrentes ??
        proposal.valor_servicos_mensais ??
        itens
          .filter((x) => x.recorrencia === "mensal")
          .reduce((s, x) => s + x.valor, 0)
    ),
    servicos_pontuais: Number(
      proposal.valores?.servicos_pontuais ??
        proposal.valor_servicos_pontuais ??
        itens
          .filter((x) => x.recorrencia === "pontual")
          .reduce((s, x) => s + x.valor, 0)
    ),
    mensalidade_total: Number(
      proposal.valores?.mensalidade_total ??
        proposal.valor_mensal ??
        proposal.mensalidade ??
        0
    ),
    primeiro_mes: Number(
      proposal.valores?.primeiro_mes ??
        proposal.valor_total_primeiro_mes ??
        0
    ),
  };

  if (!valores.mensalidade_total) {
    valores.mensalidade_total =
      valores.honorario_matriz +
      valores.filiais +
      valores.servicos_recorrentes;
  }

  if (!valores.primeiro_mes) {
    valores.primeiro_mes =
      valores.mensalidade_total + valores.servicos_pontuais;
  }

  return {
    ...proposal,
    id:
      proposal.id ||
      `PROP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: proposal.status || "rascunho",
    numero_proposta: proposal.numero_proposta || "",
    cliente:
      proposal.cliente ||
      proposal.client_nome ||
      proposal.cliente_nome ||
      proposal.nome_cliente ||
      proposal.nomeCliente ||
      proposal.cliente?.nome ||
      proposal.cliente?.razao_social ||
      proposal.razao_social ||
      proposal.nome_fantasia ||
      proposal.empresa ||
      proposal.empresa?.nome ||
      proposal.empresa?.razao_social ||
      "Cliente sem nome",
    cnpj:
      proposal.cnpj ||
      proposal.documento ||
      proposal.cpf_cnpj ||
      proposal.cpfCnpj ||
      proposal.dados?.cnpj ||
      proposal.dados?.documento ||
      proposal.dados?.cpf_cnpj ||
      proposal.dados?.cpfCnpj ||
      proposal.cliente_dados?.cnpj ||
      proposal.cliente_dados?.documento ||
      proposal.empresa?.cnpj ||
      proposal.empresa?.documento ||
      proposal.pricing_snapshot?.cnpj ||
      proposal.pricing_snapshot?.documento ||
      "",
    itens_proposta: itens,
    valores: {
      ...valores,
      valor_original_mensal:
        Number(valores.valor_original_mensal || 0) ||
        mensalidadeBrutaSimulacao ||
        Number(valores.mensalidade_total || 0),
    },
    comercial: {
      ...(proposal.comercial || {}),
      valor_original_mensal:
        Number(proposal.comercial?.valor_original_mensal || 0) ||
        mensalidadeBrutaSimulacao ||
        Number(valores.mensalidade_total || 0),
      valor_final_mensal:
        Number(proposal.comercial?.valor_final_mensal || 0) ||
        Number(condicaoComercialSimulacao.mensalidade_final || 0) ||
        Number(valores.mensalidade_total || 0),
      desconto: {
        ...(proposal.comercial?.desconto || {}),
        aplicado:
          proposal.comercial?.desconto?.aplicado === true ||
          condicaoComercialSimulacao.aplicar_desconto === true ||
          descontoSimulacaoValor > 0,
        tipo: proposal.comercial?.desconto?.tipo || "percentual",
        valor_informado:
          proposal.comercial?.desconto?.valor_informado ??
          descontoSimulacaoPercentual,
        valor_desconto:
          Number(proposal.comercial?.desconto?.valor_desconto || 0) ||
          descontoSimulacaoValor,
        percentual_efetivo:
          Number(proposal.comercial?.desconto?.percentual_efetivo || 0) ||
          descontoSimulacaoPercentual,
        percentual_maximo_parametrizado:
          Number(
            proposal.comercial?.desconto?.percentual_maximo_parametrizado || 0
          ) ||
          Number(
            condicaoComercialSimulacao.desconto_percentual_maximo_parametrizado ||
              0
          ),
      },
    },
    validade:
      proposal.validade ||
      new Date(Date.now() + 7 * 86400000).toISOString(),
    publicada_em: proposal.publicada_em || null,
    configuracao: {
      titulo:
        baseConfig.titulo ||
        "Proposta Comercial de Serviços Contábeis",
      subtitulo: baseConfig.subtitulo || "",
      mensagem:
        baseConfig.mensagem ||
        "Apresentamos uma proposta personalizada para sua empresa.",
      condicoes:
        baseConfig.condicoes ||
        "Valores e condições conforme os itens apresentados nesta proposta.",
      observacoes: baseConfig.observacoes || "",
      formaPagamento: baseConfig.formaPagamento || "A combinar",
      cor: baseConfig.cor || "#123A63",
      corSecundaria: baseConfig.corSecundaria || "#2563EB",
      validadeDias: Number(baseConfig.validadeDias || 7),
      logo: baseConfig.logo || proposal.logo || "",
      capaImagem: baseConfig.capaImagem || "",
      capaModo: baseConfig.capaModo || "sistema",
      capaMostrarTexto:
        baseConfig.capaMostrarTexto !== false,
      capaEscurecimento: Number(
        baseConfig.capaEscurecimento ?? 38
      ),
      capaInfo: baseConfig.capaInfo || null,
      apresentacaoEscritorio:
        baseConfig.apresentacaoEscritorio || "",
      rodape:
        baseConfig.rodape ||
        "Documento comercial. Valores sujeitos às condições descritas nesta proposta.",
      secoes: sections,
    },
  };
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.rascunho;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-3">{value}</div>
      {detail && <div className="text-xs text-slate-400 mt-1">{detail}</div>}
    </div>
  );
}


const somenteDigitos = (value) => String(value || "").replace(/\D/g, "");

const registrarHistoricoCRM = (oportunidade, evento) => [
  ...(Array.isArray(oportunidade.historico) ? oportunidade.historico : []),
  {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    criadoEm: new Date().toISOString(),
    ...evento,
  },
];

const localizarOportunidadeCRM = (lista, proposal) => {
  const oportunidadeId =
    proposal.crm_oportunidade_id ||
    proposal.oportunidade_id ||
    proposal.crmId ||
    null;

  if (oportunidadeId) {
    const porId = lista.find((item) => String(item.id) === String(oportunidadeId));
    if (porId) return porId;
  }

  const documento = somenteDigitos(proposal.cnpj || proposal.documento);
  if (documento) {
    const porDocumento = lista.find(
      (item) => somenteDigitos(item.documento || item.cnpj) === documento
    );
    if (porDocumento) return porDocumento;
  }

  const cliente = String(proposal.cliente || "").trim().toLowerCase();
  if (cliente && cliente !== "cliente sem nome") {
    const candidatos = lista.filter(
      (item) => String(item.cliente || "").trim().toLowerCase() === cliente
    );
    if (candidatos.length === 1) return candidatos[0];
  }

  return null;
};

const sincronizarCRMComProposta = async (proposal, evento) => {
  try {
    const escritorioId = getEscritorioAtivoId();
    if (!escritorioId) return false;

    const crmKeyEscopada = `${CRM_KEY}:${escritorioId}`;

    let raw = JSON.parse(localStorage.getItem(crmKeyEscopada) || "[]");

    // Compatibilidade com dados antigos ainda salvos sem escopo.
    if ((!Array.isArray(raw) || !raw.length) && localStorage.getItem(CRM_KEY)) {
      raw = JSON.parse(localStorage.getItem(CRM_KEY) || "[]");
    }

    let oportunidades = Array.isArray(raw) ? raw : [];
    let encontrada = localizarOportunidadeCRM(oportunidades, proposal);

    // O CRM usa o Supabase como fonte principal. Se a oportunidade não estiver no
    // cache local (por exemplo, cache desatualizado ou limpo), procura no banco
    // antes de criar uma nova. Isso preserva a oportunidade original e garante
    // que o aceite da proposta mova o negócio correto para a etapa "ganho".
    if (!encontrada) {
      const { data: oportunidadesBanco, error: crmBuscaError } = await supabase
        .from("crm_oportunidades")
        .select("*")
        .eq("escritorio_id", escritorioId);

      if (crmBuscaError) {
        console.warn(
          "Propostas: não foi possível consultar o CRM no Supabase antes da sincronização.",
          crmBuscaError
        );
      } else if (Array.isArray(oportunidadesBanco) && oportunidadesBanco.length) {
        const oportunidadesRemotas = oportunidadesBanco.map((row) => ({
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
        }));

        encontrada = localizarOportunidadeCRM(oportunidadesRemotas, proposal);

        if (encontrada) {
          const idsLocais = new Set(oportunidades.map((item) => String(item.id)));
          oportunidades = [
            ...oportunidades,
            ...oportunidadesRemotas.filter(
              (item) => !idsLocais.has(String(item.id))
            ),
          ];
        }
      }
    }

    const agora = new Date().toISOString();
    const numero = proposal.numero_proposta || "Proposta";
    const valor = Number(
      proposal.valores?.mensalidade_total ||
      proposal.valores?.total_mensal ||
      proposal.valor_mensal ||
      0
    );

    // Se a proposta nasceu fora do CRM, ela também precisa entrar no funil comercial.
    // Ao criar a proposta, nasce em "simulacao"; no aceite, nasce diretamente como "ganho".
    if (!encontrada && ["criada", "aceita"].includes(evento)) {
      const novoId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      encontrada = {
        id: novoId,
        cliente: proposal.cliente || "Cliente sem nome",
        documento: proposal.cnpj || proposal.documento || "",
        contato:
          proposal.nome_aceite ||
          proposal.dados?.contato ||
          "",
        email:
          proposal.email_cliente ||
          proposal.email_aceite ||
          proposal.email ||
          "",
        telefone:
          proposal.telefone ||
          proposal.whatsapp ||
          proposal.celular ||
          "",
        valorMensal: valor,
        etapa: evento === "aceita" ? "ganho" : "simulacao",
        origem: "Proposta PrecificaCont",
        proximaAtividade: "",
        dataFollowup: "",
        proposta: numero,
        observacoes:
          evento === "aceita"
            ? "Oportunidade criada automaticamente após o aceite da proposta."
            : "Oportunidade criada automaticamente a partir de uma proposta gerada no PrecificaCont.",
        motivoPerda: "",
        atividades: [],
        historico: [
          {
            id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            criadoEm: agora,
            tipo: evento === "aceita" ? "proposta_aceita" : "proposta_criada",
            titulo:
              evento === "aceita"
                ? "Proposta aceita · oportunidade criada como ganha"
                : "Proposta criada · oportunidade criada no CRM",
            descricao:
              evento === "aceita"
                ? `${numero} aceita pelo cliente${
                    valor ? ` · ${money(valor)}/mês` : ""
                  }. A oportunidade foi criada automaticamente no CRM como Ganho.`
                : `${numero} criada para o cliente${
                    valor ? ` · ${money(valor)}/mês` : ""
                  }. A oportunidade foi criada automaticamente no CRM.`,
            numero_proposta: proposal.numero_proposta,
          },
        ],
        etapaAlteradaEm: agora,
        ganhoEm: evento === "aceita" ? proposal.aceita_em || agora : null,
        perdidoEm: null,
        reabertaEm: null,
        createdAt: agora,
        updatedAt: agora,
      };

      oportunidades = [encontrada, ...oportunidades];
    }

    if (!encontrada) return false;

    const atualizadas = oportunidades.map((item) => {
      if (String(item.id) !== String(encontrada.id)) return item;

      if (evento === "criada") {
        if (["ganho", "perdido"].includes(item.etapa)) return item;

        const jaRegistrado = Array.isArray(item.historico)
          ? item.historico.some(
              (h) =>
                h.tipo === "proposta_criada" &&
                h.numero_proposta === proposal.numero_proposta
            )
          : false;

        return {
          ...item,
          etapa: "simulacao",
          etapaAlteradaEm: agora,
          proposta: numero,
          proposta_id: proposal.id,
          proposta_numero: proposal.numero_proposta,
          proposta_status: "rascunho",
          proposta_valor_mensal: valor,
          updatedAt: agora,
          historico: jaRegistrado
            ? item.historico
            : registrarHistoricoCRM(item, {
                tipo: "proposta_criada",
                titulo: "Proposta criada",
                descricao: `${numero} criada${
                  valor ? ` · ${money(valor)}/mês` : ""
                }. Oportunidade mantida na etapa Simulação até o envio ao cliente.`,
                numero_proposta: proposal.numero_proposta,
              }),
        };
      }

      if (evento === "enviada") {
        if (["ganho", "perdido"].includes(item.etapa)) return item;

        const jaRegistrado = Array.isArray(item.historico)
          ? item.historico.some(
              (h) =>
                h.tipo === "proposta_enviada" &&
                h.numero_proposta === proposal.numero_proposta
            )
          : false;

        return {
          ...item,
          etapa: "proposta_enviada",
          etapaAlteradaEm: agora,
          proposta: numero,
          proposta_id: proposal.id,
          proposta_numero: proposal.numero_proposta,
          proposta_status: "enviada",
          proposta_valor_mensal: valor,
          updatedAt: agora,
          historico: jaRegistrado
            ? item.historico
            : registrarHistoricoCRM(item, {
                tipo: "proposta_enviada",
                titulo: "Proposta enviada",
                descricao: `${numero} enviada ao cliente${
                  valor ? ` · ${money(valor)}/mês` : ""
                }.`,
                numero_proposta: proposal.numero_proposta,
              }),
        };
      }

      if (evento === "visualizada") {
        const jaRegistrado = Array.isArray(item.historico)
          ? item.historico.some(
              (h) =>
                h.tipo === "proposta_visualizada" &&
                h.numero_proposta === proposal.numero_proposta
            )
          : false;

        return {
          ...item,
          proposta: numero,
          proposta_id: proposal.id,
          proposta_numero: proposal.numero_proposta,
          proposta_status: "visualizada",
          updatedAt: agora,
          historico: jaRegistrado
            ? item.historico
            : registrarHistoricoCRM(item, {
                tipo: "proposta_visualizada",
                titulo: "Proposta visualizada",
                descricao: `O cliente visualizou a ${numero}.`,
                numero_proposta: proposal.numero_proposta,
              }),
        };
      }

      if (evento === "aceita") {
        const jaRegistrado = Array.isArray(item.historico)
          ? item.historico.some(
              (h) =>
                h.tipo === "proposta_aceita" &&
                h.numero_proposta === proposal.numero_proposta
            )
          : false;

        return {
          ...item,
          etapa: "ganho",
          etapaAlteradaEm: agora,
          ganhoEm: proposal.aceita_em || agora,
          proposta: numero,
          proposta_id: proposal.id,
          proposta_numero: proposal.numero_proposta,
          proposta_status: "aceita",
          proposta_valor_mensal: valor,
          valorMensal: valor || Number(item.valorMensal || 0),
          updatedAt: agora,
          historico: jaRegistrado
            ? item.historico
            : registrarHistoricoCRM(item, {
                tipo: "proposta_aceita",
                titulo: "Proposta aceita · oportunidade ganha",
                descricao: `${numero} aceita pelo cliente${
                  valor ? ` · ${money(valor)}/mês` : ""
                }. A oportunidade foi movida automaticamente para Ganho.`,
                numero_proposta: proposal.numero_proposta,
              }),
        };
      }

      if (evento === "recusada") {
        const jaRegistrado = Array.isArray(item.historico)
          ? item.historico.some(
              (h) =>
                h.tipo === "proposta_recusada" &&
                h.numero_proposta === proposal.numero_proposta
            )
          : false;

        return {
          ...item,
          proposta: numero,
          proposta_id: proposal.id,
          proposta_numero: proposal.numero_proposta,
          proposta_status: "recusada",
          updatedAt: agora,
          historico: jaRegistrado
            ? item.historico
            : registrarHistoricoCRM(item, {
                tipo: "proposta_recusada",
                titulo: "Proposta recusada",
                descricao: `${numero} foi recusada. A oportunidade permaneceu aberta para decisão comercial.`,
                numero_proposta: proposal.numero_proposta,
              }),
        };
      }

      return item;
    });

    localStorage.setItem(crmKeyEscopada, JSON.stringify(atualizadas));

    // Mantém chave antiga apenas para compatibilidade temporária.
    if (localStorage.getItem(CRM_KEY)) {
      localStorage.setItem(CRM_KEY, JSON.stringify(atualizadas));
    }

    // O CRM atual usa Supabase como persistência principal.
    // Gravamos a oportunidade alterada/criada também na tabela oficial do CRM.
    const oportunidadeAtualizada = atualizadas.find(
      (item) => String(item.id) === String(encontrada.id)
    );

    if (oportunidadeAtualizada) {
      const payloadCRM = {
        id: oportunidadeAtualizada.id,
        escritorio_id: escritorioId,
        cliente: oportunidadeAtualizada.cliente || "",
        documento: oportunidadeAtualizada.documento || "",
        contato: oportunidadeAtualizada.contato || "",
        email: oportunidadeAtualizada.email || "",
        telefone: oportunidadeAtualizada.telefone || "",
        valor_mensal: Number(oportunidadeAtualizada.valorMensal || 0),
        etapa: oportunidadeAtualizada.etapa || "novo_lead",
        origem: oportunidadeAtualizada.origem || "",
        proxima_atividade: oportunidadeAtualizada.proximaAtividade || "",
        data_followup: oportunidadeAtualizada.dataFollowup || null,
        proposta: oportunidadeAtualizada.proposta || "",
        observacoes: oportunidadeAtualizada.observacoes || "",
        motivo_perda: oportunidadeAtualizada.motivoPerda || "",
        atividades: Array.isArray(oportunidadeAtualizada.atividades)
          ? oportunidadeAtualizada.atividades
          : [],
        historico: Array.isArray(oportunidadeAtualizada.historico)
          ? oportunidadeAtualizada.historico
          : [],
        etapa_alterada_em: oportunidadeAtualizada.etapaAlteradaEm || null,
        ganho_em: oportunidadeAtualizada.ganhoEm || null,
        perdido_em: oportunidadeAtualizada.perdidoEm || null,
        reaberta_em: oportunidadeAtualizada.reabertaEm || null,
        created_at: oportunidadeAtualizada.createdAt || agora,
        updated_at: agora,
      };

      const { error: crmError } = await supabase
        .from("crm_oportunidades")
        .upsert(payloadCRM, { onConflict: "id" });

      if (crmError) {
        console.error("Erro ao sincronizar aceite com CRM no Supabase:", crmError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Erro ao sincronizar proposta com CRM:", error);
    return false;
  }
};


const PROPOSTAS_DARK_CSS = `
  html.dark .precificacont-propostas {
    background:
      radial-gradient(circle at 88% 0%, rgba(37,99,235,.11), transparent 28rem),
      #07101f !important;
    color: #e5edf8;
  }

  html.dark .precificacont-propostas .bg-white {
    background-color: #0c1a2f !important;
  }
  html.dark .precificacont-propostas .bg-slate-50,
  html.dark .precificacont-propostas .bg-slate-50\/50,
  html.dark .precificacont-propostas .bg-slate-50\/70 {
    background-color: #10213a !important;
  }
  html.dark .precificacont-propostas .bg-slate-100 {
    background-color: #13233a !important;
  }

  html.dark .precificacont-propostas .border-slate-100,
  html.dark .precificacont-propostas .border-slate-200,
  html.dark .precificacont-propostas .border-slate-300 {
    border-color: rgba(96,165,250,.18) !important;
  }

  html.dark .precificacont-propostas .text-slate-950,
  html.dark .precificacont-propostas .text-slate-900,
  html.dark .precificacont-propostas .text-slate-800 {
    color: #f8fafc !important;
  }
  html.dark .precificacont-propostas .text-slate-700,
  html.dark .precificacont-propostas .text-slate-600 {
    color: #cbd5e1 !important;
  }
  html.dark .precificacont-propostas .text-slate-500 {
    color: #9fb0c7 !important;
  }
  html.dark .precificacont-propostas .text-slate-400 {
    color: #71839c !important;
  }

  html.dark .precificacont-propostas .text-blue-600,
  html.dark .precificacont-propostas .text-blue-700 {
    color: #60a5fa !important;
  }
  html.dark .precificacont-propostas .text-violet-700 {
    color: #a78bfa !important;
  }
  html.dark .precificacont-propostas .text-emerald-700 {
    color: #34d399 !important;
  }
  html.dark .precificacont-propostas .text-rose-700 {
    color: #fb7185 !important;
  }
  html.dark .precificacont-propostas .text-amber-700 {
    color: #fbbf24 !important;
  }

  html.dark .precificacont-propostas .bg-blue-50 {
    background-color: rgba(37,99,235,.15) !important;
  }
  html.dark .precificacont-propostas .bg-violet-50 {
    background-color: rgba(139,92,246,.15) !important;
  }
  html.dark .precificacont-propostas .bg-emerald-50 {
    background-color: rgba(16,185,129,.14) !important;
  }
  html.dark .precificacont-propostas .bg-rose-50 {
    background-color: rgba(244,63,94,.13) !important;
  }
  html.dark .precificacont-propostas .bg-amber-50 {
    background-color: rgba(245,158,11,.14) !important;
  }

  html.dark .precificacont-propostas input,
  html.dark .precificacont-propostas select,
  html.dark .precificacont-propostas textarea {
    background-color: #09172a !important;
    border-color: rgba(96,165,250,.22) !important;
    color: #f8fafc !important;
    color-scheme: dark;
  }
  html.dark .precificacont-propostas input::placeholder,
  html.dark .precificacont-propostas textarea::placeholder {
    color: #64748b !important;
  }
  html.dark .precificacont-propostas select option {
    background: #09172a;
    color: #f8fafc;
  }

  html.dark .precificacont-propostas table thead,
  html.dark .precificacont-propostas thead tr,
  html.dark .precificacont-propostas thead th {
    background: #10213a !important;
    color: #9fb0c7 !important;
  }
  html.dark .precificacont-propostas tbody tr,
  html.dark .precificacont-propostas tbody td {
    border-color: rgba(96,165,250,.10) !important;
  }
  html.dark .precificacont-propostas tbody tr:hover {
    background: #102440 !important;
  }

  html.dark .precificacont-propostas .hover\:bg-slate-50:hover,
  html.dark .precificacont-propostas .hover\:bg-slate-100:hover {
    background-color: #18304f !important;
  }

  html.dark .precificacont-propostas .fixed.inset-0[class*="bg-slate-950"],
  html.dark .precificacont-propostas .fixed.inset-0[class*="bg-black"] {
    background-color: rgba(2,6,23,.78) !important;
  }

  html.dark .precificacont-propostas [class*="shadow"] {
    box-shadow: 0 18px 45px rgba(0,0,0,.20) !important;
  }


  /* Bloco "Sobre o escritório" no preview da proposta.
     Mantém o PDF/impressão intactos e corrige apenas a visualização dark. */
  html.dark .precificacont-propostas .proposal-office-about {
    background-color: #10213a !important;
    border-color: rgba(96,165,250,.22) !important;
  }
  html.dark .precificacont-propostas .proposal-office-about-title {
    color: #93c5fd !important;
  }
  html.dark .precificacont-propostas .proposal-office-about-text {
    color: #e2e8f0 !important;
  }
`;

export default function Propostas({ setPagina }) {
  const escritorioId = getEscritorioAtivoId();
  const STORAGE_KEY_ATUAL = storageKeyPropostas(escritorioId);
  const [propostas, setPropostas] = useState([]);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [selecionada, setSelecionada] = useState(null);
  const [comprovanteAceite, setComprovanteAceite] = useState(null);
  const [editando, setEditando] = useState(null);
  const [toast, setToast] = useState("");
  const [compartilhando, setCompartilhando] = useState(null);
  const [mensagemEditavel, setMensagemEditavel] = useState("");
  const [preparandoCompartilhamento, setPreparandoCompartilhamento] =
    useState(false);
  const [excluindoProposta, setExcluindoProposta] = useState(false);
  const [novaPropostaOpen, setNovaPropostaOpen] = useState(false);
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
      if (!escritorioId) {
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

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const userId = authData?.user?.id;
        if (!userId) throw new Error("Usuário autenticado não identificado.");

        const { data: vinculo, error: vinculoError } = await supabase
          .from("usuarios_escritorios")
          .select("perfil, perfil_acesso_id, ativo")
          .eq("user_id", userId)
          .eq("escritorio_id", escritorioId)
          .eq("ativo", true)
          .maybeSingle();

        if (vinculoError) throw vinculoError;

        // Compatibilidade: o administrador legado continua com acesso total.
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
          .eq("codigo", "propostas")
          .eq("ativo", true)
          .maybeSingle();

        if (moduloError) throw moduloError;

        if (!modulo?.id) {
          throw new Error('Módulo "propostas" não encontrado.');
        }

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
        console.error("Erro ao carregar permissões do módulo Propostas:", error);
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
  }, [escritorioId]);

  const negarAcao = (mensagem) => {
    setToast(mensagem);
    setTimeout(() => setToast(""), 3500);
  };

  const carregar = async () => {
    if (!escritorioId) {
      setPropostas([]);
      setToast("Nenhum escritório ativo foi identificado.");
      return;
    }

    // PERFORMANCE:
    // Mostra imediatamente o cache local enquanto o Supabase sincroniza
    // em segundo plano. Isso não altera o modal, o PDF ou o fluxo do CRM.
    try {
      const rawCache = JSON.parse(localStorage.getItem(STORAGE_KEY_ATUAL) || "[]");
      const cacheNormalizado = Array.isArray(rawCache)
        ? ensureProposalNumbers(rawCache.map(normalize))
        : [];

      if (cacheNormalizado.length) {
        setPropostas(cacheNormalizado);
      }
    } catch (error) {
      console.warn("Não foi possível carregar o cache imediato de propostas:", error);
    }

    // Libera o navegador para pintar a tela antes da consulta remota.
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      const { data, error } = await supabase
        .from("propostas")
        .select(
          "id, escritorio_id, numero_proposta, token_publico, cliente, cnpj, email_cliente, titulo, status, validade, dados, publicada, visualizada_em, primeira_visualizacao_em, ultima_visualizacao_em, total_visualizacoes, aceita_em, nome_aceite, email_aceite, created_at, updated_at"
        )
        .eq("escritorio_id", escritorioId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const remotas = (data || []).map((row) =>
        normalize({
          ...(row.dados || {}),
          supabase_id: row.id,
          escritorio_id: row.escritorio_id || escritorioId,
          numero_proposta:
            row.numero_proposta || row.dados?.numero_proposta,
          token_publico:
            row.token_publico || row.dados?.token_publico || null,
          cliente: row.cliente || row.dados?.cliente,
          cnpj: row.cnpj || row.dados?.cnpj,
          email_cliente:
            row.email_cliente || row.dados?.email_cliente || "",
          titulo: row.titulo || row.dados?.titulo,
          status: row.status || row.dados?.status || "rascunho",
          validade: row.validade || row.dados?.validade || null,
          publicada: Boolean(row.publicada),
          publicada_em: row.dados?.publicada_em || null,
          visualizada_em:
            row.visualizada_em || row.dados?.visualizada_em || null,
          primeira_visualizacao_em:
            row.primeira_visualizacao_em ||
            row.dados?.primeira_visualizacao_em ||
            null,
          ultima_visualizacao_em:
            row.ultima_visualizacao_em ||
            row.dados?.ultima_visualizacao_em ||
            null,
          total_visualizacoes: Number(
            row.total_visualizacoes ??
              row.dados?.total_visualizacoes ??
              0
          ),
          aceita_em: row.aceita_em || row.dados?.aceita_em || null,
          nome_aceite:
            row.nome_aceite ||
            row.dados?.nome_aceite ||
            row.dados?.dados_aceite?.nome ||
            "",
          email_aceite:
            row.email_aceite ||
            row.dados?.email_aceite ||
            row.dados?.dados_aceite?.email ||
            "",
          dados_aceite:
            row.dados?.dados_aceite ||
            row.dados_aceite ||
            null,
          representante_cpf:
            row.dados?.representante_cpf ||
            row.dados?.dados_aceite?.cpf ||
            "",
          representante_cargo:
            row.dados?.representante_cargo ||
            row.dados?.dados_aceite?.cargo ||
            "",
          representante_telefone:
            row.dados?.representante_telefone ||
            row.dados?.dados_aceite?.telefone ||
            "",
          criado_em:
            row.dados?.criado_em || row.created_at || null,
          atualizado_em:
            row.updated_at || row.dados?.atualizado_em || null,
          link_publico:
            row.publicada && row.token_publico
              ? `${window.location.origin}/proposta/${row.token_publico}`
              : row.dados?.link_publico || "",
        })
      );

      let locais = [];
      try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_ATUAL) || "[]");
        locais = Array.isArray(raw) ? raw.map(normalize) : [];
      } catch {
        locais = [];
      }

      const numerosRemotos = new Set(
        remotas.map((proposal) => proposal.numero_proposta).filter(Boolean)
      );

      const somenteLocais = locais.filter(
        (proposal) =>
          proposal.numero_proposta &&
          !numerosRemotos.has(proposal.numero_proposta) &&
          proposal.itens_proposta?.length
      );

      let lista = ensureProposalNumbers([...remotas, ...somenteLocais]);

      setPropostas(lista);
      salvarCacheLocalLeve(lista);

      // Se o usuário veio do CRM pelo botão "Abrir proposta",
      // abre diretamente a proposta vinculada depois que a lista
      // completa (inclusive Supabase) já estiver carregada.
      try {
        const referenciaCRM = String(
          localStorage.getItem("precificacont_abrir_proposta") || ""
        ).trim();

        if (referenciaCRM) {
          const propostaCRM = lista.find((proposal) => {
            const numero = String(proposal.numero_proposta || "").trim();
            const idLocal = String(proposal.id || "").trim();
            const idSupabase = String(proposal.supabase_id || "").trim();

            return (
              numero === referenciaCRM ||
              idLocal === referenciaCRM ||
              idSupabase === referenciaCRM
            );
          });

          if (propostaCRM) {
            setEditando(null);
            setCompartilhando(null);
            setSelecionada(propostaCRM);
            localStorage.removeItem("precificacont_abrir_proposta");
          } else {
            console.warn(
              "Proposta solicitada pelo CRM não encontrada:",
              referenciaCRM
            );
          }
        }
      } catch (error) {
        console.error(
          "Erro ao abrir diretamente a proposta solicitada pelo CRM:",
          error
        );
      }

      lista.forEach((proposal) => {
        if (proposal.status === "aceita") {
          sincronizarCRMComProposta(proposal, "aceita");
        } else if (
          proposal.status === "visualizada" ||
          Number(proposal.total_visualizacoes || 0) > 0
        ) {
          sincronizarCRMComProposta(proposal, "visualizada");
        }
      });
    } catch (error) {
      console.error("Erro ao carregar propostas do Supabase:", error);

      try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_ATUAL) || "[]");
        const locais = Array.isArray(raw) ? raw.map(normalize) : [];
        setPropostas(ensureProposalNumbers(locais));
      } catch {
        setPropostas([]);
      }

      setToast(
        "Não foi possível carregar as propostas do Supabase. Exibindo o cache local disponível."
      );
      setTimeout(() => setToast(""), 4000);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (permissoesModulo.carregando) return;

    const abrirPropostaGeradaPeloCRM = async () => {
      let rawCRM = "";

      try {
        rawCRM = localStorage.getItem("precificacont_nova_proposta_crm") || "";
        if (!rawCRM) return;

        if (!permissoesModulo.pode_criar) {
          localStorage.removeItem("precificacont_nova_proposta_crm");
          negarAcao("Seu perfil não possui permissão para criar propostas.");
          return;
        }

        const draftCRM = JSON.parse(rawCRM);
        if (!draftCRM || typeof draftCRM !== "object") {
          localStorage.removeItem("precificacont_nova_proposta_crm");
          return;
        }

        const clienteCRM = String(
          draftCRM.cliente ||
          draftCRM.client_nome ||
          draftCRM.dados?.cliente ||
          ""
        ).trim();

        const documentoCRM = String(
          draftCRM.cnpj ||
          draftCRM.documento ||
          draftCRM.dados?.cnpj ||
          draftCRM.dados?.documento ||
          ""
        ).trim();

        if (!clienteCRM || !documentoCRM) {
          setSelecionada(null);
          setCompartilhando(null);
          setEditando(
            normalize({
              ...draftCRM,
              cliente: clienteCRM,
              client_nome: clienteCRM,
              cnpj: documentoCRM,
              documento: documentoCRM,
            })
          );
          return;
        }

        const agora = new Date().toISOString();

        let draftComTemplate = { ...draftCRM };

        try {
          const templateOficial = carregarTemplatePropostaLocal();

          if (templateOficial && Object.keys(templateOficial).length) {
            const configuracaoTemplate = {
              ...templateOficial,
              ...(draftCRM.configuracao || {}),
            };

            // As imagens grandes permanecem no template oficial do escritório.
            // A proposta guarda apenas a referência para evitar duplicação no Supabase.
            if (templateOficial.logo && !draftCRM.configuracao?.logo) {
              configuracaoTemplate.logo = "";
              configuracaoTemplate.logoDoTemplateOficial = true;
            }

            if (templateOficial.capaImagem && !draftCRM.configuracao?.capaImagem) {
              configuracaoTemplate.capaImagem = "";
              configuracaoTemplate.capaDoTemplateOficial = true;
            }

            draftComTemplate = {
              ...draftCRM,
              configuracao: configuracaoTemplate,
            };
          }
        } catch (error) {
          console.warn(
            "Não foi possível aplicar o template oficial à nova proposta.",
            error
          );
        }

        const normalizada = normalize({
          ...draftComTemplate,
          criado_em: draftCRM.criado_em || agora,
          atualizado_em: agora,
        });

        // Busca a numeração real já existente no escritório antes de criar
        // a proposta vinda do CRM. Isso evita gerar sempre PROP-AAAA-0001
        // e sobrescrever/conflitar com uma proposta existente.
        const { data: numerosExistentes, error: numerosError } = await supabase
          .from("propostas")
          .select("numero_proposta")
          .eq("escritorio_id", escritorioId);

        if (numerosError) throw numerosError;

        const referenciasNumeradas = Array.isArray(numerosExistentes)
          ? numerosExistentes.map((item) => ({
              numero_proposta: item.numero_proposta || "",
            }))
          : [];

        const listaParaNumerar = ensureProposalNumbers([
          normalizada,
          ...referenciasNumeradas,
        ]);

        const numerada = listaParaNumerar[0] || normalizada;

        const salvaRemota = await salvarPropostaSupabase(
          numerada,
          Boolean(numerada.publicada)
        );

        setPropostas((atuais) => {
          const semDuplicar = atuais.filter(
            (item) =>
              String(item.id) !== String(salvaRemota.id) &&
              String(item.numero_proposta || "") !==
                String(salvaRemota.numero_proposta || "")
          );

          const lista = [salvaRemota, ...semDuplicar];
          salvarCacheLocalLeve(lista);
          return lista;
        });

        const vinculouCRM = await sincronizarCRMComProposta(
          salvaRemota,
          "criada"
        );

        localStorage.removeItem("precificacont_nova_proposta_crm");
        setEditando(null);
        setCompartilhando(null);
        setSelecionada(salvaRemota);
        setToast(
          vinculouCRM
            ? "Proposta criada com o template configurado e vinculada ao CRM."
            : "Proposta criada com o template configurado. Não foi possível vincular ao CRM."
        );
        setTimeout(() => setToast(""), 2500);
      } catch (error) {
        console.error("Erro ao gerar proposta diretamente pelo CRM:", error);
        setToast(
          `Não foi possível gerar a proposta: ${
            error?.message || "verifique os dados e tente novamente"
          }`
        );
        setTimeout(() => setToast(""), 5000);
      }
    };

    abrirPropostaGeradaPeloCRM();
  }, [
    permissoesModulo.carregando,
    permissoesModulo.pode_criar,
  ]);

  useEffect(() => {
    const channel = supabase
      .channel(`precificacont-propostas-realtime-${escritorioId || "sem-escritorio"}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "propostas",
          filter: `escritorio_id=eq.${escritorioId}`,
        },
        (payload) => {
          const remoto = payload.new;
          if (!remoto?.numero_proposta) return;

          let propostaEncontrada = false;
          let primeiraVisualizacao = false;

          setPropostas((atuais) => {
            const atualizadas = atuais.map((proposal) => {
              if (proposal.numero_proposta !== remoto.numero_proposta) {
                return proposal;
              }

              propostaEncontrada = true;

              const totalAnterior = Number(proposal.total_visualizacoes || 0);
              const totalNovo = Number(remoto.total_visualizacoes || 0);

              if (totalNovo > totalAnterior) {
                primeiraVisualizacao = totalAnterior === 0;
              }

              return {
                ...proposal,
                status: remoto.status || proposal.status,
                visualizada_em:
                  remoto.visualizada_em || proposal.visualizada_em || null,
                primeira_visualizacao_em:
                  remoto.primeira_visualizacao_em ||
                  proposal.primeira_visualizacao_em ||
                  null,
                ultima_visualizacao_em:
                  remoto.ultima_visualizacao_em ||
                  proposal.ultima_visualizacao_em ||
                  null,
                total_visualizacoes: totalNovo,
                aceita_em: remoto.aceita_em || proposal.aceita_em || null,
                nome_aceite: remoto.nome_aceite || proposal.nome_aceite || "",
                email_aceite:
                  remoto.email_aceite || proposal.email_aceite || "",
              };
            });

            salvarCacheLocalLeve(atualizadas);
            return atualizadas;
          });

          setSelecionada((atual) => {
            if (!atual || atual.numero_proposta !== remoto.numero_proposta) {
              return atual;
            }

            return {
              ...atual,
              status: remoto.status || atual.status,
              visualizada_em:
                remoto.visualizada_em || atual.visualizada_em || null,
              primeira_visualizacao_em:
                remoto.primeira_visualizacao_em ||
                atual.primeira_visualizacao_em ||
                null,
              ultima_visualizacao_em:
                remoto.ultima_visualizacao_em ||
                atual.ultima_visualizacao_em ||
                null,
              total_visualizacoes: Number(remoto.total_visualizacoes || 0),
              aceita_em: remoto.aceita_em || atual.aceita_em || null,
              nome_aceite: remoto.nome_aceite || atual.nome_aceite || "",
              email_aceite: remoto.email_aceite || atual.email_aceite || "",
            };
          });

          // O canal realtime é criado uma única vez. Por isso, não podemos
          // depender do array `propostas` capturado na primeira renderização,
          // pois ele pode estar vazio/desatualizado quando o cliente aceitar.
          // O próprio UPDATE do Supabase já traz a linha atualizada e o snapshot
          // completo permanece em `dados`, inclusive o vínculo com o CRM.
          const propostaSincronizada = normalize({
            ...(remoto.dados || {}),
            supabase_id: remoto.id,
            escritorio_id: remoto.escritorio_id || escritorioId,
            numero_proposta:
              remoto.numero_proposta || remoto.dados?.numero_proposta || "",
            token_publico:
              remoto.token_publico || remoto.dados?.token_publico || null,
            cliente: remoto.cliente || remoto.dados?.cliente,
            cnpj: remoto.cnpj || remoto.dados?.cnpj,
            email_cliente:
              remoto.email_cliente || remoto.dados?.email_cliente || "",
            titulo: remoto.titulo || remoto.dados?.titulo,
            status: remoto.status || remoto.dados?.status || "rascunho",
            validade: remoto.validade || remoto.dados?.validade || null,
            publicada: Boolean(remoto.publicada),
            aceita_em: remoto.aceita_em || remoto.dados?.aceita_em || null,
            nome_aceite:
              remoto.nome_aceite || remoto.dados?.nome_aceite || "",
            email_aceite:
              remoto.email_aceite || remoto.dados?.email_aceite || "",
            visualizada_em:
              remoto.visualizada_em || remoto.dados?.visualizada_em || null,
            primeira_visualizacao_em:
              remoto.primeira_visualizacao_em ||
              remoto.dados?.primeira_visualizacao_em ||
              null,
            ultima_visualizacao_em:
              remoto.ultima_visualizacao_em ||
              remoto.dados?.ultima_visualizacao_em ||
              null,
            total_visualizacoes: Number(
              remoto.total_visualizacoes ??
                remoto.dados?.total_visualizacoes ??
                0
            ),
          });

          if (remoto.status === "aceita") {
            sincronizarCRMComProposta(propostaSincronizada, "aceita");
          } else if (
            remoto.status === "visualizada" ||
            Number(remoto.total_visualizacoes || 0) > 0
          ) {
            sincronizarCRMComProposta(propostaSincronizada, "visualizada");
          }

          if (
            propostaEncontrada &&
            Number(remoto.total_visualizacoes || 0) > 0
          ) {
            setToast(
              primeiraVisualizacao
                ? `👁 Cliente abriu a proposta ${remoto.numero_proposta}.`
                : `👁 Nova visualização da proposta ${remoto.numero_proposta}.`
            );
            setTimeout(() => setToast(""), 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const salvarCacheLocalLeve = (lista) => {
    try {
      const cache = lista.map((proposal) => ({
        id: proposal.id,
        supabase_id: proposal.supabase_id || null,
        numero_proposta: proposal.numero_proposta,
        cliente: proposal.cliente,
        cnpj: proposal.cnpj,
        email_cliente: proposal.email_cliente || proposal.email || "",
        status: proposal.status,
        validade: proposal.validade,
        publicada: Boolean(proposal.publicada),
        publicada_em: proposal.publicada_em || null,
        token_publico: proposal.token_publico || null,
        link_publico: proposal.link_publico || "",
        valores: proposal.valores || {},
        criado_em: proposal.criado_em || null,
        atualizado_em: proposal.atualizado_em || null,
        visualizada_em: proposal.visualizada_em || null,
        primeira_visualizacao_em:
          proposal.primeira_visualizacao_em || null,
        ultima_visualizacao_em: proposal.ultima_visualizacao_em || null,
        total_visualizacoes: Number(proposal.total_visualizacoes || 0),
        aceita_em: proposal.aceita_em || null,
        nome_aceite: proposal.nome_aceite || "",
        email_aceite: proposal.email_aceite || "",
      }));

      localStorage.setItem(STORAGE_KEY_ATUAL, JSON.stringify(cache));
    } catch (error) {
      console.warn(
        "Cache local de propostas indisponível. O Supabase continuará sendo a fonte principal.",
        error
      );
    }
  };

  const persistir = (lista) => {
    setPropostas(lista);
    salvarCacheLocalLeve(lista);
    return true;
  };

  const salvarPropostaSupabase = async (proposal, publicar = false) => {
    if (!escritorioId) throw new Error("Nenhum escritório ativo foi identificado.");
    const propostaNormalizada = normalize({ ...proposal, escritorio_id: escritorioId });

    const payload = {
      escritorio_id: escritorioId,
      numero_proposta: propostaNormalizada.numero_proposta,
      cliente: propostaNormalizada.cliente || null,
      cnpj: propostaNormalizada.cnpj || null,
      email_cliente:
        propostaNormalizada.email_cliente ||
        propostaNormalizada.email ||
        null,
      titulo:
        propostaNormalizada.titulo ||
        propostaNormalizada.configuracao?.titulo ||
        "Proposta Comercial de Serviços Contábeis",
      status: propostaNormalizada.status || "rascunho",
      validade: propostaNormalizada.validade || null,
      dados: propostaNormalizada,
      publicada: publicar
        ? true
        : Boolean(propostaNormalizada.publicada),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("propostas")
      .upsert(payload, { onConflict: "escritorio_id,numero_proposta" })
      .select("id, token_publico, numero_proposta, publicada")
      .single();

    if (error) throw error;

    const publicada = Boolean(data.publicada || payload.publicada);
    const link =
      publicada && data.token_publico
        ? `${window.location.origin}/proposta/${data.token_publico}`
        : propostaNormalizada.link_publico || "";

    return normalize({
      ...propostaNormalizada,
      supabase_id: data.id,
      token_publico: data.token_publico || propostaNormalizada.token_publico,
      publicada,
      link_publico: link,
    });
  };

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return propostas.filter((proposal) => {
      const nome = String(proposal.cliente || "").toLowerCase();
      const cnpj = String(proposal.cnpj || "").toLowerCase();
      const bateBusca =
        !termo || nome.includes(termo) || cnpj.includes(termo);
      const bateStatus =
        statusFiltro === "todos" || proposal.status === statusFiltro;

      return bateBusca && bateStatus;
    });
  }, [propostas, busca, statusFiltro]);

  const metricas = useMemo(() => {
    const aceitas = propostas.filter((x) => x.status === "aceita");
    const enviadas = propostas.filter((x) =>
      ["enviada", "visualizada"].includes(x.status)
    );

    return {
      total: propostas.length,
      enviadas: enviadas.length,
      aceitas: aceitas.length,
      mensal: aceitas.reduce(
        (sum, x) => sum + Number(x.valores?.mensalidade_total || 0),
        0
      ),
    };
  }, [propostas]);


  const garantirLinkPublico = async (proposal) => {
    const propostaNormalizada = normalize(proposal);

    if (propostaNormalizada.token_publico) {
      return {
        proposal: propostaNormalizada,
        link: `${window.location.origin}/proposta/${propostaNormalizada.token_publico}`,
      };
    }

    const payload = {
      escritorio_id: escritorioId,
      numero_proposta: propostaNormalizada.numero_proposta,
      cliente: propostaNormalizada.cliente || null,
      cnpj: propostaNormalizada.cnpj || null,
      email_cliente:
        propostaNormalizada.email_cliente ||
        propostaNormalizada.email ||
        null,
      titulo:
        propostaNormalizada.titulo ||
        "Proposta Comercial de Serviços Contábeis",
      status:
        propostaNormalizada.status === "rascunho"
          ? "enviada"
          : propostaNormalizada.status,
      validade: propostaNormalizada.validade || null,
      dados: propostaNormalizada,
      publicada: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("propostas")
      .upsert(payload, { onConflict: "escritorio_id,numero_proposta" })
      .select("id, token_publico, numero_proposta")
      .single();

    if (error) throw error;

    const link = `${window.location.origin}/proposta/${data.token_publico}`;
    const updated = {
      ...propostaNormalizada,
      token_publico: data.token_publico,
      supabase_id: data.id,
      publicada: true,
      link_publico: link,
      status:
        propostaNormalizada.status === "rascunho"
          ? "enviada"
          : propostaNormalizada.status,
      enviada_em:
        propostaNormalizada.enviada_em || new Date().toISOString(),
    };

    const lista = propostas.map((item) =>
      item.id === updated.id ? updated : item
    );
    persistir(lista);

    if (selecionada?.id === updated.id) {
      setSelecionada(updated);
    }

    sincronizarCRMComProposta(updated, "enviada");

    return { proposal: updated, link };
  };

  const abrirCompartilhamento = async (proposal) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para editar ou enviar propostas.");
      return;
    }
    try {
      setPreparandoCompartilhamento(true);
      setToast("Preparando link público da proposta...");

      const resultado = await garantirLinkPublico(proposal);

      setCompartilhando({
        proposal: resultado.proposal,
        link: resultado.link,
      });
      setMensagemEditavel(carregarMensagemPadrao());
      setToast("");
    } catch (error) {
      console.error("Erro ao preparar compartilhamento:", error);
      setToast("Não foi possível preparar o link da proposta.");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setPreparandoCompartilhamento(false);
    }
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

  const mensagemCompartilhamento = (proposal, link, corpo = "") => {
    const nome =
      proposal.cliente && proposal.cliente !== "Cliente sem nome"
        ? proposal.cliente
        : "cliente";

    const corpoFinal = corpo.trim() || corpoMensagemPadrao();

    return `Olá, ${nome}!

${corpoFinal}

${link}`;
  };

  const telefoneWhatsApp = (proposal) => {
    const candidatos = [
      proposal.telefone,
      proposal.whatsapp,
      proposal.celular,
      proposal.contato_telefone,
      proposal.dados?.telefone,
      proposal.dados?.whatsapp,
      proposal.dados?.celular,
    ];

    const encontrado = candidatos.find((value) => somenteDigitos(value));
    if (!encontrado) return "";

    let digits = somenteDigitos(encontrado);
    if (digits.length === 10 || digits.length === 11) {
      digits = `55${digits}`;
    }
    return digits;
  };

  const emailDaProposta = (proposal) =>
    proposal.email_cliente ||
    proposal.email ||
    proposal.dados?.email_cliente ||
    proposal.dados?.email ||
    "";

  const compartilharWhatsApp = () => {
    if (!compartilhando) return;

    const { proposal, link } = compartilhando;
    const mensagem = mensagemCompartilhamento(
      proposal,
      link,
      mensagemEditavel
    );
    const telefone = telefoneWhatsApp(proposal);

    const url = telefone
      ? `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank", "noopener,noreferrer");
    atualizarStatus(proposal, "enviada");
    setCompartilhando(null);
  };

  const compartilharEmail = () => {
    if (!compartilhando) return;

    const { proposal, link } = compartilhando;
    const email = emailDaProposta(proposal);
    const assunto = `Proposta Comercial ${
      proposal.numero_proposta ? `— ${proposal.numero_proposta}` : ""
    }`.trim();
    const mensagem = mensagemCompartilhamento(
      proposal,
      link,
      mensagemEditavel
    );

    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      assunto
    )}&body=${encodeURIComponent(mensagem)}`;

    atualizarStatus(proposal, "enviada");
    setCompartilhando(null);
  };

  const copiarLinkCompartilhamento = async () => {
    if (!compartilhando) return;

    try {
      await navigator.clipboard.writeText(compartilhando.link);
      setToast("Link da proposta copiado.");
    } catch {
      setToast("Não foi possível copiar automaticamente. Selecione o link e copie.");
    }
    setTimeout(() => setToast(""), 2500);
  };

  const salvarMensagemPadrao = () => {
    const mensagem = mensagemEditavel.trim();

    if (!mensagem) {
      setToast("Digite uma mensagem antes de salvar como padrão.");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    try {
      localStorage.setItem(MENSAGEM_PROPOSTA_KEY, mensagem);
      setToast("Mensagem padrão salva para as próximas propostas.");
    } catch {
      setToast("Não foi possível salvar a mensagem padrão.");
    }

    setTimeout(() => setToast(""), 2500);
  };

  const copiarMensagemCompartilhamento = async () => {
    if (!compartilhando) return;

    try {
      await navigator.clipboard.writeText(
        mensagemCompartilhamento(
          compartilhando.proposal,
          compartilhando.link,
          mensagemEditavel
        )
      );
      setToast("Mensagem copiada.");
    } catch {
      setToast("Não foi possível copiar a mensagem automaticamente.");
    }
    setTimeout(() => setToast(""), 2500);
  };

  const atualizarStatus = (proposal, status) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para alterar propostas.");
      return;
    }
    const updated = {
      ...normalize(proposal),
      status,
      ...(status === "enviada"
        ? {
            enviada_em: proposal.enviada_em || new Date().toISOString(),
            link_publico:
              proposal.link_publico ||
              `${window.location.origin}/proposta/${proposal.id}`,
          }
        : {}),
      ...(status === "aceita"
        ? { aceita_em: new Date().toISOString() }
        : {}),
      ...(status === "recusada"
        ? { recusada_em: new Date().toISOString() }
        : {}),
    };

    const lista = propostas.map((item) =>
      item.id === proposal.id ? updated : item
    );
    persistir(lista);
    setSelecionada(updated);

    if (["enviada", "aceita", "recusada"].includes(status)) {
      sincronizarCRMComProposta(updated, status);
    }
  };

  const salvarEdicao = async (draft) => {
    const agora = new Date().toISOString();
    const jaExiste = propostas.some((item) => item.id === draft.id);

    if (jaExiste && !permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para editar propostas.");
      return;
    }

    if (!jaExiste && !permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para criar propostas.");
      return;
    }

    let draftParaSalvar = draft;

    try {
      const templateOficial = carregarTemplatePropostaLocal();

      const configuracaoAtual = draft?.configuracao || {};
      const configuracaoCompacta = { ...configuracaoAtual };

      if (
        templateOficial.logo &&
        configuracaoCompacta.logo === templateOficial.logo
      ) {
        configuracaoCompacta.logo = "";
        configuracaoCompacta.logoDoTemplateOficial = true;
      }

      if (
        templateOficial.capaImagem &&
        configuracaoCompacta.capaImagem === templateOficial.capaImagem
      ) {
        configuracaoCompacta.capaImagem = "";
        configuracaoCompacta.capaDoTemplateOficial = true;
      }

      draftParaSalvar = {
        ...draft,
        configuracao: configuracaoCompacta,
      };
    } catch (error) {
      console.warn(
        "Não foi possível compactar as imagens do template antes de salvar a edição.",
        error
      );
    }

    const itensParaSalvar = Array.isArray(draftParaSalvar.itens_proposta)
      ? draftParaSalvar.itens_proposta.map((item, index) =>
          normalizeItem(item, index)
        )
      : [];

    const mensalidadeComposicao = itensParaSalvar
      .filter((item) => item.recorrencia !== "pontual")
      .reduce((total, item) => total + Number(item.valor || 0), 0);

    const pontuaisComposicao = itensParaSalvar
      .filter((item) => item.recorrencia === "pontual")
      .reduce((total, item) => total + Number(item.valor || 0), 0);

    const mensalidadeFinalComercial = Number(
      draftParaSalvar.comercial?.valor_final_mensal ??
        mensalidadeComposicao
    );

    const pontualFinalComercial = Number(
      draftParaSalvar.comercial?.valor_final_pontual ??
        pontuaisComposicao
    );

    let updated = normalize({
      ...draftParaSalvar,
      itens_proposta: itensParaSalvar,
      valores: {
        ...(draftParaSalvar.valores || {}),
        valor_original_mensal: mensalidadeComposicao,
        valor_original_pontual: pontuaisComposicao,
        mensalidade_total: mensalidadeFinalComercial,
        servicos_pontuais: pontualFinalComercial,
        total_pontual: pontualFinalComercial,
        primeiro_mes:
          mensalidadeFinalComercial + pontualFinalComercial,
      },
      criado_em: draft.criado_em || agora,
      atualizado_em: agora,
    });

    let lista;

    if (jaExiste) {
      lista = propostas.map((item) =>
        item.id === updated.id ? updated : item
      );
    } else {
      lista = ensureProposalNumbers([updated, ...propostas]);
      updated =
        lista.find((item) => item.id === updated.id) || updated;
    }

    try {
      const salvaRemota = await salvarPropostaSupabase(
        updated,
        Boolean(updated.publicada)
      );

      updated = salvaRemota;

      lista = lista.map((item) =>
        item.id === updated.id ||
        item.numero_proposta === updated.numero_proposta
          ? updated
          : item
      );

      persistir(lista);

      // Toda proposta nova precisa existir no fluxo comercial, mesmo quando
      // nasceu diretamente no módulo Propostas.
      if (!jaExiste) {
        await sincronizarCRMComProposta(updated, "criada");
      }
    } catch (error) {
      console.error("Erro ao salvar edição da proposta no Supabase:", error);
      setToast(
        `Não foi possível salvar a proposta no Supabase: ${
          error?.message || "verifique a conexão"
        }`
      );
      setTimeout(() => setToast(""), 5000);
      return;
    }

    // A sincronização com o CRM é feita pela rotina oficial acima,
    // que respeita o escritório ativo e persiste também no Supabase.

    setPropostas(lista);
    setSelecionada(updated);
    setEditando(null);
    setToast(
      jaExiste
        ? "Proposta atualizada com todas as seções."
        : "Proposta criada e vinculada ao CRM."
    );
    setTimeout(() => setToast(""), 2500);
  };

  const copiarLink = async (proposal) => {
    try {
      const propostaNormalizada = normalize(proposal);

      const jaPublicada =
        propostaNormalizada.publicada &&
        propostaNormalizada.publicada_em &&
        (propostaNormalizada.token_publico || propostaNormalizada.link_publico);

      // Copiar um link já existente é visualização. Publicar altera a proposta.
      if (!jaPublicada && !permissoesModulo.pode_editar) {
        negarAcao("Seu perfil não possui permissão para publicar propostas.");
        return;
      }

      // Se a proposta já foi publicada, esta ação apenas copia o link público.
      if (
        propostaNormalizada.publicada &&
        propostaNormalizada.publicada_em &&
        (propostaNormalizada.token_publico || propostaNormalizada.link_publico)
      ) {
        const link =
          propostaNormalizada.link_publico ||
          `${window.location.origin}/proposta/${propostaNormalizada.token_publico}`;

        try {
          await navigator.clipboard.writeText(link);
          setToast("Link da proposta copiado.");
        } catch {
          setToast(`Link da proposta: ${link}`);
        }

        setTimeout(() => setToast(""), 3500);
        return;
      }

      // Rascunho/não publicada: publica a proposta sem marcar como enviada.
      setToast("Publicando proposta...");

      const publicadaEm = new Date().toISOString();
      const propostaParaPublicar = {
        ...propostaNormalizada,
        publicada: true,
        publicada_em: publicadaEm,
      };

      const payload = {
        escritorio_id: escritorioId,
        numero_proposta: propostaNormalizada.numero_proposta,
        cliente: propostaNormalizada.cliente || null,
        cnpj: propostaNormalizada.cnpj || null,
        email_cliente:
          propostaNormalizada.email_cliente ||
          propostaNormalizada.email ||
          null,
        titulo:
          propostaNormalizada.titulo ||
          "Proposta Comercial de Serviços Contábeis",
        status: propostaNormalizada.status,
        validade: propostaNormalizada.validade || null,
        dados: propostaParaPublicar,
        publicada: true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("propostas")
        .upsert(payload, {
          onConflict: "escritorio_id,numero_proposta",
        })
        .select("id, token_publico, numero_proposta, publicada")
        .single();

      if (error) {
        throw error;
      }

      const tokenPublico =
        data.token_publico || propostaNormalizada.token_publico;

      if (!tokenPublico) {
        throw new Error(
          "A proposta foi publicada, mas o link público não foi gerado."
        );
      }

      const link = `${window.location.origin}/proposta/${tokenPublico}`;

      const updated = {
        ...propostaNormalizada,
        link_publico: link,
        supabase_id: data.id,
        token_publico: tokenPublico,
        status: propostaNormalizada.status,
        publicada: true,
        publicada_em: publicadaEm,
      };

      persistir(
        propostas.map((item) =>
          item.id === proposal.id ? updated : item
        )
      );

      setSelecionada(updated);
      setToast(
        "Proposta publicada. Agora você pode copiar o link ou enviar a proposta."
      );
    } catch (error) {
      console.error("Erro ao publicar/copiar proposta:", error);
      setToast(
        `Erro ao publicar proposta: ${
          error?.message || "verifique a conexão com o Supabase"
        }`
      );
    }

    setTimeout(() => setToast(""), 5000);
  };

  const excluirProposta = async (proposal) => {
    if (!permissoesModulo.pode_excluir) {
      negarAcao("Seu perfil não possui permissão para excluir propostas.");
      return;
    }

    const numero =
      proposal.numero_proposta || proposal.proposta_numero || "esta proposta";

    const confirmou = window.confirm(
      `Excluir ${numero}?\n\nA proposta será removida definitivamente. Se estiver vinculada ao CRM, o card será mantido e somente o vínculo com a proposta será removido.`
    );

    if (!confirmou) return;

    setExcluindoProposta(true);

    try {
      let query = supabase
        .from("propostas")
        .delete()
        .eq("escritorio_id", escritorioId);

      if (proposal.supabase_id) {
        query = query.eq("id", proposal.supabase_id);
      } else {
        query = query.eq("numero_proposta", proposal.numero_proposta);
      }

      const { error } = await query;
      if (error) throw error;

      const listaAtualizada = propostas.filter(
        (item) =>
          item.id !== proposal.id &&
          item.numero_proposta !== proposal.numero_proposta
      );

      persistir(listaAtualizada);

      try {
        const rawCRM = JSON.parse(localStorage.getItem(CRM_KEY) || "[]");
        const oportunidades = Array.isArray(rawCRM) ? rawCRM : [];
        const agora = new Date().toISOString();

        const atualizadas = oportunidades.map((item) => {
          const vinculadaPorId =
            proposal.id &&
            (String(item.proposta_id || "") === String(proposal.id) ||
              String(item.crm_proposta_id || "") === String(proposal.id));

          const vinculadaPorNumero =
            proposal.numero_proposta &&
            (String(item.proposta_numero || "") ===
              String(proposal.numero_proposta) ||
              String(item.proposta || "") ===
                String(proposal.numero_proposta));

          const vinculadaPorOportunidade =
            (proposal.crm_oportunidade_id || proposal.oportunidade_id) &&
            String(item.id) ===
              String(
                proposal.crm_oportunidade_id || proposal.oportunidade_id
              );

          if (
            !vinculadaPorId &&
            !vinculadaPorNumero &&
            !vinculadaPorOportunidade
          ) {
            return item;
          }

          return {
            ...item,
            proposta: "",
            proposta_id: null,
            proposta_numero: "",
            proposta_status: "",
            proposta_valor_mensal: 0,
            updatedAt: agora,
            historico: registrarHistoricoCRM(item, {
              tipo: "proposta_excluida",
              titulo: "Proposta excluída",
              descricao: `${numero} foi excluída. A oportunidade foi mantida no CRM.`,
              numero_proposta: proposal.numero_proposta || "",
            }),
          };
        });

        localStorage.setItem(CRM_KEY, JSON.stringify(atualizadas));
      } catch (crmError) {
        console.error(
          "A proposta foi excluída, mas houve erro ao limpar o vínculo no CRM:",
          crmError
        );
      }

      setSelecionada(null);
      setEditando(null);
      setCompartilhando(null);
      setToast(`${numero} excluída. O card do CRM foi mantido.`);
      setTimeout(() => setToast(""), 3500);
    } catch (error) {
      console.error("Erro ao excluir proposta:", error);
      setToast(
        `Não foi possível excluir a proposta: ${
          error?.message || "verifique a conexão com o Supabase"
        }`
      );
      setTimeout(() => setToast(""), 5000);
    } finally {
      setExcluindoProposta(false);
    }
  };

  const imprimir = (proposal) => {
    setSelecionada(normalize(proposal));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => window.print(), 350);
      });
    });
  };

  const tipoLabel = (proposal) => {
    if (proposal.tipo_proposta === "servicos_adicionais")
      return "Serviços adicionais";
    if (proposal.tipo_proposta === "personalizada")
      return "Personalizada";
    return "Completa";
  };

  if (!permissoesModulo.carregando && !permissoesModulo.pode_visualizar) {
    return (
      <div className="min-h-full bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Propostas</h2>
          <p className="mt-2 text-sm text-slate-600">
            Seu perfil não possui permissão para visualizar este módulo.
          </p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            O administrador do escritório precisa habilitar a opção Visualizar em Configurações → Permissões → Propostas.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="precificacont-propostas min-h-screen bg-slate-50 p-5 md:p-8">
      <style>{PROPOSTAS_DARK_CSS}</style>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media screen {
          .proposal-modal-overlay {
            align-items: center !important;
            overflow: hidden !important;
            padding: 16px !important;
          }

          .proposal-modal-shell {
            width: 100% !important;
            max-width: 72rem !important;
            max-height: 94vh !important;
            overflow-y: auto !important;
            margin: auto !important;
          }

          #proposta-print {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          #proposta-print > .proposal-document {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
          }

          #proposta-print .print-page {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          #proposta-print .print-cover {
            width: 100% !important;
            min-height: 560px !important;
            height: auto !important;
            max-height: none !important;
          }
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          #proposta-print,
          #proposta-print * {
            visibility: visible !important;
          }

          #proposta-print {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: #0f172a !important;
          }

          .no-print {
            display: none !important;
          }

          .proposal-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            right: auto !important;
            bottom: auto !important;
            display: block !important;
            width: 210mm !important;
            height: auto !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            backdrop-filter: none !important;
            overflow: visible !important;
          }

          .proposal-modal-shell {
            position: static !important;
            width: 210mm !important;
            max-width: 210mm !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          #proposta-print {
            display: block !important;
            position: relative !important;
            width: 210mm !important;
            max-width: 210mm !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            transform: none !important;
          }

          #proposta-print > div {
            display: block !important;
            width: 210mm !important;
            height: auto !important;
            overflow: visible !important;
          }

          .print-page {
            display: block !important;
            position: relative !important;
            width: 210mm !important;
            min-height: 297mm !important;
            height: auto !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            overflow: visible !important;
            break-after: page !important;
            page-break-after: always !important;
          }

          .print-cover {
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            overflow: hidden !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            page-break-after: always !important;
          }

          .print-cover > img {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
            object-fit: cover !important;
          }

          .print-page.print-cover {
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
          }

          .print-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          tr,
          img,
          .proposal-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-7">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-2">
              <FileText size={17} />
              Comercial
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Propostas</h1>
            <p className="text-slate-500 mt-1">
              Crie propostas completas, personalizadas e prontas para PDF.
            </p>
          </div>

          {permissoesModulo.pode_criar && (
            <button
              type="button"
              onClick={() => setNovaPropostaOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Plus size={18} />
              Nova proposta
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={FileText}
            label="Total de propostas"
            value={metricas.total}
            detail="Todas as propostas"
          />
          <StatCard
            icon={Send}
            label="Em andamento"
            value={metricas.enviadas}
            detail="Enviadas ou visualizadas"
          />
          <StatCard
            icon={CheckCircle2}
            label="Aceitas"
            value={metricas.aceitas}
            detail="Propostas convertidas"
          />
          <StatCard
            icon={CircleDollarSign}
            label="Mensal aceito"
            value={money(metricas.mensal)}
            detail="Somente propostas aceitas"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente ou CNPJ..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>

            <SelectPrecificaCont
              value={statusFiltro}
              onChange={setStatusFiltro}
              options={[
                { value: "todos", label: "Todos os status" },
                { value: "rascunho", label: "Rascunho" },
                { value: "enviada", label: "Enviada" },
                { value: "visualizada", label: "Visualizada" },
                { value: "aceita", label: "Aceita" },
                { value: "recusada", label: "Recusada" },
                { value: "expirada", label: "Expirada" },
              ]}
              placeholder=""
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
            />

            <button
              type="button"
              onClick={carregar}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Atualizar
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {filtradas.length === 0 ? (
            <div className="py-16 px-5 text-center">
              <FileText size={32} className="mx-auto text-slate-300" />
              <div className="font-semibold text-slate-800 mt-4">
                Nenhuma proposta encontrada
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Gere uma proposta a partir de uma Nova Simulação.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">Cliente</th>
                    <th className="px-5 py-3 font-semibold">Tipo</th>
                    <th className="px-5 py-3 font-semibold">Itens</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Visualizações</th>
                    <th className="px-5 py-3 font-semibold text-right">
                      Mensal
                    </th>
                    <th className="px-5 py-3 font-semibold">Validade</th>
                    <th className="px-5 py-3 font-semibold text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtradas.map((proposal) => (
                    <tr
                      key={proposal.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelecionada(proposal)}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {proposal.cliente}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {proposal.cnpj || "CNPJ não informado"}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {tipoLabel(proposal)}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {proposal.itens_proposta.length}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={proposal.status} />
                      </td>
                      <td className="px-5 py-4">
                        {proposal.total_visualizacoes ? (
                          <div>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                              <Eye size={15} className="text-violet-600" />
                              {proposal.total_visualizacoes}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 whitespace-nowrap">
                              {dateTimeBR(proposal.ultima_visualizacao_em)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Ainda não visualizada</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-900">
                        {money(proposal.valores?.mensalidade_total)}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        <div className="font-semibold text-slate-700">
                          {proposal.numero_proposta || "—"}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Até {dateBR(proposal.validade)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="Visualizar"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelecionada(proposal);
                            }}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                          >
                            <Eye size={17} />
                          </button>
                          {permissoesModulo.pode_editar && (
                            <>
                              <button
                                type="button"
                                title="Editar"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditando(proposal);
                                }}
                                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                type="button"
                                title="Compartilhar proposta"
                                disabled={preparandoCompartilhamento}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirCompartilhamento(proposal);
                                }}
                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                              >
                                <Send size={17} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            title="PDF / imprimir"
                            onClick={(e) => {
                              e.stopPropagation();
                              imprimir(proposal);
                            }}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                          >
                            <Printer size={17} />
                          </button>
                          {permissoesModulo.pode_excluir && (
                            <button
                              type="button"
                              title="Excluir proposta"
                              disabled={excluindoProposta}
                              onClick={(e) => {
                                e.stopPropagation();
                                excluirProposta(proposal);
                              }}
                              className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {toast && (
          <div className="fixed bottom-5 right-5 z-[100] rounded-xl bg-slate-900 text-white px-4 py-3 text-sm shadow-xl">
            {toast}
          </div>
        )}

        {novaPropostaOpen && (
          <div
            className="fixed inset-0 z-[130] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={() => setNovaPropostaOpen(false)}
          >
            <div
              className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-blue-600">Nova proposta</div>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    Como você quer começar?
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    A proposta nasce da precificação. Escolha o caminho mais adequado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNovaPropostaOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("precificacont_fluxo_proposta", "selecionar_simulacao");
                    setNovaPropostaOpen(false);
                    setPagina?.("simulacoes");
                  }}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
                      <FileText size={19} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Usar uma simulação existente</div>
                      <div className="mt-0.5 text-sm text-slate-500">
                        Abra suas simulações já calculadas e gere a proposta a partir de uma delas.
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("precificacont_modo_simulacao", "rapida");
                    setNovaPropostaOpen(false);
                    setPagina?.("nova");
                  }}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Plus size={19} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Nova simulação rápida</div>
                      <div className="mt-0.5 text-sm text-slate-500">
                        Faça uma precificação objetiva e depois transforme o resultado em proposta.
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("precificacont_modo_simulacao", "detalhada");
                    setNovaPropostaOpen(false);
                    setPagina?.("nova");
                  }}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <ListChecks size={19} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Nova simulação detalhada</div>
                      <div className="mt-0.5 text-sm text-slate-500">
                        Use todas as regras do motor para uma precificação completa antes da proposta.
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {compartilhando && (
          <div
            className="fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={() => setCompartilhando(null)}
          >
            <div
              className="w-full max-w-[520px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-[0.16em]">
                    <Send size={15} />
                    Compartilhar proposta
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-slate-950">
                    Enviar para {compartilhando.proposal.cliente || "cliente"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Escolha o canal. A mensagem já vai com o link público da proposta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCompartilhando(null)}
                  className="h-9 w-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="p-5">
                <label className="text-xs font-semibold text-slate-500">
                  Link da proposta
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    readOnly
                    value={compartilhando.link}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={copiarLinkCompartilhamento}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy size={16} />
                    Copiar
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={compartilharWhatsApp}
                    className="group rounded-xl border border-emerald-500 bg-emerald-500 px-4 py-3.5 text-left text-white shadow-sm hover:bg-emerald-600 hover:border-emerald-600 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 flex items-center justify-center text-white">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-11 w-11"
                          aria-hidden="true"
                        >
                          <path
                            fill="currentColor"
                            d="M16.75 13.96c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.13.16 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28ZM12.04 21.5h-.01a9.47 9.47 0 0 1-4.83-1.32l-.35-.21-3.59.94.96-3.5-.23-.36A9.42 9.42 0 0 1 2.54 12c0-5.22 4.25-9.47 9.48-9.47a9.4 9.4 0 0 1 6.7 2.78A9.4 9.4 0 0 1 21.5 12c0 5.23-4.25 9.48-9.46 9.5Zm8.06-17.07A11.33 11.33 0 0 0 12.02 1.1C5.75 1.1.65 6.2.65 12.47c0 2 .52 3.95 1.51 5.66L.55 24l6.01-1.58a11.35 11.35 0 0 0 5.46 1.39h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.9-3.3-8.01Z"
                          />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-base font-bold leading-5 text-white">
                          Enviar por WhatsApp
                        </div>
                        <div className="mt-1 text-xs leading-4 text-emerald-50">
                          Abrir no WhatsApp com a mensagem pronta
                        </div>
                      </div>

                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 shrink-0 fill-none stroke-current text-white transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={compartilharEmail}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-left hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Mail size={21} />
                      </div>
                      <div>
                        <div className="font-bold text-blue-800">
                          Enviar por e-mail
                        </div>
                        <div className="text-xs text-blue-700 mt-0.5">
                          Abre seu aplicativo de e-mail
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
                      Edite o texto para este envio ou salve como padrão para as próximas propostas.
                    </div>
                  </div>
                  <div className="p-3.5">
                    <div className="rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-700">
                      Olá, {compartilhando.proposal.cliente && compartilhando.proposal.cliente !== "Cliente sem nome"
                        ? compartilhando.proposal.cliente
                        : "cliente"}!
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        automático
                      </span>
                    </div>

                    <textarea
                      rows={5}
                      value={mensagemEditavel}
                      onChange={(e) => setMensagemEditavel(e.target.value)}
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
                          Esta mensagem será usada nas próximas propostas.
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={salvarMensagemPadrao}
                          className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          Salvar
                        </button>

                        <button
                          type="button"
                          onClick={copiarMensagemCompartilhamento}
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
                  <ExternalLink size={14} />
                  WhatsApp e e-mail são abertos fora do PrecificaCont para você confirmar o envio.
                </div>
              </div>
            </div>
          </div>
        )}

        {editando && (
          <EditorPropostaCompleto
            proposal={editando}
            onCancel={() => setEditando(null)}
            onSave={salvarEdicao}
          />
        )}

        {comprovanteAceite && (
          <div
            className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 size={20} />
                    Comprovante de aceite digital
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {comprovanteAceite.numero_proposta || "Proposta comercial"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setComprovanteAceite(null)}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="font-semibold text-emerald-950">
                    Proposta aceita digitalmente
                  </div>

                  <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                      <div className="text-emerald-700">Cliente</div>
                      <div className="font-semibold text-emerald-950 mt-0.5">
                        {comprovanteAceite.cliente || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-emerald-700">CNPJ/CPF</div>
                      <div className="font-semibold text-emerald-950 mt-0.5">
                        {comprovanteAceite.cnpj || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-emerald-700">Aceito por</div>
                      <div className="font-semibold text-emerald-950 mt-0.5">
                        {comprovanteAceite.nome_aceite || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-emerald-700">E-mail</div>
                      <div className="font-semibold text-emerald-950 mt-0.5 break-all">
                        {comprovanteAceite.email_aceite || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-emerald-700">CPF do representante</div>
                      <div className="font-semibold text-emerald-950 mt-0.5">
                        {comprovanteAceite.representante_cpf || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-emerald-700">Cargo</div>
                      <div className="font-semibold text-emerald-950 mt-0.5">
                        {comprovanteAceite.representante_cargo || "—"}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-emerald-700">Telefone</div>
                      <div className="font-semibold text-emerald-950 mt-0.5">
                        {comprovanteAceite.representante_telefone || "—"}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-emerald-700">Data do aceite</div>
                      <div className="font-semibold text-emerald-950 mt-0.5">
                        {dateTimeBR(comprovanteAceite.aceita_em)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-slate-500">
                  O PDF abre a própria proposta aceita, com o mesmo layout do link enviado ao cliente.
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setComprovanteAceite(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Fechar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const propostaAceita = propostas.find(
                        (proposal) =>
                          proposal.numero_proposta ===
                          comprovanteAceite.numero_proposta
                      );

                      const base =
                        propostaAceita ||
                        (selecionada?.numero_proposta ===
                        comprovanteAceite.numero_proposta
                          ? selecionada
                          : null);

                      if (!base) {
                        setToast(
                          "Não foi possível localizar a proposta aceita para gerar o PDF."
                        );
                        setTimeout(() => setToast(""), 3500);
                        return;
                      }

                      const dadosAceite =
                        base?.dados_aceite ||
                        base?.dados?.dados_aceite ||
                        {};

                      const documentoAceito = {
                        ...base,
                        status: "aceita",
                        aceita_em:
                          comprovanteAceite.aceita_em ||
                          base.aceita_em ||
                          dadosAceite?.aceita_em ||
                          null,
                        nome_aceite:
                          comprovanteAceite.nome_aceite ||
                          base.nome_aceite ||
                          dadosAceite?.nome ||
                          "",
                        email_aceite:
                          comprovanteAceite.email_aceite ||
                          base.email_aceite ||
                          dadosAceite?.email ||
                          "",
                        dados_aceite: dadosAceite,
                        representante_cpf:
                          comprovanteAceite.representante_cpf ||
                          base.representante_cpf ||
                          dadosAceite?.cpf ||
                          "",
                        representante_cargo:
                          comprovanteAceite.representante_cargo ||
                          base.representante_cargo ||
                          dadosAceite?.cargo ||
                          "",
                        representante_telefone:
                          comprovanteAceite.representante_telefone ||
                          base.representante_telefone ||
                          dadosAceite?.telefone ||
                          "",
                      };

                      const tokenPublico =
                        documentoAceito.token_publico ||
                        documentoAceito.dados?.token_publico ||
                        "";

                      if (!tokenPublico) {
                        setToast(
                          "Esta proposta ainda não possui link público para gerar o PDF aceito."
                        );
                        setTimeout(() => setToast(""), 3500);
                        return;
                      }

                      try {
                        localStorage.setItem(
                          `precificacont_aceite_publico:${tokenPublico}`,
                          JSON.stringify({
                            nome: documentoAceito.nome_aceite || "",
                            cpf: documentoAceito.representante_cpf || "",
                            cargo: documentoAceito.representante_cargo || "",
                            email: documentoAceito.email_aceite || "",
                            telefone: documentoAceito.representante_telefone || "",
                            aceita_em: documentoAceito.aceita_em || null,
                          })
                        );
                      } catch {
                        // O PDF continua abrindo mesmo se o cache local estiver indisponível.
                      }

                      const urlPdf = `${window.location.origin}/proposta/${tokenPublico}?imprimir=1`;
                      window.open(urlPdf, "_blank", "noopener,noreferrer");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    <Printer size={17} />
                    Baixar proposta aceita em PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selecionada && (
          <div className="proposal-modal-overlay fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm p-4 flex items-center justify-center">
            <div className="proposal-modal-shell bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] overflow-y-auto">
              <div className="no-print sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">
                      {selecionada.cliente}
                    </h2>
                    <StatusBadge status={selecionada.status} />
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {tipoLabel(selecionada)} • validade{" "}
                    {dateBR(selecionada.validade)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelecionada(null)}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div id="proposta-print" className="bg-white">
                <ProposalDocument proposal={selecionada} />
              </div>

              {selecionada.status === "aceita" && selecionada.aceita_em && (
                <div
                  id="comprovante-aceite-digital"
                  className="no-print mx-6 mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-emerald-950">
                        Proposta aceita digitalmente
                      </div>
                      <div className="mt-3 grid sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                        <div>
                          <div className="text-emerald-700">Aceito por</div>
                          <div className="font-semibold text-emerald-950 mt-0.5">
                            {selecionada.nome_aceite || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-emerald-700">E-mail</div>
                          <div className="font-semibold text-emerald-950 mt-0.5 break-all">
                            {selecionada.email_aceite || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-emerald-700">Data do aceite</div>
                          <div className="font-semibold text-emerald-950 mt-0.5">
                            {dateTimeBR(selecionada.aceita_em)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selecionada.total_visualizacoes > 0 && (
                <div className="no-print mx-6 my-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                      <Eye size={19} />
                    </div>
                    <div>
                      <div className="font-semibold text-violet-900">
                        Proposta visualizada pelo cliente
                      </div>
                      <div className="mt-2 grid sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-violet-600">Primeira abertura:</span>{" "}
                          <span className="font-medium text-violet-950">
                            {dateTimeBR(selecionada.primeira_visualizacao_em)}
                          </span>
                        </div>
                        <div>
                          <span className="text-violet-600">Última abertura:</span>{" "}
                          <span className="font-medium text-violet-950">
                            {dateTimeBR(selecionada.ultima_visualizacao_em)}
                          </span>
                        </div>
                        <div>
                          <span className="text-violet-600">Visualizações:</span>{" "}
                          <span className="font-medium text-violet-950">
                            {selecionada.total_visualizacoes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="no-print sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {permissoesModulo.pode_editar && (
                    <button
                      type="button"
                      onClick={() => setEditando(selecionada)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil size={17} />
                      Editar tudo
                    </button>
                  )}
                  {selecionada.status === "aceita" ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const dadosAceiteLocal =
                          selecionada?.dados_aceite ||
                          selecionada?.dados?.dados_aceite ||
                          {};

                        // Abre o comprovante imediatamente com os dados já carregados.
                        // A consulta ao Supabase abaixo apenas atualiza/completa o conteúdo.
                        setComprovanteAceite({
                          numero_proposta: selecionada.numero_proposta || "",
                          cliente: selecionada.cliente || "",
                          cnpj: selecionada.cnpj || "",
                          aceita_em:
                            selecionada.aceita_em ||
                            dadosAceiteLocal?.aceita_em ||
                            null,
                          nome_aceite:
                            selecionada.nome_aceite ||
                            dadosAceiteLocal?.nome ||
                            "",
                          email_aceite:
                            selecionada.email_aceite ||
                            dadosAceiteLocal?.email ||
                            "",
                          representante_cpf:
                            selecionada.representante_cpf ||
                            dadosAceiteLocal?.cpf ||
                            "",
                          representante_cargo:
                            selecionada.representante_cargo ||
                            dadosAceiteLocal?.cargo ||
                            "",
                          representante_telefone:
                            selecionada.representante_telefone ||
                            dadosAceiteLocal?.telefone ||
                            "",
                        });

                        try {
                          const { data, error } = await supabase
                            .from("propostas")
                            .select(
                              "status, aceita_em, nome_aceite, email_aceite, dados"
                            )
                            .eq(
                              "numero_proposta",
                              selecionada.numero_proposta
                            )
                            .eq("escritorio_id", escritorioId)
                            .eq("publicada", true)
                            .maybeSingle();

                          if (error) throw error;

                          if (!data) return;

                          const dadosAceite =
                            data?.dados?.dados_aceite || {};
                          const representanteCpf =
                            data?.dados?.representante_cpf ||
                            dadosAceite?.cpf ||
                            selecionada.representante_cpf ||
                            dadosAceiteLocal?.cpf ||
                            "";
                          const representanteCargo =
                            data?.dados?.representante_cargo ||
                            dadosAceite?.cargo ||
                            selecionada.representante_cargo ||
                            dadosAceiteLocal?.cargo ||
                            "";
                          const representanteTelefone =
                            data?.dados?.representante_telefone ||
                            dadosAceite?.telefone ||
                            selecionada.representante_telefone ||
                            dadosAceiteLocal?.telefone ||
                            "";

                          const propostaAceitaAtualizada = {
                            ...selecionada,
                            status: data.status || selecionada.status,
                            aceita_em:
                              data.aceita_em || selecionada.aceita_em || null,
                            nome_aceite:
                              data.nome_aceite ||
                              dadosAceite?.nome ||
                              selecionada.nome_aceite ||
                              dadosAceiteLocal?.nome ||
                              "",
                            email_aceite:
                              data.email_aceite ||
                              dadosAceite?.email ||
                              selecionada.email_aceite ||
                              dadosAceiteLocal?.email ||
                              "",
                            dados_aceite:
                              Object.keys(dadosAceite).length
                                ? dadosAceite
                                : dadosAceiteLocal,
                            representante_cpf: representanteCpf,
                            representante_cargo: representanteCargo,
                            representante_telefone: representanteTelefone,
                          };

                          setSelecionada(propostaAceitaAtualizada);

                          setPropostas((atuais) => {
                            const atualizadas = atuais.map((proposal) =>
                              proposal.numero_proposta ===
                              selecionada.numero_proposta
                                ? {
                                    ...proposal,
                                    ...propostaAceitaAtualizada,
                                  }
                                : proposal
                            );

                            salvarCacheLocalLeve(atualizadas);
                            return atualizadas;
                          });

                          sincronizarCRMComProposta(
                            propostaAceitaAtualizada,
                            "aceita"
                          );

                          setComprovanteAceite({
                            numero_proposta: selecionada.numero_proposta || "",
                            cliente: selecionada.cliente || "",
                            cnpj: selecionada.cnpj || "",
                            aceita_em:
                              propostaAceitaAtualizada.aceita_em || null,
                            nome_aceite:
                              propostaAceitaAtualizada.nome_aceite || "",
                            email_aceite:
                              propostaAceitaAtualizada.email_aceite || "",
                            representante_cpf: representanteCpf,
                            representante_cargo: representanteCargo,
                            representante_telefone:
                              representanteTelefone,
                          });
                        } catch (error) {
                          console.error(
                            "Erro ao atualizar dados do comprovante do aceite:",
                            error
                          );
                          // O modal permanece aberto com os dados locais já disponíveis.
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      <CheckCircle2 size={17} />
                      Aceita digitalmente · Ver comprovante
                    </button>
                  ) : (
                    permissoesModulo.pode_editar ? (
                      <>
                        <button
                          type="button"
                          onClick={() => atualizarStatus(selecionada, "aceita")}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                        >
                          <CheckCircle2 size={17} />
                          Marcar como aceita
                        </button>
                        <button
                          type="button"
                          onClick={() => atualizarStatus(selecionada, "recusada")}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700"
                        >
                          <XCircle size={17} />
                          Recusar
                        </button>
                      </>
                    ) : null
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copiarLink(selecionada)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {selecionada.publicada &&
                    selecionada.publicada_em &&
                    (selecionada.token_publico || selecionada.link_publico) ? (
                      <Copy size={17} />
                    ) : (
                      <ExternalLink size={17} />
                    )}
                    {selecionada.publicada &&
                    selecionada.publicada_em &&
                    (selecionada.token_publico || selecionada.link_publico)
                      ? "Copiar link"
                      : "Publicar proposta"}
                  </button>
                  {permissoesModulo.pode_editar && (
                    <>
                      <button
                        type="button"
                        onClick={() => atualizarStatus(selecionada, "enviada")}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <FileCheck2 size={17} />
                        Marcar como enviada
                      </button>
                      <button
                        type="button"
                        disabled={preparandoCompartilhamento}
                        onClick={() => abrirCompartilhamento(selecionada)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                      >
                        <Send size={17} />
                        Enviar proposta
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => imprimir(selecionada)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Printer size={17} />
                    Gerar PDF
                  </button>
                  {permissoesModulo.pode_excluir && (
                    <button
                      type="button"
                      disabled={excluindoProposta}
                      onClick={() => excluirProposta(selecionada)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      title="Excluir proposta"
                    >
                      <Trash2 size={17} />
                      {excluindoProposta ? "Excluindo..." : "Excluir"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditorPropostaCompleto({ proposal, onCancel, onSave }) {
  const [draft, setDraft] = useState(normalize(proposal));
  const [frentesNegocio] = useState(() =>
    carregarFrentesNegocioLocal().filter((frente) => frente?.ativo !== false)
  );
  const [adicionandoServico, setAdicionandoServico] = useState(false);
  const [buscaServico, setBuscaServico] = useState("");
  const [servicosCatalogo] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SERVICOS_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  });

  const [regrasComerciais] = useState(() => {
    const fallback = {
      desconto: {
        permitido: true,
        percentualMaximo: 10,
        permitirPercentual: true,
        permitirValorFixo: true,
        aplicarMensalidade: true,
        aplicarServicosRecorrentes: true,
        aplicarServicosAvulsos: true,
        exigirJustificativa: true,
        percentualJustificativa: 5,
        exigirAprovacao: false,
        percentualAprovacao: 10,
      },
      permissoes: {
        comercialPodeAplicarDesconto: true,
      },
      protecoes: {
        preservarIndicePrecificaCont: true,
        registrarValorOriginal: true,
        registrarDesconto: true,
        registrarValorFinal: true,
      },
    };

    try {
      const raw = JSON.parse(
        localStorage.getItem(REGRAS_COMERCIAIS_KEY) || "{}"
      );
      return {
        ...fallback,
        ...raw,
        desconto: { ...fallback.desconto, ...(raw.desconto || {}) },
        permissoes: { ...fallback.permissoes, ...(raw.permissoes || {}) },
        protecoes: { ...fallback.protecoes, ...(raw.protecoes || {}) },
      };
    } catch {
      return fallback;
    }
  });

  const [descontoDraft, setDescontoDraft] = useState(() => ({
    tipo: proposal.comercial?.desconto?.tipo || "percentual",
    valor: String(proposal.comercial?.desconto?.valor_informado ?? ""),
    justificativa: proposal.comercial?.desconto?.justificativa || "",
  }));

  const tipoEstrutural = (item) => {
    const tipo = String(item?.tipo || "").toLowerCase();
    return [
      "honorario_matriz",
      "departamento_pessoal",
      "filial",
    ].includes(tipo);
  };

  const servicosFiltrados = servicosCatalogo.filter((servico) => {
    const termo = buscaServico.trim().toLowerCase();
    if (!termo) return true;

    const texto = [
      servico.nome,
      servico.descricao,
      servico.servico,
      servico.categoria,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return texto.includes(termo);
  });

  const adicionarServicoCatalogo = (servico) => {
    const descricao =
      servico.nome ||
      servico.descricao ||
      servico.servico ||
      "Serviço adicional";

    const valor = Number(
      servico.valor_praticado ??
        servico.valorPraticado ??
        servico.valor ??
        servico.preco ??
        servico.valor_recomendado ??
        0
    );

    const recorrenciaRaw = String(
      servico.recorrencia || servico.periodicidade || "pontual"
    ).toLowerCase();

    const recorrencia =
      recorrenciaRaw.includes("mens") ||
      recorrenciaRaw.includes("recorr")
        ? "mensal"
        : "pontual";

    const novoItem = normalizeItem(
      {
        id: `adicional-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        tipo: "servico_adicional",
        tipo_servico: "adicional",
        servico_adicional: true,
        descricao,
        categoria: servico.categoria || "Serviço adicional",
        recorrencia,
        valor,
        total: valor,
        valor_original: valor,
        catalogo_id: servico.id || servico.codigo || null,
      },
      draft.itens_proposta.length
    );

    setDraft((current) => ({
      ...current,
      itens_proposta: [...current.itens_proposta, novoItem],
    }));

    setAdicionandoServico(false);
    setBuscaServico("");
  };

  const removerServico = (index) => {
    setDraft((current) => ({
      ...current,
      itens_proposta: current.itens_proposta.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const baseMensalOriginal = draft.itens_proposta
    .filter((item) => item.recorrencia !== "pontual")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const basePontualOriginal = draft.itens_proposta
    .filter((item) => item.recorrencia === "pontual")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const descontoPermitido =
    regrasComerciais.desconto.permitido !== false &&
    regrasComerciais.permissoes.comercialPodeAplicarDesconto !== false;

  const tipoDescontoPermitido =
    descontoDraft.tipo === "percentual"
      ? regrasComerciais.desconto.permitirPercentual !== false
      : regrasComerciais.desconto.permitirValorFixo !== false;

  const valorInformadoDesconto = Math.max(
    0,
    Number(String(descontoDraft.valor || "").replace(",", ".")) || 0
  );

  const baseElegivelDesconto =
    (regrasComerciais.desconto.aplicarMensalidade !== false
      ? baseMensalOriginal
      : 0) +
    (regrasComerciais.desconto.aplicarServicosAvulsos !== false
      ? basePontualOriginal
      : 0);

  const descontoCalculadoBruto =
    descontoDraft.tipo === "percentual"
      ? (baseElegivelDesconto * valorInformadoDesconto) / 100
      : valorInformadoDesconto;

  const percentualEfetivo =
    baseElegivelDesconto > 0
      ? (descontoCalculadoBruto / baseElegivelDesconto) * 100
      : 0;

  const percentualMaximo = Number(
    regrasComerciais.desconto.percentualMaximo || 0
  );

  const excedeLimite =
    descontoPermitido &&
    percentualMaximo > 0 &&
    percentualEfetivo > percentualMaximo + 0.0001;

  const exigeJustificativa =
    descontoPermitido &&
    regrasComerciais.desconto.exigirJustificativa !== false &&
    percentualEfetivo >=
      Number(regrasComerciais.desconto.percentualJustificativa || 0);

  const exigeAprovacao =
    descontoPermitido &&
    regrasComerciais.desconto.exigirAprovacao === true &&
    percentualEfetivo >=
      Number(regrasComerciais.desconto.percentualAprovacao || 0);

  const descontoValido =
    descontoPermitido &&
    tipoDescontoPermitido &&
    !excedeLimite &&
    (!exigeJustificativa || descontoDraft.justificativa.trim());

  const descontoAplicado = descontoValido
    ? Math.min(descontoCalculadoBruto, baseElegivelDesconto)
    : 0;

  const rateioMensal =
    baseElegivelDesconto > 0 &&
    regrasComerciais.desconto.aplicarMensalidade !== false
      ? descontoAplicado * (baseMensalOriginal / baseElegivelDesconto)
      : 0;

  const rateioPontual =
    baseElegivelDesconto > 0 &&
    regrasComerciais.desconto.aplicarServicosAvulsos !== false
      ? descontoAplicado * (basePontualOriginal / baseElegivelDesconto)
      : 0;

  const mensalFinalPreview = Math.max(0, baseMensalOriginal - rateioMensal);
  const pontualFinalPreview = Math.max(0, basePontualOriginal - rateioPontual);

  const aplicarFrenteNegocio = (frenteId) => {
    const idSelecionado = String(frenteId || "").trim();
    const frenteSelecionada = frentesNegocio.find(
      (frente) => String(frente?.id || "") === idSelecionado
    );

    const templatePadrao = carregarTemplatePropostaLocal();
    const templateAplicado =
      frenteSelecionada?.template &&
      typeof frenteSelecionada.template === "object" &&
      Object.keys(frenteSelecionada.template).length
        ? frenteSelecionada.template
        : templatePadrao;

    const configuracaoAplicada = normalize({
      configuracao:
        templateAplicado && Object.keys(templateAplicado).length
          ? templateAplicado
          : {},
    }).configuracao;

    setDraft((current) => ({
      ...current,
      frente_negocio_id: frenteSelecionada?.id || null,
      frente_negocio_nome: frenteSelecionada?.nome || "",
      frente_negocio: frenteSelecionada
        ? {
            id: frenteSelecionada.id,
            nome: frenteSelecionada.nome || "",
            tipo: frenteSelecionada.tipo || "",
          }
        : null,
      template_frente_id: frenteSelecionada?.id || null,
      template_frente_nome: frenteSelecionada?.nome || "",
      template_frente_origem: frenteSelecionada?.template
        ? "frente"
        : "padrao",
      template_frente_aplicado_em: new Date().toISOString(),
      configuracao: configuracaoAplicada,
    }));
  };

  const setConfig = (key, value) => {
    setDraft((current) => ({
      ...current,
      configuracao: {
        ...current.configuracao,
        [key]: value,
      },
    }));
  };

  const uploadImage = (event, field) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Selecione uma imagem JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result;

      if (field !== "capaImagem") {
        setConfig(field, dataUrl);
        event.target.value = "";
        return;
      }

      const image = new Image();

      image.onload = () => {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        const ratio = width / height;
        const ratioOk =
          Math.abs(ratio - COVER_RATIO) <= COVER_RATIO_TOLERANCE;
        const orientationOk = height > width;
        const recommendedSize =
          width >= COVER_RECOMMENDED_WIDTH &&
          height >= COVER_RECOMMENDED_HEIGHT;

        setDraft((current) => ({
          ...current,
          configuracao: {
            ...current.configuracao,
            capaImagem: dataUrl,
            capaInfo: {
              nome: file.name,
              largura: width,
              altura: height,
              proporcaoA4: ratioOk && orientationOk,
              resolucaoRecomendada: recommendedSize,
            },
          },
        }));

        if (!orientationOk || !ratioOk) {
          alert(
            `A capa foi carregada, mas não está no padrão A4 vertical.\n\nImagem enviada: ${width} × ${height} px.\nRecomendado: 2480 × 3508 px (A4 vertical).\n\nEla poderá sofrer cortes no PDF.`
          );
        }

        event.target.value = "";
      };

      image.onerror = () => {
        alert("Não foi possível validar as dimensões da capa.");
        event.target.value = "";
      };

      image.src = dataUrl;
    };

    reader.onerror = () => {
      alert("Não foi possível carregar a imagem.");
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const updateSection = (id, patch) => {
    setDraft((current) => ({
      ...current,
      configuracao: {
        ...current.configuracao,
        secoes: current.configuracao.secoes.map((section) =>
          section.id === id ? { ...section, ...patch } : section
        ),
      },
    }));
  };

  const moveSection = (index, direction) => {
    setDraft((current) => {
      const sections = [...current.configuracao.secoes];
      const target = index + direction;
      if (target < 0 || target >= sections.length) return current;
      [sections[index], sections[target]] = [
        sections[target],
        sections[index],
      ];

      return {
        ...current,
        configuracao: {
          ...current.configuracao,
          secoes: sections,
        },
      };
    });
  };

  const addSection = () => {
    setDraft((current) => ({
      ...current,
      configuracao: {
        ...current.configuracao,
        secoes: [
          ...current.configuracao.secoes,
          {
            id: `custom-${Date.now()}`,
            titulo: "Nova seção",
            subtitulo: "Personalizada",
            texto: "",
            itens: [],
            ativo: true,
          },
        ],
      },
    }));
  };

  const removeSection = (id) => {
    setDraft((current) => ({
      ...current,
      configuracao: {
        ...current.configuracao,
        secoes: current.configuracao.secoes.filter(
          (section) => section.id !== id
        ),
      },
    }));
  };

  const setValidade = (days) => {
    const validadeDias = Math.max(1, Number(days || 1));
    setDraft((current) => ({
      ...current,
      validade: new Date(
        Date.now() + validadeDias * 86400000
      ).toISOString(),
      configuracao: {
        ...current.configuracao,
        validadeDias,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
              <Pencil size={16} />
              Editor completo da proposta
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {draft.cliente}
            </h2>
            <div className="text-xs font-semibold text-blue-600 mt-1">
              {draft.numero_proposta || "Número será gerado automaticamente"}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Edite o conteúdo comercial e a estrutura da proposta. Valores
              calculados pela precificação permanecem protegidos.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 border border-blue-100">
                <BriefcaseBusiness size={18} />
              </div>

              <div className="flex-1">
                <div className="font-semibold text-slate-900">
                  Frente de Negócio
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  A frente define o template usado nesta proposta. Se ela não tiver
                  template específico, o template padrão do escritório será aplicado.
                </p>

                <div className="mt-4">
                  <SelectPrecificaCont
                    value={
                      draft.frente_negocio_id ||
                      draft.frente_negocio?.id ||
                      ""
                    }
                    onChange={aplicarFrenteNegocio}
                    options={[
                      {
                        value: "",
                        label: "Sem frente específica · usar template padrão",
                      },
                      ...frentesNegocio.map((frente) => ({
                        value: String(frente.id),
                        label: frente.nome || "Frente sem nome",
                      })),
                    ]}
                    placeholder="Selecione a frente de negócio"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                {(draft.frente_negocio_id || draft.frente_negocio?.id) && (
                  <div className="mt-2 text-xs font-semibold text-blue-700">
                    Template aplicado:{" "}
                    {draft.template_frente_origem === "frente"
                      ? "específico da frente"
                      : "padrão do escritório"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
                <FileText size={18} className="text-blue-600" />
                Capa e identidade
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Título da proposta
                <input
                  value={draft.configuracao.titulo}
                  onChange={(e) => setConfig("titulo", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700 mt-4">
                Subtítulo
                <input
                  value={draft.configuracao.subtitulo}
                  onChange={(e) => setConfig("subtitulo", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  placeholder="Ex.: Proposta personalizada para sua empresa"
                />
              </label>

              <div className="mt-4">
                <div className="text-sm font-medium text-slate-700">
                  Logo do escritório
                </div>

                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white cursor-pointer hover:bg-slate-800">
                    <Plus size={16} />
                    {draft.configuracao.logo
                      ? "Trocar logo"
                      : "Fazer upload do logo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => uploadImage(e, "logo")}
                      className="hidden"
                    />
                  </label>

                  {draft.configuracao.logo && (
                    <button
                      type="button"
                      onClick={() => setConfig("logo", "")}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Remover logo
                    </button>
                  )}
                </div>

                {draft.configuracao.logo && (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <img
                      src={draft.configuracao.logo}
                      alt="Prévia do logo"
                      className="max-h-20 max-w-[260px] object-contain object-left"
                    />
                  </div>
                )}
              </div>

              <div className="mt-5">
                <div className="text-sm font-medium text-slate-700">
                  Capa da proposta
                </div>

                <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <div className="text-sm font-semibold text-blue-900">
                    Padrão oficial: A4 vertical
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    Recomendado: 2480 × 3508 px • proporção 210:297 • JPG, PNG ou WEBP.
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white cursor-pointer hover:bg-blue-500">
                    <Plus size={16} />
                    {draft.configuracao.capaImagem
                      ? "Trocar capa"
                      : "Fazer upload da capa"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => uploadImage(e, "capaImagem")}
                      className="hidden"
                    />
                  </label>

                  {draft.configuracao.capaImagem && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          configuracao: {
                            ...current.configuracao,
                            capaImagem: "",
                            capaInfo: null,
                          },
                        }))
                      }
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Remover capa
                    </button>
                  )}
                </div>

                {draft.configuracao.capaImagem && (
                  <>
                    <div className="mt-4 grid sm:grid-cols-2 gap-3">
                      <label className="rounded-xl border border-slate-200 p-3 cursor-pointer">
                        <input
                          type="radio"
                          name="capaModo"
                          value="sistema"
                          checked={draft.configuracao.capaModo === "sistema"}
                          onChange={() => setConfig("capaModo", "sistema")}
                          className="mr-2"
                        />
                        <span className="text-sm font-semibold text-slate-800">
                          Capa com dados do sistema
                        </span>
                        <div className="text-xs text-slate-500 mt-1 ml-5">
                          Imagem + título + cliente + número da proposta.
                        </div>
                      </label>

                      <label className="rounded-xl border border-slate-200 p-3 cursor-pointer">
                        <input
                          type="radio"
                          name="capaModo"
                          value="pronta"
                          checked={draft.configuracao.capaModo === "pronta"}
                          onChange={() => setConfig("capaModo", "pronta")}
                          className="mr-2"
                        />
                        <span className="text-sm font-semibold text-slate-800">
                          Capa pronta
                        </span>
                        <div className="text-xs text-slate-500 mt-1 ml-5">
                          Usa a arte inteira sem textos por cima.
                        </div>
                      </label>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      <div className="aspect-[210/297] max-h-[520px] w-full bg-slate-100">
                        <img
                          src={draft.configuracao.capaImagem}
                          alt="Prévia da capa"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                        {draft.configuracao.capaInfo?.largura || "—"} ×{" "}
                        {draft.configuracao.capaInfo?.altura || "—"} px
                      </span>
                      <span
                        className={`rounded-full px-3 py-1.5 ${
                          draft.configuracao.capaInfo?.proporcaoA4
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {draft.configuracao.capaInfo?.proporcaoA4
                          ? "Proporção A4 correta"
                          : "Fora da proporção A4"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <label className="text-sm font-medium text-slate-700">
                  Cor principal
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="color"
                      value={draft.configuracao.cor}
                      onChange={(e) => setConfig("cor", e.target.value)}
                      className="w-12 h-11 rounded-lg border border-slate-200 p-1 bg-white"
                    />
                    <input
                      value={draft.configuracao.cor}
                      onChange={(e) => setConfig("cor", e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Cor secundária
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="color"
                      value={draft.configuracao.corSecundaria}
                      onChange={(e) =>
                        setConfig("corSecundaria", e.target.value)
                      }
                      className="w-12 h-11 rounded-lg border border-slate-200 p-1 bg-white"
                    />
                    <input
                      value={draft.configuracao.corSecundaria}
                      onChange={(e) =>
                        setConfig("corSecundaria", e.target.value)
                      }
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
                <Building2 size={18} className="text-blue-600" />
                Apresentação do escritório
              </div>

              <textarea
                rows={11}
                value={draft.configuracao.apresentacaoEscritorio}
                onChange={(e) =>
                  setConfig("apresentacaoEscritorio", e.target.value)
                }
                placeholder="Escreva a apresentação do escritório, experiência, diferenciais, metodologia, atendimento, tecnologia, etc."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm resize-none"
              />

              <label className="block text-sm font-medium text-slate-700 mt-4">
                Validade
                <SelectPrecificaCont
                  value={draft.configuracao.validadeDias}
                  onChange={setValidade}
                  options={[3, 5, 7, 10, 15, 30].map((days) => ({
                    value: days,
                    label: `${days} dias`,
                  }))}
                  placeholder=""
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <ListChecks size={18} className="text-blue-600" />
                  Serviços e composição
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Matriz, Departamento Pessoal e filiais vêm da precificação e
                  ficam protegidos. Serviços adicionais podem ser incluídos ou
                  removidos da proposta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAdicionandoServico(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                <Plus size={16} />
                Adicionar serviço
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Serviço</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 w-14"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {draft.itens_proposta.map((item, index) => {
                    const protegido = tipoEstrutural(item);

                    return (
                      <tr key={`${item.id || item.descricao}-${index}`}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-800">
                            {item.descricao}
                          </div>
                          {item.observacao && (
                            <div className="text-xs text-slate-400 mt-1">
                              {item.observacao}
                            </div>
                          )}
                          {protegido && (
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                              <ShieldCheck size={11} />
                              Valor da precificação protegido
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-500">
                          {item.categoria}
                        </td>

                        <td className="px-4 py-3">
                          {protegido ? (
                            <span className="text-sm text-slate-700">
                              {item.recorrencia === "pontual"
                                ? "Pontual"
                                : "Mensal"}
                            </span>
                          ) : (
                            <SelectPrecificaCont
                              value={item.recorrencia}
                              onChange={(recorrencia) => {
                                setDraft((current) => {
                                  const itens = [...current.itens_proposta];
                                  itens[index] = {
                                    ...itens[index],
                                    recorrencia,
                                  };
                                  return {
                                    ...current,
                                    itens_proposta: itens,
                                  };
                                });
                              }}
                              options={[
                                { value: "mensal", label: "Mensal" },
                                { value: "pontual", label: "Pontual" },
                              ]}
                              placeholder=""
                              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            />
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div
                            className={`inline-flex min-w-28 justify-end rounded-lg px-3 py-2 text-sm font-semibold ${
                              protegido
                                ? "border border-slate-200 bg-slate-50 text-slate-700"
                                : "border border-blue-100 bg-blue-50 text-blue-700"
                            }`}
                          >
                            {money(item.valor)}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          {!protegido && (
                            <button
                              type="button"
                              onClick={() => removerServico(index)}
                              title="Remover serviço da proposta"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {draft.itens_proposta.length === 0 && (
                <div className="p-6 text-sm text-slate-500 text-center">
                  A proposta não recebeu itens da simulação.
                </div>
              )}
            </div>

            {adicionandoServico && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">
                      Adicionar serviço do catálogo
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      O valor vem do cadastro de Serviços Adicionais. Depois,
                      você pode definir se o item será mensal ou pontual.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAdicionandoServico(false);
                      setBuscaServico("");
                    }}
                    className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 flex items-center justify-center"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="relative mt-4">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoFocus
                    value={buscaServico}
                    onChange={(e) => setBuscaServico(e.target.value)}
                    placeholder="Buscar serviço adicional..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-300"
                  />
                </div>

                <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                  {servicosFiltrados.slice(0, 80).map((servico, index) => {
                    const nome =
                      servico.nome ||
                      servico.descricao ||
                      servico.servico ||
                      `Serviço ${index + 1}`;
                    const valor = Number(
                      servico.valor_praticado ??
                        servico.valorPraticado ??
                        servico.valor ??
                        servico.preco ??
                        servico.valor_recomendado ??
                        0
                    );

                    return (
                      <button
                        key={servico.id || servico.codigo || `${nome}-${index}`}
                        type="button"
                        onClick={() => adicionarServicoCatalogo(servico)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-800">
                            {nome}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {servico.categoria || "Serviço adicional"}
                          </div>
                        </div>
                        <div className="shrink-0 text-sm font-bold text-blue-700">
                          {money(valor)}
                        </div>
                      </button>
                    );
                  })}

                  {servicosFiltrados.length === 0 && (
                    <div className="p-5 text-center text-sm text-slate-500">
                      Nenhum serviço encontrado no catálogo.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <CircleDollarSign size={18} className="text-blue-600" />
                  Condição comercial e desconto
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  O Índice PrecificaCont e os valores calculados permanecem
                  preservados. O desconto é registrado separadamente.
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                Limite: {percentualMaximo || 0}%
              </div>
            </div>

            {!descontoPermitido ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                A política comercial atual não permite aplicação de desconto.
              </div>
            ) : (
              <>
                <div className="mt-5 grid lg:grid-cols-3 gap-4">
                  <label className="text-sm font-medium text-slate-700">
                    Tipo de desconto
                    <SelectPrecificaCont
                      value={descontoDraft.tipo}
                      onChange={(tipo) =>
                        setDescontoDraft((current) => ({
                          ...current,
                          tipo,
                          valor: "",
                        }))
                      }
                      options={[
                        ...(regrasComerciais.desconto.permitirPercentual !== false
                          ? [{ value: "percentual", label: "Percentual (%)" }]
                          : []),
                        ...(regrasComerciais.desconto.permitirValorFixo !== false
                          ? [{ value: "valor_fixo", label: "Valor fixo (R$)" }]
                          : []),
                      ]}
                      placeholder=""
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    {descontoDraft.tipo === "percentual"
                      ? "Percentual"
                      : "Valor do desconto"}
                    <input
                      type="number"
                      min="0"
                      step={descontoDraft.tipo === "percentual" ? "0.1" : "0.01"}
                      value={descontoDraft.valor}
                      onChange={(e) =>
                        setDescontoDraft((current) => ({
                          ...current,
                          valor: e.target.value,
                        }))
                      }
                      className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm ${
                        excedeLimite
                          ? "border-rose-300 bg-rose-50"
                          : "border-slate-200"
                      }`}
                      placeholder={
                        descontoDraft.tipo === "percentual"
                          ? "Ex.: 5"
                          : "Ex.: 100,00"
                      }
                    />
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Desconto calculado
                    </div>
                    <div className="mt-1 text-xl font-bold text-slate-900">
                      {money(descontoAplicado)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {percentualEfetivo.toFixed(2).replace(".", ",")}% da base
                      elegível
                    </div>
                  </div>
                </div>

                {excedeLimite && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    O desconto informado ultrapassa o limite de{" "}
                    <strong>{percentualMaximo}%</strong> definido em
                    Configurações. A proposta não será salva com esse desconto.
                  </div>
                )}

                {exigeJustificativa && (
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Justificativa do desconto
                    <textarea
                      rows={3}
                      value={descontoDraft.justificativa}
                      onChange={(e) =>
                        setDescontoDraft((current) => ({
                          ...current,
                          justificativa: e.target.value,
                        }))
                      }
                      className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      placeholder="Informe o motivo comercial para este desconto."
                    />
                  </label>
                )}

                {exigeAprovacao && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Pela política configurada, este desconto requer aprovação.
                    O registro será preservado na proposta para o fluxo de
                    aprovação.
                  </div>
                )}

                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-xs text-slate-500">Valor original mensal</div>
                    <div className="mt-1 font-bold text-slate-900">
                      {money(baseMensalOriginal)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-xs text-slate-500">Desconto comercial</div>
                    <div className="mt-1 font-bold text-rose-600">
                      - {money(descontoAplicado)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="text-xs text-blue-700">Mensalidade final</div>
                    <div className="mt-1 font-bold text-blue-900">
                      {money(mensalFinalPreview)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <BriefcaseBusiness size={18} className="text-blue-600" />
              Conteúdo comercial
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Mensagem de abertura
              <textarea
                rows={4}
                value={draft.configuracao.mensagem}
                onChange={(e) => setConfig("mensagem", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm resize-none"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 mt-4">
              Condições comerciais
              <textarea
                rows={5}
                value={draft.configuracao.condicoes}
                onChange={(e) => setConfig("condicoes", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm resize-none"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 mt-4">
              Forma de pagamento
              <input
                value={draft.configuracao.formaPagamento}
                onChange={(e) =>
                  setConfig("formaPagamento", e.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 mt-4">
              Observações
              <textarea
                rows={4}
                value={draft.configuracao.observacoes}
                onChange={(e) => setConfig("observacoes", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm resize-none"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <GripVertical size={18} className="text-blue-600" />
                  Estrutura da proposta
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Ligue/desligue, edite e reorganize as seções. É possível
                  criar quantas quiser.
                </p>
              </div>

              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Nova seção
              </button>
            </div>

            <div className="space-y-3">
              {draft.configuracao.secoes.map((section, index) => (
                <div
                  key={section.id}
                  className={`rounded-2xl border p-4 ${
                    section.ativo
                      ? "border-slate-200 bg-white"
                      : "border-slate-100 bg-slate-50 opacity-70"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-2 text-slate-300">
                        <GripVertical size={18} />
                      </div>

                      <div className="flex-1">
                        <div className="grid md:grid-cols-2 gap-3">
                          <input
                            value={section.titulo}
                            onChange={(e) =>
                              updateSection(section.id, {
                                titulo: e.target.value,
                              })
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold"
                          />
                          <input
                            value={section.subtitulo || ""}
                            onChange={(e) =>
                              updateSection(section.id, {
                                subtitulo: e.target.value,
                              })
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                            placeholder="Subtítulo"
                          />
                        </div>

                        <textarea
                          rows={3}
                          value={section.texto || ""}
                          onChange={(e) =>
                            updateSection(section.id, {
                              texto: e.target.value,
                            })
                          }
                          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none"
                          placeholder="Conteúdo da seção..."
                        />
                      </div>
                    </div>

                    <div className="flex lg:flex-col items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateSection(section.id, {
                            ativo: !section.ativo,
                          })
                        }
                        className="p-2 rounded-xl text-blue-600 hover:bg-blue-50"
                        title={section.ativo ? "Ocultar" : "Mostrar"}
                      >
                        {section.ativo ? (
                          <ToggleRight size={22} />
                        ) : (
                          <ToggleLeft size={22} />
                        )}
                      </button>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveSection(index, -1)}
                          disabled={index === 0}
                          className="p-2 rounded-lg border border-slate-200 disabled:opacity-30"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(index, 1)}
                          disabled={
                            index === draft.configuracao.secoes.length - 1
                          }
                          className="p-2 rounded-lg border border-slate-200 disabled:opacity-30"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Excluir seção"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <Palette size={18} className="text-blue-600" />
              Rodapé e aceite
            </div>

            <textarea
              rows={3}
              value={draft.configuracao.rodape}
              onChange={(e) => setConfig("rodape", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 z-30 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
                if (valorInformadoDesconto > 0) {
                  if (!descontoPermitido) {
                    alert("A política comercial atual não permite desconto.");
                    return;
                  }

                  if (!tipoDescontoPermitido) {
                    alert("Este tipo de desconto não está permitido nas Configurações.");
                    return;
                  }

                  if (excedeLimite) {
                    alert(
                      `O desconto ultrapassa o limite de ${percentualMaximo}% definido nas Configurações.`
                    );
                    return;
                  }

                  if (exigeJustificativa && !descontoDraft.justificativa.trim()) {
                    alert("Informe a justificativa obrigatória para o desconto.");
                    return;
                  }
                }

                onSave({
                  ...draft,
                  comercial: {
                    ...(draft.comercial || {}),
                    valor_original_mensal: baseMensalOriginal,
                    valor_original_pontual: basePontualOriginal,
                    desconto: {
                      aplicado: descontoAplicado > 0,
                      tipo: descontoDraft.tipo,
                      valor_informado: valorInformadoDesconto,
                      valor_desconto: descontoAplicado,
                      percentual_efetivo: percentualEfetivo,
                      justificativa: descontoDraft.justificativa.trim(),
                      requer_aprovacao: exigeAprovacao,
                      status_aprovacao: exigeAprovacao
                        ? "pendente"
                        : "nao_necessaria",
                      politica_snapshot: regrasComerciais.desconto,
                      aplicado_em:
                        descontoAplicado > 0 ? new Date().toISOString() : null,
                    },
                    valor_final_mensal: mensalFinalPreview,
                    valor_final_pontual: pontualFinalPreview,
                  },
                });
              }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <Save size={17} />
            Salvar proposta completa
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposalDocument({ proposal }) {
  let configuracaoRender = proposal.configuracao || {};
  const minutaContrato = carregarMinutaContratoLocal();

  try {
    const templateOficial = carregarTemplatePropostaLocal();

    configuracaoRender = {
      ...configuracaoRender,
      logo:
        configuracaoRender.logo ||
        (configuracaoRender.logoDoTemplateOficial
          ? templateOficial.logo || ""
          : ""),
      capaImagem:
        configuracaoRender.capaImagem ||
        (configuracaoRender.capaDoTemplateOficial
          ? templateOficial.capaImagem || ""
          : ""),
    };
  } catch (error) {
    console.warn("Não foi possível carregar as imagens do template oficial.", error);
  }

  proposal = { ...proposal, configuracao: configuracaoRender };

  const cor = proposal.configuracao?.cor || "#123A63";
  const cor2 = proposal.configuracao?.corSecundaria || "#2563EB";
  const capaPronta =
    proposal.configuracao?.capaModo === "pronta" &&
    Boolean(proposal.configuracao?.capaImagem);

  const itens = proposal.itens_proposta || [];
  const secoes = proposal.configuracao?.secoes || [];
  const secao = (id) => secoes.find((item) => item.id === id);
  const secaoAtiva = (id) => secao(id)?.ativo !== false;
  const tituloSecao = (id, fallback) => secao(id)?.titulo || fallback;
  const subtituloSecao = (id) => secao(id)?.subtitulo || "";
  const textoSecao = (id, fallback = "") => secao(id)?.texto || fallback;
  const tipoItem = (item) => String(item?.tipo || "").toLowerCase();
  const minutaAtiva =
    minutaContrato?.ativo !== false && Boolean(String(minutaContrato?.conteudo || "").trim());
  const minutaPreenchida = minutaAtiva
    ? preencherVariaveisMinuta(minutaContrato.conteudo, proposal)
    : "";

  const departamentoPessoalItem = itens.find(
    (item) => tipoItem(item) === "departamento_pessoal"
  );

  const dpEstruturado =
    proposal.composicao_detalhada?.departamento_pessoal ||
    proposal.pricing_snapshot?.departamento_pessoal ||
    proposal.matriz?.departamento_pessoal ||
    null;

  const departamentoPessoal = departamentoPessoalItem
    ? {
        quantidade: Number(departamentoPessoalItem.quantidade || 0),
        valor_unitario: Number(departamentoPessoalItem.valor_unitario || 0),
        total: Number(
          departamentoPessoalItem.total ?? departamentoPessoalItem.valor ?? 0
        ),
      }
    : dpEstruturado && Number(dpEstruturado.total || 0) > 0
    ? {
        quantidade: Number(
          dpEstruturado.quantidade ?? dpEstruturado.colaboradores ?? 0
        ),
        valor_unitario: Number(
          dpEstruturado.valor_unitario ?? dpEstruturado.valorUnitario ?? 0
        ),
        total: Number(dpEstruturado.total || 0),
      }
    : null;

  const recorrentes = itens.filter(
    (item) =>
      item.recorrencia === "mensal" &&
      tipoItem(item) !== "departamento_pessoal"
  );
  const pontuais = itens.filter((item) => item.recorrencia === "pontual");
  const servicosRecorrentes = recorrentes.filter(
    (item) => tipoItem(item) === "servico_adicional"
  );
  const honorariosRecorrentes = recorrentes.filter(
    (item) => tipoItem(item) !== "servico_adicional"
  );

  const valorPontual = Number(proposal.valores?.servicos_pontuais || 0);
  const primeiroMes =
    Number(proposal.valores?.primeiro_mes || 0) ||
    Number(proposal.valores?.mensalidade_total || 0) + valorPontual;

  const condicaoComercial = proposal.condicao_comercial || {};
  const descontoComercial = {
    ...(proposal.comercial?.desconto || {}),
    valor_desconto:
      Number(proposal.comercial?.desconto?.valor_desconto || 0) ||
      Number(
        condicaoComercial.desconto_valor ??
          proposal.valores?.desconto_comercial_valor ??
          0
      ),
    percentual_efetivo:
      Number(proposal.comercial?.desconto?.percentual_efetivo || 0) ||
      Number(
        condicaoComercial.desconto_percentual ??
          proposal.valores?.desconto_comercial_percentual ??
          0
      ),
  };

  const possuiDesconto = Number(descontoComercial.valor_desconto || 0) > 0;

  const valorOriginalMensal = Number(
    proposal.comercial?.valor_original_mensal ??
      condicaoComercial.mensalidade_bruta ??
      proposal.valores?.mensalidade_bruta ??
      proposal.valores?.valor_original_mensal ??
      proposal.valores?.mensalidade_total ??
      0
  );

  const valorComercial = (valor) =>
    Number(valor || 0) > 0 ? money(valor) : "Incluso";

  const customSections = secoes.filter(
    (section) =>
      section.ativo !== false &&
      ![
        "apresentacao",
        "escopo",
        "investimento",
        "condicoes",
        "proximos_passos",
      ].includes(section.id)
  );

  return (
    <div className="proposal-document bg-white">
      {/* PÁGINA 1 — CAPA */}
      <section
        className={`print-page print-cover relative overflow-hidden text-white ${
          capaPronta ? "p-0" : "flex flex-col justify-between p-10 md:p-14"
        }`}
        style={
          capaPronta
            ? { backgroundColor: "#ffffff" }
            : {
                background: proposal.configuracao?.capaImagem
                  ? `linear-gradient(135deg, rgba(15,23,42,.72), rgba(15,23,42,.42)), url(${proposal.configuracao.capaImagem}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${cor}, ${cor2})`,
              }
        }
      >
        {capaPronta ? (
          <img
            src={proposal.configuracao.capaImagem}
            alt="Capa da proposta"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : proposal.configuracao?.capaMostrarTexto === false ? (
          proposal.configuracao?.capaImagem ? (
            <img
              src={proposal.configuracao.capaImagem}
              alt="Capa da proposta"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${cor}, ${cor2})` }}
            />
          )
        ) : (
          <>
            <div>
              {proposal.configuracao?.logo ? (
                <img
                  src={proposal.configuracao.logo}
                  alt="Logo"
                  className="max-h-16 max-w-[240px] object-contain object-left"
                />
              ) : (
                <div className="text-2xl font-bold tracking-tight">
                  {proposal.nome_escritorio || "Seu Escritório Contábil"}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-semibold tracking-[0.2em] uppercase opacity-80">
                Proposta Comercial
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight mt-5 max-w-4xl">
                {proposal.configuracao?.titulo}
              </h1>

              {proposal.configuracao?.subtitulo && (
                <p className="text-xl opacity-90 mt-5 max-w-3xl">
                  {proposal.configuracao.subtitulo}
                </p>
              )}

              <div className="mt-12 pt-6 border-t border-white/25 grid grid-cols-2 gap-5">
                <div>
                  <div className="text-xs uppercase tracking-wide opacity-70">
                    Proposta para
                  </div>
                  <div className="text-2xl font-semibold mt-2">
                    {proposal.cliente}
                  </div>
                  {proposal.cnpj && (
                    <div className="text-sm opacity-80 mt-1">
                      CNPJ/CPF: {proposal.cnpj}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide opacity-70">
                    Validade
                  </div>
                  <div className="text-lg font-semibold mt-2">
                    {dateBR(proposal.validade)}
                  </div>
                  <div className="text-sm opacity-75 mt-1">
                    {proposal.numero_proposta || `Proposta #${proposal.id}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm opacity-70">
              Preparada especialmente para {proposal.cliente}.
            </div>
          </>
        )}
      </section>

      {/* PÁGINA 2 — APRESENTAÇÃO + ESCOPO */}
      {(secaoAtiva("apresentacao") || secaoAtiva("escopo")) && (
        <section className="print-page proposal-content-page p-10 md:p-12">
          {secaoAtiva("apresentacao") && (
            <div className="proposal-section">
              <SectionHeading
                number="01"
                title={tituloSecao("apresentacao", "Apresentação")}
                color={cor}
              />

              {subtituloSecao("apresentacao") && (
                <div className="mt-2 text-sm font-semibold text-slate-500">
                  {subtituloSecao("apresentacao")}
                </div>
              )}

              {textoSecao("apresentacao") && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                  {textoSecao("apresentacao")}
                </p>
              )}

              <div className="mt-5 grid grid-cols-[1.35fr_.65fr] gap-5">
                <div>
                  {proposal.configuracao?.mensagem && (
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {proposal.configuracao.mensagem}
                    </p>
                  )}

                  {proposal.configuracao?.apresentacaoEscritorio && (
                    <div className="proposal-office-about mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="proposal-office-about-title text-xs font-bold uppercase tracking-wide text-slate-500">
                        Sobre o escritório
                      </div>
                      <p className="proposal-office-about-text mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                        {proposal.configuracao.apresentacaoEscritorio}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className="avoid-break rounded-2xl p-5 text-white flex flex-col justify-end min-h-[150px]"
                  style={{ background: `linear-gradient(145deg, ${cor}, ${cor2})` }}
                >
                  <Building2 size={25} />
                  <div className="mt-5 text-lg font-bold">
                    Feita para o seu negócio
                  </div>
                  <div className="mt-2 text-xs leading-relaxed opacity-80">
                    Uma composição comercial construída a partir da realidade
                    informada na simulação.
                  </div>
                </div>
              </div>
            </div>
          )}

          {secaoAtiva("escopo") && (
            <div className={`${secaoAtiva("apresentacao") ? "mt-9 pt-8 border-t border-slate-200" : ""} proposal-section`}>
              <SectionHeading
                number="02"
                title={tituloSecao("escopo", "Escopo de serviços")}
                color={cor}
              />

              {subtituloSecao("escopo") && (
                <div className="mt-2 text-sm font-semibold text-slate-500">
                  {subtituloSecao("escopo")}
                </div>
              )}

              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {textoSecao(
                  "escopo",
                  "Confira os serviços contemplados nesta proposta e suas condições."
                )}
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2.5">
                {honorariosRecorrentes.map((item, index) => (
                  <div
                    key={`${item.descricao}-hon-${index}`}
                    className="avoid-break flex items-center justify-between gap-5 rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.descricao}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.categoria} • Recorrente mensal
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {valorComercial(item.valor)}
                    </div>
                  </div>
                ))}

                {departamentoPessoal &&
                  Number(departamentoPessoal.total || 0) > 0 && (
                    <div className="avoid-break flex items-center justify-between gap-5 rounded-xl border border-slate-200 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          Departamento Pessoal
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {departamentoPessoal.quantidade} colaborador
                          {departamentoPessoal.quantidade === 1 ? "" : "es"} ×{" "}
                          {money(departamentoPessoal.valor_unitario)} • Recorrente mensal
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
                        {money(departamentoPessoal.total)}
                      </div>
                    </div>
                  )}

                {servicosRecorrentes.map((item, index) => (
                  <div
                    key={`${item.descricao}-rec-${index}`}
                    className="avoid-break flex items-center justify-between gap-5 rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.descricao}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Serviço adicional • Recorrente mensal
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {valorComercial(item.valor)}
                    </div>
                  </div>
                ))}

                {pontuais.map((item, index) => (
                  <div
                    key={`${item.descricao}-pont-${index}`}
                    className="avoid-break flex items-center justify-between gap-5 rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.descricao}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Serviço avulso • Cobrança pontual
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {valorComercial(item.valor)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* PÁGINA 3 — INVESTIMENTO + CONDIÇÕES */}
      {(secaoAtiva("investimento") || secaoAtiva("condicoes")) && (
        <section className="print-page proposal-content-page p-10 md:p-12">
          {secaoAtiva("investimento") && (
            <div className="proposal-section">
              <SectionHeading
                number="03"
                title={tituloSecao("investimento", "Investimento")}
                color={cor}
              />

              {subtituloSecao("investimento") && (
                <div className="mt-2 text-sm font-semibold text-slate-500">
                  {subtituloSecao("investimento")}
                </div>
              )}

              {textoSecao("investimento") && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                  {textoSecao("investimento")}
                </p>
              )}

              <div className="mt-5 grid grid-cols-[1.3fr_.7fr] gap-4">
                <div
                  className="avoid-break rounded-2xl p-6 text-white"
                  style={{ background: `linear-gradient(135deg, ${cor}, ${cor2})` }}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-75">
                    Investimento mensal
                  </div>
                  <div className="mt-2 text-4xl font-bold">
                    {money(proposal.valores?.mensalidade_total)}
                  </div>
                  <div className="mt-2 text-sm opacity-75">
                    Serviços recorrentes da proposta
                  </div>
                </div>

                <div className="avoid-break rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Primeiro mês
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {money(primeiroMes)}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Mensalidade + itens pontuais
                  </div>
                </div>
              </div>

              {possuiDesconto && (
                <div className="avoid-break mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Condição comercial aplicada
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Valor original: {money(valorOriginalMensal)}
                        {" • "}
                        Desconto: {money(descontoComercial.valor_desconto)}
                        {Number(descontoComercial.percentual_efetivo || 0) > 0
                          ? ` (${Number(
                              descontoComercial.percentual_efetivo
                            )
                              .toFixed(2)
                              .replace(".", ",")}%)`
                          : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-emerald-700">
                        Valor final mensal
                      </div>
                      <div className="text-lg font-bold text-emerald-900">
                        {money(proposal.valores?.mensalidade_total)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: cor }}>
                  <span>Composição mensal</span>
                  <span>{money(proposal.valores?.mensalidade_total)}</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {recorrentes.map((item, index) => (
                    <div
                      key={`${item.descricao}-mensal-${index}`}
                      className="avoid-break flex items-center justify-between gap-5 px-4 py-2.5"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {item.descricao}
                        </div>
                        <div className="text-xs text-slate-500">
                          {tipoItem(item) === "filial"
                            ? "Filial • recorrente mensal"
                            : tipoItem(item) === "servico_adicional"
                            ? "Serviço adicional • recorrente mensal"
                            : "Honorários contábeis • recorrente mensal"}
                        </div>
                      </div>
                      <div className="text-sm font-semibold whitespace-nowrap">
                        {valorComercial(item.valor)}
                      </div>
                    </div>
                  ))}

                  {departamentoPessoal &&
                    Number(departamentoPessoal.total || 0) > 0 && (
                      <div className="avoid-break flex items-center justify-between gap-5 px-4 py-2.5">
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            Departamento Pessoal
                          </div>
                          <div className="text-xs text-slate-500">
                            {departamentoPessoal.quantidade} colaborador
                            {departamentoPessoal.quantidade === 1 ? "" : "es"} ×{" "}
                            {money(departamentoPessoal.valor_unitario)}
                          </div>
                        </div>
                        <div className="text-sm font-semibold whitespace-nowrap">
                          {money(departamentoPessoal.total)}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {pontuais.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
                    <span>Serviços pontuais</span>
                    <span>{valorComercial(valorPontual)}</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {pontuais.map((item, index) => (
                      <div
                        key={`${item.descricao}-avulso-${index}`}
                        className="avoid-break flex items-center justify-between gap-5 px-4 py-2.5"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            {item.descricao}
                          </div>
                          <div className="text-xs text-slate-500">
                            Cobrança pontual
                          </div>
                        </div>
                        <div className="text-sm font-semibold whitespace-nowrap">
                          {valorComercial(item.valor)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {secaoAtiva("condicoes") && (
            <div className={`${secaoAtiva("investimento") ? "mt-8 pt-7 border-t border-slate-200" : ""} proposal-section`}>
              <SectionHeading
                number="04"
                title={tituloSecao("condicoes", "Condições comerciais")}
                color={cor}
              />

              {subtituloSecao("condicoes") && (
                <div className="mt-2 text-sm font-semibold text-slate-500">
                  {subtituloSecao("condicoes")}
                </div>
              )}

              {textoSecao("condicoes") && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                  {textoSecao("condicoes")}
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                {proposal.configuracao?.condicoes && (
                  <div className="avoid-break rounded-xl border border-slate-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Condições
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                      {proposal.configuracao.condicoes}
                    </p>
                  </div>
                )}

                {proposal.configuracao?.formaPagamento && (
                  <div className="avoid-break rounded-xl border border-slate-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Forma de pagamento
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                      {proposal.configuracao.formaPagamento}
                    </p>
                  </div>
                )}
              </div>

              {proposal.configuracao?.observacoes && (
                <div className="avoid-break mt-3 rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Observações
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                    {proposal.configuracao.observacoes}
                  </p>
                </div>
              )}

              <div
                className="avoid-break mt-4 flex items-center justify-between gap-4 rounded-xl px-5 py-4 text-white"
                style={{ backgroundColor: cor }}
              >
                <div>
                  <div className="text-xs uppercase tracking-wide opacity-70">
                    Validade da proposta
                  </div>
                  <div className="mt-1 font-semibold">
                    Até {dateBR(proposal.validade)}
                  </div>
                </div>
                <ShieldCheck size={24} />
              </div>
            </div>
          )}
        </section>
      )}

      {/* SEÇÕES PERSONALIZADAS */}
      {customSections.map((section, index) => (
        <section
          key={section.id}
          className="print-page proposal-content-page p-10 md:p-12"
        >
          <SectionHeading
            number={String(index + 5).padStart(2, "0")}
            title={section.titulo}
            color={cor}
          />
          {section.subtitulo && (
            <div className="mt-2 text-sm font-semibold text-slate-500">
              {section.subtitulo}
            </div>
          )}
          {section.texto && (
            <p className="mt-6 text-slate-600 leading-relaxed whitespace-pre-line">
              {section.texto}
            </p>
          )}
        </section>
      ))}

      {/* MINUTA DE CONTRATO — configurada pelo escritório */}
      {minutaAtiva && (
        <section className="print-page proposal-content-page p-10 md:p-12">
          <SectionHeading
            number="CT"
            title={minutaContrato.titulo || "Contrato de Prestação de Serviços"}
            color={cor}
          />

          <div className="mt-3 text-sm font-semibold text-slate-500">
            Minuta vinculada à proposta {proposal.numero_proposta || ""}
          </div>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="whitespace-pre-line text-sm leading-7 text-slate-700">
              {minutaPreenchida}
            </div>
          </div>

          {!proposal.aceita_em && (
            <div className="avoid-break mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-700">
              Os dados do representante identificados como “preenchido no aceite” serão
              informados pelo cliente no momento da formalização digital. Os valores e os
              serviços acima são originados automaticamente desta proposta.
            </div>
          )}
        </section>
      )}

      {/* PÁGINA FINAL — PRÓXIMOS PASSOS */}
      {secaoAtiva("proximos_passos") && (
        <section className="print-page proposal-content-page p-10 md:p-12">
          <SectionHeading
            number={String(5 + customSections.length).padStart(2, "0")}
            title={tituloSecao("proximos_passos", "Próximos passos")}
            color={cor}
          />

          {subtituloSecao("proximos_passos") && (
            <div className="mt-2 text-sm font-semibold text-slate-500">
              {subtituloSecao("proximos_passos")}
            </div>
          )}

          {textoSecao("proximos_passos") && (
            <p className="mt-4 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
              {textoSecao("proximos_passos")}
            </p>
          )}

          <div className="mt-7 grid grid-cols-3 gap-4">
            {[
              ["01", "Análise", "O cliente analisa os serviços, valores e condições apresentados."],
              ["02", "Aceite", "A concordância pode ser registrada digitalmente na versão online."],
              ["03", "Início", "Após a formalização, o escritório inicia os procedimentos de atendimento."],
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="avoid-break rounded-xl border border-slate-200 p-5"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: cor }}
                >
                  {number}
                </div>
                <div className="mt-4 font-bold text-slate-900">{title}</div>
                <div className="mt-2 text-xs leading-relaxed text-slate-500">
                  {text}
                </div>
              </div>
            ))}
          </div>

          <div
            className="avoid-break mt-7 rounded-2xl p-6 text-white"
            style={{ background: `linear-gradient(135deg, ${cor}, ${cor2})` }}
          >
            <UserCheck size={25} />
            <div className="mt-4 text-xl font-bold">Aceite da proposta</div>
            <div className="mt-2 max-w-2xl text-sm leading-relaxed opacity-85">
              A versão online registra o aceite do cliente com nome, e-mail,
              data e hora, preservando a proposta apresentada.
            </div>
          </div>

          {proposal.configuracao?.rodape && (
            <div className="mt-8 border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-400 whitespace-pre-line">
              {proposal.configuracao.rodape}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function SectionHeading({ number, title, color }) {
  return (
    <div className="flex items-start gap-5">
      <div
        className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold shrink-0"
        style={{ backgroundColor: color }}
      >
        {number}
      </div>
      <div>
        <div
          className="text-xs uppercase tracking-[0.18em] font-semibold"
          style={{ color }}
        >
          Proposta comercial
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mt-1">
          {title}
        </h2>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  color,
  featured = false,
}) {
  return (
    <div
      className={`rounded-2xl p-6 border ${
        featured
          ? "text-white border-transparent"
          : "bg-slate-50 border-slate-200"
      }`}
      style={featured ? { backgroundColor: color } : undefined}
    >
      <div
        className={`text-sm ${
          featured ? "text-white/75" : "text-slate-500"
        }`}
      >
        {title}
      </div>
      <div className="text-2xl font-bold mt-2">{money(value)}</div>
      <div
        className={`text-xs mt-2 ${
          featured ? "text-white/70" : "text-slate-400"
        }`}
      >
        {description}
      </div>
    </div>
  );
}
