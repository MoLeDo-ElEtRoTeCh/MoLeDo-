function generateRobotBlocks(){
  var c=document.getElementById('ci-robots-container');c.innerHTML='';
  for(var i=1;i<=ciQty;i++){if(!ciDefects[i])ciDefects[i]=[];c.insertAdjacentHTML('beforeend',buildRoboBlock(i));}
}

function buildRoboBlock(n){
  var num=String(n).padStart(3,'0');
  // usa defeitosCI do DB, ou fallback para DEFEITOS padrão
  var lista=(DB.defeitosCI&&DB.defeitosCI.length)?DB.defeitosCI.filter(function(d){return d.ativo!==false;}):[];
  if(!lista.length){
    DEFEITOS.forEach(function(cat){cat.items.forEach(function(item){lista.push({cat:cat.cat,nome:item});});});
  }
  var catsCI={};
  lista.forEach(function(d){if(!catsCI[d.cat])catsCI[d.cat]=[];catsCI[d.cat].push(d);});
  var defHtml=Object.keys(catsCI).map(function(cat){
    return'<div style="display:flex;align-items:center;justify-content:space-between;margin:10px 0 4px;">'+
      '<div class="defect-category" style="margin:0;">'+cat+'</div>'+
      '<button type="button" onclick="abrirConfigDefeitosCat(\''+cat.replace(/'/g,"\\'")+'\')" style="background:rgba(0,229,255,.08);border:1px solid rgba(0,229,255,.25);color:var(--cyan2);border-radius:5px;padding:2px 7px;font-size:10px;font-weight:700;cursor:pointer;font-family:\'Rajdhani\',sans-serif;">⚙️</button>'+
    '</div>'+
    '<div class="defect-grid">'+
      catsCI[cat].map(function(d){return'<button type="button" class="defect-btn" onclick="toggleDef('+n+',this,\''+d.nome.replace(/'/g,"\\'")+'\')">'+esc(d.nome)+'</button>';}).join('')+'</div>';
  }).join('');
  return'<div class="robot-block"><div class="robot-block-title"><span class="robot-num">#'+num+'</span> EQUIPAMENTO '+num+'</div>'+
    '<div class="form-group"><label class="form-label">Tipo de entrada</label><select id="ci-tipo-equip-'+n+'" class="form-input" onchange="alternarOutroEquipamento('+n+')">'+
      '<option value="outro">OUTRO EQUIPAMENTO</option><option value="robo" selected>🤖 Somente robô</option><option value="robo_base">🤖 + 🔌 Robô + base</option><option value="robo_estacao">🤖 + 🏠 Robô + estação</option><option value="placa_robo">🔧 Somente placa do robô</option><option value="placa_estacao">🔧 Somente placa da estação</option>'+
    '</select></div>'+
    '<div id="ci-outro-wrap-'+n+'" class="form-group" style="display:none"><label class="form-label">Tipo / nome do equipamento *</label><input id="ci-outro-'+n+'" class="form-input" placeholder="Ex.: Ventilador, Frigobar"></div>'+
    '<div class="form-group"><label class="form-label">Código / SN</label>'+
    '<div style="display:flex;gap:7px;align-items:center;"><input id="ci-sn-'+n+'" class="form-input" type="text" placeholder="Ex: 54784/DUAA8F5SF00855" oninput="this.dataset.snOrigem=\'manual\'" style="flex:1;">'+
    '<input id="ci-sn-camera-'+n+'" type="file" accept="image/*" capture="environment" style="display:none;" onchange="processarFotoSNParaCampo(this,\'ci-sn-'+n+'\',\'ci-nosn-'+n+'\')">'+
    '<button type="button" class="btn btn-cyan" onclick="document.getElementById(\'ci-sn-camera-'+n+'\').click()" style="white-space:nowrap;padding:9px 10px;">📷 Ler</button></div>'+
    '<div class="checkbox-row" style="margin-top:6px"><input type="checkbox" id="ci-nosn-'+n+'" onchange="var s=document.getElementById(\'ci-sn-'+n+'\');if(this.checked){s.value=\'\';s.disabled=true;}else s.disabled=false;"><label for="ci-nosn-'+n+'">Sem código/SN visível</label></div></div>'+
    '<div class="form-group"><label class="form-label">Modelo</label>'+
    '<div style="position:relative;">'+
    '<input id="ci-modelo-'+n+'" class="form-input" type="text" placeholder="Ex: X20 Pro" oninput="autocompleteModelo(this,'+n+')" autocomplete="off">'+
    '<div id="ci-modelo-ac-'+n+'" style="display:none;position:absolute;left:0;right:0;background:var(--bg2);border:1px solid var(--cyan3);border-radius:8px;z-index:999;max-height:160px;overflow-y:auto;"></div>'+
    '</div></div>'+
    '<div class="form-group"><label class="form-label">Voltagem</label>'+buildVoltBtns('ci'+n,'—')+'</div>'+
    '<div class="form-group"><label class="form-label">Defeitos</label>'+defHtml+'</div>'+
    '<div class="form-group"><label class="form-label">Observação</label><textarea id="ci-obs-'+n+'" class="form-input" placeholder="Observações adicionais..."></textarea>'+botaoIATexto('ci-obs-'+n)+'</div>'+
    '<div class="form-group"><label class="form-label" style="color:#888;">🔒 Observação Interna <span style="font-size:10px;color:#555;">(só você vê)</span></label><textarea id="ci-obs-int-'+n+'" class="form-input" style="border-color:#333;background:#0a0a0a;" placeholder="Anotações internas..."></textarea>'+botaoIATexto('ci-obs-int-'+n)+'</div>'+
    // checklist recebimento
    '<div class="form-group"><label class="form-label">📋 Checklist Recebimento</label>'+
    '<div class="checkbox-row"><input type="checkbox" id="ci-outra-ass-'+n+'" onchange="toggleChecklistReceb('+n+')"><label for="ci-outra-ass-'+n+'">Veio de outra assistência?</label></div>'+
    '<div id="ci-checklist-receb-'+n+'" style="display:none;margin-top:8px;background:#0a0a0a;border:1px solid #222;border-radius:8px;padding:10px;">'+
    ['Todos os parafusos presentes','Tampa superior intacta','Escovas originais','Dock de carregamento incluso','Cabo de energia incluso'].map(function(item,i){
      return'<div class="checkbox-row"><input type="checkbox" id="ci-cr-'+n+'-'+i+'"><label for="ci-cr-'+n+'-'+i+'">'+item+'</label></div>';
    }).join('')+
    '<div class="form-group" style="margin-top:8px;margin-bottom:0;"><label class="form-label" style="font-size:11px;">Itens faltando/danificados:</label><textarea id="ci-cr-obs-'+n+'" class="form-input" style="min-height:50px;" placeholder="Ex: faltando escova lateral..."></textarea>'+botaoIATexto('ci-cr-obs-'+n)+'</div>'+
    '</div></div>'+
  '</div>';
}

function toggleDef(n,btn,item){
  btn.classList.toggle('sel');var idx=ciDefects[n].indexOf(item);
  if(idx===-1)ciDefects[n].push(item);else ciDefects[n].splice(idx,1);
}

function autocompleteModelo(input,n){
  var val=input.value.trim();
  var box=document.getElementById('ci-modelo-ac-'+n);
  if(!val||val.length<2){if(box)box.style.display='none';return;}
  var lista=(DB.modelosCustom||[]).concat(MODELOS_PAD);
  var matches=lista.filter(function(m){return m.toLowerCase().indexOf(val.toLowerCase())!==-1;});
  if(!matches.length){if(box)box.style.display='none';return;}
  box.innerHTML=matches.slice(0,6).map(function(m){
    return'<div onclick="selecionarModelo(\''+n+'\',\''+m.replace(/'/g,"\\'")+'\')" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:13px;color:var(--text);font-family:\'Rajdhani\',sans-serif;font-weight:600;">'+esc(m)+'</div>';
  }).join('');
  box.style.display='block';
}

function selecionarModelo(n,modelo){
  var inp=document.getElementById('ci-modelo-'+n);
  var box=document.getElementById('ci-modelo-ac-'+n);
  if(inp)inp.value=modelo;
  if(box)box.style.display='none';
}
