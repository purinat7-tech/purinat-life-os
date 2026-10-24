import{k as h,W as x,n as y,q as M}from"./index-DBmcO55G.js";function k(t,n){const $=Math.max(1,...t.map(e=>e.value));return h`<figure class="bars-figure">
    <div class="bars" style="--n:${t.length}" aria-hidden="true">
      ${t.map(e=>h`<div class="col" title="${e.title}">
          <span class="v">${e.current||e.value===$?e.value:""}</span>
          <div class="b${e.current?" current":""}" style="height:${e.value>0?Math.max(3,Math.round(e.value/$*100)):0}%"></div>
          <span class="lbl">${e.label}</span>
        </div>`)}
    </div>
    <figcaption class="sr-only">${n.caption}</figcaption>
    <table class="sr-only"><thead><tr><th>Week</th><th>${n.unit}</th></tr></thead>
      <tbody>${t.map(e=>h`<tr><td>${e.title}</td><td>${e.value}</td></tr>`)}</tbody></table>
  </figure>`}function L(t,n){const f=t.length,u=a=>f<=1?200/2:4+a*192/(f-1),i=a=>52-a/100*48,o=[];let r="";t.forEach((a,s)=>{if(a===null){r&&o.push(r),r="";return}r+=`${r?"L":"M"}${u(s).toFixed(1)} ${i(a).toFixed(1)} `}),r&&o.push(r);const d=o.map(a=>a.trim().split("L").length===1?a.replace(/M([\d.]+) ([\d.]+)/,(s,l,g)=>`M${Number(l)-6} ${g} L${Number(l)+6} ${g}`):a).map(a=>`<path class="line" d="${a.trim()}" vector-effect="non-scaling-stroke"/>`).join("");return h`<svg class="chart spark" viewBox="0 0 ${200} ${56}" preserveAspectRatio="none" role="img" aria-label="${n}" height="${56}">
    <line class="grid" x1="0" x2="${200}" y1="${i(50)}" y2="${i(50)}" vector-effect="non-scaling-stroke" stroke-dasharray="3 4"/>
    ${x(d)}
  </svg>`}function w(t){return t<=0?0:t<15?1:t<30?2:t<60?3:4}function F(t){const f=26+t.length*16,u=128,i=[];let o="",r=-10;t.forEach((s,l)=>{const g=s[0];if(g){const c=g.date.slice(5,7);c!==o&&(l-r>=3&&l<t.length-1&&(i.push(`<text class="axis" x="${26+l*16}" y="11">${M(Number(c),"short")}</text>`),r=l),o=c)}s.forEach((c,m)=>{const v=c.future?"heat-future":`heat-${w(c.minutes)}`,b=c.future?"":`<title>${y(c.date)}: ${c.minutes} min</title>`;i.push(`<rect class="${v}" x="${26+l*16}" y="${16+m*16}" width="13" height="13" rx="2.5">${b}</rect>`)})}),["Mon","Wed","Fri"].forEach((s,l)=>{i.push(`<text class="axis" x="0" y="${16+l*2*16+13-2}">${s}</text>`)});const d=t.flat().filter(s=>!s.future&&s.minutes>0).length,a=t.flat().filter(s=>!s.future).length;return h`<div class="heatmap-wrap" data-scroll-end>
    <svg class="chart heatmap" width="${f}" height="${u}" viewBox="0 0 ${f} ${u}" role="img" aria-label="Practice calendar: practised on ${d} of the last ${a} days">${x(i.join(""))}</svg>
  </div>
  <div class="legend" aria-hidden="true">Less
    <svg viewBox="0 0 72 12"><rect class="heat-0" x="0" width="12" height="12" rx="2"/><rect class="heat-1" x="15" width="12" height="12" rx="2"/><rect class="heat-2" x="30" width="12" height="12" rx="2"/><rect class="heat-3" x="45" width="12" height="12" rx="2"/><rect class="heat-4" x="60" width="12" height="12" rx="2"/></svg>
  More · 15 / 30 / 60 min steps</div>`}function H(t,n){const e=2*Math.PI*52,p=Math.max(0,Math.min(100,t))/100*e;return h`<svg class="gauge" viewBox="0 0 140 140" role="img" aria-label="${n}: ${t}%">
    <circle class="track" cx="70" cy="70" r="${52}" fill="none" stroke-width="14"/>
    <circle class="fill" cx="70" cy="70" r="${52}" fill="none" stroke-width="14" stroke-linecap="round" stroke-dasharray="${p.toFixed(1)} ${e.toFixed(1)}" transform="rotate(-90 70 70)"/>
    <text x="70" y="78" text-anchor="middle" font-size="30" font-weight="850">${t}%</text>
  </svg>`}export{k as b,H as g,F as h,L as s};
