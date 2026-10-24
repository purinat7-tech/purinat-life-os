import{a3 as u,a4 as $,ad as g,ac as h,ae as y,af as _,ag as f,x as O,ah as j,ai as v,aj as w,ak as T,al as k,k as t,F as D,r as b}from"./index-DBmcO55G.js";const P=async({today:o})=>{const[l,p,m]=await Promise.all([u(),$(),g()]),i=[...l].sort((a,e)=>{const n=a.start_date==="TODO"?"0000":a.start_date;return(e.start_date==="TODO"?"0000":e.start_date).localeCompare(n)||a.name.localeCompare(e.name)});return{title:"Journeys · MILES",section:"miles",body:t`
      ${h("/miles/journeys","Journeys","One card per trip. The same country twice is two journeys.")}
      <div class="cards">
        ${i.length?i.map(a=>{const e=p.filter(s=>s.trip_id===a.id),n=e.find(s=>s.id===a.hero_place_id)??e.find(y),r=m.filter(s=>s.trip_id===a.id),d=_(a,o),c=f(a,o);return t`<a class="card journey-card card-link" href="${O(`/miles/journeys/${a.id}`)}">
                ${j(n??{name:a.name,photo:"TODO",photo_alt:"TODO"},{className:"wide"})}
                <div class="body">
                  <span class="muted"><span aria-hidden="true">${v(a.country_code)}</span> ${w(a.country_code)} · ${T(a.start_date,a.end_date)}</span>
                  <h2 class="jc-title">${a.name}</h2>
                  <span class="muted">${k(e)}${d!==null?` · ${d} days`:""}${c==="planned"?" · planned":c==="ongoing"?" · now":""}</span>
                  ${r.length?t`<div class="row">${r.map(s=>t`<span class="badge muted">Race · ${s.name}</span>`)}</div>`:""}
                  ${a.tags.length?t`<div class="row mt">${a.tags.map(s=>t`<span class="tag">${D(s)}</span>`)}</div>`:""}
                </div>
              </a>`}):b("No data yet","Add a trip to data/trips.json.")}
      </div>
    `}};export{P as default};
