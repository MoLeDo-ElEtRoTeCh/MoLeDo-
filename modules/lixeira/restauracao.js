function reativarRobo(itemId){
  var item=DB.lixeira.find(function(x){return x.id===itemId;});if(!item)return;
  var r=item.robo;
  var num='#'+String(r.numVisual).padStart(3,'0');
  openModal(textoEquipamento('<div class="modal-title">🔄 Reativar Robô</div>',r)+
    textoEquipamento('<div style="font-size:13px;color:var(--text2);margin-bottom:16px;">O robô <strong style="color:var(--cyan);">',r)+num+' — '+esc(descricaoEquipamento(r)||'—')+'</strong> de <strong>'+esc(item.nomeCliente)+'</strong> voltará para a fila de reparo com todos os dados anteriores.</div>'+
    '<div class="modal-actions">'+
    '<button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-primary" onclick="executarReativarRobo(\''+itemId+'\')">🔄 Reativar</button>'+
    '</div>');
}

function executarReativarRobo(itemId){
  var item=DB.lixeira.find(function(x){return x.id===itemId;});if(!item)return;
  var r=JSON.parse(JSON.stringify(item.robo));
  // Garante que o cliente existe, se não, recria
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  if(!c){
    // Tenta restaurar cliente básico
    DB.clientes.push({id:r.clienteId,nome:item.nomeCliente,whatsapp:'',vendedor:false,ativo:true});
  }
  // Volta status para reparo
  r.status='reparo';
  r.canceladoEm=null;
  DB.robos.push(r);
  // Remove da lixeira
  DB.lixeira=DB.lixeira.filter(function(x){return x.id!==itemId;});
  saveDB();closeModal();renderAll();
  showToast(textoEquipamento('✅ Robô ',r)+('#'+String(r.numVisual).padStart(3,'0'))+' reativado com sucesso!');
  // Vai para aba fila
  switchTab('fila');
}
