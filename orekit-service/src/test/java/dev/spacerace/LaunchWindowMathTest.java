package dev.spacerace;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
class LaunchWindowMathTest {
    private static LaunchWindowMath.Trial trial(String date,double[] end) {
        LaunchWindowMath.Trial t=new LaunchWindowMath.Trial();
        t.departureDate=date;
        t.transfer=new TransferMath.Request();
        t.transfer.departurePositionAu=new double[]{1,0,0};
        t.transfer.arrivalPositionAu=end;
        t.transfer.departureVelocityAuPerDay=new double[]{0,.0172,0};
        t.transfer.arrivalVelocityAuPerDay=new double[]{-.0073,-.0118,0};
        t.transfer.flightDays=260;
        t.transfer.samples=160;
        t.transfer.prograde=true;
        return t;
    }
    @Test void samplesActualLambertTransfersAndPatchedConicBurnsAcrossDepartureDates() {
        LaunchWindowMath.Request r=new LaunchWindowMath.Request();
        r.target="mars";
        r.trials=List.of(trial("2026-11-15",new double[]{-1.3,.8,0}),
          trial("2027-01-15",new double[]{-1.2,.9,0}),
          trial("2027-03-15",new double[]{-1.1,1.0,0}));
        LaunchWindowMath.Result result=LaunchWindowMath.solve(r);
        assertTrue(result.points.size()>=2);
        assertTrue(result.best.requiredDeltaVms>1000);
        for(LaunchWindowMath.Point point:result.points){
            assertEquals(point.totalDeltaVms*1.05,point.requiredDeltaVms,1e-5);
            assertTrue(point.departureBurnMs>0);
            assertTrue(point.arrivalBurnMs>0);
            assertTrue(point.departureC3Km2S2>0);
        }
    }
    @Test void JupiterFlybyDoesNotAddFictionalCaptureBurnAndInvalidInputsRejected() {
        LaunchWindowMath.Request r=new LaunchWindowMath.Request();
        r.target="jupiter";
        r.trials=List.of(trial("2026-11-15",new double[]{-1.3,.8,0}));
        LaunchWindowMath.Result result=LaunchWindowMath.solve(r);
        assertEquals(0,result.points.get(0).arrivalBurnMs);
        r.target="asteroid";
        assertThrows(IllegalArgumentException.class,()->LaunchWindowMath.solve(r));
    }
}
