import { readFile } from 'node:fs/promises';
import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import { watchBrowserProblems } from './browser-problems';

test( 'creates four exact PNG sizes from a product and persists administrator brand defaults', async ( {
	page,
} ) => {
	const problems = watchBrowserProblems( page );
	const response = await page.request.get(
		'/wp-json/wc/store/v1/products?slug=lineweb-share-cards-demo-product'
	);
	const [ product ] = await response.json();
	await page.goto(
		`/wp-admin/admin.php?page=lineweb-share-cards-studio&source_id=${ product.id }`
	);
	const originalBrand = await page.evaluate(
		() => window.linewebShareCardsStudio.brand
	);
	try {
		await expect(
			page.getByLabel( 'Headline', { exact: true } )
		).toHaveValue( 'Field Notes – Synthetic Demo' );
		await expect( page.getByLabel( 'Supporting text' ) ).toHaveValue(
			/18.00.*In stock/
		);
		await page
			.getByLabel( 'Small heading' )
			.fill( 'GOOD IDEAS START HERE' );
		await page
			.getByLabel( 'Headline', { exact: true } )
			.fill( 'Make room for your next good idea.' );
		await page
			.getByLabel( 'Supporting text' )
			.fill( 'Field Notes · A synthetic product example' );
		await page
			.getByLabel( 'Background', { exact: true } )
			.fill( '#f4efe9' );
		await page.getByLabel( 'Accent', { exact: true } ).fill( '#214d36' );
		await page
			.getByLabel( 'Font', { exact: true } )
			.selectOption( 'serif' );
		const png = page.getByRole( 'button', {
			name: 'Download PNG',
			exact: true,
		} );
		const preview = page.locator( '[data-preview]' );
		for ( const template of [
			'editorial',
			'split',
			'poster',
			'minimal',
		] ) {
			await page
				.getByLabel( 'Template', { exact: true } )
				.selectOption( template );
			await expect( png ).toBeEnabled();
			await expect( preview ).toBeVisible();
			await preview.screenshot( {
				path: `artifacts-share-cards/template-${ template }.png`,
			} );
		}
		await page
			.getByLabel( 'Template', { exact: true } )
			.selectOption( 'editorial' );
		await page
			.getByLabel( 'Format', { exact: true } )
			.selectOption( 'story' );
		await expect( png ).toBeEnabled();
		expect(
			await preview.evaluate( ( image: HTMLImageElement ) => [
				image.naturalWidth,
				image.naturalHeight,
			] )
		).toEqual( [ 1080, 1920 ] );
		const pngPromise = page.waitForEvent( 'download' );
		await png.click();
		const pngDownload = await pngPromise;
		await pngDownload.saveAs( 'artifacts-share-cards/studio-story.png' );
		const pngBytes = await readFile( await pngDownload.path() );
		expect( [
			pngBytes.readUInt32BE( 16 ),
			pngBytes.readUInt32BE( 20 ),
		] ).toEqual( [ 1080, 1920 ] );
		const zipPromise = page.waitForEvent( 'download' );
		await page
			.getByRole( 'button', {
				name: 'Download all 4 formats (ZIP)',
				exact: true,
			} )
			.click();
		const archive = await zipPromise;
		await archive.saveAs( 'artifacts-share-cards/studio-formats.zip' );
		const bytes = await readFile( await archive.path() );
		const dimensions = [];
		let offset = 0;
		while ( bytes.readUInt32LE( offset ) === 0x04034b50 ) {
			const size = bytes.readUInt32LE( offset + 18 );
			const start =
				offset +
				30 +
				bytes.readUInt16LE( offset + 26 ) +
				bytes.readUInt16LE( offset + 28 );
			dimensions.push( [
				bytes.readUInt32BE( start + 16 ),
				bytes.readUInt32BE( start + 20 ),
			] );
			offset = start + size;
		}
		expect( dimensions ).toEqual( [
			[ 1080, 1080 ],
			[ 1080, 1350 ],
			[ 1200, 630 ],
			[ 1080, 1920 ],
		] );
		await page
			.getByRole( 'button', { name: 'Save brand defaults', exact: true } )
			.click();
		await expect( page.getByRole( 'status' ) ).toHaveText(
			'Brand defaults saved for future cards.'
		);
		await page.reload();
		await expect(
			page.getByLabel( 'Accent', { exact: true } )
		).toHaveValue( '#214d36' );
		await expect( page.getByLabel( 'Font', { exact: true } ) ).toHaveValue(
			'serif'
		);
		await expect( png ).toBeEnabled();
		await page.evaluate( () => window.scrollTo( 0, 0 ) );
		await page.screenshot( {
			path: 'artifacts-share-cards/studio-desktop.png',
			fullPage: true,
		} );
		await png.focus();
		expect(
			await png.evaluate(
				( element ) => getComputedStyle( element ).boxShadow
			)
		).not.toBe( 'none' );
		await page.evaluate( () => {
			document.documentElement.style.zoom = '2';
		} );
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth > innerWidth
			)
		).toBe( false );
		await page.evaluate( () => {
			document.documentElement.style.zoom = '';
		} );
		for ( const width of [ 375, 320 ] ) {
			await page.setViewportSize( { width, height: 812 } );
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth > innerWidth
				)
			).toBe( false );
		}
		await page.screenshot( {
			path: 'artifacts-share-cards/studio-mobile.png',
			fullPage: true,
		} );
		await page.locator( '[data-lwsc-studio]' ).evaluate( ( element ) => {
			element.setAttribute( 'dir', 'rtl' );
		} );
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth > innerWidth
			)
		).toBe( false );
		expect( problems ).toEqual( [] );
	} finally {
		await page.evaluate( async ( brand ) => {
			await fetch( window.linewebShareCardsStudio.brandUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.linewebShareCardsStudio.nonce,
				},
				body: JSON.stringify( brand ),
			} );
		}, originalBrand );
	}
} );

test( 'opens a published article from its row action without changing it', async ( {
	page,
	requestUtils,
} ) => {
	const post = await requestUtils.createPost( {
		title: 'A small guide to better everyday work',
		status: 'publish',
		content: 'Synthetic fixture. This article must remain unchanged.',
	} );
	try {
		await page.goto(
			`/wp-admin/edit.php?s=${ encodeURIComponent( post.title.raw ) }`
		);
		const row = page.locator( `#post-${ post.id }` );
		await row.hover();
		await row.getByRole( 'link', { name: 'Create social image' } ).click();
		await expect(
			page.getByLabel( 'Headline', { exact: true } )
		).toHaveValue( post.title.raw );
		await expect(
			page.getByRole( 'button', { name: 'Download PNG', exact: true } )
		).toBeEnabled();
		await page
			.getByLabel( 'Headline', { exact: true } )
			.fill( 'Απλές ιδέες για καλύτερη καθημερινότητα' );
		await page
			.getByLabel( 'Format', { exact: true } )
			.selectOption( 'landscape' );
		await expect(
			page.getByRole( 'button', { name: 'Download PNG', exact: true } )
		).toBeEnabled();
		const unchanged = await requestUtils.rest( {
			path: `/wp/v2/posts/${ post.id }`,
			params: { context: 'edit' },
		} );
		expect( unchanged.title.raw ).toBe( post.title.raw );
		expect( unchanged.content.raw ).toBe( post.content.raw );
		const withoutNonce = await page.request.post(
			'/wp-json/lineweb-share-cards/v1/brand',
			{ data: { font: 'mono' } }
		);
		expect( [ 401, 403 ] ).toContain( withoutNonce.status() );
		await page.goto( '/wp-admin/index.php' );
		expect(
			await page
				.locator(
					'script[src*="lineweb-share-cards/build/studio"],link[href*="lineweb-share-cards/build/studio"]'
				)
				.count()
		).toBe( 0 );
	} finally {
		await requestUtils.rest( {
			path: `/wp/v2/posts/${ post.id }`,
			method: 'DELETE',
			params: { force: true },
		} );
	}
} );
