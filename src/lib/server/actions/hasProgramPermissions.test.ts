import { describe, expect, test } from 'vitest';
import { hasProgramPermissions } from './Programs';
import { superAdminUser, users } from './tests/helpers/test-users';

describe('hasProgramPermissions', () => {
	test.for(users)('is empty object when no permissions', (user) => {
		const res = hasProgramPermissions(user, { admin: false, editor: false, superAdmin: false });

		expect(res).toEqual({});
	});

	test('is empty object when superAdmin', () => {
		const res = hasProgramPermissions(superAdminUser, {
			admin: true,
			editor: true,
			superAdmin: true
		});

		expect(res).toEqual({});
	});

	test('has editor permission', () => {
		const res = hasProgramPermissions(users[0], { admin: false, editor: true, superAdmin: false });

		expect(res).toEqual({ OR: [{ editors: { some: { id: users[0].id } } }] });
	});

	test('has admin permission', () => {
		const res = hasProgramPermissions(users[0], { admin: true, editor: false, superAdmin: false });

		expect(res).toEqual({ OR: [{ admins: { some: { id: users[0].id } } }] });
	});

	test('has both admin and editor permission when both are set to true', () => {
		const res = hasProgramPermissions(users[0], { admin: true, editor: true, superAdmin: false });

		expect(res).toEqual({
			OR: [{ editors: { some: { id: users[0].id } } }, { admins: { some: { id: users[0].id } } }]
		});
	});
});
