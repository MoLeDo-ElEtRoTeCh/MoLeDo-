function renderDiagnosticoLista(){
  var el=document.getElementById('diagnostico-list');
  // TODOS os robôs que entraram na bancada (com ou sem diagnóstico)
  var robos=DB.robos.filter(function(r){
    return r.status==='reparo'&&(r.bancada||r.entradaBancada||r.diagnostico);
  }).sort(function(a,b){
    // Sem diagnóstico primeiro, depois por data
    var ta=a.diagnostico?1:0, tb=b.diagnostico?1:0;
    if(ta!==tb)return ta-tb;
    return a.dataEntrada<b.dataEntrada?-1:1;
  });
  var semDiag=robos.filter(function(r){return !r.diagnostico;}).length;
  var topo='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'+
    '<div style="font-family:\'Orbitron\',monospace;font-size:12px;font-weight:700;color:var(--cyan2);letter-spacing:2px;text-transform:uppercase;">💊 Diagnósticos'+(semDiag?' · '+semDiag+' pendente'+(semDiag>1?'s':''):'')+'</div>'+
    '<button class="btn btn-close" onclick="abrirConfigDiag()" style="font-size:13px;padding:7px 12px;">⚙️ Config</button></div>';
  if(!robos.length){el.innerHTML=topo+'<div class="empty-state"><div class="empty-icon">💊</div><p>Nenhum robô em bancada ainda.</p></div>';return;}
  el.innerHTML=topo+robos.map(function(r){
    var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
    var num='#'+String(r.numVisual).padStart(3,'0');var tem=!!r.diagnostico;
    return'<div class="card'+(tem?' diag-card':'')+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;">'+
      '<div><div class="cliente-label">'+(c?esc(c.nome.toUpperCase()):'?')+'</div>'+
      '<div class="robot-num">'+num+'</div><div class="robot-model">'+esc(descricaoEquipamento(r))+'</div></div>'+
      '<div style="text-align:right;">'+(tem?'<div style="color:var(--yellow);font-size:11px;font-weight:700;">💊 Salvo</div><div style="font-size:12px;color:var(--text2);">'+fmtVal(r.diagnostico.total)+'</div><div class="diag-data">'+fmtData(r.diagnostico.data)+'</div>':'<div style="font-size:11px;color:var(--text3);">⏳ Sem diagnóstico</div>')+'</div></div>'+
      '<div class="robot-actions" style="margin-top:10px;">'+
      (tem
        ?'<button class="btn btn-yellow" onclick="abrirDiagnostico(\''+r.id+'\')">💊 Editar Diagnóstico</button>'
        :'<button class="btn" onclick="abrirDiagnostico(\''+r.id+'\')" style="background:rgba(150,150,150,.15);border:1px solid rgba(150,150,150,.4);color:#aaa;">💊 Fazer Diagnóstico</button>')+
      '<button class="btn btn-wa" onclick="abrirWhatsApp(\''+r.id+'\')">💬 WhatsApp</button>'+
      '</div></div>';
  }).join('');
}
