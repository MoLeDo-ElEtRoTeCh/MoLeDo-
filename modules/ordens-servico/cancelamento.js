function gerarOSCancelado(itemId){
  var item=(DB.lixeira||[]).find(function(x){return x.id===itemId;});if(!item||!item.robo)return;
  var r=Object.assign({},item.robo,{_cancelado:true});
  gerarOS(r.id,r);
}
