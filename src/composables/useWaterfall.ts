import type { Ref } from 'vue'
import type { WaterfallBreakpoints, WaterfallItemPosition, WaterfallItemSize } from '../types'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

export interface UseWaterfallOptions<T> {
  items: Ref<T[]>
  containerRef: Ref<HTMLElement | null>
  columnWidth?: Ref<number>
  columns?: Ref<number | WaterfallBreakpoints | undefined>
  gap?: Ref<number>
  getItemSize?: (item: T, index: number) => WaterfallItemSize | null
  getItemKey?: (item: T, index: number) => string | number
  ssrPlaceholderHeight?: number
}

// Tailwind default breakpoints
const BREAKPOINTS = {
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
} as const

function getBreakpointColumns(breakpoints: WaterfallBreakpoints, width: number): number {
  // Find the largest breakpoint that's smaller than current width
  let result = breakpoints.default ?? 2

  if (width >= BREAKPOINTS.sm && breakpoints.sm !== undefined)
    result = breakpoints.sm
  if (width >= BREAKPOINTS.md && breakpoints.md !== undefined)
    result = breakpoints.md
  if (width >= BREAKPOINTS.lg && breakpoints.lg !== undefined)
    result = breakpoints.lg
  if (width >= BREAKPOINTS.xl && breakpoints.xl !== undefined)
    result = breakpoints.xl
  if (width >= BREAKPOINTS['2xl'] && breakpoints['2xl'] !== undefined)
    result = breakpoints['2xl']

  return result
}

export function useWaterfall<T>(options: UseWaterfallOptions<T>) {
  const {
    items,
    containerRef,
    columnWidth = ref(250),
    columns = ref(undefined),
    gap = ref(16),
    getItemSize,
    getItemKey = (_item: T, index: number) => index,
    ssrPlaceholderHeight = 200,
  } = options

  // Reactive state
  const containerWidth = ref(0)
  const positions = shallowRef<WaterfallItemPosition[]>([])
  // Use stable keys to track heights (survives reordering/insertion)
  const itemHeights = ref<Map<string | number, number>>(new Map())
  const isClient = ref(false)

  // Calculate column count based on mode
  const columnCount = computed(() => {
    const cols = columns.value
    const width = containerWidth.value

    if (width === 0)
      return 1

    // Fixed columns mode
    if (typeof cols === 'number') {
      return Math.max(1, cols)
    }

    // Breakpoint mode
    if (typeof cols === 'object' && cols !== null) {
      return getBreakpointColumns(cols, width)
    }

    // Auto mode (based on columnWidth)
    const colWidth = columnWidth.value
    const gapValue = gap.value
    const count = Math.floor((width + gapValue) / (colWidth + gapValue))
    return Math.max(1, count)
  })

  // Calculate actual column width
  const actualColumnWidth = computed(() => {
    const count = columnCount.value
    const gapValue = gap.value
    const width = containerWidth.value

    if (width === 0)
      return columnWidth.value

    // (width - (count - 1) * gap) / count
    return (width - (count - 1) * gapValue) / count
  })

  // Calculate container height
  const containerHeight = computed(() => {
    if (positions.value.length === 0)
      return 0

    return Math.max(...positions.value.map(p => p.y + p.height))
  })

  // Calculate positions for all items
  function calculatePositions(): WaterfallItemPosition[] {
    const count = columnCount.value
    const colWidth = actualColumnWidth.value
    const gapValue = gap.value
    const itemList = items.value

    if (count === 0 || itemList.length === 0) {
      return []
    }

    // Track height of each column
    const columnHeights = Array.from({ length: count }, () => 0)
    const result: WaterfallItemPosition[] = []

    for (let i = 0; i < itemList.length; i++) {
      const item = itemList[i]
      const itemKey = getItemKey(item, i)

      // Get item height - priority: measured > getItemSize estimate > placeholder
      let itemHeight: number

      // First, check if we have actual measured height (using stable key)
      const measuredHeight = itemHeights.value.get(itemKey)
      if (measuredHeight !== undefined) {
        itemHeight = measuredHeight
      }
      else if (getItemSize) {
        // Use getItemSize for initial estimate
        const size = getItemSize(item, i)
        if (size && size.width > 0 && size.height > 0) {
          // Calculate height based on aspect ratio
          itemHeight = (size.height / size.width) * colWidth
        }
        else {
          itemHeight = ssrPlaceholderHeight
        }
      }
      else {
        // Fallback to placeholder
        itemHeight = ssrPlaceholderHeight
      }

      // Find shortest column
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights))

      // Calculate position
      const x = shortestColumn * (colWidth + gapValue)
      const y = columnHeights[shortestColumn]

      result.push({
        x,
        y,
        width: colWidth,
        height: itemHeight,
        column: shortestColumn,
      })

      // Update column height
      columnHeights[shortestColumn] = y + itemHeight + gapValue
    }

    return result
  }

  // Update item height (called when image loads)
  // Accepts either index or stable key
  function updateItemHeight(keyOrIndex: string | number, height: number) {
    if (itemHeights.value.get(keyOrIndex) !== height) {
      itemHeights.value.set(keyOrIndex, height)
      recalculate()
    }
  }

  // Force recalculate
  function recalculate() {
    positions.value = calculatePositions()
  }

  // Observe container size
  let resizeObserver: ResizeObserver | null = null

  function setupResizeObserver() {
    if (!containerRef.value || typeof ResizeObserver === 'undefined')
      return

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const newWidth = entry.contentRect.width
        if (newWidth !== containerWidth.value) {
          containerWidth.value = newWidth
        }
      }
    })

    resizeObserver.observe(containerRef.value)

    // Initial width
    containerWidth.value = containerRef.value.offsetWidth
  }

  function cleanupResizeObserver() {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  // Watch for changes and recalculate
  watch(
    [items, columnCount, actualColumnWidth, gap],
    () => {
      recalculate()
    },
    { immediate: true },
  )

  // Watch container width changes
  watch(containerWidth, () => {
    recalculate()
  })

  // Lifecycle
  onMounted(() => {
    isClient.value = true
    setupResizeObserver()
    recalculate()
  })

  onUnmounted(() => {
    cleanupResizeObserver()
  })

  return {
    positions,
    columnCount,
    actualColumnWidth,
    containerHeight,
    containerWidth,
    isClient,
    recalculate,
    updateItemHeight,
  }
}
