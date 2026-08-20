import { writeFile } from 'node:fs/promises';

const wordpressVersion = process.env.WP_VERSION || 'latest';
const woocommerceVersion = process.env.WOO_VERSION || '10.9.4';
const phpVersion = process.env.PHP_VERSION || '8.3';
const mode = process.env.WP_ENV_MODE || 'source';

if (
	wordpressVersion !== 'latest' &&
	! /^\d+\.\d+(?:\.\d+)?$/.test( wordpressVersion )
) {
	throw new Error( `Unsupported WordPress version: ${ wordpressVersion }` );
}
if ( ! /^\d+\.\d+(?:\.\d+)?$/.test( woocommerceVersion ) ) {
	throw new Error(
		`Unsupported WooCommerce version: ${ woocommerceVersion }`
	);
}
if ( ! [ '8.3', '8.4', '8.5' ].includes( phpVersion ) ) {
	throw new Error( `Unsupported PHP version: ${ phpVersion }` );
}
if ( ! [ 'archive', 'source' ].includes( mode ) ) {
	throw new Error( `Unsupported wp-env mode: ${ mode }` );
}

const mappings =
	mode === 'archive'
		? { 'wp-content/lineweb-ci': '.' }
		: { 'wp-content/plugins/lineweb-share-cards': '.' };
const config = {
	core:
		wordpressVersion === 'latest'
			? null
			: `https://wordpress.org/wordpress-${ wordpressVersion }.zip`,
	phpVersion,
	plugins: [
		`https://downloads.wordpress.org/plugin/woocommerce.${ woocommerceVersion }.zip`,
	],
	mappings,
	testsEnvironment: false,
	config: { WP_DEBUG: true, SCRIPT_DEBUG: true },
};

await writeFile( '.wp-env.json', `${ JSON.stringify( config, null, 2 ) }\n` );
