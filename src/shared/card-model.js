export const CARD_RATIOS = Object.freeze( {
	square: { width: 1080, height: 1080, label: 'Square · 1080 × 1080' },
	portrait: { width: 1080, height: 1350, label: 'Portrait · 1080 × 1350' },
	landscape: { width: 1200, height: 630, label: 'Landscape · 1200 × 630' },
	story: { width: 1080, height: 1920, label: 'Story · 1080 × 1920' },
} );

export const CARD_FONTS = Object.freeze( {
	sans: 'Arial, sans-serif',
	serif: 'Georgia, serif',
	mono: 'Courier New, monospace',
} );

export function cardFont( font ) {
	return CARD_FONTS[ font ] || CARD_FONTS.sans;
}

export function exportFilename( config ) {
	const { width, height } = cardDimensions( config.ratio );
	return safeFilename( config ).replace(
		/\.png$/,
		`-${ width }x${ height }.png`
	);
}

export function cardDimensions( ratio ) {
	return CARD_RATIOS[ ratio ] || CARD_RATIOS.square;
}

export function cardContent( config ) {
	if ( config.mode === 'statistic' ) {
		return {
			primary: String( config.statistic || '3×' ),
			secondary: String( config.statisticLabel || '' ),
		};
	}

	if ( config.mode === 'product' && config.product ) {
		return {
			primary: String( config.product.title || '' ),
			secondary: [ config.product.price, config.product.availability ]
				.filter( Boolean )
				.join( ' · ' ),
		};
	}

	return {
		primary: String( config.content || '' ),
		secondary: String( config.source || '' ),
	};
}

export function shareCaption( config ) {
	if ( String( config.caption || '' ).trim() ) {
		return String( config.caption ).trim();
	}
	const content = cardContent( config );
	return [ content.primary, content.secondary, config.pageUrl ]
		.filter( Boolean )
		.join( '\n' );
}

export function safeFilename( config ) {
	const stem = [ config.domain, cardContent( config ).primary ]
		.filter( Boolean )
		.join( '-' )
		.normalize( 'NFKD' )
		.replace( /[^a-z0-9\u0370-\u03ff]+/gi, '-' )
		.replace( /^-+|-+$/g, '' )
		.slice( 0, 72 )
		.toLowerCase();
	return `${ stem || 'share-card' }.png`;
}

export function hasStrongRtlCharacter( value ) {
	return /[\u0590-\u08ff]/.test( String( value || '' ) );
}
