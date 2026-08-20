import type { Page } from '@playwright/test';
import { expect, test } from '@wordpress/e2e-test-utils-playwright';

import { watchBrowserProblems } from './browser-problems';

async function expectNoOverflow( page: Page ) {
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth > window.innerWidth
	);
	expect( overflow ).toBe( false );
}

test( 'shows a focused plugin home with working creation links', async ( {
	page,
} ) => {
	const browserProblems = watchBrowserProblems( page );
	await page.goto( '/wp-admin/admin.php?page=lineweb-share-cards' );

	await expect(
		page.getByRole( 'heading', {
			name: 'Turn the useful part of a page into an image people can carry with them.',
		} )
	).toBeVisible();
	await expect( page.getByText( 'Share Cards is active' ) ).toBeVisible();
	await expect(
		page.getByRole( 'link', { name: 'Create on a page' } )
	).toHaveAttribute( 'href', /post-new\.php\?post_type=page/ );
	const logo = page.locator( '.lineweb-suite-admin__brand-mark' );
	await expect( logo ).toBeVisible();
	const brand = page.locator( '.lineweb-suite-admin__brand-card' );
	const logoBox = await logo.boundingBox();
	const brandBox = await brand.boundingBox();
	expect(
		Math.abs(
			logoBox!.x +
				logoBox!.width / 2 -
				( brandBox!.x + brandBox!.width / 2 )
		)
	).toBeLessThan( 2 );

	await page.screenshot( {
		path: 'artifacts-share-cards/admin-hub.png',
		fullPage: true,
	} );
	expect( browserProblems ).toEqual( [] );
} );

test( 'publishes, downloads, and copies a source-aware quote card', async ( {
	admin,
	context,
	editor,
	page,
} ) => {
	const browserProblems = watchBrowserProblems( page );
	await context.grantPermissions( [ 'clipboard-read', 'clipboard-write' ] );
	await admin.createNewPost( {
		postType: 'page',
		title: 'Ideas worth carrying forward',
		showWelcomeGuide: false,
	} );
	await editor.insertBlock( {
		name: 'lineweb-share-cards/share-card',
		attributes: {
			align: 'wide',
			mode: 'quote',
			ratio: 'landscape',
			eyebrow: 'A useful principle',
			content:
				'The best tool removes one repeated frustration without inventing a new workflow.',
			source: 'Synthetic editorial example',
			showQr: true,
		},
	} );

	const editorCard = editor.canvas.locator(
		'.wp-block-lineweb-share-cards-share-card'
	);
	await expect( editorCard ).toBeVisible();
	await expect( editorCard.locator( 'blockquote' ) ).toContainText(
		'The best tool removes one repeated frustration'
	);
	await page.screenshot( {
		path: 'artifacts-share-cards/editor.png',
		fullPage: true,
	} );

	const postId = await editor.publishPost();
	await page.goto( `/?page_id=${ postId }` );
	const publishedUrl = page.url();
	const card = page.locator( '.wp-block-lineweb-share-cards-share-card' );
	await expect( card ).toBeVisible();
	await expect( card.locator( 'blockquote' ) ).toContainText(
		'The best tool removes one repeated frustration'
	);
	await expect( card.locator( '.lwsc-card__qr canvas' ) ).toBeVisible();
	const downloadButton = card.getByRole( 'button', { name: 'Download PNG' } );
	await downloadButton.focus();
	const focusShadow = await downloadButton.evaluate(
		( element ) => window.getComputedStyle( element ).boxShadow
	);
	expect( focusShadow ).not.toBe( 'none' );

	const downloadPromise = page.waitForEvent( 'download' );
	await downloadButton.click();
	const download = await downloadPromise;
	expect( download.suggestedFilename() ).toMatch( /\.png$/ );
	await download.saveAs( 'artifacts-share-cards/generated-quote.png' );
	await expect( card.getByRole( 'status' ) ).toHaveText( 'PNG downloaded.' );

	await card.getByRole( 'button', { name: 'Copy caption' } ).click();
	await expect( card.getByRole( 'status' ) ).toHaveText( 'Caption copied.' );
	const clipboard = await page.evaluate( () =>
		navigator.clipboard.readText()
	);
	expect( clipboard ).toContain(
		'The best tool removes one repeated frustration'
	);
	expect( clipboard ).toContain( publishedUrl );

	await page.screenshot( {
		path: 'artifacts-share-cards/quote-desktop.png',
		fullPage: true,
	} );
	await page.evaluate( () => {
		document.documentElement.style.zoom = '2';
	} );
	await expectNoOverflow( page );
	await page.evaluate( () => {
		document.documentElement.style.zoom = '';
	} );
	await page.setViewportSize( { width: 375, height: 812 } );
	await expectNoOverflow( page );
	const downloadBox = await card
		.getByRole( 'button', { name: 'Download PNG' } )
		.boundingBox();
	expect( downloadBox?.height ).toBeGreaterThanOrEqual( 44 );
	await page.screenshot( {
		path: 'artifacts-share-cards/quote-mobile.png',
		fullPage: true,
	} );
	await page.setViewportSize( { width: 320, height: 700 } );
	await expectNoOverflow( page );
	expect( browserProblems ).toEqual( [] );
} );

test( 'uses live WooCommerce title, price, stock, and link', async ( {
	admin,
	editor,
	page,
} ) => {
	const browserProblems = watchBrowserProblems( page );
	const response = await page.request.get(
		'/wp-json/wc/store/v1/products?slug=lineweb-share-cards-demo-product'
	);
	expect( response.ok() ).toBe( true );
	const products = await response.json();
	expect( products ).toHaveLength( 1 );

	await admin.createNewPost( {
		postType: 'page',
		title: 'A useful product highlight',
		showWelcomeGuide: false,
	} );
	await editor.insertBlock( {
		name: 'lineweb-share-cards/share-card',
		attributes: {
			align: 'wide',
			mode: 'product',
			ratio: 'portrait',
			theme: 'minimal',
			backgroundColor: '#ffffff',
			textColor: '#171717',
			accentColor: '#171717',
			eyebrow: 'Product highlight',
			productId: products[ 0 ].id,
		},
	} );
	await expect(
		editor.canvas.getByText( 'Field Notes – Synthetic Demo' )
	).toBeVisible();

	const postId = await editor.publishPost();
	await page.goto( `/?page_id=${ postId }` );
	const card = page.locator( '.wp-block-lineweb-share-cards-share-card' );
	await expect(
		card.getByText( 'Field Notes – Synthetic Demo' )
	).toBeVisible();
	await expect( card.locator( '.lwsc-card__product-meta' ) ).toContainText(
		'18.00'
	);
	await expect( card.locator( '.lwsc-card__product-meta' ) ).toContainText(
		'In stock'
	);
	await expect(
		card.getByRole( 'link', { name: 'View product' } )
	).toHaveAttribute( 'href', /lineweb-share-cards-demo-product/ );
	await page.screenshot( {
		path: 'artifacts-share-cards/product-card.png',
		fullPage: true,
	} );
	expect( browserProblems ).toEqual( [] );
} );
