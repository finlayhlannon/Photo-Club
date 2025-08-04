import { useEffect, useRef, useState } from "react";
import { Photo } from "./PhotoCard";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { StarRating } from "./StarRating";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RatingModal } from "./RatingModal";

interface PhotoModalProps {
  photo: Photo;
  onClose: () => void;
  userId?: Id<"users"> | null;
  onDeletePhoto?: (photoId: Id<"photos">) => Promise<void>;
}

export function PhotoModal({ photo, onClose, userId, onDeletePhoto }: PhotoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Close modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log("handleClickOutside event target:", event.target);
      console.log("overlayRef.current:", overlayRef.current);
      if (overlayRef.current && event.target === overlayRef.current) {
        console.log("Click outside detected, closing modal");
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  const handleDeletePhoto = async () => {
    if (!onDeletePhoto) return;
    
    if (!confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      return;
    }

    try {
      await onDeletePhoto(photo._id);
      toast.success("Photo deleted successfully");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete photo");
    }
  };

  const isUsersPhoto = userId && photo.user && userId === photo.user._id;

  const ratings = useQuery(api.ratings.getPhotoRatings, { photoId: photo._id });
  const userHasRated = ratings?.userRating != null;

  console.log("ratings:", ratings);
  console.log("userHasRated:", userHasRated);

  return (
    <>
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Photo Details
            </h2>
            <div className="flex items-center space-x-2">
              {isUsersPhoto && onDeletePhoto && (
                <button
                  onClick={handleDeletePhoto}
                  className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Delete photo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6">
            {photo.imageUrl && (
              <div className="mb-6">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {photo.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {photo.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Category</h4>
                  <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                    {photo.category}
                  </span>
                </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Uploaded by</h4>
                <button
                  onClick={() => {
                    if (photo.user?._id) {
                      const event = new CustomEvent("navigateToProfile", { detail: photo.user._id });
                      window.dispatchEvent(event);
                      onClose();
                    }
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {photo.user?.name ?? "Unknown"}
                </button>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Date</h4>
                <p className="text-gray-700 dark:text-gray-300">
                  {new Date(photo.uploadedAt).toLocaleDateString()}
                </p>
              </div>

                {photo.averageRating && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Average Rating</h4>
                    <div className="flex items-center space-x-2">
                      <StarRating rating={photo.averageRating} readonly />
                      <span className="text-gray-700 dark:text-gray-300">
                        {photo.averageRating.toFixed(1)} ({photo.totalRatings} ratings)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rating Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Your Rating
                  </h4>
                  {!userHasRated && (
                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors"
                    >
                      Rate this photo
                    </button>
                  )}
                </div>
                
                {userHasRated && ratings?.userRating ? (
                  <div className="mt-3">
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                          <span>Creativity</span>
                          <span>{ratings.userRating.creativity}/5</span>
                        </div>
                        <StarRating rating={ratings.userRating.creativity} readonly size="sm" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                          <span>Technical Quality</span>
                          <span>{ratings.userRating.technical}/5</span>
                        </div>
                        <StarRating rating={ratings.userRating.technical} readonly size="sm" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                          <span>Emotional Impact</span>
                          <span>{ratings.userRating.emotional}/5</span>
                        </div>
                        <StarRating rating={ratings.userRating.emotional} readonly size="sm" />
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View details
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                    You haven't rated this photo yet. Click "Rate this photo" to share your feedback!
                  </p>
                )}
              </div>

              {photo.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {photo.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRatingModal && (
        <RatingModal
          photo={photo}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </>
  );
}
