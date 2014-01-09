require({cache:{
'esri/nls/zh/jsapi':function(){
﻿define(
({
  io: {
    proxyNotSet:"esri.config.defaults.io.proxyUrl 尚未进行设置。"
  },
  
  map: {
    deprecateReorderLayerString: "Map.reorderLayer(/*String*/ id, /*Number*/ index) 已被弃用。请使用 Map.reorderLayer(/*Layer*/ layer, /*Number*/ index)。",
    deprecateShiftDblClickZoom: "Map.(enable/disable)ShiftDoubleClickZoom 已被弃用。Shift-Double-Click 缩放行为不受支持。"
  },

  geometry: {
    deprecateToScreenPoint:"esri.geometry.toScreenPoint 已被弃用。请使用 esri.geometry.toScreenGeometry。",
    deprecateToMapPoint:"esri.geometry.toMapPoint 已被弃用。请使用 esri.geometry.toMapGeometry。"
  },

  layers: {
    tiled: {
      tileError:"无法加载切片"
    },
    
    dynamic: {
      imageError:"无法加载影像"
    },
    
    graphics: {
      drawingError:"无法绘制图形 "
    },

    agstiled: {
      deprecateRoundrobin:"构造器选项 'roundrobin' 已被弃用。请使用选项 'tileServers'。"
    },

    imageParameters: {
      deprecateBBox:"属性 'bbox' 已被弃用。请使用属性 'extent'。"
    },
    
    FeatureLayer: {
      noOIDField: "objectIdField 未设置 [url: ${url}]",
      fieldNotFound: "无法在图层 'fields' 信息中找到“${field}'字段 [url: ${url}]",
      noGeometryField: "无法在图层 'fields' 信息中找到 'esriFieldTypeGeometry' 类型的字段。如果当前使用的是一个地图服务图层，要素将不包含几何 [url: ${url}]",
      invalidParams: "查询中包含一个或多个不受支持的参数",
      updateError: "更新图层时出错",
      
      createUserSeconds: "由 ${userId} 在几秒钟前创建",
      createUserMinute: "由 ${userId} 在一分钟前创建",
      editUserSeconds: "由 ${userId} 在几秒钟前编辑",
      editUserMinute: "由 ${userId} 在一分钟前编辑",
      createSeconds: "在几秒钟前创建",
      createMinute: "在一分钟前创建",
      editSeconds: "在几秒钟前编辑",
      editMinute: "在一分钟前编辑",
      
      createUserMinutes: "由 ${userId} 在 ${minutes} 分钟前创建",
      createUserHour: "由 ${userId} 在一小时前创建",
      createUserHours: "由 ${userId} 在 ${hours} 小时前创建",
      createUserWeekDay: "由 ${userId} 在 ${weekDay} 的 ${formattedTime} 创建",
      createUserFull: "由 ${userId} 在 ${formattedDate} 的 ${formattedTime} 创建",
      
      editUserMinutes: "由 ${userId} 在 ${minutes} 分钟前编辑",
      editUserHour: "由 ${userId} 在一小时前编辑",
      editUserHours: "由 ${userId} 在 ${hours} 小时前编辑",
      editUserWeekDay: "由 ${userId} 在 ${weekDay} 的 ${formattedTime} 编辑",
      editUserFull: "由 ${userId} 在 ${formattedDate} 的 ${formattedTime} 编辑",
      
      createUser: "由 ${userId} 创建",
      editUser: "由 ${userId} 编辑",
      
      createMinutes: "在 ${minutes} 分钟前创建",
      createHour: "在一小时前创建",
      createHours: "在 ${hours} 小时前创建",
      createWeekDay: "在 ${weekDay} 的 ${formattedTime} 创建",
      createFull: "在 ${formattedDate} 的 ${formattedTime} 创建",
      
      editMinutes: "在 ${minutes} 分钟前编辑",
      editHour: "在一小时前编辑",
      editHours: "在 ${hours} 小时前编辑",
      editWeekDay: "在 ${weekDay} 的 ${formattedTime} 编辑",
      editFull: "在 ${formattedDate} 的 ${formattedTime} 编辑"
    }
  },

  tasks: {
    gp: {
      gpDataTypeNotHandled:"GP 数据类型未处理。"
    },
        
    na: {
      route: {
        routeNameNotSpecified: "停靠点要素集中至少 1 个停靠点未指定 'RouteName'。"
      }
    },
    
    query: {
      invalid: "无法执行查询。请检查参数。"
    }
  },

  toolbars: {
    draw: {
      convertAntiClockwisePolygon: "以逆时针方向绘制的面将反转为顺时针方向。",
      addPoint: "单击以添加点",
      addShape: "单击以添加形状",
      addMultipoint: "单击以开始添加点",
      freehand: "按下后开始并直到完成",
      start: "单击以开始绘制",
      resume: "单击以继续绘制",
      complete: "双击完成操作",
      finish: "双击完成操作",
      invalidType: "不支持的几何类型"
    },
    edit: {
      invalidType: "无法激活工具。检查该工具对于指定的几何类型是否有效。",
      deleteLabel: "删除"
    }
  },
  
  virtualearth: {
    // minMaxTokenDuration:"Token duration must be greater than 15 minutes and lesser than 480 minutes (8 hours).",
    
    vetiledlayer: {
      //tokensNotSpecified:"Either clientToken & serverToken must be provided or tokenUrl must be specified."
      bingMapsKeyNotSpecified: "必须提供 BingMapsKey。"
    },
    
    vegeocode: {
      //tokensNotSpecified:"Either serverToken must be provided or tokenUrl must be specified.",
      bingMapsKeyNotSpecified: "必须提供 BingMapsKey。",
      requestQueued: "未检索到服务器令牌。要在检索到服务器令牌之后执行查询请求。"
    }
  },
  widgets: {
    attributeInspector: {
      NLS_first: "第一页",
      NLS_previous: "上一页",
      NLS_next: "下一页",
      NLS_last: "最后一页",
      NLS_deleteFeature: "删除",
      NLS_title: "编辑属性",
      NLS_errorInvalid: "无效",
      NLS_validationInt: "值必须是整型。",
      NLS_validationFlt: "值必须是浮点型。",
      NLS_of: "/",
      NLS_noFeaturesSelected: "未选择任何要素"
    },
    overviewMap: {
      NLS_drag: "拖动以更改地图范围",
      NLS_show: "显示鹰眼图",
      NLS_hide: "隐藏鹰眼图",
      NLS_maximize: "最大化",
      NLS_restore: "恢复",
      NLS_noMap: "输入参数中未找到 'map'",
      NLS_noLayer: "主地图不包含底图图层",
      NLS_invalidSR: "指定图层的空间参考与主地图不兼容",
      NLS_invalidType: "不支持的图层类型。有效类型为 'TiledMapServiceLayer' 和 'DynamicMapServiceLayer'"
    },
    timeSlider: {
      NLS_first: "第一页",
      NLS_previous: "上一页",
      NLS_next: "下一页",
      NLS_play: "播放/暂停",
      NLS_invalidTimeExtent: "时间范围未指定或格式不正确。"
    },
    attachmentEditor: {
      NLS_attachments: "附件:",
      NLS_add: "添加",
      NLS_none: "无"
    },
    editor: {
      tools: {
        NLS_attributesLbl: "属性",
        NLS_cutLbl: "剪切",
        NLS_deleteLbl: "删除",
        NLS_extentLbl: "范围",
        NLS_freehandPolygonLbl: "手绘面",
        NLS_freehandPolylineLbl: "手绘折线",
        NLS_pointLbl: "点",
        NLS_polygonLbl: "面",
        NLS_polylineLbl: "折线",
        NLS_reshapeLbl: "整形",
        NLS_selectionNewLbl: "新建选择内容",
        NLS_selectionAddLbl: "添加到选择内容",
        NLS_selectionClearLbl: "清除选择内容",
        NLS_selectionRemoveLbl: "从选择内容中移除",
        NLS_selectionUnionLbl: "联合",
        NLS_autoCompleteLbl: "自动完成",
        NLS_unionLbl: "联合",
        NLS_rectangleLbl: "矩形",
        NLS_circleLbl: "圆形",
        NLS_ellipseLbl: "椭圆",
        NLS_triangleLbl: "三角形",
        NLS_arrowLbl: "箭头",
        NLS_arrowLeftLbl: "左箭头",
        NLS_arrowUpLbl: "上箭头",
        NLS_arrowDownLbl: "下箭头",
        NLS_arrowRightLbl: "右箭头",
        NLS_undoLbl: "撤消",
        NLS_redoLbl: "恢复"
      }
    },
    legend: {
      NLS_creatingLegend: "创建图例",
      NLS_noLegend: "无图例"
    },
    popup: {
      NLS_moreInfo: "更多信息",
      NLS_searching: "正在搜索",
      NLS_prevFeature: "上一个要素",
      NLS_nextFeature: "下一个要素",
      NLS_close: "关闭",
      NLS_prevMedia: "上一个媒体文件",
      NLS_nextMedia: "下一个媒体文件",
      NLS_noInfo: "无任何可用信息",
      NLS_noAttach: "未找到任何附件",
      NLS_maximize: "最大化",
      NLS_restore: "恢复",
      NLS_zoomTo: "缩放至",
      NLS_pagingInfo: "(${index}/${total})",
      NLS_attach: "附件"
    },
    measurement: {
      NLS_distance: "距离",
      NLS_area: "面积",
      NLS_location: "位置",
      NLS_resultLabel: "测量结果",
      NLS_length_miles: "英里",
      NLS_length_kilometers: "千米",
      NLS_length_feet: "英尺",
      NLS_length_meters: "米",
      NLS_length_yards: "码",
      NLS_area_acres: "英亩",
      NLS_area_sq_miles: "平方英里",
      NLS_area_sq_kilometers: "平方千米",
      NLS_area_hectares: "公顷",
      NLS_area_sq_yards: "平方码",
      NLS_area_sq_feet: "平方英尺",
      NLS_area_sq_meters: "平方米",
      NLS_deg_min_sec: "DMS",
      NLS_decimal_degrees: "度",
      NLS_longitude: "经度",
      NLS_latitude: "纬度"
    },
    bookmarks: {
      NLS_add_bookmark: "添加书签",
      NLS_new_bookmark: "无标题",
      NLS_bookmark_edit: "编辑",
      NLS_bookmark_remove: "移除"
    },
    print: {
      NLS_print: "打印",
      NLS_printing: "打印",
      NLS_printout: "打印输出"
    },
    templatePicker: {
      creationDisabled: "已针对所有图层禁用要素创建。",
      loading: "正在加载.."
    }
  },
  arcgis: {
    utils: {
      baseLayerError: "无法加载底图图层",
      geometryServiceError: "提供一个几何服务来打开 Web 地图。"
    }
  },
  
  identity: {
    lblItem: "项目",
    title: "登录",
    info: "请登录以访问 ${server} ${resource} 上的项目",
    lblUser: "用户名:",
    lblPwd: "密码:",
    lblOk: "确定",
    lblSigning: "正在登录...",
    lblCancel: "取消",
    errorMsg: "无效的用户名或密码。请重试。",
    invalidUser: "您输入的用户名或密码不正确。",
    forbidden: "用户名和密码有效，但您没有对此资源的访问权限。",
    noAuthService: "无法访问身份验证服务。"
  }
})
);
},
'esri/nls/zh-tw/jsapi':function(){
define('esri/nls/zh-tw/jsapi',{});
},
'dojo/cldr/nls/zh/gregorian':function(){
define(
//begin v1.x content
{
	"months-format-narrow": [
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
	"field-weekday": "周天",
	"dateFormatItem-yQQQ": "y年QQQ",
	"dateFormatItem-yMEd": "y年M月d日，E",
	"dateFormatItem-MMMEd": "MMMd日E",
	"eraNarrow": [
		"公元前",
		"公元"
	],
	"dayPeriods-format-wide-earlyMorning": "清晨",
	"dayPeriods-format-wide-morning": "上午",
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
	"dayPeriods-format-wide-pm": "下午",
	"dateFormat-full": "y年M月d日EEEE",
	"dateFormatItem-Md": "M-d",
	"field-era": "时期",
	"dateFormatItem-yM": "yyyy-M",
	"months-standAlone-wide": [
		"一月",
		"二月",
		"三月",
		"四月",
		"五月",
		"六月",
		"七月",
		"八月",
		"九月",
		"十月",
		"十一月",
		"十二月"
	],
	"timeFormat-short": "ah:mm",
	"quarters-format-wide": [
		"第1季度",
		"第2季度",
		"第3季度",
		"第4季度"
	],
	"timeFormat-long": "zah时mm分ss秒",
	"field-year": "年",
	"dateFormatItem-yMMM": "y年MMM",
	"dateFormatItem-yQ": "y年QQQ",
	"dateFormatItem-yyyyMMMM": "y年MMMM",
	"field-hour": "小时",
	"dateFormatItem-MMdd": "MM-dd",
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
	"dateFormatItem-yyQ": "yy年第Q季度",
	"timeFormat-full": "zzzzah时mm分ss秒",
	"field-day-relative+0": "今天",
	"field-day-relative+1": "明天",
	"field-day-relative+2": "后天",
	"dateFormatItem-H": "H时",
	"months-standAlone-abbr": [
		"一月",
		"二月",
		"三月",
		"四月",
		"五月",
		"六月",
		"七月",
		"八月",
		"九月",
		"十月",
		"十一月",
		"十二月"
	],
	"quarters-format-abbr": [
		"1季",
		"2季",
		"3季",
		"4季"
	],
	"quarters-standAlone-wide": [
		"第1季度",
		"第2季度",
		"第3季度",
		"第4季度"
	],
	"dateFormatItem-M": "M月",
	"days-standAlone-wide": [
		"星期日",
		"星期一",
		"星期二",
		"星期三",
		"星期四",
		"星期五",
		"星期六"
	],
	"dateFormatItem-yyMMM": "yy年MMM",
	"timeFormat-medium": "ah:mm:ss",
	"dateFormatItem-Hm": "H:mm",
	"quarters-standAlone-abbr": [
		"1季",
		"2季",
		"3季",
		"4季"
	],
	"eraAbbr": [
		"公元前",
		"公元"
	],
	"field-minute": "分钟",
	"field-dayperiod": "上午/下午",
	"days-standAlone-abbr": [
		"周日",
		"周一",
		"周二",
		"周三",
		"周四",
		"周五",
		"周六"
	],
	"dayPeriods-format-wide-night": "晚上",
	"dateFormatItem-d": "d日",
	"dateFormatItem-ms": "mm:ss",
	"field-day-relative+-1": "昨天",
	"dateFormatItem-h": "ah时",
	"dateTimeFormat-long": "{1}{0}",
	"field-day-relative+-2": "前天",
	"dateFormatItem-MMMd": "MMMd日",
	"dayPeriods-format-wide-midDay": "中午",
	"dateFormatItem-MEd": "M-dE",
	"dateTimeFormat-full": "{1}{0}",
	"field-day": "日",
	"days-format-wide": [
		"星期日",
		"星期一",
		"星期二",
		"星期三",
		"星期四",
		"星期五",
		"星期六"
	],
	"field-zone": "区域",
	"dateFormatItem-y": "y年",
	"months-standAlone-narrow": [
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
	"dateFormatItem-yyMM": "yy-MM",
	"dateFormatItem-hm": "ah:mm",
	"days-format-abbr": [
		"周日",
		"周一",
		"周二",
		"周三",
		"周四",
		"周五",
		"周六"
	],
	"dateFormatItem-yMMMd": "y年MMMd日",
	"eraNames": [
		"公元前",
		"公元"
	],
	"days-format-narrow": [
		"日",
		"一",
		"二",
		"三",
		"四",
		"五",
		"六"
	],
	"field-month": "月",
	"days-standAlone-narrow": [
		"日",
		"一",
		"二",
		"三",
		"四",
		"五",
		"六"
	],
	"dateFormatItem-MMM": "LLL",
	"dayPeriods-format-wide-am": "上午",
	"dateFormatItem-MMMMdd": "MMMMdd日",
	"dayPeriods-format-wide-weeHours": "凌晨",
	"dateFormat-short": "yy-M-d",
	"dayPeriods-format-wide-afternoon": "下午",
	"field-second": "秒钟",
	"dateFormatItem-yMMMEd": "y年MMMd日EEE",
	"dateFormatItem-Ed": "d日E",
	"field-week": "周",
	"dateFormat-medium": "yyyy-M-d",
	"dateFormatItem-yyyyM": "y年M月",
	"dateTimeFormat-short": "{1} {0}",
	"dateFormatItem-Hms": "H:mm:ss",
	"dateFormatItem-hms": "ah:mm:ss",
	"dateFormatItem-yyyy": "y年"
}
//end v1.x content
);
},
'dojo/cldr/nls/zh-tw/gregorian':function(){
define(
//begin v1.x content
{
	"quarters-standAlone-wide": [
		"第1季",
		"第2季",
		"第3季",
		"第4季"
	],
	"quarters-format-abbr": [
		"第1季",
		"第2季",
		"第3季",
		"第4季"
	],
	"dateFormat-medium": "yyyy/M/d",
	"field-second": "秒",
	"quarters-standAlone-abbr": [
		"第1季",
		"第2季",
		"第3季",
		"第4季"
	],
	"dateFormatItem-MMdd": "MM/dd",
	"dateFormatItem-MEd": "M/d（E）",
	"dateFormatItem-yMEd": "yyyy/M/d（EEE）",
	"field-week": "週",
	"dateFormatItem-H": "H時",
	"eraNarrow": [
		"西元前",
		"西元"
	],
	"field-day-relative+-3": "大前天",
	"timeFormat-full": "zzzzah時mm分ss秒",
	"dateFormatItem-Md": "M/d",
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
	"eraNames": [
		"西元前",
		"西元"
	],
	"field-minute": "分鐘",
	"field-hour": "小時",
	"field-day-relative+2": "後天",
	"field-day-relative+3": "大後天",
	"dateFormat-short": "yy/M/d",
	"dateFormatItem-yMMMEd": "y年M月d日EEE",
	"field-era": "年代",
	"dateFormatItem-yM": "yyyy/M",
	"timeFormat-long": "zah時mm分ss秒",
	"eraAbbr": [
		"西元前",
		"西元"
	],
	"dateFormatItem-h": "ah時",
	"dateFormatItem-yMMM": "y年M月",
	"quarters-format-wide": [
		"第1季",
		"第2季",
		"第3季",
		"第4季"
	],
	"field-weekday": "週天",
	"field-zone": "區域",
	"dateFormatItem-Ed": "d日(E)"
}
//end v1.x content
);
},
'dojo/cldr/nls/zh/number':function(){
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
'dojo/cldr/nls/zh-tw/number':function(){
define('dojo/cldr/nls/zh-tw/number',{});
},
'*noref':1}});
define("esri/nls/jsapi_zh-tw", [], 1);
