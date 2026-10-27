function autocompleteCliente(val){
  var box=document.getElementById('ci-autocomplete');
  if(!val||val.length<2){box.style.display='none';return;}
  var matches=DB.clientes.filter(function(c){return c.nome.toLowerCase().indexOf(val.toLowerCase())!==-1;});
  if(!matches.length){box.style.display='none';return;}
  box.innerHTML=matches.slice(0,5).map(function(c){
    return'<div onclick="preencherClienteCI(\''+c.id+'\')" style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:13px;color:var(--text);">'+
      '<span style="font-weight:700;">'+esc(c.nome)+'</span> <span style="color:var(--text3);font-size:11px;">📱 '+esc(c.whatsapp)+'</span></div>';
  }).join('');
  box.style.display='block';
}

function autocompleteClienteWa(val){
  if(!val||val.length<6)return;
  var match=DB.clientes.find(function(c){return c.whatsapp===val;});
  if(match)preencherClienteCI(match.id);
}

function preencherClienteCI(id){
  var c=DB.clientes.find(function(x){return x.id===id;});if(!c)return;
  document.getElementById('ci-nome').value=c.nome;
  document.getElementById('ci-wa').value=c.whatsapp;
  if(c.tipo)setTipoCliente(c.tipo);
  // nomeClienteFinal agora é por robô - campo preenchido individualmente
  var box=document.getElementById('ci-autocomplete');if(box)box.style.display='none';
}
