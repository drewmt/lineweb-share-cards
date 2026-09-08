<?php
/**
 * Server-rendered semantic Share Card.
 *
 * @package Lineweb_Share_Cards
 */

defined( 'ABSPATH' ) || exit;

( static function ( $attributes ) {
	$mode       = lineweb_share_cards_choice( $attributes['mode'] ?? '', array( 'quote', 'takeaway', 'statistic', 'product' ), 'quote' );
	$ratio      = lineweb_share_cards_choice( $attributes['ratio'] ?? '', array( 'square', 'portrait', 'landscape', 'story' ), 'square' );
	$font       = lineweb_share_cards_choice( $attributes['font'] ?? '', array( 'sans', 'serif', 'mono' ), 'sans' );
	$fonts      = array( 'sans' => 'Arial,sans-serif', 'serif' => 'Georgia,serif', 'mono' => 'Courier New,monospace' );
	$theme      = lineweb_share_cards_choice( $attributes['theme'] ?? '', array( 'editorial', 'signal', 'minimal', 'dark' ), 'editorial' );
	$text_align = lineweb_share_cards_choice( $attributes['textAlign'] ?? '', array( 'left', 'center' ), 'left' );
	$eyebrow    = lineweb_share_cards_text( $attributes['eyebrow'] ?? '', 80 );
	$content    = lineweb_share_cards_text( $attributes['content'] ?? '', 520 );
	$source     = lineweb_share_cards_text( $attributes['source'] ?? '', 160 );
	$statistic  = lineweb_share_cards_text( $attributes['statistic'] ?? '', 32 );
	$stat_label = lineweb_share_cards_text( $attributes['statisticLabel'] ?? '', 240 );
	$background = lineweb_share_cards_color( $attributes['backgroundColor'] ?? '', '#f4efe9' );
	$text_color = lineweb_share_cards_color( $attributes['textColor'] ?? '', '#1b1715' );
	$accent     = lineweb_share_cards_color( $attributes['accentColor'] ?? '', '#d64a31' );
	$show_logo  = ! isset( $attributes['showLogo'] ) || (bool) $attributes['showLogo'];
	$show_domain = ! isset( $attributes['showDomain'] ) || (bool) $attributes['showDomain'];
	$show_qr    = ! empty( $attributes['showQr'] );
	$domain     = lineweb_share_cards_site_domain();
	$page_url   = get_permalink();
	$page_url   = is_string( $page_url ) && '' !== $page_url ? $page_url : home_url( '/' );
	$product    = null;
	$product_data = null;

	if ( 'product' === $mode ) {
		$product = lineweb_share_cards_product( $attributes['productId'] ?? 0 );
		if ( ! $product ) {
			if ( current_user_can( 'edit_posts' ) ) {
				echo '<p class="lwsc-card__notice">' . esc_html__( 'This Share Card needs a published, catalog-visible WooCommerce product.', 'lineweb-share-cards' ) . '</p>';
			}
			return;
		}

		$image_id = $product->get_image_id();
		$product_data = array(
			'title'        => lineweb_share_cards_text( $product->get_name(), 180 ),
			'price'        => lineweb_share_cards_text( wp_strip_all_tags( $product->get_price_html() ), 100 ),
			'availability' => $product->is_in_stock() ? __( 'In stock', 'lineweb-share-cards' ) : __( 'Out of stock', 'lineweb-share-cards' ),
			'url'          => get_permalink( $product->get_id() ),
			'imageUrl'     => $image_id ? wp_get_attachment_image_url( $image_id, 'large' ) : '',
			'imageId'      => $image_id,
		);
	}

	$media_id  = absint( $attributes['mediaId'] ?? 0 );
	$media_url = esc_url_raw( $attributes['mediaUrl'] ?? '' );
	$media_alt = lineweb_share_cards_text( $attributes['mediaAlt'] ?? '', 240 );
	if ( $product_data ) {
		$media_id  = absint( $product_data['imageId'] );
		$media_url = esc_url_raw( $product_data['imageUrl'] );
		$media_alt = $product_data['title'];
	} elseif ( $media_id > 0 ) {
		$attachment_url = wp_get_attachment_image_url( $media_id, 'large' );
		if ( is_string( $attachment_url ) ) {
			$media_url = $attachment_url;
		}
	}

	$logo_id  = absint( $attributes['logoId'] ?? 0 );
	$logo_url = esc_url_raw( $attributes['logoUrl'] ?? '' );
	if ( $logo_id > 0 ) {
		$attachment_logo = wp_get_attachment_image_url( $logo_id, 'medium' );
		if ( is_string( $attachment_logo ) ) {
			$logo_url = $attachment_logo;
		}
	}
	if ( '' === $logo_url ) {
		$logo_url = lineweb_share_cards_default_logo_url();
	}

	$button_label   = lineweb_share_cards_text( $attributes['buttonLabel'] ?? __( 'Share image', 'lineweb-share-cards' ), 60 );
	$download_label = lineweb_share_cards_text( $attributes['downloadLabel'] ?? __( 'Download PNG', 'lineweb-share-cards' ), 60 );
	$copy_label     = lineweb_share_cards_text( $attributes['copyLabel'] ?? __( 'Copy caption', 'lineweb-share-cards' ), 60 );
	$caption        = lineweb_share_cards_text( $attributes['caption'] ?? '', 600 );
	$status_id      = wp_unique_id( 'lwsc-status-' );
	$config         = array(
		'mode'            => $mode,
		'ratio'           => $ratio,
		'font'            => $font,
		'theme'           => $theme,
		'eyebrow'         => $eyebrow,
		'content'         => $content,
		'source'          => $source,
		'statistic'       => $statistic,
		'statisticLabel'  => $stat_label,
		'product'         => $product_data,
		'imageUrl'        => $media_url,
		'logoUrl'         => $show_logo ? $logo_url : '',
		'backgroundColor' => $background,
		'textColor'       => $text_color,
		'accentColor'     => $accent,
		'textAlign'       => $text_align,
		'showDomain'      => $show_domain,
		'showQr'          => $show_qr,
		'domain'          => $domain,
		'pageUrl'         => esc_url_raw( $page_url ),
		'siteTitle'       => get_bloginfo( 'name' ),
		'caption'         => $caption,
		'labels'          => array(
			'generating'     => __( 'Creating your PNG…', 'lineweb-share-cards' ),
			'shared'         => __( 'Share sheet opened.', 'lineweb-share-cards' ),
			'downloaded'     => __( 'PNG downloaded.', 'lineweb-share-cards' ),
			'copied'         => __( 'Caption copied.', 'lineweb-share-cards' ),
			'shareFallback'  => __( 'Image sharing is not available here, so the PNG was downloaded instead.', 'lineweb-share-cards' ),
			'copyFailed'     => __( 'Copy is not available in this browser.', 'lineweb-share-cards' ),
			'generateFailed' => __( 'The PNG could not be created. Try downloading again.', 'lineweb-share-cards' ),
		),
	);
	$wrapper = get_block_wrapper_attributes(
		array(
			'class' => 'lwsc-share-card is-ratio-' . $ratio . ' is-theme-' . $theme,
			'style' => '--lwsc-bg:' . $background . ';--lwsc-text:' . $text_color . ';--lwsc-accent:' . $accent . ';--lwsc-align:' . $text_align . ';--lwsc-font:' . $fonts[ $font ] . ';',
		)
	);
	$has_media = '' !== $media_url;
	?>
	<section <?php echo $wrapper; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> data-lwsc-card data-lwsc-config="<?php echo esc_attr( wp_json_encode( $config ) ); ?>">
		<figure class="lwsc-card__visual<?php echo $has_media ? ' has-media' : ''; ?>">
			<?php if ( $has_media ) : ?>
				<?php
				if ( $media_id > 0 ) {
					echo wp_get_attachment_image( $media_id, 'large', false, array( 'class' => 'lwsc-card__media', 'alt' => $media_alt, 'loading' => 'lazy', 'decoding' => 'async' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				} else {
					printf( '<img class="lwsc-card__media" src="%1$s" alt="%2$s" loading="lazy" decoding="async">', esc_url( $media_url ), esc_attr( $media_alt ) );
				}
				?>
			<?php endif; ?>
			<div class="lwsc-card__body">
				<?php if ( '' !== $eyebrow ) : ?><p class="lwsc-card__eyebrow"><?php echo esc_html( $eyebrow ); ?></p><?php endif; ?>
				<?php if ( 'statistic' === $mode ) : ?>
					<p class="lwsc-card__statistic"><?php echo esc_html( $statistic ); ?></p>
					<?php if ( '' !== $stat_label ) : ?><p class="lwsc-card__statistic-label"><?php echo esc_html( $stat_label ); ?></p><?php endif; ?>
				<?php elseif ( 'product' === $mode && $product_data ) : ?>
					<div class="lwsc-card__product">
						<div>
							<p class="lwsc-card__product-name"><?php echo esc_html( $product_data['title'] ); ?></p>
							<p class="lwsc-card__product-meta"><?php echo esc_html( $product_data['price'] ); ?> <span aria-hidden="true">·</span> <?php echo esc_html( $product_data['availability'] ); ?></p>
							<a class="lwsc-card__product-link" href="<?php echo esc_url( $product_data['url'] ); ?>"><?php esc_html_e( 'View product', 'lineweb-share-cards' ); ?></a>
						</div>
					</div>
				<?php elseif ( 'quote' === $mode ) : ?>
					<blockquote class="lwsc-card__content"><p><?php echo esc_html( $content ); ?></p></blockquote>
					<?php if ( '' !== $source ) : ?><figcaption class="lwsc-card__source"><?php echo esc_html( $source ); ?></figcaption><?php endif; ?>
				<?php else : ?>
					<p class="lwsc-card__content"><?php echo esc_html( $content ); ?></p>
					<?php if ( '' !== $source ) : ?><p class="lwsc-card__source"><?php echo esc_html( $source ); ?></p><?php endif; ?>
				<?php endif; ?>
				<div class="lwsc-card__brand">
					<?php if ( $show_logo && '' !== $logo_url ) : ?><img src="<?php echo esc_url( $logo_url ); ?>" alt="" loading="lazy" decoding="async"><?php endif; ?>
					<?php if ( $show_domain && '' !== $domain ) : ?><span><?php echo esc_html( $domain ); ?></span><?php endif; ?>
					<?php if ( $show_qr ) : ?><span class="lwsc-card__qr" aria-hidden="true"></span><?php endif; ?>
				</div>
			</div>
		</figure>
		<div class="lwsc-card__actions" aria-label="<?php esc_attr_e( 'Share this card', 'lineweb-share-cards' ); ?>">
			<button type="button" class="lwsc-card__button lwsc-card__button--primary" data-lwsc-action="share" aria-describedby="<?php echo esc_attr( $status_id ); ?>"><?php echo esc_html( $button_label ); ?></button>
			<button type="button" class="lwsc-card__button" data-lwsc-action="download" aria-describedby="<?php echo esc_attr( $status_id ); ?>"><?php echo esc_html( $download_label ); ?></button>
			<button type="button" class="lwsc-card__button lwsc-card__button--quiet" data-lwsc-action="copy" aria-describedby="<?php echo esc_attr( $status_id ); ?>"><?php echo esc_html( $copy_label ); ?></button>
		</div>
		<p id="<?php echo esc_attr( $status_id ); ?>" class="lwsc-card__status" role="status" aria-live="polite"></p>
	</section>
	<?php
} )( $attributes );
