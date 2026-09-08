import { __, sprintf } from '@wordpress/i18n';
import {
	CARD_RATIOS,
	cardDimensions,
	exportFilename,
} from '../shared/card-model';
import { renderCard, downloadBlob } from '../shared/canvas-renderer';
import { pngZip } from '../shared/zip';
import './index.scss';

const root = document.querySelector( '[data-lwsc-studio]' );

if ( root ) {
	const config = JSON.parse( root.dataset.config );
	const bootstrap = window.linewebShareCardsStudio;
	const form = root.querySelector( 'form' );
	const preview = root.querySelector( '[data-preview]' );
	const artboard = root.querySelector( '.lwsc-studio-artboard' );
	const feedback = root.querySelector( '[role="status"]' );
	const exportButtons = root.querySelectorAll( '[data-export]' );
	let previewUrl;
	let previewBlob;
	let revision = 0;
	let timer;
	let exporting = false;
	let saving = false;

	const status = ( text ) => {
		feedback.textContent = text;
	};
	const setExportDisabled = ( disabled ) => {
		exportButtons.forEach( ( button ) => {
			button.disabled = disabled;
		} );
	};
	async function refresh( generation ) {
		let truncated = false;
		try {
			const blob = await renderCard(
				{ ...config },
				{
					strictImages: true,
					onTruncate: () => {
						truncated = true;
					},
				}
			);
			if ( generation !== revision ) {
				return;
			}
			if ( previewUrl ) {
				URL.revokeObjectURL( previewUrl );
			}
			previewUrl = URL.createObjectURL( blob );
			preview.src = previewUrl;
			preview.hidden = false;
			previewBlob = blob;
			const { width, height } = cardDimensions( config.ratio );
			root.querySelector(
				'[data-dimensions]'
			).textContent = `${ width } × ${ height }`;
			artboard.setAttribute( 'aria-busy', 'false' );
			setExportDisabled( exporting );
			status(
				truncated
					? __(
							'Some text was shortened to fit. Shorten the headline or choose a taller format.',
							'lineweb-share-cards'
					  )
					: __(
							'Preview ready. Your download will match this image.',
							'lineweb-share-cards'
					  )
			);
		} catch {
			if ( generation !== revision ) {
				return;
			}
			previewBlob = null;
			preview.hidden = true;
			artboard.setAttribute( 'aria-busy', 'false' );
			status(
				__(
					'Preview could not be created. Choose a Media Library image that this browser can load, then try again.',
					'lineweb-share-cards'
				)
			);
		}
	}
	function schedulePreview() {
		++revision;
		previewBlob = null;
		setExportDisabled( true );
		artboard.setAttribute( 'aria-busy', 'true' );
		clearTimeout( timer );
		timer = setTimeout( () => refresh( revision ), 180 );
	}
	form.addEventListener( 'submit', ( event ) => {
		event.preventDefault();
	} );
	form.addEventListener( 'input', ( event ) => {
		const field = event.target;
		if ( ! field.name ) {
			return;
		}
		config[ field.name ] =
			field.type === 'checkbox' ? field.checked : field.value;
		schedulePreview();
	} );
	root.querySelectorAll( '[data-media]' ).forEach( ( button ) => {
		button.addEventListener( 'click', () => {
			if ( ! window.wp?.media ) {
				return;
			}
			const kind = button.dataset.media;
			const picker = window.wp.media( {
				title: button.textContent,
				library: { type: 'image' },
				multiple: false,
			} );
			picker.on( 'select', () => {
				const media = picker
					.state()
					.get( 'selection' )
					.first()
					.toJSON();
				config[ `${ kind }Url` ] = media.sizes?.large?.url || media.url;
				if ( kind === 'logo' ) {
					config.logoId = media.id;
					config.showLogo = true;
				}
				schedulePreview();
			} );
			picker.open();
		} );
	} );
	root.querySelectorAll( '[data-remove]' ).forEach( ( button ) => {
		button.addEventListener( 'click', () => {
			config[ `${ button.dataset.remove }Url` ] = '';
			if ( button.dataset.remove === 'logo' ) {
				config.logoId = 0;
				config.showLogo = false;
			}
			schedulePreview();
		} );
	} );
	const save = root.querySelector( '[data-save-brand]' );
	save?.addEventListener( 'click', async () => {
		if ( saving ) {
			return;
		}
		saving = true;
		save.disabled = true;
		try {
			const response = await fetch( bootstrap.brandUrl, {
				method: 'POST',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': bootstrap.nonce,
				},
				body: JSON.stringify(
					Object.fromEntries(
						[
							'backgroundColor',
							'textColor',
							'accentColor',
							'font',
							'logoId',
							'showLogo',
						].map( ( key ) => [ key, config[ key ] ] )
					)
				),
			} );
			if ( ! response.ok ) {
				throw new Error( 'Brand save failed.' );
			}
			status(
				__(
					'Brand defaults saved for future cards.',
					'lineweb-share-cards'
				)
			);
		} catch {
			status(
				__(
					'Brand defaults could not be saved. Reload the page and try again.',
					'lineweb-share-cards'
				)
			);
		} finally {
			saving = false;
			save.disabled = false;
		}
	} );
	exportButtons.forEach( ( button ) => {
		button.addEventListener( 'click', async () => {
			if ( exporting || ! previewBlob ) {
				return;
			}
			exporting = true;
			setExportDisabled( true );
			const snapshot = { ...config };
			const currentBlob = previewBlob;
			form.querySelectorAll( 'fieldset' ).forEach( ( fieldset ) => {
				fieldset.disabled = true;
			} );
			try {
				if ( button.dataset.export === 'single' ) {
					downloadBlob( currentBlob, exportFilename( snapshot ) );
					status( __( 'PNG downloaded.', 'lineweb-share-cards' ) );
				} else {
					const entries = [];
					let truncated = false;
					for ( const ratio of Object.keys( CARD_RATIOS ) ) {
						status(
							sprintf(
								/* translators: %d: number of the image being generated. */ __(
									'Preparing image %d of 4…',
									'lineweb-share-cards'
								),
								entries.length + 1
							)
						);
						const sized = { ...snapshot, ratio };
						const blob = await renderCard( sized, {
							strictImages: true,
							onTruncate: () => {
								truncated = true;
							},
						} );
						entries.push( { name: exportFilename( sized ), blob } );
					}
					downloadBlob( await pngZip( entries ), 'social-cards.zip' );
					status(
						truncated
							? __(
									'ZIP downloaded. Text was shortened in some formats; review each image before posting.',
									'lineweb-share-cards'
							  )
							: __(
									'All four formats downloaded in one ZIP.',
									'lineweb-share-cards'
							  )
					);
				}
			} catch {
				status(
					__(
						'Export failed. Please try again.',
						'lineweb-share-cards'
					)
				);
			} finally {
				exporting = false;
				form.querySelectorAll( 'fieldset' ).forEach( ( fieldset ) => {
					fieldset.disabled = false;
				} );
				setExportDisabled( ! previewBlob );
			}
		} );
	} );
	schedulePreview();
	window.addEventListener( 'pagehide', () => {
		if ( previewUrl ) {
			URL.revokeObjectURL( previewUrl );
		}
	} );
}
