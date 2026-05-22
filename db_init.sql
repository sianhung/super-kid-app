-- =====================================================================
-- SUPER KID APP (KIDS VIDEO & GAMIFIED QUIZ APP MVP)
-- Database Initialization & Seed Script for Supabase / PostgreSQL
-- =====================================================================

-- Enable UUID extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Table Definitions
-- ---------------------------------------------------------------------

-- A. Users Profile Table
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name TEXT NOT NULL,
    avatar_custom_data JSONB DEFAULT '{"equipped_gear": null}'::jsonb,
    star_coins INTEGER DEFAULT 0 CHECK (star_coins >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. Episodes Table
CREATE TABLE IF NOT EXISTS public.episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    youtube_video_id TEXT NOT NULL, -- YouTube video identifier
    thumbnail_url TEXT NOT NULL,
    order_index INTEGER UNIQUE NOT NULL -- Sequence number for locking/unlocking progress
);

-- C. Quizzes Table (Multiple Choice questions linked to episodes)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT[] NOT NULL CHECK (cardinality(options) = 4), -- Forces exactly 4 choices
    correct_option_index INTEGER NOT NULL CHECK (correct_option_index >= 0 AND correct_option_index <= 3),
    coin_reward INTEGER DEFAULT 10 CHECK (coin_reward > 0)
);

-- D. Contests Table
CREATE TABLE IF NOT EXISTS public.contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    points_reward INTEGER DEFAULT 200 CHECK (points_reward > 0),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. Contest Submissions Table
CREATE TABLE IF NOT EXISTS public.contest_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
    contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE NOT NULL,
    submission_text TEXT,
    submission_attachment_url TEXT, -- Store uploaded drawing URL/path
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 2. Indexes for Optimized Fetching
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_episodes_order_index ON public.episodes(order_index);
CREATE INDEX IF NOT EXISTS idx_quizzes_episode_id ON public.quizzes(episode_id);

-- ---------------------------------------------------------------------
-- 3. Database Functions & Remote Procedure Calls (RPC)
-- ---------------------------------------------------------------------

-- RPC Function to safely increment coins on the backend
CREATE OR REPLACE FUNCTION public.increment_coins(user_id UUID, coins_to_add INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_coin_total INTEGER;
BEGIN
    -- Input check
    IF coins_to_add <= 0 THEN
        RAISE EXCEPTION 'Coin amount must be positive';
    END IF;

    -- Update balance
    UPDATE public.users_profile
    SET star_coins = star_coins + coins_to_add
    WHERE id = user_id
    RETURNING star_coins INTO new_coin_total;

    RETURN new_coin_total;
END;
$$;

-- RPC Function to handle avatar prize shop purchases
CREATE OR REPLACE FUNCTION public.purchase_shop_item(user_id UUID, item_id TEXT, item_cost INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_coins INTEGER;
    current_gear JSONB;
BEGIN
    -- Get current coins
    SELECT star_coins, avatar_custom_data INTO current_coins, current_gear
    FROM public.users_profile
    WHERE id = user_id;

    -- Check if user exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Check if enough coins
    IF current_coins < item_cost THEN
        RETURN FALSE;
    END IF;

    -- Deduct coins and update equipped items inside avatar_custom_data json
    UPDATE public.users_profile
    SET 
        star_coins = star_coins - item_cost,
        avatar_custom_data = jsonb_set(
            COALESCE(avatar_custom_data, '{"equipped_gear": null}'::jsonb),
            '{equipped_gear}',
            to_jsonb(item_id)
        )
    WHERE id = user_id;

    RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. Supabase Row Level Security (RLS) Configuration
-- ---------------------------------------------------------------------
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Allow read-only access for guest users to Episodes & Quizzes
CREATE POLICY "Allow public read access to episodes" ON public.episodes
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access to quizzes" ON public.quizzes
    FOR SELECT TO public USING (true);

-- Allow authenticated/public users to read and update their own profile stats
CREATE POLICY "Allow users to manage their own profile" ON public.users_profile
    FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 5. Seed Mock Data for Interactive Dashboard (Milestone Seed)
-- ---------------------------------------------------------------------

-- Clear existing data (for clean fresh setup)
TRUNCATE public.contest_submissions CASCADE;
TRUNCATE public.contests CASCADE;
TRUNCATE public.quizzes CASCADE;
TRUNCATE public.episodes CASCADE;
TRUNCATE public.users_profile CASCADE;

-- Insert Mock Profile
INSERT INTO public.users_profile (id, display_name, star_coins, avatar_custom_data)
VALUES (
    'd8c2278e-6d1a-4c28-98e3-0d3a776c5b96',
    'Leo Starry',
    0,
    '{"equipped_gear": null}'::jsonb
);

-- Insert Mock Episodes
-- Episode 1
INSERT INTO public.episodes (id, title, youtube_video_id, thumbnail_url, order_index)
VALUES (
    'e1c12e87-0b1a-48d6-848e-653ea956bc01',
    'Journey to the Bubble Planet!',
    'R9K2Sj76L38', -- Superbook Season 1 Episode 1 Clip
    'assets/episode1.png',
    1
);

-- Episode 2
INSERT INTO public.episodes (id, title, youtube_video_id, thumbnail_url, order_index)
VALUES (
    'e2c23f88-1c2b-49e7-959f-764fb067cd02',
    'The Rainbow Jellyfish Chase',
    'JtV_n6dMh_s', -- Superbook Season 1 Episode 2 Clip
    'assets/episode2.png',
    2
);

-- Episode 3
INSERT INTO public.episodes (id, title, youtube_video_id, thumbnail_url, order_index)
VALUES (
    'e3c34a99-2d3c-4bf8-a6af-875fc178de03',
    'Mystery of the Floating Candies',
    'rC78Q7kYdDk', -- Superbook Season 1 Episode 3 Clip
    'assets/episode3.png',
    3
);

-- Insert Mock Quizzes (1 Quiz per episode, containing 2 questions each)
-- Episode 1 Quiz Question A
INSERT INTO public.quizzes (episode_id, question_text, options, correct_option_index, coin_reward)
VALUES (
    'e1c12e87-0b1a-48d6-848e-653ea956bc01',
    'What was the name of the main robot companion?',
    ARRAY['Gizmo', 'Robo', 'Sparky', 'Bolt'],
    0, -- Correct: 'Gizmo' (index 0)
    50
);

-- Episode 1 Quiz Question B
INSERT INTO public.quizzes (episode_id, question_text, options, correct_option_index, coin_reward)
VALUES (
    'e1c12e87-0b1a-48d6-848e-653ea956bc01',
    'What do you earn when you finish a challenge?',
    ARRAY['SuperPoints', 'Gold Bars', 'Trophies', 'Stickers'],
    0, -- Correct: 'SuperPoints' (index 0)
    50
);

-- Episode 2 Quiz Question A
INSERT INTO public.quizzes (episode_id, question_text, options, correct_option_index, coin_reward)
VALUES (
    'e2c23f88-1c2b-49e7-959f-764fb067cd02',
    'What was the name of the main robot companion?',
    ARRAY['Gizmo', 'Robo', 'Sparky', 'Bolt'],
    0, -- Correct: 'Gizmo' (index 0)
    50
);

-- Episode 3 Quiz Question A
INSERT INTO public.quizzes (episode_id, question_text, options, correct_option_index, coin_reward)
VALUES (
    'e3c34a99-2d3c-4bf8-a6af-875fc178de03',
    'What do you earn when you finish a challenge?',
    ARRAY['SuperPoints', 'Gold Bars', 'Trophies', 'Stickers'],
    0, -- Correct: 'SuperPoints' (index 0)
    50
);

-- Insert Mock Contests
INSERT INTO public.contests (id, title, description, thumbnail_url, points_reward)
VALUES (
    'c1c12e87-0b1a-48d6-848e-653ea956bc01',
    'Gizmo Space Drawing Contest!',
    'Draw Gizmo exploring a futuristic planet filled with candy volcanos and glowing cyber-jellyfish! Submit your drawing transmission to earn points.',
    'assets/mascot.png',
    200
), (
    'c2c23f88-1c2b-49e7-959f-764fb067cd02',
    'Daily Verse Recitation Challenge',
    'Record or type your best recitation of the weekly spaceship scripture: "For God did not give us a spirit of cowardice, but rather of power and love and self-control" (2 Timothy 1:7).',
    'assets/crown.png',
    200
);
