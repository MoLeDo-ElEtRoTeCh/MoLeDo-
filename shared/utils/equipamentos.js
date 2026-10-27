function equipamentoEhOutro(r){return !!r&&r.tipoEquipamento==='outro';}
function nomeEquipamento(r){return equipamentoEhOutro(r)?String(r.nomeTipoEquipamento||'Equipamento').trim():({robo:'Robô',robo_base:'Robô + base',robo_estacao:'Robô + estação',placa_robo:'Placa do robô',placa_estacao:'Placa da estação'})[r&&r.tipoEquipamento]||'Robô';}
function descricaoEquipamento(r){
  if(!equipamentoEhOutro(r))return r?r.modelo:undefined;
  var modelo=String(r.modelo||'—');
  var tipo=nomeEquipamento(r);
  return modelo==='—'||!modelo?tipo:modelo.indexOf(tipo+' · ')===0?modelo:tipo+' · '+modelo;
}
function textoEquipamento(texto,r,apenasTexto){
  if(!equipamentoEhOutro(r))return texto;
  return String(texto).replace(/(^|[^\p{L}])robôs?(?=$|[^\p{L}])/giu,function(_,antes){return antes+(apenasTexto?nomeEquipamento(r):esc(nomeEquipamento(r)));});
}
function alternarOutroEquipamento(n){
  var outro=document.getElementById('ci-tipo-equip-'+n).value==='outro';
  var box=document.getElementById('ci-outro-wrap-'+n),campo=document.getElementById('ci-outro-'+n);
  if(box)box.style.display=outro?'block':'none';if(campo)campo.required=outro;
}
function equipamentoFisicamenteComigo(r){
  if(!r||r._cancelado||r.status==='cancelado')return false;
  if(r&&r.status==='reparo'&&!r.dataEntrega&&(r.mensagens||[]).some(function(m){return m.tipo==='voltouReparo';}))return true;
  return !!r&&!r._cancelado&&r.status!=='cancelado'&&r.entregue!==true&&!r.dataEntrega&&(r.status==='reparo'||r.status==='garantia');
}
function situacaoEquipamento(r){
  if(r.status==='reparo'&&!r.dataEntrega&&(r.mensagens||[]).some(function(m){return m.tipo==='voltouReparo';}))return 'Retorno de garantia · '+(r.servicoPronto?'Aguardando retirada':r.aguardandoPeca?'Aguardando peça':r.diagnostico?'Diagnóstico':r.bancada||r.entradaBancada?'Bancada':'Em reparo');
  if(r.entregue===true||r.dataEntrega)return 'Entregue';
  if(r.servicoPronto)return 'Aguardando retirada / serviço pronto';
  if(r.aguardandoPeca)return 'Aguardando peça';
  if(r.status==='garantia')return 'Garantia na assistência';
  if(r.diagnostico)return 'Diagnóstico';
  if(r.bancada||r.entradaBancada)return 'Bancada';
  return 'Em reparo';
}

function adaptarFichaPublica(el,d){
  if(!equipamentoEhOutro(d))return;
  el.querySelectorAll('button[onclick]').forEach(function(botao){
    var acao=botao.getAttribute('onclick')||'',numero=acao.match(/https:\/\/wa\.me\/(\d+)/);
    if(numero&&acao.indexOf('ficha do meu robô')>=0)botao.onclick=function(){
      var texto='Olá! Vi a ficha do meu '+nomeEquipamento(d)+(d.status==='cancelado'?' e gostaria de retomar o serviço.':' e quero falar sobre ele.');
      window.open('https://wa.me/'+numero[1]+'?text='+encodeURIComponent(texto),'_blank');
    };
  });
  var walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),no;
  while((no=walker.nextNode()))if(!/Robôs Aspiradores/i.test(no.nodeValue))no.nodeValue=textoEquipamento(no.nodeValue,d,true);
}

function textoListaEquipamentos(texto,lista){
  return lista.some(equipamentoEhOutro)?String(texto).replace(/robô\(s\)|robôs/giu,'equipamentos').replace(/robô/giu,'equipamento'):texto;
}
