import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getJobById } from "@/services/api";
import type { Job, CompanyType, ExperienceLevel, JobType } from "@/types";

export const useJob = (): Job => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);

  // 기본 job 데이터 (로딩 중일 때 표시)
  const defaultJob: Job = {
    id: 1,
    title: "Loading...",
    company: "무신사" as CompanyType,
    department: "개발",
    experience: "경력 3년 이상" as ExperienceLevel,
    type: "정규직" as JobType,
    location: "서울",
    description: "",
    teamIntro: "",
    responsibilities: [],
    requirements: ""
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const jobId = parseInt(id || "1");
        const jobData = await getJobById(jobId);
        if (jobData) {
          setJob(jobData);
        }
      } catch (error) {
        console.error("Failed to fetch job:", error);
      }
    };

    fetchJob();
  }, [id]);

  return job || defaultJob;
}; 