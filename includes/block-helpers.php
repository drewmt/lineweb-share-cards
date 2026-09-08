<?php
/**
 * Shared sanitization and product helpers for Share Cards.
 *
 * @package Lineweb_Share_Cards
 */

defined( 'ABSPATH' ) || exit;

/**
 * Sanitize a bounded plain-text block attribute.
 *
 * @param mixed $value    Candidate value.
 * @param int   $max_len  Maximum Unicode characters.
 * @return string
 */
function lineweb_share_cards_text( $value, $max_len = 280 ) {
	$text = sanitize_text_field( is_scalar( $value ) ? (string) $value : '' );
	if ( function_exists( 'mb_substr' ) ) {
		return mb_substr( $text, 0, $max_len );
	}
	return substr( $text, 0, $max_len );
}
/**
 * Keep one value from an explicit allowlist.
 *
 * @param mixed    $value    Candidate value.
 * @param string[] $allowed  Allowed values.
 * @param string   $fallback Fallback value.
 * @return string
 */
function lineweb_share_cards_choice( $value, $allowed, $fallback ) {
	$value = is_string( $value ) ? $value : '';
	return in_array( $value, $allowed, true ) ? $value : $fallback;
}
/** Return a safe six-digit color. */
function lineweb_share_cards_color( $value, $fallback ) {
	$color = sanitize_hex_color( is_string( $value ) ? $value : '' );
	if ( $color && 4 === strlen( $color ) ) {
		$color = '#' . $color[1] . $color[1] . $color[2] . $color[2] . $color[3] . $color[3];
	}
	return $color ?: $fallback;
}

/** Return the site's display domain without protocol or a trailing slash. */
function lineweb_share_cards_site_domain() {
	$host = wp_parse_url( home_url( '/' ), PHP_URL_HOST );
	return is_string( $host ) ? preg_replace( '/^www\./i', '', $host ) : '';
}

/** Resolve the best local site mark, without requesting an external service. */
function lineweb_share_cards_default_logo_url() {
	$custom_logo_id = (int) get_theme_mod( 'custom_logo' );
	if ( $custom_logo_id > 0 ) {
		$url = wp_get_attachment_image_url( $custom_logo_id, 'medium' );
		if ( is_string( $url ) ) {
			return $url;
		}
	}

	$site_icon = get_site_icon_url( 256 );
	return is_string( $site_icon ) ? $site_icon : '';
}

/**
 * Resolve a published, catalog-visible WooCommerce product.
 *
 * @param mixed $product_id Candidate product ID.
 * @return WC_Product|null
 */
function lineweb_share_cards_product( $product_id ) {
	if ( ! function_exists( 'wc_get_product' ) ) {
		return null;
	}

	$product = wc_get_product( absint( $product_id ) );
	if ( ! $product || 'publish' !== get_post_status( $product->get_id() ) || ! $product->is_visible() ) {
		return null;
	}

	return $product;
}
