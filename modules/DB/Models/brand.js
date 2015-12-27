var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var brandSchema = new Schema({
	name:{
		type: String,
		required: "The brand name is required."
	},
	webPage:{
		type: String
	}
});

module.exports = mongoose.model('Brand', brandSchema);