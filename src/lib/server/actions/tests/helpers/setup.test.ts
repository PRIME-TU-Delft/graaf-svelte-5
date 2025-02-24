import prisma from '$lib/server/db/prisma';
import { describe, expect, test } from 'vitest';
import {
	courseAdminUser,
	courseEditorUser,
	programAdminUser,
	programEditorUser
} from './test-users';

/*
@description Tests to check if the setup is as expected. A diagram of the test setup can be found in the README.md file. The setup includes:
- 6 users
- 3 programs
- 3 courses
- 3 graphs with each graph having:
	- 3 domains
	- 3 subjects
	- 3 relationships between subjects
	- 3 relationships between domains
	- 3 relationships between subjects and domains
*/

describe('Test setup', () => {
	test('User setup', async () => {
		const users = await prisma.user.findMany();
		expect(users.length).toBe(6);

		const superAdmin = users.filter((user) => user.role === 'ADMIN');
		expect(superAdmin).toBeDefined();
		expect(superAdmin).toHaveLength(1);
	});

	test('Program setup', async () => {
		const programs = await prisma.program.findMany({
			include: { admins: true, editors: true },
			orderBy: { name: 'asc' }
		});
		expect(programs.map((p) => p.name)).toStrictEqual(['ProgramOne', 'ProgramThree', 'ProgramTwo']);
		expect(programs.length).toBe(3);

		const programOne = programs.filter((program) => program.name === 'ProgramOne');
		expect(programOne).toBeDefined();
		expect(programOne).toHaveLength(1);

		// ProgramOne has no program admin or editors
		expect(programOne[0].admins).toHaveLength(0);
		expect(programOne[0].editors).toHaveLength(0);

		// ProgramTwo has a program admin, and no editors
		expect(programs[2].admins).toHaveLength(1);
		expect(programs[2].admins[0].id).toBe(programAdminUser.id);
		expect(programs[2].editors).toHaveLength(0);

		// ProgramThree has no program admin, but has a program editor
		expect(programs[1].admins).toHaveLength(0);
		expect(programs[1].editors).toHaveLength(1);
		expect(programs[1].editors[0].id).toBe(programEditorUser.id);
	});

	test('Course setup', async () => {
		const courses = await prisma.course.findMany({
			include: { programs: true, admins: true, editors: true },
			orderBy: { name: 'asc' }
		});
		expect(courses.map((c) => c.name)).toStrictEqual(['CourseOne', 'CourseThree', 'CourseTwo']);
		expect(courses.length).toBe(3);

		// ProgramOne, ProgramTwo and ProgramThree are connected to all courses
		expect(courses[0].programs.length).toBe(3);
		expect(courses[1].programs.length).toBe(3);
		expect(courses[2].programs.length).toBe(3);

		// CourseOne has no course admin or editors
		expect(courses[0].admins).toHaveLength(0);
		expect(courses[0].editors).toHaveLength(0);

		// CourseThree has a course admin, and no editors
		expect(courses[2].admins).toHaveLength(1);
		expect(courses[2].admins[0].id).toBe(courseAdminUser.id);
		expect(courses[2].editors).toHaveLength(0);

		// CourseTwo has no course admin, but has a course editor
		expect(courses[1].admins).toHaveLength(0);
		expect(courses[1].editors).toHaveLength(1);
		expect(courses[1].editors[0].id).toBe(courseEditorUser.id);
	});

	test('Graph setup', async () => {
		const graph = await prisma.graph.findFirst({
			where: { name: 'GraphOne' },
			include: { domains: true, subjects: true }
		});

		if (!graph) {
			throw new Error('Graph not found');
		}

		expect(graph).toBeDefined();
		expect(graph.domains).toHaveLength(3);
		expect(graph.subjects).toHaveLength(3);
	});

	test('Domain setup', async () => {
		const graph = await prisma.graph.findFirst({
			where: { name: 'GraphOne' },
			include: {
				domains: { include: { outgoingDomains: true, incommingDomains: true, subjects: true } }
			}
		});
		expect(graph).toBeDefined();

		if (!graph) throw new Error('Graph not found');

		const domains = graph.domains;
		expect(domains).toHaveLength(3);
		expect(domains[0].name).toBe('DomainOne');
		expect(domains[1].name).toBe('DomainTwo');
		expect(domains[2].name).toBe('DomainThree');

		// DOMAIN ONE
		expect(domains[0].outgoingDomains).toHaveLength(1);
		expect(domains[0].outgoingDomains[0].name).toBe('DomainTwo');
		expect(domains[0].incommingDomains).toHaveLength(0);
		expect(domains[0].subjects).toHaveLength(2);

		// DOMAIN TWO
		expect(domains[1].outgoingDomains).toHaveLength(1);
		expect(domains[1].outgoingDomains[0].name).toBe('DomainThree');
		expect(domains[1].incommingDomains).toHaveLength(1);
		expect(domains[1].incommingDomains[0].name).toBe('DomainOne');
		expect(domains[1].subjects).toHaveLength(1);

		// DOMAIN THREE
		expect(domains[2].outgoingDomains).toHaveLength(0);
		expect(domains[2].incommingDomains).toHaveLength(1);
		expect(domains[2].incommingDomains[0].name).toBe('DomainTwo');
	});

	test('Subject setup', async () => {
		const graph = await prisma.graph.findFirst({
			where: { name: 'GraphOne' },
			include: {
				subjects: {
					include: { incommingSubjects: true, outgoingSubjects: true },
					orderBy: { name: 'asc' }
				}
			}
		});

		if (!graph) throw new Error('Graph not found');

		const subjects = graph.subjects;
		expect(subjects).toHaveLength(3);
		expect(subjects[0].name).toBe('SubjectOne');
		expect(subjects[1].name).toBe('SubjectThree');
		expect(subjects[2].name).toBe('SubjectTwo');

		// SUBJECT One
		expect(subjects[0].incommingSubjects).toHaveLength(1);
		expect(subjects[0].incommingSubjects[0].name).toBe('SubjectTwo');
		expect(subjects[0].outgoingSubjects).toHaveLength(0);

		// SUBJECT Two
		expect(subjects[2].incommingSubjects).toHaveLength(1);
		expect(subjects[2].incommingSubjects[0].name).toBe('SubjectThree');
		expect(subjects[2].outgoingSubjects).toHaveLength(1);
		expect(subjects[2].outgoingSubjects[0].name).toBe('SubjectOne');

		// SUBJECT Three
		expect(subjects[1].outgoingSubjects).toHaveLength(1);
		expect(subjects[1].outgoingSubjects[0].name).toBe('SubjectTwo');
		expect(subjects[1].incommingSubjects).toHaveLength(0);
	});
});
