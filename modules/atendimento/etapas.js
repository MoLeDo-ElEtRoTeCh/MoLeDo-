function voltarEtapa(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var etapaAtual=r.status==='garantia'?3:(r.diagnostico?2:(r.bancada?1:0));
  if(etapaAtual===0)return;
  // Verifica se etapa atual teve WA enviado
  var tiposWA={1:'bancada',2:'diagnostico',3:'servicoPronto'};
  var tipoWA=tiposWA[etapaAtual];
  var waEnviado=tipoWA&&r.mensagens&&r.mensagens.find(function(m){return m.tipo===tipoWA;});
  if(waEnviado){
    var etapaLabel={1:'Bancada',2:'Diagnóstico',3:'Serviço Pronto'}[etapaAtual];
    openModal('<div class="modal-title">⚠️ Atenção</div>'+
      '<div style="font-size:13px;color:var(--text2);margin-bottom:16px;">A etapa <strong style="color:#ffd600;">'+etapaLabel+'</strong> já teve uma mensagem enviada via WhatsApp para o cliente.<br><br>Deseja voltar mesmo assim?</div>'+
      '<div class="modal-actions">'+
      '<button class="btn btn-close" onclick="closeModal()">❌ Não voltar</button>'+
      '<button class="btn btn-primary" onclick="confirmarVoltarEtapa(\''+roboId+'\')">✅ Sim, voltar</button>'+
      '</div>');
  } else {
    confirmarVoltarEtapa(roboId);
  }
}

function confirmarVoltarEtapa(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var etapaAtual=r.status==='garantia'?3:(r.diagnostico?2:(r.bancada?1:0));
  // Voltar de garantia → reparo
  if(etapaAtual===3){
    r.status='reparo';r.dataEntrega=null;r.garantiaAte=null;r.servicoPronto=false;
    saveDB();closeModal();renderAll();showToast('⬅️ Voltou para Diagnóstico');
    return;
  }
  // Voltar de diagnóstico → bancada (NÃO apaga diagnóstico ainda)
  if(etapaAtual===2){
    // Apenas marca que etapa atual é bancada — diagnóstico fica intacto até salvar bancada
    r._etapaAtual='bancada';
    saveDB();closeModal();renderAll();
    // Abre bancada automaticamente
    setTimeout(function(){closeModal();abrirBancada(roboId);},200);
    showToast('⬅️ Voltou para Bancada');
    return;
  }
  // Voltar de bancada → checkin (apaga bancada)
  if(etapaAtual===1){
    r.bancada=null;r.entradaBancada=null;r._etapaAtual='checkin';
    saveDB();closeModal();renderAll();showToast('⬅️ Voltou para Check-in');
    return;
  }
}

function avancarEtapa(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var etapaAtual=r.status==='garantia'?3:(r.diagnostico?2:(r.bancada?1:0));
  if(etapaAtual===1&&r.diagnostico){
    // Avança de bancada para diagnóstico
    r._etapaAtual='diagnostico';
    saveDB();closeModal();renderAll();
    setTimeout(function(){closeModal();abrirDiagnostico(roboId);},200);
    showToast('➡️ Avançou para Diagnóstico');
  } else if(etapaAtual===2&&r.servicoPronto){
    showToast('➡️ Já está em Serviço Pronto');
  }
}
