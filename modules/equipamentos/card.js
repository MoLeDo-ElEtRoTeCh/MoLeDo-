function getStatusInfo(d){
  if(d<=15)return{cls:'status-verde',txt:'Dentro do prazo inicial',cardCls:'green-card'};
  if(d<=35)return{cls:'status-amarelo',txt:'Em análise / atenção',cardCls:'yellow-card'};
  if(d<=40)return{cls:'status-vermelho',txt:'Próximo do atraso',cardCls:'red-card'};
  return{cls:'status-critico',txt:'CRÍTICO — Mais de 40 dias',cardCls:'orange-card'};
}

function dc(d){return d>40?'var(--orange)':d>35?'var(--red)':d>15?'var(--yellow)':'var(--green)';}

function renderRoboCard(r,showEntregue){
  var aguardandoRet=r.status==='reparo'&&r.servicoPronto;
  var dias=r.status==='reparo'?diasDesde(r.dataEntrada):0;
  // Se está aguardando retirada, congela os dias na data que ficou pronto
  if(aguardandoRet&&r.dataServicoPronto){dias=diasDesde2(r.dataEntrada,r.dataServicoPronto);}
  var si=r.status==='reparo'?(aguardandoRet?{cls:'status-retirada',txt:'✅ Aguardando retirada',cardCls:'retirada-card'}:getStatusInfo(dias)):null;
  var num='#'+String(r.numVisual).padStart(3,'0');
  var cc=r.status==='garantia'?'purple-card':(si?si.cardCls:'');
  if(r.diagnostico)cc+=' diag-card';
  var defHtml=r.defeitos&&r.defeitos.length?'<div class="robot-defects">'+r.defeitos.map(function(d){return'<span class="defect-chip">'+esc(d)+'</span>';}).join('')+'</div>':'';
  var statusHtml=si?'<span class="status-badge '+si.cls+'">'+si.txt+'</span>':(r.status==='garantia'?'<span class="status-badge status-garantia">🛡️ Em Garantia</span>':'');
  var msgs=r.mensagens||[];
  var waHtml=msgs.length?'<div class="wa-last">💬 Último envio: '+fmtData(msgs[msgs.length-1].data)+' — '+(WA_LABELS[msgs[msgs.length-1].tipo]||msgs[msgs.length-1].tipo)+'</div>':'';
  var diagHtml=r.diagnostico?'<div class="diag-badge">💊 Diagnóstico: '+fmtVal(r.diagnostico.total)+' · '+fmtData(r.diagnostico.data)+'</div>':'';
  // MELHORIA 1: cor de fundo suave no contador de dias
  var diasCorBg='';
  if(r.status==='reparo'){
    if(dias>40)diasCorBg='background:rgba(255,109,0,.12);border-radius:8px;padding:2px 6px;';
    else if(dias>35)diasCorBg='background:rgba(255,23,68,.1);border-radius:8px;padding:2px 6px;';
    else if(dias>15)diasCorBg='background:rgba(255,214,0,.08);border-radius:8px;padding:2px 6px;';
  }
  return'<div class="card '+cc.trim()+'">'+
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'+
    '<div><div class="robot-num">'+num+'</div><div class="robot-sn">'+esc(r.sn)+'</div><div class="robot-model">'+esc(descricaoEquipamento(r))+'</div>'+(r.voltagem&&r.voltagem!=='—'?'<div class="robot-volt">⚡ '+esc(r.voltagem)+'</div>':'')+(r.nomeClienteFinal?'<div style="font-size:11px;font-weight:700;color:#00c896;margin-top:2px;">👤 '+esc(r.nomeClienteFinal)+'</div>':'')+'</div>'+
    '<div style="text-align:right;">'+(r.status==='reparo'?(aguardandoRet?'<div style="font-size:24px;">📦</div><div class="days-label" style="color:#00c896;">retirada</div>':'<div class="days-big" style="color:'+dc(dias)+';'+diasCorBg+'">'+dias+'</div><div class="days-label">dias</div>'):'')+(r.status==='garantia'?'<div class="garantia-shield">🛡️</div>':'')+'</div></div>'+
    statusHtml+defHtml+diagHtml+waHtml+
    // MELHORIA 5: nota rápida visível
    (r.notaRapida?'<div style="background:rgba(255,214,0,.06);border-left:3px solid rgba(255,214,0,.5);border-radius:0 6px 6px 0;padding:5px 8px;font-size:12px;color:var(--yellow);margin-bottom:6px;">📝 '+esc(r.notaRapida)+'</div>':'')+
    // MELHORIA 3: mini timeline
    renderTimeline(r)+
    '<div class="robot-meta">📅 Entrada: '+fmtData(r.dataEntrada)+(r.dataEntrega?' · 📦 Entrega: '+fmtData(r.dataEntrega):'')+(r.obs?'<br>📝 '+esc(r.obs):'')+'</div>'+
    '<div class="robot-actions">'+
    '<button class="btn btn-cyan" onclick="openFichaRobo(this.dataset.id)" data-id="'+r.id+'">📋 Ficha</button>'+
    (r.status==='reparo'?'<button class="btn btn-close" onclick="abrirNotaRapida(this.dataset.id)" data-id="'+r.id+'" title="Nota rápida">📝</button>':'')+
    (r.status==='reparo'&&r.bancada?'<button class="btn btn-wa" onclick="reenviarWABancada(this.dataset.id)" data-id="'+r.id+'" title="Reenviar WhatsApp bancada" style="padding:8px 10px;font-size:12px;">🔧💬</button>':'')+
    (aguardandoRet?'<button class="btn" onclick="enviarLembreteRetirada(this.dataset.id)" data-id="'+r.id+'" style="background:rgba(0,200,150,.15);border:1px solid rgba(0,200,150,.4);color:#00c896;padding:8px 10px;font-size:12px;">📦💬 Lembrar retirada</button>':'')+
    (r.status==='garantia'?'<button class="btn btn-del" onclick="moverParaLixeira(this.dataset.id)" data-id="'+r.id+'">🗑️ Apagar</button>':'')+
    '</div></div>';
}
