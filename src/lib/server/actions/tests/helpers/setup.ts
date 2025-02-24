import resetDb from './reset-db';
import { beforeEach } from 'vitest';
import { users } from './test-users';
import prisma from '$lib/server/db/prisma';
import type { Domain, Program, Subject, User } from '@prisma/client';

async function createUsers() {
	const createUsers = users.map((user) => {
		return prisma.user.create({
			data: {
				...user
			}
		});
	});

	return await prisma.$transaction(createUsers);
}

export const PROGRAM_IDS = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
async function createPrograms(users: User[]): Promise<Program[]> {
	const p1 = prisma.program.create({
		data: {
			id: PROGRAM_IDS[0],
			name: 'ProgramOne'
		}
	});

	const p2 = prisma.program.create({
		data: {
			id: PROGRAM_IDS[1],
			name: 'ProgramTwo',
			admins: { connect: { id: users[1].id } } // add the program admin user
		}
	});
	const p3 = prisma.program.create({
		data: {
			id: PROGRAM_IDS[2],
			name: 'ProgramThree',
			editors: { connect: { id: users[2].id } } // add the program editor user
		}
	});

	return await prisma.$transaction([p1, p2, p3]);
}

async function createCourses(programs: Program[]) {
	const c1 = prisma.course.create({
		data: {
			code: 'CS101',
			name: 'CourseOne',
			programs: {
				connect: [{ id: programs[0].id }, { id: programs[1].id }, { id: programs[2].id }]
			}
		}
	});

	const c2 = prisma.course.create({
		data: {
			code: 'CS201',
			name: 'CourseTwo',
			programs: {
				connect: [{ id: programs[0].id }, { id: programs[1].id }, { id: programs[2].id }]
			},
			admins: { connect: { id: users[3].id } } // add the course admin user
		}
	});

	const c3 = prisma.course.create({
		data: {
			code: 'CS301',
			name: 'CourseThree',
			programs: {
				connect: [{ id: programs[0].id }, { id: programs[1].id }, { id: programs[2].id }]
			},
			editors: { connect: { id: users[4].id } } // add the course editor user
		}
	});

	return await prisma.$transaction([c1, c2, c3]);
}

async function linkSubjects(subjectIn: Subject, subjectOut: Subject) {
	const addOutToIn = prisma.subject.update({
		where: { id: subjectIn.id },
		data: {
			outgoingSubjects: { connect: { id: subjectOut.id } }
		}
	});

	const addInToOut = prisma.subject.update({
		where: { id: subjectOut.id },
		data: {
			incommingSubjects: { connect: { id: subjectIn.id } }
		}
	});

	await prisma.$transaction([addOutToIn, addInToOut]);
}

async function linkDomains(domainIn: Domain, domainOut: Domain) {
	const addOutToIn = prisma.domain.update({
		where: { id: domainIn.id },
		data: {
			outgoingDomains: { connect: { id: domainOut.id } }
		}
	});

	const addInToOut = prisma.domain.update({
		where: { id: domainOut.id },
		data: {
			incommingDomains: { connect: { id: domainIn.id } }
		}
	});

	await prisma.$transaction([addOutToIn, addInToOut]);
}

async function linkSubjectToDomain(subject: Subject, domain: Domain) {
	const addSubjectToDomain = await prisma.subject.update({
		where: { id: subject.id },
		data: {
			domain: { connect: { id: domain.id } }
		}
	});
}

async function createGraph(name: string, courseId: string) {
	const graph = await prisma.graph.create({
		data: { name, courseId }
	});

	const subjectNames = ['One', 'Two', 'Three'];

	const createSubjects = subjectNames.map((subjectName, i) => {
		return prisma.subject.create({
			data: {
				name: 'Subject' + subjectName,
				order: i,
				graphId: graph.id
			}
		});
	});

	const domainNames = ['One', 'Two', 'Three'];
	const createDomains = domainNames.map((domainName, i) => {
		return prisma.domain.create({
			data: {
				name: 'Domain' + domainName,
				order: i,
				graphId: graph.id
			}
		});
	});

	const subjects = await prisma.$transaction([...createSubjects]);
	const domains = await prisma.$transaction([...createDomains]);

	await Promise.all([
		// DomainOne -> DomainTwo -> DomainThree
		linkDomains(domains[0], domains[1]),
		linkDomains(domains[1], domains[2]),

		// SubjectOne <- SubjectTwo <- SubjectThree
		linkSubjects(subjects[1], subjects[0]),
		linkSubjects(subjects[2], subjects[1]),

		linkSubjectToDomain(subjects[0], domains[0]), // SubjectOne -> DomainOne
		linkSubjectToDomain(subjects[1], domains[0]), // SubjectTwo -> DomainOne
		linkSubjectToDomain(subjects[2], domains[1]) // SubjectThree -> DomainTwo
	]);
}

beforeEach(async () => {
	await resetDb();

	const users = await createUsers();
	const programs = await createPrograms(users);
	const _ = await createCourses(programs);

	await createGraph('GraphOne', 'CS101');
	await createGraph('GraphTwo', 'CS201');
	await createGraph('GraphThree', 'CS301');
});
