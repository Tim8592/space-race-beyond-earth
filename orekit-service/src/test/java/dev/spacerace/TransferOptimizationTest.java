package dev.spacerace;

import org.junit.jupiter.api.Test;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class TransferOptimizationTest {

    private TransferMath.Request sample(double days) {
        TransferMath.Request r = new TransferMath.Request();
        r.departurePositionAu = new double[]{1,0,0};
        r.arrivalPositionAu = new double[]{-1.3,0.8,0};
        r.departureVelocityAuPerDay = new double[]{0,0.0172,0};
        r.arrivalVelocityAuPerDay = new double[]{-0.0073,-0.0118,0};
        r.flightDays = days;
        r.prograde = true;
        r.samples = 24;
        return r;
    }

    @Test
    void patchedConicDepartureDeltaVIsNotHyperbolicExcessSpeed() {
        double radiusKm = 6378.1366 + 400;
        double mu = 398600.435507;
        double dvZeroVInfinity = TransferOptimization.circularToHyperbolicDeltaVKmS(0,mu,radiusKm);
        double expected = (Math.sqrt(2)-1) * Math.sqrt(mu/radiusKm);
        assertEquals(expected,dvZeroVInfinity,1e-10);
        double dvAt3 = TransferOptimization.circularToHyperbolicDeltaVKmS(3,mu,radiusKm);
        assertTrue(dvAt3 > dvZeroVInfinity);
        assertTrue(dvAt3 < 3.5);
    }

    @Test
    void choosesMinimumScoreAmongValidFixedDepartureCandidates() {
        TransferOptimization.Request r = new TransferOptimization.Request();
        r.target = "mars";
        r.objective = "total";
        r.earthParkingAltitudeKm = 400;
        r.targetParkingAltitudeKm = 300;
        r.candidates = new ArrayList<>();
        r.candidates.add(sample(260));
        r.candidates.add(sample(300));
        r.candidates.add(sample(340));

        TransferOptimization.Result result = TransferOptimization.optimize(r);
        assertTrue(result.validCandidates >= 1);
        assertEquals(3,result.requestedCandidates);
        assertNotNull(result.best);
        assertNotNull(result.bestTransfer);
        assertEquals(result.best.flightDays,result.bestTransfer.flightDays,0.00001);
        assertEquals(160,result.bestTransfer.trajectoryAu.size());
        assertEquals(result.validCandidates + result.skippedCandidates,result.requestedCandidates);
        for (TransferOptimization.CandidateScore s : result.ranked) {
            assertTrue(s.totalDeltaVKmS >= result.best.totalDeltaVKmS - 1e-8);
            assertEquals(s.departureDeltaVKmS+s.arrivalCaptureDeltaVKmS,s.totalDeltaVKmS,1e-8);
        }
    }

    @Test
    void departureObjectiveMatchesLowestInjectionCost() {
        TransferOptimization.Request r = new TransferOptimization.Request();
        r.target = "mars";
        r.objective = "departure";
        r.candidates = List.of(sample(260),sample(300));
        TransferOptimization.Result result = TransferOptimization.optimize(r);
        for(TransferOptimization.CandidateScore score:result.ranked) {
            assertTrue(score.departureDeltaVKmS >= result.best.departureDeltaVKmS - 1e-8);
        }
    }

    @Test
    void validatesCandidateCountAndTarget() {
        TransferOptimization.Request r = new TransferOptimization.Request();
        r.candidates = List.of();
        assertThrows(IllegalArgumentException.class,()->TransferOptimization.optimize(r));
        r.candidates = List.of(sample(260));
        r.target = "pluto";
        assertThrows(IllegalArgumentException.class,()->TransferOptimization.optimize(r));
    }
}
