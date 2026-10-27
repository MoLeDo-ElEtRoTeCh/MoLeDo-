function renderLixeira(){
  var el=document.getElementById('lixeira-list');
  if(!DB.lixeira.length){el.innerHTML='<div class="empty-state"><div class="empty-icon">🗑️</div><p>Lixeira vazia.</p></div>';return;}
  el.innerHTML='<div class="trash-info">📌 Itens ficam por <strong>1 ano</strong> e são removidos automaticamente.</div>'+
    '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;"><button class="btn btn-del" onclick="confirmarLimparLixeira()">🗑️ Limpar Tudo</button></div>'+
    DB.lixeira.slice().reverse().map(function(item){
      var rest=365-diasDesde(item.dataApagado);var num='#'+String(item.robo.numVisual).padStart(3,'0');
      return'<div class="card trash-card">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'+
        '<div><div class="cliente-label">'+esc(item.nomeCliente.toUpperCase())+'</div>'+
        '<div class="robot-num" style="color:var(--text3);text-shadow:none;">'+num+'</div>'+
        (item.motivo==='cancelamento'?'<div style="font-size:11px;color:var(--red);font-weight:700;">❌ Cancelado</div>':'')+
        '<div class="robot-sn">'+esc(item.robo.sn)+'</div><div class="robot-model" style="color:var(--text2);">'+esc(item.robo.modelo)+'</div></div>'+
        '<div style="text-align:right;"><div style="font-size:10px;color:var(--text3);">Expira em</div>'+
        '<div style="font-family:\'Share Tech Mono\';font-size:20px;color:var(--text3);">'+rest+'</div>'+
        '<div style="font-size:10px;color:var(--text3);">dias</div></div></div>'+
        '<span class="status-badge status-lixeira">🗑️ '+fmtData(item.dataApagado)+'</span>'+
        '<div class="robot-meta">📅 Entrada: '+fmtData(item.robo.dataEntrada)+'</div>'+
        '<div class="robot-actions">'+
        (item.motivo==='cancelamento'?'<button class="btn btn-cyan" style="padding:5px 10px;font-size:11px;" onclick="gerarOSCancelado(\''+item.id+'\')">🖨️ OS</button>':'')+
        (item.motivo==='cancelamento'?'<button class="btn btn-cyan" onclick="reativarRobo(\''+item.id+'\')">🔄 Reativar</button>':'')+
        '<button class="btn btn-del" onclick="confirmarExcluirPermanente(\''+item.id+'\')">⛔ Excluir para sempre</button></div></div>';
    }).join('');
}

function confirmarExcluirPermanente(itemId){
  openModal('<div class="modal-title danger">⛔ Excluir Permanentemente</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:16px;"><span style="color:var(--red);">⚠️ Esta ação não pode ser desfeita.</span></div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button><button class="btn btn-del" onclick="executarExcluirPermanente(\''+itemId+'\')">⛔ Sim, excluir</button></div>');
}

function executarExcluirPermanente(itemId){DB.lixeira=DB.lixeira.filter(function(x){return x.id!==itemId;});saveDB();closeModal();renderAll();showToast('⛔ Excluído permanentemente.');}

function confirmarLimparLixeira(){
  openModal('<div class="modal-title danger">⛔ Limpar Lixeira</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:16px;">Deseja excluir todos os '+DB.lixeira.length+' itens?</div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button><button class="btn btn-del" onclick="executarLimparLixeira()">⛔ Sim</button></div>');
}

function executarLimparLixeira(){DB.lixeira=[];saveDB();closeModal();renderAll();showToast('⛔ Lixeira limpa.');}
