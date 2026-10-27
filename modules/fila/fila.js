function renderFila(){
  var el=document.getElementById('fila-list');
  var hoje=new Date();hoje.setHours(0,0,0,0);
  var todos=DB.robos.filter(function(r){return r.status==='reparo';}).sort(function(a,b){return a.dataEntrada<b.dataEntrada?-1:a.dataEntrada>b.dataEntrada?1:a.numVisual-b.numVisual;});
  if(!todos.length){el.innerHTML='<div class="empty-state"><div class="empty-icon">🔧</div><p>Nenhum robô em reparo.</p></div>';return;}
  // Separar por categoria
  var criticos=[], proximoAtraso=[], agPeca=[], emAnalise=[], noPrazo=[];
  var aguardRetirada=[];
  todos.forEach(function(r){
    if(r.servicoPronto){aguardRetirada.push(r);return;}
    if(r.aguardandoPeca){agPeca.push(r);return;}
    var d=diasDesde(r.dataEntrada);
    if(d>40)criticos.push(r);
    else if(d>35)proximoAtraso.push(r);
    else if(d>15)emAnalise.push(r);
    else noPrazo.push(r);
  });
  function secaoFila(titulo,cor,lista){
    if(!lista.length)return'';
    return'<div class="section-title" style="color:'+cor+';">'+titulo+' ('+lista.length+')</div>'+
      lista.map(function(r){
        var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
        return'<div class="cliente-label">'+(c?esc(c.nome.toUpperCase()):'?')+'</div>'+renderRoboCard(r,true);
      }).join('');
  }
  function secaoAgPeca(lista){
    if(!lista.length)return'';
    return'<div class="section-title" style="color:#c77dff;">📦 AGUARDANDO PEÇA ('+lista.length+')</div>'+
      lista.map(function(r){
        var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
        var num='#'+String(r.numVisual).padStart(3,'0');
        var ap=r.aguardandoPeca;
        var diasFalta=0;var atrasou=false;
        if(ap&&ap.dataPrevista){
          var dp=new Date(ap.dataPrevista+'T00:00:00');
          diasFalta=Math.ceil((dp-hoje)/(1000*60*60*24));
          atrasou=diasFalta<0;
        }
        return'<div class="cliente-label">'+(c?esc(c.nome.toUpperCase()):'?')+'</div>'+
          '<div class="card" style="border-color:'+(atrasou?'#ff4444':'#c77dff')+';">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'+
          '<div><div class="robot-num" style="color:#c77dff;">'+num+'</div>'+
          '<div class="robot-model">'+esc(r.modelo||'—')+'</div>'+
          (ap&&ap.dataPrevista?'<div style="font-size:11px;color:'+(atrasou?'#ff4444':'#c77dff')+';">'+(atrasou?'⚠️ Peça atrasada':'📅 Prev: '+fmtData(ap.dataPrevista))+'</div>':'')+'</div>'+
          '<div style="text-align:right;">'+
          '<div style="font-size:28px;font-weight:700;color:'+(atrasou?'#ff4444':'#c77dff')+';">'+Math.abs(diasFalta)+'</div>'+
          '<div style="font-size:11px;color:var(--text2);">'+(atrasou?'dias atraso':'dias</div>')+'</div>'+
          '</div>'+
          '<div class="robot-actions">'+
          '<button class="btn btn-cyan" onclick="openFichaRobo(\''+r.id+'\')" >📋 Ficha</button>'+
          '<button class="btn" onclick="cancelarAguardandoPeca(\''+r.id+'\')" style="background:rgba(255,68,68,.15);border:1px solid rgba(255,68,68,.4);color:#ff6b6b;">❌ Cancelar</button>'+
          '</div></div>';
      }).join('');
  }
  el.innerHTML=
    secaoFila('📦 AGUARDANDO RETIRADA','#00c896',aguardRetirada)+
    secaoFila('🔥 CRÍTICO — mais de 40 dias','var(--orange)',criticos)+
    secaoFila('⚠️ PRÓXIMO DO ATRASO','#ff4444',proximoAtraso)+
    secaoAgPeca(agPeca)+
    secaoFila('🔧 EM ANÁLISE','var(--cyan)',emAnalise)+
    secaoFila('✅ DENTRO DO PRAZO','var(--green)',noPrazo);
}
