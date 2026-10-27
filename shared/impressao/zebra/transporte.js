async function zebraPrintApi(path,method,body,ctx,forceRefresh){
  if(typeof window._getPrintAuthContext!=='function')throw new Error('LOGIN_NECESSARIO');
  var authCtx=ctx||await window._getPrintAuthContext(!!forceRefresh);
  zebraCheckUid(authCtx.uid);
  var headers={Authorization:'Bearer '+authCtx.token,Accept:'application/json'};
  if(body!==undefined)headers['Content-Type']='application/json; charset=utf-8';
  var ctrl=new AbortController(),tid=setTimeout(function(){ctrl.abort();},30000);
  try{
    var response=await fetch(ZEBRA_PRINT_BASE+path,{method:method||'GET',headers:headers,mode:'cors',credentials:'omit',cache:'no-store',redirect:'error',signal:ctrl.signal,body:body===undefined?undefined:JSON.stringify(body)});
    var raw=await response.text(),data;
    try{data=JSON.parse(raw);}catch(e){throw new Error('RESPOSTA_NAO_JSON_CONSULTAR_UUID');}
    if(!response.ok)throw zebraErroHttp(response.status,data,raw);
    if(!data||typeof data!=='object')throw new Error('RESPOSTA_INVALIDA_CONSULTAR_UUID');
    zebraCheckUid(authCtx.uid);
    return data;
  }catch(e){
    if(e.name==='AbortError')throw new Error('TIMEOUT_REDE');
    throw e;
  }finally{clearTimeout(tid);}
}
