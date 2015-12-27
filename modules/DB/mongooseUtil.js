// -- NODE MODULES {
var vlog				= require('vlog');
var mongoose			= require('mongoose');
// -- }
// 
// -- LOCAL MODULES {
//var Brand				= require('./Models/brand');
var massiveInsertCheck	= require('./basicCheckers/massiveInsertCheck');
// -- }


function bulkInsert(collection){
	if((!collection.length) || collection.length<=0){
		throw new Error("invalid collection.length = <",collection.length,">");
	}
	
	var modelName = null;
	
	for(var key in collection){
		var element = collection[key];
		
		if(modelName===null){
			modelName = getModelName(element);
		}else{
			if(modelName !== getModelName(element)){
				throw new Error("different model names in the elements of this collection (<",modelName,">!=<",getModelName(element),">)");
			}
		}
		
		collection[key] = collection[key]._doc;
	}
	
	var model = getModelByName(modelName);
	
	model.collection.insert(collection, massiveInsertCheck);
}

function getModelName(mongooseDocument){
	return mongooseDocument.constructor.modelName;
}

function getModelByName(modelName){
	return mongoose.model(modelName);
}

function getModel(mongooseDocument){
	return getModelByName(getModelName(mongooseDocument));
}

module.exports.bulkInsert		= bulkInsert;
module.exports.getModelName		= getModelName;
module.exports.getModelByName	= getModelByName;
module.exports.getModel			= getModel;