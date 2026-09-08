// A small ZIP writer for already-compressed PNGs. CRC-32 uses unsigned bitwise arithmetic.
/* eslint-disable no-bitwise */
export function crc32( bytes ) {
	let crc = 0xffffffff;
	for ( const byte of bytes ) {
		crc ^= byte;
		for ( let bit = 0; bit < 8; bit++ ) {
			crc = ( crc >>> 1 ) ^ ( crc & 1 ? 0xedb88320 : 0 );
		}
	}
	return ( crc ^ 0xffffffff ) >>> 0;
}

export async function pngZip( entries ) {
	if ( ! entries.length || entries.length > 4 ) {
		throw new Error( 'A card archive contains one to four PNGs.' );
	}
	const parts = [];
	const directory = [];
	const names = new Set();
	let offset = 0;
	let directorySize = 0;
	for ( const { name, blob } of entries ) {
		if ( ! /^[^/\\]+\.png$/i.test( name ) || names.has( name ) ) {
			throw new Error( 'PNG filenames must be unique basenames.' );
		}
		names.add( name );
		const filename = new TextEncoder().encode( name );
		const bytes = new Uint8Array( await blob.arrayBuffer() );
		if ( bytes.length > 32 * 1024 * 1024 || filename.length > 255 ) {
			throw new Error( 'PNG exceeds the archive limit.' );
		}
		const checksum = crc32( bytes );
		const header = new Uint8Array( 30 );
		const view = new DataView( header.buffer );
		view.setUint32( 0, 0x04034b50, true );
		view.setUint16( 4, 20, true );
		view.setUint16( 6, 0x0800, true ); // UTF-8 filenames.
		view.setUint16( 12, 33, true ); // 1980-01-01, deterministic DOS date.
		view.setUint32( 14, checksum, true );
		view.setUint32( 18, bytes.length, true );
		view.setUint32( 22, bytes.length, true );
		view.setUint16( 26, filename.length, true );
		parts.push( header, filename, bytes );

		const central = new Uint8Array( 46 );
		const index = new DataView( central.buffer );
		index.setUint32( 0, 0x02014b50, true );
		index.setUint16( 4, 20, true );
		central.set( header.subarray( 4, 28 ), 6 );
		index.setUint32( 42, offset, true );
		directory.push( central, filename );
		directorySize += central.length + filename.length;
		offset += header.length + filename.length + bytes.length;
	}
	const footer = new Uint8Array( 22 );
	const view = new DataView( footer.buffer );
	view.setUint32( 0, 0x06054b50, true );
	view.setUint16( 8, entries.length, true );
	view.setUint16( 10, entries.length, true );
	view.setUint32( 12, directorySize, true );
	view.setUint32( 16, offset, true );
	return new Blob( [ ...parts, ...directory, footer ], {
		type: 'application/zip',
	} );
}
