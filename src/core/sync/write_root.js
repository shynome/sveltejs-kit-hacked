import { dedent, write_if_changed } from './utils.js';

/**
 * @param {import('types').ManifestData} manifest_data
 * @param {string} output
 */
export function write_root(manifest_data, output) {
	// TODO remove default layout altogether

	const max_depth = Math.max(
		...manifest_data.routes.map((route) =>
			route.page ? route.page.layouts.filter(Boolean).length + 1 : 0
		),
		1
	);

	const levels = [];
	for (let i = 0; i <= max_depth; i += 1) {
		levels.push(i);
	}

	let l = max_depth;

	let pyramid = `<svelte:component this={constructors[${l}]} bind:this={components[${l}]} data={data_${l}} {form} />`;

	while (l--) {
		pyramid = dedent`
			{#if constructors[${l + 1}]}
				<svelte:component this={constructors[${l}]} bind:this={components[${l}]} data={data_${l}}>
					${pyramid}
				</svelte:component>
			{:else}
				<svelte:component this={constructors[${l}]} bind:this={components[${l}]} data={data_${l}} {form} />
			{/if}
		`;
	}

	write_if_changed(
		`${output}/root.svelte`,
		dedent`
			<!-- This file is generated by @sveltejs/kit — do not edit it! -->
			<script>
				import { setContext, afterUpdate, onMount, tick } from 'svelte';
				import { browser } from '$app/environment';

				// stores
				export let stores;
				export let page;

				export let constructors;
				export let components = [];
				export let form;
				${levels.map((l) => `export let data_${l} = null;`).join('\n')}

				if (!browser) {
					setContext('__svelte__', stores);
				}

				$: stores.page.set(page);
				afterUpdate(stores.page.notify);

				let mounted = false;
				let navigated = false;
				let title = null;

				onMount(() => {
					const unsubscribe = stores.page.subscribe(() => {
						if (mounted) {
							navigated = true;
							tick().then(() => {
								title = document.title || 'untitled page';
							});
						}
					});

					mounted = true;
					return unsubscribe;
				});
			</script>

			${pyramid}

			{#if mounted}
				<div id="svelte-announcer" aria-live="assertive" aria-atomic="true" style="position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px">
					{#if navigated}
						{title}
					{/if}
				</div>
			{/if}
		`
	);
}