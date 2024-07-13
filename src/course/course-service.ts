import { google } from "googleapis";
import fetch from "node-fetch";
import { Course } from "./course-types";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`;

const sheetId = process.env.NEXT_GOOGLE_SHEET_ID as string;
const range = "A4:O";

console.log(sheetId);

export async function sheetData(semester: string, courseAbbr: string) {
  try {
    const glAuth = await google.auth.getClient({
      projectId: "schedulai-427704",
      credentials: {
        type: "service_account",
        project_id: "schedulai-427704",
        private_key_id: process.env.NEXT_GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.NEXT_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email:
          "schedulai-service@schedulai-427704.iam.gserviceaccount.com",
        universe_domain: "googleapis.com",
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const glSheets = google.sheets({ version: "v4", auth: glAuth });

    const tabName = semester;

    const data = await glSheets.spreadsheets.values.get({
      spreadsheetId: sheetId, // Ensure spreadsheetId is correctly set here
      range: `${tabName}!${range}`,
    });

    // Handle response data as needed
    if (!data.data.values) {
      return [];
    }

    const [headerRow, ...rows] = data.data.values;

    const courses: Course[] = rows
      .filter((row) => row[2] === courseAbbr) // Adjusted to filter by course abbreviation
      .map((row) => {
        return {
          school: row[0],
          level: row[1],
          abbreviation: row[2],
          type: row[3],
          title: row[4],
          credits: row[6],
          days: row[9],
          times: row[10],
          enrolled: row[11],
          capacity: row[12],
          faculty: row[13],
          room: row[14],
        } as Course;
      });

    return courses;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function fetchGeminiResponse(prompt: string) {
  try {
    const response = await fetch(
      `${GEMINI_API_ENDPOINT}?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Gemini response: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    throw error;
  }
}