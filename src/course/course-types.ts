export type Course = {
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

export type CourseSchedule = {
  Monday: Course[];
  Tuesday: Course[];
  Wednesday: Course[];
  Thursday: Course[];
  Friday: Course[];
  Distant: Course[];
};
