function diasDesde(iso){var d=new Date(iso+'T00:00:00'),h=new Date();h.setHours(0,0,0,0);return Math.max(0,Math.floor((h-d)/86400000));}
function diasDesde2(isoIni,isoFim){var d=new Date(isoIni+'T00:00:00'),f=new Date(isoFim+'T00:00:00');return Math.max(0,Math.floor((f-d)/86400000));}
function fmtData(iso){if(!iso)return'—';return new Date(iso+'T12:00:00').toLocaleDateString('pt-BR');}
function addDays(iso,n){var d=new Date(iso+'T00:00:00');d.setDate(d.getDate()+n);return d.toISOString().split('T')[0];}
function todayISO(){return new Date().toISOString().split('T')[0];}
