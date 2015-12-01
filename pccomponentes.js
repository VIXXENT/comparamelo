/*
 * pccomponentes scraping
 * @type Module express|Module express
 */

var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var vlog    = require('vlog');
var app     = express();

var chromeHeaders = {
	"host":"www.pccomponentes.com",
	"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	"user-agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.107 Safari/537.36"
};

app.get('/scrapePCC', function scrapePCC(req, res){
	
    var url = 'http://www.pccomponentes.com/';
                                                    
	request({headers:chromeHeaders ,uri:url, _callBack:printLink}, getTabLinks);

});

function getTabLinks (err, resp, html) {
	//checkErrors(err, resp, html, this.uri);
        
	var mainUrl = resp.request.href;
	mainUrl = mainUrl.slice(0, -1);
        console.log(mainUrl);
	
        var $ = cheerio.load(html);
	var callBack = this._callBack;
	
	var tabLinks = {linksPendientes:$(".cargaSubMenu").length, mainUrl:mainUrl, tabs:{}};
        console.log(tabLinks);
	$(".cargaSubMenu").each(function eachTabLink(ind, tab){//Recorre los links de la barra superior: "tabLinks"
		var href = $(tab).children().attr("href");
                console.log(href);
		var tabLinkName	= $(tab).text();
                console.log(tab+" -- - - - -- "+tabLinkName);
		if(href !== undefined){
			//tabLinks.linksPendientes++; //cuento un tabLink pendiente de visitar (cuando termine la request se descontará)
			if(tabLinks.tabs[tabLinkName] === undefined){
				tabLinks.tabs[tabLinkName] = {};
			}
			tabLinks.tabs[tabLinkName].tabUrl = mainUrl+href; // informo la URL a la que enlaza esta tab
			requestArguments = {
				headers		 : chromeHeaders,
				uri		 : tabLinks.tabs[tabLinkName].tabUrl,
				_tabLinks	 : tabLinks,
				_callBack	 : callBack,
				_tabLinkName     : tabLinkName
			};
			//vlog.vlog("mandando llamada a getNavLinks, URL = <",requestArguments.uri,">");
			request(requestArguments, function(){
                            console.log('estoy en request');
                        });
		}else{
			tabLinks.linksPendientes--;
		}
	});
};

function printLink(link){
	
        console.log('+-------------------------------+');
	console.log('+ '+JSON.stringify(link));
        console.log('+-------------------------------+');

}


console.log("Listo y escuchando");
app.listen('80');