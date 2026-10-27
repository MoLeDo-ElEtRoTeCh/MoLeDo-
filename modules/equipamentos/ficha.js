function openFichaRobo(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var dias=r.status==='reparo'?diasDesde(r.dataEntrada):0;
  var si=r.status==='reparo'?getStatusInfo(dias):null;
  var num='#'+String(r.numVisual).padStart(3,'0');
  var cc=r.status==='garantia'?'purple-card':(si?si.cardCls:'');
  var restGar=0;
  if(r.status==='garantia'){var h=new Date();h.setHours(0,0,0,0);var ate=new Date(r.garantiaAte+'T00:00:00');restGar=Math.max(0,Math.floor((ate-h)/86400000));}
  var msgs=r.mensagens||[];
  var histHtml=msgs.length?'<div class="divider"></div><div class="days-label" style="margin:8px 0 5px;">Histórico</div>'+msgs.slice().reverse().map(function(m){return'<div class="wa-last" style="margin-bottom:4px;">'+fmtData(m.data)+' — '+(WA_LABELS[m.tipo]||m.tipo)+'</div>';}).join(''):'';
  var diagHtml='';
  if(r.diagnostico){
    var dg=r.diagnostico;
    if(r.status==='garantia'){
      var itensDiag='';
      if(dg.abertura>0){
        itensDiag+='<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);"><span>Abertura/Diagnóstico</span><strong>'+fmtVal(dg.abertura)+'</strong></div>';
      }
      if(dg.itens&&dg.itens.length){
        dg.itens.forEach(function(it){
          itensDiag+='<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);"><span>'+esc(it.nome||'Item')+'</span><strong>'+fmtVal(it.preco||0)+'</strong></div>';
        });
      }
      if(dg.avulso>0){
        itensDiag+='<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);"><span>Serviço avulso</span><strong>'+fmtVal(dg.avulso)+'</strong></div>';
      }
      if(dg.frete>0){
        itensDiag+='<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);"><span>Frete</span><strong>'+fmtVal(dg.frete)+'</strong></div>';
      }
      if(dg.desconto>0){
        itensDiag+='<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);color:#ffb74d;"><span>Desconto</span><strong>- '+fmtVal(dg.desconto)+'</strong></div>';
      }
      diagHtml='<div class="divider"></div>'+
        '<div style="margin:9px 0 5px;font-size:12px;font-weight:900;color:#ffd600;letter-spacing:.7px;">💊 DIAGNÓSTICO QUE ORIGINOU ESTA GARANTIA</div>'+
        '<div style="background:rgba(255,214,0,.045);border:1px solid rgba(255,214,0,.22);border-radius:9px;padding:10px 11px;">'+
          '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px;">'+
            '<span style="font-size:11px;color:var(--text3);">Data: <strong style="color:var(--text2);">'+fmtData(dg.data)+'</strong></span>'+
            '<span style="font-size:12px;color:#ffd600;font-weight:900;">Total: '+fmtVal(dg.total||0)+'</span>'+
          '</div>'+
          (dg.descricao?'<div style="margin-bottom:8px;"><div style="font-size:10px;font-weight:800;color:var(--cyan3);letter-spacing:.5px;margin-bottom:2px;">DIAGNÓSTICO</div><div style="font-size:12px;color:var(--text2);line-height:1.45;">'+esc(dg.descricao)+'</div></div>':'')+
          (dg.acaoNecessaria?'<div style="margin-bottom:8px;"><div style="font-size:10px;font-weight:800;color:var(--cyan3);letter-spacing:.5px;margin-bottom:2px;">AÇÃO NECESSÁRIA / SERVIÇO REALIZADO</div><div style="font-size:12px;color:var(--text2);line-height:1.45;">'+esc(dg.acaoNecessaria)+'</div></div>':'')+
          (dg.observacao?'<div style="margin-bottom:8px;"><div style="font-size:10px;font-weight:800;color:var(--cyan3);letter-spacing:.5px;margin-bottom:2px;">OBSERVAÇÃO</div><div style="font-size:12px;color:var(--text2);line-height:1.45;">'+esc(dg.observacao)+'</div></div>':'')+
          (itensDiag?'<div style="margin-top:7px;"><div style="font-size:10px;font-weight:800;color:var(--cyan3);letter-spacing:.5px;margin-bottom:3px;">SERVIÇOS / PEÇAS</div><div style="font-size:11px;color:var(--text2);">'+itensDiag+'</div></div>':'')+
        '</div>';
    }else{
      diagHtml='<div class="divider"></div><div class="days-label" style="margin:8px 0 5px;">Diagnóstico</div><div class="diag-badge">💊 Total: '+fmtVal(dg.total)+' · '+fmtData(dg.data)+'</div>';
    }
  }
  // MELHORIA 3: timeline na ficha técnica
  // Determina etapa atual
  var etapaAtual = r.status==='garantia'?3:(r.diagnostico?2:(r.bancada?1:0));
  var etapas=[
    {id:'checkin',label:'📥 Check-in',ok:true,data:r.dataEntrada,wa:null},
    {id:'bancada',label:'🔧 Bancada',ok:!!(r.bancada||r.entradaBancada),data:r.bancada&&r.bancada.data?r.bancada.data:null,wa:r.mensagens&&r.mensagens.find(function(m){return m.tipo==='bancada';})},
    {id:'diagnostico',label:'💊 Diagnóstico',ok:!!r.diagnostico,data:r.diagnostico?r.diagnostico.data:null,wa:r.mensagens&&r.mensagens.find(function(m){return m.tipo==='diagnostico';})},
    {id:'entregue',label:'✅ Entregue',ok:r.status==='garantia',data:r.dataEntrega,wa:r.mensagens&&r.mensagens.find(function(m){return m.tipo==='servicoPronto';})}
  ];
  var podVoltar=etapaAtual>0;
  var podAvancar=etapaAtual<3&&etapas[etapaAtual+1]&&etapas[etapaAtual+1].ok;
  var timelineHtml='<div class="divider"></div>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin:6px 0 4px;">'+
      '<div class="days-label">Timeline</div>'+
      '<div style="display:flex;gap:6px;">'+
        (podVoltar?'<button onclick="voltarEtapa(\''+r.id+'\')" style="background:rgba(255,109,0,.15);border:1px solid rgba(255,109,0,.4);color:#ff6d00;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:\'Rajdhani\',sans-serif;">⬅️ Voltar</button>':'')+
        (podAvancar?'<button onclick="avancarEtapa(\''+r.id+'\')" style="background:rgba(0,229,255,.15);border:1px solid rgba(0,229,255,.4);color:var(--cyan);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:\'Rajdhani\',sans-serif;">Avançar ➡️</button>':'')+
      '</div>'+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:0;overflow-x:auto;padding-bottom:4px;">';
  var tlSteps=[
    {ok:true,label:'📥 Check-in',data:r.dataEntrada,atual:etapaAtual===0},
    {ok:!!(r.bancada||r.entradaBancada),label:'🔧 Bancada',data:r.bancada&&r.bancada.data?r.bancada.data:null,atual:etapaAtual===1},
    {ok:!!r.diagnostico,label:'💊 Diagnóstico',data:r.diagnostico?r.diagnostico.data:null,atual:etapaAtual===2}
  ];
  if(r.status==='garantia')tlSteps.push({ok:true,label:'✅ Entregue',data:r.dataEntrega,atual:etapaAtual===3});
  tlSteps.forEach(function(s,i){
    var cor=s.atual?'#ffd600':(s.ok?'var(--cyan)':'var(--text3)');
    var bg=s.atual?'rgba(255,214,0,.15)':(s.ok?'rgba(0,229,255,.12)':'rgba(255,255,255,.04)');
    var bord=s.atual?'rgba(255,214,0,.5)':(s.ok?'rgba(0,229,255,.35)':'var(--border)');
    timelineHtml+='<div style="display:flex;flex-direction:column;align-items:center;min-width:70px;">'+
      '<div style="background:'+bg+';border:1px solid '+bord+';border-radius:6px;padding:4px 6px;font-size:10px;font-weight:700;color:'+cor+';white-space:nowrap;text-align:center;">'+(s.atual?'▶ ':'')+s.label+'</div>'+
      '<div style="font-size:9px;color:var(--text3);margin-top:2px;">'+(s.data?fmtData(s.data):'—')+'</div>'+
    '</div>'+
    (i<tlSteps.length-1?'<div style="flex:1;height:1px;background:'+(s.ok?'rgba(0,229,255,.3)':'var(--border)')+';min-width:6px;margin-bottom:14px;"></div>':'');
  });
  timelineHtml+='</div>';
  // MELHORIA 5: nota rápida
  var notaHtml=r.notaRapida?'<div class="divider"></div><div style="background:rgba(255,214,0,.06);border-left:3px solid rgba(255,214,0,.5);border-radius:0 6px 6px 0;padding:8px 10px;font-size:12px;color:var(--yellow);margin:6px 0;">📝 '+esc(r.notaRapida)+'</div>':'';
  var bancadaHtml='';
  if(r.bancada){
    var b=r.bancada;var itens=b.itens||{};
    var vieramB=CHECKLIST_ITENS.filter(function(i){return itens[i.id]==='veio';});
    var naoVieramB=CHECKLIST_ITENS.filter(function(i){return itens[i.id]==='nao';});
    bancadaHtml='<div class="divider"></div><div class="days-label" style="margin:8px 0 5px;">📦 Itens Recebidos</div>'+
      (vieramB.length?'<div style="font-size:12px;color:#00e676;margin-bottom:4px;">'+vieramB.map(function(i){return'✅ '+i.nome;}).join(' · ')+'</div>':'')+
      (naoVieramB.length?'<div style="font-size:12px;color:#ff1744;margin-bottom:4px;">'+naoVieramB.map(function(i){return'❌ '+i.nome;}).join(' · ')+'</div>':'')+
      (b.outraAssistencia?'<div style="font-size:12px;color:var(--text3);">🔄 Outra assistência: '+(b.outraAssistencia==='sim'?'Sim':'Não')+'</div>':'')+
      (b.selo?'<div style="font-size:12px;color:var(--text3);">🔒 Selo: '+(b.selo==='intacto'?'Intacto ✅':b.selo==='violado'?'Violado ⚠️':'Sem selo ❌')+'</div>':'')+
      (b.obs?'<div style="font-size:12px;color:var(--text2);margin-top:4px;">📝 '+esc(b.obs)+'</div>':'')+
      (r.numOS?'<div style="font-size:12px;color:var(--cyan);font-weight:700;margin-top:4px;">'+r.numOS+'</div>':'');
  }
  var liberaDiag=r.entradaBancada||r.diagnostico||r.bancada;
  openModal('<div class="modal-title">📋 Ficha — '+num+'</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:4px;">'+(c?'👤 '+esc(c.nome)+' · 📱 '+esc(c.whatsapp):'')+
    '</div>'+(c&&c.tipo==='vc'&&r.nomeClienteFinal?'<div style="margin:2px 0 8px;padding:5px 10px;background:rgba(0,200,150,.12);border-left:3px solid #00c896;border-radius:6px;"><span style="font-size:10px;font-weight:700;color:var(--text3);letter-spacing:1px;">CLIENTE FINAL</span><br><span style="font-size:15px;font-weight:900;color:#00c896;">'+esc(r.nomeClienteFinal)+'</span></div>':'')
    +'<div class="card '+cc+'" style="margin:0 0 12px;">'+
    '<div class="robot-num" style="font-size:28px;">'+num+'</div><div class="robot-sn">'+esc(r.sn)+'</div>'+
    '<div class="robot-model" style="font-size:16px;">'+esc(r.modelo)+'</div>'+
    (r.voltagem&&r.voltagem!=='—'?'<div class="robot-volt" style="font-size:13px;margin-top:4px;">⚡ '+esc(r.voltagem)+'</div>':'')+
    (temSnValido(r.sn)?'<div style="font-size:11px;color:#00e676;font-family:\'Share Tech Mono\',monospace;margin-top:4px;">🔐 SN: '+esc(r.sn)+'</div>':'<div style="font-size:11px;color:#ff6d00;margin-top:4px;">⚠️ SN não registrado</div>')+
    '<div style="margin-top:8px;">'+(si?'<span class="status-badge '+si.cls+'">'+si.txt+'</span>':'')+(r.status==='garantia'?'<span class="status-badge status-garantia">🛡️ Em Garantia</span>':'')+'</div>'+
    '<div style="margin:10px 0;"><div class="days-label">Entrada</div><div style="font-family:\'Share Tech Mono\';font-size:14px;">'+fmtData(r.dataEntrada)+'</div>'+
    (r.status==='garantia'?'<div style="margin-top:6px;"><div class="days-label">Garantia até</div><div style="font-family:\'Share Tech Mono\';font-size:13px;color:#ce93d8;">'+fmtData(r.garantiaAte)+' ('+restGar+' dias)</div></div>':'')+
    (r.status==='garantia'?'<div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;">'+
      '<span style="font-size:12px;font-weight:700;color:'+(r.pago?'#00e676':'#ff6d00')+'">'+(r.pago?'💰 Pago':'⏳ Pagamento pendente')+'</span>'+
      '<span style="font-size:12px;font-weight:700;color:'+(r.entregue?'#00e5ff':'#ff6d00')+'">'+(r.entregue?'📦 Entregue':'📦 Não entregue')+'</span>'+
    '</div>':'')+
    '</div>'+
    (r.defeitos&&r.defeitos.length?'<div class="divider"></div><div class="days-label" style="margin:8px 0 5px;">Defeitos</div><div class="robot-defects">'+r.defeitos.map(function(d){return'<span class="defect-chip">'+esc(d)+'</span>';}).join('')+'</div>':'')+
    (r.obs?'<div class="divider"></div><div class="days-label" style="margin:8px 0 3px;">Observação</div><div style="font-size:13px;color:var(--text2);">'+esc(r.obs)+'</div>':'')+
    bancadaHtml+diagHtml+timelineHtml+notaHtml+histHtml+'</div>'+
    // BOTÕES PRINCIPAIS — linha 1: ações de fluxo
    '<div class="modal-actions" style="flex-wrap:wrap;gap:6px;padding-bottom:4px;">'+
    (r.status==='reparo'?'<button class="btn" onclick="closeModal();abrirBancada(\''+r.id+'\')" style="background:rgba(255,109,0,.15);border:1px solid rgba(255,109,0,.4);color:#ff6d00;padding:6px 12px;font-size:12px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-weight:700;cursor:pointer;">🔧 Bancada</button>':'')+
    (temSnValido(r.sn)?'<button class="btn btn-cyan" onclick="mostrarHistoricoSN(\''+r.sn.replace(/'/g,"\\'")+'\',\''+r.id+'\')">🔎 Histórico SN</button>':'')+
    (r.status==='reparo'?'<button class="btn btn-yellow" onclick="closeModal();abrirDiagnostico(\''+r.id+'\')">💊 Diagnóstico</button>':'')+
    (r.status==='reparo'?'<button class="btn" onclick="abrirAguardandoPeca(\''+r.id+'\')" style="background:'+(r.aguardandoPeca?'rgba(255,214,0,.25)':'rgba(255,214,0,.1)')+';border:1px solid rgba(255,214,0,.4);color:#ffd600;padding:6px 12px;font-size:12px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-weight:700;cursor:pointer;">📦 '+(r.aguardandoPeca?'Aguard. Peça ⏳':'Aguardando Peça')+'</button>':'')+
    (r.status==='reparo'&&r.diagnostico&&r.diagnostico.total>=0?'<button class="btn" onclick="confirmarEntrega(\''+r.id+'\')" style="background:'+(r.servicoPronto?'rgba(0,229,255,.25)':'rgba(0,229,255,.15)')+';border:1px solid rgba(0,229,255,.4);color:var(--cyan);padding:6px 12px;font-size:12px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-weight:700;cursor:pointer;">🏁 Serviço Pronto</button>':'')+
    
    (r.status==='reparo'&&r.diagnostico&&r.diagnostico.total>=0?'<button class="btn" onclick="closeModal();abrirAgendamento(\''+r.id+'\')" style="background:rgba(0,230,118,.1);border:1px solid rgba(0,230,118,.3);color:#00e676;padding:6px 12px;font-size:12px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-weight:700;cursor:pointer;">📅 Retirada</button>':'')+

    (r.status==='garantia'&&!r.pago?'<button class="btn btn-green" onclick="marcarRoboPago(\''+r.id+'\')">💰 Marcar Pago</button>':'')+
    (r.status==='garantia'&&!r.entregue?'<button class="btn" onclick="marcarRoboEntregue(\''+r.id+'\')" style="background:rgba(0,229,255,.15);border:1px solid rgba(0,229,255,.4);color:var(--cyan);padding:6px 12px;font-size:12px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-weight:700;cursor:pointer;">📦 Marcar Entregue</button>':'')+
    (r.status==='garantia'?'<button class="btn" onclick="voltarGarantiaParaReparo(\''+r.id+'\')" style="background:rgba(255,109,0,.15);border:1px solid rgba(255,109,0,.4);color:#ff6d00;padding:6px 12px;font-size:12px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-weight:700;cursor:pointer;" title="Use esta opção se o robô voltou e precisa de novo diagnóstico ou reparo">🔄 Voltar Reparo</button>':'')+
    (r.status==='garantia'?'<button class="btn" onclick="republicarFichaPublica(\''+r.id+'\')" style="background:rgba(0,230,118,.1);border:1px solid rgba(0,230,118,.3);color:#00e676;padding:6px 12px;font-size:12px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-weight:700;cursor:pointer;">🔄 Republicar</button>':'')+
    '</div>'+
    // LINHA 2: fechar + hambúrguer
    '<div class="modal-actions" style="gap:6px;padding-top:0;">'+
    '<button class="btn btn-close" onclick="closeModal()" style="flex:1;justify-content:center;">✕ Fechar</button>'+
    '<button class="btn" onclick="abrirMenuRobo(\''+r.id+'\')" style="background:rgba(255,255,255,.08);border:1px solid var(--border);color:var(--text);padding:6px 14px;font-size:16px;border-radius:8px;cursor:pointer;" title="Mais opções">☰</button>'+
    '</div>');
}

function abrirMenuRobo(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var html='<div class="modal-title">☰ Mais Opções</div>'+
    '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">'+
    '<button class="btn btn-edit" onclick="closeModal();editarRobo(\''+roboId+'\')" style="justify-content:flex-start;padding:10px 14px;">✏️ Editar Robô</button>'+
    '<button class="btn btn-close" onclick="closeModal();abrirNotaRapida(\''+roboId+'\')" style="justify-content:flex-start;padding:10px 14px;">📝 Nota Rápida</button>'+
    '<button class="btn btn-cyan" onclick="closeModal();gerarOS(\''+roboId+'\')" style="justify-content:flex-start;padding:10px 14px;">🖨️ Gerar OS</button>'+
    '<button class="btn" onclick="closeModal();gerarApresentacao(\''+roboId+'\')" style="justify-content:flex-start;padding:10px 14px;background:rgba(206,147,216,.15);border:1px solid rgba(206,147,216,.4);color:#ce93d8;">🎁 Folha de Apresentação</button>'+
    '<button class="btn btn-primary" onclick="closeModal();abrirMoverTV(\''+roboId+'\')" style="justify-content:flex-start;padding:10px 14px;background:rgba(255,214,0,.15);border-color:rgba(255,214,0,.4);color:#ffd600;">📺 Mover para TV</button>'+
    '<button class="btn" onclick="closeModal();abrirLembrete(\''+roboId+'\')" style="justify-content:flex-start;padding:10px 14px;background:rgba(255,214,0,.08);border:1px solid rgba(255,214,0,.3);color:#ffd600;">🔔 Criar Lembrete</button>'+
    (r.status==='reparo'?'<button class="btn btn-del" onclick="closeModal();abrirCancelamento(\''+roboId+'\')" style="justify-content:flex-start;padding:10px 14px;">❌ Cancelar Reparo</button>':'')+
    '</div>'+
    '<button class="btn btn-close" onclick="closeModal()" style="width:100%;justify-content:center;">← Voltar</button>';
  openModal(html);
}
