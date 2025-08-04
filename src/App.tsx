import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Home } from "./components/Home";
import { Profile } from "./components/Profile";
import { Contests } from "./components/Contests";
import { Gallery } from "./components/Gallery";
import { Leaderboard } from "./components/Leaderboard";
import { AdminPanel } from "./components/AdminPanel";
import { Upload } from "./components/Upload";
import { Id } from "../convex/_generated/dataModel";

type Page = "home" | "profile" | "viewProfile" | "contests" | "gallery" | "leaderboard" | "admin" | "upload";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);

  // Ensure dark mode is never enabled
  useEffect(() => {
    // Remove dark class if it exists
    document.documentElement.classList.remove('dark');
    
    // Add a mutation observer to prevent dark class from being added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Cleanup observer on unmount
    return () => observer.disconnect();
  }, []);

  // Listen for custom navigation events to profile
  useEffect(() => {
    const handleNavigateToProfile = (event: Event) => {
      const customEvent = event as CustomEvent<Id<"users">>;
      setSelectedUserId(customEvent.detail);
      setCurrentPage("viewProfile");
    };
    window.addEventListener("navigateToProfile", handleNavigateToProfile);
    return () => {
      window.removeEventListener("navigateToProfile", handleNavigateToProfile);
    };
  }, []);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50">
      <Authenticated>
        <Navigation 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
        />
        <main className="pt-24 md:pt-20">
          <PageContent 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
          />
        </main>
      </Authenticated>
      
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                📸 SMUS Photo Club
              </h1>
              <p className="text-xl text-gray-600">
                Join contests and events while building your portfolio!
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
      
      <Toaster />
    </div>
  );
}

function Navigation({ 
  currentPage, 
  setCurrentPage
}: {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}) {
  const user = useQuery(api.auth.loggedInUser);

  const navItems = [
    { id: "home" as Page, label: "Home", icon: "🏠" },
    { id: "gallery" as Page, label: "Gallery", icon: "🖼️" },
    { id: "contests" as Page, label: "Contests", icon: "🏆" },
    { id: "leaderboard" as Page, label: "Leaderboard", icon: "📊" },
    { id: "profile" as Page, label: "Profile", icon: "👤" },
    { id: "upload" as Page, label: "Upload", icon: "📤" },
  ];

  if (user?.isAdmin) {
    navItems.push({ id: "admin" as Page, label: "Admin", icon: "⚙️" });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-12">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              📸 PhotoClub
            </h1>
            
            <div className="hidden md:flex space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto py-2 px-4 space-x-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                currentPage === item.id
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function PageContent({ currentPage, setCurrentPage, selectedUserId, setSelectedUserId }: { currentPage: Page, setCurrentPage: (page: Page) => void, selectedUserId: Id<"users"> | null, setSelectedUserId: (id: Id<"users"> | null) => void }) {
  const user = useQuery(api.auth.loggedInUser);
  
  switch (currentPage) {
    case "home":
      return <Home isAdmin={user?.isAdmin ?? false} />;
    case "profile":
      return <Profile />;
    case "viewProfile":
      return <Profile userId={selectedUserId} />;
    case "contests":
      return <Contests />;
    case "gallery":
      return <Gallery />;
    case "leaderboard":
      return <Leaderboard />;
    case "admin":
      return <AdminPanel />;
    case "upload":
      return <Upload setCurrentPage={setCurrentPage} />;
    default:
      return <Home />;
  }
}
