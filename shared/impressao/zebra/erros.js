function zebraErroHttp(status,data,raw){
  var e=new Error((data&&data.error)||('HTTP_'+status));
  e.status=status;
  e.code=data&&data.error?data.error:'';
  e.data=data||null;
  e.raw=raw||'';
  return e;
}

function zebraErroMensagem(e){
  var code=e&&e.code?e.code:(e&&e.message?e.message:'ERRO');
  var mapa={
    invalid_fields:'Dados da etiqueta incompatíveis com o serviço.',
    invalid_job_id:'Identificador da impressão inválido.',
    invalid_text:'Há texto inválido ou acima do limite na etiqueta.',
    invalid_numVisual:'Número visual inválido.',
    invalid_date:'Data de entrada inválida.',
    invalid_voltage:'Voltagem inválida.',
    invalid_defeitos:'Lista de defeitos inválida.',
    defeitos_too_long:'Texto dos defeitos está muito longo.',
    authentication_required:'Login necessário para imprimir.',
    invalid_token:'Sua sessão precisa ser renovada.',
    origin_denied:'Este endereço do MoLeDo não está autorizado para impressão.',
    printer_disabled:'A Zebra está desativada no serviço.',
    not_allowed:'Seu usuário não está autorizado para esta Zebra.',
    job_id_conflict:'Conflito no identificador da impressão.',
    printer_busy:'A Zebra já possui um trabalho ativo. Aguarde.',
    printer_offline:'O Pico/Zebra está offline no momento.',
    payload_too_large:'Os dados da etiqueta excederam o limite.',
    method_not_allowed:'Método de comunicação inválido.',
    internal_error:'O serviço encontrou um erro interno. Não foi feito novo envio.',
    TIMEOUT_REDE:'A resposta demorou demais. O mesmo UUID será consultado, sem reenviar.',
    RESPOSTA_NAO_JSON_CONSULTAR_UUID:'Resposta inesperada. O mesmo UUID será consultado, sem reenviar.',
    RESPOSTA_INVALIDA_CONSULTAR_UUID:'Resposta inválida. O mesmo UUID será consultado, sem reenviar.',
    LOGIN_NECESSARIO:'Faça login novamente.',
    USUARIO_ALTERADO:'O usuário logado mudou durante a impressão.'
  };
  return mapa[code]||('Falha na impressão: '+code);
}

function zebraErroCriacaoDefinitivo(e){
  // Exact status + JSON error contract. A bare 409 or ID collision is NOT enough.
  var known={400:['invalid_fields','invalid_job_id','invalid_text','invalid_bitmap_format','invalid_bitmap_data'],401:['authentication_required','invalid_token'],403:['origin_denied','printer_disabled','not_allowed'],405:['method_not_allowed'],409:['printer_busy','printer_offline'],413:['payload_too_large']};
  return !!(e&&e.data&&typeof e.data.error==='string'&&known[e.status]&&known[e.status].includes(e.data.error));
}

function zebraCreationErrorsAtivos(){
  var history=zebraStorageRead('moledo_zebra_creation_errors_v1')||[];
  var uid=typeof window._getPrintCurrentUid==='function'?window._getPrintCurrentUid():null;
  return history.filter(function(x){return x.uid===uid&&!x.dismissedAt;});
}

function zebraErroAtivoPorRobo(roboId){
  return zebraCreationErrorsAtivos().some(function(x){return x.roboId===roboId;});
}

function zebraAbrirFecharErro(jobId){
  var history=zebraStorageRead('moledo_zebra_creation_errors_v1')||[];
  var entry=history.find(function(x){return x.jobId===jobId;});if(!entry)return;
  var d=entry.creationError||{};
  openModal('<div class="modal-title" style="color:var(--orange);">⚠️ Encerrar aviso de impressão</div>'+ 
    '<div style="font-size:13px;color:var(--text2);line-height:1.6;">HTTP '+esc(String(d.http==null?'—':d.http))+' · '+esc(String(d.error||'erro'))+'<br><br><b>Esse problema já foi resolvido?</b></div>'+ 
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Voltar</button><button class="btn btn-del" data-job="'+esc(jobId)+'" onclick="zebraFecharErro(this.dataset.job,false)">Não</button><button class="btn btn-green" data-job="'+esc(jobId)+'" onclick="zebraFecharErro(this.dataset.job,true)">Sim</button></div>');
}

function zebraFecharErro(jobId,resolvido){
  var key='moledo_zebra_creation_errors_v1',history=zebraStorageRead(key)||[];
  var entry=history.find(function(x){return x.jobId===jobId;});if(!entry)return;
  entry.dismissedAt=Date.now();entry.resolved=!!resolvido;entry.resolution=resolvido?'user_resolved':'saved_for_later_diagnosis';
  zebraStorageWrite(key,history);closeModal();renderEtiqueta();
  if(resolvido)showToast('✅ Aviso encerrado.');
  else showToast('📸 Aviso encerrado. Se o defeito voltar, mande um print para o Chat analisar.',9000);
}

function zebraDiagnosticoPost(e){
  return {http:Number.isInteger(e.status)?e.status:null,error:String(e.data&&e.data.error||e.code||e.message||'unknown').slice(0,160),at:Date.now()};
}

function zebraEncerrarCriacaoRejeitada(p,diagnostic){
  zebraCheckUid(p.uid);
  var b=zebraLerLote(),item;
  if(p.batch&&b){
    zebraCheckUid(b.uid);item=b.items[Number(p.batchIndex)];
    if(!item||item.roboId!==p.roboId||(item.jobId&&item.jobId!==p.jobId))throw new Error('UUID do lote divergente: nenhuma limpeza realizada.');
  }
  // Evidence must be durable before releasing active state. Never store tokens.
  var key='moledo_zebra_creation_errors_v1',history=zebraStorageRead(key)||[];
  var entry={jobId:p.jobId,uid:p.uid,printerId:p.printerId,roboId:p.roboId||null,numVisual:p.numVisual==null?null:p.numVisual,creationError:diagnostic,outcome:'creation_rejected',closedAt:Date.now()};
  if(!history.some(function(x){return x.jobId===p.jobId;}))history.push(entry);
  zebraStorageWrite(key,history.slice(-100));
  if(item){
    item.jobId=p.jobId;item.state='creation_rejected';item.creationError=diagnostic;
    b.index=Math.max(b.index,Number(p.batchIndex)+1);b.state='paused_rejected';
    b.lastError='Criação rejeitada: HTTP '+diagnostic.http+' / '+diagnostic.error;
    zebraSalvarLote(b);
  }
  zebraLimparPendente();zebraPararLoteTimer();
  // Single-item rejection releases the UI; larger batches retain progress and
  // explicit Continue/Close buttons. Neither branch submits another print.
  if(b&&item&&b.items.length===1&&b.completed.length===0)zebraLimparLote();
  renderEtiqueta();
}
