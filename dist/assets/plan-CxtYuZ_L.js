import{c as h,O as m,Q as k,n,y as $,k as s,o as i,z as d,T as g}from"./index-DBmcO55G.js";const u=async({today:o})=>{const a=await h(),t=m(a,o),r=t.tripDate?t.dateIsApproximate?`${k(t.tripDate.slice(0,7))} (exact day not set; counting to the 1st)`:n(t.tripDate):"Date TODO",c=t.phases.reduce((e,l)=>e+(l.weeks??0),0),p=t.tripDate&&t.phases[0]?.end?Math.max(1,Math.ceil((Date.parse(t.phases[0].end)-Date.parse(o))/6048e5)):4;return{title:"Training Plan · SPEAKLOG",section:"speaklog",body:s`
      ${$("/speaklog/plan","Training Plan","Periodised like a marathon block: Base, Build, Trip-Specific, Peak, Taper, counted back from the next trip.")}
      <div class="split">
        <section class="card stack" aria-labelledby="trip-title">
          <div class="eyebrow">Next trip${t.tentative?" · tentative":""}</div>
          <h2 id="trip-title" class="serif" style="font-size:2.2rem;font-weight:600">${t.tripName}</h2>
          <p class="muted">${r}</p>
          ${t.daysToTrip!==null?t.daysToTrip>=0?s`<p class="countdown">${t.daysToTrip}<span class="muted" style="font-size:1rem;font-weight:700;letter-spacing:0"> days to go</span></p>`:s`<p class="note">This trip date has passed. Set the next trip in data/speaklog/plan.json.</p>`:s`<p class="note">Set <span class="code">next_trip.start_date</span> or <span class="code">target_month</span> in data/speaklog/plan.json to start the countdown.</p>`}
          <p>Current phase: <strong>${t.current??"—"}</strong></p>
        </section>
        <section class="card stack" aria-labelledby="goal-title">
          <h2 id="goal-title" style="font-size:1.3rem">Weekly goals</h2>
          <dl class="kv">
            <dt>Practice</dt><dd>${a.weekly_goals.minutes} min</dd>
            <dt>Speaking sessions</dt><dd>${a.weekly_goals.speaking_sessions}</dd>
            <dt>Listening</dt><dd>${a.weekly_goals.listening_minutes} min</dd>
            <dt>New phrases</dt><dd>${a.weekly_goals.new_phrases}</dd>
          </dl>
          ${a.weekly_goals.is_default?i("data/speaklog/plan.json"):""}
        </section>
      </div>

      ${d("Phases",s`<div class="phase-bar" role="list" aria-label="Phases in order">
            ${t.phases.map(e=>{const l=e.weeks??p;return s`<div role="listitem" class="${e.state}" style="flex:${Math.max(1,l)}" title="${e.name}">${e.name}${e.state==="current"?s`<span class="sr-only"> (current)</span>`:""}</div>`})}
          </div>
          <div class="phase-cards mt">
            ${t.phases.map(e=>s`<article class="card phase-card stack ${e.state==="current"?"current":""}">
                <div class="row"><h3>${e.name}</h3>${e.state==="current"?s`<span class="badge solid">Now</span>`:e.state==="past"?s`<span class="badge muted">Done</span>`:""}</div>
                <p class="note">${e.start?n(e.start):"Now"} – ${e.end?n(e.end):"TODO"}${e.weeks?` · ${e.weeks} wk`:""}</p>
                <p>${e.focus}</p>
              </article>`)}
          </div>
          <p class="note mt">Fixed phases total ${c} weeks; Base takes the time before them. ${a.phases.is_default?i("data/speaklog/plan.json"):""}</p>`)}

      ${d("Weekly template",s`<div class="table-wrap"><table class="stack-sm">
            <thead><tr><th scope="col">Day</th><th scope="col">Session</th><th scope="col">Minutes</th><th scope="col">Note</th></tr></thead>
            <tbody>${a.weekly_template.days.map(e=>s`<tr><th scope="row">${e.day}</th><td>${e.activity==="rest"?"Rest":g[e.activity]}</td><td class="num">${e.minutes||"—"}</td><td>${e.note}</td></tr>`)}</tbody>
          </table></div>
          ${a.weekly_template.is_default?s`<p class="mt">${i("data/speaklog/plan.json")}</p>`:""}`)}
    `}};export{u as default};
