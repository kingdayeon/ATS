import { useParams } from "react-router-dom";
import { jobDetailData } from "@/data/mockJobs";
import type { Job } from "@/types";

export const useJob = (): Job => {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id || "1");
  return jobDetailData[jobId] || jobDetailData[1];
}; 