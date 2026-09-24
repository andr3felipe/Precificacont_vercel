import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../supabase";

const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const dateBR = (value) => {
  if (!value) return "—";
  const raw = String(value);
  const date = raw.includes("T")
    ? new Date(raw)
    : new Date(`${raw}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? raw
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

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const safeText = (value, fallback = "") => {
  if (value === undefined || value === null || value === "") return fallback;

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => safeText(item, ""))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return safeText(
      firstValue(
        value?.nome,
        value?.descricao,
        value?.titulo,
        value?.label,
        value?.servico,
        value?.valor
      ),
      fallback
    );
  }

  return String(value);
};

const carregarAceiteLocal = (token) => {
  if (!token) return {};
  try {
    const raw = localStorage.getItem(`precificacont_aceite_publico:${token}`);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const linhaContratoTipo = (linha) => {
  const texto = String(linha || "").trim();
  if (!texto) return "vazia";
  if (/^CONTRATO DE PRESTAÇÃO DE SERVIÇOS$/i.test(texto)) return "titulo";
  if (/^\d+\.\s+/.test(texto)) return "secao";
  if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s.ªº()/-]{6,}$/.test(texto)) {
    return "secao";
  }
  if (/^(Honorários|Mensalidade total contratada|Valor do primeiro mês|Forma de pagamento):/i.test(texto)) {
    return "destaque";
  }
  if (/\s—\sR\$\s?[\d.]+,\d{2}\s\((mensal|pontual)\)$/i.test(texto)) {
    return "servico";
  }
  return "paragrafo";
};

const normalizeItems = (proposal) => {
  const candidates = [
    proposal?.itens_proposta,
    proposal?.itens,
    proposal?.servicos,
    proposal?.servicos_adicionais,
    proposal?.servicosSelecionados,
    proposal?.servicos_selecionados,
    proposal?.composicao,
    proposal?.composicao_comercial,
  ];

  const source = candidates.find(Array.isArray) || [];

  return source.map((item, index) => ({
    id: item?.id || `item-${index}`,
    nome: safeText(
      firstValue(
        item?.nome,
        item?.servico,
        item?.descricao,
        item?.titulo
      ),
      "Serviço"
    ),
    categoria: safeText(
      firstValue(item?.categoria, item?.tipo),
      "Serviço"
    ),
    recorrencia: String(
      firstValue(
        item?.recorrencia,
        item?.periodicidade,
        item?.tipo_cobranca,
        "pontual"
      )
    ).toLowerCase(),
    valor: Number(
      firstValue(
        item?.valor,
        item?.valor_unitario,
        item?.preco_praticado,
        item?.preco,
        0
      )
    ),
  }));
};

function SectionTitle({ number, title }) {
  return (
    <div className="flex items-center gap-4 mb-7">
      <div className="h-10 min-w-10 px-3 rounded-xl bg-[#174b7a] text-white flex items-center justify-center font-bold text-sm">
        {String(number).padStart(2, "0")}
      </div>
      <div>
        <div className="text-[11px] tracking-[0.25em] font-bold text-[#174b7a]">
          PROPOSTA COMERCIAL
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
          {title}
        </h2>
      </div>
    </div>
  );
}

export default function PropostaPublica() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [registro, setRegistro] = useState(null);
  const [nomeAceite, setNomeAceite] = useState("");
  const [cpfAceite, setCpfAceite] = useState("");
  const [cargoAceite, setCargoAceite] = useState("");
  const [emailAceite, setEmailAceite] = useState("");
  const [telefoneAceite, setTelefoneAceite] = useState("");
  const [confirmouAceite, setConfirmouAceite] = useState(false);
  const [enviandoAceite, setEnviandoAceite] = useState(false);
  const [erroAceite, setErroAceite] = useState("");

  const modoImpressao = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get("imprimir") === "1";
    } catch {
      return false;
    }
  }, []);
  const [minutaContrato, setMinutaContrato] = useState(null);

  const token = useMemo(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[0] === "proposta" ? parts[1] || "" : "";
  }, []);

  useEffect(() => {
    let mounted = true;

    const carregar = async () => {
      if (!token) {
        setErro("Link de proposta inválido.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("propostas")
        .select("*")
        .eq("token_publico", token)
        .eq("publicada", true)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("Erro ao carregar proposta pública:", error);
        setErro("Não foi possível carregar esta proposta.");
        setLoading(false);
        return;
      }

      if (!data) {
        setErro("Esta proposta não foi encontrada ou não está publicada.");
        setLoading(false);
        return;
      }

      const aceiteLocal = carregarAceiteLocal(token);
      const dadosRemotos =
        data?.dados && typeof data.dados === "object" ? data.dados : {};
      const dadosAceiteRemoto =
        dadosRemotos?.dados_aceite && typeof dadosRemotos.dados_aceite === "object"
          ? dadosRemotos.dados_aceite
          : {};

      const dadosAceiteMesclados = {
        ...aceiteLocal,
        ...dadosAceiteRemoto,
      };

      const registroCarregado = {
        ...data,
        dados: {
          ...dadosRemotos,
          ...(Object.keys(dadosAceiteMesclados).length
            ? {
                dados_aceite: dadosAceiteMesclados,
                representante_cpf:
                  dadosRemotos?.representante_cpf ||
                  dadosAceiteMesclados?.cpf ||
                  "",
                representante_cargo:
                  dadosRemotos?.representante_cargo ||
                  dadosAceiteMesclados?.cargo ||
                  "",
                representante_telefone:
                  dadosRemotos?.representante_telefone ||
                  dadosAceiteMesclados?.telefone ||
                  "",
              }
            : {}),
        },
      };

      setRegistro(registroCarregado);

      let minutaCarregada =
        data?.dados?.minuta_contrato ||
        data?.dados?.minutaContrato ||
        null;

      if (!minutaCarregada && data?.escritorio_id) {
        const { data: configMinuta, error: configMinutaError } = await supabase
          .from("configuracoes")
          .select("dados")
          .eq("escritorio_id", data.escritorio_id)
          .eq("chave", "minuta_contrato")
          .maybeSingle();

        if (!configMinutaError && configMinuta?.dados) {
          minutaCarregada = configMinuta.dados;
        }
      }

      if (!minutaCarregada && data?.escritorio_id) {
        try {
          const chaveLocal = `precificacont_minuta_contrato:${data.escritorio_id}`;
          const minutaLocal = JSON.parse(localStorage.getItem(chaveLocal) || "{}");
          if (minutaLocal && Object.keys(minutaLocal).length) {
            minutaCarregada = minutaLocal;
          }
        } catch {
          // Mantém a proposta pública funcionando mesmo sem cache local.
        }
      }

      if (mounted) {
        setMinutaContrato(minutaCarregada);
        setLoading(false);
      }

      const { error: visualizacaoError } = await supabase.rpc(
        "registrar_visualizacao_proposta",
        {
          p_token: token,
        }
      );

      if (visualizacaoError) {
        console.error(
          "Erro ao registrar visualização da proposta:",
          visualizacaoError
        );
      }
    };

    carregar();

    return () => {
      mounted = false;
    };
  }, [token]);

  const aceitarProposta = async () => {
    const nome = nomeAceite.trim();
    const cpf = cpfAceite.trim();
    const cargo = cargoAceite.trim();
    const email = emailAceite.trim();
    const telefone = telefoneAceite.trim();

    if (nome.length < 3) {
      setErroAceite("Informe seu nome completo.");
      return;
    }

    if (cpf.replace(/\D/g, "").length !== 11) {
      setErroAceite("Informe um CPF válido com 11 dígitos.");
      return;
    }

    if (cargo.length < 2) {
      setErroAceite("Informe seu cargo.");
      return;
    }

    if (!email || !email.includes("@")) {
      setErroAceite("Informe um e-mail válido.");
      return;
    }

    if (telefone.replace(/\D/g, "").length < 10) {
      setErroAceite("Informe um telefone válido com DDD.");
      return;
    }

    if (!confirmouAceite) {
      setErroAceite(
        "Confirme que leu e concorda com os termos desta proposta."
      );
      return;
    }

    try {
      setEnviandoAceite(true);
      setErroAceite("");

      const { error } = await supabase.rpc("aceitar_proposta", {
        p_token: token,
        p_nome: nome,
        p_email: email,
      });

      if (error) throw error;

      const aceitaEm = new Date().toISOString();
      const dadosAceite = {
        nome,
        cpf,
        cargo,
        email: email.toLowerCase(),
        telefone,
        aceita_em: aceitaEm,
      };

      const dadosPropostaAtualizados = {
        ...(registro?.dados || {}),
        dados_aceite: dadosAceite,
        representante_cpf: cpf,
        representante_cargo: cargo,
        representante_telefone: telefone,
      };

      try {
        localStorage.setItem(
          `precificacont_aceite_publico:${token}`,
          JSON.stringify(dadosAceite)
        );
      } catch {
        // O aceite principal continua válido mesmo se o cache local estiver indisponível.
      }

      const { error: dadosAceiteError } = await supabase
        .from("propostas")
        .update({
          dados: dadosPropostaAtualizados,
        })
        .eq("token_publico", token);

      if (dadosAceiteError) {
        console.error(
          "Aceite registrado, mas não foi possível salvar os dados complementares do representante:",
          dadosAceiteError
        );
      }

      setRegistro((atual) => ({
        ...atual,
        status: "aceita",
        aceita_em: aceitaEm,
        nome_aceite: nome,
        email_aceite: email.toLowerCase(),
        dados: dadosPropostaAtualizados,
      }));
    } catch (error) {
      console.error("Erro ao aceitar proposta:", error);
      setErroAceite(
        error?.message || "Não foi possível registrar o aceite da proposta."
      );
    } finally {
      setEnviandoAceite(false);
    }
  };

  useEffect(() => {
    if (!modoImpressao || loading || !registro || registro.status !== "aceita") {
      return;
    }

    let cancelado = false;

    const prepararImpressao = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;

        const imagens = Array.from(document.images || []);
        await Promise.all(
          imagens.map((imagem) => {
            if (imagem.complete) return Promise.resolve();
            if (typeof imagem.decode === "function") {
              return imagem.decode().catch(() => undefined);
            }
            return new Promise((resolve) => {
              imagem.addEventListener("load", resolve, { once: true });
              imagem.addEventListener("error", resolve, { once: true });
            });
          })
        );
      } catch (error) {
        console.warn("Não foi possível aguardar todos os recursos do PDF.", error);
      }

      if (cancelado) return;
      window.setTimeout(() => {
        if (!cancelado) window.print();
      }, 250);
    };

    prepararImpressao();
    return () => {
      cancelado = true;
    };
  }, [modoImpressao, loading, registro, minutaContrato]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-blue-600" size={34} />
          <p className="mt-3 text-slate-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
          <FileText className="mx-auto text-slate-400" size={42} />
          <h1 className="text-xl font-bold text-slate-900 mt-4">
            Proposta indisponível
          </h1>
          <p className="text-slate-500 mt-2">{erro}</p>
        </div>
      </div>
    );
  }

  const proposal = registro?.dados || {};
  const config = proposal?.configuracao || {};
  const items = normalizeItems(proposal);
  const cliente = safeText(
    firstValue(registro?.cliente, proposal?.cliente),
    "Cliente"
  );
  const cnpj = safeText(firstValue(registro?.cnpj, proposal?.cnpj), "");
  const numero = safeText(
    firstValue(registro?.numero_proposta, proposal?.numero_proposta),
    ""
  );
  const validade =
    firstValue(registro?.validade, proposal?.validade, "");
  const titulo = safeText(
    firstValue(proposal?.titulo, registro?.titulo),
    "Proposta Comercial de Serviços Contábeis"
  );
  const subtitulo = safeText(
    proposal?.subtitulo,
    "Soluções contábeis estruturadas para o seu negócio."
  );
  const apresentacao = safeText(
    firstValue(
      config?.apresentacaoEscritorio,
      proposal?.apresentacao_escritorio
    ),
    "Apresentação do escritório não preenchida."
  );
  const mensagem = safeText(
    proposal?.mensagem,
    "Apresentamos uma proposta personalizada para sua empresa."
  );
  const condicoes = safeText(
    firstValue(proposal?.condicoes, proposal?.condicoes_comerciais),
    "Valores e condições conforme os itens apresentados nesta proposta."
  );
  const pagamento = safeText(
    firstValue(proposal?.forma_pagamento, proposal?.pagamento),
    "A combinar"
  );
  const observacoes = safeText(
    proposal?.observacoes,
    "Sem observações."
  );

  const mensal = Number(
    firstValue(
      proposal?.valores?.mensalidade_total,
      proposal?.valor_total_mensal,
      proposal?.valor_negociado,
      proposal?.valor_tabela,
      0
    )
  );

  const pontual = Number(
    firstValue(
      proposal?.valores?.servicos_pontuais,
      proposal?.valor_servicos_pontuais,
      0
    )
  );

  const primeiroMes = Number(
    firstValue(
      proposal?.valores?.primeiro_mes,
      mensal + pontual
    )
  );

  const cor1 = config?.corPrimaria || "#174b7a";
  const cor2 = config?.corSecundaria || "#2563eb";

  const dadosAceite =
    registro?.dados?.dados_aceite ||
    registro?.dados_aceite ||
    proposal?.dados_aceite ||
    {};
  const servicosContratados = items.length
    ? items
        .map(
          (item) =>
            `${item.nome} — ${money(item.valor)} (${
              item.recorrencia === "mensal" ? "mensal" : "pontual"
            })`
        )
        .join("\n")
    : "Serviços conforme escopo apresentado na proposta.";

  const honorariosMatriz = Number(
    firstValue(
      items.find((item) => {
        const nome = String(item?.nome || "").toLowerCase();
        return (
          nome.includes("honorários contábeis") &&
          (nome.includes("matriz") || !nome.includes("filial"))
        );
      })?.valor,
      proposal?.valores?.honorario_matriz,
      proposal?.valores?.honorario_contabil_fiscal,
      0
    )
  );

  const preencherMinuta = (conteudo) => {
    const variaveis = {
      "{{numero_proposta}}": numero || "—",
      "{{cliente_razao_social}}": cliente || "—",
      "{{cliente_cnpj}}": cnpj || "—",
      "{{frente_negocio}}":
        safeText(
          firstValue(
            proposal?.frente_negocio?.nome,
            proposal?.frente_negocio_nome,
            proposal?.frente_negocio
          ),
          "—"
        ),
      "{{valor_honorarios}}": money(honorariosMatriz),
      "{{valor_mensal_total}}": money(mensal),
      "{{valor_primeiro_mes}}": money(primeiroMes),
      "{{servicos_contratados}}": servicosContratados,
      "{{forma_pagamento}}": pagamento,
      "{{representante_nome}}":
        safeText(
          firstValue(
            registro?.nome_aceite,
            dadosAceite?.nome
          ),
          "[preenchido no aceite]"
        ),
      "{{representante_cpf}}":
        safeText(
          firstValue(
            registro?.dados?.representante_cpf,
            registro?.representante_cpf,
            proposal?.representante_cpf,
            dadosAceite?.cpf
          ),
          "[preenchido no aceite]"
        ),
      "{{representante_cargo}}":
        safeText(
          firstValue(
            registro?.dados?.representante_cargo,
            registro?.representante_cargo,
            proposal?.representante_cargo,
            dadosAceite?.cargo
          ),
          "[preenchido no aceite]"
        ),
      "{{representante_email}}":
        safeText(
          firstValue(
            registro?.email_aceite,
            dadosAceite?.email
          ),
          "[preenchido no aceite]"
        ),
      "{{representante_telefone}}":
        safeText(
          firstValue(
            registro?.dados?.representante_telefone,
            registro?.representante_telefone,
            proposal?.representante_telefone,
            dadosAceite?.telefone
          ),
          "[preenchido no aceite]"
        ),
      "{{data_aceite}}": (() => {
        const dataAceite = firstValue(
          registro?.aceita_em,
          dadosAceite?.aceita_em
        );
        return dataAceite
          ? dateTimeBR(dataAceite)
          : "[registrada no aceite]";
      })(),
    };

    return Object.entries(variaveis).reduce(
      (resultado, [variavel, valor]) =>
        resultado.split(variavel).join(String(valor)),
      String(conteudo || "")
    );
  };

  const minutaAtiva =
    minutaContrato?.ativo !== false &&
    Boolean(String(minutaContrato?.conteudo || "").trim());

  const textoMinuta = minutaAtiva
    ? preencherMinuta(minutaContrato.conteudo)
    : "";

  const linhasMinuta = String(textoMinuta || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha, indice, lista) => {
      if (linha) return true;
      return indice > 0 && lista[indice - 1];
    });

  const capaPronta =
    config?.capaModo === "pronta" && Boolean(config?.capaImagem);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html,
          body {
            width: 210mm !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .proposta-publica-no-print,
          .proposta-publica-header {
            display: none !important;
          }

          .proposta-publica-main {
            width: 190mm !important;
            max-width: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            display: block !important;
          }

          .proposta-publica-main > section {
            width: 190mm !important;
            max-width: 190mm !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .pdf-cover {
            height: 277mm !important;
            min-height: 277mm !important;
            max-height: 277mm !important;
            overflow: hidden !important;
            break-after: page !important;
            page-break-after: always !important;
          }

          .pdf-page {
            padding: 8mm 10mm !important;
            break-before: auto !important;
            page-break-before: auto !important;
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          .pdf-page + .pdf-page {
            border-top: 1px solid #e2e8f0 !important;
          }

          .pdf-page:not(.pdf-contract) .rounded-2xl,
          .pdf-page:not(.pdf-contract) .rounded-xl {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .pdf-contract {
            font-size: 10pt !important;
            line-height: 1.5 !important;
            break-before: page !important;
            page-break-before: always !important;
          }

          .pdf-contract > .rounded-2xl {
            border: 0 !important;
            padding: 0 !important;
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          .contract-body {
            color: #334155 !important;
            font-size: 10pt !important;
            line-height: 1.5 !important;
          }

          .contract-title {
            text-align: center !important;
            font-size: 13pt !important;
            line-height: 1.3 !important;
            font-weight: 800 !important;
            color: #0f172a !important;
            margin: 0 0 7mm !important;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          .contract-section {
            font-size: 10.5pt !important;
            line-height: 1.35 !important;
            font-weight: 800 !important;
            color: #174b7a !important;
            margin: 5mm 0 2mm !important;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          .contract-paragraph {
            text-align: justify !important;
            text-justify: inter-word !important;
            margin: 0 0 3mm !important;
            orphans: 3;
            widows: 3;
          }

          .contract-highlight,
          .contract-service {
            margin: 0 0 2mm !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .contract-highlight {
            font-weight: 700 !important;
            color: #0f172a !important;
          }

          .contract-service {
            padding-left: 4mm !important;
            border-left: 2px solid #cbd5e1 !important;
          }

          .pdf-next-steps {
            break-before: page !important;
            page-break-before: always !important;
            padding-top: 10mm !important;
            padding-bottom: 8mm !important;
          }

          .pdf-next-steps .grid {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 4mm !important;
          }

          .pdf-next-steps .grid > div {
            padding: 4mm !important;
            min-height: 36mm !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .pdf-next-steps .grid > div > div:nth-child(2) {
            margin-top: 3mm !important;
          }

          .pdf-next-steps .grid p {
            margin-top: 1.5mm !important;
            line-height: 1.4 !important;
          }

          .pdf-acceptance {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-top: 6mm !important;
          }
        }
      `}</style>
      <header className="proposta-publica-header sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {config?.logo ? (
              <img
                src={config.logo}
                alt="Logo do escritório"
                className="max-h-9 max-w-[160px] object-contain"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-[#174b7a] text-white flex items-center justify-center">
                <Building2 size={19} />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold truncate">
                {safeText(proposal?.nome_escritorio, "Proposta Comercial")}
              </div>
              <div className="text-xs text-slate-500 truncate">{numero}</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-2 rounded-full">
            <ShieldCheck size={15} />
            Documento publicado
          </div>
        </div>
      </header>

      <main className="proposta-publica-main max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6">
        <section
          className="pdf-cover relative overflow-hidden rounded-[28px] min-h-[540px] md:min-h-[650px] text-white shadow-xl"
          style={
            capaPronta
              ? { background: "#fff" }
              : {
                  background: config?.capaImagem
                    ? `linear-gradient(135deg, rgba(15,23,42,.74), rgba(15,23,42,.46)), url(${config.capaImagem}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${cor1}, ${cor2})`,
                }
          }
        >
          {capaPronta ? (
            <img
              src={config.capaImagem}
              alt="Capa da proposta"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 p-8 md:p-14 flex flex-col justify-between">
              <div>
                {config?.logo ? (
                  <img
                    src={config.logo}
                    alt="Logo"
                    className="max-h-14 max-w-[220px] object-contain object-left brightness-0 invert"
                  />
                ) : (
                  <div className="font-bold text-xl">Seu Escritório Contábil</div>
                )}
              </div>

              <div className="max-w-3xl">
                <div className="text-xs md:text-sm tracking-[0.32em] font-semibold text-white/75">
                  PROPOSTA COMERCIAL
                </div>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mt-5">
                  {titulo}
                </h1>
                <p className="text-white/75 text-base md:text-lg mt-4">
                  {subtitulo}
                </p>

                <div className="mt-9 pt-7 border-t border-white/25 grid sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-white/60">PROPOSTA PARA</div>
                    <div className="font-bold text-xl mt-1">{cliente}</div>
                    {cnpj && <div className="text-sm text-white/70 mt-1">{cnpj}</div>}
                  </div>
                  <div>
                    <div className="text-xs text-white/60">VALIDADE</div>
                    <div className="font-bold text-xl mt-1">{dateBR(validade)}</div>
                    <div className="text-sm text-white/70 mt-1">{numero}</div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-white/65">
                Preparada especialmente para {cliente}.
              </div>
            </div>
          )}
        </section>

        <section className="pdf-page bg-white rounded-[28px] border border-slate-200 p-7 md:p-12">
          <SectionTitle number={1} title="Apresentação" />
          <h3 className="text-xl font-bold">{cliente}</h3>
          <p className="text-slate-600 mt-3">{mensagem}</p>
          <div className="mt-7 rounded-2xl bg-slate-50 border border-slate-200 p-6">
            <div className="font-semibold text-sm">Sobre o escritório</div>
            <p className="text-slate-600 mt-2 whitespace-pre-line">
              {apresentacao}
            </p>
          </div>
        </section>

        <section className="pdf-page bg-white rounded-[28px] border border-slate-200 p-7 md:p-12">
          <SectionTitle number={2} title="Escopo de serviços" />
          <p className="text-slate-500 mb-6">
            Confira os serviços contemplados nesta proposta e suas respectivas condições.
          </p>

          {items.length ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold">{item.nome}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {item.categoria} •{" "}
                      {item.recorrencia === "mensal"
                        ? "Recorrente mensal"
                        : "Serviço pontual"}
                    </div>
                  </div>
                  <div className="font-bold">{money(item.valor)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-slate-500">
              Os serviços desta proposta serão apresentados conforme a composição comercial definida.
            </div>
          )}
        </section>

        <section className="pdf-page bg-white rounded-[28px] border border-slate-200 p-7 md:p-12">
          <SectionTitle number={3} title="Investimento" />
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
              <div className="text-sm text-slate-500">Mensalidade</div>
              <div className="text-2xl font-bold mt-2">{money(mensal)}</div>
              <div className="text-xs text-slate-400 mt-1">Serviços recorrentes</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
              <div className="text-sm text-slate-500">Serviços pontuais</div>
              <div className="text-2xl font-bold mt-2">{money(pontual)}</div>
              <div className="text-xs text-slate-400 mt-1">Itens não recorrentes</div>
            </div>
            <div
              className="rounded-2xl p-6 text-white"
              style={{ background: `linear-gradient(135deg, ${cor1}, ${cor2})` }}
            >
              <div className="text-sm text-white/70">Primeiro mês</div>
              <div className="text-2xl font-bold mt-2">{money(primeiroMes)}</div>
              <div className="text-xs text-white/60 mt-1">Composição inicial</div>
            </div>
          </div>
        </section>

        <section className="pdf-page bg-white rounded-[28px] border border-slate-200 p-7 md:p-12">
          <SectionTitle number={4} title="Condições comerciais" />
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="font-semibold">Condições</div>
              <p className="text-slate-600 mt-2 whitespace-pre-line">{condicoes}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="font-semibold">Forma de pagamento</div>
              <p className="text-slate-600 mt-2">{pagamento}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="font-semibold">Observações</div>
              <p className="text-slate-600 mt-2 whitespace-pre-line">{observacoes}</p>
            </div>
            <div
              className="rounded-2xl p-5 text-white"
              style={{ background: `linear-gradient(135deg, ${cor1}, ${cor2})` }}
            >
              <div className="font-semibold">Validade da proposta</div>
              <p className="text-white/75 mt-1">
                Esta proposta é válida até {dateBR(validade)}.
              </p>
            </div>
          </div>
        </section>

        {minutaAtiva && (
          <section className="pdf-page pdf-contract bg-white rounded-[28px] border border-slate-200 p-7 md:p-12">
            <SectionTitle number="CT" title={safeText(minutaContrato?.titulo, "Contrato de Prestação de Serviços")} />

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="contract-body text-slate-700">
                {linhasMinuta.map((linha, index) => {
                  const tipo = linhaContratoTipo(linha);

                  if (tipo === "vazia") {
                    return <div key={`vazia-${index}`} className="h-2" />;
                  }

                  if (tipo === "titulo") {
                    return (
                      <div key={`titulo-${index}`} className="contract-title">
                        {linha}
                      </div>
                    );
                  }

                  if (tipo === "secao") {
                    return (
                      <div key={`secao-${index}`} className="contract-section">
                        {linha}
                      </div>
                    );
                  }

                  if (tipo === "destaque") {
                    return (
                      <div key={`destaque-${index}`} className="contract-highlight">
                        {linha}
                      </div>
                    );
                  }

                  if (tipo === "servico") {
                    return (
                      <div key={`servico-${index}`} className="contract-service">
                        {linha}
                      </div>
                    );
                  }

                  return (
                    <p key={`paragrafo-${index}`} className="contract-paragraph">
                      {linha}
                    </p>
                  );
                })}
              </div>
            </div>

            {registro?.status !== "aceita" && (
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="text-blue-600 shrink-0" size={22} />
                  <p className="text-sm leading-6 text-blue-800">
                    Os dados do representante serão preenchidos automaticamente neste contrato após o aceite digital. Os valores e serviços são originados desta proposta.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="pdf-page pdf-next-steps bg-white rounded-[28px] border border-slate-200 p-7 md:p-12">
          <SectionTitle number={5} title="Próximos passos" />
          <div className="grid md:grid-cols-3 gap-4">
            {[
              ["01", "Análise", "Analise os serviços, valores e condições apresentados."],
              ["02", "Aceite", "Após a concordância, o aceite poderá ser registrado digitalmente."],
              ["03", "Início", "O escritório realiza os procedimentos para início do atendimento."],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-2xl border border-slate-200 p-5">
                <div className="h-9 w-9 rounded-xl bg-[#174b7a] text-white flex items-center justify-center font-bold text-xs">
                  {number}
                </div>
                <div className="font-bold mt-5">{title}</div>
                <p className="text-sm text-slate-500 mt-2">{description}</p>
              </div>
            ))}
          </div>

          {registro?.status === "aceita" ? (
            <div className="pdf-acceptance mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-6">
              <div className="flex gap-3">
                <CheckCircle2 className="text-emerald-600 shrink-0" size={26} />
                <div>
                  <div className="text-lg font-bold text-emerald-900">
                    Proposta aceita com sucesso
                  </div>
                  <p className="text-sm text-emerald-700 mt-1">
                    O aceite digital desta proposta já foi registrado.
                  </p>
                  <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                      <div className="text-emerald-700">Aceite realizado por</div>
                      <div className="font-semibold text-emerald-950 mt-1">
                        {safeText(registro?.nome_aceite || dadosAceite?.nome, "—")}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                      <div className="text-emerald-700">E-mail</div>
                      <div className="font-semibold text-emerald-950 mt-1">
                        {safeText(registro?.email_aceite || dadosAceite?.email, "—")}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                      <div className="text-emerald-700">CPF do representante</div>
                      <div className="font-semibold text-emerald-950 mt-1">
                        {safeText(
                          registro?.dados?.representante_cpf ||
                            registro?.representante_cpf ||
                            proposal?.representante_cpf ||
                            dadosAceite?.cpf,
                          "—"
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                      <div className="text-emerald-700">Cargo</div>
                      <div className="font-semibold text-emerald-950 mt-1">
                        {safeText(
                          registro?.dados?.representante_cargo ||
                            registro?.representante_cargo ||
                            proposal?.representante_cargo ||
                            dadosAceite?.cargo,
                          "—"
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                      <div className="text-emerald-700">Telefone</div>
                      <div className="font-semibold text-emerald-950 mt-1">
                        {safeText(
                          registro?.dados?.representante_telefone ||
                            registro?.representante_telefone ||
                            proposal?.representante_telefone ||
                            dadosAceite?.telefone,
                          "—"
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                      <div className="text-emerald-700">Data do aceite</div>
                      <div className="font-semibold text-emerald-950 mt-1">
                        {dateTimeBR(registro?.aceita_em || dadosAceite?.aceita_em)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex gap-3">
                <ShieldCheck className="text-emerald-600 shrink-0" size={26} />
                <div className="w-full">
                  <div className="text-lg font-bold text-emerald-950">
                    Aceite digital da proposta
                  </div>
                  <p className="text-sm text-emerald-700 mt-1">
                    Preencha seus dados abaixo para registrar a concordância com
                    esta proposta.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 mt-5">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Nome completo
                      </span>
                      <input
                        type="text"
                        value={nomeAceite}
                        onChange={(event) => setNomeAceite(event.target.value)}
                        placeholder="Digite seu nome completo"
                        autoComplete="name"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        CPF
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cpfAceite}
                        onChange={(event) => setCpfAceite(event.target.value)}
                        placeholder="000.000.000-00"
                        autoComplete="off"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Cargo
                      </span>
                      <input
                        type="text"
                        value={cargoAceite}
                        onChange={(event) => setCargoAceite(event.target.value)}
                        placeholder="Ex.: Sócio administrador"
                        autoComplete="organization-title"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        E-mail
                      </span>
                      <input
                        type="email"
                        value={emailAceite}
                        onChange={(event) => setEmailAceite(event.target.value)}
                        placeholder="seuemail@empresa.com.br"
                        autoComplete="email"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Telefone
                      </span>
                      <input
                        type="tel"
                        value={telefoneAceite}
                        onChange={(event) => setTelefoneAceite(event.target.value)}
                        placeholder="(11) 99999-9999"
                        autoComplete="tel"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                      />
                    </label>
                  </div>

                  <label className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-white/70 p-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmouAceite}
                      onChange={(event) =>
                        setConfirmouAceite(event.target.checked)
                      }
                      className="mt-0.5 h-4 w-4"
                    />
                    <span className="text-sm text-slate-600">
                      Declaro que li esta proposta e concordo com os serviços,
                      valores e condições comerciais apresentados.
                    </span>
                  </label>

                  {erroAceite && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {erroAceite}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={aceitarProposta}
                    disabled={enviandoAceite}
                    className="mt-5 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {enviandoAceite ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Registrando aceite...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Aceitar proposta
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="text-center text-xs text-slate-400 py-5">
          {numero} • Documento comercial
        </footer>
      </main>
    </div>
  );
}
