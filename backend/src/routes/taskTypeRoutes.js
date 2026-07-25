import express from 'express';
import { getTaskTypesController } from '../controllers/taskTypeController.js';

const router = express.Router();

router.get('/', getTaskTypesController);

export default router;
