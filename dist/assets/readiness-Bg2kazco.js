import{g as i,c as n,U as c,V as d,y as p,k as a,z as v,n as m,r as g}from"./index-DBmcO55G.js";import{g as $}from"./charts-SBChLv_l.js";import{b as u,l as b}from"./shared-D54qyj6l.js";const k=async({today:o})=>{const[{sessions:r,localIds:l},t]=await Promise.all([i(),n()]),e=c(r,o);return{title:"Trip Readiness · SPEAKLOG",section:"speaklog",body:a`
      ${p("/speaklog/readiness","Trip Readiness",`Can I handle ${t.next_trip.name} in English? One score per real-world scenario.`)}
      ${b(l.size)}
      <section class="card readiness-head" aria-labelledby="overall-title">
        ${e.overall!==null?$(e.overall,"Overall readiness"):""}
        <div class="stack">
          <h2 id="overall-title" style="font-size:1.5rem">Overall readiness</h2>
          ${e.overall!==null?a`<p><strong>${e.overall}%</strong> based on ${e.covered} of 8 scenarios practised.</p>`:a`<p class="muted"><strong>No data yet.</strong> Log a travel-simulation Session Card with a <span class="code">scenario</span> to get the first score.</p>`}
          <p class="note">Each scenario score is the average of its latest ${d} scored sessions (mean of the four core scores, × 20). Overall is the average of practised scenarios only.</p>
        </div>
      </section>
      ${v("Scenarios",a`<div class="cards">
          ${e.scenarios.map(s=>a`<article class="card stack">
              <div class="row" style="justify-content:space-between"><h3>${s.label}</h3><b class="num" style="font-size:1.6rem">${s.score!==null?`${s.score}%`:""}</b></div>
              ${s.score!==null?a`<div class="bar-track" role="progressbar" aria-label="${s.label} readiness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.score}"><div class="bar-fill" style="width:${s.score}%"></div></div>
                  <p class="note">${s.sessions} session${s.sessions===1?"":"s"} · last ${s.lastDate?m(s.lastDate):"—"}</p>`:g("No data yet",s.sessions?"Sessions found, but none has scores.":"Not practised yet.")}
            </article>`)}
        </div>`)}
    `,mount:u}};export{k as default};
