<script lang="ts">
	// Libraries - shadcn
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';

	// Libraries - lucide
	import CirclePlus from 'lucide-svelte/icons/circle-plus';

	// Types
	import type { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
	import type {
		FilterObject,
		JSONObject,
		NumberOpType,
		StringOpType
	} from '$lib/types/types.svelte';

	// Utilities
	import { cap, getLowCMSTypeByConfig } from '$lib/utilities/utilities.svelte';

	// Constants and locales
	import * as m from '$lib/paraglide/messages.js';
	import {} from '$lib/constants/constants.svelte';
	import { updateFilterObject, findFieldInfoInQuery } from '$lib/utilities/filter.svelte';
	import StringFilter from './filter/string-filter.svelte';
	import Hr from '../hr.svelte';
	import NumberFilter from './filter/number-filter.svelte';
	import BooleanFilter from './filter/boolean-filter.svelte';
	import TypeLabel from '../label/type-label.svelte';
	import EnumFilter from './filter/enum-filter.svelte';

	interface Props {
		filterObject: FilterObject;
		field: string;
		config: JSONSchema7;
	}
	let { filterObject = $bindable(), field, config }: Props = $props();
	let fieldOps = $derived(findFieldInfoInQuery(filterObject, field, 'in'));

	// '$eq' | '$ne' | '$regex' - String
	let [stringOpType, stringOpValue] = $derived.by<[StringOpType | undefined, string | undefined]>(
		() => {
			if (!fieldOps?.fieldValues) {
				return [undefined, undefined];
			}
			for (let i = 0; i < fieldOps.fieldValues.length; i++) {
				const fieldOp = Object.values(fieldOps.fieldValues[i])[0] as JSONObject;
				const stringOpType = Object.keys(fieldOp)[0];
				if (['$eq', '$ne'].includes(stringOpType)) {
					return [stringOpType as StringOpType, fieldOp[stringOpType] as string];
				} else if (['$regex', '__rawRegexValue____'].includes(stringOpType)) {
					return ['$regex', fieldOp.____rawRegexValue____ as string];
				}
			}
			return [undefined, undefined];
		}
	);

	// '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte' - Number
	let [numberOpType, numberOpValue] = $derived.by<[NumberOpType | undefined, number | undefined]>(
		() => {
			if (!fieldOps?.fieldValues) {
				return [undefined, undefined];
			}
			for (let i = 0; i < fieldOps.fieldValues.length; i++) {
				const fieldOp = Object.values(fieldOps.fieldValues[i])[0] as JSONObject;
				const numberOpValue = Object.keys(fieldOp)[0];
				if (['$eq', '$ne', '$gt', '$gte', '$lt', '$lte'].includes(numberOpValue)) {
					return [numberOpValue as NumberOpType, fieldOp[numberOpValue] as number];
				}
			}
			return [undefined, undefined];
		}
	);

	// '$eq' - Boolean
	let booleanOpValue = $derived.by<string | undefined>(() => {
		if (!fieldOps?.fieldValues) {
			return undefined;
		}
		for (let i = 0; i < fieldOps.fieldValues.length; i++) {
			const fieldOp = Object.values(fieldOps.fieldValues[i])[0] as JSONObject;
			const booleanOpValue = Object.keys(fieldOp)[0];
			if (['$eq'].includes(booleanOpValue)) {
				return fieldOp[booleanOpValue] ? 'true' : 'false';
			}
		}
		return undefined;
	});

	// $in - String / Array of Strings
	let { type, items } = $derived(config) as {
		type: JSONSchema7TypeName;
		items: JSONSchema7;
	};

	let isOpen = $state(false);
</script>

<Popover.Root
	portal={null}
	bind:open={isOpen}
	onOpenChange={(value) => {
		console.log({ value });
	}}
>
	<Popover.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			class={`lc-badge-${type} inline-block h-4 rounded-xl px-2 py-0 text-xs text-white hover:bg-primary/20`}
			style="width: content-fit;"
		>
			<TypeLabel {config} />
		</Button>
	</Popover.Trigger>
	<Popover.Content
		class={`border-3 max-h-[480px] ${!['number'].includes(type) ? 'overflow-scroll' : ''}`}
	>
		{#if type === 'string'}
			<StringFilter
				opType={stringOpType}
				opValue={stringOpValue}
				onSearch={(stringOpType, stringOpValue) => {
					console.log({ stringOpType, stringOpValue });
					isOpen = false;
					updateFilterObject(filterObject, field, config, { [stringOpType]: stringOpValue });
				}}
			/>
			{#if Boolean(config.enum)}
				<Hr class="mb-2" />
			{/if}
		{/if}
		{#if (type === 'string' && Boolean(config.enum)) || (type === 'array' && items.type === 'string')}
			<EnumFilter
				keywordObj={config}
				onUpdateEnumFilter={(enums) => {
					console.log({
						filterObject: $state.snapshot(filterObject),
						field: $state.snapshot(field),
						config: $state.snapshot(config),
						op: { $in: $state.snapshot(enums) }
					});
					updateFilterObject(filterObject, field, config, { $in: enums });
				}}
				enums={fieldOps?.opValue}
			/>
		{/if}
		{#if ['number', 'integer'].includes(type)}
			<NumberFilter
				opType={numberOpType}
				opValue={numberOpValue}
				onSearch={(numberOpType, numberOpValue) => {
					console.log({ numberOpType, numberOpValue });
					isOpen = false;
					updateFilterObject(filterObject, field, config, { [numberOpType]: numberOpValue });
				}}
			/>
		{/if}
		{#if ['boolean'].includes(type)}
			<BooleanFilter
				opValue={booleanOpValue}
				onToggle={(value) => {
					console.log({ value });
					isOpen = false;
					updateFilterObject(filterObject, field, config, {
						$eq: value === 'true' ? true : value === 'false' ? false : undefined
					});
				}}
			/>
		{/if}
		{#if ['array-of-objects', 'object'].includes(getLowCMSTypeByConfig(config))}
			<!-- TODO locales -->
			Coming soon!
			<li>Search by "object"</li>
			<li>Search by "array of objects"</li>
		{/if}
	</Popover.Content>
</Popover.Root>
