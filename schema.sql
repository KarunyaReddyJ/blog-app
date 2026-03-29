-- Blog Database Schema
-- Run this in your Supabase SQL Editor

-- Create Posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt VARCHAR(500),
  content JSONB,
  cover_image VARCHAR(255),
  seo_title VARCHAR(60),
  seo_description VARCHAR(160),
  author_id UUID REFERENCES auth.users NOT NULL,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0
);

-- Create Tags table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL
);

-- Create Post-Tags junction table
CREATE TABLE post_tags (
  post_id INT REFERENCES posts ON DELETE CASCADE,
  tag_id INT REFERENCES tags ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Create Likes table (track per-user to prevent spam)
CREATE TABLE post_likes (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES posts ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Views table (lightweight tracking)
CREATE TABLE post_views (
  id BIGSERIAL PRIMARY KEY,
  post_id INT REFERENCES posts ON DELETE CASCADE,
  ip_address INET,
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create User Roles table
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create Indexes for common queries
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX idx_post_views_post_id_date ON post_views(post_id, created_at DESC);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- Unique index to prevent duplicate likes (handles both authenticated and anonymous users)
CREATE UNIQUE INDEX idx_post_likes_unique 
  ON post_likes(post_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(ip_address, '0.0.0.0'::inet));

-- Enable RLS (Row Level Security)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (published_at IS NOT NULL);

CREATE POLICY "Posts are viewable by author (drafts)"
  ON posts FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Posts are insertable by authenticated users"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Posts are updatable by author"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Posts are deletable by author"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- RLS Policies for tags
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Tags are insertable by authenticated users"
  ON tags FOR INSERT
  WITH CHECK (true);

-- RLS Policies for post_tags
CREATE POLICY "Post tags are viewable by everyone"
  ON post_tags FOR SELECT
  USING (true);

CREATE POLICY "Post tags are managed by post author"
  ON post_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
    )
  );

-- RLS Policies for likes
CREATE POLICY "Likes are viewable by everyone"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (true);

-- RLS Policies for views
CREATE POLICY "Views are insertable by everyone"
  ON post_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Views are viewable by post author"
  ON post_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
    )
  );

-- RLS Policies for user_roles
CREATE POLICY "User roles are viewable by everyone"
  ON user_roles FOR SELECT
  USING (true);

CREATE POLICY "User roles are insertable by authenticated users"
  ON user_roles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "User roles are updatable by authenticated users"
  ON user_roles FOR UPDATE
  WITH CHECK (true);

-- SQL Functions for incrementing counters (atomic operations)
CREATE OR REPLACE FUNCTION increment_like_count(post_id INT)
RETURNS void AS $$
BEGIN
  UPDATE posts SET like_count = like_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_view_count(post_id INT)
RETURNS void AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Blog images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'blog-images');

-- SQL Functions for incrementing counters (atomic operations)
CREATE OR REPLACE FUNCTION increment_like_count(post_id INT)
RETURNS void AS $$
BEGIN
  UPDATE posts SET like_count = like_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_view_count(post_id INT)
RETURNS void AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
