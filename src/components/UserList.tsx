import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Toast from './Toast';

const API_BASE_URL = 'https://reqres.in/api';
const LOCAL_STORAGE_KEY = 'userManagementData';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

interface LocalStorageData {
  [key: number]: {
    users: User[];
    lastUpdated: number;
  };
  totalPages: number;
}

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [validationError, setValidationError] = useState<{
    first_name?: string;
    last_name?: string;
    email?: string;
  }>({});
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  // Load data from localStorage
  const loadFromLocalStorage = (pageNum: number): { users: User[] | null; totalPages: number | null } => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsedData: LocalStorageData = JSON.parse(data);
      const pageData = parsedData[pageNum];
      if (pageData && Date.now() - pageData.lastUpdated < 24 * 60 * 60 * 1000) {
        return {
          users: pageData.users,
          totalPages: parsedData.totalPages
        };
      }
    }
    return { users: null, totalPages: null };
  };

  // Save data to localStorage
  const saveToLocalStorage = (pageNum: number, users: User[], totalPages: number) => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsedData: LocalStorageData = data ? JSON.parse(data) : {};
    
    parsedData[pageNum] = {
      users,
      lastUpdated: Date.now(),
    };
    parsedData.totalPages = totalPages;
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsedData));
  };

  // Add function to fetch all users
  const fetchAllUsers = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;

      // Fetch first page to get total pages
      const firstPageResponse = await axios.get(`${API_BASE_URL}/users?page=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const totalPages = firstPageResponse.data.total_pages;

      // Fetch all pages
      const allUsersPromises = [];
      for (let i = 1; i <= totalPages; i++) {
        allUsersPromises.push(
          axios.get(`${API_BASE_URL}/users?page=${i}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
      }

      const responses = await Promise.all(allUsersPromises);
      const allUsers = responses.flatMap(response => response.data.data);
      setAllUsers(allUsers);
    } catch (err) {
      console.error('Failed to fetch all users:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    fetchUsers();
    fetchAllUsers();
  }, [page, isAuthenticated]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      // Try to load from localStorage first
      const cachedData = loadFromLocalStorage(page);
      if (cachedData.users) {
        setUsers(cachedData.users);
        if (cachedData.totalPages) {
          setTotalPages(cachedData.totalPages);
        }
        setLoading(false);
        return;
      }

      // If no cached data, fetch from API
      const response = await axios.get(`${API_BASE_URL}/users?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newUsers = response.data.data;
      setUsers(newUsers);
      setTotalPages(response.data.total_pages);
      saveToLocalStorage(page, newUsers, response.data.total_pages);
    } catch (err) {
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    });
    setEditDialogOpen(true);
  };

  // Add validation function
  const validateName = (name: string): boolean => {
    return /^[A-Za-z\s]+$/.test(name);
  };

  const handleNameChange = (field: 'first_name' | 'last_name', value: string) => {
    if (!validateName(value)) {
      setValidationError(prev => ({
        ...prev,
        [field]: 'Only alphabets and spaces are allowed'
      }));
    } else {
      setValidationError(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add email validation function
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (value: string) => {
    if (!validateEmail(value)) {
      setValidationError(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
    } else {
      setValidationError(prev => ({
        ...prev,
        email: undefined
      }));
    }
    setEditForm(prev => ({
      ...prev,
      email: value
    }));
  };

  const handleUpdate = async () => {
    // Check for validation errors before proceeding
    if (validationError.first_name || validationError.last_name || validationError.email) {
      setToast({
        message: 'Please fix the validation errors before saving',
        type: 'error'
      });
      return;
    }

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token || !selectedUser) return;

      await axios.put(
        `${API_BASE_URL}/users/${selectedUser.id}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedUsers = users.map(user =>
        user.id === selectedUser.id
          ? { ...user, ...editForm }
          : user
      );
      
      const updatedAllUsers = allUsers.map(user =>
        user.id === selectedUser.id
          ? { ...user, ...editForm }
          : user
      );

      setUsers(updatedUsers);
      setAllUsers(updatedAllUsers);
      saveToLocalStorage(page, updatedUsers, totalPages);
      setEditDialogOpen(false);
      setValidationError({});
      setToast({
        message: 'User updated successfully',
        type: 'success'
      });
    } catch (err) {
      setError('Failed to update user. Please try again.');
      setToast({
        message: 'Failed to update user',
        type: 'error'
      });
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;

      await axios.delete(`${API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUsers = users.filter(user => user.id !== userId);
      const updatedAllUsers = allUsers.filter(user => user.id !== userId);
      
      setUsers(updatedUsers);
      setAllUsers(updatedAllUsers);
      saveToLocalStorage(page, updatedUsers, totalPages);
      setToast({
        message: 'User deleted successfully',
        type: 'success'
      });
    } catch (err) {
      setError('Failed to delete user. Please try again.');
      setToast({
        message: 'Failed to delete user',
        type: 'error'
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const filteredUsers = searchQuery
    ? allUsers.filter(user => {
        const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const email = user.email.toLowerCase();

        return searchTerms.every(term => 
          fullName.includes(term) || 
          email.includes(term)
        );
      })
    : users;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <nav className={`${
        isDarkMode 
          ? 'bg-slate-800/50 backdrop-blur-xl border-slate-700/50' 
          : 'bg-white/80 backdrop-blur-xl border-gray-200'
      } border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>User Management</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${
                  isDarkMode ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'
                }`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className={`mb-4 border-l-4 border-red-500 p-4 rounded-lg ${
            isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
          }`}>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className={`h-5 w-5 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-400'
              }`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isDarkMode 
                  ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {searchQuery && filteredUsers.length === 0 ? (
          <div className={`text-center py-12 rounded-lg ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white'
          }`}>
            <svg
              className={`mx-auto h-12 w-12 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-400'
              }`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className={`mt-2 text-sm font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              No users found
            </h3>
            <p className={`mt-1 text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              Sorry, we couldn't find any users matching "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div key={user.id} className={`${
                isDarkMode 
                  ? 'bg-slate-800/50 backdrop-blur-xl border-slate-700/50' 
                  : 'bg-white border-gray-200'
              } border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300`}>
                <div className="p-5">
                  <div className="flex items-center">
                    <img
                      src={user.avatar}
                      alt={`${user.first_name} ${user.last_name}`}
                      className="h-12 w-12 rounded-full ring-2 ring-blue-500/20"
                    />
                    <div className="ml-4">
                      <h3 className={`text-lg font-medium truncate ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className={`text-sm truncate flex items-center ${
                        isDarkMode ? 'text-slate-300' : 'text-gray-500'
                      }`}>
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`px-5 py-3 flex justify-end space-x-2 ${
                  isDarkMode ? 'bg-slate-800/30' : 'bg-gray-50'
                }`}>
                  <button
                    onClick={() => handleEdit(user)}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                      isDarkMode ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${
                      isDarkMode ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <nav className="relative z-0 gap-4 inline-flex rounded-lg shadow-sm" aria-label="Pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                  pageNum === 1 ? 'rounded-lg' : ''
                } ${
                  pageNum === totalPages ? 'rounded-lg' : ''
                } ${
                  pageNum !== 1 ? '-ml-px' : ''
                } ${
                  page === pageNum
                    ? isDarkMode
                      ? 'z-10 bg-blue-500/10 border-blue-500 text-blue-400'
                      : 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : isDarkMode
                      ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </nav>
        </div>
      </main>

      {editDialogOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className={`fixed inset-0 transition-opacity ${
              isDarkMode ? 'bg-slate-900/75' : 'bg-gray-500/75'
            } backdrop-blur-sm`} aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className={`inline-block align-bottom rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border ${
              isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-gray-200'
            }`}>
              <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${
                isDarkMode ? 'bg-slate-800' : 'bg-white'
              }`}>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className={`text-lg leading-6 font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`} id="modal-title">
                      Edit User
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="first_name" className={`block text-sm font-medium ${
                          isDarkMode ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                          First Name
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          className={`mt-1 block w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            isDarkMode 
                              ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } ${
                            validationError.first_name ? 'border-red-500 focus:ring-red-500' : ''
                          }`}
                          value={editForm.first_name}
                          onChange={(e) => handleNameChange('first_name', e.target.value)}
                        />
                        {validationError.first_name && (
                          <p className="mt-1 text-sm text-red-500">{validationError.first_name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="last_name" className={`block text-sm font-medium ${
                          isDarkMode ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          className={`mt-1 block w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            isDarkMode 
                              ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } ${
                            validationError.last_name ? 'border-red-500 focus:ring-red-500' : ''
                          }`}
                          value={editForm.last_name}
                          onChange={(e) => handleNameChange('last_name', e.target.value)}
                        />
                        {validationError.last_name && (
                          <p className="mt-1 text-sm text-red-500">{validationError.last_name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="email" className={`block text-sm font-medium ${
                          isDarkMode ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          className={`mt-1 block w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            isDarkMode 
                              ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } ${
                            validationError.email ? 'border-red-500 focus:ring-red-500' : ''
                          }`}
                          value={editForm.email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                        />
                        {validationError.email && (
                          <p className="mt-1 text-sm text-red-500">{validationError.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${
                isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'
              }`}>
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setValidationError({});
                  }}
                  className={`mt-3 w-full inline-flex justify-center rounded-lg border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;