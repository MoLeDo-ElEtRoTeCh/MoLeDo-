function reduzirImagemSN(file,maxDim,quality){
  return new Promise(function(resolve,reject){
    var reader=new FileReader();
    reader.onerror=function(){reject(new Error('Não foi possível abrir a foto.'));};
    reader.onload=function(){
      var img=new Image();
      img.onerror=function(){reject(new Error('Imagem inválida.'));};
      img.onload=function(){
        var w=img.width,h=img.height;
        var escala=Math.min(1,maxDim/Math.max(w,h));
        var nw=Math.max(1,Math.round(w*escala)),nh=Math.max(1,Math.round(h*escala));
        var canvas=document.createElement('canvas');canvas.width=nw;canvas.height=nh;
        var ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,nw,nh);
        resolve(canvas.toDataURL('image/jpeg',quality));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function preencherSNCampo(campoId,checkboxId,sn,origem){
  var campo=document.getElementById(campoId),chk=checkboxId?document.getElementById(checkboxId):null;
  if(!campo)return;
  if(chk)chk.checked=false;
  campo.disabled=false;
  campo.value=limparSN(sn);
  campo.dataset.snOrigem=origem||'camera';
  showToast('✅ SN identificado: '+campo.value,5000);
}
