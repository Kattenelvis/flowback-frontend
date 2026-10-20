import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

// The accounting module is optional, see PUBLIC_FLOWBACK_LEDGER_MODULE
export const load = () => {
	if (env.PUBLIC_FLOWBACK_LEDGER_MODULE !== 'TRUE') redirect(307, '/home');
};
