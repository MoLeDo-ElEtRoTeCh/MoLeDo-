function abrirMenuCliente(clienteId){
  var c=DB.clientes.find(function(x){return x.id===clienteId;});if(!c)return;
  var robos=DB.robos.filter(function(r){return r.clienteId===clienteId&&r.status==='reparo';});
  var comDiag=DB.robos.filter(function(r){return r.clienteId===clienteId&&r.diagnostico;}).length;
  var html='<div class="modal-title">⋮ '+esc(c.nome)+'</div>'+
    '<div style="font-size:12px;color:var(--text3);margin-bottom:12px;">Ações rápidas do cliente</div>'+
    '<button class="btn btn-cyan" style="width:100%;justify-content:flex-start;margin-bottom:8px;padding:11px 12px;" onclick="closeModal();openClienteDetalhe(\''+c.id+'\')">👤 Abrir ficha do cliente</button>'+
    '<button class="btn btn-wa" style="width:100%;justify-content:flex-start;margin-bottom:8px;padding:11px 12px;" onclick="closeModal();abrirWhatsAppDireto(\''+c.id+'\')">💬 WhatsApp</button>'+
    '<button class="btn btn-primary" style="width:100%;justify-content:flex-start;margin-bottom:8px;padding:11px 12px;" onclick="closeModal();abrirEtiquetasCliente(\''+c.id+'\')">🏷️ Etiquetas deste cliente <span style="margin-left:auto;opacity:.75;">'+robos.length+'</span></button>'+
    (comDiag?'<button class="btn btn-close" style="width:100%;justify-content:flex-start;margin-bottom:8px;padding:11px 12px;" onclick="closeModal();fichaClienteId=\''+c.id+'\';abrirCobrancaPix()">💰 Cobrança / PIX <span style="margin-left:auto;opacity:.75;">'+comDiag+'</span></button>':'')+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Fechar</button></div>';
  openModal(html);
}

function openClienteDetalhe(id){
  var c=DB.clientes.find(function(x){return x.id===id;});if(!c)return;
  fichaClienteId=id;
  document.getElementById('ficha-nome').textContent=c.nome;
  var waEl=document.getElementById('ficha-wa');
  waEl.innerHTML='📱 '+esc(c.whatsapp)+' <span style="font-size:11px;color:#25d366;">💬</span>';
  waEl.style.cursor='pointer';
  waEl.onclick=function(){abrirWhatsAppDireto(c.id);};
  refreshFichaContent();
  document.getElementById('ficha-overlay').classList.add('open');
}

function refreshFichaContent(){
  if(!fichaClienteId)return;
  var robos=DB.robos.filter(function(r){return r.clienteId===fichaClienteId;});
  document.getElementById('ficha-content').innerHTML=robos.length?robos.map(function(r){return renderRoboCard(r,true);}).join(''):'<div class="empty-state"><div class="empty-icon">🤖</div><p>Nenhum robô.</p></div>';
}

function closeClienteDetalhe(){document.getElementById('ficha-overlay').classList.remove('open');fichaClienteId=null;renderClientes();}
