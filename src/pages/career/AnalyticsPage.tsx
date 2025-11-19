import React from "react";
import PageShell from "../../components/PageShell.jsx";
import { careerApi } from "../../api/career.js";
import GeneralMetrics from "./sections/General/GeneralMetrics.tsx";
import SkillsAnalyticsSection from "./sections/Skills/SkillsAnalyticsSection.tsx";
import CoursesAnalyticsSection from "./sections/Courses/CoursesAnalyticsSection.tsx";
import PortfolioAnalyticsSection from "./sections/Portfolio/PortfolioAnalyticsSection.tsx";
import InterviewsAnalyticsSection from "./sections/Interviews/InterviewsAnalyticsSection.tsx";

export default function AnalyticsPage() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const payload = await careerApi.getCareerAnalytics();
        setData(payload);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (error) {
    return (
      <PageShell title="Аналитика">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          Данные временно недоступны
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Аналитический центр">
      <div className="space-y-6">
        <GeneralMetrics metrics={data?.metrics} />
        <SkillsAnalyticsSection data={data?.skills} />
        <CoursesAnalyticsSection data={data?.courses} />
        <PortfolioAnalyticsSection data={data?.portfolio} />
        <InterviewsAnalyticsSection data={data?.interviews} />
      </div>
    </PageShell>
  );
}
