import { defineComponent, Component, defineAsyncComponent, h } from 'vue'

const layouts:{ [name:string]:ReturnType<typeof defineAsyncComponent> } = Object.entries(import.meta.glob('../layouts/**.vue')).reduce((layouts, [file_name, layout]) => ({
  [file_name.match(/^\.\.\/layouts\/(.*)\.vue$/)![1].toLocaleLowerCase() ]: defineAsyncComponent(layout),
  ...layouts
}), {})

export default defineComponent({
	name: 'Layout',
	props: {
		name: {
			type: [String, Boolean],
			default: 'default'
		}
	},
  setup(props, { slots }) {
    return () => {
			const layout = props.name == true ? 'default' : props.name
			if ( layout == false || (typeof layout == 'string' && !layouts[layout] && slots) ) {
				return slots.default ? slots.default() : h('div', props, slots)
			}

			return h(layouts[layout], null, slots)
		}
	}
})