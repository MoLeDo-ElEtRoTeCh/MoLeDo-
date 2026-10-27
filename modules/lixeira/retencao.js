function purgarLixeira(){DB.lixeira=DB.lixeira.filter(function(i){return i.dataApagado>addDays(todayISO(),-365);});saveDB();}
