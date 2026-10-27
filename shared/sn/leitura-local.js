function detectarCodigoSNLocal(file){
  if(!file||!('BarcodeDetector' in window)||typeof createImageBitmap!=='function')return Promise.resolve(null);
  var formatos=['code_128','code_39','qr_code','data_matrix'];
  var detector;
  try{detector=new BarcodeDetector({formats:formatos});}catch(e){return Promise.resolve(null);}
  return createImageBitmap(file).then(function(bitmap){
    return detector.detect(bitmap).then(function(codigos){
      try{if(bitmap&&bitmap.close)bitmap.close();}catch(_){ }
      if(!Array.isArray(codigos)||!codigos.length)return null;
      for(var i=0;i<codigos.length;i++){
        var raw=codigos[i]&&codigos[i].rawValue?String(codigos[i].rawValue).trim():'';
        if(snCodigoLocalPareceValido(raw))return limparSN(raw);
      }
      return null;
    },function(err){
      try{if(bitmap&&bitmap.close)bitmap.close();}catch(_){ }
      return null;
    });
  }).catch(function(){return null;});
}
