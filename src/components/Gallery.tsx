import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SimplePhotoCard } from "./SimplePhotoCard";

export function Gallery() {
  const photos = useQuery(api.photos.getPhotos, {
    limit: 50,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📸 Photo Gallery
        </h1>
      </div>

      {/* Photos Grid */}
      {photos === undefined ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading photos...</p>
          </div>
        </div>
      ) : photos !== null && photos.length > 0 ? (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {photos.map((photo) => (
            <div key={photo._id} className="break-inside-avoid">
              <SimplePhotoCard photo={photo} />
            </div>
          ))}
        </div>
      ) : photos === null ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error loading photos
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            There was an error loading the photos. Please try again.
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No photos found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Be the first to upload a photo!
          </p>
        </div>
      )}
    </div>
  );
}
