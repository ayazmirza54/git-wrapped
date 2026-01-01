"""
GitHub Wrapped - Streamlit App
Main application file
"""

import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime

from github_api import fetch_all_github_data, GitHubApiError
from insights_engine import calculate_insights, get_language_color


# ========================================
# Page Configuration
# ========================================

st.set_page_config(
    page_title="GitHub Wrapped",
    page_icon="🎁",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ========================================
# Custom CSS
# ========================================

st.markdown("""
<style>
    /* Main theme */
    .stApp {
        background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
    }
    
    /* Header styling */
    .main-header {
        text-align: center;
        padding: 2rem 0;
        background: linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, rgba(163, 113, 247, 0.1) 100%);
        border-radius: 16px;
        margin-bottom: 2rem;
        border: 1px solid rgba(88, 166, 255, 0.2);
    }
    
    .main-header h1 {
        font-size: 3rem;
        background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    
    .main-header p {
        color: #8b949e;
        font-size: 1.2rem;
    }
    
    /* Stats cards */
    .stats-card {
        background: rgba(22, 27, 34, 0.8);
        border: 1px solid rgba(48, 54, 61, 0.8);
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.3s ease;
    }
    
    .stats-card:hover {
        border-color: #58a6ff;
        box-shadow: 0 0 20px rgba(88, 166, 255, 0.2);
    }
    
    .stats-value {
        font-size: 2.5rem;
        font-weight: bold;
        background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    .stats-label {
        color: #8b949e;
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }
    
    /* Personality card */
    .personality-card {
        background: linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, rgba(163, 113, 247, 0.1) 100%);
        border: 1px solid rgba(163, 113, 247, 0.3);
        border-radius: 16px;
        padding: 2rem;
        text-align: center;
        margin: 1rem 0;
    }
    
    .personality-emoji {
        font-size: 4rem;
        margin-bottom: 1rem;
    }
    
    .personality-title {
        font-size: 2rem;
        font-weight: bold;
        background: linear-gradient(135deg, #a371f7 0%, #f778ba 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    .personality-description {
        color: #8b949e;
        font-size: 1.1rem;
        margin-top: 0.5rem;
    }
    
    /* Trait bar */
    .trait-container {
        margin: 1rem 0;
    }
    
    .trait-label {
        display: flex;
        justify-content: space-between;
        color: #c9d1d9;
        margin-bottom: 0.5rem;
    }
    
    .trait-bar {
        height: 8px;
        background: rgba(48, 54, 61, 0.8);
        border-radius: 4px;
        overflow: hidden;
    }
    
    .trait-fill {
        height: 100%;
        background: linear-gradient(90deg, #58a6ff 0%, #a371f7 100%);
        border-radius: 4px;
    }
    
    /* User profile */
    .user-profile {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: rgba(22, 27, 34, 0.8);
        border-radius: 12px;
        border: 1px solid rgba(48, 54, 61, 0.8);
    }
    
    .user-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 3px solid #58a6ff;
    }
    
    .user-info h3 {
        color: #c9d1d9;
        margin: 0;
    }
    
    .user-info p {
        color: #8b949e;
        margin: 0;
    }
    
    /* Repo card */
    .repo-card {
        background: rgba(22, 27, 34, 0.8);
        border: 1px solid rgba(48, 54, 61, 0.8);
        border-radius: 12px;
        padding: 1rem;
        margin: 0.5rem 0;
    }
    
    .repo-card:hover {
        border-color: #58a6ff;
    }
    
    .repo-name {
        color: #58a6ff;
        font-weight: bold;
        text-decoration: none;
    }
    
    .repo-description {
        color: #8b949e;
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }
    
    /* Section header */
    .section-header {
        color: #c9d1d9;
        font-size: 1.5rem;
        font-weight: bold;
        margin: 2rem 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid rgba(88, 166, 255, 0.3);
    }
    
    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
</style>
""", unsafe_allow_html=True)


# ========================================
# Helper Functions
# ========================================

def render_stat_card(value, label, emoji=""):
    """Render a statistics card"""
    st.markdown(f"""
        <div class="stats-card">
            <div class="stats-value">{emoji} {value:,}</div>
            <div class="stats-label">{label}</div>
        </div>
    """, unsafe_allow_html=True)


def render_personality_card(personality):
    """Render the personality card"""
    st.markdown(f"""
        <div class="personality-card">
            <div class="personality-emoji">{personality.emoji}</div>
            <div class="personality-title">{personality.title}</div>
            <div class="personality-description">{personality.description}</div>
        </div>
    """, unsafe_allow_html=True)


def render_trait_bar(trait):
    """Render a personality trait bar"""
    st.markdown(f"""
        <div class="trait-container">
            <div class="trait-label">
                <span>{trait.name}</span>
                <span>{trait.label}</span>
            </div>
            <div class="trait-bar">
                <div class="trait-fill" style="width: {trait.value}%;"></div>
            </div>
        </div>
    """, unsafe_allow_html=True)


def create_contribution_heatmap(calendar, year):
    """Create a contribution heatmap using Plotly"""
    if not calendar or not calendar.weeks:
        return None
    
    # Prepare data
    dates = []
    counts = []
    
    for week in calendar.weeks:
        for day in week:
            dates.append(day.date)
            counts.append(day.contribution_count)
    
    # Create dataframe
    df = pd.DataFrame({'date': dates, 'contributions': counts})
    df['date'] = pd.to_datetime(df['date'])
    df['week'] = df['date'].dt.isocalendar().week
    df['weekday'] = df['date'].dt.weekday
    
    # Filter for the selected year
    df = df[df['date'].dt.year == year]
    
    # Create heatmap
    fig = go.Figure(data=go.Heatmap(
        x=df['week'],
        y=df['weekday'],
        z=df['contributions'],
        colorscale=[
            [0, '#161b22'],
            [0.25, '#0e4429'],
            [0.5, '#006d32'],
            [0.75, '#26a641'],
            [1, '#39d353']
        ],
        showscale=False,
        hovertemplate='Week %{x}<br>%{z} contributions<extra></extra>',
    ))
    
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=150,
        margin=dict(l=30, r=30, t=10, b=10),
        xaxis=dict(
            showticklabels=False,
            showgrid=False,
            zeroline=False,
        ),
        yaxis=dict(
            ticktext=['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            tickvals=[6, 5, 4, 3, 2, 1, 0],
            showgrid=False,
            tickfont=dict(color='#8b949e', size=10),
        ),
    )
    
    return fig


def create_language_chart(languages):
    """Create a language distribution donut chart"""
    if not languages:
        return None
    
    names = [lang.name for lang in languages]
    values = [lang.count for lang in languages]
    colors = [lang.color for lang in languages]
    
    fig = go.Figure(data=[go.Pie(
        labels=names,
        values=values,
        hole=0.6,
        marker=dict(colors=colors),
        textinfo='label+percent',
        textposition='outside',
        textfont=dict(color='#c9d1d9'),
        hovertemplate='%{label}<br>%{value} repos<br>%{percent}<extra></extra>',
    )])
    
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        showlegend=False,
        height=350,
        margin=dict(l=50, r=50, t=30, b=30),
        annotations=[dict(
            text='Languages',
            x=0.5, y=0.5,
            font=dict(size=16, color='#8b949e'),
            showarrow=False,
        )],
    )
    
    return fig


def create_activity_chart(activity_by_day):
    """Create an activity by day bar chart"""
    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    values = [activity_by_day.get(day, 0) for day in days]
    
    fig = go.Figure(data=[go.Bar(
        x=['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        y=values,
        marker=dict(
            color=values,
            colorscale=[[0, '#161b22'], [0.5, '#58a6ff'], [1, '#a371f7']],
        ),
        hovertemplate='%{x}: %{y} contributions<extra></extra>',
    )])
    
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=250,
        margin=dict(l=40, r=20, t=20, b=40),
        xaxis=dict(
            tickfont=dict(color='#8b949e'),
            showgrid=False,
        ),
        yaxis=dict(
            tickfont=dict(color='#8b949e'),
            gridcolor='rgba(48, 54, 61, 0.5)',
        ),
    )
    
    return fig


def create_monthly_chart(monthly_activity):
    """Create a monthly activity area chart"""
    months = [m.month for m in monthly_activity]
    values = [m.contributions for m in monthly_activity]
    
    fig = go.Figure(data=[go.Scatter(
        x=months,
        y=values,
        fill='tozeroy',
        mode='lines+markers',
        line=dict(color='#58a6ff', width=2),
        fillcolor='rgba(88, 166, 255, 0.2)',
        marker=dict(size=8, color='#58a6ff'),
        hovertemplate='%{x}: %{y} contributions<extra></extra>',
    )])
    
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=250,
        margin=dict(l=40, r=20, t=20, b=40),
        xaxis=dict(
            tickfont=dict(color='#8b949e'),
            showgrid=False,
        ),
        yaxis=dict(
            tickfont=dict(color='#8b949e'),
            gridcolor='rgba(48, 54, 61, 0.5)',
        ),
    )
    
    return fig


# ========================================
# Sidebar
# ========================================

with st.sidebar:
    st.markdown("## 🎁 GitHub Wrapped")
    st.markdown("---")
    
    # Username input
    username = st.text_input(
        "GitHub Username",
        placeholder="Enter username...",
        help="Enter a GitHub username to see their year in review"
    )
    
    # Year selector
    current_year = datetime.now().year
    year = st.selectbox(
        "Year",
        options=list(range(current_year, current_year - 5, -1)),
        index=0,
    )
    
    # Optional GitHub token
    with st.expander("🔑 GitHub Token (Optional)"):
        st.markdown("""
            <small style="color: #8b949e;">
            A personal access token enables more detailed stats via the GraphQL API.
            Create one at <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings</a>.
            </small>
        """, unsafe_allow_html=True)
        token = st.text_input(
            "Token",
            type="password",
            placeholder="ghp_...",
            label_visibility="collapsed",
        )
    
    # Generate button
    generate_clicked = st.button(
        "✨ Generate Wrapped",
        type="primary",
        use_container_width=True,
        disabled=not username.strip(),
    )
    
    st.markdown("---")
    st.markdown("""
        <div style="text-align: center; color: #8b949e; font-size: 0.8rem;">
            Made with 💜 using Streamlit
        </div>
    """, unsafe_allow_html=True)


# ========================================
# Main Content
# ========================================

# Store data in session state
if 'insights' not in st.session_state:
    st.session_state.insights = None
if 'user' not in st.session_state:
    st.session_state.user = None
if 'current_username' not in st.session_state:
    st.session_state.current_username = None
if 'current_year' not in st.session_state:
    st.session_state.current_year = None

# Handle generate button
if generate_clicked and username.strip():
    with st.spinner(f"Fetching data for @{username}..."):
        try:
            data = fetch_all_github_data(
                username.strip(),
                year,
                token if token else None
            )
            insights = calculate_insights(data, year)
            st.session_state.insights = insights
            st.session_state.user = data.user
            st.session_state.current_username = username.strip()
            st.session_state.current_year = year
        except GitHubApiError as e:
            st.error(f"❌ {e.message}")
            st.session_state.insights = None
            st.session_state.user = None
        except Exception as e:
            st.error(f"❌ An error occurred: {str(e)}")
            st.session_state.insights = None
            st.session_state.user = None

# Show content based on state
if st.session_state.insights and st.session_state.user:
    insights = st.session_state.insights
    user = st.session_state.user
    display_year = st.session_state.current_year
    
    # Header with user profile
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown(f"""
            <div class="main-header">
                <img src="{user.avatar_url}" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid #58a6ff; margin-bottom: 1rem;">
                <h1>@{user.login}'s {display_year}</h1>
                <p>{user.name or 'GitHub Wrapped'}</p>
            </div>
        """, unsafe_allow_html=True)
    
    # Stats Overview
    st.markdown('<div class="section-header">📊 Contribution Stats</div>', unsafe_allow_html=True)
    
    cols = st.columns(5)
    with cols[0]:
        render_stat_card(insights.total_contributions, "Total Contributions", "🎯")
    with cols[1]:
        render_stat_card(insights.total_commits, "Commits", "💾")
    with cols[2]:
        render_stat_card(insights.total_prs, "Pull Requests", "🔀")
    with cols[3]:
        render_stat_card(insights.total_issues, "Issues", "🐛")
    with cols[4]:
        render_stat_card(insights.total_reviews, "Reviews", "👀")
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Contribution Heatmap
    st.markdown('<div class="section-header">📅 Contribution Calendar</div>', unsafe_allow_html=True)
    
    heatmap = create_contribution_heatmap(insights.contribution_calendar, display_year)
    if heatmap:
        st.plotly_chart(heatmap, use_container_width=True, config={'displayModeBar': False})
    
    # Streaks
    cols = st.columns(3)
    with cols[0]:
        render_stat_card(insights.longest_streak, "Longest Streak 🔥", "")
    with cols[1]:
        render_stat_card(insights.current_streak, "Current Streak ⚡", "")
    with cols[2]:
        render_stat_card(insights.total_active_days, "Active Days 📆", "")
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Two columns: Languages and Activity
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown('<div class="section-header">💻 Top Languages</div>', unsafe_allow_html=True)
        lang_chart = create_language_chart(insights.top_languages)
        if lang_chart:
            st.plotly_chart(lang_chart, use_container_width=True, config={'displayModeBar': False})
        else:
            st.info("No language data available")
    
    with col2:
        st.markdown('<div class="section-header">📈 Activity by Day</div>', unsafe_allow_html=True)
        activity_chart = create_activity_chart(insights.activity_by_day)
        st.plotly_chart(activity_chart, use_container_width=True, config={'displayModeBar': False})
        
        st.markdown(f"""
            <div style="text-align: center; color: #8b949e; margin-top: -1rem;">
                Most productive: <strong style="color: #58a6ff;">{insights.most_productive_day}</strong> • 
                Peak hours: <strong style="color: #58a6ff;">{insights.peak_hour_range}</strong>
            </div>
        """, unsafe_allow_html=True)
    
    # Monthly Activity
    st.markdown('<div class="section-header">📊 Monthly Activity</div>', unsafe_allow_html=True)
    monthly_chart = create_monthly_chart(insights.monthly_activity)
    st.plotly_chart(monthly_chart, use_container_width=True, config={'displayModeBar': False})
    
    # Top Repositories
    if insights.top_repositories:
        st.markdown('<div class="section-header">⭐ Top Repositories</div>', unsafe_allow_html=True)
        
        cols = st.columns(2)
        for i, repo in enumerate(insights.top_repositories[:6]):
            with cols[i % 2]:
                lang_badge = ""
                if repo.language:
                    color = get_language_color(repo.language)
                    lang_badge = f'<span style="color: {color};">●</span> {repo.language}'
                
                st.markdown(f"""
                    <div class="repo-card">
                        <a href="{repo.url}" target="_blank" class="repo-name">{repo.name}</a>
                        <span style="float: right; color: #8b949e;">⭐ {repo.stars}</span>
                        <div class="repo-description">{repo.description or 'No description'}</div>
                        <div style="margin-top: 0.5rem; color: #8b949e; font-size: 0.8rem;">
                            {lang_badge}
                            {f' • {repo.commits} commits' if repo.commits else ''}
                        </div>
                    </div>
                """, unsafe_allow_html=True)
    
    # Developer Personality
    st.markdown('<div class="section-header">🎭 Developer Personality</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        render_personality_card(insights.personality)
    
    with col2:
        st.markdown("<br>", unsafe_allow_html=True)
        for trait in insights.personality.traits:
            render_trait_bar(trait)
    
    # Footer
    st.markdown("<br><br>", unsafe_allow_html=True)
    st.markdown(f"""
        <div style="text-align: center; color: #8b949e; padding: 2rem;">
            Thanks for an amazing {display_year}! 🎉<br>
            <small>Generated with GitHub Wrapped</small>
        </div>
    """, unsafe_allow_html=True)

else:
    # Landing page
    st.markdown("""
        <div style="text-align: center; padding: 4rem 2rem;">
            <div style="font-size: 5rem; margin-bottom: 1rem;">🎁</div>
            <h1 style="font-size: 3rem; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                GitHub Wrapped
            </h1>
            <p style="color: #8b949e; font-size: 1.3rem; max-width: 600px; margin: 1rem auto;">
                Discover your GitHub highlights, stats, and coding personality<br>
                wrapped up in a beautiful dashboard.
            </p>
            <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 2rem; flex-wrap: wrap;">
                <div style="color: #8b949e;">📊 Contribution Stats</div>
                <div style="color: #8b949e;">💻 Top Languages</div>
                <div style="color: #8b949e;">🔥 Streak Analysis</div>
                <div style="color: #8b949e;">🎭 Developer Personality</div>
            </div>
            <p style="color: #6e7681; margin-top: 3rem;">
                👈 Enter a GitHub username in the sidebar to get started
            </p>
        </div>
    """, unsafe_allow_html=True)
