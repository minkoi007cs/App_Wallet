import { fetchProjects } from '@/services/projects';
import { HealthState, ProjectStatus } from '@/types/database';

export interface StatusDistribution {
  status: ProjectStatus;
  count: number;
  percentage: number;
}

export interface HealthDistribution {
  health: HealthState;
  count: number;
  percentage: number;
}

export interface TechFrequency {
  tag: string;
  count: number;
  percentage: number;
}

export interface UpcomingDeadlineItem {
  id: string;
  name: string;
  target_date: string;
  daysRemaining: number;
  progress: number;
  health_status: HealthState;
}

export interface ComprehensiveAnalytics {
  totalProjects: number;
  averageProgress: number;
  statusBreakdown: StatusDistribution[];
  healthBreakdown: HealthDistribution[];
  topTechStack: TechFrequency[];
  upcomingDeadlines: UpcomingDeadlineItem[];
}

export async function getComprehensiveAnalytics(): Promise<ComprehensiveAnalytics> {
  const projects = await fetchProjects();
  const total = projects.length;

  if (total === 0) {
    return {
      totalProjects: 0,
      averageProgress: 0,
      statusBreakdown: [],
      healthBreakdown: [],
      topTechStack: [],
      upcomingDeadlines: [],
    };
  }

  // 1. Average Progress
  const totalProgress = projects.reduce((acc, p) => acc + (p.progress || 0), 0);
  const averageProgress = Math.round(totalProgress / total);

  // 2. Status Distribution
  const statusCounts: Record<ProjectStatus, number> = {
    idea: 0,
    active: 0,
    paused: 0,
    completed: 0,
    archived: 0,
  };
  projects.forEach((p) => {
    if (statusCounts[p.status] !== undefined) {
      statusCounts[p.status] += 1;
    }
  });

  const statusBreakdown: StatusDistribution[] = (Object.keys(statusCounts) as ProjectStatus[]).map((status) => ({
    status,
    count: statusCounts[status],
    percentage: Math.round((statusCounts[status] / total) * 100),
  }));

  // 3. Health Distribution
  const healthCounts: Record<HealthState, number> = {
    healthy: 0,
    needs_attention: 0,
    critical: 0,
  };
  projects.forEach((p) => {
    const h = p.health_status || 'healthy';
    if (healthCounts[h] !== undefined) {
      healthCounts[h] += 1;
    }
  });

  const healthBreakdown: HealthDistribution[] = (Object.keys(healthCounts) as HealthState[]).map((health) => ({
    health,
    count: healthCounts[health],
    percentage: Math.round((healthCounts[health] / total) * 100),
  }));

  // 4. Tech Stack Frequency
  const tagCounts: Record<string, number> = {};
  projects.forEach((p) => {
    (p.tags || []).forEach((t) => {
      const cleanTag = t.trim();
      if (cleanTag) {
        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
      }
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const totalTagUsage = Object.values(tagCounts).reduce((acc, val) => acc + val, 0) || 1;

  const topTechStack: TechFrequency[] = sortedTags.map(([tag, count]) => ({
    tag,
    count,
    percentage: Math.round((count / totalTagUsage) * 100),
  }));

  // 5. Upcoming Deadlines
  const now = new Date();
  const upcomingDeadlines: UpcomingDeadlineItem[] = projects
    .filter((p) => p.target_date && p.status !== 'completed' && p.status !== 'archived')
    .map((p) => {
      const targetTime = new Date(p.target_date!).getTime();
      const daysRemaining = Math.ceil((targetTime - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: p.id,
        name: p.name,
        target_date: p.target_date!,
        daysRemaining,
        progress: p.progress,
        health_status: p.health_status,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 4);

  return {
    totalProjects: total,
    averageProgress,
    statusBreakdown,
    healthBreakdown,
    topTechStack,
    upcomingDeadlines,
  };
}
