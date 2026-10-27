function zebraByteLen(v){
  return new TextEncoder().encode(String(v)).length;
}

function zebraTemSurrogateInvalido(s){
  s=String(s);
  for(var i=0;i<s.length;i++){
    var c=s.charCodeAt(i);
    if(c>=0xD800&&c<=0xDBFF){
      if(i+1>=s.length)return true;
      var n=s.charCodeAt(i+1);
      if(n<0xDC00||n>0xDFFF)return true;
      i++;
    }else if(c>=0xDC00&&c<=0xDFFF)return true;
  }
  return false;
}

function zebraValidarTexto(v,maxBytes,campo){
  if(typeof v!=='string'||!v.trim())throw new Error(campo+': valor obrigatório.');
  if(zebraTemSurrogateInvalido(v))throw new Error(campo+': texto Unicode inválido.');
  if(/[\u0000-\u001F\u007F\^~]/.test(v))throw new Error(campo+': contém caractere não permitido.');
  if(zebraByteLen(v)>maxBytes)throw new Error(campo+': texto muito longo.');
  return v;
}

function zebraDataValida(v){
  if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
  var p=v.split('-').map(Number),y=p[0],m=p[1],d=p[2];
  if(y<2000||y>2099)return false;
  var dt=new Date(Date.UTC(y,m-1,d));
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d;
}

function zebraNormalizarVoltagem(v){
  var s=String(v==null?'':v);
  if(s==='BIVOLT'||s==='bivolt')s='Bivolt';
  if(s==='—'||s==='110V'||s==='220V'||s==='Bivolt')return s;
  throw new Error('Voltagem: use 110V, 220V, Bivolt ou —.');
}

function zebraMontarPayload(r,c){
  if(!window.crypto||typeof window.crypto.randomUUID!=='function')throw new Error('Este navegador não oferece UUID seguro. Atualize o navegador.');
  if(!r||!c)throw new Error('Equipamento ou cliente não localizado.');
  if(typeof r.id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(r.id))throw new Error('ID do equipamento incompatível com a impressão Zebra.');
  if(!Number.isSafeInteger(r.numVisual)||r.numVisual<0||r.numVisual>9999999)throw new Error('Número visual inválido para a etiqueta.');
  var modelo=zebraValidarTexto(String(r.modelo==null?'':r.modelo),96,'Modelo');
  var sn=zebraValidarTexto(String(r.sn==null?'':r.sn),96,'SN');
  var nome=zebraValidarTexto(String(c.nome==null?'':c.nome),96,'Cliente');
  if(!zebraDataValida(r.dataEntrada))throw new Error('Data de entrada inválida. Use uma data real entre 2000 e 2099.');
  var voltagem=zebraNormalizarVoltagem(r.voltagem);
  if(!Array.isArray(r.defeitos))throw new Error('Defeitos: o cadastro precisa conter uma lista válida.');
  if(r.defeitos.length>8)throw new Error('Defeitos: máximo de 8 itens por etiqueta.');
  var defeitos=r.defeitos.map(function(item){
    return zebraValidarTexto(String(item==null?'':item),96,'Defeito');
  });
  if(zebraByteLen(defeitos.join(' / '))>512)throw new Error('Defeitos: texto total muito longo para a etiqueta.');
  var payload={
    job_id:window.crypto.randomUUID().toLowerCase(),
    printer_id:ZEBRA_PRINTER_ID,
    robo:{
      id:r.id,
      numVisual:r.numVisual,
      modelo:modelo,
      sn:sn,
      dataEntrada:r.dataEntrada,
      voltagem:voltagem,
      defeitos:defeitos
    },
    cliente:{nome:nome}
  };
  if(zebraByteLen(JSON.stringify(payload))>4096)throw new Error('Os dados da etiqueta ultrapassam o limite permitido.');
  return payload;
}

function zebraCheckUid(uid){
  if(typeof window._getPrintCurrentUid!=='function'||window._getPrintCurrentUid()!==uid)throw new Error('LOGIN_NECESSARIO: entre com a conta que iniciou este lote.');
}
