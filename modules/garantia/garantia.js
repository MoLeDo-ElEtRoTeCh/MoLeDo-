function renderGarantia(){
  var el=document.getElementById('garantia-list');
  var robos=DB.robos.filter(function(r){return r.status==='garantia';}).sort(function(a,b){return a.dataEntrega<b.dataEntrega?1:-1;});
  if(!robos.length){el.innerHTML='<div class="empty-state"><div class="empty-icon">🛡️</div><p>Nenhum robô em garantia ainda.</p></div>';return;}
  el.innerHTML='<div class="section-title">🛡️ '+robos.length+' robô(s) em garantia</div>'+
    robos.map(function(r){
      var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
      var h=new Date();h.setHours(0,0,0,0);var ate=new Date(r.garantiaAte+'T00:00:00');
      var rest=Math.max(0,Math.floor((ate-h)/86400000));
      var num='#'+String(r.numVisual).padStart(3,'0');
      var msgs=r.mensagens||[];
      var waHtml=msgs.length?'<div class="wa-last">💬 Último envio: '+fmtData(msgs[msgs.length-1].data)+' — '+(WA_LABELS[msgs[msgs.length-1].tipo]||msgs[msgs.length-1].tipo)+'</div>':'';
      return'<div class="card purple-card">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'+
        '<div><div class="cliente-label">'+(c?esc(c.nome.toUpperCase()):'?')+'</div>'+
        '<div class="robot-num" style="color:#ce93d8;">'+num+'</div><div class="robot-sn">'+esc(r.sn)+'</div>'+
        '<div class="robot-model">'+esc(descricaoEquipamento(r))+'</div>'+(r.voltagem&&r.voltagem!=='—'?'<div class="robot-volt">⚡ '+esc(r.voltagem)+'</div>':'')+
        '</div><div style="text-align:right;"><div class="garantia-shield">🛡️</div><div class="garantia-days">'+rest+'</div><div class="days-label">dias rest.</div></div></div>'+
        '<span class="status-badge status-garantia">🛡️ Em Garantia</span>'+
        (r.defeitos&&r.defeitos.length?'<div class="robot-defects">'+r.defeitos.map(function(d){return'<span class="defect-chip">'+esc(d)+'</span>';}).join('')+'</div>':'')+
        waHtml+'<div class="robot-meta">📦 Entrega: '+fmtData(r.dataEntrega)+'<br>📅 Garantia até: '+fmtData(r.garantiaAte)+(r.obs?'<br>📝 '+esc(r.obs):'')+'</div>'+
        '<div class="robot-actions">'+
        '<button class="btn btn-cyan" onclick="openFichaRobo(\''+r.id+'\')">📋 Ficha</button>'+
        '<button class="btn btn-del" onclick="moverParaLixeira(\''+r.id+'\')">🗑️ Apagar</button>'+
        '</div></div>';
    }).join('');
}
