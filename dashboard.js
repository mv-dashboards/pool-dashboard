// ════════════════════════════════════════════════════════════════════════
// PASSWORD PROTECTION
// ════════════════════════════════════════════════════════════════════════
const DASHBOARD_PASSWORD = 'PoolReview2026';

function checkPW() {
  const val = document.getElementById('pw-input').value;
  if (val === DASHBOARD_PASSWORD) {
    sessionStorage.setItem('mv_auth', '1');
    document.getElementById('pw-gate').classList.add('hidden');
    initDashboard();
  } else {
    document.getElementById('pw-err').textContent = 'Incorrect password. Please try again.';
    document.getElementById('pw-input').value = '';
    document.getElementById('pw-input').focus();
  }
}
document.getElementById('pw-input').addEventListener('keydown', e => { if (e.key === 'Enter') checkPW(); });
if (sessionStorage.getItem('mv_auth') === '1') {
  document.getElementById('pw-gate').classList.add('hidden');
  initDashboard();
}

// ════════════════════════════════════════════════════════════════════════
// NAVIGATION — called from onclick="showSection(this,'id')" in the HTML
// ════════════════════════════════════════════════════════════════════════
// Some nav items point at the dedicated Pool Chemical Forecasting dashboard
// instead of a section in this app — that tool already does this live and
// well, so we link out to it rather than maintaining a second, static copy.
const EXTERNAL_NAV = {
  forecasting: 'https://pool-chem-dashboard.netlify.app/',
  transfers: 'https://pool-chem-dashboard.netlify.app/',
};

function showSection(el, id) {
  if (EXTERNAL_NAV[id]) {
    window.open(EXTERNAL_NAV[id], '_blank');
    return;
  }
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  const sec = document.getElementById(id);
  if (sec) sec.classList.add('active');
  renderSection(id);
}

// ════════════════════════════════════════════════════════════════════════
// FILTERS — date range + marketplace
// ════════════════════════════════════════════════════════════════════════
// G_RANGE: 'this'|'3'|'6'|'ytd'|'all'|'custom' months back from latest data.
// G_MARKET: 'all'|'mv'|'sk'|'walmart' — which account(s) to include.
let G_RANGE = '6';
let G_MARKET = 'all';
let G_FROM = null;  // YYYY-MM, used when G_RANGE === 'custom'
let G_TO   = null;

function ptab(btn, section) {
  btn.closest('.period-tabs').querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const label = (btn.textContent || '').trim().toLowerCase();

  // Show/hide this section's custom-range picker
  const hdr = btn.closest('.sec-hdr-right');
  const customDiv = hdr ? hdr.querySelector('.custom-range') : null;

  if (label.includes('custom')) {
    if (customDiv) customDiv.classList.add('visible');
    G_RANGE = 'custom';
    applyCustomRange(section || currentSectionId());
    return;
  }
  if (customDiv) customDiv.classList.remove('visible');

  if (label.includes('this'))     G_RANGE = 'this';
  else if (label.includes('3'))   G_RANGE = '3';
  else if (label.includes('6'))   G_RANGE = '6';
  else if (label.includes('ytd')) G_RANGE = 'ytd';
  else if (label.includes('all')) G_RANGE = 'all';
  computeDB();
  renderSection(currentSectionId());
}

// Section → custom-range select id prefix
const CR_PREFIX = { pl: 'pl', revenue: 'rev', expenses: 'exp' };

function applyCustomRange(section) {
  const p = CR_PREFIX[section] || 'pl';
  const from = document.getElementById(p + 'From');
  const to   = document.getElementById(p + 'To');
  if (from && from.value) G_FROM = from.value;
  if (to && to.value)     G_TO   = to.value;
  G_RANGE = 'custom';
  computeDB();
  renderSection(currentSectionId());
}

// Marketplace filter hook (dropdown UI not yet added to the HTML — wire an
// onchange="setMarketFilter(this.value)" select with all|mv|sk|walmart).
function setMarketFilter(val) {
  G_MARKET = val;
  computeDB();
  renderSection(currentSectionId());
}

function currentSectionId() {
  const active = document.querySelector('.section.active');
  return active ? active.id : 'pl';
}

// Returns the ordered list of month keys (YYYY-MM) for the current G_RANGE,
// out of all months present in the data.
function rangeKeys(allKeysSorted) {
  if (!allKeysSorted.length) return [];
  const last = allKeysSorted[allKeysSorted.length - 1];
  const lastYear = last.slice(0, 4);
  switch (G_RANGE) {
    case 'this':   return allKeysSorted.slice(-1);
    case '3':      return allKeysSorted.slice(-3);
    case '6':      return allKeysSorted.slice(-6);
    case 'ytd':    return allKeysSorted.filter(k => k.startsWith(lastYear));
    case 'custom': {
      const from = G_FROM || allKeysSorted[0];
      const to   = G_TO   || last;
      const lo = from <= to ? from : to;
      const hi = from <= to ? to : from;
      return allKeysSorted.filter(k => k >= lo && k <= hi);
    }
    case 'all':
    default:       return allKeysSorted;
  }
}

// ════════════════════════════════════════════════════════════════════════
// SUPABASE CONFIG
// ════════════════════════════════════════════════════════════════════════
const SB_URL = 'https://fkyuamlijroduyjcgycs.supabase.co';
const SB_KEY = 'sb_publishable_ErQg-cdWNiHaLRVQAiMtPw_eACOYEYN';

async function sbFetch(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status} ${await res.text()}`);
  return res.json();
}

// ════════════════════════════════════════════════════════════════════════
// CHART HELPERS
// ════════════════════════════════════════════════════════════════════════
const CC = {};
function destroyChart(id) { if (CC[id]) { CC[id].destroy(); delete CC[id]; } }

const GRID  = { color: 'rgba(226,232,240,0.9)' };
const TICK  = { color: '#94a3b8', font: { size: 11 } };
const LEG   = { color: '#475569', font: { size: 11 } };
const BASE_OPTS = {
  responsive: true,
  plugins: { legend: { labels: LEG } },
  scales: { x: { ticks: TICK, grid: GRID }, y: { ticks: TICK, grid: GRID } }
};
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#94a3b8'];

// ════════════════════════════════════════════════════════════════════════
// FORMAT HELPERS
// ════════════════════════════════════════════════════════════════════════
const f$  = n => '$' + Math.abs(Math.round(n)).toLocaleString();
const fN  = n => Math.round(n).toLocaleString();
const badge = (cls, txt) => `<span class="badge ${cls}">${txt}</span>`;
const colorVal = (v, t=0) => `style="color:var(--${v>t?'green':'red'})"`;
const fPct = (part, whole) => whole > 0 ? (part / whole * 100).toFixed(1) + '%' : '—';
const fMonth = k => new Date(k + '-01T12:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
const fMonthLong = k => new Date(k + '-01T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

// ════════════════════════════════════════════════════════════════════════
// LIVE DATA — fetched from Supabase once, re-derived on every filter change
// ════════════════════════════════════════════════════════════════════════
let RAW = null; // raw view rows, fetched once by loadData()
let DB  = null; // derived arrays for the current G_RANGE/G_MARKET, built by computeDB()

function marketMatch(source) {
  const s = (source || '').toLowerCase();
  if (G_MARKET === 'all') return true;
  if (G_MARKET === 'mv') return s.includes('mv');
  if (G_MARKET === 'sk') return s.includes('sk');
  if (G_MARKET === 'walmart') return s.includes('walmart');
  return true;
}

async function loadData() {
  const [revRows, expRows, skuRows, invRows, freshRows] = await Promise.all([
    sbFetch('v_ops_monthly_revenue?order=month_date.asc'),
    sbFetch('v_ops_monthly_expenses?order=month_date.asc'),
    sbFetch('v_ops_sku_stats?order=total_revenue.desc'),
    sbFetch('v_ops_inventory_latest?order=location_name.asc,sku_code.asc'),
    sbFetch('v_ops_data_freshness')
  ]);
  RAW = { revRows, expRows, skuRows, invRows, freshRows };
  computeDB();
  populateCustomSelects();
}

function computeDB() {
  if (!RAW) return;
  const { revRows, expRows, skuRows, invRows, freshRows } = RAW;

  // Revenue: {YYYY-MM: {mv:n, sk:n, fees:n, orders:n}}
  const revMap = {};
  for (const r of revRows) {
    if (!marketMatch(r.source)) continue;
    const k = r.month_date.substring(0, 7);
    if (!revMap[k]) revMap[k] = { mv: 0, sk: 0, fees: 0, orders: 0 };
    const isMV = (r.source || '').toLowerCase().includes('mv');
    revMap[k][isMV ? 'mv' : 'sk'] += Number(r.revenue) || 0;
    revMap[k].fees   += Number(r.amazon_fee) || 0;
    revMap[k].orders += Number(r.order_count) || 0;
  }

  // Expenses: {YYYY-MM: {product:n, shipping:n, ltl:n, tpl:n}}
  const expMap = {};
  for (const e of expRows) {
    const k = e.month_date.substring(0, 7);
    if (!expMap[k]) expMap[k] = { product: 0, shipping: 0, ltl: 0, tpl: 0 };
    const t = e.type;
    if (t === 'product')  expMap[k].product  += Number(e.amount) || 0;
    if (t === 'shipping') expMap[k].shipping += Number(e.amount) || 0;
    if (t === 'ltl')      expMap[k].ltl      += Number(e.amount) || 0;
    if (t === '3pl')      expMap[k].tpl      += Number(e.amount) || 0;
  }

  const allKeys = [...new Set([...Object.keys(revMap), ...Object.keys(expMap)])].sort();
  const selKeys = rangeKeys(allKeys);
  const get = (map, k, field) => map[k] ? (map[k][field] || 0) : 0;
  const fresh = (freshRows && freshRows[0]) || {};

  DB = {
    // Selected-range arrays — driven by the period filter
    months6:  selKeys.map(fMonth),
    rev6:     selKeys.map(k => get(revMap, k, 'mv') + get(revMap, k, 'sk')),
    fees6:    selKeys.map(k => Math.abs(get(revMap, k, 'fees'))),
    cogs6:    selKeys.map(k => get(expMap, k, 'product')),
    ups6:     selKeys.map(k => get(expMap, k, 'shipping')),
    ltl6:     selKeys.map(k => get(expMap, k, 'ltl')),
    tpl6:     selKeys.map(k => get(expMap, k, 'tpl')),

    // All-time arrays (Revenue history chart) — unaffected by period filter,
    // still respects the marketplace filter
    allMonths: allKeys.map(fMonth),
    allMV:     allKeys.map(k => get(revMap, k, 'mv')),
    allSK:     allKeys.map(k => get(revMap, k, 'sk')),

    skus: skuRows,
    inventory: invRows,

    freshness: {
      orders: fresh.latest_order_date || null,
      expenses: fresh.latest_expense_date || null,
      inventory: fresh.latest_inventory_date || null,
    },

    revMap, expMap, allKeys, last6: selKeys
  };
}

// Human label for the selected period, e.g. "Jan 2026 – Jun 2026"
function periodLabel() {
  if (!DB || !DB.last6.length) return '—';
  const a = DB.last6[0], b = DB.last6[DB.last6.length - 1];
  return a === b ? fMonthLong(a) : `${fMonthLong(a)} – ${fMonthLong(b)}`;
}

// Fill the three custom-range select pairs with the months present in data
function populateCustomSelects() {
  if (!DB) return;
  const keys = DB.allKeys;
  for (const p of ['pl', 'rev', 'exp']) {
    const from = document.getElementById(p + 'From');
    const to   = document.getElementById(p + 'To');
    if (!from || !to || from.options.length) continue;
    const opts = keys.map(k => `<option value="${k}">${fMonthLong(k)}</option>`).join('');
    from.innerHTML = opts;
    to.innerHTML   = opts;
    from.value = keys[Math.max(0, keys.length - 6)];
    to.value   = keys[keys.length - 1];
  }
}

// Set text content if the element exists (all KPI fills go through this so a
// missing element can never throw and break a render)
function setTxt(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}
function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ════════════════════════════════════════════════════════════════════════
// SECTION RENDERERS
// ════════════════════════════════════════════════════════════════════════

// ── P&L ──────────────────────────────────────────────────────────────
function renderPL() {
  if (!DB) return;
  const { months6: M, rev6: R, fees6: F, cogs6: C, ups6: U, ltl6: L, tpl6: T } = DB;
  const totalExp = M.map((_, i) => F[i] + C[i] + U[i] + L[i] + T[i]);
  const profit   = M.map((_, i) => R[i] - totalExp[i]);
  const sum = arr => arr.reduce((a,v)=>a+v,0);

  // KPI cards
  const sumRev = sum(R), sumFees = sum(F), sumProfit = sum(profit);
  setTxt('plKpiRev', f$(sumRev));
  setTxt('plKpiRevNote', periodLabel() + ' — Amazon + Walmart');
  setTxt('plKpiFees', f$(sumFees));
  setTxt('plKpiFeePct', fPct(sumFees, sumRev) + ' of revenue');
  const profEl = document.getElementById('plKpiProfit');
  if (profEl) {
    profEl.textContent = sumProfit < 0 ? '(' + f$(-sumProfit) + ')' : f$(sumProfit);
    profEl.style.color = sumProfit < 0 ? 'var(--red)' : 'var(--green)';
  }
  setTxt('plKpiProfitPct', fPct(sumProfit, sumRev) + ' net margin');
  setTxt('plSub', 'Period: ' + periodLabel());
  setTxt('plPieSub', 'Selected period by category');
  setTxt('plTableTitle', 'Monthly P&L — ' + periodLabel());

  destroyChart('cPL');
  CC['cPL'] = new Chart(document.getElementById('cPL'), {
    data: {
      labels: M,
      datasets: [
        { type:'bar',  label:'Revenue',        data:R,        backgroundColor:'rgba(37,99,235,0.65)', borderRadius:4, order:3 },
        { type:'bar',  label:'Total Expenses', data:totalExp, backgroundColor:'rgba(220,38,38,0.45)', borderRadius:4, order:4 },
        { type:'line', label:'Net Profit',     data:profit,   borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.1)', fill:true, tension:0.4, pointRadius:4, order:1 }
      ]
    },
    options: { ...BASE_OPTS, responsive:true }
  });

  destroyChart('cExpPie');
  const totals = [C, U, F, L, T].map(arr => arr.reduce((a,v)=>a+v,0));
  CC['cExpPie'] = new Chart(document.getElementById('cExpPie'), {
    type:'doughnut',
    data: {
      labels: ['Product Cost','UPS/FedEx','Amazon Fees','LTL Freight','3PL + Labor'],
      datasets:[{ data: [totals[0], totals[1], totals[2], totals[3], totals[4]], backgroundColor:['#3b82f6','#ef4444','#f59e0b','#8b5cf6','#10b981'], borderWidth:0, hoverOffset:6 }]
    },
    options:{ responsive:true, cutout:'60%',
      plugins:{ legend:{ position:'right', labels:{ ...LEG, boxWidth:12, padding:10 } } } }
  });

  const neg = v => `<span class="${v<0?'red':'green'}">${v<0?'('+f$(-v)+')':f$(v)}</span>`;
  const act = v => `<span class="badge bg">${f$(v)}</span>`;

  // 9 columns: Month | Revenue | Amazon Fees | UPS/FedEx | Product Cost |
  //            LTL Freight | 3PL + Labor | Total Expenses | Net Profit
  document.getElementById('tbPL').innerHTML =
    M.map((m, i) => `<tr>
      <td class="bold">${m}</td>
      <td>${act(R[i])}</td>
      <td class="red">(${f$(F[i])})</td>
      <td class="red">(${f$(U[i])})</td>
      <td class="red">(${f$(C[i])})</td>
      <td class="red">(${f$(L[i])})</td>
      <td class="red">(${f$(T[i])})</td>
      <td class="red bold">(${f$(totalExp[i])})</td>
      <td>${neg(profit[i])}</td>
    </tr>`).join('') +
    `<tr class="tr-total">
      <td>${M.length}-Mo Total</td>
      <td>${act(sum(R))}</td>
      <td class="red">(${f$(sum(F))})</td>
      <td class="red">(${f$(sum(U))})</td>
      <td class="red">(${f$(sum(C))})</td>
      <td class="red">(${f$(sum(L))})</td>
      <td class="red">(${f$(sum(T))})</td>
      <td class="red bold">(${f$(sum(totalExp))})</td>
      <td>${neg(sumProfit)}</td>
    </tr>`;

  renderFreshnessBadge();
}

// ── Data freshness indicator ────────────────────────────────────────
// Renders (or creates, if not already in the HTML) a small "data as of"
// notice so it's always obvious how current the numbers are — the exact
// thing that was missing when this dashboard silently went stale before.
function renderFreshnessBadge() {
  if (!DB) return;
  let el = document.getElementById('dataFreshness');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dataFreshness';
    el.style.cssText = 'font-size:11px;color:var(--text3);padding:6px 14px;';
    const foot = document.querySelector('.sidebar-foot');
    if (foot) foot.prepend(el);
  }
  const dates = [DB.freshness.orders, DB.freshness.expenses, DB.freshness.inventory].filter(Boolean);
  if (!dates.length) {
    el.textContent = 'Data as of: no data loaded yet';
    return;
  }
  const latest = dates.sort().slice(-1)[0];
  el.textContent = `Data as of: ${latest}`;
}

// ── Revenue ──────────────────────────────────────────────────────────
function renderRevenue() {
  if (!DB) return;
  const { allMonths, allMV, allSK, skus, revMap, last6 } = DB;
  const allWalmart = allMonths.map(() => 0); // Walmart not in ops_orders yet

  // KPI cards — selected period
  const mvSum = last6.reduce((a,k)=>a+(revMap[k]?.mv||0),0);
  const skSum = last6.reduce((a,k)=>a+(revMap[k]?.sk||0),0);
  const total = mvSum + skSum;
  setTxt('revKpiTotal', f$(total));
  setTxt('revKpiTotalNote', periodLabel());
  setTxt('revKpiMV', f$(mvSum));
  setTxt('revKpiMVPct', fPct(mvSum, total) + ' of revenue');
  setTxt('revKpiSK', f$(skSum));
  setTxt('revKpiSKPct', fPct(skSum, total) + ' of revenue');
  setTxt('revKpiWM', '$0');
  setTxt('revKpiWMPct', 'No Walmart data loaded yet');
  setTxt('revSub', 'Period: ' + periodLabel());
  setTxt('revTableTitle', 'SKU Revenue Breakdown — All Data');

  destroyChart('cRevMonth');
  CC['cRevMonth'] = new Chart(document.getElementById('cRevMonth'), {
    type:'bar',
    data:{
      labels: allMonths,
      datasets:[
        { label:'MV Amazon', data:allMV,      backgroundColor:'rgba(37,99,235,0.75)', borderRadius:4, stack:'s' },
        { label:'SK Amazon', data:allSK,      backgroundColor:'rgba(37,99,235,0.35)', borderRadius:4, stack:'s' },
        { label:'Walmart',   data:allWalmart, backgroundColor:'rgba(109,40,217,0.75)', borderRadius:4, stack:'s' }
      ]
    },
    options:{ ...BASE_OPTS, scales:{ x:{...BASE_OPTS.scales.x,stacked:true,ticks:TICK,grid:GRID}, y:{...BASE_OPTS.scales.y,stacked:true,ticks:TICK,grid:GRID} } }
  });

  // Product revenue pie — top 5 SKUs
  const top5 = skus.slice(0, 5);
  destroyChart('cRevProduct');
  CC['cRevProduct'] = new Chart(document.getElementById('cRevProduct'), {
    type:'doughnut',
    data:{
      labels: top5.map(s => `${s.sku_name || s.sku_code} ${s.pack_size||''}`),
      datasets:[{ data: top5.map(s => Number(s.total_revenue)), backgroundColor:COLORS.slice(0,5), borderWidth:0, hoverOffset:6 }]
    },
    options:{ responsive:true, cutout:'60%',
      plugins:{ legend:{ position:'right', labels:{...LEG,boxWidth:12,padding:10} } } }
  });

  document.getElementById('tbRevSku').innerHTML = skus.map(s => `<tr>
    <td><code>${s.sku_code}</code></td>
    <td>${s.sku_name || '—'}</td>
    <td>${s.pack_size || '—'}</td>
    <td>${badge('bb','Amazon')}</td>
    <td>${fN(s.total_qty || 0)}</td>
    <td>${fN(s.order_count || 0)}</td>
    <td class="bold">${f$(s.total_revenue || 0)}</td>
    <td class="red">(${f$(Math.abs(s.total_fees || 0))})</td>
    <td class="green">${f$(s.net_revenue || 0)}</td>
    <td>${s.total_qty > 0 ? f$((s.total_revenue||0) / s.total_qty) : '—'}</td>
  </tr>`).join('');

  renderFreshnessBadge();
}

// ── Shipping ─────────────────────────────────────────────────────────
// NOTE: still placeholder per-location/per-day averages, same as before —
// no shipment-level table exists yet to compute this from real data.
// Left unchanged pending a future phase that ingests UPS shipment detail.
function renderShipping() {
  const { revMap, expMap, last6 } = DB;

  destroyChart('cShipLoc');
  CC['cShipLoc'] = new Chart(document.getElementById('cShipLoc'), {
    type:'bar',
    data:{
      labels:['Indiana','Texas','Nevada','N. Carolina','California','Florida'],
      datasets:[{
        label:'Avg Cost / Order',
        data:[20.50,21.80,25.40,18.90,24.10,19.20],
        backgroundColor:COLORS.slice(0,6), borderRadius:5
      }]
    },
    options:{ ...BASE_OPTS, plugins:{ legend:{display:false} },
      scales:{ x:{ticks:TICK,grid:GRID}, y:{ticks:{...TICK,callback:v=>'$'+v},grid:GRID} } }
  });

  destroyChart('cShipDay');
  CC['cShipDay'] = new Chart(document.getElementById('cShipDay'), {
    type:'bar',
    data:{
      labels:['Mon','Tue','Wed','Thu','Fri','Sat (FedEx)'],
      datasets:[{ label:'Avg Cost',
        data:[20.80,21.10,20.95,21.20,21.40,28.90],
        backgroundColor:['#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#ef4444'],
        borderRadius:5
      }]
    },
    options:{ ...BASE_OPTS, plugins:{ legend:{display:false} },
      scales:{ x:{ticks:TICK,grid:GRID}, y:{ticks:{...TICK,callback:v=>'$'+v},grid:GRID} } }
  });

  const locs = [
    ['Indiana (Hub)','Owned',4491,'$92,066','$20.50','$1,820',621,'$28.90','42.3%'],
    ['Texas','Owned',1380,'$30,084','$21.80','$702',192,'$28.10','13.8%'],
    ['Nevada','Owned',971,'$24,673','$25.40','$480',164,'$30.20','11.3%'],
    ['N. Carolina','Partner',1181,'$22,321','$18.90','$520',0,'&mdash;','10.3%'],
    ['California','Partner',960,'$23,136','$24.10','$380',0,'&mdash;','10.6%'],
    ['Florida','Partner',654,'$12,557','$19.20','$143',0,'&mdash;','5.8%'],
  ];
  document.getElementById('tbShipLoc').innerHTML = locs.map(r => `<tr>
    <td class="bold">${r[0]}</td>
    <td>${badge(r[1]==='Owned'?'bb':'bp', r[1])}</td>
    <td>${fN(r[2])}</td><td>${r[3]}</td><td>${r[4]}</td>
    <td class="red">${r[5]}</td>
    <td>${r[6]||'&mdash;'}</td><td>${r[7]}</td><td class="muted">${r[8]}</td>
  </tr>`).join('');
}

// ── Expenses ─────────────────────────────────────────────────────────
const EXP_CATS = [
  { key:'product',  drill:'cogs', label:'Product Cost', catId:'expCatCogs' },
  { key:'shipping', drill:'ups',  label:'UPS / FedEx',  catId:'expCatUps'  },
  { key:'fees',     drill:'amz',  label:'Amazon Fees',  catId:'expCatFees' },
  { key:'ltl',      drill:'ltl',  label:'LTL Freight',  catId:'expCatLtl'  },
  { key:'tpl',      drill:'tpl',  label:'3PL + Labor',  catId:'expCat3pl'  },
];

// Monthly value of one expense category (fees come from the revenue map)
function expCatMonthly(key) {
  const { expMap, revMap, last6 } = DB;
  return last6.map(k => key === 'fees'
    ? Math.abs(revMap[k]?.fees || 0)
    : (expMap[k]?.[key] || 0));
}

function renderExpenses() {
  if (!DB) return;
  const { months6: M, rev6: R } = DB;
  const sum = arr => arr.reduce((a,v)=>a+v,0);

  // Per-category totals for the selected period
  const catTotals = EXP_CATS.map(c => sum(expCatMonthly(c.key)));
  const grandTotal = sum(catTotals);
  const revTotal = sum(R);

  // Category cards + % of total expenses
  EXP_CATS.forEach((c, i) => {
    setTxt(c.catId, f$(catTotals[i]));
    setTxt(c.catId + 'Pct', fPct(catTotals[i], grandTotal) + ' of expenses');
  });

  // KPI cards
  setTxt('expKpiTotal', f$(grandTotal));
  setTxt('expKpiTotalNote', periodLabel());
  const maxIdx = catTotals.indexOf(Math.max(...catTotals));
  setTxt('expKpiLargest', EXP_CATS[maxIdx].label);
  setTxt('expKpiLargestNote', f$(catTotals[maxIdx]) + ' — ' + fPct(catTotals[maxIdx], grandTotal) + ' of expenses');
  setTxt('expKpiRatio', fPct(grandTotal, revTotal));
  setTxt('expKpiRatioNote', 'Total costs vs gross revenue — ' + periodLabel());
  setTxt('expSub', 'Period: ' + periodLabel());
  setTxt('expCatSub', 'Breakdown by cost type — ' + periodLabel());
  setTxt('expTableTitle', 'Monthly Expense Breakdown — ' + periodLabel());

  destroyChart('cExpCat');
  CC['cExpCat'] = new Chart(document.getElementById('cExpCat'), {
    type:'doughnut',
    data:{
      labels: EXP_CATS.map(c=>c.label),
      datasets:[{ data: catTotals, backgroundColor:['#3b82f6','#ef4444','#f59e0b','#8b5cf6','#10b981'], borderWidth:0, hoverOffset:6 }]
    },
    options:{ responsive:true, cutout:'55%',
      plugins:{ legend:{ position:'right', labels:{...LEG,boxWidth:12,padding:8} } } }
  });

  const series = EXP_CATS.map(c => expCatMonthly(c.key));
  destroyChart('cExpTrend');
  CC['cExpTrend'] = new Chart(document.getElementById('cExpTrend'), {
    type:'line',
    data:{
      labels: M,
      datasets: [
        { label:'Product Cost', data:series[0], borderColor:'#3b82f6', tension:0.4, pointRadius:3 },
        { label:'UPS / FedEx',  data:series[1], borderColor:'#ef4444', tension:0.4, pointRadius:3 },
        { label:'Amazon Fees',  data:series[2], borderColor:'#f59e0b', tension:0.4, pointRadius:3 },
        { label:'LTL Freight',  data:series[3], borderColor:'#8b5cf6', tension:0.4, pointRadius:3 },
        { label:'3PL + Labor',  data:series[4], borderColor:'#10b981', tension:0.4, pointRadius:3, borderDash:[4,3] },
      ]
    },
    options:{ ...BASE_OPTS }
  });

  // Monthly breakdown table:
  // Month | Product Cost | UPS / FedEx | Amazon Fees | LTL Freight | 3PL + Labor | Total
  const tb = document.getElementById('tbExpenses');
  if (tb) {
    tb.innerHTML = M.map((m, i) => {
      const rowTotal = series.reduce((a, s) => a + s[i], 0);
      return `<tr>
        <td class="bold">${m}</td>
        ${series.map(s => `<td>${f$(s[i])}</td>`).join('')}
        <td class="bold">${f$(rowTotal)}</td>
      </tr>`;
    }).join('') +
    `<tr class="tr-total">
      <td>${M.length}-Mo Total</td>
      ${catTotals.map(t => `<td>${f$(t)}</td>`).join('')}
      <td class="bold">${f$(grandTotal)}</td>
    </tr>`;
  }

  renderFreshnessBadge();
}

// ── Expense drill-down ───────────────────────────────────────────────
function expDrill(drillKey, el) {
  if (!DB) return;
  const cat = EXP_CATS.find(c => c.drill === drillKey);
  if (!cat) return;
  const section = el.closest('.section') || document;
  const panel   = section.querySelector('.exp-drill');
  if (!panel) return;

  const { months6: M } = DB;
  const vals  = expCatMonthly(cat.key);
  const total = vals.reduce((a,v)=>a+v,0);

  const title = panel.querySelector('.exp-drill-title');
  if (title) title.textContent = `${cat.label} — monthly detail (${periodLabel()})`;
  const content = panel.querySelector('#expDrillContent, [id^="expDrill"][id$="Content"]') || panel.lastElementChild;
  if (content) {
    content.innerHTML = `<div class="tbl-wrap"><table>
      <thead><tr><th>Month</th><th>${cat.label}</th><th>% of period total</th></tr></thead>
      <tbody>
        ${M.map((m,i)=>`<tr><td class="bold">${m}</td><td>${f$(vals[i])}</td><td class="muted">${fPct(vals[i], total)}</td></tr>`).join('')}
        <tr class="tr-total"><td>Total</td><td>${f$(total)}</td><td>100%</td></tr>
      </tbody>
    </table></div>`;
  }
  panel.classList.add('open');
}

function closeExpDrill() {
  document.querySelectorAll('.exp-drill').forEach(p => p.classList.remove('open'));
}

// ── Margins ───────────────────────────────────────────────────────────
function renderMargins() {
  if (!DB) return;
  const { skus, ups6, last6, revMap } = DB;

  const totalOrders = last6.reduce((a, k) => a + (revMap[k]?.orders || 0), 0);
  const totalUPS    = ups6.reduce((a,v)=>a+v,0);
  const avgShip     = totalOrders > 0 ? totalUPS / totalOrders : 21;

  document.getElementById('tbMarginSku').innerHTML = skus.map(s => {
    const rev  = Number(s.total_revenue) || 0;
    const fees = Math.abs(Number(s.total_fees)) || 0;
    const qty  = Number(s.total_qty) || 1;
    const estShip = avgShip * qty;
    const net  = rev - fees - estShip;
    const pct  = rev > 0 ? (net / rev * 100) : 0;
    return `<tr>
      <td><code>${s.sku_code}</code></td>
      <td>${s.sku_name || '—'}</td>
      <td>${s.pack_size || '—'}</td>
      <td>${fN(qty)}</td>
      <td>${f$(rev)}</td>
      <td>—</td>
      <td>${f$(estShip)}</td>
      <td>${f$(fees)}</td>
      <td>—</td>
      <td ${colorVal(net)}>${net<0?'('+f$(-net)+')':f$(net)}</td>
      <td>${badge(pct>10?'bg':pct>0?'ba':'br', (pct>0?'+':'')+pct.toFixed(1)+'%')}</td>
    </tr>`;
  }).join('');

  const locData = [
    ['Indiana (Hub)','Owned',4491,'$221,000','$20.50','$18,000','$4,200','13.4%','bg'],
    ['Texas','Owned',1380,'$68,000','$21.80','$8,200','$2,800','11.2%','bg'],
    ['Nevada','Owned',971,'$47,800','$25.40','$6,800','$3,200','9.8%','ba'],
    ['N. Carolina','Partner',1181,'$58,300','$18.90','$4,900','$2,100','12.1%','bg'],
    ['California','Partner',960,'$47,500','$24.10','$3,600','$1,800','9.1%','ba'],
    ['Florida','Partner',654,'$32,500','$19.20','$2,900','$1,100','11.4%','bg'],
  ];
  document.getElementById('tbMarginLoc').innerHTML = locData.map(r => `<tr>
    <td class="bold">${r[0]}</td>
    <td>${badge(r[1]==='Owned'?'bb':'bp', r[1])}</td>
    <td>${fN(r[2])}</td><td>${r[3]}</td><td>${r[4]}</td>
    <td>${r[5]}</td><td>${r[6]}</td>
    <td>${badge(r[8], r[7])}</td>
  </tr>`).join('');
}

// ── Inventory ─────────────────────────────────────────────────────────
function renderInventory() {
  if (!DB) return;
  const { inventory } = DB;

  // Group rows by location
  const locMap = {};
  for (const row of inventory) {
    const loc = row.location_name || 'Unknown';
    if (!locMap[loc]) locMap[loc] = { units: 0, type: row.location_type, skus: {}, snapshot: row.snapshot_date };
    const qty = Number(row.quantity_4pack) || 0;
    locMap[loc].units += qty;
    const label = row.sku_name || row.sku_code || '?';
    locMap[loc].skus[label] = (locMap[loc].skus[label] || 0) + qty;
  }
  const rows = Object.entries(locMap).sort((a,b) => b[1].units - a[1].units);

  // Visible table: Warehouse | Account | Total Value | Total Units | SKU Breakdown
  const snap = document.getElementById('invSnapTable');
  if (snap) {
    snap.innerHTML = rows.map(([loc, d]) => {
      const isOwned = (d.type || '').toLowerCase().includes('owned');
      const breakdown = Object.entries(d.skus)
        .sort((a,b)=>b[1]-a[1])
        .map(([n,q]) => `${n}: ${fN(q)}`)
        .join(' &middot; ');
      return `<tr>
        <td class="bold">${loc}</td>
        <td>${badge(isOwned?'bb':'bp', isOwned?'Owned':'Partner')}</td>
        <td class="muted">&mdash;</td>
        <td>${fN(d.units)}</td>
        <td class="muted">${breakdown || '&mdash;'}</td>
      </tr>`;
    }).join('');
  }
  const tabs = document.getElementById('invSnapTabs');
  if (tabs) tabs.style.display = 'none'; // per-account tabs not wired to live data yet
  const kpis = document.getElementById('invSnapKpis');
  if (kpis) {
    const totalUnits = rows.reduce((a,[,d])=>a+d.units,0);
    const snapDate = DB.freshness.inventory || '—';
    kpis.innerHTML = `<div class="kpi-row kpi-3">
      <div class="kpi"><div class="kpi-label">Total Units (4-pack eq.)</div><div class="kpi-val">${fN(totalUnits)}</div><div class="kpi-note">Across ${rows.length} locations</div></div>
      <div class="kpi"><div class="kpi-label">Locations Reporting</div><div class="kpi-val">${rows.length}</div><div class="kpi-note">Latest snapshot per location</div></div>
      <div class="kpi"><div class="kpi-label">Snapshot Date</div><div class="kpi-val" style="font-size:20px">${snapDate}</div><div class="kpi-note">Re-run inventory sync to refresh</div></div>
    </div>`;
  }
  setTxt('invSnapTableTitle', 'Inventory by Warehouse — as of ' + (DB.freshness.inventory || '—'));

  // Hidden legacy table — kept for compatibility
  const legacy = document.getElementById('tbInventory');
  if (legacy) {
    legacy.innerHTML = rows.map(([loc, d]) => {
      const isOwned = (d.type || '').toLowerCase().includes('owned');
      return `<tr><td>${loc}</td><td>${isOwned?'Owned':'Partner'}</td><td>${fN(d.units)}</td></tr>`;
    }).join('');
  }

  renderFreshnessBadge();
}

// ── Insights ──────────────────────────────────────────────────────────
// Computed from the live data on every render — replaces the old hardcoded
// insight cards, which were demo text that never updated.
function renderInsights() {
  if (!DB) return;
  const grid = document.getElementById('insightGrid');
  if (!grid) return;
  const { skus, rev6, fees6, cogs6, ups6, ltl6, tpl6, months6, allKeys, revMap } = DB;
  const sum = arr => arr.reduce((a,v)=>a+v,0);

  const cards = [];

  // Top SKU by revenue
  if (skus.length) {
    const top = skus[0];
    const totalRev = skus.reduce((a,s)=>a+(Number(s.total_revenue)||0),0);
    cards.push({ cls:'opportunity', tag:'Top Performer',
      title:`${top.sku_name || top.sku_code} leads all SKUs`,
      val: f$(top.total_revenue||0),
      body:`${fPct(Number(top.total_revenue)||0, totalRev)} of all-time gross revenue across ${skus.length} SKUs.` });
  }

  // Peak month (all time, current market filter)
  if (allKeys.length) {
    let peakK = allKeys[0], peakV = 0;
    for (const k of allKeys) {
      const v = (revMap[k]?.mv||0) + (revMap[k]?.sk||0);
      if (v > peakV) { peakV = v; peakK = k; }
    }
    cards.push({ cls:'info', tag:'Seasonality',
      title:`${fMonthLong(peakK)} is the biggest revenue month on record`,
      val: f$(peakV),
      body:'Pool-chemical demand peaks in late spring — plan inventory and transfers ahead of the May–June ramp.' });
  }

  // Expense ratio (selected period)
  const totalExp = sum(fees6)+sum(cogs6)+sum(ups6)+sum(ltl6)+sum(tpl6);
  const totalRev6 = sum(rev6);
  if (totalRev6 > 0) {
    const ratio = totalExp/totalRev6*100;
    cards.push({ cls: ratio > 85 ? 'warning' : 'info', tag:'Cost Structure',
      title:`Expenses are ${ratio.toFixed(1)}% of revenue (${periodLabel()})`,
      val: f$(totalExp),
      body:`Largest drivers: product cost ${f$(sum(cogs6))} and UPS/FedEx ${f$(sum(ups6))}. Net margin ${(100-ratio).toFixed(1)}%.` });
  }

  // Shipping cost share
  if (totalRev6 > 0) {
    cards.push({ cls: sum(ups6)/totalRev6 > 0.25 ? 'warning' : 'info', tag:'Shipping',
      title:`Parcel shipping is ${fPct(sum(ups6), totalRev6)} of revenue`,
      val: f$(sum(ups6)),
      body:`Across ${months6.length} month(s). Shipment-level analysis (per-location, per-day) lands with the shipping data model.` });
  }

  grid.innerHTML = cards.map(c => `<div class="insight ${c.cls}">
    <div class="insight-tag">${c.tag}</div>
    <div class="insight-title">${c.title}</div>
    <div class="insight-val">${c.val}</div>
    <div class="insight-body">${c.body}</div>
  </div>`).join('');

  renderFreshnessBadge();
}

// ════════════════════════════════════════════════════════════════════════
// DISPATCHER
// ════════════════════════════════════════════════════════════════════════
// Forecasting/Transfers link out to the dedicated forecasting dashboard
// (see EXTERNAL_NAV above) instead of rendering placeholder data.
const renderers = {
  pl: renderPL, revenue: renderRevenue, shipping: renderShipping,
  expenses: renderExpenses, margins: renderMargins, inventory: renderInventory,
  insights: renderInsights,
};

function renderSection(id) {
  if (renderers[id]) renderers[id]();
}

// ════════════════════════════════════════════════════════════════════════
// INIT — fetch data then render
// ════════════════════════════════════════════════════════════════════════
function showLoadingState(msg) {
  const foot = document.querySelector('.sidebar-foot .status-text');
  if (foot) foot.textContent = msg;
  const dot = document.querySelector('.status-dot');
  if (dot) { dot.className = 'status-dot'; } // amber (loading)
}

function showLiveState() {
  const foot = document.querySelector('.sidebar-foot .status-text');
  if (foot) foot.textContent = 'Live data — Supabase';
  const dot = document.querySelector('.status-dot');
  if (dot) dot.classList.add('live');
}

async function initDashboard() {
  showLoadingState('Loading live data…');
  try {
    await loadData();
    showLiveState();
    renderPL();
    renderFreshnessBadge();
  } catch (err) {
    console.error('Dashboard load error:', err);
    showLoadingState('Data load failed — check console');
  }
}
