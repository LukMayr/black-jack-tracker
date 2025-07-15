import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";

type RoundEntry = {
  bet?: number;
  result?: "WIN" | "LOSS" | "DRAW";
};

export default function GameSessionPage() {
  const router = useRouter();
  const { id: roomId } = router.query as { id: string };

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [gameSessionId, setGameSessionId] = useState<string | null>(null);

  const {
    data: room,
    isLoading,
    isError,
    refetch,
  } = api.room.getRoomById.useQuery({ id: roomId }, { enabled: !!roomId });

  const startGameMutation = api.room.startGameSession.useMutation({
    onSuccess: (data) => {
      setGameSessionId(data.id);
      void refetch();
    },
  });

  const submitRoundMutation = api.round.submitRound.useMutation({
    onSuccess: () => {
      alert("Round submitted successfully!");
      setRoundData({});
      void refetch();
    },
  });

  const [roundData, setRoundData] = useState<Record<string, RoundEntry>>({});

  useEffect(() => {
    if (roomId) {
      startGameMutation.mutate({ roomId });
    }
  }, [roomId]);

  if (isLoading) return <div className="p-4">Loading room...</div>;
  if (isError || !room) return <div className="p-4">Failed to load room.</div>;

  const ownerId = room.ownerId;
  const members = room.members;

  const handleInputChange = (
    userId: string,
    field: "bet" | "result",
    value: string | number,
  ) => {
    setRoundData((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: field === "bet" ? Number(value) : value,
      },
    }));
  };

  const handleDouble = (userId: string) => {
    setRoundData((prev) => {
      const currentBet = prev[userId]?.bet ?? 0;
      return {
        ...prev,
        [userId]: {
          ...prev[userId],
          bet: currentBet * 2,
        },
      };
    });
  };

  const handleSplit = (userId: string) => {
    const splitId = `${userId}_split`;
    const currentBet = roundData[userId]?.bet ?? 0;

    setRoundData((prev) => ({
      ...prev,
      [splitId]: {
        bet: currentBet,
        result: undefined,
      },
    }));
  };

  const handleSubmit = () => {
    const entries = Object.entries(roundData)
      .filter(
        ([_, data]) => data.bet !== undefined && data.result !== undefined,
      )
      .map(([userId, data]) => ({
        userId: userId.replace("_split", ""),
        amount: data.bet ?? 0,
        result: (data.result ?? "DRAW").toUpperCase() as
          | "WIN"
          | "LOSS"
          | "DRAW",
      }));

    if (entries.length === 0) {
      alert("Please enter bets and results for at least one player.");
      return;
    }

    submitRoundMutation.mutate({
      gameSessionId: gameSessionId!,
      entries,
    });
  };

  // Merge members with any split users from roundData
  const displayUsers = [...members];

  Object.keys(roundData).forEach((key) => {
    if (
      key.endsWith("_split") &&
      !displayUsers.some((m) => m.user.id === key)
    ) {
      const originalId = key.replace("_split", "");
      const originalUser = members.find((m) => m.user.id === originalId);
      if (originalUser) {
        displayUsers.push({
          ...originalUser,
          user: {
            ...originalUser.user,
            id: key,
          },
        });
      }
    }
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Game Session</h1>

      <ol className="space-y-4">
        {displayUsers.map((member) => {
          const userId = member.user.id;
          const data = roundData[userId] ?? {};
          const isSplit = userId.endsWith("_split");

          return (
            <li key={userId} className="rounded border p-4 shadow-sm">
              <div className="mb-2 font-semibold">
                {member.user.name ?? member.user.email}
                {isSplit && " (Split)"} — Balance: {member.balance}
              </div>

              {ownerId === currentUserId ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="w-20">Bet:</label>
                    <input
                      type="number"
                      className="w-32 rounded border p-1"
                      value={data.bet ?? ""}
                      onChange={(e) =>
                        handleInputChange(userId, "bet", e.target.value)
                      }
                      min={0}
                    />
                    
                      <>
                        <button
                          className="rounded bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600"
                          onClick={() => handleDouble(userId)}
                        >
                          Double
                        </button>
                        <button
                          className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                          onClick={() => handleSplit(userId)}
                        >
                          Split
                        </button>
                      </>
                    
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="w-20">Result:</label>
                    <select
                      className="w-32 rounded border p-1"
                      value={data.result ?? ""}
                      onChange={(e) =>
                        handleInputChange(userId, "result", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      <option value="WIN">Win</option>
                      <option value="LOSS">Loss</option>
                      <option value="DRAW">Draw</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">Waiting for owner’s input…</div>
              )}
            </li>
          );
        })}
      </ol>

      {ownerId === currentUserId && (
        <button
          className="mt-8 rounded bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          onClick={handleSubmit}
          disabled={submitRoundMutation.status === "pending"}
        >
          Submit Round
        </button>
      )}
    </div>
  );
}
