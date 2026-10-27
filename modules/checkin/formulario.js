function changeQty(d){
  var novaQty=Math.max(1,Math.min(10,ciQty+d));
  if(novaQty===ciQty)return;
  if(novaQty>ciQty){
    // adicionando — salva dados atuais e adiciona só o novo bloco
    salvarDadosBlocos();
    ciQty=novaQty;
    document.getElementById('ci-qty-val').textContent=ciQty;
    if(!ciDefects[ciQty])ciDefects[ciQty]=[];
    document.getElementById('ci-robots-container').insertAdjacentHTML('beforeend',buildRoboBlock(ciQty));
    restaurarDadosBlocos();
  } else {
    // diminuindo — salva dados, remove só o último bloco
    salvarDadosBlocos();
    var c=document.getElementById('ci-robots-container');
    var blocos=c.querySelectorAll('.robot-block');
    if(blocos.length>0)blocos[blocos.length-1].remove();
    delete ciDefects[ciQty];
    ciQty=novaQty;
    document.getElementById('ci-qty-val').textContent=ciQty;
    restaurarDadosBlocos();
  }
}

function salvarDadosBlocos(){
  for(var i=1;i<=ciQty;i++){
    var sn=document.getElementById('ci-sn-'+i);
    var modelo=document.getElementById('ci-modelo-'+i);
    var obs=document.getElementById('ci-obs-'+i);
    var nosn=document.getElementById('ci-nosn-'+i);
    if(!window._ciCache)window._ciCache={};
    window._ciCache[i]={
      sn:sn?sn.value:'',
      modelo:modelo?modelo.value:'',
      obs:obs?obs.value:'',
      obsInterna:(document.getElementById('ci-obs-int-'+i)?document.getElementById('ci-obs-int-'+i).value:''),
      tipoEquip:(document.getElementById('ci-tipo-equip-'+i)?document.getElementById('ci-tipo-equip-'+i).value:'robo'),
      nosn:nosn?nosn.checked:false,
      volt:document.getElementById('vb-ci'+i)?document.getElementById('vb-ci'+i).dataset.volt||'—':'—'
    };
  }
}

function restaurarDadosBlocos(){
  if(!window._ciCache)return;
  for(var i=1;i<=ciQty;i++){
    if(!window._ciCache[i])continue;
    var d=window._ciCache[i];
    var sn=document.getElementById('ci-sn-'+i);
    var modelo=document.getElementById('ci-modelo-'+i);
    var obs=document.getElementById('ci-obs-'+i);
    var nosn=document.getElementById('ci-nosn-'+i);
    if(sn)sn.value=d.sn;
    if(modelo)modelo.value=d.modelo;
    if(obs)obs.value=d.obs;
    var oi=document.getElementById('ci-obs-int-'+i);if(oi)oi.value=d.obsInterna||'';
    var tp=document.getElementById('ci-tipo-equip-'+i);if(tp&&d.tipoEquip)tp.value=d.tipoEquip;
    if(nosn){nosn.checked=d.nosn;if(d.nosn&&sn){sn.value='';sn.disabled=true;}}
    if(d.volt&&d.volt!=='—'){
      var vb=document.getElementById('vb-ci'+i);
      if(vb){vb.dataset.volt=d.volt;vb.querySelectorAll('.volt-btn').forEach(function(b){if(b.textContent.indexOf(d.volt)!==-1)b.classList.add('sel');else b.classList.remove('sel');});}
    }
    // restaurar defeitos
    if(ciDefects[i]&&ciDefects[i].length){
      var btns=document.querySelectorAll('#ci-robots-container .robot-block:nth-child('+i+') .defect-btn');
      btns.forEach(function(b){if(ciDefects[i].indexOf(b.textContent.trim())!==-1)b.classList.add('sel');});
    }
  }
}
