import{a as u,y as h,x as r,k as a,L as o,K as c,M as g,r as m}from"./index-DBmcO55G.js";const d={want:"Want to watch",watching:"Watching",completed:"Completed",rewatch:"Rewatch"},$={movie:"Movie",series:"Series",podcast:"Podcast",youtube:"YouTube"},b={none:"No subtitles",english:"English subtitles",thai:"Thai subtitles","english+thai":"English + Thai subtitles"},y=async({query:p})=>{const t=await u(),i=p.get("status"),e=o.includes(i)?i:null,n=e?t.filter(s=>s.status===e):t;return{title:"Library · SPEAKLOG",section:"speaklog",body:a`
      ${h("/speaklog/library","Library","Movies, series, podcasts and YouTube used as listening training.")}
      <nav class="chips scroll" aria-label="Filter by status">
        <a class="chip" href="${r("/speaklog/library")}" ${e===null?a`aria-current="true"`:""}>All <span class="count">${t.length}</span></a>
        ${o.map(s=>a`<a class="chip" href="${r(`/speaklog/library?status=${s}`)}" ${e===s?a`aria-current="true"`:""}>${d[s]} <span class="count">${t.filter(l=>l.status===s).length}</span></a>`)}
      </nav>
      <div class="cards mt">
        ${n.length?n.map(s=>a`<article class="card stack">
                <div class="row"><span class="badge ${s.status==="completed"?"solid":"accent"}">${d[s.status]}</span><span class="tag">${$[s.kind]}</span></div>
                <h2 class="serif card-title">${s.kind==="movie"||s.kind==="series"?c.film:c.headphones} ${s.title}</h2>
                <dl class="kv">
                  <dt>Difficulty</dt><dd>${g(s.difficulty)?a`<span role="img" aria-label="${s.difficulty} of 5">${"●".repeat(s.difficulty)}${"○".repeat(5-s.difficulty)}</span>`:"TODO"}</dd>
                  <dt>Subtitles</dt><dd>${b[s.subtitle_mode]}</dd>
                  ${typeof s.comprehension_pct=="number"?a`<dt>Comprehension</dt><dd>${s.comprehension_pct}%</dd>`:""}
                </dl>
                ${typeof s.comprehension_pct=="number"?a`<div class="bar-track" role="progressbar" aria-label="Comprehension" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.comprehension_pct}"><div class="bar-fill" style="width:${s.comprehension_pct}%"></div></div>`:""}
                ${s.useful_phrases.length?a`<div><strong>Useful phrases</strong><ul style="margin:6px 0 0;padding-left:20px">${s.useful_phrases.map(l=>a`<li>${l}</li>`)}</ul></div>`:""}
                ${s.notes?a`<p class="muted">${s.notes}</p>`:""}
              </article>`):m("No data yet",t.length?"Nothing with this status.":"Add titles to data/speaklog/library.json.")}
      </div>
    `}};export{y as default};
