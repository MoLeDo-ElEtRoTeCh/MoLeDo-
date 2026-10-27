function atendimentoPago(r){return !!r&&(r.pago===true||r.servicoProntoPago===true);}
function localizarAtendimentoCobranca(id){return DB.robos.find(function(r){return r.id===id;});}
function registrarEventoCobranca(r,tipo,detalhes,chave){
  var c=r.cobranca;if(!c)return false;
  if(!c.historico)c.historico=[];
  if(chave&&c.historico.some(function(e){return e.chave===chave;}))return false;
  c.historico.push({tipo:tipo,em:new Date().toISOString(),dataPrometida:c.dataPrometida,promessaId:c.promessaId,detalhes:detalhes||'',chave:chave||genId()});return true;
}
function sincronizarCobrancasPagas(){
  var registros=DB.robos.concat((DB.lixeira||[]).filter(function(x){return x.robo;}).map(function(x){return x.robo;}));
  registros.forEach(function(r){if(r.cobranca&&atendimentoPago(r)){
    r.cobranca.status='paga';r.cobranca.ativa=false;r.cobranca.proximaCobranca=null;
    registrarEventoCobranca(r,'pagamento_confirmado','Atendimento marcado como pago','pagamento|'+r.cobranca.promessaId);
  }});
}
function promessaCobrancaPreparada(c){return (c.historico||[]).some(function(e){return e.chave==='preparacao|'+c.dataPrometida;});}
function estadoCobranca(r,hoje){
  if(!r||!r.cobranca)return 'sem_cobranca';
  var c=r.cobranca;if(atendimentoPago(r)||c.status==='paga')return 'paga';
  if(c.status==='cancelada')return 'cancelada';if(c.status==='pausada'||!c.ativa)return 'pausada';
  if((c.historico||[]).some(function(e){return e.chave==='envio|'+c.dataPrometida;}))return 'enviada';
  if(promessaCobrancaPreparada(c))return 'preparada';
  if(!(getValorCobravel(r)>0))return 'sem_valor';
  hoje=hoje||todayISO();if(c.dataPrometida===hoje)return 'vence_hoje';
  return c.dataPrometida<hoje?'atrasada':'proxima';
}
function cobrancaElegivel(r,hoje){var estado=estadoCobranca(r,hoje);return estado==='vence_hoje'||estado==='atrasada';}
function programarCobranca(id,data,hora,observacoes){
  var r=localizarAtendimentoCobranca(id);if(!r)return false;
  if(atendimentoPago(r)){showToast('Atendimento já pago.');return false;}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(data)||isNaN(new Date(data+'T12:00:00').getTime())||new Date(data+'T12:00:00').getDate()!==Number(data.slice(8))){showToast('Informe uma data válida.');return false;}
  if(!(getValorCobravel(r)>0)){showToast('Atendimento sem valor devido.');return false;}
  var anterior=r.cobranca,mesma=anterior&&anterior.dataPrometida===data;
  if(!anterior)r.cobranca={historico:[]};
  var c=r.cobranca,antiga=c.dataPrometida;
  if(!mesma)c.promessaId=genId();
  c.dataPrometida=data;c.horario=hora||'';c.observacoes=observacoes||'';c.ativa=true;c.proximaCobranca=data;
  c.status=mesma&&promessaCobrancaPreparada(c)?'preparada':anterior?'reagendada':'promessa';
  registrarEventoCobranca(r,antiga&&antiga!==data?'reagendamento':'promessa',antiga&&antiga!==data?'De '+antiga+' para '+data:'Promessa para '+data,'promessa|'+c.promessaId);
  saveDB();return true;
}
function pausarCobranca(id,motivo){
  var r=localizarAtendimentoCobranca(id);if(!r||!r.cobranca||atendimentoPago(r))return;
  r.cobranca.status='pausada';r.cobranca.ativa=false;r.cobranca.motivoPausa=motivo||'';
  registrarEventoCobranca(r,'pausa',motivo);saveDB();
}
function reativarCobranca(id){
  var r=localizarAtendimentoCobranca(id);if(!r||!r.cobranca||atendimentoPago(r)||r.cobranca.status==='cancelada')return;
  r.cobranca.ativa=true;r.cobranca.status=promessaCobrancaPreparada(r.cobranca)?'preparada':'promessa';
  registrarEventoCobranca(r,'reativacao','Data preservada: '+r.cobranca.dataPrometida);saveDB();
}
function cancelarCobranca(id,motivo){
  var r=localizarAtendimentoCobranca(id);if(!r||!r.cobranca||atendimentoPago(r))return;
  r.cobranca.status='cancelada';r.cobranca.ativa=false;r.cobranca.proximaCobranca=null;r.cobranca.motivoCancelamento=motivo||'';
  registrarEventoCobranca(r,'cancelamento',motivo);saveDB();
}
function gerarMensagemCobranca(r,incluirPix){
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;}),hora=new Date().getHours();
  var saudacao=hora<12?'Bom dia':hora<18?'Boa tarde':'Boa noite';
  var msg=saudacao+', '+(c?c.nome:'cliente')+'. Tudo bem?\n\nConforme combinamos para '+fmtData(r.cobranca.dataPrometida)+', estou passando para lembrar do pagamento referente ao serviço do seu '+descricaoEquipamento(r)+', OS '+(r.numOS||'—')+', no valor de '+fmtVal(getValorCobravel(r))+'.\n\nSe o pagamento já tiver sido realizado, por favor desconsidere esta mensagem.\n\nSe precisar ajustar alguma informação, pode me avisar por aqui.\n\nObrigado!';
  if(incluirPix)msg+='\n\nPIX (dados atuais do MoLeDo):\n'+gerarPixPayload(null,getValorCobravel(r));return msg;
}
function prepararCobranca(id,repetir){
  var r=localizarAtendimentoCobranca(id);if(!r||!r.cobranca)return false;
  if(atendimentoPago(r)||!r.cobranca.ativa||['paga','cancelada','pausada'].indexOf(r.cobranca.status)>=0){showToast('Cobrança indisponível.');return false;}
  if(!(getValorCobravel(r)>0)){showToast('Atendimento sem valor devido.');return false;}
  var c=r.cobranca;
  if(promessaCobrancaPreparada(c)&&!repetir){
    openModal('<div class="modal-title">Esta promessa já teve uma cobrança preparada.</div><p>Preparar novamente exige confirmação explícita.</p><div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button><button class="btn btn-wa" data-id="'+esc(id)+'" onclick="prepararCobranca(this.dataset.id,true)">Preparar novamente</button></div>');return false;
  }
  var chave=repetir?'repeticao|'+genId():'preparacao|'+c.dataPrometida;
  if(!registrarEventoCobranca(r,repetir?'repeticao_explicita':'preparada_manual','Preparada para envio manual; entrega não confirmada',chave))return false;
  c.preparadaPromessaId=c.promessaId;c.ultimaCobranca=new Date().toISOString();c.proximaCobranca=null;c.status='preparada';saveDB();
  abrirMensagemCobranca(id);return true;
}
function abrirMensagemCobranca(id){
  var r=localizarAtendimentoCobranca(id);if(!r||!r.cobranca||atendimentoPago(r))return;
  openModal('<div class="modal-title">Cobrança pronta — envio MANUAL</div><p>Nenhuma mensagem foi enviada. Revise o texto e use o botão para abrir o WhatsApp.</p><textarea id="cob-mensagem" class="form-input" rows="10">'+esc(gerarMensagemCobranca(r,false))+'</textarea>'+
    '<label><input type="checkbox" data-id="'+esc(id)+'" onchange="atualizarPixCobranca(this.dataset.id,this.checked)"> Incluir PIX atual</label><div class="modal-actions">'+
    '<button class="btn btn-cyan" onclick="copiarMensagemCobranca()">Copiar mensagem</button><button class="btn btn-close" onclick="copiarPixCobranca()">Copiar PIX</button><button class="btn btn-close" data-id="'+esc(id)+'" onclick="mostrarPixCobranca(this.dataset.id)">Ver QR atual</button>'+
    '<button class="btn btn-wa" data-id="'+esc(id)+'" onclick="enviarCobrancaManual(this.dataset.id)">Abrir WhatsApp manualmente</button><button class="btn btn-close" data-id="'+esc(id)+'" onclick="confirmarEnvioCobranca(this.dataset.id)">Registrar envio manual</button><button class="btn btn-close" onclick="abrirPainelCobrancas()">Voltar</button></div>');
}
function atualizarPixCobranca(id,incluir){var r=localizarAtendimentoCobranca(id);if(r)document.getElementById('cob-mensagem').value=gerarMensagemCobranca(r,incluir);}
function copiarMensagemCobranca(){navigator.clipboard.writeText(document.getElementById('cob-mensagem').value).then(function(){showToast('Mensagem copiada.');}).catch(function(){showToast('Selecione o texto para copiar.');});}
function copiarPixCobranca(){navigator.clipboard.writeText(gerarPixPayload()).then(function(){showToast('PIX copiado.');}).catch(function(){showToast('Não foi possível copiar o PIX.');});}
function mostrarPixCobranca(id){var r=localizarAtendimentoCobranca(id);if(!r)return;openModal('<div class="modal-title">PIX atual · '+fmtVal(getValorCobravel(r))+'</div><img alt="QR PIX atual" src="'+esc(gerarPixQrUrl(getValorCobravel(r)))+'" style="max-width:100%"><p>QR/payload atuais preservados; confira o valor no fluxo de pagamento.</p><button class="btn btn-close" data-id="'+esc(id)+'" onclick="abrirMensagemCobranca(this.dataset.id)">Voltar</button>');}
function enviarCobrancaManual(id){
  var r=localizarAtendimentoCobranca(id);if(!r||!r.cobranca||atendimentoPago(r)||!r.cobranca.ativa)return;
  var texto=document.getElementById('cob-mensagem').value;
  var chave='abertura|'+r.cobranca.dataPrometida;var repetida=r.cobranca.historico.some(function(e){return e.chave===chave;});
  if(repetida&&!confirm('A conversa desta promessa já foi aberta. Abrir novamente explicitamente?'))return;
  if(adaptadorCobrancaManual.preparar(r.clienteId,texto)){registrarEventoCobranca(r,'whatsapp_aberto_manual','Conversa aberta pelo usuário; envio/entrega não confirmados',repetida?'reabertura|'+genId():chave);saveDB();}
}
function abrirEditorCobranca(id){
  var r=localizarAtendimentoCobranca(id);if(!r)return;var c=r.cobranca||{};
  openModal('<div class="modal-title">Programar cobrança · '+esc(descricaoEquipamento(r))+'</div><div>OS '+esc(r.numOS||'—')+' · '+fmtVal(getValorCobravel(r))+'</div><label>Data prometida<input id="cob-data" type="date" class="form-input" value="'+esc(c.dataPrometida||todayISO())+'"></label><label>Horário de referência (sem envio automático)<input id="cob-hora" type="time" class="form-input" value="'+esc(c.horario||'')+'"></label><label>Observações<textarea id="cob-obs" class="form-input">'+esc(c.observacoes||'')+'</textarea></label><div class="modal-actions"><button class="btn btn-cyan" data-id="'+esc(id)+'" onclick="salvarEditorCobranca(this.dataset.id)">Salvar promessa</button><button class="btn btn-close" onclick="abrirPainelCobrancas()">Voltar</button></div>');
}
function salvarEditorCobranca(id){if(programarCobranca(id,document.getElementById('cob-data').value,document.getElementById('cob-hora').value,document.getElementById('cob-obs').value))abrirPainelCobrancas();}
function acaoCobranca(id,acao){
  if(acao==='reativar')reativarCobranca(id);
  else{var motivo=prompt(acao==='pausar'?'Motivo da pausa:':'Motivo do cancelamento:');if(motivo===null)return;if(acao==='pausar')pausarCobranca(id,motivo);else cancelarCobranca(id,motivo);}
  abrirPainelCobrancas();
}
function historicoCobranca(id){var r=localizarAtendimentoCobranca(id);if(!r||!r.cobranca)return;openModal('<div class="modal-title">Histórico da cobrança</div>'+r.cobranca.historico.map(function(e){return '<div class="card">'+esc(new Date(e.em).toLocaleString('pt-BR'))+' · '+esc(e.tipo)+'<div>'+esc(e.detalhes)+'</div></div>';}).join('')+'<button class="btn btn-close" onclick="abrirPainelCobrancas()">Voltar</button>');}
function abrirPainelCobrancas(){
  var grupos={vence_hoje:[],atrasada:[],proxima:[],preparada:[],enviada:[],sem_valor:[],pausada:[],paga:[],cancelada:[]},nomes={vence_hoje:'Vence hoje',atrasada:'Atrasadas sem nova promessa',proxima:'Próximas',preparada:'Preparadas manualmente',enviada:'Cobrança enviada (confirmação manual)',sem_valor:'Sem valor devido — revisar',pausada:'Pausadas',paga:'Pagas recentemente',cancelada:'Canceladas'};
  DB.robos.forEach(function(r){if(r.cobranca)grupos[estadoCobranca(r)].push(r);});
  var html='<div id="cobrancas-painel"></div><div class="modal-title">FINANCEIRO · COBRANÇAS</div><p>Uma cobrança por promessa. Nenhum envio automático.</p><label>Nova promessa<select id="cob-nova" class="form-input"><option value="">Selecione atendimento</option>'+DB.robos.filter(function(r){return !atendimentoPago(r)&&getValorCobravel(r)>0;}).map(function(r){var c=DB.clientes.find(function(x){return x.id===r.clienteId;});return '<option value="'+esc(r.id)+'">'+esc((c?c.nome:'—')+' · '+descricaoEquipamento(r)+' · '+(r.numOS||'#'+r.numVisual))+'</option>';}).join('')+'</select></label><button class="btn btn-cyan" onclick="if(document.getElementById(\'cob-nova\').value)abrirEditorCobranca(document.getElementById(\'cob-nova\').value)">Programar / reagendar</button>';
  Object.keys(grupos).forEach(function(estado){var lista=grupos[estado];html+='<div class="section-title">'+nomes[estado]+' · '+lista.length+'</div>'+lista.map(function(r){var c=DB.clientes.find(function(x){return x.id===r.clienteId;});return '<div class="card"><strong>'+esc(c?c.nome:'—')+' · '+esc(descricaoEquipamento(r))+'</strong><div>OS '+esc(r.numOS||'—')+' · '+fmtVal(getValorCobravel(r))+' · Promessa '+fmtData(r.cobranca.dataPrometida)+'</div><div>'+(estado==='proxima'?(r.cobranca.status==='reagendada'?'REAGENDADA':'PROMESSA DE PAGAMENTO'):nomes[estado])+'</div><div class="robot-actions">'+(estado!=='paga'?'<button class="btn btn-cyan" data-id="'+esc(r.id)+'" onclick="abrirEditorCobranca(this.dataset.id)">Reagendar</button>':'')+(['paga','pausada','cancelada','sem_valor'].indexOf(estado)<0?'<button class="btn btn-wa" data-id="'+esc(r.id)+'" onclick="prepararCobranca(this.dataset.id)">COBRAR AGORA</button><button class="btn btn-close" data-id="'+esc(r.id)+'" onclick="acaoCobranca(this.dataset.id,\'pausar\')">Pausar</button>':'')+(estado==='pausada'?'<button class="btn btn-cyan" data-id="'+esc(r.id)+'" onclick="acaoCobranca(this.dataset.id,\'reativar\')">Reativar</button>':'')+(['paga','cancelada'].indexOf(estado)<0?'<button class="btn btn-close" data-id="'+esc(r.id)+'" onclick="acaoCobranca(this.dataset.id,\'cancelar\')">Cancelar</button><button class="btn btn-green" data-id="'+esc(r.id)+'" onclick="marcarRoboPago(this.dataset.id)">Marcar pago</button>':'')+'<button class="btn btn-close" data-id="'+esc(r.id)+'" onclick="historicoCobranca(this.dataset.id)">Histórico</button></div></div>';}).join('');});
  openModal(html+'<div class="modal-actions"><button class="btn btn-close" onclick="abrirResumoFinanceiro()">Voltar ao Financeiro</button><button class="btn btn-close" onclick="closeModal()">Fechar</button></div>');
}

var _cobDiaPainel=todayISO();
setInterval(function(){var hoje=todayISO();if(hoje!==_cobDiaPainel){_cobDiaPainel=hoje;if(document.getElementById('cobrancas-painel'))abrirPainelCobrancas();}},60000);

function confirmarEnvioCobranca(id){
  var r=localizarAtendimentoCobranca(id);
  if(!r||!r.cobranca||!r.cobranca.ativa||atendimentoPago(r)||!promessaCobrancaPreparada(r.cobranca))return false;
  if(!confirm('Confirma que você enviou esta cobrança manualmente?'))return false;
  if(!registrarEventoCobranca(r,'envio_confirmado_manual','Envio declarado pelo usuário; sem integração automática','envio|'+r.cobranca.dataPrometida))return false;
  r.cobranca.status='enviada';r.cobranca.ultimaCobranca=new Date().toISOString();r.cobranca.proximaCobranca=null;saveDB();abrirPainelCobrancas();return true;
}
