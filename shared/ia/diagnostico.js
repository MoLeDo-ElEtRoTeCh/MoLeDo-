function abrirIADiag(){
  openModal('<div class="modal-title">✨ Assistente de Diagnóstico</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:12px;">Descreva o que encontrou e o que vai fazer. A IA monta a descrição técnica e sugere o item e valor.</div>'+
    '<div class="form-group"><label class="form-label">🎙️ O que você encontrou e vai fazer?</label>'+
    '<textarea id="ia-diag-input" class="form-input" style="min-height:100px;" placeholder="Ex: o robô não ligava por causa de um CI de 5 pernas que estava com falha na linha de carga. Vou trocar o CI e fazer soldagem SMD. Vou cobrar 600 reais."></textarea></div>'+
    '<div id="ia-diag-result" style="display:none;margin-top:8px;"></div>'+
    '<div class="modal-actions">'+
    '<button class="btn btn-close" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-primary" onclick="processarIADiag()">✨ Gerar</button>'+
    '</div>');
}

function processarIADiag(){
  var input=document.getElementById('ia-diag-input').value.trim();
  if(!input){alert('Descreva o problema antes.');return;}
  var btn=document.querySelector('#modal-box .btn-primary');
  btn.textContent='⏳ Processando...';btn.disabled=true;
  var catalogoAtivo=DB.catalogo.filter(function(x){return x.ativo!==false;});
  var catalogoJson=JSON.stringify(catalogoAtivo.map(function(x){return{id:x.id,nome:x.nome,cat:x.cat,valor:x.valor||0};}));
  var sysPrompt='Você é o assistente técnico de diagnóstico da MoLeDo ElEtRoTeCh, especializado em robôs aspiradores. '
  +'Sua função é transformar a fala informal do técnico em um laudo profissional, claro para o cliente e tecnicamente correto. '
  +'Retorne APENAS JSON válido, sem markdown, sem comentários e sem texto fora do JSON. '
  +'Formato EXATO: {"descricao":"...","acaoNecessaria":"...","observacao":"...","itens":[{"catalogoId":null,"nome":"...","preco":0}]}. '
  +'PADRÃO DE ESCRITA: '
  +'A) DESCRIÇÃO/DIAGNÓSTICO: informe somente o defeito encontrado, o sintoma, o componente envolvido e de forma curta a função desse componente no robô. Não misture o reparo com o diagnóstico. Use 2 a 4 frases. '
  +'B) AÇÃO NECESSÁRIA: informe somente o que foi feito ou o que precisa ser feito para corrigir. Se o técnico disser que já executou o serviço, escreva no passado: "foi realizada", "foi substituído", "foram efetuados testes". Se ainda será feito, escreva como ação necessária/futura. Use 1 a 3 frases. '
  +'C) OBSERVAÇÃO: use somente quando houver informação adicional realmente relevante ao cliente, como montagem incorreta de fábrica, peça já danificada anteriormente, limitação de teste ou recomendação. Caso contrário use string vazia. '
  +'D) ITENS: nomes curtos, profissionais e claros para cobrança, como "Substituição da bomba de esgoto", "Limpeza detalhada", "Substituição do sensor LDS". '
  +'REGRAS OBRIGATÓRIAS: '
  +'1. NUNCA invente defeito, causa, teste, peça, serviço, quantidade ou valor que o técnico não informou. '
  +'2. NUNCA coloque preço dentro de descricao, acaoNecessaria ou observacao. Preços ficam somente em itens. '
  +'3. Se o técnico citar um único valor para todo o serviço, crie apenas UM item correspondente ao serviço principal, sem dividir o valor. '
  +'4. Se citar vários valores distintos, crie um item separado para cada valor e preserve exatamente cada valor informado. '
  +'5. Se o técnico disser "cada peça custa X" e houver N unidades, X é o preço por unidade; não divida X por N. '
  +'6. Se nenhum valor for citado, retorne itens como array vazio []. Nunca use preços do catálogo para inventar cobrança. '
  +'7. Explique componentes de forma curta e útil. Exemplos: LDS = sensor a laser usado no mapeamento e navegação; CI = Circuito Integrado; SMD = componente de montagem superficial; flat = cabo flexível de comunicação; FB = Ferrite Bead, componente de filtragem de ruído elétrico. '
  +'8. Evite repetição de expressões como "foi constatado", "foi identificado" e "foi realizado". Escreva de forma natural e profissional. '
  +'9. Preserve nomes técnicos citados pelo técnico, corrigindo apenas erros evidentes de escrita quando o contexto for inequívoco. '
  +'10. Use o catálogo abaixo apenas como referência de nomenclatura. SEMPRE coloque catalogoId como null para os itens gerados pela IA. '
  +'Catálogo de referência (nomes e preços típicos — NÃO use preços se o técnico não citar valor): '+catalogoJson;
  fetch('https://moledo-ia.moledoeletrotech.workers.dev/',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      system:sysPrompt,
      input:input
    })
  })
  .then(async function(r){
    var raw=await r.text();
    if(!r.ok)throw new Error('Servidor da IA respondeu '+r.status+': '+raw.substring(0,250));
    try{return JSON.parse(raw);}catch(e){return {text:raw};}
  })
  .then(function(data){
    var text=data.text||'';
    try{
      if(!text){
        var detalhe=data.error||data.message||'Resposta vazia do servidor';
        throw new Error(detalhe);
      }
      // Remove markdown code blocks e extrai só o JSON
      var clean=text.replace(/```json/gi,'').replace(/```/g,'').trim();
      // Tenta encontrar o JSON mesmo que tenha texto antes/depois
      var jsonMatch=clean.match(/\{[\s\S]*\}/);
      if(!jsonMatch)throw new Error('JSON não encontrado');
      var res=JSON.parse(jsonMatch[0]);
      if(!res.descricao&&!res.itens)throw new Error('Formato inválido');
      var resDiv=document.getElementById('ia-diag-result');
      resDiv.style.display='block';
      var html='<div style="background:rgba(138,43,226,.1);border:1px solid rgba(138,43,226,.35);border-radius:10px;padding:12px;">';
      html+='<div style="font-size:11px;font-weight:700;color:#c77dff;margin-bottom:6px;">✨ RESULTADO DA IA</div>';
      html+='<div style="font-size:12px;font-weight:700;color:var(--cyan3);margin-bottom:2px;">DIAGNÓSTICO</div>';
      html+='<div style="font-size:13px;color:var(--text);margin-bottom:8px;">'+esc(res.descricao||'')+'</div>';
      if(res.acaoNecessaria)html+='<div style="font-size:12px;font-weight:700;color:var(--cyan3);margin-bottom:2px;">AÇÃO NECESSÁRIA</div><div style="font-size:13px;color:var(--text);margin-bottom:8px;">'+esc(res.acaoNecessaria)+'</div>';
      if(res.observacao)html+='<div style="font-size:12px;font-weight:700;color:var(--cyan3);margin-bottom:2px;">OBSERVAÇÃO</div><div style="font-size:13px;color:var(--text);margin-bottom:8px;">'+esc(res.observacao)+'</div>';
      if(res.itens&&res.itens.length){
        html+='<div style="font-size:11px;font-weight:700;color:var(--cyan3);margin-bottom:4px;">ITENS SUGERIDOS</div>';
        res.itens.forEach(function(it,i){
          html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);">'+
            '<span style="font-size:13px;color:var(--text);">'+esc(it.nome)+'</span>'+
            '<span style="font-size:13px;font-weight:700;color:var(--cyan);">R$ '+Number(it.preco||0).toFixed(2).replace('.',',')+'</span>'+
          '</div>';
        });
      }
      window._iaResult=res;
      html+='<button type="button" onclick="aplicarIADiag()" style="width:100%;margin-top:10px;padding:10px;background:rgba(0,200,150,.2);border:1px solid rgba(0,200,150,.5);border-radius:8px;color:#00c896;font-family:\'Rajdhani\',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">✅ Aplicar no Diagnóstico</button>';
      html+='</div>';
      resDiv.innerHTML=html;
      btn.textContent='✨ Gerar novamente';btn.disabled=false;
    }catch(e){
      // Mostra o texto bruto para debug
      var resDiv=document.getElementById('ia-diag-result');
      if(resDiv&&text){
        resDiv.style.display='block';
        resDiv.innerHTML='<div style="background:rgba(255,100,0,.1);border:1px solid rgba(255,100,0,.3);border-radius:8px;padding:10px;font-size:11px;color:#ff6b35;">⚠️ Erro ao processar. Resposta da IA:<br><pre style="white-space:pre-wrap;font-size:10px;margin-top:6px;">'+esc(text.substring(0,500))+'</pre></div>';
      }else{
        alert('Erro ao interpretar resposta da IA. Tente novamente.');
      }
      btn.textContent='✨ Gerar novamente';btn.disabled=false;
    }
  })
  .catch(function(){alert('Erro de conexão. Verifique a internet.');btn.textContent='✨ Gerar';btn.disabled=false;});
}

function aplicarIADiag(){
  try{
    var res=window._iaResult;
    if(!res){alert('Erro: resultado não encontrado.');return;}
    // Preenche direto sem fechar modal — os campos do diag-overlay estão no DOM mesmo com modal aberto
    var descEl=document.getElementById('diag-descricao');
    if(!descEl){
      // Tenta fechar e preencher
      closeModal();
      setTimeout(function(){aplicarIADiagDados(res);},300);
      return;
    }
    aplicarIADiagDados(res);
    closeModal();
    showToast('✅ IA preencheu o diagnóstico!');
  }catch(e){alert('Erro ao aplicar: '+e.message);}
}

function aplicarIADiagDados(res){
  // Preenche descrição
  var descEl=document.getElementById('diag-descricao');
  if(descEl){
    var fullDesc=res.descricao||'';
    if(res.acaoNecessaria)fullDesc+='\n\nAÇÃO NECESSÁRIA:\n'+res.acaoNecessaria;
    if(res.observacao)fullDesc+='\n\nOBSERVAÇÃO:\n'+res.observacao;
    descEl.value=fullDesc;
  }
  // Todos os itens da IA viram linhas na lista avulsa (nome + valor cada)
  if(!window._avulsoItens)window._avulsoItens=[];
  if(res.itens&&res.itens.length){
    res.itens.forEach(function(it){
      // Só adiciona se tiver valor (se não falou valor, não cria linha)
      var preco=Number(it.preco)||0;
      if(preco>0||(it.nome&&it.nome.trim())){
        window._avulsoItens.push({nome:it.nome||'Item',preco:preco});
      }
    });
    renderAvulsoList();
    atualizarTotalDiag();
  }
}
