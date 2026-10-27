function publicarFichaCancelada(r,c){
  try{
    var dadosPub={
      numOS:r.numOS||('#'+String(r.numVisual).padStart(3,'0')),
      modelo:r.modelo||'',
      voltagem:r.voltagem||'',
      dataEntrada:r.dataEntrada||'',
      diagnostico:r.diagnostico||null,
      whatsapp:'5544999724074',
      status:'cancelado',
      canceladoEm:todayISO(),
      updatedAt:Date.now()
    };
    import('https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js').then(function(fs){
      import('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js').then(function(fa){
        var apps=fa.getApps?fa.getApps():[];
        if(!apps.length)return;
        var db2=fs.getFirestore(apps[0]);
        fs.setDoc(fs.doc(db2,'publico',r.id),dadosPub)
          .then(function(){showToast('🔴 Ficha de cancelamento publicada!');})
          .catch(function(e){console.log('pub cancel err',e);});
      });
    });
  }catch(e){console.log('publicarFichaCancelada err',e);}
}

function republicarFichaPublica(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  showToast('🔄 Publicando ficha...');
  try{
    import('https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js').then(function(fs){
      import('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js').then(function(fa){
        var apps=fa.getApps?fa.getApps():[];
        if(!apps.length){showToast('⚠️ Firebase não conectado.');return;}
        var db2=fs.getFirestore(apps[0]);
        var dadosPub={
          numOS:r.numOS||('#'+String(r.numVisual).padStart(3,'0')),
          modelo:r.modelo||'',
          voltagem:r.voltagem||'',
          dataEntrada:r.dataEntrada||'',
          dataEntrega:r.dataEntrega||'',
          garantiaAte:r.garantiaAte||'',
          itens:r.bancada&&r.bancada.itens?r.bancada.itens:{},
          whatsapp:c?c.whatsapp:'',
          updatedAt:Date.now()
        };
        fs.setDoc(fs.doc(db2,'publico',roboId),dadosPub)
          .then(function(){showToast('✅ Ficha publicada! QR já funciona.');})
          .catch(function(e){showToast('⚠️ Erro ao publicar: '+e.message);});
      });
    });
  }catch(e){showToast('⚠️ Erro: '+e.message);}
}
