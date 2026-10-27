function zebraStorageRead(key){
  var raw=localStorage.getItem(key);
  if(!raw)return null;
  try{return JSON.parse(raw);}catch(e){throw new Error('Registro local de impressão inválido. Preserve os dados e confira os UUIDs.');}
}

function zebraStorageWrite(key,value){
  var raw=JSON.stringify(value);
  localStorage.setItem(key,raw);
  if(localStorage.getItem(key)!==raw)throw new Error('Não foi possível confirmar a gravação local.');
}
