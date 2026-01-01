// ========================================
// GitHub API Service Layer
// ========================================

import type { GitHubUser, GitHubRepo, GitHubEvent, ContributionCalendar } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

// Rate limit info
interface RateLimitInfo {
    remaining: number;
    limit: number;
    resetTime: Date;
}

let rateLimitInfo: RateLimitInfo | null = null;

// Update rate limit from response headers
function updateRateLimit(headers: Headers): void {
    const remaining = headers.get('X-RateLimit-Remaining');
    const limit = headers.get('X-RateLimit-Limit');
    const reset = headers.get('X-RateLimit-Reset');

    if (remaining && limit && reset) {
        rateLimitInfo = {
            remaining: parseInt(remaining, 10),
            limit: parseInt(limit, 10),
            resetTime: new Date(parseInt(reset, 10) * 1000),
        };
    }
}

// Get current rate limit info
export function getRateLimitInfo(): RateLimitInfo | null {
    return rateLimitInfo;
}

// API Error class
export class GitHubApiError extends Error {
    public status: number;
    public code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = 'GitHubApiError';
        this.status = status;
        this.code = code;
    }
}

// Generic fetch wrapper with error handling
async function fetchGitHub<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: 'application/vnd.github.v3+json',
            ...options.headers,
        },
    });

    updateRateLimit(response.headers);

    if (!response.ok) {
        if (response.status === 404) {
            throw new GitHubApiError('User not found', 404, 'NOT_FOUND');
        }
        if (response.status === 403) {
            const resetTime = rateLimitInfo?.resetTime
                ? rateLimitInfo.resetTime.toLocaleTimeString()
                : 'soon';
            throw new GitHubApiError(
                `API rate limit exceeded. Try again at ${resetTime}`,
                403,
                'RATE_LIMITED'
            );
        }
        throw new GitHubApiError(`GitHub API error: ${response.statusText}`, response.status);
    }

    return response.json();
}

// Fetch user profile
export async function fetchUserProfile(username: string): Promise<GitHubUser> {
    return fetchGitHub<GitHubUser>(`/users/${username}`);
}

// Fetch user repositories with pagination
export async function fetchUserRepos(
    username: string,
    maxRepos: number = 100
): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100;

    while (repos.length < maxRepos) {
        const pageRepos = await fetchGitHub<GitHubRepo[]>(
            `/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated&type=owner`
        );

        if (pageRepos.length === 0) break;

        repos.push(...pageRepos);
        page++;

        if (pageRepos.length < perPage) break;
    }

    return repos.slice(0, maxRepos);
}

// Fetch user events with pagination
export async function fetchUserEvents(
    username: string,
    maxEvents: number = 300
): Promise<GitHubEvent[]> {
    const events: GitHubEvent[] = [];
    let page = 1;
    const perPage = 100;

    // GitHub only provides last 300 events max
    while (events.length < maxEvents && page <= 3) {
        try {
            const pageEvents = await fetchGitHub<GitHubEvent[]>(
                `/users/${username}/events?per_page=${perPage}&page=${page}`
            );

            if (pageEvents.length === 0) break;

            events.push(...pageEvents);
            page++;
        } catch (error) {
            // Events API may fail for some users, don't throw
            console.warn('Failed to fetch events page:', page, error);
            break;
        }
    }

    return events;
}

// GraphQL query for contribution data
const CONTRIBUTION_QUERY = `
query($username: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $username) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      totalRepositoriesWithContributedCommits
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            contributionLevel
          }
        }
      }
      commitContributionsByRepository(maxRepositories: 20) {
        repository {
          name
          nameWithOwner
          url
          primaryLanguage {
            name
          }
          stargazerCount
          description
        }
        contributions {
          totalCount
        }
      }
    }
  }
}
`;

// GraphQL Contribution Data Response
export interface ContributionData {
    totalCommitContributions: number;
    totalPullRequestContributions: number;
    totalIssueContributions: number;
    totalPullRequestReviewContributions: number;
    totalRepositoriesWithContributedCommits: number;
    contributionCalendar: ContributionCalendar;
    commitContributionsByRepository: Array<{
        repository: {
            name: string;
            nameWithOwner: string;
            url: string;
            primaryLanguage: { name: string } | null;
            stargazerCount: number;
            description: string | null;
        };
        contributions: {
            totalCount: number;
        };
    }>;
}

// Fetch contribution data via GraphQL
export async function fetchContributionData(
    username: string,
    year: number,
    token?: string
): Promise<ContributionData | null> {
    // GraphQL API requires authentication
    if (!token) {
        // Return null if no token - we'll use REST API fallback
        return null;
    }

    const from = new Date(year, 0, 1).toISOString();
    const to = new Date(year, 11, 31, 23, 59, 59).toISOString();

    try {
        const response = await fetch(GITHUB_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                query: CONTRIBUTION_QUERY,
                variables: { username, from, to },
            }),
        });

        if (!response.ok) {
            console.warn('GraphQL API request failed:', response.status);
            return null;
        }

        const data = await response.json();

        if (data.errors) {
            console.warn('GraphQL API errors:', data.errors);
            return null;
        }

        return data.data?.user?.contributionsCollection || null;
    } catch (error) {
        console.warn('Failed to fetch GraphQL contribution data:', error);
        return null;
    }
}

// Fetch contribution calendar via scraping GitHub's profile page (fallback)
export async function fetchContributionCalendarFallback(
    username: string,
    year: number
): Promise<ContributionCalendar | null> {
    try {
        // Use GitHub's contribution graph API (unofficial but widely used)
        const response = await fetch(
            `https://github-contributions-api.jogruber.de/v4/${username}?y=${year}`
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        // Transform to our format
        const weeks: ContributionCalendar['weeks'] = [];
        let totalContributions = 0;

        // Group by week
        if (data.contributions && Array.isArray(data.contributions)) {
            let currentWeek: ContributionCalendar['weeks'][0] = { contributionDays: [] };

            for (const contrib of data.contributions) {
                const date = new Date(contrib.date);
                const dayOfWeek = date.getDay();

                // Start new week on Sunday
                if (dayOfWeek === 0 && currentWeek.contributionDays.length > 0) {
                    weeks.push(currentWeek);
                    currentWeek = { contributionDays: [] };
                }

                const count = contrib.count || 0;
                totalContributions += count;

                let level: 'NONE' | 'FIRST_QUARTILE' | 'SECOND_QUARTILE' | 'THIRD_QUARTILE' | 'FOURTH_QUARTILE';
                if (count === 0) level = 'NONE';
                else if (count <= 3) level = 'FIRST_QUARTILE';
                else if (count <= 6) level = 'SECOND_QUARTILE';
                else if (count <= 9) level = 'THIRD_QUARTILE';
                else level = 'FOURTH_QUARTILE';

                currentWeek.contributionDays.push({
                    date: contrib.date,
                    contributionCount: count,
                    contributionLevel: level,
                });
            }

            // Push last week
            if (currentWeek.contributionDays.length > 0) {
                weeks.push(currentWeek);
            }
        }

        return {
            totalContributions: data.total?.[year] || totalContributions,
            weeks,
        };
    } catch (error) {
        console.warn('Failed to fetch contribution calendar fallback:', error);
        return null;
    }
}

// Cache for API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data as T;
    }
    cache.delete(key);
    return null;
}

function setCache(key: string, data: unknown): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// Main function to fetch all GitHub data for a user
export interface AllGitHubData {
    user: GitHubUser;
    repos: GitHubRepo[];
    events: GitHubEvent[];
    contributionData: ContributionData | null;
    contributionCalendar: ContributionCalendar | null;
}

export async function fetchAllGitHubData(
    username: string,
    year: number,
    token?: string
): Promise<AllGitHubData> {
    const cacheKey = `${username}-${year}-${token ? 'auth' : 'noauth'}`;
    const cached = getCached<AllGitHubData>(cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch all data in parallel
    const [user, repos, events, contributionData, contributionCalendar] =
        await Promise.all([
            fetchUserProfile(username),
            fetchUserRepos(username),
            fetchUserEvents(username),
            token ? fetchContributionData(username, year, token) : Promise.resolve(null),
            fetchContributionCalendarFallback(username, year),
        ]);

    const result: AllGitHubData = {
        user,
        repos,
        events,
        contributionData,
        contributionCalendar,
    };

    setCache(cacheKey, result);
    return result;
}
