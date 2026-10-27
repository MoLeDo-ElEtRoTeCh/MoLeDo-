function gerarApresentacao(roboId){
  var r=DB.robos.find(function(x){return x.id===roboId;});if(!r)return;
  var c=DB.clientes.find(function(x){return x.id===r.clienteId;});if(!c)return;
  var num=r.numOS||('#'+String(r.numVisual).padStart(3,'0'));
  var appUrl='https://moledo-eletrotech.github.io/MoLeDo-#robo='+r.id;
  var instaUrl='https://www.instagram.com/moledoeletrotech';
  var qrRoboUrl='https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data='+encodeURIComponent(appUrl);
  var qrInstaUrl='https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=6&data='+encodeURIComponent(instaUrl);
  var logoUrl='https://moledo-eletrotech.github.io/MoLeDo-/logo.png';
  var nome=c.nome.split(' ')[0];
  var modelo=descricaoEquipamento(r)||textoEquipamento('Robô Aspirador',r);
  var dias=r.dataEntrada?Math.floor((new Date()-new Date(r.dataEntrada+'T00:00:00'))/(1000*60*60*24)):0;
  var atrasado=dias>30;
  var isSoPlaca=!!(r.bancada&&r.bancada.modo==='placa');
  var equipPalavra=isSoPlaca?'Sua placa':textoEquipamento('Seu robô',r);
  var equipPalavraVC=isSoPlaca?'sua placa':textoEquipamento('o seu robô',r);
  var wa=(c.whatsapp||'').replace(/\D/g,'');
  if(wa.length===11)wa='55'+wa;

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Apresentação — '+esc(c.nome)+'</title>'
    +'<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">'
    +'<style>'
    +'*{margin:0;padding:0;box-sizing:border-box;}'
    +'body{font-family:Arial,sans-serif;background:#fff;width:210mm;height:297mm;overflow:hidden;display:flex;flex-direction:column;}'
    // 1. LOGO
    +'.sec-logo{background:#fff;padding:10px 40px 8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}'
    +'.logo-img{width:100%;max-width:450px;height:auto;display:block;}'
    // 2. FAIXA CHEGOU
    +'.sec-chegou{background:#0a0e1a;padding:10px 40px;text-align:center;flex-shrink:0;}'
    +'.chegou-txt{font-family:"Orbitron",monospace;font-size:26px;font-weight:900;color:#00e5ff;letter-spacing:3px;text-shadow:0 0 20px rgba(0,229,255,.5);}'
    // 3. CORPO
    +'.sec-corpo{flex:1;padding:18px 40px;display:flex;flex-direction:column;gap:16px;min-height:0;}'
    +'.saudacao{font-size:27px;font-weight:900;color:#111;}'
    +'.saudacao span{color:#007ea8;}'
    +'.agradece{font-size:20px;font-weight:700;color:#222;line-height:1.9;}'
    +'.atraso{background:#fff8dc;border-left:4px solid #f0a500;border-radius:6px;padding:10px 14px;font-size:15px;font-weight:700;color:#7a5000;line-height:1.6;}'
    +'.infos{display:flex;gap:20px;align-items:flex-start;}'
    +'.info-txt{flex:1;display:flex;flex-direction:column;gap:16px;}'
    +'.info-linha{font-size:19px;font-weight:700;color:#111;line-height:1.9;}'
    +'.info-linha b{color:#007ea8;}'
    +'.qr-ficha{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;}'
    +'.qr-ficha img{border:2.5px solid #007ea8;border-radius:10px;width:148px;height:148px;}'
    +'.qr-ficha-label{font-size:13px;font-weight:900;color:#007ea8;text-transform:uppercase;text-align:center;letter-spacing:0.5px;}'
    // 5. INSTAGRAM
    +'.sec-insta{background:#fdf3ff;border-top:3px solid #c77dff;border-bottom:3px solid #c77dff;padding:15px 40px;display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0;}'
    +'.insta-cta{font-size:18px;font-weight:900;color:#6a0dad;text-align:center;}'
    +'.insta-row{display:flex;align-items:center;gap:20px;}'
    +'.insta-qr img{border:3px solid #c77dff;border-radius:14px;width:160px;height:160px;}'
    +'.insta-info{display:flex;flex-direction:column;gap:6px;}'
    +'.insta-handle{font-size:32px;font-weight:900;color:#6a0dad;letter-spacing:1px;}'
    +'.insta-sub{font-size:16px;font-weight:700;color:#9b59b6;line-height:1.7;}'
    // 6. RODAPÉ
    +'.sec-footer{background:#fff;padding:10px 40px;border-top:2px solid #eee;display:flex;flex-direction:column;gap:3px;flex-shrink:0;}'
    +'.footer-obg{font-size:16px;font-weight:900;color:#111;}'
    +'.footer-obg span{color:#007ea8;}'
    +'.footer-slogan{font-size:13px;font-weight:700;color:#555;}'
    +'.footer-end{font-size:11px;font-weight:600;color:#888;margin-top:3px;line-height:1.7;}'
    +'@media print{body{margin:0;}@page{size:A4 portrait;margin:0;}button{display:none;}}'
    +'.tem-atraso .agradece{font-size:15px;line-height:1.6;}'
    +'.tem-atraso .info-linha{font-size:15px;line-height:1.7;}'
    +'.tem-atraso .info-txt{gap:10px;}'
    +'.tem-atraso .sec-corpo{gap:10px;}'
    +'</style></head><body'+(atrasado?' class="tem-atraso"':'')+'>'

    // 1. LOGO
    +'<div class="sec-logo"><img src="'+logoUrl+'" class="logo-img"></div>'

    // 2. FAIXA CHEGOU
    +'<div class="sec-chegou">'
      +'<div class="chegou-txt">⚡ '+equipPalavra.toUpperCase()+' '+esc(modelo.toUpperCase())+' CHEGOU! ⚡</div>'
    +'</div>'

    // 3. CORPO
    +'<div class="sec-corpo">'
      +'<div class="saudacao">'+(r.nomeClienteFinal?'Olá, <span>'+esc(r.nomeClienteFinal.split(' ')[0])+'</span>! 🎉':(c.tipo==='vc'?'Olá! 🎉':'Olá, <span>'+esc(nome)+'</span>! 🎉'))+'</div>'
      +'<div class="agradece">'+(c.tipo==='vc'?(r.nomeClienteFinal?'O seu vendedor confiou na <strong>MoLeDo ElEtRoTeCh</strong> para deixar '+equipPalavraVC+' zero e pronto para o uso! 🤝':'O seu vendedor <strong>'+esc(nome)+'</strong> confiou na <strong>MoLeDo ElEtRoTeCh</strong> para deixar '+equipPalavraVC+' zero e pronto para o uso! 🤝'):'Ficamos muito felizes em ter você como cliente e agradecemos imensamente pela confiança depositada na <strong>MoLeDo ElEtRoTeCh</strong>! 💙')+'</div>'
      +(atrasado?'<div class="atraso">⏳ Pedimos sinceras desculpas pelo tempo de espera. Sabemos que sua paciência é muito valiosa e agradecemos imensamente por aguardar. Trabalhamos com muito cuidado para garantir a qualidade do serviço! 🙏</div>':'')
      +'<div class="infos">'
        +'<div class="info-txt">'
          +'<div class="info-linha">🔍 Escaneie o QR Code ao lado para conferir a <b>ficha técnica completa</b> e sua <b>garantia de 90 dias</b>.</div>'
          +textoEquipamento('<div class="info-linha">📌 Os QR codes de garantia estão colados na <b>caixa</b>, na <b>base</b> e no <b>robô</b> — quando precisar, é só ler!</div>',r)
          +'<div class="info-linha">✅ Qualquer dúvida, entre em contato pelo <b>WhatsApp</b> ou <b>Instagram</b> — estamos sempre à disposição!</div>'
        +'</div>'
        +'<div class="qr-ficha">'
          +'<img src="'+qrRoboUrl+'">'
          +textoEquipamento('<div class="qr-ficha-label">📋 Ficha do Robô<br>& Garantia</div>',r)
        +'</div>'
      +'</div>'
    +'</div>'

    // 5. INSTAGRAM
    +'<div class="sec-insta">'
      +'<div class="insta-cta">📸 Ficou feliz com o resultado? Tira uma foto e nos marca no Instagram! 💜</div>'
      +'<div class="insta-row">'
        +'<div class="insta-qr"><img src="'+qrInstaUrl+'"></div>'
        +'<div class="insta-info">'
          +'<div class="insta-handle">@moledoeletrotech</div>'
          +'<div class="insta-sub">Escaneie o QR Code ou busque<br>nosso perfil no Instagram.<br>Sua foto nos motiva muito! 🌟</div>'
        +'</div>'
      +'</div>'
    +'</div>'

    // 6. RODAPÉ
    +'<div class="sec-footer">'
      +'<div class="footer-obg">💚 Obrigado por confiar na <span>MoLeDo ElEtRoTeCh</span>!</div>'
      +'<div class="footer-slogan">Reparo é nossa linguagem · Tecnologia é nossa paixão</div>'
      +'<div class="footer-end">'
        +'📍 R. Tietê, 3905 - Jd. América, Umuarama - PR, 87502-310<br>'
        +'📞 (44) 9 9972-4074 &nbsp;·&nbsp; 📧 moledoeletrotech@gmail.com &nbsp;·&nbsp; 📱 @moledoeletrotech'
      +'</div>'
    +'</div>'

    +'<div style="position:fixed;bottom:12px;left:12px;">'
      +'<button onclick="window.print()" style="padding:10px 20px;background:#0a0e1a;color:#00e5ff;border:2px solid #00e5ff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;font-family:monospace;">🖨️ Imprimir</button>'
    +'</div>'
    +'</body></html>';

  var blob=new Blob([html],{type:'text/html;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  window.open(url,'_blank');
  setTimeout(function(){URL.revokeObjectURL(url);},15000);
}
