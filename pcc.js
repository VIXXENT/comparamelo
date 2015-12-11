var express     =	require('express');
var request     =	require('request');
var cheerio	=	require('cheerio');
//var vlog	=	require('vlog');

var app     = express();

var chromeHeaders = {
	"host":"http://www.pccomponentes.com/",
	"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	"user-agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.107 Safari/537.36"
};

app.get('/scrapePCC', function scrapePCC(req, res){
	var url = 'http://www.pccomponentes.com/';
	getLinks(url, res);
});

// getLinks
function getLinks(url, res){
	//vlog.vlog();
	var aLinks = {
		mainUrl			: url,
		linksPendientes         : 1,
		links			: {}
	};
	var requestArgs = {
		_callBack	: printLink,
		_root		: aLinks,
		_thisLevel	: aLinks.links,
		_response	: res
	};
	lanzaRequest(requestArgs, url, extract);
}

// lanzaRequest
function lanzaRequest(requestArgs, url, callBack) {
	var retries = 0;
	if(requestArgs!==undefined && requestArgs.bkpRequest !==undefined && requestArgs.bkpRequest.retries!==undefined ){
		retries = requestArgs.bkpRequest.retries;
	}
	
	var encodedUri = encodeURI(url);
	
	var requestArguments = {
		headers     : chromeHeaders,
		uri         : encodedUri,
		_url        : url,
		_bkpRequest :{
			requestArgs	:requestArgs,
			url		:encodedUri,
			callBack	:callBack,
			retries		:retries
		}
	};
	
	for(var key in requestArgs){
		requestArguments[key] = requestArgs[key];
	}
	//console.log(requestArguments);
	request(requestArguments, callBack);
};

// extract
function extract(err, resp, html){
	var parentUrl	= this._url;
	var root	= this._root;
	var thisLevel	= this._thisLevel;
	var callBack	= this._callBack;
	var response	= this._response;
	if(thisLevel === undefined){
		thisLevel = root;
	}
	
	if(checkErrors(err, resp, html, this)===200){
		var $ = cheerio.load(html);
		
		//Descuento el enlace que ha ido bien.
		root.linksPendientes --;
		
		var parentPath = parentUrl.replace(root.mainUrl,'');
                console.log(parentPath);
		var anchors = getAnchors(parentPath, $);
		root.linksPendientes += anchors.length;
		//console.log("<",anchors.length,">++ - ",parentUrl);
		anchors.each(function eachAnchor(ind, anchor){
			var anchorHref	= $(anchor).attr("href");
			var anchorText	= $(anchor).text();
			var fullUrl	= root.mainUrl + anchorHref;

			var requestArgs = {
				_callBack	: callBack,
				_root		: root,
				_response	: response
			};

			thisLevel[anchorText] = {url:anchorHref};
			
			if($(anchor).closest("li").hasClass("hasSubs") || $(anchor).parent().hasClass("nav_tab_main")){
				//Este enlace tiene enlaces hijos
				//vlog.vlog("Este enlace <",parentUrl,"> --> <",anchorText,"> tiene enlaces hijos");
				thisLevel[anchorText].links = {};
				requestArgs._thisLevel = thisLevel[anchorText].links;
				
				lanzaRequest(requestArgs, fullUrl, extract);
			}else{
				//este enlace no tiene enlaces hijos
				//vlog.vlog("Este enlace <",parentUrl,"> --> <",anchorText,"> NO tiene enlaces hijos");
				lanzaRequest(requestArgs, fullUrl, getItemsList);
			}
		});
	}
}

// getAnchors
function getAnchors(parentPath, $){
	console.log("Obteniendo sub-enlaces de <",parentPath,">");
	var anchors = undefined;
	var childrenselector = undefined;
	if(parentPath===undefined || parentPath===null || parentPath==='/' || parentPath===''){
		var childrenselector = ".cargaSubMenu a";
		anchors = $(childrenselector);
	}else{
		//Comprobación, por si aparece la pantalla de bienvenida/index en lugar de la página que debería aparecer
		//En caso de que no exista el panel .tree dentro de #navTree, entendemos que algo ha ido mal y saltamos el link
		if($(".menu-principal ul li").length<=0){
			//retornamos un array vacío para que la lógica siga con normalidad, como si este enlace no tuviera sub-enlaces
			//un array vacío normal "[]" no tiene "each", así que mandamos el array jQuery que sabemos que está vacío
			//y que tenemos a mano, el de la comprobación.
			return $(".menu-principal ul li");
		}
		
		var anchor				= $("#navTree [href='"+parentPath+"']");
		var level				= anchor.closest('li').attr('class').match(/(subLevel[^\s]*|parent)/)[0];
		childrenselector = '.subLevel';
		if(level === 'parent'){
			//La etiqueta actual es de clase "parent", sus hijos tendrán la clase "subLevel" (sin número)
			childrenselector += 2;
		}else{
			//La etiqueta actual es "subLevel" (con o sin número), sus hijos podrán ser de subLevel2 en adelante (subLevbel3...)
			var subLevel		= level.match(/subLevel[^\s]*/)[0];
			var subLevelNums	= subLevel.match(/[0-9]+/);
			
			
			if (subLevelNums !== null && subLevelNums.length>0){
				var subLevelNum	= subLevel.match(/[0-9]+/);
				var nextSubLevel = parseInt(subLevelNum)+1;
				childrenselector += nextSubLevel;
			}else{
				childrenselector += 2;
			}
		}
		
		var parentUl			= anchor.closest("ul");
		
		anchors = parentUl.find(childrenselector+" a");
	}
	return anchors;
}



function getItemsList(err, resp, html){
	//vlog.vlog();
	//var parentUrl	= this._url;
	var root		= this._root;
	var callBack	= this._callBack;
	var response	= this._response;
	//var $			= cheerio.load(html);
	
	root.linksPendientes --;
	
	if(root.linksPendientes === 0){
		callBack(root, response);
	}else{
		console.log("quedan <"+root.linksPendientes+"> enlaces por visitar");
	}
}

function checkErrors(err, resp, html, callerContext){
	var returnCode = undefined;
	if(resp && resp.statusCode){
		returnCode = resp.statusCode;
	}

	if(err!==null){
		console.log("ERROR -- ",err, " - "+callerContext._url);
		relanzaRequest(callerContext);
		returnCode = 500;
	}else if(resp.statusCode !== 200){
		console.log("ERROR -- ", resp.statusCode, " - "+callerContext._url);
		relanzaRequest(callerContext);
		returnCode = resp.statusCode;
	}else if(cheerio.load(html)("#missingPageForm").length>0){
		console.log("WARNING: la página con URL<",callerContext._url,"> ha devuelto error de no disponible");
		console.log("\n\n\n\n\n");
		console.log(html);
		console.log("\n\n\n\n\n");
		relanzaRequest(callerContext);
		returnCode = 429;
	}
	return returnCode;
}

function relanzaRequest(callerContext){
	//relanzamiento de la request desde el backup
	var bkpRequest	= callerContext._bkpRequest;
	var root		= callerContext._root;
	var requestArgs	= bkpRequest.requestArgs;
	var url			= bkpRequest.url;
	var callBack	= bkpRequest.callBack;
	var maxRetries	= 15;
	
	bkpRequest.retries++;
	var retries		= bkpRequest.retries;

	if(retries<=maxRetries){
		//vlog.vlog("reintentando <",url,"> por <",retries,">ª vez");
		requestArgs._bkpRequest = bkpRequest;
		lanzaRequest(requestArgs, url, callBack);
	}else{
		console.log("\n");
		//vlog.vlog  ("/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\");
		console.log("/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\");
		console.log("[WARNING] - La URL <",url,"> ha provocado errores más de <",maxRetries,"> veces <",retries,">, y por tanto se va a saltar");
		console.log("/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\");
		console.log("/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\");
		console.log("\n");
		
		//Descuento el enlace que ha pasado el límite de reintentos.
		root.linksPendientes --;
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

function printLink(link, response){
	//vlog.vlog("TODOS LOS ENLACES:");
	//vlog.vlog  ("#############################");
	console.log("#                           #");
	console.log(JSON.stringify(link, null, 2));
	console.log("#                           #");
	console.log("#############################");
	console.log("");
	response.send("<pre>"+JSON.stringify(link, null, 2)+"</pre>");
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
//		vlog.vlog("WARNING: saltando página <",this._url,">");
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
//		vlog.vlog("WARNING: saltando página <",this._url,">");
//		vlog.vlog("       : linksPendientes <",this._url,"> = <"+this._tabLinks.linksPendientes[this._parentObj.url]+">");
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
//		vlog.vlog("WARNING: saltando página <",this._url,">");
//		vlog.vlog("       : linksPendientes <",this._url,"> = <"+this._tabLinks.linksPendientes[this._parentObj.url]+">");
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
//		vlog.vlog("WARNING: saltando página <",this._url,">");
//		vlog.vlog("       : linksPendientes <",this._url,"> = <"+this._tabLinks.linksPendientes[this._parentObj.url]+">");
//	}
//}

//function checkErrors(err, resp, html, callerContext){
//	
//	$ = cheerio.load(html);
//	if($("#missingPageForm").length>0){
//		vlog.vlog("WARNING: la página con URL<",callerContext._url,"> ha devuelto error de no disponible");
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

console.log("Listo y escuchando");
app.listen('80');