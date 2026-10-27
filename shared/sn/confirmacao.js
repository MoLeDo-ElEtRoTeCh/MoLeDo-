function iniciarFluxoSN(roboId,tipo){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  snFluxo={roboId:roboId,tipo:tipo||'cadastro',original:r.sn||'',resultado:null};
  var titulo=tipo==='garantia'?'🛡️ Conferir SN do retorno':textoEquipamento('🔐 Identificar SN do robô',r);
  var texto=tipo==='garantia'
    ?textoEquipamento('Antes de voltar este equipamento para reparo, confirme o número de série do robô que retornou. Ele será comparado com o SN registrado no atendimento original.',r)
    :'Informe o SN manualmente ou use a câmera para a IA ler a etiqueta.';
  var original=(tipo==='garantia'&&temSnValido(r.sn))
    ?'<div style="margin:9px 0;padding:9px 11px;background:rgba(199,125,255,.08);border:1px solid rgba(199,125,255,.25);border-radius:8px;font-size:12px;color:var(--text2);">SN registrado: <strong style="color:#d9a7ff;font-family:\'Share Tech Mono\',monospace;">'+esc(r.sn)+'</strong></div>'
    :'';
  openModal('<div class="modal-title">'+titulo+'</div>'+
    '<div style="font-size:13px;color:var(--text2);line-height:1.45;margin-bottom:8px;">'+texto+'</div>'+
    original+
    '<div class="form-group" style="margin-top:10px;"><label class="form-label">⌨️ Digitar SN</label>'+
      '<input id="sn-manual-input" class="form-input" autocomplete="off" autocapitalize="characters" placeholder="Ex.: R2425A00X20P001928" style="text-transform:uppercase;font-family:\'Share Tech Mono\',monospace;">'+
    '</div>'+
    '<input id="sn-camera-input" type="file" accept="image/*" capture="environment" style="display:none;" onchange="processarFotoSN(this)">'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">'+
      '<button class="btn btn-primary" style="justify-content:center;" onclick="usarSNManual()">⌨️ Usar digitado</button>'+
      '<button class="btn btn-cyan" style="justify-content:center;" onclick="document.getElementById(\'sn-camera-input\').click()">📷 Ler pela câmera</button>'+
    '</div>'+
    '<div style="font-size:10px;color:var(--text3);margin-top:9px;">🔒 A foto é usada somente para leitura do SN e não é salva no banco do MoLeDo.</div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Cancelar</button></div>');
}

function usarSNManual(){
  var el=document.getElementById('sn-manual-input');
  if(!temSnValido(el?el.value:'')){showToast('⚠️ Digite um SN válido.');return;}
  var sn=limparSN(el?el.value:'');
  if(!temSnValido(sn)){showToast('⚠️ Digite um SN válido.');return;}
  tratarSNObtido(sn,'manual');
}

function confirmarSNReconhecido(sn,confianca){
  var cor=String(confianca).toLowerCase()==='alta'?'#00e676':String(confianca).toLowerCase()==='baixa'?'#ff6d00':'#ffd600';
  openModal('<div class="modal-title">🔎 SN identificado</div>'+
    '<div style="font-size:12px;color:var(--text3);margin-bottom:7px;">A IA encontrou:</div>'+
    '<div style="font-family:\'Share Tech Mono\',monospace;font-size:18px;font-weight:900;color:var(--cyan);padding:12px;background:rgba(0,229,255,.07);border:1px solid rgba(0,229,255,.25);border-radius:9px;word-break:break-all;">'+esc(sn)+'</div>'+
    '<div style="font-size:11px;color:'+cor+';margin-top:7px;">Confiança informada pela IA: '+esc(confianca)+'</div>'+
    '<div style="font-size:11px;color:var(--text3);margin-top:7px;">Confira visualmente a etiqueta antes de confirmar. Isso evita troca entre 0/O, 1/I, 5/S ou 8/B.</div>'+
    '<div class="modal-actions" style="flex-wrap:wrap;">'+
      '<button class="btn btn-close" onclick="iniciarFluxoSN(\''+snFluxo.roboId+'\',\''+snFluxo.tipo+'\')">📷 Ler novamente</button>'+
      '<button class="btn btn-yellow" onclick="editarSNReconhecido()">✏️ Corrigir</button>'+
      '<button class="btn btn-green" onclick="tratarSNObtido(\''+sn.replace(/'/g,"\\'")+'\',\'camera\')">✅ Confirmar SN</button>'+
    '</div>');
}

function editarSNReconhecido(){
  var sn=(snFluxo.resultado&&snFluxo.resultado.sn)||'';
  openModal('<div class="modal-title">✏️ Corrigir SN</div>'+
    '<div style="font-size:12px;color:var(--text3);margin-bottom:8px;">Ajuste somente se a leitura da câmera estiver diferente da etiqueta.</div>'+
    '<input id="sn-correcao-input" class="form-input" value="'+esc(sn)+'" style="text-transform:uppercase;font-family:\'Share Tech Mono\',monospace;">'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="iniciarFluxoSN(\''+snFluxo.roboId+'\',\''+snFluxo.tipo+'\')">Cancelar</button>'+
    '<button class="btn btn-green" onclick="usarSNCorrecao()">✅ Confirmar</button></div>');
}

function usarSNCorrecao(){
  var el=document.getElementById('sn-correcao-input');
  if(!temSnValido(el?el.value:'')){showToast('⚠️ Digite um SN válido.');return;}
  var sn=limparSN(el?el.value:'');
  if(!temSnValido(sn)){showToast('⚠️ Digite um SN válido.');return;}
  tratarSNObtido(sn,'correcao');
}

function tratarSNObtido(sn,origem){
  var r=DB.robos.find(function(x){return x.id===snFluxo.roboId;});if(!r)return;
  sn=limparSN(sn);
  if(snFluxo.tipo==='garantia'){
    if(!temSnValido(r.sn)){
      // Cadastro antigo sem SN: registra o SN do retorno, mas deixa explícito que não foi possível comparar com o original.
      r.sn=sn;
      r.snRegistradoEmGarantia=true;
      saveDB();
      openModal('<div class="modal-title">⚠️ Garantia sem SN original</div>'+
        '<div style="font-size:13px;color:var(--text2);line-height:1.45;">Este atendimento antigo não possuía SN registrado, então não é possível provar automaticamente que o equipamento é o mesmo.<br><br>O SN <strong style="color:var(--cyan);">'+esc(sn)+'</strong> foi salvo a partir de agora.</div>'+
        '<div class="modal-actions"><button class="btn btn-primary" onclick="confirmarVoltarReparo(\''+r.id+'\')">🔄 Continuar para reparo</button></div>');
      return;
    }
    if(canonSN(sn)!==canonSN(r.sn)){
      openModal('<div class="modal-title">🚨 SN DIFERENTE — GARANTIA BLOQUEADA</div>'+
        textoEquipamento('<div style="font-size:13px;color:var(--text2);line-height:1.5;">O robô apresentado não corresponde ao número de série registrado neste atendimento.</div>',r)+
        '<div style="margin-top:10px;padding:9px;border-radius:8px;background:rgba(255,23,68,.08);border:1px solid rgba(255,23,68,.3);">'+
          '<div style="font-size:10px;color:var(--text3);">SN ORIGINAL</div><div style="font-family:\'Share Tech Mono\',monospace;color:#00e676;font-weight:900;">'+esc(r.sn)+'</div>'+
          '<div style="font-size:10px;color:var(--text3);margin-top:7px;">SN APRESENTADO</div><div style="font-family:\'Share Tech Mono\',monospace;color:#ff5252;font-weight:900;">'+esc(sn)+'</div>'+
        '</div>'+
        '<div style="font-size:11px;color:#ff8a80;margin-top:9px;">Não trate como garantia sem conferir fisicamente o equipamento e o cadastro.</div>'+
        '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Fechar</button><button class="btn btn-yellow" onclick="iniciarFluxoSN(\''+r.id+'\',\'garantia\')">📷 Conferir novamente</button></div>');
      return;
    }
    openModal('<div class="modal-title">✅ SN CONFIRMADO</div>'+
      '<div style="font-size:13px;color:var(--text2);">O SN do equipamento que retornou confere com o atendimento original.</div>'+
      '<div style="font-family:\'Share Tech Mono\',monospace;font-size:15px;color:#00e676;font-weight:900;margin-top:9px;">'+esc(r.sn)+'</div>'+
      '<div class="modal-actions"><button class="btn btn-primary" onclick="confirmarVoltarReparo(\''+r.id+'\')">🔄 Voltar para reparo</button></div>');
    return;
  }
  var anteriores=buscarHistoricoSN(sn,r.id);
  r.sn=sn;
  r.snOrigem=origem||'manual';
  r.snData=todayISO();
  saveDB();closeModal();renderAll();
  showToast((anteriores.length?'🔎 SN já possui '+anteriores.length+' atendimento(s) anterior(es). ':'✅ SN salvo: ')+sn);
  var destino=snFluxo.tipo;
  var roboId=r.id;
  snFluxo={roboId:null,tipo:null,original:null,resultado:null};
  if(destino==='diagnostico'){
    setTimeout(function(){abrirDiagnostico(roboId,true);},150);
  }
}
