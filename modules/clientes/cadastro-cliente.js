function setTipoCliente(tipo){
  ciTipo=tipo;
  ['cf','vd','vc'].forEach(function(t){
    var btn=document.getElementById('tipo-'+t);if(!btn)return;
    if(t===tipo){btn.style.background='rgba(0,229,255,.15)';btn.style.borderColor='rgba(0,229,255,.5)';btn.style.color='var(--cyan)';}
    else{btn.style.background='var(--bg2)';btn.style.borderColor='var(--border)';btn.style.color='var(--text3)';}
  });
  var cfGroup=document.getElementById('ci-nome-cliente-final-group');
  if(cfGroup)cfGroup.style.display=(tipo==='vc')?'block':'none';
  var nomeInput=document.getElementById('ci-nome');
  if(nomeInput){
    if(tipo==='vd'||tipo==='vc')nomeInput.placeholder='Ex: João Matheus (vendedor)';
    else nomeInput.placeholder='Ex: Luiz Ferreira';
  }
}

function editarCliente(){
  var c=DB.clientes.find(function(x){return x.id===fichaClienteId;});if(!c)return;
  var tipo=c.tipo||'cf';
  function btnStyle(t){return t===tipo?'flex:1;padding:8px;border-radius:8px;border:1px solid rgba(0,229,255,.4);background:rgba(0,229,255,.15);color:var(--cyan);font-family:\'Rajdhani\',sans-serif;font-size:12px;font-weight:700;cursor:pointer;':'flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--text3);font-family:\'Rajdhani\',sans-serif;font-size:12px;font-weight:700;cursor:pointer;';}
  openModal('<div class="modal-title">✏️ Editar Cliente</div>'+
    '<div class="form-group"><label class="form-label">Tipo</label>'+
    '<div style="display:flex;gap:6px;">'+
    '<button type="button" id="ec-tipo-cf" onclick="setEcTipo(\'cf\')" style="'+btnStyle('cf')+'">👤 Cliente Final</button>'+
    '<button type="button" id="ec-tipo-vd" onclick="setEcTipo(\'vd\')" style="'+btnStyle('vd')+'">🏪 Vendedor</button>'+
    '<button type="button" id="ec-tipo-vc" onclick="setEcTipo(\'vc\')" style="'+btnStyle('vc')+'">🤝 Vend+Cliente</button>'+
    '</div></div>'+
    '<div id="ec-nome-cf-group" style="display:'+(tipo==='vc'?'block':'none')+';" class="form-group"><label class="form-label">Nome Cliente Final</label><input id="ec-nome-cf" class="form-input" type="text" value="'+(c.nomeClienteFinal?esc(c.nomeClienteFinal):'')+'"></div>'+
    '<div class="form-group"><label class="form-label">Nome</label><input id="ec-nome" class="form-input" type="text" value="'+esc(c.nome)+'"></div>'+
    '<div class="form-group"><label class="form-label">WhatsApp</label><input id="ec-wa" class="form-input" type="tel" value="'+esc(c.whatsapp)+'"></div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-primary" style="padding:8px 18px;font-size:13px;" onclick="salvarEdicaoCliente(\''+c.id+'\')">💾 Salvar</button></div>');
  window._ecTipo=tipo;
}

function setEcTipo(t){
  window._ecTipo=t;
  ['cf','vd','vc'].forEach(function(x){
    var btn=document.getElementById('ec-tipo-'+x);if(!btn)return;
    if(x===t){btn.style.background='rgba(0,229,255,.15)';btn.style.borderColor='rgba(0,229,255,.4)';btn.style.color='var(--cyan)';}
    else{btn.style.background='var(--bg2)';btn.style.borderColor='var(--border)';btn.style.color='var(--text3)';}
  });
  var cfGroup=document.getElementById('ec-nome-cf-group');
  if(cfGroup)cfGroup.style.display=(t==='vc')?'block':'none';
}

function salvarEdicaoCliente(id){
  var c=DB.clientes.find(function(x){return x.id===id;});if(!c)return;
  var nome=document.getElementById('ec-nome').value.trim();
  var wa=document.getElementById('ec-wa').value.trim();
  if(!nome||!wa){alert('Preencha todos os campos.');return;}
  c.nome=nome;c.whatsapp=wa;
  c.tipo=window._ecTipo||c.tipo||'cf';
  var nomeCF=document.getElementById('ec-nome-cf');
  // nomeClienteFinal agora é por robô, não por cliente
  saveDB();closeModal();
  document.getElementById('ficha-nome').textContent=nome;
  document.getElementById('ficha-wa').textContent='📱 '+wa;
  renderClientes();showToast('✅ Cliente atualizado!');
}
