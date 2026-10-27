function processarFotoSN(input){
  var file=input&&input.files&&input.files[0];
  if(!file)return;
  // Permite selecionar novamente a mesma foto caso seja necessário repetir a leitura.
  try{input.value='';}catch(_){ }
  if(!file.type||file.type.indexOf('image/')!==0){showToast('⚠️ Selecione uma imagem.');return;}
  showToast('📷 Lendo etiqueta...');

  // Primeiro tenta o código de barras/QR localmente. É mais rápido e não depende da IA.
  detectarCodigoSNLocal(file).then(function(snLocal){
    if(snLocal&&temSnValido(snLocal)){
      snFluxo.resultado={sn:snLocal,confianca:'alta (código de barras)'};
      confirmarSNReconhecido(snLocal,'alta (código de barras)');
      return null;
    }
    showToast('📷 Código não identificado. Analisando a foto com IA...');
    return reduzirImagemSN(file,1800,0.88).then(function(dataUrl){
      return fetch('https://moledo-ia.moledoeletrotech.workers.dev/',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({modo:'leitura_sn',image:dataUrl})
      });
    });
  }).then(async function(resp){
    if(!resp)return null; // leitura local já resolveu
    var raw=await resp.text();
    var data=null;
    try{data=JSON.parse(raw);}catch(e){
      var m=String(raw||'').replace(/```json/gi,'').replace(/```/g,'').match(/\{[\s\S]*\}/);
      if(m)try{data=JSON.parse(m[0]);}catch(e2){}
    }
    if(!resp.ok){
      var detalhe=(data&&(data.detail||data.error))||raw.substring(0,300)||('Servidor respondeu HTTP '+resp.status);
      throw new Error(detalhe);
    }
    return data||{};
  }).then(function(data){
    if(data===null)return;
    if(data.error)throw new Error(data.detail||data.error);
    var sn=limparSN(data.sn||'');
    if(!temSnValido(sn))throw new Error('A IA não conseguiu identificar um SN com segurança.');
    snFluxo.resultado={sn:sn,confianca:data.confianca||'não informada'};
    confirmarSNReconhecido(sn,data.confianca||'não informada');
  }).catch(function(e){
    var detalhe=e&&e.message?e.message:String(e||'Erro desconhecido');
    openModal('<div class="modal-title">⚠️ Não consegui ler o SN</div>'+ 
      '<div style="font-size:13px;color:var(--text2);line-height:1.45;">'+esc(detalhe)+'<br><br>Tente aproximar a câmera da etiqueta, evitar reflexo e manter o SN em foco. Você também pode digitar manualmente.</div>'+ 
      '<div class="modal-actions"><button class="btn btn-close" onclick="iniciarFluxoSN(\''+snFluxo.roboId+'\',\''+snFluxo.tipo+'\')">↩ Tentar novamente</button></div>');
  });
}

function processarFotoSNParaCampo(input,campoId,checkboxId){
  var file=input&&input.files&&input.files[0];
  if(!file)return;
  try{input.value='';}catch(_){ }
  if(!file.type||file.type.indexOf('image/')!==0){showToast('⚠️ Selecione uma imagem.');return;}
  showToast('📷 Lendo SN...');
  detectarCodigoSNLocal(file).then(function(snLocal){
    if(snLocal&&temSnValido(snLocal)){
      preencherSNCampo(campoId,checkboxId,snLocal,'camera_codigo');
      return null;
    }
    showToast('📷 Código não identificado. Analisando a foto com IA...');
    return reduzirImagemSN(file,1800,0.88).then(function(dataUrl){
      return fetch('https://moledo-ia.moledoeletrotech.workers.dev/',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({modo:'leitura_sn',image:dataUrl})
      });
    });
  }).then(async function(resp){
    if(!resp)return null;
    var raw=await resp.text(),data=null;
    try{data=JSON.parse(raw);}catch(e){
      var m=String(raw||'').replace(/```json/gi,'').replace(/```/g,'').match(/\{[\s\S]*\}/);
      if(m)try{data=JSON.parse(m[0]);}catch(_){ }
    }
    if(!resp.ok)throw new Error((data&&(data.detail||data.error))||raw.substring(0,300)||('Servidor respondeu HTTP '+resp.status));
    return data||{};
  }).then(function(data){
    if(data===null)return;
    if(data.error)throw new Error(data.detail||data.error);
    var sn=limparSN(data.sn||'');
    if(!temSnValido(sn))throw new Error('A IA não conseguiu identificar um SN com segurança.');
    preencherSNCampo(campoId,checkboxId,sn,'camera_ia');
  }).catch(function(e){
    showToast('⚠️ Não consegui ler o SN: '+(e&&e.message?e.message:String(e||'Erro desconhecido')),9000);
  });
}
