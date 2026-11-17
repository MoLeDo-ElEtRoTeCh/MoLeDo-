var notaEtiquetaPrevia=null;

function abrirNotaRapida(roboId,rascunho){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  notaEtiquetaPrevia=null;
  var num='#'+String(r.numVisual).padStart(3,'0');
  var texto=rascunho===undefined?(r.notaRapida||''):rascunho;
  openModal('<div class="modal-title">📝 Nota Rápida — '+num+'</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:10px;">'+esc(descricaoEquipamento(r)||'—')+' · Bloco de notas deste robô</div>'+
    '<textarea id="nota-rapida-txt" class="form-input" style="min-height:180px;font-size:16px;line-height:1.5;" placeholder="Escreva as observações e os detalhes deste robô...">'+esc(texto)+'</textarea>'+botaoIATexto('nota-rapida-txt')+
    '<div style="font-size:12px;color:var(--text2);margin-top:8px;">Imprimir abre uma prévia. Notas longas continuam em outras etiquetas, sem reduzir a letra.</div>'+
    '<div class="modal-actions" style="flex-wrap:wrap;"><button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-primary" onclick="salvarNotaRapida(\''+roboId+'\')">💾 Salvar</button>'+
    '<button class="btn btn-cyan" onclick="abrirPreviaNotaEtiqueta(\''+roboId+'\')">🏷️ Imprimir etiqueta</button></div>');
}

function salvarNotaRapida(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  r.notaRapida=document.getElementById('nota-rapida-txt').value.trim();
  saveDB();closeModal();renderAll();showToast('📝 Nota salva!');
}

// Fixed readable font, no ellipsis: all text is carried into subsequent pages.
function notaDividirLinhas(ctx,texto){
  var normalizado=String(texto).replace(/\r\n?/g,'\n').replace(/\t/g,'    ');
  if(normalizado.length>50000)throw new Error('Nota muito extensa para uma impressão. Divida em partes menores. O texto não será cortado.');
  var linhas=[];
  zebraSetFont(ctx,20,700);
  normalizado.split('\n').forEach(function(paragrafo){
    var chars=Array.from(paragrafo);
    if(!chars.length)linhas.push('');
    while(chars.length){
      var n=0,ultimoEspaco=0;
      while(n<chars.length&&ctx.measureText(chars.slice(0,n+1).join('')).width<=452){
        if(chars[n]===' ')ultimoEspaco=n+1;
        n++;
      }
      if(!n)throw new Error('Um caractere não cabe na etiqueta. Revise a nota.');
      if(n<chars.length&&ultimoEspaco)n=ultimoEspaco;
      linhas.push(chars.splice(0,n).join(''));
      if(linhas.length>600)throw new Error('A nota ultrapassa 100 etiquetas. Divida em partes menores; nada foi impresso.');
    }
  });
  if(linhas.length>600)throw new Error('A nota ultrapassa 100 etiquetas. Divida em partes menores; nada foi impresso.');
  return linhas;
}

async function notaRenderizarEtiquetas(r,c,texto){
  if(!String(texto).trim())throw new Error('Escreva uma nota antes de imprimir.');
  await zebraAguardarFontes();
  var template=await zebraCarregarTemplate();
  var medir=document.createElement('canvas').getContext('2d');
  var linhas=notaDividirLinhas(medir,texto),total=Math.ceil(linhas.length/6),paginas=[];
  var nome=zebraNomeLista(r,c)||'CLIENTE',modelo=descricaoEquipamento(r)||'—';
  for(var i=0;i<total;i++){
    var canvas=document.createElement('canvas');canvas.width=480;canvas.height=320;
    var ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#fff';ctx.fillRect(0,0,480,320);
    ctx.drawImage(template,0,0,480,320);
    ctx.fillStyle='#fff';ctx.fillRect(0,72,480,188);
    zebraDrawFit(ctx,String(Number(r.numVisual||0)).padStart(3,'0'),397,54,75,31,12,800);
    var identificacao=String(nome+' · '+modelo).toUpperCase();
    zebraSetFont(ctx,18,800);
    if(ctx.measureText(identificacao).width<=452){
      zebraDrawFit(ctx,identificacao,14,98,452,23,18,800);
    }else{
      // A long customer name must never push the model out of the label.
      zebraDrawFit(ctx,String(nome).toUpperCase(),14,98,250,23,18,800);
      zebraDrawFit(ctx,'·',270,98,16,23,18,800);
      zebraDrawFit(ctx,String(modelo).toUpperCase(),292,98,174,23,18,800);
    }
    zebraSetFont(ctx,20,700);
    var trecho=linhas.slice(i*6,(i+1)*6);
    trecho.forEach(function(linha,j){ctx.fillText(linha,14,124+j*23);});
    if(total>1){zebraSetFont(ctx,12,700);ctx.textAlign='right';ctx.fillText((i+1)+'/'+total,466,256);ctx.textAlign='left';}
    zebraThresholdCanvas(canvas);
    paginas.push({bitmap:zebraBytesBase64(zebraCanvasParaBytes(canvas)),png:canvas.toDataURL('image/png'),linhas:trecho});
  }
  return paginas;
}

async function abrirPreviaNotaEtiqueta(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});
  var c=r&&DB.clientes.find(function(x){return x.id===r.clienteId;});if(!r||!c)return;
  var campo=document.getElementById('nota-rapida-txt');if(!campo)return;
  var texto=campo.value.trim();
  var previa={roboId:roboId,texto:texto,uid:window._getPrintCurrentUid(),index:0};
  notaEtiquetaPrevia=previa;
  try{
    if(zebraLerPendente()||zebraLerLote()||zebraActionLocked)throw new Error('Há uma impressão em andamento. Conclua ou resolva em Etiquetas antes de imprimir a nota.');
    previa.paginas=await notaRenderizarEtiquetas(r,c,texto);
    if(notaEtiquetaPrevia!==previa)return;
    var total=previa.paginas.length;
    openModal('<div class="modal-title">🏷️ Prévia da nota · #'+String(r.numVisual||0).padStart(3,'0')+'</div>'+
      '<p style="font-size:13px;color:var(--text2);">'+(total===1?'Uma etiqueta de 60 × 40 mm.':'Esta nota ocupa <b>'+total+' etiquetas</b>. O texto continua nas páginas seguintes, com a mesma letra.')+'</p>'+
      '<div style="background:white;"><img id="nota-etiqueta-imagem" alt="Prévia da etiqueta da nota" src="'+previa.paginas[0].png+'" style="display:block;width:100%;height:auto;image-rendering:pixelated;"></div>'+
      '<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:12px 0;"><button id="nota-pagina-anterior" class="btn btn-close" onclick="notaMudarPagina(-1)" disabled>Anterior</button><span id="nota-pagina-contador">1/'+total+'</span><button id="nota-pagina-proxima" class="btn btn-close" onclick="notaMudarPagina(1)" '+(total===1?'disabled':'')+'>Próxima</button></div>'+
      '<p style="font-size:12px;color:var(--text2);">Ao confirmar, a nota será salva neste robô e todas as páginas serão impressas. A etiqueta de garantia permanece separada.</p>'+
      '<div class="modal-actions" style="flex-wrap:wrap;"><button class="btn btn-close" onclick="notaVoltarEdicao()">Voltar e editar</button><button class="btn btn-green" onclick="zebraImprimirNota()">Salvar e imprimir '+total+' etiqueta(s)</button></div>');
  }catch(e){if(notaEtiquetaPrevia===previa)notaEtiquetaPrevia=null;showToast('⚠️ '+(e.message||e),8000);}
}

function notaMudarPagina(delta){
  var p=notaEtiquetaPrevia;if(!p||!p.paginas)return;
  p.index=Math.max(0,Math.min(p.paginas.length-1,p.index+delta));
  document.getElementById('nota-etiqueta-imagem').src=p.paginas[p.index].png;
  document.getElementById('nota-pagina-contador').textContent=(p.index+1)+'/'+p.paginas.length;
  document.getElementById('nota-pagina-anterior').disabled=p.index===0;
  document.getElementById('nota-pagina-proxima').disabled=p.index===p.paginas.length-1;
}

function notaVoltarEdicao(){
  var p=notaEtiquetaPrevia;if(p)abrirNotaRapida(p.roboId,p.texto);
}

function zebraPayloadPaginaNota(snapshot,item){
  var paginas=snapshot&&snapshot.paginas;
  if(!Array.isArray(paginas)||!Number.isInteger(item.pageIndex)||item.pageIndex<0||item.pageIndex>=paginas.length)throw new Error('Página da nota inválida. Nenhum reenvio.');
  var data=paginas[item.pageIndex];
  if(typeof data!=='string'||data.length!==25600||!/^[A-Za-z0-9+/]{25600}$/.test(data))throw new Error('Imagem da nota inválida.');
  return {job_id:item.jobId,printer_id:ZEBRA_PRINTER_ID,bitmap:{width:480,height:320,bytes_per_row:60,encoding:'base64',data:data}};
}

async function zebraImprimirNota(){
  var p=notaEtiquetaPrevia;if(!p||!p.paginas)return;
  if(zebraActionLocked||zebraLerPendente()||zebraLerLote()||Date.now()<zebraCooldownUntil)throw new Error('Aguarde ou resolva a impressão atual em Etiquetas.');
  zebraActionLocked=true;
  try{
    var ctx=await window._getPrintAuthContext(false);zebraCheckUid(ctx.uid);
    if(ctx.uid!==p.uid)throw new Error('Conta alterada. Abra novamente a prévia da nota.');
    var r=DB.robos.find(function(x){return x.id===p.roboId;});
    if(!r||r._cancelado||!['reparo','garantia'].includes(r.status))throw new Error('Robô indisponível para impressão.');
    if(p.paginas.length<1||p.paginas.length>100)throw new Error('Quantidade de páginas inválida.');
    var items=p.paginas.map(function(_,index){return {roboId:r.id,numVisual:r.numVisual,pageIndex:index,jobId:crypto.randomUUID().toLowerCase(),state:'not_sent'};});
    var snapshots=Object.create(null);snapshots[r.id]={paginas:p.paginas.map(function(pg){return pg.bitmap;})};
    r.notaRapida=p.texto;saveDB();
    zebraSalvarLote({v:2,kind:'nota',uid:ctx.uid,items:items,snapshots:snapshots,index:0,completed:[],state:'running',createdAt:Date.now()});
    notaEtiquetaPrevia=null;closeModal();_etqSecao='robo';switchTab('etiqueta');
    zebraAgendarProximoLote(50);showToast('📝 Nota salva. Acompanhe a impressão das páginas em Etiquetas.');
  }finally{zebraActionLocked=false;}
}
