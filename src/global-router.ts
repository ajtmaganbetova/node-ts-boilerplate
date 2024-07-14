import { Router } from 'express';
import courseRouter from "./course/course-router";
// other routers can be imported here

const globalRouter = Router();

globalRouter.use(courseRouter); 

// other routers can be added here

export default globalRouter;
