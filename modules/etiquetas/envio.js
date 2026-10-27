function renderEtiquetaEnvioUI(){
  var qtd=window._etqEnvioQtd||1;
  var infoTxt=qtd===1?
    '<div style="font-size:11px;color:var(--text3);margin-top:8px;">📄 Folha na <b>horizontal</b> (29,7 × 21cm) — etiqueta ocupa a folha inteira. Vire a folha na hora de colar.</div>':
    '<div style="font-size:11px;color:var(--text3);margin-top:8px;">📄 Folha na <b>vertical</b> (21 × 29,7cm) — cada etiqueta ocupa metade da folha (~21 × 14cm).</div>';
  return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;">'+
    '<div style="font-size:13px;font-weight:700;color:#c77dff;margin-bottom:12px;">🔢 Quantidade por folha</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:4px;">'+
    '<button onclick="window._etqEnvioQtd=1;var w=document.getElementById(\'etq-ui-wrap\');if(w)w.innerHTML=renderEtiquetaEnvioUI();" style="flex:1;padding:10px;border-radius:8px;border:2px solid '+(qtd===1?'#c77dff':'var(--border)')+';background:'+(qtd===1?'rgba(199,125,255,.15)':'var(--bg2)')+';color:'+(qtd===1?'#c77dff':'var(--text3)')+';font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:14px;cursor:pointer;">1 etiqueta</button>'+
    '<button onclick="window._etqEnvioQtd=2;var w=document.getElementById(\'etq-ui-wrap\');if(w)w.innerHTML=renderEtiquetaEnvioUI();" style="flex:1;padding:10px;border-radius:8px;border:2px solid '+(qtd===2?'#c77dff':'var(--border)')+';background:'+(qtd===2?'rgba(199,125,255,.15)':'var(--bg2)')+';color:'+(qtd===2?'#c77dff':'var(--text3)')+';font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:14px;cursor:pointer;">2 etiquetas</button>'+
    '</div>'+
    infoTxt+
    '<div style="margin-top:14px;">'+
    '<button onclick="imprimirEtiquetaEnvio()" style="width:100%;padding:12px;background:rgba(199,125,255,.2);border:1px solid rgba(199,125,255,.5);border-radius:10px;color:#c77dff;font-family:\'Rajdhani\',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">🖨️ Imprimir Etiqueta de Envio</button>'+
    '</div>'+
    '</div>'+
    '<div id="etq-ui-wrap"></div>';
}

function imprimirEtiquetaEnvio(){
  var qtd=window._etqEnvioQtd||1;
  var imgUrl='https://moledo-eletrotech.github.io/MoLeDo-/logofrete.png';
  var pageSize, bodyStyle, etqStyle, corpo;
  if(qtd===1){
    // Folha inteira horizontal (paisagem) — 29.7 x 21cm
    pageSize='size:A4 landscape;margin:5mm;';
    bodyStyle='margin:0;padding:0;width:29.7cm;height:21cm;display:flex;align-items:center;justify-content:center;';
    etqStyle='width:29.7cm;height:21cm;display:flex;align-items:center;justify-content:center;';
    corpo='<div style="'+etqStyle+'"><img src="'+imgUrl+'" style="max-width:100%;max-height:100%;object-fit:contain;"></div>';
  } else {
    // Duas etiquetas empilhadas — folha retrato 21 x 29.7cm, cada uma ~21 x 14cm
    pageSize='size:A4 portrait;margin:5mm;';
    bodyStyle='margin:0;padding:5mm;';
    etqStyle='width:20cm;height:13.5cm;display:flex;align-items:center;justify-content:center;overflow:hidden;page-break-inside:avoid;';
    var etqHtml='<div style="'+etqStyle+'"><img src="'+imgUrl+'" style="max-width:100%;max-height:100%;object-fit:contain;"></div>';
    corpo=etqHtml+'<div style="height:5mm;"></div>'+etqHtml+
      '<div style="font-size:9px;color:#aaa;text-align:center;margin-top:4mm;">2 etiquetas por folha A4 — cada uma ~21×14cm</div>';
  }
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Etiqueta de Envio</title>'+
    '<style>*{margin:0;padding:0;box-sizing:border-box;}body{'+bodyStyle+'}@media print{button{display:none!important;}@page{'+pageSize+'}}</style>'+
    '</head><body>'+
    '<button onclick="window.print()" style="position:fixed;top:8px;right:8px;padding:6px 14px;background:#007ea8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;z-index:9999;">🖨️ Imprimir</button>'+
    corpo+'</body></html>';
  var blob=new Blob([html],{type:'text/html;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  window.open(url,'_blank');
  setTimeout(function(){URL.revokeObjectURL(url);},10000);
  showToast('📦 Etiqueta de envio aberta!');
}
