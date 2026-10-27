function abrirIACadastro(){
  openModal('<div class="modal-title">✨ Cadastro por IA</div>'+
    '<div style="font-size:12px;color:var(--text2);line-height:1.45;margin-bottom:9px;">Fale do seu jeito as informações do cadastro. Ex.: “Cliente João, WhatsApp..., X20 Pro, somente robô, 220 volts, SN..., não carrega, carcaça traseira quebrada”. A IA só preenche; você confere antes de salvar.</div>'+
    '<textarea id="ia-cad-input" class="form-input" style="min-height:150px;" placeholder="🎙️ Use o ditado do celular ou digite aqui..."></textarea>'+
    '<div id="ia-cad-status" style="font-size:11px;color:var(--text3);margin-top:7px;"></div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="processarIACadastro()">✨ Preencher cadastro</button></div>');
}

function processarIACadastro(){
  var el=document.getElementById('ia-cad-input'),texto=el?el.value.trim():'';if(!texto){showToast('⚠️ Fale ou digite os dados primeiro.');return;}
  var defeitos=(DB.defeitosCI||[]).filter(function(x){return x.ativo!==false;}).map(function(x){return x.nome;});
  var system='Extraia dados para preencher um cadastro de assistência técnica. Retorne APENAS JSON válido, sem markdown, neste formato: {"nomeCliente":"","whatsapp":"","tipoCliente":"cf","quantidade":1,"robos":[{"tipoEquipamento":"robo","sn":"","semSN":false,"modelo":"","voltagem":"—","defeitos":[],"observacao":"","observacaoInterna":"","outraAssistencia":false}]}. Valores permitidos: tipoCliente cf, vd ou vc. tipoEquipamento: robo, robo_base, robo_estacao, placa_robo, placa_estacao. voltagem: 110V, 220V, BIVOLT ou —. Use somente fatos falados. Não invente. Para defeitos, selecione somente nomes da lista quando houver correspondência clara; informação incerta fica em observacao. Lista de defeitos: '+JSON.stringify(defeitos);
  var st=document.getElementById('ia-cad-status');if(st)st.textContent='⏳ Interpretando cadastro...';
  fetch('https://moledo-ia.moledoeletrotech.workers.dev/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:system,input:texto})})
  .then(async function(r){var raw=await r.text();if(!r.ok)throw new Error(raw.substring(0,220));try{var d=JSON.parse(raw);return d.text||raw;}catch(e){return raw;}})
  .then(function(raw){var clean=String(raw||'').replace(/```json/gi,'').replace(/```/g,'').trim();var m=clean.match(/\{[\s\S]*\}/);if(!m)throw new Error('JSON não encontrado');var d=JSON.parse(m[0]);aplicarIACadastro(d);})
  .catch(function(e){if(st)st.innerHTML='<span style="color:#ff6b6b;">⚠️ '+esc(e.message||'Erro ao interpretar')+'</span>';});
}

function aplicarIACadastro(d){
  d=d||{};var robos=Array.isArray(d.robos)&&d.robos.length?d.robos:[{}];
  ciQty=Math.max(1,Math.min(10,Number(d.quantidade)||robos.length||1));
  if(robos.length>ciQty)ciQty=Math.min(10,robos.length);
  ciDefects={};document.getElementById('ci-qty-val').textContent=ciQty;generateRobotBlocks();
  if(d.tipoCliente&&['cf','vd','vc'].indexOf(d.tipoCliente)!==-1)setTipoCliente(d.tipoCliente);
  if(d.nomeCliente)document.getElementById('ci-nome').value=d.nomeCliente;
  if(d.whatsapp)document.getElementById('ci-wa').value=String(d.whatsapp).replace(/\D/g,'');
  robos.slice(0,ciQty).forEach(function(x,i){var n=i+1;x=x||{};
    var tp=document.getElementById('ci-tipo-equip-'+n);if(tp&&['robo','robo_base','robo_estacao','placa_robo','placa_estacao'].indexOf(x.tipoEquipamento)!==-1)tp.value=x.tipoEquipamento;
    var sn=document.getElementById('ci-sn-'+n),nosn=document.getElementById('ci-nosn-'+n);if(x.semSN){nosn.checked=true;sn.value='';sn.disabled=true;}else if(x.sn){sn.value=limparSN(x.sn);}
    var mo=document.getElementById('ci-modelo-'+n);if(mo&&x.modelo)mo.value=x.modelo;
    if(x.voltagem&&x.voltagem!=='—'){var vb=document.getElementById('vb-ci'+n);if(vb){vb.dataset.volt=x.voltagem;vb.querySelectorAll('.volt-btn').forEach(function(b){b.classList.toggle('sel',b.textContent.indexOf(x.voltagem)!==-1);});}}
    ciDefects[n]=Array.isArray(x.defeitos)?x.defeitos.filter(function(z){return (DB.defeitosCI||[]).some(function(dd){return dd.nome===z;});}):[];
    var ob=document.getElementById('ci-obs-'+n);if(ob&&x.observacao)ob.value=x.observacao;var oi=document.getElementById('ci-obs-int-'+n);if(oi&&x.observacaoInterna)oi.value=x.observacaoInterna;
    var oa=document.getElementById('ci-outra-ass-'+n);if(oa&&x.outraAssistencia){oa.checked=true;toggleChecklistReceb(n);}
    var bloco=document.querySelector('#ci-robots-container .robot-block:nth-child('+n+')');
    if(bloco)bloco.querySelectorAll('.defect-btn').forEach(function(b){b.classList.toggle('sel',ciDefects[n].indexOf(b.textContent.trim())!==-1);});
  });
  window._ciCache={};closeModal();showToast('✨ Cadastro preenchido pela IA. Confira antes de salvar.');
}
