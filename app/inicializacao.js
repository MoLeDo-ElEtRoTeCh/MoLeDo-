




document.getElementById('modal-overlay').addEventListener('click',function(e){if(e.target===this)closeModal();});

// ── AUTOCOMPLETE MODELO ──




// ── WHATSAPP ──

// ── BUSCA GERAL ──
var buscaAberta=false;


var _buscaTimer=null;



// ── CONTADOR NO TOPO ──
// ══════════════════════════════════════
// 🔔 SISTEMA DE LEMBRETES
// ══════════════════════════════════════
var LEMBRETE_TIPOS=[
  {id:'ligar',label:'📞 Ligar pro cliente'},
  {id:'pronto',label:'💬 Avisar que está pronto'},
  {id:'diagnostico',label:'💊 Fazer diagnóstico'},
  {id:'orcamento',label:'📋 Retornar orçamento'},
  {id:'semresposta',label:'📱 Cliente não respondeu'},
  {id:'outro',label:'✏️ Outro'}
];




















// ══════════════════════════════════════











var _osSel={};








// ── NÚMERO OS SEQUENCIAL ──


// ── RELATÓRIO ──
var _relMes=null,_relValVisible=null,_relFiltro=null;
var _relMesSel=_relMesSel||null;






// ── CONFIG POR CATEGORIA (Check-in defeitos) ──



// ── CONFIG POR CATEGORIA (Diagnóstico) ──



// ── CHECKLIST SÓ A PLACA (Bancada) ──
var CHECKLIST_PLACA=[
  {id:'placa_bateria',nome:'Bateria'},
  {id:'placa_fonte',nome:'Fonte/Carregador'},
  {id:'placa_display',nome:'Display/Tela'},
  {id:'placa_motor',nome:'Motor principal'},
  {id:'placa_sensor',nome:'Sensores'},
  {id:'placa_cabo',nome:'Cabos/Flat'},
  {id:'placa_bms',nome:'BMS'},
  {id:'placa_modulo_wifi',nome:'Módulo Wi-Fi'},
  {id:'placa_dock',nome:'Dock/Base'},
  {id:'placa_outro',nome:'Outro componente'}
];
var _bancadaModo='normal'; // 'normal' ou 'placa'


var _bancadaItens={};
var CHECKLIST_ITENS=[
  {id:'vassoura_central',nome:'Vassoura Central'},
  {id:'vassoura_lat_esq',nome:'Vassoura Lateral Esquerda'},
  {id:'vassoura_lat_dir',nome:'Vassoura Lateral Direita'},
  {id:'reservatorio_poco',nome:'Reservatório de Poeira/Filtro'},
  {id:'reservatorio_agua',nome:'Reservatório de Água'},
  {id:'carregador_dock',nome:'Carregador/Dock'},
  {id:'cabo_carregador',nome:'Cabo do Carregador'},
  {id:'tampa_superior',nome:'Tampa Superior'},
  {id:'mop_esq',nome:'Mop Lateral Esquerdo'},
  {id:'mop_dir',nome:'Mop Lateral Direito'},
  {id:'mop_unico',nome:'Mop Único'},
  {id:'controle_remoto',nome:'Controle Remoto'},
  {id:'est_res_poeira',nome:'Estação · Reservatório de Poeira'},
  {id:'est_agua_limpa',nome:'Estação · Reservatório de Água Limpa'},
  {id:'est_agua_suja',nome:'Estação · Reservatório de Água Suja'},
  {id:'est_rampa',nome:'Estação · Rampa'},
  {id:'est_area_limpeza',nome:'Estação · Área/Bandeja de Limpeza'},
  {id:'est_cabo',nome:'Estação · Cabo de Energia'}
];












// ── AGENDAMENTO DE RETIRADA ──




// ── BACKUP GOOGLE DRIVE ──




// ── MOVER NA TV PELO QR CODE ──



// ── FILTRO CLIENTES ──
var filtroCliente='todos';


// ── AUTOCOMPLETE CHECK-IN ──




// ── VENDEDOR INATIVO ──


// ── CONFIG DEFEITOS CHECK-IN ──






// ── MODO TV ──
var _tvStatusMap={};
var _tvFrasesBiblicas=[
  '"Tudo posso naquele que me fortalece." — Filipenses 4:13',
  '"O Senhor é o meu pastor e nada me faltará." — Salmos 23:1',
  '"Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito." — João 3:16',
  '"Sede fortes e corajosos. Não temais." — Josué 1:9',
  '"Confia no Senhor de todo o teu coração." — Provérbios 3:5',
  '"O Senhor é a minha luz e a minha salvação; a quem temerei?" — Salmos 27:1',
  '"Pedi e dar-se-vos-á; buscai e achareis." — Mateus 7:7',
  '"Bem-aventurados os mansos, porque herdarão a terra." — Mateus 5:5',
  '"A fé é a certeza daquilo que esperamos." — Hebreus 11:1',
  '"O amor é paciente, é bondoso." — 1 Coríntios 13:4',
  '"Deus é o nosso refúgio e força, socorro bem presente." — Salmos 46:1',
  '"Alegrai-vos sempre no Senhor." — Filipenses 4:4',
  '"Não vos inquieteis com nada." — Filipenses 4:6',
  '"Com Deus faremos proezas." — Salmos 60:12',
  '"O Senhor está comigo; não temerei." — Salmos 118:6'
];
var _tvFraseIdx=Math.floor(Math.random()*_tvFrasesBiblicas.length);

























loadDB();
document.getElementById('ci-data').value=todayISO();
generateRobotBlocks();
renderAll();
verificarLembretes();
verificarAgendamentos();
setInterval(function(){verificarLembretes();verificarAgendamentos();},60000);
window._qrRoboId=null;
(function(){
  var hash=window.location.hash;
  if(hash&&hash.indexOf('robo=')!==-1){
    window._qrRoboId=hash.split('robo=')[1];
  }
})();
