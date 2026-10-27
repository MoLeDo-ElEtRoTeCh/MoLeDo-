function gerarPDFResumo(){
  var garantia=DB.robos.filter(function(r){return r.status==='garantia'&&r.diagnostico&&r.diagnostico.total>0;});
  var reparo=DB.robos.filter(function(r){return r.status==='reparo'&&r.diagnostico&&r.diagnostico.total>0;});
  var cancelados=(DB.lixeira||[]).filter(function(x){return x.robo&&x.robo.diagnostico&&x.motivo==='cancelamento';}).map(function(x){return Object.assign({},x.robo,{_cancelado:true});});
  var totalGarantia=garantia.reduce(function(a,r){return a+(r.diagnostico.total||0);},0);
  var totalReparo=reparo.reduce(function(a,r){return a+(r.diagnostico.total||0);},0);
  var totalCanc=cancelados.reduce(function(a,r){return a+(r.diagnostico?r.diagnostico.abertura||200:0);},0);
  var totalGeral=totalGarantia+totalReparo+totalCanc;
  var hoje=new Date().toLocaleDateString('pt-BR');
  function secao(titulo,cor,robos,getVal){
    if(!robos.length)return'';
    var rows=robos.map(function(r){
      var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
      var num='#'+String(r.numVisual).padStart(3,'0');
      return'<tr><td style="padding:4px 6px;">'+(c?esc(c.nome):'—')+'</td><td style="padding:4px 6px;">'+num+'</td><td style="padding:4px 6px;">'+esc(descricaoEquipamento(r)||'—')+'</td><td style="padding:4px 6px;text-align:right;font-weight:700;color:'+cor+';">'+fmtVal(getVal(r))+'</td></tr>';
    }).join('');
    return'<div style="margin-bottom:14px;"><div style="background:'+cor+';color:#fff;padding:6px 10px;font-size:12px;font-weight:700;border-radius:4px 4px 0 0;">'+titulo+'</div>'+
      '<table style="width:100%;border-collapse:collapse;font-size:11px;border:1px solid #ddd;"><thead><tr style="background:#f5f5f5;"><th style="padding:4px 6px;text-align:left;">Cliente</th><th>Código</th><th>Modelo</th><th style="text-align:right;">Valor</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  }
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resumo Financeiro</title>'+
    '<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;padding:20px;color:#111;}@media print{button{display:none;}@page{margin:10mm;}}</style>'+
    '</head><body>'+
    '<div style="text-align:center;border-bottom:3px solid #007ea8;padding-bottom:10px;margin-bottom:16px;">'+
      '<img src="https://moledo-eletrotech.github.io/MoLeDo-/logogarantia.png" style="height:50px;display:block;margin:0 auto 6px;">'+
      '<div style="font-size:15px;font-weight:900;color:#007ea8;">RESUMO FINANCEIRO</div>'+
      '<div style="font-size:11px;color:#888;">'+hoje+'</div>'+
    '</div>'+
    secao('🛡️ Garantia — Já Recebido','#7b1fa2',garantia,function(r){return r.diagnostico.total||0;})+
    secao('🔧 Em Reparo — A Receber','#007ea8',reparo,function(r){return r.diagnostico.total||0;})+
    secao('❌ Cancelados — Diagnóstico','#c00',cancelados,function(r){return r.diagnostico?r.diagnostico.abertura||200:0;})+
    '<div style="background:#f0f8ff;border:2px solid #007ea8;border-radius:6px;padding:12px;display:flex;justify-content:space-between;align-items:center;margin-top:8px;">'+
      '<span style="font-size:14px;font-weight:700;">TOTAL GERAL</span>'+
      '<span style="font-size:20px;font-weight:900;color:#007ea8;">'+fmtVal(totalGeral)+'</span>'+
    '</div>'+
    '<div style="text-align:center;margin-top:14px;"><button onclick="window.print()" style="padding:10px 20px;background:#007ea8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:700;">🖨️ Imprimir / Salvar PDF</button></div>'+
    '</body></html>';
  var blob=new Blob([html],{type:'text/html;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  window.open(url,'_blank');
  setTimeout(function(){URL.revokeObjectURL(url);},15000);
}
