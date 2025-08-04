import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createUserProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      name: args.name,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      xp: 0,
      level: 1,
      isAdmin: false,
      joinedAt: Date.now(),
    });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    profilePicture: v.optional(v.id("_storage")),
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
      .withIndex("by_email", (q) => q.eq("email", user.email!))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.profilePicture !== undefined) updates.profilePicture = args.profilePicture;

    await ctx.db.patch(userProfile._id, updates);
    return userProfile._id;
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Provide default values for missing fields and get profile picture URL
    let profilePictureUrl = null;
    if (user.profilePicture) {
      try {
        profilePictureUrl = await ctx.storage.getUrl(user.profilePicture);
      } catch (error) {
        console.error("Error getting profile picture URL:", error);
      }
    }

    const safeUser = {
      ...user,
      name: user.name ?? "Anonymous",
      xp: user.xp ?? 0,
      level: user.level ?? 1,
      isAdmin: user.isAdmin ?? false,
      profilePicture: profilePictureUrl,
    };

    // Get user's photos
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_user", (q) => q.eq("uploadedBy", args.userId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();

    // Get user's awards
    const awards = await ctx.db
      .query("awards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get photo URLs and user info for all photos
    const photosWithDetails = await Promise.all(
      photos.map(async (photo) => {
        const imageUrl = await ctx.storage.getUrl(photo.imageId);
        return {
          ...photo,
          imageUrl,
          user: { name: safeUser.name, _id: safeUser._id },
        };
      })
    );

    // Get top 3 highest rated photos
    const topPhotos = photosWithDetails
      .filter(p => p.averageRating !== undefined)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 3);

    return {
      ...safeUser,
      photos: photosWithDetails,
      awards,
      topPhotos,
      photoCount: photosWithDetails.length,
    };
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_xp")
      .order("desc")
      .take(20);

    return users;
  },
});

export const addXP = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newXP = (user.xp ?? 0) + args.amount;
    const newLevel = Math.floor(newXP / 100) + 1; // 100 XP per level

    await ctx.db.patch(args.userId, {
      xp: newXP,
      level: newLevel,
    });

    // Record XP transaction
    await ctx.db.insert("xpTransactions", {
      userId: args.userId,
      amount: args.amount,
      reason: args.reason,
      relatedId: args.relatedId,
      timestamp: Date.now(),
    });

    return { newXP, newLevel };
  },
});

export const generateProfileUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const completeUserProfile = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the user by email (should be unique)
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      firstName: args.firstName,
      lastName: args.lastName,
      name: args.name,
      xp: user.xp ?? 0,
      level: user.level ?? 1,
      isAdmin: user.isAdmin ?? false,
      joinedAt: user.joinedAt ?? Date.now(),
    });

    return user._id;
  },
});
