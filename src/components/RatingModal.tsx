import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { StarRating } from "./StarRating";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface Photo {
  _id: Id<"photos">;
  title: string;
  imageUrl: string | null;
  user: { name: string; _id: string } | null;
}

interface RatingModalProps {
  photo: Photo;
  onClose: () => void;
}

export function RatingModal({ photo, onClose }: RatingModalProps) {
  const [creativity, setCreativity] = useState(0);
  const [technical, setTechnical] = useState(0);
  const [emotional, setEmotional] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratePhoto = useMutation(api.ratings.ratePhoto);
  const ratings = useQuery(api.ratings.getPhotoRatings, { photoId: photo._id });

  const handleSubmit = async () => {
    if (creativity === 0 || technical === 0 || emotional === 0) {
      toast.error("Please rate all categories");
      return;
    }

    setIsSubmitting(true);
    try {
      await ratePhoto({
        photoId: photo._id,
        creativity,
        technical,
        emotional,
      });
      toast.success("Rating submitted! +5 XP earned");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (ratings?.userRating) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Your Rating
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Creativity
              </label>
              <StarRating rating={ratings.userRating.creativity} readonly />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Technical Quality
              </label>
              <StarRating rating={ratings.userRating.technical} readonly />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emotional Impact
              </label>
              <StarRating rating={ratings.userRating.emotional} readonly />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Rate Photo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {photo.imageUrl && (
          <div className="mb-4">
            <img
              src={photo.imageUrl}
              alt={photo.title}
              className="w-full h-48 object-cover rounded-lg"
            />
            <h3 className="font-semibold text-gray-900 dark:text-white mt-2">
              {photo.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              by {photo.user?.name}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Creativity ({creativity}/5)
            </label>
            <StarRating 
              rating={creativity} 
              onRatingChange={setCreativity}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Technical Quality ({technical}/5)
            </label>
            <StarRating 
              rating={technical} 
              onRatingChange={setTechnical}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emotional Impact ({emotional}/5)
            </label>
            <StarRating 
              rating={emotional} 
              onRatingChange={setEmotional}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || creativity === 0 || technical === 0 || emotional === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      </div>
    </div>
  );
}
