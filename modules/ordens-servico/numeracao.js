function gerarNumOS(){
  var ano=new Date().getFullYear();
  DB.osSeq=(DB.osSeq||0)+1;
  return'OS-'+ano+'-'+String(DB.osSeq).padStart(3,'0');
}
