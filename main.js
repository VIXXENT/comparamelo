var express =	require('express');
var request =	require('request');
var cheerio	=	require('cheerio');
var vlog	=	require('vlog');

var app     = express();

var chromeHeaders = {
	"host":"www.alternate.es",
	"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	"user-agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.107 Safari/537.36"
};

app.get('/scrapeAlternate', function scrapeAlternate(req, res){
	var url = 'https://www.alternate.es';
	
//	vlog.vlog("tabLinks inicializado <",tabLinks,">");
	request({headers:chromeHeaders ,uri:url, _callBack:printLink}, getTabLinks);
//	vlog.vlog("tabLinks fuera del método<",tabLinks,">");
	
//	var navLinks = [];
//	vlog.vlog("navlinks declarado <",navLinks,">");
//	url = tabLinks[0];
//	vlog.vlog("url tab0 = <",url,">");
//	request({headers:chromeHeaders, uri:url, }, getNavLinks);
//	vlog.vlog("Navlinks fuera del método <",navLinks,">");
	
//	res.send("<pre>"+JSON.stringify(tabLinks)+"</pre><br/><pre>"+JSON.stringify(navLinks)+"</pre>");
//	
//	request(url, function(err, resp, html){
//		vlog.vlog("scrapeando");
//		vlog.vlog("ERROR: ",err);
//		vlog.vlog("statusCode: ",resp.statusCode);
//		
//		var $ = cheerio.load(html);
//		vlog.vlog(html);
//		res.send(html);
//	});
});

function printLink(link){
	//vlog.vlog("TODOS LOS ENLACES:");
	vlog.vlog  ("#############################");
	console.log("#                           #");
	console.log(JSON.stringify(link, null, 2));
	console.log("#                           #");
	console.log("#############################");
	console.log("");
}

function getTabLinks (err, resp, html) {
	checkErrors(err, resp, html, this.uri);
	//vlog.vlog("scrapeando");
	//vlog.vlog("ERROR: ",err);
	//vlog.vlog("res: ",resp.statusCode);
	var mainUrl = resp.request.href;
	mainUrl = mainUrl.slice(0, -1);
	var $ = cheerio.load(html);

	var callBack = this._callBack;
	
	//este objeto contendrá todos los links del navTree y una propiedad con 
	//el número total de links para saber cuándo ha terminado el proceso,
	//pues el bucle mandará peticiones request para cada uno y cuando acabe 
	//las mandará a impimir por consola
	var tabLinks = {linksPendientes:$(".tab").length, mainUrl:mainUrl, tabs:{}};
	$(".tab").each(function eachTabLink(ind, tab){//Recorre los links de la barra superior: "tabLinks"
		var href		= $(tab).attr("href");
		var tabLinkName	= $(tab).text();
		if(href !== undefined){
			//tabLinks.linksPendientes++; //cuento un tabLink pendiente de visitar (cuando termine la request se descontará)
			if(tabLinks.tabs[tabLinkName] === undefined){
				tabLinks.tabs[tabLinkName] = {};
			}
			tabLinks.tabs[tabLinkName].tabUrl = mainUrl+href; // informo la URL a la que enlaza esta tab
			requestArguments = {
				headers		 : chromeHeaders,
				uri			 : tabLinks.tabs[tabLinkName].tabUrl,
				_tabLinks	 : tabLinks,
				_callBack	 : callBack,
				_tabLinkName : tabLinkName
			};
			//vlog.vlog("mandando llamada a getNavLinks, URL = <",requestArguments.uri,">");
			request(requestArguments, getNavLinks);
		}else{
			tabLinks.linksPendientes--;
		}
	});
};

function getNavLinks (err, resp, html) {
	checkErrors(err, resp, html, this.uri);
	var callBack	= this._callBack;//función a la que debemos mandar los resultados de esta función
	var tabLinks	= this._tabLinks;//objeto con todos los links recogidos hasta el momento
	var tabLinkName	= this._tabLinkName;//nombre o key del kink en concreto que estamos visitando/procesando (en esta instancia/hilo de la función)
	var mainUrl		= tabLinks.mainUrl;//url principal de la página que estamos visitando, a la que uniremos los hrefs para montar enlaces completos
	
	tabLinks.linksPendientes--;//al lanzarse este método, se ha completado la llamada a un link de tab: descontamos uno al contador.
	
	//vlog.vlog("html: "+html);
	var $ = cheerio.load(html);
	
	//vlog.vlog("tabLinks = <",tabLinks,">");
	tabLinks.tabs[tabLinkName] = {linksPendientes:$("#navTree").find("a").length ,navs:{}};
	
	$("#navTree").find("a").each(function eachNavLink(ind, navLink){//Recorre los links del navTree (panel lateral izquierdo): "navLinks"
		//tabLinks.tabs[tabLinkName].linksPendientes++;//cuento un navLink pendiente de visitar (cuando termine la request se descontará)
		var href		= $(navLink).attr("href");
		var navlinkName	= $(navLink).text();
		if(href !== undefined){
			tabLinks.tabs[tabLinkName].navs[navlinkName] = {};
			tabLinks.tabs[tabLinkName].navs[navlinkName].navUrl = mainUrl+href;
			tabLinks.tabs[tabLinkName].linksPendientes--;
		}else{
			tabLinks.tabs[tabLinkName].linksPendientes--;
		}
		if(tabLinks.tabs[tabLinkName].linksPendientes === 0 && tabLinks.linksPendientes === 0){
			callBack(tabLinks);
		}else{
			console.log("<",tabLinks.linksPendientes,"><",tabLinks.tabs[tabLinkName].linksPendientes,">");
		}
	});
}

function checkErrors(err, resp, html, uri){
	/*if(err){
		vlog.vlog("[DEBUG] -- ");
		vlog.vlog("[DEBUG] -- ");
		vlog.vlog("[DEBUG] -- URL = <",uri,">");
		vlog.vlog("[DEBUG] -- err = <",err,">");
		vlog.vlog("[DEBUG] -- html = <",html,">");
		vlog.vlog("[DEBUG] -- resp = <",resp,">");
		vlog.vlog("[DEBUG] -- ");
		vlog.vlog("[DEBUG] -- ");
	}*/
}

vlog.vlog("Listo y escuchando");
app.listen('80');