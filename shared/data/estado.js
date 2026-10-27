// APP VERSION: TSIMP v2.11
// BUILD: TSIMP v2.11 - busca sem perder foco + SN na bancada + camera SN no cadastro
var APP_VERSION='TSIMP v2.11';
var DB={clientes:[],robos:[],lixeira:[],catalogo:[],defeitosCI:[],osSeq:0};

var currentTab='clientes',fichaClienteId=null,ciQty=1,ciDefects={},ciTipo='cf';

var waTipoAtual='entrada',waMensagens={},waRoboId=null,waParcela=0;
var etqSel=[],etqAba='nao',etqCopias={},etqBusca='';
var ZEBRA_PRINTER_STATE_KEY='moledo_zebra_printer_state_v1';

// ── ZEBRA CLOUD PRINT (HTTPS -> Pico 2 W -> USB -> ZD220) ──
// Uma intenção humana = um UUID = uma etiqueta. Sem retry automático.
var ZEBRA_PRINT_BASE='https://southamerica-east1-moledo-eletrotech.cloudfunctions.net/moledoPrint';
var ZEBRA_PRINTER_ID='zebra01';
var ZEBRA_PENDING_KEY='moledo_zebra_pending_v1';
var zebraPollTimer=null;
var zebraPollInFlight=false;
var zebraActionLocked=false;
var zebraCooldownUntil=0;

var diagRoboId=null,parcelaSel=2,configEditId=null;
var splitCartoesQtd=1;
var splitCartoes=[
  {base:0,tipo:'c2'},
  {base:0,tipo:'c2'},
  {base:0,tipo:'c2'},
  {base:0,tipo:'c2'}
];
var splitUltimoTotal=0;
var CD={roboId:'',num:'',modelo:'',cliente:'',val:200,wa:'',motivo:''};

