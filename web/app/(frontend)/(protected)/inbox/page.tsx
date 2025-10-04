// @ front end ppl : yall update this urself... i js chatgpt a rough outline to call the functions in backend

"use client";

import { useEffect, useState } from "react";

function Button({ children, onClick, variant = "solid" }: any) {
    const base =
      "px-4 py-2 rounded-md text-sm font-medium transition " +
      (variant === "outline"
        ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
        : "bg-blue-600 text-white hover:bg-blue-700");
    return (
      <button onClick={onClick} className={base}>
        {children}
      </button>
    );
  }
  
  function Card({ children }: any) {
    return <div className="border rounded-lg shadow-sm bg-white">{children}</div>;
  }
  function CardHeader({ children }: any) {
    return <div className="border-b p-4">{children}</div>;
  }
  function CardTitle({ children }: any) {
    return <h2 className="text-lg font-semibold">{children}</h2>;
  }
  function CardContent({ children }: any) {
    return <div className="p-4">{children}</div>;
  }
  

interface Invitation {
  id: string;
  groupName: string;
  senderName: string;
  status: string;
  createdAt: string;
}

interface Notification {
  id: string;
  message: string;
  createdAt: string;
}

export default function InboxPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch both invitations and notifications
    async function fetchInbox() {
      try {
        const [invitesRes, notiRes] = await Promise.all([
          fetch("/api/invitation/getInvitations"),
          fetch("/api/notification/getNotifications"),
        ]);

        const invitesData = await invitesRes.json();
        const notiData = await notiRes.json();

        setInvitations(invitesData);
        setNotifications(notiData);
      } catch (err) {
        console.error("Error loading inbox:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInbox();
  }, []);

  // Accept invite handler
  async function handleAccept(inviteId: string) {
    const res = await fetch(`/api/invitation/acceptInvite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId }),
    });
    if (res.ok) {
      setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
    }
  }

  // Reject invite handler
  async function handleReject(inviteId: string) {
    const res = await fetch(`/api/invitation/rejectInvite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId }),
    });
    if (res.ok) {
      setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
    }
  }

  if (loading) return <p className="p-6 text-gray-500">Loading inbox...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-gray-500">No pending invitations.</p>
          ) : (
            invitations.map((invite) => (
              <div
                key={invite.id}
                className="flex justify-between items-center border-b border-gray-200 py-3"
              >
                <div>
                  <p className="font-medium">
                    Invitation from <span className="text-blue-600">{invite.senderName}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    to join <span className="font-semibold">{invite.groupName}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Sent on {new Date(invite.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleReject(invite.id)}>
                    Reject
                  </Button>
                  <Button onClick={() => handleAccept(invite.id)}>Accept</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-gray-500">No new notifications.</p>
          ) : (
            notifications.map((noti) => (
              <div key={noti.id} className="border-b border-gray-200 py-3">
                <p className="text-gray-800">{noti.message}</p>
                <p className="text-xs text-gray-400">
                  {new Date(noti.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
