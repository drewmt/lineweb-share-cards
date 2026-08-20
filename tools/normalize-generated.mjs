import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const manifestPath = new URL( '../build/blocks-manifest.php', import.meta.url );
const manifest = await readFile( manifestPath, 'utf8' );
const directAccessGuard = "defined( 'ABSPATH' ) || exit;";
const guardedManifest = manifest.includes( directAccessGuard )
	? manifest
	: manifest.replace( /^<\?php\n/, `<?php\n${ directAccessGuard }\n` );

await writeFile( manifestPath, guardedManifest.replace( /[\t ]+$/gm, '' ) );

const viewPath = new URL( '../build/share-card/view.js', import.meta.url );
const viewAssetPath = new URL(
	'../build/share-card/view.asset.php',
	import.meta.url
);
const view = await readFile( viewPath, 'utf8' );
const normalizedView = view
	.replace( /(?:\.\.\/)+node_modules\//g, 'node_modules/' )
	.replace( /\.\/node_modules\//g, 'node_modules/' );
const viewVersion = createHash( 'sha256' )
	.update( normalizedView )
	.digest( 'hex' )
	.slice( 0, 20 );
const viewAsset = await readFile( viewAssetPath, 'utf8' );
const normalizedViewAsset = viewAsset.replace(
	/'version' => '[a-f0-9]+'/,
	`'version' => '${ viewVersion }'`
);

await writeFile( viewPath, normalizedView );
await writeFile( viewAssetPath, normalizedViewAsset );
