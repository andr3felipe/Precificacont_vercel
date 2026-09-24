import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Search, Plus, Pencil, Trash2, X, Save, SlidersHorizontal,
  BadgeDollarSign, CheckCircle2, CircleOff, RotateCcw,
  Upload, Download, FileSpreadsheet, ShieldCheck
} from "lucide-react";
import { supabase } from "../supabase";
import SelectPrecificaCont from "../components/SelectPrecificaCont";

const SERVICOS_PADRAO = [
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

const STORAGE_KEY = "precificacont_servicos";

const moeda = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const slug = (s) =>
  String(s || "servico")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const carregar = () => {
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(salvo) || salvo.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SERVICOS_PADRAO));
      return SERVICOS_PADRAO;
    }
    const ids = new Set(salvo.map((s) => s.id));
    const faltantes = SERVICOS_PADRAO.filter((s) => !ids.has(s.id));
    const final = [...salvo, ...faltantes];
    if (faltantes.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
    return final;
  } catch {
    return SERVICOS_PADRAO;
  }
};

const VAZIO = {
  id: "",
  nome: "",
  categoria: "Serviços Adicionais",
  tipo_cobranca: "unidade",
  recorrencia: "pontual",
  preco_minimo: 0,
  preco_recomendado: 0,
  preco_superior: 0,
  preco_praticado: 0,
  preco_texto: "",
  descricao: "",
  ativo: true,
  desconto_maximo: 0,
};


const normalizarTexto = (valor) =>
  String(valor ?? "").trim();

const normalizarChave = (valor) =>
  normalizarTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const numeroPlanilha = (valor) => {
  if (valor === "" || valor === null || valor === undefined) return 0;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  let texto = String(valor).trim().replace(/R\$/gi, "").replace(/%/g, "").replace(/\s/g, "");
  if (!texto) return 0;

  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (texto.includes(",")) {
    texto = texto.replace(",", ".");
  }

  const n = Number(texto);
  return Number.isFinite(n) ? n : 0;
};

const booleanoPlanilha = (valor) => {
  const v = normalizarChave(valor);
  if (["inativo", "nao", "não", "false", "0"].includes(v)) return false;
  return true;
};

const valorColuna = (linha, nomes) => {
  const mapa = Object.entries(linha || {}).reduce((acc, [chave, valor]) => {
    acc[normalizarChave(chave)] = valor;
    return acc;
  }, {});
  for (const nome of nomes) {
    const chave = normalizarChave(nome);
    if (Object.prototype.hasOwnProperty.call(mapa, chave)) return mapa[chave];
  }
  return "";
};

const servicoParaLinhaExcel = (s) => ({
  "Nome do Serviço": s.nome || "",
  "Categoria": s.categoria || "",
  "Forma de Cobrança": s.tipo_cobranca || "unidade",
  "Recorrência": s.recorrencia === "recorrente" ? "Recorrente" : "Pontual",
  "Valor Mínimo": Number(s.preco_minimo || 0),
  "Valor PrecificaCont": Number(s.preco_recomendado || 0),
  "Valor Superior": Number(s.preco_superior || 0),
  "Preço Praticado": Number(s.preco_praticado || 0),
  "Desconto Máximo %": Number(s.desconto_maximo || 0),
  "Status": s.ativo === false ? "Inativo" : "Ativo",
  "Descrição": s.descricao || "",
});


const protegerReferenciasPrecificaCont = (lista) => {
  const referencias = new Map(
    SERVICOS_PADRAO.map((servico) => [servico.id, servico])
  );

  return lista.map((servico) => {
    const referencia = referencias.get(servico.id);

    if (!referencia) return servico;

    return {
      ...servico,
      preco_minimo: referencia.preco_minimo,
      preco_recomendado: referencia.preco_recomendado,
      preco_superior: referencia.preco_superior,
    };
  });
};

const SERVICOS_TABLE = "servicos_adicionais";

function servicoParaBanco(item) {
  return {
    id: String(item.id), nome: item.nome || "", categoria: item.categoria || "",
    tipo_cobranca: item.tipo_cobranca || "unidade", recorrencia: item.recorrencia || "pontual",
    preco_minimo: Number(item.preco_minimo || 0), preco_recomendado: Number(item.preco_recomendado || 0),
    preco_superior: Number(item.preco_superior || 0), preco_praticado: Number(item.preco_praticado || 0),
    preco_texto: item.preco_texto || "", descricao: item.descricao || "", ativo: item.ativo !== false,
    desconto_maximo: Number(item.desconto_maximo || 0), dados: item, updated_at: new Date().toISOString(),
  };
}
function servicoDoBanco(row) {
  const dados = row.dados && typeof row.dados === "object" && !Array.isArray(row.dados) ? row.dados : {};
  return {
    ...dados, id: row.id, nome: row.nome ?? dados.nome ?? "", categoria: row.categoria ?? dados.categoria ?? "",
    tipo_cobranca: row.tipo_cobranca ?? dados.tipo_cobranca ?? "unidade",
    recorrencia: row.recorrencia ?? dados.recorrencia ?? "pontual",
    preco_minimo: Number(row.preco_minimo ?? dados.preco_minimo ?? 0),
    preco_recomendado: Number(row.preco_recomendado ?? dados.preco_recomendado ?? 0),
    preco_superior: Number(row.preco_superior ?? dados.preco_superior ?? 0),
    preco_praticado: Number(row.preco_praticado ?? dados.preco_praticado ?? 0),
    preco_texto: row.preco_texto ?? dados.preco_texto ?? "", descricao: row.descricao ?? dados.descricao ?? "",
    ativo: row.ativo ?? dados.ativo ?? true, desconto_maximo: Number(row.desconto_maximo ?? dados.desconto_maximo ?? 0),
  };
}

export default function Configuracoes() {
  const inputArquivoRef = useRef(null);
  const [servicos, setServicos] = useState(carregar);
  const servicosRef = useRef(servicos);
  const syncQueueRef = useRef(Promise.resolve());

  useEffect(() => { servicosRef.current = servicos; }, [servicos]);

  useEffect(() => {
    let ativo = true;
    const sincronizar = async () => {
      const cache = carregar();
      try {
        const { data, error } = await supabase.from(SERVICOS_TABLE).select("*").order("nome", { ascending: true });
        if (error) throw error;
        if (!ativo) return;
        const banco = Array.isArray(data) ? data.map(servicoDoBanco) : [];
        if (!banco.length && cache.length) {
          const { error: migrationError } = await supabase.from(SERVICOS_TABLE).upsert(cache.map(servicoParaBanco), { onConflict: "id" });
          if (migrationError) throw migrationError;
          servicosRef.current = cache; setServicos(cache); localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
          return;
        }
        servicosRef.current = banco; setServicos(banco); localStorage.setItem(STORAGE_KEY, JSON.stringify(banco));
      } catch (error) { console.error("Serviços adicionais: falha ao sincronizar com Supabase.", error); }
    };
    sincronizar();
    return () => { ativo = false; };
  }, []);

  const enfileirarSyncServicos = (operacao) => {
    syncQueueRef.current = syncQueueRef.current.then(operacao).catch((error) => {
      console.error("Serviços adicionais: erro ao salvar no Supabase.", error);
    });
    return syncQueueRef.current;
  };
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [status, setStatus] = useState("todos");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VAZIO);

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
          .select("perfil, perfil_acesso_id")
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
          .eq("codigo", "servicos_adicionais")
          .eq("ativo", true)
          .maybeSingle();

        if (moduloError) throw moduloError;
        if (!modulo?.id) throw new Error('Módulo "servicos_adicionais" não encontrado.');

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
        console.error("Serviços Adicionais: erro ao carregar permissões.", error);
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

  const categorias = useMemo(
    () => ["Todas", ...Array.from(new Set(servicos.map((s) => s.categoria).filter(Boolean))).sort()],
    [servicos]
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return servicos.filter((s) => {
      const matchBusca = !q || s.nome.toLowerCase().includes(q) || (s.categoria || "").toLowerCase().includes(q);
      const matchCat = categoria === "Todas" || s.categoria === categoria;
      const matchStatus = status === "todos" || (status === "ativos" ? s.ativo !== false : s.ativo === false);
      return matchBusca && matchCat && matchStatus;
    });
  }, [servicos, busca, categoria, status]);

  const salvarLista = (lista) => {
    lista = protegerReferenciasPrecificaCont(lista);
    const anterior = servicosRef.current;
    servicosRef.current = lista;
    setServicos(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));

    const anteriorMap = new Map(anterior.map((item) => [String(item.id), item]));
    const proximoMap = new Map(lista.map((item) => [String(item.id), item]));
    const removidos = anterior.filter((item) => !proximoMap.has(String(item.id))).map((item) => String(item.id));
    const alterados = lista.filter((item) => {
      const antigo = anteriorMap.get(String(item.id));
      return !antigo || JSON.stringify(antigo) !== JSON.stringify(item);
    });

    enfileirarSyncServicos(async () => {
      if (removidos.length) {
        const { error } = await supabase.from(SERVICOS_TABLE).delete().in("id", removidos);
        if (error) throw error;
      }
      if (alterados.length) {
        const { error } = await supabase.from(SERVICOS_TABLE).upsert(alterados.map(servicoParaBanco), { onConflict: "id" });
        if (error) throw error;
      }
    });
  };

  const abrirNovo = () => {
    if (!permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para criar serviços.");
      return;
    }
    setEditando(null);
    setForm(VAZIO);
    setModal(true);
  };

  const abrirEditar = (s) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para editar serviços.");
      return;
    }
    setEditando(s.id);
    setForm({ ...VAZIO, ...s });
    setModal(true);
  };

  const salvarServico = () => {
    if (editando && !permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para editar serviços.");
      return;
    }
    if (!editando && !permissoesModulo.pode_criar) {
      negarAcao("Seu perfil não possui permissão para criar serviços.");
      return;
    }
    if (!form.nome.trim()) return alert("Informe o nome do serviço.");
    if (!form.categoria.trim()) return alert("Informe a categoria.");
    const item = {
      ...form,
      id: editando || `${slug(form.categoria)}-${slug(form.nome)}-${Date.now()}`,
      nome: form.nome.trim(),
      categoria: form.categoria.trim(),
      preco_minimo: Number(form.preco_minimo || 0),
      preco_recomendado: Number(form.preco_recomendado || 0),
      preco_superior: Number(form.preco_superior || 0),
      preco_praticado: Number(form.preco_praticado || 0),
      desconto_maximo: Math.max(0, Math.min(100, Number(form.desconto_maximo || 0))),
    };
    const lista = editando
      ? servicos.map((s) => s.id === editando ? item : s)
      : [item, ...servicos];
    salvarLista(lista);
    setModal(false);
  };

  const alternarAtivo = (id) => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para alterar o status dos serviços.");
      return;
    }
    salvarLista(servicos.map((s) => s.id === id ? { ...s, ativo: s.ativo === false } : s));
  };

  const excluir = (s) => {
    if (!permissoesModulo.pode_excluir) {
      negarAcao("Seu perfil não possui permissão para excluir serviços.");
      return;
    }
    if (!confirm(`Excluir o serviço "${s.nome}"?`)) return;
    salvarLista(servicos.filter((x) => x.id !== s.id));
  };

  const exportarExcel = () => {
    const dados = servicos.map(servicoParaLinhaExcel);
    const ws = XLSX.utils.json_to_sheet(dados);
    ws["!cols"] = [
      { wch: 46 }, { wch: 24 }, { wch: 20 }, { wch: 16 },
      { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 18 },
      { wch: 20 }, { wch: 12 }, { wch: 50 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Serviços");
    XLSX.writeFile(wb, "catalogo-servicos-precificacont.xlsx");
  };

  const baixarModelo = () => {
    const modelo = [{
      "Nome do Serviço": "Exemplo de serviço",
      "Categoria": "Serviços Adicionais",
      "Forma de Cobrança": "unidade",
      "Recorrência": "Pontual",
      "Valor Mínimo": 150,
      "Valor PrecificaCont": 195,
      "Valor Superior": 280,
      "Preço Praticado": 195,
      "Desconto Máximo %": 10,
      "Status": "Ativo",
      "Descrição": "Exemplo para preenchimento. Pode apagar esta linha.",
    }];

    const ws = XLSX.utils.json_to_sheet(modelo);
    ws["!cols"] = [
      { wch: 46 }, { wch: 24 }, { wch: 20 }, { wch: 16 },
      { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 18 },
      { wch: 20 }, { wch: 12 }, { wch: 50 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo-importacao-servicos-precificacont.xlsx");
  };

  const importarPlanilha = async (event) => {
    if (!permissoesModulo.pode_criar || !permissoesModulo.pode_editar) {
      event.target.value = "";
      negarAcao("Para importar planilhas, o perfil precisa das permissões Criar e Editar.");
      return;
    }
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;

    try {
      const buffer = await arquivo.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const primeiraAba = wb.SheetNames[0];
      const linhas = XLSX.utils.sheet_to_json(wb.Sheets[primeiraAba], { defval: "" });

      if (!linhas.length) {
        alert("A planilha não possui registros para importar.");
        return;
      }

      const existentes = [...servicos];
      let criados = 0;
      let atualizados = 0;
      let ignorados = 0;

      linhas.forEach((linha, indice) => {
        const nome = normalizarTexto(valorColuna(linha, ["Nome do Serviço", "Nome", "Serviço", "Servico"]));
        const categoriaLinha = normalizarTexto(valorColuna(linha, ["Categoria"])) || "Serviços Adicionais";

        if (!nome) {
          ignorados += 1;
          return;
        }

        const tipo = normalizarChave(valorColuna(linha, ["Forma de Cobrança", "Tipo de Cobrança", "Tipo Cobranca"])) || "unidade";
        const recorrenciaTexto = normalizarChave(valorColuna(linha, ["Recorrência", "Recorrencia"]));
        const recorrencia = recorrenciaTexto.includes("recorr") || recorrenciaTexto.includes("mensal")
          ? "recorrente"
          : "pontual";

        const minimo = numeroPlanilha(valorColuna(linha, ["Valor Mínimo", "Valor Minimo", "Preço Mínimo", "Preco Minimo"]));
        const recomendado = numeroPlanilha(valorColuna(linha, ["Valor PrecificaCont", "PrecificaCont", "Valor Recomendado", "Preço Recomendado"]));
        const superior = numeroPlanilha(valorColuna(linha, ["Valor Superior", "Preço Superior", "Preco Superior"]));
        const praticadoEntrada = valorColuna(linha, ["Preço Praticado", "Preco Praticado", "Valor Praticado"]);
        const praticado = praticadoEntrada === "" ? recomendado : numeroPlanilha(praticadoEntrada);
        const desconto = Math.max(0, Math.min(100, numeroPlanilha(valorColuna(linha, ["Desconto Máximo %", "Desconto Maximo %", "Desconto Máximo", "Desconto Maximo"]))));
        const ativo = booleanoPlanilha(valorColuna(linha, ["Status", "Ativo"]));
        const descricao = normalizarTexto(valorColuna(linha, ["Descrição", "Descricao", "Observação", "Observacao"]));

        const indiceExistente = existentes.findIndex((s) =>
          normalizarChave(s.nome) === normalizarChave(nome) &&
          normalizarChave(s.categoria) === normalizarChave(categoriaLinha)
        );

        const base = indiceExistente >= 0 ? existentes[indiceExistente] : {};
        const item = {
          ...VAZIO,
          ...base,
          id: base.id || `${slug(categoriaLinha)}-${slug(nome)}-${Date.now()}-${indice}`,
          nome,
          categoria: categoriaLinha,
          tipo_cobranca: tipo,
          recorrencia,
          preco_minimo: minimo,
          preco_recomendado: recomendado,
          preco_superior: superior,
          preco_praticado: praticado,
          descricao,
          ativo,
          desconto_maximo: desconto,
        };

        if (indiceExistente >= 0) {
          existentes[indiceExistente] = item;
          atualizados += 1;
        } else {
          existentes.push(item);
          criados += 1;
        }
      });

      salvarLista(existentes);
      alert(
        `Importação concluída.\n\nNovos serviços: ${criados}\nAtualizados: ${atualizados}\nIgnorados: ${ignorados}`
      );
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível importar a planilha. Use o modelo do PrecificaCont e tente novamente.");
    }
  };

  const restaurar = () => {
    if (!permissoesModulo.pode_editar) {
      negarAcao("Seu perfil não possui permissão para restaurar o catálogo.");
      return;
    }
    if (!confirm("Restaurar os serviços e preços originais do PrecificaCont? Alterações feitas no catálogo serão perdidas.")) return;
    salvarLista(SERVICOS_PADRAO);
  };

  const ativos = servicos.filter((s) => s.ativo !== false).length;
  const inativos = servicos.length - ativos;

  const SERVICOS_DARK_CSS = `
    html.dark .servicos-adicionais-page {
      background:
        radial-gradient(circle at 88% 2%, rgba(37,99,235,.12), transparent 24rem),
        radial-gradient(circle at 15% 95%, rgba(14,165,233,.07), transparent 28rem),
        #07101f !important;
      color: #e5edf8;
    }

    html.dark .servicos-adicionais-page .bg-white {
      background-color: #0c1a2f !important;
    }
    html.dark .servicos-adicionais-page .bg-slate-50,
    html.dark .servicos-adicionais-page .bg-slate-50\/70 {
      background-color: #10213a !important;
    }
    html.dark .servicos-adicionais-page .bg-slate-100 {
      background-color: #13233a !important;
    }

    html.dark .servicos-adicionais-page .border-slate-100,
    html.dark .servicos-adicionais-page .border-slate-200,
    html.dark .servicos-adicionais-page .border-slate-300 {
      border-color: rgba(96,165,250,.18) !important;
    }

    html.dark .servicos-adicionais-page .text-slate-900 {
      color: #f8fafc !important;
    }
    html.dark .servicos-adicionais-page .text-slate-700,
    html.dark .servicos-adicionais-page .text-slate-600 {
      color: #cbd5e1 !important;
    }
    html.dark .servicos-adicionais-page .text-slate-500 {
      color: #9fb0c7 !important;
    }
    html.dark .servicos-adicionais-page .text-slate-400 {
      color: #71839c !important;
    }

    html.dark .servicos-adicionais-page .text-blue-700 {
      color: #60a5fa !important;
    }
    html.dark .servicos-adicionais-page .text-emerald-700 {
      color: #34d399 !important;
    }

    html.dark .servicos-adicionais-page input,
    html.dark .servicos-adicionais-page select,
    html.dark .servicos-adicionais-page textarea {
      background-color: #09172a;
      border-color: rgba(96,165,250,.22);
      color: #f8fafc;
      color-scheme: dark;
    }
    html.dark .servicos-adicionais-page input::placeholder,
    html.dark .servicos-adicionais-page textarea::placeholder {
      color: #64748b;
    }
    html.dark .servicos-adicionais-page select option {
      background: #09172a;
      color: #f8fafc;
    }

    html.dark .servicos-adicionais-page input:focus,
    html.dark .servicos-adicionais-page select:focus,
    html.dark .servicos-adicionais-page textarea:focus {
      border-color: #60a5fa !important;
      box-shadow: 0 0 0 3px rgba(59,130,246,.16) !important;
      outline: none;
    }

    html.dark .servicos-adicionais-page input[readonly] {
      background-color: #10213a !important;
      border-color: rgba(148,163,184,.16) !important;
      color: #8294ad !important;
    }

    html.dark .servicos-adicionais-page table thead {
      background: #10213a !important;
      color: #9fb0c7 !important;
    }
    html.dark .servicos-adicionais-page table tbody {
      background: #0c1a2f;
    }
    html.dark .servicos-adicionais-page table tbody tr {
      border-color: rgba(96,165,250,.10) !important;
    }
    html.dark .servicos-adicionais-page table tbody tr:hover {
      background: #102440 !important;
    }

    html.dark .servicos-adicionais-page .bg-emerald-50 {
      background-color: rgba(16,185,129,.15) !important;
    }
    html.dark .servicos-adicionais-page .bg-blue-50 {
      background-color: rgba(37,99,235,.15) !important;
    }
    html.dark .servicos-adicionais-page .bg-red-50 {
      background-color: rgba(244,63,94,.14) !important;
    }

    html.dark .servicos-adicionais-page .hover\:bg-slate-50:hover,
    html.dark .servicos-adicionais-page .hover\:bg-slate-100:hover {
      background-color: #18304f !important;
    }
    html.dark .servicos-adicionais-page .hover\:bg-blue-50:hover {
      background-color: rgba(37,99,235,.18) !important;
    }
    html.dark .servicos-adicionais-page .hover\:bg-red-50:hover {
      background-color: rgba(244,63,94,.16) !important;
    }

    html.dark .servicos-adicionais-page .fixed.inset-0.bg-slate-950\/45 {
      background-color: rgba(2,6,23,.78) !important;
    }

    html.dark .servicos-adicionais-page .shadow-2xl {
      box-shadow: 0 28px 70px rgba(0,0,0,.48) !important;
    }

    html.dark .servicos-adicionais-page input[type="checkbox"] {
      accent-color: #2563eb;
    }
  `;

  if (!permissoesModulo.carregando && !permissoesModulo.pode_visualizar) {
    return (
      <div className="min-h-full bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Serviços Adicionais</h2>
          <p className="mt-2 text-sm text-slate-600">Seu perfil não possui permissão para visualizar este módulo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="servicos-adicionais-page min-h-screen bg-slate-50">
      <style>{SERVICOS_DARK_CSS}</style>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold mb-1">
              <SlidersHorizontal size={16} /> Configurações
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Catálogo de Serviços</h1>
            <p className="text-slate-500 mt-1">Gerencie os serviços, preços e limites comerciais usados nas simulações.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputArquivoRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={importarPlanilha}
              className="hidden"
            />

            <button
              onClick={baixarModelo}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FileSpreadsheet size={16} /> Baixar modelo
            </button>

            {permissoesModulo.pode_criar && permissoesModulo.pode_editar ? (
              <button
                onClick={() => inputArquivoRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Upload size={16} /> Importar planilha
              </button>
            ) : null}

            <button
              onClick={exportarExcel}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download size={16} /> Exportar Excel
            </button>

            {permissoesModulo.pode_editar ? (
              <button onClick={restaurar} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <RotateCcw size={16} /> Restaurar padrão
              </button>
            ) : null}

            {permissoesModulo.pode_criar ? (
              <button onClick={abrirNovo} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
                <Plus size={17} /> Novo serviço
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4"><div className="text-xs text-slate-500">Total de serviços</div><div className="text-2xl font-bold text-slate-900 mt-1">{servicos.length}</div></div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4"><div className="text-xs text-slate-500">Ativos</div><div className="text-2xl font-bold text-emerald-700 mt-1">{ativos}</div></div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4"><div className="text-xs text-slate-500">Inativos</div><div className="text-2xl font-bold text-slate-500 mt-1">{inativos}</div></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
          <div className="grid md:grid-cols-[1fr_240px_180px] gap-3">
            <div className="relative">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Pesquisar serviço..." className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
            <SelectPrecificaCont
              value={categoria}
              onChange={setCategoria}
              options={categorias.map((c) => ({
                value: c,
                label: c === "Todas" ? "Categoria" : c,
              }))}
              placeholder=""
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white dark:bg-[#0c1a2f] dark:border-slate-700 dark:text-white"
            />
            <SelectPrecificaCont
              value={status}
              onChange={setStatus}
              options={[
                { value: "todos", label: "Status" },
                { value: "ativos", label: "Ativos" },
                { value: "inativos", label: "Inativos" },
              ]}
              placeholder=""
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white dark:bg-[#0c1a2f] dark:border-slate-700 dark:text-white"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr><th className="text-left px-4 py-3">Serviço</th><th className="text-left px-4 py-3">Categoria</th><th className="text-left px-4 py-3">Cobrança</th><th className="text-right px-4 py-3">Mínimo</th><th className="text-right px-4 py-3">PrecificaCont</th><th className="text-right px-4 py-3">Superior</th><th className="text-right px-4 py-3">Praticado</th><th className="text-center px-4 py-3">Desc. máx.</th><th className="text-center px-4 py-3">Status</th><th className="text-right px-4 py-3">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map(s=>(
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3"><div className="font-semibold text-slate-900">{s.nome}</div>{s.preco_texto && <div className="text-xs text-slate-400 mt-1">{s.preco_texto}</div>}</td>
                    <td className="px-4 py-3 text-slate-600">{s.categoria}</td>
                    <td className="px-4 py-3 text-slate-600"><div>{s.tipo_cobranca || "unidade"}</div><div className="text-xs text-slate-400">{s.recorrencia === "recorrente" ? "Recorrente" : "Pontual"}</div></td>
                    <td className="px-4 py-3 text-right text-slate-600">{moeda(s.preco_minimo)}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{moeda(s.preco_recomendado)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{moeda(s.preco_superior)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{moeda(s.preco_praticado)}</td>
                    <td className="px-4 py-3 text-center">{Number(s.desconto_maximo || 0)}%</td>
                    <td className="px-4 py-3 text-center">
                      {permissoesModulo.pode_editar ? (
                        <button onClick={()=>alternarAtivo(s.id)} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.ativo!==false ? "bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{s.ativo!==false?<CheckCircle2 size={13}/>:<CircleOff size={13}/>}{s.ativo!==false?"Ativo":"Inativo"}</button>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.ativo!==false ? "bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{s.ativo!==false?<CheckCircle2 size={13}/>:<CircleOff size={13}/>}{s.ativo!==false?"Ativo":"Inativo"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1">
                      {permissoesModulo.pode_editar ? <button onClick={()=>abrirEditar(s)} className="p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Pencil size={16}/></button> : null}
                      {permissoesModulo.pode_excluir ? <button onClick={()=>excluir(s)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button> : null}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtrados.length===0 && <div className="py-14 text-center text-slate-500">Nenhum serviço encontrado.</div>}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-slate-950/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
              <div><h2 className="text-lg font-bold text-slate-900">{editando ? "Editar serviço" : "Novo serviço"}</h2><p className="text-xs text-slate-500 mt-1">Valores poderão ser utilizados na Nova Simulação.</p></div>
              <button onClick={()=>setModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="md:col-span-2"><span className="text-sm font-medium text-slate-700">Nome do serviço *</span><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm" /></label>
                <label><span className="text-sm font-medium text-slate-700">Categoria *</span><input list="categorias-servicos" value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm" /><datalist id="categorias-servicos">{categorias.filter(c=>c!=="Todas").map(c=><option key={c} value={c} />)}</datalist></label>
                <label><span className="text-sm font-medium text-slate-700">Forma de cobrança</span><SelectPrecificaCont value={form.tipo_cobranca} onChange={(valor)=>setForm({...form,tipo_cobranca:valor})} options={[{value:"unidade",label:"Por unidade"},{value:"hora",label:"Por hora"},{value:"vinculo",label:"Por vínculo"},{value:"beneficiario",label:"Por beneficiário"},{value:"percentual",label:"Percentual"},{value:"negociacao",label:"Sob negociação"}]} placeholder="" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white dark:bg-[#0c1a2f] dark:border-slate-700 dark:text-white" /></label>
                <label><span className="text-sm font-medium text-slate-700">Recorrência</span><SelectPrecificaCont value={form.recorrencia} onChange={(valor)=>setForm({...form,recorrencia:valor})} options={[{value:"pontual",label:"Pontual"},{value:"recorrente",label:"Recorrente / mensal"}]} placeholder="" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white dark:bg-[#0c1a2f] dark:border-slate-700 dark:text-white" /></label>
                <label><span className="text-sm font-medium text-slate-700">Desconto máximo permitido (%)</span><input type="number" min="0" max="100" value={form.desconto_maximo} onChange={e=>setForm({...form,desconto_maximo:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm" /></label>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2"><BadgeDollarSign size={17} className="text-blue-700"/><h3 className="font-semibold text-slate-900">Estrutura de preço</h3></div>
                  <span className="text-[11px] font-medium text-slate-500">Referências PrecificaCont bloqueadas</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[["preco_minimo","Valor mínimo"],["preco_recomendado","PrecificaCont"],["preco_superior","Valor superior"],["preco_praticado","Preço praticado"]].map(([campo,label])=>{
                    const referenciaFixa = campo !== "preco_praticado";
                    return (
                      <label key={campo}>
                        <span className="text-xs font-medium text-slate-600">
                          {label}{referenciaFixa ? " 🔒" : ""}
                        </span>
                        <div className="relative mt-2">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form[campo]}
                            readOnly={referenciaFixa}
                            onChange={e=>{
                              if (!referenciaFixa) setForm({...form,[campo]:e.target.value});
                            }}
                            title={referenciaFixa ? "Referência fixa definida pelo PrecificaCont" : "Preço praticado pelo escritório"}
                            className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm ${
                              referenciaFixa
                                ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                                : "border-blue-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            }`}
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="block"><span className="text-sm font-medium text-slate-700">Descrição / observação</span><textarea rows="3" value={form.descricao||""} onChange={e=>setForm({...form,descricao:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm resize-none"/></label>

              <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div><div className="font-medium text-sm text-slate-900">Serviço ativo</div><div className="text-xs text-slate-500 mt-1">Serviços inativos não aparecem nas novas simulações.</div></div>
                <input type="checkbox" checked={form.ativo!==false} onChange={e=>setForm({...form,ativo:e.target.checked})} className="w-5 h-5 accent-blue-600"/>
              </label>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-4 flex justify-end gap-2">
              <button onClick={()=>setModal(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button>
              <button onClick={salvarServico} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"><Save size={16}/> Salvar serviço</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
