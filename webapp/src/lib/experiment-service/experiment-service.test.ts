import { describe, expect, it } from "vitest";
import { getOrCreateExperimentAssignment } from "@/lib/experiment-service";

describe("experiment service", () => {
  it("returns a valid assignment shape", () => {
    const assignment = getOrCreateExperimentAssignment();
    expect(["compact", "guide_first"]).toContain(assignment.layoutVariant);
    expect(["standard", "coach"]).toContain(assignment.rewardPromptVariant);
  });
});
