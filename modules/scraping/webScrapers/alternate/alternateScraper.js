

// -- LOCAL MODULES {
var linksScraper		= require('./alternateLinksScraper');
var itemsScraper		= require('./alternateItemsScraper');

var articuloController	= require('../../../DB/controllers/articuloController');
// -- }

function mergeOptions(options){
	if(!options){
		options = {};
	}
	
	var defaultOptions = {
		siteUrl				: "https://www.alternate.es",
		response			: undefined,
		itemsCallBack		: articuloController.saveArticulos,
		elementsToInspect	: [
			"/Hardware/Componentes/Refrigeración/"
		]
	};
	
	for(var key in defaultOptions){
		if(!options[key]){
			options[key] = defaultOptions[key];
		}
	}
	
	return options;
}

function scrapeAlternate(options){
	
	options				= mergeOptions(options);
	
	var url				= options.siteUrl;
	var response		= options.response;
	var linksCallBack	= itemsScraper.saveItems;
	
	linksScraper.getLinks(url, response, linksCallBack, options);
	//getLinks(url, res, callBack, options)
	
}

module.exports.scrape = scrapeAlternate;