import{a5 as u,at as b,au as y,av as f,k as e,r as _,x as v,aw as k,M as r,ai as D,ax as l,aj as w,ay as B,an as $,az as E}from"./index-DBmcO55G.js";const d={NEXT:{title:"Next",badge:"badge solid",hint:"Being planned"},CONDITIONAL:{title:"Conditional",badge:"badge accent",hint:"Depends on something"},BACKUP:{title:"Backup",badge:"badge dashed",hint:"Plan B for another dream"},DREAM:{title:"Dream",badge:"badge muted",hint:"Someday"}},S=async({today:m})=>{const t=await u(),h=new Map(t.map(a=>[a.id,a])),o=a=>`${a.destination}${r(a.target_year)?` ${a.target_year}`:""}`,g=a=>{const n=k(a,m),s=a.backup_of?h.get(a.backup_of):void 0,c=t.filter(i=>i.backup_of===a.id);return e`<article class="card dream" id="${a.id}">
      <div class="row" style="justify-content:space-between"><span class="${d[a.status].badge}">${a.status}</span>${r(a.priority)?e`<span class="tag">Priority ${a.priority}</span>`:""}</div>
      <h3><span aria-hidden="true">${D(a.country_code)}</span> ${a.destination}</h3>
      <p class="when">${l(a)} <span class="muted">· ${w(a.country_code)}</span></p>
      ${n!==null?e`<p><span class="countdown" style="font-size:2rem">${n}</span> <span class="muted">days to ${l(a)}</span></p>`:""}
      <dl class="kv">
        <dt>Budget</dt><dd>${B(a.budget_thb_per_person)}</dd>
        <dt>Priority</dt><dd>${r(a.priority)?a.priority:$(a.priority)?"TODO":"—"}</dd>
      </dl>
      ${a.depends_on||s||c.length?e`<div class="links">
            ${a.depends_on?e`<span>Depends on: <strong>${a.depends_on}</strong></span>`:""}
            ${s?e`<span>Backup for <a href="#${s.id}">${o(s)}</a></span>`:""}
            ${c.map(i=>e`<span>Backup plan: <a href="#${i.id}">${o(i)}</a></span>`)}
          </div>`:""}
      ${a.notes&&!$(a.notes)?e`<p class="note">${a.notes}</p>`:""}
    </article>`},p=t.filter(a=>a.depends_on||t.some(n=>n.backup_of===a.id));return{title:"Dream Board",section:"dreams",body:e`
      ${b({eyebrow:"MILES · Dreams",title:"Dream Board",lead:"Where next, what it depends on, and the plan B."})}
      ${y(E,"/dreams","MILES sections")}
      ${t.length?e`<div class="board">${f.map(a=>{const n=t.filter(s=>s.status===a);return e`<section class="board-col" aria-labelledby="col-${a}">
              <h2 id="col-${a}"><span>${d[a].title}</span><span>${n.length}</span></h2>
              <div class="stack">${n.length?n.map(g):e`<p class="note">${d[a].hint}: none yet.</p>`}</div>
            </section>`})}</div>`:_("No data yet","Add dreams to data/dreams.json.")}
      ${p.length?e`<section class="section" aria-labelledby="dep-title">
            <div class="section-head"><h2 id="dep-title">Dependencies</h2></div>
            <div class="stack">${p.map(a=>{const n=t.filter(s=>s.backup_of===a.id);return e`<div class="card dep">
                <a href="#${a.id}"><strong>${o(a)}</strong></a>
                ${a.depends_on?e`<span><span class="arrow">depends on →</span> ${a.depends_on}</span>`:""}
                ${n.map(s=>e`<span><span class="arrow">if it does not happen →</span> <a href="#${s.id}"><strong>${o(s)}</strong></a></span>`)}
              </div>`})}</div>
          </section>`:""}
      <p class="note mt">Map markers for dreams are on <a href="${v("/miles")}">Explore</a>.</p>
    `}};export{S as default};
