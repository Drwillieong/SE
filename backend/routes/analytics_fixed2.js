import express from 'express';
import { getAnalyticsData } from '../controllers/analyticsController_fixed.js';

const router = express.Router();

// This function will be called from server.js to pass the db connection
export default (db) => {
    // Get analytics data (admin only)
    router.get('/', getAnalyticsData(db));

    return router;
};
