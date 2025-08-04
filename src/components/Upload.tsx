import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

type Page = "home" | "profile" | "contests" | "gallery" | "leaderboard" | "admin" | "upload";

const categories = [
  "Portrait",
  "Landscape", 
  "Street",
  "Nature",
  "Architecture",
  "Abstract",
  "Sports",
  "Events",
  "Other"
];

export function Upload({ contestId, setCurrentPage }: { contestId?: Id<"contests">, setCurrentPage?: (page: Page) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const uploadPhoto = useMutation(api.photos.uploadPhoto);
  const submitPhotoToContest = useMutation(api.photos.submitPhotoToContest);
  
  // If we're submitting to a contest, check if user already has an entry
  const userContestEntry = useQuery(
    api.contests.getContestDetails,
    contestId ? { contestId } : "skip"
  );
  
  const hasExistingEntry = contestId && userContestEntry?.entries?.some(
    entry => entry.user?._id === userContestEntry.entries[0]?.user?._id
  );
  
  const isContestClosed = contestId && userContestEntry && (
    userContestEntry.status !== "active" || 
    userContestEntry.deadline < Date.now()
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("File size must be less than 10MB");
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !title || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    // If submitting to a contest, check restrictions
    if (contestId) {
      if (hasExistingEntry) {
        toast.error("You have already submitted a photo to this contest");
        return;
      }
      
      if (isContestClosed) {
        toast.error("This contest is not currently accepting submissions");
        return;
      }
    }

    setIsUploading(true);
    
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      
      if (!result.ok) {
        throw new Error("Failed to upload image");
      }
      
      const { storageId } = await result.json();
      
      // Save photo metadata
      if (contestId) {
        await submitPhotoToContest({
          title,
          description,
          imageId: storageId,
          category,
          contestId,
          isPublic,
        });
        toast.success("Photo submitted to contest successfully!");
      } else {
        await uploadPhoto({
          title,
          description,
          imageId: storageId,
          category,
          isPublic,
        });
        toast.success("Photo uploaded successfully! +10 XP earned");
        if (setCurrentPage) {
          setCurrentPage("profile");
        }
      }
      
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setIsPublic(true);
      setSelectedFile(null);
      setPreview(null);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {contestId ? "📤 Submit to Contest" : "📤 Upload Photo"}
        </h1>
        
        {contestId && userContestEntry && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h2 className="font-semibold text-blue-800 dark:text-blue-200">
              Submitting to: {userContestEntry.name}
            </h2>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Theme: {userContestEntry.theme}
            </p>
            {hasExistingEntry && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-300">
                ⚠️ You have already submitted a photo to this contest
              </div>
            )}
            {isContestClosed && !hasExistingEntry && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-300">
                ⚠️ This contest is not currently accepting submissions
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo *
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center relative">
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                tabIndex={-1}
                style={{ zIndex: 2 }}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter photo title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Describe your photo..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility 
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Make this photo public
              </span>
            </label>
          </div>*/}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading || !selectedFile || !title || !category || (contestId && (!!hasExistingEntry || !!isContestClosed))}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? "Submitting..." : contestId ? "Submit to Contest" : "Upload Photo"}
          </button>
        </form>
      </div>
    </div>
  );
}
