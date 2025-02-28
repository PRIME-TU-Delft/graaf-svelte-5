import { z } from 'zod';
import * as settings from '$lib/utils/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const graphSchema = z.object({
	courseCode: z.string(),
	name: z.string().min(1).max(settings.MAX_GRAPH_NAME_LENGTH)
});

export const graphSchemaWithId = graphSchema.extend({
	graphId: z.number().min(1)
});

export const duplicateGraphSchema = z.object({
	destinationCourseCode: z.string().min(1).max(settings.MAX_COURSE_CODE_LENGTH),
	newName: z.string().min(1).max(settings.MAX_GRAPH_NAME_LENGTH),
	graphId: z.number().min(1)
});
