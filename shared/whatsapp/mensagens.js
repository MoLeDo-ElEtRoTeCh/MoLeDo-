function gerarMsgCancel(){
  var _r=DB.robos.find(function(x){return x.id===CD.roboId;});var _c=_r?DB.clientes.find(function(x){return x.id===_r.clienteId;}):null;
  var _vc=atendimentoEhVC(_r,_c),_clienteFinal=_vc?atendimentoClienteFinal(_r,_c):'';
  var intro=CD.motivo==='sem-conserto'
    ?(_vc?'Infelizmente após análise técnica, não foi possível realizar o reparo do robô do seu cliente '+_clienteFinal+' ('+CD.num+' — '+CD.modelo+'). Sentimos muito por não poder ajudar desta vez.':'Infelizmente após análise técnica, não foi possível realizar o reparo do seu robô '+CD.num+' — '+CD.modelo+'. Sentimos muito por não poder ajudar desta vez.')
    :'Entendemos que o valor do reparo não ficou viável no momento, sem problemas! Ficamos à disposição para qualquer outra necessidade.';
  var msg='Oi, '+CD.cliente+'! Aqui é o técnico da MoLeDo ElEtRoTeCh.\n\n'+(_vc?'Estou falando sobre o equipamento do seu cliente '+_clienteFinal+'.\n\n':'')+intro+'\n\n';
  msg+='O valor do diagnóstico técnico é de *'+fmtVal(CD.val)+'*, que deverá ser pago para liberação do equipamento.\n\n';
  msg+='Pedimos que avise antes de vir retirar, pois às vezes estou em atendimento fora.\n\n';
  msg+='⚠️ Caso o equipamento não seja retirado em 30 dias, ele ficará retido como forma de pagamento do diagnóstico realizado.\n\n';
  msg+='MoLeDo ElEtRoTeCh\nAssistência Técnica · Robôs Aspiradores';
  var el=document.getElementById('cancel-msg');if(el)el.value=msg;
}

function precisaDesculpaAtraso(r){
  if(!r||r.desculpaAtrasoEnviada)return false;
  return diasDesde(r.dataEntrada)>=30;
}

function atendimentoEhVC(r,c){return !!(r&&c&&c.tipo==='vc'&&String(r.nomeClienteFinal||'').trim());}

function atendimentoClienteFinal(r,c){return atendimentoEhVC(r,c)?String(r.nomeClienteFinal||'').trim():'';}

function atendimentoRefRobo(r,c,num,modelo){
  num=num||('#'+String(r&&r.numVisual||0).padStart(3,'0'));
  modelo=modelo||String(r&&r.modelo||'—');
  if(atendimentoEhVC(r,c))return 'o robô do seu cliente *'+atendimentoClienteFinal(r,c)+'* (*'+num+' — '+esc(modelo)+'*)';
  return 'seu robô *'+num+' — '+esc(modelo)+'*';
}

function atendimentoLinhaVC(r,c){
  if(!atendimentoEhVC(r,c))return '';
  return '👤 *Cliente final:* '+atendimentoClienteFinal(r,c)+'\n🤝 *Vendedor:* '+String(c.nome||'')+'\n\n';
}

function atendimentoSaudacao(c,emoji){return 'Olá, *'+String(c&&c.nome||'cliente')+'*! '+(emoji||'👋')+'\n\n';}

function prefixoMensagemAtendimento(r,c,etapa){
  var msg=atendimentoSaudacao(c,'👋');
  if(atendimentoEhVC(r,c)){
    msg+='Estou falando sobre o robô do seu cliente *'+atendimentoClienteFinal(r,c)+'*, que foi enviado por você para a MoLeDo.\n\n';
  }
  if(precisaDesculpaAtraso(r)){
    msg+='Antes de tudo, pedimos desculpas pelo atraso. Tivemos alguns imprevistos técnicos e acabamos não conseguindo cumprir o prazo previsto. Agradecemos pela compreensão e paciência. 🙏\n\n';
  }
  if(etapa==='diagnostico' && !(r.mensagens||[]).some(function(m){return m.tipo==='bancada';})){
    msg+=atendimentoEhVC(r,c)?'Na correria, acabamos não enviando a confirmação de entrada na bancada, mas o equipamento do seu cliente já passou pela linha de diagnóstico. Segue abaixo o diagnóstico:\n\n':'Na correria, acabamos não enviando a confirmação de entrada na bancada, mas o seu equipamento já passou pela linha de diagnóstico. Segue abaixo o diagnóstico:\n\n';
  }else if(etapa==='diagnostico'){
    msg+=atendimentoEhVC(r,c)?'Segue o diagnóstico do equipamento do seu cliente:\n\n':'Segue o diagnóstico do seu equipamento:\n\n';
  }
  return msg;
}

function gerarMsgDiag(r,c){
  var d=r.diagnostico;if(!d)return'';
  var num='#'+String(r.numVisual).padStart(3,'0');
  var L='════════════════════════════';var l='────────────────────────────';
  var nomeNoMsg=(c?c.nome:'?');
  if(c&&c.tipo==='vc'&&r.nomeClienteFinal)nomeNoMsg='Vendedor: '+c.nome+'\nCliente: '+r.nomeClienteFinal;
  else if(c&&c.tipo==='vd')nomeNoMsg='Vendedor: '+c.nome;
  var msg=prefixoMensagemAtendimento(r,c,'diagnostico')+L+'\n     🔧 DIAGNÓSTICO TÉCNICO\n'+L+'\nRobô: '+num+' — '+r.modelo+'\n'+(c&&(c.tipo==='vc')? nomeNoMsg : 'Cliente: '+nomeNoMsg)+'\nData: '+fmtData(d.data)+'\n';
  if(d.descricao)msg+=l+'\n'+d.descricao+'\n';
  var temServicos=(d.itens&&d.itens.length)||(d.abertura>0)||(d.avulso>0)||(d.frete>0);
  if(temServicos){
    msg+=L+'\n         📋 SERVIÇOS\n'+L+'\n';
    // Abertura/Diagnóstico
    if(d.abertura>0){
      var na='Abertura/Diagnóst.';var va=fmtVal(d.abertura);var pa='';var ta=28-na.length-va.length;
      for(var i=0;i<Math.max(1,ta);i++)pa+='.';
      msg+=na+pa+va+'\n';
    }
    // Itens do catálogo
    if(d.itens&&d.itens.length){
      d.itens.forEach(function(it){
        var n=it.nome.length>18?it.nome.substring(0,18)+'..':it.nome;
        var v=fmtVal(it.preco);var p='';var tot=28-n.length-v.length;
        for(var i=0;i<Math.max(1,tot);i++)p+='.';
        msg+=n+p+v+'\n';
      });
    }
    // Cobrança avulsa
    if(d.avulso>0){
      var nav=(d.avulsoDesc||'Cobrança avulsa');nav=nav.length>18?nav.substring(0,18)+'..':nav;
      var vav=fmtVal(d.avulso);var pav='';var tav=28-nav.length-vav.length;
      for(var i=0;i<Math.max(1,tav);i++)pav+='.';
      msg+=nav+pav+vav+'\n';
    }
    // Frete
    if(d.frete>0){
      var nf='Frete/Entrega';var vf=fmtVal(d.frete);var pf='';var tf=28-nf.length-vf.length;
      for(var i=0;i<Math.max(1,tf);i++)pf+='.';
      msg+=nf+pf+vf+'\n';
    }
    msg+=l+'\n';
    if(d.desconto>0)msg+='Desconto............-'+fmtVal(d.desconto)+'\n'+l+'\n';
    msg+=L+'\nTOTAL...............'+fmtVal(d.total)+'\n'+L+'\n';
    msg+='💰 À vista (PIX/dinheiro): *'+fmtVal(d.avista)+'*\n';
    if(waParcela===0)msg+='💳 Cartão: sob consulta (até 8x)\n';
    else if(waParcela===-1)msg+='💳 Débito: *'+fmtVal(d.total*(1+TAXAS.debito))+'*\n';
    else if(waParcela===1)msg+='💳 Crédito à vista: *'+fmtVal(d.total*(1+TAXAS.c1))+'*\n';
    else{var tx=TAXAS['c'+waParcela]||0;var vC=d.total*(1+tx);msg+='💳 Cartão '+waParcela+'x: *'+fmtVal(vC)+'* ('+waParcela+'x de *'+fmtVal(vC/waParcela)+'*)\n';}
  }
  msg+=L+'\n           🛡️ GARANTIA\n'+L+'\n90 dias sobre o serviço realizado\n'+l+'\n\n⚠️ *ATENÇÃO: confirme se você ACEITA ou NÃO ACEITA este diagnóstico.*\nCom a sua confirmação, realizaremos o fechamento do equipamento, os testes finais e a limpeza.\n\n'+l+'\nMoLeDo ElEtRoTeCh\nAssistência Técnica · Robôs Aspiradores';
  return msg;
}

function gerarMsgCartao(r){
  var d=r&&r.diagnostico;if(!d)return'[Diagnóstico não preenchido ainda]';
  var base=Number(d.avista!=null?d.avista:d.total)||0;
  var total=Number(d.total)||base;
  var msg='Opa! O que eu consigo fazer para você é dessa forma:\n\n';
  msg+='💰 À vista (PIX/dinheiro): *'+fmtVal(base)+'*\n';
  if(waParcela===0){
    msg+='💳 Cartão: posso simular conforme a quantidade de parcelas que você preferir.\n';
  }else if(waParcela===-1){
    var vd=total*(1+(TAXAS.debito||0));
    msg+='💳 No débito: *'+fmtVal(vd)+'*\n';
  }else if(waParcela===1){
    var v1=total*(1+(TAXAS.c1||0));
    msg+='💳 No crédito à vista: *'+fmtVal(v1)+'*\n';
  }else{
    var tx=TAXAS['c'+waParcela]||0;var vc=total*(1+tx);
    msg+='💳 No cartão em '+waParcela+'x: *'+fmtVal(vc)+'*\n';
    msg+=waParcela+'x de *'+fmtVal(vc/waParcela)+'*\n';
  }
  msg+='\nNo cartão eu não consigo retirar os juros da maquininha, pois eles são cobrados diretamente pela operadora conforme a quantidade de parcelas. Por isso, quanto maior o parcelamento, maior fica o valor final.\n\n';
  msg+='Se dessa forma ficar bom para você, me avisa 👍';
  return msg;
}

function gerarMsgBancada(r,c){
  var num=r.numOS||('#'+String(r.numVisual).padStart(3,'0'));
  var nome=c?c.nome:'cliente';
  var tipo=c?c.tipo:'cf';
  var b=r.bancada||{};
  var itens=b.itens||{};
  var msg=prefixoMensagemAtendimento(r,c,'bancada');
  if(atendimentoEhVC(r,c))msg+='O robô do seu cliente *'+atendimentoClienteFinal(r,c)+'* (*'+num+' — '+esc(r.modelo||'—')+'*) acabou de dar entrada na bancada da *MoLeDo ElEtRoTeCh*! 🔧🤖\n\n';
  else msg+='Seu robô *'+num+' — '+esc(r.modelo||'—')+'* acabou de dar entrada na bancada da *MoLeDo ElEtRoTeCh*! 🔧🤖\n\n';
  // checklist
  var vieram=[];var naoVieram=[];
  checklistParaTipo(r.tipoEquipamento||'robo').forEach(function(item){
    var e=itens[item.id]||'';
    if(e==='veio')vieram.push('✅ '+item.nome);
    else if(e==='nao')naoVieram.push('❌ '+item.nome);
  });
  if(vieram.length){msg+='*📦 Itens recebidos:*\n'+vieram.join('\n')+'\n';}
  if(naoVieram.length){msg+='\n*⚠️ Não recebidos:*\n'+naoVieram.join('\n')+'\n';}
  if(b.obsItens)msg+='\n📝 _'+b.obsItens+'_\n';
  msg+='\n';
  if(b.outraAssistencia==='sim')msg+='🔄 *Veio de outra assistência:* Sim\n';
  if(b.selo)msg+='🔒 *Selo de garantia:* '+(b.selo==='intacto'?'Intacto ✅':b.selo==='violado'?'Violado ⚠️':'Sem selo ❌')+'\n';
  if(b.obs)msg+='\n📋 *Observação:* '+b.obs+'\n';
  msg+='\n*Por favor, confirme se todos os itens acima correspondem ao que foi enviado para a assistência técnica.* ✅\n\nLogo mais será encaminhado o diagnóstico.\n';
  msg+='\n\n_\n*MoLeDo ElEtRoTeCh*\nReparo é nossa linguagem · Tecnologia é nossa paixão_';
  return msg;
}
