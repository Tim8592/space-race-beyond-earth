package dev.spacerace;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TransferMathTest {
    private TransferMath.Request sample() {
        TransferMath.Request r = new TransferMath.Request();
        r.departurePositionAu = new double[]{1,0,0};
        r.arrivalPositionAu = new double[]{-1.3,0.8,0};
        r.departureVelocityAuPerDay = new double[]{0,0.0172,0};
        r.arrivalVelocityAuPerDay = new double[]{-0.0073,-0.0118,0};
        r.flightDays = 260;
        r.prograde = true;
        r.samples = 48;
        return r;
    }

    @Test
    void computesAndPropagatesLambertTransferBetweenTwoPositions() {
        TransferMath.Result result = TransferMath.solve(sample());
        assertEquals(48,result.trajectoryAu.size());
        assertTrue(Double.isFinite(result.departureVInfinityKmS));
        assertTrue(Double.isFinite(result.arrivalVInfinityKmS));
        assertTrue(result.departureVInfinityKmS > 0);
        assertTrue(result.arrivalVInfinityKmS > 0);
        assertTrue(result.propagatedTargetErrorKm < 500,"Target endpoint must be reached: "+result.propagatedTargetErrorKm+" km");
        assertEquals(1,result.trajectoryAu.get(0)[0],1e-4);
        assertEquals(-1.3,result.trajectoryAu.get(47)[0],1e-4);
        assertEquals(0.8,result.trajectoryAu.get(47)[1],1e-4);
    }

    @Test
    void rejectsInvalidMissionParameters() {
        TransferMath.Request badDuration = sample();
        badDuration.flightDays = -5;
        assertThrows(IllegalArgumentException.class,()->TransferMath.solve(badDuration));
        TransferMath.Request tooMany = sample();
        tooMany.samples=501;
        assertThrows(IllegalArgumentException.class,()->TransferMath.solve(tooMany));
    }
}
