function limparSN(sn){
  var s=String(sn||'').trim().toUpperCase();
  s=s.replace(/^(S\/N|SN|SERIAL|SERIAL NUMBER|NÚMERO DE SÉRIE|NUMERO DE SERIE)\s*[:#-]?\s*/i,'');
  return s.replace(/\s+/g,'').trim();
}
function canonSN(sn){
  return limparSN(sn).replace(/[^A-Z0-9]/g,'');
}
