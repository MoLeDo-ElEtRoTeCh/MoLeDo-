function renderCheckin(){
  var inp=document.getElementById('ci-data');if(!inp.value)inp.value=todayISO();
  ciQty=1;document.getElementById('ci-qty-val').textContent=1;ciDefects={};generateRobotBlocks();
}

function salvarCheckin(){
  var nome=document.getElementById('ci-nome').value.trim();var wa=document.getElementById('ci-wa').value.trim();var data=document.getElementById('ci-data').value;
  if(!nome){alert('Informe o nome.');return;}if(!wa){alert('Informe o WhatsApp.');return;}if(!data){alert('Informe a data.');return;}
  var nomeCF=ciTipo==='vc'?(document.getElementById('ci-nome-cf').value.trim()||''):'';
  for(var i=1;i<=ciQty;i++){
    var sn=document.getElementById('ci-sn-'+i).value.trim();var noSn=document.getElementById('ci-nosn-'+i).checked;
    if(!sn&&!noSn){alert((document.getElementById('ci-tipo-equip-'+i).value==='outro'?(document.getElementById('ci-outro-'+i).value.trim()||'Equipamento'):'Robô')+' #'+String(i).padStart(3,'0')+': Informe o Código/SN.');return;}
  }
  for(var t=1;t<=ciQty;t++){if(document.getElementById('ci-tipo-equip-'+t).value==='outro'&&!document.getElementById('ci-outro-'+t).value.trim()){alert('Informe o tipo/nome do equipamento #'+t);return;}}
  var cliente=null;
  for(var j=0;j<DB.clientes.length;j++){if(DB.clientes[j].whatsapp===wa){cliente=DB.clientes[j];break;}}
  if(!cliente){cliente={id:genId(),nome:nome,whatsapp:wa,tipo:ciTipo,nomeClienteFinal:nomeCF};DB.clientes.push(cliente);}
  else{cliente.nome=nome;cliente.tipo=ciTipo;cliente.nomeClienteFinal=nomeCF;}
  var ativos=DB.robos.filter(function(r){return r.clienteId===cliente.id&&(r.status==='reparo'||r.status==='garantia');});
  var nextNum=ativos.length?Math.max.apply(null,ativos.map(function(r){return r.numVisual;}))+1:1;
  for(var k=1;k<=ciQty;k++){
    DB.robos.push({id:genId(),clienteId:cliente.id,numVisual:nextNum+(k-1),
      sn:document.getElementById('ci-nosn-'+k).checked?'SEM CÓDIGO':document.getElementById('ci-sn-'+k).value.trim(),
      tipoEquipamento:(document.getElementById('ci-tipo-equip-'+k)?document.getElementById('ci-tipo-equip-'+k).value:'robo'),
      nomeTipoEquipamento:document.getElementById('ci-tipo-equip-'+k).value==='outro'?document.getElementById('ci-outro-'+k).value.trim():'',
      modelo:document.getElementById('ci-modelo-'+k).value.trim()||'—',
      voltagem:getVolt('ci'+k),defeitos:[].concat(ciDefects[k]||[]),
      obs:document.getElementById('ci-obs-'+k).value.trim(),
      obsInterna:(document.getElementById('ci-obs-int-'+k)?document.getElementById('ci-obs-int-'+k).value.trim():''),
      dataEntrada:data,status:'reparo',dataEntrega:null,garantiaAte:null,mensagens:[],diagnostico:null,nomeClienteFinal:nomeCF});
  }
  saveDB();
  document.getElementById('ci-nome').value='';document.getElementById('ci-wa').value='';document.getElementById('ci-data').value='';
  if(document.getElementById('ci-nome-cf'))document.getElementById('ci-nome-cf').value='';
  ciQty=1;ciDefects={};ciTipo='cf';document.getElementById('ci-qty-val').textContent=1;
  setTipoCliente('cf');generateRobotBlocks();
  renderAll();
  verificarLembretes();
  setInterval(verificarLembretes, 60000);switchTab('fila');showToast('✅ Check-in salvo!');
}
