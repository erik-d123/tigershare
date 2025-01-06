-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    netid VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT false,
    phone_number VARCHAR(20)
);

-- Create rides table
CREATE TABLE rides (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id),
    destination VARCHAR(255) NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    available_seats INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    total_fare NUMERIC(10,2),
    fare_per_person NUMERIC(10,2) GENERATED ALWAYS AS (
        CASE
            WHEN available_seats > 0 THEN total_fare / (available_seats + 1)::numeric
            ELSE total_fare
        END
    ) STORED
);

-- Create ride_participants table
CREATE TABLE ride_participants (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER REFERENCES rides(id),
    user_id INTEGER REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, user_id)
);

-- Create ride_requests table
CREATE TABLE ride_requests (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER REFERENCES rides(id),
    requester_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
