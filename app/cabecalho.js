function renderContador(){
  var hoje=new Date();hoje.setHours(0,0,0,0);
  var reparo=DB.robos.filter(function(r){return r.status==='reparo';}).length;
  var garantia=DB.robos.filter(function(r){return r.status==='garantia';}).length;
  var atrasados=DB.robos.filter(function(r){
    if(r.status!=='reparo'&&r.status!=='garantia')return false;
    var e=r.dataEntrada?new Date(r.dataEntrada+'T00:00:00'):null;
    return e&&Math.floor((hoje-e)/(1000*60*60*24))>40;
  }).length;
  var cr=document.getElementById('cnt-reparo');
  if(cr)cr.textContent='🔧 '+(reparo+garantia)+(garantia?' (🛡️ '+garantia+')':'');
  // MELHORIA 6: soma diagnósticos em aberto (reparo + garantia)
  var totalAberto=DB.robos.filter(function(r){return (r.status==='reparo'||r.status==='garantia')&&r.diagnostico;}).reduce(function(acc,r){return acc+(r.diagnostico.total||0);},0);
  var cv=document.getElementById('cnt-valor');
  if(cv){
    if(totalAberto>0){cv.dataset.total=totalAberto;cv.style.display='inline-block';}
    else{cv.style.display='none';}
  }
  var el=document.getElementById('app-contador');
  if(el)el.innerHTML='';
}

function criarBotaoFlutuante(){
  if(document.getElementById('btn-fab'))return;
  var fab=document.createElement('button');
  fab.id='btn-fab';
  fab.innerHTML='<span style="font-size:22px;">+</span>';
  fab.style.cssText='position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#007ea8,#00e5ff);border:none;color:#000;font-weight:900;cursor:grab;z-index:9990;box-shadow:0 4px 20px rgba(0,229,255,.4);display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;';
  document.body.appendChild(fab);
  // Drag logic
  var isDragging=false,startX,startY,startRight,startBottom,moved=false;
  function onStart(ex,ey){
    isDragging=true;moved=false;
    startX=ex;startY=ey;
    var rect=fab.getBoundingClientRect();
    startRight=window.innerWidth-rect.right;
    startBottom=window.innerHeight-rect.bottom;
    fab.style.cursor='grabbing';
  }
  function onMove(ex,ey){
    if(!isDragging)return;
    var dx=ex-startX,dy=ey-startY;
    if(Math.abs(dx)>4||Math.abs(dy)>4)moved=true;
    var newRight=Math.max(8,Math.min(window.innerWidth-64,startRight-dx));
    var newBottom=Math.max(8,Math.min(window.innerHeight-64,startBottom-dy));
    fab.style.right=newRight+'px';
    fab.style.bottom=newBottom+'px';
    fab.style.left='auto';fab.style.top='auto';
  }
  function onEnd(){
    isDragging=false;
    fab.style.cursor='grab';
  }
  fab.addEventListener('mousedown',function(e){onStart(e.clientX,e.clientY);e.preventDefault();});
  document.addEventListener('mousemove',function(e){onMove(e.clientX,e.clientY);});
  document.addEventListener('mouseup',function(){onEnd();});
  fab.addEventListener('touchstart',function(e){onStart(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
  document.addEventListener('touchmove',function(e){if(isDragging){onMove(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();}},{passive:false});
  document.addEventListener('touchend',function(){onEnd();});
  fab.onclick=function(){if(!moved){switchTab('checkin');window.scrollTo(0,0);}};
}
