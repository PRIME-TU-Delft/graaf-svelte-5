export const load = async ({ locals, url }) => {
	const session = await locals.auth();

	return {
		session
	};
};
