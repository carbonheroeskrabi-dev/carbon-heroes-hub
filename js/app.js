/* ============================================================
   Carbon Heroes Hub — application logic
   ============================================================ */

/* ---------- โหลด Chart.js แบบมี Promise รอผลชัดเจน (กันปัญหา race condition
   ที่ CDN โหลดช้า/ถูกบล็อก แล้วโค้ดวาดกราฟรันไปก่อนที่ไลบรารีจะพร้อม) ---------- */
let chartLibPromise = null;
function loadScriptOnce_(url){
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error('load failed: ' + url));
    document.head.appendChild(s);
  });
}
function ensureChartLib(){
  if(typeof Chart !== 'undefined') return Promise.resolve(true);
  if(chartLibPromise) return chartLibPromise;
  const urls = [
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
  ];
  chartLibPromise = urls.reduce((p, url) => p.catch(() => loadScriptOnce_(url)), Promise.reject())
    .then(() => true)
    .catch(() => false);
  return chartLibPromise;
}

/* ---------- Icons ---------- */
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M4 10h16M4 10L12 3l8 7M6 10v11M18 10v11M10 10v11M14 10v11"/></svg>',
  carbon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12a4 4 0 118 0 4 4 0 01-8 0z"/></svg>',
  leaderboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M17 6h3a2 2 0 01-2 3.5M7 6H4a2 2 0 002 3.5"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l10 5 10-5M12 9v11M2 4v11l10 5 10-5V4"/></svg>',
  market: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2l1.5 5M18 2l-1.5 5M3 7h18l-1.5 11a2 2 0 01-2 2H6.5a2 2 0 01-2-2L3 7z"/><path d="M9 11v4M15 11v4"/></svg>',
  sroi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>',
  esg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6M9 9h1"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 2.5 17 2.5S17 12 11 20z"/><path d="M11 20A7 7 0 015 8"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1 1-1.8 3-1.8s3 .8 3 1.8-1 1.5-3 1.8-3 1-3 2 1 1.7 3 1.7 3-.7 3-1.7"/></svg>',
  scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 7l-3 6a3 3 0 006 0zM19 7l-3 6a3 3 0 006 0zM5 7h14M8 3h8"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
};

/* ---------- Derived data ---------- */
const ROUND_LABELS = {
  round1: 'ครั้งที่ 1 (พ.ย.68)',
  round2: 'ครั้งที่ 2 (ม.ค.69)',
  round3: 'ครั้งที่ 3 (มี.ค.69)',
  round4: 'ครั้งที่ 4 (พ.ค.69)',
};

function buildModel(data){
  const flat = [];
  Object.entries(data.transactions).forEach(([roundKey, rows]) => {
    rows.forEach(r => flat.push({...r, round: roundKey}));
  });

  const official = data.official || null;
  const excludedCodes = new Set((official && official.excludedMemberCodes) || []);

  const totalCarbonTx = flat.reduce((s,r)=>s+(typeof r.carbon==='number'?r.carbon:0),0);
  /* ใช้ตัวเลขทางการจาก Backend (คำนวณจากชีตสรุปที่ถูกต้อง) ถ้ามี — ไม่งั้น fallback
     เป็นการรวมจากรายการธุรกรรมดิบ (อาจไม่ตรงกับตัวเลขที่ทีมงานยืนยันเป๊ะ) */
  const totalWeight = official ? official.totalWaste : flat.reduce((s,r)=>s+(r.weight||0),0);
  const totalRevenue = official ? official.totalRevenue : flat.reduce((s,r)=>s+(r.total||0),0);
  const totalCarbonAll = official ? official.totalCarbon
    : ((data.summaries.carbon_total||[]).find(c=>c.activity==='รวม')?.carbon || totalCarbonTx);
  const memberSet = new Set(flat.map(r=>r.code).filter(Boolean));

  const byType = {};
  flat.forEach(r=>{
    if(!r.type) return;
    byType[r.type] = byType[r.type] || {weight:0, revenue:0, carbon:0, count:0};
    byType[r.type].weight += r.weight||0;
    byType[r.type].revenue += r.total||0;
    byType[r.type].carbon += (typeof r.carbon==='number'?r.carbon:0);
    byType[r.type].count += 1;
  });

  /* จัดกลุ่มขยะเป็น 7 หมวดตามเกณฑ์ LESS ของ อบก. — ใช้ตัวเลขทางการจาก Backend
     (รวม Kick-off + ทุกรอบสรุปยอดขายจริงแล้ว) ถ้ามี ไม่งั้น fallback เป็นการจับกลุ่ม
     จากรายการธุรกรรมดิบด้วยค่า EF (จะไม่รวม Kick-off เพราะไม่มีรายการธุรกรรมของมัน) */
  const byCategory = {};
  CATEGORY_ORDER.forEach(cat => { byCategory[cat] = {weight:0, revenue:0, carbon:0, count:0}; });
  if(official && official.categoryTotals){
    Object.entries(official.categoryTotals).forEach(([cat, weight])=>{
      byCategory[cat] = byCategory[cat] || {weight:0, revenue:0, carbon:0, count:0};
      byCategory[cat].weight = weight;
    });
  } else {
    byCategory['อื่นๆ'] = {weight:0, revenue:0, carbon:0, count:0};
    flat.forEach(r=>{
      if(!r.type) return;
      const cat = categoryForType(r.type, data.ef);
      byCategory[cat] = byCategory[cat] || {weight:0, revenue:0, carbon:0, count:0};
      byCategory[cat].weight += r.weight||0;
      byCategory[cat].revenue += r.total||0;
      byCategory[cat].carbon += (typeof r.carbon==='number'?r.carbon:0);
      byCategory[cat].count += 1;
    });
    if(byCategory['อื่นๆ'].count === 0) delete byCategory['อื่นๆ'];
  }

  /* byRound: ข้อมูลดิบรายรอบรับฝากขยะทุกรอบ (สำหรับตารางสรุปปฏิบัติการ — จำนวน
     รายการ/น้ำหนัก/มูลค่า/คาร์บอนตามที่บันทึกจริง ไม่ผ่านการตรวจสอบยืนยัน) */
  const byRound = Object.entries(data.transactions).map(([key,rows])=>({
    key, label: ROUND_LABELS[key]||key,
    weight: rows.reduce((s,r)=>s+(r.weight||0),0),
    revenue: rows.reduce((s,r)=>s+(r.total||0),0),
    carbon: rows.reduce((s,r)=>s+(typeof r.carbon==='number'?r.carbon:0),0),
    count: rows.length,
  }));

  /* byActivity: คาร์บอนที่ลดได้ต่อ "กิจกรรม" แบบทางการ — Kick-off + ทุกรอบสรุป
     ยอดขายจริงที่ตรวจสอบยืนยันแล้ว ผลรวมตรงกับ totalCarbonAll เป๊ะ ใช้กับกราฟ
     "คาร์บอนที่ลดได้ต่อรอบกิจกรรม" โดยเฉพาะ (คนละชุดกับ byRound ที่เป็นข้อมูลดิบ) */
  const byActivity = (official && official.byActivity) ? official.byActivity : byRound;

  /* member wallet (80% payout accumulated) from transactions */
  const walletByCode = {};
  flat.forEach(r=>{
    if(!r.code) return;
    walletByCode[r.code] = (walletByCode[r.code]||0) + (r.pay80||0);
  });

  const members = (data.members||[])
    .filter(m => !excludedCodes.has(m.code)) /* ตัดกองกลาง/ทีมชั่งหน้างานออกจากรายชื่อสมาชิกรายคน */
    .map(m=>({
      ...m,
      wallet: Math.round((walletByCode[m.code]||0)*100)/100,
      tier: tierOf(m.carbon),
    })).sort((a,b)=>b.carbon-a.carbon);

  const kickoffStats = (official && official.byActivity && official.byActivity[0] && official.byActivity[0].key === 'kickoff')
    ? {
        weight: official.byActivity[0].waste,
        carbon: official.byActivity[0].carbon,
        revenue: official.byActivity[0].revenue,
        count: official.byActivity[0].count,
      }
    : null;

  return {flat, totalWeight, totalRevenue, totalCarbonTx, totalCarbonAll, memberCount: (official?official.memberCount:memberSet.size), byType, byCategory, byRound, byActivity, kickoffStats, routineWeight: official?official.routineWeight:null, memberWeight: official?official.memberWeight:null, members};
}

/* ---------- จัดหมวด 7 ประเภทขยะตามเกณฑ์ LESS (อบก.) โดยใช้ค่า EF จับกลุ่ม ---------- */
const CATEGORY_ORDER = ['กระดาษ','กล่อง UHT','พลาสติก','อะลูมิเนียม','เหล็ก','โลหะผสม','แก้ว'];
const CATEGORY_EF_CLUSTERS = [
  {ef: 5.6735,   name: 'กระดาษ'},
  {ef: 4.255125, name: 'กล่อง UHT'},
  {ef: 1.031,    name: 'พลาสติก'},
  {ef: 9.127,    name: 'อะลูมิเนียม'},
  {ef: 1.832,    name: 'เหล็ก'},
  {ef: 4.391,    name: 'โลหะผสม'},
  {ef: 0.276,    name: 'แก้ว'},
  {ef: 2.2,      name: 'แก้ว'},
  {ef: 4.89,     name: 'แก้ว'},
];
function categoryForType(typeName, efMap){
  const efVal = efMap && efMap[typeName];
  if(efVal == null) return 'อื่นๆ';
  const match = CATEGORY_EF_CLUSTERS.find(c => Math.abs(c.ef - efVal) < 0.0005);
  return match ? match.name : 'อื่นๆ';
}

function tierOf(carbon){
  if(carbon>=400) return {name:'แพลทินัม', cls:'platinum'};
  if(carbon>=150) return {name:'ทอง', cls:'gold'};
  if(carbon>=50) return {name:'เงิน', cls:'silver'};
  return {name:'บรอนซ์', cls:'bronze'};
}

function fmt(n, d=1){
  if(n===null||n===undefined||isNaN(n)) return '-';
  return Number(n).toLocaleString('th-TH', {minimumFractionDigits:0, maximumFractionDigits:d});
}
function baht(n){ return '฿'+fmt(n,2); }

/* ---------- Global state (filled after fetching from API) ---------- */
let CH_DATA = null;
let MODEL = null;

/* ---------- Navigation ---------- */
const NAV = [
  {id:'dashboard', label:'แดชบอร์ด', icon:'dashboard'},
  {id:'bank', label:'ธนาคารขยะ', icon:'bank'},
  {id:'carbon', label:'คาร์บอน & LESS', icon:'carbon'},
  {id:'leaderboard', label:'ผู้นำคาร์บอน', icon:'leaderboard'},
  {id:'learn', label:'ศูนย์เรียนรู้', icon:'learn'},
  {id:'market', label:'ตลาดสีเขียว', icon:'market'},
  {id:'sroi', label:'SROI', icon:'sroi'},
  {id:'esg', label:'รายงาน ESG', icon:'esg'},
];

function renderRail(){
  const html = NAV.map(n=>`
    <button class="rail-btn" data-view="${n.id}" title="${n.label}">
      ${ICONS[n.icon]}<span>${n.label}</span>
    </button>`).join('');
  document.getElementById('rail').innerHTML =
    `<div class="rail-logo">${ICONS.leaf}</div>` + html;
  document.getElementById('railMobile').innerHTML = html;
}

function setActiveView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  document.querySelectorAll('.rail-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.view===id);
  });
  location.hash = id;
  window.scrollTo({top:0, behavior:'smooth'});
}

function wireNav(){
  document.querySelectorAll('.rail-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      const id = b.dataset.view;
      renderView(id, true);
      setActiveView(id);
    });
  });
}

const RENDERED = new Set();
function renderView(id, forceIfDirty){
  if(!MODEL) return; /* ยังโหลดข้อมูลไม่เสร็จ */
  if(RENDERED.has(id) && !forceIfDirty) return;
  if(RENDERED.has(id) && forceIfDirty && id!=='bank') return; /* bank อาจต้องรีเฟรชหลังเพิ่มรายการ */
  RENDERED.add(id);
  ({
    dashboard: renderDashboard,
    bank: renderBank,
    carbon: renderCarbon,
    leaderboard: renderLeaderboard,
    learn: renderLearn,
    market: renderMarket,
    sroi: renderSroi,
    esg: renderEsg,
  })[id]();
}

function invalidateAll(){ RENDERED.clear(); }

/* ============================================================
   DASHBOARD
   ============================================================ */
async function renderDashboard(){
  const el = document.getElementById('view-dashboard');
  el.innerHTML = `
    <div class="grid g-4" style="margin-bottom:20px">
      <div class="stat-card leaf">
        <div class="stat-icon">${ICONS.scale}</div>
        <div class="stat-val">${fmt(MODEL.totalWeight)} <small style="font-size:13px">กก.</small></div>
        <div class="stat-label">ปริมาณขยะรีไซเคิลสะสม</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-icon">${ICONS.coin}</div>
        <div class="stat-val">${baht(MODEL.totalRevenue)}</div>
        <div class="stat-label">ยอดขายขยะสะสม</div>
      </div>
      <div class="stat-card forest">
        <div class="stat-icon">${ICONS.leaf}</div>
        <div class="stat-val">${fmt(MODEL.totalCarbonAll)} <small style="font-size:13px">kgCO₂e</small></div>
        <div class="stat-label">คาร์บอนที่ลดได้จริงทั้งโครงการ</div>
      </div>
      <div class="stat-card sun">
        <div class="stat-icon">${ICONS.users}</div>
        <div class="stat-val">${MODEL.members.length}</div>
        <div class="stat-label">Carbon Heroes (สมาชิก)</div>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <h3>ปริมาณขยะแยกตาม 7 หมวด LESS (กก.)</h3>
        <div class="chart-wrap"><canvas id="chartByType"></canvas></div>
      </div>
      <div class="card">
        <h3>คาร์บอนที่ลดได้ต่อรอบการจำหน่ายให้คู่ค้า (kgCO₂e)</h3>
        <div class="chart-wrap"><canvas id="chartByRound"></canvas></div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;max-width:520px;margin-left:auto;margin-right:auto">
      <h3>สัดส่วนน้ำหนักขยะ: รูทีน vs รับฝาก/รายบุคคล (รวมทุกรอบการจำหน่าย)</h3>
      <div class="chart-wrap" style="height:300px"><canvas id="chartRoutineSplit"></canvas></div>
    </div>

    <div class="note-box" style="margin-top:16px">
      💡 ข้อมูลบนแดชบอร์ดนี้รวมทั้งกิจกรรม Kick-off ECO WIN-WIN และรอบการจำหน่ายให้คู่ค้าที่ตรวจสอบยืนยันแล้วทุกรอบ คำนวณค่าคาร์บอนที่ลดได้ตามเกณฑ์ LESS (TGO) — พร้อมขยายผลเชื่อมต่อระบบจริงของ กฟผ. ในอนาคต
    </div>
  `;

  const categoryEntries = Object.entries(MODEL.byCategory);
  const hasChart = await ensureChartLib();
  if(hasChart){
    try{
      new Chart(document.getElementById('chartByType'), {
        type:'bar',
        data:{
          labels: categoryEntries.map(e=>e[0]),
          datasets:[{label:'น้ำหนัก (กก.)', data:categoryEntries.map(e=>e[1].weight), backgroundColor:'#2F9E6E', borderRadius:6}]
        },
        options:{plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}, maintainAspectRatio:false}
      });

      new Chart(document.getElementById('chartByRound'), {
        type:'line',
        data:{
          labels: MODEL.byActivity.map(r=>r.label.replace('ครั้งที่ ','#')),
          datasets:[{label:'kgCO₂e', data: MODEL.byActivity.map(r=>r.carbon), borderColor:'#F5C542', backgroundColor:'rgba(245,197,66,.25)', tension:.35, fill:true, pointBackgroundColor:'#0D3D2E'}]
        },
        options:{plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}, maintainAspectRatio:false}
      });

      if(MODEL.routineWeight!=null && MODEL.memberWeight!=null){
        new Chart(document.getElementById('chartRoutineSplit'), {
          type:'pie',
          data:{
            labels:[`ขยะรูทีน (${fmt(MODEL.routineWeight)} กก.)`, `ขยะรับฝาก/รายบุคคล (${fmt(MODEL.memberWeight)} กก.)`],
            datasets:[{data:[MODEL.routineWeight, MODEL.memberWeight], backgroundColor:['#F5C542','#2F9E6E']}]
          },
          options:{plugins:{legend:{position:'bottom'}}, maintainAspectRatio:false}
        });
      }
    }catch(chartErr){
      showChartFallback();
    }
  } else {
    showChartFallback();
  }

  function showChartFallback(){
    /* เครือข่ายบางแห่งบล็อกการโหลด Chart.js จาก CDN — แสดงตารางแทนกราฟโดยไม่ทำให้แอปพัง */
    ['chartByType','chartByRound','chartRoutineSplit'].forEach(id=>{
      const c = document.getElementById(id);
      if(c) c.replaceWith(Object.assign(document.createElement('div'), {
        className:'empty-state',
        textContent:'ไม่สามารถโหลดไลบรารีกราฟได้ (เครือข่ายอาจบล็อก) — ข้อมูลยังถูกต้องตามตารางด้านล่าง',
      }));
    });
  }
}

/* ============================================================
   DIGITAL WASTE BANK
   ============================================================ */
function renderBank(){
  const el = document.getElementById('view-bank');
  const efOptions = Object.keys(CH_DATA.ef).sort((a,b)=>a.localeCompare(b,'th'));
  el.innerHTML = `
    <h2 style="margin-bottom:6px">Digital Waste Bank — สมุดบัญชีธนาคารขยะดิจิทัล</h2>
    <p style="color:var(--ink-600);margin:0 0 16px;font-size:13.5px">ข้อมูลนี้อ่าน/เขียนตรงกับ Google Sheet ของโครงการแบบเรียลไทม์ผ่าน API</p>

    <div class="card" style="margin-bottom:18px">
      <h3>➕ เพิ่มรายการฝากขยะใหม่</h3>
      <div class="form-grid">
        <label>รอบกิจกรรม
          <select id="txRound">${Object.entries(ROUND_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
        </label>
        <label>รหัสสมาชิก
          <input id="txCode" placeholder="เช่น 591159 หรือ t04834">
        </label>
        <label>ชื่อสมาชิก
          <input id="txName" placeholder="กรอกอัตโนมัติเมื่อพบรหัส หรือกรอกเอง">
        </label>
        <label>ประเภทขยะ
          <input id="txType" list="efList" placeholder="เลือก/พิมพ์ประเภทขยะ">
          <datalist id="efList">${efOptions.map(t=>`<option value="${t}">`).join('')}</datalist>
        </label>
        <label>น้ำหนัก (กก.)
          <input id="txWeight" type="number" min="0" step="0.1">
        </label>
        <label>ราคาต่อหน่วย (บาท/กก.)
          <input id="txPrice" type="number" min="0" step="0.1">
          <span class="field-hint" id="txPriceHint"></span>
        </label>
      </div>
      <label style="display:flex;align-items:center;gap:7px;font-size:13px;margin-bottom:12px">
        <input type="checkbox" id="txConfirmed" style="width:auto" checked> ยืนยันน้ำหนักโดยตาชั่งคู่ค้าแล้ว
      </label>
      <button class="btn gold" id="txSubmit">💾 บันทึกรายการลง Google Sheet</button>
      <span id="txMsg" style="margin-left:10px;font-size:12.5px;color:var(--ink-600)"></span>
    </div>

    <div class="search-row">
      <input type="text" id="bankSearch" placeholder="ค้นหาชื่อ / รหัสสมาชิก / ประเภทขยะ" style="flex:1;min-width:220px">
      <select id="bankRound">
        <option value="">ทุกรอบกิจกรรม</option>
        ${Object.entries(ROUND_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}
      </select>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th>Transaction ID</th><th>สมาชิก</th><th>ประเภทขยะ</th><th>น้ำหนัก (กก.)</th><th>ราคา/หน่วย</th><th>ยอดขาย</th><th>คาร์บอน (kgCO₂e)</th><th>รอบ</th></tr></thead>
        <tbody id="bankTbody"></tbody>
      </table>
    </div>
    <div class="empty-state" id="bankEmpty" hidden>ไม่พบรายการที่ค้นหา</div>
  `;

  document.getElementById('txCode').addEventListener('change', async function(){
    const code = this.value.trim();
    if(!code) return;
    const m = await apiGet('findMember', {code});
    if(m) document.getElementById('txName').value = m.name;
  });
  document.getElementById('txType').addEventListener('change', function(){
    const t = this.value.trim();
    const hint = document.getElementById('txPriceHint');
    hint.textContent = '';
    if(CH_DATA.price[t]!=null){
      document.getElementById('txPrice').value = CH_DATA.price[t];
      hint.textContent = `ราคาล่าสุดของ "${t}": ${baht(CH_DATA.price[t])}/กก.`;
    }
    if(CH_DATA.ef[t]!=null) hint.textContent += ` · EF: ${CH_DATA.ef[t]} kgCO₂e/kg`;
  });
  document.getElementById('txSubmit').addEventListener('click', async function(){
    const btn = this;
    const payload = {
      code: document.getElementById('txCode').value.trim(),
      name: document.getElementById('txName').value.trim(),
      type: document.getElementById('txType').value.trim(),
      weight: parseFloat(document.getElementById('txWeight').value),
      price: parseFloat(document.getElementById('txPrice').value),
      confirmed: document.getElementById('txConfirmed').checked,
    };
    const round = document.getElementById('txRound').value;
    const msg = document.getElementById('txMsg');
    if(!payload.code || !payload.name || !payload.type || !payload.weight || !payload.price){
      msg.textContent = '⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง'; msg.style.color = '#C6462B';
      return;
    }
    btn.disabled = true; msg.style.color = 'var(--ink-600)'; msg.textContent = 'กำลังบันทึก...';
    try{
      const record = await apiPost('addTransaction', {round, payload});
      if(record.error) throw new Error(record.error);
      btn.disabled = false; msg.style.color = 'var(--leaf-500)'; msg.textContent = `✅ บันทึก ${record.id} สำเร็จ`;
      CH_DATA.transactions[round].push(record);
      MODEL = buildModel(CH_DATA);
      invalidateAll();
      showToast('บันทึกรายการฝากขยะสำเร็จ 🎉');
      renderView('bank', true); setActiveView('bank');
    }catch(err){
      btn.disabled = false; msg.style.color = '#C6462B'; msg.textContent = '❌ ' + (err.message||err);
    }
  });

  function draw(){
    const q = document.getElementById('bankSearch').value.trim().toLowerCase();
    const round = document.getElementById('bankRound').value;
    let rows = MODEL.flat;
    if(round) rows = rows.filter(r=>r.round===round);
    if(q) rows = rows.filter(r =>
      (r.name||'').toLowerCase().includes(q) ||
      (r.code||'').toLowerCase().includes(q) ||
      (r.type||'').toLowerCase().includes(q)
    );
    rows = rows.slice(0, 300);
    document.getElementById('bankTbody').innerHTML = rows.map(r=>`
      <tr>
        <td>${r.id||'-'}</td>
        <td>${r.name||'-'}<br><span style="color:var(--ink-400);font-size:11px">${r.code||''}</span></td>
        <td>${r.type||'-'}</td>
        <td>${fmt(r.weight)}</td>
        <td>${r.price!=null?baht(r.price):'-'}</td>
        <td>${r.total!=null?baht(r.total):'-'}</td>
        <td>${typeof r.carbon==='number'?fmt(r.carbon,2):'-'}</td>
        <td>${ROUND_LABELS[r.round]||r.round}</td>
      </tr>`).join('');
    document.getElementById('bankEmpty').hidden = rows.length>0;
  }
  document.getElementById('bankSearch').addEventListener('input', draw);
  document.getElementById('bankRound').addEventListener('change', draw);
  draw();
}

/* ============================================================
   CARBON CREDIT & LESS
   ============================================================ */
function renderCarbon(){
  const el = document.getElementById('view-carbon');
  const efEntries = Object.entries(CH_DATA.ef).sort((a,b)=>a[0].localeCompare(b[0],'th'));

  el.innerHTML = `
    <h2 style="margin-bottom:6px">คาร์บอนเครดิต & โครงการ LESS</h2>
    <p style="color:var(--ink-600);margin:0 0 16px;font-size:13.5px">คำนวณคาร์บอนที่ลดได้ตามเกณฑ์ Low Emission Support Scheme (LESS) ขององค์การบริหารจัดการก๊าซเรือนกระจก (TGO)</p>

    <div class="note-box" style="margin-bottom:16px">
      <b>หลักการคำนวณ:</b> คาร์บอนที่ลดได้ (kgCO₂e) = น้ำหนักขยะรีไซเคิล (กก.) × ค่าสัมประสิทธิ์การปล่อยก๊าซเรือนกระจกที่ลดได้ (Emission Factor: EF, kgCO₂e/kg) อ้างอิงตามเกณฑ์โครงการ LESS ของ TGO ปริมาณคาร์บอนที่คำนวณได้นี้สามารถนำไปขึ้นทะเบียนขอการรับรองคาร์บอนเครดิตภาคประชาชนกับ TGO ได้ในอนาคต
    </div>

    <div class="formula-box" style="margin-bottom:20px">
      Carbon Reduced (kgCO₂e) = Weight (kg) × EF (kgCO₂e/kg)
    </div>

    <div class="grid g-3" style="margin-bottom:20px">
      ${CH_DATA.summaries.carbon_total.map(c=>`
        <div class="stat-card ${c.activity==='รวม'?'gold':'leaf'}">
          <div class="stat-icon">${ICONS.leaf}</div>
          <div class="stat-val">${fmt(c.carbon)}</div>
          <div class="stat-label">${c.activity} (kgCO₂e)</div>
        </div>`).join('')}
    </div>

    <div class="card">
      <h3>ค้นหาค่า Emission Factor (EF) ตามประเภทขยะ</h3>
      <input type="text" id="efSearch" placeholder="ค้นหาประเภทขยะ..." style="width:100%;max-width:360px;margin-bottom:12px">
      <div class="table-wrap">
        <table>
          <thead><tr><th>ประเภทขยะรีไซเคิล</th><th>EF (kgCO₂e/kg)</th><th>ราคารับซื้อโดยประมาณ (บาท/กก.)</th></tr></thead>
          <tbody id="efTbody"></tbody>
        </table>
      </div>
    </div>
  `;

  function draw(){
    const q = document.getElementById('efSearch').value.trim().toLowerCase();
    const rows = efEntries.filter(([name])=>name.toLowerCase().includes(q));
    document.getElementById('efTbody').innerHTML = rows.map(([name,ef])=>`
      <tr><td>${name}</td><td>${fmt(ef,3)}</td><td>${CH_DATA.price[name]!=null?baht(CH_DATA.price[name]):'-'}</td></tr>
    `).join('') || `<tr><td colspan="3" style="text-align:center;color:var(--ink-400)">ไม่พบข้อมูล</td></tr>`;
  }
  document.getElementById('efSearch').addEventListener('input', draw);
  draw();
}

/* ============================================================
   LEADERBOARD
   ============================================================ */
function renderLeaderboard(){
  const el = document.getElementById('view-leaderboard');
  el.innerHTML = `
    <h2 style="margin-bottom:6px">🏆 ผู้นำคาร์บอน (Leaderboard)</h2>
    <p style="color:var(--ink-600);margin:0 0 16px;font-size:13.5px">จัดอันดับ Carbon Heroes ตามปริมาณคาร์บอนที่ลดได้สะสม</p>

    <div class="grid g-4" style="margin-bottom:18px">
      ${['platinum','gold','silver','bronze'].map(cls=>{
        const label = {platinum:'แพลทินัม ≥400',gold:'ทอง ≥150',silver:'เงิน ≥50',bronze:'บรอนซ์ <50'}[cls];
        const count = MODEL.members.filter(m=>m.tier.cls===cls).length;
        return `<div class="stat-card"><div class="badge ${cls}" style="margin-bottom:8px">${label}</div><div class="stat-val">${count}</div><div class="stat-label">คน</div></div>`;
      }).join('')}
    </div>

    <div id="leaderList"></div>
  `;
  const list = document.getElementById('leaderList');
  list.innerHTML = MODEL.members.map((m,i)=>`
    <div class="leader-row">
      <div class="leader-rank ${i===0?'top1':''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
      <div class="leader-avatar">${(m.name||'?').trim().charAt(0)}</div>
      <div class="leader-info">
        <div class="name">${m.name} <span class="badge ${m.tier.cls}">${m.tier.name}</span></div>
        <div class="code">รหัสสมาชิก ${m.code}</div>
      </div>
      <div class="leader-val">${fmt(m.carbon)}<small>kgCO₂e</small></div>
    </div>
  `).join('');
}

/* ============================================================
   LEARNING CENTER
   ============================================================ */
const LEARN_TOPICS = [
  {icon:'leaf', title:'แยกขยะให้ถูกวิธี', body:'เริ่มต้นง่ายๆ ด้วยการแยกขยะ 4 ประเภทหลัก: รีไซเคิล เศษอาหาร ทั่วไป และอันตราย ล้างสิ่งปนเปื้อนก่อนทิ้งเพื่อเพิ่มมูลค่าขยะรีไซเคิล'},
  {icon:'carbon', title:'คาร์บอนฟุตพรินต์คืออะไร', body:'ปริมาณก๊าซเรือนกระจกที่ปล่อยจากกิจกรรมต่างๆ ของเรา วัดเป็นหน่วย kgCO₂e การรีไซเคิลขยะช่วยลดการปล่อยก๊าซเรือนกระจกจากกระบวนการผลิตใหม่'},
  {icon:'scale', title:'มูลค่าขยะแต่ละประเภท', body:'ขยะแต่ละชนิดมีราคารับซื้อและค่า EF ต่างกัน เช่น อะลูมิเนียมมีค่า EF สูงถึง 9.1 kgCO₂e/kg ขณะที่พลาสติก PET อยู่ที่ 1.03 kgCO₂e/kg'},
  {icon:'bank', title:'ธนาคารขยะทำงานอย่างไร', body:'สมาชิกนำขยะมาฝาก ชั่งน้ำหนัก บันทึกรายการ แล้วรับเงิน 80% ของยอดขายทันที ส่วนที่เหลือใช้บริหารความต่อเนื่องของโครงการ'},
  {icon:'sroi', title:'SROI คุณค่าทางสังคม', body:'Social Return on Investment วัดผลตอบแทนทางสังคม สิ่งแวดล้อม และเศรษฐกิจที่เกิดจากการลงทุนในโครงการ เทียบเป็นมูลค่าทางการเงิน'},
  {icon:'market', title:'เศรษฐกิจหมุนเวียน (Circular Economy)', body:'แนวคิดที่มุ่งใช้ทรัพยากรอย่างคุ้มค่าที่สุด ผ่านการลด ใช้ซ้ำ และรีไซเคิล เพื่อลดขยะและลดการใช้ทรัพยากรใหม่'},
];
const FAQS = [
  {q:'คาร์บอนเครดิตที่ได้จากโครงการนำไปทำอะไรได้บ้าง?', a:'สามารถนำไปขึ้นทะเบียนกับโครงการ LESS ของ TGO เพื่อขอการรับรอง และอาจนำไปซื้อขายในตลาดคาร์บอนภาคสมัครใจ หรือใช้รายงานผลด้าน ESG ขององค์กรได้'},
  {q:'สมาชิกได้รับเงินจากการฝากขยะอย่างไร?', a:'สมาชิกจะได้รับเงิน 80% ของยอดขายขยะทันทีหลังชั่งน้ำหนักและยืนยันรายการ ส่วนอีก 20% นำไปบริหารความต่อเนื่องของโครงการ เช่น ค่าตอบแทนทีมงานและค่าเครื่องชั่ง'},
  {q:'ค่า Emission Factor (EF) คืออะไร?', a:'คือค่าสัมประสิทธิ์ที่บอกว่าการรีไซเคิลขยะ 1 กิโลกรัมของประเภทนั้นๆ ช่วยลดการปล่อยก๊าซเรือนกระจกได้กี่กิโลกรัมคาร์บอนไดออกไซด์เทียบเท่า (kgCO₂e) เทียบกับการผลิตใหม่หรือฝังกลบ'},
];

function renderLearn(){
  const el = document.getElementById('view-learn');
  el.innerHTML = `
    <h2 style="margin-bottom:6px">ศูนย์เรียนรู้ Carbon Heroes</h2>
    <p style="color:var(--ink-600);margin:0 0 16px;font-size:13.5px">ความรู้พื้นฐานเรื่องขยะรีไซเคิล คาร์บอนเครดิต และความยั่งยืน</p>
    <div class="grid g-3" style="margin-bottom:24px">
      ${LEARN_TOPICS.map(t=>`
        <div class="learn-card">
          <div class="thumb">${ICONS[t.icon]}</div>
          <div class="body"><h4>${t.title}</h4><p>${t.body}</p></div>
        </div>`).join('')}
    </div>
    <div class="card">
      <h3>คำถามที่พบบ่อย</h3>
      ${FAQS.map(f=>`<details class="faq"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('')}
    </div>
  `;
}

/* ============================================================
   GREEN MARKETPLACE
   ============================================================ */
const MARKET_ITEMS = [
  {icon:'leaf', name:'ต้นกล้าไม้ยืนต้น', desc:'สนับสนุนพื้นที่สีเขียวชุมชน', price:20},
  {icon:'coin', name:'คูปองส่วนลดร้านค้าชุมชน 50 บาท', desc:'ใช้ได้ที่ร้านค้าเครือข่ายโครงการ', price:100},
  {icon:'scale', name:'ถังคัดแยกขยะประจำบ้าน', desc:'ชุดถังแยกขยะ 3 ช่อง', price:250},
  {icon:'market', name:'กระเป๋าผ้าลดโลกร้อน', desc:'ผลิตจากวัสดุรีไซเคิล', price:80},
  {icon:'sroi', name:'บัตรเข้าชมศูนย์เรียนรู้พลังงาน', desc:'ทัศนศึกษาโรงไฟฟ้ากระบี่', price:150},
  {icon:'bank', name:'สมทบกองทุนธนาคารขยะ', desc:'ต่อยอดโครงการเพื่อชุมชน', price:50},
];

function renderMarket(){
  const el = document.getElementById('view-market');
  const totalWallet = MODEL.members.reduce((s,m)=>s+m.wallet,0);
  el.innerHTML = `
    <div class="topbar" style="margin-bottom:16px">
      <div class="titles">
        <h2>ตลาดสีเขียว (Green Marketplace)</h2>
        <p style="color:var(--ink-600);font-size:13.5px;margin-top:2px">แลกคะแนนสะสมจากยอดขายขยะเป็นของรางวัลเพื่อชุมชนและสิ่งแวดล้อม</p>
      </div>
      <div class="wallet-chip">${ICONS.coin} ยอดสะสมสมาชิกรวม ${baht(totalWallet)}</div>
    </div>
    <div class="grid g-3" id="marketGrid"></div>
  `;
  document.getElementById('marketGrid').innerHTML = MARKET_ITEMS.map((it,i)=>`
    <div class="market-card">
      <div class="icon-wrap">${ICONS[it.icon]}</div>
      <div>
        <h4 style="font-size:14.5px;margin-bottom:3px;font-family:'Kanit'">${it.name}</h4>
        <p style="font-size:12.5px;color:var(--ink-600);margin:0">${it.desc}</p>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
        <span class="price">${baht(it.price)}</span>
        <button class="btn gold sm" data-idx="${i}">แลกรางวัล</button>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('#marketGrid button').forEach(b=>{
    b.addEventListener('click', async ()=>{
      const item = MARKET_ITEMS[b.dataset.idx];
      const code = window.prompt('กรอกรหัสสมาชิกเพื่อแลกรางวัล "'+item.name+'"');
      if(!code) return;
      b.disabled = true;
      try{
        await apiPost('redeemReward', {code: code.trim(), itemName: item.name, cost: item.price});
        b.disabled = false;
        showToast(`แลก "${item.name}" สำเร็จ 🎉`);
      }catch(err){
        b.disabled = false;
        showToast('❌ ผิดพลาด: '+(err.message||err));
      }
    });
  });
}

/* ============================================================
   SROI
   ============================================================ */
function renderSroi(){
  const el = document.getElementById('view-sroi');
  const revenue = MODEL.totalRevenue;
  const carbonValueEstimate = MODEL.totalCarbonAll * 0.3; // illustrative shadow price, บาท/kgCO2e
  const socialValue = revenue + carbonValueEstimate;
  const investment = 5381; // from spreadsheet: cost after deducting the scale purchase
  const sroiRatio = (socialValue / investment);

  el.innerHTML = `
    <h2 style="margin-bottom:6px">SROI — ผลตอบแทนทางสังคมจากการลงทุน</h2>
    <p style="color:var(--ink-600);margin:0 0 16px;font-size:13.5px">Social Return on Investment ของโครงการธนาคารขยะโรงไฟฟ้ากระบี่</p>

    <div class="note-box" style="margin-bottom:18px">
      SROI ประเมินมูลค่าทางสังคม สิ่งแวดล้อม และเศรษฐกิจ เทียบกับเงินลงทุนตั้งต้น สูตรคำนวณคือ<br>
      <b>SROI Ratio = มูลค่าผลลัพธ์ทางสังคมทั้งหมด ÷ มูลค่าการลงทุน</b><br>
      ตัวเลขด้านล่างเป็น <b>ตัวอย่างประมาณการ</b> เพื่อสาธิตแนวทางคำนวณ ควรปรับค่าพารามิเตอร์ให้เหมาะสมเมื่อใช้งานจริง
    </div>

    <div class="grid g-3" style="margin-bottom:18px">
      <div class="stat-card gold"><div class="stat-icon">${ICONS.coin}</div><div class="stat-val">${baht(revenue)}</div><div class="stat-label">มูลค่ายอดขายขยะ (Economic Value)</div></div>
      <div class="stat-card leaf"><div class="stat-icon">${ICONS.leaf}</div><div class="stat-val">${baht(carbonValueEstimate)}</div><div class="stat-label">มูลค่าคาร์บอนที่ลดได้ (โดยประมาณ)</div></div>
      <div class="stat-card forest"><div class="stat-icon">${ICONS.sroi}</div><div class="stat-val">${fmt(sroiRatio,2)} : 1</div><div class="stat-label">SROI Ratio โดยประมาณ</div></div>
    </div>

    <div class="card">
      <h3>องค์ประกอบมูลค่าทางสังคม</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>องค์ประกอบ</th><th>มูลค่า (บาท)</th><th>หมายเหตุ</th></tr></thead>
          <tbody>
            <tr><td>รายได้สมาชิกจากการขายขยะ (Economic)</td><td>${baht(revenue*0.8)}</td><td>80% ของยอดขายจ่ายคืนสมาชิก</td></tr>
            <tr><td>เงินทุนหมุนเวียนโครงการ (Sustainability)</td><td>${baht(revenue*0.2)}</td><td>20% บริหารความต่อเนื่อง</td></tr>
            <tr><td>มูลค่าคาร์บอนที่ลดได้ (Environmental)</td><td>${baht(carbonValueEstimate)}</td><td>ประมาณการที่ 0.3 บาท/kgCO₂e</td></tr>
            <tr style="font-weight:700"><td>รวมมูลค่าทางสังคมทั้งหมด</td><td>${baht(socialValue)}</td><td>-</td></tr>
            <tr><td>เงินลงทุนตั้งต้น (อ้างอิงค่าเครื่องชั่ง)</td><td>${baht(investment)}</td><td>จากบัญชีสรุปยอดขายสะสม</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ============================================================
   ESG REPORTING
   ============================================================ */
function renderEsg(){
  const el = document.getElementById('view-esg');
  const today = new Date().toLocaleDateString('th-TH', {year:'numeric', month:'long', day:'numeric'});
  el.innerHTML = `
    <div class="topbar" style="margin-bottom:14px">
      <div class="titles">
        <h2>รายงาน ESG โครงการ Carbon Heroes</h2>
        <p style="color:var(--ink-600);font-size:13.5px;margin-top:2px">สรุปผลด้านสิ่งแวดล้อม สังคม และธรรมาภิบาล ณ วันที่ ${today}</p>
      </div>
      <button class="btn" id="printBtn">🖨️ พิมพ์ / บันทึก PDF</button>
    </div>

    <div class="grid g-3" style="margin-bottom:16px">
      <div class="card"><h3>🌱 Environmental</h3>
        <p style="font-size:13px;line-height:1.7;color:var(--ink-600)">
        ปริมาณขยะรีไซเคิลเข้าสู่ระบบสะสม <b>${fmt(MODEL.totalWeight)} กก.</b><br>
        คาร์บอนที่ลดได้จริงสะสม <b>${fmt(MODEL.totalCarbonAll)} kgCO₂e</b><br>
        เทียบเท่าการปลูกต้นไม้ดูดซับคาร์บอนประมาณ <b>${fmt(MODEL.totalCarbonAll/21)} ต้น</b> (ค่าเฉลี่ย ~21 kgCO₂e/ต้น/ปี)
        </p>
      </div>
      <div class="card"><h3>🤝 Social</h3>
        <p style="font-size:13px;line-height:1.7;color:var(--ink-600)">
        สมาชิก Carbon Heroes ที่เข้าร่วม <b>${MODEL.members.length} คน</b><br>
        รายได้เสริมคืนสู่สมาชิกสะสม <b>${baht(MODEL.totalRevenue*0.8)}</b><br>
        กิจกรรมรับฝากขยะที่จัดแล้ว <b>${MODEL.byActivity.length} กิจกรรม</b> รวมกิจกรรม Kick-off
        </p>
      </div>
      <div class="card"><h3>🏛️ Governance</h3>
        <p style="font-size:13px;line-height:1.7;color:var(--ink-600)">
        โครงสร้างแบ่งรายได้โปร่งใส 80/15/5 ระหว่างสมาชิก ทีมชั่ง-เก็บ-ขน และทีมนำขาย<br>
        บันทึกทุกธุรกรรมด้วย Transaction ID ตรวจสอบย้อนกลับได้<br>
        อ้างอิงมาตรฐานคำนวณคาร์บอนตามเกณฑ์ LESS ของ TGO
        </p>
      </div>
    </div>

    <div class="card">
      <h3>ตารางสรุปตัวชี้วัดหลัก (Key Metrics)</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ตัวชี้วัด</th><th>ค่า</th></tr></thead>
          <tbody>
            <tr><td>ปริมาณขยะรีไซเคิลสะสม</td><td>${fmt(MODEL.totalWeight)} กก.</td></tr>
            <tr><td>ยอดขายขยะสะสม</td><td>${baht(MODEL.totalRevenue)}</td></tr>
            <tr><td>คาร์บอนที่ลดได้จริงสะสม</td><td>${fmt(MODEL.totalCarbonAll)} kgCO₂e</td></tr>
            <tr><td>จำนวนสมาชิก Carbon Heroes</td><td>${MODEL.members.length} คน</td></tr>
            <tr><td>จำนวนรายการธุรกรรมทั้งหมด</td><td>${MODEL.flat.length} รายการ</td></tr>
            <tr><td>จำนวนรอบการจำหน่ายให้คู่ค้า (รวม Kick-off)</td><td>${MODEL.byActivity.length} รอบ</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="note-box" style="margin-top:16px">
      รายงานนี้จัดทำจากข้อมูลบัญชีธนาคารขยะโรงไฟฟ้ากระบี่ สามารถใช้ประกอบการจัดทำรายงานความยั่งยืนขององค์กร และขยายผลเชื่อมต่อระบบรายงาน ESG ระดับองค์กรของ กฟผ. ได้ในอนาคต
    </div>
  `;
  document.getElementById('printBtn').addEventListener('click', ()=>window.print());
}

/* ---------- Toast ---------- */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ---------- PWA install + service worker ---------- */
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBtn').hidden = false;
});
document.getElementById('installBtn')?.addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('installBtn').hidden = true;
});
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}

/* ---------- API URL: อ่านจาก localStorage ก่อน แล้วค่อย fallback ไปที่ config.js ---------- */
const API_URL_STORAGE_KEY = 'ch_api_url';
function getApiUrl(){
  const saved = localStorage.getItem(API_URL_STORAGE_KEY);
  if(saved && saved.trim()) return saved.trim();
  if(typeof API_URL !== 'undefined' && API_URL && API_URL.indexOf('วาง_URL') !== 0) return API_URL;
  return '';
}
function setApiUrl(url){
  localStorage.setItem(API_URL_STORAGE_KEY, url.trim());
}

/* ---------- API helpers (fetch จาก Apps Script Web App) ---------- */
/* ---------- JSONP helper — เลี่ยงปัญหา CORS/redirect ของ Apps Script fetch() ---------- */
let jsonpCounter = 0;
function jsonpRequest(baseUrl, params){
  return new Promise((resolve, reject) => {
    const cbName = 'ch_jsonp_cb_' + (jsonpCounter++) + '_' + Date.now();
    const url = new URL(baseUrl);
    Object.entries(params||{}).forEach(([k,v])=>url.searchParams.set(k, v));
    url.searchParams.set('callback', cbName);

    let done = false;
    const script = document.createElement('script');
    const timer = setTimeout(() => {
      if(done) return; done = true;
      cleanup();
      reject(new Error('หมดเวลาเชื่อมต่อ (timeout) — ตรวจสอบ URL หรือลองใหม่อีกครั้ง'));
    }, 30000);
    function cleanup(){
      clearTimeout(timer);
      delete window[cbName];
      script.remove();
    }
    window[cbName] = (data) => {
      if(done) return; done = true;
      cleanup();
      if(data && data.error) reject(new Error(data.error));
      else resolve(data);
    };
    script.onerror = () => {
      if(done) return; done = true;
      cleanup();
      reject(new Error('เรียก API ไม่สำเร็จ — ตรวจสอบว่า URL ถูกต้องและ Deploy แล้ว (Who has access: Anyone)'));
    };
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

async function apiGet(action, params){
  return jsonpRequest(getApiUrl(), {action, ...params});
}
async function apiPost(action, extra){
  const params = {action};
  Object.entries(extra||{}).forEach(([k,v])=>{
    params[k] = (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
  });
  return jsonpRequest(getApiUrl(), params);
}

/* ---------- หน้ากรอก API URL ในเว็บ (ไม่ต้องแก้ไฟล์ในเครื่อง) ---------- */
function renderApiSetupForm(prefillError){
  const loading = document.getElementById('loadingState');
  const status = document.getElementById('syncStatus');
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  status.textContent = '🔴 ยังไม่ได้เชื่อมต่อ'; status.className = 'pill sync-err';
  loading.hidden = false;
  loading.innerHTML = `
    <div class="card" style="max-width:520px;margin:20px auto;text-align:left">
      <h3>🔗 เชื่อมต่อกับ Google Sheet</h3>
      <p style="font-size:13px;color:var(--ink-600);line-height:1.6;margin-bottom:12px">
        วาง URL ของ Apps Script Web App ที่ได้ตอน Deploy (ลงท้ายด้วย <code>/exec</code>)
        ระบบจะจำไว้ในเบราว์เซอร์นี้ ไม่ต้องแก้ไฟล์ใดๆ ในเครื่อง
      </p>
      ${prefillError ? `<p style="font-size:12.5px;color:#C6462B;margin-bottom:10px">❌ ${prefillError}</p>` : ''}
      <input id="apiUrlInput" type="text" placeholder="https://script.google.com/macros/s/.../exec"
        style="width:100%;margin-bottom:10px" value="${getApiUrl()==='วาง_URL_ที่ได้จาก_Deploy_ตรงนี้'?'':getApiUrl()}">
      <button class="btn gold" id="apiUrlSubmit" style="width:100%">เชื่อมต่อ</button>
    </div>
  `;
  document.getElementById('apiUrlSubmit').addEventListener('click', async ()=>{
    const val = document.getElementById('apiUrlInput').value.trim();
    if(!val.startsWith('http')){
      renderApiSetupForm('กรุณาวาง URL ที่ถูกต้อง (ต้องขึ้นต้นด้วย https://)');
      return;
    }
    setApiUrl(val);
    await loadData();
  });
}

async function loadData(){
  const status = document.getElementById('syncStatus');
  const loading = document.getElementById('loadingState');
  const url = getApiUrl();
  if(!url){
    renderApiSetupForm();
    return;
  }
  status.textContent = 'กำลังเชื่อมต่อ Google Sheet...'; status.className = 'pill';

  let data;
  try{
    data = await apiGet('getAppData');
  }catch(err){
    renderApiSetupForm('เชื่อมต่อไม่สำเร็จ: ' + (err.message||err));
    return;
  }

  /* เชื่อมต่อสำเร็จแล้ว ณ จุดนี้ — ปัญหาใดๆ หลังจากนี้ไม่ใช่ปัญหาการเชื่อมต่อ */
  CH_DATA = data;
  if(data.roundLabels) Object.assign(ROUND_LABELS, data.roundLabels);
  MODEL = buildModel(CH_DATA);
  loading.hidden = true;
  status.textContent = '🟢 ซิงก์กับ Google Sheet แล้ว';
  status.className = 'pill sync-ok';
  const startId = (location.hash||'#dashboard').replace('#','');
  const valid = NAV.some(n=>n.id===startId) ? startId : 'dashboard';
  try{
    renderView(valid);
    setActiveView(valid);
  }catch(renderErr){
    console.error('render error', renderErr);
    showToast('⚠️ แสดงผลบางส่วนผิดพลาด: ' + (renderErr.message||renderErr));
  }
}

/* ---------- Init ---------- */
function init(){
  renderRail();
  wireNav();
  document.getElementById('syncStatus').addEventListener('click', ()=>{
    invalidateAll();
    renderApiSetupForm();
  });
  loadData();
}
document.addEventListener('DOMContentLoaded', init);
