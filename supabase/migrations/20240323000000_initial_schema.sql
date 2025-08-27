-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  smacCoins INTEGER DEFAULT 0,
  isAdmin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create SMACCoinsDistribution table
CREATE TABLE "SMACCoinsDistribution" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  isActive BOOLEAN DEFAULT false,
  weeklyAmount INTEGER DEFAULT 0,
  lastDistributed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create SMACArticle table
CREATE TABLE "SMACArticle" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  gameDate TIMESTAMP WITH TIME ZONE NOT NULL,
  homeTeam TEXT NOT NULL,
  awayTeam TEXT NOT NULL,
  pick TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  imageUrl TEXT,
  published BOOLEAN DEFAULT false,
  publishRequest BOOLEAN DEFAULT false,
  authorId UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create SMACPick table
CREATE TABLE "SMACPick" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  sport TEXT NOT NULL,
  game TEXT NOT NULL,
  bet TEXT NOT NULL,
  odds DECIMAL NOT NULL,
  smacCoins INTEGER NOT NULL,
  result TEXT,
  yield DECIMAL,
  potentialYield DECIMAL,
  weekNumber INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SMACCoinsDistribution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SMACArticle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SMACPick" ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND isAdmin = true
    )
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND isAdmin = true
    )
  );

-- SMACCoinsDistribution policies
CREATE POLICY "Anyone can view distribution settings" ON "SMACCoinsDistribution"
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update distribution settings" ON "SMACCoinsDistribution"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND isAdmin = true
    )
  );

-- SMACArticle policies
CREATE POLICY "Anyone can view published articles" ON "SMACArticle"
  FOR SELECT USING (published = true);

CREATE POLICY "Authors can view their own articles" ON "SMACArticle"
  FOR SELECT USING (authorId = auth.uid());

CREATE POLICY "Admins can view all articles" ON "SMACArticle"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND isAdmin = true
    )
  );

CREATE POLICY "Authors can create articles" ON "SMACArticle"
  FOR INSERT WITH CHECK (authorId = auth.uid());

CREATE POLICY "Authors can update their own articles" ON "SMACArticle"
  FOR UPDATE USING (authorId = auth.uid());

CREATE POLICY "Admins can update any article" ON "SMACArticle"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND isAdmin = true
    )
  );

-- SMACPick policies
CREATE POLICY "Anyone can view picks" ON "SMACPick"
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage picks" ON "SMACPick"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND isAdmin = true
    )
  ); 