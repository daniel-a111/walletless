import express from 'express';
import * as controller from './controller'

const router = express.Router();
router.post('/api/contact', controller.contact);
router.post('/api/subscribe', controller.subscription);
export = router;
