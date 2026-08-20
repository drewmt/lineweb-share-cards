<?php
/**
 * Plugin Name:       Shareable Quote Images & Social Cards – Lineweb Share Cards
 * Description:       Turn quotes, takeaways, statistics, and WooCommerce products into branded PNG cards visitors can share or download.
 * Version:           0.1.0
 * Requires at least: 6.9
 * Requires PHP:      8.3
 * Author:            Lineweb
 * Author URI:        https://lineweb.gr/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       lineweb-share-cards
 *
 * @package Lineweb_Share_Cards
 */

defined( 'ABSPATH' ) || exit;

define( 'LINEWEB_SHARE_CARDS_VERSION', '0.1.0' );
define( 'LINEWEB_SHARE_CARDS_FILE', __FILE__ );
define( 'LINEWEB_SHARE_CARDS_DIR', __DIR__ );
define( 'LINEWEB_SHARE_CARDS_URL', plugin_dir_url( __FILE__ ) );

require_once __DIR__ . '/includes/block-helpers.php';
require_once __DIR__ . '/includes/admin-page.php';

/** Load bundled translations for direct ZIP installations. */
function lineweb_share_cards_load_textdomain() {
	load_plugin_textdomain( 'lineweb-share-cards', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}
add_action( 'init', 'lineweb_share_cards_load_textdomain', 1 );

/**
 * Add a focused inserter category without duplicating the wider Lineweb category.
 *
 * @param array<int, array<string, string>> $categories Existing block categories.
 * @return array<int, array<string, string>>
 */
function lineweb_share_cards_category( $categories ) {
	foreach ( $categories as $category ) {
		if ( isset( $category['slug'] ) && 'lineweb' === $category['slug'] ) {
			return $categories;
		}
	}

	array_unshift(
		$categories,
		array(
			'slug'  => 'lineweb',
			'title' => __( 'Lineweb', 'lineweb-share-cards' ),
		)
	);

	return $categories;
}
add_filter( 'block_categories_all', 'lineweb_share_cards_category' );

/** Register the compiled Share Card block and its editor bootstrap data. */
function lineweb_share_cards_init() {
	register_block_type( __DIR__ . '/build/share-card' );

	$asset_file = __DIR__ . '/build/share-card/index.asset.php';
	if ( ! is_admin() || ! file_exists( $asset_file ) ) {
		return;
	}

	$asset = require $asset_file;
	if ( empty( $asset['dependencies'] ) || ! is_array( $asset['dependencies'] ) ) {
		return;
	}

	wp_add_inline_script(
		'lineweb-share-cards-share-card-editor-script',
		'window.linewebShareCardsEditor=' . wp_json_encode(
			array(
				'siteTitle'      => get_bloginfo( 'name' ),
				'domain'         => lineweb_share_cards_site_domain(),
				'defaultLogoUrl' => lineweb_share_cards_default_logo_url(),
				'wooActive'      => class_exists( 'WooCommerce' ),
			)
		) . ';',
		'before'
	);
}
add_action( 'init', 'lineweb_share_cards_init' );
