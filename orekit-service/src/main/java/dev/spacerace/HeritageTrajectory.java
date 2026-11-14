package dev.spacerace;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * One-click historical spacecraft trajectory retrieval from NASA/JPL Horizons.
 *
 * ON-DEMAND ONLY: whitelist missions, fixed bounded dates/step, 12-hour cache,
 * never run this on each animation tick. No API call from the React browser.
 * JPL ephemerides may be unavailable for certain mission dates.
 */
public final class HeritageTrajectory {
    private HeritageTrajectory() {}

    public static final class MissionConfig {
        public final String id;
        public final String naifId;
        public final String start;
        public final String stop;
        public final int stepDays;
        MissionConfig(String id, String naifId, String start, String stop, int stepDays) {
            this.id=id;this.naifId=naifId;this.start=start;this.stop=stop;this.stepDays=stepDays;
        }
    }

    public static final class Point {
        public String date;
        public double xAu;
        public double yAu;
        public double zAu;
        Point(String date, double xAu, double yAu, double zAu) {
            this.date=date;this.xAu=xAu;this.yAu=yAu;this.zAu=zAu;
        }
    }

    public static final class Result {
        public String mission;
        public String naifId;
        public String source = "NASA/JPL Horizons spacecraft ephemeris";
        public String sourceUrl = "https://ssd.jpl.nasa.gov/horizons/";
        public String referencePlane = "ecliptic";
        public String origin = "Sun center (500@10)";
        public String units = "AU (geometric positions)";
        public String sampling = "Sparse historical snapshots; connect samples for visualization only";
        public List<Point> points;
        public String caution = "Spacecraft ephemeris reconstruction/prediction varies by epoch. 2D ecliptic projection omits vertical displacement and between-sample maneuvers.";
    }

    private static final Map<String,MissionConfig> MISSIONS=Map.of(
        "dawn",new MissionConfig("dawn","-203","2007-09-28","2018-10-31",60),
        "psyche",new MissionConfig("psyche","-255","2023-10-14","2026-11-01",30),
        "new-horizons",new MissionConfig("new-horizons","-98","2006-01-20","2019-01-03",90),
        "voyager",new MissionConfig("voyager","-31","1977-09-06","1990-01-01",90)
    );
    private static final HttpClient CLIENT=HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NORMAL).build();
    private static final ObjectMapper JSON=new ObjectMapper();
    private static final long TTL_MS=12*60*60*1000L;
    private static final class Cached {
        Result result; long cachedAt;
        Cached(Result result){this.result=result;this.cachedAt=System.currentTimeMillis();}
    }
    private static final ConcurrentHashMap<String,Cached> CACHE=new ConcurrentHashMap<>();

    private static String encode(String value){
        return URLEncoder.encode(value,StandardCharsets.UTF_8);
    }

    public static String horizonsUrl(MissionConfig c) {
        String[][] entries={
            {"format","json"},
            {"COMMAND","'"+c.naifId+"'"},
            {"OBJ_DATA","'NO'"},
            {"MAKE_EPHEM","'YES'"},
            {"EPHEM_TYPE","'VECTORS'"},
            {"CENTER","'500@10'"},
            {"START_TIME","'"+c.start+"'"},
            {"STOP_TIME","'"+c.stop+"'"},
            {"STEP_SIZE","'"+c.stepDays+" d'"},
            {"REF_PLANE","'ECLIPTIC'"},
            {"OUT_UNITS","'AU-D'"},
            {"VEC_TABLE","'1'"},
            {"CSV_FORMAT","'YES'"},
            {"VEC_CORR","'NONE'"}
        };
        StringBuilder sb=new StringBuilder("https://ssd.jpl.nasa.gov/api/horizons.api?");
        for(int i=0;i<entries.length;i++){
            if(i!=0)sb.append('&');
            sb.append(encode(entries[i][0])).append('=').append(encode(entries[i][1]));
        }
        return sb.toString();
    }

    private static final Pattern DATE=Pattern.compile(
        "(\\d{4})-([A-Za-z]{3})-(\\d{1,2})");
    private static final Pattern XYZ=Pattern.compile(
        "X\\s*=\\s*([+-]?[\\d.Ee+-]+).*?Y\\s*=\\s*([+-]?[\\d.Ee+-]+).*?Z\\s*=\\s*([+-]?[\\d.Ee+-]+)");
    private static final Map<String,String> MONTHS=Map.ofEntries(
        Map.entry("JAN","01"),Map.entry("FEB","02"),Map.entry("MAR","03"),
        Map.entry("APR","04"),Map.entry("MAY","05"),Map.entry("JUN","06"),
        Map.entry("JUL","07"),Map.entry("AUG","08"),Map.entry("SEP","09"),
        Map.entry("OCT","10"),Map.entry("NOV","11"),Map.entry("DEC","12")
    );

    private static String parseDate(String line) {
        Matcher m=DATE.matcher(line);
        if(!m.find())return null;
        String month=MONTHS.get(m.group(2).toUpperCase(Locale.ROOT));
        return month==null?null:m.group(1)+"-"+month+"-"+String.format("%02d",Integer.parseInt(m.group(3)));
    }

    /** Parse either comma-separated Horizons vectors or standard X/Y/Z lines. */
    public static List<Point> parseHorizonsTable(String text) {
        int first=text.indexOf("$$SOE"),last=text.indexOf("$$EOE");
        if(first<0||last<first)throw new IllegalArgumentException(
            "Horizons did not return spacecraft vectors for this date interval");
        List<Point> points=new ArrayList<>();
        String currentDate=null;
        for(String line:text.substring(first+5,last).split("\\R")){
            String date=parseDate(line);
            if(date!=null)currentDate=date;
            if(currentDate==null)continue;
            String[] columns=line.split(",");
            if(columns.length>=5 && date!=null){
                try {
                    double x=Double.parseDouble(columns[2].trim());
                    double y=Double.parseDouble(columns[3].trim());
                    double z=Double.parseDouble(columns[4].trim());
                    if(Double.isFinite(x)&&Double.isFinite(y)&&Double.isFinite(z)){
                        points.add(new Point(date,x,y,z));
                        continue;
                    }
                }catch(NumberFormatException ignored){}
            }
            Matcher xyz=XYZ.matcher(line);
            if(xyz.find()){
                try {
                    double x=Double.parseDouble(xyz.group(1));
                    double y=Double.parseDouble(xyz.group(2));
                    double z=Double.parseDouble(xyz.group(3));
                    if(Double.isFinite(x)&&Double.isFinite(y)&&Double.isFinite(z)){
                        points.add(new Point(currentDate,x,y,z));
                    }
                }catch(NumberFormatException ignored){}
            }
        }
        if(points.size()<2)throw new IllegalArgumentException(
            "Could not parse enough sampled NASA spacecraft coordinates");
        return points;
    }

    public static Result load(String id) throws Exception {
        MissionConfig mission=MISSIONS.get(id);
        if(mission==null)throw new IllegalArgumentException("Unknown heritage mission");
        Cached cached=CACHE.get(id);
        if(cached!=null && System.currentTimeMillis()-cached.cachedAt<TTL_MS)return cached.result;
        final HttpRequest request=HttpRequest.newBuilder(URI.create(horizonsUrl(mission)))
            .timeout(Duration.ofSeconds(25)).GET().build();
        final HttpResponse<String> remote=CLIENT.send(request,HttpResponse.BodyHandlers.ofString());
        if(remote.statusCode()!=200 || remote.body().length()>1_000_000) {
            throw new IllegalArgumentException("NASA Horizons is unavailable for this mission/date range");
        }
        JsonNode payload=JSON.readTree(remote.body());
        String table=payload.path("result").asText("");
        Result result=new Result();
        result.mission=id;
        result.naifId=mission.naifId;
        result.points=parseHorizonsTable(table);
        CACHE.put(id,new Cached(result));
        return result;
    }
}
