function CodeLocator(){
	this.file	="<unknown_file>";
	this.line	="<unknown_line>";
	this.column	="<unknown_line>";
	this.method	="<unknown_function>";
	this.describe = function(){return this.method+" ("+this.file+":"+this.line+")";};
}

CodeLocator.locate = function(){
	return getLocationInfo(2)[0].describe();
};

CodeLocator.getLocator = function(){
	return getLocationInfo(2)[0];
};

CodeLocator.getStack = function(){
	return getLocationInfo(2);
};

CodeLocator.vlog = function(){
	console.log("\n"+getLocationInfo(2)[0].describe());
	
	if(arguments.length>0){
		console.log.apply(console, arguments);
	}
};

//E:\My Zone\Proyectos\MEAN stack\NodeProjects\HiWorld\s

function getLocationInfo(level){
	if(level === undefined){level = 0;}

	var err = null;
	try{throw new Error();}catch(error){err = error;}
	var stack = err.stack.split(/\r\n|\n/);
	var rxpLocation		= /[^\/\\]*:[0-9]+:[0-9]+/;
	var rxpFunction		= /(at)([^\/\\(]+)(\()/;
	var locatorStack = [];

	for(var errorLine in stack){
		if(rxpLocation.exec(stack[errorLine])){
			
			var locator = new CodeLocator();

			var fileLineColumn = rxpLocation.exec(stack[errorLine])[0].split(':');
			var method = rxpFunction.exec(stack[errorLine]);

			locator.file		= fileLineColumn[0];
			locator.line		= fileLineColumn[1];
			locator.column	= fileLineColumn[2];
			if(method && method[2]){
				locator.method	= method[2].trim();
			}
			
			locatorStack.push(locator);
		}
	}

	for(var i = 0; i<level; i++){
		locatorStack.splice(0,1);
	}

	return(locatorStack);
}

function getLocationInfoBrowser(level){
	if(level === undefined){level = 0;}

	var err = null;
	try{throw new Error();}catch(error){err = error;}
	var stack = err.stack.split(/\r\n|\n/);
	var rxpLocation		= /[^\/]*:[0-9]+:[0-9]+/;
	var rxpFunction		= /(at)([^\(]+)(\()/;
	var locatorStack = [];

	for(var errorLine in stack){
		if(rxpLocation.exec(stack[errorLine])){
			
			var locator = new CodeLocator();

			var fileLineColumn = rxpLocation.exec(stack[errorLine])[0].split(':');
			var method = rxpFunction.exec(stack[errorLine]);

			locator.file		= fileLineColumn[0];
			locator.line		= fileLineColumn[1];
			locator.column	= fileLineColumn[2];
			if(method && method[2]){
				locator.method	= method[2].trim();
			}
			
			locatorStack.push(locator);
		}
	}

	for(var i = 0; i<level; i++){
		locatorStack.splice(0,1);
	}

	return(locatorStack);
}

if(typeof module !== 'undefined'){
	module.exports.getLocator = CodeLocator.getLocator;
	module.exports.getStack = CodeLocator.getStack;
	module.exports.CodeLocator = CodeLocator;
	module.exports.locate = CodeLocator.locate;
	module.exports.vlog = CodeLocator.vlog;
}