import{k as s,x as c,ah as n,ai as l,an as o,n as r,ao as d,F as m}from"./index-DBmcO55G.js";function $(a,t=3){const e=t===2?s`<h2 class="pc-title">${a.name}</h2>`:s`<h3 class="pc-title">${a.name}</h3>`;return s`<a class="place-card" href="${c(`/miles/places/${a.id}`)}">
    ${n(a,{sizes:"(min-width: 900px) 33vw, 100vw"})}
    <div class="stack" style="gap:4px">
      ${e}
      <span class="meta"><span aria-hidden="true">${l(a.country_code)}</span> ${a.city}${o(a.visited_date)?"":` · ${r(a.visited_date)}`}</span>
      <span class="row" style="gap:6px">${a.visit_confirmed?d(a.rating):s`<span class="badge muted">Not confirmed</span>`}${a.category.slice(0,3).map(i=>s`<span class="tag">${m(i)}</span>`)}</span>
    </div>
  </a>`}export{$ as p};
