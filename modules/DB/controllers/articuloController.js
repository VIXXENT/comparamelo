// -- NODE MODULES {
var vlog			= require('vlog');
var mongoose		= require('mongoose');
// -- }
// 
// -- LOCAL MODULES {
var Articulo	= require('../Models/articulo');
var saveCheck	= require('../basicCheckers/saveCheck');
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

function saveArticulos(articulos){//TODO: hay que cambiar el guardado individual a un bulk save --> http://andysandefer.com/wordpress/?p=30
	var links = articulos.links;
	if(links !== undefined){
		for(var key in links){
			saveArticulos(links[key]);
		}
	}else if (articulos.items){
		articulos.items.forEach(function eacharticulo(articulo){
			var articulo = initializeArticulo(articulo);
			articulo.save(saveCheck);
		});
	}
}

/**
 * Método que obtiene las diferentes marcas a las que pertenecen los artículos registrados en BD
 * Si recibe un callback, lo invoca con los resultados que obtiene de la consulta.
 * Retorna los resultados por si se quiere usar de forma síncriona.
 * 
 * @param {function} callBack
 * @returns {Array[String]} results
 */
function getDistinctBrands(callBack){
	Articulo.distinct('marca', function(err, results){
		if(err){
			vlog.vlog("ERROR - ",err);
		}else{
			vlog.vlog("Consulta OK, resultados: \n",results);
			if(callBack){
				callBack(results);
			}
			return results;
		}
	});
}

module.exports.initializeArticulo	= initializeArticulo;
module.exports.getDistinctBrands	= getDistinctBrands;
module.exports.saveArticulos		= saveArticulos;

//Idea para cuando maneje mongoose ¿un inicializador de cualquier model en base a las propiedades
//del objeto que se reciba por parámetro?
//Su objetivo sería recibir un objeto y comprobar si sus claves coinciden con las de algún modelo existente.
//si tiene más, no importa, pero si coincide con las de un moedlo (como mínimo) devolveremos una instancia
//de ese modelo inicializada con las propiedades que trae el objeto recibido por parámetro
//PEGA: si hay dos modelos que uno tenga todas las propiedades de otro, esta lógica podría causar errores
//debidos a confundir modelos
//var Articulo = mongoose.model('Articulo');
//var articuloKeys = Object.keys(new Articulo());