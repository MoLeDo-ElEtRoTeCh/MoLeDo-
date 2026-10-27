function updateAlertBanner(){
  var hoje=new Date();hoje.setHours(0,0,0,0);
  var criticos=DB.robos.filter(function(r){return r.status==='reparo'&&diasDesde(r.dataEntrada)>40&&!r.aguardandoPeca&&!r.servicoPronto;});
  var proximoAtraso=DB.robos.filter(function(r){var d=diasDesde(r.dataEntrada);return r.status==='reparo'&&d>35&&d<=40&&!r.aguardandoPeca&&!r.servicoPronto;});
  var agPeca=DB.robos.filter(function(r){return r.status==='reparo'&&r.aguardandoPeca;});
  var aguardRet=DB.robos.filter(function(r){return r.status==='reparo'&&r.servicoPronto;});
  // Garantia vencendo: 7 dias ou menos pra acabar
  var garVencendo=DB.robos.filter(function(r){
    if(r.status!=='garantia'||!r.garantiaAte)return false;
    var ate=new Date(r.garantiaAte+'T00:00:00');
    var rest=Math.floor((ate-hoje)/86400000);
    return rest>=0&&rest<=7;
  });
  var lembretes=DB.lembretes?DB.lembretes.filter(function(l){return !l.feito&&new Date(l.dt)<=new Date();}):[];
  var el=document.getElementById('alert-banner');
  var ticker=document.getElementById('alert-ticker');
  var temAlgo=criticos.length||proximoAtraso.length||agPeca.length||aguardRet.length||garVencendo.length||lembretes.length;
  if(!temAlgo){el.style.display='none';return;}
  var parts=[];
  lembretes.forEach(function(l){
    var r=DB.robos.find(function(x){return x.id===l.roboId;});
    var c=r?DB.clientes.find(function(x){return x.id===r.clienteId;}):null;
    parts.push('<span style="color:#ffd600;">🔔 '+l.label+(c?' · '+c.nome:'')+'</span>');
  });
  criticos.forEach(function(r){
    var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
    var num='#'+String(r.numVisual).padStart(3,'0');
    var dias=diasDesde(r.dataEntrada);
    parts.push('<span style="color:#ff6d00;">🔥 '+num+(c?' · '+c.nome:'')+(descricaoEquipamento(r)?' · '+descricaoEquipamento(r):'')+' — '+dias+' dias</span>');
  });
  proximoAtraso.forEach(function(r){
    var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
    var num='#'+String(r.numVisual).padStart(3,'0');
    var dias=diasDesde(r.dataEntrada);
    parts.push('<span style="color:#ff4444;">⚠️ '+num+(c?' · '+c.nome:'')+(descricaoEquipamento(r)?' · '+descricaoEquipamento(r):'')+' — '+dias+' dias</span>');
  });
  agPeca.forEach(function(r){
    var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
    var num='#'+String(r.numVisual).padStart(3,'0');
    var ap=r.aguardandoPeca;
    var diasFalta=0;var atrasou=false;
    if(ap&&ap.dataPrevista){var dp=new Date(ap.dataPrevista+'T00:00:00');diasFalta=Math.ceil((dp-hoje)/(1000*60*60*24));atrasou=diasFalta<0;}
    var info=atrasou?'peça atrasada '+Math.abs(diasFalta)+'d':'falta '+Math.abs(diasFalta)+'d';
    parts.push('<span style="color:#c77dff;">📦 '+num+(c?' · '+c.nome:'')+(descricaoEquipamento(r)?' · '+descricaoEquipamento(r):'')+' — '+info+'</span>');
  });
  aguardRet.forEach(function(r){
    var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
    var num='#'+String(r.numVisual).padStart(3,'0');
    parts.push('<span style="color:#00c896;">📦 '+num+(c?' · '+c.nome:'')+(descricaoEquipamento(r)?' · '+descricaoEquipamento(r):'')+' — aguardando retirada</span>');
  });
  garVencendo.forEach(function(r){
    var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
    var num='#'+String(r.numVisual).padStart(3,'0');
    var ate=new Date(r.garantiaAte+'T00:00:00');
    var rest=Math.floor((ate-hoje)/86400000);
    parts.push('<span style="color:#ce93d8;">🛡️ '+num+(c?' · '+c.nome:'')+' — garantia vence em '+rest+'d</span>');
  });
  if(ticker)ticker.innerHTML='&nbsp;&nbsp;&nbsp;'+parts.join('&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;')+'&nbsp;&nbsp;&nbsp;';
  el.style.display='flex';
}
