// app/(frontend)/(protected)/schedule/page.tsx
import ScheduleClient from "./ScheduleClient";
import { addEntry } from "@/app/(backend)/ScheduleController/addEntry";

export default async function SchedulePage() {
    try {
        const studyGroups = await addEntry();
        
        // Ensure we have a proper array and transform dates
        const processedStudyGroups = studyGroups?.map(group => ({
            ...group,
            start: group.start ? new Date(group.start) : new Date(),
            end: group.end ? new Date(group.end) : new Date(),
        })) || [];

        return <ScheduleClient studyGroups={processedStudyGroups} />;
    } catch (error) {
        console.error("Error in SchedulePage:", error);
        return <ScheduleClient studyGroups={[]} />;
    }
}