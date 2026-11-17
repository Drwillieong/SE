import {cronJobs} from "convex/server";
import {internal} from "./_generated/api";
const crons=cronJobs();
crons.daily("archive completed orders",{hourUTC:16,minuteUTC:20},internal.maintenance.archiveCompleted);
export default crons;
