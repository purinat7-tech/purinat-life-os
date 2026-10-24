import{a4 as m,a8 as r,ac as g,x as n,k as t,F as f,r as u}from"./index-DBmcO55G.js";import{p as $}from"./shared-CZ3pmquq.js";const P=async({query:i})=>{const e=await m(),c=i.get("category"),s=r.includes(c)?c:null,o=s?e.filter(a=>a.category.includes(s)):e,p=r.filter(a=>e.some(l=>l.category.includes(a))),h=e.filter(a=>a.photo&&a.photo!=="TODO").length,d=e.filter(a=>a.visit_confirmed).length;return{title:"Places · MILES",section:"miles",body:t`
      ${g("/miles/places","Places",`One hero photo per place. ${d} of ${e.length} visits confirmed · ${h} of ${e.length} photos added.`)}
      <nav class="chips scroll" aria-label="Filter by category">
        <a class="chip" href="${n("/miles/places")}" ${s===null?t`aria-current="true"`:""}>All <span class="count">${e.length}</span></a>
        ${p.map(a=>t`<a class="chip" href="${n(`/miles/places?category=${a}`)}" ${s===a?t`aria-current="true"`:""}>${f(a)} <span class="count">${e.filter(l=>l.category.includes(a)).length}</span></a>`)}
      </nav>
      <div class="photo-grid mt">${o.length?o.map(a=>$(a,2)):u("No data yet","Add places to data/places.json.")}</div>
    `}};export{P as default};
