function renderTimeline(r){
  var steps=[];
  steps.push({ok:true,label:'📥 Check-in',data:r.dataEntrada});
  steps.push({ok:!!(r.bancada||r.entradaBancada),label:'🔧 Bancada',data:r.bancada&&r.bancada.data?r.bancada.data:null});
  steps.push({ok:!!r.diagnostico,label:'💊 Diagnóst.',data:r.diagnostico?r.diagnostico.data:null});
  if(r.status==='garantia')steps.push({ok:true,label:'✅ Entregue',data:r.dataEntrega});
  var html='<div style="display:flex;align-items:center;gap:0;margin:6px 0;overflow-x:auto;padding-bottom:2px;">';
  steps.forEach(function(s,i){
    var cor=s.ok?'var(--cyan)':'var(--text3)';
    var bg=s.ok?'rgba(0,229,255,.12)':'rgba(255,255,255,.04)';
    html+='<div style="display:flex;flex-direction:column;align-items:center;min-width:64px;">'+
      '<div style="background:'+bg+';border:1px solid '+(s.ok?'rgba(0,229,255,.35)':'var(--border)')+';border-radius:6px;padding:3px 5px;font-size:9px;font-weight:700;color:'+cor+';white-space:nowrap;text-align:center;">'+s.label+'</div>'+
      '<div style="font-size:9px;color:var(--text3);margin-top:1px;">'+(s.data?fmtData(s.data):'—')+'</div>'+
    '</div>'+
    (i<steps.length-1?'<div style="flex:1;height:1px;background:'+(s.ok?'rgba(0,229,255,.3)':'var(--border)')+';min-width:4px;margin-bottom:14px;"></div>':'');
  });
  html+='</div>';
  return html;
}
