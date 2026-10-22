/* ---------- 赤シート（ドラッグで動かせる半透明の板） ----------
 * しくみ：紙面の複製（赤字とQの答えを消した版）を紙面の真上に重ね、シートの形に切り抜いて見せる。
 * その上に半透明の赤い板を描くので、シートがかかった部分だけ文字単位で赤字が消える。
 * 板はつまんで上下左右に動かせ、指を離すと少し滑って止まる。軽くタップすると下の行や付箋に触れる。
 */
const RedSheet=(()=>{
  let el=null, under=null, btn=null, pos=null, raf=0;
  let drag=null, vel={x:0,y:0}, glide=0;

  function size(){
    const vw=innerWidth, vh=innerHeight;
    return {w:Math.min(vw-16,940), h:Math.round(Math.max(220,vh*0.5))};
  }
  function defaultPos(){const {w}=size();return {x:(innerWidth-w)/2, y:Math.round(innerHeight*0.42)};}
  function clamp(p){
    const {w,h}=size(), keep=56;
    return {x:Math.min(innerWidth-keep,Math.max(keep-w,p.x)), y:Math.min(innerHeight-keep,Math.max(keep-h,p.y))};
  }
  function load(){
    try{const p=S.sheetPos;if(p&&typeof p.fx==="number")return clamp({x:p.fx*innerWidth,y:p.fy*innerHeight});}catch(e){}
    return defaultPos();
  }
  function persist(){S.sheetPos={fx:pos.x/innerWidth,fy:pos.y/innerHeight};save();}

  /* 紙面の複製を作り直す（紙面を描き直したとき・行をめくったときに呼ぶ） */
  function sync(){
    const page=$("#page");
    if(!under||!page) return;
    under.innerHTML=page.innerHTML;
    under.querySelectorAll("[id]").forEach(n=>n.removeAttribute("id"));
    place();
  }
  function place(){
    if(!el) return;
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      const {w,h}=size();
      el.style.width=w+"px"; el.style.height=h+"px";
      el.style.transform=`translate3d(${pos.x}px,${pos.y}px,0)`;
      const page=$("#page"); if(!page||!under) return;
      const r=page.getBoundingClientRect();
      Object.assign(under.style,{left:r.left+"px",top:r.top+"px",width:r.width+"px",height:r.height+"px"});
      if(under.scrollTop!==page.scrollTop) under.scrollTop=page.scrollTop;
      const t=Math.max(0,pos.y-r.top), l=Math.max(0,pos.x-r.left);
      const b=Math.max(0,r.bottom-(pos.y+h)), rr=Math.max(0,r.right-(pos.x+w));
      under.style.clipPath=(t+b>=r.height||l+rr>=r.width)?"inset(100%)":`inset(${t}px ${rr}px ${b}px ${l}px round 6px)`;
    });
  }

  /* 板の操作：つまむ → 動かす → 離すと慣性で少し滑る。動かさずに離したらタップとして下に伝える */
  function down(e){
    if(e.button>0) return;
    cancelAnimationFrame(glide);
    el.setPointerCapture(e.pointerId);
    drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,ox:pos.x,oy:pos.y,t:performance.now(),lt:performance.now(),lx:e.clientX,ly:e.clientY,moved:false};
    vel={x:0,y:0};
  }
  function move(e){
    if(!drag||e.pointerId!==drag.id) return;
    const dx=e.clientX-drag.sx, dy=e.clientY-drag.sy;
    if(!drag.moved&&Math.hypot(dx,dy)>6){drag.moved=true;el.classList.add("lift");}
    if(!drag.moved) return;
    const now=performance.now(), dt=Math.max(1,now-drag.lt);
    vel={x:0.8*(e.clientX-drag.lx)/dt+0.2*vel.x, y:0.8*(e.clientY-drag.ly)/dt+0.2*vel.y};
    drag.lt=now; drag.lx=e.clientX; drag.ly=e.clientY;
    pos=clamp({x:drag.ox+dx,y:drag.oy+dy}); place();
  }
  function up(e){
    if(!drag||e.pointerId!==drag.id) return;
    const d=drag; drag=null; el.classList.remove("lift");
    if(!d.moved){ tapThrough(e.clientX,e.clientY); return; }
    if(performance.now()-d.lt>80) vel={x:0,y:0};
    let last=performance.now();
    const step=now=>{
      const dt=Math.min(32,now-last); last=now;
      vel.x*=Math.pow(0.992,dt); vel.y*=Math.pow(0.992,dt);
      const np=clamp({x:pos.x+vel.x*dt,y:pos.y+vel.y*dt});
      if(np.x===pos.x&&np.y===pos.y){vel={x:0,y:0};}
      pos=np; place();
      if(Math.hypot(vel.x,vel.y)>0.02) glide=requestAnimationFrame(step); else persist();
    };
    glide=requestAnimationFrame(step);
  }
  function tapThrough(x,y){
    el.style.pointerEvents="none";
    const t=document.elementFromPoint(x,y);
    el.style.pointerEvents="";
    if(t&&t!==el) t.click();
  }

  function mount(){
    if(S.mode!=="in") return unmount();
    if(!under){under=document.createElement("div");under.className="page under-sheet";under.setAttribute("aria-hidden","true");}
    if(!el){
      el=document.createElement("div");el.className="redsheet";el.setAttribute("role","img");el.setAttribute("aria-label","赤シート（ドラッグで移動）");
      el.innerHTML='<span class="grip" aria-hidden="true"></span>';
      el.addEventListener("pointerdown",down);el.addEventListener("pointermove",move);
      el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
    }
    if(!btn){
      btn=document.createElement("button");btn.className="sheetbtn";btn.id="sheetbtn";
      btn.innerHTML='<span class="sw" aria-hidden="true"></span><span>赤シート</span>';
      btn.onclick=toggle;
    }
    btn.setAttribute("aria-pressed",!!S.sheet);
    document.body.appendChild(btn);
    if(S.sheet){
      if(!pos) pos=load();
      document.body.appendChild(under); document.body.appendChild(el);
      sync();
      const page=$("#page"); if(page) page.addEventListener("scroll",place,{passive:true});
    }else{under.remove();el.remove();}
  }
  function unmount(){[el,under,btn].forEach(n=>n&&n.remove());}
  function toggle(){
    S.sheet=!S.sheet;save();
    if(S.sheet){pos=load();}
    mount();
    if(S.sheet){el.classList.add("drop");setTimeout(()=>el&&el.classList.remove("drop"),260);}
  }
  addEventListener("resize",()=>{if(pos){pos=clamp(pos);place();}});
  return {mount,unmount,sync,toggle};
})();
