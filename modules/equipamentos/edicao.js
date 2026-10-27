function editarRobo(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var num='#'+String(r.numVisual).padStart(3,'0');var isSC=r.sn==='SEM CÓDIGO';
  var defHtml=DEFEITOS.map(function(cat){
    return'<div class="defect-category">'+cat.cat+'</div><div class="defect-grid">'+
      cat.items.map(function(item){var s=r.defeitos&&r.defeitos.indexOf(item)!==-1;return'<button type="button" class="defect-btn'+(s?' sel':'')+'" onclick="this.classList.toggle(\'sel\')">'+esc(item)+'</button>';}).join('')+'</div>';
  }).join('');
  openModal(textoEquipamento('<div class="modal-title">✏️ Editar Robô ',r)+num+'</div>'+
    '<div class="form-group"><label class="form-label">Código / SN</label>'+
    '<div style="display:flex;gap:7px;align-items:center;"><input id="er-sn" class="form-input" type="text" value="'+(isSC?'':esc(r.sn))+'"'+(isSC?' disabled':'')+' oninput="this.dataset.snOrigem=\'manual\'" style="flex:1;">'+
    '<input id="er-sn-camera" type="file" accept="image/*" capture="environment" style="display:none;" onchange="processarFotoSNParaCampo(this,\'er-sn\',\'er-nosn\')">'+
    '<button type="button" class="btn btn-cyan" onclick="document.getElementById(\'er-sn-camera\').click()" style="white-space:nowrap;padding:9px 10px;">📷 Ler</button></div>'+
    '<div class="checkbox-row" style="margin-top:6px"><input type="checkbox" id="er-nosn"'+(isSC?' checked':'')+' onchange="var s=document.getElementById(\'er-sn\');if(this.checked){s.value=\'\';s.disabled=true;}else s.disabled=false;"><label for="er-nosn">Sem código/SN visível</label></div></div>'+
    (equipamentoEhOutro(r)?'<div class="form-group"><label class="form-label">Tipo / nome do equipamento *</label><input id="er-outro" class="form-input" value="'+esc(r.nomeTipoEquipamento||'')+'"></div>':'')+
    '<div class="form-group"><label class="form-label">Modelo</label><input id="er-modelo" class="form-input" type="text" value="'+(r.modelo==='—'?'':esc(r.modelo))+'"></div>'+
    '<div class="form-group"><label class="form-label">Voltagem</label>'+buildVoltBtns('er',r.voltagem||'—')+'</div>'+
    '<div class="form-group"><label class="form-label">Data de Entrada</label><input id="er-data" class="form-input" type="date" value="'+r.dataEntrada+'"></div>'+
    '<div class="form-group"><label class="form-label">Defeitos</label>'+defHtml+'</div>'+
    '<div class="form-group"><label class="form-label">Observação</label><textarea id="er-obs" class="form-input">'+esc(r.obs||'')+'</textarea>'+botaoIATexto('er-obs')+'</div>'+
    (c&&(c.tipo==='vc'||c.tipo==='vd')?'<div class="form-group"><label class="form-label" style="color:#00c896;">👤 Cliente Final (vendedor '+esc(c.nome)+')</label><input id="er-cliente-final" class="form-input" type="text" placeholder="Nome do cliente final" value="'+esc(r.nomeClienteFinal||'')+'"></div>':'')+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-primary" style="padding:8px 18px;font-size:13px;" onclick="salvarEdicaoRobo(\''+roboId+'\')">💾 Salvar</button></div>');
}

function salvarEdicaoRobo(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var sn=document.getElementById('er-sn').value.trim();var noSn=document.getElementById('er-nosn').checked;
  var modelo=document.getElementById('er-modelo').value.trim();var data=document.getElementById('er-data').value;
  var obs=document.getElementById('er-obs').value.trim();
  if(!sn&&!noSn){alert('Informe o Código/SN.');return;}if(!data){alert('Informe a data.');return;}
  if(equipamentoEhOutro(r)){var tipo=document.getElementById('er-outro').value.trim();if(!tipo){alert('Informe o tipo/nome do equipamento.');return;}r.nomeTipoEquipamento=tipo;}
  var defeitos=[];document.querySelectorAll('#modal-box .defect-btn.sel').forEach(function(b){defeitos.push(b.textContent.trim());});
  r.sn=noSn?'SEM CÓDIGO':sn;r.modelo=modelo||'—';r.voltagem=getVolt('er');r.dataEntrada=data;r.defeitos=defeitos;r.obs=obs;
  var erCF=document.getElementById('er-cliente-final');
  if(erCF)r.nomeClienteFinal=erCF.value.trim();
  saveDB();closeModal();renderAll();if(fichaClienteId)refreshFichaContent();showToast(textoEquipamento('✅ Robô atualizado!',r));
}
