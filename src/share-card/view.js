import QRCode from 'qrcode';

import {
	cardContent,
	cardDimensions,
	hasStrongRtlCharacter,
	safeFilename,
	shareCaption,
} from '../shared/card-model';

function roundedRect( context, x, y, width, height, radius ) {
	const safeRadius = Math.min( radius, width / 2, height / 2 );
	context.beginPath();
	context.moveTo( x + safeRadius, y );
	context.lineTo( x + width - safeRadius, y );
	context.quadraticCurveTo( x + width, y, x + width, y + safeRadius );
	context.lineTo( x + width, y + height - safeRadius );
	context.quadraticCurveTo(
		x + width,
		y + height,
		x + width - safeRadius,
		y + height
	);
	context.lineTo( x + safeRadius, y + height );
	context.quadraticCurveTo( x, y + height, x, y + height - safeRadius );
	context.lineTo( x, y + safeRadius );
	context.quadraticCurveTo( x, y, x + safeRadius, y );
	context.closePath();
}

function wrapLines( context, text, maxWidth ) {
	return String( text || '' )
		.split( /\n/ )
		.flatMap( ( paragraph ) => {
			const words = paragraph.trim().split( /\s+/ ).filter( Boolean );
			if ( words.length === 0 ) {
				return [ '' ];
			}
			const lines = [];
			let line = words.shift();
			for ( const word of words ) {
				const candidate = `${ line } ${ word }`;
				if ( context.measureText( candidate ).width <= maxWidth ) {
					line = candidate;
				} else {
					lines.push( line );
					line = word;
				}
			}
			lines.push( line );
			return lines;
		} );
}

function fitLines( context, text, maxWidth, maxLines, startSize, minSize ) {
	for ( let size = startSize; size >= minSize; size -= 2 ) {
		context.font = `700 ${ size }px Arial, sans-serif`;
		const lines = wrapLines( context, text, maxWidth );
		if ( lines.length <= maxLines ) {
			return { lines, size };
		}
	}
	context.font = `700 ${ minSize }px Arial, sans-serif`;
	const lines = wrapLines( context, text, maxWidth ).slice( 0, maxLines );
	if ( lines.length ) {
		let last = lines[ lines.length - 1 ];
		while (
			last.length > 1 &&
			context.measureText( `${ last }…` ).width > maxWidth
		) {
			last = last.slice( 0, -1 );
		}
		lines[ lines.length - 1 ] = `${ last.trim() }…`;
	}
	return { lines, size: minSize };
}

function drawLines( context, lines, x, y, lineHeight ) {
	lines.forEach( ( line, index ) => {
		context.fillText( line, x, y + index * lineHeight );
	} );
}

function loadImage( source ) {
	if ( ! source ) {
		return Promise.resolve( null );
	}
	return new Promise( ( resolve ) => {
		const image = new window.Image();
		try {
			const sourceUrl = new URL( source, window.location.href );
			if ( sourceUrl.origin !== window.location.origin ) {
				image.crossOrigin = 'anonymous';
			}
		} catch {
			resolve( null );
			return;
		}
		image.decoding = 'async';
		image.onload = () => resolve( image );
		image.onerror = () => resolve( null );
		image.src = source;
	} );
}

function drawImageCover( context, image, x, y, width, height ) {
	const scale = Math.max(
		width / image.naturalWidth,
		height / image.naturalHeight
	);
	const drawnWidth = image.naturalWidth * scale;
	const drawnHeight = image.naturalHeight * scale;
	context.save();
	roundedRect( context, x, y, width, height, 28 );
	context.clip();
	context.drawImage(
		image,
		x + ( width - drawnWidth ) / 2,
		y + ( height - drawnHeight ) / 2,
		drawnWidth,
		drawnHeight
	);
	context.restore();
}

async function qrCanvas( text, size, dark, light ) {
	if ( ! text ) {
		return null;
	}
	const canvas = document.createElement( 'canvas' );
	try {
		await QRCode.toCanvas( canvas, text, {
			errorCorrectionLevel: 'M',
			margin: 1,
			width: size,
			color: { dark, light },
		} );
		return canvas;
	} catch {
		return null;
	}
}

function layoutFor( config, width, height, hasImage ) {
	const padding = Math.round( Math.min( width, height ) * 0.074 );
	if ( ! hasImage ) {
		return {
			padding,
			bodyX: padding,
			bodyY: padding,
			bodyWidth: width - padding * 2,
			bodyHeight: height - padding * 2,
			image: null,
		};
	}
	if ( config.ratio === 'landscape' ) {
		const imageWidth = Math.round( width * 0.37 );
		return {
			padding,
			bodyX: padding,
			bodyY: padding,
			bodyWidth: width - imageWidth - padding * 3,
			bodyHeight: height - padding * 2,
			image: {
				x: width - imageWidth - padding,
				y: padding,
				width: imageWidth,
				height: height - padding * 2,
			},
		};
	}
	const imageHeight = Math.round(
		height * ( config.ratio === 'portrait' ? 0.34 : 0.35 )
	);
	return {
		padding,
		bodyX: padding,
		bodyY: padding + imageHeight + Math.round( padding * 0.65 ),
		bodyWidth: width - padding * 2,
		bodyHeight: height - imageHeight - padding * 2.65,
		image: {
			x: padding,
			y: padding,
			width: width - padding * 2,
			height: imageHeight,
		},
	};
}

function canvasAlignment( configured, isRtl ) {
	if ( configured === 'center' ) {
		return 'center';
	}
	return isRtl ? 'right' : 'left';
}

function primaryFontSize( config, isStatistic ) {
	if ( isStatistic ) {
		return config.ratio === 'landscape' ? 132 : 180;
	}
	return config.ratio === 'landscape' ? 58 : 78;
}

function primaryLineLimit( config, hasImage ) {
	if ( config.ratio === 'landscape' ) {
		return 4;
	}
	return hasImage ? 5 : 7;
}

async function renderCard( config ) {
	const dimensions = cardDimensions( config.ratio );
	const canvas = document.createElement( 'canvas' );
	canvas.width = dimensions.width;
	canvas.height = dimensions.height;
	const context = canvas.getContext( '2d', { alpha: false } );
	const [ image, logo ] = await Promise.all( [
		loadImage( config.imageUrl ),
		loadImage( config.logoUrl ),
	] );
	const layout = layoutFor(
		config,
		canvas.width,
		canvas.height,
		Boolean( image )
	);
	const primary = cardContent( config );
	const isRtl = hasStrongRtlCharacter(
		`${ primary.primary } ${ primary.secondary }`
	);
	const align = canvasAlignment( config.textAlign, isRtl );
	let textX = layout.bodyX;
	if ( align === 'center' ) {
		textX = layout.bodyX + layout.bodyWidth / 2;
	} else if ( align === 'right' ) {
		textX = layout.bodyX + layout.bodyWidth;
	}

	context.fillStyle = config.backgroundColor;
	context.fillRect( 0, 0, canvas.width, canvas.height );
	context.fillStyle = config.accentColor;
	context.fillRect(
		0,
		0,
		Math.max( 12, canvas.width * 0.012 ),
		canvas.height
	);
	if ( image && layout.image ) {
		drawImageCover(
			context,
			image,
			layout.image.x,
			layout.image.y,
			layout.image.width,
			layout.image.height
		);
	}

	context.direction = isRtl ? 'rtl' : 'ltr';
	context.textAlign = align;
	context.textBaseline = 'alphabetic';
	context.fillStyle = config.accentColor;
	context.font = '700 28px Arial, sans-serif';
	context.fillText(
		String( config.eyebrow || '' ).toUpperCase(),
		textX,
		layout.bodyY + 34
	);

	const primaryStart =
		layout.bodyY + ( config.ratio === 'landscape' ? 122 : 150 );
	const isStatistic = config.mode === 'statistic';
	const startSize = primaryFontSize( config, isStatistic );
	const minSize = isStatistic ? 92 : 42;
	const maxLines = primaryLineLimit( config, Boolean( image ) );
	const fitted = fitLines(
		context,
		primary.primary,
		layout.bodyWidth,
		maxLines,
		startSize,
		minSize
	);
	context.fillStyle = config.textColor;
	context.font = `700 ${ fitted.size }px Arial, sans-serif`;
	const lineHeight = Math.round( fitted.size * 1.12 );
	drawLines( context, fitted.lines, textX, primaryStart, lineHeight );

	const secondaryY = primaryStart + fitted.lines.length * lineHeight + 34;
	if ( primary.secondary ) {
		context.globalAlpha = 0.78;
		context.font = `500 ${
			config.ratio === 'landscape' ? 25 : 30
		}px Arial, sans-serif`;
		const secondaryLines = wrapLines(
			context,
			primary.secondary,
			layout.bodyWidth
		).slice( 0, 3 );
		drawLines(
			context,
			secondaryLines,
			textX,
			secondaryY,
			config.ratio === 'landscape' ? 34 : 42
		);
		context.globalAlpha = 1;
	}

	const brandY = canvas.height - layout.padding - 32;
	let brandX = layout.bodyX;
	if ( logo ) {
		const logoSize = config.ratio === 'landscape' ? 52 : 64;
		const logoScale = Math.min(
			logoSize / logo.naturalWidth,
			logoSize / logo.naturalHeight
		);
		const logoWidth = logo.naturalWidth * logoScale;
		const logoHeight = logo.naturalHeight * logoScale;
		context.drawImage(
			logo,
			brandX,
			brandY - logoHeight + 10,
			logoWidth,
			logoHeight
		);
		brandX += logoWidth + 22;
	}
	if ( config.showDomain && config.domain ) {
		context.direction = 'ltr';
		context.textAlign = 'left';
		context.fillStyle = config.textColor;
		context.globalAlpha = 0.8;
		context.font = '600 25px Arial, sans-serif';
		context.fillText( config.domain, brandX, brandY );
		context.globalAlpha = 1;
	}

	if ( config.showQr ) {
		const size = config.ratio === 'landscape' ? 92 : 112;
		const qr = await qrCanvas(
			config.pageUrl,
			size,
			config.textColor,
			config.backgroundColor
		);
		if ( qr ) {
			context.drawImage(
				qr,
				canvas.width - layout.padding - size,
				canvas.height - layout.padding - size,
				size,
				size
			);
		}
	}

	return new Promise( ( resolve, reject ) => {
		try {
			canvas.toBlob( ( blob ) => {
				if ( blob ) {
					resolve( blob );
				} else {
					reject( new Error( 'Canvas export returned no image.' ) );
				}
			}, 'image/png' );
		} catch ( error ) {
			reject( error );
		}
	} );
}

function downloadBlob( blob, filename ) {
	const url = URL.createObjectURL( blob );
	const anchor = document.createElement( 'a' );
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild( anchor );
	anchor.click();
	anchor.remove();
	window.setTimeout( () => URL.revokeObjectURL( url ), 500 );
}

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
