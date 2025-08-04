import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PhotoCard } from "./PhotoCard";

export function Home({ isAdmin = false }: { isAdmin?: boolean }) {
  const topPhotos = useQuery(api.photos.getTopRatedPhotos, { limit: 6 });
  const recentPhotos = useQuery(api.photos.getPhotos, { limit: 8 });
  const activeContests = useQuery(api.contests.getContests, { status: "active" });
  const leaderboard = useQuery(api.users.getLeaderboard);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
          SMUS Photography Club
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Join contests and events while building your portfolio!
        </p>
      </div>

      {/* Stats - Only visible to admins */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {recentPhotos?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Photos</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeContests?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Active Contests</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {leaderboard?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Members</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {topPhotos?.reduce((sum, p) => sum + (p.totalRatings || 0), 0) || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Ratings</div>
          </div>
        </div>
      )}

      {/* Top Rated Photos */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🌟 Top Rated Photos
          </h2>
        </div>
        
        {topPhotos === undefined ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading top photos...
          </div>
        ) : topPhotos !== null && topPhotos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topPhotos.map((photo) => (
              <PhotoCard key={photo._id} photo={photo} />
            ))}
          </div>
        ) : topPhotos === null ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Error loading top photos.
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No photos yet. Be the first to upload!
          </div>
        )}
      </section>

      {/* Active Contests */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🏆 Active Contests
          </h2>
        </div>
        
        {activeContests === undefined ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading contests...
          </div>
        ) : activeContests !== null && activeContests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeContests.slice(0, 4).map((contest) => (
              <div
                key={contest._id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {contest.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Theme: {contest.theme}
                    </p>
                  </div>
                  {contest.isMinichallenge && (
                    <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full">
                      Mini Challenge
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {contest.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {contest.entryCount || 0}/{contest.entryLimit} entries
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Ends: {new Date(contest.deadline).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(((contest.entryCount || 0) / contest.entryLimit) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : activeContests === null ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Error loading contests.
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No active contests at the moment.
          </div>
        )}
      </section>

      {/* Top Contributors */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            👑 Top Contributors
          </h2>
        </div>
        
        {leaderboard === undefined ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading leaderboard...
          </div>
        ) : leaderboard !== null && leaderboard.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaderboard.slice(0, 3).map((user, index) => (
              <div
                key={user._id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="text-3xl mb-2">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {user.name}
                </h3>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {user.xp} XP
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Level {user.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : leaderboard === null ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Error loading leaderboard.
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No contributors yet.
          </div>
        )}
      </section>
    </div>
  );
}

// If you have any code referencing contest/photo/user IDs, use Id<T> type from dataModel
// For example, if you use selectedContest or selectedPhoto, type them as Id<"contests"> or Id<"photos">
