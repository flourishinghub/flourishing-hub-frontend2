// API utility functions for better error handling and consistency

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  if (!API_URL) {
    throw new ApiError(500, 'API URL not configured');
  }

  console.log(`🔄 API Call: ${endpoint}`);
  const token = localStorage.getItem("token");
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
    console.log(`🔑 Using token: ${token.substring(0, 20)}...`);
  } else {
    console.log("⚠️ No token found in localStorage");
  }

  const config: RequestInit = {
    ...options,
    cache: 'no-store', // never serve stale API data from browser/proxy cache
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Stringify body if it's an object
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 seconds

  try {
    console.log(`📡 Fetching: ${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`✅ Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      // Auto logout on 401 (token invalid/expired)
      if (response.status === 401) {
        console.log("🔄 401 Unauthorized - Token invalid, clearing auth and redirecting...");
        console.log("🔄 Current page:", window.location.pathname);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
        window.location.href = "/login";
        throw new ApiError(401, "Unauthorized");
      }
      let errMsg = `${response.status} ${response.statusText}`;
      try {
        const errBody = await response.json();
        if (errBody?.message) errMsg = errBody.message;
      } catch {}
      console.error(`❌ API Error ${response.status} for ${endpoint}:`, errMsg);
      throw new ApiError(response.status, errMsg);
    }

    const data = await response.json();
    console.log(`📦 Data received for ${endpoint}:`, data.success ? 'Success' : 'Failed');
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`❌ API Error for ${endpoint}:`, error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout');
    }
    throw error;
  }
};

// Reusable user fetch function (DRY approach)
export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    throw new ApiError(401, "No token found");
  }

  const response = await apiCall("/auth/me");
  return response.data; // Consistent return format
};

// Transform backend user data to frontend format
export const transformUserData = (userData: any) => {
  return {
    id: userData?.id || 'unknown',
    email: userData?.email || '',
    name: userData?.name || 'User',
    role: userData?.role?.toLowerCase().replace(/_/g, '-') || 'student',
    department: userData?.studentProfile?.department || 
               userData?.instructorProfile?.department || 
               userData?.adminProfile?.department || 
               'IIT Bombay',
    rollNo: userData?.studentProfile?.rollNumber,
    empId: userData?.adminProfile?.employeeId || userData?.employeeId,
    year: userData?.studentProfile?.yearOfStudy,
    batch: userData?.studentProfile?.cohort,
    programme: userData?.studentProfile?.programme || 'Staff',
    iat: Date.now(),
  };
};

// Profile API functions
export const getUserProfile = async () => {
  const response = await apiCall("/profile");
  return response.data;
};

export const updateUserProfile = async (profileData: any) => {
  const response = await apiCall("/profile", {
    method: 'PUT',
    body: profileData
  });
  return response.data;
};

// Dashboard API functions
export const getStudentDashboard = async () => {
  const response = await apiCall("/student/dashboard");
  return response.data;
};

export const getInstructorDashboard = async () => {
  const response = await apiCall("/instructor/dashboard");
  return response.data;
};

export const getVolunteerDashboard = async () => {
  const response = await apiCall("/volunteer/dashboard");
  return response.data;
};

export const getAssociateDashboard = async () => {
  const response = await apiCall("/associate/dashboard");
  return response.data;
};

export const getAdminDashboard = async () => {
  const response = await apiCall("/admin/dashboard");
  return response.data;
};