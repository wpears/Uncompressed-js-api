require({cache:{
'dijit/form/nls/nb/validate':function(){
define(
"dijit/form/nls/nb/validate", //begin v1.x content
({
	invalidMessage: "Den angitte verdien er ikke gyldig.",
	missingMessage: "Denne verdien er obligatorisk.",
	rangeMessage: "Denne verdien er utenfor gyldig område."
})
//end v1.x content
);

},
'dijit/_editor/nls/nb/commands':function(){
define(
"dijit/_editor/nls/nb/commands", //begin v1.x content
({
	'bold': 'Fet',
	'copy': 'Kopier',
	'cut': 'Klipp ut',
	'delete': 'Slett',
	'indent': 'Innrykk',
	'insertHorizontalRule': 'Vannrett strek',
	'insertOrderedList': 'Nummerert liste',
	'insertUnorderedList': 'Punktliste',
	'italic': 'Kursiv',
	'justifyCenter': 'Midtstill',
	'justifyFull': 'Juster',
	'justifyLeft': 'Venstrejuster',
	'justifyRight': 'Høyrejuster',
	'outdent': 'Fjern innrykk',
	'paste': 'Lim inn',
	'redo': 'Gjør om',
	'removeFormat': 'Fjern format',
	'selectAll': 'Velg alle',
	'strikethrough': 'Gjennomstreking',
	'subscript': 'Senket skrift',
	'superscript': 'Hevet skrift',
	'underline': 'Understreking',
	'undo': 'Angre',
	'unlink': 'Fjern kobling',
	'createLink': 'Opprett kobling',
	'toggleDir': 'Bytt retning',
	'insertImage': 'Sett inn bilde',
	'insertTable': 'Sett inn/rediger tabell',
	'toggleTableBorder': 'Bytt tabellkant',
	'deleteTable': 'Slett tabell',
	'tableProp': 'Tabellegenskap',
	'htmlToggle': 'HTML-kilde',
	'foreColor': 'Forgrunnsfarge',
	'hiliteColor': 'Bakgrunnsfarge',
	'plainFormatBlock': 'Avsnittsstil',
	'formatBlock': 'Avsnittsstil',
	'fontSize': 'Skriftstørrelse',
	'fontName': 'Skriftnavn',
	'tabIndent': 'Tabulatorinnrykk',
	"fullScreen": "Slå på/av full skjerm",
	"viewSource": "Vis HTML-kilde",
	"print": "Skriv ut",
	"newPage": "Ny side",
	/* Error messages */
	'systemShortcut': 'Handlingen "${0}" er bare tilgjengelig i nettleseren ved hjelp av en tastatursnarvei. Bruk ${1}.',
	'ctrlKey':'ctrl+${0}',
	'appleKey':'\u2318${0}' // "command" or open-apple key on Macintosh
})
//end v1.x content
);

},
'dijit/form/nls/nb/ComboBox':function(){
define(
"dijit/form/nls/nb/ComboBox", //begin v1.x content
({
		previousMessage: "Tidligere valg",
		nextMessage: "Flere valg"
})
//end v1.x content
);

},
'*noref':1}});
define("esri/dijit/nls/AttributeInspector-all_nb", [], 1);
