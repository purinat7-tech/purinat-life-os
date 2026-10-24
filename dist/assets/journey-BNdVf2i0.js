import{a3 as _,a4 as v,ad as O,N as T,ae as n,af as b,am as w,ac as D,ai as N,aj as P,ak as R,k as t,ah as k,f as o,an as d,M as j,z as c,r as x,F as z}from"./index-DBmcO55G.js";import{p as C}from"./shared-CZ3pmquq.js";const M=async({params:r,today:m})=>{const[p,g,u]=await Promise.all([_(),v(),O()]),a=p.find(s=>s.id===r.id);if(!a)throw new T(`trip ${r.id}`);const e=g.filter(s=>s.trip_id===a.id),$=e.find(s=>s.id===a.hero_place_id)??e.find(n),i=e.filter(n).length,l=u.filter(s=>s.trip_id===a.id),h=b(a,m),y=e.filter(s=>n(s)&&w(s)).length;return{title:`${a.name} · Journeys`,section:"miles",body:t`
      ${D("/miles/journeys",a.name,t`<span aria-hidden="true">${N(a.country_code)}</span> ${P(a.country_code)} · ${R(a.start_date,a.end_date)}`,"journey-title")}
      ${l.length?t`<div class="row" style="margin-bottom:12px">${l.map(s=>t`<span class="badge muted" title="Races are not counted in any travel statistic">Race · ${s.name}</span>`)}</div>`:""}
      ${k($??{name:a.name,photo:"TODO",photo_alt:"TODO"},{className:"wide",eager:!0})}
      <div class="tiles four mt">
        ${o("Days",h)}
        ${o("Places",i,{sub:e.length-i?`${e.length-i} to confirm`:void 0})}
        ${o("Areas",a.cities.length||null)}
        ${o("Road-trip km",j(a.road_trip_km)?a.road_trip_km:null,{sub:d(a.road_trip_km)?"TODO":void 0})}
      </div>
      ${a.summary&&!d(a.summary)?t`<p class="lead mt serif" style="font-size:1.35rem">${a.summary}</p>`:t`<p class="note mt">Summary TODO.</p>`}
      ${a.cities.length?c("Route",t`<ol class="row" style="list-style:none;padding:0;margin:0">${a.cities.map((s,f)=>t`<li class="tag">${f+1}. ${s}</li>`)}</ol>`):""}
      ${c("Places",e.length?t`${i<e.length?t`<p class="note" style="margin-bottom:12px">“Not confirmed” places are suggestions. They are not counted as visits until <span class="code">"visit_confirmed": true</span> is set.</p>`:""}<div class="photo-grid">${e.map(s=>C(s))}</div>`:x("No data yet","Places for this journey are TODO."),y?{path:`/miles?trip=${a.id}`,label:"See on the map"}:void 0)}
      ${e.length&&a.tags.length?t`<div class="row mt">${a.tags.map(s=>t`<span class="tag">${z(s)}</span>`)}</div>`:""}
    `}};export{M as default};
