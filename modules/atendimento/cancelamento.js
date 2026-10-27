function abrirCancelamento(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  var num='#'+String(r.numVisual).padStart(3,'0');
  CD={roboId:roboId,num:num,modelo:r.modelo,cliente:c?c.nome:'?',val:r.diagnostico?r.diagnostico.abertura:200,wa:c?c.whatsapp:'',motivo:''};
  openModal(
    '<div class="modal-title danger">❌ Cancelar Reparo — '+num+'</div>'+
    '<div class="form-group"><label class="form-label">1. Valor do Diagnóstico</label>'+
      '<div style="display:flex;gap:8px;">'+
        '<button type="button" id="cv200" onclick="setCancelVal(200)" class="cancel-sel-btn'+(CD.val===200?' ativo-yellow':'')+'">🔧 Com abertura<br><strong>R$ 200,00</strong></button>'+
        '<button type="button" id="cv80" onclick="setCancelVal(80)" class="cancel-sel-btn'+(CD.val===80?' ativo-yellow':'')+'">🔍 Visual<br><strong>R$ 80,00</strong></button>'+
      '</div></div>'+
    '<div class="form-group"><label class="form-label">2. Motivo</label>'+
      '<div style="display:flex;gap:8px;">'+
        '<button type="button" id="csc" onclick="setCancelMotivo(\'sem-conserto\')" class="cancel-sel-btn">🔧 Sem conserto</button>'+
        '<button type="button" id="cna" onclick="setCancelMotivo(\'nao-autorizado\')" class="cancel-sel-btn">💰 Não autorizado</button>'+
      '</div></div>'+
    '<div class="form-group"><label class="form-label">3. Mensagem — edite se quiser</label>'+
      '<textarea id="cancel-msg" class="form-input" style="min-height:190px;font-size:12px;line-height:1.5;">Selecione o motivo acima para gerar a mensagem...</textarea>'+
    '</div>'+
    '<div class="modal-actions">'+
      '<button class="btn btn-close" onclick="closeModal()">Fechar</button>'+
      '<button class="btn btn-wa" onclick="enviarWACancel()">📲 Enviar WhatsApp</button>'+
      '<button class="btn btn-del" onclick="confirmarArquivarCancel()">❌ Arquivar</button>'+
    '</div>'
  );
}

function setCancelVal(v){
  CD.val=v;
  var b200=document.getElementById('cv200');var b80=document.getElementById('cv80');
  if(b200)b200.className='cancel-sel-btn'+(v===200?' ativo-yellow':'');
  if(b80)b80.className='cancel-sel-btn'+(v===80?' ativo-yellow':'');
  if(CD.motivo)gerarMsgCancel();
}

function setCancelMotivo(m){
  CD.motivo=m;
  var bsc=document.getElementById('csc');var bna=document.getElementById('cna');
  if(bsc)bsc.className='cancel-sel-btn'+(m==='sem-conserto'?' ativo-red':'');
  if(bna)bna.className='cancel-sel-btn'+(m==='nao-autorizado'?' ativo-red':'');
  gerarMsgCancel();
}

function confirmarArquivarCancel(){
  if(!CD.motivo){alert('Selecione o motivo primeiro!');return;}
  closeModal();
  openModal('<div class="modal-title danger">❌ Confirmar Arquivamento</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:16px;">O robô será arquivado como cancelado na lixeira.<br><br><span style="color:var(--red);">⚠️ Esta ação não pode ser desfeita.</span></div>'+
    '<div class="modal-actions"><button class="btn btn-close" onclick="closeModal()">Voltar</button><button class="btn btn-del" onclick="executarArquivarCancel()">❌ Confirmar</button></div>');
}

function executarArquivarCancel(){
  var r=DB.robos.find(function(x){return x.id===CD.roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
  // Publica ficha cancelada no Firebase para o QR mostrar tela vermelha
  publicarFichaCancelada(r,c);
  DB.lixeira.push({id:genId(),robo:JSON.parse(JSON.stringify(r)),nomeCliente:c?c.nome:'?',dataApagado:todayISO(),motivo:'cancelamento'});
  DB.robos=DB.robos.filter(function(x){return x.id!==CD.roboId;});
  if(c&&DB.robos.filter(function(x){return x.clienteId===c.id;}).length===0)DB.clientes=DB.clientes.filter(function(x){return x.id!==c.id;});
  saveDB();closeModal();if(fichaClienteId)refreshFichaContent();renderAll();showToast('❌ Reparo cancelado e arquivado.');
}
