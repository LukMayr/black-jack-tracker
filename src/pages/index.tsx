import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const { data: rooms, refetch } = api.room.getMyRooms.useQuery(undefined, {
    enabled: !!session,
  });

  const createRoom = api.room.createRoom.useMutation({
    onSuccess: () => refetch(),
  });

  const joinRoom = api.room.joinRoomByCode.useMutation({
    onSuccess: () => refetch(),
  });

  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  if (!session) {
    return (
      <main className="p-6">
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => signIn()}
        >
          Sign in
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">🃏 Blackjack Tracker</h1>
      <div className="mb-4">
        <input
          className="mr-2 rounded border p-2"
          placeholder="Room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="rounded bg-green-600 px-4 py-2 text-white"
          onClick={() => createRoom.mutate({ name })}
        >
          Create Room
        </button>
      </div>

      <div className="mb-4">
        <input
          className="mr-2 rounded border p-2"
          placeholder="Invite code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => joinRoom.mutate({ code })}
        >
          Join Room
        </button>
      </div>

      <h2 className="mt-6 mb-2 font-semibold">My Rooms</h2>
      <ul className="rounded bg-gray-100 p-4">
        {rooms?.map((room) => (
          <li key={room.id} className="mb-2">
            {room.name} — Invite Code: <code>{room.inviteCode}</code>
          </li>
        ))}
      </ul>

      <button className="mt-6 text-red-500 underline" onClick={() => signOut()}>
        Sign out
      </button>
    </main>
  );
}
