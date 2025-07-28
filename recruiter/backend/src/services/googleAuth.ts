// Google Calendar OAuth 인증 서비스

interface GoogleAuthConfig {
  clientId: string;
  apiKey: string;
  scope: string;
  discoveryDoc: string;
}

interface GoogleAuthResult {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

// 🔑 Google OAuth 설정
const GOOGLE_CONFIG: GoogleAuthConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
};

// 🌐 전역 Google API 객체
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let isGapiLoaded = false;
let isGisLoaded = false;
let tokenClient: any = null;

// 📚 Google API 라이브러리 로드
export const loadGoogleAPI = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') {
      console.warn('Google API는 브라우저 환경에서만 사용 가능');
      return false;
    }

    // GAPI 라이브러리 로드
    if (!window.gapi && !isGapiLoaded) {
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          isGapiLoaded = true;
          resolve();
        };
        document.head.appendChild(script);
      });
    }

    // GIS 라이브러리 로드  
    if (!window.google && !isGisLoaded) {
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          isGisLoaded = true;
          resolve();
        };
        document.head.appendChild(script);
      });
    }

    // GAPI 초기화
    if (window.gapi && !window.gapi.client) {
      await new Promise<void>((resolve) => {
        window.gapi.load('client', async () => {
          await window.gapi.client.init({
            apiKey: GOOGLE_CONFIG.apiKey,
            discoveryDocs: [GOOGLE_CONFIG.discoveryDoc]
          });
          resolve();
        });
      });
    }

    // OAuth 토큰 클라이언트 초기화
    if (window.google && !tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.clientId,
        scope: GOOGLE_CONFIG.scope,
        callback: (response: GoogleAuthResult) => {
          if (response.access_token) {
            // localStorage에 토큰 저장
            localStorage.setItem('google_access_token', response.access_token);
            localStorage.setItem('google_token_expires', (Date.now() + (response.expires_in * 1000)).toString());
            console.log('✅ Google OAuth 인증 성공');
          }
        }
      });
    }

    console.log('✅ Google API 라이브러리 로드 완료');
    return true;

  } catch (error) {
    console.error('❌ Google API 로드 실패:', error);
    return false;
  }
};

// 🔐 Google 로그인 및 권한 요청
export const requestGoogleAuth = async (): Promise<string | null> => {
  try {
    const isLoaded = await loadGoogleAPI();
    if (!isLoaded) {
      throw new Error('Google API 로드 실패');
    }

    if (!GOOGLE_CONFIG.clientId || !GOOGLE_CONFIG.apiKey) {
      console.warn('Google OAuth 설정이 없습니다. 환경변수를 확인해주세요.');
      return null;
    }

    // 기존 토큰 확인
    const existingToken = localStorage.getItem('google_access_token');
    const tokenExpires = localStorage.getItem('google_token_expires');
    
    if (existingToken && tokenExpires && Date.now() < parseInt(tokenExpires)) {
      console.log('기존 Google 토큰 사용');
      return existingToken;
    }

    // 새로운 인증 요청
    return new Promise((resolve) => {
      tokenClient.callback = (response: GoogleAuthResult) => {
        if (response.access_token) {
          localStorage.setItem('google_access_token', response.access_token);
          localStorage.setItem('google_token_expires', (Date.now() + (response.expires_in * 1000)).toString());
          console.log('✅ Google Calendar 권한 획득');
          resolve(response.access_token);
        } else {
          console.error('Google 인증 실패:', response);
          resolve(null);
        }
      };

      tokenClient.requestAccessToken({ prompt: 'consent' });
    });

  } catch (error) {
    console.error('Google 인증 요청 실패:', error);
    return null;
  }
};

// 📅 Google Calendar API 호출 (인증된 상태에서)
export const callGoogleCalendarAPI = async (request: any): Promise<any> => {
  try {
    const accessToken = getCurrentToken();
    if (!accessToken) {
      console.warn('Google 인증이 필요합니다.');
      return null;
    }

    if (!window.gapi?.client?.calendar) {
      console.error('Google Calendar API가 로드되지 않았습니다.');
      return null;
    }

    const response = await window.gapi.client.calendar[request.method](request.params);
    return response.result;

  } catch (error: any) {
    console.error('Google Calendar API 호출 실패:', error);
    
    // 토큰 만료 시 재인증 시도
    if (error.status === 401) {
      console.log('토큰 만료 - 재인증 시도');
      revokeGoogleAuth(); // 토큰 만료 시 로그아웃
      const newToken = await requestGoogleAuth();
      if (newToken) {
        // 재시도
        return await callGoogleCalendarAPI(request);
      }
    }
    
    return null;
  }
};

// 🔄 토큰 상태 확인
export const hasValidToken = (): boolean => {
  const token = localStorage.getItem('google_access_token');
  const expires = localStorage.getItem('google_token_expires');
  
  if (!token || !expires) {
    return false;
  }
  
  return Date.now() < parseInt(expires);
};

// 🚪 로그아웃
export const revokeGoogleAuth = () => {
  const token = localStorage.getItem('google_access_token');
  
  if (token) {
    // Google 토큰 취소
    fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    // 로컬 스토리지에서 제거
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expires');
    console.log('Google 인증 해제 완료');
  }
};

// 🎯 현재 토큰 가져오기
export const getCurrentToken = (): string | null => {
  if (!hasValidToken()) {
    return null;
  }
  return localStorage.getItem('google_access_token');
}; 