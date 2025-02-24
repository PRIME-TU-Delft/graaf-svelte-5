import prisma from '$lib/server/db/prisma';
import { courseSchema, programSchema } from '$lib/zod/programCourseSchema';
import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, test } from 'vitest';
import { ProgramActions } from '../Programs';
import mockForm from './helpers/mockForm';
import { mockLocals, type UserType } from './helpers/test-users';
import { PROGRAM_IDS } from './helpers/setup';

describe('New Program', () => {
	test('admin user is allowed to add new program', async () => {
		const event = { locals: mockLocals('superAdmin') } as RequestEvent;
		const form = await mockForm({ name: 'new-program' }, programSchema);
		expect(form.valid).toBe(true);

		const response = await ProgramActions.newProgram(event, form);

		// Retreive the program from the database
		const program = await prisma.program.findFirst({
			where: { name: form.data.name }
		});

		expect(program).not.toBe(null);
		expect(program?.name).toBe(form.data.name);
	});

	test.for(['programAdmin', 'programEditor', 'courseAdmin', 'courseEditor'] as UserType[])(
		`%s user is not allowed to add new program`,
		async (role) => {
			const event = { locals: mockLocals(role) } as RequestEvent;
			const form = await mockForm({ name: 'new-program' }, programSchema);
			expect(form.valid).toBe(true);

			const response = await ProgramActions.newProgram(event, form);

			if (!('status' in response)) throw new Error('Response is not an action failure');

			expect(response.status).toBe(400);
			expect(response.data.form.errors._errors).toContain(
				'You do not have permission to perform this action'
			);
		}
	);
});

describe('New Course', () => {
	test.for(['superAdmin', 'programAdmin'] as UserType[])(
		'%s is allowed to add a new course to a programTwo',
		async (role) => {
			const event = { locals: mockLocals(role) } as RequestEvent;
			const form = await mockForm(
				{ code: 'A100', name: 'new-course', programId: PROGRAM_IDS[1] },
				courseSchema
			);
			expect(form.valid).toBe(true);

			const response = await ProgramActions.newCourse(event, form);

			const program = await prisma.program.findFirst({
				where: { name: 'ProgramTwo' },
				include: {
					courses: { orderBy: { code: 'asc' } }
				}
			});

			expect(program).not.toBe(null);
			expect(program?.courses).toHaveLength(4);
			expect(program?.courses[0].name).toBe(form.data.name);
		}
	);

	test.for(['regular', 'programEditor'] as UserType[])(
		'%s is not allowed to add a new course to a programTwo',
		async (role) => {
			const event = { locals: mockLocals(role) } as RequestEvent;
			const form = await mockForm(
				{ code: 'A100', name: 'new-course', programId: PROGRAM_IDS[1] },
				courseSchema
			);
			expect(form.valid).toBe(true);

			const response = await ProgramActions.newCourse(event, form);

			if (!('status' in response)) throw new Error('Response is not an action failure');

			expect(response.status).toBe(400);
			expect(response.data.form.errors.name?.[0]).toBe('Unauthorized');
		}
	);
});
