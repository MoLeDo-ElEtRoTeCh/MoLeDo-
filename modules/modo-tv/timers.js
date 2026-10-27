function tvIniciarRoomba(){
  var canvas=document.getElementById('tv-roomba-canvas');
  if(!canvas)return;
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  var ctx=canvas.getContext('2d');
  var W=canvas.width,H=canvas.height;
  var pos=0; // 0=top, 1=right, 2=bottom, 3=left
  var x=0,y=0,speed=2;
  var perimeter=2*(W+H);
  var dist=0;
  var cores=['#00e676','#ffd600','#ff6d00','#ff1744'];
  var coreIdx=0;
  var trail=[];
  function step(){
    dist+=speed;
    if(dist>perimeter)dist=0;
    // posição na borda
    if(dist<W){x=dist;y=0;}
    else if(dist<W+H){x=W;y=dist-W;}
    else if(dist<2*W+H){x=W-(dist-W-H);y=H;}
    else{x=0;y=H-(dist-2*W-H);}
    // muda cor gradualmente
    var t=dist/perimeter;
    var ci=Math.floor(t*cores.length)%cores.length;
    if(ci!==coreIdx){coreIdx=ci;}
    trail.push({x:x,y:y,cor:cores[coreIdx]});
    if(trail.length>120)trail.shift();
    ctx.clearRect(0,0,W,H);
    // desenha rastro
    for(var i=0;i<trail.length;i++){
      var alpha=(i/trail.length)*0.6;
      ctx.beginPath();ctx.arc(trail[i].x,trail[i].y,3,0,Math.PI*2);
      ctx.fillStyle=trail[i].cor;ctx.globalAlpha=alpha;ctx.fill();
    }
    ctx.globalAlpha=1;
    // desenha robô (círculo com detalhes)
    ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);
    ctx.fillStyle='#111';ctx.fill();
    ctx.strokeStyle=cores[coreIdx];ctx.lineWidth=2;ctx.stroke();
    // botão centro
    ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);
    ctx.fillStyle=cores[coreIdx];ctx.fill();
    // escovinha
    var ang=Math.atan2(y-H/2,x-W/2);
    ctx.beginPath();
    ctx.moveTo(x+Math.cos(ang+0.5)*12,y+Math.sin(ang+0.5)*12);
    ctx.lineTo(x+Math.cos(ang+0.8)*18,y+Math.sin(ang+0.8)*18);
    ctx.strokeStyle=cores[coreIdx];ctx.lineWidth=2;ctx.globalAlpha=0.7;ctx.stroke();
    ctx.globalAlpha=1;
  }
  window._tvRoombaInterval=setInterval(step,16);
}
