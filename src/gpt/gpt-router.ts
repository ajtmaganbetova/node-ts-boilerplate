// gpt-router.ts
import { Router } from 'express';
import GptService from './gpt-service';
import GptController from './gpt-controller';

//in order to provide our frontend with the user data, we need to specify user routes

const gptRouter = Router();

const gptService = new GptService();
const gptController = new GptController(gptService);

gptRouter.post('/schedule/', gptController.getBooks);

export default gptRouter;
