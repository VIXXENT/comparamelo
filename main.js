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
	getLinks(url);
	//request({headers:chromeHeaders ,uri:url, _callBack:printLink}, getTabLinks);
});

function lanzaRequest(requestArgs, url, callback) {
	var requestArguments = {
		headers : {
			"host":"www.alternate.es",
			"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"user-agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.107 Safari/537.36"
		},
		uri: url
	};
	
	for(var key in requestArgs){
		requestArguments[key] = requestArgs[key];
	}
	
	request(requestArguments, callback);
};

function getLinks(url){
	vlog.vlog();
	var aLinks = {};
	var requestArgs = {
		_callBack	: printLink,
		_root		: aLinks
	};
	lanzaRequest(requestArgs, url, extract);
}

function getAnchors(parentUrl, $){
	vlog.vlog();
	var anchors;
	if(!parentUrl){
		anchors = $("#tabberTab .tab");
	}else{
		anchors = $("#navTree [href='"+parentUrl+"']").closest("ul").find("a[href!='"+parentUrl+"']");
	}
	return anchors;
}

function extract(err, resp, html){
	vlog.vlog();
	var parentUrl	= this.uri.href;
	var root		= this._root;
	var thisLevel	= this._thisLevel;
	var callBack	= this._callBack;
	var $			= cheerio.load(html);
	if(thisLevel === undefined){
		thisLevel = root;
	}
	
	if(checkErrors()===200){
		//Descuento el enlace que ha ido bien.
		root.linksPendientes --;
		
		var anchors = getAnchors(parentUrl, $);
		root.linksPendientes += anchors.length;

		anchors.each(function eachAnchor(ind, anchor){
			var anchorHref	= $(anchor).attr("href");
			var anchorText	= $(anchor).text();
			thisLevel[anchorText] = {url:anchorHref, links:{}};

			var requestArgs = {
				_callback	: callBack,
				_root		: root,
				_thisLevel	: thisLevel[anchorText].links
			};

			if($(anchor).hasClass("hasSubs") || $(anchor).hasClass("tab")){
				//Este enlace tiene enlaces hijos
				lanzaRequest(requestArgs, anchorHref, extract);
			}else{
				//este enlace no tiene enlaces hijos
				lanzaRequest(requestArgs, anchorHref, getItemsList);
			}
		});
	}
	
	

}

function getItemsList(err, resp, html){
	vlog.vlog();
	//var parentUrl	= this.uri.href;
	var root		= this._root;
	var callBack	= this._callBack;
	//var $			= cheerio.load(html);
	
	if(root.linksPendientes === 0){
		callBack(root);
	}else{
		vlog.vlog("Not yet<"+root.linksPendientes+">");
	}
}

function checkErrors(err, resp, html, callerContext){
	vlog.vlog();
	$ = cheerio.load(html);
	if($("#missingPageForm").length>0){
		vlog.vlog("WARNING: la página con URL<",callerContext.uri.href,"> ha devuelto error de no disponible");
		
		//al llamar desde aquí, no se mandan los mismos atributos a request
		//hay que reconstruir la cabecera y utilizar el caller como callback para un nuevo reuqest()
		//para bien habrá que mandarlo tal cual se había mandado antes (cabecera, argumentos, requestArgs...)
		var caller = arguments.callee.caller;
		request(callerContext, caller);
		return 500;
	}else{
		return 200;
	}
}

//function checkLinksPendientes(tabLinks){
//	if(Object.keys(tabLinks.linksPendientes).indexOf("undefined")>0){
//		vlog.vlog("linksPendientes contiene undefined!!", tabLinks.linksPendientes);
//		throw new Error("linksPendientes contiene undefined!!");
//	}
//	
//	for(var key in tabLinks.linksPendientes){
//		if(isNaN(tabLinks.linksPendientes[key])){
//			vlog.vlog("linksPendientes contiene NaN en la clave <",key,">!!");
//			throw new Error("linksPendientes contiene NaN en la clave <"+key+">!!");
//		}
//	}
//}

function printLink(link){
	//vlog.vlog("TODOS LOS ENLACES:");
	vlog.vlog  ("#############################");
	console.log("#                           #");
	console.log(JSON.stringify(link, null, 2));
	console.log("#                           #");
	console.log("#############################");
	console.log("");
}

//function getTabLinks (err, resp, html) {
//	if (checkErrors(err, resp, html, this)!==500){
//		//vlog.vlog("scrapeando");
//		//vlog.vlog("ERROR: ",err);
//		//vlog.vlog("res: ",resp.statusCode);
//		var mainUrl = resp.request.href;
//		mainUrl = mainUrl.slice(0, -1);
//		var $ = cheerio.load(html);
//
//		var callBack = this._callBack;
//
//		//este objeto contendrá todos los links del navTree y una propiedad con 
//		//el número total de links para saber cuándo ha terminado el proceso,
//		//pues el bucle mandará peticiones request para cada uno y cuando acabe 
//		//las mandará a impimir por consola
//		var tabLinks = {linksPendientes:{}, mainUrl:mainUrl, url:mainUrl, tabs:{}};
//		tabLinks.linksPendientes[mainUrl] = $(".tab").length;/**/checkLinksPendientes(tabLinks);
//		$(".tab").each(function eachTabLink(ind, tab){//Recorre los links de la barra superior: "tabLinks"
//			var href		= $(tab).attr("href");
//			var tabLinkName	= $(tab).text();
//			if(href !== undefined){
//				if(tabLinks.tabs[tabLinkName] === undefined){
//					tabLinks.tabs[tabLinkName] = {};
//				}
//				tabLinks.tabs[tabLinkName].url = mainUrl+href; // informo la URL a la que enlaza esta tab
//				requestArguments = {
//					headers		  : chromeHeaders,
//					uri			  : tabLinks.tabs[tabLinkName].url,
//					_tabLinks	  : tabLinks,
//					_callBack	  : callBack,
//					_parentObj	  : tabLinks.tabs[tabLinkName],
//					_parentParent : tabLinks
//				};
//				//vlog.vlog("mandando llamada a getNavLinks, URL = <",requestArguments.uri,">");
//				request(requestArguments, getNavLinks);
//			}else{
//				tabLinks.linksPendientes[mainUrl]--;/**/checkLinksPendientes(tabLinks);
//			}
//		});
//	}else{
//		vlog.vlog("WARNING: saltando página <",this.uri.href,">");
//		
//	}
//};

//function getNavLinks (err, resp, html) {
//	vlog.vlog("descontando un enlace de los hijos de <",this._parentObj.url,">, que son <",this._tabLinks.linksPendientes[this._parentObj.url],">");
//	this._tabLinks.linksPendientes[this._parentParent.url]--;/**/checkLinksPendientes(this._tabLinks);//al lanzarse este método, se ha completado la llamada a un link de tab: descontamos uno al contador.
//	/**/checkLinksPendientes(this._tabLinks);
//	if (checkErrors(err, resp, html, this)!==500){
//	
//		var callBack	= this._callBack;//función a la que debemos mandar los resultados de esta función
//		var tabLinks	= this._tabLinks;//objeto con todos los links recogidos hasta el momento
//		var parentObj	= this._parentObj;//nombre o key del kink en concreto que estamos visitando/procesando (en esta instancia/hilo de la función)
//		var mainUrl		= tabLinks.mainUrl;//url principal de la página que estamos visitando, a la que uniremos los hrefs para montar enlaces completos
//
//		var $ = cheerio.load(html);
//		var thisUrl = this.uri;
//
//		//vlog.vlog("tabLinks = <",tabLinks,">");
//		tabLinks.linksPendientes[parentObj.url] = $("#navTree a").length;/**/checkLinksPendientes(tabLinks);
//		parentObj.navs = {};
//
//		$("#navTree").find("a").each(function eachNavLink(ind, navLink){//Recorre los links del navTree (panel lateral izquierdo): "navLinks"
//			var href		= $(navLink).attr("href");
//			var navlinkName	= $(navLink).text();
//			if(href !== undefined){
//				parentObj.navs[navlinkName] = {url:mainUrl+href};
//
//				var requestArguments = {
//					headers				: chromeHeaders,
//					uri					: parentObj.navs[navlinkName].url,
//					_tabLinks			: tabLinks,
//					_callBack			: callBack,
//					_parentObj			: parentObj.navs[navlinkName],
//					_parentParent		: parentObj
//				};
//
//				if(requestArguments.uri.toString().indexOf("AYUDA")>0){
//					vlog.vlog("ayudaLink<",requestArguments.uri.toString(),"> \nerr<",err,">\n - navlinkName<",navlinkName,"> <",thisUrl.href,"> anchor<",$(navLink).parent().parent().parent().text(),"> parent<",$(".parent").text(),">");
//					vlog.vlog("HTML:\n\n\n",html,"\n\n\n");
//					throw new Error("se ha enlazado a la página de ayuda! ");
//				}
//
//				vlog.vlog("mandando request <",requestArguments.uri,"> a getNavSubLinks");
//				request(requestArguments, getNavSubLinks);
//			}else{
//				tabLinks.linksPendientes[parentObj.url]--;/**/checkLinksPendientes(tabLinks);
//			}
//		});
//	}else{
//		vlog.vlog("WARNING: saltando página <",this.uri.href,">");
//		vlog.vlog("       : linksPendientes <",this.uri.href,"> = <"+this._tabLinks.linksPendientes[this._parentObj.url]+">");
//		
//	}
//}

//function getNavSubLinks(err, resp, html){//Ha de ser recursivo, porque los subniveles no son fijos
//	this._tabLinks.linksPendientes[this._parentParent.url]--;/**/checkLinksPendientes(this._tabLinks);
//	
//	if (checkErrors(err, resp, html, this)!==500){
//		var tabLinks	= this._tabLinks;
//		var tabLinkName	= this._tabLinkName;
//		var navlinkName	= this._navlinkName;
//		var callBack	= this._callBack;
//		var parentObj	= this._parentObj;	//Fragmento del objeto donde debo colocar los enlaces que recoja. Aquí no puedo 
//											//referirme a la propiedad desde tabLinks, porque no sé el nivel de sub-objetos
//											//en el que me encuentro (tab.nav.subNav.subNav.subNav(...???))
//		vlog.vlog("Descontando el enlace <",this._parentParent.url,">, quedaban <",tabLinks.linksPendientes[this._parentParent.url],">");
//		if(isNaN(tabLinks.linksPendientes[this._parentParent.url]) || tabLinks.linksPendientes[this._parentParent.url]<0){
//			throw new Error("Número inválido<"+tabLinks.linksPendientes[this._parentParent.url]+"> tras descuento");
//		};
//
//		var mainUrl		= tabLinks.mainUrl;
//		var parentUrl	= parentObj.url.replace(mainUrl, "");
//
//
//	//		buscamos el UL que contenga el enlace con href == al href del enlace que nos ha llamado
//	//		osea, buscamos el enlace que acabamos de pulsar y vemos subenlaces que tiene
//	//		$("ul a[href='/Hardware/Componentes/Dispositivos/Copia-de-seguridad']").closest("ul").find("a[href != '/Hardware/Componentes/Dispositivos/Copia-de-seguridad']");
//		var $ = cheerio.load(html);
//		//En el listado que contiene el enlace padre, buscamos todos los enlaces que no tengan el href del enlace padre (que también está)
//		var anchors = $("ul a[href ='"+parentUrl+"']").closest("ul").find("a[href != '"+parentUrl+"']");
//
//		tabLinks.linksPendientes[parentObj.url] = anchors.length;/**/checkLinksPendientes(tabLinks);
//		parentObj.subNavs = {};
//
//		anchors.each(function eachNavSubLink(ind, navSubLink){
//			var tieneHijos	= $(navSubLink).hasClass("hasSubs");//Comprobamos si este subenlace (subnav) tiene más subenlaces
//			var href		= $(navSubLink).attr("href");//recogemos el href del subnav actual
//			var subNavName	= $(navSubLink).text();//Obtenemos el texto del subnav para usarlo como nombre de la propiedad en el objeto que mestamos montando
//
//			if(href !== undefined){
//				parentObj.subNavs[subNavName] = {url:mainUrl+href};
//				var requestArguments = {
//					headers			: chromeHeaders,
//					uri				: parentObj.subNavs[subNavName].url,
//					_tabLinks		: tabLinks,
//					_tabLinkName	: tabLinkName,
//					_navlinkName	: navlinkName,
//					_callBack		: callBack,
//					_parentObj		: parentObj.subNavs[subNavName],
//					_parentParent	: parentObj
//				};
//
//				var requestCallback = undefined;
//				if(tieneHijos){
//					requestCallback = getNavSubLinks;
//				}else{
//					requestCallback = getItemsLinks;
//				}
//
//				vlog.vlog("mandando request <",requestArguments.uri,"> a <<",requestCallback.name,">>");
//				request(requestArguments, requestCallback);
//			}else{
//				tabLinks.linksPendientes[parentObj.url]--;/**/checkLinksPendientes(tabLinks);
//			}
//		});
//		//	comprobamos cada enlace, ¿tiene más hijos? (.hasClass("hasSubs")) en caso positivo, hay que hacer request con 
//		//	getNavSubLinks como callback, así obtendremos todos los enlaces de forma recursiva.
//
//		//	Si no tiene hijos, llamaremos a un método que recoja la lista completa ("todos") de artículos de este enlace ("getItemLinks")
//
//	}else{
//		vlog.vlog("WARNING: saltando página <",this.uri.href,">");
//		vlog.vlog("       : linksPendientes <",this.uri.href,"> = <"+this._tabLinks.linksPendientes[this._parentObj.url]+">");
//	}
//}

//function getItemsLinks(err, resp, html){
//	this._tabLinks.linksPendientes[this._parentParent.url]--;/**/checkLinksPendientes(this._tabLinks);
//	if (checkErrors(err, resp, html, this)!==500){
//		var tabLinks	= this._tabLinks;
//		var tabLinkName	= this._tabLinkName;
//		var navlinkName	= this._navlinkName;
//		var callBack	= this._callBack;
//		var parentObj	= this._parentObj;	//Fragmento del objeto donde debo colocar los enlaces que recoja. Aquí no puedo 
//											//referirme a la propiedad desde tabLinks, porque no sé el nivel de sub-objetos
//											//en el que me encuentro (tab.nav.subNav.subNav.subNav(...???))
//		if(isNaN(tabLinks.linksPendientes[this._parentParent.url]) /*|| tabLinks.linksPendientes[this._parentParent.url]<0*/){
//			throw new Error("Número inválido<"+tabLinks.linksPendientes[this._parentParent.url]+"> tras descuento");
//		};
//		var mainUrl		= tabLinks.mainUrl;
//		var parentUrl	= parentObj.url.replace(mainUrl, "");
//
//		var totalLinkPendientes = 0;
//		lineaTotalLinksPendientes = "";
//		for(var key in tabLinks.linksPendientes){
//			var numLinksPendientes = tabLinks.linksPendientes[key];
//
//			if(isNaN(numLinksPendientes) /*|| numLinksPendientes<0*/){
//				vlog.vlog("tabLinks.linksPendientes objeto: \n\n\n",tabLinks.linksPendientes,"\n\n\n");
//				throw new Error("Número inválido ("+numLinksPendientes+") en tabLinks.linksPendientes["+key+"]");
//			}
//
//			if(numLinksPendientes>0){
//				totalLinkPendientes += numLinksPendientes;
//			}
//			lineaTotalLinksPendientes += (tabLinks.linksPendientes[key]+", ");
//		}
//		if(totalLinkPendientes<=0){
//			callBack(tabLinks);
//		}else{
//			console.log(lineaTotalLinksPendientes);
//		}
//	}else{
//		vlog.vlog("WARNING: saltando página <",this.uri.href,">");
//		vlog.vlog("       : linksPendientes <",this.uri.href,"> = <"+this._tabLinks.linksPendientes[this._parentObj.url]+">");
//	}
//}

//function checkErrors(err, resp, html, callerContext){
//	
//	$ = cheerio.load(html);
//	if($("#missingPageForm").length>0){
//		vlog.vlog("WARNING: la página con URL<",callerContext.uri.href,"> ha devuelto error de no disponible");
//		
//		//al llamar desde aquí, no se mandan los mismos atributos a request
//		//hay que reconstruir la cabecera y utilizar el caller como callback para un nuevo reuqest()
//		//para bien habrá que mandarlo tal cual se había mandado antes (cabecera, argumentos, requestArgs...)
//		//var caller = arguments.callee.caller;//.call(err, resp, html)
//		//request(callerContext, caller);
//		return 500;
//	}else{
//		return 200;
//	}
//	
//	/*if(err){
//		vlog.vlog("[DEBUG] -- ");
//		vlog.vlog("[DEBUG] -- ");
//		vlog.vlog("[DEBUG] -- URL = <",uri,">");
//		vlog.vlog("[DEBUG] -- err = <",err,">");
//		vlog.vlog("[DEBUG] -- html = <",html,">");
//		vlog.vlog("[DEBUG] -- resp = <",resp,">");
//		vlog.vlog("[DEBUG] -- ");
//		vlog.vlog("[DEBUG] -- ");
//	}*/
//}

vlog.vlog("Listo y escuchando");
app.listen('80');