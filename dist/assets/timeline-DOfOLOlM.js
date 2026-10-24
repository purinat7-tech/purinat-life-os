import{a3 as h,a4 as f,a5 as b,aq as k,k as a,ac as T,r as g,ak as w,x as v,ai as I,aj as N}from"./index-DBmcO55G.js";const A=async({today:l})=>{const[r,c,m]=await Promise.all([h(),f(),b()]),i=k(r,c,m,l),u=new Map(r.map(e=>[e.id,e])),p=l.slice(0,4);let t=!1;const d=a`<li class="today-line">Today</li>`,y=e=>{const s=e.kind==="trip"?u.get(e.id):void 0,n=s?w(s.start_date,s.end_date):e.when;let o=a``;return!t&&e.future&&e.sortKey&&(t=!0,o=d),a`${o}<li class="tl-item ${e.future?"future":""}">
      <a class="card card-link" href="${v(e.href)}">
        <span class="when">${n}${e.status?a` · <span class="badge ${e.status==="NEXT"?"solid":e.status==="CONDITIONAL"?"accent":e.status==="BACKUP"?"dashed":"muted"}">${e.status}</span>`:""}</span>
        <span class="title"><span aria-hidden="true">${I(e.countryCode)}</span> ${e.title}</span>
        <span class="note">${e.kind==="trip"?`Journey · ${N(e.countryCode)}`:"Dream"}${e.detail?` · ${e.detail}`:""}</span>
      </a>
    </li>`},$=e=>{const s=e.items.map(y);return!t&&e.key===p&&e.items.every(n=>!n.future)?(t=!0,a`${s}${d}`):a`${s}`};return{title:"Timeline · MILES",section:"miles",body:a`
      ${T("/miles/timeline","Timeline","Journeys by year, then the dreams still ahead.")}
      ${i.length?a`<div class="timeline">${i.map(e=>a`<section class="year" aria-labelledby="y-${e.key}">
              <h2 id="y-${e.key}">${e.label}</h2>
              <ol class="tl-items">${$(e)}</ol>
            </section>`)}</div>`:g("No data yet","Add trips and dreams to see the timeline.")}
    `}};export{A as default};
