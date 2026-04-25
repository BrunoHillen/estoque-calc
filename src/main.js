/**
 * main.js — EstoqueCalc
 * Vite + Vanilla JS
 */

import { calcularEstoques, toMensal } from './calc.js';

// ── Estado ──────────────────────────────────────────────────
let periodos = [];
let selectedNS = 98;

// ── Inicialização ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  bindNsButtons();
  bindAddRow();
  bindClearAll();
  bindLoadExample();
  bindCalc();
  bindTabs();
  bindMemoryToggle();
  renderTable();
});

// ── Nível de serviço ─────────────────────────────────────────
function bindNsButtons() {
  document.querySelectorAll('.ns-btn').forEach(btn => {
    btn.classList.remove('selected');
    if (Number(btn.dataset.ns) === selectedNS) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      selectedNS = Number(btn.dataset.ns);
      document.querySelectorAll('.ns-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('nsCustom').value = '';
    });
  });

  document.getElementById('nsCustom').addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    if (v >= 50 && v < 100) {
      selectedNS = v;
      document.querySelectorAll('.ns-btn').forEach(b => b.classList.remove('selected'));
    }
  });
}

// ── Adicionar linha ───────────────────────────────────────────
function bindAddRow() {
  document.getElementById('btnAddRow').addEventListener('click', addRow);
  document.getElementById('newPeriodValue').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addRow();
  });
}

function addRow() {
  const label = document.getElementById('newPeriodLabel').value.trim() || `Período ${periodos.length + 1}`;
  const valor = parseFloat(document.getElementById('newPeriodValue').value);
  const unidade = document.getElementById('newPeriodUnit').value;

  if (!valor || valor <= 0) {
    shake(document.getElementById('newPeriodValue'));
    return;
  }

  periodos.push({ id: Date.now(), label, valor, unidade });
  document.getElementById('newPeriodLabel').value = '';
  document.getElementById('newPeriodValue').value = '';
  renderTable();
  updateTotals();
}

function shake(el) {
  el.style.border = '1.5px solid #dc2626';
  setTimeout(() => { el.style.border = ''; }, 1200);
}

// ── Deletar linha ─────────────────────────────────────────────
function deleteRow(id) {
  periodos = periodos.filter(p => p.id !== id);
  renderTable();
  updateTotals();
}

// ── Render tabela ─────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('demandBody');
  const empty = document.getElementById('tableEmpty');
  const dias = parseInt(document.getElementById('diasUteis').value) || 20;

  if (periodos.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = '';
    document.getElementById('demandTotals').style.display = 'none';
    return;
  }

  empty.style.display = 'none';

  tbody.innerHTML = periodos.map(p => {
    const equiv = toMensal(p.valor, p.unidade, dias);
    return `
      <tr>
        <td>${p.label}</td>
        <td class="mono">${p.valor.toLocaleString('pt-BR')}</td>
        <td><span class="unit-badge">${p.unidade}</span></td>
        <td class="mono">${equiv.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
        <td><button class="btn-del" data-id="${p.id}" title="Remover">×</button></td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', () => deleteRow(Number(btn.dataset.id)));
  });
}

// ── Totais dinâmicos ──────────────────────────────────────────
function updateTotals() {
  const totalsDiv = document.getElementById('demandTotals');
  if (periodos.length === 0) { totalsDiv.style.display = 'none'; return; }

  const dias = parseInt(document.getElementById('diasUteis').value) || 20;
  const mensais = periodos.map(p => toMensal(p.valor, p.unidade, dias));
  const total = mensais.reduce((a, b) => a + b, 0);
  const media = total / mensais.length;
  const dp = desvPadLocal(mensais);

  document.getElementById('totalGeral').textContent = total.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  document.getElementById('mediaGeral').textContent = media.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  document.getElementById('desvioPadrao').textContent = dp.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  totalsDiv.style.display = 'flex';
}

function desvPadLocal(arr) {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / (arr.length-1));
}

// ── Limpar / Exemplo ──────────────────────────────────────────
function bindClearAll() {
  document.getElementById('btnClearAll').addEventListener('click', () => {
    periodos = [];
    renderTable();
    updateTotals();
    document.getElementById('resultsSection').style.display = 'none';
  });
}

function bindLoadExample() {
  document.getElementById('btnLoadExample').addEventListener('click', () => {
    periodos = [
      { id: 1,  label: 'Jan/24', valor: 10179, unidade: 'mes' },
      { id: 2,  label: 'Fev/24', valor: 33615, unidade: 'mes' },
      { id: 3,  label: 'Mar/24', valor: 27609, unidade: 'mes' },
      { id: 4,  label: 'Abr/24', valor: 16477, unidade: 'mes' },
      { id: 5,  label: 'Mai/24', valor: 47959, unidade: 'mes' },
      { id: 6,  label: 'Jun/24', valor: 21594, unidade: 'mes' },
      { id: 7,  label: 'Jul/24', valor: 25505, unidade: 'mes' },
      { id: 8,  label: 'Ago/24', valor: 43188, unidade: 'mes' },
      { id: 9,  label: 'Set/24', valor: 38184, unidade: 'mes' },
      { id: 10, label: 'Out/24', valor: 37182, unidade: 'mes' },
      { id: 11, label: 'Nov/24', valor: 10319, unidade: 'mes' },
      { id: 12, label: 'Dez/24', valor: 2108,  unidade: 'mes' },
    ];
    // configura NS para 98%
    selectedNS = 98;
    document.querySelectorAll('.ns-btn').forEach(b => {
      b.classList.toggle('selected', Number(b.dataset.ns) === 98);
    });
    renderTable();
    updateTotals();
  });
}

// ── Calcular ──────────────────────────────────────────────────
function bindCalc() {
  document.getElementById('btnCalc').addEventListener('click', calcular);
}

function calcular() {
  if (periodos.length < 2) {
    alert('Adicione ao menos 2 períodos para calcular o desvio padrão.');
    return;
  }

  const diasUteis      = parseInt(document.getElementById('diasUteis').value)  || 20;
  const leadTimeValor  = parseFloat(document.getElementById('leadTime').value) || 5;
  const leadTimeUnidade = document.getElementById('leadTimeUnit').value;
  const perdas         = parseFloat(document.getElementById('perdas').value)   || 0;

  const res = calcularEstoques({
    periodos, diasUteis, leadTimeValor, leadTimeUnidade,
    nivelServico: selectedNS, perdas
  });

  renderResults(res);
}

// ── Renderizar resultados ─────────────────────────────────────
function renderResults(res) {
  const fmt = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

  document.getElementById('res-ciclo').textContent    = fmt(res.ciclo);
  document.getElementById('res-pulmao').textContent   = fmt(res.pulmao);
  document.getElementById('res-seguranca').textContent= fmt(res.seguranca);
  document.getElementById('res-maximo').textContent   = fmt(res.maximo);
  document.getElementById('resultNsLabel').textContent = `NS: ${selectedNS}%`;

  document.getElementById('memoryText').textContent = res.memoria;

  // Guarda breakdown para as tabs
  window._breakdown = res.breakdown;
  renderTab('dia', res.breakdown);

  // Ativa tab "dia"
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="dia"]').classList.add('active');

  const section = document.getElementById('resultsSection');
  section.style.display = '';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Tabs ──────────────────────────────────────────────────────
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (window._breakdown) renderTab(btn.dataset.tab, window._breakdown);
    });
  });
}

const tabLabels = {
  dia: 'dia', semana: 'semana', quinzena: 'quinzena', mes: 'mês'
};

function renderTab(periodo, breakdown) {
  const d = breakdown[periodo];
  const fmt2 = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const descricoes = {
    dia: {
      demanda:   'Média de consumo por dia útil',
      ciclo:     'Demanda diária × lead time (dias)',
      pulmao:    'Proteção à variação — base diária',
      seguranca: 'Cobertura de perdas — base diária',
      maximo:    'Ciclo + Pulmão + Segurança (dia)',
    },
    semana: {
      demanda:   'Média de consumo por semana',
      ciclo:     'Estoque necessário para cobrir 1 semana de lead time',
      pulmao:    'Proteção à variação — base semanal',
      seguranca: 'Cobertura de perdas — base semanal',
      maximo:    'Ciclo + Pulmão + Segurança (semana)',
    },
    quinzena: {
      demanda:   'Média de consumo por quinzena',
      ciclo:     'Estoque necessário para cobrir 1 quinzena de lead time',
      pulmao:    'Proteção à variação — base quinzenal',
      seguranca: 'Cobertura de perdas — base quinzenal',
      maximo:    'Ciclo + Pulmão + Segurança (quinzena)',
    },
    mes: {
      demanda:   'Média de consumo mensal',
      ciclo:     'Demanda durante o lead time de reposição',
      pulmao:    'Proteção à variação de demanda mensal',
      seguranca: 'Cobertura de perdas no processo mensal',
      maximo:    'Ciclo + Pulmão + Segurança (mês)',
    },
  };

  const desc = descricoes[periodo];

  const rows = [
    ['Demanda média',        d.demanda,    desc.demanda],
    ['Estoque de Ciclo',     d.ciclo,      desc.ciclo],
    ['Estoque Pulmão',       d.pulmao,     desc.pulmao],
    ['Estoque de Segurança', d.seguranca,  desc.seguranca],
    ['Estoque Máximo',       d.maximo,     desc.maximo],
  ];

  document.getElementById('periodBody').innerHTML = rows.map(([label, val, calc]) => `
    <tr>
      <td>${label}</td>
      <td>${fmt2(val)}</td>
      <td>${calc}</td>
    </tr>
  `).join('');
}


// ── Memória toggle ────────────────────────────────────────────
function bindMemoryToggle() {
  const btn = document.getElementById('memoryToggle');
  const content = document.getElementById('memoryContent');
  btn.addEventListener('click', () => {
    const open = content.style.display !== 'none';
    content.style.display = open ? 'none' : '';
    btn.classList.toggle('open', !open);
    btn.querySelector('span').textContent = open ? '▶' : '▼';
  });
}
