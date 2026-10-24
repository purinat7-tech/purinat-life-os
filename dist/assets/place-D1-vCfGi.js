import{a4 as $,a3 as f,N as u,ap as _,ac as g,ai as v,aj as h,k as a,ah as y,an as r,x as o,F as b,n as N,ao as O,am as n,z as T}from"./index-DBmcO55G.js";const w=async({params:d})=>{const[l,c]=await Promise.all([$(),f()]),e=l.find(s=>s.id===d.id);if(!e)throw new u(`place ${d.id}`);const t=c.find(s=>s.id===e.trip_id),i=_(e.coord_source),m=[e.camera?["Camera",e.camera]:null,e.lens?["Lens",e.lens]:null,typeof e.focal_length_mm=="number"?["Focal length",`${e.focal_length_mm} mm`]:null,e.best_time?["Best time",e.best_time]:null].filter(s=>s!==null);return{title:`${e.name} · Places`,section:"miles",body:a`
      <div class="place-hero">${g("/miles/places",e.name,a`<span aria-hidden="true">${v(e.country_code)}</span> ${e.city}, ${h(e.country_code)}`)}</div>
      ${y(e,{className:"wide",eager:!0})}
      <div class="split mt">
        <div class="stack">
          ${r(e.memory)||!e.memory?a`<p class="note">Memory TODO.</p>`:a`<p class="quote">${e.memory}</p>`}
          <div class="row">${e.category.map(s=>a`<a class="tag" href="${o(`/miles/places?category=${s}`)}">${b(s)}</a>`)}</div>
        </div>
        <div class="card">
          <dl class="kv">
            <dt>Journey</dt><dd>${t?a`<a href="${o(`/miles/journeys/${t.id}`)}">${t.name}</a>`:e.trip_id}</dd>
            <dt>Visit</dt><dd>${e.visit_confirmed?a`Confirmed${r(e.visited_date)?" · date TODO":` · ${N(e.visited_date)}`}`:a`<span class="badge muted">Not confirmed</span> <span class="note">Suggested place, not counted as a visit.</span>`}</dd>
            ${e.visit_confirmed?a`<dt>Rating</dt><dd>${O(e.rating)}</dd>`:""}
            ${m.map(([s,p])=>a`<dt>${s}</dt><dd>${p}</dd>`)}
            <dt>Location</dt><dd>${n(e)?a`${e.lat.toFixed(4)}, ${e.lng.toFixed(4)}${i?a` · <a href="${i}" rel="noopener noreferrer" target="_blank">source</a>`:""}${e.coord_verified===!1?a`<br><span class="note">Looked up from a public source, not yet verified.</span>`:""}`:"Coordinates TODO"}</dd>
          </dl>
          ${n(e)&&e.visit_confirmed?a`<p class="mt"><a href="${o(`/miles?trip=${e.trip_id}`)}">See on the map →</a></p>`:""}
        </div>
      </div>
      ${e.coord_note?T("Note",a`<p class="note">${e.coord_note}</p>`):""}
    `}};export{w as default};
