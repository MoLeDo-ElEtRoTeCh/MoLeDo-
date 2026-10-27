function zebraCarregarTemplate(){
  if(zebraTemplateImagePromise)return zebraTemplateImagePromise;
  zebraTemplateImagePromise=new Promise(function(resolve,reject){
    var img=new Image();
    img.onload=function(){resolve(img);};
    img.onerror=function(){reject(new Error('Não foi possível carregar o template da etiqueta.'));};
    img.src=ZEBRA_BITMAP_TEMPLATE;
  });
  return zebraTemplateImagePromise;
}

async function zebraAguardarFontes(){
  if(document.fonts&&document.fonts.ready){
    try{await Promise.race([document.fonts.ready,new Promise(function(ok){setTimeout(ok,2000);})]);}catch(e){}
  }
}

function zebraSetFont(ctx,size,weight){
  // System font: rendering does not depend on a Google Fonts request finishing.
  ctx.font=(weight||700)+' '+Math.max(8,Math.round(size))+'px Arial, sans-serif';
  ctx.fillStyle='#000';ctx.textBaseline='alphabetic';
}

function zebraDrawFit(ctx,text,x,y,maxWidth,maxSize,minSize,weight){
  text=String(text==null?'':text);
  var size=maxSize;
  for(;size>minSize;size--){zebraSetFont(ctx,size,weight);if(ctx.measureText(text).width<=maxWidth)break;}
  zebraSetFont(ctx,size,weight);
  if(ctx.measureText(text).width>maxWidth){
    var chars=Array.from(text);
    while(chars.length&&ctx.measureText(chars.join('')+'…').width>maxWidth)chars.pop();
    text=chars.join('')+'…';
  }
  ctx.fillText(text,x,y);
  return size;
}

function zebraWrapCanvas(ctx,text,maxWidth,maxLines,size,weight){
  text=String(text||'').trim().replace(/\s+/g,' ');
  zebraSetFont(ctx,size,weight);
  var rest=Array.from(text),lines=[];
  while(rest.length&&lines.length<maxLines){
    var count=0;
    while(count<rest.length&&ctx.measureText(rest.slice(0,count+1).join('')).width<=maxWidth)count++;
    if(!count)break;
    if(count<rest.length&&lines.length===maxLines-1){
      var last=rest.slice(0,count);
      while(last.length&&ctx.measureText(last.join('')+'…').width>maxWidth)last.pop();
      lines.push(last.join('').trimEnd()+'…');break;
    }
    if(count<rest.length){var space=rest.slice(0,count+1).lastIndexOf(' ');if(space>0)count=space;}
    lines.push(rest.splice(0,count).join('').trim());
    while(rest[0]===' ')rest.shift();
  }
  return lines;
}

function zebraDesenharQr(ctx,text,x,y,maxSize){
  var qr=new QRCode(0,QRErrorCorrectLevel.M);
  qr.addData(String(text));qr.make();
  var n=qr.getModuleCount(),quiet=4;
  var scale=Math.max(1,Math.floor(maxSize/(n+quiet*2)));
  var total=(n+quiet*2)*scale;
  var ox=x+Math.floor((maxSize-total)/2)+quiet*scale;
  var oy=y+Math.floor((maxSize-total)/2)+quiet*scale;
  ctx.fillStyle='#fff';ctx.fillRect(x,y,maxSize,maxSize);
  ctx.fillStyle='#000';
  for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(qr.isDark(r,c))ctx.fillRect(ox+c*scale,oy+r*scale,scale,scale);
}

function zebraThresholdCanvas(canvas){
  var ctx=canvas.getContext('2d',{willReadFrequently:true});
  var im=ctx.getImageData(0,0,ZEBRA_BITMAP_W,ZEBRA_BITMAP_H),a=im.data;
  for(var i=0;i<a.length;i+=4){
    var lum=(a[i]*299+a[i+1]*587+a[i+2]*114)/1000;
    var v=lum<185?0:255;
    a[i]=a[i+1]=a[i+2]=v;a[i+3]=255;
  }
  ctx.putImageData(im,0,0);
  return canvas;
}

async function zebraRenderizarCanvas(r,c){
  if(!r||!c)throw new Error('Equipamento ou cliente não localizado.');
  await zebraAguardarFontes();
  var template=await zebraCarregarTemplate();
  var canvas=document.createElement('canvas');canvas.width=ZEBRA_BITMAP_W;canvas.height=ZEBRA_BITMAP_H;
  var ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.imageSmoothingEnabled=false;ctx.fillStyle='#fff';ctx.fillRect(0,0,480,320);ctx.drawImage(template,0,0,480,320);

  var nome=String(c.nome||'CLIENTE').trim().toUpperCase();
  var ehVC=zebraVendedorCliente(r,c);
  var nomeClienteFinal=ehVC?String(r.nomeClienteFinal||'').trim().toUpperCase():'';
  var nomeVendedorCurto=ehVC?zebraPrimeiroNome(c.nome).toUpperCase():'';
  var modelo=String(r.modelo||'—').trim().toUpperCase();
  var sn=String(r.sn||'SEM CÓDIGO').trim().toUpperCase();
  var entrada=fmtData(r.dataEntrada);
  var volt=String(r.voltagem||'—').trim().toUpperCase();
  var defeito=(Array.isArray(r.defeitos)&&r.defeitos.length?r.defeitos.join(' / '):'NÃO INFORMADO').trim().toUpperCase();
  var num=String(Number(r.numVisual||0)).padStart(3,'0');

  // Número depois do # fixo do template
  zebraDrawFit(ctx,num,397,54,75,31,12,800);
  // Identificação principal. Para Vendedor + Cliente, o cliente final ganha destaque
  // e o vendedor aparece abreviado na linha superior.
  if(ehVC){
    zebraDrawFit(ctx,'VEND.: '+nomeVendedorCurto,14,87,300,13,10,800);
    zebraDrawFit(ctx,'CLIENTE: '+nomeClienteFinal,14,106,300,19,12,800);
  }else{
    zebraDrawFit(ctx,nome,14,105,300,32,18,800);
  }
  // Larger content only; all drawing stays left of the original QR.
  ctx.fillStyle='#fff';ctx.fillRect(12,110,302,148);
  zebraDrawFit(ctx,'MODELO:',14,130,95,16,16,800);
  zebraDrawFit(ctx,modelo,112,130,196,21,13,800);
  zebraDrawFit(ctx,'SN:',14,155,32,16,16,800);
  zebraDrawFit(ctx,sn,49,155,259,20,13,800);
  var curto=zebraWrapCanvas(ctx,defeito,294,4,18,800).length<=1;
  zebraDrawFit(ctx,'ENTRADA:',14,180,100,16,16,800);
  zebraDrawFit(ctx,entrada,117,180,190,18,14,800);
  if(curto){
    zebraDrawFit(ctx,'VOLTAGEM:',14,204,117,16,16,800);
    zebraDrawFit(ctx,volt,134,204,174,20,16,800);
    zebraDrawFit(ctx,'DEFEITO RELATADO:',14,228,294,16,16,800);
    zebraDrawFit(ctx,defeito,14,251,294,18,18,800);
  }else{
    // Tighter vertical spacing preserves three readable defect lines.
    ctx.fillStyle='#fff';ctx.fillRect(12,110,302,148);
    zebraDrawFit(ctx,'MODELO:',14,124,95,16,16,800);
    zebraDrawFit(ctx,modelo,112,124,196,21,13,800);
    zebraDrawFit(ctx,'SN:',14,143,32,16,16,800);
    zebraDrawFit(ctx,sn,49,143,259,20,13,800);
    zebraDrawFit(ctx,'ENTRADA:',14,162,100,16,16,800);
    zebraDrawFit(ctx,entrada,117,162,190,18,14,800);
    zebraDrawFit(ctx,'VOLTAGEM:',14,181,117,16,16,800);
    zebraDrawFit(ctx,volt,134,181,174,20,16,800);
    zebraDrawFit(ctx,'DEFEITO RELATADO:',14,202,294,16,16,800);
    var lines=zebraWrapCanvas(ctx,defeito,294,3,17,800);
    for(var li=0;li<lines.length;li++)zebraDrawFit(ctx,lines[li],14,219+li*18,294,17,17,800);
  }

  var appUrl='https://moledo-eletrotech.github.io/MoLeDo-/#robo='+encodeURIComponent(r.id);
  zebraDesenharQr(ctx,appUrl,332,96,136);
  return zebraThresholdCanvas(canvas);
}

function zebraCanvasParaBytes(canvas){
  var ctx=canvas.getContext('2d',{willReadFrequently:true});
  var a=ctx.getImageData(0,0,ZEBRA_BITMAP_W,ZEBRA_BITMAP_H).data;
  var out=new Uint8Array(ZEBRA_BITMAP_BYTES);
  for(var y=0;y<ZEBRA_BITMAP_H;y++){
    for(var x=0;x<ZEBRA_BITMAP_W;x++){
      var p=(y*ZEBRA_BITMAP_W+x)*4;
      if(a[p]<128)out[y*ZEBRA_BITMAP_BPR+(x>>3)]|=(0x80>>(x&7));
    }
  }
  return out;
}

function zebraBytesBase64(bytes){
  var parts=[],chunk=0x4000;
  for(var i=0;i<bytes.length;i+=chunk){
    var sub=bytes.subarray(i,Math.min(bytes.length,i+chunk)),s='';
    for(var j=0;j<sub.length;j++)s+=String.fromCharCode(sub[j]);
    parts.push(s);
  }
  return btoa(parts.join(''));
}

async function zebraMontarPayloadBitmap(r,c){
  var valid=zebraMontarPayload(r,c); // reutiliza as mesmas validações e gera UUID-v4
  var canvas=await zebraRenderizarCanvas(r,c);
  var bytes=zebraCanvasParaBytes(canvas);
  if(bytes.length!==ZEBRA_BITMAP_BYTES)throw new Error('Bitmap gerado com tamanho inválido.');
  var b64=zebraBytesBase64(bytes);
  if(b64.length!==25600)throw new Error('Base64 do bitmap ficou fora do tamanho esperado.');
  return {
    job_id:valid.job_id,
    printer_id:ZEBRA_PRINTER_ID,
    bitmap:{width:480,height:320,bytes_per_row:60,encoding:'base64',data:b64}
  };
}

async function zebraAbrirPrevia(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});if(!c)return;
  try{
    showToast('🖼️ Gerando prévia 480×320...');
    var canvas=await zebraRenderizarCanvas(r,c);
    var src=canvas.toDataURL('image/png');
    openModal('<div class="modal-title">🏷️ Prévia exata · #'+String(r.numVisual||0).padStart(3,'0')+'</div>'+ 
      '<div style="background:#fff;border-radius:8px;padding:6px;"><img src="'+src+'" style="display:block;width:100%;height:auto;image-rendering:pixelated;"></div>'+ 
      '<div style="font-size:11px;color:var(--text3);margin-top:8px;">480 × 320 px · preto/branco · esta é a matriz usada no /print-bitmap. Reticências (…): o texto excedeu a área. Confira os campos antes de imprimir.</div>'+ 
      '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Fechar</button></div>');
  }catch(e){showToast('⚠️ Não consegui gerar a prévia: '+(e.message||e),7000);}
}
