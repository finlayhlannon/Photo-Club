import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createContest = mutation({
  args: {
    name: v.string(),
    theme: v.string(),
    description: v.string(),
    deadline: v.number(),
    entryLimit: v.number(),
    isMinichallenge: v.boolean(),
    xpReward: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", user.name!))
      .first();

    if (!userProfile || !(userProfile.isAdmin ?? false)) {
      throw new Error("Admin access required");
    }

    return await ctx.db.insert("contests", {
      name: args.name,
      theme: args.theme,
      description: args.description,
      deadline: args.deadline,
      entryLimit: args.entryLimit,
      createdBy: userProfile._id,
      createdAt: Date.now(),
      status: "active",
      isMinichallenge: args.isMinichallenge,
      xpReward: args.xpReward,
    });
  },
});

export const getContests = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let contests;
    
    if (args.status) {
      contests = await ctx.db
        .query("contests")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .order("desc")
        .collect();
    } else {
      contests = await ctx.db
        .query("contests")
        .order("desc")
        .collect();
    }

    const contestsWithDetails = await Promise.all(
      contests.map(async (contest) => {
        const entries = await ctx.db
          .query("photos")
          .withIndex("by_contest", (q) => q.eq("contestId", contest._id))
          .collect();

        const creator = await ctx.db.get(contest.createdBy);

        return {
          ...contest,
          entryCount: entries.length,
          creator: creator ? { name: creator.name ?? "Unknown" } : { name: "Unknown" },
        };
      })
    );

    return contestsWithDetails;
  },
});

export const getContestDetails = query({
  args: { contestId: v.id("contests") },
  handler: async (ctx, args) => {
    const contest = await ctx.db.get(args.contestId);
    if (!contest) {
      return null;
    }

    const entries = await ctx.db
      .query("photos")
      .withIndex("by_contest", (q) => q.eq("contestId", args.contestId))
      .collect();

    const entriesWithDetails = await Promise.all(
      entries.map(async (photo) => {
        const imageUrl = await ctx.storage.getUrl(photo.imageId);
        const user = await ctx.db.get(photo.uploadedBy);
        return {
          ...photo,
          imageUrl,
          user: user ? { name: user.name ?? "Unknown", _id: user._id } : { name: "Unknown", _id: photo.uploadedBy },
        };
      })
    );

    const creator = await ctx.db.get(contest.createdBy);

    return {
      ...contest,
      entries: entriesWithDetails,
      creator: creator ? { name: creator.name ?? "Unknown" } : { name: "Unknown" },
    };
  },
});

export const updateContestStatus = mutation({
  args: {
    contestId: v.id("contests"),
    status: v.union(v.literal("active"), v.literal("judging"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", user.name!))
      .first();

    if (!userProfile || !(userProfile.isAdmin ?? false)) {
      throw new Error("Admin access required");
    }

    await ctx.db.patch(args.contestId, { status: args.status });
    return args.contestId;
  },
});
