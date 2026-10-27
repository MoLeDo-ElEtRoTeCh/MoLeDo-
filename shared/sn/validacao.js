function temSnValido(sn){
  var s=String(sn||'').trim();
  if(!s)return false;
  var u=s.toUpperCase();
  return u!=='SEM CÓDIGO'&&u!=='SEM CODIGO'&&u!=='N/A'&&u!=='NA'&&u!=='—'&&u!=='-';
}
function snCodigoLocalPareceValido(raw){
  var original=String(raw||'').trim();
  if(!original)return false;
  if(/^https?:\/\//i.test(original)||/^www\./i.test(original))return false;
  if(original.length<5||original.length>96)return false;
  var c=canonSN(original);
  if(c.length<5||c.length>80)return false;
  // Evita aceitar QR/textos genéricos como SN: precisa conter ao menos um número.
  return /\d/.test(c);
}
