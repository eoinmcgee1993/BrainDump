function env(name) {
  return globalThis.Netlify?.env?.get?.(name) ?? process.env[name];
}

export async function executeMatching(trip) {
  const url = env("TRAVELOS_MATCHING_URL");
  const key = env("TRAVELOS_MATCHING_KEY");

  if (!url || !key) {
    const error = new Error("matching_provider_not_configured");
    error.code = "MATCHING_PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": "Bearer " + key
    },
    body: JSON.stringify({
      destination: trip.destination,
      duration_days: trip.duration_days,
      est_budget_gbp: trip.est_budget_gbp,
      travelers: trip.travelers,
      preferences: trip.preferences ?? null
    })
  });

  if (!response.ok) throw new Error("matching_provider_http_" + response.status);

  const data = await response.json();

  if (!data || typeof data !== "object" || !data.base_itinerary_template || !data.tier_multipliers) {
    throw new Error("matching_provider_invalid_response");
  }

  return data;
}