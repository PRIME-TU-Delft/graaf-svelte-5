<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { useId } from 'bits-ui';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import { type Infer, type SuperForm } from 'sveltekit-superforms';
	import type { courseSchema } from '$lib/zod/programCourseSchema';

	type Props = {
		form: SuperForm<Infer<typeof courseSchema>>;
		programId: string;
	};

	const { form, programId }: Props = $props();
	const { form: formData, enhance } = form;

	let courseCodes: string[] = [];

	const triggerId = useId();

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	let open = $state(false);
</script>

<Form.Field {form} name="code" class="flex flex-col">
	<Popover.Root bind:open>
		<Form.Control id={triggerId}>
			{#snippet children({ props })}
				<Form.Label>Code</Form.Label>
				<Popover.Trigger
					class={cn(buttonVariants({ variant: 'outline' }), 'justify-between')}
					role="combobox"
					{...props}
				>
					{courseCodes.find((f) => f === $formData.code) ?? 'Select code'}
					<ChevronsUpDown class="opacity-50" />
				</Popover.Trigger>
				<input hidden value={$formData.code} name={props.name} />
			{/snippet}
		</Form.Control>
		<Popover.Content>
			<Command.Root>
				<Command.Input autofocus placeholder="Search code..." class="h-9" />
				<Command.Empty>No code found.</Command.Empty>
				<Command.Group>
					{#each courseCodes as code}
						<Command.Item
							value={code}
							onSelect={() => {
								$formData.code = code;
								closeAndFocusTrigger(triggerId);
							}}
						>
							{code}
							<Check class={cn('ml-auto', code !== $formData.code && 'text-transparent')} />
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
	<Form.Description>Select an existing course code or create a new one.</Form.Description>
	<Form.FieldErrors />
</Form.Field>

<!-- @component
 Form for adding a new course to this program.
 It triggers an action that can be seen in +page.server.ts -->

<form action="?/new-course" method="POST" use:enhance>
	<Form.Field {form} name="programId" hidden>
		<Form.Control>
			{#snippet children({ props })}
				<Input {...props} value={programId} />
			{/snippet}
		</Form.Control>
		<Form.Description />
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="code">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="code">Course code</Form.Label>

				<Input {...props} bind:value={$formData['code']} />
			{/snippet}
		</Form.Control>
		<Form.Description />
		<Form.FieldErrors />
	</Form.Field>

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

	<Form.Button class="float-right mt-4">Submit</Form.Button>
</form>
