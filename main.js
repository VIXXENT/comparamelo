// -- NODE MODULES {
var express				= require('express');
var vlog				= require('vlog');
var mongoose			= require('mongoose');
// -- }

// -- LOCAL MODULES {
var requesting			= require('./modules/scraping/utils/requesting');
var alternateLinks		= require('./modules/scraping/webScrapers/alternateLinksScraper');
var alternateItems		= require('./modules/scraping/webScrapers/alternateItemsScrapper');
var connector			= require('./modules/DB/connector');

//Controllers
var articuloController	= require('./modules/DB/controllers/articuloController');
var brandController		= require('./modules/DB/controllers/brandController');

//checkers
var saveCheck			= require('./modules/DB/basicCheckers/saveCheck');

// -- }

var app     = express();
connector.connect();


app.get('/scrapeAlternateAllItemsLists', function scrapeAlternateAllItemsLists(req, res){
	var getLinksOptions = {elementsToInspect : [
		"/Hardware/Componentes/Refrigeración/"
	]};
	alternateLinks.getLinks('https://www.alternate.es', res, saveItems, getLinksOptions);
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

function saveItems(linksCollection, response, thisLevel){
	linksCollection.linksPendientes = 0;
	alternateItems.getItemsList(linksCollection, thisLevel, response, saveArticulos);
}

//function printLink(link, response){
//	//vlog.vlog("TODOS LOS ENLACES:");
//	vlog.vlog  ("#############################");
//	console.log("#                           #");
//	console.log(JSON.stringify(link, null, 2));
//	console.log("#                           #");
//	console.log("#############################");
//	console.log("");
//	try{
//		response.send('<pre>'+JSON.stringify(link, null, 2)+'</pre><script type="text/javascript">window.links ='+JSON.stringify(link, null, 2)+';</script>');
//	}catch(e){}
//
//	try{
//		response.send('<pre>'+JSON.stringify(link, null, 2)+'</pre><script type="text/javascript">window.links ='+JSON.stringify(link, null, 2)+';</script>');
//		saveArticulos(link);
//	}catch(error){
//		try{
//			response.send('<pre>'+JSON.stringify(error, null, 2)+'</pre>');
//			vlog.vlog('ERROR ',error);
//		}catch(error2){
//			console.log("error al mostrar el error");
//			console.log("Error que iba a mostrar: ", error);
//			console.log("Error al intentar mostrarlo: ", error2);
//		}
//	}
//}

function saveArticulos(articulos){//TODO: hay que cambiar el guardado individual a un bulk save --> http://andysandefer.com/wordpress/?p=30
	var links = articulos.links;
	if(links !== undefined){
		for(var key in links){
			saveArticulos(links[key]);
		}
	}else if (articulos.items){
		articulos.items.forEach(function eacharticulo(articulo){
			var articulo = articuloController.newarticulo(articulo);
			articulo.save(saveCheck);
		});
	}
}

vlog.vlog("Listo y escuchando");
app.listen('80');