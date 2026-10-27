function verificarAgendamentos(){
  if(!DB.robos)return;
  var agora=new Date();
  var mudou=false;
  DB.robos.forEach(function(r){
    if(r.status!=='reparo'||!r.agendamento)return;
    // Formato: "YYYY-MM-DD HH:MM" ou "YYYY-MM-DD"
    var dt=new Date(r.agendamento.replace(' ','T')+(r.agendamento.length===10?'T23:59':''));
    if(dt<=agora){
      // Move para garantia automaticamente
      r.status='garantia';
      r.dataEntrega=r.agendamento.split(' ')[0]||todayISO();
      r.garantiaAte=addDays(r.dataEntrega,90);
      r.agendamento=null;
      if(!r.mensagens)r.mensagens=[];
      r.mensagens.push({data:todayISO(),tipo:'entregue',auto:true});
      mudou=true;
      showToast('✅ '+('#'+String(r.numVisual).padStart(3,'0'))+' movido para garantia automaticamente!');
      // Publica no Firebase
      if(typeof republicarFichaPublica==='function')republicarFichaPublica(r.id);
    }
  });
  if(mudou){saveDB();renderAll();}
}

function verificarLembretes(){
  atualizarBadgeLembrete();
  // Sem banner — só ticker e sininho
}

function purgarLembretesFeitos(){
  if(!DB.lembretes)return;
  var umDia=24*60*60*1000;
  var antes=DB.lembretes.length;
  DB.lembretes=DB.lembretes.filter(function(l){
    if(!l.feito)return true;
    if(!l.feitoEm)return false; // sem timestamp, remove
    return (Date.now()-l.feitoEm)<umDia;
  });
  if(DB.lembretes.length!==antes)saveDB();
}
