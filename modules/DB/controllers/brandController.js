// -- NODE MODULES {
var vlog			= require('vlog');
// -- }
// 
// -- LOCAL MODULES {
var Brand			= require('../Models/brand');
var mongooseUtil	= require('../mongooseUtil');
// -- }

function initializeBrand(initObj){
	//var Articulo = mongoose.model('Articulo');
	var brand = new Brand();
	
	//Si lo que llega es una cadena, esa cadena será el nombre de la marca
	if(typeof initObj === "string"){
		initObj = {name:initObj};
	}
		
	for(var key in brand){
		var value = initObj[key];
		
		if(value!==undefined){
			brand[key] = value;
		}
	}
	return brand;
}

/**
 * @param {type} brands
 * @returns {undefined}
 */
function saveBrands(brands){vlog.vlog();
	if(brands.length>0){
		for(var key in brands){
			brands[key] = initializeBrand(brands[key]);
		}
		
		mongooseUtil.bulkInsert(brands);
		vlog.vlog("FIN");
	}else{
		vlog.vlog("/!\\WARNING/!\\ - Recieved an empty array");
	}
}

module.exports.initializeBrand = initializeBrand;
module.exports.saveBrands = saveBrands;