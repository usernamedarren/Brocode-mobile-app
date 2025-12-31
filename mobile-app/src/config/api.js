// Backend API configuration
// Change this to your computer's IP address when running on physical device
// Keep as localhost when using emulator

// const API_BASE_URL = 'http://10.0.2.2:5003'; // For Android emulator
// const API_BASE_URL = 'http://192.168.100.102:5003'; // For physical device (WiFi IP)
const API_BASE_URL = 'https://ii3140-uts-pawm-yyvw.vercel.app'; // For production (Vercel)

export const api = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return response.json();
  },

  register: async (name, email, phone, password) => {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, phone, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    return response.json();
  },

  // Get user profile
  getProfile: async (token) => {
    const response = await fetch(`${API_BASE_URL}/accounts/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    
    return response.json();
  },

  // Get all capsters
  getCapsters: async () => {
    const response = await fetch(`${API_BASE_URL}/api/capsters`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch capsters');
    }
    
    return response.json();
  },

  // Get all services
  getServices: async () => {
    const response = await fetch(`${API_BASE_URL}/api/services`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch services');
    }
    
    return response.json();
  },

  // Create appointment
  createAppointment: async (appointmentData) => {
    try {
      console.log('Creating appointment with data:', appointmentData);
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      
      const responseText = await response.text();
      console.log('Create appointment response:', response.status, responseText);
      
      if (!response.ok) {
        let errorMessage = 'Failed to create appointment';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      try {
        return JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse success response:', responseText);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('createAppointment error:', error);
      throw error;
    }
  },

  // Get user appointments
  getAppointments: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments?user_id=${userId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Appointments fetch error:', response.status, errorText);
        throw new Error(`Failed to fetch appointments: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Appointments fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('getAppointments error:', error);
      throw error;
    }
  },

  // Legacy method for compatibility
  getUserAppointments: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/appointments/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch appointments');
    }
    
    return response.json();
  },
};

export default api;
