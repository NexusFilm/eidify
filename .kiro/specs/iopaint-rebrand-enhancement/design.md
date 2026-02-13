# IOPaint Rebrand & Enhancement - Design Document

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/TS)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI/UX      │  │  Multi-Image │  │   Chatbot    │      │
│  │  Components  │  │   Gallery    │  │  Interface   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend (FastAPI/Python)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Image      │  │   Chatbot    │  │   Batch      │      │
│  │  Processing  │  │   Service    │  │  Processor   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │  PostgreSQL  │  │   Storage    │      │
│  │   Service    │  │   Database   │  │   Buckets    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Component Breakdown

#### Frontend Components
1. **Rebranded UI Shell**
   - New header with logo and navigation
   - Sidebar for tools and settings
   - Main canvas area for image editing
   - Bottom panel for chatbot interface

2. **Multi-Image Gallery**
   - Grid view of uploaded images
   - Thumbnail previews with status indicators
   - Drag & drop upload zone
   - Batch action controls

3. **Chatbot Interface**
   - Chat message list with history
   - Input field with suggestions
   - Visual feedback for AI actions
   - Command history and favorites

4. **Project Manager**
   - Project list sidebar
   - Project creation modal
   - Image assignment interface

#### Backend Services
1. **Image Processing Service** (existing, enhanced)
   - Single image processing (existing)
   - Batch processing queue
   - Progress tracking
   - Result caching

2. **Chatbot Service** (new)
   - Natural language understanding
   - Command parsing and validation
   - Image analysis integration
   - Action execution

3. **Supabase Integration Service** (new)
   - Authentication middleware
   - Database operations
   - Storage management
   - RLS policy enforcement

## 2. Database Schema

### 2.1 PostgreSQL Tables

```sql
-- Users table (managed by Supabase Auth)
-- Extended with custom profile data

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    tenant_id UUID NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    storage_quota_mb INTEGER DEFAULT 1000,
    storage_used_mb INTEGER DEFAULT 0
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Images table
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    format TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'uploaded', -- uploaded, processing, processed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Processing history table
CREATE TABLE processing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    operation_type TEXT NOT NULL, -- inpaint, outpaint, remove, adjust, etc.
    parameters JSONB NOT NULL,
    result_path TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Chatbot conversations table
CREATE TABLE chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    role TEXT NOT NULL, -- user, assistant
    command_parsed JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch jobs table
CREATE TABLE batch_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    parameters JSONB NOT NULL,
    image_ids UUID[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    progress INTEGER DEFAULT 0,
    total_images INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

### 2.2 Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Tenants: Users can only see their tenant
CREATE POLICY "Users can view own tenant" ON tenants
    FOR SELECT USING (
        id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    );

-- Projects: Users can only access projects in their tenant
CREATE POLICY "Users can view own tenant projects" ON projects
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    );

-- Images: Users can only access images in their tenant
CREATE POLICY "Users can view own tenant images" ON images
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    );

-- Similar policies for other tables...
```

## 3. Storage Bucket Structure

### 3.1 Bucket Organization

```
supabase-storage/
├── {tenant_id}/
│   ├── originals/
│   │   ├── {year}/
│   │   │   ├── {month}/
│   │   │   │   └── {image_id}.{ext}
│   ├── processed/
│   │   ├── {year}/
│   │   │   ├── {month}/
│   │   │   │   └── {image_id}_{timestamp}.{ext}
│   ├── masks/
│   │   └── {image_id}/
│   │       └── {mask_id}.png
│   └── projects/
│       └── {project_id}/
│           ├── originals/
│           └── processed/
```

### 3.2 Storage Policies

```sql
-- Bucket policies for tenant isolation
CREATE POLICY "Users can upload to own tenant bucket"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'images' AND
    (storage.foldername(name))[1] IN (
        SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can view own tenant files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'images' AND
    (storage.foldername(name))[1] IN (
        SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid()
    )
);
```

## 4. API Design

### 4.1 New Endpoints

#### Authentication
```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
PUT    /api/v1/auth/profile
```

#### Projects
```
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{id}
PUT    /api/v1/projects/{id}
DELETE /api/v1/projects/{id}
```

#### Multi-Image Processing
```
POST   /api/v1/images/batch-upload
POST   /api/v1/batch/process
GET    /api/v1/batch/{job_id}
GET    /api/v1/batch/{job_id}/status
DELETE /api/v1/batch/{job_id}
GET    /api/v1/batch/{job_id}/download
```

#### Chatbot
```
POST   /api/v1/chatbot/message
GET    /api/v1/chatbot/history/{image_id}
POST   /api/v1/chatbot/execute-command
DELETE /api/v1/chatbot/history/{conversation_id}
```

#### Storage
```
GET    /api/v1/storage/usage
GET    /api/v1/storage/images
DELETE /api/v1/storage/images/{id}
```

### 4.2 WebSocket Events

```typescript
// Client -> Server
{
  type: 'batch_process_start',
  data: {
    jobId: string,
    imageIds: string[],
    operation: object
  }
}

// Server -> Client
{
  type: 'batch_progress',
  data: {
    jobId: string,
    progress: number,
    currentImage: number,
    totalImages: number
  }
}

{
  type: 'batch_complete',
  data: {
    jobId: string,
    results: Array<{imageId: string, status: string, resultUrl: string}>
  }
}

{
  type: 'chatbot_response',
  data: {
    message: string,
    command: object,
    preview: string
  }
}
```

## 5. Chatbot Natural Language Processing

### 5.1 Command Patterns

```typescript
interface ChatbotCommand {
  intent: 'remove' | 'adjust' | 'enhance' | 'transform';
  target?: string; // "person", "background", "watermark", etc.
  location?: {
    type: 'absolute' | 'relative';
    value: string; // "left", "top-right", "center", coordinates
  };
  parameters?: {
    intensity?: number;
    color?: string;
    size?: number;
    [key: string]: any;
  };
}
```

### 5.2 Example Command Mappings

```typescript
const commandPatterns = [
  {
    pattern: /remove (the )?(.*?) (on|in|at) the (.*)/i,
    intent: 'remove',
    extract: (match) => ({
      target: match[2],
      location: { type: 'relative', value: match[4] }
    })
  },
  {
    pattern: /make (the )?(.*?) (more|less) (.*)/i,
    intent: 'adjust',
    extract: (match) => ({
      target: match[2],
      parameters: {
        property: match[4],
        direction: match[3]
      }
    })
  },
  {
    pattern: /erase (the )?(.*)/i,
    intent: 'remove',
    extract: (match) => ({
      target: match[2]
    })
  }
];
```

### 5.3 LLM Integration (Optional)

For more complex commands, integrate with OpenAI/Anthropic:

```python
async def parse_natural_language_command(message: str, image_context: dict):
    prompt = f"""
    Parse this image editing command into structured JSON:
    Command: "{message}"
    Image context: {image_context}
    
    Return JSON with: intent, target, location, parameters
    """
    
    response = await llm_client.complete(prompt)
    return json.loads(response)
```

## 6. UI/UX Design Specifications

### 6.1 Brand Identity

**Color Palette:**
- Primary: #6366F1 (Indigo)
- Secondary: #8B5CF6 (Purple)
- Accent: #EC4899 (Pink)
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)
- Neutral: #6B7280 (Gray)

**Typography:**
- Headings: Inter Bold
- Body: Inter Regular
- Monospace: JetBrains Mono

**Logo:**
- Modern, minimalist design
- Incorporates AI/image editing symbolism
- Works in light and dark modes

### 6.2 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo | Projects | Settings | User Menu        │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  Tools   │         Main Canvas Area                     │
│  Panel   │         (Image Editor)                       │
│          │                                              │
│  - Brush │                                              │
│  - Erase │                                              │
│  - AI    │                                              │
│  - Batch │                                              │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│  Chatbot Interface: "Ask AI to edit your image..."      │
│  [Chat history and input]                               │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Key UI Components

1. **Multi-Image Gallery Modal**
   - Grid layout with 3-4 columns
   - Thumbnail size: 200x200px
   - Status badges (processing, complete, error)
   - Batch action toolbar

2. **Chatbot Panel**
   - Collapsible bottom drawer
   - Message bubbles with timestamps
   - Typing indicator
   - Quick action buttons

3. **Project Selector**
   - Dropdown in header
   - Quick create button
   - Recent projects list

## 7. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Supabase project setup
- Database schema implementation
- Authentication integration
- Basic multi-tenant structure

### Phase 2: UI Rebrand (Weeks 3-4)
- New design system implementation
- Component library updates
- Responsive layout
- Theme support

### Phase 3: Multi-Image Processing (Weeks 5-6)
- Batch upload functionality
- Queue management system
- Progress tracking
- Bulk download

### Phase 4: Chatbot Integration (Weeks 7-8)
- NLP command parsing
- Chat UI implementation
- Command execution engine
- History management

### Phase 5: Testing & Polish (Weeks 9-10)
- End-to-end testing
- Performance optimization
- Bug fixes
- Documentation

## 8. Security Considerations

1. **Authentication**
   - JWT token validation on all protected endpoints
   - Refresh token rotation
   - Session management

2. **Authorization**
   - RLS policies enforced at database level
   - API-level tenant validation
   - File access verification

3. **Input Validation**
   - File type and size validation
   - SQL injection prevention
   - XSS protection
   - Rate limiting

4. **Data Privacy**
   - Encrypted data at rest
   - HTTPS for all communications
   - GDPR compliance considerations
   - Data retention policies

## 9. Performance Optimization

1. **Image Processing**
   - Queue-based processing
   - Worker pool for parallel processing
   - Result caching
   - CDN for static assets

2. **Database**
   - Indexed queries
   - Connection pooling
   - Query optimization
   - Pagination for large datasets

3. **Frontend**
   - Lazy loading
   - Image optimization
   - Code splitting
   - Service worker for offline support

## 10. Monitoring & Logging

1. **Application Metrics**
   - Processing time per image
   - Queue length and wait times
   - API response times
   - Error rates

2. **User Analytics**
   - Feature usage tracking
   - User engagement metrics
   - Conversion funnels
   - A/B testing framework

3. **System Health**
   - Server resource usage
   - Database performance
   - Storage utilization
   - Uptime monitoring
