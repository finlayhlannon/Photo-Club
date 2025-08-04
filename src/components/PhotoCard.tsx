import { useState } from "react";
import { StarRating } from "./StarRating";
import { RatingModal } from "./RatingModal";
import { PhotoModal } from "./PhotoModal";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface Photo {
  _id: Id<"photos">;
  title: string;
  description: string;
  imageUrl: string | null;
  category: string;
  tags: string[];
  uploadedAt: number;
  averageRating?: number;
  totalRatings: number;
  user: { name: string; _id: string } | null;
}

interface PhotoCardProps {
  photo: Photo;
  showRating?: boolean;
  onDeletePhoto?: (photoId: Id<"photos">) => Promise<void>;
}

export function PhotoCard({ photo, showRating = true, onDeletePhoto }: PhotoCardProps) {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const user = useQuery(api.auth.loggedInUser);
  const userId = user?._id || null;

  if (!photo.imageUrl) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Image not available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-shadow duration-300">
        <div 
          className="relative aspect-square overflow-hidden cursor-pointer"
          onClick={() => setShowPhotoModal(true)}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Category badge */}
          <div className="absolute top-2 left-2">
            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {photo.category}
            </span>
          </div>

          {/* Rating overlay */}
          {photo.averageRating && (
            <div className="absolute top-2 right-2">
              <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm flex items-center space-x-1">
                <span>⭐</span>
                <span>{photo.averageRating.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 
              className="font-semibold text-gray-900 dark:text-white text-sm truncate cursor-pointer hover:underline"
              onClick={() => setShowPhotoModal(true)}
            >
              {photo.title}
            </h3>
          </div>

          <p 
            className="text-gray-600 dark:text-gray-300 text-xs mb-3 overflow-hidden cursor-pointer hover:underline" 
            style={{ 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical' 
            }}
            onClick={() => setShowPhotoModal(true)}
          >
            {photo.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
            <button
              onClick={() => {
                if (photo.user?._id) {
                  const event = new CustomEvent("navigateToProfile", { detail: photo.user._id as unknown as Id<"users"> });
                  window.dispatchEvent(event);
                }
              }}
              className="text-blue-600 hover:underline"
            >
              by {photo.user?.name ?? "Unknown"}
            </button>
            <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
          </div>

          {/* Tags */}
          {photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {photo.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => setShowPhotoModal(true)}
                >
                  #{tag}
                </span>
              ))}
              {photo.tags.length > 3 && (
                <span 
                  className="text-gray-400 text-xs cursor-pointer hover:underline"
                  onClick={() => setShowPhotoModal(true)}
                >
                  +{photo.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Rating section */}
          {showRating && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StarRating rating={photo.averageRating || 0} readonly size="sm" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({photo.totalRatings})
                </span>
              </div>
              
              <button
                onClick={() => setShowRatingModal(true)}
                className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                Rate
              </button>
            </div>
          )}
        </div>
      </div>

      {showRatingModal && (
        <RatingModal
          photo={photo}
          onClose={() => setShowRatingModal(false)}
        />
      )}

      {showPhotoModal && (
        <PhotoModal
          photo={photo}
          onClose={() => setShowPhotoModal(false)}
          userId={userId}
          onDeletePhoto={onDeletePhoto}
        />
      )}
    </>
  );
}
