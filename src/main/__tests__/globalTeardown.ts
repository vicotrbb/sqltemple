export default async function globalTeardown() {
  // Global cleanup after all tests
  console.log("🧹 Cleaning up Jest test environment...");

  // Clean up any global test state
  if ((global as any).testStartTime) {
    const testDuration = Date.now() - (global as any).testStartTime;
    console.log(`⏱️  Total test duration: ${testDuration}ms`);
  }

  // Close any remaining connections, cleanup temp files, etc.
  console.log("✅ Jest test environment cleanup complete");
}
