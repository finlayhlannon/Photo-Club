import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function AdminPanel() {
  const [showCreateContest, setShowCreateContest] = useState(false);
  const user = useQuery(api.auth.loggedInUser);
  const contests = useQuery(api.contests.getContests, {});
  
  if (!user?.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ⚙️ Admin Panel
        </h1>
        <button
          onClick={() => setShowCreateContest(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Contest
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {contests?.length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Total Contests</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {contests?.filter(c => c.status === "active").length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Active Contests</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {contests?.filter(c => c.status === "judging").length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">In Judging</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {contests?.filter(c => c.status === "completed").length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
        </div>
      </div>

      {/* Contest Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Contest Management
        </h2>
        
        {contests && contests.length > 0 ? (
          <div className="space-y-4">
            {contests.map((contest) => (
              <ContestRow key={contest._id} contest={contest} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No contests created yet.
          </div>
        )}
      </div>

      {showCreateContest && (
        <CreateContestModal onClose={() => setShowCreateContest(false)} />
      )}
    </div>
  );
}

function ContestRow({ contest }: { contest: any }) {
  const updateContestStatus = useMutation(api.contests.updateContestStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: "active" | "judging" | "completed") => {
    setIsUpdating(true);
    try {
      await updateContestStatus({
        contestId: contest._id,
        status: newStatus,
      });
      toast.success("Contest status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update contest");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {contest.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {contest.theme} • {contest.entryCount}/{contest.entryLimit} entries
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Deadline: {new Date(contest.deadline).toLocaleDateString()}
        </p>
      </div>
      
      <div className="flex items-center space-x-3">
        <span className={`text-xs px-2 py-1 rounded-full ${
          contest.status === "active" 
            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
            : contest.status === "judging"
            ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
            : "bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
        }`}>
          {contest.status}
        </span>
        
        <select
          value={contest.status}
          onChange={(e) => handleStatusChange(e.target.value as any)}
          disabled={isUpdating}
          className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="active">Active</option>
          <option value="judging">Judging</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>
  );
}

function CreateContestModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [entryLimit, setEntryLimit] = useState(50);
  const [isMinichallenge, setIsMinichallenge] = useState(false);
  const [xpReward, setXpReward] = useState(100);
  const [isCreating, setIsCreating] = useState(false);

  const createContest = useMutation(api.contests.createContest);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !theme || !description || !deadline) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      await createContest({
        name,
        theme,
        description,
        deadline: new Date(deadline).getTime(),
        entryLimit,
        isMinichallenge,
        xpReward,
      });
      toast.success("Contest created successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create contest");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create New Contest
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
              Contest Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Theme *
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deadline *
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Entry Limit
            </label>
            <input
              type="number"
              value={entryLimit}
              onChange={(e) => setEntryLimit(parseInt(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              XP Reward
            </label>
            <input
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(parseInt(e.target.value))}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isMinichallenge}
                onChange={(e) => setIsMinichallenge(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Mini Challenge
              </span>
            </label>
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
              disabled={isCreating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? "Creating..." : "Create Contest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
