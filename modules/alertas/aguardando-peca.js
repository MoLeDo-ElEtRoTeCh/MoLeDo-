function cancelarAguardandoPeca(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  delete r.aguardandoPeca;saveDB();closeModal();renderAll();
  showToast(textoEquipamento('✅ Peça chegou! Robô de volta na fila.',r));
}

function abrirAguardandoPeca(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var num='#'+String(r.numVisual).padStart(3,'0');
  var hoje=new Date();
  var dPrev=new Date(hoje);dPrev.setDate(dPrev.getDate()+15);
  var dPrevStr=dPrev.toISOString().split('T')[0];
  openModal('<div class="modal-title">📦 Aguardando Peça — '+num+'</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:12px;">'+esc(descricaoEquipamento(r))+(c?' · '+esc(c.nome):'')+'</div>'+
    '<div class="form-group"><label class="form-label">📅 Data prevista de chegada</label>'+
    '<input id="ap-data" type="date" class="form-input" value="'+dPrevStr+'"></div>'+
    '<div class="form-group"><label class="form-label">📝 Observação (opcional)</label>'+
    '<input id="ap-obs" type="text" class="form-input" placeholder="Ex: peça importada, prazo do fornecedor..."></div>'+
    '<div class="modal-actions">'+
    '<button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-primary" onclick="salvarAguardandoPeca(\''+roboId+'\')"">📦 Confirmar</button>'+
    '</div>');
}

function salvarAguardandoPeca(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var data=document.getElementById('ap-data').value;
  var obs=document.getElementById('ap-obs').value.trim();
  if(!data){alert('Informe a data prevista.');return;}
  r.aguardandoPeca={dataPrevista:data,obs:obs,diasAoEntrar:Math.floor((new Date()-new Date(r.dataEntrada+'T00:00:00'))/(1000*60*60*24))};
  saveDB();closeModal();renderAll();
  showToast(textoEquipamento('📦 Robô em aguardo de peça até ',r)+fmtData(data)+'!');
}
