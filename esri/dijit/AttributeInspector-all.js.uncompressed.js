/*
 COPYRIGHT 2009 ESRI

 TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
 Unpublished material - all rights reserved under the
 Copyright Laws of the United States and applicable international
 laws, treaties, and conventions.

 For additional information, contact:
 Environmental Systems Research Institute, Inc.
 Attn: Contracts and Legal Services Department
 380 New York Street
 Redlands, California, 92373
 USA

 email: contracts@esri.com
 */
//>>built
require({cache:{
'dijit/form/nls/validate':function(){
define("dijit/form/nls/validate", { root:
//begin v1.x content
({
	invalidMessage: "The value entered is not valid.",
	missingMessage: "This value is required.",
	rangeMessage: "This value is out of range."
})
//end v1.x content
,
"zh": true,
"zh-tw": true,
"tr": true,
"th": true,
"sv": true,
"sl": true,
"sk": true,
"ru": true,
"ro": true,
"pt": true,
"pt-pt": true,
"pl": true,
"nl": true,
"nb": true,
"ko": true,
"kk": true,
"ja": true,
"it": true,
"hu": true,
"hr": true,
"he": true,
"fr": true,
"fi": true,
"es": true,
"el": true,
"de": true,
"da": true,
"cs": true,
"ca": true,
"az": true,
"ar": true
});

},
'dijit/form/TextBox':function(){
require({cache:{
'url:dijit/form/templates/TextBox.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\" id=\"widget_${id}\" role=\"presentation\"\r\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\r\n\t\t><input class=\"dijitReset dijitInputInner\" data-dojo-attach-point='textbox,focusNode' autocomplete=\"off\"\r\n\t\t\t${!nameAttrSetting} type='${type}'\r\n\t/></div\r\n></div>\r\n"}});
define("dijit/form/TextBox", [
	"dojo/_base/declare", // declare
	"dojo/dom-construct", // domConstruct.create
	"dojo/dom-style", // domStyle.getComputedStyle
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/lang", // lang.hitch
	"dojo/_base/sniff", // has("ie") has("mozilla")
	"dojo/_base/window", // win.doc.selection.createRange
	"./_FormValueWidget",
	"./_TextBoxMixin",
	"dojo/text!./templates/TextBox.html",
	".."	// to export dijit._setSelectionRange, remove in 2.0
], function(declare, domConstruct, domStyle, kernel, lang, has, win,
			_FormValueWidget, _TextBoxMixin, template, dijit){

/*=====
	var _FormValueWidget = dijit.form._FormValueWidget;
	var _TextBoxMixin = dijit.form._TextBoxMixin;
=====*/

	// module:
	//		dijit/form/TextBox
	// summary:
	//		A base class for textbox form inputs

	var TextBox = declare(/*====="dijit.form.TextBox", =====*/ [_FormValueWidget, _TextBoxMixin], {
		// summary:
		//		A base class for textbox form inputs

		templateString: template,
		_singleNodeTemplate: '<input class="dijit dijitReset dijitLeft dijitInputField" data-dojo-attach-point="textbox,focusNode" autocomplete="off" type="${type}" ${!nameAttrSetting} />',

		_buttonInputDisabled: has("ie") ? "disabled" : "", // allows IE to disallow focus, but Firefox cannot be disabled for mousedown events

		baseClass: "dijitTextBox",

		postMixInProperties: function(){
			var type = this.type.toLowerCase();
			if(this.templateString && this.templateString.toLowerCase() == "input" || ((type == "hidden" || type == "file") && this.templateString == this.constructor.prototype.templateString)){
				this.templateString = this._singleNodeTemplate;
			}
			this.inherited(arguments);
		},

		_onInput: function(e){
			this.inherited(arguments);
			if(this.intermediateChanges){ // _TextBoxMixin uses onInput
				var _this = this;
				// the setTimeout allows the key to post to the widget input box
				setTimeout(function(){ _this._handleOnChange(_this.get('value'), false); }, 0);
			}
		},

		_setPlaceHolderAttr: function(v){
			this._set("placeHolder", v);
			if(!this._phspan){
				this._attachPoints.push('_phspan');
				// dijitInputField class gives placeHolder same padding as the input field
				// parent node already has dijitInputField class but it doesn't affect this <span>
				// since it's position: absolute.
				this._phspan = domConstruct.create('span',{className:'dijitPlaceHolder dijitInputField'},this.textbox,'after');
			}
			this._phspan.innerHTML="";
			this._phspan.appendChild(document.createTextNode(v));
			this._updatePlaceHolder();
		},

		_updatePlaceHolder: function(){
			if(this._phspan){
				this._phspan.style.display=(this.placeHolder&&!this.focused&&!this.textbox.value)?"":"none";
			}
		},

		_setValueAttr: function(value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
			this.inherited(arguments);
			this._updatePlaceHolder();
		},

		getDisplayedValue: function(){
			// summary:
			//		Deprecated.  Use get('displayedValue') instead.
			// tags:
			//		deprecated
			kernel.deprecated(this.declaredClass+"::getDisplayedValue() is deprecated. Use set('displayedValue') instead.", "", "2.0");
			return this.get('displayedValue');
		},

		setDisplayedValue: function(/*String*/ value){
			// summary:
			//		Deprecated.  Use set('displayedValue', ...) instead.
			// tags:
			//		deprecated
			kernel.deprecated(this.declaredClass+"::setDisplayedValue() is deprecated. Use set('displayedValue', ...) instead.", "", "2.0");
			this.set('displayedValue', value);
		},

		_onBlur: function(e){
			if(this.disabled){ return; }
			this.inherited(arguments);
			this._updatePlaceHolder();
		},

		_onFocus: function(/*String*/ by){
			if(this.disabled || this.readOnly){ return; }
			this.inherited(arguments);
			this._updatePlaceHolder();
		}
	});

	if(has("ie")){
		TextBox = declare(/*===== "dijit.form.TextBox.IEMixin", =====*/ TextBox, {
			declaredClass: "dijit.form.TextBox",	// for user code referencing declaredClass

			_isTextSelected: function(){
				var range = win.doc.selection.createRange();
				var parent = range.parentElement();
				return parent == this.textbox && range.text.length == 0;
			},

			postCreate: function(){
				this.inherited(arguments);
				// IE INPUT tag fontFamily has to be set directly using STYLE
				// the setTimeout gives IE a chance to render the TextBox and to deal with font inheritance
				setTimeout(lang.hitch(this, function(){
					try{
						var s = domStyle.getComputedStyle(this.domNode); // can throw an exception if widget is immediately destroyed
						if(s){
							var ff = s.fontFamily;
							if(ff){
								var inputs = this.domNode.getElementsByTagName("INPUT");
								if(inputs){
									for(var i=0; i < inputs.length; i++){
										inputs[i].style.fontFamily = ff;
									}
								}
							}
						}
					}catch(e){/*when used in a Dialog, and this is called before the dialog is
						shown, s.fontFamily would trigger "Invalid Argument" error.*/}
				}), 0);
			}
		});

		// Overrides definition of _setSelectionRange from _TextBoxMixin (TODO: move to _TextBoxMixin.js?)
		dijit._setSelectionRange = _TextBoxMixin._setSelectionRange = function(/*DomNode*/ element, /*Number?*/ start, /*Number?*/ stop){
			if(element.createTextRange){
				var r = element.createTextRange();
				r.collapse(true);
				r.moveStart("character", -99999); // move to 0
				r.moveStart("character", start); // delta from 0 is the correct position
				r.moveEnd("character", stop-start);
				r.select();
			}
		}
	}else if(has("mozilla")){
		TextBox = declare(/*===== "dijit.form.TextBox.MozMixin", =====*/TextBox, {
			declaredClass: "dijit.form.TextBox",	// for user code referencing declaredClass

			_onBlur: function(e){
				this.inherited(arguments);
				if(this.selectOnClick){
						// clear selection so that the next mouse click doesn't reselect
					this.textbox.selectionStart = this.textbox.selectionEnd = undefined;
				}
			}
		});
	}else{
		TextBox.prototype.declaredClass = "dijit.form.TextBox";
	}
	lang.setObject("dijit.form.TextBox", TextBox);	// don't do direct assignment, it confuses API doc parser

	return TextBox;
});

},
'dijit/_editor/html':function(){
define("dijit/_editor/html", [
	"dojo/_base/lang", // lang.isString
	"dojo/_base/sniff", // has("ie")
	".."		// for exporting symbols to dijit._editor (remove for 2.0)
], function(lang, has, dijit){

// module:
//		dijit/_editor/html
// summary:
//		Utility functions used by editor

lang.getObject("_editor", true, dijit);

dijit._editor.escapeXml=function(/*String*/str, /*Boolean?*/noSingleQuotes){
	// summary:
	//		Adds escape sequences for special characters in XML: &<>"'
	//		Optionally skips escapes for single quotes
	str = str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/"/gm, "&quot;");
	if(!noSingleQuotes){
		str = str.replace(/'/gm, "&#39;");
	}
	return str; // string
};

dijit._editor.getNodeHtml=function(/* DomNode */node){
	var output;
	switch(node.nodeType){
		case 1: //element node
			var lName = node.nodeName.toLowerCase();
			if(!lName || lName.charAt(0) == "/"){
				// IE does some strange things with malformed HTML input, like
				// treating a close tag </span> without an open tag <span>, as
				// a new tag with tagName of /span.  Corrupts output HTML, remove
				// them.  Other browsers don't prefix tags that way, so will
				// never show up.
				return "";
			}
			output = '<' + lName;

			//store the list of attributes and sort it to have the
			//attributes appear in the dictionary order
			var attrarray = [];
			var attr;
			if(has("ie") && node.outerHTML){
				var s = node.outerHTML;
				s = s.substr(0, s.indexOf('>'))
					.replace(/(['"])[^"']*\1/g, ''); //to make the following regexp safe
				var reg = /(\b\w+)\s?=/g;
				var m, key;
				while((m = reg.exec(s))){
					key = m[1];
					if(key.substr(0,3) != '_dj'){
						if(key == 'src' || key == 'href'){
							if(node.getAttribute('_djrealurl')){
								attrarray.push([key,node.getAttribute('_djrealurl')]);
								continue;
							}
						}
						var val, match;
						switch(key){
							case 'style':
								val = node.style.cssText.toLowerCase();
								break;
							case 'class':
								val = node.className;
								break;
							case 'width':
								if(lName === "img"){
									// This somehow gets lost on IE for IMG tags and the like
									// and we have to find it in outerHTML, known IE oddity.
									match=/width=(\S+)/i.exec(s);
									if(match){
										val = match[1];
									}
									break;
								}
							case 'height':
								if(lName === "img"){
									// This somehow gets lost on IE for IMG tags and the like
									// and we have to find it in outerHTML, known IE oddity.
									match=/height=(\S+)/i.exec(s);
									if(match){
										val = match[1];
									}
									break;
								}
							default:
								val = node.getAttribute(key);
						}
						if(val != null){
							attrarray.push([key, val.toString()]);
						}
					}
				}
			}else{
				var i = 0;
				while((attr = node.attributes[i++])){
					//ignore all attributes starting with _dj which are
					//internal temporary attributes used by the editor
					var n = attr.name;
					if(n.substr(0,3) != '_dj' /*&&
						(attr.specified == undefined || attr.specified)*/){
						var v = attr.value;
						if(n == 'src' || n == 'href'){
							if(node.getAttribute('_djrealurl')){
								v = node.getAttribute('_djrealurl');
							}
						}
						attrarray.push([n,v]);
					}
				}
			}
			attrarray.sort(function(a,b){
				return a[0] < b[0] ? -1 : (a[0] == b[0] ? 0 : 1);
			});
			var j = 0;
			while((attr = attrarray[j++])){
				output += ' ' + attr[0] + '="' +
					(lang.isString(attr[1]) ? dijit._editor.escapeXml(attr[1], true) : attr[1]) + '"';
			}
			if(lName === "script"){
				// Browsers handle script tags differently in how you get content,
				// but innerHTML always seems to work, so insert its content that way
				// Yes, it's bad to allow script tags in the editor code, but some people
				// seem to want to do it, so we need to at least return them right.
				// other plugins/filters can strip them.
				output += '>' + node.innerHTML +'</' + lName + '>';
			}else{
				if(node.childNodes.length){
					output += '>' + dijit._editor.getChildrenHtml(node)+'</' + lName +'>';
				}else{
					switch(lName){
						case 'br':
						case 'hr':
						case 'img':
						case 'input':
						case 'base':
						case 'meta':
						case 'area':
						case 'basefont':
							// These should all be singly closed
							output += ' />';
							break;
						default:
							// Assume XML style separate closure for everything else.
							output += '></' + lName + '>';
					}
				}
			}
			break;
		case 4: // cdata
		case 3: // text
			// FIXME:
			output = dijit._editor.escapeXml(node.nodeValue, true);
			break;
		case 8: //comment
			// FIXME:
			output = '<!--' + dijit._editor.escapeXml(node.nodeValue, true) + '-->';
			break;
		default:
			output = "<!-- Element not recognized - Type: " + node.nodeType + " Name: " + node.nodeName + "-->";
	}
	return output;
};

dijit._editor.getChildrenHtml = function(/* DomNode */dom){
	// summary:
	//		Returns the html content of a DomNode and children
	var out = "";
	if(!dom){ return out; }
	var nodes = dom["childNodes"] || dom;

	//IE issue.
	//If we have an actual node we can check parent relationships on for IE,
	//We should check, as IE sometimes builds invalid DOMS.  If no parent, we can't check
	//And should just process it and hope for the best.
	var checkParent = !has("ie") || nodes !== dom;

	var node, i = 0;
	while((node = nodes[i++])){
		//IE is broken.  DOMs are supposed to be a tree.  But in the case of malformed HTML, IE generates a graph
		//meaning one node ends up with multiple references (multiple parents).  This is totally wrong and invalid, but
		//such is what it is.  We have to keep track and check for this because otherise the source output HTML will have dups.
		//No other browser generates a graph.  Leave it to IE to break a fundamental DOM rule.  So, we check the parent if we can
		//If we can't, nothing more we can do other than walk it.
		if(!checkParent || node.parentNode == dom){
			out += dijit._editor.getNodeHtml(node);
		}
	}
	return out; // String
};

return dijit._editor;
});

},
'dijit/_editor/nls/commands':function(){
define("dijit/_editor/nls/commands", { root:
//begin v1.x content
({
	'bold': 'Bold',
	'copy': 'Copy',
	'cut': 'Cut',
	'delete': 'Delete',
	'indent': 'Indent',
	'insertHorizontalRule': 'Horizontal Rule',
	'insertOrderedList': 'Numbered List',
	'insertUnorderedList': 'Bullet List',
	'italic': 'Italic',
	'justifyCenter': 'Align Center',
	'justifyFull': 'Justify',
	'justifyLeft': 'Align Left',
	'justifyRight': 'Align Right',
	'outdent': 'Outdent',
	'paste': 'Paste',
	'redo': 'Redo',
	'removeFormat': 'Remove Format',
	'selectAll': 'Select All',
	'strikethrough': 'Strikethrough',
	'subscript': 'Subscript',
	'superscript': 'Superscript',
	'underline': 'Underline',
	'undo': 'Undo',
	'unlink': 'Remove Link',
	'createLink': 'Create Link',
	'toggleDir': 'Toggle Direction',
	'insertImage': 'Insert Image',
	'insertTable': 'Insert/Edit Table',
	'toggleTableBorder': 'Toggle Table Border',
	'deleteTable': 'Delete Table',
	'tableProp': 'Table Property',
	'htmlToggle': 'HTML Source',
	'foreColor': 'Foreground Color',
	'hiliteColor': 'Background Color',
	'plainFormatBlock': 'Paragraph Style',
	'formatBlock': 'Paragraph Style',
	'fontSize': 'Font Size',
	'fontName': 'Font Name',
	'tabIndent': 'Tab Indent',
	"fullScreen": "Toggle Full Screen",
	"viewSource": "View HTML Source",
	"print": "Print",
	"newPage": "New Page",
	/* Error messages */
	'systemShortcut': 'The "${0}" action is only available in your browser using a keyboard shortcut. Use ${1}.',
	'ctrlKey':'ctrl+${0}',
	'appleKey':'\u2318${0}' // "command" or open-apple key on Macintosh
})
//end v1.x content
,
"zh": true,
"zh-tw": true,
"tr": true,
"th": true,
"sv": true,
"sl": true,
"sk": true,
"ru": true,
"ro": true,
"pt": true,
"pt-pt": true,
"pl": true,
"nl": true,
"nb": true,
"ko": true,
"kk": true,
"ja": true,
"it": true,
"hu": true,
"hr": true,
"he": true,
"fr": true,
"fi": true,
"es": true,
"el": true,
"de": true,
"da": true,
"cs": true,
"ca": true,
"az": true,
"ar": true
});

},
'dijit/_editor/plugins/EnterKeyHandling':function(){
define("dijit/_editor/plugins/EnterKeyHandling", [
	"dojo/_base/declare", // declare
	"dojo/dom-construct", // domConstruct.destroy domConstruct.place
	"dojo/_base/event", // event.stop
	"dojo/keys", // keys.ENTER
	"dojo/_base/lang",
	"dojo/_base/sniff", // has("ie") has("mozilla") has("webkit")
	"dojo/_base/window", // win.global win.withGlobal
	"dojo/window", // winUtils.scrollIntoView
	"../_Plugin",
	"../RichText",
	"../range",
	"../selection"
], function(declare, domConstruct, event, keys, lang, has, win, winUtils, _Plugin, RichText, rangeapi, selectionapi){

/*=====
	var _Plugin = dijit._editor._Plugin;
=====*/

// module:
//		dijit/_editor/plugins/EnterKeyHandling
// summary:
//		This plugin tries to make all browsers behave consistently with regard to
//		how ENTER behaves in the editor window.  It traps the ENTER key and alters
//		the way DOM is constructed in certain cases to try to commonize the generated
//		DOM and behaviors across browsers.


return declare("dijit._editor.plugins.EnterKeyHandling", _Plugin, {
	// summary:
	//		This plugin tries to make all browsers behave consistently with regard to
	//		how ENTER behaves in the editor window.  It traps the ENTER key and alters
	//		the way DOM is constructed in certain cases to try to commonize the generated
	//		DOM and behaviors across browsers.
	//
	// description:
	//		This plugin has three modes:
	//
	//			* blockNodeForEnter=BR
	//			* blockNodeForEnter=DIV
	//			* blockNodeForEnter=P
	//
	//		In blockNodeForEnter=P, the ENTER key starts a new
	//		paragraph, and shift-ENTER starts a new line in the current paragraph.
	//		For example, the input:
	//
	//		|	first paragraph <shift-ENTER>
	//		|	second line of first paragraph <ENTER>
	//		|	second paragraph
	//
	//		will generate:
	//
	//		|	<p>
	//		|		first paragraph
	//		|		<br/>
	//		|		second line of first paragraph
	//		|	</p>
	//		|	<p>
	//		|		second paragraph
	//		|	</p>
	//
	//		In BR and DIV mode, the ENTER key conceptually goes to a new line in the
	//		current paragraph, and users conceptually create a new paragraph by pressing ENTER twice.
	//		For example, if the user enters text into an editor like this:
	//
	//		|		one <ENTER>
	//		|		two <ENTER>
	//		|		three <ENTER>
	//		|		<ENTER>
	//		|		four <ENTER>
	//		|		five <ENTER>
	//		|		six <ENTER>
	//
	//		It will appear on the screen as two 'paragraphs' of three lines each.  Markupwise, this generates:
	//
	//		BR:
	//		|		one<br/>
	//		|		two<br/>
	//		|		three<br/>
	//		|		<br/>
	//		|		four<br/>
	//		|		five<br/>
	//		|		six<br/>
	//
	//		DIV:
	//		|		<div>one</div>
	//		|		<div>two</div>
	//		|		<div>three</div>
	//		|		<div>&nbsp;</div>
	//		|		<div>four</div>
	//		|		<div>five</div>
	//		|		<div>six</div>

	// blockNodeForEnter: String
	//		This property decides the behavior of Enter key. It can be either P,
	//		DIV, BR, or empty (which means disable this feature). Anything else
	//		will trigger errors.  The default is 'BR'
	//
	//		See class description for more details.
	blockNodeForEnter: 'BR',

	constructor: function(args){
		if(args){
			if("blockNodeForEnter" in args){
				args.blockNodeForEnter = args.blockNodeForEnter.toUpperCase();
			}
			lang.mixin(this,args);
		}
	},

	setEditor: function(editor){
		// Overrides _Plugin.setEditor().
		if(this.editor === editor){ return; }
		this.editor = editor;
		if(this.blockNodeForEnter == 'BR'){
			// While Moz has a mode tht mostly works, it's still a little different,
			// So, try to just have a common mode and be consistent.  Which means
			// we need to enable customUndo, if not already enabled.
			this.editor.customUndo = true;
				editor.onLoadDeferred.then(lang.hitch(this,function(d){
					this.connect(editor.document, "onkeypress", function(e){
						if(e.charOrCode == keys.ENTER){
							// Just do it manually.  The handleEnterKey has a shift mode that
							// Always acts like <br>, so just use it.
							var ne = lang.mixin({},e);
							ne.shiftKey = true;
							if(!this.handleEnterKey(ne)){
								event.stop(e);
							}
						}
					});
					if(has("ie") == 9){
						this.connect(editor.document, "onpaste", function(e){
							setTimeout(dojo.hitch(this, function(){
								// Use the old range/selection code to kick IE 9 into updating
								// its range by moving it back, then forward, one 'character'.
								var r = this.editor.document.selection.createRange();
								r.move('character',-1);
								r.select();
								r.move('character',1);
								r.select();
							}),0);
						});
					}
					return d;
				}));
		}else if(this.blockNodeForEnter){
			// add enter key handler
			// FIXME: need to port to the new event code!!
			var h = lang.hitch(this,this.handleEnterKey);
			editor.addKeyHandler(13, 0, 0, h); //enter
			editor.addKeyHandler(13, 0, 1, h); //shift+enter
			this.connect(this.editor,'onKeyPressed','onKeyPressed');
		}
	},
	onKeyPressed: function(){
		// summary:
		//		Handler for keypress events.
		// tags:
		//		private
		if(this._checkListLater){
			if(win.withGlobal(this.editor.window, 'isCollapsed', dijit)){
				var liparent=win.withGlobal(this.editor.window, 'getAncestorElement', selectionapi, ['LI']);
				if(!liparent){
					// circulate the undo detection code by calling RichText::execCommand directly
					RichText.prototype.execCommand.call(this.editor, 'formatblock',this.blockNodeForEnter);
					// set the innerHTML of the new block node
					var block = win.withGlobal(this.editor.window, 'getAncestorElement', selectionapi, [this.blockNodeForEnter]);
					if(block){
						block.innerHTML=this.bogusHtmlContent;
						if(has("ie")){
							// move to the start by moving backwards one char
							var r = this.editor.document.selection.createRange();
							r.move('character',-1);
							r.select();
						}
					}else{
						console.error('onKeyPressed: Cannot find the new block node'); // FIXME
					}
				}else{
					if(has("mozilla")){
						if(liparent.parentNode.parentNode.nodeName == 'LI'){
							liparent=liparent.parentNode.parentNode;
						}
					}
					var fc=liparent.firstChild;
					if(fc && fc.nodeType == 1 && (fc.nodeName == 'UL' || fc.nodeName == 'OL')){
						liparent.insertBefore(fc.ownerDocument.createTextNode('\xA0'),fc);
						var newrange = rangeapi.create(this.editor.window);
						newrange.setStart(liparent.firstChild,0);
						var selection = rangeapi.getSelection(this.editor.window, true);
						selection.removeAllRanges();
						selection.addRange(newrange);
					}
				}
			}
			this._checkListLater = false;
		}
		if(this._pressedEnterInBlock){
			// the new created is the original current P, so we have previousSibling below
			if(this._pressedEnterInBlock.previousSibling){
				this.removeTrailingBr(this._pressedEnterInBlock.previousSibling);
			}
			delete this._pressedEnterInBlock;
		}
	},

	// bogusHtmlContent: [private] String
	//		HTML to stick into a new empty block
	bogusHtmlContent: '&#160;',		// &nbsp;

	// blockNodes: [private] Regex
	//		Regex for testing if a given tag is a block level (display:block) tag
	blockNodes: /^(?:P|H1|H2|H3|H4|H5|H6|LI)$/,

	handleEnterKey: function(e){
		// summary:
		//		Handler for enter key events when blockNodeForEnter is DIV or P.
		// description:
		//		Manually handle enter key event to make the behavior consistent across
		//		all supported browsers. See class description for details.
		// tags:
		//		private

		var selection, range, newrange, startNode, endNode, brNode, doc=this.editor.document,br,rs,txt;
		if(e.shiftKey){		// shift+enter always generates <br>
			var parent = win.withGlobal(this.editor.window, "getParentElement", selectionapi);
			var header = rangeapi.getAncestor(parent,this.blockNodes);
			if(header){
				if(header.tagName == 'LI'){
					return true; // let browser handle
				}
				selection = rangeapi.getSelection(this.editor.window);
				range = selection.getRangeAt(0);
				if(!range.collapsed){
					range.deleteContents();
					selection = rangeapi.getSelection(this.editor.window);
					range = selection.getRangeAt(0);
				}
				if(rangeapi.atBeginningOfContainer(header, range.startContainer, range.startOffset)){
						br=doc.createElement('br');
						newrange = rangeapi.create(this.editor.window);
						header.insertBefore(br,header.firstChild);
						newrange.setStartAfter(br);
						selection.removeAllRanges();
						selection.addRange(newrange);
				}else if(rangeapi.atEndOfContainer(header, range.startContainer, range.startOffset)){
					newrange = rangeapi.create(this.editor.window);
					br=doc.createElement('br');
						header.appendChild(br);
						header.appendChild(doc.createTextNode('\xA0'));
						newrange.setStart(header.lastChild,0);
					selection.removeAllRanges();
					selection.addRange(newrange);
				}else{
					rs = range.startContainer;
					if(rs && rs.nodeType == 3){
						// Text node, we have to split it.
						txt = rs.nodeValue;
						win.withGlobal(this.editor.window, function(){
							startNode = doc.createTextNode(txt.substring(0, range.startOffset));
							endNode = doc.createTextNode(txt.substring(range.startOffset));
							brNode = doc.createElement("br");

							if(endNode.nodeValue == "" && has("webkit")){
								endNode = doc.createTextNode('\xA0')
							}
							domConstruct.place(startNode, rs, "after");
							domConstruct.place(brNode, startNode, "after");
							domConstruct.place(endNode, brNode, "after");
							domConstruct.destroy(rs);
							newrange = rangeapi.create();
							newrange.setStart(endNode,0);
							selection.removeAllRanges();
							selection.addRange(newrange);
						});
						return false;
					}
					return true; // let browser handle
				}
			}else{
				selection = rangeapi.getSelection(this.editor.window);
				if(selection.rangeCount){
					range = selection.getRangeAt(0);
					if(range && range.startContainer){
						if(!range.collapsed){
							range.deleteContents();
							selection = rangeapi.getSelection(this.editor.window);
							range = selection.getRangeAt(0);
						}
						rs = range.startContainer;
						if(rs && rs.nodeType == 3){
							// Text node, we have to split it.
							win.withGlobal(this.editor.window, lang.hitch(this, function(){
								var endEmpty = false;

								var offset = range.startOffset;
								if(rs.length < offset){
									//We are not splitting the right node, try to locate the correct one
									ret = this._adjustNodeAndOffset(rs, offset);
									rs = ret.node;
									offset = ret.offset;
								}
								txt = rs.nodeValue;

								startNode = doc.createTextNode(txt.substring(0, offset));
								endNode = doc.createTextNode(txt.substring(offset));
								brNode = doc.createElement("br");

								if(!endNode.length){
									endNode = doc.createTextNode('\xA0');
									endEmpty = true;
								}

								if(startNode.length){
									domConstruct.place(startNode, rs, "after");
								}else{
									startNode = rs;
								}
								domConstruct.place(brNode, startNode, "after");
								domConstruct.place(endNode, brNode, "after");
								domConstruct.destroy(rs);
								newrange = rangeapi.create();
								newrange.setStart(endNode,0);
								newrange.setEnd(endNode, endNode.length);
								selection.removeAllRanges();
								selection.addRange(newrange);
								if(endEmpty && !has("webkit")){
									selectionapi.remove();
								}else{
									selectionapi.collapse(true);
								}
							}));
						}else{
							var targetNode;
							if(range.startOffset >= 0){
								targetNode = rs.childNodes[range.startOffset];
							}
							win.withGlobal(this.editor.window, lang.hitch(this, function(){
								var brNode = doc.createElement("br");
								var endNode = doc.createTextNode('\xA0');
								if(!targetNode){
									rs.appendChild(brNode);
									rs.appendChild(endNode);
								}else{
									domConstruct.place(brNode, targetNode, "before");
									domConstruct.place(endNode, brNode, "after");
								}
								newrange = rangeapi.create(win.global);
								newrange.setStart(endNode,0);
								newrange.setEnd(endNode, endNode.length);
								selection.removeAllRanges();
								selection.addRange(newrange);
								selectionapi.collapse(true);
							}));
						}
					}
				}else{
					// don't change this: do not call this.execCommand, as that may have other logic in subclass
					RichText.prototype.execCommand.call(this.editor, 'inserthtml', '<br>');
				}
			}
			return false;
		}
		var _letBrowserHandle = true;

		// first remove selection
		selection = rangeapi.getSelection(this.editor.window);
		range = selection.getRangeAt(0);
		if(!range.collapsed){
			range.deleteContents();
			selection = rangeapi.getSelection(this.editor.window);
			range = selection.getRangeAt(0);
		}

		var block = rangeapi.getBlockAncestor(range.endContainer, null, this.editor.editNode);
		var blockNode = block.blockNode;

		// if this is under a LI or the parent of the blockNode is LI, just let browser to handle it
		if((this._checkListLater = (blockNode && (blockNode.nodeName == 'LI' || blockNode.parentNode.nodeName == 'LI')))){
			if(has("mozilla")){
				// press enter in middle of P may leave a trailing <br/>, let's remove it later
				this._pressedEnterInBlock = blockNode;
			}
			// if this li only contains spaces, set the content to empty so the browser will outdent this item
			if(/^(\s|&nbsp;|&#160;|\xA0|<span\b[^>]*\bclass=['"]Apple-style-span['"][^>]*>(\s|&nbsp;|&#160;|\xA0)<\/span>)?(<br>)?$/.test(blockNode.innerHTML)){
				// empty LI node
				blockNode.innerHTML = '';
				if(has("webkit")){ // WebKit tosses the range when innerHTML is reset
					newrange = rangeapi.create(this.editor.window);
					newrange.setStart(blockNode, 0);
					selection.removeAllRanges();
					selection.addRange(newrange);
				}
				this._checkListLater = false; // nothing to check since the browser handles outdent
			}
			return true;
		}

		// text node directly under body, let's wrap them in a node
		if(!block.blockNode || block.blockNode===this.editor.editNode){
			try{
				RichText.prototype.execCommand.call(this.editor, 'formatblock',this.blockNodeForEnter);
			}catch(e2){ /*squelch FF3 exception bug when editor content is a single BR*/ }
			// get the newly created block node
			// FIXME
			block = {blockNode:win.withGlobal(this.editor.window, "getAncestorElement", selectionapi, [this.blockNodeForEnter]),
					blockContainer: this.editor.editNode};
			if(block.blockNode){
				if(block.blockNode != this.editor.editNode &&
					(!(block.blockNode.textContent || block.blockNode.innerHTML).replace(/^\s+|\s+$/g, "").length)){
					this.removeTrailingBr(block.blockNode);
					return false;
				}
			}else{	// we shouldn't be here if formatblock worked
				block.blockNode = this.editor.editNode;
			}
			selection = rangeapi.getSelection(this.editor.window);
			range = selection.getRangeAt(0);
		}

		var newblock = doc.createElement(this.blockNodeForEnter);
		newblock.innerHTML=this.bogusHtmlContent;
		this.removeTrailingBr(block.blockNode);
		var endOffset = range.endOffset;
		var node = range.endContainer;
		if(node.length < endOffset){
			//We are not checking the right node, try to locate the correct one
			var ret = this._adjustNodeAndOffset(node, endOffset);
			node = ret.node;
			endOffset = ret.offset;
		}
		if(rangeapi.atEndOfContainer(block.blockNode, node, endOffset)){
			if(block.blockNode === block.blockContainer){
				block.blockNode.appendChild(newblock);
			}else{
				domConstruct.place(newblock, block.blockNode, "after");
			}
			_letBrowserHandle = false;
			// lets move caret to the newly created block
			newrange = rangeapi.create(this.editor.window);
			newrange.setStart(newblock, 0);
			selection.removeAllRanges();
			selection.addRange(newrange);
			if(this.editor.height){
				winUtils.scrollIntoView(newblock);
			}
		}else if(rangeapi.atBeginningOfContainer(block.blockNode,
				range.startContainer, range.startOffset)){
			domConstruct.place(newblock, block.blockNode, block.blockNode === block.blockContainer ? "first" : "before");
			if(newblock.nextSibling && this.editor.height){
				// position input caret - mostly WebKit needs this
				newrange = rangeapi.create(this.editor.window);
				newrange.setStart(newblock.nextSibling, 0);
				selection.removeAllRanges();
				selection.addRange(newrange);
				// browser does not scroll the caret position into view, do it manually
				winUtils.scrollIntoView(newblock.nextSibling);
			}
			_letBrowserHandle = false;
		}else{ //press enter in the middle of P/DIV/Whatever/
			if(block.blockNode === block.blockContainer){
				block.blockNode.appendChild(newblock);
			}else{
				domConstruct.place(newblock, block.blockNode, "after");
			}
			_letBrowserHandle = false;

			// Clone any block level styles.
			if(block.blockNode.style){
				if(newblock.style){
					if(block.blockNode.style.cssText){
						newblock.style.cssText = block.blockNode.style.cssText;
					}
				}
			}

			// Okay, we probably have to split.
			rs = range.startContainer;
			var firstNodeMoved;
			if(rs && rs.nodeType == 3){
				// Text node, we have to split it.
				var nodeToMove, tNode;
				endOffset = range.endOffset;
				if(rs.length < endOffset){
					//We are not splitting the right node, try to locate the correct one
					ret = this._adjustNodeAndOffset(rs, endOffset);
					rs = ret.node;
					endOffset = ret.offset;
				}

				txt = rs.nodeValue;
				startNode = doc.createTextNode(txt.substring(0, endOffset));
				endNode = doc.createTextNode(txt.substring(endOffset, txt.length));

				// Place the split, then remove original nodes.
				domConstruct.place(startNode, rs, "before");
				domConstruct.place(endNode, rs, "after");
				domConstruct.destroy(rs);

				// Okay, we split the text.  Now we need to see if we're
				// parented to the block element we're splitting and if
				// not, we have to split all the way up.  Ugh.
				var parentC = startNode.parentNode;
				while(parentC !== block.blockNode){
					var tg = parentC.tagName;
					var newTg = doc.createElement(tg);
					// Clone over any 'style' data.
					if(parentC.style){
						if(newTg.style){
							if(parentC.style.cssText){
								newTg.style.cssText = parentC.style.cssText;
							}
						}
					}
					// If font also need to clone over any font data.
					if(parentC.tagName === "FONT"){
						if(parentC.color){
							newTg.color = parentC.color;
						}
						if(parentC.face){
							newTg.face = parentC.face;
						}
						if(parentC.size){  // this check was necessary on IE
							newTg.size = parentC.size;
						}
					}

					nodeToMove = endNode;
					while(nodeToMove){
						tNode = nodeToMove.nextSibling;
						newTg.appendChild(nodeToMove);
						nodeToMove = tNode;
					}
					domConstruct.place(newTg, parentC, "after");
					startNode = parentC;
					endNode = newTg;
					parentC = parentC.parentNode;
				}

				// Lastly, move the split out tags to the new block.
				// as they should now be split properly.
				nodeToMove = endNode;
				if(nodeToMove.nodeType == 1 || (nodeToMove.nodeType == 3 && nodeToMove.nodeValue)){
					// Non-blank text and non-text nodes need to clear out that blank space
					// before moving the contents.
					newblock.innerHTML = "";
				}
				firstNodeMoved = nodeToMove;
				while(nodeToMove){
					tNode = nodeToMove.nextSibling;
					newblock.appendChild(nodeToMove);
					nodeToMove = tNode;
				}
			}

			//lets move caret to the newly created block
			newrange = rangeapi.create(this.editor.window);
			var nodeForCursor;
			var innerMostFirstNodeMoved = firstNodeMoved;
			if(this.blockNodeForEnter !== 'BR'){
				while(innerMostFirstNodeMoved){
					nodeForCursor = innerMostFirstNodeMoved;
					tNode = innerMostFirstNodeMoved.firstChild;
					innerMostFirstNodeMoved = tNode;
				}
				if(nodeForCursor && nodeForCursor.parentNode){
					newblock = nodeForCursor.parentNode;
					newrange.setStart(newblock, 0);
					selection.removeAllRanges();
					selection.addRange(newrange);
					if(this.editor.height){
						winUtils.scrollIntoView(newblock);
					}
					if(has("mozilla")){
						// press enter in middle of P may leave a trailing <br/>, let's remove it later
						this._pressedEnterInBlock = block.blockNode;
					}
				}else{
					_letBrowserHandle = true;
				}
			}else{
				newrange.setStart(newblock, 0);
				selection.removeAllRanges();
				selection.addRange(newrange);
				if(this.editor.height){
					winUtils.scrollIntoView(newblock);
				}
				if(has("mozilla")){
					// press enter in middle of P may leave a trailing <br/>, let's remove it later
					this._pressedEnterInBlock = block.blockNode;
				}
			}
		}
		return _letBrowserHandle;
	},

	_adjustNodeAndOffset: function(/*DomNode*/node, /*Int*/offset){
		// summary:
		//              In the case there are multiple text nodes in a row the offset may not be within the node.  If the offset is larger than the node length, it will attempt to find
		//              the next text sibling until it locates the text node in which the offset refers to
		// node:
		//              The node to check.
		// offset:
		//              The position to find within the text node
		// tags:
		//              private.
		while(node.length < offset && node.nextSibling && node.nextSibling.nodeType==3){
			//Adjust the offset and node in the case of multiple text nodes in a row
			offset = offset - node.length;
			node = node.nextSibling;
		}
		return {"node": node, "offset": offset};
	},

	removeTrailingBr: function(container){
		// summary:
		//		If last child of container is a <br>, then remove it.
		// tags:
		//		private
		var para = /P|DIV|LI/i.test(container.tagName) ?
			container : selectionapi.getParentOfType(container,['P','DIV','LI']);

		if(!para){ return; }
		if(para.lastChild){
			if((para.childNodes.length > 1 && para.lastChild.nodeType == 3 && /^[\s\xAD]*$/.test(para.lastChild.nodeValue)) ||
				para.lastChild.tagName=='BR'){

				domConstruct.destroy(para.lastChild);
			}
		}
		if(!para.childNodes.length){
			para.innerHTML=this.bogusHtmlContent;
		}
	}
});

});

},
'dijit/form/_ComboBoxMenuMixin':function(){
define("dijit/form/_ComboBoxMenuMixin", [
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.set
	"dojo/i18n", // i18n.getLocalization
	"dojo/_base/window", // win.doc.createTextNode
	"dojo/i18n!./nls/ComboBox"
], function(array, declare, domAttr, i18n, win){

// module:
//		dijit/form/_ComboBoxMenuMixin
// summary:
//		Focus-less menu for internal use in `dijit.form.ComboBox`

return declare( "dijit.form._ComboBoxMenuMixin", null, {
	// summary:
	//		Focus-less menu for internal use in `dijit.form.ComboBox`
	// tags:
	//		private

	// _messages: Object
	//		Holds "next" and "previous" text for paging buttons on drop down
	_messages: null,

	postMixInProperties: function(){
		this.inherited(arguments);
		this._messages = i18n.getLocalization("dijit.form", "ComboBox", this.lang);
	},

	buildRendering: function(){
		this.inherited(arguments);

		// fill in template with i18n messages
		this.previousButton.innerHTML = this._messages["previousMessage"];
		this.nextButton.innerHTML = this._messages["nextMessage"];
	},

	_setValueAttr: function(/*Object*/ value){
		this.value = value;
		this.onChange(value);
	},

	onClick: function(/*DomNode*/ node){
		if(node == this.previousButton){
			this._setSelectedAttr(null);
			this.onPage(-1);
		}else if(node == this.nextButton){
			this._setSelectedAttr(null);
			this.onPage(1);
		}else{
			this.onChange(node);
		}
	},

	// stubs
	onChange: function(/*Number*/ /*===== direction =====*/){
		// summary:
		//		Notifies ComboBox/FilteringSelect that user selected an option.
		// tags:
		//		callback
	},

	onPage: function(/*Number*/ /*===== direction =====*/){
		// summary:
		//		Notifies ComboBox/FilteringSelect that user clicked to advance to next/previous page.
		// tags:
		//		callback
	},

	onClose: function(){
		// summary:
		//		Callback from dijit.popup code to this widget, notifying it that it closed
		// tags:
		//		private
		this._setSelectedAttr(null);
	},

	_createOption: function(/*Object*/ item, labelFunc){
		// summary:
		//		Creates an option to appear on the popup menu subclassed by
		//		`dijit.form.FilteringSelect`.

		var menuitem = this._createMenuItem();
		var labelObject = labelFunc(item);
		if(labelObject.html){
			menuitem.innerHTML = labelObject.label;
		}else{
			menuitem.appendChild(
				win.doc.createTextNode(labelObject.label)
			);
		}
		// #3250: in blank options, assign a normal height
		if(menuitem.innerHTML == ""){
			menuitem.innerHTML = "&#160;";	// &nbsp;
		}

		// update menuitem.dir if BidiSupport was required
		this.applyTextDir(menuitem, (menuitem.innerText || menuitem.textContent || ""));

		menuitem.item=item;
		return menuitem;
	},

	createOptions: function(results, options, labelFunc){
		// summary:
		//		Fills in the items in the drop down list
		// results:
		//		Array of items
		// options:
		//		The options to the query function of the store
		//
		// labelFunc:
		//		Function to produce a label in the drop down list from a dojo.data item

		// display "Previous . . ." button
		this.previousButton.style.display = (options.start == 0) ? "none" : "";
		domAttr.set(this.previousButton, "id", this.id + "_prev");
		// create options using _createOption function defined by parent
		// ComboBox (or FilteringSelect) class
		// #2309:
		//		iterate over cache nondestructively
		array.forEach(results, function(item, i){
			var menuitem = this._createOption(item, labelFunc);
			domAttr.set(menuitem, "id", this.id + i);
			this.nextButton.parentNode.insertBefore(menuitem, this.nextButton);
		}, this);
		// display "Next . . ." button
		var displayMore = false;
		// Try to determine if we should show 'more'...
		if(results.total && !results.total.then && results.total != -1){
			if((options.start + options.count) < results.total){
				displayMore = true;
			}else if((options.start + options.count) > results.total && options.count == results.length){
				// Weird return from a data store, where a start + count > maxOptions
				// implies maxOptions isn't really valid and we have to go into faking it.
				// And more or less assume more if count == results.length
				displayMore = true;
			}
		}else if(options.count == results.length){
			//Don't know the size, so we do the best we can based off count alone.
			//So, if we have an exact match to count, assume more.
			displayMore = true;
		}

		this.nextButton.style.display = displayMore ? "" : "none";
		domAttr.set(this.nextButton,"id", this.id + "_next");
		return this.containerNode.childNodes;
	},

	clearResultList: function(){
		// summary:
		//		Clears the entries in the drop down list, but of course keeps the previous and next buttons.
		var container = this.containerNode;
		while(container.childNodes.length > 2){
			container.removeChild(container.childNodes[container.childNodes.length-2]);
		}
		this._setSelectedAttr(null);
	},

	highlightFirstOption: function(){
		// summary:
		//		Highlight the first real item in the list (not Previous Choices).
		this.selectFirstNode();
	},

	highlightLastOption: function(){
		// summary:
		//		Highlight the last real item in the list (not More Choices).
		this.selectLastNode();
	},

	selectFirstNode: function(){
		this.inherited(arguments);
		if(this.getHighlightedOption() == this.previousButton){
			this.selectNextNode();
		}
	},

	selectLastNode: function(){
		this.inherited(arguments);
		if(this.getHighlightedOption() == this.nextButton){
			this.selectPreviousNode();
		}
	},

	getHighlightedOption: function(){
		return this._getSelectedAttr();
	}
});

});

},
'dijit/form/NumberSpinner':function(){
define("dijit/form/NumberSpinner", [
	"dojo/_base/declare", // declare
	"dojo/_base/event", // event.stop
	"dojo/keys", // keys.END keys.HOME
	"./_Spinner",
	"./NumberTextBox"
], function(declare, event, keys, _Spinner, NumberTextBox){

/*=====
	var _Spinner = dijit.form._Spinner;
	var NumberTextBox = dijit.form.NumberTextBox;
=====*/

// module:
//		dijit/form/NumberSpinner
// summary:
//		Extends NumberTextBox to add up/down arrows and pageup/pagedown for incremental change to the value


return declare("dijit.form.NumberSpinner", [_Spinner, NumberTextBox.Mixin], {
	// summary:
	//		Extends NumberTextBox to add up/down arrows and pageup/pagedown for incremental change to the value
	//
	// description:
	//		A `dijit.form.NumberTextBox` extension to provide keyboard accessible value selection
	//		as well as icons for spinning direction. When using the keyboard, the typematic rules
	//		apply, meaning holding the key will gradually increase or decrease the value and
	// 		accelerate.
	//
	// example:
	//	| new dijit.form.NumberSpinner({ constraints:{ max:300, min:100 }}, "someInput");

	adjust: function(/*Object*/ val, /*Number*/ delta){
		// summary:
		//		Change Number val by the given amount
		// tags:
		//		protected

		var tc = this.constraints,
			v = isNaN(val),
			gotMax = !isNaN(tc.max),
			gotMin = !isNaN(tc.min)
		;
		if(v && delta != 0){ // blank or invalid value and they want to spin, so create defaults
			val = (delta > 0) ?
				gotMin ? tc.min : gotMax ? tc.max : 0 :
				gotMax ? this.constraints.max : gotMin ? tc.min : 0
			;
		}
		var newval = val + delta;
		if(v || isNaN(newval)){ return val; }
		if(gotMax && (newval > tc.max)){
			newval = tc.max;
		}
		if(gotMin && (newval < tc.min)){
			newval = tc.min;
		}
		return newval;
	},

	_onKeyPress: function(e){
		if((e.charOrCode == keys.HOME || e.charOrCode == keys.END) && !(e.ctrlKey || e.altKey || e.metaKey)
		&& typeof this.get('value') != 'undefined' /* gibberish, so HOME and END are default editing keys*/){
			var value = this.constraints[(e.charOrCode == keys.HOME ? "min" : "max")];
			if(typeof value == "number"){
				this._setValueAttr(value, false);
			}
			// eat home or end key whether we change the value or not
			event.stop(e);
		}
	}
});

});

},
'dijit/form/DateTextBox':function(){
define("dijit/form/DateTextBox", [
	"dojo/_base/declare", // declare
	"../Calendar",
	"./_DateTimeTextBox"
], function(declare, Calendar, _DateTimeTextBox){

/*=====
	var Calendar = dijit.Calendar;
	var _DateTimeTextBox = dijit.form._DateTimeTextBox;
=====*/

	// module:
	//		dijit/form/DateTextBox
	// summary:
	//		A validating, serializable, range-bound date text box with a drop down calendar


	return declare("dijit.form.DateTextBox", _DateTimeTextBox, {
		// summary:
		//		A validating, serializable, range-bound date text box with a drop down calendar
		//
		//		Example:
		// |	new dijit.form.DateTextBox({value: new Date(2009, 0, 20)})
		//
		//		Example:
		// |	<input data-dojo-type='dijit.form.DateTextBox' value='2009-01-20'>

		baseClass: "dijitTextBox dijitComboBox dijitDateTextBox",
		popupClass: Calendar,
		_selector: "date",

		// value: Date
		//		The value of this widget as a JavaScript Date object, with only year/month/day specified.
		//		If specified in markup, use the format specified in `stamp.fromISOString`.
		//		set("value", ...) accepts either a Date object or a string.
		value: new Date("")	// value.toString()="NaN"
	});
});

},
'url:dijit/templates/Calendar.html':"<table cellspacing=\"0\" cellpadding=\"0\" class=\"dijitCalendarContainer\" role=\"grid\" aria-labelledby=\"${id}_mddb ${id}_year\">\r\n\t<thead>\r\n\t\t<tr class=\"dijitReset dijitCalendarMonthContainer\" valign=\"top\">\r\n\t\t\t<th class='dijitReset dijitCalendarArrow' data-dojo-attach-point=\"decrementMonth\">\r\n\t\t\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitCalendarIncrementControl dijitCalendarDecrease\" role=\"presentation\"/>\r\n\t\t\t\t<span data-dojo-attach-point=\"decreaseArrowNode\" class=\"dijitA11ySideArrow\">-</span>\r\n\t\t\t</th>\r\n\t\t\t<th class='dijitReset' colspan=\"5\">\r\n\t\t\t\t<div data-dojo-attach-point=\"monthNode\">\r\n\t\t\t\t</div>\r\n\t\t\t</th>\r\n\t\t\t<th class='dijitReset dijitCalendarArrow' data-dojo-attach-point=\"incrementMonth\">\r\n\t\t\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitCalendarIncrementControl dijitCalendarIncrease\" role=\"presentation\"/>\r\n\t\t\t\t<span data-dojo-attach-point=\"increaseArrowNode\" class=\"dijitA11ySideArrow\">+</span>\r\n\t\t\t</th>\r\n\t\t</tr>\r\n\t\t<tr>\r\n\t\t\t${!dayCellsHtml}\r\n\t\t</tr>\r\n\t</thead>\r\n\t<tbody data-dojo-attach-point=\"dateRowsNode\" data-dojo-attach-event=\"onclick: _onDayClick\" class=\"dijitReset dijitCalendarBodyContainer\">\r\n\t\t\t${!dateRowsHtml}\r\n\t</tbody>\r\n\t<tfoot class=\"dijitReset dijitCalendarYearContainer\">\r\n\t\t<tr>\r\n\t\t\t<td class='dijitReset' valign=\"top\" colspan=\"7\" role=\"presentation\">\r\n\t\t\t\t<div class=\"dijitCalendarYearLabel\">\r\n\t\t\t\t\t<span data-dojo-attach-point=\"previousYearLabelNode\" class=\"dijitInline dijitCalendarPreviousYear\" role=\"button\"></span>\r\n\t\t\t\t\t<span data-dojo-attach-point=\"currentYearLabelNode\" class=\"dijitInline dijitCalendarSelectedYear\" role=\"button\" id=\"${id}_year\"></span>\r\n\t\t\t\t\t<span data-dojo-attach-point=\"nextYearLabelNode\" class=\"dijitInline dijitCalendarNextYear\" role=\"button\"></span>\r\n\t\t\t\t</div>\r\n\t\t\t</td>\r\n\t\t</tr>\r\n\t</tfoot>\r\n</table>\r\n",
'dijit/form/_AutoCompleterMixin':function(){
define("dijit/form/_AutoCompleterMixin", [
	"dojo/_base/connect", // keys keys.SHIFT
	"dojo/data/util/filter", // patternToRegExp
	"dojo/_base/declare", // declare
	"dojo/_base/Deferred", // Deferred.when
	"dojo/dom-attr", // domAttr.get
	"dojo/_base/event", // event.stop
	"dojo/keys",
	"dojo/_base/lang", // lang.clone lang.hitch
	"dojo/query", // query
	"dojo/regexp", // regexp.escapeString
	"dojo/_base/sniff", // has("ie")
	"dojo/string", // string.substitute
	"dojo/_base/window", // win.doc.selection.createRange
	"./DataList",
	"../registry",	// registry.byId
	"./_TextBoxMixin"	// defines _TextBoxMixin.selectInputText
], function(connect, filter, declare, Deferred, domAttr, event, keys, lang, query, regexp, has, string, win,
			DataList, registry, _TextBoxMixin){

	// module:
	//		dijit/form/_AutoCompleterMixin
	// summary:
	//		A mixin that implements the base functionality for `dijit.form.ComboBox`/`dijit.form.FilteringSelect`


	return declare("dijit.form._AutoCompleterMixin", null, {
		// summary:
		//		A mixin that implements the base functionality for `dijit.form.ComboBox`/`dijit.form.FilteringSelect`
		// description:
		//		All widgets that mix in dijit.form._AutoCompleterMixin must extend `dijit.form._FormValueWidget`.
		// tags:
		//		protected

		// item: Object
		//		This is the item returned by the dojo.data.store implementation that
		//		provides the data for this ComboBox, it's the currently selected item.
		item: null,

		// pageSize: Integer
		//		Argument to data provider.
		//		Specifies number of search results per page (before hitting "next" button)
		pageSize: Infinity,

		// store: [const] dojo.store.api.Store
		//		Reference to data provider object used by this ComboBox
		store: null,

		// fetchProperties: Object
		//		Mixin to the store's fetch.
		//		For example, to set the sort order of the ComboBox menu, pass:
		//	|	{ sort: [{attribute:"name",descending: true}] }
		//		To override the default queryOptions so that deep=false, do:
		//	|	{ queryOptions: {ignoreCase: true, deep: false} }
		fetchProperties:{},

		// query: Object
		//		A query that can be passed to 'store' to initially filter the items,
		//		before doing further filtering based on `searchAttr` and the key.
		//		Any reference to the `searchAttr` is ignored.
		query: {},

		// autoComplete: Boolean
		//		If user types in a partial string, and then tab out of the `<input>` box,
		//		automatically copy the first entry displayed in the drop down list to
		//		the `<input>` field
		autoComplete: true,

		// highlightMatch: String
		// 		One of: "first", "all" or "none".
		//
		//		If the ComboBox/FilteringSelect opens with the search results and the searched
		//		string can be found, it will be highlighted.  If set to "all"
		//		then will probably want to change `queryExpr` parameter to '*${0}*'
		//
		//		Highlighting is only performed when `labelType` is "text", so as to not
		//		interfere with any HTML markup an HTML label might contain.
		highlightMatch: "first",

		// searchDelay: Integer
		//		Delay in milliseconds between when user types something and we start
		//		searching based on that value
		searchDelay: 100,

		// searchAttr: String
		//		Search for items in the data store where this attribute (in the item)
		//		matches what the user typed
		searchAttr: "name",

		// labelAttr: String?
		//		The entries in the drop down list come from this attribute in the
		//		dojo.data items.
		//		If not specified, the searchAttr attribute is used instead.
		labelAttr: "",

		// labelType: String
		//		Specifies how to interpret the labelAttr in the data store items.
		//		Can be "html" or "text".
		labelType: "text",

		// queryExpr: String
		//		This specifies what query ComboBox/FilteringSelect sends to the data store,
		//		based on what the user has typed.  Changing this expression will modify
		//		whether the drop down shows only exact matches, a "starting with" match,
		//		etc.  Use it in conjunction with highlightMatch.
		//		dojo.data query expression pattern.
		//		`${0}` will be substituted for the user text.
		//		`*` is used for wildcards.
		//		`${0}*` means "starts with", `*${0}*` means "contains", `${0}` means "is"
		queryExpr: "${0}*",

		// ignoreCase: Boolean
		//		Set true if the ComboBox/FilteringSelect should ignore case when matching possible items
		ignoreCase: true,

		// Flags to _HasDropDown to limit height of drop down to make it fit in viewport
		maxHeight: -1,

		// For backwards compatibility let onClick events propagate, even clicks on the down arrow button
		_stopClickEvents: false,

		_getCaretPos: function(/*DomNode*/ element){
			// khtml 3.5.2 has selection* methods as does webkit nightlies from 2005-06-22
			var pos = 0;
			if(typeof(element.selectionStart) == "number"){
				// FIXME: this is totally borked on Moz < 1.3. Any recourse?
				pos = element.selectionStart;
			}else if(has("ie")){
				// in the case of a mouse click in a popup being handled,
				// then the win.doc.selection is not the textarea, but the popup
				// var r = win.doc.selection.createRange();
				// hack to get IE 6 to play nice. What a POS browser.
				var tr = win.doc.selection.createRange().duplicate();
				var ntr = element.createTextRange();
				tr.move("character",0);
				ntr.move("character",0);
				try{
					// If control doesn't have focus, you get an exception.
					// Seems to happen on reverse-tab, but can also happen on tab (seems to be a race condition - only happens sometimes).
					// There appears to be no workaround for this - googled for quite a while.
					ntr.setEndPoint("EndToEnd", tr);
					pos = String(ntr.text).replace(/\r/g,"").length;
				}catch(e){
					// If focus has shifted, 0 is fine for caret pos.
				}
			}
			return pos;
		},

		_setCaretPos: function(/*DomNode*/ element, /*Number*/ location){
			location = parseInt(location);
			_TextBoxMixin.selectInputText(element, location, location);
		},

		_setDisabledAttr: function(/*Boolean*/ value){
			// Additional code to set disabled state of ComboBox node.
			// Overrides _FormValueWidget._setDisabledAttr() or ValidationTextBox._setDisabledAttr().
			this.inherited(arguments);
			this.domNode.setAttribute("aria-disabled", value);
		},

		_abortQuery: function(){
			// stop in-progress query
			if(this.searchTimer){
				clearTimeout(this.searchTimer);
				this.searchTimer = null;
			}
			if(this._fetchHandle){
				if(this._fetchHandle.cancel){
					this._cancelingQuery = true;
					this._fetchHandle.cancel();
					this._cancelingQuery = false;
				}
				this._fetchHandle = null;
			}
		},

		_onInput: function(/*Event*/ evt){
			// summary:
			//		Handles paste events
			this.inherited(arguments);
			if(evt.charOrCode == 229){ // IME or cut/paste event
				this._onKey(evt);
			}
		},

		_onKey: function(/*Event*/ evt){
			// summary:
			//		Handles keyboard events

			var key = evt.charOrCode;

			// except for cutting/pasting case - ctrl + x/v
			if(evt.altKey || ((evt.ctrlKey || evt.metaKey) && (key != 'x' && key != 'v')) || key == keys.SHIFT){
				return; // throw out weird key combinations and spurious events
			}

			var doSearch = false;
			var pw = this.dropDown;
			var highlighted = null;
			this._prev_key_backspace = false;
			this._abortQuery();

			// _HasDropDown will do some of the work:
			//		1. when drop down is not yet shown:
			//			- if user presses the down arrow key, call loadDropDown()
			//		2. when drop down is already displayed:
			//			- on ESC key, call closeDropDown()
			//			- otherwise, call dropDown.handleKey() to process the keystroke
			this.inherited(arguments);

			if(this._opened){
				highlighted = pw.getHighlightedOption();
			}
			switch(key){
				case keys.PAGE_DOWN:
				case keys.DOWN_ARROW:
				case keys.PAGE_UP:
				case keys.UP_ARROW:
					// Keystroke caused ComboBox_menu to move to a different item.
					// Copy new item to <input> box.
					if(this._opened){
						this._announceOption(highlighted);
					}
					event.stop(evt);
					break;

				case keys.ENTER:
					// prevent submitting form if user presses enter. Also
					// prevent accepting the value if either Next or Previous
					// are selected
					if(highlighted){
						// only stop event on prev/next
						if(highlighted == pw.nextButton){
							this._nextSearch(1);
							event.stop(evt);
							break;
						}else if(highlighted == pw.previousButton){
							this._nextSearch(-1);
							event.stop(evt);
							break;
						}
					}else{
						// Update 'value' (ex: KY) according to currently displayed text
						this._setBlurValue(); // set value if needed
						this._setCaretPos(this.focusNode, this.focusNode.value.length); // move cursor to end and cancel highlighting
					}
					// default case:
					// if enter pressed while drop down is open, or for FilteringSelect,
					// if we are in the middle of a query to convert a directly typed in value to an item,
					// prevent submit
					if(this._opened || this._fetchHandle){
						event.stop(evt);
					}
					// fall through

				case keys.TAB:
					var newvalue = this.get('displayedValue');
					//	if the user had More Choices selected fall into the
					//	_onBlur handler
					if(pw && (
						newvalue == pw._messages["previousMessage"] ||
						newvalue == pw._messages["nextMessage"])
					){
						break;
					}
					if(highlighted){
						this._selectOption(highlighted);
					}
					// fall through

				case keys.ESCAPE:
					if(this._opened){
						this._lastQuery = null; // in case results come back later
						this.closeDropDown();
					}
					break;

				case ' ':
					if(highlighted){
						// user is effectively clicking a choice in the drop down menu
						event.stop(evt);
						this._selectOption(highlighted);
						this.closeDropDown();
					}else{
						// user typed a space into the input box, treat as normal character
						doSearch = true;
					}
					break;

				case keys.DELETE:
				case keys.BACKSPACE:
					this._prev_key_backspace = true;
					doSearch = true;
					break;

				default:
					// Non char keys (F1-F12 etc..)  shouldn't open list.
					// Ascii characters and IME input (Chinese, Japanese etc.) should.
					//IME input produces keycode == 229.
					doSearch = typeof key == 'string' || key == 229;
			}
			if(doSearch){
				// need to wait a tad before start search so that the event
				// bubbles through DOM and we have value visible
				this.item = undefined; // undefined means item needs to be set
				this.searchTimer = setTimeout(lang.hitch(this, "_startSearchFromInput"),1);
			}
		},

		_autoCompleteText: function(/*String*/ text){
			// summary:
			// 		Fill in the textbox with the first item from the drop down
			// 		list, and highlight the characters that were
			// 		auto-completed. For example, if user typed "CA" and the
			// 		drop down list appeared, the textbox would be changed to
			// 		"California" and "ifornia" would be highlighted.

			var fn = this.focusNode;

			// IE7: clear selection so next highlight works all the time
			_TextBoxMixin.selectInputText(fn, fn.value.length);
			// does text autoComplete the value in the textbox?
			var caseFilter = this.ignoreCase? 'toLowerCase' : 'substr';
			if(text[caseFilter](0).indexOf(this.focusNode.value[caseFilter](0)) == 0){
				var cpos = this.autoComplete ? this._getCaretPos(fn) : fn.value.length;
				// only try to extend if we added the last character at the end of the input
				if((cpos+1) > fn.value.length){
					// only add to input node as we would overwrite Capitalisation of chars
					// actually, that is ok
					fn.value = text;//.substr(cpos);
					// visually highlight the autocompleted characters
					_TextBoxMixin.selectInputText(fn, cpos);
				}
			}else{
				// text does not autoComplete; replace the whole value and highlight
				fn.value = text;
				_TextBoxMixin.selectInputText(fn);
			}
		},

		_openResultList: function(/*Object*/ results, /*Object*/ query, /*Object*/ options){
			// summary:
			//		Callback when a search completes.
			// description:
			//		1. generates drop-down list and calls _showResultList() to display it
			//		2. if this result list is from user pressing "more choices"/"previous choices"
			//			then tell screen reader to announce new option
			this._fetchHandle = null;
			if(	this.disabled ||
				this.readOnly ||
				(query[this.searchAttr] !== this._lastQuery)	// TODO: better way to avoid getting unwanted notify
			){
				return;
			}
			var wasSelected = this.dropDown.getHighlightedOption();
			this.dropDown.clearResultList();
			if(!results.length && options.start == 0){ // if no results and not just the previous choices button
				this.closeDropDown();
				return;
			}

			// Fill in the textbox with the first item from the drop down list,
			// and highlight the characters that were auto-completed. For
			// example, if user typed "CA" and the drop down list appeared, the
			// textbox would be changed to "California" and "ifornia" would be
			// highlighted.

			var nodes = this.dropDown.createOptions(
				results,
				options,
				lang.hitch(this, "_getMenuLabelFromItem")
			);

			// show our list (only if we have content, else nothing)
			this._showResultList();

			// #4091:
			//		tell the screen reader that the paging callback finished by
			//		shouting the next choice
			if(options.direction){
				if(1 == options.direction){
					this.dropDown.highlightFirstOption();
				}else if(-1 == options.direction){
					this.dropDown.highlightLastOption();
				}
				if(wasSelected){
					this._announceOption(this.dropDown.getHighlightedOption());
				}
			}else if(this.autoComplete && !this._prev_key_backspace
				// when the user clicks the arrow button to show the full list,
				// startSearch looks for "*".
				// it does not make sense to autocomplete
				// if they are just previewing the options available.
				&& !/^[*]+$/.test(query[this.searchAttr].toString())){
					this._announceOption(nodes[1]); // 1st real item
			}
		},

		_showResultList: function(){
			// summary:
			//		Display the drop down if not already displayed, or if it is displayed, then
			//		reposition it if necessary (reposition may be necessary if drop down's height changed).
			this.closeDropDown(true);
			this.openDropDown();
			this.domNode.setAttribute("aria-expanded", "true");
		},

		loadDropDown: function(/*Function*/ /*===== callback =====*/){
			// Overrides _HasDropDown.loadDropDown().
			// This is called when user has pressed button icon or pressed the down arrow key
			// to open the drop down.

			this._startSearchAll();
		},

		isLoaded: function(){
			// signal to _HasDropDown that it needs to call loadDropDown() to load the
			// drop down asynchronously before displaying it
			return false;
		},

		closeDropDown: function(){
			// Overrides _HasDropDown.closeDropDown().  Closes the drop down (assuming that it's open).
			// This method is the callback when the user types ESC or clicking
			// the button icon while the drop down is open.  It's also called by other code.
			this._abortQuery();
			if(this._opened){
				this.inherited(arguments);
				this.domNode.setAttribute("aria-expanded", "false");
				this.focusNode.removeAttribute("aria-activedescendant");
			}
		},

		_setBlurValue: function(){
			// if the user clicks away from the textbox OR tabs away, set the
			// value to the textbox value
			// #4617:
			//		if value is now more choices or previous choices, revert
			//		the value
			var newvalue = this.get('displayedValue');
			var pw = this.dropDown;
			if(pw && (
				newvalue == pw._messages["previousMessage"] ||
				newvalue == pw._messages["nextMessage"]
				)
			){
				this._setValueAttr(this._lastValueReported, true);
			}else if(typeof this.item == "undefined"){
				// Update 'value' (ex: KY) according to currently displayed text
				this.item = null;
				this.set('displayedValue', newvalue);
			}else{
				if(this.value != this._lastValueReported){
					this._handleOnChange(this.value, true);
				}
				this._refreshState();
			}
		},

		_setItemAttr: function(/*item*/ item, /*Boolean?*/ priorityChange, /*String?*/ displayedValue){
			// summary:
			//		Set the displayed valued in the input box, and the hidden value
			//		that gets submitted, based on a dojo.data store item.
			// description:
			//		Users shouldn't call this function; they should be calling
			//		set('item', value)
			// tags:
			//		private
			var value = '';
			if(item){
				if(!displayedValue){
					displayedValue = this.store._oldAPI ?	// remove getValue() for 2.0 (old dojo.data API)
						this.store.getValue(item, this.searchAttr) : item[this.searchAttr];
				}
				value = this._getValueField() != this.searchAttr ? this.store.getIdentity(item) : displayedValue;
			}
			this.set('value', value, priorityChange, displayedValue, item);
		},

		_announceOption: function(/*Node*/ node){
			// summary:
			//		a11y code that puts the highlighted option in the textbox.
			//		This way screen readers will know what is happening in the
			//		menu.

			if(!node){
				return;
			}
			// pull the text value from the item attached to the DOM node
			var newValue;
			if(node == this.dropDown.nextButton ||
				node == this.dropDown.previousButton){
				newValue = node.innerHTML;
				this.item = undefined;
				this.value = '';
			}else{
				newValue = (this.store._oldAPI ? 	// remove getValue() for 2.0 (old dojo.data API)
					this.store.getValue(node.item, this.searchAttr) : node.item[this.searchAttr]).toString();
				this.set('item', node.item, false, newValue);
			}
			// get the text that the user manually entered (cut off autocompleted text)
			this.focusNode.value = this.focusNode.value.substring(0, this._lastInput.length);
			// set up ARIA activedescendant
			this.focusNode.setAttribute("aria-activedescendant", domAttr.get(node, "id"));
			// autocomplete the rest of the option to announce change
			this._autoCompleteText(newValue);
		},

		_selectOption: function(/*DomNode*/ target){
			// summary:
			//		Menu callback function, called when an item in the menu is selected.
			this.closeDropDown();
			if(target){
				this._announceOption(target);
			}
			this._setCaretPos(this.focusNode, this.focusNode.value.length);
			this._handleOnChange(this.value, true);
		},

		_startSearchAll: function(){
			this._startSearch('');
		},

		_startSearchFromInput: function(){
			this._startSearch(this.focusNode.value.replace(/([\\\*\?])/g, "\\$1"));
		},

		_getQueryString: function(/*String*/ text){
			return string.substitute(this.queryExpr, [text]);
		},

		_startSearch: function(/*String*/ key){
			// summary:
			//		Starts a search for elements matching key (key=="" means to return all items),
			//		and calls _openResultList() when the search completes, to display the results.
			if(!this.dropDown){
				var popupId = this.id + "_popup",
					dropDownConstructor = lang.isString(this.dropDownClass) ?
						lang.getObject(this.dropDownClass, false) : this.dropDownClass;
				this.dropDown = new dropDownConstructor({
					onChange: lang.hitch(this, this._selectOption),
					id: popupId,
					dir: this.dir,
					textDir: this.textDir
				});
				this.focusNode.removeAttribute("aria-activedescendant");
				this.textbox.setAttribute("aria-owns",popupId); // associate popup with textbox
			}
			this._lastInput = key; // Store exactly what was entered by the user.

			// Setup parameters to be passed to store.query().
			// Create a new query to prevent accidentally querying for a hidden
			// value from FilteringSelect's keyField
			var query = lang.clone(this.query); // #5970
			var options = {
				start: 0,
				count: this.pageSize,
				queryOptions: {		// remove for 2.0
					ignoreCase: this.ignoreCase,
					deep: true
				}
			};
			lang.mixin(options, this.fetchProperties);

			// Generate query
			var qs = this._getQueryString(key), q;
			if(this.store._oldAPI){
				// remove this branch for 2.0
				q = qs;
			}else{
				// Query on searchAttr is a regex for benefit of dojo.store.Memory,
				// but with a toString() method to help dojo.store.JsonRest.
				// Search string like "Co*" converted to regex like /^Co.*$/i.
				q = filter.patternToRegExp(qs, this.ignoreCase);
				q.toString = function(){ return qs; };
			}
			this._lastQuery = query[this.searchAttr] = q;

			// Function to run the query, wait for the results, and then call _openResultList()
			var _this = this,
				startQuery = function(){
					var resPromise = _this._fetchHandle = _this.store.query(query, options);
					Deferred.when(resPromise, function(res){
						_this._fetchHandle = null;
						res.total = resPromise.total;
						_this._openResultList(res, query, options);
					}, function(err){
						_this._fetchHandle = null;
						if(!_this._cancelingQuery){	// don't treat canceled query as an error
							console.error(_this.declaredClass + ' ' + err.toString());
							_this.closeDropDown();
						}
					});
				};

			// #5970: set _lastQuery, *then* start the timeout
			// otherwise, if the user types and the last query returns before the timeout,
			// _lastQuery won't be set and their input gets rewritten

			this.searchTimer = setTimeout(lang.hitch(this, function(query, _this){
				this.searchTimer = null;

				startQuery();

				// Setup method to handle clicking next/previous buttons to page through results
				this._nextSearch = this.dropDown.onPage = function(direction){
					options.start += options.count * direction;
					//	tell callback the direction of the paging so the screen
					//	reader knows which menu option to shout
					options.direction = direction;
					startQuery();
					_this.focus();
				};
			}, query, this), this.searchDelay);
		},

		_getValueField: function(){
			// summary:
			//		Helper for postMixInProperties() to set this.value based on data inlined into the markup.
			//		Returns the attribute name in the item (in dijit.form._ComboBoxDataStore) to use as the value.
			return this.searchAttr;
		},

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		constructor: function(){
			this.query={};
			this.fetchProperties={};
		},

		postMixInProperties: function(){
			if(!this.store){
				var srcNodeRef = this.srcNodeRef;
				var list = this.list;
				if(list){
					this.store = registry.byId(list);
				}else{
					// if user didn't specify store, then assume there are option tags
					this.store = new DataList({}, srcNodeRef);
				}

				// if there is no value set and there is an option list, set
				// the value to the first value to be consistent with native Select
				// Firefox and Safari set value
				// IE6 and Opera set selectedIndex, which is automatically set
				// by the selected attribute of an option tag
				// IE6 does not set value, Opera sets value = selectedIndex
				if(!("value" in this.params)){
					var item = (this.item = this.store.fetchSelectedItem());
					if(item){
						var valueField = this._getValueField();
						// remove getValue() for 2.0 (old dojo.data API)
						this.value = this.store._oldAPI ? this.store.getValue(item, valueField) : item[valueField];
					}
				}
			}

			this.inherited(arguments);
		},

		postCreate: function(){
			// summary:
			//		Subclasses must call this method from their postCreate() methods
			// tags:
			//		protected

			// find any associated label element and add to ComboBox node.
			var label=query('label[for="'+this.id+'"]');
			if(label.length){
				label[0].id = (this.id+"_label");
				this.domNode.setAttribute("aria-labelledby", label[0].id);

			}
			this.inherited(arguments);
		},

		_getMenuLabelFromItem: function(/*Item*/ item){
			var label = this.labelFunc(item, this.store),
				labelType = this.labelType;
			// If labelType is not "text" we don't want to screw any markup ot whatever.
			if(this.highlightMatch != "none" && this.labelType == "text" && this._lastInput){
				label = this.doHighlight(label, this._escapeHtml(this._lastInput));
				labelType = "html";
			}
			return {html: labelType == "html", label: label};
		},

		doHighlight: function(/*String*/ label, /*String*/ find){
			// summary:
			//		Highlights the string entered by the user in the menu.  By default this
			//		highlights the first occurrence found. Override this method
			//		to implement your custom highlighting.
			// tags:
			//		protected

			var
				// Add (g)lobal modifier when this.highlightMatch == "all" and (i)gnorecase when this.ignoreCase == true
				modifiers = (this.ignoreCase ? "i" : "") + (this.highlightMatch == "all" ? "g" : ""),
				i = this.queryExpr.indexOf("${0}");
			find = regexp.escapeString(find); // escape regexp special chars
			return this._escapeHtml(label).replace(
				// prepend ^ when this.queryExpr == "${0}*" and append $ when this.queryExpr == "*${0}"
				new RegExp((i == 0 ? "^" : "") + "("+ find +")" + (i == (this.queryExpr.length - 4) ? "$" : ""), modifiers),
				'<span class="dijitComboBoxHighlightMatch">$1</span>'
			); // returns String, (almost) valid HTML (entities encoded)
		},

		_escapeHtml: function(/*String*/ str){
			// TODO Should become dojo.html.entities(), when exists use instead
			// summary:
			//		Adds escape sequences for special characters in XML: &<>"'
			str = String(str).replace(/&/gm, "&amp;").replace(/</gm, "&lt;")
				.replace(/>/gm, "&gt;").replace(/"/gm, "&quot;"); //balance"
			return str; // string
		},

		reset: function(){
			// Overrides the _FormWidget.reset().
			// Additionally reset the .item (to clean up).
			this.item = null;
			this.inherited(arguments);
		},

		labelFunc: function(/*item*/ item, /*dojo.store.api.Store*/ store){
			// summary:
			//		Computes the label to display based on the dojo.data store item.
			// returns:
			//		The label that the ComboBox should display
			// tags:
			//		private

			// Use toString() because XMLStore returns an XMLItem whereas this
			// method is expected to return a String (#9354).
			// Remove getValue() for 2.0 (old dojo.data API)
			return (store._oldAPI ? store.getValue(item, this.labelAttr || this.searchAttr) :
				item[this.labelAttr || this.searchAttr]).toString(); // String
		},

		_setValueAttr: function(/*String*/ value, /*Boolean?*/ priorityChange, /*String?*/ displayedValue, /*item?*/ item){
			// summary:
			//		Hook so set('value', value) works.
			// description:
			//		Sets the value of the select.
			this._set("item", item||null); // value not looked up in store
			if(!value){ value = ''; } // null translates to blank
			this.inherited(arguments);
		},
		_setTextDirAttr: function(/*String*/ textDir){
			// summary:
			//		Setter for textDir, needed for the dropDown's textDir update.
			// description:
			//		Users shouldn't call this function; they should be calling
			//		set('textDir', value)
			// tags:
			//		private
			this.inherited(arguments);
			// update the drop down also (_ComboBoxMenuMixin)
			if(this.dropDown){
				this.dropDown._set("textDir", textDir);
			}
		}
	});
});

},
'dijit/form/MappedTextBox':function(){
define("dijit/form/MappedTextBox", [
	"dojo/_base/declare", // declare
	"dojo/dom-construct", // domConstruct.place
	"./ValidationTextBox"
], function(declare, domConstruct, ValidationTextBox){

/*=====
	var ValidationTextBox = dijit.form.ValidationTextBox;
=====*/

	// module:
	//		dijit/form/MappedTextBox
	// summary:
	//		A dijit.form.ValidationTextBox subclass which provides a base class for widgets that have
	//		a visible formatted display value, and a serializable
	//		value in a hidden input field which is actually sent to the server.

	return declare("dijit.form.MappedTextBox", ValidationTextBox, {
		// summary:
		//		A dijit.form.ValidationTextBox subclass which provides a base class for widgets that have
		//		a visible formatted display value, and a serializable
		//		value in a hidden input field which is actually sent to the server.
		// description:
		//		The visible display may
		//		be locale-dependent and interactive.  The value sent to the server is stored in a hidden
		//		input field which uses the `name` attribute declared by the original widget.  That value sent
		//		to the server is defined by the dijit.form.MappedTextBox.serialize method and is typically
		//		locale-neutral.
		// tags:
		//		protected

		postMixInProperties: function(){
			this.inherited(arguments);

			// we want the name attribute to go to the hidden <input>, not the displayed <input>,
			// so override _FormWidget.postMixInProperties() setting of nameAttrSetting
			this.nameAttrSetting = "";
		},

		// Override default behavior to assign name to focusNode
		_setNameAttr: null,

		serialize: function(val /*=====, options =====*/){
			// summary:
			//		Overridable function used to convert the get('value') result to a canonical
			//		(non-localized) string.  For example, will print dates in ISO format, and
			//		numbers the same way as they are represented in javascript.
			// val: anything
			// options: Object?
			// tags:
			//		protected extension
			return val.toString ? val.toString() : ""; // String
		},

		toString: function(){
			// summary:
			//		Returns widget as a printable string using the widget's value
			// tags:
			//		protected
			var val = this.filter(this.get('value')); // call filter in case value is nonstring and filter has been customized
			return val != null ? (typeof val == "string" ? val : this.serialize(val, this.constraints)) : ""; // String
		},

		validate: function(){
			// Overrides `dijit.form.TextBox.validate`
			this.valueNode.value = this.toString();
			return this.inherited(arguments);
		},

		buildRendering: function(){
			// Overrides `dijit._TemplatedMixin.buildRendering`

			this.inherited(arguments);

			// Create a hidden <input> node with the serialized value used for submit
			// (as opposed to the displayed value).
			// Passing in name as markup rather than calling domConstruct.create() with an attrs argument
			// to make query(input[name=...]) work on IE. (see #8660)
			this.valueNode = domConstruct.place("<input type='hidden'" + (this.name ? " name='" + this.name.replace(/'/g, "&quot;") + "'" : "") + "/>", this.textbox, "after");
		},

		reset: function(){
			// Overrides `dijit.form.ValidationTextBox.reset` to
			// reset the hidden textbox value to ''
			this.valueNode.value = '';
			this.inherited(arguments);
		}
	});
});

},
'dijit/form/ComboBoxMixin':function(){
require({cache:{
'url:dijit/form/templates/DropDownBox.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\"\r\n\tid=\"widget_${id}\"\r\n\trole=\"combobox\"\r\n\t><div class='dijitReset dijitRight dijitButtonNode dijitArrowButton dijitDownArrowButton dijitArrowButtonContainer'\r\n\t\tdata-dojo-attach-point=\"_buttonNode, _popupStateNode\" role=\"presentation\"\r\n\t\t><input class=\"dijitReset dijitInputField dijitArrowButtonInner\" value=\"&#9660; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t\t\t${_buttonInputDisabled}\r\n\t/></div\r\n\t><div class='dijitReset dijitValidationContainer'\r\n\t\t><input class=\"dijitReset dijitInputField dijitValidationIcon dijitValidationInner\" value=\"&#935; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t/></div\r\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\r\n\t\t><input class='dijitReset dijitInputInner' ${!nameAttrSetting} type=\"text\" autocomplete=\"off\"\r\n\t\t\tdata-dojo-attach-point=\"textbox,focusNode\" role=\"textbox\" aria-haspopup=\"true\"\r\n\t/></div\r\n></div>\r\n"}});
define("dijit/form/ComboBoxMixin", [
	"dojo/_base/declare", // declare
	"dojo/_base/Deferred",
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/lang", // lang.mixin
	"dojo/store/util/QueryResults",	// dojo.store.util.QueryResults
	"./_AutoCompleterMixin",
	"./_ComboBoxMenu",
	"../_HasDropDown",
	"dojo/text!./templates/DropDownBox.html"
], function(declare, Deferred, kernel, lang, QueryResults, _AutoCompleterMixin, _ComboBoxMenu, _HasDropDown, template){

/*=====
	var _AutoCompleterMixin = dijit.form._AutoCompleterMixin;
	var _ComboBoxMenu = dijit.form._ComboBoxMenu;
	var _HasDropDown = dijit._HasDropDown;
=====*/

	// module:
	//		dijit/form/ComboBoxMixin
	// summary:
	//		Provides main functionality of ComboBox widget

	return declare("dijit.form.ComboBoxMixin", [_HasDropDown, _AutoCompleterMixin], {
		// summary:
		//		Provides main functionality of ComboBox widget

		// dropDownClass: [protected extension] Function String
		//		Dropdown widget class used to select a date/time.
		//		Subclasses should specify this.
		dropDownClass: _ComboBoxMenu,

		// hasDownArrow: Boolean
		//		Set this textbox to have a down arrow button, to display the drop down list.
		//		Defaults to true.
		hasDownArrow: true,

		templateString: template,

		baseClass: "dijitTextBox dijitComboBox",

		/*=====
		// store: [const] dojo.store.api.Store || dojo.data.api.Read
		//		Reference to data provider object used by this ComboBox.
		//
		//		Should be dojo.store.api.Store, but dojo.data.api.Read supported
		//		for backwards compatibility.
		store: null,
		=====*/

		// Set classes like dijitDownArrowButtonHover depending on
		// mouse action over button node
		cssStateNodes: {
			"_buttonNode": "dijitDownArrowButton"
		},

		_setHasDownArrowAttr: function(/*Boolean*/ val){
			this._set("hasDownArrow", val);
			this._buttonNode.style.display = val ? "" : "none";
		},

		_showResultList: function(){
			// hide the tooltip
			this.displayMessage("");
			this.inherited(arguments);
		},

		_setStoreAttr: function(store){
			// For backwards-compatibility, accept dojo.data store in addition to dojo.store.store.  Remove in 2.0.
			if(!store.get){
				lang.mixin(store, {
					_oldAPI: true,
					get: function(id){
						// summary:
						//		Retrieves an object by it's identity. This will trigger a fetchItemByIdentity.
						//		Like dojo.store.DataStore.get() except returns native item.
						var deferred = new Deferred();
						this.fetchItemByIdentity({
							identity: id,
							onItem: function(object){
								deferred.resolve(object);
							},
							onError: function(error){
								deferred.reject(error);
							}
						});
						return deferred.promise;
					},
					query: function(query, options){
						// summary:
						//		Queries the store for objects.   Like dojo.store.DataStore.query()
						//		except returned Deferred contains array of native items.
						var deferred = new Deferred(function(){ fetchHandle.abort && fetchHandle.abort(); });
						var fetchHandle = this.fetch(lang.mixin({
							query: query,
							onBegin: function(count){
								deferred.total = count;
							},
							onComplete: function(results){
								deferred.resolve(results);
							},
							onError: function(error){
								deferred.reject(error);
							}
						}, options));
						return QueryResults(deferred);
					}
				});
			}
			this._set("store", store);
		},

		postMixInProperties: function(){
			// Since _setValueAttr() depends on this.store, _setStoreAttr() needs to execute first.
			// Unfortunately, without special code, it ends up executing second.
			if(this.params.store){
				this._setStoreAttr(this.params.store);
			}

			this.inherited(arguments);

			// User may try to access this.store.getValue() etc.  in a custom labelFunc() function.
			// It's not available with the new data store for handling inline <option> tags, so add it.
			if(!this.params.store){
				var clazz = this.declaredClass;
				lang.mixin(this.store, {
					getValue: function(item, attr){
						kernel.deprecated(clazz + ".store.getValue(item, attr) is deprecated for builtin store.  Use item.attr directly", "", "2.0");
						return item[attr];
					},
					getLabel: function(item){
						kernel.deprecated(clazz + ".store.getLabel(item) is deprecated for builtin store.  Use item.label directly", "", "2.0");
						return item.name;
					},
					fetch: function(args){
						kernel.deprecated(clazz + ".store.fetch() is deprecated for builtin store.", "Use store.query()", "2.0");
						var shim = ["dojo/data/ObjectStore"];	// indirection so it doesn't get rolled into a build
						require(shim, lang.hitch(this, function(ObjectStore){
							new ObjectStore({objectStore: this}).fetch(args);
						}));
					}
				});
			}
		}
	});
});

},
'dijit/form/_TextBoxMixin':function(){
define("dijit/form/_TextBoxMixin", [
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.byId
	"dojo/_base/event", // event.stop
	"dojo/keys", // keys.ALT keys.CAPS_LOCK keys.CTRL keys.META keys.SHIFT
	"dojo/_base/lang", // lang.mixin
	".."	// for exporting dijit._setSelectionRange, dijit.selectInputText
], function(array, declare, dom, event, keys, lang, dijit){

// module:
//		dijit/form/_TextBoxMixin
// summary:
//		A mixin for textbox form input widgets

var _TextBoxMixin = declare("dijit.form._TextBoxMixin", null, {
	// summary:
	//		A mixin for textbox form input widgets

	// trim: Boolean
	//		Removes leading and trailing whitespace if true.  Default is false.
	trim: false,

	// uppercase: Boolean
	//		Converts all characters to uppercase if true.  Default is false.
	uppercase: false,

	// lowercase: Boolean
	//		Converts all characters to lowercase if true.  Default is false.
	lowercase: false,

	// propercase: Boolean
	//		Converts the first character of each word to uppercase if true.
	propercase: false,

	// maxLength: String
	//		HTML INPUT tag maxLength declaration.
	maxLength: "",

	// selectOnClick: [const] Boolean
	//		If true, all text will be selected when focused with mouse
	selectOnClick: false,

	// placeHolder: String
	//		Defines a hint to help users fill out the input field (as defined in HTML 5).
	//		This should only contain plain text (no html markup).
	placeHolder: "",

	_getValueAttr: function(){
		// summary:
		//		Hook so get('value') works as we like.
		// description:
		//		For `dijit.form.TextBox` this basically returns the value of the <input>.
		//
		//		For `dijit.form.MappedTextBox` subclasses, which have both
		//		a "displayed value" and a separate "submit value",
		//		This treats the "displayed value" as the master value, computing the
		//		submit value from it via this.parse().
		return this.parse(this.get('displayedValue'), this.constraints);
	},

	_setValueAttr: function(value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
		// summary:
		//		Hook so set('value', ...) works.
		//
		// description:
		//		Sets the value of the widget to "value" which can be of
		//		any type as determined by the widget.
		//
		// value:
		//		The visual element value is also set to a corresponding,
		//		but not necessarily the same, value.
		//
		// formattedValue:
		//		If specified, used to set the visual element value,
		//		otherwise a computed visual value is used.
		//
		// priorityChange:
		//		If true, an onChange event is fired immediately instead of
		//		waiting for the next blur event.

		var filteredValue;
		if(value !== undefined){
			// TODO: this is calling filter() on both the display value and the actual value.
			// I added a comment to the filter() definition about this, but it should be changed.
			filteredValue = this.filter(value);
			if(typeof formattedValue != "string"){
				if(filteredValue !== null && ((typeof filteredValue != "number") || !isNaN(filteredValue))){
					formattedValue = this.filter(this.format(filteredValue, this.constraints));
				}else{ formattedValue = ''; }
			}
		}
		if(formattedValue != null && formattedValue != undefined && ((typeof formattedValue) != "number" || !isNaN(formattedValue)) && this.textbox.value != formattedValue){
			this.textbox.value = formattedValue;
			this._set("displayedValue", this.get("displayedValue"));
		}

		if(this.textDir == "auto"){
			this.applyTextDir(this.focusNode, formattedValue);
		}

		this.inherited(arguments, [filteredValue, priorityChange]);
	},

	// displayedValue: String
	//		For subclasses like ComboBox where the displayed value
	//		(ex: Kentucky) and the serialized value (ex: KY) are different,
	//		this represents the displayed value.
	//
	//		Setting 'displayedValue' through set('displayedValue', ...)
	//		updates 'value', and vice-versa.  Otherwise 'value' is updated
	//		from 'displayedValue' periodically, like onBlur etc.
	//
	//		TODO: move declaration to MappedTextBox?
	//		Problem is that ComboBox references displayedValue,
	//		for benefit of FilteringSelect.
	displayedValue: "",

	_getDisplayedValueAttr: function(){
		// summary:
		//		Hook so get('displayedValue') works.
		// description:
		//		Returns the displayed value (what the user sees on the screen),
		// 		after filtering (ie, trimming spaces etc.).
		//
		//		For some subclasses of TextBox (like ComboBox), the displayed value
		//		is different from the serialized value that's actually
		//		sent to the server (see dijit.form.ValidationTextBox.serialize)

		// TODO: maybe we should update this.displayedValue on every keystroke so that we don't need
		// this method
		// TODO: this isn't really the displayed value when the user is typing
		return this.filter(this.textbox.value);
	},

	_setDisplayedValueAttr: function(/*String*/ value){
		// summary:
		//		Hook so set('displayedValue', ...) works.
		// description:
		//		Sets the value of the visual element to the string "value".
		//		The widget value is also set to a corresponding,
		//		but not necessarily the same, value.

		if(value === null || value === undefined){ value = '' }
		else if(typeof value != "string"){ value = String(value) }

		this.textbox.value = value;

		// sets the serialized value to something corresponding to specified displayedValue
		// (if possible), and also updates the textbox.value, for example converting "123"
		// to "123.00"
		this._setValueAttr(this.get('value'), undefined);

		this._set("displayedValue", this.get('displayedValue'));

		// textDir support
		if(this.textDir == "auto"){
			this.applyTextDir(this.focusNode, value);
		}
	},

	format: function(value /*=====, constraints =====*/){
		// summary:
		//		Replaceable function to convert a value to a properly formatted string.
		// value: String
		// constraints: Object
		// tags:
		//		protected extension
		return ((value == null || value == undefined) ? "" : (value.toString ? value.toString() : value));
	},

	parse: function(value /*=====, constraints =====*/){
		// summary:
		//		Replaceable function to convert a formatted string to a value
		// value: String
		// constraints: Object
		// tags:
		//		protected extension

		return value;	// String
	},

	_refreshState: function(){
		// summary:
		//		After the user types some characters, etc., this method is
		//		called to check the field for validity etc.  The base method
		//		in `dijit.form.TextBox` does nothing, but subclasses override.
		// tags:
		//		protected
	},

	/*=====
	onInput: function(event){
		// summary:
		//		Connect to this function to receive notifications of various user data-input events.
		//		Return false to cancel the event and prevent it from being processed.
		// event:
		//		keydown | keypress | cut | paste | input
		// tags:
		//		callback
	},
	=====*/
	onInput: function(){},

	__skipInputEvent: false,
	_onInput: function(){
		// summary:
		//		Called AFTER the input event has happened
		// set text direction according to textDir that was defined in creation
		if(this.textDir == "auto"){
			this.applyTextDir(this.focusNode, this.focusNode.value);
		}

		this._refreshState();

		// In case someone is watch()'ing for changes to displayedValue
		this._set("displayedValue", this.get("displayedValue"));
	},

	postCreate: function(){
		// setting the value here is needed since value="" in the template causes "undefined"
		// and setting in the DOM (instead of the JS object) helps with form reset actions
		this.textbox.setAttribute("value", this.textbox.value); // DOM and JS values should be the same

		this.inherited(arguments);

		// normalize input events to reduce spurious event processing
		//	onkeydown: do not forward modifier keys
		//	           set charOrCode to numeric keycode
		//	onkeypress: do not forward numeric charOrCode keys (already sent through onkeydown)
		//	onpaste & oncut: set charOrCode to 229 (IME)
		//	oninput: if primary event not already processed, set charOrCode to 229 (IME), else do not forward
		var handleEvent = function(e){
			var charCode = e.charOrCode || e.keyCode || 229;
			if(e.type == "keydown"){
				switch(charCode){ // ignore "state" keys
					case keys.SHIFT:
					case keys.ALT:
					case keys.CTRL:
					case keys.META:
					case keys.CAPS_LOCK:
						return;
					default:
						if(charCode >= 65 && charCode <= 90){ return; } // keydown for A-Z can be processed with keypress
				}
			}
			if(e.type == "keypress" && typeof charCode != "string"){ return; }
			if(e.type == "input"){
				if(this.__skipInputEvent){ // duplicate event
					this.__skipInputEvent = false;
					return;
				}
			}else{
				this.__skipInputEvent = true;
			}
			// create fake event to set charOrCode and to know if preventDefault() was called
			var faux = lang.mixin({}, e, {
				charOrCode: charCode,
				wasConsumed: false,
				preventDefault: function(){
					faux.wasConsumed = true;
					e.preventDefault();
				},
				stopPropagation: function(){ e.stopPropagation(); }
			});
			// give web page author a chance to consume the event
			if(this.onInput(faux) === false){
				event.stop(faux); // return false means stop
			}
			if(faux.wasConsumed){ return; } // if preventDefault was called
			setTimeout(lang.hitch(this, "_onInput", faux), 0); // widget notification after key has posted
		};
		array.forEach([ "onkeydown", "onkeypress", "onpaste", "oncut", "oninput", "oncompositionend" ], function(event){
			this.connect(this.textbox, event, handleEvent);
		}, this);
	},

	_blankValue: '', // if the textbox is blank, what value should be reported
	filter: function(val){
		// summary:
		//		Auto-corrections (such as trimming) that are applied to textbox
		//		value on blur or form submit.
		// description:
		//		For MappedTextBox subclasses, this is called twice
		// 			- once with the display value
		//			- once the value as set/returned by set('value', ...)
		//		and get('value'), ex: a Number for NumberTextBox.
		//
		//		In the latter case it does corrections like converting null to NaN.  In
		//		the former case the NumberTextBox.filter() method calls this.inherited()
		//		to execute standard trimming code in TextBox.filter().
		//
		//		TODO: break this into two methods in 2.0
		//
		// tags:
		//		protected extension
		if(val === null){ return this._blankValue; }
		if(typeof val != "string"){ return val; }
		if(this.trim){
			val = lang.trim(val);
		}
		if(this.uppercase){
			val = val.toUpperCase();
		}
		if(this.lowercase){
			val = val.toLowerCase();
		}
		if(this.propercase){
			val = val.replace(/[^\s]+/g, function(word){
				return word.substring(0,1).toUpperCase() + word.substring(1);
			});
		}
		return val;
	},

	_setBlurValue: function(){
		this._setValueAttr(this.get('value'), true);
	},

	_onBlur: function(e){
		if(this.disabled){ return; }
		this._setBlurValue();
		this.inherited(arguments);

		if(this._selectOnClickHandle){
			this.disconnect(this._selectOnClickHandle);
		}
	},

	_isTextSelected: function(){
		return this.textbox.selectionStart == this.textbox.selectionEnd;
	},

	_onFocus: function(/*String*/ by){
		if(this.disabled || this.readOnly){ return; }

		// Select all text on focus via click if nothing already selected.
		// Since mouse-up will clear the selection need to defer selection until after mouse-up.
		// Don't do anything on focus by tabbing into the widget since there's no associated mouse-up event.
		if(this.selectOnClick && by == "mouse"){
			this._selectOnClickHandle = this.connect(this.domNode, "onmouseup", function(){
				// Only select all text on first click; otherwise users would have no way to clear
				// the selection.
				this.disconnect(this._selectOnClickHandle);

				// Check if the user selected some text manually (mouse-down, mouse-move, mouse-up)
				// and if not, then select all the text
				if(this._isTextSelected()){
					_TextBoxMixin.selectInputText(this.textbox);
				}
			});
		}
		// call this.inherited() before refreshState(), since this.inherited() will possibly scroll the viewport
		// (to scroll the TextBox into view), which will affect how _refreshState() positions the tooltip
		this.inherited(arguments);

		this._refreshState();
	},

	reset: function(){
		// Overrides dijit._FormWidget.reset().
		// Additionally resets the displayed textbox value to ''
		this.textbox.value = '';
		this.inherited(arguments);
	},
	_setTextDirAttr: function(/*String*/ textDir){
		// summary:
		//		Setter for textDir.
		// description:
		//		Users shouldn't call this function; they should be calling
		//		set('textDir', value)
		// tags:
		//		private

		// only if new textDir is different from the old one
		// and on widgets creation.
		if(!this._created
			|| this.textDir != textDir){
				this._set("textDir", textDir);
				// so the change of the textDir will take place immediately.
				this.applyTextDir(this.focusNode, this.focusNode.value);
		}
	}
});


_TextBoxMixin._setSelectionRange = dijit._setSelectionRange = function(/*DomNode*/ element, /*Number?*/ start, /*Number?*/ stop){
	if(element.setSelectionRange){
		element.setSelectionRange(start, stop);
	}
};

_TextBoxMixin.selectInputText = dijit.selectInputText = function(/*DomNode*/ element, /*Number?*/ start, /*Number?*/ stop){
	// summary:
	//		Select text in the input element argument, from start (default 0), to stop (default end).

	// TODO: use functions in _editor/selection.js?
	element = dom.byId(element);
	if(isNaN(start)){ start = 0; }
	if(isNaN(stop)){ stop = element.value ? element.value.length : 0; }
	try{
		element.focus();
		_TextBoxMixin._setSelectionRange(element, start, stop);
	}catch(e){ /* squelch random errors (esp. on IE) from unexpected focus changes or DOM nodes being hidden */ }
};

return _TextBoxMixin;
});

},
'dijit/form/SimpleTextarea':function(){
define("dijit/form/SimpleTextarea", [
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add
	"dojo/_base/sniff", // has("ie") has("opera")
	"dojo/_base/window", // win.doc.selection win.doc.selection.createRange
	"./TextBox"
], function(declare, domClass, has, win, TextBox){

/*=====
	var TextBox = dijit.form.TextBox;
=====*/

// module:
//		dijit/form/SimpleTextarea
// summary:
//		A simple textarea that degrades, and responds to
// 		minimal LayoutContainer usage, and works with dijit.form.Form.
//		Doesn't automatically size according to input, like Textarea.

return declare("dijit.form.SimpleTextarea", TextBox, {
	// summary:
	//		A simple textarea that degrades, and responds to
	// 		minimal LayoutContainer usage, and works with dijit.form.Form.
	//		Doesn't automatically size according to input, like Textarea.
	//
	// example:
	//	|	<textarea data-dojo-type="dijit.form.SimpleTextarea" name="foo" value="bar" rows=30 cols=40></textarea>
	//
	// example:
	//	|	new dijit.form.SimpleTextarea({ rows:20, cols:30 }, "foo");

	baseClass: "dijitTextBox dijitTextArea",

	// rows: Number
	//		The number of rows of text.
	rows: "3",

	// rows: Number
	//		The number of characters per line.
	cols: "20",

	templateString: "<textarea ${!nameAttrSetting} data-dojo-attach-point='focusNode,containerNode,textbox' autocomplete='off'></textarea>",

	postMixInProperties: function(){
		// Copy value from srcNodeRef, unless user specified a value explicitly (or there is no srcNodeRef)
		// TODO: parser will handle this in 2.0
		if(!this.value && this.srcNodeRef){
			this.value = this.srcNodeRef.value;
		}
		this.inherited(arguments);
	},

	buildRendering: function(){
		this.inherited(arguments);
		if(has("ie") && this.cols){ // attribute selectors is not supported in IE6
			domClass.add(this.textbox, "dijitTextAreaCols");
		}
	},

	filter: function(/*String*/ value){
		// Override TextBox.filter to deal with newlines... specifically (IIRC) this is for IE which writes newlines
		// as \r\n instead of just \n
		if(value){
			value = value.replace(/\r/g,"");
		}
		return this.inherited(arguments);
	},

	_onInput: function(/*Event?*/ e){
		// Override TextBox._onInput() to enforce maxLength restriction
		if(this.maxLength){
			var maxLength = parseInt(this.maxLength);
			var value = this.textbox.value.replace(/\r/g,'');
			var overflow = value.length - maxLength;
			if(overflow > 0){
				var textarea = this.textbox;
				if(textarea.selectionStart){
					var pos = textarea.selectionStart;
					var cr = 0;
					if(has("opera")){
						cr = (this.textbox.value.substring(0,pos).match(/\r/g) || []).length;
					}
					this.textbox.value = value.substring(0,pos-overflow-cr)+value.substring(pos-cr);
					textarea.setSelectionRange(pos-overflow, pos-overflow);
				}else if(win.doc.selection){ //IE
					textarea.focus();
					var range = win.doc.selection.createRange();
					// delete overflow characters
					range.moveStart("character", -overflow);
					range.text = '';
					// show cursor
					range.select();
				}
			}
		}
		this.inherited(arguments);
	}
});

});

},
'dijit/_editor/plugins/TextColor':function(){
define("dijit/_editor/plugins/TextColor", [
	"require",
	"dojo/colors", // colors.fromRgb
	"dojo/_base/declare", // declare
	"dojo/_base/lang",
	"../_Plugin",
	"../../form/DropDownButton"
], function(require, colors, declare, lang, _Plugin, DropDownButton){

/*=====
	var _Plugin = dijit._editor._Plugin;
=====*/

// module:
//		dijit/_editor/plugins/TextColor
// summary:
//		This plugin provides dropdown color pickers for setting text color and background color


var TextColor = declare("dijit._editor.plugins.TextColor", _Plugin, {
	// summary:
	//		This plugin provides dropdown color pickers for setting text color and background color
	//
	// description:
	//		The commands provided by this plugin are:
	//		* foreColor - sets the text color
	//		* hiliteColor - sets the background color

	// Override _Plugin.buttonClass to use DropDownButton (with ColorPalette) to control this plugin
	buttonClass: DropDownButton,

	// useDefaultCommand: Boolean
	//		False as we do not use the default editor command/click behavior.
	useDefaultCommand: false,

	_initButton: function(){
		this.inherited(arguments);

		// Setup to lazy load ColorPalette first time the button is clicked
		var self = this;
		this.button.loadDropDown = function(callback){
			require(["../../ColorPalette"], lang.hitch(this, function(ColorPalette){
				this.dropDown = new ColorPalette({
					value: self.value,
					onChange: function(color){
						self.editor.execCommand(self.command, color);
					}
				});
				callback();
			}));
		};
	},

	updateState: function(){
		// summary:
		//		Overrides _Plugin.updateState().  This updates the ColorPalette
		//		to show the color of the currently selected text.
		// tags:
		//		protected

		var _e = this.editor;
		var _c = this.command;
		if(!_e || !_e.isLoaded || !_c.length){
			return;
		}

		if(this.button){
			var disabled = this.get("disabled");
			this.button.set("disabled", disabled);
			if(disabled){ return; }

			var value;
			try{
				value = _e.queryCommandValue(_c)|| "";
			}catch(e){
				//Firefox may throw error above if the editor is just loaded, ignore it
				value = "";
			}
		}

		if(value == ""){
			value = "#000000";
		}
		if(value == "transparent"){
			value = "#ffffff";
		}

		if(typeof value == "string"){
			//if RGB value, convert to hex value
			if(value.indexOf("rgb")> -1){
				value = colors.fromRgb(value).toHex();
			}
		}else{	//it's an integer(IE returns an MS access #)
			value =((value & 0x0000ff)<< 16)|(value & 0x00ff00)|((value & 0xff0000)>>> 16);
			value = value.toString(16);
			value = "#000000".slice(0, 7 - value.length)+ value;

		}

		this.value = value;

		var dropDown = this.button.dropDown;
		if(dropDown && value !== dropDown.get('value')){
			dropDown.set('value', value, false);
		}
	}
});

// Register this plugin.
_Plugin.registry["foreColor"] = function(){
	return new TextColor({command: "foreColor"});
};
_Plugin.registry["hiliteColor"] = function(){
	return new TextColor({command: "hiliteColor"});
};


return TextColor;
});

},
'esri/dijit/AttributeInspector':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojo/fx,dojox/gfx,dijit/_Widget,dijit/_Templated,dijit/Editor,dijit/_editor/plugins/LinkDialog,dijit/_editor/plugins/TextColor,esri/dijit/editing/AttachmentEditor,esri/dijit/editing/Util,esri/tasks/query,dijit/form/DateTextBox,dijit/form/TextBox,dijit/form/NumberTextBox,dijit/form/FilteringSelect,dijit/form/NumberSpinner,dijit/form/Button,dijit/form/SimpleTextarea,dijit/Tooltip,dojo/data/ItemFileReadStore"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.AttributeInspector");

dojo.require("dojo.fx");
dojo.require("dojox.gfx");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.require("dijit.Editor");
dojo.require("dijit._editor.plugins.LinkDialog");
dojo.require("dijit._editor.plugins.TextColor");

dojo.require("esri.dijit.editing.AttachmentEditor");
dojo.require("esri.dijit.editing.Util");
dojo.require("esri.tasks.query");

dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.NumberTextBox");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dijit.form.NumberSpinner");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.SimpleTextarea");
dojo.require("dijit.Tooltip");

dojo.require("dojo.data.ItemFileReadStore");

//dojo.require("dojox.date.islamic");
//dojo.require("dojox.date.islamic.Date");
//dojo.require("dojox.date.islamic.locale");

/***************
 * CSS Includes
 ***************/
//anonymous function to load CSS files required for this module
 (function(){
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = dojo.moduleUrl("esri", "dijit/css/AttributeInspector.css");
    document.getElementsByTagName("head").item(0).appendChild(link);

})();

/******************
 * CSS class names
 ******************
 *  esriAttributeInspector
 *    atiLayerName
 *    atiField
 *      atiRichTextField
 *      atiTextAreaField
 *    atiLabel
 *    atiNavMessage
 *    atiButtons
 *    atiNavButtons
 *    atiButton
 *    atiPrevIcon
 *    atiNextIcon
 *    atiFirstIcon
 *    atiLastIcon
 *    atiDeleteButton
 *    atiAttachmentEditor
 *    atiTooltip
 ******************/

/*******************************
 * esri.dijit.AttributeInspector
 ******************************/
dojo.declare("esri.dijit.AttributeInspector", [dijit._Widget, dijit._Templated], {

    widgetsInTemplate: true,
    templateString:"<div class=\"esriAttributeInspector\">\r\n    <div class=\"atiLayerName\" dojoAttachPoint=\"layerName\"></div>\r\n    <div class=\"atiAttributes\" dojoAttachPoint=\"attributeTable\"></div>\r\n    <div dojoAttachPoint=\"attachmentEditor\"></div>\r\n    <div class=\"atiEditorTrackingInfo\" dojoAttachPoint=\"editorTrackingInfoDiv\"></div>\r\n    <div class=\"atiButtons\" dojoAttachPoint=\"editButtons\">\r\n        <button  dojoType=\"dijit.form.Button\" class=\"atiButton atiDeleteButton\"  dojoAttachPoint=\"deleteBtn\" dojoAttachEvent=\"onClick: onDeleteBtn\" showLabel=\"true\" type=\"button\">${NLS_deleteFeature}</button>\r\n        <div class=\"atiNavButtons\" dojoAttachPoint=\"navButtons\">\r\n            <div class=\"atiNavMessage\" dojoAttachPoint=\"navMessage\"></div>\r\n            <button  dojoType=\"dijit.form.Button\" iconClass=\"atiButton atiFirstIcon\" dojoAttachPoint=\"firstFeatureButton\" dojoAttachEvent=\"onClick: onFirstFeature\" showLabel=\"false\" type=\"button\">${NLS_first}</button>\r\n            <button  dojoType=\"dijit.form.Button\" iconClass=\"atiButton atiPrevIcon\" dojoAttachPoint=\"prevFeatureButton\" dojoAttachEvent=\"onClick: onPreviousFeature\" showLabel=\"false\" type=\"button\">${NLS_previous}</button>\r\n            <button  dojoType=\"dijit.form.Button\" iconClass=\"atiButton atiNextIcon\" dojoAttachPoint=\"nextFeatureButton\" dojoAttachEvent=\"onClick: onNextFeature\" showLabel=\"false\" type=\"button\">${NLS_next}</button>\r\n            <button  dojoType=\"dijit.form.Button\" iconClass=\"atiButton atiLastIcon\" dojoAttachPoint=\"lastFeatureButton\" dojoAttachEvent=\"onClick: onLastFeature\" showLabel=\"false\" type=\"button\">${NLS_last}</button>\r\n        </div>\r\n    </div>\r\n</div>\r\n",
    _navMessage: "( ${idx} ${of} ${numFeatures} )",

    /*********
    * Events
    *********/
    onUpdate: function(){},
    onDelete: function(){},
    onAttributeChange: function(){},
    onNext: function(){},
    onReset: function(){},
    onCancel: function(){},

   /************
   * Overrides
   ************/
    constructor: function(params, srcNodeRef){
        // Mixin i18n strings
        dojo.mixin(this, esri.bundle.widgets.attributeInspector);
        params = params || {};
        if (!params.featureLayer && !params.layerInfos){
            console.error("esri.AttributeInspector: please provide correct parameter in the constructor");
        }
        //specify user ids for each secured layer
        this._userIds = {};
        if (params.featureLayer && params.featureLayer.credential) {
          var layerId = params.featureLayer.id;
          this._userIds[layerId] = params.featureLayer.credential.userId;
        }
        else if (params.layerInfos) {
          var lInfos = params.layerInfos;
          dojo.forEach(lInfos, function(layer) {
            if (layer.featureLayer){
              var layerId = layer.featureLayer.id;
              if (layer.featureLayer.credential) {
                this._userIds[layerId] = layer.featureLayer.credential.userId;
              }
              if (layer.userId) {
                this._userIds[layerId] = layer.userId;
              }
            }
          }, this);
        }
        
        this._datePackage = this._getDatePackage(params);
        this._layerInfos = params.layerInfos || [{ featureLayer: params.featureLayer, options: params.options || [] }];
        this._aiConnects = [];
        this._selection = [];
        this._toolTips = [];
        this._numFeatures = 0;
        this._featureIdx = 0;
        this._currentLInfo = null;
        this._currentFeature = null;
        this._hideNavButtons = params.hideNavButtons || false;
    },

    postCreate: function(){
        this._initLayerInfos();
        this._createAttachmentEditor();
        this.onFirstFeature();
    },

    destroy: function(){
        this._destroyAttributeTable();

        dojo.forEach( this._aiConnects, dojo.disconnect );
        delete this._aiConnects;

        if (this._attachmentEditor){
            this._attachmentEditor.destroy();
            delete this._attachmentEditor;
        }
        
        delete this._layerInfos;
        
        this._selection = this._currentFeature = this._currentLInfo = this._attributes = this._layerInfos = null;
        this.inherited(arguments);
    },

   /*****************
   * Public Methods
   *****************/
    refresh: function(){
        this._updateSelection();
    },

    first: function(){
        this.onFirstFeature();
    },

    last: function(){
        this.onLastFeature();
    },

    next: function(){
        this.onNextFeature();
    },

    previous: function(){
        this.onPreviousFeature();
    },
    
    showFeature: function(feature, fLayer){
      if (fLayer) {
        this._createOnlyFirstTime = true;
      }
      this._updateSelection([feature], fLayer);
      this._updateUI();
    },

   /*****************
   * Event Listeners
   *****************/
    onLayerSelectionChange: function(layer, selection, selectionMethod){
        this._createOnlyFirstTime = false;
        this._featureIdx = (selectionMethod === esri.layers.FeatureLayer.SELECTION_NEW) ? 0 : this._featureIdx;
        this._updateSelection();
        this._updateUI();
    },

    onLayerSelectionClear: function(){
        if (!this._selection || this._selection.length <= 0){ return; }
        this._numFeatures = 0;
        this._featureIdx = 0;
        this._selection = [];
        this._currentFeature = null;
        this._currentLInfo = null;
        this._updateUI();
    },

    onLayerEditsComplete: function(lInfo, adds, updates, deletes){
        deletes = deletes || [];
        if (deletes.length){
          var selection = this._selection;
          var oidFld = lInfo.featureLayer.objectIdField;
          dojo.forEach(deletes, dojo.hitch(this, function(del){
            dojo.some(selection, dojo.hitch(this, function(item, idx){
                if (item.attributes[oidFld] !== del.objectId){ return false; }
                this._selection.splice(idx, 1);
                return true;
            }));
          }));
       }

        adds = adds || [];
        if (adds.length){
            this._selection = esri.dijit.editing.Util.LayerHelper.findFeatures(adds, lInfo.featureLayer);
            this._featureIdx = 0;
        }

        var numFeatures = this._numFeatures = this._selection ? this._selection.length : 0;
        if (adds.length){
            var feature = numFeatures ? this._selection[this._featureIdx] : null;
            if (feature) {
              var fLayer = feature.getLayer();
              var editCapabilities = fLayer.getEditCapabilities();
              if (!(editCapabilities.canCreate && !editCapabilities.canUpdate)) {
                this._showFeature(feature);
              }
            }
        }
        this._updateUI();
    },

    onFieldValueChange: function(fInfo, newFieldVal){
        newFieldVal = (typeof newFieldVal === 'undefined') ? null : newFieldVal;
        var field = fInfo.field;
        // Convert to epoch time if fieldType is date/time
        if (field.type === "esriFieldTypeDate"){
            newFieldVal = (newFieldVal && newFieldVal.getTime) ? newFieldVal.getTime() : (newFieldVal && newFieldVal.toGregorian ? newFieldVal.toGregorian().getTime() : newFieldVal);
        }
        if (this._currentFeature.attributes[field.name] === newFieldVal){ return; }
        var lInfo = this._currentLInfo;
        var feature = this._currentFeature;
        var fieldName = field.name;
        // If typeField changed, update all domain fields
        if (fieldName === lInfo.typeIdField){
            var type = this._findFirst(lInfo.types, 'id', newFieldVal);
            var fInfos = lInfo.fieldInfos;
            dojo.forEach(fInfos, function(fInfo){
              field = fInfo.field;
              if (!field || field.name === lInfo.typeIdField){ return; }
              var node = fInfo.dijit;
              var domain = this._setFieldDomain(node, type, field);
              if (domain && node){
                this._setValue(node, feature.attributes[field.name] + '');
                if (node.isValid() === false){
                  this._setValue(node, null);
                }
              }
            }, this);
        }
        // Fire onAttributeChange to listeners
        this.onAttributeChange(feature, fieldName, newFieldVal);
    },

    onDeleteBtn: function(evt){
        this._deleteFeature();
    },

    onNextFeature: function(evt){
        this._onNextFeature(1);
    },

    onPreviousFeature: function(evt){
        this._onNextFeature( -1);
    },

    onFirstFeature: function(evt){
        this._onNextFeature(this._featureIdx * -1);
    },

    onLastFeature: function(evt){
        this._onNextFeature((this._numFeatures - 1) - this._featureIdx);
    },

   /*******************
   * Internal Methods
   *******************/
    _initLayerInfos: function(){
        var lInfos = this._layerInfos;
        this._editorTrackingInfos = {};
        dojo.forEach(lInfos, this._initLayerInfo, this);
    },

    _initLayerInfo: function(lInfo){
        var fLayer = lInfo.featureLayer;
        // Connect events
        this._connect(fLayer, "onSelectionComplete", dojo.hitch(this, "onLayerSelectionChange", lInfo));
        this._connect(fLayer, "onSelectionClear", dojo.hitch(this, "onLayerSelectionClear", lInfo));
        this._connect(fLayer, 'onEditsComplete', dojo.hitch(this, 'onLayerEditsComplete', lInfo));

        // Initialize layerInfo metadata
        lInfo.showAttachments = fLayer.hasAttachments ? (esri._isDefined(lInfo.showAttachments) ? lInfo.showAttachments : true) : false;
        lInfo.hideFields = lInfo.hideFields || [];
        lInfo.htmlFields = lInfo.htmlFields || [];
        lInfo.isEditable = fLayer.isEditable() ? (esri._isDefined(lInfo.isEditable) ? lInfo.isEditable : true) : false;
        lInfo.typeIdField = fLayer.typeIdField;
        lInfo.layerId = fLayer.id;
        lInfo.types = fLayer.types;
        if (!lInfo.showGlobalID && fLayer.globalIdField){ lInfo.hideFields.push(fLayer.globalIdField); }
        if (!lInfo.showObjectID){ lInfo.hideFields.push(fLayer.objectIdField); }

        // Initialize fieldInfos (if no fieldInfos in layerInfo then create default fieldInfos)
        var fields = this._getFields(lInfo.featureLayer);
        if (!fields){ return; }
        //var fInfos = (lInfo.fieldInfos && lInfo.fieldInfos.length) ? dojo.clone(lInfo.fieldInfos) : [];
        var fInfos = lInfo.fieldInfos || [];
        fInfos = dojo.map(fInfos, function(fInfo){
          return dojo.mixin({}, fInfo);
        });
        if (!fInfos.length){
            fields = dojo.filter(fields, dojo.hitch(this, function(field){ return !this._isInFields(field.name, lInfo.hideFields); }));
            lInfo.fieldInfos = dojo.map(fields, dojo.hitch(this, function(field){
                var stringFieldOption = (this._isInFields(field.name, lInfo.htmlFields ) ? esri.dijit.AttributeInspector.STRING_FIELD_OPTION_RICHTEXT : esri.dijit.AttributeInspector.STRING_FIELD_OPTION_TEXTBOX);
                return {'fieldName':field.name, 'field':field, 'stringFieldOption': stringFieldOption};
            }));
        } else {
            lInfo.fieldInfos = dojo.filter(dojo.map(fInfos, dojo.hitch(this, function(fInfo){
              var stringFieldOption = fInfo.stringFieldOption || (this._isInFields(fInfo.fieldName, lInfo.htmlFields) ? esri.dijit.AttributeInspector.STRING_FIELD_OPTION_RICHTEXT : esri.dijit.AttributeInspector.STRING_FIELD_OPTION_TEXTBOX);
              return dojo.mixin(fInfo, {'field': this._findFirst(fields, 'name', fInfo.fieldName), 'stringFieldOption':stringFieldOption});
            })), 'return item.field;');
        }        
        //find editor tracking info
        var editorTrackingFields = [];
        if (fLayer.editFieldsInfo){
          if (fLayer.editFieldsInfo.creatorField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.creatorField);
          }
          if (fLayer.editFieldsInfo.creationDateField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.creationDateField);
          }
          if (fLayer.editFieldsInfo.editorField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.editorField);
          }
          if (fLayer.editFieldsInfo.editDateField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.editDateField);
          }
        }
        this._editorTrackingInfos[fLayer.id] = editorTrackingFields;
    },

    _createAttachmentEditor: function(){
        this._attachmentEditor = null;
        var lInfos = this._layerInfos;
        var create = dojo.filter(lInfos, 'return item.showAttachments');
        if (!create || !create.length){ return; }
        this._attachmentEditor = new esri.dijit.editing.AttachmentEditor({'class':'atiAttachmentEditor'}, this.attachmentEditor);
        this._attachmentEditor.startup();
    },

    _setCurrentLInfo: function(lInfo){
        // Set the layerInfo for the feature currently being edited
        var currentLayer = this._currentLInfo ? this._currentLInfo.featureLayer : null;
        var fLayer = lInfo.featureLayer;
        //Update currentLayerInfo only if layer has changed since last call
        //But if ownershipbasedAccessControl is enabled, it should recreate the table since the editable fields may change according to features
        //If it's a create only feature layer, the table should be recreated every time as well.        
        if (currentLayer && currentLayer.id === fLayer.id && !currentLayer.ownershipBasedAccessControlForFeatures){
            var editCapabilities = fLayer.getEditCapabilities();
            if (!(editCapabilities.canCreate && !editCapabilities.canUpdate)) {
                return;
            }
        }
        this._currentLInfo = lInfo;
        this._createTable();
    },

    _updateSelection: function(selectedFeatures, fLayer) {
        this._selection = selectedFeatures || [];
        var lInfos = this._layerInfos;
        dojo.forEach(lInfos, this._getSelection, this);
        var numFeatures = this._numFeatures = this._selection.length;
        var feature = numFeatures ? this._selection[this._featureIdx] : null;
        this._showFeature(feature, fLayer);
    },

    _getSelection: function(lInfo){
        var selection = lInfo.featureLayer.getSelectedFeatures();
        this._selection = this._selection.concat(selection);
        //dojo.forEach(selection, function(feature){ feature.__lInfo = lInfo; }, this);
    },

    _updateUI: function(){
        var numFeatures = this._numFeatures;
        var lInfo = this._currentLInfo;
        this.layerName.innerHTML = (!lInfo || numFeatures === 0) ? this.NLS_noFeaturesSelected : (lInfo.featureLayer ? lInfo.featureLayer.name : '');

        dojo.style(this.attributeTable, "display", numFeatures ? "" : "none");
        dojo.style(this.editButtons, "display", numFeatures ? "": "none");
        dojo.style(this.navButtons, "display", (!this._hideNavButtons && (numFeatures > 1) ? "": "none"));
        this.navMessage.innerHTML = esri.substitute({idx: this._featureIdx + 1, of:this.NLS_of, numFeatures:this._numFeatures}, this._navMessage);
        
        if (this._attachmentEditor){
            dojo.style(this._attachmentEditor.domNode, "display", ((lInfo && lInfo.showAttachments) && numFeatures) ? "": "none");
        }
        
        var showDeleteBtn = ((lInfo && lInfo.showDeleteButton === false) || !this._canDelete) ? false: true;
        dojo.style(this.deleteBtn.domNode, "display", showDeleteBtn ? "": "none");
        
        // Reset the scrollbar to top
        if (this.domNode.parentNode && this.domNode.parentNode.scrollTop > 0){ this.domNode.parentNode.scrollTop = 0; }
    },

    _onNextFeature: function(direction){
        this._featureIdx += direction;
        if (this._featureIdx < 0){
            this._featureIdx = this._numFeatures - 1;
        } else if (this._featureIdx >= this._numFeatures){
            this._featureIdx = 0;
        }
        var feature = this._selection.length ? this._selection[this._featureIdx] : null;
        this._showFeature(feature);
        this._updateUI();
        this.onNext(feature);
    },

    _deleteFeature: function(){
        this.onDelete(this._currentFeature);
    },

    _showFeature: function(feature, fLayer){
        //Return if called with feature already being edited
        //if (!feature || feature === this._currentFeature){ return; }
        if (!feature){ return; }
        this._currentFeature = feature;
        var featureLayer = fLayer? fLayer: feature.getLayer();
        //get edit capabilities info
        var featureEditCapabilities = featureLayer.getEditCapabilities({feature: feature, userId: this._userIds[featureLayer.id]});
        this._canUpdate = featureEditCapabilities.canUpdate;
        this._canDelete = featureEditCapabilities.canDelete;
        
        var lInfo = this._getLInfoFromFeatureLayer(featureLayer);
        if (!lInfo){ return; }
        this._setCurrentLInfo(lInfo);
        var attributes = feature.attributes;
        var type = this._findFirst(lInfo.types, 'id', attributes[lInfo.typeIdField]);
        var node, field = null;
        var fInfos = lInfo.fieldInfos;
        dojo.forEach(fInfos, function(fInfo){
            field = fInfo.field;
            node = fInfo.dijit || null;
            if (!node){ return; }
            var domain = this._setFieldDomain(node, type, field);
            var value = attributes[field.name];
            value = (value && domain && domain.codedValues && domain.codedValues.length) ? (domain.codedValues[value] ? domain.codedValues[value].name : value) : value;
            if (!esri._isDefined(value)){ value = ''; }
            if (node.declaredClass === 'dijit.form.DateTextBox'){
                value = (value === '') ? null : new Date(value);
            } else if (node.declaredClass === 'dijit.form.FilteringSelect'){
                node._lastValueReported = null;
                value = attributes[field.name] + '';
            }
            try{
                this._setValue(node, value);
                if (node.declaredClass === 'dijit.form.FilteringSelect' && node.isValid() === false){
                  this._setValue(node, null);
                }
            } catch(error){
                node.set('displayedValue', this.NLS_errorInvalid, false);
            }
        }, this);
        if (this._attachmentEditor && lInfo.showAttachments){
            this._attachmentEditor.showAttachments(this._currentFeature);
        }
        var editorTrackingInfo = featureLayer.getEditSummary(feature);
        if (editorTrackingInfo) {
          this.editorTrackingInfoDiv.innerHTML = editorTrackingInfo;
          esri.show(this.editorTrackingInfoDiv);
        }
        else {
          esri.hide(this.editorTrackingInfoDiv);
        }
    },

    _setFieldDomain: function(node, type, field){
        if (!node){ return null; }
        var domain = field.domain;
        if (type && type.domains){
            if (type.domains[field.name] && type.domains[field.name] instanceof esri.layers.InheritedDomain === false){
                domain = type.domains[field.name];
            }
        }
        if (!domain){ return null; }
        if (domain.codedValues && domain.codedValues.length > 0){
            node.set("store", this._toStore(dojo.map(domain.codedValues, "return { id: item.code += '', name: item.name };")));
            this._setValue(node, domain.codedValues[0].code);
        } else{
            node.constraints = { min: esri._isDefined(domain.minValue) ? domain.minValue : Number.MIN_VALUE,  max: esri._isDefined(domain.maxValue) ? domain.maxValue : Number.MAX_VALUE};
            this._setValue(node, node.constraints.min);
        }
        return domain;
    },
    
    _setValue : function(node, value){
        if (!node.set){ return; }
        node._onChangeActive = false;
        node.set('value', value, true);
        node._onChangeActive = true;
    },

    _getFields: function(featureLayer){
        var outFields = featureLayer._getOutFields();
        if (!outFields){ return null; }
        var fields = featureLayer.fields;
        return (outFields == "*") ? fields : dojo.filter(dojo.map(outFields, dojo.hitch(this, '_findFirst', fields, 'name')), esri._isDefined);
    },

    _isInFields: function(fieldName, fieldArr){
        if (!fieldName || !fieldArr && !fieldArr.length){ return false; }
        return dojo.some(fieldArr, function(name){ return name.toLowerCase() === fieldName.toLowerCase(); });
    },

    _findFirst: function(collection, propertyName, value){
        var result = dojo.filter(collection, function(item){ return item.hasOwnProperty(propertyName) && item[propertyName] === value; });
        return (result && result.length) ? result[0] : null;
    },
    
    _getLInfoFromFeatureLayer: function(fLayer){
        var layerId = fLayer ? fLayer.id : null;
        return this._findFirst(this._layerInfos, "layerId", layerId);
    },

    _createTable: function(){
        this._destroyAttributeTable();
        this.attributeTable.innerHTML = "";
        this._attributes = dojo.create("table", { cellspacing: "0", cellpadding: "0" }, this.attributeTable);
        var tbody = dojo.create("tbody", null, this._attributes);
        var feature = this._currentFeature;
        var lInfo = this._currentLInfo;
        var type = this._findFirst(lInfo.types, 'id', feature.attributes[lInfo.typeIdField]);
        var fInfos = lInfo.fieldInfos;
        dojo.forEach(fInfos, dojo.hitch(this, '_createField', type, tbody), this);
        this._createOnlyFirstTime = false;
    },
    
    _createField: function(type, tbody, fInfo){
        var lInfo = this._currentLInfo;
        var field = fInfo.field;
        if (this._isInFields(field.name, lInfo.hideFields)){ return; }
        if (this._isInFields(field.name, this._editorTrackingInfos[lInfo.featureLayer.id])){ return; }
        var node = dojo.create("tr", null, tbody);
        //var isRichTextFld = fInfo.stringFieldOption === esri.dijit.AttributeInspector.STRING_FIELD_OPTION_RICHTEXT;
        var td = dojo.create("td", { innerHTML: fInfo.label || field.alias || field.name, 'class': 'atiLabel' }, node);
        //if (!isRichTextFld){ td = dojo.create("td", null, node); }
        td = dojo.create("td", null, node);
        
        var fieldDijit = null;
        var disabled = false;
        if (fInfo.customField){
          dojo.place(fInfo.customField.domNode || fInfo.customField, dojo.create("div", null, td), "first");
          fieldDijit = fInfo.customField;
        }
        //check ownership based access control and capabilities by this._canUpdate
        else if (lInfo.isEditable === false || field.editable === false || fInfo.isEditable === false ||
                   field.type === "esriFieldTypeOID" || field.type === "esriFieldTypeGlobalID"|| 
	          (!this._canUpdate && !this._createOnlyFirstTime)){
            disabled = true;
        }
        
        if (!fieldDijit && (lInfo.typeIdField && field.name.toLowerCase() == lInfo.typeIdField.toLowerCase())){
            fieldDijit = this._createTypeField(field, fInfo, td);
        } else if (!fieldDijit) {
            fieldDijit = this._createDomainField(field, fInfo, type, td);
        }
        
        if (!fieldDijit){
            switch (field.type){
            case "esriFieldTypeString":
                fieldDijit = this._createStringField(field, fInfo, td);
                break;
            case "esriFieldTypeDate":
                fieldDijit = this._createDateField(field, fInfo, td);
                break;
            case "esriFieldTypeInteger":
            case "esriFieldTypeSmallInteger":
                fieldDijit = this._createIntField(field, fInfo, td);
                break;
            case "esriFieldTypeSingle":
            case "esriFieldTypeDouble":
                fieldDijit = this._createFltField(field, fInfo, td);
                break;
            default:
                fieldDijit = this._createStringField(field, fInfo, td);
                break;
            }
        }
        // Add tooltip
        if (fInfo.tooltip && fInfo.tooltip.length){ this._toolTips.push(new dijit.Tooltip({ connectId: [fieldDijit.id], label:fInfo.tooltip}));}
        fieldDijit.onChange = dojo.hitch(this, "onFieldValueChange", fInfo);
        fieldDijit.set('disabled', disabled);
        fInfo.dijit = fieldDijit;
    },

    _createTypeField: function(field, fInfo, node){
        return new dijit.form.FilteringSelect({
            'class': 'atiField',
            name: field.alias || field.name,
            store: this._toStore(dojo.map(this._currentLInfo.types, "return { id: item.id, name: item.name };")),
            searchAttr: "name"
        }, dojo.create("div", null, node));
    },

    _createDomainField: function(field, fInfo, type, node){
        var domain = field.domain;
        if (type && type.domains){
            if (type.domains[field.name] && type.domains[field.name] instanceof esri.layers.InheritedDomain === false){
                domain = type.domains[field.name];
            }
        }
        if (!domain){ return null; }
        if (domain.codedValues){
            return new dijit.form.FilteringSelect({
                'class': 'atiField',
                name: field.alias || field.name,
                store: null,
                searchAttr: "name",
                required: field.nullable || false
            }, dojo.create("div", null, node));
        } else{
            return new dijit.form.NumberSpinner({
              'class': 'atiField'
            }, dojo.create("div", null, node));
        }
    },

    _createStringField: function(field, fInfo, node){
        var params = {
            'class': 'atiField',
            trim: true,
            maxLength: field.length
        };
        if (fInfo.stringFieldOption === esri.dijit.AttributeInspector.STRING_FIELD_OPTION_TEXTAREA){
              params['class'] += ' atiTextAreaField';
              return new dijit.form.SimpleTextarea(params, dojo.create("div", null, node));
        } else if (fInfo.stringFieldOption === esri.dijit.AttributeInspector.STRING_FIELD_OPTION_RICHTEXT){
              //node.colSpan = 2;
              params['class'] += ' atiRichTextField';
              params.height = '100%';
              params.width = '100%';
              params.plugins = fInfo.richTextPlugins || ['bold', 'italic', 'underline', 'foreColor', 'hiliteColor', '|', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', '|', 'insertOrderedList', 'insertUnorderedList', 'indent', 'outdent', '|', 'createLink']; 
              return new dijit.Editor(params, dojo.create("div", null, node));
        } else{ 
            return new dijit.form.TextBox(params, dojo.create("div", null, node));
        }
    },

    _createDateField: function(field, fInfo, node){
        var params = {'class': 'atiField', 'trim': true};
        if (this._datePackage){
          params.datePackage = this._datePackage;
        }
        return new dijit.form.DateTextBox(params, dojo.create("div", null, node));
    },

    _createIntField: function(field, fInfo, node){
        return new dijit.form.NumberTextBox({
            'class': 'atiField',
            constraints: { places: 0 },
            invalidMessage: this.NLS_validationInt,
            trim: true
        }, dojo.create("div", null, node));
    },

    _createFltField: function(field, fInfo, node){
        return new dijit.form.NumberTextBox({
            'class': 'atiField',
            trim: true,
            invalidMessage: this.NLS_validationFlt
        }, dojo.create("div", null, node));
    },

    _toStore: function(items){
        return new dojo.data.ItemFileReadStore({
            data: { identifier: "id", label: "name", items: items }
        });
    },
    
    _connect: function(node, evt, func){
        this._aiConnects.push(dojo.connect(node, evt, func));
    },
    
    _getDatePackage: function(params) {
      if (params.datePackage === null){
        return null;
      } else if (params.datePackage){
        return params.datePackage;
      } //else if (dojo.locale === 'ar'){
        //return 'dojox.date.islamic';        
      //}      
      return null;
    },

    _destroyAttributeTable: function(){
        var lInfos = this.layerInfos;
        dojo.forEach(lInfos, function(lInfo){
            var fInfos = lInfo.fieldInfos;
            dojo.forEach(fInfos, function(fInfo){
              var dijit = fInfo.dijit;
              if (dijit){ 
                dijit._onChangeHandle = null;
                if (fInfo.customField){ return; }
                if (dijit.destroyRecursive){
                  dijit.destroyRecursive();
                } else if (dijit.destroy){
                  dijit.destroy();
                } 
              }
              fInfo.dijit = null;
            }, this);
        }, this);
        var toolTips = this._toolTips;
        dojo.forEach(toolTips, 'item.destroy(); delete item;');
        this._toolTips = [];
        if (this._attributes){
            dojo.destroy(this._attributes);
        }
    }
});
dojo.mixin(esri.dijit.AttributeInspector, {
    STRING_FIELD_OPTION_RICHTEXT: "richtext", STRING_FIELD_OPTION_TEXTAREA: "textarea", STRING_FIELD_OPTION_TEXTBOX: "textbox"
});
});

},
'dijit/form/_ListMouseMixin':function(){
define("dijit/form/_ListMouseMixin", [
	"dojo/_base/declare", // declare
	"dojo/_base/event", // event.stop
	"dojo/touch",
	"./_ListBase"
], function(declare, event, touch, _ListBase){

/*=====
var _ListBase = dijit.form._ListBase;
=====*/

// module:
//		dijit/form/_ListMouseMixin
// summary:
//		a mixin to handle mouse or touch events for a focus-less menu

return declare( "dijit.form._ListMouseMixin", _ListBase, {
	// summary:
	//		a Mixin to handle mouse or touch events for a focus-less menu
	//		Abstract methods that must be defined externally:
	//			onClick: item was chosen (mousedown somewhere on the menu and mouseup somewhere on the menu)
	// tags:
	//		private

	postCreate: function(){
		this.inherited(arguments);
		this.connect(this.domNode, touch.press, "_onMouseDown");
		this.connect(this.domNode, touch.release, "_onMouseUp");
		this.connect(this.domNode, "onmouseover", "_onMouseOver");
		this.connect(this.domNode, "onmouseout", "_onMouseOut");
	},

	_onMouseDown: function(/*Event*/ evt){
		event.stop(evt);
		if(this._hoveredNode){
			this.onUnhover(this._hoveredNode);
			this._hoveredNode = null;
		}
		this._isDragging = true;
		this._setSelectedAttr(this._getTarget(evt));
	},

	_onMouseUp: function(/*Event*/ evt){
		event.stop(evt);
		this._isDragging = false;
		var selectedNode = this._getSelectedAttr();
		var target = this._getTarget(evt);
		var hoveredNode = this._hoveredNode;
		if(selectedNode && target == selectedNode){
			this.onClick(selectedNode);
		}else if(hoveredNode && target == hoveredNode){ // drag to select
			this._setSelectedAttr(hoveredNode);
			this.onClick(hoveredNode);
		}
	},

	_onMouseOut: function(/*Event*/ /*===== evt ====*/){
		if(this._hoveredNode){
			this.onUnhover(this._hoveredNode);
			if(this._getSelectedAttr() == this._hoveredNode){
				this.onSelect(this._hoveredNode);
			}
			this._hoveredNode = null;
		}
		if(this._isDragging){
			this._cancelDrag = (new Date()).getTime() + 1000; // cancel in 1 second if no _onMouseOver fires
		}
	},

	_onMouseOver: function(/*Event*/ evt){
		if(this._cancelDrag){
			var time = (new Date()).getTime();
			if(time > this._cancelDrag){
				this._isDragging = false;
			}
			this._cancelDrag = null;
		}
		var node = this._getTarget(evt);
		if(!node){ return; }
		if(this._hoveredNode != node){
			if(this._hoveredNode){
				this._onMouseOut({ target: this._hoveredNode });
			}
			if(node && node.parentNode == this.containerNode){
				if(this._isDragging){
					this._setSelectedAttr(node);
				}else{
					this._hoveredNode = node;
					this.onHover(node);
				}
			}
		}
	}
});

});

},
'url:dijit/form/templates/DropDownBox.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\"\r\n\tid=\"widget_${id}\"\r\n\trole=\"combobox\"\r\n\t><div class='dijitReset dijitRight dijitButtonNode dijitArrowButton dijitDownArrowButton dijitArrowButtonContainer'\r\n\t\tdata-dojo-attach-point=\"_buttonNode, _popupStateNode\" role=\"presentation\"\r\n\t\t><input class=\"dijitReset dijitInputField dijitArrowButtonInner\" value=\"&#9660; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t\t\t${_buttonInputDisabled}\r\n\t/></div\r\n\t><div class='dijitReset dijitValidationContainer'\r\n\t\t><input class=\"dijitReset dijitInputField dijitValidationIcon dijitValidationInner\" value=\"&#935; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t/></div\r\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\r\n\t\t><input class='dijitReset dijitInputInner' ${!nameAttrSetting} type=\"text\" autocomplete=\"off\"\r\n\t\t\tdata-dojo-attach-point=\"textbox,focusNode\" role=\"textbox\" aria-haspopup=\"true\"\r\n\t/></div\r\n></div>\r\n",
'dijit/form/NumberTextBox':function(){
define("dijit/form/NumberTextBox", [
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.hitch lang.mixin
	"dojo/number", // number._realNumberRegexp number.format number.parse number.regexp
	"./RangeBoundTextBox"
], function(declare, lang, number, RangeBoundTextBox){

/*=====
	var RangeBoundTextBox = dijit.form.RangeBoundTextBox;
=====*/

	// module:
	//		dijit/form/NumberTextBox
	// summary:
	//		A TextBox for entering numbers, with formatting and range checking


	/*=====
	declare(
		"dijit.form.NumberTextBox.__Constraints",
		[dijit.form.RangeBoundTextBox.__Constraints, number.__FormatOptions, number.__ParseOptions], {
		// summary:
		//		Specifies both the rules on valid/invalid values (minimum, maximum,
		//		number of required decimal places), and also formatting options for
		//		displaying the value when the field is not focused.
		// example:
		//		Minimum/maximum:
		//		To specify a field between 0 and 120:
		//	|		{min:0,max:120}
		//		To specify a field that must be an integer:
		//	|		{fractional:false}
		//		To specify a field where 0 to 3 decimal places are allowed on input:
		//	|		{places:'0,3'}
	});
	=====*/

	var NumberTextBoxMixin = declare("dijit.form.NumberTextBoxMixin", null, {
		// summary:
		//		A mixin for all number textboxes
		// tags:
		//		protected

		// Override ValidationTextBox.regExpGen().... we use a reg-ex generating function rather
		// than a straight regexp to deal with locale (plus formatting options too?)
		regExpGen: number.regexp,

		/*=====
		// constraints: dijit.form.NumberTextBox.__Constraints
		//		Despite the name, this parameter specifies both constraints on the input
		//		(including minimum/maximum allowed values) as well as
		//		formatting options like places (the number of digits to display after
		//		the decimal point).  See `dijit.form.NumberTextBox.__Constraints` for details.
		constraints: {},
		======*/

		// value: Number
		//		The value of this NumberTextBox as a Javascript Number (i.e., not a String).
		//		If the displayed value is blank, the value is NaN, and if the user types in
		//		an gibberish value (like "hello world"), the value is undefined
		//		(i.e. get('value') returns undefined).
		//
		//		Symmetrically, set('value', NaN) will clear the displayed value,
		//		whereas set('value', undefined) will have no effect.
		value: NaN,

		// editOptions: [protected] Object
		//		Properties to mix into constraints when the value is being edited.
		//		This is here because we edit the number in the format "12345", which is
		//		different than the display value (ex: "12,345")
		editOptions: { pattern: '#.######' },

		/*=====
		_formatter: function(value, options){
			// summary:
			//		_formatter() is called by format().  It's the base routine for formatting a number,
			//		as a string, for example converting 12345 into "12,345".
			// value: Number
			//		The number to be converted into a string.
			// options: dojo.number.__FormatOptions?
			//		Formatting options
			// tags:
			//		protected extension

			return "12345";		// String
		},
		 =====*/
		_formatter: number.format,

		postMixInProperties: function(){
			this.inherited(arguments);
			this._set("type", "text"); // in case type="number" was specified which messes up parse/format
		},

		_setConstraintsAttr: function(/*Object*/ constraints){
			var places = typeof constraints.places == "number"? constraints.places : 0;
			if(places){ places++; } // decimal rounding errors take away another digit of precision
			if(typeof constraints.max != "number"){
				constraints.max = 9 * Math.pow(10, 15-places);
			}
			if(typeof constraints.min != "number"){
				constraints.min = -9 * Math.pow(10, 15-places);
			}
			this.inherited(arguments, [ constraints ]);
			if(this.focusNode && this.focusNode.value && !isNaN(this.value)){
				this.set('value', this.value);
			}
		},

		_onFocus: function(){
			if(this.disabled){ return; }
			var val = this.get('value');
			if(typeof val == "number" && !isNaN(val)){
				var formattedValue = this.format(val, this.constraints);
				if(formattedValue !== undefined){
					this.textbox.value = formattedValue;
				}
			}
			this.inherited(arguments);
		},

		format: function(/*Number*/ value, /*dojo.number.__FormatOptions*/ constraints){
			// summary:
			//		Formats the value as a Number, according to constraints.
			// tags:
			//		protected

			var formattedValue = String(value);
			if(typeof value != "number"){ return formattedValue; }
			if(isNaN(value)){ return ""; }
			// check for exponential notation that dojo.number.format chokes on
			if(!("rangeCheck" in this && this.rangeCheck(value, constraints)) && constraints.exponent !== false && /\de[-+]?\d/i.test(formattedValue)){
				return formattedValue;
			}
			if(this.editOptions && this.focused){
				constraints = lang.mixin({}, constraints, this.editOptions);
			}
			return this._formatter(value, constraints);
		},

		/*=====
		_parser: function(value, constraints){
			// summary:
			//		Parses the string value as a Number, according to constraints.
			// value: String
			//		String representing a number
			// constraints: dojo.number.__ParseOptions
			//		Formatting options
			// tags:
			//		protected

			return 123.45;		// Number
		},
		=====*/
		_parser: number.parse,

		parse: function(/*String*/ value, /*number.__FormatOptions*/ constraints){
			// summary:
			//		Replaceable function to convert a formatted string to a number value
			// tags:
			//		protected extension

			var v = this._parser(value, lang.mixin({}, constraints, (this.editOptions && this.focused) ? this.editOptions : {}));
			if(this.editOptions && this.focused && isNaN(v)){
				v = this._parser(value, constraints); // parse w/o editOptions: not technically needed but is nice for the user
			}
			return v;
		},

		_getDisplayedValueAttr: function(){
			var v = this.inherited(arguments);
			return isNaN(v) ? this.textbox.value : v;
		},

		filter: function(/*Number*/ value){
			// summary:
			//		This is called with both the display value (string), and the actual value (a number).
			//		When called with the actual value it does corrections so that '' etc. are represented as NaN.
			//		Otherwise it dispatches to the superclass's filter() method.
			//
			//		See `dijit.form.TextBox.filter` for more details.
			return (value === null || value === '' || value === undefined) ? NaN : this.inherited(arguments); // set('value', null||''||undefined) should fire onChange(NaN)
		},

		serialize: function(/*Number*/ value, /*Object?*/ options){
			// summary:
			//		Convert value (a Number) into a canonical string (ie, how the number literal is written in javascript/java/C/etc.)
			// tags:
			//		protected
			return (typeof value != "number" || isNaN(value)) ? '' : this.inherited(arguments);
		},

		_setBlurValue: function(){
			var val = lang.hitch(lang.mixin({}, this, { focused: true }), "get")('value'); // parse with editOptions
			this._setValueAttr(val, true);
		},

		_setValueAttr: function(/*Number*/ value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
			// summary:
			//		Hook so set('value', ...) works.
			if(value !== undefined && formattedValue === undefined){
				formattedValue = String(value);
				if(typeof value == "number"){
					if(isNaN(value)){ formattedValue = '' }
					// check for exponential notation that number.format chokes on
					else if(("rangeCheck" in this && this.rangeCheck(value, this.constraints)) || this.constraints.exponent === false || !/\de[-+]?\d/i.test(formattedValue)){
						formattedValue = undefined; // lets format compute a real string value
					}
				}else if(!value){ // 0 processed in if branch above, ''|null|undefined flows through here
					formattedValue = '';
					value = NaN;
				}else{ // non-numeric values
					value = undefined;
				}
			}
			this.inherited(arguments, [value, priorityChange, formattedValue]);
		},

		_getValueAttr: function(){
			// summary:
			//		Hook so get('value') works.
			//		Returns Number, NaN for '', or undefined for unparseable text
			var v = this.inherited(arguments); // returns Number for all values accepted by parse() or NaN for all other displayed values

			// If the displayed value of the textbox is gibberish (ex: "hello world"), this.inherited() above
			// returns NaN; this if() branch converts the return value to undefined.
			// Returning undefined prevents user text from being overwritten when doing _setValueAttr(_getValueAttr()).
			// A blank displayed value is still returned as NaN.
			if(isNaN(v) && this.textbox.value !== ''){
				if(this.constraints.exponent !== false && /\de[-+]?\d/i.test(this.textbox.value) && (new RegExp("^"+number._realNumberRegexp(lang.mixin({}, this.constraints))+"$").test(this.textbox.value))){	// check for exponential notation that parse() rejected (erroneously?)
					var n = Number(this.textbox.value);
					return isNaN(n) ? undefined : n; // return exponential Number or undefined for random text (may not be possible to do with the above RegExp check)
				}else{
					return undefined; // gibberish
				}
			}else{
				return v; // Number or NaN for ''
			}
		},

		isValid: function(/*Boolean*/ isFocused){
			// Overrides dijit.form.RangeBoundTextBox.isValid to check that the editing-mode value is valid since
			// it may not be formatted according to the regExp validation rules
			if(!this.focused || this._isEmpty(this.textbox.value)){
				return this.inherited(arguments);
			}else{
				var v = this.get('value');
				if(!isNaN(v) && this.rangeCheck(v, this.constraints)){
					if(this.constraints.exponent !== false && /\de[-+]?\d/i.test(this.textbox.value)){ // exponential, parse doesn't like it
						return true; // valid exponential number in range
					}else{
						return this.inherited(arguments);
					}
				}else{
					return false;
				}
			}
		}
	});
/*=====
	NumberTextBoxMixin = dijit.form.NumberTextBoxMixin;
=====*/

	var NumberTextBox = declare("dijit.form.NumberTextBox", [RangeBoundTextBox,NumberTextBoxMixin], {
		// summary:
		//		A TextBox for entering numbers, with formatting and range checking
		// description:
		//		NumberTextBox is a textbox for entering and displaying numbers, supporting
		//		the following main features:
		//
		//			1. Enforce minimum/maximum allowed values (as well as enforcing that the user types
		//				a number rather than a random string)
		//			2. NLS support (altering roles of comma and dot as "thousands-separator" and "decimal-point"
		//				depending on locale).
		//			3. Separate modes for editing the value and displaying it, specifically that
		//				the thousands separator character (typically comma) disappears when editing
		//				but reappears after the field is blurred.
		//			4. Formatting and constraints regarding the number of places (digits after the decimal point)
		//				allowed on input, and number of places displayed when blurred (see `constraints` parameter).

		baseClass: "dijitTextBox dijitNumberTextBox"
	});

	NumberTextBox.Mixin = NumberTextBoxMixin;	// for monkey patching

	return NumberTextBox;
});

},
'esri/dijit/editing/Util':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojo/DeferredList"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.Util");
dojo.require("dojo.DeferredList");

esri.dijit.editing.Util.LayerHelper = {
    findFeatures : function(ids, layer, callback){
        var oidFld   = layer.objectIdField;
        var graphics = layer.graphics;
        var features = dojo.filter(graphics, function(graphic){
            return dojo.some(ids, function(id){
                return graphic.attributes[oidFld] === id.objectId;
            });
        });        
        if (callback){
            callback(features);
        } else {        
            return features;
        }
    },
    
    getSelection : function(layers) {
        var selectedFeatures = [];                    
        dojo.forEach(layers, function(layer){            
            var selection = layer.getSelectedFeatures();                        
             dojo.forEach(selection, function(feature){
                 selectedFeatures.push(feature);       
             });            
        });        
        return selectedFeatures;             
      }
};

});

},
'dijit/Tooltip':function(){
require({cache:{
'url:dijit/templates/Tooltip.html':"<div class=\"dijitTooltip dijitTooltipLeft\" id=\"dojoTooltip\"\r\n\t><div class=\"dijitTooltipContainer dijitTooltipContents\" data-dojo-attach-point=\"containerNode\" role='alert'></div\r\n\t><div class=\"dijitTooltipConnector\" data-dojo-attach-point=\"connectorNode\"></div\r\n></div>\r\n"}});
define("dijit/Tooltip", [
	"dojo/_base/array", // array.forEach array.indexOf array.map
	"dojo/_base/declare", // declare
	"dojo/_base/fx", // fx.fadeIn fx.fadeOut
	"dojo/dom", // dom.byId
	"dojo/dom-class", // domClass.add
	"dojo/dom-geometry", // domGeometry.getMarginBox domGeometry.position
	"dojo/dom-style", // domStyle.set, domStyle.get
	"dojo/_base/lang", // lang.hitch lang.isArrayLike
	"dojo/_base/sniff", // has("ie")
	"dojo/_base/window", // win.body
	"./_base/manager",	// manager.defaultDuration
	"./place",
	"./_Widget",
	"./_TemplatedMixin",
	"./BackgroundIframe",
	"dojo/text!./templates/Tooltip.html",
	"."		// sets dijit.showTooltip etc. for back-compat
], function(array, declare, fx, dom, domClass, domGeometry, domStyle, lang, has, win,
			manager, place, _Widget, _TemplatedMixin, BackgroundIframe, template, dijit){

/*=====
	var _Widget = dijit._Widget;
	var BackgroundIframe = dijit.BackgroundIframe;
	var _TemplatedMixin = dijit._TemplatedMixin;
=====*/

	// module:
	//		dijit/Tooltip
	// summary:
	//		Defines dijit.Tooltip widget (to display a tooltip), showTooltip()/hideTooltip(), and _MasterTooltip


	var MasterTooltip = declare("dijit._MasterTooltip", [_Widget, _TemplatedMixin], {
		// summary:
		//		Internal widget that holds the actual tooltip markup,
		//		which occurs once per page.
		//		Called by Tooltip widgets which are just containers to hold
		//		the markup
		// tags:
		//		protected

		// duration: Integer
		//		Milliseconds to fade in/fade out
		duration: manager.defaultDuration,

		templateString: template,

		postCreate: function(){
			win.body().appendChild(this.domNode);

			this.bgIframe = new BackgroundIframe(this.domNode);

			// Setup fade-in and fade-out functions.
			this.fadeIn = fx.fadeIn({ node: this.domNode, duration: this.duration, onEnd: lang.hitch(this, "_onShow") });
			this.fadeOut = fx.fadeOut({ node: this.domNode, duration: this.duration, onEnd: lang.hitch(this, "_onHide") });
		},

		show: function(innerHTML, aroundNode, position, rtl, textDir){
			// summary:
			//		Display tooltip w/specified contents to right of specified node
			//		(To left if there's no space on the right, or if rtl == true)
			// innerHTML: String
			//		Contents of the tooltip
			// aroundNode: DomNode || dijit.__Rectangle
			//		Specifies that tooltip should be next to this node / area
			// position: String[]?
			//		List of positions to try to position tooltip (ex: ["right", "above"])
			// rtl: Boolean?
			//		Corresponds to `WidgetBase.dir` attribute, where false means "ltr" and true
			//		means "rtl"; specifies GUI direction, not text direction.
			// textDir: String?
			//		Corresponds to `WidgetBase.textdir` attribute; specifies direction of text.


			if(this.aroundNode && this.aroundNode === aroundNode && this.containerNode.innerHTML == innerHTML){
				return;
			}

			// reset width; it may have been set by orient() on a previous tooltip show()
			this.domNode.width = "auto";

			if(this.fadeOut.status() == "playing"){
				// previous tooltip is being hidden; wait until the hide completes then show new one
				this._onDeck=arguments;
				return;
			}
			this.containerNode.innerHTML=innerHTML;
			
			this.set("textDir", textDir);
			this.containerNode.align = rtl? "right" : "left"; //fix the text alignment

			var pos = place.around(this.domNode, aroundNode,
				position && position.length ? position : Tooltip.defaultPosition, !rtl, lang.hitch(this, "orient"));

			// Position the tooltip connector for middle alignment.
			// This could not have been done in orient() since the tooltip wasn't positioned at that time.
			var aroundNodeCoords = pos.aroundNodePos;
			if(pos.corner.charAt(0) == 'M' && pos.aroundCorner.charAt(0) == 'M'){
				this.connectorNode.style.top = aroundNodeCoords.y + ((aroundNodeCoords.h - this.connectorNode.offsetHeight) >> 1) - pos.y + "px";
				this.connectorNode.style.left = "";
			}else if(pos.corner.charAt(1) == 'M' && pos.aroundCorner.charAt(1) == 'M'){
				this.connectorNode.style.left = aroundNodeCoords.x + ((aroundNodeCoords.w - this.connectorNode.offsetWidth) >> 1) - pos.x + "px";
			}

			// show it
			domStyle.set(this.domNode, "opacity", 0);
			this.fadeIn.play();
			this.isShowingNow = true;
			this.aroundNode = aroundNode;
		},

		orient: function(/*DomNode*/ node, /*String*/ aroundCorner, /*String*/ tooltipCorner, /*Object*/ spaceAvailable, /*Object*/ aroundNodeCoords){
			// summary:
			//		Private function to set CSS for tooltip node based on which position it's in.
			//		This is called by the dijit popup code.   It will also reduce the tooltip's
			//		width to whatever width is available
			// tags:
			//		protected
			this.connectorNode.style.top = ""; //reset to default

			//Adjust the spaceAvailable width, without changing the spaceAvailable object
			var tooltipSpaceAvaliableWidth = spaceAvailable.w - this.connectorNode.offsetWidth;

			node.className = "dijitTooltip " +
				{
					"MR-ML": "dijitTooltipRight",
					"ML-MR": "dijitTooltipLeft",
					"TM-BM": "dijitTooltipAbove",
					"BM-TM": "dijitTooltipBelow",
					"BL-TL": "dijitTooltipBelow dijitTooltipABLeft",
					"TL-BL": "dijitTooltipAbove dijitTooltipABLeft",
					"BR-TR": "dijitTooltipBelow dijitTooltipABRight",
					"TR-BR": "dijitTooltipAbove dijitTooltipABRight",
					"BR-BL": "dijitTooltipRight",
					"BL-BR": "dijitTooltipLeft"
				}[aroundCorner + "-" + tooltipCorner];

			// reduce tooltip's width to the amount of width available, so that it doesn't overflow screen
			this.domNode.style.width = "auto";
			var size = domGeometry.getContentBox(this.domNode);

			var width = Math.min((Math.max(tooltipSpaceAvaliableWidth,1)), size.w);
			var widthWasReduced = width < size.w;

			this.domNode.style.width = width+"px";

			//Adjust width for tooltips that have a really long word or a nowrap setting
			if(widthWasReduced){
				this.containerNode.style.overflow = "auto"; //temp change to overflow to detect if our tooltip needs to be wider to support the content
				var scrollWidth = this.containerNode.scrollWidth;
				this.containerNode.style.overflow = "visible"; //change it back
				if(scrollWidth > width){
					scrollWidth = scrollWidth + domStyle.get(this.domNode,"paddingLeft") + domStyle.get(this.domNode,"paddingRight");
					this.domNode.style.width = scrollWidth + "px";
				}
			}

			// Reposition the tooltip connector.
			if(tooltipCorner.charAt(0) == 'B' && aroundCorner.charAt(0) == 'B'){
				var mb = domGeometry.getMarginBox(node);
				var tooltipConnectorHeight = this.connectorNode.offsetHeight;
				if(mb.h > spaceAvailable.h){
					// The tooltip starts at the top of the page and will extend past the aroundNode
					var aroundNodePlacement = spaceAvailable.h - ((aroundNodeCoords.h + tooltipConnectorHeight) >> 1);
					this.connectorNode.style.top = aroundNodePlacement + "px";
					this.connectorNode.style.bottom = "";
				}else{
					// Align center of connector with center of aroundNode, except don't let bottom
					// of connector extend below bottom of tooltip content, or top of connector
					// extend past top of tooltip content
					this.connectorNode.style.bottom = Math.min(
						Math.max(aroundNodeCoords.h/2 - tooltipConnectorHeight/2, 0),
						mb.h - tooltipConnectorHeight) + "px";
					this.connectorNode.style.top = "";
				}
			}else{
				// reset the tooltip back to the defaults
				this.connectorNode.style.top = "";
				this.connectorNode.style.bottom = "";
			}

			return Math.max(0, size.w - tooltipSpaceAvaliableWidth);
		},

		_onShow: function(){
			// summary:
			//		Called at end of fade-in operation
			// tags:
			//		protected
			if(has("ie")){
				// the arrow won't show up on a node w/an opacity filter
				this.domNode.style.filter="";
			}
		},

		hide: function(aroundNode){
			// summary:
			//		Hide the tooltip

			if(this._onDeck && this._onDeck[1] == aroundNode){
				// this hide request is for a show() that hasn't even started yet;
				// just cancel the pending show()
				this._onDeck=null;
			}else if(this.aroundNode === aroundNode){
				// this hide request is for the currently displayed tooltip
				this.fadeIn.stop();
				this.isShowingNow = false;
				this.aroundNode = null;
				this.fadeOut.play();
			}else{
				// just ignore the call, it's for a tooltip that has already been erased
			}
		},

		_onHide: function(){
			// summary:
			//		Called at end of fade-out operation
			// tags:
			//		protected

			this.domNode.style.cssText="";	// to position offscreen again
			this.containerNode.innerHTML="";
			if(this._onDeck){
				// a show request has been queued up; do it now
				this.show.apply(this, this._onDeck);
				this._onDeck=null;
			}
		},
		
		_setAutoTextDir: function(/*Object*/node){
		    // summary:
		    //	    Resolve "auto" text direction for children nodes
		    // tags:
		    //		private

            this.applyTextDir(node, has("ie") ? node.outerText : node.textContent);
            array.forEach(node.children, function(child){this._setAutoTextDir(child); }, this);
		},
		
		_setTextDirAttr: function(/*String*/ textDir){
		    // summary:
		    //		Setter for textDir.
		    // description:
		    //		Users shouldn't call this function; they should be calling
		    //		set('textDir', value)
		    // tags:
		    //		private
	
            this._set("textDir", typeof textDir != 'undefined'? textDir : "");
    	    if (textDir == "auto"){
    	        this._setAutoTextDir(this.containerNode);
    	    }else{
    	        this.containerNode.dir = this.textDir;
    	    }  		             		        
        }
	});

	dijit.showTooltip = function(innerHTML, aroundNode, position, rtl, textDir){
		// summary:
		//		Static method to display tooltip w/specified contents in specified position.
		//		See description of dijit.Tooltip.defaultPosition for details on position parameter.
		//		If position is not specified then dijit.Tooltip.defaultPosition is used.
		// innerHTML: String
		//		Contents of the tooltip
		// aroundNode: dijit.__Rectangle
		//		Specifies that tooltip should be next to this node / area
		// position: String[]?
		//		List of positions to try to position tooltip (ex: ["right", "above"])
		// rtl: Boolean?
		//		Corresponds to `WidgetBase.dir` attribute, where false means "ltr" and true
		//		means "rtl"; specifies GUI direction, not text direction.
		// textDir: String?
		//		Corresponds to `WidgetBase.textdir` attribute; specifies direction of text.

		// after/before don't work, but they used to, so for back-compat convert them to after-centered, before-centered
		if(position){
			position = array.map(position, function(val){
				return {after: "after-centered", before: "before-centered"}[val] || val;
			});
		}

		if(!Tooltip._masterTT){ dijit._masterTT = Tooltip._masterTT = new MasterTooltip(); }
		return Tooltip._masterTT.show(innerHTML, aroundNode, position, rtl, textDir);
	};

	dijit.hideTooltip = function(aroundNode){
		// summary:
		//		Static method to hide the tooltip displayed via showTooltip()
		return Tooltip._masterTT && Tooltip._masterTT.hide(aroundNode);
	};

	var Tooltip = declare("dijit.Tooltip", _Widget, {
		// summary:
		//		Pops up a tooltip (a help message) when you hover over a node.

		// label: String
		//		Text to display in the tooltip.
		//		Specified as innerHTML when creating the widget from markup.
		label: "",

		// showDelay: Integer
		//		Number of milliseconds to wait after hovering over/focusing on the object, before
		//		the tooltip is displayed.
		showDelay: 400,

		// connectId: String|String[]
		//		Id of domNode(s) to attach the tooltip to.
		//		When user hovers over specified dom node, the tooltip will appear.
		connectId: [],

		// position: String[]
		//		See description of `dijit.Tooltip.defaultPosition` for details on position parameter.
		position: [],

		_setConnectIdAttr: function(/*String|String[]*/ newId){
			// summary:
			//		Connect to specified node(s)

			// Remove connections to old nodes (if there are any)
			array.forEach(this._connections || [], function(nested){
				array.forEach(nested, lang.hitch(this, "disconnect"));
			}, this);

			// Make array of id's to connect to, excluding entries for nodes that don't exist yet, see startup()
			this._connectIds = array.filter(lang.isArrayLike(newId) ? newId : (newId ? [newId] : []),
					function(id){ return dom.byId(id); });

			// Make connections
			this._connections = array.map(this._connectIds, function(id){
				var node = dom.byId(id);
				return [
					this.connect(node, "onmouseenter", "_onHover"),
					this.connect(node, "onmouseleave", "_onUnHover"),
					this.connect(node, "onfocus", "_onHover"),
					this.connect(node, "onblur", "_onUnHover")
				];
			}, this);

			this._set("connectId", newId);
		},

		addTarget: function(/*DOMNODE || String*/ node){
			// summary:
			//		Attach tooltip to specified node if it's not already connected

			// TODO: remove in 2.0 and just use set("connectId", ...) interface

			var id = node.id || node;
			if(array.indexOf(this._connectIds, id) == -1){
				this.set("connectId", this._connectIds.concat(id));
			}
		},

		removeTarget: function(/*DomNode || String*/ node){
			// summary:
			//		Detach tooltip from specified node

			// TODO: remove in 2.0 and just use set("connectId", ...) interface

			var id = node.id || node,	// map from DOMNode back to plain id string
				idx = array.indexOf(this._connectIds, id);
			if(idx >= 0){
				// remove id (modifies original this._connectIds but that's OK in this case)
				this._connectIds.splice(idx, 1);
				this.set("connectId", this._connectIds);
			}
		},

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode,"dijitTooltipData");
		},

		startup: function(){
			this.inherited(arguments);

			// If this tooltip was created in a template, or for some other reason the specified connectId[s]
			// didn't exist during the widget's initialization, then connect now.
			var ids = this.connectId;
			array.forEach(lang.isArrayLike(ids) ? ids : [ids], this.addTarget, this);
		},

		_onHover: function(/*Event*/ e){
			// summary:
			//		Despite the name of this method, it actually handles both hover and focus
			//		events on the target node, setting a timer to show the tooltip.
			// tags:
			//		private
			if(!this._showTimer){
				var target = e.target;
				this._showTimer = setTimeout(lang.hitch(this, function(){this.open(target)}), this.showDelay);
			}
		},

		_onUnHover: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		Despite the name of this method, it actually handles both mouseleave and blur
			//		events on the target node, hiding the tooltip.
			// tags:
			//		private

			// keep a tooltip open if the associated element still has focus (even though the
			// mouse moved away)
			if(this._focus){ return; }

			if(this._showTimer){
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
			this.close();
		},

		open: function(/*DomNode*/ target){
 			// summary:
			//		Display the tooltip; usually not called directly.
			// tags:
			//		private

			if(this._showTimer){
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
			Tooltip.show(this.label || this.domNode.innerHTML, target, this.position, !this.isLeftToRight(), this.textDir);

			this._connectNode = target;
			this.onShow(target, this.position);
		},

		close: function(){
			// summary:
			//		Hide the tooltip or cancel timer for show of tooltip
			// tags:
			//		private

			if(this._connectNode){
				// if tooltip is currently shown
				Tooltip.hide(this._connectNode);
				delete this._connectNode;
				this.onHide();
			}
			if(this._showTimer){
				// if tooltip is scheduled to be shown (after a brief delay)
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
		},

		onShow: function(/*===== target, position =====*/){
			// summary:
			//		Called when the tooltip is shown
			// tags:
			//		callback
		},

		onHide: function(){
			// summary:
			//		Called when the tooltip is hidden
			// tags:
			//		callback
		},

		uninitialize: function(){
			this.close();
			this.inherited(arguments);
		}
	});

	Tooltip._MasterTooltip = MasterTooltip;		// for monkey patching
	Tooltip.show = dijit.showTooltip;		// export function through module return value
	Tooltip.hide = dijit.hideTooltip;		// export function through module return value

	// dijit.Tooltip.defaultPosition: String[]
	//		This variable controls the position of tooltips, if the position is not specified to
	//		the Tooltip widget or *TextBox widget itself.  It's an array of strings with the values
	//		possible for `dijit/place::around()`.   The recommended values are:
	//
	//			* before-centered: centers tooltip to the left of the anchor node/widget, or to the right
	//				 in the case of RTL scripts like Hebrew and Arabic
	//			* after-centered: centers tooltip to the right of the anchor node/widget, or to the left
	//				 in the case of RTL scripts like Hebrew and Arabic
	//			* above-centered: tooltip is centered above anchor node
	//			* below-centered: tooltip is centered above anchor node
	//
	//		The list is positions is tried, in order, until a position is found where the tooltip fits
	//		within the viewport.
	//
	//		Be careful setting this parameter.  A value of "above-centered" may work fine until the user scrolls
	//		the screen so that there's no room above the target node.   Nodes with drop downs, like
	//		DropDownButton or FilteringSelect, are especially problematic, in that you need to be sure
	//		that the drop down and tooltip don't overlap, even when the viewport is scrolled so that there
	//		is only room below (or above) the target node, but not both.
	Tooltip.defaultPosition = ["after-centered", "before-centered"];


	return Tooltip;
});

},
'dijit/form/RangeBoundTextBox':function(){
define("dijit/form/RangeBoundTextBox", [
	"dojo/_base/declare", // declare
	"dojo/i18n", // i18n.getLocalization
	"./MappedTextBox"
], function(declare, i18n, MappedTextBox){

/*=====
	var MappedTextBox = dijit.form.MappedTextBox;
=====*/

	// module:
	//		dijit/form/RangeBoundTextBox
	// summary:
	//		Base class for textbox form widgets which defines a range of valid values.

	/*=====
		dijit.form.RangeBoundTextBox.__Constraints = function(){
			// min: Number
			//		Minimum signed value.  Default is -Infinity
			// max: Number
			//		Maximum signed value.  Default is +Infinity
			this.min = min;
			this.max = max;
		}
	=====*/

	return declare("dijit.form.RangeBoundTextBox", MappedTextBox, {
		// summary:
		//		Base class for textbox form widgets which defines a range of valid values.

		// rangeMessage: String
		//		The message to display if value is out-of-range
		rangeMessage: "",

		/*=====
		// constraints: dijit.form.RangeBoundTextBox.__Constraints
		constraints: {},
		======*/

		rangeCheck: function(/*Number*/ primitive, /*dijit.form.RangeBoundTextBox.__Constraints*/ constraints){
			// summary:
			//		Overridable function used to validate the range of the numeric input value.
			// tags:
			//		protected
			return	("min" in constraints? (this.compare(primitive,constraints.min) >= 0) : true) &&
				("max" in constraints? (this.compare(primitive,constraints.max) <= 0) : true); // Boolean
		},

		isInRange: function(/*Boolean*/ /*===== isFocused =====*/){
			// summary:
			//		Tests if the value is in the min/max range specified in constraints
			// tags:
			//		protected
			return this.rangeCheck(this.get('value'), this.constraints);
		},

		_isDefinitelyOutOfRange: function(){
			// summary:
			//		Returns true if the value is out of range and will remain
			//		out of range even if the user types more characters
			var val = this.get('value');
			var isTooLittle = false;
			var isTooMuch = false;
			if("min" in this.constraints){
				var min = this.constraints.min;
				min = this.compare(val, ((typeof min == "number") && min >= 0 && val !=0) ? 0 : min);
				isTooLittle = (typeof min == "number") && min < 0;
			}
			if("max" in this.constraints){
				var max = this.constraints.max;
				max = this.compare(val, ((typeof max != "number") || max > 0) ? max : 0);
				isTooMuch = (typeof max == "number") && max > 0;
			}
			return isTooLittle || isTooMuch;
		},

		_isValidSubset: function(){
			// summary:
			//		Overrides `dijit.form.ValidationTextBox._isValidSubset`.
			//		Returns true if the input is syntactically valid, and either within
			//		range or could be made in range by more typing.
			return this.inherited(arguments) && !this._isDefinitelyOutOfRange();
		},

		isValid: function(/*Boolean*/ isFocused){
			// Overrides dijit.form.ValidationTextBox.isValid to check that the value is also in range.
			return this.inherited(arguments) &&
				((this._isEmpty(this.textbox.value) && !this.required) || this.isInRange(isFocused)); // Boolean
		},

		getErrorMessage: function(/*Boolean*/ isFocused){
			// Overrides dijit.form.ValidationTextBox.getErrorMessage to print "out of range" message if appropriate
			var v = this.get('value');
			if(v !== null && v !== '' && v !== undefined && (typeof v != "number" || !isNaN(v)) && !this.isInRange(isFocused)){ // don't check isInRange w/o a real value
				return this.rangeMessage; // String
			}
			return this.inherited(arguments);
		},

		postMixInProperties: function(){
			this.inherited(arguments);
			if(!this.rangeMessage){
				this.messages = i18n.getLocalization("dijit.form", "validate", this.lang);
				this.rangeMessage = this.messages.rangeMessage;
			}
		},

		_setConstraintsAttr: function(/*Object*/ constraints){
			this.inherited(arguments);
			if(this.focusNode){ // not set when called from postMixInProperties
				if(this.constraints.min !== undefined){
					this.focusNode.setAttribute("aria-valuemin", this.constraints.min);
				}else{
					this.focusNode.removeAttribute("aria-valuemin");
				}
				if(this.constraints.max !== undefined){
					this.focusNode.setAttribute("aria-valuemax", this.constraints.max);
				}else{
					this.focusNode.removeAttribute("aria-valuemax");
				}
			}
		},

		_setValueAttr: function(/*Number*/ value, /*Boolean?*/ priorityChange){
			// summary:
			//		Hook so set('value', ...) works.

			this.focusNode.setAttribute("aria-valuenow", value);
			this.inherited(arguments);
		},

		applyTextDir: function(/*===== element, text =====*/){
			// summary:
			//		The function overridden in the _BidiSupport module,
			//		originally used for setting element.dir according to this.textDir.
			//		In this case does nothing.
			// element: Object
			// text: String
			// tags:
			//		protected.
		}
	});
});

},
'dijit/_editor/RichText':function(){
define("dijit/_editor/RichText", [
	"dojo/_base/array", // array.forEach array.indexOf array.some
	"dojo/_base/config", // config
	"dojo/_base/declare", // declare
	"dojo/_base/Deferred", // Deferred
	"dojo/dom", // dom.byId
	"dojo/dom-attr", // domAttr.set or get
	"dojo/dom-class", // domClass.add domClass.remove
	"dojo/dom-construct", // domConstruct.create domConstruct.destroy domConstruct.place
	"dojo/dom-geometry", // domGeometry.getMarginBox domGeometry.position
	"dojo/dom-style", // domStyle.getComputedStyle domStyle.set
	"dojo/_base/event", // event.stop
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/keys", // keys.BACKSPACE keys.TAB
	"dojo/_base/lang", // lang.clone lang.hitch lang.isArray lang.isFunction lang.isString lang.trim
	"dojo/on", // on()
	"dojo/query", // query
	"dojo/ready", // ready
	"dojo/_base/sniff", // has("ie") has("mozilla") has("opera") has("safari") has("webkit")
	"dojo/topic",	// topic.publish() (publish)
	"dojo/_base/unload", // unload
	"dojo/_base/url", // url
	"dojo/_base/window", // win.body win.doc.body.focus win.doc.createElement win.global.location win.withGlobal
	"../_Widget",
	"../_CssStateMixin",
	"./selection",
	"./range",
	"./html",
	"../focus",
	".."	// dijit._scopeName
], function(array, config, declare, Deferred, dom, domAttr, domClass, domConstruct, domGeometry, domStyle,
	event, kernel, keys, lang, on, query, ready, has, topic, unload, _Url, win,
	_Widget, _CssStateMixin, selectionapi, rangeapi, htmlapi, focus, dijit){

/*=====
	var _Widget = dijit._Widget;
	var _CssStateMixin = dijit._CssStateMixin;
=====*/

// module:
//		dijit/_editor/RichText
// summary:
//		dijit._editor.RichText is the core of dijit.Editor, which provides basic
//		WYSIWYG editing features.

// if you want to allow for rich text saving with back/forward actions, you must add a text area to your page with
// the id==dijit._scopeName + "._editor.RichText.value" (typically "dijit._editor.RichText.value). For example,
// something like this will work:
//
//	<textarea id="dijit._editor.RichText.value" style="display:none;position:absolute;top:-100px;left:-100px;height:3px;width:3px;overflow:hidden;"></textarea>
//

var RichText = declare("dijit._editor.RichText", [_Widget, _CssStateMixin], {
	// summary:
	//		dijit._editor.RichText is the core of dijit.Editor, which provides basic
	//		WYSIWYG editing features.
	//
	// description:
	//		dijit._editor.RichText is the core of dijit.Editor, which provides basic
	//		WYSIWYG editing features. It also encapsulates the differences
	//		of different js engines for various browsers.  Do not use this widget
	//		with an HTML &lt;TEXTAREA&gt; tag, since the browser unescapes XML escape characters,
	//		like &lt;.  This can have unexpected behavior and lead to security issues
	//		such as scripting attacks.
	//
	// tags:
	//		private

	constructor: function(params){
		// contentPreFilters: Function(String)[]
		//		Pre content filter function register array.
		//		these filters will be executed before the actual
		//		editing area gets the html content.
		this.contentPreFilters = [];

		// contentPostFilters: Function(String)[]
		//		post content filter function register array.
		//		These will be used on the resulting html
		//		from contentDomPostFilters. The resulting
		//		content is the final html (returned by getValue()).
		this.contentPostFilters = [];

		// contentDomPreFilters: Function(DomNode)[]
		//		Pre content dom filter function register array.
		//		These filters are applied after the result from
		//		contentPreFilters are set to the editing area.
		this.contentDomPreFilters = [];

		// contentDomPostFilters: Function(DomNode)[]
		//		Post content dom filter function register array.
		//		These filters are executed on the editing area dom.
		//		The result from these will be passed to contentPostFilters.
		this.contentDomPostFilters = [];

		// editingAreaStyleSheets: dojo._URL[]
		//		array to store all the stylesheets applied to the editing area
		this.editingAreaStyleSheets = [];

		// Make a copy of this.events before we start writing into it, otherwise we
		// will modify the prototype which leads to bad things on pages w/multiple editors
		this.events = [].concat(this.events);

		this._keyHandlers = {};

		if(params && lang.isString(params.value)){
			this.value = params.value;
		}

		this.onLoadDeferred = new Deferred();
	},

	baseClass: "dijitEditor",

	// inheritWidth: Boolean
	//		whether to inherit the parent's width or simply use 100%
	inheritWidth: false,

	// focusOnLoad: [deprecated] Boolean
	//		Focus into this widget when the page is loaded
	focusOnLoad: false,

	// name: String?
	//		Specifies the name of a (hidden) <textarea> node on the page that's used to save
	//		the editor content on page leave.   Used to restore editor contents after navigating
	//		to a new page and then hitting the back button.
	name: "",

	// styleSheets: [const] String
	//		semicolon (";") separated list of css files for the editing area
	styleSheets: "",

	// height: String
	//		Set height to fix the editor at a specific height, with scrolling.
	//		By default, this is 300px.  If you want to have the editor always
	//		resizes to accommodate the content, use AlwaysShowToolbar plugin
	//		and set height="".  If this editor is used within a layout widget,
	//		set height="100%".
	height: "300px",

	// minHeight: String
	//		The minimum height that the editor should have.
	minHeight: "1em",

	// isClosed: [private] Boolean
	isClosed: true,

	// isLoaded: [private] Boolean
	isLoaded: false,

	// _SEPARATOR: [private] String
	//		Used to concat contents from multiple editors into a single string,
	//		so they can be saved into a single <textarea> node.  See "name" attribute.
	_SEPARATOR: "@@**%%__RICHTEXTBOUNDRY__%%**@@",

	// _NAME_CONTENT_SEP: [private] String
	//		USed to separate name from content.  Just a colon isn't safe.
	_NAME_CONTENT_SEP: "@@**%%:%%**@@",

	// onLoadDeferred: [readonly] dojo.Deferred
	//		Deferred which is fired when the editor finishes loading.
	//		Call myEditor.onLoadDeferred.then(callback) it to be informed
	//		when the rich-text area initialization is finalized.
	onLoadDeferred: null,

	// isTabIndent: Boolean
	//		Make tab key and shift-tab indent and outdent rather than navigating.
	//		Caution: sing this makes web pages inaccessible to users unable to use a mouse.
	isTabIndent: false,

	// disableSpellCheck: [const] Boolean
	//		When true, disables the browser's native spell checking, if supported.
	//		Works only in Firefox.
	disableSpellCheck: false,

	postCreate: function(){
		if("textarea" === this.domNode.tagName.toLowerCase()){
			console.warn("RichText should not be used with the TEXTAREA tag.  See dijit._editor.RichText docs.");
		}

		// Push in the builtin filters now, making them the first executed, but not over-riding anything
		// users passed in.  See: #6062
		this.contentPreFilters = [lang.hitch(this, "_preFixUrlAttributes")].concat(this.contentPreFilters);
		if(has("mozilla")){
			this.contentPreFilters = [this._normalizeFontStyle].concat(this.contentPreFilters);
			this.contentPostFilters = [this._removeMozBogus].concat(this.contentPostFilters);
		}
		if(has("webkit")){
			// Try to clean up WebKit bogus artifacts.  The inserted classes
			// made by WebKit sometimes messes things up.
			this.contentPreFilters = [this._removeWebkitBogus].concat(this.contentPreFilters);
			this.contentPostFilters = [this._removeWebkitBogus].concat(this.contentPostFilters);
		}
		if(has("ie")){
			// IE generates <strong> and <em> but we want to normalize to <b> and <i>
			this.contentPostFilters = [this._normalizeFontStyle].concat(this.contentPostFilters);
			this.contentDomPostFilters = [lang.hitch(this, this._stripBreakerNodes)].concat(this.contentDomPostFilters);
		}
		this.inherited(arguments);

		topic.publish(dijit._scopeName + "._editor.RichText::init", this);
		this.open();
		this.setupDefaultShortcuts();
	},

	setupDefaultShortcuts: function(){
		// summary:
		//		Add some default key handlers
		// description:
		//		Overwrite this to setup your own handlers. The default
		//		implementation does not use Editor commands, but directly
		//		executes the builtin commands within the underlying browser
		//		support.
		// tags:
		//		protected
		var exec = lang.hitch(this, function(cmd, arg){
			return function(){
				return !this.execCommand(cmd,arg);
			};
		});

		var ctrlKeyHandlers = {
			b: exec("bold"),
			i: exec("italic"),
			u: exec("underline"),
			a: exec("selectall"),
			s: function(){ this.save(true); },
			m: function(){ this.isTabIndent = !this.isTabIndent; },

			"1": exec("formatblock", "h1"),
			"2": exec("formatblock", "h2"),
			"3": exec("formatblock", "h3"),
			"4": exec("formatblock", "h4"),

			"\\": exec("insertunorderedlist")
		};

		if(!has("ie")){
			ctrlKeyHandlers.Z = exec("redo"); //FIXME: undo?
		}

		var key;
		for(key in ctrlKeyHandlers){
			this.addKeyHandler(key, true, false, ctrlKeyHandlers[key]);
		}
	},

	// events: [private] String[]
	//		 events which should be connected to the underlying editing area
	events: ["onKeyPress", "onKeyDown", "onKeyUp"], // onClick handled specially

	// captureEvents: [deprecated] String[]
	//		 Events which should be connected to the underlying editing
	//		 area, events in this array will be addListener with
	//		 capture=true.
	// TODO: looking at the code I don't see any distinction between events and captureEvents,
	// so get rid of this for 2.0 if not sooner
	captureEvents: [],

	_editorCommandsLocalized: false,
	_localizeEditorCommands: function(){
		// summary:
		//		When IE is running in a non-English locale, the API actually changes,
		//		so that we have to say (for example) danraku instead of p (for paragraph).
		//		Handle that here.
		// tags:
		//		private
		if(RichText._editorCommandsLocalized){
			// Use the already generate cache of mappings.
			this._local2NativeFormatNames = RichText._local2NativeFormatNames;
			this._native2LocalFormatNames = RichText._native2LocalFormatNames;
			return;
		}
		RichText._editorCommandsLocalized = true;
		RichText._local2NativeFormatNames = {};
		RichText._native2LocalFormatNames = {};
		this._local2NativeFormatNames = RichText._local2NativeFormatNames;
		this._native2LocalFormatNames = RichText._native2LocalFormatNames;
		//in IE, names for blockformat is locale dependent, so we cache the values here

		//put p after div, so if IE returns Normal, we show it as paragraph
		//We can distinguish p and div if IE returns Normal, however, in order to detect that,
		//we have to call this.document.selection.createRange().parentElement() or such, which
		//could slow things down. Leave it as it is for now
		var formats = ['div', 'p', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'address'];
		var localhtml = "", format, i=0;
		while((format=formats[i++])){
			//append a <br> after each element to separate the elements more reliably
			if(format.charAt(1) !== 'l'){
				localhtml += "<"+format+"><span>content</span></"+format+"><br/>";
			}else{
				localhtml += "<"+format+"><li>content</li></"+format+"><br/>";
			}
		}
		// queryCommandValue returns empty if we hide editNode, so move it out of screen temporary
		// Also, IE9 does weird stuff unless we do it inside the editor iframe.
		var style = { position: "absolute", top: "0px", zIndex: 10, opacity: 0.01 };
		var div = domConstruct.create('div', {style: style, innerHTML: localhtml});
		win.body().appendChild(div);

		// IE9 has a timing issue with doing this right after setting
		// the inner HTML, so put a delay in.
		var inject = lang.hitch(this, function(){
			var node = div.firstChild;
			while(node){
				try{
					selectionapi.selectElement(node.firstChild);
					var nativename = node.tagName.toLowerCase();
					this._local2NativeFormatNames[nativename] = document.queryCommandValue("formatblock");
					this._native2LocalFormatNames[this._local2NativeFormatNames[nativename]] = nativename;
					node = node.nextSibling.nextSibling;
					//console.log("Mapped: ", nativename, " to: ", this._local2NativeFormatNames[nativename]);
				}catch(e){ /*Sqelch the occasional IE9 error */ }
			}
			div.parentNode.removeChild(div);
			div.innerHTML = "";
		});
		setTimeout(inject, 0);
	},

	open: function(/*DomNode?*/ element){
		// summary:
		//		Transforms the node referenced in this.domNode into a rich text editing
		//		node.
		// description:
		//		Sets up the editing area asynchronously. This will result in
		//		the creation and replacement with an iframe.
		// tags:
		//		private

		if(!this.onLoadDeferred || this.onLoadDeferred.fired >= 0){
			this.onLoadDeferred = new Deferred();
		}

		if(!this.isClosed){ this.close(); }
		topic.publish(dijit._scopeName + "._editor.RichText::open", this);

		if(arguments.length === 1 && element.nodeName){ // else unchanged
			this.domNode = element;
		}

		var dn = this.domNode;

		// "html" will hold the innerHTML of the srcNodeRef and will be used to
		// initialize the editor.
		var html;

		if(lang.isString(this.value)){
			// Allow setting the editor content programmatically instead of
			// relying on the initial content being contained within the target
			// domNode.
			html = this.value;
			delete this.value;
			dn.innerHTML = "";
		}else if(dn.nodeName && dn.nodeName.toLowerCase() == "textarea"){
			// if we were created from a textarea, then we need to create a
			// new editing harness node.
			var ta = (this.textarea = dn);
			this.name = ta.name;
			html = ta.value;
			dn = this.domNode = win.doc.createElement("div");
			dn.setAttribute('widgetId', this.id);
			ta.removeAttribute('widgetId');
			dn.cssText = ta.cssText;
			dn.className += " " + ta.className;
			domConstruct.place(dn, ta, "before");
			var tmpFunc = lang.hitch(this, function(){
				//some browsers refuse to submit display=none textarea, so
				//move the textarea off screen instead
				domStyle.set(ta, {
					display: "block",
					position: "absolute",
					top: "-1000px"
				});

				if(has("ie")){ //nasty IE bug: abnormal formatting if overflow is not hidden
					var s = ta.style;
					this.__overflow = s.overflow;
					s.overflow = "hidden";
				}
			});
			if(has("ie")){
				setTimeout(tmpFunc, 10);
			}else{
				tmpFunc();
			}

			if(ta.form){
				var resetValue = ta.value;
				this.reset = function(){
					var current = this.getValue();
					if(current !== resetValue){
						this.replaceValue(resetValue);
					}
				};
				on(ta.form, "submit", lang.hitch(this, function(){
					// Copy value to the <textarea> so it gets submitted along with form.
					// FIXME: should we be calling close() here instead?
					domAttr.set(ta, 'disabled', this.disabled); // don't submit the value if disabled
					ta.value = this.getValue();
				}));
			}
		}else{
			html = htmlapi.getChildrenHtml(dn);
			dn.innerHTML = "";
		}

		this.value = html;

		// If we're a list item we have to put in a blank line to force the
		// bullet to nicely align at the top of text
		if(dn.nodeName && dn.nodeName === "LI"){
			dn.innerHTML = " <br>";
		}

		// Construct the editor div structure.
		this.header = dn.ownerDocument.createElement("div");
		dn.appendChild(this.header);
		this.editingArea = dn.ownerDocument.createElement("div");
		dn.appendChild(this.editingArea);
		this.footer = dn.ownerDocument.createElement("div");
		dn.appendChild(this.footer);

		if(!this.name){
			this.name = this.id + "_AUTOGEN";
		}

		// User has pressed back/forward button so we lost the text in the editor, but it's saved
		// in a hidden <textarea> (which contains the data for all the editors on this page),
		// so get editor value from there
		if(this.name !== "" && (!config["useXDomain"] || config["allowXdRichTextSave"])){
			var saveTextarea = dom.byId(dijit._scopeName + "._editor.RichText.value");
			if(saveTextarea && saveTextarea.value !== ""){
				var datas = saveTextarea.value.split(this._SEPARATOR), i=0, dat;
				while((dat=datas[i++])){
					var data = dat.split(this._NAME_CONTENT_SEP);
					if(data[0] === this.name){
						html = data[1];
						datas = datas.splice(i, 1);
						saveTextarea.value = datas.join(this._SEPARATOR);
						break;
					}
				}
			}

			if(!RichText._globalSaveHandler){
				RichText._globalSaveHandler = {};
				unload.addOnUnload(function(){
					var id;
					for(id in RichText._globalSaveHandler){
						var f = RichText._globalSaveHandler[id];
						if(lang.isFunction(f)){
							f();
						}
					}
				});
			}
			RichText._globalSaveHandler[this.id] = lang.hitch(this, "_saveContent");
		}

		this.isClosed = false;

		var ifr = (this.editorObject = this.iframe = win.doc.createElement('iframe'));
		ifr.id = this.id+"_iframe";
		this._iframeSrc = this._getIframeDocTxt();
		ifr.style.border = "none";
		ifr.style.width = "100%";
		if(this._layoutMode){
			// iframe should be 100% height, thus getting it's height from surrounding
			// <div> (which has the correct height set by Editor)
			ifr.style.height = "100%";
		}else{
			if(has("ie") >= 7){
				if(this.height){
					ifr.style.height = this.height;
				}
				if(this.minHeight){
					ifr.style.minHeight = this.minHeight;
				}
			}else{
				ifr.style.height = this.height ? this.height : this.minHeight;
			}
		}
		ifr.frameBorder = 0;
		ifr._loadFunc = lang.hitch( this, function(w){
			this.window = w;
			this.document = this.window.document;

			if(has("ie")){
				this._localizeEditorCommands();
			}

			// Do final setup and set initial contents of editor
			this.onLoad(html);
		});

		// Set the iframe's initial (blank) content.
		var iframeSrcRef = 'parent.' + dijit._scopeName + '.byId("'+this.id+'")._iframeSrc';
		var s = 'javascript:(function(){try{return ' + iframeSrcRef + '}catch(e){document.open();document.domain="' +
				document.domain + '";document.write(' + iframeSrcRef + ');document.close();}})()';
		ifr.setAttribute('src', s);
		this.editingArea.appendChild(ifr);

		if(has("safari") <= 4){
			var src = ifr.getAttribute("src");
			if(!src || src.indexOf("javascript") === -1){
				// Safari 4 and earlier sometimes act oddly
				// So we have to set it again.
				setTimeout(function(){ifr.setAttribute('src', s);},0);
			}
		}

		// TODO: this is a guess at the default line-height, kinda works
		if(dn.nodeName === "LI"){
			dn.lastChild.style.marginTop = "-1.2em";
		}

		domClass.add(this.domNode, this.baseClass);
	},

	//static cache variables shared among all instance of this class
	_local2NativeFormatNames: {},
	_native2LocalFormatNames: {},

	_getIframeDocTxt: function(){
		// summary:
		//		Generates the boilerplate text of the document inside the iframe (ie, <html><head>...</head><body/></html>).
		//		Editor content (if not blank) should be added afterwards.
		// tags:
		//		private
		var _cs = domStyle.getComputedStyle(this.domNode);

		// The contents inside of <body>.  The real contents are set later via a call to setValue().
		var html = "";
		var setBodyId = true;
		if(has("ie") || has("webkit") || (!this.height && !has("mozilla"))){
			// In auto-expand mode, need a wrapper div for AlwaysShowToolbar plugin to correctly
			// expand/contract the editor as the content changes.
			html = "<div id='dijitEditorBody'></div>";
			setBodyId = false;
		}else if(has("mozilla")){
			// workaround bug where can't select then delete text (until user types something
			// into the editor)... and/or issue where typing doesn't erase selected text
			this._cursorToStart = true;
			html = "&#160;";	// &nbsp;
		}

		var font = [ _cs.fontWeight, _cs.fontSize, _cs.fontFamily ].join(" ");

		// line height is tricky - applying a units value will mess things up.
		// if we can't get a non-units value, bail out.
		var lineHeight = _cs.lineHeight;
		if(lineHeight.indexOf("px") >= 0){
			lineHeight = parseFloat(lineHeight)/parseFloat(_cs.fontSize);
			// console.debug(lineHeight);
		}else if(lineHeight.indexOf("em")>=0){
			lineHeight = parseFloat(lineHeight);
		}else{
			// If we can't get a non-units value, just default
			// it to the CSS spec default of 'normal'.  Seems to
			// work better, esp on IE, than '1.0'
			lineHeight = "normal";
		}
		var userStyle = "";
		var self = this;
		this.style.replace(/(^|;)\s*(line-|font-?)[^;]+/ig, function(match){
			match = match.replace(/^;/ig,"") + ';';
			var s = match.split(":")[0];
			if(s){
				s = lang.trim(s);
				s = s.toLowerCase();
				var i;
				var sC = "";
				for(i = 0; i < s.length; i++){
					var c = s.charAt(i);
					switch(c){
						case "-":
							i++;
							c = s.charAt(i).toUpperCase();
						default:
							sC += c;
					}
				}
				domStyle.set(self.domNode, sC, "");
			}
			userStyle += match + ';';
		});


		// need to find any associated label element and update iframe document title
		var label=query('label[for="'+this.id+'"]');

		return [
			this.isLeftToRight() ? "<html>\n<head>\n" : "<html dir='rtl'>\n<head>\n",
			(has("mozilla") && label.length ? "<title>" + label[0].innerHTML + "</title>\n" : ""),
			"<meta http-equiv='Content-Type' content='text/html'>\n",
			"<style>\n",
			"\tbody,html {\n",
			"\t\tbackground:transparent;\n",
			"\t\tpadding: 1px 0 0 0;\n",
			"\t\tmargin: -1px 0 0 0;\n", // remove extraneous vertical scrollbar on safari and firefox

			// Set the html/body sizing.  Webkit always needs this, other browsers
			// only set it when height is defined (not auto-expanding), otherwise
			// scrollers do not appear.
			((has("webkit"))?"\t\twidth: 100%;\n":""),
			((has("webkit"))?"\t\theight: 100%;\n":""),
			"\t}\n",

			// TODO: left positioning will cause contents to disappear out of view
			//	   if it gets too wide for the visible area
			"\tbody{\n",
			"\t\ttop:0px;\n",
			"\t\tleft:0px;\n",
			"\t\tright:0px;\n",
			"\t\tfont:", font, ";\n",
				((this.height||has("opera")) ? "" : "\t\tposition: fixed;\n"),
			// FIXME: IE 6 won't understand min-height?
			"\t\tmin-height:", this.minHeight, ";\n",
			"\t\tline-height:", lineHeight,";\n",
			"\t}\n",
			"\tp{ margin: 1em 0; }\n",

			// Determine how scrollers should be applied.  In autoexpand mode (height = "") no scrollers on y at all.
			// But in fixed height mode we want both x/y scrollers.  Also, if it's using wrapping div and in auto-expand
			// (Mainly IE) we need to kill the y scroller on body and html.
			(!setBodyId && !this.height ? "\tbody,html {overflow-y: hidden;}\n" : ""),
			"\t#dijitEditorBody{overflow-x: auto; overflow-y:" + (this.height ? "auto;" : "hidden;") + " outline: 0px;}\n",
			"\tli > ul:-moz-first-node, li > ol:-moz-first-node{ padding-top: 1.2em; }\n",
			// Can't set min-height in IE9, it puts layout on li, which puts move/resize handles.
			(!has("ie") ? "\tli{ min-height:1.2em; }\n" : ""),
			"</style>\n",
			this._applyEditingAreaStyleSheets(),"\n",
			"</head>\n<body ",
			(setBodyId?"id='dijitEditorBody' ":""),
			"onload='frameElement._loadFunc(window,document)' style='"+userStyle+"'>", html, "</body>\n</html>"
		].join(""); // String
	},

	_applyEditingAreaStyleSheets: function(){
		// summary:
		//		apply the specified css files in styleSheets
		// tags:
		//		private
		var files = [];
		if(this.styleSheets){
			files = this.styleSheets.split(';');
			this.styleSheets = '';
		}

		//empty this.editingAreaStyleSheets here, as it will be filled in addStyleSheet
		files = files.concat(this.editingAreaStyleSheets);
		this.editingAreaStyleSheets = [];

		var text='', i=0, url;
		while((url=files[i++])){
			var abstring = (new _Url(win.global.location, url)).toString();
			this.editingAreaStyleSheets.push(abstring);
			text += '<link rel="stylesheet" type="text/css" href="'+abstring+'"/>';
		}
		return text;
	},

	addStyleSheet: function(/*dojo._Url*/ uri){
		// summary:
		//		add an external stylesheet for the editing area
		// uri:
		//		A dojo.uri.Uri pointing to the url of the external css file
		var url=uri.toString();

		//if uri is relative, then convert it to absolute so that it can be resolved correctly in iframe
		if(url.charAt(0) === '.' || (url.charAt(0) !== '/' && !uri.host)){
			url = (new _Url(win.global.location, url)).toString();
		}

		if(array.indexOf(this.editingAreaStyleSheets, url) > -1){
//			console.debug("dijit._editor.RichText.addStyleSheet: Style sheet "+url+" is already applied");
			return;
		}

		this.editingAreaStyleSheets.push(url);
		this.onLoadDeferred.addCallback(lang.hitch(this, function(){
			if(this.document.createStyleSheet){ //IE
				this.document.createStyleSheet(url);
			}else{ //other browser
				var head = this.document.getElementsByTagName("head")[0];
				var stylesheet = this.document.createElement("link");
				stylesheet.rel="stylesheet";
				stylesheet.type="text/css";
				stylesheet.href=url;
				head.appendChild(stylesheet);
			}
		}));
	},

	removeStyleSheet: function(/*dojo._Url*/ uri){
		// summary:
		//		remove an external stylesheet for the editing area
		var url=uri.toString();
		//if uri is relative, then convert it to absolute so that it can be resolved correctly in iframe
		if(url.charAt(0) === '.' || (url.charAt(0) !== '/' && !uri.host)){
			url = (new _Url(win.global.location, url)).toString();
		}
		var index = array.indexOf(this.editingAreaStyleSheets, url);
		if(index === -1){
//			console.debug("dijit._editor.RichText.removeStyleSheet: Style sheet "+url+" has not been applied");
			return;
		}
		delete this.editingAreaStyleSheets[index];
		win.withGlobal(this.window,'query', dojo, ['link:[href="'+url+'"]']).orphan();
	},

	// disabled: Boolean
	//		The editor is disabled; the text cannot be changed.
	disabled: false,

	_mozSettingProps: {'styleWithCSS':false},
	_setDisabledAttr: function(/*Boolean*/ value){
		value = !!value;
		this._set("disabled", value);
		if(!this.isLoaded){ return; } // this method requires init to be complete
		if(has("ie") || has("webkit") || has("opera")){
			var preventIEfocus = has("ie") && (this.isLoaded || !this.focusOnLoad);
			if(preventIEfocus){ this.editNode.unselectable = "on"; }
			this.editNode.contentEditable = !value;
			if(preventIEfocus){
				var _this = this;
				setTimeout(function(){
					if(_this.editNode){		// guard in case widget destroyed before timeout
						_this.editNode.unselectable = "off";
					}
				}, 0);
			}
		}else{ //moz
			try{
				this.document.designMode=(value?'off':'on');
			}catch(e){ return; } // ! _disabledOK
			if(!value && this._mozSettingProps){
				var ps = this._mozSettingProps;
				var n;
				for(n in ps){
					if(ps.hasOwnProperty(n)){
						try{
							this.document.execCommand(n,false,ps[n]);
						}catch(e2){}
					}
				}
			}
//			this.document.execCommand('contentReadOnly', false, value);
//				if(value){
//					this.blur(); //to remove the blinking caret
//				}
		}
		this._disabledOK = true;
	},

/* Event handlers
 *****************/

	onLoad: function(/*String*/ html){
		// summary:
		//		Handler after the iframe finishes loading.
		// html: String
		//		Editor contents should be set to this value
		// tags:
		//		protected

		// TODO: rename this to _onLoad, make empty public onLoad() method, deprecate/make protected onLoadDeferred handler?

		if(!this.window.__registeredWindow){
			this.window.__registeredWindow = true;
			this._iframeRegHandle = focus.registerIframe(this.iframe);
		}
		if(!has("ie") && !has("webkit") && (this.height || has("mozilla"))){
			this.editNode=this.document.body;
		}else{
			// there's a wrapper div around the content, see _getIframeDocTxt().
			this.editNode=this.document.body.firstChild;
			var _this = this;
			if(has("ie")){ // #4996 IE wants to focus the BODY tag
				this.tabStop = domConstruct.create('div', { tabIndex: -1 }, this.editingArea);
				this.iframe.onfocus = function(){ _this.editNode.setActive(); };
			}
		}
		this.focusNode = this.editNode; // for InlineEditBox


		var events = this.events.concat(this.captureEvents);
		var ap = this.iframe ? this.document : this.editNode;
		array.forEach(events, function(item){
			this.connect(ap, item.toLowerCase(), item);
		}, this);

		this.connect(ap, "onmouseup", "onClick"); // mouseup in the margin does not generate an onclick event

		if(has("ie")){ // IE contentEditable
			this.connect(this.document, "onmousedown", "_onIEMouseDown"); // #4996 fix focus

			// give the node Layout on IE
			// TODO: this may no longer be needed, since we've reverted IE to using an iframe,
			// not contentEditable.   Removing it would also probably remove the need for creating
			// the extra <div> in _getIframeDocTxt()
			this.editNode.style.zoom = 1.0;
		}else{
			this.connect(this.document, "onmousedown", function(){
				// Clear the moveToStart focus, as mouse
				// down will set cursor point.  Required to properly
				// work with selection/position driven plugins and clicks in
				// the window. refs: #10678
				delete this._cursorToStart;
			});
		}

		if(has("webkit")){
			//WebKit sometimes doesn't fire right on selections, so the toolbar
			//doesn't update right.  Therefore, help it out a bit with an additional
			//listener.  A mouse up will typically indicate a display change, so fire this
			//and get the toolbar to adapt.  Reference: #9532
			this._webkitListener = this.connect(this.document, "onmouseup", "onDisplayChanged");
			this.connect(this.document, "onmousedown", function(e){
				var t = e.target;
				if(t && (t === this.document.body || t === this.document)){
					// Since WebKit uses the inner DIV, we need to check and set position.
					// See: #12024 as to why the change was made.
					setTimeout(lang.hitch(this, "placeCursorAtEnd"), 0);
				}
			});
		}

		if(has("ie")){
			// Try to make sure 'hidden' elements aren't visible in edit mode (like browsers other than IE
			// do).  See #9103
			try{
				this.document.execCommand('RespectVisibilityInDesign', true, null);
			}catch(e){/* squelch */}
		}

		this.isLoaded = true;

		this.set('disabled', this.disabled); // initialize content to editable (or not)

		// Note that setValue() call will only work after isLoaded is set to true (above)

		// Set up a function to allow delaying the setValue until a callback is fired
		// This ensures extensions like dijit.Editor have a way to hold the value set
		// until plugins load (and do things like register filters).
		var setContent = lang.hitch(this, function(){
			this.setValue(html);
			if(this.onLoadDeferred){
				this.onLoadDeferred.callback(true);
			}
			this.onDisplayChanged();
			if(this.focusOnLoad){
				// after the document loads, then set focus after updateInterval expires so that
				// onNormalizedDisplayChanged has run to avoid input caret issues
				ready(lang.hitch(this, function(){ setTimeout(lang.hitch(this, "focus"), this.updateInterval); }));
			}
			// Save off the initial content now
			this.value = this.getValue(true);
		});
		if(this.setValueDeferred){
			this.setValueDeferred.addCallback(setContent);
		}else{
			setContent();
		}
	},

	onKeyDown: function(/* Event */ e){
		// summary:
		//		Handler for onkeydown event
		// tags:
		//		protected

		// we need this event at the moment to get the events from control keys
		// such as the backspace. It might be possible to add this to Dojo, so that
		// keyPress events can be emulated by the keyDown and keyUp detection.

		if(e.keyCode === keys.TAB && this.isTabIndent ){
			event.stop(e); //prevent tab from moving focus out of editor

			// FIXME: this is a poor-man's indent/outdent. It would be
			// better if it added 4 "&nbsp;" chars in an undoable way.
			// Unfortunately pasteHTML does not prove to be undoable
			if(this.queryCommandEnabled((e.shiftKey ? "outdent" : "indent"))){
				this.execCommand((e.shiftKey ? "outdent" : "indent"));
			}
		}
		if(has("ie")){
			if(e.keyCode == keys.TAB && !this.isTabIndent){
				if(e.shiftKey && !e.ctrlKey && !e.altKey){
					// focus the BODY so the browser will tab away from it instead
					this.iframe.focus();
				}else if(!e.shiftKey && !e.ctrlKey && !e.altKey){
					// focus the BODY so the browser will tab away from it instead
					this.tabStop.focus();
				}
			}else if(e.keyCode === keys.BACKSPACE && this.document.selection.type === "Control"){
				// IE has a bug where if a non-text object is selected in the editor,
				// hitting backspace would act as if the browser's back button was
				// clicked instead of deleting the object. see #1069
				event.stop(e);
				this.execCommand("delete");
			}else if((65 <= e.keyCode && e.keyCode <= 90) ||
				(e.keyCode>=37 && e.keyCode<=40) // FIXME: get this from connect() instead!
			){ //arrow keys
				e.charCode = e.keyCode;
				this.onKeyPress(e);
			}
		}
		if(has("ff")){
			if(e.keyCode === keys.PAGE_UP || e.keyCode === keys.PAGE_DOWN ){
				if(this.editNode.clientHeight >= this.editNode.scrollHeight){
					// Stop the event to prevent firefox from trapping the cursor when there is no scroll bar.
					e.preventDefault();
				}
			}
		}
		return true;
	},

	onKeyUp: function(/*===== e =====*/){
		// summary:
		//		Handler for onkeyup event
		// tags:
		//      callback
	},

	setDisabled: function(/*Boolean*/ disabled){
		// summary:
		//		Deprecated, use set('disabled', ...) instead.
		// tags:
		//		deprecated
		kernel.deprecated('dijit.Editor::setDisabled is deprecated','use dijit.Editor::attr("disabled",boolean) instead', 2.0);
		this.set('disabled',disabled);
	},
	_setValueAttr: function(/*String*/ value){
		// summary:
		//      Registers that attr("value", foo) should call setValue(foo)
		this.setValue(value);
	},
	_setDisableSpellCheckAttr: function(/*Boolean*/ disabled){
		if(this.document){
			domAttr.set(this.document.body, "spellcheck", !disabled);
		}else{
			// try again after the editor is finished loading
			this.onLoadDeferred.addCallback(lang.hitch(this, function(){
				domAttr.set(this.document.body, "spellcheck", !disabled);
			}));
		}
		this._set("disableSpellCheck", disabled);
	},

	onKeyPress: function(e){
		// summary:
		//		Handle the various key events
		// tags:
		//		protected

		var c = (e.keyChar && e.keyChar.toLowerCase()) || e.keyCode,
			handlers = this._keyHandlers[c],
			args = arguments;
			
		if(handlers && !e.altKey){
			array.some(handlers, function(h){
				// treat meta- same as ctrl-, for benefit of mac users
				if(!(h.shift ^ e.shiftKey) && !(h.ctrl ^ (e.ctrlKey||e.metaKey))){ 
					if(!h.handler.apply(this, args)){
						e.preventDefault();
					}
					return true;
				}
			}, this);
		}

		// function call after the character has been inserted
		if(!this._onKeyHitch){
			this._onKeyHitch = lang.hitch(this, "onKeyPressed");
		}
		setTimeout(this._onKeyHitch, 1);
		return true;
	},

	addKeyHandler: function(/*String*/ key, /*Boolean*/ ctrl, /*Boolean*/ shift, /*Function*/ handler){
		// summary:
		//		Add a handler for a keyboard shortcut
		// description:
		//		The key argument should be in lowercase if it is a letter character
		// tags:
		//		protected
		if(!lang.isArray(this._keyHandlers[key])){
			this._keyHandlers[key] = [];
		}
		//TODO: would be nice to make this a hash instead of an array for quick lookups
		this._keyHandlers[key].push({
			shift: shift || false,
			ctrl: ctrl || false,
			handler: handler
		});
	},

	onKeyPressed: function(){
		// summary:
		//		Handler for after the user has pressed a key, and the display has been updated.
		//		(Runs on a timer so that it runs after the display is updated)
		// tags:
		//		private
		this.onDisplayChanged(/*e*/); // can't pass in e
	},

	onClick: function(/*Event*/ e){
		// summary:
		//		Handler for when the user clicks.
		// tags:
		//		private

		// console.info('onClick',this._tryDesignModeOn);
		this.onDisplayChanged(e);
	},

	_onIEMouseDown: function(){
		// summary:
		//		IE only to prevent 2 clicks to focus
		// tags:
		//		protected

		if(!this.focused && !this.disabled){
			this.focus();
		}
	},

	_onBlur: function(e){
		// summary:
		//		Called from focus manager when focus has moved away from this editor
		// tags:
		//		protected

		// console.info('_onBlur')

		this.inherited(arguments);

		var newValue = this.getValue(true);
		if(newValue !== this.value){
			this.onChange(newValue);
		}
		this._set("value", newValue);
	},

	_onFocus: function(/*Event*/ e){
		// summary:
		//		Called from focus manager when focus has moved into this editor
		// tags:
		//		protected

		// console.info('_onFocus')
		if(!this.disabled){
			if(!this._disabledOK){
				this.set('disabled', false);
			}
			this.inherited(arguments);
		}
	},

	// TODO: remove in 2.0
	blur: function(){
		// summary:
		//		Remove focus from this instance.
		// tags:
		//		deprecated
		if(!has("ie") && this.window.document.documentElement && this.window.document.documentElement.focus){
			this.window.document.documentElement.focus();
		}else if(win.doc.body.focus){
			win.doc.body.focus();
		}
	},

	focus: function(){
		// summary:
		//		Move focus to this editor
		if(!this.isLoaded){
			this.focusOnLoad = true;
			return;
		}
		if(this._cursorToStart){
			delete this._cursorToStart;
			if(this.editNode.childNodes){
				this.placeCursorAtStart(); // this calls focus() so return
				return;
			}
		}
		if(!has("ie")){
			focus.focus(this.iframe);
		}else if(this.editNode && this.editNode.focus){
			// editNode may be hidden in display:none div, lets just punt in this case
			//this.editNode.focus(); -> causes IE to scroll always (strict and quirks mode) to the top the Iframe
			// if we fire the event manually and let the browser handle the focusing, the latest
			// cursor position is focused like in FF
			this.iframe.fireEvent('onfocus', document.createEventObject()); // createEventObject only in IE
		//	}else{
		// TODO: should we throw here?
		// console.debug("Have no idea how to focus into the editor!");
		}
	},

	// _lastUpdate: 0,
	updateInterval: 200,
	_updateTimer: null,
	onDisplayChanged: function(/*Event*/ /*===== e =====*/){
		// summary:
		//		This event will be fired every time the display context
		//		changes and the result needs to be reflected in the UI.
		// description:
		//		If you don't want to have update too often,
		//		onNormalizedDisplayChanged should be used instead
		// tags:
		//		private

		// var _t=new Date();
		if(this._updateTimer){
			clearTimeout(this._updateTimer);
		}
		if(!this._updateHandler){
			this._updateHandler = lang.hitch(this,"onNormalizedDisplayChanged");
		}
		this._updateTimer = setTimeout(this._updateHandler, this.updateInterval);

		// Technically this should trigger a call to watch("value", ...) registered handlers,
		// but getValue() is too slow to call on every keystroke so we don't.
	},
	onNormalizedDisplayChanged: function(){
		// summary:
		//		This event is fired every updateInterval ms or more
		// description:
		//		If something needs to happen immediately after a
		//		user change, please use onDisplayChanged instead.
		// tags:
		//		private
		delete this._updateTimer;
	},
	onChange: function(/*===== newContent =====*/){
		// summary:
		//		This is fired if and only if the editor loses focus and
		//		the content is changed.
	},
	_normalizeCommand: function(/*String*/ cmd, /*Anything?*/argument){
		// summary:
		//		Used as the advice function to map our
		//		normalized set of commands to those supported by the target
		//		browser.
		// tags:
		//		private

		var command = cmd.toLowerCase();
		if(command === "formatblock"){
			if(has("safari") && argument === undefined){ command = "heading"; }
		}else if(command === "hilitecolor" && !has("mozilla")){
			command = "backcolor";
		}

		return command;
	},

	_qcaCache: {},
	queryCommandAvailable: function(/*String*/ command){
		// summary:
		//		Tests whether a command is supported by the host. Clients
		//		SHOULD check whether a command is supported before attempting
		//		to use it, behaviour for unsupported commands is undefined.
		// command:
		//		The command to test for
		// tags:
		//		private

		// memoizing version. See _queryCommandAvailable for computing version
		var ca = this._qcaCache[command];
		if(ca !== undefined){ return ca; }
		return (this._qcaCache[command] = this._queryCommandAvailable(command));
	},

	_queryCommandAvailable: function(/*String*/ command){
		// summary:
		//		See queryCommandAvailable().
		// tags:
		//		private

		var ie = 1;
		var mozilla = 1 << 1;
		var webkit = 1 << 2;
		var opera = 1 << 3;

		function isSupportedBy(browsers){
			return {
				ie: Boolean(browsers & ie),
				mozilla: Boolean(browsers & mozilla),
				webkit: Boolean(browsers & webkit),
				opera: Boolean(browsers & opera)
			};
		}

		var supportedBy = null;

		switch(command.toLowerCase()){
			case "bold": case "italic": case "underline":
			case "subscript": case "superscript":
			case "fontname": case "fontsize":
			case "forecolor": case "hilitecolor":
			case "justifycenter": case "justifyfull": case "justifyleft":
			case "justifyright": case "delete": case "selectall": case "toggledir":
				supportedBy = isSupportedBy(mozilla | ie | webkit | opera);
				break;

			case "createlink": case "unlink": case "removeformat":
			case "inserthorizontalrule": case "insertimage":
			case "insertorderedlist": case "insertunorderedlist":
			case "indent": case "outdent": case "formatblock":
			case "inserthtml": case "undo": case "redo": case "strikethrough": case "tabindent":
				supportedBy = isSupportedBy(mozilla | ie | opera | webkit);
				break;

			case "blockdirltr": case "blockdirrtl":
			case "dirltr": case "dirrtl":
			case "inlinedirltr": case "inlinedirrtl":
				supportedBy = isSupportedBy(ie);
				break;
			case "cut": case "copy": case "paste":
				supportedBy = isSupportedBy( ie | mozilla | webkit);
				break;

			case "inserttable":
				supportedBy = isSupportedBy(mozilla | ie);
				break;

			case "insertcell": case "insertcol": case "insertrow":
			case "deletecells": case "deletecols": case "deleterows":
			case "mergecells": case "splitcell":
				supportedBy = isSupportedBy(ie | mozilla);
				break;

			default: return false;
		}

		return (has("ie") && supportedBy.ie) ||
			(has("mozilla") && supportedBy.mozilla) ||
			(has("webkit") && supportedBy.webkit) ||
			(has("opera") && supportedBy.opera);	// Boolean return true if the command is supported, false otherwise
	},

	execCommand: function(/*String*/ command, argument){
		// summary:
		//		Executes a command in the Rich Text area
		// command:
		//		The command to execute
		// argument:
		//		An optional argument to the command
		// tags:
		//		protected
		var returnValue;

		//focus() is required for IE to work
		//In addition, focus() makes sure after the execution of
		//the command, the editor receives the focus as expected
		this.focus();

		command = this._normalizeCommand(command, argument);
		
		if(argument !== undefined){
			if(command === "heading"){
				throw new Error("unimplemented");
			}else if((command === "formatblock") && has("ie")){
				argument = '<'+argument+'>';
			}
		}

		//Check to see if we have any over-rides for commands, they will be functions on this
		//widget of the form _commandImpl.  If we don't, fall through to the basic native
		//exec command of the browser.
		var implFunc = "_" + command + "Impl";
		if(this[implFunc]){
			returnValue = this[implFunc](argument);
		}else{
			argument = arguments.length > 1 ? argument : null;
			if(argument || command !== "createlink"){
				returnValue = this.document.execCommand(command, false, argument);
			}
		}

		this.onDisplayChanged();
		return returnValue;
	},

	queryCommandEnabled: function(/*String*/ command){
		// summary:
		//		Check whether a command is enabled or not.
		// command:
		//		The command to execute
		// tags:
		//		protected
		if(this.disabled || !this._disabledOK){ return false; }

		command = this._normalizeCommand(command);

		//Check to see if we have any over-rides for commands, they will be functions on this
		//widget of the form _commandEnabledImpl.  If we don't, fall through to the basic native
		//command of the browser.
		var implFunc = "_" + command + "EnabledImpl";

		if(this[implFunc]){
			return  this[implFunc](command);
		}else{
			return this._browserQueryCommandEnabled(command);
		}
	},

	queryCommandState: function(command){
		// summary:
		//		Check the state of a given command and returns true or false.
		// tags:
		//		protected

		if(this.disabled || !this._disabledOK){ return false; }
		command = this._normalizeCommand(command);
		try{
			return this.document.queryCommandState(command);
		}catch(e){
			//Squelch, occurs if editor is hidden on FF 3 (and maybe others.)
			return false;
		}
	},

	queryCommandValue: function(command){
		// summary:
		//		Check the value of a given command. This matters most for
		//		custom selections and complex values like font value setting.
		// tags:
		//		protected

		if(this.disabled || !this._disabledOK){ return false; }
		var r;
		command = this._normalizeCommand(command);
		if(has("ie") && command === "formatblock"){
			r = this._native2LocalFormatNames[this.document.queryCommandValue(command)];
		}else if(has("mozilla") && command === "hilitecolor"){
			var oldValue;
			try{
				oldValue = this.document.queryCommandValue("styleWithCSS");
			}catch(e){
				oldValue = false;
			}
			this.document.execCommand("styleWithCSS", false, true);
			r = this.document.queryCommandValue(command);
			this.document.execCommand("styleWithCSS", false, oldValue);
		}else{
			r = this.document.queryCommandValue(command);
		}
		return r;
	},

	// Misc.

	_sCall: function(name, args){
		// summary:
		//		Run the named method of dijit._editor.selection over the
		//		current editor instance's window, with the passed args.
		// tags:
		//		private
		return win.withGlobal(this.window, name, selectionapi, args);
	},

	// FIXME: this is a TON of code duplication. Why?

	placeCursorAtStart: function(){
		// summary:
		//		Place the cursor at the start of the editing area.
		// tags:
		//		private

		this.focus();

		//see comments in placeCursorAtEnd
		var isvalid=false;
		if(has("mozilla")){
			// TODO:  Is this branch even necessary?
			var first=this.editNode.firstChild;
			while(first){
				if(first.nodeType === 3){
					if(first.nodeValue.replace(/^\s+|\s+$/g, "").length>0){
						isvalid=true;
						this._sCall("selectElement", [ first ]);
						break;
					}
				}else if(first.nodeType === 1){
					isvalid=true;
					var tg = first.tagName ? first.tagName.toLowerCase() : "";
					// Collapse before childless tags.
					if(/br|input|img|base|meta|area|basefont|hr|link/.test(tg)){
						this._sCall("selectElement", [ first ]);
					}else{
						// Collapse inside tags with children.
						this._sCall("selectElementChildren", [ first ]);
					}
					break;
				}
				first = first.nextSibling;
			}
		}else{
			isvalid=true;
			this._sCall("selectElementChildren", [ this.editNode ]);
		}
		if(isvalid){
			this._sCall("collapse", [ true ]);
		}
	},

	placeCursorAtEnd: function(){
		// summary:
		//		Place the cursor at the end of the editing area.
		// tags:
		//		private

		this.focus();

		//In mozilla, if last child is not a text node, we have to use
		// selectElementChildren on this.editNode.lastChild otherwise the
		// cursor would be placed at the end of the closing tag of
		//this.editNode.lastChild
		var isvalid=false;
		if(has("mozilla")){
			var last=this.editNode.lastChild;
			while(last){
				if(last.nodeType === 3){
					if(last.nodeValue.replace(/^\s+|\s+$/g, "").length>0){
						isvalid=true;
						this._sCall("selectElement", [ last ]);
						break;
					}
				}else if(last.nodeType === 1){
					isvalid=true;
					if(last.lastChild){
						this._sCall("selectElement", [ last.lastChild ]);
					}else{
						this._sCall("selectElement", [ last ]);
					}
					break;
				}
				last = last.previousSibling;
			}
		}else{
			isvalid=true;
			this._sCall("selectElementChildren", [ this.editNode ]);
		}
		if(isvalid){
			this._sCall("collapse", [ false ]);
		}
	},

	getValue: function(/*Boolean?*/ nonDestructive){
		// summary:
		//		Return the current content of the editing area (post filters
		//		are applied).  Users should call get('value') instead.
		//	nonDestructive:
		//		defaults to false. Should the post-filtering be run over a copy
		//		of the live DOM? Most users should pass "true" here unless they
		//		*really* know that none of the installed filters are going to
		//		mess up the editing session.
		// tags:
		//		private
		if(this.textarea){
			if(this.isClosed || !this.isLoaded){
				return this.textarea.value;
			}
		}

		return this._postFilterContent(null, nonDestructive);
	},
	_getValueAttr: function(){
		// summary:
		//		Hook to make attr("value") work
		return this.getValue(true);
	},

	setValue: function(/*String*/ html){
		// summary:
		//		This function sets the content. No undo history is preserved.
		//		Users should use set('value', ...) instead.
		// tags:
		//		deprecated

		// TODO: remove this and getValue() for 2.0, and move code to _setValueAttr()

		if(!this.isLoaded){
			// try again after the editor is finished loading
			this.onLoadDeferred.addCallback(lang.hitch(this, function(){
				this.setValue(html);
			}));
			return;
		}
		this._cursorToStart = true;
		if(this.textarea && (this.isClosed || !this.isLoaded)){
			this.textarea.value=html;
		}else{
			html = this._preFilterContent(html);
			var node = this.isClosed ? this.domNode : this.editNode;
			if(html && has("mozilla") && html.toLowerCase() === "<p></p>"){
				html = "<p>&#160;</p>";	// &nbsp;
			}

			// Use &nbsp; to avoid webkit problems where editor is disabled until the user clicks it
			if(!html && has("webkit")){
				html = "&#160;";	// &nbsp;
			}
			node.innerHTML = html;
			this._preDomFilterContent(node);
		}

		this.onDisplayChanged();
		this._set("value", this.getValue(true));
	},

	replaceValue: function(/*String*/ html){
		// summary:
		//		This function set the content while trying to maintain the undo stack
		//		(now only works fine with Moz, this is identical to setValue in all
		//		other browsers)
		// tags:
		//		protected

		if(this.isClosed){
			this.setValue(html);
		}else if(this.window && this.window.getSelection && !has("mozilla")){ // Safari
			// look ma! it's a totally f'd browser!
			this.setValue(html);
		}else if(this.window && this.window.getSelection){ // Moz
			html = this._preFilterContent(html);
			this.execCommand("selectall");
			if(!html){
				this._cursorToStart = true;
				html = "&#160;";	// &nbsp;
			}
			this.execCommand("inserthtml", html);
			this._preDomFilterContent(this.editNode);
		}else if(this.document && this.document.selection){//IE
			//In IE, when the first element is not a text node, say
			//an <a> tag, when replacing the content of the editing
			//area, the <a> tag will be around all the content
			//so for now, use setValue for IE too
			this.setValue(html);
		}

		this._set("value", this.getValue(true));
	},

	_preFilterContent: function(/*String*/ html){
		// summary:
		//		Filter the input before setting the content of the editing
		//		area. DOM pre-filtering may happen after this
		//		string-based filtering takes place but as of 1.2, this is not
		//		guaranteed for operations such as the inserthtml command.
		// tags:
		//		private

		var ec = html;
		array.forEach(this.contentPreFilters, function(ef){ if(ef){ ec = ef(ec); } });
		return ec;
	},
	_preDomFilterContent: function(/*DomNode*/ dom){
		// summary:
		//		filter the input's live DOM. All filter operations should be
		//		considered to be "live" and operating on the DOM that the user
		//		will be interacting with in their editing session.
		// tags:
		//		private
		dom = dom || this.editNode;
		array.forEach(this.contentDomPreFilters, function(ef){
			if(ef && lang.isFunction(ef)){
				ef(dom);
			}
		}, this);
	},

	_postFilterContent: function(
		/*DomNode|DomNode[]|String?*/ dom,
		/*Boolean?*/ nonDestructive){
		// summary:
		//		filter the output after getting the content of the editing area
		//
		// description:
		//		post-filtering allows plug-ins and users to specify any number
		//		of transforms over the editor's content, enabling many common
		//		use-cases such as transforming absolute to relative URLs (and
		//		vice-versa), ensuring conformance with a particular DTD, etc.
		//		The filters are registered in the contentDomPostFilters and
		//		contentPostFilters arrays. Each item in the
		//		contentDomPostFilters array is a function which takes a DOM
		//		Node or array of nodes as its only argument and returns the
		//		same. It is then passed down the chain for further filtering.
		//		The contentPostFilters array behaves the same way, except each
		//		member operates on strings. Together, the DOM and string-based
		//		filtering allow the full range of post-processing that should
		//		be necessaray to enable even the most agressive of post-editing
		//		conversions to take place.
		//
		//		If nonDestructive is set to "true", the nodes are cloned before
		//		filtering proceeds to avoid potentially destructive transforms
		//		to the content which may still needed to be edited further.
		//		Once DOM filtering has taken place, the serialized version of
		//		the DOM which is passed is run through each of the
		//		contentPostFilters functions.
		//
		//	dom:
		//		a node, set of nodes, which to filter using each of the current
		//		members of the contentDomPostFilters and contentPostFilters arrays.
		//
		//	nonDestructive:
		//		defaults to "false". If true, ensures that filtering happens on
		//		a clone of the passed-in content and not the actual node
		//		itself.
		//
		// tags:
		//		private

		var ec;
		if(!lang.isString(dom)){
			dom = dom || this.editNode;
			if(this.contentDomPostFilters.length){
				if(nonDestructive){
					dom = lang.clone(dom);
				}
				array.forEach(this.contentDomPostFilters, function(ef){
					dom = ef(dom);
				});
			}
			ec = htmlapi.getChildrenHtml(dom);
		}else{
			ec = dom;
		}

		if(!lang.trim(ec.replace(/^\xA0\xA0*/, '').replace(/\xA0\xA0*$/, '')).length){
			ec = "";
		}

		//	if(has("ie")){
		//		//removing appended <P>&nbsp;</P> for IE
		//		ec = ec.replace(/(?:<p>&nbsp;</p>[\n\r]*)+$/i,"");
		//	}
		array.forEach(this.contentPostFilters, function(ef){
			ec = ef(ec);
		});

		return ec;
	},

	_saveContent: function(){
		// summary:
		//		Saves the content in an onunload event if the editor has not been closed
		// tags:
		//		private

		var saveTextarea = dom.byId(dijit._scopeName + "._editor.RichText.value");
		if(saveTextarea){
			if(saveTextarea.value){
				saveTextarea.value += this._SEPARATOR;
			}
			saveTextarea.value += this.name + this._NAME_CONTENT_SEP + this.getValue(true);
		}
	},


	escapeXml: function(/*String*/ str, /*Boolean*/ noSingleQuotes){
		// summary:
		//		Adds escape sequences for special characters in XML.
		//		Optionally skips escapes for single quotes
		// tags:
		//		private

		str = str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/"/gm, "&quot;");
		if(!noSingleQuotes){
			str = str.replace(/'/gm, "&#39;");
		}
		return str; // string
	},

	getNodeHtml: function(/* DomNode */ node){
		// summary:
		//		Deprecated.   Use dijit/_editor/html::_getNodeHtml() instead.
		// tags:
		//		deprecated
		kernel.deprecated('dijit.Editor::getNodeHtml is deprecated','use dijit/_editor/html::getNodeHtml instead', 2);
		return htmlapi.getNodeHtml(node); // String
	},

	getNodeChildrenHtml: function(/* DomNode */ dom){
		// summary:
		//		Deprecated.   Use dijit/_editor/html::getChildrenHtml() instead.
		// tags:
		//		deprecated
		kernel.deprecated('dijit.Editor::getNodeChildrenHtml is deprecated','use dijit/_editor/html::getChildrenHtml instead', 2);
		return htmlapi.getChildrenHtml(dom);
	},

	close: function(/*Boolean?*/ save){
		// summary:
		//		Kills the editor and optionally writes back the modified contents to the
		//		element from which it originated.
		// save:
		//		Whether or not to save the changes. If false, the changes are discarded.
		// tags:
		//		private

		if(this.isClosed){ return; }

		if(!arguments.length){ save = true; }
		if(save){
			this._set("value", this.getValue(true));
		}

		// line height is squashed for iframes
		// FIXME: why was this here? if(this.iframe){ this.domNode.style.lineHeight = null; }

		if(this.interval){ clearInterval(this.interval); }

		if(this._webkitListener){
			//Cleaup of WebKit fix: #9532
			this.disconnect(this._webkitListener);
			delete this._webkitListener;
		}

		// Guard against memory leaks on IE (see #9268)
		if(has("ie")){
			 this.iframe.onfocus = null;
		}
		this.iframe._loadFunc = null;

		if(this._iframeRegHandle){
			this._iframeRegHandle.remove();
			delete this._iframeRegHandle;
		}

		if(this.textarea){
			var s = this.textarea.style;
			s.position = "";
			s.left = s.top = "";
			if(has("ie")){
				s.overflow = this.__overflow;
				this.__overflow = null;
			}
			this.textarea.value = this.value;
			domConstruct.destroy(this.domNode);
			this.domNode = this.textarea;
		}else{
			// Note that this destroys the iframe
			this.domNode.innerHTML = this.value;
		}
		delete this.iframe;

		domClass.remove(this.domNode, this.baseClass);
		this.isClosed = true;
		this.isLoaded = false;

		delete this.editNode;
		delete this.focusNode;

		if(this.window && this.window._frameElement){
			this.window._frameElement = null;
		}

		this.window = null;
		this.document = null;
		this.editingArea = null;
		this.editorObject = null;
	},

	destroy: function(){
		if(!this.isClosed){ this.close(false); }
		if(this._updateTimer){
			clearTimeout(this._updateTimer);
		}
		this.inherited(arguments);
		if(RichText._globalSaveHandler){
			delete RichText._globalSaveHandler[this.id];
		}
	},

	_removeMozBogus: function(/* String */ html){
		// summary:
		//		Post filter to remove unwanted HTML attributes generated by mozilla
		// tags:
		//		private
		return html.replace(/\stype="_moz"/gi, '').replace(/\s_moz_dirty=""/gi, '').replace(/_moz_resizing="(true|false)"/gi,''); // String
	},
	_removeWebkitBogus: function(/* String */ html){
		// summary:
		//		Post filter to remove unwanted HTML attributes generated by webkit
		// tags:
		//		private
		html = html.replace(/\sclass="webkit-block-placeholder"/gi, '');
		html = html.replace(/\sclass="apple-style-span"/gi, '');
		// For some reason copy/paste sometime adds extra meta tags for charset on
		// webkit (chrome) on mac.They need to be removed.  See: #12007"
		html = html.replace(/<meta charset=\"utf-8\" \/>/gi, '');
		return html; // String
	},
	_normalizeFontStyle: function(/* String */ html){
		// summary:
		//		Convert 'strong' and 'em' to 'b' and 'i'.
		// description:
		//		Moz can not handle strong/em tags correctly, so to help
		//		mozilla and also to normalize output, convert them to 'b' and 'i'.
		//
		//		Note the IE generates 'strong' and 'em' rather than 'b' and 'i'
		// tags:
		//		private
		return html.replace(/<(\/)?strong([ \>])/gi, '<$1b$2')
			.replace(/<(\/)?em([ \>])/gi, '<$1i$2' ); // String
	},

	_preFixUrlAttributes: function(/* String */ html){
		// summary:
		//		Pre-filter to do fixing to href attributes on <a> and <img> tags
		// tags:
		//		private
		return html.replace(/(?:(<a(?=\s).*?\shref=)("|')(.*?)\2)|(?:(<a\s.*?href=)([^"'][^ >]+))/gi,
				'$1$4$2$3$5$2 _djrealurl=$2$3$5$2')
			.replace(/(?:(<img(?=\s).*?\ssrc=)("|')(.*?)\2)|(?:(<img\s.*?src=)([^"'][^ >]+))/gi,
				'$1$4$2$3$5$2 _djrealurl=$2$3$5$2'); // String
	},

	/*****************************************************************************
		The following functions implement HTML manipulation commands for various
		browser/contentEditable implementations.  The goal of them is to enforce
		standard behaviors of them.
	******************************************************************************/

	/*** queryCommandEnabled implementations ***/

	_browserQueryCommandEnabled: function(command){
		// summary:
		//		Implementation to call to the native queryCommandEnabled of the browser.
		// command:
		//		The command to check.
		// tags:
		//		protected
		if(!command) { return false; }
		var elem = has("ie") ? this.document.selection.createRange() : this.document;
		try{
			return elem.queryCommandEnabled(command);
		}catch(e){
			return false;
		}
	},

	_createlinkEnabledImpl: function(/*===== argument =====*/){
		// summary:
		//		This function implements the test for if the create link
		//		command should be enabled or not.
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		var enabled = true;
		if(has("opera")){
			var sel = this.window.getSelection();
			if(sel.isCollapsed){
				enabled = true;
			}else{
				enabled = this.document.queryCommandEnabled("createlink");
			}
		}else{
			enabled = this._browserQueryCommandEnabled("createlink");
		}
		return enabled;
	},

	_unlinkEnabledImpl: function(/*===== argument =====*/){
		// summary:
		//		This function implements the test for if the unlink
		//		command should be enabled or not.
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		var enabled = true;
		if(has("mozilla") || has("webkit")){
			enabled = this._sCall("hasAncestorElement", ["a"]);
		}else{
			enabled = this._browserQueryCommandEnabled("unlink");
		}
		return enabled;
	},

	_inserttableEnabledImpl: function(/*===== argument =====*/){
		// summary:
		//		This function implements the test for if the inserttable
		//		command should be enabled or not.
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		var enabled = true;
		if(has("mozilla") || has("webkit")){
			enabled = true;
		}else{
			enabled = this._browserQueryCommandEnabled("inserttable");
		}
		return enabled;
	},

	_cutEnabledImpl: function(/*===== argument =====*/){
		// summary:
		//		This function implements the test for if the cut
		//		command should be enabled or not.
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		var enabled = true;
		if(has("webkit")){
			// WebKit deems clipboard activity as a security threat and natively would return false
			var sel = this.window.getSelection();
			if(sel){ sel = sel.toString(); }
			enabled = !!sel;
		}else{
			enabled = this._browserQueryCommandEnabled("cut");
		}
		return enabled;
	},

	_copyEnabledImpl: function(/*===== argument =====*/){
		// summary:
		//		This function implements the test for if the copy
		//		command should be enabled or not.
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		var enabled = true;
		if(has("webkit")){
			// WebKit deems clipboard activity as a security threat and natively would return false
			var sel = this.window.getSelection();
			if(sel){ sel = sel.toString(); }
			enabled = !!sel;
		}else{
			enabled = this._browserQueryCommandEnabled("copy");
		}
		return enabled;
	},

	_pasteEnabledImpl: function(/*===== argument =====*/){
		// summary:c
		//		This function implements the test for if the paste
		//		command should be enabled or not.
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		var enabled = true;
		if(has("webkit")){
			return true;
		}else{
			enabled = this._browserQueryCommandEnabled("paste");
		}
		return enabled;
	},

	/*** execCommand implementations ***/

	_inserthorizontalruleImpl: function(argument){
		// summary:
		//		This function implements the insertion of HTML 'HR' tags.
		//		into a point on the page.  IE doesn't to it right, so
		//		we have to use an alternate form
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		if(has("ie")){
			return this._inserthtmlImpl("<hr>");
		}
		return this.document.execCommand("inserthorizontalrule", false, argument);
	},

	_unlinkImpl: function(argument){
		// summary:
		//		This function implements the unlink of an 'a' tag.
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		if((this.queryCommandEnabled("unlink")) && (has("mozilla") || has("webkit"))){
			var a = this._sCall("getAncestorElement", [ "a" ]);
			this._sCall("selectElement", [ a ]);
			return this.document.execCommand("unlink", false, null);
		}
		return this.document.execCommand("unlink", false, argument);
	},

	_hilitecolorImpl: function(argument){
		// summary:
		//		This function implements the hilitecolor command
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		var returnValue;
		var isApplied = this._handleTextColorOrProperties("hilitecolor", argument);
		if(!isApplied){
			if(has("mozilla")){
				// mozilla doesn't support hilitecolor properly when useCSS is
				// set to false (bugzilla #279330)
				this.document.execCommand("styleWithCSS", false, true);
				console.log("Executing color command.");
				returnValue = this.document.execCommand("hilitecolor", false, argument);
				this.document.execCommand("styleWithCSS", false, false);
			}else{
				returnValue = this.document.execCommand("hilitecolor", false, argument);
			}
		}
		return returnValue;
	},

	_backcolorImpl: function(argument){
		// summary:
		//		This function implements the backcolor command
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		if(has("ie")){
			// Tested under IE 6 XP2, no problem here, comment out
			// IE weirdly collapses ranges when we exec these commands, so prevent it
			//	var tr = this.document.selection.createRange();
			argument = argument ? argument : null;
		}
		var isApplied = this._handleTextColorOrProperties("backcolor", argument);
		if(!isApplied){
			isApplied = this.document.execCommand("backcolor", false, argument);
		}
		return isApplied;
	},

	_forecolorImpl: function(argument){
		// summary:
		//		This function implements the forecolor command
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		if(has("ie")){
			// Tested under IE 6 XP2, no problem here, comment out
			// IE weirdly collapses ranges when we exec these commands, so prevent it
			//	var tr = this.document.selection.createRange();
			argument = argument? argument : null;
		}
		var isApplied = false;
		isApplied = this._handleTextColorOrProperties("forecolor", argument);
		if(!isApplied){
			isApplied = this.document.execCommand("forecolor", false, argument);
		}
		return isApplied;
	},

	_inserthtmlImpl: function(argument){
		// summary:
		//		This function implements the insertion of HTML content into
		//		a point on the page.
		// argument:
		//		The content to insert, if any.
		// tags:
		//		protected
		argument = this._preFilterContent(argument);
		var rv = true;
		if(has("ie")){
			var insertRange = this.document.selection.createRange();
			if(this.document.selection.type.toUpperCase() === 'CONTROL'){
				var n=insertRange.item(0);
				while(insertRange.length){
					insertRange.remove(insertRange.item(0));
				}
				n.outerHTML=argument;
			}else{
				insertRange.pasteHTML(argument);
			}
			insertRange.select();
			//insertRange.collapse(true);
		}else if(has("mozilla") && !argument.length){
			//mozilla can not inserthtml an empty html to delete current selection
			//so we delete the selection instead in this case
			this._sCall("remove"); // FIXME
		}else{
			rv = this.document.execCommand("inserthtml", false, argument);
		}
		return rv;
	},

	_boldImpl: function(argument){
		// summary:
		//		This function implements an over-ride of the bold command.
		// argument:
		//		Not used, operates by selection.
		// tags:
		//		protected
		var applied = false;
		if(has("ie")){
			this._adaptIESelection();		
			applied = this._adaptIEFormatAreaAndExec("bold");
		}
		if(!applied){
			applied = this.document.execCommand("bold", false, argument);
		}
		return applied;
	},

	_italicImpl: function(argument){
		// summary:
		//		This function implements an over-ride of the italic command.
		// argument:
		//		Not used, operates by selection.
		// tags:
		//		protected
		var applied = false;
		if(has("ie")){
			this._adaptIESelection();			
			applied = this._adaptIEFormatAreaAndExec("italic");
		}
		if(!applied){
			applied = this.document.execCommand("italic", false, argument);
		}
		return applied;
	},

	_underlineImpl: function(argument){
		// summary:
		//		This function implements an over-ride of the underline command.
		// argument:
		//		Not used, operates by selection.
		// tags:
		//		protected
		var applied = false;
		if(has("ie")){
			this._adaptIESelection();			
			applied = this._adaptIEFormatAreaAndExec("underline");
		}
		if(!applied){
			applied = this.document.execCommand("underline", false, argument);
		}
		return applied;
	},

	_strikethroughImpl: function(argument){
		// summary:
		//		This function implements an over-ride of the strikethrough command.
		// argument:
		//		Not used, operates by selection.
		// tags:
		//		protected
		var applied = false;
		if(has("ie")){
			this._adaptIESelection();			
			applied = this._adaptIEFormatAreaAndExec("strikethrough");
		}
		if(!applied){
			applied = this.document.execCommand("strikethrough", false, argument);
		}
		return applied;
	},

	_superscriptImpl: function(argument){
		// summary:
		//		This function implements an over-ride of the superscript command.
		// argument:
		//		Not used, operates by selection.
		// tags:
		//		protected
		var applied = false;
		if(has("ie")){
			this._adaptIESelection();			
			applied = this._adaptIEFormatAreaAndExec("superscript");
		}
		if(!applied){
			applied = this.document.execCommand("superscript", false, argument);
		}
		return applied;
	},

	_subscriptImpl: function(argument){
		// summary:
		//		This function implements an over-ride of the superscript command.
		// argument:
		//		Not used, operates by selection.
		// tags:
		//		protected
		var applied = false;
		if(has("ie")){
			this._adaptIESelection();			
			applied = this._adaptIEFormatAreaAndExec("subscript");
			
		}
		if(!applied){
			applied = this.document.execCommand("subscript", false, argument);
		}
		return applied;
	},
	
	_fontnameImpl: function(argument){
		// summary:
		//		This function implements the fontname command
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		var isApplied;
		if(has("ie")){
			isApplied = this._handleTextColorOrProperties("fontname", argument);
		}
		if(!isApplied){
			isApplied = this.document.execCommand("fontname", false, argument);
		}
		return isApplied;
	},

	_fontsizeImpl: function(argument){
		// summary:
		//		This function implements the fontsize command
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		var isApplied;
		if(has("ie")){
			isApplied = this._handleTextColorOrProperties("fontsize", argument);
		}
		if(!isApplied){
			isApplied = this.document.execCommand("fontsize", false, argument);
		}
		return isApplied;
	},
	
	_insertorderedlistImpl: function(argument){
		// summary:
		//		This function implements the insertorderedlist command
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		var applied = false;
		if(has("ie")){
			applied = this._adaptIEList("insertorderedlist", argument);
		}
		if(!applied){
			applied = this.document.execCommand("insertorderedlist", false, argument);
		}
		return applied;
	},
	
	_insertunorderedlistImpl: function(argument){
		// summary:
		//		This function implements the insertunorderedlist command
		// argument:
		//		arguments to the exec command, if any.
		// tags:
		//		protected
		var applied = false;
		if(has("ie")){
			applied = this._adaptIEList("insertunorderedlist", argument);
		}
		if(!applied){
			applied = this.document.execCommand("insertunorderedlist", false, argument);
		}
		return applied;
	},
	
	getHeaderHeight: function(){
		// summary:
		//		A function for obtaining the height of the header node
		return this._getNodeChildrenHeight(this.header); // Number
	},

	getFooterHeight: function(){
		// summary:
		//		A function for obtaining the height of the footer node
		return this._getNodeChildrenHeight(this.footer); // Number
	},

	_getNodeChildrenHeight: function(node){
		// summary:
		//		An internal function for computing the cumulative height of all child nodes of 'node'
		// node:
		//		The node to process the children of;
		var h = 0;
		if(node && node.childNodes){
			// IE didn't compute it right when position was obtained on the node directly is some cases,
			// so we have to walk over all the children manually.
			var i;
			for(i = 0; i < node.childNodes.length; i++){
				var size = domGeometry.position(node.childNodes[i]);
				h += size.h;
			}
		}
		return h; // Number
	},

	_isNodeEmpty: function(node, startOffset){
		// summary:
		//		Function to test if a node is devoid of real content.
		// node:
		//		The node to check.
		// tags:
		//		private.
		if(node.nodeType === 1/*element*/){
			if(node.childNodes.length > 0){
				return this._isNodeEmpty(node.childNodes[0], startOffset);
	}
			return true;
		}else if(node.nodeType === 3/*text*/){
			return (node.nodeValue.substring(startOffset) === "");
		}
		return false;
	},

	_removeStartingRangeFromRange: function(node, range){
		// summary:
		//		Function to adjust selection range by removing the current
		//		start node.
		// node:
		//		The node to remove from the starting range.
		// range:
		//		The range to adapt.
		// tags:
		//		private
		if(node.nextSibling){
			range.setStart(node.nextSibling,0);
		}else{
			var parent = node.parentNode;
			while(parent && parent.nextSibling == null){
				//move up the tree until we find a parent that has another node, that node will be the next node
				parent = parent.parentNode;
			}
			if(parent){
				range.setStart(parent.nextSibling,0);
			}
		}
		return range;
	},

	_adaptIESelection: function(){
		// summary:
		//		Function to adapt the IE range by removing leading 'newlines'
		//		Needed to fix issue with bold/italics/underline not working if
		//		range included leading 'newlines'.
		//		In IE, if a user starts a selection at the very end of a line,
		//		then the native browser commands will fail to execute correctly.
		//		To work around the issue,  we can remove all empty nodes from
		//		the start of the range selection.
		var selection = rangeapi.getSelection(this.window);
		if(selection && selection.rangeCount && !selection.isCollapsed){
			var range = selection.getRangeAt(0);
			var firstNode = range.startContainer;
			var startOffset = range.startOffset;

			while(firstNode.nodeType === 3/*text*/ && startOffset >= firstNode.length && firstNode.nextSibling){
				//traverse the text nodes until we get to the one that is actually highlighted
				startOffset = startOffset - firstNode.length;
				firstNode = firstNode.nextSibling;
			}

			//Remove the starting ranges until the range does not start with an empty node.
			var lastNode=null;
			while(this._isNodeEmpty(firstNode, startOffset) && firstNode !== lastNode){
				lastNode =firstNode; //this will break the loop in case we can't find the next sibling
				range = this._removeStartingRangeFromRange(firstNode, range); //move the start container to the next node in the range
				firstNode = range.startContainer;
				startOffset = 0; //start at the beginning of the new starting range
			}
			selection.removeAllRanges();// this will work as long as users cannot select multiple ranges. I have not been able to do that in the editor.
			selection.addRange(range);
		}
	},
	
	_adaptIEFormatAreaAndExec: function(command){
		// summary:
		//		Function to handle IE's quirkiness regarding how it handles
		//		format commands on a word.  This involves a lit of node splitting
		//		and format cloning.
		// command:
		//		The format command, needed to check if the desired
		//		command is true or not.
		var selection = rangeapi.getSelection(this.window);
		var doc = this.document;
		var rs, ret, range, txt, startNode, endNode, breaker, sNode;
		if(command && selection && selection.isCollapsed){
			var isApplied = this.queryCommandValue(command);
			if(isApplied){
				
				// We have to split backwards until we hit the format
				var nNames = this._tagNamesForCommand(command);
				range = selection.getRangeAt(0);
				var fs = range.startContainer;
				if(fs.nodeType === 3){
					var offset = range.endOffset;
					if(fs.length < offset){
						//We are not looking from the right node, try to locate the correct one
						ret = this._adjustNodeAndOffset(rs, offset);
						fs = ret.node;
						offset = ret.offset;
					}
				}									
				var topNode;
				while(fs && fs !== this.editNode){
					// We have to walk back and see if this is still a format or not.
					// Hm, how do I do this?
					var tName = fs.tagName? fs.tagName.toLowerCase() : "";
					if(array.indexOf(nNames, tName) > -1){
						topNode = fs;
						break;
					}
					fs = fs.parentNode;
				}

				// Okay, we have a stopping place, time to split things apart.
				if(topNode){
					// Okay, we know how far we have to split backwards, so we have to split now.
					rs = range.startContainer;
					var newblock = doc.createElement(topNode.tagName);
					domConstruct.place(newblock, topNode, "after");
					if(rs && rs.nodeType === 3){
						// Text node, we have to split it.
						var nodeToMove, tNode;
						var endOffset = range.endOffset;
						if(rs.length < endOffset){
							//We are not splitting the right node, try to locate the correct one
							ret = this._adjustNodeAndOffset(rs, endOffset);
							rs = ret.node;
							endOffset = ret.offset;
						}
		
						txt = rs.nodeValue;
						startNode = doc.createTextNode(txt.substring(0, endOffset));
						var endText = txt.substring(endOffset, txt.length);
						if(endText){
							endNode = doc.createTextNode(endText);
						}
						// Place the split, then remove original nodes.
						domConstruct.place(startNode, rs, "before");
						if(endNode){
							breaker = doc.createElement("span");
							breaker.className = "ieFormatBreakerSpan";
							domConstruct.place(breaker, rs, "after");
							domConstruct.place(endNode, breaker, "after");
							endNode = breaker;
						}
						domConstruct.destroy(rs);
						
						// Okay, we split the text.  Now we need to see if we're
						// parented to the block element we're splitting and if
						// not, we have to split all the way up.  Ugh.
						var parentC = startNode.parentNode;
						var tagList = [];
						var tagData;
						while(parentC !== topNode){
							var tg = parentC.tagName;
							tagData = {tagName: tg};
							tagList.push(tagData);
														
							var newTg = doc.createElement(tg);
							// Clone over any 'style' data.
							if(parentC.style){
								if(newTg.style){
									if(parentC.style.cssText){
										newTg.style.cssText = parentC.style.cssText;
										tagData.cssText = parentC.style.cssText;
									}
								}
							}
							// If font also need to clone over any font data.
							if(parentC.tagName === "FONT"){
								if(parentC.color){
									newTg.color = parentC.color;
									tagData.color = parentC.color;
								}
								if(parentC.face){
									newTg.face = parentC.face;
									tagData.face = parentC.face;
								}
								if(parentC.size){  // this check was necessary on IE
									newTg.size = parentC.size;
									tagData.size = parentC.size;
								}
							}
							if(parentC.className){
								newTg.className = parentC.className;
								tagData.className = parentC.className;
							}
							
							// Now move end node and every sibling 
							// after it over into the new tag.
							if(endNode){
								nodeToMove = endNode;
								while(nodeToMove){
									tNode = nodeToMove.nextSibling;
									newTg.appendChild(nodeToMove);
									nodeToMove = tNode;
								}
							}
							if(newTg.tagName == parentC.tagName){
								breaker = doc.createElement("span");
								breaker.className = "ieFormatBreakerSpan";
								domConstruct.place(breaker, parentC, "after");
								domConstruct.place(newTg, breaker, "after");
							}else{
								domConstruct.place(newTg, parentC, "after");
							}
							startNode = parentC;
							endNode = newTg;
							parentC = parentC.parentNode;
						}

						// Lastly, move the split out all the split tags 
						// to the new block as they should now be split properly.
						if(endNode){
							nodeToMove = endNode;
							if(nodeToMove.nodeType === 1 || (nodeToMove.nodeType === 3 && nodeToMove.nodeValue)){
								// Non-blank text and non-text nodes need to clear out that blank space
								// before moving the contents.
								newblock.innerHTML = "";
							}
							while(nodeToMove){
								tNode = nodeToMove.nextSibling;
								newblock.appendChild(nodeToMove);
								nodeToMove = tNode;
							}
						}
						
						// We had intermediate tags, we have to now recreate them inbetween the split
						// and restore what styles, classnames, etc, we can.  
						if(tagList.length){
							tagData = tagList.pop();
							var newContTag = doc.createElement(tagData.tagName);
							if(tagData.cssText && newContTag.style){
								newContTag.style.cssText = tagData.cssText;
							}
							if(tagData.className){
								newContTag.className = tagData.className;
							}
							if(tagData.tagName === "FONT"){
								if(tagData.color){
									newContTag.color = tagData.color;
								}
								if(tagData.face){
									newContTag.face = tagData.face;
								}
								if(tagData.size){ 
									newContTag.size = tagData.size;
								}
							}								
							domConstruct.place(newContTag, newblock, "before");
							while(tagList.length){
								tagData = tagList.pop();
								var newTgNode = doc.createElement(tagData.tagName);
								if(tagData.cssText && newTgNode.style){
									newTgNode.style.cssText = tagData.cssText;
								}
								if(tagData.className){
									newTgNode.className = tagData.className;
								}
								if(tagData.tagName === "FONT"){
									if(tagData.color){
										newTgNode.color = tagData.color;
									}
									if(tagData.face){
										newTgNode.face = tagData.face;
									}
									if(tagData.size){ 
										newTgNode.size = tagData.size;
									}
								}	
								newContTag.appendChild(newTgNode);
								newContTag = newTgNode;
							}							
							
							// Okay, everything is theoretically split apart and removed from the content
							// so insert the dummy text to select, select it, then
							// clear to position cursor.
							sNode = doc.createTextNode(".");
							breaker.appendChild(sNode);
							newContTag.appendChild(sNode);
							win.withGlobal(this.window, lang.hitch(this, function(){
								var newrange = rangeapi.create();
								newrange.setStart(sNode, 0);
								newrange.setEnd(sNode, sNode.length);
								selection.removeAllRanges();
								selection.addRange(newrange);
								selectionapi.collapse(false);
								sNode.parentNode.innerHTML = "";
							}));							
						}else{
							// No extra tags, so we have to insert a breaker point and rely
							// on filters to remove it later.
							breaker = doc.createElement("span");
							breaker.className="ieFormatBreakerSpan";
							sNode = doc.createTextNode(".");
							breaker.appendChild(sNode);
							domConstruct.place(breaker, newblock, "before");
							win.withGlobal(this.window, lang.hitch(this, function(){
								var newrange = rangeapi.create();
								newrange.setStart(sNode, 0);
								newrange.setEnd(sNode, sNode.length);
								selection.removeAllRanges();
								selection.addRange(newrange);
								selectionapi.collapse(false);
								sNode.parentNode.innerHTML = "";
							}));
						}
						if(!newblock.firstChild){
							// Empty, we don't need it.  Split was at end or similar
							// So, remove it.
							domConstruct.destroy(newblock);
						}					
						return true;
					}
				}
				return false;
			}else{
				range = selection.getRangeAt(0);
				rs = range.startContainer;
				if(rs && rs.nodeType === 3){
					// Text node, we have to split it.
					win.withGlobal(this.window, lang.hitch(this, function(){
						var offset = range.startOffset;
						if(rs.length < offset){
							//We are not splitting the right node, try to locate the correct one
							ret = this._adjustNodeAndOffset(rs, offset);
							rs = ret.node;
							offset = ret.offset;
						}
						txt = rs.nodeValue;
						startNode = doc.createTextNode(txt.substring(0, offset));
						var endText = txt.substring(offset);
						if(endText !== ""){
							endNode = doc.createTextNode(txt.substring(offset));
						}
						// Create a space, we'll select and bold it, so 
						// the whole word doesn't get bolded
						breaker = doc.createElement("span");
						sNode = doc.createTextNode(".");
						breaker.appendChild(sNode);
						if(startNode.length){
							domConstruct.place(startNode, rs, "after");
						}else{
							startNode = rs;
						}
						domConstruct.place(breaker, startNode, "after");
						if(endNode){
							domConstruct.place(endNode, breaker, "after");
						}
						domConstruct.destroy(rs);
						var newrange = rangeapi.create();
						newrange.setStart(sNode, 0);
						newrange.setEnd(sNode, sNode.length);
						selection.removeAllRanges();
						selection.addRange(newrange);
						doc.execCommand(command);
						domConstruct.place(breaker.firstChild, breaker, "before");
						domConstruct.destroy(breaker);
						newrange.setStart(sNode, 0);
						newrange.setEnd(sNode, sNode.length);
						selection.removeAllRanges();
						selection.addRange(newrange);
						selectionapi.collapse(false);
						sNode.parentNode.innerHTML = "";
					}));
					return true;
				}
			}
		}else{
			return false;
		}
	},
	
	_adaptIEList: function(command /*===== , argument =====*/){
		// summary:
		//		This function handles normalizing the IE list behavior as 
		//		much as possible.
		// command:
		//		The list command to execute.
		// argument:
		//		Any additional argument.
		// tags:
		//		private
		var selection = rangeapi.getSelection(this.window);
		if(selection.isCollapsed){
			// In the case of no selection, lets commonize the behavior and
			// make sure that it indents if needed.
			if(selection.rangeCount && !this.queryCommandValue(command)){
				var range = selection.getRangeAt(0);
				var sc = range.startContainer;
				if(sc && sc.nodeType == 3){
					// text node.  Lets see if there is a node before it that isn't
					// some sort of breaker.
					if(!range.startOffset){
						// We're at the beginning of a text area.  It may have been br split
						// Who knows?  In any event, we must create the list manually
						// or IE may shove too much into the list element.  It seems to
						// grab content before the text node too if it's br split.
						// Why can't IE work like everyone else?
						win.withGlobal(this.window, lang.hitch(this, function(){
							// Create a space, we'll select and bold it, so 
							// the whole word doesn't get bolded
							var lType = "ul";
							if(command === "insertorderedlist"){
								lType = "ol";
							}
							var list = domConstruct.create(lType);
							var li = domConstruct.create("li", null, list);
							domConstruct.place(list, sc, "before");
							// Move in the text node as part of the li.
							li.appendChild(sc);
							// We need a br after it or the enter key handler
							// sometimes throws errors.
							domConstruct.create("br", null, list, "after");
							// Okay, now lets move our cursor to the beginning.
							var newrange = rangeapi.create();
							newrange.setStart(sc, 0);
							newrange.setEnd(sc, sc.length);
							selection.removeAllRanges();
							selection.addRange(newrange);
							selectionapi.collapse(true);
						}));
						return true;
					}
				}
			}
		}
		return false;
	},
	
	_handleTextColorOrProperties: function(command, argument){
		// summary:
		//		This function handles appplying text color as best it is 
		//		able to do so when the selection is collapsed, making the
		//		behavior cross-browser consistent. It also handles the name
		//		and size for IE.
		// command:
		//		The command.
		// argument:
		//		Any additional arguments.
		// tags:
		//		private
		var selection = rangeapi.getSelection(this.window);
		var doc = this.document;
		var rs, ret, range, txt, startNode, endNode, breaker, sNode;
		argument = argument || null;
		if(command && selection && selection.isCollapsed){
			if(selection.rangeCount){
				range = selection.getRangeAt(0);
				rs = range.startContainer;
				if(rs && rs.nodeType === 3){
					// Text node, we have to split it.
					win.withGlobal(this.window, lang.hitch(this, function(){
						var offset = range.startOffset;
						if(rs.length < offset){
							//We are not splitting the right node, try to locate the correct one
							ret = this._adjustNodeAndOffset(rs, offset);
							rs = ret.node;
							offset = ret.offset;
						}
						txt = rs.nodeValue;
						startNode = doc.createTextNode(txt.substring(0, offset));
						var endText = txt.substring(offset);
						if(endText !== ""){
							endNode = doc.createTextNode(txt.substring(offset));
						}
						// Create a space, we'll select and bold it, so 
						// the whole word doesn't get bolded
						breaker = domConstruct.create("span");
						sNode = doc.createTextNode(".");
						breaker.appendChild(sNode);
						// Create a junk node to avoid it trying to stlye the breaker.
						// This will get destroyed later.
						var extraSpan = domConstruct.create("span");
						breaker.appendChild(extraSpan);
						if(startNode.length){
							domConstruct.place(startNode, rs, "after");
						}else{
							startNode = rs;
						}
						domConstruct.place(breaker, startNode, "after");
						if(endNode){
							domConstruct.place(endNode, breaker, "after");
						}
						domConstruct.destroy(rs);
						var newrange = rangeapi.create();
						newrange.setStart(sNode, 0);
						newrange.setEnd(sNode, sNode.length);
						selection.removeAllRanges();
						selection.addRange(newrange);
						if(has("webkit")){
							// WebKit is frustrating with positioning the cursor. 
							// It stinks to have a selected space, but there really
							// isn't much choice here.
							var style = "color";
							if(command === "hilitecolor" || command === "backcolor"){
								style = "backgroundColor";
							}
							domStyle.set(breaker, style, argument);
							selectionapi.remove();
							domConstruct.destroy(extraSpan);
							breaker.innerHTML = "&#160;";	// &nbsp;
							selectionapi.selectElement(breaker);
							this.focus();
						}else{
							this.execCommand(command, argument);
							domConstruct.place(breaker.firstChild, breaker, "before");
							domConstruct.destroy(breaker);
							newrange.setStart(sNode, 0);
							newrange.setEnd(sNode, sNode.length);
							selection.removeAllRanges();
							selection.addRange(newrange);
							selectionapi.collapse(false);
							sNode.parentNode.removeChild(sNode);
						}
					}));
					return true;
				}
			}				
		}
		return false;
	},
	
	_adjustNodeAndOffset: function(/*DomNode*/node, /*Int*/offset){
		// summary:
		//		In the case there are multiple text nodes in a row the offset may not be within the node.  
		//		If the offset is larger than the node length, it will attempt to find
		//		the next text sibling until it locates the text node in which the offset refers to
		// node:
		//		The node to check.
		// offset:
		//		The position to find within the text node
		// tags:
		//		private.
		while(node.length < offset && node.nextSibling && node.nextSibling.nodeType === 3){
			//Adjust the offset and node in the case of multiple text nodes in a row
			offset = offset - node.length;
			node = node.nextSibling;
		}
		return {"node": node, "offset": offset};
	},
	
	_tagNamesForCommand: function(command){
		// summary:
		//		Function to return the tab names that are associated
		//		with a particular style.
		// command: String
		//		The command to return tags for.
		// tags:
		//		private
		if(command === "bold"){
			return ["b", "strong"];
		}else if(command === "italic"){
			return ["i","em"];
		}else if(command === "strikethrough"){
			return ["s", "strike"];
		}else if(command === "superscript"){
			return ["sup"];
		}else if(command === "subscript"){
			return ["sub"];
		}else if(command === "underline"){
			return ["u"];
		}	
		return [];
	},

	_stripBreakerNodes: function(node){
		// summary:
		//		Function for stripping out the breaker spans inserted by the formatting command.
		//		Registered as a filter for IE, handles the breaker spans needed to fix up
		//		How bold/italic/etc, work when selection is collapsed (single cursor).
		win.withGlobal(this.window, lang.hitch(this, function(){
			var breakers = query(".ieFormatBreakerSpan", node);
			var i;
			for(i = 0; i < breakers.length; i++){
				var b = breakers[i];
				while(b.firstChild){
					domConstruct.place(b.firstChild, b, "before");
				}
				domConstruct.destroy(b);
			}		
		}));
		return node;
	}
});

return RichText;

});

},
'dojo/store/util/SimpleQueryEngine':function(){
define(["../../_base/array"], function(arrayUtil) {
  //  module:
  //    dojo/store/util/SimpleQueryEngine
  //  summary:
  //    The module defines a simple filtering query engine for object stores. 

return function(query, options){
	// summary:
	//		Simple query engine that matches using filter functions, named filter
	//		functions or objects by name-value on a query object hash
	//
	// description:
	//		The SimpleQueryEngine provides a way of getting a QueryResults through
	//		the use of a simple object hash as a filter.  The hash will be used to
	//		match properties on data objects with the corresponding value given. In
	//		other words, only exact matches will be returned.
	//
	//		This function can be used as a template for more complex query engines;
	//		for example, an engine can be created that accepts an object hash that
	//		contains filtering functions, or a string that gets evaluated, etc.
	//
	//		When creating a new dojo.store, simply set the store's queryEngine
	//		field as a reference to this function.
	//
	// query: Object
	//		An object hash with fields that may match fields of items in the store.
	//		Values in the hash will be compared by normal == operator, but regular expressions
	//		or any object that provides a test() method are also supported and can be
	// 		used to match strings by more complex expressions
	// 		(and then the regex's or object's test() method will be used to match values).
	//
	// options: dojo.store.util.SimpleQueryEngine.__queryOptions?
	//		An object that contains optional information such as sort, start, and count.
	//
	// returns: Function
	//		A function that caches the passed query under the field "matches".  See any
	//		of the "query" methods on dojo.stores.
	//
	// example:
	//		Define a store with a reference to this engine, and set up a query method.
	//
	//	|	var myStore = function(options){
	//	|		//	...more properties here
	//	|		this.queryEngine = dojo.store.util.SimpleQueryEngine;
	//	|		//	define our query method
	//	|		this.query = function(query, options){
	//	|			return dojo.store.util.QueryResults(this.queryEngine(query, options)(this.data));
	//	|		};
	//	|	};

	// create our matching query function
	switch(typeof query){
		default:
			throw new Error("Can not query with a " + typeof query);
		case "object": case "undefined":
			var queryObject = query;
			query = function(object){
				for(var key in queryObject){
					var required = queryObject[key];
					if(required && required.test){
						if(!required.test(object[key])){
							return false;
						}
					}else if(required != object[key]){
						return false;
					}
				}
				return true;
			};
			break;
		case "string":
			// named query
			if(!this[query]){
				throw new Error("No filter function " + query + " was found in store");
			}
			query = this[query];
			// fall through
		case "function":
			// fall through
	}
	function execute(array){
		// execute the whole query, first we filter
		var results = arrayUtil.filter(array, query);
		// next we sort
		if(options && options.sort){
			results.sort(function(a, b){
				for(var sort, i=0; sort = options.sort[i]; i++){
					var aValue = a[sort.attribute];
					var bValue = b[sort.attribute];
					if (aValue != bValue) {
						return !!sort.descending == aValue > bValue ? -1 : 1;
					}
				}
				return 0;
			});
		}
		// now we paginate
		if(options && (options.start || options.count)){
			var total = results.length;
			results = results.slice(options.start || 0, (options.start || 0) + (options.count || Infinity));
			results.total = total;
		}
		return results;
	}
	execute.matches = query;
	return execute;
};
});

},
'esri/dijit/editing/AttachmentEditor':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dijit/_Widget,dijit/_Templated"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.AttachmentEditor");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
//dojo.require("dojo.data.ItemFileReadStore");
//dojo.require("dojox.grid.DataGrid");

/***************
 * CSS Includes
 ***************/
//anonymous function to load CSS files required for this module
(function() {
    var css = [dojo.moduleUrl("esri.dijit.editing", "css/attachment.css")];

    var head = document.getElementsByTagName("head").item(0), link,
        i, il = css.length;
    for (i = 0; i < il; i++) {
        link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = css[i];
        head.appendChild(link);
    }
}());

/************************
 * Attachment Editor Dijit
 ************************/
dojo.declare("esri.dijit.editing.AttachmentEditor", [dijit._Widget, dijit._Templated], {

    widgetsInTemplate: true,
    templateString:"<div class=\"attachmentEditor\">\r\n    <br />\r\n    <div>\r\n        <b>${NLS_attachments}</b>\r\n        <hr />\r\n        <br /> \r\n        <span dojoAttachPoint='_attachmentList' style='word-wrap: break-word;'></span>\r\n        <br><br>\r\n        <form dojoAttachPoint='_uploadForm'> ${NLS_add}:&nbsp;&nbsp;<input type='file' name='attachment' dojoAttachPoint='_uploadField' /> </form>\r\n    </div>\r\n</div>",
    basePath: dojo.moduleUrl("esri.dijit.editing"),

    _listHtml: "<span id='node_${oid}_${attid}'><a href='${href}' target='_blank'>${name}</a>",
    _deleteBtnHtml: "(<span style='cursor:pointer;color:red;font-weight:bold;' class='deleteAttachment' id='${attid}');'>X</span>)",
    _endHtml: "<br/></span>",
    _aeConnects: [],
    _layerEditingCapChecked: {},
    _layerEditingCap: {},

    /*************
     * Overrides
     *************/
    constructor: function(params, srcNodeRef) {
        // Mixin i18n strings
        dojo.mixin(this, esri.bundle.widgets.attachmentEditor);
    },

    startup: function() {
        this.inherited(arguments);
        this._uploadField_connect = dojo.connect(this._uploadField, "onchange", this, "_addAttachment");
    },

    destroy: function() {
        dojo.forEach(this._aeConnects, dojo.disconnect);
        dojo.disconnect(this._uploadField_connect);
        this.inherited(arguments);
    },

    /*****************
     * Public Methods
     *****************/
    showAttachments: function(feature, featureLayer) {
        var list = this._attachmentList;
        list.innerHTML = this.NLS_none;
        this._uploadField.value = "";
        if (!feature) { return; }
        this._featureLayer = feature.getLayer() || featureLayer;
        if (!this._featureLayer) { return; }
        this._currentLayerId = this._featureLayer.id;
        if (!this._layerEditingCapChecked[this._currentLayerId]) {
          this._layerEditingCap[this._currentLayerId] = this._featureLayer.getEditCapabilities();
          this._layerEditingCapChecked[this._currentLayerId] = true;
        }
        this._featureCanUpdate = this._featureLayer.getEditCapabilities({feature: feature}).canUpdate;
        this._oid = feature.attributes[this._featureLayer.objectIdField];
        this._getAttachments(feature);
    },

    /*******************
     * Internal Methods
     *******************/
    _getAttachments: function(feature) {
        if (!this._featureLayer || !this._featureLayer.queryAttachmentInfos){ return; }
        this._featureLayer.queryAttachmentInfos(this._oid, dojo.hitch(this, "_onQueryAttachmentInfosComplete"));
    },

    _addAttachment: function() {
        if (!this._featureLayer || !this._featureLayer.addAttachment){ return; }
        this._featureLayer.addAttachment(this._oid, this._uploadForm, dojo.hitch(this, "_onAddAttachmentComplete"));
    },

    _deleteAttachment: function(oid, attid) {
        this._featureLayer.deleteAttachments(oid, [attid], dojo.hitch(this, "_onDeleteAttachmentComplete"));
    },

    _onQueryAttachmentInfosComplete: function(response) {
        var htmlMarkup = this._listHtml + this._deleteBtnHtml + this._endHtml;
        this._uploadForm.style.display = "block";
        if ((!this._featureCanUpdate && this._layerEditingCap[this._currentLayerId].canUpdate) || 
           (!this._layerEditingCap[this._currentLayerId].canCreate && !this._layerEditingCap[this._currentLayerId].canUpdate)) {
          htmlMarkup = this._listHtml + this._endHtml;
          this._uploadForm.style.display = "none";
        }
        else if (this._layerEditingCap[this._currentLayerId].canCreate && !this._layerEditingCap[this._currentLayerId].canUpdate) {
          htmlMarkup = this._listHtml + this._endHtml;
        }
        var list = this._attachmentList,
            links = dojo.map(response, dojo.hitch(this, function(info) {
                return esri.substitute({
                    href: info.url,
                    name: info.name,
                    oid: info.objectId,
                    attid: info.id
                }, htmlMarkup);
            }));
        
        list.innerHTML = links.join("") || this.NLS_none;
        this._updateConnects();
    },

    _onAddAttachmentComplete: function(response) {
        var uploadField = this._uploadField;
        var uploadFieldVal = uploadField.value;
        var pos = uploadFieldVal.lastIndexOf("\\");
        if (pos > -1) {
            uploadFieldVal = uploadFieldVal.substring(pos + 1, uploadFieldVal.length);
        }
        uploadFieldVal = uploadFieldVal.replace(/\ /g, '_');

        var list = this._attachmentList,
            params = dojo.objectToQuery({
              gdbVersion: this._featureLayer.gdbVersion,
              token: this._featureLayer._getToken()
            });
            
        var htmlMarkup = this._listHtml + this._deleteBtnHtml + this._endHtml;
        if (this._layerEditingCap[this._currentLayerId].canCreate && !this._layerEditingCap[this._currentLayerId].canUpdate) {
          htmlMarkup = this._listHtml + this._endHtml;
        }
        var link = esri.substitute({
            href: this._featureLayer._url.path + "/" + response.objectId + "/attachments/" + response.attachmentId + (params ? ("?" + params) : ""),
            name: uploadFieldVal,
            oid: response.objectId,
            attid: response.attachmentId
        }, htmlMarkup);
        list.innerHTML = list.innerHTML == this.NLS_none ? link : (list.innerHTML + link);
        this._updateConnects();
        uploadField.value = "";
    },

    _onDeleteAttachmentComplete: function(response) {
        var success = dojo.every(response, function(result) { return result.success; });
        if (success) { dojo.byId("node_" + response[0].objectId + "_" + response[0].attachmentId).innerHTML = ""; }
    },

    _updateConnects: function() {
        dojo.forEach(this._aeConnects, dojo.disconnect);
        dojo.query('.deleteAttachment').forEach( function(item) {
            this._aeConnects.push(dojo.connect(item, "onclick", dojo.hitch(this, "_deleteAttachment", this._oid, item.id)));
        }, this);
    }
});

});

},
'dijit/ToolbarSeparator':function(){
define("dijit/ToolbarSeparator", [
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.setSelectable
	"./_Widget",
	"./_TemplatedMixin"
], function(declare, dom, _Widget, _TemplatedMixin){

/*=====
	var _Widget = dijit._Widget;
	var _TemplatedMixin = dijit._TemplatedMixin;
=====*/

	// module:
	//		dijit/ToolbarSeparator
	// summary:
	//		A spacer between two `dijit.Toolbar` items


	return declare("dijit.ToolbarSeparator", [_Widget, _TemplatedMixin], {
		// summary:
		//		A spacer between two `dijit.Toolbar` items

		templateString: '<div class="dijitToolbarSeparator dijitInline" role="presentation"></div>',

		buildRendering: function(){
			this.inherited(arguments);
			dom.setSelectable(this.domNode, false);
		},

		isFocusable: function(){
			// summary:
			//		This widget isn't focusable, so pass along that fact.
			// tags:
			//		protected
			return false;
		}
	});
});

},
'dijit/layout/_LayoutWidget':function(){
define("dijit/layout/_LayoutWidget", [
	"dojo/_base/lang", // lang.mixin
	"../_Widget",
	"../_Container",
	"../_Contained",
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add domClass.remove
	"dojo/dom-geometry", // domGeometry.marginBox
	"dojo/dom-style", // domStyle.getComputedStyle
	"dojo/_base/sniff", // has("ie")
	"dojo/_base/window" // win.global
], function(lang, _Widget, _Container, _Contained,
	declare, domClass, domGeometry, domStyle, has, win){

/*=====
	var _Widget = dijit._Widget;
	var _Container = dijit._Container;
	var _Contained = dijit._Contained;
=====*/

	// module:
	//		dijit/layout/_LayoutWidget
	// summary:
	//		_LayoutWidget Base class for a _Container widget which is responsible for laying out its children.
	//		Widgets which mixin this code must define layout() to manage placement and sizing of the children.


	return declare("dijit.layout._LayoutWidget", [_Widget, _Container, _Contained], {
		// summary:
		//		Base class for a _Container widget which is responsible for laying out its children.
		//		Widgets which mixin this code must define layout() to manage placement and sizing of the children.

		// baseClass: [protected extension] String
		//		This class name is applied to the widget's domNode
		//		and also may be used to generate names for sub nodes,
		//		for example dijitTabContainer-content.
		baseClass: "dijitLayoutContainer",

		// isLayoutContainer: [protected] Boolean
		//		Indicates that this widget is going to call resize() on its
		//		children widgets, setting their size, when they become visible.
		isLayoutContainer: true,

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode, "dijitContainer");
		},

		startup: function(){
			// summary:
			//		Called after all the widgets have been instantiated and their
			//		dom nodes have been inserted somewhere under win.doc.body.
			//
			//		Widgets should override this method to do any initialization
			//		dependent on other widgets existing, and then call
			//		this superclass method to finish things off.
			//
			//		startup() in subclasses shouldn't do anything
			//		size related because the size of the widget hasn't been set yet.

			if(this._started){ return; }

			// Need to call inherited first - so that child widgets get started
			// up correctly
			this.inherited(arguments);

			// If I am a not being controlled by a parent layout widget...
			var parent = this.getParent && this.getParent();
			if(!(parent && parent.isLayoutContainer)){
				// Do recursive sizing and layout of all my descendants
				// (passing in no argument to resize means that it has to glean the size itself)
				this.resize();

				// Since my parent isn't a layout container, and my style *may be* width=height=100%
				// or something similar (either set directly or via a CSS class),
				// monitor when viewport size changes so that I can re-layout.
				this.connect(win.global, 'onresize', function(){
					// Using function(){} closure to ensure no arguments passed to resize().
					this.resize();
				});
			}
		},

		resize: function(changeSize, resultSize){
			// summary:
			//		Call this to resize a widget, or after its size has changed.
			// description:
			//		Change size mode:
			//			When changeSize is specified, changes the marginBox of this widget
			//			and forces it to relayout its contents accordingly.
			//			changeSize may specify height, width, or both.
			//
			//			If resultSize is specified it indicates the size the widget will
			//			become after changeSize has been applied.
			//
			//		Notification mode:
			//			When changeSize is null, indicates that the caller has already changed
			//			the size of the widget, or perhaps it changed because the browser
			//			window was resized.  Tells widget to relayout its contents accordingly.
			//
			//			If resultSize is also specified it indicates the size the widget has
			//			become.
			//
			//		In either mode, this method also:
			//			1. Sets this._borderBox and this._contentBox to the new size of
			//				the widget.  Queries the current domNode size if necessary.
			//			2. Calls layout() to resize contents (and maybe adjust child widgets).
			//
			// changeSize: Object?
			//		Sets the widget to this margin-box size and position.
			//		May include any/all of the following properties:
			//	|	{w: int, h: int, l: int, t: int}
			//
			// resultSize: Object?
			//		The margin-box size of this widget after applying changeSize (if
			//		changeSize is specified).  If caller knows this size and
			//		passes it in, we don't need to query the browser to get the size.
			//	|	{w: int, h: int}

			var node = this.domNode;

			// set margin box size, unless it wasn't specified, in which case use current size
			if(changeSize){
				domGeometry.setMarginBox(node, changeSize);
			}

			// If either height or width wasn't specified by the user, then query node for it.
			// But note that setting the margin box and then immediately querying dimensions may return
			// inaccurate results, so try not to depend on it.
			var mb = resultSize || {};
			lang.mixin(mb, changeSize || {});	// changeSize overrides resultSize
			if( !("h" in mb) || !("w" in mb) ){
				mb = lang.mixin(domGeometry.getMarginBox(node), mb);	// just use domGeometry.marginBox() to fill in missing values
			}

			// Compute and save the size of my border box and content box
			// (w/out calling domGeometry.getContentBox() since that may fail if size was recently set)
			var cs = domStyle.getComputedStyle(node);
			var me = domGeometry.getMarginExtents(node, cs);
			var be = domGeometry.getBorderExtents(node, cs);
			var bb = (this._borderBox = {
				w: mb.w - (me.w + be.w),
				h: mb.h - (me.h + be.h)
			});
			var pe = domGeometry.getPadExtents(node, cs);
			this._contentBox = {
				l: domStyle.toPixelValue(node, cs.paddingLeft),
				t: domStyle.toPixelValue(node, cs.paddingTop),
				w: bb.w - pe.w,
				h: bb.h - pe.h
			};

			// Callback for widget to adjust size of its children
			this.layout();
		},

		layout: function(){
			// summary:
			//		Widgets override this method to size and position their contents/children.
			//		When this is called this._contentBox is guaranteed to be set (see resize()).
			//
			//		This is called after startup(), and also when the widget's size has been
			//		changed.
			// tags:
			//		protected extension
		},

		_setupChild: function(/*dijit._Widget*/child){
			// summary:
			//		Common setup for initial children and children which are added after startup
			// tags:
			//		protected extension

			var cls = this.baseClass + "-child "
				+ (child.baseClass ? this.baseClass + "-" + child.baseClass : "");
			domClass.add(child.domNode, cls);
		},

		addChild: function(/*dijit._Widget*/ child, /*Integer?*/ insertIndex){
			// Overrides _Container.addChild() to call _setupChild()
			this.inherited(arguments);
			if(this._started){
				this._setupChild(child);
			}
		},

		removeChild: function(/*dijit._Widget*/ child){
			// Overrides _Container.removeChild() to remove class added by _setupChild()
			var cls = this.baseClass + "-child"
					+ (child.baseClass ?
						" " + this.baseClass + "-" + child.baseClass : "");
			domClass.remove(child.domNode, cls);

			this.inherited(arguments);
		}
	});
});

},
'dijit/form/_Spinner':function(){
require({cache:{
'url:dijit/form/templates/Spinner.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\"\r\n\tid=\"widget_${id}\" role=\"presentation\"\r\n\t><div class=\"dijitReset dijitButtonNode dijitSpinnerButtonContainer\"\r\n\t\t><input class=\"dijitReset dijitInputField dijitSpinnerButtonInner\" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t\t/><div class=\"dijitReset dijitLeft dijitButtonNode dijitArrowButton dijitUpArrowButton\"\r\n\t\t\tdata-dojo-attach-point=\"upArrowNode\"\r\n\t\t\t><div class=\"dijitArrowButtonInner\"\r\n\t\t\t\t><input class=\"dijitReset dijitInputField\" value=\"&#9650;\" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t\t\t\t\t${_buttonInputDisabled}\r\n\t\t\t/></div\r\n\t\t></div\r\n\t\t><div class=\"dijitReset dijitLeft dijitButtonNode dijitArrowButton dijitDownArrowButton\"\r\n\t\t\tdata-dojo-attach-point=\"downArrowNode\"\r\n\t\t\t><div class=\"dijitArrowButtonInner\"\r\n\t\t\t\t><input class=\"dijitReset dijitInputField\" value=\"&#9660;\" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t\t\t\t\t${_buttonInputDisabled}\r\n\t\t\t/></div\r\n\t\t></div\r\n\t></div\r\n\t><div class='dijitReset dijitValidationContainer'\r\n\t\t><input class=\"dijitReset dijitInputField dijitValidationIcon dijitValidationInner\" value=\"&#935;\" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t/></div\r\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\r\n\t\t><input class='dijitReset dijitInputInner' data-dojo-attach-point=\"textbox,focusNode\" type=\"${type}\" data-dojo-attach-event=\"onkeypress:_onKeyPress\"\r\n\t\t\trole=\"spinbutton\" autocomplete=\"off\" ${!nameAttrSetting}\r\n\t/></div\r\n></div>\r\n"}});
define("dijit/form/_Spinner", [
	"dojo/_base/declare", // declare
	"dojo/_base/event", // event.stop
	"dojo/keys", // keys keys.DOWN_ARROW keys.PAGE_DOWN keys.PAGE_UP keys.UP_ARROW
	"dojo/_base/lang", // lang.hitch
	"dojo/_base/sniff", // has("mozilla")
	"dijit/typematic",
	"./RangeBoundTextBox",
	"dojo/text!./templates/Spinner.html",
	"./_TextBoxMixin"	// selectInputText
], function(declare, event, keys, lang, has, typematic, RangeBoundTextBox, template, _TextBoxMixin){

/*=====
	var RangeBoundTextBox = dijit.form.RangeBoundTextBox;
=====*/

	// module:
	//		dijit/form/_Spinner
	// summary:
	//		Mixin for validation widgets with a spinner.


	return declare("dijit.form._Spinner", RangeBoundTextBox, {
		// summary:
		//		Mixin for validation widgets with a spinner.
		// description:
		//		This class basically (conceptually) extends `dijit.form.ValidationTextBox`.
		//		It modifies the template to have up/down arrows, and provides related handling code.

		// defaultTimeout: Number
		//		Number of milliseconds before a held arrow key or up/down button becomes typematic
		defaultTimeout: 500,

		// minimumTimeout: Number
		//		minimum number of milliseconds that typematic event fires when held key or button is held
		minimumTimeout: 10,

		// timeoutChangeRate: Number
		//		Fraction of time used to change the typematic timer between events.
		//		1.0 means that each typematic event fires at defaultTimeout intervals.
		//		< 1.0 means that each typematic event fires at an increasing faster rate.
		timeoutChangeRate: 0.90,

		// smallDelta: Number
		//		Adjust the value by this much when spinning using the arrow keys/buttons
		smallDelta: 1,

		// largeDelta: Number
		//		Adjust the value by this much when spinning using the PgUp/Dn keys
		largeDelta: 10,

		templateString: template,

		baseClass: "dijitTextBox dijitSpinner",

		// Set classes like dijitUpArrowButtonHover or dijitDownArrowButtonActive depending on
		// mouse action over specified node
		cssStateNodes: {
			"upArrowNode": "dijitUpArrowButton",
			"downArrowNode": "dijitDownArrowButton"
		},

		adjust: function(val /*=====, delta =====*/){
			// summary:
			//		Overridable function used to adjust a primitive value(Number/Date/...) by the delta amount specified.
			// 		The val is adjusted in a way that makes sense to the object type.
			// val: Object
			// delta: Number
			// tags:
			//		protected extension
			return val;
		},

		_arrowPressed: function(/*Node*/ nodePressed, /*Number*/ direction, /*Number*/ increment){
			// summary:
			//		Handler for arrow button or arrow key being pressed
			if(this.disabled || this.readOnly){ return; }
			this._setValueAttr(this.adjust(this.get('value'), direction*increment), false);
			_TextBoxMixin.selectInputText(this.textbox, this.textbox.value.length);
		},

		_arrowReleased: function(/*Node*/ /*===== node =====*/){
			// summary:
			//		Handler for arrow button or arrow key being released
			this._wheelTimer = null;
		},

		_typematicCallback: function(/*Number*/ count, /*DOMNode*/ node, /*Event*/ evt){
			var inc=this.smallDelta;
			if(node == this.textbox){
				var key = evt.charOrCode;
				inc = (key == keys.PAGE_UP || key == keys.PAGE_DOWN) ? this.largeDelta : this.smallDelta;
				node = (key == keys.UP_ARROW || key == keys.PAGE_UP) ? this.upArrowNode : this.downArrowNode;
			}
			if(count == -1){ this._arrowReleased(node); }
			else{ this._arrowPressed(node, (node == this.upArrowNode) ? 1 : -1, inc); }
		},

		_wheelTimer: null,
		_mouseWheeled: function(/*Event*/ evt){
			// summary:
			//		Mouse wheel listener where supported

			event.stop(evt);
			// FIXME: Safari bubbles

			// be nice to DOH and scroll as much as the event says to
			var wheelDelta = evt.wheelDelta / 120;
			if(Math.floor(wheelDelta) != wheelDelta){
				// If not an int multiple of 120, then its touchpad scrolling.
				// This can change very fast so just assume 1 wheel click to make it more manageable.
				wheelDelta = evt.wheelDelta > 0 ? 1 : -1;
			}
			var scrollAmount = evt.detail ? (evt.detail * -1) : wheelDelta;
			if(scrollAmount !== 0){
				var node = this[(scrollAmount > 0 ? "upArrowNode" : "downArrowNode" )];

				this._arrowPressed(node, scrollAmount, this.smallDelta);

				if(!this._wheelTimer){
					clearTimeout(this._wheelTimer);
				}
				this._wheelTimer = setTimeout(lang.hitch(this,"_arrowReleased",node), 50);
			}

		},

		postCreate: function(){
			this.inherited(arguments);

			// extra listeners
			this.connect(this.domNode, !has("mozilla") ? "onmousewheel" : 'DOMMouseScroll', "_mouseWheeled");
			this._connects.push(typematic.addListener(this.upArrowNode, this.textbox, {charOrCode:keys.UP_ARROW,ctrlKey:false,altKey:false,shiftKey:false,metaKey:false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout, this.minimumTimeout));
			this._connects.push(typematic.addListener(this.downArrowNode, this.textbox, {charOrCode:keys.DOWN_ARROW,ctrlKey:false,altKey:false,shiftKey:false,metaKey:false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout, this.minimumTimeout));
			this._connects.push(typematic.addListener(this.upArrowNode, this.textbox, {charOrCode:keys.PAGE_UP,ctrlKey:false,altKey:false,shiftKey:false,metaKey:false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout, this.minimumTimeout));
			this._connects.push(typematic.addListener(this.downArrowNode, this.textbox, {charOrCode:keys.PAGE_DOWN,ctrlKey:false,altKey:false,shiftKey:false,metaKey:false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout, this.minimumTimeout));
		}
	});
});

},
'dojo/store/Memory':function(){
define(["../_base/declare", "./util/QueryResults", "./util/SimpleQueryEngine"], function(declare, QueryResults, SimpleQueryEngine) {
  //  module:
  //    dojo/store/Memory
  //  summary:
  //    The module defines an in-memory object store.


return declare("dojo.store.Memory", null, {
	// summary:
	//		This is a basic in-memory object store. It implements dojo.store.api.Store.
	constructor: function(/*dojo.store.Memory*/ options){
		// summary:
		//		Creates a memory object store.
		// options:
		//		This provides any configuration information that will be mixed into the store.
		// 		This should generally include the data property to provide the starting set of data.
		for(var i in options){
			this[i] = options[i];
		}
		this.setData(this.data || []);
	},
	// data: Array
	//		The array of all the objects in the memory store
	data:null,

	// idProperty: String
	//		Indicates the property to use as the identity property. The values of this
	//		property should be unique.
	idProperty: "id",

	// index: Object
	//		An index of data indices into the data array by id
	index:null,

	// queryEngine: Function
	//		Defines the query engine to use for querying the data store
	queryEngine: SimpleQueryEngine,
	get: function(id){
		//	summary:
		//		Retrieves an object by its identity
		//	id: Number
		//		The identity to use to lookup the object
		//	returns: Object
		//		The object in the store that matches the given id.
		return this.data[this.index[id]];
	},
	getIdentity: function(object){
		// 	summary:
		//		Returns an object's identity
		// 	object: Object
		//		The object to get the identity from
		//	returns: Number
		return object[this.idProperty];
	},
	put: function(object, options){
		// 	summary:
		//		Stores an object
		// 	object: Object
		//		The object to store.
		// 	options: dojo.store.api.Store.PutDirectives??
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		//	returns: Number
		var data = this.data,
			index = this.index,
			idProperty = this.idProperty;
		var id = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
		if(id in index){
			// object exists
			if(options && options.overwrite === false){
				throw new Error("Object already exists");
			}
			// replace the entry in data
			data[index[id]] = object;
		}else{
			// add the new object
			index[id] = data.push(object) - 1;
		}
		return id;
	},
	add: function(object, options){
		// 	summary:
		//		Creates an object, throws an error if the object already exists
		// 	object: Object
		//		The object to store.
		// 	options: dojo.store.api.Store.PutDirectives??
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		//	returns: Number
		(options = options || {}).overwrite = false;
		// call put with overwrite being false
		return this.put(object, options);
	},
	remove: function(id){
		// 	summary:
		//		Deletes an object by its identity
		// 	id: Number
		//		The identity to use to delete the object
		// returns: Boolean
		// 		Returns true if an object was removed, falsy (undefined) if no object matched the id
		var index = this.index;
		var data = this.data;
		if(id in index){
			data.splice(index[id], 1);
			// now we have to reindex
			this.setData(data);
			return true;
		}
	},
	query: function(query, options){
		// 	summary:
		//		Queries the store for objects.
		// 	query: Object
		//		The query to use for retrieving objects from the store.
		//	options: dojo.store.api.Store.QueryOptions?
		//		The optional arguments to apply to the resultset.
		//	returns: dojo.store.api.Store.QueryResults
		//		The results of the query, extended with iterative methods.
		//
		// 	example:
		// 		Given the following store:
		//
		// 	|	var store = new dojo.store.Memory({
		// 	|		data: [
		// 	|			{id: 1, name: "one", prime: false },
		//	|			{id: 2, name: "two", even: true, prime: true},
		//	|			{id: 3, name: "three", prime: true},
		//	|			{id: 4, name: "four", even: true, prime: false},
		//	|			{id: 5, name: "five", prime: true}
		//	|		]
		//	|	});
		//
		//	...find all items where "prime" is true:
		//
		//	|	var results = store.query({ prime: true });
		//
		//	...or find all items where "even" is true:
		//
		//	|	var results = store.query({ even: true });
		return QueryResults(this.queryEngine(query, options)(this.data));
	},
	setData: function(data){
		// 	summary:
		//		Sets the given data as the source for this store, and indexes it
		//	data: Object[]
		//		An array of objects to use as the source of data.
		if(data.items){
			// just for convenience with the data format IFRS expects
			this.idProperty = data.identifier;
			data = this.data = data.items;
		}else{
			this.data = data;
		}
		this.index = {};
		for(var i = 0, l = data.length; i < l; i++){
			this.index[data[i][this.idProperty]] = i;
		}
	}
});

});

},
'url:dijit/templates/Tooltip.html':"<div class=\"dijitTooltip dijitTooltipLeft\" id=\"dojoTooltip\"\r\n\t><div class=\"dijitTooltipContainer dijitTooltipContents\" data-dojo-attach-point=\"containerNode\" role='alert'></div\r\n\t><div class=\"dijitTooltipConnector\" data-dojo-attach-point=\"connectorNode\"></div\r\n></div>\r\n",
'dijit/Editor':function(){
define("dijit/Editor", [
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/Deferred", // Deferred
	"dojo/i18n", // i18n.getLocalization
	"dojo/dom-attr", // domAttr.set
	"dojo/dom-class", // domClass.add
	"dojo/dom-geometry",
	"dojo/dom-style", // domStyle.set, get
	"dojo/_base/event", // event.stop
	"dojo/keys", // keys.F1 keys.F15 keys.TAB
	"dojo/_base/lang", // lang.getObject lang.hitch
	"dojo/_base/sniff", // has("ie") has("mac") has("webkit")
	"dojo/string", // string.substitute
	"dojo/topic", // topic.publish()
	"dojo/_base/window", // win.withGlobal
	"./_base/focus",	// dijit.getBookmark()
	"./_Container",
	"./Toolbar",
	"./ToolbarSeparator",
	"./layout/_LayoutWidget",
	"./form/ToggleButton",
	"./_editor/_Plugin",
	"./_editor/plugins/EnterKeyHandling",
	"./_editor/html",
	"./_editor/range",
	"./_editor/RichText",
	".",	// dijit._scopeName
	"dojo/i18n!./_editor/nls/commands"
], function(array, declare, Deferred, i18n, domAttr, domClass, domGeometry, domStyle,
			event, keys, lang, has, string, topic, win,
			focusBase, _Container, Toolbar, ToolbarSeparator, _LayoutWidget, ToggleButton,
			_Plugin, EnterKeyHandling, html, rangeapi, RichText, dijit){

	// module:
	//		dijit/Editor
	// summary:
	//		A rich text Editing widget

	var Editor = declare("dijit.Editor", RichText, {
		// summary:
		//		A rich text Editing widget
		//
		// description:
		//		This widget provides basic WYSIWYG editing features, based on the browser's
		//		underlying rich text editing capability, accompanied by a toolbar (`dijit.Toolbar`).
		//		A plugin model is available to extend the editor's capabilities as well as the
		//		the options available in the toolbar.  Content generation may vary across
		//		browsers, and clipboard operations may have different results, to name
		//		a few limitations.  Note: this widget should not be used with the HTML
		//		&lt;TEXTAREA&gt; tag -- see dijit._editor.RichText for details.

		// plugins: [const] Object[]
		//		A list of plugin names (as strings) or instances (as objects)
		//		for this widget.
		//
		//		When declared in markup, it might look like:
		//	|	plugins="['bold',{name:'dijit._editor.plugins.FontChoice', command:'fontName', generic:true}]"
		plugins: null,

		// extraPlugins: [const] Object[]
		//		A list of extra plugin names which will be appended to plugins array
		extraPlugins: null,

		constructor: function(){
			// summary:
			//		Runs on widget initialization to setup arrays etc.
			// tags:
			//		private

			if(!lang.isArray(this.plugins)){
				this.plugins=["undo","redo","|","cut","copy","paste","|","bold","italic","underline","strikethrough","|",
				"insertOrderedList","insertUnorderedList","indent","outdent","|","justifyLeft","justifyRight","justifyCenter","justifyFull",
				EnterKeyHandling /*, "createLink"*/];
			}

			this._plugins=[];
			this._editInterval = this.editActionInterval * 1000;

			//IE will always lose focus when other element gets focus, while for FF and safari,
			//when no iframe is used, focus will be lost whenever another element gets focus.
			//For IE, we can connect to onBeforeDeactivate, which will be called right before
			//the focus is lost, so we can obtain the selected range. For other browsers,
			//no equivalent of onBeforeDeactivate, so we need to do two things to make sure
			//selection is properly saved before focus is lost: 1) when user clicks another
			//element in the page, in which case we listen to mousedown on the entire page and
			//see whether user clicks out of a focus editor, if so, save selection (focus will
			//only lost after onmousedown event is fired, so we can obtain correct caret pos.)
			//2) when user tabs away from the editor, which is handled in onKeyDown below.
			if(has("ie")){
				this.events.push("onBeforeDeactivate");
				this.events.push("onBeforeActivate");
			}
		},

		postMixInProperties: function(){
			// summary:
			//	Extension to make sure a deferred is in place before certain functions
			//	execute, like making sure all the plugins are properly inserted.

			// Set up a deferred so that the value isn't applied to the editor
			// until all the plugins load, needed to avoid timing condition
			// reported in #10537.
			this.setValueDeferred = new Deferred();
			this.inherited(arguments);
		},

		postCreate: function(){
			//for custom undo/redo, if enabled.
			this._steps=this._steps.slice(0);
			this._undoedSteps=this._undoedSteps.slice(0);

			if(lang.isArray(this.extraPlugins)){
				this.plugins=this.plugins.concat(this.extraPlugins);
			}

			this.inherited(arguments);

			this.commands = i18n.getLocalization("dijit._editor", "commands", this.lang);

			if(!this.toolbar){
				// if we haven't been assigned a toolbar, create one
				this.toolbar = new Toolbar({
					dir: this.dir,
					lang: this.lang
				});
				this.header.appendChild(this.toolbar.domNode);
			}

			array.forEach(this.plugins, this.addPlugin, this);

			// Okay, denote the value can now be set.
			this.setValueDeferred.callback(true);

			domClass.add(this.iframe.parentNode, "dijitEditorIFrameContainer");
			domClass.add(this.iframe, "dijitEditorIFrame");
			domAttr.set(this.iframe, "allowTransparency", true);

			if(has("webkit")){
				// Disable selecting the entire editor by inadvertent double-clicks.
				// on buttons, title bar, etc.  Otherwise clicking too fast on
				// a button such as undo/redo selects the entire editor.
				domStyle.set(this.domNode, "KhtmlUserSelect", "none");
			}
			this.toolbar.startup();
			this.onNormalizedDisplayChanged(); //update toolbar button status
		},
		destroy: function(){
			array.forEach(this._plugins, function(p){
				if(p && p.destroy){
					p.destroy();
				}
			});
			this._plugins=[];
			this.toolbar.destroyRecursive();
			delete this.toolbar;
			this.inherited(arguments);
		},
		addPlugin: function(/*String||Object||Function*/plugin, /*Integer?*/index){
			// summary:
			//		takes a plugin name as a string or a plugin instance and
			//		adds it to the toolbar and associates it with this editor
			//		instance. The resulting plugin is added to the Editor's
			//		plugins array. If index is passed, it's placed in the plugins
			//		array at that index. No big magic, but a nice helper for
			//		passing in plugin names via markup.
			//
			// plugin: String, args object, plugin instance, or plugin constructor
			//
			// args:
			//		This object will be passed to the plugin constructor
			//
			// index: Integer
			//		Used when creating an instance from
			//		something already in this.plugins. Ensures that the new
			//		instance is assigned to this.plugins at that index.
			var args=lang.isString(plugin)?{name:plugin}:lang.isFunction(plugin)?{ctor:plugin}:plugin;
			if(!args.setEditor){
				var o={"args":args,"plugin":null,"editor":this};
				if(args.name){
					// search registry for a plugin factory matching args.name, if it's not there then
					// fallback to 1.0 API:
					// ask all loaded plugin modules to fill in o.plugin if they can (ie, if they implement args.name)
					// remove fallback for 2.0.
					if(_Plugin.registry[args.name]){
						o.plugin = _Plugin.registry[args.name](args);
					}else{
						topic.publish(dijit._scopeName + ".Editor.getPlugin", o);	// publish
					}
				}
				if(!o.plugin){
					var pc = args.ctor || lang.getObject(args.name);
					if(pc){
						o.plugin=new pc(args);
					}
				}
				if(!o.plugin){
					console.warn('Cannot find plugin',plugin);
					return;
				}
				plugin=o.plugin;
			}
			if(arguments.length > 1){
				this._plugins[index] = plugin;
			}else{
				this._plugins.push(plugin);
			}
			plugin.setEditor(this);
			if(lang.isFunction(plugin.setToolbar)){
				plugin.setToolbar(this.toolbar);
			}
		},

		//the following 2 functions are required to make the editor play nice under a layout widget, see #4070

		resize: function(size){
			// summary:
			//		Resize the editor to the specified size, see `dijit.layout._LayoutWidget.resize`
			if(size){
				// we've been given a height/width for the entire editor (toolbar + contents), calls layout()
				// to split the allocated size between the toolbar and the contents
				_LayoutWidget.prototype.resize.apply(this, arguments);
			}
			/*
			else{
				// do nothing, the editor is already laid out correctly.   The user has probably specified
				// the height parameter, which was used to set a size on the iframe
			}
			*/
		},
		layout: function(){
			// summary:
			//		Called from `dijit.layout._LayoutWidget.resize`.  This shouldn't be called directly
			// tags:
			//		protected

			// Converts the iframe (or rather the <div> surrounding it) to take all the available space
			// except what's needed for the header (toolbars) and footer (breadcrumbs, etc).
			// A class was added to the iframe container and some themes style it, so we have to
			// calc off the added margins and padding too. See tracker: #10662
			var areaHeight = (this._contentBox.h -
				(this.getHeaderHeight() + this.getFooterHeight() +
				 domGeometry.getPadBorderExtents(this.iframe.parentNode).h +
				 domGeometry.getMarginExtents(this.iframe.parentNode).h));
			this.editingArea.style.height = areaHeight + "px";
			if(this.iframe){
				this.iframe.style.height="100%";
			}
			this._layoutMode = true;
		},

		_onIEMouseDown: function(/*Event*/ e){
			// summary:
			//		IE only to prevent 2 clicks to focus
			// tags:
			//		private
			var outsideClientArea;
			// IE 8's componentFromPoint is broken, which is a shame since it
			// was smaller code, but oh well.  We have to do this brute force
			// to detect if the click was scroller or not.
			var b = this.document.body;
			var clientWidth = b.clientWidth;
			var clientHeight = b.clientHeight;
			var clientLeft = b.clientLeft;
			var offsetWidth = b.offsetWidth;
			var offsetHeight = b.offsetHeight;
			var offsetLeft = b.offsetLeft;

			//Check for vertical scroller click.
			if(/^rtl$/i.test(b.dir || "")){
				if(clientWidth < offsetWidth && e.x > clientWidth && e.x < offsetWidth){
					// Check the click was between width and offset width, if so, scroller
					outsideClientArea = true;
				}
			}else{
				// RTL mode, we have to go by the left offsets.
				if(e.x < clientLeft && e.x > offsetLeft){
					// Check the click was between width and offset width, if so, scroller
					outsideClientArea = true;
				}
			}
			if(!outsideClientArea){
				// Okay, might be horiz scroller, check that.
				if(clientHeight < offsetHeight && e.y > clientHeight && e.y < offsetHeight){
					// Horizontal scroller.
					outsideClientArea = true;
				}
			}
			if(!outsideClientArea){
				delete this._cursorToStart; // Remove the force to cursor to start position.
				delete this._savedSelection; // new mouse position overrides old selection
				if(e.target.tagName == "BODY"){
					setTimeout(lang.hitch(this, "placeCursorAtEnd"), 0);
				}
				this.inherited(arguments);
			}
		},
		onBeforeActivate: function(){
			this._restoreSelection();
		},
		onBeforeDeactivate: function(e){
			// summary:
			//		Called on IE right before focus is lost.   Saves the selected range.
			// tags:
			//		private
			if(this.customUndo){
				this.endEditing(true);
			}
			//in IE, the selection will be lost when other elements get focus,
			//let's save focus before the editor is deactivated
			if(e.target.tagName != "BODY"){
				this._saveSelection();
			}
			//console.log('onBeforeDeactivate',this);
		},

		/* beginning of custom undo/redo support */

		// customUndo: Boolean
		//		Whether we shall use custom undo/redo support instead of the native
		//		browser support. By default, we now use custom undo.  It works better
		//		than native browser support and provides a consistent behavior across
		//		browsers with a minimal performance hit.  We already had the hit on
		//		the slowest browser, IE, anyway.
		customUndo: true,

		// editActionInterval: Integer
		//		When using customUndo, not every keystroke will be saved as a step.
		//		Instead typing (including delete) will be grouped together: after
		//		a user stops typing for editActionInterval seconds, a step will be
		//		saved; if a user resume typing within editActionInterval seconds,
		//		the timeout will be restarted. By default, editActionInterval is 3
		//		seconds.
		editActionInterval: 3,

		beginEditing: function(cmd){
			// summary:
			//		Called to note that the user has started typing alphanumeric characters, if it's not already noted.
			//		Deals with saving undo; see editActionInterval parameter.
			// tags:
			//		private
			if(!this._inEditing){
				this._inEditing=true;
				this._beginEditing(cmd);
			}
			if(this.editActionInterval>0){
				if(this._editTimer){
					clearTimeout(this._editTimer);
				}
				this._editTimer = setTimeout(lang.hitch(this, this.endEditing), this._editInterval);
			}
		},

		// TODO: declaring these in the prototype is meaningless, just create in the constructor/postCreate
		_steps:[],
		_undoedSteps:[],

		execCommand: function(cmd){
			// summary:
			//		Main handler for executing any commands to the editor, like paste, bold, etc.
			//      Called by plugins, but not meant to be called by end users.
			// tags:
			//		protected
			if(this.customUndo && (cmd == 'undo' || cmd == 'redo')){
				return this[cmd]();
			}else{
				if(this.customUndo){
					this.endEditing();
					this._beginEditing();
				}
				var r = this.inherited(arguments);
				if(this.customUndo){
					this._endEditing();
				}
				return r;
			}
		},

		_pasteImpl: function(){
			// summary:
			//		Over-ride of paste command control to make execCommand cleaner
			// tags:
			//		Protected
			return this._clipboardCommand("paste");
		},

		_cutImpl: function(){
			// summary:
			//		Over-ride of cut command control to make execCommand cleaner
			// tags:
			//		Protected
			return this._clipboardCommand("cut");
		},

		_copyImpl: function(){
			// summary:
			//		Over-ride of copy command control to make execCommand cleaner
			// tags:
			//		Protected
			return this._clipboardCommand("copy");
		},

		_clipboardCommand: function(cmd){
			// summary:
			//		Function to handle processing clipboard commands (or at least try to).
			// tags:
			//		Private
			var r;
			try{
				// Try to exec the superclass exec-command and see if it works.
				r = this.document.execCommand(cmd, false, null);
				if(has("webkit") && !r){ //see #4598: webkit does not guarantee clipboard support from js
					throw { code: 1011 }; // throw an object like Mozilla's error
				}
			}catch(e){
				//TODO: when else might we get an exception?  Do we need the Mozilla test below?
				if(e.code == 1011 /* Mozilla: service denied */){
					// Warn user of platform limitation.  Cannot programmatically access clipboard. See ticket #4136
					var sub = string.substitute,
						accel = {cut:'X', copy:'C', paste:'V'};
					alert(sub(this.commands.systemShortcut,
						[this.commands[cmd], sub(this.commands[has("mac") ? 'appleKey' : 'ctrlKey'], [accel[cmd]])]));
				}
				r = false;
			}
			return r;
		},

		queryCommandEnabled: function(cmd){
			// summary:
			//		Returns true if specified editor command is enabled.
			//      Used by the plugins to know when to highlight/not highlight buttons.
			// tags:
			//		protected
			if(this.customUndo && (cmd == 'undo' || cmd == 'redo')){
				return cmd == 'undo' ? (this._steps.length > 1) : (this._undoedSteps.length > 0);
			}else{
				return this.inherited(arguments);
			}
		},
		_moveToBookmark: function(b){
			// summary:
			//		Selects the text specified in bookmark b
			// tags:
			//		private
			var bookmark = b.mark;
			var mark = b.mark;
			var col = b.isCollapsed;
			var r, sNode, eNode, sel;
			if(mark){
				if(has("ie") < 9){
					if(lang.isArray(mark)){
						//IE CONTROL, have to use the native bookmark.
						bookmark = [];
						array.forEach(mark,function(n){
							bookmark.push(rangeapi.getNode(n,this.editNode));
						},this);
						win.withGlobal(this.window,'moveToBookmark',dijit,[{mark: bookmark, isCollapsed: col}]);
					}else{
						if(mark.startContainer && mark.endContainer){
							// Use the pseudo WC3 range API.  This works better for positions
							// than the IE native bookmark code.
							sel = rangeapi.getSelection(this.window);
							if(sel && sel.removeAllRanges){
								sel.removeAllRanges();
								r = rangeapi.create(this.window);
								sNode = rangeapi.getNode(mark.startContainer,this.editNode);
								eNode = rangeapi.getNode(mark.endContainer,this.editNode);
								if(sNode && eNode){
									// Okay, we believe we found the position, so add it into the selection
									// There are cases where it may not be found, particularly in undo/redo, when
									// IE changes the underlying DOM on us (wraps text in a <p> tag or similar.
									// So, in those cases, don't bother restoring selection.
									r.setStart(sNode,mark.startOffset);
									r.setEnd(eNode,mark.endOffset);
									sel.addRange(r);
								}
							}
						}
					}
				}else{//w3c range
					sel = rangeapi.getSelection(this.window);
					if(sel && sel.removeAllRanges){
						sel.removeAllRanges();
						r = rangeapi.create(this.window);
						sNode = rangeapi.getNode(mark.startContainer,this.editNode);
						eNode = rangeapi.getNode(mark.endContainer,this.editNode);
						if(sNode && eNode){
							// Okay, we believe we found the position, so add it into the selection
							// There are cases where it may not be found, particularly in undo/redo, when
							// formatting as been done and so on, so don't restore selection then.
							r.setStart(sNode,mark.startOffset);
							r.setEnd(eNode,mark.endOffset);
							sel.addRange(r);
						}
					}
				}
			}
		},
		_changeToStep: function(from, to){
			// summary:
			//		Reverts editor to "to" setting, from the undo stack.
			// tags:
			//		private
			this.setValue(to.text);
			var b=to.bookmark;
			if(!b){ return; }
			this._moveToBookmark(b);
		},
		undo: function(){
			// summary:
			//		Handler for editor undo (ex: ctrl-z) operation
			// tags:
			//		private
			//console.log('undo');
			var ret = false;
			if(!this._undoRedoActive){
				this._undoRedoActive = true;
				this.endEditing(true);
				var s=this._steps.pop();
				if(s && this._steps.length>0){
					this.focus();
					this._changeToStep(s,this._steps[this._steps.length-1]);
					this._undoedSteps.push(s);
					this.onDisplayChanged();
					delete this._undoRedoActive;
					ret = true;
				}
				delete this._undoRedoActive;
			}
			return ret;
		},
		redo: function(){
			// summary:
			//		Handler for editor redo (ex: ctrl-y) operation
			// tags:
			//		private
			//console.log('redo');
			var ret = false;
			if(!this._undoRedoActive){
				this._undoRedoActive = true;
				this.endEditing(true);
				var s=this._undoedSteps.pop();
				if(s && this._steps.length>0){
					this.focus();
					this._changeToStep(this._steps[this._steps.length-1],s);
					this._steps.push(s);
					this.onDisplayChanged();
					ret = true;
				}
				delete this._undoRedoActive;
			}
			return ret;
		},
		endEditing: function(ignore_caret){
			// summary:
			//		Called to note that the user has stopped typing alphanumeric characters, if it's not already noted.
			//		Deals with saving undo; see editActionInterval parameter.
			// tags:
			//		private
			if(this._editTimer){
				clearTimeout(this._editTimer);
			}
			if(this._inEditing){
				this._endEditing(ignore_caret);
				this._inEditing=false;
			}
		},

		_getBookmark: function(){
			// summary:
			//		Get the currently selected text
			// tags:
			//		protected
			var b=win.withGlobal(this.window,focusBase.getBookmark);
			var tmp=[];
			if(b && b.mark){
				var mark = b.mark;
				if(has("ie") < 9){
					// Try to use the pseudo range API on IE for better accuracy.
					var sel = rangeapi.getSelection(this.window);
					if(!lang.isArray(mark)){
						if(sel){
							var range;
							if(sel.rangeCount){
								range = sel.getRangeAt(0);
							}
							if(range){
								b.mark = range.cloneRange();
							}else{
								b.mark = win.withGlobal(this.window,focusBase.getBookmark);
							}
						}
					}else{
						// Control ranges (img, table, etc), handle differently.
						array.forEach(b.mark,function(n){
							tmp.push(rangeapi.getIndex(n,this.editNode).o);
						},this);
						b.mark = tmp;
					}
				}
				try{
					if(b.mark && b.mark.startContainer){
						tmp=rangeapi.getIndex(b.mark.startContainer,this.editNode).o;
						b.mark={startContainer:tmp,
							startOffset:b.mark.startOffset,
							endContainer:b.mark.endContainer===b.mark.startContainer?tmp:rangeapi.getIndex(b.mark.endContainer,this.editNode).o,
							endOffset:b.mark.endOffset};
					}
				}catch(e){
					b.mark = null;
				}
			}
			return b;
		},
		_beginEditing: function(){
			// summary:
			//		Called when the user starts typing alphanumeric characters.
			//		Deals with saving undo; see editActionInterval parameter.
			// tags:
			//		private
			if(this._steps.length === 0){
				// You want to use the editor content without post filtering
				// to make sure selection restores right for the 'initial' state.
				// and undo is called.  So not using this.value, as it was 'processed'
				// and the line-up for selections may have been altered.
				this._steps.push({'text':html.getChildrenHtml(this.editNode),'bookmark':this._getBookmark()});
			}
		},
		_endEditing: function(){
			// summary:
			//		Called when the user stops typing alphanumeric characters.
			//		Deals with saving undo; see editActionInterval parameter.
			// tags:
			//		private
			// Avoid filtering to make sure selections restore.
			var v = html.getChildrenHtml(this.editNode);

			this._undoedSteps=[];//clear undoed steps
			this._steps.push({text: v, bookmark: this._getBookmark()});
		},
		onKeyDown: function(e){
			// summary:
			//		Handler for onkeydown event.
			// tags:
			//		private

			//We need to save selection if the user TAB away from this editor
			//no need to call _saveSelection for IE, as that will be taken care of in onBeforeDeactivate
			if(!has("ie") && !this.iframe && e.keyCode == keys.TAB && !this.tabIndent){
				this._saveSelection();
			}
			if(!this.customUndo){
				this.inherited(arguments);
				return;
			}
			var k = e.keyCode;
			if(e.ctrlKey && !e.altKey){//undo and redo only if the special right Alt + z/y are not pressed #5892
				if(k == 90 || k == 122){ //z
					event.stop(e);
					this.undo();
					return;
				}else if(k == 89 || k == 121){ //y
					event.stop(e);
					this.redo();
					return;
				}
			}
			this.inherited(arguments);

			switch(k){
					case keys.ENTER:
					case keys.BACKSPACE:
					case keys.DELETE:
						this.beginEditing();
						break;
					case 88: //x
					case 86: //v
						if(e.ctrlKey && !e.altKey && !e.metaKey){
							this.endEditing();//end current typing step if any
							if(e.keyCode == 88){
								this.beginEditing('cut');
								//use timeout to trigger after the cut is complete
								setTimeout(lang.hitch(this, this.endEditing), 1);
							}else{
								this.beginEditing('paste');
								//use timeout to trigger after the paste is complete
								setTimeout(lang.hitch(this, this.endEditing), 1);
							}
							break;
						}
						//pass through
					default:
						if(!e.ctrlKey && !e.altKey && !e.metaKey && (e.keyCode<keys.F1 || e.keyCode>keys.F15)){
							this.beginEditing();
							break;
						}
						//pass through
					case keys.ALT:
						this.endEditing();
						break;
					case keys.UP_ARROW:
					case keys.DOWN_ARROW:
					case keys.LEFT_ARROW:
					case keys.RIGHT_ARROW:
					case keys.HOME:
					case keys.END:
					case keys.PAGE_UP:
					case keys.PAGE_DOWN:
						this.endEditing(true);
						break;
					//maybe ctrl+backspace/delete, so don't endEditing when ctrl is pressed
					case keys.CTRL:
					case keys.SHIFT:
					case keys.TAB:
						break;
				}
		},
		_onBlur: function(){
			// summary:
			//		Called from focus manager when focus has moved away from this editor
			// tags:
			//		protected

			//this._saveSelection();
			this.inherited(arguments);
			this.endEditing(true);
		},
		_saveSelection: function(){
			// summary:
			//		Save the currently selected text in _savedSelection attribute
			// tags:
			//		private
			try{
				this._savedSelection=this._getBookmark();
			}catch(e){ /* Squelch any errors that occur if selection save occurs due to being hidden simultaneously. */}
		},
		_restoreSelection: function(){
			// summary:
			//		Re-select the text specified in _savedSelection attribute;
			//		see _saveSelection().
			// tags:
			//		private
			if(this._savedSelection){
				// Clear off cursor to start, we're deliberately going to a selection.
				delete this._cursorToStart;
				// only restore the selection if the current range is collapsed
				// if not collapsed, then it means the editor does not lose
				// selection and there is no need to restore it
				if(win.withGlobal(this.window,'isCollapsed',dijit)){
					this._moveToBookmark(this._savedSelection);
				}
				delete this._savedSelection;
			}
		},

		onClick: function(){
			// summary:
			//		Handler for when editor is clicked
			// tags:
			//		protected
			this.endEditing(true);
			this.inherited(arguments);
		},

		replaceValue: function(/*String*/ html){
			// summary:
			//		over-ride of replaceValue to support custom undo and stack maintenance.
			// tags:
			//		protected
			if(!this.customUndo){
				this.inherited(arguments);
			}else{
				if(this.isClosed){
					this.setValue(html);
				}else{
					this.beginEditing();
					if(!html){
						html = "&#160;";	// &nbsp;
					}
					this.setValue(html);
					this.endEditing();
				}
			}
		},

		_setDisabledAttr: function(/*Boolean*/ value){
			var disableFunc = lang.hitch(this, function(){
				if((!this.disabled && value) || (!this._buttonEnabledPlugins && value)){
				// Disable editor: disable all enabled buttons and remember that list
					array.forEach(this._plugins, function(p){
						p.set("disabled", true);
				});
			}else if(this.disabled && !value){
					// Restore plugins to being active.
					array.forEach(this._plugins, function(p){
						p.set("disabled", false);
				});
			}
			});
			this.setValueDeferred.addCallback(disableFunc);
			this.inherited(arguments);
		},

		_setStateClass: function(){
			try{
				this.inherited(arguments);

				// Let theme set the editor's text color based on editor enabled/disabled state.
				// We need to jump through hoops because the main document (where the theme CSS is)
				// is separate from the iframe's document.
				if(this.document && this.document.body){
					domStyle.set(this.document.body, "color", domStyle.get(this.iframe, "color"));
				}
			}catch(e){ /* Squelch any errors caused by focus change if hidden during a state change */}
		}
	});

	// Register the "default plugins", ie, the built-in editor commands
	function simplePluginFactory(args){
		return new _Plugin({ command: args.name });
	}
	function togglePluginFactory(args){
		return new _Plugin({ buttonClass: ToggleButton, command: args.name });
	}
	lang.mixin(_Plugin.registry, {
		"undo": simplePluginFactory,
		"redo": simplePluginFactory,
		"cut": simplePluginFactory,
		"copy": simplePluginFactory,
		"paste": simplePluginFactory,
		"insertOrderedList": simplePluginFactory,
		"insertUnorderedList": simplePluginFactory,
		"indent": simplePluginFactory,
		"outdent": simplePluginFactory,
		"justifyCenter": simplePluginFactory,
		"justifyFull": simplePluginFactory,
		"justifyLeft": simplePluginFactory,
		"justifyRight": simplePluginFactory,
		"delete": simplePluginFactory,
		"selectAll": simplePluginFactory,
		"removeFormat": simplePluginFactory,
		"unlink": simplePluginFactory,
		"insertHorizontalRule": simplePluginFactory,

		"bold": togglePluginFactory,
		"italic": togglePluginFactory,
		"underline": togglePluginFactory,
		"strikethrough": togglePluginFactory,
		"subscript": togglePluginFactory,
		"superscript": togglePluginFactory,

		"|": function(){
			return new _Plugin({ button: new ToolbarSeparator(), setEditor: function(editor){this.editor = editor;}});
		}
	});

	return Editor;
});

},
'dijit/Toolbar':function(){
define("dijit/Toolbar", [
	"require",
	"dojo/_base/declare", // declare
	"dojo/_base/kernel",
	"dojo/keys", // keys.LEFT_ARROW keys.RIGHT_ARROW
	"dojo/ready",
	"./_Widget",
	"./_KeyNavContainer",
	"./_TemplatedMixin"
], function(require, declare, kernel, keys, ready, _Widget, _KeyNavContainer, _TemplatedMixin){

/*=====
	var _Widget = dijit._Widget;
	var _KeyNavContainer = dijit._KeyNavContainer;
	var _TemplatedMixin = dijit._TemplatedMixin;
=====*/

	// module:
	//		dijit/Toolbar
	// summary:
	//		A Toolbar widget, used to hold things like `dijit.Editor` buttons


	// Back compat w/1.6, remove for 2.0
	if(!kernel.isAsync){
		ready(0, function(){
			var requires = ["dijit/ToolbarSeparator"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	return declare("dijit.Toolbar", [_Widget, _TemplatedMixin, _KeyNavContainer], {
		// summary:
		//		A Toolbar widget, used to hold things like `dijit.Editor` buttons

		templateString:
			'<div class="dijit" role="toolbar" tabIndex="${tabIndex}" data-dojo-attach-point="containerNode">' +
			'</div>',

		baseClass: "dijitToolbar",

		postCreate: function(){
			this.inherited(arguments);

			this.connectKeyNavHandlers(
				this.isLeftToRight() ? [keys.LEFT_ARROW] : [keys.RIGHT_ARROW],
				this.isLeftToRight() ? [keys.RIGHT_ARROW] : [keys.LEFT_ARROW]
			);
		}
	});
});

},
'dijit/_editor/plugins/LinkDialog':function(){
define("dijit/_editor/plugins/LinkDialog", [
	"require",
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.get
	"dojo/keys", // keys.ENTER
	"dojo/_base/lang", // lang.delegate lang.hitch lang.trim
	"dojo/_base/sniff", // has("ie")
	"dojo/string", // string.substitute
	"dojo/_base/window", // win.withGlobal
	"../../_Widget",
	"../_Plugin",
	"../../form/DropDownButton",
	"../range",
	"../selection"
], function(require, declare, domAttr, keys, lang, has, string, win,
	_Widget, _Plugin, DropDownButton, rangeapi, selectionapi){

/*=====
	var _Plugin = dijit._editor._Plugin;
=====*/

// module:
//		dijit/_editor/plugins/LinkDialog
// summary:
//		Editor plugins: LinkDialog (for inserting links) and ImgLinkDialog (for inserting images)


var LinkDialog = declare("dijit._editor.plugins.LinkDialog", _Plugin, {
	// summary:
	//		This plugin provides the basis for an 'anchor' (link) dialog and an extension of it
	//		provides the image link dialog.
	//
	// description:
	//		The command provided by this plugin is:
	//		* createLink

	// Override _Plugin.buttonClass.   This plugin is controlled by a DropDownButton
	// (which triggers a TooltipDialog).
	buttonClass: DropDownButton,

	// Override _Plugin.useDefaultCommand... processing is handled by this plugin, not by dijit.Editor.
	useDefaultCommand: false,

	// urlRegExp: [protected] String
	//		Used for validating input as correct URL.  While file:// urls are not terribly
	//		useful, they are technically valid.
	urlRegExp: "((https?|ftps?|file)\\://|\./|/|)(/[a-zA-Z]{1,1}:/|)(((?:(?:[\\da-zA-Z](?:[-\\da-zA-Z]{0,61}[\\da-zA-Z])?)\\.)*(?:[a-zA-Z](?:[-\\da-zA-Z]{0,80}[\\da-zA-Z])?)\\.?)|(((\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\.){3}(\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])|(0[xX]0*[\\da-fA-F]?[\\da-fA-F]\\.){3}0[xX]0*[\\da-fA-F]?[\\da-fA-F]|(0+[0-3][0-7][0-7]\\.){3}0+[0-3][0-7][0-7]|(0|[1-9]\\d{0,8}|[1-3]\\d{9}|4[01]\\d{8}|42[0-8]\\d{7}|429[0-3]\\d{6}|4294[0-8]\\d{5}|42949[0-5]\\d{4}|429496[0-6]\\d{3}|4294967[01]\\d{2}|42949672[0-8]\\d|429496729[0-5])|0[xX]0*[\\da-fA-F]{1,8}|([\\da-fA-F]{1,4}\\:){7}[\\da-fA-F]{1,4}|([\\da-fA-F]{1,4}\\:){6}((\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\.){3}(\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])))(\\:\\d+)?(/(?:[^?#\\s/]+/)*(?:[^?#\\s/]{0,}(?:\\?[^?#\\s/]*)?(?:#.*)?)?)?",

	// emailRegExp: [protected] String
	//		Used for validating input as correct email address.  Taken from dojox.validate
	emailRegExp:  "<?(mailto\\:)([!#-'*+\\-\\/-9=?A-Z^-~]+[.])*[!#-'*+\\-\\/-9=?A-Z^-~]+" /*username*/ + "@" +
        "((?:(?:[\\da-zA-Z](?:[-\\da-zA-Z]{0,61}[\\da-zA-Z])?)\\.)+(?:[a-zA-Z](?:[-\\da-zA-Z]{0,6}[\\da-zA-Z])?)\\.?)|localhost|^[^-][a-zA-Z0-9_-]*>?",	// host.

	// htmlTemplate: [protected] String
	//		String used for templating the HTML to insert at the desired point.
	htmlTemplate: "<a href=\"${urlInput}\" _djrealurl=\"${urlInput}\"" +
		" target=\"${targetSelect}\"" +
		">${textInput}</a>",

	// tag: [protected] String
	//		Tag used for the link type.
	tag: "a",

	// _hostRxp [private] RegExp
	//		Regular expression used to validate url fragments (ip address, hostname, etc)
	_hostRxp: /^((([^\[:]+):)?([^@]+)@)?(\[([^\]]+)\]|([^\[:]*))(:([0-9]+))?$/,

	// _userAtRxp [private] RegExp
	//		Regular expression used to validate e-mail address fragment.
	_userAtRxp: /^([!#-'*+\-\/-9=?A-Z^-~]+[.])*[!#-'*+\-\/-9=?A-Z^-~]+@/i,

	// linkDialogTemplate: [protected] String
	//		Template for contents of TooltipDialog to pick URL
	linkDialogTemplate: [
		"<table><tr><td>",
		"<label for='${id}_urlInput'>${url}</label>",
		"</td><td>",
		"<input data-dojo-type='dijit.form.ValidationTextBox' required='true' " +
		"id='${id}_urlInput' name='urlInput' data-dojo-props='intermediateChanges:true'/>",
		"</td></tr><tr><td>",
		"<label for='${id}_textInput'>${text}</label>",
		"</td><td>",
		"<input data-dojo-type='dijit.form.ValidationTextBox' required='true' id='${id}_textInput' " +
		"name='textInput' data-dojo-props='intermediateChanges:true'/>",
		"</td></tr><tr><td>",
		"<label for='${id}_targetSelect'>${target}</label>",
		"</td><td>",
		"<select id='${id}_targetSelect' name='targetSelect' data-dojo-type='dijit.form.Select'>",
		"<option selected='selected' value='_self'>${currentWindow}</option>",
		"<option value='_blank'>${newWindow}</option>",
		"<option value='_top'>${topWindow}</option>",
		"<option value='_parent'>${parentWindow}</option>",
		"</select>",
		"</td></tr><tr><td colspan='2'>",
		"<button data-dojo-type='dijit.form.Button' type='submit' id='${id}_setButton'>${set}</button>",
		"<button data-dojo-type='dijit.form.Button' type='button' id='${id}_cancelButton'>${buttonCancel}</button>",
		"</td></tr></table>"
	].join(""),

	_initButton: function(){
		this.inherited(arguments);

		// Setup to lazy create TooltipDialog first time the button is clicked
		this.button.loadDropDown = lang.hitch(this, "_loadDropDown");

		this._connectTagEvents();
	},
	_loadDropDown: function(callback){
		// Called the first time the button is pressed.  Initialize TooltipDialog.
		require([
			"dojo/i18n", // i18n.getLocalization
			"../../TooltipDialog",
			"../../registry", // registry.byId, registry.getUniqueId
			"../../form/Button",	// used by template
			"../../form/Select",	// used by template
			"../../form/ValidationTextBox",	// used by template
			"dojo/i18n!../../nls/common",
			"dojo/i18n!../nls/LinkDialog"
		], lang.hitch(this, function(i18n, TooltipDialog, registry){
			var _this = this;
			this.tag = this.command == 'insertImage' ? 'img' : 'a';
			var messages = lang.delegate(i18n.getLocalization("dijit", "common", this.lang),
				i18n.getLocalization("dijit._editor", "LinkDialog", this.lang));
			var dropDown = (this.dropDown = this.button.dropDown = new TooltipDialog({
				title: messages[this.command + "Title"],
				execute: lang.hitch(this, "setValue"),
				onOpen: function(){
					_this._onOpenDialog();
					TooltipDialog.prototype.onOpen.apply(this, arguments);
				},
				onCancel: function(){
					setTimeout(lang.hitch(_this, "_onCloseDialog"),0);
				}
			}));
			messages.urlRegExp = this.urlRegExp;
			messages.id = registry.getUniqueId(this.editor.id);
			this._uniqueId = messages.id;
			this._setContent(dropDown.title +
				"<div style='border-bottom: 1px black solid;padding-bottom:2pt;margin-bottom:4pt'></div>" +
				string.substitute(this.linkDialogTemplate, messages));
			dropDown.startup();
			this._urlInput = registry.byId(this._uniqueId + "_urlInput");
			this._textInput = registry.byId(this._uniqueId + "_textInput");
			this._setButton = registry.byId(this._uniqueId + "_setButton");
			this.connect(registry.byId(this._uniqueId + "_cancelButton"), "onClick", function(){
				this.dropDown.onCancel();
			});
			if(this._urlInput){
				this.connect(this._urlInput, "onChange", "_checkAndFixInput");
			}
			if(this._textInput){
				this.connect(this._textInput, "onChange", "_checkAndFixInput");
			}

			// Build up the dual check for http/https/file:, and mailto formats.
			this._urlRegExp = new RegExp("^" + this.urlRegExp + "$", "i");
			this._emailRegExp = new RegExp("^" + this.emailRegExp + "$", "i");
			this._urlInput.isValid = lang.hitch(this, function(){
				// Function over-ride of isValid to test if the input matches a url or a mailto style link.
				var value = this._urlInput.get("value");
				return this._urlRegExp.test(value) || this._emailRegExp.test(value);
			});

			// Listen for enter and execute if valid.
			this.connect(dropDown.domNode, "onkeypress", function(e){
				if(e && e.charOrCode == keys.ENTER &&
					!e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey){
					if(!this._setButton.get("disabled")){
						dropDown.onExecute();
						dropDown.execute(dropDown.get('value'));
					}
				}
			});

			callback();
		}));
	},

	_checkAndFixInput: function(){
		// summary:
		//		A function to listen for onChange events and test the input contents
		//		for valid information, such as valid urls with http/https/ftp and if
		//		not present, try and guess if the input url is relative or not, and if
		//		not, append http:// to it.  Also validates other fields as determined by
		//		the internal _isValid function.
		var self = this;
		var url = this._urlInput.get("value");
		var fixupUrl = function(url){
			var appendHttp = false;
			var appendMailto = false;
			if(url && url.length > 1){
				url = lang.trim(url);
				if(url.indexOf("mailto:") !== 0){
					if(url.indexOf("/") > 0){
						if(url.indexOf("://") === -1){
							// Check that it doesn't start with / or ./, which would
							// imply 'target server relativeness'
							if(url.charAt(0) !== '/' && url.indexOf("./") !== 0){
								if(self._hostRxp.test(url)){
									appendHttp = true;
								}
							}
						}
					}else if(self._userAtRxp.test(url)){
						// If it looks like a foo@, append a mailto.
						appendMailto = true;
					}
				}
			}
			if(appendHttp){
				self._urlInput.set("value", "http://" + url);
			}
			if(appendMailto){
				self._urlInput.set("value", "mailto:" + url);
			}
			self._setButton.set("disabled", !self._isValid());
		};
		if(this._delayedCheck){
			clearTimeout(this._delayedCheck);
			this._delayedCheck = null;
		}
		this._delayedCheck = setTimeout(function(){
			fixupUrl(url);
		}, 250);
	},

	_connectTagEvents: function(){
		// summary:
		//		Over-ridable function that connects tag specific events.
		this.editor.onLoadDeferred.addCallback(lang.hitch(this, function(){
			this.connect(this.editor.editNode, "ondblclick", this._onDblClick);
		}));
	},

	_isValid: function(){
		// summary:
		//		Internal function to allow validating of the inputs
		//		for a link to determine if set should be disabled or not
		// tags:
		//		protected
		return this._urlInput.isValid() && this._textInput.isValid();
	},

	_setContent: function(staticPanel){
		// summary:
		//		Helper for _initButton above.   Not sure why it's a separate method.
		this.dropDown.set({
			parserScope: "dojo",		// make parser search for dojoType/data-dojo-type even if page is multi-version
			content: staticPanel
		});
	},

	_checkValues: function(args){
		// summary:
		//		Function to check the values in args and 'fix' them up as needed.
		// args: Object
		//		Content being set.
		// tags:
		//		protected
		if(args && args.urlInput){
			args.urlInput = args.urlInput.replace(/"/g, "&quot;");
		}
		return args;
	},

	setValue: function(args){
		// summary:
		//		Callback from the dialog when user presses "set" button.
		// tags:
		//		private
		//TODO: prevent closing popup if the text is empty
		this._onCloseDialog();
		if(has("ie") < 9){ //see #4151
			var sel = rangeapi.getSelection(this.editor.window);
			var range = sel.getRangeAt(0);
			var a = range.endContainer;
			if(a.nodeType === 3){
				// Text node, may be the link contents, so check parent.
				// This plugin doesn't really support nested HTML elements
				// in the link, it assumes all link content is text.
				a = a.parentNode;
			}
			if(a && (a.nodeName && a.nodeName.toLowerCase() !== this.tag)){
				// Still nothing, one last thing to try on IE, as it might be 'img'
				// and thus considered a control.
				a = win.withGlobal(this.editor.window,
					"getSelectedElement", selectionapi, [this.tag]);
			}
			if(a && (a.nodeName && a.nodeName.toLowerCase() === this.tag)){
				// Okay, we do have a match.  IE, for some reason, sometimes pastes before
				// instead of removing the targeted paste-over element, so we unlink the
				// old one first.  If we do not the <a> tag remains, but it has no content,
				// so isn't readily visible (but is wrong for the action).
				if(this.editor.queryCommandEnabled("unlink")){
					// Select all the link children, then unlink.  The following insert will
					// then replace the selected text.
					win.withGlobal(this.editor.window,
						"selectElementChildren", selectionapi, [a]);
					this.editor.execCommand("unlink");
				}
			}
		}
		// make sure values are properly escaped, etc.
		args = this._checkValues(args);
		this.editor.execCommand('inserthtml',
			string.substitute(this.htmlTemplate, args));
	},

	_onCloseDialog: function(){
		// summary:
		//		Handler for close event on the dialog
		this.editor.focus();
	},

	_getCurrentValues: function(a){
		// summary:
		//		Over-ride for getting the values to set in the dropdown.
		// a:
		//		The anchor/link to process for data for the dropdown.
		// tags:
		//		protected
		var url, text, target;
		if(a && a.tagName.toLowerCase() === this.tag){
			url = a.getAttribute('_djrealurl') || a.getAttribute('href');
			target = a.getAttribute('target') || "_self";
			text = a.textContent || a.innerText;
			win.withGlobal(this.editor.window, "selectElement", selectionapi, [a, true]);
		}else{
			text = win.withGlobal(this.editor.window, selectionapi.getSelectedText);
		}
		return {urlInput: url || '', textInput: text || '', targetSelect: target || ''}; //Object;
	},

	_onOpenDialog: function(){
		// summary:
		//		Handler for when the dialog is opened.
		//		If the caret is currently in a URL then populate the URL's info into the dialog.
		var a;
		if(has("ie") < 9){
			// IE is difficult to select the element in, using the range unified
			// API seems to work reasonably well.
			var sel = rangeapi.getSelection(this.editor.window);
			var range = sel.getRangeAt(0);
			a = range.endContainer;
			if(a.nodeType === 3){
				// Text node, may be the link contents, so check parent.
				// This plugin doesn't really support nested HTML elements
				// in the link, it assumes all link content is text.
				a = a.parentNode;
			}
			if(a && (a.nodeName && a.nodeName.toLowerCase() !== this.tag)){
				// Still nothing, one last thing to try on IE, as it might be 'img'
				// and thus considered a control.
				a = win.withGlobal(this.editor.window,
					"getSelectedElement", selectionapi, [this.tag]);
			}
		}else{
			a = win.withGlobal(this.editor.window,
				"getAncestorElement", selectionapi, [this.tag]);
		}
		this.dropDown.reset();
		this._setButton.set("disabled", true);
		this.dropDown.set("value", this._getCurrentValues(a));
	},

	_onDblClick: function(e){
		// summary:
		// 		Function to define a behavior on double clicks on the element
		//		type this dialog edits to select it and pop up the editor
		//		dialog.
		// e: Object
		//		The double-click event.
		// tags:
		//		protected.
		if(e && e.target){
			var t = e.target;
			var tg = t.tagName? t.tagName.toLowerCase() : "";
			if(tg === this.tag && domAttr.get(t,"href")){
				var editor = this.editor;

				win.withGlobal(editor.window,
					 "selectElement",
					 selectionapi, [t]);

				editor.onDisplayChanged();

				// Call onNormalizedDisplayChange() now, rather than on timer.
				// On IE, when focus goes to the first <input> in the TooltipDialog, the editor loses it's selection.
				// Later if onNormalizedDisplayChange() gets called via the timer it will disable the LinkDialog button
				// (actually, all the toolbar buttons), at which point clicking the <input> will close the dialog,
				// since (for unknown reasons) focus.js ignores disabled controls.
				if(editor._updateTimer){
					clearTimeout(editor._updateTimer);
					delete editor._updateTimer;
				}
				editor.onNormalizedDisplayChanged();

				var button = this.button;
				setTimeout(function(){
					// Focus shift outside the event handler.
					// IE doesn't like focus changes in event handles.
					button.set("disabled", false);
					button.loadAndOpenDropDown().then(function(){
						if(button.dropDown.focus){
							button.dropDown.focus();
						}
					});
				}, 10);
			}
		}
	}
});

var ImgLinkDialog = declare("dijit._editor.plugins.ImgLinkDialog", [LinkDialog], {
	// summary:
	//		This plugin extends LinkDialog and adds in a plugin for handling image links.
	//		provides the image link dialog.
	//
	// description:
	//		The command provided by this plugin is:
	//		* insertImage

	// linkDialogTemplate: [protected] String
	//		Over-ride for template since img dialog doesn't need target that anchor tags may.
	linkDialogTemplate: [
		"<table><tr><td>",
		"<label for='${id}_urlInput'>${url}</label>",
		"</td><td>",
		"<input dojoType='dijit.form.ValidationTextBox' regExp='${urlRegExp}' " +
		"required='true' id='${id}_urlInput' name='urlInput' data-dojo-props='intermediateChanges:true'/>",
		"</td></tr><tr><td>",
		"<label for='${id}_textInput'>${text}</label>",
		"</td><td>",
		"<input data-dojo-type='dijit.form.ValidationTextBox' required='false' id='${id}_textInput' " +
		"name='textInput' data-dojo-props='intermediateChanges:true'/>",
		"</td></tr><tr><td>",
		"</td><td>",
		"</td></tr><tr><td colspan='2'>",
		"<button data-dojo-type='dijit.form.Button' type='submit' id='${id}_setButton'>${set}</button>",
		"<button data-dojo-type='dijit.form.Button' type='button' id='${id}_cancelButton'>${buttonCancel}</button>",
		"</td></tr></table>"
	].join(""),

	// htmlTemplate: [protected] String
	//		String used for templating the <img> HTML to insert at the desired point.
	htmlTemplate: "<img src=\"${urlInput}\" _djrealurl=\"${urlInput}\" alt=\"${textInput}\" />",

	// tag: [protected] String
	//		Tag used for the link type (img).
	tag: "img",

	_getCurrentValues: function(img){
		// summary:
		//		Over-ride for getting the values to set in the dropdown.
		// a:
		//		The anchor/link to process for data for the dropdown.
		// tags:
		//		protected
		var url, text;
		if(img && img.tagName.toLowerCase() === this.tag){
			url = img.getAttribute('_djrealurl') || img.getAttribute('src');
			text = img.getAttribute('alt');
			win.withGlobal(this.editor.window,
				"selectElement", selectionapi, [img, true]);
		}else{
			text = win.withGlobal(this.editor.window, selectionapi.getSelectedText);
		}
		return {urlInput: url || '', textInput: text || ''}; //Object;
	},

	_isValid: function(){
		// summary:
		//		Over-ride for images.  You can have alt text of blank, it is valid.
		// tags:
		//		protected
		return this._urlInput.isValid();
	},

	_connectTagEvents: function(){
		// summary:
		//		Over-ridable function that connects tag specific events.
		this.inherited(arguments);
		this.editor.onLoadDeferred.addCallback(lang.hitch(this, function(){
			// Use onmousedown instead of onclick.  Seems that IE eats the first onclick
			// to wrap it in a selector box, then the second one acts as onclick.  See #10420
			this.connect(this.editor.editNode, "onmousedown", this._selectTag);
		}));
	},

	_selectTag: function(e){
		// summary:
		//		A simple event handler that lets me select an image if it is clicked on.
		//		makes it easier to select images in a standard way across browsers.  Otherwise
		//		selecting an image for edit becomes difficult.
		// e: Event
		//		The mousedown event.
		// tags:
		//		private
		if(e && e.target){
			var t = e.target;
			var tg = t.tagName? t.tagName.toLowerCase() : "";
			if(tg === this.tag){
				win.withGlobal(this.editor.window,
					"selectElement",
					selectionapi, [t]);
			}
		}
	},

	_checkValues: function(args){
		// summary:
		//		Function to check the values in args and 'fix' them up as needed
		//		(special characters in the url or alt text)
		// args: Object
		//		Content being set.
		// tags:
		//		protected
		if(args && args.urlInput){
			args.urlInput = args.urlInput.replace(/"/g, "&quot;");
		}
		if(args && args.textInput){
			args.textInput = args.textInput.replace(/"/g, "&quot;");
		}
		return args;
	},

	_onDblClick: function(e){
		// summary:
		// 		Function to define a behavior on double clicks on the element
		//		type this dialog edits to select it and pop up the editor
		//		dialog.
		// e: Object
		//		The double-click event.
		// tags:
		//		protected.
		if(e && e.target){
			var t = e.target;
			var tg = t.tagName ? t.tagName.toLowerCase() : "";
			if(tg === this.tag && domAttr.get(t,"src")){
				var editor = this.editor;

				win.withGlobal(editor.window,
					 "selectElement",
					 selectionapi, [t]);
				editor.onDisplayChanged();

				// Call onNormalizedDisplayChange() now, rather than on timer.
				// On IE, when focus goes to the first <input> in the TooltipDialog, the editor loses it's selection.
				// Later if onNormalizedDisplayChange() gets called via the timer it will disable the LinkDialog button
				// (actually, all the toolbar buttons), at which point clicking the <input> will close the dialog,
				// since (for unknown reasons) focus.js ignores disabled controls.
				if(editor._updateTimer){
					clearTimeout(editor._updateTimer);
					delete editor._updateTimer;
				}
				editor.onNormalizedDisplayChanged();

				var button = this.button;
				setTimeout(function(){
					// Focus shift outside the event handler.
					// IE doesn't like focus changes in event handles.
					button.set("disabled", false);
					button.loadAndOpenDropDown().then(function(){
						if(button.dropDown.focus){
							button.dropDown.focus();
						}
					});
				}, 10);
			}
		}
	}
});

// Register these plugins
_Plugin.registry["createLink"] = function(){
	return new LinkDialog({command: "createLink"});
};
_Plugin.registry["insertImage"] = function(){
	return new ImgLinkDialog({command: "insertImage"});
};


// Export both LinkDialog and ImgLinkDialog
LinkDialog.ImgLinkDialog = ImgLinkDialog;
return LinkDialog;
});

},
'dojo/data/util/simpleFetch':function(){
define(["dojo/_base/lang", "dojo/_base/window", "./sorter"], 
  function(lang, winUtil, sorter) {
	// module:
	//		dojo/data/util/simpleFetch
	// summary:
	//		TODOC

var simpleFetch = lang.getObject("dojo.data.util.simpleFetch", true);

simpleFetch.fetch = function(/* Object? */ request){
	//	summary:
	//		The simpleFetch mixin is designed to serve as a set of function(s) that can
	//		be mixed into other datastore implementations to accelerate their development.
	//		The simpleFetch mixin should work well for any datastore that can respond to a _fetchItems()
	//		call by returning an array of all the found items that matched the query.  The simpleFetch mixin
	//		is not designed to work for datastores that respond to a fetch() call by incrementally
	//		loading items, or sequentially loading partial batches of the result
	//		set.  For datastores that mixin simpleFetch, simpleFetch
	//		implements a fetch method that automatically handles eight of the fetch()
	//		arguments -- onBegin, onItem, onComplete, onError, start, count, sort and scope
	//		The class mixing in simpleFetch should not implement fetch(),
	//		but should instead implement a _fetchItems() method.  The _fetchItems()
	//		method takes three arguments, the keywordArgs object that was passed
	//		to fetch(), a callback function to be called when the result array is
	//		available, and an error callback to be called if something goes wrong.
	//		The _fetchItems() method should ignore any keywordArgs parameters for
	//		start, count, onBegin, onItem, onComplete, onError, sort, and scope.
	//		The _fetchItems() method needs to correctly handle any other keywordArgs
	//		parameters, including the query parameter and any optional parameters
	//		(such as includeChildren).  The _fetchItems() method should create an array of
	//		result items and pass it to the fetchHandler along with the original request object
	//		-- or, the _fetchItems() method may, if it wants to, create an new request object
	//		with other specifics about the request that are specific to the datastore and pass
	//		that as the request object to the handler.
	//
	//		For more information on this specific function, see dojo.data.api.Read.fetch()
	request = request || {};
	if(!request.store){
		request.store = this;
	}
	var self = this;

	var _errorHandler = function(errorData, requestObject){
		if(requestObject.onError){
			var scope = requestObject.scope || winUtil.global;
			requestObject.onError.call(scope, errorData, requestObject);
		}
	};

	var _fetchHandler = function(items, requestObject){
		var oldAbortFunction = requestObject.abort || null;
		var aborted = false;

		var startIndex = requestObject.start?requestObject.start:0;
		var endIndex = (requestObject.count && (requestObject.count !== Infinity))?(startIndex + requestObject.count):items.length;

		requestObject.abort = function(){
			aborted = true;
			if(oldAbortFunction){
				oldAbortFunction.call(requestObject);
			}
		};

		var scope = requestObject.scope || winUtil.global;
		if(!requestObject.store){
			requestObject.store = self;
		}
		if(requestObject.onBegin){
			requestObject.onBegin.call(scope, items.length, requestObject);
		}
		if(requestObject.sort){
			items.sort(sorter.createSortFunction(requestObject.sort, self));
		}
		if(requestObject.onItem){
			for(var i = startIndex; (i < items.length) && (i < endIndex); ++i){
				var item = items[i];
				if(!aborted){
					requestObject.onItem.call(scope, item, requestObject);
				}
			}
		}
		if(requestObject.onComplete && !aborted){
			var subset = null;
			if(!requestObject.onItem){
				subset = items.slice(startIndex, endIndex);
			}
			requestObject.onComplete.call(scope, subset, requestObject);
		}
	};
	this._fetchItems(request, _fetchHandler, _errorHandler);
	return request;	// Object
};

return simpleFetch;
});

},
'url:dijit/form/templates/ValidationTextBox.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\"\r\n\tid=\"widget_${id}\" role=\"presentation\"\r\n\t><div class='dijitReset dijitValidationContainer'\r\n\t\t><input class=\"dijitReset dijitInputField dijitValidationIcon dijitValidationInner\" value=\"&#935; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t/></div\r\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\r\n\t\t><input class=\"dijitReset dijitInputInner\" data-dojo-attach-point='textbox,focusNode' autocomplete=\"off\"\r\n\t\t\t${!nameAttrSetting} type='${type}'\r\n\t/></div\r\n></div>\r\n",
'url:dijit/form/templates/TextBox.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\" id=\"widget_${id}\" role=\"presentation\"\r\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\r\n\t\t><input class=\"dijitReset dijitInputInner\" data-dojo-attach-point='textbox,focusNode' autocomplete=\"off\"\r\n\t\t\t${!nameAttrSetting} type='${type}'\r\n\t/></div\r\n></div>\r\n",
'dijit/_KeyNavContainer':function(){
define("dijit/_KeyNavContainer", [
	"dojo/_base/kernel", // kernel.deprecated
	"./_Container",
	"./_FocusMixin",
	"dojo/_base/array", // array.forEach
	"dojo/keys", // keys.END keys.HOME
	"dojo/_base/declare", // declare
	"dojo/_base/event", // event.stop
	"dojo/dom-attr", // domAttr.set
	"dojo/_base/lang" // lang.hitch
], function(kernel, _Container, _FocusMixin, array, keys, declare, event, domAttr, lang){

/*=====
	var _FocusMixin = dijit._FocusMixin;
	var _Container = dijit._Container;
=====*/

	// module:
	//		dijit/_KeyNavContainer
	// summary:
	//		A _Container with keyboard navigation of its children.

	return declare("dijit._KeyNavContainer", [_FocusMixin, _Container], {

		// summary:
		//		A _Container with keyboard navigation of its children.
		// description:
		//		To use this mixin, call connectKeyNavHandlers() in
		//		postCreate().
		//		It provides normalized keyboard and focusing code for Container
		//		widgets.

/*=====
		// focusedChild: [protected] Widget
		//		The currently focused child widget, or null if there isn't one
		focusedChild: null,
=====*/

		// tabIndex: Integer
		//		Tab index of the container; same as HTML tabIndex attribute.
		//		Note then when user tabs into the container, focus is immediately
		//		moved to the first item in the container.
		tabIndex: "0",

		connectKeyNavHandlers: function(/*keys[]*/ prevKeyCodes, /*keys[]*/ nextKeyCodes){
			// summary:
			//		Call in postCreate() to attach the keyboard handlers
			//		to the container.
			// preKeyCodes: keys[]
			//		Key codes for navigating to the previous child.
			// nextKeyCodes: keys[]
			//		Key codes for navigating to the next child.
			// tags:
			//		protected

			// TODO: call this automatically from my own postCreate()

			var keyCodes = (this._keyNavCodes = {});
			var prev = lang.hitch(this, "focusPrev");
			var next = lang.hitch(this, "focusNext");
			array.forEach(prevKeyCodes, function(code){ keyCodes[code] = prev; });
			array.forEach(nextKeyCodes, function(code){ keyCodes[code] = next; });
			keyCodes[keys.HOME] = lang.hitch(this, "focusFirstChild");
			keyCodes[keys.END] = lang.hitch(this, "focusLastChild");
			this.connect(this.domNode, "onkeypress", "_onContainerKeypress");
			this.connect(this.domNode, "onfocus", "_onContainerFocus");
		},

		startupKeyNavChildren: function(){
			kernel.deprecated("startupKeyNavChildren() call no longer needed", "", "2.0");
		},

		startup: function(){
			this.inherited(arguments);
			array.forEach(this.getChildren(), lang.hitch(this, "_startupChild"));
		},

		addChild: function(/*dijit._Widget*/ widget, /*int?*/ insertIndex){
			this.inherited(arguments);
			this._startupChild(widget);
		},

		focus: function(){
			// summary:
			//		Default focus() implementation: focus the first child.
			this.focusFirstChild();
		},

		focusFirstChild: function(){
			// summary:
			//		Focus the first focusable child in the container.
			// tags:
			//		protected
			this.focusChild(this._getFirstFocusableChild());
		},

		focusLastChild: function(){
			// summary:
			//		Focus the last focusable child in the container.
			// tags:
			//		protected
			this.focusChild(this._getLastFocusableChild());
		},

		focusNext: function(){
			// summary:
			//		Focus the next widget
			// tags:
			//		protected
			this.focusChild(this._getNextFocusableChild(this.focusedChild, 1));
		},

		focusPrev: function(){
			// summary:
			//		Focus the last focusable node in the previous widget
			//		(ex: go to the ComboButton icon section rather than button section)
			// tags:
			//		protected
			this.focusChild(this._getNextFocusableChild(this.focusedChild, -1), true);
		},

		focusChild: function(/*dijit._Widget*/ widget, /*Boolean*/ last){
			// summary:
			//		Focus specified child widget.
			// widget:
			//		Reference to container's child widget
			// last:
			//		If true and if widget has multiple focusable nodes, focus the
			//		last one instead of the first one
			// tags:
			//		protected

			if(!widget){ return; }

			if(this.focusedChild && widget !== this.focusedChild){
				this._onChildBlur(this.focusedChild);	// used by _MenuBase
			}
			widget.set("tabIndex", this.tabIndex);	// for IE focus outline to appear, must set tabIndex before focs
			widget.focus(last ? "end" : "start");
			this._set("focusedChild", widget);
		},

		_startupChild: function(/*dijit._Widget*/ widget){
			// summary:
			//		Setup for each child widget
			// description:
			//		Sets tabIndex=-1 on each child, so that the tab key will
			//		leave the container rather than visiting each child.
			// tags:
			//		private

			widget.set("tabIndex", "-1");

			this.connect(widget, "_onFocus", function(){
				// Set valid tabIndex so tabbing away from widget goes to right place, see #10272
				widget.set("tabIndex", this.tabIndex);
			});
			this.connect(widget, "_onBlur", function(){
				widget.set("tabIndex", "-1");
			});
		},

		_onContainerFocus: function(evt){
			// summary:
			//		Handler for when the container gets focus
			// description:
			//		Initially the container itself has a tabIndex, but when it gets
			//		focus, switch focus to first child...
			// tags:
			//		private

			// Note that we can't use _onFocus() because switching focus from the
			// _onFocus() handler confuses the focus.js code
			// (because it causes _onFocusNode() to be called recursively)
			// Also, _onFocus() would fire when focus went directly to a child widget due to mouse click.

			// Ignore spurious focus events:
			//	1. focus on a child widget bubbles on FF
			//	2. on IE, clicking the scrollbar of a select dropdown moves focus from the focused child item to me
			if(evt.target !== this.domNode || this.focusedChild){ return; }

			this.focusFirstChild();

			// and then set the container's tabIndex to -1,
			// (don't remove as that breaks Safari 4)
			// so that tab or shift-tab will go to the fields after/before
			// the container, rather than the container itself
			domAttr.set(this.domNode, "tabIndex", "-1");
		},

		_onBlur: function(evt){
			// When focus is moved away the container, and its descendant (popup) widgets,
			// then restore the container's tabIndex so that user can tab to it again.
			// Note that using _onBlur() so that this doesn't happen when focus is shifted
			// to one of my child widgets (typically a popup)
			if(this.tabIndex){
				domAttr.set(this.domNode, "tabIndex", this.tabIndex);
			}
			this.focusedChild = null;
			this.inherited(arguments);
		},

		_onContainerKeypress: function(evt){
			// summary:
			//		When a key is pressed, if it's an arrow key etc. then
			//		it's handled here.
			// tags:
			//		private
			if(evt.ctrlKey || evt.altKey){ return; }
			var func = this._keyNavCodes[evt.charOrCode];
			if(func){
				func();
				event.stop(evt);
			}
		},

		_onChildBlur: function(/*dijit._Widget*/ /*===== widget =====*/){
			// summary:
			//		Called when focus leaves a child widget to go
			//		to a sibling widget.
			//		Used by MenuBase.js (TODO: move code there)
			// tags:
			//		protected
		},

		_getFirstFocusableChild: function(){
			// summary:
			//		Returns first child that can be focused
			return this._getNextFocusableChild(null, 1);	// dijit._Widget
		},

		_getLastFocusableChild: function(){
			// summary:
			//		Returns last child that can be focused
			return this._getNextFocusableChild(null, -1);	// dijit._Widget
		},

		_getNextFocusableChild: function(child, dir){
			// summary:
			//		Returns the next or previous focusable child, compared
			//		to "child"
			// child: Widget
			//		The current widget
			// dir: Integer
			//		* 1 = after
			//		* -1 = before
			if(child){
				child = this._getSiblingOfChild(child, dir);
			}
			var children = this.getChildren();
			for(var i=0; i < children.length; i++){
				if(!child){
					child = children[(dir>0) ? 0 : (children.length-1)];
				}
				if(child.isFocusable()){
					return child;	// dijit._Widget
				}
				child = this._getSiblingOfChild(child, dir);
			}
			// no focusable child found
			return null;	// dijit._Widget
		}
	});
});

},
'dijit/_Contained':function(){
define("dijit/_Contained", [
	"dojo/_base/declare", // declare
	"./registry"	// registry.getEnclosingWidget(), registry.byNode()
], function(declare, registry){

	// module:
	//		dijit/_Contained
	// summary:
	//		Mixin for widgets that are children of a container widget

	return declare("dijit._Contained", null, {
		// summary:
		//		Mixin for widgets that are children of a container widget
		//
		// example:
		// | 	// make a basic custom widget that knows about it's parents
		// |	declare("my.customClass",[dijit._Widget,dijit._Contained],{});

		_getSibling: function(/*String*/ which){
			// summary:
			//      Returns next or previous sibling
			// which:
			//      Either "next" or "previous"
			// tags:
			//      private
			var node = this.domNode;
			do{
				node = node[which+"Sibling"];
			}while(node && node.nodeType != 1);
			return node && registry.byNode(node);	// dijit._Widget
		},

		getPreviousSibling: function(){
			// summary:
			//		Returns null if this is the first child of the parent,
			//		otherwise returns the next element sibling to the "left".

			return this._getSibling("previous"); // dijit._Widget
		},

		getNextSibling: function(){
			// summary:
			//		Returns null if this is the last child of the parent,
			//		otherwise returns the next element sibling to the "right".

			return this._getSibling("next"); // dijit._Widget
		},

		getIndexInParent: function(){
			// summary:
			//		Returns the index of this widget within its container parent.
			//		It returns -1 if the parent does not exist, or if the parent
			//		is not a dijit._Container

			var p = this.getParent();
			if(!p || !p.getIndexOfChild){
				return -1; // int
			}
			return p.getIndexOfChild(this); // int
		}
	});
});

},
'dijit/form/DataList':function(){
define("dijit/form/DataList", [
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.byId
	"dojo/_base/lang", // lang.trim
	"dojo/query", // query
	"dojo/store/Memory", // dojo.store.Memory
	"../registry"	// registry.add registry.remove
], function(declare, dom, lang, query, MemoryStore, registry){

	// module:
	//		dijit/form/DataList
	// summary:
	//		Inefficient but small data store specialized for inlined data via OPTION tags

	function toItem(/*DOMNode*/ option){
		// summary:
		//		Convert <option> node to hash
		return {
			id: option.value,
			value: option.value,
			name: lang.trim(option.innerText || option.textContent || '')
		};
	}

	return declare("dijit.form.DataList", MemoryStore, {
		// summary:
		//		Inefficient but small data store specialized for inlined data via OPTION tags
		//
		// description:
		//		Provides a store for inlined data like:
		//
		//	|	<datalist>
		//	|		<option value="AL">Alabama</option>
		//	|		...

		constructor: function(/*Object?*/ params, /*DomNode|String*/ srcNodeRef){
			// store pointer to original DOM tree
			this.domNode = dom.byId(srcNodeRef);

			lang.mixin(this, params);
			if(this.id){
				registry.add(this); // add to registry so it can be easily found by id
			}
			this.domNode.style.display = "none";

			this.inherited(arguments, [{
				data: query("option", this.domNode).map(toItem)
			}]);
		},

		destroy: function(){
			registry.remove(this.id);
		},

		fetchSelectedItem: function(){
			// summary:
			//		Get the option marked as selected, like `<option selected>`.
			//		Not part of dojo.data API.
			var option = query("> option[selected]", this.domNode)[0] || query("> option", this.domNode)[0];
			return option && toItem(option);
		}
	});
});

},
'dijit/_editor/_Plugin':function(){
define("dijit/_editor/_Plugin", [
	"dojo/_base/connect", // connect.connect
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.mixin, lang.hitch
	"../form/Button"
], function(connect, declare, lang, Button){

// module:
//		dijit/_editor/_Plugin
// summary:
//		Base class for a "plugin" to the editor, which is usually
//		a single button on the Toolbar and some associated code


var _Plugin = declare("dijit._editor._Plugin", null, {
	// summary:
	//		Base class for a "plugin" to the editor, which is usually
	//		a single button on the Toolbar and some associated code

	constructor: function(/*Object?*/args){
		this.params = args || {};
		lang.mixin(this, this.params);
		this._connects=[];
		this._attrPairNames = {};
	},

	// editor: [const] dijit.Editor
	//		Points to the parent editor
	editor: null,

	// iconClassPrefix: [const] String
	//		The CSS class name for the button node is formed from `iconClassPrefix` and `command`
	iconClassPrefix: "dijitEditorIcon",

	// button: dijit._Widget?
	//		Pointer to `dijit.form.Button` or other widget (ex: `dijit.form.FilteringSelect`)
	//		that is added to the toolbar to control this plugin.
	//		If not specified, will be created on initialization according to `buttonClass`
	button: null,

	// command: String
	//		String like "insertUnorderedList", "outdent", "justifyCenter", etc. that represents an editor command.
	//		Passed to editor.execCommand() if `useDefaultCommand` is true.
	command: "",

	// useDefaultCommand: Boolean
	//		If true, this plugin executes by calling Editor.execCommand() with the argument specified in `command`.
	useDefaultCommand: true,

	// buttonClass: Widget Class
	//		Class of widget (ex: dijit.form.Button or dijit.form.FilteringSelect)
	//		that is added to the toolbar to control this plugin.
	//		This is used to instantiate the button, unless `button` itself is specified directly.
	buttonClass: Button,

	// disabled: Boolean
	//		Flag to indicate if this plugin has been disabled and should do nothing
	//		helps control button state, among other things.  Set via the setter api.
	disabled: false,

	getLabel: function(/*String*/key){
		// summary:
		//		Returns the label to use for the button
		// tags:
		//		private
		return this.editor.commands[key];		// String
	},

	_initButton: function(){
		// summary:
		//		Initialize the button or other widget that will control this plugin.
		//		This code only works for plugins controlling built-in commands in the editor.
		// tags:
		//		protected extension
		if(this.command.length){
			var label = this.getLabel(this.command),
				editor = this.editor,
				className = this.iconClassPrefix+" "+this.iconClassPrefix + this.command.charAt(0).toUpperCase() + this.command.substr(1);
			if(!this.button){
				var props = lang.mixin({
					label: label,
					dir: editor.dir,
					lang: editor.lang,
					showLabel: false,
					iconClass: className,
					dropDown: this.dropDown,
					tabIndex: "-1"
				}, this.params || {});
				this.button = new this.buttonClass(props);
			}
		}
		if(this.get("disabled") && this.button){
			this.button.set("disabled", this.get("disabled"));
		}
	},

	destroy: function(){
		// summary:
		//		Destroy this plugin

		var h;
		while(h = this._connects.pop()){ h.remove(); }
		if(this.dropDown){
			this.dropDown.destroyRecursive();
		}
	},

	connect: function(o, f, tf){
		// summary:
		//		Make a connect.connect() that is automatically disconnected when this plugin is destroyed.
		//		Similar to `dijit._Widget.connect`.
		// tags:
		//		protected
		this._connects.push(connect.connect(o, f, this, tf));
	},

	updateState: function(){
		// summary:
		//		Change state of the plugin to respond to events in the editor.
		// description:
		//		This is called on meaningful events in the editor, such as change of selection
		//		or caret position (but not simple typing of alphanumeric keys).   It gives the
		//		plugin a chance to update the CSS of its button.
		//
		//		For example, the "bold" plugin will highlight/unhighlight the bold button depending on whether the
		//		characters next to the caret are bold or not.
		//
		//		Only makes sense when `useDefaultCommand` is true, as it calls Editor.queryCommandEnabled(`command`).
		var e = this.editor,
			c = this.command,
			checked, enabled;
		if(!e || !e.isLoaded || !c.length){ return; }
		var disabled = this.get("disabled");
		if(this.button){
			try{
				enabled = !disabled && e.queryCommandEnabled(c);
				if(this.enabled !== enabled){
					this.enabled = enabled;
					this.button.set('disabled', !enabled);
				}
				if(typeof this.button.checked == 'boolean'){
					checked = e.queryCommandState(c);
					if(this.checked !== checked){
						this.checked = checked;
						this.button.set('checked', e.queryCommandState(c));
					}
				}
			}catch(e){
				console.log(e); // FIXME: we shouldn't have debug statements in our code.  Log as an error?
			}
		}
	},

	setEditor: function(/*dijit.Editor*/ editor){
		// summary:
		//		Tell the plugin which Editor it is associated with.

		// TODO: refactor code to just pass editor to constructor.

		// FIXME: detach from previous editor!!
		this.editor = editor;

		// FIXME: prevent creating this if we don't need to (i.e., editor can't handle our command)
		this._initButton();

		// Processing for buttons that execute by calling editor.execCommand()
		if(this.button && this.useDefaultCommand){
			if(this.editor.queryCommandAvailable(this.command)){
				this.connect(this.button, "onClick",
					lang.hitch(this.editor, "execCommand", this.command, this.commandArg)
				);
			}else{
				// hide button because editor doesn't support command (due to browser limitations)
				this.button.domNode.style.display = "none";
			}
		}

		this.connect(this.editor, "onNormalizedDisplayChanged", "updateState");
	},

	setToolbar: function(/*dijit.Toolbar*/ toolbar){
		// summary:
		//		Tell the plugin to add it's controller widget (often a button)
		//		to the toolbar.  Does nothing if there is no controller widget.

		// TODO: refactor code to just pass toolbar to constructor.

		if(this.button){
			toolbar.addChild(this.button);
		}
		// console.debug("adding", this.button, "to:", toolbar);
	},

	set: function(/* attribute */ name, /* anything */ value){
		// summary:
		//		Set a property on a plugin
		//	name:
		//		The property to set.
		//	value:
		//		The value to set in the property.
		// description:
		//		Sets named properties on a plugin which may potentially be handled by a
		// 		setter in the plugin.
		// 		For example, if the plugin has a properties "foo"
		//		and "bar" and a method named "_setFooAttr", calling:
		//	|	plugin.set("foo", "Howdy!");
		//		would be equivalent to writing:
		//	|	plugin._setFooAttr("Howdy!");
		//		and:
		//	|	plugin.set("bar", 3);
		//		would be equivalent to writing:
		//	|	plugin.bar = 3;
		//
		//	set() may also be called with a hash of name/value pairs, ex:
		//	|	plugin.set({
		//	|		foo: "Howdy",
		//	|		bar: 3
		//	|	})
		//	This is equivalent to calling set(foo, "Howdy") and set(bar, 3)
		if(typeof name === "object"){
			for(var x in name){
				this.set(x, name[x]);
	}
			return this;
		}
		var names = this._getAttrNames(name);
		if(this[names.s]){
			// use the explicit setter
			var result = this[names.s].apply(this, Array.prototype.slice.call(arguments, 1));
		}else{
			this._set(name, value);
		}
		return result || this;
	},

	get: function(name){
		// summary:
		//		Get a property from a plugin.
		//	name:
		//		The property to get.
		// description:
		//		Get a named property from a plugin. The property may
		//		potentially be retrieved via a getter method. If no getter is defined, this
		// 		just retrieves the object's property.
		// 		For example, if the plugin has a properties "foo"
		//		and "bar" and a method named "_getFooAttr", calling:
		//	|	plugin.get("foo");
		//		would be equivalent to writing:
		//	|	plugin._getFooAttr();
		//		and:
		//	|	plugin.get("bar");
		//		would be equivalent to writing:
		//	|	plugin.bar;
		var names = this._getAttrNames(name);
		return this[names.g] ? this[names.g]() : this[name];
	},

	_setDisabledAttr: function(disabled){
		// summary:
		//		Function to set the plugin state and call updateState to make sure the
		//		button is updated appropriately.
		this.disabled = disabled;
		this.updateState();
	},

	_getAttrNames: function(name){
		// summary:
		//		Helper function for get() and set().
		//		Caches attribute name values so we don't do the string ops every time.
		// tags:
		//		private

		var apn = this._attrPairNames;
		if(apn[name]){ return apn[name]; }
		var uc = name.charAt(0).toUpperCase() + name.substr(1);
		return (apn[name] = {
			s: "_set"+uc+"Attr",
			g: "_get"+uc+"Attr"
		});
	},

	_set: function(/*String*/ name, /*anything*/ value){
		// summary:
		//		Helper function to set new value for specified attribute
		this[name] = value;
	}
});

// Hash mapping plugin name to factory, used for registering plugins
_Plugin.registry = {};

return _Plugin;

});

},
'dojo/data/ItemFileReadStore':function(){
define(["../_base/kernel", "../_base/lang", "../_base/declare", "../_base/array", "../_base/xhr", 
	"../Evented", "../_base/window", "./util/filter", "./util/simpleFetch", "../date/stamp"
], function(kernel, lang, declare, array, xhr, Evented, window, filterUtil, simpleFetch, dateStamp) {
	// module:
	//		dojo/data/ItemFileReadStore
	// summary:
	//		TODOC


var ItemFileReadStore = declare("dojo.data.ItemFileReadStore", [Evented],{
	//	summary:
	//		The ItemFileReadStore implements the dojo.data.api.Read API and reads
	//		data from JSON files that have contents in this format --
	//		{ items: [
	//			{ name:'Kermit', color:'green', age:12, friends:['Gonzo', {_reference:{name:'Fozzie Bear'}}]},
	//			{ name:'Fozzie Bear', wears:['hat', 'tie']},
	//			{ name:'Miss Piggy', pets:'Foo-Foo'}
	//		]}
	//		Note that it can also contain an 'identifer' property that specified which attribute on the items
	//		in the array of items that acts as the unique identifier for that item.
	//
	constructor: function(/* Object */ keywordParameters){
		//	summary: constructor
		//	keywordParameters: {url: String}
		//	keywordParameters: {data: jsonObject}
		//	keywordParameters: {typeMap: object)
		//		The structure of the typeMap object is as follows:
		//		{
		//			type0: function || object,
		//			type1: function || object,
		//			...
		//			typeN: function || object
		//		}
		//		Where if it is a function, it is assumed to be an object constructor that takes the
		//		value of _value as the initialization parameters.  If it is an object, then it is assumed
		//		to be an object of general form:
		//		{
		//			type: function, //constructor.
		//			deserialize:	function(value) //The function that parses the value and constructs the object defined by type appropriately.
		//		}

		this._arrayOfAllItems = [];
		this._arrayOfTopLevelItems = [];
		this._loadFinished = false;
		this._jsonFileUrl = keywordParameters.url;
		this._ccUrl = keywordParameters.url;
		this.url = keywordParameters.url;
		this._jsonData = keywordParameters.data;
		this.data = null;
		this._datatypeMap = keywordParameters.typeMap || {};
		if(!this._datatypeMap['Date']){
			//If no default mapping for dates, then set this as default.
			//We use the dojo.date.stamp here because the ISO format is the 'dojo way'
			//of generically representing dates.
			this._datatypeMap['Date'] = {
											type: Date,
											deserialize: function(value){
												return dateStamp.fromISOString(value);
											}
										};
		}
		this._features = {'dojo.data.api.Read':true, 'dojo.data.api.Identity':true};
		this._itemsByIdentity = null;
		this._storeRefPropName = "_S"; // Default name for the store reference to attach to every item.
		this._itemNumPropName = "_0"; // Default Item Id for isItem to attach to every item.
		this._rootItemPropName = "_RI"; // Default Item Id for isItem to attach to every item.
		this._reverseRefMap = "_RRM"; // Default attribute for constructing a reverse reference map for use with reference integrity
		this._loadInProgress = false; //Got to track the initial load to prevent duelling loads of the dataset.
		this._queuedFetches = [];
		if(keywordParameters.urlPreventCache !== undefined){
			this.urlPreventCache = keywordParameters.urlPreventCache?true:false;
		}
		if(keywordParameters.hierarchical !== undefined){
			this.hierarchical = keywordParameters.hierarchical?true:false;
		}
		if(keywordParameters.clearOnClose){
			this.clearOnClose = true;
		}
		if("failOk" in keywordParameters){
			this.failOk = keywordParameters.failOk?true:false;
		}
	},

	url: "",	// use "" rather than undefined for the benefit of the parser (#3539)

	//Internal var, crossCheckUrl.  Used so that setting either url or _jsonFileUrl, can still trigger a reload
	//when clearOnClose and close is used.
	_ccUrl: "",

	data: null,	// define this so that the parser can populate it

	typeMap: null, //Define so parser can populate.

	//Parameter to allow users to specify if a close call should force a reload or not.
	//By default, it retains the old behavior of not clearing if close is called.  But
	//if set true, the store will be reset to default state.  Note that by doing this,
	//all item handles will become invalid and a new fetch must be issued.
	clearOnClose: false,

	//Parameter to allow specifying if preventCache should be passed to the xhrGet call or not when loading data from a url.
	//Note this does not mean the store calls the server on each fetch, only that the data load has preventCache set as an option.
	//Added for tracker: #6072
	urlPreventCache: false,

	//Parameter for specifying that it is OK for the xhrGet call to fail silently.
	failOk: false,

	//Parameter to indicate to process data from the url as hierarchical
	//(data items can contain other data items in js form).  Default is true
	//for backwards compatibility.  False means only root items are processed
	//as items, all child objects outside of type-mapped objects and those in
	//specific reference format, are left straight JS data objects.
	hierarchical: true,

	_assertIsItem: function(/* item */ item){
		//	summary:
		//		This function tests whether the item passed in is indeed an item in the store.
		//	item:
		//		The item to test for being contained by the store.
		if(!this.isItem(item)){
			throw new Error("dojo.data.ItemFileReadStore: Invalid item argument.");
		}
	},

	_assertIsAttribute: function(/* attribute-name-string */ attribute){
		//	summary:
		//		This function tests whether the item passed in is indeed a valid 'attribute' like type for the store.
		//	attribute:
		//		The attribute to test for being contained by the store.
		if(typeof attribute !== "string"){
			throw new Error("dojo.data.ItemFileReadStore: Invalid attribute argument.");
		}
	},

	getValue: function(	/* item */ item,
						/* attribute-name-string */ attribute,
						/* value? */ defaultValue){
		//	summary:
		//		See dojo.data.api.Read.getValue()
		var values = this.getValues(item, attribute);
		return (values.length > 0)?values[0]:defaultValue; // mixed
	},

	getValues: function(/* item */ item,
						/* attribute-name-string */ attribute){
		//	summary:
		//		See dojo.data.api.Read.getValues()

		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		// Clone it before returning.  refs: #10474
		return (item[attribute] || []).slice(0); // Array
	},

	getAttributes: function(/* item */ item){
		//	summary:
		//		See dojo.data.api.Read.getAttributes()
		this._assertIsItem(item);
		var attributes = [];
		for(var key in item){
			// Save off only the real item attributes, not the special id marks for O(1) isItem.
			if((key !== this._storeRefPropName) && (key !== this._itemNumPropName) && (key !== this._rootItemPropName) && (key !== this._reverseRefMap)){
				attributes.push(key);
			}
		}
		return attributes; // Array
	},

	hasAttribute: function(	/* item */ item,
							/* attribute-name-string */ attribute){
		//	summary:
		//		See dojo.data.api.Read.hasAttribute()
		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		return (attribute in item);
	},

	containsValue: function(/* item */ item,
							/* attribute-name-string */ attribute,
							/* anything */ value){
		//	summary:
		//		See dojo.data.api.Read.containsValue()
		var regexp = undefined;
		if(typeof value === "string"){
			regexp = filterUtil.patternToRegExp(value, false);
		}
		return this._containsValue(item, attribute, value, regexp); //boolean.
	},

	_containsValue: function(	/* item */ item,
								/* attribute-name-string */ attribute,
								/* anything */ value,
								/* RegExp?*/ regexp){
		//	summary:
		//		Internal function for looking at the values contained by the item.
		//	description:
		//		Internal function for looking at the values contained by the item.  This
		//		function allows for denoting if the comparison should be case sensitive for
		//		strings or not (for handling filtering cases where string case should not matter)
		//
		//	item:
		//		The data item to examine for attribute values.
		//	attribute:
		//		The attribute to inspect.
		//	value:
		//		The value to match.
		//	regexp:
		//		Optional regular expression generated off value if value was of string type to handle wildcarding.
		//		If present and attribute values are string, then it can be used for comparison instead of 'value'
		return array.some(this.getValues(item, attribute), function(possibleValue){
			if(possibleValue !== null && !lang.isObject(possibleValue) && regexp){
				if(possibleValue.toString().match(regexp)){
					return true; // Boolean
				}
			}else if(value === possibleValue){
				return true; // Boolean
			}
		});
	},

	isItem: function(/* anything */ something){
		//	summary:
		//		See dojo.data.api.Read.isItem()
		if(something && something[this._storeRefPropName] === this){
			if(this._arrayOfAllItems[something[this._itemNumPropName]] === something){
				return true;
			}
		}
		return false; // Boolean
	},

	isItemLoaded: function(/* anything */ something){
		//	summary:
		//		See dojo.data.api.Read.isItemLoaded()
		return this.isItem(something); //boolean
	},

	loadItem: function(/* object */ keywordArgs){
		//	summary:
		//		See dojo.data.api.Read.loadItem()
		this._assertIsItem(keywordArgs.item);
	},

	getFeatures: function(){
		//	summary:
		//		See dojo.data.api.Read.getFeatures()
		return this._features; //Object
	},

	getLabel: function(/* item */ item){
		//	summary:
		//		See dojo.data.api.Read.getLabel()
		if(this._labelAttr && this.isItem(item)){
			return this.getValue(item,this._labelAttr); //String
		}
		return undefined; //undefined
	},

	getLabelAttributes: function(/* item */ item){
		//	summary:
		//		See dojo.data.api.Read.getLabelAttributes()
		if(this._labelAttr){
			return [this._labelAttr]; //array
		}
		return null; //null
	},

	_fetchItems: function(	/* Object */ keywordArgs,
							/* Function */ findCallback,
							/* Function */ errorCallback){
		//	summary:
		//		See dojo.data.util.simpleFetch.fetch()
		var self = this,
		    filter = function(requestArgs, arrayOfItems){
			var items = [],
			    i, key;
			if(requestArgs.query){
				var value,
				    ignoreCase = requestArgs.queryOptions ? requestArgs.queryOptions.ignoreCase : false;

				//See if there are any string values that can be regexp parsed first to avoid multiple regexp gens on the
				//same value for each item examined.  Much more efficient.
				var regexpList = {};
				for(key in requestArgs.query){
					value = requestArgs.query[key];
					if(typeof value === "string"){
						regexpList[key] = filterUtil.patternToRegExp(value, ignoreCase);
					}else if(value instanceof RegExp){
						regexpList[key] = value;
					}
				}
				for(i = 0; i < arrayOfItems.length; ++i){
					var match = true;
					var candidateItem = arrayOfItems[i];
					if(candidateItem === null){
						match = false;
					}else{
						for(key in requestArgs.query){
							value = requestArgs.query[key];
							if(!self._containsValue(candidateItem, key, value, regexpList[key])){
								match = false;
							}
						}
					}
					if(match){
						items.push(candidateItem);
					}
				}
				findCallback(items, requestArgs);
			}else{
				// We want a copy to pass back in case the parent wishes to sort the array.
				// We shouldn't allow resort of the internal list, so that multiple callers
				// can get lists and sort without affecting each other.  We also need to
				// filter out any null values that have been left as a result of deleteItem()
				// calls in ItemFileWriteStore.
				for(i = 0; i < arrayOfItems.length; ++i){
					var item = arrayOfItems[i];
					if(item !== null){
						items.push(item);
					}
				}
				findCallback(items, requestArgs);
			}
		};

		if(this._loadFinished){
			filter(keywordArgs, this._getItemsArray(keywordArgs.queryOptions));
		}else{
			//Do a check on the JsonFileUrl and crosscheck it.
			//If it doesn't match the cross-check, it needs to be updated
			//This allows for either url or _jsonFileUrl to he changed to
			//reset the store load location.  Done this way for backwards
			//compatibility.  People use _jsonFileUrl (even though officially
			//private.
			if(this._jsonFileUrl !== this._ccUrl){
				kernel.deprecated("dojo.data.ItemFileReadStore: ",
					"To change the url, set the url property of the store," +
					" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
				this._ccUrl = this._jsonFileUrl;
				this.url = this._jsonFileUrl;
			}else if(this.url !== this._ccUrl){
				this._jsonFileUrl = this.url;
				this._ccUrl = this.url;
			}

			//See if there was any forced reset of data.
			if(this.data != null){
				this._jsonData = this.data;
				this.data = null;
			}

			if(this._jsonFileUrl){
				//If fetches come in before the loading has finished, but while
				//a load is in progress, we have to defer the fetching to be
				//invoked in the callback.
				if(this._loadInProgress){
					this._queuedFetches.push({args: keywordArgs, filter: filter});
				}else{
					this._loadInProgress = true;
					var getArgs = {
							url: self._jsonFileUrl,
							handleAs: "json-comment-optional",
							preventCache: this.urlPreventCache,
							failOk: this.failOk
						};
					var getHandler = xhr.get(getArgs);
					getHandler.addCallback(function(data){
						try{
							self._getItemsFromLoadedData(data);
							self._loadFinished = true;
							self._loadInProgress = false;

							filter(keywordArgs, self._getItemsArray(keywordArgs.queryOptions));
							self._handleQueuedFetches();
						}catch(e){
							self._loadFinished = true;
							self._loadInProgress = false;
							errorCallback(e, keywordArgs);
						}
					});
					getHandler.addErrback(function(error){
						self._loadInProgress = false;
						errorCallback(error, keywordArgs);
					});

					//Wire up the cancel to abort of the request
					//This call cancel on the deferred if it hasn't been called
					//yet and then will chain to the simple abort of the
					//simpleFetch keywordArgs
					var oldAbort = null;
					if(keywordArgs.abort){
						oldAbort = keywordArgs.abort;
					}
					keywordArgs.abort = function(){
						var df = getHandler;
						if(df && df.fired === -1){
							df.cancel();
							df = null;
						}
						if(oldAbort){
							oldAbort.call(keywordArgs);
						}
					};
				}
			}else if(this._jsonData){
				try{
					this._loadFinished = true;
					this._getItemsFromLoadedData(this._jsonData);
					this._jsonData = null;
					filter(keywordArgs, this._getItemsArray(keywordArgs.queryOptions));
				}catch(e){
					errorCallback(e, keywordArgs);
				}
			}else{
				errorCallback(new Error("dojo.data.ItemFileReadStore: No JSON source data was provided as either URL or a nested Javascript object."), keywordArgs);
			}
		}
	},

	_handleQueuedFetches: function(){
		//	summary:
		//		Internal function to execute delayed request in the store.
		//Execute any deferred fetches now.
		if(this._queuedFetches.length > 0){
			for(var i = 0; i < this._queuedFetches.length; i++){
				var fData = this._queuedFetches[i],
				    delayedQuery = fData.args,
				    delayedFilter = fData.filter;
				if(delayedFilter){
					delayedFilter(delayedQuery, this._getItemsArray(delayedQuery.queryOptions));
				}else{
					this.fetchItemByIdentity(delayedQuery);
				}
			}
			this._queuedFetches = [];
		}
	},

	_getItemsArray: function(/*object?*/queryOptions){
		//	summary:
		//		Internal function to determine which list of items to search over.
		//	queryOptions: The query options parameter, if any.
		if(queryOptions && queryOptions.deep){
			return this._arrayOfAllItems;
		}
		return this._arrayOfTopLevelItems;
	},

	close: function(/*dojo.data.api.Request || keywordArgs || null */ request){
		 //	summary:
		 //		See dojo.data.api.Read.close()
		 if(this.clearOnClose &&
			this._loadFinished &&
			!this._loadInProgress){
			 //Reset all internalsback to default state.  This will force a reload
			 //on next fetch.  This also checks that the data or url param was set
			 //so that the store knows it can get data.  Without one of those being set,
			 //the next fetch will trigger an error.

			 if(((this._jsonFileUrl == "" || this._jsonFileUrl == null) &&
				 (this.url == "" || this.url == null)
				) && this.data == null){
				 console.debug("dojo.data.ItemFileReadStore: WARNING!  Data reload " +
					" information has not been provided." +
					"  Please set 'url' or 'data' to the appropriate value before" +
					" the next fetch");
			 }
			 this._arrayOfAllItems = [];
			 this._arrayOfTopLevelItems = [];
			 this._loadFinished = false;
			 this._itemsByIdentity = null;
			 this._loadInProgress = false;
			 this._queuedFetches = [];
		 }
	},

	_getItemsFromLoadedData: function(/* Object */ dataObject){
		//	summary:
		//		Function to parse the loaded data into item format and build the internal items array.
		//	description:
		//		Function to parse the loaded data into item format and build the internal items array.
		//
		//	dataObject:
		//		The JS data object containing the raw data to convery into item format.
		//
		// 	returns: array
		//		Array of items in store item format.

		// First, we define a couple little utility functions...
		var addingArrays = false,
		    self = this;

		function valueIsAnItem(/* anything */ aValue){
			// summary:
			//		Given any sort of value that could be in the raw json data,
			//		return true if we should interpret the value as being an
			//		item itself, rather than a literal value or a reference.
			// example:
			// 	|	false == valueIsAnItem("Kermit");
			// 	|	false == valueIsAnItem(42);
			// 	|	false == valueIsAnItem(new Date());
			// 	|	false == valueIsAnItem({_type:'Date', _value:'1802-05-14'});
			// 	|	false == valueIsAnItem({_reference:'Kermit'});
			// 	|	true == valueIsAnItem({name:'Kermit', color:'green'});
			// 	|	true == valueIsAnItem({iggy:'pop'});
			// 	|	true == valueIsAnItem({foo:42});
			return (aValue !== null) &&
				(typeof aValue === "object") &&
				(!lang.isArray(aValue) || addingArrays) &&
				(!lang.isFunction(aValue)) &&
				(aValue.constructor == Object || lang.isArray(aValue)) &&
				(typeof aValue._reference === "undefined") &&
				(typeof aValue._type === "undefined") &&
				(typeof aValue._value === "undefined") &&
				self.hierarchical;
		}

		function addItemAndSubItemsToArrayOfAllItems(/* Item */ anItem){
			self._arrayOfAllItems.push(anItem);
			for(var attribute in anItem){
				var valueForAttribute = anItem[attribute];
				if(valueForAttribute){
					if(lang.isArray(valueForAttribute)){
						var valueArray = valueForAttribute;
						for(var k = 0; k < valueArray.length; ++k){
							var singleValue = valueArray[k];
							if(valueIsAnItem(singleValue)){
								addItemAndSubItemsToArrayOfAllItems(singleValue);
							}
						}
					}else{
						if(valueIsAnItem(valueForAttribute)){
							addItemAndSubItemsToArrayOfAllItems(valueForAttribute);
						}
					}
				}
			}
		}

		this._labelAttr = dataObject.label;

		// We need to do some transformations to convert the data structure
		// that we read from the file into a format that will be convenient
		// to work with in memory.

		// Step 1: Walk through the object hierarchy and build a list of all items
		var i,
		    item;
		this._arrayOfAllItems = [];
		this._arrayOfTopLevelItems = dataObject.items;

		for(i = 0; i < this._arrayOfTopLevelItems.length; ++i){
			item = this._arrayOfTopLevelItems[i];
			if(lang.isArray(item)){
				addingArrays = true;
			}
			addItemAndSubItemsToArrayOfAllItems(item);
			item[this._rootItemPropName]=true;
		}

		// Step 2: Walk through all the attribute values of all the items,
		// and replace single values with arrays.  For example, we change this:
		//		{ name:'Miss Piggy', pets:'Foo-Foo'}
		// into this:
		//		{ name:['Miss Piggy'], pets:['Foo-Foo']}
		//
		// We also store the attribute names so we can validate our store
		// reference and item id special properties for the O(1) isItem
		var allAttributeNames = {},
		    key;

		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i];
			for(key in item){
				if(key !== this._rootItemPropName){
					var value = item[key];
					if(value !== null){
						if(!lang.isArray(value)){
							item[key] = [value];
						}
					}else{
						item[key] = [null];
					}
				}
				allAttributeNames[key]=key;
			}
		}

		// Step 3: Build unique property names to use for the _storeRefPropName and _itemNumPropName
		// This should go really fast, it will generally never even run the loop.
		while(allAttributeNames[this._storeRefPropName]){
			this._storeRefPropName += "_";
		}
		while(allAttributeNames[this._itemNumPropName]){
			this._itemNumPropName += "_";
		}
		while(allAttributeNames[this._reverseRefMap]){
			this._reverseRefMap += "_";
		}

		// Step 4: Some data files specify an optional 'identifier', which is
		// the name of an attribute that holds the identity of each item.
		// If this data file specified an identifier attribute, then build a
		// hash table of items keyed by the identity of the items.
		var arrayOfValues;

		var identifier = dataObject.identifier;
		if(identifier){
			this._itemsByIdentity = {};
			this._features['dojo.data.api.Identity'] = identifier;
			for(i = 0; i < this._arrayOfAllItems.length; ++i){
				item = this._arrayOfAllItems[i];
				arrayOfValues = item[identifier];
				var identity = arrayOfValues[0];
				if(!Object.hasOwnProperty.call(this._itemsByIdentity, identity)){
					this._itemsByIdentity[identity] = item;
				}else{
					if(this._jsonFileUrl){
						throw new Error("dojo.data.ItemFileReadStore:  The json data as specified by: [" + this._jsonFileUrl + "] is malformed.  Items within the list have identifier: [" + identifier + "].  Value collided: [" + identity + "]");
					}else if(this._jsonData){
						throw new Error("dojo.data.ItemFileReadStore:  The json data provided by the creation arguments is malformed.  Items within the list have identifier: [" + identifier + "].  Value collided: [" + identity + "]");
					}
				}
			}
		}else{
			this._features['dojo.data.api.Identity'] = Number;
		}

		// Step 5: Walk through all the items, and set each item's properties
		// for _storeRefPropName and _itemNumPropName, so that store.isItem() will return true.
		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i];
			item[this._storeRefPropName] = this;
			item[this._itemNumPropName] = i;
		}

		// Step 6: We walk through all the attribute values of all the items,
		// looking for type/value literals and item-references.
		//
		// We replace item-references with pointers to items.  For example, we change:
		//		{ name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
		// into this:
		//		{ name:['Kermit'], friends:[miss_piggy] }
		// (where miss_piggy is the object representing the 'Miss Piggy' item).
		//
		// We replace type/value pairs with typed-literals.  For example, we change:
		//		{ name:['Nelson Mandela'], born:[{_type:'Date', _value:'1918-07-18'}] }
		// into this:
		//		{ name:['Kermit'], born:(new Date(1918, 6, 18)) }
		//
		// We also generate the associate map for all items for the O(1) isItem function.
		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i]; // example: { name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
			for(key in item){
				arrayOfValues = item[key]; // example: [{_reference:{name:'Miss Piggy'}}]
				for(var j = 0; j < arrayOfValues.length; ++j){
					value = arrayOfValues[j]; // example: {_reference:{name:'Miss Piggy'}}
					if(value !== null && typeof value == "object"){
						if(("_type" in value) && ("_value" in value)){
							var type = value._type; // examples: 'Date', 'Color', or 'ComplexNumber'
							var mappingObj = this._datatypeMap[type]; // examples: Date, dojo.Color, foo.math.ComplexNumber, {type: dojo.Color, deserialize(value){ return new dojo.Color(value)}}
							if(!mappingObj){
								throw new Error("dojo.data.ItemFileReadStore: in the typeMap constructor arg, no object class was specified for the datatype '" + type + "'");
							}else if(lang.isFunction(mappingObj)){
								arrayOfValues[j] = new mappingObj(value._value);
							}else if(lang.isFunction(mappingObj.deserialize)){
								arrayOfValues[j] = mappingObj.deserialize(value._value);
							}else{
								throw new Error("dojo.data.ItemFileReadStore: Value provided in typeMap was neither a constructor, nor a an object with a deserialize function");
							}
						}
						if(value._reference){
							var referenceDescription = value._reference; // example: {name:'Miss Piggy'}
							if(!lang.isObject(referenceDescription)){
								// example: 'Miss Piggy'
								// from an item like: { name:['Kermit'], friends:[{_reference:'Miss Piggy'}]}
								arrayOfValues[j] = this._getItemByIdentity(referenceDescription);
							}else{
								// example: {name:'Miss Piggy'}
								// from an item like: { name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
								for(var k = 0; k < this._arrayOfAllItems.length; ++k){
									var candidateItem = this._arrayOfAllItems[k],
									    found = true;
									for(var refKey in referenceDescription){
										if(candidateItem[refKey] != referenceDescription[refKey]){
											found = false;
										}
									}
									if(found){
										arrayOfValues[j] = candidateItem;
									}
								}
							}
							if(this.referenceIntegrity){
								var refItem = arrayOfValues[j];
								if(this.isItem(refItem)){
									this._addReferenceToMap(refItem, item, key);
								}
							}
						}else if(this.isItem(value)){
							//It's a child item (not one referenced through _reference).
							//We need to treat this as a referenced item, so it can be cleaned up
							//in a write store easily.
							if(this.referenceIntegrity){
								this._addReferenceToMap(value, item, key);
							}
						}
					}
				}
			}
		}
	},

	_addReferenceToMap: function(/*item*/ refItem, /*item*/ parentItem, /*string*/ attribute){
		 //	summary:
		 //		Method to add an reference map entry for an item and attribute.
		 //	description:
		 //		Method to add an reference map entry for an item and attribute. 		 //
		 //	refItem:
		 //		The item that is referenced.
		 //	parentItem:
		 //		The item that holds the new reference to refItem.
		 //	attribute:
		 //		The attribute on parentItem that contains the new reference.

		 //Stub function, does nothing.  Real processing is in ItemFileWriteStore.
	},

	getIdentity: function(/* item */ item){
		//	summary:
		//		See dojo.data.api.Identity.getIdentity()
		var identifier = this._features['dojo.data.api.Identity'];
		if(identifier === Number){
			return item[this._itemNumPropName]; // Number
		}else{
			var arrayOfValues = item[identifier];
			if(arrayOfValues){
				return arrayOfValues[0]; // Object || String
			}
		}
		return null; // null
	},

	fetchItemByIdentity: function(/* Object */ keywordArgs){
		//	summary:
		//		See dojo.data.api.Identity.fetchItemByIdentity()

		// Hasn't loaded yet, we have to trigger the load.
		var item,
		    scope;
		if(!this._loadFinished){
			var self = this;
			//Do a check on the JsonFileUrl and crosscheck it.
			//If it doesn't match the cross-check, it needs to be updated
			//This allows for either url or _jsonFileUrl to he changed to
			//reset the store load location.  Done this way for backwards
			//compatibility.  People use _jsonFileUrl (even though officially
			//private.
			if(this._jsonFileUrl !== this._ccUrl){
				kernel.deprecated("dojo.data.ItemFileReadStore: ",
					"To change the url, set the url property of the store," +
					" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
				this._ccUrl = this._jsonFileUrl;
				this.url = this._jsonFileUrl;
			}else if(this.url !== this._ccUrl){
				this._jsonFileUrl = this.url;
				this._ccUrl = this.url;
			}

			//See if there was any forced reset of data.
			if(this.data != null && this._jsonData == null){
				this._jsonData = this.data;
				this.data = null;
			}

			if(this._jsonFileUrl){

				if(this._loadInProgress){
					this._queuedFetches.push({args: keywordArgs});
				}else{
					this._loadInProgress = true;
					var getArgs = {
							url: self._jsonFileUrl,
							handleAs: "json-comment-optional",
							preventCache: this.urlPreventCache,
							failOk: this.failOk
					};
					var getHandler = xhr.get(getArgs);
					getHandler.addCallback(function(data){
						var scope = keywordArgs.scope?keywordArgs.scope:window.global;
						try{
							self._getItemsFromLoadedData(data);
							self._loadFinished = true;
							self._loadInProgress = false;
							item = self._getItemByIdentity(keywordArgs.identity);
							if(keywordArgs.onItem){
								keywordArgs.onItem.call(scope, item);
							}
							self._handleQueuedFetches();
						}catch(error){
							self._loadInProgress = false;
							if(keywordArgs.onError){
								keywordArgs.onError.call(scope, error);
							}
						}
					});
					getHandler.addErrback(function(error){
						self._loadInProgress = false;
						if(keywordArgs.onError){
							var scope = keywordArgs.scope?keywordArgs.scope:window.global;
							keywordArgs.onError.call(scope, error);
						}
					});
				}

			}else if(this._jsonData){
				// Passed in data, no need to xhr.
				self._getItemsFromLoadedData(self._jsonData);
				self._jsonData = null;
				self._loadFinished = true;
				item = self._getItemByIdentity(keywordArgs.identity);
				if(keywordArgs.onItem){
					scope = keywordArgs.scope?keywordArgs.scope:window.global;
					keywordArgs.onItem.call(scope, item);
				}
			}
		}else{
			// Already loaded.  We can just look it up and call back.
			item = this._getItemByIdentity(keywordArgs.identity);
			if(keywordArgs.onItem){
				scope = keywordArgs.scope?keywordArgs.scope:window.global;
				keywordArgs.onItem.call(scope, item);
			}
		}
	},

	_getItemByIdentity: function(/* Object */ identity){
		//	summary:
		//		Internal function to look an item up by its identity map.
		var item = null;
		if(this._itemsByIdentity){
			// If this map is defined, we need to just try to get it.  If it fails
			// the item does not exist.
			if(Object.hasOwnProperty.call(this._itemsByIdentity, identity)){
				item = this._itemsByIdentity[identity];
			}
		}else if (Object.hasOwnProperty.call(this._arrayOfAllItems, identity)){
			item = this._arrayOfAllItems[identity];
		}
		if(item === undefined){
			item = null;
		}
		return item; // Object
	},

	getIdentityAttributes: function(/* item */ item){
		//	summary:
		//		See dojo.data.api.Identity.getIdentityAttributes()

		var identifier = this._features['dojo.data.api.Identity'];
		if(identifier === Number){
			// If (identifier === Number) it means getIdentity() just returns
			// an integer item-number for each item.  The dojo.data.api.Identity
			// spec says we need to return null if the identity is not composed
			// of attributes
			return null; // null
		}else{
			return [identifier]; // Array
		}
	},

	_forceLoad: function(){
		//	summary:
		//		Internal function to force a load of the store if it hasn't occurred yet.  This is required
		//		for specific functions to work properly.
		var self = this;
		//Do a check on the JsonFileUrl and crosscheck it.
		//If it doesn't match the cross-check, it needs to be updated
		//This allows for either url or _jsonFileUrl to he changed to
		//reset the store load location.  Done this way for backwards
		//compatibility.  People use _jsonFileUrl (even though officially
		//private.
		if(this._jsonFileUrl !== this._ccUrl){
			kernel.deprecated("dojo.data.ItemFileReadStore: ",
				"To change the url, set the url property of the store," +
				" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
			this._ccUrl = this._jsonFileUrl;
			this.url = this._jsonFileUrl;
		}else if(this.url !== this._ccUrl){
			this._jsonFileUrl = this.url;
			this._ccUrl = this.url;
		}

		//See if there was any forced reset of data.
		if(this.data != null){
			this._jsonData = this.data;
			this.data = null;
		}

		if(this._jsonFileUrl){
				var getArgs = {
					url: this._jsonFileUrl,
					handleAs: "json-comment-optional",
					preventCache: this.urlPreventCache,
					failOk: this.failOk,
					sync: true
				};
			var getHandler = xhr.get(getArgs);
			getHandler.addCallback(function(data){
				try{
					//Check to be sure there wasn't another load going on concurrently
					//So we don't clobber data that comes in on it.  If there is a load going on
					//then do not save this data.  It will potentially clobber current data.
					//We mainly wanted to sync/wait here.
					//TODO:  Revisit the loading scheme of this store to improve multi-initial
					//request handling.
					if(self._loadInProgress !== true && !self._loadFinished){
						self._getItemsFromLoadedData(data);
						self._loadFinished = true;
					}else if(self._loadInProgress){
						//Okay, we hit an error state we can't recover from.  A forced load occurred
						//while an async load was occurring.  Since we cannot block at this point, the best
						//that can be managed is to throw an error.
						throw new Error("dojo.data.ItemFileReadStore:  Unable to perform a synchronous load, an async load is in progress.");
					}
				}catch(e){
					console.log(e);
					throw e;
				}
			});
			getHandler.addErrback(function(error){
				throw error;
			});
		}else if(this._jsonData){
			self._getItemsFromLoadedData(self._jsonData);
			self._jsonData = null;
			self._loadFinished = true;
		}
	}
});
//Mix in the simple fetch implementation to this class.
lang.extend(ItemFileReadStore,simpleFetch);

return ItemFileReadStore;
});

},
'dijit/form/ValidationTextBox':function(){
require({cache:{
'url:dijit/form/templates/ValidationTextBox.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\"\r\n\tid=\"widget_${id}\" role=\"presentation\"\r\n\t><div class='dijitReset dijitValidationContainer'\r\n\t\t><input class=\"dijitReset dijitInputField dijitValidationIcon dijitValidationInner\" value=\"&#935; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t/></div\r\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\r\n\t\t><input class=\"dijitReset dijitInputInner\" data-dojo-attach-point='textbox,focusNode' autocomplete=\"off\"\r\n\t\t\t${!nameAttrSetting} type='${type}'\r\n\t/></div\r\n></div>\r\n"}});
define("dijit/form/ValidationTextBox", [
	"dojo/_base/declare", // declare
	"dojo/i18n", // i18n.getLocalization
	"./TextBox",
	"../Tooltip",
	"dojo/text!./templates/ValidationTextBox.html",
	"dojo/i18n!./nls/validate"
], function(declare, i18n, TextBox, Tooltip, template){

/*=====
	var Tooltip = dijit.Tooltip;
	var TextBox = dijit.form.TextBox;
=====*/

	// module:
	//		dijit/form/ValidationTextBox
	// summary:
	//		Base class for textbox widgets with the ability to validate content of various types and provide user feedback.


	/*=====
		dijit.form.ValidationTextBox.__Constraints = function(){
			// locale: String
			//		locale used for validation, picks up value from this widget's lang attribute
			// _flags_: anything
			//		various flags passed to regExpGen function
			this.locale = "";
			this._flags_ = "";
		}
	=====*/

	return declare("dijit.form.ValidationTextBox", TextBox, {
		// summary:
		//		Base class for textbox widgets with the ability to validate content of various types and provide user feedback.
		// tags:
		//		protected

		templateString: template,
		baseClass: "dijitTextBox dijitValidationTextBox",

		// required: Boolean
		//		User is required to enter data into this field.
		required: false,

		// promptMessage: String
		//		If defined, display this hint string immediately on focus to the textbox, if empty.
		//		Also displays if the textbox value is Incomplete (not yet valid but will be with additional input).
		//		Think of this like a tooltip that tells the user what to do, not an error message
		//		that tells the user what they've done wrong.
		//
		//		Message disappears when user starts typing.
		promptMessage: "",

		// invalidMessage: String
		// 		The message to display if value is invalid.
		//		The translated string value is read from the message file by default.
		// 		Set to "" to use the promptMessage instead.
		invalidMessage: "$_unset_$",

		// missingMessage: String
		// 		The message to display if value is empty and the field is required.
		//		The translated string value is read from the message file by default.
		// 		Set to "" to use the invalidMessage instead.
		missingMessage: "$_unset_$",

		// message: String
		//		Currently error/prompt message.
		//		When using the default tooltip implementation, this will only be
		//		displayed when the field is focused.
		message: "",

		// constraints: dijit.form.ValidationTextBox.__Constraints
		//		user-defined object needed to pass parameters to the validator functions
		constraints: {},

		// regExp: [extension protected] String
		//		regular expression string used to validate the input
		//		Do not specify both regExp and regExpGen
		regExp: ".*",

		regExpGen: function(/*dijit.form.ValidationTextBox.__Constraints*/ /*===== constraints =====*/){
			// summary:
			//		Overridable function used to generate regExp when dependent on constraints.
			//		Do not specify both regExp and regExpGen.
			// tags:
			//		extension protected
			return this.regExp; // String
		},

		// state: [readonly] String
		//		Shows current state (ie, validation result) of input (""=Normal, Incomplete, or Error)
		state: "",

		// tooltipPosition: String[]
		//		See description of `dijit.Tooltip.defaultPosition` for details on this parameter.
		tooltipPosition: [],

		_setValueAttr: function(){
			// summary:
			//		Hook so set('value', ...) works.
			this.inherited(arguments);
			this.validate(this.focused);
		},

		validator: function(/*anything*/ value, /*dijit.form.ValidationTextBox.__Constraints*/ constraints){
			// summary:
			//		Overridable function used to validate the text input against the regular expression.
			// tags:
			//		protected
			return (new RegExp("^(?:" + this.regExpGen(constraints) + ")"+(this.required?"":"?")+"$")).test(value) &&
				(!this.required || !this._isEmpty(value)) &&
				(this._isEmpty(value) || this.parse(value, constraints) !== undefined); // Boolean
		},

		_isValidSubset: function(){
			// summary:
			//		Returns true if the value is either already valid or could be made valid by appending characters.
			//		This is used for validation while the user [may be] still typing.
			return this.textbox.value.search(this._partialre) == 0;
		},

		isValid: function(/*Boolean*/ /*===== isFocused =====*/){
			// summary:
			//		Tests if value is valid.
			//		Can override with your own routine in a subclass.
			// tags:
			//		protected
			return this.validator(this.textbox.value, this.constraints);
		},

		_isEmpty: function(value){
			// summary:
			//		Checks for whitespace
			return (this.trim ? /^\s*$/ : /^$/).test(value); // Boolean
		},

		getErrorMessage: function(/*Boolean*/ /*===== isFocused =====*/){
			// summary:
			//		Return an error message to show if appropriate
			// tags:
			//		protected
			return (this.required && this._isEmpty(this.textbox.value)) ? this.missingMessage : this.invalidMessage; // String
		},

		getPromptMessage: function(/*Boolean*/ /*===== isFocused =====*/){
			// summary:
			//		Return a hint message to show when widget is first focused
			// tags:
			//		protected
			return this.promptMessage; // String
		},

		_maskValidSubsetError: true,
		validate: function(/*Boolean*/ isFocused){
			// summary:
			//		Called by oninit, onblur, and onkeypress.
			// description:
			//		Show missing or invalid messages if appropriate, and highlight textbox field.
			// tags:
			//		protected
			var message = "";
			var isValid = this.disabled || this.isValid(isFocused);
			if(isValid){ this._maskValidSubsetError = true; }
			var isEmpty = this._isEmpty(this.textbox.value);
			var isValidSubset = !isValid && isFocused && this._isValidSubset();
			this._set("state", isValid ? "" : (((((!this._hasBeenBlurred || isFocused) && isEmpty) || isValidSubset) && this._maskValidSubsetError) ? "Incomplete" : "Error"));
			this.focusNode.setAttribute("aria-invalid", isValid ? "false" : "true");

			if(this.state == "Error"){
				this._maskValidSubsetError = isFocused && isValidSubset; // we want the error to show up after a blur and refocus
				message = this.getErrorMessage(isFocused);
			}else if(this.state == "Incomplete"){
				message = this.getPromptMessage(isFocused); // show the prompt whenever the value is not yet complete
				this._maskValidSubsetError = !this._hasBeenBlurred || isFocused; // no Incomplete warnings while focused
			}else if(isEmpty){
				message = this.getPromptMessage(isFocused); // show the prompt whenever there's no error and no text
			}
			this.set("message", message);

			return isValid;
		},

		displayMessage: function(/*String*/ message){
			// summary:
			//		Overridable method to display validation errors/hints.
			//		By default uses a tooltip.
			// tags:
			//		extension
			if(message && this.focused){
				Tooltip.show(message, this.domNode, this.tooltipPosition, !this.isLeftToRight());
			}else{
				Tooltip.hide(this.domNode);
			}
		},

		_refreshState: function(){
			// Overrides TextBox._refreshState()
			this.validate(this.focused);
			this.inherited(arguments);
		},

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		constructor: function(){
			this.constraints = {};
		},

		_setConstraintsAttr: function(/*Object*/ constraints){
			if(!constraints.locale && this.lang){
				constraints.locale = this.lang;
			}
			this._set("constraints", constraints);
			this._computePartialRE();
		},

		_computePartialRE: function(){
			var p = this.regExpGen(this.constraints);
			this.regExp = p;
			var partialre = "";
			// parse the regexp and produce a new regexp that matches valid subsets
			// if the regexp is .* then there's no use in matching subsets since everything is valid
			if(p != ".*"){ this.regExp.replace(/\\.|\[\]|\[.*?[^\\]{1}\]|\{.*?\}|\(\?[=:!]|./g,
				function(re){
					switch(re.charAt(0)){
						case '{':
						case '+':
						case '?':
						case '*':
						case '^':
						case '$':
						case '|':
						case '(':
							partialre += re;
							break;
						case ")":
							partialre += "|$)";
							break;
						 default:
							partialre += "(?:"+re+"|$)";
							break;
					}
				}
			);}
			try{ // this is needed for now since the above regexp parsing needs more test verification
				"".search(partialre);
			}catch(e){ // should never be here unless the original RE is bad or the parsing is bad
				partialre = this.regExp;
				console.warn('RegExp error in ' + this.declaredClass + ': ' + this.regExp);
			} // should never be here unless the original RE is bad or the parsing is bad
			this._partialre = "^(?:" + partialre + ")$";
		},

		postMixInProperties: function(){
			this.inherited(arguments);
			this.messages = i18n.getLocalization("dijit.form", "validate", this.lang);
			if(this.invalidMessage == "$_unset_$"){ this.invalidMessage = this.messages.invalidMessage; }
			if(!this.invalidMessage){ this.invalidMessage = this.promptMessage; }
			if(this.missingMessage == "$_unset_$"){ this.missingMessage = this.messages.missingMessage; }
			if(!this.missingMessage){ this.missingMessage = this.invalidMessage; }
			this._setConstraintsAttr(this.constraints); // this needs to happen now (and later) due to codependency on _set*Attr calls attachPoints
		},

		_setDisabledAttr: function(/*Boolean*/ value){
			this.inherited(arguments);	// call FormValueWidget._setDisabledAttr()
			this._refreshState();
		},

		_setRequiredAttr: function(/*Boolean*/ value){
			this._set("required", value);
			this.focusNode.setAttribute("aria-required", value);
			this._refreshState();
		},

		_setMessageAttr: function(/*String*/ message){
			this._set("message", message);
			this.displayMessage(message);
		},

		reset:function(){
			// Overrides dijit.form.TextBox.reset() by also
			// hiding errors about partial matches
			this._maskValidSubsetError = true;
			this.inherited(arguments);
		},

		_onBlur: function(){
			// the message still exists but for back-compat, and to erase the tooltip
			// (if the message is being displayed as a tooltip), call displayMessage('')
			this.displayMessage('');

			this.inherited(arguments);
		}
	});
});

},
'dojo/data/util/filter':function(){
define(["dojo/_base/lang"], function(lang) {
	// module:
	//		dojo/data/util/filter
	// summary:
	//		TODOC

var filter = lang.getObject("dojo.data.util.filter", true);

filter.patternToRegExp = function(/*String*/pattern, /*boolean?*/ ignoreCase){
	//	summary:
	//		Helper function to convert a simple pattern to a regular expression for matching.
	//	description:
	//		Returns a regular expression object that conforms to the defined conversion rules.
	//		For example:
	//			ca*   -> /^ca.*$/
	//			*ca*  -> /^.*ca.*$/
	//			*c\*a*  -> /^.*c\*a.*$/
	//			*c\*a?*  -> /^.*c\*a..*$/
	//			and so on.
	//
	//	pattern: string
	//		A simple matching pattern to convert that follows basic rules:
	//			* Means match anything, so ca* means match anything starting with ca
	//			? Means match single character.  So, b?b will match to bob and bab, and so on.
	//      	\ is an escape character.  So for example, \* means do not treat * as a match, but literal character *.
	//				To use a \ as a character in the string, it must be escaped.  So in the pattern it should be
	//				represented by \\ to be treated as an ordinary \ character instead of an escape.
	//
	//	ignoreCase:
	//		An optional flag to indicate if the pattern matching should be treated as case-sensitive or not when comparing
	//		By default, it is assumed case sensitive.

	var rxp = "^";
	var c = null;
	for(var i = 0; i < pattern.length; i++){
		c = pattern.charAt(i);
		switch(c){
			case '\\':
				rxp += c;
				i++;
				rxp += pattern.charAt(i);
				break;
			case '*':
				rxp += ".*"; break;
			case '?':
				rxp += "."; break;
			case '$':
			case '^':
			case '/':
			case '+':
			case '.':
			case '|':
			case '(':
			case ')':
			case '{':
			case '}':
			case '[':
			case ']':
				rxp += "\\"; //fallthrough
			default:
				rxp += c;
		}
	}
	rxp += "$";
	if(ignoreCase){
		return new RegExp(rxp,"mi"); //RegExp
	}else{
		return new RegExp(rxp,"m"); //RegExp
	}

};

return filter;
});

},
'dijit/form/FilteringSelect':function(){
define("dijit/form/FilteringSelect", [
	"dojo/data/util/filter", // filter.patternToRegExp
	"dojo/_base/declare", // declare
	"dojo/_base/Deferred", // Deferred.when
	"dojo/_base/lang", // lang.mixin
	"./MappedTextBox",
	"./ComboBoxMixin"
], function(filter, declare, Deferred, lang, MappedTextBox, ComboBoxMixin){

/*=====
	var MappedTextBox = dijit.form.MappedTextBox;
	var ComboBoxMixin = dijit.form.ComboBoxMixin;
=====*/

	// module:
	//		dijit/form/FilteringSelect
	// summary:
	//		An enhanced version of the HTML SELECT tag, populated dynamically


	return declare("dijit.form.FilteringSelect", [MappedTextBox, ComboBoxMixin], {
		// summary:
		//		An enhanced version of the HTML SELECT tag, populated dynamically
		//
		// description:
		//		An enhanced version of the HTML SELECT tag, populated dynamically. It works
		//		very nicely with very large data sets because it can load and page data as needed.
		//		It also resembles ComboBox, but does not allow values outside of the provided ones.
		//		If OPTION tags are used as the data provider via markup, then the
		//		OPTION tag's child text node is used as the displayed value when selected
		//		while the OPTION tag's value attribute is used as the widget value on form submit.
		//		To set the default value when using OPTION tags, specify the selected
		//		attribute on 1 of the child OPTION tags.
		//
		//		Similar features:
		//			- There is a drop down list of possible values.
		//			- You can only enter a value from the drop down list.  (You can't
		//				enter an arbitrary value.)
		//			- The value submitted with the form is the hidden value (ex: CA),
		//				not the displayed value a.k.a. label (ex: California)
		//
		//		Enhancements over plain HTML version:
		//			- If you type in some text then it will filter down the list of
		//				possible values in the drop down list.
		//			- List can be specified either as a static list or via a javascript
		//				function (that can get the list from a server)

		// required: Boolean
		//		True (default) if user is required to enter a value into this field.
		required: true,

		_lastDisplayedValue: "",

		_isValidSubset: function(){
			return this._opened;
		},

		isValid: function(){
			// Overrides ValidationTextBox.isValid()
			return this.item || (!this.required && this.get('displayedValue') == ""); // #5974
		},

		_refreshState: function(){
			if(!this.searchTimer){ // state will be refreshed after results are returned
				this.inherited(arguments);
			}
		},

		_callbackSetLabel: function(
						/*Array*/ result,
						/*Object*/ query,
						/*Object*/ options,
						/*Boolean?*/ priorityChange){
			// summary:
			//		Callback from dojo.store after lookup of user entered value finishes

			// setValue does a synchronous lookup,
			// so it calls _callbackSetLabel directly,
			// and so does not pass dataObject
			// still need to test against _lastQuery in case it came too late
			if((query && query[this.searchAttr] !== this._lastQuery) || (!query && result.length && this.store.getIdentity(result[0]) != this._lastQuery)){
				return;
			}
			if(!result.length){
				//#3268: don't modify display value on bad input
				//#3285: change CSS to indicate error
				this.set("value", '', priorityChange || (priorityChange === undefined && !this.focused), this.textbox.value, null);
			}else{
				this.set('item', result[0], priorityChange);
			}
		},

		_openResultList: function(/*Object*/ results, /*Object*/ query, /*Object*/ options){
			// Callback when a data store query completes.
			// Overrides ComboBox._openResultList()

			// #3285: tap into search callback to see if user's query resembles a match
			if(query[this.searchAttr] !== this._lastQuery){
				return;
			}
			this.inherited(arguments);

			if(this.item === undefined){ // item == undefined for keyboard search
				// If the search returned no items that means that the user typed
				// in something invalid (and they can't make it valid by typing more characters),
				// so flag the FilteringSelect as being in an invalid state
				this.validate(true);
			}
		},

		_getValueAttr: function(){
			// summary:
			//		Hook for get('value') to work.

			// don't get the textbox value but rather the previously set hidden value.
			// Use this.valueNode.value which isn't always set for other MappedTextBox widgets until blur
			return this.valueNode.value;
		},

		_getValueField: function(){
			// Overrides ComboBox._getValueField()
			return "value";
		},

		_setValueAttr: function(/*String*/ value, /*Boolean?*/ priorityChange, /*String?*/ displayedValue, /*item?*/ item){
			// summary:
			//		Hook so set('value', value) works.
			// description:
			//		Sets the value of the select.
			//		Also sets the label to the corresponding value by reverse lookup.
			if(!this._onChangeActive){ priorityChange = null; }

			if(item === undefined){
				if(value === null || value === ''){
					value = '';
					if(!lang.isString(displayedValue)){
						this._setDisplayedValueAttr(displayedValue||'', priorityChange);
						return;
					}
				}

				var self = this;
				this._lastQuery = value;
				Deferred.when(this.store.get(value), function(item){
					self._callbackSetLabel(item? [item] : [], undefined, undefined, priorityChange);
				});
			}else{
				this.valueNode.value = value;
				this.inherited(arguments);
			}
		},

		_setItemAttr: function(/*item*/ item, /*Boolean?*/ priorityChange, /*String?*/ displayedValue){
			// summary:
			//		Set the displayed valued in the input box, and the hidden value
			//		that gets submitted, based on a dojo.data store item.
			// description:
			//		Users shouldn't call this function; they should be calling
			//		set('item', value)
			// tags:
			//		private
			this.inherited(arguments);
			this._lastDisplayedValue = this.textbox.value;
		},

		_getDisplayQueryString: function(/*String*/ text){
			return text.replace(/([\\\*\?])/g, "\\$1");
		},

		_setDisplayedValueAttr: function(/*String*/ label, /*Boolean?*/ priorityChange){
			// summary:
			//		Hook so set('displayedValue', label) works.
			// description:
			//		Sets textbox to display label. Also performs reverse lookup
			//		to set the hidden value.  label should corresponding to item.searchAttr.

			if(label == null){ label = ''; }

			// This is called at initialization along with every custom setter.
			// Usually (or always?) the call can be ignored.   If it needs to be
			// processed then at least make sure that the XHR request doesn't trigger an onChange()
			// event, even if it returns after creation has finished
			if(!this._created){
				if(!("displayedValue" in this.params)){
					return;
				}
				priorityChange = false;
			}

			// Do a reverse lookup to map the specified displayedValue to the hidden value.
			// Note that if there's a custom labelFunc() this code
			if(this.store){
				this.closeDropDown();
				var query = lang.clone(this.query); // #6196: populate query with user-specifics

				// Generate query
				var qs = this._getDisplayQueryString(label), q;
				if(this.store._oldAPI){
					// remove this branch for 2.0
					q = qs;
				}else{
					// Query on searchAttr is a regex for benefit of dojo.store.Memory,
					// but with a toString() method to help dojo.store.JsonRest.
					// Search string like "Co*" converted to regex like /^Co.*$/i.
					q = filter.patternToRegExp(qs, this.ignoreCase);
					q.toString = function(){ return qs; };
				}
				this._lastQuery = query[this.searchAttr] = q;

				// If the label is not valid, the callback will never set it,
				// so the last valid value will get the warning textbox.   Set the
				// textbox value now so that the impending warning will make
				// sense to the user
				this.textbox.value = label;
				this._lastDisplayedValue = label;
				this._set("displayedValue", label);	// for watch("displayedValue") notification
				var _this = this;
				var options = {
					ignoreCase: this.ignoreCase,
					deep: true
				};
				lang.mixin(options, this.fetchProperties);
				this._fetchHandle = this.store.query(query, options);
				Deferred.when(this._fetchHandle, function(result){
					_this._fetchHandle = null;
					_this._callbackSetLabel(result || [], query, options, priorityChange);
				}, function(err){
					_this._fetchHandle = null;
					if(!_this._cancelingQuery){	// don't treat canceled query as an error
						console.error('dijit.form.FilteringSelect: ' + err.toString());
					}
				});
			}
		},

		undo: function(){
			this.set('displayedValue', this._lastDisplayedValue);
		}
	});
});

},
'dojo/data/util/sorter':function(){
define(["dojo/_base/lang"], function(lang) {
	// module:
	//		dojo/data/util/sorter
	// summary:
	//		TODOC

var sorter = lang.getObject("dojo.data.util.sorter", true);

sorter.basicComparator = function(	/*anything*/ a,
													/*anything*/ b){
	//	summary:
	//		Basic comparision function that compares if an item is greater or less than another item
	//	description:
	//		returns 1 if a > b, -1 if a < b, 0 if equal.
	//		'null' values (null, undefined) are treated as larger values so that they're pushed to the end of the list.
	//		And compared to each other, null is equivalent to undefined.

	//null is a problematic compare, so if null, we set to undefined.
	//Makes the check logic simple, compact, and consistent
	//And (null == undefined) === true, so the check later against null
	//works for undefined and is less bytes.
	var r = -1;
	if(a === null){
		a = undefined;
	}
	if(b === null){
		b = undefined;
	}
	if(a == b){
		r = 0;
	}else if(a > b || a == null){
		r = 1;
	}
	return r; //int {-1,0,1}
};

sorter.createSortFunction = function(	/* attributes array */sortSpec, /*dojo.data.core.Read*/ store){
	//	summary:
	//		Helper function to generate the sorting function based off the list of sort attributes.
	//	description:
	//		The sort function creation will look for a property on the store called 'comparatorMap'.  If it exists
	//		it will look in the mapping for comparisons function for the attributes.  If one is found, it will
	//		use it instead of the basic comparator, which is typically used for strings, ints, booleans, and dates.
	//		Returns the sorting function for this particular list of attributes and sorting directions.
	//
	//	sortSpec: array
	//		A JS object that array that defines out what attribute names to sort on and whether it should be descenting or asending.
	//		The objects should be formatted as follows:
	//		{
	//			attribute: "attributeName-string" || attribute,
	//			descending: true|false;   // Default is false.
	//		}
	//	store: object
	//		The datastore object to look up item values from.
	//
	var sortFunctions=[];

	function createSortFunction(attr, dir, comp, s){
		//Passing in comp and s (comparator and store), makes this
		//function much faster.
		return function(itemA, itemB){
			var a = s.getValue(itemA, attr);
			var b = s.getValue(itemB, attr);
			return dir * comp(a,b); //int
		};
	}
	var sortAttribute;
	var map = store.comparatorMap;
	var bc = sorter.basicComparator;
	for(var i = 0; i < sortSpec.length; i++){
		sortAttribute = sortSpec[i];
		var attr = sortAttribute.attribute;
		if(attr){
			var dir = (sortAttribute.descending) ? -1 : 1;
			var comp = bc;
			if(map){
				if(typeof attr !== "string" && ("toString" in attr)){
					 attr = attr.toString();
				}
				comp = map[attr] || bc;
			}
			sortFunctions.push(createSortFunction(attr,
				dir, comp, store));
		}
	}
	return function(rowA, rowB){
		var i=0;
		while(i < sortFunctions.length){
			var ret = sortFunctions[i++](rowA, rowB);
			if(ret !== 0){
				return ret;//int
			}
		}
		return 0; //int
	}; // Function
};

return sorter;
});

},
'dojo/colors':function(){
define(["./_base/kernel", "./_base/lang", "./_base/Color", "./_base/array"], function(dojo, lang, Color, ArrayUtil) {
	// module:
	//		dojo/colors
	// summary:
	//		TODOC

	var ColorExt = lang.getObject("dojo.colors", true);

//TODO: this module appears to break naming conventions

/*=====
	lang.mixin(dojo, {
		colors: {
			// summary: Color utilities, extending Base dojo.Color
		}
	});
=====*/

	// this is a standard conversion prescribed by the CSS3 Color Module
	var hue2rgb = function(m1, m2, h){
		if(h < 0){ ++h; }
		if(h > 1){ --h; }
		var h6 = 6 * h;
		if(h6 < 1){ return m1 + (m2 - m1) * h6; }
		if(2 * h < 1){ return m2; }
		if(3 * h < 2){ return m1 + (m2 - m1) * (2 / 3 - h) * 6; }
		return m1;
	};
	// Override base Color.fromRgb with the impl in this module
	dojo.colorFromRgb = Color.fromRgb = function(/*String*/ color, /*dojo.Color?*/ obj){
		// summary:
		//		get rgb(a) array from css-style color declarations
		// description:
		//		this function can handle all 4 CSS3 Color Module formats: rgb,
		//		rgba, hsl, hsla, including rgb(a) with percentage values.
		var m = color.toLowerCase().match(/^(rgba?|hsla?)\(([\s\.\-,%0-9]+)\)/);
		if(m){
			var c = m[2].split(/\s*,\s*/), l = c.length, t = m[1], a;
			if((t == "rgb" && l == 3) || (t == "rgba" && l == 4)){
				var r = c[0];
				if(r.charAt(r.length - 1) == "%"){
					// 3 rgb percentage values
					a = ArrayUtil.map(c, function(x){
						return parseFloat(x) * 2.56;
					});
					if(l == 4){ a[3] = c[3]; }
					return Color.fromArray(a, obj); // dojo.Color
				}
				return Color.fromArray(c, obj); // dojo.Color
			}
			if((t == "hsl" && l == 3) || (t == "hsla" && l == 4)){
				// normalize hsl values
				var H = ((parseFloat(c[0]) % 360) + 360) % 360 / 360,
					S = parseFloat(c[1]) / 100,
					L = parseFloat(c[2]) / 100,
					// calculate rgb according to the algorithm
					// recommended by the CSS3 Color Module
					m2 = L <= 0.5 ? L * (S + 1) : L + S - L * S,
					m1 = 2 * L - m2;
				a = [
					hue2rgb(m1, m2, H + 1 / 3) * 256,
					hue2rgb(m1, m2, H) * 256,
					hue2rgb(m1, m2, H - 1 / 3) * 256,
					1
				];
				if(l == 4){ a[3] = c[3]; }
				return Color.fromArray(a, obj); // dojo.Color
			}
		}
		return null;	// dojo.Color
	};

	var confine = function(c, low, high){
		// summary:
		//		sanitize a color component by making sure it is a number,
		//		and clamping it to valid values
		c = Number(c);
		return isNaN(c) ? high : c < low ? low : c > high ? high : c;	// Number
	};

	Color.prototype.sanitize = function(){
		// summary: makes sure that the object has correct attributes
		var t = this;
		t.r = Math.round(confine(t.r, 0, 255));
		t.g = Math.round(confine(t.g, 0, 255));
		t.b = Math.round(confine(t.b, 0, 255));
		t.a = confine(t.a, 0, 1);
		return this;	// dojo.Color
	};

	ColorExt.makeGrey = Color.makeGrey = function(/*Number*/ g, /*Number?*/ a){
		// summary: creates a greyscale color with an optional alpha
		return Color.fromArray([g, g, g, a]);	// dojo.Color
	};

	// mixin all CSS3 named colors not already in _base, along with SVG 1.0 variant spellings
	lang.mixin(Color.named, {
		"aliceblue":	[240,248,255],
		"antiquewhite": [250,235,215],
		"aquamarine":	[127,255,212],
		"azure":	[240,255,255],
		"beige":	[245,245,220],
		"bisque":	[255,228,196],
		"blanchedalmond":	[255,235,205],
		"blueviolet":	[138,43,226],
		"brown":	[165,42,42],
		"burlywood":	[222,184,135],
		"cadetblue":	[95,158,160],
		"chartreuse":	[127,255,0],
		"chocolate":	[210,105,30],
		"coral":	[255,127,80],
		"cornflowerblue":	[100,149,237],
		"cornsilk": [255,248,220],
		"crimson":	[220,20,60],
		"cyan": [0,255,255],
		"darkblue": [0,0,139],
		"darkcyan": [0,139,139],
		"darkgoldenrod":	[184,134,11],
		"darkgray": [169,169,169],
		"darkgreen":	[0,100,0],
		"darkgrey": [169,169,169],
		"darkkhaki":	[189,183,107],
		"darkmagenta":	[139,0,139],
		"darkolivegreen":	[85,107,47],
		"darkorange":	[255,140,0],
		"darkorchid":	[153,50,204],
		"darkred":	[139,0,0],
		"darksalmon":	[233,150,122],
		"darkseagreen": [143,188,143],
		"darkslateblue":	[72,61,139],
		"darkslategray":	[47,79,79],
		"darkslategrey":	[47,79,79],
		"darkturquoise":	[0,206,209],
		"darkviolet":	[148,0,211],
		"deeppink": [255,20,147],
		"deepskyblue":	[0,191,255],
		"dimgray":	[105,105,105],
		"dimgrey":	[105,105,105],
		"dodgerblue":	[30,144,255],
		"firebrick":	[178,34,34],
		"floralwhite":	[255,250,240],
		"forestgreen":	[34,139,34],
		"gainsboro":	[220,220,220],
		"ghostwhite":	[248,248,255],
		"gold": [255,215,0],
		"goldenrod":	[218,165,32],
		"greenyellow":	[173,255,47],
		"grey": [128,128,128],
		"honeydew": [240,255,240],
		"hotpink":	[255,105,180],
		"indianred":	[205,92,92],
		"indigo":	[75,0,130],
		"ivory":	[255,255,240],
		"khaki":	[240,230,140],
		"lavender": [230,230,250],
		"lavenderblush":	[255,240,245],
		"lawngreen":	[124,252,0],
		"lemonchiffon": [255,250,205],
		"lightblue":	[173,216,230],
		"lightcoral":	[240,128,128],
		"lightcyan":	[224,255,255],
		"lightgoldenrodyellow": [250,250,210],
		"lightgray":	[211,211,211],
		"lightgreen":	[144,238,144],
		"lightgrey":	[211,211,211],
		"lightpink":	[255,182,193],
		"lightsalmon":	[255,160,122],
		"lightseagreen":	[32,178,170],
		"lightskyblue": [135,206,250],
		"lightslategray":	[119,136,153],
		"lightslategrey":	[119,136,153],
		"lightsteelblue":	[176,196,222],
		"lightyellow":	[255,255,224],
		"limegreen":	[50,205,50],
		"linen":	[250,240,230],
		"magenta":	[255,0,255],
		"mediumaquamarine": [102,205,170],
		"mediumblue":	[0,0,205],
		"mediumorchid": [186,85,211],
		"mediumpurple": [147,112,219],
		"mediumseagreen":	[60,179,113],
		"mediumslateblue":	[123,104,238],
		"mediumspringgreen":	[0,250,154],
		"mediumturquoise":	[72,209,204],
		"mediumvioletred":	[199,21,133],
		"midnightblue": [25,25,112],
		"mintcream":	[245,255,250],
		"mistyrose":	[255,228,225],
		"moccasin": [255,228,181],
		"navajowhite":	[255,222,173],
		"oldlace":	[253,245,230],
		"olivedrab":	[107,142,35],
		"orange":	[255,165,0],
		"orangered":	[255,69,0],
		"orchid":	[218,112,214],
		"palegoldenrod":	[238,232,170],
		"palegreen":	[152,251,152],
		"paleturquoise":	[175,238,238],
		"palevioletred":	[219,112,147],
		"papayawhip":	[255,239,213],
		"peachpuff":	[255,218,185],
		"peru": [205,133,63],
		"pink": [255,192,203],
		"plum": [221,160,221],
		"powderblue":	[176,224,230],
		"rosybrown":	[188,143,143],
		"royalblue":	[65,105,225],
		"saddlebrown":	[139,69,19],
		"salmon":	[250,128,114],
		"sandybrown":	[244,164,96],
		"seagreen": [46,139,87],
		"seashell": [255,245,238],
		"sienna":	[160,82,45],
		"skyblue":	[135,206,235],
		"slateblue":	[106,90,205],
		"slategray":	[112,128,144],
		"slategrey":	[112,128,144],
		"snow": [255,250,250],
		"springgreen":	[0,255,127],
		"steelblue":	[70,130,180],
		"tan":	[210,180,140],
		"thistle":	[216,191,216],
		"tomato":	[255,99,71],
		"turquoise":	[64,224,208],
		"violet":	[238,130,238],
		"wheat":	[245,222,179],
		"whitesmoke":	[245,245,245],
		"yellowgreen":	[154,205,50]
	});

	return Color;
});

},
'url:dijit/form/templates/Spinner.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\"\r\n\tid=\"widget_${id}\" role=\"presentation\"\r\n\t><div class=\"dijitReset dijitButtonNode dijitSpinnerButtonContainer\"\r\n\t\t><input class=\"dijitReset dijitInputField dijitSpinnerButtonInner\" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t\t/><div class=\"dijitReset dijitLeft dijitButtonNode dijitArrowButton dijitUpArrowButton\"\r\n\t\t\tdata-dojo-attach-point=\"upArrowNode\"\r\n\t\t\t><div class=\"dijitArrowButtonInner\"\r\n\t\t\t\t><input class=\"dijitReset dijitInputField\" value=\"&#9650;\" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t\t\t\t\t${_buttonInputDisabled}\r\n\t\t\t/></div\r\n\t\t></div\r\n\t\t><div class=\"dijitReset dijitLeft dijitButtonNode dijitArrowButton dijitDownArrowButton\"\r\n\t\t\tdata-dojo-attach-point=\"downArrowNode\"\r\n\t\t\t><div class=\"dijitArrowButtonInner\"\r\n\t\t\t\t><input class=\"dijitReset dijitInputField\" value=\"&#9660;\" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t\t\t\t\t${_buttonInputDisabled}\r\n\t\t\t/></div\r\n\t\t></div\r\n\t></div\r\n\t><div class='dijitReset dijitValidationContainer'\r\n\t\t><input class=\"dijitReset dijitInputField dijitValidationIcon dijitValidationInner\" value=\"&#935;\" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t/></div\r\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\r\n\t\t><input class='dijitReset dijitInputInner' data-dojo-attach-point=\"textbox,focusNode\" type=\"${type}\" data-dojo-attach-event=\"onkeypress:_onKeyPress\"\r\n\t\t\trole=\"spinbutton\" autocomplete=\"off\" ${!nameAttrSetting}\r\n\t/></div\r\n></div>\r\n",
'dijit/_editor/range':function(){
define("dijit/_editor/range", [
	"dojo/_base/array", // array.every
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.isArray
	"dojo/_base/window", // win.global
	".."	// for exporting symbols to dijit, TODO: remove in 2.0
], function(array, declare, lang, win, dijit){

// module:
//		dijit/_editor/range
// summary:
//		W3C range API


dijit.range={};

dijit.range.getIndex = function(/*DomNode*/node, /*DomNode*/parent){
//	dojo.profile.start("dijit.range.getIndex");
	var ret = [], retR = [];
	var onode = node;

	var pnode, n;
	while(node != parent){
		var i = 0;
		pnode = node.parentNode;
		while((n = pnode.childNodes[i++])){
			if(n === node){
				--i;
				break;
			}
		}
		//if(i>=pnode.childNodes.length){
			//dojo.debug("Error finding index of a node in dijit.range.getIndex");
		//}
		ret.unshift(i);
		retR.unshift(i - pnode.childNodes.length);
		node = pnode;
	}

	//normalized() can not be called so often to prevent
	//invalidating selection/range, so we have to detect
	//here that any text nodes in a row
	if(ret.length > 0 && onode.nodeType == 3){
		n = onode.previousSibling;
		while(n && n.nodeType == 3){
			ret[ret.length - 1]--;
			n = n.previousSibling;
		}
		n = onode.nextSibling;
		while(n && n.nodeType == 3){
			retR[retR.length - 1]++;
			n = n.nextSibling;
		}
	}
//	dojo.profile.end("dijit.range.getIndex");
	return {o: ret, r:retR};
};

dijit.range.getNode = function(/*Array*/index, /*DomNode*/parent){
	if(!lang.isArray(index) || index.length == 0){
		return parent;
	}
	var node = parent;
//	if(!node)debugger
	array.every(index, function(i){
		if(i >= 0 && i < node.childNodes.length){
			node = node.childNodes[i];
		}else{
			node = null;
			//console.debug('Error: can not find node with index',index,'under parent node',parent );
			return false; //terminate array.every
		}
		return true; //carry on the every loop
	});

	return node;
};

dijit.range.getCommonAncestor = function(n1, n2, root){
	root = root || n1.ownerDocument.body;
	var getAncestors = function(n){
		var as = [];
		while(n){
			as.unshift(n);
			if(n !== root){
				n = n.parentNode;
			}else{
				break;
			}
		}
		return as;
	};
	var n1as = getAncestors(n1);
	var n2as = getAncestors(n2);

	var m = Math.min(n1as.length, n2as.length);
	var com = n1as[0]; //at least, one element should be in the array: the root (BODY by default)
	for(var i = 1; i < m; i++){
		if(n1as[i] === n2as[i]){
			com = n1as[i]
		}else{
			break;
		}
	}
	return com;
};

dijit.range.getAncestor = function(/*DomNode*/node, /*RegEx?*/regex, /*DomNode?*/root){
	root = root || node.ownerDocument.body;
	while(node && node !== root){
		var name = node.nodeName.toUpperCase();
		if(regex.test(name)){
			return node;
		}

		node = node.parentNode;
	}
	return null;
};

dijit.range.BlockTagNames = /^(?:P|DIV|H1|H2|H3|H4|H5|H6|ADDRESS|PRE|OL|UL|LI|DT|DE)$/;
dijit.range.getBlockAncestor = function(/*DomNode*/node, /*RegEx?*/regex, /*DomNode?*/root){
	root = root || node.ownerDocument.body;
	regex = regex || dijit.range.BlockTagNames;
	var block = null, blockContainer;
	while(node && node !== root){
		var name = node.nodeName.toUpperCase();
		if(!block && regex.test(name)){
			block = node;
		}
		if(!blockContainer && (/^(?:BODY|TD|TH|CAPTION)$/).test(name)){
			blockContainer = node;
		}

		node = node.parentNode;
	}
	return {blockNode:block, blockContainer:blockContainer || node.ownerDocument.body};
};

dijit.range.atBeginningOfContainer = function(/*DomNode*/container, /*DomNode*/node, /*Int*/offset){
	var atBeginning = false;
	var offsetAtBeginning = (offset == 0);
	if(!offsetAtBeginning && node.nodeType == 3){ //if this is a text node, check whether the left part is all space
		if(/^[\s\xA0]+$/.test(node.nodeValue.substr(0, offset))){
			offsetAtBeginning = true;
		}
	}
	if(offsetAtBeginning){
		var cnode = node;
		atBeginning = true;
		while(cnode && cnode !== container){
			if(cnode.previousSibling){
				atBeginning = false;
				break;
			}
			cnode = cnode.parentNode;
		}
	}
	return atBeginning;
};

dijit.range.atEndOfContainer = function(/*DomNode*/container, /*DomNode*/node, /*Int*/offset){
	var atEnd = false;
	var offsetAtEnd = (offset == (node.length || node.childNodes.length));
	if(!offsetAtEnd && node.nodeType == 3){ //if this is a text node, check whether the right part is all space
		if(/^[\s\xA0]+$/.test(node.nodeValue.substr(offset))){
			offsetAtEnd = true;
		}
	}
	if(offsetAtEnd){
		var cnode = node;
		atEnd = true;
		while(cnode && cnode !== container){
			if(cnode.nextSibling){
				atEnd = false;
				break;
			}
			cnode = cnode.parentNode;
		}
	}
	return atEnd;
};

dijit.range.adjacentNoneTextNode = function(startnode, next){
	var node = startnode;
	var len = (0 - startnode.length) || 0;
	var prop = next ? 'nextSibling' : 'previousSibling';
	while(node){
		if(node.nodeType != 3){
			break;
		}
		len += node.length;
		node = node[prop];
	}
	return [node,len];
};

dijit.range._w3c = Boolean(window['getSelection']);
dijit.range.create = function(/*Window?*/window){
	if(dijit.range._w3c){
		return (window || win.global).document.createRange();
	}else{//IE
		return new dijit.range.W3CRange;
	}
};

dijit.range.getSelection = function(/*Window*/win, /*Boolean?*/ignoreUpdate){
	if(dijit.range._w3c){
		return win.getSelection();
	}else{//IE
		var s = new dijit.range.ie.selection(win);
		if(!ignoreUpdate){
			s._getCurrentSelection();
		}
		return s;
	}
};

if(!dijit.range._w3c){
	dijit.range.ie = {
		cachedSelection: {},
		selection: function(win){
			this._ranges = [];
			this.addRange = function(r, /*boolean*/internal){
				this._ranges.push(r);
				if(!internal){
					r._select();
				}
				this.rangeCount = this._ranges.length;
			};
			this.removeAllRanges = function(){
				//don't detach, the range may be used later
//				for(var i=0;i<this._ranges.length;i++){
//					this._ranges[i].detach();
//				}
				this._ranges = [];
				this.rangeCount = 0;
			};
			var _initCurrentRange = function(){
				var r = win.document.selection.createRange();
				var type = win.document.selection.type.toUpperCase();
				if(type == "CONTROL"){
					//TODO: multiple range selection(?)
					return new dijit.range.W3CRange(dijit.range.ie.decomposeControlRange(r));
				}else{
					return new dijit.range.W3CRange(dijit.range.ie.decomposeTextRange(r));
				}
			};
			this.getRangeAt = function(i){
				return this._ranges[i];
			};
			this._getCurrentSelection = function(){
				this.removeAllRanges();
				var r = _initCurrentRange();
				if(r){
					this.addRange(r, true);
					this.isCollapsed = r.collapsed;
				}else{
					this.isCollapsed = true;
				}
			};
		},
		decomposeControlRange: function(range){
			var firstnode = range.item(0), lastnode = range.item(range.length - 1);
			var startContainer = firstnode.parentNode, endContainer = lastnode.parentNode;
			var startOffset = dijit.range.getIndex(firstnode, startContainer).o[0];
			var endOffset = dijit.range.getIndex(lastnode, endContainer).o[0] + 1;
			return [startContainer, startOffset,endContainer, endOffset];
		},
		getEndPoint: function(range, end){
			var atmrange = range.duplicate();
			atmrange.collapse(!end);
			var cmpstr = 'EndTo' + (end ? 'End' : 'Start');
			var parentNode = atmrange.parentElement();

			var startnode, startOffset, lastNode;
			if(parentNode.childNodes.length > 0){
				array.every(parentNode.childNodes, function(node, i){
					var calOffset;
					if(node.nodeType != 3){
						atmrange.moveToElementText(node);

						if(atmrange.compareEndPoints(cmpstr, range) > 0){
							//startnode = node.previousSibling;
							if(lastNode && lastNode.nodeType == 3){
								//where shall we put the start? in the text node or after?
								startnode = lastNode;
								calOffset = true;
							}else{
								startnode = parentNode;
								startOffset = i;
								return false;
							}
						}else{
							if(i == parentNode.childNodes.length - 1){
								startnode = parentNode;
								startOffset = parentNode.childNodes.length;
								return false;
							}
						}
					}else{
						if(i == parentNode.childNodes.length - 1){//at the end of this node
							startnode = node;
							calOffset = true;
						}
					}
					//			try{
					if(calOffset && startnode){
						var prevnode = dijit.range.adjacentNoneTextNode(startnode)[0];
						if(prevnode){
							startnode = prevnode.nextSibling;
						}else{
							startnode = parentNode.firstChild; //firstChild must be a text node
						}
						var prevnodeobj = dijit.range.adjacentNoneTextNode(startnode);
						prevnode = prevnodeobj[0];
						var lenoffset = prevnodeobj[1];
						if(prevnode){
							atmrange.moveToElementText(prevnode);
							atmrange.collapse(false);
						}else{
							atmrange.moveToElementText(parentNode);
						}
						atmrange.setEndPoint(cmpstr, range);
						startOffset = atmrange.text.length - lenoffset;

						return false;
					}
					//			}catch(e){ debugger }
					lastNode = node;
					return true;
				});
			}else{
				startnode = parentNode;
				startOffset = 0;
			}

			//if at the end of startnode and we are dealing with start container, then
			//move the startnode to nextSibling if it is a text node
			//TODO: do this for end container?
			if(!end && startnode.nodeType == 1 && startOffset == startnode.childNodes.length){
				var nextnode = startnode.nextSibling;
				if(nextnode && nextnode.nodeType == 3){
					startnode = nextnode;
					startOffset = 0;
				}
			}
			return [startnode, startOffset];
		},
		setEndPoint: function(range, container, offset){
			//text node
			var atmrange = range.duplicate(), node, len;
			if(container.nodeType != 3){ //normal node
				if(offset > 0){
					node = container.childNodes[offset - 1];
					if(node){
						if(node.nodeType == 3){
							container = node;
							offset = node.length;
							//pass through
						}else{
							if(node.nextSibling && node.nextSibling.nodeType == 3){
								container = node.nextSibling;
								offset = 0;
								//pass through
							}else{
								atmrange.moveToElementText(node.nextSibling ? node : container);
								var parent = node.parentNode;
								var tempNode = parent.insertBefore(node.ownerDocument.createTextNode(' '), node.nextSibling);
								atmrange.collapse(false);
								parent.removeChild(tempNode);
							}
						}
					}
				}else{
					atmrange.moveToElementText(container);
					atmrange.collapse(true);
				}
			}
			if(container.nodeType == 3){
				var prevnodeobj = dijit.range.adjacentNoneTextNode(container);
				var prevnode = prevnodeobj[0];
				len = prevnodeobj[1];
				if(prevnode){
					atmrange.moveToElementText(prevnode);
					atmrange.collapse(false);
					//if contentEditable is not inherit, the above collapse won't make the end point
					//in the correctly position: it always has a -1 offset, so compensate it
					if(prevnode.contentEditable != 'inherit'){
						len++;
					}
				}else{
					atmrange.moveToElementText(container.parentNode);
					atmrange.collapse(true);
				}

				offset += len;
				if(offset > 0){
					if(atmrange.move('character', offset) != offset){
						console.error('Error when moving!');
					}
				}
			}

			return atmrange;
		},
		decomposeTextRange: function(range){
			var tmpary = dijit.range.ie.getEndPoint(range);
			var startContainer = tmpary[0], startOffset = tmpary[1];
			var endContainer = tmpary[0], endOffset = tmpary[1];

			if(range.htmlText.length){
				if(range.htmlText == range.text){ //in the same text node
					endOffset = startOffset + range.text.length;
				}else{
					tmpary = dijit.range.ie.getEndPoint(range, true);
					endContainer = tmpary[0],endOffset = tmpary[1];
//					if(startContainer.tagName == "BODY"){
//						startContainer = startContainer.firstChild;
//					}
				}
			}
			return [startContainer, startOffset, endContainer, endOffset];
		},
		setRange: function(range, startContainer, startOffset, endContainer, endOffset, collapsed){
			var start = dijit.range.ie.setEndPoint(range, startContainer, startOffset);

			range.setEndPoint('StartToStart', start);
			if(!collapsed){
				var end = dijit.range.ie.setEndPoint(range, endContainer, endOffset);
			}
			range.setEndPoint('EndToEnd', end || start);

			return range;
		}
	};

declare("dijit.range.W3CRange",null, {
	constructor: function(){
		if(arguments.length>0){
			this.setStart(arguments[0][0],arguments[0][1]);
			this.setEnd(arguments[0][2],arguments[0][3]);
		}else{
			this.commonAncestorContainer = null;
			this.startContainer = null;
			this.startOffset = 0;
			this.endContainer = null;
			this.endOffset = 0;
			this.collapsed = true;
		}
	},
	_updateInternal: function(){
		if(this.startContainer !== this.endContainer){
			this.commonAncestorContainer = dijit.range.getCommonAncestor(this.startContainer, this.endContainer);
		}else{
			this.commonAncestorContainer = this.startContainer;
		}
		this.collapsed = (this.startContainer === this.endContainer) && (this.startOffset == this.endOffset);
	},
	setStart: function(node, offset){
		offset=parseInt(offset);
		if(this.startContainer === node && this.startOffset == offset){
			return;
		}
		delete this._cachedBookmark;

		this.startContainer = node;
		this.startOffset = offset;
		if(!this.endContainer){
			this.setEnd(node, offset);
		}else{
			this._updateInternal();
		}
	},
	setEnd: function(node, offset){
		offset=parseInt(offset);
		if(this.endContainer === node && this.endOffset == offset){
			return;
		}
		delete this._cachedBookmark;

		this.endContainer = node;
		this.endOffset = offset;
		if(!this.startContainer){
			this.setStart(node, offset);
		}else{
			this._updateInternal();
		}
	},
	setStartAfter: function(node, offset){
		this._setPoint('setStart', node, offset, 1);
	},
	setStartBefore: function(node, offset){
		this._setPoint('setStart', node, offset, 0);
	},
	setEndAfter: function(node, offset){
		this._setPoint('setEnd', node, offset, 1);
	},
	setEndBefore: function(node, offset){
		this._setPoint('setEnd', node, offset, 0);
	},
	_setPoint: function(what, node, offset, ext){
		var index = dijit.range.getIndex(node, node.parentNode).o;
		this[what](node.parentNode, index.pop()+ext);
	},
	_getIERange: function(){
		var r = (this._body || this.endContainer.ownerDocument.body).createTextRange();
		dijit.range.ie.setRange(r, this.startContainer, this.startOffset, this.endContainer, this.endOffset, this.collapsed);
		return r;
	},
	getBookmark: function(){
		this._getIERange();
		return this._cachedBookmark;
	},
	_select: function(){
		var r = this._getIERange();
		r.select();
	},
	deleteContents: function(){
		var s = this.startContainer, r = this._getIERange();
		if(s.nodeType === 3 && !this.startOffset){
			//if the range starts at the beginning of a
			//text node, move it to before the textnode
			//to make sure the range is still valid
			//after deleteContents() finishes
			this.setStartBefore(s);
		}
		r.pasteHTML('');
		this.endContainer = this.startContainer;
		this.endOffset = this.startOffset;
		this.collapsed = true;
	},
	cloneRange: function(){
		var r = new dijit.range.W3CRange([this.startContainer,this.startOffset,
			this.endContainer,this.endOffset]);
		r._body = this._body;
		return r;
	},
	detach: function(){
		this._body = null;
		this.commonAncestorContainer = null;
		this.startContainer = null;
		this.startOffset = 0;
		this.endContainer = null;
		this.endOffset = 0;
		this.collapsed = true;
}
});
} //if(!dijit.range._w3c)


return dijit.range;
});

},
'dojo/store/util/QueryResults':function(){
define(["../../_base/array", "../../_base/lang", "../../_base/Deferred"
], function(array, lang, Deferred) {
  //  module:
  //    dojo/store/util/QueryResults
  //  summary:
  //    The module defines a query results wrapper

var util = lang.getObject("dojo.store.util", true);

util.QueryResults = function(results){
	// summary:
	//		A function that wraps the results of a store query with additional
	//		methods.
	//
	// description:
	//		QueryResults is a basic wrapper that allows for array-like iteration
	//		over any kind of returned data from a query.  While the simplest store
	//		will return a plain array of data, other stores may return deferreds or
	//		promises; this wrapper makes sure that *all* results can be treated
	//		the same.
	//
	//		Additional methods include `forEach`, `filter` and `map`.
	//
	// returns: Object
	//		An array-like object that can be used for iterating over.
	//
	// example:
	//		Query a store and iterate over the results.
	//
	//	|	store.query({ prime: true }).forEach(function(item){
	//	|		//	do something
	//	|	});

	if(!results){
		return results;
	}
	// if it is a promise it may be frozen
	if(results.then){
		results = lang.delegate(results);
	}
	function addIterativeMethod(method){
		if(!results[method]){
			results[method] = function(){
				var args = arguments;
				return Deferred.when(results, function(results){
					Array.prototype.unshift.call(args, results);
					return util.QueryResults(array[method].apply(array, args));
				});
			};
		}
	}
	addIterativeMethod("forEach");
	addIterativeMethod("filter");
	addIterativeMethod("map");
	if(!results.total){
		results.total = Deferred.when(results, function(results){
			return results.length;
		});
	}
	return results;
};

return util.QueryResults;
});

},
'dijit/form/_ListBase':function(){
define("dijit/form/_ListBase", [
	"dojo/_base/declare",	// declare
	"dojo/window" // winUtils.scrollIntoView
], function(declare, winUtils){

// module:
//		dijit/form/_ListBase
// summary:
//		Focus-less menu to handle UI events consistently

return declare( "dijit.form._ListBase", null, {
	// summary:
	//		Focus-less menu to handle UI events consistently
	//		Abstract methods that must be defined externally:
	//			onSelect: item is active (mousedown but not yet mouseup, or keyboard arrow selected but no Enter)
	//			onDeselect:  cancels onSelect
	// tags:
	//		private

	// selected: DOMnode
	//		currently selected node
	selected: null,

	_getTarget: function(/*Event*/ evt){
		var tgt = evt.target;
		var container = this.containerNode;
		if(tgt == container || tgt == this.domNode){ return null; }
		while(tgt && tgt.parentNode != container){
			// recurse to the top
			tgt = tgt.parentNode;
		}
		return tgt;
	},

	selectFirstNode: function(){
		// summary:
		// 		Select the first displayed item in the list.
		var first = this.containerNode.firstChild;
		while(first && first.style.display == "none"){
			first = first.nextSibling;
		}
		this._setSelectedAttr(first);
	},

	selectLastNode: function(){
		// summary:
		// 		Select the last displayed item in the list
		var last = this.containerNode.lastChild;
		while(last && last.style.display == "none"){
			last = last.previousSibling;
		}
		this._setSelectedAttr(last);
	},

	selectNextNode: function(){
		// summary:
		// 		Select the item just below the current selection.
		// 		If nothing selected, select first node.
		var selectedNode = this._getSelectedAttr();
		if(!selectedNode){
			this.selectFirstNode();
		}else{
			var next = selectedNode.nextSibling;
			while(next && next.style.display == "none"){
				next = next.nextSibling;
			}
			if(!next){
				this.selectFirstNode();
			}else{
				this._setSelectedAttr(next);
			}
		}
	},

	selectPreviousNode: function(){
		// summary:
		// 		Select the item just above the current selection.
		// 		If nothing selected, select last node (if
		// 		you select Previous and try to keep scrolling up the list).
		var selectedNode = this._getSelectedAttr();
		if(!selectedNode){
			this.selectLastNode();
		}else{
			var prev = selectedNode.previousSibling;
			while(prev && prev.style.display == "none"){
				prev = prev.previousSibling;
			}
			if(!prev){
				this.selectLastNode();
			}else{
				this._setSelectedAttr(prev);
			}
		}
	},

	_setSelectedAttr: function(/*DomNode*/ node){
		// summary:
		//		Does the actual select.
		if(this.selected != node){
			var selectedNode = this._getSelectedAttr();
			if(selectedNode){
				this.onDeselect(selectedNode);
				this.selected = null;
			}
			if(node && node.parentNode == this.containerNode){
				this.selected = node;
				winUtils.scrollIntoView(node);
				this.onSelect(node);
			}
		}else if(node){
			this.onSelect(node);
		}
	},

	_getSelectedAttr: function(){
		// summary:
		//		Returns the selected node.
		var v = this.selected;
		return (v && v.parentNode == this.containerNode) ? v : (this.selected = null);
	}
});

});

},
'dojo/DeferredList':function(){
define(["./_base/kernel", "./_base/Deferred", "./_base/array"], function(dojo, Deferred, darray) {
	// module:
	//		dojo/DeferredList
	// summary:
	//		TODOC


dojo.DeferredList = function(/*Array*/ list, /*Boolean?*/ fireOnOneCallback, /*Boolean?*/ fireOnOneErrback, /*Boolean?*/ consumeErrors, /*Function?*/ canceller){
	// summary:
	//		Provides event handling for a group of Deferred objects.
	// description:
	//		DeferredList takes an array of existing deferreds and returns a new deferred of its own
	//		this new deferred will typically have its callback fired when all of the deferreds in
	//		the given list have fired their own deferreds.  The parameters `fireOnOneCallback` and
	//		fireOnOneErrback, will fire before all the deferreds as appropriate
	//
	// list:
	//		The list of deferreds to be synchronizied with this DeferredList
	// fireOnOneCallback:
	//		Will cause the DeferredLists callback to be fired as soon as any
	//		of the deferreds in its list have been fired instead of waiting until
	//		the entire list has finished
	// fireonOneErrback:
	//		Will cause the errback to fire upon any of the deferreds errback
	// canceller:
	//		A deferred canceller function, see dojo.Deferred
	var resultList = [];
	Deferred.call(this);
	var self = this;
	if(list.length === 0 && !fireOnOneCallback){
		this.resolve([0, []]);
	}
	var finished = 0;
	darray.forEach(list, function(item, i){
		item.then(function(result){
			if(fireOnOneCallback){
				self.resolve([i, result]);
			}else{
				addResult(true, result);
			}
		},function(error){
			if(fireOnOneErrback){
				self.reject(error);
			}else{
				addResult(false, error);
			}
			if(consumeErrors){
				return null;
			}
			throw error;
		});
		function addResult(succeeded, result){
			resultList[i] = [succeeded, result];
			finished++;
			if(finished === list.length){
				self.resolve(resultList);
			}

		}
	});
};
dojo.DeferredList.prototype = new Deferred();

dojo.DeferredList.prototype.gatherResults = function(deferredList){
	// summary:
	//		Gathers the results of the deferreds for packaging
	//		as the parameters to the Deferred Lists' callback
	// deferredList: dojo.DeferredList
	//		The deferred list from which this function gathers results.
	// returns: dojo.DeferredList
	//		The newly created deferred list which packs results as
	//		parameters to its callback.

	var d = new dojo.DeferredList(deferredList, false, true, false);
	d.addCallback(function(results){
		var ret = [];
		darray.forEach(results, function(result){
			ret.push(result[1]);
		});
		return ret;
	});
	return d;
};

return dojo.DeferredList;
});

},
'dijit/CalendarLite':function(){
require({cache:{
'url:dijit/templates/Calendar.html':"<table cellspacing=\"0\" cellpadding=\"0\" class=\"dijitCalendarContainer\" role=\"grid\" aria-labelledby=\"${id}_mddb ${id}_year\">\r\n\t<thead>\r\n\t\t<tr class=\"dijitReset dijitCalendarMonthContainer\" valign=\"top\">\r\n\t\t\t<th class='dijitReset dijitCalendarArrow' data-dojo-attach-point=\"decrementMonth\">\r\n\t\t\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitCalendarIncrementControl dijitCalendarDecrease\" role=\"presentation\"/>\r\n\t\t\t\t<span data-dojo-attach-point=\"decreaseArrowNode\" class=\"dijitA11ySideArrow\">-</span>\r\n\t\t\t</th>\r\n\t\t\t<th class='dijitReset' colspan=\"5\">\r\n\t\t\t\t<div data-dojo-attach-point=\"monthNode\">\r\n\t\t\t\t</div>\r\n\t\t\t</th>\r\n\t\t\t<th class='dijitReset dijitCalendarArrow' data-dojo-attach-point=\"incrementMonth\">\r\n\t\t\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitCalendarIncrementControl dijitCalendarIncrease\" role=\"presentation\"/>\r\n\t\t\t\t<span data-dojo-attach-point=\"increaseArrowNode\" class=\"dijitA11ySideArrow\">+</span>\r\n\t\t\t</th>\r\n\t\t</tr>\r\n\t\t<tr>\r\n\t\t\t${!dayCellsHtml}\r\n\t\t</tr>\r\n\t</thead>\r\n\t<tbody data-dojo-attach-point=\"dateRowsNode\" data-dojo-attach-event=\"onclick: _onDayClick\" class=\"dijitReset dijitCalendarBodyContainer\">\r\n\t\t\t${!dateRowsHtml}\r\n\t</tbody>\r\n\t<tfoot class=\"dijitReset dijitCalendarYearContainer\">\r\n\t\t<tr>\r\n\t\t\t<td class='dijitReset' valign=\"top\" colspan=\"7\" role=\"presentation\">\r\n\t\t\t\t<div class=\"dijitCalendarYearLabel\">\r\n\t\t\t\t\t<span data-dojo-attach-point=\"previousYearLabelNode\" class=\"dijitInline dijitCalendarPreviousYear\" role=\"button\"></span>\r\n\t\t\t\t\t<span data-dojo-attach-point=\"currentYearLabelNode\" class=\"dijitInline dijitCalendarSelectedYear\" role=\"button\" id=\"${id}_year\"></span>\r\n\t\t\t\t\t<span data-dojo-attach-point=\"nextYearLabelNode\" class=\"dijitInline dijitCalendarNextYear\" role=\"button\"></span>\r\n\t\t\t\t</div>\r\n\t\t\t</td>\r\n\t\t</tr>\r\n\t</tfoot>\r\n</table>\r\n"}});
define("dijit/CalendarLite", [
	"dojo/_base/array", // array.forEach array.map
	"dojo/_base/declare", // declare
	"dojo/cldr/supplemental", // cldrSupplemental.getFirstDayOfWeek
	"dojo/date", // date
	"dojo/date/locale",
	"dojo/dom", // dom.setSelectable
	"dojo/dom-class", // domClass.contains
	"dojo/_base/event", // event.stop
	"dojo/_base/lang", // lang.getObject, lang.hitch
	"dojo/_base/sniff", // has("ie") has("webkit")
	"dojo/string", // string.substitute
	"dojo/_base/window", // win.doc.createTextNode
	"./_WidgetBase",
	"./_TemplatedMixin",
	"dojo/text!./templates/Calendar.html"
], function(array, declare, cldrSupplemental, date, local, dom, domClass, event, lang, has, string, win,
			_WidgetBase, _TemplatedMixin, template){

/*=====
	var _WidgetBase = dijit._WidgetBase;
	var _TemplatedMixin = dijit._TemplatedMixin;
=====*/

	// module:
	//		dijit/CalendarLite
	// summary:
	//		Lightweight version of Calendar widget aimed towards mobile use

	var CalendarLite = declare("dijit.CalendarLite", [_WidgetBase, _TemplatedMixin], {
		// summary:
		//		Lightweight version of Calendar widget aimed towards mobile use
		//
		// description:
		//		A simple GUI for choosing a date in the context of a monthly calendar.
		//		This widget can't be used in a form because it doesn't serialize the date to an
		//		`<input>` field.  For a form element, use dijit.form.DateTextBox instead.
		//
		//		Note that the parser takes all dates attributes passed in the
		//		[RFC 3339 format](http://www.faqs.org/rfcs/rfc3339.html), e.g. `2005-06-30T08:05:00-07:00`
		//		so that they are serializable and locale-independent.
		//
		//		Also note that this widget isn't keyboard accessible; use dijit.Calendar for that
		// example:
		//	|	var calendar = new dijit.CalendarLite({}, dojo.byId("calendarNode"));
		//
		// example:
		//	|	<div data-dojo-type="dijit.CalendarLite"></div>

		// Template for main calendar
		templateString: template,

		// Template for cell for a day of the week (ex: M)
		dowTemplateString: '<th class="dijitReset dijitCalendarDayLabelTemplate" role="columnheader"><span class="dijitCalendarDayLabel">${d}</span></th>',

		// Templates for a single date (ex: 13), and for a row for a week (ex: 20 21 22 23 24 25 26)
		dateTemplateString: '<td class="dijitReset" role="gridcell" data-dojo-attach-point="dateCells"><span class="dijitCalendarDateLabel" data-dojo-attach-point="dateLabels"></span></td>',
		weekTemplateString: '<tr class="dijitReset dijitCalendarWeekTemplate" role="row">${d}${d}${d}${d}${d}${d}${d}</tr>',

		// value: Date
		//		The currently selected Date, initially set to invalid date to indicate no selection.
		value: new Date(""),
		// TODO: for 2.0 make this a string (ISO format) rather than a Date

		// datePackage: String
		//		JavaScript object containing Calendar functions.  Uses Gregorian Calendar routines
		//		from dojo.date by default.
		datePackage: date,

		// dayWidth: String
		//		How to represent the days of the week in the calendar header. See locale
		dayWidth: "narrow",

		// tabIndex: Integer
		//		Order fields are traversed when user hits the tab key
		tabIndex: "0",

		// currentFocus: Date
		//		Date object containing the currently focused date, or the date which would be focused
		//		if the calendar itself was focused.   Also indicates which year and month to display,
		//		i.e. the current "page" the calendar is on.
		currentFocus: new Date(),

		baseClass:"dijitCalendar",

		_isValidDate: function(/*Date*/ value){
			// summary:
			//		Runs various tests on the value, checking that it's a valid date, rather
			//		than blank or NaN.
			// tags:
			//		private
			return value && !isNaN(value) && typeof value == "object" &&
				value.toString() != this.constructor.prototype.value.toString();
		},

		_getValueAttr: function(){
			// summary:
			//		Support get('value')

			// this.value is set to 1AM, but return midnight, local time for back-compat
			if(this.value && !isNaN(this.value)){
				var value = new this.dateClassObj(this.value);
				value.setHours(0, 0, 0, 0);

				// If daylight savings pushes midnight to the previous date, fix the Date
				// object to point at 1am so it will represent the correct day. See #9366
				if(value.getDate() < this.value.getDate()){
					value = this.dateFuncObj.add(value, "hour", 1);
				}
				return value;
			}else{
				return null;
			}
		},

		_setValueAttr: function(/*Date|Number*/ value, /*Boolean*/ priorityChange){
			// summary:
			//		Support set("value", ...)
			// description:
			// 		Set the current date and update the UI.  If the date is disabled, the value will
			//		not change, but the display will change to the corresponding month.
			// value:
			//		Either a Date or the number of seconds since 1970.
			// tags:
			//      protected
			if(value){
				// convert from Number to Date, or make copy of Date object so that setHours() call below
				// doesn't affect original value
				value = new this.dateClassObj(value);
			}
			if(this._isValidDate(value)){
				if(!this._isValidDate(this.value) || this.dateFuncObj.compare(value, this.value)){
					value.setHours(1, 0, 0, 0); // round to nearest day (1am to avoid issues when DST shift occurs at midnight, see #8521, #9366)

					if(!this.isDisabledDate(value, this.lang)){
						this._set("value", value);

						// Set focus cell to the new value.   Arguably this should only happen when there isn't a current
						// focus point.   This will also repopulate the grid, showing the new selected value (and possibly
						// new month/year).
						this.set("currentFocus", value);

						if(priorityChange || typeof priorityChange == "undefined"){
							this.onChange(this.get('value'));
						}
					}
				}
			}else{
				// clear value, and repopulate grid (to deselect the previously selected day) without changing currentFocus
				this._set("value", null);
				this.set("currentFocus", this.currentFocus);
			}
		},

		_setText: function(node, text){
			// summary:
			//		This just sets the content of node to the specified text.
			//		Can't do "node.innerHTML=text" because of an IE bug w/tables, see #3434.
			// tags:
			//      private
			while(node.firstChild){
				node.removeChild(node.firstChild);
			}
			node.appendChild(win.doc.createTextNode(text));
		},

		_populateGrid: function(){
			// summary:
			//      Fills in the calendar grid with each day (1-31)
			// tags:
			//      private

			var month = new this.dateClassObj(this.currentFocus);
			month.setDate(1);

			var firstDay = month.getDay(),
				daysInMonth = this.dateFuncObj.getDaysInMonth(month),
				daysInPreviousMonth = this.dateFuncObj.getDaysInMonth(this.dateFuncObj.add(month, "month", -1)),
				today = new this.dateClassObj(),
				dayOffset = cldrSupplemental.getFirstDayOfWeek(this.lang);
			if(dayOffset > firstDay){ dayOffset -= 7; }

			// Mapping from date (as specified by number returned from Date.valueOf()) to corresponding <td>
			this._date2cell = {};

			// Iterate through dates in the calendar and fill in date numbers and style info
			array.forEach(this.dateCells, function(template, idx){
				var i = idx + dayOffset;
				var date = new this.dateClassObj(month),
					number, clazz = "dijitCalendar", adj = 0;

				if(i < firstDay){
					number = daysInPreviousMonth - firstDay + i + 1;
					adj = -1;
					clazz += "Previous";
				}else if(i >= (firstDay + daysInMonth)){
					number = i - firstDay - daysInMonth + 1;
					adj = 1;
					clazz += "Next";
				}else{
					number = i - firstDay + 1;
					clazz += "Current";
				}

				if(adj){
					date = this.dateFuncObj.add(date, "month", adj);
				}
				date.setDate(number);

				if(!this.dateFuncObj.compare(date, today, "date")){
					clazz = "dijitCalendarCurrentDate " + clazz;
				}

				if(this._isSelectedDate(date, this.lang)){
					clazz = "dijitCalendarSelectedDate " + clazz;
					template.setAttribute("aria-selected", true);
				}else{
					template.setAttribute("aria-selected", false);
				}

				if(this.isDisabledDate(date, this.lang)){
					clazz = "dijitCalendarDisabledDate " + clazz;
					template.setAttribute("aria-disabled", true);
				}else{
					clazz = "dijitCalendarEnabledDate " + clazz;
					template.removeAttribute("aria-disabled");
				}

				var clazz2 = this.getClassForDate(date, this.lang);
				if(clazz2){
					clazz = clazz2 + " " + clazz;
				}

				template.className = clazz + "Month dijitCalendarDateTemplate";

				// Each cell has an associated integer value representing it's date
				var dateVal = date.valueOf();
				this._date2cell[dateVal] = template;
				template.dijitDateValue = dateVal;

				// Set Date string (ex: "13").
				this._setText(this.dateLabels[idx], date.getDateLocalized ? date.getDateLocalized(this.lang) : date.getDate());
			}, this);

			// set name of this month
			this.monthWidget.set("month", month);

			// Fill in localized prev/current/next years
			var y = month.getFullYear() - 1;
			var d = new this.dateClassObj();
			array.forEach(["previous", "current", "next"], function(name){
				d.setFullYear(y++);
				this._setText(this[name+"YearLabelNode"],
					this.dateLocaleModule.format(d, {selector:'year', locale:this.lang}));
			}, this);
		},

		goToToday: function(){
			// summary:
			//      Sets calendar's value to today's date
			this.set('value', new this.dateClassObj());
		},

		constructor: function(/*Object*/args){
			this.datePackage = args.datePackage || this.datePackage;
			this.dateFuncObj = typeof this.datePackage == "string" ?
				lang.getObject(this.datePackage, false) :// "string" part for back-compat, remove for 2.0
				this.datePackage;
			this.dateClassObj = this.dateFuncObj.Date || Date;
			this.dateLocaleModule = lang.getObject("locale", false, this.dateFuncObj);
		},

		_createMonthWidget: function(){
			// summary:
			//		Creates the drop down button that displays the current month and lets user pick a new one

			return CalendarLite._MonthWidget({
				id: this.id + "_mw",
				lang: this.lang,
				dateLocaleModule: this.dateLocaleModule
			}, this.monthNode);
		},

		buildRendering: function(){
			// Markup for days of the week (referenced from template)
			var d = this.dowTemplateString,
				dayNames = this.dateLocaleModule.getNames('days', this.dayWidth, 'standAlone', this.lang),
				dayOffset = cldrSupplemental.getFirstDayOfWeek(this.lang);
			this.dayCellsHtml = string.substitute([d,d,d,d,d,d,d].join(""), {d: ""}, function(){
				return dayNames[dayOffset++ % 7]
			});

			// Markup for dates of the month (referenced from template), but without numbers filled in
			var r = string.substitute(this.weekTemplateString, {d: this.dateTemplateString});
			this.dateRowsHtml = [r,r,r,r,r,r].join("");

			// Instantiate from template.
			// dateCells and dateLabels arrays filled when _Templated parses my template.
			this.dateCells = [];
			this.dateLabels = [];
			this.inherited(arguments);

			dom.setSelectable(this.domNode, false);

			var dateObj = new this.dateClassObj(this.currentFocus);

			this._supportingWidgets.push(this.monthWidget = this._createMonthWidget());

			this.set('currentFocus', dateObj, false);	// draw the grid to the month specified by currentFocus

			// Set up connects for increment/decrement of months/years
			var connect = lang.hitch(this, function(nodeProp, part, amount){
				this.connect(this[nodeProp], "onclick", function(){
					this._setCurrentFocusAttr(this.dateFuncObj.add(this.currentFocus, part, amount));
				});
			});
			connect("incrementMonth", "month", 1);
			connect("decrementMonth", "month", -1);
			connect("nextYearLabelNode", "year", 1);
			connect("previousYearLabelNode", "year", -1);
		},

		_setCurrentFocusAttr: function(/*Date*/ date, /*Boolean*/ forceFocus){
			// summary:
			//		If the calendar currently has focus, then focuses specified date,
			//		changing the currently displayed month/year if necessary.
			//		If the calendar doesn't have focus, updates currently
			//		displayed month/year, and sets the cell that will get focus.
			// forceFocus:
			//		If true, will focus() the cell even if calendar itself doesn't have focus

			var oldFocus = this.currentFocus,
				oldCell = oldFocus && this._date2cell ? this._date2cell[oldFocus.valueOf()] : null;

			// round specified value to nearest day (1am to avoid issues when DST shift occurs at midnight, see #8521, #9366)
			date = new this.dateClassObj(date);
			date.setHours(1, 0, 0, 0);

			this._set("currentFocus", date);

			// TODO: only re-populate grid when month/year has changed
			this._populateGrid();

			// set tabIndex=0 on new cell, and focus it (but only if Calendar itself is focused)
			var newCell = this._date2cell[date.valueOf()];
			newCell.setAttribute("tabIndex", this.tabIndex);
			if(this.focused || forceFocus){
				newCell.focus();
			}

			// set tabIndex=-1 on old focusable cell
			if(oldCell && oldCell != newCell){
				if(has("webkit")){	// see #11064 about webkit bug
					oldCell.setAttribute("tabIndex", "-1");
				}else{
					oldCell.removeAttribute("tabIndex");
				}
			}
		},

		focus: function(){
			// summary:
			//		Focus the calendar by focusing one of the calendar cells
			this._setCurrentFocusAttr(this.currentFocus, true);
		},

		_onDayClick: function(/*Event*/ evt){
			// summary:
			//      Handler for day clicks, selects the date if appropriate
			// tags:
			//      protected
			event.stop(evt);
			for(var node = evt.target; node && !node.dijitDateValue; node = node.parentNode);
			if(node && !domClass.contains(node, "dijitCalendarDisabledDate")){
				this.set('value', node.dijitDateValue);
			}
		},

		onChange: function(/*Date*/ /*===== date =====*/){
			// summary:
			//		Called only when the selected date has changed
		},

		_isSelectedDate: function(dateObject /*===== , locale =====*/){
			// summary:
			//		Extension point so developers can subclass Calendar to
			//		support multiple (concurrently) selected dates
			// dateObject: Date
			// locale: String?
			// tags:
			//		protected extension
			return this._isValidDate(this.value) && !this.dateFuncObj.compare(dateObject, this.value, "date")
		},

		isDisabledDate: function(/*===== dateObject, locale =====*/){
			// summary:
			//		May be overridden to disable certain dates in the calendar e.g. `isDisabledDate=dojo.date.locale.isWeekend`
			// dateObject: Date
			// locale: String?
			// tags:
			//      extension
/*=====
			return false; // Boolean
=====*/
		},

		getClassForDate: function(/*===== dateObject, locale =====*/){
			// summary:
			//		May be overridden to return CSS classes to associate with the date entry for the given dateObject,
			//		for example to indicate a holiday in specified locale.
			// dateObject: Date
			// locale: String?
			// tags:
			//      extension

/*=====
			return ""; // String
=====*/
		}
	});

	CalendarLite._MonthWidget = declare("dijit.CalendarLite._MonthWidget", _WidgetBase, {
		// summary:
		//		Displays name of current month padded to the width of the month
		//		w/the longest name, so that changing months doesn't change width.
		//
		//		Create as new dijit.Calendar._MonthWidget({
		//			lang: ...,
		//			dateLocaleModule: ...
		//		})

		_setMonthAttr: function(month){
			// summary:
			//		Set the current month to display as a label
			var monthNames = this.dateLocaleModule.getNames('months', 'wide', 'standAlone', this.lang, month),
				spacer =
					(has("ie") == 6 ? "" :	"<div class='dijitSpacer'>" +
						array.map(monthNames, function(s){ return "<div>" + s + "</div>"; }).join("") + "</div>");

			// Set name of current month and also fill in spacer element with all the month names
			// (invisible) so that the maximum width will affect layout.   But not on IE6 because then
			// the center <TH> overlaps the right <TH> (due to a browser bug).
			this.domNode.innerHTML =
				spacer +
				"<div class='dijitCalendarMonthLabel dijitCalendarCurrentMonthLabel'>" +
				monthNames[month.getMonth()] + "</div>";
		}
	});

	return CalendarLite;
});

},
'dojo/io/iframe':function(){
define(["../main", "require"], function(dojo, require) {
	// module:
	//		dojo/io/iframe
	// summary:
	//		TODOC

dojo.getObject("io", true, dojo);

/*=====
dojo.declare("dojo.io.iframe.__ioArgs", dojo.__IoArgs, {
	constructor: function(){
		//	summary:
		//		All the properties described in the dojo.__ioArgs type, apply
		//		to this type. The following additional properties are allowed
		//		for dojo.io.iframe.send():
		//	method: String?
		//		The HTTP method to use. "GET" or "POST" are the only supported
		//		values.  It will try to read the value from the form node's
		//		method, then try this argument. If neither one exists, then it
		//		defaults to POST.
		//	handleAs: String?
		//		Specifies what format the result data should be given to the
		//		load/handle callback. Valid values are: text, html, xml, json,
		//		javascript. IMPORTANT: For all values EXCEPT html and xml, The
		//		server response should be an HTML file with a textarea element.
		//		The response data should be inside the textarea element. Using an
		//		HTML document the only reliable, cross-browser way this
		//		transport can know when the response has loaded. For the html
		//		handleAs value, just return a normal HTML document.  NOTE: xml
		//		is now supported with this transport (as of 1.1+); a known issue
		//		is if the XML document in question is malformed, Internet Explorer
		//		will throw an uncatchable error.
		//	content: Object?
		//		If "form" is one of the other args properties, then the content
		//		object properties become hidden form form elements. For
		//		instance, a content object of {name1 : "value1"} is converted
		//		to a hidden form element with a name of "name1" and a value of
		//		"value1". If there is not a "form" property, then the content
		//		object is converted into a name=value&name=value string, by
		//		using dojo.objectToQuery().
		this.method = method;
		this.handleAs = handleAs;
		this.content = content;
	}
});
=====*/

dojo.io.iframe = {
	// summary:
	//		Sends an Ajax I/O call using and Iframe (for instance, to upload files)

	create: function(/*String*/fname, /*String*/onloadstr, /*String?*/uri){
		//	summary:
		//		Creates a hidden iframe in the page. Used mostly for IO
		//		transports.  You do not need to call this to start a
		//		dojo.io.iframe request. Just call send().
		//	fname: String
		//		The name of the iframe. Used for the name attribute on the
		//		iframe.
		//	onloadstr: String
		//		A string of JavaScript that will be executed when the content
		//		in the iframe loads.
		//	uri: String
		//		The value of the src attribute on the iframe element. If a
		//		value is not given, then dojo/resources/blank.html will be
		//		used.
		if(window[fname]){ return window[fname]; }
		if(window.frames[fname]){ return window.frames[fname]; }
		var turi = uri;
		if(!turi){
			if(dojo.config["useXDomain"] && !dojo.config["dojoBlankHtmlUrl"]){
				console.warn("dojo.io.iframe.create: When using cross-domain Dojo builds,"
					+ " please save dojo/resources/blank.html to your domain and set djConfig.dojoBlankHtmlUrl"
					+ " to the path on your domain to blank.html");
			}
			turi = (dojo.config["dojoBlankHtmlUrl"]||require.toUrl("../resources/blank.html"));
		}
		var cframe = dojo.place(
			'<iframe id="'+fname+'" name="'+fname+'" src="'+turi+'" onload="'+onloadstr+
			'" style="position: absolute; left: 1px; top: 1px; height: 1px; width: 1px; visibility: hidden">',
		dojo.body());

		window[fname] = cframe;

		return cframe;
	},

	setSrc: function(/*DOMNode*/iframe, /*String*/src, /*Boolean*/replace){
		//summary:
		//		Sets the URL that is loaded in an IFrame. The replace parameter
		//		indicates whether location.replace() should be used when
		//		changing the location of the iframe.
		try{
			if(!replace){
				if(dojo.isWebKit){
					iframe.location = src;
				}else{
					frames[iframe.name].location = src;
				}
			}else{
				// Fun with DOM 0 incompatibilities!
				var idoc;
				if(dojo.isIE || dojo.isWebKit){
					idoc = iframe.contentWindow.document;
				}else{ //  if(d.isMozilla){
					idoc = iframe.contentWindow;
				}

				//For Safari (at least 2.0.3) and Opera, if the iframe
				//has just been created but it doesn't have content
				//yet, then iframe.document may be null. In that case,
				//use iframe.location and return.
				if(!idoc){
					iframe.location = src;
				}else{
					idoc.location.replace(src);
				}
			}
		}catch(e){
			console.log("dojo.io.iframe.setSrc: ", e);
		}
	},

	doc: function(/*DOMNode*/iframeNode){
		//summary: Returns the document object associated with the iframe DOM Node argument.
		return iframeNode.contentDocument || // W3
			(
				(
					(iframeNode.name) && (iframeNode.document) &&
					(dojo.doc.getElementsByTagName("iframe")[iframeNode.name].contentWindow) &&
					(dojo.doc.getElementsByTagName("iframe")[iframeNode.name].contentWindow.document)
				)
			) ||  // IE
			(
				(iframeNode.name)&&(dojo.doc.frames[iframeNode.name])&&
				(dojo.doc.frames[iframeNode.name].document)
			) || null;
	},

	send: function(/*dojo.io.iframe.__ioArgs*/args){
		//summary:
		//		Function that sends the request to the server.
		//		This transport can only process one send() request at a time, so if send() is called
		//multiple times, it will queue up the calls and only process one at a time.
		if(!this["_frame"]){
			this._frame = this.create(this._iframeName, dojo._scopeName + ".io.iframe._iframeOnload();");
		}

		//Set up the deferred.
		var dfd = dojo._ioSetArgs(
			args,
			function(/*Deferred*/dfd){
				//summary: canceller function for dojo._ioSetArgs call.
				dfd.canceled = true;
				dfd.ioArgs._callNext();
			},
			function(/*Deferred*/dfd){
				//summary: okHandler function for dojo._ioSetArgs call.
				var value = null;
				try{
					var ioArgs = dfd.ioArgs;
					var dii = dojo.io.iframe;
					var ifd = dii.doc(dii._frame);
					var handleAs = ioArgs.handleAs;

					//Assign correct value based on handleAs value.
					value = ifd; //html
					if(handleAs != "html"){
						if(handleAs == "xml"){
							//	FF, Saf 3+ and Opera all seem to be fine with ifd being xml.  We have to
							//	do it manually for IE6-8.  Refs #6334.
							if(dojo.isIE < 9 || (dojo.isIE && dojo.isQuirks)){
								dojo.query("a", dii._frame.contentWindow.document.documentElement).orphan();
								var xmlText=(dii._frame.contentWindow.document).documentElement.innerText;
								xmlText=xmlText.replace(/>\s+</g, "><");
								xmlText=dojo.trim(xmlText);
								//Reusing some code in base dojo for handling XML content.  Simpler and keeps
								//Core from duplicating the effort needed to locate the XML Parser on IE.
								var fauxXhr = { responseText: xmlText };
								value = dojo._contentHandlers["xml"](fauxXhr); // DOMDocument
							}
						}else{
							value = ifd.getElementsByTagName("textarea")[0].value; //text
							if(handleAs == "json"){
								value = dojo.fromJson(value); //json
							}else if(handleAs == "javascript"){
								value = dojo.eval(value); //javascript
							}
						}
					}
				}catch(e){
					value = e;
				}finally{
					ioArgs._callNext();
				}
				return value;
			},
			function(/*Error*/error, /*Deferred*/dfd){
				//summary: errHandler function for dojo._ioSetArgs call.
				dfd.ioArgs._hasError = true;
				dfd.ioArgs._callNext();
				return error;
			}
		);

		//Set up a function that will fire the next iframe request. Make sure it only
		//happens once per deferred.
		dfd.ioArgs._callNext = function(){
			if(!this["_calledNext"]){
				this._calledNext = true;
				dojo.io.iframe._currentDfd = null;
				dojo.io.iframe._fireNextRequest();
			}
		};

		this._dfdQueue.push(dfd);
		this._fireNextRequest();

		//Add it the IO watch queue, to get things like timeout support.
		dojo._ioWatch(
			dfd,
			function(/*Deferred*/dfd){
				//validCheck
				return !dfd.ioArgs["_hasError"];
			},
			function(dfd){
				//ioCheck
				return (!!dfd.ioArgs["_finished"]);
			},
			function(dfd){
				//resHandle
				if(dfd.ioArgs._finished){
					dfd.callback(dfd);
				}else{
					dfd.errback(new Error("Invalid dojo.io.iframe request state"));
				}
			}
		);

		return dfd;
	},

	_currentDfd: null,
	_dfdQueue: [],
	_iframeName: dojo._scopeName + "IoIframe",

	_fireNextRequest: function(){
		//summary: Internal method used to fire the next request in the bind queue.
		try{
			if((this._currentDfd)||(this._dfdQueue.length == 0)){ return; }
			//Find next deferred, skip the canceled ones.
			do{
				var dfd = this._currentDfd = this._dfdQueue.shift();
			} while(dfd && dfd.canceled && this._dfdQueue.length);

			//If no more dfds, cancel.
			if(!dfd || dfd.canceled){
				this._currentDfd =  null;
				return;
			}

			var ioArgs = dfd.ioArgs;
			var args = ioArgs.args;

			ioArgs._contentToClean = [];
			var fn = dojo.byId(args["form"]);
			var content = args["content"] || {};
			if(fn){
				if(content){
					// if we have things in content, we need to add them to the form
					// before submission
					var pHandler = function(name, value) {
						dojo.create("input", {type: "hidden", name: name, value: value}, fn);
						ioArgs._contentToClean.push(name);
					};
					for(var x in content){
						var val = content[x];
						if(dojo.isArray(val) && val.length > 1){
							var i;
							for (i = 0; i < val.length; i++) {
								pHandler(x,val[i]);
							}
						}else{
							if(!fn[x]){
								pHandler(x,val);
							}else{
								fn[x].value = val;
							}
						}
					}
				}
				//IE requires going through getAttributeNode instead of just getAttribute in some form cases,
				//so use it for all.  See #2844
				var actnNode = fn.getAttributeNode("action");
				var mthdNode = fn.getAttributeNode("method");
				var trgtNode = fn.getAttributeNode("target");
				if(args["url"]){
					ioArgs._originalAction = actnNode ? actnNode.value : null;
					if(actnNode){
						actnNode.value = args.url;
					}else{
						fn.setAttribute("action",args.url);
					}
				}
				if(!mthdNode || !mthdNode.value){
					if(mthdNode){
						mthdNode.value= (args["method"]) ? args["method"] : "post";
					}else{
						fn.setAttribute("method", (args["method"]) ? args["method"] : "post");
					}
				}
				ioArgs._originalTarget = trgtNode ? trgtNode.value: null;
				if(trgtNode){
					trgtNode.value = this._iframeName;
				}else{
					fn.setAttribute("target", this._iframeName);
				}
				fn.target = this._iframeName;
				dojo._ioNotifyStart(dfd);
				fn.submit();
			}else{
				// otherwise we post a GET string by changing URL location for the
				// iframe
				var tmpUrl = args.url + (args.url.indexOf("?") > -1 ? "&" : "?") + ioArgs.query;
				dojo._ioNotifyStart(dfd);
				this.setSrc(this._frame, tmpUrl, true);
			}
		}catch(e){
			dfd.errback(e);
		}
	},

	_iframeOnload: function(){
		var dfd = this._currentDfd;
		if(!dfd){
			this._fireNextRequest();
			return;
		}

		var ioArgs = dfd.ioArgs;
		var args = ioArgs.args;
		var fNode = dojo.byId(args.form);

		if(fNode){
			// remove all the hidden content inputs
			var toClean = ioArgs._contentToClean;
			for(var i = 0; i < toClean.length; i++) {
				var key = toClean[i];
				//Need to cycle over all nodes since we may have added
				//an array value which means that more than one node could
				//have the same .name value.
				for(var j = 0; j < fNode.childNodes.length; j++){
					var chNode = fNode.childNodes[j];
					if(chNode.name == key){
						dojo.destroy(chNode);
						break;
					}
				}
			}

			// restore original action + target
			if(ioArgs["_originalAction"]){
				fNode.setAttribute("action", ioArgs._originalAction);
			}
			if(ioArgs["_originalTarget"]){
				fNode.setAttribute("target", ioArgs._originalTarget);
				fNode.target = ioArgs._originalTarget;
			}
		}

		ioArgs._finished = true;
	}
};

return dojo.io.iframe;
});

},
'dijit/form/_ComboBoxMenu':function(){
define("dijit/form/_ComboBoxMenu", [
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add domClass.remove
	"dojo/dom-construct", // domConstruct.create
	"dojo/dom-style", // domStyle.get
	"dojo/keys", // keys.DOWN_ARROW keys.PAGE_DOWN keys.PAGE_UP keys.UP_ARROW
	"../_WidgetBase",
	"../_TemplatedMixin",
	"./_ComboBoxMenuMixin",
	"./_ListMouseMixin"
], function(declare, domClass, domConstruct, domStyle, keys,
			_WidgetBase, _TemplatedMixin, _ComboBoxMenuMixin, _ListMouseMixin){

/*=====
	var _WidgetBase = dijit._WidgetBase;
	var _TemplatedMixin = dijit._TemplatedMixin;
	var _ComboBoxMenuMixin = dijit.form._ComboBoxMenuMixin;
	var _ListMouseMixin = dijit.form._ListMouseMixin;
=====*/

	// module:
	//		dijit/form/_ComboBoxMenu
	// summary:
	//		Focus-less menu for internal use in `dijit.form.ComboBox`

	return declare("dijit.form._ComboBoxMenu",[_WidgetBase, _TemplatedMixin, _ListMouseMixin, _ComboBoxMenuMixin], {
		// summary:
		//		Focus-less menu for internal use in `dijit.form.ComboBox`
		//              Abstract methods that must be defined externally:
		//                      onChange: item was explicitly chosen (mousedown somewhere on the menu and mouseup somewhere on the menu)
		//                      onPage: next(1) or previous(-1) button pressed
		// tags:
		//		private

		templateString: "<div class='dijitReset dijitMenu' data-dojo-attach-point='containerNode' style='overflow: auto; overflow-x: hidden;'>"
				+"<div class='dijitMenuItem dijitMenuPreviousButton' data-dojo-attach-point='previousButton' role='option'></div>"
				+"<div class='dijitMenuItem dijitMenuNextButton' data-dojo-attach-point='nextButton' role='option'></div>"
				+"</div>",

		baseClass: "dijitComboBoxMenu",

		postCreate: function(){
			this.inherited(arguments);
			if(!this.isLeftToRight()){
				domClass.add(this.previousButton, "dijitMenuItemRtl");
				domClass.add(this.nextButton, "dijitMenuItemRtl");
			}
		},

		_createMenuItem: function(){
			return domConstruct.create("div", {
				"class": "dijitReset dijitMenuItem" +(this.isLeftToRight() ? "" : " dijitMenuItemRtl"),
				role: "option"
			});
		},

		onHover: function(/*DomNode*/ node){
			// summary:
			//		Add hover CSS
			domClass.add(node, "dijitMenuItemHover");
		},

		onUnhover: function(/*DomNode*/ node){
			// summary:
			//		Remove hover CSS
			domClass.remove(node, "dijitMenuItemHover");
		},

		onSelect: function(/*DomNode*/ node){
			// summary:
			//		Add selected CSS
			domClass.add(node, "dijitMenuItemSelected");
		},

		onDeselect: function(/*DomNode*/ node){
			// summary:
			//		Remove selected CSS
			domClass.remove(node, "dijitMenuItemSelected");
		},

		_page: function(/*Boolean*/ up){
			// summary:
			//		Handles page-up and page-down keypresses

			var scrollamount = 0;
			var oldscroll = this.domNode.scrollTop;
			var height = domStyle.get(this.domNode, "height");
			// if no item is highlighted, highlight the first option
			if(!this.getHighlightedOption()){
				this.selectNextNode();
			}
			while(scrollamount<height){
				var highlighted_option = this.getHighlightedOption();
				if(up){
					// stop at option 1
					if(!highlighted_option.previousSibling ||
						highlighted_option.previousSibling.style.display == "none"){
						break;
					}
					this.selectPreviousNode();
				}else{
					// stop at last option
					if(!highlighted_option.nextSibling ||
						highlighted_option.nextSibling.style.display == "none"){
						break;
					}
					this.selectNextNode();
				}
				// going backwards
				var newscroll = this.domNode.scrollTop;
				scrollamount += (newscroll-oldscroll)*(up ? -1:1);
				oldscroll = newscroll;
			}
		},

		handleKey: function(evt){
			// summary:
			//		Handle keystroke event forwarded from ComboBox, returning false if it's
			//		a keystroke I recognize and process, true otherwise.
			switch(evt.charOrCode){
				case keys.DOWN_ARROW:
					this.selectNextNode();
					return false;
				case keys.PAGE_DOWN:
					this._page(false);
					return false;
				case keys.UP_ARROW:
					this.selectPreviousNode();
					return false;
				case keys.PAGE_UP:
					this._page(true);
					return false;
				default:
					return true;
			}
		}
	});
});

},
'dijit/form/_DateTimeTextBox':function(){
require({cache:{
'url:dijit/form/templates/DropDownBox.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\"\r\n\tid=\"widget_${id}\"\r\n\trole=\"combobox\"\r\n\t><div class='dijitReset dijitRight dijitButtonNode dijitArrowButton dijitDownArrowButton dijitArrowButtonContainer'\r\n\t\tdata-dojo-attach-point=\"_buttonNode, _popupStateNode\" role=\"presentation\"\r\n\t\t><input class=\"dijitReset dijitInputField dijitArrowButtonInner\" value=\"&#9660; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t\t\t${_buttonInputDisabled}\r\n\t/></div\r\n\t><div class='dijitReset dijitValidationContainer'\r\n\t\t><input class=\"dijitReset dijitInputField dijitValidationIcon dijitValidationInner\" value=\"&#935; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\r\n\t/></div\r\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\r\n\t\t><input class='dijitReset dijitInputInner' ${!nameAttrSetting} type=\"text\" autocomplete=\"off\"\r\n\t\t\tdata-dojo-attach-point=\"textbox,focusNode\" role=\"textbox\" aria-haspopup=\"true\"\r\n\t/></div\r\n></div>\r\n"}});
define("dijit/form/_DateTimeTextBox", [
	"dojo/date", // date date.compare
	"dojo/date/locale", // locale.regexp
	"dojo/date/stamp", // stamp.fromISOString stamp.toISOString
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.getObject
	"./RangeBoundTextBox",
	"../_HasDropDown",
	"dojo/text!./templates/DropDownBox.html"
], function(date, locale, stamp, declare, lang, RangeBoundTextBox, _HasDropDown, template){

/*=====
	var _HasDropDown = dijit._HasDropDown;
	var RangeBoundTextBox = dijit.form.RangeBoundTextBox;
=====*/

	// module:
	//		dijit/form/_DateTimeTextBox
	// summary:
	//		Base class for validating, serializable, range-bound date or time text box.


	new Date("X"); // workaround for #11279, new Date("") == NaN

	/*=====
	declare(
		"dijit.form._DateTimeTextBox.__Constraints",
		[RangeBoundTextBox.__Constraints, locale.__FormatOptions], {
		// summary:
		//		Specifies both the rules on valid/invalid values (first/last date/time allowed),
		//		and also formatting options for how the date/time is displayed.
		// example:
		//		To restrict to dates within 2004, displayed in a long format like "December 25, 2005":
		//	|		{min:'2004-01-01',max:'2004-12-31', formatLength:'long'}
	});
	=====*/

	var _DateTimeTextBox = declare("dijit.form._DateTimeTextBox", [RangeBoundTextBox, _HasDropDown], {
		// summary:
		//		Base class for validating, serializable, range-bound date or time text box.

		templateString: template,

		// hasDownArrow: [const] Boolean
		//		Set this textbox to display a down arrow button, to open the drop down list.
		hasDownArrow: true,

		// openOnClick: [const] Boolean
		//		Set to true to open drop down upon clicking anywhere on the textbox.
		openOnClick: true,

		/*=====
		// constraints: dijit.form._DateTimeTextBox.__Constraints
		//		Despite the name, this parameter specifies both constraints on the input
		//		(including starting/ending dates/times allowed) as well as
		//		formatting options like whether the date is displayed in long (ex: December 25, 2005)
		//		or short (ex: 12/25/2005) format.  See `dijit.form._DateTimeTextBox.__Constraints` for details.
		constraints: {},
		======*/

		// Override ValidationTextBox.regExpGen().... we use a reg-ex generating function rather
		// than a straight regexp to deal with locale  (plus formatting options too?)
		regExpGen: locale.regexp,

		// datePackage: String
		//		JavaScript namespace to find calendar routines.	 Uses Gregorian calendar routines
		//		at dojo.date, by default.
		datePackage: date,

		postMixInProperties: function(){
			this.inherited(arguments);
			this._set("type", "text"); // in case type="date"|"time" was specified which messes up parse/format
		},

		// Override _FormWidget.compare() to work for dates/times
		compare: function(/*Date*/ val1, /*Date*/ val2){
			var isInvalid1 = this._isInvalidDate(val1);
			var isInvalid2 = this._isInvalidDate(val2);
			return isInvalid1 ? (isInvalid2 ? 0 : -1) : (isInvalid2 ? 1 : date.compare(val1, val2, this._selector));
		},

		// flag to _HasDropDown to make drop down Calendar width == <input> width
		forceWidth: true,

		format: function(/*Date*/ value, /*dojo.date.locale.__FormatOptions*/ constraints){
			// summary:
			//		Formats the value as a Date, according to specified locale (second argument)
			// tags:
			//		protected
			if(!value){ return ''; }
			return this.dateLocaleModule.format(value, constraints);
		},

		"parse": function(/*String*/ value, /*dojo.date.locale.__FormatOptions*/ constraints){
			// summary:
			//		Parses as string as a Date, according to constraints
			// tags:
			//		protected

			return this.dateLocaleModule.parse(value, constraints) || (this._isEmpty(value) ? null : undefined);	 // Date
		},

		// Overrides ValidationTextBox.serialize() to serialize a date in canonical ISO format.
		serialize: function(/*anything*/ val, /*Object?*/ options){
			if(val.toGregorian){
				val = val.toGregorian();
			}
			return stamp.toISOString(val, options);
		},

		// dropDownDefaultValue: Date
		//		The default value to focus in the popupClass widget when the textbox value is empty.
		dropDownDefaultValue : new Date(),

		// value: Date
		//		The value of this widget as a JavaScript Date object.  Use get("value") / set("value", val) to manipulate.
		//		When passed to the parser in markup, must be specified according to `dojo.date.stamp.fromISOString`
		value: new Date(""),	// value.toString()="NaN"

		_blankValue: null,	// used by filter() when the textbox is blank

		// popupClass: [protected extension] String
		//		Name of the popup widget class used to select a date/time.
		//		Subclasses should specify this.
		popupClass: "", // default is no popup = text only


		// _selector: [protected extension] String
		//		Specifies constraints.selector passed to dojo.date functions, should be either
		//		"date" or "time".
		//		Subclass must specify this.
		_selector: "",

		constructor: function(/*Object*/ args){
			this.datePackage = args.datePackage || this.datePackage;
			this.dateFuncObj = typeof this.datePackage == "string" ?
				lang.getObject(this.datePackage, false) :// "string" part for back-compat, remove for 2.0
				this.datePackage;
			this.dateClassObj = this.dateFuncObj.Date || Date;
			this.dateLocaleModule = lang.getObject("locale", false, this.dateFuncObj);
			this.regExpGen = this.dateLocaleModule.regexp;
			this._invalidDate = this.constructor.prototype.value.toString();
		},

		buildRendering: function(){
			this.inherited(arguments);

			if(!this.hasDownArrow){
				this._buttonNode.style.display = "none";
			}

			// If openOnClick is true, we basically just want to treat the whole widget as the
			// button.  We need to do that also if the actual drop down button will be hidden,
			// so that there's a mouse method for opening the drop down.
			if(this.openOnClick || !this.hasDownArrow){
				this._buttonNode = this.domNode;
				this.baseClass += " dijitComboBoxOpenOnClick";
			}
		},

		_setConstraintsAttr: function(/*Object*/ constraints){
			constraints.selector = this._selector;
			constraints.fullYear = true; // see #5465 - always format with 4-digit years
			var fromISO = stamp.fromISOString;
			if(typeof constraints.min == "string"){ constraints.min = fromISO(constraints.min); }
 			if(typeof constraints.max == "string"){ constraints.max = fromISO(constraints.max); }
			this.inherited(arguments);
		},

		_isInvalidDate: function(/*Date*/ value){
			// summary:
			//		Runs various tests on the value, checking for invalid conditions
			// tags:
			//		private
			return !value || isNaN(value) || typeof value != "object" || value.toString() == this._invalidDate;
		},

		_setValueAttr: function(/*Date|String*/ value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
			// summary:
			//		Sets the date on this textbox. Note: value can be a JavaScript Date literal or a string to be parsed.
			if(value !== undefined){
				if(typeof value == "string"){
					value = stamp.fromISOString(value);
				}
				if(this._isInvalidDate(value)){
					value = null;
				}
				if(value instanceof Date && !(this.dateClassObj instanceof Date)){
					value = new this.dateClassObj(value);
				}
			}
			this.inherited(arguments);
			if(this.value instanceof Date){
				this.filterString = "";
			}
			if(this.dropDown){
				this.dropDown.set('value', value, false);
			}
		},

		_set: function(attr, value){
			// Avoid spurious watch() notifications when value is changed to new Date object w/the same value
			if(attr == "value" && this.value instanceof Date && this.compare(value, this.value) == 0){
				return;
			}
			this.inherited(arguments);
		},

		_setDropDownDefaultValueAttr: function(/*Date*/ val){
			if(this._isInvalidDate(val)){
				// convert null setting into today's date, since there needs to be *some* default at all times.
				 val = new this.dateClassObj();
			}
			this.dropDownDefaultValue = val;
		},

		openDropDown: function(/*Function*/ callback){
			// rebuild drop down every time, so that constraints get copied (#6002)
			if(this.dropDown){
				this.dropDown.destroy();
			}
			var PopupProto = lang.isString(this.popupClass) ? lang.getObject(this.popupClass, false) : this.popupClass,
				textBox = this,
				value = this.get("value");
			this.dropDown = new PopupProto({
				onChange: function(value){
					// this will cause InlineEditBox and other handlers to do stuff so make sure it's last
					textBox.set('value', value, true);
				},
				id: this.id + "_popup",
				dir: textBox.dir,
				lang: textBox.lang,
				value: value,
				currentFocus: !this._isInvalidDate(value) ? value : this.dropDownDefaultValue,
					constraints: textBox.constraints,
				filterString: textBox.filterString, // for TimeTextBox, to filter times shown

					datePackage: textBox.datePackage,

					isDisabledDate: function(/*Date*/ date){
						// summary:
						// 	disables dates outside of the min/max of the _DateTimeTextBox
						return !textBox.rangeCheck(date, textBox.constraints);
					}
				});

			this.inherited(arguments);
		},

		_getDisplayedValueAttr: function(){
			return this.textbox.value;
		},

		_setDisplayedValueAttr: function(/*String*/ value, /*Boolean?*/ priorityChange){
			this._setValueAttr(this.parse(value, this.constraints), priorityChange, value);
		}
	});

	return _DateTimeTextBox;
});

},
'dijit/Calendar':function(){
define("dijit/Calendar", [
	"dojo/_base/array", // array.map
	"dojo/date",
	"dojo/date/locale",
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.get
	"dojo/dom-class", // domClass.add domClass.contains domClass.remove domClass.toggle
	"dojo/_base/event", // event.stop
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/keys", // keys
	"dojo/_base/lang", // lang.hitch
	"dojo/_base/sniff", // has("ie")
	"./CalendarLite",
	"./_Widget",
	"./_CssStateMixin",
	"./_TemplatedMixin",
	"./form/DropDownButton",
	"./hccss"	// not used directly, but sets CSS class on <body>
], function(array, date, local, declare, domAttr, domClass, event, kernel, keys, lang, has,
			CalendarLite, _Widget, _CssStateMixin, _TemplatedMixin, DropDownButton){

/*=====
	var CalendarLite = dijit.CalendarLite;
	var _CssStateMixin = dijit._CssStateMixin;
	var _Widget = dijit._Widget;
	var _TemplatedMixin = dijit._TemplatedMixin;
	var DropDownButton = dijit.form.DropDownButton;
=====*/

	// module:
	//		dijit/Calendar
	// summary:
	//		A simple GUI for choosing a date in the context of a monthly calendar.

	var Calendar = declare("dijit.Calendar",
		[CalendarLite, _Widget, _CssStateMixin], // _Widget for deprecated methods like setAttribute()
		{
		// summary:
		//		A simple GUI for choosing a date in the context of a monthly calendar.
		//
		// description:
		//		See CalendarLite for general description.   Calendar extends CalendarLite, adding:
		//			- month drop down list
		//			- keyboard navigation
		//			- CSS classes for hover/mousepress on date, month, and year nodes
		//			- support of deprecated methods (will be removed in 2.0)

		// Set node classes for various mouse events, see dijit._CssStateMixin for more details
		cssStateNodes: {
			"decrementMonth": "dijitCalendarArrow",
			"incrementMonth": "dijitCalendarArrow",
			"previousYearLabelNode": "dijitCalendarPreviousYear",
			"nextYearLabelNode": "dijitCalendarNextYear"
		},

		setValue: function(/*Date*/ value){
			// summary:
			//      Deprecated.   Use set('value', ...) instead.
			// tags:
			//      deprecated
			kernel.deprecated("dijit.Calendar:setValue() is deprecated.  Use set('value', ...) instead.", "", "2.0");
			this.set('value', value);
		},

		_createMonthWidget: function(){
			// summary:
			//		Creates the drop down button that displays the current month and lets user pick a new one

			return new Calendar._MonthDropDownButton({
				id: this.id + "_mddb",
				tabIndex: -1,
				onMonthSelect: lang.hitch(this, "_onMonthSelect"),
				lang: this.lang,
				dateLocaleModule: this.dateLocaleModule
			}, this.monthNode);
		},

		buildRendering: function(){
			this.inherited(arguments);

			// Events specific to Calendar, not used in CalendarLite
			this.connect(this.domNode, "onkeypress", "_onKeyPress");
			this.connect(this.dateRowsNode, "onmouseover", "_onDayMouseOver");
			this.connect(this.dateRowsNode, "onmouseout", "_onDayMouseOut");
			this.connect(this.dateRowsNode, "onmousedown", "_onDayMouseDown");
			this.connect(this.dateRowsNode, "onmouseup", "_onDayMouseUp");
		},

		_onMonthSelect: function(/*Number*/ newMonth){
			// summary:
			//      Handler for when user selects a month from the drop down list
			// tags:
			//      protected

			// move to selected month, bounding by the number of days in the month
			// (ex: dec 31 --> jan 28, not jan 31)
			this._setCurrentFocusAttr(this.dateFuncObj.add(this.currentFocus, "month",
				newMonth - this.currentFocus.getMonth()));
		},

		_onDayMouseOver: function(/*Event*/ evt){
			// summary:
			//      Handler for mouse over events on days, sets hovered style
			// tags:
			//      protected

			// event can occur on <td> or the <span> inside the td,
			// set node to the <td>.
			var node =
				domClass.contains(evt.target, "dijitCalendarDateLabel") ?
				evt.target.parentNode :
				evt.target;

			if(node && (
				(node.dijitDateValue && !domClass.contains(node, "dijitCalendarDisabledDate"))
					|| node == this.previousYearLabelNode || node == this.nextYearLabelNode
				)){
				domClass.add(node, "dijitCalendarHoveredDate");
				this._currentNode = node;
			}
		},

		_onDayMouseOut: function(/*Event*/ evt){
			// summary:
			//      Handler for mouse out events on days, clears hovered style
			// tags:
			//      protected

			if(!this._currentNode){ return; }

			// if mouse out occurs moving from <td> to <span> inside <td>, ignore it
			if(evt.relatedTarget && evt.relatedTarget.parentNode == this._currentNode){ return; }
			var cls = "dijitCalendarHoveredDate";
			if(domClass.contains(this._currentNode, "dijitCalendarActiveDate")){
				cls += " dijitCalendarActiveDate";
			}
			domClass.remove(this._currentNode, cls);
			this._currentNode = null;
		},

		_onDayMouseDown: function(/*Event*/ evt){
			var node = evt.target.parentNode;
			if(node && node.dijitDateValue && !domClass.contains(node, "dijitCalendarDisabledDate")){
				domClass.add(node, "dijitCalendarActiveDate");
				this._currentNode = node;
			}
		},

		_onDayMouseUp: function(/*Event*/ evt){
			var node = evt.target.parentNode;
			if(node && node.dijitDateValue){
				domClass.remove(node, "dijitCalendarActiveDate");
			}
		},

		handleKey: function(/*Event*/ evt){
			// summary:
			//		Provides keyboard navigation of calendar.
			// description:
			//		Called from _onKeyPress() to handle keypress on a stand alone Calendar,
			//		and also from `dijit.form._DateTimeTextBox` to pass a keypress event
			//		from the `dijit.form.DateTextBox` to be handled in this widget
			// returns:
			//		False if the key was recognized as a navigation key,
			//		to indicate that the event was handled by Calendar and shouldn't be propogated
			// tags:
			//		protected
			var increment = -1,
				interval,
				newValue = this.currentFocus;
			switch(evt.charOrCode){
				case keys.RIGHT_ARROW:
					increment = 1;
					//fallthrough...
				case keys.LEFT_ARROW:
					interval = "day";
					if(!this.isLeftToRight()){ increment *= -1; }
					break;
				case keys.DOWN_ARROW:
					increment = 1;
					//fallthrough...
				case keys.UP_ARROW:
					interval = "week";
					break;
				case keys.PAGE_DOWN:
					increment = 1;
					//fallthrough...
				case keys.PAGE_UP:
					interval = evt.ctrlKey || evt.altKey ? "year" : "month";
					break;
				case keys.END:
					// go to the next month
					newValue = this.dateFuncObj.add(newValue, "month", 1);
					// subtract a day from the result when we're done
					interval = "day";
					//fallthrough...
				case keys.HOME:
					newValue = new this.dateClassObj(newValue);
					newValue.setDate(1);
					break;
				case keys.ENTER:
				case " ":
					this.set("value", this.currentFocus);
					break;
				default:
					return true;
			}

			if(interval){
				newValue = this.dateFuncObj.add(newValue, interval, increment);
			}

			this._setCurrentFocusAttr(newValue);

			return false;
		},

		_onKeyPress: function(/*Event*/ evt){
			// summary:
			//		For handling keypress events on a stand alone calendar
			if(!this.handleKey(evt)){
				event.stop(evt);
			}
		},

		onValueSelected: function(/*Date*/ /*===== date =====*/){
			// summary:
			//		Deprecated.   Notification that a date cell was selected.  It may be the same as the previous value.
			// description:
			//      Formerly used by `dijit.form._DateTimeTextBox` (and thus `dijit.form.DateTextBox`)
			//      to get notification when the user has clicked a date.  Now onExecute() (above) is used.
			// tags:
			//      protected
		},

		onChange: function(value){
			this.onValueSelected(value);	// remove in 2.0
		},

		getClassForDate: function(/*===== dateObject, locale =====*/){
			// summary:
			//		May be overridden to return CSS classes to associate with the date entry for the given dateObject,
			//		for example to indicate a holiday in specified locale.
			// dateObject: Date
			// locale: String?
			// tags:
			//      extension

/*=====
			return ""; // String
=====*/
		}
	});

	Calendar._MonthDropDownButton = declare("dijit.Calendar._MonthDropDownButton", DropDownButton, {
		// summary:
		//		DropDownButton for the current month.    Displays name of current month
		//		and a list of month names in the drop down

		onMonthSelect: function(){ },

		postCreate: function(){
			this.inherited(arguments);
			this.dropDown = new Calendar._MonthDropDown({
				id: this.id + "_mdd", //do not change this id because it is referenced in the template
				onChange: this.onMonthSelect
			});
		},
		_setMonthAttr: function(month){
			// summary:
			//		Set the current month to display as a label
			var monthNames = this.dateLocaleModule.getNames('months', 'wide', 'standAlone', this.lang, month);
			this.dropDown.set("months", monthNames);

			// Set name of current month and also fill in spacer element with all the month names
			// (invisible) so that the maximum width will affect layout.   But not on IE6 because then
			// the center <TH> overlaps the right <TH> (due to a browser bug).
			this.containerNode.innerHTML =
				(has("ie") == 6 ? "" : "<div class='dijitSpacer'>" + this.dropDown.domNode.innerHTML + "</div>") +
				"<div class='dijitCalendarMonthLabel dijitCalendarCurrentMonthLabel'>" +  monthNames[month.getMonth()] + "</div>";
		}
	});

	Calendar._MonthDropDown = declare("dijit.Calendar._MonthDropDown", [_Widget, _TemplatedMixin], {
		// summary:
		//		The list-of-months drop down from the MonthDropDownButton

		// months: String[]
		//		List of names of months, possibly w/some undefined entries for Hebrew leap months
		//		(ex: ["January", "February", undefined, "April", ...])
		months: [],

		templateString: "<div class='dijitCalendarMonthMenu dijitMenu' " +
			"data-dojo-attach-event='onclick:_onClick,onmouseover:_onMenuHover,onmouseout:_onMenuHover'></div>",

		_setMonthsAttr: function(/*String[]*/ months){
			this.domNode.innerHTML = array.map(months, function(month, idx){
					return month ? "<div class='dijitCalendarMonthLabel' month='" + idx +"'>" + month + "</div>" : "";
				}).join("");
		},

		_onClick: function(/*Event*/ evt){
			this.onChange(domAttr.get(evt.target, "month"));
		},

		onChange: function(/*Number*/ /*===== month =====*/){
			// summary:
			//		Callback when month is selected from drop down
		},

		_onMenuHover: function(evt){
			domClass.toggle(evt.target, "dijitCalendarMonthLabelHover", evt.type == "mouseover");
		}
	});

	return Calendar;
});

},
'dijit/_editor/selection':function(){
define("dijit/_editor/selection", [
	"dojo/dom", // dom.byId
	"dojo/_base/lang",
	"dojo/_base/sniff", // has("ie") has("opera")
	"dojo/_base/window", // win.body win.doc win.doc.createElement win.doc.selection win.doc.selection.createRange win.doc.selection.type.toLowerCase win.global win.global.getSelection
	".."		// for exporting symbols to dijit._editor.selection (TODO: remove in 2.0)
], function(dom, lang, has, win, dijit){

// module:
//		dijit/_editor/selection
// summary:
//		Text selection API


lang.getObject("_editor.selection", true, dijit);

// FIXME:
//		all of these methods branch internally for IE. This is probably
//		sub-optimal in terms of runtime performance. We should investigate the
//		size difference for differentiating at definition time.

lang.mixin(dijit._editor.selection, {
	getType: function(){
		// summary:
		//		Get the selection type (like win.doc.select.type in IE).
		if(has("ie") < 9){
			return win.doc.selection.type.toLowerCase();
		}else{
			var stype = "text";

			// Check if the actual selection is a CONTROL (IMG, TABLE, HR, etc...).
			var oSel;
			try{
				oSel = win.global.getSelection();
			}catch(e){ /*squelch*/ }

			if(oSel && oSel.rangeCount == 1){
				var oRange = oSel.getRangeAt(0);
				if(	(oRange.startContainer == oRange.endContainer) &&
					((oRange.endOffset - oRange.startOffset) == 1) &&
					(oRange.startContainer.nodeType != 3 /* text node*/)
				){
					stype = "control";
				}
			}
			return stype; //String
		}
	},

	getSelectedText: function(){
		// summary:
		//		Return the text (no html tags) included in the current selection or null if no text is selected
		if(has("ie") < 9){
			if(dijit._editor.selection.getType() == 'control'){
				return null;
			}
			return win.doc.selection.createRange().text;
		}else{
			var selection = win.global.getSelection();
			if(selection){
				return selection.toString(); //String
			}
		}
		return '';
	},

	getSelectedHtml: function(){
		// summary:
		//		Return the html text of the current selection or null if unavailable
		if(has("ie") < 9){
			if(dijit._editor.selection.getType() == 'control'){
				return null;
			}
			return win.doc.selection.createRange().htmlText;
		}else{
			var selection = win.global.getSelection();
			if(selection && selection.rangeCount){
				var i;
				var html = "";
				for(i = 0; i < selection.rangeCount; i++){
					//Handle selections spanning ranges, such as Opera
					var frag = selection.getRangeAt(i).cloneContents();
					var div = win.doc.createElement("div");
					div.appendChild(frag);
					html += div.innerHTML;
				}
				return html; //String
			}
			return null;
		}
	},

	getSelectedElement: function(){
		// summary:
		//		Retrieves the selected element (if any), just in the case that
		//		a single element (object like and image or a table) is
		//		selected.
		if(dijit._editor.selection.getType() == "control"){
			if(has("ie") < 9){
				var range = win.doc.selection.createRange();
				if(range && range.item){
					return win.doc.selection.createRange().item(0);
				}
			}else{
				var selection = win.global.getSelection();
				return selection.anchorNode.childNodes[ selection.anchorOffset ];
			}
		}
		return null;
	},

	getParentElement: function(){
		// summary:
		//		Get the parent element of the current selection
		if(dijit._editor.selection.getType() == "control"){
			var p = this.getSelectedElement();
			if(p){ return p.parentNode; }
		}else{
			if(has("ie") < 9){
				var r = win.doc.selection.createRange();
				r.collapse(true);
				return r.parentElement();
			}else{
				var selection = win.global.getSelection();
				if(selection){
					var node = selection.anchorNode;
					while(node && (node.nodeType != 1)){ // not an element
						node = node.parentNode;
					}
					return node;
				}
			}
		}
		return null;
	},

	hasAncestorElement: function(/*String*/tagName /* ... */){
		// summary:
		// 		Check whether current selection has a  parent element which is
		// 		of type tagName (or one of the other specified tagName)
		// tagName: String
		//		The tag name to determine if it has an ancestor of.
		return this.getAncestorElement.apply(this, arguments) != null; //Boolean
	},

	getAncestorElement: function(/*String*/tagName /* ... */){
		// summary:
		//		Return the parent element of the current selection which is of
		//		type tagName (or one of the other specified tagName)
		// tagName: String
		//		The tag name to determine if it has an ancestor of.
		var node = this.getSelectedElement() || this.getParentElement();
		return this.getParentOfType(node, arguments); //DOMNode
	},

	isTag: function(/*DomNode*/ node, /*String[]*/ tags){
		// summary:
		//		Function to determine if a node is one of an array of tags.
		// node:
		//		The node to inspect.
		// tags:
		//		An array of tag name strings to check to see if the node matches.
		if(node && node.tagName){
			var _nlc = node.tagName.toLowerCase();
			for(var i=0; i<tags.length; i++){
				var _tlc = String(tags[i]).toLowerCase();
				if(_nlc == _tlc){
					return _tlc; // String
				}
			}
		}
		return "";
	},

	getParentOfType: function(/*DomNode*/ node, /*String[]*/ tags){
		// summary:
		//		Function to locate a parent node that matches one of a set of tags
		// node:
		//		The node to inspect.
		// tags:
		//		An array of tag name strings to check to see if the node matches.
		while(node){
			if(this.isTag(node, tags).length){
				return node; // DOMNode
			}
			node = node.parentNode;
		}
		return null;
	},

	collapse: function(/*Boolean*/beginning){
		// summary:
		//		Function to collapse (clear), the current selection
		// beginning: Boolean
		//		Boolean to indicate whether to collapse the cursor to the beginning of the selection or end.
		if(window.getSelection){
			var selection = win.global.getSelection();
			if(selection.removeAllRanges){ // Mozilla
				if(beginning){
					selection.collapseToStart();
				}else{
					selection.collapseToEnd();
				}
			}else{ // Safari
				// pulled from WebCore/ecma/kjs_window.cpp, line 2536
				selection.collapse(beginning);
			}
		}else if(has("ie")){ // IE
			var range = win.doc.selection.createRange();
			range.collapse(beginning);
			range.select();
		}
	},

	remove: function(){
		// summary:
		//		Function to delete the currently selected content from the document.
		var sel = win.doc.selection;
		if(has("ie") < 9){
			if(sel.type.toLowerCase() != "none"){
				sel.clear();
			}
			return sel; //Selection
		}else{
			sel = win.global.getSelection();
			sel.deleteFromDocument();
			return sel; //Selection
		}
	},

	selectElementChildren: function(/*DomNode*/element,/*Boolean?*/nochangefocus){
		// summary:
		//		clear previous selection and select the content of the node
		//		(excluding the node itself)
		// element: DOMNode
		//		The element you wish to select the children content of.
		// nochangefocus: Boolean
		//		Boolean to indicate if the foxus should change or not.
		var global = win.global;
		var doc = win.doc;
		var range;
		element = dom.byId(element);
		if(doc.selection && has("ie") < 9 && win.body().createTextRange){ // IE
			range = element.ownerDocument.body.createTextRange();
			range.moveToElementText(element);
			if(!nochangefocus){
				try{
					range.select(); // IE throws an exception here if the widget is hidden.  See #5439
				}catch(e){ /* squelch */}
			}
		}else if(global.getSelection){
			var selection = win.global.getSelection();
			if(has("opera")){
				//Opera's selectAllChildren doesn't seem to work right
				//against <body> nodes and possibly others ... so
				//we use the W3C range API
				if(selection.rangeCount){
					range = selection.getRangeAt(0);
				}else{
					range = doc.createRange();
				}
				range.setStart(element, 0);
				range.setEnd(element,(element.nodeType == 3)?element.length:element.childNodes.length);
				selection.addRange(range);
			}else{
				selection.selectAllChildren(element);
			}
		}
	},

	selectElement: function(/*DomNode*/element,/*Boolean?*/nochangefocus){
		// summary:
		//		clear previous selection and select element (including all its children)
		// element:  DOMNode
		//		The element to select.
		// nochangefocus: Boolean
		//		Boolean indicating if the focus should be changed.  IE only.
		var range;
		var doc = win.doc;
		var global = win.global;
		element = dom.byId(element);
		if(has("ie") < 9 && win.body().createTextRange){
			try{
				var tg = element.tagName ? element.tagName.toLowerCase() : "";
				if(tg === "img" || tg === "table"){
					range = win.body().createControlRange();
				}else{
					range = win.body().createRange();
				}
				range.addElement(element);
				if(!nochangefocus){
					range.select();
				}
			}catch(e){
				this.selectElementChildren(element,nochangefocus);
			}
		}else if(global.getSelection){
			var selection = global.getSelection();
			range = doc.createRange();
			if(selection.removeAllRanges){ // Mozilla
				// FIXME: does this work on Safari?
				if(has("opera")){
					//Opera works if you use the current range on
					//the selection if present.
					if(selection.getRangeAt(0)){
						range = selection.getRangeAt(0);
					}
				}
				range.selectNode(element);
				selection.removeAllRanges();
				selection.addRange(range);
			}
		}
	},

	inSelection: function(node){
		// summary:
		//		This function determines if 'node' is
		//		in the current selection.
		// tags:
		//		public
		if(node){
			var newRange;
			var doc = win.doc;
			var range;

			if(win.global.getSelection){
				//WC3
				var sel = win.global.getSelection();
				if(sel && sel.rangeCount > 0){
					range = sel.getRangeAt(0);
				}
				if(range && range.compareBoundaryPoints && doc.createRange){
					try{
						newRange = doc.createRange();
						newRange.setStart(node, 0);
						if(range.compareBoundaryPoints(range.START_TO_END, newRange) === 1){
							return true;
						}
					}catch(e){ /* squelch */}
				}
			}else if(doc.selection){
				// Probably IE, so we can't use the range object as the pseudo
				// range doesn't implement the boundry checking, we have to
				// use IE specific crud.
				range = doc.selection.createRange();
				try{
					newRange = node.ownerDocument.body.createControlRange();
					if(newRange){
						newRange.addElement(node);
					}
				}catch(e1){
					try{
						newRange = node.ownerDocument.body.createTextRange();
						newRange.moveToElementText(node);
					}catch(e2){/* squelch */}
				}
				if(range && newRange){
					// We can finally compare similar to W3C
					if(range.compareEndPoints("EndToStart", newRange) === 1){
						return true;
					}
				}
			}
		}
		return false; // boolean
	}

});

return dijit._editor.selection;
});

},
'dijit/form/nls/ComboBox':function(){
define("dijit/form/nls/ComboBox", { root:
//begin v1.x content
({
		previousMessage: "Previous choices",
		nextMessage: "More choices"
})
//end v1.x content
,
"zh": true,
"zh-tw": true,
"tr": true,
"th": true,
"sv": true,
"sl": true,
"sk": true,
"ru": true,
"ro": true,
"pt": true,
"pt-pt": true,
"pl": true,
"nl": true,
"nb": true,
"ko": true,
"kk": true,
"ja": true,
"it": true,
"hu": true,
"hr": true,
"he": true,
"fr": true,
"fi": true,
"es": true,
"el": true,
"de": true,
"da": true,
"cs": true,
"ca": true,
"az": true,
"ar": true
});

},
'esri/layers/FeatureLayer':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/layers/graphics,esri/tasks/query,dojo/io/iframe,esri/layers/agscommon,dojo/date/locale"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.FeatureLayer");

dojo.require("esri.layers.graphics");
dojo.require("esri.tasks.query");
dojo.require("dojo.io.iframe");
dojo.require("esri.layers.agscommon");
dojo.require("dojo.date.locale");

// TODO
// Support for spatial definition in snapshot mode
// Optimize zoom-in operation in on-demand mode
// In snapshot mode, "selection" and "query" should happen on the client for most cases.
// Looks like we need to "suspend" the layer when the layer defn and map time extent did not overlap 
// [NEED TO REPRO] In snapshot mode, panning after zooming into a small area with a handful of features causes page freeze for a while.
//   - Need to optimize this based on a spatial index featureMap/cellMap similar to on-demand mode
// what about onLoad, onUpdate(on-demand mode) etc?
// onUpdate/onRefresh/onRedraw
// data store
// clustering
// modify GL to perform clipping using the grid extent in ondemand mode
// should the graphics layer always display the selected features? (clipping). Yes - it will be good for user experience 
// [FIXED] modify esri.request to fix the etag issue - utils.js, query.js, xhr.js
// [DONE] time offset
// [DONE] Client-side selection should honor query.timeExtent (i.e. time definition, map time extent)
// [DONE] Apply - layer defn expr, layer time defn, map time extent - to selectFeatures, queryFeatures, queryIds
// [DONE] Layer refresh is not honoring the map's time extent
// [DONE] Snapshot mode should honor map time extent (i.e. filter) after querying
// [DONE] Add refresh impl
// [NON-ISSUE] fix coded values domain format
// [DONE] min/max scale
// [DONE] enable infoTemplate
// [PARTIAL] [haitham] select a feature and move it, then zoom in, the feature layer shows the feature in the old location
//   - the feature will be in the new location as long as it remains selected thru the zoom operation
//   - need not be selected if the FL caches features across zoom levels
// [JEREMY] Unable to change the selection symbol between various types.
// [DONE] Add add/remove/refresh impl [NOTE: may be revoked later]
// [DONE] do not "select" when double clicking on a feature (map zoom in).
// [AS DESIGNED] add selectFeatures(oids/features, selectionMethod)?
// [DONE] add query methods
// [DONE] definition expression. set "null" in snapshot mode does "1=1", in ondemand mode uses "null". getter should return appropriate value
// [DONE] initial implementation for editing
// [DONE] add "map-render" mode
// [DONE] outFields issue - oidField in snapshot, ondemand modes
// [DONE] cannot lose selection on zoom in/out, property change
// [DONE] add "paging" mode for tables? - FeatureLayer will act as a data source in this case.
// [DONE] update/finish snapshot mode
// [DONE] get rid of the dependency on layer's full extent (need to discuss this with keyur again)
// [DONE] cannot remove a "selected" feature even when it goes out of focus or extent changes
// [DONE] panning the map by dragging on a feature "selects" it. fix it. -- jayant fixed it for 1.5 - yay! 

/***************************
 * esri.layers.FeatureLayer
 ***************************/

dojo.declare("esri.layers.FeatureLayer", esri.layers.GraphicsLayer, {
  
  /************
   * Overrides 
   ************/
  
  // TODO
  // At Dojo 1.4, we have more control over how the constructor
  // chaining happens between subclass and super classes.
  // When we move to 1.4, we need to take advantage of that
  // and remove the ugly hack from <_GraphicsLayer> constructor
  // REF: http://docs.dojocampus.org/dojo/declare#manual-constructor-chaining

  constructor: function(/*String*/ url, /*Object?*/ options) {
    // "url" is processed by <Layer> and "options" is processed by <_GraphicsLayer>
    //console.log("featurelayer: ", url, options);
    
    // custom options
    this._outFields = options && options.outFields;
    //this._infoTemplate = options && options.infoTemplate; // || "${*}";
    this._loadCallback = options && options.loadCallback;
    
    var patch = options && options._usePatch;
    this._usePatch = (patch === null || patch === undefined) ? true : patch;
    //console.log("patch status: ", this._usePatch);
    
    this._trackIdField = options && options.trackIdField;
    this.objectIdField = options && options.objectIdField;
    this._maxOffset = options && options.maxAllowableOffset;
    this._optEditable = options && options.editable;
    this._optAutoGen = options && options.autoGeneralize;
    this.editSummaryCallback = options && options.editSummaryCallback;
    this.userId = options && options.userId;
    this.userIsAdmin = options && options.userIsAdmin;

    this.useMapTime = (options && options.hasOwnProperty("useMapTime")) ? 
                      (!!options.useMapTime) : 
                      true;
    this.source = options && options.source;
    this.gdbVersion = options && options.gdbVersion;
    
    // other defaults
    this._selectedFeatures = {};
    this._selectedFeaturesArr = [];
    this._newFeatures = [];
    this._deletedFeatures = {};

    // this value will be unique for each feature layer
    // in an application
    this._ulid = this._getUniqueId();
    
    // construct appropriate "mode"
    var ctor = this.constructor, mode = this.mode = (esri._isDefined(options && options.mode) ? options.mode : ctor.MODE_ONDEMAND);
    switch(mode) {
      case ctor.MODE_SNAPSHOT:
        this._mode = new esri.layers._SnapshotMode(this);
        this._isSnapshot = true;
        break;
      case ctor.MODE_ONDEMAND:
        this._tileWidth = (options && options.tileWidth) || 512;
        this._tileHeight = (options && options.tileHeight) || 512;
        this._mode = new esri.layers._OnDemandMode(this);
    
        var lattice = options && options.latticeTiling;
        this.latticeTiling = /*!esri._isDefined(lattice) ||*/ lattice;
        break;
      case ctor.MODE_SELECTION:
        this._mode = new esri.layers._SelectionMode(this);
        this._isSelOnly = true;
        break;
    }

    this._initLayer = dojo.hitch(this, this._initLayer);
    //this._preprocess = dojo.hitch(this, this._preprocess);
    this._selectHandler = dojo.hitch(this, this._selectHandler);
    this._editable = false;
    
    // Deal with feature collection
    if (dojo.isObject(url) && url.layerDefinition) {
      var json = url;
      this._collection = true;
      this.mode = ctor.MODE_SNAPSHOT;
      this._initLayer(json);
      return this;
    }

    this._task = new esri.tasks.QueryTask(this.url, {
      source: this.source, 
      gdbVersion: this.gdbVersion
    });
    
    // is the layer editable?
    var urlPath = this._url.path;
    this._fserver = false;
    if (urlPath.search(/\/FeatureServer\//i) !== -1) {
      // TODO
      // template picker uses this variable as well
      this._fserver = true;
      //console.log(" -- is editable --");
    }

    var resourceInfo = options && options.resourceInfo;
    if (resourceInfo) {
      this._initLayer(resourceInfo);
    }
    else {
      // fetch layer information
      if (this.source) {
        var layer = {source: this.source.toJson()};
        this._url.query = dojo.mixin(this._url.query, {layer: dojo.toJson(layer)});
      }
      if (this.gdbVersion) {
        this._url.query = dojo.mixin(this._url.query, {gdbVersion: this.gdbVersion});
      }
      esri.request({
        url: urlPath,
        content: dojo.mixin({ f:"json" }, this._url.query),
        callbackParamName: "callback",
        load: this._initLayer, // this._preprocess,
        error: this._errorHandler
      });
    }
  },
  
  // (override)
  _initLayer: function(response, io) {
    // do not enter if this method is invoked by GraphicsLayer constructor
    if (response || io) {
      this._json = response; // TODO
      
      this._findCredential();
      
      // See esri.request for context regarding "_ssl"
      var ssl = (this.credential && this.credential.ssl) || (response && response._ssl);
      if (ssl) {
        this._useSSL();
        this._task._useSSL();
      }
      
      // check if this an ArcGIS Online Feature Collection Item
      if (this._collection) {
        // force snapshot mode
        this._mode = new esri.layers._SnapshotMode(this);
        this._isSnapshot = true;
        this._featureSet = response.featureSet;
        this._nextId = response.nextObjectId; // webmap spec
        response = response.layerDefinition;
      }
      
      if (response.hasOwnProperty("capabilities")) {
        var capabilities = (this.capabilities = response.capabilities);
        if (capabilities && capabilities.toLowerCase().indexOf("editing") !== -1) {
          this._editable = true;
        }
        else {
          this._editable = false;
        }
      }
      else if (!this._collection) {
        this._editable = this._fserver;
      }
      
      if (esri._isDefined(this._optEditable)) {
        this._editable = this._optEditable;
        delete this._optEditable;
      }
      
      //if (!this._collection) {
        // let's serialize and store
        this._json = dojo.toJson(this._json);
      //}
      
      // offset not applicable when the layer is editable
      if (this.isEditable()) {
        delete this._maxOffset;
      }
      // autoGeneralize applicable to non-editable, on-demand layers only
      else if (
        this.mode !== this.constructor.MODE_SNAPSHOT &&
        ((response.geometryType === "esriGeometryPolyline") || (response.geometryType === "esriGeometryPolygon"))
      ) {
        this._autoGeneralize = esri._isDefined(this._optAutoGen) ? 
                                this._optAutoGen :
                                (this.mode === this.constructor.MODE_ONDEMAND); 
        delete this._optAutoGen;
      }
      
      // process layer information
      this.minScale = response.effectiveMinScale || response.minScale || 0;
      this.maxScale = response.effectiveMaxScale || response.maxScale || 0;

      this.layerId = response.id;
      this.name = response.name;
      this.description = response.description;
      this.copyright = response.copyrightText;
      this.type = response.type;
      this.geometryType = response.geometryType;
      this.displayField = response.displayField;
      this.defaultDefinitionExpression = response.definitionExpression;
      this.fullExtent = new esri.geometry.Extent(response.extent);
      this.defaultVisibility = response.defaultVisibility;
      
      // disable lattice tiling for point and multipoint layers
      if (
        (this.geometryType === "esriGeometryPoint") || 
        (this.geometryType === "esriGeometryMultipoint")
      ) {
        this.latticeTiling = false;
      }
      
      // properties added since server 10.1
      this.indexedFields = response.indexedFields;
      this.maxRecordCount = response.maxRecordCount;
      this.canModifyLayer = response.canModifyLayer;
      this.supportsStatistics = response.supportsStatistics;
      this.supportsAdvancedQueries = response.supportsAdvancedQueries;
      this.hasLabels = response.hasLabels;
      this.canScaleSymbols = response.canScaleSymbols;
      this.supportsRollbackOnFailure = response.supportsRollbackOnFailure;
      this.syncCanReturnChanges = response.syncCanReturnChanges;
      this.isDataVersioned = response.isDataVersioned;
      this.editFieldsInfo = response.editFieldsInfo;
      this.ownershipBasedAccessControlForFeatures = response.ownershipBasedAccessControlForFeatures;
      if (this.editFieldsInfo && this.ownershipBasedAccessControlForFeatures) {
        this.creatorField = this.editFieldsInfo.creatorField;
      }
      this.relationships = response.relationships;
      this.allowGeometryUpdates = esri._isDefined(response.allowGeometryUpdates) ? response.allowGeometryUpdates : true;
      
      this._isTable = (this.type === "Table");
      
      // TODO
      // This is related to adding a FL as the base map layer. There
      // are some difficulties in _addLayerHandler in map code.
      //this.spatialReference = this.fullExtent.spatialReference;
      
      // fields
      var fieldObjs = (this.fields = []),
          fields = response.fields, i;
      
      for (i = 0; i < fields.length; i++) {
        fieldObjs.push(new esri.layers.Field(fields[i]));
      }
      
      // determine object id field for this layer
      if (!this.objectIdField) {
        /*if (this._collection) {
          this.objectIdField = "__object__id__";
        }
        else {*/
          this.objectIdField = response.objectIdField;
          if (!this.objectIdField) {
            // identify the field that provides unique id for the features in the layer
            fields = response.fields;
            for (i = 0; i < fields.length; i++) {
              var field = fields[i];
              if (field.type === "esriFieldTypeOID") {
                this.objectIdField = field.name;
                break;
              }
            }
          }
        //}
        
        if (!this.objectIdField) {
          console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url }, esri.bundle.layers.FeatureLayer.noOIDField));
        }
      }

      if (!esri._isDefined(this._nextId)) {
        // Let's determine the oid that we need to use if a feature
        // is added
        var oidField = this.objectIdField, maxId = -1;
        if (this._collection && oidField) {
          var fset = this._featureSet, 
              features = fset && fset.features, 
              il = features ? features.length : 0, oid, attr;
          
          // find the max of existing oids
          for (i = 0; i < il; i++) {
            attr = features[i].attributes;
            oid = attr && attr[oidField];
    
            if (oid > maxId) {
              maxId = oid;
            }
          }
        }
        
        this._nextId = /*(maxId === -1) ? this._getUniqueId() :*/ (maxId + 1);
      }
      
      this.globalIdField = response.globalIdField;
      
      var fieldName = (this.typeIdField = response.typeIdField), fieldInfo;

      // Fix typeIdField if necessary - it's known to have different case
      // compared to this.fields
      if (fieldName) {
        fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
        
        if (fieldInfo) {
          this.typeIdField = fieldInfo.name;
        }
      }
      
      // webmap spec
      this.visibilityField = response.visibilityField;
      
      // default symbol
      var symbol = response.defaultSymbol;

      if (symbol) {
        this.defaultSymbol = esri.symbol.fromJson(symbol);
      }
      
      // sub-types
      var typeObjs = this.types = [],
          types = response.types,
          fType, fTemplates, protoAttributes,
          fieldsInfo = this.editFieldsInfo, 
          creatorField = fieldsInfo && fieldsInfo.creatorField,
          editorField = fieldsInfo && fieldsInfo.editorField,
          fix = (creatorField || editorField), fixList = [];
          
      if (types) {
        for (i = 0; i < types.length; i++) {
          fType = new esri.layers.FeatureType(types[i]);
          
          fTemplates = fType.templates;
          if (fix && fTemplates && fTemplates.length) {
            fixList = fixList.concat(fTemplates);
          }
          
          typeObjs.push(fType);
        }
      }
      
      // templates for the layer
      var templates = response.templates, template,
          templateObjs = this.templates = [];
          
      if (templates) {
        for (i = 0; i < templates.length; i++) {
          template = new esri.layers.FeatureTemplate(templates[i]);
          
          if (fix) {
            fixList.push(template);
          }
          
          templateObjs.push(template);
        }
      }
      
      // Fix 10.1 server bug where prototypes contain null values for 
      // creator and editor fields. null values have special meaning as
      // userIds and hence should not be returned with prototypes
      // Server CR 222052 (Prototype feature should not return the read-only fields) 
      // for this issue is scheduled to be fixed in 10.1 SP1
      for (i = 0; i < fixList.length; i++) {
        protoAttributes = dojo.getObject("prototype.attributes", false, fixList[i]);

        if (protoAttributes) {
          if (creatorField) {
            delete protoAttributes[creatorField];
          }
          if (editorField) {
            delete protoAttributes[editorField];
          }
        }
      }
      
      // the layer is time aware if it has time info
      var timeInfo = response.timeInfo;
      if (timeInfo) {
        this.timeInfo = new esri.layers.TimeInfo(timeInfo);
        this._startTimeField = timeInfo.startTimeField;
        this._endTimeField = timeInfo.endTimeField;
        if (this._startTimeField && this._endTimeField) {
          this._twoTimeFields = true;
        }
        
        if (this._trackIdField) {
          timeInfo.trackIdField = this._trackIdField;
        }
        else {
          this._trackIdField = timeInfo.trackIdField;
        }
      }
      
      this.hasAttachments = (!this._collection && response.hasAttachments) ? true : false;
      this.htmlPopupType = response.htmlPopupType;

      var drawingInfo = response.drawingInfo, renderer;      
      if (!this.renderer) {
        
        if (drawingInfo && drawingInfo.renderer) {
          renderer = drawingInfo.renderer;
          this.setRenderer(esri.renderer.fromJson(renderer));
          if (renderer.type === "classBreaks") {
            this.renderer._setMaxInclusiveness(true);
          }
          
          // translate relative image resources defined in pms/pfs to absolute paths
          // see - http://nil/rest-docs/msimage.html
          if (!this._collection) {
            
            var rendererType = renderer.type, symbols = [];
            renderer = this.renderer;
            
            switch(rendererType) {
              case "simple":
                symbols.push(renderer.symbol);
                break;
              case "uniqueValue":
              case "classBreaks":
                symbols.push(renderer.defaultSymbol);
                symbols = symbols.concat(dojo.map(renderer.infos, function(info) {
                  return info.symbol;
                }));
                break;
            } // switch
            
            symbols = dojo.filter(symbols, esri._isDefined);
            
            var baseUrl = this._url.path + "/images/", token = this._getToken();
            dojo.forEach(symbols, function(sym) {
              var url = sym.url;
              if (url) {
                // translate relative image resources defined in pms/pfs to absolute paths
                if ( (url.search(/https?\:/) === -1) && (url.indexOf("data:") === -1) ) {
                  sym.url = baseUrl + url;
                }
                //console.log(sym.url);
                
                // append token
                if (token && sym.url.search(/https?\:/) !== -1) {
                  sym.url += ("?token=" + token);
                }
              }
            });
            
          } // not a collection
        }
        else if (symbol) { // default symbol defined in the layer resource
          types = this.types;
          if (types.length > 0) {
            renderer = new esri.renderer.UniqueValueRenderer(this.defaultSymbol, this.typeIdField);
            
            dojo.forEach(types, function(type) {
              renderer.addValue(type.id, type.symbol);
            });
          }
          else {
            renderer = new esri.renderer.SimpleRenderer(this.defaultSymbol);
          }
          
          this.setRenderer(renderer);
        }
        else if (!this._isTable) { // fallback
          var fallbackSymbol;
          switch(this.geometryType) {
            case "esriGeometryPoint":
            case "esriGeometryMultipoint":
              fallbackSymbol = new esri.symbol.SimpleMarkerSymbol();
              break;
            case "esriGeometryPolyline":
              fallbackSymbol = new esri.symbol.SimpleLineSymbol();
              break;
            case "esriGeometryPolygon":
              fallbackSymbol = new esri.symbol.SimpleFillSymbol();
              break;
          }
          
          this.setRenderer(fallbackSymbol ? new esri.renderer.SimpleRenderer(fallbackSymbol) : null);
        }
      } // renderer
      
      // layer transparency
      var transparency = (drawingInfo && drawingInfo.transparency) || 0 ;
      if (!esri._isDefined(this.opacity) && transparency > 0) {
        this.opacity = 1 - (transparency / 100);
      }
    
//      // initialize the "mode" with layer info
//      var mode = this._mode;
//      if (mode) {
//        mode.layerInfoHandler(response);
//      }

      // REST added currentVersion property to some resources
      // at 10 SP1
      this.version = response.currentVersion;
      
      if (!this.version) {
        var ver;
        
        if (
          "capabilities" in response || "drawingInfo" in response || 
          "hasAttachments" in response || "htmlPopupType" in response || 
          "relationships" in response || "timeInfo" in response || 
          "typeIdField" in response || "types" in response 
        ) {
          ver = 10;
        }
        else {
          ver = 9.3; // or could be 9.3.1
        }
        
        this.version = ver;
      } // version
      
      if ((dojo.isIE || dojo.isSafari) && this.isEditable() && this.version < 10.02) {
        this._ts = true;
      }
      
      // announce "loaded", imples ready to be added to the map
      this.loaded = true;
      
      this._fixRendererFields();
      this._checkFields();
      this._updateCaps();

      if (this._collection) {
        this._fireUpdateStart();
        
        var featureSet = this._featureSet;
        delete this._featureSet;
        
        this._mode._drawFeatures(new esri.tasks.FeatureSet(featureSet));
        this._fcAdded = true;
      }

      this.onLoad(this);
      var callback = this._loadCallback;
      if (callback) {
        delete this._loadCallback;
        callback(this);
      }
    }
  },
    
  // (extend)
  setRenderer: function(ren) {
    this.inherited("setRenderer", arguments);
    
    var renderer = this.renderer;
    if (renderer) {
      this._ager = (renderer.declaredClass.indexOf("TemporalRenderer") !== -1 && renderer.observationAger && renderer.observationRenderer);
      
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      }, this);
      this._rendererFields = dojo.filter(fields, esri._isDefined);
    } 
    else {
      this._ager = false;
      this._rendererFields = [];
    }
    
    if (this.loaded && this._rendererFields.length > 0) {
      this._fixRendererFields();
      this._checkFields(this._rendererFields);
    }

    if (this.loaded && this._collection) {
      // we want to write out the renderer in toJson()
      this._typesDirty = true;
    }
  },

  // (extend)
  _setMap: function(map, surface) {
    this._map = map;

    // if the layer is time-aware, listen for changes in time extent
    this._toggleTime(true);
    
    // invoke superclass version of this method
    var div = this.inherited("_setMap", arguments);
    
    this.clearSelection(); // flush out features brought down before being added to the map
    
    // do we have a temporal renderer?
    var renderer = this.renderer;
    /*if (renderer) {
      this._ager = (renderer.declaredClass.indexOf("TemporalRenderer") !== -1 && renderer.observationAger);
      
      //this._rendererAttrField = renderer.observationRenderer ? renderer.observationRenderer.attributeField : renderer.attributeField;
      
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      });
      this._rendererFields = dojo.filter(fields, esri._isDefined);
    } 
    
    this._checkFields();*/
    
    if (this.timeInfo) {
      // tracking management
      if (this._trackIdField || ( renderer && (renderer.latestObservationRenderer || renderer.trackRenderer) )) {
        this._trackManager = new esri.layers._TrackManager(this);
        this._trackManager.initialize(map);
      }
    }
    
    /*// listen for map zoom to act on scale dependency
    //this.minScale = 0; this.maxScale = 44000;
    if (this.minScale !== 0 || this.maxScale !== 0) {
      this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._updateStatus);
      //this._zoomHandler();
    }*/
   
    // listen for map zoom end to act on scale dependency and auto-generalization
    this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._zoomHandler);
    this._zoomHandler();
   
    //this.setScaleRange(this.minScale, this.maxScale);
    
    // initialize the "mode" with map
    var mode = this._mode;
    if (mode) {
      mode.initialize(map);
    }
    
    return div;
  },
  
  // (extend)
  _unsetMap: function(map, surface) {
    var mode = this._mode;
    if (mode) {
      mode.destroy();
      this._mode = null;
    }
    if (this._trackManager) {
      this._trackManager.destroy();
      this._trackManager = null;
    }
    dojo.disconnect(this._zoomConnect);
    this._zoomConnect = null;
    this._toggleTime(false);
    this.inherited("_unsetMap", arguments);
  },
  
//  // (override)
//  add: function(graphic) {
//    graphic.attributes = graphic.attributes || {};
//    var attributes = graphic.attributes, oidField = this.objectIdField;
//    if (/*!attributes ||*/ !attributes[oidField]) { // brand new feature
//      this._registerNew(graphic);
//      return this._add(graphic);
//    }
//    else { // feature that was previously removed (known to feature layer)
//      this._unRegisterDelete(graphic);
//      this._mode.drawFeature(graphic);
//      return graphic;
//    }
//  },
//  
//  // (override)
//  remove: function(graphic) {
//    var attributes = graphic.attributes, oidField = this.objectIdField;
//    if (/*!attributes ||*/ !attributes[oidField]) { // brand new feature previously added
//      this._unRegisterNew(graphic);
//      
//      // unselect
//      this._unSelectNewFeature(graphic);
//      
//      return this._remove(graphic);
//    }
//    else { // existing feature (known to feature layer)
//      this._registerDelete(graphic);
//      
//      var oid = attributes[oidField], mode = this._mode;
//      
//      // unselect
//      this._unSelectFeatureIIf(oid, mode);
//      
//      // remove
//      graphic._count = 0;
//      return mode._removeFeatureIIf(oid);
//    }
//  },

  // (incompatible override)
  refresh: function() {
    // Lose all the features and fetch them again 
    // from the server
    var mode = this._mode;
    if (mode) {
      mode.refresh();
    }
  },
  
  /*****************
   * Public Methods
   *****************/
  
  setEditable: function(/*Boolean*/ editable) {
    // Currently supported for by-value layers only
    if (!this._collection) {
      console.log("FeatureLayer:setEditable - this functionality is not yet supported for layer in a feature service");
      return this;
    }
    
    if (!this.loaded) {
      // Just record user's choice and leave. We'll process them
      // when the layer has loaded
      this._optEditable = editable;
      return this;
    }
    
    var previousState = this._editable;
    this._editable = editable;
    this._updateCaps();
    
    if (previousState !== editable) {
      this.onCapabilitiesChange();
    }
    return this;
  },
  
  getEditCapabilities: function(options) {
    /*
      // Tests:
      (function() {
      
      var scope = {
            loaded: false, _editable: null,
            capabilities: null,
            editFieldsInfo: null,
            ownershipBasedAccessControlForFeatures: null,
            getUserId: esri.layers.FeatureLayer.prototype.getUserId,
            isEditable: esri.layers.FeatureLayer.prototype.isEditable
          }, 
          fieldsInfo = { creatorField: "creator" },
          othersTT = { allowUpdateToOthers: true, allowDeleteToOthers: true },
          othersFF = { allowUpdateToOthers: false, allowDeleteToOthers: false },
          othersTF = { allowUpdateToOthers: true, allowDeleteToOthers: false },
          othersFT = { allowUpdateToOthers: false, allowDeleteToOthers: true };
      
      var FFF = '{"canCreate":false,"canUpdate":false,"canDelete":false}',
          TTT = '{"canCreate":true,"canUpdate":true,"canDelete":true}',
          TFF = '{"canCreate":true,"canUpdate":false,"canDelete":false}',
          FTF = '{"canCreate":false,"canUpdate":true,"canDelete":false}',
          FFT = '{"canCreate":false,"canUpdate":false,"canDelete":true}',
          TTF = '{"canCreate":true,"canUpdate":true,"canDelete":false}',
          FTT = '{"canCreate":false,"canUpdate":true,"canDelete":true}',
          TFT = '{"canCreate":true,"canUpdate":false,"canDelete":true}',
          T = true,
          F = false;
      
      var fUserA = { attributes: { creator: "UserA" } },
          fUserB = { attributes: { creator: "UserB" } },
          fUserAnonymous = { attributes: { creator: "" } },
          fUserNull = { attributes: { creator: null } },
          fNoAttr = {},
          fNoField = { attributes: {} },
          opts = {}, result;
      
      ////////// Layer level capabilities //////////
      console.log("Layer level capabilities");
      
      scope.loaded = F; scope._editable = F;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("1. " + (result === FFF));

      scope.loaded = T; scope._editable = F;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2. " + (result === FFF));

      scope.loaded = T; scope._editable = F;
      scope.userIsAdmin = true;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2.1. " + (result === TTT));
      scope.userIsAdmin = undefined;

      scope.loaded = T; scope._editable = T;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("3. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("4. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("5. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("6. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("7. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("8. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("9. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("10. " + (result === TTT));
      
      console.log("Layer level capabilities, loggedInUser: IS-ADMIN");
      scope.userIsAdmin = true;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("3. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("4. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("5. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("6. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("7. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("8. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("10. " + (result === TTT));
      
      scope.userIsAdmin = undefined;
      
      console.log("Layer level capabilities, feature Y");
      opts.feature = fUserA;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TTT));
      
      scope.userIsAdmin = true;
      console.log("Layer level capabilities, loggedInUser: IS-ADMIN, feature Y");
      opts.feature = fUserA;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TTT));
      
      scope.userIsAdmin = undefined;
    
      ////////// LoggedInUser = Creator //////////
      
      opts.userId = "UserA";
      opts.feature = fUserA;
    
      console.log("LoggedInUser = Creator, No Access Control");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = null;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("LoggedInUser = Creator, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));
    
      opts.userId = "UserA";
      opts.feature = fUserAnonymous;
      console.log("LoggedInUser = Creator, Feature owned by ANONYMOUS, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));
    
      ////////// LoggedInUser !== Creator //////////
      
      opts.userId = "UserA";
      opts.feature = fUserB;
    
      console.log("LoggedInUser !== Creator, No Access Control");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = null;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFF));
    
      scope.userIsAdmin = true;
      console.log("LoggedInUser !== Creator, LoggedInUser: IS-ADMIN, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));

      scope.userIsAdmin = undefined;
    
      console.log("LoggedInUser !== Creator, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersTF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("25. " + (result === TTF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("26. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("27. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("28. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("29. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("30. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("31. " + (result === FTF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("32. " + (result === TTF));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersFT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("33. " + (result === TFT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("34. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("35. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("36. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("37. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("38. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("39. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("40. " + (result === TFT));
      
      ////////// NO LoggedInUser //////////

      opts.userId = "";
      opts.feature = fUserB;
    
      console.log("NO LoggedInUser, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("NO LoggedInUser, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFF));

      opts.userId = "";
      opts.feature = fUserNull;
      console.log("NO LoggedInUser, Feature owned by NULL, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));

      opts.userId = "";
      opts.feature = fUserNull;
      console.log("NO LoggedInUser, Feature owned by NULL, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("25. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("26. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("27. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("28. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("29. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("30. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("31. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("32. " + (result === TFF));
    
      }());
    
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("X. " + (result === TTT));
    */
    
    var denyAll = { "canCreate": false, "canUpdate": false, "canDelete": false };
    
    if (!this.loaded || !this.isEditable()) {
      return denyAll;
    }
    
    var feature = options && options.feature, userId = options && options.userId,
        caps = dojo.map((this.capabilities ? this.capabilities.toLowerCase().split(",") : []), dojo.trim),
        layerEditing = dojo.indexOf(caps, "editing") > -1,
        layerCreate = layerEditing && (dojo.indexOf(caps, "create") > -1),
        layerUpdate = layerEditing && (dojo.indexOf(caps, "update") > -1),
        layerDelete = layerEditing && (dojo.indexOf(caps, "delete") > -1),
        accessCtrl = this.ownershipBasedAccessControlForFeatures,
        fieldsInfo = this.editFieldsInfo,
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        realm = fieldsInfo && fieldsInfo.realm,
        attributes = feature && feature.attributes,
        creator = (attributes && creatorField) ? attributes[creatorField] : undefined,
        retVal, userIsAdmin = !!this.userIsAdmin,
        othersCanUpdate = !accessCtrl || userIsAdmin || !!(accessCtrl.allowOthersToUpdate || accessCtrl.allowUpdateToOthers), 
        othersCanDelete = !accessCtrl || userIsAdmin || !!(accessCtrl.allowOthersToDelete || accessCtrl.allowDeleteToOthers);
    
    if (
      userIsAdmin || // arcgis.com use-case
      (layerEditing && !(layerCreate || layerUpdate || layerDelete)) // Pre 10.1 layers
    ) {
      layerCreate = layerUpdate = layerDelete = true;
    }
    
    // Start with what layer allows
    retVal = {
      "canCreate": layerCreate, 
      "canUpdate": layerUpdate, 
      "canDelete": layerDelete 
    };
    
    // Refine retVal based on various available information
    if (creator === null) {
      // Feature created by no one:
      // Can be updated or deleted by "" or "<userId>" if accessCtrl allows
      // "Feature created by null is owned by no one"
      retVal.canUpdate = layerUpdate && othersCanUpdate;
      retVal.canDelete = layerDelete && othersCanDelete;
    }
    else if (creator === "") {
      // Feature created by an anonymous user:
      // Use layer's capabilities.
      // "Feature created by anonymous users is owned by everyone"
      return retVal;
    }
    else if (creator) {
      // userId can only be "" or "<userId>". You cannot login as null.
      userId = userId || this.getUserId();
      
      if (userId && realm) {
        userId = userId + "@" + realm;
        
        // Note that realm will not be appended to anonymous users 
        // (i.e. <empty-string> values) either
      }

      if (userId.toLowerCase() === creator.toLowerCase()) {
        // Logged in user is the owner
        return retVal;
      }
      else {
        // Logged in user is NOT the owner
        // Or, user is not logged in at all (anonymous) 
        retVal.canUpdate = layerUpdate && othersCanUpdate;
        retVal.canDelete = layerDelete && othersCanDelete;
      }
    }
    
    return retVal;
  },
  
  getUserId: function() {
    var userId;
    
    if (this.loaded) {
      userId = (this.credential && this.credential.userId) || this.userId || "";
    }

    return userId;
  },
  
  setUserIsAdmin: function(isAdmin) {
    // This information will be factored in within the getEditCapabilities
    // logic above - so that widgets and other consuming code can allow or
    // disallow certain editing tools.
    // It is assumed that the calling code "somehow" determined that the 
    // logged in user is someone who owns this layer i.e. an "admin" in 
    // arcgis.com context
    this.userIsAdmin = isAdmin;
  },
  
  setEditSummaryCallback: function(callback) {
    this.editSummaryCallback = callback;
  },
  
  getEditSummary: function(feature, options, /*For Testing Only*/ currentTime) {
    // Requirements driven by arcgis.com
    // Example:
    //   Edited by Mikem on 2/1/2012 at 3:28 PM
    //   Edited by MWaltuch on Tuesday at 1:20 PM
    //   Created by mapper on Wednesday at 1:20 PM
    // Action: 
    //   Edited
    //   Created
    // Name: 
    //   by <userId>
    // Date/Time:
    //   0 - less than   1 min:   "seconds ago"
    //   1 - less than   2 mins:  "a minute ago"
    //   2 - less than  60 mins:  "<n> minutes ago" (round down)
    //  60 - less than 120 mins:  "an hour ago"
    //   2 - less than  24 hours: "<n> hours ago" (round down)
    //   1 - less than   7 days:  "on <day of the week> at <time>"
    //   Equals or greater than 7 days: "on <date> at <time>"

    /*
      // Tests:
      (function() {
      
      var scope = {
            loaded: false,
            editFieldsInfo: null,
            getEditInfo: esri.layers.FeatureLayer.prototype.getEditInfo,
            _getEditData: esri.layers.FeatureLayer.prototype._getEditData
          }, 
          testFunc = esri.layers.FeatureLayer.prototype.getEditSummary,
          infoA = { creatorField: "creator", creationDateField: "creationDate", editorField: "editor", editDateField: "editDate" }, 
          infoB = { creatorField: "creator", editorField: "editor" }, 
          infoC = { creationDateField: "creationDate", editDateField: "editDate" }, 
          infoD = { creatorField: "creator", creationDateField: "creationDate" }, 
          infoE = { editorField: "editor", editDateField: "editDate" }, 
          infoF = { creatorField: "creator" }, 
          infoG = { editorField: "editor" }, 
          infoH = { creationDateField: "creationDate" }, 
          infoI = { editDateField: "editDate" };
      
      var noAttr = {},
          emptyAttr = { attributes: {} },
          attrA1 = { attributes: { creator: "UserA", creationDate: 0 } },
          attrA2 = { attributes: { creator: "UserA", creationDate: 0, editor: "UserB", editDate: 1 } },
          attrB1 = { attributes: { creator: "UserA" } },
          attrB2 = { attributes: { creator: "UserA", editor: "UserB" } },
          attrC1 = { attributes: { creationDate: 0 } },
          attrC2 = { attributes: { creationDate: 0, editDate: 1 } },
          attrD = { attributes: { creator: "UserA", creationDate: 0 } },
          attrE = { attributes: { editor: "UserB", editDate: 1 } },
          attrF = { attributes: { creator: "UserA" } },
          attrG = { attributes: { editor: "UserB" } },
          attrH = { attributes: { creationDate: 0 } },
          attrI = { attributes: { editDate: 1 } };
      
      var printFunc = function(testNum, check, result) {
        console[check ? "log" : "error"](testNum + check + " - " + result + (result ? (" - " + esri.bundle.layers.FeatureLayer[result]) : "") );
      };
      
      var wrapper = function(testNum, attr, currentTime, expectedResult1, expectedResult2, expectedResult3) {
        var result;
        
        result = testFunc.call(scope, attr, null, currentTime);
        printFunc(testNum + "a. ", (result === expectedResult1), result);
        
        result = testFunc.call(scope, attr, { action: "creation" }, currentTime);
        printFunc(testNum + "b. ", (result === expectedResult2), result);

        result = testFunc.call(scope, attr, { action: "edit" }, currentTime);
        printFunc(testNum + "c. ", (result === expectedResult3), result);

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {} 
        }, currentTime);
        printFunc(testNum + "d. ", (result === ""), result);

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {
            return "<testing callback>";
          } 
        }, currentTime);
        printFunc(testNum + "e. ", (result === "<testing callback>"), result);

        scope.editSummaryCallback = function(feature, info) {
          return "<testing callback>";
        };
        result = testFunc.call(scope, attr, currentTime);
        printFunc(testNum + "f. ", (result === "<testing callback>"), result);
        scope.editSummaryCallback = null;

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {
            if (info && (info.displayPattern === "Full")) {
              info.displayPattern = "WeekDay";
            }
            return info;
          } 
        }, currentTime);
        var exp = ( 
                    expectedResult1.indexOf("Full") > -1 ? 
                    expectedResult1.replace("Full", "WeekDay") : 
                    expectedResult1 
                   );
        printFunc(testNum + "g. ", (result === exp), result);
      };
      
      scope.loaded = false;
      console.log("0. " + (testFunc.call(scope, emptyAttr) === ""));
          
      scope.loaded = true;
      console.log("0. " + (testFunc.call(scope, emptyAttr) === ""));
      
      scope.editFieldsInfo = infoA;
      
      attrA1.attributes.creationDate = -40000;
      wrapper(1, attrA1, 0, "createUserSeconds", "createUserSeconds", "");
      attrA1.attributes.creationDate = -80000;
      wrapper(2, attrA1, 0, "createUserMinute", "createUserMinute", "");
      attrA1.attributes.creationDate = -3000000;
      wrapper(3, attrA1, 0, "createUserMinutes", "createUserMinutes", "");
      attrA1.attributes.creationDate = -2 * 3000000;
      wrapper(4, attrA1, 0, "createUserHour", "createUserHour", "");
      attrA1.attributes.creationDate = -24 * 3000000;
      wrapper(5, attrA1, 0, "createUserHours", "createUserHours", "");
      attrA1.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(6, attrA1, 0, "createUserWeekDay", "createUserWeekDay", "");
      attrA1.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(7, attrA1, 0, "createUserFull", "createUserFull", "");
      
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -40000;
      wrapper(8, attrA2, 0, "editUserSeconds", "createUserSeconds", "editUserSeconds");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -80000;
      wrapper(9, attrA2, 0, "editUserMinute", "createUserMinute", "editUserMinute");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -3000000;
      wrapper(10, attrA2, 0, "editUserMinutes", "createUserMinutes", "editUserMinutes");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -2 * 3000000;
      wrapper(11, attrA2, 0, "editUserHour", "createUserHour", "editUserHour");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -24 * 3000000;
      wrapper(12, attrA2, 0, "editUserHours", "createUserHours", "editUserHours");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(13, attrA2, 0, "editUserWeekDay", "createUserWeekDay", "editUserWeekDay");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(14, attrA2, 0, "editUserFull", "createUserFull", "editUserFull");
      
      scope.editFieldsInfo = infoB;
      wrapper(15, attrB1, 0, "createUser", "createUser", "");
      wrapper(16, attrB2, 0, "editUser", "createUser", "editUser");
      
      scope.editFieldsInfo = infoC;
      
      attrC1.attributes.creationDate = -40000;
      wrapper(17, attrC1, 0, "createSeconds", "createSeconds", "");
      attrC1.attributes.creationDate = -80000;
      wrapper(18, attrC1, 0, "createMinute", "createMinute", "");
      attrC1.attributes.creationDate = -3000000;
      wrapper(19, attrC1, 0, "createMinutes", "createMinutes", "");
      attrC1.attributes.creationDate = -2 * 3000000;
      wrapper(20, attrC1, 0, "createHour", "createHour", "");
      attrC1.attributes.creationDate = -24 * 3000000;
      wrapper(21, attrC1, 0, "createHours", "createHours", "");
      attrC1.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(22, attrC1, 0, "createWeekDay", "createWeekDay", "");
      attrC1.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(23, attrC1, 0, "createFull", "createFull", "");
      
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -40000;
      wrapper(24, attrC2, 0, "editSeconds", "createSeconds", "editSeconds");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -80000;
      wrapper(25, attrC2, 0, "editMinute", "createMinute", "editMinute");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -3000000;
      wrapper(26, attrC2, 0, "editMinutes", "createMinutes", "editMinutes");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -2 * 3000000;
      wrapper(27, attrC2, 0, "editHour", "createHour", "editHour");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -24 * 3000000;
      wrapper(28, attrC2, 0, "editHours", "createHours", "editHours");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(29, attrC2, 0, "editWeekDay", "createWeekDay", "editWeekDay");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(30, attrC2, 0, "editFull", "createFull", "editFull");
      
      scope.editFieldsInfo = infoD;
      
      attrD.attributes.creationDate = -40000;
      wrapper(31, attrD, 0, "createUserSeconds", "createUserSeconds", "");
      attrD.attributes.creationDate = -80000;
      wrapper(32, attrD, 0, "createUserMinute", "createUserMinute", "");
      attrD.attributes.creationDate = -3000000;
      wrapper(33, attrD, 0, "createUserMinutes", "createUserMinutes", "");
      attrD.attributes.creationDate = -2 * 3000000;
      wrapper(34, attrD, 0, "createUserHour", "createUserHour", "");
      attrD.attributes.creationDate = -24 * 3000000;
      wrapper(35, attrD, 0, "createUserHours", "createUserHours", "");
      attrD.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(36, attrD, 0, "createUserWeekDay", "createUserWeekDay", "");
      attrD.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(37, attrD, 0, "createUserFull", "createUserFull", "");
      
      scope.editFieldsInfo = infoE;
      
      attrE.attributes.editDate = -40000;
      wrapper(38, attrE, 0, "editUserSeconds", "", "editUserSeconds");
      attrE.attributes.editDate = -80000;
      wrapper(39, attrE, 0, "editUserMinute", "", "editUserMinute");
      attrE.attributes.editDate = -3000000;
      wrapper(40, attrE, 0, "editUserMinutes", "", "editUserMinutes");
      attrE.attributes.editDate = -2 * 3000000;
      wrapper(41, attrE, 0, "editUserHour", "", "editUserHour");
      attrE.attributes.editDate = -24 * 3000000;
      wrapper(42, attrE, 0, "editUserHours", "", "editUserHours");
      attrE.attributes.editDate = -7 * 24 * 3000000;
      wrapper(43, attrE, 0, "editUserWeekDay", "", "editUserWeekDay");
      attrE.attributes.editDate = -14 * 24 * 3000000;
      wrapper(44, attrE, 0, "editUserFull", "", "editUserFull");
      
      scope.editFieldsInfo = infoF;
      wrapper(45, attrF, 0, "createUser", "createUser", "");
      
      scope.editFieldsInfo = infoG;
      wrapper(46, attrG, 0, "editUser", "", "editUser");
                
      scope.editFieldsInfo = infoH;
      
      attrH.attributes.creationDate = -40000;
      wrapper(47, attrH, 0, "createSeconds", "createSeconds", "");
      attrH.attributes.creationDate = -80000;
      wrapper(48, attrH, 0, "createMinute", "createMinute", "");
      attrH.attributes.creationDate = -3000000;
      wrapper(49, attrH, 0, "createMinutes", "createMinutes", "");
      attrH.attributes.creationDate = -2 * 3000000;
      wrapper(50, attrH, 0, "createHour", "createHour", "");
      attrH.attributes.creationDate = -24 * 3000000;
      wrapper(51, attrH, 0, "createHours", "createHours", "");
      attrH.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(52, attrH, 0, "createWeekDay", "createWeekDay", "");
      attrH.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(53, attrH, 0, "createFull", "createFull", "");
      
      scope.editFieldsInfo = infoI;
      
      attrI.attributes.editDate = -40000;
      wrapper(54, attrI, 0, "editSeconds", "", "editSeconds");
      attrI.attributes.editDate = -80000;
      wrapper(55, attrI, 0, "editMinute", "", "editMinute");
      attrI.attributes.editDate = -3000000;
      wrapper(56, attrI, 0, "editMinutes", "", "editMinutes");
      attrI.attributes.editDate = -2 * 3000000;
      wrapper(57, attrI, 0, "editHour", "", "editHour");
      attrI.attributes.editDate = -24 * 3000000;
      wrapper(58, attrI, 0, "editHours", "", "editHours");
      attrI.attributes.editDate = -7 * 24 * 3000000;
      wrapper(59, attrI, 0, "editWeekDay", "", "editWeekDay");
      attrI.attributes.editDate = -14 * 24 * 3000000;
      wrapper(60, attrI, 0, "editFull", "", "editFull");

      }());
    */
    
    currentTime = esri._isDefined(currentTime) ? currentTime : (new Date()).getTime();

    var summary = "", info = this.getEditInfo(feature, options, currentTime),
        callback = (options && options.callback) || this.editSummaryCallback;
    
    // Callback support for developer customization
    if (callback) {
      info = callback(feature, info) || "";
      
      // callback function may return one of the following:
      // - "info" object with modified properties
      // - final "summary" string (callback should take care of localization if needed)
      // - null/undefined/"" implying empty string
    }
    
    if (dojo.isString(info)) {
      summary = info;
    }
    else {
      if (info) {
        var action = info.action, userId = info.userId, timeValue = info.timeValue,
            count = 0;
        
        // How many display components do we have?
        if (action) { count++; }
        if (userId) { count++; } // null and <empty string> are not displayworthy
        if (esri._isDefined(timeValue)) { count++; }
        
        // We need atleast two components to display a meaningful summary
        if (count > 1) {
          summary = (action === "edit" ? "edit" : "create") + 
                    (userId ? "User" : "") + 
                    (esri._isDefined(timeValue) ? info.displayPattern : "");
        }
      }

      // NOTE
      // Comment out this section when testing using the unit test cases at the
      // beginning of this method
      //console.log(info, summary);
      summary = summary && esri.substitute(info, esri.bundle.layers.FeatureLayer[summary]);
    }
    
    return summary;
  },
  
  getEditInfo: function(feature, options, /*For Testing Only*/ currentTime) {
    if (!this.loaded) {
      return;
    }
    
    currentTime = esri._isDefined(currentTime) ? currentTime : (new Date()).getTime();
    
    var reqAction = (options && options.action) || "last",
        fieldsInfo = this.editFieldsInfo,
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        creationDateField = fieldsInfo && fieldsInfo.creationDateField,
        editorField = fieldsInfo && fieldsInfo.editorField,
        editDateField = fieldsInfo && fieldsInfo.editDateField,
        realm = fieldsInfo && fieldsInfo.realm,
        attributes = feature && feature.attributes,
        creator = (attributes && creatorField) ? attributes[creatorField] : undefined,
        creationDate = (attributes && creationDateField) ? attributes[creationDateField] : null,
        editor = (attributes && editorField) ? attributes[editorField] : undefined,
        editDate = (attributes && editDateField) ? attributes[editDateField] : null,
        creationData = this._getEditData(creator, creationDate, currentTime),
        editData = this._getEditData(editor, editDate, currentTime),
        retVal;
    
    switch(reqAction) {
      case "creation":
        retVal = creationData;
        break;
      case "edit":
        retVal = editData;
        break;
      case "last":
        retVal = editData || creationData;
        break;
    }
    
    if (retVal) {
      retVal.action = (retVal === editData) ? "edit" : "creation";
      //retVal.userId = retVal.userId || ""; // we don't want to show null and "" as userIds
    }
    
    return retVal;
  },
  
  _getEditData: function(userId, timeValue, currentTime) {
    var data, timeDiff, displayPattern,
        oneMin = 60000,
        mins60 = 3600000, // 60 * 60 * 1000,
        mins120 = 2 * mins60,
        hours24 = 24 * mins60,
        days7 = 7 * hours24;
    
    if (esri._isDefined(timeValue)) {
      timeDiff = currentTime - timeValue;
      //console.log(currentTime, timeValue, timeDiff );
      
      if (timeDiff < 0) {
        // This condition is really a fallback for assertion failure.
        // Assertion: a feature cannot have timestamp later than current time
        displayPattern = "Full";
      }
      else if (timeDiff < oneMin) {
        displayPattern = "Seconds";
      }
      else if (timeDiff < (2 * oneMin)) {
        displayPattern = "Minute";
      }
      else if (timeDiff < mins60) {
        displayPattern = "Minutes";
      }
      else if (timeDiff < mins120) {
        displayPattern = "Hour";
      }
      else if (timeDiff < hours24) {
        displayPattern = "Hours";
      }
      else if (timeDiff < days7) {
        displayPattern = "WeekDay";
      }
      else {
        displayPattern = "Full";
      }
    }

    if ((userId !== undefined) || displayPattern) {
      data = data || {};

      data.userId = userId; // can be undefined, null, "" or "<userId>"

      if (displayPattern) {
        var localeFormat = dojo.date.locale.format, dateObject = new Date(timeValue);
        
        data.minutes = Math.floor(timeDiff / oneMin);
        data.hours = Math.floor(timeDiff / mins60);
        data.weekDay = localeFormat(dateObject, { datePattern: "EEEE", selector: "date" });
        data.formattedDate = localeFormat(dateObject, { selector: "date" });
        data.formattedTime = localeFormat(dateObject, { selector: "time" });
        data.displayPattern = displayPattern;
        data.timeValue = timeValue;
      }
    }
    
    return data; // can be: undefined/have userId/have time components/have both userId and time
  },
  
  isEditable: function() {
    return !!(this._editable || this.userIsAdmin);
  },
  
  setMaxAllowableOffset: function(offset) {
    if (!this.isEditable()) {
      this._maxOffset = offset;
    }
    return this;
  },
  
  getMaxAllowableOffset: function() {
    return this._maxOffset;
  },
  
  setAutoGeneralize: function(enable) {
    if (!this.loaded) {
      this._optAutoGen = enable;
    }
    else if (
      !this.isEditable() && 
      (this.mode !== this.constructor.MODE_SNAPSHOT) &&
      ((this.geometryType === "esriGeometryPolyline") || (this.geometryType === "esriGeometryPolygon"))
    ) {
      this._autoGeneralize = enable;
      
      if (enable) {
        var map = this._map;
        if (map && map.loaded) {
          this._maxOffset = Math.floor(map.extent.getWidth() / map.width);
        }
      }
      else {
        delete this._maxOffset;
      }
    }
    
    return this;
  },
  
  setScaleRange: function(/*Number*/ minScale, /*Number*/ maxScale) {
    this.minScale = minScale || 0;
    this.maxScale = maxScale || 0;
    
    // listen for map zoom end to act on scale dependency
    //this.minScale = 0; this.maxScale = 44000;
    if (this._map && this._map.loaded) {
      /*if (minScale !== 0 || maxScale !== 0) {
        if (!this._zoomConnect) {
          this._zoomConnect = dojo.connect(this._map, "onZoomEnd", this, this._updateStatus);
        }
      }
      else {
        dojo.disconnect(this._zoomConnect);
        this._zoomConnect = null;
      }*/

      // effective immediately
      this._updateStatus();
    }
  },
  
  setGDBVersion: function(versionName) {
    if (
      !this._collection && 
      (versionName !== this.gdbVersion) && 
      (versionName || this.gdbVersion) // to catch null !== undefined !== "" passing the above condition
    ) {
      this.gdbVersion = versionName;
      this._task.gdbVersion = versionName;
      this._url.query = dojo.mixin(this._url.query, { gdbVersion: versionName });
      
      if (this.loaded) { // layer has loaded
        // this should finalize ongoing edits
        this.clearSelection();
        
        if (this._map) { // layer has been added to the map
          this.refresh();
        }
      }
      
      this.onGDBVersionChange();
    }
    
    return this;
  },
  
  setDefinitionExpression: function(/*String*/ expr) {
    this._defnExpr = expr;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*definition expression changed*/ 1);
    }
    return this;
  },
  
  getDefinitionExpression: function() {
    return this._defnExpr; // === undefined ? this.defaultDefinitionExpression : this._defnExpr;
  },
  
  setTimeDefinition: function(/*esri.TimeExtent*/ timeDefn) {
    if (/*this.timeInfo &&*/ this._isSnapshot) {
      this._timeDefn = timeDefn;
  
      var mode = this._mode;
      if (mode) {
        mode.propertyChangeHandler(/*snapshot time definition changed*/ 2);
      }
    }
    return this;
  },
  
  getTimeDefinition: function() {
    return this._timeDefn;
  },
  
  setTimeOffset: function(offsetValue, offsetUnits) {
    this._timeOffset = offsetValue;
    this._timeOffsetUnits = offsetUnits;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
    return this;
  },
  
  setUseMapTime: function(use) {
    this.useMapTime = use;
    this._toggleTime(!this._suspended);

    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
  },
  
  selectFeatures: function(/*esri.tasks.Query*/ query, /*Number?*/ selectionMethod, /*Function?*/ callback, /*Function?*/ errback) {
    selectionMethod = selectionMethod || this.constructor.SELECTION_NEW;
    
    var query2 = this._getShallowClone(query),
        map = this._map, featureSet,
        dfd = esri._fixDfd(new dojo.Deferred(esri._dfdCanceller));
    
    // override user query
    query2.outFields = this._getOutFields();
    query2.returnGeometry = true;
    if (map) {
      query2.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
    }
    
    // apply query filters
    if (!this._applyQueryFilters(query2)) {
//      return; // abort selection
      featureSet = { features: [] };
      // TODO
      // Need to consider doing setTimeout with delay=0
      this._selectHandler(featureSet, selectionMethod, callback, errback, dfd);
      //return this._getDeferred([featureSet.features, selectionMethod]);
      return dfd;
    }
    
    var queryTypes = this._canDoClientSideQuery(query2);
    if (queryTypes) { // use client-side implementation of selection
      featureSet = { features: this._doQuery(query2, queryTypes) };
      this._selectHandler(featureSet, selectionMethod, callback, errback, dfd);
      //return this._getDeferred([featureSet.features, selectionMethod]);
      return dfd;
    }
    else { // go to server
      if (this._collection) {
        var err = new Error("FeatureLayer::selectFeatures - " + esri.bundle.layers.FeatureLayer.invalidParams);
        /*if (errback) {
          errback(err);
        }
        return this._getDeferred(null, err);*/
       
        this._resolve([err], null, errback, dfd, true);
        return dfd;
      }

      var self = this;
      
      if (this._ts) {
        query2._ts = (new Date()).getTime();
      }

      var temp = dfd._pendingDfd = this._task.execute(query2);
      temp.addCallbacks(
        function(response) {
          self._selectHandler(response, selectionMethod, callback, errback, dfd);
        }, 
        function(err) {
          //dfd.errback(err);
          self._resolve([err], null, errback, dfd, true);
        }
      );
      
      return dfd;
    }
  },
  
  getSelectedFeatures: function() {
    var selected = this._selectedFeatures, retVal = [], item;
    
    for (item in selected) {
      if (selected.hasOwnProperty(item)) {
        retVal.push(selected[item]);
      }
    }
    
    /*selected = this._selectedFeaturesArr;
    if (selected.length > 0) {
      retVal = retVal.concat(selected);
    }*/
    
    return retVal;
  },
  
  clearSelection: function(silent) {
    // unselect and clear the selection
    var selected = this._selectedFeatures, mode = this._mode, item;
    
    for (item in selected) {
      if (selected.hasOwnProperty(item)) {
        this._unSelectFeatureIIf(item, mode);
        mode._removeFeatureIIf(item);
      }
    }
    this._selectedFeatures = {};
    
    /*selected = this._selectedFeaturesArr;
    var i = selected.length;
    while (i >= 0) {
      this._unSelectNewFeature(selected[i]);
      i--;
    }
    this._selectedFeaturesArr = [];*/

    if (this._isSelOnly) {
      mode._applyTimeFilter(true);
    }
    
    if (!silent) {
      this.onSelectionClear();
    }
    return this;
  },
  
  setSelectionSymbol: function(/*esri.symbol.Symbol*/ symbol) {
    this._selectionSymbol = symbol;
    
    if (symbol) {
      // apply it to the current selection
      var selected = this._selectedFeatures, item;
      for (item in selected) {
        if (selected.hasOwnProperty(item)) {
          selected[item].setSymbol(symbol);
        }
      }
    }
    
    return this;
  },
  
  getSelectionSymbol: function() {
    return this._selectionSymbol;
  },
  
  // Methods to be wrapped with normalize logic
  __msigns: [
    {
      n: "applyEdits",
      c: 5, // number of arguments expected by the method before the normalize era
      a: [ // arguments or properties of arguments that need to be normalized
        { i: 0 },
        { i: 1 }
      ],
      e: 4,
      f: 1
    }
  ],
  
  applyEdits: function(/*esri.Graphic[]*/ adds, /*esri.Graphic[]*/ updates, /*esri.Graphic[]*/ deletes, 
                       /*Function?*/ callback, /*Function?*/ errback, context) {
    
    // Use normalized geometries in place of the originals
    var assembly = context.assembly, dfd = context.dfd;
    // "adds" and "updates" will be mutated in-place
    this._applyNormalized(adds, assembly && assembly[0]);
    this._applyNormalized(updates, assembly && assembly[1]);
    
    // This event will be fired just before the edits request is sent 
    // to the server when 'FeatureLayer.applyEdits' method is called. 
    // You wouldn't need to use this event for most cases. But when 
    // using the Editor widget, this event can be used to intercept 
    // feature edits to, for example, to add additional attributes to 
    // newly created features that you did not want to show in the 
    // attribute inspector.
    this.onBeforeApplyEdits(adds, updates, deletes);
    
    var i, updatesMap = {}, oidField = this.objectIdField, content = { f: "json" }, dirty = false;

    if (this._collection) {
      // process edits on the client. there is no service to talk to.
      var response = {};
      
      response.addResults = adds ? dojo.map(adds, function() {
        dirty = true;
        return { objectId: this._nextId++, success: true };
      }, this) : null;
      
      response.updateResults = updates ? dojo.map(updates, function(feature) {
        dirty = true;
        var oid = feature.attributes[oidField];
        updatesMap[oid] = feature;
        return { objectId: oid, success: true };
      }, this) : null;
      
      response.deleteResults = deletes ? dojo.map(deletes, function(feature) {
        dirty = true;
        return { objectId: feature.attributes[oidField], success: true };
      }, this) : null;
      
      if (dirty) {
        this._editHandler(response, adds, updatesMap, callback, errback, dfd);
        //return this._getDeferred([response.addResults, response.updateResults, response.deleteResults]);
      }
      return;
    }
    
    // add features
    if (adds && adds.length > 0) {
      content.adds = this._convertFeaturesToJson(adds, 0, 1);
      dirty = true;
    }
    
    // update features
    if (updates && updates.length > 0) {
      for (i = 0; i < updates.length; i++) {
        var update = updates[i];
        updatesMap[update.attributes[oidField]] = update;
      }
      content.updates = this._convertFeaturesToJson(updates, 0, 0, 1);
      dirty = true;
    }
    
    // delete features
    if (deletes && deletes.length > 0) {
      var ids = [];
      for (i = 0; i < deletes.length; i++) {
        ids.push(deletes[i].attributes[oidField]);
      }
      content.deletes = ids.join(",");
      dirty = true;
    }
    
    if (dirty) {
      var self = this;
      
      return esri.request({
        url: this._url.path + "/applyEdits",
        content: dojo.mixin(content, this._url.query),
        callbackParamName: "callback",
        load: function(response) {
          self._editHandler(response, adds, updatesMap, callback, errback, dfd);
        },
        error: function(err) {
          self._resolve([err], null, errback, dfd, true);
        }
      }, { usePost: true });
    }
  },
  
  queryFeatures: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("execute", "onQueryFeaturesComplete", query, callback, errback);
  },
  
  queryRelatedFeatures: function(/*esri.tasks.RelationshipQuery*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeRelationshipQuery", "onQueryRelatedFeaturesComplete", query, callback, errback);
  },
  
  queryIds: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeForIds", "onQueryIdsComplete", query, callback, errback);
  },
  
  queryCount: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeForCount", "onQueryCountComplete", query, callback, errback);
  },
  
  queryAttachmentInfos: function(/*Number*/ objectId, callback, errback) {
    var url = this._url.path + "/" + objectId + "/attachments",
        dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this;
    
    dfd._pendingDfd = esri.request({
      url: url,
      content: dojo.mixin({ f: "json" }, this._url.query),
      callbackParamName: "callback",
      
      load: function(response) {
        var infos = response.attachmentInfos,
          params;
        dojo.forEach(infos, function(info) {
          params = dojo.objectToQuery({
            gdbVersion: self._url.query && self._url.query.gdbVersion,
            layer: self._url.query && self._url.query.layer,
            token: self._getToken()
          });
          info.url = url + "/" + info.id + (params ? ("?" + params) : "");
          info.objectId = objectId;
        });
        
        /*this.onQueryAttachmentInfosComplete(infos);
        if (callback) {
          callback(infos);
        }*/
        
        self._resolve([infos], "onQueryAttachmentInfosComplete", callback, dfd);
      },
      
      error: function(err) {
        self._resolve([err], null, errback, dfd, true);
      }
    });
    
    return dfd;
  },
  
  addAttachment: function(/*Number*/ objectId, formNode, callback, errback) {
    return this._sendAttachment("add", objectId, formNode, callback, errback);
  },
  
  updateAttachment: function(/*Number*/ objectId, /*Number*/ attachmentId, formNode, callback, errback) {
    formNode.appendChild( dojo.create("input", { type: "hidden", name: "attachmentId", value: attachmentId }) );
    return this._sendAttachment("update", objectId, formNode, callback, errback);
  },
  
  deleteAttachments: function(/*Number*/ objectId, /*Number[]*/ attachmentIds, callback, errback) {
    var url = this._url.path + "/" + objectId + "/deleteAttachments",
        dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this,
        content = {
          f: "json",
          attachmentIds: attachmentIds.join(",")
        };
    
    dfd._pendingDfd = esri.request({
      url: url,
      content: dojo.mixin(content, this._url.query),
      callbackParamName: "callback",
      
      load: dojo.hitch(this, function(response) {
        var results = response.deleteAttachmentResults;
        results = dojo.map(results, function(result) {
          var res = new esri.layers.FeatureEditResult(result);
          res.attachmentId = res.objectId;
          res.objectId = objectId;
          return res;
        });
        
        /*this.onDeleteAttachmentsComplete(results);
        if (callback) {
          callback(results);
        }*/
        
        self._resolve([results], "onDeleteAttachmentsComplete", callback, dfd);
      }), // load handler
      
      error: function(err) {
        self._resolve([err], null, errback, dfd, true);
      }
    }, { usePost: true });
    
    return dfd;
  },
  
  addType: function(newType) {
    // we want to add types to FS layers that are editable but don't have types and templates
    // this is the case for old hosted FS
    //if (!this._collection) {
    //  return false;
    //}
    
    var types = this.types;

    if (types) {
      var found = dojo.some(types, function(type) {
        if (type.id == newType.id) {
          return true;
        }
        return false;
      }); // some
      
      if (found) { // type already exists
        return false;
      }
      else { // new type, add it
        types.push(newType);
      }
    }
    else { // layer has no types yet
      this.types = [ newType ];
    }

    this._typesDirty = true;
    return true;
  },
  
  deleteType: function(typeId) {
    if (!this._collection) {
      return;
    }
    
    var types = this.types;
    
    if (types) {
      var found = -1;
      dojo.some(types, function(type, index) {
        if (type.id == typeId) {
          found = index;
          return true;
        }
        return false;
      }); // some
      
      if (found > -1) { // type exists
        this._typesDirty = true;
        return types.splice(found, 1)[0];
      }
    }
  },
  
  toJson: function() {
    var _json = this._json, json = dojo.isString(_json) ? dojo.fromJson(_json) : dojo.clone(_json);
    if (!json) {
      return;
    }
    
    json = json.layerDefinition ? json : { layerDefinition: json };
    
    var definition = json.layerDefinition, collection = this._collection;
    
    // if collection, update layerDefinition
    if (collection && this._typesDirty) {
      // update types
      definition.types = dojo.map(this.types || [], function(type) {
        return type.toJson();
      });

      // update renderer
      var renderer = this.renderer, drawInfo = definition.drawingInfo;
      if (drawInfo && renderer && renderer.declaredClass.indexOf("TemporalRenderer") === -1) {
        drawInfo.renderer = renderer.toJson();
      }
    }
    
    var outFeatureSet = null;
    if (!(collection && !this._fcAdded)) {
      outFeatureSet = {
        geometryType: definition.geometryType,
        features: this._convertFeaturesToJson(this.graphics, true/*, collection ? this.objectIdField : null*/)
      };
    }
    
    json.featureSet = dojo.mixin({}, json.featureSet || {}, outFeatureSet);
    
    // webmap spec
    if (collection) {
      json.nextObjectId = this._nextId;
      definition.capabilities = this.capabilities;
    }
    
    return json;
  },
  
  /*********
   * Events
   *********/
  
  onSelectionComplete: function() {},
  onSelectionClear: function() {},
  onBeforeApplyEdits: function() {},
  onEditsComplete: function() {},
  onQueryFeaturesComplete: function() {},
  onQueryRelatedFeaturesComplete: function() {},
  onQueryIdsComplete: function() {},
  onQueryCountComplete: function() {},
  onQueryAttachmentInfosComplete: function() {},
  onAddAttachmentComplete: function() {},
  onUpdateAttachmentComplete: function() {},
  onDeleteAttachmentsComplete: function() {},
  onCapabilitiesChange: function() {},
  onGDBVersionChange: function() {},
  onQueryLimitExceeded: function() {},
  
  /*******************
   * Internal Methods
   *******************/
  
  _updateCaps: function() {
    /*
      // Tests:
      (function() {
      
      var scope = { _editable: null, capabilities: null },
          result;
      
      console.log("Editable = FALSE");
      
      scope._editable = false; scope.capabilities = "";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create,Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create,Update,Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === ""));
      
      scope._editable = false; scope.capabilities = undefined;
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Query";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query"));
          
      scope._editable = false; scope.capabilities = "Query,Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("8. " + (scope.capabilities === "Query"));
      
      console.log("Editable = TRUE");
      
      scope._editable = true; scope.capabilities = "";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Editing,Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === "Editing,Create"));
          
      scope._editable = true; scope.capabilities = "Editing,Create,Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === "Editing,Create,Update"));
          
      scope._editable = true; scope.capabilities = "Editing,Create,Update,Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === "Editing,Create,Update,Delete"));
      
      scope._editable = true; scope.capabilities = undefined;
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Query";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query,Editing"));
          
      scope._editable = true; scope.capabilities = "Query,Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("8. " + (scope.capabilities === "Query,Editing"));

      console.log("Editable = TRUE, SPACES in capabilities");
          
      scope._editable = true; scope.capabilities = "Query, Editing, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === "Query,Editing,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === "Query,Editing,Update"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Update, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === "Query,Editing,Update,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === "Query,Editing,Create,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === "Query,Editing,Create,Update"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === "Query,Editing,Create"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Update, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query,Editing,Create,Update,Delete"));
      
      }());
      
      result = dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("X. " + (result === TTT));
    */
    
    // Update "capabilities" to reflect current state of the layer's
    // editability
    
    var editable = this._editable, capabilities = dojo.trim(this.capabilities || ""),
        outCaps = dojo.map((capabilities ? capabilities.split(",") : []), dojo.trim),
        caps = dojo.map((capabilities ? capabilities.toLowerCase().split(",") : []), dojo.trim),
        found = dojo.indexOf(caps, "editing"), cap, i, toRemove,
        specifics = {
          "Create": dojo.indexOf(caps, "create"),
          "Update": dojo.indexOf(caps, "update"),
          "Delete": dojo.indexOf(caps, "delete")
        };
    
    if (editable && found === -1) {
      outCaps.push("Editing");
      
      // Push Create, Update and Delete as well
      /*for (cap in specifics) {
        if (specifics[cap] === -1) {
          outCaps.push(cap);
        }
      }*/
    }
    else if (!editable && found > -1) {
      toRemove = [ found ];
      
      // Remove Create, Update and Delete as well
      for (cap in specifics) {
        if (specifics[cap] > -1) {
          toRemove.push(specifics[cap]);
        }
      }
      
      toRemove.sort();
      for (i = toRemove.length - 1; i >=0; i--) {
        outCaps.splice(toRemove[i], 1);
      }
    }
    
    this.capabilities = outCaps.join(",");
  },
  
  _counter: { value: 0 }, // this object will be shared by all feature layer instances
  
  _getUniqueId: function() {
    return this._counter.value++;
  },
    
  // (override)
  _getDesiredStatus: function() {
    // Returns true if the layer shold be alive, false otherwise
    return this.visible && this._isMapAtVisibleScale();
  },
  
  _isMapAtVisibleScale: function() {
    if (!this._map) {
      return false;
    }
    
    var scale = esri.geometry.getScale(this._map);
    //console.info(scale);
    
    // Examples:
    // minScale = 25000, maxScale = 7500
    // minScale = 0, maxScale = 7500
    // minScale = 7499, maxScale = 0
    // minScale = 0, maxScale = 0
    // More on semantics here: http://webhelp.esri.com/arcgisdesktop/9.3/index.cfm?TopicName=Displaying_layers_at_certain_scales
    
    var minScale = this.minScale, maxScale = this.maxScale, minPassed = !minScale, maxPassed = !maxScale;
    if (!minPassed && scale <= minScale) {
      minPassed = true;
    }
    if (!maxPassed && scale >= maxScale) {
      maxPassed = true;
    }
    
    return (minPassed && maxPassed) ? true : false;
  },
  
  // (extend)
  _suspend: function() {
    //console.info("suspending...");
    this.inherited("_suspend", arguments);
    this._toggleTime(false);
    var mode = this._mode;
    if (mode) {
      mode.suspend();
    }
  },
  
  // (extend)
  _resume: function() {
    //console.info("resuming...");
    this.inherited("_resume", arguments);
    this._toggleTime(true);
    var mode = this._mode;
    if (mode) {
      mode.resume();
    }
  },
  
  _zoomHandler: function() {
    var map = this._map;

    if (map && map.loaded) {
      if (this._autoGeneralize) {
        this._maxOffset = Math.floor(map.extent.getWidth() / map.width);
      }

      this._updateStatus();
    }
  },
  
  _toggleTime: function(enable) {
    //if (this.timeInfo) {
      var map = this._map;
      if (enable && this.timeInfo && this.useMapTime && map) {
        this._mapTimeExtent = map.timeExtent;
        if (!this._timeConnect) {
          this._timeConnect = dojo.connect(map, "onTimeExtentChange", this, this._timeChangeHandler);
        }
      }
      else {
        this._mapTimeExtent = null;
        dojo.disconnect(this._timeConnect);
        this._timeConnect = null;
      }
    //} 
  },
  
  _timeChangeHandler: function(newTimeExtent) {
    this._mapTimeExtent = newTimeExtent;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
  },
  
  _getOffsettedTE: function(timeExtent) {
    var offset = this._timeOffset, units = this._timeOffsetUnits;
    return (timeExtent && offset && units) ? timeExtent.offset(-1 * offset, units) : timeExtent;
  },
  
  _getTimeOverlap: function(timeExtent1, timeExtent2) {
    if (timeExtent1 && timeExtent2) {
      return timeExtent1.intersection(timeExtent2);
    }
    else {
      return timeExtent1 || timeExtent2;
    }
  },
  
  _getTimeFilter: function(queryTime) {
    // The effective time filter is the overlap
    // between query time, layer time defn and map time extent
    // If atleast two of the above variables have values and there is no
    // overlap, then ABORT selection
    
    // Group 1: NO queryTime
    
    /*// Subgroup 1: NO time definition, NO time extent
       var tDefn = null;
       var tExtent = null;
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && !ov[1] );
    
    // Subgroup 2: time definition + time extent
    
    //   Subgroup 1: overlap
         var tDefn = { startTime: 10, endTime: 20 };
         var tExtent = { startTime: 5, endTime: 15 };
         console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
    
    //   Subgroup 2: NO overlap
         var tDefn = { startTime: 10, endTime: 20 };
         var tExtent = { startTime: 30, endTime: 40 };
         console.log( (ov = _getTimeFilter(null)) && ov[0] === false );
    
    // Subgroup 3: time definition + NO time extent
       var tDefn = { startTime: 10, endTime: 20 };
       var tExtent = null;
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,20") );
    
    // Subgroup 4: NO time definition + time extent
       var tDefn = null;
       var tExtent = { startTime: 5, endTime: 10 };
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "5,10") );*/

    // Group 2: queryTime is defined
    
    /*// Subgroup 1: NO time definition, NO time extent
       var tDefn = null;
       var tExtent = null;
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "5,15") );
    
    // Subgroup 2: time definition + time extent
    
    //   Subgroup 1: overlap
         var tDefn = { startTime: 13, endTime: 20 };
         var tExtent = { startTime: 11, endTime: 17 };
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "13,15") );
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 12 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 18, endTime: 20 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 10 })) && ov[0] === false );
    
    //   Subgroup 2: NO overlap
         var tDefn = { startTime: 20, endTime: 30 };
         var tExtent = { startTime: 35, endTime: 45 };
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 15, endTime: 25 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 35, endTime: 40 })) && ov[0] === false );
    
    // Subgroup 3: time definition + NO time extent
       var tDefn = { startTime: 10, endTime: 20 };
       var tExtent = null;
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
       console.log( (ov = _getTimeFilter({ startTime: 1, endTime: 5 })) && ov[0] === false );
    
    // Subgroup 4: NO time definition + time extent
       var tDefn = null;
       var tExtent = { startTime: 10, endTime: 20 };
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
       console.log( (ov = _getTimeFilter({ startTime: 1, endTime: 5 })) && ov[0] === false );*/
    

    // Updated Test Cases: "map time extent is never used"
    
    /*// Group 1: NO queryTime
    var tDefn = null;
    console.log( (ov = _getTimeFilter(null)) && ov[0] === true && !ov[1] );

    var tDefn = new esri.TimeExtent();
    tDefn.startTime = new Date(10);
    tDefn.endTime = new Date(20);
    console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "10,20") );
    
    // Group 2: queryTime is defined
    var tDefn = null;
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(5);
    qTime.endTime = new Date(15);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "5,15") );

    var tDefn = new esri.TimeExtent();
    tDefn.startTime = new Date(10);
    tDefn.endTime = new Date(20);
    
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(1);
    qTime.endTime = new Date(5);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === false );
    
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(25);
    qTime.endTime = new Date(30);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === false );

    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(5);
    qTime.endTime = new Date(15);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "10,15") );

    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(15);
    qTime.endTime = new Date(23);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "15,20") );*/
    
    
    var timeDefn = this.getTimeDefinition(), mapTime = null /*this._getOffsettedTE(this._mapTimeExtent)*/, overlap;
    if (timeDefn || mapTime) {
      overlap = this._getTimeOverlap(timeDefn, mapTime);
      if (!overlap) {
        return [ false ]; // abort selection
      }
    }
    
    if (queryTime) {
      queryTime = overlap ? this._getTimeOverlap(queryTime, overlap) : queryTime;
      if (!queryTime) {
        return [ false ]; // abort selection
      }
    }
    else {
      queryTime = overlap;
    }
    
    return [ true, queryTime ];
  },
  
  _getAttributeFilter: function(queryWhere) {
    // The effective where clause is an AND 
    // between query where and layer definition
    
    // TODO
    // Add test cases
    
    var defExpr = this.getDefinitionExpression();
    if (queryWhere) {
      //queryWhere = defExpr ? queryWhere + " AND " + defExpr : queryWhere;
      queryWhere = defExpr ? "(" + defExpr + ") AND (" + queryWhere + ")" : queryWhere;
    }
    else {
      queryWhere = defExpr;
    }
    return queryWhere;
  },
  
  _applyQueryFilters: function(query) {
    // definition expression
    query.where = this._getAttributeFilter(query.where);
    query.maxAllowableOffset = this._maxOffset;
    
    // time
    if (this.timeInfo) {
      var result = this._getTimeFilter(query.timeExtent);
      if (!result[0]) {
        return false; // abort
      }
      else {
        query.timeExtent = result[1];
        //console.log("Time Filter ", "query.timeExtent: ", query.timeExtent.startTime, ", ", query.timeExtent.endTime);
      }
    }
    
    return true;
  },
  
  /*_registerNew: function(feature) {
    this._unRegisterNew(feature);
    this._newFeatures.push(feature);
    feature._count = 1;
  },
  
  _unRegisterNew: function(feature) {
    var newFeatures = this._newFeatures;
    var index = dojo.indexOf(newFeatures, feature);
    if (index !== -1) {
      newFeatures.splice(index, 1);
      feature._count = 0;
    }
  },
  
  _isNew: function(feature) {
    var index = dojo.indexOf(this._newFeatures, feature);
    return index === -1 ? false : true;
  },*/
  
  /*_registerDelete: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    this._deletedFeatures[oid] = feature;
  },
  
  _unRegisterDelete: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    delete this._deletedFeatures[oid];
  },
  
  _isDeleted: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    return this._deletedFeatures[oid] ? true : false;
  },*/
  
  _add: function(graphic) {
    var symbol = this._selectionSymbol, attr = graphic.attributes,
        visField = this.visibilityField;

    // set correct symbology for the graphic
    if (symbol && this._isSelOnly) {
      graphic.setSymbol(symbol);
    }
    
    // webmap spec
    if (visField && attr && attr.hasOwnProperty(visField)) {
      graphic[attr[visField] ? "show" : "hide"]();
    }
    
    // [Dojo 1.4.0] Calling an inherited method by name from a function 
    // that does not have the same name as the overridden method does not 
    // work at Dojo 1.4.0 (If the derived class had a method with the same 
    // name as the inherited method, then that would be called instead)
    
    //return this.inherited("add", arguments);
    return this.add.apply(this, arguments);
  },
  
  _remove: function() {
    //return this.inherited("remove", arguments);
    return this.remove.apply(this, arguments);
  },
  
  _canDoClientSideQuery: function(query) {
    // Return values:
    //  null/undefined --> cannot perform client-side query
    //  1 --> can do client side query for "extent"
    //  2 --> can do client side query for "object ids"
    //  3 --> can do client side query for "time"
    //console.log("_canDoClientSideQuery");
    var retVal = [], map = this._map;
    
    if (this._isTable || !map) {
      return;
    }
    
    // cannot do most attribute based queries on the client
    if ( query.text || (query.where && query.where !== this.getDefinitionExpression()) ) {
      return;
    }
    
    var isSnapshot = this._isSnapshot, selOnly = this._isSelOnly;
    
    // geometry
    var geometry = query.geometry;
    if (geometry) {
      if (!selOnly && 
          query.spatialRelationship === esri.tasks.Query.SPATIAL_REL_INTERSECTS && 
          (geometry.type === "extent" && (isSnapshot || map.extent.contains(geometry)))
      ) {
        // can do extent based intersection query, if it is within the current map extent
        retVal.push(1);
      }
      else {
        return;
      }
    }

    // object ids
    var ids = query.objectIds;
    if (ids) {
      if (isSnapshot) {
        retVal.push(2);
      }
      else {
        var len = ids.length, mode = this._mode, matchCount = 0, i;
        for (i = 0; i < len; i++) {
          if (mode._getFeature(ids[i])) {
            matchCount++;
          }
        }
        
        if (matchCount === len) {
          // can do client-side if "all" object ids in the request are
          // currently available locally
          retVal.push(2);
        }
        else {
          return;
        }
      } // if snapshot
    }
    
    // time
    if (this.timeInfo) {
      var queryTime = query.timeExtent, mapTime = this._mapTimeExtent;
      
      if (isSnapshot) {
        if (queryTime) {
          retVal.push(3);
        }
      }
      else if (selOnly) {
        if (queryTime) {
          return;
        }
      }
      else { // on-demand
        if (mapTime) {
          if (dojo.indexOf(retVal, 2) !== -1) {
            if (queryTime) {
              retVal.push(3);
            }
          }
          else {
            // Does not matter if query has time or not - 
            // we need to go to the server
            return;
          }
        }
        else {
          if (retVal.length > 0) {
            if (queryTime) {
              retVal.push(3);
            }
          }
          else {
            if (queryTime) {
              return;
            }
          }
        } // mapTime
      } // on-demand
    }
    
//    // time
//    if (query.timeExtent) {
//      if (isSnapshot) {
//        retVal.push(3);
//      }
//      else {
//        if (selOnly) {
//          return;
//        }
//        else { // on-demand mode
//          if (retVal.length > 0) {
//            retVal.push(3);
//          }
//        } // if selOnly
//      } // if isSnapshot
//    }
    
    return retVal.length > 0 ? retVal : null;
  },

  _doQuery: function(query, queryTypes, returnIdsOnly) {
    //console.log("_doQuery");
    var matched = [], mode = this._mode, oidField = this.objectIdField, i,
        len, features;

    if (dojo.indexOf(queryTypes, 2) !== -1) { // object ids
      matched = [];
      var ids = query.objectIds;
      len = ids.length;
      for (i = 0; i < len; i++) {
        var obj = mode._getFeature(ids[i]);
        if (obj) {
          matched.push(obj);
        }
      }
      
      if (matched.length === 0) {
        return [];
      }
    }

    if (dojo.indexOf(queryTypes, 1) !== -1) { // query extent
      features = matched.length > 0 ? matched : this.graphics; 
      len = features.length; 
      
      var extent = query.geometry._normalize(null, true); // can be an extent or an array of extents
      
      matched = [];
      
      for (i = 0; i < len; i++) {
        var feature = features[i], geometry = feature.geometry;
        
        if (geometry) {
          if (this.normalization && extent.length) {
            // there will be two extents in the array (see Extent::_normalize to understand why)
            if (extent[0].intersects(geometry) || extent[1].intersects(geometry)) {
              matched.push(feature);
            }
          }
          else {
            if (extent.intersects(geometry)) {
              matched.push(feature);
            }
          }
        }
      }
      
      if (matched.length === 0) {
        return [];
      }
    }

    if (dojo.indexOf(queryTypes, 3) !== -1) { // time
      if (this.timeInfo) {
        // layer is time-aware
        features = matched.length > 0 ? matched : this.graphics;
        var time = query.timeExtent, result = this._filterByTime(features, time.startTime, time.endTime);
        matched = result.match;
      }
    }

    if (returnIdsOnly) {
      return dojo.map(matched, function(obj) {
        return obj.attributes[oidField];
      }, this);
    }
    else {
      return matched;
    }
  },
  
  _filterByTime: function(graphics, startTime, endTime) {
    var startTimeField = this._startTimeField, endTimeField = this._endTimeField, timeField;
    if (!this._twoTimeFields) {
      timeField = startTimeField || endTimeField;
    }
    
    var isDef = esri._isDefined, yea = [], nay = [], i, len = graphics.length, graphic, attributes;
    startTime = startTime ? startTime.getTime() : -Infinity;
    endTime = endTime ? endTime.getTime() : Infinity;
    
    /*if (startTime && endTime) { // time extent?
      startTime = startTime.getTime();
      endTime = endTime.getTime();*/

      if (timeField) { // there is only one time field
        for (i = 0; i < len; i++) {
          graphic = graphics[i];
          attributes = graphic.attributes;
          
          var time = attributes[timeField];
          
          if ( time >= startTime && time <= endTime ) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        } // loop
      }
      else { // we have start and end time fields
        for (i = 0; i < len; i++) {
          graphic = graphics[i];
          attributes = graphic.attributes;
          
          var start = attributes[startTimeField], end = attributes[endTimeField];
          start = isDef(start) ? start : -Infinity;
          end = isDef(end) ? end : Infinity;
          
          // Should it be INTERSECTS or CONTAINS? Looks like it should be
          // INTERSECTS
          if ( (start >= startTime && start <= endTime) || // feature-start within filter's timespan
               (end >= startTime && end <= endTime) || //  feature-end within filter's timespan
               (startTime >= start && endTime <= end) // filter's timespan completely within feature's timespan
             ) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        }
      } // timeField
      
    /*}
    else if (startTime || endTime) { // time instant?
      startTime = (startTime || endTime).getTime();

      if (timeField) { // there is only one time field
        for (var i = 0, len = graphics.length; i < len; i++) {
          var graphic = graphics[i], attributes = graphic.attributes;
          var time = attributes[timeField];
          
          if (time === startTime) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        } // loop
      }
      else { // we have start and end time fields
        for (var i = 0, len = graphics.length; i < len; i++) {
          var graphic = graphics[i], attributes = graphic.attributes;
          var start = attributes[startTimeField], end = attributes[endTimeField];
          start = isNotDefined(start) ? -Infinity : start;
          end = isNotDefined(end) ? Infinity : end;
          
          if (startTime >= start && startTime <= end) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        }
      } // timeField

    }*/
    return { match: yea, noMatch: nay };
  },
  
  /*_getDeferred: function(response, error) {
    var df = new dojo.Deferred();
    
    if (error) {
      df.errback(error);
    }
    else {
      //df.callback(response);
      if (dojo.isArray(response) && response.length > 1) {
        df = esri._fixDfd(df);
      }
      esri._resDfd(df, response);
    }
    
    return df;
  },*/
  
  _resolve: function(args, eventName, callback, dfd, isError) {
    // Fire Event
    if (eventName) {
      this[eventName].apply(this, args);
    }
    
    // Invoke Callback
    if (callback) {
      callback.apply(null, args);
    }
    
    // Resolve Deferred
    if (dfd) {
      esri._resDfd(dfd, args, isError);
    }
  },
  
  _getShallowClone: function(query) {
    // clone (shallow) query object
    var query2 = new esri.tasks.Query(), prop;
    for (prop in query) {
      if (query.hasOwnProperty(prop)) {
        query2[prop] = query[prop];
      }
    }
    return query2;
  },
  
  _query: function(type, eventName, query, callback, errback) {
    var that = this, 
        dfd = new dojo.Deferred(esri._dfdCanceller);
    
    var cbFunc = function(response, noLookup) {
      if (!noLookup && type === "execute" && !that._isTable) {
        // if some features are already on the client,
        // we need to replace them with references that we
        // already have
        var features = response.features, mode = that._mode, oidField = that.objectIdField,
            il = features.length, i;
            
        for (i = il - 1; i >= 0; i--) {
          var oid = features[i].attributes[oidField];
          var localRef = mode._getFeature(oid);
          if (localRef) {
            features.splice(i, 1, localRef);
          }
        }
      }
      
      /*that[eventName](response);
      if (callback) {
        callback(response);
      }
      if (dfd) {
        esri._resDfd(dfd, [response]);
      }*/
      that._resolve([response], eventName, callback, dfd);
    };

    if (type !== "executeRelationshipQuery") {
      query = this._getShallowClone(query);
      query.outFields = this._getOutFields();
      query.returnGeometry = true;
      
      var map = this._map, output;
      if (map) {
        query.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
      }
      
      // apply query filters
      if (!this._applyQueryFilters(query)) {
        //var output = (type === "execute") ? new esri.tasks.FeatureSet({ features: [] }) : [];
        switch(type) {
          case "execute":
            output = new esri.tasks.FeatureSet({ features: [] });
            break;
          case "executeForIds":
            output = [];
            break;
          case "executeForCount":
            output = 0;
            break;
        }
        
        cbFunc(output, true);
        //return this._getDeferred([output]);
        return dfd;
      }
      
      // execute the query: client-side or server-side
      var queryTypes = this._canDoClientSideQuery(query);
      if (queryTypes) {
        var features = this._doQuery(query, queryTypes, (type === "executeForIds" || type === "executeForCount"));
        
        //var output = (type === "execute") ? { features: features } : features;
        /*var output = features;
        if (type === "execute") {
          output = new esri.tasks.FeatureSet();
          output.features = features;
        }*/
        
        switch(type) {
          case "execute":
            output = new esri.tasks.FeatureSet();
            output.features = features;
            break;
          case "executeForIds":
            output = features;
            break;
          case "executeForCount":
            output = features.length;
            break;
        }
        
        cbFunc(output, true);
        //return this._getDeferred([output]);
        return dfd;
      }
    }

    if (this._collection) {
      var err = new Error("FeatureLayer::_query - " + esri.bundle.layers.FeatureLayer.invalidParams);
      /*if (errback) {
        errback(err);
      }
      return this._getDeferred(null, err);*/
     
      this._resolve([err], null, errback, dfd, true);
      return dfd;
    }

    if (this._ts) {
      query._ts = (new Date()).getTime();
    }
    
    var temp = dfd._pendingDfd = this._task[type](query);
    temp.addCallbacks(
      cbFunc,
      function(err) {
        that._resolve([err], null, errback, dfd, true);
      }
    );
    
    return dfd;
  },
  
  _convertFeaturesToJson: function(features, dontStringify, isAdd, isUpdate) {
    var json = [], selSymbol = this._selectionSymbol,
        visField = this.visibilityField, i, nonEditableFields,
        oidField = this.objectIdField;
    
    // Identify non-editable fields so that we can avoid sending
    // them to the server
    if (this.loaded && (isAdd || isUpdate)) {
      nonEditableFields = dojo.filter(this.fields, function(field) {
        return (field.editable === false) && 
               (!isUpdate || (field.name !== oidField));
      });
    }
    
    for (i = 0; i < features.length; i++) {
      var feature = features[i], featureJson = {}, 
          geometry = feature.geometry, attr = feature.attributes,
          symbol = feature.symbol;
          
      if (geometry && (!isUpdate || !this.loaded || this.allowGeometryUpdates)) {
        featureJson.geometry = geometry.toJson();
      }
      
      // webmap spec
      // Write out visibilityField
      if (visField) {
        featureJson.attributes = attr = dojo.mixin({}, attr);
        attr[visField] = feature.visible ? 1 : 0;
      }
      else if (attr) {
        featureJson.attributes = dojo.mixin({}, attr);
        /*if (suppressField) {
          delete featureJson.attributes[suppressField];
        }*/
      }
      
      // Remove non-editable fields from the attributes
      if (featureJson.attributes && nonEditableFields && nonEditableFields.length) {
        dojo.forEach(nonEditableFields, function(field) {
          delete featureJson.attributes[field.name];
        });
      }
      
      if (symbol && (symbol !== selSymbol)) {
        featureJson.symbol = symbol.toJson();
      }
      
      json.push(featureJson);
    }
    
    return dontStringify ? json : dojo.toJson(json);
  },
  
  _selectHandler: function(response, selectionMethod, callback, errback, dfd) {
    //console.log(" select features: ", response);

    // To select or to not select these new features?
    var doSelect, ctor = this.constructor;
    switch(selectionMethod) {
      case ctor.SELECTION_NEW:
        this.clearSelection(true);
        doSelect = true;
        break;
      case ctor.SELECTION_ADD:
        doSelect = true;
        break;
      case ctor.SELECTION_SUBTRACT:
        doSelect = false;
        break;
    }
    
    // process the features
    var i, features = response.features, mode = this._mode, retVal = [], oidField = this.objectIdField,
        feature, oid;
    if (doSelect) {
      for (i = 0; i < features.length; i++) {
        feature = features[i];
        oid = feature.attributes[oidField];
        
        /*if (this._isNew(feature)) {
          retVal.push(feature);
          this._selectNewFeature(feature);
        }
        else if (!this._isDeleted(feature)) {*/
          var added = mode._addFeatureIIf(oid, feature);
          retVal.push(added);
          this._selectFeatureIIf(oid, added, mode);
        //}
      }
    }
    else {
      for (i = 0; i < features.length; i++) {
        feature = features[i];
        oid = feature.attributes[oidField];
        
        /*if (this._isNew(feature)) {
          retVal.push(feature);
          this._unSelectNewFeature(feature);
        }
        else {*/
          this._unSelectFeatureIIf(oid, mode);
          var removed = mode._removeFeatureIIf(oid);
          retVal.push(removed || feature);
        //}
      }
    }

    if (this._isSelOnly) {
      mode._applyTimeFilter(true);
    }
    
    /*this.onSelectionComplete(retVal, selectionMethod);
    if (callback) {
      callback(retVal, selectionMethod);
    }
    if (dfd) {
      esri._resDfd(dfd, [retVal, selectionMethod]);
    }*/

    this._resolve(
      [retVal, selectionMethod, response.exceededTransferLimit ? { queryLimitExceeded: true } : null], 
      "onSelectionComplete", callback, dfd
    );
    
    if (response.exceededTransferLimit) {
      this.onQueryLimitExceeded();
    }
  },
  
  _selectFeatureIIf: function(oid, feature, mode) {
    var selected = this._selectedFeatures, found = selected[oid]; //, symbol = this._selectionSymbol, isSelOnly = this._isSelOnly;
    if (!found) {
      mode._incRefCount(oid);
      selected[oid] = feature;
      if (!this._isTable) {
        this._setSelectSymbol(feature);
      }
    }
    return found || feature;
  },

  _unSelectFeatureIIf: function(oid, mode) {
    var found = this._selectedFeatures[oid];
    if (found) {
      mode._decRefCount(oid);
      delete this._selectedFeatures[oid];
      if (!this._isTable) {
        this._setUnSelectSymbol(found);
      }
    }
    return found;
  },
  
  /*_selectNewFeature: function(feature) {
    var selected = this._selectedFeaturesArr;
    var index = dojo.indexOf(selected, feature);
    if (index === -1) {
      selected.push(feature);
      feature._count++;
      this._setSelectSymbol(feature);
    }
    return feature;
  },
  
  _unSelectNewFeature: function(feature) {
    var selected = this._selectedFeaturesArr;
    var index = dojo.indexOf(selected, feature), found;
    if (index !== -1) {
      found = selected[index];
      found._count = 1;
      this._setUnSelectSymbol(found);
      selected.splice(index, 1);
    }
    return found;
  },*/
  
  _isSelected: function(feature) {
    // TODO
  },
  
  _setSelectSymbol: function(feature) {
    var symbol = this._selectionSymbol;
    if (symbol && !this._isSelOnly) {
      // TODO 
      // How should we handle if feature
      // has its own symbol?
      feature.setSymbol(symbol);
    }
  },
  
  _setUnSelectSymbol: function(feature) {
    var symbol = this._selectionSymbol;
    if (symbol && !this._isSelOnly) {
      //feature.setSymbol(this.renderer.getSymbol(feature));
      if (symbol === feature.symbol) {
        feature.setSymbol(null, true);
      }
    }
  },
  
  /*_getSymbol: function(feature) {
    if (this.isEditable()) { // layer in a feature service 
      return this._getSymbolByType(feature.attributes[this.typeIdField]) || this.defaultSymbol;
    }
    else { // layer in a map service
      return null;
    }
  },
  
  _getSymbolByType: function(typeId) {
    if (typeId === undefined || typeId === null) {
      return null;
    }
    
    var types = this.types;
    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      if (type.id == typeId) {
        return type.symbol;
      }
    }
    return null;
  },*/
  
  _getOutFields: function() {
    // Test Cases:
    /*console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid", "rndid2" ],
      _outFields: null
    }).join(",") === "oid,tid,stid,endid,tkid,rndid,rndid2");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: [ "*" ]
    }).join(",") === "*");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: ["f1", "f2"]
    }).join(",") === "f1,f2,oid,tid,stid,endid,tkid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: ["oid", "tkid", "f1", "f2"]
    }).join(",") === "oid,tkid,f1,f2,tid,stid,endid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: null,
      _startTimeField: "stid",
      _endTimeField: null,
      _trackIdField: null,
      
      _rendererFields: [ "rndid" ],
      _outFields: null
    }).join(",") === "oid,stid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: null,
      typeIdField: null,
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: null,
      
      _rendererFields: null,
      _outFields: null
    }).join(",") === "");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "OBJECTID",
      typeIdField: "",
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: "",
      
      _rendererFields: [ "rndid", null, "" ],
      _outFields: null
    }).join(",") === "OBJECTID,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "stid",
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: "oid",
      
      _rendererFields: [ "stid" ],
      _outFields: null
    }).join(",") === "oid,stid");
    */
    
    var requiredFields = dojo.filter([
      this.objectIdField,
      this.typeIdField,
      this.creatorField,
      this._startTimeField,
      this._endTimeField,
      this._trackIdField
    ].concat(this._rendererFields), function(field, index, arr) {
      return !!field && (dojo.indexOf(arr, field) === index);
    });
    
    var outFields = dojo.clone(this._outFields);
    if (outFields) {
      if (dojo.indexOf(outFields, "*") !== -1) {
        return outFields;
      }
      
      dojo.forEach(requiredFields, function(field) {
        if (dojo.indexOf(outFields, field) === -1) {
          outFields.push(field);
        }
      });
      return outFields;
    }
    else {
      return requiredFields;
    }
  },
  
  _checkFields: function(inFields) {
    var requiredFields = inFields || this._getOutFields();
    
    dojo.forEach(requiredFields, function(reqField) {
      if (reqField === "*" /*|| reqField === "__object__id__"*/) {
        return;
      }
      
//      var found = dojo.some(this.fields, function(fieldInfo) {
//        return (fieldInfo && fieldInfo.name === reqField) ? true : false;
//      });
      
      if (!this._getField(reqField)) {
        console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url, field: reqField }, esri.bundle.layers.FeatureLayer.fieldNotFound));
      }
    }, this);
    
    if (!inFields && !this._isTable && !this._fserver && !this._collection) {
      var found = dojo.some(this.fields, function(fieldInfo) {
        return (fieldInfo && fieldInfo.type === "esriFieldTypeGeometry") ? true : false;
      });
      
      if (!found) {
        console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url }, esri.bundle.layers.FeatureLayer.noGeometryField));
      }
    }
  },
  
  _fixRendererFields: function() {
    var renderer = this.renderer;
    
    if (renderer && this.fields.length > 0) {
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        var fieldInfo, fieldName;
        
        fieldName = rnd.attributeField;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField = fieldInfo.name;
          }
        }

        fieldName = rnd.attributeField2;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField2 = fieldInfo.name;
          }
        }

        fieldName = rnd.attributeField3;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField3 = fieldInfo.name;
          }
        }

        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      }, this); // for loop
      
      this._rendererFields = dojo.filter(fields, esri._isDefined);
      
    } // if renderer
  },
  
  _getField: function(fieldName, ignoreCase) {
    var fields = this.fields;
    if (fields.length === 0) {
      return null;
    }

    var retVal;
    
    if (ignoreCase) {
      fieldName = fieldName.toLowerCase();
    }
    
    dojo.some(fields, function(fieldInfo) {
      var found = false;
      if (ignoreCase) {
        found = (fieldInfo && fieldInfo.name.toLowerCase() === fieldName) ? true : false;
      }
      else {
        found = (fieldInfo && fieldInfo.name === fieldName) ? true : false;
      }
      
      if (found) {
        retVal = fieldInfo;
      }
      
      return found;
    });
    
    return retVal;
  },
  
  _getDateOpts: function() {
    /*
     * Internally used by Graphic::getTitle and 
     * getContent methods
     */
    
    if (!this._dtOpts) {
      var props = dojo.map(
        dojo.filter(this.fields, function(fieldInfo) {
          return !!(fieldInfo && fieldInfo.type === "esriFieldTypeDate");
        }),
        function(fieldInfo) {
          return fieldInfo.name;
        }
      );
      
      // See esri.substitute for this object's spec
      this._dtOpts = { properties: props };
    }

    return this._dtOpts;
  },
  
  _applyNormalized: function(features, normalized) {
    // note: "features" are mutated with "normalized"
    
    if (features && normalized) {
      dojo.forEach(features, function(feature, index) {
        if (feature && normalized[index]) {
          feature.setGeometry(normalized[index]);
        }
      });
    }
  },
  
  _editHandler: function(response, adds, updatesMap, callback, errback, dfd) {
    var addResults = response.addResults, updateResults = response.updateResults, 
        deleteResults = response.deleteResults, i, result, oid, feature,
        attr, oidField = this.objectIdField,
        mode = this._mode, isTable = this._isTable/*, calculate,
        extent, newExtent, dataSR, fullExtent = this.fullExtent,
        extSR = fullExtent && fullExtent.spatialReference*/;
    
    // TODO
    // do not do display related stuff if the FL is not on the map

    var fieldsInfo = this.editFieldsInfo,
        outFields = this._getOutFields() || [],
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        creationDateField = fieldsInfo && fieldsInfo.creationDateField,
        editorField = fieldsInfo && fieldsInfo.editorField,
        editDateField = fieldsInfo && fieldsInfo.editDateField,
        realm = fieldsInfo && fieldsInfo.realm;
    
    // Make sure the editor tracking fields are defined in the layer's outFields config
    // If they are not defined, we don't want to assign time and userId
    // for newly added and updated features
    if (dojo.indexOf(outFields, "*") === -1) {
      if (creatorField && dojo.indexOf(outFields, creatorField) === -1) {
        creatorField = null;
      }

      if (creationDateField && dojo.indexOf(outFields, creationDateField) === -1) {
        creationDateField = null;
      }

      if (editorField && dojo.indexOf(outFields, editorField) === -1) {
        editorField = null;
      }

      if (editDateField && dojo.indexOf(outFields, editDateField) === -1) {
        editDateField = null;
      }
    }

    // Calculate currentTime and userId if required
    var currentTime = (creationDateField || editDateField) ? 
                      (new Date()).getTime() : null,
        userId = (creatorField || editorField) ? 
                 this.getUserId() : undefined;
    
    if (userId && realm) {
      userId = userId + "@" + realm;
      
      // Note that realm will not be appended to anonymous users 
      // (i.e. <empty-string> values) either
    }
    
    if (addResults) {
      /*if (this._collection) {
        dataSR = dojo.getObject("0.geometry.spatialReference", false, adds);

        if ( !extSR || (dataSR && extSR._isEqual(dataSR)) ) {
          console.log("[ calculating extent 2... ]");
          calculate = true;
        }
      }*/
      
      for (i = 0; i < addResults.length; i++) {
        addResults[i] = new esri.layers.FeatureEditResult(addResults[i]);
        if (isTable) {
          continue;
        }
        
        result = addResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = adds[i];
          
          var gl = feature._graphicsLayer;
          if (gl && gl !== this) {
            gl.remove(feature);
          }
          
          // attach the object id returned to the feature
          attr = feature.attributes || {};
          
          attr[oidField] = oid;
          
          if (creatorField) {
            attr[creatorField] = userId;
          }
          
          if (editorField) {
            attr[editorField] = userId;
          }
          
          if (creationDateField) {
            attr[creationDateField] = currentTime;
          }
          
          if (editDateField) {
            attr[editDateField] = currentTime;
          }
          
          feature.setAttributes(attr);
          
          if (mode._init) {
            mode.drawFeature(feature);
          }
          
          // extent calculation
          /*if (calculate) {
            extent = feature.geometry && feature.geometry.getExtent();
            
            if (extent) {
              newExtent = newExtent ? (newExtent.union(extent)) : extent;
            }
          }*/
          
        }
      } // for
      
      /*if (newExtent) {
        this.fullExtent = extSR ? (fullExtent.union(newExtent)) : newExtent;
      }*/
    }
    
    if (updateResults) {
      //var selected = this._selectedFeatures, selSymbol = this._selectionSymbol;
      for (i = 0; i < updateResults.length; i++) {
        updateResults[i] = new esri.layers.FeatureEditResult(updateResults[i]);
        if (isTable) {
          continue;
        }
        
        result = updateResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = updatesMap[oid];
          
          // update geometry - technically we don't have to
          // update because "found" and "feature" should be
          // one and the same 
          var found = mode._getFeature(oid);
          if (found) {
            if (found.geometry !== feature.geometry) {
              found.setGeometry(esri.geometry.fromJson(feature.geometry.toJson()));
            }
            
            /*if (!(oid in selected) || !selSymbol) {
              // trigger repaint
              found.setSymbol(null);
            }*/
            this._repaint(found, oid);
          } // found
          
          feature = found || feature;

          attr = feature.attributes || {};
          
          if (editorField) {
            attr[editorField] = userId;
          }
          
          if (editDateField) {
            attr[editDateField] = currentTime;
          }

          feature.setAttributes(attr);
        }
      } // for
    }
    
    if (deleteResults) {
      var unselected = [];
      for (i = 0; i < deleteResults.length; i++) {
        deleteResults[i] = new esri.layers.FeatureEditResult(deleteResults[i]);
        if (isTable) {
          continue;
        }
        
        result = deleteResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = mode._getFeature(oid);
          if (feature) {
            // unselect
            if (this._unSelectFeatureIIf(oid, mode)) {
              unselected.push(feature);
            }
            
            // force remove
            feature._count = 0;
            mode._removeFeatureIIf(oid);
          } // if feature
        }
      } // for
      
      /*if (this._collection && this.graphics.length === 0) {
        console.log("deleting fullExtent property");
        delete this.fullExtent;
      }*/
      
      if (unselected.length > 0) {
        this.onSelectionComplete(unselected, this.constructor.SELECTION_SUBTRACT);
      }
    }
    
    // disseminate the information
    /*this.onEditsComplete(addResults, updateResults, deleteResults);
    if (callback) {
      callback(addResults, updateResults, deleteResults);
    }*/
    this._resolve([addResults, updateResults, deleteResults], "onEditsComplete", callback, dfd);
  },
  
  _sendAttachment: function(type, objectId, formNode, callback, errback) {
    var operationName = (type === "add") ? "addAttachment" : "updateAttachment",
        url = this._url.path + "/" + objectId + "/" + operationName,
        self = this;

    /*formNode.enctype = "multipart/form-data";
    if (dojo.isIE < 9) {
      // in IE, dynamically setting the value of "enctype" attribute
      // does not seem to take effect
      formNode.encoding = "multipart/form-data";
    }
    formNode.method = "post";
    
    var elements = formNode.elements;
    
    // add "f" if not already in the form
    if ( !dojo.some(elements, function(el) { return el.name === "f"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "f", value: "json" }) );
    }
    
    // add "callback.html" if not already in the form
    if ( !dojo.some(elements, function(el) { return el.name === "callback.html"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "callback.html", value: "textarea" }) );
    }
    
    // add token
    var token = this._getToken();
    if (token && !dojo.some(elements, function(el) { return el.name === "token"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "token", value: token }) );
    }
    
    var dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this,
        _errorFunc = function(error) {
          if (!(error instanceof Error)) {
            error = dojo.mixin(new Error(), error);
          }
          //if (errback) {
            //errback(error);
          //}
          self._resolve([error], null, errback, dfd, true);
        },
        proxy = (esri.config.defaults.io.alwaysUseProxy || !esri._hasSameOrigin(url, window.location.href)) ? 
                esri._getProxyUrl() : 
                null;
    
    dfd._pendingDfd = dojo.io.iframe.send({
      url: (proxy ? (proxy.path + "?") : "") + url + "?callback.html=textarea",
      form: formNode,
      handleAs: "json",
      
      load:  dojo.hitch(this, function(response, io) {
        var error = response.error;
        if (error) {
          _errorFunc(error);
          return;
        }
        
        var propertyName = (type === "add") ? "addAttachmentResult" : "updateAttachmentResult";
        var eventName = (type === "add") ? "onAddAttachmentComplete" : "onUpdateAttachmentComplete";
        
        var result = new esri.layers.FeatureEditResult(response[propertyName]);
        result.attachmentId = result.objectId;
        result.objectId = objectId;
        
        //this[eventName](result);
        //if (callback) {
          //callback(result);
        //}
        
        self._resolve([result], eventName, callback, dfd);
      }), // load handler
      
      error: _errorFunc
    });*/
    
    var dfd = esri.request({
      url: url,
      form: formNode,
      content: dojo.mixin(this._url.query, {f:"json", token: this._getToken() || undefined}),
      callbackParamName: "callback.html",
      handleAs: "json"
    })
    .addCallback(function(response) {
      var propertyName = (type === "add") ? "addAttachmentResult" : "updateAttachmentResult",
          eventName = (type === "add") ? "onAddAttachmentComplete" : "onUpdateAttachmentComplete",
          result = new esri.layers.FeatureEditResult(response[propertyName]);
          
      result.attachmentId = result.objectId;
      result.objectId = objectId;
      
      self._resolve([result], eventName, callback);
      return result;
    })
    .addErrback(function(error) {
      self._resolve([error], null, errback, null, true);
    });
    
    return dfd;
  },
  
  _repaint: function(feature, oid, force) {
    oid = esri._isDefined(oid) ? oid : feature.attributes[this.objectIdField];
    if (!(oid in this._selectedFeatures) || !this._selectionSymbol) {
      // repaint only when:
      // - the feature is not selected, or
      // - the feature is selected but the layer has no selection symbol
      feature.setSymbol(feature.symbol, force);
    }
  },
  
  /***************************
   * Tracking related methods
   ***************************/
  
  _getKind: function(feature) {
    var trackManager = this._trackManager;
    if (trackManager) {
      return trackManager.isLatestObservation(feature) ? 1 : 0;
    }
    return 0;
  }
  
});

// mixin enums for FeatureLayer
dojo.mixin(esri.layers.FeatureLayer, {
  MODE_SNAPSHOT: 0,
  MODE_ONDEMAND: 1,
  MODE_SELECTION: 2,
  SELECTION_NEW: 3,
  SELECTION_ADD: 4,
  SELECTION_SUBTRACT: 5,
  POPUP_NONE: "esriServerHTMLPopupTypeNone",
  POPUP_HTML_TEXT: "esriServerHTMLPopupTypeAsHTMLText",
  POPUP_URL: "esriServerHTMLPopupTypeAsURL"
});

esri._createWrappers("esri.layers.FeatureLayer");

/**************************
 * esri.layers.FeatureType
 **************************/

dojo.declare("esri.layers.FeatureType", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.id = json.id;
      this.name = json.name;

      var symbol = json.symbol;
      
      if (symbol) {
        this.symbol = esri.symbol.fromJson(symbol);
      }
      
      // domains
      var domains = json.domains, field, i;
      var domainObjs = this.domains = {};
      for (field in domains) {
        if (domains.hasOwnProperty(field)) {
          var domain = domains[field];
          switch(domain.type) {
            case "range":
              domainObjs[field] = new esri.layers.RangeDomain(domain);
              break;
            case "codedValue":
              domainObjs[field] = new esri.layers.CodedValueDomain(domain);
              break;
            case "inherited":
              domainObjs[field] = new esri.layers.InheritedDomain(domain);
              break;
          }
        } // if
      }
      
      // templates
      var templates = json.templates;
      if (templates) {
        var templateObjs = this.templates = [];
        for (i = 0; i < templates.length; i++) {
          templateObjs.push(new esri.layers.FeatureTemplate(templates[i]));
        }
      }
      
    } // json
  },
  
  toJson: function() {
    var json = {
      id: this.id,
      name: this.name,
      symbol: this.symbol && this.symbol.toJson()
    };
    
    var field, domains = this.domains, templates = this.templates, sanitize = esri._sanitize;
    if (domains) {
      var newCopy = json.domains = {};
      for (field in domains) {
        if (domains.hasOwnProperty(field)) {
          newCopy[field] = domains[field] && domains[field].toJson();
        }
      }
      sanitize(newCopy);
    }
    if (templates) {
      json.templates = dojo.map(templates, function(template) {
        return template.toJson();
      });
    }
    
    return sanitize(json);
  }
});

/******************************
 * esri.layers.FeatureTemplate
 ******************************/

dojo.declare("esri.layers.FeatureTemplate", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.name = json.name;
      this.description = json.description;
      this.drawingTool = json.drawingTool;
      
      // prototypical feature
      var prototype = json.prototype;
      this.prototype = new esri.Graphic(prototype.geometry, null, prototype.attributes);
    }
  },
  
  toJson: function() {
    return esri._sanitize({
      name: this.name,
      description: this.description,
      drawingTool: this.drawingTool,
      prototype: this.prototype && this.prototype.toJson() 
    });
  }
});

// mixin enums for FeatureTemplate
dojo.mixin(esri.layers.FeatureTemplate, {
  TOOL_AUTO_COMPLETE_POLYGON: "esriFeatureEditToolAutoCompletePolygon",
  TOOL_CIRCLE: "esriFeatureEditToolCircle", // mapped to TOOL_POLYGON
  TOOL_ELLIPSE: "esriFeatureEditToolEllipse", // mapped to TOOL_POLYGON
  TOOL_FREEHAND: "esriFeatureEditToolFreehand",
  TOOL_LINE: "esriFeatureEditToolLine",
  TOOL_NONE: "esriFeatureEditToolNone", // for non-spatial tables; cannot be set for spatial data in ArcMap
  TOOL_POINT: "esriFeatureEditToolPoint",
  TOOL_POLYGON: "esriFeatureEditToolPolygon",
  TOOL_RECTANGLE: "esriFeatureEditToolRectangle",
  TOOL_ARROW: "esriFeatureEditToolArrow",
  TOOL_TRIANGLE: "esriFeatureEditToolTriangle",
  TOOL_LEFT_ARROW: "esriFeatureEditToolLeftArrow",
  TOOL_RIGHT_ARROW: "esriFeatureEditToolRightArrow",
  TOOL_UP_ARROW: "esriFeatureEditToolUpArrow",
  TOOL_DOWN_ARROW: "esriFeatureEditToolDownArrow"
});

/********************************
 * esri.layers.FeatureEditResult
 ********************************/

dojo.declare("esri.layers.FeatureEditResult", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.objectId = json.objectId;
      this.success = json.success;
      if (!json.success) {
        var err = json.error;
        this.error = new Error();
        this.error.code = err.code;
        this.error.message = err.description;
      }
    }
  }
});

/**************************
 * esri.layers._RenderMode
 **************************/

dojo.declare("esri.layers._RenderMode", null, {
  constructor: function() {
    this._prefix = "jsonp_" + (dojo._scopeName || "dojo") + "IoScript";
  },
//  layerInfoHandler: function(layerInfo) {},
  initialize: function(map) {},
  propertyChangeHandler: function(type) {
    /*
     * type = 0 denotes map time extent changed
     * type = 1 denotes layer definition expression changed
     * type = 2 denotes layer time definition changed
     */
  },
  destroy: function() {},
  drawFeature: function(feature) {},
  suspend: function() {},
  resume: function() {},
  refresh: function() {},
  
  _incRefCount: function(oid) {
    var found = this._featureMap[oid];
    if (found) {
      found._count++;
    }
  },
  
  _decRefCount: function(oid) {
    var found = this._featureMap[oid];
    if (found) {
      found._count--;
    }
  },
  
  _getFeature: function(oid) {
    return this._featureMap[oid];
  },
  
  _addFeatureIIf: function(oid, feature) {
    var fmap = this._featureMap, found = fmap[oid], layer = this.featureLayer; //, template = layer._infoTemplate;
    if (!found) {
      fmap[oid] = feature;
      /*if (template) {
        feature.setInfoTemplate(template);
      }*/
      layer._add(feature);
      feature._count = 0;
    }
    return found || feature;
  },
  
  _removeFeatureIIf: function(oid) {
    var found = this._featureMap[oid], layer = this.featureLayer;
    if (found) {
      if (found._count) {
        return;
      }
      delete this._featureMap[oid];
      layer._remove(found); 
    }
    return found;
  },
  
  _clearIIf: function() {
    var i, layer = this.featureLayer, graphics = layer.graphics, 
        selected = layer._selectedFeatures, oidField = layer.objectIdField;
        
    for (i = graphics.length - 1; i >= 0; i--) {
      var feature = graphics[i];
      var oid = feature.attributes[oidField];
      if (oid in selected) {
        feature._count = 1;
        continue;
      }
      feature._count = 0;
      this._removeFeatureIIf(oid);
    }
  },
  
//  _fireUpdateStart: function() {
//    if (this._started) {
//      return;
//    }
//    this._started = true;
//    this.featureLayer.onUpdateStart();
//  },
//  
//  _fireUpdateEnd: function() {
//    this._started = false;
//    this.featureLayer.onUpdateEnd();
//  },
  
  _isPending: function(id) {
    var dfd = dojo.io.script[this._prefix + id]; // see dojo.io.script._makeScriptDeferred
    return dfd ? true : false;
  },
  
  // Methods to make ETags useful
  _cancelPendingRequest: function(dfd, id) {
    dfd = dfd || dojo.io.script[this._prefix + id]; // see dojo.io.script._makeScriptDeferred
    if (dfd) {
      try {
        dfd.cancel(); // call ends up at dojo.io.script._deferredCancel
        dojo.io.script._validCheck(dfd);
        //console.info(dfd.startTime, dfd.canceled, dfd);
      }
      catch(e) {}
    }
  },
  
  _purgeRequests: function() {
    // The first argument is not used in this method
    dojo.io.script._validCheck(null);
  },

  _toggleVisibility: function(/*Boolean*/ show) {
    var layer = this.featureLayer, graphics = layer.graphics, 
        methodName = show ? "show" : "hide", i, len = graphics.length;
    
    show = show && layer._ager; // show morphs here
    for (i = 0; i < len; i++) {
      var graphic = graphics[i];
      graphic[methodName]();
      if (show) {
        layer._repaint(graphic);
      }
    }
  },

  _applyTimeFilter: function(silent) {
    // Display only features that belong in the intersection of
    // snapshot time definition and map time extent
    
    var layer = this.featureLayer;
    if (!layer.timeInfo || layer._suspended) {
      // layer is not time aware
      return;
    }
    
    if (!silent) {
      layer._fireUpdateStart();
    }
    
    // clear all the track lines
    var trackManager = layer._trackManager;
    if (trackManager) {
      trackManager.clearTracks();
    }
     
    var defn = layer.getTimeDefinition(), timeExtent = layer._getOffsettedTE(layer._mapTimeExtent);
    if (timeExtent) {
      timeExtent = layer._getTimeOverlap(defn, timeExtent);
      if (timeExtent) { // there is overlap, do filter
        //console.log("Snapshot Client Filter ", "query.timeExtent: ", timeExtent.startTime, ", ", timeExtent.endTime);
        var result = layer._filterByTime(layer.graphics, timeExtent.startTime, timeExtent.endTime);
    
        if (trackManager) {
          trackManager.addFeatures(result.match);
        }
        dojo.forEach(result.match, function(graphic) {
          var shape = graphic._shape;
          if (!graphic.visible) {
            graphic.show();
            shape = graphic._shape;
            shape && shape._moveToFront();
          }
          if (layer._ager && shape) {
            layer._repaint(graphic);
          }
        });
        
        dojo.forEach(result.noMatch, function(graphic) {
          if (graphic.visible) {
            graphic.hide();
          }
        });
      }
      else { // there is no overlap, so hide everything
        this._toggleVisibility(false);
      }
    }
    else { // map time extent is set to null
      if (trackManager) {
        trackManager.addFeatures(layer.graphics);
      }
      this._toggleVisibility(true);
    }
    
    // draw track lines corresponding to the observations
    if (trackManager) {
      trackManager.moveLatestToFront();
      trackManager.drawTracks();
    }
    
    if (!silent) {
      layer._fireUpdateEnd();
    }
  }
});

/*****************************
 * esri.layers._SelectionMode
 *****************************/

dojo.declare("esri.layers._SelectionMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'selection only' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },

  initialize: function(map) {
    this.map = map;
    this._init = true;
  },

  propertyChangeHandler: function(type) {
    if (this._init && type === 0) {
      // map time extent changed
      this._applyTimeFilter();
    }
  },

  destroy: function() {
    this._init = false;
  },
  
  resume: function() {
    this.propertyChangeHandler(0);
  }
});

/****************************
 * esri.layers._SnapshotMode
 ****************************/

dojo.declare("esri.layers._SnapshotMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'snapshot' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
    this._drawFeatures = dojo.hitch(this, this._drawFeatures);
    this._queryErrorHandler = dojo.hitch(this, this._queryErrorHandler);
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },

  initialize: function(map) {
    this.map = map;
    var layer = this.featureLayer;
    if (layer._collection) {
      /*layer._fireUpdateStart();
      
      // create and assign unique ids for features 
      var featureSet = layer._featureSet;
      delete layer._featureSet;
      
      this._drawFeatures(new esri.tasks.FeatureSet(featureSet));
      layer._fcAdded = true;*/
     
      this._applyTimeFilter();
    }
    else {
      this._fetchAll();
    }
    this._init = true;
  },

  propertyChangeHandler: function(type) {
    if (this._init) {
      if (type) {
        this._fetchAll();
      }
      else { // map time extent changed
        this._applyTimeFilter();
      }
    }
  },

  destroy: function() {
    this._init = false;
  },
  
  drawFeature: function(feature) {
    var layer = this.featureLayer, oidField = layer.objectIdField, oid = feature.attributes[oidField];
    //if (!layer._isDeleted(feature)) {
      this._addFeatureIIf(oid, feature);
      this._incRefCount(oid);
    //}
  },
  
  resume: function() {
    this.propertyChangeHandler(0);
  },
  
  refresh: function() {
    var layer = this.featureLayer;
    
    if (layer._collection) {
      layer._fireUpdateStart();
      layer._refresh(true);
      layer._fireUpdateEnd();
    }
    else {
      this._fetchAll();
    }
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _getRequestId: function(layer) {
    var id = "_" + layer.name + layer.layerId + layer._ulid;
    return id.replace(/[^a-zA-Z0-9\_]+/g, "_"); // cannot have hyphens in callback function names
  },
  
  _fetchAll: function() {
    var layer = this.featureLayer;
    if (layer._collection) {
      return;
    }

    layer._fireUpdateStart();
    this._clearIIf();
    this._sendRequest();
  },
  
  _sendRequest: function() {
    //console.log("fetching...");
    var map = this.map, layer = this.featureLayer, defExpr = layer.getDefinitionExpression();
    
    var query = new esri.tasks.Query();
    query.outFields = layer._getOutFields();
    query.where = defExpr || "1=1";
    query.returnGeometry = true;
    query.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
    query.timeExtent = layer.getTimeDefinition();
    //query.timeExtent && console.log("Snapshot ", "query.timeExtent: ", query.timeExtent.startTime, ", ", query.timeExtent.endTime);
    query.maxAllowableOffset = layer._maxOffset;
    if (layer._ts) {
      query._ts = (new Date()).getTime();
    }

    var callbackSuffix;
    if (layer._usePatch) {
      // get an id for this request
      callbackSuffix = this._getRequestId(layer);

      // cancel the previous request of the same kind
      this._cancelPendingRequest(null, callbackSuffix);
    }
  
    layer._task.execute(query, this._drawFeatures, this._queryErrorHandler, callbackSuffix);
  },
    
  _drawFeatures: function(response) {
    //console.log("drawing");
    this._purgeRequests();

    var features = response.features, layer = this.featureLayer, 
        oidField = layer.objectIdField, i, len = features.length,
        feature, oid/*, newExtent, extent, calculate*/;
    
    /*if (layer._collection) {
      var extSR = layer.fullExtent && layer.fullExtent.spatialReference;
      
      if (!extSR) {
        console.log("[ calculating extent... ]");
        calculate = true;
      }
    }*/
    
    // add features to the map
    for (i = 0; i < len; i++) {
      feature = features[i];
      oid = feature.attributes[oidField];
      //if (!layer._isDeleted(feature)) {
        this._addFeatureIIf(oid, feature);
        this._incRefCount(oid);
      //}
      
      /*if (calculate) {
        extent = feature.geometry && feature.geometry.getExtent();
        
        if (extent) {
          newExtent = newExtent ? (newExtent.union(extent)) : extent;
        }
      }*/
    }
    
    /*if (newExtent) {
      layer.fullExtent = newExtent;
    }*/
    
    // process and apply map time extent
    this._applyTimeFilter(true);
    
    layer._fireUpdateEnd(null, response.exceededTransferLimit ? { queryLimitExceeded: true } : null);
    
    if (response.exceededTransferLimit) {
      layer.onQueryLimitExceeded();
    }
  },
  
  _queryErrorHandler: function(err) {
    //console.log("query error! ", err);
    
    this._purgeRequests();
    
    var layer = this.featureLayer;
    layer._errorHandler(err);
    layer._fireUpdateEnd(err);
  }
  
});

/****************************
 * esri.layers._OnDemandMode
 ****************************/

dojo.declare("esri.layers._OnDemandMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'on-demand' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
    this._queryErrorHandler = dojo.hitch(this, this._queryErrorHandler);
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },
  
  initialize: function(map) {
    this.map = map;
    this._initialize();
    this._init = true;
  },
  
  propertyChangeHandler: function(type) {
    if (this._init) {
      if (type < 2) {
        this._zoomHandler();
      }
      // On-demand mode is not affected by time definition (type = 2)?
    }
  },
  
  destroy: function() {
    this._disableConnectors();
    this._init = false;
  },
  
  drawFeature: function(feature) {
    // find the cells touching the feature
    var gridLayer = this._gridLayer, geom = feature.geometry, cells = [];

    if (!geom) {
      return;
    }
    
    cells = gridLayer.getCellsInExtent(
      (geom.type === "point") ?
       { xmin: geom.x, ymin: geom.y, xmax: geom.x, ymax: geom.y } :
       geom.getExtent(),
       false
    ).cells;
    
    //console.log("cells = ", cells);
    
    // add and set ref-count based on the #cells this feature intersects
    var cellMap = this._cellMap, i, cell,
        oid = feature.attributes[this.featureLayer.objectIdField],
        cLatticeID, row, col;
    
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      cLatticeID = cell.latticeID;
      row = cell.row;
      col = cell.col;
      
      if (cLatticeID) {
        cell = (cellMap[cLatticeID] = (cellMap[cLatticeID] || cell));
      }
      else {
        cellMap[row] = cellMap[row] || {};
        cell = (cellMap[row][col] = (cellMap[row][col] || cell));
      }
      
      cell.features = cell.features || [];
      cell.features.push(feature);
      
      this._addFeatureIIf(oid, feature);
      this._incRefCount(oid);
    }
  },
  
  suspend: function() {
    if (!this._init) {
      return;
    }
    this._disableConnectors();
  },
  
  resume: function() {
    if (!this._init) {
      return;
    }
    this._enableConnectors();
    this._zoomHandler();
  },
  
  refresh: function() {
    this._zoomHandler();
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _initialize: function() {
    var map = this.map, layer = this.featureLayer;
    
    // Set -180 as the grid layout origin
    // NOTE: _wrap and _srInfo are defined by _GraphicsLayer::_setMap
    var srInfo = /*layer._wrap &&*/ layer._srInfo;
    
    this._gridLayer = new esri.layers._GridLayout(
//      map.extent.getCenter(),
      new esri.geometry.Point(srInfo ? srInfo.valid[0] : map.extent.xmin, map.extent.ymax, map.spatialReference),
      { width: layer._tileWidth, height: layer._tileHeight }, 
      { width: map.width, height: map.height },
      srInfo
    );
  
    this._ioQueue = [];
    if (!layer._suspended) {
      this._zoomHandler();
      this._enableConnectors();
    }
  },
  
  _enableConnectors: function() {
    var map = this.map;
    this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._zoomHandler);
    this._panConnect = dojo.connect(map, "onPanEnd", this, this._panHandler);
    this._resizeConnect = dojo.connect(map, "onResize", this, this._panHandler);
  },
  
  _disableConnectors: function() {
    dojo.disconnect(this._zoomConnect);
    dojo.disconnect(this._panConnect);
    dojo.disconnect(this._resizeConnect);
  },
    
  _zoomHandler: function() {
    this._processIOQueue(true);
    var layer = this.featureLayer, map = this.map;
    
    // we need to do this check here because even though
    // this zoom handler is disconnected on suspend, the handler
    // is still called one last time. Reason: suspension also happens in one of 
    // the zoom end listeners and this handler is not removed (in practice) from the
    // list of listeners that dojo maintains as part of connect-disconnect
    // infrastructure (the zoom end callback sequence has already started)
    // Perhaps, we can remove this check when ondemand uses "onExtentChange"
    // instead of "onZoomEnd"
    if (layer._suspended) {
      return;
    }
    
    /*if (layer._autoGeneralize) {
      layer._maxOffset = Math.floor(map.extent.getWidth() / map.width);
    }*/

    layer._fireUpdateStart();
    this._clearIIf();
    var trackManager = layer._trackManager;
    if (trackManager) {
      trackManager.clearTracks();
    }

    this._cellMap = {};
    this._gridLayer.setResolution(map.extent);
    
    this._sendRequest();
  },
    
  _panHandler: function() {
    this.featureLayer._fireUpdateStart();
    this._sendRequest(this.featureLayer._resized && arguments[0]);
  },
  
  _getRequestId: function(layer, cell) {
    var id = "_" + layer.name + layer.layerId + layer._ulid + "_" + cell.resolution + "_" + 
             (cell.latticeID || (cell.row + "_" +  cell.col));
    
    return id.replace(/[^a-zA-Z0-9\_]+/g, "_"); // cannot have hyphens in callback function names
  },
  
  _sendRequest: function(resized) {
    //console.log("fetching...");
    this._exceeds = false;
    
    var layer = this.featureLayer, map = this.map, extent = resized || map.extent,
        gridInfo = this._gridLayer.getCellsInExtent(extent, layer.latticeTiling), 
        cells = gridInfo.cells;
    
    //console.log(gridInfo.minRow, gridInfo.maxRow, gridInfo.minCol, gridInfo.maxCol);
    
//    // debug
//    this._debugClear();
//    this._debugInfo(cells);

    if (!layer.isEditable()) {
      // filter out the cells that already have content (optimization for non-editable layers)
      var cellMap = this._cellMap;
      cells = dojo.filter(cells, function(cell) {
        // cell map lookup
        if (cell.lattice) {
          if (cellMap[cell.latticeID]) {
            return false;
          }
        }
        else if (cellMap[cell.row] && cellMap[cell.row][cell.col]) {
          return false;
        }
        return true;
      });
    }

    var fields = layer._getOutFields(),
        where = layer.getDefinitionExpression(),
        time = layer._getOffsettedTE(layer._mapTimeExtent),
        patch = layer._usePatch, ioQueue = this._ioQueue, i,
        self = this, func = this._drawFeatures, cell, query, callbackSuffix;
    //time && console.log("OnDemand ", "query.timeExtent: ", time.startTime, ", ", time.endTime);
    
    // send requests
    //this._pending = cells.length;
    this._pending = this._pending || 0;
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      
      // query
      query = new esri.tasks.Query();
      query.geometry = cell.extent || cell.lattice;
      query.outFields = fields;
      query.where = where;
      if (layer.latticeTiling && cell.extent) {
        query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
      }
      query.returnGeometry = true;
      query.timeExtent = time;
      query.maxAllowableOffset = layer._maxOffset;
      if (layer._ts) {
        query._ts = (new Date()).getTime();
      }
      
      callbackSuffix = null;
      if (patch) {
        // callback suffix
        callbackSuffix = this._getRequestId(layer, cell);
        
        // cancel the previous request for the given zoom level, row, col
        //this._cancelPendingRequest(callbackSuffix);
        
        if (this._isPending(callbackSuffix)) {
          continue;
        }
      }
    
      // execute
      //console.log("requesting for cell: ", cell.row, cell.col);
      this._pending++;
      ioQueue.push(layer._task.execute(query, function() {
        var cellInfo = cell;
        return function(response) { // callback
          func.apply(self, [ response, cellInfo ]);
        };
      }.call(this), this._queryErrorHandler, callbackSuffix));
    } // loop
    
    //console.log("pending = ", this._pending, ioQueue);
    this._removeOldCells(extent);
    this._endCheck();
  },
    
  _drawFeatures: function(response, cell) {
    //console.log("drawing " + cell.row + ", " + cell.col + "," + cell.resolution);
    this._exceeds = this._exceeds || response.exceededTransferLimit;
    this._finalizeIO();
    
    var layer = this.featureLayer, map = this.map, mExtent = map.extent, 
        cExtent = cell.extent, row = cell.row, col = cell.col, 
        oidField = layer.objectIdField,
        features = response.features, gridLayer = this._gridLayer,
        // lookup cell map
        cellMap = this._cellMap, i, len,
        cLatticeID = cell.latticeID,
        found = cLatticeID ? cellMap[cLatticeID] : (cellMap[row] && cellMap[row][col]);
    
    // don't add the cell if it does not intersect the current map extent or does not belong to this level
    if ( 
      (cell.resolution != gridLayer._resolution) || 
      ( 
        cLatticeID ? 
        (cLatticeID !== gridLayer.getLatticeID(mExtent)) : 
        (!gridLayer.intersects(cExtent, mExtent)) 
      )
    ) {
      if (found) {
        this._removeCell(row, col, cLatticeID);
      }
    }
    // already displayed, update it
    else if (found) {
      // update existing cell with new features
      this._updateCell(found, features);
    }
    else {
      // record
      cell.features = features;
      
      if (cLatticeID) {
        cellMap[cLatticeID] = cell;
      }
      else {
        cellMap[row] = cellMap[row] || {};
        cellMap[row][col] = cell;
      }
      
      len = features.length;
      
      // add features to the map
      for (i = 0; i < len; i++) {
        var feature = features[i];
        var oid = feature.attributes[oidField];
        
        //if (!layer._isDeleted(feature)) {
          this._addFeatureIIf(oid, feature);
          this._incRefCount(oid);
        //}
        //console.log(" [count] ", feature.attributes["STATE_NAME"], fmap[oid]._count);
      } // loop
    }
    
    // Be careful when adding code here! Consider branching above.

    // finalize the request    
    this._endCheck();
  },
  
  _queryErrorHandler: function(err) {
    //console.log("query error! ", err);
    
    this._finalizeIO();
    this.featureLayer._errorHandler(err);
    this._endCheck(true);
  },
  
  _finalizeIO: function() {
    this._purgeRequests();
    this._pending--;
  },
  
  _endCheck: function(isError) {
    if (this._pending === 0) {
      this._processIOQueue();
      
      // tracking functionality
      var layer = this.featureLayer, trackManager = layer._trackManager;
      if (trackManager) {
        trackManager.clearTracks();
        trackManager.addFeatures(layer.graphics);
        if (layer._ager) {
          dojo.forEach(layer.graphics, function(graphic) {
            if (graphic._shape) {
              layer._repaint(graphic);
            }
          });
        }
        trackManager.moveLatestToFront();
        trackManager.drawTracks();
      }
      
      this.featureLayer._fireUpdateEnd(
        isError && new Error("FeatureLayer: " + esri.bundle.layers.FeatureLayer.updateError),
        this._exceeds ? { queryLimitExceeded: true } : null
      );
      
      if (this._exceeds) {
        layer.onQueryLimitExceeded();
      }
    }
  },
  
  _processIOQueue: function(cancel) {
    this._ioQueue = dojo.filter(this._ioQueue, function(dfd) {
      var keep = dfd.fired > -1 ? /*success or error*/ false : /*initial condition*/ true;
      return keep;
    });
    
    if (cancel) {
      dojo.forEach(this._ioQueue, this._cancelPendingRequest);
    }
  },
  
  _removeOldCells: function(extent) {
    var cellMap = this._cellMap, gridLayer = this._gridLayer, rowNum, colNum;
    
    for (rowNum in cellMap) {
      if (cellMap[rowNum]) { // can be a rowNum or latticeID
        var row = cellMap[rowNum],
            cLatticeID = row.latticeID,
            count = 0, removed = 0;
        
        if (cLatticeID) { // lattice entry
          count++;
          if (cLatticeID !== gridLayer.getLatticeID(extent)) {
            this._removeCell(null, null, cLatticeID);
            removed++;
          }
        }
        else { // regular row/col entry
          for (colNum in row) {
            if (row[colNum]) {
              count++;
              var cExtent = row[colNum].extent;
              //if (!cExtent.intersects(extent)) { // remove the cell if it does not intersect the given extent
              if (!gridLayer.intersects(cExtent, extent)) {
                //console.log("[removing old cell] ", rowNum, colNum);
                this._removeCell(rowNum, colNum);
                removed++;
              } // does not intersect
            }
          } // cols
        }
        
        if (removed === count) { // empty row
          delete cellMap[rowNum];
        }
      }
    } // rows
  },
  
  _updateCell: function(cell, latestFeatures) {
    //console.log("_updateCell");
    var layer = this.featureLayer, oidField = layer.objectIdField, selected = layer._selectedFeatures,
        i, len = latestFeatures.length;
    
    cell.features = cell.features || [];
    
    for (i = 0; i < len; i++) {
      var feature = latestFeatures[i];
      var oid = feature.attributes[oidField];
      
      var found = this._addFeatureIIf(oid, feature);
      if (found === feature) { // this feature is a new member of the cell
        this._incRefCount(oid);
        cell.features.push(found);
      }
      else { // update the existing feature (geometry and attributes) if not selected
        if (!(oid in selected)) {
          found.setGeometry(feature.geometry);
          found.setAttributes(feature.attributes);
        }
      }
    } // for loop
  },
    
  _removeCell: function(row, col, cLatticeID) {
    var cellMap = this._cellMap, layer = this.featureLayer, oidField = layer.objectIdField;
    var cell = cLatticeID ? cellMap[cLatticeID] : (cellMap[row] && cellMap[row][col]);

    if (cell) {
      // delete cell map 
      if (cLatticeID) {
        delete cellMap[cLatticeID];
      }
      else {
        delete cellMap[row][col];
      }

      // remove cell's features
      var features = cell.features, i;
      for (i = 0; i < features.length; i++) {
        var feature = features[i];
        var oid = feature.attributes[oidField];
        //console.log("- attempting ", oid, feature.attributes["STATE_NAME"], row, col);
        this._decRefCount(oid);
        if (oid in layer._selectedFeatures) { // this may not be needed after all because we are ref-counting the selection.
          continue; // do not remove if this feature is currently selected. DON'T BREAK THE CONTRACT
        }
        this._removeFeatureIIf(oid);
        //console.log("--- removing ", oid, feature.attributes["STATE_NAME"], row, col);
      }
    } // if
  }//,
    
  /*************************
   * For debugging purposes
   *************************/
  
  /*_debugClear: function() {
    var gs = this._cellExtentGraphics, i;
    if (gs) {
      for (i = 0; i < gs.length; i++) {
        this.map.graphics.remove(gs[i]);
      }
      this._cellExtentGraphics = null;
    }
  },
  
  _debugInfo: function(cells) {
    // draw the cell extents
    var outline = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0, 1]), 1),
        i, symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, outline, new dojo.Color([0, 0, 0, 0.25]));
    
    this._cellExtentGraphics = [];
    for (i = 0; i < cells.length; i++) {
      var polygon = this._extentToPolygon(this._gridLayer.getCellExtent(cells[i].row, cells[i].col));
      var graphic = new esri.Graphic(polygon, symbol);
      this.map.graphics.add(graphic);
      this._cellExtentGraphics.push(graphic);
    }
  },

  _extentToPolygon: function(extent) {
    //console.log("_extentToPolygon");
    var xmin = extent.xmin, ymin = extent.ymin, xmax = extent.xmax, ymax = extent.ymax;
    return new esri.geometry.Polygon({
      "rings": [
        [ [ xmin, ymin ], [ xmin, ymax ], [ xmax, ymax ], [ xmax, ymin ], [ xmin, ymin ] ]
      ],
      "spatialReference": extent.spatialReference.toJson()
    });
  }*/
});


/**************************
 * esri.layers._GridLayout
 **************************/

dojo.declare("esri.layers._GridLayout", null, {
  /*
   * cellSize = { width: <Number>, height: <Number> }
   * mapSize  = { width: <Number>, height: <Number> }
   */
  constructor: function(origin, cellSize, mapSize, srInfo) {
    this.origin = origin;
    this.cellWidth = cellSize.width;
    this.cellHeight = cellSize.height;
    this.mapWidth = mapSize.width;
    this.mapHeight = mapSize.height;
    this.srInfo = srInfo; // map wrapping is enabled and sr is wrappable
  },
  
  /*****************
   * Public Methods
   *****************/
  
  setResolution: function(mapExtent) {
    this._resolution = (mapExtent.xmax - mapExtent.xmin) / this.mapWidth;

    if (this.srInfo) {
      // Logic borrowed from tiled layer
      var pixelsCoveringWorld = Math.round((2 * this.srInfo.valid[1]) / this._resolution),
          numTiles = Math.round(pixelsCoveringWorld / this.cellWidth);
      
      this._frameStats = [ 
        /* #tiles */ numTiles, 
        /* -180 */ 0, 
        /* +180 */ numTiles - 1 
      ];
    }
  },
  
  getCellCoordinates: function(point) {
    //console.log("getCellCoordinates");
    var res = this._resolution,
        origin = this.origin;
    return {
      row: Math.floor((origin.y - point.y) / (this.cellHeight * res)),
      col: Math.floor((point.x - origin.x) / (this.cellWidth * res))
    };
  },
  
  normalize: function(col) {
    var frameStats = this._frameStats;
    if (frameStats) {
      // Logic borrowed from tiled layer
      var total_cols = frameStats[0], m180 = frameStats[1], p180 = frameStats[2];

      if (col < m180) {
        /*while (col < m180) {
          col += total_cols;
        }*/
        col = col % total_cols;
        col = col < m180 ? col + total_cols : col;
      }
      else if (col > p180) {
        /*while (col > p180) {
          col -= total_cols;
        }*/
        col = col % total_cols;
      }
    }
    
    return col;
  },
  
  intersects: function(cExtent, mExtent) {
    // cExtent assumed to be normalized already
    // and does not span across dateline
    
    var srInfo = this.srInfo;
    if (srInfo) {
      return dojo.some(mExtent._getParts(srInfo), function(mePart) {
        return cExtent.intersects(mePart.extent);
      });
    }
    else {
      return cExtent.intersects(mExtent);
    }
  },
  
  getCellExtent: function(row, col) {
    //console.log("getCellExtent");
    var res = this._resolution,
        origin = this.origin,
        cellWidth = this.cellWidth,
        cellHeight = this.cellHeight;
        
    return new esri.geometry.Extent(
      (col * cellWidth * res) + origin.x,
      origin.y - ( (row + 1) * cellHeight * res),
      ( (col + 1) * cellWidth * res) + origin.x,
      origin.y - (row * cellHeight * res),
      new esri.SpatialReference(origin.spatialReference.toJson())
    );
  },
  
  getLatticeID: function(mExtent) {
    var topLeftCoord = this.getCellCoordinates({ x: mExtent.xmin, y: mExtent.ymax }),
        bottomRightCoord = this.getCellCoordinates({ x: mExtent.xmax, y: mExtent.ymin }),
        minRow = topLeftCoord.row, 
        maxRow = bottomRightCoord.row,
        minCol = this.normalize(topLeftCoord.col), 
        maxCol = this.normalize(bottomRightCoord.col);
        
    return minRow + "_" + maxRow + "_" + minCol + "_" + maxCol;
  },
  
  sorter: function(a, b) {
    return (a < b) ? -1 : 1;
  },
  
  getCellsInExtent: function(extent, needLattice) {
    //console.log("getCellsInExtent");
    var topLeftCoord = this.getCellCoordinates({ x: extent.xmin, y: extent.ymax }),
        bottomRightCoord = this.getCellCoordinates({ x: extent.xmax, y: extent.ymin }),
        minRow = topLeftCoord.row, maxRow = bottomRightCoord.row,
        minCol = topLeftCoord.col, maxCol = bottomRightCoord.col,
        cells = [], i, j, nj, xcoords = [], ycoords = [], 
        len, xmin, xmax, ymin, ymax, paths = [], lattice, latticeID;
        
    for (i = minRow; i <= maxRow; i++) {
      for (j = minCol; j <= maxCol; j++) {
        nj = this.normalize(j);
        extent = this.getCellExtent(i, nj);
        
        cells.push({ 
          row: i, col: nj, 
          extent: extent, 
          resolution: this._resolution 
        });
        
        if (needLattice) {
          xcoords.push(extent.xmin, extent.xmax);
          ycoords.push(extent.ymin, extent.ymax);
        }
      }
    }
    //console.log(cells);
    
    minCol = this.normalize(minCol);
    maxCol = this.normalize(maxCol);
    
    // create a unique lost of x-coordinatesd and y-coordinates
    xcoords.sort(this.sorter);
    ycoords.sort(this.sorter);
    
    len = xcoords.length;
    for (i = len - 1; i >= 0; i--) {
      if (i < (len - 1)) {
        if (xcoords[i] === xcoords[i + 1]) {
          xcoords.splice(i, 1);
        }
      }
    }
    
    len = ycoords.length;
    for (i = len - 1; i >= 0; i--) {
      if (i < (len - 1)) {
        if (ycoords[i] === ycoords[i + 1]) {
          ycoords.splice(i, 1);
        }
      }
    }
    //console.log(xcoords, ycoords);
    
    // create the lattice
    if (xcoords.length && ycoords.length) {
      xmin = xcoords[0];
      xmax = xcoords[xcoords.length - 1];
      ymin = ycoords[0];
      ymax = ycoords[ycoords.length - 1];
      //console.log(xmin, xmax, ymin, ymax);
  
      len = xcoords.length;
      for (i = 0; i < len; i++) {
        // a line from ymax to ymin at this x-coordinate
        paths.push([ 
          [xcoords[i], ymax],
          [xcoords[i], ymin]
        ]);
      }
  
      len = ycoords.length;
      for (i = 0; i < len; i++) {
        // a line from xmin to xmax at this y-coordinate
        paths.push([
          [xmin, ycoords[i]],
          [xmax, ycoords[i]]
        ]);
      }
      
      lattice = new esri.geometry.Polyline({
        paths: paths,
        spatialReference: this.origin.spatialReference.toJson()
      });

      latticeID = minRow + "_" + maxRow + "_" + minCol + "_" + maxCol;
      
      //console.log("lattice = ", paths.length, dojo.toJson(lattice.toJson()));
      //console.log("key = " + latticeID);
      
      cells.push({
        latticeID: latticeID,
        lattice: lattice, // a polyline
        resolution: this._resolution
      });
    }
    
    return {
      minRow: minRow,
      maxRow: maxRow,
      minCol: minCol,
      maxCol: maxCol,
      cells: cells
    }; // cellInfo
  }
});

  
/****************************
 * esri.layers._TrackManager
 ****************************/

dojo.declare("esri.layers._TrackManager", null, {
  constructor: function(layer) {
    this.layer = layer;
    this.trackMap = {};
  },
  
  initialize: function(map) {
    this.map = map;
    
    var layer = this.layer, trackRenderer = layer.renderer.trackRenderer;
    if (trackRenderer && (layer.geometryType === "esriGeometryPoint")) {
      // TODO
      // Investigate the feasibility of doing this using a 
      // GroupElement or GroupGraphic that can be added to 
      // a graphics layer
      
      var container = (this.container = new esri.layers._GraphicsLayer({ 
        id: layer.id + "_tracks",
        _child: true 
      }));
      
      //container._onPanHandler = function() {}; // we don't want "translate" applied twice on pan
      container._setMap(map, layer._div);
      container.setRenderer(trackRenderer);
    }
  },
  
  addFeatures: function(features) {
    var tkid, trackMap = this.trackMap, layer = this.layer, tkidField = layer._trackIdField;
    
    // create a list of all the tracks and their corresponding features
    dojo.forEach(features, function(feature) {
      var attributes = feature.attributes; 
      tkid = attributes[tkidField];
      var ary = (trackMap[tkid] = (trackMap[tkid] || []));
      ary.push(feature);
    });

    // sort features in each track from oldest to newest
    var timeField = layer._startTimeField, oidField = layer.objectIdField;
    
    var sorter = function(a, b) {
      var time1 = a.attributes[timeField], time2 = b.attributes[timeField];
      if (time1 === time2) {
        // See:
        // http://code.google.com/p/v8/issues/detail?id=324
        // http://code.google.com/p/v8/issues/detail?id=90
        return (a.attributes[oidField] < b.attributes[oidField]) ? -1 : 1;
      }
      else {
        return (time1 < time2) ? -1 : 1;
      }
    };
    
    for (tkid in trackMap) {
      trackMap[tkid].sort(sorter);
      
      /*var ary = trackMap[tkid];
      ary.sort(function(a, b){
        var time1 = a.attributes[timeField], time2 = b.attributes[timeField];
        if (time1 === time2) {
          // See:
          // http://code.google.com/p/v8/issues/detail?id=324
          // http://code.google.com/p/v8/issues/detail?id=90
          return (a.attributes[oidField] < b.attributes[oidField]) ? -1 : 1;
        }
        else {
          return (time1 < time2) ? -1 : 1;
        }

//        if (time1 < time2) {
//          return -1;
//        }
//        if (time1 >= time2) {
//          return 1;
//        }
//        return 0;
      });*/
      
//      if (latestRendering) {
//        layer._repaint(ary[ary.length - 1]);
//      }
    }
  },
  
  drawTracks: function() {
    var container = this.container;
    if (!container) {
      return;
    }
    
    var trackMap = this.trackMap, sr = this.map.spatialReference,
        tkid, ary, path, i, point, tkidField = this.layer._trackIdField,
        attrs;
    
    /*var mapper = function(feature) {
      var point = feature.geometry;
      return [point.x, point.y];
    };*/
    
    // draw track lines
    for (tkid in trackMap) {
      // create polyline representing a track and add it to the container
      //var path = dojo.map(trackMap[tkid], mapper);
      ary = trackMap[tkid];
      path = [];
      
      for (i = ary.length - 1; i >=0 ; i--) {
        point = ary[i].geometry;
        
        if (point) {
          path.push([ point.x, point.y ]);
        }
      }
      
      attrs = {};
      attrs[tkidField] = tkid;
      
      if (path.length > 0) {
        container.add(
          new esri.Graphic(
            new esri.geometry.Polyline({ paths: [path], spatialReference: sr }),
            null,
            attrs
          )
        );
      }
    }
  },
  
  moveLatestToFront: function() {
    /*var layer = this.layer;
    if (!layer.renderer.latestObservationRenderer) {
      return;
    }
    
    var trackMap = this.trackMap;
    
    for (var tkid in trackMap) {
      var ary = trackMap[tkid];
      var graphic = ary[ary.length - 1], shape = graphic._shape;
      shape && shape._moveToFront();
      layer._repaint(graphic);
    }*/

    dojo.forEach(this.getLatestObservations(), function(graphic) {
      var shape = graphic._shape;
      shape && shape._moveToFront();
      this._repaint(graphic, null, true);
    }, this.layer);
  },
  
  getLatestObservations: function() {
    var retVal = [];
    if (!this.layer.renderer.latestObservationRenderer) {
      return retVal;
    }
    
    var trackMap = this.trackMap, tkid;
    
    for (tkid in trackMap) {
      var ary = trackMap[tkid];
      retVal.push(ary[ary.length - 1]);
    }
    
    return retVal;
  },
  
  clearTracks: function() {
    var latest = this.getLatestObservations();
    
    this.trackMap = {};
    var container = this.container;
    if (container) {
      container.clear();
    }
    
    dojo.forEach(latest, function(graphic) {
      this._repaint(graphic, null, true);
    }, this.layer);
  },
  
  isLatestObservation: function(feature) {
    var tkidField = this.layer._trackIdField;
    var track = this.trackMap[feature.attributes[tkidField]];
    if (track) {
      return (track[track.length - 1] === feature); 
    }
    return false;
  },
  
  destroy: function() {
    var container = this.container;
    if (container) {
      container.clear();
      container._unsetMap(this.map, this.layer._div);
      this.container = null;
    }
    this.map = null;
    this.layer = null;
    this.trackMap = null;
  }
});

});

},
'*noref':1}});

require(["dojo/i18n"], function(i18n){
i18n._preloadLocalizations("esri/dijit/nls/AttributeInspector-all", ["nl-nl","en-us","da","fi-fi","pt-pt","hu","sk","sl","pl","ca","sv","zh-tw","ar","en-gb","he-il","de-de","ko-kr","ja-jp","ro","az","nb","ru","es-es","th","cs","it-it","pt-br","fr-fr","el","tr","zh-cn"]);
});
// wrapped by build app
define("esri/dijit/AttributeInspector-all", ["dijit","dojo","dojox","dojo/require!esri/layers/FeatureLayer,esri/dijit/AttributeInspector"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.AttributeInspector-all");

dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.dijit.AttributeInspector");

});
