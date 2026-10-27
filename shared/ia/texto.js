function botaoIATexto(campoId){
  return '<button type="button" onclick="reformularCampoIADireto(\''+campoId+'\',this)" style="margin-top:6px;background:rgba(199,125,255,.10);border:1px solid rgba(199,125,255,.35);color:#d9a7ff;border-radius:7px;padding:6px 10px;font-family:\'Rajdhani\',sans-serif;font-size:11px;font-weight:800;cursor:pointer;">✨ Corrigir / reformular com IA</button>';
}

function reformularCampoIADireto(campoId,btn){
  var el=document.getElementById(campoId);if(!el){showToast('⚠️ Campo não encontrado.');return;}
  var texto=String(el.value||'').trim();if(!texto){showToast('⚠️ Escreva ou dite o texto primeiro.');return;}
  var antigo=btn?btn.textContent:'';if(btn){btn.disabled=true;btn.textContent='⏳ Reformulando...';}
  var system='Você é o assistente de escrita técnica da MoLeDo ElEtRoTeCh, assistência de robôs aspiradores. Reformule a fala informal do técnico em português do Brasil, com ortografia, pontuação e concordância corretas, linguagem profissional e técnica, mas natural. Preserve TODOS os fatos informados. Corrija palavras claramente interpretadas de forma errada pelo ditado quando o contexto for inequívoco, por exemplo robo/roubou -> robô quando se refere ao equipamento. Remova repetições e vícios de fala. NÃO invente defeitos, causas, testes, peças, valores, quantidades ou procedimentos. NÃO acrescente saudação, título, conclusão ou explicação. Retorne SOMENTE o texto final reformulado, sem aspas e sem markdown.';
  fetch('https://moledo-ia.moledoeletrotech.workers.dev/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:system,input:texto})})
  .then(async function(r){var raw=await r.text();if(!r.ok)throw new Error(raw.substring(0,200));try{var d=JSON.parse(raw);return d.text||d.result||raw;}catch(e){return raw;}})
  .then(function(txt){txt=String(txt||'').replace(/^```(?:text)?/i,'').replace(/```$/,'').trim();if(!txt)throw new Error('Resposta vazia');el.value=txt;showToast('✨ Texto corrigido e reformulado. Confira antes de salvar.');})
  .catch(function(e){showToast('⚠️ Erro na IA: '+(e.message||'tente novamente'));})
  .finally(function(){if(btn){btn.disabled=false;btn.textContent=antigo||'✨ Corrigir / reformular com IA';}});
}

function abrirIATexto(campoId){
  var el=document.getElementById(campoId);if(!el){showToast('⚠️ Campo não encontrado.');return;}
  _iaTextoCampo=campoId;
  openModal('<div class="modal-title">✨ Reformular texto</div>'+
    '<div style="font-size:12px;color:var(--text2);line-height:1.45;margin-bottom:9px;">Pode escrever ou usar o ditado do celular do seu jeito. A IA corrige e deixa mais técnico, sem inventar informações.</div>'+
    '<textarea id="ia-texto-input" class="form-input" style="min-height:130px;">'+esc(el.value||'')+'</textarea>'+
    '<div id="ia-texto-status" style="font-size:11px;color:var(--text3);margin-top:7px;"></div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="processarIATexto()">✨ Reformular</button></div>');
}

function processarIATexto(){
  var inp=document.getElementById('ia-texto-input');var texto=inp?inp.value.trim():'';
  if(!texto){showToast('⚠️ Escreva ou dite o texto primeiro.');return;}
  var st=document.getElementById('ia-texto-status');if(st)st.textContent='⏳ Reformulando...';
  var system='Você é o assistente de escrita técnica da MoLeDo ElEtRoTeCh, assistência de robôs aspiradores. Reformule a fala informal do técnico em português do Brasil, com ortografia, pontuação e concordância corretas, linguagem profissional e técnica, mas natural. Preserve TODOS os fatos informados. Corrija palavras claramente interpretadas de forma errada pelo ditado quando o contexto for inequívoco, por exemplo robo/roubou -> robô quando se refere ao equipamento. Remova repetições e vícios de fala. NÃO invente defeitos, causas, testes, peças, valores, quantidades ou procedimentos. NÃO acrescente saudação, título, conclusão ou explicação. Retorne SOMENTE o texto final reformulado, sem aspas e sem markdown.';
  fetch('https://moledo-ia.moledoeletrotech.workers.dev/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:system,input:texto})})
  .then(async function(r){var raw=await r.text();if(!r.ok)throw new Error(raw.substring(0,200));try{var d=JSON.parse(raw);return d.text||d.result||raw;}catch(e){return raw;}})
  .then(function(txt){txt=String(txt||'').replace(/^```(?:text)?/i,'').replace(/```$/,'').trim();if(!txt)throw new Error('Resposta vazia');inp.value=txt;if(st)st.innerHTML='<span style="color:#00e676;">✅ Revise o texto e aplique.</span>';var acts=document.querySelector('#modal-box .modal-actions');if(acts&&!document.getElementById('btn-aplicar-ia-texto'))acts.insertAdjacentHTML('beforeend','<button id="btn-aplicar-ia-texto" class="btn btn-green" onclick="aplicarIATexto()">✅ Aplicar no campo</button>');})
  .catch(function(e){if(st)st.innerHTML='<span style="color:#ff6b6b;">⚠️ '+esc(e.message||'Erro na IA')+'</span>';});
}

function aplicarIATexto(){
  var src=document.getElementById('ia-texto-input'),dest=document.getElementById(_iaTextoCampo);if(!src||!dest)return;dest.value=src.value.trim();closeModal();showToast('✅ Texto reformulado aplicado.');
}
