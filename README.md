# TigerShare

A secure ride-sharing platform built specifically for Princeton University students. TigerShare enables students to coordinate rides to common destinations (like airports) and split travel costs efficiently. The platform features Princeton CAS authentication (pending), real-time ride management, and email notifications.

## Features

* **Authentication**
   * Princeton CAS integration (coming soon)
   * Alternative email login for testing
   * Protected routes and content
   * JWT-based session management
   * User profiles with full name support

* **Ride Management**
   * Create and join rides to common destinations
   * Real-time seat availability tracking
   * Support for custom destinations
   * Request approval system
   * Email notifications for ride updates
   * View ride participants
   * EST timezone handling for all rides

* **User Experience**
   * Clean, responsive interface
   * Intuitive ride creation and management
   * Filter rides by destination and date
   * Profile-based ride management
   * View all joined and created rides

* **Communication**
   * Email notifications for ride requests
   * Request approval/denial system
   * View pending requests
   * Cancel or leave rides

## Technical Stack

### Frontend
* React 18 (Vite)
* TailwindCSS
* React Query
* Axios
* Moment.js with timezone support

### Backend
* Node.js 18
* Express
* PostgreSQL
* JSON Web Tokens (JWT)
* Nodemailer

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tiger-share.git
cd tiger-share
```

2. Install dependencies:
```bash
# Install all dependencies
npm run install-all
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

Frontend (.env.development):
```env
VITE_API_URL=http://localhost:3001
VITE_NODE_ENV=development
```

4. Set up the database:
```sql
-- Execute the schema.sql file to create all necessary tables
```

5. Start the development servers:
```bash
# Start both frontend and backend
npm run dev
```

## Project Structure
```
tiger-share/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── rideController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── rideRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── services/
│   │   │   └── emailService.js
│   │   └── server.js
├── frontend/
    ├── src/
    │   ├── components/
    │   ├── contexts/
    │   ├── pages/
    │   ├── utils/
    │   └── App.jsx
    ├── .env.development
    └── tailwind.config.js
```

## API Endpoints

### Authentication
* `POST /api/auth/simple-login` - Login with email (testing)
* `GET /api/auth/cas/login` - Initiate CAS login (coming soon)
* `GET /api/auth/verify` - Verify JWT token

### Rides
* `GET /api/rides` - Get all active rides
* `POST /api/rides/create` - Create a new ride
* `POST /api/rides/:rideId/request` - Request to join a ride
* `GET /api/rides/:rideId/approve/:requesterId` - Approve ride request
* `GET /api/rides/:rideId/deny/:requesterId` - Deny ride request
* `POST /api/rides/:rideId/leave` - Leave a ride
* `POST /api/rides/:rideId/cancel` - Cancel a ride
* `GET /api/rides/:rideId/participants` - View ride participants
* `GET /api/rides/pending-requests` - Get pending ride requests

## Deployment
The application is deployed on Heroku: https://tigershare-9b54f63395d5.herokuapp.com

## License
This project is licensed under the MIT License - see the LICENSE file for details.
