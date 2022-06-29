<script setup lang="ts">
	const props = defineProps<{
		msg:string
	}>()
</script>

<template>
	<div>Hello {{ msg }}!</div>
</template>