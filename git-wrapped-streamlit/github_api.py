"""
GitHub API Service Layer
Port of src/api/github.ts
"""

import requests
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from datetime import datetime


# ========================================
# Data Classes
# ========================================

@dataclass
class GitHubUser:
    login: str
    id: int
    avatar_url: str
    html_url: str
    name: Optional[str]
    company: Optional[str]
    blog: Optional[str]
    location: Optional[str]
    email: Optional[str]
    bio: Optional[str]
    twitter_username: Optional[str]
    public_repos: int
    public_gists: int
    followers: int
    following: int
    created_at: str


@dataclass
class GitHubRepo:
    id: int
    name: str
    full_name: str
    html_url: str
    description: Optional[str]
    fork: bool
    created_at: str
    updated_at: str
    pushed_at: str
    homepage: Optional[str]
    size: int
    stargazers_count: int
    watchers_count: int
    language: Optional[str]
    forks_count: int
    open_issues_count: int
    default_branch: str
    topics: List[str]


@dataclass
class GitHubEvent:
    id: str
    type: str
    actor: Dict[str, Any]
    repo: Dict[str, Any]
    payload: Dict[str, Any]
    public: bool
    created_at: str


@dataclass
class ContributionDay:
    date: str
    contribution_count: int
    contribution_level: str  # NONE, FIRST_QUARTILE, SECOND_QUARTILE, THIRD_QUARTILE, FOURTH_QUARTILE


@dataclass
class ContributionCalendar:
    total_contributions: int
    weeks: List[List[ContributionDay]]  # List of weeks, each week is list of days


@dataclass
class ContributionData:
    total_commit_contributions: int
    total_pull_request_contributions: int
    total_issue_contributions: int
    total_pull_request_review_contributions: int
    total_repositories_with_contributed_commits: int
    contribution_calendar: ContributionCalendar
    commit_contributions_by_repository: List[Dict[str, Any]]


# ========================================
# API Configuration
# ========================================

GITHUB_API_BASE = "https://api.github.com"
GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
CONTRIBUTION_FALLBACK_API = "https://github-contributions-api.jogruber.de/v4"


class GitHubApiError(Exception):
    """Custom exception for GitHub API errors"""
    def __init__(self, message: str, status: int, code: Optional[str] = None):
        self.message = message
        self.status = status
        self.code = code
        super().__init__(message)


# ========================================
# API Functions
# ========================================

def fetch_user_profile(username: str) -> GitHubUser:
    """Fetch user profile from GitHub API"""
    response = requests.get(
        f"{GITHUB_API_BASE}/users/{username}",
        headers={"Accept": "application/vnd.github.v3+json"}
    )
    
    if response.status_code == 404:
        raise GitHubApiError("User not found", 404, "NOT_FOUND")
    if response.status_code == 403:
        raise GitHubApiError("API rate limit exceeded", 403, "RATE_LIMITED")
    if not response.ok:
        raise GitHubApiError(f"GitHub API error: {response.status_code}", response.status_code)
    
    data = response.json()
    return GitHubUser(
        login=data["login"],
        id=data["id"],
        avatar_url=data["avatar_url"],
        html_url=data["html_url"],
        name=data.get("name"),
        company=data.get("company"),
        blog=data.get("blog"),
        location=data.get("location"),
        email=data.get("email"),
        bio=data.get("bio"),
        twitter_username=data.get("twitter_username"),
        public_repos=data.get("public_repos", 0),
        public_gists=data.get("public_gists", 0),
        followers=data.get("followers", 0),
        following=data.get("following", 0),
        created_at=data["created_at"],
    )


def fetch_user_repos(username: str, max_repos: int = 100) -> List[GitHubRepo]:
    """Fetch user repositories with pagination"""
    repos = []
    page = 1
    per_page = 100
    
    while len(repos) < max_repos:
        response = requests.get(
            f"{GITHUB_API_BASE}/users/{username}/repos",
            params={"per_page": per_page, "page": page, "sort": "updated", "type": "owner"},
            headers={"Accept": "application/vnd.github.v3+json"}
        )
        
        if not response.ok:
            break
            
        page_repos = response.json()
        if not page_repos:
            break
            
        for repo in page_repos:
            repos.append(GitHubRepo(
                id=repo["id"],
                name=repo["name"],
                full_name=repo["full_name"],
                html_url=repo["html_url"],
                description=repo.get("description"),
                fork=repo.get("fork", False),
                created_at=repo["created_at"],
                updated_at=repo["updated_at"],
                pushed_at=repo.get("pushed_at", repo["updated_at"]),
                homepage=repo.get("homepage"),
                size=repo.get("size", 0),
                stargazers_count=repo.get("stargazers_count", 0),
                watchers_count=repo.get("watchers_count", 0),
                language=repo.get("language"),
                forks_count=repo.get("forks_count", 0),
                open_issues_count=repo.get("open_issues_count", 0),
                default_branch=repo.get("default_branch", "main"),
                topics=repo.get("topics", []),
            ))
        
        page += 1
        if len(page_repos) < per_page:
            break
    
    return repos[:max_repos]


def fetch_user_events(username: str, max_events: int = 300) -> List[GitHubEvent]:
    """Fetch user events with pagination (max 300 from API)"""
    events = []
    page = 1
    per_page = 100
    
    while len(events) < max_events and page <= 3:
        try:
            response = requests.get(
                f"{GITHUB_API_BASE}/users/{username}/events",
                params={"per_page": per_page, "page": page},
                headers={"Accept": "application/vnd.github.v3+json"}
            )
            
            if not response.ok:
                break
                
            page_events = response.json()
            if not page_events:
                break
                
            for event in page_events:
                events.append(GitHubEvent(
                    id=event["id"],
                    type=event["type"],
                    actor=event["actor"],
                    repo=event["repo"],
                    payload=event.get("payload", {}),
                    public=event.get("public", True),
                    created_at=event["created_at"],
                ))
            
            page += 1
        except Exception:
            break
    
    return events


def fetch_contribution_calendar_fallback(username: str, year: int) -> Optional[ContributionCalendar]:
    """Fetch contribution calendar via fallback API"""
    try:
        response = requests.get(f"{CONTRIBUTION_FALLBACK_API}/{username}?y={year}")
        
        if not response.ok:
            return None
            
        data = response.json()
        
        weeks = []
        total_contributions = 0
        current_week = []
        
        contributions = data.get("contributions", [])
        for contrib in contributions:
            date = datetime.fromisoformat(contrib["date"].replace("Z", "+00:00"))
            day_of_week = date.weekday()  # 0 = Monday, 6 = Sunday
            # Convert to Sunday = 0 format
            day_of_week = (day_of_week + 1) % 7
            
            # Start new week on Sunday
            if day_of_week == 0 and current_week:
                weeks.append(current_week)
                current_week = []
            
            count = contrib.get("count", 0)
            total_contributions += count
            
            # Determine contribution level
            if count == 0:
                level = "NONE"
            elif count <= 3:
                level = "FIRST_QUARTILE"
            elif count <= 6:
                level = "SECOND_QUARTILE"
            elif count <= 9:
                level = "THIRD_QUARTILE"
            else:
                level = "FOURTH_QUARTILE"
            
            current_week.append(ContributionDay(
                date=contrib["date"],
                contribution_count=count,
                contribution_level=level,
            ))
        
        # Push last week
        if current_week:
            weeks.append(current_week)
        
        return ContributionCalendar(
            total_contributions=data.get("total", {}).get(str(year), total_contributions),
            weeks=weeks,
        )
        
    except Exception:
        return None


def fetch_contribution_data_graphql(
    username: str, 
    year: int, 
    token: str
) -> Optional[ContributionData]:
    """Fetch detailed contribution data via GraphQL API"""
    query = """
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
    """
    
    from_date = f"{year}-01-01T00:00:00Z"
    to_date = f"{year}-12-31T23:59:59Z"
    
    try:
        response = requests.post(
            GITHUB_GRAPHQL_URL,
            json={
                "query": query,
                "variables": {"username": username, "from": from_date, "to": to_date}
            },
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
        )
        
        if not response.ok:
            return None
            
        data = response.json()
        
        if "errors" in data:
            return None
            
        collection = data.get("data", {}).get("user", {}).get("contributionsCollection")
        if not collection:
            return None
        
        # Parse contribution calendar
        cal_data = collection.get("contributionCalendar", {})
        weeks = []
        for week in cal_data.get("weeks", []):
            week_days = []
            for day in week.get("contributionDays", []):
                week_days.append(ContributionDay(
                    date=day["date"],
                    contribution_count=day["contributionCount"],
                    contribution_level=day["contributionLevel"],
                ))
            weeks.append(week_days)
        
        calendar = ContributionCalendar(
            total_contributions=cal_data.get("totalContributions", 0),
            weeks=weeks,
        )
        
        return ContributionData(
            total_commit_contributions=collection.get("totalCommitContributions", 0),
            total_pull_request_contributions=collection.get("totalPullRequestContributions", 0),
            total_issue_contributions=collection.get("totalIssueContributions", 0),
            total_pull_request_review_contributions=collection.get("totalPullRequestReviewContributions", 0),
            total_repositories_with_contributed_commits=collection.get("totalRepositoriesWithContributedCommits", 0),
            contribution_calendar=calendar,
            commit_contributions_by_repository=collection.get("commitContributionsByRepository", []),
        )
        
    except Exception:
        return None


@dataclass
class AllGitHubData:
    user: GitHubUser
    repos: List[GitHubRepo]
    events: List[GitHubEvent]
    contribution_data: Optional[ContributionData]
    contribution_calendar: Optional[ContributionCalendar]


def fetch_all_github_data(
    username: str, 
    year: int, 
    token: Optional[str] = None
) -> AllGitHubData:
    """Fetch all GitHub data for a user"""
    user = fetch_user_profile(username)
    repos = fetch_user_repos(username)
    events = fetch_user_events(username)
    
    contribution_data = None
    if token:
        contribution_data = fetch_contribution_data_graphql(username, year, token)
    
    contribution_calendar = fetch_contribution_calendar_fallback(username, year)
    
    return AllGitHubData(
        user=user,
        repos=repos,
        events=events,
        contribution_data=contribution_data,
        contribution_calendar=contribution_calendar,
    )
