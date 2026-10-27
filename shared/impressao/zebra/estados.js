function zebraEstadoInfo(p){
  var state=p&&p.state?p.state:'';
  var map={
    creating:['Preparando trabalho','var(--cyan)','Gerando o pedido com um único UUID.'],
    queued:['Aguardando o Pico','var(--yellow)','O trabalho foi aceito e aguarda o Pico buscar a etiqueta.'],
    claimed:['Etiqueta recebida pelo Pico','var(--cyan)','O Pico reservou este trabalho.'],
    sending:['Enviando dados à Zebra','var(--cyan)','A transferência USB está em andamento.'],
    usb_sent:['Dados enviados à Zebra','var(--green)','Confira fisicamente se saiu exatamente uma etiqueta correta.'],
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
      if(b.index>=b.items.length)b.state='awaiting_confirmation';
      // Commit progress BEFORE releasing pending. Recovery is idempotent.
      zebraSalvarLote(b);zebraLimparPendente();
      if(b.state==='awaiting_confirmation')setTimeout(zebraAbrirConfirmacaoLote,250);
      else if(running){zebraCooldownUntil=Date.now()+1400;zebraAgendarProximoLote(1550);}
      renderEtiqueta();return;
    }
    if(['failed','uncertain'].includes(data.state)){b.state='paused_'+data.state;zebraPararLoteTimer();}
    zebraSalvarLote(b);
  }
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
