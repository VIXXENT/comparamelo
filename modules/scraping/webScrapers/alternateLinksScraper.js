// -- NODE MODULES {
var vlog			= require('vlog');
var cheerio			= require('cheerio');
// -- }

// -- LOCAL MODULES {
var requesting		= require('../utils/requesting');
// -- }

function getLinks(url, res, callBack, options){
	//options es un argumento opcional, si no se informa lo convertimos en obeto vacío ({})
	//para que al buscar sus propiedades, no provoque errores
	if(options === undefined){
		options = {};
	}
	
	vlog.vlog();
	var aLinks = {
		mainUrl			: url,
		linksPendientes	: 1,
		links			: {}
	};
	var requestArgs = {
		_callBack	: callBack,
		_root		: aLinks,
		_thisLevel	: aLinks.links,
		_response	: res,
		_options	: options
	};
	requesting.lanzaRequest(requestArgs, url, extract);
}

function extract(err, resp, html){
	var parentUrl	= this._url;
	var root		= this._root;
	var thisLevel	= this._thisLevel;
	var callBack	= this._callBack;
	var response	= this._response;
	var options		= this._options;
	
	if(thisLevel === undefined){
		thisLevel = root;
	}
	
	if(checkErrors(err, resp, html, this)===200){
		var $ = cheerio.load(html);
		
		//Descuento el enlace que ha ido bien.
		root.linksPendientes --;
		
		var parentPath = parentUrl.replace(root.mainUrl,'');
		var anchors = getAnchors(parentPath, $);
		root.linksPendientes += anchors.length;
		//console.log("<",anchors.length,">++ - ",parentUrl);
		anchors.each(function eachAnchor(ind, anchor){
			var anchorHref	= $(anchor).attr("href");
			var anchorText	= $(anchor).text();
			var fullUrl	= root.mainUrl + anchorHref;
			
			var anchorHrefMatchesElementsToInspect = false;
			if(options.elementsToInspect!==undefined){
				options.elementsToInspect.forEach(function(elementToInspect){
					if(anchorHref.indexOf(elementToInspect)>=0 || elementToInspect.indexOf(anchorHref)>=0){
						anchorHrefMatchesElementsToInspect = true;
						return false;//break
					}
				});
			}
			
			if(options.elementsToInspect === undefined || (options.elementsToInspect.indexOf(anchorText)>=0) || (anchorHrefMatchesElementsToInspect)){
				var requestArgs = {
					_callBack	: callBack,
					_root		: root,
					_response	: response,
					_options	: options
				};

				thisLevel[anchorText] = {url:anchorHref};

				if($(anchor).closest("li").hasClass("hasSubs") || $(anchor).parent().hasClass("nav_tab_main")){
					//Este enlace tiene enlaces hijos
					//vlog.vlog("Este enlace <",parentUrl,"> --> <",anchorText,"> tiene enlaces hijos");
					thisLevel[anchorText].links = {};
					requestArgs._thisLevel = thisLevel[anchorText].links;

					requesting.lanzaRequest(requestArgs, fullUrl, extract);
				}else{
					//este enlace no tiene enlaces hijos
					//vlog.vlog("Este enlace <",parentUrl,"> --> <",anchorText,"> NO tiene enlaces hijos");

					requesting.lanzaRequest(requestArgs, fullUrl, finish);
				}
			}else{
				console.log("me salto <",anchorText,"><",anchorHref,"> porque elementsToInspect<",options.elementsToInspect,"> existe y no lo contiene");
				root.linksPendientes --;
			}
		});
	}
}

function finish(err, resp, html){
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

function getAnchors(parentPath, $){
	console.log("Obteniendo sub-enlaces de <",parentPath,">");
	var anchors = undefined;
	var childrenselector = undefined;
	if(parentPath===undefined || parentPath===null || parentPath==='/' || parentPath===''){
		var childrenselector = ".nav_tab_main a";
		anchors = $(childrenselector);
	}else{
		//Comprobación, por si aparece la pantalla de bienvenida/index en lugar de la página que debería aparecer
		//En caso de que no exista el panel .tree dentro de #navTree, entendemos que algo ha ido mal y saltamos el link
		if($("#navTree .tree").length<=0){
			//retornamos un array vacío para que la lógica siga con normalidad, como si este enlace no tuviera sub-enlaces
			//un array vacío normal "[]" no tiene "each", así que mandamos el array jQuery que sabemos que está vacío
			//y que tenemos a mano, el de la comprobación.
			return $("#navTree .tree");
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

function checkErrors(err, resp, html, callerContext){
	var returnCode = undefined;
	if(resp && resp.statusCode){
		returnCode = resp.statusCode;
	}
	
	if(err!==null){
		console.log("ERROR -- ",err, " - "+callerContext._url);
		requesting.relanzaRequest(callerContext);
		returnCode = 500;
	}else if(resp.statusCode !== 200){
		console.log("ERROR -- ", resp.statusCode, " - "+callerContext._url);
		requesting.relanzaRequest(callerContext);
		returnCode = resp.statusCode;
	}else if(cheerio.load(html)("#missingPageForm").length>0){
		console.log("WARNING: la página con URL<",callerContext._url,"> ha devuelto error de no disponible");
		console.log("\n\n\n\n\n");
		console.log(html);
		console.log("\n\n\n\n\n");
		requesting.relanzaRequest(callerContext);
		returnCode = 429;
	}
	return returnCode;
}

module.exports.getLinks = getLinks;