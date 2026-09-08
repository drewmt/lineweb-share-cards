=== Shareable Quote Images & Social Cards – Lineweb Share Cards ===
Contributors: lineweb
Tags: social share, quote image, social card, gutenberg, woocommerce
Requires at least: 6.9
Tested up to: 7.1
Requires PHP: 8.3
Stable tag: 0.2.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Create branded social images from posts and products, export four sizes in one ZIP, and add shareable quote cards in Gutenberg.

== Description ==

Lineweb Share Cards adds a Social Image Studio and one practical Gutenberg block for content that people may want to save or share as an image.

Open Share Cards → Image Studio or use Create social image on a published article, page, or visible WooCommerce product. The studio prefills the title, image, source URL, and current product price/availability. Editing the card never changes its source.

Choose Editorial, Split frame, Photo poster, or Type focus. Customize the copy, logo, colors, alignment, and local system font. Download the exact preview as PNG or all four formats in one ZIP. Administrators can save brand defaults; existing blocks keep their own settings until an editor chooses Apply saved brand.

Card types:

* Quote with an optional author or source.
* Key takeaway from a post, page, or guide.
* Statistic paired with the context needed to understand it.
* One manually selected WooCommerce product with live title, price, availability, image, and link.

Choose square 1080 × 1080, portrait 1080 × 1350, landscape 1200 × 630, or Story 1080 × 1920 output. Apply a preset, site colors, optional logo, domain, source-page QR code, and image.

On the published page, visitors can use native image sharing where their browser supports file sharing, download the PNG, or copy a source-aware caption. When file sharing is unavailable, the share action downloads the PNG and explains the fallback.

The visible card uses semantic server-rendered content before JavaScript runs. PNG and QR generation happen locally in the visitor's browser. There is no account, telemetry, tracking, external image service, or automatic social posting.

WooCommerce is optional. Quote, takeaway, and statistic cards work without it. Product cards are always inserted manually and never appear automatically in Product, Cart, Checkout, or Mini-Cart locations.

== Installation ==

1. Upload and activate Lineweb Share Cards.
2. Open Share Cards in WordPress administration for the quick guide.
3. Edit a post, page, product, or buying guide.
4. Insert Shareable Quote & Social Card.
5. Choose the card type, output format, content, branding, and optional source QR.
6. Publish normally.

== Screenshots ==

1. Dark, centered Lineweb administration home with direct creation links and a clear feature overview.
2. Live Gutenberg editor preview for a landscape quote card using synthetic editorial content.
3. Published desktop quote card with source QR plus share, PNG download, and caption-copy controls.
4. Responsive 375-pixel quote card with readable content and full-width 44-pixel actions.
5. Published WooCommerce product card using a synthetic product's live title, price, stock state, image, and link.
6. Social Image Studio with a product source, reusable brand controls, exact preview, and PNG or ZIP export.
7. Social Image Studio on a narrow mobile screen, using only synthetic demonstration content.

== Frequently Asked Questions ==

= Does the studio change my articles or products? =

No. It prefills a new image from a published, non-password-protected source the current user can edit. Product sources must also be catalog-visible. This is a snapshot when the studio opens, not a live image after download. Reopen the studio to refresh source data, and review text and prices before posting. Image drafts and generated files are not saved on the server.

= What if text is too long or an image cannot load? =

The studio warns when it shortens text to fit. A missing or browser-blocked selected image prevents export until you remove or replace it. Review every image in a multi-format ZIP before posting. Photo poster uses white text on a dark overlay; Type focus omits the selected image.

= Does the plugin post to social networks? =

No. It opens the visitor's native share sheet only when the browser confirms PNG file-sharing support. The visitor remains in control of the destination and final action.

= What happens when image sharing is unavailable? =

The Share image action downloads the PNG and reports the fallback. A separate Download PNG action is always present.

= Are generated images uploaded anywhere? =

No. Canvas and QR generation happen locally in the browser. The plugin does not store generated files or send them to Lineweb.

= Does it track shares or visitors? =

No. It adds no share counter, analytics event, telemetry, visitor profile, account, or external request.

= Is WooCommerce required? =

Only for the live product card type. Quote, takeaway, and statistic cards work on ordinary WordPress installations.

= Are product cards inserted automatically? =

No. An editor selects one product inside a manually inserted block. The plugin never adds promotions to WooCommerce templates automatically.

= Can I remove the logo or domain? =

Yes. Logo, domain, and QR attribution are independent editor controls. The plugin does not force public Lineweb credit.

= Why can an externally hosted image be missing from the PNG? =

Browsers do not allow Canvas to export an image from another domain unless that image server grants CORS permission. Media Library images normally use the site's own origin. When a remote image is blocked, the readable card still works and the PNG is generated without that image.

== Privacy ==

The plugin stores block settings inside normal WordPress post content and administrator-saved brand defaults in its own WordPress option. It does not store visitor interactions, studio image drafts, or generated images. No telemetry, tracking, account, or Lineweb request is added.

== Third-party notice ==

The compiled frontend module includes qrcode under the MIT License:

Copyright (c) 2012 Ryan Day

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

== Support and Security ==

For support, use https://lineweb.gr/contact/ and include the plugin version, WordPress version, theme, selected card type, browser, and reproduction steps.

Report suspected vulnerabilities privately through https://lineweb.gr/contact/. Do not publish credentials or customer data.

== Changelog ==

= 0.2.0 =

* Social Image Studio with article, page, and WooCommerce product sources.
* Four layouts, exact preview, single PNG and four-format ZIP export.
* Story 1080 × 1920, saved brand defaults, and local system fonts.
* Source permissions, image error handling, text-fit warnings, Greek translations, and mobile screenshots.

= 0.1.0 =

* Initial quote, takeaway, statistic, and optional WooCommerce product card modes.
* Local square, portrait, and landscape PNG generation.
* Native file sharing with download and caption-copy fallbacks.
* Optional site logo, domain, source-page QR code, and four restrained style presets.
* Branded administration home, complete Greek localization, and scoped frontend assets.
