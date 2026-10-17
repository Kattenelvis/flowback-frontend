// Fixes issue where elements flash white on (hard) reload.
// Lives in a file instead of inline in app.html so the Content-Security-Policy doesn't need 'unsafe-inline' for scripts.
(function () {
	try {
		let theme = localStorage.getItem('theme');
		let prefersDark = window?.matchMedia('(prefers-color-scheme: dark)').matches;
		let shouldDark = theme === 'dark' || (!theme && prefersDark);

		if (shouldDark) document.documentElement.classList.add('dark');
		else document.documentElement.classList.remove('dark');
	} catch (e) {
		/* ignore */
	}
})();
