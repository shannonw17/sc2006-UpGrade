import { requireUser } from "@/lib/requireUser";
import { viewSchedule } from "@/app/(backend)/ScheduleController/viewSchedule";
import { addEntry } from "@/app/(backend)/ScheduleController/addEntry";
import { sendInboxReminder } from "@/app/(backend)/ScheduleController/sendInboxReminder";
import { sendInWebsiteAlert } from "@/app/(backend)/ScheduleController/sendInWebsiteAlert";

export default async function Home() {
  const user = await requireUser();
  await sendInboxReminder(); // Send reminders for upcoming study groups
  const messages = await sendInWebsiteAlert(); // Send in-website alerts for upcoming study groups
  const studyGroups = await addEntry();
  // studyGroups is a list of Group objects that the user is a member of
  // You can now use this list to display the Schedule page

  return (
    <main className="p-10 space-y-6 text-cyan-500">
      <h1 className="text-2xl">
        @\app\(frontend)\(protected)\schedule\page.tsx
      </h1>
      <h2 className="text-3xl font-bold mb-4">Make calendar pls ^^</h2>
      <section>
        {studyGroups.length === 0 ? (
          <p>No study groups found.</p>
        ) : (
          <ul className="space-y-3">
            {studyGroups.map((group) => (
              <li key={group.id} className="border p-4 rounded-lg">
                <p className="font-bold"> Group Name: {group.name}</p>
                <p>
                  Start Date: {group.start.toDateString()} ------ Start Time:
                  {group.start.toTimeString()}
                </p>
                <p>
                  End Date: {group.end.toDateString()} ------ End Time:
                  {group.end.toTimeString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
