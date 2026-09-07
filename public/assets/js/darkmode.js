// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const themeToggle = document.createElement('button');
  themeToggle.classList.add('theme-toggle');
  themeToggle.setAttribute('aria-label', 'Toggle dark mode');
  themeToggle.innerHTML = '🌓';
  
  // Check for saved theme preference or use OS preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  
  // Apply theme based on saved preference or OS preference
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    body.classList.add('dark-theme');
    updateThemeIcon(true);
  }
  
  // Toggle theme on button click
  themeToggle.addEventListener('click', () => {
    const isDarkMode = body.classList.contains('dark-theme');
    if (isDarkMode) {
      body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    } else {
      body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    }
    updateThemeIcon(!isDarkMode);
  });
  
  // Update theme icon based on current mode
  function updateThemeIcon(isDark) {
    themeToggle.innerHTML = isDark ? '☀️' : '🌓';
  }
  
  // Listen for OS color scheme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only apply OS preference if user hasn't set a manual preference
    if (!localStorage.getItem('theme')) {
      if (e.matches) {
        body.classList.add('dark-theme');
        updateThemeIcon(true);
      } else {
        body.classList.remove('dark-theme');
        updateThemeIcon(false);
      }
    }
  });
  
  // Add toggle button to the body
  document.body.appendChild(themeToggle);
  
  // Also toggle with keyboard shortcut 'd'
  document.addEventListener('keydown', (e) => {
    if (e.key === 'd' && !e.ctrlKey && !e.metaKey && 
        !(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      themeToggle.click();
    }
  });
});