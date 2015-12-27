// -- NODE MODULES {
var vlog	= require('vlog');
// -- }

module.exports = function connectCheck(err, res){
	if(err){
		vlog.vlog("ERROR - ", err);
	}else{
		vlog.vlog("Conectado correctamente a BD");
	}
	if(res){
		vlog.vlog("connection.response = ", res);
	}
};