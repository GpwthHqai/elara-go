import './style.css'

// State management
const state = {
  currentView: 'landing',
  user: null,
  tasks: [],
  habits: [],
  goals: [],
  journal: []
};

// Mock data for demo
const mockData = {
  tasks: [
    { id: 1, title: 'Review quarterly OKRs', project: 'Strategy', priority: 'High', dueDate: '2024-01-15', status: 'In Progress' },
    { id: 2, title: 'Prepare investor deck', project: 'Fundraising', priority: 'High', dueDate: '2024-01-16', status: 'Not Started' },
    { id: 3, title: 'Team 1:1 meetings', project: 'Management', priority: 'Medium', dueDate: '2024-01-17', status: 'Completed' }
  ],
  habits: [
    { id: 1, name: 'Morning meditation', streak: 12, completed: [1, 1, 0, 1, 1, 0, 1] },
    { id: 2, name: 'Exercise', streak: 8, completed: [1, 0, 1, 1, 0, 0, 1] },
    { id: 3, name: 'Journal writing', streak: 15, completed: [1, 1, 1, 0, 1, 1, 1] }
  ],
  goals: [
    { id: 1, title: 'Launch new product feature', progress: 75, deadline: '2024-02-01' },
    { id: 2, title: 'Complete leadership course', progress: 40, deadline: '2024-03-15' },
    { id: 3, title: 'Improve team satisfaction score', progress: 60, deadline: '2024-01-31' }
  ],
  stats: {
    tasksCompleted: 23,
    habitStreak: 12,
    goalsInProgress: 3,
    wellnessScore: 8.2
  }
};

// Utility functions
function createElement(tag, className = '', content = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) element.innerHTML = content;
  return element;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

// Components
function createHeader() {
  return `
    <header class="header">
      <div class="container">
        <nav class="nav">
          <div class="brand">
            <div class="logo"></div>
            <span>Zenith</span>
          </div>
          <div class="nav-links">
            ${state.currentView === 'landing' ? `
              <a href="#features" class="btn-ghost">Features</a>
              <a href="#pricing" class="btn-ghost">Pricing</a>
              <button class="btn-ghost" onclick="showLogin()">Sign In</button>
              <button class="btn-primary" onclick="showSignup()">Start Free Trial</button>
            ` : `
              <button class="btn-ghost" onclick="showLanding()">Home</button>
              <button class="btn-ghost" onclick="logout()">Sign Out</button>
            `}
          </div>
        </nav>
      </div>
    </header>
  `;
}

function createLandingPage() {
  return `
    ${createHeader()}
    
    <!-- Hero Section -->
    <section class="hero container">
      <div class="hero-content">
        <div class="eyebrow">
          <span>🚀</span>
          Productivity • Wellness • Mindfulness
        </div>
        <h1>Master your time.<br>Elevate your mind.</h1>
        <p class="hero-description">
          The premium productivity and wellness platform designed for ambitious Bay Area professionals. 
          Seamlessly integrate task management, habit tracking, and mindfulness practices into one elegant experience.
        </p>
        <div class="hero-actions">
          <button class="btn-primary btn-large" onclick="showSignup()">
            Start Free Trial
          </button>
          <button class="btn-secondary btn-large" onclick="scrollToPricing()">
            Save 40% - 6 Months
          </button>
        </div>
        <div class="hero-features">
          <div class="feature-badge">
            <span>🔒</span>
            Privacy-first design
          </div>
          <div class="feature-badge">
            <span>⚡</span>
            Lightning fast
          </div>
          <div class="feature-badge">
            <span>🧘</span>
            Mindfulness-focused
          </div>
          <div class="feature-badge">
            <span>📊</span>
            Advanced analytics
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-card">
          <h3 class="mb-lg">Integrates seamlessly with</h3>
          <div class="flex gap-sm mb-lg" style="flex-wrap: wrap;">
            <div class="feature-badge">📅 Google Calendar</div>
            <div class="feature-badge">⌚ Apple Health</div>
            <div class="feature-badge">🏃 Fitbit</div>
            <div class="feature-badge">📝 Notion</div>
            <div class="feature-badge">💤 Sleep Cycle</div>
            <div class="feature-badge">🧘 Headspace</div>
          </div>
          <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(59, 130, 246, 0.2);">
            <p style="margin: 0; font-size: 0.875rem; color: var(--accent-primary);">
              <strong>Limited Time:</strong> Save 40% on 6-month plans. Perfect for building lasting habits.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="section">
      <div class="container">
        <div class="text-center mb-xl">
          <h2>Everything you need to thrive</h2>
          <p class="hero-description" style="max-width: 600px; margin: 1rem auto 0;">
            Designed specifically for busy professionals who value both productivity and well-being.
          </p>
        </div>
        
        <div class="features-grid">
          <div class="feature-card fade-in-up">
            <div class="feature-icon">📋</div>
            <h3 class="feature-title">Smart Task Management</h3>
            <p class="feature-description">
              Intelligent prioritization, deadline tracking, and project organization. 
              Focus on what matters most with AI-powered insights.
            </p>
          </div>
          
          <div class="feature-card fade-in-up">
            <div class="feature-icon">🎯</div>
            <h3 class="feature-title">Habit Formation</h3>
            <p class="feature-description">
              Build lasting habits with science-backed tracking. Visual progress indicators 
              and streak counters keep you motivated.
            </p>
          </div>
          
          <div class="feature-card fade-in-up">
            <div class="feature-icon">🧘</div>
            <h3 class="feature-title">Mindfulness Integration</h3>
            <p class="feature-description">
              Daily mood tracking, stress monitoring, and gratitude journaling. 
              Cultivate mental wellness alongside productivity.
            </p>
          </div>
          
          <div class="feature-card fade-in-up">
            <div class="feature-icon">📊</div>
            <h3 class="feature-title">Advanced Analytics</h3>
            <p class="feature-description">
              Comprehensive insights into your productivity patterns, wellness trends, 
              and goal achievement rates.
            </p>
          </div>
          
          <div class="feature-card fade-in-up">
            <div class="feature-icon">🔄</div>
            <h3 class="feature-title">Seamless Sync</h3>
            <p class="feature-description">
              Connect with your favorite tools and devices. Real-time synchronization 
              across all platforms and integrations.
            </p>
          </div>
          
          <div class="feature-card fade-in-up">
            <div class="feature-icon">🎨</div>
            <h3 class="feature-title">Beautiful Interface</h3>
            <p class="feature-description">
              Thoughtfully designed with attention to detail. Clean, intuitive interface 
              that makes tracking a pleasure, not a chore.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="section pricing">
      <div class="container">
        <div class="pricing-header">
          <h2>Choose your journey</h2>
          <p class="hero-description">
            Start free and upgrade when you're ready to unlock your full potential.
          </p>
        </div>
        
        <div class="pricing-grid">
          <div class="pricing-card">
            <div class="plan-name">Free</div>
            <div class="plan-price">$0</div>
            <div class="plan-period">Forever free</div>
            <ul class="plan-features">
              <li>Basic task management</li>
              <li>Simple habit tracking</li>
              <li>Daily mood check-ins</li>
              <li>7-day data history</li>
              <li>Mobile app access</li>
            </ul>
            <button class="btn-primary" style="width: 100%;" onclick="showSignup()">
              Start Free
            </button>
          </div>
          
          <div class="pricing-card featured">
            <div class="plan-name">Pro (6 Months)</div>
            <div class="plan-price">$72</div>
            <div class="plan-period">$12/month • Save 40%</div>
            <ul class="plan-features">
              <li>Everything in Free</li>
              <li>Advanced analytics & insights</li>
              <li>Unlimited data history</li>
              <li>Goal tracking & milestones</li>
              <li>Calendar integrations</li>
              <li>Health app connections</li>
              <li>Custom habit templates</li>
              <li>Export & backup data</li>
              <li>Priority support</li>
            </ul>
            <button class="btn-secondary" style="width: 100%;" onclick="handlePurchase('6month')">
              Get 6 Months Pro
            </button>
          </div>
          
          <div class="pricing-card">
            <div class="plan-name">Pro (Monthly)</div>
            <div class="plan-price">$20</div>
            <div class="plan-period">per month</div>
            <ul class="plan-features">
              <li>Everything in Free</li>
              <li>Advanced analytics & insights</li>
              <li>Unlimited data history</li>
              <li>Goal tracking & milestones</li>
              <li>Calendar integrations</li>
              <li>Health app connections</li>
              <li>Custom habit templates</li>
              <li>Export & backup data</li>
              <li>Priority support</li>
            </ul>
            <button class="btn-primary" style="width: 100%;" onclick="handlePurchase('monthly')">
              Start Monthly
            </button>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 2rem; padding: 1.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
          <p style="margin: 0; color: var(--accent-secondary);">
            <strong>💡 Why 6 months?</strong> Research shows it takes 66 days on average to form a habit. 
            Give yourself the full journey to transformation.
          </p>
        </div>
      </div>
    </section>

    <!-- Social Proof -->
    <section class="section">
      <div class="container text-center">
        <h2 class="mb-xl">Trusted by professionals at</h2>
        <div style="display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; opacity: 0.6;">
          <div class="feature-badge">🍎 Apple</div>
          <div class="feature-badge">📘 Meta</div>
          <div class="feature-badge">🔍 Google</div>
          <div class="feature-badge">💼 Salesforce</div>
          <div class="feature-badge">🚀 Stripe</div>
          <div class="feature-badge">🏠 Airbnb</div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section">
      <div class="container">
        <div class="card text-center">
          <h2 class="mb-md">Ready to transform your productivity?</h2>
          <p class="hero-description mb-xl">
            Join thousands of professionals who've elevated their daily routine.
          </p>
          <div class="flex gap-md justify-center">
            <button class="btn-ghost btn-large" onclick="showSignup()">Start Free</button>
            <button class="btn-secondary btn-large" onclick="handlePurchase('6month')">Get 6 Months Pro</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function createDashboard() {
  return `
    ${createHeader()}
    
    <main class="dashboard">
      <div class="container">
        <div class="dashboard-header">
          <div>
            <h1>Welcome back, ${state.user?.name || 'Professional'}</h1>
            <p style="color: var(--text-secondary);">Here's your productivity overview for today</p>
          </div>
          <div class="flex gap-md">
            <button class="btn-ghost">📊 Analytics</button>
            <button class="btn-ghost">⚙️ Settings</button>
          </div>
        </div>

        <!-- Stats Overview -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${mockData.stats.tasksCompleted}</div>
            <div class="stat-label">Tasks Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${mockData.stats.habitStreak}</div>
            <div class="stat-label">Day Habit Streak</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${mockData.stats.goalsInProgress}</div>
            <div class="stat-label">Goals In Progress</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${mockData.stats.wellnessScore}</div>
            <div class="stat-label">Wellness Score</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card mb-xl">
          <h3 class="mb-lg">Quick Add</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            <div>
              <label class="form-label">New Task</label>
              <input class="form-input mb-sm" placeholder="What needs to be done?" id="quickTask">
              <button class="btn-primary" style="width: 100%;" onclick="addQuickTask()">Add Task</button>
            </div>
            <div>
              <label class="form-label">New Habit</label>
              <input class="form-input mb-sm" placeholder="Habit to track" id="quickHabit">
              <button class="btn-primary" style="width: 100%;" onclick="addQuickHabit()">Add Habit</button>
            </div>
            <div>
              <label class="form-label">Mood Check-in</label>
              <select class="form-input mb-sm" id="quickMood">
                <option value="">How are you feeling?</option>
                <option value="energized">😄 Energized</option>
                <option value="focused">🎯 Focused</option>
                <option value="calm">😌 Calm</option>
                <option value="stressed">😰 Stressed</option>
                <option value="tired">😴 Tired</option>
              </select>
              <button class="btn-primary" style="width: 100%;" onclick="addMoodCheckin()">Log Mood</button>
            </div>
          </div>
        </div>

        <!-- Tasks Section -->
        <div class="card mb-xl">
          <div class="flex items-center justify-between mb-lg">
            <h3>📋 Recent Tasks</h3>
            <button class="btn-ghost">View All</button>
          </div>
          <div class="tasks-list">
            ${mockData.tasks.map(task => `
              <div class="task-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 0.5rem;">
                <div>
                  <div style="font-weight: 600; margin-bottom: 0.25rem;">${task.title}</div>
                  <div style="font-size: 0.875rem; color: var(--text-muted);">
                    ${task.project} • ${task.priority} Priority • Due ${formatDate(task.dueDate)}
                  </div>
                </div>
                <div class="feature-badge ${task.status === 'Completed' ? 'style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: var(--accent-secondary);"' : ''}">${task.status}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Habits Section -->
        <div class="card mb-xl">
          <div class="flex items-center justify-between mb-lg">
            <h3>🎯 Habit Tracking</h3>
            <button class="btn-ghost">Manage Habits</button>
          </div>
          <div class="habits-grid" style="display: grid; gap: 1rem;">
            ${mockData.habits.map(habit => `
              <div class="habit-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius);">
                <div>
                  <div style="font-weight: 600; margin-bottom: 0.25rem;">${habit.name}</div>
                  <div style="font-size: 0.875rem; color: var(--text-muted);">${habit.streak} day streak</div>
                </div>
                <div class="habit-week" style="display: flex; gap: 0.25rem;">
                  ${habit.completed.map((completed, index) => `
                    <div style="width: 1.5rem; height: 1.5rem; border-radius: 50%; background: ${completed ? 'var(--accent-secondary)' : 'var(--border)'}; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
                      ${completed ? '✓' : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Goals Section -->
        <div class="card mb-xl">
          <div class="flex items-center justify-between mb-lg">
            <h3>🚀 Goal Progress</h3>
            <button class="btn-ghost">View All Goals</button>
          </div>
          <div class="goals-list">
            ${mockData.goals.map(goal => `
              <div class="goal-item" style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 0.5rem;">
                <div class="flex items-center justify-between mb-sm">
                  <div style="font-weight: 600;">${goal.title}</div>
                  <div style="font-size: 0.875rem; color: var(--text-muted);">Due ${formatDate(goal.deadline)}</div>
                </div>
                <div class="progress-bar" style="background: var(--border); height: 0.5rem; border-radius: var(--radius-full); overflow: hidden; margin-bottom: 0.5rem;">
                  <div style="background: var(--accent-primary); height: 100%; width: ${goal.progress}%; transition: var(--transition);"></div>
                </div>
                <div style="font-size: 0.875rem; color: var(--text-muted);">${goal.progress}% complete</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Upgrade CTA -->
        <div class="card" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%); border-color: rgba(59, 130, 246, 0.2);">
          <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 1rem;">
            <div>
              <h3 class="mb-sm">🚀 Ready to unlock your full potential?</h3>
              <p style="margin: 0; color: var(--text-secondary);">
                Get advanced analytics, unlimited history, and premium integrations with Pro.
              </p>
            </div>
            <div class="flex gap-sm">
              <button class="btn-ghost">View Plans</button>
              <button class="btn-secondary" onclick="handlePurchase('6month')">Upgrade to Pro</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;
}

function createAuthForm(type) {
  const isLogin = type === 'login';
  return `
    ${createHeader()}
    
    <main class="section" style="padding-top: calc(var(--space-3xl) + 4rem);">
      <div class="container" style="max-width: 500px;">
        <div class="text-center mb-xl">
          <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">
            ${isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style="color: var(--text-muted);">
            ${isLogin ? 'Continue your productivity and wellness journey' : 'Start your journey to better productivity and wellness'}
          </p>
        </div>

        <form class="card" onsubmit="handleAuth(event, '${type}')">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input 
              class="form-input" 
              type="email" 
              name="email" 
              placeholder="your@email.com" 
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input 
              class="form-input" 
              type="password" 
              name="password" 
              placeholder="${isLogin ? 'Enter your password' : 'Create a secure password'}" 
              required
            />
          </div>

          <button class="btn-primary btn-large" type="submit" style="width: 100%; margin-bottom: 1rem;">
            ${isLogin ? 'Sign In' : 'Create Account'}
          </button>

          <div class="text-center">
            <p style="font-size: 0.875rem; color: var(--text-muted);">
              ${isLogin ? "Don't have an account?" : "Already have an account?"} 
              <button type="button" class="btn-ghost" style="padding: 0; border: none; color: var(--accent-primary);" onclick="${isLogin ? 'showSignup()' : 'showLogin()'}">
                ${isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </form>

        ${!isLogin ? `
          <div class="card" style="margin-top: 1.5rem; background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2);">
            <div class="text-center">
              <h3 style="margin-bottom: 1rem; color: var(--accent-secondary);">🎉 Welcome Bonus</h3>
              <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                New users get <strong>7 days free</strong> of Pro features to explore everything Zenith has to offer.
              </p>
              <div class="flex gap-sm justify-center" style="flex-wrap: wrap;">
                <div class="feature-badge">✨ Advanced Analytics</div>
                <div class="feature-badge">🔄 All Integrations</div>
                <div class="feature-badge">📊 Unlimited History</div>
              </div>
            </div>
          </div>
        ` : `
          <div class="card" style="margin-top: 1.5rem; background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.2);">
            <div class="text-center">
              <h3 style="margin-bottom: 1rem;">🚀 Try the Demo</h3>
              <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                Want to explore first? Use our demo account to see all features in action.
              </p>
              <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 0.5rem; font-family: monospace; font-size: 0.875rem;">
                <div><strong>Email:</strong> demo@zenith.com</div>
                <div><strong>Password:</strong> demo123</div>
              </div>
            </div>
          </div>
        `}

        <div class="text-center" style="margin-top: 2rem;">
          <p style="font-size: 0.75rem; color: var(--text-muted);">
            By ${isLogin ? 'signing in' : 'creating an account'}, you agree to our Terms of Service and Privacy Policy.
            Your data is encrypted and never shared.
          </p>
        </div>
      </div>
    </main>
  `;
}

// Event handlers
function showLanding() {
  state.currentView = 'landing';
  render();
}

function showLogin() {
  state.currentView = 'login';
  render();
}

function showSignup() {
  state.currentView = 'signup';
  render();
}

function showDashboard() {
  state.currentView = 'dashboard';
  render();
}

function scrollToPricing() {
  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
}

function handleAuth(event, type) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const email = formData.get('email');
  const password = formData.get('password');
  
  // Mock authentication
  if (email && password) {
    state.user = { 
      name: email.split('@')[0], 
      email, 
      plan: 'free' 
    };
    showDashboard();
  }
}

function logout() {
  state.user = null;
  showLanding();
}

function handlePurchase(plan) {
  // Mock purchase flow
  alert(`🎉 Thank you for choosing the ${plan} plan! In a real app, this would redirect to Stripe checkout.`);
  if (state.user) {
    state.user.plan = plan;
    showDashboard();
  } else {
    showSignup();
  }
}

function addQuickTask() {
  const input = document.getElementById('quickTask');
  if (input?.value.trim()) {
    mockData.tasks.unshift({
      id: Date.now(),
      title: input.value.trim(),
      project: 'Quick Add',
      priority: 'Medium',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Not Started'
    });
    input.value = '';
    render();
  }
}

function addQuickHabit() {
  const input = document.getElementById('quickHabit');
  if (input?.value.trim()) {
    mockData.habits.push({
      id: Date.now(),
      name: input.value.trim(),
      streak: 0,
      completed: [0, 0, 0, 0, 0, 0, 0]
    });
    input.value = '';
    render();
  }
}

function addMoodCheckin() {
  const select = document.getElementById('quickMood');
  if (select?.value) {
    alert(`Mood "${select.options[select.selectedIndex].text}" logged! 🎯`);
    select.value = '';
  }
}

// Render function
function render() {
  const app = document.getElementById('app');
  
  switch (state.currentView) {
    case 'landing':
      app.innerHTML = createLandingPage();
      break;
    case 'login':
      app.innerHTML = createAuthForm('login');
      break;
    case 'signup':
      app.innerHTML = createAuthForm('signup');
      break;
    case 'dashboard':
      app.innerHTML = createDashboard();
      break;
    default:
      app.innerHTML = createLandingPage();
  }
  
  // Add scroll animations
  setTimeout(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      observer.observe(el);
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }, 100);
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  render();
});

// Make functions globally available
window.showLanding = showLanding;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.showDashboard = showDashboard;
window.scrollToPricing = scrollToPricing;
window.handleAuth = handleAuth;
window.logout = logout;
window.handlePurchase = handlePurchase;
window.addQuickTask = addQuickTask;
window.addQuickHabit = addQuickHabit;
window.addMoodCheckin = addMoodCheckin;