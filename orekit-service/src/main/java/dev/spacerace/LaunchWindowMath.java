package dev.spacerace;

import java.util.ArrayList;
import java.util.List;
import java.util.Comparator;

/**
 * Sampled launch DATE search at a FIXED mission flight duration.
 * Every trial is a genuine Orekit two-body Lambert solution with approximate
 * JPL planetary states supplied in its TransferMath.Request.
 * This is not a globally optimized departure/arrival porkchop.
 */
public final class LaunchWindowMath {
    private LaunchWindowMath() {}
    public static final class Trial {
        public String departureDate;
        public TransferMath.Request transfer;
    }
    public static final class Request {
        public String target;
        public double earthParkingAltitudeKm=400;
        public double targetParkingAltitudeKm=300;
        public List<Trial> trials;
    }
    public static final class Point {
        public String departureDate;
        public double flightDays;
        public double departureBurnMs;
        public double arrivalBurnMs;
        public double totalDeltaVms;
        public double requiredDeltaVms;
        public double departureC3Km2S2;
    }
    public static final class Result {
        public String model="Orekit IodLambert departure-date scan / fixed flight time";
        public String objective="Ideal patched-conic departure + Mars arrival circularization; Jupiter flyby excludes capture";
        public List<Point> points=new ArrayList<>();
        public Point best;
        public int skipped;
        public String warning="Sampled dates only; no continuous optimizer. JPL approximate planetary states, impulsive zero-revolution Lambert, no ascent, staging, plane changes, low thrust, gravity assists or rigorous launch window.";
    }
    public static Result solve(Request r) {
        if(r==null||r.trials==null||r.trials.isEmpty()||r.trials.size()>80||
           (!"mars".equals(r.target)&&!"jupiter".equals(r.target))||
           !Double.isFinite(r.earthParkingAltitudeKm)||r.earthParkingAltitudeKm<160||r.earthParkingAltitudeKm>100000||
           !Double.isFinite(r.targetParkingAltitudeKm)||r.targetParkingAltitudeKm<150||r.targetParkingAltitudeKm>1000000)
            throw new IllegalArgumentException("Choose Mars/Jupiter with 1–80 valid departure dates and supported parking altitudes");
        Result out=new Result();
        for(Trial trial:r.trials){
            try {
                if(trial==null||trial.departureDate==null||
                   !trial.departureDate.matches("\\d{4}-\\d{2}-\\d{2}")||trial.transfer==null)
                    throw new IllegalArgumentException("Invalid trial");
                TransferMath.Request request=trial.transfer;
                int samples=request.samples;
                request.samples=8;
                TransferMath.Result trajectory;
                try{trajectory=TransferMath.solve(request);}
                finally{request.samples=samples;}
                if(!Double.isFinite(trajectory.propagatedTargetErrorKm)||
                   trajectory.propagatedTargetErrorKm>1000)throw new IllegalArgumentException("Lambert endpoint mismatch");
                double dVdep=TransferOptimization.circularToHyperbolicDeltaVKmS(
                    trajectory.departureVInfinityKmS,398600.435507,
                    6378.1366+r.earthParkingAltitudeKm);
                double dVarr="jupiter".equals(r.target)?0:
                    TransferOptimization.circularToHyperbolicDeltaVKmS(
                        trajectory.arrivalVInfinityKmS,42828.375816,
                        3396.19+r.targetParkingAltitudeKm);
                Point point=new Point();
                point.departureDate=trial.departureDate;
                point.flightDays=trajectory.flightDays;
                point.departureBurnMs=dVdep*1000;
                point.arrivalBurnMs=dVarr*1000;
                point.totalDeltaVms=(dVdep+dVarr)*1000;
                point.requiredDeltaVms=point.totalDeltaVms*1.05;
                point.departureC3Km2S2=trajectory.departureC3Km2S2;
                out.points.add(point);
            }catch(RuntimeException ignored){out.skipped++;}
        }
        if(out.points.isEmpty())throw new IllegalArgumentException("No valid Lambert solutions over this launch-date sample");
        out.points.sort(Comparator.comparing(p->p.departureDate));
        out.best=out.points.stream().min(Comparator.comparingDouble(p->p.requiredDeltaVms)).orElseThrow();
        return out;
    }
}
