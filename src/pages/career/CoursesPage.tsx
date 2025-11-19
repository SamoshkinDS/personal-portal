import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { careerApi } from "../../api/career.js";
import CoursesFilters from "./components/CoursesFilters.tsx";
import CourseCard from "./components/CourseCard.tsx";
import CourseModal from "./components/CourseModal.tsx";
import CourseCertificateModal from "./components/CourseCertificateModal.tsx";

const DEFAULT_FILTERS = {
  statuses: [],
  platform: "",
  periodMonths: 0,
  search: "",
};

export default function CoursesPage() {
  const [courses, setCourses] = React.useState([]);
  const [skills, setSkills] = React.useState([]);
  const [filters, setFilters] = React.useState({ ...DEFAULT_FILTERS });
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = React.useState(false);
  const [certificateCourse, setCertificateCourse] = React.useState(null);
  const [certificateSaving, setCertificateSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [coursesList, skillsList] = await Promise.all([careerApi.listCourses(), careerApi.listSkills()]);
      setCourses(coursesList);
      setSkills(skillsList);
    } catch (error) {
      toast.error(error?.message || "Не удалось загрузить курсы");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const platformOptions = React.useMemo(() => {
    const set = new Set();
    courses.forEach((course) => {
      if (course.platform) set.add(course.platform);
    });
    return Array.from(set);
  }, [courses]);

  const filteredCourses = React.useMemo(() => {
    const statusFilters = filters.statuses || [];
    const now = new Date();
    const periodThreshold = filters.periodMonths
      ? new Date(now.getFullYear(), now.getMonth() - filters.periodMonths, now.getDate())
      : null;

    return courses.filter((course) => {
      const matchesStatus = statusFilters.length ? statusFilters.includes(course.status) : true;
      const matchesPlatform = filters.platform
        ? course.platform?.toLowerCase() === filters.platform.toLowerCase()
        : true;
      const matchesSearch = filters.search
        ? `${course.title || ""} ${course.platform || ""}`.toLowerCase().includes(filters.search.trim().toLowerCase())
        : true;
      const matchesPeriod = periodThreshold
        ? (() => {
            const targetDate = course.startDate ? new Date(course.startDate) : course.completionDate ? new Date(course.completionDate) : null;
            if (!targetDate || Number.isNaN(targetDate.getTime())) return true;
            return targetDate >= periodThreshold;
          })()
        : true;
      return matchesStatus && matchesPlatform && matchesSearch && matchesPeriod;
    });
  }, [courses, filters]);

  const skillsMap = React.useMemo(() => {
    const map = new Map();
    skills.forEach((skill) => map.set(skill.id, skill));
    return map;
  }, [skills]);

  const openModal = (course = null) => {
    setEditingCourse(course);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCourse(null);
  };

  const handleSaveCourse = async (payload) => {
    try {
      setSaving(true);
      if (editingCourse) {
        await careerApi.updateCourse(editingCourse.id, payload);
        toast.success("Курс сохранён");
      } else {
        await careerApi.createCourse(payload);
        toast.success("Курс добавлен");
      }
      closeModal();
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Не удалось сохранить курс");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Удалить курс "${course.title}"?`)) return;
    try {
      setSaving(true);
      await careerApi.deleteCourse(course.id);
      toast.success("Курс удалён");
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Не удалось удалить курс");
    } finally {
      setSaving(false);
    }
  };

  const openCertificateModal = (course) => {
    setCertificateCourse(course);
    setCertificateModalOpen(true);
  };

  const closeCertificateModal = () => {
    setCertificateModalOpen(false);
    setCertificateCourse(null);
  };

  const handleCertificateSave = async (payload) => {
    if (!certificateCourse) return;
    try {
      setCertificateSaving(true);
      await careerApi.uploadCourseCertificate(certificateCourse.id, payload);
      toast.success("Сертификат обновлён");
      closeCertificateModal();
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Не удалось сохранить сертификат");
    } finally {
      setCertificateSaving(false);
    }
  };

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  return (
    <PageShell title="Курсы">
      <div className="space-y-6">
        <CoursesFilters filters={filters} platforms={platformOptions} onChange={setFilters} disabled={loading} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">
              Отображается {filteredCourses.length} из {courses.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Фильтры: {filters.statuses?.length ? filters.statuses.join(', ') : 'все'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openModal(null)}
              className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200"
            >
              + Добавить курс
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/30"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>

        <div className={`grid gap-4 ${filteredCourses.length ? "md:grid-cols-2 lg:grid-cols-3" : ""}`}>
          {loading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-slate-900/60"
              >
                <div className="h-4 w-48 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
                <div className="mt-3 h-3 w-32 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
                <div className="mt-3 h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
              </div>
            ))}
          {!loading && filteredCourses.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300/70 bg-white/80 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
              Курсы не найдены
            </div>
          )}
          {!loading && filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              skillsMap={skillsMap}
              onEdit={openModal}
              onDelete={handleDeleteCourse}
              onCertificate={openCertificateModal}
              disabled={saving || certificateSaving}
            />
          ))}
        </div>
      </div>

      <CourseModal
        open={modalOpen}
        course={editingCourse}
        skills={skills}
        onClose={closeModal}
        onSave={handleSaveCourse}
        saving={saving}
      />
      <CourseCertificateModal
        open={certificateModalOpen}
        course={certificateCourse}
        onClose={closeCertificateModal}
        onSave={handleCertificateSave}
        saving={certificateSaving}
      />
    </PageShell>
  );
}
