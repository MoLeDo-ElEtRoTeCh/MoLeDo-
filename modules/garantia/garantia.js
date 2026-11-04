var filtroGarantia='ativas';

function garantiaEmAtendimento(r){return r.status==='reparo'&&(r.mensagens||[]).some(function(m){return m.tipo==='voltouReparo';});}
function estadoFiltroGarantia(registro,hojeISO){
  var r=registro.robo;
  if(registro.arquivado)return'finalizadas';
  if(garantiaEmAtendimento(r))return'em_atendimento';
  if(r.status==='garantia'&&r.garantiaAte&&r.garantiaAte>=hojeISO)return'ativas';
  return'finalizadas';
}
function setFiltroGarantia(filtro){filtroGarantia=filtro;renderGarantia();}

function renderGarantia(){
  var el=document.getElementById('garantia-list');
  var hoje=todayISO();
  var registros=DB.robos.filter(function(r){return r.status==='garantia'||garantiaEmAtendimento(r);}).map(function(r){return{robo:r,arquivado:false};});
  (DB.lixeira||[]).forEach(function(item){if(item.robo&&item.motivo!=='cancelamento'&&(item.robo.dataServicoPronto||item.robo.garantiaAte||item.robo.status==='garantia'))registros.push({robo:item.robo,arquivado:true});});
  var unicos={};registros.forEach(function(registro){if(!unicos[registro.robo.id]||!registro.arquivado)unicos[registro.robo.id]=registro;});registros=Object.keys(unicos).map(function(id){return unicos[id];});
  var quantidades={ativas:0,em_atendimento:0,finalizadas:0,todas:registros.length};
  registros.forEach(function(registro){quantidades[estadoFiltroGarantia(registro,hoje)]++;});
  var filtros=[['ativas','ATIVAS'],['em_atendimento','EM ATENDIMENTO'],['finalizadas','FINALIZADAS'],['todas','TODAS']];
  var barra='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">'+filtros.map(function(item){return'<button class="btn '+(filtroGarantia===item[0]?'btn-cyan':'btn-close')+'" style="flex:1;min-width:120px;justify-content:center;font-size:11px;" onclick="setFiltroGarantia(\''+item[0]+'\')">'+item[1]+' ('+quantidades[item[0]]+')</button>';}).join('')+'</div>';
  registros=registros.filter(function(registro){return filtroGarantia==='todas'||estadoFiltroGarantia(registro,hoje)===filtroGarantia;}).sort(function(a,b){return (a.robo.dataEntrega||'')<(b.robo.dataEntrega||'')?1:-1;});
  if(!registros.length){el.innerHTML=barra+'<div class="empty-state"><div class="empty-icon">🛡️</div><p>Nenhuma garantia neste filtro.</p></div>';return;}
  el.innerHTML=barra+'<div class="section-title">🛡️ '+registros.length+' registro(s)</div>'+
    registros.map(function(registro){
      var r=registro.robo;
      var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
      var h=new Date();h.setHours(0,0,0,0);var ate=r.garantiaAte?new Date(r.garantiaAte+'T00:00:00'):null;
      var rest=ate?Math.max(0,Math.floor((ate-h)/86400000)):0;
      var num='#'+String(r.numVisual).padStart(3,'0');
      var msgs=r.mensagens||[];
      var waHtml=msgs.length?'<div class="wa-last">💬 Último envio: '+fmtData(msgs[msgs.length-1].data)+' — '+(WA_LABELS[msgs[msgs.length-1].tipo]||msgs[msgs.length-1].tipo)+'</div>':'';
      return'<div class="card purple-card">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'+
        '<div><div class="cliente-label">'+(c?esc(c.nome.toUpperCase()):'?')+'</div>'+
        '<div class="robot-num" style="color:#ce93d8;">'+num+'</div><div class="robot-sn">'+esc(r.sn)+'</div>'+
        '<div class="robot-model">'+esc(descricaoEquipamento(r))+'</div>'+(r.voltagem&&r.voltagem!=='—'?'<div class="robot-volt">⚡ '+esc(r.voltagem)+'</div>':'')+
        '</div><div style="text-align:right;"><div class="garantia-shield">🛡️</div>'+(r.garantiaAte?'<div class="garantia-days">'+rest+'</div><div class="days-label">dias rest.</div>':'')+'</div></div>'+
        '<span class="status-badge status-garantia">'+(registro.arquivado?'📁 Finalizada':garantiaEmAtendimento(r)?'🔧 Em atendimento':r.garantiaAte<hoje?'✅ Finalizada':'🛡️ Ativa')+'</span>'+
        (r.defeitos&&r.defeitos.length?'<div class="robot-defects">'+r.defeitos.map(function(d){return'<span class="defect-chip">'+esc(d)+'</span>';}).join('')+'</div>':'')+
        waHtml+'<div class="robot-meta">📦 Entrega: '+fmtData(r.dataEntrega)+'<br>📅 Garantia até: '+fmtData(r.garantiaAte)+(r.obs?'<br>📝 '+esc(r.obs):'')+'</div>'+
        '<div class="robot-actions">'+
        (!registro.arquivado?'<button class="btn btn-cyan" onclick="openFichaRobo(\''+r.id+'\')">📋 Ficha</button>':'')+
        (!registro.arquivado&&r.status==='garantia'?'<button class="btn btn-del" onclick="moverParaLixeira(\''+r.id+'\')">🗑️ Apagar</button>':'')+
        '</div></div>';
    }).join('');
}
