<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<nav
	class="fixed top-0 z-10 flex w-full items-center justify-between bg-blue-100 px-4 py-2 text-2xl text-blue-900"
>
	<h1 class="flex items-center gap-2 p-2">
		<span class="font-bold">PRIME</span>
		<ChevronRight class="size-4" />
		<span>Graph</span>
	</h1>

	{#if data.session?.user}
		<!-- TODO: make fancy dropdown -->
		<form action="auth/signout" method="POST">
			<Button type="submit">Log-out</Button>
		</form>
	{:else}
		<form action="auth/signin" method="POST">
			<Button type="submit">Sign-in</Button>
		</form>
	{/if}
</nav>

<section class="prose prose-lg mx-auto mt-24">
	<h2>What is the course graph?</h2>
	Welcome to the graph editor, here you can assemble your own course graph! Sign-in to get started. The
	graph is produced by
	<a
		href="https://www.tudelft.nl/ewi/over-de-faculteit/afdelingen/applied-mathematics/studeren/prime"
	>
		PRIME
	</a>
	(PRogramme for Inovation and Math Education) and is a tool for teachers to create and share course
	graphs.

	{#if data?.session?.user}
		<p>Click on the button below to get started!</p>
		<Button href="/graph-editor">Start editing</Button>
	{:else}
		<p>Sign-in to get started!</p>
		<form action="auth/signin" method="POST">
			<Button type="submit">Sign-in</Button>
		</form>
	{/if}
</section>

<section class="prose mx-auto mt-2">
	<h2>Credits</h2>
</section>

<section class="prose mx-auto mt-2">
	<h2>Licence</h2>
</section>
