import { fetchProjects, fetchProjectById } from '@/services/projects';
import { fetchTasksByProject } from '@/services/tasks';
import { fetchProjectRepositories } from '@/services/github';
import { fetchProjectIntegrations } from '@/services/vercel';

export interface SmartRecommendationItem {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionType: 'overdue_task' | 'critical_health' | 'missing_repo' | 'upcoming_milestone' | 'active_focus';
  targetRoute: string;
}

export interface AIAgentPromptOptions {
  agentType: 'antigravity' | 'cursor' | 'windsurf' | 'claude_code';
  customGoal?: string;
}

export async function getSmartRecommendations(): Promise<SmartRecommendationItem[]> {
  const projects = await fetchProjects();
  const recommendations: SmartRecommendationItem[] = [];

  for (const project of projects) {
    if (project.status === 'archived' || project.status === 'completed') continue;

    // Fetch tasks & repos for analysis
    const tasks = await fetchTasksByProject(project.id);
    const repos = await fetchProjectRepositories(project.id);

    // Check 1: Critical health alerts
    if (project.health_status === 'critical') {
      recommendations.push({
        id: `rec-crit-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        title: `Fix Critical Health Issues in ${project.name}`,
        reason: project.health_reasons?.[0] || 'Project health is critical.',
        priority: 'critical',
        actionType: 'critical_health',
        targetRoute: `/project/${project.id}`,
      });
    }

    // Check 2: Overdue tasks
    const nowStr = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(
      (t) => t.due_date && t.due_date < nowStr && t.status !== 'done'
    );

    if (overdueTasks.length > 0) {
      const topOverdue = overdueTasks[0];
      recommendations.push({
        id: `rec-task-${topOverdue.id}`,
        projectId: project.id,
        projectName: project.name,
        title: `Complete Overdue Task: ${topOverdue.title}`,
        reason: `Due on ${topOverdue.due_date} (${overdueTasks.length} overdue total)`,
        priority: topOverdue.priority === 'critical' || topOverdue.priority === 'high' ? 'critical' : 'high',
        actionType: 'overdue_task',
        targetRoute: `/project/tasks/${project.id}`,
      });
    }

    // Check 3: Active projects without linked GitHub repo
    if (project.status === 'active' && repos.length === 0) {
      recommendations.push({
        id: `rec-repo-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        title: `Link GitHub Repository to ${project.name}`,
        reason: 'Active project has no repository linked.',
        priority: 'medium',
        actionType: 'missing_repo',
        targetRoute: `/project/${project.id}`,
      });
    }

    // Check 4: High priority tasks in progress
    const inProgressHigh = tasks.filter(
      (t) => t.status === 'in_progress' && (t.priority === 'high' || t.priority === 'critical')
    );

    if (inProgressHigh.length > 0) {
      const targetTask = inProgressHigh[0];
      recommendations.push({
        id: `rec-inprog-${targetTask.id}`,
        projectId: project.id,
        projectName: project.name,
        title: `Finish In-Progress Task: ${targetTask.title}`,
        reason: `Priority: ${targetTask.priority.toUpperCase()}`,
        priority: 'high',
        actionType: 'active_focus',
        targetRoute: `/project/tasks/${project.id}`,
      });
    }
  }

  // Sort recommendations by priority urgency
  const priorityScore: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return recommendations.sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]);
}

export async function generateAIAgentPrompt(
  projectId: string,
  options?: AIAgentPromptOptions
): Promise<string> {
  const project = await fetchProjectById(projectId);
  if (!project) throw new Error(`Project ${projectId} not found.`);

  const tasks = await fetchTasksByProject(projectId);
  const repos = await fetchProjectRepositories(projectId);
  const integrations = await fetchProjectIntegrations(projectId);

  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const primaryRepo = repos[0];
  const primaryVercel = integrations.find((i) => i.provider === 'vercel');

  const agentNameMap: Record<string, string> = {
    antigravity: 'Google Antigravity AI Coding Agent',
    cursor: 'Cursor AI Agent',
    windsurf: 'Windsurf Cascade Agent',
    claude_code: 'Claude Code Agent',
  };

  const agentTitle = agentNameMap[options?.agentType || 'antigravity'];

  let prompt = `# Master Prompt for ${agentTitle}

You are acting as the lead software engineer for project **${project.name}**.

## Project Context
- **Project Name**: ${project.name}
- **Description**: ${project.description || 'N/A'}
- **Current Status**: ${project.status.toUpperCase()} (Progress: ${project.progress}%)
- **Health State**: ${project.health_status.toUpperCase()}
`;

  if (project.health_reasons && project.health_reasons.length > 0) {
    prompt += `- **Health Diagnostics**:\n${project.health_reasons.map((r) => `  - ${r}`).join('\n')}\n`;
  }

  if (primaryRepo) {
    prompt += `\n## Repository Details
- **GitHub Repository**: ${primaryRepo.url}
- **Role**: ${primaryRepo.role.toUpperCase()}
- **Default Branch**: ${primaryRepo.default_branch}
- **Primary Language**: ${primaryRepo.primary_language || 'N/A'}
- **Latest Commit**: "${primaryRepo.latest_commit_message || 'N/A'}" by ${primaryRepo.latest_commit_author || 'GitHub'}
`;
  }

  if (primaryVercel) {
    prompt += `\n## Deployment Details
- **Vercel Project**: ${primaryVercel.name}
- **Production URL**: ${primaryVercel.production_url || 'N/A'}
- **Latest Deployment Status**: ${primaryVercel.latest_deployment_status || 'N/A'}
`;
  }

  if (pendingTasks.length > 0) {
    prompt += `\n## Outstanding Tasks (${pendingTasks.length})
${pendingTasks
  .slice(0, 5)
  .map((t) => `- [ ] **${t.title}** [${t.priority.toUpperCase()}] — Status: ${t.status}`)
  .join('\n')}
`;
  }

  prompt += `\n## Session Goal
${options?.customGoal || 'Review current project state, implement pending high-priority tasks, and verify build & test suites.'}

Please review the codebase, propose your plan, and execute step-by-step.
`;

  return prompt;
}
