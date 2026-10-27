function zebraPararLoteTimer(){
  if(zebraBatchTimer){clearTimeout(zebraBatchTimer);zebraBatchTimer=null;}
}

function zebraLerLote(){
  var b=zebraStorageRead(ZEBRA_BATCH_KEY);
  if(b&&(![1,2].includes(b.v)||!Array.isArray(b.items)||!b.items.length||!b.uid||!Number.isInteger(b.index)||b.index<0||b.index>b.items.length||!Array.isArray(b.completed)))throw new Error('Lote local inválido. Preserve o histórico.');
  return b;
}

function zebraSalvarLote(b){
  zebraStorageWrite(ZEBRA_BATCH_KEY,b);
  if(document.getElementById('etiqueta-ui'))renderEtiqueta();
}

function zebraLimparLote(){
  zebraPararLoteTimer();
  var b=zebraLerLote();
  if(b){
    // Keep the last 20 summaries, UUIDs and outcomes, without client snapshots.
    var key='moledo_zebra_history_v2',history=zebraStorageRead(key)||[];
    var copy=JSON.parse(JSON.stringify(b));delete copy.snapshots;
    copy.closedAt=Date.now();history.push(copy);
    zebraStorageWrite(key,history.slice(-20));
  }
  localStorage.removeItem(ZEBRA_BATCH_KEY);
}

function zebraAgendarProximoLote(ms){
  zebraPararLoteTimer();
  zebraBatchTimer=setTimeout(function(){zebraExecutarProximoLote();},ms||1800);
}

async function imprimirSelecionadas(){
  if(zebraActionLocked||zebraLerPendente()||zebraLerLote()){showToast('Já existe impressão/lote em andamento.');return;}
  if(Date.now()<zebraCooldownUntil)return;
  if(!etqSel.length)return;
  zebraActionLocked=true;
  try{
    var ctx=await window._getPrintAuthContext(false),items=[],snapshots=Object.create(null);
    Array.from(new Set(etqSel)).forEach(function(id){
      var r=DB.robos.find(function(x){return x.id===id;});
      var c=r&&DB.clientes.find(function(x){return x.id===r.clienteId;});
      if(!r||(r.status!=='reparo'&&r.status!=='garantia'))throw new Error('Equipamento indisponível.');
      var valid=zebraMontarPayload(r,c);
      snapshots[id]={r:Object.assign({},valid.robo,{nomeClienteFinal:r.nomeClienteFinal||''}),c:Object.assign({},valid.cliente,{tipo:c.tipo||'cf'})};
      var q=Math.max(1,Math.min(20,Math.floor(Number(etqCopias[id]))||1));
      for(var k=0;k<q;k++)items.push({roboId:id,numVisual:r.numVisual,copy:k+1,copies:q,jobId:crypto.randomUUID().toLowerCase(),state:'not_sent'});
    });
    if(items.length>100)throw new Error('Máximo de 100 etiquetas por lote.');
    zebraCheckUid(ctx.uid);
    zebraSalvarLote({v:2,uid:ctx.uid,items:items,snapshots:snapshots,index:0,completed:[],state:'running',createdAt:Date.now()});
    zebraAgendarProximoLote(50);
  }finally{zebraActionLocked=false;renderEtiqueta();}
}

async function zebraExecutarProximoLote(){
  var b=zebraLerLote();
  if(!b||b.state!=='running'||zebraActionLocked||zebraLerPendente())return;
  zebraCheckUid(b.uid);
  if(b.v!==2){zebraPausarLote('Lote antigo: encerre e confira o histórico antes de criar outro.');return;}
  if(b.index>=b.items.length){b.state='awaiting_confirmation';zebraSalvarLote(b);return;}
  if(Date.now()<zebraCooldownUntil){zebraAgendarProximoLote(zebraCooldownUntil-Date.now()+150);return;}
  var item=b.items[b.index],snapshot=b.snapshots[item.roboId];
  // Durable attempted marker is never cleared or used for another POST.
  if(item.state!=='not_sent'||item.attemptedAt){zebraPausarLote('Item já tentado. Consulte o UUID; não reenvie.');return;}
  zebraActionLocked=true;
  var creationResponseReceived=false;
  try{
    var payload=await zebraMontarPayloadBitmap(snapshot.r,snapshot.c);
    payload.job_id=item.jobId;
    var ctx=await window._getPrintAuthContext(false);zebraCheckUid(b.uid);
    if(ctx.uid!==b.uid)throw new Error('USUARIO_ALTERADO');
    // Save pending FIRST. A crash at any following point blocks new POSTs.
    zebraSalvarPendente({v:1,uid:b.uid,printerId:ZEBRA_PRINTER_ID,jobId:item.jobId,roboId:item.roboId,numVisual:item.numVisual,createdAt:Date.now(),state:'creating',batch:true,batchIndex:b.index,batchTotal:b.items.length});
    item.state='creating';item.attemptedAt=Date.now();zebraSalvarLote(b);
    var data=await zebraPrintApi('/print-bitmap','POST',payload,ctx,false);
    creationResponseReceived=true;zebraRegistrarEstadoImpressora('online','job_accepted');
    zebraProcessarStatus(data);
  }catch(e){
    var pending=zebraLerPendente();
    if(e&&e.data&&e.data.error==='printer_offline')zebraRegistrarEstadoImpressora('offline','printer_offline');
    else if(e&&e.data&&e.data.error==='printer_busy')zebraRegistrarEstadoImpressora('online','printer_busy');
    if(pending&&!creationResponseReceived&&zebraErroCriacaoDefinitivo(e)){
      zebraEncerrarCriacaoRejeitada(pending,zebraDiagnosticoPost(e));
      showToast('Criação rejeitada: HTTP '+e.status+' / '+e.data.error+'. Nenhum reenvio.',9000);
      return;
    }
    zebraPausarLote(zebraErroMensagem(e));
    if(pending)zebraAtualizarPendente({state:'reconcile',creationError:pending.creationError||zebraDiagnosticoPost(e),localIssue:zebraErroMensagem(e)});
    zebraPararPolling();
    if(pending&&pending.uid===window._getPrintCurrentUid())zebraAgendarPolling(2000);
    showToast('Lote parado. Consulte o mesmo UUID. Nenhum reenvio foi feito.',9000);
  }finally{zebraActionLocked=false;renderEtiqueta();}
}

function zebraAbrirConfirmacaoLote(){
  var b=zebraLerLote();if(!b||b.state!=='awaiting_confirmation')return;
  var qtd=(b.completed||[]).length;
  openModal('<div class="modal-title">✅ Confirmar lote Zebra</div>'+ 
    '<div style="font-size:13px;color:var(--text2);line-height:1.6;">O sistema enviou <b>'+qtd+' etiqueta(s)</b> à Zebra.<br><br>Confirma fisicamente que saíram exatamente <b>'+qtd+' etiqueta(s) completas e corretas</b>?<br><br><b>Só esta confirmação marca os equipamentos como impressos.</b></div>'+ 
    '<div class="modal-actions"><button class="btn btn-del" onclick="zebraFinalizarLote(false)">⚠️ Houve problema</button><button class="btn btn-green" onclick="zebraFinalizarLote(true)">✅ Sim, saíram todas</button></div>');
}

function zebraFinalizarLote(saiu){
  var b=zebraLerLote();if(!b||b.state!=='awaiting_confirmation')return;
  zebraCheckUid(b.uid);
  if(saiu){
    b.completed.forEach(function(x){zebraMarcarImpressa(x.roboId);});
    b.physicalConfirmed=true;
  }else b.physicalConfirmed=false;
  zebraSalvarLote(b);zebraLimparLote();etqSel=[];closeModal();renderEtiqueta();
}

function zebraCancelarLote(){
  if(zebraLerPendente())throw new Error('Resolva/consulte primeiro o UUID pendente.');
  var b=zebraLerLote();if(!b)return;zebraCheckUid(b.uid);
  zebraLimparLote();renderEtiqueta();
}

function zebraContinuarLote(){
  var b=zebraLerLote();if(!b||zebraLerPendente())return;
  zebraCheckUid(b.uid);
  if(b.v!==2)throw new Error('Encerre o lote da versão anterior.');
  if(b.index>=b.items.length){b.state='awaiting_confirmation';zebraSalvarLote(b);zebraAbrirConfirmacaoLote();return;}
  if(b.items[b.index].state!=='not_sent')throw new Error('Item já tentado: não pode ser reenviado.');
  b.state='running';delete b.lastError;zebraSalvarLote(b);zebraAgendarProximoLote(500);
}

function zebraPausarLote(message){
  zebraPararLoteTimer();
  var b=zebraLerLote();
  if(b){b.state='paused_error';b.lastError=message;zebraSalvarLote(b);}
}
