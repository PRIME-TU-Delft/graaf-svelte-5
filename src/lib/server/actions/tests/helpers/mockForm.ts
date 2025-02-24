import type { SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { ZodObject, ZodRawShape } from 'zod';

export default async function mockForm<T extends Record<string, unknown>, S extends ZodRawShape>(
	data: T,
	schema: ZodObject<S>
) {
	const z = await zod(schema).validate(data);

	const form: SuperValidated<T> = {
		id: 'mock',
		valid: z.success,
		data,
		posted: true,
		errors: { _errors: [] }
	};

	if (!z.success) {
		const errors = (form.errors._errors = z.issues.map((i) => i.message));
		form.errors._errors = errors;
	}

	return form;
}
