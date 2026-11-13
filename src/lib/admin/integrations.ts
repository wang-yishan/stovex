/* Bag Store Admin — integrations catalog (placeholder module).

   The Integrations module is a placeholder for now: it lists the providers we
   plan to connect (dropshipping, print-on-demand, shipping) together with the
   capabilities each connection is meant to unlock. Nothing here talks to a
   provider API yet — the connect flow, credential storage and webhook
   plumbing land in a later pass.

   Keeping the catalog in one file means the UI, the future `/api/integrations`
   endpoints and the connect modal all read from the same source. */

export type IntegrationCategory =
	'dropshipping' | 'print-on-demand' | 'shipping' | 'ads' | 'social';

export type IntegrationStatus = 'planned' | 'in-progress' | 'available' | 'connected';

export interface IntegrationProvider {
	id: string;
	name: string;
	category: IntegrationCategory;
	status: IntegrationStatus;
	/** One line describing what the provider does. */
	description: string;
	/** What connecting it will unlock inside the dashboard. */
	capabilities: string[];
	/** Public docs entry point — opened from the provider card. */
	docsUrl: string;
	/** Marks the providers we are building first. */
	priority?: boolean;
	/** Connection rollout steps — rendered by the plan modal ("how to connect"). */
	plan?: string[];
}

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
	dropshipping: 'Dropshipping',
	'print-on-demand': 'Print on demand',
	shipping: 'Shipping',
	ads: 'Ads',
	social: 'Social'
};

export const STATUS_LABELS: Record<IntegrationStatus, string> = {
	planned: 'Planned',
	'in-progress': 'In progress',
	available: 'Available',
	connected: 'Connected'
};

export const INTEGRATION_CATALOG: IntegrationProvider[] = [
	{
		id: 'cjdropship',
		name: 'CJdropshipping',
		category: 'dropshipping',
		status: 'planned',
		description: 'Global dropshipping and product-sourcing marketplace.',
		capabilities: [
			'Import supplier products into the catalog',
			'Push orders and push back tracking numbers',
			'Sync shipping cost and delivery estimates'
		],
		docsUrl: 'https://cjdropshipping.com',
		priority: true,
		plan: [
			'Create the CJdropshipping account and generate an API key in the CJ dashboard.',
			'Add the API key to the Bag Store backend — provider credentials stay server-side only.',
			'Exchange the credentials for a CJdropshipping access token (auth2.0) and store the token pair.',
			'Register the webhook callback URL used for product, order and logistics events.',
			'Run a sandbox product and order sync before enabling live fulfilment.'
		]
	},
	{
		id: 'autods',
		name: 'AutoDS',
		category: 'print-on-demand',
		status: 'planned',
		description: 'Print-on-demand catalog, production and fulfilment partner.',
		capabilities: [
			'Push print-on-demand products with artwork',
			'Route eligible orders for production',
			'Pull production and shipping status back'
		],
		docsUrl: 'https://autods.com',
		priority: true,
		plan: [
			'Create the AutoDS account and request API access (activation fee applies).',
			'Generate the API credentials used by the AutoDS gateway.',
			'Configure the provider credentials in the backend and allowlist the callback URL.',
			'Map the AutoDS product catalogue to Bag Store variants.',
			'Run a sandbox production-order test before routing live orders.'
		]
	},
	{
		id: 'printful',
		name: 'Printful',
		category: 'print-on-demand',
		status: 'planned',
		description: 'Print-on-demand catalogue with automatic order routing.',
		capabilities: ['Map catalogue SKUs to Printful variants', 'Push fulfilment orders'],
		plan: [
			'Create the Printful account and copy the API token.',
			'Store the token in the backend and select the target store.',
			'Map the Printful catalogue SKUs to Bag Store products.',
			'Push the first fulfilment order.'
		]
	},
	{
		id: 'shipstation',
		name: 'ShipStation',
		category: 'shipping',
		status: 'planned',
		description: 'Shipping label and multi-carrier order dispatch.',
		capabilities: ['Buy labels from the order screen', 'Push fulfilment status'],
		plan: [
			'Create the ShipStation account and generate an API key.',
			'Store the API key in the backend.',
			'Wire the fulfilment status webhook from the order screen.',
			'Buy the first live label.'
		]
	},
	{
		id: 'meta-ads',
		name: 'Meta Ads',
		category: 'ads',
		status: 'planned',
		description: 'Campaign performance for products promoted on social.',
		capabilities: ['Track spend and ROAS per product'],
		plan: [
			'Create the Meta developer app and connect the ad account.',
			'Grant the required permissions to the integration.',
			'Store the long-lived access token in the backend.',
			'Define spend and ROAS tracking per product.'
		]
	},
	{
		id: 'shopee',
		name: 'Shopee',
		category: 'dropshipping',
		status: 'planned',
		description: 'Marketplace channel for the Indonesian storefront.',
		capabilities: ['Publish products to the marketplace', 'Import marketplace orders'],
		plan: [
			'Create the Shopee Open Platform developer account and finish onboarding.',
			'Store the partner credentials in the backend.',
			'Map the shop channel to the storefront catalog.',
			'Publish products and import marketplace orders.'
		]
	}
];
