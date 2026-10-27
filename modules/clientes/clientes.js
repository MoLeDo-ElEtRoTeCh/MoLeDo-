function getAtivos(cId){return DB.robos.filter(function(r){return r.clienteId===cId&&r.status==='reparo';});}

function getGar(cId){return DB.robos.filter(function(r){return r.clienteId===cId&&r.status==='garantia';});}

function getAtras(cId){return DB.robos.filter(function(r){return r.clienteId===cId&&r.status==='reparo'&&diasDesde(r.dataEntrada)>40;});}

function getMaior(cId){var a=getAtivos(cId);return a.length?Math.max.apply(null,a.map(function(r){return diasDesde(r.dataEntrada);})):0;}

function renderClientes(){
  var el=document.getElementById('clientes-list');
  verificarVendedoresInativos();
  var hoje=new Date();hoje.setHours(0,0,0,0);
  var lista=[...DB.clientes].sort(function(a,b){return a.nome.localeCompare(b.nome,'pt-BR');});
  if(filtroCliente==='cf')lista=lista.filter(function(c){return !c.tipo||c.tipo==='cf';});
  else if(filtroCliente==='vd')lista=lista.filter(function(c){return c.tipo==='vd'||c.tipo==='vc';});
  else if(filtroCliente==='inativo')lista=lista.filter(function(c){return c.inativo;});
  if(!lista.length){el.innerHTML='<div class="empty-state"><div class="empty-icon">👤</div><p>Nenhum cliente encontrado.<br>Use a aba Check-in.</p></div>';return;}
  el.innerHTML=lista.map(function(c){
    var ativos=getAtivos(c.id),gars=getGar(c.id),atras=getAtras(c.id);
    var total=DB.robos.filter(function(r){return r.clienteId===c.id;}).length;
    var prontos=ativos.filter(function(r){return !!r.servicoPronto;}).length;
    var aguardPeca=ativos.filter(function(r){return !!r.aguardandoPeca;}).length;
    var datas=DB.robos.filter(function(r){return r.clienteId===c.id;}).map(function(r){return r.dataEntrada;}).sort().reverse();
    var tipoBadge='';
    if(c.tipo==='vd')tipoBadge='<span style="background:rgba(255,214,0,.15);border:1px solid rgba(255,214,0,.3);color:#ffd600;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;margin-left:6px;">🏪 Vendedor</span>';
    else if(c.tipo==='vc'){var robosVC=DB.robos.filter(function(x){return x.clienteId===c.id&&x.nomeClienteFinal;});var cfNames=robosVC.map(function(x){return x.nomeClienteFinal;}).filter(function(v,i,a){return a.indexOf(v)===i;}).join(', ');tipoBadge='<span style="background:rgba(170,0,255,.15);border:1px solid rgba(170,0,255,.3);color:#aa00ff;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;margin-left:6px;">🤝 Vend+Cliente'+(cfNames?' | '+esc(cfNames):'')+'</span>';}
    var inativoBadge=c.inativo?'<span style="background:rgba(100,100,100,.2);border:1px solid #555;color:#888;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;margin-left:6px;">💤 Inativo</span>':'';
    // dias inativo
    var diasInativo='';
    if(c.inativo&&c.dataInativo){
      var di=new Date(c.dataInativo);di.setHours(0,0,0,0);
      diasInativo='<span style="color:#888;font-size:11px;">💤 '+Math.floor((hoje-di)/(1000*60*60*24))+' dias sem robô</span>';
    }
    return'<div class="card client-card" onclick="openClienteDetalhe(\''+c.id+'\')" style="'+(c.inativo?'opacity:.7':'')+'">'+
      '<button class="client-more-btn" onclick="event.stopPropagation();abrirMenuCliente(\''+c.id+'\')" title="Mais opções">⋮</button>'+
      '<div class="client-name" style="padding-right:42px;">'+esc(c.nome)+tipoBadge+inativoBadge+'</div>'+
      '<div class="client-wa" onclick="event.stopPropagation();abrirWhatsAppDireto(\''+c.id+'\')" style="cursor:pointer;display:inline-block;">📱 '+esc(c.whatsapp)+' <span style="font-size:11px;color:#25d366;">💬</span></div>'+
      '<div class="client-tags"><span class="tag total">📦 Total: '+total+'</span>'+
      (ativos.length?'<span class="tag reparo">🔧 Reparo: '+ativos.length+'</span>':'')+
      (gars.length?'<span class="tag garantia">🛡️ Garantia: '+gars.length+'</span>':'')+
      (prontos?'<span class="tag" style="background:rgba(0,200,120,.12);border-color:rgba(0,200,120,.35);color:#38d996;">✅ Pronto: '+prontos+'</span>':'')+
      (aguardPeca?'<span class="tag" style="background:rgba(255,180,0,.12);border-color:rgba(255,180,0,.35);color:#ffbf3f;">📦 Peça: '+aguardPeca+'</span>':'')+
      (atras.length?'<span class="tag atraso">⚠️ Atrasados: '+atras.length+'</span>':'')+
      '</div><div class="client-meta">'+
      (datas[0]?'<span>📅 Última entrada: '+fmtData(datas[0])+'</span>':'')+
      (getMaior(c.id)?'<span>⏱️ Mais antigo: '+getMaior(c.id)+' dias</span>':'')+
      diasInativo+
      '</div></div>';
  }).join('');
}

function setFiltroCliente(f){
  filtroCliente=f;
  ['todos','cf','vd','inativo'].forEach(function(t){
    var btn=document.getElementById('fc-'+t);if(!btn)return;
    if(t===f){btn.style.background='rgba(0,229,255,.15)';btn.style.borderColor='rgba(0,229,255,.5)';btn.style.color='var(--cyan)';}
    else{btn.style.background='var(--bg2)';btn.style.borderColor='var(--border)';btn.style.color='var(--text3)';}
  });
  renderClientes();
}
