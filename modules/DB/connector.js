var mongoose = require('mongoose');

function connect(){
	return mongoose.connect("mongodb://localhost/comparamelo");
}

function disconnect(){
	return mongoose.disconnect();
}

module.exports.connect = connect;
module.exports.disconnect = disconnect;