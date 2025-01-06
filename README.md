Here's the README.md for your TigerShare project:

# TigerShare

A secure ride-sharing platform built specifically for Princeton University students. TigerShare enables students to coordinate rides to common destinations (like airports) and split travel costs efficiently. The platform features Princeton CAS authentication, real-time ride management, and email notifications.

## Features

* **Secure Authentication**
   * Princeton CAS integration
   * Protected routes and content
   * JWT-based session management
   * User profiles with full name support

* **Ride Management**
   * Create and join rides
   * Real-time seat availability tracking
   * Automatic fare per person calculation
   * Request approval system
   * Email notifications for ride updates

* **User Experience**
   * Clean, responsive interface
   * Real-time updates
   * Intuitive ride creation process
   * Profile-based ride filtering

* **Communication**
   * Email notifications for ride requests
   * Request approval/denial system
   * Ride status updates
   * Automated passenger notifications

## Technical Stack

### Frontend
* React (Vite)
* TailwindCSS
* React Query
* Axios
* Moment.js

### Backend
* Node.js
* Express
* PostgreSQL
* JSON Web Tokens (JWT)
* Nodemailer

### Authentication
* Princeton CAS (Central Authentication Service)
* JWT for session management

## Prerequisites
* Node.js (v14 or later)
* npm or yarn
* PostgreSQL
* Princeton CAS credentials
* Gmail account for email notifications

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tiger-share.git
cd tiger-share
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:

Backend (.env):
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_USER=your_db_user
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tigershare
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

# Princeton CAS
CAS_URL=https://fed.princeton.edu/cas

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_app_password
```

4. Set up the database:
```sql
-- Create the database tables using the provided schema
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    netid VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT false
);

-- Additional table creation scripts...
```

5. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# In a new terminal, start frontend server
cd frontend
npm run dev
```

## Usage

1. Visit `http://localhost:5173` to access the platform
2. Log in with Princeton NetID
3. Set your display name (optional)
4. Create or join rides
5. Manage ride requests through email notifications

## API Endpoints

### Authentication
* `GET /api/auth/cas/login` - Initiate CAS login
* `GET /api/auth/cas/callback` - CAS authentication callback
* `GET /api/auth/verify` - Verify JWT token

### Rides
* `GET /api/rides` - Get all active rides
* `POST /api/rides/create` - Create a new ride
* `POST /api/rides/:rideId/request` - Request to join a ride
* `GET /api/rides/:rideId/approve/:requesterId` - Approve ride request
* `GET /api/rides/:rideId/deny/:requesterId` - Deny ride request

### Users
* `POST /api/users/set-name` - Set user's display name
* `GET /api/users/needs-name` - Check if user needs to set name

## Project Structure
```
tiger-share/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── rideRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── utils/
│   │   │   └── emailService.js
│   │   └── server.js
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── contexts/
    │   ├── pages/
    │   └── App.jsx
    └── tailwind.config.js
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements
* Princeton University for CAS authentication
* React team for the excellent framework
* TailwindCSS for the utility-first CSS framework
* All contributors who have helped shape this project

Would you like me to add or modify any sections?
