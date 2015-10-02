import { blank } from '../utils/object';

const extractors = {
	Identifier ( names, param ) {
		names.push( param.name );
	},

	ObjectPattern ( names, param ) {
		param.properties.forEach( prop => {
			extractors[ prop.key.type ]( names, prop.key );
		});
	},

	ArrayPattern ( names, param ) {
		param.elements.forEach( element => {
			if ( element ) extractors[ element.type ]( names, element );
		});
	},

	RestElement ( names, param ) {
		extractors[ param.argument.type ]( names, param.argument );
	},

	AssignmentPattern ( names, param ) {
		return extractors[ param.left.type ]( names, param.left );
	}
};

function extractNames ( param ) {
	let names = [];

	extractors[ param.type ]( names, param );
	return names;
}

class Declaration {
	constructor ( node ) {
		this.references = [];
	}
}

export default class Scope {
	constructor ( options ) {
		options = options || {};

		this.parent = options.parent;
		this.isBlockScope = !!options.block;

		this.declarations = blank();

		if ( options.params ) {
			options.params.forEach( param => {
				extractNames( param ).forEach( name => {
					this.declarations[ name ] = new Declaration( param );
				});
			});
		}
	}

	addDeclaration ( node, isBlockDeclaration, isVar ) {
		if ( !isBlockDeclaration && this.isBlockScope ) {
			// it's a `var` or function node, and this
			// is a block scope, so we need to go up
			this.parent.addDeclaration( node, isBlockDeclaration, isVar );
		} else {
			extractNames( node.id ).forEach( name => {
				this.declarations[ name ] = new Declaration( node );
			});
		}
	}

	contains ( name ) {
		return this.declarations[ name ] ||
		       ( this.parent ? this.parent.contains( name ) : false );
	}

	findDeclaration ( name ) {
		return this.declarations[ name ] ||
		       ( this.parent && this.parent.findDeclaration( name ) );
	}

	findDefiningScope ( name ) {
		if ( this.declarations[ name ] ) {
			return this;
		}

		if ( this.parent ) {
			return this.parent.findDefiningScope( name );
		}

		return null;
	}
}
