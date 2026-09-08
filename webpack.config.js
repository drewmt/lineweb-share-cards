const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const withStableIds = ( config ) => ( {
	...config,
	...( ! config.experiments?.outputModule && {
		entry: () => ( {
			...( typeof config.entry === 'function'
				? config.entry()
				: config.entry ),
			'studio/index': './src/studio/index.js',
		} ),
	} ),
	optimization: {
		...config.optimization,
		moduleIds: 'named',
		chunkIds: 'named',
	},
} );

module.exports = Array.isArray( defaultConfig )
	? defaultConfig.map( withStableIds )
	: withStableIds( defaultConfig );
