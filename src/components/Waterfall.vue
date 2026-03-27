<script setup lang="ts" generic="T">
import type { WaterfallBreakpoints, WaterfallExpose, WaterfallItemPosition, WaterfallItemSize } from '../types'
import { computed, onUnmounted, ref, toRef, watch } from 'vue'
import { useWaterfall } from '../composables/useWaterfall'

const props = withDefaults(defineProps<{
  /**
   * Array of items to render
   */
  items: T[]

  /**
   * Minimum column width in pixels (auto-calculates column count)
   */
  columnWidth?: number

  /**
   * Fixed number of columns (overrides columnWidth)
   * Can be a number or breakpoint object
   */
  columns?: number | WaterfallBreakpoints

  /**
   * Gap between items in pixels
   */
  gap?: number

  /**
   * Function to get item dimensions for pre-calculation
   */
  getItemSize?: (item: T, index: number) => WaterfallItemSize | null

  /**
   * Unique key getter for each item
   */
  getItemKey?: (item: T, index: number) => string | number

  /**
   * Enable smooth transition animations
   */
  animate?: boolean

  /**
   * Transition duration in milliseconds
   */
  animationDuration?: number

  /**
   * SSR placeholder height when dimensions are unknown
   */
  ssrPlaceholderHeight?: number

  /**
   * Enable virtual scrolling - only render items in/near the viewport
   */
  virtual?: boolean

  /**
   * Buffer in pixels above and below the viewport for virtual scrolling
   */
  virtualBuffer?: number
}>(), {
  columnWidth: 250,
  columns: undefined,
  gap: 16,
  getItemSize: undefined,
  getItemKey: (_item: T, index: number) => index,
  animate: true,
  animationDuration: 300,
  ssrPlaceholderHeight: 200,
  virtual: false,
  virtualBuffer: 500,
})

defineSlots<{
  default: (props: {
    item: T
    index: number
    position: WaterfallItemPosition
    columnWidth: number
  }) => unknown
}>()

const containerRef = ref<HTMLElement | null>(null)

const {
  positions,
  visibleItems,
  columnCount,
  actualColumnWidth,
  containerHeight,
  recalculate,
  updateItemHeight,
  isClient,
} = useWaterfall({
  items: toRef(() => props.items),
  containerRef,
  columnWidth: toRef(() => props.columnWidth),
  columns: toRef(() => props.columns),
  gap: toRef(() => props.gap),
  getItemSize: props.getItemSize,
  getItemKey: props.getItemKey,
  ssrPlaceholderHeight: props.ssrPlaceholderHeight,
  virtual: toRef(() => props.virtual),
  virtualBuffer: toRef(() => props.virtualBuffer),
})

// Generate item style - use transform for GPU-accelerated animations
function getItemStyle(position: WaterfallItemPosition) {
  const baseStyle: Record<string, string> = {
    position: 'absolute',
    left: '0',
    top: '0',
    width: `${position.width}px`,
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
  }

  if (props.animate && isClient.value) {
    baseStyle.transition = `transform ${props.animationDuration}ms ease-out, opacity ${props.animationDuration}ms ease-out`
    baseStyle.willChange = 'transform'
  }

  return baseStyle
}

// Container style
const containerStyle = computed(() => ({
  position: 'relative' as const,
  width: '100%',
  height: `${containerHeight.value}px`,
}))

// Track observers for cleanup (keyed by item key for stability)
const itemObservers = new Map<string | number, ResizeObserver>()

// Handle item mounted - always measure actual height for accuracy
function handleItemMounted(item: T, index: number, el: HTMLElement | null) {
  if (!el)
    return

  const itemKey = props.getItemKey(item, index)

  // Cleanup previous observer if exists
  const existingObserver = itemObservers.get(itemKey)
  if (existingObserver) {
    existingObserver.disconnect()
  }

  // Use ResizeObserver for accurate measurement
  const observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (entry) {
      updateItemHeight(itemKey, entry.contentRect.height)
    }
  })

  observer.observe(el)
  itemObservers.set(itemKey, observer)
}

// Cleanup stale observers when visible items change (virtual mode)
function cleanupStaleObservers() {
  if (!props.virtual)
    return
  const visibleKeys = new Set(visibleItems.value.map(v => props.getItemKey(v.item, v.index)))
  for (const [key, observer] of itemObservers) {
    if (!visibleKeys.has(key)) {
      observer.disconnect()
      itemObservers.delete(key)
    }
  }
}

watch(visibleItems, () => {
  cleanupStaleObservers()
})

// Cleanup observers on unmount
onUnmounted(() => {
  itemObservers.forEach(observer => observer.disconnect())
  itemObservers.clear()
})

// Expose methods
defineExpose<WaterfallExpose>({
  recalculate,
  getColumnCount: () => columnCount.value,
  getContainerHeight: () => containerHeight.value,
})
</script>

<template>
  <div
    ref="containerRef"
    class="waterfall-container"
    :style="containerStyle"
  >
    <div
      v-for="{ item, index, position } in visibleItems"
      :key="getItemKey(item, index)"
      :ref="(el) => handleItemMounted(item, index, el as HTMLElement)"
      class="waterfall-item"
      :style="getItemStyle(position)"
    >
      <slot
        :item="item"
        :index="index"
        :position="position"
        :column-width="actualColumnWidth"
      />
    </div>
  </div>
</template>

<style>
.waterfall-container {
  box-sizing: border-box;
}

.waterfall-item {
  box-sizing: border-box;
}
</style>
