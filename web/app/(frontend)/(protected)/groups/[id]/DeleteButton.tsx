"use client";

import { deleteGroup } from "@/app/(backend)/GroupController/deleteGroup";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  groupId: string;
}

export function DeleteButton({ groupId }: DeleteButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this group?')) {
      try {
        const formData = new FormData();
        formData.append('groupId', groupId);
        
        const result = await deleteGroup(formData);
        
        if (result?.success) {
          // Success - redirect to groups page
          router.push("/groups?tab=mine");
          router.refresh(); // Refresh to show updated list
        } else {
          alert('Failed to delete group. Please try again.');
        }
      } catch (error: any) {
        // Check if it's a redirect error (which we're not using anymore)
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
          // If it's a redirect error, just redirect manually
          router.push("/groups?tab=mine");
          router.refresh();
        } else {
          console.error('Failed to delete group:', error);
          alert(error.message || 'Failed to delete group. Please try again.');
        }
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="w-full bg-red-600 text-white font-medium py-3 rounded-lg hover:bg-red-700 transition-colors"
    >
      Delete Group
    </button>
  );
}