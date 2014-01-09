require({cache:{
'dijit/form/nls/ro/validate':function(){
define(
//begin v1.x content
({
	invalidMessage: "Valoarea introdusă nu este validă.",
	missingMessage: "Această valoare este necesară.",
	rangeMessage: "Această valoare este în afara intervalului. "
})

//end v1.x content
);

},
'dijit/_editor/nls/ro/commands':function(){
define(
//begin v1.x content
({
	'bold': 'Aldin',
	'copy': 'Copiere',
	'cut': 'Tăiere',
	'delete': 'Ştergere',
	'indent': 'Micşorare indent',
	'insertHorizontalRule': 'Linie delimitatoare',
	'insertOrderedList': 'Listă numerotată',
	'insertUnorderedList': 'Listă cu marcator',
	'italic': 'Cursiv',
	'justifyCenter': 'Aliniere centru',
	'justifyFull': 'Aliniere stânga-dreapta',
	'justifyLeft': 'Aliniere stânga',
	'justifyRight': 'Aliniere dreapta',
	'outdent': 'Mărire indent',
	'paste': 'Lipire',
	'redo': 'Refacere acţiune',
	'removeFormat': 'Înlăturare format',
	'selectAll': 'Selectează tot',
	'strikethrough': 'Tăiere text cu o linie',
	'subscript': 'Scriere indice inferior',
	'superscript': 'Scriere indice superior',
	'underline': 'Subliniere',
	'undo': 'Anulare acţiune',
	'unlink': 'Înlăturare legătură',
	'createLink': 'Creare legătură',
	'toggleDir': 'Comutare direcţie',
	'insertImage': 'Inserare imagine',
	'insertTable': 'Inserare/Editare tabelă',
	'toggleTableBorder': 'Comutare bordură tabelă',
	'deleteTable': 'Ştergere tabelă',
	'tableProp': 'Proprietate tabelă',
	'htmlToggle': 'Sursă HTML',
	'foreColor': 'Culoare de prim-plan',
	'hiliteColor': 'Culoare de fundal',
	'plainFormatBlock': 'Stil paragraf',
	'formatBlock': 'Stil paragraf',
	'fontSize': 'Dimensiune font',
	'fontName': 'Nume font',
	'tabIndent': 'Indentare Tab',
	"fullScreen": "Comutare ecran complet",
	"viewSource": "Vizualizara sursă HTML",
	"print": "Tipărire",
	"newPage": "Pagină nouă",
	/* Error messages */
	'systemShortcut': 'Acţiunea "${0}" este disponibilă în browser doar utilizând o comandă rapidă de la tastatură. Utilizaţi ${1}.'
})
//end v1.x content
);

},
'dojo/cldr/nls/ro/gregorian':function(){
define(
//begin v1.x content
{
	"months-format-narrow": [
		"I",
		"F",
		"M",
		"A",
		"M",
		"I",
		"I",
		"A",
		"S",
		"O",
		"N",
		"D"
	],
	"quarters-standAlone-narrow": [
		"T1",
		"T2",
		"T3",
		"T4"
	],
	"field-weekday": "zi a săptămânii",
	"dateFormatItem-yQQQ": "QQQ y",
	"dateFormatItem-yMEd": "EEE, d/M/yyyy",
	"dateFormatItem-MMMEd": "E, d MMM",
	"eraNarrow": [
		"î.Hr.",
		"d.Hr."
	],
	"dateFormat-long": "d MMMM y",
	"months-format-wide": [
		"ianuarie",
		"februarie",
		"martie",
		"aprilie",
		"mai",
		"iunie",
		"iulie",
		"august",
		"septembrie",
		"octombrie",
		"noiembrie",
		"decembrie"
	],
	"dateTimeFormat-medium": "{1}, {0}",
	"dateFormatItem-EEEd": "EEE d",
	"dayPeriods-format-wide-pm": "PM",
	"dateFormat-full": "EEEE, d MMMM y",
	"dateFormatItem-Md": "d.M",
	"field-era": "eră",
	"dateFormatItem-yM": "M.yyyy",
	"months-standAlone-wide": [
		"ianuarie",
		"februarie",
		"martie",
		"aprilie",
		"mai",
		"iunie",
		"iulie",
		"august",
		"septembrie",
		"octombrie",
		"noiembrie",
		"decembrie"
	],
	"timeFormat-short": "HH:mm",
	"quarters-format-wide": [
		"trimestrul I",
		"trimestrul al II-lea",
		"trimestrul al III-lea",
		"trimestrul al IV-lea"
	],
	"timeFormat-long": "HH:mm:ss z",
	"field-year": "an",
	"dateFormatItem-yMMM": "MMM y",
	"dateFormatItem-yQ": "'trimestrul' Q y",
	"dateFormatItem-yyyyMMMM": "MMMM y",
	"field-hour": "oră",
	"dateFormatItem-MMdd": "dd.MM",
	"months-format-abbr": [
		"ian.",
		"feb.",
		"mar.",
		"apr.",
		"mai",
		"iun.",
		"iul.",
		"aug.",
		"sept.",
		"oct.",
		"nov.",
		"dec."
	],
	"dateFormatItem-yyQ": "Q yy",
	"timeFormat-full": "HH:mm:ss zzzz",
	"field-day-relative+0": "azi",
	"field-day-relative+1": "mâine",
	"field-day-relative+2": "poimâine",
	"field-day-relative+3": "răspoimâine",
	"months-standAlone-abbr": [
		"ian.",
		"feb.",
		"mar.",
		"apr.",
		"mai",
		"iun.",
		"iul.",
		"aug.",
		"sept.",
		"oct.",
		"nov.",
		"dec."
	],
	"quarters-format-abbr": [
		"trim. I",
		"trim. II",
		"trim. III",
		"trim. IV"
	],
	"quarters-standAlone-wide": [
		"trimestrul I",
		"trimestrul al II-lea",
		"trimestrul al III-lea",
		"trimestrul al IV-lea"
	],
	"dateFormatItem-M": "L",
	"days-standAlone-wide": [
		"duminică",
		"luni",
		"marți",
		"miercuri",
		"joi",
		"vineri",
		"sâmbătă"
	],
	"dateFormatItem-MMMMd": "d MMMM",
	"dateFormatItem-yyMMM": "MMM yy",
	"timeFormat-medium": "HH:mm:ss",
	"dateFormatItem-Hm": "HH:mm",
	"quarters-standAlone-abbr": [
		"trim. I",
		"trim. II",
		"trim. III",
		"trim. IV"
	],
	"eraAbbr": [
		"î.Hr.",
		"d.Hr."
	],
	"field-minute": "minut",
	"field-dayperiod": "perioada zilei",
	"days-standAlone-abbr": [
		"Du",
		"Lu",
		"Ma",
		"Mi",
		"Jo",
		"Vi",
		"Sâ"
	],
	"dateFormatItem-d": "d",
	"dateFormatItem-ms": "mm:ss",
	"quarters-format-narrow": [
		"T1",
		"T2",
		"T3",
		"T4"
	],
	"field-day-relative+-1": "ieri",
	"dateTimeFormat-long": "{1}, {0}",
	"field-day-relative+-2": "alaltăieri",
	"field-day-relative+-3": "răsalaltăieri",
	"dateFormatItem-MMMd": "d MMM",
	"dateFormatItem-MEd": "E, d MMM",
	"dateTimeFormat-full": "{1}, {0}",
	"dateFormatItem-yMMMM": "MMMM y",
	"field-day": "zi",
	"days-format-wide": [
		"duminică",
		"luni",
		"marți",
		"miercuri",
		"joi",
		"vineri",
		"sâmbătă"
	],
	"field-zone": "zonă",
	"dateFormatItem-yyyyMM": "MM.yyyy",
	"dateFormatItem-y": "y",
	"months-standAlone-narrow": [
		"I",
		"F",
		"M",
		"A",
		"M",
		"I",
		"I",
		"A",
		"S",
		"O",
		"N",
		"D"
	],
	"dateFormatItem-yyMM": "MM.yy",
	"days-format-abbr": [
		"Du",
		"Lu",
		"Ma",
		"Mi",
		"Jo",
		"Vi",
		"Sâ"
	],
	"eraNames": [
		"înainte de Hristos",
		"după Hristos"
	],
	"days-format-narrow": [
		"D",
		"L",
		"M",
		"M",
		"J",
		"V",
		"S"
	],
	"field-month": "lună",
	"days-standAlone-narrow": [
		"D",
		"L",
		"M",
		"M",
		"J",
		"V",
		"S"
	],
	"dateFormatItem-MMM": "LLL",
	"dayPeriods-format-wide-am": "AM",
	"dateFormatItem-MMMMEd": "E, d MMMM",
	"dateFormat-short": "dd.MM.yyyy",
	"field-second": "secundă",
	"dateFormatItem-yMMMEd": "EEE, d MMM y",
	"field-week": "săptămână",
	"dateFormat-medium": "dd.MM.yyyy",
	"dateTimeFormat-short": "{1}, {0}",
	"dateFormatItem-MMMEEEd": "EEE, d MMM"
}
//end v1.x content
);
},
'dijit/nls/ro/loading':function(){
define(
//begin v1.x content
({
	loadingState: "Încărcare...",
	errorState: "Ne pare rău, a apărut o eroare "
})

//end v1.x content
);

},
'dojo/nls/ro/colors':function(){
define(
({
// local representation of all CSS3 named colors, companion to dojo.colors.  To be used where descriptive information
// is required for each color, such as a palette widget, and not for specifying color programatically.
	//Note: due to the SVG 1.0 spec additions, some of these are alternate spellings for the same color (e.g. gray / grey).
	//TODO: should we be using unique rgb values as keys instead and avoid these duplicates, or rely on the caller to do the reverse mapping?
	aliceblue: "alice blue",
	antiquewhite: "antique white",
	aqua: "aqua",
	aquamarine: "aquamarine",
	azure: "azuriu",
	beige: "bej",
	bisque: "bisque",
	black: "negru",
	blanchedalmond: "blanched almond",
	blue: "albastru",
	blueviolet: "albastru-violet",
	brown: "brun",
	burlywood: "burlywood",
	cadetblue: "albastru cadet",
	chartreuse: "chartreuse",
	chocolate: "ciocolată",
	coral: "coral",
	cornflowerblue: "cornflower blue",
	cornsilk: "cornsilk",
	crimson: "stacojiu",
	cyan: "cyan",
	darkblue: "albastru închis",
	darkcyan: "cyan închis",
	darkgoldenrod: "goldenrod închis",
	darkgray: "gri închis",
	darkgreen: "verde închis",
	darkgrey: "gri închis", // same as darkgray
	darkkhaki: "kaki închis",
	darkmagenta: "magenta închis",
	darkolivegreen: "verde măslină închis",
	darkorange: "portocaliu închis",
	darkorchid: "orchid închis",
	darkred: "roşu închis",
	darksalmon: "somon închis",
	darkseagreen: "verde marin închis",
	darkslateblue: "albastru ardezie închis",
	darkslategray: "gri ardezie închis",
	darkslategrey: "gri ardezie închis", // same as darkslategray
	darkturquoise: "turcoaz închis",
	darkviolet: "violet închis",
	deeppink: "roz profund",
	deepskyblue: "albastru cer profund",
	dimgray: "dim gray",
	dimgrey: "dim gray", // same as dimgray
	dodgerblue: "dodger blue",
	firebrick: "cărămiziu aprins",
	floralwhite: "floral white",
	forestgreen: "forest green",
	fuchsia: "fuchsia",
	gainsboro: "gainsboro",
	ghostwhite: "ghost white",
	gold: "auriu",
	goldenrod: "goldenrod",
	gray: "gri",
	green: "verde",
	greenyellow: "verde-gălbui",
	grey: "gri", // same as gray
	honeydew: "honeydew",
	hotpink: "roz aprins",
	indianred: "roşu indian",
	indigo: "indigo",
	ivory: "ivoriu",
	khaki: "kaki",
	lavender: "lavandă",
	lavenderblush: "lavender blush",
	lawngreen: "lawn green",
	lemonchiffon: "lemon chiffon",
	lightblue: "albastru deschis",
	lightcoral: "coral deschis",
	lightcyan: "cyan deschis",
	lightgoldenrodyellow: "goldenrod gălbui deschis",
	lightgray: "gri deschis",
	lightgreen: "verde dschis",
	lightgrey: "gri deschis", // same as lightgray
	lightpink: "roz deschis",
	lightsalmon: "somon deschis",
	lightseagreen: "verde marin deschis",
	lightskyblue: "albastru cer deschis",
	lightslategray: "gri ardezie deschis",
	lightslategrey: "gri ardezie deschis", // same as lightslategray
	lightsteelblue: "albastru metalic deschis",
	lightyellow: "galben deschis",
	lime: "lime",
	limegreen: "verde lime",
	linen: "linen",
	magenta: "magenta",
	maroon: "maro",
	mediumaquamarine: "aquamarin mediu",
	mediumblue: "albastru mediu",
	mediumorchid: "orchid mediu",
	mediumpurple: "purpuriu mediu",
	mediumseagreen: "verde marin mediu",
	mediumslateblue: "albastru ardezie mediu",
	mediumspringgreen: "verde primăvară mediu",
	mediumturquoise: "turcoaz mediu",
	mediumvioletred: "roşu-violet mediu",
	midnightblue: "midnight blue",
	mintcream: "mint cream",
	mistyrose: "misty rose",
	moccasin: "moccasin",
	navajowhite: "navajo white",
	navy: "navy",
	oldlace: "old lace",
	olive: "oliv",
	olivedrab: "oliv şters",
	orange: "portocaliu",
	orangered: "roşu portocaliu",
	orchid: "orchid",
	palegoldenrod: "goldenrod pal",
	palegreen: "verde pal",
	paleturquoise: "turcoaz pal",
	palevioletred: "roşu-violet pal",
	papayawhip: "papaya whip",
	peachpuff: "peach puff",
	peru: "peru",
	pink: "roz",
	plum: "plum",
	powderblue: "powder blue",
	purple: "purpuriu",
	red: "roşu",
	rosybrown: "rosy brown",
	royalblue: "albastru regal",
	saddlebrown: "saddle brown",
	salmon: "somon",
	sandybrown: "sandy brown",
	seagreen: "verde marin",
	seashell: "seashell",
	sienna: "sienna",
	silver: "argintiu",
	skyblue: "albastru cer",
	slateblue: "albastru ardezie",
	slategray: "gri ardezie",
	slategrey: "gri ardezie", // same as slategray
	snow: "zăpadă",
	springgreen: "verde primăvară",
	steelblue: "albastru metalic",
	tan: "tan",
	teal: "teal",
	thistle: "thistle",
	tomato: "tomato",
	transparent: "transparent",
	turquoise: "turcoaz",
	violet: "violet",
	wheat: "wheat",
	white: "alb",
	whitesmoke: "white smoke",
	yellow: "galben",
	yellowgreen: "verde gălbui"
})
);

},
'dojo/cldr/nls/ro/number':function(){
define(
//begin v1.x content
{
	"group": ".",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0%",
	"list": ";",
	"infinity": "∞",
	"patternDigit": "#",
	"minusSign": "-",
	"decimal": ",",
	"nan": "NaN",
	"nativeZeroDigit": "0",
	"perMille": "‰",
	"decimalFormat": "#,##0.###",
	"currencyFormat": "#,##0.00 ¤",
	"plusSign": "+"
}
//end v1.x content
);
},
'dijit/_editor/nls/ro/FontChoice':function(){
define(
"dijit/_editor/nls/ro/FontChoice", //begin v1.x content
({
	fontSize: "Dimensiune",
	fontName: "Font",
	formatBlock: "Format",

	serif: "serif",
	"sans-serif": "sans-serif",
	monospace: "monospace",
	cursive: "cursive",
	fantasy: "fantasy",

	noFormat: "Fără",
	p: "Paragraf",
	h1: "Titlu",
	h2: "Subtitlu",
	h3: "Sub-subtitlu",
	pre: "Preformatat",

	1: "xxs (xx-small)",
	2: "xs (x-small)",
	3: "s (small)",
	4: "m (medium)",
	5: "l (large)",
	6: "xl (x-large)",
	7: "xxl (xx-large)"
})

//end v1.x content
);

},
'dojo/cldr/nls/ro/currency':function(){
define(
//begin v1.x content
{
	"HKD_displayName": "dolar Hong Kong",
	"CHF_displayName": "franc elvețian",
	"CAD_displayName": "dolar canadian",
	"CNY_displayName": "yuan renminbi chinezesc",
	"AUD_displayName": "dolar australian",
	"JPY_displayName": "yen japonez",
	"USD_displayName": "dolar american",
	"GBP_displayName": "liră sterlină",
	"EUR_displayName": "euro"
}
//end v1.x content
);
},
'dijit/form/nls/ro/ComboBox':function(){
define(
//begin v1.x content
({
		previousMessage: "Alegeri anterioare",
		nextMessage: "Mai multe alegeri"
})

//end v1.x content
);

},
'dijit/nls/ro/common':function(){
define(
//begin v1.x content
({
	buttonOk: "OK",
	buttonCancel: "Anulare",
	buttonSave: "Salvare",
	itemClose: "Închidere"
})

//end v1.x content
);

},
'*noref':1}});
define("dijit/nls/dijit-all_ro", [], 1);
