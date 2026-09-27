import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// The group schedule lives on its own route, not as a tab of the group page
export const load: PageLoad = ({ url, params }) => {
	if (url.searchParams.get('page') === 'schedule')
		redirect(307, `/schedule?groupId=${params.groupId}`);
};
