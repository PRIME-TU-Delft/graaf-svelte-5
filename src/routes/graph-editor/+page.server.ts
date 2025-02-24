import prisma from '$lib/server/db/prisma.js';
import { emptyPrismaPromise } from '$lib/utils.js';
import type { Course, User } from '@prisma/client';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from '../$types.js';
import { courseSchema, programSchema } from '../../lib/zod/programCourseSchema.js';
import { ProgramActions } from '$lib/server/actions/Programs.js';
import { dev } from '$app/environment';

export const load = (async ({ url, locals }) => {
	try {
		const search = url.searchParams.get('c')?.toLocaleLowerCase();

		const session = await locals.auth();
		const user = session?.user as User | undefined;

		if (!user) throw new Error('No user found');

		const programs = await prisma.program.findMany({
			include: {
				courses: {
					orderBy: {
						updatedAt: 'desc'
					},
					where: search
						? { name: { contains: search, mode: 'insensitive' } }
						: { NOT: { name: '' } },
					include: {
						pinnedBy: {
							select: {
								id: true
							}
						}
					}
				},
				editors: {
					select: {
						id: true
					}
				},
				admins: {
					select: {
						id: true
					}
				}
			},
			orderBy: {
				updatedAt: 'desc'
			}
		});

		const pinnedCourses = await prisma.course.findMany({
			where: {
				pinnedBy: {
					some: {
						id: user.id
					}
				}
			},
			include: {
				pinnedBy: {
					select: {
						id: true
					}
				}
			}
		});

		// Check if we need pagination here
		const courses = prisma.course.findMany({
			orderBy: {
				updatedAt: 'desc'
			}
		});

		return {
			pinnedCourses,
			error: undefined,
			programs,
			courses,
			user,
			programForm: await superValidate(zod(programSchema)),
			courseForm: await superValidate(zod(courseSchema))
		};
	} catch (e: unknown) {
		return {
			pinnedCourses: [],
			error: e instanceof Error ? e.message : `${e}`,
			programs: [],
			user: undefined,
			courses: emptyPrismaPromise([] as Course[]),
			programForm: await superValidate(zod(programSchema)),
			courseForm: await superValidate(zod(courseSchema))
		};
	}
}) satisfies PageServerLoad;

export const actions = {
	'toggle-admin': async ({ request, locals }) => {
		const formData = await request.formData();
		const currentRole = formData.get('currentRole') as string | undefined;

		if (!currentRole) return fail(400, { error: 'missing current role' });

		const session = await locals.auth();
		const user = session?.user as User | undefined;

		if (!user) return fail(500, { error: 'no user found' });
		if (!dev) return fail(500, { error: 'Only allowed in dev mode' });

		await prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				role: currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
			}
		});
	},

	// Creates a new program with the given name
	'new-program': async (event) => {
		const formData = await superValidate(event, zod(programSchema));

		return ProgramActions.newProgram(event, formData);
	},

	// Creates a new course with the given NAME and CODE
	'new-course': async (event) => {
		const formData = await superValidate(event, zod(courseSchema));

		return ProgramActions.newCourse(event, formData);
	},

	'add-course-to-program': async (event) => {
		const formData = await event.request.formData();
		ProgramActions.addCourseToProgram(event, formData);
	},

	'pin-course': async ({ locals, request }) => {
		const data = await request.formData();
		const courseCode = data.get('courseCode') as string | undefined;

		if (!courseCode) return { error: 'missing course code' };

		const session = await locals.auth();
		if (!session) return { error: 'no session found' };

		const user = session.user as User;

		try {
			await prisma.user.update({
				where: {
					id: user.id
				},
				data: {
					my_courses: {
						connect: {
							code: courseCode
						}
					}
				}
			});
		} catch (e) {
			return {
				error: e instanceof Error ? e.message : `${e}`
			};
		}
	},
	'unpin-course': async ({ request, locals }) => {
		const data = await request.formData();
		const courseCode = data.get('courseCode') as string | undefined;

		if (!courseCode) return { error: 'missing course code' };

		const session = await locals.auth();
		if (!session) return { error: 'no session found' };

		const user = session.user as User;

		try {
			await prisma.user.update({
				where: {
					id: user.id
				},
				data: {
					my_courses: {
						disconnect: {
							code: courseCode
						}
					}
				}
			});
		} catch (e) {
			return {
				error: e instanceof Error ? e.message : `${e}`
			};
		}
	}
} satisfies Actions;
