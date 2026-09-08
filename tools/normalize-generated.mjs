import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const manifestPath = new URL( '../build/blocks-manifest.php', import.meta.url );
const manifest = await readFile( manifestPath, 'utf8' );
const directAccessGuard = "defined( 'ABSPATH' ) || exit;";
const guardedManifest = manifest.includes( directAccessGuard )
	? manifest
	: manifest.replace( /^<\?php\n/, `<?php\n${ directAccessGuard }\n` );

await writeFile( manifestPath, guardedManifest.replace( /[\t ]+$/gm, '' ) );

for ( const entry of [ 'share-card/view', 'studio/index' ] ) {
	const scriptPath = new URL( `../build/${ entry }.js`, import.meta.url );
	const assetPath = new URL(
		`../build/${ entry }.asset.php`,
		import.meta.url
	);
	const script = await readFile( scriptPath, 'utf8' );
	const normalized = script
		.replace( /(?:\.\.\/)+node_modules\//g, 'node_modules/' )
		.replace( /\.\/node_modules\//g, 'node_modules/' );
	const version = createHash( 'sha256' )
		.update( normalized )
		.digest( 'hex' )
		.slice( 0, 20 );
	const asset = await readFile( assetPath, 'utf8' );
	await writeFile( scriptPath, normalized );
	await writeFile(
		assetPath,
		asset.replace(
			/'version' => '[a-f0-9]+'/,
			`'version' => '${ version }'`
		)
	);
}
