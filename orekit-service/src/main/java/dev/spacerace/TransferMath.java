package dev.spacerace;

import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.orekit.estimation.iod.IodLambert;
import org.orekit.frames.Frame;
import org.orekit.frames.FramesFactory;
import org.orekit.orbits.Orbit;
import org.orekit.propagation.analytical.KeplerianPropagator;
import org.orekit.time.AbsoluteDate;

import java.util.ArrayList;
import java.util.List;

/**
 * Impulsive two-body Sun-centered Lambert trajectory.
 * Input planetary vectors are JPL approximate ecliptic-of-J2000
 * coordinates in AU and AU/day; velocity estimates are client supplied.
 * Coordinates are rotated into EME2000 before handing to Orekit.
 *
 * Not a finite-thrust solution. Departure/arrival v-infinity are
 * not launch vehicle delta-V or capture burns.
 */
public final class TransferMath {
    private TransferMath() {}

    public static final double AU_METERS = 149_597_870_700.0;
    public static final double SUN_MU_M3S2 = 1.32712440018e20;
    private static final double SECONDS_PER_DAY = 86400.0;
    private static final double OBLIQUITY = Math.toRadians(23.439291111);
    private static final double COS_EPS = Math.cos(OBLIQUITY);
    private static final double SIN_EPS = Math.sin(OBLIQUITY);

    public static final class Request {
        public double[] departurePositionAu;
        public double[] arrivalPositionAu;
        public double[] departureVelocityAuPerDay;
        public double[] arrivalVelocityAuPerDay;
        public double flightDays;
        public boolean prograde = true;
        public int samples = 128;
    }

    public static final class Result {
        public final String solver = "Orekit 13.1.9 / IodLambert / KeplerianPropagator";
        public final String trajectoryModel = "Sun-centered two-body impulsive Lambert arc; no gravity assist or finite thrust";
        public double flightDays;
        public double departureVInfinityKmS;
        public double arrivalVInfinityKmS;
        public double departureC3Km2S2;
        public double propagatedTargetErrorKm;
        public double semimajorAxisAu;
        public double eccentricity;
        public List<double[]> trajectoryAu = new ArrayList<>();
        public String[] limitations = {
            "The planetary position and velocity inputs use JPL approximate elements, not Horizons ephemerides.",
            "V-infinity is relative to the heliocentric planetary velocity, not launch-injection delta-v.",
            "No departure from parking orbit, capture burn, low-thrust acceleration, solar power limits, eclipse, flyby or n-body perturbations.",
            "This solver must not be used to certify a flight trajectory."
        };
    }

    private static void validateVector(String name, double[] v) {
        if (v == null || v.length != 3) throw new IllegalArgumentException(name + " must contain x,y,z");
        for (double x : v) if (!Double.isFinite(x)) {
            throw new IllegalArgumentException(name + " contains a nonfinite coordinate");
        }
    }

    private static Vector3D toEquatorial(double[] ecliptic, double scale) {
        return new Vector3D(
                ecliptic[0] * scale,
                (ecliptic[1] * COS_EPS - ecliptic[2] * SIN_EPS) * scale,
                (ecliptic[1] * SIN_EPS + ecliptic[2] * COS_EPS) * scale
        );
    }

    private static double[] toEclipticAu(Vector3D equatorial) {
        return new double[]{
            equatorial.getX() / AU_METERS,
            (equatorial.getY() * COS_EPS + equatorial.getZ() * SIN_EPS) / AU_METERS,
            (-equatorial.getY() * SIN_EPS + equatorial.getZ() * COS_EPS) / AU_METERS
        };
    }

    public static Result solve(Request request) {
        if (request == null) throw new IllegalArgumentException("Missing transfer request");
        validateVector("departurePositionAu",request.departurePositionAu);
        validateVector("arrivalPositionAu",request.arrivalPositionAu);
        validateVector("departureVelocityAuPerDay",request.departureVelocityAuPerDay);
        validateVector("arrivalVelocityAuPerDay",request.arrivalVelocityAuPerDay);
        if (!Double.isFinite(request.flightDays) || request.flightDays < 3 || request.flightDays > 3000 ||
                request.samples < 8 || request.samples > 500) {
            throw new IllegalArgumentException("Flight duration must be 3–3000 days and samples must be 8–500");
        }
        final double dt = request.flightDays * SECONDS_PER_DAY;
        final Vector3D p1 = toEquatorial(request.departurePositionAu,AU_METERS);
        final Vector3D p2 = toEquatorial(request.arrivalPositionAu,AU_METERS);
        final Vector3D planetV1 = toEquatorial(request.departureVelocityAuPerDay,AU_METERS / SECONDS_PER_DAY);
        final Vector3D planetV2 = toEquatorial(request.arrivalVelocityAuPerDay,AU_METERS / SECONDS_PER_DAY);

        if (p1.getNorm() < 0.2 * AU_METERS || p2.getNorm() < 0.2 * AU_METERS ||
                p1.getNorm() > 45 * AU_METERS || p2.getNorm() > 45 * AU_METERS) {
            throw new IllegalArgumentException("Only heliocentric 0.2–45 AU endpoints supported");
        }

        // EME2000 inertial reference; synthetic dates avoid requiring external
        // Orekit leap-second/EOP data for this pure two-body demonstration.
        final Frame frame = FramesFactory.getEME2000();
        final AbsoluteDate start = AbsoluteDate.J2000_EPOCH;
        final AbsoluteDate end = start.shiftedBy(dt);

        final Orbit transfer = new IodLambert(SUN_MU_M3S2).estimate(
                frame, request.prograde, 0, p1, start, p2, end
        );
        if (transfer == null) throw new IllegalArgumentException("Orekit could not find a Lambert solution");
        final KeplerianPropagator propagator = new KeplerianPropagator(transfer);
        final Vector3D launchV = transfer.getPVCoordinates().getVelocity();
        final Vector3D arrivalV = propagator.propagate(end).getPVCoordinates().getVelocity();
        final Vector3D achieved = propagator.propagate(end).getPVCoordinates().getPosition();

        final Result result = new Result();
        result.flightDays = request.flightDays;
        result.departureVInfinityKmS = Vector3D.distance(launchV,planetV1) / 1000;
        result.arrivalVInfinityKmS = Vector3D.distance(arrivalV,planetV2) / 1000;
        result.departureC3Km2S2 = Math.pow(result.departureVInfinityKmS,2);
        result.propagatedTargetErrorKm = Vector3D.distance(achieved,p2) / 1000;
        result.semimajorAxisAu = transfer.getA() / AU_METERS;
        result.eccentricity = transfer.getE();

        for (int i=0;i<request.samples;i++) {
            final double fraction = i / (double)(request.samples-1);
            final Vector3D point = propagator.propagate(start.shiftedBy(dt*fraction))
                    .getPVCoordinates().getPosition();
            result.trajectoryAu.add(toEclipticAu(point));
        }
        return result;
    }
}
