<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { Course, User } from '@prisma/client';
	import Pin from 'lucide-svelte/icons/pin';
	import Unpin from 'lucide-svelte/icons/pin-off';

	type CourseGridProps = {
		courses: (Course & { pinnedBy: Pick<User, 'id'>[] })[];
		user: User | undefined;
	};

	const { courses, user }: CourseGridProps = $props();
</script>

<div class="grid grid-cols-2 gap-1 p-2 md:grid-cols-2 md:gap-2">
	{#each courses as course}
		<a
			href="graph-editor/courses/{course.code}"
			class="flex w-full items-center justify-between rounded border-2 bg-white/90 p-2 transition-colors hover:border-blue-200 hover:bg-blue-50"
		>
			<div class="flex items-center gap-1">
				{#if course.pinnedBy.some((u) => u.id == user?.id)}
					<form action="?/unpin-course" method="post">
						<input type="text" name="courseCode" value={course.code} hidden />
						<Button
							onclick={(e) => e.stopPropagation()}
							type="submit"
							variant="outline"
							class="h-8 w-8 border-blue-600 bg-blue-200"
						>
							<Unpin class="text-blue-600" />
						</Button>
					</form>
				{:else}
					<form action="?/pin-course" method="post">
						<input type="text" name="courseCode" value={course.code} hidden />
						<Button
							onclick={(e) => e.stopPropagation()}
							type="submit"
							variant="outline"
							class="h-8 w-8"
						>
							<Pin />
						</Button>
					</form>
				{/if}

				<p>{course.name}</p>
			</div>
			<p class="text-xs text-blue-900">{course.code}</p>
		</a>
	{:else}
		<p class="bg-white/80 p-2 col-span-3 text-slate-900/60 rounded">
			This program has no courses yet.
		</p>
	{/each}
</div>
