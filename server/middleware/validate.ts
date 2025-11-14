// Deprecated middleware kept for backward compatibility.
// No longer used but retained to avoid breaking imports during refactors.
export function validate() {
  throw new Error('validate middleware has been removed. Use controller-level validation instead.');
}
