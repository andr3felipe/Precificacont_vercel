export const formatBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const formatNumber = (v) =>
  Number(v || 0).toLocaleString("pt-BR");

export const roleLabel = (role) =>
  ({
    admin: "Administrador",
    diretoria: "Diretoria",
    comercial: "Comercial",
  }[role] || role || "—");

export const statusInfo = {
  rascunho: {
    label: "Rascunho",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },

  calculado: {
    label: "Calculado",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },

  aguardando_aprovacao: {
    label: "Aguardando aprovação",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },

  aprovado: {
    label: "Aprovado",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },

  proposta_gerada: {
    label: "Proposta gerada",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },

  fechado: {
    label: "Fechado",
    className: "bg-green-50 text-green-700 border-green-200",
  },

  perdido: {
    label: "Perdido",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const REGIMES = [
  "MEI",
  "Simples Nacional",
  "Lucro Presumido",
  "Lucro Real",
];

export const ATIVIDADES = [
  "Serviços",
  "Comércio",
  "Serviços + Comércio",
];

/**
 * Retorna todas as simulações salvas no navegador.
 */
export const getSimulacoes = () => {
  try {
    const dados = localStorage.getItem("precificacont_simulacoes");

    if (!dados) {
      return [];
    }

    const parsed = JSON.parse(dados);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Erro ao carregar simulações:", error);
    return [];
  }
};

/**
 * Salva uma nova simulação.
 */
export const salvarSimulacao = (simulacao) => {
  try {
    const atuais = getSimulacoes();

    const novaSimulacao = {
      id:
        simulacao.id ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,

      created_date:
        simulacao.created_date || new Date().toISOString(),

      status: simulacao.status || "calculado",

      ...simulacao,
    };

    const atualizadas = [novaSimulacao, ...atuais];

    localStorage.setItem(
      "precificacont_simulacoes",
      JSON.stringify(atualizadas)
    );

    return novaSimulacao;
  } catch (error) {
    console.error("Erro ao salvar simulação:", error);
    throw error;
  }
};

/**
 * Atualiza uma simulação existente.
 */
export const atualizarSimulacao = (id, alteracoes) => {
  try {
    const atuais = getSimulacoes();

    const atualizadas = atuais.map((simulacao) =>
      simulacao.id === id
        ? {
            ...simulacao,
            ...alteracoes,
            updated_date: new Date().toISOString(),
          }
        : simulacao
    );

    localStorage.setItem(
      "precificacont_simulacoes",
      JSON.stringify(atualizadas)
    );

    return atualizadas.find((item) => item.id === id) || null;
  } catch (error) {
    console.error("Erro ao atualizar simulação:", error);
    throw error;
  }
};

/**
 * Exclui uma simulação.
 */
export const excluirSimulacao = (id) => {
  try {
    const atuais = getSimulacoes();

    const atualizadas = atuais.filter(
      (simulacao) => simulacao.id !== id
    );

    localStorage.setItem(
      "precificacont_simulacoes",
      JSON.stringify(atualizadas)
    );

    return true;
  } catch (error) {
    console.error("Erro ao excluir simulação:", error);
    return false;
  }
};