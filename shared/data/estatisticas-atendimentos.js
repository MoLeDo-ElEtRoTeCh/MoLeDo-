// Estatísticas derivadas: nenhum contador é persistido ou alterado manualmente.
function calcularEstatisticasAtendimentos(base){
  base=base||DB;
  var registros=[];
  (base.robos||[]).forEach(function(robo){registros.push({robo:robo,cancelado:false});});
  (base.lixeira||[]).forEach(function(item){
    if(item&&item.robo)registros.push({robo:item.robo,cancelado:item.motivo==='cancelamento'||item.robo.cancelado===true});
  });

  // O id representa o atendimento original; aparições no histórico não criam outro total.
  var porId={};
  registros.forEach(function(registro){
    var robo=registro.robo||{};
    var id=robo.id||['legado',robo.numOS,robo.numVisual,robo.dataEntrada,robo.sn].join('|');
    if(!porId[id])porId[id]={robo:robo,cancelado:false};
    porId[id].cancelado=porId[id].cancelado||registro.cancelado||robo.status==='cancelado';
    // Prefere a cópia que preserva evidências históricas de conclusão/garantia.
    if(robo.servicoPronto||robo.dataServicoPronto||robo.garantiaAte)porId[id].robo=robo;
  });

  var atendimentos=Object.keys(porId).map(function(id){
    var registro=porId[id],robo=registro.robo||{};
    var realizado=!!(robo.servicoPronto||robo.dataServicoPronto||robo.garantiaAte||robo.status==='garantia');
    return {cancelado:registro.cancelado,realizado:realizado,possuiGarantia:realizado&&!!(robo.garantiaAte||robo.status==='garantia'||robo.dataServicoPronto)};
  });
  return {
    servicosAFazer:atendimentos.filter(function(a){return !a.cancelado&&!a.realizado;}).length,
    servicosRealizados:atendimentos.filter(function(a){return !a.cancelado&&a.realizado;}).length,
    servicosCancelados:atendimentos.filter(function(a){return a.cancelado;}).length,
    garantias:atendimentos.filter(function(a){return !a.cancelado&&a.possuiGarantia;}).length,
    total:atendimentos.length
  };
}

function abrirDetalhesEstatisticas(){
  var e=calcularEstatisticasAtendimentos();
  openModal('<div class="modal-title">Estatísticas dos atendimentos</div><div class="card" style="display:grid;gap:10px;font-size:15px;line-height:1.5;">'+
    '<div>🔧 Serviços a fazer: <strong>'+e.servicosAFazer+'</strong></div>'+
    '<div>✅ Serviços realizados: <strong>'+e.servicosRealizados+'</strong></div>'+
    '<div>❌ Serviços cancelados: <strong>'+e.servicosCancelados+'</strong></div>'+
    '<div>🛡️ Serviços/Garantias: <strong>'+e.garantias+'</strong></div>'+
    '<div>📊 Total: <strong>'+e.total+'</strong></div></div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Fechar</button></div>');
}
