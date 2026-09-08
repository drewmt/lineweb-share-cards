import { expect, test } from '@wordpress/e2e-test-utils-playwright';

test( 'warns about shortened text and blocks exports when a selected image cannot load', async ( {
	page,
} ) => {
	await page.goto( '/wp-admin/admin.php?page=lineweb-share-cards-studio' );
	await page
		.getByLabel( 'Headline', { exact: true } )
		.fill( 'Long\n'.repeat( 104 ) );
	await page.getByLabel( 'Supporting text' ).fill( 'Context '.repeat( 20 ) );
	await page
		.getByLabel( 'Format', { exact: true } )
		.selectOption( 'landscape' );
	await expect(
		page.getByRole( 'button', { name: 'Download PNG', exact: true } )
	).toBeEnabled();
	await expect( page.getByRole( 'status' ) ).toContainText(
		'Some text was shortened to fit.'
	);
	const response = await page.request.get(
		'/wp-json/wc/store/v1/products?slug=lineweb-share-cards-demo-product'
	);
	const [ product ] = await response.json();
	await page.route( '**/uploads/**', ( route ) => route.abort() );
	await page.goto(
		`/wp-admin/admin.php?page=lineweb-share-cards-studio&source_id=${ product.id }`
	);
	await expect( page.getByRole( 'status' ) ).toContainText(
		'Preview could not be created.'
	);
	await expect(
		page.getByRole( 'button', { name: 'Download PNG', exact: true } )
	).toBeDisabled();
	await page
		.getByRole( 'button', { name: 'Remove image', exact: true } )
		.click();
	await page
		.getByRole( 'button', { name: 'Hide logo', exact: true } )
		.click();
	await expect(
		page.getByRole( 'button', { name: 'Download PNG', exact: true } )
	).toBeEnabled();
} );
