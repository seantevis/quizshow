import { list, del } from "@vercel/blob"

async function clearBlobData() {
  console.log("Clearing blob storage data...")
  
  try {
    const { blobs } = await list({ prefix: "game-data/" })
    
    if (blobs.length === 0) {
      console.log("No game data found in blob storage.")
      return
    }
    
    console.log(`Found ${blobs.length} blob(s) to delete:`)
    
    for (const blob of blobs) {
      console.log(`  Deleting: ${blob.pathname}`)
      await del(blob.url)
    }
    
    console.log("All game data cleared successfully!")
    console.log("The app will now use the default 5 categories.")
  } catch (error) {
    console.error("Error clearing blob data:", error)
  }
}

clearBlobData()
