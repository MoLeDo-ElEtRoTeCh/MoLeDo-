function renderRelatorio(){
  var el=document.getElementById('relatorio-list');if(!el)return;
  // Listas por filtro
  var emFila=DB.robos.filter(function(r){return r.status==='reparo'&&!r.bancada&&!r.entradaBancada&&!r.diagnostico;});
  var naBancada=DB.robos.filter(function(r){return r.status==='reparo'&&(r.bancada||r.entradaBancada)&&!r.diagnostico;});
  var emDiag=DB.robos.filter(function(r){return r.status==='reparo'&&r.diagnostico;});
  var finalizados=DB.robos.filter(function(r){return r.status==='garantia';});
  // Botões de filtro
  var btns='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">';
  var filtros=[
    {id:'fila',label:'⏳ Em Fila',count:emFila.length,color:'var(--cyan)'},
    {id:'bancada',label:'🔧 Na Bancada',count:naBancada.length,color:'#ff6d00'},
    {id:'diagnostico',label:'💊 Diagnóstico',count:emDiag.length,color:'var(--yellow)'},
    {id:'finalizados',label:'✅ Finalizados',count:finalizados.length,color:'#00e676'}
  ];
  filtros.forEach(function(f){
    var sel=_relFiltro===f.id;
    var fid=f.id;
    btns+='<div onclick="toggleRelFiltro(\''+fid+'\')" style="background:'+(sel?'rgba(0,229,255,.15)':'var(--bg2)')+';border:2px solid '+(sel?f.color:'var(--border)')+';border-radius:10px;padding:10px;cursor:pointer;text-align:center;">'+
      '<div style="font-size:20px;font-weight:900;color:'+f.color+';">'+f.count+'</div>'+
      '<div style="font-size:11px;font-weight:700;color:'+(sel?f.color:'var(--text3)')+';">'+f.label+'</div>'+
    '</div>';
  });
  btns+='</div>';
  // Se tem filtro selecionado, mostrar lista de robôs
  if(_relFiltro){
    var lista2=_relFiltro==='fila'?emFila:_relFiltro==='bancada'?naBancada:_relFiltro==='diagnostico'?emDiag:finalizados;
    var tituloFiltro=filtros.find(function(f){return f.id===_relFiltro;});
    var html2=btns+'<div class="section-title">'+tituloFiltro.label+' ('+lista2.length+')</div>';
    if(!lista2.length){
      html2+='<div class="empty-state"><p>Nenhum robô nesta categoria.</p></div>';
    } else {
      lista2.forEach(function(r){
        var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
        var num='#'+String(r.numVisual).padStart(3,'0');
        var dias=diasDesde(r.dataEntrada);
        html2+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">'+
          '<div>'+
            '<div style="font-size:13px;font-weight:700;">'+num+' · '+esc(r.modelo||'—')+'</div>'+
            '<div style="font-size:11px;color:var(--text3);">'+esc(c?c.nome:'?')+'</div>'+
            (r.diagnostico?'<div style="font-size:11px;color:var(--yellow);">'+fmtVal(r.diagnostico.total)+'</div>':'')+'</div>'+
          '<div style="text-align:right;">'+
            '<div style="font-size:20px;font-weight:900;color:'+tituloFiltro.color+';">'+dias+'</div>'+
            '<div style="font-size:10px;color:var(--text3);">dias</div>'+
          '</div>'+
        '</div>';
      });
    }
    el.innerHTML=html2;
    return;
  }
  // Sem filtro: mostrar relatório normal por mês
  var meses={};
  var todos=DB.robos.concat((DB.lixeira||[]).map(function(x){return x.robo;}));
  todos.forEach(function(r){
    if(!r||!r.dataEntrada)return;
    var mes=r.dataEntrada.slice(0,7);// YYYY-MM
    if(!meses[mes])meses[mes]={mes:mes,entradas:0,concluidos:0,cancelados:0,faturamento:0,modelos:{},defeitos:{}};
    meses[mes].entradas++;
    if(r.status==='garantia')meses[mes].concluidos++;
    if(r.motivo==='cancelamento')meses[mes].cancelados++;
    if(r.diagnostico&&r.diagnostico.total)meses[mes].faturamento+=r.diagnostico.total;
    if(r.modelo)meses[mes].modelos[r.modelo]=(meses[mes].modelos[r.modelo]||0)+1;
    if(r.defeitos)r.defeitos.forEach(function(d){meses[mes].defeitos[d]=(meses[mes].defeitos[d]||0)+1;});
  });
  var lista=Object.values(meses).sort(function(a,b){return b.mes>a.mes?1:-1;});
  // Ranking geral de modelos e defeitos
  var todosModelos={},todosDefeitos={};
  todos.forEach(function(r){
    if(!r)return;
    if(r.modelo)todosModelos[r.modelo]=(todosModelos[r.modelo]||0)+1;
    if(r.defeitos)r.defeitos.forEach(function(d){todosDefeitos[d]=(todosDefeitos[d]||0)+1;});
  });
  var topModelos=Object.entries(todosModelos).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
  var topDefeitos=Object.entries(todosDefeitos).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
  var html=btns+'<div class="section-title">📊 Relatório Geral</div>';
  // Rankings
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">';
  html+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px;">'+
    '<div style="font-size:11px;font-weight:700;color:var(--cyan);letter-spacing:1px;margin-bottom:8px;">🏆 TOP MODELOS</div>'+
    topModelos.map(function(m,i){return'<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--border);"><span>'+(i+1)+'. '+esc(m[0])+'</span><span style="color:var(--cyan);font-weight:700;">'+m[1]+'x</span></div>';}).join('')+
  '</div>';
  html+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px;">'+
    '<div style="font-size:11px;font-weight:700;color:#ff6d00;letter-spacing:1px;margin-bottom:8px;">⚠️ TOP DEFEITOS</div>'+
    topDefeitos.map(function(d,i){return'<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid var(--border);"><span>'+(i+1)+'. '+esc(d[0])+'</span><span style="color:#ff6d00;font-weight:700;">'+d[1]+'x</span></div>';}).join('')+
  '</div>';
  html+='</div>';
  // Meses
  html+='<div style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:1px;margin-bottom:8px;">📅 POR MÊS</div>';
  lista.forEach(function(m){
    var dt=new Date(m.mes+'-01');
    var label=dt.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    var aberto=_relMes===m.mes;
    var valVisible=_relValVisible===m.mes;
    var emAbertoMes=DB.robos.filter(function(r){return r.status==='reparo'&&r.dataEntrada&&r.dataEntrada.slice(0,7)===m.mes;});
    html+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;overflow:hidden;">'+
      '<div onclick="toggleRelMes(\''+m.mes+'\')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;cursor:pointer;">'+
        '<div>'+
          '<div style="font-size:13px;font-weight:700;color:var(--text);text-transform:capitalize;">'+label+'</div>'+
          '<div style="font-size:11px;color:var(--text3);">'+m.entradas+' entrada(s) · '+m.concluidos+' concluído(s)'+(emAbertoMes.length?' · <span style="color:var(--orange);">🔧 '+emAbertoMes.length+' em aberto</span>':'')+'</div>'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:8px;">'+
          '<button onclick="event.stopPropagation();toggleRelVal(\''+m.mes+'\')" style="background:none;border:none;font-size:16px;cursor:pointer;color:var(--text3);">'+(valVisible?'🙈':'👁️')+'</button>'+
          '<div style="font-size:13px;font-weight:900;color:#00e676;">'+(valVisible?fmtVal(m.faturamento):'R$ ···')+'</div>'+
          '<div style="font-size:16px;">'+(aberto?'▲':'▼')+'</div>'+
        '</div>'+
      '</div>'+
      (aberto?'<div style="padding:0 12px 12px;border-top:1px solid var(--border);">'+
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:10px 0;">'+
          '<div style="background:var(--bg3);border-radius:8px;padding:8px;text-align:center;"><div style="font-size:18px;font-weight:900;color:var(--cyan);">'+m.entradas+'</div><div style="font-size:10px;color:var(--text3);">Entradas</div></div>'+
          '<div style="background:var(--bg3);border-radius:8px;padding:8px;text-align:center;"><div style="font-size:18px;font-weight:900;color:#00e676;">'+m.concluidos+'</div><div style="font-size:10px;color:var(--text3);">Concluídos</div></div>'+
          '<div style="background:var(--bg3);border-radius:8px;padding:8px;text-align:center;"><div style="font-size:18px;font-weight:900;color:#ff4444;">'+m.cancelados+'</div><div style="font-size:10px;color:var(--text3);">Cancelados</div></div>'+
        '</div>'+
        (Object.keys(m.modelos).length?'<div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:4px;">MODELOS</div>'+
        Object.entries(m.modelos).sort(function(a,b){return b[1]-a[1];}).map(function(x){return'<div style="font-size:11px;display:flex;justify-content:space-between;padding:2px 0;"><span>'+esc(x[0])+'</span><span style="color:var(--cyan);">'+x[1]+'x</span></div>';}).join(''):'')+'</div>':'')+'</div>';    if(aberto&&emAbertoMes.length){
      html+='<div style="background:rgba(255,109,0,.06);border:1px solid rgba(255,109,0,.2);border-radius:8px;padding:8px;margin-top:6px;">';
      html+='<div style="font-size:10px;font-weight:700;color:var(--orange);letter-spacing:1px;margin-bottom:6px;">🔧 EM ABERTO NESTE MÊS</div>';
      emAbertoMes.forEach(function(r){
        var c2=DB.clientes.find(function(x){return x.id===r.clienteId;});
        var num2='#'+String(r.numVisual).padStart(3,'0');
        var dias2=diasDesde(r.dataEntrada);
        html+='<div style="font-size:12px;display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04);">'+
          '<span>'+num2+' '+esc(r.modelo||'—')+' · '+esc(c2?c2.nome:'?')+(r.aguardandoPeca?' 📦':'')+'</span>'+
          '<span style="color:var(--orange);">'+dias2+'d</span></div>';
      });
      html+='</div>';
    }

  });
  if(!lista.length)html+='<div class="empty-state"><div class="empty-icon">📊</div><p>Nenhum dado ainda.</p></div>';
  el.innerHTML=html;
}

function toggleRelFiltro(f){_relFiltro=_relFiltro===f?null:f;renderRelatorio();}

function toggleRelMes(mes){_relMes=_relMes===mes?null:mes;renderRelatorio();}

function toggleRelVal(mes){_relValVisible=_relValVisible===mes?null:mes;renderRelatorio();}
