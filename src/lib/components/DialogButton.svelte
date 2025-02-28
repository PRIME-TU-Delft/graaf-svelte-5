<script lang="ts" generics="T extends Schema">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { cn } from '$lib/utils';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Plus from 'lucide-svelte/icons/plus';
	import type { Snippet } from 'svelte';
	import { type Schema } from 'sveltekit-superforms';
	import { Ellipsis } from './ui/breadcrumb';
	import { buttonVariants, type ButtonVariant } from './ui/button';

	type Props = {
		icon?: 'plus' | 'ellipsis' | 'edit';
		open: boolean;
		button?: string;
		title: string;
		description: string;
		disabled?: boolean;
		onclick?: (
			e: MouseEvent & {
				currentTarget: EventTarget & HTMLButtonElement;
			}
		) => void;
		children: Snippet;
		variant?: ButtonVariant;
		class?: string;
	};

	let {
		open = $bindable(),
		icon,
		button,
		title,
		description,
		disabled,
		onclick = () => {},
		children,
		variant = 'default',
		class: classes
	}: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class={cn(
			'flex items-center gap-2 text-nowrap rounded bg-primary p-2 text-sm  shadow-none transition-all hover:bg-primary/80 hover:shadow-lg',
			{ 'opacity-50': disabled },
			buttonVariants({ variant }),
			classes
		)}
		{disabled}
		onclick={(e) => {
			e.stopPropagation();
			console.log('clicked');
			onclick(e);
		}}
	>
		{#if icon == 'plus'}
			<Plus class="size-5" />
		{:else if icon == 'ellipsis'}
			<Ellipsis class="size-5" />
		{:else if icon == 'edit'}
			<Pencil class="size-5" />
		{/if}

		{#if button}
			<span>{button}</span>
		{/if}
	</Dialog.Trigger>

	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="text-lg">{title}</Dialog.Title>
			<Dialog.Description class="text-md">
				{description}
			</Dialog.Description>
		</Dialog.Header>

		{@render children()}
	</Dialog.Content>
</Dialog.Root>
