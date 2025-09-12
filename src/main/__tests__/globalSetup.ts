export default async function globalSetup() {
  console.log("🧪 Setting up Jest test environment...");

  process.env.NODE_ENV = "test";
  process.env.TEST_MODE = "true";

  (global as any).testStartTime = Date.now();

  console.log("✅ Jest test environment setup complete");
}
