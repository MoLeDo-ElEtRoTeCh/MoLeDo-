['imprimirSelecionadas','zebraExecutarProximoLote','zebraConsultarPendente',
 'zebraRetomarPendente','zebraContinuarLote','zebraCancelarLote',
 'zebraFinalizarLote','zebraFinalizarUsbSent','zebraEncerrarFalha',
 'zebraResolverUncertain'].forEach(function(name){
  var original=window[name];
  window[name]=async function(){
    var args=arguments;
    try{
      if(!navigator.locks)throw new Error('Navegador sem bloqueio seguro entre abas. Use Chrome/Edge atualizado em HTTPS.');
      return await navigator.locks.request('moledo-zebra01-bitmap',function(){return original.apply(window,args);});
    }catch(e){
      zebraPararPolling();zebraPararLoteTimer();
      showToast('⚠️ Impressão pausada: '+(e.message||e)+'. Nenhum reenvio automático.',10000);
    }
  };
});