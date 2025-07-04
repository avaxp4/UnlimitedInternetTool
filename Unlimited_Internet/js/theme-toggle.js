const themeToggleBtn = document.getElementById('theme-toggle-btn');
const sunIcon = document.getElementById('theme-toggle-sun-icon');
const moonIcon = document.getElementById('theme-toggle-moon-icon');

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
        localStorage.setItem('theme', 'light');
    }
}

// Check for saved theme in localStorage or OS preference
const savedTheme = localStorage.getItem('theme');
const osPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme) {
    applyTheme(savedTheme);
} else if (osPrefersDark) {
    applyTheme('dark');
} else {
    applyTheme('light'); // Default to light
}

// Add event listener to the button
themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
});