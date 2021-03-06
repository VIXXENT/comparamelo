// -- NODE MODULES {
var vlog			= require('vlog');
var cheerio			= require('cheerio');
// -- }

// -- LOCAL MODULES {
var requesting		= require('../../utils/requesting');
// -- }

function saveItems(linksCollection, options){
	linksCollection.linksPendientes = 0;
	var response = options.response;
	var callBack = options.itemsCallBack;
	
	getItemsList(linksCollection, undefined, response, callBack);
}

function getItemsList(root, thisLevel, res, callBack){
	//vlog.vlog();
	
	if(thisLevel===undefined){
		thisLevel = root;
	}
	if(thisLevel.links !== undefined){
		for(var key in thisLevel.links){
			var link = thisLevel.links[key];
			getItemsList(root, link, res, callBack);
		}
	}else{
		root.linksPendientes++;
		var fullUrl = root.mainUrl+thisLevel.url;
		var requestArgs = {
			_root	: root,
			_thisLevel			: thisLevel,
			_response			: res,
			_callBack			: callBack
		};
		requesting.lanzaRequest(requestArgs, fullUrl, paginate);
	}
}

function paginate(err, resp, html){
	var thisLevel		= this._thisLevel;
	var response		= this._response;
	var callBack		= this._callBack;
	var root = this._root;
	
	if(requesting.checkErrors(err, resp, html, this)===200){
		//vlog.vlog("Visitado el enlace <",this.uri.href,">");
		root.linksPendientes--;
		var $ = cheerio.load(html);
		var anchors = getAnchors($);

		if(anchors.nextPageLinks.length>0){
			root.linksPendientes++;
			var nextPageUrl = anchors.nextPageLinks[0].attribs.href;
			var requestArgs = {
				_root	: root,
				_thisLevel			: thisLevel,
				_response			: response,
				_callBack			: callBack
			};
			vlog.vlog("página <",(anchors.nextPageLinks[0].attribs.href.match(/page=[0-9]+/)[0].match(/[0-9]+/)[0]),">");
			requesting.lanzaRequest(requestArgs, nextPageUrl, paginate);
		}

		if(anchors.itemsLinks.length>0){
			thisLevel.items = [];
			root.linksPendientes+= anchors.itemsLinks.length;
			anchors.itemsLinks.each(function(ind, itemAnchor){
				var itemUrl = itemAnchor.attribs.href;
				var requestArgs = {
					_root	: root,
					_thisLevel			: thisLevel,
					_response			: response,
					_callBack			: callBack
				};
				//vlog.vlog("invocando info: <",itemUrl,">");
				requesting.lanzaRequest(requestArgs, itemUrl, getItemInfo);
			});
		}

		//	if(root.linksPendientes === 0){
		//		vlog.vlog("TERMINADO <",root.linksPendientes,">");
		//	}else{
		//		console.log("Aún quedan <",root.linksPendientes,"> enlaces por visitar");
		//	}
	}
}

function getAnchors($){
	var anchors = {};
	anchors.nextPageLinks = $("a.next");
	anchors.itemsLinks = $("a.productLink");
	
	return anchors;
}

function getItemInfo(err, resp, html){
	var thisLevel		= this._thisLevel;
	var response		= this._response;
	var callBack		= this._callBack;
	var root = this._root;
	
	if(requesting.checkErrors(err, resp, html, this)===200){

		root.linksPendientes--;

		var item = {};

		var $ = cheerio.load(html);

		var productNameParts = $(".productNameContainer");

		item.fullName	= productNameParts.text().trim();
		item.brand		= productNameParts.find("span[itemprop=brand]").text();
		item.model		= productNameParts.find("span:not(span[itemprop=brand]):not(.productNameSub)").text();
		item.webPage	= root.mainUrl;
		var subModel	= productNameParts.find("span.productNameSub").text();
		if(subModel!==undefined && subModel.length>0){
			item.subModel = subModel;
		}
		item.price		= parseFloat($("[itemprop='price']").attr("content"));
		
		extractData($, item);
		
		thisLevel.items.push(item);

		if(root.linksPendientes === 0){
			callBack(root, response);
		}else{
			console.log("Aún quedan <",root.linksPendientes,"> enlaces por visitar");
		}
	}
}

function extractData($, item){
	var dataTable = $("#coreProductInfos");
	item.specifications = {};
	var mainTitles = dataTable.find(".techDataCol1");
	
	mainTitles.each(function(ind, mainTitle){
		mainTitle = $(mainTitle);
		var propertyKey = mainTitle.text();
		var propertyValue = $(mainTitle.siblings()[0]).text();//TODO: obviamente esto no puede quedarse así. Hay que convertir estos valores en objetos complejos
		
		item.specifications[propertyKey] = propertyValue;
	});
}

function scrapeOneItem(itemUrl, response, callBack){
	var root = {linksPendientes:1, items:[]};
	var requestArgs = {
		_root				: root,
		_thisLevel			: root,
		_response			: response,
		_callBack			: callBack
	};
	
	vlog.vlog("invocando info: <",itemUrl,">");
	requesting.lanzaRequest(requestArgs, itemUrl, getItemInfo);
}

module.exports.getItemsList		= getItemsList;
module.exports.saveItems		= saveItems;
module.exports.scrapeOneItem	= scrapeOneItem;
