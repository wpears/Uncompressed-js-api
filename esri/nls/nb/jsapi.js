//>>built
define(
"esri/nls/nb/jsapi", ({
  io: {
    proxyNotSet:"esri.config.defaults.io.proxyUrl er ikke angitt."
  },
  
  map: {
    deprecateReorderLayerString: "Map.reorderLayer(/*String*/ id, /*Number*/ index) frar�des. Bruk Map.reorderLayer(/*Layer*/ layer, /*Number*/ index).",
    deprecateShiftDblClickZoom: "Map.(enable/disable)ShiftDoubleClickZoom frar�des. Skift-dobbeltklikk-zoom vil ikke st�ttes."
  },

  geometry: {
    deprecateToScreenPoint:"esri.geometry.toScreenPoint frar�des. Bruk esri.geometry.toScreenGeometry.",
    deprecateToMapPoint:"esri.geometry.toMapPoint frar�des. Bruk esri.geometry.toMapGeometry."
  },

  layers: {
    tiled: {
      tileError:"Kan ikke laste flis"
    },
    
    dynamic: {
      imageError:"Kan ikke laste bilde"
    },
    
    graphics: {
      drawingError:"Kan ikke tegne grafikk "
    },

    agstiled: {
      deprecateRoundrobin:"Konstrukt�ralternativ 'roundrobin' frar�des. Bruk alternativet 'tileServers'."
    },

    imageParameters: {
      deprecateBBox:"Egenskap 'bbox' frar�des. Bruk egenskapen 'extent'."
    },
    
    FeatureLayer: {
      noOIDField: "objectIdField er ikke angitt [url: ${url}]",
      fieldNotFound: "finner ikke '${field}'-feltet i lagets 'fields'-informasjon [url: ${url}]",
      noGeometryField: "finner ikke et felt av typen 'esriFieldTypeGeometry' i laget 'fields'-informasjon. Hvis du bruker et karttjenestelag, vil ikke funksjoner ha geometri [url: ${url}]",
      invalidParams: "sp�rring inneholder �n eller flere parametere som ikke st�ttes",
      updateError: "det oppstod en feil under oppdatering av laget",
      
      createUserSeconds: "Opprettet av ${userId} for sekunder siden",
      createUserMinute: "Opprettet av ${userId} for et minutt siden",
      editUserSeconds: "Redigert av ${userId} for sekunder siden",
      editUserMinute: "Redigert av ${userId} for et minutt siden",
      createSeconds: "Opprettet for sekunder siden",
      createMinute: "Opprettet for et minutt siden",
      editSeconds: "Redigert for sekunder siden",
      editMinute: "Redigert for et minutt siden",
      
      createUserMinutes: "Opprettet av ${userId} for ${minutes} minutter siden",
      createUserHour: "Opprettet av ${userId} for en time siden",
      createUserHours: "Opprettet av ${userId} for ${hours} timer siden",
      createUserWeekDay: "Opprettet av ${userId} ${weekDay} ${formattedTime}",
      createUserFull: "Opprettet av ${userId} ${formattedDate} ${formattedTime}",
      
      editUserMinutes: "Redigert av ${userId} for ${minutes} minutter siden",
      editUserHour: "Redigert av ${userId} for en time siden",
      editUserHours: "Redigert av ${userId} for ${hours} timer siden",
      editUserWeekDay: "Redigert av ${userId} ${weekDay} ${formattedTime}",
      editUserFull: "Redigert av ${userId} ${formattedDate} ${formattedTime}",
      
      createUser: "Opprettet av ${userId}",
      editUser: "Redigert av ${userId}",
      
      createMinutes: "Opprettet for ${minutes} minutter siden",
      createHour: "Opprettet for en time siden",
      createHours: "Opprettet for ${hours} timer siden",
      createWeekDay: "Opprettet ${weekDay} ${formattedTime}",
      createFull: "Opprettet ${formattedDate} ${formattedTime}",
      
      editMinutes: "Redigert for ${minutes} minutter siden",
      editHour: "Redigert for en time siden",
      editHours: "Redigert for ${hours} timer siden",
      editWeekDay: "Redigert ${weekDay} ${formattedTime}",
      editFull: "Redigert ${formattedDate} ${formattedTime}"
    }
  },

  tasks: {
    gp: {
      gpDataTypeNotHandled:"GP-datatype ikke h�ndtert."
    },
        
    na: {
      route: {
        routeNameNotSpecified: "'RouteName' er ikke angitt for minst 1 stopp i stopp FeatureSet."
      }
    },
    
    query: {
      invalid: "Kan ikke utf�re sp�rring. Kontroller parameterne."
    }
  },

  toolbars: {
    draw: {
      convertAntiClockwisePolygon: "Polygoner som er tegnet i retning mot utviseren, vil bli reversert til retning med urviseren.",
      addPoint: "Klikk for � legge til et punkt",
      addShape: "Klikk for � legge til en figur",
      addMultipoint: "Klikk for � begynne � legge til punkter",
      freehand: "Trykk ned for � starte, og slipp for � avslutte",
      start: "Klikk for � begynne � tegne",
      resume: "Klikk for � fortsette � tegne",
      complete: "Dobbeltklikk for � fullf�re",
      finish: "Dobbeltklikk for � avslutte",
      invalidType: "Ikke st�ttet geometritype"
    },
    edit: {
      invalidType: "Kan ikke aktivere verkt�yet. Unders�k om verkt�yet er gyldig for den gitte geometritypen.",
      deleteLabel: "Slett"
    }
  },
  
  virtualearth: {
    // minMaxTokenDuration:"Token duration must be greater than 15 minutes and lesser than 480 minutes (8 hours).",
    
    vetiledlayer: {
      //tokensNotSpecified:"Either clientToken & serverToken must be provided or tokenUrl must be specified."
      bingMapsKeyNotSpecified: "BingMapsKey m� oppgis."
    },
    
    vegeocode: {
      //tokensNotSpecified:"Either serverToken must be provided or tokenUrl must be specified.",
      bingMapsKeyNotSpecified: "BingMapsKey m� oppgis.",
      requestQueued: "Servertoken ikke hentet. Legger foresp�rsel i k� for utf�ring n�r servertoken er hentet."
    }
  },
  widgets: {
    attributeInspector: {
      NLS_first: "F�rste",
      NLS_previous: "Forrige",
      NLS_next: "Neste",
      NLS_last: "Siste",
      NLS_deleteFeature: "Slett",
      NLS_title: "Rediger attributter",
      NLS_errorInvalid: "Ugyldig",
      NLS_validationInt: "Verdi m� v�re et heltall.",
      NLS_validationFlt: "Verdi m� v�re et flyttall.",
      NLS_of: "av",
      NLS_noFeaturesSelected: "Ingen funksjoner valgt"
    },
    overviewMap: {
      NLS_drag: "Dra for � endre kartomfanget",
      NLS_show: "Vis kartoversikt",
      NLS_hide: "Skjul kartoversikt",
      NLS_maximize: "Maksimer",
      NLS_restore: "Gjenopprett",
      NLS_noMap: "fant ikke 'map' i inndataparametere",
      NLS_noLayer: "hovedkart har ikke et baselag",
      NLS_invalidSR: "romlig referanse for det gitte laget er ikke kompatibel med hovedkartet",
      NLS_invalidType: "ikke st�ttet lagtype. Gyldige typer er 'TiledMapServiceLayer' og 'DynamicMapServiceLayer'"
    },
    timeSlider: {
      NLS_first: "F�rste",
      NLS_previous: "Forrige",
      NLS_next: "Neste",
      NLS_play: "Spill av/Pause",
      NLS_invalidTimeExtent: "TimeExtent ikke angitt eller i feil format."
    },
    attachmentEditor: {
      NLS_attachments: "Vedlegg:",
      NLS_add: "Legg til",
      NLS_none: "Ingen"
    },
    editor: {
      tools: {
        NLS_attributesLbl: "Attributter",
        NLS_cutLbl: "Klipp ut",
        NLS_deleteLbl: "Slett",
        NLS_extentLbl: "Omfang",
        NLS_freehandPolygonLbl: "Frih�ndspolygon",
        NLS_freehandPolylineLbl: "Frih�ndspolylinje",
        NLS_pointLbl: "Punkt",
        NLS_polygonLbl: "Polygon",
        NLS_polylineLbl: "Polylinje",
        NLS_reshapeLbl: "Omforme",
        NLS_selectionNewLbl: "Nytt valg",
        NLS_selectionAddLbl: "Legg til utvalg",
        NLS_selectionClearLbl: "T�m utvalg",
        NLS_selectionRemoveLbl: "Subtraher fra utvalg",
        NLS_selectionUnionLbl: "Union",
        NLS_autoCompleteLbl: "Autofullf�r",
        NLS_unionLbl: "Union",
        NLS_rectangleLbl: "Rektangel",
        NLS_circleLbl: "Sirkel",
        NLS_ellipseLbl: "Ellipse",
        NLS_triangleLbl: "Trekant",
        NLS_arrowLbl: "Pil",
        NLS_arrowLeftLbl: "Pil venstre",
        NLS_arrowUpLbl: "Pil opp",
        NLS_arrowDownLbl: "Pil ned",
        NLS_arrowRightLbl: "Pil h�yre",
        NLS_undoLbl: "Angre",
        NLS_redoLbl: "Gj�r om"
      }
    },
    legend: {
      NLS_creatingLegend: "Oppretter forklaring",
      NLS_noLegend: "Ingen forklaring"
    },
    popup: {
      NLS_moreInfo: "Mer informasjon",
      NLS_searching: "S�ker",
      NLS_prevFeature: "Forrige geoobjekt",
      NLS_nextFeature: "Neste geoobjekt",
      NLS_close: "Lukk",
      NLS_prevMedia: "Forrige medier",
      NLS_nextMedia: "Neste medier",
      NLS_noInfo: "Ingen informasjon tilgjengelig",
      NLS_noAttach: "Fant ingen vedlegg",
      NLS_maximize: "Maksimer",
      NLS_restore: "Gjenopprett",
      NLS_zoomTo: "Zoom til",
      NLS_pagingInfo: "(${index} av ${total})",
      NLS_attach: "Vedlegg"
    },
    measurement: {
      NLS_distance: "Avstand",
      NLS_area: "Areal",
      NLS_location: "Sted",
      NLS_resultLabel: "M�leresultat",
      NLS_length_miles: "Miles",
      NLS_length_kilometers: "Kilometer",
      NLS_length_feet: "Fot",
      NLS_length_meters: "Meter",
      NLS_length_yards: "Yard",
      NLS_area_acres: "Acre",
      NLS_area_sq_miles: "miles�",
      NLS_area_sq_kilometers: "km�",
      NLS_area_hectares: "Hektar",
      NLS_area_sq_yards: "yard�",
      NLS_area_sq_feet: "fot�",
      NLS_area_sq_meters: "m�",
      NLS_deg_min_sec: "DMS",
      NLS_decimal_degrees: "Grader",
      NLS_longitude: "Lengdegrad",
      NLS_latitude: "Breddegrad"
    },
    bookmarks: {
      NLS_add_bookmark: "Legg til bokmerke",
      NLS_new_bookmark: "Uten tittel",
      NLS_bookmark_edit: "Rediger",
      NLS_bookmark_remove: "Fjern"
    },
    print: {
      NLS_print: "Skriv ut",
      NLS_printing: "Skriver ut",
      NLS_printout: "Utskrift"
    },
    templatePicker: {
      creationDisabled: "Geoobjektoppretting er deaktivert for alle lag.",
      loading: "Laster inn.."
    }
  },
  arcgis: {
    utils: {
      baseLayerError: "Kan ikke laste bakgrunnskart",
      geometryServiceError: "Oppgi en geometritjeneste for � �pne Web Map."
    }
  },
  
  identity: {
    lblItem: "element",
    title: "Logg p�",
    info: "Logg p� for � f� tilgang til elementet p� ${server} ${resource}",
    lblUser: "Brukernavn:",
    lblPwd: "Passord:",
    lblOk: "OK",
    lblSigning: "Logger p�...",
    lblCancel: "Avbryt",
    errorMsg: "Ugyldig brukernavn/passord. Pr�v igjen.",
    invalidUser: "Brukernavnet eller passordet du oppgav, er feil.",
    forbidden: "Brukernavnet og passordet er gyldig, men du har ikke tilgang til denne ressursen.",
    noAuthService: "F�r ikke tilgang til godkjenningstjeneste."
  }
})
);