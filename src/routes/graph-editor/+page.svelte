<script lang="ts">
	import { toast } from 'svelte-sonner';
	import SearchCourses from './SearchCourses.svelte';
	import CreateNewProgramButton from './CreateNewProgramButton.svelte';
	import Program from './Program.svelte';
	import type { User } from '@prisma/client';
	import CourseGrid from './CourseGrid.svelte';

	const { data, form } = $props();

	$effect(() => {
		// When add 'course to program' form is submitted with an error
		if (form?.error) toast.error(form.error);
	});
</script>

<main class="my-6 mb-12 space-y-6">
	<section class="prose mx-auto p-4 text-blue-900">
		<h1 class="my-12 text-4xl font-bold text-blue-950 shadow-blue-500/70">Welcome to the graaf</h1>
		<p>
			Here you can find all Programs and associated Courses. Click on any of them to edit or view
			more information. You can also create a sandbox environment to experiment with the Graph
			Editor. Can't find a specific Program or Course? Maybe you don't have access to it. Contact
			one of its Admins to get access.
		</p>
	</section>

	{#if data.pinnedCourses.length > 0}
		<section
			class="top-20 z-10 mx-auto grid max-w-4xl gap-4 rounded-lg bg-blue-100 p-4 shadow-none shadow-blue-200/70 md:sticky md:border-2 md:border-blue-200 md:shadow-lg"
		>
			<h2 class="text-xl font-bold">My pinned courses</h2>

			<CourseGrid courses={data.pinnedCourses} user={data.user} />
		</section>
	{/if}

	<section class="mx-auto grid max-w-4xl gap-4 p-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold">Programs</h2>

			<div class="flex gap-2">
				{#await data.courses then courses}
					<SearchCourses {courses} />
				{/await}

				{#if (data.session?.user as User)?.role === 'ADMIN'}
					<CreateNewProgramButton form={data.programForm} />
				{/if}
			</div>
		</div>

		{#each data.programs as program (program.id)}
			<Program user={data.user} {program} courses={data.courses} courseForm={data.courseForm} />
		{/each}
	</section>
</main>
