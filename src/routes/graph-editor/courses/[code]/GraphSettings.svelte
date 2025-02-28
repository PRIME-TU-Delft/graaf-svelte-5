<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import { graphSchemaWithId } from '$lib/zod/graphSchema';
	import type { Graph } from '@prisma/client';
	import Undo2 from 'lucide-svelte/icons/undo-2';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	let { graph, isGraphSettingsOpen = $bindable() }: { graph: Graph; isGraphSettingsOpen: boolean } =
		$props();

	const form = superForm((page.data as PageData).editGraphForm, {
		id: 'edit-graph-' + graph.id,
		validators: zodClient(graphSchemaWithId),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Graph successfully changed!');
				isGraphSettingsOpen = false;
			}
		}
	});

	const { form: formData } = form;

	$effect(() => {
		if (graph.id) {
			$formData.name = graph.name;
		}
	});
</script>

<form
	action="?/edit-graph"
	method="POST"
	use:enhance={() => {
		toast.success('Graph successfully changed!');
		isGraphSettingsOpen = false;
	}}
>
	<input type="hidden" name="graphId" value={graph.id} />
	<input type="hidden" name="courseCode" value={graph.courseId} />

	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="name">Course name</Form.Label>
				<Input {...props} bind:value={$formData['name']} />
			{/snippet}
		</Form.Control>
		<Form.Description />
		<Form.FieldErrors />
	</Form.Field>

	<div class="flex items-center justify-between gap-1">
		<Form.FormError class="w-full text-right" {form} />

		{@render deleteGraph()}

		<Button
			variant="outline"
			disabled={$formData.name == graph.name}
			onclick={() => ($formData.name = graph.name)}
		>
			<Undo2 /> Reset
		</Button>
		<Form.FormButton disabled={$formData.name == graph.name}>Change</Form.FormButton>
	</div>
</form>

{#snippet deleteGraph()}
	<Popover.Root>
		<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
			Delete domain
		</Popover.Trigger>
		<Popover.Content>
			<form
				class="text-sm"
				action="?/delete-graph"
				method="POST"
				use:enhance={() => {
					toast.success('Graph successfully deleted!');
					isGraphSettingsOpen = false;
				}}
			>
				<input type="hidden" name="graphId" value={graph.id} />
				<input type="hidden" name="name" value={graph.name} />
				<input type="hidden" name="courseCode" value={graph.courseId} />

				<p class="pl-1 pt-1 font-bold">Are you sure?</p>

				<Form.Button variant="destructive" class="mt-1 w-full">Yes, delete graph</Form.Button>
			</form>
		</Popover.Content>
	</Popover.Root>
{/snippet}
