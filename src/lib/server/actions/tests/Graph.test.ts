import prisma from '$lib/server/db/prisma';
import { graphSchema } from '$lib/zod/graphSchema';
import { describe, expect, test } from 'vitest';
import { GraphActions } from '../Graphs';
import mockForm from './helpers/mockForm';
import { courseAdminUser, courseEditorUser, superAdminUser } from './helpers/test-users';

describe('CreateGraph', () => {
	test.for([superAdminUser, courseAdminUser])(
		'should be able to create a graph as course admin',
		async (user) => {
			const courseAdminCourse = await prisma.course.findFirst({
				where: {
					admins: { some: { id: courseAdminUser.id } }
				}
			});

			expect(courseAdminCourse).not.toBe(null);

			const form = await mockForm(
				{ courseCode: courseAdminCourse!.code, name: 'new-graph' },
				graphSchema
			);
			expect(form.valid).toBe(true);

			const response = await GraphActions.addGraphToCourse(user, form);

			const newCourse = await prisma.course.findFirst({
				where: { code: courseAdminCourse!.code },
				include: { graphs: true }
			});

			expect(newCourse?.graphs.map((g) => g.name)).toContain(form.data.name);
		}
	);

	test('should be able to create a graph as course editor', async () => {
		const courseEditorCourse = await prisma.course.findFirst({
			where: {
				editors: { some: { id: courseEditorUser.id } }
			}
		});

		expect(courseEditorCourse).not.toBe(null);

		const form = await mockForm(
			{ courseCode: courseEditorCourse!.code, name: 'new-graph' },
			graphSchema
		);
		expect(form.valid).toBe(true);

		const response = await GraphActions.addGraphToCourse(courseEditorUser, form);

		const newCourse = await prisma.course.findFirst({
			where: { code: courseEditorCourse!.code },
			include: { graphs: true }
		});

		expect(newCourse?.graphs.map((g) => g.name)).toContain(form.data.name);
	});
});
