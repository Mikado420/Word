/* ---------- storage ---------- */
const KEY="akasheet-v1";
let S={cards:{},notes:{},read:{},page:0,sheet:false,mode:"in",filter:"all"};
try{const v=JSON.parse(localStorage.getItem(KEY)||"null"); if(v) S=Object.assign(S,v);}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}


/* 表示テーマ：auto（端末の設定に合わせる）／light／dark */
function applyTheme(){
  const t=S.theme||"auto",el=document.documentElement;
  if(t==="auto") delete el.dataset.theme; else el.dataset.theme=t;
  const c={light:"#F1EADB",dark:"#000000"};
  document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{
    const own=/dark/.test(m.media)?"dark":"light";
    m.content=c[t==="auto"?own:t];
  });
}
applyTheme();
