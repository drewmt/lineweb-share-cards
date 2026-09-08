<?php
/** Local image studio. @package Lineweb_Share_Cards */

defined( 'ABSPATH' ) || exit;

/** Register a direct creation workspace beneath the existing hub. */
function lineweb_share_cards_studio_menu() {
	add_submenu_page( 'lineweb-share-cards', __( 'Social Image Studio', 'lineweb-share-cards' ), __( 'Image Studio', 'lineweb-share-cards' ), 'edit_posts', 'lineweb-share-cards-studio', 'lineweb_share_cards_render_studio' );
}
// Register after the parent hub so WordPress resolves the same page hook on navigation.
add_action( 'admin_menu', 'lineweb_share_cards_studio_menu', 11 );

/** Keep media tools and the renderer on the studio screen only. */
function lineweb_share_cards_studio_assets( $hook_suffix ) {
	if ( ! str_ends_with( $hook_suffix, '_page_lineweb-share-cards-studio' ) ) {
		return;
	}
	if ( current_user_can( 'upload_files' ) ) {
		wp_enqueue_media();
	}
	$asset_path = LINEWEB_SHARE_CARDS_DIR . '/build/studio/index.asset.php';
	if ( ! file_exists( $asset_path ) ) {
		return;
	}
	$asset = require $asset_path;
	wp_enqueue_style( 'lineweb-share-cards-admin', LINEWEB_SHARE_CARDS_URL . 'assets/admin.css', array( 'dashicons' ), LINEWEB_SHARE_CARDS_VERSION );
	wp_enqueue_style( 'lineweb-share-cards-studio', LINEWEB_SHARE_CARDS_URL . 'build/studio/index.css', array(), $asset['version'] );
	wp_style_add_data( 'lineweb-share-cards-studio', 'rtl', 'replace' );
	wp_enqueue_script( 'lineweb-share-cards-studio', LINEWEB_SHARE_CARDS_URL . 'build/studio/index.js', $asset['dependencies'], $asset['version'], true );
	wp_set_script_translations( 'lineweb-share-cards-studio', 'lineweb-share-cards', LINEWEB_SHARE_CARDS_DIR . '/languages' );
	wp_add_inline_script( 'lineweb-share-cards-studio', 'window.linewebShareCardsStudio=' . wp_json_encode( array( 'brand' => lineweb_share_cards_brand(), 'brandUrl' => rest_url( 'lineweb-share-cards/v1/brand' ), 'nonce' => wp_create_nonce( 'wp_rest' ) ) ) . ';', 'before' );
}
add_action( 'admin_enqueue_scripts', 'lineweb_share_cards_studio_assets' );

/** Render the workspace or a bounded, permission-filtered source chooser. */
function lineweb_share_cards_render_studio() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( esc_html__( 'You do not have permission to access this page.', 'lineweb-share-cards' ), '', array( 'response' => 403 ) );
	}
	// Read-only navigation. Object authorization is applied before reading source content.
	$source_id = isset( $_GET['source_id'] ) && is_scalar( $_GET['source_id'] ) ? absint( $_GET['source_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$source = $source_id ? lineweb_share_cards_studio_source( get_post( $source_id ) ) : null;
	if ( is_wp_error( $source ) ) {
		wp_die( esc_html( $source->get_error_message() ), '', array( 'response' => 403 ) );
	}
	$config = array_merge(
		array( 'mode' => 'takeaway', 'ratio' => 'portrait', 'template' => 'editorial', 'eyebrow' => get_bloginfo( 'name' ), 'content' => __( 'Make something worth sharing.', 'lineweb-share-cards' ), 'source' => '', 'imageUrl' => '', 'pageUrl' => home_url( '/' ), 'domain' => lineweb_share_cards_site_domain(), 'showDomain' => true, 'showQr' => false, 'textAlign' => 'left' ),
		lineweb_share_cards_brand(),
		$source ?: array()
	);
	?>
	<div class="wrap lwsc-studio-page">
		<header class="lwsc-studio-header">
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=lineweb-share-cards' ) ); ?>" class="lwsc-studio-lockup"><img src="<?php echo esc_url( LINEWEB_SHARE_CARDS_URL . 'assets/lineweb-logo.png' ); ?>" alt="<?php esc_attr_e( 'Lineweb — Creative Digital Agency', 'lineweb-share-cards' ); ?>"><span>lineweb.gr</span></a>
			<div><p class="lwsc-studio-kicker"><?php esc_html_e( 'Lineweb Share Cards', 'lineweb-share-cards' ); ?> · 0.2</p><h1><?php esc_html_e( 'Social Image Studio', 'lineweb-share-cards' ); ?></h1><p><?php esc_html_e( 'Your content. Your brand. Ready to share.', 'lineweb-share-cards' ); ?></p></div>
			<a class="button" href="<?php echo esc_url( admin_url( 'admin.php?page=lineweb-share-cards-studio' ) ); ?>"><?php esc_html_e( 'Choose content', 'lineweb-share-cards' ); ?></a>
		</header>
		<?php if ( ! $source ) : ?>
			<section class="lwsc-studio-picker" aria-labelledby="lwsc-picker-title">
				<h2 id="lwsc-picker-title"><?php esc_html_e( 'Start with your published content', 'lineweb-share-cards' ); ?></h2>
				<form method="get"><input type="hidden" name="page" value="lineweb-share-cards-studio"><label for="lwsc-search"><?php esc_html_e( 'Search articles, pages and products', 'lineweb-share-cards' ); ?></label><div class="lwsc-studio-inline"><input type="search" id="lwsc-search" name="source_search" value="<?php echo esc_attr( isset( $_GET['source_search'] ) && is_scalar( $_GET['source_search'] ) ? sanitize_text_field( wp_unslash( $_GET['source_search'] ) ) : '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>"><button class="button"><?php esc_html_e( 'Search', 'lineweb-share-cards' ); ?></button></div></form>
				<div class="lwsc-studio-sources">
				<?php
				$search = isset( $_GET['source_search'] ) && is_scalar( $_GET['source_search'] ) ? lineweb_share_cards_text( sanitize_text_field( wp_unslash( $_GET['source_search'] ) ), 100 ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$query = new WP_Query( array( 'post_type' => array( 'post', 'page', 'product' ), 'post_status' => 'publish', 'has_password' => false, 'posts_per_page' => 20, 'no_found_rows' => true, 's' => $search, 'orderby' => 'date', 'order' => 'DESC' ) );
				$shown = 0;
				foreach ( $query->posts as $item ) :
					if ( ! lineweb_share_cards_can_use_source( $item ) ) { continue; }
					++$shown;
					?>
					<a href="<?php echo esc_url( add_query_arg( array( 'page' => 'lineweb-share-cards-studio', 'source_id' => $item->ID ), admin_url( 'admin.php' ) ) ); ?>"><span><?php echo esc_html( get_post_type_object( $item->post_type )->labels->singular_name ); ?></span><strong><?php echo esc_html( get_the_title( $item ) ); ?></strong><span aria-hidden="true">↗</span></a>
				<?php endforeach; ?>
				<?php if ( ! $shown ) : ?><p><?php esc_html_e( 'No matching published content. You can create a card below or use Create social image from the content list.', 'lineweb-share-cards' ); ?></p><?php endif; ?>
				</div>
				<p><?php esc_html_e( 'Showing up to 20 recent matches. Search by title to find older content, or start a blank card below.', 'lineweb-share-cards' ); ?></p>
			</section>
		<?php endif; ?>
		<noscript><p><?php esc_html_e( 'Enable JavaScript to preview and export images in your browser.', 'lineweb-share-cards' ); ?></p></noscript>
		<div class="lwsc-studio" data-lwsc-studio data-config="<?php echo esc_attr( wp_json_encode( $config ) ); ?>">
			<form class="lwsc-studio-controls">
				<?php if ( $source ) : ?><p class="lwsc-studio-origin"><?php esc_html_e( 'Source', 'lineweb-share-cards' ); ?>: <a href="<?php echo esc_url( get_edit_post_link( $source_id ) ); ?>"><?php echo esc_html( $source['content'] ); ?></a></p><?php endif; ?>
				<fieldset><legend><?php esc_html_e( '01 · Content', 'lineweb-share-cards' ); ?></legend>
					<label for="lwsc-eyebrow"><?php esc_html_e( 'Small heading', 'lineweb-share-cards' ); ?></label><input id="lwsc-eyebrow" name="eyebrow" maxlength="80" value="<?php echo esc_attr( $config['eyebrow'] ); ?>">
					<label for="lwsc-content"><?php esc_html_e( 'Headline', 'lineweb-share-cards' ); ?></label><textarea id="lwsc-content" name="content" rows="3" maxlength="520"><?php echo esc_textarea( $config['content'] ); ?></textarea>
					<label for="lwsc-source"><?php esc_html_e( 'Supporting text', 'lineweb-share-cards' ); ?></label><textarea id="lwsc-source" name="source" rows="2" maxlength="160"><?php echo esc_textarea( $config['source'] ); ?></textarea>
					<div class="lwsc-studio-inline"><button type="button" class="button" data-media="image" <?php disabled( ! current_user_can( 'upload_files' ) ); ?>><?php esc_html_e( 'Choose image', 'lineweb-share-cards' ); ?></button><button type="button" class="button-link" data-remove="image"><?php esc_html_e( 'Remove image', 'lineweb-share-cards' ); ?></button></div>
				</fieldset>
				<fieldset><legend><?php esc_html_e( '02 · Layout', 'lineweb-share-cards' ); ?></legend>
					<label for="lwsc-template"><?php esc_html_e( 'Template', 'lineweb-share-cards' ); ?></label><select id="lwsc-template" name="template"><option value="editorial"><?php esc_html_e( 'Editorial', 'lineweb-share-cards' ); ?></option><option value="split"><?php esc_html_e( 'Split frame', 'lineweb-share-cards' ); ?></option><option value="poster"><?php esc_html_e( 'Photo poster', 'lineweb-share-cards' ); ?></option><option value="minimal"><?php esc_html_e( 'Type focus', 'lineweb-share-cards' ); ?></option></select>
					<label for="lwsc-ratio"><?php esc_html_e( 'Format', 'lineweb-share-cards' ); ?></label><select id="lwsc-ratio" name="ratio"><option value="square"><?php esc_html_e( 'Square · 1080 × 1080', 'lineweb-share-cards' ); ?></option><option value="portrait" selected><?php esc_html_e( 'Portrait · 1080 × 1350', 'lineweb-share-cards' ); ?></option><option value="landscape"><?php esc_html_e( 'Landscape · 1200 × 630', 'lineweb-share-cards' ); ?></option><option value="story"><?php esc_html_e( 'Story · 1080 × 1920', 'lineweb-share-cards' ); ?></option></select>
					<label for="lwsc-align"><?php esc_html_e( 'Text alignment', 'lineweb-share-cards' ); ?></label><select id="lwsc-align" name="textAlign"><option value="left"><?php esc_html_e( 'Start', 'lineweb-share-cards' ); ?></option><option value="center"><?php esc_html_e( 'Center', 'lineweb-share-cards' ); ?></option></select>
				</fieldset>
				<fieldset><legend><?php esc_html_e( '03 · Brand', 'lineweb-share-cards' ); ?></legend>
					<div class="lwsc-studio-colors"><?php foreach ( array( 'backgroundColor' => __( 'Background', 'lineweb-share-cards' ), 'textColor' => __( 'Text', 'lineweb-share-cards' ), 'accentColor' => __( 'Accent', 'lineweb-share-cards' ) ) as $key => $label ) : ?><label><?php echo esc_html( $label ); ?><input type="color" name="<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( $config[ $key ] ); ?>"></label><?php endforeach; ?></div>
					<label for="lwsc-font"><?php esc_html_e( 'Font', 'lineweb-share-cards' ); ?></label><select id="lwsc-font" name="font"><?php foreach ( array( 'sans' => 'Arial', 'serif' => 'Georgia', 'mono' => 'Courier New' ) as $key => $label ) : ?><option value="<?php echo esc_attr( $key ); ?>" <?php selected( $config['font'], $key ); ?>><?php echo esc_html( $label ); ?></option><?php endforeach; ?></select>
					<div class="lwsc-studio-inline"><button type="button" class="button" data-media="logo" <?php disabled( ! current_user_can( 'upload_files' ) ); ?>><?php esc_html_e( 'Choose logo', 'lineweb-share-cards' ); ?></button><button type="button" class="button-link" data-remove="logo"><?php esc_html_e( 'Hide logo', 'lineweb-share-cards' ); ?></button></div>
					<label class="lwsc-studio-check"><input type="checkbox" name="showDomain" checked><?php esc_html_e( 'Show domain', 'lineweb-share-cards' ); ?></label><label class="lwsc-studio-check"><input type="checkbox" name="showQr"><?php esc_html_e( 'Include source QR', 'lineweb-share-cards' ); ?></label>
					<?php if ( current_user_can( 'manage_options' ) ) : ?><button type="button" class="button" data-save-brand><?php esc_html_e( 'Save brand defaults', 'lineweb-share-cards' ); ?></button><p class="description"><?php esc_html_e( 'Save colors, font and logo for future cards. Existing published blocks keep their own settings.', 'lineweb-share-cards' ); ?></p><?php endif; ?>
				</fieldset>
			</form>
			<section class="lwsc-studio-preview" aria-label="<?php esc_attr_e( 'Image preview and export', 'lineweb-share-cards' ); ?>">
				<div class="lwsc-studio-preview-heading"><h2><?php esc_html_e( 'Ready for your next post', 'lineweb-share-cards' ); ?></h2><span data-dimensions>1080 × 1350</span></div>
				<div class="lwsc-studio-artboard" aria-busy="true"><img data-preview alt="<?php esc_attr_e( 'Generated social card preview', 'lineweb-share-cards' ); ?>" hidden></div>
				<p class="lwsc-studio-feedback" role="status" aria-live="polite"></p>
				<div class="lwsc-studio-export"><button type="button" class="button button-primary" data-export="single" disabled><?php esc_html_e( 'Download PNG', 'lineweb-share-cards' ); ?></button><button type="button" class="button" data-export="all" disabled><?php esc_html_e( 'Download all 4 formats (ZIP)', 'lineweb-share-cards' ); ?></button></div>
				<p class="lwsc-studio-footnote"><?php esc_html_e( 'Images are generated on this device. Review text and prices before posting. Photo poster uses white text over a dark overlay; Type focus keeps the image out.', 'lineweb-share-cards' ); ?></p>
			</section>
		</div>
	</div>
	<?php
}
