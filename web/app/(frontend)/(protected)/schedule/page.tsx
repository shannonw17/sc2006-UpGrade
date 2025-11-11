// app/(frontend)/(protected)/schedule/page.tsx
import ScheduleClient from "./ScheduleClient";
import { addEntry } from "@/app/(backend)/ScheduleController/addEntry";

export default async function SchedulePage() {
  try {
    const studyGroups = await addEntry();
    
    console.log('SchedulePage: Fetched', studyGroups?.length, 'study groups');
    
    const processedStudyGroups = studyGroups?.map(group => ({
      ...group,
      start: new Date(group.start),
      end: new Date(group.end),
      createdAt: group.createdAt ? new Date(group.createdAt) : new Date(),
      name: group.name || 'Unnamed Group',
      location: group.location || 'No location specified',
      capacity: group.capacity || 1,
      currentSize: group.currentSize || 1,
      visibility: group.visibility ?? true,
    })) || [];

    return <ScheduleClient initialStudyGroups={processedStudyGroups} />;
  } catch (error) {
    console.error("Error in SchedulePage:", error);
    return <ScheduleClient initialStudyGroups={[]} />;
  }
}