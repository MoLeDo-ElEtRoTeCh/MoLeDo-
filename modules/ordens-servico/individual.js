function gerarOSHtml(r,c){
  // Gera o HTML da OS sem abrir janela
  var tempDiv=document.createElement('div');
  var oldOpen=window.open;
  var captured='';
  // Intercept gerarOS to capture HTML
  var d=r.diagnostico;if(!d)return '<p>Sem diagnóstico</p>';
  var num='#'+String(r.numVisual).padStart(3,'0');
  var nomeCliente=c?c.nome:'?';
  if(c&&c.tipo==='vc'&&r.nomeClienteFinal)nomeCliente=r.nomeClienteFinal+' (via '+c.nome+')';
  // Build OS HTML inline
  var h='<div style="max-width:800px;margin:0 auto;padding:20px;">';
  // Header com logo
  h+='<div style="text-align:center;border-bottom:2px solid #007ea8;padding-bottom:16px;margin-bottom:16px;">';
  h+='<img src=\"https://moledo-eletrotech.github.io/MoLeDo-/logogarantia.png\" style=\"max-width:280px;height:auto;display:block;margin:0 auto 8px;\" alt=\"MoLeDo ElEtRoTeCh\">';
  h+='<div style="font-size:11px;color:#555;">Assistência Técnica · Robôs Aspiradores</div>';
  h+='<div style="font-size:14px;font-weight:700;margin-top:8px;">ORDEM DE SERVIÇO — '+num+'</div>';
  h+='</div>';
  // Info
  h+='<table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px;">';
  h+='<tr><td style="padding:4px;width:50%;"><b>Cliente:</b> '+esc(nomeCliente)+'</td>';
  h+='<td style="padding:4px;"><b>Modelo:</b> '+esc(r.modelo||'—')+'</td></tr>';
  h+='<tr><td style="padding:4px;"><b>Data:</b> '+fmtData(d.data)+'</td>';
  h+='<td style="padding:4px;"><b>Voltagem:</b> '+(r.voltagem||'—')+'</td></tr>';
  if(d.descricao){h+='<tr><td colspan="2" style="padding:4px;"><b>Diagnóstico:</b> '+esc(d.descricao)+'</td></tr>';}
  h+='</table>';
  // Serviços
  h+='<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">';
  h+='<thead><tr style="background:#007ea8;color:white;"><th style="padding:8px;text-align:left;">Serviço</th><th style="padding:8px;text-align:right;">Valor</th></tr></thead>';
  h+='<tbody>';
  if(d.abertura>0)h+='<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;">Abertura/Diagnóstico</td><td style="padding:6px;text-align:right;">'+fmtVal(d.abertura)+'</td></tr>';
  if(d.itens&&d.itens.length)d.itens.forEach(function(it){h+='<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;">'+esc(it.nome)+'</td><td style="padding:6px;text-align:right;">'+fmtVal(it.preco)+'</td></tr>';});
  if(d.avulso>0)h+='<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;">'+(d.avulsoDesc||'Cobrança avulsa')+'</td><td style="padding:6px;text-align:right;">'+fmtVal(d.avulso)+'</td></tr>';
  if(d.frete>0)h+='<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;">Frete/Entrega</td><td style="padding:6px;text-align:right;">'+fmtVal(d.frete)+'</td></tr>';
  if(d.desconto>0){
    var _sub=(d.abertura||0)+((d.itens||[]).reduce(function(a,it){return a+(it.preco||0);},0))+(d.avulso||0)+(d.frete||0);
    h+='<tr style="border-bottom:1px solid #ddd;background:#fafafa;"><td style="padding:6px;"><b>Subtotal</b></td><td style="padding:6px;text-align:right;"><b>'+fmtVal(_sub)+'</b></td></tr>';
    h+='<tr style="border-bottom:1px solid #eee;color:#cc0000;"><td style="padding:6px;"><b>Desconto</b></td><td style="padding:6px;text-align:right;"><b>-'+fmtVal(d.desconto)+'</b></td></tr>';
  }
  h+='<tr style="background:#f0f8ff;font-weight:900;font-size:15px;"><td style="padding:8px;">TOTAL</td><td style="padding:8px;text-align:right;color:#007ea8;">'+fmtVal(d.total)+'</td></tr>';
  h+='</tbody></table>';
  // Pagamento e garantia
  h+='<div style="display:flex;gap:16px;margin-bottom:16px;font-size:12px;">';
  h+='<div style="flex:1;background:#f0f8ff;border:1px solid #007ea8;border-radius:8px;padding:10px;">';
  h+='<div style="font-weight:700;color:#007ea8;margin-bottom:4px;">💰 PAGAMENTO</div>';
  h+='<div>À vista (PIX/dinheiro): <b>'+fmtVal(d.avista||d.total)+'</b></div>';
  h+='<div>Cartão: sob consulta (até 8x)</div>';
  h+='</div>';
  h+='<div style="flex:1;background:#f0fff0;border:1px solid #007ea8;border-radius:8px;padding:10px;">';
  h+='<div style="font-weight:700;color:#007ea8;margin-bottom:4px;">🛡️ GARANTIA</div>';
  h+='<div>90 dias sobre o serviço realizado</div>';
  h+='</div></div>';
  // Rodapé
  h+='<div style="text-align:center;border-top:1px solid #ccc;padding-top:12px;font-size:11px;color:#555;">';
  h+='MoLeDo ElEtRoTeCh · R. Tietê, 3905 · (44) 9 9972-4074 · moledoeletrotech@gmail.com';
  h+='</div></div>';
  return h;
}

function gerarOS(roboId,roboOverride){
  var r=roboOverride||(DB.robos.find(function(x){return x.id===roboId;}));
  if(!r){var lx=(DB.lixeira||[]).find(function(x){return x.robo&&x.robo.id===roboId;});if(lx)r=Object.assign({},lx.robo,{_cancelado:true});}
  if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});if(!c)return;
  var hoje=new Date().toLocaleDateString('pt-BR');
  var num=r.numOS||('#'+String(r.numVisual).padStart(3,'0'));
  var cancelado=r._cancelado||r.status==='cancelado';
  var logoUrl='https://moledo-eletrotech.github.io/MoLeDo-/logogarantia.png';
  var diasTotal=r.dataEntrada?Math.floor((new Date()-new Date(r.dataEntrada+'T00:00:00'))/(1000*60*60*24)):0;
  var atrasado=diasTotal>30;
  var CITENS=[
    {id:'vassoura_central',nome:'Vassoura Central'},{id:'vassoura_lat_esq',nome:'Vassoura Lat. Esq.'},
    {id:'vassoura_lat_dir',nome:'Vassoura Lat. Dir.'},{id:'reservatorio_poco',nome:'Reservatório Poeira'},
    {id:'reservatorio_agua',nome:'Reservatório Água'},{id:'carregador_dock',nome:'Carregador/Dock'},
    {id:'cabo_carregador',nome:'Cabo Carregador'},{id:'tampa_superior',nome:'Tampa Superior'},
    {id:'mop_esq',nome:'Mop Esq.'},{id:'mop_dir',nome:'Mop Dir.'},
    {id:'mop_unico',nome:'Mop Único'},{id:'controle_remoto',nome:'Controle Remoto'}
  ];
  var itens=r.bancada&&r.bancada.itens?r.bancada.itens:{};
  // Checklist em 2 colunas
  var metade=Math.ceil(CITENS.length/2);
  function checkCol(lista){
    return lista.map(function(item,i){
      var e=itens[item.id]||'';
      var bg=i%2===0?'#f9f9f9':'#fff';
      return'<tr style="background:'+bg+'"><td style="padding:2px 4px;font-size:9px;">'+item.nome+'</td>'+
        '<td style="text-align:center;font-size:9px;width:20px;">'+(e==='veio'?'✅':'')+'</td>'+
        '<td style="text-align:center;font-size:9px;width:30px;">'+(e==='nao'?'❌':'')+'</td>'+
        '<td style="text-align:center;font-size:9px;width:30px;">'+(e===''?'—':'')+'</td></tr>';
    }).join('');
  }
  var col1=CITENS.slice(0,metade);
  var col2=CITENS.slice(metade);
  var checkHtml='<table style="width:49%;display:inline-table;border-collapse:collapse;vertical-align:top;">'+
    '<thead><tr style="background:#007ea8;color:#fff;font-size:8px;"><th style="padding:2px 4px;text-align:left;">Item</th><th style="width:20px;">✓</th><th style="width:30px;">✗</th><th style="width:30px;">N/T</th></tr></thead>'+
    '<tbody>'+checkCol(col1)+'</tbody></table>'+
    '<table style="width:49%;display:inline-table;border-collapse:collapse;vertical-align:top;margin-left:2%;">'+
    '<thead><tr style="background:#007ea8;color:#fff;font-size:8px;"><th style="padding:2px 4px;text-align:left;">Item</th><th style="width:20px;">✓</th><th style="width:30px;">✗</th><th style="width:30px;">N/T</th></tr></thead>'+
    '<tbody>'+checkCol(col2)+'</tbody></table>';
  // Diagnóstico
  var diagHtml='<div style="color:#999;font-size:10px;font-style:italic;">Não realizado</div>';
  if(r.diagnostico){
    var d=r.diagnostico;
    diagHtml='';
    // Descrição/complemento técnico
    if(d.descricao)diagHtml+='<div style="font-size:9px;margin-bottom:6px;padding:4px 6px;background:#f5f5f5;border-left:3px solid #007ea8;border-radius:0 4px 4px 0;">'+esc(d.descricao)+'</div>';
    // Itens com detalhes técnicos (diag, acao, obs)
    if(d.itens&&d.itens.length){
      d.itens.forEach(function(it){
        // Buscar dados técnicos no catálogo
        var cat=DB.catalogo&&DB.catalogo.find(function(x){return x.id===it.catalogoId;});
        diagHtml+='<div style="margin-bottom:6px;padding:5px 6px;border:1px solid #e0e0e0;border-radius:4px;">';
        diagHtml+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">';
        diagHtml+='<span style="font-size:9.5px;font-weight:900;color:#007ea8;">'+esc(it.nome||'—')+'</span>';
        diagHtml+='<span style="font-size:10px;font-weight:900;color:#007ea8;">'+fmtVal(it.preco||0)+'</span>';
        diagHtml+='</div>';
        if(cat){
          if(cat.diag)diagHtml+='<div style="font-size:8.5px;color:#333;margin-bottom:2px;"><b>Diagnóstico:</b> '+esc(cat.diag)+'</div>';
          if(cat.acao)diagHtml+='<div style="font-size:8.5px;color:#333;margin-bottom:2px;"><b>Ação:</b> '+esc(cat.acao)+'</div>';
          if(cat.obs)diagHtml+='<div style="font-size:8px;color:#666;font-style:italic;">'+esc(cat.obs)+'</div>';
        }
        diagHtml+='</div>';
      });
    }
    // Tabela de valores
    diagHtml+='<table style="width:100%;border-collapse:collapse;font-size:9px;margin-top:4px;">';
    if(d.abertura>0)diagHtml+='<tr><td style="padding:2px 5px;">Abertura/Diagnóstico</td><td style="padding:2px 5px;text-align:right;">'+fmtVal(d.abertura)+'</td></tr>';
    if(d.itens&&d.itens.length)d.itens.forEach(function(it){diagHtml+='<tr><td style="padding:2px 5px;">'+esc(it.nome||'—')+'</td><td style="padding:2px 5px;text-align:right;">'+fmtVal(it.preco||0)+'</td></tr>';});
    if(d.avulso>0)diagHtml+='<tr><td style="padding:2px 5px;">'+esc(d.avulsoDesc||'Cobrança avulsa')+'</td><td style="padding:2px 5px;text-align:right;">'+fmtVal(d.avulso)+'</td></tr>';
    if(d.frete>0)diagHtml+='<tr><td style="padding:2px 5px;">Frete/Entrega</td><td style="padding:2px 5px;text-align:right;">'+fmtVal(d.frete)+'</td></tr>';
    if(d.desconto>0)diagHtml+='<tr style="color:#c00;"><td style="padding:2px 5px;">Desconto</td><td style="padding:2px 5px;text-align:right;">-'+fmtVal(d.desconto)+'</td></tr>';
    diagHtml+='</table>';
    var valExib=cancelado?(d.abertura||200):(d.total||0);
    diagHtml+='<div style="text-align:right;font-weight:900;font-size:12px;color:'+(cancelado?'#c00':'#007ea8')+';margin-top:4px;padding-top:4px;border-top:2px solid '+(cancelado?'#c00':'#007ea8')+';">'+
      (cancelado?'Diagnóstico: ':'TOTAL: ')+fmtVal(valExib)+'</div>';
    if(d.avista&&!cancelado)diagHtml+='<div style="text-align:right;font-size:9px;color:#555;margin-top:2px;">💰 À vista (PIX/dinheiro): '+fmtVal(d.avista)+'</div>';
    if(cancelado)diagHtml+='<div style="text-align:right;font-size:8px;color:#c00;">⚠️ Cancelado — cobra apenas o diagnóstico</div>';
  }
  // PIX — mostra para todos (cancelado usa valor da abertura)
  var pixHtml='';
  var valPix=cancelado?(r.diagnostico?r.diagnostico.abertura||200:0):(r.diagnostico?r.diagnostico.total||0:0);
  if(valPix>0){
    var pixPayload=gerarPixPayload('moledoeletrotech@gmail.com',0,'MoLeDo ElEtRoTeCh','Umuarama');
    pixHtml='<div style="display:flex;align-items:center;gap:10px;border:1.5px dashed #007ea8;border-radius:6px;padding:8px;margin-top:8px;">'+
      '<img src="https://moledo-eletrotech.github.io/MoLeDo-/pixqr.jpg" width="70" height="70" style="border:1px solid #ddd;border-radius:3px;flex-shrink:0;">'+
      '<div><div style="font-size:10px;font-weight:900;color:#007ea8;">💠 PAGAMENTO VIA PIX</div>'+
      '<div style="font-size:9px;margin:2px 0;"><b>Chave:</b> moledoeletrotech@gmail.com</div>'+
      '<div style="font-size:9px;margin-bottom:2px;"><b>Beneficiário:</b> MoLeDo ElEtRoTeCh</div>'+
      '<div style="font-size:12px;font-weight:900;color:#007ea8;">'+fmtVal(valPix)+'</div></div></div>';
  }
  var cancelStamp=cancelado?'<div style="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:48px;font-weight:900;color:rgba(200,0,0,.12);letter-spacing:4px;pointer-events:none;white-space:nowrap;border:4px solid rgba(200,0,0,.1);padding:8px 16px;border-radius:6px;">CANCELADO</div>':'';
  var css='*{margin:0;padding:0;box-sizing:border-box;}'
    +'body{font-family:Arial,sans-serif;padding:10px;color:#111;font-size:10px;}'
    +'.hdr{text-align:center;border-bottom:2.5px solid #007ea8;padding-bottom:8px;margin-bottom:8px;}'
    +'.hdr-logo{width:100%;max-width:280px;height:auto;display:block;margin:0 auto 4px;}'
    +'.hdr-info{font-size:8px;color:#555;}'
    +'.title{text-align:center;font-size:13px;font-weight:900;color:#007ea8;margin:6px 0 2px;}'
    +'.sub{text-align:center;font-size:8px;color:#888;margin-bottom:6px;}'
    +'.sec{border:1px solid #ddd;border-radius:3px;margin-bottom:6px;overflow:hidden;position:relative;}'
    +'.sec-t{background:#007ea8;color:#fff;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 6px;}'
    +'.sec-b{padding:5px 6px;}'
    +'.grid2{display:grid;grid-template-columns:1fr 1fr;gap:4px;}'
    +'.row{display:flex;gap:4px;font-size:9px;padding:1px 0;}'
    +'.lbl{font-weight:700;color:#555;min-width:70px;font-size:8.5px;}'
    +'.val{flex:1;font-size:9px;}'
    +'.ass{margin-top:10px;display:flex;gap:30px;}'
    +'.ass-box{flex:1;border-top:1.5px solid #999;padding-top:4px;text-align:center;font-size:8px;color:#666;}'
    +'.ftr{margin-top:8px;text-align:center;font-size:7.5px;color:#aaa;border-top:1px solid #eee;padding-top:4px;}'
    +'@media print{button{display:none!important;}@page{size:A4;margin:6mm;}body{padding:5px;}}';
  var html='<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>OS '+num+'</title>'
    +'<style>'+css+'</style></head><body>'
    +(cancelado?'<div style="position:fixed;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:64px;font-weight:900;color:rgba(200,0,0,.07);letter-spacing:4px;pointer-events:none;white-space:nowrap;z-index:0;">CANCELADA</div>':'')
    // HEADER
    +'<div class="hdr"><img src="'+logoUrl+'" class="hdr-logo"><div class="hdr-info">R. Tietê, 3905 - Jd. América, Umuarama - PR, 87502-310 · 📞 (44) 9 9972-4074 · 📧 moledoeletrotech@gmail.com</div></div>'
    +'<div class="title">ORDEM DE SERVIÇO — '+num+(cancelado?' ❌ CANCELADA':'')+'</div>'
    +'<div class="sub">Assistência Técnica · Robôs Aspiradores</div>'
    +(atrasado?'<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:3px;padding:5px 8px;margin-bottom:6px;font-size:8.5px;color:#856404;">⚠️ Pedimos desculpas pelo prazo. Equipamento há '+diasTotal+' dias em nossa assistência. Obrigado pela paciência!</div>':'')
    // OS + CLIENTE lado a lado
    +'<div class="grid2" style="margin-bottom:6px;">'
    +'<div class="sec"><div class="sec-t">Dados da OS</div><div class="sec-b">'
    +'<div class="row"><span class="lbl">Número:</span><span class="val"><b>'+num+'</b></span></div>'
    +'<div class="row"><span class="lbl">Entrada:</span><span class="val">'+fmtData(r.dataEntrada)+'</span></div>'
    +'<div class="row"><span class="lbl">Data OS:</span><span class="val">'+hoje+'</span></div>'
    +'<div class="row"><span class="lbl">Pagamento:</span><span class="val" style="font-weight:900;color:'+((r.pago===true||r.servicoProntoPago===true)?'#008f4c':'#c00020')+';">'+((r.pago===true||r.servicoProntoPago===true)?'PAGO':'NÃO PAGO')+'</span></div>'
    +'<div class="row"><span class="lbl">Entrega:</span><span class="val" style="font-weight:900;color:'+((r.entregue===true||!!r.dataEntrega)?'#007ea8':'#c75b00')+';">'+((r.entregue===true||!!r.dataEntrega)?'ENTREGUE'+(r.dataEntrega?' · '+fmtData(r.dataEntrega):''):'NÃO ENTREGUE')+'</span></div>'
    +'</div></div>'
    +'<div class="sec"><div class="sec-t">Dados do Cliente</div><div class="sec-b">'
    +'<div class="row"><span class="lbl">Nome:</span><span class="val"><b>'+esc(c.nome)+'</b></span></div>'
    +'<div class="row"><span class="lbl">WhatsApp:</span><span class="val">'+esc(c.whatsapp)+'</span></div>'
    +'</div></div></div>'
    // EQUIPAMENTO em grid 3 colunas
    +'<div class="sec"><div class="sec-t">Dados do Equipamento</div><div class="sec-b">'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;">'
    +'<div class="row"><span class="lbl">Modelo:</span><span class="val">'+esc(r.modelo||'—')+'</span></div>'
    +'<div class="row"><span class="lbl">Entrada:</span><span class="val">'+esc(({robo:'Somente robô',robo_base:'Robô + base',robo_estacao:'Robô + estação',placa_robo:'Somente placa do robô',placa_estacao:'Somente placa da estação'})[r.tipoEquipamento||'robo']||'Somente robô')+'</span></div>'
    +'<div class="row"><span class="lbl">Código/SN:</span><span class="val">'+esc(r.sn||'Sem código')+'</span></div>'
    +'<div class="row"><span class="lbl">Voltagem:</span><span class="val">'+esc(r.voltagem||'—')+'</span></div>'
    +(r.bancada?'<div class="row"><span class="lbl">Outra assist.:</span><span class="val">'+(r.bancada.outraAssistencia==='sim'?'Sim':'Não')+'</span></div>':'')
    +(r.bancada&&r.bancada.selo?'<div class="row"><span class="lbl">Selo:</span><span class="val">'+esc(r.bancada.selo)+'</span></div>':'')
    +'</div></div></div>'
    // CHECKLIST 2 colunas
    +'<div class="sec"><div class="sec-t">Checklist de Itens Recebidos</div><div class="sec-b" style="padding:4px;">'+checkHtml+'</div></div>'
    // DEFEITOS
    +'<div class="sec"><div class="sec-t">Defeitos Relatados</div><div class="sec-b"><div style="font-size:9px;background:#f9f9f9;padding:4px;">'+esc(r.defeitos&&r.defeitos.length?r.defeitos.join(', '):'Não informado')+'</div></div></div>'
    // DIAGNÓSTICO
    +'<div class="sec" style="position:relative;">'+cancelStamp+'<div class="sec-t" style="background:'+(cancelado?'#c00':'#007ea8')+'">'+(cancelado?'❌ ':'')+'Diagnóstico / Serviço Realizado</div><div class="sec-b">'+diagHtml+'</div></div>'
    +(r.obs?'<div class="sec"><div class="sec-t">Observações</div><div class="sec-b"><div style="font-size:9px;">'+esc(r.obs)+'</div></div></div>':'')
    // PIX
    +pixHtml
    // ASSINATURAS
    +'<div class="ass">'
    +'<div class="ass-box">Luiz Guilherme Moledo da Silva<br><small>Técnico Responsável · MoLeDo ElEtRoTeCh</small></div>'
    +'<div class="ass-box">Assinatura do Cliente<br><small>'+esc(c.nome)+'</small></div>'
    +'</div>'
    +'<div class="ftr">MoLeDo ElEtRoTeCh · Assistência Técnica em Robôs Aspiradores · R. Tietê, 3905 - Jd. América, Umuarama - PR · (44) 9 9972-4074 · moledoeletrotech@gmail.com<br>Reparo é nossa linguagem · Tecnologia é nossa paixão</div>'
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
