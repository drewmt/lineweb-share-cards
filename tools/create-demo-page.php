<?php
/** Create an idempotent synthetic Share Cards showcase. */

defined( 'ABSPATH' ) || exit;

if ( ! in_array( wp_get_environment_type(), array( 'local', 'development' ), true ) ) {
	WP_CLI::error( 'The Share Cards demo creator is restricted to local/development environments.' );
}

$blocks = array(
	array(
		'blockName'    => 'core/heading',
		'attrs'        => array( 'level' => 1 ),
		'innerBlocks'  => array(),
		'innerHTML'    => '<h1 class="wp-block-heading">Ideas worth carrying forward</h1>',
		'innerContent' => array( '<h1 class="wp-block-heading">Ideas worth carrying forward</h1>' ),
	),
	array(
		'blockName'    => 'core/paragraph',
		'attrs'        => array(),
		'innerBlocks'  => array(),
		'innerHTML'    => '<p>Four practical share cards using only synthetic demonstration content.</p>',
		'innerContent' => array( '<p>Four practical share cards using only synthetic demonstration content.</p>' ),
	),
	array(
		'blockName'    => 'lineweb-share-cards/share-card',
		'attrs'        => array(
			'align'       => 'wide',
			'mode'        => 'quote',
			'ratio'       => 'landscape',
			'eyebrow'     => 'A useful principle',
			'content'     => 'The best tool removes one repeated frustration without inventing a new workflow.',
			'source'      => 'Synthetic editorial example',
			'showQr'      => true,
			'caption'     => 'One practical principle from our demonstration page.',
		),
		'innerBlocks'  => array(),
		'innerHTML'    => '',
		'innerContent' => array(),
	),
	array(
		'blockName'    => 'lineweb-share-cards/share-card',
		'attrs'        => array(
			'align'            => 'wide',
			'mode'             => 'statistic',
			'ratio'            => 'square',
			'theme'            => 'signal',
			'backgroundColor'  => '#173b32',
			'textColor'        => '#f8f5ee',
			'accentColor'      => '#f1b85b',
			'eyebrow'          => 'A number with context',
			'statistic'        => '42%',
			'statisticLabel'   => 'fewer repeated steps in this synthetic workflow',
		),
		'innerBlocks'  => array(),
		'innerHTML'    => '',
		'innerContent' => array(),
	),
);

if ( function_exists( 'wc_get_products' ) ) {
	$product_ids = wc_get_products( array( 'status' => 'publish', 'visibility' => 'visible', 'limit' => 1, 'return' => 'ids' ) );
	if ( ! empty( $product_ids ) ) {
		$blocks[] = array(
			'blockName'    => 'lineweb-share-cards/share-card',
			'attrs'        => array(
				'align'           => 'wide',
				'mode'            => 'product',
				'ratio'           => 'portrait',
				'theme'           => 'minimal',
				'backgroundColor' => '#ffffff',
				'textColor'       => '#171717',
				'accentColor'     => '#171717',
				'eyebrow'         => 'Product highlight',
				'productId'       => (int) $product_ids[0],
			),
			'innerBlocks'  => array(),
			'innerHTML'    => '',
			'innerContent' => array(),
		);
	}
}

$existing = get_page_by_path( 'lineweb-share-cards-demo', OBJECT, 'page' );
$post = array(
	'post_type'      => 'page',
	'post_status'    => 'publish',
	'post_title'     => 'Lineweb Share Cards Demo',
	'post_name'      => 'lineweb-share-cards-demo',
	'post_content'   => serialize_blocks( $blocks ),
	'comment_status' => 'closed',
	'ping_status'    => 'closed',
);
if ( $existing instanceof WP_Post ) {
	$post['ID'] = $existing->ID;
}

$post_id = wp_insert_post( $post, true );
if ( is_wp_error( $post_id ) ) {
	WP_CLI::error( $post_id->get_error_message() );
}

WP_CLI::success( 'Share Cards demo: ' . get_permalink( $post_id ) );
