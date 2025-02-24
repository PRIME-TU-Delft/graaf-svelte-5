import type { User } from '@prisma/client';
import type { Session } from '@auth/sveltekit';
import type { RequestEvent } from '@sveltejs/kit';

// @see ./setup.ts to see how the users are linked in the database

export const superAdminUser: User = {
	id: '1',
	role: 'ADMIN',
	nickname: 'test-admin',
	firstName: 'Test',
	lastName: 'Admin',
	email: 'admin@user.com',
	emailVerified: null,
	image: null,
	createdAt: new Date('2022-01-20T00:00:00.000Z'),
	updatedAt: new Date('2023-02-21T00:00:00.000Z')
};

export const programAdminUser: User = {
	id: '2',
	role: 'USER',
	nickname: 'test-program-admin',
	firstName: 'Test',
	lastName: 'Program Admin',
	email: 'program-admin@user.com',
	emailVerified: null,
	image: null,
	createdAt: new Date('2022-01-20T00:00:00.000Z'),
	updatedAt: new Date('2023-02-21T00:00:00.000Z')
};

export const programEditorUser: User = {
	id: '3',
	role: 'USER',
	nickname: 'test-program-editor',
	firstName: 'Test',
	lastName: 'Program Editor',
	email: 'program-editor@user.com',
	emailVerified: null,
	image: null,
	createdAt: new Date('2022-01-20T00:00:00.000Z'),
	updatedAt: new Date('2023-02-21T00:00:00.000Z')
};

export const courseAdminUser: User = {
	id: '4',
	role: 'USER',
	nickname: 'test-course-admin',
	firstName: 'Test',
	lastName: 'Course Admin',
	email: 'course-admin@user.com',
	emailVerified: null,
	image: null,
	createdAt: new Date('2022-01-20T00:00:00.000Z'),
	updatedAt: new Date('2023-02-21T00:00:00.000Z')
};

export const courseEditorUser: User = {
	id: '5',
	role: 'USER',
	nickname: 'test-course-editor',
	firstName: 'Test',
	lastName: 'Course Editor',
	email: 'course-editor@user.com',
	emailVerified: null,
	image: null,
	createdAt: new Date('2022-01-20T00:00:00.000Z'),
	updatedAt: new Date('2023-02-21T00:00:00.000Z')
};

export const regularUser: User = {
	id: '10',
	role: 'USER',
	nickname: 'test-user',
	firstName: 'Test',
	lastName: 'User',
	email: 'test@user.com',
	emailVerified: null,
	image: null,
	createdAt: new Date('2024-01-20T00:00:00.000Z'),
	updatedAt: new Date('2025-02-21T00:00:00.000Z')
};

export const users = [
	superAdminUser,
	programAdminUser,
	programEditorUser,
	courseAdminUser,
	courseEditorUser,
	regularUser
];

export type UserType =
	| 'superAdmin'
	| 'programAdmin'
	| 'programEditor'
	| 'courseAdmin'
	| 'courseEditor'
	| 'regular';
export function mockLocals(userType: UserType) {
	let user = regularUser;

	switch (userType) {
		case 'superAdmin':
			user = superAdminUser;
			break;
		case 'programAdmin':
			user = programAdminUser;
			break;
		case 'programEditor':
			user = programEditorUser;
			break;
		case 'courseAdmin':
			user = courseAdminUser;
			break;
		case 'courseEditor':
			user = courseEditorUser;
			break;
		case 'regular':
			user = regularUser;
			break;
	}

	const session: Session = { user, expires: new Date().toDateString() };

	async function auth() {
		return session;
	}

	return { auth } as RequestEvent['locals'];
}
