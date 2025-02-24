import { deleteSubjectSchema, subjectRelSchema, subjectSchema } from '$lib/zod/domainSubjectSchema';
import type { RequestEvent } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import prisma from '../db/prisma';

export class SubjectActions {
	/**
	 * Adds a subject to the graph based on the provided event.
	 *
	 * @param event - The request event containing the form data for the subject.
	 * @returns A promise that resolves to an error message if the form is invalid.
	 * @throws Will throw an error if there is an issue with the database transaction.
	 *
	 * The function performs the following steps:
	 * 1. Validates the form data using `superValidate` and `zod(subjectSchema)`.
	 * 2. Adds the subject to the graph
	 * 3. If the domainId is greater than 0 (0 means no value was given in the form),
	 *      adds the subject to the domain.
	 * 4. If there is an error, returns the error message.
	 * 5. If successful, returns the subject.
	 **/
	static async addSubjectToGraph(event: RequestEvent) {
		const form = await superValidate(event, zod(subjectSchema));

		if (!form.valid) {
			return setError(form, 'name', 'Invalid subject');
		}

		try {
			const subjectCount = await prisma.subject.count({
				where: {
					graphId: form.data.graphId
				}
			});

			await prisma.subject.create({
				data: {
					name: form.data.name,
					order: subjectCount,
					graphId: form.data.graphId,
					domainId: form.data.domainId > 0 ? form.data.domainId : null
				}
			});
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}

	static async deleteSubject(event: RequestEvent) {
		const form = await superValidate(event, zod(deleteSubjectSchema));

		if (!form.valid) return setError(form, '', 'Invalid subject');

		const removeOutFromIncommingSubjects = form.data.incommingSubjects.map((id) => {
			return prisma.subject.update({
				where: { id },
				data: {
					outgoingSubjects: {
						disconnect: { id: form.data.subjectId }
					}
				}
			});
		});

		const removeInFromOutgoingSubjects = form.data.outgoingSubjects.map((id) => {
			return prisma.subject.update({
				where: { id },
				data: {
					incommingSubjects: {
						disconnect: { id: form.data.subjectId }
					}
				}
			});
		});

		const deleteSubject = prisma.subject.delete({
			where: { id: form.data.subjectId }
		});

		try {
			await prisma.$transaction([
				...removeOutFromIncommingSubjects,
				...removeInFromOutgoingSubjects,
				deleteSubject
			]);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}

	static async changeSubject(event: RequestEvent) {
		const form = await superValidate(event, zod(subjectSchema));

		if (!form.valid) return setError(form, 'name', 'Invalid subject');
		if (form.data.subjectId === 0) {
			return setError(form, 'name', 'Invalid subject id, cannot be 0');
		}

		try {
			await prisma.subject.update({
				where: { id: form.data.subjectId },
				data: {
					name: form.data.name,
					domainId: form.data.domainId > 0 ? form.data.domainId : null
				}
			});
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}

	/**
	 * Adds a relationship between two subjects based on the provided event.
	 *
	 * @param event - The request event containing the form data for the subject relationship.
	 * @returns A promise that resolves to an error message if the form is invalid or if the subjects are already connected.
	 * @throws Will throw an error if there is an issue with the database transaction.
	 *
	 * The function performs the following steps:
	 * 1. Validates the form data using `superValidate` and `zod(subjectRelSchema)`.
	 * 2. Checks if the subjects are already connected.
	 * 3. If not connected, updates the subjects to connect them in both directions.
	 * 4. Executes the updates within a database transaction.
	 */
	static async addSubjectRel(event: RequestEvent) {
		const form = await superValidate(event, zod(subjectRelSchema));

		if (!form.valid) {
			return setError(form, '', 'Invalid subject relationship');
		}

		try {
			// Check if the subjects are already connected
			const isConnected = await prisma.subject.findFirst({
				where: {
					id: form.data.subjectInId,
					outgoingSubjects: {
						some: {
							id: form.data.subjectOutId
						}
					}
				}
			});

			if (isConnected) {
				return setError(form, '', 'Subjects are already connected');
			}

			const addOutToIn = prisma.subject.update({
				where: {
					id: form.data.subjectInId
				},
				data: {
					outgoingSubjects: {
						connect: {
							id: form.data.subjectOutId
						}
					}
				}
			});

			const addInToOut = prisma.subject.update({
				where: {
					id: form.data.subjectOutId
				},
				data: {
					incommingSubjects: {
						connect: {
							id: form.data.subjectInId
						}
					}
				}
			});

			await prisma.$transaction([addOutToIn, addInToOut]);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}
}
