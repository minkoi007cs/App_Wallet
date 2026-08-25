import { ProjectPriority, ProjectStatus } from '@/types/database';

export interface CreateProjectInput {
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  start_date?: string;
  target_date?: string;
  tags: string[];
  frontend_url?: string;
  backend_url?: string;
  supabase_url?: string;
}

export function validateProjectInput(input: CreateProjectInput): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length === 0) {
    errors.name = 'Project name is required.';
  } else if (input.name.trim().length < 2) {
    errors.name = 'Project name must be at least 2 characters.';
  }

  if (input.progress < 0 || input.progress > 100) {
    errors.progress = 'Progress must be between 0 and 100%.';
  }

  if (input.start_date && input.target_date) {
    if (new Date(input.start_date) > new Date(input.target_date)) {
      errors.target_date = 'Target date cannot be earlier than start date.';
    }
  }

  const isValidUrl = (url?: string) => {
    if (!url || url.trim().length === 0) return true;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  if (!isValidUrl(input.frontend_url)) {
    errors.frontend_url = 'Please enter a valid URL (e.g. https://my-app.vercel.app)';
  }
  if (!isValidUrl(input.backend_url)) {
    errors.backend_url = 'Please enter a valid URL (e.g. https://api.my-app.com)';
  }
  if (!isValidUrl(input.supabase_url)) {
    errors.supabase_url = 'Please enter a valid URL (e.g. https://supabase.com/dashboard/...)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
