function abrirConfigDefeitosCat(cat){
  // abre o modal de config de defeitos filtrado para aquela categoria
  var lista=(DB.defeitosCI||[]).filter(function(d){return d.cat===cat;});
  function renderLista(){
    var html='<div class="modal-title">⚙️ '+esc(cat)+'</div>';
    lista.forEach(function(d){
      html+='<div style="display:flex;align-items:center;gap:6px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:5px;'+(d.ativo===false?'opacity:.5':'')+'">'+
        '<span style="flex:1;font-size:13px;color:var(--text);font-weight:600;">'+esc(d.nome)+'</span>'+
        '<button class="config-btn toggle'+(d.ativo===false?' off':'')+'" onclick="toggleDefeitoCI(\''+d.id+'\');abrirConfigDefeitosCat(\''+cat.replace(/'/g,"\\'")+'\')">'+( d.ativo===false?'▶':'⏸')+'</button>'+
        '<button class="config-btn del" onclick="apagarDefeitoCI(\''+d.id+'\');abrirConfigDefeitosCat(\''+cat.replace(/'/g,"\\'")+'\')">🗑️</button>'+
      '</div>';
    });
    html+='<button class="btn btn-cyan" style="width:100%;justify-content:center;margin-top:10px;" onclick="novoDefeitoCICat(\''+cat.replace(/'/g,"\\'")+'\')">+ Adicionar</button>'+
      '<div class="modal-actions"><button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="closeModal();generateRobotBlocks()">✅ Fechar</button></div>';
    openModal(html);
  }
  renderLista();
}

function novoDefeitoCICat(cat){
  openModal('<div class="modal-title">➕ Novo Defeito — '+esc(cat)+'</div>'+
    '<div class="form-group"><label class="form-label">Nome do Defeito</label>'+
    '<input id="dci-nome-cat" class="form-input" type="text" placeholder="Ex: Bateria explodiu"></div>'+
    '<div class="modal-actions">'+
    '<button class="btn btn-close" onclick="abrirConfigDefeitosCat(\''+cat.replace(/'/g,"\\'")+'\')">Cancelar</button>'+
    '<button class="btn btn-primary" onclick="salvarDefeitoCICat(\''+cat.replace(/'/g,"\\'")+'\')">💾 Salvar</button></div>');
}

function salvarDefeitoCICat(cat){
  var nome=document.getElementById('dci-nome-cat').value.trim();
  if(!nome){alert('Informe o nome.');return;}
  if(!DB.defeitosCI)DB.defeitosCI=[];
  DB.defeitosCI.push({id:genId(),cat:cat,nome:nome,ativo:true});
  saveDB();abrirConfigDefeitosCat(cat);
}

function abrirConfigDefeitos(){
  function renderLista(){
    var catsCI={};
    (DB.defeitosCI||[]).forEach(function(d){if(!catsCI[d.cat])catsCI[d.cat]=[];catsCI[d.cat].push(d);});
    var html='<div class="modal-title">⚙️ Defeitos do Check-in</div>';
    Object.keys(catsCI).sort().forEach(function(cat){
      html+='<div style="font-size:11px;font-weight:700;color:var(--cyan2);letter-spacing:1px;text-transform:uppercase;margin:12px 0 6px;border-bottom:1px solid var(--border);padding-bottom:4px;">'+esc(cat)+'</div>';
      catsCI[cat].forEach(function(d){
        html+='<div style="display:flex;align-items:center;gap:6px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:5px;'+(d.ativo===false?'opacity:.5':'')+'">'+
          '<span style="flex:1;font-size:13px;color:var(--text);font-weight:600;">'+esc(d.nome)+'</span>'+
          '<button class="config-btn edit" onclick="editarDefeitoCI(\''+d.id+'\')">✏️</button>'+
          '<button class="config-btn toggle'+(d.ativo===false?' off':'')+'" onclick="toggleDefeitoCI(\''+d.id+'\')">'+(d.ativo===false?'▶':'⏸')+'</button>'+
          '<button class="config-btn del" onclick="apagarDefeitoCI(\''+d.id+'\')">🗑️</button>'+
        '</div>';
      });
    });
    html+='<button class="btn btn-cyan" style="width:100%;justify-content:center;margin-top:14px;" onclick="novoDefeitoCI()">+ Adicionar Defeito</button>'+
      '<div class="modal-actions"><button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="closeModal();generateRobotBlocks();">✅ Fechar</button></div>';
    openModal(html);
  }
  window._renderListaDefeitos=renderLista;
  renderLista();
}

function toggleDefeitoCI(id){
  var d=(DB.defeitosCI||[]).find(function(x){return x.id===id;});
  if(d){d.ativo=d.ativo===false;saveDB();window._renderListaDefeitos&&window._renderListaDefeitos();}
}

function apagarDefeitoCI(id){
  if(!confirm('Apagar este defeito?'))return;
  DB.defeitosCI=(DB.defeitosCI||[]).filter(function(x){return x.id!==id;});
  saveDB();window._renderListaDefeitos&&window._renderListaDefeitos();
}

function editarDefeitoCI(id){
  var d=(DB.defeitosCI||[]).find(function(x){return x.id===id;});if(!d)return;
  var catsCI=[...new Set((DB.defeitosCI||[]).map(function(x){return x.cat;}))].sort();
  var catOpts=catsCI.map(function(c){return'<option value="'+esc(c)+'"'+(d.cat===c?' selected':'')+'>'+esc(c)+'</option>';}).join('');
  openModal('<div class="modal-title">✏️ Editar Defeito</div>'+
    '<div class="form-group"><label class="form-label">Categoria</label>'+
    '<select id="dci-cat" class="form-input">'+catOpts+'</select>'+
    '<input id="dci-cat-nova" class="form-input" type="text" placeholder="Ou nova categoria..." style="margin-top:6px;"></div>'+
    '<div class="form-group"><label class="form-label">Nome do Defeito</label>'+
    '<input id="dci-nome" class="form-input" type="text" value="'+esc(d.nome)+'"></div>'+
    '<div class="modal-actions">'+
    '<button class="btn btn-close" onclick="abrirConfigDefeitos()">Cancelar</button>'+
    '<button class="btn btn-primary" onclick="salvarEdicaoDefeitoCI(\''+id+'\')">💾 Salvar</button></div>');
}

function novoDefeitoCI(){
  var catsCI=[...new Set((DB.defeitosCI||[]).map(function(x){return x.cat;}))].sort();
  var catOpts=catsCI.map(function(c){return'<option value="'+esc(c)+'">'+esc(c)+'</option>';}).join('');
  openModal('<div class="modal-title">➕ Novo Defeito</div>'+
    '<div class="form-group"><label class="form-label">Categoria</label>'+
    '<select id="dci-cat" class="form-input">'+catOpts+'</select>'+
    '<input id="dci-cat-nova" class="form-input" type="text" placeholder="Ou nova categoria..." style="margin-top:6px;"></div>'+
    '<div class="form-group"><label class="form-label">Nome do Defeito</label>'+
    '<input id="dci-nome" class="form-input" type="text" placeholder="Ex: Bateria explodiu"></div>'+
    '<div class="modal-actions">'+
    '<button class="btn btn-close" onclick="abrirConfigDefeitos()">Cancelar</button>'+
    '<button class="btn btn-primary" onclick="salvarEdicaoDefeitoCI(null)">💾 Salvar</button></div>');
}

function salvarEdicaoDefeitoCI(id){
  var catNova=document.getElementById('dci-cat-nova').value.trim();
  var cat=catNova||(document.getElementById('dci-cat')?document.getElementById('dci-cat').value:'');
  var nome=document.getElementById('dci-nome').value.trim();
  if(!nome){alert('Informe o nome do defeito.');return;}
  if(!cat){alert('Informe a categoria.');return;}
  if(id){var d=(DB.defeitosCI||[]).find(function(x){return x.id===id;});if(d){d.cat=cat;d.nome=nome;}}
  else{if(!DB.defeitosCI)DB.defeitosCI=[];DB.defeitosCI.push({id:genId(),cat:cat,nome:nome,ativo:true});}
  saveDB();abrirConfigDefeitos();
}
