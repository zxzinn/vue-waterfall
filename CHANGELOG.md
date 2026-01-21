# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-22

### Added

- Initial release
- `Waterfall` component with Vue 3 support
- `useWaterfall` composable for custom implementations
- Multiple layout modes:
  - Auto columns based on `columnWidth`
  - Fixed `columns` count
  - Responsive breakpoints (Tailwind CSS defaults)
- Pre-calculated dimensions support via `getItemSize` prop
- SSR support with placeholder heights
- Smooth transition animations (configurable)
- Full TypeScript support with generics
- ResizeObserver-based responsive layout
- Zero runtime dependencies (Vue 3 peer dependency only)
