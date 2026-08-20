import type { Page } from '@playwright/test';

const knownPlatformWarnings = [
	'woocommerce-general-css',
	'woocommerce-classictheme-editor-fonts-css',
	'global-styles-css-custom-properties-inline-css',
];

function isKnownPlatformWarning( message: string ) {
	if ( message.includes( 'data-wp-init--mark-as-hydrated' ) ) {
		return true;
	}
	return knownPlatformWarnings.some( ( handle ) =>
		message.startsWith(
			`${ handle } was added to the iframe incorrectly. Please use block.json or enqueue_block_assets`
		)
	);
}

export function watchBrowserProblems( page: Page ) {
	const problems: string[] = [];
	page.on( 'console', ( message ) => {
		if (
			[ 'error', 'warning' ].includes( message.type() ) &&
			! isKnownPlatformWarning( message.text() )
		) {
			problems.push( `${ message.type() }: ${ message.text() }` );
		}
	} );
	page.on( 'pageerror', ( error ) => {
		problems.push( `pageerror: ${ error.message }` );
	} );
	return problems;
}
