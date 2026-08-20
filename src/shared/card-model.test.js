import {
	cardContent,
	cardDimensions,
	hasStrongRtlCharacter,
	safeFilename,
	shareCaption,
} from './card-model';

describe( 'share card model', () => {
	it( 'uses exact social export dimensions', () => {
		expect( cardDimensions( 'portrait' ) ).toEqual(
			expect.objectContaining( { width: 1080, height: 1350 } )
		);
		expect( cardDimensions( 'unknown' ).width ).toBe( 1080 );
	} );

	it( 'builds honest content for statistics and products', () => {
		expect(
			cardContent( {
				mode: 'statistic',
				statistic: '42%',
				statisticLabel: 'fewer steps',
			} )
		).toEqual( { primary: '42%', secondary: 'fewer steps' } );
		expect(
			cardContent( {
				mode: 'product',
				product: {
					title: 'Field Notes',
					price: '€18.00',
					availability: 'In stock',
				},
			} ).secondary
		).toBe( '€18.00 · In stock' );
	} );

	it( 'creates a local caption and safe filename', () => {
		const config = {
			mode: 'quote',
			content: 'Useful, clear work',
			domain: 'example.com',
			pageUrl: 'https://example.com/guide/',
		};
		expect( shareCaption( config ) ).toContain( config.pageUrl );
		expect( safeFilename( config ) ).toBe(
			'example-com-useful-clear-work.png'
		);
	} );

	it( 'detects right-to-left text without changing Greek content', () => {
		expect( hasStrongRtlCharacter( 'مرحبا' ) ).toBe( true );
		expect( hasStrongRtlCharacter( 'Καλημέρα' ) ).toBe( false );
	} );
} );
