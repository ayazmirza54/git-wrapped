// ========================================
// GitHub Wrapped - Type Definitions
// ========================================

// GitHub User Profile
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
}

// GitHub Repository
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics: string[];
}

// GitHub Event (from Events API)
export interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    id: number;
    login: string;
    avatar_url: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: Record<string, unknown>;
  public: boolean;
  created_at: string;
}

// Contribution Day (from GraphQL)
export interface ContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel: 'NONE' | 'FIRST_QUARTILE' | 'SECOND_QUARTILE' | 'THIRD_QUARTILE' | 'FOURTH_QUARTILE';
}

// Contribution Week
export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

// Contribution Calendar
export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

// Language Statistics
export interface LanguageStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

// Repository Stat
export interface RepoStat {
  name: string;
  fullName: string;
  url: string;
  stars: number;
  commits: number;
  language: string | null;
  description: string | null;
}

// Activity Pattern
export interface ActivityPattern {
  dayOfWeek: string;
  hour: number;
  count: number;
}

// Monthly Activity
export interface MonthlyActivity {
  month: string;
  year: number;
  contributions: number;
}

// Streak Data
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
}

// ========================================
// Wrapped Insights (Computed Data)
// ========================================

export interface WrappedInsights {
  // Basic Stats
  totalContributions: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReviews: number;
  
  // Repository Stats
  repositoriesContributedTo: number;
  newRepositoriesCreated: number;
  topRepositories: RepoStat[];
  
  // Language Stats
  topLanguages: LanguageStat[];
  totalLanguages: number;
  
  // Time-based Stats
  mostProductiveDay: string;
  mostProductiveHour: number;
  peakHourRange: string;
  activityByDay: Record<string, number>;
  activityByHour: Record<number, number>;
  monthlyActivity: MonthlyActivity[];
  
  // Streaks
  longestStreak: number;
  currentStreak: number;
  totalActiveDays: number;
  
  // Ratios & Scores
  soloVsTeamScore: number; // 0-100, higher = more solo
  bugSlayerScore: number; // 0-100, higher = more issues
  
  // Contribution Calendar
  contributionCalendar: ContributionCalendar;
  
  // Personality
  personality: DeveloperPersonality;
}

// Developer Personality Profile
export interface DeveloperPersonality {
  title: string;
  emoji: string;
  description: string;
  traits: PersonalityTrait[];
}

export interface PersonalityTrait {
  name: string;
  value: number; // 0-100
  label: string;
}

// ========================================
// App State Types
// ========================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AppError {
  message: string;
  code?: string;
  details?: string;
}

export interface WrappedState {
  username: string;
  year: number;
  user: GitHubUser | null;
  insights: WrappedInsights | null;
  loadingState: LoadingState;
  error: AppError | null;
  currentScreen: number;
}

// Story Screen
export interface StoryScreen {
  id: string;
  title: string;
  component: React.ComponentType<StoryScreenProps>;
}

export interface StoryScreenProps {
  insights: WrappedInsights;
  user: GitHubUser;
  year: number;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

// Language Colors (for charts)
export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Scala: '#c22d40',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  SCSS: '#c6538c',
  Lua: '#000080',
  R: '#198CE7',
  Perl: '#0298c3',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Objective_C: '#438eff',
  Default: '#8b949e',
};

// Get color for a language
export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Default;
}
