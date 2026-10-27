function marcarRoboPago(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var num='#'+String(r.numVisual).padStart(3,'0');
  openModal('<div class="modal-title">💰 Confirmar Pagamento</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:16px;">Confirmar que <strong style="color:var(--cyan);">'+num+' — '+esc(r.modelo||'—')+'</strong> foi pago?</div>'+
    '<div class="modal-actions">'+
    '<button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-green" onclick="executarMarcarPago(\''+roboId+'\')">💰 Confirmar Pago</button>'+
    '</div>');
}

function executarMarcarPago(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  r.pago=true;
  r.dataPagamento=todayISO();
  // Remove alerta de cobrança
  if(DB.lembretes)DB.lembretes=DB.lembretes.filter(function(l){return!(l.roboId===roboId&&l.tipo==='cobranca');});
  saveDB();closeModal();if(fichaClienteId)refreshFichaContent();renderAll();
  showToast('💰 Pagamento confirmado!');
}

function mostrarBotoesEntregaFinanceiro(roboId){
  var existing=document.getElementById('btns-fin-'+roboId);
  if(existing){existing.style.display=existing.style.display==='none'?'flex':'none';return;}
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var div=document.getElementById('btns-fin-wrap-'+roboId);
  if(!div)return;
  var pagoVal=r.pago?'true':'false';
  div.innerHTML=
    '<div style="font-size:10px;color:var(--text3);margin-bottom:6px;">Situação atual: '+(r.pago?'💰 Pago':'⏳ Não pago')+' · '+(r.entregue?'📦 Entregue':'📦 Não entregue')+'</div>'+
    (!r.entregue&&!r.pago?'<button onclick="executarEntregaFinanceiro(\''+roboId+'\',true,true)" style="background:rgba(0,230,118,.15);border:1px solid rgba(0,230,118,.4);color:#00e676;padding:8px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:12px;cursor:pointer;width:100%;text-align:left;margin-bottom:4px;">✅💰 Entregue e pago</button>':'')+
    (!r.entregue?'<button onclick="executarEntregaFinanceiro(\''+roboId+'\',true,'+pagoVal+')" style="background:rgba(0,229,255,.1);border:1px solid rgba(0,229,255,.3);color:var(--cyan);padding:8px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:12px;cursor:pointer;width:100%;text-align:left;margin-bottom:4px;">📦 Marcar Entregue</button>':'')+
    (!r.pago?'<button onclick="executarMarcarPagoFinanceiro(\''+roboId+'\')" style="background:rgba(255,214,0,.1);border:1px solid rgba(255,214,0,.3);color:#ffd600;padding:8px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:12px;cursor:pointer;width:100%;text-align:left;margin-bottom:4px;">💰 Marcar Pago</button>':'')+
    (r.pago?'<button onclick="executarCorrigirFinanceiro(\''+roboId+'\',\'pago\',false)" style="background:rgba(255,68,68,.08);border:1px solid rgba(255,68,68,.25);color:#ff6666;padding:6px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-size:11px;cursor:pointer;width:100%;text-align:left;margin-bottom:4px;">↩️ Desfazer pagamento</button>':'')+
    (r.entregue?'<button onclick="executarCorrigirFinanceiro(\''+roboId+'\',\'entregue\',false)" style="background:rgba(255,68,68,.08);border:1px solid rgba(255,68,68,.25);color:#ff6666;padding:6px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-size:11px;cursor:pointer;width:100%;text-align:left;margin-bottom:4px;">↩️ Desfazer entrega</button>':'')+
    '<button onclick="document.getElementById(\'btns-fin-wrap-'+roboId+'\').style.display=\'none\'" style="background:none;border:1px solid var(--border);color:var(--text3);padding:6px;border-radius:8px;font-family:\'Rajdhani\',sans-serif;font-size:11px;cursor:pointer;width:100%;">✕ Fechar</button>';
  div.style.display='flex';
  div.style.flexDirection='column';
  div.style.gap='6px';
  div.style.padding='8px';
  div.style.marginTop='6px';
  div.style.background='rgba(255,255,255,.04)';
  div.style.borderRadius='8px';
  div.style.border='1px solid var(--border)';
}

function executarCorrigirFinanceiro(roboId,campo,valor){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  r[campo]=valor;
  if(campo==='entregue'&&!valor)r.dataEntrega=null;
  saveDB();
  setTimeout(function(){abrirResumoFinanceiro();},300);
}

function executarMarcarPagoFinanceiro(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  r.pago=true;
  r.dataPagamento=todayISO();
  if(DB.lembretes)DB.lembretes=DB.lembretes.filter(function(l){return!(l.roboId===roboId&&l.tipo==='cobranca');});
  saveDB();
  setTimeout(function(){abrirResumoFinanceiro();},300);
}

function executarEntregaFinanceiro(roboId,entregue,pago){
  executarEntrega(roboId,entregue,pago);
  // Reabre o resumo após 300ms
  setTimeout(function(){abrirResumoFinanceiro();},300);
}
