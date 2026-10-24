const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/map-OsGvGZdz.js","assets/index-DBmcO55G.js","assets/index-iNHZYzM8.css","assets/map--S9olhOP.css"])))=>i.map(i=>d[i]);
import{a3 as O,a4 as I,a5 as q,a6 as x,a7 as z,a8 as C,f as i,k as n,a9 as K,aa as R,ab as j,ac as F,F as H,x as M,z as N}from"./index-DBmcO55G.js";const g={visited:"Visited",planned:"Planned",dream:"Dream"},B=async({today:y,query:D})=>{const[b,T,L]=await Promise.all([O(),I(),q()]),a=x(b,T,y),{points:o,notOnMap:S}=z(b,T,L,y),u=S.filter(e=>e.reason==="not-confirmed").map(e=>e.name),E=S.filter(e=>e.reason==="no-coordinates").map(e=>e.name),d=D.get("trip"),k=C.filter(e=>o.some(m=>m.categories.includes(e))),h=["visited","planned","dream"],P=n`<div class="tiles six">
    ${i("Countries",a.countries)}
    ${i("Cities",a.cities,{sub:"towns and areas"})}
    ${i("Places",a.places)}
    ${i("Continents",a.continents)}
    ${i("Trips",a.trips)}
    ${i("Travel days",a.travelDays,{sub:a.tripsMissingDates?`${a.tripsMissingDates} trip(s) without dates`:void 0})}
    ${i("Road-trip km",a.roadTripKm,{unit:"km",sub:a.roadTripsMissingKm?`km TODO on ${a.roadTripsMissingKm} road trip(s)`:void 0})}
    ${i("Coffee shops",a.coffee)}
    ${i("Restaurants",a.restaurants)}
    ${i("Hiking spots",a.hiking)}
    ${i("Beaches",a.beaches)}
    ${i("Photography spots",a.photography)}
  </div>
  <p class="note mt">Only confirmed visits count. Races are not counted in any statistic. Categories count confirmed places tagged with them.</p>`;return{title:"Explore · MILES",section:"miles",body:n`
      ${F("/miles","Explore","Every visited place, the next trips and the dreams, on one clean map.")}
      <div class="map-shell">
        <div class="map-legend" aria-hidden="true">${h.map(e=>n`<span><i class="dot ${e}"></i>${g[e]}</span>`)}</div>
        <div class="map" id="map" role="region" aria-label="Map of places. Markers are buttons; the same places are listed below the map."></div>
        <div class="map-status" id="map-status" role="status"><p>Loading map…</p></div>
      </div>
      <div class="chips scroll mt" role="group" aria-label="Show on map">
        ${h.map(e=>n`<button class="chip" type="button" data-kind="${e}" aria-pressed="true"><i class="dot ${e}" aria-hidden="true"></i>${g[e]}</button>`)}
      </div>
      <div class="chips scroll" role="group" aria-label="Filter places by category">
        ${(k.length?k:C.slice(0,9)).map(e=>n`<button class="chip" type="button" data-cat="${e}" aria-pressed="false">${H(e)}</button>`)}
      </div>
      ${d?n`<p class="note">Zoomed to one journey. <a href="${M("/miles")}">Show everything</a></p>`:""}

      <details class="map-list card mt">
        <summary>All ${o.length} points on the map (list view)</summary>
        <ul>${o.map(e=>n`<li data-point="${e.id}"><a href="${M(e.href)}">${e.name}</a> <span class="note">· ${g[e.kind]}${e.subtitle?` · ${e.subtitle}`:""}</span></li>`)}</ul>
        ${u.length?n`<p class="note mt">Not on the map until the visit is confirmed (${u.length}): ${u.join(", ")}.</p>`:""}
        ${E.length?n`<p class="note mt">Not on the map yet (coordinates TODO): ${E.join(", ")}.</p>`:""}
      </details>

      ${N("Stats",P)}
    `,mount(e){const m=e.querySelector("#map"),f=e.querySelector("#map-status"),w=e.querySelector(".map-list");if(!m||!f)return;const c=new Set(h),r=new Set,A=()=>new Set(o.filter(s=>c.has(s.kind)).filter(s=>!r.size||s.categories.some(t=>r.has(t))).filter(s=>!d||s.tripId===d||s.kind!=="visited").map(s=>s.id));let p,$=!1;const v=()=>{const s=A();p?.setVisible(s),e.querySelectorAll("[data-point]").forEach(t=>{t.hidden=!s.has(t.dataset.point??"")})};e.querySelectorAll("[data-kind]").forEach(s=>s.addEventListener("click",()=>{const t=s.dataset.kind;c.has(t)?c.delete(t):c.add(t),s.setAttribute("aria-pressed",String(c.has(t))),v()})),e.querySelectorAll("[data-cat]").forEach(s=>s.addEventListener("click",()=>{const t=s.dataset.cat;r.has(t)?r.delete(t):r.add(t),s.setAttribute("aria-pressed",String(r.has(t))),v();const l=A();l.size&&p?.focus(l)})),K(async()=>{const{createMap:s}=await import("./map-OsGvGZdz.js");return{createMap:s}},__vite__mapDeps([0,1,2,3])).then(({createMap:s})=>s(m,o,R())).then(s=>{if($){s.destroy();return}if(p=s,f.hidden=!0,v(),d){const t=new Set(o.filter(l=>l.tripId===d).map(l=>l.id));t.size&&s.focus(t)}}).catch(s=>{$||(console.warn(s),f.innerHTML=n`<div class="stack"><p><strong>The interactive map is not available.</strong></p><p>${s instanceof Error?s.message:""}</p><p>All places are listed below.</p></div>`.value,w&&(w.open=!0))});const _=j(s=>p?.setTheme(s));return()=>{$=!0,_(),p?.destroy()}}}};export{B as default};
