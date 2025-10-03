// This file sadly has to exist because of issues with playwright and sveltekit. Keep track of this GitHub issue to see if fixed:
// https://github.com/sveltejs/kit/issues/1485

export const idfy = (text: string) => {
	return text.replace(' ', '-').replace(' ', '-').toLowerCase()
}