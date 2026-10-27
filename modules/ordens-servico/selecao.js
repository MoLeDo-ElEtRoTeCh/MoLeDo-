function abrirSeletorOS(){
  var cId=fichaClienteId;
  var c=DB.clientes.find(function(x){return x.id===cId;});if(!c){showToast('Abra um cliente primeiro.');return;}
  var robos=DB.robos.filter(function(r){return r.clienteId===cId;});
  var lixeira=(DB.lixeira||[]).filter(function(x){return x.robo&&x.robo.clienteId===cId;});
  var todos=robos.concat(lixeira.map(function(x){return Object.assign({},x.robo,{_lixId:x.id,_cancelado:true});}));
  if(!todos.length){showToast('Nenhum robô encontrado.');return;}
  var html='<div class="modal-title">📋 Gerar OS — '+esc(c.nome)+'</div>';
  html+='<div style="font-size:12px;color:var(--text2);margin-bottom:12px;">Selecione o(s) robô(s) para gerar a OS:</div>';
  html+='<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">';
  todos.forEach(function(r){
    var num='#'+String(r.numVisual).padStart(3,'0');
    var cf=r.nomeClienteFinal?' <span style="color:#00c896;font-size:10px;">👤 '+esc(r.nomeClienteFinal)+'</span>':'';
    var status=r._cancelado?'❌':r.status==='garantia'?'🛡️':'🔧';
    var temDiag=!!r.diagnostico;
    var pagoOS=(r.pago===true||r.servicoProntoPago===true);
    var entregueOS=(r.entregue===true||!!r.dataEntrega);
    var pagamentoBadge=pagoOS
      ?'<span style="display:inline-block;padding:2px 7px;border-radius:999px;background:rgba(0,230,118,.11);border:1px solid rgba(0,230,118,.35);color:#00e676;font-size:10px;font-weight:900;">💰 PAGO</span>'
      :'<span style="display:inline-block;padding:2px 7px;border-radius:999px;background:rgba(255,23,68,.10);border:1px solid rgba(255,23,68,.30);color:#ff5252;font-size:10px;font-weight:900;">💰 NÃO PAGO</span>';
    var entregaBadge=entregueOS
      ?'<span style="display:inline-block;padding:2px 7px;border-radius:999px;background:rgba(0,229,255,.09);border:1px solid rgba(0,229,255,.30);color:#00e5ff;font-size:10px;font-weight:900;">📦 ENTREGUE</span>'
      :'<span style="display:inline-block;padding:2px 7px;border-radius:999px;background:rgba(255,109,0,.10);border:1px solid rgba(255,109,0,.30);color:#ff8a3d;font-size:10px;font-weight:900;">📦 NÃO ENTREGUE</span>';
    html+='<div style="display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px;">'+
      '<input type="checkbox" id="os-chk-'+r.id+'" '+(temDiag?'checked':'')+' style="width:18px;height:18px;cursor:pointer;">'+
      '<label for="os-chk-'+r.id+'" style="flex:1;cursor:pointer;min-width:0;">'+
        '<div style="font-size:14px;font-weight:700;color:var(--cyan);">'+status+' '+num+'</div>'+
        '<div style="font-size:12px;color:var(--text);">'+esc(r.modelo||'—')+cf+'</div>'+
        (temDiag?'<div style="font-size:11px;color:var(--green);">'+fmtVal(r.diagnostico.total||0)+(r.diagnostico.desconto>0?' <span style="color:#ff6b6b;">(desc. -'+fmtVal(r.diagnostico.desconto)+')</span>':'')+'</div>':
        '<div style="font-size:11px;color:var(--text3);">Sem diagnóstico</div>')+
        '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;">'+pagamentoBadge+entregaBadge+'</div>'+
      '</label>'+
    '</div>';
  });
  html+='</div>';
  window._osSeletorCId=cId;
  html+='<div class="modal-actions">'+
    '<button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn" onclick="gerarOSSelecionados(window._osSeletorCId)" style="background:rgba(0,229,255,.15);border:1px solid rgba(0,229,255,.4);color:var(--cyan);border-radius:8px;padding:10px 16px;font-size:14px;font-weight:700;cursor:pointer;">🖨️ Imprimir</button>'+
    '<button class="btn btn-primary" onclick="gerarOSSelecionadosWA(window._osSeletorCId)">📱 WhatsApp</button>'+
  '</div>';
  openModal(html);
}

function abrirSelecaoOS(roboIdAtual){
  var r=DB.robos.find(function(x){return x.id===roboIdAtual;});if(!r)return;
  var ativos=DB.robos.filter(function(x){return x.clienteId===r.clienteId&&x.status==='reparo';});
  var cancelados=(DB.lixeira||[]).filter(function(x){return x.robo&&x.robo.clienteId===r.clienteId&&x.motivo==='cancelamento';}).map(function(x){return Object.assign({},x.robo,{_cancelado:true});});
  var todosRobos=ativos.concat(cancelados);
  if(todosRobos.length<=1){closeModal();gerarOS(roboIdAtual);return;}
  _osSel={};
  todosRobos.forEach(function(rob){_osSel[rob.id]=true;});
  var itensHtml=todosRobos.map(function(rob){
    var num='#'+String(rob.numVisual).padStart(3,'0');
    var esteAtual=rob.id===roboIdAtual;
    var tem=!!rob.diagnostico;
    var cancelado=!!rob._cancelado;
    var cor=cancelado?'#ff4444':(esteAtual?'var(--cyan)':'var(--text)');
    return'<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">'+
      '<input type="checkbox" id="os-chk-'+rob.id+'" checked onchange="_osSel[\''+rob.id+'\']=this.checked" style="width:16px;height:16px;cursor:pointer;">'+
      '<div style="flex:1;">'+
        '<div style="font-size:13px;font-weight:700;color:'+cor+';">'+num+' · '+esc(rob.modelo||'—')+(esteAtual?' <span style="font-size:10px;color:var(--cyan);">(este)</span>':'')+(cancelado?' <span style="font-size:10px;background:rgba(255,0,0,.15);color:#ff4444;padding:1px 5px;border-radius:4px;">CANCELADO</span>':'')+'</div>'+
        '<div style="font-size:11px;color:var(--text3);">'+(tem?'💊 '+fmtVal(rob.diagnostico.total):'Sem diagnóstico')+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
  openModal(
    '<div class="modal-title">🖨️ Gerar OS</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:12px;">Selecione os robôs para incluir:</div>'+
    '<div style="margin-bottom:14px;">'+itensHtml+'</div>'+
    '<div class="modal-actions">'+
    '<button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-cyan" onclick="gerarOSSelecionadas(\''+roboIdAtual+'\')">🖨️ Gerar OS</button>'+
    '</div>'
  );
}

function gerarOSSelecionadas(roboIdAtual){
  var r=DB.robos.find(function(x){return x.id===roboIdAtual;});if(!r)return;
  var ativos=DB.robos.filter(function(x){return x.clienteId===r.clienteId&&_osSel[x.id];});
  var cancelados=(DB.lixeira||[]).filter(function(x){return x.robo&&x.robo.clienteId===r.clienteId&&x.motivo==='cancelamento'&&_osSel[x.robo.id];}).map(function(x){return Object.assign({},x.robo,{_cancelado:true});});
  var selecionados=ativos.concat(cancelados);
  if(!selecionados.length){showToast('Selecione ao menos 1 robô.');return;}
  closeModal();
  if(selecionados.length===1){gerarOS(selecionados[0].id);return;}
  gerarOSMultipla(selecionados);
}
