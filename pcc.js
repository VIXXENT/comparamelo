var express     =	require('express');
var request     =	require('request');
var cheerio	=	require('cheerio');

var app         =       express();

var chromeHeaders = {
	"host":"www.pccomponentes.com/",
	"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	"user-agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.107 Safari/537.36"
};

app.get('/scrapePCC', function scrapePCC(req, res){
    var url = 'http://www.pccomponentes.com/';
    getLinks(url, res);
});

function getLinks(url, res){

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

function lanzaRequest(requestArgs, url, callBack) {
	
    var encodedUri = encodeURI(url);

    var requestArguments = {
	headers : {
                    "host"      : "www.pccomponentes.com",
                    "accept"    : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.107 Safari/537.36"
                },
	uri                     : encodedUri,
	_url                    : url
    };
	
    for(var key in requestArgs){
	requestArguments[key] = requestArgs[key];
    }
	
	request(requestArguments, callBack);
};



function extract(err, resp, html){
                        
    var thisLevel = this._thisLevel;
    var callBack = this._callBack;
    var parentUrl = this._url;
    var root = this._root;
    var response = this._response;
        
    if(checkErrors(err, resp, html, this)===200){
        var $ = cheerio.load(html);
        
        //Descuento el enlace que ha ido bien.
	root.linksPendientes --;    
		
	var parentPath = parentUrl.replace(root.mainUrl,'');
	var anchors = getAnchors(parentPath, $);
	root.linksPendientes += anchors.length;

        anchors.each(function eachLinks(ind, anchor){
            
            var anchorText = $(anchor).text();
            var anchorHref = $(anchor).attr("href");        
            
            var requestArgs = {
                _callBack : callBack,
                _root : root,
                _response : response
            };
            
            if($(anchor).closest("div").hasClass("menu-principal")){    // Estamos en el primer nivel
                
                thisLevel[anchorText] = {url:anchorHref};
                thisLevel[anchorText].links = {};
                requestArgs._thisLevel = thisLevel[anchorText].links;  
            
                var linkId = $(anchor).closest("li").attr("id");
                var opcion = linkId.replace("btn_menu_","");
      
                lanzaRequest(requestArgs, "http://www.pccomponentes.com/nuevo_menu/inc_menu_dinamico.php?opcion="+opcion, extract);
            
            }else{  // Segundo nivel TO-DO: identificar este nivel con un selector
                
                root.linksPendientes --;
                
                if(anchorHref !== "#"){ // Evitamos almacenar los títulos. Simplemente descontamos el item para que siga la ejecución.
                    thisLevel[anchorText] = {url:anchorHref};
                }
                
                if(root.linksPendientes === 0){
                    callBack(root, response);
                }else{
                    console.log("quedan <"+root.linksPendientes+"> enlaces por visitar");
                }
            }
            
        });
    }
	
}

function getAnchors(parentPath, $){
    
    console.log("Obteniendo sub-enlaces de <",parentPath,">");
    var anchors = undefined;
    var childrenselector = undefined;
    
    if(parentPath===undefined || parentPath===null || parentPath==='/' || parentPath===''){
        childrenselector = ".cargaSubMenu a";
	anchors = $(childrenselector);
    }else{
        childrenselector = "#id_destacados_secciones";
        anchors = $(childrenselector).find('a');   
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
	//relanzaRequest(callerContext);
	returnCode = 500;
    }else if(resp.statusCode !== 200){
	console.log("ERROR -- ", resp.statusCode, " - "+callerContext._url);
	//relanzaRequest(callerContext);
	returnCode = resp.statusCode;
    }else if(cheerio.load(html)("#missingPageForm").length>0){
	console.log("WARNING: la página con URL<",callerContext._url,"> ha devuelto error de no disponible");
	console.log("\n\n\n\n\n");
	console.log(html);
	console.log("\n\n\n\n\n");
	//relanzaRequest(callerContext);
	returnCode = 429;
    }
    
    return returnCode;
}

function printLink(link, response){
	
    console.log("#    TODOS LOS ENLACES:     #");
    console.log("#############################");
    console.log("#                           #");
    console.log(JSON.stringify(link, null, 2));
    console.log("#                           #");
    console.log("#############################");
    console.log("");
	
    response.send("<pre>"+JSON.stringify(link, null, 2)+"</pre>");
}

console.log("Listo y escuchando");
app.listen('80');


