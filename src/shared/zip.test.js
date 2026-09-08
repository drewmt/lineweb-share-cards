/** @jest-environment node */ // eslint-disable-line jsdoc/check-tag-names
import { crc32, pngZip } from './zip';

describe( 'social image ZIP', () => {
	it( 'uses the published CRC-32 check value', () => {
		expect( crc32( new TextEncoder().encode( '123456789' ) ) ).toBe(
			0xcbf43926
		);
	} );

	it( 'writes matching local and central entries for UTF-8 names', async () => {
		const zip = await pngZip( [
			{ name: 'κάρτα.png', blob: new Blob( [ 'PNG fixture' ] ) },
		] );
		const bytes = await zip.arrayBuffer();
		const view = new DataView( bytes );
		expect( view.getUint32( 0, true ) ).toBe( 0x04034b50 );
		expect( view.getUint16( 6, true ) ).toBe( 0x0800 );
		const end = bytes.byteLength - 22;
		expect( view.getUint32( end, true ) ).toBe( 0x06054b50 );
		expect( view.getUint16( end + 8, true ) ).toBe( 1 );
		const central = view.getUint32( end + 16, true );
		expect( view.getUint32( central, true ) ).toBe( 0x02014b50 );
		expect( view.getUint32( central + 16, true ) ).toBe(
			view.getUint32( 14, true )
		);
		expect( view.getUint32( central + 42, true ) ).toBe( 0 );
	} );

	it( 'rejects duplicate names and paths', async () => {
		const entry = { name: 'card.png', blob: new Blob( [ 'fixture' ] ) };
		await expect( pngZip( [ entry, entry ] ) ).rejects.toThrow(
			'unique basenames'
		);
		await expect(
			pngZip( [ { ...entry, name: '../card.png' } ] )
		).rejects.toThrow( 'unique basenames' );
		await expect( pngZip( [] ) ).rejects.toThrow( 'one to four' );
	} );
} );
