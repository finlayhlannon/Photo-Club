import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SimplePhotoCard } from "./SimplePhotoCard";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface ProfileProps {
  userId?: Id<"users"> | null;
}

export function Profile({ userId }: ProfileProps) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userProfile = useQuery(api.users.getUserProfile, { userId: userId ?? (loggedInUser?._id as Id<"users">) });
  const updateProfile = useMutation(api.users.updateProfile);
  const deletePhoto = useMutation(api.photos.deletePhoto);

  const [editOpen, setEditOpen] = useState(false);

  if (!loggedInUser || !userProfile) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const user = loggedInUser;
  const isViewingOtherProfile = userId && userId !== loggedInUser._id;

  const name = userProfile.name ?? user.name ?? "Anonymous";
  const level = userProfile.level ?? 1;
  const xp = userProfile.xp ?? 0;
  const isAdmin = userProfile.isAdmin ?? false;

  const xpToNextLevel = (level * 100) - xp;
  const progressPercentage = ((xp % 100) / 100) * 100;

  const handleDeletePhoto = async (photoId: Id<"photos">) => {
    if (!confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      return;
    }

    try {
      await deletePhoto({ photoId });
      toast.success("Photo deleted successfully");
      // Refresh the page to reflect the changes
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete photo");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-start space-x-6">
          <div>
            {userProfile.profilePicture ? (
              <img 
                src={userProfile.profilePicture} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                }}
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            {!isViewingOtherProfile && (
              <button
                className="mt-2 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs"
                onClick={() => setEditOpen(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {name}
              </h1>
              {isAdmin && (
                <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded-full">
                  Admin
                </span>
              )}
              {isViewingOtherProfile && (
                <button
                  className="ml-auto px-3 py-1 rounded bg-blue-600 text-white text-xs"
                  onClick={() => {
                    // Navigate back to own profile
                    const event = new CustomEvent("navigateToProfile", { detail: loggedInUser._id });
                    window.dispatchEvent(event);
                  }}
                >
                  View My Profile
                </button>
              )}
            </div>

            {/* Bio */}
            {userProfile.bio && (
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {userProfile.bio}
                </p>
              </div>
            )}

            {/* XP and Level */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Level {level}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {xp} XP ({xpToNextLevel} to next level)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Rated Photos */}
      {userProfile.topPhotos && userProfile.topPhotos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ⭐ Top Rated Photos
          </h2>
          <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
            {userProfile.topPhotos.map((photo) => (
              <div key={photo._id} className="break-inside-avoid">
                <SimplePhotoCard photo={photo} onDeletePhoto={handleDeletePhoto} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Photos */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📸 My Photos ({userProfile.photoCount ?? 0})
        </h2>
        
        {userProfile.photos && userProfile.photos.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {userProfile.photos.map((photo) => (
              <div key={photo._id} className="break-inside-avoid">
                <SimplePhotoCard photo={photo} onDeletePhoto={handleDeletePhoto} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No photos yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Upload your first photo to get started!
            </p>
          </div>
        )}
      </div>
      {editOpen && (
        <EditProfileModal
          userProfile={userProfile}
          onClose={() => setEditOpen(false)}
          onSave={async (fields: any) => {
            await updateProfile(fields);
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

// EditProfileModal component
function EditProfileModal({ userProfile, onClose, onSave }: { 
  userProfile: any; 
  onClose: () => void; 
  onSave: (fields: any) => Promise<void>; 
}) {
  const [bio, setBio] = useState(userProfile.bio || "");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const generateUploadUrl = useMutation(api.users.generateProfileUploadUrl);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let profilePictureId = userProfile.profilePicture;
      
      if (profilePicture) {
        setUploading(true);
        
        // Get upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Upload file
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": profilePicture.type },
          body: profilePicture,
        });
        
        if (!response.ok) {
          throw new Error("Failed to upload profile picture");
        }
        
        const { storageId } = await response.json();
        profilePictureId = storageId;
        setUploading(false);
      }
      
      // Only include profilePicture if it was changed
      const updates: any = { bio };
      if (profilePictureId !== userProfile.profilePicture) {
        updates.profilePicture = profilePictureId;
      }
      
      await onSave(updates);
      
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Tell us about yourself..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Profile Picture
            </label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {preview && (
              <img src={preview} alt="Preview" className="w-24 h-24 rounded-full mt-2 object-cover" />
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// If you have any code referencing photo/user IDs, use Id<T> type from dataModel
// For example, if you use selectedPhoto, type it as Id<"photos">
