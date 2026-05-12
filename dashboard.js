
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// PASSWORD PROTECTION \u2014 change DASHBOARD_PASSWORD to update access
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
const DASHBOARD_PASSWORD = 'PoolReview2026';

function checkPW() {
  const val = document.getElementById('pw-input').value;
  if (val === DASHBOARD_PASSWORD) {
    sessionStorage.setItem('mv_auth', '1');
    document.getElementById('pw-gate').classList.add('hidden');
  } else {
    document.getElementById('pw-err').textContent = 'Incorrect password. Please try again.';
    document.getElementById('pw-input').value = '';
    document.getElementById('pw-input').focus();
  }
}
document.getElementById('pw-input').addEventListener('keydown', e => { if (e.key === 'Enter') checkPW(); });
if (sessionStorage.getItem('mv_auth') === '1') {
  document.getElementById('pw-gate').classList.add('hidden');
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// NAVIGATION
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
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

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// CHART HELPERS
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
const CC = {}; // chart cache
function destroyChart(id) { if (CC[id]) { CC[id].destroy(); delete CC[id]; } }

const GRID = { color: 'rgba(226,232,240,0.9)' };
const TICK = { color: '#94a3b8', font: { size: 11 } };
const LEG  = { color: '#475569', font: { size: 11 } };

const BASE_OPTS = {
  responsive: true,
  plugins: { legend: { labels: LEG } },
  scales: { x: { ticks: TICK, grid: GRID }, y: { ticks: TICK, grid: GRID } }
};

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#94a3b8'];

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// FORMAT HELPERS
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
const f$ = n => '$' + Math.abs(Math.round(n)).toLocaleString();
const fN = n => Math.round(n).toLocaleString();
const fp = (n, d=1) => n.toFixed(d) + '%';
const badge = (cls, txt) => `<span class="badge ${cls}">${txt}</span>`;
const colorVal = (v, t=0) => `style="color:var(--${v>t?'green':'red'})"`;

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// MOCK DATA
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// \u2500\u2500 ACTUAL DATA from Amazon Transaction Reports + Walmart \u2500\u2500
const MONTHS6  = ['Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26'];
const REV6     = [115242, 76153, 88764, 73405, 281212, 427054];  // Actual
const AMZFEES6 = [17502, 11745, 13641, 11340, 39534, 59203];     // Actual
// Cost items below are ESTIMATED or MISSING \u2014 flagged in table
const EXP6    = REV6.map((r,f,i) => r); // placeholder, net profit unavailable
const PROF6   = [null,null,null,null,null,null]; // Cannot compute without COGS

// Full 16-month actual revenue history
const ALL_MONTHS = ['Jan 25','Feb 25','Mar 25','Apr 25','May 25','Jun 25','Jul 25','Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26'];
const ALL_REV_MV = [14902,22785,31364,86115,246193,245183,178081,108217,89503,72237,33733,19467,19496,22362,57306,89733];
const ALL_REV_SK = [1200,1,0,0,0,25483,164759,156010,199475,144951,80643,56393,69173,51019,221870,334045];
const ALL_WALMART = [0,0,0,0,0,0,0,0,0,0,866,293,95,25,2037,3276];

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// SECTION RENDERERS
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

// \u2500\u2500 P&L \u2500\u2500
function renderPL() {
  destroyChart('cPL');
  CC['cPL'] = new Chart(document.getElementById('cPL'), {
    data: {
      labels: MONTHS6,
      datasets: [
        { type:'bar',  label:'Revenue (Actual)',      data:REV6,     backgroundColor:'rgba(37,99,235,0.65)',  borderRadius:4, order:2 },
        { type:'bar',  label:'Amazon Fees (Actual)',  data:AMZFEES6, backgroundColor:'rgba(220,38,38,0.45)', borderRadius:4, order:3 },
        { type:'line', label:'Net Profit (incomplete)', data:[null,null,null,null,null,null], borderColor:'#94a3b8', borderDash:[5,5], pointRadius:3, order:1 }
      ]
    },
    options: { ...BASE_OPTS, responsive:true }
  });

  destroyChart('cExpPie');
  CC['cExpPie'] = new Chart(document.getElementById('cExpPie'), {
    type:'doughnut',
    data: {
      labels:['Amazon Fees (Actual)','UPS (est)','FedEx (est)','Product Cost (missing)','Labor (missing)','LTL Freight (missing)','3PL Partners (missing)'],
      datasets:[{ data:[59203,18000,3000,0,0,0,0], backgroundColor:['#2563eb','#059669','#0369a1','#94a3b8','#94a3b8','#94a3b8','#94a3b8'], borderWidth:0, hoverOffset:6 }]
    },
    options:{ responsive:true, cutout:'60%',
      plugins:{ legend:{ position:'right', labels:{ ...LEG, boxWidth:12, padding:10 } } } }
  });

  // P&L table \u2014 actual revenue & Amazon fees; cost items flagged as estimated/missing
  const plRows = [
    // [month, revenue, amzFees, upsCost, fedexCost, cogs, labor, ltl, 3pl, other]
    ['Nov 2025', 115242, 17502],
    ['Dec 2025',  76153, 11745],
    ['Jan 2026',  88764, 13641],
    ['Feb 2026',  73405, 11340],
    ['Mar 2026', 281212, 39534],
    ['Apr 2026', 427054, 59203],
  ];
  const est = '<span class="badge ba" title="Estimated \u2014 ao source data">\u26A0 Est</span>';
  const miss = '<span class="badge br" title="Missing \u2014 data not provided">\u26A0 Missing</span>';
  const act  = (v) => `<span class="badge bg">\u2713 ${f$(v)}</span>`;
  document.getElementById('tbPL').innerHTML = plRows.map(r => `<tr>
    <td class="bold">${r[0]}</td>
    <td>${act(r[1])}</td>
    <td class="red">(${f$(r[2])})</td>
    <td>${est}</td><td>${est}</td>
    <td>${miss}</td><td>${miss}</td><td>${miss}</td><td>${miss}</td><td>${miss}</td>
    <td class="muted">\u2014</td>
    <td class="muted">\u2014</td>
  </tr>`).join('') + `<tr class="tr-total">
    <td>6-Mo Total</td>
    <td>${act(plRows.reduce((a,r)=>a+r[1],0))}</td>
    <td class="red">(${f$(plRows.reduce((a,r)=>a+r[2],0))})</td>
    <td colspan="9" class="muted">\u2014 cost data needed to complete P&L</td>
  </tr>`;
}

// \u2500\u2500 Revenue \u2500\u2500
function renderRevenue() {
  destroyChart('cRevMonth');
  CC['cRevMonth'] = new Chart(document.getElementById('cRevMonth'), {
    type:'bar',
    data:{
      labels: ALL_MONTHS,
      datasets:[
        { label:'MV Amazon', data:ALL_REV_MV, backgroundColor:'rgba(37,99,235,0.75)', borderRadius:4, stack:'s' },
        { label:'SK Amazon', data:ALL_REV_SK, backgroundColor:'rgba(37,99,235,0.35)', borderRadius:4, stack:'s' },
        { label:'Walmart',   data:ALL_WALMART, backgroundColor:'rgba(109,40,217,0.75)', borderRadius:4, stack:'s' }
      ]
    },
    options:{ ...BASE_OPTS, scales:{ x:{...BASE_OPTS.scales.x,stacked:true,ticks:TICK,grid:GRID}, y:{...BASE_OPTS.scales.y,stacked:true,ticks:TICK,grid:GRID} } }
  });

  destroyChart('cRevProduct');
  CC['cRevProduct'] = new Chart(document.getElementById('cRevProduct'), {
    type:'doughnut',
    data:{
      labels:['Chlorine 4-Pack','Acid Blue 4-Pack','Chlorine 2-Pack','Muriatic Acid 4-Pk','Other'],
      datasets:[{ data:[312202,82442,47805,13014,32493], backgroundColor:COLORS.slice(0,5), borderWidth:0, hoverOffset:6 }]
    },
    options:{ responsive:true, cutout:'60%',
      plugins:{ legend:{ position:'right', labels:{...LEG,boxWidth:12,padding:10} } } }
  });

  const skus = [
    ['AH-S7TS-KK6E','Chlorine','4-Pack','Amazon',10131,10131,500359,66047,434312,49.40],
    ['VV-XKIZ-UB3O','Acid Blue','4-Pack','Amazon',1949,1949,110722,16608,94114,56.81],
    ['VB-20KE-OK8O','Chlorine','2-Pack','Amazon',1893,1893,68763,10314,58449,36.32],
    ['4PackMuriaticAcid','Muriatic Acid','4-Pack','Amazon',137,137,13014,1952,11062,94.99],
    ['2PackMuriaticAcid','Muriatic Acid','2-Pack','Amazon',72,72,5039,756,4283,69.99],
    ['1PackMuriaticAcid','Muriatic Acid','1-Pack','Amazon',56,56,2631,395,2236,46.99],
    ['Walmart (all)','Chlorine','Various','Walmart',83,83,3853,486,3367,46.42],
  ];
  document.getElementById('tbRevSku').innerHTML = skus.map(r => `<tr>
    <td><code>${r[0]}</code></td>
    <td>${r[1]}</td><td>${r[2]}</td>
    <td>${badge(r[3]==='Amazon'?'bb':'bp', r[3])}</td>
    <td>${fN(r[4])}</td><td>${fN(r[5])}</td>
    <td class="bold">${f$(r[6])}</td>
    <td class="red">(${f$(r[7])})</td>
    <td class="green">${f$(r[8])}</td>
    <td>${f$(r[9])}</td>
  </tr>`).join('');
}

// \u2500\u2500 Shipping \u2500\u2500
function renderShipping() {
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
    ['Indiana (Hub)','Owned',4491,'$92,@66','$20.50','$1,820',621,'$28.90','42.3%'],
    ['Texas','Owned',1380,'$30,084','$21.80','$702',192,'$28.10','13.8%'],
    ['Nevada','Owned',971,'$24,673','$25.40','$480',164,'$30.20','11.3%'],
    ['N. Carolina','Partner',1181,'$22,321','$18.90','$520',0,'\u2014','10.3%'],
    ['California','Partner',960,'$23,136','$24.10','$380',0,'\u2014','10.6%'],
    ['Florida','Partner',654,'$12,357','$19.20','$143',0,'\u2014','5.8%'],
  ];
  document.getElementById('tbShipLoc').innerHTML = locs.map(r => `<tr>
    <td class="bold">${r[0]}</td>
    <td>${badge(r[1]==='Owned'?'bb':'bp', r[1])}</td>
    <td>${fN(r[2])}</td><td>${r[3]}</td><td>${r[4]}</td>
    <td class="red">${r[5]}</td>
    <td>${r[6]||'\u2014'}</td><td>${r[7]}</td><td class="muted">${r[8]}</td>
  </tr>`).join('');
}

// \u2500\u2500 Expenses \u2500\u2500
function renderExpenses() {
  destroyChart('cExpCat');
  CC['cExpCat'] = new Chart(document.getElementById('cExpCat'), {
    type:'doughnut',
    data:{
      labels:['Product Cost','UPS/FedEx','Amazon Fees','Labor','LTL Freight','3PL Partners','Packaging','Other'],
      datasets:[{ data:[161523,217405,66849,18000,9200,16200,5800,4183], backgroundColor:COLORS, borderWidth:0, hoverOffset:6 }]
    },
    options:{ responsive:true, cutout:'55%',
      plugins:{ legend:{ position:'right', labels:{...LEG,boxWidth:12,padding:8} } } }
  });

  destroyChart('cExpTrend');
  CC['cExpTrend'] = new Chart(document.getElementById('cExpTrend'), {
    type:'line',
    data:{
      labels:MONTHS6,
      datasets:[
        { label:'Product Cost', data:[52000,39200,40600,31300,107900,161523], borderColor:'#3b82f6', tension:0.4, pointRadius:3 },
        { label:'UPS / FedEx',  data:[65200,49400,50800,39200,135800,217405], borderColor:'#ef4444', tension:0.4, pointRadius:3 },
        { label:'Amazon Fees',  data:[20200,15200,15700,12100,41800,66849],   borderColor:'#f59e0b', tension:0.4, pointRadius:3 },
      ]
    },
    options:{ ...BASE_OPTS }
  });

  const invoices = [
    ['May 1','Supply Partner','Product Cost','Indiana','$54,820','May 8','badge-bg Paid'],
    ['May 1','VLS Warehouse','Labor + Facility','Indiana','$12,400','May 15','badge-bg Paid'],
    ['May 1','Carrollton Ops','Labor + Facility','Texas','$8,200','May 15','badge-bg Paid'],
    ['May 1','Nevada Pac','3PL Services','Nevada','$6,800','May 15','badge-bg Paid'],
    ['May 1','NC Partner','3PL Services','N. Carolina','$4,900','May 15','badge-bg Paid'],
    ['May 1','CA Partner','3PL Services','California','$3,600','May 15','badge-bg Paid'],
    ['May 1','FL Partner','3PL Services','Florida','$2,900','May 15','badge-bg Paid'],
    ['May 2','Central Transport','LTL Freight','IN \u2192 Nevada','$3,200','May 17','badge-ba Due'],
    ['May 5','Central Transport','LTL Freight','IN \u2192 NC','$2,800','May 20','badge-ba Due'],
    ['May 5','Box Vendor','Pre-Printed Boxes','Indiana','$4,200','Jun 4','badge-ba Due'],
    ['May 8','Supply Partner','Product Cost','Indiana','$52,100','May 15','badge-br Overdue'],
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

// \u2500\u2500 Margins \u2500\u2500
function renderMargins() {
  const skuData = [
    ['4PackMuriaticAcid','Muriatic Acid','4-Pack',137,13014,2601,3064,1952,650,4747,19.2,'bg'],
    ['VV-XKIZ-UB3O','Acid Blue','4-Pack',1949,110722,11875,47050,16608,5500,29689,13.6,'bg'],
    ['AH-S7TS-KK6E','Chlorine','4-Pack',10131,500359,42250,201410,66047,25000,165652,12.9,'bg'],
    ['2PackMuriaticAcid','Muriatic Acid','2-Pack',72,5039,692,1540,756,320,1731,8.5,'bg'],
    ['VB-20KE-OK8O','Chlorine','2-Pack',1893,68763,7875,37800,10314,4200,8574,7.3,'bg'],
    ['1PackMuriaticAcid','Muriatic Acid','1-Pack',56,2631,269,672,395,200,1095,5.9,'bg'],
    ['US-XBUL-G3LZ','Chlorine','1-Pack',42,1050,175,504,158,125,-912,-8.1,'br'],
  ];
  document.getElementById('tbMarginSku').innerHTML = skuData.map(r => `<tr>
    <td><code>${r[0]}</code></td>
    <td>${r[1]}</td><td>${r[2]}</td><td>${fN(r[3])}</td>
    <td>${f$(r[4])}</td><td>${f$(r[5])}</td><td>${f$(r[6])}</td>
    <td>${f$(r[7])}</td><td>${f$(r[8])}</td>
    <td ${colorVal(r[9])}>${r[9]>0?'':'-'}${f$(Math.abs(r[9]))}</td>
    <td>${badge(r[11], (r[10]>0?'+':'')+r[10].toFixed(1)+'%')}</td>
  </tr>`).join('');

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

// \u2500\u2500 Inventory \u2500\u2500
function renderInventory() {
  const rows = [
    ['Indiana (Hub)','Owned',1310,1.40,476,0.83,29.5,0.78,672],
    ['Texas','Owned',93,0.33,22,0.21,0,0,288],
    ['Nevada','Owned',53,0.21,23,0.21,0,0,192],
    ['N. Carolina','Partner',142,0.56,0,0,0,0,192],
    ['California','Partner',311,1.73,82,0.90,0,0,240],
    ['Florida','Partner',216,1.20,10,0.47,0,0,192],
  ];
  const wosBadge = wos => badge(wos===0?'bx':wos<0.5?'br':wos<2?'ba':'bg', wos===0?'None':wos.toFixed(2)+' wks');
  const alert = (chl, ab) => {
    if (chl < 0.5 || ab < 0.3) return badge('br','Critical');
    if (chl < 1 || ab < 0.75) return badge('br','Very Low');
    if (chl < 2 || ab < 1.5) return badge('ba','Low');
    return badge('bg','OK');
  };
  document.getElementById('tbInventory').innerHTML = rows.map(r => `<tr>
    <td class="bold">${r[0]}</td>
    <td>${badge(r[1]==='Owned'?'bb':'bp', r[1])}</td>
    <td>${fN(r[2])}</td><td>${wosBadge(r[3])}</td>
    <td>${fN(r[4])}</td><td>${wosBadge(r[5])}</td>
    <td>${r[6]||'\u2014'}</td><td>${wosBadge(r[7])}</td>
    <td>${fN(r[8])}</td>
    <td>${alert(r[3], r[5])}</td>
  </tr>`).join('');
}

// \u2500\u2500 Transfers \u2500\u2500
function renderTransfers() {
  const rows = [
    ['5/5','5/8','3 bd','Outbound','3PL - Indiana','3PL - N. Carolina',192,144,6,'Delivered','PRO 326164530'],
    ['5/5','5/12','5 bd','Outbound','3PL - Indiana','3PL - Nevada',192,96,6,'Shipped','PRO 325829794'],
    ['5/8','5/13','3 bd','Outbound','3PL - Indiana','MV - Texas',288,0,6,'Shipped','PRO 326164548'],
    ['5/11','5/11','\u2014','Inbound TL','Supplier','3PL - Indiana',1152,'\u2014',24,'Confirmed','Chlorine TL #1'],
    ['5/12','5/12','\u2014','Inbound TL','Supplier','3PL - Indiana','\u2014',1152,24,'Confirmed','Acid Blue TL'],
    ['5/14','5/14','\u2014','Inbound TL','Supplier','3PL - Indiana',1152,'\u2014',24,'Confirmed','Chlorine TL #2'],
    ['5/11','5/14','3 bd','Outbound','3PL - Indiana','MV - Texas',192,96,6,'Planned','Transfer 1'],
    ['5/12','5/14','2 bd','Outbound','3PL - Indiana','3PL - Florida',192,96,6,'Planned','Transfer 2'],
    ['5/12','5/15','3 bd','Outbound','3PL - Indiana','3PL - N. Carolina',192,96,6,'Planned','Transfer 3'],
    ['5/13','5/20','5 bd','Outbound','3PL - Indiana','3PL - California',288,0,6,'Planned','Transfer 4'],
    ['5/14','5/19','3 bd','Outbound','3PL - Indiana','MV - Texas',288,0,6,'Planned','Transfer 5'],
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

// \u2500\u2500 Forecasting \u2500\u2500
function renderForecasting() {
  const weeks = ['2/9','2/16','2/23','3/2','3/9','3/16','3/23','3/30','4/6','4/13','4/20','4/27','5/4','5/11','5/18','5/25','6/1','6/8','6/15','6/22'];
  const actual    = [420,380,450,890,1240,1560,1820,2100,2280,2028,2285,2823,2765,null,null,null,null,null,null,null];
  const projected = [null,null,null,null,null,null,null,null,null,null,null,null,2765,3400,4200,5600,7400,9800,13200,17000];

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
    ['Jun','$328,608',6133,'~$950,000','~85,000','~+189%','Projected'],
    ['Jul','$408,942',8754,'~$1,300,000','~75,000','~+757%','Projected'],
    ['Aug','$305,490',6427,'~$975,000','~55,000','~+766%','Projected'],
    ['Sep','$376,520',6737,'~$1,020,000','~51,000','~+657%','Projected'],
    ['Oct','$302,188',6005,'~$870,000','~44,000','~+632%','Projected'],
    ['Nov','$147,624',3232,'~$430,000','~14,000','~+333%','Projected'],
    ['Dec','$111,363',2075,'~$330,000','~10,000','~+382%','Projected'],
  ];
  document.getElementById('tbForecast').innerHTML = history.map(r => `<tr>
    <td class="bold">${r[0]}</td>
    <td class="muted">${r[1]||'\u2014'}</td><td class="muted">${fN(r[2])}</td>
    <td class="${r[6]==='Actual'?'bold':''}">${r[3]}</td>
    <td>${r[4]}</td>
    <td class="green">${r[5]}</td>
    <td>${badge(r[6]==='Actual'?'bg':'ba', r[6])}</td>
  </tr>`).join('');
}

// \u2500\u2500 Insights \u2500\u2500
function renderInsights() {
  const cards = [
    { type:'alert', tag:'Margin Risk \u2014 Immediate', title:'1-Pack Orders Are Likely Unprofitable',
      val:'-$3 to -$6 / order',
      body:'Shipping a single bottle costs ~$12. Product cost ~$4.17. Amazon fee ~15%. Packaging and labor push this SKU deep into negative margin. Recommend pricing analysis and possible delisting or price increase.' },
    { type:'alert', tag:'Cash Flow Risk', title:'Antifreeze Ties Up $3,948 at Net-7',
      val:'~350 wks of supply',
      body:'350 units \u00D7 $11.28 cost = $3,948 paid on Net-7 terms. Demand is ~1 unit/week. Won\'t sell through until winter. Capital could be deployed to Acid Blue \u2014 your highest-demand, supply-constrained product.' },
    { type:'warning', tag:'Revenue Leak \u2014 Quantified', title:'Saturday FedEx Premium Costs ~$4,800/Month',
      val:'~$4,800 / month',
      body:'~620 Saturday orders from Indiana ship FedEx at $28.90 avg vs. UPS weekday $21.10. That\'s $7.80 \u00D7 620 = $4,836/month in avoidable cost. Structural \u2014 needs mitigation strategy.' },
    { type:'warning', tag:'Unrecovered Loss', title:'UPS Damage Claims Not Being Filed',
      val:'~$4,200 est./month',
      body:'Transit damage is occurring but no systematic UPS claims process exists. Based on industry damage rates for liquid chemicals, estimated monthly unrecovered loss is $3,000\u2013$5,000. Need a tracking and filing workflow.' },
    { type:'opportunity', tag:'Biggest Revenue Lever', title:'Acid Blue Supply is the Binding Constraint',
      val:'$50K+/mo upside',
      body:'Acid Blue grew 51\u00D7 YoY in April. You\'re limited to 1 TL every other week (~574 units). At demand trajectory, you could sell 3 TLs/month. Unlocking supply is the single highest-impact revenue action available.' },
    { type:'opportunity', tag:'Expansion ROI', title:'Pennsylvania Facility Unlocks Northeast Volume',
      val:'~2,060+ units/mo',
      body:'NY+NJ alone = 4,000+ units historically from Indiana with long UPS zones (4-5 days). A PA facility reduces transit to 1-2 days for NY, NJ, CT, MA, RI, NH, VT, ME, DE, DC. Needs shipping cost model to quantify savings.' },
    { type:'opportunity', tag:'Year-Round Revenue', title:'B2B Commercial Accounts Offset Seasonality',
      val:'Nov\u2013Mar revenue gap',
      body:'Partner 3PL agreements run year-round but orders collapse in off-season. FL (0.68 AB/CL ratio) and TX (0.44) suggest year-round pool operators. Direct B2B outreach to aquatic centers, hotels, YMCAs removes Amazon fees and smooths revenue.' },
    { type:'info', tag:'Competitive Intelligence', title:'Spreetail Has Automated Repricing \u2014 You Don\'t',
      val:null,
      body:'Your primary competitor uses a real-time automated pricing engine. Manual pricing management means you\'re potentially leaving Buy Box wins on the table or over-discounting. A repricing tool is worth evaluating \u2014 particularly for your top 3 ASINs which drive 85%+ of revenue.' },
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

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// DISPATCHER \u2014 only render charts when section is visible
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
const renderers = {
  pl: renderPL, revenue: renderRevenue, shipping: renderShipping,
  expenses: renderExpenses, margins: renderMargins, inventory: renderInventory,
  transfers: renderTransfers, forecasting: renderForecasting, insights: renderInsights
};

function renderSection(id) {
  if (renderers[id]) renderers[id]();
}

// Initial render
renderPL();
renderInsights();
// Fix nav icon display
document.querySelectorAll('.nav-icon').forEach(el => {
  const fixes = {
    '\\u25C9':'◉','\\u2B21':'⬡','\\u25C8':'◈',
    '\\u25C7':'◇','\\u25A3':'▣','\\u21C4':'⇄','\\u25EC':'◬'
  };
  if (fixes[el.textContent]) el.textContent = fixes[el.textContent];
});
