// ========================================
// Insights Engine - Data Processing
// ========================================

import type {
    GitHubRepo,
    GitHubEvent,
    WrappedInsights,
    LanguageStat,
    RepoStat,
    MonthlyActivity,
    DeveloperPersonality,
    PersonalityTrait,
    ContributionCalendar,
} from '../types';
import { getLanguageColor } from '../types';
import type { AllGitHubData, ContributionData } from '../api/github';

// Day names for display
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Calculate insights from raw GitHub data
export function calculateInsights(
    data: AllGitHubData,
    year: number
): WrappedInsights {
    const { repos, events, contributionData, contributionCalendar } = data;

    // Filter events for the selected year
    const yearEvents = events.filter((event) => {
        const eventDate = new Date(event.created_at);
        return eventDate.getFullYear() === year;
    });

    // Filter repos created in the selected year
    const yearRepos = repos.filter((repo) => {
        const createdDate = new Date(repo.created_at);
        return createdDate.getFullYear() === year;
    });

    // Calculate basic stats - pass calendar for accurate commit counting
    const basicStats = calculateBasicStats(yearEvents, contributionData, contributionCalendar);

    // Calculate language stats
    const languageStats = calculateLanguageStats(repos);

    // Calculate top repositories
    const topRepos = calculateTopRepos(repos, contributionData);

    // Calculate activity patterns
    const activityPatterns = calculateActivityPatterns(
        yearEvents,
        contributionCalendar,
        year
    );

    // Calculate streaks
    const streaks = calculateStreaks(contributionCalendar);

    // Calculate scores
    const scores = calculateScores(yearEvents, repos);

    // Calculate personality
    const personality = calculatePersonality(
        yearEvents,
        repos,
        activityPatterns,
        scores
    );

    // Get or create contribution calendar
    const calendar = contributionCalendar || createEmptyCalendar(year);

    return {
        // Basic Stats
        totalContributions:
            contributionData?.contributionCalendar.totalContributions ||
            contributionCalendar?.totalContributions ||
            basicStats.totalContributions,
        totalCommits:
            contributionData?.totalCommitContributions || basicStats.commits,
        totalPRs:
            contributionData?.totalPullRequestContributions || basicStats.prs,
        totalIssues:
            contributionData?.totalIssueContributions || basicStats.issues,
        totalReviews:
            contributionData?.totalPullRequestReviewContributions || basicStats.reviews,

        // Repository Stats
        repositoriesContributedTo:
            contributionData?.totalRepositoriesWithContributedCommits ||
            basicStats.reposContributedTo,
        newRepositoriesCreated: yearRepos.length,
        topRepositories: topRepos,

        // Language Stats
        topLanguages: languageStats.topLanguages,
        totalLanguages: languageStats.totalLanguages,

        // Time-based Stats
        mostProductiveDay: activityPatterns.mostProductiveDay,
        mostProductiveHour: activityPatterns.mostProductiveHour,
        peakHourRange: activityPatterns.peakHourRange,
        activityByDay: activityPatterns.activityByDay,
        activityByHour: activityPatterns.activityByHour,
        monthlyActivity: activityPatterns.monthlyActivity,

        // Streaks
        longestStreak: streaks.longestStreak,
        currentStreak: streaks.currentStreak,
        totalActiveDays: streaks.totalActiveDays,

        // Scores
        soloVsTeamScore: scores.soloScore,
        bugSlayerScore: scores.bugSlayerScore,

        // Calendar
        contributionCalendar: calendar,

        // Personality
        personality,
    };
}

// Calculate basic stats from events and contribution calendar
function calculateBasicStats(
    events: GitHubEvent[],
    contributionData: ContributionData | null,
    contributionCalendar: ContributionCalendar | null
): {
    totalContributions: number;
    commits: number;
    prs: number;
    issues: number;
    reviews: number;
    reposContributedTo: number;
} {
    let commits = 0;
    let prs = 0;
    let issues = 0;
    let reviews = 0;
    const reposSet = new Set<string>();

    // Calculate commits from contribution calendar (most accurate source)
    let calendarCommits = 0;
    if (contributionCalendar) {
        for (const week of contributionCalendar.weeks) {
            for (const day of week.contributionDays) {
                calendarCommits += day.contributionCount;
            }
        }
    }

    for (const event of events) {
        switch (event.type) {
            case 'PushEvent':
                commits += (event.payload as { commits?: unknown[] }).commits?.length || 1;
                reposSet.add(event.repo.name);
                break;
            case 'PullRequestEvent':
                prs++;
                reposSet.add(event.repo.name);
                break;
            case 'IssuesEvent':
                issues++;
                reposSet.add(event.repo.name);
                break;
            case 'PullRequestReviewEvent':
                reviews++;
                reposSet.add(event.repo.name);
                break;
        }
    }

    // Prefer GraphQL data if available
    if (contributionData) {
        return {
            totalContributions: contributionData.contributionCalendar.totalContributions,
            commits: contributionData.totalCommitContributions,
            prs: contributionData.totalPullRequestContributions,
            issues: contributionData.totalIssueContributions,
            reviews: contributionData.totalPullRequestReviewContributions,
            reposContributedTo: contributionData.totalRepositoriesWithContributedCommits,
        };
    }

    // Use calendar commits if available (more accurate than events API which only has 300 events)
    const finalCommits = calendarCommits > 0 ? calendarCommits : commits;

    return {
        totalContributions: contributionCalendar?.totalContributions || (finalCommits + prs + issues + reviews),
        commits: finalCommits,
        prs,
        issues,
        reviews,
        reposContributedTo: reposSet.size,
    };
}

// Calculate language statistics
function calculateLanguageStats(repos: GitHubRepo[]): {
    topLanguages: LanguageStat[];
    totalLanguages: number;
} {
    const languageCounts: Record<string, number> = {};

    for (const repo of repos) {
        if (repo.language && !repo.fork) {
            languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
        }
    }

    const totalRepos = Object.values(languageCounts).reduce((a, b) => a + b, 0);
    const languages = Object.entries(languageCounts)
        .map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalRepos) * 100),
            color: getLanguageColor(name),
        }))
        .sort((a, b) => b.count - a.count);

    return {
        topLanguages: languages.slice(0, 8),
        totalLanguages: languages.length,
    };
}

// Calculate top repositories
function calculateTopRepos(
    repos: GitHubRepo[],
    contributionData: ContributionData | null
): RepoStat[] {
    // If we have GraphQL data, use it
    if (contributionData?.commitContributionsByRepository) {
        return contributionData.commitContributionsByRepository
            .map((item) => ({
                name: item.repository.name,
                fullName: item.repository.nameWithOwner,
                url: item.repository.url,
                stars: item.repository.stargazerCount,
                commits: item.contributions.totalCount,
                language: item.repository.primaryLanguage?.name || null,
                description: item.repository.description,
            }))
            .sort((a, b) => b.commits - a.commits)
            .slice(0, 6);
    }

    // Fallback: sort by stars and recent activity
    return repos
        .filter((r) => !r.fork)
        .sort((a, b) => {
            const aScore = a.stargazers_count + (new Date(a.pushed_at).getTime() / 1e12);
            const bScore = b.stargazers_count + (new Date(b.pushed_at).getTime() / 1e12);
            return bScore - aScore;
        })
        .slice(0, 6)
        .map((repo) => ({
            name: repo.name,
            fullName: repo.full_name,
            url: repo.html_url,
            stars: repo.stargazers_count,
            commits: 0, // Unknown without GraphQL
            language: repo.language,
            description: repo.description,
        }));
}

// Calculate activity patterns
function calculateActivityPatterns(
    events: GitHubEvent[],
    calendar: ContributionCalendar | null,
    year: number
): {
    mostProductiveDay: string;
    mostProductiveHour: number;
    peakHourRange: string;
    activityByDay: Record<string, number>;
    activityByHour: Record<number, number>;
    monthlyActivity: MonthlyActivity[];
} {
    const dayActivity: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const hourActivity: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourActivity[i] = 0;

    const monthlyContributions: Record<number, number> = {};
    for (let i = 0; i < 12; i++) monthlyContributions[i] = 0;

    // Process events for hour activity (calendar doesn't have hour data)
    for (const event of events) {
        const date = new Date(event.created_at);
        hourActivity[date.getHours()]++;
    }

    // Use contribution calendar for day and monthly stats (more accurate than events API)
    if (calendar) {
        for (const week of calendar.weeks) {
            for (const day of week.contributionDays) {
                const date = new Date(day.date);
                if (date.getFullYear() === year && day.contributionCount > 0) {
                    // Calculate weekday activity from calendar (more accurate)
                    dayActivity[date.getDay()] += day.contributionCount;
                    // Calculate monthly activity from calendar
                    monthlyContributions[date.getMonth()] += day.contributionCount;
                }
            }
        }
    } else {
        // Fallback to events if no calendar data
        for (const event of events) {
            const date = new Date(event.created_at);
            dayActivity[date.getDay()]++;
            monthlyContributions[date.getMonth()]++;
        }
    }

    // Find most productive day
    let maxDayCount = 0;
    let mostProductiveDay = 0;
    for (const [day, count] of Object.entries(dayActivity)) {
        if (count > maxDayCount) {
            maxDayCount = count;
            mostProductiveDay = parseInt(day);
        }
    }

    // Find most productive hour
    let maxHourCount = 0;
    let mostProductiveHour = 0;
    for (const [hour, count] of Object.entries(hourActivity)) {
        if (count > maxHourCount) {
            maxHourCount = count;
            mostProductiveHour = parseInt(hour);
        }
    }

    // Calculate peak hour range
    const peakStart = Math.max(0, mostProductiveHour - 1);
    const peakEnd = Math.min(23, mostProductiveHour + 1);
    const formatHour = (h: number) => {
        if (h === 0) return '12 AM';
        if (h === 12) return '12 PM';
        return h > 12 ? `${h - 12} PM` : `${h} AM`;
    };
    const peakHourRange = `${formatHour(peakStart)} - ${formatHour(peakEnd)}`;

    // Convert to named days
    const activityByDay: Record<string, number> = {};
    for (const [dayNum, count] of Object.entries(dayActivity)) {
        activityByDay[DAYS[parseInt(dayNum)]] = count;
    }

    // Create monthly activity array
    const monthlyActivity: MonthlyActivity[] = MONTHS.map((month, index) => ({
        month,
        year,
        contributions: monthlyContributions[index] || 0,
    }));

    return {
        mostProductiveDay: DAYS[mostProductiveDay],
        mostProductiveHour,
        peakHourRange,
        activityByDay,
        activityByHour: hourActivity,
        monthlyActivity,
    };
}

// Calculate streaks from contribution calendar
function calculateStreaks(calendar: ContributionCalendar | null): {
    longestStreak: number;
    currentStreak: number;
    totalActiveDays: number;
} {
    if (!calendar) {
        return { longestStreak: 0, currentStreak: 0, totalActiveDays: 0 };
    }

    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    let totalActiveDays = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Flatten contribution days
    const allDays = calendar.weeks
        .flatMap((week) => week.contributionDays)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (let i = 0; i < allDays.length; i++) {
        const day = allDays[i];
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);

        if (day.contributionCount > 0) {
            totalActiveDays++;
            tempStreak++;

            // Check if this is today or yesterday for current streak
            const diffDays = Math.floor((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 1) {
                currentStreak = tempStreak;
            }
        } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 0;
        }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return { longestStreak, currentStreak, totalActiveDays };
}

// Calculate various scores
function calculateScores(
    events: GitHubEvent[],
    repos: GitHubRepo[]
): {
    soloScore: number;
    bugSlayerScore: number;
} {
    // Solo vs Team: based on fork ratio and collaboration patterns
    const ownRepos = repos.filter((r) => !r.fork);
    const forkedRepos = repos.filter((r) => r.fork);
    const soloScore = Math.round(
        (ownRepos.length / Math.max(1, ownRepos.length + forkedRepos.length)) * 100
    );

    // Bug Slayer: ratio of issues to PRs
    let issues = 0;
    let prs = 0;
    for (const event of events) {
        if (event.type === 'IssuesEvent') issues++;
        if (event.type === 'PullRequestEvent') prs++;
    }
    const bugSlayerScore =
        issues + prs > 0 ? Math.round((issues / (issues + prs)) * 100) : 50;

    return { soloScore, bugSlayerScore };
}

// Calculate developer personality
function calculatePersonality(
    events: GitHubEvent[],
    repos: GitHubRepo[],
    activity: {
        mostProductiveHour: number;
        activityByDay: Record<string, number>;
    },
    scores: { soloScore: number; bugSlayerScore: number }
): DeveloperPersonality {
    const traits: PersonalityTrait[] = [];

    // Time-based trait
    const isNightOwl = activity.mostProductiveHour >= 20 || activity.mostProductiveHour < 6;
    const isEarlyBird = activity.mostProductiveHour >= 5 && activity.mostProductiveHour < 10;
    traits.push({
        name: isNightOwl ? 'Night Owl' : isEarlyBird ? 'Early Bird' : 'Daytime Coder',
        value: isNightOwl ? 85 : isEarlyBird ? 15 : 50,
        label: isNightOwl
            ? '🦉 Codes when the moon is out'
            : isEarlyBird
                ? '🐦 Catches the morning commits'
                : '☀️ Peak performance during sunlight',
    });

    // Focus trait
    const languages = new Set(repos.map((r) => r.language).filter(Boolean));
    const isPolyglot = languages.size >= 5;
    traits.push({
        name: isPolyglot ? 'Polyglot' : 'Specialist',
        value: Math.min(100, languages.size * 15),
        label: isPolyglot
            ? '🌍 Master of many languages'
            : '🎯 Deep expertise in few',
    });

    // Work style trait
    const weekendActivity =
        (activity.activityByDay['Saturday'] || 0) +
        (activity.activityByDay['Sunday'] || 0);
    const weekdayActivity =
        (activity.activityByDay['Monday'] || 0) +
        (activity.activityByDay['Tuesday'] || 0) +
        (activity.activityByDay['Wednesday'] || 0) +
        (activity.activityByDay['Thursday'] || 0) +
        (activity.activityByDay['Friday'] || 0);
    const isWeekendWarrior = weekendActivity > weekdayActivity * 0.4;
    traits.push({
        name: isWeekendWarrior ? 'Weekend Warrior' : 'Weekday Wonder',
        value: isWeekendWarrior ? 80 : 30,
        label: isWeekendWarrior
            ? '💪 Codes through weekends'
            : '📅 Balanced work schedule',
    });

    // Collaboration trait
    const isSolo = scores.soloScore > 70;
    traits.push({
        name: isSolo ? 'Solo Coder' : 'Team Player',
        value: scores.soloScore,
        label: isSolo
            ? '🏴‍☠️ Independent creator'
            : '🤝 Collaborative spirit',
    });

    // Determine title based on dominant traits
    let title = 'Code Crafter';
    let emoji = '👨‍💻';
    let description = 'A balanced developer with diverse skills.';

    if (isNightOwl && isPolyglot) {
        title = 'Nocturnal Polyglot';
        emoji = '🦉';
        description =
            'A versatile night owl who masters multiple languages under the moonlight.';
    } else if (isEarlyBird && isSolo) {
        title = 'Dawn Pioneer';
        emoji = '🌅';
        description =
            'An independent creator who catches bugs before anyone else wakes up.';
    } else if (isWeekendWarrior && scores.bugSlayerScore > 60) {
        title = 'Weekend Bug Hunter';
        emoji = '🐛';
        description =
            'A dedicated problem solver who squashes bugs even on their days off.';
    } else if (isPolyglot && !isSolo) {
        title = 'Open Source Champion';
        emoji = '🏆';
        description =
            'A collaborative polyglot who contributes across the ecosystem.';
    } else if (isSolo && languages.size <= 2) {
        title = 'Deep Specialist';
        emoji = '🎯';
        description =
            'A focused expert who has mastered their chosen technology stack.';
    } else if (isNightOwl && isWeekendWarrior) {
        title = 'Code Ninja';
        emoji = '🥷';
        description =
            'Strikes when least expected, codes through nights and weekends.';
    }

    return {
        title,
        emoji,
        description,
        traits,
    };
}

// Create empty calendar for years without data
function createEmptyCalendar(year: number): ContributionCalendar {
    const weeks: ContributionCalendar['weeks'] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    let currentWeek: ContributionCalendar['weeks'][0] = { contributionDays: [] };
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        if (currentDate.getDay() === 0 && currentWeek.contributionDays.length > 0) {
            weeks.push(currentWeek);
            currentWeek = { contributionDays: [] };
        }

        currentWeek.contributionDays.push({
            date: currentDate.toISOString().split('T')[0],
            contributionCount: 0,
            contributionLevel: 'NONE',
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.contributionDays.length > 0) {
        weeks.push(currentWeek);
    }

    return { totalContributions: 0, weeks };
}
