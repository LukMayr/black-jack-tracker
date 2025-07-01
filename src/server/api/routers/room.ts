import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const roomRouter = createTRPCRouter({
  createRoom: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const inviteCode = Math.random().toString(36).substring(2, 8);
      const room = await db.room.create({
        data: {
          name: input.name,
          inviteCode,
          userRooms: {
            create: {
              userId: ctx.session.user.id,
            },
          },
        },
      });
      return room;
    }),

  joinRoomByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const room = await db.room.findUnique({
        where: { inviteCode: input.code },
      });
      if (!room) throw new Error("Room not found");

      await db.userRoom.upsert({
        where: {
          userId_roomId: {
            userId: ctx.session.user.id,
            roomId: room.id,
          },
        },
        create: {
          userId: ctx.session.user.id,
          roomId: room.id,
        },
        update: {},
      });

      return room;
    }),

  getMyRooms: protectedProcedure.query(async ({ ctx }) => {
    return db.room.findMany({
      where: {
        userRooms: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
    });
  }),
});
