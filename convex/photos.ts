import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const uploadPhoto = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    imageId: v.id("_storage"),
    category: v.string(),
    contestId: v.optional(v.id("contests")),
    isPublic: v.boolean(),
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

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const photoId = await ctx.db.insert("photos", {
      title: args.title,
      description: args.description,
      imageId: args.imageId,
      category: args.category,
      tags: [], // Empty array for tags
      uploadedBy: userProfile._id,
      uploadedAt: Date.now(),
      contestId: args.contestId,
      totalRatings: 0,
      isPublic: args.isPublic,
    });

    // Award XP for uploading
    await ctx.db.patch(userProfile._id, {
      xp: (userProfile.xp ?? 0) + 10,
      level: Math.floor(((userProfile.xp ?? 0) + 10) / 100) + 1,
    });

    await ctx.db.insert("xpTransactions", {
      userId: userProfile._id,
      amount: 10,
      reason: "Photo upload",
      relatedId: photoId,
      timestamp: Date.now(),
    });

    return photoId;
  },
});

export const submitPhotoToContest = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    imageId: v.id("_storage"),
    category: v.string(),
    contestId: v.id("contests"),
    isPublic: v.boolean(),
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

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Check if user already submitted a photo to this contest
    const existingEntry = await ctx.db
      .query("photos")
      .withIndex("by_contest", (q) => q.eq("contestId", args.contestId))
      .filter((q) => q.eq(q.field("uploadedBy"), userProfile._id))
      .first();

    if (existingEntry) {
      throw new Error("You have already submitted a photo to this contest");
    }

    // Check if contest exists and is active
    const contest = await ctx.db.get(args.contestId);
    if (!contest) {
      throw new Error("Contest not found");
    }

    if (contest.status !== "active") {
      throw new Error("This contest is not currently accepting submissions");
    }

    // Check if contest deadline has passed
    if (contest.deadline < Date.now()) {
      throw new Error("The submission deadline for this contest has passed");
    }

    const photoId = await ctx.db.insert("photos", {
      title: args.title,
      description: args.description,
      imageId: args.imageId,
      category: args.category,
      tags: [], // Empty array for tags
      uploadedBy: userProfile._id,
      uploadedAt: Date.now(),
      contestId: args.contestId,
      totalRatings: 0,
      isPublic: args.isPublic,
    });

    // Award XP for contest participation
    const xpReward = contest.xpReward > 0 ? Math.floor(contest.xpReward / 10) : 10;
    await ctx.db.patch(userProfile._id, {
      xp: (userProfile.xp ?? 0) + xpReward,
      level: Math.floor(((userProfile.xp ?? 0) + xpReward) / 100) + 1,
    });

    await ctx.db.insert("xpTransactions", {
      userId: userProfile._id,
      amount: xpReward,
      reason: "Contest submission",
      relatedId: photoId,
      timestamp: Date.now(),
    });

    return photoId;
  },
});

export const getPhotos = query({
  args: {
    category: v.optional(v.string()),
    contestId: v.optional(v.id("contests")),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let photos;

    if (args.category) {
      photos = await ctx.db
        .query("photos")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.contestId) {
      photos = await ctx.db
        .query("photos")
        .withIndex("by_contest", (q) => q.eq("contestId", args.contestId!))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.userId) {
      photos = await ctx.db
        .query("photos")
        .withIndex("by_user", (q) => q.eq("uploadedBy", args.userId!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      photos = await ctx.db
        .query("photos")
        .withIndex("by_date")
        .order("desc")
        .take(args.limit || 50);
    }

    // Get photo URLs and user info
    const photosWithDetails = await Promise.all(
      photos.map(async (photo) => {
        const imageUrl = await ctx.storage.getUrl(photo.imageId);
        const user = await ctx.db.get(photo.uploadedBy);
        return {
          ...photo,
          imageUrl,
          user: user ? { name: user.name ?? "Unknown", _id: user._id } : null,
        };
      })
    );

    return photosWithDetails.filter(p => p.isPublic || args.userId === p.uploadedBy);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getTopRatedPhotos = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_rating")
      .order("desc")
      .filter((q) => q.neq(q.field("averageRating"), undefined))
      .take(args.limit || 10);

    const photosWithDetails = await Promise.all(
      photos.map(async (photo) => {
        const imageUrl = await ctx.storage.getUrl(photo.imageId);
        const user = await ctx.db.get(photo.uploadedBy);
        return {
          ...photo,
          imageUrl,
          user: user ? { name: user.name ?? "Unknown", _id: user._id } : null,
        };
      })
    );

    return photosWithDetails.filter(p => p.isPublic);
  },
});

export const deletePhoto = mutation({
  args: {
    photoId: v.id("photos"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      throw new Error("Photo not found");
    }

    // Check if user owns the photo
    if (photo.uploadedBy !== userId) {
      throw new Error("You can only delete your own photos");
    }

    // Delete the photo
    await ctx.db.delete(args.photoId);

    // Delete associated ratings
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_photo", (q) => q.eq("photoId", args.photoId))
      .collect();
    
    for (const rating of ratings) {
      await ctx.db.delete(rating._id);
    }

    // Remove XP if it was awarded for uploading
    const user = await ctx.db.get(userId);
    if (user && user.name) {
      const userProfile = await ctx.db
        .query("users")
        .withIndex("by_name", (q) => q.eq("name", user.name))
        .first();

      if (userProfile) {
        await ctx.db.patch(userProfile._id, {
          xp: Math.max(0, (userProfile.xp ?? 0) - 10),
          level: Math.max(1, Math.floor(Math.max(0, (userProfile.xp ?? 0) - 10) / 100) + 1),
        });
      }
    }

    return true;
  },
});
