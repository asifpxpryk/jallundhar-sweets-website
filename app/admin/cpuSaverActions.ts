"use server";

import { isAdminSession } from "@/lib/adminAuth";
import { writeCpuSaver, type CpuSaver } from "@/lib/cpuSaver";

export async function setCpuSaver(on: boolean): Promise<{ saver?: CpuSaver; error?: string }> {
  if (!(await isAdminSession())) return { error: "Not allowed." };
  try {
    return { saver: await writeCpuSaver(on) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save." };
  }
}
