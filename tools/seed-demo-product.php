<?php
/** Create an idempotent synthetic WooCommerce product for local/public browser checks. */

defined( 'ABSPATH' ) || exit;

if ( ! in_array( wp_get_environment_type(), array( 'local', 'development' ), true ) ) {
	WP_CLI::error( 'The Share Cards product seed is restricted to local/development environments.' );
}
if ( ! class_exists( 'WC_Product_Simple' ) ) {
	WP_CLI::error( 'WooCommerce must be active.' );
}

$existing = get_page_by_path( 'lineweb-share-cards-demo-product', OBJECT, 'product' );
$product  = $existing instanceof WP_Post ? wc_get_product( $existing->ID ) : new WC_Product_Simple();
if ( ! $product ) {
	WP_CLI::error( 'The existing demo product could not be loaded.' );
}

$product->set_name( 'Field Notes – Synthetic Demo' );
$product->set_slug( 'lineweb-share-cards-demo-product' );
$product->set_status( 'publish' );
$product->set_catalog_visibility( 'visible' );
$product->set_regular_price( '18.00' );
$product->set_manage_stock( true );
$product->set_stock_quantity( 24 );
$product->set_stock_status( 'instock' );
$product->set_description( 'Synthetic product created only for the Lineweb Share Cards local demonstration.' );
$product->save();

if ( ! $product->get_image_id() ) {
	$source = __DIR__ . '/demo-assets/field-notes.png';
	if ( file_exists( $source ) ) {
		$upload = wp_upload_bits( 'lineweb-share-cards-field-notes.png', null, file_get_contents( $source ) );
		if ( empty( $upload['error'] ) ) {
			$attachment_id = wp_insert_attachment(
				array(
					'post_mime_type' => 'image/png',
					'post_title'     => 'Field Notes – Synthetic Demo',
					'post_status'    => 'inherit',
				),
				$upload['file']
			);
			if ( ! is_wp_error( $attachment_id ) ) {
				require_once ABSPATH . 'wp-admin/includes/image.php';
				wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $upload['file'] ) );
				$product->set_image_id( $attachment_id );
				$product->save();
			}
		}
	}
}

WP_CLI::success( 'Share Cards demo product ID: ' . $product->get_id() );
