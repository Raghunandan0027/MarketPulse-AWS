/* MarketPulse Elite add-ons: portfolio simulator, alerts, export, theme and demo refresh. */
(() => {
  const $ = id => document.getElementById(id);
  const read = (key, fallback) => { try { const x=JSON.parse(localStorage.getItem(key)); return Array.isArray(x)?x:fallback; } catch { return fallback; } };
  let holdings = read("mp_portfolio", []);
  let alerts = read("mp_alerts", []);
  const fmt = (n, currency="USD") => new Intl.NumberFormat("en-US",{style:"currency",currency,maximumFractionDigits:2}).format(Number(n)||0);
  const stockList = () => (typeof STOCK_DATA !== "undefined" ? STOCK_DATA : []);
  function getPrice(symbol) {
    if(symbol==="BTC") return Number(JSON.parse(localStorage.getItem("mp_assets")||"{}").bitcoin)||63400;
    if(symbol==="GOLD") return Number(JSON.parse(localStorage.getItem("mp_assets")||"{}").gold)||6200;
    const s=stockList().find(x=>x.ticker===symbol); return s ? Number(s.price) : 0;
  }
  function instrumentOptions() {
    const options = stockList().map(s=>`<option value="${s.ticker}">${s.ticker} — ${s.name}</option>`).join("") + `<option value="BTC">BTC — Bitcoin (sample)</option><option value="GOLD">GOLD — Gold (₹/g)</option>`;
    ["portfolio-symbol","alert-symbol"].forEach(id=>{const el=$(id);if(el)el.innerHTML=options;});
  }
  function renderPortfolio() {
    const body=$("portfolio-body"); if(!body)return;
    let cost=0,value=0;
    body.innerHTML=holdings.length?holdings.map((h,i)=>{
      const price=getPrice(h.symbol), val=price*h.quantity; cost+=h.cost; value+=val;
      return `<tr><td><span class="ticker-badge">${h.symbol}</span></td><td>${Number(h.quantity).toLocaleString()}</td><td>${fmt(price,h.symbol==="GOLD"?"INR":"USD")}</td><td>${fmt(val,h.symbol==="GOLD"?"INR":"USD")}</td><td><button class="remove-item" data-remove-holding="${i}">Remove</button></td></tr>`;
    }).join(""):`<tr><td colspan="5" class="empty-state">No holdings yet. Add a simulated holding to get started.</td></tr>`;
    $("portfolio-value").textContent=fmt(value);
    $("portfolio-cost").textContent=fmt(cost);
    const pnl=value-cost, pct=cost?100*pnl/cost:0;
    $("portfolio-pnl").textContent=(pnl>=0?"+":"")+fmt(pnl);
    $("portfolio-pnl").classList.toggle("loss",pnl<0);
    $("portfolio-pnl-pct").textContent=`${pct>=0?"+":""}${pct.toFixed(2)}% simulated return`;
    localStorage.setItem("mp_portfolio",JSON.stringify(holdings));
  }
  function currentPriceLabel(symbol){return fmt(getPrice(symbol),symbol==="GOLD"?"INR":"USD");}
  function renderAlerts() {
    const list=$("alerts-list");if(!list)return;
    list.innerHTML=alerts.length?alerts.map((a,i)=>{
      const price=getPrice(a.symbol), triggered=a.condition==="above"?price>=a.target:price<=a.target;
      return `<li><span><span class="alert-chip">${triggered?"TRIGGERED":"ACTIVE"}</span><strong>${a.symbol}</strong> ${a.condition==="above"?"above":"below"} ${fmt(a.target,a.symbol==="GOLD"?"INR":"USD")}<small style="display:block;margin-top:5px">${triggered?`Current sample price: ${currentPriceLabel(a.symbol)}`:"Waiting for next manual refresh"}</small></span><button class="remove-item" data-remove-alert="${i}">Remove</button></li>`;
    }).join(""):`<li class="empty-state">No alerts configured. Create one to see how alert rules work.</li>`;
    localStorage.setItem("mp_alerts",JSON.stringify(alerts));
  }
  function exportCSV() {
    const rows=[["Symbol","Company","Price","ChangePercent"],...stockList().map(s=>[s.ticker,s.name,s.price,s.change])];
    const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="marketpulse-watchlist-demo.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  function toast(message) {
    let el=$("mp-toast");
    if(!el){el=document.createElement("div");el.id="mp-toast";el.className="mp-toast";document.body.appendChild(el);}
    el.textContent=message;el.classList.add("show");clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove("show"),2600);
  }
  function initExtras() {
    instrumentOptions();renderPortfolio();renderAlerts();
    $("portfolio-form")?.addEventListener("submit",e=>{
      e.preventDefault();const symbol=$("portfolio-symbol").value,quantity=Number($("portfolio-quantity").value),price=getPrice(symbol);
      if(!symbol||quantity<=0||price<=0){toast("Choose a valid instrument and quantity.");return;}
      holdings.push({symbol,quantity,cost:price*quantity,addedAt:new Date().toISOString()});renderPortfolio();toast(`${symbol} added to your simulated portfolio.`);
      if(typeof AppState!=="undefined")AppState.addLog(`Portfolio simulator: added ${quantity} ${symbol}.`);
    });
    $("portfolio-body")?.addEventListener("click",e=>{const b=e.target.closest("[data-remove-holding]");if(!b)return;holdings.splice(Number(b.dataset.removeHolding),1);renderPortfolio();});
    $("clear-portfolio-btn")?.addEventListener("click",()=>{if(confirm("Reset your simulated portfolio?")){holdings=[];renderPortfolio();toast("Portfolio reset.");}});
    $("alert-form")?.addEventListener("submit",e=>{
      e.preventDefault();const symbol=$("alert-symbol").value,condition=$("alert-condition").value,target=Number($("alert-target").value);
      if(!symbol||!Number.isFinite(target)||target<=0){toast("Enter a valid target price.");return;}
      alerts.push({symbol,condition,target,createdAt:new Date().toISOString()});renderAlerts();toast("Demo price alert created.");
      if(typeof AppState!=="undefined")AppState.addLog(`Price alert created for ${symbol} ${condition} ${target}.`);
    });
    $("alerts-list")?.addEventListener("click",e=>{const b=e.target.closest("[data-remove-alert]");if(!b)return;alerts.splice(Number(b.dataset.removeAlert),1);renderAlerts();});
    $("clear-alerts-btn")?.addEventListener("click",()=>{alerts=[];renderAlerts();toast("All demo alerts cleared.");});
    $("export-report-btn")?.addEventListener("click",exportCSV);
    $("theme-toggle-btn")?.addEventListener("click",()=>{document.body.classList.toggle("dark-mode");localStorage.setItem("mp_dark",document.body.classList.contains("dark-mode")?"1":"0");$("theme-toggle-btn").innerHTML=document.body.classList.contains("dark-mode")?'<i class="fa-solid fa-sun"></i>':'<i class="fa-solid fa-moon"></i>';});
    $("refresh-demo-btn")?.addEventListener("click",()=>{renderPortfolio();renderAlerts();if(typeof UI!=="undefined"){UI.updateCards();UI.renderMovers();UI.renderOverviewChart();UI.renderMarketChart();}toast("Demo dashboard refreshed. Sample prices are unchanged.");});
    if(localStorage.getItem("mp_dark")==="1"){document.body.classList.add("dark-mode");$("theme-toggle-btn").innerHTML='<i class="fa-solid fa-sun"></i>';}
  }
  const css=document.createElement("style");
  css.textContent='.mp-toast{position:fixed;right:24px;bottom:24px;z-index:9999;background:#142039;color:white;padding:13px 18px;border-radius:12px;box-shadow:0 12px 35px rgba(0,0,0,.2);font-size:.85rem;opacity:0;transform:translateY(8px);transition:.2s;pointer-events:none}.mp-toast.show{opacity:1;transform:translateY(0)}';
  document.head.appendChild(css);
  document.addEventListener("DOMContentLoaded",initExtras);
  // The base app initializes on login; refresh values once it becomes visible.
  document.addEventListener("click",e=>{if(e.target.closest(".nav-btn[data-tab='portfolio']"))renderPortfolio();if(e.target.closest(".nav-btn[data-tab='alerts']"))renderAlerts();});
})();
