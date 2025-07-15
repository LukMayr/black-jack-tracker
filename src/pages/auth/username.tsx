// pages/auth/username.tsx
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { useState } from "react";

export default function UsernamePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const updateUsername = api.user.updateUsername.useMutation({
    onSuccess: () => router.push("/"), // or home page
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setError("Username cannot be empty.");
    updateUsername.mutate({ username });
  };

  return (
    <div className="mx-auto mt-20 max-w-md px-4">
      <h1 className="mb-4 text-2xl font-bold">Choose a Username</h1>
      <form onSubmit={handleSubmit}>
        <input
          className="mb-2 w-full rounded border p-2"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
        {error && <p className="mb-2 text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
        >
          Save Username
        </button>
      </form>
    </div>
  );
}
