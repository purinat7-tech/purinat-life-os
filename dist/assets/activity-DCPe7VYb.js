import{g as $,N as m,C as u,y as v,T as g,n as h,k as a,D as f,z as l,E as c,x as r,F as b}from"./index-DBmcO55G.js";import{b as y,l as k}from"./shared-D54qyj6l.js";const L=async({params:i})=>{const{sessions:d,localIds:p}=await $(),s=d.find(n=>n.id===i.id);if(!s)throw new m(`session ${i.id}`);const o=p.has(s.id),t=u(s),e=s.scores??{};return{title:`${s.topic} · Activities`,section:"speaklog",body:a`
      ${v("/speaklog/activities",s.topic,a`${g[s.type]} · ${h(s.date)} · ${s.duration_min} min${o?a` · <span class="local-badge">Local preview</span>`:""}`)}
      ${o?k(1):""}
      <div class="tiles four">
        <div class="tile"><span class="label">Duration</span><span class="value">${s.duration_min}<small>min</small></span></div>
        ${t!==null?a`<div class="tile"><span class="label">Session score</span><span class="value">${t.toFixed(1)}<small>/ 5</small></span><span class="sub">Mean of the core scores</span></div>`:""}
        ${typeof s.comprehension_pct=="number"?a`<div class="tile"><span class="label">Comprehension</span><span class="value">${s.comprehension_pct}<small>%</small></span></div>`:""}
        ${s.scenario?a`<div class="tile"><span class="label">Scenario</span><span class="value" style="font-size:1.5rem">${f[s.scenario]}</span></div>`:""}
      </div>

      <div class="split mt">
        <div class="stack">
          ${s.scores?l("Scores",a`<div class="card score-bars">
                ${c("Fluency",e.fluency)}${c("Grammar",e.grammar)}${c("Vocabulary",e.vocabulary)}${c("Communication",e.communication)}${c("Listening",e.listening)}
              </div>`):""}
          ${s.corrections?.length?l("Corrections",a`<div class="card">${s.corrections.map(n=>a`<div class="correction">
                  <span class="said"><span class="sr-only">I said: </span>${n.said}</span>
                  <span class="natural"><span class="sr-only">More natural: </span>${n.natural}</span>
                  <span><a class="tag" href="${r("/speaklog/mistakes")}">${b(n.tag)}</a></span>
                </div>`)}</div>`):""}
        </div>
        <div class="stack">
          ${s.strength||s.focus?l("Strength and focus",a`<div class="card"><dl class="kv">
                ${s.strength?a`<dt>Strength</dt><dd>${s.strength}</dd>`:""}
                ${s.focus?a`<dt>Focus</dt><dd>${s.focus}</dd>`:""}
              </dl></div>`):""}
          ${s.new_phrases?.length?l("New phrases",a`<ul class="card stack" style="margin:0;padding-left:34px">${s.new_phrases.map(n=>a`<li>${n}</li>`)}</ul>`):""}
          ${s.coach_note?l("Coach note",a`<blockquote class="quote" style="margin:0">${s.coach_note}</blockquote>`):""}
        </div>
      </div>
      <p class="mt"><a href="${r("/speaklog/activities")}">← All activities</a></p>
    `,mount:y}};export{L as default};
