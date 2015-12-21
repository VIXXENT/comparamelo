// -- NODE MODULES {
var vlog			= require('vlog');
var mongoose		= require('mongoose');
// -- }
// 
// -- LOCAL MODULES {
var Articulo	= require('../Models/articulo');
// -- }

function initializeArticulo(initObj){
	//var Articulo = mongoose.model('Articulo');
	var articulo = new Articulo();
	
	for(var key in articulo){
		var value = initObj[key];
		if(value!==undefined){
			articulo[key] = value;
		}
	}
	return articulo;
}

module.exports.newarticulo = initializeArticulo;

//Idea para cuando maneje mongoose ¿un inicializador de cualquier model en base a las propiedades
//del objeto que se reciba por parámetro?
//Su objetivo sería recibir un objeto y comprobar si sus claves coinciden con las de algún modelo existente.
//si tiene más, no importa, pero si coincide con las de un moedlo (como mínimo) devolveremos una instancia
//de ese modelo inicializada con las propiedades que trae el objeto recibido por parámetro
//PEGA: si hay dos modelos que uno tenga todas las propiedades de otro, esta lógica podría causar errores
//debidos a confundir modelos
//var Articulo = mongoose.model('Articulo');
//var articuloKeys = Object.keys(new Articulo());