export const appState = $state<{
	name: string;
	isSubSection: boolean;
	breadcrumbItems: { name: string; path: string }[];
	showsAside: boolean;
}>({
	name: '',
	isSubSection: false,
	breadcrumbItems: [],
	showsAside: true
});
