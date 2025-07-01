import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { signOut } from "next-auth/react";

export default function RoomDetail() {
  const router = useRouter();
  const { id } = router.query;

  const {
    data: room,
    isLoading,
    error,
  } = api.room.getRoomById.useQuery({ id: id as string }, { enabled: !!id });

  if (isLoading) return <p>Loading room details...</p>;
  if (error) return <p>Error loading room: {error.message}</p>;
  if (!room) return <p>Room not found</p>;

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">{room.name}</h1>
      <p>
        Invite Code: <code>{room.inviteCode}</code>
      </p>
      <p>Role: {room.role}</p>

      {/* You can add more detailed info here, like players, game sessions, admin actions, etc */}
        
      <button
        className="mt-6 text-blue-600 underline"
        onClick={() => router.back()}
      >
        ← Back
      </button>

      <button
        className="mt-6 ml-4 text-red-500 underline"
        onClick={() => signOut()}
      >
        Sign out
      </button>
    </main>
  );
}
