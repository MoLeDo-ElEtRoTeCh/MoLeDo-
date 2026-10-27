function salvarBancadaComVerificacao(roboId,enviarWA){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var snEl=document.getElementById('bancada-sn'),noSnEl=document.getElementById('bancada-nosn');
  var noSn=!!(noSnEl&&noSnEl.checked),sn=limparSN(snEl?snEl.value:'');
  if(!noSn&&!temSnValido(sn)){alert('Antes de dar entrada na bancada, informe o Código/SN ou marque “Sem código/SN visível”.');return;}
  // Se tinha diagnóstico E estava numa etapa anterior, apaga o diagnóstico
  if(r.diagnostico&&r._etapaAtual==='bancada'){
    r.diagnostico=null;
    r.servicoPronto=false;
    r._etapaAtual=null;
    showToast('ℹ️ Diagnóstico removido pois a bancada foi editada');
  }
  salvarBancada(roboId,enviarWA);
}

function toggleBancadaModo(){
  _bancadaModo=_bancadaModo==='normal'?'placa':'normal';
  var btnPlaca=document.getElementById('btn-so-placa');
  var divItens=document.getElementById('bancada-itens-div');
  var divPlaca=document.getElementById('bancada-placa-div');
  if(btnPlaca){
    if(_bancadaModo==='placa'){
      btnPlaca.style.background='rgba(0,229,255,.2)';btnPlaca.style.borderColor='var(--cyan)';btnPlaca.style.color='var(--cyan)';
      btnPlaca.textContent='🤖 Robô inteiro';
    } else {
      btnPlaca.style.background='rgba(255,255,255,.05)';btnPlaca.style.borderColor='var(--border)';btnPlaca.style.color='var(--text2)';
      btnPlaca.textContent='🔌 Só a Placa';
    }
  }
  if(divItens)divItens.style.display=_bancadaModo==='normal'?'block':'none';
  if(divPlaca)divPlaca.style.display=_bancadaModo==='placa'?'block':'none';
}

function setBancadaPlacaItem(id,estado){
  if(!window._bancadaEstado)window._bancadaEstado={itens:{},itensPlaca:{}};
  if(!window._bancadaEstado.itensPlaca)window._bancadaEstado.itensPlaca={};
  window._bancadaEstado.itensPlaca[id]=estado;
  CHECKLIST_PLACA.forEach(function(item){
    var bv=document.getElementById('bpi-veio-'+item.id);
    var bn=document.getElementById('bpi-nao-'+item.id);
    var bs=document.getElementById('bpi-sem-'+item.id);
    if(item.id===id){
      if(bv)bv.style.cssText=bancadaBtnStyle('veio',estado);
      if(bn)bn.style.cssText=bancadaBtnStyle('nao',estado);
      if(bs)bs.style.cssText=bancadaBtnStyle('',estado);
    }
  });
}

function checklistParaTipo(tipo){
  if(tipo==='outro')return [{id:'equipamento',nome:'Equipamento'},{id:'alimentacao',nome:'Cabo / fonte'},{id:'acessorios',nome:'Acessórios'}];
  var roboIds=['vassoura_central','vassoura_lat_esq','vassoura_lat_dir','reservatorio_poco','reservatorio_agua','tampa_superior','mop_esq','mop_dir','mop_unico','controle_remoto'];
  var baseIds=['carregador_dock','cabo_carregador'];
  var estIds=['est_res_poeira','est_agua_limpa','est_agua_suja','est_rampa','est_area_limpeza','est_cabo'];
  if(tipo==='robo_base')return CHECKLIST_ITENS.filter(function(i){return roboIds.indexOf(i.id)>=0||baseIds.indexOf(i.id)>=0;});
  if(tipo==='robo_estacao')return CHECKLIST_ITENS.filter(function(i){return roboIds.indexOf(i.id)>=0||estIds.indexOf(i.id)>=0;});
  if(tipo==='placa_robo'||tipo==='placa_estacao')return [];
  return CHECKLIST_ITENS.filter(function(i){return roboIds.indexOf(i.id)>=0;});
}

function abrirBancada(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var num='#'+String(r.numVisual).padStart(3,'0');
  var saved=r.bancada||{};
  if(!r.numOS){r.numOS=gerarNumOS();saveDB();}
  _bancadaModo=saved.modo||'normal';

  var checklistAtual=checklistParaTipo(r.tipoEquipamento||'robo');
  if(r.tipoEquipamento==='placa_robo'||r.tipoEquipamento==='placa_estacao')_bancadaModo='placa';
  var itensHtml=checklistAtual.map(function(item){
    var estado=(saved.itens&&saved.itens[item.id])||'';
    return'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">'+
      '<span style="font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:600;color:var(--text);">'+item.nome+'</span>'+
      '<div style="display:flex;gap:6px;">'+
        '<button onclick="setBancadaItem(\''+item.id+'\',\'veio\')" id="bi-veio-'+item.id+'" style="'+bancadaBtnStyle('veio',estado)+'">✅</button>'+
        '<button onclick="setBancadaItem(\''+item.id+'\',\'nao\')" id="bi-nao-'+item.id+'" style="'+bancadaBtnStyle('nao',estado)+'">❌</button>'+
        '<button onclick="setBancadaItem(\''+item.id+'\',\'\')" id="bi-sem-'+item.id+'" style="'+bancadaBtnStyle('',estado)+'">—</button>'+
      '</div>'+
    '</div>';
  }).join('');

  var itensPlacaHtml=CHECKLIST_PLACA.map(function(item){
    var estado=(saved.itensPlaca&&saved.itensPlaca[item.id])||'';
    return'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">'+
      '<span style="font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:600;color:var(--text);">'+item.nome+'</span>'+
      '<div style="display:flex;gap:6px;">'+
        '<button onclick="setBancadaPlacaItem(\''+item.id+'\',\'veio\')" id="bpi-veio-'+item.id+'" style="'+bancadaBtnStyle('veio',estado)+'">✅ Veio</button>'+
        '<button onclick="setBancadaPlacaItem(\''+item.id+'\',\'nao\')" id="bpi-nao-'+item.id+'" style="'+bancadaBtnStyle('nao',estado)+'">❌ Não</button>'+
        '<button onclick="setBancadaPlacaItem(\''+item.id+'\',\'\')" id="bpi-sem-'+item.id+'" style="'+bancadaBtnStyle('',estado)+'">—</button>'+
      '</div>'+
    '</div>';
  }).join('');

  var outraAss=saved.outraAssistencia||'';
  var selo=saved.selo||'';
  var isModoPlaca=_bancadaModo==='placa';

  openModal(
    '<div class="modal-title">🔧 Entrada na Bancada</div>'+
    '<div style="font-size:13px;color:var(--cyan);font-family:\'Rajdhani\',sans-serif;margin-bottom:4px;font-weight:700;">'+r.numOS+' · '+(c?esc(c.nome):'')+' · '+num+' · '+esc(descricaoEquipamento(r)||'—')+'</div>'+
    '<div class="form-group" style="margin-top:10px;"><label class="form-label">Código / SN <span style="color:var(--yellow);font-size:10px;">CONFIRMAR NA ENTRADA DA BANCADA</span></label>'+
      '<div style="display:flex;gap:7px;align-items:center;"><input id="bancada-sn" class="form-input" type="text" value="'+(temSnValido(r.sn)?esc(r.sn):'')+'" oninput="this.dataset.snOrigem=\'bancada_manual\'" style="flex:1;text-transform:uppercase;font-family:\'Share Tech Mono\',monospace;">'+
      '<input id="bancada-sn-camera" type="file" accept="image/*" capture="environment" style="display:none;" onchange="processarFotoSNParaCampo(this,\'bancada-sn\',\'bancada-nosn\')">'+
      '<button type="button" class="btn btn-cyan" onclick="document.getElementById(\'bancada-sn-camera\').click()" style="white-space:nowrap;padding:9px 10px;">📷 Ler</button></div>'+
      '<div class="checkbox-row" style="margin-top:6px"><input type="checkbox" id="bancada-nosn"'+((r.snConfirmadoBancada&&!temSnValido(r.sn))?' checked':'')+' onchange="var s=document.getElementById(\'bancada-sn\');if(this.checked){s.value=\'\';s.disabled=true;}else s.disabled=false;"><label for="bancada-nosn">Sem código/SN visível</label></div>'+
      '<div style="font-size:10px;color:var(--text3);margin-top:5px;">Antes de salvar a entrada na bancada, confirme o SN ou marque explicitamente que ele não está visível.</div>'+
    '</div>'+
    // BOTÃO SÓ A PLACA
    '<div style="display:flex;gap:8px;margin-bottom:12px;">'+
      '<button id="btn-so-placa" onclick="toggleBancadaModo()" style="flex:1;padding:10px;border-radius:8px;border:1px solid '+(isModoPlaca?'var(--cyan)':'var(--border)')+';background:'+(isModoPlaca?'rgba(0,229,255,.2)':'rgba(255,255,255,.05)')+';color:'+(isModoPlaca?'var(--cyan)':'var(--text2)')+';font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">'+
        (isModoPlaca?textoEquipamento('🤖 Robô inteiro',r):'🔌 Só a Placa')+
      '</button>'+
    '</div>'+
    '<div style="font-size:11px;color:var(--text3);margin-bottom:10px;">Selecione: ✅ veio · ❌ não veio · — não tem</div>'+
    // CHECKLIST ROBÔ INTEIRO
    '<div id="bancada-itens-div" style="display:'+(isModoPlaca?'none':'block')+';">'+itensHtml+'</div>'+
    // CHECKLIST SÓ A PLACA
    '<div id="bancada-placa-div" style="display:'+(isModoPlaca?'block':'none')+';">'+
      '<div style="background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.2);border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:12px;color:var(--cyan2);">🔌 Modo Só a Placa — informe os componentes que vieram</div>'+
      itensPlacaHtml+
    '</div>'+
    '<div class="form-group" style="margin-top:12px;"><label class="form-label">Observações dos itens</label>'+
    '<textarea id="bancada-obs-itens" class="form-input" style="min-height:50px;" placeholder="Ex: veio só o suporte, sem o pano...">'+esc(saved.obsItens||'')+'</textarea>'+botaoIATexto('bancada-obs-itens')+'</div>'+
    '<div class="form-group"><label class="form-label">Veio de outra assistência?</label>'+
    '<div style="display:flex;gap:8px;">'+
      '<button onclick="setBancadaExtra(\'outra\',\'sim\')" id="outra-sim" style="'+bancadaBtnStyle2('sim',outraAss)+'">Sim</button>'+
      '<button onclick="setBancadaExtra(\'outra\',\'nao\')" id="outra-nao" style="'+bancadaBtnStyle2('nao',outraAss)+'">Não</button>'+
    '</div></div>'+
    '<div class="form-group"><label class="form-label">Selo de garantia</label>'+
    '<div style="display:flex;gap:8px;">'+
      '<button onclick="setBancadaExtra(\'selo\',\'intacto\')" id="selo-intacto" style="'+bancadaBtnStyle2('intacto',selo)+'">🔒 Intacto</button>'+
      '<button onclick="setBancadaExtra(\'selo\',\'violado\')" id="selo-violado" style="'+bancadaBtnStyle2('violado',selo)+'">⚠️ Violado</button>'+
      '<button onclick="setBancadaExtra(\'selo\',\'sem\')" id="selo-sem" style="'+bancadaBtnStyle2('sem',selo)+'">❌ Sem selo</button>'+
    '</div></div>'+
    '<div class="form-group"><label class="form-label">Observação geral</label>'+
    '<textarea id="bancada-obs" class="form-input" style="min-height:60px;" placeholder="Estado geral, observações importantes...">'+esc(saved.obs||'')+'</textarea>'+botaoIATexto('bancada-obs')+'</div>'+
    '<div class="modal-actions">'+
      '<button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
      '<button class="btn btn-primary" onclick="salvarBancadaComVerificacao(\''+roboId+'\')">💾 Salvar</button>'+
      '<button class="btn btn-wa" onclick="salvarBancadaComVerificacao(\''+roboId+'\',true)">📱 Salvar e Enviar WhatsApp</button>'+
    '</div>'
  );
  window._bancadaEstado=JSON.parse(JSON.stringify(saved));
  if(!window._bancadaEstado.itens)window._bancadaEstado.itens={};
  if(!window._bancadaEstado.itensPlaca)window._bancadaEstado.itensPlaca={};
  setTimeout(function(){
    var bsn=document.getElementById('bancada-sn'),bno=document.getElementById('bancada-nosn');
    if(bsn&&bno&&bno.checked){bsn.value='';bsn.disabled=true;}
    checklistAtual.forEach(function(item){
      var estado=window._bancadaEstado.itens[item.id]||'';
      var bv=document.getElementById('bi-veio-'+item.id);var bn=document.getElementById('bi-nao-'+item.id);var bs=document.getElementById('bi-sem-'+item.id);
      if(bv)bv.style.cssText=bancadaBtnStyle('veio',estado);
      if(bn)bn.style.cssText=bancadaBtnStyle('nao',estado);
      if(bs)bs.style.cssText=bancadaBtnStyle('',estado);
    });
    CHECKLIST_PLACA.forEach(function(item){
      var estado=window._bancadaEstado.itensPlaca[item.id]||'';
      var bv=document.getElementById('bpi-veio-'+item.id);var bn=document.getElementById('bpi-nao-'+item.id);var bs=document.getElementById('bpi-sem-'+item.id);
      if(bv)bv.style.cssText=bancadaBtnStyle('veio',estado);
      if(bn)bn.style.cssText=bancadaBtnStyle('nao',estado);
      if(bs)bs.style.cssText=bancadaBtnStyle('',estado);
    });
    var outra=window._bancadaEstado.outraAssistencia||'';
    var selo=window._bancadaEstado.selo||'';
    ['sim','nao'].forEach(function(t){var b=document.getElementById('outra-'+t);if(b)b.style.cssText=bancadaBtnStyle2(t,outra);});
    ['intacto','violado','sem'].forEach(function(t){var b=document.getElementById('selo-'+t);if(b)b.style.cssText=bancadaBtnStyle2(t,selo);});
  },50);
}

function bancadaBtnStyle(tipo,atual){
  var base='border-radius:6px;padding:4px 10px;font-size:14px;cursor:pointer;border:1px solid ';
  if(tipo===atual){
    if(tipo==='veio')return base+'#00e676;background:rgba(0,230,118,.2);';
    if(tipo==='nao')return base+'#ff1744;background:rgba(255,23,68,.2);';
    return base+'#555;background:rgba(100,100,100,.2);color:#888;';
  }
  return base+'var(--border);background:var(--bg3);color:var(--text3);';
}

function bancadaBtnStyle2(tipo,atual){
  var base='flex:1;border-radius:8px;padding:8px;font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;border:1px solid ';
  if(tipo===atual)return base+'var(--cyan);background:rgba(0,229,255,.15);color:var(--cyan);';
  return base+'var(--border);background:var(--bg2);color:var(--text3);';
}

function setBancadaItem(id,estado){
  if(!window._bancadaEstado)window._bancadaEstado={itens:{}};
  if(!window._bancadaEstado.itens)window._bancadaEstado.itens={};
  window._bancadaEstado.itens[id]=estado;
  ['veio','nao',''].forEach(function(t){
    var btn=document.getElementById('bi-'+(t||'sem')+'-'+id);
    if(btn)btn.style.cssText=bancadaBtnStyle(t,estado).replace('border-radius','border-radius');
  });
  // rerender buttons
  var bv=document.getElementById('bi-veio-'+id);
  var bn=document.getElementById('bi-nao-'+id);
  var bs=document.getElementById('bi-sem-'+id);
  if(bv)bv.style.cssText=bancadaBtnStyle('veio',estado);
  if(bn)bn.style.cssText=bancadaBtnStyle('nao',estado);
  if(bs)bs.style.cssText=bancadaBtnStyle('',estado);
}

function setBancadaExtra(tipo,val){
  if(!window._bancadaEstado)window._bancadaEstado={};
  window._bancadaEstado[tipo===('outra')?'outraAssistencia':'selo']=val;
  // update buttons
  if(tipo==='outra'){
    var bs=document.getElementById('outra-sim');var bn=document.getElementById('outra-nao');
    if(bs)bs.style.cssText=bancadaBtnStyle2('sim',val);
    if(bn)bn.style.cssText=bancadaBtnStyle2('nao',val);
  } else {
    ['intacto','violado','sem'].forEach(function(t){
      var b=document.getElementById('selo-'+t);if(b)b.style.cssText=bancadaBtnStyle2(t,val);
    });
  }
}

function salvarBancada(roboId,enviarWA){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var snEl=document.getElementById('bancada-sn'),noSnEl=document.getElementById('bancada-nosn');
  var noSn=!!(noSnEl&&noSnEl.checked),sn=limparSN(snEl?snEl.value:'');
  if(!noSn&&!temSnValido(sn)){alert('Antes de dar entrada na bancada, informe o Código/SN ou marque “Sem código/SN visível”.');return;}
  r.sn=noSn?'SEM CÓDIGO':sn;
  r.snOrigem=noSn?'sem_codigo_bancada':((snEl&&snEl.dataset&&snEl.dataset.snOrigem)||'bancada_manual');
  r.snData=todayISO();
  r.snConfirmadoBancada=true;
  if(!window._bancadaEstado)window._bancadaEstado={itens:{}};
  if(!window._bancadaEstado.itens)window._bancadaEstado.itens={};
  window._bancadaEstado.obsItens=document.getElementById('bancada-obs-itens')?document.getElementById('bancada-obs-itens').value:'';
  window._bancadaEstado.obs=document.getElementById('bancada-obs')?document.getElementById('bancada-obs').value:'';
  window._bancadaEstado.data=todayISO();
  window._bancadaEstado.modo=_bancadaModo;
  // deep copy para garantir que itens são salvos corretamente
  r.bancada=JSON.parse(JSON.stringify(window._bancadaEstado));
  r.entradaBancada=true;
  saveDB();
  if(enviarWA&&c){
    var msg=gerarMsgBancada(r,c);
    var wa=c.whatsapp.replace(/\D/g,'');
    if(wa.length===11)wa='55'+wa;
    closeModal();
    window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank');
    if(!r.mensagens)r.mensagens=[];r.mensagens.push({data:todayISO(),tipo:'bancada'});if(precisaDesculpaAtraso(r))r.desculpaAtrasoEnviada=true;saveDB();
    showToast('🔧 Bancada salva e WhatsApp aberto!');
  } else {
    closeModal();
    showToast('🔧 Entrada na bancada salva!');
  }
  // força refresh da ficha se estiver aberta
  if(fichaClienteId)refreshFichaContent();
}
