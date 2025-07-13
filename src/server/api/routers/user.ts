// server/api/routers/user.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  updateUsername: protectedProcedure
    .input(z.object({ username: z.string().min(3) }))
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.user.findFirst({
        where: { username: input.username },
      });

      if (exists) {
        throw new Error("Username already taken");
      }

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { username: input.username },
      });

      return { success: true };
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });
    return user;
  }),
});
