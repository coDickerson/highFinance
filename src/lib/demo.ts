/** True when the app is running as the public demo (fake data, no real secrets). */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "1";
}
