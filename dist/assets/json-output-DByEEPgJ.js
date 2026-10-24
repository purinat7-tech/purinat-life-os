import{K as y,k as b}from"./index-DBmcO55G.js";function w(e,a,t){return b`<div class="stack" id="${e}" hidden>
    <div class="btn-row">
      <button class="btn primary" type="button" data-copy>${y.copy} Copy JSON</button>
      <button class="btn" type="button" data-download>${y.download} Download ${a}</button>
    </div>
    <pre class="output" tabindex="0" aria-label="${t}"><code></code></pre>
    <p class="note" role="status" data-status></p>
  </div>`}function m(e,a,t,i){const o=e.querySelector(`#${a}`);if(!o)return;o.hidden=!1;const r=o.querySelector("code");r&&(r.textContent=t);const l=o.querySelector("[data-status]"),d=n=>{l&&(l.textContent=n)};d("");const u=o.querySelector("[data-copy]"),p=o.querySelector("[data-download]");u&&(u.onclick=async()=>{try{await navigator.clipboard.writeText(t),d("Copied. Paste it into the file in your repository and commit.")}catch{const n=document.createRange();r&&n.selectNodeContents(r);const c=window.getSelection();c?.removeAllRanges(),c?.addRange(n),d("Copy was blocked by the browser. The text is selected: press Ctrl+C / ⌘C.")}}),p&&(p.onclick=()=>{const n=new Blob([t],{type:"application/json"}),c=URL.createObjectURL(n),s=document.createElement("a");s.href=c,s.download=i,document.body.append(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(c),1e3),d(`Downloaded ${i}. Replace the file in your repository and commit.`)})}function h(e,a){const t=e.querySelector(`#${a}`);t&&(t.hidden=!0)}function C(e){return`${JSON.stringify(e,null,2)}
`}export{C as f,h,w as o,m as s};
