import { inject, Ref } from 'vue'

export const PageSymbol = Symbol('Page')

export type BeforePageEnterFn = (el)=>void
export type PageEnterFn = (el, done)=>void
export type AfterPageEnterFn = (el)=>void

export interface PageAPI {
  isLandingPage:Ref<boolean>
  isEntering:Ref<boolean>
  onBeforePageEnter(fn:BeforePageEnterFn):void
  onPageEnter(fn:PageEnterFn):void
  onAfterPageEnter(fn:AfterPageEnterFn):void
}

export function usePage() {
  const page = inject<PageAPI>(PageSymbol)
  if (!page) throw new Error('Could not inject page.')
  return page
}