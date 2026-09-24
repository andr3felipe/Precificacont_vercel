import React, { useEffect, useRef, useState } from "react";
import {
  Settings,
  FileText,
  ShieldCheck,
  Save,
  Upload,
  Image as ImageIcon,
  Palette,
  Percent,
  LockKeyhole,
  CheckCircle2,
  AlertTriangle,
  Building2,
  CreditCard,
  Eye,
  Trash2,
  Info,
  Users,
  UserPlus,
  Copy,
  RefreshCw,
  XCircle,
  BriefcaseBusiness,
} from "lucide-react";
import { supabase } from "../supabase";
import SelectPrecificaCont from "../components/SelectPrecificaCont";

const TEMPLATE_PROPOSTA_KEY = "precificacont_template_proposta";
const REGRAS_COMERCIAIS_KEY = "precificacont_regras_comerciais";
const FRENTES_NEGOCIO_KEY = "precificacont_frentes_negocio";
const MINUTA_CONTRATO_KEY = "precificacont_minuta_contrato";

const CONFIGURACOES_TABLE = "configuracoes";
const TEMPLATE_BANCO_KEY = "template_proposta";
const REGRAS_BANCO_KEY = "regras_comerciais";
const FRENTES_BANCO_KEY = "frentes_negocio";
const MINUTA_BANCO_KEY = "minuta_contrato";

const ESCRITORIO_ATIVO_KEY = "precificacont_escritorio_ativo";

function getEscritorioAtivoId() {
  return localStorage.getItem(ESCRITORIO_ATIVO_KEY) || "";
}

function scopedStorageKey(baseKey, escritorioId = getEscritorioAtivoId()) {
  return escritorioId ? `${baseKey}:${escritorioId}` : baseKey;
}

function cachePerfilKey(escritorioId = getEscritorioAtivoId()) {
  return escritorioId
    ? `precificacont_config_perfil:${escritorioId}`
    : "precificacont_config_perfil";
}

function cacheUsuariosKey(escritorioId = getEscritorioAtivoId()) {
  return escritorioId
    ? `precificacont_config_usuarios:${escritorioId}`
    : "precificacont_config_usuarios";
}

function cacheConvitesKey(escritorioId = getEscritorioAtivoId()) {
  return escritorioId
    ? `precificacont_config_convites:${escritorioId}`
    : "precificacont_config_convites";
}

function lerArrayCache(chave) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

function configuracaoDoBanco(registro, fallback) {
  const dados =
    registro?.dados &&
    typeof registro.dados === "object" &&
    !Array.isArray(registro.dados)
      ? registro.dados
      : {};

  return {
    ...fallback,
    ...dados,
  };
}

const CAPA_RECOMENDADA = {
  largura: 2480,
  altura: 3508,
};

const LOGO_RECOMENDADA = {
  larguraMinima: 500,
};


const TEMPLATE_PADRAO = {
  titulo: "Proposta Comercial de Serviços Contábeis",
  subtitulo: "",
  mensagem: "Apresentamos uma proposta personalizada para sua empresa.",
  condicoes:
    "Valores e condições conforme os itens apresentados nesta proposta.",
  observacoes: "",
  formaPagamento: "A combinar",
  cor: "#123A63",
  corSecundaria: "#2563EB",
  validadeDias: 7,
  logo: "",
  capaImagem: "",
  capaModo: "sistema",
  capaMostrarTexto: true,
  capaEscurecimento: 38,
  capaInfo: null,
  apresentacaoEscritorio: "",
  rodape:
    "Documento comercial. Valores sujeitos às condições descritas nesta proposta.",
  secoes: [
    {
      id: "apresentacao",
      titulo: "Apresentação",
      subtitulo: "",
      texto: "",
      itens: [],
      ativo: true,
    },
    {
      id: "escopo",
      titulo: "Escopo de serviços",
      subtitulo: "",
      texto: "",
      itens: [],
      ativo: true,
    },
    {
      id: "investimento",
      titulo: "Investimento",
      subtitulo: "",
      texto: "",
      itens: [],
      ativo: true,
    },
    {
      id: "condicoes",
      titulo: "Condições comerciais",
      subtitulo: "",
      texto: "",
      itens: [],
      ativo: true,
    },
    {
      id: "proximos_passos",
      titulo: "Próximos passos",
      subtitulo: "",
      texto: "",
      itens: [],
      ativo: true,
    },
  ],
};

const MINUTA_PADRAO = {
  titulo: "Contrato de Prestação de Serviços",
  ativo: true,
  conteudo: "",
};

const VARIAVEIS_MINUTA = [
  { grupo: "Proposta / sistema", chave: "{{numero_proposta}}", descricao: "Número da proposta" },
  { grupo: "Proposta / sistema", chave: "{{cliente_razao_social}}", descricao: "Razão social / nome do cliente" },
  { grupo: "Proposta / sistema", chave: "{{cliente_cnpj}}", descricao: "CNPJ/CPF do cliente" },
  { grupo: "Proposta / sistema", chave: "{{frente_negocio}}", descricao: "Frente de negócio selecionada" },
  { grupo: "Proposta / sistema", chave: "{{valor_honorarios}}", descricao: "Honorários da proposta" },
  { grupo: "Proposta / sistema", chave: "{{valor_mensal_total}}", descricao: "Mensalidade total contratada" },
  { grupo: "Proposta / sistema", chave: "{{valor_primeiro_mes}}", descricao: "Valor total do primeiro mês" },
  { grupo: "Proposta / sistema", chave: "{{servicos_contratados}}", descricao: "Serviços e adicionais efetivamente contratados" },
  { grupo: "Proposta / sistema", chave: "{{forma_pagamento}}", descricao: "Forma de pagamento da proposta" },
  { grupo: "Aceite do cliente", chave: "{{representante_nome}}", descricao: "Nome do representante" },
  { grupo: "Aceite do cliente", chave: "{{representante_cpf}}", descricao: "CPF do representante" },
  { grupo: "Aceite do cliente", chave: "{{representante_cargo}}", descricao: "Cargo do representante" },
  { grupo: "Aceite do cliente", chave: "{{representante_email}}", descricao: "E-mail informado no aceite" },
  { grupo: "Aceite do cliente", chave: "{{representante_telefone}}", descricao: "Telefone informado no aceite" },
  { grupo: "Aceite do cliente", chave: "{{data_aceite}}", descricao: "Data e hora do aceite" },
];

const REGRAS_PADRAO = {
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
    adminConfiguraTemplate: true,
    adminConfiguraRegras: true,
    adminDescontoSemLimite: false,
    comercialPodeEditarProposta: true,
    comercialPodeAplicarDesconto: true,
    comercialPodeAlterarValorManual: false,
    comercialPodeAlterarIndice: false,
    comercialPodePublicar: true,
    comercialPodeEnviar: true,
    comercialPodeMarcarAceita: false,
  },

  protecoes: {
    preservarIndicePrecificaCont: true,
    registrarValorOriginal: true,
    registrarDesconto: true,
    registrarValorFinal: true,
  },
};

function carregarLocalStorage(chave, fallback) {
  try {
    const salvo = localStorage.getItem(scopedStorageKey(chave));

    if (!salvo) return fallback;

    const parsed = JSON.parse(salvo);

    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch (error) {
    console.error(`Erro ao carregar ${chave}:`, error);
    return fallback;
  }
}

function carregarTemplate() {
  const salvo = carregarLocalStorage(
    TEMPLATE_PROPOSTA_KEY,
    TEMPLATE_PADRAO
  );

  return {
    ...TEMPLATE_PADRAO,
    ...salvo,
    secoes:
      Array.isArray(salvo?.secoes) && salvo.secoes.length
        ? salvo.secoes
        : TEMPLATE_PADRAO.secoes,
  };
}

function carregarFrentesNegocio() {
  const salvo = carregarLocalStorage(FRENTES_NEGOCIO_KEY, []);
  return Array.isArray(salvo) ? salvo : [];
}

function carregarMinutaContrato() {
  const salvo = carregarLocalStorage(MINUTA_CONTRATO_KEY, MINUTA_PADRAO);
  return salvo && typeof salvo === "object"
    ? { ...MINUTA_PADRAO, ...salvo }
    : MINUTA_PADRAO;
}

function carregarRegras() {
  const salvo = carregarLocalStorage(
    REGRAS_COMERCIAIS_KEY,
    REGRAS_PADRAO
  );

  return {
    ...REGRAS_PADRAO,
    ...salvo,

    desconto: {
      ...REGRAS_PADRAO.desconto,
      ...(salvo?.desconto || {}),
    },

    permissoes: {
      ...REGRAS_PADRAO.permissoes,
      ...(salvo?.permissoes || {}),
    },

    protecoes: {
      ...REGRAS_PADRAO.protecoes,
      ...(salvo?.protecoes || {}),
    },
  };
}

function formatarTamanho(bytes) {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(0)} KB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
}

function otimizarImagemParaTemplate(imagem, tipo, mimeOriginal) {
  const larguraOriginal = imagem.naturalWidth;
  const alturaOriginal = imagem.naturalHeight;

  const limiteMaiorLado = tipo === "capa" ? 1800 : 1000;
  const maiorLado = Math.max(larguraOriginal, alturaOriginal);
  const escala = maiorLado > limiteMaiorLado ? limiteMaiorLado / maiorLado : 1;

  const larguraFinal = Math.max(1, Math.round(larguraOriginal * escala));
  const alturaFinal = Math.max(1, Math.round(alturaOriginal * escala));

  const canvas = document.createElement("canvas");
  canvas.width = larguraFinal;
  canvas.height = alturaFinal;

  const contexto = canvas.getContext("2d");

  if (!contexto) {
    throw new Error("Não foi possível preparar a imagem para o template.");
  }

  contexto.imageSmoothingEnabled = true;
  contexto.imageSmoothingQuality = "high";
  contexto.drawImage(imagem, 0, 0, larguraFinal, alturaFinal);

  const manterTransparencia =
    tipo === "logo" &&
    (mimeOriginal === "image/png" || mimeOriginal === "image/webp");

  const mimeSaida = manterTransparencia ? "image/webp" : "image/jpeg";
  const qualidade = tipo === "capa" ? 0.82 : 0.9;

  return {
    dataUrl: canvas.toDataURL(mimeSaida, qualidade),
    larguraFinal,
    alturaFinal,
    mimeSaida,
  };
}

function tamanhoDataUrlEmBytes(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return 0;

  const base64 = dataUrl.split(",")[1] || "";
  const padding = (base64.match(/=*$/)?.[0] || "").length;

  return Math.max(0, Math.ceil((base64.length * 3) / 4) - padding);
}

function analisarImagem(arquivo, tipo) {
  return new Promise((resolve, reject) => {
    if (!arquivo) {
      reject(new Error("Nenhuma imagem selecionada."));
      return;
    }

    const tiposPermitidos = ["image/png", "image/jpeg", "image/webp"];

    if (!tiposPermitidos.includes(arquivo.type)) {
      reject(
        new Error(
          `Formato não suportado: ${arquivo.type || "não identificado"}. Use PNG, JPG/JPEG ou WEBP.`
        )
      );
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(
        new Error(
          `Não foi possível ler o arquivo "${arquivo.name}". Verifique se a imagem não está corrompida.`
        )
      );
    };

    reader.onload = () => {
      const imagem = new Image();

      imagem.onerror = () => {
        reject(
          new Error(
            `O arquivo "${arquivo.name}" foi lido, mas o navegador não conseguiu abrir a imagem. Ela pode estar corrompida ou em um formato inválido.`
          )
        );
      };

      imagem.onload = () => {
        const largura = imagem.naturalWidth;
        const altura = imagem.naturalHeight;
        const tamanhoBytesOriginal = arquivo.size;

        let imagemOtimizada;

        try {
          imagemOtimizada = otimizarImagemParaTemplate(
            imagem,
            tipo,
            arquivo.type
          );
        } catch (error) {
          reject(error);
          return;
        }

        const tamanhoBytes = tamanhoDataUrlEmBytes(imagemOtimizada.dataUrl);

        const avisos = [];
        const erros = [];

        let proporcaoA4 = null;
        let proporcaoAdequada = null;
        let orientacaoVertical = null;
        let altaResolucao = null;

        if (tipo === "logo") {
          if (largura < LOGO_RECOMENDADA.larguraMinima) {
            avisos.push(
              `Logo atual: ${largura} × ${altura}px. Para melhor nitidez em telas e PDFs, recomendamos uma imagem com pelo menos ${LOGO_RECOMENDADA.larguraMinima}px de largura. O arquivo será aceito normalmente.`
            );
          }
        }

        if (tipo === "capa") {
          const proporcaoAtual = largura / altura;
          const proporcaoA4Referencia =
            CAPA_RECOMENDADA.largura / CAPA_RECOMENDADA.altura;

          const diferenca = Math.abs(
            proporcaoAtual - proporcaoA4Referencia
          );

          orientacaoVertical = altura > largura;
          proporcaoAdequada = orientacaoVertical && diferenca <= 0.035;
          proporcaoA4 = proporcaoAtual;
          altaResolucao =
            largura >= CAPA_RECOMENDADA.largura &&
            altura >= CAPA_RECOMENDADA.altura;

          if (!orientacaoVertical) {
            avisos.push(
              `A imagem enviada possui ${largura} × ${altura}px e está na horizontal. Para capa de proposta, prefira uma imagem vertical em proporção A4. O arquivo será aceito normalmente, mas poderá sofrer cortes na composição.`
            );
          } else if (!proporcaoAdequada) {
            avisos.push(
              `Imagem atual: ${largura} × ${altura}px. A proporção não corresponde ao A4 vertical. O arquivo será aceito normalmente, mas poderá sofrer cortes para preencher a página.`
            );
          }

          if (!altaResolucao) {
            avisos.push(
              `A resolução atual é ${largura} × ${altura}px. ${CAPA_RECOMENDADA.largura} × ${CAPA_RECOMENDADA.altura}px é apenas a recomendação para impressão em alta resolução; esta imagem continuará sendo aceita.`
            );
          }
        }

        resolve({
          dataUrl: imagemOtimizada.dataUrl,
          nome: arquivo.name,
          largura,
          altura,
          larguraArmazenada: imagemOtimizada.larguraFinal,
          alturaArmazenada: imagemOtimizada.alturaFinal,
          tamanhoBytesOriginal,
          tamanhoOriginalFormatado: formatarTamanho(tamanhoBytesOriginal),
          tamanhoBytes,
          tamanhoFormatado: formatarTamanho(tamanhoBytes),
          tipoArquivo: imagemOtimizada.mimeSaida,
          avisos,
          erros,
          valido: true,
          proporcaoA4,
          proporcaoAdequada,
          orientacaoVertical,
          altaResolucao,
        });
      };

      imagem.src = reader.result;
    };

    reader.readAsDataURL(arquivo);
  });
}

function Toggle({ ativo, onChange, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!ativo);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        ativo ? "bg-blue-600" : "bg-slate-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          ativo ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function CampoToggle({
  titulo,
  descricao,
  ativo,
  onChange,
  disabled = false,
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-100 py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="font-semibold text-slate-800">{titulo}</p>

        {descricao && (
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {descricao}
          </p>
        )}
      </div>

      <Toggle ativo={ativo} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function TituloCard({ icone: Icone, titulo, descricao }) {
  return (
    <div className="border-b border-slate-100 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icone size={20} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">{titulo}</h2>

          {descricao && (
            <p className="mt-1 text-sm text-slate-500">{descricao}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusImagem({ info, tipo }) {
  if (!info) {
    return (
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex gap-2">
          <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />

          <div className="text-xs leading-5 text-slate-500">
            {tipo === "logo" ? (
              <>
                PNG, JPG ou WEBP. Não há dimensão mínima obrigatória. Para
                melhor nitidez, recomendamos pelo menos{" "}
                <strong>{LOGO_RECOMENDADA.larguraMinima}px de largura</strong>.
              </>
            ) : (
              <>
                O principal é utilizar uma imagem em{" "}
                <strong>proporção A4 vertical</strong>. Uma capa como{" "}
                <strong>1024 × 1448px</strong> é adequada.{" "}
                <strong>
                  {CAPA_RECOMENDADA.largura} × {CAPA_RECOMENDADA.altura}px
                </strong>{" "}
                é apenas a recomendação para impressão em alta resolução.
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const capaAdequada =
    tipo === "capa" && info.proporcaoAdequada === true;

  const possuiAvisos = Boolean(info.avisos?.length);
  const possuiErros = Boolean(info.erros?.length);

  return (
    <div className="mt-3 space-y-2">
      <div
        className={`rounded-xl border p-3 ${
          possuiErros
            ? "border-red-200 bg-red-50"
            : capaAdequada
            ? "border-emerald-200 bg-emerald-50"
            : possuiAvisos
            ? "border-amber-200 bg-amber-50"
            : "border-emerald-200 bg-emerald-50"
        }`}
      >
        <div className="flex items-start gap-2">
          {possuiErros ? (
            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0 text-red-600"
            />
          ) : capaAdequada || !possuiAvisos ? (
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 text-emerald-600"
            />
          ) : (
            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0 text-amber-600"
            />
          )}

          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">
              {tipo === "logo" ? "Logo carregado" : "Capa carregada"}
            </p>

            <p className="mt-1 break-words text-xs text-slate-600">
              Imagem atual: <strong>{info.largura} × {info.altura}px</strong>
              {" • "}
              {info.tamanhoOriginalFormatado || info.tamanhoFormatado}
            </p>

            {info.tamanhoOriginalFormatado &&
              info.tamanhoOriginalFormatado !== info.tamanhoFormatado && (
                <p className="mt-1 text-xs font-semibold text-blue-700">
                  Otimizada automaticamente para o template:{" "}
                  {info.larguraArmazenada} × {info.alturaArmazenada}px •{" "}
                  {info.tamanhoFormatado}
                </p>
              )}

            {tipo === "capa" && info.proporcaoAdequada === true && (
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Proporção A4 vertical: adequada ✓
              </p>
            )}

            {tipo === "capa" && info.altaResolucao === true && (
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Resolução indicada para impressão em alta qualidade ✓
              </p>
            )}

            {tipo === "logo" && !possuiErros && !possuiAvisos && (
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Qualidade adequada ✓
              </p>
            )}
          </div>
        </div>
      </div>

      {info.erros?.map((erro, index) => (
        <div
          key={`erro-${index}`}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700"
        >
          <strong>Erro:</strong> {erro}
        </div>
      ))}

      {info.avisos?.map((aviso, index) => (
        <div
          key={`aviso-${index}`}
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800"
        >
          <strong>Recomendação:</strong> {aviso}
        </div>
      ))}
    </div>
  );
}


const CONFIGURACOES_DARK_CSS = `
  html.dark .precificacont-configuracoes {
    background:
      radial-gradient(circle at 88% 0%, rgba(37,99,235,.11), transparent 28rem),
      #07101f !important;
    color: #e5edf8;
  }

  html.dark .precificacont-configuracoes .bg-white {
    background-color: #0c1a2f !important;
  }

  html.dark .precificacont-configuracoes .bg-slate-50 {
    background-color: #10213a !important;
  }

  html.dark .precificacont-configuracoes .bg-slate-100 {
    background-color: #13233a !important;
  }

  html.dark .precificacont-configuracoes .bg-slate-900 {
    background-color: #1d4ed8 !important;
  }

  html.dark .precificacont-configuracoes .hover\:bg-slate-800:hover {
    background-color: #2563eb !important;
  }

  html.dark .precificacont-configuracoes .hover\:bg-slate-100:hover,
  html.dark .precificacont-configuracoes .hover\:bg-slate-50:hover {
    background-color: #18304f !important;
  }

  html.dark .precificacont-configuracoes .border-slate-100,
  html.dark .precificacont-configuracoes .border-slate-200,
  html.dark .precificacont-configuracoes .border-slate-300 {
    border-color: rgba(96,165,250,.18) !important;
  }

  html.dark .precificacont-configuracoes .text-slate-900,
  html.dark .precificacont-configuracoes .text-slate-800 {
    color: #f8fafc !important;
  }

  html.dark .precificacont-configuracoes .text-slate-700,
  html.dark .precificacont-configuracoes .text-slate-600 {
    color: #cbd5e1 !important;
  }

  html.dark .precificacont-configuracoes .text-slate-500 {
    color: #9fb0c7 !important;
  }

  html.dark .precificacont-configuracoes .text-slate-400 {
    color: #71839c !important;
  }

  html.dark .precificacont-configuracoes .text-blue-600,
  html.dark .precificacont-configuracoes .text-blue-700 {
    color: #60a5fa !important;
  }

  html.dark .precificacont-configuracoes .bg-blue-50 {
    background-color: rgba(37,99,235,.15) !important;
  }

  html.dark .precificacont-configuracoes .border-blue-100 {
    border-color: rgba(96,165,250,.22) !important;
  }

  html.dark .precificacont-configuracoes .bg-amber-50 {
    background-color: rgba(245,158,11,.12) !important;
  }

  html.dark .precificacont-configuracoes .border-amber-200 {
    border-color: rgba(251,191,36,.25) !important;
  }

  html.dark .precificacont-configuracoes .text-amber-600,
  html.dark .precificacont-configuracoes .text-amber-700,
  html.dark .precificacont-configuracoes .text-amber-800 {
    color: #fbbf24 !important;
  }

  html.dark .precificacont-configuracoes .bg-emerald-50 {
    background-color: rgba(16,185,129,.12) !important;
  }

  html.dark .precificacont-configuracoes .border-emerald-200 {
    border-color: rgba(52,211,153,.24) !important;
  }

  html.dark .precificacont-configuracoes .text-emerald-600,
  html.dark .precificacont-configuracoes .text-emerald-700 {
    color: #34d399 !important;
  }

  html.dark .precificacont-configuracoes .bg-red-50 {
    background-color: rgba(239,68,68,.12) !important;
  }

  html.dark .precificacont-configuracoes .border-red-100,
  html.dark .precificacont-configuracoes .border-red-200 {
    border-color: rgba(248,113,113,.24) !important;
  }

  html.dark .precificacont-configuracoes .text-red-600,
  html.dark .precificacont-configuracoes .text-red-700 {
    color: #fb7185 !important;
  }

  html.dark .precificacont-configuracoes input:not([type="color"]):not([type="range"]),
  html.dark .precificacont-configuracoes select,
  html.dark .precificacont-configuracoes textarea {
    background-color: #09172a !important;
    border-color: rgba(96,165,250,.22) !important;
    color: #f8fafc !important;
    color-scheme: dark;
  }

  html.dark .precificacont-configuracoes input::placeholder,
  html.dark .precificacont-configuracoes textarea::placeholder {
    color: #64748b !important;
  }

  html.dark .precificacont-configuracoes select option {
    background: #09172a;
    color: #f8fafc;
  }

  html.dark .precificacont-configuracoes input[type="color"] {
    background-color: #09172a !important;
    border-color: rgba(96,165,250,.22) !important;
  }

  html.dark .precificacont-configuracoes input[type="range"] {
    color-scheme: dark;
  }

  html.dark .precificacont-configuracoes .border-dashed {
    border-color: rgba(96,165,250,.28) !important;
  }

  html.dark .precificacont-configuracoes [class*="shadow"] {
    box-shadow: 0 18px 45px rgba(0,0,0,.20) !important;
  }
`;

function Configuracoes() {
  const [aba, setAba] = useState("template");

  const [template, setTemplate] = useState(() => carregarTemplate());
  const [regras, setRegras] = useState(() => carregarRegras());
  const [frentesNegocio, setFrentesNegocio] = useState(() => carregarFrentesNegocio());
  const [minutaContrato, setMinutaContrato] = useState(() => carregarMinutaContrato());
  const [frenteEditandoId, setFrenteEditandoId] = useState(null);
  const [templateFrenteId, setTemplateFrenteId] = useState(null);
  const templatePadraoAntesFrenteRef = useRef(null);
  const [frenteDraft, setFrenteDraft] = useState({
    nome: "",
    descricao: "",
    ativo: true,
  });

  const [salvoTemplate, setSalvoTemplate] = useState(false);
  const [salvoRegras, setSalvoRegras] = useState(false);
  const [salvoFrentes, setSalvoFrentes] = useState(false);
  const [salvoMinuta, setSalvoMinuta] = useState(false);

  const [infoLogo, setInfoLogo] = useState(null);
  const [infoCapa, setInfoCapa] = useState(null);

  const [erroImagem, setErroImagem] = useState("");

  const logoInputRef = useRef(null);
  const capaInputRef = useRef(null);

  // Usuários e convites do escritório
  const [escritorioId, setEscritorioId] = useState(() => getEscritorioAtivoId() || null);
  const [perfilAtual, setPerfilAtual] = useState(
    () => localStorage.getItem(cachePerfilKey()) || null
  );
  const [usuarioAtualId, setUsuarioAtualId] = useState(null);
  const [usuariosEscritorio, setUsuariosEscritorio] = useState(
    () => lerArrayCache(cacheUsuariosKey())
  );
  const [convitesEscritorio, setConvitesEscritorio] = useState(
    () => lerArrayCache(cacheConvitesKey())
  );
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [salvandoConvite, setSalvandoConvite] = useState(false);
  const [erroUsuarios, setErroUsuarios] = useState("");
  const [conviteCriado, setConviteCriado] = useState(null);
  const [novoConvite, setNovoConvite] = useState({
    nome: "",
    email: "",
    cargo: "",
    perfil: "usuario",
  });

  // Perfis e permissões por módulo
  const [perfisAcesso, setPerfisAcesso] = useState([]);
  const [perfilSelecionadoId, setPerfilSelecionadoId] = useState("");
  const [modulosPermitidos, setModulosPermitidos] = useState([]);
  const [permissoesPerfil, setPermissoesPerfil] = useState({});
  const [carregandoPerfis, setCarregandoPerfis] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  useEffect(() => {
    let ativoPerfil = true;

    const carregarPerfilDeAcesso = async () => {
      try {
        const { data: sessionData, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        if (!ativoPerfil) return;

        const userId = sessionData?.session?.user?.id || null;
        setUsuarioAtualId(userId);

        const escritorioAtual = getEscritorioAtivoId();
        if (!userId || !escritorioAtual) {
          setPerfilAtual("usuario");
          return;
        }

        setEscritorioId(escritorioAtual);

        const { data: vinculo, error: vinculoError } = await supabase
          .from("usuarios_escritorios")
          .select("perfil")
          .eq("user_id", userId)
          .eq("escritorio_id", escritorioAtual)
          .eq("ativo", true)
          .maybeSingle();

        if (vinculoError) throw vinculoError;
        if (ativoPerfil) {
          const perfil = vinculo?.perfil || "usuario";
          setPerfilAtual(perfil);
          localStorage.setItem(cachePerfilKey(escritorioAtual), perfil);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil de acesso:", error);
        if (ativoPerfil) setPerfilAtual("usuario");
      }
    };

    carregarPerfilDeAcesso();

    return () => {
      ativoPerfil = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    const carregarConfiguracoes = async () => {
      const templateLocal = carregarTemplate();
      const regrasLocal = carregarRegras();
      const minutaLocal = carregarMinutaContrato();

      try {
        const escritorioAtual = getEscritorioAtivoId();
        if (!escritorioAtual) return;

        const { data, error } = await supabase
          .from(CONFIGURACOES_TABLE)
          .select("chave,dados")
          .eq("escritorio_id", escritorioAtual)
          .in("chave", [TEMPLATE_BANCO_KEY, REGRAS_BANCO_KEY, FRENTES_BANCO_KEY, MINUTA_BANCO_KEY]);

        if (error) throw error;
        if (!ativo) return;

        const registros = Array.isArray(data) ? data : [];
        const templateBanco = registros.find(
          (item) => item.chave === TEMPLATE_BANCO_KEY
        );
        const regrasBanco = registros.find(
          (item) => item.chave === REGRAS_BANCO_KEY
        );
        const frentesBanco = registros.find(
          (item) => item.chave === FRENTES_BANCO_KEY
        );
        const minutaBanco = registros.find(
          (item) => item.chave === MINUTA_BANCO_KEY
        );

        // Migração automática: se ainda não existir no banco, preserva exatamente
        // o template e as regras que já estavam configurados neste navegador.
        const faltantes = [];

        if (!templateBanco) {
          faltantes.push({
            escritorio_id: escritorioAtual,
            chave: TEMPLATE_BANCO_KEY,
            dados: templateLocal,
            updated_at: new Date().toISOString(),
          });
        }

        if (!regrasBanco) {
          faltantes.push({
            escritorio_id: escritorioAtual,
            chave: REGRAS_BANCO_KEY,
            dados: regrasLocal,
            updated_at: new Date().toISOString(),
          });
        }

        if (!frentesBanco) {
          faltantes.push({
            escritorio_id: escritorioAtual,
            chave: FRENTES_BANCO_KEY,
            dados: carregarFrentesNegocio(),
            updated_at: new Date().toISOString(),
          });
        }

        if (!minutaBanco) {
          faltantes.push({
            escritorio_id: escritorioAtual,
            chave: MINUTA_BANCO_KEY,
            dados: minutaLocal,
            updated_at: new Date().toISOString(),
          });
        }

        if (faltantes.length) {
          const { error: migrationError } = await supabase
            .from(CONFIGURACOES_TABLE)
            .upsert(faltantes, { onConflict: "escritorio_id,chave" });

          if (migrationError) throw migrationError;
        }

        const templateFinal = templateBanco
          ? configuracaoDoBanco(templateBanco, TEMPLATE_PADRAO)
          : templateLocal;

        const regrasBrutas = regrasBanco
          ? configuracaoDoBanco(regrasBanco, REGRAS_PADRAO)
          : regrasLocal;

        const regrasFinal = {
          ...REGRAS_PADRAO,
          ...regrasBrutas,
          desconto: {
            ...REGRAS_PADRAO.desconto,
            ...(regrasBrutas?.desconto || {}),
          },
          permissoes: {
            ...REGRAS_PADRAO.permissoes,
            ...(regrasBrutas?.permissoes || {}),
          },
          protecoes: {
            ...REGRAS_PADRAO.protecoes,
            ...(regrasBrutas?.protecoes || {}),
          },
        };

        setTemplate({
          ...TEMPLATE_PADRAO,
          ...templateFinal,
          secoes:
            Array.isArray(templateFinal?.secoes) && templateFinal.secoes.length
              ? templateFinal.secoes
              : TEMPLATE_PADRAO.secoes,
        });
        setRegras(regrasFinal);

        const frentesFinal =
          frentesBanco && Array.isArray(frentesBanco.dados)
            ? frentesBanco.dados
            : carregarFrentesNegocio();
        setFrentesNegocio(frentesFinal);

        const minutaFinal = minutaBanco
          ? configuracaoDoBanco(minutaBanco, MINUTA_PADRAO)
          : minutaLocal;
        setMinutaContrato({ ...MINUTA_PADRAO, ...minutaFinal });

        localStorage.setItem(
          scopedStorageKey(MINUTA_CONTRATO_KEY, escritorioAtual),
          JSON.stringify({ ...MINUTA_PADRAO, ...minutaFinal })
        );

        localStorage.setItem(
          scopedStorageKey(FRENTES_NEGOCIO_KEY, escritorioAtual),
          JSON.stringify(frentesFinal)
        );

        localStorage.setItem(
          scopedStorageKey(TEMPLATE_PROPOSTA_KEY, escritorioAtual),
          JSON.stringify(templateFinal)
        );
        localStorage.setItem(
          scopedStorageKey(REGRAS_COMERCIAIS_KEY, escritorioAtual),
          JSON.stringify(regrasFinal)
        );
      } catch (error) {
        console.error(
          "Configurações: falha ao sincronizar com Supabase.",
          error
        );
        // Sem rede, permanece funcionando com o localStorage já carregado.
      }
    };

    let idleId = null;
    let timerId = null;

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(carregarConfiguracoes, { timeout: 700 });
    } else {
      timerId = window.setTimeout(carregarConfiguracoes, 120);
    }

    return () => {
      ativo = false;
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, []);

  const carregarUsuariosEConvites = async () => {
    setCarregandoUsuarios(true);
    setErroUsuarios("");

    try {
      const escritorioAtual = getEscritorioAtivoId();
      if (!escritorioAtual) {
        throw new Error("Nenhum escritório ativo selecionado.");
      }

      const { data: sessionData, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error("Usuário não autenticado.");

      setEscritorioId(escritorioAtual);
      setUsuarioAtualId(userId);

      const { data: vinculo, error: perfilError } = await supabase
        .from("usuarios_escritorios")
        .select("perfil")
        .eq("user_id", userId)
        .eq("escritorio_id", escritorioAtual)
        .eq("ativo", true)
        .maybeSingle();

      if (perfilError) throw perfilError;
      const perfil = vinculo?.perfil || "usuario";
      setPerfilAtual(perfil);
      localStorage.setItem(cachePerfilKey(escritorioAtual), perfil);

      const { data: membros, error: membrosError } = await supabase
        .from("usuarios_escritorios")
        .select("id,user_id,escritorio_id,nome,email,cargo,perfil,perfil_acesso_id,ativo,created_at,updated_at")
        .eq("escritorio_id", escritorioAtual)
        .order("created_at", { ascending: true });

      if (membrosError) throw membrosError;
      const membrosFinais = Array.isArray(membros) ? membros : [];
      setUsuariosEscritorio(membrosFinais);
      localStorage.setItem(
        cacheUsuariosKey(escritorioAtual),
        JSON.stringify(membrosFinais)
      );

      if (perfil === "admin") {
        const { data: convites, error: convitesError } = await supabase
          .from("convites_escritorio")
          .select(
            "id,escritorio_id,email,nome,cargo,perfil,token,status,expira_em,created_at,updated_at"
          )
          .eq("escritorio_id", escritorioAtual)
          .order("created_at", { ascending: false });

        if (convitesError) throw convitesError;
        const convitesFinais = Array.isArray(convites) ? convites : [];
        setConvitesEscritorio(convitesFinais);
        localStorage.setItem(
          cacheConvitesKey(escritorioAtual),
          JSON.stringify(convitesFinais)
        );
      } else {
        setConvitesEscritorio([]);
        localStorage.setItem(cacheConvitesKey(escritorioAtual), "[]");
      }
    } catch (error) {
      console.error("Erro ao carregar usuários e convites:", error);
      setErroUsuarios(
        error?.message || "Não foi possível carregar os usuários do escritório."
      );
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  const carregarPerfisEModulos = async () => {
    const escritorioAtual = getEscritorioAtivoId();
    if (!escritorioAtual) return;

    setCarregandoPerfis(true);
    setErroUsuarios("");

    try {
      const { data: escritorio, error: escritorioError } = await supabase
        .from("escritorios")
        .select("id,plano_saas_id")
        .eq("id", escritorioAtual)
        .maybeSingle();

      if (escritorioError) throw escritorioError;
      if (!escritorio) throw new Error("Escritório não encontrado.");

      const [
        { data: perfis, error: perfisError },
        { data: modulos, error: modulosError },
        { data: modulosPlano, error: planoError },
        { data: modulosAvulsos, error: avulsosError },
      ] = await Promise.all([
        supabase
          .from("perfis_acesso")
          .select("id,escritorio_id,nome,descricao,perfil_sistema,ativo,created_at,updated_at")
          .eq("escritorio_id", escritorioAtual)
          .eq("ativo", true)
          .order("perfil_sistema", { ascending: false })
          .order("nome", { ascending: true }),
        supabase
          .from("modulos_saas")
          .select("id,codigo,nome,descricao,ordem,ativo")
          .eq("ativo", true)
          .order("ordem", { ascending: true }),
        escritorio.plano_saas_id
          ? supabase
              .from("plano_modulos")
              .select("modulo_id,incluido")
              .eq("plano_id", escritorio.plano_saas_id)
              .eq("incluido", true)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("escritorio_modulos")
          .select("modulo_id,ativo,cancelado_em")
          .eq("escritorio_id", escritorioAtual)
          .eq("ativo", true)
          .is("cancelado_em", null),
      ]);

      if (perfisError) throw perfisError;
      if (modulosError) throw modulosError;
      if (planoError) throw planoError;
      if (avulsosError) throw avulsosError;

      const idsPermitidos = new Set([
        ...(modulosPlano || []).map((item) => item.modulo_id),
        ...(modulosAvulsos || []).map((item) => item.modulo_id),
      ]);

      const listaModulos = (modulos || []).filter((item) => idsPermitidos.has(item.id));
      const listaPerfis = Array.isArray(perfis) ? perfis : [];

      setPerfisAcesso(listaPerfis);
      setModulosPermitidos(listaModulos);

      const selecionadoAtual =
        perfilSelecionadoId && listaPerfis.some((p) => p.id === perfilSelecionadoId)
          ? perfilSelecionadoId
          : listaPerfis.find((p) => p.nome === "Administrador")?.id ||
            listaPerfis[0]?.id ||
            "";

      setPerfilSelecionadoId(selecionadoAtual);

      if (selecionadoAtual) {
        const { data: permissoes, error: permissoesError } = await supabase
          .from("perfil_modulos")
          .select("id,perfil_acesso_id,modulo_id,pode_visualizar,pode_criar,pode_editar,pode_excluir")
          .eq("perfil_acesso_id", selecionadoAtual);

        if (permissoesError) throw permissoesError;

        const mapa = {};
        (permissoes || []).forEach((item) => {
          mapa[item.modulo_id] = {
            pode_visualizar: item.pode_visualizar === true,
            pode_criar: item.pode_criar === true,
            pode_editar: item.pode_editar === true,
            pode_excluir: item.pode_excluir === true,
          };
        });
        setPermissoesPerfil(mapa);
      } else {
        setPermissoesPerfil({});
      }
    } catch (error) {
      console.error("Erro ao carregar perfis e módulos:", error);
      setErroUsuarios(
        error?.message || "Não foi possível carregar os perfis e permissões."
      );
    } finally {
      setCarregandoPerfis(false);
    }
  };

  const selecionarPerfilAcesso = async (perfilId) => {
    setPerfilSelecionadoId(perfilId);
    setCarregandoPerfis(true);
    setErroUsuarios("");

    try {
      const { data, error } = await supabase
        .from("perfil_modulos")
        .select("id,perfil_acesso_id,modulo_id,pode_visualizar,pode_criar,pode_editar,pode_excluir")
        .eq("perfil_acesso_id", perfilId);

      if (error) throw error;

      const mapa = {};
      (data || []).forEach((item) => {
        mapa[item.modulo_id] = {
          pode_visualizar: item.pode_visualizar === true,
          pode_criar: item.pode_criar === true,
          pode_editar: item.pode_editar === true,
          pode_excluir: item.pode_excluir === true,
        };
      });
      setPermissoesPerfil(mapa);
    } catch (error) {
      console.error("Erro ao carregar permissões do perfil:", error);
      setErroUsuarios(error?.message || "Não foi possível carregar as permissões.");
    } finally {
      setCarregandoPerfis(false);
    }
  };

  const alterarPermissaoModulo = (moduloId, campo, valor) => {
    const perfilSelecionado = perfisAcesso.find((p) => p.id === perfilSelecionadoId);
    if (perfilSelecionado?.nome === "Administrador") return;

    setPermissoesPerfil((anterior) => {
      const atual = anterior[moduloId] || {
        pode_visualizar: false,
        pode_criar: false,
        pode_editar: false,
        pode_excluir: false,
      };

      const proximo = { ...atual, [campo]: valor };

      if (campo === "pode_visualizar" && !valor) {
        proximo.pode_criar = false;
        proximo.pode_editar = false;
        proximo.pode_excluir = false;
      }

      if (campo !== "pode_visualizar" && valor) {
        proximo.pode_visualizar = true;
      }

      return { ...anterior, [moduloId]: proximo };
    });
  };

  const salvarPermissoesPerfil = async () => {
    if (perfilAtual !== "admin" || !perfilSelecionadoId) return;

    const perfilSelecionado = perfisAcesso.find((p) => p.id === perfilSelecionadoId);
    if (perfilSelecionado?.nome === "Administrador") {
      alert("O perfil Administrador possui acesso total aos módulos contratados.");
      return;
    }

    setSalvandoPerfil(true);
    setErroUsuarios("");

    try {
      const idsPermitidos = modulosPermitidos.map((m) => m.id);

      const { error: deleteError } = await supabase
        .from("perfil_modulos")
        .delete()
        .eq("perfil_acesso_id", perfilSelecionadoId);

      if (deleteError) throw deleteError;

      const linhas = idsPermitidos
        .map((moduloId) => {
          const p = permissoesPerfil[moduloId] || {};
          if (!p.pode_visualizar && !p.pode_criar && !p.pode_editar && !p.pode_excluir) {
            return null;
          }

          return {
            perfil_acesso_id: perfilSelecionadoId,
            modulo_id: moduloId,
            pode_visualizar: p.pode_visualizar === true,
            pode_criar: p.pode_criar === true,
            pode_editar: p.pode_editar === true,
            pode_excluir: p.pode_excluir === true,
            updated_at: new Date().toISOString(),
          };
        })
        .filter(Boolean);

      if (linhas.length) {
        const { error: insertError } = await supabase
          .from("perfil_modulos")
          .insert(linhas);

        if (insertError) throw insertError;
      }

      alert("Permissões do perfil salvas com sucesso.");
      await selecionarPerfilAcesso(perfilSelecionadoId);
    } catch (error) {
      console.error("Erro ao salvar permissões do perfil:", error);
      setErroUsuarios(
        error?.message || "Não foi possível salvar as permissões do perfil."
      );
    } finally {
      setSalvandoPerfil(false);
    }
  };

  useEffect(() => {
    if (aba === "permissoes") {
      const escritorioAtual = getEscritorioAtivoId();
      const usuariosCache = lerArrayCache(cacheUsuariosKey(escritorioAtual));
      const convitesCache = lerArrayCache(cacheConvitesKey(escritorioAtual));

      if (usuariosCache.length) setUsuariosEscritorio(usuariosCache);
      if (convitesCache.length) setConvitesEscritorio(convitesCache);

      const timer = window.setTimeout(() => {
        carregarUsuariosEConvites();
        carregarPerfisEModulos();
      }, 60);

      return () => window.clearTimeout(timer);
    }
  }, [aba]);

  const criarConvite = async () => {
    if (perfilAtual !== "admin") {
      alert("Somente administradores podem convidar usuários.");
      return;
    }

    const email = novoConvite.email.trim().toLowerCase();
    if (!email) {
      alert("Informe o e-mail do usuário.");
      return;
    }

    const nome = novoConvite.nome.trim() || null;
    const cargo = novoConvite.cargo.trim() || null;
    const perfil = novoConvite.perfil;

    setSalvandoConvite(true);
    setErroUsuarios("");
    setConviteCriado(null);

    try {
      // 1. Cria o convite diretamente no escritório atualmente selecionado.
      if (!escritorioId) {
        throw new Error("Nenhum escritório ativo selecionado.");
      }

      const token = crypto.randomUUID();
      const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("convites_escritorio")
        .insert({
          escritorio_id: escritorioId,
          email,
          nome,
          cargo,
          perfil,
          token,
          status: "pendente",
          expira_em: expiraEm,
          updated_at: new Date().toISOString(),
        })
        .select("id,escritorio_id,email,nome,cargo,perfil,token,status,expira_em,created_at,updated_at")
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/?convite=${encodeURIComponent(token)}`;

      // 2. Chama a Edge Function segura. Ela usa o Supabase Auth no servidor
      // para criar/convidar o usuário e disparar o e-mail de acesso.
      const { data: envioData, error: envioError } =
        await supabase.functions.invoke("enviar-convite-usuario", {
          body: {
            email,
            nome,
            cargo,
            perfil,
            token,
            convite_id: data?.id || null,
            escritorio_id: data?.escritorio_id || escritorioId || null,
            redirect_to: link,
            link_convite: link,
          },
        });

      if (envioError) {
        throw new Error(
          envioError?.message || "O convite foi criado, mas o e-mail não pôde ser enviado."
        );
      }

      if (envioData?.error) {
        throw new Error(envioData.error);
      }

      setConviteCriado({
        ...data,
        link,
        email,
        emailEnviado: true,
        envio: envioData || null,
      });

      setNovoConvite({
        nome: "",
        email: "",
        cargo: "",
        perfil: "usuario",
      });

      await carregarUsuariosEConvites();
    } catch (error) {
      console.error("Erro ao criar/enviar convite:", error);
      setErroUsuarios(
        error?.message || "Não foi possível criar e enviar o convite."
      );
    } finally {
      setSalvandoConvite(false);
    }
  };

  const copiarLinkConvite = async (convite) => {
    const token = convite?.token;
    if (!token) return;

    const link = `${window.location.origin}/?convite=${encodeURIComponent(token)}`;

    try {
      await navigator.clipboard.writeText(link);
      alert("Link do convite copiado.");
    } catch {
      window.prompt("Copie o link do convite:", link);
    }
  };

  const cancelarConvite = async (convite) => {
    if (perfilAtual !== "admin" || !convite?.id) return;

    const confirmar = window.confirm(
      `Cancelar o convite enviado para ${convite.email}?`
    );
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("convites_escritorio")
        .update({ status: "cancelado", updated_at: new Date().toISOString() })
        .eq("id", convite.id)
        .eq("escritorio_id", escritorioId);

      if (error) throw error;
      await carregarUsuariosEConvites();
    } catch (error) {
      console.error("Erro ao cancelar convite:", error);
      alert(error?.message || "Não foi possível cancelar o convite.");
    }
  };

  const excluirConvite = async (convite) => {
    if (perfilAtual !== "admin" || !convite?.id) return;

    const confirmar = window.confirm(
      `Excluir definitivamente o convite de ${convite.email}?`
    );
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("convites_escritorio")
        .delete()
        .eq("id", convite.id)
        .eq("escritorio_id", escritorioId);

      if (error) throw error;

      setConvitesEscritorio((lista) =>
        lista.filter((item) => item.id !== convite.id)
      );
    } catch (error) {
      console.error("Erro ao excluir convite:", error);
      alert(error?.message || "Não foi possível excluir o convite.");
    }
  };

  const limparConvites = async () => {
    if (perfilAtual !== "admin" || !escritorioId || !convitesEscritorio.length) return;

    const confirmar = window.confirm(
      `Excluir todos os ${convitesEscritorio.length} convites desta lista?\n\nEssa ação remove o histórico de convites da empresa.`
    );
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("convites_escritorio")
        .delete()
        .eq("escritorio_id", escritorioId);

      if (error) throw error;

      setConvitesEscritorio([]);
      localStorage.setItem(cacheConvitesKey(escritorioId), "[]");
    } catch (error) {
      console.error("Erro ao limpar convites:", error);
      alert(error?.message || "Não foi possível limpar a lista de convites.");
    }
  };

  const atualizarUsuarioEscritorio = async (usuario, alteracoes) => {
    if (perfilAtual !== "admin" || !usuario?.id) return;

    const proximo = { ...usuario, ...alteracoes };
    setUsuariosEscritorio((lista) =>
      lista.map((item) => (item.id === usuario.id ? proximo : item))
    );

    try {
      const perfilAcessoEscolhido = perfisAcesso.find(
        (item) => item.id === proximo.perfil_acesso_id
      );

      const perfilLegado =
        perfilAcessoEscolhido?.nome === "Administrador"
          ? "admin"
          : perfilAcessoEscolhido?.nome === "Gestor"
          ? "gestor"
          : perfilAcessoEscolhido?.nome === "Comercial"
          ? "comercial"
          : proximo.perfil || "usuario";

      const { error } = await supabase
        .from("usuarios_escritorios")
        .update({
          nome: proximo.nome || null,
          cargo: proximo.cargo || null,
          perfil: perfilLegado,
          perfil_acesso_id: proximo.perfil_acesso_id || null,
          ativo: proximo.ativo !== false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", usuario.id)
        .eq("escritorio_id", escritorioId);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      setUsuariosEscritorio((lista) =>
        lista.map((item) => (item.id === usuario.id ? usuario : item))
      );
      alert(error?.message || "Não foi possível atualizar o usuário.");
    }
  };

  const excluirUsuarioEscritorio = async (usuario) => {
    if (perfilAtual !== "admin" || !usuario?.id) return;

    if (usuario.user_id === usuarioAtualId) {
      alert("Você não pode excluir o seu próprio usuário do escritório.");
      return;
    }

    const confirmar = window.confirm(
      `Excluir ${usuario.nome || "este usuário"} do escritório?\n\nO acesso deste usuário ao escritório será removido. Os dados históricos da operação serão preservados.`
    );

    if (!confirmar) return;

    const listaAnterior = usuariosEscritorio;
    setUsuariosEscritorio((lista) =>
      lista.filter((item) => item.id !== usuario.id)
    );

    try {
      const { error } = await supabase
        .from("usuarios_escritorios")
        .delete()
        .eq("id", usuario.id)
        .eq("escritorio_id", escritorioId);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      setUsuariosEscritorio(listaAnterior);
      alert(error?.message || "Não foi possível excluir o usuário.");
    }
  };

  const atualizarTemplate = (campo, valor) => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) return;
    setTemplate((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    setSalvoTemplate(false);
  };

  const atualizarDesconto = (campo, valor) => {
    setRegras((anterior) => ({
      ...anterior,
      desconto: {
        ...anterior.desconto,
        [campo]: valor,
      },
    }));

    setSalvoRegras(false);
  };

  const atualizarPermissao = (campo, valor) => {
    setRegras((anterior) => ({
      ...anterior,
      permissoes: {
        ...anterior.permissoes,
        [campo]: valor,
      },
    }));

    setSalvoRegras(false);
  };

  const atualizarProtecao = (campo, valor) => {
    setRegras((anterior) => ({
      ...anterior,
      protecoes: {
        ...anterior.protecoes,
        [campo]: valor,
      },
    }));

    setSalvoRegras(false);
  };

  const carregarImagem = async (arquivo, campo) => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) return;
    if (!arquivo) return;

    setErroImagem("");

    const tipo = campo === "logo" ? "logo" : "capa";

    try {
      const analise = await analisarImagem(arquivo, tipo);

      if (tipo === "logo") {
        setInfoLogo(analise);
      } else {
        setInfoCapa(analise);
      }

      if (!analise.valido) {
        if (campo === "logo" && logoInputRef.current) {
          logoInputRef.current.value = "";
        }

        if (campo === "capaImagem" && capaInputRef.current) {
          capaInputRef.current.value = "";
        }

        return;
      }

      atualizarTemplate(campo, analise.dataUrl);
    } catch (error) {
      console.error("Erro ao analisar imagem:", error);

      setErroImagem(
        error?.message || "Não foi possível analisar a imagem selecionada."
      );
    }
  };

  const removerImagem = (campo) => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) return;
    atualizarTemplate(campo, "");

    if (campo === "logo") {
      setInfoLogo(null);

      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }

    if (campo === "capaImagem") {
      setInfoCapa(null);

      if (capaInputRef.current) {
        capaInputRef.current.value = "";
      }
    }
  };

  const salvarTemplate = async () => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) {
      alert("Seu perfil possui acesso somente para consulta do template.");
      return;
    }
    try {
      if (infoLogo?.erros?.length) {
        alert(
          `Não foi possível salvar o logo.\n\n${infoLogo.erros.join("\n")}`
        );
        return;
      }

      if (infoCapa?.erros?.length) {
        alert(
          `Não foi possível salvar a capa.\n\n${infoCapa.erros.join("\n")}`
        );
        return;
      }

      if (templateFrenteId) {
        const agora = new Date().toISOString();
        const frentesAtualizadas = frentesNegocio.map((frente) =>
          String(frente.id) === String(templateFrenteId)
            ? {
                ...frente,
                template: {
                  ...TEMPLATE_PADRAO,
                  ...template,
                  secoes:
                    Array.isArray(template?.secoes) && template.secoes.length
                      ? template.secoes
                      : TEMPLATE_PADRAO.secoes,
                },
                atualizadoEm: agora,
              }
            : frente
        );

        localStorage.setItem(
          scopedStorageKey(FRENTES_NEGOCIO_KEY, escritorioId),
          JSON.stringify(frentesAtualizadas)
        );

        const { error } = await supabase
          .from(CONFIGURACOES_TABLE)
          .upsert(
            {
              escritorio_id: escritorioId,
              chave: FRENTES_BANCO_KEY,
              dados: frentesAtualizadas,
              updated_at: agora,
            },
            { onConflict: "escritorio_id,chave" }
          );

        if (error) throw error;

        setFrentesNegocio(frentesAtualizadas);
        setSalvoFrentes(true);
        window.setTimeout(() => setSalvoFrentes(false), 3500);
      } else {
        // Cache local imediato para manter a mesma experiência rápida já validada.
        localStorage.setItem(
          scopedStorageKey(TEMPLATE_PROPOSTA_KEY, escritorioId),
          JSON.stringify(template)
        );

        const { error } = await supabase
          .from(CONFIGURACOES_TABLE)
          .upsert(
            {
              escritorio_id: escritorioId,
              chave: TEMPLATE_BANCO_KEY,
              dados: template,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "escritorio_id,chave" }
          );

        if (error) throw error;
      }

      setSalvoTemplate(true);

      window.setTimeout(() => {
        setSalvoTemplate(false);
      }, 3500);
    } catch (error) {
      console.error("Erro ao salvar template:", error);

      if (
        error?.name === "QuotaExceededError" ||
        error?.code === 22 ||
        error?.code === 1014
      ) {
        const logoPeso = infoLogo?.tamanhoFormatado || "não identificado";
        const capaPeso = infoCapa?.tamanhoFormatado || "não identificado";

        alert(
          `O navegador não possui espaço local suficiente para salvar o template.\n\nLogo: ${logoPeso}\nCapa: ${capaPeso}\n\nAs dimensões em pixels podem estar corretas, mas o peso total das imagens ultrapassou o espaço disponível no armazenamento local.\n\nTente utilizar imagens mais leves em JPG, PNG otimizado ou WEBP.`
        );

        return;
      }

      alert(
        `Não foi possível salvar o template.\n\nMotivo: ${
          error?.message || "erro não identificado"
        }`
      );
    }
  };

  const configurarTemplateFrente = (frente) => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) return;
    if (!frente?.id) return;

    templatePadraoAntesFrenteRef.current = template;

    const templateBase =
      frente.template && typeof frente.template === "object"
        ? frente.template
        : template;

    setTemplate({
      ...TEMPLATE_PADRAO,
      ...templateBase,
      secoes:
        Array.isArray(templateBase?.secoes) && templateBase.secoes.length
          ? templateBase.secoes
          : TEMPLATE_PADRAO.secoes,
    });

    setTemplateFrenteId(frente.id);
    setInfoLogo(null);
    setInfoCapa(null);
    setErroImagem("");
    setSalvoTemplate(false);
    setAba("template");
  };

  const abrirTemplatePadrao = () => {
    if (templateFrenteId) {
      const templatePadraoAnterior = templatePadraoAntesFrenteRef.current;
      if (templatePadraoAnterior) {
        setTemplate(templatePadraoAnterior);
      } else {
        setTemplate(carregarTemplate());
      }
      templatePadraoAntesFrenteRef.current = null;
      setTemplateFrenteId(null);
      setInfoLogo(null);
      setInfoCapa(null);
      setErroImagem("");
      setSalvoTemplate(false);
    }

    setAba("template");
  };

  const voltarParaFrentes = () => {
    if (templateFrenteId) {
      const templatePadraoAnterior = templatePadraoAntesFrenteRef.current;
      if (templatePadraoAnterior) {
        setTemplate(templatePadraoAnterior);
      } else {
        setTemplate(carregarTemplate());
      }
      templatePadraoAntesFrenteRef.current = null;
      setTemplateFrenteId(null);
      setInfoLogo(null);
      setInfoCapa(null);
      setErroImagem("");
      setSalvoTemplate(false);
    }

    setAba("frentes");
  };

  const novaFrenteNegocio = () => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) return;
    setFrenteEditandoId("nova");
    setFrenteDraft({ nome: "", descricao: "", ativo: true });
  };

  const editarFrenteNegocio = (frente) => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) return;
    setFrenteEditandoId(frente.id);
    setFrenteDraft({
      nome: frente.nome || "",
      descricao: frente.descricao || "",
      ativo: frente.ativo !== false,
    });
  };

  const confirmarFrenteNegocio = () => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) return;
    const nome = String(frenteDraft.nome || "").trim();
    if (!nome) {
      alert("Informe o nome da frente de negócio.");
      return;
    }

    const agora = new Date().toISOString();
    if (frenteEditandoId === "nova") {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `frente-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setFrentesNegocio((anterior) => [
        ...anterior,
        {
          id,
          nome,
          descricao: String(frenteDraft.descricao || "").trim(),
          ativo: frenteDraft.ativo !== false,
          template: null,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      ]);
    } else {
      setFrentesNegocio((anterior) =>
        anterior.map((frente) =>
          String(frente.id) === String(frenteEditandoId)
            ? {
                ...frente,
                nome,
                descricao: String(frenteDraft.descricao || "").trim(),
                ativo: frenteDraft.ativo !== false,
                atualizadoEm: agora,
              }
            : frente
        )
      );
    }

    setFrenteEditandoId(null);
    setFrenteDraft({ nome: "", descricao: "", ativo: true });
    setSalvoFrentes(false);
  };

  const duplicarFrenteNegocio = (frente) => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) return;
    const agora = new Date().toISOString();
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `frente-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setFrentesNegocio((anterior) => [
      ...anterior,
      {
        ...frente,
        id,
        nome: `${frente.nome} - Cópia`,
        criadoEm: agora,
        atualizadoEm: agora,
      },
    ]);
    setSalvoFrentes(false);
  };

  const alternarFrenteNegocio = (id) => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) return;
    setFrentesNegocio((anterior) =>
      anterior.map((frente) =>
        String(frente.id) === String(id)
          ? { ...frente, ativo: frente.ativo === false, atualizadoEm: new Date().toISOString() }
          : frente
      )
    );
    setSalvoFrentes(false);
  };

  const salvarFrentesNegocio = async () => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) {
      alert("Seu perfil possui acesso somente para consulta das frentes de negócio.");
      return;
    }

    try {
      localStorage.setItem(
        scopedStorageKey(FRENTES_NEGOCIO_KEY, escritorioId),
        JSON.stringify(frentesNegocio)
      );

      const { error } = await supabase
        .from(CONFIGURACOES_TABLE)
        .upsert(
          {
            escritorio_id: escritorioId,
            chave: FRENTES_BANCO_KEY,
            dados: frentesNegocio,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "escritorio_id,chave" }
        );

      if (error) throw error;

      setSalvoFrentes(true);
      window.setTimeout(() => setSalvoFrentes(false), 3500);
    } catch (error) {
      console.error("Erro ao salvar frentes de negócio:", error);
      alert(
        `Não foi possível salvar as frentes de negócio.\n\nMotivo: ${
          error?.message || "erro não identificado"
        }`
      );
    }
  };

  const atualizarMinutaContrato = (campo, valor) => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) return;
    setMinutaContrato((anterior) => ({ ...anterior, [campo]: valor }));
    setSalvoMinuta(false);
  };

  const inserirVariavelMinuta = (variavel) => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) return;
    setMinutaContrato((anterior) => ({
      ...anterior,
      conteudo: `${anterior.conteudo || ""}${anterior.conteudo ? " " : ""}${variavel}`,
    }));
    setSalvoMinuta(false);
  };

  const salvarMinutaContrato = async () => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) {
      alert("Seu perfil possui acesso somente para consulta da minuta.");
      return;
    }

    try {
      const payload = {
        ...MINUTA_PADRAO,
        ...minutaContrato,
        atualizadoEm: new Date().toISOString(),
      };

      localStorage.setItem(
        scopedStorageKey(MINUTA_CONTRATO_KEY, escritorioId),
        JSON.stringify(payload)
      );

      const { error } = await supabase
        .from(CONFIGURACOES_TABLE)
        .upsert(
          {
            escritorio_id: escritorioId,
            chave: MINUTA_BANCO_KEY,
            dados: payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "escritorio_id,chave" }
        );

      if (error) throw error;

      setMinutaContrato(payload);
      setSalvoMinuta(true);
      window.setTimeout(() => setSalvoMinuta(false), 3500);
    } catch (error) {
      console.error("Erro ao salvar minuta de contrato:", error);
      alert(
        `Não foi possível salvar a minuta de contrato.\n\nMotivo: ${
          error?.message || "erro não identificado"
        }`
      );
    }
  };

  const salvarRegras = async () => {
    if (!(perfilAtual === "admin" || perfilAtual === "gestor")) {
      alert("Seu perfil não possui permissão para alterar regras comerciais.");
      return;
    }
    try {
      const payload = {
        ...regras,
        atualizadoEm: new Date().toISOString(),
      };

      // Mantém o cache local para os demais módulos que já consomem estas regras.
      localStorage.setItem(
        scopedStorageKey(REGRAS_COMERCIAIS_KEY, escritorioId),
        JSON.stringify(payload)
      );

      const { error } = await supabase
        .from(CONFIGURACOES_TABLE)
        .upsert(
          {
            escritorio_id: escritorioId,
            chave: REGRAS_BANCO_KEY,
            dados: payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "escritorio_id,chave" }
        );

      if (error) throw error;

      setRegras(payload);
      setSalvoRegras(true);

      window.setTimeout(() => {
        setSalvoRegras(false);
      }, 3500);
    } catch (error) {
      console.error("Erro ao salvar regras:", error);

      alert(
        `Não foi possível salvar as regras comerciais.\n\nMotivo: ${
          error?.message || "erro não identificado"
        }`
      );
    }
  };

  const ehAdmin = perfilAtual === "admin";
  const ehGestor = perfilAtual === "gestor";
  const podeEditarTemplate = ehAdmin || ehGestor;
  const podeAcessarRegras = ehAdmin || ehGestor;
  const podeAcessarPermissoes = ehAdmin;

  useEffect(() => {
    if (aba === "frentes" && !podeEditarTemplate) setAba("template");
    if (aba === "minuta" && !podeEditarTemplate) setAba("template");
    if (aba === "regras" && !podeAcessarRegras) setAba("template");
    if (aba === "permissoes" && !podeAcessarPermissoes) setAba("template");
  }, [aba, podeAcessarRegras, podeAcessarPermissoes]);

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

  return (
    <div className="precificacont-configuracoes min-h-screen bg-slate-50 p-8">
      <style>{CONFIGURACOES_DARK_CSS}</style>
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Settings size={17} />
            ADMINISTRAÇÃO
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Configurações
          </h1>

          <p className="mt-2 max-w-3xl text-slate-500">
            Defina o padrão das propostas e as regras comerciais utilizadas
            pela operação.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={abrirTemplatePadrao}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              aba === "template"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText size={17} />
            Template de propostas
          </button>

          {podeEditarTemplate && (
            <button
              type="button"
              onClick={voltarParaFrentes}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                aba === "frentes"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <BriefcaseBusiness size={17} />
              Frentes de negócio
            </button>
          )}

          {podeEditarTemplate && (
            <button
              type="button"
              onClick={() => setAba("minuta")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                aba === "minuta"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileText size={17} />
              Minuta de contrato
            </button>
          )}

          {podeAcessarRegras && (
            <button
              type="button"
              onClick={() => setAba("regras")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                aba === "regras"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Percent size={17} />
              Regras comerciais
            </button>
          )}

          {podeAcessarPermissoes && (
            <button
              type="button"
              onClick={() => setAba("permissoes")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                aba === "permissoes"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShieldCheck size={17} />
              Permissões
            </button>
          )}
        </div>

        {aba === "template" && (
          <div className="space-y-6">
            {templateFrenteId && (
              <div className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-blue-700">
                    Template específico da frente
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Você está configurando o template de{" "}
                    <strong>
                      {frentesNegocio.find(
                        (frente) => String(frente.id) === String(templateFrenteId)
                      )?.nome || "Frente de negócio"}
                    </strong>.
                    {" "}O template padrão do escritório permanece preservado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={voltarParaFrentes}
                  className="shrink-0 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50"
                >
                  Voltar para frentes
                </button>
              </div>
            )}

            {!podeEditarTemplate && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="flex gap-3">
                  <LockKeyhole className="mt-0.5 shrink-0 text-amber-600" size={20} />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Template disponível somente para consulta
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Seu perfil pode visualizar o padrão das propostas, mas somente
                      Administradores e Gestores podem alterá-lo.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
              <div className="flex gap-3">
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-blue-600"
                  size={20}
                />

                <div>
                  <p className="font-semibold text-slate-900">
                    Template padrão das novas propostas
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    As novas propostas utilizarão uma cópia deste template.
                    Alterações feitas aqui posteriormente não modificam
                    propostas que já foram criadas.
                  </p>
                </div>
              </div>
            </div>

            {erroImagem && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex gap-2">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="text-sm font-bold text-red-700">
                      Não foi possível carregar a imagem
                    </p>

                    <p className="mt-1 text-sm text-red-600">
                      {erroImagem}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Card>
              <TituloCard
                icone={Building2}
                titulo="Identidade da proposta"
                descricao="Defina a identidade visual utilizada automaticamente nas novas propostas."
              />

              <div className="grid gap-6 p-6 lg:grid-cols-2">
                <div>
                  <label className={labelClass}>Logo do escritório</label>

                  <p className="mb-3 text-xs leading-5 text-slate-500">
                    PNG, JPG ou WEBP. Não há dimensão mínima obrigatória. Para
                    melhor nitidez, recomendamos{" "}
                    <strong>pelo menos 500 px de largura</strong>.
                  </p>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      carregarImagem(e.target.files?.[0], "logo")
                    }
                  />

                  <div className="flex min-h-[150px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                    {template.logo ? (
                      <div className="w-full text-center">
                        <img
                          src={template.logo}
                          alt="Logo"
                          className="mx-auto max-h-20 max-w-[240px] object-contain"
                        />

                        <div className="mt-4 flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Alterar
                          </button>

                          <button
                            type="button"
                            onClick={() => removerImagem("logo")}
                            className="flex items-center gap-1 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={13} />
                            Remover
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="text-center"
                      >
                        <Upload
                          className="mx-auto text-slate-400"
                          size={28}
                        />

                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          Enviar logo
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          PNG, JPG ou WEBP
                        </p>
                      </button>
                    )}
                  </div>

                  <StatusImagem info={infoLogo} tipo="logo" />
                </div>

                <div>
                  <label className={labelClass}>
                    Capa oficial da proposta
                  </label>

                  <p className="mb-3 text-xs leading-5 text-slate-500">
                    Use uma imagem em <strong>proporção A4 vertical</strong>.{" "}
                    <strong>1024 × 1448px</strong> é aceita normalmente.{" "}
                    <strong>
                      {CAPA_RECOMENDADA.largura} ×{" "}
                      {CAPA_RECOMENDADA.altura}px
                    </strong>{" "}
                    é apenas a recomendação para impressão em alta resolução.
                  </p>

                  <input
                    ref={capaInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      carregarImagem(e.target.files?.[0], "capaImagem")
                    }
                  />

                  <div className="flex min-h-[150px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    {template.capaImagem ? (
                      <div className="w-full text-center">
                        <img
                          src={template.capaImagem}
                          alt="Capa"
                          className="mx-auto max-h-52 rounded-lg object-contain"
                        />

                        <div className="mt-4 flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => capaInputRef.current?.click()}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Alterar
                          </button>

                          <button
                            type="button"
                            onClick={() => removerImagem("capaImagem")}
                            className="flex items-center gap-1 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={13} />
                            Remover
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => capaInputRef.current?.click()}
                        className="text-center"
                      >
                        <ImageIcon
                          className="mx-auto text-slate-400"
                          size={28}
                        />

                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          Enviar capa
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          A4 vertical • 1024 × 1448px ou superior
                        </p>
                      </button>
                    )}
                  </div>

                  <StatusImagem info={infoCapa} tipo="capa" />
                </div>
              </div>

              <div className="grid gap-5 border-t border-slate-100 p-6 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Tipo de capa</label>

                  <SelectPrecificaCont
                  value={template.capaModo}
                  onChange={(value) => atualizarTemplate("capaModo", value)}
                  options={[
                    { value: "sistema", label: "Capa com dados do sistema" },
                    { value: "pronta", label: "Capa pronta / arte completa" },
                  ]}
                  placeholder=""
                  className={inputClass}
                />
                </div>

                <div>
                  <label className={labelClass}>
                    Escurecimento da capa
                  </label>

                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={template.capaEscurecimento}
                      onChange={(e) =>
                        atualizarTemplate(
                          "capaEscurecimento",
                          Number(e.target.value)
                        )
                      }
                      className="w-full"
                    />

                    <span className="w-12 text-right text-sm font-bold text-slate-700">
                      {template.capaEscurecimento}%
                    </span>
                  </div>
                </div>

                <CampoToggle
                  titulo="Mostrar textos sobre a capa"
                  descricao="Exibe título e informações da proposta sobre a imagem de capa."
                  ativo={template.capaMostrarTexto}
                  onChange={(valor) =>
                    atualizarTemplate("capaMostrarTexto", valor)
                  }
                />
              </div>
            </Card>

            <Card>
              <TituloCard
                icone={Palette}
                titulo="Cores e apresentação"
                descricao="Configure o padrão visual e os textos institucionais."
              />

              <div className="grid gap-5 p-6 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Cor principal</label>

                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={template.cor}
                      onChange={(e) =>
                        atualizarTemplate("cor", e.target.value)
                      }
                      className="h-12 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                    />

                    <input
                      className={inputClass}
                      value={template.cor}
                      onChange={(e) =>
                        atualizarTemplate("cor", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Cor secundária</label>

                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={template.corSecundaria}
                      onChange={(e) =>
                        atualizarTemplate(
                          "corSecundaria",
                          e.target.value
                        )
                      }
                      className="h-12 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                    />

                    <input
                      className={inputClass}
                      value={template.corSecundaria}
                      onChange={(e) =>
                        atualizarTemplate(
                          "corSecundaria",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Título da proposta</label>

                  <input
                    className={inputClass}
                    value={template.titulo}
                    onChange={(e) =>
                      atualizarTemplate("titulo", e.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Subtítulo</label>

                  <input
                    className={inputClass}
                    value={template.subtitulo}
                    onChange={(e) =>
                      atualizarTemplate("subtitulo", e.target.value)
                    }
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Mensagem de abertura
                  </label>

                  <textarea
                    rows={3}
                    className={inputClass}
                    value={template.mensagem}
                    onChange={(e) =>
                      atualizarTemplate("mensagem", e.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Apresentação do escritório
                  </label>

                  <textarea
                    rows={6}
                    className={inputClass}
                    value={template.apresentacaoEscritorio || ""}
                    onChange={(e) =>
                      atualizarTemplate(
                        "apresentacaoEscritorio",
                        e.target.value
                      )
                    }
                    placeholder="Conte brevemente quem é o escritório, diferenciais, experiência e posicionamento."
                  />
                </div>
              </div>
            </Card>

            <Card>
              <TituloCard
                icone={CreditCard}
                titulo="Condições da proposta"
                descricao="Essas informações serão copiadas para cada nova proposta."
              />

              <div className="grid gap-5 p-6 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Validade padrão</label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className={`${inputClass} pr-16`}
                      value={template.validadeDias}
                      onChange={(e) =>
                        atualizarTemplate(
                          "validadeDias",
                          Math.max(1, Number(e.target.value) || 1)
                        )
                      }
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      dias
                    </span>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Forma de pagamento
                  </label>

                  <input
                    className={inputClass}
                    value={template.formaPagamento}
                    onChange={(e) =>
                      atualizarTemplate(
                        "formaPagamento",
                        e.target.value
                      )
                    }
                    placeholder="Ex.: Boleto bancário / PIX"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Condições comerciais
                  </label>

                  <textarea
                    rows={5}
                    className={inputClass}
                    value={template.condicoes}
                    onChange={(e) =>
                      atualizarTemplate("condicoes", e.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Observações padrão
                  </label>

                  <textarea
                    rows={4}
                    className={inputClass}
                    value={template.observacoes}
                    onChange={(e) =>
                      atualizarTemplate(
                        "observacoes",
                        e.target.value
                      )
                    }
                    placeholder="Informações adicionais que devem constar nas novas propostas."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Rodapé</label>

                  <textarea
                    rows={2}
                    className={inputClass}
                    value={template.rodape || ""}
                    onChange={(e) =>
                      atualizarTemplate("rodape", e.target.value)
                    }
                  />
                </div>
              </div>
            </Card>

            <Card>
              <TituloCard
                icone={Eye}
                titulo="Seções da proposta"
                descricao="Defina quais seções estarão ativas por padrão nas novas propostas."
              />

              <div className="p-6">
                {(template.secoes || []).map((secao, index) => (
                  <div
                    key={secao.id || index}
                    className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {secao.titulo}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {secao.id}
                      </p>
                    </div>

                    <Toggle
                      ativo={secao.ativo !== false}
                      onChange={(valor) => {
                        const novasSecoes = [...template.secoes];

                        novasSecoes[index] = {
                          ...novasSecoes[index],
                          ativo: valor,
                        };

                        atualizarTemplate("secoes", novasSecoes);
                      }}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <div className="sticky bottom-5 z-10 flex justify-end">
              <button
                type="button"
                onClick={salvarTemplate}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition ${
                  salvoTemplate
                    ? "bg-emerald-600"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {salvoTemplate ? (
                  <>
                    <CheckCircle2 size={18} />
                    {templateFrenteId ? "Template da frente salvo" : "Template salvo"}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {templateFrenteId ? "Salvar template da frente" : "Salvar template padrão"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {aba === "frentes" && (
          <div className="space-y-6">
            <Card>
              <TituloCard
                icone={BriefcaseBusiness}
                titulo="Frentes de negócio"
                descricao="Crie as frentes comerciais do escritório com a nomenclatura que fizer sentido para a sua operação. Exemplos: Contabilidade Digital, BPO Financeiro ou Contabilidade Completa."
              />

              <div className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Estrutura comercial parametrizável
                    </p>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                      Cada frente pode receber seu próprio template sem alterar o template padrão atual.
                      Se a frente ainda não tiver um template específico, a configuração começa como uma
                      cópia do template padrão do escritório.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={novaFrenteNegocio}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    <BriefcaseBusiness size={17} />
                    Nova frente
                  </button>
                </div>

                {frenteEditandoId && (
                  <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>Nome da frente</label>
                        <input
                          className={inputClass}
                          value={frenteDraft.nome}
                          onChange={(e) =>
                            setFrenteDraft((anterior) => ({
                              ...anterior,
                              nome: e.target.value,
                            }))
                          }
                          placeholder="Ex.: BPO Financeiro"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Status</label>
                        <div className="flex h-[46px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
                          <Toggle
                            ativo={frenteDraft.ativo !== false}
                            onChange={(valor) =>
                              setFrenteDraft((anterior) => ({
                                ...anterior,
                                ativo: valor,
                              }))
                            }
                          />
                          <span className="text-sm font-semibold text-slate-700">
                            {frenteDraft.ativo !== false ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className={labelClass}>Descrição</label>
                        <textarea
                          className={`${inputClass} min-h-[96px] resize-y`}
                          value={frenteDraft.descricao}
                          onChange={(e) =>
                            setFrenteDraft((anterior) => ({
                              ...anterior,
                              descricao: e.target.value,
                            }))
                          }
                          placeholder="Descreva a finalidade desta frente de negócio."
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFrenteEditandoId(null);
                          setFrenteDraft({ nome: "", descricao: "", ativo: true });
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={confirmarFrenteNegocio}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                      >
                        {frenteEditandoId === "nova" ? "Adicionar frente" : "Salvar alterações"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {!frentesNegocio.length ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                      <BriefcaseBusiness className="mx-auto text-slate-400" size={28} />
                      <p className="mt-3 font-semibold text-slate-800">
                        Nenhuma frente cadastrada
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Crie a primeira frente com o nome utilizado pelo seu escritório.
                      </p>
                    </div>
                  ) : (
                    frentesNegocio.map((frente) => (
                      <div
                        key={frente.id}
                        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900">{frente.nome}</p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                frente.ativo !== false
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {frente.ativo !== false ? "Ativa" : "Inativa"}
                            </span>
                          </div>
                          {frente.descricao && (
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {frente.descricao}
                            </p>
                          )}
                          <p className="mt-2 text-xs font-semibold text-blue-600">
                            {frente.template
                              ? "Template específico: configurado"
                              : "Template específico: usando o padrão como base"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => configurarTemplateFrente(frente)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
                          >
                            <FileText size={15} />
                            Configurar template
                          </button>
                          <button
                            type="button"
                            onClick={() => editarFrenteNegocio(frente)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicarFrenteNegocio(frente)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            <Copy size={15} />
                            Duplicar
                          </button>
                          <button
                            type="button"
                            onClick={() => alternarFrenteNegocio(frente.id)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            {frente.ativo !== false ? "Desativar" : "Ativar"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            <div className="sticky bottom-5 z-10 flex justify-end">
              <button
                type="button"
                onClick={salvarFrentesNegocio}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition ${
                  salvoFrentes
                    ? "bg-emerald-600"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {salvoFrentes ? (
                  <>
                    <CheckCircle2 size={18} />
                    Frentes salvas
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar frentes de negócio
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {aba === "minuta" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-blue-600" size={20} />
                <div>
                  <p className="font-semibold text-slate-900">
                    Minuta padrão do contrato
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Cadastre o texto contratual e utilize variáveis dinâmicas. Nesta etapa,
                    a minuta é apenas configurada e salva. O preenchimento automático pela
                    proposta e pelo aceite será conectado na próxima etapa, sem alterar o
                    fluxo atual de aceite.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <TituloCard
                icone={FileText}
                titulo="Conteúdo da minuta"
                descricao="O texto abaixo será a base contratual do escritório. Os valores da proposta serão sempre originados da própria proposta, sem redigitação manual."
              />

              <div className="space-y-5 p-6">
                <div className="grid gap-5 lg:grid-cols-[1fr_180px]">
                  <div>
                    <label className={labelClass}>Título do contrato</label>
                    <input
                      className={inputClass}
                      value={minutaContrato.titulo || ""}
                      onChange={(e) => atualizarMinutaContrato("titulo", e.target.value)}
                      placeholder="Contrato de Prestação de Serviços"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Minuta ativa</label>
                    <div className="flex h-[46px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
                      <Toggle
                        ativo={minutaContrato.ativo !== false}
                        onChange={(valor) => atualizarMinutaContrato("ativo", valor)}
                      />
                      <span className="text-sm font-semibold text-slate-700">
                        {minutaContrato.ativo !== false ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Texto da minuta</label>
                  <textarea
                    className={`${inputClass} min-h-[420px] resize-y font-mono leading-6`}
                    value={minutaContrato.conteudo || ""}
                    onChange={(e) => atualizarMinutaContrato("conteudo", e.target.value)}
                    placeholder="Cole ou escreva aqui a minuta de contrato do escritório. Use as variáveis abaixo nos pontos que deverão ser preenchidos automaticamente."
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    As variáveis permanecem visíveis na configuração. Quando conectarmos
                    esta minuta à proposta, o sistema substituirá cada uma pelo dado
                    correspondente e congelará a versão final no aceite.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <TituloCard
                icone={FileText}
                titulo="Variáveis automáticas"
                descricao="Clique em uma variável para adicioná-la ao final da minuta. Você também pode copiá-la e posicioná-la manualmente no texto."
              />

              <div className="p-6">
                {["Proposta / sistema", "Aceite do cliente"].map((grupo) => (
                  <div key={grupo} className="mb-6 last:mb-0">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{grupo}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {grupo === "Proposta / sistema"
                            ? "Preenchidas automaticamente com os dados e valores que já existem na proposta."
                            : "Preenchidas com os dados informados pelo representante no momento do aceite."}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {VARIAVEIS_MINUTA.filter((item) => item.grupo === grupo).map(
                        (item) => (
                          <button
                            key={item.chave}
                            type="button"
                            onClick={() => inserirVariavelMinuta(item.chave)}
                            className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                          >
                            <code className="text-xs font-bold text-blue-700">
                              {item.chave}
                            </code>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {item.descricao}
                            </p>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex gap-3">
                <Info className="mt-0.5 shrink-0 text-amber-600" size={20} />
                <div>
                  <p className="font-semibold text-slate-900">
                    Regra de integridade do contrato
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Honorários, mensalidade, primeiro mês e serviços contratados não serão
                    digitados novamente pelo cliente. Esses dados virão da proposta aceita.
                    Os campos do representante serão preenchidos no aceite. A versão final
                    será congelada quando conectarmos esta etapa ao fluxo de propostas.
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-5 z-10 flex justify-end">
              <button
                type="button"
                onClick={salvarMinutaContrato}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition ${
                  salvoMinuta
                    ? "bg-emerald-600"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {salvoMinuta ? (
                  <>
                    <CheckCircle2 size={18} />
                    Minuta salva
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar minuta de contrato
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {aba === "regras" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <div className="flex gap-3">
                <AlertTriangle
                  className="mt-0.5 shrink-0 text-amber-600"
                  size={20}
                />

                <div>
                  <p className="font-semibold text-slate-900">
                    Política comercial
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    O desconto comercial deve atuar sobre o valor da
                    proposta, sem alterar o Índice PrecificaCont calculado
                    originalmente.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <TituloCard
                icone={Percent}
                titulo="Política de descontos"
                descricao="Defina os limites que deverão ser respeitados pela operação comercial."
              />

              <div className="p-6">
                <CampoToggle
                  titulo="Permitir descontos"
                  descricao="Habilita a utilização de descontos comerciais nas propostas."
                  ativo={regras.desconto.permitido}
                  onChange={(valor) =>
                    atualizarDesconto("permitido", valor)
                  }
                />

                <div>
                  <div className="grid gap-5 border-b border-slate-100 py-5 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        Desconto máximo permitido
                      </label>

                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          className={`${inputClass} pr-12`}
                          value={regras.desconto.percentualMaximo}
                          onChange={(e) =>
                            atualizarDesconto(
                              "percentualMaximo",
                              Math.min(
                                100,
                                Math.max(
                                  0,
                                  Number(e.target.value) || 0
                                )
                              )
                            )
                          }
                        />

                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                          %
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Exigir justificativa a partir de
                      </label>

                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          className={`${inputClass} pr-12`}
                          value={
                            regras.desconto.percentualJustificativa
                          }
                          onChange={(e) =>
                            atualizarDesconto(
                              "percentualJustificativa",
                              Number(e.target.value) || 0
                            )
                          }
                        />

                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <CampoToggle
                    titulo="Desconto percentual"
                    descricao="Permite informar o desconto em percentual."
                    ativo={regras.desconto.permitirPercentual}
                    onChange={(valor) =>
                      atualizarDesconto(
                        "permitirPercentual",
                        valor
                      )
                    }
                  />

                  <CampoToggle
                    titulo="Desconto em valor fixo"
                    descricao="Permite informar diretamente o valor em reais a ser descontado."
                    ativo={regras.desconto.permitirValorFixo}
                    onChange={(valor) =>
                      atualizarDesconto(
                        "permitirValorFixo",
                        valor
                      )
                    }
                  />

                  <CampoToggle
                    titulo="Permitir desconto na mensalidade"
                    descricao="Autoriza desconto sobre honorários mensais recorrentes."
                    ativo={regras.desconto.aplicarMensalidade}
                    onChange={(valor) =>
                      atualizarDesconto(
                        "aplicarMensalidade",
                        valor
                      )
                    }
                  />

                  <CampoToggle
                    titulo="Permitir desconto em serviços adicionais recorrentes"
                    descricao="Autoriza desconto nos serviços adicionais cobrados mensalmente."
                    ativo={
                      regras.desconto.aplicarServicosRecorrentes
                    }
                    onChange={(valor) =>
                      atualizarDesconto(
                        "aplicarServicosRecorrentes",
                        valor
                      )
                    }
                  />

                  <CampoToggle
                    titulo="Permitir desconto em serviços avulsos"
                    descricao="Autoriza desconto nos serviços cobrados de forma pontual."
                    ativo={regras.desconto.aplicarServicosAvulsos}
                    onChange={(valor) =>
                      atualizarDesconto(
                        "aplicarServicosAvulsos",
                        valor
                      )
                    }
                  />

                  <CampoToggle
                    titulo="Exigir justificativa"
                    descricao="O usuário deverá informar o motivo quando atingir o limite configurado."
                    ativo={regras.desconto.exigirJustificativa}
                    onChange={(valor) =>
                      atualizarDesconto(
                        "exigirJustificativa",
                        valor
                      )
                    }
                  />

                  <CampoToggle
                    titulo="Exigir aprovação administrativa"
                    descricao="Estrutura preparada para aprovação de descontos quando o controle de usuários estiver ativo."
                    ativo={regras.desconto.exigirAprovacao}
                    onChange={(valor) =>
                      atualizarDesconto(
                        "exigirAprovacao",
                        valor
                      )
                    }
                  />

                  {regras.desconto.exigirAprovacao && (
                    <div className="max-w-sm pt-5">
                      <label className={labelClass}>
                        Aprovação obrigatória a partir de
                      </label>

                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          className={`${inputClass} pr-12`}
                          value={regras.desconto.percentualAprovacao}
                          onChange={(e) =>
                            atualizarDesconto(
                              "percentualAprovacao",
                              Number(e.target.value) || 0
                            )
                          }
                        />

                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <TituloCard
                icone={LockKeyhole}
                titulo="Proteção da precificação"
                descricao="Preserve a referência técnica mesmo quando houver negociação comercial."
              />

              <div className="p-6">
                <CampoToggle
                  titulo="Preservar Índice PrecificaCont"
                  descricao="O valor calculado pelo motor permanece registrado e não é substituído pelo valor negociado."
                  ativo={
                    regras.protecoes.preservarIndicePrecificaCont
                  }
                  onChange={(valor) =>
                    atualizarProtecao(
                      "preservarIndicePrecificaCont",
                      valor
                    )
                  }
                />

                <CampoToggle
                  titulo="Registrar valor original"
                  descricao="Mantém o valor antes de qualquer desconto para histórico e BI."
                  ativo={regras.protecoes.registrarValorOriginal}
                  onChange={(valor) =>
                    atualizarProtecao(
                      "registrarValorOriginal",
                      valor
                    )
                  }
                />

                <CampoToggle
                  titulo="Registrar desconto concedido"
                  descricao="Mantém percentual e valor concedidos para análise comercial."
                  ativo={regras.protecoes.registrarDesconto}
                  onChange={(valor) =>
                    atualizarProtecao(
                      "registrarDesconto",
                      valor
                    )
                  }
                />

                <CampoToggle
                  titulo="Registrar valor comercial final"
                  descricao="Mantém o valor efetivamente apresentado ou vendido ao cliente."
                  ativo={regras.protecoes.registrarValorFinal}
                  onChange={(valor) =>
                    atualizarProtecao(
                      "registrarValorFinal",
                      valor
                    )
                  }
                />
              </div>
            </Card>

            <div className="sticky bottom-5 z-10 flex justify-end">
              <button
                type="button"
                onClick={salvarRegras}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition ${
                  salvoRegras
                    ? "bg-emerald-600"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {salvoRegras ? (
                  <>
                    <CheckCircle2 size={18} />
                    Regras salvas
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar regras comerciais
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {aba === "permissoes" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
              <div className="flex gap-3">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-blue-600"
                  size={20}
                />

                <div>
                  <p className="font-semibold text-slate-900">
                    Estrutura de permissões
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Gerencie os usuários vinculados ao escritório, convites e
                    as alçadas comerciais. O acesso aos dados já respeita o
                    escritório e o perfil do usuário autenticado.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <TituloCard
                icone={Users}
                titulo="Usuários do escritório"
                descricao="Gerencie quem faz parte da operação e o perfil de acesso de cada usuário."
              />

              <div className="p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {perfilAtual === "admin"
                        ? "Você está acessando como Administrador"
                        : "Seu acesso ao escritório"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {escritorioId
                        ? `Escritório: ${escritorioId}`
                        : "Carregando vínculo do escritório..."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={carregarUsuariosEConvites}
                    disabled={carregandoUsuarios}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={16}
                      className={carregandoUsuarios ? "animate-spin" : ""}
                    />
                    Atualizar
                  </button>
                </div>

                {erroUsuarios && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {erroUsuarios}
                  </div>
                )}

                {carregandoUsuarios && !usuariosEscritorio.length ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Carregando usuários...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usuariosEscritorio.map((usuario) => {
                      const ehProprioUsuario = usuario.user_id === usuarioAtualId;

                      return (
                      <div
                        key={usuario.id}
                        className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.3fr_1fr_180px_120px_46px] lg:items-center"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {usuario.nome || "Usuário sem nome"}
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {usuario.user_id}
                          </p>
                        </div>

                        <input
                          className={inputClass}
                          value={usuario.cargo || ""}
                          disabled={perfilAtual !== "admin"}
                          placeholder="Cargo"
                          onChange={(e) =>
                            setUsuariosEscritorio((lista) =>
                              lista.map((item) =>
                                item.id === usuario.id
                                  ? { ...item, cargo: e.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={(e) =>
                            atualizarUsuarioEscritorio(usuario, {
                              cargo: e.target.value,
                            })
                          }
                        />

                        <SelectPrecificaCont
                              value={usuario.perfil_acesso_id || ""}
                              disabled={perfilAtual !== "admin" || ehProprioUsuario}
                              onChange={(value) =>
                                atualizarUsuarioEscritorio(usuario, {
                                  perfil_acesso_id: value || null,
                                })
                              }
                              options={[
                                { value: "", label: "Sem perfil definido" },
                                ...perfisAcesso.map((perfil) => ({
                                  value: perfil.id,
                                  label: perfil.nome,
                                })),
                              ]}
                              placeholder=""
                              className={inputClass}
                            />

                        <button
                          type="button"
                          disabled={perfilAtual !== "admin" || ehProprioUsuario}
                          onClick={() =>
                            atualizarUsuarioEscritorio(usuario, {
                              ativo: usuario.ativo === false,
                            })
                          }
                          title={
                            ehProprioUsuario
                              ? "Você não pode inativar o seu próprio usuário."
                              : ""
                          }
                          className={`rounded-xl px-3 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            usuario.ativo !== false
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {usuario.ativo !== false ? "Ativo" : "Inativo"}
                        </button>

                        <button
                          type="button"
                          disabled={perfilAtual !== "admin" || ehProprioUsuario}
                          onClick={() => excluirUsuarioEscritorio(usuario)}
                          title={
                            ehProprioUsuario
                              ? "Você não pode excluir o seu próprio usuário."
                              : "Excluir usuário do escritório"
                          }
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                      );
                    })}

                    {!usuariosEscritorio.length && !carregandoUsuarios && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        Nenhum usuário encontrado para este escritório.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {perfilAtual === "admin" && (
              <Card>
                <TituloCard
                  icone={UserPlus}
                  titulo="Convidar usuário"
                  descricao="Crie um convite de acesso válido por 7 dias e defina o perfil antes do primeiro acesso."
                />

                <div className="p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Nome</label>
                      <input
                        className={inputClass}
                        value={novoConvite.nome}
                        onChange={(e) =>
                          setNovoConvite((anterior) => ({
                            ...anterior,
                            nome: e.target.value,
                          }))
                        }
                        placeholder="Nome do usuário"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>E-mail *</label>
                      <input
                        type="email"
                        className={inputClass}
                        value={novoConvite.email}
                        onChange={(e) =>
                          setNovoConvite((anterior) => ({
                            ...anterior,
                            email: e.target.value,
                          }))
                        }
                        placeholder="usuario@empresa.com.br"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Cargo</label>
                      <input
                        className={inputClass}
                        value={novoConvite.cargo}
                        onChange={(e) =>
                          setNovoConvite((anterior) => ({
                            ...anterior,
                            cargo: e.target.value,
                          }))
                        }
                        placeholder="Ex.: Comercial"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Perfil</label>
                      <SelectPrecificaCont
                        value={novoConvite.perfil}
                        onChange={(value) =>
                          setNovoConvite((anterior) => ({
                            ...anterior,
                            perfil: value,
                          }))
                        }
                        options={[
                          { value: "usuario", label: "Usuário" },
                          { value: "comercial", label: "Comercial" },
                          { value: "gestor", label: "Gestor" },
                          { value: "admin", label: "Admin" },
                        ]}
                        placeholder=""
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={criarConvite}
                      disabled={salvandoConvite}
                      className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      <UserPlus size={17} />
                      {salvandoConvite ? "Enviando convite..." : "Criar e enviar convite"}
                    </button>
                  </div>

                  {conviteCriado?.token && (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="font-semibold text-emerald-700">
                        Convite criado e enviado por e-mail
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        O usuário recebeu o convite no e-mail informado. O link abaixo continua disponível para envio manual, se necessário.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <input
                          readOnly
                          className={inputClass}
                          value={conviteCriado.link || ""}
                        />
                        <button
                          type="button"
                          onClick={() => copiarLinkConvite(conviteCriado)}
                          className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm"
                        >
                          <Copy size={16} />
                          Copiar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {perfilAtual === "admin" && (
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">Convites</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Histórico compacto de convites enviados.
                      </p>
                    </div>
                  </div>

                  {convitesEscritorio.length > 0 && (
                    <button
                      type="button"
                      onClick={limparConvites}
                      className="flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                      Limpar lista
                    </button>
                  )}
                </div>

                <div className="p-4">
                  {convitesEscritorio.length ? (
                    <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
                      {convitesEscritorio.map((convite) => (
                        <div
                          key={convite.id}
                          className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                        >
                          <div className="min-w-[220px] flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {convite.nome || convite.email}
                            </p>
                            <p className="truncate text-xs text-slate-500">{convite.email}</p>
                          </div>

                          <div className="min-w-[110px] text-xs text-slate-500">
                            {convite.perfil || "usuario"}
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              convite.status === "pendente"
                                ? "bg-amber-50 text-amber-700"
                                : convite.status === "aceito"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {convite.status}
                          </span>

                          <div className="flex items-center gap-1">
                            {convite.status === "pendente" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => copiarLinkConvite(convite)}
                                  title="Copiar link"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => cancelarConvite(convite)}
                                  title="Cancelar convite"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-600 hover:bg-amber-50"
                                >
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => excluirConvite(convite)}
                              title="Excluir da lista"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !carregandoUsuarios ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Nenhum convite na lista.
                    </div>
                  ) : null}

                  {convitesEscritorio.length > 5 && (
                    <p className="mt-2 text-xs text-slate-400">
                      A lista possui rolagem própria para não ocupar toda a tela.
                    </p>
                  )}
                </div>
              </Card>
            )}

            {perfilAtual === "admin" && (
              <Card>
                <TituloCard
                  icone={ShieldCheck}
                  titulo="Perfis e acesso aos módulos"
                  descricao="Defina o que cada perfil pode visualizar e fazer, sempre limitado aos módulos contratados pela empresa."
                />

                <div className="p-6">
                  <div className="mb-5 flex flex-wrap gap-2">
                    {perfisAcesso.map((perfil) => (
                      <button
                        key={perfil.id}
                        type="button"
                        onClick={() => selecionarPerfilAcesso(perfil.id)}
                        className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                          perfilSelecionadoId === perfil.id
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {perfil.nome}
                      </button>
                    ))}
                  </div>

                  {carregandoPerfis ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Carregando permissões...
                    </div>
                  ) : !modulosPermitidos.length ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                      Nenhum módulo contratado foi encontrado para esta empresa.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[760px] text-left">
                        <thead className="bg-slate-50">
                          <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-3">Módulo contratado</th>
                            <th className="px-3 py-3 text-center">Visualizar</th>
                            <th className="px-3 py-3 text-center">Criar</th>
                            <th className="px-3 py-3 text-center">Editar</th>
                            <th className="px-3 py-3 text-center">Excluir</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modulosPermitidos.map((modulo) => {
                            const permissao = permissoesPerfil[modulo.id] || {};
                            const administrador =
                              perfisAcesso.find((p) => p.id === perfilSelecionadoId)?.nome ===
                              "Administrador";

                            const campo = (chave) => (
                              <td className="px-3 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={administrador || permissao[chave] === true}
                                  disabled={administrador}
                                  onChange={(e) =>
                                    alterarPermissaoModulo(modulo.id, chave, e.target.checked)
                                  }
                                  className="h-4 w-4 accent-blue-600"
                                />
                              </td>
                            );

                            return (
                              <tr key={modulo.id} className="border-t border-slate-100">
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-slate-900">{modulo.nome}</p>
                                  {modulo.descricao ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {modulo.descricao}
                                    </p>
                                  ) : null}
                                </td>
                                {campo("pode_visualizar")}
                                {campo("pode_criar")}
                                {campo("pode_editar")}
                                {campo("pode_excluir")}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-xs leading-5 text-slate-500">
                      O Administrador possui acesso total aos módulos contratados.
                      Gestor e Comercial podem ser restringidos por ação.
                    </p>

                    {perfisAcesso.find((p) => p.id === perfilSelecionadoId)?.nome !==
                      "Administrador" && (
                      <button
                        type="button"
                        onClick={salvarPermissoesPerfil}
                        disabled={salvandoPerfil || !perfilSelecionadoId}
                        className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        <Save size={17} />
                        {salvandoPerfil ? "Salvando..." : "Salvar perfil"}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <TituloCard
                icone={ShieldCheck}
                titulo="Administrador"
                descricao="Permissões administrativas da operação."
              />

              <div className="p-6">
                <CampoToggle
                  titulo="Configurar template oficial"
                  descricao="Permite alterar o padrão utilizado nas novas propostas."
                  ativo={regras.permissoes.adminConfiguraTemplate}
                  onChange={(valor) =>
                    atualizarPermissao(
                      "adminConfiguraTemplate",
                      valor
                    )
                  }
                />

                <CampoToggle
                  titulo="Configurar regras comerciais"
                  descricao="Permite alterar limites de desconto e regras da operação."
                  ativo={regras.permissoes.adminConfiguraRegras}
                  onChange={(valor) =>
                    atualizarPermissao(
                      "adminConfiguraRegras",
                      valor
                    )
                  }
                />

                <CampoToggle
                  titulo="Admin pode ultrapassar limite de desconto"
                  descricao="Quando o controle de usuários estiver ativo, permite ao administrador ultrapassar o limite padrão."
                  ativo={regras.permissoes.adminDescontoSemLimite}
                  onChange={(valor) =>
                    atualizarPermissao(
                      "adminDescontoSemLimite",
                      valor
                    )
                  }
                />
              </div>
            </Card>

            <Card>
              <TituloCard
                icone={LockKeyhole}
                titulo="Comercial / Vendedor"
                descricao="Defina o que o perfil comercial poderá fazer."
              />

              <div className="p-6">
                <CampoToggle
                  titulo="Editar proposta"
                  descricao="Permite editar os campos comerciais da proposta."
                  ativo={
                    regras.permissoes.comercialPodeEditarProposta
                  }
                  onChange={(valor) =>
                    atualizarPermissao(
                      "comercialPodeEditarProposta",
                      valor
                    )
                  }
                />

                <CampoToggle
                  titulo="Aplicar desconto"
                  descricao="Permite conceder desconto dentro das regras definidas pelo Admin."
                  ativo={
                    regras.permissoes.comercialPodeAplicarDesconto
                  }
                  onChange={(valor) =>
                    atualizarPermissao(
                      "comercialPodeAplicarDesconto",
                      valor
                    )
                  }
                />

                <CampoToggle
                  titulo="Alterar valor manualmente"
                  descricao="Permite substituir manualmente valores comerciais fora do fluxo de desconto."
                  ativo={
                    regras.permissoes.comercialPodeAlterarValorManual
                  }
                  onChange={(valor) =>
                    atualizarPermissao(
                      "comercialPodeAlterarValorManual",
                      valor
                    )
                  }
                />

                <CampoToggle
                  titulo="Alterar Índice PrecificaCont"
                  descricao="Não recomendado. Permitiria modificar a referência técnica calculada pelo motor."
                  ativo={
                    regras.permissoes.comercialPodeAlterarIndice
                  }
                  onChange={(valor) =>
                    atualizarPermissao(
                      "comercialPodeAlterarIndice",
                      valor
                    )
                  }
                />

                <CampoToggle
                  titulo="Publicar proposta"
                  descricao="Permite gerar o link público da proposta."
                  ativo={regras.permissoes.comercialPodePublicar}
                  onChange={(valor) =>
                    atualizarPermissao(
                      "comercialPodePublicar",
                      valor
                    )
                  }
                />

                <CampoToggle
                  titulo="Enviar proposta"
                  descricao="Permite compartilhar proposta por WhatsApp, e-mail ou link."
                  ativo={regras.permissoes.comercialPodeEnviar}
                  onChange={(valor) =>
                    atualizarPermissao(
                      "comercialPodeEnviar",
                      valor
                    )
                  }
                />

                <CampoToggle
                  titulo="Marcar proposta como aceita"
                  descricao="Permite ao comercial registrar manualmente a aceitação."
                  ativo={
                    regras.permissoes.comercialPodeMarcarAceita
                  }
                  onChange={(valor) =>
                    atualizarPermissao(
                      "comercialPodeMarcarAceita",
                      valor
                    )
                  }
                />
              </div>
            </Card>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex gap-3">
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-emerald-600"
                  size={20}
                />

                <div>
                  <p className="font-semibold text-slate-900">
                    Isolamento por escritório ativo
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Usuários, vínculos e dados operacionais já estão associados ao
                    escritório autenticado. As regras acima continuam definindo as
                    alçadas comerciais da operação.
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-5 z-10 flex justify-end">
              <button
                type="button"
                onClick={salvarRegras}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition ${
                  salvoRegras
                    ? "bg-emerald-600"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {salvoRegras ? (
                  <>
                    <CheckCircle2 size={18} />
                    Permissões salvas
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar permissões
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Configuracoes;