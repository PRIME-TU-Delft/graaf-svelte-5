import prisma from '$lib/server/db/prisma';
import { describe, expect, test } from 'vitest';
import { GraphActions } from '../Graphs';
import { mockUser } from './helpers/test-users';
import mockForm from './helpers/mockForm';
import { duplicateGraphSchema } from '$lib/zod/graphSchema';

async function setupSympleDB() {
	const sourceGraph = await prisma.course.update({
		where: { code: 'CS101' },
		data: {
			graphs: {
				create: {
					name: 'sourceGraph',
					domains: {
						createMany: {
							data: [
								{
									id: 101,
									name: 'testDomainOne',
									order: 1
								},
								{
									id: 111,
									name: 'testDomainTwo',
									order: 2
								}
							]
						}
					}
				}
			}
		},
		include: { graphs: { where: { name: 'sourceGraph' } } }
	});

	await prisma.domain.update({
		where: { id: 101 },
		data: {
			outgoingDomains: {
				connect: { id: 111 }
			}
		}
	});

	await prisma.domain.update({
		where: { id: 111 },
		data: {
			incommingDomains: {
				connect: { id: 101 }
			}
		}
	});

	return sourceGraph;
}

describe('Relations are perserved', () => {
	test('simple domain duplication', async () => {
		const sourceGraph = await setupSympleDB();

		const user = mockUser('superAdmin');
		const form = await mockForm(
			{ destinationCourseCode: 'CS101', newName: 'newGraph', graphId: sourceGraph.graphs[0].id },
			duplicateGraphSchema
		);

		await GraphActions.duplicateGraph(user, form, 'CS101');

		const destinationGraph = await prisma.graph.findFirst({
			where: { name: 'newGraph' },
			include: {
				domains: {
					include: {
						incommingDomains: { select: { name: true } },
						outgoingDomains: { select: { name: true } }
					}
				}
			}
		});

		expect(destinationGraph?.domains).toHaveLength(2);
		expect(destinationGraph?.domains[0].name).toBe('testDomainOne');
		expect(destinationGraph?.domains[1].name).toBe('testDomainTwo');

		expect(destinationGraph?.domains[0].outgoingDomains).toHaveLength(1);
		expect(destinationGraph?.domains[0].outgoingDomains[0].name).toBe('testDomainTwo');

		expect(destinationGraph?.domains[1].incommingDomains).toHaveLength(1);
		expect(destinationGraph?.domains[1].incommingDomains[0].name).toBe('testDomainOne');
	});
});
