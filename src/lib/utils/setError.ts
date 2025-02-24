import { fail } from '@sveltejs/kit';
import type { FormPathLeavesWithErrors, SuperValidated } from 'sveltekit-superforms';

/**
 * This code is directly copied from the repo
 * The orignal imported code is not compatible with vitest,
 * in the future (when sveltekit-superform has a stable release for svelte-5)
 * we will replace this with the original code
 */

type PathData = {
	parent: any;
	key: string;
	value: any;
	path: (string | number | symbol)[];
	isLeaf: boolean;
	set: (value: any) => 'skip';
};

function setPath<T extends object>(parent: T, key: keyof T, value: T[keyof T]): 'skip' {
	parent[key] = value;
	return 'skip';
}

function traversePath<T extends object>(
	obj: T,
	realPath: (string | number | symbol)[],
	modifier?: (data: PathData) => undefined | unknown | void
): PathData | undefined {
	if (!realPath.length) return undefined;
	const path = [realPath[0]];
	let parent = obj;
	while (parent && path.length < realPath.length) {
		const key = path[path.length - 1] as keyof T;
		const value = modifier
			? modifier({
					parent,
					key: String(key),
					value: parent[key],
					path: path.map((p) => String(p)),
					isLeaf: false,
					set: (v) => setPath(parent, key, v)
				})
			: parent[key];
		if (value === undefined) return undefined;
		else parent = value as T;
		path.push(realPath[path.length]);
	}
	if (!parent) return undefined;
	const key = realPath[realPath.length - 1];
	return {
		parent,
		key: String(key),
		value: parent[key as keyof T],
		path: realPath.map((p) => String(p)),
		isLeaf: true,
		set: (v) => setPath(parent, key as keyof T, v)
	};
}

type SetErrorOptions = {
	overwrite?: boolean;
	removeFiles?: boolean;
	status?: number;
};

export function setError<
	T extends Record<string, unknown>,
	Path extends FormPathLeavesWithErrors<T>,
	M,
	In extends Record<string, unknown>
>(form: SuperValidated<T, M, In>, path: '' | Path, error: string, options: SetErrorOptions = {}) {
	const errArr = Array.isArray(error) ? error : [error];
	form.valid = false;

	if (!form.errors) form.errors = {};

	if (path === null || path === '') {
		if (!form.errors._errors) form.errors._errors = [];
		form.errors._errors = options.overwrite ? errArr : form.errors._errors.concat(errArr);

		return fail(options.status ?? 400, { form });
	}

	const realPath = path
		.toString()
		.split(/[[\].]+/)
		.filter((p) => p);

	const leaf = traversePath(form.errors, realPath, ({ parent, key, value }) => {
		if (value === undefined) parent[key] = {};
		return parent[key];
	});
	if (leaf) {
		leaf.parent[leaf.key] =
			Array.isArray(leaf.value) && !options.overwrite ? leaf.value.concat(errArr) : errArr;
	}

	return fail(options.status ?? 400, { form });
}
