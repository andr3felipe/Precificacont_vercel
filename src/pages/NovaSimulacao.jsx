import React, { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Building2,
  FileText,
  Users,
  MapPin,
  Globe2,
  Landmark,
  GitBranch,
  CheckCircle2,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Sparkles,
  Search,
  Plus,
  Trash2,
  BadgeDollarSign,
  AlertTriangle,
  X,
} from "lucide-react";

import {
  ENGINE_VERSION,
  calculatePricing,
  numberValue,
  getConfidence,
} from "../lib/pricingEngine";

import { supabase } from "../supabase";
import SelectPrecificaCont from "../components/SelectPrecificaCont";


const SERVICOS_PADRAO_FALLBACK = [
  {
    "id": "legalizacao-abertura-de-cnpj-spe-incorporadora",
    "nome": "ABERTURA DE CNPJ-SPE INCORPORADORA",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1350.0,
    "preco_superior": 0,
    "preco_praticado": 1350.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-abertura-de-empresa-oab",
    "nome": "ABERTURA DE EMPRESA OAB",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-abertura-de-empresa-sp",
    "nome": "ABERTURA DE EMPRESA SP",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 850.0,
    "preco_superior": 0,
    "preco_praticado": 850.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-abertura-de-mei-sp",
    "nome": "ABERTURA DE MEI SP",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 200.0,
    "preco_superior": 0,
    "preco_praticado": 200.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-alteracao-apenas-do-cnpj-ccm-cadesp",
    "nome": "ALTERAÇÃO APENAS DO CNPJ/CCM/CADESP",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-alteracao-contratual-mei-sp",
    "nome": "ALTERAÇÃO CONTRATUAL MEI SP",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 200.0,
    "preco_superior": 0,
    "preco_praticado": 200.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-alteracao-contratual-sp",
    "nome": "ALTERAÇÃO CONTRATUAL SP",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 850.0,
    "preco_superior": 0,
    "preco_praticado": 850.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-alteracao-de-empresa-na-oab",
    "nome": "ALTERAÇÃO DE EMPRESA NA OAB",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-alvara-de-funcionamento-municipal",
    "nome": "ALVARA DE FUNCIONAMENTO MUNICIPAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 480.0,
    "preco_superior": 0,
    "preco_praticado": 480.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-associacoes-esportivas-culturais-comunitarias-etc",
    "nome": "Associações (Esportivas, Culturais, Comunitárias, etc)",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 2500.0,
    "preco_superior": 0,
    "preco_praticado": 2500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-baixa-de-registro-em-conselho",
    "nome": "BAIXA DE REGISTRO EM CONSELHO",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 700.0,
    "preco_superior": 0,
    "preco_praticado": 700.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-cadastro-de-isencao-de-itbi",
    "nome": "CADASTRO DE ISENÇÃO DE ITBI",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1500.0,
    "preco_superior": 0,
    "preco_praticado": 1500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-cadastro-nacional-de-obra-cno",
    "nome": "CADASTRO NACIONAL DE OBRA (CNO)",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-cadastro-pj-em-outros-municipios-cpom",
    "nome": "CADASTRO PJ EM OUTROS MUNICIPIOS (CPOM)",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1053.0,
    "preco_superior": 0,
    "preco_praticado": 1053.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-cancelamento-de-empresa",
    "nome": "CANCELAMENTO DE EMPRESA",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-cancelamento-de-empresa-na-oab",
    "nome": "CANCELAMENTO DE EMPRESA NA OAB",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-cancelamento-de-filial-alteracao-contratual",
    "nome": "CANCELAMENTO DE FILIAL (ALTERAÇÃO CONTRATUAL)",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-cancelamento-de-inscricao-municipal",
    "nome": "CANCELAMENTO DE INSCRIÇÃO MUNICIPAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 500.0,
    "preco_superior": 0,
    "preco_praticado": 500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-cancelamento-de-mei-sp",
    "nome": "CANCELAMENTO DE MEI SP",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-certidao-da-fazenda-estadual",
    "nome": "CERTIDÃO DA FAZENDA ESTADUAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 205.0,
    "preco_superior": 0,
    "preco_praticado": 205.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-certidao-de-inteiro-teor",
    "nome": "CERTIDÃO DE INTEIRO TEOR",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 250.0,
    "preco_superior": 0,
    "preco_praticado": 250.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-cli-certificado-de-licenciamento-integrado",
    "nome": "CLI (CERTIFICADO DE LICENCIAMENTO INTEGRADO)",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 500.0,
    "preco_superior": 0,
    "preco_praticado": 500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-condominios",
    "nome": "CONDOMÍNIOS",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1500.0,
    "preco_superior": 0,
    "preco_praticado": 1500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-conselho-de-classes",
    "nome": "CONSELHO DE CLASSES",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 2200.0,
    "preco_superior": 0,
    "preco_praticado": 2200.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-cooperativas",
    "nome": "COOPERATIVAS",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1500.0,
    "preco_superior": 0,
    "preco_praticado": 1500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-desenquadramento-de-mei",
    "nome": "DESENQUADRAMENTO DE MEI",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 850.0,
    "preco_superior": 0,
    "preco_praticado": 850.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-desenquadramento-de-me-ou-epp-na-junta-comercial",
    "nome": "DESENQUADRAMENTO DE ME OU EPP NA JUNTA COMERCIAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1500.0,
    "preco_superior": 0,
    "preco_praticado": 1500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-emissao-de-certidoes",
    "nome": "EMISSÃO DE CERTIDÕES",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 200.0,
    "preco_superior": 0,
    "preco_praticado": 200.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-emissao-de-certidoes-2",
    "nome": "EMISSÃO DE CERTIDÕES",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 200.0,
    "preco_superior": 0,
    "preco_praticado": 200.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-enquadramento-unipessoal",
    "nome": "ENQUADRAMENTO UNIPESSOAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 800.0,
    "preco_superior": 0,
    "preco_praticado": 800.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-entidades-sem-fins-lucrativos-igrejas",
    "nome": "ENTIDADES SEM FINS LUCRATIVOS - IGREJAS",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 2500.0,
    "preco_superior": 0,
    "preco_praticado": 2500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-filial",
    "nome": "FILIAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1350.0,
    "preco_superior": 0,
    "preco_praticado": 1350.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-filial-de-empresa-estrangeira",
    "nome": "FILIAL DE EMPRESA ESTRANGEIRA",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1800.0,
    "preco_superior": 0,
    "preco_praticado": 1800.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-fundacoes-via-ministerio-publico",
    "nome": "FUNDAÇÕES (VIA MINISTÉRIO PÚBLICO)",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 2500.0,
    "preco_superior": 0,
    "preco_praticado": 2500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-inscricao-cnpj-ret",
    "nome": "INSCRIÇÃO CNPJ - RET",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 600.0,
    "preco_superior": 0,
    "preco_praticado": 600.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-inscricao-cnpj-scp",
    "nome": "INSCRIÇÃO CNPJ - SCP",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 850.0,
    "preco_superior": 0,
    "preco_praticado": 850.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-inscricao-estudual-de-st-icms",
    "nome": "INSCRIÇÃO ESTUDUAL DE ST-ICMS",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 600.0,
    "preco_superior": 0,
    "preco_praticado": 600.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-inscricao-municipal",
    "nome": "INSCRIÇÃO MUNICIPAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 500.0,
    "preco_superior": 0,
    "preco_praticado": 500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-licenca-de-canda-tfa",
    "nome": "LICENÇA DE CANDA (TFA)",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 600.0,
    "preco_superior": 0,
    "preco_praticado": 600.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-ongs-oscips-fundacoes",
    "nome": "ONGS / OSCIPS / Fundações",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 2500.0,
    "preco_superior": 0,
    "preco_praticado": 2500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-parcelamento-de-imposto",
    "nome": "PARCELAMENTO DE IMPOSTO",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 250.0,
    "preco_superior": 0,
    "preco_praticado": 250.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-parcelamento-acompanhamento",
    "nome": "PARCELAMENTO - ACOMPANHAMENTO",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 80.0,
    "preco_superior": 0,
    "preco_praticado": 80.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-partidos-politicos",
    "nome": "PARTIDOS POLÍTICOS",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 3000.0,
    "preco_superior": 0,
    "preco_praticado": 3000.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-pedido-de-opcao-do-simples-nacional",
    "nome": "PEDIDO DE OPÇÃO DO SIMPLES NACIONAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 250.0,
    "preco_superior": 0,
    "preco_praticado": 250.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-processo-administrativo",
    "nome": "PROCESSO ADMINISTRATIVO",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 600.0,
    "preco_superior": 0,
    "preco_praticado": 600.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-processo-administrativo-de-restituicao",
    "nome": "PROCESSO ADMINISTRATIVO DE RESTITUIÇÃO",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 600.0,
    "preco_superior": 0,
    "preco_praticado": 600.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-processo-administrativo-federal",
    "nome": "PROCESSO ADMINISTRATIVO FEDERAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 600.0,
    "preco_superior": 0,
    "preco_praticado": 600.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-processo-administrativo-municipal",
    "nome": "PROCESSO ADMINISTRATIVO MUNICIPAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 600.0,
    "preco_superior": 0,
    "preco_praticado": 600.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-processo-de-certidao-de-regularizacao-de-obra",
    "nome": "PROCESSO DE CERTIDÃO DE REGULARIZAÇÃO DE OBRA",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-processo-de-transformacao-de-s-a-em-ltda",
    "nome": "PROCESSO DE TRANSFORMAÇÃO DE S/A EM LTDA",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 3000.0,
    "preco_superior": 0,
    "preco_praticado": 3000.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-registro-de-ata-estatuto-no-cartorio",
    "nome": "REGISTRO DE ATA/ESTATUTO NO CARTÓRIO",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 800.0,
    "preco_superior": 0,
    "preco_praticado": 800.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-registro-de-marcas-e-patentes",
    "nome": "REGISTRO DE MARCAS E PATENTES",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 0.0,
    "preco_superior": 0,
    "preco_praticado": 0.0,
    "preco_texto": "R$ 1800 A R$ 5000",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-registro-em-conselho",
    "nome": "REGISTRO EM CONSELHO",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 700.0,
    "preco_superior": 0,
    "preco_praticado": 700.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-registro-notificacao-susep",
    "nome": "REGISTRO/NOTIFICAÇÃO - SUSEP",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 700.0,
    "preco_superior": 0,
    "preco_praticado": 700.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-regulariazacao-fiscal-e-legal",
    "nome": "REGULARIAZAÇÃO FISCAL E LEGAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 0.0,
    "preco_superior": 0,
    "preco_praticado": 0.0,
    "preco_texto": "Mínimo R$ 800",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-regularizacao-cadastral-de-iptu",
    "nome": "REGULARIZAÇÃO CADASTRAL DE IPTU",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 400.0,
    "preco_superior": 0,
    "preco_praticado": 400.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-regularizacao-de-cadesp",
    "nome": "REGULARIZAÇÃO DE CADESP",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 700.0,
    "preco_superior": 0,
    "preco_praticado": 700.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-regularizacao-de-cadesp-2",
    "nome": "REGULARIZAÇÃO DE CADESP",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 700.0,
    "preco_superior": 0,
    "preco_praticado": 700.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-renovacao-de-licenca-de-feirante",
    "nome": "RENOVAÇÃO DE LICENÇA DE FEIRANTE",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 700.0,
    "preco_superior": 0,
    "preco_praticado": 700.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-renovacao-do-registro-no-conselho-reginal",
    "nome": "RENOVAÇÃO DO REGISTRO NO CONSELHO REGINAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 700.0,
    "preco_superior": 0,
    "preco_praticado": 700.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-re-ratificacao-de-contrato-social",
    "nome": "RE-RATIFICAÇÃO DE CONTRATO SOCIAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 0.0,
    "preco_superior": 0,
    "preco_praticado": 0.0,
    "preco_texto": "R$ 850 a R$ 1300",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-segunda-via-de-contrato-social",
    "nome": "SEGUNDA VIA DE CONTRATO SOCIAL",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 250.0,
    "preco_superior": 0,
    "preco_praticado": 250.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-senha-web",
    "nome": "SENHA WEB",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 300.0,
    "preco_superior": 0,
    "preco_praticado": 300.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-solicitacao-de-senha-estadual-sefaz",
    "nome": "SOLICITAÇÃO DE SENHA ESTADUAL (SEFAZ)",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-transformacao-de-empresario-indivdual-em-ltda",
    "nome": "TRANSFORMAÇÃO DE EMPRESARIO INDIVDUAL EM LTDA",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1500.0,
    "preco_superior": 0,
    "preco_praticado": 1500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "legalizacao-transformacao-de-mei",
    "nome": "TRANSFORMAÇÃO DE MEI",
    "categoria": "Legalização",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1500.0,
    "preco_superior": 0,
    "preco_praticado": 1500.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-mei",
    "nome": "MEI",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 400.0,
    "preco_superior": 0,
    "preco_praticado": 400.0,
    "preco_texto": "",
    "descricao": "Viabilidade + DBE + Atualizações MEI ",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-simples-nacional-me-epp",
    "nome": "Simples Nacional - ME / EPP",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 600.0,
    "preco_superior": 0,
    "preco_praticado": 600.0,
    "preco_texto": "",
    "descricao": "Viabilidade + DBE + Alteração Contratual",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-lucro-presumido",
    "nome": "Lucro Presumido",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 800.0,
    "preco_superior": 0,
    "preco_praticado": 800.0,
    "preco_texto": "",
    "descricao": "Viabilidade + DBE + Alteração Contratual",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-lucro-real",
    "nome": "Lucro Real",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "",
    "descricao": "Alteração Contratual + DBE + Atualização fiscal",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-entidades-sem-fins-lucrativos-igrejas",
    "nome": "Entidades sem fins lucrativos - Igrejas",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "",
    "descricao": "Alteração estatutária + Ata + Cartório",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-associacoes-esportivas-culturais-comunitarias-etc",
    "nome": "Associações (esportivas, culturais, comunitárias, etc)",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "",
    "descricao": "Alteração estatutária + Ata + Cartório",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-ongs-oscips-fundacoes",
    "nome": "ONGs / OSCIPs / Fundações",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "",
    "descricao": "Alterações estatutárias + adequações legais",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-condominios",
    "nome": "Condomínios",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "",
    "descricao": "Atualizações cadastrais + alterações ",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-cooperativas",
    "nome": "Cooperativas",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "Assembleia + Ata + Alteração Junta",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-fundacoes",
    "nome": "Fundações",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "Alteração estatuto + Aprovação MP",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-sindicatos-entidades-classistas",
    "nome": "Sindicatos / Entidades Classistas",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "",
    "descricao": "Alterações estatutárias + Cartório ",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-partidos-politicos",
    "nome": "Partidos Políticos",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "",
    "descricao": "Atualização estatuto + documentos eleitorais",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-filias-de-empresa-estrangeira",
    "nome": "Filias de Empresa Estrangeira",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "Atualização cadastrais e nacionalização ",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-inclusao-ou-retirada-de-socios",
    "nome": "Inclusão ou retirada de Sócios",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 665.0,
    "preco_superior": 0,
    "preco_praticado": 665.0,
    "preco_texto": "",
    "descricao": "Viabilidade + DBE + Integrador",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-transformacao-mei-para-me-ltda",
    "nome": "Transformação (MEI para ME / LTDA)",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 650.0,
    "preco_superior": 0,
    "preco_praticado": 650.0,
    "preco_texto": "",
    "descricao": "Viabilidade + DBE + Integrador",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-enquadramento-reenquadramento",
    "nome": "Enquadramento / Reenquadramento",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 650.0,
    "preco_superior": 0,
    "preco_praticado": 650.0,
    "preco_texto": "",
    "descricao": "Viabilidade + DBE + Integrador",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "alteracoes-cisao-fusao-incorporacao",
    "nome": "Cisão, Fusão, Incorporação",
    "categoria": "Alterações",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "",
    "descricao": "Viabilidade + DBE + Integrador + Atos Jurídicos",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-mei",
    "nome": "MEI",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 600.0,
    "preco_superior": 0,
    "preco_praticado": 600.0,
    "preco_texto": "",
    "descricao": "Encerramento Portal +CNPJ + Prefeitura +SEFAZ",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-simples-nacional-me-epp",
    "nome": "Simples Nacional - ME / EPP",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 800.0,
    "preco_superior": 0,
    "preco_praticado": 800.0,
    "preco_texto": "",
    "descricao": "Distrato + Baixa Junta +RFB + Prefeitura +SEFAZ",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-lucro-presumido",
    "nome": "Lucro Presumido",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "",
    "descricao": "Distrato + Baixa Completa",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-lucro-real",
    "nome": "Lucro Real",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "Distrato + Baixa Completa",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-entidades-sem-fins-lucrativos-igrejas",
    "nome": "Entidades sem fins lucrativos - Igrejas",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "Dissolução + Encerramento Cartório + RFB",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-associacoes-esportivas-culturais-comunitarias-etc",
    "nome": "Associações (esportivas, culturais, comunitárias, etc)",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "Dissolução + Registro + Baixa RFB",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-ongs-oscips-fundacoes",
    "nome": "ONGs / OSCIPs / Fundações",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "Dissolução + Prestação Final + Cartório + RFB",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-condominios",
    "nome": "Condomínios",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1650.0,
    "preco_superior": 0,
    "preco_praticado": 1650.0,
    "preco_texto": "",
    "descricao": "Baixa RFB + Prefeitura",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-cooperativas",
    "nome": "Cooperativas",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1350.0,
    "preco_superior": 0,
    "preco_praticado": 1350.0,
    "preco_texto": "",
    "descricao": "Dissolução + Baixa Junta + RFB",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-fundacoes",
    "nome": "Fundações",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1500.0,
    "preco_superior": 0,
    "preco_praticado": 1500.0,
    "preco_texto": "",
    "descricao": "Extinção Judicial + Cartório + RFB",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-sindicatos-entidades-classistas",
    "nome": "Sindicatos / Entidades Classistas",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "Dissolução + Baixa RFB",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-partidos-politicos",
    "nome": "Partidos Políticos",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "Encerramento + Baixa TSE + RFB",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "baixas-filias-de-empresa-estrangeira",
    "nome": "Filias de Empresa Estrangeira",
    "categoria": "Baixas",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1400.0,
    "preco_superior": 0,
    "preco_praticado": 1400.0,
    "preco_texto": "",
    "descricao": "Cancelamento da autorização federal + Publicação + Baixa na Junta Comercial + Receita Federal + Prefeitura + SEFAZ",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-alvara-de-localizacao-e-funcionamento-prefeitura-e",
    "nome": "Alvará de Localização e Funcionamento - Prefeitura (Emissão e Renovação)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 250.0,
    "preco_superior": 0,
    "preco_praticado": 250.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-licenca-de-publicidade-prefeitura",
    "nome": "Licença de Publicidade - Prefeitura",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-licenca-do-corpo-de-bombeiro-avcb-clcb",
    "nome": "Licença do Corpo de Bombeiro - AVCB / CLCB",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 450.0,
    "preco_superior": 0,
    "preco_praticado": 450.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-licenca-ambiental-sema",
    "nome": "Licença Ambiental - SEMA",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 450.0,
    "preco_superior": 0,
    "preco_praticado": 450.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-licenca-sanitaria-visa",
    "nome": "Licença Sanitária - VISA",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 450.0,
    "preco_superior": 0,
    "preco_praticado": 450.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-inscricao-municipal-prefeitura",
    "nome": "Inscrição Municipal (Prefeitura)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-inscricao-estadual-sefaz",
    "nome": "Inscrição Estadual (SEFAZ)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-cadastro-de-produtor-rural-sefaz",
    "nome": "Cadastro de Produtor Rural (SEFAZ)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-emissao-de-nota-fiscal-avulsa-nfa-e-e-nota-de-merc",
    "nome": "Emissão de Nota Fiscal Avulsa (NFA-e) e Nota de Mercadoria (NF-e) SEFAZ",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 100.0,
    "preco_superior": 0,
    "preco_praticado": 100.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-emissao-de-nota-fiscal-de-servico-nfs-e-www-nfse-g",
    "nome": "Emissão de Nota Fiscal de Serviço (NFS-e) www.nfse.gov.b",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 50.0,
    "preco_superior": 0,
    "preco_praticado": 50.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-recalculos-de-guias-de-contribuicao-e-tributos-em-",
    "nome": "Recálculos de Guias de Contribuição e Tributos em Geral (por Guia)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 50.0,
    "preco_superior": 0,
    "preco_praticado": 50.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-parametrizacao-de-sistemas-implantacao-e-manutenca",
    "nome": "Parametrização de Sistemas (Implantação e Manutenção)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 545.0,
    "preco_superior": 0,
    "preco_praticado": 545.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-classificacao-de-produtos-ncm-manutencao-de-classi",
    "nome": "Classificação de Produtos - NCM (Manutenção de classificações)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 150.0,
    "preco_superior": 0,
    "preco_praticado": 150.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-livro-caixa-profissionais-liberais-autonomos-titul",
    "nome": "Livro Caixa (Profissionais liberais, autônomos, titulares de cartório e leiloeiros)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 3111.0,
    "preco_superior": 0,
    "preco_praticado": 3111.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-livro-caixa-digital-do-produtor-rural-lcdpr-anual",
    "nome": "Livro Caixa Digital do Produtor Rural (LCDPR) - Anual",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 3111.0,
    "preco_superior": 0,
    "preco_praticado": 3111.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-prestacao-de-contas-de-produtor-rural-semestral",
    "nome": "Prestação de Contas de Produtor Rural (Semestral)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1557.0,
    "preco_superior": 0,
    "preco_praticado": 1557.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-consulta-fiscal-e-emissao-de-certidao-negativa-de-",
    "nome": "Consulta Fiscal e emissão de Certidão Negativa de Débitos (CND)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 200.0,
    "preco_superior": 0,
    "preco_praticado": 200.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-indices-para-licitacoes",
    "nome": "Índices para Licitações",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 450.0,
    "preco_superior": 0,
    "preco_praticado": 450.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-cadastros-comerciais-e-bancarios",
    "nome": "Cadastros Comerciais e Bancários",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 250.0,
    "preco_superior": 0,
    "preco_praticado": 250.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-regularizacao-de-pendencias-debitos-e-omissoes-de-",
    "nome": "Regularização de pendências: débitos e omissões de declarações",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 450.0,
    "preco_superior": 0,
    "preco_praticado": 450.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-regularize-renegociar-divida-ativa-da-uniao-pgfn",
    "nome": "Regularize - Renegociar Dívida Ativa da União (PGFN)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 550.0,
    "preco_superior": 0,
    "preco_praticado": 550.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-refis-programa-de-recuperacao-fiscal-municipal-est",
    "nome": "Refis - Programa de Recuperação Fiscal (Municipal, Estadual e Federal)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 650.0,
    "preco_superior": 0,
    "preco_praticado": 650.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-adicionais-documentos-de-arquivamento-obrigatorio-ou-de-inter",
    "nome": "Documentos de arquivamento obrigatório ou de interesse, como Procuração, atas de reuniões, acordos, comunicação, Balanço Patrimonial ou Balanço de Resultado Econômico e outros atos (Junta Comercial)",
    "categoria": "Serviços adicionais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 450.0,
    "preco_superior": 0,
    "preco_praticado": 450.0,
    "preco_texto": "",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-decore",
    "nome": "Decore",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "personalizado",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 0.0,
    "preco_superior": 0,
    "preco_praticado": 0.0,
    "preco_texto": "*10%",
    "descricao": "Declaração Comprobatória de Percepção de \nRendimentos",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-consultoria",
    "nome": "Consultoria",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 250.0,
    "preco_superior": 0,
    "preco_praticado": 250.0,
    "preco_texto": "",
    "descricao": "Orientação e suporte para questões contábeis, e \natendimento presencial ou online",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-consultoria-de-documentos",
    "nome": "Consultoria de documentos",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Consulta em condições excepcionais \n(com exame de documentos) ",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-assessoria-e-representacao",
    "nome": "Assessoria e Representação",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 850.0,
    "preco_superior": 0,
    "preco_praticado": 850.0,
    "preco_texto": "",
    "descricao": "Acompanhamento, representação e/ou participação \nem assembleia, conselhos e reuniões",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-escrituracao-contabil-e-fiscal",
    "nome": "Escrituração Contábil e Fiscal",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 450.0,
    "preco_superior": 0,
    "preco_praticado": 450.0,
    "preco_texto": "",
    "descricao": "Elaboração da escrituração contábil de períodos \nanteriores e do encerramento do exercício para \nemissão das Demonstrações Financeiras (DFs)",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-consultoria-trabalhista-e-previdenciaria",
    "nome": "Consultoria Trabalhista e Previdenciária",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Apuração do tempo de contribuição, simulações, \ncálculo de auxílio-doença, pensões e revisão de \naposentadorias, tanto público (RPPS) como privado.",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-orgaos-do-governo-uniao-estados-e-municipios",
    "nome": "Órgãos do Governo (União, Estados e Municípios)",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 665.0,
    "preco_superior": 0,
    "preco_praticado": 665.0,
    "preco_texto": "",
    "descricao": "Gestão orçamentária, financeira e patrimonial por \nmeio de licitação (ou por inexigibilidade, devido à \nnatureza intelectual e notória especialização)",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-bpo-financeiro",
    "nome": "BPO Financeiro",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Gestão financeira (contas a pagar e a receber), \nconciliação, faturamento e fluxo de caixa inteligente.",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-inteligencia-artificial-ia",
    "nome": "Inteligência Artificial (IA)",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Implementação e automação com Inteligência \nArtificial (IA) nos processos contábeis",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-esg-relatorios-de-sustentabilidade-ifrs-s1-s2",
    "nome": "ESG + Relatórios de Sustentabilidade (IFRS S1, S2)",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Analisar os dados ESG, adequar o relatório ao \npadrão IFRS S1/S2 e assegurar consistência com \nas Demonstrações Financeiras",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-consultoria-tributaria",
    "nome": "Consultoria Tributária",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 625.0,
    "preco_superior": 0,
    "preco_praticado": 625.0,
    "preco_texto": "",
    "descricao": "Consultoria para cumprimento das obrigações \nfiscais.",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-holding-e-sucessao-patrimonial",
    "nome": "Holding e Sucessão Patrimonial",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 760.0,
    "preco_superior": 0,
    "preco_praticado": 760.0,
    "preco_texto": "",
    "descricao": "Consultoria e planejamento sucessório e na \nproteção patrimonial.",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-planejamento-tributario",
    "nome": "Planejamento Tributário",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 760.0,
    "preco_superior": 0,
    "preco_praticado": 760.0,
    "preco_texto": "",
    "descricao": "Estratégias para otimização da carga tributária.",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-pericia-contabil-judicial",
    "nome": "Perícia Contábil Judicial",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 560.0,
    "preco_superior": 0,
    "preco_praticado": 560.0,
    "preco_texto": "",
    "descricao": "Emissão de parecer técnico designado pelo Juiz.",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-pericia-contabil-extrajudicial",
    "nome": "Perícia Contábil Extrajudicial",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 665.0,
    "preco_superior": 0,
    "preco_praticado": 665.0,
    "preco_texto": "",
    "descricao": "Emissão de análise técnica contábil, solicitado por \nempresas, indivíduos ou entidades, sem \nnecessidade de um processo judicial.",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-auditoria-independente",
    "nome": "Auditoria Independente",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 760.0,
    "preco_superior": 0,
    "preco_praticado": 760.0,
    "preco_texto": "",
    "descricao": "Auditoria contábil realizada por auditores externos, \nque não têm vínculos com a empresa auditada. O \nobjetivo principal é fornecer uma opinião imparcial \nsobre as demonstrações financeiras da empresa.",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-estudo-tecnico-preliminar-etp",
    "nome": "Estudo Técnico Preliminar (ETP)",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "hora",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 665.0,
    "preco_superior": 0,
    "preco_praticado": 665.0,
    "preco_texto": "",
    "descricao": "Elaborar e estimar custos e valoração, garantindo a \nviabilidade financeira e orçamentária de editais. ",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-inventario-de-estoques",
    "nome": "Inventário de Estoques",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "personalizado",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 0.0,
    "preco_superior": 0,
    "preco_praticado": 0.0,
    "preco_texto": "-",
    "descricao": "Contagem dos itens em estoque para garantir que \nos registros contábeis e físicos estejam alinhados, \nconciliação e registro fotográfico. (CPC 16)",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "servicos-tecnicos-inventario-de-ativo-imobilizado",
    "nome": "Inventário de Ativo Imobilizado",
    "categoria": "Serviços técnicos",
    "tipo_cobranca": "personalizado",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 0.0,
    "preco_superior": 0,
    "preco_praticado": 0.0,
    "preco_texto": "-",
    "descricao": "Levantamento físico dos bens, conciliação, vida útil \ne relatório fotográfico. (CPC 01, CPC 04 e CPC 27)",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "trabalhista-previdenciario-esocial",
    "nome": "eSocial",
    "categoria": "Trabalhista / Previdenciário",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Sistema que unifica o envio de informações pelo empregador em relação aos seus empregados",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "trabalhista-previdenciario-efd-reinf",
    "nome": "EFD-Reinf",
    "categoria": "Trabalhista / Previdenciário",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Escrituração digital das retenções e outras informações fiscais",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "trabalhista-previdenciario-emissao-do-ppp-perfil-profissiografico-prev",
    "nome": "Emissão do PPP - Perfil Profissiográfico Previdenciário",
    "categoria": "Trabalhista / Previdenciário",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 300.0,
    "preco_superior": 0,
    "preco_praticado": 300.0,
    "preco_texto": "",
    "descricao": "Documento histórico-laboral que contém as informações relativas às atividades do trabalhador na empresa",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "trabalhista-previdenciario-caged",
    "nome": "CAGED",
    "categoria": "Trabalhista / Previdenciário",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 165.0,
    "preco_superior": 0,
    "preco_praticado": 165.0,
    "preco_texto": "",
    "descricao": "Registro de admissões e demissões de empregados",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "trabalhista-previdenciario-fgts-digital-sefip-gfip",
    "nome": "FGTS Digital (SEFIP / GFIP)",
    "categoria": "Trabalhista / Previdenciário",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 165.0,
    "preco_superior": 0,
    "preco_praticado": 165.0,
    "preco_texto": "",
    "descricao": "Sistema para iformar os dados cadastrias e finhanceiros dos trabalhadores e para o recolhimento do FGTS",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "trabalhista-previdenciario-gfip-de-reclamatoria-trabalhista",
    "nome": "GFIP de Reclamatória Trabalhista",
    "categoria": "Trabalhista / Previdenciário",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Documento que informa os fatos geradores de contribuições sociais decorrentes de uma reclamatória trablhista",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "trabalhista-previdenciario-rais-ate-10-vinculos",
    "nome": "RAIS - Até 10 Vínculos",
    "categoria": "Trabalhista / Previdenciário",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 329.0,
    "preco_superior": 0,
    "preco_praticado": 329.0,
    "preco_texto": "",
    "descricao": "Declaração anual de informações sociais",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "trabalhista-previdenciario-rais-de-11-a-20-vinculos",
    "nome": "RAIS - De 11 a 20 Vinculos",
    "categoria": "Trabalhista / Previdenciário",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 620.0,
    "preco_superior": 0,
    "preco_praticado": 620.0,
    "preco_texto": "",
    "descricao": "Declaração anual de informações sociais",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "trabalhista-previdenciario-rais-acima-de-21-vinculos-cobrar-por-vincul",
    "nome": "RAIS - Acima de 21 Vinculos (Cobrar por Vinculo)",
    "categoria": "Trabalhista / Previdenciário",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 35.0,
    "preco_superior": 0,
    "preco_praticado": 35.0,
    "preco_texto": "",
    "descricao": "Declaração anual de informações sociais",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "trabalhista-previdenciario-rais-negativa",
    "nome": "RAIS Negativa",
    "categoria": "Trabalhista / Previdenciário",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 165.0,
    "preco_superior": 0,
    "preco_praticado": 165.0,
    "preco_texto": "",
    "descricao": "Documento para comprovar que a empresa não teve nenhum colaborador em atividade durante o ano-base",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "trabalhista-previdenciario-cadastro-pat",
    "nome": "Cadastro PAT",
    "categoria": "Trabalhista / Previdenciário",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 250.0,
    "preco_superior": 0,
    "preco_praticado": 250.0,
    "preco_texto": "",
    "descricao": "Programa de Alimentação do Trabalhador (PAT)",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dirpf-individual",
    "nome": "DIRPF (Individual)",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 300.0,
    "preco_superior": 0,
    "preco_praticado": 300.0,
    "preco_texto": "",
    "descricao": "Elaboração e envio da declaração de imposto de renda pessoa física",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dirpf-ate-10-beneficiarios",
    "nome": "DIRPF - Até 10 Beneficiários",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 390.0,
    "preco_superior": 0,
    "preco_praticado": 390.0,
    "preco_texto": "",
    "descricao": "Elaboração e envio da declaração de imposto de renda pessoa física",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dirpf-de-11-a-20-beneficiarios",
    "nome": "DIRPF - De 11 a 20 Beneficiários",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 788.0,
    "preco_superior": 0,
    "preco_praticado": 788.0,
    "preco_texto": "",
    "descricao": "Elaboração e envio da declaração de imposto de renda pessoa física",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dirpf-acima-de-21-a-20-beneficiarios-cobrar-por",
    "nome": "DIRPF - Acima de 21 a 20 Beneficiários (Cobrar por Beneficiário)",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 35.0,
    "preco_superior": 0,
    "preco_praticado": 35.0,
    "preco_texto": "",
    "descricao": "Elaboração e envio da declaração de imposto de renda pessoa física",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-irpf-carne-leao",
    "nome": "IRPF - Carnê Leão",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 50.0,
    "preco_superior": 0,
    "preco_praticado": 50.0,
    "preco_texto": "",
    "descricao": "Elaboração e envio do Carnê Leão / DARF mensal",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-defis",
    "nome": "DEFIS",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1200.0,
    "preco_superior": 0,
    "preco_praticado": 1200.0,
    "preco_texto": "",
    "descricao": "Declaração anual para empresas optantes pelo Simples Nacional",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dasn-simei",
    "nome": "DASN-SIMEI",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 250.0,
    "preco_superior": 0,
    "preco_praticado": 250.0,
    "preco_texto": "",
    "descricao": "Declaração anuas de Faturamento do MEI",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-pgdas-d-das",
    "nome": "PGDAS-D (DAS)",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 200.0,
    "preco_superior": 0,
    "preco_praticado": 200.0,
    "preco_texto": "",
    "descricao": "Pagamento unificado de tributos para empresas do Simples Nacional",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-pgdas-d-das-sem-movimento",
    "nome": "PGDAS-D (DAS) Sem Movimento",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 130.0,
    "preco_superior": 0,
    "preco_praticado": 130.0,
    "preco_texto": "",
    "descricao": "Pagamento unificado de tributos para empresas do Simples Nacional",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-coaf",
    "nome": "COAF",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 665.0,
    "preco_superior": 0,
    "preco_praticado": 665.0,
    "preco_texto": "",
    "descricao": "Declaração de operações financeiras suspeitas",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-cadastro-cno",
    "nome": "Cadastro CNO",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 185.0,
    "preco_superior": 0,
    "preco_praticado": 185.0,
    "preco_texto": "",
    "descricao": "Cadastro obrigatório para todas as empresas de construção civil, utilizado para o controle e fiscalização das contribuições previdenciárias",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-des",
    "nome": "DES",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 260.0,
    "preco_superior": 0,
    "preco_praticado": 260.0,
    "preco_texto": "",
    "descricao": "Declaração Eletrônica de Serviços - Municipal",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dctfweb-mit",
    "nome": "DCTFweb / MIT",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 200.0,
    "preco_superior": 0,
    "preco_praticado": 200.0,
    "preco_texto": "",
    "descricao": "Declaração de débitos e créditos tributários federais via web / Módulo de inclusão de Tributos ",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dctfweb-sem-movimento",
    "nome": "DCTFweb - Sem Movimento",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 130.0,
    "preco_superior": 0,
    "preco_praticado": 130.0,
    "preco_texto": "",
    "descricao": "Declaração de débitos e créditos tributários federais via web",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-destda-sedif-sn",
    "nome": "DeSTDA (SEDIF-SN)",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 300.0,
    "preco_superior": 0,
    "preco_praticado": 300.0,
    "preco_texto": "",
    "descricao": "Declaração de Substituição Tributária, Diferencial de Alíquota e Antecipação",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dimob",
    "nome": "DIMOB",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 665.0,
    "preco_superior": 0,
    "preco_praticado": 665.0,
    "preco_texto": "",
    "descricao": "Declaração de operações imobiliárias",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dirbi-atualmente-sao-173-tipos-de-beneficios",
    "nome": "DIRBI (Atualmente são 173 tipos de Benefícios)",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 365.0,
    "preco_superior": 0,
    "preco_praticado": 365.0,
    "preco_texto": "",
    "descricao": "Declaração de Incentivos, Renúncias, Benefícios e Imunidades de Natureza Tributária",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-ditr",
    "nome": "DITR",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Declaração anual do imposto sobre a propriedade territorial rural",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dme",
    "nome": "DME",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 570.0,
    "preco_superior": 0,
    "preco_praticado": 570.0,
    "preco_texto": "",
    "descricao": "Declaração de operações liquidadas com moeda em espécie",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dmed",
    "nome": "DMED",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 665.0,
    "preco_superior": 0,
    "preco_praticado": 665.0,
    "preco_texto": "",
    "descricao": "Declaração de Serviços Médicos",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dtta",
    "nome": "DTTA",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 2850.0,
    "preco_superior": 0,
    "preco_praticado": 2850.0,
    "preco_texto": "",
    "descricao": "Declaração de Transferências de Titularidade de Ações",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-ecd-sped-contabil",
    "nome": "ECD (Sped Contábil)",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Escrituração digital das obrigações contábeis",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-ecf-sped-fiscal",
    "nome": "ECF (Sped Fiscal)",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Escrituração digital das obrigações fiscais",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-efd-contribuicoes",
    "nome": "EFD Contribuições",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Escrituração digital das contribuições sociai",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-efd-icms-ipi",
    "nome": "EFD ICMS/IPI",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Escrituração digital do ICMS e IPI",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-gcap",
    "nome": "GCAP",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 350.0,
    "preco_superior": 0,
    "preco_praticado": 350.0,
    "preco_texto": "",
    "descricao": "Apuração de ganhos de capital na alienação de bens e direitos",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-gia-gia-st",
    "nome": "GIA / GIA ST",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 365.0,
    "preco_superior": 0,
    "preco_praticado": 365.0,
    "preco_texto": "",
    "descricao": "Guia de Informações e Apuração de ICMS e ICMS-ST",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-ibge-pac-pas-paic-pia",
    "nome": "IBGE - PAC / PAS / PAIC / PIA",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 250.0,
    "preco_superior": 0,
    "preco_praticado": 250.0,
    "preco_texto": "",
    "descricao": "Pesquisa anual sobre o comércio, serviço, indústria da Construção e industrial ",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-itcmd",
    "nome": "ITCMD",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 570.0,
    "preco_superior": 0,
    "preco_praticado": 570.0,
    "preco_texto": "",
    "descricao": "Imposto sobre Transmissão Causa Mortis e Doação de Quaisquer Bens ou Direitos",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-sero-antigo-diso",
    "nome": "SERO (Antigo DISO)",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 2850.0,
    "preco_superior": 0,
    "preco_praticado": 2850.0,
    "preco_texto": "",
    "descricao": "Declaração e demonstrativo no E-CAC para Serviço Eletrônico de Regularização de Obras",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-dcbe",
    "nome": "DCBE**",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 650.0,
    "preco_superior": 0,
    "preco_praticado": 650.0,
    "preco_texto": "",
    "descricao": "Declaração de Capitais Brasileiros no Exterior",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "obrigacoes-tributarias-criptoativos-ou-moedas-virtuais",
    "nome": "Criptoativos ou Moedas Virtuais***",
    "categoria": "Obrigações tributárias",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 650.0,
    "preco_superior": 0,
    "preco_praticado": 650.0,
    "preco_texto": "",
    "descricao": "Declaração sobre Operações Realizadas com Criptoativos",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "reforma-tributaria-diagnostico-de-impacto-da-reforma-tributaria",
    "nome": "Diagnóstico de Impacto da Reforma Tributária",
    "categoria": "Reforma Tributária",
    "tipo_cobranca": "faixa",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "Pequenas: R$ 600 - R$ 1200       Médias: R$ 1500 - R$ 3000          Grandes: R$ 4000 - R$ 8000",
    "descricao": "Análise do impacto da alíquota (~26,5%) na margem, fluxo de caixa, riscos e oportunidades; estudo dos créditos de transição (imobilizado e estoques); relatório executivo",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "reforma-tributaria-revisao-e-parametrizacao-fiscal-completa",
    "nome": "Revisão e Parametrização Fiscal Completa",
    "categoria": "Reforma Tributária",
    "tipo_cobranca": "faixa",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1850.0,
    "preco_superior": 0,
    "preco_praticado": 1850.0,
    "preco_texto": "Até 200 itens: R$ 1.200 - R$ 2.500                                              200-1000 itens: R$ 3.000 - R$ 7.000                                                                           >1000 itens: R$ 8.000 - R$ 20.000",
    "descricao": "Revisão de NCM, CFOP, CST, CNAE e serviços; parametrização de itens no ERP; correções de regras fiscais; testes e validações IBS/CBS",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "reforma-tributaria-adequacao-sistemica-e-treinamento-erp",
    "nome": "Adequação Sistêmica e Treinamento ERP",
    "categoria": "Reforma Tributária",
    "tipo_cobranca": "faixa",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 2500.0,
    "preco_superior": 0,
    "preco_praticado": 2500.0,
    "preco_texto": "Básico: R$ 1.500 - R$ 3.500                 Intermediário: R$ 4.000 - R$ 7.000                              >1000 itens: R$ 8.000 - R$ 20.000",
    "descricao": "Configuração do ERP para IBS/CBS, split payment e NFS-e Nacional; ajustes de leiautes; testes técnicos; treinamento das equipes e manual operacional",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "reforma-tributaria-dere-setorial-bancos-seguros-saude-loterias-consorc",
    "nome": "DeRE Setorial (Bancos, Seguros, Saúde, Loterias, Consórcio)",
    "categoria": "Reforma Tributária",
    "tipo_cobranca": "faixa",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 10000.0,
    "preco_superior": 0,
    "preco_praticado": 10000.0,
    "preco_texto": "Implantação: R$ 5.000 - R$ 15.000                       Mensalidade: R$ 800 - R$ 2.500 / Mês",
    "descricao": "Mapeamento de dados/contas, leiautes, evidências e geração dos arquivos exigidos; implantação e rotinas periódicas quando aplicavél",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "reforma-tributaria-roadmap-df-e-novos-modelos",
    "nome": "Roadmap DF-e Novos Modelos",
    "categoria": "Reforma Tributária",
    "tipo_cobranca": "faixa",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1400.0,
    "preco_superior": 0,
    "preco_praticado": 1400.0,
    "preco_texto": "Por DF-e: R$ 800 - R$ 2.000\nPacote completo: R$ 3.000 - R$ 8.000",
    "descricao": "implantação dos novos modelos DF-e (NF-ABI, NFAg, BP-e Aéreo, etc.) conforme notas técnicas; preparação de sistemas, parametrização e testes",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "reforma-tributaria-apuracao-assistida-ibs-cbs-ano-piloto-2026",
    "nome": "Apuração Assistida IBS/CBS – Ano Piloto 2026",
    "categoria": "Reforma Tributária",
    "tipo_cobranca": "faixa",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 1500.0,
    "preco_superior": 0,
    "preco_praticado": 1500.0,
    "preco_texto": "R$ 500 - R$ 2.500 / mês",
    "descricao": "Conferência mensal da apuração informativa; conciliação DF-e × ERP; ajustes de parametrização; relatórios de inconsistências",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "reforma-tributaria-consultoria-por-hora-tecnica",
    "nome": "Consultoria por Hora Técnica",
    "categoria": "Reforma Tributária",
    "tipo_cobranca": "faixa",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 275.0,
    "preco_superior": 0,
    "preco_praticado": 275.0,
    "preco_texto": "R$ 200 - R$ 350 / hora",
    "descricao": "Consultoria em dúvidas fiscais, parametrização, apoio técnico ou operacional",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "reforma-tributaria-revisao-contratual-tributaria",
    "nome": "Revisão Contratual Tributária",
    "categoria": "Reforma Tributária",
    "tipo_cobranca": "faixa",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 750.0,
    "preco_superior": 0,
    "preco_praticado": 750.0,
    "preco_texto": "R$ 300 - R$ 1.200 por contrato",
    "descricao": "Ajuste de cláusulas comerciais e fiscais em contratos para adequação ao IBS/CBS",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "reforma-tributaria-diagnostico-de-impacto-da-reforma-tributaria-2",
    "nome": "Diagnóstico de Impacto da Reforma Tributária",
    "categoria": "Reforma Tributária",
    "tipo_cobranca": "faixa",
    "recorrencia": "pontual",
    "preco_minimo": 0,
    "preco_recomendado": 900.0,
    "preco_superior": 0,
    "preco_praticado": 900.0,
    "preco_texto": "Pequenas: R$ 600 - R$ 1.200         Médias: R$ 1.500 - R$ 3.000         Grandes: R$ 4.000 - R$ 8.000",
    "descricao": "Análise do impacto da alíquota \n(~26,5%) na margem, fluxo de caixa, riscos e oportunidades; estudo dos créditos de transição (imobilizado e estoques); relatório executivo",
    "ativo": true,
    "desconto_maximo": 0
  },
  {
    "id": "certificados-digitais-certificado-digital",
    "nome": "Certificado Digital",
    "categoria": "Certificados Digitais",
    "tipo_cobranca": "unidade",
    "recorrencia": "pontual",
    "preco_minimo": 150,
    "preco_recomendado": 195.0,
    "preco_superior": 280,
    "preco_praticado": 195.0,
    "preco_texto": "Faixa PrecificaCont: R$ 150 a R$ 280",
    "descricao": "",
    "ativo": true,
    "desconto_maximo": 0
  }
];

const STORAGE_SERVICOS = "precificacont_servicos";

const carregarServicosAdicionais = () => {
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_SERVICOS) || "[]");

    if (Array.isArray(salvo) && salvo.length > 0) {
      return salvo.filter((servico) => servico.ativo !== false);
    }

    return SERVICOS_PADRAO_FALLBACK.filter(
      (servico) => servico.ativo !== false
    );
  } catch (error) {
    console.error("Erro ao carregar catálogo de serviços adicionais:", error);

    return SERVICOS_PADRAO_FALLBACK.filter(
      (servico) => servico.ativo !== false
    );
  }
};




const carregarCatalogoServicos = () => {
  try {
    const salvo = JSON.parse(localStorage.getItem("precificacont_servicos") || "[]");
    const lista = Array.isArray(salvo) ? salvo : [];
    const ids = new Set(lista.map((s) => s.id));
    const faltantes = SERVICOS_PADRAO_FALLBACK.filter((s) => !ids.has(s.id));
    const final = [...lista, ...faltantes];
    if (faltantes.length) {
      localStorage.setItem("precificacont_servicos", JSON.stringify(final));
    }
    return final.filter((s) => s.ativo !== false);
  } catch {
    return SERVICOS_PADRAO_FALLBACK;
  }
};

/* =========================================================
   FORMULÁRIO
========================================================= */

const INITIAL_FORM = {
  cliente: "",
  cnpj: "",
  regime: "",
  atividade: "",
  faturamento: "",
  uf: "",

  colaboradores: "",
  valorColaboradorManual: "",
  movimentacaoFuncionarios: "nenhuma",

  notasSaida: "",
  notasEntrada: "",
  outrosDocumentos: "",

  filiais: "",
  filiaisDetalhadas: [],

  movimentacaoBancaria: "normal",
  contasBancarias: "",

  vendeOutrosEstados: false,
  estadosVenda: "",
  documentosVendaInterestadual: "",

  compraOutrosEstados: false,
  estadosCompra: "",
  documentosCompraInterestadual: "",

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

/* =========================================================
   COMPONENTES
========================================================= */

const Section = ({ icon: Icon, title, subtitle, children }) => (
  <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
    <div className="flex gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-blue-700" />
      </div>

      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>

        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>

    {children}
  </section>
);

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-700">{label}</span>

    {hint && (
      <span className="block text-xs text-slate-400 mt-0.5">{hint}</span>
    )}

    <div className="mt-2">{children}</div>
  </label>
);

const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const integer = (value) =>
  Number(value || 0).toLocaleString("pt-BR");

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

const somenteDigitosDocumento = (value) =>
  String(value ?? "").replace(/\D/g, "").slice(0, 14);

const formatarCpfCnpj = (value) => {
  const digits = somenteDigitosDocumento(value);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const cpfValido = (value) => {
  const cpf = somenteDigitosDocumento(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i += 1) soma += Number(cpf[i]) * (10 - i);
  let d1 = (soma * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i += 1) soma += Number(cpf[i]) * (11 - i);
  let d2 = (soma * 10) % 11;
  if (d2 === 10) d2 = 0;

  return d2 === Number(cpf[10]);
};

const cnpjValido = (value) => {
  const cnpj = somenteDigitosDocumento(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calc = (base, pesos) => {
    const soma = base
      .split("")
      .reduce((total, numero, index) => total + Number(numero) * pesos[index], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
};

const documentoValido = (value) => {
  const digits = somenteDigitosDocumento(value);
  if (digits.length === 11) return cpfValido(digits);
  if (digits.length === 14) return cnpjValido(digits);
  return false;
};

const mensagemDocumento = (value) => {
  const digits = somenteDigitosDocumento(value);
  if (!digits) return "";
  if (digits.length < 11) return "Digite os 11 números do CPF ou os 14 números do CNPJ.";
  if (digits.length > 11 && digits.length < 14) return "Complete os 14 números do CNPJ.";
  if (!documentoValido(digits)) return digits.length === 11 ? "CPF inválido." : "CNPJ inválido.";
  return digits.length === 11 ? "CPF válido." : "CNPJ válido.";
};

const Toggle = ({ checked, onChange, label, description }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-full text-left rounded-xl border p-4 transition ${
      checked
        ? "border-blue-300 bg-blue-50"
        : "border-slate-200 bg-white hover:bg-slate-50"
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
          checked
            ? "bg-blue-600 border-blue-600"
            : "bg-white border-slate-300"
        }`}
      >
        {checked && <CheckCircle2 size={14} className="text-white" />}
      </div>

      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>

        {description && (
          <div className="text-xs text-slate-500 mt-1">{description}</div>
        )}
      </div>
    </div>
  </button>
);

/* =========================================================
   PÁGINA
========================================================= */


const NOVA_SIMULACAO_DARK_CSS = `
  html.dark .precificacont-nova-simulacao {
    background:
      radial-gradient(circle at 18% 0%, rgba(37,99,235,.11), transparent 30%),
      radial-gradient(circle at 88% 10%, rgba(20,184,166,.06), transparent 24%),
      #07101f !important;
    color: #e5edf8;
  }

  html.dark .precificacont-nova-simulacao [class*="bg-white"],
  html.dark .precificacont-nova-simulacao [class*="from-white"],
  html.dark .precificacont-nova-simulacao [class*="via-white"],
  html.dark .precificacont-nova-simulacao [class*="to-white"],
  html.dark .precificacont-nova-simulacao [class*="bg-slate-50"],
  html.dark .precificacont-nova-simulacao [class*="from-slate-50"],
  html.dark .precificacont-nova-simulacao [class*="via-slate-50"],
  html.dark .precificacont-nova-simulacao [class*="to-slate-50"] {
    background-color: #0c1a2f !important;
    --tw-gradient-from: #0d1c31 var(--tw-gradient-from-position) !important;
    --tw-gradient-to: #09172a var(--tw-gradient-to-position) !important;
    --tw-gradient-stops: var(--tw-gradient-from), #0b192c var(--tw-gradient-via-position), var(--tw-gradient-to) !important;
  }

  html.dark .precificacont-nova-simulacao [class*="border-slate"],
  html.dark .precificacont-nova-simulacao [class*="border-blue-100"] {
    border-color: rgba(96,165,250,.18) !important;
  }

  html.dark .precificacont-nova-simulacao .text-slate-950,
  html.dark .precificacont-nova-simulacao .text-slate-900,
  html.dark .precificacont-nova-simulacao .text-slate-800,
  html.dark .precificacont-nova-simulacao .text-slate-700 {
    color: #f8fafc !important;
  }

  html.dark .precificacont-nova-simulacao .text-slate-600 {
    color: #d2dceb !important;
  }

  html.dark .precificacont-nova-simulacao .text-slate-500,
  html.dark .precificacont-nova-simulacao .text-slate-400 {
    color: #9fb0c7 !important;
  }

  html.dark .precificacont-nova-simulacao .text-blue-600,
  html.dark .precificacont-nova-simulacao .text-blue-700 {
    color: #45a9ff !important;
  }

  html.dark .precificacont-nova-simulacao .text-emerald-600,
  html.dark .precificacont-nova-simulacao .text-emerald-700 {
    color: #34d399 !important;
  }

  html.dark .precificacont-nova-simulacao .text-teal-600,
  html.dark .precificacont-nova-simulacao .text-teal-700 {
    color: #2dd4bf !important;
  }

  html.dark .precificacont-nova-simulacao input,
  html.dark .precificacont-nova-simulacao select,
  html.dark .precificacont-nova-simulacao textarea {
    background-color: #09172a !important;
    border-color: rgba(96,165,250,.22) !important;
    color: #f8fafc !important;
    caret-color: #60a5fa;
  }

  html.dark .precificacont-nova-simulacao input::placeholder,
  html.dark .precificacont-nova-simulacao textarea::placeholder {
    color: #64748b !important;
  }

  html.dark .precificacont-nova-simulacao select option {
    background: #09172a;
    color: #f8fafc;
  }

  html.dark .precificacont-nova-simulacao [class*="bg-blue-50"] {
    background-color: rgba(37,99,235,.17) !important;
  }

  html.dark .precificacont-nova-simulacao [class*="bg-emerald-50"] {
    background-color: rgba(16,185,129,.14) !important;
  }

  html.dark .precificacont-nova-simulacao [class*="bg-teal-50"] {
    background-color: rgba(20,184,166,.14) !important;
  }

  html.dark .precificacont-nova-simulacao [class*="bg-violet-50"] {
    background-color: rgba(139,92,246,.15) !important;
  }

  html.dark .precificacont-nova-simulacao [class*="bg-amber-50"] {
    background-color: rgba(245,158,11,.14) !important;
  }

  /* Modal Gerar proposta: contraste correto no dark mode */
  html.dark .precificacont-nova-simulacao .proposal-required-box {
    background-color: rgba(245,158,11,.10) !important;
    border-color: rgba(251,191,36,.48) !important;
  }

  html.dark .precificacont-nova-simulacao .proposal-required-title {
    color: #fde68a !important;
  }

  html.dark .precificacont-nova-simulacao .proposal-required-text {
    color: #fef3c7 !important;
  }

  html.dark .precificacont-nova-simulacao .proposal-required-icon {
    color: #fbbf24 !important;
  }

  html.dark .precificacont-nova-simulacao [class*="bg-red-50"] {
    background-color: rgba(239,68,68,.13) !important;
  }

  html.dark .precificacont-nova-simulacao [class*="shadow"] {
    box-shadow: 0 14px 38px rgba(0,0,0,.18) !important;
  }

  html.dark .precificacont-nova-simulacao table,
  html.dark .precificacont-nova-simulacao thead,
  html.dark .precificacont-nova-simulacao tbody,
  html.dark .precificacont-nova-simulacao tr,
  html.dark .precificacont-nova-simulacao td,
  html.dark .precificacont-nova-simulacao th {
    border-color: rgba(96,165,250,.14) !important;
  }

  html.dark .precificacont-nova-simulacao thead,
  html.dark .precificacont-nova-simulacao thead tr,
  html.dark .precificacont-nova-simulacao thead th {
    background: #10213a !important;
    color: #8fb7ea !important;
  }

  html.dark .precificacont-nova-simulacao tbody tr,
  html.dark .precificacont-nova-simulacao tbody td {
    background: #0c1a2f !important;
  }

  html.dark .precificacont-nova-simulacao tbody tr:hover,
  html.dark .precificacont-nova-simulacao tbody tr:hover td {
    background: #102440 !important;
  }

  html.dark .precificacont-nova-simulacao [class*="divide-slate"] > :not([hidden]) ~ :not([hidden]) {
    border-color: rgba(96,165,250,.12) !important;
  }

  html.dark .precificacont-nova-simulacao .hover\:bg-slate-50:hover,
  html.dark .precificacont-nova-simulacao .hover\:bg-slate-100:hover {
    background-color: #102440 !important;
  }
`;


const somenteDigitosCampo = (value) => String(value ?? "").replace(/\D/g, "");

const mascaraCpfCnpj = (value) => {
  const digits = somenteDigitosCampo(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const mascaraTelefoneBR = (value) => {
  const digits = somenteDigitosCampo(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const numeroDeMoedaBR = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  // Mantém compatibilidade com números internos já usados pelo motor.
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw) || 0;

  const normalized = raw
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return Number(normalized) || 0;
};

const moedaBRInput = (value) => {
  const numero = numeroDeMoedaBR(value);
  if (!numero && String(value ?? "").trim() === "") return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
};


const CRM_TABLE = "crm_oportunidades";
const ESCRITORIO_ATIVO_KEY = "precificacont_escritorio_ativo";

function getEscritorioAtivoIdNovaSimulacao() {
  return localStorage.getItem(ESCRITORIO_ATIVO_KEY) || "";
}

function novoUuidSeguro() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function NovaSimulacao({ setPagina, permissoesNovaSimulacao }) {
  const [SERVICOS_PADRAO, setServicosPadrao] = useState(() =>
    carregarServicosAdicionais()
  );

  useEffect(() => {
    const atualizarCatalogoServicos = () => {
      setServicosPadrao(carregarServicosAdicionais());
    };

    // Recarrega sempre que a Nova Simulação é aberta/montada.
    atualizarCatalogoServicos();

    // Também acompanha alterações de localStorage feitas em outra aba/janela.
    window.addEventListener("storage", atualizarCatalogoServicos);

    return () => {
      window.removeEventListener("storage", atualizarCatalogoServicos);
    };
  }, []);


  const [form, setForm] = useState(INITIAL_FORM);
  const [crmOrigem, setCrmOrigem] = useState(null);
  const [simulationMode, setSimulationMode] = useState("rapida");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedSimulation, setSavedSimulation] = useState(null);
  const [proposalGenerated, setProposalGenerated] = useState(null);
  const [proposalBuilderOpen, setProposalBuilderOpen] = useState(false);
  const [proposalMode, setProposalMode] = useState("completa");
  const [aplicarDescontoComercial, setAplicarDescontoComercial] = useState(false);
  const [descontoComercial, setDescontoComercial] = useState(0);
  const [regrasDesconto] = useState(() => {
    try {
      const salvo = JSON.parse(
        localStorage.getItem("precificacont_regras_comerciais") || "{}"
      );
      return {
        permitido: salvo?.desconto?.permitido !== false,
        percentualMaximo: Math.max(
          0,
          Number(salvo?.desconto?.percentualMaximo ?? 10)
        ),
      };
    } catch {
      return { permitido: true, percentualMaximo: 10 };
    }
  });
  const [proposalInclude, setProposalInclude] = useState({
    matriz: true,
    filiais: true,
    servicos: true,
  });
  const [catalogoServicos] = useState(() => carregarCatalogoServicos());
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [buscaServico, setBuscaServico] = useState("");

  // Permissão já validada e centralizada no App.jsx.
  // Evita repetir getSession + usuarios_escritorios + modulos_saas + perfil_modulos
  // toda vez que a tela Nova Simulação é aberta.
  const permissaoCriarCarregando = false;
  const podeCriarSimulacao =
    permissoesNovaSimulacao?.pode_criar === true;

  useEffect(() => {
    try {
      const modoSolicitado = localStorage.getItem("precificacont_modo_simulacao");

      if (modoSolicitado === "rapida" || modoSolicitado === "detalhada") {
        setSimulationMode(modoSolicitado);
        setAdvancedOpen(false);
        localStorage.removeItem("precificacont_modo_simulacao");
      }
    } catch (error) {
      console.error("Erro ao carregar modo solicitado da simulação:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const rawCRM = localStorage.getItem("precificacont_nova_proposta_crm");
      if (!rawCRM) return;

      const draftCRM = JSON.parse(rawCRM);
      localStorage.removeItem("precificacont_nova_proposta_crm");

      if (!draftCRM || typeof draftCRM !== "object") return;

      const fluxoCRM = localStorage.getItem(
        "precificacont_fluxo_crm_nova_simulacao"
      );
      localStorage.removeItem("precificacont_fluxo_crm_nova_simulacao");

      setCrmOrigem(draftCRM);

      const memoriaCRM =
        draftCRM.dados && typeof draftCRM.dados === "object"
          ? draftCRM.dados
          : {};

      const temMemoriaCalculada =
        Number(
          memoriaCRM.mensalidade_total ||
          draftCRM.valores?.mensalidade_total ||
          draftCRM.valor_mensal ||
          0
        ) > 0;

      setSimulationMode(
        memoriaCRM.tipo_simulacao ||
        (temMemoriaCalculada ? "detalhada" : "detalhada")
      );
      setAdvancedOpen(false);

      // Só abre o modal quando já existe cálculo real.
      // Sem cálculo, mostra a Nova Simulação para o usuário precificar.
      setProposalBuilderOpen(
        temMemoriaCalculada &&
        (
          fluxoCRM === "completar_dados_proposta" ||
          fluxoCRM === "gerar_com_simulacao"
        )
      );

      if (temMemoriaCalculada) {
        setSavedSimulation({
          ...memoriaCRM,
          id: draftCRM.simulacao_id || memoriaCRM.id || null,
          crm_oportunidade_id:
            draftCRM.crm_oportunidade_id ||
            memoriaCRM.crm_oportunidade_id ||
            null,
        });
        setSaved(true);
      }

      setForm((current) => ({
        ...current,
        ...(temMemoriaCalculada ? memoriaCRM : {}),
        cliente:
          draftCRM.cliente ||
          draftCRM.client_nome ||
          memoriaCRM.cliente ||
          memoriaCRM.client_nome ||
          current.cliente,
        cnpj: formatarCpfCnpj(
          draftCRM.cnpj ||
          draftCRM.documento ||
          memoriaCRM.cnpj ||
          ""
        ),
        honorarioAtual:
          Number(
            memoriaCRM.mensalidade_total ||
            draftCRM.valores?.mensalidade_total ||
            draftCRM.valor_mensal ||
            0
          ) > 0
            ? String(
                Number(
                  memoriaCRM.mensalidade_total ||
                  draftCRM.valores?.mensalidade_total ||
                  draftCRM.valor_mensal ||
                  0
                )
                  .toFixed(2)
                  .replace(".", ",")
              )
            : current.honorarioAtual,
      }));
    } catch (error) {
      console.error("Erro ao carregar oportunidade do CRM na simulação:", error);
      localStorage.removeItem("precificacont_nova_proposta_crm");
    }
  }, []);

  const set = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  // Consulta cadastral automática de CNPJ.
  // Usa a MESMA fonte já utilizada no cadastro de clientes do PrecificaCont: OpenCNPJ.
  // Encontrou -> aproveita dados cadastrais seguros.
  // Não encontrou/indisponível -> mantém o preenchimento manual liberado.
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);
  const [mensagemConsultaCnpj, setMensagemConsultaCnpj] = useState("");

  useEffect(() => {
    const cnpj = somenteDigitosCampo(form.cnpj);

    // CPF ou CNPJ ainda incompleto: não consulta.
    if (cnpj.length !== 14) {
      setConsultandoCnpj(false);
      setMensagemConsultaCnpj("");
      return;
    }

    // Só consulta CNPJ estruturalmente válido.
    if (!cnpjValido(cnpj)) {
      setConsultandoCnpj(false);
      setMensagemConsultaCnpj("");
      return;
    }

    const controller = new AbortController();

    // Debounce curto para não disparar durante a digitação/colagem.
    const timer = window.setTimeout(async () => {
      setConsultandoCnpj(true);
      setMensagemConsultaCnpj("Buscando dados do CNPJ...");

      try {
        let dados = null;

        // 1ª fonte: OpenCNPJ (fonte já usada no PrecificaCont).
        try {
          const respostaOpenCnpj = await fetch(
            `https://api.opencnpj.org/${cnpj}`,
            { signal: controller.signal }
          );

          if (respostaOpenCnpj.ok) {
            dados = await respostaOpenCnpj.json();
          }
        } catch (errorOpenCnpj) {
          if (errorOpenCnpj?.name === "AbortError") throw errorOpenCnpj;
          console.warn("OpenCNPJ indisponível para esta consulta.", errorOpenCnpj);
        }

        // Fallback: se o OpenCNPJ não localizar/responder, tenta BrasilAPI.
        if (!dados) {
          const respostaBrasilApi = await fetch(
            `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
            { signal: controller.signal }
          );

          if (!respostaBrasilApi.ok) {
            throw new Error("CNPJ não encontrado nas fontes de consulta.");
          }

          dados = await respostaBrasilApi.json();
        }

        const estabelecimento = dados?.estabelecimento || dados || {};

        const razaoSocial = String(
          dados?.razao_social ||
          dados?.nome_empresarial ||
          estabelecimento?.razao_social ||
          estabelecimento?.nome_fantasia ||
          dados?.nome_fantasia ||
          ""
        ).trim();

        const cidade = String(
          estabelecimento?.cidade?.nome ||
          estabelecimento?.municipio?.nome ||
          estabelecimento?.municipio ||
          dados?.municipio ||
          ""
        ).trim();

        const uf = String(
          estabelecimento?.estado?.sigla ||
          estabelecimento?.uf ||
          dados?.uf ||
          ""
        ).trim().toUpperCase();

        const atividadePrincipal =
          estabelecimento?.atividade_principal ||
          dados?.atividade_principal ||
          {};

        const cnaeDescricao = String(
          atividadePrincipal?.descricao ||
          dados?.cnae_fiscal_descricao ||
          dados?.descricao_cnae_fiscal ||
          ""
        ).trim();

        // A Nova Simulação trabalha com categorias do motor
        // (Serviços / Comércio / Indústria / Serviços + Comércio),
        // e não com a descrição textual completa do CNAE.
        // Só preenche automaticamente quando a própria descrição deixa
        // a categoria clara; caso contrário preserva o campo para escolha manual.
        const descricaoNormalizada = cnaeDescricao
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        let atividadeMotor = "";
        if (
          descricaoNormalizada.includes("comercio") &&
          (descricaoNormalizada.includes("servico") ||
            descricaoNormalizada.includes("reparacao"))
        ) {
          atividadeMotor = "Serviços + Comércio";
        } else if (
          descricaoNormalizada.includes("comercio") ||
          descricaoNormalizada.includes("varej") ||
          descricaoNormalizada.includes("atacad")
        ) {
          atividadeMotor = "Comércio";
        } else if (
          descricaoNormalizada.includes("industr") ||
          descricaoNormalizada.includes("fabricacao") ||
          descricaoNormalizada.includes("manufatura")
        ) {
          atividadeMotor = "Indústria";
        } else if (
          descricaoNormalizada.includes("servico") ||
          descricaoNormalizada.includes("consult") ||
          descricaoNormalizada.includes("assess") ||
          descricaoNormalizada.includes("atividade")
        ) {
          atividadeMotor = "Serviços";
        }

        setForm((current) => {
          const next = { ...current };

          // CNPJ identifica a empresa: usa a razão social oficial encontrada.
          if (razaoSocial) {
            next.cliente = razaoSocial;
          }

          // Não altera regime tributário.
          if (!String(current.uf || "").trim() && uf) {
            next.uf = uf;
          }

          if (!String(current.atividade || "").trim() && atividadeMotor) {
            next.atividade = atividadeMotor;
          }

          // Caso esses campos existam futuramente/por outro fluxo,
          // aproveita os mesmos dados sem criar campos novos na tela.
          if (
            Object.prototype.hasOwnProperty.call(current, "municipio") &&
            !String(current.municipio || "").trim() &&
            cidade
          ) {
            next.municipio = cidade;
          }

          if (
            Object.prototype.hasOwnProperty.call(current, "cnae_principal_descricao") &&
            !String(current.cnae_principal_descricao || "").trim() &&
            cnaeDescricao
          ) {
            next.cnae_principal_descricao = cnaeDescricao;
          }

          return next;
        });

        setSaved(false);
        setMensagemConsultaCnpj("Dados do CNPJ encontrados.");
      } catch (error) {
        if (error?.name === "AbortError") return;

        console.warn(
          "Consulta de CNPJ indisponível. O preenchimento manual continua liberado.",
          error
        );

        setMensagemConsultaCnpj(
          "CNPJ não localizado automaticamente. Você pode continuar preenchendo manualmente."
        );
      } finally {
        if (!controller.signal.aborted) {
          setConsultandoCnpj(false);
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.cnpj]);

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

    setSaved(false);
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

    setSaved(false);
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

    setSaved(false);
  };

  const aprimorarSimulacao = () => {
    setSimulationMode("detalhada");
    setSaved(false);
  };

  const servicosFiltrados = useMemo(() => {
    const termo = buscaServico.trim().toLowerCase();
    return catalogoServicos.filter((servico) =>
      !termo ||
      servico.nome.toLowerCase().includes(termo) ||
      (servico.categoria || "").toLowerCase().includes(termo)
    );
  }, [catalogoServicos, buscaServico]);

  const adicionarServico = (servico) => {
    setServicosSelecionados((atual) => {
      if (atual.some((item) => item.id === servico.id)) return atual;
      return [
        ...atual,
        {
          ...servico,
          quantidade: 1,
          valor_unitario: Number(servico.preco_praticado || servico.preco_recomendado || 0),
          desconto_percentual: 0,
        },
      ];
    });
    setSaved(false);
  };

  const atualizarServico = (id, campo, valor) => {
    setServicosSelecionados((atual) =>
      atual.map((item) => {
        if (item.id !== id) return item;
        if (campo === "desconto_percentual") {
          const limite = Number(item.desconto_maximo || 0);
          const solicitado = Math.max(0, Number(valor || 0));
          return { ...item, [campo]: Math.min(solicitado, limite) };
        }
        return { ...item, [campo]: valor };
      })
    );
    setSaved(false);
  };

  const removerServico = (id) => {
    setServicosSelecionados((atual) => atual.filter((item) => item.id !== id));
    setSaved(false);
  };

  const resumoServicos = useMemo(() => {
    const detalhados = servicosSelecionados.map((item) => {
      const quantidade = Math.max(1, Number(item.quantidade || 1));
      const unitario = Number(item.valor_unitario || 0);
      const desconto = Math.max(0, Number(item.desconto_percentual || 0));
      const bruto = quantidade * unitario;
      const final = bruto * (1 - desconto / 100);
      return { ...item, quantidade, valor_unitario: unitario, desconto_percentual: desconto, valor_final: final };
    });
    const recorrentes = detalhados.filter((i) => i.recorrencia === "recorrente").reduce((s, i) => s + i.valor_final, 0);
    const pontuais = detalhados.filter((i) => i.recorrencia !== "recorrente").reduce((s, i) => s + i.valor_final, 0);
    return { detalhados, recorrentes, pontuais };
  }, [servicosSelecionados]);

  /* =======================================================
     CÁLCULO PRINCIPAL — MOTOR CENTRAL
  ======================================================= */

  const result = useMemo(() => {
    return calculatePricing(form);
  }, [form]);

  /* =======================================================
     CONFIANÇA
  ======================================================= */

  const confidence = useMemo(() => {
    return getConfidence(form);
  }, [form]);

  /* =======================================================
     VALIDADOR TRIBUTÁRIO V1
     Camada informativa: NÃO altera nenhuma fórmula de preço.
     O faturamento atual da tela é mensal; por isso a checagem
     anual usa uma projeção de 12 meses e deixa isso explícito.
  ======================================================= */

  const validacaoTributaria = useMemo(() => {
    const regime = String(form.regime || "").trim();
    const faturamentoMensal = numberValue(form.faturamento);
    const faturamentoAnualProjetado = faturamentoMensal * 12;
    const colaboradores = numberValue(form.colaboradores);
    const quantidadeFiliais = Array.isArray(form.filiaisDetalhadas)
      ? form.filiaisDetalhadas.length
      : 0;

    if (!regime || faturamentoMensal <= 0) return null;

    const resultado = {
      nivel: "ok",
      titulo: "Dados compatíveis com a validação automática",
      mensagem:
        "Nenhuma incompatibilidade foi identificada pelo critério de faturamento informado.",
      detalhes: [],
      faturamentoAnualProjetado,
    };

    if (regime === "MEI") {
      if (faturamentoAnualProjetado > 97200) {
        resultado.nivel = "critico";
        resultado.titulo = "Faturamento incompatível com o limite do MEI";
        resultado.mensagem =
          "A projeção anual supera R$ 97.200,00, equivalente a mais de 20% acima do limite anual geral de R$ 81.000,00 do MEI.";
      } else if (faturamentoAnualProjetado > 81000) {
        resultado.nivel = "critico";
        resultado.titulo = "Limite anual do MEI excedido";
        resultado.mensagem =
          "A projeção anual supera o limite geral de R$ 81.000,00 do MEI. O excesso estimado está em até 20% do limite.";
      }

      if (colaboradores > 1) {
        resultado.nivel = "critico";
        resultado.detalhes.push(
          "Foram informados mais de 1 colaborador. O MEI comum pode contratar no máximo 1 empregado."
        );
      }

      if (quantidadeFiliais > 0) {
        resultado.nivel = "critico";
        resultado.detalhes.push(
          "Foram informadas filiais. O MEI não pode possuir filial."
        );
      }
    }

    if (regime === "Simples Nacional") {
      if (faturamentoAnualProjetado > 5760000) {
        resultado.nivel = "critico";
        resultado.titulo = "Projeção acima de 20% do limite do Simples Nacional";
        resultado.mensagem =
          "A projeção anual supera R$ 5,76 milhões. Revise faturamento e enquadramento antes de concluir a precificação.";
      } else if (faturamentoAnualProjetado > 4800000) {
        resultado.nivel = "critico";
        resultado.titulo = "Limite do Simples Nacional excedido";
        resultado.mensagem =
          "A projeção anual supera o limite geral de R$ 4,8 milhões do Simples Nacional.";
      } else if (faturamentoAnualProjetado > 3600000) {
        resultado.nivel = "atencao";
        resultado.titulo = "Atenção ao sublimite do Simples Nacional";
        resultado.mensagem =
          "A projeção anual está acima de R$ 3,6 milhões. O enquadramento continua dentro do limite geral de R$ 4,8 milhões, mas exige atenção às regras do sublimite.";
      }
    }

    if (regime === "Lucro Presumido") {
      if (faturamentoAnualProjetado > 78000000) {
        resultado.nivel = "critico";
        resultado.titulo = "Possível incompatibilidade com Lucro Presumido";
        resultado.mensagem =
          "A projeção anual supera R$ 78 milhões. Revise o enquadramento, pois o Lucro Real pode ser obrigatório pelo critério de receita.";
      }
    }

    if (regime === "Lucro Real") {
      resultado.titulo = "Lucro Real sem teto máximo nesta validação";
      resultado.mensagem =
        "O motor não aplica um teto artificial ao Lucro Real. Outras hipóteses legais e a complexidade operacional serão avaliadas separadamente.";
    }

    if (regime === "Outro / Especial") {
      resultado.nivel = "atencao";
      resultado.titulo = "Regime especial informado";
      resultado.mensagem =
        "A validação automática de limites não será aplicada a este regime. Revise manualmente o enquadramento antes da proposta.";
    }

    return resultado;
  }, [
    form.regime,
    form.faturamento,
    form.colaboradores,
    form.filiaisDetalhadas,
  ]);

  /* =======================================================
     MOTOR DE COMPLEXIDADE 2026 V1
     Camada diagnóstica: NÃO altera nenhuma fórmula de preço.
     Aplicado somente à Simulação Detalhada.
  ======================================================= */

  const complexidadeOperacional = useMemo(() => {
    if (simulationMode !== "detalhada") return null;

    const faixaFiscal = (valor, tipo) => {
      const n = Math.max(0, numberValue(valor));

      // Sem movimentação fiscal, a dimensão precisa começar em zero.
      if (n <= 0) return 0;

      if (tipo === "entrada") {
        if (n <= 30) return 1;
        if (n <= 100) return 2;
        if (n <= 300) return 4;
        if (n <= 1000) return 6;
        if (n <= 3000) return 8;
        return 10;
      }
      if (n <= 30) return 1;
      if (n <= 100) return 3;
      if (n <= 300) return 5;
      if (n <= 1000) return 8;
      if (n <= 3000) return 11;
      return 15;
    };

    const colaboradores = Math.max(0, numberValue(form.colaboradores));
    let dpBase = 0;
    if (colaboradores > 100) dpBase = 15;
    else if (colaboradores > 50) dpBase = 12;
    else if (colaboradores > 20) dpBase = 9;
    else if (colaboradores > 10) dpBase = 6;
    else if (colaboradores > 5) dpBase = 4;
    else if (colaboradores > 0) dpBase = 2;

    const pontosMovimentacao = {
      nenhuma: 0,
      "1-2": 1,
      "3-5": 2,
      "6-10": 3,
      "mais-10": 5,
    }[form.movimentacaoFuncionarios] || 0;

    const regimePontos = {
      MEI: 1,
      "Simples Nacional": 3,
      "Lucro Presumido": 6,
      "Lucro Real": 10,
      "Outro / Especial": 6,
    }[form.regime] || 0;

    // A exposição à Reforma Tributária fica registrada como diagnóstico.
    // Na V1 não adicionamos pontos sem dados específicos do futuro módulo Reforma.
    const reformaPontos = 0;

    const quantidadeFiliais = Array.isArray(form.filiaisDetalhadas)
      ? form.filiaisDetalhadas.length
      : 0;

    // Estrutura acompanha o que o motor financeiro realmente mede:
    // filiais + movimentação/quantidade de contas bancárias.
    let pontosFiliais = 0;
    if (quantidadeFiliais > 10) pontosFiliais = 15;
    else if (quantidadeFiliais >= 6) pontosFiliais = 13;
    else if (quantidadeFiliais >= 4) pontosFiliais = 11;
    else if (quantidadeFiliais === 3) pontosFiliais = 9;
    else if (quantidadeFiliais === 2) pontosFiliais = 7;
    else if (quantidadeFiliais === 1) pontosFiliais = 4;

    const estruturaPontos = Math.min(
      15,
      pontosFiliais + Math.round(Number(result.bankFactor || 0) * 100)
    );

    // Espelha as regras monetárias já existentes em getOperationFactor:
    // interestadual +3% por direção; exterior +7% por direção;
    // exportação/importação recebem +2 p.p. acima de 20 e +2 p.p. acima de 100.
    let operacoesPontosBrutos = 0;
    if (form.vendeOutrosEstados) operacoesPontosBrutos += 3;
    if (form.compraOutrosEstados) operacoesPontosBrutos += 3;

    if (form.vendeExterior) {
      operacoesPontosBrutos += 7;
      const docsExportacao = Math.max(0, numberValue(form.documentosExportacao));
      if (docsExportacao > 20) operacoesPontosBrutos += 2;
      if (docsExportacao > 100) operacoesPontosBrutos += 2;
    }

    if (form.compraExterior) {
      operacoesPontosBrutos += 7;
      const docsImportacao = Math.max(0, numberValue(form.documentosImportacao));
      if (docsImportacao > 20) operacoesPontosBrutos += 2;
      if (docsImportacao > 100) operacoesPontosBrutos += 2;
    }

    const operacoesPontos = Math.min(15, operacoesPontosBrutos);

    // As complexidades adicionais já alteram o preço no pricingEngine.
    // O diagnóstico passa a medi-las com os mesmos pesos, sem criar nova regra financeira.
    const complexidadesPontos = Math.min(
      20,
      (form.retencoes ? 2 : 0) +
        (form.substituicaoTributaria ? 3 : 0) +
        (form.multiplasAtividades ? 3 : 0) +
        (form.folhaComplexa ? 4 : 0) +
        (form.admissoesDemissoes ? 3 : 0) +
        (form.parcelamentos ? 2 : 0) +
        (form.obrigacoesEspecificas ? 4 : 0) +
        (form.beneficiosFiscais ? 3 : 0)
    );

    const faturamento = Math.max(0, numberValue(form.faturamento));
    let portePontos = 0;
    if (faturamento > 5000000) portePontos = 10;
    else if (faturamento > 2000000) portePontos = 8;
    else if (faturamento > 1000000) portePontos = 6;
    else if (faturamento > 500000) portePontos = 5;
    else if (faturamento > 300000) portePontos = 4;
    else if (faturamento > 100000) portePontos = 3;
    else if (faturamento > 30000) portePontos = 2;
    else if (faturamento > 0) portePontos = 1;

    const fiscalPontos =
      faixaFiscal(form.notasEntrada, "entrada") +
      faixaFiscal(form.notasSaida, "saida");
    const dpPontos = Math.min(20, dpBase + pontosMovimentacao);
    const tributarioPontos = Math.min(15, regimePontos + reformaPontos);

    const total = Math.min(
      100,
      fiscalPontos +
        dpPontos +
        tributarioPontos +
        estruturaPontos +
        operacoesPontos +
        complexidadesPontos +
        portePontos
    );

    const classificarTotal = (pontos) => {
      if (pontos <= 15) return "Baixa";
      if (pontos <= 35) return "Média";
      if (pontos <= 60) return "Alta";
      return "Muito alta";
    };

    const classificarDimensao = (pontos, maximo) => {
      const percentual = maximo > 0 ? pontos / maximo : 0;
      if (percentual <= 0.25) return "Baixa";
      if (percentual <= 0.5) return "Média";
      if (percentual <= 0.75) return "Alta";
      return "Muito alta";
    };

    const motivos = [];
    const totalDocs = numberValue(form.notasEntrada) + numberValue(form.notasSaida);
    if (totalDocs > 1000) motivos.push(`${integer(totalDocs)} documentos fiscais/mês`);
    else if (totalDocs > 300) motivos.push(`volume fiscal de ${integer(totalDocs)} documentos/mês`);
    if (colaboradores > 50) motivos.push(`${integer(colaboradores)} colaboradores`);
    else if (colaboradores > 10) motivos.push(`folha com ${integer(colaboradores)} colaboradores`);
    if (pontosMovimentacao >= 3) motivos.push("alta movimentação de pessoal");
    if (quantidadeFiliais > 0) motivos.push(`${quantidadeFiliais} ${quantidadeFiliais === 1 ? "filial" : "filiais"}`);
    if (form.compraExterior && form.vendeExterior) motivos.push("importação e exportação");
    else if (form.compraExterior) motivos.push("importação");
    else if (form.vendeExterior) motivos.push("exportação");
    if (form.compraOutrosEstados && form.vendeOutrosEstados) motivos.push("compras e vendas interestaduais");
    else if (form.vendeOutrosEstados) motivos.push("vendas interestaduais");
    else if (form.compraOutrosEstados) motivos.push("compras interestaduais");
    if (form.regime === "Lucro Real") motivos.push("Lucro Real");
    else if (form.regime === "Lucro Presumido") motivos.push("Lucro Presumido");

    return {
      total,
      classificacao: classificarTotal(total),
      reforma: "Exposição em avaliação",
      motivos: motivos.slice(0, 5),
      dimensoes: [
        { nome: "Fiscal", pontos: fiscalPontos, maximo: 25, nivel: classificarDimensao(fiscalPontos, 25) },
        { nome: "Departamento Pessoal", pontos: dpPontos, maximo: 20, nivel: classificarDimensao(dpPontos, 20) },
        { nome: "Tributário + Reforma", pontos: tributarioPontos, maximo: 15, nivel: classificarDimensao(tributarioPontos, 15) },
        { nome: "Estrutura", pontos: estruturaPontos, maximo: 15, nivel: classificarDimensao(estruturaPontos, 15) },
        { nome: "Operações", pontos: operacoesPontos, maximo: 15, nivel: classificarDimensao(operacoesPontos, 15) },
        { nome: "Complexidades adicionais", pontos: complexidadesPontos, maximo: 20, nivel: classificarDimensao(complexidadesPontos, 20) },
        { nome: "Porte", pontos: portePontos, maximo: 10, nivel: classificarDimensao(portePontos, 10) },
      ],
    };
  }, [
    simulationMode,
    form.notasEntrada,
    form.notasSaida,
    form.colaboradores,
    form.movimentacaoFuncionarios,
    form.regime,
    form.filiaisDetalhadas,
    form.compraOutrosEstados,
    form.vendeOutrosEstados,
    form.compraExterior,
    form.vendeExterior,
    form.documentosExportacao,
    form.documentosImportacao,
    form.faturamento,
    form.movimentacaoBancaria,
    form.contasBancarias,
    form.retencoes,
    form.substituicaoTributaria,
    form.multiplasAtividades,
    form.folhaComplexa,
    form.admissoesDemissoes,
    form.parcelamentos,
    form.obrigacoesEspecificas,
    form.beneficiosFiscais,
    result.bankFactor,
  ]);

  /* =======================================================
     VALIDAÇÕES
  ======================================================= */

  const missingManualDP = result.dp.precisaValorManual;

  const canCalculate =
    form.regime &&
    form.atividade &&
    numberValue(form.faturamento) > 0 &&
    !missingManualDP;

  /* =======================================================
     SALVAR
  ======================================================= */

  const saveSimulation = async () => {
    if (!podeCriarSimulacao) {
      alert(
        "Seu perfil possui acesso para visualizar este módulo, mas não possui permissão para criar novas simulações."
      );
      return null;
    }

    if (!canCalculate) {
      if (missingManualDP) {
        alert(
          "Para empresas com mais de 100 colaboradores, informe o valor de DP por colaborador."
        );

        return;
      }

      alert(
        "Preencha pelo menos regime tributário, atividade e faturamento."
      );

      return;
    }

    const storageKey = "precificacont_simulacoes";

    let existing = [];

    try {
      const cache = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      );

      existing = Array.isArray(cache) ? cache : [];
    } catch {
      existing = [];
    }

    const simulation = {
      id:
        savedSimulation?.id ||
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`),

      created_date: new Date().toISOString(),

      cliente: form.cliente || "Simulação sem cliente",

      client_nome: form.cliente || "Simulação sem cliente",

      cnpj: form.cnpj,

      regime: form.regime,

      atividade: form.atividade,

      faturamento: numberValue(form.faturamento),

      uf: form.uf,

      colaboradores: numberValue(form.colaboradores),

      valor_colaborador: result.dp.valorUnitario,

      valor_dp: result.dp.total,

      faixa_dp: result.dp.faixa,

      notas_saida: numberValue(form.notasSaida),

      notas_entrada: numberValue(form.notasEntrada),

      documentos_venda_interestadual: numberValue(form.documentosVendaInterestadual),

      documentos_compra_interestadual: numberValue(form.documentosCompraInterestadual),

      outros_documentos: numberValue(form.outrosDocumentos),

      total_documentos: result.totalDocumentos,

      filiais: Array.isArray(form.filiaisDetalhadas)
        ? form.filiaisDetalhadas.length
        : 0,

      filiais_detalhadas: Array.isArray(form.filiaisDetalhadas)
        ? form.filiaisDetalhadas
        : [],

      valor_filiais: Number(result.branchTotal || 0),

      tipo_simulacao: simulationMode,

      valor_base: result.base,

      valor_contabil_fiscal: result.contabilFiscal,

      valor_tabela: Math.round(result.indice),

      valor_negociado: Math.round(result.indice),

      referencia_competitiva: Math.round(result.competitivo),

      referencia_superior: Math.round(result.premium),

      honorario_atual: numberValue(form.honorarioAtual),

      servicos_adicionais: resumoServicos.detalhados,

      adicionais_recorrentes:
        Math.round(resumoServicos.recorrentes * 100) / 100,

      adicionais_pontuais:
        Math.round(resumoServicos.pontuais * 100) / 100,

      mensalidade_total:
        Math.round(
          (result.indice + resumoServicos.recorrentes) * 100
        ) / 100,

      proposta_primeiro_mes:
        Math.round(
          (
            result.indice +
            resumoServicos.recorrentes +
            resumoServicos.pontuais
          ) * 100
        ) / 100,

      status: "calculado",

      calculation_method: "PRECIFICACONT_ENGINE",

      benchmark_version: ENGINE_VERSION,

      pricing_snapshot: {
        base: result.base,

        departamento_pessoal: {
          colaboradores: result.dp.quantidade,
          faixa: result.dp.faixa,
          valor_unitario: result.dp.valorUnitario,
          total: result.dp.total,
          manual: result.dp.manual,
        },

        documentos: {
          saida: numberValue(form.notasSaida),
          entrada: numberValue(form.notasEntrada),
          outros: numberValue(form.outrosDocumentos),
          total: result.totalDocumentos,
        },

        operacoes: {
          vende_outros_estados: form.vendeOutrosEstados,
          estados_venda: form.estadosVenda,
          documentos_venda_interestadual: numberValue(form.documentosVendaInterestadual),

          compra_outros_estados: form.compraOutrosEstados,
          estados_compra: form.estadosCompra,
          documentos_compra_interestadual: numberValue(form.documentosCompraInterestadual),

          vende_exterior: form.vendeExterior,
          paises_venda: form.paisesVenda,

          compra_exterior: form.compraExterior,
          paises_compra: form.paisesCompra,
        },

        estrutura: {
          filiais: Array.isArray(form.filiaisDetalhadas)
            ? form.filiaisDetalhadas
            : [],
          quantidade_filiais: Array.isArray(form.filiaisDetalhadas)
            ? form.filiaisDetalhadas.length
            : 0,
          valor_filiais: Number(result.branchTotal || 0),
          contas_bancarias: numberValue(form.contasBancarias),
          movimentacao_bancaria: form.movimentacaoBancaria,
        },

        resultado: {
          contabil_fiscal: result.contabilFiscal,
          dp: result.dp.total,
          indice: result.indice,
          competitivo: result.competitivo,
          superior: result.premium,
          nivel: result.nivel,
          confianca: confidence,
        },
      },
    };

    /*
      O histórico já migrado continua usando o mesmo formato visual.
      O objeto completo também fica em "dados" no Supabase para não perder
      nenhum campo específico da memória de cálculo atual.
    */
    const registroBanco = {
      id: simulation.id,
      cliente: simulation.cliente,
      client_nome: simulation.client_nome,
      cnpj: simulation.cnpj || "",
      regime: simulation.regime || "",
      atividade: simulation.atividade || "",
      faturamento: Number(simulation.faturamento || 0),
      colaboradores: Number(simulation.colaboradores || 0),
      total_documentos: Number(simulation.total_documentos || 0),
      tipo_simulacao: simulation.tipo_simulacao || "rapida",
      status: simulation.status || "calculado",
      indice_precificacont: Number(result.indice || 0),
      valor_tabela: Number(simulation.valor_tabela || 0),
      valor_negociado: Number(simulation.valor_negociado || 0),
      valor_contabil_fiscal: Number(
        simulation.valor_contabil_fiscal || 0
      ),
      valor_dp: Number(simulation.valor_dp || 0),
      valor_colaborador: Number(
        simulation.valor_colaborador || 0
      ),
      valor_filiais: Number(simulation.valor_filiais || 0),
      valor_servicos_mensais: Number(
        simulation.adicionais_recorrentes || 0
      ),
      valor_servicos_pontuais: Number(
        simulation.adicionais_pontuais || 0
      ),
      valor_total_mensal: Number(
        simulation.mensalidade_total || 0
      ),
      filiais_detalhadas: simulation.filiais_detalhadas || [],
      servicos_adicionais: simulation.servicos_adicionais || [],
      engine_version: ENGINE_VERSION,
      dados: simulation,
      created_date: simulation.created_date,
      updated_date: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from("simulacoes")
        .upsert(registroBanco, { onConflict: "id" });

      if (error) throw error;

      // Mantém a Nova Simulação ligada ao CRM de forma persistente.
      // Se veio do CRM, atualiza a oportunidade existente. Se nasceu aqui, cria uma única oportunidade.
      const escritorioAtivoId = getEscritorioAtivoIdNovaSimulacao();
      let crmOportunidadeId =
        savedSimulation?.crm_oportunidade_id ||
        crmOrigem?.crm_oportunidade_id ||
        crmOrigem?.oportunidade_id ||
        null;

      if (escritorioAtivoId) {
        try {
          let oportunidadeExistente = null;

          if (crmOportunidadeId) {
            const { data: oportunidadeBanco, error: erroBuscarCRM } = await supabase
              .from(CRM_TABLE)
              .select("*")
              .eq("id", crmOportunidadeId)
              .eq("escritorio_id", escritorioAtivoId)
              .maybeSingle();

            if (erroBuscarCRM) throw erroBuscarCRM;
            oportunidadeExistente = oportunidadeBanco || null;
          }

          if (!crmOportunidadeId) crmOportunidadeId = novoUuidSeguro();

          const agoraCRM = new Date().toISOString();
          const historicoAtual = Array.isArray(oportunidadeExistente?.historico)
            ? oportunidadeExistente.historico
            : [];
          const jaRegistrouSimulacao = historicoAtual.some(
            (evento) =>
              evento?.tipo === "simulacao_criada" &&
              String(evento?.simulacao_id || "") === String(simulation.id)
          );

          const historicoCRM = jaRegistrouSimulacao
            ? historicoAtual
            : [
                {
                  id: novoUuidSeguro(),
                  criadoEm: agoraCRM,
                  tipo: "simulacao_criada",
                  titulo: "Simulação criada",
                  descricao: `Simulação ${simulation.id} criada no PrecificaCont.`,
                  simulacao_id: simulation.id,
                },
                ...historicoAtual,
              ];

          const registroCRM = {
            id: crmOportunidadeId,
            escritorio_id: escritorioAtivoId,
            cliente: form.cliente || oportunidadeExistente?.cliente || "Simulação sem cliente",
            documento: form.cnpj || oportunidadeExistente?.documento || "",
            contato: oportunidadeExistente?.contato || crmOrigem?.contato || crmOrigem?.dados?.contato || "",
            email: oportunidadeExistente?.email || crmOrigem?.email || crmOrigem?.email_cliente || crmOrigem?.dados?.email || "",
            telefone: oportunidadeExistente?.telefone || crmOrigem?.telefone || crmOrigem?.whatsapp || crmOrigem?.dados?.telefone || "",
            valor_mensal: Number(simulation.mensalidade_total || result?.indice || 0),
            etapa: "simulacao",
            origem: oportunidadeExistente?.origem || "Nova Simulação",
            proxima_atividade: oportunidadeExistente?.proxima_atividade || "",
            data_followup: oportunidadeExistente?.data_followup || null,
            proposta: oportunidadeExistente?.proposta || "",
            observacoes: oportunidadeExistente?.observacoes || "",
            motivo_perda: oportunidadeExistente?.motivo_perda || "",
            atividades: Array.isArray(oportunidadeExistente?.atividades) ? oportunidadeExistente.atividades : [],
            historico: historicoCRM,
            etapa_alterada_em: oportunidadeExistente?.etapa === "simulacao"
              ? oportunidadeExistente?.etapa_alterada_em || agoraCRM
              : agoraCRM,
            ganho_em: oportunidadeExistente?.ganho_em || null,
            perdido_em: oportunidadeExistente?.perdido_em || null,
            reaberta_em: oportunidadeExistente?.reaberta_em || null,
            created_at: oportunidadeExistente?.created_at || agoraCRM,
            updated_at: agoraCRM,
          };

          const { error: erroSalvarCRM } = await supabase
            .from(CRM_TABLE)
            .upsert(registroCRM, { onConflict: "id" });

          if (erroSalvarCRM) throw erroSalvarCRM;

          simulation.crm_oportunidade_id = crmOportunidadeId;
          registroBanco.dados = simulation;

          // Garante que o vínculo também fique gravado dentro de `dados` da simulação.
          const { error: erroVinculoSimulacao } = await supabase
            .from("simulacoes")
            .update({ dados: simulation, updated_date: agoraCRM })
            .eq("id", simulation.id);

          if (erroVinculoSimulacao) throw erroVinculoSimulacao;
        } catch (erroCRM) {
          console.error("Erro ao sincronizar simulação com o CRM:", erroCRM);
          throw erroCRM;
        }
      }

      // Cache local continua existindo para velocidade e compatibilidade
      // com as telas já validadas, mas o Supabase passa a ser persistência real.
      const cacheAtualizado = [
        simulation,
        ...existing.filter(
          (item) => String(item?.id) !== String(simulation.id)
        ),
      ];

      localStorage.setItem(
        storageKey,
        JSON.stringify(cacheAtualizado)
      );

      setSaved(true);
      setSavedSimulation(simulation);
      return simulation;
    } catch (error) {
      console.error(
        "Erro ao salvar simulação no Supabase:",
        error
      );

      alert(
        `Não foi possível salvar a simulação no banco de dados.\n\nMotivo: ${
          error?.message || "erro não identificado"
        }`
      );

      return null;
    }
  };

  /* =======================================================
     GERAR PROPOSTA — SNAPSHOT DA SIMULAÇÃO
     A proposta nasce da mesma memória de cálculo do motor.
     O PDF/link serão tratados no módulo Propostas.
  ======================================================= */


  const proposalFiliais = proposalInclude.filiais
    ? (Array.isArray(form.filiaisDetalhadas)
        ? form.filiaisDetalhadas
        : [])
    : [];

  const proposalServicos = proposalInclude.servicos
    ? resumoServicos.detalhados
    : [];

  const proposalMatriz = proposalInclude.matriz
    ? Number(result?.indice || 0)
    : 0;

  const proposalFilialTotal = proposalFiliais.length
    ? Number(result?.branchTotal || 0)
    : 0;

  const isServicoRecorrente = (item) =>
    ["mensal", "recorrente"].includes(
      String(item?.recorrencia || "").toLowerCase()
    );

  const valorTotalServico = (item) =>
    Number(item?.valor_final ?? item?.total ?? 0);

  const proposalServicosRecorrentes = proposalServicos
    .filter((item) => isServicoRecorrente(item))
    .reduce((sum, item) => sum + valorTotalServico(item), 0);

  const proposalServicosPontuais = proposalServicos
    .filter((item) => !isServicoRecorrente(item))
    .reduce((sum, item) => sum + valorTotalServico(item), 0);

  const proposalMensalBruto =
    proposalMatriz + proposalFilialTotal + proposalServicosRecorrentes;

  const descontoComercialPercentual =
    aplicarDescontoComercial && regrasDesconto.permitido
      ? Math.min(
          regrasDesconto.percentualMaximo,
          Math.max(0, Number(descontoComercial || 0))
        )
      : 0;

  const descontoComercialValor =
    Math.round(
      proposalMensalBruto * (descontoComercialPercentual / 100) * 100
    ) / 100;

  const proposalMensalTotal =
    Math.round((proposalMensalBruto - descontoComercialValor) * 100) / 100;

  const proposalPrimeiroMes =
    Math.round((proposalMensalTotal + proposalServicosPontuais) * 100) / 100;

  const openProposalBuilder = () => {
    setProposalMode(
      resumoServicos.detalhados.length > 0 &&
      !form.filiaisDetalhadas?.length &&
      !canCalculate
        ? "servicos"
        : "completa"
    );

    setProposalInclude({
      matriz: canCalculate,
      filiais:
        Array.isArray(form.filiaisDetalhadas) &&
        form.filiaisDetalhadas.length > 0,
      servicos: resumoServicos.detalhados.length > 0,
    });

    setProposalBuilderOpen(true);
  };

  const selectProposalMode = (mode) => {
    setProposalMode(mode);

    if (mode === "servicos") {
      setProposalInclude({
        matriz: false,
        filiais: false,
        servicos: true,
      });
      return;
    }

    if (mode === "completa") {
      setProposalInclude({
        matriz: canCalculate,
        filiais:
          Array.isArray(form.filiaisDetalhadas) &&
          form.filiaisDetalhadas.length > 0,
        servicos: resumoServicos.detalhados.length > 0,
      });
      return;
    }

    setProposalInclude({
      matriz: canCalculate,
      filiais:
        Array.isArray(form.filiaisDetalhadas) &&
        form.filiaisDetalhadas.length > 0,
      servicos: resumoServicos.detalhados.length > 0,
    });
  };

  const generateProposal = async () => {
    const clienteProposta = String(form.cliente || "").trim();
    const documentoProposta = String(form.cnpj || "").trim();

    if (!clienteProposta || !documentoProposta) {
      alert("Para gerar a proposta, informe obrigatoriamente a Empresa / cliente e o CNPJ/CPF.");
      return false;
    }

    if (!documentoValido(documentoProposta)) {
      const digits = somenteDigitosDocumento(documentoProposta);
      const tipo = digits.length <= 11 ? "CPF" : "CNPJ";
      alert(`${tipo} inválido. Confira a numeração antes de gerar a proposta.`);
      return false;
    }

    const somenteServicos =
      proposalMode === "servicos" &&
      proposalInclude.servicos &&
      resumoServicos.detalhados.length > 0;

    if (!canCalculate && !somenteServicos) {
      alert("Conclua os dados obrigatórios da simulação ou selecione somente serviços adicionais.");
      return;
    }

    // Garante uma única simulação persistida antes de criar a proposta.
    // Assim Proposta, Histórico e CRM passam a compartilhar a mesma origem.
    const simulacaoVinculada = await saveSimulation();

    if (!simulacaoVinculada?.id) {
      return false;
    }

    const itensSelecionados = [];

    const TEMPLATE_PROPOSTA_KEY = "precificacont_template_proposta";

    const configuracaoPadraoProposta = {
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
    };

    let templateOficial = {};

    try {
      const templateSalvo = JSON.parse(
        localStorage.getItem(TEMPLATE_PROPOSTA_KEY) || "{}"
      );

      if (
        templateSalvo &&
        typeof templateSalvo === "object" &&
        !Array.isArray(templateSalvo)
      ) {
        templateOficial = templateSalvo;
      }
    } catch (error) {
      console.error("Erro ao carregar template padrão da proposta:", error);
    }

    const configuracaoDaProposta = {
      ...configuracaoPadraoProposta,
      ...templateOficial,
    };

    if (proposalInclude.matriz && canCalculate) {
      itensSelecionados.push({
        tipo: "honorario_matriz",
        descricao: "Honorários contábeis — Matriz",
        recorrencia: "mensal",
        valor: Number(result.contabilFiscal || 0),
        valor_total_referencia: Number(result.indice || 0),
      });

      if (Number(result?.dp?.quantidade || 0) > 0) {
        itensSelecionados.push({
          tipo: "departamento_pessoal",
          descricao: "Departamento Pessoal",
          recorrencia: "mensal",
          quantidade: Number(result.dp.quantidade || 0),
          unidade: "colaborador",
          valor_unitario: Number(result.dp.valorUnitario || 0),
          valor: Number(result.dp.total || 0),
          total: Number(result.dp.total || 0),
          faixa: result.dp.faixa || "",
          manual: Boolean(result.dp.manual),
        });
      }
    }

    if (proposalInclude.filiais) {
      proposalFiliais.forEach((filial, index) => {
        const detalhe = result?.branches?.detalhes?.find(
          (item) => item.index === index
        );

        itensSelecionados.push({
          tipo: "filial",
          descricao: `Filial ${index + 1}`,
          recorrencia: "mensal",
          quantidade: 1,
          valor_unitario: Number(detalhe?.valor || 0),
          valor: Number(detalhe?.valor || 0),
          total: Number(detalhe?.valor || 0),
          modelo:
            filial?.centralizada === true ||
            filial?.tipo === "centralizada" ||
            filial?.modelo === "centralizada"
              ? "centralizada"
              : "descentralizada",
          filial: { ...filial },
          calculo: detalhe ? { ...detalhe } : null,
        });
      });
    }

    if (proposalInclude.servicos) {
      proposalServicos.forEach((servico) => {
        const recorrente = isServicoRecorrente(servico);
        const quantidade = Math.max(1, Number(servico.quantidade || 1));
        const valorUnitario = Number(servico.valor_unitario || 0);
        const valorTotal = valorTotalServico(servico);

        itensSelecionados.push({
          tipo: "servico_adicional",
          descricao: servico.nome,
          categoria: servico.categoria || "",
          recorrencia: recorrente ? "mensal" : "pontual",
          grupo: recorrente ? "servicos_recorrentes" : "servicos_avulsos",
          quantidade,
          valor_unitario: valorUnitario,
          valor: valorTotal,
          total: valorTotal,
          desconto_percentual: Number(servico.desconto_percentual || 0),
          servico: { ...servico },
        });
      });
    }

    if (itensSelecionados.length === 0) {
      alert("Selecione pelo menos um item para gerar a proposta.");
      return;
    }

    const storageKey = "precificacont_propostas";
    let existing = [];

    try {
      const existingRaw = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      );
      existing = Array.isArray(existingRaw) ? existingRaw : [];
    } catch {
      existing = [];
    }

    const anoProposta = new Date().getFullYear();
    let numeroProposta = "";

    try {
      const { data: numeroRemoto, error: erroNumero } = await supabase.rpc(
        "proximo_numero_proposta"
      );

      if (erroNumero) throw erroNumero;

      numeroProposta = String(numeroRemoto || "").trim();

      if (!numeroProposta) {
        throw new Error("O Supabase não retornou o próximo número da proposta.");
      }
    } catch (error) {
      console.error("Erro ao gerar número da proposta no Supabase:", error);
      alert(
        `Não foi possível gerar a numeração da proposta: ${
          error?.message || "verifique a conexão com o Supabase"
        }`
      );
      return false;
    }

    const proposalId = `PROP-${Date.now()}`;
    const now = new Date();
    const validadeDias = Math.max(
      1,
      Number(configuracaoDaProposta.validadeDias || 7)
    );
    const validade = new Date(now);
    validade.setDate(validade.getDate() + validadeDias);

    const proposal = {
      id: proposalId,
      numero_proposta: numeroProposta,
      created_date: now.toISOString(),
      updated_date: now.toISOString(),

      version: 1,
      status: "rascunho",
      origem: "Nova Simulação",
      tipo_simulacao: simulationMode,
      simulacao_id: simulacaoVinculada.id,
      simulation_id: simulacaoVinculada.id,
      tipo_proposta:
        proposalMode === "servicos"
          ? "servicos_adicionais"
          : proposalMode === "personalizada"
          ? "personalizada"
          : "completa",
      itens_proposta: itensSelecionados,
      incluir: {
        matriz: Boolean(proposalInclude.matriz),
        filiais: Boolean(proposalInclude.filiais),
        servicos: Boolean(proposalInclude.servicos),
      },

      condicao_comercial: {
        aplicar_desconto: Boolean(
          aplicarDescontoComercial && descontoComercialPercentual > 0
        ),
        desconto_percentual: descontoComercialPercentual,
        desconto_valor: descontoComercialValor,
        desconto_percentual_maximo_parametrizado:
          regrasDesconto.percentualMaximo,
        mensalidade_bruta: Math.round(proposalMensalBruto * 100) / 100,
        mensalidade_final: Math.round(proposalMensalTotal * 100) / 100,
        indice_precificacont_original:
          Math.round(Number(result?.indice || 0) * 100) / 100,
      },

      cliente: clienteProposta,
      client_nome: clienteProposta,

      // Documento informado na Nova Simulação.
      // Mantemos aliases para que o template/editor de Propostas reconheça
      // o mesmo dado independentemente do fluxo de origem.
      cnpj: formatarCpfCnpj(documentoProposta),
      documento: formatarCpfCnpj(documentoProposta),
      cpf_cnpj: formatarCpfCnpj(documentoProposta),
      cpfCnpj: formatarCpfCnpj(documentoProposta),

      origem_crm: Boolean(
        simulacaoVinculada?.crm_oportunidade_id || crmOrigem
      ),
      crm_oportunidade_id:
        simulacaoVinculada?.crm_oportunidade_id ||
        crmOrigem?.crm_oportunidade_id ||
        crmOrigem?.oportunidade_id ||
        null,
      oportunidade_id:
        simulacaoVinculada?.crm_oportunidade_id ||
        crmOrigem?.oportunidade_id ||
        crmOrigem?.crm_oportunidade_id ||
        null,
      contato: crmOrigem?.contato || crmOrigem?.dados?.contato || "",
      email_cliente:
        crmOrigem?.email_cliente ||
        crmOrigem?.email ||
        crmOrigem?.dados?.email ||
        "",
      telefone:
        crmOrigem?.telefone ||
        crmOrigem?.whatsapp ||
        crmOrigem?.dados?.telefone ||
        "",

      validade_dias: validadeDias,
      validade: validade.toISOString(),

      dados_cliente: {
        nome: clienteProposta,
        cnpj: formatarCpfCnpj(documentoProposta),
        documento: formatarCpfCnpj(documentoProposta),
        cpf_cnpj: formatarCpfCnpj(documentoProposta),
        cpfCnpj: formatarCpfCnpj(documentoProposta),
        uf: form.uf || "",
        regime: form.regime || "",
        atividade: form.atividade || "",
        faturamento: numberValue(form.faturamento),
        colaboradores: numberValue(form.colaboradores),
        notas_saida: numberValue(form.notasSaida),
        notas_entrada: numberValue(form.notasEntrada),
        outros_documentos: numberValue(form.outrosDocumentos),
      },

      composicao_detalhada: {
        honorarios_recorrentes: {
          matriz: proposalInclude.matriz
            ? {
                descricao: "Honorários contábeis — Matriz",
                valor_contabil_fiscal: Number(result.contabilFiscal || 0),
                valor_referencia_matriz: Number(result.indice || 0),
              }
            : null,
          filiais: proposalInclude.filiais
            ? itensSelecionados.filter((item) => item.tipo === "filial")
            : [],
        },
        departamento_pessoal:
          proposalInclude.matriz && Number(result?.dp?.quantidade || 0) > 0
            ? {
                quantidade: Number(result.dp.quantidade || 0),
                unidade: "colaborador",
                valor_unitario: Number(result.dp.valorUnitario || 0),
                total: Number(result.dp.total || 0),
                faixa: result.dp.faixa || "",
                manual: Boolean(result.dp.manual),
              }
            : null,
        servicos_recorrentes: itensSelecionados.filter(
          (item) =>
            item.tipo === "servico_adicional" &&
            item.recorrencia === "mensal"
        ),
        servicos_avulsos: itensSelecionados.filter(
          (item) =>
            item.tipo === "servico_adicional" &&
            item.recorrencia === "pontual"
        ),
        documentos: {
          notas_saida: numberValue(form.notasSaida),
          notas_entrada: numberValue(form.notasEntrada),
          outros_documentos: numberValue(form.outrosDocumentos),
          total: Number(result.totalDocumentos || 0),
        },
      },

      matriz: {
        honorario_recomendado: Math.round(result.indice),
        referencia_competitiva: Math.round(result.competitivo),
        referencia_superior: Math.round(result.premium),
        honorario_atual: numberValue(form.honorarioAtual),
        valor_base: result.base,
        valor_contabil_fiscal: result.contabilFiscal,
        departamento_pessoal: {
          quantidade: Number(result?.dp?.quantidade || 0),
          valor_unitario: Number(result?.dp?.valorUnitario || 0),
          total: Number(result?.dp?.total || 0),
          faixa: result?.dp?.faixa || "",
          manual: Boolean(result?.dp?.manual),
        },
      },

      filiais: {
        quantidade: Array.isArray(form.filiaisDetalhadas)
          ? form.filiaisDetalhadas.length
          : 0,
        valor_total: Number(result.branchTotal || 0),
        detalhadas: Array.isArray(form.filiaisDetalhadas)
          ? form.filiaisDetalhadas
          : [],
      },

      servicos_adicionais: resumoServicos.detalhados,
      servicos_recorrentes: itensSelecionados.filter(
        (item) =>
          item.tipo === "servico_adicional" &&
          item.recorrencia === "mensal"
      ),
      servicos_avulsos: itensSelecionados.filter(
        (item) =>
          item.tipo === "servico_adicional" &&
          item.recorrencia === "pontual"
      ),
      adicionais_recorrentes:
        Math.round(proposalServicosRecorrentes * 100) / 100,
      adicionais_pontuais:
        Math.round(proposalServicosPontuais * 100) / 100,

      valores: {
        mensalidade_bruta: Math.round(proposalMensalBruto * 100) / 100,
        desconto_comercial_percentual: descontoComercialPercentual,
        desconto_comercial_valor: Math.round(descontoComercialValor * 100) / 100,
        honorario_matriz: Math.round(proposalMatriz * 100) / 100,
        honorario_contabil_fiscal: proposalInclude.matriz
          ? Math.round(Number(result.contabilFiscal || 0) * 100) / 100
          : 0,
        departamento_pessoal: proposalInclude.matriz
          ? Math.round(Number(result?.dp?.total || 0) * 100) / 100
          : 0,
        filiais: Math.round(proposalFilialTotal * 100) / 100,
        servicos_recorrentes:
          Math.round(proposalServicosRecorrentes * 100) / 100,
        servicos_pontuais:
          Math.round(proposalServicosPontuais * 100) / 100,
        mensalidade_total:
          Math.round(proposalMensalTotal * 100) / 100,
        primeiro_mes:
          Math.round(proposalPrimeiroMes * 100) / 100,
      },

      configuracao: { ...configuracaoDaProposta },
      template_oficial: {
        aplicado: Object.keys(templateOficial).length > 0,
        chave: TEMPLATE_PROPOSTA_KEY,
        snapshot: { ...configuracaoDaProposta },
        aplicado_em: now.toISOString(),
      },

      particularidades: [...particularidades],

      pricing_snapshot: {
        engine_version: ENGINE_VERSION,
        calculation_method: "PRECIFICACONT_ENGINE",
        departamento_pessoal: {
          colaboradores: Number(result?.dp?.quantidade || 0),
          faixa: result?.dp?.faixa || "",
          valor_unitario: Number(result?.dp?.valorUnitario || 0),
          total: Number(result?.dp?.total || 0),
          manual: Boolean(result?.dp?.manual),
        },
        documentos: {
          saida: numberValue(form.notasSaida),
          entrada: numberValue(form.notasEntrada),
          outros: numberValue(form.outrosDocumentos),
          total: Number(result.totalDocumentos || 0),
        },
        resultado: {
          contabil_fiscal: result.contabilFiscal,
          dp: result.dp.total,
          indice: result.indice,
          competitivo: result.competitivo,
          superior: result.premium,
          nivel: result.nivel,
          confianca: confidence,
        },
        estrutura: {
          filiais: Array.isArray(form.filiaisDetalhadas)
            ? form.filiaisDetalhadas
            : [],
          quantidade_filiais: Array.isArray(form.filiaisDetalhadas)
            ? form.filiaisDetalhadas.length
            : 0,
          valor_filiais: Number(result.branchTotal || 0),
        },
      },

      aceite: {
        status: "pendente",
        aceito_em: null,
        responsavel: null,
        email: null,
        ip: null,
      },

      pdf: {
        gerado: false,
        arquivo: null,
        gerado_em: null,
      },
    };

    let propostaSalva = proposal;

    try {
      const payloadSupabase = {
        numero_proposta: proposal.numero_proposta,
        cliente: proposal.cliente || null,
        cnpj: proposal.cnpj || null,
        email_cliente: proposal.email_cliente || null,
        titulo:
          proposal.configuracao?.titulo ||
          "Proposta Comercial de Serviços Contábeis",
        status: proposal.status || "rascunho",
        validade: proposal.validade || null,
        dados: proposal,
        publicada: false,
        updated_at: now.toISOString(),
      };

      const tokenPublico = crypto.randomUUID();

      const { error: erroSalvarProposta } = await supabase
        .from("propostas")
        .insert({
          ...payloadSupabase,
          token_publico: tokenPublico,
        });

      if (erroSalvarProposta) throw erroSalvarProposta;

      propostaSalva = {
        ...proposal,
        token_publico: tokenPublico,
        publicada: false,
      };

      // Atualiza a própria simulação com o vínculo da proposta.
      // Os campos extras ficam em `dados`, sem depender de novas colunas no banco.
      const simulacaoAtualizada = {
        ...simulacaoVinculada,
        status: "proposta_gerada",
        proposta_id: propostaSalva.id,
        proposta_numero: propostaSalva.numero_proposta,
        proposta_status: propostaSalva.status,
        crm_oportunidade_id: propostaSalva.crm_oportunidade_id || null,
        updated_date: now.toISOString(),
      };

      const { error: erroAtualizarSimulacao } = await supabase
        .from("simulacoes")
        .update({
          status: "proposta_gerada",
          dados: simulacaoAtualizada,
          updated_date: now.toISOString(),
        })
        .eq("id", simulacaoVinculada.id);

      if (erroAtualizarSimulacao) throw erroAtualizarSimulacao;

      setSavedSimulation(simulacaoAtualizada);

      try {
        const simulacoesCache = JSON.parse(
          localStorage.getItem("precificacont_simulacoes") || "[]"
        );

        if (Array.isArray(simulacoesCache)) {
          localStorage.setItem(
            "precificacont_simulacoes",
            JSON.stringify(
              simulacoesCache.map((item) =>
                String(item?.id) === String(simulacaoVinculada.id)
                  ? simulacaoAtualizada
                  : item
              )
            )
          );
        }
      } catch (cacheError) {
        console.warn("Vínculo salvo no Supabase, mas o cache da simulação não foi atualizado:", cacheError);
      }
    } catch (error) {
      console.error("Erro ao salvar nova proposta no Supabase:", error);
      alert(
        `Não foi possível gerar a proposta no Supabase: ${
          error?.message || "verifique a conexão"
        }`
      );
      return false;
    }

    try {
      const cacheLeve = [
        {
          id: propostaSalva.id,
          supabase_id: propostaSalva.supabase_id,
          numero_proposta: propostaSalva.numero_proposta,
          cliente: propostaSalva.cliente,
          cnpj: propostaSalva.cnpj,
          email_cliente: propostaSalva.email_cliente || "",
          status: propostaSalva.status,
          validade: propostaSalva.validade,
          publicada: false,
          token_publico: propostaSalva.token_publico || null,
          valores: propostaSalva.valores || {},
          criado_em: propostaSalva.created_date || now.toISOString(),
          atualizado_em: now.toISOString(),
        },
        ...existing.filter(
          (item) =>
            item.numero_proposta !== propostaSalva.numero_proposta
        ),
      ].slice(0, 30);

      localStorage.setItem(storageKey, JSON.stringify(cacheLeve));
    } catch (cacheError) {
      console.warn(
        "Proposta salva no Supabase, mas o cache local não pôde ser atualizado:",
        cacheError
      );
    }

    if (propostaSalva.crm_oportunidade_id) {
      try {
        const escritorioAtivoId = getEscritorioAtivoIdNovaSimulacao();
        const agoraCRM = now.toISOString();

        if (!escritorioAtivoId) {
          throw new Error("Escritório ativo não identificado para sincronizar o CRM.");
        }

        const { data: oportunidadeBanco, error: erroBuscarCRM } = await supabase
          .from(CRM_TABLE)
          .select("*")
          .eq("id", propostaSalva.crm_oportunidade_id)
          .eq("escritorio_id", escritorioAtivoId)
          .maybeSingle();

        if (erroBuscarCRM) throw erroBuscarCRM;
        if (!oportunidadeBanco) {
          throw new Error("Oportunidade vinculada à simulação não foi encontrada no CRM.");
        }

        const historicoAtual = Array.isArray(oportunidadeBanco.historico)
          ? oportunidadeBanco.historico
          : [];
        const valorAnterior = Number(oportunidadeBanco.valor_mensal || 0);
        const valorProposta = Number(
          propostaSalva.valores?.mensalidade_total ||
            propostaSalva.valores?.total_mensal ||
            proposal.valor_mensal ||
            result?.recommended ||
            result?.indice ||
            0
        );

        const historicoAtualizado = [
          {
            id: novoUuidSeguro(),
            criadoEm: agoraCRM,
            tipo: "proposta_criada",
            titulo: "Proposta gerada",
            descricao: `${propostaSalva.numero_proposta} gerada e vinculada à oportunidade. Oportunidade movida para Proposta enviada.`,
            proposta_id: propostaSalva.id,
            numero_proposta: propostaSalva.numero_proposta,
            simulacao_id: simulacaoVinculada.id,
            valor_anterior: valorAnterior,
            valor_proposta: valorProposta,
          },
          ...historicoAtual,
        ];

        const { error: erroAtualizarCRM } = await supabase
          .from(CRM_TABLE)
          .update({
            cliente: propostaSalva.cliente || oportunidadeBanco.cliente || "",
            documento: propostaSalva.cnpj || oportunidadeBanco.documento || "",
            valor_mensal: valorProposta,
            etapa: "proposta_enviada",
            proposta: propostaSalva.numero_proposta || "",
            historico: historicoAtualizado,
            etapa_alterada_em: agoraCRM,
            updated_at: agoraCRM,
          })
          .eq("id", propostaSalva.crm_oportunidade_id)
          .eq("escritorio_id", escritorioAtivoId);

        if (erroAtualizarCRM) throw erroAtualizarCRM;

        // Cache do CRM é apenas aceleração visual; Supabase continua sendo a fonte principal.
        const chavesCRM = [
          `precificacont_crm_oportunidades:${escritorioAtivoId}`,
          "precificacont_crm_oportunidades",
        ];

        chavesCRM.forEach((crmKey) => {
          try {
            const oportunidadesCRM = JSON.parse(localStorage.getItem(crmKey) || "[]");
            if (!Array.isArray(oportunidadesCRM)) return;

            const atualizadas = oportunidadesCRM.map((oportunidade) =>
              String(oportunidade.id) === String(propostaSalva.crm_oportunidade_id)
                ? {
                    ...oportunidade,
                    cliente: propostaSalva.cliente || oportunidade.cliente,
                    documento: propostaSalva.cnpj || oportunidade.documento,
                    etapa: "proposta_enviada",
                    valorMensal: valorProposta,
                    proposta: propostaSalva.numero_proposta,
                    updatedAt: agoraCRM,
                    historico: historicoAtualizado,
                  }
                : oportunidade
            );

            localStorage.setItem(crmKey, JSON.stringify(atualizadas));
          } catch {
            // Cache inválido não pode impedir a persistência já concluída no Supabase.
          }
        });
      } catch (error) {
        console.error("Erro ao vincular proposta ao CRM no Supabase:", error);
        alert(
          `A proposta foi gerada, mas não foi possível atualizar o CRM.\n\nMotivo: ${
            error?.message || "erro não identificado"
          }`
        );
      }
    }

    // A proposta já está persistida neste ponto. Mantém a referência exata
    // para o módulo Propostas abrir o registro recém-criado, sem criar uma
    // segunda proposta a partir do rascunho do CRM.
    const referenciaProposta =
      propostaSalva.numero_proposta ||
      propostaSalva.supabase_id ||
      propostaSalva.id ||
      "";

    if (referenciaProposta) {
      localStorage.setItem(
        "precificacont_abrir_proposta",
        String(referenciaProposta)
      );
    }

    // O rascunho do CRM já foi consumido pela Nova Simulação.
    // Garante que o módulo Propostas não interprete um draft antigo e gere
    // uma proposta duplicada.
    localStorage.removeItem("precificacont_nova_proposta_crm");
    localStorage.removeItem("precificacont_fluxo_crm_nova_simulacao");

    setProposalGenerated(propostaSalva);
    setProposalBuilderOpen(false);

    // Fluxo final esperado:
    // CRM -> Nova Simulação -> proposta persistida -> Propostas abre a mesma
    // proposta. O módulo Propostas já possui a rotina de abertura direta pela
    // chave precificacont_abrir_proposta.
    if (typeof setPagina === "function" && referenciaProposta) {
      setPagina("propostas");
    }

    return propostaSalva;
  };

  const resetForm = () => {
    setCrmOrigem(null);
    setForm(INITIAL_FORM);
    setSimulationMode("rapida");
    setSaved(false);
    setSavedSimulation(null);
    setProposalGenerated(null);
    setAdvancedOpen(false);
    setServicosSelecionados([]);
    setBuscaServico("");
  };

  /* =======================================================
     PARTICULARIDADES PARA RESUMO
  ======================================================= */

  const particularidades = [];

  if (form.vendeOutrosEstados) {
    particularidades.push(
      `Vendas interestaduais${
        form.estadosVenda ? `: ${form.estadosVenda}` : ""
      }`
    );
  }

  if (form.compraOutrosEstados) {
    particularidades.push(
      `Compras interestaduais${
        form.estadosCompra ? `: ${form.estadosCompra}` : ""
      }`
    );
  }

  if (form.vendeExterior) {
    particularidades.push(
      `Exportação${
        form.paisesVenda ? `: ${form.paisesVenda}` : ""
      }`
    );
  }

  if (form.compraExterior) {
    particularidades.push(
      `Importação${
        form.paisesCompra ? `: ${form.paisesCompra}` : ""
      }`
    );
  }

  if (form.retencoes) particularidades.push("Retenções");

  if (form.substituicaoTributaria) {
    particularidades.push("Substituição tributária");
  }

  if (form.multiplasAtividades) {
    particularidades.push("Múltiplas atividades");
  }

  if (form.folhaComplexa) {
    particularidades.push("Folha de pagamento complexa");
  }

  if (form.admissoesDemissoes) {
    particularidades.push("Alta movimentação de pessoal");
  }

  if (form.parcelamentos) {
    particularidades.push("Parcelamentos recorrentes");
  }

  if (form.obrigacoesEspecificas) {
    particularidades.push("Obrigações específicas");
  }

  if (form.beneficiosFiscais) {
    particularidades.push("Benefícios fiscais");
  }

  if (Array.isArray(form.filiaisDetalhadas) && form.filiaisDetalhadas.length > 0) {
    particularidades.push(
      `${form.filiaisDetalhadas.length} ${
        form.filiaisDetalhadas.length === 1 ? "filial analisada" : "filiais analisadas"
      }`
    );
  }

  if (permissaoCriarCarregando) {
    return (
      <div className="precificacont-nova-simulacao min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldCheck size={28} className="mx-auto text-blue-600" />
          <div className="mt-3 text-lg font-semibold text-slate-900">
            Verificando permissões
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Aguarde enquanto validamos o acesso do seu perfil.
          </div>
        </div>
      </div>
    );
  }

  if (!podeCriarSimulacao) {
    return (
      <div className="precificacont-nova-simulacao min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck size={24} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              Nova Simulação
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Seu perfil possui permissão para visualizar este módulo, mas não
              possui permissão para criar novas simulações.
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-800">
                Permissão necessária
              </div>
              <div className="mt-1 text-sm text-slate-600">
                O administrador do escritório precisa habilitar a opção
                <strong> Criar</strong> em Configurações → Permissões →
                Nova Simulação.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="precificacont-nova-simulacao min-h-screen bg-slate-50">
      <style>{NOVA_SIMULACAO_DARK_CSS}</style>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-7">
        {/* CABEÇALHO */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
              <Sparkles size={16} />
              Motor inteligente PrecificaCont
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Nova Simulação
            </h1>

            <p className="text-slate-500 mt-1">
              Precificação inteligente de honorários contábeis
            </p>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Limpar simulação
          </button>
        </div>

        <section className="mb-6">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Como você deseja calcular?
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Use o mesmo motor PrecificaCont com o nível de profundidade ideal para a análise.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSimulationMode("rapida")}
              className={`text-left rounded-2xl border p-5 transition ${
                simulationMode === "rapida"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={19} className="text-blue-600" />
                    <span className="font-bold text-slate-900">Simulação Rápida</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Referência em poucos segundos com os principais indicadores da empresa.
                  </p>
                  <div className="text-xs font-semibold text-blue-700 mt-3">
                    Regime • atividade • faturamento • colaboradores • documentos
                  </div>
                </div>
                {simulationMode === "rapida" && (
                  <CheckCircle2 size={20} className="text-blue-600 shrink-0" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSimulationMode("detalhada")}
              className={`text-left rounded-2xl border p-5 transition ${
                simulationMode === "detalhada"
                  ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                  : "border-slate-200 bg-white hover:border-violet-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <GitBranch size={19} className="text-violet-600" />
                    <span className="font-bold text-slate-900">Simulação Detalhada</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Análise completa da operação, incluindo estrutura, complexidades e filiais.
                  </p>
                  <div className="text-xs font-semibold text-violet-700 mt-3">
                    Maior nível de precisão
                  </div>
                </div>
                {simulationMode === "detalhada" && (
                  <CheckCircle2 size={20} className="text-violet-600 shrink-0" />
                )}
              </div>
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_390px] gap-6 items-start">
          {/* COLUNA PRINCIPAL */}

          <div className="space-y-5">
            {/* IDENTIFICAÇÃO */}

            {simulationMode === "detalhada" && (
            <Section
              icon={Building2}
              title="Identificação"
              subtitle="Opcional para simular. Empresa / cliente e CNPJ/CPF serão obrigatórios somente ao gerar a proposta."
            >
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="CNPJ/CPF">
                  <input
                    className={inputClass}
                    value={form.cnpj}
                    onChange={(e) => set("cnpj", formatarCpfCnpj(e.target.value))}
                    inputMode="numeric"
                    maxLength={18}
                    placeholder="00.000.000/0000-00 ou 000.000.000-00"
                  />
                  {form.cnpj && (
                    <div className={`mt-1.5 text-xs ${documentoValido(form.cnpj) ? "text-emerald-600" : "text-amber-600"}`}>
                      {mensagemDocumento(form.cnpj)}
                    </div>
                  )}
                  {somenteDigitosCampo(form.cnpj).length === 14 && mensagemConsultaCnpj && (
                    <div className={`mt-1 text-xs ${
                      consultandoCnpj
                        ? "text-blue-600"
                        : mensagemConsultaCnpj === "Dados do CNPJ encontrados."
                        ? "text-emerald-600"
                        : "text-slate-500"
                    }`}>
                      {mensagemConsultaCnpj}
                    </div>
                  )}
                </Field>

                <Field label="Empresa / cliente">
                  <input
                    className={inputClass}
                    value={form.cliente}
                    onChange={(e) => set("cliente", e.target.value)}
                    placeholder={
                      consultandoCnpj
                        ? "Buscando empresa..."
                        : "Preenchido automaticamente pelo CNPJ"
                    }
                  />
                </Field>
              </div>
            </Section>
            )}

            {/* PERFIL TRIBUTÁRIO */}

            <Section
              icon={Calculator}
              title="Perfil tributário e financeiro"
              subtitle="Informações utilizadas para formar a referência contábil e fiscal."
            >
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Regime tributário">
                  <SelectPrecificaCont className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white" value={form.regime} onChange={(value) => set("regime", value)} options={[{ value: "", label: "Selecione" }, "MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real", "Outro / Especial"]}  placeholder="" />
                </Field>

                <Field label="Atividade principal">
                  <SelectPrecificaCont className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white" value={form.atividade} onChange={(value) => set("atividade", value)} options={[{ value: "", label: "Selecione" }, "Serviços", "Comércio", "Indústria", "Serviços + Comércio"]}  placeholder="" />
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

                {simulationMode === "detalhada" && (
                  <Field label="UF">
                    <SelectPrecificaCont className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white" value={form.uf} onChange={(value) => set("uf", value)} options={[{ value: "", label: "Selecione" }, "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]}  placeholder="" />
                  </Field>
                )}
              </div>

              {validacaoTributaria && (
                <div
                  className={`mt-4 rounded-2xl border p-4 ${
                    validacaoTributaria.nivel === "critico"
                      ? "border-red-200 bg-red-50"
                      : validacaoTributaria.nivel === "atencao"
                      ? "border-amber-200 bg-amber-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {validacaoTributaria.nivel === "ok" ? (
                      <CheckCircle2
                        size={20}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />
                    ) : (
                      <AlertTriangle
                        size={20}
                        className={`mt-0.5 shrink-0 ${
                          validacaoTributaria.nivel === "critico"
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      />
                    )}

                    <div className="min-w-0">
                      <div
                        className={`font-semibold ${
                          validacaoTributaria.nivel === "critico"
                            ? "text-red-800"
                            : validacaoTributaria.nivel === "atencao"
                            ? "text-amber-800"
                            : "text-emerald-800"
                        }`}
                      >
                        {validacaoTributaria.titulo}
                      </div>

                      <p className="mt-1 text-sm text-slate-700">
                        {validacaoTributaria.mensagem}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Projeção anual considerada:{" "}
                        {money(validacaoTributaria.faturamentoAnualProjetado)}{" "}
                        (faturamento médio mensal × 12).
                      </p>

                      {validacaoTributaria.detalhes.map((detalhe) => (
                        <p
                          key={detalhe}
                          className="mt-2 text-sm font-medium text-red-700"
                        >
                          • {detalhe}
                        </p>
                      ))}

                      {validacaoTributaria.nivel !== "ok" && (
                        <p className="mt-2 text-xs text-slate-500">
                          O PrecificaCont apenas sinaliza a possível inconsistência
                          e não altera automaticamente o regime tributário informado.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Section>

            {/* DEPARTAMENTO PESSOAL */}

            <Section
              icon={Users}
              title="Departamento Pessoal"
              subtitle="O DP é calculado separadamente conforme a quantidade de colaboradores."
            >
              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  label="Quantidade de colaboradores"
                  hint="Informe 0 caso a empresa não possua funcionários."
                >
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={inputClass}
                    value={form.colaboradores}
                    onChange={(e) =>
                      set("colaboradores", e.target.value)
                    }
                    placeholder="Ex.: 8"
                  />
                </Field>

                {simulationMode === "detalhada" && (
                  <Field
                    label="Movimentação média de funcionários por mês"
                    hint="Considere admissões, desligamentos, férias e afastamentos."
                  >
                    <SelectPrecificaCont
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                      value={form.movimentacaoFuncionarios || "nenhuma"}
                      onChange={(value) => set("movimentacaoFuncionarios", value)}
                      placeholder=""
                      options={[
                        { value: "nenhuma", label: "Nenhuma" },
                        { value: "1-2", label: "1 a 2 por mês" },
                        { value: "3-5", label: "3 a 5 por mês" },
                        { value: "6-10", label: "6 a 10 por mês" },
                        { value: "mais-10", label: "Mais de 10 por mês" },
                      ]}
                    />
                  </Field>
                )}

                {numberValue(form.colaboradores) > 100 ? (
                  <Field
                    label="Valor por colaborador — DP"
                    hint="Acima de 100 colaboradores, o escritório define o valor unitário."
                  >
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                        R$
                      </span>

                      <input
                        type="text"
                        inputMode="numeric"
                        className={`${inputClass} pl-10 ${
                          missingManualDP
                            ? "border-amber-400 bg-amber-50"
                            : ""
                        }`}
                        value={form.valorColaboradorManual}
                        onChange={(e) =>
                          set(
                            "valorColaboradorManual",
                            formatCurrencyInput(e.target.value)
                          )
                        }
                        placeholder="Ex.: 55,00"
                      />
                    </div>

                    {missingManualDP && (
                      <p className="text-xs text-amber-700 mt-2">
                        Informe o valor que deseja cobrar por
                        colaborador.
                      </p>
                    )}
                  </Field>
                ) : (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
                      Faixa de DP
                    </div>

                    <div className="font-semibold text-slate-900 mt-1">
                      {result.dp.faixa}
                    </div>

                    {result.dp.quantidade > 0 ? (
                      <>
                        <div className="text-sm text-slate-600 mt-1">
                          {money(result.dp.valorUnitario)} por
                          colaborador
                        </div>

                        <div className="text-lg font-bold text-blue-700 mt-3">
                          {money(result.dp.total)}
                          <span className="text-xs font-normal text-slate-500 ml-1">
                            /mês
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-500 mt-1">
                        Nenhum custo de DP aplicado.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {numberValue(form.colaboradores) > 100 &&
                result.dp.valorUnitario > 0 && (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          Departamento Pessoal
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                          {integer(result.dp.quantidade)} colaboradores ×{" "}
                          {money(result.dp.valorUnitario)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-700">
                          {money(result.dp.total)}
                        </div>

                        <div className="text-xs text-slate-500">
                          por mês
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              <div className="mt-4 flex gap-2 text-xs text-slate-500">
                <Info size={15} className="shrink-0 mt-0.5" />

                <p>
                  Até 100 colaboradores, o PrecificaCont utiliza
                  faixas de DP. Acima de 100, o valor unitário é
                  definido pelo próprio escritório.
                </p>
              </div>
            </Section>

            {/* VOLUME OPERACIONAL */}

            <Section
              icon={FileText}
              title="Volume operacional"
              subtitle="Informe o volume médio mensal de documentos."
            >
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Documentos fiscais de saída">
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.notasSaida}
                    onChange={(e) =>
                      set("notasSaida", e.target.value)
                    }
                    placeholder="Ex.: 20"
                  />
                </Field>

                <Field label="Documentos fiscais de entrada">
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.notasEntrada}
                    onChange={(e) =>
                      set("notasEntrada", e.target.value)
                    }
                    placeholder="Ex.: 10"
                  />
                </Field>

                <Field label="Outros documentos">
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.outrosDocumentos}
                    onChange={(e) =>
                      set("outrosDocumentos", e.target.value)
                    }
                    placeholder="Ex.: 0"
                  />
                </Field>
              </div>
            </Section>

            {/* INTERESTADUAL */}

            {simulationMode === "detalhada" && (
            <>
            <Section
              icon={MapPin}
              title="Operações interestaduais"
              subtitle="Mapeie operações que aumentam a complexidade fiscal."
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Toggle
                    checked={form.vendeOutrosEstados}
                    onChange={(v) =>
                      set("vendeOutrosEstados", v)
                    }
                    label="Vende para outros Estados?"
                  />

                  {form.vendeOutrosEstados && (
                    <div className="mt-3 space-y-3">
                      <Field label="Quais Estados?">
                        <input
                          className={inputClass}
                          value={form.estadosVenda}
                          onChange={(e) =>
                            set("estadosVenda", e.target.value)
                          }
                          placeholder="Ex.: RJ, MG, PR"
                        />
                      </Field>

                      <Field label="Quantidade de notas de venda interestadual/mês">
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          value={form.documentosVendaInterestadual}
                          onChange={(e) =>
                            set("documentosVendaInterestadual", e.target.value)
                          }
                          placeholder="Ex.: 20"
                        />
                      </Field>
                    </div>
                  )}
                </div>

                <div>
                  <Toggle
                    checked={form.compraOutrosEstados}
                    onChange={(v) =>
                      set("compraOutrosEstados", v)
                    }
                    label="Compra de outros Estados?"
                  />

                  {form.compraOutrosEstados && (
                    <div className="mt-3 space-y-3">
                      <Field label="Quais Estados?">
                        <input
                          className={inputClass}
                          value={form.estadosCompra}
                          onChange={(e) =>
                            set("estadosCompra", e.target.value)
                          }
                          placeholder="Ex.: SC, RS, GO"
                        />
                      </Field>

                      <Field label="Quantidade de notas de compra interestadual/mês">
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          value={form.documentosCompraInterestadual}
                          onChange={(e) =>
                            set("documentosCompraInterestadual", e.target.value)
                          }
                          placeholder="Ex.: 10"
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* INTERNACIONAL */}

            <Section
              icon={Globe2}
              title="Operações internacionais"
              subtitle="Importação e exportação são consideradas separadamente."
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Toggle
                    checked={form.vendeExterior}
                    onChange={(v) => set("vendeExterior", v)}
                    label="Vende para outros países?"
                  />

                  {form.vendeExterior && (
                    <div className="mt-3 space-y-3">
                      <Field label="Quais países?">
                        <input
                          className={inputClass}
                          value={form.paisesVenda}
                          onChange={(e) =>
                            set("paisesVenda", e.target.value)
                          }
                          placeholder="Ex.: Estados Unidos, Chile"
                        />
                      </Field>

                      <Field label="Operações de exportação/mês">
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          value={form.documentosExportacao}
                          onChange={(e) =>
                            set(
                              "documentosExportacao",
                              e.target.value
                            )
                          }
                        />
                      </Field>
                    </div>
                  )}
                </div>

                <div>
                  <Toggle
                    checked={form.compraExterior}
                    onChange={(v) => set("compraExterior", v)}
                    label="Compra de outros países?"
                  />

                  {form.compraExterior && (
                    <div className="mt-3 space-y-3">
                      <Field label="Quais países?">
                        <input
                          className={inputClass}
                          value={form.paisesCompra}
                          onChange={(e) =>
                            set("paisesCompra", e.target.value)
                          }
                          placeholder="Ex.: China, Alemanha"
                        />
                      </Field>

                      <Field label="Operações de importação/mês">
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          value={form.documentosImportacao}
                          onChange={(e) =>
                            set(
                              "documentosImportacao",
                              e.target.value
                            )
                          }
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* ESTRUTURA */}

            <Section
              icon={Landmark}
              title="Estrutura operacional"
              subtitle="Contas bancárias, movimentação e filiais são analisadas individualmente."
            >
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Contas bancárias">
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.contasBancarias}
                    onChange={(e) =>
                      set("contasBancarias", e.target.value)
                    }
                    placeholder="Ex.: 2"
                  />
                </Field>

                <Field label="Movimentação bancária">
                  <SelectPrecificaCont className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white" value={form.movimentacaoBancaria} onChange={(value) => set("movimentacaoBancaria", value)} placeholder="" options={[{value:"normal",label:"Normal"},{value:"alta",label:"Alta"},{value:"muito_alta",label:"Muito alta"}]} />
                </Field>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <div className="font-semibold text-slate-900">
                      Filiais
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Cada filial é calculada pelo próprio faturamento, regime e atividade.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={adicionarFilial}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    <Plus size={17} />
                    Adicionar filial
                  </button>
                </div>

                {(!Array.isArray(form.filiaisDetalhadas) ||
                  form.filiaisDetalhadas.length === 0) && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                    Nenhuma filial adicionada. A matriz será calculada sem acréscimo de filial.
                  </div>
                )}

                <div className="space-y-4">
                  {(Array.isArray(form.filiaisDetalhadas)
                    ? form.filiaisDetalhadas
                    : []
                  ).map((filial, index) => (
                    <div
                      key={filial.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <div className="font-semibold text-slate-900">
                            Filial {index + 1}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {filial.centralizada !== false
                              ? "Contabilidade centralizada • aplica 50% da referência da filial"
                              : "Contabilidade descentralizada • aplica 100% da referência da filial"}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removerFilial(filial.id)}
                          className="text-slate-400 hover:text-red-600"
                          title="Remover filial"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <Field label="Regime tributário">
                          <SelectPrecificaCont className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white" value={filial.regime} onChange={(value) => atualizarFilial(filial.id, "regime", value)} options={[{ value: "", label: "Selecione" }, "MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real", "Outro / Especial"]}  placeholder="" />
                        </Field>

                        <Field label="Atividade principal">
                          <SelectPrecificaCont className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white" value={filial.atividade} onChange={(value) => atualizarFilial(filial.id, "atividade", value)} options={[{ value: "", label: "Selecione" }, "Serviços", "Comércio", "Indústria", "Serviços + Comércio"]}  placeholder="" />
                        </Field>

                        <Field label="Faturamento médio mensal da filial">
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

                        <Field label="Modelo da contabilidade">
                          <SelectPrecificaCont className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white" value={filial.centralizada !== false ? "centralizada" : "descentralizada"} onChange={(value) => atualizarFilial(filial.id, "centralizada", value === "centralizada")} placeholder="" options={[{value:"centralizada",label:"Centralizada — 50%"},{value:"descentralizada",label:"Descentralizada — 100%"}]} />
                        </Field>
                      </div>

                      {result.branches?.detalhes?.[index] && (
                        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                          <span className="text-blue-700">
                            Referência calculada para esta filial
                          </span>
                          <span className="font-bold text-blue-900">
                            {money(result.branches.detalhes[index].valor)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {Number(result.branchTotal || 0) > 0 && (
                  <div className="mt-4 rounded-xl bg-slate-950 text-white p-4 flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-300">
                      Total das filiais
                    </span>
                    <span className="font-bold text-blue-300">
                      {money(result.branchTotal)}
                    </span>
                  </div>
                )}
              </div>
            </Section>

            {/* AVANÇADO */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setAdvancedOpen((current) => !current)
                }
                className="w-full p-5 md:p-6 flex items-center justify-between text-left"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <GitBranch
                      size={20}
                      className="text-violet-700"
                    />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Complexidades adicionais
                    </h2>

                    <p className="text-sm text-slate-500 mt-0.5">
                      Situações que exigem maior esforço técnico e
                      operacional.
                    </p>
                  </div>
                </div>

                {advancedOpen ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>

              {advancedOpen && (
                <div className="px-5 md:px-6 pb-6 grid md:grid-cols-2 gap-3">
                  <Toggle
                    checked={form.retencoes}
                    onChange={(v) => set("retencoes", v)}
                    label="Retenções recorrentes"
                  />

                  <Toggle
                    checked={form.substituicaoTributaria}
                    onChange={(v) =>
                      set("substituicaoTributaria", v)
                    }
                    label="Substituição tributária"
                  />

                  <Toggle
                    checked={form.multiplasAtividades}
                    onChange={(v) =>
                      set("multiplasAtividades", v)
                    }
                    label="Múltiplas atividades"
                  />

                  <Toggle
                    checked={form.folhaComplexa}
                    onChange={(v) =>
                      set("folhaComplexa", v)
                    }
                    label="Folha de pagamento complexa"
                    description="Turnos, adicionais, variáveis ou outras particularidades."
                  />

                  <Toggle
                    checked={form.admissoesDemissoes}
                    onChange={(v) =>
                      set("admissoesDemissoes", v)
                    }
                    label="Alta movimentação de admissões/demissões"
                  />

                  <Toggle
                    checked={form.parcelamentos}
                    onChange={(v) =>
                      set("parcelamentos", v)
                    }
                    label="Parcelamentos recorrentes"
                  />

                  <Toggle
                    checked={form.obrigacoesEspecificas}
                    onChange={(v) =>
                      set("obrigacoesEspecificas", v)
                    }
                    label="Obrigações específicas"
                  />

                  <Toggle
                    checked={form.beneficiosFiscais}
                    onChange={(v) =>
                      set("beneficiosFiscais", v)
                    }
                    label="Benefícios fiscais"
                  />
                </div>
              )}
            </section>

            </>
            )}

            {simulationMode === "detalhada" && complexidadeOperacional && (
              <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 md:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Sparkles size={20} className="text-blue-700" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                          Motor de Complexidade 2026 V1
                        </div>
                        <h2 className="font-semibold text-slate-900 mt-1">
                          Complexidade operacional: {complexidadeOperacional.classificacao}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          Diagnóstico operacional da empresa. Esta classificação não altera o honorário sugerido.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 min-w-[132px]">
                      <div className="text-xs text-slate-500">Índice interno</div>
                      <div className="text-2xl font-bold text-slate-950 mt-0.5">
                        {complexidadeOperacional.total}<span className="text-sm font-semibold text-slate-400">/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
                    {complexidadeOperacional.dimensoes.map((dimensao) => (
                      <div key={dimensao.nome} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-800">{dimensao.nome}</span>
                          <span className="text-xs font-semibold text-slate-500">
                            {dimensao.pontos}/{dimensao.maximo}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{dimensao.nivel}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-3 mt-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Principais fatores
                      </div>
                      <div className="text-sm text-slate-700 mt-2">
                        {complexidadeOperacional.motivos.length > 0
                          ? complexidadeOperacional.motivos.join(" • ")
                          : "Nenhum fator adicional relevante identificado com os dados informados."}
                      </div>
                    </div>

                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                        Reforma Tributária
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-2">
                        {complexidadeOperacional.reforma}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        A V1 não adiciona pontos de Reforma sem dados específicos. O futuro módulo de Reforma Tributária poderá alimentar esta dimensão.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SERVIÇOS ADICIONAIS */}

            <Section
              icon={BadgeDollarSign}
              title="Serviços adicionais"
              subtitle="Inclua serviços pontuais ou recorrentes sem alterar o Índice PrecificaCont."
            >
              <div className="relative mb-4">
                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${inputClass} pl-10`}
                  value={buscaServico}
                  onChange={(e) => setBuscaServico(e.target.value)}
                  placeholder="Pesquisar serviço adicional..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3 mb-5 max-h-[620px] overflow-y-auto pr-1">
                {(buscaServico.trim() ? servicosFiltrados : servicosFiltrados.slice(0, 6)).map((servico) => {
                  const incluido = servicosSelecionados.some((item) => item.id === servico.id);
                  return (
                    <button
                      key={servico.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (incluido) {
                          removerServico(servico.id);
                        } else {
                          adicionarServico(servico);
                        }
                      }}
                      aria-pressed={incluido}
                      title={incluido ? "Clique novamente para remover" : "Clique para adicionar"}
                      className={`text-left rounded-xl border p-4 transition ${
                        incluido
                          ? "border-emerald-300 bg-emerald-50 hover:border-red-300 hover:bg-red-50 cursor-pointer"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                      }`}
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm text-slate-900">{servico.nome}</div>
                          <div className="text-xs text-slate-500 mt-1">{servico.categoria}</div>
                        </div>
                        {incluido ? (
                          <div className="flex items-center gap-1.5 shrink-0 pointer-events-none">
                            <span className="text-[11px] font-semibold text-emerald-700">Incluído</span>
                            <X size={18} className="text-red-500" />
                          </div>
                        ) : (
                          <Plus size={18} className="text-blue-600 shrink-0" />
                        )}
                      </div>
                      <div className="mt-3 text-sm font-bold text-blue-700">
                        {Number(servico.preco_praticado || servico.preco_recomendado) > 0
                          ? money(servico.preco_praticado || servico.preco_recomendado)
                          : "Sob consulta"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {servico.preco_texto
                          ? servico.preco_texto
                          : `Referência PrecificaCont: ${money(servico.preco_recomendado)}`}
                        {servico.preco_minimo > 0 && servico.preco_superior > 0
                          ? ` • faixa ${money(servico.preco_minimo)} a ${money(servico.preco_superior)}`
                          : ""}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!buscaServico.trim() && servicosFiltrados.length > 6 && (
                <div className="mb-5 text-center text-xs text-slate-500">
                  Mostrando 6 de {servicosFiltrados.length} serviços. Use a busca para localizar outros serviços.
                </div>
              )}

              {servicosSelecionados.length > 0 && (
                <div className="space-y-3 border-t border-slate-200 pt-5">
                  <div className="text-sm font-semibold text-slate-900">Serviços incluídos na proposta</div>

                  {servicosSelecionados.map((servico) => {
                    const detalhe = resumoServicos.detalhados.find((item) => item.id === servico.id);
                    return (
                      <div key={servico.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <div className="font-semibold text-sm text-slate-900">{servico.nome}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {servico.recorrencia === "recorrente" ? "Cobrança recorrente" : "Cobrança pontual"}
                            </div>
                          </div>
                          <button type="button" onClick={() => removerServico(servico.id)} className="text-slate-400 hover:text-red-600">
                            <Trash2 size={17} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Field label="Quantidade">
                            <input
                              type="number"
                              min="1"
                              className={inputClass}
                              value={servico.quantidade}
                              onChange={(e) => atualizarServico(servico.id, "quantidade", e.target.value)}
                            />
                          </Field>

                          <Field label="Valor unitário">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={inputClass}
                              value={servico.valor_unitario}
                              onChange={(e) => atualizarServico(servico.id, "valor_unitario", e.target.value)}
                            />
                          </Field>

                          <Field label={`Desconto (máx. ${Number(servico.desconto_maximo || 0)}%)`}>
                            <input
                              type="number"
                              min="0"
                              max={Number(servico.desconto_maximo || 0)}
                              className={inputClass}
                              value={servico.desconto_percentual}
                              onChange={(e) => atualizarServico(servico.id, "desconto_percentual", e.target.value)}
                            />
                          </Field>

                          <div className="rounded-xl bg-white border border-slate-200 p-3">
                            <div className="text-xs text-slate-500">Valor final</div>
                            <div className="font-bold text-slate-900 mt-2">{money(detalhe?.valor_final || 0)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid md:grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                      <div className="text-xs text-blue-600">Adicionais recorrentes</div>
                      <div className="text-xl font-bold text-blue-800 mt-1">{money(resumoServicos.recorrentes)}</div>
                    </div>
                    <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                      <div className="text-xs text-violet-600">Adicionais pontuais</div>
                      <div className="text-xl font-bold text-violet-800 mt-1">{money(resumoServicos.pontuais)}</div>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            {/* HONORÁRIO ATUAL */}

            {simulationMode === "detalhada" && (

            <Section
              icon={ShieldCheck}
              title="Comparação comercial"
              subtitle="Opcional. Informe o honorário atual para visualizar a diferença."
            >
              <div className="max-w-sm">
                <Field label="Honorário atual">
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inputClass}
                    value={form.honorarioAtual}
                    onChange={(e) =>
                      set("honorarioAtual", formatCurrencyInput(e.target.value))
                    }
                    placeholder="Ex.: 900,00"
                  />
                </Field>
              </div>
            </Section>
            )}

            {simulationMode === "rapida" && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <Sparkles size={20} className="text-blue-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">
                      Referência rápida
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      O cálculo utiliza os principais indicadores informados. Para considerar
                      operações, movimentação bancária, complexidades e filiais, aprimore a análise.
                    </p>
                    <button
                      type="button"
                      onClick={aprimorarSimulacao}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                      <GitBranch size={17} />
                      Aprimorar esta simulação
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              PAINEL DIREITO
          ================================================= */}

          <aside className="xl:sticky xl:top-5 space-y-4">
            <div className="bg-slate-950 text-white rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/10">
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  Índice PrecificaCont
                </div>

                <div className="text-4xl font-bold mt-2">
                  {canCalculate
                    ? money(result.indice)
                    : "—"}
                </div>

                <div className="text-sm text-slate-400 mt-2">
                  Referência recomendada mensal
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs text-slate-400">
                      Referência competitiva
                    </div>

                    <div className="font-semibold mt-1">
                      {canCalculate
                        ? money(result.competitivo)
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs text-slate-400">
                      Referência superior
                    </div>

                    <div className="font-semibold mt-1">
                      {canCalculate
                        ? money(result.premium)
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* COMPOSIÇÃO EXPLICÁVEL DO ÍNDICE */}

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                    Como chegamos a esta referência
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">
                        Base por regime, porte e atividade
                      </span>
                      <span className="font-medium">
                        {canCalculate ? money(result.base) : "—"}
                      </span>
                    </div>

                    {canCalculate && Number(result.regionalAdjustment || 0) > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">
                          Inteligência regional {form.uf ? `(${form.uf})` : ""}
                        </span>
                        <span className="font-medium">
                          + {money(result.regionalAdjustment)}
                        </span>
                      </div>
                    )}

                    {canCalculate && Number(result.documentAdjustment || 0) > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">
                          Volume documental ({Number(result.totalDocumentos || 0).toLocaleString("pt-BR")} docs.)
                        </span>
                        <span className="font-medium">
                          + {money(result.documentAdjustment)}
                        </span>
                      </div>
                    )}

                    {canCalculate && Number(result.ajusteOperacional || 0) > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">
                          Complexidade operacional
                        </span>
                        <span className="font-medium">
                          + {money(result.ajusteOperacional)}
                        </span>
                      </div>
                    )}

                    {Number(result.branchTotal || 0) > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">
                          Filiais
                        </span>
                        <span className="font-medium">
                          + {money(result.branchTotal)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">
                        Departamento Pessoal
                      </span>
                      <span className="font-medium">
                        {canCalculate ? money(result.dp.total) : "—"}
                      </span>
                    </div>

                    <div className="border-t border-white/10 pt-2 flex justify-between gap-4">
                      <span className="font-medium">
                        Referência recomendada
                      </span>
                      <span className="font-bold text-blue-300">
                        {canCalculate ? money(result.indice) : "—"}
                      </span>
                    </div>

                    {resumoServicos.recorrentes > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Adicionais recorrentes</span>
                        <span className="font-medium text-blue-300">{money(resumoServicos.recorrentes)}</span>
                      </div>
                    )}

                    {resumoServicos.recorrentes > 0 && canCalculate && (
                      <div className="border-t border-white/10 pt-2 flex justify-between gap-4">
                        <span className="font-semibold">Mensalidade total</span>
                        <span className="font-bold text-emerald-300">
                          {money(result.indice + resumoServicos.recorrentes)}
                        </span>
                      </div>
                    )}

                    {resumoServicos.pontuais > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Serviços adicionais</span>
                        <span className="font-medium text-violet-300">{money(resumoServicos.pontuais)}</span>
                      </div>
                    )}
                  </div>

                  {canCalculate && (
                    <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-400/10 p-3">
                      <div className="flex items-start gap-2">
                        <Info size={15} className="mt-0.5 shrink-0 text-blue-300" />
                        <p className="text-xs leading-relaxed text-slate-300">
                          A referência considera porte, regime tributário, atividade, região e esforço operacional informado. Volume documental, Departamento Pessoal e filiais são avaliados separadamente para evitar distorções no honorário.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {canCalculate && regrasDesconto.permitido && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aplicarDescontoComercial}
                        onChange={(e) => {
                          const marcado = e.target.checked;
                          setAplicarDescontoComercial(marcado);
                          if (!marcado) setDescontoComercial(0);
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-white/20 accent-blue-600"
                      />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Aplicar desconto comercial
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Opcional. Limite parametrizado: {regrasDesconto.percentualMaximo}%.
                          Não altera o Índice PrecificaCont.
                        </div>
                      </div>
                    </label>

                    {aplicarDescontoComercial && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <div className="text-xs text-slate-400">Percentual de desconto</div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              Máximo permitido: {regrasDesconto.percentualMaximo}%
                            </div>
                          </div>
                          <div className="w-28">
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max={regrasDesconto.percentualMaximo}
                                step="0.5"
                                value={descontoComercial}
                                onChange={(e) =>
                                  setDescontoComercial(
                                    Math.min(
                                      regrasDesconto.percentualMaximo,
                                      Math.max(0, Number(e.target.value || 0))
                                    )
                                  )
                                }
                                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 pr-7 text-right text-sm font-semibold text-white outline-none focus:border-blue-400"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                %
                              </span>
                            </div>
                          </div>
                        </div>

                        {descontoComercialPercentual > 0 && (
                          <div className="mt-4 pt-3 border-t border-white/10 space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Mensalidade antes do desconto</span>
                              <span>{money(proposalMensalBruto)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">
                                Desconto ({descontoComercialPercentual}%)
                              </span>
                              <span className="text-amber-300">
                                - {money(descontoComercialValor)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-2">
                              <span className="font-semibold">Mensalidade comercial</span>
                              <span className="font-bold text-emerald-300">
                                {money(proposalMensalTotal)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* PERFIL ANALISADO */}

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                    Perfil analisado
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">
                        Tipo
                      </span>
                      <span className="text-right font-medium">
                        {simulationMode === "rapida" ? "Rápida" : "Detalhada"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">
                        Regime
                      </span>

                      <span className="text-right">
                        {form.regime || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">
                        Atividade
                      </span>

                      <span className="text-right">
                        {form.atividade || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">
                        Faturamento
                      </span>

                      <span className="text-right">
                        {numberValue(form.faturamento) > 0
                          ? `${money(
                              numberValue(form.faturamento)
                            )}/mês`
                          : "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">
                        Documentos
                      </span>

                      <span>
                        {integer(result.totalDocumentos)}/mês
                      </span>
                    </div>

                    {simulationMode === "detalhada" && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">
                          Filiais
                        </span>
                        <span>
                          {Array.isArray(form.filiaisDetalhadas)
                            ? form.filiaisDetalhadas.length
                            : 0}
                        </span>
                      </div>
                    )}

                    {/* NOVOS DADOS DO DP */}

                    <div className="border-t border-white/10 pt-3 mt-3">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">
                          Colaboradores
                        </span>

                        <span className="font-medium">
                          {form.colaboradores === ""
                            ? "—"
                            : integer(result.dp.quantidade)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 mt-2">
                        <span className="text-slate-400">
                          Valor por colaborador
                        </span>

                        <span className="font-medium text-blue-300">
                          {result.dp.quantidade > 0 &&
                          result.dp.valorUnitario > 0
                            ? money(result.dp.valorUnitario)
                            : "—"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 mt-2">
                        <span className="text-slate-400">
                          Departamento Pessoal
                        </span>

                        <span className="font-semibold">
                          {result.dp.quantidade > 0
                            ? money(result.dp.total)
                            : money(0)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 mt-3 flex justify-between gap-4">
                      <span className="text-slate-400">
                        Nível operacional
                      </span>

                      <span className="text-right font-medium">
                        {result.nivel}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">
                        Confiança
                      </span>

                      <span className="font-medium text-emerald-300">
                        {confidence}
                      </span>
                    </div>
                  </div>
                </div>

                {/* HONORÁRIO ATUAL */}

                {numberValue(form.honorarioAtual) > 0 &&
                  canCalculate && (
                    <div className="rounded-xl bg-white/5 p-4">
                      <div className="text-xs text-slate-400">
                        Honorário atual
                      </div>

                      <div className="font-semibold mt-1">
                        {money(
                          numberValue(form.honorarioAtual)
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mt-3">
                        Diferença para a referência
                      </div>

                      <div
                        className={`font-semibold mt-1 ${
                          result.indice -
                            numberValue(form.honorarioAtual) >
                          0
                            ? "text-amber-300"
                            : "text-emerald-300"
                        }`}
                      >
                        {money(
                          result.indice -
                            numberValue(form.honorarioAtual)
                        )}
                      </div>
                    </div>
                  )}

                {/* PARTICULARIDADES */}

                {particularidades.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                      Particularidades consideradas
                    </div>

                    <div className="space-y-2">
                      {particularidades.map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-2 text-xs text-slate-300"
                        >
                          <CheckCircle2
                            size={14}
                            className="text-blue-300 shrink-0 mt-0.5"
                          />

                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VALIDAÇÃO 100+ */}

                {missingManualDP && (
                  <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
                    <div className="text-sm font-medium text-amber-200">
                      Valor de DP necessário
                    </div>

                    <div className="text-xs text-amber-100/80 mt-1">
                      Para mais de 100 colaboradores, informe o
                      valor que o escritório deseja cobrar por
                      colaborador.
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-500 leading-relaxed">
                  A referência considera o perfil tributário,
                  estrutura, volume operacional, Departamento
                  Pessoal e particularidades informadas na
                  simulação.
                </div>

                <button
                  type="button"
                  onClick={saveSimulation}
                  disabled={!canCalculate}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition ${
                    canCalculate
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Save size={18} />

                  {saved
                    ? "Simulação salva"
                    : "Salvar simulação"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!proposalGenerated) {
                      openProposalBuilder();
                      return;
                    }

                    const referencia =
                      proposalGenerated.numero_proposta ||
                      proposalGenerated.id ||
                      "";

                    if (referencia) {
                      localStorage.setItem(
                        "precificacont_abrir_proposta",
                        String(referencia)
                      );
                    }

                    if (typeof setPagina === "function") {
                      setPagina("propostas");
                    }
                  }}
                  disabled={!canCalculate}
                  className={`w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition border ${
                    canCalculate
                      ? proposalGenerated
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                        : "border-blue-400/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20"
                      : "border-slate-700 bg-slate-900 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  {proposalGenerated ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <FileText size={18} />
                  )}
                  {proposalGenerated
                    ? "Visualizar proposta"
                    : "Gerar proposta"}
                </button>

                {proposalGenerated && (
                  <div className="flex items-center justify-center gap-2 text-xs text-blue-200 mt-2">
                    <CheckCircle2 size={14} />
                    Proposta salva e pronta para a área de Propostas
                  </div>
                )}

                {proposalBuilderOpen && (
                  <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center">
                    <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl text-slate-900">
                      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold">Gerar proposta</h2>
                          <p className="text-sm text-slate-500 mt-1">
                            Escolha exatamente o que será apresentado ao cliente.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProposalBuilderOpen(false)}
                          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="p-6 space-y-6">
                        <div className="proposal-required-box rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                          <div className="flex items-start gap-3 mb-4">
                            <Info size={18} className="proposal-required-icon text-amber-700 mt-0.5 shrink-0" />
                            <div>
                              <div className="proposal-required-title font-semibold text-amber-900">
                                Dados obrigatórios para gerar a proposta
                              </div>
                              <div className="proposal-required-text text-xs text-amber-700 mt-1">
                                A simulação pode ser feita sem identificação, mas a proposta exige Empresa / cliente e CNPJ/CPF.
                              </div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <Field label="CNPJ/CPF *">
                              <input
                                className={inputClass}
                                value={form.cnpj}
                                onChange={(e) => set("cnpj", formatarCpfCnpj(e.target.value))}
                                inputMode="numeric"
                                maxLength={18}
                                placeholder="00.000.000/0000-00 ou 000.000.000-00"
                              />
                              {form.cnpj && (
                                <div className={`mt-1.5 text-xs ${documentoValido(form.cnpj) ? "text-emerald-600" : "text-amber-600"}`}>
                                  {mensagemDocumento(form.cnpj)}
                                </div>
                              )}
                              {somenteDigitosCampo(form.cnpj).length === 14 && mensagemConsultaCnpj && (
                                <div className={`mt-1 text-xs ${
                                  consultandoCnpj
                                    ? "text-blue-600"
                                    : mensagemConsultaCnpj === "Dados do CNPJ encontrados."
                                    ? "text-emerald-600"
                                    : "text-slate-500"
                                }`}>
                                  {mensagemConsultaCnpj}
                                </div>
                              )}
                            </Field>

                            <Field label="Empresa / cliente *">
                              <input
                                className={inputClass}
                                value={form.cliente}
                                onChange={(e) => set("cliente", e.target.value)}
                                placeholder={
                                  consultandoCnpj
                                    ? "Buscando empresa..."
                                    : "Preenchido automaticamente pelo CNPJ"
                                }
                              />
                            </Field>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3">
                          {[
                            {
                              id: "servicos",
                              title: "Serviços adicionais",
                              text: "Somente os serviços selecionados.",
                            },
                            {
                              id: "personalizada",
                              title: "Personalizada",
                              text: "Escolha matriz, filiais e serviços.",
                            },
                            {
                              id: "completa",
                              title: "Completa",
                              text: "Matriz + filiais + serviços.",
                            },
                          ].map((modo) => (
                            <button
                              key={modo.id}
                              type="button"
                              onClick={() => selectProposalMode(modo.id)}
                              className={`text-left rounded-2xl border p-4 transition ${
                                proposalMode === modo.id
                                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="font-semibold">{modo.title}</div>
                              <div className="text-xs text-slate-500 mt-1">
                                {modo.text}
                              </div>
                            </button>
                          ))}
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">
                            Itens da proposta
                          </h3>

                          <div className="grid md:grid-cols-3 gap-3">
                            {[
                              {
                                id: "matriz",
                                title: "Honorários da matriz",
                                value: money(result?.indice || 0),
                              },
                              {
                                id: "filiais",
                                title: "Filiais",
                                value: `${proposalFiliais.length} filial(is) • ${money(result?.branchTotal || 0)}`,
                              },
                              {
                                id: "servicos",
                                title: "Serviços adicionais",
                                value: `${resumoServicos.detalhados.length} serviço(s)`,
                              },
                            ].map((item) => (
                              <label
                                key={item.id}
                                className={`rounded-2xl border p-4 cursor-pointer transition ${
                                  proposalInclude[item.id]
                                    ? "border-blue-200 bg-blue-50/50"
                                    : "border-slate-200 bg-slate-50 opacity-70"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(proposalInclude[item.id])}
                                    onChange={(e) =>
                                      setProposalInclude((current) => ({
                                        ...current,
                                        [item.id]: e.target.checked,
                                      }))
                                    }
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {item.title}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {item.value}
                                    </div>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {proposalInclude.servicos &&
                          resumoServicos.detalhados.length > 0 && (
                            <div className="rounded-2xl border border-slate-200 overflow-hidden">
                              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-sm">
                                Serviços selecionados
                              </div>
                              <div className="divide-y divide-slate-100">
                                {resumoServicos.detalhados.map((servico, index) => (
                                  <div
                                    key={`${servico.id || servico.nome}-${index}`}
                                    className="px-4 py-3 flex justify-between gap-4 text-sm"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {servico.nome}
                                      </div>
                                      <div className="text-xs text-slate-400">
                                        {servico.recorrencia === "mensal"
                                          ? "Mensal"
                                          : "Pontual"}{" "}
                                        • {servico.quantidade || 1} un.
                                      </div>
                                    </div>
                                    <div className="font-semibold">
                                      {money(servico.total || 0)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {regrasDesconto.permitido && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={aplicarDescontoComercial}
                                onChange={(e) => {
                                  const marcado = e.target.checked;
                                  setAplicarDescontoComercial(marcado);
                                  if (!marcado) setDescontoComercial(0);
                                }}
                                className="mt-1 h-4 w-4 rounded accent-blue-600"
                              />
                              <div>
                                <div className="font-semibold text-slate-900">
                                  Aplicar desconto comercial
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  Limite configurado nas regras comerciais: {regrasDesconto.percentualMaximo}%.
                                  O Índice PrecificaCont permanece preservado.
                                </div>
                              </div>
                            </label>

                            {aplicarDescontoComercial && (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                  <div className="text-sm text-slate-600">
                                    Informe o percentual que será concedido nesta proposta.
                                  </div>
                                  <div className="w-full sm:w-40">
                                    <label className="text-xs font-medium text-slate-600">
                                      Desconto
                                    </label>
                                    <div className="relative mt-1">
                                      <input
                                        type="number"
                                        min="0"
                                        max={regrasDesconto.percentualMaximo}
                                        step="0.5"
                                        value={descontoComercial}
                                        onChange={(e) =>
                                          setDescontoComercial(
                                            Math.min(
                                              regrasDesconto.percentualMaximo,
                                              Math.max(0, Number(e.target.value || 0))
                                            )
                                          )
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-8 text-right font-semibold outline-none focus:border-blue-500"
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                                        %
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {descontoComercialPercentual > 0 && (
                                  <div className="grid sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200 text-sm">
                                    <div>
                                      <div className="text-xs text-slate-500">Mensal bruto</div>
                                      <div className="font-semibold mt-1">{money(proposalMensalBruto)}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-500">Desconto</div>
                                      <div className="font-semibold text-amber-600 mt-1">
                                        - {money(descontoComercialValor)}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-500">Mensal final</div>
                                      <div className="font-bold text-emerald-600 mt-1">
                                        {money(proposalMensalTotal)}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="rounded-2xl bg-slate-950 text-white p-5">
                          <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-slate-400">
                                Mensal
                              </div>
                              <div className="text-xl font-bold mt-1">
                                {money(proposalMensalTotal)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">
                                Pontual
                              </div>
                              <div className="text-xl font-bold mt-1">
                                {money(proposalServicosPontuais)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">
                                Primeiro mês
                              </div>
                              <div className="text-xl font-bold mt-1">
                                {money(proposalPrimeiroMes)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setProposalBuilderOpen(false)}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const gerada = await generateProposal();
                              if (gerada) {
                                setProposalBuilderOpen(false);
                              }
                            }}
                            className="rounded-xl bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-blue-500"
                          >
                            Gerar proposta
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {saved && (
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 size={14} />
                    Simulação adicionada ao Dashboard
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}