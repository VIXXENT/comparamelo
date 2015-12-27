// -- NODE MODULES {
var vlog	= require('vlog');
// -- }

module.exports = function saveCheck(error, savedElements){
	if(error){
		vlog.vlog("ERROR - ",error);
	}else{
		vlog.vlog("GUARDADO OK");
		if(savedElements){
			console.log(JSON.stringify(savedElements._doc, null, 2),"\n");
		}
	}
};