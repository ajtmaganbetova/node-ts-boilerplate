import { Router } from "express";
import { handleCourseRequest } from "./course-controller";

const courseRouter = Router();

courseRouter.post("/courses", handleCourseRequest);

export default courseRouter;
