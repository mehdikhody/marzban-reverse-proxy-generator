<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();
</script>

<Toaster />

<main class="container mx-auto px-4 py-8">
	{@render children()}
</main>
