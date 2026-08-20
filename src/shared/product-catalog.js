import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export function useProductCatalog( productId, enabled ) {
	const selectedId = Number( productId ) || 0;
	const [ search, setSearch ] = useState( '' );
	const [ cache, setCache ] = useState( {} );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState( '' );

	useEffect( () => {
		if ( ! enabled ) {
			return undefined;
		}

		let active = true;
		const timer = window.setTimeout( async () => {
			setIsLoading( true );
			setError( '' );
			try {
				const query = new URLSearchParams( {
					per_page: '30',
					orderby: 'title',
					order: 'asc',
				} );
				if ( search.trim() ) {
					query.set( 'search', search.trim() );
				}
				const products = await apiFetch( {
					path: `/wc/store/v1/products?${ query.toString() }`,
				} );
				if ( active ) {
					setCache( ( current ) => {
						const next = { ...current };
						products.forEach( ( product ) => {
							next[ product.id ] = product;
						} );
						return next;
					} );
				}
			} catch ( requestError ) {
				if ( active ) {
					setError(
						requestError?.message ||
							__(
								'WooCommerce products could not be loaded.',
								'lineweb-share-cards'
							)
					);
				}
			} finally {
				if ( active ) {
					setIsLoading( false );
				}
			}
		}, 180 );

		return () => {
			active = false;
			window.clearTimeout( timer );
		};
	}, [ enabled, search ] );

	useEffect( () => {
		if ( ! enabled || ! selectedId || cache[ selectedId ] ) {
			return undefined;
		}
		let active = true;
		apiFetch( {
			path: `/wc/store/v1/products?include=${ selectedId }&per_page=1`,
		} )
			.then( ( products ) => {
				if ( active && products[ 0 ] ) {
					setCache( ( current ) => ( {
						...current,
						[ products[ 0 ].id ]: products[ 0 ],
					} ) );
				}
			} )
			.catch( () => {} );
		return () => {
			active = false;
		};
	}, [ cache, enabled, selectedId ] );

	const options = useMemo(
		() =>
			Object.values( cache )
				.sort( ( first, second ) =>
					first.name.localeCompare( second.name )
				)
				.map( ( product ) => ( {
					label: product.name,
					value: String( product.id ),
				} ) ),
		[ cache ]
	);

	return {
		error,
		isLoading,
		options,
		product: cache[ selectedId ] || null,
		setSearch,
	};
}

export function formatProductPrice( product ) {
	if ( ! product?.prices ) {
		return '';
	}
	const decimals = Number( product.prices.currency_minor_unit ) || 0;
	const value = Number( product.prices.price ) / 10 ** decimals;
	try {
		return new Intl.NumberFormat( undefined, {
			style: 'currency',
			currency: product.prices.currency_code,
			minimumFractionDigits: decimals,
		} ).format( value );
	} catch {
		return `${ product.prices.currency_prefix || '' }${ value.toFixed(
			decimals
		) }${ product.prices.currency_suffix || '' }`;
	}
}
