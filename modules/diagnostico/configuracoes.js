function getCats(){var c=[];DB.catalogo.forEach(function(x){if(c.indexOf(x.cat)===-1)c.push(x.cat);});return c.sort();}

function fecharConfigDiag(){document.getElementById('config-overlay').classList.remove('open');renderDiagnosticoLista();}

function renderConfigDiag(){
  var el=document.getElementById('config-content');
  var cats=getCats();var ativosHtml='';var inativosHtml='';
  cats.forEach(function(cat){
    var items=DB.catalogo.filter(function(x){return x.cat===cat;});
    var ativos=items.filter(function(x){return x.ativo!==false;});
    var inat=items.filter(function(x){return x.ativo===false;});
    if(ativos.length){ativosHtml+='<div class="config-cat-title">'+esc(cat)+'</div>'+ativos.map(function(i){return renderConfigItem(i,'diag');}).join('');}
    if(inat.length)inat.forEach(function(i){inativosHtml+=renderConfigItem(i,'diag');});
  });
  // defeitos checkin
  var catsCI={};
  (DB.defeitosCI||[]).forEach(function(d){if(!catsCI[d.cat])catsCI[d.cat]=[];catsCI[d.cat].push(d);});
  var ciAtivosHtml='';var ciInatHtml='';
  Object.keys(catsCI).forEach(function(cat){
    var ativos=catsCI[cat].filter(function(x){return x.ativo!==false;});
    var inat=catsCI[cat].filter(function(x){return x.ativo===false;});
    if(ativos.length){ciAtivosHtml+='<div class="config-cat-title">'+esc(cat)+'</div>'+ativos.map(function(i){return renderConfigItem(i,'ci');}).join('');}
    if(inat.length)inat.forEach(function(i){ciInatHtml+=renderConfigItem(i,'ci');});
  });
  var taxasHtml='<div class="section-title" style="margin-top:20px;">💳 Taxas de Parcelamento</div>'+
    [{id:'debito',l:'💳 Débito'},{id:'c1',l:'💳 Crédito à vista'},{id:'c2',l:'2x'},{id:'c3',l:'3x'},{id:'c4',l:'4x'},{id:'c5',l:'5x'},{id:'c6',l:'6x'},{id:'c7',l:'7x'},{id:'c8',l:'8x'}].map(function(t){
      return'<div style="display:flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:6px;">'+
        '<span style="flex:1;font-size:13px;color:var(--text2);font-weight:600;">'+t.l+'</span>'+
        '<input type="number" id="taxa-'+t.id+'" value="'+(TAXAS[t.id]*100).toFixed(2)+'" step="0.01" min="0" style="width:90px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 8px;color:var(--text);font-family:\'Rajdhani\',sans-serif;font-size:13px;text-align:right;outline:none;">'+
        '<span style="font-size:12px;color:var(--text3);">%</span></div>';
    }).join('')+
    '<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px;" onclick="salvarTaxas()">💾 Salvar Taxas</button>';
  el.innerHTML=
    '<div class="section-title">💊 Catálogo de Diagnóstico</div>'+
    '<button class="btn btn-cyan" style="width:100%;justify-content:center;margin-bottom:12px;" onclick="abrirFormItem(null,\'diag\')">+ Adicionar Item Diagnóstico</button>'+
    ativosHtml+
    (inativosHtml?'<div class="section-title" style="margin-top:16px;">Inativos</div>'+inativosHtml:'')+
    '<div class="section-title" style="margin-top:24px;">📥 Defeitos do Check-in</div>'+
    '<button class="btn btn-cyan" style="width:100%;justify-content:center;margin-bottom:12px;" onclick="abrirFormItem(null,\'ci\')">+ Adicionar Defeito Check-in</button>'+
    ciAtivosHtml+
    (ciInatHtml?'<div class="section-title" style="margin-top:16px;">Inativos</div>'+ciInatHtml:'')+
    taxasHtml+
    '<div style="height:20px;"></div>';
}

function salvarAnthropicKey(){
  var key=document.getElementById('cfg-anthropic-key').value.trim();
  DB.anthropicKey=key;
  saveDB();
  showToast(key?'✅ Configuração de IA salva!':'✅ Chave removida.');
}

function renderConfigItem(item,tipo){
  tipo=tipo||'diag';
  return'<div class="config-item-card'+(item.ativo===false?' inativo':'')+'">'+
    '<div class="config-item-header">'+
    '<div><div class="config-item-nome">'+esc(item.nome)+'</div><div class="config-item-cat">'+esc(item.cat)+'</div></div>'+
    '<div class="config-item-actions">'+
    '<button class="config-btn edit" onclick="abrirFormItem(\''+item.id+'\',\''+tipo+'\')">✏️</button>'+
    '<button class="config-btn toggle'+(item.ativo===false?' off':'')+'" onclick="toggleItemAtivo(\''+item.id+'\',\''+tipo+'\')">'+(item.ativo===false?'▶':'⏸')+'</button>'+
    '<button class="config-btn del" onclick="excluirItemCatalogo(\''+item.id+'\',\''+tipo+'\')">🗑️</button>'+
    '</div></div></div>';
}

function toggleItemAtivo(id,tipo){
  var lista=tipo==='ci'?DB.defeitosCI:DB.catalogo;
  var item=lista.find(function(x){return x.id===id;});if(!item)return;
  item.ativo=item.ativo===false;saveDB();renderConfigDiag();showToast(item.ativo?'▶ Ativado!':'⏸ Desativado!');
}

function excluirItemCatalogo(id,tipo){
  if(!confirm('Excluir este item?'))return;
  if(tipo==='ci')DB.defeitosCI=DB.defeitosCI.filter(function(x){return x.id!==id;});
  else DB.catalogo=DB.catalogo.filter(function(x){return x.id!==id;});
  saveDB();renderConfigDiag();showToast('🗑️ Item excluído!');
}

function abrirFormItem(id,tipo){
  tipo=tipo||'diag';
  configEditId=id;
  var lista=tipo==='ci'?DB.defeitosCI:DB.catalogo;
  var item=id?lista.find(function(x){return x.id===id;}):null;
  if(tipo==='ci'){
    // formulário simples para defeito checkin
    var catsCI=[...new Set((DB.defeitosCI||[]).map(function(d){return d.cat;}))].sort();
    var catOpts=catsCI.map(function(c){return'<option value="'+esc(c)+'"'+(item&&item.cat===c?' selected':'')+'>'+esc(c)+'</option>';}).join('');
    openModal('<div class="modal-title">'+(id?'✏️ Editar Defeito':'➕ Novo Defeito')+'</div>'+
      '<div class="form-group"><label class="form-label">Categoria <span>*</span></label>'+
      '<select id="fi-cat" class="form-input">'+catOpts+'</select>'+
      '<input id="fi-cat-nova" class="form-input" type="text" placeholder="Ou nova categoria..." style="margin-top:6px;"></div>'+
      '<div class="form-group"><label class="form-label">Nome do Defeito <span>*</span></label><input id="fi-nome" class="form-input" type="text" value="'+(item?esc(item.nome):'')+'"></div>'+
      '<div class="form-group"><label class="form-label">Status</label>'+
      '<div class="checkbox-row"><input type="checkbox" id="fi-ativo"'+((!item||item.ativo!==false)?' checked':'')+'><label for="fi-ativo">Ativo</label></div></div>'+
      '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
      '<button class="btn btn-primary" style="padding:8px 18px;font-size:13px;" onclick="salvarFormItemCI(\''+tipo+'\')">💾 Salvar</button></div>');
  } else {
    var cats=getCats();
    var catOpts=cats.map(function(c){return'<option value="'+esc(c)+'"'+(item&&item.cat===c?' selected':'')+'>'+esc(c)+'</option>';}).join('');
    openModal('<div class="modal-title">'+(id?'✏️ Editar Item':'➕ Novo Item')+'</div>'+
      '<div class="form-group"><label class="form-label">Categoria <span>*</span></label>'+
      '<select id="fi-cat" class="form-input">'+catOpts+'</select>'+
      '<input id="fi-cat-nova" class="form-input" type="text" placeholder="Ou nova categoria..." style="margin-top:6px;"></div>'+
      '<div class="form-group"><label class="form-label">Nome <span>*</span></label><input id="fi-nome" class="form-input" type="text" value="'+(item?esc(item.nome):'')+'"></div>'+
      '<div class="form-group"><label class="form-label">Diagnóstico Técnico <span>*</span></label><textarea id="fi-diag" class="form-input">'+(item?esc(item.diag):'')+'</textarea></div>'+
      '<div class="form-group"><label class="form-label">Ação Necessária <span>*</span></label><textarea id="fi-acao" class="form-input">'+(item?esc(item.acao):'')+'</textarea></div>'+
      '<div class="form-group"><label class="form-label">Observação Pronta <span>*</span></label><textarea id="fi-obs" class="form-input" style="min-height:100px;">'+(item?esc(item.obs):'')+'</textarea></div>'+
      '<div class="form-group"><label class="form-label">Valor Padrão (R$)</label><input id="fi-valor" class="form-input" type="number" min="0" step="0.01" value="'+(item?item.valor:0)+'"></div>'+
      '<div class="form-group"><label class="form-label">Status</label>'+
      '<div class="checkbox-row"><input type="checkbox" id="fi-ativo"'+((!item||item.ativo!==false)?' checked':'')+'><label for="fi-ativo">Ativo</label></div></div>'+
      '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
      '<button class="btn btn-primary" style="padding:8px 18px;font-size:13px;" onclick="salvarFormItem()">💾 Salvar</button></div>');
  }
}

function salvarFormItemCI(){
  var catNova=document.getElementById('fi-cat-nova').value.trim();
  var cat=catNova||document.getElementById('fi-cat').value;
  var nome=document.getElementById('fi-nome').value.trim();
  var ativo=document.getElementById('fi-ativo').checked;
  if(!nome){alert('Informe o nome do defeito.');return;}
  if(!cat){alert('Selecione ou crie uma categoria.');return;}
  if(configEditId){
    var item=DB.defeitosCI.find(function(x){return x.id===configEditId;});
    if(item){item.cat=cat;item.nome=nome;item.ativo=ativo;}
  } else DB.defeitosCI.push({id:genId(),cat:cat,nome:nome,ativo:true});
  saveDB();closeModal();renderConfigDiag();showToast(configEditId?'✅ Defeito atualizado!':'✅ Defeito adicionado!');
}

function salvarFormItem(){
  var catNova=document.getElementById('fi-cat-nova').value.trim();
  var cat=catNova||document.getElementById('fi-cat').value;
  var nome=document.getElementById('fi-nome').value.trim();
  var diag=document.getElementById('fi-diag').value.trim();
  var acao=document.getElementById('fi-acao').value.trim();
  var obs=document.getElementById('fi-obs').value.trim();
  var valor=parseFloat(document.getElementById('fi-valor').value)||0;
  var ativo=document.getElementById('fi-ativo').checked;
  if(!nome){alert('Informe o nome.');return;}if(!diag){alert('Informe o diagnóstico técnico.');return;}
  if(!acao){alert('Informe a ação necessária.');return;}if(!obs){alert('Informe a observação pronta.');return;}
  if(!cat){alert('Selecione ou crie uma categoria.');return;}
  if(configEditId){
    var item=DB.catalogo.find(function(x){return x.id===configEditId;});
    if(item){item.cat=cat;item.nome=nome;item.diag=diag;item.acao=acao;item.obs=obs;item.valor=valor;item.ativo=ativo;}
  } else DB.catalogo.push({id:genId(),cat:cat,nome:nome,diag:diag,acao:acao,obs:obs,valor:valor,ativo:ativo,ultimoPreco:0});
  saveDB();closeModal();renderConfigDiag();showToast(configEditId?'✅ Item atualizado!':'✅ Item adicionado!');
}

function salvarTaxas(){
  ['debito','c1','c2','c3','c4','c5','c6','c7','c8'].forEach(function(id){var el=document.getElementById('taxa-'+id);if(el)TAXAS[id]=parseFloat(el.value)/100||0;});
  DB.taxas=JSON.parse(JSON.stringify(TAXAS));saveDB();showToast('✅ Taxas salvas!');
}

function abrirConfigDiag(){
  // Abre o overlay de configurações completo (catálogo + taxas + IA)
  var overlay=document.getElementById('config-overlay');
  overlay.classList.add('open');
  renderConfigDiag();
}

function abrirConfigDiagCat(cat,tipo){
  var lista=DB.catalogo.filter(function(x){return x.cat===cat;});
  function renderLista(){
    var html='<div class="modal-title">⚙️ '+esc(cat)+'</div>';
    lista.forEach(function(item){
      html+='<div class="config-item-card'+(item.ativo===false?' inativo':'')+'">'+
        '<div class="config-item-header">'+
        '<div><div class="config-item-nome">'+esc(item.nome)+'</div></div>'+
        '<div class="config-item-actions">'+
        '<button class="config-btn edit" onclick="closeModal();abrirFormItem(\''+item.id+'\',\'diag\')">✏️</button>'+
        '<button class="config-btn toggle'+(item.ativo===false?' off':'')+'" onclick="toggleItemAtivo(\''+item.id+'\',\'diag\');abrirConfigDiagCat(\''+cat.replace(/'/g,"\\'")+'\',\'diag\')">'+(item.ativo===false?'▶':'⏸')+'</button>'+
        '<button class="config-btn del" onclick="excluirItemCatalogo(\''+item.id+'\',\'diag\');abrirConfigDiagCat(\''+cat.replace(/'/g,"\\'")+'\',\'diag\')">🗑️</button>'+
        '</div></div></div>';
    });
    html+='<button class="btn btn-cyan" style="width:100%;justify-content:center;margin-top:10px;" onclick="closeModal();abrirFormItem(null,\'diag\')">+ Adicionar Item</button>'+
      '<div class="modal-actions"><button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="closeModal()">✅ Fechar</button></div>';
    openModal(html);
  }
  renderLista();
}
