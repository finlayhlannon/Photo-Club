import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Leaderboard() {
  const leaderboard = useQuery(api.users.getLeaderboard);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📊 Leaderboard
        </h1>
      </div>

      {leaderboard === undefined ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading leaderboard...</p>
          </div>
        </div>
      ) : leaderboard !== null && leaderboard.length > 0 ? (
        <div className="space-y-4">
          {leaderboard.map((user, index) => (
            <div
              key={String(user._id)}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                index < 3 ? "ring-2 ring-yellow-400 dark:ring-yellow-500" : ""
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600" :
                    index === 1 ? "bg-gradient-to-br from-gray-400 to-gray-600" :
                    index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                    "bg-gradient-to-br from-blue-500 to-purple-600"
                  }`}>
                    {index < 3 ? (
                      index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"
                    ) : (
                      `#${index + 1}`
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {user.name ?? ""}
                    </h3>
                    {user.isAdmin && (
                      <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Joined {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : ""}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user.xp || 0} XP
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Level {user.level || 1}
                  </div>
                </div>
              </div>

              {/* Progress bar for current level */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Level {user.level || 1}</span>
                  <span>{(user.xp || 0) % 100}/100 XP</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((user.xp || 0) % 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : leaderboard === null ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error loading leaderboard
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            There was an error loading the leaderboard. Please try again.
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👑</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No users yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Be the first to join the leaderboard!
          </p>
        </div>
      )}
    </div>
  );
}
