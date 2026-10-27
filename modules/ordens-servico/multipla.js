function gerarOSSelecionados(cId){
  var c=DB.clientes.find(function(x){return x.id===cId;});if(!c)return;
  var robos=DB.robos.filter(function(r){return r.clienteId===cId;});
  var lixeira=(DB.lixeira||[]).filter(function(x){return x.robo&&x.robo.clienteId===cId;});
  var todos=robos.concat(lixeira.map(function(x){return Object.assign({},x.robo,{_lixId:x.id,_cancelado:true});}));
  var selecionados=todos.filter(function(r){
    var chk=document.getElementById('os-chk-'+r.id);
    return chk&&chk.checked;
  });
  if(!selecionados.length){showToast('Selecione pelo menos um robô.');return;}
  closeModal();
  // Gera OS de todos numa aba só
  var osHtmls=selecionados.map(function(r){return gerarOSHtml(r,c);});
  var totalGeral=selecionados.reduce(function(a,r){return a+(r.diagnostico&&r.diagnostico.total||0);},0);
  // Resumo final com logo e PIX
  var totalDescontos=selecionados.reduce(function(a,r){return a+(r.diagnostico&&r.diagnostico.desconto||0);},0);
  var resumoLinhas=selecionados.map(function(r){
    var num2='#'+String(r.numVisual).padStart(3,'0');
    var nc=c.nome;if(c.tipo==='vc'&&r.nomeClienteFinal)nc=r.nomeClienteFinal;
    return '<tr><td style="padding:6px;">OS '+num2+' — '+esc(r.modelo||'—')+'</td><td style="padding:6px;">'+esc(nc)+'</td><td style="padding:6px;text-align:right;font-weight:700;">'+fmtVal(r.diagnostico&&r.diagnostico.total||0)+'</td></tr>';
  }).join('');
  var totalHtml='<div style="page-break-before:always;max-width:800px;margin:0 auto;padding:40px 20px;">';
  totalHtml+='<div style="text-align:center;margin-bottom:16px;"><img src=\"https://moledo-eletrotech.github.io/MoLeDo-/logogarantia.png\" style=\"max-width:280px;height:auto;display:block;margin:0 auto 8px;\" alt=\"MoLeDo ElEtRoTeCh\"></div>';
  totalHtml+='<div style="font-size:15px;font-weight:900;color:#007ea8;border-bottom:2px solid #007ea8;padding-bottom:8px;margin-bottom:12px;">📋 RESUMO GERAL</div>';
  totalHtml+='<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">';
  totalHtml+='<thead><tr style="background:#007ea8;color:white;"><th style="padding:8px;text-align:left;">OS</th><th style="padding:8px;text-align:left;">Cliente</th><th style="padding:8px;text-align:right;">Total</th></tr></thead><tbody>'+resumoLinhas;
  if(totalDescontos>0)totalHtml+='<tr style="color:#cc0000;"><td colspan="2" style="padding:6px;"><b>Total de descontos</b></td><td style="padding:6px;text-align:right;"><b>-'+fmtVal(totalDescontos)+'</b></td></tr>';
  totalHtml+='<tr style="background:#007ea8;color:white;font-size:15px;font-weight:900;"><td colspan="2" style="padding:10px;">TOTAL GERAL</td><td style="padding:10px;text-align:right;">'+fmtVal(totalGeral)+'</td></tr></tbody></table>';
  totalHtml+='<div style="background:#e8f4fd;border:2px solid #007ea8;border-radius:10px;padding:16px;text-align:center;margin-top:16px;">';
  totalHtml+='<div style="font-size:14px;font-weight:900;color:#007ea8;margin-bottom:10px;">💠 PAGAMENTO VIA PIX</div>';
  totalHtml+='<div style="display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;">';
  totalHtml+='<img src="https://moledo-eletrotech.github.io/MoLeDo-/pixqr.jpg" style="width:120px;height:120px;border:2px solid #007ea8;border-radius:8px;" alt="QR Code PIX">';
  totalHtml+='<div style="text-align:left;">';
  totalHtml+='<div style="font-size:13px;color:#555;margin-bottom:4px;">Chave PIX:</div>';
  totalHtml+='<div style="font-size:15px;font-weight:700;color:#007ea8;margin-bottom:8px;">moledoeletrotech@gmail.com</div>';
  totalHtml+='<div style="font-size:11px;color:#666;">Escaneie o QR Code ou copie a chave</div>';
  totalHtml+='<div style="font-size:11px;color:#666;">Após pagar, envie o comprovante pelo WhatsApp</div>';
  totalHtml+='</div></div></div>';
  totalHtml+='<div style="text-align:center;margin-top:16px;font-size:11px;color:#888;">MoLeDo ElEtRoTeCh · R. Tietê, 3905 · (44) 9 9972-4074 · moledoeletrotech@gmail.com</div>';
  totalHtml+='</div>';
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>OS — '+esc(c.nome)+'</title>'+
    '<style>body{font-family:Arial,sans-serif;margin:0;}@media print{.os-separator{page-break-after:always;}button{display:none!important;}}</style>'+
    '</head><body>'+
    osHtmls.map(function(h,i){return h+(i<osHtmls.length-1?'<div class="os-separator" style="border-top:2px dashed #ccc;margin:30px 0;"></div>':'');}).join('')+
    totalHtml+
    '<div class="no-img" style="text-align:center;margin-top:30px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">'+
    '<button onclick="window.print()" style="padding:12px 30px;background:#007ea8;color:white;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">🖨️ Imprimir / PDF</button>'+
    '<button onclick="salvarImgOS()" style="padding:12px 30px;background:#00a86b;color:white;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">📷 Salvar Imagem</button>'+
    '</div>'+'<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>'+'<script>function salvarImgOS(){var nome=(document.title||"OS").replace(/[^A-Za-z0-9]+/g,"_");var bs=document.querySelectorAll(".no-img");var i;for(i=0;i<bs.length;i++)bs[i].style.display="none";function volta(){for(var j=0;j<bs.length;j++)bs[j].style.display="";}if(typeof html2canvas!=="function"){alert("Aguarde a pagina carregar e tente de novo.");volta();return;}html2canvas(document.body,{backgroundColor:"#ffffff",scale:2,useCORS:true}).then(function(cv){cv.toBlob(function(b){var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=nome+".png";document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(a.href);},8000);volta();});}).catch(function(e){alert("Erro ao gerar imagem: "+e);volta();});}<\/script>'+
    '</body></html>';
  var blob=new Blob([html],{type:'text/html;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var w=window.open(url,'_blank');
  if(!w){window.location.href=url;return;}
  setTimeout(function(){URL.revokeObjectURL(url);},20000);
}

function gerarOSMultipla(robos){
  var c=DB.clientes.find(function(x){return x.id===robos[0].clienteId;});if(!c)return;
  var hoje=new Date().toLocaleDateString('pt-BR');
  var logoUrl='https://moledo-eletrotech.github.io/MoLeDo-/logogarantia.png';
  var totalGeral=robos.reduce(function(a,r){return a+getValorCobravel(r);},0);
  var diasMax=Math.max.apply(null,robos.map(function(r){return r.dataEntrada?Math.floor((new Date()-new Date(r.dataEntrada+'T00:00:00'))/(1000*60*60*24)):0;}));
  var atrasado=diasMax>30;
  var CITENS=[
    {id:'vassoura_central',nome:'Vassoura Central'},{id:'vassoura_lat_esq',nome:'Vassoura Lat. Esq.'},
    {id:'vassoura_lat_dir',nome:'Vassoura Lat. Dir.'},{id:'reservatorio_poco',nome:'Reservatório Poeira'},
    {id:'reservatorio_agua',nome:'Reservatório Água'},{id:'carregador_dock',nome:'Carregador/Dock'},
    {id:'cabo_carregador',nome:'Cabo Carregador'},{id:'tampa_superior',nome:'Tampa Superior'},
    {id:'mop_esq',nome:'Mop Esq.'},{id:'mop_dir',nome:'Mop Dir.'},
    {id:'mop_unico',nome:'Mop Único'},{id:'controle_remoto',nome:'Controle Remoto'}
  ];
  function checkCol(lista,itens){
    return lista.map(function(item,i){
      var e=itens[item.id]||'';
      var bg=i%2===0?'#f9f9f9':'#fff';
      return'<tr style="background:'+bg+'"><td style="padding:2px 4px;font-size:9px;">'+item.nome+'</td>'+
        '<td style="text-align:center;font-size:9px;width:20px;">'+(e==='veio'?'✅':'')+'</td>'+
        '<td style="text-align:center;font-size:9px;width:28px;">'+(e==='nao'?'❌':'')+'</td>'+
        '<td style="text-align:center;font-size:9px;width:28px;">'+(e===''?'—':'')+'</td></tr>';
    }).join('');
  }
  var metade=Math.ceil(CITENS.length/2);
  var col1=CITENS.slice(0,metade);
  var col2=CITENS.slice(metade);
  // Gera seção de cada robô
  var robosHtml=robos.map(function(r){
    var num=r.numOS||('#'+String(r.numVisual).padStart(3,'0'));
    var cancelado=!!r._cancelado;
    var itens=r.bancada&&r.bancada.itens?r.bancada.itens:{};
    var checkHtml='<table style="width:49%;display:inline-table;border-collapse:collapse;vertical-align:top;">'+
      '<thead><tr style="background:#007ea8;color:#fff;font-size:8px;"><th style="padding:2px 4px;text-align:left;">Item</th><th style="width:20px;">✓</th><th style="width:28px;">✗</th><th style="width:28px;">N/T</th></tr></thead>'+
      '<tbody>'+checkCol(col1,itens)+'</tbody></table>'+
      '<table style="width:49%;display:inline-table;border-collapse:collapse;vertical-align:top;margin-left:2%;">'+
      '<thead><tr style="background:#007ea8;color:#fff;font-size:8px;"><th style="padding:2px 4px;text-align:left;">Item</th><th style="width:20px;">✓</th><th style="width:28px;">✗</th><th style="width:28px;">N/T</th></tr></thead>'+
      '<tbody>'+checkCol(col2,itens)+'</tbody></table>';
    var diagHtml='<div style="color:#999;font-size:9px;">Não realizado</div>';
    if(r.diagnostico){
      diagHtml='';
      if(r.diagnostico.descricao)diagHtml+='<div style="font-size:9px;margin-bottom:3px;">'+esc(r.diagnostico.descricao)+'</div>';
      var _dm=r.diagnostico;
      var _linhas='';
      if(_dm.abertura>0)_linhas+='<tr style="border-bottom:1px solid #eee;"><td style="padding:2px 5px;">Abertura/Diagnóstico</td><td style="padding:2px 5px;text-align:right;">'+fmtVal(_dm.abertura)+'</td></tr>';
      if(_dm.itens&&_dm.itens.length)_linhas+=_dm.itens.map(function(it){return'<tr style="border-bottom:1px solid #eee;"><td style="padding:2px 5px;">'+esc(it.nome||'—')+'</td><td style="padding:2px 5px;text-align:right;">'+fmtVal(it.preco||0)+'</td></tr>';}).join('');
      if(_dm.avulso>0)_linhas+='<tr style="border-bottom:1px solid #eee;"><td style="padding:2px 5px;">'+esc(_dm.avulsoDesc||'Cobrança avulsa')+'</td><td style="padding:2px 5px;text-align:right;">'+fmtVal(_dm.avulso)+'</td></tr>';
      if(_dm.frete>0)_linhas+='<tr style="border-bottom:1px solid #eee;"><td style="padding:2px 5px;">Frete/Entrega</td><td style="padding:2px 5px;text-align:right;">'+fmtVal(_dm.frete)+'</td></tr>';
      if(_dm.desconto>0)_linhas+='<tr style="border-bottom:1px solid #eee;color:#c00;"><td style="padding:2px 5px;font-weight:700;">Desconto</td><td style="padding:2px 5px;text-align:right;font-weight:700;">-'+fmtVal(_dm.desconto)+'</td></tr>';
      if(_linhas){
        diagHtml+='<table style="width:100%;border-collapse:collapse;font-size:9px;margin-bottom:3px;"><thead><tr style="background:#eee;"><th style="padding:2px 5px;text-align:left;">Serviço/Peça</th><th style="text-align:right;width:60px;">Valor</th></tr></thead><tbody>'+_linhas+'</tbody></table>';
      }
      var val=cancelado?(r.diagnostico.abertura||200):(r.diagnostico.total||0);
      diagHtml+='<div style="text-align:right;font-weight:900;font-size:11px;color:'+(cancelado?'#c00':'#007ea8')+';margin-top:2px;">'+(cancelado?'Diagnóstico: ':'Total: ')+fmtVal(val)+'</div>';
    }
    // Marca d'água CANCELADO só na seção
    var stamp=cancelado?'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:36px;font-weight:900;color:rgba(200,0,0,.13);letter-spacing:3px;pointer-events:none;white-space:nowrap;border:3px solid rgba(200,0,0,.1);padding:6px 14px;border-radius:5px;">CANCELADO</div>':'';
    var corHeader=cancelado?'#c00':'#007ea8';
    return'<div style="border:1.5px solid '+(cancelado?'#c00':'#007ea8')+';border-radius:5px;margin-bottom:10px;overflow:hidden;position:relative;">'
      +stamp
      +'<div style="background:'+corHeader+';color:#fff;padding:5px 8px;font-size:11px;font-weight:700;">'+
        (cancelado?'❌ CANCELADO — ':'')+num+' · '+esc(r.modelo||'—')+(r.voltagem&&r.voltagem!=='—'?' · ⚡'+r.voltagem:'')+'</div>'
      +'<div style="padding:6px 8px;">'
        +'<div style="display:flex;gap:8px;font-size:9px;margin-bottom:5px;">'
          +'<span><b>Entrada:</b> '+fmtData(r.dataEntrada)+'</span>'
          +'<span><b>SN:</b> '+esc(r.sn||'Sem código')+'</span>'
          +(r.bancada?'<span><b>Outra assist.:</b> '+(r.bancada.outraAssistencia==='sim'?'Sim':'Não')+'</span>':'')
          +(r.bancada&&r.bancada.selo?'<span><b>Selo:</b> '+esc(r.bancada.selo)+'</span>':'')
        +'</div>'
        +'<div style="font-size:8.5px;font-weight:700;color:#007ea8;margin-bottom:3px;border-bottom:1px solid #eee;padding-bottom:2px;">Itens Recebidos</div>'
        +checkHtml
        +'<div style="font-size:8.5px;font-weight:700;color:#007ea8;margin:5px 0 2px;">Defeitos</div>'
        +'<div style="font-size:9px;background:#f9f9f9;border:1px solid #eee;padding:3px 5px;">'+esc(r.defeitos&&r.defeitos.length?r.defeitos.join(', '):'Não informado')+'</div>'
        +'<div style="font-size:8.5px;font-weight:700;color:'+(cancelado?'#c00':'#007ea8')+';margin:5px 0 2px;">'+(cancelado?'❌ ':'')+'Diagnóstico</div>'
        +diagHtml
      +'</div>'
    +'</div>';
  }).join('');
  // Resumo valores
  var normais=robos.filter(function(r){return !r._cancelado;});
  var canc=robos.filter(function(r){return r._cancelado;});
  var totalNormal=normais.reduce(function(a,r){return a+(r.diagnostico?r.diagnostico.total||0:0);},0);
  var totalCanc=canc.reduce(function(a,r){return a+(r.diagnostico?r.diagnostico.abertura||200:0);},0);
  var totalDescM=normais.reduce(function(a,r){return a+(r.diagnostico&&r.diagnostico.desconto||0);},0);
  var resumoRows=normais.map(function(r){
    var num='#'+String(r.numVisual).padStart(3,'0');
    return'<div style="display:flex;justify-content:space-between;font-size:10px;padding:3px 0;border-bottom:1px solid #eee;">'+
      '<span>✅ '+num+' · '+esc(r.modelo||'—')+' — Serviço concluído</span>'+
      '<span style="font-weight:700;color:#007ea8;">'+fmtVal(r.diagnostico?r.diagnostico.total||0:0)+'</span></div>';
  }).join('')+canc.map(function(r){
    var num='#'+String(r.numVisual).padStart(3,'0');
    var ab=r.diagnostico?r.diagnostico.abertura||200:200;
    var tipo=ab<=80?'diagnóstico visual':'diagnóstico com abertura';
    return'<div style="display:flex;justify-content:space-between;font-size:10px;padding:3px 0;border-bottom:1px solid #eee;">'+
      '<span style="color:#c00;">❌ '+num+' · '+esc(r.modelo||'—')+' — Cancelado ('+tipo+')</span>'+
      '<span style="font-weight:700;color:#c00;">'+fmtVal(ab)+'</span></div>';
  }).join('')+(totalDescM>0?'<div style="display:flex;justify-content:space-between;font-size:10px;padding:3px 0;border-bottom:1px solid #eee;color:#c00;font-weight:700;"><span>Total de descontos aplicados</span><span>-'+fmtVal(totalDescM)+'</span></div>':'');
  // PIX
  var pixPayload=gerarPixPayload('moledoeletrotech@gmail.com',0,'MoLeDo ElEtRoTeCh','Umuarama');
  var pixHtml=totalGeral>0?'<div style="display:flex;align-items:center;gap:10px;border:1.5px dashed #007ea8;border-radius:5px;padding:8px;margin-top:8px;">'+
    '<img src="https://moledo-eletrotech.github.io/MoLeDo-/pixqr.jpg" width="70" height="70" style="border:1px solid #ddd;border-radius:3px;flex-shrink:0;">'+
    '<div><div style="font-size:10px;font-weight:900;color:#007ea8;">💠 PAGAMENTO VIA PIX</div>'+
    '<div style="font-size:9px;margin:2px 0;"><b>Chave:</b> moledoeletrotech@gmail.com</div>'+
    '<div style="font-size:9px;margin-bottom:2px;"><b>Beneficiário:</b> MoLeDo ElEtRoTeCh</div>'+
    '<div style="font-size:12px;font-weight:900;color:#007ea8;">'+fmtVal(totalGeral)+'</div></div></div>':'';
  var css='*{margin:0;padding:0;box-sizing:border-box;}'
    +'body{font-family:Arial,sans-serif;padding:10px;color:#111;font-size:10px;min-height:285mm;}'
    +'.hdr{text-align:center;border-bottom:2.5px solid #007ea8;padding-bottom:8px;margin-bottom:8px;}'
    +'.hdr-logo{width:100%;max-width:260px;height:auto;display:block;margin:0 auto 4px;}'
    +'.hdr-info{font-size:8px;color:#555;}'
    +'@media print{button{display:none!important;}@page{size:A4;margin:6mm;}body{padding:5px;}}';
  var html='<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>OS — '+esc(c.nome)+'</title>'
    +'<style>'+css+'</style></head><body>'
    +'<div class="hdr"><img src="'+logoUrl+'" class="hdr-logo"><div class="hdr-info">R. Tietê, 3905 - Jd. América, Umuarama - PR, 87502-310 · 📞 (44) 9 9972-4074 · 📧 moledoeletrotech@gmail.com</div></div>'
    +'<div style="text-align:center;font-size:13px;font-weight:900;color:#007ea8;margin:4px 0 1px;">ORDEM DE SERVIÇO — '+esc(c.nome.toUpperCase())+'</div>'
    +'<div style="text-align:center;font-size:8px;color:#888;margin-bottom:6px;">📞 '+esc(c.whatsapp)+' · '+robos.length+' robô(s) · '+hoje+'</div>'
    +(atrasado?'<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:3px;padding:4px 8px;margin-bottom:6px;font-size:8.5px;color:#856404;">⚠️ Pedimos desculpas pelo prazo. Agradecemos sua paciência!</div>':'')
    +robosHtml
    +'<div style="border:1.5px solid #007ea8;border-radius:5px;margin-bottom:8px;overflow:hidden;">'
    +'<div style="background:#007ea8;color:#fff;padding:5px 8px;font-size:10px;font-weight:700;">RESUMO DE VALORES</div>'
    +'<div style="padding:8px;">'+resumoRows
    +'<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;padding:6px 0 2px;border-top:2px solid #007ea8;margin-top:4px;">'
    +'<span>TOTAL GERAL ('+robos.length+' robô(s))</span><span style="color:#007ea8;">'+fmtVal(totalGeral)+'</span></div>'
    +(canc.length?'<div style="font-size:8px;color:#888;margin-top:3px;background:#f9f9f9;padding:3px;border-radius:3px;">'+
      '* Cancelados cobrados apenas pelo diagnóstico: '+canc.map(function(r){var num='#'+String(r.numVisual).padStart(3,'0');var ab=r.diagnostico?r.diagnostico.abertura||200:200;return num+' — '+fmtVal(ab);}).join(', ')+'. Serviço completo cancelado a pedido do cliente.</div>':'')
    +'</div></div>'
    +pixHtml
    +'<div style="margin-top:10px;display:flex;gap:30px;">'
    +'<div style="flex:1;border-top:1.5px solid #999;padding-top:4px;text-align:center;font-size:8px;color:#666;">Luiz Guilherme Moledo da Silva<br><small>Técnico Responsável · MoLeDo ElEtRoTeCh</small></div>'
    +'<div style="flex:1;border-top:1.5px solid #999;padding-top:4px;text-align:center;font-size:8px;color:#666;">Assinatura do Cliente<br><small>'+esc(c.nome)+'</small></div>'
    +'</div>'
    +'<div style="margin-top:6px;text-align:center;font-size:7.5px;color:#aaa;border-top:1px solid #eee;padding-top:4px;">MoLeDo ElEtRoTeCh · Reparo é nossa linguagem · Tecnologia é nossa paixão</div>'
    +'<div class="no-img" style="text-align:center;margin-top:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">'
    +'<button onclick="window.print()" style="padding:8px 18px;background:#007ea8;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-weight:700;">🖨️ Imprimir / PDF</button>'
    +'<button onclick="salvarImgOS()" style="padding:8px 18px;background:#00a86b;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-weight:700;">📷 Salvar Imagem</button>'
    +'</div>'
    +'<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>'+'<script>function salvarImgOS(){var nome=(document.title||"OS").replace(/[^A-Za-z0-9]+/g,"_");var bs=document.querySelectorAll(".no-img");var i;for(i=0;i<bs.length;i++)bs[i].style.display="none";function volta(){for(var j=0;j<bs.length;j++)bs[j].style.display="";}if(typeof html2canvas!=="function"){alert("Aguarde a pagina carregar e tente de novo.");volta();return;}html2canvas(document.body,{backgroundColor:"#ffffff",scale:2,useCORS:true}).then(function(cv){cv.toBlob(function(b){var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=nome+".png";document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(a.href);},8000);volta();});}).catch(function(e){alert("Erro ao gerar imagem: "+e);volta();});}<\/script>'
    +'</body></html>';
  var blob=new Blob([html],{type:'text/html;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  window.open(url,'_blank');
  setTimeout(function(){URL.revokeObjectURL(url);},15000);
}
