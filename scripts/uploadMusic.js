import { Client, Storage, Databases, ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ENDPOINT = "https://fra.cloud.appwrite.io/v1";

const PROJECT_ID = "69d8318f0017a3e1596b"; 
const DATABASE_ID = "69d832fc0035a264b35b";     
const COLLECTION_ID = "posts"; // (table id)
const BUCKET_ID = "69d83a2c003c2cad7941";

const API_KEY = "standard_28768333734ff2491fc041e7495486629a5a6aa5cc86cfbb07e289a52e1267b1a17bb33aed31384f3295b6f0866cc6a46080bc1bd6eb332a7b7c876ed343cdeb60d3cdfb655c9083fefb1385aa67edca74955ad0049a39ccf27ff8d3e603d80c7cc1eb5aee5fda7612a57db8b462376d32907295c9e3b3d130f409c4e7542e40"; // 🔥 paste this

// 📁 music folder (resolved relative to this script)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MUSIC_FOLDER = path.resolve(__dirname, "../music");

// 🔧 Appwrite client
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const storage = new Storage(client);
const databases = new Databases(client);

// 🧠 format file name → title
const formatTitle = (file) =>
  file.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

// 🚀 MAIN FUNCTION
const uploadAll = async () => {
  try {
    const files = fs.readdirSync(MUSIC_FOLDER);

    if (!files.length) {
      console.log(" ❌ No files found in music folder ");
      return;
    }

    for (const file of files) {
      try {
        const filePath = path.resolve(MUSIC_FOLDER, file);

        if (!fs.existsSync(filePath)) {
          console.log(" ❌ File not found: ", filePath);
          continue;
        }

        console.log(" ⬆️ Uploading: ", file);

        // ✅ Upload audio file
        const uploaded = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          InputFile.fromPath(filePath, file)
        );

        const title = formatTitle(file);
        const slug = title.toLowerCase().replaceAll(" ", "-");

        // ✅ Create DB entry
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          {
            title,
            content: "🎧 Auto uploaded music",
            slug,
            audioId: uploaded.$id,
            featuredImg: null,
            authorName: "System",
            authorID: "system",
            isSystem: true,
            isPublished: true,
            likeCount: 0,
            commentCount: 0
          }
        );

        console.log(" ✅ Done: ", file);
      } catch (err) {
        console.log(" ❌ Error with ", file, ":", err.message);
      }
    }

    console.log(" 🎉 All uploads complete! ");
  } catch (err) {
    console.log(" ❌ Script failed: ", err.message);
  }
};

// ▶️ Run script
uploadAll();