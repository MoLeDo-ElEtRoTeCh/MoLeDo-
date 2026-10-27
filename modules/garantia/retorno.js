function voltarGarantiaParaReparo(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  iniciarFluxoSN(roboId,'garantia');
}

function confirmarVoltarReparo(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  r.ultimaConferenciaSN=todayISO();
  r.status='reparo';
  r.dataEntrega=null;
  r.garantiaAte=null;
  r.servicoPronto=false;
  if(!r.mensagens)r.mensagens=[];
  r.mensagens.push({data:todayISO(),tipo:'voltouReparo'});
  saveDB();closeModal();renderAll();
  showToast('🔄 Robô voltou para reparo!');
}
