<script lang="ts">
	import AuthShell from '$lib/Login/AuthShell.svelte';
	import Verify from '$lib/Login/Verify.svelte';
</script>

<AuthShell title="Finish setting up" subtitle="Pick a username and a password.">
	<Verify />
</AuthShell>
