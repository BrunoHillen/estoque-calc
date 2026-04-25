/**
 * calc.js — Motor de cálculo de estoques
 * Suporta demanda mista (dia, semana, quinzena, mês)
 * normalizada para base mensal.
 */

// Fator Z para nível de serviço (distribuição normal)

export function zScore(ns) {
  const p = ns / 100;
  // Aproximação de Beasley-Springer-Moro — erro < 0.00003
  const a = [2.515517, 0.802853, 0.010328];
  const b = [1.432788, 0.189269, 0.001308];
  const t = Math.sqrt(-2 * Math.log(1 - p));
  return t - (a[0] + a[1]*t + a[2]*t*t) / (1 + b[0]*t + b[1]*t*t + b[2]*t*t*t);
}

// Converte qualquer unidade para equivalente mensal
export function toMensal(valor, unidade, diasUteis) {
  switch (unidade) {
    case 'dia':       return valor * diasUteis;
    case 'semana':    return valor * (diasUteis / 5);
    case 'quinzena':  return valor * 2;
    case 'mes':       return valor;
    default:          return valor;
  }
}

// Converte lead time para dias
export function leadTimeDias(valor, unidade, diasUteis) {
  switch (unidade) {
    case 'dia':    return valor;
    case 'semana': return valor * (diasUteis / 5);
    default:       return valor;
  }
}

// Desvio padrão populacional
export function desvPad(valores) {
  if (valores.length < 2) return 0;
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const variancia = valores.reduce((s, v) => s + Math.pow(v - media, 2), 0) / (valores.length-1);
  return Math.sqrt(variancia);
}

// Cálculo principal
export function calcularEstoques({ periodos, diasUteis, leadTimeValor, leadTimeUnidade, nivelServico, perdas }) {
  // Normaliza todas as demandas para mensal
  const mensais = periodos.map(p => toMensal(p.valor, p.unidade, diasUteis));
  const total = mensais.reduce((a, b) => a + b, 0);
  const n = mensais.length;
  const mediaMensal = total / n;
  const dp = desvPad(mensais);

  // Demanda diária
  const demandaDiaria = mediaMensal / diasUteis;

  // Lead time em dias
  const ltDias = leadTimeDias(leadTimeValor, leadTimeUnidade, diasUteis);

  // Z score
  const z = zScore(nivelServico);

  // ── Estoques ──────────────────────────────────────────────
  const ciclo      = demandaDiaria * ltDias;
  const pulmaoFator = (z * dp) / mediaMensal; // proporção do lead time
  const pulmao     = pulmaoFator * ciclo;
  const ciclo_pulmao = ciclo + pulmao;
  const seguranca  = (perdas / 100) * ciclo_pulmao;
  const maximo     = ciclo + pulmao + seguranca;

  // ── Breakdown por período ──────────────────────────────────
  const fatores = {
    dia:      1 / diasUteis,
    semana:   (diasUteis / 5) / diasUteis,  // ~1 semana
    quinzena: 0.5,
    mes:      1
  };

  const breakdown = {};
  for (const [per, fat] of Object.entries(fatores)) {
    breakdown[per] = {
      demanda:    mediaMensal * fat,
      ciclo:      ciclo      * fat,
      pulmao:     pulmao     * fat,
      seguranca:  seguranca  * fat,
      maximo:     maximo     * fat
    };
  }

  // ── Memória de cálculo ─────────────────────────────────────
  const memoria = gerarMemoria({
    periodos, diasUteis, leadTimeValor, leadTimeUnidade,
    nivelServico, perdas, mensais, mediaMensal, dp,
    demandaDiaria, ltDias, z, ciclo, pulmao, pulmaoFator,
    ciclo_pulmao, seguranca, maximo
  });

  return {
    total, mediaMensal, dp, demandaDiaria, ltDias, z,
    ciclo, pulmao, seguranca, maximo,
    breakdown, memoria
  };
}

function fmt(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function gerarMemoria(d) {
  return `
═══════════════════════════════════════════════════════════
  MEMÓRIA DE CÁLCULO — EstoqueCalc
═══════════════════════════════════════════════════════════

DADOS DE ENTRADA
  Períodos informados : ${d.periodos.length}
  Dias úteis/mês      : ${d.diasUteis}
  Lead Time           : ${d.leadTimeValor} ${d.leadTimeUnidade}(s) = ${fmt(d.ltDias)} dias
  Nível de Serviço    : ${d.nivelServico}%  →  Z = ${d.z.toFixed(3)}
  Perdas no processo  : ${d.perdas}%

DEMANDA (normalizada para mensal)
  Valores mensais     : ${d.mensais.map(v => fmt(v)).join(' | ')}
  Média mensal        : ${fmt(d.mediaMensal)}
  Desvio Padrão       : ${fmt(d.dp)}
  Demanda diária      : ${fmt(d.mediaMensal)} ÷ ${d.diasUteis} = ${fmt(d.demandaDiaria)}

ESTOQUE DE CICLO
  Demanda diária × Lead time
  ${fmt(d.demandaDiaria)} × ${fmt(d.ltDias)} = ${fmt(d.ciclo)}

ESTOQUE PULMÃO
  Fator = (Z × DP) ÷ Média mensal
        = (${d.z.toFixed(3)} × ${fmt(d.dp)}) ÷ ${fmt(d.mediaMensal)}
        = ${d.pulmaoFator.toFixed(4)} (${(d.pulmaoFator * 100).toFixed(1)}%)
  Pulmão = Fator × Ciclo = ${d.pulmaoFator.toFixed(4)} × ${fmt(d.ciclo)} = ${fmt(d.pulmao)}

ESTOQUE DE SEGURANÇA
  Base (Ciclo + Pulmão)   = ${fmt(d.ciclo)} + ${fmt(d.pulmao)} = ${fmt(d.ciclo_pulmao)}
  Perdas (${d.perdas}%)   = ${d.perdas}% × ${fmt(d.ciclo_pulmao)} = ${fmt(d.seguranca)}

ESTOQUE MÁXIMO
  Ciclo + Pulmão + Segurança
  ${fmt(d.ciclo)} + ${fmt(d.pulmao)} + ${fmt(d.seguranca)} = ${fmt(d.maximo)}

═══════════════════════════════════════════════════════════
`.trim();
}
