function marcarRoboEntregue(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var num='#'+String(r.numVisual).padStart(3,'0');
  openModal('<div class="modal-title">📦 Confirmar Entrega</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:16px;">Confirmar entrega de <strong style="color:var(--cyan);">'+num+' — '+esc(descricaoEquipamento(r)||'—')+'</strong>?</div>'+
    '<div class="modal-actions">'+
    '<button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-cyan" onclick="executarMarcarEntregue(\''+roboId+'\')">📦 Confirmar Entrega</button>'+
    '</div>');
}

function executarMarcarEntregue(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  r.entregue=true;
  r.dataEntrega=todayISO();
  // Remove alerta de entrega pendente
  if(DB.lembretes)DB.lembretes=DB.lembretes.filter(function(l){return!(l.roboId===roboId&&l.tipo==='entrega');});
  saveDB();closeModal();if(fichaClienteId)refreshFichaContent();renderAll();
  showToast('📦 Entrega confirmada!');
}

function marcarServicoPronto(roboId){
  confirmarEntrega(roboId);
}

function confirmarServicoPronto(roboId,pago){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});if(!c)return;
  var num='#'+String(r.numVisual).padStart(3,'0');
  var wa=(c.whatsapp||'').replace(/\D/g,'');
  if(wa.length===11)wa='55'+wa;
  var diagValor=r.diagnostico?(' O valor do serviço foi de *'+fmtVal(r.diagnostico.total)+'*.'):'';
  var msg;
  if(pago){
    msg=atendimentoSaudacao(c,'😊')+
      (atendimentoEhVC(r,c)?textoEquipamento('O robô do seu cliente *',r)+atendimentoClienteFinal(r,c)+'* (*'+num+' — '+esc(descricaoEquipamento(r)||'—')+'*) está com o serviço concluído e pagamento confirmado! 🤖✅\n\n':textoEquipamento('Seu robô *',r)+num+' — '+esc(descricaoEquipamento(r)||'—')+'* está com o serviço concluído e pagamento confirmado! 🤖✅\n\n')+
      'Como prefere prosseguir?\n\n'+
      '📦 *Envio* — posso enviar pelo correio/motoboy\n'+
      '🚶 *Retirada* — pode buscar quando quiser\n\n'+
      'Me avise como prefere! 😊\n\n'+
      '_*MoLeDo ElEtRoTeCh*\nReparo é nossa linguagem · Tecnologia é nossa paixão_';
  } else {
    msg=atendimentoSaudacao(c,'😊')+
      (atendimentoEhVC(r,c)?textoEquipamento('Ótima notícia! O serviço do robô do seu cliente *',r)+atendimentoClienteFinal(r,c)+'* (*'+num+' — '+esc(descricaoEquipamento(r)||'—')+'*) foi concluído com sucesso! 🤖✅\n\n':textoEquipamento('Ótima notícia! O serviço do seu robô *',r)+num+' — '+esc(descricaoEquipamento(r)||'—')+'* foi concluído com sucesso! 🤖✅\n\n')+
      diagValor+'\n\n'+
      'Assim que o pagamento for confirmado, acertamos a retirada ou o envio! 😊\n\n'+
      'Qual forma fica melhor pra você?\n'+
      '📱 *PIX* · 💳 *Cartão* · 💵 *Dinheiro*\n\n'+
      'Qualquer dúvida, estou à disposição! 🙏\n\n'+
      '_*MoLeDo ElEtRoTeCh*\nReparo é nossa linguagem · Tecnologia é nossa paixão_';
  }
  r.servicoPronto=true;
  r.servicoProntoPago=pago;
  r.dataServicoPronto=todayISO();
  if(!r.mensagens)r.mensagens=[];
  r.mensagens.push({data:todayISO(),tipo:'servicoPronto'});
  saveDB();closeModal();renderAll();
  setTimeout(function(){
    if(wa){window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank');}
    showToast('🏁 Serviço marcado como pronto!');
  },300);
}

function confirmarEntrega(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var num='#'+String(r.numVisual).padStart(3,'0');
  openModal('<div class="modal-title">🏁 Serviço Pronto — Situação</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:16px;"><strong style="color:var(--cyan);">'+num+'</strong>'+(c?' de '+esc(c.nome):'')+' — garantia de 90 dias.</div>'+
    '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:12px;">Qual é a situação?</div>'+
    '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">'+
    '<button class="btn btn-green" onclick="executarEntrega(\''+roboId+'\',true,true)" style="justify-content:flex-start;padding:10px 14px;">✅💰 Entregue e já pago</button>'+
    '<button class="btn" onclick="executarEntrega(\''+roboId+'\',true,false)" style="justify-content:flex-start;padding:10px 14px;background:rgba(0,229,255,.1);border:1px solid rgba(0,229,255,.3);color:var(--cyan);">📦⏳ Entregue — paga depois</button>'+
    '<button class="btn" onclick="executarEntrega(\''+roboId+'\',false,true)" style="justify-content:flex-start;padding:10px 14px;background:rgba(255,214,0,.1);border:1px solid rgba(255,214,0,.3);color:#ffd600;">💰📦 Já pagou — busca depois</button>'+
    '<button class="btn" onclick="executarEntrega(\''+roboId+'\',false,false)" style="justify-content:flex-start;padding:10px 14px;background:rgba(255,109,0,.1);border:1px solid rgba(255,109,0,.3);color:#ff6d00;">⏳ Nem entregue nem pago</button>'+
    '</div>'+
    '<button class="btn btn-close" style="width:100%;justify-content:center;" onclick="closeModal()">Cancelar</button>');
}

function executarEntrega(roboId,entregue,pago){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var hoje=todayISO();
  // Ao escolher uma situação pelo botão Serviço Pronto,
  // registra que o serviço foi concluído antes de tratar entrega/pagamento.
  r.servicoPronto=true;
  r.dataServicoPronto=r.dataServicoPronto||hoje;
  r.status='garantia';
  r.dataEntrada=r.dataEntrada||hoje;
  r.garantiaAte=addDays(hoje,90);
  r.pago=pago===true;
  if(r.pago)r.dataPagamento=hoje;
  r.entregue=entregue===true;
  r.dataEntrega=entregue?hoje:null;
  // Remove alertas anteriores deste robô (evita duplicatas)
  if(!DB.lembretes)DB.lembretes=[];
  DB.lembretes=DB.lembretes.filter(function(l){return l.roboId!==roboId||l.tipo==='manual';});
  var num='#'+String(r.numVisual).padStart(3,'0');
  var nomeCliente=c?c.nome:'Cliente';
  // Cria alertas conforme situação
  if(entregue&&!pago){
    // Entregue s/pagar → alerta de cobrança
    DB.lembretes.push({id:genId(),roboId:roboId,tipo:'cobranca',label:'💰 Cobrar '+nomeCliente+' '+num+' (entregue s/pagar)',dt:hoje+'T09:00',feito:false});
  }
  if(!entregue&&pago){
    // Pago s/entregar → alerta de entrega pendente
    DB.lembretes.push({id:genId(),roboId:roboId,tipo:'entrega',label:textoEquipamento('📦 Entregar robô ',r)+num+' para '+nomeCliente+' (já pagou)',dt:hoje+'T09:00',feito:false});
  }
  if(!entregue&&!pago){
    // Nem entregue nem pago → alerta dos dois
    DB.lembretes.push({id:genId(),roboId:roboId,tipo:'cobranca',label:'💰 Cobrar e entregar '+num+' · '+nomeCliente,dt:hoje+'T09:00',feito:false});
  }
  saveDB();closeModal();if(fichaClienteId)refreshFichaContent();renderAll();switchTab('garantia');
  var msg=entregue&&pago?'✅💰 Entregue e pago! Garantia ativada.':
         entregue&&!pago?'📦 Entregue! Alerta de cobrança criado.':
         !entregue&&pago?'💰 Pago! Alerta de entrega criado.':
         '⏳ Registrado! Alertas de cobrança e entrega criados.';
  showToast(msg);
  // Salva dados públicos no Firebase
  try{
    import('https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js').then(function(fs){
      import('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js').then(function(fa){
        var apps=fa.getApps?fa.getApps():[];
        if(!apps.length)return;
        var db2=fs.getFirestore(apps[0]);
        var dadosPub={
          numOS:r.numOS||('#'+String(r.numVisual).padStart(3,'0')),
          modelo:descricaoEquipamento(r)||'',
          tipoEquipamento:r.tipoEquipamento||'robo',nomeTipoEquipamento:r.nomeTipoEquipamento||'',
          voltagem:r.voltagem||'',
          dataEntrada:r.dataEntrada||'',
          dataEntrega:hoje,
          garantiaAte:r.garantiaAte,
          itens:r.bancada&&r.bancada.itens?r.bancada.itens:{},
          whatsapp:c?c.whatsapp:'',
          updatedAt:Date.now()
        };
        fs.setDoc(fs.doc(db2,'publico',roboId),dadosPub).catch(function(e){console.log('pub err',e);});
      });
    });
  }catch(e){console.log('import err',e);}
}
