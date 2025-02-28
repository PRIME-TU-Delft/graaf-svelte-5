import type { User } from '@prisma/client';
import { redirect, type RequestEvent } from '@sveltejs/kit';

export async function getUser({ locals }: { locals: RequestEvent['locals'] }) {
	const session = await locals.auth();
	const user = session?.user as User | undefined;
	if (!user) redirect(303, '/auth');

	return user!;
}
