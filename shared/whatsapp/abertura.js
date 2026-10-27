function abrirWhatsAppDireto(clienteId){
  var c=DB.clientes.find(function(x){return x.id===clienteId;});if(!c)return;
  var wa=(c.whatsapp||'').replace(/\D/g,'');
  if(wa.length>=10&&!wa.startsWith('55'))wa='55'+wa;
  // Robôs ativos desse cliente para mensagem de diagnóstico
  var robos=DB.robos.filter(function(r){return r.clienteId===clienteId&&(r.status==='reparo'||r.status==='garantia');});
  var html='<div class="modal-title">💬 WhatsApp — '+esc(c.nome)+'</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:14px;">Como você quer falar com o cliente?</div>';
  // Opção: conversa livre direto
  html+='<button class="btn btn-wa" style="width:100%;justify-content:center;margin-bottom:10px;padding:12px;" onclick="closeModal();window.open(\'https://wa.me/'+wa+'\',\'_blank\')">💬 Abrir conversa direto</button>';
  // Opções por robô (mensagem de diagnóstico)
  if(robos.length){
    html+='<div style="font-size:11px;color:var(--text3);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:12px 0 8px;">Ou enviar diagnóstico de um robô:</div>';
    html+=robos.map(function(r){
      var num='#'+String(r.numVisual).padStart(3,'0');
      var temDiag=!!r.diagnostico;
      return'<button class="btn'+(temDiag?' btn-cyan':'')+'" style="width:100%;justify-content:flex-start;margin-bottom:6px;padding:10px 12px;'+(temDiag?'':'opacity:.6;')+'" onclick="closeModal();abrirWhatsApp(\''+r.id+'\')">'+num+' · '+esc(descricaoEquipamento(r)||'—')+(temDiag?' ✅':' (sem diagnóstico)')+'</button>';
    }).join('');
  }
  html+='<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Fechar</button></div>';
  openModal(html);
}

function gerarOSSelecionadosWA(cId){
  var c=DB.clientes.find(function(x){return x.id===cId;});if(!c)return;
  var robos=DB.robos.filter(function(r){return r.clienteId===cId;});
  var lixeira=(DB.lixeira||[]).filter(function(x){return x.robo&&x.robo.clienteId===cId;});
  var todos=robos.concat(lixeira.map(function(x){return Object.assign({},x.robo,{_lixId:x.id,_cancelado:true});}));
  var selecionados=todos.filter(function(r){
    var chk=document.getElementById('os-chk-'+r.id);
    return chk&&chk.checked&&r.diagnostico&&r.diagnostico.total>0;
  });
  if(!selecionados.length){showToast('Selecione robôs com diagnóstico.');return;}
  closeModal();
  // Mensagem resumo simples — sem diagnóstico técnico
  var L='════════════════════════════';var l='────────────────────────────';
  var msgs=selecionados.map(function(r){
    var d=r.diagnostico;
    var num='#'+String(r.numVisual).padStart(3,'0');
    var nomeCliente=c.nome;
    if(c.tipo==='vc'&&r.nomeClienteFinal)nomeCliente=r.nomeClienteFinal;
    var msg=L+'\n         📋 SERVIÇOS\n'+L+'\n';
    if(c.tipo==='vc'&&r.nomeClienteFinal)msg+=textoEquipamento('Robô: ',r)+num+' — '+esc(descricaoEquipamento(r)||'—')+'\nVendedor: '+c.nome+'\nCliente: '+r.nomeClienteFinal+'\n'+l+'\n';
    else msg+=textoEquipamento('Robô: ',r)+num+' — '+esc(descricaoEquipamento(r)||'—')+'\nCliente: '+nomeCliente+'\n'+l+'\n';
    if(d.abertura>0){var na='Abertura/Diagnóst.';var va=fmtVal(d.abertura);var pa='';for(var i=0;i<Math.max(1,28-na.length-va.length);i++)pa+='.';msg+=na+pa+va+'\n';}
    if(d.itens&&d.itens.length)d.itens.forEach(function(it){var n=it.nome.length>18?it.nome.substring(0,18)+'..':it.nome;var v=fmtVal(it.preco);var p='';for(var i=0;i<Math.max(1,28-n.length-v.length);i++)p+='.';msg+=n+p+v+'\n';});
    if(d.avulso>0){var nav=(d.avulsoDesc||'Cobrança avulsa');nav=nav.length>18?nav.substring(0,18)+'..':nav;var vav=fmtVal(d.avulso);var pav='';for(var i=0;i<Math.max(1,28-nav.length-vav.length);i++)pav+='.';msg+=nav+pav+vav+'\n';}
    if(d.frete>0){var nf='Frete/Entrega';var vf=fmtVal(d.frete);var pf='';for(var i=0;i<Math.max(1,28-nf.length-vf.length);i++)pf+='.';msg+=nf+pf+vf+'\n';}
    msg+=l+'\n';
    if(d.desconto>0)msg+='Desconto............-'+fmtVal(d.desconto)+'\n'+l+'\n';
    msg+=L+'\nTOTAL...............'+fmtVal(d.total)+'\n'+L+'\n';
    msg+='💰 À vista: *'+fmtVal(d.avista||d.total)+'*\n';
    msg+='💳 Cartão: sob consulta (até 8x)\n';
    msg+=L+'\n🛡️ Garantia: 90 dias\n'+l+'\nMoLeDo ElEtRoTeCh';
    return msg;
  }).join('\n\n');
  var wa='https://wa.me/55'+c.whatsapp.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent(msgs);
  window.open(wa,'_blank');
}

function reenviarWABancada(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});if(!c)return;
  var msg=gerarMsgBancada(r,c);
  var wa=c.whatsapp.replace(/\D/g,'');
  if(wa.length===11)wa='55'+wa;
  window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank');
  if(!r.mensagens)r.mensagens=[];
  r.mensagens.push({data:todayISO(),tipo:'bancada'});
  saveDB();showToast('🔧 WhatsApp bancada aberto!');
}

function enviarAtrasoDirecto(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});if(!c)return;
  var num=r.numOS||('#'+String(r.numVisual).padStart(3,'0'));
  var msg=atendimentoSaudacao(c,'🙏')+(atendimentoEhVC(r,c)?textoEquipamento('Vim pedir desculpas pelo atraso no retorno sobre o robô do seu cliente *',r)+atendimentoClienteFinal(r,c)+'* (*'+num+' — '+esc(descricaoEquipamento(r)||'—')+'*).':textoEquipamento('Vim pedir desculpas pelo atraso no retorno sobre seu robô *',r)+num+' — '+esc(descricaoEquipamento(r)||'—')+'*.')+'\n\nEstamos trabalhando para resolver o mais breve possível e logo teremos novidades!\n\n_\n*MoLeDo ElEtRoTeCh*\nReparo é nossa linguagem · Tecnologia é nossa paixão_';
  var wa=c.whatsapp.replace(/\D/g,'');
  if(wa.length===11)wa='55'+wa;
  window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank');
}

function enviarWACancel(){
  if(!CD.motivo){alert('Selecione o motivo primeiro!');return;}
  var msg=document.getElementById('cancel-msg').value;
  var num=(CD.wa||'').replace(/\D/g,'');
  var r=DB.robos.find(function(x){return x.id===CD.roboId;});
  if(r){if(!r.mensagens)r.mensagens=[];r.mensagens.push({data:todayISO(),tipo:'cancelamento'});saveDB();}
  window.open('https://wa.me/55'+num+'?text='+encodeURIComponent(msg),'_blank');
}

function enviarLembreteRetirada(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});if(!c)return;
  var num='#'+String(r.numVisual).padStart(3,'0');
  var wa=(c.whatsapp||'').replace(/\D/g,'');
  if(wa.length>=10&&!wa.startsWith('55'))wa='55'+wa;
  var nome=c.nome||'';
  var msg='Oi, '+nome+'! Tudo bem? 😊\n\n'+
    (atendimentoEhVC(r,c)?textoEquipamento('Passando pra lembrar que o robô do seu cliente *',r)+atendimentoClienteFinal(r,c)+'* (*'+num+' — '+(descricaoEquipamento(r)||'')+'*) já está prontinho e ainda está aqui com a gente! 🤖✅\n\n':textoEquipamento('Passando pra lembrar que seu robô *',r)+num+' — '+(descricaoEquipamento(r)||'')+'* já está prontinho e ainda está aqui com a gente! 🤖✅\n\n')+
    'Vamos acertar o pagamento e agendar a retirada (ou o envio)? 📦\n\n'+
    'Qualquer dúvida estou à disposição! 🙏\n\n'+
    '_*MoLeDo ElEtRoTeCh*\nReparo é nossa linguagem · Tecnologia é nossa paixão_';
  if(!r.mensagens)r.mensagens=[];
  r.mensagens.push({data:todayISO(),tipo:'lembreteRetirada'});
  saveDB();renderAll();
  setTimeout(function(){
    if(wa){window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank');}
    showToast('📦 Lembrete de retirada enviado!');
  },200);
}

function abrirWhatsApp(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});if(!c)return;
  if(!r.mensagens)r.mensagens=[];
  waRoboId=roboId;waParcela=0;
  var num='#'+String(r.numVisual).padStart(3,'0');var diagPronto=!!r.diagnostico;
  var hoje=new Date();hoje.setHours(0,0,0,0);
  var entrada=r.dataEntrada?new Date(r.dataEntrada+'T00:00:00'):null;
  var dias=entrada?Math.floor((hoje-entrada)/(1000*60*60*24)):0;
  var mostrarAtraso=dias>=40;
  // se diagnóstico selecionado mas não pronto, abre diagnóstico direto
  if(!diagPronto){
    waTipoAtual='pronto';
  } else {
    waTipoAtual='diagnostico';
  }
  waMensagens={
    diagnostico:diagPronto?gerarMsgDiag(r,c):'',
    cartao:diagPronto?gerarMsgCartao(r):'',
    pronto:atendimentoSaudacao(c,'😊')+(atendimentoEhVC(r,c)?textoEquipamento('O robô do seu cliente *',r)+atendimentoClienteFinal(r,c)+'* (*'+num+' — '+esc(descricaoEquipamento(r)||'—')+'*) está pronto para retirada! 🤖✅\n\n':textoEquipamento('Seu robô *',r)+num+' — '+esc(descricaoEquipamento(r)||'—')+'* está pronto para retirada! 🤖✅\n\n')+'Fique à vontade para combinar a retirada quando puder!\n\n_\n*MoLeDo ElEtRoTeCh*\nReparo é nossa linguagem · Tecnologia é nossa paixão_',
    atraso:atendimentoSaudacao(c,'🙏')+(atendimentoEhVC(r,c)?textoEquipamento('Vim pedir desculpas pelo atraso no retorno sobre o robô do seu cliente *',r)+atendimentoClienteFinal(r,c)+'* (*'+num+' — '+esc(descricaoEquipamento(r)||'—')+'*).':textoEquipamento('Vim pedir desculpas pelo atraso no retorno sobre seu robô *',r)+num+' — '+esc(descricaoEquipamento(r)||'—')+'*.')+'\n\nEstamos trabalhando para resolver o mais breve possível e logo teremos novidades!\n\n_\n*MoLeDo ElEtRoTeCh*\nReparo é nossa linguagem · Tecnologia é nossa paixão_',
    outro:atendimentoSaudacao(c,'👋')+(atendimentoEhVC(r,c)?textoEquipamento('Sobre o robô do seu cliente *',r)+atendimentoClienteFinal(r,c)+'* (*'+num+' — '+esc(descricaoEquipamento(r)||'—')+'*):\n\n':'')+'[Digite sua mensagem aqui]\n\n_\n*MoLeDo ElEtRoTeCh*\nReparo é nossa linguagem · Tecnologia é nossa paixão_'
  };
  var histHtml='';
  if(r.mensagens.length)histHtml='<div class="wa-hist"><div class="wa-hist-title">📋 Histórico</div>'+r.mensagens.slice().reverse().map(function(m){return'<div class="wa-hist-item">'+fmtData(m.data)+' — '+(WA_LABELS[m.tipo]||m.tipo)+'</div>';}).join('')+'</div>';

  // tipos rápidos de mensagem
  var tipos=[
    {id:'diagnostico',label:'💊 Diagnóstico'},
    {id:'cartao',label:'💳 Cartão'},
    {id:'outro',label:'💬 Outra'}
  ];

  var tiposBtns=tipos.map(function(t){
    var aviso=t.id==='diagnostico'&&!diagPronto;
    return'<button type="button" class="wa-tipo-btn'+(t.id===waTipoAtual?' sel':'')+'" onclick="selWATipo(\''+t.id+'\')">'+t.label+(aviso?' ⚠️':'')+'</button>';
  }).join('');

  var msgAtual=waTipoAtual==='diagnostico'&&!diagPronto
    ?'[Diagnóstico não preenchido ainda]'
    :(waMensagens[waTipoAtual]||'');

  openModal('<div class="modal-title">💬 WhatsApp — '+esc(c.nome)+'</div>'+
    '<div style="font-size:12px;color:var(--text3);margin-bottom:10px;">📱 '+esc(c.whatsapp)+textoEquipamento(' · Robô ',r)+num+'</div>'+
    (!diagPronto&&waTipoAtual==='diagnostico'?'<div style="background:rgba(255,214,0,.08);border:1px solid rgba(255,214,0,.3);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--yellow);margin-bottom:10px;cursor:pointer;" onclick="closeModal();abrirDiagnostico(\''+roboId+'\')">⚠️ Diagnóstico não preenchido — <b>Toque aqui para fazer o diagnóstico</b></div>':'')+
    histHtml+
    '<div class="form-group"><label class="form-label">Tipo de mensagem</label><div class="wa-tipos">'+tiposBtns+'</div></div>'+
    (diagPronto?'<div class="form-group" id="wa-parcela-row"><label class="form-label">💳 Parcelas no cartão</label>'+
    '<div class="parcela-btns">'+
      '<button type="button" class="parcela-btn'+(waParcela===0?' sel':'')+'" onclick="setWAParcela(0)">Sob consulta</button>'+
      '<button type="button" class="parcela-btn'+(waParcela===-1?' sel':'')+'" onclick="setWAParcela(-1)">Débito</button>'+
      [1,2,3,4,5,6,7,8].map(function(n){return'<button type="button" class="parcela-btn'+(waParcela===n?' sel':'')+'" onclick="setWAParcela('+n+')">'+n+'x</button>';}).join('')+
    '</div></div>':'')+
    '<div class="form-group"><label class="form-label">Mensagem</label><textarea id="wa-msg" class="form-input" style="min-height:140px;font-size:13px;">'+msgAtual+'</textarea></div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Fechar</button>'+
    '<button class="btn btn-wa" onclick="enviarWA(\''+esc(c.whatsapp)+'\',\''+roboId+'\')">📲 Abrir no WhatsApp</button></div>');
}

function setWAParcela(n){
  waParcela=n;
  document.querySelectorAll('.parcela-btn').forEach(function(b){b.classList.remove('sel');});
  event.target.classList.add('sel');
  var r=DB.robos.find(function(x){return x.id===waRoboId;});
  var c=r?DB.clientes.find(function(x){return x.id===r.clienteId;}):null;
  if(r&&c)document.getElementById('wa-msg').value=(waTipoAtual==='cartao'?gerarMsgCartao(r):gerarMsgDiag(r,c));
}

function selWATipo(tipo){
  document.querySelectorAll('.wa-tipo-btn').forEach(function(b){b.classList.remove('sel');});
  event.target.classList.add('sel');waTipoAtual=tipo;
  var r=DB.robos.find(function(x){return x.id===waRoboId;});
  var c=r?DB.clientes.find(function(x){return x.id===r.clienteId;}):null;
  var pr=document.getElementById('wa-parcela-row');if(pr)pr.style.display=(tipo==='diagnostico'||tipo==='cartao')?'block':'none';
  if(r&&tipo==='diagnostico'){
    document.getElementById('wa-msg').value=r.diagnostico?gerarMsgDiag(r,c):'[Diagnóstico não preenchido ainda — faça o diagnóstico primeiro]';
  } else if(r&&tipo==='cartao'){
    document.getElementById('wa-msg').value=r.diagnostico?gerarMsgCartao(r):'[Diagnóstico não preenchido ainda — faça o diagnóstico primeiro]';
  } else {
    document.getElementById('wa-msg').value=waMensagens[tipo]||'';
  }
}

function enviarWA(numero,roboId){
  var msg=document.getElementById('wa-msg').value;var num=numero.replace(/\D/g,'');
  if(roboId){var r=DB.robos.find(function(x){return x.id===roboId;});if(r){if(!r.mensagens)r.mensagens=[];r.mensagens.push({data:todayISO(),tipo:waTipoAtual});if(precisaDesculpaAtraso(r))r.desculpaAtrasoEnviada=true;saveDB();}}
  window.open('https://wa.me/55'+num+'?text='+encodeURIComponent(msg),'_blank');
  closeModal();renderAll();if(fichaClienteId)refreshFichaContent();
}
