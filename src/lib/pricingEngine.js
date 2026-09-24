export const ENGINE_VERSION = "2026.9";

/* =========================================================
   PRECIFICACONT — MOTOR CENTRAL DE PRECIFICAÇÃO
   Versão 2026.9

   PRINCÍPIOS:
   - Base nacional por faturamento / atividade / regime
   - Volume fiscal com componente financeiro próprio
   - Inteligência regional por UF
   - DP calculado separadamente
   - Filiais calculadas separadamente
   - Complexidades operacionais calculadas separadamente
========================================================= */

/* =========================================================
   MATRIZ BASE
========================================================= */

export const MATRIX = [
  { max: 15000, servicos: 500, comercio: 650, industria: 750, misto: 850 },
  { max: 30000, servicos: 650, comercio: 800, industria: 950, misto: 1050 },
  { max: 60000, servicos: 800, comercio: 1000, industria: 1200, misto: 1300 },
  { max: 100000, servicos: 1000, comercio: 1250, industria: 1500, misto: 1650 },
  { max: 150000, servicos: 1200, comercio: 1500, industria: 1800, misto: 2000 },
  { max: 300000, servicos: 1500, comercio: 1900, industria: 2300, misto: 2550 },
  { max: 400000, servicos: 1850, comercio: 2350, industria: 2850, misto: 3150 },
  { max: 500000, servicos: 2100, comercio: 2700, industria: 3250, misto: 3600 },
  { max: 1000000, servicos: 2700, comercio: 3500, industria: 4300, misto: 4750 },
  { max: 2000000, servicos: 3600, comercio: 4700, industria: 5800, misto: 6400 },
  { max: 4000000, servicos: 4800, comercio: 6300, industria: 7800, misto: 8600 },
  { max: 8000000, servicos: 6500, comercio: 8500, industria: 10500, misto: 11600 },
  { max: 15000000, servicos: 8500, comercio: 11000, industria: 13500, misto: 15000 },
  { max: 30000000, servicos: 11000, comercio: 14500, industria: 18000, misto: 20000 },
  { max: Infinity, servicos: 14000, comercio: 18500, industria: 23000, misto: 25500 },
];

/* =========================================================
   MATRIZ LUCRO PRESUMIDO — 2026.8

   Matriz própria por faturamento e atividade.
   Substitui o antigo acréscimo fixo de 12% sobre a MATRIX.

   IMPORTANTE:
   Volume fiscal, UF, DP, filiais e complexidades continuam
   calculados separadamente e não estão embutidos nesta base.
========================================================= */

export const LUCRO_PRESUMIDO = [
  { max: 15000, servicos: 625, comercio: 810, industria: 940, misto: 1060 },
  { max: 30000, servicos: 810, comercio: 1000, industria: 1190, misto: 1310 },
  { max: 60000, servicos: 1040, comercio: 1300, industria: 1560, misto: 1690 },
  { max: 100000, servicos: 1300, comercio: 1630, industria: 1950, misto: 2150 },
  { max: 150000, servicos: 1620, comercio: 2030, industria: 2430, misto: 2700 },
  { max: 300000, servicos: 2030, comercio: 2570, industria: 3110, misto: 3440 },
  { max: 400000, servicos: 2590, comercio: 3290, industria: 3990, misto: 4410 },
  { max: 500000, servicos: 2940, comercio: 3780, industria: 4550, misto: 5040 },
  { max: 1000000, servicos: 3650, comercio: 4700, industria: 5800, misto: 6400 },
  { max: 2000000, servicos: 4860, comercio: 6350, industria: 7830, misto: 8640 },
  { max: 4000000, servicos: 6480, comercio: 8500, industria: 10500, misto: 11600 },
  { max: 8000000, servicos: 8780, comercio: 11500, industria: 14200, misto: 15700 },
  { max: 15000000, servicos: 11500, comercio: 14900, industria: 18200, misto: 20300 },
  { max: 30000000, servicos: 14900, comercio: 19600, industria: 24300, misto: 27000 },
  { max: Infinity, servicos: 18900, comercio: 25000, industria: 31100, misto: 34400 },
];

/* =========================================================
   MATRIZ LUCRO REAL — 2026.9

   Mantém as faixas já validadas até R$ 2 milhões/mês
   e cria progressão para empresas de maior porte.

   Volume, DP, UF, filiais e complexidades permanecem
   independentes desta matriz.
========================================================= */

export const LUCRO_REAL = [
  { max: 15000, servicos: 1000, comercio: 1200, industria: 1350, misto: 1500 },
  { max: 30000, servicos: 1250, comercio: 1450, industria: 1650, misto: 1800 },
  { max: 60000, servicos: 1550, comercio: 1800, industria: 2050, misto: 2250 },
  { max: 100000, servicos: 1900, comercio: 2200, industria: 2500, misto: 2750 },
  { max: 150000, servicos: 2300, comercio: 2700, industria: 3100, misto: 3400 },
  { max: 300000, servicos: 2900, comercio: 3400, industria: 3900, misto: 4300 },
  { max: 500000, servicos: 3900, comercio: 4600, industria: 5300, misto: 5850 },
  { max: 1000000, servicos: 5200, comercio: 6100, industria: 7100, misto: 7800 },
  { max: 2000000, servicos: 7000, comercio: 8200, industria: 9500, misto: 10500 },
  { max: 4000000, servicos: 9000, comercio: 10500, industria: 12200, misto: 13500 },
  { max: 8000000, servicos: 11500, comercio: 13500, industria: 15800, misto: 17500 },
  { max: 15000000, servicos: 14500, comercio: 17000, industria: 20000, misto: 22000 },
  { max: 30000000, servicos: 18000, comercio: 21500, industria: 25500, misto: 28000 },
  { max: Infinity, servicos: 22500, comercio: 27000, industria: 32000, misto: 35000 },
];

/* =========================================================
   BASE REGIONAL — DADOS OFICIAIS 2025

   RAIS / MTE:
   Remuneração mediana formal por UF.

   IBGE / PNAD:
   Rendimento domiciliar per capita por UF.

   METODOLOGIA PRECIFICACONT:
   70% RAIS + 30% IBGE.

   Apenas índices POSITIVOS afetam automaticamente
   a precificação nesta versão.

   Estados abaixo da média permanecem com fator 0
   para não reduzir artificialmente o honorário.
========================================================= */

export const REGIONAL_DATA = {
  AC: { rais: 2521.60, ibge: 1392 },
  AL: { rais: 2174.04, ibge: 1422 },
  AP: { rais: 2716.93, ibge: 1697 },
  AM: { rais: 2613.59, ibge: 1484 },
  BA: { rais: 2199.41, ibge: 1465 },
  CE: { rais: 2038.92, ibge: 1390 },
  DF: { rais: 3350.00, ibge: 4538 },
  ES: { rais: 2633.93, ibge: 2249 },
  GO: { rais: 2603.00, ibge: 2407 },
  MA: { rais: 2293.02, ibge: 1219 },
  MT: { rais: 3000.00, ibge: 2335 },
  MS: { rais: 2816.60, ibge: 2454 },
  MG: { rais: 2563.54, ibge: 2353 },
  PA: { rais: 2416.67, ibge: 1420 },
  PB: { rais: 2131.97, ibge: 1543 },
  PR: { rais: 2902.35, ibge: 2762 },
  PE: { rais: 2209.47, ibge: 1600 },
  PI: { rais: 2147.93, ibge: 1546 },
  RJ: { rais: 2566.80, ibge: 2794 },
  RN: { rais: 2103.18, ibge: 1819 },
  RS: { rais: 3026.28, ibge: 2839 },
  RO: { rais: 2500.00, ibge: 1991 },
  RR: { rais: 2787.81, ibge: 1878 },
  SC: { rais: 3095.00, ibge: 2809 },
  SP: { rais: 3067.89, ibge: 2956 },
  SE: { rais: 2203.32, ibge: 1697 },
  TO: { rais: 2652.36, ibge: 2036 },
};

export const REGIONAL_REFERENCE = {
  raisBrasil: 2740.56,
  ibgeBrasil: 2316,
  pesoRais: 0.70,
  pesoIbge: 0.30,
  amortecimento: 0.35,
  limitePositivo: 0.15,
};

/* =========================================================
   UTILITÁRIOS
========================================================= */

export const numberValue = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  let text = String(value).trim();

  if (!text) return 0;

  if (text.includes(",")) {
    text = text
      .replace(/R\$/g, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
  } else {
    text = text
      .replace(/R\$/g, "")
      .replace(/\s/g, "");
  }

  const parsed = Number(text);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

export const roundMoney = (value) =>
  Math.round(numberValue(value));

/* =========================================================
   ATIVIDADE
========================================================= */

export const activityKey = (atividade) => {
  if (atividade === "Serviços") {
    return "servicos";
  }

  if (atividade === "Comércio") {
    return "comercio";
  }

  if (atividade === "Indústria") {
    return "industria";
  }

  return "misto";
};

/* =========================================================
   BASE CONTÁBIL / FISCAL
========================================================= */

export const getMatrixBase = (
  regime,
  atividade,
  faturamento
) => {
  const revenue =
    numberValue(faturamento);

  if (
    !regime ||
    !atividade ||
    revenue <= 0
  ) {
    return 0;
  }

  if (regime === "MEI") {
    return 150;
  }

  const key =
    activityKey(atividade);

  const matrix =
    regime === "Lucro Real"
      ? LUCRO_REAL
      : regime === "Lucro Presumido"
        ? LUCRO_PRESUMIDO
        : MATRIX;

  const faixa =
    matrix.find(
      (item) =>
        revenue <= item.max
    ) ||
    matrix[matrix.length - 1];

  let base =
    faixa[key] ||
    faixa.servicos;

  if (
    regime ===
    "Outro / Especial"
  ) {
    base *= 1.18;
  }

  return Math.round(base);
};

/* =========================================================
   ÍNDICE REGIONAL
========================================================= */

export const normalizeUF = (uf) => {
  return String(uf || "")
    .trim()
    .toUpperCase();
};

export const getRegionalFactor = (uf) => {
  const codigo =
    normalizeUF(uf);

  const dados =
    REGIONAL_DATA[codigo];

  if (!dados) {
    return {
      uf: codigo,
      encontrado: false,
      indiceEconomico: 1,
      ajusteBruto: 0,
      factor: 0,
      percentual: 0,
      rais: null,
      ibge: null,
    };
  }

  const indiceRais =
    dados.rais /
    REGIONAL_REFERENCE.raisBrasil;

  const indiceIbge =
    dados.ibge /
    REGIONAL_REFERENCE.ibgeBrasil;

  const indiceEconomico =
    indiceRais *
      REGIONAL_REFERENCE.pesoRais +
    indiceIbge *
      REGIONAL_REFERENCE.pesoIbge;

  const ajusteBruto =
    (indiceEconomico - 1) *
    REGIONAL_REFERENCE.amortecimento;

  /*
    Nesta versão, Estados abaixo da média
    NÃO reduzem automaticamente o preço.
  */
  const factor =
    Math.max(
      0,
      Math.min(
        ajusteBruto,
        REGIONAL_REFERENCE.limitePositivo
      )
    );

  return {
    uf: codigo,
    encontrado: true,
    indiceEconomico,
    ajusteBruto,
    factor,
    percentual:
      Number(
        (factor * 100).toFixed(2)
      ),
    rais: dados.rais,
    ibge: dados.ibge,
  };
};

export const getRegionalAdjustment = (
  base,
  uf
) => {
  const regional =
    getRegionalFactor(uf);

  const valor =
    numberValue(base) *
    regional.factor;

  return {
    ...regional,
    valor:
      roundMoney(valor),
  };
};

/* =========================================================
   DEPARTAMENTO PESSOAL
========================================================= */

export const getDP = (
  colaboradores,
  valorManual
) => {
  const qtd =
    numberValue(colaboradores);

  if (qtd <= 0) {
    return {
      quantidade: 0,
      valorUnitario: 0,
      total: 0,
      faixa:
        "Sem colaboradores",
      manual: false,
      precisaValorManual: false,
      manualRequired: false,
    };
  }

  let valorUnitario = 0;
  let faixa = "";
  let manual = false;

  if (qtd <= 5) {
    valorUnitario = 100;
    faixa =
      "1 a 5 colaboradores";
  } else if (qtd <= 10) {
    valorUnitario = 90;
    faixa =
      "6 a 10 colaboradores";
  } else if (qtd <= 20) {
    valorUnitario = 80;
    faixa =
      "11 a 20 colaboradores";
  } else if (qtd <= 40) {
    valorUnitario = 75;
    faixa =
      "21 a 40 colaboradores";
  } else if (qtd <= 60) {
    valorUnitario = 70;
    faixa =
      "41 a 60 colaboradores";
  } else if (qtd <= 100) {
    valorUnitario = 60;
    faixa =
      "61 a 100 colaboradores";
  } else {
    manual = true;
    faixa =
      "Acima de 100 colaboradores";

    valorUnitario =
      numberValue(
        valorManual
      );
  }

  const precisaValorManual =
    qtd > 100 &&
    valorUnitario <= 0;

  return {
    quantidade: qtd,
    valorUnitario,
    total:
      qtd * valorUnitario,
    faixa,
    manual,
    precisaValorManual,
    manualRequired:
      precisaValorManual,
  };
};

/* =========================================================
   VOLUME DOCUMENTAL

   METODOLOGIA 2026.7 — PRESERVADA

   O volume possui adicional financeiro próprio,
   progressivo e contínuo.

   Pontos de referência:
   30       -> R$ 0
   100      -> R$ 50
   500      -> R$ 150
   1.000    -> R$ 250
   2.500    -> R$ 500
   5.000    -> R$ 800
   10.000   -> R$ 1.400
   25.000   -> R$ 3.000
   50.000   -> R$ 5.000

   Acima de 50.000:
   + R$ 0,06 por documento adicional.

   Entre os pontos é utilizada interpolação linear,
   evitando saltos artificiais.
========================================================= */

export const DOCUMENT_VOLUME_POINTS = [
  { docs: 0, valor: 0 },
  { docs: 30, valor: 0 },
  { docs: 100, valor: 50 },
  { docs: 500, valor: 150 },
  { docs: 1000, valor: 250 },
  { docs: 2500, valor: 500 },
  { docs: 5000, valor: 800 },
  { docs: 10000, valor: 1400 },
  { docs: 25000, valor: 3000 },
  { docs: 50000, valor: 5000 },
];

export const getDocumentAdjustment = (
  total
) => {
  const docs =
    Math.max(
      0,
      numberValue(total)
    );

  if (docs <= 30) {
    return 0;
  }

  for (
    let i = 1;
    i <
    DOCUMENT_VOLUME_POINTS.length;
    i += 1
  ) {
    const anterior =
      DOCUMENT_VOLUME_POINTS[
        i - 1
      ];

    const atual =
      DOCUMENT_VOLUME_POINTS[i];

    if (docs <= atual.docs) {
      const intervaloDocs =
        atual.docs -
        anterior.docs;

      const intervaloValor =
        atual.valor -
        anterior.valor;

      const posicao =
        intervaloDocs > 0
          ? (
              docs -
              anterior.docs
            ) /
            intervaloDocs
          : 0;

      const valor =
        anterior.valor +
        intervaloValor *
          posicao;

      return roundMoney(valor);
    }
  }

  const ultimo =
    DOCUMENT_VOLUME_POINTS[
      DOCUMENT_VOLUME_POINTS.length -
        1
    ];

  const excedente =
    docs -
    ultimo.docs;

  return roundMoney(
    ultimo.valor +
      excedente * 0.06
  );
};

/*
   Mantido por compatibilidade com telas
   ou memórias antigas que ainda consultem
   documentFactor.

   O volume NÃO entra mais
   no operationalFactor.
*/
export const getDocumentFactor = (
  total
) => {
  const docs =
    numberValue(total);

  if (docs <= 30) return 0;
  if (docs <= 75) return 0.02;
  if (docs <= 150) return 0.04;
  if (docs <= 300) return 0.07;
  if (docs <= 600) return 0.1;
  if (docs <= 1000) return 0.14;
  if (docs <= 2000) return 0.18;
  if (docs <= 4000) return 0.23;
  if (docs <= 7500) return 0.3;
  if (docs <= 15000) return 0.4;
  if (docs <= 25000) return 0.5;
  if (docs <= 50000) return 0.65;

  return 0.8;
};

/* =========================================================
   MOVIMENTAÇÃO BANCÁRIA
========================================================= */

export const getBankFactor = (
  movimentacao,
  contas
) => {
  let factor = 0;

  /*
    Movimentação NORMAL faz parte
    da operação padrão.
  */

  if (
    movimentacao === "normal"
  ) {
    factor += 0;
  }

  if (
    movimentacao === "alta"
  ) {
    factor += 0.04;
  }

  if (
    movimentacao ===
    "muito_alta"
  ) {
    factor += 0.07;
  }

  const qtdContas =
    numberValue(contas);

  if (
    qtdContas >= 3 &&
    qtdContas <= 5
  ) {
    factor += 0.02;
  }

  if (qtdContas > 5) {
    factor += 0.04;
  }

  return Math.min(
    factor,
    0.1
  );
};

/* =========================================================
   FILIAIS
========================================================= */

export const getBranchFactor = () => {
  /*
    REGRA LEGADA DESATIVADA.

    Filiais não geram percentual
    sobre a matriz.

    Cada filial é calculada
    individualmente.
  */

  return 0;
};

export const getBranchesPricing = (
  filiais = []
) => {
  const lista =
    Array.isArray(filiais)
      ? filiais
      : [];

  const detalhes = lista
    .map(
      (
        filial,
        index
      ) => {
        const faturamento =
          numberValue(
            filial?.faturamento
          );

        const regime =
          filial?.regime || "";

        const atividade =
          filial?.atividade || "";

        const centralizada =
          filial?.centralizada !==
          false;

        if (
          faturamento <= 0
        ) {
          return {
            index,
            faturamento: 0,
            regime,
            atividade,
            centralizada,
            baseIntegral: 0,
            percentualAplicado: 0,
            valor: 0,
            valida: false,
          };
        }

        const baseIntegral =
          getMatrixBase(
            regime,
            atividade,
            faturamento
          );

        const percentualAplicado =
          centralizada
            ? 0.5
            : 1;

        const valor =
          baseIntegral *
          percentualAplicado;

        return {
          index,
          faturamento,
          regime,
          atividade,
          centralizada,
          baseIntegral,
          percentualAplicado,
          valor,
          valida:
            baseIntegral > 0,
        };
      }
    )
    .filter(
      (filial) =>
        filial.valida
    );

  const total =
    detalhes.reduce(
      (
        soma,
        filial
      ) =>
        soma +
        filial.valor,
      0
    );

  return {
    quantidade:
      detalhes.length,

    total:
      roundMoney(total),

    detalhes,
  };
};

/* =========================================================
   OPERAÇÕES
========================================================= */

export const getOperationFactor = (
  form
) => {
  let factor = 0;

  if (
    form.vendeOutrosEstados
  ) {
    factor += 0.03;
  }

  if (
    form.compraOutrosEstados
  ) {
    factor += 0.03;
  }

  if (form.vendeExterior) {
    factor += 0.07;

    const docs =
      numberValue(
        form.documentosExportacao
      );

    if (docs > 20) {
      factor += 0.02;
    }

    if (docs > 100) {
      factor += 0.02;
    }
  }

  if (form.compraExterior) {
    factor += 0.07;

    const docs =
      numberValue(
        form.documentosImportacao
      );

    if (docs > 20) {
      factor += 0.02;
    }

    if (docs > 100) {
      factor += 0.02;
    }
  }

  return Math.min(
    factor,
    0.22
  );
};

/* =========================================================
   COMPLEXIDADES
========================================================= */

export const getComplexityFactor = (
  form
) => {
  let factor = 0;

  if (form.retencoes) {
    factor += 0.02;
  }

  if (
    form.substituicaoTributaria
  ) {
    factor += 0.03;
  }

  if (
    form.multiplasAtividades
  ) {
    factor += 0.03;
  }

  if (form.folhaComplexa) {
    factor += 0.04;
  }

  if (
    form.admissoesDemissoes
  ) {
    factor += 0.03;
  }

  if (form.parcelamentos) {
    factor += 0.02;
  }

  if (
    form.obrigacoesEspecificas
  ) {
    factor += 0.04;
  }

  if (
    form.beneficiosFiscais
  ) {
    factor += 0.03;
  }

  return Math.min(
    factor,
    0.2
  );
};

/* =========================================================
   CONFIANÇA
========================================================= */

export const getConfidence = (
  form
) => {
  let points = 0;

  if (form.regime) {
    points++;
  }

  if (form.atividade) {
    points++;
  }

  if (
    numberValue(
      form.faturamento
    ) > 0
  ) {
    points++;
  }

  if (form.uf) {
    points++;
  }

  if (
    form.colaboradores !== ""
  ) {
    points++;
  }

  if (
    form.notasSaida !== "" ||
    form.notasEntrada !== ""
  ) {
    points++;
  }

  if (
    Array.isArray(
      form.filiaisDetalhadas
    )
      ? true
      : form.filiais !== ""
  ) {
    points++;
  }

  if (
    form.contasBancarias !== ""
  ) {
    points++;
  }

  if (points >= 7) {
    return "ALTA";
  }

  if (points >= 5) {
    return "BOA";
  }

  return "INDICATIVA";
};

/* =========================================================
   MOTOR PRINCIPAL
========================================================= */

export const calculatePricing = (
  form
) => {
  const faturamento =
    numberValue(
      form.faturamento
    );

  const base =
    getMatrixBase(
      form.regime,
      form.atividade,
      faturamento
    );

  const regional =
    getRegionalAdjustment(
      base,
      form.uf
    );

  const dp =
    getDP(
      form.colaboradores,
      form.valorColaboradorManual
    );

  const filiaisDetalhadas =
    Array.isArray(
      form.filiaisDetalhadas
    )
      ? form.filiaisDetalhadas
      : [];

  const branches =
    getBranchesPricing(
      filiaisDetalhadas
    );

  const totalDocumentos =
    numberValue(
      form.notasSaida
    ) +
    numberValue(
      form.notasEntrada
    ) +
    numberValue(
      form.outrosDocumentos
    );

  /* =======================================================
     MEI
  ======================================================= */

  if (
    form.regime === "MEI"
  ) {
    const indice =
      150 +
      branches.total +
      dp.total;

    return {
      success:
        !dp.precisaValorManual,

      error:
        dp.precisaValorManual
          ? "Informe o valor por colaborador para empresas com mais de 100 colaboradores."
          : null,

      engineVersion:
        ENGINE_VERSION,

      base: 150,

      regional: {
        ...regional,
        valor: 0,
        factor: 0,
        percentual: 0,
      },

      regionalFactor: 0,

      regionalAdjustment: 0,

      dp,

      totalDocumentos,

      documentFactor: 0,

      documentAdjustment: 0,

      bankFactor: 0,

      branchFactor: 0,

      branches,

      branchTotal:
        branches.total,

      operationFactor: 0,

      complexityFactor: 0,

      operationalFactor: 0,

      ajusteOperacional: 0,

      contabilFiscal:
        150 +
        branches.total,

      indice,

      competitivo:
        indice * 0.92,

      recomendado:
        indice,

      premium:
        indice * 1.12,

      superior:
        indice * 1.12,

      nivel:
        dp.quantidade > 0
          ? "Estrutura com Departamento Pessoal"
          : "Baixa complexidade",

      confidence:
        getConfidence(form),
    };
  }

  /* =======================================================
     VOLUME FISCAL
  ======================================================= */

  const documentAdjustment =
    getDocumentAdjustment(
      totalDocumentos
    );

  /*
    Mantido no retorno por compatibilidade.

    Não participa mais diretamente
    do operationalFactor.
  */
  const documentFactor =
    getDocumentFactor(
      totalDocumentos
    );

  /* =======================================================
     OUTROS FATORES OPERACIONAIS
  ======================================================= */

  const bankFactor =
    getBankFactor(
      form.movimentacaoBancaria,
      form.contasBancarias
    );

  const branchFactor =
    getBranchFactor();

  const operationFactor =
    getOperationFactor(form);

  const complexityFactor =
    getComplexityFactor(form);

  /*
    IMPORTANTE:

    Volume documental não entra mais
    nesta soma.

    Ele possui componente financeiro
    próprio: documentAdjustment.

    DP e filiais também permanecem
    separados.
  */

  const operationalFactor =
    Math.min(
      bankFactor +
        branchFactor +
        operationFactor +
        complexityFactor,
      0.45
    );

  const ajusteOperacional =
    base *
    operationalFactor;

  /*
    COMPOSIÇÃO CONTÁBIL / FISCAL:

    base nacional
    + ajuste regional
    + volume documental
    + demais complexidades operacionais
    + filiais
  */

  const contabilFiscal =
    base +
    regional.valor +
    documentAdjustment +
    ajusteOperacional +
    branches.total;

  /*
    ÍNDICE PRECIFICACONT:

    contábil/fiscal
    + Departamento Pessoal
  */

  const indice =
    contabilFiscal +
    dp.total;

  const competitivo =
    indice *
    0.92;

  const premium =
    indice *
    1.12;

  let nivel =
    "Baixa complexidade";

  if (
    operationalFactor >
    0.04
  ) {
    nivel =
      "Complexidade moderada";
  }

  if (
    operationalFactor >
    0.12
  ) {
    nivel =
      "Complexidade relevante";
  }

  if (
    operationalFactor >
    0.25
  ) {
    nivel =
      "Alta complexidade";
  }

  return {
    success:
      !dp.precisaValorManual,

    error:
      dp.precisaValorManual
        ? "Informe o valor por colaborador para empresas com mais de 100 colaboradores."
        : null,

    engineVersion:
      ENGINE_VERSION,

    base,

    regional,

    regionalFactor:
      regional.factor,

    regionalAdjustment:
      regional.valor,

    dp,

    totalDocumentos,

    documentFactor,

    documentAdjustment,

    bankFactor,

    branchFactor,

    branches,

    branchTotal:
      branches.total,

    operationFactor,

    complexityFactor,

    operationalFactor,

    ajusteOperacional,

    contabilFiscal,

    indice,

    competitivo,

    recomendado:
      indice,

    premium,

    superior:
      premium,

    nivel,

    confidence:
      getConfidence(form),
  };
};

/* =========================================================
   REPRECIFICAÇÃO
========================================================= */

export const calculateRepricing = (
  form
) => {
  const pricing =
    calculatePricing(form);

  if (!pricing.success) {
    return pricing;
  }

  const honorarioAtual =
    numberValue(
      form.honorarioAtual
    );

  const referencia =
    pricing.indice;

  const diferencaMensal =
    referencia -
    honorarioAtual;

  const diferencaAnual =
    diferencaMensal *
    12;

  const diferencaPercentual =
    honorarioAtual > 0
      ? (
          diferencaMensal /
          honorarioAtual
        ) * 100
      : 0;

  let situacao =
    "Sem honorário atual";

  if (
    honorarioAtual > 0
  ) {
    if (
      diferencaPercentual >
      10
    ) {
      situacao =
        "Abaixo da referência";
    } else if (
      diferencaPercentual <
      -10
    ) {
      situacao =
        "Acima da referência";
    } else {
      situacao =
        "Dentro da referência";
    }
  }

  return {
    ...pricing,

    honorarioAtual,

    diferencaMensal,

    diferencaAnual,

    diferencaPercentual:
      Number(
        diferencaPercentual.toFixed(
          1
        )
      ),

    situacao,
  };
};