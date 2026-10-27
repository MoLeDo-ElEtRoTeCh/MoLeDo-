function switchTab(tab){
  document.querySelectorAll('.tab-pane').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active');});
  var pane=document.getElementById('tab-'+tab);
  if(pane)pane.classList.add('active');
  // Encontra o botão pelo onclick em vez de por índice
  document.querySelectorAll('.tab-btn').forEach(function(b){
    if(b.getAttribute('onclick')&&b.getAttribute('onclick').indexOf("'"+tab+"'")!==-1){
      b.classList.add('active');
    }
  });
  currentTab=tab;renderTab(tab);
}

function renderTab(tab){
  if(tab==='clientes')renderClientes();
  else if(tab==='checkin')renderCheckin();
  else if(tab==='fila')renderFila();
  else if(tab==='alertas')renderAlertas();
  else if(tab==='garantia')renderGarantia();
  else if(tab==='lixeira')renderLixeira();
  else if(tab==='etiqueta')renderEtiqueta();
  else if(tab==='diagnostico')renderDiagnosticoLista();
  else if(tab==='relatorio')renderRelatorio();
}

function renderAll(){purgarLixeira();purgarLembretesFeitos();updateAlertBanner();renderBadges();renderTab(currentTab);renderContador();criarBotaoFlutuante();}
