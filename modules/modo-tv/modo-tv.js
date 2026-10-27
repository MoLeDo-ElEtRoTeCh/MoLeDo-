function abrirMoverTV(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var num='#'+String(r.numVisual).padStart(3,'0');
  var nome=c?c.nome:'?';
  var st=_tvStatusMap[roboId]||r.statusTV||'fila';
  var stLabel=st==='vermelho'?'🔴 Bancada':st==='amarelo'?'🟡 Próximo':'🟢 Fila';
  openModal(
    '<div class="modal-title">📺 Mover na TV</div>'+
    '<div style="font-size:14px;color:var(--text2);margin-bottom:6px;font-family:\'Rajdhani\',sans-serif;">'+esc(nome)+' · '+num+'</div>'+
    '<div style="font-size:12px;color:var(--text3);margin-bottom:16px;">Status atual: <b>'+stLabel+'</b></div>'+
    '<div style="display:flex;flex-direction:column;gap:8px;">'+
      (st!=='vermelho'?'<button onclick="moverTVeFechar(\''+roboId+'\',\'vermelho\')" style="background:rgba(255,23,68,.1);border:1px solid rgba(255,23,68,.4);color:#ff1744;border-radius:10px;padding:14px;font-family:\'Rajdhani\',sans-serif;font-size:16px;font-weight:700;cursor:pointer;">🔴 Colocar na Bancada</button>':'')+
      (st!=='amarelo'?'<button onclick="moverTVeFechar(\''+roboId+'\',\'amarelo\')" style="background:rgba(255,214,0,.1);border:1px solid rgba(255,214,0,.4);color:#ffd600;border-radius:10px;padding:14px;font-family:\'Rajdhani\',sans-serif;font-size:16px;font-weight:700;cursor:pointer;">🟡 Marcar como Próximo</button>':'')+
      (st!=='fila'?'<button onclick="moverTVeFechar(\''+roboId+'\',\'fila\')" style="background:rgba(0,230,118,.1);border:1px solid rgba(0,230,118,.4);color:#00e676;border-radius:10px;padding:14px;font-family:\'Rajdhani\',sans-serif;font-size:16px;font-weight:700;cursor:pointer;">🟢 Voltar para Fila</button>':'')+
    '</div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button></div>'
  );
}

function moverTVeFechar(roboId,destino){
  _tvStatusMap[roboId]=destino;
  tvSalvarStatus();
  closeModal();
  showToast('📺 '+( destino==='vermelho'?'🔴 Colocado na bancada!':destino==='amarelo'?'🟡 Marcado como próximo!':'🟢 Voltou para a fila!'));
}

function tvSalvarStatus(){
  DB.robos.forEach(function(r){r.statusTV=_tvStatusMap[r.id]||'fila';});
  if(typeof syncToFirebase==='function')syncToFirebase();
  else if(typeof window.syncToFirebase==='function')window.syncToFirebase();
}

function abrirModoTV(){
  DB.robos.forEach(function(r){_tvStatusMap[r.id]=r.statusTV||'fila';});
  var overlay=document.getElementById('tv-overlay');
  if(overlay){overlay.style.display='flex';renderModoTV();return;}
  overlay=document.createElement('div');
  overlay.id='tv-overlay';
  overlay.style.cssText='display:flex;position:fixed;inset:0;z-index:99999;background:#000;flex-direction:column;font-family:\'Orbitron\',monospace;overflow:hidden;';
  overlay.innerHTML=
    // BORDA ANIMADA ROOMBA
    '<canvas id="tv-roomba-canvas" style="position:absolute;inset:0;pointer-events:none;z-index:1;"></canvas>'+
    // HEADER
    '<div style="position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:10px 24px;border-bottom:1px solid #1a1a1a;flex-shrink:0;background:#000;">'+
      '<div>'+
        '<img src="https://moledo-eletrotech.github.io/MoLeDo-/logo.png" style="max-height:115px;width:auto;display:block;margin:0 auto;" alt="MoLeDo ElEtRoTeCh">'+

        '<div style="font-size:9px;color:#00b8d9;letter-spacing:3px;margin-top:1px;">REPARO É NOSSA LINGUAGEM · TECNOLOGIA É NOSSA PAIXÃO</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:16px;">'+
        '<span id="tv-saudacao" style="font-size:14px;color:#aaa;font-family:\'Rajdhani\',sans-serif;font-weight:700;"></span>'+
        '<span id="tv-temp" style="font-size:14px;color:#00e5ff;font-family:\'Rajdhani\',sans-serif;font-weight:700;">🌡️ --°C</span>'+
        '<span id="tv-status-conn" style="font-size:12px;font-family:\'Rajdhani\',sans-serif;font-weight:700;">📡 Online</span>'+
        '<div style="text-align:right;">'+
          '<div id="tv-clock" style="font-size:28px;font-weight:900;color:#ffd600;line-height:1;"></div>'+
          '<div id="tv-date" style="font-size:12px;color:#888;font-family:\'Rajdhani\',sans-serif;margin-top:2px;"></div>'+
        '</div>'+
        '<button onclick="fecharModoTV()" style="background:rgba(255,23,68,.15);border:1px solid #ff1744;color:#ff1744;border-radius:6px;padding:6px 14px;font-family:\'Orbitron\',monospace;font-size:12px;font-weight:700;cursor:pointer;">✕</button>'+
      '</div>'+
    '</div>'+
    // BODY
    '<div style="position:relative;z-index:2;flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;padding:10px 16px;overflow:hidden;">'+
      '<div id="tv-vermelho" style="border:2px solid #ff1744;border-radius:10px;padding:12px;overflow-y:auto;background:#0a0000;"></div>'+
      '<div id="tv-amarelo" style="border:2px solid #ffd600;border-radius:10px;padding:12px;overflow-y:auto;background:#0a0a00;"></div>'+
      '<div id="tv-fila" style="grid-column:1/-1;border:2px solid #00e676;border-radius:10px;padding:10px 14px;overflow-y:auto;background:#00080a;"></div>'+
    '</div>'+
    // RODAPÉ BÍBLICO
    '<div id="tv-biblica" style="position:relative;z-index:2;text-align:center;padding:8px 24px;font-family:\'Rajdhani\',sans-serif;font-size:14px;color:#aaa;border-top:1px solid #111;flex-shrink:0;font-style:italic;"></div>'+
    '<div id="tv-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:100000;align-items:center;justify-content:center;"></div>';
  document.body.appendChild(overlay);
  renderModoTV();
  tvIniciarRoomba();
  tvBuscarTemperatura();

  function tick(){
    var now=new Date();
    var cl=document.getElementById('tv-clock');
    var dt=document.getElementById('tv-date');
    var sd=document.getElementById('tv-saudacao');
    var conn=document.getElementById('tv-status-conn');
    var bib=document.getElementById('tv-biblica');
    if(cl)cl.textContent=now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    if(dt)dt.textContent=now.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    if(sd)sd.textContent=tvSaudacao();
    if(conn)conn.innerHTML=navigator.onLine?'<span style="color:#00e676;">📡 Online</span>':'<span style="color:#ff1744;">📡 Offline</span>';
    if(bib)bib.textContent=_tvFrasesBiblicas[_tvFraseIdx];
  }
  tick();
  window._tvClockInterval=setInterval(tick,1000);
  // troca frase a cada 30s
  window._tvFraseInterval=setInterval(function(){
    _tvFraseIdx=(_tvFraseIdx+1)%_tvFrasesBiblicas.length;
  },30000);
  window._tvInterval=setInterval(function(){
    tvBuscarTemperatura();
    if(typeof window.loadFromFirebase==='function'){
      window.loadFromFirebase().then(function(){renderModoTV();});
    } else renderModoTV();
  },30000);
  if(overlay.requestFullscreen)overlay.requestFullscreen().catch(function(){});
}

function fecharModoTV(){
  clearInterval(window._tvInterval);
  clearInterval(window._tvClockInterval);
  clearInterval(window._tvFraseInterval);
  clearInterval(window._tvRoombaInterval);
  if(document.fullscreenElement)document.exitFullscreen().catch(function(){});
  var o=document.getElementById('tv-overlay');if(o)o.style.display='none';
}

function tvMover(roboId,destino){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var hoje=new Date();hoje.setHours(0,0,0,0);
  var entrada=r.dataEntrada?new Date(r.dataEntrada+'T00:00:00'):null;
  var dias=entrada?Math.floor((hoje-entrada)/(1000*60*60*24)):0;
  var stAtual=_tvStatusMap[roboId]||'fila';
  // aviso se mover de vermelho/amarelo para fila
  if((stAtual==='vermelho'||stAtual==='amarelo')&&destino==='fila'){
    if(!confirm('Este robô está há '+dias+' dias. Mover de volta para a fila?'))return;
  }
  // aviso se mover da fila para amarelo (fura fila)
  if(stAtual==='fila'&&destino==='amarelo'){
    var temAmarelo=DB.robos.some(function(x){return (_tvStatusMap[x.id]||'fila')==='amarelo';});
    if(temAmarelo&&!confirm('Já tem robô marcado como próximo. Quer colocar este na frente?'))return;
  }
  _tvStatusMap[roboId]=destino;
  tvSalvarStatus();
  tvFecharDetalhe();
  renderModoTV();
}
