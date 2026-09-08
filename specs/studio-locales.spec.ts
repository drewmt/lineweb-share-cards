import { expect, test } from '@wordpress/e2e-test-utils-playwright';

test( 'loads Greek studio messages and the real RTL administration stylesheet', async ( {
	page,
	requestUtils,
} ) => {
	const user = await requestUtils.rest( {
		path: '/wp/v2/users/me',
		params: { context: 'edit' },
	} );
	try {
		await requestUtils.rest( {
			path: '/wp/v2/users/me',
			method: 'POST',
			data: { locale: 'el' },
		} );
		await page.goto(
			'/wp-admin/admin.php?page=lineweb-share-cards-studio'
		);
		await expect(
			page.getByRole( 'button', {
				name: 'Λήψη και των 4 μορφών (ZIP)',
				exact: true,
			} )
		).toBeEnabled();
		await expect( page.getByRole( 'status' ) ).toHaveText(
			'Η προεπισκόπηση είναι έτοιμη. Θα κατεβάσετε ακριβώς αυτή την εικόνα.'
		);
		await page
			.getByLabel( 'Τίτλος', { exact: true } )
			.fill( 'Μια μικρή ιδέα που αξίζει να μοιραστείτε.' );
		await expect( page.getByRole( 'status' ) ).toHaveText(
			'Η προεπισκόπηση είναι έτοιμη. Θα κατεβάσετε ακριβώς αυτή την εικόνα.'
		);
		await requestUtils.rest( {
			path: '/wp/v2/users/me',
			method: 'POST',
			data: { locale: 'ar' },
		} );
		await page.goto(
			'/wp-admin/admin.php?page=lineweb-share-cards-studio'
		);
		await expect( page.locator( 'html' ) ).toHaveAttribute( 'dir', 'rtl' );
		await expect(
			page.locator( '#lineweb-share-cards-studio-rtl-css' )
		).toHaveAttribute( 'href', /index-rtl\.css/ );
		await page
			.getByLabel( 'Headline', { exact: true } )
			.fill( 'فكرة صغيرة تستحق المشاركة' );
		await expect(
			page.getByRole( 'button', { name: 'Download PNG', exact: true } )
		).toBeEnabled();
		await page.setViewportSize( { width: 320, height: 812 } );
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth > innerWidth
			)
		).toBe( false );
	} finally {
		await requestUtils.rest( {
			path: '/wp/v2/users/me',
			method: 'POST',
			data: { locale: user.locale || 'en_US' },
		} );
	}
} );
