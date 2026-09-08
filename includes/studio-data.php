<?php
/** Studio branding, source permissions, and row actions. @package Lineweb_Share_Cards */

defined( 'ABSPATH' ) || exit;

/** Normalize only the supported branding fields. */
function lineweb_share_cards_sanitize_brand( $input ) {
	$input = is_array( $input ) ? $input : array();
	$logo_id = isset( $input['logoId'] ) && is_scalar( $input['logoId'] ) ? absint( $input['logoId'] ) : 0;
	if ( $logo_id && ! wp_attachment_is_image( $logo_id ) ) {
		$logo_id = 0;
	}
	return array(
		'backgroundColor' => lineweb_share_cards_color( $input['backgroundColor'] ?? '', '#f4efe9' ),
		'textColor'       => lineweb_share_cards_color( $input['textColor'] ?? '', '#1b1715' ),
		'accentColor'     => lineweb_share_cards_color( $input['accentColor'] ?? '', '#d64a31' ),
		'font'            => lineweb_share_cards_choice( $input['font'] ?? '', array( 'sans', 'serif', 'mono' ), 'sans' ),
		'logoId'          => $logo_id,
		'showLogo'        => ! isset( $input['showLogo'] ) || true === $input['showLogo'],
	);
}

/** Site-wide defaults, resolved locally from the Media Library. */
function lineweb_share_cards_brand() {
	$brand = lineweb_share_cards_sanitize_brand( get_option( 'lineweb_share_cards_brand', array() ) );
	$brand['logoUrl'] = $brand['logoId'] ? ( wp_get_attachment_image_url( $brand['logoId'], 'medium' ) ?: '' ) : lineweb_share_cards_default_logo_url();
	if ( ! $brand['showLogo'] ) {
		$brand['logoUrl'] = '';
	}
	return $brand;
}

/** Published source data may be used only by someone who can edit the source. */
function lineweb_share_cards_can_use_source( $post ) {
	return $post instanceof WP_Post
		&& in_array( $post->post_type, array( 'post', 'page', 'product' ), true )
		&& 'publish' === $post->post_status
		&& '' === $post->post_password
		&& current_user_can( 'edit_post', $post->ID )
		&& ( 'product' !== $post->post_type || null !== lineweb_share_cards_product( $post->ID ) );
}

/** Add a creation link alongside Edit on posts, pages and products. */
function lineweb_share_cards_row_actions( $actions, $post ) {
	if ( lineweb_share_cards_can_use_source( $post ) ) {
		$actions['lineweb_share_cards'] = sprintf(
			'<a href="%1$s">%2$s</a>',
			esc_url( add_query_arg( array( 'page' => 'lineweb-share-cards-studio', 'source_id' => $post->ID ), admin_url( 'admin.php' ) ) ),
			esc_html__( 'Create social image', 'lineweb-share-cards' )
		);
	}
	return $actions;
}
add_filter( 'post_row_actions', 'lineweb_share_cards_row_actions', 10, 2 );
add_filter( 'page_row_actions', 'lineweb_share_cards_row_actions', 10, 2 );

/** A source is a fresh snapshot for the image being created, never a content mutation. */
function lineweb_share_cards_studio_source( $post ) {
	if ( ! lineweb_share_cards_can_use_source( $post ) ) {
		return new WP_Error( 'lineweb_share_cards_source', __( 'Choose a published article, page, or visible product you can edit.', 'lineweb-share-cards' ), array( 'status' => 403 ) );
	}
	$data = array(
		'content'  => lineweb_share_cards_text( html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' ), 520 ),
		'source'   => lineweb_share_cards_text( get_bloginfo( 'name' ), 160 ),
		'pageUrl'  => get_permalink( $post ),
		'imageUrl' => get_the_post_thumbnail_url( $post, 'large' ) ?: '',
		'mode'     => 'takeaway',
	);
	if ( 'product' === $post->post_type ) {
		$product = lineweb_share_cards_product( $post->ID );
		$data['source'] = lineweb_share_cards_text( html_entity_decode( wp_strip_all_tags( $product->get_price_html() ), ENT_QUOTES, 'UTF-8' ), 100 ) . ' · ' . ( $product->is_in_stock() ? __( 'In stock', 'lineweb-share-cards' ) : __( 'Out of stock', 'lineweb-share-cards' ) );
	}
	return $data;
}

/** Brand changes need administrator authority; WordPress REST verifies cookie nonces. */
function lineweb_share_cards_register_studio_routes() {
	register_rest_route(
		'lineweb-share-cards/v1',
		'/brand',
		array(
			'methods'             => 'POST',
			'permission_callback' => static function () { return current_user_can( 'manage_options' ); },
			'callback'            => static function ( $request ) {
				$brand = lineweb_share_cards_sanitize_brand( $request->get_json_params() );
				update_option( 'lineweb_share_cards_brand', $brand, false );
				return rest_ensure_response( lineweb_share_cards_brand() );
			},
		)
	);
}
add_action( 'rest_api_init', 'lineweb_share_cards_register_studio_routes' );
