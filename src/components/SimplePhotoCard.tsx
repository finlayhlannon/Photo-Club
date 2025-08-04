import { useState } from "react";
import { Photo } from "./PhotoCard";
import { PhotoModal } from "./PhotoModal";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface SimplePhotoCardProps {
  photo: Photo;
  onDeletePhoto?: (photoId: Id<"photos">) => Promise<void>;
}

export function SimplePhotoCard({ photo, onDeletePhoto }: SimplePhotoCardProps) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const user = useQuery(api.auth.loggedInUser);
  const userId = user?._id || null;

  if (!photo.imageUrl) {
    return (
      <div className="relative overflow-hidden">
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse" style={{ aspectRatio: '1/1' }} />
      </div>
    );
  }

  return (
    <>
      <div 
        className="relative overflow-hidden cursor-pointer"
        onClick={() => setShowPhotoModal(true)}
      >
        {!imageLoaded && (
          <div className="bg-gray-200 dark:bg-gray-700 animate-pulse" style={{ aspectRatio: '1/1' }} />
        )}
        <img
          src={photo.imageUrl}
          alt={photo.title}
          className={`w-full h-auto object-contain ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          style={{ display: 'block' }}
        />
      </div>

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
