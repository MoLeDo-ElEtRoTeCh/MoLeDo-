function zebraEstadoInfo(p){
  var state=p&&p.state?p.state:'';
  var map={
    creating:['Preparando trabalho','var(--cyan)','Gerando o pedido com um único UUID.'],
    queued:['Aguardando o Pico','var(--yellow)','O trabalho foi aceito e aguarda o Pico buscar a etiqueta.'],
    claimed:['Etiqueta recebida pelo Pico','var(--cyan)','O Pico reservou este trabalho.'],
    sending:['Enviando dados à Zebra','var(--cyan)','A transferência USB está em andamento.'],
    usb_sent:['Etiqueta enviada','var(--green)','Envio confirmado pelo computador. Não é necessário confirmar o papel.'],
    failed:['Trabalho não concluído','var(--red)','A tentativa terminou sem sucesso. Nenhuma nova impressão será automática.'],
    uncertain:['Resultado incerto','var(--orange)','Confira a Zebra antes de qualquer nova tentativa e faça a resolução manual.'],
    reconcile:['Confirmação pendente','var(--orange)','O envio não será repetido. O sistema consultará este mesmo UUID.']
  };
  return map[state]||['Estado não reconhecido','var(--red)','Nova impressão bloqueada até conferência.'];
}

function zebraRegistrarEstadoImpressora(estado,detalhe){
  try{zebraStorageWrite(ZEBRA_PRINTER_STATE_KEY,{estado:estado,detalhe:detalhe||'',at:Date.now()});}catch(e){}
}

function zebraProcessarStatus(data){
  var p=zebraLerPendente();if(!p)return;
  zebraCheckUid(p.uid);
  if(!data||data.job_id!==p.jobId||!['queued','claimed','sending','usb_sent','failed','uncertain'].includes(data.state))throw new Error('Resposta/UUID inválido.');
  p.state=data.state;p.usb_bytes=Number(data.usb_bytes)||0;p.message=data.message||data.state;delete p.localIssue;
  zebraSalvarPendente(p);
  var b=p.batch?zebraLerLote():null;
  if(b){
    var item=b.items[Number(p.batchIndex)];
    if(!item||(item.jobId&&item.jobId!==p.jobId))throw new Error('Item do lote não corresponde ao UUID.');
    item.state=data.state;
    if(data.state==='usb_sent'){
      if(!b.completed.some(function(x){return x.jobId===p.jobId;}))b.completed.push({roboId:p.roboId,jobId:p.jobId,numVisual:p.numVisual});
      b.index=Math.max(b.index,Number(p.batchIndex)+1);
      var running=b.state==='running';
      if(b.index>=b.items.length)b.state='completed';
      // Commit progress BEFORE releasing pending. Recovery is idempotent.
      zebraSalvarLote(b);
      zebraRegistrarEnvio(Object.assign({},p,{kind:b.kind||p.kind||'garantia'}));
      zebraLimparPendente();
      if(b.index>=b.items.length)zebraConcluirLoteAutomatico();
      else if(running){zebraCooldownUntil=Date.now()+1400;zebraAgendarProximoLote(1550);}
      renderEtiqueta();return;
    }
    if(['failed','uncertain'].includes(data.state)){b.state='paused_'+data.state;zebraPararLoteTimer();}
    zebraSalvarLote(b);
  }
  if(data.state==='usb_sent'){zebraRegistrarEnvio(p);zebraLimparPendente();renderEtiqueta();return;}
  if(['queued','claimed','sending'].includes(data.state))zebraAgendarPolling(1500);
  else zebraPararPolling();
  renderEtiqueta();
}

function zebraMarcarImpressa(roboId){
  if(!DB.etqImpressas)DB.etqImpressas=[];
  if(DB.etqImpressas.indexOf(roboId)===-1)DB.etqImpressas.push(roboId);
  try{
    var key='moledo_zebra_creation_errors_v1',history=zebraStorageRead(key)||[],uid=typeof window._getPrintCurrentUid==='function'?window._getPrintCurrentUid():null,mudou=false;
    history.forEach(function(x){if(x.uid===uid&&x.roboId===roboId&&!x.dismissedAt){x.dismissedAt=Date.now();x.resolved=true;x.resolution='printed_confirmed';mudou=true;}});
    if(mudou)zebraStorageWrite(key,history);
  }catch(e){}
  saveDB();
}

// usb_sent is transport evidence, never a claim of physical inspection.
function zebraEnviosRegistrados(){
  var uid=window._getPrintCurrentUid();
  return (zebraStorageRead('moledo_zebra_sent_v1')||[]).filter(function(x){return x.uid===uid;});
}

function zebraRegistrarEnvio(p){
  zebraCheckUid(p.uid);
  var key='moledo_zebra_sent_v1',history=zebraStorageRead(key)||[];
  var entry=history.find(function(x){return x.uid===p.uid&&x.jobId===p.jobId;});
  if(!entry){
    entry={uid:p.uid,jobId:p.jobId,roboId:p.roboId,numVisual:p.numVisual,kind:p.kind||'garantia',sentAt:Date.now(),evidence:'usb_sent',physicalConfirmed:false};
    history.push(entry);zebraStorageWrite(key,history);
  }
  if(entry.kind!=='nota'&&!entry.errorReportedAt)zebraMarcarImpressa(entry.roboId);
}

function zebraConcluirLoteAutomatico(){
  var b=zebraLerLote();if(!b||zebraLerPendente()||b.index<b.items.length)return false;
  zebraCheckUid(b.uid);
  var terminais=['usb_sent','failed','creation_rejected','failed_acknowledged','uncertain_resolved_printed','uncertain_resolved_not_printed'];
  if(!b.items.every(function(x){return terminais.includes(x.state);}))return false;
  b.items.forEach(function(x){if(x.state==='usb_sent')zebraRegistrarEnvio({uid:b.uid,jobId:x.jobId,roboId:x.roboId,numVisual:x.numVisual,kind:b.kind||'garantia'});});
  b.state='completed';b.deliveryAutomatic=true;b.physicalConfirmed=false;
  zebraSalvarLote(b);zebraLimparLote();
  etqSel=[];
  return true;
}

function zebraLiberarEnviosConcluidos(){
  var uid=window._getPrintCurrentUid();if(!uid)return;
  var p=zebraLerPendente();
  if(p){
    if(p.uid!==uid||p.state!=='usb_sent')return;
    zebraProcessarStatus({job_id:p.jobId,state:'usb_sent',usb_bytes:p.usb_bytes||0,message:'Envio já registrado'});
  }
  var b=zebraLerLote();
  if(b&&b.uid===uid&&b.index>=b.items.length)zebraConcluirLoteAutomatico();
}

function zebraInformarProblemaEnvio(jobId){
  var key='moledo_zebra_sent_v1',history=zebraStorageRead(key)||[],uid=window._getPrintCurrentUid();
  var entry=history.find(function(x){return x.uid===uid&&x.jobId===jobId;});if(!entry)return;
  entry.errorReportedAt=Date.now();zebraStorageWrite(key,history);
  if(entry.kind!=='nota'){
    DB.etqImpressas=(DB.etqImpressas||[]).filter(function(id){return id!==entry.roboId;});saveDB();etqAba='nao';
  }
  renderEtiqueta();
  showToast(entry.kind==='nota'?'Problema registrado. Use Abrir nota para preparar um novo envio.':'Etiqueta devolvida a Não impressas. Nenhum reenvio automático.',8000);
}

function zebraInformarProblemaRobo(roboId){
  var key='moledo_zebra_sent_v1',history=zebraStorageRead(key)||[],uid=window._getPrintCurrentUid();
  if(!uid)return;
  history.forEach(function(x){if(x.uid===uid&&x.roboId===roboId&&x.kind!=='nota')x.errorReportedAt=Date.now();});
  zebraStorageWrite(key,history);
  DB.etqImpressas=(DB.etqImpressas||[]).filter(function(id){return id!==roboId;});saveDB();etqAba='nao';renderEtiqueta();
  showToast('Etiqueta devolvida a Não impressas. Envie novamente quando desejar.',7000);
}

function zebraRenderHistoricoEnvios(){
  var list=zebraEnviosRegistrados().slice().reverse();if(!list.length)return '';
  return '<div style="margin:14px 0;"><b>Envios deste aparelho · etiquetas e notas</b><p style="font-size:12px;color:var(--text2);">O computador verifica o envio. Se houver problema no papel, informe abaixo. Nada será reenviado automaticamente.</p>'+list.map(function(x){
    var r=DB.robos.find(function(r){return r.id===x.roboId;}),c=r&&DB.clientes.find(function(c){return c.id===r.clienteId;});
    var nome=r?zebraNomeLista(r,c):'Equipamento';
    var action=x.errorReportedAt?'<span style="color:var(--orange);">Problema informado · '+(x.kind==='nota'?'nota disponível para nova tentativa':'em Não impressas')+'</span>':'<button class="btn btn-del" data-job="'+esc(x.jobId)+'" onclick="zebraInformarProblemaEnvio(this.dataset.job)">Não imprimiu / deu erro</button>';
    if(x.kind==='nota'&&r)action+=' <button class="btn btn-close" data-robo="'+esc(r.id)+'" onclick="abrirNotaRapida(this.dataset.robo)">Abrir nota</button>';
    return '<div style="padding:10px;margin:8px 0;border:1px solid var(--border);border-radius:8px;"><div>'+esc(nome)+' · #'+esc(String(x.numVisual||0).padStart(3,'0'))+' · '+(x.kind==='nota'?'Nota':'Etiqueta')+'</div><div style="font-size:11px;color:var(--text3);margin:5px 0;">'+esc(new Date(x.sentAt).toLocaleString('pt-BR'))+' · …'+esc(x.jobId.slice(-8))+'</div><div style="display:flex;gap:6px;flex-wrap:wrap;">'+action+'</div></div>';
  }).join('')+'</div>';
}
