# User Management Application

A modern, responsive user management application built with React, TypeScript, and Tailwind CSS. This application allows you to manage users with features like viewing, editing, deleting, and searching users.

## Features

### Authentication
- Secure login system
- Protected routes
- Token-based authentication
- Automatic redirection to login for unauthenticated users

### User Management
- View list of users with pagination
- Edit user details (first name, last name, email)
- Delete users with confirmation
- Search users by name or email
- Real-time search filtering

### Form Validation
- First name and last name validation (alphabets and spaces only)
- Email format validation
- Real-time validation feedback
- Error messages for invalid inputs

### UI/UX Features
- Responsive design for all screen sizes
- Dark/Light mode toggle
- Loading states with spinners
- Toast notifications for success/error messages
- Smooth transitions and animations
- Modern card-based layout
- Hover effects and visual feedback

### Data Persistence
- Local storage caching for better performance
- 24-hour cache expiration
- Automatic data refresh when cache expires

### Theme Support
- Dark mode support
- Light mode support
- Theme persistence across sessions
- Smooth theme transitions

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/user-management-app.git
cd user-management-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add the following:
```env
VITE_API_BASE_URL=https://reqres.in/api
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to:
```
http://localhost:5173
```

## Test Credentials

For testing the application, use the following credentials:
- Email: eve.holt@reqres.in
- Password: cityslicka

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code linting

## Project Structure

```
user-management-app/
├── src/
│   ├── components/
│   │   ├── Login.tsx
│   │   ├── UserList.tsx
│   │   └── Toast.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── store/
│   │   ├── store.ts
│   │   └── themeSlice.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tailwind.config.js
└── README.md
```

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Redux Toolkit
- React Router
- Axios
- Vite

## API Integration

The application uses the ReqRes API for user management:
- Base URL: https://reqres.in/api
- Endpoints:
  - GET /users - Get user list
  - PUT /users/:id - Update user
  - DELETE /users/:id - Delete user
  - POST /login - User login

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [ReqRes API](https://reqres.in/) for providing the mock API
- [Tailwind CSS](https://tailwindcss.com/) for the styling system
- [React](https://reactjs.org/) for the UI framework
