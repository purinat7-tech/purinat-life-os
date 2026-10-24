import{g as f,e as p,y as v,x as d,k as a,B as u,T as g,r as m}from"./index-DBmcO55G.js";import{b as S,l as k,a as E,I as b}from"./shared-D54qyj6l.js";const L=async({today:n,query:h})=>{const{sessions:i,localIds:l}=await f(),t=p(i,n).reverse(),o=h.get("type"),e=u.includes(o)?o:null,r=e?t.filter(s=>s.type===e):t,y=s=>t.filter($=>$.type===s).length,c=i.length-p(i,n).length;return{title:"Activities · SPEAKLOG",section:"speaklog",body:a`
      ${v("/speaklog/activities","Activities","Every session, newest first, like a training feed.")}
      ${k(l.size)}
      <nav class="chips scroll" aria-label="Filter by type">
        <a class="chip" href="${d("/speaklog/activities")}" ${e===null?a`aria-current="true"`:""}>All <span class="count">${t.length}</span></a>
        ${u.map(s=>a`<a class="chip" href="${d(`/speaklog/activities?type=${s}`)}" ${e===s?a`aria-current="true"`:""}>${g[s]} <span class="count">${y(s)}</span></a>`)}
      </nav>
      <div class="feed mt">
        ${r.length?r.map(s=>E(s,l.has(s.id),{level:2})):m("No data yet",e?`No ${g[e].toLowerCase()} sessions logged.`:b)}
      </div>
      ${c?a`<p class="note mt">${c} session card(s) dated in the future are hidden until that day.</p>`:""}
    `,mount:S}};export{L as default};
