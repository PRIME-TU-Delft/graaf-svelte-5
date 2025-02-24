import { DomainActions } from '$lib/server/actions';
import {
	changeDomainRelSchema,
	deleteDomainSchema,
	domainRelSchema,
	domainSchema
} from '$lib/zod/domainSubjectSchema';
import type { ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load: ServerLoad = async ({ params }) => {
	return {
		newDomainForm: await superValidate(zod(domainSchema)),
		deleteDomainForm: await superValidate(zod(deleteDomainSchema)),
		newDomainRelForm: await superValidate(zod(domainRelSchema)),
		changeDomainRelForm: await superValidate(zod(changeDomainRelSchema))
	};
};

// ACTIONS
export const actions = {
	'add-domain-to-graph': DomainActions.addDomainToGraph,
	'change-domain-in-graph': DomainActions.changeDomain,
	'delete-domain': DomainActions.deleteDomain,

	// Domain relationships
	'add-domain-rel': DomainActions.addDomainRel,
	'change-domain-rel': DomainActions.changeDomainRel,
	'delete-domain-rel': DomainActions.deleteDomainRel
};
