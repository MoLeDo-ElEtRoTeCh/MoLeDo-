function abrirLembrete(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var num='#'+String(r.numVisual).padStart(3,'0');
  var hoje=new Date();
  var defaultDt=new Date(hoje.getTime()+8*60*60*1000);
  var dtStr=defaultDt.toISOString().slice(0,16);
  var tiposBtns=LEMBRETE_TIPOS.map(function(t){
    return'<button type="button" onclick="selLembreteTipo(\''+t.id+'\')" id="lt-'+t.id+'" class="defect-btn" style="font-size:12px;padding:7px 10px;">'+t.label+'</button>';
  }).join('');
  openModal(
    '<div class="modal-title">🔔 Novo Lembrete</div>'+
    '<div style="font-size:13px;color:var(--cyan);font-weight:700;margin-bottom:10px;">'+num+' · '+(c?esc(c.nome):'—')+'</div>'+
    '<div class="form-group"><label class="form-label">Tipo</label>'+
    '<div class="defect-grid" style="gap:6px;">'+tiposBtns+'</div></div>'+
    '<div class="form-group" id="lt-outro-row" style="display:none;"><label class="form-label">Descrição</label>'+
    '<input id="lt-outro-txt" class="form-input" type="text" placeholder="Ex: Verificar se cliente buscou..."></div>'+
    '<div class="form-group"><label class="form-label">📅 Data e hora</label>'+
    '<input id="lt-dt" class="form-input" type="datetime-local" value="'+dtStr+'"></div>'+
    '<div class="modal-actions">'+
    '<button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-primary" onclick="salvarLembrete(\''+roboId+'\')">🔔 Salvar Lembrete</button>'+
    '</div>'
  );
  window._lembreTipoSel=null;
}

function selLembreteTipo(id){
  window._lembreTipoSel=id;
  LEMBRETE_TIPOS.forEach(function(t){
    var b=document.getElementById('lt-'+t.id);
    if(b)b.style.background=t.id===id?'rgba(255,214,0,.25)':'';
  });
  var outroRow=document.getElementById('lt-outro-row');
  if(outroRow)outroRow.style.display=id==='outro'?'block':'none';
}

function salvarLembrete(roboId){
  if(!window._lembreTipoSel){showToast('⚠️ Selecione o tipo!');return;}
  var dtEl=document.getElementById('lt-dt');
  if(!dtEl||!dtEl.value){showToast('⚠️ Defina a data!');return;}
  var tipo=window._lembreTipoSel;
  var label=LEMBRETE_TIPOS.find(function(t){return t.id===tipo;});
  var descOutro=tipo==='outro'?(document.getElementById('lt-outro-txt')?document.getElementById('lt-outro-txt').value.trim():''):'';
  var lembrete={
    id:genId(),
    roboId:roboId,
    tipo:tipo,
    label:label?label.label:'🔔 Lembrete',
    descOutro:descOutro,
    dt:dtEl.value,
    feito:false,
    criadoEm:todayISO()
  };
  if(!DB.lembretes)DB.lembretes=[];
  DB.lembretes.push(lembrete);
  saveDB();
  closeModal();
  showToast('🔔 Lembrete salvo!');
}

function abrirListaLembretes(){
  if(!DB.lembretes||!DB.lembretes.length){showToast('Nenhum lembrete cadastrado.');return;}
  var agora=new Date();
  var todos=DB.lembretes.slice().sort(function(a,b){return new Date(a.dt)-new Date(b.dt);});
  var html='<div class="modal-title">🔔 Lembretes</div>';
  var vencidos=todos.filter(function(l){return !l.feito&&new Date(l.dt)<=agora;});
  var futuros=todos.filter(function(l){return !l.feito&&new Date(l.dt)>agora;});
  var feitos=todos.filter(function(l){return l.feito;});
  function renderLembrete(l,cor){
    var r=DB.robos.find(function(x){return x.id===l.roboId;});
    var c=r?DB.clientes.find(function(x){return x.id===r.clienteId;}):null;
    var num=r?('#'+String(r.numVisual).padStart(3,'0')):'';
    var dtFmt=new Date(l.dt).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
    return'<div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid '+(cor||'var(--border)')+';border-radius:8px;padding:8px 10px;margin-bottom:6px;opacity:'+(l.feito?'0.5':'1')+';">'+
      '<div style="flex:1;">'+
        '<div style="font-size:12px;font-weight:700;color:#fff;">'+l.label+(l.descOutro?' — '+esc(l.descOutro):'')+'</div>'+
        '<div style="font-size:11px;color:#aaa;">'+num+(c?' · '+esc(c.nome):'')+'</div>'+
        '<div style="font-size:10px;color:'+(cor||'var(--text3)')+';">⏰ '+dtFmt+'</div>'+
      '</div>'+
      (!l.feito?
        '<div style="display:flex;gap:4px;">'+
          (r?'<button onclick="fecharLembreteBanner();closeModal();openFichaRobo(\''+r.id+'\')" style="background:var(--cyan);color:#000;border:none;border-radius:6px;padding:4px 7px;font-size:10px;font-weight:700;cursor:pointer;">📋</button>':'')+ 
          '<button onclick="marcarLembreteFeitoId(\''+l.id+'\');abrirListaLembretes()" style="background:rgba(0,230,118,.2);border:1px solid rgba(0,230,118,.4);color:#00e676;border-radius:6px;padding:4px 7px;font-size:10px;font-weight:700;cursor:pointer;">✅</button>'+
          '<button onclick="excluirLembrete(\''+l.id+'\')" style="background:rgba(255,23,68,.1);border:1px solid rgba(255,23,68,.3);color:#ff1744;border-radius:6px;padding:4px 7px;font-size:10px;cursor:pointer;">🗑️</button>'+
        '</div>':'')+'</div>';
  }
  if(vencidos.length){
    html+='<div style="font-size:11px;font-weight:700;color:#ffd600;letter-spacing:1px;margin:8px 0 6px;">⚠️ VENCIDOS ('+vencidos.length+')</div>';
    html+=vencidos.map(function(l){return renderLembrete(l,'rgba(255,214,0,.4)');}).join('');
  }
  if(futuros.length){
    html+='<div style="font-size:11px;font-weight:700;color:var(--cyan);letter-spacing:1px;margin:10px 0 6px;">📅 PRÓXIMOS ('+futuros.length+')</div>';
    html+=futuros.map(function(l){return renderLembrete(l,'rgba(0,229,255,.2)');}).join('');
  }
  if(feitos.length){
    html+='<div style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:1px;margin:10px 0 6px;">✅ CONCLUÍDOS ('+feitos.length+')</div>';
    html+=feitos.map(function(l){return renderLembrete(l,null);}).join('');
  }
  html+='<div class="modal-actions"><button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="closeModal()">Fechar</button></div>';
  openModal(html);
}

function excluirLembrete(id){
  DB.lembretes=DB.lembretes.filter(function(x){return x.id!==id;});
  saveDB();abrirListaLembretes();atualizarBadgeLembrete();
}

function atualizarBadgeLembrete(){
  var btn=document.getElementById('btn-lembrete');if(!btn)return;
  var agora=new Date();
  var pendentes=DB.lembretes?DB.lembretes.filter(function(l){return !l.feito&&new Date(l.dt)<=agora;}).length:0;
  var futuros=DB.lembretes?DB.lembretes.filter(function(l){return !l.feito&&new Date(l.dt)>agora;}).length:0;
  var total=pendentes+futuros;
  if(pendentes>0){
    btn.innerHTML='🔔 <span style="background:#ffd600;color:#000;border-radius:10px;padding:1px 5px;font-size:10px;font-weight:900;">'+pendentes+'</span>';
    btn.style.borderColor='rgba(255,214,0,.6)';
    btn.style.background='rgba(255,214,0,.15)';
  } else if(total>0){
    btn.innerHTML='🔔 <span style="background:var(--cyan);color:#000;border-radius:10px;padding:1px 5px;font-size:10px;font-weight:900;">'+total+'</span>';
    btn.style.borderColor='rgba(0,229,255,.3)';
    btn.style.background='rgba(0,229,255,.08)';
  } else {
    btn.innerHTML='🔔';
    btn.style.borderColor='rgba(255,214,0,.25)';
    btn.style.background='rgba(255,214,0,.08)';
  }
}

function marcarLembreteFeitoId(id){
  if(!DB.lembretes)return;
  var l=DB.lembretes.find(function(x){return x.id===id;});
  if(l){l.feito=true;l.feitoEm=Date.now();}
  saveDB();
  atualizarBadgeLembrete();
  updateAlertBanner();
  abrirListaLembretes();
}

function fecharLembreteBanner(){
  var b=document.getElementById('lembrete-banner');
  if(b)b.remove();
}
