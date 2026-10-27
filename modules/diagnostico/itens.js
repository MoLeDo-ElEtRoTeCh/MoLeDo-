function renderAvulsoList(){
  var wrap=document.getElementById('avulso-list');
  if(!wrap)return;
  if(!window._avulsoItens)window._avulsoItens=[];
  wrap.innerHTML=window._avulsoItens.map(function(it,i){
    return '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">'+
      '<input type="text" class="form-input" style="flex:1;font-size:13px;" placeholder="Descrição (ex: Bateria)" value="'+esc(it.nome||'')+'" oninput="window._avulsoItens['+i+'].nome=this.value;">'+
      '<input type="number" class="form-input" style="width:100px;font-size:13px;" placeholder="0,00" min="0" step="0.01" value="'+(it.preco||'')+'" oninput="window._avulsoItens['+i+'].preco=parseFloat(this.value)||0;atualizarTotalDiag();">'+
      '<button type="button" onclick="removeAvulsoLinha('+i+')" style="background:rgba(255,68,68,.15);border:1px solid rgba(255,68,68,.4);color:#ff6b6b;border-radius:6px;width:32px;height:32px;cursor:pointer;font-size:14px;flex-shrink:0;">✕</button>'+
    '</div>';
  }).join('');
}

function addAvulsoLinha(){
  if(!window._avulsoItens)window._avulsoItens=[];
  window._avulsoItens.push({nome:'',preco:0});
  renderAvulsoList();
}

function removeAvulsoLinha(i){
  if(!window._avulsoItens)return;
  window._avulsoItens.splice(i,1);
  renderAvulsoList();
  atualizarTotalDiag();
}
