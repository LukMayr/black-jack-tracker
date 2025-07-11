// src/server/api/routers/room.ts

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { nanoid } from "nanoid";

export const roomRouter = createTRPCRouter({
  // Create a new room and assign the user as OWNER
  createRoom: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const inviteCode = nanoid(6);

      const room = await db.room.create({
        data: {
          name: input.name,
          inviteCode,
          userRooms: {
            create: {
              userId: ctx.session.user.id,
              role: "OWNER",
            },
          },
        },
      });

      return room;
    }),

  // Join a room using invite code, assign PLAYER role
  joinRoomByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.db.room.findUnique({
        where: { inviteCode: input.code },
      });
      if (!room)
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

      // Check if already joined
      const existing = await ctx.db.userRoom.findUnique({
        where: {
          userId_roomId: {
            userId: ctx.session.user.id,
            roomId: room.id,
          },
        },
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Already joined" });
      }

      await ctx.db.userRoom.create({
        data: {
          userId: ctx.session.user.id,
          roomId: room.id,
          // balance defaults to 2000 because of Prisma schema default
          role: "PLAYER",
        },
      });

      return room;
    }),

  // Get all rooms the user is part of, including role
  getMyRooms: protectedProcedure.query(async ({ ctx }) => {
    const rooms = await db.userRoom.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        room: true,
      },
    });

    return rooms.map((userRoom) => ({
      id: userRoom.room.id,
      name: userRoom.room.name,
      inviteCode: userRoom.room.inviteCode,
      role: userRoom.role,
    }));
  }),

  getRoomById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userRoom = await ctx.db.userRoom.findFirst({
        where: {
          roomId: input.id,
          userId: ctx.session.user.id,
        },
        select: {
          room: {
            select: {
              id: true,
              name: true,
              inviteCode: true,
            },
          },
          role: true,
        },
      });

      if (!userRoom) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found or you don't have access",
        });
      }

      const members = await ctx.db.userRoom.findMany({
        where: { roomId: input.id },
        select: {
          user: { select: { id: true, name: true, email: true } },
          balance: true,
          role: true,
        },
        orderBy: [{ balance: "desc" }, { user: { name: "asc" } }],
      });

      return {
        ...userRoom.room,
        role: userRoom.role,
        ownerId: userRoom.role === "OWNER" ? ctx.session.user.id : undefined,
        members,
      };
    }),

  startGameSession: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // For now, just create a new game session with current date & roomId
      const newSession = await ctx.db.gameSession.create({
        data: {
          roomId: input.roomId,
          date: new Date(),
        },
      });
      return newSession;
    }),

  // Kick a user from a room (OWNER only)
  kickUser: protectedProcedure
    .input(z.object({ roomId: z.string(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check if caller is owner of the room
      const owner = await db.userRoom.findUnique({
        where: {
          userId_roomId: {
            userId: ctx.session.user.id,
            roomId: input.roomId,
          },
        },
      });
      if (!owner || owner.role !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners can remove users",
        });
      }

      // Cannot kick self
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Owner cannot remove themselves",
        });
      }

      // Delete userRoom entry
      await db.userRoom.delete({
        where: {
          userId_roomId: {
            userId: input.userId,
            roomId: input.roomId,
          },
        },
      });

      return { success: true };
    }),
});
