// -- NODE MODULES {
var express				= require('express');
var vlog				= require('vlog');
var mongoose			= require('mongoose');
// -- }

// -- LOCAL MODULES {
var requesting			= require('./modules/scraping/utils/requesting');
var alternateScraper	= require('./modules/scraping/webScrapers/alternate/alternateScraper');
var connector			= require('./modules/DB/connector');

//Controllers
var articuloController	= require('./modules/DB/controllers/articuloController');
var brandController		= require('./modules/DB/controllers/brandController');

//checkers

// -- }

var app     = express();
connector.connect();


app.get('/scrapeAlternateAllItemsLists', function scrapeAlternateAllItemsLists(req, res){
	var options = {response:res};
	alternateScraper.scrape(options);
});

app.get('/saveDummy', function scrapeAlternateAllItemsLists(req, res){
	var items = require('./modules/dummies/alternateDummyMemoriaItems').items;
	saveArticulos(items);
	res.send("done");
});

app.get('/updateBrands', function updateItemsBrands(req, res){
	articuloController.getDistinctBrands(brandController.saveBrands);
	res.send("done");
});

vlog.vlog("Listo y escuchando");
app.listen('80');