<?php
/** Local-only regression checks for studio source access and brand writes. */

defined( 'ABSPATH' ) || exit;
if ( ! in_array( wp_get_environment_type(), array( 'local', 'development' ), true ) ) {
	WP_CLI::error( 'Studio smoke checks are restricted to local/development.' );
}

$previous_user = get_current_user_id();
$previous_brand = get_option( 'lineweb_share_cards_brand', null );
$created_posts = array();
$created_users = array();
$failure = null;
$assert = static function ( $condition, $message ) {
	if ( ! $condition ) { throw new RuntimeException( $message ); }
};
try {
	foreach ( array( 'administrator', 'author', 'subscriber' ) as $role ) {
		$id = wp_insert_user( array( 'user_login' => 'lwsc-test-' . wp_generate_uuid4(), 'user_pass' => wp_generate_password( 32 ), 'role' => $role ) );
		$assert( ! is_wp_error( $id ), 'Could not create a test user.' );
		$created_users[ $role ] = $id;
	}
	foreach ( array( 'publish', 'private', 'draft' ) as $status ) {
		$id = wp_insert_post( array( 'post_title' => 'Synthetic studio source', 'post_status' => $status, 'post_author' => $created_users['author'], 'post_content' => 'Keep this unchanged.' ), true );
		$assert( ! is_wp_error( $id ), 'Could not create a test source.' );
		$created_posts[ $status ] = $id;
	}
	wp_set_current_user( $created_users['author'] );
	$post = get_post( $created_posts['publish'] );
	$assert( lineweb_share_cards_can_use_source( $post ), 'Authors must be able to use their published articles.' );
	$source = lineweb_share_cards_studio_source( $post );
	$assert( ! is_wp_error( $source ) && 'Synthetic studio source' === $source['content'], 'The title must prefill without changing content.' );
	$assert( ! lineweb_share_cards_can_use_source( get_post( $created_posts['private'] ) ), 'Private sources must be excluded.' );
	$assert( ! lineweb_share_cards_can_use_source( get_post( $created_posts['draft'] ) ), 'Draft sources must be excluded.' );
	wp_update_post( array( 'ID' => $post->ID, 'post_password' => 'synthetic' ) );
	$assert( ! lineweb_share_cards_can_use_source( get_post( $post->ID ) ), 'Password-protected sources must be excluded.' );
	wp_update_post( array( 'ID' => $post->ID, 'post_password' => '', 'post_author' => $created_users['administrator'] ) );
	$assert( ! lineweb_share_cards_can_use_source( get_post( $post->ID ) ), 'Authors must not use another author\'s source.' );
	$assert( is_wp_error( lineweb_share_cards_studio_source( get_post( $post->ID ) ) ), 'Direct source requests must fail closed.' );
	$normalized = lineweb_share_cards_sanitize_brand( array( 'backgroundColor' => '#abc', 'textColor' => array(), 'font' => 'url(external)', 'logoId' => array( 1 ), 'showLogo' => false, 'otherOption' => 'ignored' ) );
	$assert( '#aabbcc' === $normalized['backgroundColor'] && '#1b1715' === $normalized['textColor'] && 'sans' === $normalized['font'] && 0 === $normalized['logoId'] && false === $normalized['showLogo'] && ! isset( $normalized['otherOption'] ), 'Brand input must be a bounded allowlist.' );
	rest_get_server();
	foreach ( array( 0, $created_users['subscriber'], $created_users['author'] ) as $user_id ) {
		wp_set_current_user( $user_id );
		$request = new WP_REST_Request( 'POST', '/lineweb-share-cards/v1/brand' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{"font":"mono"}' );
		$result = rest_do_request( $request );
		$assert( in_array( $result->get_status(), array( 401, 403 ), true ), 'Brand writes require manage_options.' );
	}
	wp_set_current_user( $created_users['administrator'] );
	$result = rest_do_request( $request );
	$assert( 200 === $result->get_status() && 'mono' === lineweb_share_cards_brand()['font'], 'Administrator brand writes should succeed.' );
	$assert( 'Keep this unchanged.' === get_post( $post->ID )->post_content, 'Source content must remain unchanged.' );
} catch ( Throwable $error ) {
	$failure = $error->getMessage();
} finally {
	if ( null === $previous_brand ) { delete_option( 'lineweb_share_cards_brand' ); } else { update_option( 'lineweb_share_cards_brand', $previous_brand, false ); }
	foreach ( $created_posts as $id ) { wp_delete_post( $id, true ); }
	require_once ABSPATH . 'wp-admin/includes/user.php';
	foreach ( $created_users as $id ) { wp_delete_user( $id ); }
	wp_set_current_user( $previous_user );
}
if ( $failure ) { WP_CLI::error( $failure ); }
WP_CLI::success( 'Studio source access, brand allowlist, role authorization, and unchanged content verified.' );
