"""
Insights Engine - Data Processing
Port of src/services/insightsEngine.ts
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from datetime import datetime
from collections import Counter

from github_api import (
    AllGitHubData, 
    GitHubEvent, 
    GitHubRepo, 
    ContributionCalendar,
    ContributionData,
)


# ========================================
# Constants
# ========================================

DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

LANGUAGE_COLORS = {
    'JavaScript': '#f7df1e',
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C++': '#f34b7d',
    'C': '#555555',
    'C#': '#178600',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'Ruby': '#701516',
    'PHP': '#4F5D95',
    'Swift': '#F05138',
    'Kotlin': '#A97BFF',
    'Dart': '#00B4AB',
    'Scala': '#c22d40',
    'Shell': '#89e051',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Vue': '#41b883',
    'SCSS': '#c6538c',
    'Lua': '#000080',
    'R': '#198CE7',
    'Perl': '#0298c3',
    'Haskell': '#5e5086',
    'Elixir': '#6e4a7e',
    'Clojure': '#db5855',
}


def get_language_color(language: str) -> str:
    return LANGUAGE_COLORS.get(language, '#8b949e')


# ========================================
# Data Classes
# ========================================

@dataclass
class LanguageStat:
    name: str
    count: int
    percentage: int
    color: str


@dataclass
class RepoStat:
    name: str
    full_name: str
    url: str
    stars: int
    commits: int
    language: Optional[str]
    description: Optional[str]


@dataclass
class MonthlyActivity:
    month: str
    year: int
    contributions: int


@dataclass
class PersonalityTrait:
    name: str
    value: int  # 0-100
    label: str


@dataclass
class DeveloperPersonality:
    title: str
    emoji: str
    description: str
    traits: List[PersonalityTrait]


@dataclass
class WrappedInsights:
    # Basic Stats
    total_contributions: int
    total_commits: int
    total_prs: int
    total_issues: int
    total_reviews: int
    
    # Repository Stats
    repositories_contributed_to: int
    new_repositories_created: int
    top_repositories: List[RepoStat]
    
    # Language Stats
    top_languages: List[LanguageStat]
    total_languages: int
    
    # Time-based Stats
    most_productive_day: str
    most_productive_hour: int
    peak_hour_range: str
    activity_by_day: Dict[str, int]
    activity_by_hour: Dict[int, int]
    monthly_activity: List[MonthlyActivity]
    
    # Streaks
    longest_streak: int
    current_streak: int
    total_active_days: int
    
    # Scores
    solo_vs_team_score: int
    bug_slayer_score: int
    
    # Calendar
    contribution_calendar: Optional[ContributionCalendar]
    
    # Personality
    personality: DeveloperPersonality


# ========================================
# Calculation Functions
# ========================================

def calculate_basic_stats(
    events: List[GitHubEvent],
    contribution_data: Optional[ContributionData],
    contribution_calendar: Optional[ContributionCalendar],
) -> Dict[str, Any]:
    """Calculate basic contribution stats"""
    commits = 0
    prs = 0
    issues = 0
    reviews = 0
    repos_set = set()
    
    # Calculate commits from contribution calendar (most accurate)
    calendar_commits = 0
    if contribution_calendar:
        for week in contribution_calendar.weeks:
            for day in week:
                calendar_commits += day.contribution_count
    
    # Process events
    for event in events:
        event_type = event.type
        if event_type == 'PushEvent':
            payload_commits = event.payload.get('commits', [])
            commits += len(payload_commits) if payload_commits else 1
            repos_set.add(event.repo.get('name', ''))
        elif event_type == 'PullRequestEvent':
            prs += 1
            repos_set.add(event.repo.get('name', ''))
        elif event_type == 'IssuesEvent':
            issues += 1
            repos_set.add(event.repo.get('name', ''))
        elif event_type == 'PullRequestReviewEvent':
            reviews += 1
            repos_set.add(event.repo.get('name', ''))
    
    # Prefer GraphQL data if available
    if contribution_data:
        return {
            'total_contributions': contribution_data.contribution_calendar.total_contributions,
            'commits': contribution_data.total_commit_contributions,
            'prs': contribution_data.total_pull_request_contributions,
            'issues': contribution_data.total_issue_contributions,
            'reviews': contribution_data.total_pull_request_review_contributions,
            'repos_contributed_to': contribution_data.total_repositories_with_contributed_commits,
        }
    
    # Use calendar commits if available
    final_commits = calendar_commits if calendar_commits > 0 else commits
    
    total = contribution_calendar.total_contributions if contribution_calendar else (final_commits + prs + issues + reviews)
    
    return {
        'total_contributions': total,
        'commits': final_commits,
        'prs': prs,
        'issues': issues,
        'reviews': reviews,
        'repos_contributed_to': len(repos_set),
    }


def calculate_language_stats(repos: List[GitHubRepo]) -> Dict[str, Any]:
    """Calculate language statistics from repositories"""
    language_counts: Counter = Counter()
    
    for repo in repos:
        if repo.language and not repo.fork:
            language_counts[repo.language] += 1
    
    total_repos = sum(language_counts.values())
    if total_repos == 0:
        return {'top_languages': [], 'total_languages': 0}
    
    languages = [
        LanguageStat(
            name=name,
            count=count,
            percentage=round((count / total_repos) * 100),
            color=get_language_color(name),
        )
        for name, count in language_counts.most_common()
    ]
    
    return {
        'top_languages': languages[:8],
        'total_languages': len(languages),
    }


def calculate_top_repos(
    repos: List[GitHubRepo],
    contribution_data: Optional[ContributionData],
) -> List[RepoStat]:
    """Calculate top repositories"""
    if contribution_data and contribution_data.commit_contributions_by_repository:
        repo_stats = []
        for item in contribution_data.commit_contributions_by_repository:
            repo = item.get('repository', {})
            contributions = item.get('contributions', {})
            repo_stats.append(RepoStat(
                name=repo.get('name', ''),
                full_name=repo.get('nameWithOwner', ''),
                url=repo.get('url', ''),
                stars=repo.get('stargazerCount', 0),
                commits=contributions.get('totalCount', 0),
                language=repo.get('primaryLanguage', {}).get('name') if repo.get('primaryLanguage') else None,
                description=repo.get('description'),
            ))
        repo_stats.sort(key=lambda x: x.commits, reverse=True)
        return repo_stats[:6]
    
    # Fallback: sort by stars and recent activity
    non_fork_repos = [r for r in repos if not r.fork]
    non_fork_repos.sort(
        key=lambda r: r.stargazers_count + (datetime.fromisoformat(r.pushed_at.replace('Z', '+00:00')).timestamp() / 1e12),
        reverse=True
    )
    
    return [
        RepoStat(
            name=repo.name,
            full_name=repo.full_name,
            url=repo.html_url,
            stars=repo.stargazers_count,
            commits=0,
            language=repo.language,
            description=repo.description,
        )
        for repo in non_fork_repos[:6]
    ]


def calculate_activity_patterns(
    events: List[GitHubEvent],
    calendar: Optional[ContributionCalendar],
    year: int,
) -> Dict[str, Any]:
    """Calculate activity patterns by day, hour, and month"""
    day_activity = {i: 0 for i in range(7)}
    hour_activity = {i: 0 for i in range(24)}
    monthly_contributions = {i: 0 for i in range(12)}
    
    # Process events for hour activity
    for event in events:
        date = datetime.fromisoformat(event.created_at.replace('Z', '+00:00'))
        hour_activity[date.hour] += 1
    
    # Use contribution calendar for day and monthly stats
    if calendar:
        for week in calendar.weeks:
            for day in week:
                date = datetime.fromisoformat(day.date.replace('Z', '+00:00') if 'Z' in day.date else day.date)
                if date.year == year and day.contribution_count > 0:
                    # Sunday = 0, Monday = 1, etc.
                    weekday = (date.weekday() + 1) % 7
                    day_activity[weekday] += day.contribution_count
                    monthly_contributions[date.month - 1] += day.contribution_count
    else:
        # Fallback to events
        for event in events:
            date = datetime.fromisoformat(event.created_at.replace('Z', '+00:00'))
            weekday = (date.weekday() + 1) % 7
            day_activity[weekday] += 1
            monthly_contributions[date.month - 1] += 1
    
    # Find most productive day
    most_productive_day = max(day_activity, key=day_activity.get)
    
    # Find most productive hour
    most_productive_hour = max(hour_activity, key=hour_activity.get)
    
    # Calculate peak hour range
    peak_start = max(0, most_productive_hour - 1)
    peak_end = min(23, most_productive_hour + 1)
    
    def format_hour(h: int) -> str:
        if h == 0:
            return '12 AM'
        if h == 12:
            return '12 PM'
        return f'{h - 12} PM' if h > 12 else f'{h} AM'
    
    peak_hour_range = f"{format_hour(peak_start)} - {format_hour(peak_end)}"
    
    # Convert to named days
    activity_by_day = {DAYS[i]: count for i, count in day_activity.items()}
    
    # Create monthly activity
    monthly_activity = [
        MonthlyActivity(month=MONTHS[i], year=year, contributions=monthly_contributions[i])
        for i in range(12)
    ]
    
    return {
        'most_productive_day': DAYS[most_productive_day],
        'most_productive_hour': most_productive_hour,
        'peak_hour_range': peak_hour_range,
        'activity_by_day': activity_by_day,
        'activity_by_hour': hour_activity,
        'monthly_activity': monthly_activity,
    }


def calculate_streaks(calendar: Optional[ContributionCalendar]) -> Dict[str, int]:
    """Calculate contribution streaks"""
    if not calendar:
        return {'longest_streak': 0, 'current_streak': 0, 'total_active_days': 0}
    
    longest_streak = 0
    current_streak = 0
    temp_streak = 0
    total_active_days = 0
    
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Flatten contribution days
    all_days = []
    for week in calendar.weeks:
        all_days.extend(week)
    
    # Sort by date
    all_days.sort(key=lambda d: d.date)
    
    for i, day in enumerate(all_days):
        day_date = datetime.fromisoformat(day.date.replace('Z', '+00:00') if 'Z' in day.date else day.date)
        day_date = day_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
        
        if day.contribution_count > 0:
            total_active_days += 1
            temp_streak += 1
            
            # Check if this is today or yesterday for current streak
            diff_days = (today - day_date).days
            if diff_days <= 1:
                current_streak = temp_streak
        else:
            longest_streak = max(longest_streak, temp_streak)
            temp_streak = 0
    
    longest_streak = max(longest_streak, temp_streak)
    
    return {
        'longest_streak': longest_streak,
        'current_streak': current_streak,
        'total_active_days': total_active_days,
    }


def calculate_scores(
    events: List[GitHubEvent],
    repos: List[GitHubRepo],
) -> Dict[str, int]:
    """Calculate solo vs team and bug slayer scores"""
    # Solo vs Team: based on fork ratio
    own_repos = [r for r in repos if not r.fork]
    forked_repos = [r for r in repos if r.fork]
    total = len(own_repos) + len(forked_repos)
    solo_score = round((len(own_repos) / max(1, total)) * 100) if total > 0 else 50
    
    # Bug Slayer: ratio of issues to PRs
    issues = sum(1 for e in events if e.type == 'IssuesEvent')
    prs = sum(1 for e in events if e.type == 'PullRequestEvent')
    bug_slayer_score = round((issues / (issues + prs)) * 100) if (issues + prs) > 0 else 50
    
    return {
        'solo_score': solo_score,
        'bug_slayer_score': bug_slayer_score,
    }


def calculate_personality(
    repos: List[GitHubRepo],
    activity: Dict[str, Any],
    scores: Dict[str, int],
) -> DeveloperPersonality:
    """Calculate developer personality profile"""
    traits = []
    
    # Time-based trait
    most_productive_hour = activity['most_productive_hour']
    is_night_owl = most_productive_hour >= 20 or most_productive_hour < 6
    is_early_bird = 5 <= most_productive_hour < 10
    
    if is_night_owl:
        traits.append(PersonalityTrait(
            name='Night Owl',
            value=85,
            label='🦉 Codes when the moon is out',
        ))
    elif is_early_bird:
        traits.append(PersonalityTrait(
            name='Early Bird',
            value=15,
            label='🐦 Catches the morning commits',
        ))
    else:
        traits.append(PersonalityTrait(
            name='Daytime Coder',
            value=50,
            label='☀️ Peak performance during sunlight',
        ))
    
    # Language diversity trait
    languages = set(r.language for r in repos if r.language)
    is_polyglot = len(languages) >= 5
    traits.append(PersonalityTrait(
        name='Polyglot' if is_polyglot else 'Specialist',
        value=min(100, len(languages) * 15),
        label='🌍 Master of many languages' if is_polyglot else '🎯 Deep expertise in few',
    ))
    
    # Work style trait
    activity_by_day = activity['activity_by_day']
    weekend_activity = activity_by_day.get('Saturday', 0) + activity_by_day.get('Sunday', 0)
    weekday_activity = sum(
        activity_by_day.get(day, 0) 
        for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    )
    is_weekend_warrior = weekend_activity > weekday_activity * 0.4
    traits.append(PersonalityTrait(
        name='Weekend Warrior' if is_weekend_warrior else 'Weekday Wonder',
        value=80 if is_weekend_warrior else 30,
        label='💪 Codes through weekends' if is_weekend_warrior else '📅 Balanced work schedule',
    ))
    
    # Collaboration trait
    solo_score = scores['solo_score']
    is_solo = solo_score > 70
    traits.append(PersonalityTrait(
        name='Solo Coder' if is_solo else 'Team Player',
        value=solo_score,
        label='🏴‍☠️ Independent creator' if is_solo else '🤝 Collaborative spirit',
    ))
    
    # Determine title
    title = 'Code Crafter'
    emoji = '👨‍💻'
    description = 'A balanced developer with diverse skills.'
    bug_slayer_score = scores['bug_slayer_score']
    
    if is_night_owl and is_polyglot:
        title = 'Nocturnal Polyglot'
        emoji = '🦉'
        description = 'A versatile night owl who masters multiple languages under the moonlight.'
    elif is_early_bird and is_solo:
        title = 'Dawn Pioneer'
        emoji = '🌅'
        description = 'An independent creator who catches bugs before anyone else wakes up.'
    elif is_weekend_warrior and bug_slayer_score > 60:
        title = 'Weekend Bug Hunter'
        emoji = '🐛'
        description = 'A dedicated problem solver who squashes bugs even on their days off.'
    elif is_polyglot and not is_solo:
        title = 'Open Source Champion'
        emoji = '🏆'
        description = 'A collaborative polyglot who contributes across the ecosystem.'
    elif is_solo and len(languages) <= 2:
        title = 'Deep Specialist'
        emoji = '🎯'
        description = 'A focused expert who has mastered their chosen technology stack.'
    elif is_night_owl and is_weekend_warrior:
        title = 'Code Ninja'
        emoji = '🥷'
        description = 'Strikes when least expected, codes through nights and weekends.'
    
    return DeveloperPersonality(
        title=title,
        emoji=emoji,
        description=description,
        traits=traits,
    )


# ========================================
# Main Function
# ========================================

def calculate_insights(data: AllGitHubData, year: int) -> WrappedInsights:
    """Calculate all insights from GitHub data"""
    # Filter events for selected year
    year_events = [
        e for e in data.events
        if datetime.fromisoformat(e.created_at.replace('Z', '+00:00')).year == year
    ]
    
    # Filter repos created in selected year
    year_repos = [
        r for r in data.repos
        if datetime.fromisoformat(r.created_at.replace('Z', '+00:00')).year == year
    ]
    
    # Calculate stats
    basic_stats = calculate_basic_stats(
        year_events, 
        data.contribution_data, 
        data.contribution_calendar
    )
    language_stats = calculate_language_stats(data.repos)
    top_repos = calculate_top_repos(data.repos, data.contribution_data)
    activity_patterns = calculate_activity_patterns(
        year_events, 
        data.contribution_calendar, 
        year
    )
    streaks = calculate_streaks(data.contribution_calendar)
    scores = calculate_scores(year_events, data.repos)
    personality = calculate_personality(data.repos, activity_patterns, scores)
    
    # Prefer GraphQL data for totals
    if data.contribution_data:
        total_contributions = data.contribution_data.contribution_calendar.total_contributions
        total_commits = data.contribution_data.total_commit_contributions
        total_prs = data.contribution_data.total_pull_request_contributions
        total_issues = data.contribution_data.total_issue_contributions
        total_reviews = data.contribution_data.total_pull_request_review_contributions
        repos_contributed_to = data.contribution_data.total_repositories_with_contributed_commits
    else:
        total_contributions = basic_stats['total_contributions']
        total_commits = basic_stats['commits']
        total_prs = basic_stats['prs']
        total_issues = basic_stats['issues']
        total_reviews = basic_stats['reviews']
        repos_contributed_to = basic_stats['repos_contributed_to']
    
    return WrappedInsights(
        total_contributions=total_contributions,
        total_commits=total_commits,
        total_prs=total_prs,
        total_issues=total_issues,
        total_reviews=total_reviews,
        repositories_contributed_to=repos_contributed_to,
        new_repositories_created=len(year_repos),
        top_repositories=top_repos,
        top_languages=language_stats['top_languages'],
        total_languages=language_stats['total_languages'],
        most_productive_day=activity_patterns['most_productive_day'],
        most_productive_hour=activity_patterns['most_productive_hour'],
        peak_hour_range=activity_patterns['peak_hour_range'],
        activity_by_day=activity_patterns['activity_by_day'],
        activity_by_hour=activity_patterns['activity_by_hour'],
        monthly_activity=activity_patterns['monthly_activity'],
        longest_streak=streaks['longest_streak'],
        current_streak=streaks['current_streak'],
        total_active_days=streaks['total_active_days'],
        solo_vs_team_score=scores['solo_score'],
        bug_slayer_score=scores['bug_slayer_score'],
        contribution_calendar=data.contribution_calendar,
        personality=personality,
    )
