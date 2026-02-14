import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { careerApi } from "../../api/career.js";
import DashboardMetrics from "./components/DashboardMetrics.tsx";
import SkillRadar from "./components/SkillRadar.tsx";
import CourseProgressPie from "./components/CourseProgressPie.tsx";
import RecentActivity from "./components/RecentActivity.tsx";
import QuickActions from "./components/QuickActions.tsx";

const ACTION_ROUTES = {
  skill: "/career/skills",
  course: "/career/courses",
  project: "/career/portfolio",
  interview: "/career/interviews",
};

export default function CareerDashboard() {
  const [dashboard, setDashboard] = React.useState(null);
  const [activity, setActivity] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardData, activityData] = await Promise.all([
        careerApi.getDashboard(),
        careerApi.getDashboardActivity(),
      ]);
      setDashboard(dashboardData);
      setActivity(activityData?.activities || []);
    } catch (error) {
      toast.error(error?.message || "Не удалось загрузить панель");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuickAction = React.useCallback(
    (type) => {
      const route = ACTION_ROUTES[type];
      if (route) {
        navigate(route, { state: { disableRouteTransition: true } });
      } else {
        toast.error("Неизвестное действие");
      }
    },
    [navigate]
  );

  const metrics = dashboard?.metrics;
  const radar = dashboard?.radar || dashboard?.skills_radar || [];
  const coursesStatus = dashboard?.courseStatus || dashboard?.courses_status || {};
  const courseProgress = {
    planned: Number(coursesStatus.planned || 0),
    inProgress: Number(coursesStatus.in_progress || coursesStatus.inProgress || 0),
    completed: Number(coursesStatus.completed || 0),
    abandoned: Number(coursesStatus.abandoned || 0),
  };

  return (
    <PageShell title="Карьера">
      <div className="space-y-6">
        <QuickActions onAction={handleQuickAction} disabled={loading} />
        <DashboardMetrics metrics={metrics} loading={loading} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SkillRadar data={radar} loading={loading} />
          </div>
          <div className="lg:col-span-1">
            <CourseProgressPie data={courseProgress} loading={loading} />
          </div>
        </div>
        <RecentActivity items={activity} loading={loading} />
      </div>
    </PageShell>
  );
}
