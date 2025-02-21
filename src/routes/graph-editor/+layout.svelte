<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { toast } from 'svelte-sonner';

	let { data, children } = $props();

	$effect(() => {
		toast.promise(data.testConnection, {
			loading: 'Loading...',
			duration: Number.POSITIVE_INFINITY,
			error: 'Error, could not connect to the database',
			action: {
				label: 'Retry connection',
				onClick: () => {
					location.reload();
				}
			}
		});
	});
</script>

<Toaster closeButton />

<nav
	class="fixed top-0 z-10 flex w-full items-center justify-between bg-blue-100/80 px-4 py-2 text-2xl text-blue-900 backdrop-blur-sm backdrop-saturate-200"
>
	<h1 class="flex items-center gap-2 p-2">
		<span class="font-bold">PRIME</span>
		<ChevronRight class="size-4" />
		<span>Graph</span>
	</h1>

	{#if data.session?.user}
		<!-- TODO: make fancy dropdown -->
		<form action="/auth/signout" method="POST">
			<Button type="submit">Log-out</Button>
		</form>
	{/if}
</nav>

<main class="pt-12">
	{@render children()}
</main>
