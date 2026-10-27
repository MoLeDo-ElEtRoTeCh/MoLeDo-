function zebraNormalizarBusca(v){
  try{return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
  catch(e){return String(v==null?'':v).toLowerCase().trim();}
}

function zebraVendedorCliente(r,c){
  return !!(r&&c&&c.tipo==='vc'&&String(r.nomeClienteFinal||'').trim());
}

function zebraPrimeiroNome(nome){
  var n=String(nome||'').trim().split(/\s+/)[0]||'';
  return n.length>12?n.slice(0,11)+'…':n;
}

function zebraNomeLista(r,c){
  if(zebraVendedorCliente(r,c))return String(r.nomeClienteFinal||'').trim();
  return String(c&&c.nome||'Cliente não localizado').trim();
}

function zebraSubnomeLista(r,c){
  if(zebraVendedorCliente(r,c))return 'via '+String(c.nome||'Vendedor').trim();
  if(c&&c.tipo==='vd')return 'Vendedor';
  return '';
}

function setEtqBusca(v){
  etqBusca=String(v||'');
  filtrarEtiquetasDOM();
}

function limparEtqBusca(){
  etqBusca='';
  var inp=document.getElementById('etq-busca');
  if(inp){inp.value='';inp.focus();}
  filtrarEtiquetasDOM();
}

function filtrarEtiquetasDOM(){
  var q=zebraNormalizarBusca(etqBusca),vis=0;
  document.querySelectorAll('#etq-lista-wrap .etq-robo-row[data-etq-search]').forEach(function(row){
    var ok=!q||String(row.getAttribute('data-etq-search')||'').indexOf(q)!==-1;
    row.style.display=ok?'':'none';
    if(ok)vis++;
  });
  var c=document.getElementById('etq-busca-contagem');
  if(c)c.textContent=q?' · '+vis+' resultado(s)':'';
  var vazio=document.getElementById('etq-busca-vazio');
  if(vazio)vazio.style.display=(q&&vis===0)?'block':'none';
  var limpar=document.getElementById('etq-busca-limpar');
  if(limpar)limpar.style.display=q?'':'none';
}

function zebraQtdSelecionada(){
  var total=0;
  etqSel.forEach(function(id){total+=Math.max(1,Math.min(20,Number(etqCopias[id]||1)));});
  return total;
}

function zebraRobosEtiquetaBase(){
  return DB.robos.filter(function(r){return r.status==='reparo'||r.status==='garantia';}).sort(function(a,b){
    var ca=DB.clientes.find(function(x){return x.id===a.clienteId;});
    var cb=DB.clientes.find(function(x){return x.id===b.clienteId;});
    return zebraNomeLista(a,ca).localeCompare(zebraNomeLista(b,cb),'pt-BR',{sensitivity:'base'})||Number(a.numVisual||0)-Number(b.numVisual||0);
  });
}

function zebraRobosAbaAtual(aplicarBusca){
  var base=zebraRobosEtiquetaBase();
  var impressas=DB.etqImpressas||[];
  var lista;
  if(etqAba==='confirmadas')lista=base.filter(function(r){return impressas.indexOf(r.id)!==-1&&!zebraErroAtivoPorRobo(r.id);});
  else if(etqAba==='erros')lista=base.filter(function(r){return zebraErroAtivoPorRobo(r.id);});
  else lista=base.filter(function(r){return impressas.indexOf(r.id)===-1&&!zebraErroAtivoPorRobo(r.id);});
  if(aplicarBusca===false)return lista;
  var q=zebraNormalizarBusca(etqBusca);
  if(!q)return lista;
  return lista.filter(function(r){
    var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
    var hay=[c&&c.nome,r.nomeClienteFinal,descricaoEquipamento(r),r.sn,r.numVisual,'#'+String(r.numVisual||0).padStart(3,'0')].map(zebraNormalizarBusca).join(' ');
    return hay.indexOf(q)!==-1;
  });
}

function setEtqAba(aba){
  etqAba=aba;renderEtiqueta();
}

function zebraRenderEstadoImpressora(){
  var st=null;try{st=zebraStorageRead(ZEBRA_PRINTER_STATE_KEY);}catch(e){}
  if(!st)return '<span style="color:var(--text3);">● status ainda não verificado</span>';
  var online=st.estado==='online';
  var idade=Math.max(0,Math.round((Date.now()-Number(st.at||0))/60000));
  return '<span style="color:'+(online?'var(--green)':'var(--red)')+';font-weight:800;">● '+(online?'último estado: conectado':'último estado: não reconhecido')+'</span>'+
    '<span style="color:var(--text3);font-size:10px;margin-left:6px;">'+(idade<1?'agora':idade+' min')+'</span>';
}

function zebraRenderErrosSemRobo(){
  var list=zebraCreationErrorsAtivos().filter(function(x){return !x.roboId||!DB.robos.some(function(r){return r.id===x.roboId;});});
  if(!list.length)return '';
  return '<div class="section-title" style="color:var(--orange);">⚠️ Outros erros registrados</div>'+list.map(function(entry){
    var d=entry.creationError||{},shortId=String(entry.jobId||'').slice(-8);
    return '<div style="position:relative;padding:12px 42px 12px 12px;border:1px solid var(--orange);border-radius:9px;margin-bottom:7px;background:rgba(255,109,0,.05);">'+
      '<button title="Encerrar aviso" data-job="'+esc(entry.jobId)+'" onclick="zebraAbrirFecharErro(this.dataset.job)" style="position:absolute;right:8px;top:8px;width:28px;height:28px;border-radius:7px;border:1px solid rgba(255,255,255,.15);background:var(--bg3);color:var(--text2);font-size:16px;cursor:pointer;">✕</button>'+ 
      '<div style="font-weight:900;color:var(--orange);">Criação rejeitada · HTTP '+esc(String(d.http==null?'—':d.http))+'</div>'+ 
      '<div style="font-size:11px;color:var(--text2);margin-top:3px;">'+esc(String(d.error||'erro'))+'</div>'+ 
      '<div style="font-size:10px;color:var(--text3);margin-top:4px;">Job …'+esc(shortId)+'</div>'+ 
    '</div>';
  }).join('');
}

function solicitarImpressaoSelecionadas(){
  var qtd=zebraQtdSelecionada();if(!qtd)return;
  if(qtd===1){imprimirSelecionadas();return;}
  openModal('<div class="modal-title">🖨️ Confirmar impressão</div>'+ 
    '<div style="font-size:14px;color:var(--text2);line-height:1.6;">Você quer imprimir <b style="color:var(--cyan);font-size:18px;">'+qtd+' etiquetas</b>?<br><br>Confira a seleção antes de continuar.</div>'+ 
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Voltar e conferir</button><button class="btn btn-primary" onclick="closeModal();imprimirSelecionadas()">🖨️ Sim, imprimir '+qtd+'</button></div>');
}

function zebraRenderStatusCard(p){
  if(!p)return '';
  var info=zebraEstadoInfo(p);
  var shortId=String(p.jobId||'').slice(-8);
  var robo=DB.robos.find(function(x){return x.id===p.roboId;});
  var num=robo&&Number.isFinite(robo.numVisual)?'#'+String(robo.numVisual).padStart(3,'0'):(p.numVisual!=null?'#'+String(p.numVisual).padStart(3,'0'):'');
  var issue=p.localIssue?'<div style="font-size:11px;color:var(--orange);margin-top:7px;">⚠️ '+esc(p.localIssue)+'</div>':'';
  var actions='';
  if(['creating','queued','claimed','sending','reconcile'].indexOf(p.state)!==-1){
    actions='<button class="btn btn-cyan" style="margin-top:9px;" onclick="zebraConsultarPendente(true)">🔄 Atualizar agora</button>';
  }else if(p.state==='usb_sent'&&!p.batch){
    actions='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;">'+
      '<button class="btn btn-green" onclick="zebraAbrirConfirmacaoUsb(true)">✅ Saiu correta</button>'+ 
      '<button class="btn btn-del" onclick="zebraAbrirConfirmacaoUsb(false)">⚠️ Não saiu correta</button>'+ 
      '</div>';
  }else if(p.state==='failed'){
    actions='<button class="btn btn-close" style="margin-top:9px;" onclick="zebraEncerrarFalha()">Entendi · tratar falha</button>';
  }else if(p.state==='uncertain'){
    actions='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;">'+
      '<button class="btn btn-green" onclick="zebraAbrirResolucaoUncertain(\'printed\')">✅ Conferi: saiu completa</button>'+ 
      '<button class="btn btn-del" onclick="zebraAbrirResolucaoUncertain(\'not_printed\')">❌ Conferi: não saiu / parcial</button>'+ 
      '</div>';
  }
  var batchTxt=p.batch?' · lote '+(Number(p.batchIndex||0)+1)+'/'+Number(p.batchTotal||0):'';
  return '<div style="padding:12px;margin-bottom:10px;border:1px solid '+info[1]+';background:rgba(255,255,255,.035);border-radius:10px;">'+
    '<div style="font-size:13px;font-weight:900;color:'+info[1]+';">'+esc(info[0])+(num?' · '+num:'')+'</div>'+ 
    '<div style="font-size:11px;color:var(--text2);margin-top:4px;">'+esc(info[2])+'</div>'+ 
    '<div style="font-size:10px;color:var(--text3);margin-top:5px;">Job …'+esc(shortId)+batchTxt+(p.usb_bytes!=null?' · USB '+Number(p.usb_bytes||0)+' bytes':'')+'</div>'+ 
    issue+actions+'</div>';
}

function zebraRenderLoteCard(b){
  if(!b)return '';
  var pending=zebraLerPendente(),total=b.items.length,sent=b.completed.length;
  var unsent=b.items.filter(function(x){return x.state==='not_sent';}).length;
  var title=b.state==='running'?'Enviando '+Math.min(b.index+1,total)+'/'+total:'Lote pausado · item '+Math.min(b.index+1,total)+'/'+total;
  if(b.state==='awaiting_confirmation')title='Envios encerrados · '+sent+'/'+total+' enviados à Zebra';
  var actions='';
  if(!pending&&b.state==='awaiting_confirmation')actions='<button class="btn btn-green" onclick="zebraAbrirConfirmacaoLote()">Conferir etiquetas físicas</button>';
  else if(!pending&&b.state!=='running')actions='<button class="btn btn-cyan" onclick="zebraContinuarLote()">Continuar somente os não enviados</button><button class="btn btn-close" onclick="zebraCancelarLote()">Encerrar lote</button>';
  return '<div style="padding:12px;margin-bottom:10px;border:1px solid var(--cyan);border-radius:10px;"><b>'+esc(title)+'</b><p>'+sent+' dados enviados à Zebra · '+unsent+' não enviados · '+total+' solicitados.</p><p>'+esc(b.lastError||'Uma cópia por UUID. Sem retry de impressão. Confira o papel antes de confirmar.')+'</p>'+actions+'</div>';
}

function renderEtiqueta(){
  var el=document.getElementById('etiqueta-ui');
  var subAbas='<div style="display:flex;gap:0;margin-bottom:12px;border-radius:10px;overflow:hidden;border:1px solid var(--border);">'+
    '<button onclick="_etqSecao=\'robo\';renderEtiqueta()" style="flex:1;padding:10px;border:none;font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:13px;cursor:pointer;'+(_etqSecao==='robo'?'background:rgba(0,229,255,.15);color:var(--cyan);border-bottom:2px solid var(--cyan);':'background:var(--bg2);color:var(--text3);')+'">🏷️ Zebra 60×40</button>'+ 
    '<button onclick="_etqSecao=\'envio\';renderEtiqueta()" style="flex:1;padding:10px;border:none;font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:13px;cursor:pointer;'+(_etqSecao==='envio'?'background:rgba(199,125,255,.15);color:#c77dff;border-bottom:2px solid #c77dff;':'background:var(--bg2);color:var(--text3);')+'">📦 Etiqueta de Envio</button>'+ 
  '</div>';
  if(_etqSecao==='envio'){el.innerHTML=subAbas+'<div id="etq-ui-wrap">'+renderEtiquetaEnvioUI()+'</div>';return;}

  var pending=zebraLerPendente(),lote=zebraLerLote();
  var base=zebraRobosEtiquetaBase(),impressas=DB.etqImpressas||[],erros=zebraCreationErrorsAtivos();
  var idsErro=Object.create(null);erros.forEach(function(x){if(x.roboId)idsErro[x.roboId]=true;});
  var qtdNao=base.filter(function(r){return impressas.indexOf(r.id)===-1&&!idsErro[r.id];}).length;
  var qtdConf=base.filter(function(r){return impressas.indexOf(r.id)!==-1&&!idsErro[r.id];}).length;
  var qtdErr=erros.length;
  var robos=zebraRobosAbaAtual(false);
  var totalSel=zebraQtdSelecionada();
  var locked=!!pending||!!lote||zebraActionLocked||Date.now()<zebraCooldownUntil;
  var html=subAbas+
    '<div style="padding:10px 12px;margin-bottom:10px;border:1px solid rgba(0,229,255,.25);background:rgba(0,229,255,.05);border-radius:10px;">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">'+
        '<div style="font-size:13px;font-weight:800;color:var(--cyan);">Zebra ZD220 · BITMAP 480 × 320 · Pico</div>'+ 
        '<div style="font-size:11px;">'+zebraRenderEstadoImpressora()+'</div>'+ 
      '</div>'+ 
      '<div style="font-size:11px;color:var(--text3);margin-top:3px;">Uma etiqueta por job, sequencialmente, sem retry automático.</div>'+ 
    '</div>'+zebraRenderLoteCard(lote)+zebraRenderStatusCard(pending)+
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;">'+
      '<button onclick="setEtqAba(\'nao\')" class="btn '+(etqAba==='nao'?'btn-cyan':'btn-close')+'" style="justify-content:center;padding:9px 5px;font-size:11px;">⏳ Não impressas <b>'+qtdNao+'</b></button>'+ 
      '<button onclick="setEtqAba(\'confirmadas\')" class="btn '+(etqAba==='confirmadas'?'btn-green':'btn-close')+'" style="justify-content:center;padding:9px 5px;font-size:11px;">✅ Confirmadas <b>'+qtdConf+'</b></button>'+ 
      '<button onclick="setEtqAba(\'erros\')" class="btn '+(etqAba==='erros'?'btn-yellow':'btn-close')+'" style="justify-content:center;padding:9px 5px;font-size:11px;">⚠️ Erros <b>'+qtdErr+'</b></button>'+ 
    '</div>';

  html+='<div style="display:flex;gap:7px;align-items:center;margin-bottom:10px;">'+
    '<div style="position:relative;flex:1;">'+
      '<span style="position:absolute;left:10px;top:9px;color:var(--text3);">🔎</span>'+
      '<input id="etq-busca" class="form-input" type="search" placeholder="Pesquisar cliente, vendedor, modelo, SN ou nº..." value="'+esc(etqBusca)+'" oninput="setEtqBusca(this.value)" style="padding-left:34px;">'+
    '</div>'+
    '<button id="etq-busca-limpar" class="btn btn-close" onclick="limparEtqBusca()" style="'+(etqBusca?'':'display:none;')+'">✕</button>'+
  '</div>'+
  '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin:-2px 0 10px;font-size:11px;color:var(--text3);">'+
    '<span>Ordem alfabética<span id="etq-busca-contagem"></span></span>'+
    '<span style="color:'+(etqSel.length?'var(--cyan)':'var(--text3)')+';font-weight:800;">'+etqSel.length+' equipamento(s) selecionado(s)</span>'+
  '</div>';

  if(robos.length){
    html+='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;">'+
      '<button class="btn btn-primary" '+(locked||!totalSel?'disabled':'')+' style="flex:1;min-width:170px;justify-content:center;'+(locked||!totalSel?'opacity:.45;cursor:not-allowed;':'')+'" onclick="solicitarImpressaoSelecionadas()">🖨️ Imprimir '+totalSel+' etiqueta(s)</button>'+ 
      '<button class="btn btn-cyan" '+(locked?'disabled':'')+' onclick="selecionarTodasEtq()">☑️ Selecionar todas</button>'+ 
      '<button class="btn btn-close" '+(locked?'disabled':'')+' onclick="etqSel=[];renderEtiqueta()">Limpar</button>'+ 
    '</div>';

    html+='<div id="etq-lista-wrap">';
    html+=robos.map(function(r){
      var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
      var sel=etqSel.indexOf(r.id)!==-1,impressa=impressas.indexOf(r.id)!==-1;
      var erroEntry=erros.slice().reverse().find(function(x){return x.roboId===r.id;});
      var nome=zebraNomeLista(r,c),subnome=zebraSubnomeLista(r,c),copias=Math.max(1,Math.min(20,Number(etqCopias[r.id]||1)));
      var statusTxt=erroEntry?' · <span style="color:var(--orange);font-weight:800;">⚠️ erro registrado</span>':(impressa?' · <span style="color:var(--green);font-weight:800;">✅ impressão confirmada</span>':'');
      var fecharErro=erroEntry?'<button title="Encerrar aviso" class="btn btn-del" style="padding:6px 8px;font-size:11px;" onclick="event.stopPropagation();zebraAbrirFecharErro(\''+erroEntry.jobId+'\')">✕</button>':'';
      var busca=zebraNormalizarBusca([c&&c.nome,r.nomeClienteFinal,descricaoEquipamento(r),r.sn,r.numVisual,'#'+String(r.numVisual||0).padStart(3,'0')].join(' '));
      return '<div class="etq-robo-row'+(sel?' sel':'')+(impressa?' impressa':'')+'" data-etq-search="'+esc(busca)+'" onclick="toggleEtqRobo(\''+r.id+'\')">'+
        '<input type="checkbox" '+(sel?'checked':'')+' '+(locked?'disabled':'')+' onclick="event.stopPropagation();toggleEtqRobo(\''+r.id+'\')">'+
        '<div class="etq-robo-info"><div class="etq-robo-num">'+esc(nome)+' <span style="color:var(--cyan);">#'+String(r.numVisual||0).padStart(3,'0')+'</span></div>'+ 
        (subnome?'<div style="font-size:11px;color:#00c896;font-weight:800;">'+esc(subnome)+'</div>':'')+
        '<div class="etq-robo-det">'+esc(descricaoEquipamento(r)||'Sem modelo')+(r.sn?' · SN '+esc(r.sn):'')+statusTxt+'</div></div>'+ 
        '<div onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:4px;">'+
          '<button '+(locked?'disabled':'')+' onclick="setEtqCopias(\''+r.id+'\','+(copias-1)+')" style="width:27px;height:27px;border-radius:6px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-weight:900;">−</button>'+ 
          '<span style="min-width:20px;text-align:center;font-weight:900;color:var(--cyan);">'+copias+'</span>'+ 
          '<button '+(locked?'disabled':'')+' onclick="setEtqCopias(\''+r.id+'\','+(copias+1)+')" style="width:27px;height:27px;border-radius:6px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-weight:900;">+</button>'+ 
        '</div>'+ 
        '<button class="btn btn-close" style="padding:6px 8px;font-size:11px;" onclick="event.stopPropagation();zebraAbrirPrevia(\''+r.id+'\')">👁️</button>'+ 
        '<button class="btn btn-cyan" '+(locked?'disabled':'')+' style="padding:6px 8px;font-size:11px;'+(locked?'opacity:.4;':'')+'" onclick="event.stopPropagation();imprimirUma(\''+r.id+'\')">'+(impressa?'🔁':'🖨️')+'</button>'+ 
        fecharErro+
      '</div>';
    }).join('');
    html+='</div><div id="etq-busca-vazio" class="empty-state" style="display:none;"><div class="empty-icon">🔎</div><p>Nenhum resultado para esta pesquisa.</p></div>';
  }else{
    var vazio=etqAba==='confirmadas'?'Nenhuma impressão confirmada.':etqAba==='erros'?'Nenhum equipamento com erro ativo.':'Nenhuma etiqueta pendente de impressão.';
    html+='<div class="empty-state"><div class="empty-icon">🏷️</div><p>'+vazio+'</p></div>';
  }
  if(etqAba==='erros')html+=zebraRenderErrosSemRobo();
  el.innerHTML=html;
  filtrarEtiquetasDOM();
}

function selecionarTodasEtq(){
  if(zebraLerPendente()||zebraLerLote()){showToast('⚠️ Há uma impressão/lote em andamento.');return;}
  zebraRobosAbaAtual().forEach(function(r){if(etqSel.indexOf(r.id)===-1)etqSel.push(r.id);});renderEtiqueta();
}

function toggleEtqRobo(roboId){
  if(zebraLerPendente()||zebraLerLote()){showToast('⚠️ Há uma impressão/lote em andamento.');return;}
  var i=etqSel.indexOf(roboId);if(i===-1)etqSel.push(roboId);else etqSel.splice(i,1);renderEtiqueta();
}

function setEtqCopias(roboId,n){
  if(zebraLerPendente()||zebraLerLote())return;
  etqCopias[roboId]=Math.max(1,Math.min(20,Math.floor(Number(n))||1));renderEtiqueta();
}

function imprimirUma(roboId){
  if(zebraLerPendente()||zebraLerLote()||zebraActionLocked){showToast('⚠️ Aguarde a impressão atual.');return;}
  etqSel=[roboId];renderEtiqueta();solicitarImpressaoSelecionadas();
}

function zebraRenderErroCriacao(){
  var history=zebraStorageRead('moledo_zebra_creation_errors_v1')||[];
  var uid=typeof window._getPrintCurrentUid==='function'?window._getPrintCurrentUid():null;
  var entry=history.slice().reverse().find(function(x){return x.uid===uid;});
  if(!entry)return '';
  var d=entry.creationError;
  return '<div style="padding:12px;border:1px solid var(--orange);margin-bottom:10px;"><b>Última criação rejeitada — sem reenvio</b><p>HTTP '+esc(String(d.http))+' · '+esc(d.error)+'</p><small>UUID: '+esc(entry.jobId)+'</small><p>A tentativa foi encerrada. Uma nova impressão exige sua ação e um novo UUID.</p></div>';
}

function fecharEtiqueta(){
  document.getElementById('etq-overlay').classList.remove('open');
  renderEtiqueta();
}
