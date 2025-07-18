<script lang="ts">
	import Autoplay from 'embla-carousel-autoplay';
	import * as Carousel from '$lib/components/ui/carousel';
	import { type CarouselAPI } from '$lib/components/ui/carousel/context.js';

	import Markdown from 'svelte-exmarkdown';
	import { gfmPlugin } from 'svelte-exmarkdown/gfm';
	import README from './README.md?raw';

	let api = $state<CarouselAPI>();
	let current = $state(0);
	const count = $derived(api ? api.scrollSnapList().length : 0);

	$effect(() => {
		if (api) {
			current = api.selectedScrollSnap() + 1;
			api.on('select', () => {
				current = api!.selectedScrollSnap() + 1;
			});
		}
	});

	const demoImageIds = [
		'1-1',
		'1-2',
		'1-3',
		'2-1',
		'2-2',
		'2-3',
		'2-4',
		'2-5',
		'3-1',
		'3-2',
		'3-3',
		'4-1',
		'4-2',
		'4-3'
	];
</script>

<svelte:head>
	<title>LowCMS</title>
	<meta
		name="description"
		content="Instant browser-based CMS layer on top of your local JSON files"
	/>
</svelte:head>
<div id="home-page">
	<div class="mb-4" style="text-align: center;">
		<img
			src="https://github.com/patrick-kw-chiu/lowcms/blob/main/static/logo_2.png?raw=true?raw=true"
			alt="LowCMS"
			style="display: block; margin-left: auto; margin-right: auto; width: 200px;"
		/>
	</div>

	<Markdown
		md={`[LowCMS](https://patrick-kw-chiu.github.io/lowcms/databases) is an instant CMS layer on top of your local JSON files. With built-in support for [JSON Schema](https://json-schema.org/), it lets you manage and edit structured content effortlessly — no need to touch an IDE or text editor!`}
		plugins={[gfmPlugin()]}
	>
		{#snippet a(props)}
			{@const { children, style, class: className, ...rest } = props}
			<a {style} class="{className} heading" {...rest} target="_blank">
				{@render children?.()}
			</a>
		{/snippet}
	</Markdown>

	<Carousel.Root
		bind:api
		plugins={[
			Autoplay({
				delay: 4000
			})
		]}
		class="my-4"
	>
		<Carousel.Content>
			{#each demoImageIds as imageId}
				<Carousel.Item>
					<img
						src={`https://github.com/patrick-kw-chiu/lowcms/blob/main/demo/v0.1.0-launch/edited/${imageId}.png?raw=true`}
						alt="LowCMS demo"
					/>
				</Carousel.Item>
			{/each}
		</Carousel.Content>
		<Carousel.Previous />
		<Carousel.Next />
		<div class="py-2 text-center text-sm text-muted-foreground">
			Slide {current} of {count}
		</div>
	</Carousel.Root>

	<Markdown md={README} plugins={[gfmPlugin()]}>
		{#snippet a(props)}
			{@const { children, style, class: className, ...rest } = props}
			<a {style} class="{className} heading" {...rest} target="_blank">
				{@render children?.()}
			</a>
		{/snippet}
	</Markdown>
</div>

<style>
	#home-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
		max-width: 768px;
		margin: 0 auto;
	}

	:global(#home-page li) {
		list-style-type: disc;
		padding-left: 1rem;
	}

	:global(#home-page a) {
		text-decoration: underline dashed;
	}
</style>
