<script setup lang="ts">
	import { onUnmounted, provide, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import Layout from './Layout'
  import { AfterPageEnterFn, BeforePageEnterFn, PageAPI, PageEnterFn, PageSymbol } from './page-api'

  const beforePageEnters = new Set<BeforePageEnterFn>()
  const pageEnters = new Set<PageEnterFn>()
  const afterPageEnters = new Set<AfterPageEnterFn>()

  const api:PageAPI = {
    isLandingPage: ref(true),
    isEntering: ref(false),
    onBeforePageEnter(fn) {
      beforePageEnters.add(fn)
      onUnmounted(() => beforePageEnters.delete(fn))
    },
    onPageEnter(fn) {
      pageEnters.add(fn)
      onUnmounted(() => pageEnters.delete(fn))
    },
    onAfterPageEnter(fn) {
      afterPageEnters.add(fn)
      onUnmounted(() => afterPageEnters.delete(fn))
    }
  }

  provide(PageSymbol, api)

	const { beforeEach } = useRouter()
	beforeEach(() => {
		api.isLandingPage.value = false
	})

	const props = defineProps<{
		layout?:string
	}>()

  function handleBeforeEnter(...args:any) {
    api.isEntering.value = true
    beforePageEnters.forEach(fn => fn.apply(null, args))
  }

  function handleEnter(...args:any) {
    pageEnters.forEach(fn => fn.apply(null, args))
  }

  function handleAfterEnter(...args:any) {
    api.isEntering.value = false
    afterPageEnters.forEach(fn => fn.apply(null, args))
  }
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Layout v-if="Component" :name="layout || (typeof Component.type != 'string' && (Component.type as any).layout)">
      <Transition name="page" mode="out-in" @beforeEnter="handleBeforeEnter" @enter="handleEnter" @afterEnter="handleAfterEnter">
        <Suspense>
          <Component :is="Component" />
        </Suspense>
      </Transition>
    </Layout>
  </RouterView>
</template>
