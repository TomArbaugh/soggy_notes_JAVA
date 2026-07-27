/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import com.sun.net.httpserver.HttpServer; // JDK embedded HTTP server used to expose REST-like JSON endpoints.
import com.sun.net.httpserver.HttpExchange; // Per-request object carrying method, headers, URI, streams for one client call.
import java.io.IOException; // Checked exception thrown by stream and response operations; declared on handlers and main.
import java.io.InputStream; // Raw request body bytes for POST /api/guess-outcome JSON parsing path.
import java.io.OutputStream; // Response body stream for writing JSON or error payloads back to the client.
import java.net.InetSocketAddress; // Socket address wrapper binding server to a TCP port on all interfaces by default.
import java.net.URI; // Parsed file:// URI helper used when converting stored sample paths back to display note names.
import java.net.URLDecoder; // Decodes percent-encoded path segments from URI filenames into plain Unicode strings.
import java.nio.charset.StandardCharsets; // Explicit UTF-8 charset for JSON bytes and string decoding consistency.
import java.nio.file.Paths; // Builds platform-correct filesystem paths to the Samples directory under user.dir.
import java.util.HashMap; // Mutable map for query parameter pairs and note-name to filename lookup table storage.
import java.util.Map; // Interface type for maps returned by parseQuery and used for NAME_TO_FILE and session storage.
import java.util.UUID; // Generates opaque session identifiers when the client has no prior guess session id string yet.
import java.util.concurrent.ConcurrentHashMap; // Thread-safe map so parallel HTTP handlers never corrupt Guess sessions.
import java.util.regex.Matcher; // Regex search result object for extracting boolean and sessionId substrings from JSON body.
import java.util.regex.Pattern; // Compiled regex constants reused across guess-outcome POST body parsing calls for efficiency.

public class ScaleServer {

    // mode names
    static final String[] MODE_NAMES = {
        "Ionian", "Dorian", "Phrygian", "Lydian",
        "Mixolydian", "Aeolian", "Locrian"
    };

    // disable iPlay because not using Java Media Player
    static final iPlay NO_OP_AUDIO = new iPlay() {
        public void play() {}
        public void stop() {}
        public void setSource(String uri) {}
        public void dispose() {}
        public void setMediaCallBack(Runnable callback) {}
    };

    // maps a new HashMap with simplified names
    static final Map<String, String> NAME_TO_FILE = new HashMap<>();
    static {
        NAME_TO_FILE.put("C",  "C.m4a");
        NAME_TO_FILE.put("C#", "C#-Db.m4a");
        NAME_TO_FILE.put("D",  "D.m4a");
        NAME_TO_FILE.put("D#", "D#-Eb.m4a");
        NAME_TO_FILE.put("E",  "E.m4a");
        NAME_TO_FILE.put("F",  "F.m4a");
        NAME_TO_FILE.put("F#", "F#-Gb.m4a");
        NAME_TO_FILE.put("G",  "G.m4a");
        NAME_TO_FILE.put("G#", "G#-Ab.m4a");
        NAME_TO_FILE.put("A",  "A.m4a");
        NAME_TO_FILE.put("A#", "A#-Bb.m4a");
        NAME_TO_FILE.put("B",  "B.m4a");
    }

    // built into JDK
    /** Session id (from client JSON) → live {@link Guess} for that browser session. */
    private static final Map<String, Guess> GUESS_BY_SESSION = new ConcurrentHashMap<>(); // Opaque client id string keys Guess instances for POST /api/guess-outcome.

    // Help to read JSON sent by the browser (gets the pieces it needs instead of importing whole JSON library)
    private static final Pattern JSON_CORRECT =
        Pattern.compile("\"correct\"\\s*:\\s*(true|false)");
    private static final Pattern JSON_SESSION_ID =
        Pattern.compile("\"sessionId\"\\s*:\\s*\"([^\"]*)\"");

    // Server socket - uses PORT env var for Render, defaults to 8080 for local dev
    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/scales", ScaleServer::handleScales);
        server.createContext("/api/harmonies", ScaleServer::handleHarmonies);
        server.createContext("/api/guess-outcome", ScaleServer::handleGuessOutcome);
        server.createContext("/api/guess-reset", ScaleServer::handleGuessReset);
        server.setExecutor(null);
        server.start();
        System.out.println("ScaleServer running on http://localhost:" + port);
    }

    // loop every mode
    private static void handleScales(HttpExchange exchange) throws IOException {
        // set body as JSON
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Content-Type", "application/json");

        // interprets request
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        // read query string
        Map<String, String> params = parseQuery(exchange.getRequestURI().getQuery());
        String noteName = params.get("key");
        // error handling
        if (noteName == null || !NAME_TO_FILE.containsKey(noteName)) {
            sendError(exchange, 400,
                "Missing or invalid 'key' parameter. Use one of: C, C#, D, D#, E, F, F#, G, G#, A, A#, B");
            return;
        }
        // create uri for scale and get options for guid-tones-only or no-guid-tones
        String keyUri = noteNameToUri(noteName);
        String guideTransform = params.get("guideTransform");
        Integer guideMode = parseGuideModeParam(params.get("guideMode"));
        // build string for writing JSON
        StringBuilder json = new StringBuilder();
        json.append("{\"key\":\"").append(escapeJson(noteName)).append("\",\"scales\":[");
        // build the scales using java classes and serializee them
        for (int mode = 1; mode <= 7; mode++) {
            if (mode > 1) json.append(",");

            Scale scale = new Scale(NO_OP_AUDIO, keyUri, mode);
            applyGuideToneTransformIfRequested(scale, mode, guideTransform, guideMode);

            String quality = scale.mOrM != null ? scale.mOrM.name().toLowerCase() : "unknown";

            json.append("{\"mode\":").append(mode);
            json.append(",\"modeName\":\"").append(MODE_NAMES[mode - 1]).append("\"");
            json.append(",\"quality\":\"").append(quality).append("\"");
            appendNoteNameArray(json, "notes", scale.scale);
            appendNoteNameArray(json, "notesReverse", scale.reverseScale);
            appendNoteNameArray(json, "arpeggioNotes", scale.scaleArpegio);
            appendNoteNameArray(json, "arpeggioNotesReverse", scale.reversScaleArpegio);
            json.append("}");
        }
        // close scale array
        json.append("]}");
        // send http response
        byte[] bytes = json.toString().getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    // helper that adds to JSON array
    /** Append ,\"key\":[\"C\",...] in playback order (high list index first, same as notes). */
    private static void appendNoteNameArray(StringBuilder json, String key, NoteList<String> notes) {
        // add JSON array of notes listed backwards
        json.append(",\"").append(key).append("\":[");
        int len = notes.getLength();
        for (int i = len - 1; i >= 0; i--) {
            if (i < len - 1) json.append(",");
            String name = uriToNoteName(notes.getDataByIndex(i).getData());
            json.append("\"").append(escapeJson(name)).append("\"");
        }
        json.append("]");
    }
    // build interval table used later for harmonies
    static final String[] DEGREE_NAMES = {
        "", "", "2nd", "3rd", "4th", "5th", "6th", "7th"
    };

    // set QUALITY correctly
    private static Quality[] qualitiesForHarmonyDegree(int degree) {
        if (degree == 4 || degree == 5) {
            return new Quality[] { Quality.PERFECT };
        }
        return new Quality[] { Quality.MINOR, Quality.MAJOR };
    }

    private static void handleHarmonies(HttpExchange exchange) throws IOException {
        // set headers
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        // error handling
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.sendResponseHeaders(204, -1);
            return;
        }
        // parse query string
        Map<String, String> params = parseQuery(exchange.getRequestURI().getQuery());
        String noteName = params.get("key");
        // validate key / error handling
        if (noteName == null || !NAME_TO_FILE.containsKey(noteName)) {
            sendError(exchange, 400,
                "Missing or invalid 'key' parameter. Use one of: C, C#, D, D#, E, F, F#, G, G#, A, A#, B");
            return;
        }
        // create uri (add base)
        String keyUri = noteNameToUri(noteName);
        // build JSON string
        StringBuilder json = new StringBuilder();
        json.append("{\"key\":\"").append(escapeJson(noteName)).append("\"");
        json.append(",\"root\":\"").append(escapeJson(noteName)).append("\"");
        json.append(",\"intervals\":[");

        // build interval row using Harmony class and create JSON
        boolean first = true;
        for (int degree = 2; degree <= 7; degree++) {
            for (Quality quality : qualitiesForHarmonyDegree(degree)) {
                if (!first) json.append(",");
                first = false;

                Harmony harmony = new Harmony(NO_OP_AUDIO, keyUri, degree, quality);
                String note = extractNote(harmony.note);
                String qName = quality.name().toLowerCase();

                json.append("{\"degree\":").append(degree);
                json.append(",\"name\":\"").append(DEGREE_NAMES[degree]).append("\"");
                json.append(",\"quality\":\"").append(qName).append("\"");
                json.append(",\"note\":\"").append(escapeJson(note)).append("\"}");
            }
        }
        // put closing characters on JSON
        json.append("]}");
        // Send response
        byte[] bytes = json.toString().getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void handleGuessOutcome(HttpExchange exchange) throws IOException {
        // create headers
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        // allow headers / do error handling
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.sendResponseHeaders(204, -1);
            return;
        }
        // only POST crud action allowed for this one
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendError(exchange, 405, "Method not allowed");
            return;
        }
        // whole request body as JSON string / error handling
        String body = readRequestBody(exchange);
        Boolean correct = parseJsonCorrect(body);
        if (correct == null) {
            sendError(exchange, 400, "JSON body must include \"correct\": true or false");
            return;
        }
        // create to guess object if one does not exist
        String sid = parseJsonSessionId(body);
        if (sid == null || sid.isEmpty() || !GUESS_BY_SESSION.containsKey(sid)) {
            sid = UUID.randomUUID().toString();
            GUESS_BY_SESSION.put(sid, new Guess());
        }
        // keep score
        Guess g = GUESS_BY_SESSION.get(sid);
        if (correct) {
            g.correct();
        } else {
            g.inCorrect();
        }
        // keep track of score
        int wins = g.wins();
        int guesses = wins + g.losses();
        // string formating for JSON
        String json = "{\"sessionId\":\"" + escapeJson(sid) + "\",\"wins\":" + wins
            + ",\"guesses\":" + guesses + "}";
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void handleGuessReset(HttpExchange exchange) throws IOException {
        // headers
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        // allowed methods and error handling
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.sendResponseHeaders(204, -1);
            return;
        }
        // POST only
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendError(exchange, 405, "Method not allowed");
            return;
        }
        // read JSON and parse
        String body = readRequestBody(exchange);
        String sid = parseJsonSessionId(body);
        if (sid == null || sid.isEmpty() || !GUESS_BY_SESSION.containsKey(sid)) {
            sid = UUID.randomUUID().toString();
            GUESS_BY_SESSION.put(sid, new Guess());
        } else {
            GUESS_BY_SESSION.get(sid).reset();
        }
        // Build JSON response and send it
        String json = "{\"sessionId\":\"" + escapeJson(sid) + "\",\"wins\":0,\"guesses\":0}";
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    // read guidMode (from query string) and returns mode or null
    /** @return null if missing or not in 1..7 */
    private static Integer parseGuideModeParam(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try {
            int m = Integer.parseInt(raw);
            if (m < 1 || m > 7) return null;
            return m;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // use scale methods to remove guid tones or remove everything but guid tones
    /** Delegates to {@link Scale}; does not duplicate interval or degree math in ScaleServer. */
    private static void applyGuideToneTransformIfRequested(Scale scale, int mode, String guideTransform, Integer guideMode) {
        if (guideTransform == null || guideMode == null || mode != guideMode) return;
        if ("destroy".equalsIgnoreCase(guideTransform)) {
            scale.removeGuidTones();
        } else if ("win".equalsIgnoreCase(guideTransform) || "only".equalsIgnoreCase(guideTransform)) {
            scale.onlyGuidTones();
        }
    }

    // converts POST body for JSON parsing
    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    // returns if JSON correct or not (null)
    /** @return null if missing or invalid */
    private static Boolean parseJsonCorrect(String body) {
        if (body == null) {
            return null;
        }
        Matcher m = JSON_CORRECT.matcher(body);
        if (!m.find()) {
            return null;
        }
        return Boolean.parseBoolean(m.group(1));
    }

    // searches for session id
    /** @return null if key absent; empty string if explicitly "" */
    private static String parseJsonSessionId(String body) {
        if (body == null) {
            return null;
        }
        Matcher m = JSON_SESSION_ID.matcher(body);
        if (!m.find()) {
            return null;
        }
        return m.group(1);
    }

    // converts note name uri to simple name to make it easier to conver to JSON (list to uir to label)
    private static String extractNote(NoteList<String> list) {
        try {
            return uriToNoteName(list.getDataByIndex(0).getData());
        } catch (Exception e) {
            return "?";
        }
    }

    // turns note label back into uri string
    private static String noteNameToUri(String noteName) {
        String filename = NAME_TO_FILE.get(noteName);
        if (filename == null) return noteName;
        return Paths.get(System.getProperty("user.dir"), "Samples", filename)
                     .toUri().toString();
    }

    // changes sample with uri to short note name (string to label)
    private static String uriToNoteName(String uriString) {
        try {
            String path = URI.create(uriString).getPath();
            String filename = path.substring(path.lastIndexOf('/') + 1);
            filename = URLDecoder.decode(filename, StandardCharsets.UTF_8);
            filename = filename.replace(".m4a", "");
            int dash = filename.indexOf('-');
            if (dash > 0) filename = filename.substring(0, dash);
            return filename;
        } catch (Exception e) {
            return uriString;
        }
    }

    // decode keys and values with map (from string query that you would see in url)
    private static Map<String, String> parseQuery(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null) return params;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
            String val = kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
            params.put(key, val);
        }
        return params;
    }

    // for slash formatting in JSON
    private static String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    // standardized JSON error response
    private static void sendError(HttpExchange exchange, int code, String msg) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        byte[] bytes = ("{\"error\":\"" + escapeJson(msg) + "\"}").getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
