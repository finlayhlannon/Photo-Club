import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  users: defineTable({
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.string(),
    profilePicture: v.optional(v.id("_storage")),
    xp: v.optional(v.number()),
    level: v.optional(v.number()),
    isAdmin: v.optional(v.boolean()),
    joinedAt: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }).index("by_email", ["email"])
    .index("by_name", ["name"])
    .index("by_xp", ["xp"])
    .index("by_level", ["level"]),

  photos: defineTable({
    title: v.string(),
    description: v.string(),
    imageId: v.id("_storage"),
    category: v.string(),
    tags: v.array(v.string()),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    contestId: v.optional(v.id("contests")),
    averageRating: v.optional(v.number()),
    totalRatings: v.number(),
    isPublic: v.boolean(),
  }).index("by_user", ["uploadedBy"])
    .index("by_category", ["category"])
    .index("by_contest", ["contestId"])
    .index("by_rating", ["averageRating"])
    .index("by_date", ["uploadedAt"]),

  contests: defineTable({
    name: v.string(),
    theme: v.string(),
    description: v.string(),
    deadline: v.number(),
    entryLimit: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    status: v.union(v.literal("active"), v.literal("judging"), v.literal("completed")),
    isMinichallenge: v.boolean(),
    xpReward: v.number(),
  }).index("by_status", ["status"])
    .index("by_deadline", ["deadline"])
    .index("by_creator", ["createdBy"]),

  ratings: defineTable({
    photoId: v.id("photos"),
    userId: v.id("users"),
    creativity: v.number(),
    technical: v.number(),
    emotional: v.number(),
    overall: v.number(),
    ratedAt: v.number(),
  }).index("by_photo", ["photoId"])
    .index("by_user", ["userId"])
    .index("by_photo_user", ["photoId", "userId"]),

  xpTransactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    relatedId: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  awards: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("trophy"), v.literal("medal"), v.literal("badge")),
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    awardedAt: v.number(),
    contestId: v.optional(v.id("contests")),
  }).index("by_user", ["userId"])
    .index("by_type", ["type"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
