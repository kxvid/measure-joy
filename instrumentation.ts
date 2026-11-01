// Private startup telemetry verifies the managed runtime without exposing a
// public diagnostic route. Staged releases fail closed on an unpatched runtime.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const [major, minor, patch] = process.versions.node.split(".").map(Number);
  const minimum = major === 22 ? [23, 4] : major === 24 ? [22, 1] : major === 26 ? [12, 1] : null;
  const patched = minimum && (minor > minimum[0] || (minor === minimum[0] && patch >= minimum[1]));
  console.info(`[Runtime security] Node ${process.version}; patched=${Boolean(patched)}`);
  if (!patched) throw new Error("Node runtime does not meet the October 2026 security baseline.");
}
