import { kv } from "@vercel/kv"

async function testKV() {
  console.log("Testing KV connection...")
  
  // Test 1: Write a simple value
  console.log("\n1. Writing test value...")
  await kv.set("test-key", { message: "Hello from KV test!", timestamp: Date.now() })
  console.log("   Write successful!")
  
  // Test 2: Read the value back
  console.log("\n2. Reading test value...")
  const result = await kv.get<{ message: string; timestamp: number }>("test-key")
  console.log("   Read result:", result)
  
  // Test 3: Check if categories exist
  console.log("\n3. Checking for existing categories...")
  const categories = await kv.get("custom-categories")
  if (categories) {
    console.log("   Categories found! Count:", Array.isArray(categories) ? categories.length : "not an array")
  } else {
    console.log("   No categories found in KV")
  }
  
  // Test 4: Check if final jeopardy exists
  console.log("\n4. Checking for Final Jeopardy...")
  const finalJeopardy = await kv.get("final-jeopardy")
  if (finalJeopardy) {
    console.log("   Final Jeopardy found!")
  } else {
    console.log("   No Final Jeopardy found in KV")
  }
  
  // Test 5: Clean up test key
  console.log("\n5. Cleaning up test key...")
  await kv.del("test-key")
  console.log("   Test key deleted!")
  
  console.log("\n✓ All KV tests completed successfully!")
}

testKV().catch((error) => {
  console.error("KV Test failed:", error)
  process.exit(1)
})
