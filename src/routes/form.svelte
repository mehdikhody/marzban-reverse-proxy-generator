<script lang="ts" module>
	import { v4 as uuidv4 } from 'uuid';
	import { z } from 'zod/v4';

	const formSchema = z.object({
		name: z.string('Name must be a string').min(1, 'Name is required').default('iran france'),
		tunnel_port: z
			.number('Tunnel Port must be a number')
			.int('Tunnel Port must be an integer')
			.min(1, 'Tunnel Port must be a positive integer')
			.default(10010),
		main_port: z
			.number('Main Port must be a number')
			.int('Main Port must be an integer')
			.min(1, 'Main Port must be a positive integer')
			.default(20010),
		upstream_ip: z.ipv4('Upstream IP must be a valid IPv4 address').default('192.168.1.1'),
		bridge_ip: z.ipv4('Bridge IP must be a valid IPv4 address').default('192.168.1.2'),
		proxy_port_enabled: z.boolean('Proxy Port enabled must be a boolean').default(false),
		proxy_port: z
			.number('Proxy Port must be a number')
			.int('Proxy Port must be an integer')
			.min(1, 'Proxy Port must be a positive integer')
			.optional(),
		client_id: z.uuid('Client ID must be a valid UUID').default(uuidv4())
	});
</script>

<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import Clipboard from '@lucide/svelte/icons/clipboard';
	import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
	import snakeCase from 'lodash/snakeCase';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import Codeblock from './codeblock.svelte';

	const form = superForm(defaults(zod4(formSchema)), {
		validators: zod4(formSchema),
		SPA: true,
		onUpdate: ({ form: f }) => {
			if (f.valid) {
				toast.success(`You submitted ${JSON.stringify(f.data, null, 2)}`);
			} else {
				toast.error('Please fix the errors in the form.');
			}
		}
	});

	const { form: formData, enhance, errors } = form;

	$: {
		if (!$formData.proxy_port_enabled) {
			$formData.proxy_port = $formData.tunnel_port;
		}
	}

	let randkey = '';
	$: {
		$formData;
		const key = Math.random().toString(36).substring(2, 10);
		randkey = key.toUpperCase();
	}
	$: name = snakeCase($formData.name).toUpperCase();
	$: inbound_code = JSON.stringify(
		{
			inbounds: [
				{
					tag: `${name}_VMESS_TCP_${$formData.tunnel_port}`,
					listen: '0.0.0.0',
					port: $formData.tunnel_port,
					protocol: 'vmess',
					settings: {
						clients: [],
						decryption: 'none'
					},
					streamSettings: {
						network: 'tcp',
						security: 'none',
						tcpSettings: {}
					},
					sniffing: {
						enabled: true,
						destOverride: ['http', 'tls', 'fakedns', 'quic']
					}
				},
				{
					tag: `${name}_VLESS_TCP_NONE_${$formData.main_port}`,
					listen: '0.0.0.0',
					port: $formData.main_port,
					protocol: 'vless',
					settings: {
						clients: [],
						decryption: 'none'
					},
					streamSettings: {
						network: 'tcp',
						security: 'none',
						tcpSettings: {}
					},
					sniffing: {
						enabled: true,
						destOverride: ['http', 'tls', 'quic', 'fakedns']
					}
				}
			]
		},
		null,
		2
	);
	$: outbound_code = JSON.stringify(
		{
			outbounds: [
				{
					tag: 'DIRECT',
					protocol: 'freedom'
				},
				{
					tag: 'BLOCKED',
					protocol: 'blackhole'
				},
				{
					tag: `${name}_OUT_VMESS_TCP_${$formData.tunnel_port}`,
					sendThrough: $formData.upstream_ip,
					protocol: 'vmess',
					settings: {
						vnext: [
							{
								address: $formData.bridge_ip,
								port: $formData.proxy_port,
								users: [
									{
										id: $formData.client_id,
										security: 'auto'
									}
								]
							}
						]
					},
					streamSettings: {
						network: 'tcp',
						security: 'none',
						tcpSettings: {}
					}
				}
			]
		},
		null,
		2
	);
	$: reverse_code = JSON.stringify(
		{
			reverse: {
				portals: [
					{
						tag: `${name}_PORTAL_${randkey}`,
						domain: `${name}_${randkey}.com`
					}
				],
				bridges: [
					{
						tag: `${name}_BRIDGE_${randkey}`,
						domain: `${name}_${randkey}.com`
					}
				]
			}
		},
		null,
		2
	);
	$: routing_code = JSON.stringify(
		{
			routing: {
				domainStrategy: 'AsIs',
				rules: [
					{
						ip: ['geoip:private'],
						outboundTag: 'BLOCKED',
						type: 'field'
					},
					{
						protocol: ['bittorrent'],
						outboundTag: 'BLOCKED',
						type: 'field'
					},
					{
						domain: [`full:${name}_${randkey}.com`],
						inboundTag: [`${name}_VMESS_TCP_${$formData.tunnel_port}`],
						outboundTag: `${name}_PORTAL_${randkey}`,
						type: 'field'
					},
					{
						inboundTag: [`${name}_VLESS_TCP_NONE_${$formData.main_port}`],
						outboundTag: `${name}_PORTAL_${randkey}`,
						type: 'field'
					},
					{
						domain: [`full:${name}_${randkey}.com`],
						inboundTag: [`${name}_BRIDGE_${randkey}`],
						outboundTag: `${name}_OUT_VMESS_TCP_${$formData.tunnel_port}`,
						type: 'field'
					},
					{
						inboundTag: [`${name}_BRIDGE_${randkey}`],
						outboundTag: 'DIRECT',
						type: 'field'
					}
				]
			}
		},
		null,
		2
	);

	$: err = Object.values($errors).filter((e) => e !== undefined && e !== null);
</script>

{#if err && err.length > 0}
	<Alert.Root variant="destructive">
		<AlertCircleIcon />
		<Alert.Title>Unable to process your inputs.</Alert.Title>
		<Alert.Description>
			<ul class="list-inside list-disc text-sm">
				{#each err as value}
					<li>{value}</li>
				{/each}
			</ul>
		</Alert.Description>
	</Alert.Root>
{/if}

<form method="POST" class="grid grid-cols-4 gap-4" use:enhance>
	<Form.Field {form} name="name" class="col-span-2">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Name</Form.Label>
				<Input {...props} bind:value={$formData.name} />
			{/snippet}
		</Form.Control>
	</Form.Field>
	<Form.Field {form} name="tunnel_port" class="col-span-1">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Tunnel Port</Form.Label>
				<Input {...props} type="number" bind:value={$formData.tunnel_port} />
			{/snippet}
		</Form.Control>
	</Form.Field>
	<Form.Field {form} name="main_port" class="col-span-1">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Main Port</Form.Label>
				<Input {...props} type="number" bind:value={$formData.main_port} />
			{/snippet}
		</Form.Control>
	</Form.Field>
	<Form.Field {form} name="upstream_ip" class="col-span-1">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Upstream IP</Form.Label>
				<Input {...props} bind:value={$formData.upstream_ip} />
			{/snippet}
		</Form.Control>
	</Form.Field>
	<Form.Field {form} name="bridge_ip" class="col-span-1">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Bridge IP</Form.Label>
				<Input {...props} bind:value={$formData.bridge_ip} />
			{/snippet}
		</Form.Control>
	</Form.Field>
	<Form.Field {form} name="proxy_port" class="col-span-2">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Proxy Port</Form.Label>
				<div class="flex items-center gap-2">
					{#if $formData.proxy_port_enabled}
						<Input {...props} type="number" bind:value={$formData.proxy_port} />
					{:else}
						<Input {...props} type="text" value={$formData.tunnel_port} disabled />
					{/if}
					<Switch bind:checked={$formData.proxy_port_enabled} />
				</div>
			{/snippet}
		</Form.Control>
	</Form.Field>
	<Form.Field {form} name="client_id" class="col-span-4">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Client ID</Form.Label>
				<div class="flex items-center gap-2">
					<Input {...props} bind:value={$formData.client_id} />
					<Tooltip.Provider delayDuration={0}>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									class="size-8 cursor-pointer"
									variant="outline"
									size="icon"
									onclick={() => {
										navigator.clipboard.writeText($formData.client_id);
										toast.success('UUID copied to clipboard');
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
					<Tooltip.Provider delayDuration={0}>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									class="size-8 cursor-pointer"
									variant="outline"
									size="icon"
									onclick={() => {
										$formData.client_id = uuidv4();
										toast.success('New UUID generated');
									}}
								>
									<RefreshCcwIcon />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>New UUID</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>
			{/snippet}
		</Form.Control>
	</Form.Field>
</form>

<Tabs.Root value="inbound">
	<Tabs.List class="grid w-full grid-cols-4">
		<Tabs.Trigger value="inbound">Inbounds</Tabs.Trigger>
		<Tabs.Trigger value="outbound">Outbounds</Tabs.Trigger>
		<Tabs.Trigger value="reverse">Reverse</Tabs.Trigger>
		<Tabs.Trigger value="routing">Routing Rules</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="inbound">
		<Codeblock code={inbound_code} />
	</Tabs.Content>
	<Tabs.Content value="outbound">
		<Codeblock code={outbound_code} />
	</Tabs.Content>
	<Tabs.Content value="reverse">
		<Codeblock code={reverse_code} />
	</Tabs.Content>
	<Tabs.Content value="routing">
		<Codeblock code={routing_code} />
	</Tabs.Content>
</Tabs.Root>
