import React from "react";
import { api } from "~/utils/api";

interface Room {
  id: string;
  name: string;
  inviteCode: string;
  role: "OWNER" | "PLAYER";
}

interface RoomListProps {
  onRoomClick: (room: Room) => void;
}

const RoomList: React.FC<RoomListProps> = ({ onRoomClick }) => {
  const { data: rooms, isLoading, error } = api.room.getMyRooms.useQuery();

  if (isLoading) return <p>Loading rooms...</p>;
  if (error) return <p>Error loading rooms: {error.message}</p>;
  if (!rooms || rooms.length === 0) return <p>No rooms found.</p>;

  return (
    <ul className="rounded bg-gray-100 p-4">
      {rooms.map((room) => (
        <li
          key={room.id}
          className="mb-2 cursor-pointer rounded p-2 hover:bg-gray-200"
          onClick={() => onRoomClick(room)}
          title={`Invite Code: ${room.inviteCode} — Role: ${room.role}`}
        >
          <strong>{room.name}</strong> — <code>{room.inviteCode}</code> — Role:{" "}
          {room.role}
        </li>
      ))}
    </ul>
  );
};

export default RoomList;
