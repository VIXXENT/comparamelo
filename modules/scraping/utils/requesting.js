// -- NODE MODULES {
var request			= require('request');
var cheerio			= require('cheerio');
var vlog			= require('vlog');
// -- }

var chromeHeaders = {
	"host":"www.alternate.es",
	"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	"user-agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.107 Safari/537.36"
};

function lanzaRequest(requestArgs, url, callBack, options) {
	var retries = 0;
	if(requestArgs!==undefined && requestArgs.bkpRequest !==undefined && requestArgs.bkpRequest.retries!==undefined ){
		retries = requestArgs.bkpRequest.retries;
	}
	
	if(options === undefined){
		options = {};
	}
	
	if(options.maxSockets === undefined){
		options.maxSockets = 25;
	}
	
	var encodedUri = encodeURI(url);
	
	var requestArguments = {
		pool: { maxSockets: options.maxSockets },
		headers : {
			"host"			: "www.alternate.es",
			"accept"		: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"user-agent"	: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.107 Safari/537.36"
		},
		uri					: encodedUri,
		_url				: url,
		_bkpRequest:{
			requestArgs	:requestArgs,
			url			:encodedUri,
			callBack	:callBack,
			retries		:retries
		}
	};
	
	for(var key in requestArgs){
		requestArguments[key] = requestArgs[key];
	}
	
	request(requestArguments, callBack);
};

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
	}
	
	return returnCode;
}

function relanzaRequest(callerContext){
	//relanzamiento de la request desde el backup
	if(callerContext._bkpRequest !== undefined){
		var bkpRequest	= callerContext._bkpRequest;
		var root		= callerContext._root;
		var callBack	= callerContext._callBack;
		var requestArgs	= bkpRequest.requestArgs;
		var url			= bkpRequest.url;
		var callBack	= bkpRequest.callBack;
		var maxRetries	= 15;

		bkpRequest.retries++;
		var retries		= bkpRequest.retries;

		if(retries<=maxRetries){
			vlog.vlog("reintentando <",url,"> por <",retries,">ª vez");
			requestArgs._bkpRequest = bkpRequest;
			lanzaRequest(requestArgs, url, callBack);
		}else{
			console.log("\n");
			vlog.vlog  ("/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\");
			console.log("/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\");
			console.log("[WARNING] - La URL <",url,"> ha provocado errores más de <",maxRetries,"> veces <",retries,">, y por tanto se va a saltar");
			console.log("/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\");
			console.log("/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\");
			console.log("\n");

			//Descuento el enlace que ha pasado el límite de reintentos.
			root.linksPendientes --;

			if(root.linksPendientes===0){
				callBack(root);
			}
		}
	}
}

module.exports.lanzaRequest = lanzaRequest;
module.exports.relanzaRequest = relanzaRequest;
module.exports.checkErrors = checkErrors;