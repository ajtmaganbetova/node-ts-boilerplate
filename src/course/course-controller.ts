import { Request, Response } from "express";
import { sheetData, fetchOpenAIResponse } from "./course-service";
import {
  Course,
  ConcatenatedDays,
} from "./course-types";
import extract from "extract-json-from-string";

function concatenateDays(sections: Course[]): ConcatenatedDays {
  const result: ConcatenatedDays = {};

  sections.forEach((section) => {
    const { abbreviation, type, days, ...rest } = section;

    // Initialize course and type in the result object
    if (!result[abbreviation]) {
      result[abbreviation] = {};
    }
    if (!result[abbreviation][type]) {
      result[abbreviation][type] = {
        ...rest,
        abbreviation, // Ensure abbreviation is included
        days: days.trim(),
      };
    } else {
      // Concatenate days if section type already exists
      result[abbreviation][type].days = [
        ...new Set(
          (result[abbreviation][type].days + " " + days).trim().split(/\s+/)
        ),
      ].join(" ");
    }
  });

  return result;
}

function filterCourses(
  courses: Course[],
  sectionsMap: Record<string, string[]>
): Record<string, Course[]> {
  const result: Record<string, Course[]> = {};

  console.log("Initial Sections Map: ", sectionsMap);

  for (const [courseAbbr, sectionTypes] of Object.entries(sectionsMap)) {
    console.log(`Filtering for course abbreviation: ${courseAbbr}`);
    console.log(`Section types: ${sectionTypes}`);

    const filteredCourses = courses.filter(
      (course) =>
        course.abbreviation === courseAbbr &&
        sectionTypes.includes(course.type)
    );

    console.log(`Filtered courses for ${courseAbbr}: `, filteredCourses);

    if (filteredCourses.length > 0) {
      result[courseAbbr] = filteredCourses;
    }
  }

  return result;
}

export async function handleCourseRequest(req: Request, res: Response) {
  try {
    const { courseAbbr, semester } = req.body;

    const allCourses: Course[] = [];

    for (const abbr of courseAbbr) {
      const courses = await sheetData(semester, abbr);
      allCourses.push(...courses);
    }

    if (allCourses.length === 0) {
      return res.status(404).json({ message: "No courses found" });
    }

    const allSections = concatenateDays(allCourses);

    const initialPrompt = `You are a friendly schedule assistant that helps students register for courses using the particular university's Public Course Catalog. Your job is to get the user's intended course's list of distinct section types and list them. Do not consider numbers that come before section types. Here are list of all possible section types: 
    'L': 'Lecture',
    'R': 'Recitation',
    'S': 'Seminar',
    'PLb': 'PhysLab',
    'CLb': 'CompLab',
    'Lb': 'Lab',
    'Int': 'Internship'. Generate a list of different section numbers that are classified under distinct section types that exist in courses: "${allCourses
      .map((course) => course.abbreviation)
      .join(
        ", "
      )}". Available sections come from following list of sections for each course: "${JSON.stringify(
      allSections
    )}". Output ONLY in the following format and do not include any other words/explanation in the response: 
    {
      "COURSE ABBREVIATION": {
        "L": ["1L", "2L", "3L", "4L", "5L"],
        "R": ["1R", "2R", "3R", "4R"],
        "S": ["1S", "2S", "3S", "4S", "5S", "6S", "7S", "8S"]
      },
      "COURSE ABBREVIATION": {
        "L": ["1L", "2L", "3L", "4L", "5L"],
        "R": ["1R", "2R", "3R", "4R"],
        "S": ["1S", "2S", "3S", "4S", "5S", "6S", "7S", "8S"]
      }
    } \n Note that this is just an example and some courses may not have section types that others have.`;

    const initialData = await fetchOpenAIResponse(initialPrompt);

    const refinedPrompt = `You are a schedule assistant that helps students register for courses using the particular university's Public Course Catalog. At this point, your job is to select only one section number per type for each course. Here are list of all possible section types for a course:
    'L': 'Lecture',
    'R': 'Recitation',
    'S': 'Seminar',
    'PLb': 'PhysLab',
    'CLb': 'CompLab',
    'Lb': 'Lab',
    'Int': 'Internship'
    1) Here are numbered section types for each course: ${initialData}.
    2) Here is full information about sections for every course: "${JSON.stringify(
      allSections
    )}".
    
    3) A guide you on how to correctly select sections for a course and compare them with other courses in parallel: 
    - If there is only one section number under a section type, select that section, and move on to the next course's any section type and do the same if the condition repeats.
    - If there are multiple section numbers under a section type, go through the list of sections and compare times AND days of each section with the course's other chosen sections first, and with other course's chosen sections second.
    - DO NOT look for one property only, compare both days and times. For example, even if 1L and 1Lb have same times, they may have different days. Do not make a decision based on times/days only.
    If you are struggling to decide, you can mention that.

    4) Always stick with the original information about existing sections for each course selected: "${JSON.stringify(
      allSections
    )}"
    5) According to the number of distinct section types, write the output in format as JSON like this (it depends on existence of various course types, if there are 2 types, output 2 number selections):
    {
      "MATH 161": ["1L", "2R", "3S"],
      "PHYS 161": ["1L", "2R", "3S"]
    } and justify why you chose these sections. Do not output any JSON objects other than the expected output, because I will extract that JSON object from your output. If there are any other JSON objects, it will cause an error.`;

    const refinedData = await fetchOpenAIResponse(refinedPrompt);
    const extractedJson = extract(refinedData);
    const sectionsMap =
      Array.isArray(extractedJson) && extractedJson.length > 0
        ? extractedJson[0]
        : {};
  
    const selectedSections = filterCourses(allCourses, sectionsMap);
    
    const detailedPrompt = `You are a schedule assistant that helps students register for courses using the particular university's Public Course Catalog. At this point, your job is to get selected sections for each course and generate a JSON schedule by filtering them by days (M - Monday, T - Tuesday, W - Wednesday, R - Thursday, F - Friday), times, enrolled, capacity, faculty, and room. Here's a list of sections the student wants to include in a schedule: ${JSON.stringify(
      selectedSections
    )}. Your response MUST contain only JSON-formatted schedule provided below. If selected sections is an empty object, return an empty object. Do not include any other words except the schedule (since this is an example, the actual data may vary according to the selected sections):
    {
        "Monday":
        [
          {
            "school": "some school name",
            "level": "some level",
            "abbreviation": "course abbreviation",
            "type": "numbered section type",
            "title": "some course title",
            "credits": "some credits",
            "days": "M",
            "times": "some time",
            "enrolled": "some number",
            "capacity": "some number",
            "faculty": "some faculty",
            "room": "some room number"
          }, 
          {
            "school": "some school name",
            "level": "some level",
            "abbreviation": "course abbreviation",
            "type": "numbered section type",
            "title": "some course title",
            "credits": "some credits",
            "days": "M",
            "times": "some time",
            "enrolled": "some number",
            "capacity": "some number",
            "faculty": "some faculty",
            "room": "some room number"
          }
        ],
        "Tuesday": [],
        "Wednesday": 
        [
          {
            "school": "some school name",
            "level": "some level",
            "abbreviation": "course abbreviation",
            "type": "numbered section type",
            "title": "some course title",
            "credits": "some credits",
            "days": "W",
            "times": "some time",
            "enrolled": "some number",
            "capacity": "some number",
            "faculty": "some faculty",
            "room": "some room number"
          }
        ],
        "Thursday": [],
        "Friday": [],
        "Distant":
        [
          {
            "school": "some school name",
            "level": "some level",
            "abbreviation": "course abbreviation",
            "type": "numbered section type",
            "title": "some course title",
            "credits": "some credits",
            "days": "Distant",
            "times": "some time",
            "enrolled": "some number",
            "capacity": "some number",
            "faculty": "some faculty",
            "room": "some room number"
          }
        ]
    }`;
    const detailedData = await fetchOpenAIResponse(detailedPrompt);
    console.log("Detailed Data: ", detailedData);

    const extractedSchedule = extract(detailedData);
    res.status(200).json({ allSections, extractedSchedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
