// -- NODE MODULES {
var express			= require('express');
var vlog			= require('vlog');
var mongoose		= require('mongoose');
// -- }

// -- LOCAL MODULES {
var requesting		= require('./modules/scraping/utils/requesting');
var alternateLinks	= require('./modules/scraping/webScrapers/alternateLinksScraper');
var alternateItems	= require('./modules/scraping/webScrapers/alternateItemsScrapper');
var modelController	= require('./modules/DB/controllers/modelController');
var connector		= require('./modules/DB/connector');
// -- }

var app     = express();
connector.connect();

app.get('/scrapeAlternate', function scrapeAlternate(req, res){
	var url = 'https://www.alternate.es';
	alternateLinks.getLinks(url, res, printLink);
});
app.get('/scrapeAlternateSelecting', function scrapeAlternate(req, res){
	var url = 'https://www.alternate.es';
	var getLinksOptions = {elementsToInspect : [
		"Hardware",
		"Memoria RAM",
		"DDR3",
		"DDR3-1800"
	]};
	alternateLinks.getLinks(url, res, printLink, getLinksOptions);
});

app.get('/scrapeAlternateAllItemsLists', function scrapeAlternateAllItemsLists(req, res){
	var getLinksOptions = {elementsToInspect : [
		//"/Hardware/Componentes/Refrigeración/"
		"/Hardware/Componentes/Memoria-RAM/DDR4/DDR4-2133"
	]};
	alternateLinks.getLinks('https://www.alternate.es', res, printLinksCollection, getLinksOptions);
});

app.get('/saveDummy', function scrapeAlternateAllItemsLists(req, res){
	var items = require('./modules/dummies/alternateDummyMemoriaItems').items;
	saveArticulos(items);
	res.send("done");
});

function printLinksCollection(linksCollection, response, thisLevel){
	linksCollection.linksPendientes = 0;
	alternateItems.getItemsList(linksCollection, thisLevel, response, printLink);
}

function printLink(link, response){
	//vlog.vlog("TODOS LOS ENLACES:");
//	vlog.vlog  ("#############################");
//	console.log("#                           #");
//	console.log(JSON.stringify(link, null, 2));
//	console.log("#                           #");
//	console.log("#############################");
//	console.log("");
//	try{
//		response.send('<pre>'+JSON.stringify(link, null, 2)+'</pre><script type="text/javascript">window.links ='+JSON.stringify(link, null, 2)+';</script>');
//	}catch(e){}

	try{
		response.send('<pre>'+JSON.stringify(link, null, 2)+'</pre><script type="text/javascript">window.links ='+JSON.stringify(link, null, 2)+';</script>');
		saveArticulos(link);
	}catch(error){
		try{
			response.send('<pre>'+JSON.stringify(error, null, 2)+'</pre>');
			vlog.vlog('ERROR ',error);
		}catch(error2){
			console.log("error al mostrar el error");
			console.log("Error que iba a mostrar: ", error);
			console.log("Error al intentar mostrarlo: ", error2);
		}
	}
}

function saveArticulos(articulos){
	var links = articulos.links;
	if(links !== undefined){
		for(var key in links){
			saveArticulos(links[key]);
		}
	}else{
		articulos.items.forEach(function eacharticulo(articulo){
			var articulo = modelController.newarticulo(articulo);
			vlog.vlog("Artículo mongoosizado : ",articulo);
			articulo.save(function checkArticuloSave(error){
				vlog.vlog("guardando artículo...");
				if(error){
					vlog.vlog("ERROR - ",error);
				}else{
					vlog.vlog("TODO CORRECTO");
				}
			});
		});
	}
}

vlog.vlog("Listo y escuchando");
app.listen('80');