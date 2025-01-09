--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15 (Homebrew)
-- Dumped by pg_dump version 14.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.rides DROP CONSTRAINT IF EXISTS rides_creator_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ride_requests DROP CONSTRAINT IF EXISTS ride_requests_ride_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ride_requests DROP CONSTRAINT IF EXISTS ride_requests_requester_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ride_participants DROP CONSTRAINT IF EXISTS ride_participants_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ride_participants DROP CONSTRAINT IF EXISTS ride_participants_ride_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_netid_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.rides DROP CONSTRAINT IF EXISTS rides_pkey;
ALTER TABLE IF EXISTS ONLY public.ride_requests DROP CONSTRAINT IF EXISTS ride_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.ride_participants DROP CONSTRAINT IF EXISTS ride_participants_ride_id_user_id_key;
ALTER TABLE IF EXISTS ONLY public.ride_participants DROP CONSTRAINT IF EXISTS ride_participants_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rides ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ride_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ride_participants ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.rides_id_seq;
DROP TABLE IF EXISTS public.rides;
DROP SEQUENCE IF EXISTS public.ride_requests_id_seq;
DROP TABLE IF EXISTS public.ride_requests;
DROP SEQUENCE IF EXISTS public.ride_participants_id_seq;
DROP TABLE IF EXISTS public.ride_participants;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ride_participants; Type: TABLE; Schema: public; Owner: erikdyer
--

CREATE TABLE public.ride_participants (
    id integer NOT NULL,
    ride_id integer,
    user_id integer,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ride_participants OWNER TO erikdyer;

--
-- Name: ride_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: erikdyer
--

CREATE SEQUENCE public.ride_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ride_participants_id_seq OWNER TO erikdyer;

--
-- Name: ride_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erikdyer
--

ALTER SEQUENCE public.ride_participants_id_seq OWNED BY public.ride_participants.id;


--
-- Name: ride_requests; Type: TABLE; Schema: public; Owner: erikdyer
--

CREATE TABLE public.ride_requests (
    id integer NOT NULL,
    ride_id integer,
    requester_id integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ride_requests OWNER TO erikdyer;

--
-- Name: ride_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: erikdyer
--

CREATE SEQUENCE public.ride_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ride_requests_id_seq OWNER TO erikdyer;

--
-- Name: ride_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erikdyer
--

ALTER SEQUENCE public.ride_requests_id_seq OWNED BY public.ride_requests.id;


--
-- Name: rides; Type: TABLE; Schema: public; Owner: erikdyer
--

CREATE TABLE public.rides (
    id integer NOT NULL,
    creator_id integer,
    destination character varying(255) NOT NULL,
    departure_time timestamp with time zone NOT NULL,
    available_seats integer NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'active'::character varying,
    total_fare numeric(10,2),
    fare_per_person numeric(10,2) GENERATED ALWAYS AS (
CASE
    WHEN (available_seats > 0) THEN (total_fare / ((available_seats + 1))::numeric)
    ELSE total_fare
END) STORED
);


ALTER TABLE public.rides OWNER TO erikdyer;

--
-- Name: rides_id_seq; Type: SEQUENCE; Schema: public; Owner: erikdyer
--

CREATE SEQUENCE public.rides_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rides_id_seq OWNER TO erikdyer;

--
-- Name: rides_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erikdyer
--

ALTER SEQUENCE public.rides_id_seq OWNED BY public.rides.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: erikdyer
--

CREATE TABLE public.users (
    id integer NOT NULL,
    netid character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    phone character varying(20),
    phone_verified boolean DEFAULT false,
    phone_number character varying(20)
);


ALTER TABLE public.users OWNER TO erikdyer;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: erikdyer
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO erikdyer;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erikdyer
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: ride_participants id; Type: DEFAULT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.ride_participants ALTER COLUMN id SET DEFAULT nextval('public.ride_participants_id_seq'::regclass);


--
-- Name: ride_requests id; Type: DEFAULT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.ride_requests ALTER COLUMN id SET DEFAULT nextval('public.ride_requests_id_seq'::regclass);


--
-- Name: rides id; Type: DEFAULT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.rides ALTER COLUMN id SET DEFAULT nextval('public.rides_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: ride_participants; Type: TABLE DATA; Schema: public; Owner: erikdyer
--

COPY public.ride_participants (id, ride_id, user_id, joined_at) FROM stdin;
16	14	1	2025-01-05 19:45:38.880766-05
\.


--
-- Data for Name: ride_requests; Type: TABLE DATA; Schema: public; Owner: erikdyer
--

COPY public.ride_requests (id, ride_id, requester_id, status, created_at, updated_at) FROM stdin;
12	15	3	pending	2025-01-05 19:45:24.958774-05	2025-01-05 19:45:24.958774-05
11	14	1	approved	2025-01-05 19:44:56.326277-05	2025-01-05 19:44:56.326277-05
\.


--
-- Data for Name: rides; Type: TABLE DATA; Schema: public; Owner: erikdyer
--

COPY public.rides (id, creator_id, destination, departure_time, available_seats, notes, created_at, status, total_fare) FROM stdin;
2	2	Newark Airport	2024-12-31 14:00:00-05	2	Direct to Terminal B	2024-12-29 16:54:01.843016-05	active	\N
4	3	trenton 2?	2024-12-29 13:30:00-05	2	test123	2024-12-29 22:00:59.992812-05	cancelled	\N
5	3	JFK Airport	2024-12-30 12:15:00-05	3		2024-12-30 02:45:24.723942-05	cancelled	25.00
6	3	JFK Airport	2024-12-31 12:15:00-05	3		2024-12-30 18:00:00.801992-05	cancelled	25.00
7	3	JFK Airport	2024-12-31 12:20:00-05	3	terminal 2 	2024-12-30 22:17:28.242154-05	cancelled	35.00
8	3	JFK Airport	2024-12-31 12:30:00-05	3	test123	2024-12-30 22:37:53.349328-05	cancelled	25.00
9	3	JFK Airport	2024-12-31 12:45:00-05	3	test1234	2024-12-30 22:40:49.448071-05	cancelled	25.00
10	3	JFK Airport	2024-12-31 12:30:00-05	3	test123	2024-12-31 03:10:51.478496-05	cancelled	42.00
11	3	JFK Airport	2025-03-31 13:30:00-04	3	123	2024-12-31 03:13:42.869875-05	cancelled	25.00
12	3	Newark Airport	2024-12-31 12:30:00-05	3		2024-12-31 03:29:45.805474-05	cancelled	25.00
13	3	JFK Airport	2025-12-31 13:00:00-05	3	test123	2024-12-31 16:01:27.513472-05	cancelled	25.00
16	3	JFK Airport	2025-01-10 13:30:00-05	4	Testing 	2025-01-06 03:08:53.834648-05	cancelled	30.00
14	3	JFK Airport	2025-01-05 21:00:00-05	4	test	2025-01-05 19:44:43.074489-05	cancelled	30.00
15	1	LaGuardia Airport	2025-05-02 13:30:00-04	2	a	2025-01-05 19:45:19.813767-05	cancelled	25.00
1	1	JFK Airport	2024-12-30 10:00:00-05	3	Terminal 4 departure	2024-12-29 16:54:01.843016-05	cancelled	\N
3	1	Trenton	2024-12-29 13:00:00-05	3		2024-12-29 21:30:09.097385-05	cancelled	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: erikdyer
--

COPY public.users (id, netid, email, full_name, created_at, phone, phone_verified, phone_number) FROM stdin;
1	test123	test123@princeton.edu	Test User	2024-12-29 16:53:57.479782-05	\N	f	\N
3	ed1783	ed1783@princeton.edu	ed1783	2024-12-29 21:58:18.95496-05	\N	f	8138952544
2	tiger456	erikdyer65@gmail.com	Tiger Tester	2024-12-29 16:53:57.479782-05	\N	f	\N
\.


--
-- Name: ride_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erikdyer
--

SELECT pg_catalog.setval('public.ride_participants_id_seq', 17, true);


--
-- Name: ride_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erikdyer
--

SELECT pg_catalog.setval('public.ride_requests_id_seq', 12, true);


--
-- Name: rides_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erikdyer
--

SELECT pg_catalog.setval('public.rides_id_seq', 16, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erikdyer
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: ride_participants ride_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.ride_participants
    ADD CONSTRAINT ride_participants_pkey PRIMARY KEY (id);


--
-- Name: ride_participants ride_participants_ride_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.ride_participants
    ADD CONSTRAINT ride_participants_ride_id_user_id_key UNIQUE (ride_id, user_id);


--
-- Name: ride_requests ride_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.ride_requests
    ADD CONSTRAINT ride_requests_pkey PRIMARY KEY (id);


--
-- Name: rides rides_pkey; Type: CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_netid_key; Type: CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_netid_key UNIQUE (netid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ride_participants ride_participants_ride_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.ride_participants
    ADD CONSTRAINT ride_participants_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(id);


--
-- Name: ride_participants ride_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.ride_participants
    ADD CONSTRAINT ride_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ride_requests ride_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.ride_requests
    ADD CONSTRAINT ride_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id);


--
-- Name: ride_requests ride_requests_ride_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.ride_requests
    ADD CONSTRAINT ride_requests_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(id);


--
-- Name: rides rides_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erikdyer
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

