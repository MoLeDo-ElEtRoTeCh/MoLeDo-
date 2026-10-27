function tvCorPorDias(dias){
  if(dias>=41)return{cor:'#ff1744',label:'🔴'};
  if(dias>=31)return{cor:'#ff6d00',label:'🟠'};
  if(dias>=21)return{cor:'#ffd600',label:'🟡'};
  return{cor:'#00e676',label:'🟢'};
}

function tvSaudacao(){
  var h=new Date().getHours();
  if(h>=5&&h<12)return'☀️ Bom dia!';
  if(h>=12&&h<18)return'🌤️ Boa tarde!';
  return'🌙 Boa noite!';
}

function tvBuscarTemperatura(){
  fetch('https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63&current=temperature_2m&timezone=America/Sao_Paulo')
    .then(function(r){return r.json();})
    .then(function(d){
      var temp=d.current&&d.current.temperature_2m;
      var el=document.getElementById('tv-temp');
      if(el&&temp!==undefined)el.textContent='🌡️ '+Math.round(temp)+'°C';
    }).catch(function(){});
}

function renderModoTV(){
  var hoje=new Date();hoje.setHours(0,0,0,0);
  var robosAtivos=DB.robos.filter(function(r){return r.status==='reparo';});
  var vermelhos=[],amarelos=[],fila=[];
  robosAtivos.forEach(function(r){
    var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
    var entrada=r.dataEntrada?new Date(r.dataEntrada+'T00:00:00'):null;
    var dias=entrada?Math.floor((hoje-entrada)/(1000*60*60*24)):0;
    var st=_tvStatusMap[r.id]||'fila';
    var item={r:r,c:c,dias:dias};
    if(st==='vermelho')vermelhos.push(item);
    else if(st==='amarelo')amarelos.push(item);
    else fila.push(item);
  });
  fila.sort(function(a,b){return b.dias-a.dias;});
  vermelhos.sort(function(a,b){return b.dias-a.dias;});
  amarelos.sort(function(a,b){return b.dias-a.dias;});

  // VERMELHO
  var elV=document.getElementById('tv-vermelho');
  if(elV){
    var hV='<div style="font-size:11px;font-weight:700;color:#ff1744;letter-spacing:3px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #ff174430;">🔴 EM BANCADA ('+vermelhos.length+')</div>';
    if(!vermelhos.length)hV+='<div style="color:#333;text-align:center;padding:20px;font-size:13px;font-family:\'Rajdhani\',sans-serif;">Nenhum em bancada</div>';
    else if(vermelhos.length===1){
      var i=vermelhos[0];var cor=tvCorPorDias(i.dias);
      var num='#'+String(i.r.numVisual).padStart(3,'0');
      var nome=i.c?i.c.nome:'?';
      var defeitos=i.r.defeitos&&i.r.defeitos.length?i.r.defeitos.join(' · '):'Sem defeitos registrados';
      var appUrl='https://moledo-eletrotech.github.io/MoLeDo-#robo='+i.r.id;
      hV+='<div style="display:flex;gap:20px;align-items:flex-start;">'+
        '<div style="flex:1;">'+
          '<div style="font-size:44px;font-weight:900;color:'+cor.cor+';margin-bottom:8px;line-height:1.1;">'+esc(nome)+'</div>'+
          '<div style="font-size:24px;color:#aaa;font-family:\'Rajdhani\',sans-serif;margin-bottom:8px;">'+num+' · '+esc(descricaoEquipamento(i.r)||'—')+' · <span style="color:'+cor.cor+';font-weight:900;">'+i.dias+' dias</span></div>'+
          '<div style="font-size:20px;color:#888;font-family:\'Rajdhani\',sans-serif;margin-bottom:18px;">'+esc(defeitos)+'</div>'+
          '<div style="display:flex;gap:10px;">'+
            '<button onclick="tvMover(\''+i.r.id+'\',\'amarelo\')" style="'+tvBtnStyle('#ffd600')+'font-size:16px;padding:10px 20px;">🟡 Mover p/ Próximo</button>'+
            '<button onclick="tvMover(\''+i.r.id+'\',\'fila\')" style="'+tvBtnStyle('#00e676')+'font-size:16px;padding:10px 20px;">🟢 Mover p/ Fila</button>'+
          '</div>'+
        '</div>'+
        '<img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=0&data='+encodeURIComponent(appUrl)+'" style="width:130px;height:130px;border-radius:8px;border:2px solid '+cor.cor+'44;">'+
      '</div>';
    } else {
      vermelhos.forEach(function(i){
        var cor=tvCorPorDias(i.dias);
        var num='#'+String(i.r.numVisual).padStart(3,'0');
        var nome=i.c?i.c.nome:'?';
        hV+='<div onclick="tvAbrirDetalhe(\''+i.r.id+'\')" style="cursor:pointer;background:#111;border-radius:8px;padding:14px 18px;margin-bottom:10px;border-left:5px solid '+cor.cor+';display:flex;align-items:center;justify-content:space-between;">'+
          '<div><span style="font-size:28px;font-weight:900;color:'+cor.cor+';">'+esc(nome)+'</span> <span style="font-size:18px;color:#888;font-family:\'Rajdhani\',sans-serif;">'+num+'</span></div>'+
          '<span style="font-size:30px;font-weight:900;color:'+cor.cor+';">'+i.dias+'d</span>'+
        '</div>';
      });
    }
    elV.innerHTML=hV;
  }

  // AMARELO
  var elA=document.getElementById('tv-amarelo');
  if(elA){
    var hA='<div style="font-size:11px;font-weight:700;color:#ffd600;letter-spacing:3px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #ffd60030;">🟡 PRÓXIMOS ('+amarelos.length+')</div>';
    if(!amarelos.length)hA+='<div style="color:#333;text-align:center;padding:20px;font-size:13px;font-family:\'Rajdhani\',sans-serif;">Nenhum próximo</div>';
    else amarelos.forEach(function(i){
      var cor=tvCorPorDias(i.dias);
      var num='#'+String(i.r.numVisual).padStart(3,'0');
      var nome=i.c?i.c.nome:'?';
      hA+='<div onclick="tvAbrirDetalhe(\''+i.r.id+'\')" style="cursor:pointer;background:#111;border-radius:8px;padding:10px 14px;margin-bottom:8px;border-left:4px solid '+cor.cor+';display:flex;align-items:center;justify-content:space-between;">'+
        '<div><span style="font-size:18px;font-weight:900;color:'+cor.cor+';">'+esc(nome)+'</span> <span style="font-size:13px;color:#888;font-family:\'Rajdhani\',sans-serif;">'+num+'</span></div>'+
        '<span style="font-size:18px;font-weight:900;color:'+cor.cor+';">'+i.dias+'d</span>'+
      '</div>';
    });
    elA.innerHTML=hA;
  }

  // FILA
  var elF=document.getElementById('tv-fila');
  if(elF){
    var hF='<div style="font-size:11px;font-weight:700;color:#00e676;letter-spacing:3px;margin-bottom:8px;">🟢 FILA DE ESPERA ('+fila.length+')</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
    fila.forEach(function(i){
      var cor=tvCorPorDias(i.dias);
      var num='#'+String(i.r.numVisual).padStart(3,'0');
      var nome=i.c?i.c.nome:'?';
      hF+='<div onclick="tvAbrirDetalhe(\''+i.r.id+'\')" style="cursor:pointer;background:#0d0d0d;border:1px solid '+cor.cor+'44;border-radius:6px;padding:6px 12px;display:flex;align-items:center;gap:8px;">'+
        '<span style="font-size:14px;font-weight:900;color:'+cor.cor+';font-family:\'Rajdhani\',sans-serif;">'+esc(nome)+'</span>'+
        '<span style="font-size:11px;color:#888;font-family:\'Rajdhani\',sans-serif;">'+num+'</span>'+
        '<span style="font-size:13px;font-weight:700;color:'+cor.cor+';">'+i.dias+'d</span>'+
      '</div>';
    });
    hF+='</div>';
    elF.innerHTML=hF;
  }
}

function tvBtnStyle(cor){
  return'background:'+cor+'22;border:1px solid '+cor+'88;color:'+cor+';border-radius:6px;padding:6px 14px;font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;';
}

function tvAbrirDetalhe(roboId){
  var modal=document.getElementById('tv-modal');if(!modal)return;
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var hoje=new Date();hoje.setHours(0,0,0,0);
  var entrada=r.dataEntrada?new Date(r.dataEntrada+'T00:00:00'):null;
  var dias=entrada?Math.floor((hoje-entrada)/(1000*60*60*24)):0;
  var cor=tvCorPorDias(dias);
  var num='#'+String(r.numVisual).padStart(3,'0');
  var nome=c?c.nome:'?';
  var defeitos=r.defeitos&&r.defeitos.length?r.defeitos.join(' · '):'Sem defeitos registrados';
  var st=_tvStatusMap[roboId]||'fila';
  var appUrl='https://moledo-eletrotech.github.io/MoLeDo-#robo='+r.id;
  modal.style.display='flex';
  modal.innerHTML=
    '<div style="background:#0d0d0d;border:2px solid '+cor.cor+';border-radius:16px;padding:28px 32px;max-width:520px;width:90%;position:relative;">'+
      '<button onclick="tvFecharDetalhe()" style="position:absolute;top:12px;right:12px;background:none;border:none;color:#555;font-size:20px;cursor:pointer;">✕</button>'+
      '<div style="font-size:26px;font-weight:900;color:'+cor.cor+';margin-bottom:6px;">'+esc(nome)+'</div>'+
      '<div style="font-size:14px;color:#aaa;font-family:\'Rajdhani\',sans-serif;margin-bottom:4px;">'+num+' · '+esc(descricaoEquipamento(r)||'—')+' · <b style="color:'+cor.cor+';">'+dias+' dias</b></div>'+
      '<div style="font-size:13px;color:#777;font-family:\'Rajdhani\',sans-serif;margin-bottom:20px;">'+esc(defeitos)+'</div>'+
      '<div style="display:flex;justify-content:center;margin-bottom:20px;">'+
        '<img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&margin=0&data='+encodeURIComponent(appUrl)+'" style="border-radius:6px;border:2px solid '+cor.cor+'44;">'+
      '</div>'+
      '<div style="font-size:11px;color:#888;letter-spacing:2px;text-align:center;margin-bottom:10px;">MOVER PARA:</div>'+
      '<div style="display:flex;gap:8px;justify-content:center;">'+
        (st!=='vermelho'?'<button onclick="tvMover(\''+roboId+'\',\'vermelho\')" style="'+tvBtnStyle('#ff1744')+'">🔴 Bancada</button>':'')+
        (st!=='amarelo'?'<button onclick="tvMover(\''+roboId+'\',\'amarelo\')" style="'+tvBtnStyle('#ffd600')+'">🟡 Próximo</button>':'')+
        (st!=='fila'?'<button onclick="tvMover(\''+roboId+'\',\'fila\')" style="'+tvBtnStyle('#00e676')+'">🟢 Fila</button>':'')+
      '</div>'+
    '</div>';
}

function tvFecharDetalhe(){
  var m=document.getElementById('tv-modal');if(m)m.style.display='none';
}
