import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import type { Result } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const roundRouter = createTRPCRouter({
  submitRound: protectedProcedure
    .input(
      z.object({
        gameSessionId: z.string(),
        entries: z.array(
          z.object({
            userId: z.string(),
            amount: z.number(),
            result: z.enum(["WIN", "LOSS", "DRAW"]),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { gameSessionId, entries } = input;

      // 1️⃣ Get game session to retrieve roomId
      const gameSession = await ctx.db.gameSession.findUnique({
        where: { id: gameSessionId },
      });

      if (!gameSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game session not found",
        });
      }

      const roomId = gameSession.roomId;

      // 2️⃣ Create all entries
      await ctx.db.entry.createMany({
        data: entries.map((entry) => ({
          userId: entry.userId,
          gameSessionId,
          amount: entry.amount,
          result: entry.result as Result,
        })),
      });

      // 3️⃣ Apply balance changes
      const balanceUpdates = entries.map((entry) => {
        let change = 0;

        switch (entry.result) {
          case "WIN":
            change = entry.amount;
            break;
          case "LOSS":
            change = -entry.amount;
            break;
          case "DRAW":
            change = 0;
            break;
        }

        return ctx.db.userRoom.updateMany({
          where: {
            userId: entry.userId,
            roomId: roomId,
          },
          data: {
            balance: { increment: change },
          },
        });
      });

      await ctx.db.$transaction(balanceUpdates);

      return { success: true };
    }),
});