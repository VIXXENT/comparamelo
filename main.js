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
	
	var tabLinks = [];
//	vlog.vlog("tabLinks inicializado <",tabLinks,">");
	request({headers:chromeHeaders ,uri:url, saludo:"hola!!", callBack:printLink}, getTabLinks);
	vlog.vlog("tabLinks fuera del método<",tabLinks,">");
	
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
	console.log(JSON.stringify(link));
}

function getTabLinks (err, resp, html) {
	vlog.vlog("saludo: "+this.saludo);
	//vlog.vlog("scrapeando");
	//vlog.vlog("ERROR: ",err);
	//vlog.vlog("res: ",resp.statusCode);
	var mainUrl = resp.request.href;
	mainUrl = mainUrl.slice(0, -1);
	var $ = cheerio.load(html);


	$(".tab").each(function eachTab(ind, tab){
		var href = $(tab).attr("href");
		if(href !== undefined){
			//tabLinks.push(mainUrl+href);
			
			//useTabLinksCallBack (recoger del this)
			this.callBack(mainUrl+href);
		}
	});
	//vlog.vlog("tabLinks links insertados <",tabLinks,">");
	//return tabLinks;
};

function getNavLinks (err, resp, html) {
	if(err){
		vlog.vlog("[ERROR] - ",err);
	}else{
		var $ = cheerio.load(html);
		$("#navTree").find("a").each(function eachNavLink(ind, navLink){
			var href = $(navLink).attr("href");
			if(href !== undefined){
				navLinks.push(mainUrl+href);
			}
		});
		vlog.vlog("Links añadidos a navlinks <",navLinks,">");
		return navLinks;
	}
}


console.log("Listo y escuchando");
app.listen('80');