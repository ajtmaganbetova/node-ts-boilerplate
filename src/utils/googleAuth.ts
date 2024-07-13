import { google } from "googleapis";

export function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.NEXT_GOOGLE_CLIENT_EMAIL,
      private_key: process.env.NEXT_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    projectId: process.env.NEXT_GOOGLE_PROJECT_ID,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}
