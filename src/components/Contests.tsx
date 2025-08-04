import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PhotoCard } from "./PhotoCard";
import { Upload } from "./Upload";
import type { Id } from "../../convex/_generated/dataModel";

export function Contests() {
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [selectedContest, setSelectedContest] = useState<Id<"contests"> | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const contests = useQuery(api.contests.getContests, { 
    status: selectedStatus === "all" ? undefined : selectedStatus 
  });

  // Only call getContestDetails if selectedContest is not null and is a valid Id
  const contestDetails = useQuery(
    api.contests.getContestDetails,
    selectedContest ? { contestId: selectedContest } : "skip"
  );

  const statusOptions = [
    { value: "active", label: "Active", icon: "🟢" },
    { value: "judging", label: "Judging", icon: "⚖️" },
    { value: "completed", label: "Completed", icon: "✅" },
    { value: "all", label: "All", icon: "📋" },
  ];

  // Show contest detail page only if a contest is selected and details are loaded (not undefined or null)
  if (selectedContest) {
    if (contestDetails === undefined) {
      // Still loading contest details
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading contest details...</p>
          </div>
        </div>
      );
    }
    if (contestDetails === null) {
      // Contest not found or error
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Contest not found
          </h3>
          <button
            onClick={() => setSelectedContest(null)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to contests
          </button>
        </div>
      );
    }
    // contestDetails is loaded and valid
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => setSelectedContest(null)}
            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <span>←</span>
            <span>Back to contests</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {contestDetails?.name || "Loading..."}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Theme: {contestDetails?.theme || "Loading..."}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {contestDetails?.isMinichallenge && (
                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm px-3 py-1 rounded-full">
                  Mini Challenge
                </span>
              )}
              <span className={`text-sm px-3 py-1 rounded-full ${
                contestDetails?.status === "active" 
                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  : contestDetails?.status === "judging"
                  ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}>
                {contestDetails?.status ? contestDetails.status.charAt(0).toUpperCase() + contestDetails.status.slice(1) : "Loading..."}
              </span>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {contestDetails?.description || "Loading..."}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Deadline:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {contestDetails?.deadline ? new Date(contestDetails.deadline).toLocaleDateString() : "Loading..."}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Entries:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {contestDetails?.entries ? contestDetails.entries.length : 0}/{contestDetails?.entryLimit || 0}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">XP Reward:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {contestDetails?.xpReward || 0} XP
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Created by:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {contestDetails?.creator?.name || "Unknown"}
              </div>
            </div>
          </div>
          
          {contestDetails?.status === "active" && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setShowUploadForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload Photo to Contest
              </button>
            </div>
          )}
        </div>

        {showUploadForm ? (
          <div className="mb-8">
            <Upload contestId={selectedContest} />
            <div className="mt-4">
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                ← Back to contest entries
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Contest Entries ({contestDetails?.entries?.length || 0})
            </h2>
          
          {contestDetails?.entries && contestDetails.entries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {contestDetails?.entries?.map((photo) => (
                <PhotoCard 
                  key={photo._id} 
                  photo={{
                    ...photo,
                    user: photo.user
                      ? {
                          name: photo.user.name ?? "Unknown",
                          _id: String(photo.user._id),
                        }
                      : { name: "Unknown", _id: "unknown" },
                  }}
                  showRating={contestDetails?.status !== "active"}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No entries yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Be the first to submit your photo!
              </p>
            </div>
          )}
        </div>
        )}
      </div>
    );
  }

  // Show loading spinner if contests is undefined (still loading)
  if (contests === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading contests...</p>
        </div>
      </div>
    );
  }

  // Show contest list if no contest is selected
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🏆 Photo Contests
        </h1>
      </div>

      {/* Status Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contests Grid */}
      {contests === undefined ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading contests...</p>
          </div>
        </div>
      ) : contests !== null && contests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map((contest) => (
            <div
              key={contest._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedContest(contest._id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {contest.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Theme: {contest.theme}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {contest.isMinichallenge && (
                    <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full">
                      Mini
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    contest.status === "active" 
                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                      : contest.status === "judging"
                      ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}>
                    {contest.status}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 overflow-hidden" style={{ 
                display: '-webkit-box', 
                WebkitLineClamp: 2, 
                WebkitBoxOrient: 'vertical' 
              }}>
                {contest.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Entries: {contest.entryCount || 0}/{contest.entryLimit}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {contest.xpReward} XP
                  </span>
                </div>

                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(((contest.entryCount || 0) / contest.entryLimit) * 100, 100)}%`
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Deadline: {new Date(contest.deadline).toLocaleDateString()}
                  </span>
                  <span>
                    by {contest.creator?.name || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : contests === null ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error loading contests
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            There was an error loading the contests. Please try again.
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No contests found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {selectedStatus === "active" 
              ? "No active contests at the moment."
              : `No ${selectedStatus} contests found.`
            }
          </p>
        </div>
      )}
    </div>
  );
}