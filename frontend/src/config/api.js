import Constants from 'expo-constants';

const config = Constants.expoConfig ?? Constants.manifest ?? {};
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || config?.extra?.apiBaseUrl;

export const isApiConfigured = Boolean(API_BASE_URL);

const buildUrl = (path) => {
  if (!API_BASE_URL) {
    throw new Error('App belum dikonfigurasi: EXPO_PUBLIC_API_BASE_URL belum diset.');
  }
  return `${API_BASE_URL}${path}`;
};

export const api = {
  login: async (email, password) => {
    const response = await fetch(buildUrl('/api/login'), {
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
    const response = await fetch(buildUrl('/api/register'), {
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
    const response = await fetch(buildUrl('/accounts/profile'), {
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
    const response = await fetch(buildUrl('/api/capsters'));
    
    if (!response.ok) {
      throw new Error('Failed to fetch capsters');
    }
    
    return response.json();
  },

  // Get all services
  getServices: async () => {
    const response = await fetch(buildUrl('/api/services'));
    
    if (!response.ok) {
      throw new Error('Failed to fetch services');
    }
    
    return response.json();
  },

  // Create capster
  createCapster: async (payload) => {
    const resp = await fetch(buildUrl('/api/capster'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const txt = await resp.text()
    if (!resp.ok) throw new Error(txt || 'Failed to create capster')
    return JSON.parse(txt)
  },

  updateCapster: async (id, payload) => {
    const resp = await fetch(buildUrl(`/api/capster/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const txt = await resp.text()
    if (!resp.ok) throw new Error(txt || 'Failed to update capster')
    return JSON.parse(txt || '{}')
  },

  deleteCapster: async (id) => {
    const resp = await fetch(buildUrl(`/api/capster/${id}`), { method: 'DELETE' })
    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(txt || 'Failed to delete capster')
    }
    return true
  },

  createService: async (payload) => {
    const resp = await fetch(buildUrl('/api/service'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const txt = await resp.text()
    if (!resp.ok) throw new Error(txt || 'Failed to create service')
    return JSON.parse(txt)
  },

  updateService: async (name, payload) => {
    const resp = await fetch(buildUrl(`/api/service/${encodeURIComponent(name)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const txt = await resp.text()
    if (!resp.ok) throw new Error(txt || 'Failed to update service')
    return JSON.parse(txt || '{}')
  },

  deleteService: async (name) => {
    const resp = await fetch(buildUrl(`/api/service/${encodeURIComponent(name)}`), { method: 'DELETE' })
    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(txt || 'Failed to delete service')
    }
    return true
  },

  updateAppointment: async (id, payload) => {
    const resp = await fetch(buildUrl(`/api/appointment/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const txt = await resp.text()
    if (!resp.ok) throw new Error(txt || 'Failed to update appointment')
    return JSON.parse(txt || '{}')
  },

  deleteAppointment: async (id) => {
    const resp = await fetch(buildUrl(`/api/appointment/${id}`), { method: 'DELETE' })
    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(txt || 'Failed to delete appointment')
    }
    return true
  },

  // Create appointment
  createAppointment: async (appointmentData) => {
    try {
      console.log('Creating appointment with data:', appointmentData);
      const response = await fetch(buildUrl('/api/appointments'), {
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

  // Get appointments for a specific date/capster (used for slot availability)
  getAppointmentsByDate: async ({ date, capsterId, statuses = ['pending', 'approved'] }) => {
    if (!date) throw new Error('date is required')

    const query = new URLSearchParams({ date })
    if (capsterId) query.append('capsterId', capsterId)
    if (statuses && statuses.length) query.append('statuses', statuses.join(','))

    const response = await fetch(`${API_BASE_URL}/api/appointments?${query.toString()}`)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Appointments by date fetch error:', response.status, errorText)
      throw new Error('Gagal memuat ketersediaan jadwal')
    }
    return response.json()
  },

  // Get user appointments
  getAppointments: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments?email=${encodeURIComponent(userId)}`, {
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

  // Get all appointments (for admin)
  getAllAppointments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('All appointments fetch error:', response.status, errorText);
        throw new Error(`Failed to fetch all appointments: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('getAllAppointments error:', error);
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
