import { env } from '$env/dynamic/private';
import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import type { duplicateGraphSchema, graphSchema, graphSchemaWithId } from '$lib/zod/graphSchema';
import type { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { redirect } from '@sveltejs/kit';
import type { FormPathLeavesWithErrors, Infer, SuperValidated } from 'sveltekit-superforms';

type PermissionsOptions = {
	admin: boolean;
	courseEditor: boolean;
	courseAdmin: boolean;
	superAdmin: boolean;
};

/**
 * Check if the user has permissions to edit a COURSE->graph
 * @param user - User
 * @param options - PermissionsOptions
 * @returns A json object that can be used in a Prisma where query
 * @example
 * const user = { id: 1, role: 'ADMIN' };
 * const permissions = hasProgramPermissions(user, { admin: true, editor: true, superAdmin: true });
 * const program = await prisma.program.findFirst({ where: { id: 1, ...permissions } });
 */
export function hasCourseGraphPermissions(
	user: User,
	options: PermissionsOptions = {
		admin: true,
		courseEditor: true,
		courseAdmin: true,
		superAdmin: true
	}
) {
	// If the user is a super-admin, they can edit any program. Thus no special where permission is required
	if (options.superAdmin && user.role == 'ADMIN') return {};

	// If no permissions are set, return empty permissions
	if (!options.courseAdmin && !options.courseEditor) return {};

	const isEditor = { editors: { some: { id: user.id } } };
	const isAdmin = { admins: { some: { id: user.id } } };

	type Permissions = typeof isEditor | typeof isAdmin;
	const hasCoursePermission: (Permissions | { programs: { some: { OR: Permissions[] } } })[] = [];
	if (options.courseEditor) hasCoursePermission.push(isEditor);
	if (options.courseAdmin) hasCoursePermission.push(isAdmin);

	// Program editor/admin can always also edit the course
	const hasProgramPermissions: (typeof isEditor | typeof isAdmin)[] = [];
	hasProgramPermissions.push(isEditor);
	hasProgramPermissions.push(isAdmin);

	hasCoursePermission.push({
		programs: { some: { OR: hasProgramPermissions } }
	});

	return { OR: hasCoursePermission };
}

export class GraphActions {
	/**
	 * Wrapper for updating a course -> graph
	 * @returns form with error or form
	 */
	private static async updateCourse<T, S extends Record<string, unknown>>(
		query: T,
		form: SuperValidated<S>,
		path: FormPathLeavesWithErrors<S>
	) {
		try {
			await query;
		} catch (e: unknown) {
			if (env.DEBUG) console.error(e);

			if (
				e instanceof PrismaClientKnownRequestError &&
				e.meta &&
				'cause' in e.meta &&
				e.meta.cause instanceof String &&
				(e.meta.cause as string).includes("No 'Course' record")
			) {
				return setError(
					form,
					path,
					'You are not allowed to edit this course. You are not an program admin/editor or course admin/editor'
				);
			}

			return setError(form, path, e instanceof Error ? e.message : `${e}`);
		}

		return { form };
	}

	static async addGraphToCourse(user: User, form: SuperValidated<Infer<typeof graphSchema>>) {
		if (!form.valid) return setError(form, 'name', 'Invalid graph name');

		const query = prisma.course.update({
			where: {
				code: form.data.courseCode,
				...hasCourseGraphPermissions(user)
			},
			data: {
				graphs: {
					create: { name: form.data.name }
				}
			}
		});

		return await this.updateCourse(query, form, 'name');
	}

	/**
	 * Permissions:
	 * - Either COURSE_ADMINS, COURSE_EDITOR, PROGRAM_EDITOR, PROGRAM_ADMIN, SUPER_ADMIN can delete graphs
	 */
	static async editGraph(user: User, form: SuperValidated<Infer<typeof graphSchemaWithId>>) {
		const query = prisma.course.update({
			where: { code: form.data.courseCode, ...hasCourseGraphPermissions(user) },
			data: {
				graphs: {
					update: {
						where: { id: form.data.graphId },
						data: { name: form.data.name }
					}
				}
			}
		});

		return await this.updateCourse(query, form, 'name');
	}

	/**
	 * Permissions:
	 * https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#C6
	 * - Either COURSE_ADMINS, COURSE_EDITOR, PROGRAM_EDITOR, PROGRAM_ADMIN, SUPER_ADMIN can delete graphs
	 * @returns
	 */
	static async deleteGraphFromCourse(
		user: User,
		form: SuperValidated<Infer<typeof graphSchemaWithId>>
	) {
		const query = prisma.course.update({
			where: {
				code: form.data.courseCode,
				...hasCourseGraphPermissions(user)
			},
			data: {
				graphs: {
					delete: { id: form.data.graphId }
				}
			}
		});

		// This also deletes the graph's domains, subjects, and relations

		return await this.updateCourse(query, form, 'name');
	}

	/**
	 * Permissions:
	 * https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#C6
	 * - Either COURSE_ADMINS, COURSE_EDITOR, PROGRAM_EDITOR, PROGRAM_ADMIN, SUPER_ADMIN can delete graphs
	 * @returns
	 */
	static async duplicateGraph(
		user: User,
		form: SuperValidated<Infer<typeof duplicateGraphSchema>>,
		sourseCourseCode: string
	) {
		const destinationCourse = await prisma.course.findFirst({
			where: { code: form.data.destinationCourseCode, ...hasCourseGraphPermissions(user) }
		});

		if (!destinationCourse)
			return setError(form, 'destinationCourseCode', 'You do not have access to this course.');

		const sourcegraph = await prisma.graph.findFirst({
			where: { id: form.data.graphId },
			include: {
				domains: {
					include: {
						incommingDomains: { select: { id: true } },
						outgoingDomains: { select: { id: true } }
					}
				},
				subjects: {
					include: {
						incommingSubjects: { select: { id: true } },
						outgoingSubjects: { select: { id: true } },
						domain: { select: { id: true } }
					}
				},
				lectures: {
					include: {
						subjects: { select: { id: true } }
					}
				}
			}
		});

		if (!sourcegraph) return setError(form, '', 'source graph not found');

		// Create entities in the destination course
		const newGraph = await prisma.graph.create({
			data: {
				name: form.data.newName,
				course: { connect: { code: destinationCourse.code } },
				domains: {
					createMany: {
						data: sourcegraph.domains.map((domain) => ({
							name: domain.name,
							order: domain.order,
							style: domain.style
						}))
					}
				},
				subjects: {
					createMany: {
						data: sourcegraph.subjects.map((subject) => ({
							name: subject.name,
							order: subject.order
						}))
					}
				},
				lectures: {
					createMany: {
						data: sourcegraph.lectures.map((lecture) => ({
							name: lecture.name,
							order: lecture.order
						}))
					}
				}
			},
			include: {
				domains: true,
				subjects: true,
				lectures: true
			}
		});

		// Create mapping from old to new domain
		const domainMapping = new Map<number, number>();
		for (let i = 0; i < sourcegraph.domains.length; i++) {
			domainMapping.set(sourcegraph.domains[i].id, newGraph.domains[i].id);
		}

		// Create mapping from old to new subject
		const subjectMapping = new Map<number, number>();
		for (let i = 0; i < sourcegraph.subjects.length; i++) {
			subjectMapping.set(sourcegraph.subjects[i].id, newGraph.subjects[i].id);
		}

		// Create mapping from old to new lecture
		const lectureMapping = new Map<number, number>();
		for (let i = 0; i < sourcegraph.lectures.length; i++) {
			lectureMapping.set(sourcegraph.lectures[i].id, newGraph.lectures[i].id);
		}

		// Create new relations
		const domainRelations = sourcegraph.domains.flatMap((domain) => {
			const newDomainId = domainMapping.get(domain.id);
			if (!newDomainId) return [];

			return prisma.domain.update({
				where: { id: newDomainId },
				data: {
					incommingDomains: {
						connect: domain.incommingDomains.map((incommingDomain) => ({
							id: domainMapping.get(incommingDomain.id)
						}))
					},
					outgoingDomains: {
						connect: domain.outgoingDomains.map((outgoingDomain) => ({
							id: domainMapping.get(outgoingDomain.id)
						}))
					}
				}
			});
		});

		const subjectRelations = sourcegraph.subjects.flatMap((subject) => {
			const newSubjectId = subjectMapping.get(subject.id);
			if (!newSubjectId) return [];

			return prisma.subject.update({
				where: { id: newSubjectId },
				data: {
					incommingSubjects: {
						connect: subject.incommingSubjects.map((incommingSubject) => ({
							id: subjectMapping.get(incommingSubject.id)
						}))
					},
					outgoingSubjects: {
						connect: subject.outgoingSubjects.map((outgoingSubject) => ({
							id: subjectMapping.get(outgoingSubject.id)
						}))
					},
					domain: subject.domain
						? {
								connect: { id: domainMapping.get(subject.domain.id) }
							}
						: undefined
				}
			});
		});

		const lectureRelations = sourcegraph.lectures.flatMap((lecture) => {
			const newLectureId = lectureMapping.get(lecture.id);
			if (!newLectureId) return [];

			return prisma.lecture.update({
				where: { id: newLectureId },
				data: {
					subjects: {
						connect: lecture.subjects.map((subject) => ({
							id: subjectMapping.get(subject.id)
						}))
					}
				}
			});
		});

		await prisma.$transaction([...domainRelations, ...subjectRelations, ...lectureRelations]);

		if (destinationCourse.code !== sourseCourseCode) {
			// Redirect to the destination course
			redirect(303, `/graph-editor/courses/${form.data.destinationCourseCode}`);
		}

		return { form };
	}
}
