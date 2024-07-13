// src/controllers/courseController.ts
import { Request, Response } from "express";
import { sheetData, fetchGeminiResponse } from "./course-service";

export async function handleCourseRequest(req: Request, res: Response) {
  try {
    const { courseAbbr, semester } = req.body;

    const courses = await sheetData(semester, courseAbbr);

    if (courses.length === 0) {
      return res.status(404).json({ message: "No courses found" });
    }

    const initialPrompt = `You are a friendly schedule assistant that helps students register for courses using the particular university's Public Course Catalog. Your job is to get the user's intended course's list of distinct section types and list them. Do not consider numbers that come before section types. Here are list of all possible section types: 
'L': 'Lecture',
'R': 'Recitation',
'S': 'Seminar',
'PLb': 'PhysLab',
'CLb': 'CompLab',
'Lb': 'Lab',
'Int': 'Internship' 
For the course ${courses
      ?.map((course) => course.abbreviation)
      .join(", ")} with sections ${courses
      ?.map((course) => course.type)
      .join(
        ", "
      )}, generate a list of distinct section types that exist in a particular course based on the following data: ${JSON.stringify(
      courses
    )}; in the following format: 
From lecures (L): 1L, 2L, 3L, 4L, 5L
From recitations (R): 1R, 2R, 3R, 4R
From seminars (S): 1S, 2S, 3S, 4S, 5S, 6S, 7S, 8S
From labs (Lb): 1Lb, 2Lb, 3Lb, 4Lb, 5Lb \n Note that this is just an example and some courses may not have section types that others may have`; // Construct the initial prompt here
    const initialData = await fetchGeminiResponse(initialPrompt);

    const refinedPrompt = `You are a schedule assistant that helps students register for courses using the particular university's Public Course Catalog. At this point, your job is to select only one section per type. Here are list of all possible section types: 
'L': 'Lecture',
'R': 'Recitation',
'S': 'Seminar',
'PLb': 'PhysLab',
'CLb': 'CompLab',
'Lb': 'Lab',
'Int': 'Internship' 
    For example, among 1L, 2L, 3L, ... I select only one. If there exist sections of other type ('R'/'S'/'PLb'/'CLb'/'Lb'/'Int'), I also choose only one from there. 
    Now, select one from each section types from here: ${initialData}, where every info about that course section type come from ${JSON.stringify(
      courses
    )}, make sure sections you chose do not overlap in time for one day! Days of the week are abbreviated as follows:
Mon (Monday), Tue (Tuesday), Wed (Wednesday), Thu (Thursday), Fri (Friday), Sat (Saturday). According to the number of distinct section types, write the output in format like this (you must concatenate days within the section type chosen by you, below is not must have sections, it is just an example):
1L at 9:00 AM-9:50 AM on M W F
1Lb at 10:00 AM-11:50 AM on T R
1S at 12:00 PM-1:50 PM on M W F`; // Construct the refined prompt here
    const refinedData = await fetchGeminiResponse(refinedPrompt);

    const detailedPrompt = `You are a schedule assistant that helps students register for courses using the particular university's Public Course Catalog. At this point, your job is to get readily selected sections: ${refinedData}, and to find those exact sections from ${JSON.stringify(
      courses
    )} and output only in JSON format without any words or explanation! The JSON schema should look: 
{
    "Mon": [
        {
            "school": "SEDS",
            "level": "UG",
            "abbr": "CSCI 152",
            "st": "1Lb",
            "title": "Performance and Data Structures",
            "credits": "8",
            "days": "M",
            "times": "09:00 AM-09:50 AM",
            "enr": "47",
            "capacity": "48",
            "faculty": "Adai Shomanov, Yesdaulet Izenov",
            "room": "7E.125/3 - cap:54"
        }
    ],
    "Tue": [
        {
            "school": "SEDS",
            "level": "UG",
            "abbr": "CSCI 152",
            "st": "1L",
            "title": "Performance and Data Structures",
            "credits": "8",
            "days": "T ",
            "times": "10:30 AM-11:45 AM",
            "enr": "47",
            "capacity": "48",
            "faculty": "Adai Shomanov, Yesdaulet Izenov",
            "room": "7E.125/3 - cap:54"
        }
    ],
    "Thu": [
        {
            "school": "SEDS",
            "level": "UG",
            "abbr": "CSCI 152",
            "st": "1L",
            "title": "Performance and Data Structures",
            "credits": "8",
            "days": "R ",
            "times": "10:30 AM-11:45 AM",
            "enr": "47",
            "capacity": "48",
            "faculty": "Adai Shomanov, Yesdaulet Izenov",
            "room": "7E.125/3 - cap:54"
        }
    ]
    "Unknown": [
        {
            "school": "SEDS",
            "level": "UG",
            "abbr": "CSCI 152",
            "st": "1L",
            "title": "Performance and Data Structures",
            "credits": "8",
            "days": "",
            "times": "",
            "enr": "47",
            "capacity": "48",
            "faculty": "Adai Shomanov, Yesdaulet Izenov",
            "room": "7E.125/3 - cap:54"
        }
    ]
}, where Mon, Tue, Thu mean days of the week (Monday, Tuesday, Thursday)`; // Construct the detailed prompt here
    const finalData = await fetchGeminiResponse(detailedPrompt);

    return res.json(finalData);
  } catch (error) {
    console.error((error as Error).message);
    return res.status(500).json({ error: (error as Error).message });
  }
}
