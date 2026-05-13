/* eslint-disable @typescript-eslint/naming-convention */

import * as z from 'zod';

const engineStatusResponse = z.object({
	State: z.enum(['Idle', 'Active', 'Standby']),
	DesignName: z.string(),
	DesignCode: z.string(),
	IsRedundant: z.boolean(),
	IsEmulator: z.boolean(),
});

const controlGetResponse = z.array(z.object({
	Name: z.string(),
	Value: z.union([z.string(), z.boolean(), z.number()]),
}));

const componentGetResponse = z.object({
	Name: z.string(),
	Controls: z.object({
		Name: z.string(),
		Value: z.union([z.string(), z.boolean(), z.number()]),
		String: z.string(),
		Position: z.number().optional(),
	}).array().nonempty(),
});
