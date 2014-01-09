require({cache:{
'esri/nls/ru/jsapi':function(){
﻿define(
({
  io: {
    proxyNotSet:"Не задан параметр esri.config.defaults.io.proxyUrl."
  },
  
  map: {
    deprecateReorderLayerString: "Параметр Map.reorderLayer(/*String*/ id, /*Number*/ index) устарел. Используйте Map.reorderLayer(/*Layer*/ layer, /*Number*/ index).",
    deprecateShiftDblClickZoom: "Параметр Map.(enable/disable)ShiftDoubleClickZoom устарел. Изменение масштаба при одновременном нажатии клавиши Shift и двойном щелчке мышью не поддерживается."
  },

  geometry: {
    deprecateToScreenPoint:"Параметр esri.geometry.toScreenPoint устарел. Используйте параметр esri.geometry.toScreenGeometry.",
    deprecateToMapPoint:"Параметр esri.geometry.toMapPoint устарел. Используйте параметр esri.geometry.toMapGeometry."
  },

  layers: {
    tiled: {
      tileError:"Невозможно загрузить мозаику"
    },
    
    dynamic: {
      imageError:"Невозможно загрузить изображение"
    },
    
    graphics: {
      drawingError:"Невозможно создать рисунок "
    },

    agstiled: {
      deprecateRoundrobin:"Параметр конструктора 'roundrobin' устарел. Используйте параметр 'tileServers'."
    },

    imageParameters: {
      deprecateBBox:"Свойство 'bbox' устарело. Используйте свойство 'extent'."
    },
    
    FeatureLayer: {
      noOIDField: "Параметр objectIdField не задан [url: ${url}]",
      fieldNotFound: "невозможно найти поле '${field}' в данных 'fields' слоя [url: ${url}]",
      noGeometryField: "невозможно найти поле типа 'esriFieldTypeGeometry' в данных 'fields' слоя. Если используется слой картографического сервиса, то объекты не будут иметь геометрию [url: ${url}]",
      invalidParams: "в запросе содержится один или несколько неподдерживаемых параметров",
      updateError: "при обновлении слоя произошла ошибка",
      
      createUserSeconds: "Создано ${userId} сек. назад",
      createUserMinute: "Создано ${userId} 1 мин. назад",
      editUserSeconds: "Отредактировано ${userId} сек. назад",
      editUserMinute: "Отредактировано ${userId} 1 мин. назад",
      createSeconds: "Создано сек. назад",
      createMinute: "Создано 1 мин. назад",
      editSeconds: "Отредактировано сек. назад",
      editMinute: "Отредактировано 1 мин. назад",
      
      createUserMinutes: "Создано ${userId} ${minutes}мин. назад",
      createUserHour: "Создано ${userId} 1 час назад",
      createUserHours: "Создано ${userId} ${hours} ч. назад",
      createUserWeekDay: "Создано ${userId} в ${weekDay} в ${formattedTime}",
      createUserFull: "Создано ${userId} ${formattedDate} в ${formattedTime}",
      
      editUserMinutes: "Изменено ${userId} ${minutes} мин. назад",
      editUserHour: "Изменено ${userId} 1 час назад",
      editUserHours: "Изменено ${userId} ${hours} ч. назад",
      editUserWeekDay: "Изменено ${userId} в ${weekDay} в ${formattedTime}",
      editUserFull: "Изменено ${userId} ${formattedDate} в ${formattedTime}",
      
      createUser: "Создано ${userId}",
      editUser: "Изменено ${userId}",
      
      createMinutes: "Создано ${minutes} мин. назад",
      createHour: "Создано 1 час назад",
      createHours: "Создано ${hours} ч. назад",
      createWeekDay: "Создано в ${weekDay} в ${formattedTime}",
      createFull: "Создано ${formattedDate} в ${formattedTime}",
      
      editMinutes: "Изменено ${minutes} мин. назад",
      editHour: "Изменено 1 час назад",
      editHours: "Изменено ${hours} ч. назад",
      editWeekDay: "Изменено в ${weekDay} в ${formattedTime}",
      editFull: "Изменено ${formattedDate} в ${formattedTime}"
    }
  },

  tasks: {
    gp: {
      gpDataTypeNotHandled:"Тип данных GP не обработан."
    },
        
    na: {
      route: {
        routeNameNotSpecified: "Параметр 'RouteName' не задан как минимум для 1 остановки в наборе остановок FeatureSet."
      }
    },
    
    query: {
      invalid: "Невозможно выполнить запрос. Проверьте параметры."
    }
  },

  toolbars: {
    draw: {
      convertAntiClockwisePolygon: "Полигоны, оцифрованные против часовой стрелки, будут сохранены с порядком вершин по часовой стрелке.",
      addPoint: "Щелкните, чтобы добавить точку",
      addShape: "Щелкните, чтобы добавить геометрию",
      addMultipoint: "Щелкните, чтобы начать добавление точек",
      freehand: "Нажмите кнопку, чтобы начать, и отпустите ее, чтобы завершить",
      start: "Щелкните, чтобы начать рисовать",
      resume: "Щелкните, чтобы продолжить рисовать",
      complete: "Дважды щелкните для завершения",
      finish: "Дважды щелкните для завершения",
      invalidType: "Неподдерживаемый тип геометрии"
    },
    edit: {
      invalidType: "Невозможно активировать инструмент. Убедитесь в том, что данный тип геометрии поддерживается этим инструментом.",
      deleteLabel: "Удалить"
    }
  },
  
  virtualearth: {
    // minMaxTokenDuration:"Token duration must be greater than 15 minutes and lesser than 480 minutes (8 hours).",
    
    vetiledlayer: {
      //tokensNotSpecified:"Either clientToken & serverToken must be provided or tokenUrl must be specified."
      bingMapsKeyNotSpecified: "Необходимо задать параметр BingMapsKey."
    },
    
    vegeocode: {
      //tokensNotSpecified:"Either serverToken must be provided or tokenUrl must be specified.",
      bingMapsKeyNotSpecified: "Необходимо задать параметр BingMapsKey.",
      requestQueued: "Токен сервера не получен. Запрос будет выполнен после получения токена сервера."
    }
  },
  widgets: {
    attributeInspector: {
      NLS_first: "Первый",
      NLS_previous: "Назад",
      NLS_next: "Далее",
      NLS_last: "Последний",
      NLS_deleteFeature: "Удалить",
      NLS_title: "Изменить атрибуты",
      NLS_errorInvalid: "Недопустимо",
      NLS_validationInt: "Значение должно быть целым числом.",
      NLS_validationFlt: "Значение должно быть числом с плавающей точкой.",
      NLS_of: "из",
      NLS_noFeaturesSelected: "Объекты не выбраны"
    },
    overviewMap: {
      NLS_drag: "Перетащите, чтобы изменить экстент карты",
      NLS_show: "Показать Обзорную карту",
      NLS_hide: "Скрыть Обзорную карту",
      NLS_maximize: "Развернуть",
      NLS_restore: "Восстановить",
      NLS_noMap: "Параметр 'map' не найден во входных параметрах",
      NLS_noLayer: "в главной карте нет базового слоя",
      NLS_invalidSR: "пространственная привязка выбранного слоя не совместима с главной картой",
      NLS_invalidType: "неподдерживаемый тип слоя. Допустимые типы: 'TiledMapServiceLayer' и 'DynamicMapServiceLayer'"
    },
    timeSlider: {
      NLS_first: "Первый",
      NLS_previous: "Назад",
      NLS_next: "Далее",
      NLS_play: "Воспроизведение/пауза",
      NLS_invalidTimeExtent: "Параметр TimeExtent не задан или имеет неверный формат."
    },
    attachmentEditor: {
      NLS_attachments: "Вложения:",
      NLS_add: "Добавить",
      NLS_none: "Нет"
    },
    editor: {
      tools: {
        NLS_attributesLbl: "Атрибуты",
        NLS_cutLbl: "Вырезать",
        NLS_deleteLbl: "Удалить",
        NLS_extentLbl: "Экстент",
        NLS_freehandPolygonLbl: "Полигон произвольной формы",
        NLS_freehandPolylineLbl: "Линия произвольной формы",
        NLS_pointLbl: "Точка",
        NLS_polygonLbl: "Полигон",
        NLS_polylineLbl: "Линия",
        NLS_reshapeLbl: "Изменить форму",
        NLS_selectionNewLbl: "Новая выборка",
        NLS_selectionAddLbl: "Добавить к выборке",
        NLS_selectionClearLbl: "Очистить выборку",
        NLS_selectionRemoveLbl: "Убрать из выборки",
        NLS_selectionUnionLbl: "Объединение",
        NLS_autoCompleteLbl: "Автозавершение",
        NLS_unionLbl: "Объединение",
        NLS_rectangleLbl: "Прямоугольник",
        NLS_circleLbl: "Круг",
        NLS_ellipseLbl: "Эллипс",
        NLS_triangleLbl: "Треугольник",
        NLS_arrowLbl: "Стрелка",
        NLS_arrowLeftLbl: "Стрелка влево",
        NLS_arrowUpLbl: "Стрелка вверх",
        NLS_arrowDownLbl: "Стрелка вниз",
        NLS_arrowRightLbl: "Стрелка вправо",
        NLS_undoLbl: "Отменить",
        NLS_redoLbl: "Повторить"
      }
    },
    legend: {
      NLS_creatingLegend: "Создание легенды",
      NLS_noLegend: "Без легенды"
    },
    popup: {
      NLS_moreInfo: "Подробнее",
      NLS_searching: "Выполняется поиск",
      NLS_prevFeature: "Предыдущий объект",
      NLS_nextFeature: "Следующий объект",
      NLS_close: "Закрыть",
      NLS_prevMedia: "Предыдущий носитель",
      NLS_nextMedia: "Следующий носитель",
      NLS_noInfo: "Информация недоступна",
      NLS_noAttach: "Вложения не найдены",
      NLS_maximize: "Развернуть",
      NLS_restore: "Восстановить",
      NLS_zoomTo: "Приблизить к",
      NLS_pagingInfo: "(${index} из ${total})",
      NLS_attach: "Вложения"
    },
    measurement: {
      NLS_distance: "Расстояние",
      NLS_area: "Площадь",
      NLS_location: "Местоположение",
      NLS_resultLabel: "Результат измерения",
      NLS_length_miles: "Мили",
      NLS_length_kilometers: "Километры",
      NLS_length_feet: "Футы",
      NLS_length_meters: "Метры",
      NLS_length_yards: "Ярды",
      NLS_area_acres: "Акры",
      NLS_area_sq_miles: "Кв. мили",
      NLS_area_sq_kilometers: "Кв. километры",
      NLS_area_hectares: "гектары",
      NLS_area_sq_yards: "Кв. ярды",
      NLS_area_sq_feet: "Кв. футы",
      NLS_area_sq_meters: "Кв. метры",
      NLS_deg_min_sec: "DMS",
      NLS_decimal_degrees: "Градусы",
      NLS_longitude: "Долгота",
      NLS_latitude: "Широта"
    },
    bookmarks: {
      NLS_add_bookmark: "Добавить закладку",
      NLS_new_bookmark: "Без имени",
      NLS_bookmark_edit: "Правка",
      NLS_bookmark_remove: "У&далить"
    },
    print: {
      NLS_print: "Печать",
      NLS_printing: "Печать",
      NLS_printout: "Распечатать"
    },
    templatePicker: {
      creationDisabled: "Возможность создания объектов отключена для всех слоев.",
      loading: "Загрузка.."
    }
  },
  arcgis: {
    utils: {
      baseLayerError: "Невозможно загрузить базовый слой карты",
      geometryServiceError: "Чтобы открыть веб-карту, обеспечьте доступ к сервису геометрии."
    }
  },
  
  identity: {
    lblItem: "элемент",
    title: "Подключиться",
    info: "Пожалуйста, зарегистрируйтесь для доступа к данным на ${server} ${resource}",
    lblUser: "Имя пользователя:",
    lblPwd: "Пароль:",
    lblOk: "OK",
    lblSigning: "Авторизация...",
    lblCancel: "Отмена",
    errorMsg: "Неверные имя пользователя/пароль.  Попробуйте ещё раз.",
    invalidUser: "Введено неправильное имя пользователя или пароль.",
    forbidden: "Данные учетной записи введены верно, но у вас нет доступа к данному ресурсу.",
    noAuthService: "Не удается получить доступ к службе аутентификации пользователей."
  }
})
);
},
'dojo/cldr/nls/ru/gregorian':function(){
define(
//begin v1.x content
{
	"dateFormatItem-yM": "M.y",
	"field-dayperiod": "AM/PM",
	"field-minute": "Минута",
	"eraNames": [
		"до н.э.",
		"н.э."
	],
	"dateFormatItem-MMMEd": "ccc, d MMM",
	"field-day-relative+-1": "Вчера",
	"field-weekday": "День недели",
	"dateFormatItem-yQQQ": "y QQQ",
	"field-day-relative+-2": "Позавчера",
	"dateFormatItem-MMdd": "dd.MM",
	"days-standAlone-wide": [
		"Воскресенье",
		"Понедельник",
		"Вторник",
		"Среда",
		"Четверг",
		"Пятница",
		"Суббота"
	],
	"dateFormatItem-MMM": "LLL",
	"months-standAlone-narrow": [
		"Я",
		"Ф",
		"М",
		"А",
		"М",
		"И",
		"И",
		"А",
		"С",
		"О",
		"Н",
		"Д"
	],
	"field-era": "Эра",
	"field-hour": "Час",
	"quarters-standAlone-abbr": [
		"1-й кв.",
		"2-й кв.",
		"3-й кв.",
		"4-й кв."
	],
	"dateFormatItem-yyMMMEEEd": "EEE, d MMM yy",
	"dateFormatItem-y": "y",
	"timeFormat-full": "H:mm:ss zzzz",
	"dateFormatItem-yyyy": "y",
	"months-standAlone-abbr": [
		"янв.",
		"февр.",
		"март",
		"апр.",
		"май",
		"июнь",
		"июль",
		"авг.",
		"сент.",
		"окт.",
		"нояб.",
		"дек."
	],
	"dateFormatItem-Ed": "E, d",
	"dateFormatItem-yMMM": "LLL y",
	"field-day-relative+0": "Сегодня",
	"dateFormatItem-yyyyLLLL": "LLLL y",
	"field-day-relative+1": "Завтра",
	"days-standAlone-narrow": [
		"В",
		"П",
		"В",
		"С",
		"Ч",
		"П",
		"С"
	],
	"eraAbbr": [
		"до н.э.",
		"н.э."
	],
	"field-day-relative+2": "Послезавтра",
	"dateFormatItem-yyyyMM": "MM.yyyy",
	"dateFormatItem-yyyyMMMM": "LLLL y",
	"dateFormat-long": "d MMMM y 'г'.",
	"timeFormat-medium": "H:mm:ss",
	"field-zone": "Часовой пояс",
	"dateFormatItem-Hm": "H:mm",
	"dateFormat-medium": "dd.MM.yyyy",
	"dateFormatItem-yyMM": "MM.yy",
	"dateFormatItem-Hms": "H:mm:ss",
	"dateFormatItem-yyMMM": "LLL yy",
	"quarters-standAlone-wide": [
		"1-й квартал",
		"2-й квартал",
		"3-й квартал",
		"4-й квартал"
	],
	"dateFormatItem-ms": "mm:ss",
	"dateFormatItem-yyyyQQQQ": "QQQQ y 'г'.",
	"field-year": "Год",
	"months-standAlone-wide": [
		"Январь",
		"Февраль",
		"Март",
		"Апрель",
		"Май",
		"Июнь",
		"Июль",
		"Август",
		"Сентябрь",
		"Октябрь",
		"Ноябрь",
		"Декабрь"
	],
	"field-week": "Неделя",
	"dateFormatItem-MMMd": "d MMM",
	"dateFormatItem-yyQ": "Q yy",
	"timeFormat-long": "H:mm:ss z",
	"months-format-abbr": [
		"янв.",
		"февр.",
		"марта",
		"апр.",
		"мая",
		"июня",
		"июля",
		"авг.",
		"сент.",
		"окт.",
		"нояб.",
		"дек."
	],
	"timeFormat-short": "H:mm",
	"dateFormatItem-H": "H",
	"field-month": "Месяц",
	"quarters-format-abbr": [
		"1-й кв.",
		"2-й кв.",
		"3-й кв.",
		"4-й кв."
	],
	"days-format-abbr": [
		"вс",
		"пн",
		"вт",
		"ср",
		"чт",
		"пт",
		"сб"
	],
	"dateFormatItem-M": "L",
	"days-format-narrow": [
		"В",
		"П",
		"В",
		"С",
		"Ч",
		"П",
		"С"
	],
	"field-second": "Секунда",
	"field-day": "День",
	"dateFormatItem-MEd": "E, d.M",
	"months-format-narrow": [
		"Я",
		"Ф",
		"М",
		"А",
		"М",
		"И",
		"И",
		"А",
		"С",
		"О",
		"Н",
		"Д"
	],
	"days-standAlone-abbr": [
		"Вс",
		"Пн",
		"Вт",
		"Ср",
		"Чт",
		"Пт",
		"Сб"
	],
	"dateFormat-short": "dd.MM.yy",
	"dateFormatItem-yMMMEd": "E, d MMM y",
	"dateFormat-full": "EEEE, d MMMM y 'г'.",
	"dateFormatItem-Md": "d.M",
	"dateFormatItem-yMEd": "EEE, d.M.y",
	"months-format-wide": [
		"января",
		"февраля",
		"марта",
		"апреля",
		"мая",
		"июня",
		"июля",
		"августа",
		"сентября",
		"октября",
		"ноября",
		"декабря"
	],
	"dateFormatItem-d": "d",
	"quarters-format-wide": [
		"1-й квартал",
		"2-й квартал",
		"3-й квартал",
		"4-й квартал"
	],
	"days-format-wide": [
		"воскресенье",
		"понедельник",
		"вторник",
		"среда",
		"четверг",
		"пятница",
		"суббота"
	],
	"eraNarrow": [
		"до н.э.",
		"н.э."
	]
}
//end v1.x content
);
},
'dojo/cldr/nls/ru/number':function(){
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
	"nativeZeroDigit": "0",
	"perMille": "‰",
	"decimalFormat": "#,##0.###",
	"currencyFormat": "#,##0.00 ¤",
	"plusSign": "+"
}
//end v1.x content
);
},
'*noref':1}});
define("esri/nls/jsapi_ru", [], 1);
