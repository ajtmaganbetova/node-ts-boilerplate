// course-types.ts
export interface Course {
  school: string;
  level: string;
  abbreviation: string;
  type: string;
  title: string;
  credits: string;
  days: string;
  times: string;
  enrolled: string;
  capacity: string;
  faculty: string;
  room: string;
};

// export type CourseSchedule = {
//   Monday: Course[];
//   Tuesday: Course[];
//   Wednesday: Course[];
//   Thursday: Course[];
//   Friday: Course[];
//   Distant: Course[];
// };
export interface ConcatenatedDays {
  [course: string]: {
    [type: string]: {
      school: string;
      level: string;
      abbreviation: string;
      title: string;
      credits: string;
      times: string;
      days: string;
      enrolled: string;
      capacity: string;
      faculty: string;
      room: string;
    };
  };
}
export interface CourseSchedule {
  [key: string]: Course[];
}
