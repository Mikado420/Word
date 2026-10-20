/* ---------- storage ---------- */
const KEY="akasheet-v1";
let S={cards:{},notes:{},read:{},page:0,sheet:false,mode:"in",filter:"all"};
try{const v=JSON.parse(localStorage.getItem(KEY)||"null"); if(v) S=Object.assign(S,v);}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}

