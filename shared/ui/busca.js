function toggleBusca(){
  buscaAberta=!buscaAberta;
  var el=document.getElementById('busca-overlay');
  if(el){
    el.style.display=buscaAberta?'flex':'none';
    if(buscaAberta){
      var inp=document.getElementById('busca-input');
      inp.value='';
      document.getElementById('busca-resultados').innerHTML='<div style="padding:16px;text-align:center;color:var(--text3);font-size:13px;">Digite ao menos 2 letras...</div>';
      inp.focus();
    }
  }
}

function fecharOuLimparBusca(){
  var inp=document.getElementById('busca-input');
  if(inp&&inp.value.length>0){
    inp.value='';
    document.getElementById('busca-resultados').innerHTML='<div style="padding:16px;text-align:center;color:var(--text3);font-size:13px;">Digite ao menos 2 letras...</div>';
    inp.focus();
  } else {
    buscaAberta=false;
    var el=document.getElementById('busca-overlay');
    if(el)el.style.display='none';
  }
}

function executarBusca(val){
  clearTimeout(_buscaTimer);
  var res=document.getElementById('busca-resultados');if(!res)return;
  if(!val||val.length<2){res.innerHTML='<div style="padding:16px;text-align:center;color:var(--text3);font-size:13px;">Digite ao menos 2 letras...</div>';return;}
  _buscaTimer=setTimeout(function(){_executarBuscaAgora(val);},200);
}

function _executarBuscaAgora(val){
  var res=document.getElementById('busca-resultados');if(!res)return;
  var q=val.toLowerCase().replace(/\D/g,'');// versão só números pra busca por fone
  var qStr=val.toLowerCase();
  var html='';
  // Clientes
  DB.clientes.forEach(function(c){
    var nomeMatch=c.nome.toLowerCase().indexOf(qStr)!==-1;
    var foneMatch=q.length>=4&&c.whatsapp.replace(/\D/g,'').indexOf(q)!==-1;
    if(nomeMatch||foneMatch){
      var robosCliente=DB.robos.filter(function(r){return r.clienteId===c.id&&r.status==='reparo';});
      html+='<div onclick="toggleBusca();document.getElementById(\'busca-input\').value=\'\';openClienteDetalhe(\''+c.id+'\')" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;active:background:var(--bg2);">'+
        '<span style="font-size:18px;">👤</span>'+
        '<div style="flex:1;">'+
          '<div style="font-size:14px;font-weight:700;color:var(--text);">'+esc(c.nome)+'</div>'+
          '<div style="font-size:12px;color:var(--text3);">📱 '+esc(c.whatsapp)+(robosCliente.length?' · 🤖 '+robosCliente.length+' em reparo':'')+'</div>'+
        '</div>'+
        '<span style="font-size:11px;color:var(--cyan2);font-weight:700;">'+(foneMatch&&!nomeMatch?'📱':'')+'</span>'+
      '</div>';
    }
  });
  // Robôs por modelo/SN/número
  DB.robos.forEach(function(r){
    var c=DB.clientes.find(function(x){return x.id===r.clienteId;});
    var num='#'+String(r.numVisual).padStart(3,'0');
    var numOS=r.numOS||'';
    if((r.modelo&&r.modelo.toLowerCase().indexOf(qStr)!==-1)||(r.sn&&r.sn.toLowerCase().indexOf(qStr)!==-1)||num.indexOf(qStr)!==-1||numOS.toLowerCase().indexOf(qStr)!==-1){
      var statusCor=r.status==='garantia'?'#ce93d8':r.status==='reparo'?'var(--cyan)':'var(--text3)';
      html+='<div onclick="toggleBusca();document.getElementById(\'busca-input\').value=\'\';openFichaRobo(\''+r.id+'\')" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">'+
        '<span style="font-size:18px;">🤖</span>'+
        '<div style="flex:1;">'+
          '<div style="font-size:14px;font-weight:700;color:'+statusCor+';">'+num+' · '+esc(r.modelo||'—')+'</div>'+
          '<div style="font-size:12px;color:var(--text3);">'+(c?esc(c.nome):'')+' · '+esc(r.sn||'—')+(numOS?' · '+numOS:'')+'</div>'+
        '</div>'+
        '<span style="font-size:10px;color:var(--text3);">'+esc(r.status)+'</span>'+
      '</div>';
    }
  });
  res.innerHTML=html||'<div style="padding:16px;text-align:center;color:var(--text3);font-size:13px;">Nenhum resultado para "<b>'+esc(val)+'</b>"</div>';
}
