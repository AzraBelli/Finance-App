import { forwardRef, type ReactElement } from "react";

/**
 * shadcn/ui components are generated for React 19 (ref is a plain prop). React 18 does not pass refs
 * to function components, but Radix `asChild` / Presence and react-hook-form `register` need them.
 * This wrapper puts the ref back into props; call-site types stay the same.
 */
export function withRef<P extends object>(Component: (props: P) => ReactElement | null) {
  const Wrapped = forwardRef<unknown, P>((props, ref) => Component({ ...props, ref } as P));
  Wrapped.displayName = Component.name.replace(/Impl$/, "");
  return Wrapped as unknown as (props: P) => ReactElement | null;
}
