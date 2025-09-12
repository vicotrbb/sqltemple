export default async function globalTeardown() {
  console.log("🧹 Cleaning up Jest test environment...");

  if ((global as any).testStartTime) {
    const testDuration = Date.now() - (global as any).testStartTime;
    console.log(`⏱️  Total test duration: ${testDuration}ms`);
  }

  console.log("✅ Jest test environment cleanup complete");
}
