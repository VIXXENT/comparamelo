var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var articuloSchema = new Schema({
	precio:{
		type: Number,
		required: "No se ha informadoel precio del artículo."
	},
	marca:{
		type: String,
		default: "-",
		trim: true
	},
	modelo:{
		type: String,
		default: 0,
		trim: true
	},
	pagina:{
		type: String,
		required: "No se ha informado la página del artículo."
	}
});

module.exports = mongoose.model('Articulo', articuloSchema);