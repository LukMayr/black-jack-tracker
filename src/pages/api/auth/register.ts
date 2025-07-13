/*// /pages/api/auth/register.ts
import type { NextApiRequest } from "next";
import type { NextApiResponse } from "next";
import { hash } from "bcryptjs";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const existing = await db.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existing) {
    return res.status(409).json({ message: "User already exists" });
  }

  const passwordHash = await hash(password, 10);

  const user = await db.user.create({
    data: {
      email,
      username,
      passwordHash,
    },
  });

  return res.status(201).json({ message: "User created", userId: user.id });
}
*/