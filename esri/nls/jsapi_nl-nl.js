require({cache:{
'esri/nls/nl/jsapi':function(){
﻿define(
({
  io: {
    proxyNotSet:"esri.config.defaults.io.proxyUrl is niet ingesteld."
  },
  
  map: {
    deprecateReorderLayerString: "Map.reorderLayer(/*String*/ id, /*Number*/ index) afgeschaft. Gebruik Map.reorderLayer(/*Layer*/ layer, /*Number*/ index).",
    deprecateShiftDblClickZoom: "Map.(enable/disable)ShiftDoubleClickZoom afgeschaft. Shift-Double-Click zoom behavior wordt niet ondersteund."
  },

  geometry: {
    deprecateToScreenPoint:"esri.geometry.toScreenPoint afgeschadt. Gebruik esri.geometry.toScreenGeometry.",
    deprecateToMapPoint:"esri.geometry.toMapPoint afgeschaft. Gebruik esri.geometry.toMapGeometry."
  },

  layers: {
    tiled: {
      tileError:"Kan tile niet laden"
    },
    
    dynamic: {
      imageError:"Kan afbeelding niet laden"
    },
    
    graphics: {
      drawingError:"Kan grafische afbeelding niet tekenen "
    },

    agstiled: {
      deprecateRoundrobin:"Constructoroptie \'roundrobin\' afgeschaft. Gebruik optie \'tileServers\'."
    },

    imageParameters: {
      deprecateBBox:"Eigenschap \'bbox\' afgeschaft. Gebruik eigenschap \'extent\'."
    },
    
    FeatureLayer: {
      noOIDField: "objectIdField is niet ingesteld [url: ${url}]",
      fieldNotFound: "Kan het veld \'${field}\' niet vinden in de informatie \'fields\' van de laag [url: ${url}]",
      noGeometryField: "kan een veld van het type \'esriFieldTypeGeometry\' niet vinden in de informatie \'fields\' van de laag. Als u een mapservicelaag gebruikt, beschikken objecten niet over geometrie [url: ${url}]",
      invalidParams: "query bevat een of meer niet-ondersteunde parameters",
      updateError: "er is een fout opgetreden tijdens het bijwerken van de laag",
      
      createUserSeconds: "Een paar seconden geleden gemaakt door ${userId}",
      createUserMinute: "Een minuut geleden gemaakt door ${userId}",
      editUserSeconds: "Een paar seconden geleden bewerkt door ${userId}",
      editUserMinute: "Een minuut geleden bewerkt door ${userId}",
      createSeconds: "Een paar seconden geleden gemaakt",
      createMinute: "Een minuut geleden gemaakt",
      editSeconds: "Een paar seconden geleden bewerkt",
      editMinute: "Een minuut geleden bewerkt",
      
      createUserMinutes: "${minutes} minuten geleden gemaakt door ${userId}",
      createUserHour: "Een uur geleden gemaakt door ${userId}",
      createUserHours: "${hours} uur geleden gemaakt door ${userId}",
      createUserWeekDay: "Gemaakt door ${userId} op ${weekDay} om ${formattedTime}",
      createUserFull: "Gemaakt door ${userId} op ${formattedDate} om ${formattedTime}",
      
      editUserMinutes: "${minutes} minuten geleden bewerkt door ${userId}",
      editUserHour: "Een uur geleden bewerkt door ${userId}",
      editUserHours: "${hours} uur geleden bewerkt door ${userId}",
      editUserWeekDay: "Bewerkt door ${userId} op ${weekDay} om ${formattedTime}",
      editUserFull: "Bewerkt door ${userId} op ${formattedDate} om ${formattedTime}",
      
      createUser: "Gemaakt door ${userId}",
      editUser: "Bewerkt door ${userId}",
      
      createMinutes: "${minutes} minuten geleden gemaakt",
      createHour: "Een uur geleden gemaakt",
      createHours: "${hours} uur geleden gemaakt",
      createWeekDay: "Gemaakt op ${weekDay} om ${formattedTime}",
      createFull: "Gemaakt op ${formattedDate} op ${formattedTime}",
      
      editMinutes: "${minutes} minuten geleden bewerkt",
      editHour: "Een uur geleden bewerkt",
      editHours: "${hours} uur geleden bewerkt",
      editWeekDay: "Bewerkt op ${weekDay} om ${formattedTime}",
      editFull: "Bewerkt op ${formattedDate} om ${formattedTime}"
    }
  },

  tasks: {
    gp: {
      gpDataTypeNotHandled:"GP-datatype niet afgehandeld."
    },
        
    na: {
      route: {
        routeNameNotSpecified: "\'RouteName\' niet opgegeven voor minstens 1 stop in FeatureSet van stops."
      }
    },
    
    query: {
      invalid: "Kan query niet uitvoeren. Controleer de parameters."
    }
  },

  toolbars: {
    draw: {
      convertAntiClockwisePolygon: "Polygonen die tegen de klok zijn getekend, worden omgekeerd met de klok mee.",
      addPoint: "Klik om een punt toe te voegen",
      addShape: "Klik om een vorm toe te voegen",
      addMultipoint: "Klik om punten te beginnen toe te voegen",
      freehand: "Druk om te starten en laat los om te stoppen",
      start: "Klik om te beginnen met tekenen",
      resume: "Klik om door te gaan met tekenen",
      complete: "Dubbelklik om te voltooien",
      finish: "Dubbelklik om te stoppen",
      invalidType: "Niet-ondersteund geometrietype"
    },
    edit: {
      invalidType: "Kan de tool niet activeren. Controleer of de tool geldig is voor het opgegeven geometrietype.",
      deleteLabel: "Verwijderen"
    }
  },
  
  virtualearth: {
    // minMaxTokenDuration:"Token duration must be greater than 15 minutes and lesser than 480 minutes (8 hours).",
    
    vetiledlayer: {
      //tokensNotSpecified:"Either clientToken & serverToken must be provided or tokenUrl must be specified."
      bingMapsKeyNotSpecified: "BingMapsKey moet worden opgegeven."
    },
    
    vegeocode: {
      //tokensNotSpecified:"Either serverToken must be provided or tokenUrl must be specified.",
      bingMapsKeyNotSpecified: "BingMapsKey moet worden opgegeven.",
      requestQueued: "Servertoken is niet opgehaald. Aanvraag wordt in de wachtrij geplaatst en uitgevoerd nadat de servertoken is opgehaald."
    }
  },
  widgets: {
    attributeInspector: {
      NLS_first: "Eerste",
      NLS_previous: "Vorige",
      NLS_next: "Volgende",
      NLS_last: "Laatste",
      NLS_deleteFeature: "Verwijderen",
      NLS_title: "Attributen bewerken",
      NLS_errorInvalid: "Ongeldig",
      NLS_validationInt: "Waarde moet een integer zijn.",
      NLS_validationFlt: "Waarde moet zwevend zijn.",
      NLS_of: "van",
      NLS_noFeaturesSelected: "Geen objecten geselecteerd."
    },
    overviewMap: {
      NLS_drag: "Slepen om de afmetingen van de kaart te wijzigen",
      NLS_show: "Kaartoverzicht tonen",
      NLS_hide: "Kaartoverzicht verbergen",
      NLS_maximize: "Maximaliseren",
      NLS_restore: "Verkleinen",
      NLS_noMap: "'map' niet gevonden in invoerparameters",
      NLS_noLayer: "hoofdkaart heeft geen basislaag",
      NLS_invalidSR: "ruimtelijke referentie van de opgegeven laag is niet compatibel met de hoofdkaart",
      NLS_invalidType: "niet-ondersteund laagtype. Geldige types zijn \'TiledMapServiceLayer\' en \'DynamicMapServiceLayer\'"
    },
    timeSlider: {
      NLS_first: "Eerste",
      NLS_previous: "Vorige",
      NLS_next: "Volgende",
      NLS_play: "Afspelen/Pauzeren",
      NLS_invalidTimeExtent: "TimeExtent is niet opgegeven of in een onjuiste indeling."
    },
    attachmentEditor: {
      NLS_attachments: "Bijlagen:",
      NLS_add: "Toevoegen",
      NLS_none: "Geen"
    },
    editor: {
      tools: {
        NLS_attributesLbl: "Attributen",
        NLS_cutLbl: "Knippen",
        NLS_deleteLbl: "Verwijderen",
        NLS_extentLbl: "Afmetingen",
        NLS_freehandPolygonLbl: "Vlak in vrije stijl",
        NLS_freehandPolylineLbl: "Polylijn in vrije stijl",
        NLS_pointLbl: "Punt",
        NLS_polygonLbl: "Polygoon",
        NLS_polylineLbl: "Polylijn",
        NLS_reshapeLbl: "Vorm wijzigen",
        NLS_selectionNewLbl: "Nieuwe selectie",
        NLS_selectionAddLbl: "Toevoegen aan selectie",
        NLS_selectionClearLbl: "Selectie wissen",
        NLS_selectionRemoveLbl: "Aftrekken van selectie",
        NLS_selectionUnionLbl: "Samenvoegen",
        NLS_autoCompleteLbl: "Automatisch voltooien",
        NLS_unionLbl: "Samenvoegen",
        NLS_rectangleLbl: "Rechthoek",
        NLS_circleLbl: "Cirkel",
        NLS_ellipseLbl: "Ellips",
        NLS_triangleLbl: "Driehoek",
        NLS_arrowLbl: "Pijl",
        NLS_arrowLeftLbl: "Pijl-links",
        NLS_arrowUpLbl: "Pijl-omhoog",
        NLS_arrowDownLbl: "Pijl-omlaag",
        NLS_arrowRightLbl: "Pijl-rechts",
        NLS_undoLbl: "Ongedaan maken",
        NLS_redoLbl: "Opnieuw uitvoeren"
      }
    },
    legend: {
      NLS_creatingLegend: "Legenda maken",
      NLS_noLegend: "Geen legenda"
    },
    popup: {
      NLS_moreInfo: "Meer informatie",
      NLS_searching: "Zoeken",
      NLS_prevFeature: "Vorig object",
      NLS_nextFeature: "Volgend object",
      NLS_close: "Sluiten",
      NLS_prevMedia: "Vorige media",
      NLS_nextMedia: "Volgende media",
      NLS_noInfo: "Geen informatie beschikbaar",
      NLS_noAttach: "Geen bijlagen gevonden",
      NLS_maximize: "Maximaliseren",
      NLS_restore: "Verkleinen",
      NLS_zoomTo: "Zoomen naar",
      NLS_pagingInfo: "(${index} van ${total})",
      NLS_attach: "Bijlagen"
    },
    measurement: {
      NLS_distance: "Afstand",
      NLS_area: "Oppervlakte",
      NLS_location: "Locatie",
      NLS_resultLabel: "Meetresultaat",
      NLS_length_miles: "Mijl",
      NLS_length_kilometers: "Kilometer",
      NLS_length_feet: "Voet",
      NLS_length_meters: "Meter",
      NLS_length_yards: "Yard",
      NLS_area_acres: "Hectare",
      NLS_area_sq_miles: "Vierkante mile",
      NLS_area_sq_kilometers: "Vierkante kilometer",
      NLS_area_hectares: "Hectare",
      NLS_area_sq_yards: "Vierkante yard",
      NLS_area_sq_feet: "Vierkante voet",
      NLS_area_sq_meters: "Vierkante meter",
      NLS_deg_min_sec: "DMS",
      NLS_decimal_degrees: "Graden",
      NLS_longitude: "Lengtegraad",
      NLS_latitude: "Breedtegraad"
    },
    bookmarks: {
      NLS_add_bookmark: "Bladwijzer toevoegen",
      NLS_new_bookmark: "Naamloos",
      NLS_bookmark_edit: "Bewerken",
      NLS_bookmark_remove: "Verwijderen"
    },
    print: {
      NLS_print: "Afdrukken",
      NLS_printing: "Afdrukken",
      NLS_printout: "Afdruk"
    },
    templatePicker: {
      creationDisabled: "Het maken van objecten is uitgeschakeld voor alle lagen.",
      loading: "Laden.."
    }
  },
  arcgis: {
    utils: {
      baseLayerError: "Kan de basiskaartlaag niet laden",
      geometryServiceError: "Geef een geometrieservice op om Webmap te openen."
    }
  },
  
  identity: {
    lblItem: "item",
    title: "Aanmelden",
    info: "Meld u aan om toegang te krijgen tot het item op ${server} ${resource}",
    lblUser: "Gebruikersnaam:",
    lblPwd: "Wachtwoord:",
    lblOk: "OK",
    lblSigning: "Aanmelden...",
    lblCancel: "Annuleren",
    errorMsg: "Ongeldige gebruikersnaam/ongeldig wachtwoord. Probeer het opnieuw.",
    invalidUser: "De ingevoerde gebruikersnaam of het ingevoerde wachtwoord is ongeldig.",
    forbidden: "De gebruikersnaam en het wachtwoord zijn geldig, maar u hebt geen toegang tot deze resource.",
    noAuthService: "Kan geen toegang krijgen tot de verificatieservice."
  }
})
);
},
'esri/nls/nl-nl/jsapi':function(){
define('esri/nls/nl-nl/jsapi',{});
},
'dojo/cldr/nls/nl/gregorian':function(){
define(
//begin v1.x content
{
	"months-format-narrow": [
		"J",
		"F",
		"M",
		"A",
		"M",
		"J",
		"J",
		"A",
		"S",
		"O",
		"N",
		"D"
	],
	"field-weekday": "Dag van de week",
	"dateFormatItem-yyQQQQ": "QQQQ yy",
	"dateFormatItem-yQQQ": "QQQ y",
	"dateFormatItem-yMEd": "EEE d-M-y",
	"dateFormatItem-MMMEd": "E d MMM",
	"eraNarrow": [
		"v. Chr.",
		"n. Chr."
	],
	"dateFormat-long": "d MMMM y",
	"months-format-wide": [
		"januari",
		"februari",
		"maart",
		"april",
		"mei",
		"juni",
		"juli",
		"augustus",
		"september",
		"oktober",
		"november",
		"december"
	],
	"dayPeriods-format-wide-pm": "PM",
	"dateFormat-full": "EEEE d MMMM y",
	"dateFormatItem-Md": "d-M",
	"field-era": "Tijdperk",
	"dateFormatItem-yM": "M-y",
	"months-standAlone-wide": [
		"januari",
		"februari",
		"maart",
		"april",
		"mei",
		"juni",
		"juli",
		"augustus",
		"september",
		"oktober",
		"november",
		"december"
	],
	"timeFormat-short": "HH:mm",
	"quarters-format-wide": [
		"1e kwartaal",
		"2e kwartaal",
		"3e kwartaal",
		"4e kwartaal"
	],
	"timeFormat-long": "HH:mm:ss z",
	"field-year": "Jaar",
	"dateFormatItem-yMMM": "MMM y",
	"dateFormatItem-yQ": "Q yyyy",
	"dateFormatItem-yyyyMMMM": "MMMM y",
	"field-hour": "Uur",
	"dateFormatItem-MMdd": "dd-MM",
	"months-format-abbr": [
		"jan.",
		"feb.",
		"mrt.",
		"apr.",
		"mei",
		"jun.",
		"jul.",
		"aug.",
		"sep.",
		"okt.",
		"nov.",
		"dec."
	],
	"dateFormatItem-yyQ": "Q yy",
	"timeFormat-full": "HH:mm:ss zzzz",
	"field-day-relative+0": "vandaag",
	"field-day-relative+1": "morgen",
	"field-day-relative+2": "overmorgen",
	"field-day-relative+3": "overovermorgen",
	"months-standAlone-abbr": [
		"jan.",
		"feb.",
		"mrt.",
		"apr.",
		"mei",
		"jun.",
		"jul.",
		"aug.",
		"sep.",
		"okt.",
		"nov.",
		"dec."
	],
	"quarters-format-abbr": [
		"K1",
		"K2",
		"K3",
		"K4"
	],
	"quarters-standAlone-wide": [
		"1e kwartaal",
		"2e kwartaal",
		"3e kwartaal",
		"4e kwartaal"
	],
	"dateFormatItem-M": "L",
	"days-standAlone-wide": [
		"zondag",
		"maandag",
		"dinsdag",
		"woensdag",
		"donderdag",
		"vrijdag",
		"zaterdag"
	],
	"dateFormatItem-MMMMd": "d MMMM",
	"dateFormatItem-yyMMM": "MMM yy",
	"timeFormat-medium": "HH:mm:ss",
	"dateFormatItem-Hm": "HH:mm",
	"quarters-standAlone-abbr": [
		"K1",
		"K2",
		"K3",
		"K4"
	],
	"eraAbbr": [
		"v. Chr.",
		"n. Chr."
	],
	"field-minute": "Minuut",
	"field-dayperiod": "AM/PM",
	"days-standAlone-abbr": [
		"zo",
		"ma",
		"di",
		"wo",
		"do",
		"vr",
		"za"
	],
	"dateFormatItem-d": "d",
	"dateFormatItem-ms": "mm:ss",
	"field-day-relative+-1": "gisteren",
	"field-day-relative+-2": "eergisteren",
	"field-day-relative+-3": "eereergisteren",
	"dateFormatItem-MMMd": "d-MMM",
	"dateFormatItem-MEd": "E d-M",
	"field-day": "Dag",
	"days-format-wide": [
		"zondag",
		"maandag",
		"dinsdag",
		"woensdag",
		"donderdag",
		"vrijdag",
		"zaterdag"
	],
	"field-zone": "Zone",
	"dateFormatItem-y": "y",
	"months-standAlone-narrow": [
		"J",
		"F",
		"M",
		"A",
		"M",
		"J",
		"J",
		"A",
		"S",
		"O",
		"N",
		"D"
	],
	"dateFormatItem-yyMM": "MM-yy",
	"days-format-abbr": [
		"zo",
		"ma",
		"di",
		"wo",
		"do",
		"vr",
		"za"
	],
	"eraNames": [
		"Voor Christus",
		"na Christus"
	],
	"days-format-narrow": [
		"Z",
		"M",
		"D",
		"W",
		"D",
		"V",
		"Z"
	],
	"field-month": "Maand",
	"days-standAlone-narrow": [
		"Z",
		"M",
		"D",
		"W",
		"D",
		"V",
		"Z"
	],
	"dateFormatItem-MMM": "LLL",
	"dayPeriods-format-wide-am": "AM",
	"dateFormat-short": "dd-MM-yy",
	"dateFormatItem-MMd": "d-MM",
	"field-second": "Seconde",
	"dateFormatItem-yMMMEd": "EEE d MMM y",
	"dateFormatItem-Ed": "E d",
	"field-week": "Week",
	"dateFormat-medium": "d MMM y"
}
//end v1.x content
);
},
'dojo/cldr/nls/nl-nl/gregorian':function(){
define('dojo/cldr/nls/nl-nl/gregorian',{});
},
'dojo/cldr/nls/nl/number':function(){
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
	"currencyFormat": "¤ #,##0.00;¤ #,##0.00-",
	"plusSign": "+"
}
//end v1.x content
);
},
'dojo/cldr/nls/nl-nl/number':function(){
define('dojo/cldr/nls/nl-nl/number',{});
},
'*noref':1}});
define("esri/nls/jsapi_nl-nl", [], 1);
