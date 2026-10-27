function buildVoltBtns(gid,cur){
  return'<div class="volt-row" id="vb-'+gid+'">'+['110V','220V','Bivolt'].map(function(v){return'<button type="button" class="volt-btn'+(cur===v?' sel':'')+'" onclick="selVolt(\''+gid+'\',\''+v+'\',this)">⚡ '+v+'</button>';}).join('')+'</div>';
}

function selVolt(gid,val,btn){document.querySelectorAll('#vb-'+gid+' .volt-btn').forEach(function(b){b.classList.remove('sel');});btn.classList.add('sel');document.getElementById('vb-'+gid).dataset.volt=val;}

function getVolt(gid){var el=document.getElementById('vb-'+gid);return el&&el.dataset.volt?el.dataset.volt:'—';}
