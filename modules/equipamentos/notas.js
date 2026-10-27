function abrirNotaRapida(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var num='#'+String(r.numVisual).padStart(3,'0');
  openModal('<div class="modal-title">📝 Nota Rápida — '+num+'</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:10px;">'+esc(r.modelo||'—')+'</div>'+
    '<textarea id="nota-rapida-txt" class="form-input" style="min-height:100px;font-size:14px;" placeholder="Ex: aguardando peça, cliente busca sexta...">'+esc(r.notaRapida||'')+'</textarea>'+botaoIATexto('nota-rapida-txt')+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-primary" onclick="salvarNotaRapida(\''+roboId+'\')">💾 Salvar</button></div>');
}

function salvarNotaRapida(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  r.notaRapida=document.getElementById('nota-rapida-txt').value.trim();
  saveDB();closeModal();renderAll();showToast('📝 Nota salva!');
}
