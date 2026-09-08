import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	ColorPalette,
	ComboboxControl,
	Notice,
	PanelBody,
	SelectControl,
	Spinner,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cardFont } from '../shared/card-model';

import {
	formatProductPrice,
	useProductCatalog,
} from '../shared/product-catalog';

const EDITOR = window.linewebShareCardsEditor || {};
const THEME_PRESETS = {
	editorial: {
		backgroundColor: '#f4efe9',
		textColor: '#1b1715',
		accentColor: '#d64a31',
	},
	signal: {
		backgroundColor: '#173b32',
		textColor: '#f8f5ee',
		accentColor: '#f1b85b',
	},
	minimal: {
		backgroundColor: '#ffffff',
		textColor: '#171717',
		accentColor: '#171717',
	},
	dark: {
		backgroundColor: '#111418',
		textColor: '#f7f4ef',
		accentColor: '#ff765d',
	},
};

function imageAttributes( prefix, media ) {
	return {
		[ `${ prefix }Id` ]: Number( media?.id ) || 0,
		[ `${ prefix }Url` ]: media?.sizes?.large?.url || media?.url || '',
		...( prefix === 'media'
			? { mediaAlt: media?.alt || media?.caption || '' }
			: {} ),
	};
}

function MediaControl( { label, id, url, onSelect, onRemove } ) {
	return (
		<div className="lwsc-editor-media">
			<strong>{ label }</strong>
			{ url && <img src={ url } alt="" /> }
			<div className="lwsc-editor-media__actions">
				<MediaUploadCheck>
					<MediaUpload
						allowedTypes={ [ 'image' ] }
						value={ id || undefined }
						onSelect={ onSelect }
						render={ ( { open } ) => (
							<Button variant="secondary" onClick={ open }>
								{ url
									? __(
											'Replace image',
											'lineweb-share-cards'
									  )
									: __(
											'Choose image',
											'lineweb-share-cards'
									  ) }
							</Button>
						) }
					/>
				</MediaUploadCheck>
				{ url && (
					<Button
						variant="tertiary"
						isDestructive
						onClick={ onRemove }
					>
						{ __( 'Remove', 'lineweb-share-cards' ) }
					</Button>
				) }
			</div>
		</div>
	);
}

function ProductPreview( { product } ) {
	if ( ! product ) {
		return (
			<p className="lwsc-card__placeholder">
				{ __(
					'Choose a published product to preview live data.',
					'lineweb-share-cards'
				) }
			</p>
		);
	}
	const image = product.images?.[ 0 ];
	return (
		<div className="lwsc-card__product">
			{ image?.src && <img src={ image.src } alt="" /> }
			<div>
				<p className="lwsc-card__product-name">{ product.name }</p>
				<p className="lwsc-card__product-meta">
					{ formatProductPrice( product ) }
					{ ' · ' }
					{ product.is_in_stock
						? __( 'In stock', 'lineweb-share-cards' )
						: __( 'Out of stock', 'lineweb-share-cards' ) }
				</p>
			</div>
		</div>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const isProduct = attributes.mode === 'product';
	const catalog = useProductCatalog(
		attributes.productId,
		Boolean( EDITOR.wooActive && isProduct )
	);
	const logoUrl = attributes.logoUrl || EDITOR.defaultLogoUrl || '';
	const domain = EDITOR.domain || 'example.com';
	const hasMedia = Boolean( attributes.mediaUrl && ! isProduct );
	const blockProps = useBlockProps( {
		className: `lwsc-share-card is-ratio-${ attributes.ratio } is-theme-${ attributes.theme }`,
		style: {
			'--lwsc-bg': attributes.backgroundColor,
			'--lwsc-text': attributes.textColor,
			'--lwsc-accent': attributes.accentColor,
			'--lwsc-align': attributes.textAlign,
			'--lwsc-font': cardFont( attributes.font ),
		},
	} );
	const removeImage = ( prefix ) =>
		setAttributes( {
			[ `${ prefix }Id` ]: 0,
			[ `${ prefix }Url` ]: '',
			...( prefix === 'media' ? { mediaAlt: '' } : {} ),
		} );
	let previewContent;
	if ( attributes.mode === 'statistic' ) {
		previewContent = (
			<>
				<p className="lwsc-card__statistic">{ attributes.statistic }</p>
				<p className="lwsc-card__statistic-label">
					{ attributes.statisticLabel }
				</p>
			</>
		);
	} else if ( isProduct ) {
		previewContent = <ProductPreview product={ catalog.product } />;
	} else {
		previewContent = (
			<>
				<RichText
					tagName={ attributes.mode === 'quote' ? 'blockquote' : 'p' }
					className="lwsc-card__content"
					value={ attributes.content }
					allowedFormats={ [ 'core/bold', 'core/italic' ] }
					placeholder={ __(
						'Write the idea people should remember…',
						'lineweb-share-cards'
					) }
					onChange={ ( content ) => setAttributes( { content } ) }
				/>
				<RichText
					tagName="p"
					className="lwsc-card__source"
					value={ attributes.source }
					allowedFormats={ [] }
					placeholder={ __(
						'Optional source or author',
						'lineweb-share-cards'
					) }
					onChange={ ( source ) => setAttributes( { source } ) }
				/>
			</>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Card content', 'lineweb-share-cards' ) }
					initialOpen
				>
					<SelectControl
						__next40pxDefaultSize
						label={ __( 'Card type', 'lineweb-share-cards' ) }
						value={ attributes.mode }
						options={ [
							{
								label: __( 'Quote', 'lineweb-share-cards' ),
								value: 'quote',
							},
							{
								label: __(
									'Key takeaway',
									'lineweb-share-cards'
								),
								value: 'takeaway',
							},
							{
								label: __( 'Statistic', 'lineweb-share-cards' ),
								value: 'statistic',
							},
							{
								label: __(
									'WooCommerce product',
									'lineweb-share-cards'
								),
								value: 'product',
							},
						] }
						onChange={ ( mode ) => setAttributes( { mode } ) }
					/>
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Small heading', 'lineweb-share-cards' ) }
						value={ attributes.eyebrow }
						onChange={ ( eyebrow ) => setAttributes( { eyebrow } ) }
					/>
					{ isProduct && ! EDITOR.wooActive && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'Activate WooCommerce to use live product cards.',
								'lineweb-share-cards'
							) }
						</Notice>
					) }
					{ isProduct && EDITOR.wooActive && (
						<>
							<ComboboxControl
								__next40pxDefaultSize
								label={ __( 'Product', 'lineweb-share-cards' ) }
								value={
									attributes.productId
										? String( attributes.productId )
										: ''
								}
								options={ catalog.options }
								onFilterValueChange={ catalog.setSearch }
								onChange={ ( value ) =>
									setAttributes( {
										productId: Number( value ) || 0,
									} )
								}
							/>
							{ catalog.isLoading && <Spinner /> }
							{ catalog.error && (
								<Notice status="error" isDismissible={ false }>
									{ catalog.error }
								</Notice>
							) }
						</>
					) }
					{ attributes.mode === 'statistic' && (
						<>
							<TextControl
								__next40pxDefaultSize
								label={ __(
									'Statistic',
									'lineweb-share-cards'
								) }
								value={ attributes.statistic }
								onChange={ ( statistic ) =>
									setAttributes( { statistic } )
								}
							/>
							<TextareaControl
								__nextHasNoMarginBottom
								label={ __(
									'Statistic context',
									'lineweb-share-cards'
								) }
								value={ attributes.statisticLabel }
								onChange={ ( statisticLabel ) =>
									setAttributes( { statisticLabel } )
								}
							/>
						</>
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Format and style', 'lineweb-share-cards' ) }
				>
					<SelectControl
						__next40pxDefaultSize
						label={ __( 'Image format', 'lineweb-share-cards' ) }
						value={ attributes.ratio }
						options={ [
							{ label: 'Square · 1080 × 1080', value: 'square' },
							{
								label: 'Portrait · 1080 × 1350',
								value: 'portrait',
							},
							{
								label: 'Landscape · 1200 × 630',
								value: 'landscape',
							},
							{
								label: __(
									'Story · 1080 × 1920',
									'lineweb-share-cards'
								),
								value: 'story',
							},
						] }
						onChange={ ( ratio ) => setAttributes( { ratio } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						label={ __( 'Style preset', 'lineweb-share-cards' ) }
						value={ attributes.theme }
						options={ [
							{
								label: __( 'Editorial', 'lineweb-share-cards' ),
								value: 'editorial',
							},
							{
								label: __( 'Signal', 'lineweb-share-cards' ),
								value: 'signal',
							},
							{
								label: __( 'Minimal', 'lineweb-share-cards' ),
								value: 'minimal',
							},
							{
								label: __( 'Dark', 'lineweb-share-cards' ),
								value: 'dark',
							},
						] }
						onChange={ ( theme ) =>
							setAttributes( {
								theme,
								...THEME_PRESETS[ theme ],
							} )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						label={ __( 'Text alignment', 'lineweb-share-cards' ) }
						value={ attributes.textAlign }
						options={ [
							{
								label: __( 'Left', 'lineweb-share-cards' ),
								value: 'left',
							},
							{
								label: __( 'Center', 'lineweb-share-cards' ),
								value: 'center',
							},
						] }
						onChange={ ( textAlign ) =>
							setAttributes( { textAlign } )
						}
					/>
					<p>
						<strong>
							{ __( 'Background', 'lineweb-share-cards' ) }
						</strong>
					</p>
					<ColorPalette
						value={ attributes.backgroundColor }
						onChange={ ( backgroundColor ) =>
							setAttributes( { backgroundColor } )
						}
						clearable={ false }
					/>
					<p>
						<strong>{ __( 'Text', 'lineweb-share-cards' ) }</strong>
					</p>
					<ColorPalette
						value={ attributes.textColor }
						onChange={ ( textColor ) =>
							setAttributes( { textColor } )
						}
						clearable={ false }
					/>
					<p>
						<strong>
							{ __( 'Accent', 'lineweb-share-cards' ) }
						</strong>
					</p>
					<ColorPalette
						value={ attributes.accentColor }
						onChange={ ( accentColor ) =>
							setAttributes( { accentColor } )
						}
						clearable={ false }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Brand and source', 'lineweb-share-cards' ) }
				>
					{ EDITOR.brand && (
						<Button
							variant="secondary"
							onClick={ () =>
								setAttributes( { ...EDITOR.brand } )
							}
						>
							{ __( 'Apply saved brand', 'lineweb-share-cards' ) }
						</Button>
					) }
					<SelectControl
						label={ __( 'Font', 'lineweb-share-cards' ) }
						value={ attributes.font }
						options={ [
							{ label: 'Arial', value: 'sans' },
							{ label: 'Georgia', value: 'serif' },
							{ label: 'Courier New', value: 'mono' },
						] }
						onChange={ ( font ) => setAttributes( { font } ) }
						__next40pxDefaultSize
					/>
					<ToggleControl
						label={ __(
							'Show site domain',
							'lineweb-share-cards'
						) }
						checked={ attributes.showDomain }
						onChange={ ( showDomain ) =>
							setAttributes( { showDomain } )
						}
					/>
					<ToggleControl
						label={ __(
							'Show QR code in the PNG',
							'lineweb-share-cards'
						) }
						checked={ attributes.showQr }
						onChange={ ( showQr ) => setAttributes( { showQr } ) }
					/>
					<ToggleControl
						label={ __( 'Show logo', 'lineweb-share-cards' ) }
						checked={ attributes.showLogo }
						onChange={ ( showLogo ) =>
							setAttributes( { showLogo } )
						}
					/>
					{ attributes.showLogo && (
						<MediaControl
							label={ __( 'Custom logo', 'lineweb-share-cards' ) }
							id={ attributes.logoId }
							url={ attributes.logoUrl }
							onSelect={ ( media ) =>
								setAttributes(
									imageAttributes( 'logo', media )
								)
							}
							onRemove={ () => removeImage( 'logo' ) }
						/>
					) }
					{ ! isProduct && (
						<MediaControl
							label={ __( 'Card image', 'lineweb-share-cards' ) }
							id={ attributes.mediaId }
							url={ attributes.mediaUrl }
							onSelect={ ( media ) =>
								setAttributes(
									imageAttributes( 'media', media )
								)
							}
							onRemove={ () => removeImage( 'media' ) }
						/>
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Sharing actions', 'lineweb-share-cards' ) }
				>
					<TextControl
						__next40pxDefaultSize
						label={ __(
							'Share button label',
							'lineweb-share-cards'
						) }
						value={ attributes.buttonLabel }
						onChange={ ( buttonLabel ) =>
							setAttributes( { buttonLabel } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						label={ __(
							'Download button label',
							'lineweb-share-cards'
						) }
						value={ attributes.downloadLabel }
						onChange={ ( downloadLabel ) =>
							setAttributes( { downloadLabel } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						label={ __(
							'Copy button label',
							'lineweb-share-cards'
						) }
						value={ attributes.copyLabel }
						onChange={ ( copyLabel ) =>
							setAttributes( { copyLabel } )
						}
					/>
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __(
							'Custom share caption',
							'lineweb-share-cards'
						) }
						help={ __(
							'Leave empty to use the card text and source URL.',
							'lineweb-share-cards'
						) }
						value={ attributes.caption }
						onChange={ ( caption ) => setAttributes( { caption } ) }
					/>
				</PanelBody>
			</InspectorControls>

			<section { ...blockProps }>
				<div
					className={ `lwsc-card__visual${
						hasMedia ? ' has-media' : ''
					}` }
				>
					{ hasMedia && (
						<img
							className="lwsc-card__media"
							src={ attributes.mediaUrl }
							alt=""
						/>
					) }
					<div className="lwsc-card__body">
						<RichText
							tagName="p"
							className="lwsc-card__eyebrow"
							value={ attributes.eyebrow }
							allowedFormats={ [] }
							placeholder={ __(
								'Small heading',
								'lineweb-share-cards'
							) }
							onChange={ ( eyebrow ) =>
								setAttributes( { eyebrow } )
							}
						/>
						{ previewContent }
						<div className="lwsc-card__brand">
							{ attributes.showLogo && logoUrl && (
								<img src={ logoUrl } alt="" />
							) }
							{ attributes.showDomain && <span>{ domain }</span> }
							{ attributes.showQr && (
								<span
									className="lwsc-card__qr-placeholder"
									aria-label={ __(
										'QR code preview',
										'lineweb-share-cards'
									) }
								>
									▦
								</span>
							) }
						</div>
					</div>
				</div>
				<div
					className="lwsc-card__actions"
					aria-label={ __(
						'Sharing controls preview',
						'lineweb-share-cards'
					) }
				>
					<Button variant="primary" disabled>
						{ attributes.buttonLabel }
					</Button>
					<Button variant="secondary" disabled>
						{ attributes.downloadLabel }
					</Button>
					<Button variant="tertiary" disabled>
						{ attributes.copyLabel }
					</Button>
				</div>
				<p className="lwsc-card__editor-note">
					{ __(
						'Buttons become active on the published page. PNG generation stays in the visitor’s browser.',
						'lineweb-share-cards'
					) }
				</p>
			</section>
		</>
	);
}
