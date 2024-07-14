// src/controllers/courseController.ts
import { Request, Response } from "express";
import { sheetData, fetchGeminiResponse } from "./course-service";
import { Course } from "./course-types";
import { type } from "os";
import extract from "extract-json-from-string";

function concatenateDays(courses: Course[]): object {
  const result: { [key: string]: any } = {};

  courses.forEach((course) => {
    const key = course.type;
    if (!result[key]) {
      result[key] = {
        school: course.school,
        level: course.level,
        abbreviation: course.abbreviation,
        title: course.title,
        credits: course.credits,
        times: course.times,
        days: course.days.trim(),
        enrolled: course.enrolled,
        capacity: course.capacity,
        faculty: course.faculty,
        room: course.room,
      };
    } else {
      result[key].days += " " + course.days.trim();
    }
  });

  // trim the days strings and handle unknown days
  Object.keys(result).forEach((key) => {
    result[key].days = result[key].days.trim().split(" ").join(" ");
    if (!result[key].days) {
      result[key].days = "U";
    }
  });

  return result;
}

const filterCourses = (sectionsJson: string, courses: Course[]): Course[] => {
  const sectionsArray = JSON.parse(sectionsJson);
  const sections: string[] = sectionsArray[0];

  // filter the courses based on the section types
  return courses.filter((course) => sections.includes(course.type));
};

export async function handleCourseRequest(req: Request, res: Response) {
  try {
    // add comments field
    // add mutliple course selection
    const { courseAbbr, semester } = req.body;

    const courses = await sheetData(semester, courseAbbr);

    if (courses.length === 0) {
      return res.status(404).json({ message: "No courses found" });
    }

    const stOccurences = concatenateDays(courses);

    const initialPrompt = `You are a friendly schedule assistant that helps students register for courses using the particular university's Public Course Catalog. Your job is to get the user's intended course's list of distinct section types and list them. Do not consider numbers that come before section types. Here are list of all possible section types: 
'L': 'Lecture',
'R': 'Recitation',
'S': 'Seminar',
'PLb': 'PhysLab',
'CLb': 'CompLab',
'Lb': 'Lab',
'Int': 'Internship'. Generate a list of distinct section types that exist in ${
      courses[0].abbreviation
    } with additional information about how many times that numbered section appeared in the following courses information: ${JSON.stringify(
      courses
    )}; in the following format and do not include any other words/explanation in the output: 
{
  "L": {
    "1L": 2,
    "2L": 2,
    "3L": 2,
    "4L": 2,
    "5L": 2
  },
  "R": {
    "1R": 1,
    "2R": 1,
    "3R": 1,
    "4R": 1
  },
  "S": {
    "1S": 1,
    "2S": 1,
    "3S": 1,
    "4S": 1,
    "5S": 1,
    "6S": 1,
    "7S": 1,
    "8S": 1
  }
} \n Note that this is just an example and some courses may not have section types that others have.`;

    const initialData = await fetchGeminiResponse(initialPrompt);

    const refinedPrompt = `You are a schedule assistant that helps students register for courses using the particular university's Public Course Catalog. At this point, your job is to select only one section number per type. Here are list of all possible section types:
    'L': 'Lecture',
    'R': 'Recitation',
    'S': 'Seminar',
    'PLb': 'PhysLab',
    'CLb': 'CompLab',
    'Lb': 'Lab',
    'Int': 'Internship'
    1) Here's numbered sections under each section type: ${initialData}.
    2) Here is full indormation about each seciton: "${JSON.stringify(stOccurences)}". 
    
    3) **EXAMPLE** to guide you on how to correctly select sections: 
    Here's the breakdown of the section selection process:

    "1. **'PLb' (PhysLab):**  We have multiple 'PLb' sections. We need to find one that doesn't overlap with any other section type. 
      - We start with "1PLb" (09:00 AM-11:50 AM, M).
      - It overlaps with "1L" (11:00 AM-11:50 AM, M W F) because they clash on Monday and the time intersects.
      - We move to "2PLb" (12:00 PM-02:50 PM, M).
      - It doesn't overlap with "1L" because they are on the same day (M) but don't intersect in time.
      - We select "2PLb".

    2. **'L' (Lecture):** We have multiple 'L' sections. We need to find one that doesn't overlap with "2PLb".
      - We start with "1L" (11:00 AM-11:50 AM, M W F).
      - It doesn't overlap with "2PLb" because they are on different days.
      - We select "1L".

    3. **'R' (Recitation):** We have multiple 'R' sections. We need to find one that doesn't overlap with "2PLb" and "1L".
      - We start with "1R" (09:00 AM-09:50 AM, M).
      - It doesn't overlap with "2PLb" because they are on different days.
      - It doesn't overlap with "1L" because they are on different days.
      - We select "1R".

    4. Therefore, the final output is:
    [
      "2PLb",
      "1L",
      "1R"
    ]"
    
    4) Always stick with the reference: "${JSON.stringify(stOccurences)}"
    5) According to the number of distinct section types, write the output in format like this (it depends on existence of various course types, if there are 2 types, output 2 number selections):
    [
      "1L",
      "2R",
      "3S"
    ] and justify why you chose these sections.`;
    const refinedData = await fetchGeminiResponse(refinedPrompt);

    // console.log("Refined Data:", refinedData);

    const extractedJson = extract(refinedData);
    const selectedSections = filterCourses(JSON.stringify(extractedJson), courses);

    const detailedPrompt = `You are a schedule assistant that helps students register for courses using the particular university's Public Course Catalog. At this point, your job is to get selected sections and generate a JSON schedule by filtering them by days (M - Monday, T - Tuesday, W - Wednesday, R - Thursday, F - Friday), times, enrolled, capacity, faculty, and room. Here's your reference: ${JSON.stringify(
      selectedSections
    )}. JSON-formatted schedule should look like this without any explanation and words (since this is an example, the actual data may vary):
    {
        "Monday":
        [
          {
            "school": "SSH",
            "level": "UG",
            "abbreviation": "HST 100",
            "type": "1S",
            "title": "History of Kazakhstan",
            "credits": "6",
            "days": "M",
            "times": "09:00 AM-09:50 AM",
            "enrolled": "22",
            "capacity": "24",
            "faculty": "Javeed Ahwar",
            "room": "8.319 - cap:30"
          }
        ],
        "Tuesday": [],
        "Wednesday": [],
        "Thursday": [],
        "Friday": [],
        "Unknown":
        [
          {
            "school": "SSH",
            "level": "UG",
            "abbreviation": "HST 100",
            "type": "1L",
            "title": "History of Kazakhstan",
            "credits": "6",
            "days": "",
            "times": "Online/Distant",
            "enrolled": "492",
            "capacity": "504",
            "faculty": "Mikhail Akulov",
            "room": ""
          }
        ]
    }, where "Unknown" is a placeholder for days that are not specified.`;
    const finalData = await fetchGeminiResponse(detailedPrompt);

    return res.json(finalData);
  } catch (error) {
    console.error((error as Error).message);
    return res.status(500).json({ error: (error as Error).message });
  }
}
