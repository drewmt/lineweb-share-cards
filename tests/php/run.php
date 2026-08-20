<?php
/** Minimal pure-helper regression tests without booting WordPress. */

define( 'ABSPATH', __DIR__ );

function sanitize_text_field( $value ) {
	return trim( strip_tags( (string) $value ) );
}
function sanitize_hex_color( $value ) {
	return preg_match( '/^#[0-9a-f]{6}$/i', $value ) ? $value : '';
}

require_once dirname( __DIR__, 2 ) . '/includes/block-helpers.php';

if ( 'Plain text' !== lineweb_share_cards_text( '<b>Plain text</b>', 30 ) ) {
	fwrite( STDERR, "FAIL: text attributes are sanitized\n" );
	exit( 1 );
}
if ( 'quote' !== lineweb_share_cards_choice( 'script', array( 'quote', 'statistic' ), 'quote' ) ) {
	fwrite( STDERR, "FAIL: enumerated attributes fail closed\n" );
	exit( 1 );
}
if ( '#173b32' !== lineweb_share_cards_color( '#173b32', '#ffffff' ) || '#ffffff' !== lineweb_share_cards_color( 'red', '#ffffff' ) ) {
	fwrite( STDERR, "FAIL: colors are explicit six-digit values\n" );
	exit( 1 );
}

echo "PASS: Share Card text, choice, and color helpers\n";
