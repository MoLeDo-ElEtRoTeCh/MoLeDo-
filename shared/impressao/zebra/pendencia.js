function zebraLerPendente(){
  var p=zebraStorageRead(ZEBRA_PENDING_KEY);
  if(p&&(!p.jobId||!p.uid||p.printerId!==ZEBRA_PRINTER_ID))throw new Error('Pendência local inválida.');
  return p;
}

function zebraSalvarPendente(p){
  zebraStorageWrite(ZEBRA_PENDING_KEY,p);
}

function zebraAtualizarPendente(patch){
  var p=zebraLerPendente();
  if(!p)return null;
  Object.keys(patch||{}).forEach(function(k){p[k]=patch[k];});
  zebraSalvarPendente(p);
  if(document.getElementById('etiqueta-ui'))renderEtiqueta();
  return p;
}

function zebraLimparPendente(){
  zebraPararPolling();localStorage.removeItem(ZEBRA_PENDING_KEY);
}

function zebraPararPolling(){
  if(zebraPollTimer){clearTimeout(zebraPollTimer);zebraPollTimer=null;}
}

function zebraAgendarPolling(ms){
  zebraPararPolling();
  zebraPollTimer=setTimeout(function(){zebraConsultarPendente(false);},ms||2000);
}

async function zebraConsultarPendente(manual,forceRefresh){
  var p=zebraLerPendente();if(!p)return;
  zebraCheckUid(p.uid);
  try{
    var path='/jobs/'+ZEBRA_PRINTER_ID+'/'+encodeURIComponent(p.jobId),data;
    try{data=await zebraPrintApi(path,'GET',undefined,null,!!forceRefresh);}
    catch(e){if(e.status===401&&!forceRefresh)data=await zebraPrintApi(path,'GET',undefined,null,true);else throw e;}
    zebraProcessarStatus(data);
  }catch(e){
    zebraPararPolling();zebraPararLoteTimer();
    var b=zebraLerLote();if(b){b.state='paused_error';b.lastQueryError=zebraErroMensagem(e);zebraSalvarLote(b);}
    zebraAtualizarPendente({queryError:zebraDiagnosticoPost(e),localIssue:(p.creationError?'Erro original do POST: HTTP '+p.creationError.http+' / '+p.creationError.error+'. ':'')+'Consulta: '+zebraErroMensagem(e)+' Consulte novamente; não reenvie.'});
    showToast('Consulta falhou. Lote pausado, UUID preservado.',8000);
  }
}

function zebraRetomarPendente(){
  zebraMigrarRejeicaoConfirmada();
  var b=zebraLerLote(),p=zebraLerPendente();
  if(b&&b.state==='running')zebraPausarLote('Página/sessão recarregada. Confira o progresso e continue manualmente.');
  if(p&&typeof window._getPrintCurrentUid==='function'&&window._getPrintCurrentUid()===p.uid)zebraConsultarPendente(false);
}
