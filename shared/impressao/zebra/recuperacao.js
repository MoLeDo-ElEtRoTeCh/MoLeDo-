function zebraAbrirConfirmacaoUsb(saiu){
  var p=zebraLerPendente();if(!p||p.state!=='usb_sent'||p.batch)return;
  var texto=saiu?'Confirma que saiu exatamente UMA etiqueta completa e correta na Zebra?':'Confirma que a etiqueta NÃO saiu corretamente (não saiu, saiu parcial ou apresentou problema)?';
  openModal('<div class="modal-title">'+(saiu?'✅ Confirmar etiqueta':'⚠️ Etiqueta não confirmada')+'</div>'+ 
    '<div style="font-size:13px;color:var(--text2);line-height:1.6;">'+texto+'<br><br><b>Esta confirmação é física.</b> O estado usb_sent sozinho não comprova impressão.</div>'+ 
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Voltar</button><button class="btn '+(saiu?'btn-green':'btn-del')+'" onclick="zebraFinalizarUsbSent('+(saiu?'true':'false')+')">'+(saiu?'✅ Sim, saiu correta':'⚠️ Confirmo o problema')+'</button></div>');
}

function zebraFinalizarUsbSent(saiu){
  var p=zebraLerPendente();if(!p||p.state!=='usb_sent'||p.batch)return;
  zebraCheckUid(p.uid);
  if(saiu)zebraMarcarImpressa(p.roboId);
  zebraLimparPendente();etqSel=[];closeModal();renderEtiqueta();
}

function zebraEncerrarFalha(){
  var p=zebraLerPendente();if(!p||p.state!=='failed')return;
  zebraCheckUid(p.uid);
  if(p.batch)zebraAvancarResolvido(p,'failed_acknowledged');else zebraLimparPendente();
  renderEtiqueta();
}

function zebraAbrirResolucaoUncertain(resultado){
  var p=zebraLerPendente();if(!p||p.state!=='uncertain')return;
  var saiu=resultado==='printed';
  openModal('<div class="modal-title" style="color:var(--orange);">⚠️ Resolver resultado incerto</div>'+ 
    '<div style="font-size:13px;color:var(--text2);line-height:1.6;">'+(saiu?'Você conferiu fisicamente e a etiqueta saiu <b>completa e correta</b>.':'Você conferiu fisicamente e a etiqueta <b>não saiu corretamente</b> (não saiu ou ficou parcial).')+'<br><br>A resolução libera o job antigo, mas <b>não o reenvia</b>.</div>'+ 
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Voltar</button><button class="btn '+(saiu?'btn-green':'btn-del')+'" onclick="zebraResolverUncertain(\''+resultado+'\')">Confirmar resolução</button></div>');
}

async function zebraResolverUncertain(resultado){
  var p=zebraLerPendente();if(!p||p.state!=='uncertain')return;
  zebraCheckUid(p.uid);
  var data=await zebraPrintApi('/jobs/'+ZEBRA_PRINTER_ID+'/'+encodeURIComponent(p.jobId)+'/resolve','POST',{acknowledge_uncertain:true});
  if(!data||data.job_id!==p.jobId)throw new Error('UUID_DIVERGENTE');
  if(resultado==='printed')zebraMarcarImpressa(p.roboId);
  if(p.batch)zebraAvancarResolvido(p,'uncertain_resolved_'+resultado);else zebraLimparPendente();
  zebraCooldownUntil=Date.now()+7000;closeModal();renderEtiqueta();
  showToast('Resolução registrada. Nenhum reenvio; restantes pausados.',8000);
}

function zebraMigrarRejeicaoConfirmada(){
  var p=zebraLerPendente();
  if(!p||p.printerId!=='zebra01'||p.jobId!=='dc2f9d8f-b1ff-4778-8aef-b15eb4dd3113')return;
  zebraCheckUid(p.uid);
  if(!['creating','reconcile'].includes(p.state))return;
  zebraEncerrarCriacaoRejeitada(p,{http:409,error:'original_code_not_recovered',evidence:'POST 2026-09-23 09:46:56 BRT + administrative document lookup 404; explicitly authorized recovery',at:Date.now()});
}

function zebraAvancarResolvido(p,state){
  var b=zebraLerLote();if(!b)return;
  var item=b.items[Number(p.batchIndex)];
  if(!item||(item.jobId&&item.jobId!==p.jobId))throw new Error('UUID divergente.');
  item.state=state;b.index=Math.max(b.index,Number(p.batchIndex)+1);
  b.state=b.index>=b.items.length?'awaiting_confirmation':'paused_after_failed';
  zebraSalvarLote(b);zebraLimparPendente();
}
