// import { NextApiRequest, NextApiResponse } from "next";
// import {
//   sheetData,
//   fetchGeminiResponse,
// } from "../../../course/course-service";
// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method === "POST") {
//     try {
//       const { semester, courseAbbr } = req.body;

//       // Validate and process the request
//       if (!semester || !courseAbbr) {
//         return res.status(400).json({
//           error: "Missing required parameters: semester or courseAbbr",
//         });
//       }

//       // Get courses data from Google Sheets
//       const courses = await sheetData(semester, courseAbbr);

//       // Handle if no courses are found
//       if (courses?.length === 0) {
//         return res.status(404).json({ message: "No courses found" });
//       }

//       // Construct initial prompt for Gemini API
//       const initialPrompt = `You are a friendly schedule assistant that helps students register for courses using the university's Public Course Catalog. Your job is to get the user's intended course list of distinct section types and list them.`;

//       // Fetch response from Gemini API
//       const geminiResponse = await fetchGeminiResponse(initialPrompt);

//       // Handle Gemini API response as needed
//       // For example, log or process the generated content
//       console.log("Gemini API Response:", geminiResponse);

//       // Return response to client
//       res.status(200).json({ courses, geminiResponse });
//     } catch (error: unknown) {
//       if (error instanceof Error) {
//         res.status(500).json({ error: error.message });
//       } else {
//         res.status(500).json({ error: "An unknown error occurred" });
//       }
//     }
//   } else if (req.method === "GET") {
//     try {
//       const { semester, courseAbbr } = req.query;

//       // Validate query parameters
//       if (!semester || !courseAbbr) {
//         return res.status(400).json({
//           error: "Missing required parameters: semester or courseAbbr",
//         });
//       }

//       // Get courses data from Google Sheets
//       const courses = await sheetData(semester.toString(), courseAbbr.toString());

//       // Handle if no courses are found
//       if (!courses || courses.length === 0) {
//         return res.status(404).json({ message: "No courses found" });
//       }

//       res.status(200).json({ courses });
//     } catch (error) {
//       console.error('Error fetching courses:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   } else {
//     res.setHeader("Allow", ["POST", "GET"]);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }
