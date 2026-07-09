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
// NAVIGATION
// ════════════════════════════════════════════════════════════════════════
// Some nav items point at the dedicated Pool Chemical Forecasting dashboard
// instead of a section in this app — that tool already does this live and
// well, so we link out to it rather than maintaining a second, static copy.
const EXTERNAL_NAV = {
  forecasting: 'https://pool-chem-dashboard.netlify.app/',
  transfers: 'https://pool-chem-dashboard.netlify.app/',
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const id = item.dataset.section;
    if (EXTERNAL_NAV[id]) {
      window.open(EXTERNAL_NAV[id], '_blank');
      return;
    }
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(id).classList.add('active');
    renderSection(id);
  });
});

// ════════════════════════════════════════════════════════════════════════
// FILTERS — date range + marketplace
// ════════════════════════════════════════════════════════════════════════
// G_RANGE: 'this'|'3'|'6'|'ytd'|'all' months back from the latest data month.
// G_MARKET: 'all'|'mv'|'sk'|'walmart' — which account(s) to include.
let G_RANGE = '6';
let G_MARKET = 'all';

function ptab(btn) {
  btn.closest('.period-tabs').querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const label = (btn.textContent || '').trim().toLowerCase();
  if (label.includes('this')) G_RANGE = 'this';
  else if (label.includes('3')) G_RANGE = '3';
  else if (label.includes('6')) G_RANGE = '6';
  else if (label.includes('ytd')) G_RANGE = 'ytd';
  else if (label.includes('all')) G_RANGE = 'all';
  renderSection(currentSectionId());
}

// Hook for a future marketplace filter control (dropdown not yet added to
// dashboard.html — wire an onchange="setMarketFilter(this.value)" select
// with values all|mv|sk|walmart to enable it).
function setMarketFilter(val) {
  G_MARKET = val;
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
    case 'this': return allKeysSorted.slice(-1);
    case '3':    return allKeysSorted.slice(-3);
    case '6':    return allKeysSorted.slice(-6);
    case 'ytd':  return allKeysSorted.filter(k => k.startsWith(lastYear));
    case 'all':
    default:     return allKeysSorted;
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

// ════════════════════════════════════════════════════════════════════════
// LIVE DATA — fetched from Supabase on load
// ════════════════════════════════════════════════════════════════════════
let DB = null; // populated by loadData()

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

  // ── Build monthly lookup maps ─────────────────────────────────────────
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

  // ── Build ordered month lists ─────────────────────────────────────────
  const allKeys = [...new Set([
    ...Object.keys(revMap),
    ...Object.keys(expMap)
  ])].sort();

  const selKeys = rangeKeys(allKeys);

  const fmt = k => {
    const d = new Date(k + '-01');
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const get = (map, k, field) => map[k] ? (map[k][field] || 0) : 0;

  const fresh = (freshRows && freshRows[0]) || {};

  DB = {
    // Selected-range arrays (P&L, Expenses) — driven by the period filter
    months6:  selKeys.map(fmt),
    rev6:     selKeys.map(k => get(revMap, k, 'mv') + get(revMap, k, 'sk')),
    fees6:    selKeys.map(k => get(revMap, k, 'fees')),
    cogs6:    selKeys.map(k => get(expMap, k, 'product')),
    ups6:     selKeys.map(k => get(expMap, k, 'shipping')),
    ltl6:     selKeys.map(k => get(expMap, k, 'ltl')),
    tpl6:     selKeys.map(k => get(expMap, k, 'tpl')),

    // All-time arrays (Revenue history chart) — unaffected by period filter,
    // still respects the marketplace filter
    allMonths: allKeys.map(fmt),
    allMV:     allKeys.map(k => get(revMap, k, 'mv')),
    allSK:     allKeys.map(k => get(revMap, k, 'sk')),

    // SKUs
    skus: skuRows,

    // Inventory
    inventory: invRows,

    // Data freshness (most recent date loaded per source table)
    freshness: {
      orders: fresh.latest_order_date || null,
      expenses: fresh.latest_expense_date || null,
      inventory: fresh.latest_inventory_date || null,
    },

    // Raw maps for computed values
    revMap, expMap, last6: selKeys
  };
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
      datasets:[{ data: totals, backgroundColor:['#3b82f6','#ef4444','#f59e0b','#8b5cf6','#10b981'], borderWidth:0, hoverOffset:6 }]
    },
    options:{ responsive:true, cutout:'60%',
      plugins:{ legend:{ position:'right', labels:{ ...LEG, boxWidth:12, padding:10 } } } }
  });

  const sum = arr => arr.reduce((a,v)=>a+v,0);
  const neg = v => `<span class="${v<0?'red':'green'}">${v<0?'('+f$(-v)+')':f$(v)}</span>`;
  const act = v => `<span class="badge bg">${f$(v)}</span>`;

  document.getElementById('tbPL').innerHTML =
    M.map((m, i) => `<tr>
      <td class="bold">${m}</td>
      <td>${act(R[i])}</td>
      <td class="red">(${f$(F[i])})</td>
      <td class="red">(${f$(U[i])})</td>
      <td class="red">(${f$(C[i])})</td>
      <td class="red">(${f$(L[i])})</td>
      <td class="red">(${f$(T[i])})</td>
      <td class="muted">&mdash;</td>
      <td class="muted">&mdash;</td>
      <td class="muted">&mdash;</td>
      <td>${neg(profit[i])}</td>
      <td class="muted"></td>
    </tr>`).join('') +
    `<tr class="tr-total">
      <td>${M.length}-Mo Total</td>
      <td>${act(sum(R))}</td>
      <td class="red">(${f$(sum(F))})</td>
      <td class="red">(${f$(sum(U))})</td>
      <td class="red">(${f$(sum(C))})</td>
      <td class="red">(${f$(sum(L))})</td>
      <td class="red">(${f$(sum(T))})</td>
      <td class="muted" colspan="4"></td>
      <td>${neg(sum(profit))}</td>
      <td></td>
    </tr>`;

  // Update KPI card
  const latestRev = R[R.length-1];
  const el = document.getElementById('kpiRevApr');
  if (el) el.textContent = f$(latestRev);

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
  const { allMonths, allMV, allSK, skus } = DB;
  const allWalmart = allMonths.map(() => 0); // Walmart not in ops_orders yet

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

  const upsTotal = last6.reduce((a,k) => a + (expMap[k]?.shipping || 0), 0);
  const ordTotal = last6.reduce((a,k) => a + ((revMap[k]?.mv||0) + (revMap[k]?.sk||0) > 0 ? revMap[k].orders : 0), 0);
  const avgCost  = ordTotal > 0 ? upsTotal / ordTotal : 0;

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
function renderExpenses() {
  if (!DB) return;
  const { months6: M, cogs6: C, ups6: U, fees6: F, ltl6: L, tpl6: T, expMap, last6 } = DB;
  const sum = arr => arr.reduce((a,v)=>a+v,0);

  destroyChart('cExpCat');
  CC['cExpCat'] = new Chart(document.getElementById('cExpCat'), {
    type:'doughnut',
    data:{
      labels:['Product Cost','UPS/FedEx','Amazon Fees','LTL Freight','3PL + Labor'],
      datasets:[{ data:[sum(C),sum(U),sum(F),sum(L),sum(T)], backgroundColor:COLORS, borderWidth:0, hoverOffset:6 }]
    },
    options:{ responsive:true, cutout:'55%',
      plugins:{ legend:{ position:'right', labels:{...LEG,boxWidth:12,padding:8} } } }
  });

  destroyChart('cExpTrend');
  CC['cExpTrend'] = new Chart(document.getElementById('cExpTrend'), {
    type:'line',
    data:{
      labels: M,
      datasets:[
        { label:'Product Cost', data:C, borderColor:'#3b82f6', tension:0.4, pointRadius:3 },
        { label:'UPS / FedEx',  data:U, borderColor:'#ef4444', tension:0.4, pointRadius:3 },
        { label:'Amazon Fees',  data:F, borderColor:'#f59e0b', tension:0.4, pointRadius:3 },
        { label:'LTL Freight',  data:L, borderColor:'#8b5cf6', tension:0.4, pointRadius:3 },
        { label:'3PL + Labor',  data:T, borderColor:'#10b981', tension:0.4, pointRadius:3, borderDash:[4,3] },
      ]
    },
    options:{ ...BASE_OPTS }
  });

  const latestKey = last6[last6.length - 1];
  const lExp = expMap[latestKey] || {};
  const invoices = [
    ['Latest', 'C&N Pool Management', 'Product Cost', 'Indiana', f$(lExp.product||0), '—', 'badge-bg Actual'],
    ['Latest', 'UPS', 'Shipping', 'All Locations', f$(lExp.shipping||0), '—', 'badge-bg Actual'],
    ['Latest', 'Freight Partners', 'LTL Freight', 'All Routes', f$(lExp.ltl||0), '—', 'badge-bg Actual'],
    ['Latest', '3PL Partners', '3PL + Labor', 'All Locations', f$(lExp.tpl||0), '—', 'badge-bg Actual'],
  ];
  document.getElementById('tbInvoices').innerHTML = invoices.map(r => {
    const [cls, stat] = r[6].split(' ');
    return `<tr>
      <td>${r[0]}</td><td class="bold">${r[1]}</td>
      <td>${badge('bb', r[2])}</td>
      <td class="muted">${r[3]}</td>
      <td class="bold">${r[4]}</td>
      <td class="muted">${r[5]}</td>
      <td>${badge(cls, stat)}</td>
    </tr>`;
  }).join('');
}

// ── Margins ───────────────────────────────────────────────────────────
function renderMargins() {
  if (!DB) return;
  const { skus, ups6, cogs6, last6, revMap } = DB;

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

  const locMap = {};
  for (const row of inventory) {
    const loc = row.location_name || 'Unknown';
    if (!locMap[loc]) locMap[loc] = { chl: 0, ab: 0, other: 0, type: row.location_type };
    const sku = (row.sku_code || '').toLowerCase();
    const name = (row.sku_name || '').toLowerCase();
    if (sku.includes('chlor') || name.includes('chlor')) locMap[loc].chl += Number(row.quantity_4pack) || 0;
    else if (sku.includes('acid') || name.includes('acid')) locMap[loc].ab += Number(row.quantity_4pack) || 0;
    else locMap[loc].other += Number(row.quantity_4pack) || 0;
  }

  const wosBadge = wos => badge(wos===0?'bx':wos<0.5?'br':wos<2?'ba':'bg', wos===0?'None':(wos<10?wos.toFixed(1):Math.round(wos))+' wks');
  const alertBadge = (chl, ab) => {
    if (chl < 50 || ab < 20)  return badge('br','Critical');
    if (chl < 150 || ab < 50) return badge('br','Very Low');
    if (chl < 300 || ab < 100)return badge('ba','Low');
    return badge('bg','OK');
  };

  const rows = Object.entries(locMap).sort((a,b) => (b[1].chl+b[1].ab) - (a[1].chl+a[1].ab));
  document.getElementById('tbInventory').innerHTML = rows.map(([loc, d]) => {
    const isOwned = (d.type || '').toLowerCase().includes('owned');
    return `<tr>
      <td class="bold">${loc}</td>
      <td>${badge(isOwned?'bb':'bp', isOwned?'Owned':'Partner')}</td>
      <td>${fN(d.chl)}</td><td>${wosBadge(0)}</td>
      <td>${fN(d.ab)}</td><td>${wosBadge(0)}</td>
      <td>${d.other||'&mdash;'}</td><td>${wosBadge(0)}</td>
      <td>${fN(d.chl+d.ab+d.other)}</td>
      <td>${alertBadge(d.chl, d.ab)}</td>
    </tr>`;
  }).join('');
}

// ════════════════════════════════════════════════════════════════════════
// DISPATCHER
// ════════════════════════════════════════════════════════════════════════
// Forecasting/Transfers removed — they now link out to the dedicated
// forecasting dashboard (see EXTERNAL_NAV above) instead of rendering
// hardcoded placeholder data. Insights (also hardcoded, never wired to
// real data) is left un-rendered for the same reason; the nav item will
// simply show an empty section until/unless it's rebuilt on real data.
const renderers = {
  pl: renderPL, revenue: renderRevenue, shipping: renderShipping,
  expenses: renderExpenses, margins: renderMargins, inventory: renderInventory,
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
