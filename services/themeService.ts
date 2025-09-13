/**
 * Theme Service - Handle dark mode and theme management
 */

export interface ThemeConfig {
  darkMode: boolean;
  primaryColor: string;
  accentColor: string;
  customCSS?: string;
}

class ThemeService {
  private currentTheme: ThemeConfig = {
    darkMode: false,
    primaryColor: '#3B82F6',
    accentColor: '#8B5CF6',
  };

  constructor() {
    this.initializeTheme();
  }

  // Initialize theme from localStorage and system preferences
  initializeTheme(): void {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        this.currentTheme = { ...this.currentTheme, ...parsed };
      } catch (error) {
        console.error('Error parsing saved theme:', error);
      }
    } else {
      // Check system preference
      this.currentTheme.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.applyTheme();
  }

  // Apply current theme to the document
  applyTheme(): void {
    const root = document.documentElement;
    
    if (this.currentTheme.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set CSS custom properties
    root.style.setProperty('--primary-color', this.currentTheme.primaryColor);
    root.style.setProperty('--accent-color', this.currentTheme.accentColor);

    // Apply custom CSS if provided
    if (this.currentTheme.customCSS) {
      this.applyCustomCSS(this.currentTheme.customCSS);
    }

    // Save to localStorage
    this.saveTheme();
  }

  // Apply custom CSS
  private applyCustomCSS(css: string): void {
    let styleElement = document.getElementById('custom-theme-css') as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-theme-css';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
  }

  // Toggle dark mode
  toggleDarkMode(): boolean {
    this.currentTheme.darkMode = !this.currentTheme.darkMode;
    this.applyTheme();
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { darkMode: this.currentTheme.darkMode }
    }));
    
    return this.currentTheme.darkMode;
  }

  // Set dark mode
  setDarkMode(darkMode: boolean): void {
    this.currentTheme.darkMode = darkMode;
    this.applyTheme();
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { darkMode: this.currentTheme.darkMode }
    }));
  }

  // Set primary color
  setPrimaryColor(color: string): void {
    this.currentTheme.primaryColor = color;
    this.applyTheme();
  }

  // Set accent color
  setAccentColor(color: string): void {
    this.currentTheme.accentColor = color;
    this.applyTheme();
  }

  // Set custom CSS
  setCustomCSS(css: string): void {
    this.currentTheme.customCSS = css;
    this.applyTheme();
  }

  // Get current theme
  getCurrentTheme(): ThemeConfig {
    return { ...this.currentTheme };
  }

  // Save theme to localStorage
  private saveTheme(): void {
    localStorage.setItem('theme', JSON.stringify(this.currentTheme));
  }

  // Reset theme to default
  resetTheme(): void {
    this.currentTheme = {
      darkMode: false,
      primaryColor: '#3B82F6',
      accentColor: '#8B5CF6',
    };
    this.applyTheme();
  }

  // Check if dark mode is enabled
  isDarkMode(): boolean {
    return this.currentTheme.darkMode;
  }

  // Listen for system theme changes
  watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        this.currentTheme.darkMode = e.matches;
        this.applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    // Return cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }
}

export const themeService = new ThemeService();
export default themeService;
