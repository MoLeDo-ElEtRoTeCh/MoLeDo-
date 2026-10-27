function abrirDiagnostico(roboId,snJaConferido){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  if(!temSnValido(r.sn)&&r.snDecisaoDiagnostico!=='sem_codigo'){
    openModal('<div class="modal-title">Deseja inserir o SN deste equipamento?</div><div class="modal-actions">'+
      '<button class="btn btn-cyan" onclick="iniciarFluxoSN(\''+r.id+'\',\'diagnostico\')">INSERIR SN</button>'+
      '<button class="btn btn-close" onclick="diagnosticoSemCodigo(\''+r.id+'\')">SEM CÓDIGO</button></div>');
    return;
  }
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  diagRoboId=roboId;parcelaSel=2;
  var snInfo=temSnValido(r.sn)?r.sn:'SEM CÓDIGO';
  document.getElementById('diag-robo-info').textContent=(c?c.nome+' — ':'')+('#'+String(r.numVisual).padStart(3,'0'))+' · '+descricaoEquipamento(r)+' · SN: '+snInfo;
  renderDiagContent(r);document.getElementById('diag-overlay').classList.add('open');
}

function fecharDiagnostico(){
  document.getElementById('diag-overlay').classList.remove('open');
  diagRoboId=null;
  renderAll();
  // Garante atualização imediata da lista
  if(currentTab==='diagnostico')renderDiagnosticoLista();
}

function renderDiagContent(r){
  var d=r.diagnostico||{abertura:200,itens:[],desconto:0,descricao:'',data:todayISO()};
  var el=document.getElementById('diag-content');
  var ativos=DB.catalogo.filter(function(x){return x.ativo!==false;});
  var cats=[];ativos.forEach(function(x){if(cats.indexOf(x.cat)===-1)cats.push(x.cat);});cats.sort();
  // Abertura — 3 opções: com abertura, sem abertura, nenhuma
  var aberSel = d.abertura===200?'com':d.abertura===80?'sem':(d.abertura===0&&d._semCobranca?'nenhum':'com');
  var aberHtml='<div class="section-title">Abertura / Diagnóstico</div>'+
    '<div class="abertura-row" style="display:flex;gap:8px;">'+
    '<button type="button" class="abertura-btn'+(aberSel==='com'?' sel':'')+'" onclick="selAbertura(200,this)" data-aber="com">🔧 Com abertura<br><strong>R$ 200,00</strong></button>'+
    '<button type="button" class="abertura-btn'+(aberSel==='sem'?' sel':'')+'" onclick="selAbertura(80,this)" data-aber="sem">🔍 Sem abertura<br><strong>R$ 80,00</strong></button>'+
    '<button type="button" class="abertura-btn'+(aberSel==='nenhum'?' sel':'')+'" onclick="selAbertura(0,this)" data-aber="nenhum" style="font-size:12px;">🚫 Sem cobrança</button>'+
    '</div>';
  // Seção descrição + botão IA
  var descHtml='<div class="section-title">Descrição / Complemento</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:6px;">'+
    '<textarea id="diag-descricao" class="form-input" placeholder="Complemento técnico..." style="min-height:70px;flex:1;">'+esc(d.descricao||'')+'</textarea>'+
    '</div>';
  // Seção IA — só o botão Descrever para IA (seleção manual removida)
  var itensHtml='<div class="section-title">Serviços / Peças</div>'+
    '<button type="button" onclick="abrirIADiag()" style="width:100%;padding:12px;background:linear-gradient(135deg,rgba(138,43,226,.25),rgba(0,229,255,.15));border:1px solid rgba(138,43,226,.5);border-radius:10px;color:#c77dff;font-family:\'Rajdhani\',sans-serif;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:10px;">✨ Descrever para IA — ela monta o diagnóstico e os valores</button>';
  var descontoHtml='<div class="section-title">Desconto / Extras</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">'+
    '<div><div style="font-size:11px;color:var(--text3);margin-bottom:4px;font-weight:700;">💸 DESCONTO (R$)</div>'+
    '<input type="number" id="diag-desconto" class="form-input" value="'+(d.desconto||0)+'" min="0" step="0.01" oninput="atualizarTotalDiag()"></div>'+
    '<div><div style="font-size:11px;color:var(--text3);margin-bottom:4px;font-weight:700;">🚚 FRETE (R$)</div>'+
    '<input type="number" id="diag-frete" class="form-input" value="'+(d.frete||0)+'" min="0" step="0.01" oninput="atualizarTotalDiag()"></div>'+
    '<div style="grid-column:1/-1;"><div style="font-size:11px;color:var(--text3);margin-bottom:4px;font-weight:700;">➕ SERVIÇOS / PEÇAS COBRADOS</div>'+
    '<div id="avulso-list"></div>'+
    '<button type="button" onclick="addAvulsoLinha()" style="width:100%;padding:8px;background:rgba(0,229,255,.08);border:1px dashed rgba(0,229,255,.4);border-radius:8px;color:var(--cyan);font-family:\'Rajdhani\',sans-serif;font-size:12px;font-weight:700;cursor:pointer;margin-top:4px;">+ Adicionar linha manual</button>'+
    '</div>'+
    '</div>';
  var botoesHtml='<div style="display:flex;gap:8px;margin-top:8px;margin-bottom:20px;">'+
    '<button type="button" class="btn btn-cyan" style="flex:1;justify-content:center;" onclick="salvarDiagnostico()">SALVAR</button>'+
    '<button type="button" class="btn btn-wa" style="flex:1;justify-content:center;" onclick="salvarDiagnosticoEEnviar()">SALVAR E ENVIAR</button></div>';
  el.innerHTML=aberHtml+descHtml+itensHtml+descontoHtml+
    '<div class="diag-total-box" id="diag-total-box"></div>'+
    '<div class="section-title">Calculadora de Parcelas</div><div class="calc-box" id="diag-calc-box"></div>'+
    botoesHtml;
  el.dataset.abertura=d.abertura||200;
  // Inicializar lista de itens avulsos (vinda do diagnóstico salvo ou da IA)
  window._avulsoItens=[];
  if(d.itens&&d.itens.length){
    d.itens.forEach(function(it){window._avulsoItens.push({nome:it.nome,preco:Number(it.preco)||0});});
  } else if(d.avulso>0){
    window._avulsoItens.push({nome:d.avulsoDesc||'Cobrança avulsa',preco:Number(d.avulso)||0});
  }
  renderAvulsoList();
  atualizarTotalDiag();
}

function selAbertura(val,btn){
  document.querySelectorAll('.abertura-btn').forEach(function(b){b.classList.remove('sel');});
  if(btn.dataset.aber==='nenhum'){
    // Não marca nenhum, apenas avisa
    document.getElementById('diag-content').dataset.abertura=0;
    atualizarTotalDiag();
    showToast('⚠️ Diagnóstico sem cobrança de abertura.');
    return;
  }
  btn.classList.add('sel');
  document.getElementById('diag-content').dataset.abertura=val;
  atualizarTotalDiag();
}

function atualizarTotalDiag(){
  var el=document.getElementById('diag-content');if(!el)return;
  var abertura=parseFloat(el.dataset.abertura||200);
  var subtotal=abertura;
  // Somar itens da lista avulsa (IA + manuais)
  if(!window._avulsoItens)window._avulsoItens=[];
  var avulsoTotal=0;
  window._avulsoItens.forEach(function(it){avulsoTotal+=Number(it.preco)||0;});
  subtotal+=avulsoTotal;
  var desconto=parseFloat((document.getElementById('diag-desconto')||{}).value)||0;
  var frete=parseFloat((document.getElementById('diag-frete')||{}).value)||0;
  var total=Math.max(0,subtotal-desconto+frete);
  el.dataset.total=total;el.dataset.avista=total;el.dataset.desconto=desconto;el.dataset.frete=frete;
  var box=document.getElementById('diag-total-box');
  if(box){
    var itensLinhas='';
    window._avulsoItens.forEach(function(it){
      if(it.nome||it.preco)itensLinhas+='<div class="diag-total-linha"><span>'+esc(it.nome||'Item')+'</span><span>'+fmtVal(Number(it.preco)||0)+'</span></div>';
    });
    box.innerHTML='<div class="diag-total-linha"><span>Abertura/Diagnóstico</span><span>'+fmtVal(abertura)+'</span></div>'+
      itensLinhas+
      (desconto>0?'<div class="diag-total-linha desconto"><span>Desconto</span><span>-'+fmtVal(desconto)+'</span></div>':'')+
      (frete>0?'<div class="diag-total-linha"><span>🚚 Frete</span><span>'+fmtVal(frete)+'</span></div>':'')+
      '<div class="diag-total-linha total"><span>TOTAL</span><span>'+fmtVal(total)+'</span></div>'+
      '<div class="diag-total-linha avista"><span>💰 À vista (PIX)</span><span>'+fmtVal(total)+'</span></div>'+
      '<div class="diag-total-linha"><span style="color:var(--text3)">💳 Cartão</span><span style="color:var(--text3)">sob consulta (até 8x)</span></div>';
  }
  var calc=document.getElementById('diag-calc-box');
  if(calc&&total>0){
    var vD=total*(1+TAXAS.debito);var vCV=total*(1+TAXAS.c1);
    var tx=TAXAS['c'+parcelaSel]||TAXAS.c2;var vC=total*(1+tx);var vP=vC/parcelaSel;
    var btns=[2,3,4,5,6,7,8].map(function(n){return'<button type="button" class="parcela-btn'+(n===parcelaSel?' sel':'')+'" onclick="selParcela('+n+')">'+n+'x</button>';}).join('');
    calc.innerHTML='<div class="calc-title">CALCULADORA INTERNA — não vai na mensagem</div>'+
      '<div class="calc-row"><span class="calc-label">💳 Débito</span><span class="calc-val">'+fmtVal(vD)+'</span></div>'+
      '<div class="calc-row"><span class="calc-label">💳 Crédito à vista</span><span class="calc-val">'+fmtVal(vCV)+'</span></div>'+
      '<div style="margin:8px 0 4px;font-size:12px;color:var(--text2);font-weight:700;">💳 Crédito parcelado:</div>'+
      '<div class="parcela-btns">'+btns+'</div>'+
      '<div class="calc-row"><span class="calc-label">'+parcelaSel+'x</span><span class="calc-val">'+fmtVal(vC)+' ('+parcelaSel+'x de '+fmtVal(vP)+')</span></div>'
  calc.innerHTML+='<div style="font-size:12px;font-weight:700;color:#ff4444;margin-top:10px;padding:7px 10px;background:rgba(255,68,68,.1);border-radius:8px;border-left:3px solid #ff4444;">⚠️ Cobre do cliente o valor acima — ele já inclui a taxa do cartão</div>';
  calc.innerHTML+=renderDivisaoCartoes(total);
  } else if(calc)calc.innerHTML='<div style="font-size:12px;color:var(--text3);text-align:center;padding:8px;">Adicione itens para ver os valores</div>';
}

function selParcela(n){parcelaSel=n;atualizarTotalDiag();}

function salvarDiagnostico(){
  var r=DB.robos.find(function(x){return x.id===diagRoboId;});if(!r)return;
  var el=document.getElementById('diag-content');
  var abertura=parseFloat(el.dataset.abertura||200);
  var desconto=parseFloat(document.getElementById('diag-desconto').value)||0;
  var frete=parseFloat(document.getElementById('diag-frete').value)||0;
  var descricao=document.getElementById('diag-descricao').value.trim();
  // Itens vêm da lista avulsa (IA + manuais), ignorando linhas vazias
  if(!window._avulsoItens)window._avulsoItens=[];
  var itens=window._avulsoItens.filter(function(it){return (it.nome&&it.nome.trim())||Number(it.preco)>0;}).map(function(it){return{catalogoId:null,nome:it.nome||'Item',preco:Number(it.preco)||0};});
  var somaItens=itens.reduce(function(a,it){return a+it.preco;},0);
  var total=Math.max(0,abertura+somaItens-desconto+frete);
  r.diagnostico={data:todayISO(),abertura:abertura,itens:itens,desconto:desconto,frete:frete,avulso:0,avulsoDesc:'',total:total,avista:total,descricao:descricao};
  if(!r.historicoDiagnosticos)r.historicoDiagnosticos=[];
  var snap=JSON.parse(JSON.stringify(r.diagnostico)); snap.salvoEm=new Date().toISOString();
  var ultimo=r.historicoDiagnosticos[r.historicoDiagnosticos.length-1];
  if(!ultimo||JSON.stringify(Object.assign({},ultimo,{salvoEm:undefined}))!==JSON.stringify(Object.assign({},snap,{salvoEm:undefined})))r.historicoDiagnosticos.push(snap);
  r.diagnosticoSalvo=true;
  saveDB();showToast('💊 Diagnóstico salvo!');renderBadges();renderDiagContent(r);renderAll();
  if(currentTab==='diagnostico')renderDiagnosticoLista();
}

function salvarDiagnosticoEEnviar(){
  salvarDiagnostico();
  var r=DB.robos.find(function(x){return x.id===diagRoboId;});if(!r)return;
  fecharDiagnostico();
  setTimeout(function(){
    waTipoAtual='diagnostico';
    abrirWhatsApp(r.id);
  },300);
}

function diagnosticoSemCodigo(id){
  var r=DB.robos.find(function(x){return x.id===id;});if(!r)return;
  r.snDecisaoDiagnostico='sem_codigo';
  saveDB();closeModal();abrirDiagnostico(id);
}
