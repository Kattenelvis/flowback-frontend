import type { Comment } from '$lib/Poll/interface';
import { pollComments as pollCommentsLimit } from '../Generic/APILimits.json';
import { fetchRequest } from '$lib/FetchRequest';

//Uses recursion
export const getCommentDepth = (comment: Comment, comments: Comment[]): number => {
	let depth: number = 0;

	if (comment.parent_id === null) return 0;
	else {
		let parentComment = comments?.find((_comment) => _comment.id === comment.parent_id);
		if (parentComment)
			if (parentComment.reply_depth) return parentComment.reply_depth + 1;
			else return getCommentDepth(parentComment, comments) + 1;
	}

	return depth;
};

//Calls the get comment API to 
export const getComments = async (
	id: number | string | null | undefined,
	api: 'poll' | 'thread' | 'delegate-history',
	offset = 0,
	sortBy: string | null = null,
	searchString: string = ''
) => {
	let _api = '';

	if (api === 'poll') _api += `group/poll/${id}`;
	else if (api === 'thread') _api += `group/thread/${id}`;
	else if (api === 'delegate-history') _api += `group/delegate/pool/${id}`;

	_api += `/comment/list?limit=${pollCommentsLimit}`;
	_api += `&offset=${offset}`;
	if (sortBy !== null) _api += `&order_by=${sortBy}`;
	if (searchString !== '') _api += `&message__icontains=${searchString}`;

	const { res, json } = await fetchRequest('GET', _api);

	return {
		comments: json?.results?.map((comment: Comment) => {
			comment.being_edited = false;
			comment.being_replied = false;
			comment.being_reported = false;
			return comment;
		}),
		next: json.next
	};
};

export async function reportComment(commentId: number, description: string,){
	const {res,json} = await fetchRequest('POST',`report/create`,{
		title:commentId,
		description
	},true)
	console.log(res,json)
	if(!res.ok) return {success:false,message:'Failed to report comment, try again later'}

	return {success:true,message:'Comment has been reported'}
}
const timeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 31536000],
	['month', 2592000],
	['week', 604800],
	['day', 86400],
	['hour', 3600],
	['minute', 60]
];

// How long ago a date was, such as "5 minutes ago", in the given language
export const timeSince = (date: string, language: string | null | undefined) => {
	const seconds = (new Date(date).getTime() - Date.now()) / 1000;
	let format: Intl.RelativeTimeFormat;
	try {
		format = new Intl.RelativeTimeFormat(language ?? 'en', { numeric: 'auto' });
	} catch {
		format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
	}

	for (const [unit, length] of timeUnits)
		if (Math.abs(seconds) >= length) return format.format(Math.round(seconds / length), unit);
	return format.format(0, 'second');
};

// Splits a comment into plain text and #proposal-tags so the tags can be highlighted
export const splitTags = (message: string) =>
	message
		.split(/(#[^\s#]+)/)
		.filter((text) => text !== '')
		.map((text) => ({ text, tag: text.startsWith('#') }));
