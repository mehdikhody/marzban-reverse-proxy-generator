<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import Form from './form.svelte';
</script>

<div class="mx-auto max-w-2xl space-y-10">
	<Card.Root>
		<Card.Content class="space-y-10">
			<article class="prose prose-sm">
				<h2>Marzban Reverse Proxy Generator</h2>
				<p>
					This tool helps you generate reverse proxy configurations for the Marzban panel using Xray
					core. Setting this up was a confusing task for me, so I created this tool to simplify the
					process.
				</p>
				<Collapsible.Root>
					<Collapsible.Trigger class="py-0">
						<span class="cursor-pointer text-gray-500">Read more</span>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<p>Currently, the tool is designed for the following setup:</p>
						<ul>
							<li><strong>VLESS</strong> is used for users to connect to your bridge server.</li>
							<li>
								<strong>VMess</strong> is used for the upstream server to connect to the bridge server.
							</li>
							<li>Reverse proxy configurations</li>
						</ul>
						<p>
							This setup effectively creates a reverse proxy through which upstream traffic is
							tunneled.
						</p>
						<h3>How to Use:</h3>
						<ol>
							<li><strong>Create a user</strong> in your Marzban panel.</li>
							<li>Select only the <strong>VMess</strong> protocol for that user.</li>
							<li>Use the <strong>generated UUID</strong> from this tool as the client's ID.</li>
							<li>
								The <strong>upstream server</strong> should connect to the bridge server using this UUID
								via VMess.
							</li>
						</ol>
						<h3>Optional - Port Configuration:</h3>
						<p>
							If you're using HAProxy or Nginx to handle HTTPS (port 443) on your bridge server:
						</p>
						<ul>
							<li>Enable the <strong>bridge port</strong> option.</li>
							<li>Set it to <strong>443</strong> (or any other port you prefer).</li>
							<li>The upstream server will then connect through that port.</li>
						</ul>
						<p>
							This tool streamlines the setup process and ensures your reverse proxy configuration
							is correctly structured.
						</p>
					</Collapsible.Content>
				</Collapsible.Root>
			</article>

			<Form />
		</Card.Content>
	</Card.Root>
	<p class="text-center text-sm text-gray-500">
		Created By ❤️ By <a class="text-blue-700" href="https://github.com/mehdikhody">Mehdikhody</a>
	</p>
</div>
