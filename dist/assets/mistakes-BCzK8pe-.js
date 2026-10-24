import{g as i,G as d,H as p,R as o,y as h,k as e,r as n,z as m,n as u,x as $}from"./index-DBmcO55G.js";import{b as y,l as f}from"./shared-D54qyj6l.js";const k=async({today:r})=>{const{sessions:l,localIds:c}=await i(),a=d(l,r),s=p(a);return{title:"Mistake Memory · SPEAKLOG",section:"speaklog",body:e`
      ${h("/speaklog/mistakes","Mistake Memory","Recurring error patterns, grouped by the tag on each correction in your Session Cards.")}
      ${f(c.size)}
      ${s?e`<section class="focus-card" aria-labelledby="focus-title">
            <div class="eyebrow">This week’s focus</div>
            <h2 id="focus-title">${s.label}</h2>
            <p>${s.reason}</p>
            ${s.example?e`<p><span style="text-decoration:line-through;opacity:.75">${s.example.said}</span> → <strong>${s.example.natural}</strong></p>`:""}
          </section>`:n("No data yet","This week’s focus is picked from the corrections in your Session Cards.")}
      ${m("Patterns",a.length?e`<div class="table-wrap"><table class="wide">
              <thead><tr><th scope="col">Pattern</th><th scope="col">Total</th><th scope="col">Last ${o} days</th><th scope="col">Last seen</th><th scope="col">Latest example</th></tr></thead>
              <tbody>${a.map(t=>e`<tr>
                  <th scope="row">${t.label}<br><span class="note">${t.tag}</span></th>
                  <td class="num">${t.count}</td>
                  <td class="num">${t.recent}</td>
                  <td>${u(t.lastSeen)}</td>
                  <td>${t.examples[0]?e`<a href="${$(`/speaklog/activities/${t.examples[0].sessionId}`)}">${t.examples[0].natural}</a>`:""}</td>
                </tr>`)}</tbody>
            </table></div>`:n("No data yet",e`Corrections look like <span class="code">{"said": "...", "natural": "...", "tag": "past-tense"}</span>.`))}
      <p class="note mt">Rule for the focus: the pattern seen most often in the last ${o} days; if nothing is that recent, the most frequent pattern overall.</p>
    `,mount:y}};export{k as default};
