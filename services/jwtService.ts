/**
 * JWT Service for frontend token management
 */
class JWTService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_TYPE_KEY = 'token_type';

  /**
   * Store JWT tokens in localStorage
   */
  storeTokens(accessToken: string, refreshToken: string, tokenType: string = 'bearer'): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.TOKEN_TYPE_KEY, tokenType);
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get token type from localStorage
   */
  getTokenType(): string {
    return localStorage.getItem(this.TOKEN_TYPE_KEY) || 'bearer';
  }

  /**
   * Get authorization header
   */
  getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken();
    const tokenType = this.getTokenType();
    
    if (token) {
      return {
        'Authorization': `${tokenType} ${token}`
      };
    }
    return {};
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Clear all tokens from localStorage
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_TYPE_KEY);
  }

  /**
   * Handle 401 Unauthorized response by attempting token refresh
   */
  async handleUnauthorized(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.clearTokens();
      return false;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.storeTokens(
          data.access_token,
          data.refresh_token,
          data.token_type || 'bearer'
        );
        console.log('Token refreshed successfully');
        return true;
      } else {
        // Refresh failed, clear tokens
        this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Decode JWT token (without verification)
   */
  decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  /**
   * Get user info from token
   */
  getUserFromToken(token: string): any {
    const payload = this.decodeToken(token);
    if (!payload) {
      return null;
    }
    
    return {
      user_id: payload.user_id,
      role: payload.role,
      permissions: payload.permissions,
      name: payload.name,
      email: payload.email
    };
  }
}

// Export singleton instance
export const jwtService = new JWTService();
export default jwtService;
