import { env } from '$env/dynamic/private';
import { PrismaClient } from '@prisma/client';
import type { PrismaClientOptions } from '@prisma/client/runtime/library';

function debugLevel(): PrismaClientOptions['log'] {
	if (env.DEBUG) return ['query', 'info', 'warn', 'error'];
	if (env.TESTING) return [];

	return ['error'];
}

const prisma = new PrismaClient({
	log: debugLevel()
});
export default prisma;
