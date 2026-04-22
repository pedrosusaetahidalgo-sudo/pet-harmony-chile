import React from 'react';

// Helper corto para crear elementos sin JSX transform.
// Uso:
//   h('div', { style: {...} }, child1, child2)
// o:
//   h('div', { style: {...} }, [child1, child2])
export const h = (type, props, ...children) => {
  const flat = children.flat().filter((c) => c !== null && c !== undefined && c !== false);
  return React.createElement(type, props, ...flat);
};
