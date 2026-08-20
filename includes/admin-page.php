<?php
/**
 * Branded Share Cards administration home.
 *
 * @package Lineweb_Share_Cards
 */

defined( 'ABSPATH' ) || exit;

/** Register the plugin administration page. */
function lineweb_share_cards_admin_menu() {
	add_menu_page(
		__( 'Lineweb Share Cards', 'lineweb-share-cards' ),
		__( 'Share Cards', 'lineweb-share-cards' ),
		'edit_posts',
		'lineweb-share-cards',
		'lineweb_share_cards_render_admin_page',
		'dashicons-share',
		58
	);
}
add_action( 'admin_menu', 'lineweb_share_cards_admin_menu' );

/** Load admin styles only on the plugin home. */
function lineweb_share_cards_admin_assets( $hook_suffix ) {
	if ( 'toplevel_page_lineweb-share-cards' !== $hook_suffix ) {
		return;
}
	wp_enqueue_style(
		'lineweb-share-cards-admin',
		LINEWEB_SHARE_CARDS_URL . 'assets/admin.css',
		array( 'dashicons' ),
		LINEWEB_SHARE_CARDS_VERSION
	);
}
add_action( 'admin_enqueue_scripts', 'lineweb_share_cards_admin_assets' );

/** Mark a single-plugin activation for a one-time welcome redirect. */
function lineweb_share_cards_admin_activate() {
	update_option( 'lineweb_share_cards_activation_redirect', 'yes', false );
}
register_activation_hook( LINEWEB_SHARE_CARDS_FILE, 'lineweb_share_cards_admin_activate' );

/** Redirect editors to the welcome page once after ordinary activation. */
function lineweb_share_cards_activation_redirect() {
	if ( 'yes' !== get_option( 'lineweb_share_cards_activation_redirect' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_posts' ) || wp_doing_ajax() || wp_doing_cron() ) {
		return;
	}

	delete_option( 'lineweb_share_cards_activation_redirect' );
	if ( isset( $_GET['activate-multi'] ) || is_network_admin() ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only guard from the core activation flow.
		return;
	}

	wp_safe_redirect( admin_url( 'admin.php?page=lineweb-share-cards' ) );
	exit;
}
add_action( 'admin_init', 'lineweb_share_cards_activation_redirect' );

/** Add a direct plugin-home link beside Deactivate. */
function lineweb_share_cards_plugin_action_links( $links ) {
	array_unshift(
		$links,
		sprintf(
			'<a href="%1$s">%2$s</a>',
			esc_url( admin_url( 'admin.php?page=lineweb-share-cards' ) ),
			esc_html__( 'Create share card', 'lineweb-share-cards' )
		)
	);
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( LINEWEB_SHARE_CARDS_FILE ), 'lineweb_share_cards_plugin_action_links' );

/** Render one feature summary. */
function lineweb_share_cards_admin_feature( $icon, $meta, $title, $description ) {
	?>
	<div class="lineweb-suite-admin__feature-card">
		<span class="lineweb-suite-admin__icon" aria-hidden="true"><span class="dashicons <?php echo esc_attr( $icon ); ?>"></span></span>
		<span>
			<span class="lineweb-suite-admin__feature-meta"><?php echo esc_html( $meta ); ?></span>
			<h3><?php echo esc_html( $title ); ?></h3>
			<p><?php echo esc_html( $description ); ?></p>
		</span>
	</div>
	<?php
}
/** Render the Share Cards administration home. */
function lineweb_share_cards_render_admin_page() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( esc_html__( 'You do not have permission to access this page.', 'lineweb-share-cards' ) );
	}

	$woo_active = class_exists( 'WooCommerce' );
	?>
	<div class="wrap lineweb-suite-admin">
		<section class="lineweb-suite-admin__hero" aria-labelledby="lineweb-share-cards-title">
			<div>
				<p class="lineweb-suite-admin__eyebrow"><?php esc_html_e( 'Lineweb Share Cards', 'lineweb-share-cards' ); ?></p>
				<h1 id="lineweb-share-cards-title"><?php esc_html_e( 'Turn the useful part of a page into an image people can carry with them.', 'lineweb-share-cards' ); ?></h1>
				<p class="lineweb-suite-admin__lede"><?php esc_html_e( 'Add one Gutenberg block, choose a practical format, and let visitors create a branded PNG without an account, external API, or tracking.', 'lineweb-share-cards' ); ?></p>
				<div class="lineweb-suite-admin__actions">
					<a class="lineweb-suite-admin__button lineweb-suite-admin__button--primary" href="<?php echo esc_url( admin_url( 'post-new.php?post_type=page' ) ); ?>"><span class="dashicons dashicons-plus-alt2" aria-hidden="true"></span><?php esc_html_e( 'Create on a page', 'lineweb-share-cards' ); ?></a>
					<a class="lineweb-suite-admin__button lineweb-suite-admin__button--secondary" href="<?php echo esc_url( admin_url( 'post-new.php' ) ); ?>"><?php esc_html_e( 'Create in a post', 'lineweb-share-cards' ); ?></a>
				</div>
			</div>
			<aside class="lineweb-suite-admin__brand-card" aria-label="<?php esc_attr_e( 'Plugin status', 'lineweb-share-cards' ); ?>">
				<img class="lineweb-suite-admin__brand-mark" src="<?php echo esc_url( LINEWEB_SHARE_CARDS_URL . 'assets/lineweb-logo.png' ); ?>" alt="<?php esc_attr_e( 'Lineweb — Creative Digital Agency', 'lineweb-share-cards' ); ?>">
				<div class="lineweb-suite-admin__brand-status">
					<div class="lineweb-suite-admin__status"><?php esc_html_e( 'Share Cards is active', 'lineweb-share-cards' ); ?></div>
					<p class="lineweb-suite-admin__brand-meta"><?php echo esc_html( sprintf( /* translators: %s: plugin version. */ __( 'Version %s · Local PNG generation', 'lineweb-share-cards' ), LINEWEB_SHARE_CARDS_VERSION ) ); ?></p>
				</div>
			</aside>
		</section>

		<div class="lineweb-suite-admin__quick-stats" aria-label="<?php esc_attr_e( 'Plugin summary', 'lineweb-share-cards' ); ?>">
			<div class="lineweb-suite-admin__stat"><strong>4</strong><span><?php esc_html_e( 'practical card types', 'lineweb-share-cards' ); ?></span></div>
			<div class="lineweb-suite-admin__stat"><strong>3</strong><span><?php esc_html_e( 'exact social formats', 'lineweb-share-cards' ); ?></span></div>
			<div class="lineweb-suite-admin__stat"><strong>0</strong><span><?php esc_html_e( 'accounts or external requests', 'lineweb-share-cards' ); ?></span></div>
		</div>

		<section class="lineweb-suite-admin__section" aria-labelledby="lineweb-share-cards-features">
			<div class="lineweb-suite-admin__section-heading">
				<h2 id="lineweb-share-cards-features"><?php esc_html_e( 'What you can publish', 'lineweb-share-cards' ); ?></h2>
				<p><?php esc_html_e( 'Every option remains readable without JavaScript. JavaScript is used only when a visitor creates, shares, downloads, or copies.', 'lineweb-share-cards' ); ?></p>
			</div>
			<div class="lineweb-suite-admin__feature-grid">
				<?php
				lineweb_share_cards_admin_feature( 'dashicons-format-quote', __( 'Posts and pages', 'lineweb-share-cards' ), __( 'Quote or key takeaway', 'lineweb-share-cards' ), __( 'Make the strongest idea in an article easy to save and share with its source URL.', 'lineweb-share-cards' ) );
				lineweb_share_cards_admin_feature( 'dashicons-chart-bar', __( 'Reports and case studies', 'lineweb-share-cards' ), __( 'Statistic with context', 'lineweb-share-cards' ), __( 'Pair one honest number with the sentence needed to understand what it means.', 'lineweb-share-cards' ) );
				lineweb_share_cards_admin_feature( 'dashicons-cart', $woo_active ? __( 'WooCommerce active', 'lineweb-share-cards' ) : __( 'Optional WooCommerce', 'lineweb-share-cards' ), __( 'Live product highlight', 'lineweb-share-cards' ), __( 'Select a product and keep its title, price, availability, image, and link current.', 'lineweb-share-cards' ) );
				lineweb_share_cards_admin_feature( 'dashicons-smartphone', __( 'Visitor action', 'lineweb-share-cards' ), __( 'Share, download, or copy', 'lineweb-share-cards' ), __( 'Use the native share sheet when image files are supported, with a clear PNG fallback.', 'lineweb-share-cards' ) );
				?>
			</div>
		</section>

		<section class="lineweb-suite-admin__section" aria-labelledby="lineweb-share-cards-workflow">
			<div class="lineweb-suite-admin__section-heading">
				<h2 id="lineweb-share-cards-workflow"><?php esc_html_e( 'A three-step workflow', 'lineweb-share-cards' ); ?></h2>
				<p><?php esc_html_e( 'Search the inserter for “Shareable Quote & Social Card”.', 'lineweb-share-cards' ); ?></p>
			</div>
			<div class="lineweb-suite-admin__workflow">
				<div class="lineweb-suite-admin__step"><span>01</span><strong><?php esc_html_e( 'Choose the useful part', 'lineweb-share-cards' ); ?></strong><p><?php esc_html_e( 'Use a quote, takeaway, statistic, or one real product.', 'lineweb-share-cards' ); ?></p></div>
				<div class="lineweb-suite-admin__step"><span>02</span><strong><?php esc_html_e( 'Apply site branding', 'lineweb-share-cards' ); ?></strong><p><?php esc_html_e( 'Set the format, colors, logo, domain, image, and optional source QR.', 'lineweb-share-cards' ); ?></p></div>
				<div class="lineweb-suite-admin__step"><span>03</span><strong><?php esc_html_e( 'Publish normally', 'lineweb-share-cards' ); ?></strong><p><?php esc_html_e( 'Visitors use the controls on the page. Nothing is sent to Lineweb.', 'lineweb-share-cards' ); ?></p></div>
			</div>
		</section>

		<section class="lineweb-suite-admin__section lineweb-suite-admin__support">
			<div class="lineweb-suite-admin__support-brand"><img src="<?php echo esc_url( LINEWEB_SHARE_CARDS_URL . 'assets/lineweb-logo.png' ); ?>" alt="<?php esc_attr_e( 'Lineweb — Creative Digital Agency', 'lineweb-share-cards' ); ?>"></div>
			<div><h2><?php esc_html_e( 'A free, self-contained WordPress tool.', 'lineweb-share-cards' ); ?></h2><p><?php esc_html_e( 'No telemetry, no account, no automatic posting, and no forced public Lineweb credit.', 'lineweb-share-cards' ); ?></p></div>
			<div class="lineweb-suite-admin__support-links"><a href="https://lineweb.gr/" target="_blank" rel="noopener noreferrer">lineweb.gr</a><a href="https://lineweb.gr/contact/" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Support', 'lineweb-share-cards' ); ?></a></div>
		</section>
	</div>
	<?php
}
