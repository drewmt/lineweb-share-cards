import QRCode from 'qrcode';

import {
	cardContent,
	cardFont,
	cardDimensions,
	hasStrongRtlCharacter,
} from './card-model';

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
			const words = paragraph
				.trim()
				.split( /\s+/ )
				.filter( Boolean )
				.flatMap( ( word ) => {
					const chunks = [];
					let part = '';
					for ( const character of Array.from( word ) ) {
						if (
							part &&
							context.measureText( part + character ).width >
								maxWidth
						) {
							chunks.push( part );
							part = '';
						}
						part += character;
					}
					if ( part ) {
						chunks.push( part );
					}
					return chunks;
				} );
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

function fitLines(
	context,
	text,
	maxWidth,
	maxLines,
	startSize,
	minSize,
	font,
	maxHeight
) {
	for ( let size = startSize; size >= minSize; size -= 2 ) {
		context.font = `700 ${ size }px ${ font }`;
		const lines = wrapLines( context, text, maxWidth );
		if (
			lines.length <= maxLines &&
			lines.length * size * 1.12 <= maxHeight &&
			lines.every(
				( line ) => context.measureText( line ).width <= maxWidth
			)
		) {
			return { lines, size };
		}
	}
	context.font = `700 ${ minSize }px ${ font }`;
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
	return { lines, size: minSize, truncated: true };
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
		const timeout = window.setTimeout( () => {
			image.src = '';
			resolve( null );
		}, 10000 );
		image.onload = () => {
			window.clearTimeout( timeout );
			resolve( image );
		};
		image.onerror = () => {
			window.clearTimeout( timeout );
			resolve( null );
		};
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

export async function qrCanvas( text, size, dark, light ) {
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
	const top = config.ratio === 'story' ? 160 : padding;
	const bottom = config.ratio === 'story' ? 190 : padding;
	const body = {
		padding,
		bottom,
		bodyX: padding,
		bodyY: top,
		bodyWidth: width - padding * 2,
		bodyHeight: height - top - bottom,
		image: null,
	};
	if ( ! hasImage || config.template === 'minimal' ) {
		return body;
	}
	if ( config.template === 'poster' ) {
		body.image = { x: 0, y: 0, width, height };
		body.bodyY = height * ( config.ratio === 'landscape' ? 0.22 : 0.43 );
		body.bodyHeight = height - body.bodyY - bottom;
		return body;
	}
	if (
		config.ratio === 'landscape' ||
		( config.template === 'split' && config.ratio === 'square' )
	) {
		const imageWidth = Math.round(
			width * ( config.template === 'split' ? 0.45 : 0.37 )
		);
		body.bodyWidth = width - imageWidth - padding * 3;
		body.image = {
			x: width - imageWidth - padding,
			y: top,
			width: imageWidth,
			height: height - top - bottom,
		};
		return body;
	}
	const imageHeight = Math.round(
		( height - top - bottom ) *
			( config.template === 'split' ? 0.46 : 0.34 )
	);
	body.bodyY = top + imageHeight + padding * 0.55;
	body.bodyHeight = height - body.bodyY - bottom;
	body.image = {
		x: padding,
		y: top,
		width: width - padding * 2,
		height: imageHeight,
	};
	return body;
}

function canvasAlignment( configured, isRtl ) {
	if ( configured === 'center' ) {
		return 'center';
	}
	return isRtl ? 'right' : 'left';
}

// The same renderer supplies studio previews and visitor downloads.
export async function renderCard( config, options = {} ) {
	const dimensions = cardDimensions( config.ratio );
	const canvas = document.createElement( 'canvas' );
	canvas.width = dimensions.width;
	canvas.height = dimensions.height;
	const context = canvas.getContext( '2d', { alpha: false } );
	const wantedImage = config.template === 'minimal' ? '' : config.imageUrl;
	const [ image, logo ] = await Promise.all( [
		loadImage( wantedImage ),
		loadImage( config.logoUrl ),
	] );
	if (
		options.strictImages &&
		( ( wantedImage && ! image ) || ( config.logoUrl && ! logo ) )
	) {
		throw new Error(
			'A selected image is unavailable or does not permit canvas access.'
		);
	}
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
		textX += layout.bodyWidth / 2;
	} else if ( align === 'right' ) {
		textX += layout.bodyWidth;
	}
	const poster = config.template === 'poster' && image;
	const textColor = poster ? '#ffffff' : config.textColor;
	const accent = poster ? '#ffffff' : config.accentColor;
	const font = cardFont( config.font );

	context.fillStyle = config.backgroundColor;
	context.fillRect( 0, 0, canvas.width, canvas.height );
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
	if ( poster ) {
		const shade = context.createLinearGradient( 0, 0, 0, canvas.height );
		shade.addColorStop( 0, 'rgba(0,0,0,0.1)' );
		shade.addColorStop( 0.35, 'rgba(0,0,0,0.72)' );
		shade.addColorStop( 1, 'rgba(0,0,0,0.92)' );
		context.fillStyle = shade;
		context.fillRect( 0, 0, canvas.width, canvas.height );
	} else {
		context.fillStyle = accent;
		if ( config.template === 'minimal' ) {
			context.fillRect( layout.bodyX, layout.bodyY, layout.bodyWidth, 5 );
		} else {
			context.fillRect(
				0,
				0,
				Math.max( 12, canvas.width * 0.012 ),
				canvas.height
			);
		}
	}

	context.direction = isRtl ? 'rtl' : 'ltr';
	context.textAlign = align;
	context.textBaseline = 'top';
	context.fillStyle = accent;
	context.font = `700 24px ${ font }`;
	context.fillText(
		String( config.eyebrow || '' ).toUpperCase(),
		textX,
		layout.bodyY + 24,
		layout.bodyWidth
	);

	const primaryStart = layout.bodyY + 90;
	const brandTop = canvas.height - layout.bottom - 90;
	const secondarySize = config.ratio === 'landscape' ? 23 : 28;
	context.font = `500 ${ secondarySize }px ${ font }`;
	const secondaryRaw = wrapLines(
		context,
		primary.secondary,
		layout.bodyWidth
	);
	const secondaryLines = primary.secondary ? secondaryRaw.slice( 0, 3 ) : [];
	const secondaryHeight = secondaryLines.length * secondarySize * 1.35;
	const available = Math.max(
		32,
		brandTop - primaryStart - secondaryHeight - 40
	);
	const minSize = config.mode === 'statistic' ? 48 : 26;
	const maxLines = Math.max(
		1,
		Math.floor( available / ( minSize * 1.12 ) )
	);
	let startSize = config.ratio === 'landscape' ? 58 : 78;
	if ( config.mode === 'statistic' ) {
		startSize = 150;
	}
	const fitted = fitLines(
		context,
		primary.primary,
		layout.bodyWidth,
		maxLines,
		startSize,
		minSize,
		font,
		available
	);
	if ( fitted.truncated || secondaryRaw.length > 3 ) {
		options.onTruncate?.();
	}
	context.fillStyle = textColor;
	context.font = `700 ${ fitted.size }px ${ font }`;
	const lineHeight = fitted.size * 1.12;
	drawLines( context, fitted.lines, textX, primaryStart, lineHeight );
	if ( secondaryLines.length ) {
		context.font = `500 ${ secondarySize }px ${ font }`;
		drawLines(
			context,
			secondaryLines,
			textX,
			primaryStart + fitted.lines.length * lineHeight + 24,
			secondarySize * 1.35
		);
	}

	// Preserve the full logo aspect ratio; reserve room for the optional source QR.
	const qrSize = config.showQr ? 80 : 0;
	const brandWidth = layout.bodyWidth - ( qrSize ? qrSize + 18 : 0 );
	const logoScale = logo
		? Math.min(
				170 / logo.naturalWidth,
				64 / logo.naturalHeight,
				brandWidth / logo.naturalWidth
		  )
		: 0;
	const logoWidth = logo ? logo.naturalWidth * logoScale : 0;
	const logoHeight = logo ? logo.naturalHeight * logoScale : 0;
	context.font = `600 23px ${ font }`;
	const domain = config.showDomain ? String( config.domain || '' ) : '';
	const domainWidth = Math.min(
		context.measureText( domain ).width,
		brandWidth
	);
	const stacked = logoWidth + domainWidth + 20 > brandWidth;
	const groupWidth = stacked
		? Math.max( logoWidth, domainWidth )
		: logoWidth + ( domain ? domainWidth + ( logo ? 20 : 0 ) : 0 );
	let brandX = layout.bodyX;
	if ( align === 'center' ) {
		brandX += ( brandWidth - groupWidth ) / 2;
	} else if ( align === 'right' ) {
		brandX += brandWidth - groupWidth;
	}
	const brandY = canvas.height - layout.bottom - ( stacked ? 90 : 64 );
	if ( logo ) {
		context.drawImage(
			logo,
			brandX + ( stacked ? ( groupWidth - logoWidth ) / 2 : 0 ),
			brandY,
			logoWidth,
			logoHeight
		);
	}
	if ( domain ) {
		const domainOffset = stacked
			? ( groupWidth - domainWidth ) / 2
			: logoWidth + ( logo ? 20 : 0 );
		context.direction = 'ltr';
		context.textAlign = 'left';
		context.fillStyle = textColor;
		context.fillText(
			domain,
			brandX + domainOffset,
			brandY +
				( stacked
					? logoHeight + 10
					: Math.max( 0, ( logoHeight - 23 ) / 2 ) ),
			brandWidth
		);
	}
	if ( qrSize ) {
		const qr = await qrCanvas(
			config.pageUrl,
			qrSize,
			'#111111',
			'#ffffff'
		);
		if ( qr ) {
			context.drawImage(
				qr,
				layout.bodyX + layout.bodyWidth - qrSize,
				canvas.height - layout.bottom - qrSize,
				qrSize,
				qrSize
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

export function downloadBlob( blob, filename ) {
	const url = URL.createObjectURL( blob );
	const anchor = document.createElement( 'a' );
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild( anchor );
	anchor.click();
	anchor.remove();
	window.setTimeout( () => URL.revokeObjectURL( url ), 30000 );
}
