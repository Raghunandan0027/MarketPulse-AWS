/* MarketPulse frontend
   Demo mode uses sample data and browser localStorage.
   Set CONFIG.apiBaseUrl to your deployed API Gateway URL to attempt API reads.
   Never place AWS credentials or provider secrets in frontend code.
*/
const CONFIG = {
  apiBaseUrl: "", // Example: https://xxxx.execute-api.ap-south-1.amazonaws.com/prod
  requestTimeoutMs: 8000
};

const ADMIN = { username: "admin", password: "1234" }; // Demo-only; not secure authentication.
const STOCK_DATA = [
 {ticker:"AAPL",name:"Apple Inc.",price:173.50,change:1.2},{ticker:"MSFT",name:"Microsoft Corp.",price:416.42,change:.8},
 {ticker:"NVDA",name:"NVIDIA Corp.",price:881.86,change:3.5},{ticker:"GOOGL",name:"Alphabet Inc.",price:153.34,change:-.4},
 {ticker:"AMZN",name:"Amazon.com Inc.",price:180.38,change:1.1},{ticker:"META",name:"Meta Platforms",price:497.37,change:2.1},
 {ticker:"BRK.B",name:"Berkshire Hathaway",price:405.12,change:.3},{ticker:"LLY",name:"Eli Lilly & Co.",price:765.20,change:-1.2},
 {ticker:"AVGO",name:"Broadcom Inc.",price:1324.50,change:1.8},{ticker:"JPM",name:"JPMorgan Chase",price:196.40,change:.5},
 {ticker:"TSLA",name:"Tesla Inc.",price:171.05,change:-2.3},{ticker:"WMT",name:"Walmart Inc.",price:60.25,change:.1},
 {ticker:"XOM",name:"Exxon Mobil",price:119.30,change:1.4},{ticker:"UNH",name:"UnitedHealth",price:460.10,change:-.8},
 {ticker:"MA",name:"Mastercard Inc.",price:472.15,change:.6},{ticker:"V",name:"Visa Inc.",price:278.40,change:.4},
 {ticker:"PG",name:"Procter & Gamble",price:156.20,change:.2},{ticker:"JNJ",name:"Johnson & Johnson",price:153.80,change:-.3},
 {ticker:"HD",name:"Home Depot",price:360.50,change:-.1},{ticker:"ORCL",name:"Oracle Corp.",price:125.60,change:1.5},
 {ticker:"COST",name:"Costco Wholesale",price:730.40,change:.9},{ticker:"MRK",name:"Merck & Co.",price:128.75,change:-.4},
 {ticker:"ABBV",name:"AbbVie Inc.",price:168.90,change:.7},{ticker:"CVX",name:"Chevron Corp.",price:160.20,change:1.1},
 {ticker:"CRM",name:"Salesforce Inc.",price:300.25,change:-1.5},{ticker:"AMD",name:"Advanced Micro Devices",price:165.40,change:4.2},
 {ticker:"BAC",name:"Bank of America",price:37.80,change:.5},{ticker:"KO",name:"Coca-Cola Co.",price:59.30,change:.1},
 {ticker:"NFLX",name:"Netflix Inc.",price:620.10,change:2.4},{ticker:"PEP",name:"PepsiCo Inc.",price:168.45,change:-.2},
 {ticker:"ADBE",name:"Adobe Inc.",price:480.20,change:-2.1},{ticker:"LIN",name:"Linde plc",price:450.60,change:.6},
 {ticker:"CSCO",name:"Cisco Systems",price:48.90,change:.3},{ticker:"TMO",name:"Thermo Fisher Scientific",price:580.40,change:1},
 {ticker:"ACN",name:"Accenture plc",price:330.15,change:-.7},{ticker:"ABT",name:"Abbott Laboratories",price:110.25,change:.4},
 {ticker:"NVS",name:"Novartis AG",price:95.60,change:.2},{ticker:"SHEL",name:"Shell plc",price:70.40,change:1.2},
 {ticker:"MCD",name:"McDonald's",price:270.80,change:-.5},{ticker:"TMUS",name:"T-Mobile US",price:162.30,change:.8},
 {ticker:"DHR",name:"Danaher Corp.",price:250.60,change:-.9},{ticker:"IBM",name:"IBM",price:190.45,change:1.1},
 {ticker:"DIS",name:"Walt Disney Co.",price:115.80,change:-1.4},{ticker:"CMCSA",name:"Comcast Corp.",price:40.20,change:.5},
 {ticker:"PFE",name:"Pfizer Inc.",price:26.50,change:-.3},{ticker:"AMGN",name:"Amgen Inc.",price:275.60,change:.7},
 {ticker:"INTU",name:"Intuit Inc.",price:640.20,change:1.3},{ticker:"UBER",name:"Uber Technologies",price:75.40,change:2.8},
 {ticker:"QCOM",name:"Qualcomm Inc.",price:168.50,change:1.6},{ticker:"TXN",name:"Texas Instruments",price:165.20,change:-.4}
];

const DEFAULT_RATES = { USD:1, INR:83.2, EUR:.92, GBP:.79, JPY:151.2, CAD:1.36, AUD:1.52 };
const DEFAULT_ASSETS = { gold:6200, silver:75, oil:87, bitcoin:63400 };
function loadJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === "object" ? v : structuredClone(fallback); }
  catch { return structuredClone(fallback); }
}
const AppState = {
  rates: loadJSON("mp_rates", DEFAULT_RATES),
  assets: loadJSON("mp_assets", DEFAULT_ASSETS),
  logs: loadJSON("mp_logs", []),
  role: "guest",
  chart: null,
  overviewChart: null,
  investmentChart: null,
  apiMode: false,
  addLog(message) {
    this.logs.unshift({ time:new Date().toLocaleString(), message });
    this.logs = this.logs.slice(0,100);
    localStorage.setItem("mp_logs", JSON.stringify(this.logs));
    UI.renderLogs();
  }
};
const $ = id => document.getElementById(id);
const money = (value, currency="USD") => new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(value);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const UI = {
  init(role) {
    AppState.role = role;
    $("login-screen").classList.add("hidden");
    $("dashboard").classList.remove("hidden");
    $("role-label").textContent = role === "admin" ? "Administrator" : "Guest user";
    $("role-avatar").textContent = role === "admin" ? "A" : "G";
    $("today-label").textContent = new Date().toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
    $("nav-admin").classList.toggle("hidden", role !== "admin");
    $("data-mode").textContent = "Demo data mode";
    $("market-status-text").textContent = "Sample snapshot";
    this.updateCards(); this.fillDropdowns(); this.renderStocks(); this.renderLogs(); this.renderRates(); this.renderMovers();
    this.showTab("overview");
    this.renderOverviewChart(); this.renderMarketChart(); Logic.calcEMI(); Logic.calcInvestment();
    this.tryLoadCloudData();
  },
  showTab(tabId) {
    const pane = $("tab-"+tabId);
    if (!pane || (tabId === "admin" && AppState.role !== "admin")) return;
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.add("hidden"));
    document.querySelectorAll(".nav-btn[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === tabId));
    pane.classList.remove("hidden");
    const titles = {overview:"Market overview",stocks:"Stock watchlist",converter:"Currency converter",emi:"Loan EMI planner",investment:"Investment planner",market:"Market analysis",admin:"Admin & audit"};
    $("page-title").textContent = titles[tabId] || "MarketPulse";
    if (tabId === "market") this.renderMarketChart();
    if (tabId === "overview") this.renderOverviewChart();
  },
  fillDropdowns() {
    const codes = Object.keys(AppState.rates);
    ["convert-from","convert-to"].forEach(id => {
      const select = $(id), old = select.value;
      select.innerHTML = codes.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
      if (codes.includes(old)) select.value = old;
    });
    $("convert-from").value = codes.includes("INR") ? "INR" : codes[0];
    $("convert-to").value = codes.includes("USD") ? "USD" : codes[0];
    const options = STOCK_DATA.map(s=>`<option value="${s.ticker}">${s.ticker} — ${escapeHTML(s.name)}</option>`).join("") +
      `<option value="BTC">BTC — Bitcoin</option><option value="GOLD">GOLD — Gold</option>`;
    ["overview-symbol","market-symbol"].forEach(id => { const el=$(id); const old=el.value; el.innerHTML=options; if(old) el.value=old; });
    $("market-symbol").value = "BTC";
  },
  updateCards() {
    $("gold-price").textContent = `₹${Number(AppState.assets.gold).toLocaleString("en-IN")}/g`;
    $("silver-price").textContent = `₹${Number(AppState.assets.silver).toLocaleString("en-IN")}/g`;
    $("oil-price").textContent = `$${Number(AppState.assets.oil).toLocaleString("en-US")}`;
    $("btc-price").textContent = `$${Number(AppState.assets.bitcoin).toLocaleString("en-US")}`;
  },
  renderStocks(filter="") {
    const query = filter.trim().toLowerCase();
    const rows = STOCK_DATA.filter(s => `${s.ticker} ${s.name}`.toLowerCase().includes(query));
    $("stocks-body").innerHTML = rows.map(s => `<tr>
      <td><span class="ticker-badge">${escapeHTML(s.ticker)}</span></td><td>${escapeHTML(s.name)}</td>
      <td>${money(s.price)}</td><td class="${s.change>=0?"pos-change":"neg-change"}"><i class="fa-solid ${s.change>=0?"fa-arrow-trend-up":"fa-arrow-trend-down"}"></i> ${s.change>0?"+":""}${s.change.toFixed(2)}%</td>
      <td><button class="table-action" data-chart-symbol="${escapeHTML(s.ticker)}">View chart</button></td></tr>`).join("");
    $("stock-count").textContent = `${rows.length} of ${STOCK_DATA.length} stocks`;
  },
  renderMovers() {
    const movers = [...STOCK_DATA].sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)).slice(0,5);
    $("top-movers").innerHTML = movers.map(s=>`<div class="mover-row"><div class="mover-symbol">${escapeHTML(s.ticker.slice(0,2))}</div><div class="mover-name"><strong>${escapeHTML(s.ticker)}</strong><small>${escapeHTML(s.name)}</small></div><span class="${s.change>=0?"pos-change":"neg-change"}">${s.change>0?"+":""}${s.change.toFixed(2)}%</span></div>`).join("");
  },
  renderRates() {
    $("rates-list").innerHTML = Object.entries(AppState.rates).map(([code,rate])=>`<div class="rate-row"><span>${escapeHTML(code)}</span><strong>${Number(rate).toLocaleString("en-US",{maximumFractionDigits:4})}</strong><small>per USD base</small></div>`).join("");
  },
  renderLogs() {
    $("admin-logs").innerHTML = AppState.logs.length ? AppState.logs.map(log=>{
      const item = typeof log === "string" ? {time:"Earlier",message:log} : log;
      return `<li><span>${escapeHTML(item.message)}</span><small>${escapeHTML(item.time)}</small></li>`;
    }).join("") : "<li class='empty-state'>No activity yet. Admin actions will appear here.</li>";
  },
  historyFor(symbol, count=7) {
    let base, drift;
    if(symbol === "BTC") { base=AppState.assets.bitcoin; drift=.018; }
    else if(symbol === "GOLD") { base=AppState.assets.gold; drift=.008; }
    else { const stock=STOCK_DATA.find(s=>s.ticker===symbol); base=stock?stock.price:100; drift=.025; }
    return Array.from({length:count},(_,i)=>{
      const wave = Math.sin((i+1)*1.37)*drift + Math.cos((i+2)*.63)*drift*.55;
      return Math.max(.01,base*(1+wave+(i-count+1)*drift*.13));
    });
  },
  symbolDetails(symbol) {
    if(symbol==="BTC") return {name:"Bitcoin (BTC)",price:AppState.assets.bitcoin};
    if(symbol==="GOLD") return {name:"Gold",price:AppState.assets.gold};
    const s=STOCK_DATA.find(x=>x.ticker===symbol);
    return s ? {name:`${s.name} (${s.ticker})`,price:s.price} : {name:symbol,price:0};
  },
  makeChart(canvasId, chartKey, symbol, count) {
    if (typeof Chart === "undefined") return;
    const details=this.symbolDetails(symbol), values=this.historyFor(symbol,count);
    const labels=Array.from({length:count},(_,i)=> count===7 ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i] : `T-${count-i-1}`);
    if(AppState[chartKey]) AppState[chartKey].destroy();
    AppState[chartKey]=new Chart($(canvasId),{
      type:"line",
      data:{labels,datasets:[{label:`${symbol} sample trend`,data:values,borderColor:"#4f6df5",backgroundColor:"rgba(79,109,245,.12)",fill:true,tension:.32,pointRadius:2.5,pointHoverRadius:5,borderWidth:2}]},
      options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:"index"},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${money(c.parsed.y, symbol==="GOLD"?"INR":"USD")}`}}},scales:{x:{grid:{display:false},ticks:{color:"#8490a4"}},y:{grid:{color:"rgba(148,163,184,.18)"},ticks:{color:"#8490a4",callback:v=>Number(v).toLocaleString("en-US",{maximumFractionDigits:2})}}}}
    });
    return details;
  },
  renderOverviewChart() {
    const symbol=$("overview-symbol").value || "AAPL";
    this.makeChart("overviewChart","overviewChart",symbol,7);
  },
  renderMarketChart() {
    const symbol=$("market-symbol").value || "BTC", count=Number($("market-range").value || 7);
    const details=this.makeChart("marketChart","chart",symbol,count);
    if(details) { $("selected-symbol-name").textContent=details.name; $("selected-symbol-price").textContent=money(details.price,symbol==="GOLD"?"INR":"USD"); }
  },
  renderInvestmentChart(invested, future, years) {
    if(typeof Chart==="undefined") return;
    if(AppState.investmentChart) AppState.investmentChart.destroy();
    const principal=Number($("inv-amount").value), monthly=Number($("inv-monthly").value), rate=Number($("inv-rate").value)/100;
    const labels=[], values=[];
    for(let y=0;y<=years;y++){labels.push(`${y}y`); const n=y*12, r=rate/12; const fv=r===0?principal+monthly*n:principal*Math.pow(1+r,n)+monthly*((Math.pow(1+r,n)-1)/r); values.push(Math.max(0,fv));}
    AppState.investmentChart=new Chart($("investmentChart"),{type:"line",data:{labels,datasets:[{data:values,borderColor:"#10b981",backgroundColor:"rgba(16,185,129,.12)",fill:true,tension:.3,pointRadius:2,label:"Projected value"}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{ticks:{callback:v=>"₹"+Number(v).toLocaleString("en-IN")}}}}});
  },
  async tryLoadCloudData() {
    if(!CONFIG.apiBaseUrl) return;
    $("data-mode").textContent="Connecting to AWS API…";
    try {
      const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),CONFIG.requestTimeoutMs);
      const response=await fetch(`${CONFIG.apiBaseUrl.replace(/\/$/,"")}/stocks`,{headers:{Accept:"application/json"},signal:controller.signal});
      clearTimeout(timer);
      if(!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      const payload=await response.json();
      const records=Array.isArray(payload)?payload:(payload.stocks||payload.items||payload.data);
      if(!Array.isArray(records)) throw new Error("API JSON did not contain a stock array");
      const mapped=records.map(r=>({ticker:String(r.ticker||r.symbol||r.PK||"").replace("STOCK#",""),name:String(r.name||r.company||r.symbol||r.ticker||"Unknown"),price:Number(r.price||r.close||r.lastPrice),change:Number(r.changePct??r.change??0)})).filter(r=>r.ticker && Number.isFinite(r.price) && r.price>0);
      if(!mapped.length) throw new Error("No valid stock records returned");
      // Keep the provided watchlist if the endpoint returns a different schema.
      STOCK_DATA.splice(0,STOCK_DATA.length,...mapped);
      this.apiMode=true; $("data-mode").textContent="AWS API connected"; $("market-status-text").textContent="API data received";
      $("overview-chart-note").textContent="API records received. Historical chart remains illustrative unless a history endpoint is connected.";
      this.renderStocks($("stock-search").value); this.renderMovers(); this.fillDropdowns(); this.renderOverviewChart(); this.renderMarketChart();
      AppState.addLog(`Loaded ${mapped.length} stock records from configured API.`);
    } catch(err) {
      $("data-mode").textContent="Demo fallback active"; $("market-status-text").textContent="API unavailable";
      AppState.addLog(`AWS API unavailable; using demo data (${err.message}).`);
    }
  }
};

const Logic = {
  convert(e) {
    if(e) e.preventDefault();
    const amount=Number($("convert-amount").value), from=$("convert-from").value, to=$("convert-to").value;
    if(!Number.isFinite(amount)||amount<0||!from||!to) { $("convert-result").textContent="Enter a valid amount"; return; }
    const result=(amount/AppState.rates[from])*AppState.rates[to];
    $("convert-result").textContent=new Intl.NumberFormat("en-IN",{style:"currency",currency:to==="BTC"?"USD":(to.length===3?to:"USD"),maximumFractionDigits:2}).format(to==="BTC"?result:result);
    $("convert-detail").textContent=`${amount.toLocaleString()} ${from} × configured rate. Demo rates only.`;
  },
  calcEMI(e) {
    if(e) e.preventDefault();
    const P=Number($("loan-amount").value), annual=Number($("loan-rate").value), n=Number($("loan-time").value);
    if(!Number.isFinite(P)||P<=0||!Number.isFinite(annual)||annual<0||!Number.isInteger(n)||n<1) return;
    const r=annual/1200, emi=r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    const total=emi*n, interest=total-P;
    $("emi-result").textContent=money(emi,"INR"); $("emi-principal").textContent=money(P,"INR");
    $("emi-interest").textContent=money(interest,"INR"); $("emi-total").textContent=money(total,"INR");
  },
  calcInvestment(e) {
    if(e) e.preventDefault();
    const P=Number($("inv-amount").value), monthly=Number($("inv-monthly").value), annual=Number($("inv-rate").value), years=Number($("inv-years").value);
    if(![P,monthly,annual,years].every(Number.isFinite)||P<0||monthly<0||annual<=-1200||years<1||years>60) return;
    const n=Math.round(years*12), r=annual/1200;
    const future=r===0?P+monthly*n:P*Math.pow(1+r,n)+monthly*((Math.pow(1+r,n)-1)/r);
    const invested=P+monthly*n, growth=future-invested;
    $("inv-result").textContent=money(future,"INR"); $("inv-invested").textContent=money(invested,"INR");
    $("inv-growth").textContent=money(growth,"INR"); $("inv-return-label").textContent=`${annual}% yearly`;
    UI.renderInvestmentChart(invested,future,years);
  },
  updateRate(e) {
    e.preventDefault();
    const code=$("admin-currency-code").value.trim().toUpperCase(), rate=Number($("admin-currency-rate").value);
    if(!/^[A-Z]{3,8}$/.test(code)||!Number.isFinite(rate)||rate<=0){alert("Enter a valid currency code and positive rate.");return;}
    AppState.rates[code]=rate; localStorage.setItem("mp_rates",JSON.stringify(AppState.rates));
    UI.fillDropdowns(); UI.renderRates(); Logic.convert(); AppState.addLog(`Currency rate updated: ${code} = ${rate} per USD base.`);
    $("admin-rate-form").reset(); alert("Demo rate saved in this browser.");
  },
  updateAsset(e) {
    e.preventDefault();
    const name=$("admin-asset-name").value, price=Number($("admin-asset-price").value);
    if(!(name in AppState.assets)||!Number.isFinite(price)||price<=0){alert("Select a supported asset and enter a positive price.");return;}
    AppState.assets[name]=price; localStorage.setItem("mp_assets",JSON.stringify(AppState.assets));
    UI.updateCards(); UI.renderOverviewChart(); UI.renderMarketChart(); AppState.addLog(`${name} demo price updated to ${price}.`);
    $("admin-asset-form").reset(); alert("Demo asset price saved in this browser.");
  }
};

window.addEventListener("DOMContentLoaded",()=>{
  $("login-form").addEventListener("submit",e=>{
    e.preventDefault();
    if($("username").value.trim()===ADMIN.username && $("password").value===ADMIN.password) UI.init("admin");
    else alert("Invalid demo credentials. Use the configured admin demo login or continue as guest.");
  });
  $("guest-login-btn").addEventListener("click",()=>UI.init("guest"));
  $("logout-btn").addEventListener("click",()=>location.reload());
  document.querySelector(".sidebar-nav").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)UI.showTab(b.dataset.tab);});
  document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>UI.showTab(b.dataset.goto)));
  $("stock-search").addEventListener("input",e=>UI.renderStocks(e.target.value));
  $("stocks-body").addEventListener("click",e=>{const b=e.target.closest("[data-chart-symbol]");if(b){UI.showTab("market");$("market-symbol").value=b.dataset.chartSymbol;UI.renderMarketChart();}});
  $("overview-symbol").addEventListener("change",()=>UI.renderOverviewChart());
  $("market-symbol").addEventListener("change",()=>UI.renderMarketChart());
  $("market-range").addEventListener("change",()=>UI.renderMarketChart());
  $("converter-form").addEventListener("submit",Logic.convert);
  ["convert-amount","convert-from","convert-to"].forEach(id=>$(id).addEventListener(id==="convert-amount"?"input":"change",()=>Logic.convert()));
  $("swap-currencies").addEventListener("click",()=>{const a=$("convert-from").value;$("convert-from").value=$("convert-to").value;$("convert-to").value=a;Logic.convert();});
  $("emi-form").addEventListener("submit",Logic.calcEMI);
  $("investment-form").addEventListener("submit",Logic.calcInvestment);
  $("admin-rate-form").addEventListener("submit",Logic.updateRate);
  $("admin-asset-form").addEventListener("submit",Logic.updateAsset);
  $("clear-logs-btn").addEventListener("click",()=>{if(confirm("Clear browser-local activity log?")){AppState.logs=[];localStorage.setItem("mp_logs","[]");UI.renderLogs();}});
  $("convert-amount").value="100";
});
