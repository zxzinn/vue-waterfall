export interface WaterfallItemSize {
  width: number
  height: number
}

export interface WaterfallItemPosition {
  x: number
  y: number
  width: number
  height: number
  column: number
}

export interface WaterfallBreakpoints {
  'default'?: number
  'sm'?: number
  'md'?: number
  'lg'?: number
  'xl'?: number
  '2xl'?: number
}

export interface WaterfallProps<T = unknown> {
  /**
   * Array of items to render
   */
  items: T[]

  /**
   * Minimum column width in pixels (auto-calculates column count)
   * @default 250
   */
  columnWidth?: number

  /**
   * Fixed number of columns (overrides columnWidth)
   * Can be a number or breakpoint object
   */
  columns?: number | WaterfallBreakpoints

  /**
   * Gap between items in pixels
   * @default 16
   */
  gap?: number

  /**
   * Function to get item dimensions for pre-calculation
   * If not provided, dimensions are calculated after image load
   */
  getItemSize?: (item: T, index: number) => WaterfallItemSize | null

  /**
   * Unique key getter for each item
   * @default (item, index) => index
   */
  getItemKey?: (item: T, index: number) => string | number

  /**
   * Enable smooth transition animations
   * @default true
   */
  animate?: boolean

  /**
   * Transition duration in milliseconds
   * @default 300
   */
  animationDuration?: number

  /**
   * SSR placeholder height when dimensions are unknown
   * @default 200
   */
  ssrPlaceholderHeight?: number
}

export interface WaterfallSlotProps<T = unknown> {
  item: T
  index: number
  position: WaterfallItemPosition
  columnWidth: number
}

export interface WaterfallExpose {
  /**
   * Force recalculate all positions
   */
  recalculate: () => void

  /**
   * Get current column count
   */
  getColumnCount: () => number

  /**
   * Get total container height
   */
  getContainerHeight: () => number
}
