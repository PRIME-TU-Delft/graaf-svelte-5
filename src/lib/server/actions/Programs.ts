import { setError } from '$lib/utils/setError';
import { courseSchema, programSchema } from '$lib/zod/programCourseSchema';
import type { User } from '@prisma/client';
import { fail, type RequestEvent } from '@sveltejs/kit';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import prisma from '../db/prisma';

export function hasProgramPermissions(user: User, editor = true, admin = true, superAdmin = true) {
	const hasEditorPermission = {
		editors: {
			some: {
				id: user.id
			}
		}
	};

	const hasAdminPermission = {
		admins: {
			some: {
				id: user.id
			}
		}
	};

	if (user.role == 'ADMIN') {
		return {};
	}

	const hasPermission: (typeof hasEditorPermission | typeof hasAdminPermission)[] = [];
	if (editor) hasPermission.push(hasEditorPermission);
	if (admin) hasPermission.push(hasAdminPermission);

	return { OR: hasPermission };
}

export class ProgramActions {
	/**
	 * PERMISSIONS:
	 * - https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#p2
	 * - Only super admins can add new programs
	 */
	static async newProgram(event: RequestEvent, form: SuperValidated<Infer<typeof programSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		// Check if user is a super admin, otherwise return an error
		const session = await event.locals.auth();
		if ((session?.user as User)?.role !== 'ADMIN') {
			return setError(form, '', 'You do not have permission to perform this action');
		}

		try {
			await prisma.program.create({
				data: {
					name: form.data.name
				}
			});
		} catch (e) {
			if (!(e instanceof Object) || !('message' in e)) {
				return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
			}
			return setError(form, 'name', `${e.message}`);
		}

		return { form };
	}

	/**
	 * PERMISSIONS:
	 * - https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#c1
	 * - Either PROGRAM_ADMINS, PROGRAM_EDITOR and SUPER_ADMIN can add new courses
	 */
	static async newCourse(event: RequestEvent, form: SuperValidated<Infer<typeof courseSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		// Check permissions
		const session = await event.locals.auth();
		const user = session?.user as User | undefined;
		if (!user) return setError(form, '', 'Unauthorized');

		try {
			await prisma.program.update({
				where: {
					id: form.data.programId,
					...hasProgramPermissions(user) // User is either an admin or editor or SUPER_ADMIN
				},
				data: {
					updatedAt: new Date(),
					courses: {
						create: {
							name: form.data.name,
							code: form.data.code,
							pinnedBy: {
								connect: {
									id: user.id
								}
							}
						}
					}
				}
			});
		} catch (e) {
			return setError(form, 'name', 'Unauthorized');
		}

		return {
			form
		};
	}

	/**
	 * TODO: needs testing
	 * PERMISSIONS:
	 * - https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#p5
	 * - Either PROGRAM_ADMINS, PROGRAM_EDITOR and SUPER_ADMIN can add new courses
	 */
	static async addCourseToProgram(event: RequestEvent, form: FormData) {
		const programId = form.get('program-id') as string | null;
		const courseCode = form.get('code') as string | null;
		const courseName = form.get('name') as string | null;

		if (!programId || !courseCode || !courseName)
			return fail(400, { error: 'Missing required fields' });

		// Check permissions
		const session = await event.locals.auth();
		const user = session?.user as User | undefined;
		if (!user) return fail(401, { error: 'Unauthorized' });

		try {
			await prisma.program.update({
				where: {
					id: programId,
					...hasProgramPermissions(user) // User is either an admin or editor or SUPER_ADMIN
				},
				data: {
					updatedAt: new Date(),
					courses: {
						connect: {
							code: courseCode
						}
					}
				}
			});
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : `${e}` });
		}
	}
}
