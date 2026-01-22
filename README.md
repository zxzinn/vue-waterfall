# @zxzinn/vue-waterfall

[![npm version](https://img.shields.io/npm/v/@zxzinn/vue-waterfall.svg)](https://www.npmjs.com/package/@zxzinn/vue-waterfall)
[![npm downloads](https://img.shields.io/npm/dm/@zxzinn/vue-waterfall.svg)](https://www.npmjs.com/package/@zxzinn/vue-waterfall)
[![license](https://img.shields.io/npm/l/@zxzinn/vue-waterfall.svg)](https://github.com/zxzinn/vue-waterfall/blob/main/LICENSE)

A performant, flexible waterfall/masonry layout component for Vue 3.

## Features

- **Zero dependencies** - Only Vue 3 as peer dependency
- **Performant** - Uses CSS transforms and GPU acceleration
- **Smooth animations** - Items animate smoothly when positions change
- **Flexible** - Multiple layout modes (fixed width, fixed columns, breakpoints)
- **TypeScript** - Full type support with generics
- **SSR Ready** - Works with Nuxt and other SSR frameworks
- **Pre-calculated layouts** - Provide item dimensions to avoid layout shifts

## Installation

```bash
npm install @zxzinn/vue-waterfall
# or
pnpm add @zxzinn/vue-waterfall
# or
yarn add @zxzinn/vue-waterfall
```

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import { Waterfall } from '@zxzinn/vue-waterfall'

interface Item {
  id: number
  title: string
  imageUrl: string
}

const items = ref<Item[]>([
  { id: 1, title: 'Item 1', imageUrl: '...' },
  { id: 2, title: 'Item 2', imageUrl: '...' },
])
</script>

<template>
  <Waterfall :items="items" :column-width="250" :gap="16">
    <template #default="{ item }">
      <div class="card">
        <img :src="item.imageUrl" :alt="item.title">
        <h3>{{ item.title }}</h3>
      </div>
    </template>
  </Waterfall>
</template>
```

### With Pre-calculated Dimensions

If you know the dimensions of your items (e.g., from an API), you can provide them to avoid layout shifts:

```vue
<script setup lang="ts">
interface Artwork {
  id: number
  title: string
  thumbnailUrl: string
  width: number
  height: number
}

const artworks = ref<Artwork[]>([...])

// Provide dimensions for pre-calculation
function getItemSize(item: Artwork) {
  return { width: item.width, height: item.height }
}
</script>

<template>
  <Waterfall
    :items="artworks"
    :column-width="250"
    :gap="16"
    :get-item-size="getItemSize"
    :get-item-key="(item) => item.id"
  >
    <template #default="{ item }">
      <img :src="item.thumbnailUrl" :alt="item.title">
    </template>
  </Waterfall>
</template>
```

### Fixed Columns Mode

```vue
<Waterfall :items="items" :columns="4" :gap="16">
  <!-- ... -->
</Waterfall>
```

### Responsive Breakpoints

```vue
<Waterfall
  :items="items"
  :columns="{ default: 2, sm: 3, md: 4, lg: 5, xl: 6 }"
  :gap="16"
>
  <!-- ... -->
</Waterfall>
```

Breakpoints follow Tailwind CSS defaults:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Props

| Prop                   | Type                    | Default  | Description                             |
| ---------------------- | ----------------------- | -------- | --------------------------------------- |
| `items`                | `T[]`                   | Required | Array of items to render                |
| `columnWidth`          | `number`                | `250`    | Minimum column width in pixels          |
| `columns`              | `number \| Breakpoints` | -        | Fixed column count or breakpoint config |
| `gap`                  | `number`                | `16`     | Gap between items in pixels             |
| `getItemSize`          | `(item, index) => Size` | -        | Function to get item dimensions         |
| `getItemKey`           | `(item, index) => string \| number` | `index`  | Unique key getter (important for animations) |
| `animate`              | `boolean`               | `true`   | Enable transition animations            |
| `animationDuration`    | `number`                | `300`    | Transition duration in ms               |
| `ssrPlaceholderHeight` | `number`                | `200`    | Placeholder height for SSR              |

## Slot Props

The default slot receives:

| Prop          | Type       | Description                                           |
| ------------- | ---------- | ----------------------------------------------------- |
| `item`        | `T`        | The current item                                      |
| `index`       | `number`   | Item index                                            |
| `position`    | `Position` | Calculated position `{ x, y, width, height, column }` |
| `columnWidth` | `number`   | Actual column width                                   |

## Exposed Methods

```vue
<script setup>
const waterfallRef = ref()

// Force recalculate layout
waterfallRef.value?.recalculate()

// Get current column count
const columns = waterfallRef.value?.getColumnCount()

// Get container height
const height = waterfallRef.value?.getContainerHeight()
</script>

<template>
  <Waterfall ref="waterfallRef" :items="items">
    <!-- ... -->
  </Waterfall>
</template>
```

## Composable

For advanced use cases, you can use the `useWaterfall` composable directly:

```vue
<script setup>
import { useWaterfall } from '@zxzinn/vue-waterfall'

const containerRef = ref(null)
const items = ref([...])

const {
  positions,
  columnCount,
  actualColumnWidth,
  containerHeight,
  recalculate,
} = useWaterfall({
  items,
  containerRef,
  columnWidth: ref(250),
  gap: ref(16),
  getItemKey: (item) => item.id,
})
</script>
```

## Contributing

Contributions are welcome! Feel free to open an issue or submit a PR.

## License

[MIT](./LICENSE)
