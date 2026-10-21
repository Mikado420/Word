/* ---------- utils ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pad=n=>String(n).padStart(4,"0");
const hl=(en,w)=>esc(en).replace(new RegExp("\\b("+w.slice(0,Math.max(4,w.length-2))+"\\w*)","i"),"<b>$1</b>");
const tagIcon='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 2h8v12l-4-3-4 3z"/></svg>';

const mk=s=>esc(s).replace(/\*(.+?)\*/g,"<b>$1</b>");
const MARKS={"発":"発音注意","ア":"アクセント注意","多":"多義語"};
const markTag=m=>m?`<span class="mk" title="${MARKS[m]}">${m}</span>`:"";
