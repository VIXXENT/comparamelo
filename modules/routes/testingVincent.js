// -- NODE MODULES {
var path				= require('path');
var ejs					= require('ejs');
var bodyParser			= require('body-parser');
var vlog				= require('vlog');
// -- }

// -- LOCAL MODULES {
//Controllers
var alternateScraper	= require('../scraping/webScrapers/alternate/alternateScraper');
var articuloController	= require('../DB/controllers/articuloController');
var brandController		= require('../DB/controllers/brandController');
// -- }

function setRoutes(express){
	
	var app		= express();
	var router	= express.Router();
	
	router.use(function(req, res, next) {
		console.log("[NAVEGACIÓN]["+req.method+"] - url<"+req.originalUrl+">");
		next();
	});
	
	app.set('views', path.join(path.dirname(require.main.filename), 'views'));
	app.engine('html', ejs.__express);
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());

	router.get('/scrapeAlternateAllItemsLists', function scrapeAlternateAllItemsLists(req, res){
		var options = {response:res};
		alternateScraper.scrape(options);
	});

	router.get('/saveDummy', function scrapeAlternateAllItemsLists(req, res){
		var items = require('./modules/dummies/alternateDummyMemoriaItems').items;
		saveArticulos(items);
		res.send("done");
	});

	router.get('/updateBrands', function updateItemsBrands(req, res){
		articuloController.getDistinctBrands(brandController.saveBrands);
		res.send("done");
	});
	
	router.get('/scrapeOneItem', function showMain(req, res){
		res.render('vincentTesting.html', {
			title: 'vincentTesting'
		});
	});
	
	router.route('/scrapeOneItem').post(function(req, res){
		itemUrl = req.body.url;
		vlog.vlog("Scraping one item: "+itemUrl);
		
		alternateScraper.scrapeOneItem(itemUrl, res, printObject);
	});
	
	app.use('/vincent', router);
	
	return app;
}

function printObject(root, response){
	response.send("<pre>"+JSON.stringify(root, null, "\t")+"</pre>");
}

module.exports.setRoutes = setRoutes;