// -- NODE MODULES {
var express				= require('express');
var vlog				= require('vlog');
// -- }

// -- LOCAL MODULES {
//BD connection
var connector			= require('./modules/DB/connector');
//Routes
var appRouter			= require('./modules/routes/testingVincent');
// -- }

//var app = express();
var app = appRouter.setRoutes(express);

connector.connect();

vlog.vlog("Listo y escuchando");
app.listen('80');