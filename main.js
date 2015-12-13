// -- NODE MODULES {
var express			= require('express');
var vlog			= require('vlog');
// -- }

// -- LOCAL MODULES {
var requesting		= require('./modules/scraping/utils/requesting');
var alternateLinks	= require('./modules/scraping/webScrapers/alternateLinksScraper');
var alternateItems	= require('./modules/scraping/webScrapers/alternateItemsScrapper');
// -- }

var app     = express();



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
		"/Hardware/Componentes"
	]};
	alternateLinks.getLinks('https://www.alternate.es', res, printLinksCollection, getLinksOptions);
});

function printLinksCollection(linksCollection, response, thisLevel){
	linksCollection.linksPendientes = 0;
	alternateItems.getItemsList(linksCollection, thisLevel, response, printLink);
}

function printLink(link, response){
	//vlog.vlog("TODOS LOS ENLACES:");
	vlog.vlog  ("#############################");
	console.log("#                           #");
	console.log(JSON.stringify(link, null, 2));
	console.log("#                           #");
	console.log("#############################");
	console.log("");
	try{
		response.send('<pre>'+JSON.stringify(link, null, 2)+'</pre><script type="text/javascript">window.links ='+JSON.stringify(link, null, 2)+';</script>');
	}catch(e){}
}

vlog.vlog("Listo y escuchando");
app.listen('80');