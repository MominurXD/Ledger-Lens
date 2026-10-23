const $=id=>document.getElementById(id);
const STORAGE_KEY='ledger-lens-progress-v1';
const ACTIVITY_IDS=new Set(['pnl','balance_sheet','cash_flow','ratios','budgeting','breakeven','ratioLab','breakEven']);
function loadProgress(){
  try {
    const saved=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'{}');
    return {
      done:new Set(Array.isArray(saved.done)?saved.done.filter(id=>ACTIVITY_IDS.has(id)):[]),
      caseDone:saved.caseDone===true,
      quizDone:saved.quizDone===true
    };
  } catch {
    return {done:new Set(),caseDone:false,quizDone:false};
  }
}
const state=loadProgress();
function saveProgress(){
  try {
    sessionStorage.setItem(STORAGE_KEY,JSON.stringify({
      done:[...state.done],caseDone:state.caseDone,quizDone:state.quizDone
    }));
  } catch { /* The app still works when browser storage is disabled. */ }
}
function money(n){return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n)}
function pct(n){return n==null?'—':(n*100).toFixed(1)+'%'}
function updateProgress(){const total=10;const done=state.done.size+(state.caseDone?1:0)+(state.quizDone?1:0);const p=Math.min(100,Math.round(done/total*100));$('progressText').textContent=p+'%';$('progressBar').style.width=p+'%';saveProgress()}
async function getJSON(url,opts){const r=await fetch(url,opts);const b=await r.json();if(!r.ok){const detail=Array.isArray(b.detail)?b.detail.map(x=>x.msg).join('; '):b.detail;throw new Error(typeof detail==='string'?detail:'Request failed')}return b}
function switchTab(id){document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));document.querySelectorAll('.panel-section').forEach(s=>s.classList.toggle('active-section',s.id===id))}
document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
async function loadLessons(){const lessons=await getJSON('/api/lessons');$('lessonGrid').innerHTML=lessons.map(x=>`<article class="card lesson"><small>MODULE ${String(lessons.indexOf(x)+1).padStart(2,'0')}</small><h3>${x.title}</h3><p>${x.summary}</p><ul>${x.points.map(p=>`<li>${p}</li>`).join('')}</ul><button data-id="${x.id}" class="${state.done.has(x.id)?'done':''}" ${state.done.has(x.id)?'disabled':''}>${state.done.has(x.id)?'Completed ✓':'Mark complete'}</button></article>`).join('');document.querySelectorAll('.lesson button').forEach(b=>b.addEventListener('click',()=>{state.done.add(b.dataset.id);b.textContent='Completed ✓';b.classList.add('done');b.disabled=true;updateProgress()}))}
$('ratioForm').addEventListener('submit',async e=>{e.preventDefault();$('ratioError').textContent='';const payload={revenue:+$('revenue').value,cost_of_sales:+$('cos').value,operating_expenses:+$('opex').value,current_assets:+$('ca').value,current_liabilities:+$('cl').value,capital_employed:+$('capital').value};try{const r=await getJSON('/api/ratios',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});$('grossMargin').textContent=pct(r.gross_margin);$('operatingMargin').textContent=pct(r.operating_margin);$('currentRatio').textContent=r.current_ratio.toFixed(2)+'×';$('roce').textContent=pct(r.roce);$('liquidityText').textContent=r.current_ratio>=1?'Current assets exceed short-term liabilities.':'Short-term liabilities exceed current assets — investigate liquidity risk.';state.done.add('ratioLab');updateProgress()}catch(err){$('ratioError').textContent=err.message}});
$('beForm').addEventListener('submit',async e=>{e.preventDefault();$('beError').textContent='';const payload={fixed_costs:+$('fixedCosts').value,unit_price:+$('unitPrice').value,unit_variable_cost:+$('unitVariableCost').value};try{const r=await getJSON('/api/break-even',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});if(r.break_even_units==null)throw new Error('Selling price must be higher than variable cost.');$('contribution').textContent='£'+r.contribution_per_unit.toFixed(2);$('contributionMargin').textContent=pct(r.contribution_margin);$('breakEvenUnits').textContent=Math.ceil(r.break_even_units).toLocaleString('en-GB')+' units';state.done.add('breakEven');updateProgress()}catch(err){$('beError').textContent=err.message;$('contribution').textContent='—';$('contributionMargin').textContent='—';$('breakEvenUnits').textContent='—'}});
async function loadCase(){const c=await getJSON('/api/case');const b=c.budget,a=c.actual;const rows=[['Revenue',b.revenue,a.revenue,a.revenue-b.revenue,false],['Cost of sales',b.cost_of_sales,a.cost_of_sales,a.cost_of_sales-b.cost_of_sales,true],['Operating expenses',b.operating_expenses,a.operating_expenses,a.operating_expenses-b.operating_expenses,true],['Operating profit',c.analysis.operating_profit_budget,c.analysis.operating_profit_actual,c.analysis.operating_profit_variance,false]];$('caseTable').innerHTML=rows.map(r=>{const favorable=r[4]?r[3]<=0:r[3]>=0;return `<tr><td>${r[0]}</td><td>${money(r[1])}</td><td>${money(r[2])}</td><td class="${favorable?'positive':'negative'}">${r[3]>=0?'+':''}${money(r[3])}</td></tr>`}).join('');$('caseChoices').innerHTML=['Cost of sales is below budget, so performance is strong.','Revenue is below budget and operating expenses are above budget; investigate both drivers.','Immediately cut all discretionary spending.'].map((x,i)=>`<label class="choice"><input type="radio" name="case" value="${i}"><span>${x}</span></label>`).join('');const d=c.drivers;$('drivers').innerHTML=`<div class="card"><small>SALES VOLUME</small><strong>${d.sales_volume_change_pct}%</strong></div><div class="card"><small>AVG. SELLING PRICE</small><strong>${d.average_selling_price_change_pct}%</strong></div><div class="card"><small>PAYROLL VARIANCE</small><strong>${money(d.payroll_variance)}</strong></div><div class="card"><small>INVENTORY DAYS</small><strong>${d.inventory_days_budget} → ${d.inventory_days_actual}</strong></div>`}
$('checkCase').addEventListener('click',()=>{const x=document.querySelector('input[name="case"]:checked');if(!x){$('caseFeedback').textContent='Choose an answer first.';return}if(x.value==='1'){$('caseFeedback').innerHTML='<b>Correct.</b> Operating profit is materially below plan. The strongest starting point is to investigate the revenue shortfall and operating-expense overspend, then trace those variances to operational drivers such as volume, pricing, payroll and marketing.';state.caseDone=true;updateProgress()}else{$('caseFeedback').innerHTML='<b>Not quite.</b> A finance or business analyst should start with the largest adverse drivers and understand why they occurred before recommending action.'}});
async function loadQuiz(){const q=await getJSON('/api/quiz');$('quizForm').innerHTML=q.map((x,i)=>`<div class="card question"><small>QUESTION ${i+1}</small><h3>${x.question}</h3><select name="${x.id}"><option value="">Choose an answer…</option>${x.choices.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>`).join('')+'<button type="submit">Submit quiz →</button>';$('quizForm').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget),answers={};q.forEach(x=>answers[x.id]=f.get(x.id)||'');let r;try{r=await getJSON('/api/quiz',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({answers})})}catch(err){$('quizResult').textContent=err.message;$('quizResult').classList.add('error');return}$('quizResult').classList.remove('error');$('quizResult').innerHTML=`<div class="card"><small>RESULT</small><strong>${r.score}/${r.total} · ${r.percentage}%</strong>${r.results.map((x,i)=>`<p><b>Q${i+1} ${x.correct?'✓':'✕'}</b> ${x.explanation}</p>`).join('')}</div>`;if(r.percentage>=80){state.quizDone=true;updateProgress()}})}
function showLoadError(target,error){
  const element=$(target);
  element.textContent='Unable to load this section: '+error.message;
  element.classList.add('error');
}
loadLessons().catch(e=>showLoadError('lessonGrid',e));
loadCase().catch(e=>showLoadError('caseChoices',e));
loadQuiz().catch(e=>showLoadError('quizForm',e));
updateProgress();
