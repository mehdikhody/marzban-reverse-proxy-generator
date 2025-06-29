<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { json } from '@codemirror/lang-json';
	import Clipboard from '@lucide/svelte/icons/clipboard';
	import { githubLight } from '@uiw/codemirror-theme-github';
	import CodeMirror from 'svelte-codemirror-editor';
	import { toast } from 'svelte-sonner';

	let { code }: { code: string } = $props();
</script>

<ScrollArea class="relative rounded-md bg-slate-100">
	<div class="absolute top-2 right-4 z-10">
		<Tooltip.Provider delayDuration={0}>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						class="size-8 cursor-pointer"
						variant="outline"
						size="icon"
						onclick={() => {
							navigator.clipboard.writeText(code);
							toast.success('Code copied to clipboard');
						}}
					>
						<Clipboard />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Copy</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</div>

	<div class="max-h-96 min-h-56">
		<CodeMirror
			editable={false}
			basic={true}
			lang={json()}
			theme={githubLight}
			value={code.replace(
				/\[\s*((?:"(?:[^"\\]|\\.)*"\s*,\s*)*(?:"(?:[^"\\]|\\.)*")\s*)\]/g,
				(match, contents) => {
					// Normalize whitespace between strings
					const flattened = contents
						.replace(/\s+/g, ' ') // Collapse whitespace
						.replace(/\s*,\s*/g, ', ') // Normalize comma spacing
						.trim();

					return `[${flattened}]`;
				}
			)}
		/>
	</div>
</ScrollArea>
