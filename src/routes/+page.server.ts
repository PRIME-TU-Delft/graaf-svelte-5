import { redirect, type ServerLoad } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load: ServerLoad = async ({ locals, url }) => {
	const session = await locals.auth();

	// if (!session?.user) {
	// 	redirect(303, '/auth');
	// } else {
	// 	redirect(303, '/graph-editor');
	// }

	return {
		env
	};
};
