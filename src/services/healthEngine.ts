import { HealthState } from '@/types/database';
import { ProjectWithDetails, fetchProjectById, updateProject } from '@/services/projects';
import { fetchTasksByProject } from '@/services/tasks';
import { fetchProjectRepositories } from '@/services/github';
import { fetchProjectIntegrations } from '@/services/vercel';

export interface HealthDiagnosticResult {
  health_status: HealthState;
  health_reasons: string[];
}

export function computeProjectHealth(
  project: ProjectWithDetails,
  tasks: any[] = [],
  repositories: any[] = [],
  integrations: any[] = []
): HealthDiagnosticResult {
  const reasons: string[] = [];
  let isCritical = false;
  let isNeedsAttention = false;

  // Rule 1: Activity check (> 14 days inactive)
  const lastActivityTime = new Date(project.last_activity_at).getTime();
  const nowTime = Date.now();
  const daysInactive = Math.floor((nowTime - lastActivityTime) / (1000 * 60 * 60 * 24));

  if (daysInactive > 14 && project.status === 'active') {
    reasons.push(`No activity recorded for ${daysInactive} days`);
    isNeedsAttention = true;
  }

  // Rule 2: Overdue tasks check
  const nowStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(
    (t) => t.due_date && t.due_date < nowStr && t.status !== 'done'
  );

  if (overdueTasks.length > 0) {
    reasons.push(`${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue`);
    if (overdueTasks.some((t) => t.priority === 'high' || t.priority === 'critical')) {
      isCritical = true;
    } else {
      isNeedsAttention = true;
    }
  }

  // Rule 3: Missing repository link check for active projects
  const repoCount = repositories.length || project.repositories?.length || 0;
  if (project.status === 'active' && repoCount === 0) {
    reasons.push('No GitHub repository linked to active project');
    isNeedsAttention = true;
  }

  // Rule 4: Target date approach check
  if (project.target_date && project.status === 'active' && project.progress < 100) {
    const targetTime = new Date(project.target_date).getTime();
    const daysUntilTarget = Math.ceil((targetTime - nowTime) / (1000 * 60 * 60 * 24));

    if (daysUntilTarget < 0) {
      reasons.push(`Target date passed ${Math.abs(daysUntilTarget)} days ago`);
      isCritical = true;
    } else if (daysUntilTarget <= 7 && project.progress < 50) {
      reasons.push(`Target date in ${daysUntilTarget} days but progress is only ${project.progress}%`);
      isNeedsAttention = true;
    }
  }

  // Rule 5: Vercel deployment failure check
  const failedDeploys = integrations.filter(
    (i) => i.provider === 'vercel' && (i.latest_deployment_status === 'ERROR' || i.latest_deployment_status === 'FAILED')
  );
  if (failedDeploys.length > 0) {
    reasons.push(`Latest Vercel deployment failed on ${failedDeploys[0].name}`);
    isCritical = true;
  }

  // Calculate final health state
  let finalStatus: HealthState = 'healthy';
  if (isCritical) {
    finalStatus = 'critical';
  } else if (isNeedsAttention) {
    finalStatus = 'needs_attention';
  }

  if (reasons.length === 0) {
    reasons.push('Project health verified optimal. All metrics healthy.');
  }

  return {
    health_status: finalStatus,
    health_reasons: reasons,
  };
}

export async function evaluateAndSaveProjectHealth(projectId: string): Promise<HealthDiagnosticResult> {
  const project = await fetchProjectById(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found for health evaluation.`);
  }

  const tasks = await fetchTasksByProject(projectId);
  const repositories = await fetchProjectRepositories(projectId);
  const integrations = await fetchProjectIntegrations(projectId);

  const result = computeProjectHealth(project, tasks, repositories, integrations);

  // Update in database / local store
  await updateProject(projectId, {
    health_status: result.health_status,
    health_reasons: result.health_reasons,
  });

  return result;
}
