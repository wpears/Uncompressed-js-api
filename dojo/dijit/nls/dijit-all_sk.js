require({cache:{
'dijit/form/nls/sk/validate':function(){
define(
//begin v1.x content
({
	invalidMessage: "Zadaná hodnota nie je platná.",
	missingMessage: "Táto hodnota je vyžadovaná.",
	rangeMessage: "Táto hodnota je mimo rozsah."
})

//end v1.x content
);

},
'dijit/_editor/nls/sk/commands':function(){
define(
//begin v1.x content
({
	'bold': 'Tučné písmo',
	'copy': 'Kopírovať',
	'cut': 'Vystrihnúť',
	'delete': 'Vymazať',
	'indent': 'Odsadiť',
	'insertHorizontalRule': 'Horizontálna čiara',
	'insertOrderedList': 'Číslovaný zoznam',
	'insertUnorderedList': 'Zoznam s odrážkami',
	'italic': 'Kurzíva',
	'justifyCenter': 'Zarovnať na stred',
	'justifyFull': 'Zarovnať podľa okraja',
	'justifyLeft': 'Zarovnať doľava',
	'justifyRight': 'Zarovnať doprava',
	'outdent': 'Predsadiť',
	'paste': 'Nalepiť',
	'redo': 'Znova vykonať',
	'removeFormat': 'Odstrániť formát',
	'selectAll': 'Vybrať všetko',
	'strikethrough': 'Prečiarknuť',
	'subscript': 'Dolný index',
	'superscript': 'Horný index',
	'underline': 'Podčiarknuť',
	'undo': 'Vrátiť späť',
	'unlink': 'Odstrániť prepojenie',
	'createLink': 'Vytvoriť prepojenie',
	'toggleDir': 'Prepnúť smer',
	'insertImage': 'Vložiť obrázok',
	'insertTable': 'Vložiť/upraviť tabuľku',
	'toggleTableBorder': 'Prepnúť rámček tabuľky',
	'deleteTable': 'Vymazať tabuľku',
	'tableProp': 'Vlastnosť tabuľky',
	'htmlToggle': 'Zdroj HTML',
	'foreColor': 'Farba popredia',
	'hiliteColor': 'Farba pozadia',
	'plainFormatBlock': 'Štýl odseku',
	'formatBlock': 'Štýl odseku',
	'fontSize': 'Veľkosť písma',
	'fontName': 'Názov písma',
	'tabIndent': 'Odsadenie tabulátora',
	"fullScreen": "Zobraziť na celú obrazovku",
	"viewSource": "Zobraziť zdrojový kód HTML ",
	"print": "Tlačiť",
	"newPage": "Nová stránka ",
	/* Error messages */
	'systemShortcut': 'Akcia "${0}" je vo vašom prehliadači dostupná len s použitím klávesovej skratky. Použite ${1}.'
})

//end v1.x content
);

},
'dojo/cldr/nls/sk/gregorian':function(){
define(
//begin v1.x content
{
	"field-dayperiod": "Časť dňa",
	"dateFormatItem-yQ": "Q yyyy",
	"dayPeriods-format-wide-pm": "popoludní",
	"field-minute": "Minúta",
	"eraNames": [
		"pred n.l.",
		"n.l."
	],
	"dateFormatItem-MMMEd": "E, d. MMM",
	"field-day-relative+-1": "Včera",
	"field-weekday": "Deň v týždni",
	"dateFormatItem-yQQQ": "QQQ y",
	"field-day-relative+-2": "Predvčerom",
	"field-day-relative+-3": "Pred tromi dňami",
	"days-standAlone-wide": [
		"nedeľa",
		"pondelok",
		"utorok",
		"streda",
		"štvrtok",
		"piatok",
		"sobota"
	],
	"months-standAlone-narrow": [
		"j",
		"f",
		"m",
		"a",
		"m",
		"j",
		"j",
		"a",
		"s",
		"o",
		"n",
		"d"
	],
	"field-era": "Éra",
	"field-hour": "Hodina",
	"dayPeriods-format-wide-am": "dopoludnia",
	"timeFormat-full": "H:mm:ss zzzz",
	"months-standAlone-abbr": [
		"jan",
		"feb",
		"mar",
		"apr",
		"máj",
		"jún",
		"júl",
		"aug",
		"sep",
		"okt",
		"nov",
		"dec"
	],
	"dateFormatItem-yMMM": "LLL y",
	"field-day-relative+0": "Dnes",
	"field-day-relative+1": "Zajtra",
	"days-standAlone-narrow": [
		"N",
		"P",
		"U",
		"S",
		"Š",
		"P",
		"S"
	],
	"eraAbbr": [
		"pred n.l.",
		"n.l."
	],
	"field-day-relative+2": "Pozajtra",
	"field-day-relative+3": "O tri dni",
	"dateFormatItem-yyyyMMMM": "LLLL y",
	"dateFormat-long": "d. MMMM y",
	"timeFormat-medium": "H:mm:ss",
	"dateFormatItem-EEEd": "EEE, d.",
	"field-zone": "Pásmo",
	"dateFormatItem-Hm": "H:mm",
	"dateFormat-medium": "d.M.yyyy",
	"dateFormatItem-Hms": "H:mm:ss",
	"dateFormatItem-yyQQQQ": "QQQQ yy",
	"quarters-standAlone-wide": [
		"1. štvrťrok",
		"2. štvrťrok",
		"3. štvrťrok",
		"4. štvrťrok"
	],
	"dateFormatItem-yMMMM": "LLLL y",
	"dateFormatItem-ms": "mm:ss",
	"field-year": "Rok",
	"months-standAlone-wide": [
		"január",
		"február",
		"marec",
		"apríl",
		"máj",
		"jún",
		"júl",
		"august",
		"september",
		"október",
		"november",
		"december"
	],
	"field-week": "Týždeň",
	"dateFormatItem-MMMMEd": "E, d. MMMM",
	"dateFormatItem-MMMd": "d. MMM",
	"dateFormatItem-yyQ": "Q yy",
	"timeFormat-long": "H:mm:ss z",
	"months-format-abbr": [
		"jan",
		"feb",
		"mar",
		"apr",
		"máj",
		"jún",
		"júl",
		"aug",
		"sep",
		"okt",
		"nov",
		"dec"
	],
	"timeFormat-short": "H:mm",
	"dateFormatItem-H": "H",
	"field-month": "Mesiac",
	"dateFormatItem-MMMMd": "d. MMMM",
	"quarters-format-abbr": [
		"Q1",
		"Q2",
		"Q3",
		"Q4"
	],
	"days-format-abbr": [
		"ne",
		"po",
		"ut",
		"st",
		"št",
		"pi",
		"so"
	],
	"dateFormatItem-mmss": "mm:ss",
	"days-format-narrow": [
		"N",
		"P",
		"U",
		"S",
		"Š",
		"P",
		"S"
	],
	"field-second": "Sekunda",
	"field-day": "Deň",
	"dateFormatItem-MEd": "E, d.M.",
	"months-format-narrow": [
		"j",
		"f",
		"m",
		"a",
		"m",
		"j",
		"j",
		"a",
		"s",
		"o",
		"n",
		"d"
	],
	"days-standAlone-abbr": [
		"ne",
		"po",
		"ut",
		"st",
		"št",
		"pi",
		"so"
	],
	"dateFormat-short": "d.M.yyyy",
	"dateFormatItem-yyyyM": "M.yyyy",
	"dateFormatItem-yMMMEd": "EEE, d. MMM y",
	"dateFormat-full": "EEEE, d. MMMM y",
	"dateFormatItem-Md": "d.M.",
	"dateFormatItem-yMEd": "EEE, d.M.yyyy",
	"months-format-wide": [
		"januára",
		"februára",
		"marca",
		"apríla",
		"mája",
		"júna",
		"júla",
		"augusta",
		"septembra",
		"októbra",
		"novembra",
		"decembra"
	],
	"dateFormatItem-d": "d.",
	"quarters-format-wide": [
		"1. štvrťrok",
		"2. štvrťrok",
		"3. štvrťrok",
		"4. štvrťrok"
	],
	"days-format-wide": [
		"nedeľa",
		"pondelok",
		"utorok",
		"streda",
		"štvrtok",
		"piatok",
		"sobota"
	],
	"eraNarrow": [
		"pred n.l.",
		"n.l."
	]
}
//end v1.x content
);
},
'dijit/nls/sk/loading':function(){
define(
//begin v1.x content
({
	loadingState: "Zavádzanie...",
	errorState: "Nastala chyba"
})

//end v1.x content
);

},
'dojo/nls/sk/colors':function(){
define(
({
// local representation of all CSS3 named colors, companion to dojo.colors.  To be used where descriptive information
// is required for each color, such as a palette widget, and not for specifying color programatically.
	//Note: due to the SVG 1.0 spec additions, some of these are alternate spellings for the same color (e.g. gray / grey).
	//TODO: should we be using unique rgb values as keys instead and avoid these duplicates, or rely on the caller to do the reverse mapping?
	aliceblue: "modrá (alice)",
	antiquewhite: "antická biela",
	aqua: "vodová",
	aquamarine: "akvamarínová",
	azure: "azúrová",
	beige: "béžová",
	bisque: "porcelánová",
	black: "čierna",
	blanchedalmond: "bledá mandľová",
	blue: "modrá",
	blueviolet: "modro-fialová",
	brown: "hnedá",
	burlywood: "drevená hnedá",
	cadetblue: "červeno modrá",
	chartreuse: "kartúzska",
	chocolate: "čokoládová",
	coral: "koralová",
	cornflowerblue: "nevädzová modrá",
	cornsilk: "ôstie kukurice",
	crimson: "karmínová",
	cyan: "zelenomodrá",
	darkblue: "tmavomodrá",
	darkcyan: "tmavá zelenomodrá",
	darkgoldenrod: "tmavá zlatobyľ",
	darkgray: "tmavosivá",
	darkgreen: "tmavozelená",
	darkgrey: "tmavosivá", // same as darkgray
	darkkhaki: "tmavá žltohnedá",
	darkmagenta: "tmavá purpurová",
	darkolivegreen: "tmavá olivovo zelená",
	darkorange: "tmavá oranžová",
	darkorchid: "tmavá orchidea",
	darkred: "tmavočervená",
	darksalmon: "tmavá lososová",
	darkseagreen: "tmavá morská zelená",
	darkslateblue: "tmavá bridlicová modrá",
	darkslategray: "tmavá bridlicová sivá",
	darkslategrey: "tmavá bridlicová sivá", // same as darkslategray
	darkturquoise: "tmavá tyrkysová",
	darkviolet: "tmavofialová",
	deeppink: "hlboká ružová",
	deepskyblue: "hlboká modrá obloha",
	dimgray: "matná sivá",
	dimgrey: "matná sivá", // same as dimgray
	dodgerblue: "modrá (dodger)",
	firebrick: "pálená tehla",
	floralwhite: "biely kvet",
	forestgreen: "lesná zelená",
	fuchsia: "fuchsia",
	gainsboro: "sivá - gainsboro",
	ghostwhite: "biela (ghost white)",
	gold: "zlatá",
	goldenrod: "zlatobyľ",
	gray: "sivá",
	green: "zelená",
	greenyellow: "zelenožltá",
	grey: "sivá", // same as gray
	honeydew: "ambrózia",
	hotpink: "horúca ružová",
	indianred: "indiánska červená",
	indigo: "indigo",
	ivory: "slonovina",
	khaki: "kaki",
	lavender: "levanduľa",
	lavenderblush: "rumencová levanduľa",
	lawngreen: "trávová zelená",
	lemonchiffon: "citrónový šifón",
	lightblue: "svetlomodrá",
	lightcoral: "svetlá koralová",
	lightcyan: "svetlá zelenomodrá",
	lightgoldenrodyellow: "svetlá zlatobyľová žltá",
	lightgray: "svetlosivá",
	lightgreen: "svetlozelená",
	lightgrey: "svetlosivá", // same as lightgray
	lightpink: "svetloružová",
	lightsalmon: "svetlá lososová",
	lightseagreen: "svetlá morská zelená",
	lightskyblue: "svetlá modrá obloha",
	lightslategray: "svetlá bridlicová sivá",
	lightslategrey: "svetlá bridlicová sivá", // same as lightslategray
	lightsteelblue: "svetlá oceľovomodrá",
	lightyellow: "svetložltá",
	lime: "limetková",
	limegreen: "limetková zelená",
	linen: "ľan",
	magenta: "purpurová",
	maroon: "gaštanová hnedá",
	mediumaquamarine: "stredná akvamarínová",
	mediumblue: "stredná modrá",
	mediumorchid: "stredná orchideová",
	mediumpurple: "stredná purpurová",
	mediumseagreen: "stredná morská zelená",
	mediumslateblue: "stredná bridlicová modrá",
	mediumspringgreen: "stredná jarná zelená",
	mediumturquoise: "stredná tyrkysová",
	mediumvioletred: "stredná fialovočervená",
	midnightblue: "polnočná modrá",
	mintcream: "mätová krémová",
	mistyrose: "zahmlená ruža",
	moccasin: "mokasínová",
	navajowhite: "navajská biela",
	navy: "námornícka",
	oldlace: "stará čipka",
	olive: "olivová",
	olivedrab: "fádna olivová",
	orange: "oranžová",
	orangered: "oranžovo červená",
	orchid: "orchideová",
	palegoldenrod: "bledá zlatobyľová",
	palegreen: "bledá zelená",
	paleturquoise: "bledá tyrkysová",
	palevioletred: "bledá fialovo červená",
	papayawhip: "papájový krém",
	peachpuff: "broskyňový nádych",
	peru: "peru",
	pink: "ružová",
	plum: "slivková",
	powderblue: "prášková modrá",
	purple: "purpurová",
	red: "červená",
	rosybrown: "ružovo hnedá",
	royalblue: "kráľovská modrá",
	saddlebrown: "sedlová hnedá",
	salmon: "lososová",
	sandybrown: "piesková hnedá",
	seagreen: "morská zelená",
	seashell: "lastúrová",
	sienna: "sienská",
	silver: "strieborná",
	skyblue: "modré nebo",
	slateblue: "bridlicová modrá",
	slategray: "bridlicová sivá",
	slategrey: "bridlicová sivá", // same as slategray
	snow: "snehová",
	springgreen: "jarná zelená",
	steelblue: "oceľovomodrá",
	tan: "žltohnedá",
	teal: "zelenomodrá",
	thistle: "bodliaková",
	tomato: "paradajková",
	transparent: "priesvitná",
	turquoise: "tyrkysová",
	violet: "fialová",
	wheat: "pšeničná",
	white: "biela",
	whitesmoke: "biely dym",
	yellow: "žltá",
	yellowgreen: "žltozelená"
})
);

},
'dojo/cldr/nls/sk/number':function(){
define(
//begin v1.x content
{
	"currencyFormat": "#,##0.00 ¤",
	"group": " ",
	"decimal": ","
}
//end v1.x content
);
},
'dijit/_editor/nls/sk/FontChoice':function(){
define(
"dijit/_editor/nls/sk/FontChoice", //begin v1.x content
({
	fontSize: "Veľkosť",
	fontName: "Písmo",
	formatBlock: "Formát",

	serif: "serif",
	"sans-serif": "sans-serif",
	monospace: "monospace",
	cursive: "cursive",
	fantasy: "fantasy",

	noFormat: "Žiadny",
	p: "Odsek",
	h1: "Hlavička",
	h2: "Podhlavička",
	h3: "Pod-podhlavička",
	pre: "Predformátované",

	1: "xx-small",
	2: "x-small",
	3: "small",
	4: "medium",
	5: "large",
	6: "x-large",
	7: "xx-large"
})
//end v1.x content
);


},
'dojo/cldr/nls/sk/currency':function(){
define(
//begin v1.x content
{
	"HKD_displayName": "Hong Kongský dolár",
	"CHF_displayName": "Švajčiarský frank",
	"CAD_displayName": "Kanadský dolár",
	"CNY_displayName": "Čínsky Yuan Renminbi",
	"AUD_displayName": "Austrálsky dolár",
	"JPY_displayName": "Japonský yen",
	"USD_displayName": "US dolár",
	"GBP_displayName": "Britská libra",
	"EUR_displayName": "Euro"
}
//end v1.x content
);
},
'dijit/form/nls/sk/ComboBox':function(){
define(
//begin v1.x content
({
		previousMessage: "Predchádzajúce voľby",
		nextMessage: "Ďalšie voľby"
})

//end v1.x content
);

},
'dijit/nls/sk/common':function(){
define(
//begin v1.x content
({
	buttonOk: "OK",
	buttonCancel: "Zrušiť",
	buttonSave: "Uložiť",
	itemClose: "Zatvoriť"
})

//end v1.x content
);

},
'*noref':1}});
define("dijit/nls/dijit-all_sk", [], 1);
