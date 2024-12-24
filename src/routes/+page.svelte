<script lang="ts">
	import Markdown from 'svelte-exmarkdown';
	import { gfmPlugin } from 'svelte-exmarkdown/gfm';
	import README from './README.md?raw';
</script>

<div id="home-page">
	<div style="text-align: center;">
		<img
			src="https://github.com/patrick-kw-chiu/lowcms/blob/static/logo.png?raw=true?raw=true"
			alt="LowCMS"
			style="display: block; margin-left: auto; margin-right: auto; width: 200px;"
		/>
	</div>
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
