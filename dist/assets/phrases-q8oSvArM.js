import{b as T,I as j,y as q,P as v,k as e,J as $,F as h,n as E,x as N,r as P,z as I}from"./index-DBmcO55G.js";import{h as C,s as F,f as O,o as W}from"./json-output-DByEEPgJ.js";const B={NEW:"badge accent",LEARNING:"badge dashed",MASTERED:"badge solid"},M=async({query:y,today:x})=>{const[i,c]=await Promise.all([T(),j()]),b=y.get("category"),w=y.get("status"),n=$.includes(b)?b:null,l=v.includes(w)?w:null,S=i.filter(a=>(!n||a.category===n)&&(!l||a.status===l)),d=(a,t)=>{const o=new URLSearchParams;a&&o.set("category",a),t&&o.set("status",t);const p=o.toString();return N(`/speaklog/phrases${p?`?${p}`:""}`)},u=a=>a?e`aria-current="true"`:"";return{title:"Phrase Bank · SPEAKLOG",section:"speaklog",body:e`
      ${q("/speaklog/phrases","Phrase Bank","Natural English for real situations: what to say, when, and how well it is learned.")}
      <div class="tiles">
        ${v.map(a=>e`<div class="tile"><span class="label">${a}</span><span class="value">${i.length?i.filter(t=>t.status===a).length:"—"}</span></div>`)}
      </div>
      <nav class="chips scroll mt" aria-label="Filter by situation">
        <a class="chip" href="${d(null,l)}" ${u(n===null)}>All situations</a>
        ${$.map(a=>e`<a class="chip" href="${d(a,l)}" ${u(n===a)}>${h(a)}</a>`)}
      </nav>
      <nav class="chips scroll" aria-label="Filter by status">
        <a class="chip" href="${d(n,null)}" ${u(l===null)}>Any status</a>
        ${v.map(a=>e`<a class="chip" href="${d(n,a)}" ${u(l===a)}>${a}</a>`)}
      </nav>
      <div class="cards mt">
        ${S.length?S.map(a=>e`<article class="card stack">
                <div class="row"><span class="${B[a.status]}">${a.status}</span><span class="tag">${h(a.category)}</span></div>
                <h2 class="serif card-title">${a.phrase}</h2>
                ${a.natural&&a.natural!==a.phrase?e`<p><span class="muted">Natural:</span> <strong>${a.natural}</strong></p>`:""}
                <p class="muted">${a.situation}</p>
                <p class="note">Added ${E(a.added)}${a.session_id?e` · <a href="${N(`/speaklog/activities/${a.session_id}`)}">from a session</a>`:""}</p>
              </article>`):P("No data yet",i.length?"No phrases match these filters.":"Add phrases to data/speaklog/phrases.json.")}
      </div>

      ${I("Sentence Rescue",e`<p class="lead" style="margin-bottom:14px">What I wanted to say → what I said → what a native speaker would say.</p>
          ${c.length?e`<div class="cards">${[...c].reverse().map(a=>e`<article class="card stack">
                  <p class="note">${E(a.date)}${a.category?` · ${h(a.category)}`:""}</p>
                  <p><span class="muted">Wanted to say:</span> ${a.wanted_to_say}</p>
                  <p class="correction" style="padding:0;border:0"><span class="said">${a.my_version}</span></p>
                  <p class="serif" style="font-size:1.2rem"><strong>${a.natural_version}</strong></p>
                  ${a.note?e`<p class="note">${a.note}</p>`:""}
                </article>`)}</div>`:P("No data yet","Rescued sentences appear here after you commit them to data/speaklog/rescues.json.")}

          <form class="card form-grid mt" id="rescue-form" novalidate>
            <h3>Rescue a sentence</h3>
            <p class="note">This form only builds JSON for you to commit. Nothing is saved or published from here.</p>
            <div class="field"><label for="r-wanted">What I wanted to say</label><textarea class="short" id="r-wanted" name="wanted" required placeholder="Can be in Thai"></textarea></div>
            <div class="form-grid two">
              <div class="field"><label for="r-mine">My version</label><textarea class="short" id="r-mine" name="mine" required></textarea></div>
              <div class="field"><label for="r-natural">Natural version</label><textarea class="short" id="r-natural" name="natural" required></textarea></div>
            </div>
            <div class="form-grid two">
              <div class="field"><label for="r-date">Date</label><input type="date" id="r-date" name="date" value="${x}" required></div>
              <div class="field"><label for="r-cat">Situation (optional)</label><select id="r-cat" name="category"><option value="">—</option>${$.map(a=>e`<option value="${a}">${h(a)}</option>`)}</select></div>
            </div>
            <div class="field"><label for="r-note">Note (optional)</label><input type="text" id="r-note" name="note"></div>
            <p class="note" role="alert" data-error></p>
            <div class="btn-row"><button class="btn primary" type="submit">Build rescues.json</button></div>
            ${W("rescue-output","rescues.json","Merged rescues.json")}
          </form>`)}
    `,mount(a){const t=a.querySelector("#rescue-form");t&&t.addEventListener("submit",o=>{o.preventDefault();const p=new FormData(t),r=s=>String(p.get(s)??"").trim(),m=t.querySelector("[data-error]"),k=[["wanted","What I wanted to say"],["mine","My version"],["natural","Natural version"],["date","Date"]].filter(([s])=>!r(s)).map(([,s])=>s);if(k.length){m&&(m.textContent=`Please fill in: ${k.join(", ")}.`),C(a,"rescue-output");return}m&&(m.textContent="");const f=r("date"),R=c.filter(s=>s.date===f).length,g={id:`rescue-${f}-${String(R+1).padStart(3,"0")}`,date:f,wanted_to_say:r("wanted"),my_version:r("mine"),natural_version:r("natural")},_=r("category");_&&(g.category=_),r("note")&&(g.note=r("note"));const D={$schema:"../../schemas/rescues.schema.json",schema_version:1,rescues:[...c,g].sort((s,A)=>s.date.localeCompare(A.date)||s.id.localeCompare(A.id))};F(a,"rescue-output",O(D),"rescues.json")})}}};export{M as default};
