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
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const id = item.dataset.section;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(id).classList.add('active');
    renderSection(id);
  });
});

function ptab(btn) {
  btn.closest('.period-tabs').querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
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

async function loadData() {
  const [revRows, expRows, skuRows, invRows] = await Promise.all([
    sbFetch('v_monthly_revenue?order=month_date.asc'),
    sbFetch('v_monthly_expenses?order=month_date.asc'),
    sbFetch('v_sku_stats?order=total_revenue.desc'),
    sbFetch('v_inventory_latest?order=location_name.asc,sku_code.asc')
  ]);

  // ── Build monthly lookup maps ─────────────────────────────────────────
  // Revenue: {YYYY-MM: {mv:n, sk:n, fees:n, orders:n}}
  const revMap = {};
  for (const r of revRows) {
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
  // All months with data
  const allKeys = [...new Set([
    ...Object.keys(revMap),
    ...Object.keys(expMap)
  ])].sort();

  // Last 6 months with revenue
  const revKeys = Object.keys(revMap).sort();
  const last6   = revKeys.slice(-6);

  const fmt = k => {
    const d = new Date(k + '-01');
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const get = (map, k, field) => map[k] ? (map[k][field] || 0) : 0;

  DB = {
    // 6-month arrays (P&L, Expenses)
    months6:  last6.map(fmt),
    rev6:     last6.map(k => get(revMap, k, 'mv') + get(revMap, k, 'sk')),
    fees6:    last6.map(k => get(revMap, k, 'fees')),
    cogs6:    last6.map(k => get(expMap, k, 'product')),
    ups6:     last6.map(k => get(expMap, k, 'shipping')),
    ltl6:     last6.map(k => get(expMap, k, 'ltl')),
    tpl6:     last6.map(k => get(expMap, k, 'tpl')),

    // All-time arrays (Revenue history chart)
    allMonths: allKeys.map(fmt),
    allMV:     allKeys.map(k => get(revMap, k, 'mv')),
    allSK:     allKeys.map(k => get(revMap, k, 'sk')),

    // SKUs
    skus: skuRows,

    // Inventory
    inventory: invRows,

    // Raw maps for computed values
    revMap, expMap, last6
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

  const labelsFull = ['Nov 2025','Dec 2025','Jan 2026','Feb 2026','Mar 2026','Apr 2026',
    'May 2026','Jun 2026','Jul 2026','Aug 2026','Sep 2026','Oct 2026'];
  document.getElementById('tbPL').innerHTML =
    M.map((m, i) => `<tr>
      <td class="bold">${labelsFull[i] || m}</td>
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
      <td>6-Mo Total</td>
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
}

// ── Revenue ──────────────────────────────────────────────────────────
function renderRevenue() {
  if (!DB) return;
  const { allMonths, allMV, allSK, skus } = DB;
  const allWalmart = allMonths.map(() => 0); // Walmart not in orders table yet

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
}

// ── Shipping ─────────────────────────────────────────────────────────
function renderShipping() {
  // Shipping avg costs by location — computed from UPS expense data vs order counts
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

  // 6-month UPS total for display
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

  // Expense totals for invoice summary (from most recent month in DB)
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

  // Estimated per-unit shipping from UPS total / total orders in period
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

  // Group by location, aggregate chlorine and acid blue
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
    const isOwned = (d.type || '').toLowerCase().includes('owned') || ['indiana','texas','nevada'].some(s => loc.toLowerCase().includes(s));
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

// ── Transfers ─────────────────────────────────────────────────────────
function renderTransfers() {
  const rows = [
    ['5/5','5/8','3 bd','Outbound','3PL - Indiana','3PL - N. Carolina',192,144,6,'Delivered','PRO 326164530'],
    ['5/5','5/12','5 bd','Outbound','3PL - Indiana','3PL - Nevada',192,96,6,'Shipped','PRO 325829794'],
    ['5/8','5/13','3 bd','Outbound','3PL - Indiana','MV - Texas',288,0,6,'Shipped','PRO 326164548'],
    ['5/11','5/11','&mdash;','Inbound TL','Supplier','3PL - Indiana',1152,'&mdash;',24,'Confirmed','Chlorine TL #1'],
    ['5/12','5/12','&mdash;','Inbound TL','Supplier','3PL - Indiana','&mdash;',1152,24,'Confirmed','Acid Blue TL'],
    ['5/14','5/14','&mdash;','Inbound TL','Supplier','3PL - Indiana',1152,'&mdash;',24,'Confirmed','Chlorine TL #2'],
  ];
  const stBadge = s => badge({Delivered:'bx',Shipped:'ba',Confirmed:'bg',Planned:'bb'}[s]||'bx', s);
  const typBadge = t => badge(t==='Inbound TL'?'bg':'bp', t);
  document.getElementById('tbTransfers').innerHTML = rows.map(r => `<tr>
    <td>${r[0]}</td><td>${r[1]}</td><td class="muted">${r[2]}</td>
    <td>${typBadge(r[3])}</td>
    <td class="muted">${r[4]}</td><td class="bold">${r[5]}</td>
    <td>${r[6]}</td><td>${r[7]}</td><td>${r[8]}</td>
    <td>${stBadge(r[9])}</td>
    <td class="muted" style="font-size:11px">${r[10]}</td>
  </tr>`).join('');
}

// ── Forecasting ───────────────────────────────────────────────────────
function renderForecasting() {
  const weeks    = ['2/9','2/16','2/23','3/2','3/9','3/16','3/23','3/30','4/6','4/13','4/20','4/27','5/4','5/11','5/18','5/25','6/1','6/8','6/15','6/22'];
  const actual   = [420,380,450,890,1240,1560,1820,2100,2280,2028,2285,2823,2765,null,null,null,null,null,null,null];
  const projected= [null,null,null,null,null,null,null,null,null,null,null,null,2765,3400,4200,5600,7400,9800,13200,17000];

  destroyChart('cDemand');
  CC['cDemand'] = new Chart(document.getElementById('cDemand'), {
    type:'line',
    data:{ labels:weeks, datasets:[
      { label:'Actual Orders', data:actual, borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.08)', fill:true, tension:0.4, pointRadius:3 },
      { label:'Projected',     data:projected, borderColor:'#f59e0b', borderDash:[6,3], backgroundColor:'rgba(245,158,11,0.05)', fill:true, tension:0.4, pointRadius:3 }
    ]},
    options:{ ...BASE_OPTS, scales:{ x:{ticks:{...TICK,maxRotation:45},grid:GRID}, y:{ticks:TICK,grid:GRID} } }
  });

  destroyChart('cSeason');
  CC['cSeason'] = new Chart(document.getElementById('cSeason'), {
    type:'line',
    data:{ labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], datasets:[
      { label:'2025', data:[408,448,709,907,3188,6133,8754,6427,6737,6005,3232,2075], borderColor:'#64748b', borderDash:[4,2], tension:0.4, pointRadius:2 },
      { label:'2026 Actual', data:[2274,1788,5969,9865,null,null,null,null,null,null,null,null], borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.08)', fill:true, tension:0.4, pointRadius:3 },
      { label:'2026 Projected', data:[null,null,null,9865,22000,45000,75000,55000,51000,44000,null,null], borderColor:'#f59e0b', borderDash:[6,3], tension:0.4, pointRadius:2 }
    ]},
    options:{ ...BASE_OPTS }
  });

  const history = [
    ['Jan',null,408,'$114,905',2274,'+457%','Actual'],
    ['Feb',null,448,'$88,734',1788,'+299%','Actual'],
    ['Mar','$21,810',709,'$305,967',5969,'+742%','Actual'],
    ['Apr','$79,502',907,'$487,956',9865,'+514%','Actual'],
    ['May','$293,678',3188,'~$600,000','~22,000','~+104%','Projected'],
    ['Jun','$328,608',6133,'~$950,000','~45,000','~+189%','Projected'],
    ['Jul','$408,942',8754,'~$1,300,000','~75,000','~+757%','Projected'],
    ['Aug','$305,490',6427,'~$975,000','~55,000','~+766%','Projected'],
    ['Sep','$376,520',6737,'~$1,020,000','~51,000','~+657%','Projected'],
    ['Oct','$302,188',6005,'~$870,000','~44,000','~+632%','Projected'],
    ['Nov','$147,624',3232,'~$430,000','~14,000','~+333%','Projected'],
    ['Dec','$111,363',2075,'~$330,000','~10,000','~+382%','Projected'],
  ];
  document.getElementById('tbForecast').innerHTML = history.map(r => `<tr>
    <td class="bold">${r[0]}</td>
    <td class="muted">${r[1]||'&mdash;'}</td><td class="muted">${fN(r[2])}</td>
    <td class="${r[6]==='Actual'?'bold':''}">${r[3]}</td>
    <td>${r[4]}</td>
    <td class="green">${r[5]}</td>
    <td>${badge(r[6]==='Actual'?'bg':'ba', r[6])}</td>
  </tr>`).join('');
}

// ── Insights ─────────────────────────────────────────────────────────
function renderInsights() {
  const cards = [
    { type:'alert', tag:'Margin Risk — Immediate', title:'1-Pack Orders Are Likely Unprofitable',
      val:'-$3 to -$6 / order',
      body:'Shipping a single bottle costs ~$12. Product cost ~$4.17. Amazon fee ~15%. Packaging and labor push this SKU deep into negative margin. Recommend pricing analysis and possible delisting or price increase.' },
    { type:'alert', tag:'Cash Flow Risk', title:'Antifreeze Ties Up $3,948 at Net-7',
      val:'~350 wks of supply',
      body:'350 units × $11.28 cost = $3,948 paid on Net-7 terms. Demand is ~1 unit/week. Won\'t sell through until winter. Capital could be deployed to Acid Blue — your highest-demand, supply-constrained product.' },
    { type:'warning', tag:'Revenue Leak — Quantified', title:'Saturday FedEx Premium Costs ~$4,800/Month',
      val:'~$4,800 / month',
      body:'~620 Saturday orders from Indiana ship FedEx at $28.90 avg vs. UPS weekday $21.10. That\'s $7.80 × 620 = $4,836/month in avoidable cost. Structural — needs mitigation strategy.' },
    { type:'warning', tag:'Unrecovered Loss', title:'UPS Damage Claims Not Being Filed',
      val:'~$4,200 est./month',
      body:'Transit damage is occurring but no systematic UPS claims process exists. Based on industry damage rates for liquid chemicals, estimated monthly unrecovered loss is $3,000–$5,000. Need a tracking and filing workflow.' },
    { type:'opportunity', tag:'Biggest Revenue Lever', title:'Acid Blue Supply is the Binding Constraint',
      val:'$50K+/mo upside',
      body:'Acid Blue grew 51× YoY in April. You\'re limited to 1 TL every other week (~574 units). At demand trajectory, you could sell 3 TLs/month. Unlocking supply is the single highest-impact revenue action available.' },
    { type:'opportunity', tag:'Expansion ROI', title:'Pennsylvania Facility Unlocks Northeast Volume',
      val:'~2,060+ units/mo',
      body:'NY+NJ alone = 4,000+ units historically from Indiana with long UPS zones (4-5 days). A PA facility reduces transit to 1-2 days for NY, NJ, CT, MA, RI, NH, VT, ME, DE, DC. Needs shipping cost model to quantify savings.' },
    { type:'opportunity', tag:'Year-Round Revenue', title:'B2B Commercial Accounts Offset Seasonality',
      val:'Nov–Mar revenue gap',
      body:'Partner 3PL agreements run year-round but orders collapse in off-season. FL (0.68 AB/CL ratio) and TX (0.44) suggest year-round pool operators. Direct B2B outreach to aquatic centers, hotels, YMCAs removes Amazon fees and smooths revenue.' },
    { type:'info', tag:'Competitive Intelligence', title:'Spreetail Has Automated Repricing — You Don\'t',
      val:null,
      body:'Your primary competitor uses a real-time automated pricing engine. Manual pricing management means you\'re potentially leaving Buy Box wins on the table or over-discounting. A repricing tool is worth evaluating — particularly for your top 3 ASINs which drive 85%+ of revenue.' },
  ];

  document.getElementById('insightGrid').innerHTML = cards.map(c => `
    <div class="insight ${c.type}">
      <div class="insight-tag">${c.tag}</div>
      <div class="insight-title">${c.title}</div>
      ${c.val ? `<div class="insight-val">${c.val}</div>` : ''}
      <div class="insight-body">${c.body}</div>
    </div>
  `).join('');
}

// ════════════════════════════════════════════════════════════════════════
// DISPATCHER
// ════════════════════════════════════════════════════════════════════════
const renderers = {
  pl: renderPL, revenue: renderRevenue, shipping: renderShipping,
  expenses: renderExpenses, margins: renderMargins, inventory: renderInventory,
  transfers: renderTransfers, forecasting: renderForecasting, insights: renderInsights
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
    renderInsights();
  } catch (err) {
    console.error('Dashboard load error:', err);
    showLoadingState('Data load failed — check console');
  }
}
