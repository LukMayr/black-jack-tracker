import React from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api"; // adjust path if needed
import { useSession } from "next-auth/react";

export default function RoomDetail() {
  const router = useRouter();
  const roomId = router.query.id as string;

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const {
    data: room,
    refetch,
    isLoading,
    isError,
  } = api.room.getRoomById.useQuery({ id: roomId }, { enabled: !!roomId });
  

  const kickUserMutation = api.room.kickUser.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });


  if (isLoading) return <div>Loading room details...</div>;
  if (isError || !room) return <div>Failed to load room details.</div>;

  const ownerId = room.ownerId;
  const members = room.members;

  const podium = members.slice(0, 3);
  const rest = members.slice(3);

  function handleKick(userId: string) {
    if (confirm("Are you sure you want to kick this user?")) {
      kickUserMutation.mutate({ roomId, userId });
    }
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-3xl font-bold">{room.name} Code: {room.inviteCode}</h1>
      <h2 className="mb-4 text-2xl font-bold">Room Members</h2>

      <div className="mb-6 flex justify-between">
        <div className="mt-8 flex justify-center gap-6">
          {podium[1] && (
            <div className="flex flex-col items-center justify-end">
              <div className="text-sm font-semibold text-gray-600">2nd</div>
              <div className=" w-40 rounded-b-lg text-center">
                {podium[1].user.username ?? podium[1].user.email}
              </div>
              <div className="flex h-16 w-40 items-center justify-center rounded-t-lg bg-gray-300 text-lg font-bold">
                {podium[1].balance}
              </div>
            </div>
          )}

          {podium[0] && (
            <div className="flex flex-col items-center justify-end">
              <div className="text-sm font-semibold text-yellow-500">1st</div>
              <div className="w-60 text-center">
                {podium[0].user.username ?? podium[0].user.email}
              </div>
              <div className="flex h-20 w-60 items-center justify-center rounded-t-lg bg-yellow-400 text-xl font-bold">
                {podium[0].balance}
              </div>
            </div>
          )}

          {podium[2] && (
            <div className="flex flex-col items-center justify-end">
              <div className="text-sm font-semibold text-amber-700">3rd</div>
              <div className="w-24 text-center">
                {podium[2].user.username ?? podium[2].user.email}
              </div>
              <div className="text-md flex h-14 w-24 items-center justify-center rounded-t-lg bg-amber-700 font-bold">
                {podium[2].balance}
              </div>
            </div>
          )}
        </div>
      </div>

      {rest.length > 0 && (
        <ol className="list-inside list-decimal space-y-2">
          {rest.map((member, index) => (
            <li
              key={member.user.id}
              className="flex items-center justify-start rounded bg-gray-100 px-4 py-2 hover:bg-gray-200 transition-colors duration-200"
            >
              <span className="mr-3">{index + 4}.</span>
              <span>
                {member.user.username ?? member.user.email} — {member.balance}
              </span>
              {ownerId === currentUserId && member.user.id !== ownerId && (
                <button
                  className="ml-4 rounded bg-red-600 px-3 py-1 text-white transition-colors duration-200 hover:bg-red-700"
                  onClick={() => handleKick(member.user.id)}
                  disabled={kickUserMutation.status === "pending"}
                >
                  Kick
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      <button
        className="mt-6 rounded bg-green-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-green-700"
        onClick={() => router.push(`/rooms/${roomId}/rounds`)}
        disabled={
          !ownerId ||
          ownerId !== currentUserId
        }
      >
        Start Game
      </button>
    </div>
  );
}
