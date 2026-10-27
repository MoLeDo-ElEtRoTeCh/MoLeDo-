function showToast(msg,duration){
  var t=document.getElementById('_simple-toast');
  if(!t){t=document.createElement('div');t.id='_simple-toast';
    t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(10px);background:rgba(10,12,16,.92);border:1px solid rgba(0,229,255,.35);color:#00e5ff;padding:10px 22px;border-radius:12px;font-weight:700;font-size:13px;z-index:99998;white-space:nowrap;max-width:92%;text-align:center;pointer-events:none;transition:all .25s;opacity:0;font-family:\'Rajdhani\',sans-serif;letter-spacing:.5px;box-shadow:0 4px 20px rgba(0,0,0,.5);';
    document.body.appendChild(t);}
  t.textContent=msg;clearTimeout(t._tid);
  requestAnimationFrame(function(){t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';});
  t._tid=setTimeout(function(){t.style.opacity='0';t.style.transform='translateX(-50%) translateY(10px)';},duration||3000);
}
