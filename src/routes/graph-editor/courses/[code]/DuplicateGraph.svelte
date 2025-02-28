<script lang="ts">
	import { page } from '$app/state';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { duplicateGraphSchema } from '$lib/zod/graphSchema';
	import type { Course, Graph } from '@prisma/client';
	import { useId } from 'bits-ui';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import Undo2 from 'lucide-svelte/icons/undo-2';
	import { toast } from 'svelte-sonner';
	import { fromStore } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type CourseType = Course & {
		graphs: {
			name: string;
		}[];
	};

	let {
		graph,
		course,
		isDuplicateOpen = $bindable(),
		coursesAccessible
	}: {
		graph: Graph;
		course: CourseType;
		isDuplicateOpen: boolean;
		coursesAccessible: Promise<CourseType[]>;
	} = $props();

	let isDestinationCourseOpen = $state(false);
	let selectableCourses = $state<CourseType[]>([]);
	const triggerId = useId();

	const form = superForm((page.data as PageData).duplicateGraphForm, {
		id: 'duplicate-graph-' + graph.id,
		validators: zodClient(duplicateGraphSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Graph successfully copied!');
				isDuplicateOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	let graphHasSameNameAsOriginal = $derived.by(() => {
		const { destinationCourseCode, newName } = fromStore(formData).current;

		const graphsInSelectedCourse = selectableCourses.find(
			(f) => f.code === destinationCourseCode
		)?.graphs;

		if (!graphsInSelectedCourse) return false;

		return graphsInSelectedCourse.some((g) => g.name === newName);
	});

	$effect(() => {
		if (graph.id) {
			$formData.newName = graph.name + ' copy';
			$formData.graphId = graph.id;
			$formData.destinationCourseCode = course.code;
		}
	});

	$effect(() => {
		selectableCourses = [course];

		coursesAccessible.then((courses) => {
			selectableCourses = [...selectableCourses, ...courses];
		});
	});
</script>

<form action="?/duplicate-graph" method="POST" use:enhance>
	<input type="text" name="graphId" value={graph.id} hidden />

	<Form.Field {form} name="newName">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="newName">Course name</Form.Label>
				<Input {...props} bind:value={$formData['newName']} />
			{/snippet}
		</Form.Control>
		<Form.Description />
		<Form.FieldErrors />
	</Form.Field>

	{@render selectCourse()}

	{#if graphHasSameNameAsOriginal}
		<p
			in:fly={{ y: -10, duration: 200, delay: 200 }}
			class="mt-2 rounded border-2 border-amber-900 bg-amber-50 p-2 text-sm text-amber-700"
		>
			Warning: The destination course already has a graph with the same name. This may cause
			confusion.
		</p>
	{/if}

	<div class="mt-2 flex items-center justify-between gap-1">
		<Form.FormError class="w-full text-right" {form} />

		<Button
			variant="outline"
			disabled={$formData.newName == graph.name && $formData.destinationCourseCode == course.code}
			onclick={() =>
				form.reset({
					newState: {
						graphId: graph.id,
						newName: graph.name,
						destinationCourseCode: course.code
					}
				})}
		>
			<Undo2 /> Reset
		</Button>
		<Form.FormButton disabled={$submitting} loading={$delayed}>
			Duplicate
			{#snippet loadingMessage()}
				<span>Copying graph elements...</span>
			{/snippet}
		</Form.FormButton>
	</div>
</form>

{#snippet selectCourse()}
	<Form.Field {form} name="destinationCourseCode">
		<Popover.Root bind:open={isDestinationCourseOpen}>
			<Form.Control id={triggerId}>
				{#snippet children({ props })}
					<div class="mt-2 flex w-full items-center justify-between">
						<Form.Label>Move to course</Form.Label>
						<Popover.Trigger
							class={cn(buttonVariants({ variant: 'outline' }), 'min-w-[50%] justify-between')}
							role="combobox"
							{...props}
						>
							{selectableCourses.find((f) => f.code === $formData.destinationCourseCode)?.name}
							<ChevronsUpDown class="opacity-50" />
						</Popover.Trigger>
						<input
							hidden
							value={$formData.destinationCourseCode}
							defaultValue={course.code}
							name={props.name}
						/>
					</div>
				{/snippet}
			</Form.Control>
			<Popover.Content>
				<Command.Root loop>
					<Command.Input autofocus placeholder="Search course..." class="h-9" />
					<Command.Empty>No course found.</Command.Empty>
					<Command.Group>
						{#each selectableCourses as course}
							<Command.Item
								value={course.code + ' ' + course.name}
								onSelect={() => {
									$formData.destinationCourseCode = course.code;
									closeAndFocusTrigger(triggerId, () => (isDestinationCourseOpen = false));
								}}
							>
								{course.name}
								<Check
									class={cn(
										'ml-auto',
										course.code !== $formData.destinationCourseCode && 'text-transparent'
									)}
								/>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}
