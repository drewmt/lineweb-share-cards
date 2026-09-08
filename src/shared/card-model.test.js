import {
	cardContent,
	cardDimensions,
	cardFont,
	exportFilename,
	hasStrongRtlCharacter,
	safeFilename,
	shareCaption,
} from './card-model';

describe( 'share card model', () => {
	it( 'exports Story with a distinct filename and restricts fonts', () => {
		expect( cardDimensions( 'story' ) ).toEqual(
			expect.objectContaining( { width: 1080, height: 1920 } )
		);
		expect( exportFilename( { content: 'Card', ratio: 'story' } ) ).toBe(
			'card-1080x1920.png'
		);
		expect( cardFont( 'remote-url' ) ).toBe( 'Arial, sans-serif' );
		expect( cardFont( 'serif' ) ).toBe( 'Georgia, serif' );
	} );
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
