function fazerBackup(){
  var dados=JSON.stringify(DB,null,2);
  var hoje=new Date();
  var nome='moledo-backup-'+hoje.toISOString().slice(0,10)+'.json';
  var blob=new Blob([dados],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=nome;a.click();
  URL.revokeObjectURL(url);
  showToast('💾 Backup baixado: '+nome);
}

function verificarBackupSemanal(){
  var hoje=new Date();
  if(hoje.getDay()===5){// sexta-feira
    var ultimoBackup=localStorage.getItem('moledo_ultimo_backup');
    var semana=hoje.toISOString().slice(0,10);
    if(ultimoBackup!==semana){
      localStorage.setItem('moledo_ultimo_backup',semana);
      setTimeout(function(){
        if(confirm('💾 Backup semanal automático!\n\nDeseja baixar o backup dos seus dados agora?')){
          fazerBackup();
        }
      },3000);
    }
  }
}
