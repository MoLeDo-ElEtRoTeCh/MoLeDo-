function abrirEtiquetasCliente(clienteId){
  var c=DB.clientes.find(function(x){return x.id===clienteId;});if(!c)return;
  var robos=DB.robos.filter(function(r){return r.clienteId===clienteId&&r.status==='reparo';});
  if(!robos.length){
    openModal('<div class="modal-title">🏷️ Etiquetas — '+esc(c.nome)+'</div><div style="font-size:13px;color:var(--text2);padding:8px 0 14px;">Esse cliente não possui robô em reparo disponível para etiqueta.</div><div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Fechar</button></div>');
    return;
  }
  if(!window._etqClienteCopias)window._etqClienteCopias={};
  var html='<div class="modal-title">🏷️ Etiquetas — '+esc(c.nome)+'</div>'+
    '<div style="font-size:12px;color:var(--text3);margin-bottom:12px;">Escolha quantas cópias deseja para cada robô. A impressão continua usando o módulo atual de etiquetas.</div>';
  robos.forEach(function(r){
    var qtd=window._etqClienteCopias[r.id]||1;
    var num='#'+String(r.numVisual).padStart(3,'0');
    html+='<div style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--border);border-radius:9px;margin-bottom:7px;background:var(--bg2);">'+
      '<div style="flex:1;"><div style="font-size:13px;font-weight:800;color:var(--text);">'+num+' · '+esc(descricaoEquipamento(r)||'—')+'</div>'+
      textoEquipamento('<div style="font-size:10px;color:var(--text3);">Etiqueta do robô deste cliente</div></div>',r)+
      '<button onclick="mudarCopiaEtiquetaCliente(\''+clienteId+'\',\''+r.id+'\',-1)" style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer;font-weight:900;">−</button>'+
      '<div style="min-width:22px;text-align:center;font-weight:900;color:var(--cyan);">'+qtd+'</div>'+
      '<button onclick="mudarCopiaEtiquetaCliente(\''+clienteId+'\',\''+r.id+'\',1)" style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer;font-weight:900;">+</button>'+
      '<button class="btn btn-cyan" style="padding:7px 9px;font-size:11px;" onclick="prepararEtiquetaCliente(\''+r.id+'\')">Selecionar</button>'+
      '</div>';
  });
  html+='<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:9px;" onclick="prepararTodasEtiquetasCliente(\''+clienteId+'\')">🏷️ Preparar etiquetas deste cliente</button>'+
    '<div style="font-size:10px;color:var(--text3);margin-top:8px;">A integração direta com a impressora térmica continua em pausa. Este atalho apenas prepara as etiquetas no módulo atual.</div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Fechar</button></div>';
  openModal(html);
}

function mudarCopiaEtiquetaCliente(clienteId,roboId,delta){
  if(!window._etqClienteCopias)window._etqClienteCopias={};
  var atual=window._etqClienteCopias[roboId]||1;
  window._etqClienteCopias[roboId]=Math.max(1,Math.min(10,atual+delta));
  closeModal();abrirEtiquetasCliente(clienteId);
}

function prepararEtiquetaCliente(roboId){
  var qtd=(window._etqClienteCopias&&window._etqClienteCopias[roboId])||1;
  etqSel=[roboId];etqCopias[roboId]=qtd;
  closeModal();switchTab('etiqueta');renderEtiqueta();
  showToast('🏷️ Etiqueta selecionada. Confira e imprima quando desejar.');
}

function prepararTodasEtiquetasCliente(clienteId){
  var robos=DB.robos.filter(function(r){return r.clienteId===clienteId&&r.status==='reparo';});
  etqSel=[];
  robos.forEach(function(r){
    etqSel.push(r.id);
    etqCopias[r.id]=(window._etqClienteCopias&&window._etqClienteCopias[r.id])||1;
  });
  closeModal();switchTab('etiqueta');renderEtiqueta();
  showToast('🏷️ Etiquetas do cliente preparadas.');
}
