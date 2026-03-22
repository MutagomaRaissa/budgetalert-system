import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BriefcaseBusiness,
  Database,
  Gauge,
  Mail,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type AuthMode = 'login' | 'register';
type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
type ResourceType = 'COMPUTE' | 'STORAGE' | 'NETWORK';
type ComputeUsagePattern = 'ALWAYS_ON' | 'BUSINESS_HOURS' | 'CUSTOM';
type AlertStatus = 'NEW' | 'READ';
type CoverageSeverity = 'OK' | 'WARNING' | 'HIGH' | 'CRITICAL';

type AuthResponse = { token: string; tokenType?: string; expiresInSeconds?: number };

type Resource = {
  id: string;
  resourceType: ResourceType;
  vmSku: string | null;
  vcpu: number | null;
  ramGb: number | null;
  computeUsagePattern: ComputeUsagePattern | null;
  customHoursPerMonth: number | null;
  storageTier: string | null;
  storageGb: number | null;
  monthlyEgressGb: number | null;
  active: boolean;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cloudProvider: string;
  monthlyBudget: number;
  annualBudget: number | null;
  ownerEmail: string;
  status: ProjectStatus;
  createdAt: string;
  resources: Resource[];
};

type Coverage = {
  projectId: string;
  projectName: string;
  category: string;
  snapshotDate: string;
  dailyCost: number;
  monthToDateCost: number;
  forecastCost: number;
  monthlyBudget: number;
  budgetUsagePercentage: number;
  severity: CoverageSeverity;
};

type AlertItem = {
  id: string;
  projectId: string;
  projectName: string;
  recipientEmail: string;
  category: string;
  forecastCost: number;
  monthlyBudget: number;
  usagePercentage: number;
  severity: CoverageSeverity;
  message: string;
  status: AlertStatus;
  createdAt: string;
};

type ProjectDraft = {
  name: string;
  description: string;
  category: string;
  cloudProvider: string;
  monthlyBudget: string;
  annualBudget: string;
};

type ResourceDraft = {
  projectId: string;
  resourceType: ResourceType;
  vmSku: string;
  vcpu: string;
  ramGb: string;
  computeUsagePattern: ComputeUsagePattern;
  customHoursPerMonth: string;
  storageTier: string;
  storageGb: string;
  monthlyEgressGb: string;
  active: boolean;
};

const TOKEN_KEY = 'budgetwatch.token';
const EMAIL_KEY = 'budgetwatch.email';
const API_BASE_PATH = (import.meta.env.VITE_API_BASE_PATH ?? '').replace(/\/$/, '');

const defaultProjectDraft: ProjectDraft = {
  name: '',
  description: '',
  category: '',
  cloudProvider: 'Azure',
  monthlyBudget: '',
  annualBudget: '',
};

const defaultResourceDraft: ResourceDraft = {
  projectId: '',
  resourceType: 'COMPUTE',
  vmSku: '',
  vcpu: '',
  ramGb: '',
  computeUsagePattern: 'ALWAYS_ON',
  customHoursPerMonth: '',
  storageTier: '',
  storageGb: '',
  monthlyEgressGb: '',
  active: true,
};

const severityColor: Record<CoverageSeverity, string> = {
  OK: '#4ade80',
  WARNING: '#f59e0b',
  HIGH: '#fb7185',
  CRITICAL: '#ef4444',
};

const severityLabel: Record<CoverageSeverity, string> = {
  OK: 'Healthy',
  WARNING: 'Watch',
  HIGH: 'Over budget',
  CRITICAL: 'Critical',
};

const statusTone: Record<ProjectStatus, string> = {
  ACTIVE: 'status-active',
  PAUSED: 'status-paused',
  ARCHIVED: 'status-archived',
};

const chartPalette = ['#4adede', '#ff7f50', '#f7b801', '#8b5cf6'];

function money(value: number | null | undefined) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: value && Math.abs(value) >= 1000 ? 0 : 2,
  }).format(value ?? 0);
}

function shortMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

function normalizeMessage(message: string) {
  return message.replace('â‚¬', 'EUR ');
}

function formatApiError(status: number, text: string) {
  const trimmed = text.trim();

  if (status === 500 && (!trimmed || trimmed === 'Internal Server Error')) {
    return 'The backend is not ready yet or hit a temporary error. Please try again in a few seconds.';
  }

  if (trimmed) {
    try {
      const parsed = JSON.parse(trimmed) as {
        message?: string;
        error?: string;
      };

      if (status === 503) {
        return 'A backend service is still starting up. Please wait a few seconds and try again.';
      }

      if (parsed.message) {
        if (status === 500 && parsed.message === 'Internal Server Error') {
          return 'The backend is not ready yet or hit a temporary error. Please try again in a few seconds.';
        }
        return parsed.message;
      }

      if (parsed.error) {
        if (status === 500 && parsed.error === 'Internal Server Error') {
          return 'The backend is not ready yet or hit a temporary error. Please try again in a few seconds.';
        }
        return parsed.error;
      }
    } catch {
      if (status === 503) {
        return 'A backend service is still starting up. Please wait a few seconds and try again.';
      }

      return trimmed;
    }
  }

  return `${status}`;
}

function projectToDraft(project: Project): ProjectDraft {
  return {
    name: project.name,
    description: project.description ?? '',
    category: project.category,
    cloudProvider: project.cloudProvider,
    monthlyBudget: String(project.monthlyBudget ?? ''),
    annualBudget: project.annualBudget != null ? String(project.annualBudget) : '',
  };
}

function resourceToDraft(projectId: string, resource: Resource): ResourceDraft {
  return {
    projectId,
    resourceType: resource.resourceType,
    vmSku: resource.vmSku ?? '',
    vcpu: resource.vcpu != null ? String(resource.vcpu) : '',
    ramGb: resource.ramGb != null ? String(resource.ramGb) : '',
    computeUsagePattern: resource.computeUsagePattern ?? 'ALWAYS_ON',
    customHoursPerMonth: resource.customHoursPerMonth != null ? String(resource.customHoursPerMonth) : '',
    storageTier: resource.storageTier ?? '',
    storageGb: resource.storageGb != null ? String(resource.storageGb) : '',
    monthlyEgressGb: resource.monthlyEgressGb != null ? String(resource.monthlyEgressGb) : '',
    active: resource.active,
  };
}

async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const requestPath = `${API_BASE_PATH}${path}`;
  const response = await fetch(requestPath, { ...init, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(formatApiError(response.status, text || response.statusText));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [email, setEmail] = useState<string>(() => localStorage.getItem(EMAIL_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [coverageByProject, setCoverageByProject] = useState<Record<string, Coverage[]>>({});
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(defaultProjectDraft);
  const [resourceDraft, setResourceDraft] = useState<ResourceDraft>(defaultResourceDraft);
  const [projectEditDraft, setProjectEditDraft] = useState<ProjectDraft>(defaultProjectDraft);
  const [resourceEditDraft, setResourceEditDraft] = useState<ResourceDraft>(defaultResourceDraft);

  const [authLoading, setAuthLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [coverageRefreshing, setCoverageRefreshing] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [resourceSaving, setResourceSaving] = useState(false);
  const [projectUpdating, setProjectUpdating] = useState(false);
  const [resourceUpdating, setResourceUpdating] = useState(false);
  const [projectDeleting, setProjectDeleting] = useState(false);
  const [resourceDeleting, setResourceDeleting] = useState(false);
  const detailPanelRef = useRef<HTMLElement | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [projectStatusDraft, setProjectStatusDraft] = useState<ProjectStatus>('ACTIVE');
  const [globalError, setGlobalError] = useState('');
  const [notice, setNotice] = useState('');

  const latestCoverage = useMemo(() => {
    const entries = Object.values(coverageByProject)
      .map((history) => history[0])
      .filter(Boolean) as Coverage[];
    return Object.fromEntries(entries.map((item) => [item.projectId, item]));
  }, [coverageByProject]);

  const coverageList = useMemo(
    () =>
      projects
        .map((project) => latestCoverage[project.id])
        .filter(Boolean)
        .sort((left, right) => right.budgetUsagePercentage - left.budgetUsagePercentage) as Coverage[],
    [latestCoverage, projects],
  );

  const selectedHistory = selectedProjectId ? coverageByProject[selectedProjectId] ?? [] : [];
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedProjectResources = selectedProject?.resources ?? [];
  const selectedResource =
    selectedProjectResources.find((resource) => resource.id === selectedResourceId) ??
    selectedProjectResources[0] ??
    null;

  const summary = useMemo(() => {
    const activeProjects = projects.filter((project) => project.status === 'ACTIVE');
    const totalBudget = projects.reduce((sum, project) => sum + (project.monthlyBudget ?? 0), 0);
    const totalResources = projects.reduce((sum, project) => sum + project.resources.length, 0);
    const monthToDate = coverageList.reduce((sum, item) => sum + item.monthToDateCost, 0);
    const forecast = coverageList.reduce((sum, item) => sum + item.forecastCost, 0);
    const unreadAlerts = alerts.filter((alert) => alert.status === 'NEW').length;
    const criticalProjects = coverageList.filter((item) => item.severity === 'CRITICAL').length;

    return {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      totalBudget,
      totalResources,
      monthToDate,
      forecast,
      unreadAlerts,
      criticalProjects,
      overrun: Math.max(forecast - totalBudget, 0),
    };
  }, [alerts, coverageList, projects]);

  const providerBreakdown = useMemo(() => {
    const providers = new Map<string, number>();
    projects.forEach((project) => {
      providers.set(project.cloudProvider, (providers.get(project.cloudProvider) ?? 0) + 1);
    });
    return Array.from(providers.entries()).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const projectStatusBreakdown = useMemo(() => {
    const counts = new Map<ProjectStatus, number>();
    const statusPalette: Record<ProjectStatus, string> = {
      ACTIVE: '#4ade80',
      PAUSED: '#f59e0b',
      ARCHIVED: '#94a3b8',
    };

    projects.forEach((project) => {
      counts.set(project.status, (counts.get(project.status) ?? 0) + 1);
    });

    return (['ACTIVE', 'PAUSED', 'ARCHIVED'] as ProjectStatus[])
      .filter((status) => counts.has(status))
      .map((status) => ({
        name: titleCase(status),
        value: counts.get(status) ?? 0,
        color: statusPalette[status],
      }));
  }, [projects]);

  const projectRows = useMemo(
    () =>
      projects
        .map((project) => ({
          ...project,
          latestCoverage: latestCoverage[project.id] ?? null,
          usage: latestCoverage[project.id]?.budgetUsagePercentage ?? 0,
        }))
        .sort((left, right) => right.usage - left.usage),
    [latestCoverage, projects],
  );

  useEffect(() => {
    if (!token || !email) {
      return;
    }
    void refreshDashboard(token, email, true);
  }, [token, email]);

  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProjectId('');
      return;
    }

    const hasSelectedProject = projects.some((project) => project.id === selectedProjectId);
    if (!hasSelectedProject) {
      setSelectedProjectId(projects[0].id);
    }

    setResourceDraft((current) => ({
      ...current,
      projectId: current.projectId && projects.some((project) => project.id === current.projectId)
        ? current.projectId
        : projects[0].id,
    }));
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!selectedProject) {
      setSelectedResourceId('');
      setProjectEditDraft(defaultProjectDraft);
      return;
    }

    setProjectStatusDraft(selectedProject.status);
    setProjectEditDraft(projectToDraft(selectedProject));
    if (!selectedProject.resources.some((resource) => resource.id === selectedResourceId)) {
      setSelectedResourceId(selectedProject.resources[0]?.id ?? '');
    }
  }, [selectedProject, selectedResourceId]);

  useEffect(() => {
    if (!selectedProject || !selectedResource) {
      setResourceEditDraft((current) => ({
        ...defaultResourceDraft,
        projectId: current.projectId || selectedProject?.id || '',
      }));
      return;
    }

    setResourceEditDraft(resourceToDraft(selectedProject.id, selectedResource));
  }, [selectedProject, selectedResource]);

  async function refreshDashboard(currentToken = token, currentEmail = email, silent = false, suppressErrors = false) {
    if (!currentToken || !currentEmail) {
      return;
    }

    if (!silent) {
      setDashboardLoading(true);
      setGlobalError('');
      setNotice('');
    }

    try {
      const nextProjects = await apiRequest<Project[]>('/api/v1/projects', {}, currentToken);
      const histories = await Promise.all(
        nextProjects.map(async (project) => {
          const history = await apiRequest<Coverage[]>(
            `/api/v1/coverage/projects/${project.id}`,
            {},
            currentToken,
          ).catch(() => []);
          return [project.id, history] as const;
        }),
      );
      const nextAlerts = await apiRequest<AlertItem[]>('/api/v1/alerts', {}, currentToken);

      setProjects(nextProjects);
      setCoverageByProject(Object.fromEntries(histories));
      setAlerts(nextAlerts);
      if (!silent) {
        setNotice('Dashboard synced with all microservices.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load dashboard';
      if (message.includes('403') || message.includes('401')) {
        logout();
      }
      if (!suppressErrors) {
        setGlobalError(message);
      }
    } finally {
      setDashboardLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken(null);
    setProjects([]);
    setCoverageByProject({});
    setAlerts([]);
    setPassword('');
    setNotice('');
    setGlobalError('');
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setGlobalError('');
    setNotice('');

    try {
      if (authMode === 'register') {
        const response = await apiRequest<AuthResponse>('/api/v1/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, fullName }),
        });
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(EMAIL_KEY, email);
        setToken(response.token);
        setNotice('Account created and signed in.');
      } else {
        const response = await apiRequest<AuthResponse>('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(EMAIL_KEY, email);
        setToken(response.token);
        setNotice('Signed in successfully.');
      }
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleCoverageRefresh() {
    if (!token) {
      return;
    }

    setCoverageRefreshing(true);
    setGlobalError('');
    setNotice('');

    try {
      const recalculated = await apiRequest<Coverage[]>(
        '/api/v1/coverage/calculate',
        { method: 'POST' },
        token,
      );
      setCoverageByProject((current) => {
        const next = { ...current };
        recalculated.forEach((entry) => {
          const existing = next[entry.projectId] ?? [];
          next[entry.projectId] = [entry, ...existing.filter((item) => item.snapshotDate !== entry.snapshotDate)];
        });
        return next;
      });
      await refreshDashboard(token, email, true, true);
      setNotice('Coverage recalculated and alert pipeline updated.');
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Unable to recalculate coverage');
    } finally {
      setCoverageRefreshing(false);
    }
  }

  function focusProject(projectId: string, openResource = false) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }

    setSelectedProjectId(projectId);
    setSelectedResourceId(openResource ? project.resources[0]?.id ?? '' : project.resources[0]?.id ?? '');
    window.setTimeout(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function focusResource(projectId: string, resourceId: string) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }

    setSelectedProjectId(projectId);
    setSelectedResourceId(resourceId);
    window.setTimeout(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  async function handleProjectStatusUpdate() {
    if (!token || !selectedProject) {
      return;
    }

    setStatusSaving(true);
    setGlobalError('');
    setNotice('');

    try {
      const updatedProject = await apiRequest<Project>(
        `/api/v1/projects/${selectedProject.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: projectStatusDraft }),
        },
        token,
      );

      setProjects((current) =>
        current.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
      );
      setNotice(`Project status updated to ${titleCase(updatedProject.status)}.`);
      await refreshDashboard(token, email, true, true);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Unable to update project status');
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleProjectUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedProject) {
      return;
    }

    setProjectUpdating(true);
    setGlobalError('');
    setNotice('');

    try {
      const updatedProject = await apiRequest<Project>(
        `/api/v1/projects/${selectedProject.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: projectEditDraft.name,
            description: projectEditDraft.description,
            category: projectEditDraft.category,
            cloudProvider: projectEditDraft.cloudProvider,
            monthlyBudget: Number(projectEditDraft.monthlyBudget),
            annualBudget: toNumber(projectEditDraft.annualBudget),
          }),
        },
        token,
      );

      setProjects((current) =>
        current.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
      );
      setNotice('Project updated successfully.');
      await refreshDashboard(token, email, true, true);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Unable to update project');
    } finally {
      setProjectUpdating(false);
    }
  }

  async function handleProjectDelete() {
    if (!token || !selectedProject) {
      return;
    }

    if (!window.confirm(`Delete project "${selectedProject.name}"? This will also remove its attached resources.`)) {
      return;
    }

    setProjectDeleting(true);
    setGlobalError('');
    setNotice('');

    try {
      await apiRequest<void>(`/api/v1/projects/${selectedProject.id}`, { method: 'DELETE' }, token);
      const remainingProjects = projects.filter((project) => project.id !== selectedProject.id);
      setProjects(remainingProjects);
      setCoverageByProject((current) => {
        const next = { ...current };
        delete next[selectedProject.id];
        return next;
      });
      setSelectedProjectId(remainingProjects[0]?.id ?? '');
      setSelectedResourceId('');
      setNotice('Project deleted successfully.');
      await refreshDashboard(token, email, true, true);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Unable to delete project');
    } finally {
      setProjectDeleting(false);
    }
  }

  async function handleProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setProjectSaving(true);
    setGlobalError('');
    setNotice('');

    try {
      await apiRequest<Project>(
        '/api/v1/projects',
        {
          method: 'POST',
          body: JSON.stringify({
            name: projectDraft.name,
            description: projectDraft.description,
            category: projectDraft.category,
            cloudProvider: projectDraft.cloudProvider,
            monthlyBudget: Number(projectDraft.monthlyBudget),
            annualBudget: toNumber(projectDraft.annualBudget),
          }),
        },
        token,
      );
      setProjectDraft(defaultProjectDraft);
      await refreshDashboard(token, email, true, true);
      setNotice('Project created successfully.');
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Unable to create project');
    } finally {
      setProjectSaving(false);
    }
  }

  async function handleResourceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !resourceDraft.projectId) {
      return;
    }

    setResourceSaving(true);
    setGlobalError('');
    setNotice('');

    try {
      await apiRequest<Resource>(
        `/api/v1/projects/${resourceDraft.projectId}/resources`,
        {
          method: 'POST',
          body: JSON.stringify({
            resourceType: resourceDraft.resourceType,
            vmSku: resourceDraft.vmSku || undefined,
            vcpu: toNumber(resourceDraft.vcpu),
            ramGb: toNumber(resourceDraft.ramGb),
            computeUsagePattern:
              resourceDraft.resourceType === 'COMPUTE' ? resourceDraft.computeUsagePattern : undefined,
            customHoursPerMonth:
              resourceDraft.resourceType === 'COMPUTE' &&
              resourceDraft.computeUsagePattern === 'CUSTOM'
                ? toNumber(resourceDraft.customHoursPerMonth)
                : undefined,
            storageTier: resourceDraft.resourceType === 'STORAGE' ? resourceDraft.storageTier || undefined : undefined,
            storageGb: resourceDraft.resourceType === 'STORAGE' ? toNumber(resourceDraft.storageGb) : undefined,
            monthlyEgressGb:
              resourceDraft.resourceType === 'NETWORK' ? toNumber(resourceDraft.monthlyEgressGb) : undefined,
            active: resourceDraft.active,
          }),
        },
        token,
      );
      setResourceDraft((current) => ({ ...defaultResourceDraft, projectId: current.projectId }));
      await refreshDashboard(token, email, true, true);
      setNotice('Resource added to project.');
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Unable to add resource');
    } finally {
      setResourceSaving(false);
    }
  }

  async function handleResourceUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedProject || !selectedResource) {
      return;
    }

    setResourceUpdating(true);
    setGlobalError('');
    setNotice('');

    try {
      const updatedResource = await apiRequest<Resource>(
        `/api/v1/projects/${selectedProject.id}/resources/${selectedResource.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            resourceType: resourceEditDraft.resourceType,
            vmSku: resourceEditDraft.vmSku || undefined,
            vcpu: toNumber(resourceEditDraft.vcpu),
            ramGb: toNumber(resourceEditDraft.ramGb),
            computeUsagePattern:
              resourceEditDraft.resourceType === 'COMPUTE' ? resourceEditDraft.computeUsagePattern : undefined,
            customHoursPerMonth:
              resourceEditDraft.resourceType === 'COMPUTE' &&
              resourceEditDraft.computeUsagePattern === 'CUSTOM'
                ? toNumber(resourceEditDraft.customHoursPerMonth)
                : undefined,
            storageTier:
              resourceEditDraft.resourceType === 'STORAGE' ? resourceEditDraft.storageTier || undefined : undefined,
            storageGb: resourceEditDraft.resourceType === 'STORAGE' ? toNumber(resourceEditDraft.storageGb) : undefined,
            monthlyEgressGb:
              resourceEditDraft.resourceType === 'NETWORK' ? toNumber(resourceEditDraft.monthlyEgressGb) : undefined,
            active: resourceEditDraft.active,
          }),
        },
        token,
      );

      setProjects((current) =>
        current.map((project) =>
          project.id === selectedProject.id
            ? {
                ...project,
                resources: project.resources.map((resource) =>
                  resource.id === updatedResource.id ? updatedResource : resource,
                ),
              }
            : project,
        ),
      );
      setNotice('Resource updated successfully.');
      await refreshDashboard(token, email, true, true);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Unable to update resource');
    } finally {
      setResourceUpdating(false);
    }
  }

  async function handleResourceDelete(resourceId = selectedResource?.id ?? '') {
    if (!token || !selectedProject || !resourceId) {
      return;
    }

    const resourceToDelete = selectedProject.resources.find((resource) => resource.id === resourceId);
    if (!resourceToDelete) {
      return;
    }

    if (!window.confirm(`Delete this ${titleCase(resourceToDelete.resourceType).toLowerCase()} resource?`)) {
      return;
    }

    setResourceDeleting(true);
    setGlobalError('');
    setNotice('');

    try {
      await apiRequest<void>(
        `/api/v1/projects/${selectedProject.id}/resources/${resourceId}`,
        { method: 'DELETE' },
        token,
      );

      const remainingResources = selectedProject.resources.filter((resource) => resource.id !== resourceId);
      setProjects((current) =>
        current.map((project) =>
          project.id === selectedProject.id
            ? {
                ...project,
                resources: project.resources.filter((resource) => resource.id !== resourceId),
              }
            : project,
        ),
      );
      setSelectedResourceId(remainingResources[0]?.id ?? '');
      setNotice('Resource deleted successfully.');
      await refreshDashboard(token, email, true, true);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Unable to delete resource');
    } finally {
      setResourceDeleting(false);
    }
  }

  if (!token) {
    return (
      <div className="app-shell auth-shell">
        <section className="hero-panel">
          <p className="eyebrow">Budget platform</p>
          <h1>Budget Watch</h1>
          <p className="hero-copy">
            Helps you monitor and estimate resource costs, analyze coverage, and react
            instantly when spending goes beyond your limits.
          </p>
          <div className="hero-highlights">
            <article className="hero-highlight hero-highlight-primary">
              <span className="hero-highlight-label">Live control</span>
              <strong>Track projects, resources, and forecast pressure in one place.</strong>
              <p>Stay ahead of cost overruns with a workspace designed for daily decisions.</p>
            </article>
            <div className="hero-stat-grid">
              <article className="hero-stat-card">
                <BriefcaseBusiness size={18} />
                <div>
                  <strong>Projects</strong>
                  <span>Organize budgets by initiative and cloud provider.</span>
                </div>
              </article>
              <article className="hero-stat-card">
                <Database size={18} />
                <div>
                  <strong>Resources</strong>
                  <span>Model compute, storage, and network costs clearly.</span>
                </div>
              </article>
              <article className="hero-stat-card">
                <AlertTriangle size={18} />
                <div>
                  <strong>Alerts</strong>
                  <span>Spot critical spend early and react before it escalates.</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-head">
            <p className="eyebrow">Welcome back</p>
            <h2>{authMode === 'login' ? 'Access your workspace' : 'Create your workspace'}</h2>
            <p className="subtle">
              {authMode === 'login'
                ? 'Sign in to review your portfolio, forecasts, and alerts.'
                : 'Register to start tracking budgets, resources, and cost exposure.'}
            </p>
          </div>
          <div className="auth-toggle">
            <button
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
              type="button"
            >
              Sign In
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthMode('register')}
              type="button"
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div>
              <label>Email</label>
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="owner@company.com"
                type="email"
                value={email}
                required
              />
            </div>

            {authMode === 'register' ? (
              <div>
                <label>Full name</label>
                <input
                  autoComplete="name"
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Ada Lovelace"
                  value={fullName}
                  required
                />
              </div>
            ) : null}

            <div>
              <label>Password</label>
              <input
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                type="password"
                value={password}
                required
              />
            </div>

            {globalError ? <p className="message error">{globalError}</p> : null}
            {notice ? <p className="message success">{notice}</p> : null}
            {globalError ? (
              <p className="auth-helper">
                If this keeps happening, the backend may still be starting or the credentials may be invalid.
              </p>
            ) : null}

            <button className="primary-button" disabled={authLoading} type="submit">
              {authLoading ? 'Working...' : authMode === 'login' ? 'Open Dashboard' : 'Create Account'}
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>BudgetWatch Dashboard</h1>
        </div>

        <div className="topbar-actions">
          <div className="identity-pill">
            <Mail size={16} />
            <span>{email}</span>
          </div>
          <button className="ghost-button" onClick={() => void refreshDashboard()} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="ghost-button" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </header>

      {globalError ? <p className="message error sticky">{globalError}</p> : null}
      {notice ? <p className="message success sticky">{notice}</p> : null}

      <section className="hero-summary">
        <article className="spotlight-card">
          <div className="spotlight-copy">
            <p className="eyebrow">Workspace overview</p>
            <h2>{selectedProject ? selectedProject.name : summary.criticalProjects > 0 ? 'Critical projects need action today' : 'Budget posture is stable'}</h2>
            <p>
              {selectedProject
                ? `${selectedProject.category} on ${selectedProject.cloudProvider} with ${selectedProject.resources.length} resources attached.`
                : summary.criticalProjects > 0
                  ? `${summary.criticalProjects} projects are forecasting above 120% of budget.`
                  : 'No project is currently in the critical forecast band.'}
            </p>
          </div>
          <div className="spotlight-actions">
            <button className="primary-button" disabled={coverageRefreshing} onClick={handleCoverageRefresh} type="button">
              <RefreshCw size={16} />
              {coverageRefreshing ? 'Calculating...' : 'Run Coverage Calculation'}
            </button>
          </div>
        </article>

        <div className="summary-grid">
          <MetricCard
            icon={<BriefcaseBusiness size={18} />}
            label="Projects"
            value={String(summary.totalProjects)}
            note={`${summary.activeProjects} active`}
            onClick={() => focusProject(selectedProjectId || (projects[0]?.id ?? ''))}
          />
          <MetricCard
            icon={<Database size={18} />}
            label="Resources"
            value={String(summary.totalResources)}
            note={selectedProjectResources.length > 0 ? 'Open selected project inventory' : 'Open project resources'}
            onClick={() => {
              const projectWithResources = selectedProject?.resources.length ? selectedProject : projects.find((project) => project.resources.length > 0) ?? projects[0];
              if (projectWithResources) {
                focusProject(projectWithResources.id, true);
              }
            }}
          />
          <MetricCard icon={<Gauge size={18} />} label="Forecast" value={shortMoney(summary.forecast)} note={`MTD ${shortMoney(summary.monthToDate)}`} />
          <MetricCard icon={<AlertTriangle size={18} />} label="Unread Alerts" value={String(summary.unreadAlerts)} note={`${summary.criticalProjects} critical projects`} />
        </div>
      </section>

      <section className="details-grid">
        <article className="panel project-browser-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Project workspace</p>
              <h3>Select a project</h3>
            </div>
            <span className="subtle">{projects.length} total</span>
          </div>

          {projects.length > 0 ? (
            <div className="project-picker-list">
              {projects.map((project) => (
                <button
                  className={`project-picker ${selectedProjectId === project.id ? 'is-active' : ''}`}
                  key={project.id}
                  onClick={() => focusProject(project.id)}
                  type="button"
                >
                  <div className="project-picker-copy">
                    <strong>{project.name}</strong>
                    <span>{project.category} - {project.cloudProvider}</span>
                  </div>
                  <div className="project-picker-meta">
                    <span className={`status-pill ${statusTone[project.status]}`}>{titleCase(project.status)}</span>
                    <span className="subtle">{project.resources.length} resources</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">Create a project below to start managing your portfolio.</div>
          )}
        </article>

        <article className="panel detail-panel" ref={detailPanelRef}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Project management</p>
              <h3>{selectedProject ? selectedProject.name : 'Select a project'}</h3>
              {selectedProject ? <p className="subtle management-hint">Update project details here, then use the resource editor for the selected resource.</p> : null}
            </div>
            {selectedProject ? (
              <div className="status-editor">
                <select
                  className="field status-select"
                  onChange={(event) => setProjectStatusDraft(event.target.value as ProjectStatus)}
                  value={projectStatusDraft}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <button className="ghost-button" disabled={statusSaving || projectStatusDraft === selectedProject.status} onClick={() => void handleProjectStatusUpdate()} type="button">
                  {statusSaving ? 'Saving...' : 'Update status'}
                </button>
              </div>
            ) : null}
          </div>

          {selectedProject ? (
            <div className="detail-grid">
              <form className="detail-form-shell" onSubmit={handleProjectUpdate}>
                <div className="detail-summary">
                  <div className="detail-card">
                    <span className="metric-label">Owner</span>
                    <strong>{selectedProject.ownerEmail}</strong>
                  </div>
                  <div className="detail-card">
                    <span className="metric-label">Created</span>
                    <strong>{formatDateTime(selectedProject.createdAt)}</strong>
                  </div>
                  <div className="detail-card">
                    <span className="metric-label">Status</span>
                    <strong className={`status-pill ${statusTone[selectedProject.status]}`}>{titleCase(selectedProject.status)}</strong>
                  </div>
                </div>

                <div className="field-grid">
                  <label>
                    <span>Project name</span>
                    <input
                      className="field"
                      onChange={(event) => setProjectEditDraft((current) => ({ ...current, name: event.target.value }))}
                      required
                      value={projectEditDraft.name}
                    />
                  </label>
                  <label>
                    <span>Category</span>
                    <input
                      className="field"
                      onChange={(event) => setProjectEditDraft((current) => ({ ...current, category: event.target.value }))}
                      required
                      value={projectEditDraft.category}
                    />
                  </label>
                  <label>
                    <span>Cloud provider</span>
                    <select
                      className="field"
                      onChange={(event) => setProjectEditDraft((current) => ({ ...current, cloudProvider: event.target.value }))}
                      value={projectEditDraft.cloudProvider}
                    >
                      <option value="Azure">Azure</option>
                      <option value="AWS">AWS</option>
                      <option value="GCP">GCP</option>
                    </select>
                  </label>
                  <label>
                    <span>Monthly budget</span>
                    <input
                      className="field"
                      min="0"
                      onChange={(event) => setProjectEditDraft((current) => ({ ...current, monthlyBudget: event.target.value }))}
                      required
                      step="0.01"
                      type="number"
                      value={projectEditDraft.monthlyBudget}
                    />
                  </label>
                  <label>
                    <span>Annual budget</span>
                    <input
                      className="field"
                      min="0"
                      onChange={(event) => setProjectEditDraft((current) => ({ ...current, annualBudget: event.target.value }))}
                      step="0.01"
                      type="number"
                      value={projectEditDraft.annualBudget}
                    />
                  </label>
                </div>

                <label>
                  <span>Description</span>
                  <textarea
                    className="field textarea"
                    onChange={(event) => setProjectEditDraft((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                    value={projectEditDraft.description}
                  />
                </label>

                <div className="detail-actions">
                  <button className="primary-button" disabled={projectUpdating} type="submit">
                    {projectUpdating ? 'Saving...' : 'Save Project'}
                  </button>
                  <button className="ghost-button danger-button" disabled={projectDeleting} onClick={() => void handleProjectDelete()} type="button">
                    {projectDeleting ? 'Deleting...' : 'Delete Project'}
                  </button>
                </div>
              </form>

              <div className="detail-columns">
                <div className="resource-browser">
                  <div className="resource-browser-header">
                    <h4>Resources</h4>
                    <span className="subtle">Click a row to manage it</span>
                  </div>
                  {selectedProject.resources.length > 0 ? (
                    <div className="resource-list">
                      {selectedProject.resources.map((resource) => (
                        <article className={`resource-item ${selectedResource?.id === resource.id ? 'is-active' : ''}`} key={resource.id}>
                          <button className="resource-main-button" onClick={() => focusResource(selectedProject.id, resource.id)} type="button">
                            <div>
                              <strong>{titleCase(resource.resourceType)}</strong>
                              <span>{resource.vmSku || resource.storageTier || 'Configuration available'}</span>
                            </div>
                            <span className="subtle">{resource.active ? 'Active' : 'Inactive'}</span>
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state compact">Add a resource to inspect its details here.</div>
                  )}
                </div>

                <div className="resource-detail">
                  <div className="resource-browser-header">
                    <h4>{selectedResource ? 'Resource editor' : 'Selected resource'}</h4>
                    {selectedResource ? <span className="subtle">{selectedResource.id}</span> : null}
                  </div>
                  {selectedResource ? (
                    <form className="stack-form detail-form-shell" onSubmit={handleResourceUpdate}>
                      <div className="field-grid">
                        <label>
                          <span>Resource type</span>
                          <select
                            className="field"
                            onChange={(event) => setResourceEditDraft((current) => ({ ...current, resourceType: event.target.value as ResourceType }))}
                            value={resourceEditDraft.resourceType}
                          >
                            <option value="COMPUTE">Compute</option>
                            <option value="STORAGE">Storage</option>
                            <option value="NETWORK">Network</option>
                          </select>
                        </label>
                        <div className="detail-card resource-state-card">
                          <span className="metric-label">State</span>
                          <strong>{selectedResource.active ? 'Active' : 'Inactive'}</strong>
                        </div>
                      </div>

                      {resourceEditDraft.resourceType === 'COMPUTE' ? (
                        <div className="field-grid">
                          <label>
                            <span>VM SKU</span>
                            <input
                              className="field"
                              onChange={(event) => setResourceEditDraft((current) => ({ ...current, vmSku: event.target.value }))}
                              value={resourceEditDraft.vmSku}
                            />
                          </label>
                          <label>
                            <span>vCPU</span>
                            <input
                              className="field"
                              min="1"
                              onChange={(event) => setResourceEditDraft((current) => ({ ...current, vcpu: event.target.value }))}
                              type="number"
                              value={resourceEditDraft.vcpu}
                            />
                          </label>
                          <label>
                            <span>RAM (GB)</span>
                            <input
                              className="field"
                              min="1"
                              onChange={(event) => setResourceEditDraft((current) => ({ ...current, ramGb: event.target.value }))}
                              type="number"
                              value={resourceEditDraft.ramGb}
                            />
                          </label>
                          <label>
                            <span>Usage pattern</span>
                            <select
                              className="field"
                              onChange={(event) =>
                                setResourceEditDraft((current) => ({
                                  ...current,
                                  computeUsagePattern: event.target.value as ComputeUsagePattern,
                                }))
                              }
                              value={resourceEditDraft.computeUsagePattern}
                            >
                              <option value="ALWAYS_ON">Always on</option>
                              <option value="BUSINESS_HOURS">Business hours</option>
                              <option value="CUSTOM">Custom hours</option>
                            </select>
                          </label>
                          {resourceEditDraft.computeUsagePattern === 'CUSTOM' ? (
                            <label>
                              <span>Hours per month</span>
                              <input
                                className="field"
                                min="1"
                                onChange={(event) => setResourceEditDraft((current) => ({ ...current, customHoursPerMonth: event.target.value }))}
                                type="number"
                                value={resourceEditDraft.customHoursPerMonth}
                              />
                            </label>
                          ) : null}
                        </div>
                      ) : null}

                      {resourceEditDraft.resourceType === 'STORAGE' ? (
                        <div className="field-grid">
                          <label>
                            <span>Storage tier</span>
                            <input
                              className="field"
                              onChange={(event) => setResourceEditDraft((current) => ({ ...current, storageTier: event.target.value }))}
                              value={resourceEditDraft.storageTier}
                            />
                          </label>
                          <label>
                            <span>Storage (GB)</span>
                            <input
                              className="field"
                              min="1"
                              onChange={(event) => setResourceEditDraft((current) => ({ ...current, storageGb: event.target.value }))}
                              type="number"
                              value={resourceEditDraft.storageGb}
                            />
                          </label>
                        </div>
                      ) : null}

                      {resourceEditDraft.resourceType === 'NETWORK' ? (
                        <div className="field-grid">
                          <label>
                            <span>Monthly egress (GB)</span>
                            <input
                              className="field"
                              min="0"
                              onChange={(event) => setResourceEditDraft((current) => ({ ...current, monthlyEgressGb: event.target.value }))}
                              type="number"
                              value={resourceEditDraft.monthlyEgressGb}
                            />
                          </label>
                        </div>
                      ) : null}

                      <label className="toggle-row">
                        <input
                          checked={resourceEditDraft.active}
                          onChange={(event) => setResourceEditDraft((current) => ({ ...current, active: event.target.checked }))}
                          type="checkbox"
                        />
                        <span>Resource is active</span>
                      </label>

                      <div className="detail-actions">
                        <button className="primary-button" disabled={resourceUpdating} type="submit">
                          {resourceUpdating ? 'Saving...' : 'Save Resource'}
                        </button>
                        <button className="ghost-button danger-button" disabled={resourceDeleting} onClick={() => void handleResourceDelete()} type="button">
                          {resourceDeleting ? 'Deleting...' : 'Delete Resource'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="empty-state compact">Select a resource to inspect its details.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state compact">Create or select a project to inspect it here.</div>
          )}
        </article>
      </section>

      <section className="content-grid">
        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Coverage trend</p>
              <h3>{selectedProject ? selectedProject.name : 'Project history'}</h3>
            </div>
            <select className="field" onChange={(event) => setSelectedProjectId(event.target.value)} value={selectedProjectId}>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="chart-wrap">
            {selectedHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...selectedHistory].reverse()}>
                  <defs>
                    <linearGradient id="forecastFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#ff7f50" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#ff7f50" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="budgetFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#4adede" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4adede" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="snapshotDate" stroke="#7f96a8" tickFormatter={formatDate} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7f96a8" tickFormatter={(value: number) => shortMoney(value)} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#102231', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}
                    formatter={(value: number) => money(value)}
                    labelFormatter={(label) => formatDate(String(label))}
                  />
                  <Area dataKey="forecastCost" fill="url(#forecastFill)" stroke="#ff7f50" strokeWidth={3} />
                  <Area dataKey="monthlyBudget" fill="url(#budgetFill)" stroke="#4adede" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">Run coverage to start building project history.</div>
            )}
          </div>
        </article>

        <article className="panel side-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Alerts inbox</p>
              <h3>{alerts.length} records</h3>
            </div>
            <span className="subtle">Filtered by your email</span>
          </div>

          <div className="alert-list">
            {alerts.length === 0 ? (
              <div className="empty-state">No alerts yet. Trigger a coverage run to populate notifications.</div>
            ) : (
              alerts.map((alert) => (
                <article className={`alert-card ${alert.status === 'READ' ? 'is-read' : ''}`} key={alert.id}>
                  <div className="alert-meta">
                    <span className="badge" style={{ borderColor: `${severityColor[alert.severity]}55`, color: severityColor[alert.severity] }}>
                      {alert.severity}
                    </span>
                    <span className="subtle">{formatDateTime(alert.createdAt)}</span>
                  </div>
                  <h4>{alert.projectName}</h4>
                  <p>{normalizeMessage(alert.message)}</p>
                  <div className="alert-footer">
                    <span>{Math.round(alert.usagePercentage)}% used</span>
                    <span className="subtle">{titleCase(alert.status)}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="lower-grid">
        <article className="panel table-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Project service</p>
              <h3>Portfolio and forecast status</h3>
              <p className="subtle management-hint">Click any project name or resource count to jump into its management workspace above.</p>
            </div>
            <span className="subtle">{dashboardLoading ? 'Syncing...' : ''}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Provider</th>
                  <th>Resources</th>
                  <th>Budget</th>
                  <th>Forecast</th>
                  <th>Usage</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {projectRows.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <button className="text-button" onClick={() => focusProject(project.id)} type="button">
                        <strong>{project.name}</strong>
                      </button>
                      <span>{project.category}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${statusTone[project.status]}`}>{titleCase(project.status)}</span>
                    </td>
                    <td>{project.cloudProvider}</td>
                    <td>
                      <button className="text-button" onClick={() => focusProject(project.id, true)} type="button">
                        {project.resources.length}
                      </button>
                    </td>
                    <td>{money(project.monthlyBudget)}</td>
                    <td>{project.latestCoverage ? money(project.latestCoverage.forecastCost) : 'No data'}</td>
                    <td>
                      {project.latestCoverage ? (
                        <div className="usage-cell">
                          <div className="usage-track">
                            <div
                              className="usage-fill"
                              style={{
                                width: `${Math.min(project.latestCoverage.budgetUsagePercentage, 100)}%`,
                                background: severityColor[project.latestCoverage.severity],
                              }}
                            />
                          </div>
                          <span>{Math.round(project.latestCoverage.budgetUsagePercentage)}%</span>
                        </div>
                      ) : (
                        'Awaiting run'
                      )}
                    </td>
                    <td>
                      {project.latestCoverage ? (
                        <span className="badge" style={{ borderColor: `${severityColor[project.latestCoverage.severity]}55`, color: severityColor[project.latestCoverage.severity] }}>
                          {project.latestCoverage.severity}
                        </span>
                      ) : (
                        <span className="subtle">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel analytics-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Portfolio distribution</p>
            </div>
          </div>

          <div className="mini-analytics">
            <div className="mini-card">
              <h4>Cloud providers</h4>
              <div className="mini-chart">
                {providerBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={providerBreakdown} cx="50%" cy="50%" dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={4}>
                        {providerBreakdown.map((entry, index) => (
                          <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state compact">Create projects to see provider spread.</div>
                )}
              </div>
              <div className="legend-list">
                {providerBreakdown.map((entry, index) => (
                  <div className="legend-row" key={entry.name}>
                    <span className="legend-dot" style={{ background: chartPalette[index % chartPalette.length] }} />
                    <span>{entry.name}</span>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="mini-card">
              <h4>Project status</h4>
              <div className="mini-chart">
                {projectStatusBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={projectStatusBreakdown} cx="50%" cy="50%" dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={4}>
                        {projectStatusBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state compact">Create projects to see status distribution.</div>
                )}
              </div>
              <div className="legend-list">
                {projectStatusBreakdown.map((entry) => (
                  <div className="legend-row" key={entry.name}>
                    <span className="legend-dot" style={{ background: entry.color }} />
                    <span>{entry.name}</span>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="forms-grid">
        <article className="panel form-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Create project</p>
              <h3>Register a new budget owner workload</h3>
            </div>
            <PlusCircle size={18} />
          </div>

          <form className="stack-form" onSubmit={handleProjectSubmit}>
            <div className="field-grid">
              <label>
                <span>Name</span>
                <input className="field" onChange={(event) => setProjectDraft((current) => ({ ...current, name: event.target.value }))} value={projectDraft.name} required />
              </label>
              <label>
                <span>Category</span>
                <input className="field" onChange={(event) => setProjectDraft((current) => ({ ...current, category: event.target.value }))} placeholder="FinOps, Data, Platform" value={projectDraft.category} required />
              </label>
              <label>
                <span>Cloud provider</span>
                <select className="field" onChange={(event) => setProjectDraft((current) => ({ ...current, cloudProvider: event.target.value }))} value={projectDraft.cloudProvider}>
                  <option value="Azure">Azure</option>
                  <option value="AWS">AWS</option>
                  <option value="GCP">GCP</option>
                </select>
              </label>
              <label>
                <span>Monthly budget</span>
                <input className="field" min="0" onChange={(event) => setProjectDraft((current) => ({ ...current, monthlyBudget: event.target.value }))} step="0.01" type="number" value={projectDraft.monthlyBudget} required />
              </label>
              <label>
                <span>Annual budget</span>
                <input className="field" min="0" onChange={(event) => setProjectDraft((current) => ({ ...current, annualBudget: event.target.value }))} step="0.01" type="number" value={projectDraft.annualBudget} />
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea className="field textarea" onChange={(event) => setProjectDraft((current) => ({ ...current, description: event.target.value }))} rows={4} value={projectDraft.description} />
            </label>

            <button className="primary-button" disabled={projectSaving} type="submit">
              {projectSaving ? 'Saving...' : 'Create Project'}
            </button>
          </form>
        </article>

        <article className="panel form-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Attach resource</p>
              <h3>Feed the coverage engine with real inventory</h3>
            </div>
            <Database size={18} />
          </div>

          <form className="stack-form" onSubmit={handleResourceSubmit}>
            <div className="field-grid">
              <label>
                <span>Project</span>
                <select className="field" onChange={(event) => setResourceDraft((current) => ({ ...current, projectId: event.target.value }))} value={resourceDraft.projectId} required>
                  <option value="" disabled>
                    Select project
                  </option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Resource type</span>
                <select className="field" onChange={(event) => setResourceDraft((current) => ({ ...current, resourceType: event.target.value as ResourceType }))} value={resourceDraft.resourceType}>
                  <option value="COMPUTE">Compute</option>
                  <option value="STORAGE">Storage</option>
                  <option value="NETWORK">Network</option>
                </select>
              </label>
            </div>

            {resourceDraft.resourceType === 'COMPUTE' ? (
              <div className="field-grid">
                <label>
                  <span>VM SKU</span>
                  <input className="field" onChange={(event) => setResourceDraft((current) => ({ ...current, vmSku: event.target.value }))} placeholder="Standard_D4s_v5" value={resourceDraft.vmSku} />
                </label>
                <label>
                  <span>vCPU</span>
                  <input className="field" min="1" onChange={(event) => setResourceDraft((current) => ({ ...current, vcpu: event.target.value }))} type="number" value={resourceDraft.vcpu} />
                </label>
                <label>
                  <span>RAM (GB)</span>
                  <input className="field" min="1" onChange={(event) => setResourceDraft((current) => ({ ...current, ramGb: event.target.value }))} type="number" value={resourceDraft.ramGb} />
                </label>
                <label>
                  <span>Usage pattern</span>
                  <select className="field" onChange={(event) => setResourceDraft((current) => ({ ...current, computeUsagePattern: event.target.value as ComputeUsagePattern }))} value={resourceDraft.computeUsagePattern}>
                    <option value="ALWAYS_ON">Always on</option>
                    <option value="BUSINESS_HOURS">Business hours</option>
                    <option value="CUSTOM">Custom hours</option>
                  </select>
                </label>
                {resourceDraft.computeUsagePattern === 'CUSTOM' ? (
                  <label>
                    <span>Hours per month</span>
                    <input className="field" min="1" onChange={(event) => setResourceDraft((current) => ({ ...current, customHoursPerMonth: event.target.value }))} type="number" value={resourceDraft.customHoursPerMonth} />
                  </label>
                ) : null}
              </div>
            ) : null}

            {resourceDraft.resourceType === 'STORAGE' ? (
              <div className="field-grid">
                <label>
                  <span>Storage tier</span>
                  <input className="field" onChange={(event) => setResourceDraft((current) => ({ ...current, storageTier: event.target.value }))} placeholder="Hot, StandardSSD" value={resourceDraft.storageTier} />
                </label>
                <label>
                  <span>Storage (GB)</span>
                  <input className="field" min="1" onChange={(event) => setResourceDraft((current) => ({ ...current, storageGb: event.target.value }))} type="number" value={resourceDraft.storageGb} />
                </label>
              </div>
            ) : null}

            {resourceDraft.resourceType === 'NETWORK' ? (
              <div className="field-grid">
                <label>
                  <span>Monthly egress (GB)</span>
                  <input className="field" min="0" onChange={(event) => setResourceDraft((current) => ({ ...current, monthlyEgressGb: event.target.value }))} type="number" value={resourceDraft.monthlyEgressGb} />
                </label>
              </div>
            ) : null}

            <label className="toggle-row">
              <input checked={resourceDraft.active} onChange={(event) => setResourceDraft((current) => ({ ...current, active: event.target.checked }))} type="checkbox" />
              <span>Resource is active</span>
            </label>

            <button className="primary-button" disabled={resourceSaving || projects.length === 0} type="submit">
              {resourceSaving ? 'Saving...' : 'Add Resource'}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  note,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="metric-icon">{icon}</div>
      <div>
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
        <p className="metric-note">{note}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button className="metric-card metric-card-button" onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <article className="metric-card">{content}</article>;
}
