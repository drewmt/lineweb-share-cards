import { safeFilename, shareCaption } from '../shared/card-model';
import { renderCard, downloadBlob, qrCanvas } from '../shared/canvas-renderer';

async function copyText( text ) {
	if ( navigator.clipboard?.writeText ) {
		await navigator.clipboard.writeText( text );
		return;
	}
	const area = document.createElement( 'textarea' );
	area.value = text;
	area.setAttribute( 'readonly', '' );
	area.style.position = 'fixed';
	area.style.opacity = '0';
	document.body.appendChild( area );
	area.select();
	const copied = document.execCommand( 'copy' );
	area.remove();
	if ( ! copied ) {
		throw new Error( 'Copy command failed.' );
	}
}

async function hydrateQr( root, config ) {
	const target = root.querySelector( '.lwsc-card__qr' );
	if ( ! target || ! config.pageUrl || target.childElementCount ) {
		return;
	}
	const canvas = await qrCanvas( config.pageUrl, 80, '#111111', '#ffffff' );
	if ( canvas ) {
		target.appendChild( canvas );
	}
}

function initialize( root ) {
	if ( root.dataset.lwscInitialized === 'true' ) {
		return;
	}
	let config;
	try {
		config = JSON.parse( root.dataset.lwscConfig || '{}' );
	} catch {
		return;
	}
	root.dataset.lwscInitialized = 'true';
	const status = root.querySelector( '.lwsc-card__status' );
	let imagePromise;
	const cardBlob = () => {
		if ( ! imagePromise ) {
			imagePromise = renderCard( config ).catch( ( error ) => {
				imagePromise = undefined;
				throw error;
			} );
		}
		return imagePromise;
	};
	const setBusy = ( busy ) => {
		root.querySelectorAll( '[data-lwsc-action]' ).forEach( ( button ) => {
			button.disabled = busy;
		} );
	};
	const setStatus = ( message ) => {
		if ( status ) {
			status.textContent = message || '';
		}
	};

	root.addEventListener( 'click', async ( event ) => {
		const button = event.target.closest( '[data-lwsc-action]' );
		if ( ! button || ! root.contains( button ) ) {
			return;
		}
		const action = button.dataset.lwscAction;
		if ( action === 'copy' ) {
			try {
				await copyText( shareCaption( config ) );
				setStatus( config.labels.copied );
			} catch {
				setStatus( config.labels.copyFailed );
			}
			return;
		}

		setBusy( true );
		setStatus( config.labels.generating );
		try {
			const blob = await cardBlob();
			const filename = safeFilename( config );
			if ( action === 'download' ) {
				downloadBlob( blob, filename );
				setStatus( config.labels.downloaded );
			} else {
				const file = new File( [ blob ], filename, {
					type: 'image/png',
				} );
				if (
					navigator.share &&
					navigator.canShare?.( { files: [ file ] } )
				) {
					await navigator.share( {
						files: [ file ],
						title: config.siteTitle || config.domain,
						text: shareCaption( config ),
						url: config.pageUrl,
					} );
					setStatus( config.labels.shared );
				} else {
					downloadBlob( blob, filename );
					setStatus( config.labels.shareFallback );
				}
			}
		} catch ( error ) {
			if ( error?.name !== 'AbortError' ) {
				setStatus( config.labels.generateFailed );
			}
		} finally {
			setBusy( false );
		}
	} );

	hydrateQr( root, config );
}

function initializeAll( scope = document ) {
	scope.querySelectorAll( '[data-lwsc-card]' ).forEach( initialize );
}

initializeAll();

new window.MutationObserver( ( mutations ) => {
	mutations.forEach( ( mutation ) => {
		mutation.addedNodes.forEach( ( node ) => {
			if ( node.nodeType !== window.Node.ELEMENT_NODE ) {
				return;
			}
			if ( node.matches?.( '[data-lwsc-card]' ) ) {
				initialize( node );
			}
			initializeAll( node );
		} );
	} );
} ).observe( document.documentElement, { childList: true, subtree: true } );
