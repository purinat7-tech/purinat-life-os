import{a3 as $,a4 as b,ar as g,N as w,ac as m,r as f,k as n,as as T,Q as E,x,ai as L,F as W}from"./index-DBmcO55G.js";const k=async({params:o,today:p})=>{const[c,y]=await Promise.all([$(),b()]),r=g(c,p),a=o.year?Number(o.year):r[0];if(o.year&&(!Number.isInteger(a)||!r.includes(a)))throw new w(`wrapped ${o.year}`);if(a===void 0)return{title:"Travel Wrapped · MILES",section:"miles",body:n`${m("/miles/wrapped","Travel Wrapped")}${f("No data yet","Wrapped needs at least one trip with dates.")}`};const e=T(a,c,y,p),l=e.longestTrip?.trip,v=e.months.map(t=>E(t).split(" ")[0].slice(0,3));return{title:`Travel Wrapped ${a} · MILES`,section:"miles",body:n`
      <div class="no-shot">${m("/miles/wrapped",`Travel Wrapped ${a}`,"Made to be screenshotted. Use screenshot mode to hide the navigation.")}</div>
      ${r.length>1?n`<nav class="chips no-shot" aria-label="Year">${r.map(t=>n`<a class="chip" href="${x(`/miles/wrapped/${t}`)}" ${t===a?n`aria-current="true"`:""}>${t}</a>`)}</nav>`:""}
      <div class="wrapped-stage mt">
        <article class="wrapped-card" aria-label="Travel Wrapped ${a}">
          <div class="w-top"><span>MILES</span><span>PURINAT LIFE OS</span></div>
          <div>
            <div class="w-year">${a}</div>
            <div class="w-sub">Travel Wrapped</div>
            <div class="w-hl mt">${e.countries.map(t=>L(t)).join(" ")}</div>
          </div>
          <div class="stack" style="align-content:end;gap:16px">
            <div class="w-grid">
              <div><b>${e.trips.length}</b><span>${e.trips.length===1?"journey":"journeys"}</span></div>
              <div><b>${e.travelDays}</b><span>travel days</span></div>
              <div><b>${e.countries.length}</b><span>${e.countries.length===1?"country":"countries"}</span></div>
              <div><b>${e.places.length}</b><span>places</span></div>
              <div><b>${e.cities}</b><span>towns &amp; areas</span></div>
              <div><b>${e.continents.length}</b><span>${e.continents.length===1?"continent":"continents"}</span></div>
            </div>
            <div class="w-foot">
              ${l?n`<span class="w-hl">Longest: ${l.name} · ${e.longestTrip.days} days</span>`:""}
              ${v.length?n`<span>On the road in ${v.join(", ")}</span>`:""}
              ${e.topCategories.length?n`<span>Most: ${e.topCategories.map(t=>`${W(t.category)} (${t.count})`).join(" · ")}</span>`:""}
            </div>
          </div>
        </article>
        <div class="btn-row no-shot">
          <button class="btn primary" type="button" data-action="shot">Screenshot mode</button>
        </div>
        <p class="note no-shot">${e.undatedTrips?`${e.undatedTrips} journey(s) without dates are not in any year yet.`:""}</p>
      </div>
    `,mount(t){const h=t.querySelector('[data-action="shot"]'),s=document.createElement("button");s.type="button",s.className="btn",s.textContent="Exit screenshot mode",s.style.cssText="position:fixed;right:12px;bottom:12px;opacity:.85;z-index:50",s.hidden=!0,document.body.append(s);const d=i=>{document.body.classList.toggle("screenshot",i),s.hidden=!i,i?s.focus():h?.focus()};h?.addEventListener("click",()=>d(!0)),s.addEventListener("click",()=>d(!1));const u=i=>{i.key==="Escape"&&d(!1)};return document.addEventListener("keydown",u),()=>{document.body.classList.remove("screenshot"),document.removeEventListener("keydown",u),s.remove()}}}};export{k as default};
