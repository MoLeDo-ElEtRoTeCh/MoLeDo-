function toggleChecklistReceb(n){
  var cb=document.getElementById('ci-outra-ass-'+n);
  var box=document.getElementById('ci-checklist-receb-'+n);
  if(box)box.style.display=cb&&cb.checked?'block':'none';
}
