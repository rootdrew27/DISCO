import * as React from "react";
import clsx from "clsx";

/**
 * Merges multiple props objects together. Event handlers are chained,
 * classNames are combined, and ids are deduplicated - different ids
 * will trigger a side-effect and re-render components hooked up with `useId`.
 * For all other props, the last prop object overrides all previous ones.
 * @param args - Multiple sets of props to merge together.
 * @internal
 */
export function mergePropsReactAria<T extends Props[]>(
  ...args: T
): UnionToIntersection<TupleTypes<T>> {
  // Start with a base clone of the first argument. This is a lot faster than starting
  // with an empty object and adding properties as we go.
  const result: Props = { ...args[0] };
  for (let i = 1; i < args.length; i++) {
    const props = args[i];
    for (const key in props) {
      const a = result[key];
      const b = props[key];

      // Chain events
      if (
        typeof a === "function" &&
        typeof b === "function" &&
        // This is a lot faster than a regex.
        key[0] === "o" &&
        key[1] === "n" &&
        key.charCodeAt(2) >= /* 'A' */ 65 &&
        key.charCodeAt(2) <= /* 'Z' */ 90
      ) {
        result[key] = chain(a, b);

        // Merge classnames, sometimes classNames are empty string which eval to false, so we just need to do a type check
      } else if (
        (key === "className" || key === "UNSAFE_className") &&
        typeof a === "string" &&
        typeof b === "string"
      ) {
        result[key] = clsx(a, b);
      } else {
        result[key] = b !== undefined ? b : a;
      }
    }
  }

  return result as UnionToIntersection<TupleTypes<T>>;
}

/** @internal */
export function isProp<
  U extends HTMLElement,
  T extends React.HTMLAttributes<U>,
>(prop: T | undefined): prop is T {
  return prop !== undefined;
}

/** @internal */
export function mergeProps<
  U extends HTMLElement,
  T extends Array<React.HTMLAttributes<U> | undefined>,
>(...props: T) {
  return mergePropsReactAria(...props.filter(isProp));
}
