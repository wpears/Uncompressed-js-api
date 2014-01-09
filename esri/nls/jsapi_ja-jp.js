require({cache:{
'esri/nls/ja/jsapi':function(){
﻿define(
({
  io: {
    proxyNotSet:"esri.config.defaults.io.proxyUrl が設定されていません。"
  },
  
  map: {
    deprecateReorderLayerString: "Map.reorderLayer(/*String*/ id, /*Number*/ index) はサポートされていません。Map.reorderLayer(/*Layer*/ layer, /*Number*/ index)を使用してください。",
    deprecateShiftDblClickZoom: "Map.(enable/disable)ShiftDoubleClickZoom はサポートされていません。Shift キーを押しながらダブルクリックでのズームの動作はサポートされていません。"
  },

  geometry: {
    deprecateToScreenPoint:"esri.geometry.toScreenPoint はサポートされていません。esri.geometry.toScreenGeometry を使用してください。",
    deprecateToMapPoint:"esri.geometry.toMapPoint はサポートされていません。esri.geometry.toMapGeometry を使用してください。"
  },

  layers: {
    tiled: {
      tileError:"タイルを読み込めません"
    },
    
    dynamic: {
      imageError:"イメージを読み込めません"
    },
    
    graphics: {
      drawingError:"グラフィックスを描画できません "
    },

    agstiled: {
      deprecateRoundrobin:"コンストラクタ オプション 'roundrobin' はサポートされていません。オプション 'tileServers' を使用してください。"
    },

    imageParameters: {
      deprecateBBox:"プロパティ 'bbox' はサポートされていません。プロパティ 'extent' を使用してください。"
    },
    
    FeatureLayer: {
      noOIDField: "objectIdField が設定されていません [url: ${url}]",
      fieldNotFound: "レイヤの 'fields' 情報に '${field}' フィールドが見つかりません [url: ${url}]",
      noGeometryField: "レイヤの 'fields' 情報に 'esriFieldTypeGeometry' 型のフィールドが見つかりません。マップ サービス レイヤを使用しているのであれば、フィーチャにジオメトリがありません [url: ${url}]",
      invalidParams: "クエリに 1 つ以上のサポートされていないパラメータが含まれています",
      updateError: "レイヤの更新中にエラーが発生しました",
      
      createUserSeconds: "数秒前に ${userId} によって作成されました",
      createUserMinute: "一分前に ${userId} によって作成されました",
      editUserSeconds: "数秒前に ${userId} によって編集されました",
      editUserMinute: "一分前に ${userId} によって編集されました",
      createSeconds: "数秒前に作成されました",
      createMinute: "一分前に作成されました",
      editSeconds: "数秒前に編集されました",
      editMinute: "一分前に編集されました",
      
      createUserMinutes: "${userId} が ${minutes} 分前に作成",
      createUserHour: "${userId} が 1 時間前に作成",
      createUserHours: "${userId} が ${hours} 時間前に作成",
      createUserWeekDay: "${userId} が ${weekDay} の ${formattedTime} に作成",
      createUserFull: "${userId} が ${formattedDate} の ${formattedTime} に作成",
      
      editUserMinutes: "${userId} が ${minutes} 分前に編集",
      editUserHour: "${userId} が 1 時間前に編集",
      editUserHours: "${userId} が ${hours} 時間前に編集",
      editUserWeekDay: "${userId} が ${weekDay} の ${formattedTime} に編集",
      editUserFull: "${userId} が ${formattedDate} の ${formattedTime} に編集",
      
      createUser: "${userId} が作成",
      editUser: "${userId} が編集",
      
      createMinutes: "${minutes} 分前に作成",
      createHour: "1 時間前に作成",
      createHours: "${hours} 時間前に作成",
      createWeekDay: "${weekDay} の ${formattedTime} に作成",
      createFull: "${formattedDate} の ${formattedTime} に作成",
      
      editMinutes: "${minutes} 分前に編集",
      editHour: "1 時間前に編集",
      editHours: "${hours} 時間前に編集",
      editWeekDay: "${weekDay} の ${formattedTime} に編集",
      editFull: "${formattedDate} の ${formattedTime} に編集"
    }
  },

  tasks: {
    gp: {
      gpDataTypeNotHandled:"GP データ タイプは処理されません。"
    },
        
    na: {
      route: {
        routeNameNotSpecified: "ストップ FeatureSet の中で、少なくとも 1 つのストップに対して 'RouteName' が指定されていません。"
      }
    },
    
    query: {
      invalid: "クエリを実行できません。パラメータを確認してください。"
    }
  },

  toolbars: {
    draw: {
      convertAntiClockwisePolygon: "反時計回りの方向で描画されたポリゴンは、時計回りに反転されます。",
      addPoint: "クリックしてポイントを追加します",
      addShape: "クリックして図形を追加します",
      addMultipoint: "クリックしてポイントの追加を開始します",
      freehand: "ドラッグしてください",
      start: "クリックして描画を開始します",
      resume: "クリックして描画を続行します",
      complete: "ダブルクリックして完了します",
      finish: "ダブルクリックして終了します",
      invalidType: "サポートされていないジオメトリ タイプ"
    },
    edit: {
      invalidType: "ツールを有効にすることができません。指定したジオメトリ タイプに対してツールが有効であることを確認してください。",
      deleteLabel: "削除"
    }
  },
  
  virtualearth: {
    // minMaxTokenDuration:"Token duration must be greater than 15 minutes and lesser than 480 minutes (8 hours).",
    
    vetiledlayer: {
      //tokensNotSpecified:"Either clientToken & serverToken must be provided or tokenUrl must be specified."
      bingMapsKeyNotSpecified: "BingMapsKey を指定する必要があります。"
    },
    
    vegeocode: {
      //tokensNotSpecified:"Either serverToken must be provided or tokenUrl must be specified.",
      bingMapsKeyNotSpecified: "BingMapsKey を指定する必要があります。",
      requestQueued: "サーバのトークンを取得できません。サーバのトークンが取得されるまでリクエストを待機させます。"
    }
  },
  widgets: {
    attributeInspector: {
      NLS_first: "最初",
      NLS_previous: "前へ",
      NLS_next: "次へ",
      NLS_last: "最後",
      NLS_deleteFeature: "削除",
      NLS_title: "属性編集",
      NLS_errorInvalid: "無効",
      NLS_validationInt: "値は整数でなければなりません。",
      NLS_validationFlt: "値は浮動小数点型でなければなりません。",
      NLS_of: "/",
      NLS_noFeaturesSelected: "フィーチャは選択されていません"
    },
    overviewMap: {
      NLS_drag: "ドラッグしてマップ範囲を変更",
      NLS_show: "概観図の表示",
      NLS_hide: "概観図の非表示",
      NLS_maximize: "最大化",
      NLS_restore: "元に戻す",
      NLS_noMap: "入力パラメータに 'map' が見つかりません",
      NLS_noLayer: "マップにベース レイヤがありません",
      NLS_invalidSR: "指定したレイヤの空間参照はマップの空間参照と一致していません",
      NLS_invalidType: "サポートされていないレイヤ タイプです。有効なタイプは 'TiledMapServiceLayer' および 'DynamicMapServiceLayer' です"
    },
    timeSlider: {
      NLS_first: "最初",
      NLS_previous: "前へ",
      NLS_next: "次へ",
      NLS_play: "再生/一時停止",
      NLS_invalidTimeExtent: "TimeExtent が指定されていないか、形式が正しくありません。"
    },
    attachmentEditor: {
      NLS_attachments: "添付ファイル:",
      NLS_add: "追加",
      NLS_none: "なし"
    },
    editor: {
      tools: {
        NLS_attributesLbl: "属性",
        NLS_cutLbl: "切り取り",
        NLS_deleteLbl: "削除",
        NLS_extentLbl: "範囲",
        NLS_freehandPolygonLbl: "フリーハンド ポリゴン",
        NLS_freehandPolylineLbl: "フリーハンド ポリライン",
        NLS_pointLbl: "ポイント",
        NLS_polygonLbl: "ポリゴン",
        NLS_polylineLbl: "ポリライン",
        NLS_reshapeLbl: "形状変更",
        NLS_selectionNewLbl: "新規選択",
        NLS_selectionAddLbl: "選択に追加",
        NLS_selectionClearLbl: "選択の解除",
        NLS_selectionRemoveLbl: "選択から削除",
        NLS_selectionUnionLbl: "ユニオン",
        NLS_autoCompleteLbl: "自動完成ポリゴン",
        NLS_unionLbl: "ユニオン",
        NLS_rectangleLbl: "四角形",
        NLS_circleLbl: "円",
        NLS_ellipseLbl: "楕円",
        NLS_triangleLbl: "三角形",
        NLS_arrowLbl: "矢印",
        NLS_arrowLeftLbl: "左矢印",
        NLS_arrowUpLbl: "上矢印",
        NLS_arrowDownLbl: "下矢印",
        NLS_arrowRightLbl: "右矢印",
        NLS_undoLbl: "元に戻す",
        NLS_redoLbl: "やり直し"
      }
    },
    legend: {
      NLS_creatingLegend: "凡例を作成しています",
      NLS_noLegend: "凡例がありません"
    },
    popup: {
      NLS_moreInfo: "詳細",
      NLS_searching: "検索しています",
      NLS_prevFeature: "前のフィーチャ",
      NLS_nextFeature: "次のフィーチャ",
      NLS_close: "閉じる",
      NLS_prevMedia: "前のメディア",
      NLS_nextMedia: "次のメディア",
      NLS_noInfo: "利用できる情報がありません",
      NLS_noAttach: "添付ファイルがありません",
      NLS_maximize: "最大化",
      NLS_restore: "元に戻す",
      NLS_zoomTo: "ズーム",
      NLS_pagingInfo: "(${index} / ${total})",
      NLS_attach: "添付ファイル"
    },
    measurement: {
      NLS_distance: "距離",
      NLS_area: "面積",
      NLS_location: "位置",
      NLS_resultLabel: "計測結果",
      NLS_length_miles: "マイル",
      NLS_length_kilometers: "キロメートル",
      NLS_length_feet: "フィート",
      NLS_length_meters: "メートル",
      NLS_length_yards: "ヤード",
      NLS_area_acres: "エーカー",
      NLS_area_sq_miles: "平方マイル",
      NLS_area_sq_kilometers: "平方キロメートル",
      NLS_area_hectares: "ヘクタール",
      NLS_area_sq_yards: "平方ヤード",
      NLS_area_sq_feet: "平方フィート",
      NLS_area_sq_meters: "平方メートル",
      NLS_deg_min_sec: "度分秒",
      NLS_decimal_degrees: "度",
      NLS_longitude: "経度",
      NLS_latitude: "緯度"
    },
    bookmarks: {
      NLS_add_bookmark: "ブックマークの追加",
      NLS_new_bookmark: "無題",
      NLS_bookmark_edit: "編集",
      NLS_bookmark_remove: "削除"
    },
    print: {
      NLS_print: "印刷",
      NLS_printing: "印刷中",
      NLS_printout: "印刷出力"
    },
    templatePicker: {
      creationDisabled: "すべてのレイヤでフィーチャの作成が無効に設定されています。",
      loading: "読み込み中.."
    }
  },
  arcgis: {
    utils: {
      baseLayerError: "ベース マップ レイヤを読み込めません",
      geometryServiceError: "ジオメトリ サービスを指定して Web マップを開きます。"
    }
  },
  
  identity: {
    lblItem: "アイテム",
    title: "サインイン",
    info: "${server} ${resource} のアイテムにアクセスするにはサインインしてください",
    lblUser: "ユーザ名:",
    lblPwd: "パスワード:",
    lblOk: "OK",
    lblSigning: "サインインしています...",
    lblCancel: "キャンセル",
    errorMsg: "ユーザ名またはパスワードが無効です。もう一度やり直してください。",
    invalidUser: "入力したユーザ名またはパスワードが正しくありません。",
    forbidden: "ユーザ名とパスワードは有効ですが、このリソースへのアクセス権がありません。",
    noAuthService: "認証サービスにアクセスできません。"
  }
})
);
},
'esri/nls/ja-jp/jsapi':function(){
define('esri/nls/ja-jp/jsapi',{});
},
'dojo/cldr/nls/ja/gregorian':function(){
define(
//begin v1.x content
{
	"field-weekday": "曜日",
	"dateFormatItem-yQQQ": "yQQQ",
	"dateFormatItem-yMEd": "y/M/d(EEE)",
	"dateFormatItem-MMMEd": "M月d日(E)",
	"eraNarrow": [
		"BC",
		"AD"
	],
	"dateFormat-long": "y年M月d日",
	"months-format-wide": [
		"1月",
		"2月",
		"3月",
		"4月",
		"5月",
		"6月",
		"7月",
		"8月",
		"9月",
		"10月",
		"11月",
		"12月"
	],
	"dateTimeFormat-medium": "{1} {0}",
	"dayPeriods-format-wide-pm": "午後",
	"dateFormat-full": "y年M月d日EEEE",
	"dateFormatItem-Md": "M/d",
	"dateFormatItem-yMd": "y/M/d",
	"field-era": "時代",
	"dateFormatItem-yM": "y/M",
	"months-standAlone-wide": [
		"1月",
		"2月",
		"3月",
		"4月",
		"5月",
		"6月",
		"7月",
		"8月",
		"9月",
		"10月",
		"11月",
		"12月"
	],
	"timeFormat-short": "H:mm",
	"quarters-format-wide": [
		"第1四半期",
		"第2四半期",
		"第3四半期",
		"第4四半期"
	],
	"timeFormat-long": "H:mm:ss z",
	"field-year": "年",
	"dateFormatItem-yMMM": "y年M月",
	"dateFormatItem-yQ": "y/Q",
	"field-hour": "時",
	"dateFormatItem-MMdd": "MM/dd",
	"months-format-abbr": [
		"1月",
		"2月",
		"3月",
		"4月",
		"5月",
		"6月",
		"7月",
		"8月",
		"9月",
		"10月",
		"11月",
		"12月"
	],
	"dateFormatItem-yyQ": "yy/Q",
	"timeFormat-full": "H時mm分ss秒 zzzz",
	"field-day-relative+0": "今日",
	"field-day-relative+1": "明日",
	"field-day-relative+2": "明後日",
	"dateFormatItem-H": "H時",
	"field-day-relative+3": "3日後",
	"months-standAlone-abbr": [
		"1月",
		"2月",
		"3月",
		"4月",
		"5月",
		"6月",
		"7月",
		"8月",
		"9月",
		"10月",
		"11月",
		"12月"
	],
	"quarters-format-abbr": [
		"Q1",
		"Q2",
		"Q3",
		"Q4"
	],
	"quarters-standAlone-wide": [
		"第1四半期",
		"第2四半期",
		"第3四半期",
		"第4四半期"
	],
	"dateFormatItem-M": "M月",
	"days-standAlone-wide": [
		"日曜日",
		"月曜日",
		"火曜日",
		"水曜日",
		"木曜日",
		"金曜日",
		"土曜日"
	],
	"dateFormatItem-yyMMM": "y年M月",
	"timeFormat-medium": "H:mm:ss",
	"dateFormatItem-Hm": "H:mm",
	"eraAbbr": [
		"BC",
		"AD"
	],
	"field-minute": "分",
	"field-dayperiod": "午前/午後",
	"days-standAlone-abbr": [
		"日",
		"月",
		"火",
		"水",
		"木",
		"金",
		"土"
	],
	"dateFormatItem-d": "d日",
	"dateFormatItem-ms": "mm:ss",
	"field-day-relative+-1": "昨日",
	"dateFormatItem-h": "ah時",
	"dateTimeFormat-long": "{1}{0}",
	"field-day-relative+-2": "一昨日",
	"field-day-relative+-3": "3日前",
	"dateFormatItem-MMMd": "M月d日",
	"dateFormatItem-MEd": "M/d(E)",
	"dateTimeFormat-full": "{1}{0}",
	"field-day": "日",
	"days-format-wide": [
		"日曜日",
		"月曜日",
		"火曜日",
		"水曜日",
		"木曜日",
		"金曜日",
		"土曜日"
	],
	"field-zone": "タイムゾーン",
	"dateFormatItem-yyyyMM": "yyyy/MM",
	"dateFormatItem-y": "y年",
	"months-standAlone-narrow": [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"10",
		"11",
		"12"
	],
	"dateFormatItem-hm": "ah:mm",
	"dateFormatItem-GGGGyMd": "GGGGy年M月d日",
	"days-format-abbr": [
		"日",
		"月",
		"火",
		"水",
		"木",
		"金",
		"土"
	],
	"dateFormatItem-yMMMd": "y年M月d日",
	"eraNames": [
		"紀元前",
		"西暦"
	],
	"days-format-narrow": [
		"日",
		"月",
		"火",
		"水",
		"木",
		"金",
		"土"
	],
	"field-month": "月",
	"days-standAlone-narrow": [
		"日",
		"月",
		"火",
		"水",
		"木",
		"金",
		"土"
	],
	"dateFormatItem-MMM": "LLL",
	"dayPeriods-format-wide-am": "午前",
	"dateFormat-short": "yy/MM/dd",
	"field-second": "秒",
	"dateFormatItem-yMMMEd": "y年M月d日(EEE)",
	"dateFormatItem-Ed": "d日(EEE)",
	"field-week": "週",
	"dateFormat-medium": "yyyy/MM/dd",
	"dateTimeFormat-short": "{1} {0}",
	"dateFormatItem-Hms": "H:mm:ss",
	"dateFormatItem-hms": "ah:mm:ss",
	"dateFormatItem-yyyy": "y年"
}
//end v1.x content
);
},
'dojo/cldr/nls/ja-jp/gregorian':function(){
define('dojo/cldr/nls/ja-jp/gregorian',{});
},
'dojo/cldr/nls/ja/number':function(){
define(
//begin v1.x content
{
	"decimalFormat": "#,##0.###",
	"group": ",",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0%",
	"currencyFormat": "¤#,##0.00",
	"decimal": "."
}
//end v1.x content
);
},
'dojo/cldr/nls/ja-jp/number':function(){
define('dojo/cldr/nls/ja-jp/number',{});
},
'*noref':1}});
define("esri/nls/jsapi_ja-jp", [], 1);
