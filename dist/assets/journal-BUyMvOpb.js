import{X as d,y as $,x as p,k as t,n as m,r as u}from"./index-DBmcO55G.js";const g=async({query:r})=>{const i=await d(),e=[...new Set(i.map(a=>a.topic))].sort((a,s)=>a.localeCompare(s)),l=r.get("topic"),o=l&&e.includes(l)?l:null,n=(o?[o]:e).map(a=>({topic:a,items:i.filter(s=>s.topic===a).sort((s,c)=>c.date.localeCompare(s.date))}));return{title:"Journal · SPEAKLOG",section:"speaklog",body:t`
      ${$("/speaklog/journal","Journal","Personal English notes, grouped by topic.")}
      ${e.length?t`<nav class="chips scroll" aria-label="Topics">
            <a class="chip" href="${p("/speaklog/journal")}" ${o===null?t`aria-current="true"`:""}>All topics</a>
            ${e.map(a=>t`<a class="chip" href="${p(`/speaklog/journal?topic=${encodeURIComponent(a)}`)}" ${o===a?t`aria-current="true"`:""}>${a}</a>`)}
          </nav>`:""}
      ${n.length?n.map(a=>t`<section class="section" aria-label="${a.topic}">
              <div class="section-head"><h2>${a.topic}</h2><span class="note">${a.items.length} note${a.items.length===1?"":"s"}</span></div>
              <div class="stack">${a.items.map(s=>t`<article class="card stack" id="${s.id}">
                  <p class="note">${m(s.date)}</p>
                  <h3 class="serif card-title">${s.title}</h3>
                  <div class="prose">${s.body.split(/\n{2,}/).map(c=>t`<p>${c}</p>`)}</div>
                </article>`)}</div>
            </section>`):u("No data yet","Add notes to data/speaklog/journal.json.")}
    `}};export{g as default};
