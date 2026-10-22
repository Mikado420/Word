/* ---------- FSRS (v4 default weights) ---------- */
const W=[0.4872,1.4003,3.7145,13.8206,5.1618,1.2298,0.8975,0.031,1.6474,0.1367,1.0461,2.1072,0.0793,0.3246,1.587,0.2272,2.8755];
const DAY=864e5, clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const retr=(t,s)=>Math.pow(1+t/(9*s),-1);
const D0=g=>clamp(W[4]-(g-3)*W[5],1,10);
function next(c,g,now){
  let s,d,lapses=c?c.lapses||0:0;
  if(!c||!c.reps){s=W[g-1];d=D0(g);}
  else{
    const r=retr(Math.max(0,(now-c.last)/DAY),c.s);
    const dp=c.d-W[6]*(g-3); d=clamp(W[7]*D0(3)+(1-W[7])*dp,1,10);
    if(g===1){s=Math.min(c.s,W[11]*Math.pow(c.d,-W[12])*(Math.pow(c.s+1,W[13])-1)*Math.exp((1-r)*W[14]));lapses++;}
    else s=c.s*(1+Math.exp(W[8])*(11-c.d)*Math.pow(c.s,-W[9])*(Math.exp((1-r)*W[10])-1)*(g===2?W[15]:1)*(g===4?W[16]:1));
  }
  // 目標記憶率 R で次に出すまでの日数を決める（R=0.9 のとき間隔＝安定度 s 日）
  const R=targetR();
  let ivl=g===1?DAY/144:Math.max(1,Math.round(9*s*(1/R-1)))*DAY;
  // 試験日が決まっていれば、試験の前日までに必ずもう一度出す
  const ex=examInfo(now);
  if(ex&&g!==1){const lim=ex.ts-DAY-now; if(lim>0&&ivl>lim) ivl=Math.max(lim,4*3600e3);}
  return {s,d,ivl,due:now+ivl,last:now,reps:(c?c.reps||0:0)+1,lapses};
}
/* 試験日から目標記憶率を決める：普段は90%で復習を少なめに、直前ほど高く */
function examInfo(now){
  const e=S.cfg&&S.cfg.exam; if(!e) return null;
  const ts=new Date(e+"T09:00:00").getTime(); if(!(ts>now)) return null;
  return {ts,days:Math.ceil((ts-now)/DAY)};
}
function targetR(){
  const ex=examInfo(Date.now()); if(!ex) return 0.9;
  return ex.days>60?0.9:ex.days>30?0.92:ex.days>7?0.95:0.97;
}
function previews(c,now){
  const p=[1,2,3,4].map(g=>next(c,g,now));
  for(let i=2;i<4;i++) if(p[i].ivl<=p[i-1].ivl){p[i].ivl=p[i-1].ivl+DAY;p[i].due=now+p[i].ivl;}
  return p;
}
function fmt(ms){const d=ms/DAY; if(d<1) return Math.round(ms/6e4)+"分"; if(d<31) return Math.round(d)+"日"; if(d<365) return Math.round(d/30)+"ヶ月"; return (d/365).toFixed(1)+"年";}
function level(id){const c=S.cards[id]; if(!c||!c.reps) return 0; return c.s>=21?2:1;}

