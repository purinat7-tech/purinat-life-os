import{g as E,a as W,b as A,c as K,t as j,w as x,d as R,m as q,p as D,e as O,f as o,h as T,i as z,j as F,k as n,l as h,n as f,o as H,q as G,r as p,S as b,s as $,u as w,v as U,x as V,y as J,z as r,A as Q}from"./index-DBmcO55G.js";import{b as X,s as Y,h as Z}from"./charts-SBChLv_l.js";import{b as ss,l as es,a as as,I as L}from"./shared-D54qyj6l.js";const os=async({today:l})=>{const[{sessions:i,localIds:S},g,u,P]=await Promise.all([E(),W(),A(),K()]),e=j(i,l).sessions>0,t=x(i,l),c=P.weekly_goals,v=R(i,l,12),m=q(i,l,12),y=D(i,l),k=O(i,l).slice(-3).reverse(),B=n`<div class="tiles six">
    ${o("Current streak",e?T(i,l):null,{unit:"days",accent:e})}
    ${o("Minutes this week",e?t.minutes:null,{unit:"min",sub:e?`${t.sessions} sessions`:void 0})}
    ${o("Speaking sessions",e?t.speakingSessions:null,{sub:e?"this week":void 0})}
    ${o("Listening hours",e?(t.listeningMinutes/60).toFixed(1):null,{unit:"h",sub:e?"this week":void 0})}
    ${o("Movies completed",g.length?z(g):null,{sub:g.length?"all time":void 0})}
    ${o("Phrases learned",u.length?F(u):null,{sub:u.length?`mastered of ${u.length}`:void 0})}
  </div>`,M=n`<div class="card">
    <div class="progress-list">
      ${h("Practice minutes",t.minutes,c.minutes,"min")}
      ${h("Speaking sessions",t.speakingSessions,c.speaking_sessions,"")}
      ${h("Listening minutes",t.listeningMinutes,c.listening_minutes,"min")}
      ${h("New phrases",t.newPhrases,c.new_phrases,"")}
    </div>
    <p class="note mt">Week of ${f(t.weekStart)} (Mon–Sun, Bangkok time). ${c.is_default?H("data/speaklog/plan.json"):""}</p>
  </div>`,N=e?X(v.map((s,a)=>({label:a===0||v[a-1].weekStart.slice(5,7)!==s.weekStart.slice(5,7)?G(Number(s.weekStart.slice(5,7)),"short"):"",value:s.minutes,title:`Week of ${f(s.weekStart)}`,current:a===v.length-1})),{caption:"Practice minutes per week, last 12 weeks",unit:"Minutes"}):p("No data yet",L),I=m.length?n`<div class="skills">
        ${b.map(s=>{const a=m.map(d=>d[s]),C=[...a].reverse().find(d=>d!==null);return n`<div class="skill">
            <div class="top"><span>${$[s]}</span><b>${C??"—"}</b></div>
            ${a.some(d=>d!==null)?Y(a,`${$[s]} per month, 0 to 100`):n`<p class="note">No data yet</p>`}
            <div class="row note" style="justify-content:space-between"><span>${w(m[0].month)}</span><span>${w(m.at(-1).month)}</span></div>
          </div>`})}
      </div>
      <p class="note mt">Monthly averages on 0–100. Sources: ${b.map(s=>`${$[s]} = ${U[s]}`).join("; ")}.</p>`:p("No data yet","Skill scores come from the scores in your Session Cards."),_=y.length?n`<div class="tiles four">${y.map(s=>s.sessionId?n`<a class="tile card-link" href="${V(`/speaklog/activities/${s.sessionId}`)}"><span class="label">${s.label}</span><span class="value">${s.value}</span><span class="sub">${s.detail}</span></a>`:o(s.label,s.value,{sub:s.detail}))}</div>`:p("No data yet","Personal bests appear after your first session.");return{title:"SPEAKLOG Dashboard",section:"speaklog",body:n`
      ${J("/speaklog","Dashboard","Training English like an endurance sport: volume, consistency and quality, all from logged Session Cards.")}
      ${es(S.size)}
      ${B}
      ${r("Weekly goals",M)}
      ${r("Weekly volume",N)}
      ${r("Skill progress",I)}
      ${r("Practice calendar",e?Z(Q(i,l,53)):p("No data yet","Each practice day lights up here."))}
      ${r("English Personal Bests",_)}
      ${r("Recent activities",k.length?n`<div class="feed">${k.map(s=>as(s,S.has(s.id)))}</div>`:p("No data yet",L),k.length?{path:"/speaklog/activities",label:"All activities"}:void 0)}
    `,mount(s){ss(s),s.querySelectorAll("[data-scroll-end]").forEach(a=>{a.scrollLeft=a.scrollWidth})}}};export{os as default};
