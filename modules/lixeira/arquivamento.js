function moverParaLixeira(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var num='#'+String(r.numVisual).padStart(3,'0');
  openModal('<div class="modal-title danger">🗑️ Mover para Lixeira</div>'+
    textoEquipamento('<div style="font-size:13px;color:var(--text2);margin-bottom:16px;">O robô <strong style="color:var(--cyan);">',r)+num+'</strong>'+(c?' de <strong>'+esc(c.nome)+'</strong>':'')+' será movido para a lixeira.</div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button><button class="btn btn-del" onclick="executarMoverLixeira(\''+roboId+'\')">🗑️ Mover</button></div>');
}

function executarMoverLixeira(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  DB.lixeira.push({id:genId(),robo:JSON.parse(JSON.stringify(r)),nomeCliente:c?c.nome:'?',dataApagado:todayISO()});
  DB.robos=DB.robos.filter(function(x){return x.id!==roboId;});
  if(c&&DB.robos.filter(function(x){return x.clienteId===c.id;}).length===0)DB.clientes=DB.clientes.filter(function(x){return x.id!==c.id;});
  saveDB();closeModal();if(fichaClienteId)refreshFichaContent();renderAll();showToast('🗑️ Movido para a lixeira.');
}
