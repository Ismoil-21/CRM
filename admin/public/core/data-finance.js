// ===================== DATA =====================
const STORAGE_KEY='edumanage_crm_v8';

const DEFAULT_DATA={
  nextId:100,attendance:{},finance:[],
  courses:[
    {id:1,name:'Frontend Development',duration:'11 oy',price:'1 200 000',status:'Faol'},
    {id:2,name:'Backend Development',duration:'11 oy',price:'1 200 000',status:'Faol'},
    {id:3,name:'UI/UX Design',duration:'8 oy',price:'900 000',status:'Faol'},
    {id:4,name:'Python & Django',duration:'10 oy',price:'1 100 000',status:'Faol'},
  ],
  groups:[
    {id:1,name:'BE-1',course:'Backend Development',mentor:'Bobur Toshmatov',status:'Faol',startDate:'2026-01-10',days:['Du','Ch','Ju'],room:'8',timeStart:'10:00',timeEnd:'12:00'},
    {id:2,name:'FE-1',course:'Frontend Development',mentor:'Alisher Karimov',status:'Faol',startDate:'2026-01-05',days:['Du','Ch','Ju'],room:'12',timeStart:'09:00',timeEnd:'11:00'},
    {id:3,name:'FE-2',course:'Frontend Development',mentor:'Malika Yusupova',status:'Faol',startDate:'2026-02-15',days:['Se','Pa','Sh'],room:'5',timeStart:'14:00',timeEnd:'16:00'},
    {id:4,name:'PY-1',course:'Python & Django',mentor:'Alisher Karimov',status:'Faol',startDate:'2026-02-01',days:['Du','Ch','Ju'],room:'7',timeStart:'16:00',timeEnd:'18:00'},
    {id:5,name:'UX-1',course:'UI/UX Design',mentor:'Gulnora Rahimova',status:'Faol',startDate:'2026-03-01',days:['Se','Pa'],room:'3',timeStart:'13:00',timeEnd:'15:00'},
  ],
  mentors:[
    {id:1,name:'Alisher Karimov',phone:'+998901112233',subject:'Frontend',joinDate:'2025-09-01',experience:'3 yil',email:'alisher@edu.uz',telegram:'@alisher_k',address:'Toshkent, Yunusobod',age:'27',resume:'',resumeFile:null,photo:null},
    {id:2,name:'Bobur Toshmatov',phone:'+998933334455',subject:'Backend',joinDate:'2025-10-01',experience:'4 yil',email:'bobur@edu.uz',telegram:'@bobur_t',address:'Toshkent, Mirzo Ulugbek',age:'29',resume:'',resumeFile:null,photo:null},
    {id:3,name:'Gulnora Rahimova',phone:'+998944445566',subject:'UI/UX Design',joinDate:'2026-01-10',experience:'3 yil',email:'gulnora@edu.uz',telegram:'@gulnora_r',address:'Toshkent, Shayxontohur',age:'26',resume:'',resumeFile:null,photo:null},
    {id:4,name:'Malika Yusupova',phone:'+998912223344',subject:'Frontend',joinDate:'2025-11-15',experience:'2 yil',email:'malika@edu.uz',telegram:'@malika_y',address:'Toshkent, Chilonzor',age:'25',resume:'',resumeFile:null,photo:null},
  ],
  students:[
    {id:1,name:'Doniyor Ergashev',phone:'+998933456789',groupId:1,status:'Aktiv',joinDate:'2026-01-10',isDebtor:false,source:'Telegram',birthDate:'2001-12-03',parentName:'Mansur Ergashev',parentPhone:'+998933330033',notes:''},
    {id:2,name:'Jasur Mirzayev',phone:'+998901234567',groupId:2,status:'Aktiv',joinDate:'2026-01-05',isDebtor:false,source:"Ko'chadan",birthDate:'2002-05-12',parentName:'Kamoliddin Mirzayev',parentPhone:'+998901110011',notes:''},
    {id:3,name:'Maftuna Xoliqova',phone:'+998944567890',groupId:5,status:'Aktiv',joinDate:'2026-03-01',isDebtor:false,source:"Do'stdan",birthDate:'2003-03-17',parentName:'Hamida Xoliqova',parentPhone:'+998944440044',notes:''},
    {id:4,name:'Nargiza Qodirova',phone:'+998912345678',groupId:3,status:'Aktiv',joinDate:'2026-02-15',isDebtor:true,source:'Instagram',birthDate:'2003-08-22',parentName:'Zulfiya Qodirova',parentPhone:'+998912220022',notes:''},
    {id:5,name:'Sardor Nazarov',phone:'+998955678901',groupId:2,status:'Probatsiya',joinDate:'2026-01-07',isDebtor:true,source:'Instagram',birthDate:'2002-07-29',parentName:'Firdavs Nazarov',parentPhone:'+998955550055',notes:''},
    {id:6,name:'Zulfiya Tursunova',phone:'+998976789012',groupId:1,status:'Muzlatilgan',joinDate:'2026-01-10',isDebtor:true,source:'Telegram',birthDate:'2004-01-08',parentName:'Olim Tursunov',parentPhone:'+998976660066',notes:''},
  ]
};

function _mergeData(p){
  const d=Object.assign({},DEFAULT_DATA,p);
  if(!p._hasUserData){
    if(!p.courses||p.courses.length===0)d.courses=JSON.parse(JSON.stringify(DEFAULT_DATA.courses));
    if(!p.groups||p.groups.length===0)d.groups=JSON.parse(JSON.stringify(DEFAULT_DATA.groups));
    if(!p.mentors||p.mentors.length===0)d.mentors=JSON.parse(JSON.stringify(DEFAULT_DATA.mentors));
    if(!p.students||p.students.length===0)d.students=JSON.parse(JSON.stringify(DEFAULT_DATA.students));
  }
  if(!d.attendance)d.attendance={};if(!d.finance)d.finance=[];if(!d.gradingCriteria)d.gradingCriteria={};if(!d.grades)d.grades={};if(!d.tests)d.tests=[];if(!d.testResults)d.testResults={};
  return d;
}
function loadData(){
  try{
    const r=localStorage.getItem(STORAGE_KEY);
    if(r){return _mergeData(JSON.parse(r));}
  }catch(e){}
  const d=JSON.parse(JSON.stringify(DEFAULT_DATA));d.attendance={};d.finance=[];d.gradingCriteria={};d.grades={};d.tests=[];d.testResults={};return d;
}
// Backend dan yangi ma'lumot olish va appni yangilash
async function syncFromBackend(){
  try{
    const r=await fetch('/api/data');
    if(!r.ok)return;
    const json=await r.json();
    if(!json.ok||!json.data)return;
    const fresh=_mergeData(json.data);
    // localStorage ni ham yangilash
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(json.data));}catch(e){}
    Object.assign(D,fresh);
    if(typeof renderAll==='function')renderAll();
    if(typeof updateCounts==='function')updateCounts();
    // Rolga mos ko'rinishni yangilash
    if(typeof isMentorRole==='function'&&isMentorRole()&&typeof renderMentorDashboard==='function')renderMentorDashboard();
    if(typeof isStudentRole==='function'&&isStudentRole()&&typeof renderStudentDashboard==='function')renderStudentDashboard();
  }catch(e){}
}
function saveData(){
  const payload={_hasUserData:true,nextId:D.nextId,courses:D.courses,groups:D.groups,mentors:D.mentors,students:D.students,attendance:D.attendance||{},finance:D.finance||[],gradingCriteria:D.gradingCriteria||{},grades:D.grades||{},tests:D.tests||[],testResults:D.testResults||{}};
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(payload));}catch(e){}
  fetch('/api/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(r=>r.json()).then(d=>updateStorageBadge(d.ok)).catch(()=>updateStorageBadge(false));
}
function updateStorageBadge(ok){
  const el=document.getElementById('storage-status');if(!el)return;
  el.textContent=ok?'💾 Saqlangan':'⚠️ Saqlanmadi';
  el.style.background=ok?'var(--teal-light)':'var(--amber-light)';
  el.style.color=ok?'var(--teal-text)':'var(--amber-text)';
}
function resetData(){
  if(!confirm('Barcha ma\'lumotlar o\'chiriladi?'))return;
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(D,JSON.parse(JSON.stringify(DEFAULT_DATA)));D.attendance={};D.finance=[];
  groupPage=1;updateCounts();updateGroupFilters();updateStudentCourseFilter();renderAll();toast('🔄 Qayta tiklandi');
}
if(!window.D)window.D={};var D=window.D;
function newId(){return ++D.nextId;}
function updateCounts(){
  document.getElementById('nc-courses').textContent=D.courses.length;
  document.getElementById('nc-groups').textContent=D.groups.length;
  document.getElementById('nc-mentors').textContent=D.mentors.length;
  document.getElementById('nc-students').textContent=D.students.length;
  const ncTests=document.getElementById('nc-tests');if(ncTests)ncTests.textContent=D.tests.length;
}
function groupStudentCount(gid){return D.students.filter(s=>s.groupId===gid).length;}
function groupLabel(gid){const g=D.groups.find(x=>x.id===gid);return g?g.name+' ('+g.course.split(' ')[0]+')':'—';}
function studentCourse(s){const g=D.groups.find(x=>x.id===s.groupId);return g?g.course:'';}
function autoGroupName(courseName){
  if(!courseName)return '';
  const w=courseName.split(/\s+/);const prefix=w.length>=2?(w[0][0]+w[1][0]).toUpperCase():courseName.substring(0,2).toUpperCase();
  const count=D.groups.filter(g=>g.course===courseName).length;return prefix+'-'+(count+1);
}
function generateStudentId(id){return 'STD-'+new Date().getFullYear()+'-'+String(id).padStart(4,'0');}
function getCourseDuration(courseName){const c=D.courses.find(x=>x.name===courseName);return c?c.duration:'—';}
function getCoursePrice(courseName){const c=D.courses.find(x=>x.name===courseName);if(!c)return 0;return parseInt((c.price||'0').replace(/\s/g,'').replace(/[^\d]/g,''))||0;}
function getLessonPrice(courseName){const cp=getCoursePrice(courseName);return cp>0?Math.round(cp/LESSON_COUNT):0;}
function getExpYears(expStr){if(!expStr)return 0;const m=expStr.match(/(\d+)/);return m?parseInt(m[1]):0;}
function openLightbox(src){document.getElementById('lightbox-img').src=src;document.getElementById('lightbox').classList.add('open');}
function closeLightbox(){document.getElementById('lightbox').classList.remove('open');document.getElementById('lightbox-img').src='';}
function timeToMin(t_){if(!t_)return 0;const[h,m]=t_.split(':').map(Number);return h*60+m;}
function checkRoomConflict(room,timeStart,timeEnd,editId){
  if(!room||!timeStart||!timeEnd)return null;
  const newS=timeToMin(timeStart),newE=timeToMin(timeEnd);
  for(const g of D.groups){
    if(editId&&g.id===editId)continue;if(g.room!==room)continue;if(!g.timeStart||!g.timeEnd)continue;
    const gS=timeToMin(g.timeStart),gE=timeToMin(g.timeEnd);
    if(newS<gE&&newE>gS)return g;
  }
  return null;
}
function liveCheckConflict(editId){
  const room=(document.getElementById('f-room')?.value||'').trim();
  const ts=document.getElementById('f-timestart')?.value||'';
  const te=document.getElementById('f-timeend')?.value||'';
  const warn=document.getElementById('room-conflict-warn');if(!warn)return;
  if(ts&&te&&timeToMin(te)<=timeToMin(ts)){warn.classList.add('show');warn.innerHTML=`⚠️ <b>Tugash vaqti boshlanish vaqtidan katta bo'lishi kerak!</b>`;return;}
  if(!room||!ts||!te){warn.classList.remove('show');return;}
  const conflict=checkRoomConflict(room,ts,te,editId||null);
  if(conflict){warn.classList.add('show');warn.innerHTML=`⚠️ <b>To'qnashuv!</b> Xona ${room} da ${conflict.name} guruhi allaqachon ${conflict.timeStart}–${conflict.timeEnd} vaqtida band.`;}
  else{warn.classList.remove('show');}
}
function phoneOnlyDigits(el){el.value=el.value.replace(/[^\d+]/g,'');}
function setExpFilter(val,btn){
  _expFilter=val;
  document.querySelectorAll('.exp-pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderMentors();
}
function mentorPhotoSrc(m){if(m&&m.photo&&m.photo.data&&m.photo.type)return `data:${m.photo.type};base64,${m.photo.data}`;return null;}
function mentorAvatarHtml(m,idx,size='sm'){
  const src=mentorPhotoSrc(m);
  if(src){const cls=size==='lg'?'av-photo-lg':'av-photo';return `<img class="${cls}" src="${src}" alt="${m.name}" onclick="event.stopPropagation();openLightbox('${src}')">`;}
  const cls=size==='lg'?'detail-av':'av';
  const style=size==='lg'?' style="font-size:24px;width:68px;height:68px;border-radius:50%"':'';
  return `<div class="${cls} ${AV_CLS[idx%5]}"${style}>${ini(m.name)}</div>`;
}
function updateGroupFilters(){
  const cs=document.getElementById('fg-course');const ms=document.getElementById('fg-mentor');if(!cs||!ms)return;
  const cv=cs.value,mv=ms.value;
  cs.innerHTML=`<option value="">${t('all_courses')}</option>`+D.courses.map(c=>`<option value="${c.name}" ${cv===c.name?'selected':''}>${c.name}</option>`).join('');
  ms.innerHTML=`<option value="">${t('all_mentors')}</option>`+D.mentors.map(m=>`<option value="${m.name}" ${mv===m.name?'selected':''}>${m.name}</option>`).join('');
}
function updateStudentCourseFilter(){
  const sel=document.getElementById('filter-student-course');if(!sel)return;
  const v=sel.value;
  sel.innerHTML=`<option value="">${t('all_direction')}</option>`+D.courses.map(c=>`<option value="${c.name}" ${v===c.name?'selected':''}>${c.name}</option>`).join('');
}

// Language switcher - FIX #2: re-render ALL panels
function setLang(lang,btn){
  LANG=lang;
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  saveUI();
  applyTranslations();
  updateVideoNavLabels();
  applyUISettings();
  updateGroupFilters();
  updateStudentCourseFilter();
  updateTopbar(currentTab);
  // Re-render current panel to update dynamic content
  renderAll();
  if(currentTab==='finance') renderFinance();
  if(currentTab==='settings') setTimeout(()=>renderSettingsPanel(),50);
  if(currentTab==='tests') renderTestsPanel();
  if(currentTab==='grades') renderGradesPanel();
  if(currentTab==='mentor-dash') renderMentorDashboard();if(currentTab==='mentor-ai'&&typeof renderMentorAI==='function')renderMentorAI();if(currentTab==='student-ai'&&typeof renderStudentAI==='function')renderStudentAI();
  if(currentTab==='mentors-my') renderMySchedule();
  if(currentTab==='mentor-chat') renderMentorChat();
  if(currentTab==='grades') renderGradesPanel();
  if(currentTab==='tests') renderTestsPanel();
  if(currentTab==='student-my') renderStudentDashboard();
  if(currentTab==='student-schedule') renderStudentSchedulePage();
  if(currentTab==='student-rating') renderStudentRatingPage();
  if(currentTab==='student-grades') renderStudentGradesPage();
  if(currentTab==='student-tests') renderStudentTestsPage();
  if(currentTab==='student-chat') renderStudentChatPage();
  if(currentTab==='student-goals') renderStudentGoalsPage();
  if(currentTab==='mentor-videos') renderMentorVideos();
  if(currentTab==='student-videos') renderStudentVideos();
  if(currentTab==='coin-shop'&&typeof renderAdminCoinShop==='function')renderAdminCoinShop();
  if(currentTab==='student-coin-shop'&&typeof renderStudentCoinShop==='function')renderStudentCoinShop();
  // Coin topbar labelini ham yangilaymiz (Mentor / Talaba yozuvi tilda)
  if(typeof updateMentorCoinTopbar==='function')updateMentorCoinTopbar();
}

// ===================== FINANCE (FIX #5) =====================
// Finance now supports multiple years, not just 2026
function getAvailableFinanceYears(){
  const years=new Set();
  const now=new Date();
  years.add(now.getFullYear());
  years.add(2026); // always include
  if(D.finance){
    D.finance.forEach(tx=>{
      const y=new Date(tx.date).getFullYear();
      if(y>2020&&y<2100) years.add(y);
    });
  }
  return Array.from(years).sort();
}

function getFinanceForMonth(month,year){
  if(!D.finance)D.finance=[];
  return D.finance.filter(tx=>{
    const d=new Date(tx.date);
    return d.getFullYear()===year && d.getMonth()===month;
  });
}

// FIX #5: Month nav shows both months AND year selector
function renderFinanceMonthNav(){
  const nav=document.getElementById('fin-month-nav');
  const years=getAvailableFinanceYears();
  const monthNames=getMonthNames(true);

  // Year buttons + month buttons
  let html='';
  // Year selector row
  html+=`<div style="display:flex;align-items:center;gap:4px;padding:4px 8px;border-right:1px solid var(--border);flex-shrink:0">`;
  years.forEach(y=>{
    html+=`<button class="fin-month-btn ${y===_finYear?'active':''}" onclick="setFinYear(${y})" style="font-weight:800">${y}</button>`;
  });
  html+=`</div>`;
  // Month buttons
  monthNames.forEach((m,idx)=>{
    html+=`<button class="fin-month-btn ${idx===_finMonth&&_finYear===_finYear?'active':''}" onclick="setFinMonth(${idx},${_finYear})" ${idx===_finMonth?'style="background:linear-gradient(135deg,var(--accent),var(--teal));color:#fff;box-shadow:var(--shadow-sm)"':''}>${m}</button>`;
  });

  nav.innerHTML=html;
  setTimeout(()=>{const a=nav.querySelector('.active[style]');if(a)a.scrollIntoView({block:'nearest',inline:'center'});},50);
}

function setFinYear(y){
  _finYear=y;
  renderFinance();
}
function setFinMonth(m,y){_finMonth=m;_finYear=y;renderFinance();}

function renderFinanceSummary(){
  const txs=getFinanceForMonth(_finMonth,_finYear);
  let totalIncome=0,totalExpense=0,totalSalary=0;
  txs.forEach(tx=>{
    if(tx.type==='income')totalIncome+=tx.amount;
    else if(tx.type==='expense')totalExpense+=tx.amount;
    else if(tx.type==='salary')totalSalary+=tx.amount;
  });
  const balance=totalIncome-(totalExpense+totalSalary);
  const monthName=getMonthName(_finMonth,false)+' '+_finYear;

  document.getElementById('fin-summary-row').innerHTML=`
    <div class="fin-summary-card fin-sc-income">
      <div class="fin-sc-icon">💚</div>
      <div class="fin-sc-val" style="color:var(--teal-text)">${fmtMoney(totalIncome)} so'm</div>
      <div class="fin-sc-label">${t('income')} — ${monthName}</div>
    </div>
    <div class="fin-summary-card fin-sc-expense">
      <div class="fin-sc-icon">🔴</div>
      <div class="fin-sc-val" style="color:var(--orange-text)">${fmtMoney(totalExpense)} so'm</div>
      <div class="fin-sc-label">${t('expense')} — ${monthName}</div>
    </div>
    <div class="fin-summary-card fin-sc-salary">
      <div class="fin-sc-icon">🎓</div>
      <div class="fin-sc-val" style="color:var(--purple-text)">${fmtMoney(totalSalary)} so'm</div>
      <div class="fin-sc-label">${t('salary')} — ${monthName}</div>
    </div>
    <div class="fin-summary-card fin-sc-balance">
      <div class="fin-sc-icon">${balance>=0?'📈':'📉'}</div>
      <div class="fin-sc-val" style="color:${balance>=0?'var(--accent-text)':'var(--orange-text)'}">${balance>=0?'+':''}${fmtMoney(balance)} so'm</div>
      <div class="fin-sc-label">Balans — ${monthName}</div>
    </div>
  `;
}

function renderFinanceList(){
  const filterType=document.getElementById('fin-filter-type')?.value||'';
  let txs=getFinanceForMonth(_finMonth,_finYear);
  if(filterType)txs=txs.filter(tx=>tx.type===filterType);
  txs=txs.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));

  const container=document.getElementById('fin-transactions');
  if(!txs.length){
    container.innerHTML=`<div class="empty"><div class="empty-ic">💰</div><div class="empty-txt">Bu oyda tranzaksiya yo'q</div></div>`;
    return;
  }
  const typeIcon={income:'💚',expense:'🔴',salary:'🎓'};
  const typeClass={income:'fin-tx-income',expense:'fin-tx-expense',salary:'fin-tx-salary'};
  const typeName={income:t('income'),expense:t('expense'),salary:t('salary')};
  const amountClass={income:'fin-tx-amount-income',expense:'fin-tx-amount-expense',salary:'fin-tx-amount-salary'};
  const sign={income:'+',expense:'−',salary:'−'};

  container.innerHTML=`
    <div class="fin-tx-header">
      <div></div>
      <div>Nomi / Tavsif</div>
      <div>Sana</div>
      <div>Tur</div>
      <div>Summa</div>
      <div style="text-align:right">Amal</div>
    </div>
    ${txs.map(tx=>`
      <div class="fin-tx-row">
        <div><div class="fin-tx-icon ${typeClass[tx.type]}">${typeIcon[tx.type]}</div></div>
        <div>
          <div class="fin-tx-name">${tx.title||'—'}</div>
          <div class="fin-tx-desc">${tx.description||''}</div>
        </div>
        <div style="font-size:12px;color:var(--text2)">${fmtDateTime(tx.date)}</div>
        <div><span class="badge ${tx.type==='income'?'b-teal':tx.type==='salary'?'b-purple':'b-orange'}">${typeName[tx.type]}</span></div>
        <div class="${amountClass[tx.type]}">${sign[tx.type]}${fmtMoney(tx.amount)} so'm</div>
        <div style="text-align:right"><button class="fin-tx-del" onclick="deleteFinTx(${tx.id})" title="O'chirish">🗑</button></div>
      </div>
    `).join('')}
  `;
}

// FIX #5: Update filter select options with translated text
function renderFinance(){
  // Update filter options with current language
  const filterSel=document.getElementById('fin-filter-type');
  if(filterSel){
    const curVal=filterSel.value;
    filterSel.innerHTML=`
      <option value="">${t('all_')}</option>
      <option value="income">💚 ${t('income')}</option>
      <option value="expense">🔴 ${t('expense')}</option>
      <option value="salary">🎓 ${t('salary')}</option>
    `;
    filterSel.value=curVal;
  }
  renderFinanceMonthNav();
  renderFinanceSummary();
  renderFinanceList();
}

function deleteFinTx(id){
  if(!confirm('Bu tranzaksiyani o\'chirasizmi?'))return;
  D.finance=D.finance.filter(tx=>tx.id!==id);
  saveData();renderFinance();toast('🗑 O\'chirildi');
}

function openFinModal(type,data={}){
  _finModal_type=type;_finModal_editId=data.id||null;
  const titles={income:'💚 '+t('income')+' qo\'shish',expense:'🔴 '+t('expense')+' qo\'shish'};
  document.getElementById('fin-modal-title').textContent=titles[type]||'Qo\'shish';
  const today=new Date().toISOString().slice(0,16);
  document.getElementById('fin-modal-body').innerHTML=`
    <div class="fg"><label>Nomi <span class="req">*</span></label>
      <input id="fin-title" placeholder="${type==='income'?'Masalan: Jasur Mirzayev to\'lovi':'Masalan: Internet to\'lovi'}" value="${data.title||''}">
    </div>
    <div class="fg"><label>Tavsif (ixtiyoriy)</label>
      <textarea id="fin-desc" rows="2" placeholder="Qo'shimcha ma'lumot...">${data.description||''}</textarea>
    </div>
    <div class="form-row">
      <div class="fg"><label>Summa (so'm) <span class="req">*</span></label>
        <input id="fin-amount" type="number" min="0" placeholder="500 000" value="${data.amount||''}">
      </div>
      <div class="fg"><label>Sana va vaqt <span class="req">*</span></label>
        <input id="fin-date" type="datetime-local" value="${data.date?data.date.slice(0,16):today}">
      </div>
    </div>
    ${type==='income'?`
    <div class="fg"><label>Talaba (ixtiyoriy)</label>
      <select id="fin-student">
        <option value="">— Talabani tanlang —</option>
        ${D.students.map(s=>`<option value="${s.id}" ${data.studentId==s.id?'selected':''}>${s.name} — ${groupLabel(s.groupId)}</option>`).join('')}
      </select>
    </div>`:''}
  `;
  document.getElementById('fin-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('fin-title')?.focus(),100);
}
function closeFinModal(){document.getElementById('fin-overlay').classList.remove('open');}
function saveFinTransaction(){
  const title=(document.getElementById('fin-title')?.value||'').trim();
  const amount=parseFloat(document.getElementById('fin-amount')?.value||0);
  const date=document.getElementById('fin-date')?.value;
  if(!title){toast('⚠️ Nomni kiriting!');return;}
  if(!amount||amount<=0){toast('⚠️ Summani kiriting!');return;}
  if(!date){toast('⚠️ Sanani kiriting!');return;}
  const studentId=document.getElementById('fin-student')?.value||null;
  const tx={
    id:newId(),
    type:_finModal_type,
    title,
    description:(document.getElementById('fin-desc')?.value||'').trim(),
    amount,
    date:new Date(date).toISOString(),
    studentId:studentId?parseInt(studentId):null,
    createdAt:new Date().toISOString()
  };
  if(!D.finance)D.finance=[];
  D.finance.push(tx);
  saveData();closeFinModal();renderFinance();
  if(tx.type==='income'&&tx.studentId){
    const s=D.students.find(x=>x.id===tx.studentId);
    if(s&&s.isDebtor){s.isDebtor=false;s.status='Aktiv';saveData();updateCounts();renderStudents();toast('✅ Kirim qo\'shildi + '+s.name+' qarzdorlikdan chiqdi!');}
    else toast('✅ Kirim qo\'shildi!');
  }else{
    toast('✅ '+(tx.type==='income'?'Kirim':'Chiqim')+' qo\'shildi!');
  }
}

function openMentorSalaryModal(){
  const monthName=getMonthName(_finMonth,false)+' '+_finYear;
  const txs=getFinanceForMonth(_finMonth,_finYear);
  const paidSalaries=txs.filter(t_=>t_.type==='salary');

  const mentorRows=D.mentors.map(m=>{
    const mGroups=D.groups.filter(g=>g.mentor===m.name);
    const mStudentIds=D.students.filter(s=>mGroups.some(g=>g.id===s.groupId)).map(s=>s.id);
    let mentorIncome=0;
    txs.filter(t_=>t_.type==='income'&&t_.studentId&&mStudentIds.includes(t_.studentId)).forEach(t_=>mentorIncome+=t_.amount);
    if(mentorIncome===0){
      mGroups.forEach(g=>{
        const grpStudents=D.students.filter(s=>s.groupId===g.id);
        const cp=getCoursePrice(g.course);const lp=cp>0?Math.round(cp/LESSON_COUNT):0;
        grpStudents.forEach(s=>{
          const attKey='att_'+g.id+'_'+_finYear+'_'+_finMonth;
          const sAtt=(D.attendance[attKey]&&D.attendance[attKey]['s'+s.id])||{};
          let ky=0;for(let l=1;l<=LESSON_COUNT;l++){const v=sAtt['l'+l]||'';if(v==='K'||v==='Y')ky++;}
          mentorIncome+=ky*lp;
        });
      });
    }
    const salary=Math.round(mentorIncome*MENTOR_SALARY_PCT);
    const isPaid=paidSalaries.some(t_=>t_.mentorId===m.id);
    return {mentor:m,mentorIncome,salary,isPaid,mGroups,mStudentIds};
  });

  document.getElementById('salary-modal-body').innerHTML=`
    <div style="background:var(--purple-light);border:1px solid rgba(124,58,237,.2);border-radius:var(--r-md);padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--purple-text)">
      💡 <b>Qoida:</b> Har bir mentor o'z talabalarining to'lovlaridan <b>20%</b> oladi. Bu oy: <b>${monthName}</b>
    </div>
    <div style="overflow-x:auto">
      <table class="salary-table">
        <thead>
          <tr>
            <th>Mentor</th><th>Guruhlar</th><th>Talabalar to'lovi</th><th>Oylik (20%)</th><th>${L==='ru'?'Статус':L==='en'?'Status':'Holat'}</th><th>Amal</th>
          </tr>
        </thead>
        <tbody>
          ${mentorRows.map((row,i)=>`
            <tr>
              <td><div style="display:flex;align-items:center;gap:8px">${mentorAvatarHtml(row.mentor,i,'sm')}<div><b>${row.mentor.name}</b><br><span style="font-size:11px;color:var(--text3)">${row.mentor.subject}</span></div></div></td>
              <td>${row.mGroups.map(g=>`<span class="badge b-blue" style="margin:2px">${g.name}</span>`).join('')||'—'}</td>
              <td style="font-weight:700;color:var(--teal-text)">${fmtMoney(row.mentorIncome)} so'm</td>
              <td style="font-weight:800;color:var(--purple-text);font-size:15px">${fmtMoney(row.salary)} so'm</td>
              <td>${row.isPaid?'<span class="salary-paid-badge">✅ To\'landi</span>':'<span class="badge b-amber">⏳ Kutilmoqda</span>'}</td>
              <td>${row.isPaid?'':`<button class="salary-pay-btn" onclick="paySalary(${row.mentor.id},'${row.mentor.name}',${row.salary})">💸 To'lash</button>`}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:16px;padding:12px 16px;background:var(--bg3);border-radius:var(--r-md);font-size:13px;color:var(--text2)">
      Jami oylik: <b style="color:var(--purple-text)">${fmtMoney(mentorRows.reduce((s,r)=>s+r.salary,0))} so'm</b> · 
      To'landi: <b style="color:var(--teal-text)">${mentorRows.filter(r=>r.isPaid).length} ta mentor</b>
    </div>
  `;
  document.getElementById('salary-overlay').classList.add('open');
}
function closeMentorSalaryModal(){document.getElementById('salary-overlay').classList.remove('open');}
window.paySalary=function(mentorId,mentorName,amount){
  if(!confirm(`${mentorName}ga ${fmtMoney(amount)} so'm oylik to'lansinmi?`))return;
  if(!D.finance)D.finance=[];
  const date=new Date(_finYear,_finMonth,15).toISOString();
  D.finance.push({
    id:newId(),
    type:'salary',
    title:`${mentorName} — Oylik (20%)`,
    description:`${getMonthName(_finMonth,false)} ${_finYear} oyi uchun mentor oyligi`,
    amount,
    date,
    mentorId,
    createdAt:new Date().toISOString()
  });
  saveData();
  toast('✅ '+mentorName+' oylik to\'landi: '+fmtMoney(amount)+' so\'m');
  openMentorSalaryModal();
  renderFinance();
};

