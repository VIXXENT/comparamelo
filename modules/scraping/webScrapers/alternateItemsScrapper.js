// -- NODE MODULES {
var vlog			= require('vlog');
var cheerio			= require('cheerio');
// -- }

// -- LOCAL MODULES {
var requesting		= require('../utils/requesting');
// -- }

function getItemsList(linksCollection, thisLevel, res, callBack){
	var fullUrl = linksCollection.mainUrl + thisLevel.url;
	
	thisLevel.itemsCollection = {
		mainUrl			: fullUrl,
		items			: []
	};
	
	var requestArgs = {
		_callBack			: callBack,
		_root				: thisLevel.itemsCollection,
		_response			: res,
		_linksCollection	: linksCollection,
		_thisLevel			: thisLevel
	};
	
	linksCollection.linksPendientes++;
	requesting.lanzaRequest(requestArgs, fullUrl, paginate);
}

function paginate(err, resp, html){
	var callBack		=	this._callBack;
	var root			=	this._root;
	var response		=	this._response;
	var linksCollection	=	this._linksCollection;
	var thisLevel		=	this._thisLevel;
	
	if(requesting.checkErrors(err, resp, html, this)===200){
		linksCollection.linksPendientes--;
		var $ = cheerio.load(html);

		var anchors = getAnchors($);
		cosa = new Array();

		if(anchors.nextPageLinks.length>0){
			var nextPageAnchor = anchors.nextPageLinks[0];
			linksCollection.linksPendientes++;
			var requestArgs = {
				_callBack			: callBack,
				_root				: root,
				_response			: response,
				_linksCollection	: linksCollection,
				_thisLevel			: thisLevel
			};
			requesting.lanzaRequest(requestArgs, nextPageAnchor.attribs.href, paginate);
		}
		//Cuento los enlaces de la página actual como pendientes (se irán descontando conforme vaya visitándolos)
		linksCollection.linksPendientes += anchors.itemsLinks.length;
		anchors.itemsLinks.each(function(ind, anchor){
				var requestArgs = {
					_callBack			: callBack,
					_root				: root,
					_response			: response,
					_linksCollection	: linksCollection,
					_thisLevel			: thisLevel
				};
				requesting.lanzaRequest(requestArgs, root.mainUrl+anchor.attribs.href, getItemInfo);
		});
	}
}

function getItemInfo(err, resp, html){
	var callBack		=	this._callBack;
	var root			=	this._root;
	var response		=	this._response;
	var linksCollection	=	this._linksCollection;
	
	if(requesting.checkErrors(err, resp, html, this)===200){
		linksCollection.linksPendientes--;

		var item = {};

		var $ = cheerio.load(html);

		var productNameParts = $(".productNameContainer");

		item.fullName	= productNameParts.text().trim();
		item.marca		= productNameParts.find("span[itemprop=brand]").text();
		item.modelo		= productNameParts.find("span:not(span[itemprop=brand]):not(.productNameSub)").text();
		var subModelo	= productNameParts.find("span.productNameSub").text();
		if(subModelo!==undefined && subModelo.length>0){
			item.subModelo = subModelo;
		}
		item.precio		= parseFloat($("[itemprop='price']").attr("content"));

		root.items.push(item);

		if(linksCollection.linksPendientes === 0){
			callBack(linksCollection, response);
		}else{
			console.log("quedan <",linksCollection.linksPendientes,"> enlaces por visitar");
		}
	}
}

function getAnchors($){
	var anchors = {};
	anchors.nextPageLinks = $("a.next");
	anchors.itemsLinks = $("a.productLink");
	
	return anchors;
}

module.exports.getItemsList = getItemsList;