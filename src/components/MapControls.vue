<template>
	<div class="map-style-selector">
		<Listbox v-model="internalMode">
			<div class="select-wrapper">
				<ListboxButton class="map-control" aria-label="显示模式">
					<span>{{ modeLabel }}</span>
					<span class="chev">▾</span>
				</ListboxButton>
				<transition
					enter-from-class="map-anim-enter"
					enter-active-class="map-anim-enter-active"
					leave-from-class="map-anim-leave"
					leave-active-class="map-anim-leave-active"
				>
					<ListboxOptions class="map-options">
						<ListboxOption
							v-for="m in modes"
							:key="m.id"
							:value="m.id"
							class="map-option"
						>
							{{ m.name }}
						</ListboxOption>
					</ListboxOptions>
				</transition>
			</div>
		</Listbox>

		<Listbox v-model="internalStyle">
			<div class="select-wrapper">
				<ListboxButton class="map-control" aria-label="地图样式">
					<span>{{ styleLabel }}</span>
					<span class="chev">▾</span>
				</ListboxButton>
				<transition
					enter-from-class="map-anim-enter"
					enter-active-class="map-anim-enter-active"
					leave-from-class="map-anim-leave"
					leave-active-class="map-anim-leave-active"
				>
					<ListboxOptions class="map-options wide">
						<ListboxOption
							v-for="s in styles"
							:key="s.id"
							:value="s.id"
							class="map-option"
						>
							{{ s.name }}
						</ListboxOption>
					</ListboxOptions>
				</transition>
			</div>
		</Listbox>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
const props = defineProps({
	modes: { type: Array as () => Array<any>, default: () => [] },
	styles: { type: Array as () => Array<any>, default: () => [] },
	modelMode: { type: String, default: '' },
	modelStyle: { type: String, default: '' },
	modePlaceholder: { type: String, default: '选择显示模式' },
	stylePlaceholder: { type: String, default: '选择地图样式' },
})

const emit = defineEmits(['update:modelMode', 'update:modelStyle'])

// internal refs used by headlessui Listbox
const internalMode = ref(props.modelMode || '')
const internalStyle = ref(props.modelStyle || '')

watch(() => props.modelMode, (v) => (internalMode.value = v))
watch(() => props.modelStyle, (v) => (internalStyle.value = v))

watch(internalMode, (v) => emit('update:modelMode', v))
watch(internalStyle, (v) => emit('update:modelStyle', v))

const modeLabel = computed(() => {
	if (!internalMode.value) return props.modePlaceholder
	const found = props.modes.find((m: any) => m.id === internalMode.value)
	return found ? found.name : props.modePlaceholder
})

const styleLabel = computed(() => {
	if (!internalStyle.value) return props.stylePlaceholder
	const found = props.styles.find((s: any) => s.id === internalStyle.value)
	return found ? found.name : props.stylePlaceholder
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/_controls' as controls;

/* 说明：使用 `@use` 替代已弃用的 `@import`，Dart Sass 推荐模块化加载。
	直接引入样式文件会保留其全局样式输出，组件中仍然可以通过类名引用。 */

/* small wrappers mapping headless markup to our global classes */
.map-style-selector { position: absolute; top: 10px; left: 10px; display: flex; gap: 8px }
.listbox-button.map-control { @extend .map-control }
.listbox-options.map-options { @extend .map-options }
.listbox-option.map-option { @extend .map-option }
.chev { font-size: 12px }

</style>
