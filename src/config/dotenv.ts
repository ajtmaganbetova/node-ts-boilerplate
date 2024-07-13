import dotenv from "dotenv";
import path from "path";

// Set the path to the .env file based on your project structure
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Optionally, you can check for errors when loading the .env file
const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  throw dotenvResult.error;
}
