package dev.spacerace;

import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.orekit.frames.FramesFactory;
import org.orekit.orbits.KeplerianOrbit;
import org.orekit.orbits.PositionAngleType;
import org.orekit.propagation.analytical.KeplerianPropagator;
import org.orekit.time.AbsoluteDate;

import java.util.ArrayList;
import java.util.List;

/**
 * Orekit-generated Earth-centered two-body state history. This is not an
 * atmosphere/J2/third-body numerical propagator and not a lunar encounter
 * or landing solver. No external orekit-data EOP dataset required.
 */
public final class EarthOrbitMath {
    private EarthOrbitMath() {}
    public static final double MU_EARTH_M3S2=3.98600435507e14;
    public static final double EARTH_RADIUS_KM=6378.137;
    public static final class Request {
        public double perigeeAltitudeKm;
        public double eccentricity;
        public double argumentPeriapsisDeg = 0;
        public double inclinationDeg = 0;
        public boolean halfOrbit=false;
        public int samples=181;
    }
    public static final class Result {
        public String model="Orekit 13.1.9 / KeplerianPropagator / Earth-centered two-body";
        public double periodMinutes;
        public double propagatedMinutes;
        public double perigeeRadiusKm;
        public double apogeeRadiusKm;
        public double perigeeSpeedKmS;
        public double apogeeSpeedKmS;
        public List<double[]> trajectoryKm=new ArrayList<>();
        public String limitation="Earth gravity only; no J2/drag, lunar third-body gravity, eclipse, capture or finite thrust.";
    }
    public static Result solve(Request request) {
        if(request==null)throw new IllegalArgumentException("Orbit propagation request missing");
        if(!Double.isFinite(request.perigeeAltitudeKm)||request.perigeeAltitudeKm<150||
           request.perigeeAltitudeKm>100000||!Double.isFinite(request.eccentricity)||
           request.eccentricity<0||request.eccentricity>=0.985||
           !Double.isFinite(request.argumentPeriapsisDeg)||
           !Double.isFinite(request.inclinationDeg)||Math.abs(request.inclinationDeg)>180||
           request.samples<20||request.samples>500)
            throw new IllegalArgumentException("Invalid Earth Keplerian orbit elements or sample count");

        final double rp=(EARTH_RADIUS_KM+request.perigeeAltitudeKm)*1000;
        final double a=rp/(1-request.eccentricity);
        final double ra=a*(1+request.eccentricity);
        final AbsoluteDate start=AbsoluteDate.J2000_EPOCH;
        final KeplerianOrbit initial=new KeplerianOrbit(a,request.eccentricity,
          Math.toRadians(request.inclinationDeg),
          Math.toRadians(request.argumentPeriapsisDeg),0,0,
          PositionAngleType.TRUE,FramesFactory.getEME2000(),start,MU_EARTH_M3S2);
        final KeplerianPropagator propagation=new KeplerianPropagator(initial);
        final double periodMinutes=2*Math.PI*Math.sqrt(a*a*a/MU_EARTH_M3S2)/60;
        final double durationMinutes=periodMinutes*(request.halfOrbit?0.5:1);
        final Result out=new Result();
        out.periodMinutes=periodMinutes;
        out.propagatedMinutes=durationMinutes;
        out.perigeeRadiusKm=rp/1000;
        out.apogeeRadiusKm=ra/1000;
        out.perigeeSpeedKmS=Math.sqrt(MU_EARTH_M3S2*(2/rp-1/a))/1000;
        out.apogeeSpeedKmS=Math.sqrt(MU_EARTH_M3S2*(2/ra-1/a))/1000;
        for(int i=0;i<request.samples;i++){
            final double elapsedSeconds=60*durationMinutes*i/(request.samples-1.0);
            final Vector3D point=propagation.propagate(start.shiftedBy(elapsedSeconds))
                .getPVCoordinates().getPosition();
            out.trajectoryKm.add(new double[]{
                point.getX()/1000,point.getY()/1000,point.getZ()/1000});
        }
        return out;
    }
}
