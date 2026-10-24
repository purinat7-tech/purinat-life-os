import{a0 as p,a1 as d,k as e,C as v,T as $,a2 as h,n as b,x as o}from"./index-DBmcO55G.js";function m(a){return a?e`<div class="banner" role="note">
    <span>Including ${a} local preview session${a===1?"":"s"}. Only this browser can see ${a===1?"it":"them"}; the public site is unchanged.</span>
    <button class="btn" type="button" data-action="clear-local">Clear local preview</button>
  </div>`:e``}function f(a){a.querySelector('[data-action="clear-local"]')?.addEventListener("click",()=>{p(),d()})}function y(a,r,s={}){const l=s.level===2?e`<h2 class="act-title">${a.topic}</h2>`:e`<h3 class="act-title">${a.topic}</h3>`,n=v(a),t=a.corrections?.length??0,i=a.new_phrases?.length??0,c=e`
    <div class="type-icon">${h(a.type)}</div>
    <div>
      <div class="meta"><span>${$[a.type]}</span><span>${b(a.date)}</span>${r?e`<span class="local-badge">Local preview</span>`:""}</div>
      ${l}
      <div class="stats">
        <div><b>${a.duration_min}</b><span>min</span></div>
        ${n!==null?e`<div><b>${n.toFixed(1)}</b><span>score / 5</span></div>`:""}
        ${typeof a.comprehension_pct=="number"?e`<div><b>${a.comprehension_pct}%</b><span>understood</span></div>`:""}
        ${t?e`<div><b>${t}</b><span>corrections</span></div>`:""}
        ${i?e`<div><b>${i}</b><span>new phrases</span></div>`:""}
      </div>
      ${a.focus?e`<p><strong>Focus:</strong> ${a.focus}</p>`:""}
    </div>`;return s.link===!1?e`<article class="card activity">${c}</article>`:e`<a class="card activity card-link" href="${o(`/speaklog/activities/${a.id}`)}">${c}</a>`}const g=e`Add a Session Card with the <a href="${o("/speaklog/import")}">import tool</a>, then commit the merged file.`;export{g as I,y as a,f as b,m as l};
