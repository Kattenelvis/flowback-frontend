import { errorMessage } from '$lib/FetchRequest';

export const statusMessageFormatter = (
	res: any,
	json: any,
	successMessage: string = 'Success'
) =>
	res.ok
		? { message: successMessage, success: true }
		: { message: errorMessage(res, json), success: false };
