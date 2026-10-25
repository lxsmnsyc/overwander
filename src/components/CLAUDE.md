# UI

Solid with [terracotta](https://github.com/lxsmnsyc/terracotta) headless primitives; build controls on those rather than hand-rolled elements. Canvas is for the overworld and battle scenes only, and interface sprites are drawn as CSS background-images in the DOM. A component that calls `createResource` must not read it: the read belongs in a child under `Suspense`. Several skills cover dialogs, paging, resources and component layout in detail.
