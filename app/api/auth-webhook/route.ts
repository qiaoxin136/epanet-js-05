/**
 * Legacy auth webhook endpoint — kept for reference.
 * New Cognito post-confirmation events are handled by /api/cognito-trigger.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ status: "deprecated", message: "Use /api/cognito-trigger" });
}
