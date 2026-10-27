function verificarVendedoresInativos(){
  var hoje=new Date();hoje.setHours(0,0,0,0);
  DB.clientes.forEach(function(c){
    if(c.tipo!=='vd'&&c.tipo!=='vc')return;
    var robosAtivos=DB.robos.filter(function(r){return r.clienteId===c.id&&(r.status==='reparo'||r.status==='garantia');});
    if(robosAtivos.length>0){c.inativo=false;c.dataInativo=null;return;}
    if(!c.inativo){c.inativo=true;c.dataInativo=hoje.toISOString().slice(0,10);}
  });
}
