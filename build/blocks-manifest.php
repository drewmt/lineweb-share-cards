<?php
defined( 'ABSPATH' ) || exit;
// This file is generated. Do not modify it manually.
return array(
	'share-card' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'lineweb-share-cards/share-card',
		'version' => '0.1.0',
		'title' => 'Shareable Quote & Social Card',
		'category' => 'lineweb',
		'icon' => 'share',
		'description' => 'Turn a quote, takeaway, statistic, or WooCommerce product into a branded PNG visitors can share.',
		'keywords' => array(
			'quote',
			'social',
			'image',
			'share',
			'product'
		),
		'textdomain' => 'lineweb-share-cards',
		'attributes' => array(
			'mode' => array(
				'type' => 'string',
				'enum' => array(
					'quote',
					'takeaway',
					'statistic',
					'product'
				),
				'default' => 'quote'
			),
			'ratio' => array(
				'type' => 'string',
				'enum' => array(
					'square',
					'portrait',
					'landscape'
				),
				'default' => 'square'
			),
			'theme' => array(
				'type' => 'string',
				'enum' => array(
					'editorial',
					'signal',
					'minimal',
					'dark'
				),
				'default' => 'editorial'
			),
			'eyebrow' => array(
				'type' => 'string',
				'default' => 'Worth sharing'
			),
			'content' => array(
				'type' => 'string',
				'default' => 'A useful idea should be easy to remember and simple to share.'
			),
			'source' => array(
				'type' => 'string',
				'default' => ''
			),
			'statistic' => array(
				'type' => 'string',
				'default' => '3×'
			),
			'statisticLabel' => array(
				'type' => 'string',
				'default' => 'the result when clarity becomes part of the process'
			),
			'productId' => array(
				'type' => 'number',
				'default' => 0
			),
			'mediaId' => array(
				'type' => 'number',
				'default' => 0
			),
			'mediaUrl' => array(
				'type' => 'string',
				'default' => ''
			),
			'mediaAlt' => array(
				'type' => 'string',
				'default' => ''
			),
			'logoId' => array(
				'type' => 'number',
				'default' => 0
			),
			'logoUrl' => array(
				'type' => 'string',
				'default' => ''
			),
			'backgroundColor' => array(
				'type' => 'string',
				'default' => '#f4efe9'
			),
			'textColor' => array(
				'type' => 'string',
				'default' => '#1b1715'
			),
			'accentColor' => array(
				'type' => 'string',
				'default' => '#d64a31'
			),
			'textAlign' => array(
				'type' => 'string',
				'enum' => array(
					'left',
					'center'
				),
				'default' => 'left'
			),
			'showDomain' => array(
				'type' => 'boolean',
				'default' => true
			),
			'showQr' => array(
				'type' => 'boolean',
				'default' => false
			),
			'showLogo' => array(
				'type' => 'boolean',
				'default' => true
			),
			'buttonLabel' => array(
				'type' => 'string',
				'default' => 'Share image'
			),
			'downloadLabel' => array(
				'type' => 'string',
				'default' => 'Download PNG'
			),
			'copyLabel' => array(
				'type' => 'string',
				'default' => 'Copy caption'
			),
			'caption' => array(
				'type' => 'string',
				'default' => ''
			)
		),
		'supports' => array(
			'align' => array(
				'wide',
				'full'
			),
			'anchor' => true,
			'html' => false,
			'spacing' => array(
				'margin' => true
			)
		),
		'example' => array(
			'viewportWidth' => 900
		),
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScriptModule' => 'file:./view.js',
		'render' => 'file:./render.php'
	)
);
