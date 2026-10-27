function getValorCobravel(r){
  if(!r||!r.diagnostico)return 0;
  var isCancelado=r._cancelado||r.status==='cancelado';
  if(isCancelado)return r.diagnostico.abertura||200;
  return r.diagnostico.total||0;
}
