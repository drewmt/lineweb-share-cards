import { readFile } from 'node:fs/promises';

const build = new URL( '../build/share-card/', import.meta.url );
for ( const file of [
	'index.css',
	'index-rtl.css',
	'style-index.css',
	'style-index-rtl.css',
] ) {
	const contents = await readFile( new URL( file, build ), 'utf8' );
	if ( ! contents.trim() ) {
		throw new Error( `Empty generated stylesheet: ${ file }` );
	}
}

process.stdout.write( 'Share Card editor and frontend RTL styles verified.\n' );
