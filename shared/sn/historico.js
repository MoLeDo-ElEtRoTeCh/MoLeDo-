function buscarHistoricoSN(sn,ignorarId){
  if(!temSnValido(sn))return[];
  var alvo=canonSN(sn);
  return DB.robos.filter(function(x){return x.id!==ignorarId&&temSnValido(x.sn)&&canonSN(x.sn)===alvo;})
    .sort(function(a,b){return String(b.dataEntrada||'').localeCompare(String(a.dataEntrada||''));});
}

function mostrarHistoricoSN(sn,ignorarId){
  var lista=buscarHistoricoSN(sn,ignorarId);
  if(!lista.length){showToast('🔎 Nenhum atendimento anterior para este SN.');return;}
  var html=lista.map(function(x){
    var cx=DB.clientes.find(function(c){return c.id===x.clienteId;});
    var dg=x.diagnostico;
    return '<div style="padding:9px 0;border-bottom:1px solid var(--border);">'+
      '<div style="font-weight:800;color:var(--cyan);">'+esc(fmtData(x.dataEntrada))+' · '+esc(descricaoEquipamento(x)||'—')+'</div>'+
      '<div style="font-size:12px;color:var(--text2);">'+esc(cx?cx.nome:'Cliente não localizado')+' · '+(x.status==='garantia'?'🛡️ Garantia':x.status==='reparo'?'🔧 Reparo':'📁 '+esc(x.status||'—'))+'</div>'+
      (dg?'<div style="font-size:12px;color:var(--text3);margin-top:4px;">💊 '+esc(dg.descricao||'Diagnóstico salvo')+(dg.total!=null?' · '+fmtVal(dg.total):'')+'</div>':'<div style="font-size:12px;color:var(--text3);margin-top:4px;">Sem diagnóstico salvo</div>')+
    '</div>';
  }).join('');
  openModal('<div class="modal-title">🔎 Histórico do SN</div>'+
    '<div style="font-family:\'Share Tech Mono\',monospace;color:var(--cyan);font-weight:900;margin-bottom:8px;">'+esc(sn)+'</div>'+html+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Fechar</button></div>');
}
