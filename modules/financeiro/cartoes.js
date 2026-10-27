function splitTaxa(tipo){
  if(tipo==='debito')return TAXAS.debito||0;
  if(tipo==='c1')return TAXAS.c1||0;
  return TAXAS[tipo]||0;
}

function splitRotulo(tipo){
  if(tipo==='debito')return 'Débito';
  if(tipo==='c1')return 'Crédito à vista';
  return String(tipo||'c2').replace('c','')+'x';
}

function splitOpcoes(tipoSel){
  var ops=[
    ['debito','Débito'],
    ['c1','Crédito à vista'],
    ['c2','2x'],['c3','3x'],['c4','4x'],['c5','5x'],
    ['c6','6x'],['c7','7x'],['c8','8x']
  ];
  return ops.map(function(o){
    return '<option value="'+o[0]+'"'+(o[0]===tipoSel?' selected':'')+'>'+o[1]+'</option>';
  }).join('');
}

function ajustarSplitAoTotal(total,forcar){
  total=Number(total)||0;
  if(!splitCartoes||splitCartoes.length<4){
    splitCartoes=[
      {base:0,tipo:'c2'},{base:0,tipo:'c2'},{base:0,tipo:'c2'},{base:0,tipo:'c2'}
    ];
  }
  var soma=0;
  for(var i=0;i<splitCartoesQtd;i++)soma+=Number(splitCartoes[i].base)||0;
  var mudouTotal=Math.abs((splitUltimoTotal||0)-total)>0.009;
  if(forcar||splitUltimoTotal===0||(mudouTotal&&Math.abs(soma-(splitUltimoTotal||0))<0.02)){
    dividirCartoesIgual(total,false);
  }
  splitUltimoTotal=total;
}

function dividirCartoesIgual(total,rerender){
  total=Number(total);
  if(!isFinite(total))total=Number(splitUltimoTotal)||0;
  var cent=Math.round(total*100);
  var cada=Math.floor(cent/splitCartoesQtd);
  var resto=cent-(cada*splitCartoesQtd);
  for(var i=0;i<splitCartoesQtd;i++){
    splitCartoes[i].base=(cada+(i<resto?1:0))/100;
  }
  for(var j=splitCartoesQtd;j<4;j++)splitCartoes[j].base=0;
  splitUltimoTotal=total;
  if(rerender!==false)atualizarTotalDiag();
}

function setSplitQtd(qtd){
  splitCartoesQtd=Math.max(1,Math.min(4,Number(qtd)||1));
  dividirCartoesIgual(splitUltimoTotal,true);
}

function setSplitBase(i,val){
  var n=parseFloat(String(val).replace(',','.'));
  splitCartoes[i].base=isFinite(n)&&n>=0?n:0;
  atualizarResumoSplitDOM();
}

function setSplitTipo(i,tipo){
  splitCartoes[i].tipo=tipo;
  atualizarResumoSplitDOM();
}

function calcSplitCobrar(base,tipo){
  return (Number(base)||0)*(1+splitTaxa(tipo));
}

function splitDetalhe(base,tipo){
  var cobrar=calcSplitCobrar(base,tipo);
  if(tipo&&tipo.charAt(0)==='c'&&tipo!=='c1'){
    var n=Number(tipo.substring(1))||2;
    return fmtVal(cobrar)+' ('+n+'x de '+fmtVal(cobrar/n)+')';
  }
  return fmtVal(cobrar);
}

function atualizarResumoSplitDOM(){
  var total=Number(splitUltimoTotal)||0,soma=0,cobrarTotal=0;
  for(var i=0;i<splitCartoesQtd;i++){
    var base=Number(splitCartoes[i].base)||0;
    soma+=base;
    var cobrar=calcSplitCobrar(base,splitCartoes[i].tipo);
    cobrarTotal+=cobrar;
    var out=document.getElementById('split-charge-'+i);
    if(out)out.innerHTML=splitDetalhe(base,splitCartoes[i].tipo);
  }
  var res=document.getElementById('split-resumo');
  if(res){
    var dif=Math.round((total-soma)*100)/100;
    var ok=Math.abs(dif)<0.01;
    res.className='split-summary '+(ok?'ok':'warn');
    if(ok){
      res.innerHTML='✅ Distribuição fechada: '+fmtVal(soma)+' em '+splitCartoesQtd+' cartão'+(splitCartoesQtd>1?'ões':'')+
        '<br><span style="color:var(--text2);font-weight:600;">Total que será cobrado nos cartões, com as taxas: <b style="color:var(--cyan);">'+fmtVal(cobrarTotal)+'</b></span>';
    }else if(dif>0){
      res.innerHTML='⚠️ Ainda falta distribuir <b>'+fmtVal(dif)+'</b> do orçamento. Distribuído: '+fmtVal(soma)+' de '+fmtVal(total)+'.';
    }else{
      res.innerHTML='⚠️ Você distribuiu <b>'+fmtVal(Math.abs(dif))+'</b> a mais. Distribuído: '+fmtVal(soma)+' para um orçamento de '+fmtVal(total)+'.';
    }
  }
}

function renderDivisaoCartoes(total){
  ajustarSplitAoTotal(total,false);
  var qtdBtns=[1,2,3,4].map(function(n){
    return '<button type="button" class="split-qtd-btn'+(n===splitCartoesQtd?' sel':'')+'" onclick="setSplitQtd('+n+')">'+n+'</button>';
  }).join('');
  var h='<div class="split-card-box">'+
    '<div class="split-card-head">'+
      '<div><div style="font-size:12px;font-weight:900;color:#d9a7ff;">💳 DIVIDIR EM MAIS DE UM CARTÃO</div>'+
      '<div style="font-size:10px;color:var(--text3);margin-top:2px;">Calculadora interna — escolha quanto vai em cada cartão e a condição de cada um.</div></div>'+
      '<button type="button" class="split-equal-btn" onclick="dividirCartoesIgual('+Number(total)+',true)">⚖️ Dividir igual</button>'+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">'+
      '<span style="font-size:11px;color:var(--text2);font-weight:800;">Quantidade de cartões:</span>'+
      '<div class="split-qtd-btns">'+qtdBtns+'</div>'+
    '</div>';
  for(var i=0;i<splitCartoesQtd;i++){
    var c=splitCartoes[i];
    h+='<div class="split-card-item">'+
      '<div class="split-card-title"><span>💳 CARTÃO '+(i+1)+'</span><span>'+splitRotulo(c.tipo)+'</span></div>'+
      '<div class="split-card-grid">'+
        '<div><div class="split-field-label">Parte do orçamento neste cartão</div>'+
        '<input class="split-input" type="number" min="0" step="0.01" value="'+(Number(c.base)||0).toFixed(2)+'" oninput="setSplitBase('+i+',this.value)"></div>'+
        '<div><div class="split-field-label">Forma / parcelas</div>'+
        '<select class="split-select" onchange="setSplitTipo('+i+',this.value)">'+splitOpcoes(c.tipo)+'</select></div>'+
      '</div>'+
      '<div class="split-charge"><span class="lbl">COBRAR NESTE CARTÃO</span><span class="val" id="split-charge-'+i+'">'+splitDetalhe(c.base,c.tipo)+'</span></div>'+
    '</div>';
  }
  h+='<div id="split-resumo" class="split-summary"></div>'+
    '<div style="font-size:10px;color:var(--text3);margin-top:6px;">ℹ️ A soma das partes deve fechar exatamente o valor do orçamento. Cada cartão recebe sua própria taxa conforme a forma escolhida.</div>'+
    '</div>';
  setTimeout(atualizarResumoSplitDOM,0);
  return h;
}
