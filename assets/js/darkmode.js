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
  }
  
  // Toggle theme on button click
  themeToggle.addEventListener('click', () => {
    if (body.classList.contains('dark-theme')) {
      body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    } else {
      body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
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