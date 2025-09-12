export default async function globalSetup() {
  // Global setup for all tests
  console.log("🧪 Setting up Jest test environment...");

  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.TEST_MODE = "true";

  // Mock any global services that need to be available across all tests
  (global as any).testStartTime = Date.now();

  console.log("✅ Jest test environment setup complete");
}
