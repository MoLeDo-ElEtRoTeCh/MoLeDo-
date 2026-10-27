function saveDB(){if(typeof sincronizarCobrancasPagas==='function')sincronizarCobrancasPagas();try{localStorage.setItem('moledo_v5',JSON.stringify(DB));}catch(e){}
  if(window._fbReady)syncToFirebase();
}

function loadDB(){
  try{var r=localStorage.getItem('moledo_v5');if(r)DB=JSON.parse(r);}catch(e){}
  try{var old=localStorage.getItem('moledo_v4');if(old&&!DB.clientes.length){var o=JSON.parse(old);DB.clientes=o.clientes||[];DB.robos=o.robos||[];DB.lixeira=o.lixeira||[];}}catch(e){}
  if(!DB.clientes)DB.clientes=[];if(!DB.robos)DB.robos=[];if(!DB.lixeira)DB.lixeira=[];if(!DB.catalogo)DB.catalogo=[];if(!DB.defeitosCI)DB.defeitosCI=[];if(!DB.osSeq)DB.osSeq=0;
  if(DB.taxas)Object.assign(TAXAS,DB.taxas);
  DB.robos.forEach(function(r){if(!r.mensagens)r.mensagens=[];if(r.diagnostico===undefined)r.diagnostico=null;});
  // Verificar robôs com peça atrasada
  var hoje2=new Date();hoje2.setHours(0,0,0,0);
  DB.robos.forEach(function(r){
    if(r.aguardandoPeca&&r.aguardandoPeca.dataPrevista&&!r.aguardandoPeca.avisado){
      var dp=new Date(r.aguardandoPeca.dataPrevista+'T00:00:00');
      if(dp<=hoje2){
        r.aguardandoPeca.atrasada=true;
        r.aguardandoPeca.avisado=true;
        var c2=DB.clientes.find(function(x){return x.id===r.clienteId;});
        var num2='#'+String(r.numVisual).padStart(3,'0');
        setTimeout(function(){
          showToast('📦 Peça atrasada! '+num2+' — '+(c2?c2.nome:'?'));
        },2000);
      }
    }
  });
  // MIGRAÇÃO: mover nomeClienteFinal do cliente para o robô (v1)
  if(!DB.migracaoCF){
    DB.clientes.forEach(function(c){
      if(c.nomeClienteFinal&&c.nomeClienteFinal.trim()){
        // pegar todos os robôs desse cliente que não têm nomeClienteFinal
        DB.robos.forEach(function(r){
          if(r.clienteId===c.id&&!r.nomeClienteFinal){
            r.nomeClienteFinal=c.nomeClienteFinal;
          }
        });
        delete c.nomeClienteFinal;
      }
    });
    DB.migracaoCF=true;
    try{localStorage.setItem('moledo_v5',JSON.stringify(DB));}catch(e){}
  }
  if((DB.versaoCatalogo||0)<2){DB.catalogo=CAT_PAD.map(function(x){return Object.assign({id:genId()},x);});DB.versaoCatalogo=2;saveDB();}
  // repopula defeitos do checkin se vazio (inclusive após sync do Firebase)
  if(!DB.defeitosCI||!DB.defeitosCI.length){
    DB.defeitosCI=[];
    DEFEITOS.forEach(function(cat){cat.items.forEach(function(item){DB.defeitosCI.push({id:genId(),cat:cat.cat,nome:item,ativo:true});});});
    saveDB();
  }
}
