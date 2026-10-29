const $ = (id) => document.getElementById(id);
const USERS_KEY = "sawitpupuk_users_v1";
const SESSION_KEY = "sawitpupuk_session_v1";
const recordsKey = (username) => `sawitpupuk_records_${username}`;
let isLoginMode = false;
let currentUser = null;
let fertilizerId = 0;
let toastTimer;

const fertilizerOptions = [
  { name: "Urea", dose: 1, price: 6500 },
  { name: "NPK", dose: 2, price: 12000 },
  { name: "MOP / KCl", dose: 1, price: 11000 },
  { name: "Kieserite", dose: 0.5, price: 4500 },
  { name: "Dolomit", dose: 1, price: 2500 },
  { name: "SP-36", dose: 0.5, price: 4500 },
  { name: "Borate", dose: 0.05, price: 18000 },
  { name: "Pupuk lain", dose: 1, price: 0 }
];

function getUsers(){ try{return JSON.parse(localStorage.getItem(USERS_KEY)||"[]")}catch{return []} }
function saveUsers(users){localStorage.setItem(USERS_KEY,JSON.stringify(users))}
function getRecords(){try{return JSON.parse(localStorage.getItem(recordsKey(currentUser.username))||"[]")}catch{return []}}
function saveRecords(records){localStorage.setItem(recordsKey(currentUser.username),JSON.stringify(records))}
function formatNumber(value, decimals=2){return new Intl.NumberFormat("id-ID",{maximumFractionDigits:decimals}).format(value||0)}
function rupiah(value){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value||0)}
function escapeHTML(str){return String(str??"").replace(/[&<>"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
function showToast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2800)}

function setAuthMode(login){
  isLoginMode=login;
  $("authTitle").textContent=login?"Masuk ke SawitPupuk":"Selamat datang di SawitPupuk";
  $("authDescription").textContent=login?"Masuk untuk membuka catatan pemupukan yang tersimpan di perangkat ini.":"Daftar akun lokal untuk mulai menghitung kebutuhan dan biaya pemupukan kebun sawit.";
  $("nameLabel").classList.toggle("hidden",login);
  $("fullName").classList.toggle("hidden",login);
  $("fullName").required=!login;
  $("authSubmit").textContent=login?"Masuk":"Daftar dan masuk";
  $("switchText").textContent=login?"Belum punya akun?":"Sudah punya akun?";
  $("switchAuth").textContent=login?"Daftar":"Masuk";
  $("password").autocomplete=login?"current-password":"new-password";
}
$("switchAuth").addEventListener("click",()=>setAuthMode(!isLoginMode));
$("authForm").addEventListener("submit",e=>{
  e.preventDefault();
  const username=$("email").value.trim().toLowerCase();
  const password=$("password").value;
  const users=getUsers();
  if(isLoginMode){
    const user=users.find(u=>u.username===username&&u.password===password);
    if(!user){showToast("Akun tidak ditemukan atau kata sandi salah.");return}
    enterApp(user);
  }else{
    const name=$("fullName").value.trim();
    if(users.some(u=>u.username===username)){showToast("Username/email sudah terdaftar. Silakan masuk.");return}
    if(password.length<4){showToast("Kata sandi minimal 4 karakter.");return}
    const user={name,username,password};
    users.push(user);saveUsers(users);enterApp(user);showToast("Pendaftaran berhasil. Selamat datang!");
  }
});
function enterApp(user){
  currentUser=user;localStorage.setItem(SESSION_KEY,user.username);
  $("authScreen").classList.add("hidden");$("appScreen").classList.remove("hidden");
  $("userName").textContent=user.name;$("userAvatar").textContent=(user.name||"P").trim().charAt(0).toUpperCase();
  renderDashboard();renderRecords();updateCalculation();
}
$("logoutBtn").addEventListener("click",()=>{currentUser=null;localStorage.removeItem(SESSION_KEY);$("appScreen").classList.add("hidden");$("authScreen").classList.remove("hidden");$("authForm").reset();setAuthMode(true)});
function switchView(view){
  document.querySelectorAll(".view").forEach(el=>el.classList.add("hidden"));
  $(`${view}View`).classList.remove("hidden");
  document.querySelectorAll(".nav-link[data-view]").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
  $("pageTitle").textContent=({dashboard:"Dashboard",calculator:"Kalkulator Pupuk",records:"Catatan Perhitungan"})[view]||"Dashboard";
  if(view==="dashboard")renderDashboard();if(view==="records")renderRecords();
}
document.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.goto)));

function addFertilizerRow(name="",dose="",price=""){
  const id=++fertilizerId;
  const row=document.createElement("div");row.className="fertilizer-row";row.dataset.id=id;
  const opts=fertilizerOptions.map(f=>`<option value="${escapeHTML(f.name)}" ${f.name===name?"selected":""}>${escapeHTML(f.name)}</option>`).join("");
  row.innerHTML=`<div class="field"><label>Jenis pupuk</label><select class="fert-name">${opts}</select></div>
    <div class="field"><label>Dosis (kg/pokok)</label><input class="fert-dose" type="number" min="0" step="0.001" placeholder="0" value="${dose}"></div>
    <div class="field"><label>Harga (Rp/kg)</label><input class="fert-price" type="number" min="0" step="100" placeholder="0" value="${price}"></div>
    <button type="button" class="remove-fert" aria-label="Hapus pupuk" title="Hapus pupuk">×</button>`;
  row.querySelectorAll("input,select").forEach(el=>el.addEventListener("input",updateCalculation));
  row.querySelector(".remove-fert").addEventListener("click",()=>{row.remove();if(!$("fertilizerRows").children.length)addFertilizerRow();updateCalculation()});
  $("fertilizerRows").appendChild(row);updateCalculation();
}
function readFertilizers(){
  return [...document.querySelectorAll(".fertilizer-row")].map(row=>({
    name:row.querySelector(".fert-name").value,
    dose:Math.max(0,Number(row.querySelector(".fert-dose").value)||0),
    price:Math.max(0,Number(row.querySelector(".fert-price").value)||0)
  })).filter(f=>f.dose>0);
}
function calculate(){
  const area=Math.max(0,Number($("area").value)||0);
  const typedCount=Math.max(0,Number($("palmCount").value)||0);
  const palms=typedCount>0?typedCount:area*143;
  const fertilizers=readFertilizers().map(f=>({...f,kg:f.dose*palms,cost:f.dose*palms*f.price}));
  return {area,palms,fertilizers,totalKg:fertilizers.reduce((s,f)=>s+f.kg,0),totalCost:fertilizers.reduce((s,f)=>s+f.cost,0),estimatedPalms:typedCount===0};
}
function updateCalculation(){
  const c=calculate();
  $("totalKg").textContent=`${formatNumber(c.totalKg)} kg`;
  $("totalCost").textContent=rupiah(c.totalCost);
  $("breakdown").innerHTML=c.fertilizers.length?c.fertilizers.map(f=>`<div class="breakdown-item"><span>${escapeHTML(f.name)} · ${formatNumber(f.kg)} kg</span><strong>${rupiah(f.cost)}</strong></div>`).join(""):`<p class="muted">Isi dosis dan harga pupuk untuk melihat rincian.</p>`;
}
$("addFertilizer").addEventListener("click",()=>addFertilizerRow());
["area","palmCount"].forEach(id=>$(id).addEventListener("input",updateCalculation));
$("resetCalc").addEventListener("click",()=>{
  $("calcForm").reset();$("recordName").value="";$("notes").value="";$("fertilizerRows").innerHTML="";
  addFertilizerRow("Urea",1,6500);addFertilizerRow("NPK",2,12000);showToast("Formulir berhasil direset.");
});
$("calcForm").addEventListener("submit",e=>{
  e.preventDefault();
  const c=calculate();
  if(c.area<=0){showToast("Masukkan luas kebun lebih dari 0 hektare.");$("area").focus();return}
  if(!c.fertilizers.length){showToast("Masukkan dosis minimal satu jenis pupuk.");return}
  const record={
    id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),
    name:$("recordName").value.trim(),area:c.area,palmAge:$("palmAge").value,
    palms:c.palms,estimatedPalms:c.estimatedPalms,application:$("application").value,
    fertilizers:c.fertilizers, totalKg:c.totalKg,totalCost:c.totalCost,
    notes:$("notes").value.trim(),date:new Date().toISOString()
  };
  const records=getRecords();records.unshift(record);saveRecords(records);
  renderDashboard();renderRecords();showToast("Perhitungan berhasil disimpan di perangkat ini.");switchView("records");
});

function recordCard(r){
  const date=new Date(r.date).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
  const names=r.fertilizers.map(f=>f.name).join(", ");
  return `<article class="record-card"><div class="record-main"><div class="record-symbol">🌱</div><div class="record-info"><h3>${escapeHTML(r.name||"Tanpa nama")}</h3><p>${date} · ${formatNumber(r.area)} ha · ${escapeHTML(r.palmAge)} · ${escapeHTML(names)}</p><p>${formatNumber(r.totalKg)} kg pupuk${r.estimatedPalms?" · jumlah pokok estimasi":""}</p></div></div><div class="record-total"><strong>${rupiah(r.totalCost)}</strong><small>Estimasi biaya</small></div><div class="record-actions"><button class="icon-btn" data-detail="${r.id}" title="Lihat rincian" aria-label="Lihat rincian">↗</button><button class="icon-btn danger" data-delete="${r.id}" title="Hapus catatan" aria-label="Hapus catatan">×</button></div></article>`;
}
function bindRecordActions(container){
  container.querySelectorAll("[data-delete]").forEach(btn=>btn.addEventListener("click",()=>{
    const record=getRecords().find(r=>r.id===btn.dataset.delete);if(!record)return;
    if(confirm(`Hapus catatan "${record.name}"?`)){saveRecords(getRecords().filter(r=>r.id!==btn.dataset.delete));renderDashboard();renderRecords();showToast("Catatan dihapus.")}
  }));
  container.querySelectorAll("[data-detail]").forEach(btn=>btn.addEventListener("click",()=>{
    const r=getRecords().find(x=>x.id===btn.dataset.detail);if(!r)return;
    const lines=r.fertilizers.map(f=>`• ${f.name}: ${formatNumber(f.kg)} kg × ${rupiah(f.price)}/kg = ${rupiah(f.cost)}`).join("\n");
    alert(`${r.name}\nTanggal: ${new Date(r.date).toLocaleString("id-ID")}\nLuas: ${formatNumber(r.area)} ha\nUmur: ${r.palmAge}\nJumlah pokok: ${formatNumber(r.palms,0)}${r.estimatedPalms?" (estimasi 143 pokok/ha)":""}\nAplikasi ke-${r.application}\n\n${lines}\n\nTotal kebutuhan: ${formatNumber(r.totalKg)} kg\nTotal biaya: ${rupiah(r.totalCost)}\nCatatan: ${r.notes||"-"}`);
  }));
}
function renderDashboard(){
  if(!currentUser)return;const records=getRecords();
  $("statRecords").textContent=records.length;
  $("statCost").textContent=rupiah(records.reduce((s,r)=>s+r.totalCost,0));
  $("statArea").textContent=`${formatNumber(records.reduce((s,r)=>s+r.area,0))} ha`;
  const container=$("recentRecords");container.innerHTML=records.length?records.slice(0,4).map(recordCard).join(""):`<div class="empty-state"><strong>Belum ada catatan pemupukan</strong>Mulai dari kalkulator untuk menyimpan perhitungan pertama Anda.</div>`;
  bindRecordActions(container);
}
function renderRecords(){
  if(!currentUser)return;const query=($("searchRecords")?.value||"").trim().toLowerCase();
  const records=getRecords().filter(r=>[r.name,r.palmAge,...r.fertilizers.map(f=>f.name)].join(" ").toLowerCase().includes(query));
  const container=$("allRecords");
  container.innerHTML=records.length?records.map(recordCard).join(""):`<div class="empty-state"><strong>${query?"Catatan tidak ditemukan":"Belum ada catatan"}</strong>${query?"Coba kata kunci lain.":"Hasil perhitungan yang disimpan akan muncul di sini."}</div>`;
  bindRecordActions(container);
}
$("searchRecords").addEventListener("input",renderRecords);
$("exportCsv").addEventListener("click",()=>{
  const records=getRecords();if(!records.length){showToast("Belum ada catatan untuk diekspor.");return}
  const rows=[["Nama catatan","Tanggal","Luas (ha)","Status tanaman","Jumlah pokok","Aplikasi ke","Jenis pupuk","Dosis (kg/pokok)","Kebutuhan (kg)","Harga (Rp/kg)","Biaya (Rp)","Total kebutuhan (kg)","Total biaya (Rp)","Catatan"]];
  records.forEach(r=>r.fertilizers.forEach(f=>rows.push([r.name,new Date(r.date).toLocaleDateString("id-ID"),r.area,r.palmAge,r.palms,r.application,f.name,f.dose,f.kg,f.price,f.cost,r.totalKg,r.totalCost,r.notes||""])));
  const csv=rows.map(row=>row.map(value=>`"${String(value??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="catatan-pemupukan-sawit.csv";a.click();URL.revokeObjectURL(url);showToast("File CSV berhasil disiapkan.");
});
$("year").textContent=new Date().getFullYear();
addFertilizerRow("Urea",1,6500);addFertilizerRow("NPK",2,12000);
const session=localStorage.getItem(SESSION_KEY);
if(session){const user=getUsers().find(u=>u.username===session);if(user)enterApp(user);else setAuthMode(false)}else setAuthMode(false);
