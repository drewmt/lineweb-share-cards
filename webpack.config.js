const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const withStableIds = ( config ) => ( {
	...config,
	optimization: {
		...config.optimization,
		moduleIds: 'named',
		chunkIds: 'named',
	},
} );

module.exports = Array.isArray( defaultConfig )
	? defaultConfig.map( withStableIds )
	: withStableIds( defaultConfig );
