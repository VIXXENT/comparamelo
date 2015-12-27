// -- NODE MODULES {
var mongoose		= require('mongoose');
// -- }

// -- LOCAL MODULES {
var connectCheck	= require('./basicCheckers/connectCheck');
// -- }

function connect(){
	return mongoose.connect("mongodb://localhost/comparamelo", connectCheck);
}

function disconnect(){
	return mongoose.disconnect();
}

module.exports.connect = connect;
module.exports.disconnect = disconnect;