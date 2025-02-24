<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Button from '$lib/components/ui/button/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { courseSchema } from '$lib/zod/programCourseSchema';
	import type { Course, Program, User } from '@prisma/client';
	import { useId } from 'bits-ui';
	import Settings from 'lucide-svelte/icons/settings';
	import { type Infer, type SuperValidated } from 'sveltekit-superforms';
	import CreateNewCourseButton from './CreateNewCourseButton.svelte';
	import CourseGrid from './CourseGrid.svelte';

	type Props = {
		user?: User;
		program: Program & { courses: (Course & { pinnedBy: Pick<User, 'id'>[] })[] } & {
			editors: Pick<User, 'id'>[];
			admins: Pick<User, 'id'>[];
		};
		courses: Promise<Course[]>;
		courseForm: SuperValidated<Infer<typeof courseSchema>>;
	};

	let { user, program, courses, courseForm }: Props = $props();

	const triggerId = useId();

	let openNewCourse = $state(false); // Popover state
	let courseValue = $state(''); // Input value

	// Select out the courses that are not in the program yet
	const programCourseSet = $derived(new Set(program.courses.map((c) => c.code)));
</script>

<div
	class="overflow-hidden rounded-lg border-2 border-blue-200 bg-blue-100 shadow-md shadow-blue-200/70"
>
	<div class="flex items-center justify-between gap-4 p-2">
		<h3 class="text-lg font-semibold text-blue-950">{program.name}</h3>

		<div class="flex gap-2">
			{#if user?.role === 'ADMIN' || program.editors.find((u) => u.id == user?.id) || program.admins?.find((u) => u.id == user?.id)}
				{@render newCourseButton()}
			{/if}

			<Button.Root href="graph-editor/programs/{program.id}/settings"
				><Settings /> Settings</Button.Root
			>
		</div>
	</div>

	<CourseGrid courses={program.courses} {user} />
</div>

{#snippet newCourseButton()}
	<Popover.Root bind:open={openNewCourse}>
		<Popover.Trigger
			id={triggerId}
			class={buttonVariants({
				variant: 'default'
			})}
		>
			+ Add course
		</Popover.Trigger>
		<Popover.Content class="p-2" side="right" align="start">
			<Command.Root>
				{#await courses}
					<CreateNewCourseButton {courseForm} {courseValue} {program} />
					<p>
						Loading courses (I have added an artifical wait of 5s to test what would happen if this
						loads slow)...
					</p>
				{:then courses}
					{@const selectableCourses = courses.filter((c) => !programCourseSet.has(c.code))}
					{#if selectableCourses.length == 0}
						<CreateNewCourseButton {courseForm} {courseValue} {program} />
					{:else}
						<Command.Input placeholder="Search courses..." bind:value={courseValue} />
						<Command.List>
							<Command.Empty class="p-2">
								<CreateNewCourseButton {courseForm} {courseValue} {program} />
							</Command.Empty>

							<Command.Group>
								{#each selectableCourses as course}
									<form action="?/add-course-to-program" method="POST" use:enhance>
										<input type="hidden" name="program-id" value={program.id} />
										<input type="hidden" name="code" value={course.code} />
										<input type="hidden" name="name" value={course.name} />

										<Command.Item class="h-full w-full p-0" value={course.code + ' ' + course.name}>
											<Form.Button variant="ghost" class="w-full justify-between px-2 py-0">
												<span class="max-w-[70%] truncate">
													{course.name}
												</span>

												<span class="max-w-[30%] truncate text-xs text-slate-800">
													{course.code}
												</span>
											</Form.Button>
										</Command.Item>
									</form>
								{/each}
							</Command.Group>
						</Command.List>
					{/if}
				{:catch error}
					<CreateNewCourseButton {courseForm} {courseValue} {program} />
				{/await}
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
{/snippet}
