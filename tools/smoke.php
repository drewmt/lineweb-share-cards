<?php
/** Local WordPress runtime smoke check for Share Cards. */

defined( 'ABSPATH' ) || exit;

if ( ! in_array( wp_get_environment_type(), array( 'local', 'development' ), true ) ) {
	WP_CLI::error( 'The Share Cards smoke check is restricted to local/development environments.' );
}

$rendered = render_block(
	array(
		'blockName'    => 'lineweb-share-cards/share-card',
		'attrs'        => array(
			'mode'           => 'statistic',
			'eyebrow'        => 'Verified result',
			'statistic'      => '42%',
			'statisticLabel' => 'fewer steps in a synthetic workflow',
			'showQr'         => true,
		),
		'innerBlocks'  => array(),
		'innerHTML'    => '',
		'innerContent' => array(),
	)
);

if ( ! str_contains( $rendered, 'data-lwsc-card' ) || ! str_contains( $rendered, '42%' ) || ! str_contains( $rendered, 'data-lwsc-action="download"' ) || ! str_contains( $rendered, 'role="status"' ) ) {
	WP_CLI::error( 'The statistic Share Card did not render the expected semantic and interactive markup.' );
}

WP_CLI::success( 'Share Card registered and rendered semantic statistic markup.' );
