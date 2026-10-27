function gerarPixPayload(chave,valor,nome,cidade){return _PIX_PAYLOAD;}

function gerarPixQrUrl(valor){
  return'https://moledo-eletrotech.github.io/MoLeDo-/pixqr.jpg';
}

function abrirCobrancaPix(){
  if(!fichaClienteId)return;
  var c=DB.clientes.find(function(x){return x.id===fichaClienteId;});if(!c)return;
  var ativos=DB.robos.filter(function(r){return r.clienteId===fichaClienteId&&r.diagnostico;});
  var cancelados=(DB.lixeira||[]).filter(function(x){return x.robo&&x.robo.clienteId===fichaClienteId&&x.motivo==='cancelamento'&&x.robo.diagnostico;}).map(function(x){return Object.assign({},x.robo,{_cancelado:true});});
  var robos=ativos.concat(cancelados);
  if(!robos.length){showToast('Nenhum robô com diagnóstico para cobrar.');return;}
  if(!window._pixAberto){_pixSel={};robos.forEach(function(r){_pixSel[r.id]=true;});}
  window._pixAberto=true;
  renderCobrancaPix(c,robos);
}

function togglePixSel(roboId){
  _pixSel[roboId]=!_pixSel[roboId];
  if(!fichaClienteId)return;
  var c=DB.clientes.find(function(x){return x.id===fichaClienteId;});if(!c)return;
  var ativos=DB.robos.filter(function(r){return r.clienteId===fichaClienteId&&r.diagnostico;});
  var cancelados=(DB.lixeira||[]).filter(function(x){return x.robo&&x.robo.clienteId===fichaClienteId&&x.motivo==='cancelamento'&&x.robo.diagnostico;}).map(function(x){return Object.assign({},x.robo,{_cancelado:true});});
  renderCobrancaPix(c,ativos.concat(cancelados));
}

function renderCobrancaPix(c,robos){
  var total=robos.reduce(function(a,r){return _pixSel[r.id]?a+getValorCobravel(r):a;},0);
  var itensHtml=robos.map(function(r){
    var num='#'+String(r.numVisual).padStart(3,'0');
    var sel=_pixSel[r.id]===true;
    var cancelado=!!r._cancelado;
    var val=getValorCobravel(r);
    return'<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);">'+
      '<input type="checkbox" id="pix-chk-'+r.id+'"'+(sel?' checked':'')+' onchange="togglePixSel(\''+r.id+'\')" style="width:16px;height:16px;cursor:pointer;">'+
      '<div style="flex:1;">'+
        '<div style="font-size:13px;font-weight:700;color:'+(cancelado?'#ff4444':'var(--text)')+';">'+num+' · '+esc(descricaoEquipamento(r)||'—')+(cancelado?' <span style="font-size:10px;background:rgba(255,0,0,.12);color:#ff4444;padding:1px 5px;border-radius:4px;">CANCELADO</span>':'')+'</div>'+
        (cancelado?'<div style="font-size:10px;color:#ff9999;">Cobra só diagnóstico/abertura</div>':'')+
      '</div>'+
      '<div style="font-size:13px;font-weight:900;color:'+(cancelado?'#ff6666':'#00e676')+';">'+fmtVal(val)+'</div>'+
    '</div>';
  }).join('');
  var wa=(c.whatsapp||'').replace(/\D/g,'');
  if(wa.length===11)wa='55'+wa;
  var msgWA='Olá, *'+esc(c.nome)+'*! 😊\n\n'+
    textoListaEquipamentos('Segue o valor referente ao serviço do seu robô:\n\n',robos)+
    '💵 *Total: '+fmtVal(total)+'*\n\n'+
    'A chave PIX está logo abaixo! 😊\n\n'+
    '_MoLeDo ElEtRoTeCh_';
  openModal(
    '<div class="modal-title">💠 Cobrança PIX</div>'+
    '<div style="font-size:13px;color:var(--cyan);font-weight:700;margin-bottom:12px;">'+esc(c.nome)+'</div>'+
    '<div style="margin-bottom:12px;">'+itensHtml+'</div>'+
    (total>0?
      '<div style="background:rgba(0,230,118,.08);border:1px solid rgba(0,230,118,.25);border-radius:10px;padding:12px;text-align:center;margin-bottom:12px;">'+
        '<div style="font-size:11px;color:var(--text3);margin-bottom:4px;">TOTAL A COBRAR</div>'+
        '<div style="font-size:24px;font-weight:900;color:#00e676;margin-bottom:10px;">'+fmtVal(total)+'</div>'+
        '<div style="background:rgba(0,230,118,.08);border:1px solid rgba(0,230,118,.3);border-radius:8px;padding:10px;margin:8px 0;">'+
        '<div style="font-size:10px;color:var(--text3);margin-bottom:4px;font-weight:700;">CHAVE PIX</div>'+
        '<div style="font-size:13px;font-weight:700;color:#00e676;word-break:break-all;">moledoeletrotech@gmail.com</div>'+
        '<button onclick="navigator.clipboard.writeText(\'moledoeletrotech@gmail.com\').then(function(){showToast(\'✅ Chave copiada!\');});closeModal();" style="width:100%;margin-top:8px;padding:8px;background:rgba(0,230,118,.2);border:1px solid rgba(0,230,118,.4);border-radius:6px;color:#00e676;font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">📋 Copiar chave PIX</button>'+
        '</div>'+
        '<div style="font-size:11px;color:var(--text3);">💠 moledoeletrotech@gmail.com</div>'+
      '</div>':
      '<div style="text-align:center;color:var(--text3);padding:20px;">Selecione ao menos 1 robô</div>')+
    '<div class="modal-actions" style="flex-direction:column;gap:8px;">'+
    (total>0&&wa?'<button class="btn btn-wa" style="width:100%;justify-content:center;" onclick="window._pixAberto=false;closeModal();window.open(\'https://wa.me/'+wa+'?text='+encodeURIComponent(msgWA)+'\',\'_blank\')">📱 Enviar pelo WhatsApp</button>':'')+ 
    '<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="window._pixAberto=false;closeModal()">Fechar</button>'+
    '</div>'
  );
}
