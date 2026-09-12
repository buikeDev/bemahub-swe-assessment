"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { StatusMessage } from "@/components/StatusMessage";
import { api } from "@/lib/api/client";
import { formatMoney, formatNullableNumber } from "@/lib/format";
import type { CourseListResponse } from "@/lib/types/api";

export default function CoursesPage() {
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async ({ signal }) => {
      const response = await api.get<CourseListResponse>("/courses", { signal });
      return response.data;
    },
    staleTime: (query) =>
      (query.state.data?.previewExpiresInSeconds ?? 0) * 1000,
    // staleTime alone does not schedule a request while the page stays open.
    refetchInterval: (query) =>
      query.state.data
        ? Math.max(1000, query.state.data.previewExpiresInSeconds * 1000)
        : false,
    refetchOnWindowFocus: true,
  });

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Courses</h2>

      {coursesQuery.isPending && <StatusMessage state="loading" />}

      {coursesQuery.isError && (
        <div className="space-y-3" role="alert">
          <StatusMessage
            state="error"
            message={
              axios.isAxiosError(coursesQuery.error) &&
              !coursesQuery.error.response
                ? "Cannot reach the course service. Check your connection and try again."
                : "Could not load courses. Please try again."
            }
          />
          <button
            type="button"
            className="rounded-md bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
            disabled={coursesQuery.isFetching}
            onClick={() => void coursesQuery.refetch()}
          >
            {coursesQuery.isFetching ? "Retrying…" : "Try again"}
          </button>
        </div>
      )}

      {coursesQuery.isSuccess && (
        <>
          {coursesQuery.isFetching && (
            <p role="status" className="text-sm text-slate-600">Refreshing courses…</p>
          )}
          {coursesQuery.data.courses.length === 0 ? (
            <StatusMessage state="empty" message="No courses are available yet." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {coursesQuery.data.courses.map((course) => (
                <li key={course.id} className="rounded-md border bg-white p-5">
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">By {course.instructorName}</p>
                  <p className="mt-4 font-semibold">
                    {formatMoney(course.priceMinor, course.currency)}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-slate-600">Enrolments</dt>
                      <dd>{formatNullableNumber(course.enrolmentCount)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">Average rating</dt>
                      <dd>{course.averageRating === null ? "No ratings yet" : String(course.averageRating)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
