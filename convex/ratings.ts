import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const ratePhoto = mutation({
  args: {
    photoId: v.id("photos"),
    creativity: v.number(),
    technical: v.number(),
    emotional: v.number(),
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

    // Check if user already rated this photo
    const existingRating = await ctx.db
      .query("ratings")
      .withIndex("by_photo_user", (q) => 
        q.eq("photoId", args.photoId).eq("userId", userProfile._id)
      )
      .first();

    if (existingRating) {
      throw new Error("You have already rated this photo");
    }

    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      throw new Error("Photo not found");
    }

    // Can't rate your own photo
    if (photo.uploadedBy === userProfile._id) {
      throw new Error("You cannot rate your own photo");
    }

    const overall = (args.creativity + args.technical + args.emotional) / 3;

    // Create rating
    await ctx.db.insert("ratings", {
      photoId: args.photoId,
      userId: userProfile._id,
      creativity: args.creativity,
      technical: args.technical,
      emotional: args.emotional,
      overall,
      ratedAt: Date.now(),
    });

    // Update photo's average rating
    const allRatings = await ctx.db
      .query("ratings")
      .withIndex("by_photo", (q) => q.eq("photoId", args.photoId))
      .collect();

    const averageRating = allRatings.reduce((sum, r) => sum + r.overall, 0) / allRatings.length;

    await ctx.db.patch(args.photoId, {
      averageRating,
      totalRatings: allRatings.length,
    });

    // Award XP to rater
    await ctx.db.patch(userProfile._id, {
      xp: (userProfile.xp ?? 0) + 5,
      level: Math.floor(((userProfile.xp ?? 0) + 5) / 100) + 1,
    });

    await ctx.db.insert("xpTransactions", {
      userId: userProfile._id,
      amount: 5,
      reason: "Rating a photo",
      relatedId: args.photoId,
      timestamp: Date.now(),
    });

    return { averageRating, totalRatings: allRatings.length };
  },
});

export const getPhotoRatings = query({
  args: { photoId: v.id("photos") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_photo", (q) => q.eq("photoId", args.photoId))
      .collect();

    const userId = await getAuthUserId(ctx);
    let userRating = null;

    if (userId) {
      const user = await ctx.db.get(userId);
      if (user) {
        const userProfile = await ctx.db
          .query("users")
          .withIndex("by_name", (q) => q.eq("name", user.name!))
          .first();
        
        if (userProfile) {
          userRating = ratings.find(r => r.userId === userProfile._id) || null;
        }
      }
    }

    const averages = {
      creativity: ratings.reduce((sum, r) => sum + r.creativity, 0) / ratings.length || 0,
      technical: ratings.reduce((sum, r) => sum + r.technical, 0) / ratings.length || 0,
      emotional: ratings.reduce((sum, r) => sum + r.emotional, 0) / ratings.length || 0,
      overall: ratings.reduce((sum, r) => sum + r.overall, 0) / ratings.length || 0,
    };

    return {
      averages,
      totalRatings: ratings.length,
      userRating,
    };
  },
});
