function renderBadges(){
  var al=DB.robos.filter(function(r){return r.status==='reparo'&&diasDesde(r.dataEntrada)>35&&!r.servicoPronto&&!r.aguardandoPeca;});
  var b=document.getElementById('badge-alertas');
  if(al.length){b.textContent=al.length;b.style.display='inline-block';b.className='tab-badge'+(al.some(function(r){return diasDesde(r.dataEntrada)>40;})?' orange':'');}
  else b.style.display='none';
  var bl=document.getElementById('badge-lixeira');
  if(DB.lixeira.length){bl.textContent=DB.lixeira.length;bl.style.display='inline-block';}else bl.style.display='none';
  // Badge diagnóstico: conta robôs na bancada SEM diagnóstico (pendentes)
  var pend=DB.robos.filter(function(r){return r.status==='reparo'&&(r.bancada||r.entradaBancada)&&!r.diagnostico;}).length;
  var bd=document.getElementById('badge-diag');
  if(pend){bd.textContent=pend;bd.style.display='inline-block';bd.className='tab-badge gray';}else bd.style.display='none';
}

function renderAlertas(){
  var el=document.getElementById('alertas-list');
  var agPeca=DB.robos.filter(function(r){return r.status==='reparo'&&r.aguardandoPeca;});
  var robos=DB.robos.filter(function(r){return r.status==='reparo'&&diasDesde(r.dataEntrada)>35&&!r.aguardandoPeca&&!r.servicoPronto;}).sort(function(a,b){return a.dataEntrada<b.dataEntrada?-1:1;});
  if(!robos.length&&!agPeca.length){el.innerHTML='<div class="empty-state"><div class="empty-icon">✅</div><p>Nenhum alerta ativo.</p></div>';return;}
  var agPecaHtml=agPeca.length?'<div class="section-title" style="color:#c77dff;">📦 '+agPeca.length+' aguardando peça</div>'+
    agPeca.map(function(r){
      var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
      var num='#'+String(r.numVisual).padStart(3,'0');
      var ap=r.aguardandoPeca;
      var dprev=ap&&ap.dataPrevista?fmtData(ap.dataPrevista):'';
      var diasAg=ap&&ap.dataPrevista?Math.ceil((new Date(ap.dataPrevista+'T00:00:00')-new Date())/(1000*60*60*24)):0;
      var atrasouPeca=diasAg<0;
      return'<div class="card" style="border-color:'+(atrasouPeca?'#ff4444':'#c77dff')+';">'+
        '<div class="cliente-label">'+(c?esc(c.nome.toUpperCase()):'?')+'</div>'+
        '<div style="display:flex;justify-content:space-between;align-items:center;">'+
          '<div><div class="robot-num" style="color:#c77dff;">'+num+'</div>'+
          '<div class="robot-model">'+esc(descricaoEquipamento(r)||'—')+'</div>'+
          '<div style="font-size:11px;color:'+(atrasouPeca?'#ff4444':'#c77dff')+';">'+
          (atrasouPeca?'⚠️ Peça atrasada!':'📅 Prev: '+dprev)+'</div></div>'+
          '<div style="text-align:right;"><div style="font-size:28px;font-weight:700;color:'+(atrasouPeca?'#ff4444':'#c77dff')+';">'+Math.abs(diasAg)+'</div>'+
          '<div style="font-size:11px;color:var(--text2);">'+(atrasouPeca?'dias atraso':'dias</div>')+'</div></div>'+
        '<div class="robot-actions">'+
          '<button class="btn btn-cyan" onclick="openFichaRobo(\''+r.id+'\')" >📋 Ficha</button>'+
          '<button class="btn" onclick="cancelarAguardandoPeca(\''+r.id+'\')" style="background:rgba(255,68,68,.15);border:1px solid rgba(255,68,68,.4);color:#ff6b6b;">❌ Cancelar</button>'+
        '</div></div>';
    }).join(''):'';
  el.innerHTML=(robos.length?'<div class="section-title">⚠️ '+robos.length+' alerta(s)</div>':'')+
    robos.map(function(r){
      var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
      var num='#'+String(r.numVisual).padStart(3,'0');
      var dias=diasDesde(r.dataEntrada);
      return'<div class="card" style="border-color:#ff6d00;">'+
        '<div class="cliente-label">'+(c?esc(c.nome.toUpperCase()):'?')+'</div>'+
        '<div style="display:flex;justify-content:space-between;align-items:center;">'+
          '<div><div class="robot-num" style="color:#ff6d00;">'+num+'</div><div class="robot-model">'+esc(descricaoEquipamento(r)||'—')+'</div></div>'+
          '<div style="text-align:right;"><div class="days-big" style="color:#ff6d00;">'+dias+'</div><div class="days-label">dias</div></div>'+
        '</div>'+
        '<div class="robot-actions">'+
          '<button class="btn btn-cyan" onclick="openFichaRobo(\''+r.id+'\')">📋 Ficha</button>'+
          '<button class="btn btn-wa" onclick="enviarAtrasoDirecto(\''+r.id+'\')">⚠️ Atraso</button>'+'<button class="btn" onclick="abrirAguardandoPeca(\''+r.id+'\')" style="background:rgba(138,43,226,.2);border:1px solid rgba(138,43,226,.4);color:#c77dff;padding:8px 10px;font-size:12px;">📦 Ag. Peça</button>'+
        '</div></div>';
    }).join('')+agPecaHtml;
}
