export function scoreColor(score: number): "red" | "amber" | "green" {
  if (score < 40) return "red";
  if (score <= 70) return "amber";
  return "green";
}

export function daysSilent(lastContact: string | null): number | null {
  if (!lastContact) return null;
  return Math.floor((Date.now() - new Date(lastContact).getTime()) / 86400000);
}
