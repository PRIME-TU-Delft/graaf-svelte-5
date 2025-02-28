<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import type { Course, Graph } from '@prisma/client';
	import DuplicateGraph from './DuplicateGraph.svelte';
	import GraphSettings from './GraphSettings.svelte';

	type EditGraphProps = {
		graph: Graph;
		course: Course;
		coursesAccessible: Promise<Course[]>;
	};

	let { graph, course, coursesAccessible }: EditGraphProps = $props();

	let isGraphSettingsOpen = $state(false);
	let isDuplicateOpen = $state(false);

	function handleOpenGraphSettings(e: MouseEvent) {
		e.preventDefault();
		isGraphSettingsOpen = true;
	}

	function handleOpenDuplicate(e: MouseEvent) {
		e.preventDefault();
		isDuplicateOpen = true;
	}
</script>

<div class="flex flex-col gap-1 lg:flex-row">
	<DialogButton
		onclick={(e) => handleOpenDuplicate(e)}
		button="Duplicate"
		title="Duplicate/Move Graph"
		description="Copy this graph within this or another course. This will create a new graph with the same content in the selected course."
		bind:open={isDuplicateOpen}
		class="grow"
	>
		<DuplicateGraph {graph} {course} {coursesAccessible} bind:isDuplicateOpen />
	</DialogButton>

	<DialogButton
		onclick={(e) => handleOpenGraphSettings(e)}
		button="Settings"
		title="Edit Graph"
		description="TODO"
		bind:open={isGraphSettingsOpen}
	>
		<GraphSettings {graph} bind:isGraphSettingsOpen />
	</DialogButton>
</div>
