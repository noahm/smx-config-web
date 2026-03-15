import { lazy, Suspense } from "react";

// In production builds, import.meta.env.DEV is statically replaced with `false`
// and import.meta.env.VERCEL_ENV is replaced with the build-time value.
// Rollup dead-code elimination then drops the dynamic import entirely, so the
// mock-controls chunk is never included in the production bundle.
const MockStageControls =
  import.meta.env.DEV || import.meta.env.VERCEL_ENV === "preview" ? lazy(() => import("./mock-controls")) : null;

export function GlobalControls() {
  if (!MockStageControls) return null;
  return (
    <Suspense>
      <MockStageControls />
    </Suspense>
  );
}
