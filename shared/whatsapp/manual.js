// Manual adapter: only an explicit UI action opens the existing wa.me flow.
function abrirMensagemManual(clienteId,mensagem){
  var c=DB.clientes.find(function(x){return x.id===clienteId;});if(!c){showToast('Responsável não encontrado.');return false;}
  var wa=(c.whatsapp||'').replace(/\D/g,'');
  if(wa.length>=10&&!wa.startsWith('55'))wa='55'+wa;
  if(wa.length<10){showToast('Confira o WhatsApp do responsável.');return false;}
  var janela=window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(mensagem),'_blank','noopener');
  return true;
}
var adaptadorCobrancaManual={nome:'manual',preparar:function(clienteId,mensagem){return abrirMensagemManual(clienteId,mensagem);}};
