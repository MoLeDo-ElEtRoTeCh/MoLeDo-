function abrirAgendamento(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var num='#'+String(r.numVisual).padStart(3,'0');
  openModal('<div class="modal-title">📅 Agendamento de Retirada</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:14px;">'+(c?esc(c.nome):'')+' · '+num+'</div>'+
    '<div class="form-group"><label class="form-label">Tipo</label>'+
    '<div style="display:flex;gap:8px;">'+
    '<button type="button" id="ag-retirar" onclick="setAgTipo(\'retirar\')" style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(0,229,255,.4);background:rgba(0,229,255,.15);color:var(--cyan);font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">🏪 Cliente Retira</button>'+
    '<button type="button" id="ag-levar" onclick="setAgTipo(\'levar\')" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--text3);font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">🚗 Eu Entrego</button>'+
    '</div></div>'+
    '<div class="form-group"><label class="form-label">Data</label>'+
    '<input id="agend-data" type="date" class="form-input" value="'+(r.agendamento?r.agendamento.split(' ')[0]:'')+'"></div>'+
    '<div class="form-group"><label class="form-label">Horário</label>'+
    '<input id="agend-hora" type="time" class="form-input" value="'+(r.agendamento?r.agendamento.split(' ')[1]||'':'')+'"></div>'+
    '<div class="form-group"><label class="form-label">Observação</label>'+
    '<input id="agend-obs" class="form-input" type="text" placeholder="Ex: vai buscar pessoalmente..." value="'+esc(r.agendamentoObs||'')+'"></div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-primary" onclick="salvarAgendamento(\''+roboId+'\')">💾 Salvar</button>'+
    (c?'<button class="btn btn-wa" onclick="salvarAgendamento(\''+roboId+'\',true)">📱 Confirmar por WhatsApp</button>':'')+'</div>');
  window._agTipo=r.agendamentoTipo||'retirar';
}

function setAgTipo(tipo){
  window._agTipo=tipo;
  var br=document.getElementById('ag-retirar');
  var bl=document.getElementById('ag-levar');
  if(br)br.style.cssText='flex:1;padding:10px;border-radius:8px;border:1px solid '+(tipo==='retirar'?'rgba(0,229,255,.4);background:rgba(0,229,255,.15);color:var(--cyan)':'var(--border);background:var(--bg2);color:var(--text3)')+';font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;';
  if(bl)bl.style.cssText='flex:1;padding:10px;border-radius:8px;border:1px solid '+(tipo==='levar'?'rgba(0,229,255,.4);background:rgba(0,229,255,.15);color:var(--cyan)':'var(--border);background:var(--bg2);color:var(--text3)')+';font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;';
}

function salvarAgendamento(roboId,enviarWA){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var data=document.getElementById('agend-data').value;
  var hora=document.getElementById('agend-hora').value;
  var obs=document.getElementById('agend-obs').value;
  if(!data){alert('Informe a data.');return;}
  r.agendamento=data+(hora?' '+hora:'');
  r.agendamentoObs=obs;
  r.agendamentoTipo=window._agTipo||'retirar';
  saveDB();
  if(enviarWA&&c){
    var num=r.numOS||('#'+String(r.numVisual).padStart(3,'0'));
    var dataFmt=new Date(data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
    var levar=r.agendamentoTipo==='levar';
    var msg=atendimentoSaudacao(c,'😊')+(atendimentoEhVC(r,c)?'O robô do seu cliente *'+atendimentoClienteFinal(r,c)+'* (*'+num+' — '+esc(r.modelo||'—')+'*) está pronto! ✅🤖\n\n':'Seu robô *'+num+' — '+esc(r.modelo||'—')+'* está pronto! ✅🤖\n\n');
    msg+=(levar?'🚗 *Estarei entregando* até você':'🏪 *Pode vir buscar* aqui')+' no dia:\n';
    msg+='📅 *'+dataFmt+'*\n';
    if(hora)msg+='⏰ *Horário:* '+hora+'\n';
    if(obs)msg+='📝 '+obs+'\n';
    msg+='\n_\n*MoLeDo ElEtRoTeCh*\nReparo é nossa linguagem · Tecnologia é nossa paixão_';
    var wa=c.whatsapp.replace(/\D/g,'');
    if(wa.length===11)wa='55'+wa;
    closeModal();
    window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank');
  } else {
    closeModal();
    showToast('📅 Agendamento salvo!');
  }
}
