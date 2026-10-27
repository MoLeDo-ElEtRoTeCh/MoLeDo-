function iconeStatusFinanceiro(r){
  if(r._cancelado)return r.pago?'<span title="Cancelado pago">✅❌</span>':'<span title="Cancelado s/pagar">⏳❌</span>';
  if(r.status==='garantia'){
    if(r.entregue&&r.pago)return'<span title="Entregue e pago">✅💰</span>';
    if(r.entregue&&!r.pago)return'<span title="Entregue s/pagar">📦⏳</span>';
    if(!r.entregue&&r.pago)return'<span title="Pago, busca depois">💰📦</span>';
    return'<span title="Nem entregue nem pago">⏳📦</span>';
  }
  return'<span title="Em reparo">🔧</span>';
}

function linhaRoboFinanceiro(r,cor){
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var num='#'+String(r.numVisual).padStart(3,'0');
  var dias=diasDesde(r.dataEntrada);
  var val=r._cancelado?(r.diagnostico?r.diagnostico.abertura||200:0):(r.diagnostico?r.diagnostico.total||0:0);
  var clickable=!r._cancelado&&r.status==='garantia';
  return'<div style="padding:6px 0;border-bottom:1px solid var(--border);">'+
    '<div onclick="'+(clickable?'mostrarBotoesEntregaFinanceiro(\''+r.id+'\')':'')+'" style="display:flex;align-items:center;justify-content:space-between;'+(clickable?'cursor:pointer;':'')+'">'+
      '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;">'+
        iconeStatusFinanceiro(r)+
        '<div style="flex:1;min-width:0;">'+
          '<div style="font-size:12px;font-weight:700;color:'+(cor||'var(--text)')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(c?esc(c.nome):'—')+' · '+num+(clickable?' <span style="font-size:9px;color:var(--cyan);">▼</span>':'')+'</div>'+
          '<div style="font-size:10px;color:var(--text3);">'+esc(r.modelo||'—')+' · '+dias+'d'+(r._cancelado?' · CANCELADO':'')+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="font-size:13px;font-weight:900;color:'+(cor||'#00e676')+';margin-left:8px;flex-shrink:0;">'+fmtVal(val)+'</div>'+
    '</div>'+
    (clickable?'<div id="btns-fin-wrap-'+r.id+'" style="display:none;"></div>':'')+
  '</div>';
}

function abrirResumoFinanceiro(mesSel){
  // Lógica de mês: por padrão mostra mês atual
  var hoje=new Date();
  var mesAtual=hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0');
  var mes=mesSel||mesAtual;
  var [anoSel,mesSel2]=[parseInt(mes.split('-')[0]),parseInt(mes.split('-')[1])];

  // Função para saber se um robô pertence ao mês selecionado
  // Um robô "pertence" ao mês se: foi pago naquele mês, OU ainda não foi pago (aparece no mês atual)
  function mesDeData(dStr){
    if(!dStr)return null;
    var d=new Date(String(dStr).length<=10?dStr+'T00:00:00':dStr);
    if(isNaN(d))return null;
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  }
  function pertenceMes(r){
    if(!r.pago){
      // Não pago: aparece sempre no mês atual (até ser pago)
      return mes===mesAtual;
    }
    // Pago: usa dataPagamento, senão dataEntrega, senão dataEntrada
    var mesRobo=mesDeData(r.dataPagamento)||mesDeData(r.dataEntrega)||mesDeData(r.dataEntrada);
    return mesRobo===mes;
  }
  function pertenceMesCancelado(r){
    if(r.pago&&r.dataPagamento){
      var dp=new Date(r.dataPagamento);
      var m=dp.getFullYear()+'-'+String(dp.getMonth()+1).padStart(2,'0');
      return m===mes;
    }
    return mes===mesAtual&&!r.pago;
  }

  var todosRobos=DB.robos;
  var garantia=todosRobos.filter(function(r){return r.status==='garantia'&&r.diagnostico&&r.diagnostico.total>0&&pertenceMes(r);});
  var reparo=todosRobos.filter(function(r){return r.status==='reparo'&&r.diagnostico&&r.diagnostico.total>0&&!r.aguardandoPeca&&pertenceMes(r);});
  var agPecaFin=todosRobos.filter(function(r){return r.status==='reparo'&&r.diagnostico&&r.diagnostico.total>0&&r.aguardandoPeca&&pertenceMes(r);});
  var cancelados=(DB.lixeira||[]).filter(function(x){return x.robo&&x.robo.diagnostico&&x.motivo==='cancelamento'&&pertenceMesCancelado(Object.assign({},x.robo,{_cancelado:true}));}).map(function(x){return Object.assign({},x.robo,{_cancelado:true});});

  // Totais
  var jaEntrou=garantia.filter(function(r){return r.pago;}).reduce(function(a,r){return a+(r.diagnostico.total||0);},0)
    +cancelados.filter(function(r){return r.pago;}).reduce(function(a,r){return a+(r.diagnostico?r.diagnostico.abertura||200:0);},0);
  var aReceber=garantia.filter(function(r){return !r.pago;}).reduce(function(a,r){return a+(r.diagnostico.total||0);},0)
    +reparo.reduce(function(a,r){return a+(r.diagnostico.total||0);},0)
    +agPecaFin.reduce(function(a,r){return a+(r.diagnostico.total||0);},0)
    +cancelados.filter(function(r){return !r.pago;}).reduce(function(a,r){return a+(r.diagnostico?r.diagnostico.abertura||200:0);},0);
  var totalGeral=jaEntrou+aReceber;

  // Selector de mês — gerar últimos 12 meses
  var meses=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var mesesOpts='';
  for(var i=11;i>=0;i--){
    var d=new Date(hoje.getFullYear(),hoje.getMonth()-i,1);
    var mv=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    var ml=meses[d.getMonth()]+' '+d.getFullYear();
    mesesOpts+='<option value="'+mv+'"'+(mv===mes?' selected':'')+'>'+ml+'</option>';
  }
  var mesLabel=meses[mesSel2-1]+' '+anoSel;

  function iconeStatus(r){return iconeStatusFinanceiro(r);}
  function linhaRobo(r,cor){return linhaRoboFinanceiro(r,cor);}

  var msgEsposa='💵 *Resumo Financeiro MoLeDo — '+mesLabel+'*\n\n';
  msgEsposa+='💰 *Já entrou:* '+fmtVal(jaEntrou)+'\n';
  msgEsposa+='⏳ *A receber:* '+fmtVal(aReceber)+'\n';
  msgEsposa+='📊 *Total geral:* '+fmtVal(totalGeral);

  var html='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'+
    '<div class="modal-title" style="margin:0;">💵 Resumo Financeiro</div>'+
    '<select onchange="closeModal();abrirResumoFinanceiro(this.value)" style="background:rgba(0,229,255,.1);border:1px solid rgba(0,229,255,.3);color:var(--cyan);border-radius:8px;padding:5px 8px;font-family:\'Rajdhani\',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">'+
    mesesOpts+
    '</select>'+
    '</div>'+
    '<div style="text-align:center;font-size:12px;color:var(--cyan);font-weight:700;margin-bottom:10px;">📅 '+mesLabel+'</div>'+
    // Dois totais
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">'+
      '<div style="background:rgba(0,230,118,.08);border:1px solid rgba(0,230,118,.3);border-radius:10px;padding:10px;text-align:center;">'+
        '<div style="font-size:10px;color:var(--text3);margin-bottom:2px;">💰 JÁ ENTROU</div>'+
        '<div style="font-size:20px;font-weight:900;color:#00e676;">'+fmtVal(jaEntrou)+'</div>'+
      '</div>'+
      '<div style="background:rgba(255,109,0,.08);border:1px solid rgba(255,109,0,.3);border-radius:10px;padding:10px;text-align:center;">'+
        '<div style="font-size:10px;color:var(--text3);margin-bottom:2px;">⏳ A RECEBER</div>'+
        '<div style="font-size:20px;font-weight:900;color:#ff6d00;">'+fmtVal(aReceber)+'</div>'+
      '</div>'+
    '</div>'+
    '<div style="text-align:center;font-size:11px;color:var(--text3);margin-bottom:12px;">TOTAL GERAL: <strong style="color:var(--text);">'+fmtVal(totalGeral)+'</strong></div>'+
    // Legenda
    '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;font-size:10px;color:var(--text3);">'+
      '<span>✅💰 Pago+entregue</span><span>📦⏳ Entregue s/pagar</span><span>🔧 Em reparo</span><span>✅❌ Cancelado pago</span><span>⏳❌ Cancelado s/pagar</span>'+
    '</div>'+
    (garantia.length?'<div style="font-size:11px;font-weight:700;color:#ce93d8;letter-spacing:1px;margin:8px 0 4px;">🛡️ GARANTIA ('+garantia.length+')</div>'+garantia.map(function(r){return linhaRobo(r,'#ce93d8');}).join(''):'')+
    (agPecaFin.length?'<div style="font-size:11px;font-weight:700;color:#c77dff;letter-spacing:1px;margin:8px 0 4px;">📦 AGUARDANDO PEÇA ('+agPecaFin.length+')</div>'+agPecaFin.map(function(r){return linhaRobo(r,'#c77dff');}).join(''):'')+
    (reparo.length?'<div style="font-size:11px;font-weight:700;color:var(--cyan);letter-spacing:1px;margin:8px 0 4px;">🔧 EM REPARO ('+reparo.length+')</div>'+reparo.map(function(r){return linhaRobo(r,'#00e5ff');}).join(''):'')+
    (cancelados.length?'<div style="font-size:11px;font-weight:700;color:#ff4444;letter-spacing:1px;margin:8px 0 4px;">❌ CANCELADOS ('+cancelados.length+')</div>'+cancelados.map(function(r){return linhaRobo(r,'#ff6666');}).join(''):'')+
    '<div class="modal-actions" style="flex-direction:column;gap:8px;">'+
    '<button class="btn btn-wa" style="width:100%;justify-content:center;" onclick="window.open(\'https://wa.me/5544999622045?text='+encodeURIComponent(msgEsposa)+'\',\'_blank\')">📱 Enviar para esposa</button>'+
    '<button class="btn" onclick="gerarPDFResumo()" style="width:100%;justify-content:center;background:rgba(0,229,255,.15);border:1px solid rgba(0,229,255,.4);color:var(--cyan);border-radius:8px;padding:10px;font-family:\'Rajdhani\',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">📄 Gerar PDF/Imprimir</button>'+
    '<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="closeModal()">Fechar</button>'+
    '</div>';
  openModal(html);
}
