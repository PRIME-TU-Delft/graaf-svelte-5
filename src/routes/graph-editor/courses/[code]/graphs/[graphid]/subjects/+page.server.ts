import { SubjectActions } from '$lib/server/actions';
import { deleteSubjectSchema, subjectRelSchema, subjectSchema } from '$lib/zod/domainSubjectSchema';
import type { ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load: ServerLoad = async ({ params }) => {
	return {
		newSubjectForm: await superValidate(zod(subjectSchema)),
		deleteSubjectForm: await superValidate(zod(deleteSubjectSchema)),
		newSubjectRelForm: await superValidate(zod(subjectRelSchema))
	};
};

// ACTIONS
export const actions = {
	'add-subject-to-graph': SubjectActions.addSubjectToGraph,
	'change-subject-in-graph': SubjectActions.changeSubject,
	'delete-subject': SubjectActions.deleteSubject,

	'add-subject-rel': SubjectActions.addSubjectRel
};
