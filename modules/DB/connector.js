var mongoose	= require('mongoose');
var vlog		= require('vlog');

function connect(){
	return mongoose.connect("mongodb://localhost/comparamelo", function(err, res){
		if(err){
			vlog.vlog("ERROR - ", err);
		}else{
			vlog.vlog("Conectado correctamente a BD");
		}
		if(res){
			vlog.vlog("connection.response = ", res);
		}
	});
}

function disconnect(){
	return mongoose.disconnect();
}

module.exports.connect = connect;
module.exports.disconnect = disconnect;