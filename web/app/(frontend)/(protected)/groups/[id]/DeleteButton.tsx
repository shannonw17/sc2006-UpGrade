"use client";

import { deleteGroup } from "@/app/(backend)/GroupController/deleteGroup";

interface DeleteButtonProps {
  groupId: string;
}

export function DeleteButton({ groupId }: DeleteButtonProps) {
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this group?')) {
      const formData = new FormData();
      formData.append('groupId', groupId);
      deleteGroup(formData);
    }
  };

  return (
    <form action={deleteGroup}>
      <input type="hidden" name="groupId" value={groupId} />
      <button
        type="submit"
        onClick={handleDelete}
        className="w-full bg-red-600 text-white font-medium py-3 rounded-lg hover:bg-red-700 transition-colors"
      >
        Delete Group
      </button>
    </form>
  );
}