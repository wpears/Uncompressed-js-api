require({cache:{
'esri/nls/fr/jsapi':function(){
﻿define(
({
  io: {
    proxyNotSet:"esri.config.defaults.io.proxyUrl n'est pas défini."
  },
  
  map: {
    deprecateReorderLayerString: "Map.reorderLayer(/*String*/ id, /*Number*/ index) obsolète. Utiliser Map.reorderLayer(/*Layer*/ layer, /*Number*/ index).",
    deprecateShiftDblClickZoom: "Map.(enable/disable)ShiftDoubleClickZoom obsolète. Le comportement de Shift-Double-Clic ne sera pas pris en compte."
  },

  geometry: {
    deprecateToScreenPoint:"esri.geometry.toScreenPoint obsolète. Utiliser esri.geometry.toScreenGeometry.",
    deprecateToMapPoint:"esri.geometry.toMapPoint obsolète. Utiliser esri.geometry.toMapGeometry."
  },

  layers: {
    tiled: {
      tileError:"Chargement de la tuile impossible"
    },
    
    dynamic: {
      imageError:"Chargement de l'image impossible"
    },
    
    graphics: {
      drawingError:"Affichage du graphique impossible "
    },

    agstiled: {
      deprecateRoundrobin:"Option de constructeur 'roundrobin' déconseillée. Utilisez l'option 'tileServers'."
    },

    imageParameters: {
      deprecateBBox:"Propriété 'bbox' déconseillée. Utilisez la propriété 'extent'."
    },
    
    FeatureLayer: {
      noOIDField: "objectIdField n'est pas défini [url: ${url}]",
      fieldNotFound: "le champ '${field}' est introuvable dans les informations 'fields' de la couche [url: ${url}]",
      noGeometryField: "impossible de trouver un champ de type 'esriFieldTypeGeometry' dans les informations 'fields' de la couche. Si vous utilisez une couche de service de carte, les entités n'auront pas de géométrie [url: ${url}]",
      invalidParams: "la requête contient un ou plusieurs paramètres non pris en charge",
      updateError: "une erreur est survenue lors de la mise à jour de la couche",
      
      createUserSeconds: "Créé par ${userId} il y a quelques secondes",
      createUserMinute: "Créé par ${userId} il y a une minute",
      editUserSeconds: "Modifié par ${userId} il y a quelques secondes",
      editUserMinute: "Modifié par ${userId} il y a une minute",
      createSeconds: "Créé il y a quelques secondes",
      createMinute: "Créé il y a une minute",
      editSeconds: "Modifié il y a quelques secondes",
      editMinute: "Modifié il y a une minute",
      
      createUserMinutes: "Créé par ${userId} il y a ${minutes} minutes",
      createUserHour: "Créé par ${userId} il y a une heure",
      createUserHours: "Créé par ${userId} il y a ${hours} heures",
      createUserWeekDay: "Créé par ${userId} ${weekDay} à ${formattedTime}",
      createUserFull: "Créé par ${userId} le ${formattedDate} à ${formattedTime}",
      
      editUserMinutes: "Modifié par ${userId} il y a ${minutes} minutes",
      editUserHour: "Modifié par ${userId} il y a une heure",
      editUserHours: "Modifié par ${userId} il y a ${hours} heures",
      editUserWeekDay: "Modifié par ${userId} ${weekDay} à ${formattedTime}",
      editUserFull: "Modifié par ${userId} le ${formattedDate} à ${formattedTime}",
      
      createUser: "Créé par ${userId}",
      editUser: "Modifié par ${userId}",
      
      createMinutes: "Créé il y a ${minutes} minutes",
      createHour: "Créé il y a une heure",
      createHours: "Créé il y a ${hours} heures",
      createWeekDay: "Créé ${weekDay} à ${formattedTime}",
      createFull: "Créé le ${formattedDate} à ${formattedTime}",
      
      editMinutes: "Modifié il y a ${minutes} minutes",
      editHour: "Modifié il y a une heure",
      editHours: "Modifié il y a ${hours} heures",
      editWeekDay: "Modifié ${weekDay} à ${formattedTime}",
      editFull: "Modifié le ${formattedDate} à ${formattedTime}"
    }
  },

  tasks: {
    gp: {
      gpDataTypeNotHandled:"Type de données GP non géré."
    },
        
    na: {
      route: {
        routeNameNotSpecified: "'RouteName' non spécifié pour au moins 1 arrêt dans le jeu d'entités des arrêts."
      }
    },
    
    query: {
      invalid: "Impossible d'exécuter la requête. Vérifiez vos paramètres."
    }
  },

  toolbars: {
    draw: {
      convertAntiClockwisePolygon: "Les polygones dessinés dans le sens anti-horaire seront inversés pour respecter le sens horaire.",
      addPoint: "Cliquez pour ajouter un point",
      addShape: "Cliquez pour ajouter une forme",
      addMultipoint: "Cliquez pour commencer à ajouter des points",
      freehand: "Appuyez pour commencer et relâchez pour terminer",
      start: "Cliquez pour commencer à dessiner",
      resume: "Cliquez pour continuer à dessiner",
      complete: "Double-cliquez pour exécuter",
      finish: "Double-cliquez pour terminer",
      invalidType: "Type de géométrie non pris en charge"
    },
    edit: {
      invalidType: "Impossible d'activer l'outil. Vérifiez que l'outil est valide pour le type de géométrie donné.",
      deleteLabel: "Supprimer"
    }
  },
  
  virtualearth: {
    // minMaxTokenDuration:"Token duration must be greater than 15 minutes and lesser than 480 minutes (8 hours).",
    
    vetiledlayer: {
      //tokensNotSpecified:"Either clientToken & serverToken must be provided or tokenUrl must be specified."
      bingMapsKeyNotSpecified: "BingMapsKey doit être indiqué."
    },
    
    vegeocode: {
      //tokensNotSpecified:"Either serverToken must be provided or tokenUrl must be specified.",
      bingMapsKeyNotSpecified: "BingMapsKey doit être indiqué.",
      requestQueued: "Impossible de récupérer le jeton du serveur. Mise en file d'attente de la requête à exécuter une fois le jeton récupéré du serveur."
    }
  },
  widgets: {
    attributeInspector: {
      NLS_first: "Premier",
      NLS_previous: "Précédente",
      NLS_next: "Suivante",
      NLS_last: "Dernier",
      NLS_deleteFeature: "Supprimer",
      NLS_title: "Modifier des attributs",
      NLS_errorInvalid: "Non valide",
      NLS_validationInt: "La valeur doit être un nombre entier.",
      NLS_validationFlt: "La valeur doit être un nombre réel.",
      NLS_of: "de",
      NLS_noFeaturesSelected: "Aucune entité sélectionnée"
    },
    overviewMap: {
      NLS_drag: "Faites glisser le curseur pour modifier l'étendue de la carte",
      NLS_show: "Afficher la vue d'ensemble de la carte",
      NLS_hide: "Masquer la vue d'ensemble de la carte",
      NLS_maximize: "Agrandir",
      NLS_restore: "Restaurer",
      NLS_noMap: "'map' introuvable dans les paramètres en entrée",
      NLS_noLayer: "carte principale sans couche de base",
      NLS_invalidSR: "la référence spatiale de la couche donnée n'est pas compatible avec la carte principale",
      NLS_invalidType: "type de couche non pris en charge. Les types valides sont 'TiledMapServiceLayer' et 'DynamicMapServiceLayer'"
    },
    timeSlider: {
      NLS_first: "Premier",
      NLS_previous: "Précédente",
      NLS_next: "Suivante",
      NLS_play: "Lecture/Pause",
      NLS_invalidTimeExtent: "TimeExtent non précisé ou le format est incorrect."
    },
    attachmentEditor: {
      NLS_attachments: "Pièces jointes :",
      NLS_add: "Ajouter",
      NLS_none: "Aucune"
    },
    editor: {
      tools: {
        NLS_attributesLbl: "Attributs",
        NLS_cutLbl: "Couper",
        NLS_deleteLbl: "Supprimer",
        NLS_extentLbl: "Etendue",
        NLS_freehandPolygonLbl: "Polygone à main levée",
        NLS_freehandPolylineLbl: "Polyligne à main levée",
        NLS_pointLbl: "Point",
        NLS_polygonLbl: "Polygone",
        NLS_polylineLbl: "Polyligne",
        NLS_reshapeLbl: "Remodeler",
        NLS_selectionNewLbl: "Nouvelle sélection",
        NLS_selectionAddLbl: "Ajouter à la sélection",
        NLS_selectionClearLbl: "Effacer la sélection",
        NLS_selectionRemoveLbl: "Soustraire de la sélection",
        NLS_selectionUnionLbl: "Agréger",
        NLS_autoCompleteLbl: "Automatique",
        NLS_unionLbl: "Agréger",
        NLS_rectangleLbl: "Rectangle",
        NLS_circleLbl: "Cercle",
        NLS_ellipseLbl: "Ellipse",
        NLS_triangleLbl: "Triangle",
        NLS_arrowLbl: "Flèche",
        NLS_arrowLeftLbl: "Flèche gauche",
        NLS_arrowUpLbl: "Flèche haut",
        NLS_arrowDownLbl: "Flèche bas",
        NLS_arrowRightLbl: "Flèche droite",
        NLS_undoLbl: "Annuler",
        NLS_redoLbl: "Répéter"
      }
    },
    legend: {
      NLS_creatingLegend: "Création de la légende",
      NLS_noLegend: "Pas de légende"
    },
    popup: {
      NLS_moreInfo: "Plus d’infos",
      NLS_searching: "Recherche",
      NLS_prevFeature: "Entité précédente",
      NLS_nextFeature: "Entité suivante",
      NLS_close: "Fermer",
      NLS_prevMedia: "Support précédent",
      NLS_nextMedia: "Support suivant",
      NLS_noInfo: "Aucune information n'est disponible",
      NLS_noAttach: "Aucune pièce jointe n'a été trouvée",
      NLS_maximize: "Agrandir",
      NLS_restore: "Restaurer",
      NLS_zoomTo: "Zoom sur",
      NLS_pagingInfo: "(${index} de ${total})",
      NLS_attach: "Pièces jointes"
    },
    measurement: {
      NLS_distance: "Distance",
      NLS_area: "Surface",
      NLS_location: "Emplacement",
      NLS_resultLabel: "Résultat de la mesure",
      NLS_length_miles: "Miles",
      NLS_length_kilometers: "Kilomètres",
      NLS_length_feet: "Pieds",
      NLS_length_meters: "Mètres",
      NLS_length_yards: "Yards",
      NLS_area_acres: "Acres",
      NLS_area_sq_miles: "Miles carrés",
      NLS_area_sq_kilometers: "Kilomètres carrés",
      NLS_area_hectares: "Hectares",
      NLS_area_sq_yards: "Yards carrés",
      NLS_area_sq_feet: "Pieds carrés",
      NLS_area_sq_meters: "Mètres carrés",
      NLS_deg_min_sec: "DMS",
      NLS_decimal_degrees: "Degrés",
      NLS_longitude: "Longitude",
      NLS_latitude: "Latitude"
    },
    bookmarks: {
      NLS_add_bookmark: "Ajouter un géosignet",
      NLS_new_bookmark: "Sans titre",
      NLS_bookmark_edit: "Modifier",
      NLS_bookmark_remove: "Supprimer"
    },
    print: {
      NLS_print: "Imprimer",
      NLS_printing: "Impression en cours",
      NLS_printout: "Impression"
    },
    templatePicker: {
      creationDisabled: "La création d´entités est désactivée pour toutes les couches.",
      loading: "Chargement en cours..."
    }
  },
  arcgis: {
    utils: {
      baseLayerError: "Chargement de la couche de fond de carte impossible",
      geometryServiceError: "Fournissez un service de géométrie pour ouvrir une carte Web."
    }
  },
  
  identity: {
    lblItem: "élément",
    title: "Se connecter",
    info: "Veuillez vous connecter pour accéder à l´élément sur ${server} ${resource}",
    lblUser: "Nom d´utilisateur :",
    lblPwd: "Mot de passe :",
    lblOk: "OK",
    lblSigning: "Connexion…",
    lblCancel: "Annuler",
    errorMsg: "Nom d'utilisateur/mot de passe non valides. Réessayez.",
    invalidUser: "Le nom d’utilisateur ou le mot de passe que vous avez entré est incorrect.",
    forbidden: "Le nom d’utilisateur et le mot de passe sont valides, mais vous n’êtes pas autorisé à accéder cette ressource.",
    noAuthService: "Impossible d’accéder au service d’authentification."
  }
})
);
},
'esri/nls/fr-fr/jsapi':function(){
define('esri/nls/fr-fr/jsapi',{});
},
'dojo/cldr/nls/fr/gregorian':function(){
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
	"field-weekday": "jour de la semaine",
	"dateFormatItem-yyQQQQ": "QQQQ yy",
	"dateFormatItem-yQQQ": "QQQ y",
	"dateFormatItem-yMEd": "EEE d/M/yyyy",
	"dateFormatItem-MMMEd": "E d MMM",
	"eraNarrow": [
		"av. J.-C.",
		"ap. J.-C."
	],
	"dayPeriods-format-wide-morning": "matin",
	"dateFormatItem-MMMdd": "dd MMM",
	"dateFormat-long": "d MMMM y",
	"months-format-wide": [
		"janvier",
		"février",
		"mars",
		"avril",
		"mai",
		"juin",
		"juillet",
		"août",
		"septembre",
		"octobre",
		"novembre",
		"décembre"
	],
	"dayPeriods-format-wide-pm": "PM",
	"dateFormat-full": "EEEE d MMMM y",
	"dateFormatItem-Md": "d/M",
	"dayPeriods-format-wide-noon": "midi",
	"field-era": "ère",
	"dateFormatItem-yM": "M/yyyy",
	"months-standAlone-wide": [
		"janvier",
		"février",
		"mars",
		"avril",
		"mai",
		"juin",
		"juillet",
		"août",
		"septembre",
		"octobre",
		"novembre",
		"décembre"
	],
	"timeFormat-short": "HH:mm",
	"quarters-format-wide": [
		"1er trimestre",
		"2e trimestre",
		"3e trimestre",
		"4e trimestre"
	],
	"timeFormat-long": "HH:mm:ss z",
	"field-year": "année",
	"dateFormatItem-yMMM": "MMM y",
	"dateFormatItem-yQ": "'T'Q y",
	"dateFormatItem-yyyyMMMM": "MMMM y",
	"field-hour": "heure",
	"dateFormatItem-MMdd": "dd/MM",
	"months-format-abbr": [
		"janv.",
		"févr.",
		"mars",
		"avr.",
		"mai",
		"juin",
		"juil.",
		"août",
		"sept.",
		"oct.",
		"nov.",
		"déc."
	],
	"dateFormatItem-yyQ": "'T'Q yy",
	"timeFormat-full": "HH:mm:ss zzzz",
	"field-day-relative+0": "aujourd’hui",
	"field-day-relative+1": "demain",
	"field-day-relative+2": "après-demain",
	"field-day-relative+3": "après-après-demain",
	"months-standAlone-abbr": [
		"janv.",
		"févr.",
		"mars",
		"avr.",
		"mai",
		"juin",
		"juil.",
		"août",
		"sept.",
		"oct.",
		"nov.",
		"déc."
	],
	"quarters-format-abbr": [
		"T1",
		"T2",
		"T3",
		"T4"
	],
	"quarters-standAlone-wide": [
		"1er trimestre",
		"2e trimestre",
		"3e trimestre",
		"4e trimestre"
	],
	"dateFormatItem-M": "L",
	"days-standAlone-wide": [
		"dimanche",
		"lundi",
		"mardi",
		"mercredi",
		"jeudi",
		"vendredi",
		"samedi"
	],
	"dateFormatItem-yyMMMEEEd": "EEE d MMM yy",
	"dateFormatItem-yyMMM": "MMM yy",
	"timeFormat-medium": "HH:mm:ss",
	"dateFormatItem-Hm": "HH:mm",
	"quarters-standAlone-abbr": [
		"T1",
		"T2",
		"T3",
		"T4"
	],
	"eraAbbr": [
		"av. J.-C.",
		"ap. J.-C."
	],
	"field-minute": "minute",
	"field-dayperiod": "cadran",
	"days-standAlone-abbr": [
		"dim.",
		"lun.",
		"mar.",
		"mer.",
		"jeu.",
		"ven.",
		"sam."
	],
	"dayPeriods-format-wide-night": "soir",
	"dateFormatItem-yyMMMd": "d MMM yy",
	"dateFormatItem-d": "d",
	"dateFormatItem-ms": "mm:ss",
	"quarters-format-narrow": [
		"T1",
		"T2",
		"T3",
		"T4"
	],
	"field-day-relative+-1": "hier",
	"field-day-relative+-2": "avant-hier",
	"field-day-relative+-3": "avant-avant-hier",
	"dateFormatItem-MMMd": "d MMM",
	"dateFormatItem-MEd": "EEE d/M",
	"field-day": "jour",
	"days-format-wide": [
		"dimanche",
		"lundi",
		"mardi",
		"mercredi",
		"jeudi",
		"vendredi",
		"samedi"
	],
	"field-zone": "fuseau horaire",
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
	"dateFormatItem-yyMM": "MM/yy",
	"days-format-abbr": [
		"dim.",
		"lun.",
		"mar.",
		"mer.",
		"jeu.",
		"ven.",
		"sam."
	],
	"eraNames": [
		"avant Jésus-Christ",
		"après Jésus-Christ"
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
	"field-month": "mois",
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
	"dateFormatItem-MMMMEd": "EEE d MMMM",
	"dateFormat-short": "dd/MM/yy",
	"dateFormatItem-MMd": "d/MM",
	"dayPeriods-format-wide-afternoon": "après-midi",
	"field-second": "seconde",
	"dateFormatItem-yMMMEd": "EEE d MMM y",
	"dateFormatItem-Ed": "E d",
	"field-week": "semaine",
	"dateFormat-medium": "d MMM y",
	"dateFormatItem-Hms": "HH:mm:ss"
}
//end v1.x content
);
},
'dojo/cldr/nls/fr-fr/gregorian':function(){
define('dojo/cldr/nls/fr-fr/gregorian',{});
},
'dojo/cldr/nls/fr/number':function(){
define(
//begin v1.x content
{
	"group": " ",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0 %",
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
'dojo/cldr/nls/fr-fr/number':function(){
define('dojo/cldr/nls/fr-fr/number',{});
},
'*noref':1}});
define("esri/nls/jsapi_fr-fr", [], 1);
