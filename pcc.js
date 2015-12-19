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
                        
    console.log(this.uri.href);
    var thisLevel = this._thisLevel;
        
    if(checkErrors(err, resp, html, this)===200){
        var $ = cheerio.load(html);
        links = $(".cargaSubMenu");

        links.each(function eachLinks(ind, link){
            
            var anchorText = $(link).text();
            var anchorHref = $(link).children("a").attr("href");
            console.log('*******');
            console.log(anchorText, anchorHref);
            
            
            var requestArgs = {
                _callBack : this._callBack
            };
            
            thisLevel[anchorText] = {url:anchorHref};
            
            thisLevel[anchorText].links = {};
            requestArgs._thisLevel = thisLevel[anchorText].links;  
            
            var linkId = $(link).attr("id");
            var opcion = linkId.replace("btn_menu_","");
            
 
            lanzaRequest(requestArgs, "http://www.pccomponentes.com/nuevo_menu/inc_menu_dinamico.php?opcion="+opcion, scrape);

        });
    }
	
}

function scrape(err, resp, html){
    
    var thisLevel = this._thisLevel;
    
    var $ = cheerio.load(html);
    var contenido = $(html);
    var secciones = contenido.find('#id_destacados_secciones');
    var seccionesA = secciones.find('a');
    
    seccionesA.each(function(ind, elemento){
        var anchorHref = $(elemento).attr("href");
        var anchorText = $(elemento).text();
        
        thisLevel[anchorText] = {url: anchorHref};
    });
    			
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


