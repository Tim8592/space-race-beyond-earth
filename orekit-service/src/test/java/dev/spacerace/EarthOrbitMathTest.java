package dev.spacerace;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EarthOrbitMathTest {
    @Test void lowEarthOrbitClosesAndHasExpectedPeriodAndSpeed() {
        EarthOrbitMath.Request req=new EarthOrbitMath.Request();
        req.perigeeAltitudeKm=400;
        req.eccentricity=0;
        req.samples=121;
        EarthOrbitMath.Result result=EarthOrbitMath.solve(req);
        assertEquals(121,result.trajectoryKm.size());
        assertTrue(result.periodMinutes>90&&result.periodMinutes<95);
        assertTrue(result.perigeeSpeedKmS>7.5&&result.perigeeSpeedKmS<8.0);
        assertArrayEquals(result.trajectoryKm.get(0),result.trajectoryKm.get(120),1e-4);
    }
    @Test void lunarDistanceTransferReachesApogeeInPhysicalTwoBodyTime() {
        EarthOrbitMath.Request req=new EarthOrbitMath.Request();
        req.perigeeAltitudeKm=400;
        double rp=EarthOrbitMath.EARTH_RADIUS_KM+req.perigeeAltitudeKm;
        req.eccentricity=(384400-rp)/(384400+rp);
        req.argumentPeriapsisDeg=52;
        req.halfOrbit=true;
        req.samples=161;
        EarthOrbitMath.Result result=EarthOrbitMath.solve(req);
        assertEquals(161,result.trajectoryKm.size());
        assertEquals(384400,result.apogeeRadiusKm,2e-4);
        assertTrue(result.propagatedMinutes>4*1440&&result.propagatedMinutes<7*1440);
        double[] end=result.trajectoryKm.get(160);
        assertEquals(384400,Math.hypot(end[0],Math.hypot(end[1],end[2])),0.1);
        assertTrue(result.perigeeSpeedKmS>result.apogeeSpeedKmS);
    }
    @Test void invalidOrUnboundedInputRejected() {
        EarthOrbitMath.Request request=new EarthOrbitMath.Request();
        request.perigeeAltitudeKm=0;
        assertThrows(IllegalArgumentException.class,()->EarthOrbitMath.solve(request));
        request.perigeeAltitudeKm=400;
        request.eccentricity=.99999;
        assertThrows(IllegalArgumentException.class,()->EarthOrbitMath.solve(request));
        request.eccentricity=.2;
        request.samples=1000;
        assertThrows(IllegalArgumentException.class,()->EarthOrbitMath.solve(request));
    }
}
