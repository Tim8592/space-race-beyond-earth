package dev.spacerace;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class HeritageTrajectoryTest {
    @Test
    void parsesCsvEphemeridesFromHorizonsWithSourceDates() {
        String table="header\n$$SOE\n"
            +"2458000.5, A.D. 2017-Sep-04 00:00:00.0000, 1.250E+00, -2.5E+00, 0.02,\n"
            +"2458060.5, A.D. 2017-Nov-03 00:00:00.0000, 1.260E+00, -2.4E+00, 0.03,\n"
            +"$$EOE\n";
        List<HeritageTrajectory.Point> points=HeritageTrajectory.parseHorizonsTable(table);
        assertEquals(2,points.size());
        assertEquals("2017-09-04",points.get(0).date);
        assertEquals(1.25,points.get(0).xAu,1e-9);
        assertEquals(-2.4,points.get(1).yAu,1e-9);
    }
    @Test
    void handlesClassicalHorizonsPositionFormatWithoutCsv() {
        String table="$$SOE\n"
            +"2458000.5 = A.D. 2017-Sep-04 00:00:00.0000\n"
            +" X =1.5E+00 Y =-2.5E+00 Z = 0.2\n"
            +"2458060.5 = A.D. 2017-Nov-03 00:00:00.0000\n"
            +" X =1.6E+00 Y =-2.4E+00 Z = 0.3\n"
            +"$$EOE";
        List<HeritageTrajectory.Point> points=HeritageTrajectory.parseHorizonsTable(table);
        assertEquals(2,points.size());
        assertEquals(0.3,points.get(1).zAu,1e-9);
    }
    @Test
    void rejectsUnknownOrMissingTable() {
        assertThrows(IllegalArgumentException.class,
            ()->HeritageTrajectory.parseHorizonsTable("No vectors"));
    }
}
