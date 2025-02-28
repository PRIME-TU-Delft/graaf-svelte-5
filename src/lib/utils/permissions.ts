import type { User } from '@prisma/client';

type ProgramsPermission = {
	editors?: { id: string }[];
	admins?: { id: string }[];
};

type CoursePermissions = {
	editors?: { id: string }[];
	admins?: { id: string }[];
	programs: ProgramsPermission[];
};

type PermissionsOptions = {
	courseAdmin: boolean;
	courseEditor: boolean;
	superAdmin: boolean;
};

export function hasCoursePermissions(
	user: User,
	course: CoursePermissions,
	options: PermissionsOptions = { courseAdmin: true, courseEditor: true, superAdmin: true }
) {
	// If the user is a super-admin, they can edit any program. Thus no special where permission is required
	if (options.superAdmin && user.role == 'ADMIN') return true;

	// If no permissions are set, return empty permissions
	if (!options.courseAdmin && !options.courseEditor) return true;

	// Check if user is an editor/admin if that is required
	if (options.courseEditor && course.editors?.some((editor) => editor.id === user.id)) return true;
	if (options.courseAdmin && course.admins?.some((admin) => admin.id === user.id)) return true;

	// Check if user is an editor/admin of a program that is linked to the course
	for (const program of course.programs) {
		if (program.editors?.some((editor) => editor.id === user.id)) return true;
		if (program.admins?.some((admin) => admin.id === user.id)) return true;
	}

	return false;
}
