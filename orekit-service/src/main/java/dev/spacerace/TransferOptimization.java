package dev.spacerace;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Searches a FIXED departure date across client-generated flight durations.
 * Each candidate is solved by Orekit's IodLambert under identical assumptions.
 *
 * This is a sampled optimum for zero-revolution, prograde, impulsive transfers;
 * not a guarantee of a globally minimum mission delta-v or an electric
 * low-thrust trajectory.
 */
public final class TransferOptimization {
    private TransferOptimization() {}

    /** JPL DE440 planetary system GM and equatorial reference radii in km. */
    public static final class Planet {
        public final double muKm3S2;
        public final double radiusKm;
        Planet(double muKm3S2, double radiusKm) {
            this.muKm3S2 = muKm3S2;
            this.radiusKm = radiusKm;
        }
    }

    private static final Map<String, Planet> PLANETS = Map.of(
        "earth", new Planet(398600.435507, 6378.1366),
        "venus", new Planet(324858.592000, 6051.8),
        "mars", new Planet(42828.375816, 3396.19),
        "jupiter", new Planet(126712764.100000, 71492.0)
    );

    public static final class Request {
        public String target = "mars";
        public String objective = "total";
        public double earthParkingAltitudeKm = 400;
        public double targetParkingAltitudeKm = 300;
        public List<TransferMath.Request> candidates;
    }

    public static final class CandidateScore {
        public double flightDays;
        public double departureDeltaVKmS;
        public double arrivalCaptureDeltaVKmS;
        public double totalDeltaVKmS;
        public double departureC3Km2S2;
        public double departureVInfinityKmS;
        public double arrivalVInfinityKmS;
        public double optimizedScoreKmS;
    }

    public static final class Result {
        public final String model = "Orekit sampled Lambert transfer search, impulsive patched-conic burns";
        public String target;
        public String objective;
        public double earthParkingAltitudeKm;
        public double targetParkingAltitudeKm;
        public int requestedCandidates;
        public int validCandidates;
        public int skippedCandidates;
        public CandidateScore best;
        public List<CandidateScore> ranked = new ArrayList<>();
        public TransferMath.Result bestTransfer;
        public final String[] limitations = {
            "Fixed departure date: only the sampled flight durations are optimized, not the launch date.",
            "Assumes zero-revolution prograde Sun-centered impulsive Lambert solutions and circular parking orbits.",
            "Idealized arrival circularization; excludes aerobraking, staging, gravity assists and plane changes.",
            "Actual departure from a launch site and finite-thrust ion/Hall trajectories are NOT modeled.",
            "JPL Table 1 approximate planetary states; not high-precision SPICE/Horizons flight ephemerides."
        };
    }

    /** Delta-v to/from a circular parking orbit at radius r, neglecting plane changes. */
    public static double circularToHyperbolicDeltaVKmS(
            double vInfinityKmS, double muKm3S2, double orbitRadiusKm) {
        if (!Double.isFinite(vInfinityKmS) || vInfinityKmS < 0 ||
                !Double.isFinite(muKm3S2) || muKm3S2 <= 0 ||
                !Double.isFinite(orbitRadiusKm) || orbitRadiusKm <= 0) {
            throw new IllegalArgumentException("Invalid patched-conic burn parameters");
        }
        return Math.sqrt(vInfinityKmS * vInfinityKmS + 2 * muKm3S2 / orbitRadiusKm)
                - Math.sqrt(muKm3S2 / orbitRadiusKm);
    }

    public static CandidateScore score(
            TransferMath.Result transfer, String objective,
            double earthParkingAltitudeKm, Planet target, double targetParkingAltitudeKm) {
        final Planet earth = PLANETS.get("earth");
        CandidateScore s = new CandidateScore();
        s.flightDays = transfer.flightDays;
        s.departureVInfinityKmS = transfer.departureVInfinityKmS;
        s.arrivalVInfinityKmS = transfer.arrivalVInfinityKmS;
        s.departureC3Km2S2 = transfer.departureC3Km2S2;
        s.departureDeltaVKmS = circularToHyperbolicDeltaVKmS(
                transfer.departureVInfinityKmS, earth.muKm3S2, earth.radiusKm + earthParkingAltitudeKm);
        s.arrivalCaptureDeltaVKmS = circularToHyperbolicDeltaVKmS(
                transfer.arrivalVInfinityKmS, target.muKm3S2, target.radiusKm + targetParkingAltitudeKm);
        s.totalDeltaVKmS = s.departureDeltaVKmS + s.arrivalCaptureDeltaVKmS;
        s.optimizedScoreKmS = "departure".equals(objective) ? s.departureDeltaVKmS : s.totalDeltaVKmS;
        return s;
    }

    public static Result optimize(Request request) {
        if (request == null || request.candidates == null || request.candidates.isEmpty() ||
                request.candidates.size() > 200) {
            throw new IllegalArgumentException("Optimization requires 1–200 candidate transfers");
        }
        Planet target = PLANETS.get(request.target);
        if (target == null || "earth".equals(request.target)) {
            throw new IllegalArgumentException("Choose Venus, Mars or Jupiter as the target");
        }
        if (!"departure".equals(request.objective) && !"total".equals(request.objective)) {
            throw new IllegalArgumentException("Objective must be 'departure' or 'total'");
        }
        if (!Double.isFinite(request.earthParkingAltitudeKm) ||
                request.earthParkingAltitudeKm < 160 || request.earthParkingAltitudeKm > 100000 ||
                !Double.isFinite(request.targetParkingAltitudeKm) ||
                request.targetParkingAltitudeKm < 150 || request.targetParkingAltitudeKm > 1000000) {
            throw new IllegalArgumentException("Unsupported parking orbit altitude(s)");
        }

        Result result = new Result();
        result.target = request.target;
        result.objective = request.objective;
        result.earthParkingAltitudeKm = request.earthParkingAltitudeKm;
        result.targetParkingAltitudeKm = request.targetParkingAltitudeKm;
        result.requestedCandidates = request.candidates.size();
        TransferMath.Request bestRequest = null;

        for (TransferMath.Request candidate : request.candidates) {
            try {
                if (candidate == null || !candidate.prograde) {
                    // The optimizer intentionally compares a single orbit family.
                    throw new IllegalArgumentException("Only prograde transfer candidates are supported");
                }
                // Do not propagate a full 160-point curve for every trial.
                int originalSamples = candidate.samples;
                candidate.samples = 8;
                TransferMath.Result solution;
                try {
                    solution = TransferMath.solve(candidate);
                } finally {
                    candidate.samples = originalSamples;
                }
                if (!Double.isFinite(solution.propagatedTargetErrorKm) ||
                        solution.propagatedTargetErrorKm > 1000) {
                    throw new IllegalArgumentException("Lambert arc failed endpoint propagation validation");
                }
                CandidateScore candidateScore = score(solution, request.objective,
                        request.earthParkingAltitudeKm, target, request.targetParkingAltitudeKm);
                if (!Double.isFinite(candidateScore.optimizedScoreKmS)) {
                    throw new IllegalArgumentException("Nonfinite delta-v score");
                }
                result.ranked.add(candidateScore);
                if (result.best == null ||
                    candidateScore.optimizedScoreKmS < result.best.optimizedScoreKmS) {
                    result.best = candidateScore;
                    bestRequest = candidate;
                }
            } catch (RuntimeException ignored) {
                result.skippedCandidates++;
            }
        }

        result.validCandidates = result.ranked.size();
        if (bestRequest == null) {
            throw new IllegalArgumentException("No valid transfer in the selected time window");
        }
        result.ranked.sort(Comparator.comparingDouble(s -> s.flightDays));
        // Re-evaluate only the best candidate with enough output points to plot.
        TransferMath.Request full = new TransferMath.Request();
        full.departurePositionAu = bestRequest.departurePositionAu;
        full.arrivalPositionAu = bestRequest.arrivalPositionAu;
        full.departureVelocityAuPerDay = bestRequest.departureVelocityAuPerDay;
        full.arrivalVelocityAuPerDay = bestRequest.arrivalVelocityAuPerDay;
        full.flightDays = bestRequest.flightDays;
        full.prograde = bestRequest.prograde;
        full.samples = 160;
        result.bestTransfer = TransferMath.solve(full);
        return result;
    }
}
