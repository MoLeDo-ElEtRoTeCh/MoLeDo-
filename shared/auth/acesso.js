// Bloqueio visual local independente do SDK. Nao apaga nem altera a sessao.
(function(){
function mostrarLoginSeguro(){
  if(document.getElementById('login-overlay'))return;
  var el=document.createElement('div');
  el.id='login-overlay';
  el.style.cssText='position:fixed;inset:0;background:#0a0c10;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;';
  el.innerHTML=`
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://moledo-eletrotech.github.io/MoLeDo-/logo.png" style="width:100%;max-width:380px;display:block;margin:0 auto;" alt="MoLeDo ElEtRoTeCh">
      <div style="font-family:\'Rajdhani\',sans-serif;font-size:19px;font-weight:600;color:#00b8d9;letter-spacing:1.5px;margin-bottom:4px;text-align:center;">⚡ Reparo é nossa linguagem</div>
      <div style="font-family:\'Rajdhani\',sans-serif;font-size:19px;font-weight:600;color:#00b8d9;letter-spacing:1.5px;margin-bottom:6px;text-align:center;">Tecnologia é nossa paixão ⚡</div>
      <div style="font-size:11px;color:#334466;letter-spacing:2px;text-transform:uppercase;text-align:center;">Assistência Técnica · Robôs Aspiradores</div>
    </div>
    <div style="background:#111520;border:1px solid #1e2d45;border-radius:16px;padding:24px;width:100%;max-width:340px;">
      <div style="font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:#00e5ff;margin-bottom:20px;">🔐 Acesso Restrito</div>
      <div style="margin-bottom:12px;"><input id="login-email" type="email" placeholder="E-mail" style="width:100%;background:#0e1118;border:1px solid #1e2d45;border-radius:8px;padding:12px;color:#e0f0ff;font-family:\'Rajdhani\',sans-serif;font-size:14px;outline:none;"></div>
      <div style="margin-bottom:16px;"><input id="login-senha" type="password" placeholder="Senha" style="width:100%;background:#0e1118;border:1px solid #1e2d45;border-radius:8px;padding:12px;color:#e0f0ff;font-family:\'Rajdhani\',sans-serif;font-size:14px;outline:none;"></div>
      <div id="login-erro" style="color:#ff1744;font-size:12px;margin-bottom:10px;display:none;"></div>
      <button onclick="window._fazerLogin()" style="width:100%;background:linear-gradient(135deg,#007ea8,#005f7f);border:1px solid #007ea8;color:#fff;padding:13px;border-radius:10px;font-family:\'Rajdhani\',sans-serif;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:1px;">ENTRAR</button>
    </div>`;
  document.body.appendChild(el);
}
  window._mostrarLoginSeguro=mostrarLoginSeguro;
  window._bloquearAcesso=function(mensagem){
    document.documentElement.removeAttribute('data-access-validado');
    window._fbReady=false;
    mostrarLoginSeguro();
    var erro=document.getElementById('login-erro');
    if(erro){erro.textContent=mensagem||'Validando acesso...';erro.style.display='block';}
  };
  window._fazerLogin=function(){window._bloquearAcesso('Sem conexão. Não foi possível validar o acesso.');};
  window._bloquearAcesso(navigator.onLine?'Validando acesso...':'Sem conexão. Não foi possível validar o acesso.');
  setTimeout(function(){
    if(document.documentElement.getAttribute('data-access-validado')!=='sim')
      window._bloquearAcesso('Sem conexão. Não foi possível validar o acesso.');
  },15000);
  addEventListener('offline',function(){window._bloquearAcesso('Sem conexão. Não foi possível validar o acesso.');});
  addEventListener('online',function(){if(window._validarAcessoAtual)window._validarAcessoAtual();});
})();
