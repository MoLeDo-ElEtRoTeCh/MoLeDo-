function equipamentosDoVendedor(id){return DB.robos.filter(function(r){return r.clienteId===id&&equipamentoFisicamenteComigo(r);});}
function resumoEquipamentosComigo(id){
  return 'Olá! Segue a relação atual dos seus equipamentos que estão comigo:\n\n'+equipamentosDoVendedor(id).map(function(r){
    return '#'+String(r.numVisual).padStart(3,'0')+' · '+descricaoEquipamento(r)+' · Entrada: '+fmtData(r.dataEntrada)+' · '+situacaoEquipamento(r);
  }).join('\n');
}
function abrirEquipamentosComigo(id){
  var c=DB.clientes.find(function(x){return x.id===id;});if(!c)return;
  var lista=equipamentosDoVendedor(id);
  openModal('<div class="modal-title">EQUIPAMENTOS COMIGO · '+esc(c.nome)+'</div><div>'+lista.length+' atualmente na assistência</div>'+lista.map(function(r){
    return '<div class="card"><strong>#'+String(r.numVisual).padStart(3,'0')+' · '+esc(nomeEquipamento(r))+'</strong><div>'+esc(descricaoEquipamento(r))+'</div><div>SN: '+esc(temSnValido(r.sn)?r.sn:'Sem código')+'</div>'+
      (r.nomeClienteFinal?'<div>Cliente final: '+esc(r.nomeClienteFinal)+'</div>':'')+'<div>Entrada: '+fmtData(r.dataEntrada)+' · '+diasDesde(r.dataEntrada)+' dias comigo</div><div>'+esc(situacaoEquipamento(r))+'</div><div>OS: '+esc(r.numOS||'—')+(r.diagnostico?' · '+fmtVal(getValorCobravel(r)):'')+'</div></div>';
  }).join('')+'<textarea id="comigo-resumo" class="form-input" rows="7">'+esc(resumoEquipamentosComigo(id))+'</textarea><div class="modal-actions">'+
    '<button class="btn btn-cyan" onclick="copiarResumoComigo()">Copiar resumo</button><button class="btn btn-wa" data-cliente="'+esc(id)+'" onclick="abrirMensagemManual(this.dataset.cliente,document.getElementById(\'comigo-resumo\').value)">Abrir WhatsApp</button><button class="btn btn-close" onclick="closeModal()">Fechar</button></div>');
}
function copiarResumoComigo(){navigator.clipboard.writeText(document.getElementById('comigo-resumo').value).then(function(){showToast('Resumo copiado');}).catch(function(){showToast('Selecione o texto para copiar.');});}
function blocoEquipamentosComigo(id){
  var c=DB.clientes.find(function(x){return x.id===id;});
  if(!c||(c.tipo!=='vd'&&c.tipo!=='vc'))return '';
  return '<button class="btn btn-cyan" style="width:100%;margin-bottom:12px" data-cliente="'+esc(id)+'" onclick="abrirEquipamentosComigo(this.dataset.cliente)">EQUIPAMENTOS COMIGO · '+equipamentosDoVendedor(id).length+'</button>';
}
